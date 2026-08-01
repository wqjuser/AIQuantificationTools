from __future__ import annotations

import json
import math
import re
import time
from collections import Counter
from collections.abc import Callable, Iterator, Mapping, Sequence
from concurrent.futures import (
    Future,
    ThreadPoolExecutor,
    TimeoutError as FutureTimeoutError,
    wait,
)
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from quant_core.ai_review_providers import (
    AiReviewProviderError,
    AiReviewProviderRegistry,
    contains_prohibited_output,
)
from quant_core.ai_review_stage3 import (
    assert_external_evidence_safe,
    contains_ai_review_secret_text,
)
from quant_core.audit_events import AuditEventStore
from quant_core.canonical import canonical_sha256, normalize_snapshot_bars
from quant_core.data_foundation import market_data_gap_count
from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar
from quant_core.indicators import rsi, sma
from quant_core.market_discovery import MarketDiscoveryQuery
from quant_core.market_information import MarketInformationQuery
from quant_core.market_calendar import build_market_calendar_status
from quant_core.runs import ResearchRunAudit, ResearchRunStore
from quant_core.sec_edgar import is_valid_sec_edgar_user_agent


_REQUEST_FIELDS = frozenset(
    {
        "market",
        "universeMode",
        "discovery",
        "profile",
        "horizon",
        "providerId",
        "externalDataApproved",
    }
)
_RESEARCH_ORIGIN_FIELDS = frozenset({"selectionId", "candidateEvidenceId"})
_DISCOVERY_FIELDS = frozenset(
    {
        "query",
        "minChangePct",
        "maxChangePct",
        "minAmount",
        "minTurnoverRate",
        "maxPe",
        "sort",
        "direction",
    }
)
_MARKETS = frozenset({"ashare", "crypto", "us"})
_PROVIDERS = frozenset({"local", "openai", "openai-compatible", "ollama"})
_HORIZONS = frozenset({"short", "medium", "long"})
_STOCK_PROFILES = frozenset({"balanced", "quality_growth", "value", "trend"})
_CRYPTO_PROFILES = frozenset({"balanced", "trend"})
_AI_TIERS = frozenset({"priority_research", "watch", "insufficient_evidence"})
_HAN_TEXT = re.compile(r"[\u3400-\u9fff]")
_FORBIDDEN_AI_FIELDS = frozenset(
    {
        "buy",
        "sell",
        "side",
        "position",
        "positionPct",
        "quantity",
        "targetPrice",
        "stopPrice",
        "order",
        "returnGuarantee",
    }
)
_INITIAL_CANDIDATE_LIMIT = 100
_EVIDENCE_CANDIDATE_LIMIT = 20
_RECOMMENDATION_LIMIT = 5
_DAILY_BAR_COUNT = 180
_EVIDENCE_BUDGET_SECONDS = 20.0
_STOCK_FUNDAMENTAL_TTL = timedelta(hours=24)
_STOCK_FUNDAMENTAL_MAX_AGE = timedelta(days=400)
_STOCK_SHARES_MAX_PERIOD_DISTANCE = timedelta(days=180)
_CRYPTO_FUNDAMENTAL_TTL = timedelta(minutes=5)
_MARKET_SNAPSHOT_FRESHNESS = timedelta(minutes=5)
_US_QUOTE_FRESHNESS = _MARKET_SNAPSHOT_FRESHNESS
_QUALITY_STATISTICS_PROFILES = ("balanced", "quality_growth", "value", "trend")
_SELECTION_SCHEMA_VERSION = 2
_REVIEW_SCHEMA_VERSION = 2


def resolve_market_ai_selection_research_evidence(
    value: object,
    *,
    audit_store: AuditEventStore,
    market: str,
    symbol: str,
    timeframe: str,
) -> dict[str, Any] | None:
    if value is None:
        return None
    if not isinstance(value, Mapping) or set(value) != _RESEARCH_ORIGIN_FIELDS:
        raise ValueError("market_ai_selection_origin_invalid")

    selection_id = _required_research_origin_text(value, "selectionId")
    evidence_id = _required_research_origin_text(value, "candidateEvidenceId")
    audit_event_id = f"market-ai-selection-{selection_id}"
    try:
        record = audit_store.get(audit_event_id)
    except Exception as error:
        raise MarketAiSelectionError(
            "market_ai_selection_audit_unavailable",
            503,
            "AI 选股审计存储暂不可用。",
        ) from error
    if record is None or record.event_type != "market_ai_selection":
        raise ValueError("market_ai_selection_origin_not_found")

    artifact = record.metadata.get("artifact")
    schema_version = artifact.get("schemaVersion") if isinstance(artifact, Mapping) else None
    if (
        not isinstance(artifact, Mapping)
        or type(schema_version) is not int
        or schema_version not in {1, _SELECTION_SCHEMA_VERSION}
        or artifact.get("recordType") != "aiqt.marketAiSelection"
        or not _market_ai_selection_id_matches_artifact(selection_id, artifact)
    ):
        raise ValueError("market_ai_selection_origin_invalid")
    artifact_without_hash = {key: item for key, item in artifact.items() if key != "recordHash"}
    record_hash = str(artifact.get("recordHash") or "").strip()
    if not record_hash or record_hash != canonical_sha256(artifact_without_hash):
        raise ValueError("market_ai_selection_origin_hash_invalid")

    request = artifact.get("request")
    result = artifact.get("result")
    if not isinstance(request, Mapping) or not isinstance(result, Mapping):
        raise ValueError("market_ai_selection_origin_invalid")
    profile = str(request.get("profile") or "")
    horizon = str(request.get("horizon") or "")
    if (
        str(artifact.get("selectionId") or "") != selection_id
        or str(result.get("selectionId") or "") != selection_id
        or str(request.get("market") or "") != market
        or profile not in (_CRYPTO_PROFILES if market == "crypto" else _STOCK_PROFILES)
        or horizon not in _HORIZONS
        or timeframe != "1d"
    ):
        raise ValueError("market_ai_selection_origin_mismatch")
    if schema_version == _SELECTION_SCHEMA_VERSION:
        market_context = artifact.get("marketContext")
        source_coverage = (
            market_context.get("fundamentalSourceCoverage")
            if isinstance(market_context, Mapping)
            else None
        )
        if market == "crypto":
            initial_candidates = artifact.get("initialCandidates")
            if (
                not isinstance(initial_candidates, list)
                or not _valid_statistics_source_coverage(
                    source_coverage,
                    generated_at=str(artifact.get("generatedAt") or ""),
                )
                or source_coverage["sampleCount"]
                != len(_prefilter_candidates(initial_candidates, market=market)[0])
            ):
                raise ValueError("market_ai_selection_origin_invalid")
        elif source_coverage is not None:
            raise ValueError("market_ai_selection_origin_invalid")

    evidence_candidates = artifact.get("evidenceCandidates")
    recommendation_rows = result.get("recommendations")
    if not isinstance(evidence_candidates, Sequence) or isinstance(evidence_candidates, (str, bytes)):
        raise ValueError("market_ai_selection_origin_invalid")
    if not isinstance(recommendation_rows, Sequence) or isinstance(recommendation_rows, (str, bytes)):
        raise ValueError("market_ai_selection_origin_invalid")
    candidate = next(
        (
            row
            for row in evidence_candidates
            if isinstance(row, Mapping)
            and str(row.get("evidenceId") or "") == evidence_id
            and str(row.get("market") or "") == market
            and str(row.get("symbol") or "") == symbol
        ),
        None,
    )
    recommendation = next(
        (
            row
            for row in recommendation_rows
            if isinstance(row, Mapping) and str(row.get("evidenceId") or "") == evidence_id
        ),
        None,
    )
    if candidate is None or recommendation is None:
        raise ValueError("market_ai_selection_origin_candidate_mismatch")
    rank = recommendation.get("rank")
    tier = str(recommendation.get("tier") or "")
    market_snapshot = artifact.get("marketSnapshot")
    candidate_snapshot = candidate.get("snapshot")
    daily_bars = candidate.get("dailyBars")
    factors = candidate.get("factors")
    fundamental = candidate.get("fundamental")
    last_bar = daily_bars[-1] if isinstance(daily_bars, Sequence) and daily_bars else None
    reference_price = (
        _finite_or_none(last_bar.get("close"))
        if isinstance(last_bar, Mapping)
        else None
    )
    evidence_hash = str(candidate.get("evidenceHash") or "")
    expected_evidence_hash = (
        canonical_sha256(
            {
                "candidate": candidate_snapshot,
                "dailyBars": daily_bars,
                "factors": factors,
                "fundamental": fundamental,
            }
        )
        if isinstance(candidate_snapshot, Mapping)
        and isinstance(daily_bars, Sequence)
        and not isinstance(daily_bars, (str, bytes))
        and isinstance(factors, Mapping)
        and isinstance(fundamental, Mapping)
        else ""
    )
    market_snapshot_hash = (
        str(market_snapshot.get("snapshotHash") or "")
        if isinstance(market_snapshot, Mapping)
        else ""
    )
    reference_at = str(last_bar.get("timestamp") or "") if isinstance(last_bar, Mapping) else ""
    if (
        not isinstance(rank, int)
        or isinstance(rank, bool)
        or not 1 <= rank <= _RECOMMENDATION_LIMIT
        or tier not in _AI_TIERS
        or evidence_hash != expected_evidence_hash
        or len(market_snapshot_hash) != 64
        or not reference_at
        or reference_price is None
        or reference_price <= 0
    ):
        raise ValueError("market_ai_selection_origin_invalid")

    evidence = {
        "selectionId": selection_id,
        "auditEventId": audit_event_id,
        "candidateEvidenceId": evidence_id,
        "selectionRecordHash": record_hash,
        "candidateEvidenceHash": evidence_hash,
        "marketSnapshotHash": market_snapshot_hash,
        "market": market,
        "symbol": symbol,
        "timeframe": "1d",
        "profile": profile,
        "horizon": horizon,
        "horizonBars": _HORIZON_BARS[market][horizon],
        "rank": rank,
        "tier": tier,
        "referenceAt": reference_at,
        "referencePrice": reference_price,
        "generatedAt": str(artifact.get("generatedAt") or record.created_at.isoformat()),
        "researchOnly": True,
    }
    return {**evidence, "recordHash": canonical_sha256(evidence)}


def _required_research_origin_text(value: Mapping[str, Any], key: str) -> str:
    text = str(value.get(key) or "").strip()
    if not text:
        raise ValueError("market_ai_selection_origin_invalid")
    return text
_WEIGHTS_VERSION = "market-ai-selection-v1"

_V1_STOCK_WEIGHTS: dict[str, dict[str, float]] = {
    "balanced": {
        "quality": 0.25,
        "growth": 0.20,
        "valuation": 0.20,
        "trend": 0.20,
        "liquidityRisk": 0.15,
    },
    "quality_growth": {
        "quality": 0.35,
        "growth": 0.30,
        "valuation": 0.10,
        "trend": 0.10,
        "liquidityRisk": 0.15,
    },
    "value": {
        "quality": 0.25,
        "growth": 0.10,
        "valuation": 0.40,
        "trend": 0.10,
        "liquidityRisk": 0.15,
    },
    "trend": {
        "quality": 0.10,
        "growth": 0.10,
        "valuation": 0.05,
        "trend": 0.55,
        "liquidityRisk": 0.20,
    },
}
_V1_CRYPTO_WEIGHTS: dict[str, dict[str, float]] = {
    "balanced": {
        "maturity": 0.25,
        "supply": 0.20,
        "liquidity": 0.25,
        "trend": 0.15,
        "risk": 0.15,
    },
    "trend": {
        "maturity": 0.10,
        "supply": 0.05,
        "liquidity": 0.25,
        "trend": 0.45,
        "risk": 0.15,
    },
}
_WEIGHTS_BY_VERSION = {
    "market-ai-selection-v1": {
        "stock": _V1_STOCK_WEIGHTS,
        "crypto": _V1_CRYPTO_WEIGHTS,
    }
}
_STOCK_WEIGHTS = _V1_STOCK_WEIGHTS
_CRYPTO_WEIGHTS = _V1_CRYPTO_WEIGHTS
_V1_NON_DEGRADED_EXCLUSION_REASONS = frozenset(
    {"候选未进入成交活跃度前 20 名。"}
)
_V1_NON_DEGRADED_WARNINGS = frozenset(
    {
        "AI 分析失败，已返回确定性基准榜。",
        "美股首版仅覆盖当前自选池，不代表全市场。",
    }
)
_HORIZON_LABELS: dict[str, dict[str, str]] = {
    "ashare": {
        "short": "5 个交易日",
        "medium": "20 个交易日",
        "long": "60 个交易日",
    },
    "us": {
        "short": "5 个交易日",
        "medium": "20 个交易日",
        "long": "60 个交易日",
    },
    "crypto": {
        "short": "7 天",
        "medium": "30 天",
        "long": "90 天",
    },
}
_HORIZON_BARS: dict[str, dict[str, int]] = {
    "ashare": {"short": 5, "medium": 20, "long": 60},
    "us": {"short": 5, "medium": 20, "long": 60},
    "crypto": {"short": 7, "medium": 30, "long": 90},
}

MARKET_AI_SELECTION_OUTPUT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["selections"],
    "properties": {
        "selections": {
            "type": "array",
            "minItems": 1,
            "maxItems": _RECOMMENDATION_LIMIT,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "evidenceId",
                    "rank",
                    "tier",
                    "reasons",
                    "risks",
                    "evidenceReferences",
                    "summary",
                ],
                "properties": {
                    "evidenceId": {"type": "string"},
                    "rank": {"type": "integer", "minimum": 1, "maximum": 5},
                    "tier": {
                        "type": "string",
                        "enum": sorted(_AI_TIERS),
                    },
                    "reasons": {
                        "type": "array",
                        "minItems": 1,
                        "maxItems": 4,
                        "items": {"type": "string", "minLength": 1, "maxLength": 180},
                    },
                    "risks": {
                        "type": "array",
                        "minItems": 1,
                        "maxItems": 4,
                        "items": {"type": "string", "minLength": 1, "maxLength": 180},
                    },
                    "evidenceReferences": {
                        "type": "array",
                        "minItems": 1,
                        "maxItems": 8,
                        "items": {"type": "string"},
                    },
                    "summary": {"type": "string", "minLength": 1, "maxLength": 240},
                },
            },
        }
    },
}

JsonFetcher = Callable[..., Any]
KlineLoader = Callable[[MarketDataRequest, int], tuple[list[OHLCVBar], DataQuality]]
FundamentalLoader = Callable[[Mapping[str, Any], datetime], Mapping[str, Any] | None]
Clock = Callable[[], datetime]
Monotonic = Callable[[], float]
Sleeper = Callable[[float], None]


class MarketAiSelectionError(ValueError):
    def __init__(self, code: str, status: int, detail: str) -> None:
        super().__init__(code)
        self.code = code
        self.status = status
        self.detail = detail


def validate_market_ai_selection_request(payload: Mapping[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, Mapping) or set(payload) != _REQUEST_FIELDS:
        raise MarketAiSelectionError(
            "invalid_market_ai_selection_request",
            400,
            "AI 选股请求字段无效；候选行情必须由后端重新生成。",
        )
    market = payload.get("market")
    universe_mode = payload.get("universeMode")
    profile = payload.get("profile")
    horizon = payload.get("horizon")
    provider_id = payload.get("providerId")
    approved = payload.get("externalDataApproved")
    discovery = payload.get("discovery")
    if (
        not isinstance(market, str)
        or market not in _MARKETS
        or not isinstance(universe_mode, str)
        or universe_mode not in {"discovery", "watchlist"}
        or not isinstance(profile, str)
        or not isinstance(horizon, str)
        or horizon not in _HORIZONS
        or not isinstance(provider_id, str)
        or provider_id not in _PROVIDERS
        or type(approved) is not bool
        or not isinstance(discovery, Mapping)
    ):
        raise MarketAiSelectionError(
            "invalid_market_ai_selection_request",
            400,
            "请检查市场、候选范围、风格、持有周期和 AI Provider。",
        )
    if (market == "us" and universe_mode != "watchlist") or (
        market != "us" and universe_mode != "discovery"
    ):
        raise MarketAiSelectionError(
            "invalid_market_ai_selection_universe",
            400,
            "A 股与 Binance 使用全市场发现，美股首版仅使用现有自选池。",
        )
    valid_profiles = _CRYPTO_PROFILES if market == "crypto" else _STOCK_PROFILES
    if profile not in valid_profiles:
        raise MarketAiSelectionError(
            "invalid_market_ai_selection_profile",
            400,
            "当前市场不支持所选风格档案。",
        )
    if (provider_id == "local" and approved) or (
        provider_id != "local" and not approved
    ):
        raise MarketAiSelectionError(
            "market_ai_selection_provider_approval_invalid",
            400,
            "本地基线不能携带外发授权，外部 AI Provider 必须先显式确认外发。",
        )
    normalized_discovery = _validate_discovery(discovery, market=market)
    return {
        "market": market,
        "universeMode": universe_mode,
        "discovery": normalized_discovery,
        "profile": profile,
        "horizon": horizon,
        "providerId": provider_id,
        "externalDataApproved": approved,
    }


def _validate_discovery(value: Mapping[str, Any], *, market: str) -> dict[str, Any]:
    if set(value) - _DISCOVERY_FIELDS:
        raise MarketAiSelectionError(
            "invalid_market_ai_selection_discovery",
            400,
            "筛选条件包含不受支持的字段；浏览器不能提交候选行情或 limit。",
        )
    if market == "us":
        if value:
            raise MarketAiSelectionError(
                "invalid_market_ai_selection_discovery",
                400,
                "美股自选池不接受全市场筛选条件。",
            )
        return {}
    query = value.get("query", "")
    if not isinstance(query, str) or len(query.strip()) > 64:
        raise MarketAiSelectionError(
            "invalid_market_ai_selection_discovery",
            400,
            "筛选关键词无效。",
        )
    normalized: dict[str, Any] = {"query": query.strip()}
    for field in (
        "minChangePct",
        "maxChangePct",
        "minAmount",
        "minTurnoverRate",
        "maxPe",
    ):
        item = value.get(field)
        if item is None:
            normalized[field] = None
            continue
        if type(item) not in {int, float} or not math.isfinite(float(item)):
            raise MarketAiSelectionError(
                "invalid_market_ai_selection_discovery",
                400,
                f"筛选字段 {field} 必须是有限数值。",
            )
        normalized[field] = float(item)
    if normalized["minAmount"] is not None and normalized["minAmount"] < 0:
        raise MarketAiSelectionError(
            "invalid_market_ai_selection_discovery",
            400,
            "最小成交额不能小于零。",
        )
    if (
        normalized["minTurnoverRate"] is not None
        and normalized["minTurnoverRate"] < 0
    ):
        raise MarketAiSelectionError(
            "invalid_market_ai_selection_discovery",
            400,
            "最小换手率不能小于零。",
        )
    if (
        normalized["minChangePct"] is not None
        and normalized["maxChangePct"] is not None
        and normalized["minChangePct"] > normalized["maxChangePct"]
    ):
        raise MarketAiSelectionError(
            "invalid_market_ai_selection_discovery",
            400,
            "涨跌幅范围无效。",
        )
    sort = value.get("sort", "changePct")
    direction = value.get("direction", "desc")
    allowed_sorts = {"changePct", "amount"} if market == "crypto" else {
        "changePct",
        "amount",
        "turnoverRate",
        "marketCap",
        "peRatio",
    }
    if (
        not isinstance(sort, str)
        or sort not in allowed_sorts
        or not isinstance(direction, str)
        or direction not in {"asc", "desc"}
        or (
            market == "crypto"
            and (
                normalized["minTurnoverRate"] is not None
                or normalized["maxPe"] is not None
            )
        )
    ):
        raise MarketAiSelectionError(
            "invalid_market_ai_selection_discovery",
            400,
            "当前市场不支持所选筛选或排序条件。",
        )
    normalized["sort"] = sort
    normalized["direction"] = direction
    return normalized


class MarketAiSelectionService:
    def __init__(
        self,
        *,
        discovery_service: Any,
        market_information_service: Any | None,
        kline_loader: KlineLoader,
        watchlist_store: Any,
        audit_store: AuditEventStore,
        provider_registry: AiReviewProviderRegistry,
        run_store: ResearchRunStore | None = None,
        review_kline_loader: KlineLoader | None = None,
        fundamental_loaders: Mapping[str, FundamentalLoader] | None = None,
        sec_user_agent: str = "",
        fetch_json: JsonFetcher | None = None,
        clock: Clock | None = None,
        monotonic: Monotonic | None = None,
        sleep: Sleeper | None = None,
    ) -> None:
        self.discovery_service = discovery_service
        self.market_information_service = market_information_service
        self.kline_loader = kline_loader
        self.watchlist_store = watchlist_store
        self.audit_store = audit_store
        self.provider_registry = provider_registry
        self.run_store = run_store
        self.review_kline_loader = review_kline_loader or kline_loader
        self.fundamental_loaders = dict(fundamental_loaders or {})
        self.sec_user_agent = sec_user_agent.strip()
        self.fetch_json = fetch_json or _default_fetch_json
        self._uses_default_fetch_json = fetch_json is None
        self.clock = clock or (lambda: datetime.now(timezone.utc))
        self.monotonic = monotonic or time.monotonic
        self.sleep = sleep or time.sleep
        self._cache: dict[str, tuple[datetime, Any]] = {}
        self._cache_lock = Lock()
        self._source_lock = Lock()
        self._runtime_lock = Lock()
        self._sec_request_lock = Lock()
        self._sec_last_request_at: float | None = None

    def quality_statistics(self) -> dict[str, Any]:
        computed_at = _as_utc(self.clock())
        selections = [
            self._quality_statistics_selection(record, computed_at=computed_at)
            for record in self._quality_statistics_events("market_ai_selection")
        ]
        qualified_count = sum(len(item["evidenceCandidates"]) for item in selections)
        exclusions = [
            exclusion
            for item in selections
            for exclusion in item["exclusions"]
        ]
        evaluated_count = qualified_count + len(exclusions)
        degraded_count = sum(bool(item["sourceDegraded"]) for item in selections)
        ai_attempts = [
            item["generation"]
            for item in selections
            if item["generation"]["requestedProvider"] != "local"
        ]
        ai_success_count = sum(
            item["status"] == "completed"
            and item["usedProvider"] == item["requestedProvider"]
            and item["fallbackUsed"] is False
            for item in ai_attempts
        )
        reason_counts = Counter(str(item["reason"]) for item in exclusions)
        style_selection_counts = Counter(str(item["profile"]) for item in selections)
        selections_by_id = {str(item["selectionId"]): item for item in selections}
        latest_reviews: dict[str, dict[str, Any]] = {}
        for record in self._quality_statistics_events("market_ai_selection_review"):
            review = self._quality_statistics_review(
                record,
                selections=selections_by_id,
                computed_at=computed_at,
            )
            current = latest_reviews.get(str(review["selectionId"]))
            if current is None or (
                review["createdAt"],
                review["summary"]["absoluteSampleCount"],
                review["summary"]["benchmarkSampleCount"],
                review["reviewId"],
            ) > (
                current["createdAt"],
                current["summary"]["absoluteSampleCount"],
                current["summary"]["benchmarkSampleCount"],
                current["reviewId"],
            ):
                latest_reviews[str(review["selectionId"])] = review
        performance_by_profile = {
            profile: {
                "reviewedSelectionCount": 0,
                "absoluteHitCount": 0,
                "absoluteSampleCount": 0,
                "benchmarkHitCount": 0,
                "benchmarkSampleCount": 0,
            }
            for profile in _QUALITY_STATISTICS_PROFILES
        }
        for review in latest_reviews.values():
            profile = str(selections_by_id[str(review["selectionId"])]["profile"])
            performance = performance_by_profile[profile]
            summary = review["summary"]
            performance["reviewedSelectionCount"] += 1
            for key in (
                "absoluteHitCount",
                "absoluteSampleCount",
                "benchmarkHitCount",
                "benchmarkSampleCount",
            ):
                performance[key] += int(summary[key])
        return {
            "schemaVersion": 1,
            "recordType": "aiqt.marketAiSelectionQualityStatistics",
            "generatedAt": computed_at.isoformat(),
            "selectionCount": len(selections),
            "candidateQualification": {
                "qualifiedCount": qualified_count,
                "sampleCount": evaluated_count,
                "ratePct": _market_ai_selection_rate(qualified_count, evaluated_count),
            },
            "majorExclusions": {
                "excludedCount": len(exclusions),
                "reasons": [
                    {
                        "reason": reason,
                        "count": count,
                        "ratePct": _market_ai_selection_rate(count, len(exclusions)),
                    }
                    for reason, count in sorted(
                        reason_counts.items(),
                        key=lambda item: (-item[1], item[0]),
                    )[:5]
                ],
            },
            "dataSourceDegradation": {
                "degradedCount": degraded_count,
                "sampleCount": len(selections),
                "ratePct": _market_ai_selection_rate(degraded_count, len(selections)),
            },
            "aiSuccess": {
                "successCount": ai_success_count,
                "sampleCount": len(ai_attempts),
                "ratePct": _market_ai_selection_rate(ai_success_count, len(ai_attempts)),
            },
            "stylePerformance": [
                {
                    "profile": profile,
                    "selectionCount": style_selection_counts[profile],
                    **performance_by_profile[profile],
                    "absoluteHitRatePct": _market_ai_selection_rate(
                        performance_by_profile[profile]["absoluteHitCount"],
                        performance_by_profile[profile]["absoluteSampleCount"],
                    ),
                    "benchmarkHitRatePct": _market_ai_selection_rate(
                        performance_by_profile[profile]["benchmarkHitCount"],
                        performance_by_profile[profile]["benchmarkSampleCount"],
                    ),
                }
                for profile in _QUALITY_STATISTICS_PROFILES
            ],
            "boundary": _market_ai_selection_boundary(),
        }

    def _quality_statistics_events(self, event_type: str) -> list[Any]:
        records: list[Any] = []
        try:
            while True:
                page = self.audit_store.list_recent(
                    event_type=event_type,
                    run_id_is_null=True,
                    limit=50,
                    offset=len(records),
                )
                records.extend(page)
                if len(page) < 50:
                    return records
        except Exception as error:
            raise MarketAiSelectionError(
                "market_ai_selection_statistics_audit_unavailable",
                503,
                "AI 选股质量审计暂不可用。",
            ) from error

    def _quality_statistics_selection(
        self,
        record: Any,
        *,
        computed_at: datetime,
    ) -> dict[str, Any]:
        try:
            artifact = record.metadata["artifact"]
            request = validate_market_ai_selection_request(artifact["request"])
            result = artifact["result"]
            candidates = artifact["evidenceCandidates"]
            initial_candidates = artifact["initialCandidates"]
            exclusions = artifact["exclusions"]
            generation = artifact["generation"]
            recommendations = result["recommendations"]
            market_snapshot = artifact["marketSnapshot"]
            market_context = artifact["marketContext"]
            selection_id = str(artifact["selectionId"])
            market = str(request["market"])
            profile = str(request["profile"])
            provider_identity = artifact["providerIdentity"]
            record_hash = canonical_sha256(
                {key: value for key, value in artifact.items() if key != "recordHash"}
            )
            candidate_ids = {str(item["evidenceId"]) for item in candidates}
            recommendation_ids = [str(item["evidenceId"]) for item in recommendations]
            ranks = [item["rank"] for item in recommendations]
            initial_keys = [
                (str(item["market"]), str(item["symbol"]))
                for item in initial_candidates
            ]
            candidate_keys = [
                (str(item["market"]), str(item["symbol"]))
                for item in candidates
            ]
            exclusion_keys = [
                (str(item["market"]), str(item["symbol"]))
                for item in exclusions
            ]
            weights_by_market = _WEIGHTS_BY_VERSION.get(
                str(artifact["weightsVersion"])
            )
            warnings = market_snapshot["warnings"]
            source_coverage = (
                market_context.get("fundamentalSourceCoverage")
                if isinstance(market_context, Mapping)
                else None
            )
            schema_version = artifact["schemaVersion"]
            prefiltered_count = len(
                _prefilter_candidates(initial_candidates, market=market)[0]
            )
            _require_market_ai_selection_statistics(
                record.event_type == "market_ai_selection"
                and record.run_id is None
                and record.stage == "market_ai_selection"
                and record.source == "market-ai-selection"
                and set(record.metadata) == {"artifact"}
                and type(schema_version) is int
                and schema_version in {1, _SELECTION_SCHEMA_VERSION}
                and artifact["recordType"] == "aiqt.marketAiSelection"
                and _market_ai_selection_id_matches_artifact(
                    selection_id,
                    artifact,
                )
                and record.event_id == f"market-ai-selection-{selection_id}"
                and artifact["recordHash"] == record_hash
                and request == artifact["request"]
                and weights_by_market is not None
                and artifact["weights"]
                == weights_by_market["crypto" if market == "crypto" else "stock"][profile]
                and result["selectionId"] == selection_id
                and result["auditEventId"] == record.event_id
                and result["generatedAt"] == artifact["generatedAt"]
                and result["marketSnapshot"] == market_snapshot
                and result["exclusions"] == exclusions
                and result["generation"] == generation
                and result["boundary"] == artifact["boundary"]
                and isinstance(market_snapshot, Mapping)
                and isinstance(market_context, Mapping)
                and (
                    market != "crypto"
                    and source_coverage is None
                    or market == "crypto"
                    and schema_version == 1
                    and (
                        source_coverage is None
                        or _valid_statistics_source_coverage(
                            source_coverage,
                            generated_at=str(artifact["generatedAt"]),
                        )
                    )
                    or market == "crypto"
                    and schema_version == _SELECTION_SCHEMA_VERSION
                    and _valid_statistics_source_coverage(
                        source_coverage,
                        generated_at=str(artifact["generatedAt"]),
                    )
                    and source_coverage["sampleCount"] == prefiltered_count
                )
                and isinstance(warnings, list)
                and all(isinstance(item, str) and item.strip() for item in warnings)
                and result["status"] == ("partial" if warnings else "completed")
                and artifact["boundary"] == _market_ai_selection_boundary()
                and _parse_datetime(artifact["generatedAt"]) == _as_utc(record.created_at)
                and _as_utc(record.created_at) <= computed_at
                and isinstance(candidates, list)
                and 0 < len(candidates) <= _EVIDENCE_CANDIDATE_LIMIT
                and all(_valid_statistics_candidate(item, market) for item in candidates)
                and isinstance(initial_candidates, list)
                and 0 < len(initial_candidates) <= _INITIAL_CANDIDATE_LIMIT
                and all(key[0] == market and key[1] for key in initial_keys)
                and len(set(initial_keys)) == len(initial_keys)
                and len(set(candidate_keys)) == len(candidate_keys)
                and isinstance(exclusions, list)
                and all(_valid_statistics_exclusion(item, market) for item in exclusions)
                and len(set(exclusion_keys)) == len(exclusion_keys)
                and set(candidate_keys) <= set(initial_keys)
                and set(candidate_keys).isdisjoint(exclusion_keys)
                and (
                    schema_version == 1
                    and set(initial_keys)
                    <= set(candidate_keys) | set(exclusion_keys)
                    or schema_version == _SELECTION_SCHEMA_VERSION
                    and set(initial_keys)
                    == set(candidate_keys) | set(exclusion_keys)
                )
                and _valid_statistics_generation(generation, request["providerId"])
                and isinstance(provider_identity, Mapping)
                and provider_identity.get("providerId") == request["providerId"]
                and isinstance(recommendations, list)
                and 0 < len(recommendations) <= _RECOMMENDATION_LIMIT
                and len(candidate_ids) == len(candidates)
                and len(set(recommendation_ids)) == len(recommendation_ids)
                and set(recommendation_ids) <= candidate_ids
                and len(set(ranks)) == len(ranks)
                and all(
                    isinstance(item, Mapping)
                    and isinstance(item.get("rank"), int)
                    and not isinstance(item.get("rank"), bool)
                    and 1 <= item["rank"] <= _RECOMMENDATION_LIMIT
                    and item.get("tier") in _AI_TIERS
                    for item in recommendations
                )
            )
        except (KeyError, TypeError, ValueError, MarketAiSelectionError) as error:
            raise _market_ai_selection_statistics_invalid() from error
        return {
            "selectionId": selection_id,
            "recordHash": str(record_hash),
            "market": market,
            "profile": profile,
            "horizon": str(request.get("horizon") or ""),
            "evidenceCandidates": list(candidates),
            "exclusions": list(exclusions),
            "generation": dict(generation),
            "recommendations": list(recommendations),
            "recommendationIds": frozenset(recommendation_ids),
            "sourceDegraded": any(candidate["dataGaps"] for candidate in candidates)
            or any(
                exclusion["reason"] not in _V1_NON_DEGRADED_EXCLUSION_REASONS
                for exclusion in exclusions
            )
            or any(
                warning not in _V1_NON_DEGRADED_WARNINGS
                for warning in warnings
            )
            or (
                isinstance(source_coverage, Mapping)
                and source_coverage["mappedCount"] < source_coverage["sampleCount"]
            ),
        }

    def _quality_statistics_review(
        self,
        record: Any,
        *,
        selections: Mapping[str, Mapping[str, Any]],
        computed_at: datetime,
    ) -> dict[str, Any]:
        try:
            review = record.metadata["review"]
            selection_id = str(review["selectionId"])
            selection = selections[selection_id]
            items = review["items"]
            summary = review["summary"]
            benchmark = review["benchmark"]
            benchmark_run = (
                self.run_store.get(str(benchmark["runId"]))
                if self.run_store is not None
                else None
            )
            review_id = str(review["reviewId"])
            item_ids = [str(item["candidateEvidenceId"]) for item in items]
            source_runs: dict[str, ResearchRunAudit | None] = {}
            expected_evidence: dict[str, dict[str, Any] | None] = {}
            for item in items:
                evidence_id = str(item["candidateEvidenceId"])
                symbol = str(item["symbol"])
                run_id = item.get("researchRunId")
                source_runs[evidence_id] = (
                    self.run_store.get(str(run_id))
                    if self.run_store is not None and isinstance(run_id, str)
                    else None
                )
                expected_evidence[evidence_id] = (
                    resolve_market_ai_selection_research_evidence(
                        {
                            "selectionId": selection_id,
                            "candidateEvidenceId": evidence_id,
                        },
                        audit_store=self.audit_store,
                        market=selection["market"],
                        symbol=symbol,
                        timeframe="1d",
                    )
                    if isinstance(run_id, str)
                    else None
                )
            identity = {
                "selectionId": selection_id,
                "selectionRecordHash": review["selectionRecordHash"],
                "benchmarkRunId": benchmark["runId"],
                "benchmarkAuditHash": benchmark["auditHash"],
                "items": items,
                "summary": summary,
            }
            _require_market_ai_selection_statistics(
                record.event_type == "market_ai_selection_review"
                and record.run_id is None
                and record.stage == "market_ai_selection_review"
                and record.source == "audited-selection-and-market-data"
                and set(record.metadata) == {"review"}
                and type(review["schemaVersion"]) is int
                and review["schemaVersion"] in {1, _REVIEW_SCHEMA_VERSION}
                and review["recordType"] == "aiqt.marketAiSelectionReview"
                and record.event_id == review_id
                and review["recordHash"] == canonical_sha256(
                    {key: value for key, value in review.items() if key != "recordHash"}
                )
                and review["selectionRecordHash"] == selection["recordHash"]
                and review["market"] == selection["market"]
                and review["timeframe"] == "1d"
                and set(benchmark) == {"runId", "symbol", "auditHash"}
                and bool(str(benchmark["runId"]).strip())
                and bool(str(benchmark["symbol"]).strip())
                and len(str(benchmark["auditHash"])) == 64
                and benchmark_run is not None
                and benchmark_run.market == selection["market"]
                and benchmark_run.timeframe == "1d"
                and benchmark_run.symbol == benchmark["symbol"]
                and _market_ai_selection_run_hash(benchmark_run)
                == benchmark["auditHash"]
                and _as_utc(benchmark_run.created_at) <= _as_utc(record.created_at)
                and isinstance(items, list)
                and 0 < len(items) <= _RECOMMENDATION_LIMIT
                and all(isinstance(item, Mapping) for item in items)
                and len(set(item_ids)) == len(item_ids)
                and set(item_ids) == selection["recommendationIds"]
                and all(
                    item.get("market") == selection["market"]
                    and item.get("horizon") == selection["horizon"]
                    and _valid_statistics_review_item(
                        item,
                        selection=selection,
                        benchmark=benchmark,
                        source_run=source_runs[str(item["candidateEvidenceId"])],
                        expected_evidence=expected_evidence[
                            str(item["candidateEvidenceId"])
                        ],
                        reviewed_at=_as_utc(record.created_at),
                        schema_version=int(review["schemaVersion"]),
                    )
                    for item in items
                )
                and isinstance(summary, Mapping)
                and dict(summary) == _market_ai_selection_review_summary(items)
                and summary["benchmarkSampleCount"] <= summary["absoluteSampleCount"]
                and summary["absoluteSampleCount"] <= summary["maturedCount"]
                and all(
                    not isinstance(item.get("benchmarkHit"), bool)
                    or isinstance(item.get("absoluteHit"), bool)
                    for item in items
                )
                and review["boundary"] == _market_ai_selection_review_boundary()
                and review_id
                == f"market-ai-selection-review-{canonical_sha256(identity)[:32]}"
                and _parse_datetime(review["createdAt"]) == _as_utc(record.created_at)
                and _as_utc(record.created_at) <= computed_at
                and record.summary == "AI 选股到期表现已按已审计基准复盘。"
                and record.detail
                == (
                    f"matured={summary['maturedCount']} "
                    f"observing={summary['observingCount']} "
                    f"insufficient={summary['dataInsufficientCount']} "
                    "researchOnly=true"
                )
            )
        except (KeyError, TypeError, ValueError) as error:
            raise _market_ai_selection_statistics_invalid() from error
        return {
            "reviewId": review_id,
            "selectionId": selection_id,
            "createdAt": _as_utc(record.created_at),
            "summary": dict(summary),
        }

    def review(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        if not isinstance(payload, Mapping) or set(payload) != {
            "selectionId",
            "benchmarkRunId",
        }:
            raise MarketAiSelectionError(
                "invalid_market_ai_selection_review_request",
                400,
                "复盘请求只能提交选股记录与已审计基准运行身份。",
            )
        selection_id = str(payload.get("selectionId") or "").strip()
        benchmark_run_id = str(payload.get("benchmarkRunId") or "").strip()
        if not selection_id or not benchmark_run_id:
            raise MarketAiSelectionError(
                "invalid_market_ai_selection_review_request",
                400,
                "请选择选股记录与已审计基准运行。",
            )
        if self.run_store is None:
            raise MarketAiSelectionError(
                "market_ai_selection_review_store_unavailable",
                503,
                "研究审计存储暂不可用。",
            )

        evidence_rows = self._review_evidence(selection_id)
        try:
            benchmark_run = self.run_store.get(benchmark_run_id)
            bound_runs = self.run_store.list_by_market_ai_selection(selection_id)
        except ValueError as error:
            raise MarketAiSelectionError(
                "market_ai_selection_review_research_binding_invalid",
                409,
                "研究运行与已绑定 AI 选股证据的上下文或哈希不一致。",
            ) from error
        if benchmark_run is None:
            raise MarketAiSelectionError(
                "market_ai_selection_review_benchmark_not_found",
                404,
                "未找到已审计基准研究运行。",
            )
        evaluated_at = _as_utc(self.clock())
        market = evidence_rows[0]["market"]
        if (
            benchmark_run.market != market
            or benchmark_run.timeframe != "1d"
            or _as_utc(benchmark_run.created_at) > evaluated_at
        ):
            raise MarketAiSelectionError(
                "market_ai_selection_review_benchmark_context_mismatch",
                409,
                "基准研究运行与选股市场或日线周期不一致。",
            )
        if (
            benchmark_run.data_quality.get("isComplete") is not True
            or benchmark_run.data_snapshot.get("isComplete") is not True
        ):
            raise MarketAiSelectionError(
                "market_ai_selection_review_benchmark_incomplete",
                409,
                "基准研究运行缺少完整的已审计数据快照。",
            )

        items = [
            self._review_item(
                evidence,
                bound_runs=bound_runs,
                benchmark_run=benchmark_run,
                evaluated_at=evaluated_at,
            )
            for evidence in evidence_rows
        ]
        summary = _market_ai_selection_review_summary(items)
        boundary = _market_ai_selection_review_boundary()
        identity = {
            "selectionId": selection_id,
            "selectionRecordHash": evidence_rows[0]["selectionRecordHash"],
            "benchmarkRunId": benchmark_run.run_id,
            "benchmarkAuditHash": _market_ai_selection_run_hash(benchmark_run),
            "items": items,
            "summary": summary,
        }
        review_id = f"market-ai-selection-review-{canonical_sha256(identity)[:32]}"
        artifact_without_hash: dict[str, Any] = {
            "schemaVersion": _REVIEW_SCHEMA_VERSION,
            "recordType": "aiqt.marketAiSelectionReview",
            "reviewId": review_id,
            "selectionId": selection_id,
            "selectionRecordHash": evidence_rows[0]["selectionRecordHash"],
            "createdAt": evaluated_at.isoformat(),
            "market": market,
            "timeframe": "1d",
            "benchmark": {
                "runId": benchmark_run.run_id,
                "symbol": benchmark_run.symbol,
                "auditHash": identity["benchmarkAuditHash"],
            },
            "items": items,
            "summary": summary,
            "boundary": boundary,
        }
        artifact = {
            **artifact_without_hash,
            "recordHash": canonical_sha256(artifact_without_hash),
        }
        audit_summary = "AI 选股到期表现已按已审计基准复盘。"
        audit_detail = (
            f"matured={summary['maturedCount']} "
            f"observing={summary['observingCount']} "
            f"insufficient={summary['dataInsufficientCount']} "
            "researchOnly=true"
        )
        stored, _ = self.audit_store.record_if_absent(
            {
                "schemaVersion": 1,
                "eventId": review_id,
                "eventType": "market_ai_selection_review",
                "runId": None,
                "createdAt": artifact["createdAt"],
                "stage": "market_ai_selection_review",
                "source": "audited-selection-and-market-data",
                "summary": audit_summary,
                "detail": audit_detail,
                "metadata": {"review": artifact},
            }
        )
        stored_review = stored.metadata.get("review")
        if (
            stored.event_id != review_id
            or stored.event_type != "market_ai_selection_review"
            or stored.run_id is not None
            or stored.stage != "market_ai_selection_review"
            or stored.source != "audited-selection-and-market-data"
            or stored.summary != audit_summary
            or stored.detail != audit_detail
            or set(stored.metadata) != {"review"}
            or not isinstance(stored_review, Mapping)
            or stored_review.get("reviewId") != review_id
            or stored_review.get("recordHash")
            != canonical_sha256(
                {key: value for key, value in stored_review.items() if key != "recordHash"}
            )
            or {
                key: value
                for key, value in stored_review.items()
                if key not in {"createdAt", "recordHash"}
            }
            != {
                key: value
                for key, value in artifact.items()
                if key not in {"createdAt", "recordHash"}
            }
            or _parse_datetime(stored_review.get("createdAt"))
            != _as_utc(stored.created_at)
        ):
            raise MarketAiSelectionError(
                "market_ai_selection_review_audit_conflict",
                409,
                "已有复盘审计记录与当前证据冲突。",
            )
        return _public_market_ai_selection_review(stored_review)

    def _review_evidence(self, selection_id: str) -> list[dict[str, Any]]:
        record = self.audit_store.get(f"market-ai-selection-{selection_id}")
        artifact = record.metadata.get("artifact") if record is not None else None
        result = artifact.get("result") if isinstance(artifact, Mapping) else None
        recommendations = (
            result.get("recommendations") if isinstance(result, Mapping) else None
        )
        candidates = (
            artifact.get("evidenceCandidates")
            if isinstance(artifact, Mapping)
            else None
        )
        if (
            record is None
            or record.event_type != "market_ai_selection"
            or not isinstance(recommendations, Sequence)
            or isinstance(recommendations, (str, bytes))
            or not isinstance(candidates, Sequence)
            or isinstance(candidates, (str, bytes))
            or not recommendations
        ):
            raise MarketAiSelectionError(
                "market_ai_selection_review_source_not_found",
                404,
                "未找到可复盘的受保护 AI 选股记录。",
            )
        evidence_rows: list[dict[str, Any]] = []
        try:
            for recommendation in recommendations:
                if not isinstance(recommendation, Mapping):
                    raise ValueError("market_ai_selection_origin_invalid")
                evidence_id = str(recommendation.get("evidenceId") or "")
                candidate = next(
                    (
                        row
                        for row in candidates
                        if isinstance(row, Mapping)
                        and str(row.get("evidenceId") or "") == evidence_id
                    ),
                    None,
                )
                if candidate is None:
                    raise ValueError("market_ai_selection_origin_candidate_mismatch")
                evidence = resolve_market_ai_selection_research_evidence(
                    {
                        "selectionId": selection_id,
                        "candidateEvidenceId": evidence_id,
                    },
                    audit_store=self.audit_store,
                    market=str(candidate.get("market") or ""),
                    symbol=str(candidate.get("symbol") or ""),
                    timeframe="1d",
                )
                if evidence is None:
                    raise ValueError("market_ai_selection_origin_invalid")
                evidence_rows.append(evidence)
        except ValueError as error:
            raise MarketAiSelectionError(
                "market_ai_selection_review_source_invalid",
                409,
                "AI 选股审计证据结构或哈希校验失败。",
            ) from error
        return sorted(evidence_rows, key=lambda item: item["rank"])

    def _review_item(
        self,
        evidence: Mapping[str, Any],
        *,
        bound_runs: Sequence[ResearchRunAudit],
        benchmark_run: ResearchRunAudit,
        evaluated_at: datetime,
    ) -> dict[str, Any]:
        base = {
            "candidateEvidenceId": evidence["candidateEvidenceId"],
            "rank": evidence["rank"],
            "tier": evidence["tier"],
            "market": evidence["market"],
            "symbol": evidence["symbol"],
            "timeframe": "1d",
            "horizon": evidence["horizon"],
            "horizonBars": evidence["horizonBars"],
            "referenceAt": evidence["referenceAt"],
            "referencePrice": evidence["referencePrice"],
        }
        matching_runs = [
            run
            for run in bound_runs
            if run.data_snapshot.get("marketAiSelectionEvidence") == evidence
            and _as_utc(run.created_at) <= evaluated_at
        ]
        if not matching_runs:
            return {
                **base,
                "status": "data_insufficient",
                "reason": "research_evidence_not_bound",
            }
        source_run = matching_runs[0]
        base["researchRunId"] = source_run.run_id
        try:
            bars, quality = self.review_kline_loader(
                MarketDataRequest(
                    market=evidence["market"],
                    symbol=evidence["symbol"],
                    timeframe="1d",
                    end=evaluated_at,
                ),
                500,
            )
        except Exception:
            return {
                **base,
                "status": "data_insufficient",
                "reason": "outcome_bars_unavailable",
            }
        if not isinstance(quality, DataQuality) or not quality.is_complete:
            return {
                **base,
                "status": "data_insufficient",
                "reason": "outcome_bars_incomplete",
            }
        if any(
            not isinstance(bar, OHLCVBar)
            or bar.market != evidence["market"]
            or bar.symbol != evidence["symbol"]
            or bar.timeframe != "1d"
            for bar in bars
        ):
            return {
                **base,
                "status": "data_insufficient",
                "reason": "outcome_bar_context_mismatch",
            }
        reference_at = _parse_datetime(evidence["referenceAt"])
        if reference_at is None:
            return {
                **base,
                "status": "data_insufficient",
                "reason": "reference_time_invalid",
            }
        reference_price = _finite_or_none(evidence["referencePrice"])
        completed_window = _completed_daily_bars(bars, cutoff=evaluated_at)
        completed = [
            bar
            for bar in completed_window
            if _as_utc(bar.timestamp) > reference_at
        ]
        horizon_bars = int(evidence["horizonBars"])
        matured_fields = (
            {"completedBars": horizon_bars, "remainingBars": 0}
            if len(completed) >= horizon_bars
            else {}
        )
        reference_bar = next(
            (
                bar
                for bar in completed_window
                if _as_utc(bar.timestamp) == reference_at
            ),
            None,
        )
        if reference_bar is None:
            return {
                **base,
                **matured_fields,
                "status": "data_insufficient",
                "reason": "outcome_reference_bar_missing",
            }
        if (
            reference_price is None
            or reference_price <= 0
            or not math.isclose(
                float(reference_bar.close),
                reference_price,
                rel_tol=1e-9,
                abs_tol=1e-9,
            )
        ):
            return {
                **base,
                **matured_fields,
                "status": "data_insufficient",
                "reason": "outcome_reference_price_mismatch",
            }
        if len(completed) < horizon_bars:
            return {
                **base,
                "status": "observing",
                "completedBars": len(completed),
                "remainingBars": horizon_bars - len(completed),
            }
        outcome_bars = completed[:horizon_bars]
        if evidence["market"] == "crypto" and market_data_gap_count(
            MarketDataRequest(
                market=evidence["market"],
                symbol=evidence["symbol"],
                timeframe="1d",
                start=reference_at,
                end=_as_utc(outcome_bars[-1].timestamp),
            ),
            [reference_bar, *outcome_bars],
        ):
            return {
                **base,
                "completedBars": horizon_bars,
                "remainingBars": 0,
                "status": "data_insufficient",
                "reason": "outcome_bar_gap",
            }
        outcome_price = _finite_or_none(outcome_bars[-1].close)
        if outcome_price is None or outcome_price <= 0:
            return {
                **base,
                "completedBars": horizon_bars,
                "remainingBars": 0,
                "status": "data_insufficient",
                "reason": "review_price_invalid",
            }
        try:
            normalized_outcome_bars = normalize_snapshot_bars(outcome_bars)
            outcome_hash = canonical_sha256(normalized_outcome_bars)
        except ValueError:
            return {
                **base,
                "completedBars": horizon_bars,
                "remainingBars": 0,
                "status": "data_insufficient",
                "reason": "review_bar_window_invalid",
            }
        outcome_at = _as_utc(outcome_bars[-1].timestamp)
        return_pct = round((outcome_price / reference_price - 1) * 100, 6)
        matured = {
            **base,
            "completedBars": horizon_bars,
            "remainingBars": 0,
            "outcomeAt": outcome_at.isoformat(),
            "outcomePrice": outcome_price,
            "returnPct": return_pct,
            "absoluteHit": return_pct > 0,
            "outcomeSource": quality.origin_source or quality.source,
            "outcomeAdjustmentMode": quality.adjustment_mode,
            "outcomeDataHash": outcome_hash,
            "outcomeBars": normalized_outcome_bars,
        }
        return self._completed_review_item(
            matured,
            evidence=evidence,
            benchmark_run=benchmark_run,
            evaluated_at=evaluated_at,
            outcome_timestamps=tuple(
                _as_utc(bar.timestamp) for bar in outcome_bars
            ),
        )

    def _completed_review_item(
        self,
        base: Mapping[str, Any],
        *,
        evidence: Mapping[str, Any],
        benchmark_run: ResearchRunAudit,
        evaluated_at: datetime,
        outcome_timestamps: Sequence[datetime],
    ) -> dict[str, Any]:
        if benchmark_run.symbol == evidence["symbol"]:
            return {
                **base,
                "status": "data_insufficient",
                "reason": "benchmark_must_use_different_symbol",
            }
        try:
            benchmark_bars, benchmark_quality = self.review_kline_loader(
                MarketDataRequest(
                    market=evidence["market"],
                    symbol=benchmark_run.symbol,
                    timeframe="1d",
                    end=evaluated_at,
                ),
                500,
            )
        except Exception:
            return {
                **base,
                "status": "data_insufficient",
                "reason": "benchmark_bars_unavailable",
            }
        if (
            not isinstance(benchmark_quality, DataQuality)
            or not benchmark_quality.is_complete
        ):
            return {
                **base,
                "status": "data_insufficient",
                "reason": "benchmark_bars_incomplete",
            }
        if benchmark_quality.adjustment_mode != base["outcomeAdjustmentMode"]:
            return {
                **base,
                "status": "data_insufficient",
                "reason": "benchmark_adjustment_mode_mismatch",
            }
        if any(
            not isinstance(bar, OHLCVBar)
            or bar.market != evidence["market"]
            or bar.symbol != benchmark_run.symbol
            or bar.timeframe != "1d"
            for bar in benchmark_bars
        ):
            return {
                **base,
                "status": "data_insufficient",
                "reason": "benchmark_bar_context_mismatch",
            }
        reference_at = _parse_datetime(evidence["referenceAt"])
        outcome_at = _parse_datetime(base["outcomeAt"])
        if reference_at is None or outcome_at is None:
            return {
                **base,
                "status": "data_insufficient",
                "reason": "review_bar_window_invalid",
            }
        benchmark_by_time = {
            _as_utc(bar.timestamp): bar
            for bar in _completed_daily_bars(
                benchmark_bars,
                cutoff=evaluated_at,
            )
        }
        benchmark_start = benchmark_by_time.get(reference_at)
        benchmark_end = benchmark_by_time.get(outcome_at)
        if benchmark_start is None or benchmark_end is None:
            return {
                **base,
                "status": "data_insufficient",
                "reason": "benchmark_same_period_coverage_missing",
            }
        if evidence["market"] != "crypto" and tuple(
            timestamp
            for timestamp in sorted(benchmark_by_time)
            if reference_at < timestamp <= outcome_at
        ) != tuple(outcome_timestamps):
            outcome_fields = {
                "outcomeAt",
                "outcomePrice",
                "returnPct",
                "absoluteHit",
                "outcomeSource",
                "outcomeAdjustmentMode",
                "outcomeDataHash",
                "outcomeBars",
            }
            return {
                **{
                    key: value
                    for key, value in base.items()
                    if key not in outcome_fields
                },
                "status": "data_insufficient",
                "reason": "outcome_bar_gap",
            }
        benchmark_start_price = _finite_or_none(benchmark_start.close)
        benchmark_end_price = _finite_or_none(benchmark_end.close)
        if (
            benchmark_start_price is None
            or benchmark_start_price <= 0
            or benchmark_end_price is None
            or benchmark_end_price <= 0
        ):
            return {
                **base,
                "status": "data_insufficient",
                "reason": "review_price_invalid",
            }
        try:
            normalized_benchmark_bars = normalize_snapshot_bars(
                [benchmark_start, benchmark_end]
            )
            benchmark_hash = canonical_sha256(normalized_benchmark_bars)
        except ValueError:
            return {
                **base,
                "status": "data_insufficient",
                "reason": "review_bar_window_invalid",
            }
        benchmark_return_pct = round(
            (benchmark_end_price / benchmark_start_price - 1) * 100,
            6,
        )
        relative_return_pct = round(float(base["returnPct"]) - benchmark_return_pct, 6)
        return {
            **base,
            "status": "completed",
            "benchmarkRunId": benchmark_run.run_id,
            "benchmarkSymbol": benchmark_run.symbol,
            "benchmarkReferencePrice": benchmark_start_price,
            "benchmarkOutcomePrice": benchmark_end_price,
            "benchmarkReturnPct": benchmark_return_pct,
            "relativeReturnPct": relative_return_pct,
            "benchmarkHit": relative_return_pct > 0,
            "benchmarkSource": benchmark_quality.origin_source or benchmark_quality.source,
            "benchmarkAdjustmentMode": benchmark_quality.adjustment_mode,
            "benchmarkDataHash": benchmark_hash,
            "benchmarkBars": normalized_benchmark_bars,
        }

    def update_runtime(
        self,
        *,
        provider_registry: AiReviewProviderRegistry,
        sec_user_agent: str,
    ) -> None:
        with self._runtime_lock:
            self.provider_registry = provider_registry
            self.sec_user_agent = sec_user_agent.strip()

    def select(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        request = validate_market_ai_selection_request(payload)
        requested_at = _as_utc(self.clock())
        source_candidates, market_snapshot, market_context, source_exclusions = (
            self._authoritative_candidates(request, generated_at=requested_at)
        )
        generated_at = max(requested_at, _as_utc(self.clock()))
        evidence_deadline = self.monotonic() + _EVIDENCE_BUDGET_SECONDS
        initial_candidates = [dict(item) for item in source_candidates]
        initial_keys = {
            (str(item["market"]), str(item["symbol"]))
            for item in initial_candidates
        }
        initial_candidates.extend(
            {
                "market": exclusion["market"],
                "symbol": exclusion["symbol"],
                "name": exclusion["name"],
            }
            for exclusion in source_exclusions
            if (str(exclusion["market"]), str(exclusion["symbol"]))
            not in initial_keys
        )
        prefiltered, prefilter_exclusions = _prefilter_candidates(
            source_candidates,
            market=request["market"],
        )
        exclusions = [*source_exclusions, *prefilter_exclusions]
        if not prefiltered:
            raise MarketAiSelectionError(
                "market_ai_selection_no_candidates",
                409,
                "当前筛选条件没有可用于证据组装的权威候选。",
            )
        try:
            source_timed_out, source_coverage, source_warnings = (
                self._prepare_fundamental_sources(
                    prefiltered,
                    market=str(request["market"]),
                    cutoff=generated_at,
                    deadline=evidence_deadline,
                )
            )
        except Exception as error:
            raise MarketAiSelectionError(
                "market_ai_selection_fundamental_source_unavailable",
                502,
                "必需基本面数据源暂不可用。",
            ) from error
        if source_coverage is not None:
            market_context = {
                **market_context,
                "fundamentalSourceCoverage": source_coverage,
            }
        market_snapshot["warnings"] = list(
            dict.fromkeys([*market_snapshot["warnings"], *source_warnings])
        )

        evidence, evidence_exclusions, evidence_timed_out = self._assemble_evidence(
            prefiltered,
            request=request,
            generated_at=generated_at,
            deadline=evidence_deadline,
        )
        timed_out = source_timed_out or evidence_timed_out
        exclusions.extend(evidence_exclusions)
        if not evidence:
            leading_reason = (
                evidence_exclusions[0]["reason"]
                if evidence_exclusions
                else "缺少合格证据。"
            )
            raise MarketAiSelectionError(
                "market_ai_selection_no_eligible_candidates",
                409,
                "当前候选均未通过证据门槛，未调用 AI。"
                f"首要原因：{leading_reason}",
            )

        scored = _score_candidates(
            evidence,
            market=request["market"],
            profile=request["profile"],
        )
        news, news_warnings = self._load_news(
            scored[:10],
            request=request,
            generated_at=generated_at,
            deadline=evidence_deadline,
        )
        _attach_news(scored, news)

        provider_identity = _provider_identity(
            self.provider_registry,
            str(request["providerId"]),
        )
        selection_identity = {
            "schemaVersion": _SELECTION_SCHEMA_VERSION,
            "request": dict(request),
            "providerIdentity": dict(provider_identity),
            "marketSnapshot": {
                **market_snapshot,
                "warnings": list(market_snapshot["warnings"]),
            },
            "marketContext": dict(market_context),
            "newsHash": canonical_sha256(news),
            "newsWarnings": list(news_warnings),
            "exclusions": list(exclusions),
            "timedOut": timed_out,
            "weightsVersion": _WEIGHTS_VERSION,
            "evidence": [
                {
                    "evidenceId": item["evidenceId"],
                    "evidenceHash": item["evidenceHash"],
                    "newsReferences": item["newsReferences"],
                }
                for item in scored
            ],
        }
        evidence_identity = canonical_sha256(selection_identity)
        selection_id = f"selection-v{_SELECTION_SCHEMA_VERSION}-{evidence_identity[:20]}"
        audit_event_id = f"market-ai-selection-{selection_id}"
        try:
            existing = self.audit_store.get(audit_event_id)
        except Exception as error:
            raise MarketAiSelectionError(
                "market_ai_selection_audit_unavailable",
                503,
                "AI 选股审计存储暂不可用。",
            ) from error
        if (
            existing is not None
            and existing.event_type == "market_ai_selection"
            and isinstance(existing.metadata.get("artifact"), Mapping)
        ):
            stored_result = existing.metadata["artifact"].get("result")
            if isinstance(stored_result, Mapping):
                return dict(stored_result)

        baseline = [_public_candidate(item) for item in scored]
        recommendations, generation = self._generate_recommendations(
            scored,
            request=request,
            news=news,
            market_context=market_context,
            market_snapshot=market_snapshot,
        )
        warnings = list(market_snapshot["warnings"])
        warnings.extend(news_warnings)
        if timed_out:
            warnings.append("证据组装达到 20 秒预算，已使用按时完成的候选。")
        if generation["status"] == "failed":
            warnings.append("AI 分析失败，已返回确定性基准榜。")
        warnings = list(dict.fromkeys(warnings))
        market_snapshot["warnings"] = warnings
        status = "partial" if warnings else "complete"
        boundary = _market_ai_selection_boundary()
        result: dict[str, Any] = {
            "selectionId": selection_id,
            "status": "partial" if status == "partial" else "completed",
            "generatedAt": generated_at.isoformat(),
            "marketSnapshot": market_snapshot,
            "baselineCandidates": baseline,
            "recommendations": recommendations,
            "exclusions": exclusions,
            "generation": generation,
            "auditEventId": audit_event_id,
            "boundary": boundary,
        }
        artifact_without_hash: dict[str, Any] = {
            "schemaVersion": _SELECTION_SCHEMA_VERSION,
            "recordType": "aiqt.marketAiSelection",
            "selectionId": selection_id,
            "generatedAt": generated_at.isoformat(),
            "request": request,
            "marketSnapshot": market_snapshot,
            "marketContext": market_context,
            "weightsVersion": _WEIGHTS_VERSION,
            "selectionIdentity": selection_identity,
            "providerIdentity": provider_identity,
            "weights": (
                _CRYPTO_WEIGHTS[request["profile"]]
                if request["market"] == "crypto"
                else _STOCK_WEIGHTS[request["profile"]]
            ),
            "initialCandidates": initial_candidates,
            "evidenceCandidates": scored,
            "newsEvidence": news,
            "exclusions": exclusions,
            "generation": generation,
            "boundary": boundary,
            "nextAction": "用户可逐只选择“开始研究”进入既有研究链。",
            "result": result,
        }
        artifact = {
            **artifact_without_hash,
            "recordHash": canonical_sha256(artifact_without_hash),
        }
        try:
            stored, _ = self.audit_store.record_if_absent(
                {
                    "schemaVersion": 1,
                    "eventId": audit_event_id,
                    "eventType": "market_ai_selection",
                    "runId": None,
                    "createdAt": generated_at.isoformat(),
                    "stage": "market_ai_selection",
                    "source": "market-ai-selection",
                    "summary": "AI 选股研究候选证据已冻结。",
                    "detail": (
                        f"{request['market']} {request['profile']} "
                        f"{len(recommendations)} 个研究候选；不构成交易授权。"
                    ),
                    "metadata": {"artifact": artifact},
                }
            )
        except Exception as error:
            raise MarketAiSelectionError(
                "market_ai_selection_audit_unavailable",
                503,
                "AI 选股审计存储暂不可用。",
            ) from error
        stored_artifact = stored.metadata.get("artifact")
        if isinstance(stored_artifact, Mapping):
            stored_result = stored_artifact.get("result")
            if isinstance(stored_result, Mapping):
                return dict(stored_result)
        return result

    def _authoritative_candidates(
        self,
        request: Mapping[str, Any],
        *,
        generated_at: datetime,
    ) -> tuple[
        list[dict[str, Any]],
        dict[str, Any],
        dict[str, Any],
        list[dict[str, Any]],
    ]:
        market = str(request["market"])
        if market == "us":
            try:
                instruments = [
                    item
                    for item in self.watchlist_store.list_instruments()
                    if getattr(item, "market", None) == "us"
                ][:_INITIAL_CANDIDATE_LIMIT]
            except Exception as error:
                raise MarketAiSelectionError(
                    "market_ai_selection_watchlist_unavailable",
                    502,
                    "美股自选池暂不可用。",
                ) from error
            candidates: list[dict[str, Any]] = []
            exclusions: list[dict[str, Any]] = []
            quote_times: list[datetime] = []
            for item in instruments:
                quote_at = (
                    _as_utc(item.quote_as_of)
                    if isinstance(item.quote_as_of, datetime)
                    else None
                )
                candidate_identity = {
                    "market": "us",
                    "symbol": str(item.symbol).strip().upper(),
                    "name": str(item.name).strip(),
                }
                if quote_at is None:
                    exclusions.append(
                        _exclusion(
                            candidate_identity,
                            "us_quote_timestamp_missing",
                            "美股自选报价缺少真实更新时间。",
                        )
                    )
                    continue
                if quote_at > generated_at:
                    exclusions.append(
                        _exclusion(
                            candidate_identity,
                            "us_quote_timestamp_future",
                            "美股自选报价时间晚于选股截止时间。",
                        )
                    )
                    continue
                if not _us_quote_is_fresh(
                    quote_at,
                    cutoff=generated_at,
                ):
                    exclusions.append(
                        _exclusion(
                            candidate_identity,
                            "us_quote_stale",
                            "美股自选报价不满足当前交易时段的新鲜度要求。",
                        )
                    )
                    continue
                quote_times.append(quote_at)
                candidates.append(
                    {
                    "market": "us",
                    "symbol": str(item.symbol).strip().upper(),
                    "name": str(item.name).strip(),
                    "price": _finite_or_none(item.price),
                    "changePct": _finite_or_none(item.change_pct),
                    "amount": None,
                    "turnoverRate": None,
                    "peRatio": None,
                    "pbRatio": None,
                    "marketCap": None,
                    "source": str(item.quote_source or "watchlist"),
                    "observedAt": quote_at.isoformat(),
                    }
                )
            if not candidates:
                reason = (
                    exclusions[0]["reason"]
                    if exclusions
                    else "美股自选池没有候选。"
                )
                raise MarketAiSelectionError(
                    "market_ai_selection_watchlist_quotes_stale",
                    409,
                    f"美股自选池没有新鲜权威报价。首要原因：{reason}",
                )
            snapshot_hash = canonical_sha256(candidates)
            snapshot = {
                "snapshotHash": snapshot_hash,
                "observedAt": max(quote_times).isoformat(),
                "source": "watchlist",
                "freshness": "fresh",
                "warnings": list(
                    dict.fromkeys(
                        [
                            "美股首版仅覆盖当前自选池，不代表全市场。",
                            *(
                                [
                                    f"已排除 {len(exclusions)} 个报价缺失、未来或过期的美股自选标的。"
                                ]
                                if exclusions
                                else []
                            ),
                        ]
                    )
                ),
            }
            return (
                candidates,
                snapshot,
                {"universeCount": len(candidates)},
                exclusions,
            )

        discovery = request["discovery"]
        try:
            result = self.discovery_service.discover(
                MarketDiscoveryQuery(
                    market=market,
                    query=discovery["query"],
                    min_change_pct=discovery["minChangePct"],
                    max_change_pct=discovery["maxChangePct"],
                    min_amount=discovery["minAmount"],
                    min_turnover_rate=discovery["minTurnoverRate"],
                    max_pe=discovery["maxPe"],
                    sort=discovery["sort"],
                    direction=discovery["direction"],
                    limit=_INITIAL_CANDIDATE_LIMIT,
                )
            )
        except MarketAiSelectionError:
            raise
        except Exception as error:
            raise MarketAiSelectionError(
                "market_ai_selection_snapshot_unavailable",
                502,
                "权威市场候选暂不可用。",
            ) from error
        if not isinstance(result, Mapping) or result.get("market") != market:
            raise MarketAiSelectionError(
                "market_ai_selection_snapshot_unavailable",
                502,
                "权威市场候选返回了无效市场快照。",
            )
        freshness = str(result.get("freshness") or "unknown")
        if freshness != "fresh":
            raise MarketAiSelectionError(
                "market_ai_selection_snapshot_stale",
                409,
                "市场快照已过期，请刷新市场数据后重试。",
            )
        observed_at = _parse_datetime(result.get("observedAt"))
        if observed_at is None:
            raise MarketAiSelectionError(
                "market_ai_selection_snapshot_timestamp_invalid",
                409,
                "权威市场快照缺少可验证的观察时间。",
            )
        if observed_at > max(generated_at, _as_utc(self.clock())):
            raise MarketAiSelectionError(
                "market_ai_selection_snapshot_timestamp_invalid",
                409,
                "权威市场快照观察时间晚于选股截止时间。",
            )
        raw_items = result.get("items")
        if not isinstance(raw_items, list):
            raise MarketAiSelectionError(
                "market_ai_selection_snapshot_unavailable",
                502,
                "权威市场快照未提供候选列表。",
            )
        candidates = [
            item
            for raw in raw_items[:_INITIAL_CANDIDATE_LIMIT]
            if (item := _normalize_market_candidate(raw, market=market)) is not None
        ]
        snapshot_hash = str(result.get("snapshotHash") or "")
        if not snapshot_hash:
            snapshot_hash = canonical_sha256(candidates)
        snapshot = {
            "snapshotHash": snapshot_hash,
            "observedAt": observed_at.isoformat(),
            "source": str(result.get("source") or "unknown"),
            "freshness": freshness,
            "warnings": [
                str(item)
                for item in result.get("warnings", [])
                if isinstance(item, str) and item.strip()
            ],
        }
        context = result.get("overview")
        return (
            candidates,
            snapshot,
            dict(context) if isinstance(context, Mapping) else {},
            [],
        )

    def _assemble_evidence(
        self,
        candidates: Sequence[Mapping[str, Any]],
        *,
        request: Mapping[str, Any],
        generated_at: datetime,
        deadline: float,
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]], bool]:
        if self.monotonic() >= deadline:
            return (
                [],
                [
                    _exclusion(
                        candidate,
                        "evidence_timeout",
                        "证据组装达到 20 秒预算。",
                    )
                    for candidate in candidates
                ],
                True,
            )
        executor = ThreadPoolExecutor(
            max_workers=min(4, len(candidates)),
            thread_name_prefix="market-ai-evidence",
        )
        futures: dict[Future[Any], Mapping[str, Any]] = {
            executor.submit(
                self._candidate_evidence,
                candidate,
                request=request,
                generated_at=generated_at,
                deadline=deadline,
            ): candidate
            for candidate in candidates
        }
        completed, pending = wait(
            futures,
            timeout=max(0.0, deadline - self.monotonic()),
        )
        evidence: list[dict[str, Any]] = []
        exclusions: list[dict[str, Any]] = []
        for future, candidate in futures.items():
            if future in pending:
                exclusions.append(
                    _exclusion(candidate, "evidence_timeout", "证据组装超时。")
                )
                continue
            try:
                value = future.result()
            except Exception:
                value = (
                    None,
                    "evidence_source_failed",
                    "日 K 线或基本面数据源暂不可用。",
                )
            item, code, detail = value
            if item is None:
                exclusions.append(_exclusion(candidate, code, detail))
            else:
                evidence.append(item)
        for future in pending:
            future.cancel()
        executor.shutdown(wait=False, cancel_futures=True)
        evidence.sort(
            key=lambda item: next(
                index
                for index, candidate in enumerate(candidates)
                if candidate["symbol"] == item["symbol"]
            )
        )
        return evidence, exclusions, bool(pending)

    def _candidate_evidence(
        self,
        candidate: Mapping[str, Any],
        *,
        request: Mapping[str, Any],
        generated_at: datetime,
        deadline: float,
    ) -> tuple[dict[str, Any] | None, str, str]:
        bars, quality = self.kline_loader(
            MarketDataRequest(
                market=request["market"],
                symbol=str(candidate["symbol"]),
                timeframe="1d",
                end=generated_at,
            ),
            _DAILY_BAR_COUNT + 5,
        )
        if not isinstance(quality, DataQuality) or not quality.is_complete:
            return None, "daily_bars_incomplete", "日 K 线质量检查未通过。"
        completed = _completed_daily_bars(bars, cutoff=generated_at)
        if len(completed) < _DAILY_BAR_COUNT:
            return (
                None,
                "daily_bars_insufficient",
                f"仅有 {len(completed)} 根已完成日 K 线，需要 {_DAILY_BAR_COUNT} 根。",
            )
        completed = completed[-_DAILY_BAR_COUNT:]
        normalized_bars = normalize_snapshot_bars(completed)
        factors = _technical_factors(completed)
        fundamental = self._load_fundamental(
            candidate,
            market=str(request["market"]),
            cutoff=generated_at,
            deadline=deadline,
        )
        valid, code, detail = _validate_fundamental(
            fundamental,
            market=str(request["market"]),
            profile=str(request["profile"]),
            candidate=candidate,
            cutoff=generated_at,
        )
        if not valid:
            return None, code, detail
        normalized_fundamental = dict(fundamental or {})
        if request["market"] != "crypto":
            normalized_fundamental["valuation"] = _stock_valuation(
                candidate,
                normalized_fundamental,
            )
            if request["profile"] == "value" and not any(
                _positive_number(normalized_fundamental["valuation"].get(field))
                for field in ("peRatio", "pbRatio", "psRatio")
            ):
                return (
                    None,
                    "valuation_missing",
                    "价值风格至少需要一个可复算的市盈率、市净率或市销率。",
                )
        evidence_id = (
            f"candidate-{request['market']}-"
            f"{str(candidate['symbol']).replace('/', '-').casefold()}"
        )
        evidence_hash = canonical_sha256(
            {
                "candidate": candidate,
                "dailyBars": normalized_bars,
                "factors": factors,
                "fundamental": normalized_fundamental,
            }
        )
        fundamental_period = (
            str(normalized_fundamental.get("currentPeriod") or "")
            if request["market"] != "crypto"
            else str(normalized_fundamental.get("observedAt") or "")
        )
        return (
            {
                "evidenceId": evidence_id,
                "evidenceHash": evidence_hash,
                "market": request["market"],
                "symbol": candidate["symbol"],
                "name": candidate["name"],
                "snapshot": dict(candidate),
                "dailyBars": normalized_bars,
                "factors": factors,
                "fundamental": normalized_fundamental,
                "fundamentalPeriod": fundamental_period,
                "dataGaps": _market_ai_selection_v1_data_gaps(
                    normalized_fundamental,
                    market=str(request["market"]),
                ),
                "newsReferences": [],
            },
            "",
            "",
        )

    def _load_fundamental(
        self,
        candidate: Mapping[str, Any],
        *,
        market: str,
        cutoff: datetime,
        deadline: float,
    ) -> Mapping[str, Any] | None:
        key = f"fundamental:{market}:{candidate['symbol']}"
        ttl = (
            _CRYPTO_FUNDAMENTAL_TTL
            if market == "crypto"
            else _STOCK_FUNDAMENTAL_TTL
        )
        cached = self._cache_get(key, ttl=ttl, now=cutoff)
        crypto_mapping_matches = True
        if (
            market == "crypto"
            and isinstance(cached, Mapping)
            and cached.get("source") == "coingecko+binance"
        ):
            base, target = _split_crypto_symbol(str(candidate["symbol"]))
            mapping, _ = self._ensure_coingecko_mapping(
                {f"{base}/{target}"},
                cutoff=cutoff,
                deadline=None,
            )
            mapped = mapping.get(f"{base}/{target}")
            crypto_mapping_matches = (
                isinstance(mapped, Mapping)
                and mapped.get("status") == "mapped"
                and mapped.get("coinId") == cached.get("coinId")
            )
        if cached is not None and (
            market != "crypto"
            or not isinstance(cached, Mapping)
            or cached.get("source") != "coingecko+binance"
            or (
                crypto_mapping_matches
                and _valid_crypto_fundamental_observation(cached, cutoff=cutoff)
            )
        ):
            return dict(cached) if isinstance(cached, Mapping) else None
        loader = self.fundamental_loaders.get(market)
        if loader is not None:
            value = loader(candidate, cutoff)
        elif market == "ashare":
            value = self._load_ashare_fundamental(
                candidate,
                cutoff=cutoff,
                deadline=deadline,
            )
        elif market == "us":
            value = self._load_us_fundamental(
                candidate,
                cutoff=cutoff,
                deadline=deadline,
            )
        else:
            value = self._load_crypto_fundamental(candidate, cutoff=cutoff)
        if isinstance(value, Mapping) and not value.get("sourceStatus"):
            normalized = dict(value)
            self._cache_put(key, normalized, now=cutoff)
            return normalized
        return dict(value) if isinstance(value, Mapping) else None

    def _prepare_fundamental_sources(
        self,
        candidates: Sequence[Mapping[str, Any]],
        *,
        market: str,
        cutoff: datetime,
        deadline: float,
    ) -> tuple[bool, dict[str, Any] | None, list[str]]:
        if market != "crypto" or self.fundamental_loaders.get("crypto") is not None:
            return False, None, []
        required_pairs = {
            f"{base}/{target}"
            for item in candidates
            if (base := _split_crypto_symbol(str(item["symbol"]))[0])
            and (target := _split_crypto_symbol(str(item["symbol"]))[1])
        }
        mapping, mapping_incomplete = self._ensure_coingecko_mapping(
            required_pairs,
            cutoff=cutoff,
            deadline=deadline,
        )
        warnings = (
            ["CoinGecko 交易对映射源未完整返回，已仅使用验证完成的精确映射。"]
            if mapping_incomplete
            else []
        )
        coverage = _coingecko_mapping_coverage(
            mapping,
            required_pairs,
            observed_at=_coingecko_mapping_observed_at(
                mapping,
                required_pairs,
                fallback=cutoff,
            ),
        )
        coin_ids = sorted(
            {
                str(item["coinId"])
                for pair in required_pairs
                if isinstance((item := mapping.get(pair)), Mapping)
                and item.get("coinId")
            }
        )
        missing_ids = [
            coin_id
            for coin_id in coin_ids
            if self._cache_get(
                f"source:coingecko-market:{coin_id}",
                ttl=_CRYPTO_FUNDAMENTAL_TTL,
                now=cutoff,
            )
            is None
        ]
        if not missing_ids:
            return self.monotonic() >= deadline, coverage, warnings
        if self.monotonic() >= deadline:
            return True, coverage, warnings
        try:
            payload = self._read_json(
                "https://api.coingecko.com/api/v3/coins/markets?"
                + urlencode(
                    {
                        "vs_currency": "usd",
                        "ids": ",".join(missing_ids),
                    }
                ),
                {"Accept": "application/json"},
                deadline=deadline,
            )
        except Exception:
            return (
                self.monotonic() >= deadline,
                coverage,
                [
                    *warnings,
                    "CoinGecko 市场事实源未完整返回，已排除缺失事实的候选。",
                ],
            )
        if not isinstance(payload, list):
            return (
                self.monotonic() >= deadline,
                coverage,
                [
                    *warnings,
                    "CoinGecko 市场事实源未完整返回，已排除缺失事实的候选。",
                ],
            )
        returned_ids: set[str] = set()
        for row in payload:
            if (
                isinstance(row, Mapping)
                and isinstance(row.get("id"), str)
                and row["id"] in missing_ids
            ):
                returned_ids.add(row["id"])
                observed_at = _parse_datetime(row.get("last_updated"))
                source_status = (
                    "crypto_market_facts_timestamp_missing"
                    if observed_at is None
                    else "crypto_market_facts_timestamp_future"
                    if observed_at > cutoff
                    else "crypto_market_facts_stale"
                    if cutoff - observed_at > _CRYPTO_FUNDAMENTAL_TTL
                    else None
                )
                self._cache_put(
                    f"source:coingecko-market:{row['id']}",
                    (
                        {"_sourceStatus": source_status}
                        if source_status is not None
                        else dict(row)
                    ),
                    now=cutoff,
                )
        for coin_id in set(missing_ids) - returned_ids:
            self._cache_put(
                f"source:coingecko-market:{coin_id}",
                {
                    "_sourceStatus": "crypto_market_facts_missing",
                    "checkedAt": cutoff.isoformat(),
                },
                now=cutoff,
            )
        return self.monotonic() >= deadline, coverage, warnings

    def _load_ashare_fundamental(
        self,
        candidate: Mapping[str, Any],
        *,
        cutoff: datetime,
        deadline: float,
    ) -> Mapping[str, Any] | None:
        if self.monotonic() >= deadline:
            return None
        try:
            import akshare as ak  # type: ignore[import-not-found]

            symbol = str(candidate["symbol"])
            stock = (
                f"sh{symbol}"
                if symbol.startswith(("5", "6", "9"))
                else f"bj{symbol}"
                if symbol.startswith(("4", "8"))
                else f"sz{symbol}"
            )
            income = ak.stock_financial_report_sina(stock=stock, symbol="利润表")
            balance = ak.stock_financial_report_sina(
                stock=stock,
                symbol="资产负债表",
            )
        except Exception:
            return None
        primary = parse_ashare_financial_reports(
            income,
            balance,
            cutoff=cutoff,
            source="akshare-sina-financial-report",
        )
        if primary is None:
            return None
        secondary: Mapping[str, Any] | None = None
        try:
            secondary_income = ak.stock_profit_sheet_by_report_em(
                symbol=stock.upper()
            )
            secondary_balance = ak.stock_balance_sheet_by_report_em(
                symbol=stock.upper()
            )
            secondary = parse_ashare_financial_reports(
                secondary_income,
                secondary_balance,
                cutoff=cutoff,
                source="akshare-eastmoney-financial-report",
            )
        except Exception:
            secondary = None
        verification = compare_stock_fundamental_sources(primary, secondary)
        return {
            **primary,
            "sourceVerification": verification,
            "dualSourceStatus": verification["status"],
            "conflict": verification["status"] == "conflict",
        }

    def _load_us_fundamental(
        self,
        candidate: Mapping[str, Any],
        *,
        cutoff: datetime,
        deadline: float,
    ) -> Mapping[str, Any] | None:
        if not is_valid_sec_edgar_user_agent(self.sec_user_agent):
            return {
                "sourceStatus": "sec_user_agent_invalid",
                "source": "sec-companyfacts",
            }

        def load_ticker_map() -> dict[str, str]:
            payload = self._read_sec_json(
                "https://www.sec.gov/files/company_tickers.json",
                {"User-Agent": self.sec_user_agent, "Accept": "application/json"},
                deadline=deadline,
            )
            return _sec_ticker_map(payload)

        ticker_map = self._shared_source(
            "source:sec-ticker-map",
            ttl=_STOCK_FUNDAMENTAL_TTL,
            now=cutoff,
            loader=load_ticker_map,
        )
        cik = ticker_map.get(str(candidate["symbol"]).upper())
        if not isinstance(cik, str):
            return {
                "sourceStatus": "sec_ticker_mapping_missing",
                "source": "sec-companyfacts",
            }
        payload = self._read_sec_json(
            f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json",
            {"User-Agent": self.sec_user_agent, "Accept": "application/json"},
            deadline=deadline,
        )
        return parse_sec_companyfacts(payload, cutoff=cutoff)

    def _load_crypto_fundamental(
        self,
        candidate: Mapping[str, Any],
        *,
        cutoff: datetime,
    ) -> Mapping[str, Any] | None:
        base, target = _split_crypto_symbol(str(candidate["symbol"]))
        mapping, _ = self._ensure_coingecko_mapping(
            {f"{base}/{target}"},
            cutoff=cutoff,
            deadline=None,
        )
        mapped = mapping.get(f"{base}/{target}")
        mapping_status = (
            str(mapped.get("status") or "")
            if isinstance(mapped, Mapping)
            else "unresolved"
        )
        if mapping_status != "mapped" or not mapped.get("coinId"):
            source_status = (
                "crypto_mapping_source_invalid"
                if isinstance(mapped, Mapping)
                and mapped.get("reason") == "source_observation_invalid"
                else f"crypto_mapping_{mapping_status or 'unresolved'}"
            )
            return {
                "sourceStatus": source_status,
                "source": "coingecko+binance",
            }
        coin_id = str(mapped["coinId"])
        row = self._cache_get(
            f"source:coingecko-market:{coin_id}",
            ttl=_CRYPTO_FUNDAMENTAL_TTL,
            now=cutoff,
        )
        if not isinstance(row, Mapping):
            return {
                "sourceStatus": "crypto_market_facts_missing",
                "source": "coingecko+binance",
                "coinId": coin_id,
            }
        if row.get("_sourceStatus"):
            return {
                "sourceStatus": str(row["_sourceStatus"]),
                "source": "coingecko+binance",
                "coinId": coin_id,
            }
        observed_at = _parse_datetime(row.get("last_updated"))
        mapping_observed_at = _parse_datetime(mapped.get("observedAt"))
        if (
            observed_at is None
            or observed_at > cutoff
            or cutoff - observed_at > _CRYPTO_FUNDAMENTAL_TTL
            or mapping_observed_at is None
            or mapping_observed_at > cutoff
            or cutoff - mapping_observed_at > _CRYPTO_FUNDAMENTAL_TTL
        ):
            return {
                "sourceStatus": "crypto_market_facts_timestamp_invalid",
                "source": "coingecko+binance",
                "coinId": coin_id,
            }
        return {
            "coinId": coin_id,
            "mappedFrom": f"binance:{base}/{target}",
            "marketCap": _finite_or_none(row.get("market_cap")),
            "circulatingSupply": _finite_or_none(row.get("circulating_supply")),
            "totalSupply": _finite_or_none(row.get("total_supply")),
            "maxSupply": _finite_or_none(row.get("max_supply")),
            "fullyDilutedValuation": _finite_or_none(
                row.get("fully_diluted_valuation")
            ),
            "bidAskSpreadPct": _finite_or_none(mapped.get("bidAskSpreadPct")),
            "binanceQuoteVolume": _finite_or_none(candidate.get("amount")),
            "mappingObservedAt": mapping_observed_at.isoformat(),
            "observedAt": observed_at.isoformat(),
            "source": "coingecko+binance",
        }

    def _ensure_coingecko_mapping(
        self,
        required_pairs: set[str],
        *,
        cutoff: datetime,
        deadline: float | None,
    ) -> tuple[Mapping[str, Any], bool]:
        key = "source:coingecko-binance-map"
        cached = self._cache_get(
            key,
            ttl=_CRYPTO_FUNDAMENTAL_TTL,
            now=cutoff,
        )
        if (
            isinstance(cached, Mapping)
            and required_pairs <= set(cached)
            and not any(
                _coingecko_mapping_entry_expired(cached.get(pair), cutoff=cutoff)
                for pair in required_pairs
            )
            and (
                deadline is None
                or not _coingecko_mapping_incomplete(cached, required_pairs)
            )
        ):
            return cached, _coingecko_mapping_incomplete(cached, required_pairs)
        effective_deadline = (
            deadline
            if deadline is not None
            else self.monotonic() + _EVIDENCE_BUDGET_SECONDS
        )
        with self._source_lock:
            cached = self._cache_get(
                key,
                ttl=_CRYPTO_FUNDAMENTAL_TTL,
                now=cutoff,
            )
            existing = dict(cached) if isinstance(cached, Mapping) else {}
            resume_page = existing.pop("_nextPage", 1)
            resume_boundary = str(existing.pop("_boundaryPair", "") or "")
            expired = {
                pair
                for pair in required_pairs
                if _coingecko_mapping_entry_expired(
                    existing.get(pair),
                    cutoff=cutoff,
                )
            }
            for pair in expired:
                existing.pop(pair, None)
            unresolved = {
                pair
                for pair in required_pairs
                if isinstance(existing.get(pair), Mapping)
                and existing[pair].get("status") == "unresolved"
            }
            missing = (required_pairs - set(existing)) | unresolved
            if not missing:
                return existing, _coingecko_mapping_incomplete(
                    existing,
                    required_pairs,
                )
            for pair in unresolved:
                existing.pop(pair, None)
            start_page = (
                resume_page
                if type(resume_page) is int and resume_page >= 1
                else 1
            )
            if resume_boundary and min(missing) < resume_boundary:
                start_page = 1
                resume_boundary = ""
            ticker_rows: list[Mapping[str, Any]] = []
            invalid_pairs: set[str] = set()
            scan_complete = False
            last_page_boundary_pair = resume_boundary
            last_successful_page = start_page - 1
            last_required_pair = max(missing) if missing else ""
            for page in range(start_page, start_page + 20):
                if self.monotonic() >= effective_deadline:
                    break
                try:
                    payload = self._read_json(
                        "https://api.coingecko.com/api/v3/exchanges/binance/tickers?"
                        + urlencode({"page": page, "order": "base_target"}),
                        {"Accept": "application/json"},
                        deadline=effective_deadline,
                    )
                except Exception:
                    break
                rows = (
                    payload.get("tickers")
                    if isinstance(payload, Mapping)
                    else None
                )
                if not isinstance(rows, list):
                    break
                if not rows:
                    scan_complete = True
                    break
                page_pairs = [
                    f"{str(item.get('base') or '').strip().upper()}/"
                    f"{str(item.get('target') or '').strip().upper()}"
                    for item in rows
                    if isinstance(item, Mapping)
                    and item.get("base")
                    and item.get("target")
                ]
                if (
                    page == start_page
                    and resume_boundary
                    and page_pairs
                    and min(page_pairs) < resume_boundary
                ):
                    existing.clear()
                    missing = set(required_pairs)
                    resume_boundary = ""
                    last_page_boundary_pair = ""
                    break
                last_successful_page = page
                for item in rows:
                    if not isinstance(item, Mapping):
                        continue
                    pair = (
                        f"{str(item.get('base') or '').strip().upper()}/"
                        f"{str(item.get('target') or '').strip().upper()}"
                    )
                    if pair == resume_boundary:
                        continue
                    if _valid_coingecko_ticker_observation(item, cutoff=cutoff):
                        ticker_rows.append(item)
                    elif pair in missing:
                        invalid_pairs.add(pair)
                if page_pairs:
                    last_page_boundary_pair = max(page_pairs)
                if (
                    len(rows) < 100
                    or (
                        last_required_pair
                        and page_pairs
                        and max(page_pairs) > last_required_pair
                    )
                ):
                    scan_complete = True
                    break
            unresolved_pairs = {resume_boundary} & missing
            if not scan_complete and last_page_boundary_pair:
                unresolved_pairs.add(last_page_boundary_pair)
                ticker_rows = [
                    item
                    for item in ticker_rows
                    if (
                        f"{str(item.get('base') or '').strip().upper()}/"
                        f"{str(item.get('target') or '').strip().upper()}"
                    )
                    != last_page_boundary_pair
                ]
                existing["_nextPage"] = last_successful_page + 1
                existing["_boundaryPair"] = last_page_boundary_pair
                # ponytail: cursor is process-local; persist only if restarts
                # measurably prevent public-source coverage from progressing.
            discovered = build_coingecko_binance_mapping(ticker_rows)
            for item in discovered.values():
                if "observedAt" not in item:
                    item["checkedAt"] = cutoff.isoformat()
            existing.update(discovered)
            for pair in missing - set(discovered):
                existing[pair] = (
                    {
                        "status": "unresolved",
                        "reason": "source_observation_invalid",
                        "checkedAt": cutoff.isoformat(),
                    }
                    if pair in invalid_pairs
                    else {
                        "status": (
                            "unresolved"
                            if pair in unresolved_pairs or not scan_complete
                            else "missing"
                        ),
                        "checkedAt": cutoff.isoformat(),
                    }
                )
            observed_times = [
                value
                for value in (
                    _parse_datetime(existing.get("_observedAt")),
                    *(
                        _parse_datetime(item.get("last_fetch_at"))
                        for item in ticker_rows
                    ),
                )
                if value is not None
            ]
            existing["_observedAt"] = max(observed_times or [cutoff]).isoformat()
            self._cache_put(key, existing, now=cutoff)
            return existing, _coingecko_mapping_incomplete(existing, required_pairs)

    def _load_news(
        self,
        candidates: Sequence[Mapping[str, Any]],
        *,
        request: Mapping[str, Any],
        generated_at: datetime,
        deadline: float,
    ) -> tuple[dict[str, list[dict[str, Any]]], list[str]]:
        result: dict[str, list[dict[str, Any]]] = {
            "market": [],
            **{str(item["evidenceId"]): [] for item in candidates},
        }
        if self.market_information_service is None:
            return result, ["新闻服务未配置，选股按行情与基本面证据继续。"]
        warnings: list[str] = []
        if self.monotonic() >= deadline:
            return result, ["证据组装预算已用尽，新闻证据本次未加载。"]
        executor = ThreadPoolExecutor(
            max_workers=1,
            thread_name_prefix="market-ai-news",
        )
        budget_exhausted = False

        def read_with_budget(query: MarketInformationQuery) -> Mapping[str, Any]:
            remaining = deadline - self.monotonic()
            if remaining <= 0:
                raise FutureTimeoutError()
            future = executor.submit(self.market_information_service.read, query)
            try:
                value = future.result(timeout=remaining)
            except FutureTimeoutError:
                future.cancel()
                raise
            if not isinstance(value, Mapping):
                raise ValueError("market_ai_selection_news_payload_invalid")
            return value

        try:
            payload = read_with_budget(
                MarketInformationQuery(
                    market=str(request["market"]),
                    limit=10,
                    section="news",
                    scope="market",
                )
            )
            result["market"] = _normalize_news(
                payload.get("news") if isinstance(payload, Mapping) else None,
                cutoff=generated_at,
                prefix="market",
            )
            if isinstance(payload, Mapping):
                warnings.extend(
                    str(item)
                    for item in payload.get("warnings", [])
                    if isinstance(item, str) and item.strip()
                )
        except FutureTimeoutError:
            budget_exhausted = True
            warnings.append("证据组装预算已用尽，新闻证据本次未完整加载。")
        except Exception:
            warnings.append("市场级新闻暂不可用，其他证据不受影响。")
        if not budget_exhausted:
            for candidate in candidates:
                if self.monotonic() >= deadline:
                    warnings.append("证据组装预算已用尽，部分个股新闻本次未加载。")
                    break
                try:
                    payload = read_with_budget(
                        MarketInformationQuery(
                            market=str(request["market"]),
                            symbol=str(candidate["symbol"]),
                            name=str(candidate["name"]),
                            limit=3,
                            section="news",
                            scope="instrument",
                        )
                    )
                    result[str(candidate["evidenceId"])] = _normalize_news(
                        payload.get("news"),
                        cutoff=generated_at,
                        prefix=str(candidate["evidenceId"]),
                    )[:3]
                except FutureTimeoutError:
                    warnings.append(
                        "证据组装预算已用尽，部分个股新闻本次未加载。"
                    )
                    break
                except Exception:
                    warnings.append(f"{candidate['symbol']} 个股新闻暂不可用。")
        executor.shutdown(wait=False, cancel_futures=True)
        return result, list(dict.fromkeys(warnings))

    def _generate_recommendations(
        self,
        candidates: Sequence[Mapping[str, Any]],
        *,
        request: Mapping[str, Any],
        news: Mapping[str, Sequence[Mapping[str, Any]]],
        market_context: Mapping[str, Any],
        market_snapshot: Mapping[str, Any],
    ) -> tuple[list[dict[str, Any]], dict[str, Any]]:
        baseline = _baseline_recommendations(
            candidates[:_RECOMMENDATION_LIMIT],
            horizon=str(request["horizon"]),
        )
        provider_id = str(request["providerId"])
        if provider_id == "local":
            return baseline, {
                "requestedProvider": "local",
                "usedProvider": "local",
                "status": "skipped",
                "fallbackUsed": False,
                "model": None,
                "sanitizedBaseUrl": None,
                "latencyMs": 0,
                "externalDataApproved": False,
                "outboundFields": [],
                "errorCode": None,
            }
        provider_status = next(
            (
                item
                for item in self.provider_registry.statuses()
                if item.provider_id == provider_id
            ),
            None,
        )
        provider = self.provider_registry.get(provider_id)
        if (
            provider_status is None
            or not provider_status.configured
            or provider_status.model is None
            or provider_status.sanitized_base_url is None
            or provider is None
        ):
            return baseline, _failed_generation(
                provider_id,
                provider_status,
                "market_ai_selection_provider_not_configured",
            )
        outbound = _external_evidence(
            candidates,
            request=request,
            news=news,
            market_context=market_context,
            market_snapshot=market_snapshot,
        )
        try:
            assert_external_evidence_safe(outbound)
            known_evidence_ids = frozenset(
                {
                    str(item["evidenceId"])
                    for item in candidates
                }
                | {
                    str(item["evidenceId"])
                    for values in news.values()
                    for item in values
                    if isinstance(item, Mapping) and item.get("evidenceId")
                }
                | {
                    reference
                    for item in candidates
                    for reference in item["newsReferences"]
                }
            )
            candidate_evidence_ids = frozenset(
                str(item["evidenceId"]) for item in candidates
            )

            def response_validator(
                value: Mapping[str, Any],
                known_ids: frozenset[str],
            ) -> dict[str, Any]:
                return validate_market_ai_selection_output(
                    value,
                    known_ids,
                    candidate_evidence_ids=candidate_evidence_ids,
                )

            attempt = provider.assess(
                rendered_prompt=json.dumps(
                    {
                        "instruction": (
                            "仅在合格候选内重排并用中文解释研究优先级。"
                            "不得输出买卖、仓位、数量、目标价、订单或收益保证。"
                        ),
                        "untrustedInput": outbound,
                    },
                    ensure_ascii=False,
                    sort_keys=True,
                ),
                output_schema=MARKET_AI_SELECTION_OUTPUT_SCHEMA,
                known_evidence_ids=known_evidence_ids,
                response_validator=response_validator,
            )
            if (
                attempt.provider_id != provider_id
                or attempt.model != provider_status.model
                or attempt.sanitized_base_url
                != provider_status.sanitized_base_url
            ):
                raise ValueError("provider_attempt_identity_mismatch")
            assessment = response_validator(
                attempt.assessment,
                known_evidence_ids,
            )
            by_id = {
                str(item["evidenceId"]): item
                for item in candidates
            }
            recommendations = [
                _recommendation(
                    by_id[str(item["evidenceId"])],
                    item,
                )
                for item in assessment["selections"]
            ]
            return recommendations, {
                "requestedProvider": provider_id,
                "usedProvider": provider_id,
                "status": "completed",
                "fallbackUsed": False,
                "model": attempt.model,
                "sanitizedBaseUrl": attempt.sanitized_base_url,
                "latencyMs": max(0, int(attempt.latency_ms)),
                "externalDataApproved": True,
                "outboundFields": [
                    "候选身份",
                    "市场环境",
                    "确定性分数",
                    "支柱分数",
                    "技术因子",
                    "基本面事实",
                    "新闻引用",
                    "个股新闻",
                ],
                "errorCode": None,
            }
        except AiReviewProviderError as error:
            return baseline, _failed_generation(
                provider_id,
                provider_status,
                error.code,
            )
        except Exception:
            return baseline, _failed_generation(
                provider_id,
                provider_status,
                "market_ai_selection_provider_failed",
            )

    def _cache_get(
        self,
        key: str,
        *,
        ttl: timedelta,
        now: datetime,
    ) -> Any | None:
        with self._cache_lock:
            cached = self._cache.get(key)
            if (
                cached is None
                or now < cached[0]
                or now - cached[0] >= ttl
            ):
                return None
            return cached[1]

    def _cache_put(self, key: str, value: Any, *, now: datetime) -> None:
        with self._cache_lock:
            self._cache[key] = (now, value)

    def _read_json(
        self,
        url: str,
        headers: Mapping[str, str],
        *,
        deadline: float | None,
    ) -> Any:
        if deadline is None:
            return self.fetch_json(url, headers)
        remaining = deadline - self.monotonic()
        if remaining <= 0:
            raise TimeoutError("market_ai_selection_evidence_deadline_exceeded")
        if self._uses_default_fetch_json:
            return self.fetch_json(url, headers, min(10.0, remaining))
        return self.fetch_json(url, headers)

    def _read_sec_json(
        self,
        url: str,
        headers: Mapping[str, str],
        *,
        deadline: float,
    ) -> Any:
        with self._sec_request_lock:
            now = self.monotonic()
            if self._sec_last_request_at is not None:
                delay = max(0.0, self._sec_last_request_at + 0.125 - now)
                if delay > 0:
                    if now + delay >= deadline:
                        raise TimeoutError(
                            "market_ai_selection_evidence_deadline_exceeded"
                        )
                    self.sleep(delay)
                    now = self.monotonic()
            if now >= deadline:
                raise TimeoutError(
                    "market_ai_selection_evidence_deadline_exceeded"
                )
            self._sec_last_request_at = now
        return self._read_json(url, headers, deadline=deadline)

    def _shared_source(
        self,
        key: str,
        *,
        ttl: timedelta,
        now: datetime,
        loader: Callable[[], Any],
    ) -> Any:
        cached = self._cache_get(key, ttl=ttl, now=now)
        if cached is not None:
            return cached
        with self._source_lock:
            cached = self._cache_get(key, ttl=ttl, now=now)
            if cached is not None:
                return cached
            value = loader()
            self._cache_put(key, value, now=now)
            return value


def validate_market_ai_selection_output(
    value: Mapping[str, Any],
    known_evidence_ids: frozenset[str],
    *,
    candidate_evidence_ids: frozenset[str] | None = None,
) -> dict[str, Any]:
    if (
        not isinstance(value, Mapping)
        or set(value) != {"selections"}
        or contains_prohibited_output(value)
        or _contains_secret_text(value)
    ):
        raise ValueError("market_ai_selection_output_invalid")
    assert_external_evidence_safe(value)
    selections = value.get("selections")
    if not isinstance(selections, list) or not 1 <= len(selections) <= 5:
        raise ValueError("market_ai_selection_output_invalid")
    allowed_candidates = candidate_evidence_ids or known_evidence_ids
    normalized: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    seen_ranks: set[int] = set()
    for raw in selections:
        if not isinstance(raw, Mapping) or set(raw) != {
            "evidenceId",
            "rank",
            "tier",
            "reasons",
            "risks",
            "evidenceReferences",
            "summary",
        }:
            raise ValueError("market_ai_selection_output_invalid")
        evidence_id = raw.get("evidenceId")
        rank = raw.get("rank")
        tier = raw.get("tier")
        if (
            not isinstance(evidence_id, str)
            or evidence_id not in allowed_candidates
            or evidence_id in seen_ids
            or type(rank) is not int
            or rank < 1
            or rank > len(selections)
            or rank in seen_ranks
            or not isinstance(tier, str)
            or tier not in _AI_TIERS
        ):
            raise ValueError("market_ai_selection_output_invalid")
        reasons = _validated_chinese_text_list(raw.get("reasons"), maximum=4)
        risks = _validated_chinese_text_list(raw.get("risks"), maximum=4)
        references = raw.get("evidenceReferences")
        summary = raw.get("summary")
        if (
            not isinstance(references, list)
            or not 1 <= len(references) <= 8
            or len(set(references)) != len(references)
            or any(
                not isinstance(item, str) or item not in known_evidence_ids
                for item in references
            )
            or evidence_id not in references
            or not isinstance(summary, str)
            or not summary.strip()
            or len(summary.strip()) > 240
            or not _HAN_TEXT.search(summary)
        ):
            raise ValueError("market_ai_selection_output_invalid")
        seen_ids.add(evidence_id)
        seen_ranks.add(rank)
        normalized.append(
            {
                "evidenceId": evidence_id,
                "rank": rank,
                "tier": tier,
                "reasons": reasons,
                "risks": risks,
                "evidenceReferences": list(references),
                "summary": summary.strip(),
            }
        )
    if seen_ranks != set(range(1, len(selections) + 1)):
        raise ValueError("market_ai_selection_output_invalid")
    normalized.sort(key=lambda item: item["rank"])
    return {"selections": normalized}


def _normalize_market_candidate(
    value: Any,
    *,
    market: str,
) -> dict[str, Any] | None:
    if not isinstance(value, Mapping):
        return None
    symbol = str(value.get("symbol") or "").strip().upper()
    name = str(value.get("name") or symbol).strip()
    if (
        not symbol
        or len(symbol) > 32
        or not re.fullmatch(r"[A-Z0-9._/:-]+", symbol)
        or not name
        or len(name) > 80
    ):
        return None
    price = _finite_or_none(value.get("price"))
    amount = _finite_or_none(value.get("amount"))
    if price is None or price <= 0:
        return None
    return {
        "market": market,
        "symbol": symbol,
        "name": name,
        "price": price,
        "changePct": _finite_or_none(value.get("changePct")),
        "volume": _finite_or_none(value.get("volume")),
        "amount": amount,
        "turnoverRate": _finite_or_none(value.get("turnoverRate")),
        "peRatio": _finite_or_none(value.get("peRatio")),
        "pbRatio": _finite_or_none(value.get("pbRatio")),
        "marketCap": _finite_or_none(value.get("marketCap")),
        "source": str(value.get("source") or "unknown"),
        "observedAt": str(value.get("observedAt") or ""),
    }


def _prefilter_candidates(
    candidates: Sequence[Mapping[str, Any]],
    *,
    market: str,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    usable: list[tuple[int, Mapping[str, Any]]] = []
    exclusions: list[dict[str, Any]] = []
    for index, candidate in enumerate(candidates):
        price = _finite_or_none(candidate.get("price"))
        amount = _finite_or_none(candidate.get("amount"))
        if price is None or price <= 0:
            exclusions.append(
                _exclusion(
                    candidate,
                    "market_price_missing",
                    "权威市场快照缺少有效价格。",
                )
            )
            continue
        if market != "us" and (amount is None or amount <= 0):
            exclusions.append(
                _exclusion(
                    candidate,
                    "liquidity_missing",
                    "权威市场快照缺少有效成交额。",
                )
            )
            continue
        usable.append((index, candidate))
    if market == "us":
        ordered = usable
    else:
        ordered = sorted(
            usable,
            key=lambda pair: (
                -float(pair[1].get("amount") or 0),
                pair[0],
            ),
        )
    selected = [dict(item) for _, item in ordered[:_EVIDENCE_CANDIDATE_LIMIT]]
    for _, candidate in ordered[_EVIDENCE_CANDIDATE_LIMIT:]:
        exclusions.append(
            _exclusion(
                candidate,
                "liquidity_prefilter",
                "候选未进入成交活跃度前 20 名。",
            )
        )
    return selected, exclusions


def _completed_daily_bars(
    bars: Sequence[OHLCVBar],
    *,
    cutoff: datetime,
) -> list[OHLCVBar]:
    normalized_cutoff = _as_utc(cutoff)
    completed = [
        bar
        for bar in bars
        if (
            isinstance(bar, OHLCVBar)
            and bar.timeframe == "1d"
            and _as_utc(bar.timestamp) + timedelta(days=1) <= normalized_cutoff
            and all(
                math.isfinite(float(value))
                for value in (
                    bar.open,
                    bar.high,
                    bar.low,
                    bar.close,
                    bar.volume,
                )
            )
            and bar.close > 0
            and bar.volume >= 0
        )
    ]
    return sorted(completed, key=lambda item: _as_utc(item.timestamp))


def _market_ai_selection_run_hash(run: ResearchRunAudit) -> str:
    return canonical_sha256(
        {
            "runId": run.run_id,
            "createdAt": run.created_at.isoformat(),
            "market": run.market,
            "symbol": run.symbol,
            "timeframe": run.timeframe,
            "executionMode": run.execution_mode,
            "dataQuality": run.data_quality,
            "dataSnapshot": run.data_snapshot,
        }
    )


def _market_ai_selection_review_summary(
    items: Sequence[Mapping[str, Any]],
) -> dict[str, Any]:
    matured = [
        item
        for item in items
        if item.get("completedBars") == item.get("horizonBars")
    ]
    absolute_samples = [
        item for item in items if isinstance(item.get("absoluteHit"), bool)
    ]
    benchmark_samples = [
        item for item in items if isinstance(item.get("benchmarkHit"), bool)
    ]
    absolute_hits = sum(item.get("absoluteHit") is True for item in absolute_samples)
    benchmark_hits = sum(item.get("benchmarkHit") is True for item in benchmark_samples)
    absolute_sample_count = len(absolute_samples)
    benchmark_sample_count = len(benchmark_samples)
    return {
        "recommendationCount": len(items),
        "maturedCount": len(matured),
        "observingCount": sum(item.get("status") == "observing" for item in items),
        "dataInsufficientCount": sum(
            item.get("status") == "data_insufficient" for item in items
        ),
        "absoluteHitCount": absolute_hits,
        "absoluteSampleCount": absolute_sample_count,
        "absoluteHitRatePct": (
            round(absolute_hits / absolute_sample_count * 100, 2)
            if absolute_sample_count
            else None
        ),
        "benchmarkHitCount": benchmark_hits,
        "benchmarkSampleCount": benchmark_sample_count,
        "benchmarkHitRatePct": (
            round(benchmark_hits / benchmark_sample_count * 100, 2)
            if benchmark_sample_count
            else None
        ),
    }


def _public_market_ai_selection_review(
    review: Mapping[str, Any],
) -> dict[str, Any]:
    return {
        **review,
        "items": [
            {
                key: value
                for key, value in item.items()
                if key not in {"outcomeBars", "benchmarkBars"}
            }
            for item in review["items"]
        ],
    }


def _market_ai_selection_rate(numerator: int, denominator: int) -> float | None:
    return round(numerator / denominator * 100, 2) if denominator else None


def _market_ai_selection_boundary() -> dict[str, bool]:
    return {
        "researchOnly": True,
        "watchlistModified": False,
        "researchStarted": False,
        "riskModified": False,
        "autoTradingModified": False,
        "orderSubmissionAllowed": False,
        "routeExecuted": False,
    }


def _market_ai_selection_review_boundary() -> dict[str, bool]:
    return {
        "researchOnly": True,
        "affectsRisk": False,
        "affectsAuthorization": False,
        "affectsPermissions": False,
        "affectsOrderRouting": False,
        "orderSubmissionAllowed": False,
        "routeExecuted": False,
    }


def _require_market_ai_selection_statistics(value: bool) -> None:
    if not value:
        raise ValueError("market_ai_selection_statistics_audit_invalid")


def _market_ai_selection_statistics_invalid() -> MarketAiSelectionError:
    return MarketAiSelectionError(
        "market_ai_selection_statistics_audit_invalid",
        409,
        "AI 选股质量统计检测到无效或冲突的受保护审计记录。",
    )


def _market_ai_selection_id_matches_artifact(
    value: str,
    artifact: Mapping[str, Any],
) -> bool:
    schema_version = artifact.get("schemaVersion")
    if type(schema_version) is not int:
        return False
    pattern = (
        r"selection-[0-9a-f]{20}"
        if schema_version == 1
        else rf"selection-v{_SELECTION_SCHEMA_VERSION}-[0-9a-f]{{20}}"
    )
    if re.fullmatch(pattern, value) is None:
        return False
    if schema_version == _SELECTION_SCHEMA_VERSION:
        identity = artifact.get("selectionIdentity")
        return (
            isinstance(identity, Mapping)
            and _valid_market_ai_selection_identity(identity, artifact)
            and value
            == f"selection-v{_SELECTION_SCHEMA_VERSION}-{canonical_sha256(identity)[:20]}"
        )
    if schema_version != 1:
        return False
    return any(
        value == f"selection-{canonical_sha256(identity)[:20]}"
        for identity in _legacy_market_ai_selection_identities(artifact)
    )


def _valid_market_ai_selection_identity(
    identity: Mapping[str, Any],
    artifact: Mapping[str, Any],
) -> bool:
    fields = {
        "schemaVersion",
        "request",
        "providerIdentity",
        "marketSnapshot",
        "marketContext",
        "newsHash",
        "newsWarnings",
        "exclusions",
        "timedOut",
        "weightsVersion",
        "evidence",
    }
    snapshot = identity.get("marketSnapshot")
    artifact_snapshot = artifact.get("marketSnapshot")
    news_warnings = identity.get("newsWarnings")
    generation = artifact.get("generation")
    if (
        set(identity) != fields
        or identity.get("schemaVersion") != _SELECTION_SCHEMA_VERSION
        or identity.get("request") != artifact.get("request")
        or identity.get("providerIdentity") != artifact.get("providerIdentity")
        or identity.get("marketContext") != artifact.get("marketContext")
        or identity.get("exclusions") != artifact.get("exclusions")
        or identity.get("weightsVersion") != artifact.get("weightsVersion")
        or not isinstance(identity.get("timedOut"), bool)
        or not isinstance(snapshot, Mapping)
        or not isinstance(artifact_snapshot, Mapping)
        or not isinstance(snapshot.get("warnings"), list)
        or not isinstance(artifact_snapshot.get("warnings"), list)
        or not isinstance(news_warnings, list)
        or not all(isinstance(item, str) and item.strip() for item in news_warnings)
        or not isinstance(generation, Mapping)
    ):
        return False
    source_snapshot = {
        **artifact_snapshot,
        "warnings": list(snapshot["warnings"]),
    }
    expected_warnings = [*snapshot["warnings"], *news_warnings]
    if identity["timedOut"]:
        expected_warnings.append("证据组装达到 20 秒预算，已使用按时完成的候选。")
    if generation.get("status") == "failed":
        expected_warnings.append("AI 分析失败，已返回确定性基准榜。")
    return (
        source_snapshot == snapshot
        and list(dict.fromkeys(expected_warnings)) == artifact_snapshot["warnings"]
        and identity.get("newsHash") == canonical_sha256(artifact.get("newsEvidence"))
        and identity.get("evidence") == _market_ai_selection_identity_evidence(artifact)
    )


def _market_ai_selection_identity_evidence(
    artifact: Mapping[str, Any],
) -> list[dict[str, Any]] | None:
    candidates = artifact.get("evidenceCandidates")
    if not isinstance(candidates, list) or not all(
        isinstance(item, Mapping) for item in candidates
    ):
        return None
    try:
        return [
            {
                "evidenceId": item["evidenceId"],
                "evidenceHash": item["evidenceHash"],
                "newsReferences": item["newsReferences"],
            }
            for item in candidates
        ]
    except KeyError:
        return None


def _legacy_market_ai_selection_identities(
    artifact: Mapping[str, Any],
) -> Iterator[dict[str, Any]]:
    snapshot = artifact.get("marketSnapshot")
    warnings = snapshot.get("warnings") if isinstance(snapshot, Mapping) else None
    generation = artifact.get("generation")
    evidence = _market_ai_selection_identity_evidence(artifact)
    required = (
        artifact.get("request"),
        artifact.get("providerIdentity"),
        snapshot,
        artifact.get("marketContext"),
        artifact.get("newsEvidence"),
        artifact.get("exclusions"),
        artifact.get("weightsVersion"),
        generation,
    )
    if (
        any(value is None for value in required)
        or not isinstance(warnings, list)
        or len(warnings) > 16
        or not isinstance(generation, Mapping)
        or evidence is None
    ):
        return
    for timed_out in (False, True):
        identity_warnings = list(warnings)
        if timed_out:
            identity_warnings = [
                warning
                for warning in identity_warnings
                if warning != "证据组装达到 20 秒预算，已使用按时完成的候选。"
            ]
        if generation.get("status") == "failed":
            identity_warnings = [
                warning
                for warning in identity_warnings
                if warning != "AI 分析失败，已返回确定性基准榜。"
            ]
        for split in range(len(identity_warnings) + 1):
            source_warnings = identity_warnings[:split]
            for overlap_mask in range(1 << split):
                news_warnings = [
                    warning
                    for index, warning in enumerate(source_warnings)
                    if overlap_mask & (1 << index)
                ] + identity_warnings[split:]
                expected_warnings = [*source_warnings, *news_warnings]
                if timed_out:
                    expected_warnings.append(
                        "证据组装达到 20 秒预算，已使用按时完成的候选。"
                    )
                if generation.get("status") == "failed":
                    expected_warnings.append("AI 分析失败，已返回确定性基准榜。")
                if list(dict.fromkeys(expected_warnings)) != warnings:
                    continue
                yield {
                    "request": artifact["request"],
                    "providerIdentity": artifact["providerIdentity"],
                    "marketSnapshot": {**snapshot, "warnings": source_warnings},
                    "marketContext": artifact["marketContext"],
                    "newsHash": canonical_sha256(artifact["newsEvidence"]),
                    "newsWarnings": news_warnings,
                    "exclusions": artifact["exclusions"],
                    "timedOut": timed_out,
                    "weightsVersion": artifact["weightsVersion"],
                    "evidence": evidence,
                }


def _valid_statistics_candidate(value: Any, market: str) -> bool:
    if (
        not isinstance(value, Mapping)
        or not isinstance(value.get("snapshot"), Mapping)
        or not isinstance(value.get("fundamental"), Mapping)
    ):
        return False
    return (
        value.get("market") == market
        and value.get("symbol") == value["snapshot"].get("symbol")
        and bool(str(value.get("evidenceId") or "").strip())
        and isinstance(value.get("dataGaps"), list)
        and value["dataGaps"]
        == _market_ai_selection_v1_data_gaps(value["fundamental"], market=market)
        and value.get("evidenceHash")
        == canonical_sha256(
            {
                "candidate": value.get("snapshot"),
                "dailyBars": value.get("dailyBars"),
                "factors": value.get("factors"),
                "fundamental": value.get("fundamental"),
            }
        )
    )


def _valid_statistics_exclusion(value: Any, market: str) -> bool:
    return (
        isinstance(value, Mapping)
        and set(value) == {"market", "symbol", "name", "reason"}
        and value.get("market") == market
        and bool(str(value.get("reason") or "").strip())
    )


def _valid_statistics_generation(value: Any, requested_provider: str) -> bool:
    if not isinstance(value, Mapping) or value.get("requestedProvider") != requested_provider:
        return False
    status = value.get("status")
    used_provider = value.get("usedProvider")
    fallback = value.get("fallbackUsed")
    return (
        requested_provider == "local"
        and status == "skipped"
        and used_provider == "local"
        and fallback is False
    ) or (
        requested_provider != "local"
        and (
            (status == "completed" and used_provider == requested_provider and fallback is False)
            or (status == "failed" and used_provider == "local" and fallback is True)
        )
    )


def _valid_statistics_review_item(
    value: Mapping[str, Any],
    *,
    selection: Mapping[str, Any],
    benchmark: Mapping[str, Any],
    source_run: ResearchRunAudit | None,
    expected_evidence: Mapping[str, Any] | None,
    reviewed_at: datetime,
    schema_version: int,
) -> bool:
    base_fields = {
        "candidateEvidenceId",
        "rank",
        "tier",
        "market",
        "symbol",
        "timeframe",
        "horizon",
        "horizonBars",
        "referenceAt",
        "referencePrice",
    }
    progress_fields = {"completedBars", "remainingBars"}
    outcome_fields = {
        "outcomeAt",
        "outcomePrice",
        "returnPct",
        "absoluteHit",
        "outcomeSource",
        "outcomeAdjustmentMode",
        "outcomeDataHash",
    }
    outcome_bar_fields = {"outcomeBars"}
    benchmark_fields = {
        "benchmarkRunId",
        "benchmarkSymbol",
        "benchmarkReturnPct",
        "relativeReturnPct",
        "benchmarkHit",
        "benchmarkSource",
        "benchmarkAdjustmentMode",
        "benchmarkDataHash",
    }
    benchmark_price_fields = {
        "benchmarkReferencePrice",
        "benchmarkOutcomePrice",
    }
    benchmark_bar_fields = {"benchmarkBars"}
    evidence_id = str(value.get("candidateEvidenceId") or "")
    candidate = next(
        (
            item
            for item in selection["evidenceCandidates"]
            if str(item.get("evidenceId") or "") == evidence_id
        ),
        None,
    )
    recommendation = next(
        (
            item
            for item in selection["recommendations"]
            if str(item.get("evidenceId") or "") == evidence_id
        ),
        None,
    )
    daily_bars = candidate.get("dailyBars") if isinstance(candidate, Mapping) else None
    reference_bar = (
        daily_bars[-1]
        if isinstance(daily_bars, list) and daily_bars
        else None
    )
    reference_price = (
        _finite_or_none(reference_bar.get("close"))
        if isinstance(reference_bar, Mapping)
        else None
    )
    status = value.get("status")
    fields = set(value)
    has_research = "researchRunId" in fields
    has_progress = bool(fields & progress_fields)
    has_outcome = bool(fields & (outcome_fields | outcome_bar_fields))
    has_benchmark = bool(
        fields & (benchmark_fields | benchmark_price_fields | benchmark_bar_fields)
    )
    expected_fields = base_fields | {"status"}
    if has_research:
        expected_fields.add("researchRunId")
    if has_progress:
        expected_fields |= progress_fields
    if has_outcome:
        expected_fields |= outcome_fields
        if schema_version == _REVIEW_SCHEMA_VERSION:
            expected_fields |= outcome_bar_fields
    if has_benchmark:
        expected_fields |= benchmark_fields
        if schema_version == _REVIEW_SCHEMA_VERSION:
            expected_fields |= benchmark_price_fields | benchmark_bar_fields
    if status == "data_insufficient":
        expected_fields.add("reason")
    if fields != expected_fields:
        return False

    horizon_bars = value.get("horizonBars")
    completed_bars = value.get("completedBars")
    remaining_bars = value.get("remainingBars")
    progress_valid = (
        not has_progress
        or isinstance(horizon_bars, int)
        and not isinstance(horizon_bars, bool)
        and isinstance(completed_bars, int)
        and not isinstance(completed_bars, bool)
        and isinstance(remaining_bars, int)
        and not isinstance(remaining_bars, bool)
        and 0 <= completed_bars <= horizon_bars
        and remaining_bars == horizon_bars - completed_bars
    )
    research_valid = (
        has_research
        and isinstance(value.get("researchRunId"), str)
        and bool(str(value["researchRunId"]).strip())
        and source_run is not None
        and expected_evidence is not None
        and source_run.run_id == value["researchRunId"]
        and source_run.market == selection["market"]
        and source_run.symbol == value.get("symbol")
        and source_run.timeframe == "1d"
        and _as_utc(source_run.created_at) <= reviewed_at
        and source_run.data_snapshot.get("marketAiSelectionEvidence")
        == expected_evidence
    )
    reference_at = _parse_datetime(value.get("referenceAt"))
    outcome_at = _parse_datetime(value.get("outcomeAt")) if has_outcome else None
    outcome_price = _finite_or_none(value.get("outcomePrice"))
    return_pct = _finite_or_none(value.get("returnPct"))
    outcome_bars = value.get("outcomeBars")
    normalized_outcome_bars = (
        normalize_snapshot_bars(outcome_bars)
        if schema_version == _REVIEW_SCHEMA_VERSION
        and isinstance(outcome_bars, list)
        else None
    )
    outcome_valid = (
        not has_outcome
        or has_progress
        and completed_bars == horizon_bars
        and remaining_bars == 0
        and reference_price is not None
        and reference_price > 0
        and outcome_price is not None
        and outcome_price > 0
        and return_pct
        == round((outcome_price / reference_price - 1) * 100, 6)
        and value.get("absoluteHit") is (return_pct > 0)
        and reference_at is not None
        and outcome_at is not None
        and reference_at < outcome_at <= reviewed_at
        and bool(str(value.get("outcomeSource") or "").strip())
        and bool(str(value.get("outcomeAdjustmentMode") or "").strip())
        and re.fullmatch(r"[0-9a-f]{64}", str(value.get("outcomeDataHash") or ""))
        is not None
        and (
            schema_version == 1
            or normalized_outcome_bars == outcome_bars
            and len(normalized_outcome_bars) == horizon_bars
            and canonical_sha256(normalized_outcome_bars)
            == value.get("outcomeDataHash")
            and normalized_outcome_bars[-1]["timestamp"] == value.get("outcomeAt")
            and _finite_or_none(normalized_outcome_bars[-1]["close"])
            == outcome_price
            and all(
                reference_at
                < _parse_datetime(item["timestamp"])
                <= outcome_at
                for item in normalized_outcome_bars
            )
        )
    )
    benchmark_start = _finite_or_none(value.get("benchmarkReferencePrice"))
    benchmark_end = _finite_or_none(value.get("benchmarkOutcomePrice"))
    benchmark_return = _finite_or_none(value.get("benchmarkReturnPct"))
    relative_return = _finite_or_none(value.get("relativeReturnPct"))
    benchmark_bars = value.get("benchmarkBars")
    normalized_benchmark_bars = (
        normalize_snapshot_bars(benchmark_bars)
        if schema_version == _REVIEW_SCHEMA_VERSION
        and isinstance(benchmark_bars, list)
        else None
    )
    benchmark_valid = (
        not has_benchmark
        or status == "completed"
        and has_outcome
        and value.get("benchmarkRunId") == benchmark.get("runId")
        and value.get("benchmarkSymbol") == benchmark.get("symbol")
        and benchmark_return is not None
        and (
            schema_version == 1
            or benchmark_start is not None
            and benchmark_start > 0
            and benchmark_end is not None
            and benchmark_end > 0
            and benchmark_return
            == round((benchmark_end / benchmark_start - 1) * 100, 6)
            and normalized_benchmark_bars == benchmark_bars
            and len(normalized_benchmark_bars) == 2
            and canonical_sha256(normalized_benchmark_bars)
            == value.get("benchmarkDataHash")
            and normalized_benchmark_bars[0]["timestamp"]
            == value.get("referenceAt")
            and normalized_benchmark_bars[-1]["timestamp"]
            == value.get("outcomeAt")
            and _finite_or_none(normalized_benchmark_bars[0]["close"])
            == benchmark_start
            and _finite_or_none(normalized_benchmark_bars[-1]["close"])
            == benchmark_end
        )
        and return_pct is not None
        and relative_return == round(return_pct - benchmark_return, 6)
        and value.get("benchmarkHit") is (relative_return > 0)
        and value.get("benchmarkAdjustmentMode")
        == value.get("outcomeAdjustmentMode")
        and bool(str(value.get("benchmarkSource") or "").strip())
        and re.fullmatch(r"[0-9a-f]{64}", str(value.get("benchmarkDataHash") or ""))
        is not None
    )
    common_valid = (
        isinstance(candidate, Mapping)
        and isinstance(recommendation, Mapping)
        and isinstance(reference_bar, Mapping)
        and reference_price is not None
        and value.get("rank") == recommendation.get("rank")
        and value.get("tier") == recommendation.get("tier")
        and value.get("market") == selection["market"]
        and value.get("symbol") == candidate.get("symbol")
        and value.get("timeframe") == "1d"
        and value.get("horizon") == selection["horizon"]
        and value.get("horizonBars")
        == _HORIZON_BARS[selection["market"]][selection["horizon"]]
        and value.get("referenceAt") == reference_bar.get("timestamp")
        and _finite_or_none(value.get("referencePrice")) == reference_price
        and status in {"observing", "data_insufficient", "completed"}
        and progress_valid
        and outcome_valid
        and benchmark_valid
    )
    if not common_valid:
        return False
    if status == "completed":
        return (
            research_valid
            and has_progress
            and has_outcome
            and has_benchmark
            and completed_bars == horizon_bars
            and remaining_bars == 0
        )
    if status == "observing":
        return (
            research_valid
            and has_progress
            and not has_outcome
            and not has_benchmark
            and isinstance(completed_bars, int)
            and completed_bars < horizon_bars
        )
    reasons = {
        "research_evidence_not_bound",
        "outcome_bars_unavailable",
        "outcome_bars_incomplete",
        "outcome_bar_context_mismatch",
        "reference_time_invalid",
        "outcome_reference_bar_missing",
        "outcome_reference_price_mismatch",
        "outcome_bar_gap",
        "review_price_invalid",
        "review_bar_window_invalid",
        "benchmark_must_use_different_symbol",
        "benchmark_bars_unavailable",
        "benchmark_bars_incomplete",
        "benchmark_adjustment_mode_mismatch",
        "benchmark_bar_context_mismatch",
        "benchmark_same_period_coverage_missing",
    }
    reason = value.get("reason")
    return (
        reason in reasons
        and not has_benchmark
        and (
            not has_research
            and reason == "research_evidence_not_bound"
            and not has_progress
            and not has_outcome
            and source_run is None
            and expected_evidence is None
            or research_valid
            and reason != "research_evidence_not_bound"
        )
    )


def _valid_statistics_source_coverage(
    value: Any,
    *,
    generated_at: str,
) -> bool:
    if not isinstance(value, Mapping) or set(value) != {
        "provider",
        "scope",
        "observedAt",
        "sampleCount",
        "mappedCount",
        "ambiguousCount",
        "missingCount",
        "unresolvedCount",
        "mappedRatePct",
    }:
        return False
    counts = [
        value[key]
        for key in (
            "mappedCount",
            "ambiguousCount",
            "missingCount",
            "unresolvedCount",
        )
    ]
    sample_count = value["sampleCount"]
    observed_at = _parse_datetime(value.get("observedAt"))
    selection_at = _parse_datetime(generated_at)
    return (
        value["provider"] == "coingecko-binance"
        and value["scope"] == "prefiltered_candidates"
        and observed_at is not None
        and selection_at is not None
        and observed_at <= selection_at
        and type(sample_count) is int
        and 0 < sample_count <= _EVIDENCE_CANDIDATE_LIMIT
        and all(type(count) is int and count >= 0 for count in counts)
        and sum(counts) == sample_count
        and value["mappedRatePct"]
        == _market_ai_selection_rate(value["mappedCount"], sample_count)
    )


def _technical_factors(bars: Sequence[OHLCVBar]) -> dict[str, float]:
    closes = [float(item.close) for item in bars]
    latest_index = len(closes) - 1
    sma20 = sma(closes, 20, latest_index) or closes[-1]
    sma60 = sma(closes, 60, latest_index) or closes[-1]
    returns = [
        (closes[index] / closes[index - 1]) - 1
        for index in range(1, len(closes))
        if closes[index - 1] > 0
    ]
    recent_returns = returns[-20:]
    mean_return = (
        sum(recent_returns) / len(recent_returns)
        if recent_returns
        else 0.0
    )
    variance = (
        sum((item - mean_return) ** 2 for item in recent_returns)
        / len(recent_returns)
        if recent_returns
        else 0.0
    )
    recent60 = closes[-60:]
    peak = recent60[0]
    max_drawdown = 0.0
    for close in recent60:
        peak = max(peak, close)
        if peak > 0:
            max_drawdown = max(max_drawdown, (peak - close) / peak)
    return {
        "return20Pct": round((closes[-1] / closes[-21] - 1) * 100, 6),
        "return60Pct": round((closes[-1] / closes[-61] - 1) * 100, 6),
        "volatility20Pct": round(math.sqrt(variance) * math.sqrt(252) * 100, 6),
        "sma20GapPct": round((closes[-1] / sma20 - 1) * 100, 6),
        "sma60GapPct": round((closes[-1] / sma60 - 1) * 100, 6),
        "rsi14": round(float(rsi(closes, 14, latest_index) or 50.0), 6),
        "maxDrawdown60Pct": round(max_drawdown * 100, 6),
    }


def _validate_fundamental(
    fundamental: Mapping[str, Any] | None,
    *,
    market: str,
    profile: str,
    candidate: Mapping[str, Any],
    cutoff: datetime,
) -> tuple[bool, str, str]:
    if not isinstance(fundamental, Mapping):
        return False, "fundamental_missing", "必需基本面事实不可用。"
    source_status = fundamental.get("sourceStatus")
    if source_status == "sec_user_agent_invalid":
        return (
            False,
            "sec_user_agent_invalid",
            "SEC EDGAR User-Agent 必须包含有效邮箱或 HTTP(S) 联系方式。",
        )
    if source_status == "sec_ticker_mapping_missing":
        return (
            False,
            "sec_ticker_mapping_missing",
            "美股代码没有可验证的 SEC CIK 映射。",
        )
    crypto_source_errors = {
        "crypto_mapping_ambiguous": "Binance 交易对对应多个 CoinGecko coin_id，已阻断猜测映射。",
        "crypto_mapping_missing": "完整映射扫描未找到该 Binance 交易对。",
        "crypto_mapping_unresolved": "CoinGecko 映射扫描未完成，不能判定币种覆盖。",
        "crypto_mapping_source_invalid": "CoinGecko 交易对映射时间无效、陈旧或被标记为异常。",
        "crypto_market_facts_missing": "已映射币种缺少本次 CoinGecko 市场事实。",
        "crypto_market_facts_timestamp_missing": "CoinGecko 市场事实缺少可验证的更新时间。",
        "crypto_market_facts_timestamp_future": "CoinGecko 市场事实更新时间晚于选股截止时间。",
        "crypto_market_facts_stale": "CoinGecko 市场事实已超过允许的新鲜度。",
        "crypto_market_facts_timestamp_invalid": "CoinGecko 市场事实或映射时间无效。",
    }
    if source_status in crypto_source_errors:
        return False, str(source_status), crypto_source_errors[str(source_status)]
    if market == "crypto":
        required = (
            "coinId",
            "marketCap",
            "circulatingSupply",
            "bidAskSpreadPct",
            "binanceQuoteVolume",
        )
        if (
            any(not fundamental.get(field) for field in ("coinId",))
            or any(
                not _positive_number(fundamental.get(field))
                for field in required[1:]
            )
            or not (
                _positive_number(fundamental.get("totalSupply"))
                or _positive_number(fundamental.get("maxSupply"))
            )
            or str(fundamental.get("mappedFrom") or "").casefold()
            != f"binance:{str(candidate['symbol']).upper()}".casefold()
        ):
            return (
                False,
                "crypto_fundamental_incomplete",
                "缺少精确币种映射、市值、供应量、成交额或买卖价差。",
            )
        return True, "", ""
    required_numbers = (
        "currentRevenue",
        "previousRevenue",
        "currentNetProfit",
        "previousNetProfit",
        "totalAssets",
        "shareholdersEquity",
    )
    if any(
        _finite_or_none(fundamental.get(field)) is None
        for field in required_numbers
    ):
        return (
            False,
            "stock_fundamental_incomplete",
            "缺少当前及上一可比期营收、净利润、总资产或股东权益。",
        )
    current_period = _parse_datetime(fundamental.get("currentPeriod"))
    previous_period = _parse_datetime(fundamental.get("previousPeriod"))
    disclosed_at = _parse_datetime(fundamental.get("disclosedAt"))
    if (
        current_period is None
        or previous_period is None
        or disclosed_at is None
        or current_period <= previous_period
        or current_period > _as_utc(cutoff)
        or previous_period > _as_utc(cutoff)
        or disclosed_at > _as_utc(cutoff)
    ):
        return (
            False,
            "stock_fundamental_period_invalid",
            "基本面报告期、可比期或披露截止时间无效。",
        )
    if _as_utc(cutoff) - current_period > _STOCK_FUNDAMENTAL_MAX_AGE:
        return (
            False,
            "stock_fundamental_stale",
            "最新可用基本面报告期已超过允许的新鲜度。",
        )
    verification = fundamental.get("sourceVerification")
    if fundamental.get("conflict") is True or (
        isinstance(verification, Mapping)
        and verification.get("status") == "conflict"
    ):
        return (
            False,
            "stock_fundamental_conflict",
            "双源财务事实存在单位或报告期冲突。",
        )
    if profile == "value":
        valuation = _stock_valuation(candidate, fundamental)
        if not any(
            _positive_number(valuation.get(field))
            for field in ("peRatio", "pbRatio", "psRatio")
        ):
            return (
                False,
                "valuation_missing",
                "价值风格至少需要一个可复算估值指标。",
            )
    return True, "", ""


def _stock_valuation(
    candidate: Mapping[str, Any],
    fundamental: Mapping[str, Any],
) -> dict[str, float | None]:
    pe = _positive_or_none(candidate.get("peRatio"))
    pb = _positive_or_none(candidate.get("pbRatio"))
    market_cap = _positive_or_none(candidate.get("marketCap"))
    if market_cap is None:
        shares = _positive_or_none(fundamental.get("sharesOutstanding"))
        price = _positive_or_none(candidate.get("price"))
        if shares is not None and price is not None:
            market_cap = shares * price
    revenue = _positive_or_none(fundamental.get("currentRevenue"))
    net_profit = _positive_or_none(fundamental.get("currentNetProfit"))
    equity = _positive_or_none(fundamental.get("shareholdersEquity"))
    return {
        "peRatio": pe or (
            market_cap / net_profit
            if market_cap is not None and net_profit is not None
            else None
        ),
        "pbRatio": pb or (
            market_cap / equity
            if market_cap is not None and equity is not None
            else None
        ),
        "psRatio": (
            market_cap / revenue
            if market_cap is not None and revenue is not None
            else None
        ),
    }


def _market_ai_selection_v1_data_gaps(
    fundamental: Mapping[str, Any],
    *,
    market: str,
) -> list[str]:
    gaps: list[str] = []
    verification = fundamental.get("sourceVerification")
    if market == "ashare" and not (
        isinstance(verification, Mapping)
        and verification.get("status") == "verified"
    ):
        gaps.append("A 股财务事实尚未完成双源复核")
    if market != "crypto":
        valuation = fundamental.get("valuation")
        if not isinstance(valuation, Mapping) or not any(
            _positive_number(valuation.get(field))
            for field in ("peRatio", "pbRatio", "psRatio")
        ):
            gaps.append("缺少可复算估值指标")
    if market == "crypto" and not _positive_number(
        fundamental.get("fullyDilutedValuation")
    ):
        gaps.append("缺少完全稀释估值")
    return gaps


def _score_candidates(
    candidates: Sequence[Mapping[str, Any]],
    *,
    market: str,
    profile: str,
) -> list[dict[str, Any]]:
    enriched = [dict(item) for item in candidates]
    raw_by_candidate = [
        (
            _crypto_raw_pillars(item)
            if market == "crypto"
            else _stock_raw_pillars(item)
        )
        for item in enriched
    ]
    pillar_names = (
        tuple(_CRYPTO_WEIGHTS[profile])
        if market == "crypto"
        else tuple(_STOCK_WEIGHTS[profile])
    )
    weights = (
        _CRYPTO_WEIGHTS[profile]
        if market == "crypto"
        else _STOCK_WEIGHTS[profile]
    )
    for pillar in pillar_names:
        values = [raw[pillar] for raw in raw_by_candidate]
        scores = _winsorized_scores(values)
        for index, score in enumerate(scores):
            enriched[index].setdefault("pillarScores", {})[pillar] = round(
                score,
                2,
            )
    for item in enriched:
        item["score"] = round(
            sum(
                float(item["pillarScores"][pillar]) * weights[pillar]
                for pillar in pillar_names
            ),
            2,
        )
    enriched.sort(
        key=lambda item: (
            -float(item["score"]),
            str(item["symbol"]),
        )
    )
    return enriched


def _stock_raw_pillars(candidate: Mapping[str, Any]) -> dict[str, float]:
    facts = candidate["fundamental"]
    factors = candidate["factors"]
    revenue = float(facts["currentRevenue"])
    previous_revenue = float(facts["previousRevenue"])
    profit = float(facts["currentNetProfit"])
    previous_profit = float(facts["previousNetProfit"])
    equity = float(facts["shareholdersEquity"])
    valuation = facts.get("valuation")
    ratios = valuation if isinstance(valuation, Mapping) else {}
    inverse_valuations = [
        1 / float(value)
        for field in ("peRatio", "pbRatio", "psRatio")
        if (value := _positive_or_none(ratios.get(field))) is not None
    ]
    amount = _positive_or_none(candidate["snapshot"].get("amount")) or 1.0
    return {
        "quality": (
            (profit / equity if equity else -1)
            + (profit / revenue if revenue else -1)
        ),
        "growth": (
            (revenue / previous_revenue - 1 if previous_revenue else -1)
            + (profit / previous_profit - 1 if previous_profit else -1)
        ),
        "valuation": (
            sum(inverse_valuations) / len(inverse_valuations)
            if inverse_valuations
            else -1.0
        ),
        "trend": (
            float(factors["return20Pct"])
            + float(factors["return60Pct"])
            + float(factors["sma20GapPct"])
            + float(factors["sma60GapPct"])
        ),
        "liquidityRisk": (
            math.log1p(amount)
            - float(factors["volatility20Pct"]) / 10
            - float(factors["maxDrawdown60Pct"]) / 5
        ),
    }


def _crypto_raw_pillars(candidate: Mapping[str, Any]) -> dict[str, float]:
    facts = candidate["fundamental"]
    factors = candidate["factors"]
    market_cap = float(facts["marketCap"])
    circulating = float(facts["circulatingSupply"])
    total = float(facts.get("maxSupply") or facts.get("totalSupply"))
    fdv = _positive_or_none(facts.get("fullyDilutedValuation"))
    amount = float(facts["binanceQuoteVolume"])
    spread = float(facts["bidAskSpreadPct"])
    return {
        "maturity": math.log1p(market_cap),
        "supply": (
            circulating / total
            - ((fdv / market_cap) - 1 if fdv is not None and market_cap else 0)
        ),
        "liquidity": math.log1p(amount) - spread,
        "trend": (
            float(factors["return20Pct"])
            + float(factors["return60Pct"])
            + float(factors["sma20GapPct"])
            + float(factors["sma60GapPct"])
        ),
        "risk": (
            -float(factors["volatility20Pct"])
            - float(factors["maxDrawdown60Pct"])
        ),
    }


def _winsorized_scores(values: Sequence[float]) -> list[float]:
    finite = [float(value) for value in values if math.isfinite(float(value))]
    if not finite:
        return [50.0 for _ in values]
    low = _percentile(finite, 0.05)
    high = _percentile(finite, 0.95)
    if math.isclose(low, high):
        return [50.0 for _ in values]
    return [
        max(0.0, min(100.0, (min(high, max(low, float(value))) - low) / (high - low) * 100))
        for value in values
    ]


def _percentile(values: Sequence[float], fraction: float) -> float:
    ordered = sorted(float(item) for item in values)
    if len(ordered) == 1:
        return ordered[0]
    position = (len(ordered) - 1) * fraction
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[lower]
    weight = position - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight


def _ashare_financial_source_unit(
    rows: Sequence[Mapping[str, Any]],
) -> tuple[str, float] | None:
    currencies: set[str] = set()
    scales: set[float] = set()
    for row in rows:
        raw_currency = _first_value(
            row,
            "币种",
            "货币单位",
            "CURRENCY",
            "CURRENCY_NAME",
        )
        if raw_currency is not None:
            currency = _normalize_ashare_currency(raw_currency)
            if currency is None:
                return None
            currencies.add(currency)
        raw_scale = _first_value(
            row,
            "单位",
            "金额单位",
            "MONETARY_UNIT",
            "UNIT",
        )
        if raw_scale is not None:
            normalized = _normalize_ashare_scale(raw_scale)
            if normalized is None:
                return None
            currency, scale = normalized
            currencies.add(currency)
            scales.add(scale)
    if len(currencies) != 1 or len(scales) > 1:
        return None
    return next(iter(currencies)), next(iter(scales)) if scales else 1.0


def _normalize_ashare_currency(value: Any) -> str | None:
    normalized = str(value).strip().upper().replace(" ", "")
    if normalized in {"CNY", "RMB", "人民币", "人民币元"}:
        return "CNY"
    if normalized in {"USD", "美元", "美元元"}:
        return "USD"
    return None


def _normalize_ashare_scale(value: Any) -> tuple[str, float] | None:
    normalized = str(value).strip().upper().replace(" ", "")
    return {
        "元": ("CNY", 1.0),
        "人民币元": ("CNY", 1.0),
        "万元": ("CNY", 10_000.0),
        "亿元": ("CNY", 100_000_000.0),
        "美元": ("USD", 1.0),
        "万美元": ("USD", 10_000.0),
        "亿美元": ("USD", 100_000_000.0),
    }.get(normalized)


def parse_ashare_financial_reports(
    income_source: Any,
    balance_source: Any,
    *,
    cutoff: datetime,
    source: str = "akshare-sina-financial-report",
) -> dict[str, Any] | None:
    income_rows = _frame_records(income_source)
    balance_rows = _frame_records(balance_source)
    source_unit = _ashare_financial_source_unit([*income_rows, *balance_rows])
    source_scale = source_unit[1] if source_unit is not None else 1.0
    cutoff_utc = _as_utc(cutoff)
    incomes: list[dict[str, Any]] = []
    for row in income_rows:
        period = _parse_datetime(
            _first_value(
                row,
                "报告日",
                "报告期",
                "截止日期",
                "报告日期",
                "REPORT_DATE",
            )
        )
        disclosed = _parse_datetime(
            _first_value(
                row,
                "公告日期",
                "披露日期",
                "更新日期",
                "发布日期",
                "NOTICE_DATE",
                "UPDATE_DATE",
            )
        )
        revenue = _number_from_record(
            row,
            "营业总收入",
            "营业收入",
            "营业收入合计",
            "TOTAL_OPERATE_INCOME",
            "OPERATE_INCOME",
        )
        profit = _number_from_record(
            row,
            "归属于母公司股东的净利润",
            "归属于母公司所有者的净利润",
            "归属于母公司的净利润",
            "归母净利润",
            "净利润",
            "PARENT_NETPROFIT",
            "NETPROFIT",
        )
        if (
            period is not None
            and disclosed is not None
            and period <= cutoff_utc
            and disclosed <= cutoff_utc
            and revenue is not None
            and profit is not None
        ):
            incomes.append(
                {
                    "period": period,
                    "disclosed": disclosed,
                    "revenue": revenue * source_scale,
                    "profit": profit * source_scale,
                }
            )
    incomes.sort(key=lambda item: (item["period"], item["disclosed"]), reverse=True)
    if len(incomes) < 2:
        return None
    current = incomes[0]
    previous = next(
        (
            item
            for item in incomes[1:]
            if _comparable_period(current["period"], item["period"])
        ),
        None,
    )
    if previous is None:
        return None
    balances: list[dict[str, Any]] = []
    for row in balance_rows:
        period = _parse_datetime(
            _first_value(
                row,
                "报告日",
                "报告期",
                "截止日期",
                "报告日期",
                "REPORT_DATE",
            )
        )
        disclosed = _parse_datetime(
            _first_value(
                row,
                "公告日期",
                "披露日期",
                "更新日期",
                "发布日期",
                "NOTICE_DATE",
                "UPDATE_DATE",
            )
        )
        assets = _number_from_record(
            row,
            "资产总计",
            "总资产",
            "TOTAL_ASSETS",
        )
        equity = _number_from_record(
            row,
            "归属于母公司股东权益合计",
            "归属于母公司所有者权益合计",
            "归属于母公司股东的权益",
            "股东权益合计",
            "所有者权益合计",
            "TOTAL_PARENT_EQUITY",
            "TOTAL_EQUITY",
        )
        if (
            period is not None
            and disclosed is not None
            and period <= cutoff_utc
            and disclosed <= cutoff_utc
            and assets is not None
            and equity is not None
        ):
            balances.append(
                {
                    "period": period,
                    "disclosed": disclosed,
                    "assets": assets * source_scale,
                    "equity": equity * source_scale,
                }
            )
    balances.sort(key=lambda item: (item["period"], item["disclosed"]), reverse=True)
    balance = next(
        (
            item
            for item in balances
            if item["period"].date() == current["period"].date()
        ),
        None,
    )
    if balance is None:
        return None
    disclosed_at = max(current["disclosed"], balance["disclosed"])
    return {
        "currentRevenue": current["revenue"],
        "previousRevenue": previous["revenue"],
        "currentNetProfit": current["profit"],
        "previousNetProfit": previous["profit"],
        "totalAssets": balance["assets"],
        "shareholdersEquity": balance["equity"],
        "currentPeriod": current["period"].isoformat(),
        "previousPeriod": previous["period"].isoformat(),
        "disclosedAt": disclosed_at.isoformat(),
        "monetaryUnit": source_unit[0] if source_unit is not None else None,
        "sourceMonetaryScale": source_unit[1] if source_unit is not None else None,
        "source": source,
        "dualSourceStatus": "not_available",
        "sourceVerification": {
            "status": "not_available",
            "sources": [source],
        },
        "conflict": False,
    }


def compare_stock_fundamental_sources(
    primary: Mapping[str, Any],
    secondary: Mapping[str, Any] | None,
    *,
    relative_tolerance: float = 0.01,
) -> dict[str, Any]:
    if not isinstance(secondary, Mapping):
        return {
            "status": "not_available",
            "sources": [str(primary.get("source") or "primary")],
        }
    sources = [
        str(primary.get("source") or "primary"),
        str(secondary.get("source") or "secondary"),
    ]
    if sources[0].strip().casefold() == sources[1].strip().casefold():
        return {
            "status": "conflict",
            "sources": sources,
            "reason": "sources_not_independent",
        }
    units = [
        str(primary.get("monetaryUnit") or "").strip().casefold(),
        str(secondary.get("monetaryUnit") or "").strip().casefold(),
    ]
    if not all(units):
        return {
            "status": "conflict",
            "sources": sources,
            "reason": "unit_unknown",
        }
    if units[0] != units[1]:
        return {
            "status": "conflict",
            "sources": sources,
            "reason": "unit_mismatch",
        }
    if (
        primary.get("currentPeriod") != secondary.get("currentPeriod")
        or primary.get("previousPeriod") != secondary.get("previousPeriod")
    ):
        return {
            "status": "conflict",
            "sources": sources,
            "reason": "report_period_mismatch",
        }
    mismatches: list[str] = []
    for field in (
        "currentRevenue",
        "previousRevenue",
        "currentNetProfit",
        "previousNetProfit",
        "totalAssets",
        "shareholdersEquity",
    ):
        left = _finite_or_none(primary.get(field))
        right = _finite_or_none(secondary.get(field))
        if left is None or right is None:
            mismatches.append(field)
            continue
        scale = max(abs(left), abs(right), 1.0)
        if abs(left - right) / scale > relative_tolerance:
            mismatches.append(field)
    return {
        "status": "conflict" if mismatches else "verified",
        "sources": sources,
        "mismatchedFields": mismatches,
    }


def parse_sec_companyfacts(
    payload: Any,
    *,
    cutoff: datetime,
) -> dict[str, Any] | None:
    if not isinstance(payload, Mapping):
        return None
    facts = payload.get("facts")
    us_gaap = facts.get("us-gaap") if isinstance(facts, Mapping) else None
    dei = facts.get("dei") if isinstance(facts, Mapping) else None
    if not isinstance(us_gaap, Mapping):
        return None
    revenues = _sec_fact_values(
        us_gaap,
        (
            "RevenueFromContractWithCustomerExcludingAssessedTax",
            "Revenues",
            "SalesRevenueNet",
        ),
        cutoff=cutoff,
        duration=True,
    )
    profits = _sec_fact_values(
        us_gaap,
        ("NetIncomeLoss", "ProfitLoss"),
        cutoff=cutoff,
        duration=True,
    )
    assets = _sec_fact_values(
        us_gaap,
        ("Assets",),
        cutoff=cutoff,
        duration=False,
    )
    equities = _sec_fact_values(
        us_gaap,
        (
            "StockholdersEquity",
            "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
        ),
        cutoff=cutoff,
        duration=False,
    )
    shares = _sec_fact_values(
        dei if isinstance(dei, Mapping) else {},
        ("EntityCommonStockSharesOutstanding",),
        cutoff=cutoff,
        duration=False,
        unit_names=("shares",),
    )
    share_periods = {(item["start"], item["end"]) for item in shares}
    shares.extend(
        item
        for item in _sec_fact_values(
            us_gaap,
            ("CommonStockSharesOutstanding",),
            cutoff=cutoff,
            duration=False,
            unit_names=("shares",),
        )
        if (item["start"], item["end"]) not in share_periods
    )
    shares.sort(key=lambda item: (item["end"], item["filed"]), reverse=True)
    if not revenues or not profits or not assets or not equities:
        return None
    current_revenue = revenues[0]
    previous_revenue = _previous_comparable_sec_fact(revenues, current_revenue)
    current_profit = _matching_sec_fact(profits, current_revenue)
    previous_profit = (
        _matching_sec_fact(profits, previous_revenue)
        if previous_revenue is not None
        else None
    )
    current_assets = _latest_sec_instant(assets, current_revenue["end"])
    current_equity = _latest_sec_instant(equities, current_revenue["end"])
    if (
        previous_revenue is None
        or current_profit is None
        or previous_profit is None
        or current_assets is None
        or current_equity is None
    ):
        return None
    disclosed = max(
        item["filed"]
        for item in (
            current_revenue,
            previous_revenue,
            current_profit,
            previous_profit,
            current_assets,
            current_equity,
        )
    )
    latest_shares = next(
        (
            item
            for item in shares
            if abs(item["end"] - current_revenue["end"])
            <= _STOCK_SHARES_MAX_PERIOD_DISTANCE
        ),
        None,
    )
    return {
        "currentRevenue": current_revenue["value"],
        "previousRevenue": previous_revenue["value"],
        "currentNetProfit": current_profit["value"],
        "previousNetProfit": previous_profit["value"],
        "totalAssets": current_assets["value"],
        "shareholdersEquity": current_equity["value"],
        "sharesOutstanding": latest_shares["value"] if latest_shares else None,
        "currentPeriod": current_revenue["end"].isoformat(),
        "previousPeriod": previous_revenue["end"].isoformat(),
        "disclosedAt": disclosed.isoformat(),
        "source": "sec-companyfacts",
        "conflict": False,
    }


def _sec_fact_values(
    facts: Mapping[str, Any],
    tags: Sequence[str],
    *,
    cutoff: datetime,
    duration: bool,
    unit_names: Sequence[str] = ("USD",),
) -> list[dict[str, Any]]:
    cutoff_utc = _as_utc(cutoff)
    values: list[dict[str, Any]] = []
    for tag_priority, tag in enumerate(tags):
        fact = facts.get(tag)
        units = fact.get("units") if isinstance(fact, Mapping) else None
        if not isinstance(units, Mapping):
            continue
        rows: list[Any] = []
        for unit_name in unit_names:
            unit_rows = units.get(unit_name)
            if isinstance(unit_rows, list):
                rows.extend(unit_rows)
        for row in rows:
            if not isinstance(row, Mapping):
                continue
            end = _parse_datetime(row.get("end"))
            start = _parse_datetime(row.get("start"))
            filed = _parse_datetime(row.get("filed"))
            value = _finite_or_none(row.get("val"))
            form = str(row.get("form") or "")
            if (
                end is None
                or filed is None
                or end > cutoff_utc
                or filed > cutoff_utc
                or value is None
                or form not in {"10-K", "10-Q", "20-F", "40-F"}
                or (duration and start is None)
                or (not duration and start is not None)
            ):
                continue
            values.append(
                {
                    "tag": tag,
                    "start": start,
                    "end": end,
                    "filed": filed,
                    "value": value,
                    "form": form,
                    "fy": row.get("fy"),
                    "fp": str(row.get("fp") or ""),
                    "tagPriority": tag_priority,
                }
            )
    latest_by_period: dict[tuple[Any, ...], dict[str, Any]] = {}
    for item in values:
        key = (item["start"], item["end"])
        previous = latest_by_period.get(key)
        if (
            previous is None
            or item["tagPriority"] < previous["tagPriority"]
            or item["tagPriority"] == previous["tagPriority"]
            and item["filed"] > previous["filed"]
        ):
            latest_by_period[key] = item
    ordered = sorted(
        latest_by_period.values(),
        key=lambda item: (item["end"], item["filed"]),
        reverse=True,
    )
    return [
        {key: value for key, value in item.items() if key != "tagPriority"}
        for item in ordered
    ]


def _previous_comparable_sec_fact(
    values: Sequence[Mapping[str, Any]],
    current: Mapping[str, Any],
) -> Mapping[str, Any] | None:
    current_fp = str(current.get("fp") or "")
    for item in values[1:]:
        if (
            item["end"] < current["end"]
            and (
                not current_fp
                or not item.get("fp")
                or item.get("fp") == current_fp
            )
        ):
            return item
    return None


def _matching_sec_fact(
    values: Sequence[Mapping[str, Any]],
    reference: Mapping[str, Any] | None,
) -> Mapping[str, Any] | None:
    if reference is None:
        return None
    exact = [
        item
        for item in values
        if item["end"] == reference["end"]
        and item.get("start") == reference.get("start")
    ]
    return exact[0] if exact else None


def _latest_sec_instant(
    values: Sequence[Mapping[str, Any]],
    period_end: datetime,
) -> Mapping[str, Any] | None:
    eligible = [item for item in values if item["end"] <= period_end]
    return eligible[0] if eligible else None


def _sec_ticker_map(payload: Any) -> dict[str, str]:
    if not isinstance(payload, Mapping):
        return {}
    result: dict[str, str] = {}
    for row in payload.values():
        if not isinstance(row, Mapping):
            continue
        ticker = str(row.get("ticker") or "").strip().upper()
        cik = row.get("cik_str")
        if ticker and type(cik) is int and cik >= 0:
            result[ticker] = f"{cik:010d}"
    return result


def build_coingecko_binance_mapping(
    tickers: Sequence[Mapping[str, Any]],
) -> dict[str, dict[str, Any]]:
    grouped: dict[str, list[Mapping[str, Any]]] = {}
    for ticker in tickers:
        base = str(ticker.get("base") or "").strip().upper()
        target = str(ticker.get("target") or "").strip().upper()
        coin_id = str(ticker.get("coin_id") or "").strip()
        if not base or target != "USDT" or not coin_id:
            continue
        grouped.setdefault(f"{base}/{target}", []).append(ticker)
    result: dict[str, dict[str, Any]] = {}
    for pair, rows in grouped.items():
        coin_ids = {str(item.get("coin_id") or "").strip() for item in rows}
        if len(coin_ids) != 1:
            result[pair] = {
                "status": "ambiguous",
                "coinIds": sorted(coin_ids),
            }
            observed_times = [
                value
                for item in rows
                if (value := _parse_datetime(item.get("last_fetch_at"))) is not None
            ]
            if observed_times:
                result[pair]["observedAt"] = min(observed_times).isoformat()
            continue
        best = min(
            rows,
            key=lambda item: (
                _positive_or_none(item.get("bid_ask_spread_percentage"))
                or float("inf")
            ),
        )
        result[pair] = {
            "status": "mapped",
            "coinId": next(iter(coin_ids)),
            "bidAskSpreadPct": _positive_or_none(
                best.get("bid_ask_spread_percentage")
            ),
        }
        observed_at = str(best.get("last_fetch_at") or "").strip()
        if observed_at:
            result[pair]["observedAt"] = observed_at
    return result


def _valid_coingecko_ticker_observation(
    value: Mapping[str, Any],
    *,
    cutoff: datetime,
) -> bool:
    observed_at = _parse_datetime(value.get("last_fetch_at"))
    return (
        observed_at is not None
        and observed_at <= cutoff
        and cutoff - observed_at <= _CRYPTO_FUNDAMENTAL_TTL
        and value.get("is_stale") is False
        and value.get("is_anomaly") is False
    )


def _coingecko_mapping_entry_expired(
    value: Any,
    *,
    cutoff: datetime,
) -> bool:
    if not isinstance(value, Mapping):
        return True
    observed_at = _parse_datetime(value.get("observedAt") or value.get("checkedAt"))
    return (
        observed_at is None
        or observed_at > cutoff
        or cutoff - observed_at > _CRYPTO_FUNDAMENTAL_TTL
    )


def _valid_crypto_fundamental_observation(
    value: Mapping[str, Any],
    *,
    cutoff: datetime,
) -> bool:
    observed_at = _parse_datetime(value.get("observedAt"))
    mapping_observed_at = _parse_datetime(value.get("mappingObservedAt"))
    return all(
        timestamp is not None
        and timestamp <= cutoff
        and cutoff - timestamp <= _CRYPTO_FUNDAMENTAL_TTL
        for timestamp in (observed_at, mapping_observed_at)
    )


def _coingecko_mapping_coverage(
    mapping: Mapping[str, Any],
    required_pairs: set[str],
    *,
    observed_at: datetime,
) -> dict[str, Any]:
    statuses = Counter(
        (
            str(mapping[pair].get("status"))
            if isinstance(mapping.get(pair), Mapping)
            and mapping[pair].get("status") in {"mapped", "ambiguous", "missing"}
            else "unresolved"
        )
        for pair in required_pairs
    )
    sample_count = len(required_pairs)
    return {
        "provider": "coingecko-binance",
        "scope": "prefiltered_candidates",
        "observedAt": observed_at.isoformat(),
        "sampleCount": sample_count,
        "mappedCount": statuses["mapped"],
        "ambiguousCount": statuses["ambiguous"],
        "missingCount": statuses["missing"],
        "unresolvedCount": statuses["unresolved"],
        "mappedRatePct": _market_ai_selection_rate(statuses["mapped"], sample_count),
    }


def _coingecko_mapping_observed_at(
    mapping: Mapping[str, Any],
    required_pairs: set[str],
    *,
    fallback: datetime,
) -> datetime:
    observed = [
        timestamp
        for pair in required_pairs
        if isinstance((item := mapping.get(pair)), Mapping)
        if (
            timestamp := _parse_datetime(
                item.get("observedAt") or item.get("checkedAt")
            )
        )
        is not None
    ]
    return min(observed) if observed else fallback


def _coingecko_mapping_incomplete(
    mapping: Mapping[str, Any],
    required_pairs: set[str],
) -> bool:
    return any(
        not isinstance(mapping.get(pair), Mapping)
        or mapping[pair].get("status") == "unresolved"
        for pair in required_pairs
    )


def _frame_records(value: Any) -> list[Mapping[str, Any]]:
    if isinstance(value, list):
        return [item for item in value if isinstance(item, Mapping)]
    to_dict = getattr(value, "to_dict", None)
    if callable(to_dict):
        try:
            records = to_dict("records")
        except Exception:
            return []
        if isinstance(records, list):
            return [item for item in records if isinstance(item, Mapping)]
    return []


def _first_value(row: Mapping[str, Any], *names: str) -> Any:
    for name in names:
        if name in row and row[name] not in {None, ""}:
            return row[name]
    return None


def _number_from_record(row: Mapping[str, Any], *names: str) -> float | None:
    raw = _first_value(row, *names)
    if isinstance(raw, str):
        cleaned = raw.replace(",", "").strip()
        if cleaned in {"", "-", "--", "nan", "None"}:
            return None
        multiplier = 1.0
        if cleaned.endswith("亿"):
            multiplier = 100_000_000.0
            cleaned = cleaned[:-1]
        elif cleaned.endswith("万"):
            multiplier = 10_000.0
            cleaned = cleaned[:-1]
        try:
            return float(cleaned) * multiplier
        except ValueError:
            return None
    return _finite_or_none(raw)


def _comparable_period(current: datetime, previous: datetime) -> bool:
    return (
        current.month == previous.month
        and current.day == previous.day
        and current.year == previous.year + 1
    )


def _normalize_news(
    value: Any,
    *,
    cutoff: datetime,
    prefix: str,
) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    cutoff_utc = _as_utc(cutoff)
    normalized: list[dict[str, Any]] = []
    seen: set[str] = set()
    for raw in value:
        if not isinstance(raw, Mapping):
            continue
        headline = re.sub(r"\s+", " ", str(raw.get("headline") or "")).strip()
        published = _parse_datetime(raw.get("publishedAt"))
        if not headline or published is None or published > cutoff_utc:
            continue
        identifier = str(raw.get("id") or canonical_sha256(headline)[:16])
        evidence_id = f"news-{prefix}-{identifier}"
        if evidence_id in seen:
            continue
        seen.add(evidence_id)
        normalized.append(
            {
                "evidenceId": evidence_id,
                "headline": headline[:240],
                "summary": re.sub(
                    r"\s+",
                    " ",
                    str(raw.get("summary") or ""),
                ).strip()[:280],
                "publishedAt": published.isoformat(),
                "source": str(raw.get("source") or "unknown")[:80],
                "scope": str(raw.get("scope") or ""),
                "url": (
                    str(raw.get("url"))
                    if isinstance(raw.get("url"), str)
                    and str(raw.get("url")).startswith(("http://", "https://"))
                    else None
                ),
            }
        )
    return normalized


def _attach_news(
    candidates: Sequence[dict[str, Any]],
    news: Mapping[str, Sequence[Mapping[str, Any]]],
) -> None:
    market_references = [
        str(item["evidenceId"])
        for item in news.get("market", [])
        if isinstance(item, Mapping) and item.get("evidenceId")
    ]
    for candidate in candidates:
        own = news.get(str(candidate["evidenceId"]), [])
        candidate["newsReferences"] = list(
            dict.fromkeys(
                [
                    candidate["evidenceId"],
                    *market_references,
                    *[
                        str(item["evidenceId"])
                        for item in own
                        if isinstance(item, Mapping) and item.get("evidenceId")
                    ],
                ]
            )
        )


def _public_candidate(candidate: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "evidenceId": candidate["evidenceId"],
        "market": candidate["market"],
        "symbol": candidate["symbol"],
        "name": candidate["name"],
        "score": candidate["score"],
        "pillarScores": dict(candidate["pillarScores"]),
        "fundamentalPeriod": candidate["fundamentalPeriod"],
        "dataGaps": list(candidate["dataGaps"]),
    }


def _baseline_recommendations(
    candidates: Sequence[Mapping[str, Any]],
    *,
    horizon: str,
) -> list[dict[str, Any]]:
    recommendations: list[dict[str, Any]] = []
    for index, candidate in enumerate(candidates, start=1):
        market = str(candidate["market"])
        tier = "priority_research" if index <= 3 else "watch"
        recommendations.append(
            _recommendation(
                candidate,
                {
                    "rank": index,
                    "tier": tier,
                    "reasons": [
                        f"确定性风格评分位列第 {index}，适合优先进入既有研究链。",
                        f"观察周期固定为 {_HORIZON_LABELS[market][horizon]}。",
                    ],
                    "risks": (
                        ["历史波动和基本面事实不能保证未来表现。"]
                        + (
                            ["存在已披露的数据缺口，研究时需继续核验。"]
                            if candidate["dataGaps"]
                            else []
                        )
                    ),
                    "evidenceReferences": list(candidate["newsReferences"]),
                    "summary": "这是确定性研究候选，不构成买卖或仓位建议。",
                },
            )
        )
    return recommendations


def _recommendation(
    candidate: Mapping[str, Any],
    assessment: Mapping[str, Any],
) -> dict[str, Any]:
    return {
        **_public_candidate(candidate),
        "rank": int(assessment["rank"]),
        "tier": str(assessment["tier"]),
        "reasons": [str(item) for item in assessment["reasons"]],
        "risks": [str(item) for item in assessment["risks"]],
        "evidenceReferences": [
            str(item) for item in assessment["evidenceReferences"]
        ],
        "summary": str(assessment["summary"]),
    }


def _external_evidence(
    candidates: Sequence[Mapping[str, Any]],
    *,
    request: Mapping[str, Any],
    news: Mapping[str, Sequence[Mapping[str, Any]]],
    market_context: Mapping[str, Any],
    market_snapshot: Mapping[str, Any],
) -> dict[str, Any]:
    normalized_context = {
        field: value
        for field in (
            "universeCount",
            "advancing",
            "declining",
            "flat",
            "totalAmount",
        )
        if (value := _finite_or_none(market_context.get(field))) is not None
    }
    return {
        "market": request["market"],
        "profile": request["profile"],
        "horizon": request["horizon"],
        "horizonLabel": _HORIZON_LABELS[str(request["market"])][
            str(request["horizon"])
        ],
        "weightsVersion": _WEIGHTS_VERSION,
        "candidates": [
            {
                "evidenceId": item["evidenceId"],
                "market": item["market"],
                "symbol": item["symbol"],
                "name": item["name"],
                "deterministicScore": item["score"],
                "pillarScores": item["pillarScores"],
                "technicalFactors": item["factors"],
                "fundamentalFacts": item["fundamental"],
                "fundamentalPeriod": item["fundamentalPeriod"],
                "dataGaps": item["dataGaps"],
                "evidenceReferences": item["newsReferences"],
            }
            for item in candidates
        ],
        "marketContext": {
            "overview": normalized_context,
            "snapshotIdentity": {
                "snapshotHash": market_snapshot.get("snapshotHash"),
                "observedAt": market_snapshot.get("observedAt"),
                "source": market_snapshot.get("source"),
                "freshness": market_snapshot.get("freshness"),
            },
        },
        "marketNews": [
            {
                "evidenceId": item["evidenceId"],
                "headline": item["headline"],
                "summary": item["summary"],
                "publishedAt": item["publishedAt"],
                "source": item["source"],
            }
            for item in news.get("market", [])
        ],
        "candidateNews": [
            {
                "candidateEvidenceId": candidate["evidenceId"],
                "items": [
                    {
                        "evidenceId": item["evidenceId"],
                        "headline": item["headline"],
                        "summary": item["summary"],
                        "publishedAt": item["publishedAt"],
                        "source": item["source"],
                    }
                    for item in news.get(str(candidate["evidenceId"]), [])
                ],
            }
            for candidate in candidates[:10]
        ],
        "safetyBoundary": {
            "researchOnly": True,
            "tradingAuthority": False,
            "routingAuthority": False,
        },
    }


def _failed_generation(
    provider_id: str,
    provider_status: Any,
    error_code: str,
) -> dict[str, Any]:
    return {
        "requestedProvider": provider_id,
        "usedProvider": "local",
        "status": "failed",
        "fallbackUsed": True,
        "model": getattr(provider_status, "model", None),
        "sanitizedBaseUrl": getattr(
            provider_status,
            "sanitized_base_url",
            None,
        ),
        "latencyMs": 0,
        "externalDataApproved": True,
        "outboundFields": [],
        "errorCode": error_code,
    }


def _provider_identity(
    registry: AiReviewProviderRegistry,
    provider_id: str,
) -> dict[str, Any]:
    status = next(
        (
            item
            for item in registry.statuses()
            if item.provider_id == provider_id
        ),
        None,
    )
    return {
        "providerId": provider_id,
        "configured": bool(status.configured) if status is not None else False,
        "model": status.model if status is not None else None,
        "sanitizedBaseUrl": (
            status.sanitized_base_url if status is not None else None
        ),
    }


def _validated_chinese_text_list(value: Any, *, maximum: int) -> list[str]:
    if not isinstance(value, list) or not 1 <= len(value) <= maximum:
        raise ValueError("market_ai_selection_output_invalid")
    normalized: list[str] = []
    for item in value:
        if (
            not isinstance(item, str)
            or not item.strip()
            or len(item.strip()) > 180
            or not _HAN_TEXT.search(item)
        ):
            raise ValueError("market_ai_selection_output_invalid")
        normalized.append(item.strip())
    return normalized


def _contains_secret_text(value: Any) -> bool:
    if isinstance(value, str):
        return contains_ai_review_secret_text(value)
    if isinstance(value, Mapping):
        return any(_contains_secret_text(item) for item in value.values())
    if isinstance(value, (list, tuple)):
        return any(_contains_secret_text(item) for item in value)
    return False


def _exclusion(
    candidate: Mapping[str, Any],
    code: str,
    detail: str,
) -> dict[str, Any]:
    return {
        "market": str(candidate.get("market") or ""),
        "symbol": str(candidate.get("symbol") or ""),
        "name": str(candidate.get("name") or ""),
        "reason": detail,
    }


def _split_crypto_symbol(value: str) -> tuple[str, str]:
    normalized = value.strip().upper()
    if "/" in normalized:
        base, target = normalized.split("/", 1)
    elif normalized.endswith("USDT"):
        base, target = normalized[:-4], "USDT"
    else:
        return normalized, ""
    return base, target


def _us_quote_is_fresh(quote_at: datetime, *, cutoff: datetime) -> bool:
    normalized_quote = _as_utc(quote_at)
    normalized_cutoff = _as_utc(cutoff)
    if normalized_quote > normalized_cutoff:
        return False
    calendar = build_market_calendar_status("us", at=normalized_cutoff)
    if calendar.get("status") == "open":
        return normalized_cutoff - normalized_quote <= _US_QUOTE_FRESHNESS
    trading_day = _parse_datetime(str(calendar.get("tradingDay") or ""))
    return (
        trading_day is not None
        and normalized_quote.date()
        >= trading_day.date() - timedelta(days=4)
    )


def _parse_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return _as_utc(value)
    if not isinstance(value, str) or not value.strip():
        return None
    normalized = value.strip().replace("Z", "+00:00")
    try:
        return _as_utc(datetime.fromisoformat(normalized))
    except ValueError:
        for pattern in ("%Y%m%d", "%Y-%m-%d", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(normalized, pattern).replace(
                    tzinfo=timezone.utc
                )
            except ValueError:
                continue
    return None


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _finite_or_none(value: Any) -> float | None:
    if isinstance(value, bool) or value is None or isinstance(value, (str, bytes)):
        return None
    try:
        normalized = float(value)
    except (TypeError, ValueError):
        return None
    return normalized if math.isfinite(normalized) else None


def _positive_or_none(value: Any) -> float | None:
    normalized = _finite_or_none(value)
    return normalized if normalized is not None and normalized > 0 else None


def _positive_number(value: Any) -> bool:
    return _positive_or_none(value) is not None


def _default_fetch_json(
    url: str,
    headers: Mapping[str, str],
    timeout_seconds: float = 10.0,
) -> Any:
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "AIQuantificationTools/1.0",
            **dict(headers),
        },
        method="GET",
    )
    with urlopen(
        request,
        timeout=max(0.1, min(10.0, timeout_seconds)),
    ) as response:
        return json.loads(response.read().decode("utf-8"))
