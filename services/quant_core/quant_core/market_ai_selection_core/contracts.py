from __future__ import annotations

import math
import re
from collections.abc import Callable, Mapping
from datetime import datetime, timedelta
from typing import Any

from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar

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
