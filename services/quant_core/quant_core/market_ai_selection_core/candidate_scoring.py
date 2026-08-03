from __future__ import annotations

import math
import re
from collections.abc import Mapping, Sequence
from datetime import timedelta
from typing import Any

from quant_core.domain import OHLCVBar
from quant_core.indicators import rsi, sma

from .common import (
    _as_utc,
    _finite_or_none,
    _parse_datetime,
    _positive_number,
    _positive_or_none,
)
from .contracts import (
    _CRYPTO_WEIGHTS,
    _EVIDENCE_CANDIDATE_LIMIT,
    _STOCK_FUNDAMENTAL_MAX_AGE,
    _STOCK_WEIGHTS,
)
from .recommendations import _exclusion

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
        mismatched = (
            verification.get("mismatchedFields")
            if isinstance(verification, Mapping)
            else None
        )
        labels = [
            label
            for field, label in (
                ("currentRevenue", "本期营收"),
                ("previousRevenue", "上期营收"),
                ("currentNetProfit", "本期净利润"),
                ("previousNetProfit", "上期净利润"),
                ("totalAssets", "总资产"),
                ("shareholdersEquity", "股东权益"),
            )
            if isinstance(mismatched, list) and field in mismatched
        ]
        structural_detail = {
            "sources_not_independent": "双源财务事实来源不独立。",
            "unit_unknown": "双源财务事实缺少可核验货币单位。",
            "unit_mismatch": "双源财务事实货币单位不一致。",
            "report_period_mismatch": "双源财务事实报告期不一致。",
        }.get(
            str(verification.get("reason") or "")
            if isinstance(verification, Mapping)
            else ""
        )
        return (
            False,
            "stock_fundamental_conflict",
            (
                f"双源财务事实字段不一致：{'、'.join(labels)}。"
                if labels
                else structural_detail
                or "双源财务事实存在未分类冲突。"
            ),
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
