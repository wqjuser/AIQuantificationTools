from __future__ import annotations

import json
import math
import re
import time
from collections.abc import Callable, Mapping, Sequence
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
from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar
from quant_core.indicators import rsi, sma
from quant_core.market_discovery import MarketDiscoveryQuery
from quant_core.market_information import MarketInformationQuery
from quant_core.market_calendar import build_market_calendar_status


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
_CRYPTO_FUNDAMENTAL_TTL = timedelta(minutes=5)
_MARKET_SNAPSHOT_FRESHNESS = timedelta(minutes=5)
_US_QUOTE_FRESHNESS = _MARKET_SNAPSHOT_FRESHNESS


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
    if (
        not isinstance(artifact, Mapping)
        or artifact.get("schemaVersion") != 1
        or artifact.get("recordType") != "aiqt.marketAiSelection"
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

_STOCK_WEIGHTS: dict[str, dict[str, float]] = {
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
_CRYPTO_WEIGHTS: dict[str, dict[str, float]] = {
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
        generated_at = _as_utc(self.clock())
        evidence_deadline = self.monotonic() + _EVIDENCE_BUDGET_SECONDS
        source_candidates, market_snapshot, market_context, source_exclusions = (
            self._authoritative_candidates(request, generated_at=generated_at)
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
            source_timed_out = self._prepare_fundamental_sources(
                prefiltered,
                market=str(request["market"]),
                cutoff=generated_at,
                deadline=evidence_deadline,
            )
        except Exception as error:
            raise MarketAiSelectionError(
                "market_ai_selection_fundamental_source_unavailable",
                502,
                "必需基本面数据源暂不可用。",
            ) from error

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
        evidence_identity = canonical_sha256(
            {
                "request": request,
                "providerIdentity": provider_identity,
                "marketSnapshot": market_snapshot,
                "marketContext": market_context,
                "newsHash": canonical_sha256(news),
                "newsWarnings": news_warnings,
                "exclusions": exclusions,
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
        )
        selection_id = f"selection-{evidence_identity[:20]}"
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
        boundary = {
            "researchOnly": True,
            "watchlistModified": False,
            "researchStarted": False,
            "riskModified": False,
            "autoTradingModified": False,
            "orderSubmissionAllowed": False,
            "routeExecuted": False,
        }
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
            "schemaVersion": 1,
            "recordType": "aiqt.marketAiSelection",
            "selectionId": selection_id,
            "generatedAt": generated_at.isoformat(),
            "request": request,
            "marketSnapshot": market_snapshot,
            "marketContext": market_context,
            "weightsVersion": _WEIGHTS_VERSION,
            "providerIdentity": provider_identity,
            "weights": (
                _CRYPTO_WEIGHTS[request["profile"]]
                if request["market"] == "crypto"
                else _STOCK_WEIGHTS[request["profile"]]
            ),
            "initialCandidates": source_candidates,
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
        if observed_at > generated_at:
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
                "dataGaps": _data_gaps(
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
        if cached is not None:
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
    ) -> bool:
        if market != "crypto" or self.fundamental_loaders.get("crypto") is not None:
            return False
        required_pairs = {
            f"{base}/{target}"
            for item in candidates
            if (base := _split_crypto_symbol(str(item["symbol"]))[0])
            and (target := _split_crypto_symbol(str(item["symbol"]))[1])
        }
        mapping, timed_out = self._ensure_coingecko_mapping(
            required_pairs,
            cutoff=cutoff,
            deadline=deadline,
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
            return timed_out
        if self.monotonic() >= deadline:
            return True
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
        if not isinstance(payload, list):
            return timed_out or self.monotonic() >= deadline
        for row in payload:
            if (
                isinstance(row, Mapping)
                and isinstance(row.get("id"), str)
                and row["id"] in missing_ids
            ):
                self._cache_put(
                    f"source:coingecko-market:{row['id']}",
                    dict(row),
                    now=cutoff,
                )
        return timed_out or self.monotonic() >= deadline

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
        if not _valid_sec_user_agent(self.sec_user_agent):
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
        if not isinstance(mapped, Mapping) or not mapped.get("coinId"):
            return None
        coin_id = str(mapped["coinId"])
        row = self._cache_get(
            f"source:coingecko-market:{coin_id}",
            ttl=_CRYPTO_FUNDAMENTAL_TTL,
            now=cutoff,
        )
        if not isinstance(row, Mapping):
            return None
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
            "observedAt": cutoff.isoformat(),
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
        if isinstance(cached, Mapping) and required_pairs <= set(cached):
            return cached, False
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
            missing = required_pairs - set(existing)
            if not missing:
                return existing, False
            ticker_rows: list[Mapping[str, Any]] = []
            timed_out = False
            last_required_pair = max(required_pairs) if required_pairs else ""
            for page in range(1, 21):
                if self.monotonic() >= effective_deadline:
                    timed_out = True
                    break
                payload = self._read_json(
                    "https://api.coingecko.com/api/v3/exchanges/binance/tickers?"
                    + urlencode({"page": page, "order": "base_target"}),
                    {"Accept": "application/json"},
                    deadline=effective_deadline,
                )
                rows = (
                    payload.get("tickers")
                    if isinstance(payload, Mapping)
                    else None
                )
                if not isinstance(rows, list) or not rows:
                    break
                ticker_rows.extend(
                    item for item in rows if isinstance(item, Mapping)
                )
                page_pairs = [
                    f"{str(item.get('base') or '').strip().upper()}/"
                    f"{str(item.get('target') or '').strip().upper()}"
                    for item in rows
                    if isinstance(item, Mapping)
                    and item.get("base")
                    and item.get("target")
                ]
                if (
                    len(rows) < 100
                    or (
                        last_required_pair
                        and page_pairs
                        and max(page_pairs) > last_required_pair
                    )
                ):
                    break
            discovered = build_coingecko_binance_mapping(ticker_rows)
            existing.update(discovered)
            for pair in missing - set(discovered):
                existing[pair] = None
            self._cache_put(key, existing, now=cutoff)
            return existing, timed_out or self.monotonic() >= effective_deadline

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


def _data_gaps(
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


def parse_ashare_financial_reports(
    income_source: Any,
    balance_source: Any,
    *,
    cutoff: datetime,
    source: str = "akshare-sina-financial-report",
) -> dict[str, Any] | None:
    income_rows = _frame_records(income_source)
    balance_rows = _frame_records(balance_source)
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
                    "revenue": revenue,
                    "profit": profit,
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
                    "assets": assets,
                    "equity": equity,
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
        us_gaap,
        ("EntityCommonStockSharesOutstanding", "CommonStocksIncludingAdditionalPaidInCapital"),
        cutoff=cutoff,
        duration=False,
        unit_names=("shares",),
    )
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
    latest_shares = _latest_sec_instant(shares, current_revenue["end"]) if shares else None
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
    for tag in tags:
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
                }
            )
        if values:
            break
    latest_by_period: dict[tuple[Any, ...], dict[str, Any]] = {}
    for item in values:
        key = (item["start"], item["end"], item["form"], item["fp"])
        previous = latest_by_period.get(key)
        if previous is None or item["filed"] > previous["filed"]:
            latest_by_period[key] = item
    return sorted(
        latest_by_period.values(),
        key=lambda item: (item["end"], item["filed"]),
        reverse=True,
    )


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
) -> dict[str, dict[str, Any] | None]:
    grouped: dict[str, list[Mapping[str, Any]]] = {}
    for ticker in tickers:
        base = str(ticker.get("base") or "").strip().upper()
        target = str(ticker.get("target") or "").strip().upper()
        coin_id = str(ticker.get("coin_id") or "").strip()
        if not base or target != "USDT" or not coin_id:
            continue
        grouped.setdefault(f"{base}/{target}", []).append(ticker)
    result: dict[str, dict[str, Any] | None] = {}
    for pair, rows in grouped.items():
        coin_ids = {str(item.get("coin_id") or "").strip() for item in rows}
        if len(coin_ids) != 1:
            result[pair] = None
            continue
        best = min(
            rows,
            key=lambda item: (
                _positive_or_none(item.get("bid_ask_spread_percentage"))
                or float("inf")
            ),
        )
        result[pair] = {
            "coinId": next(iter(coin_ids)),
            "bidAskSpreadPct": _positive_or_none(
                best.get("bid_ask_spread_percentage")
            ),
        }
    return result


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


def _valid_sec_user_agent(value: str) -> bool:
    normalized = value.strip()
    return (
        8 <= len(normalized) <= 255
        and bool(
            re.search(
                r"(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|https?://\S+)",
                normalized,
            )
        )
    )


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
