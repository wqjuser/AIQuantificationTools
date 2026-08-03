from __future__ import annotations

from collections import Counter
from collections.abc import Mapping, Sequence
from datetime import datetime
from typing import Any

from .common import (
    _as_utc,
    _finite_or_none,
    _market_ai_selection_rate,
    _parse_datetime,
    _positive_or_none,
)
from .contracts import (
    _CRYPTO_FUNDAMENTAL_TTL,
    _STOCK_SHARES_MAX_PERIOD_DISTANCE,
)

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
