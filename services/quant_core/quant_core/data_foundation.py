from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timedelta, timezone
from typing import Any

from quant_core.canonical import canonical_data_hash, canonical_sha256, normalize_snapshot_bars
from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar
from quant_core.market_calendar import build_market_calendar_status


_TIMEFRAME_SECONDS = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "30m": 1_800,
    "60m": 3_600,
    "1d": 86_400,
    "1w": 604_800,
}


def assess_market_data_quality(
    request: MarketDataRequest,
    bars: list[OHLCVBar],
    quality: DataQuality,
    *,
    observed_at: datetime | None = None,
) -> DataQuality:
    observed = _aware(observed_at or datetime.now(timezone.utc))
    calendar = build_market_calendar_status(request.market, at=observed)
    issues: list[dict[str, Any]] = []
    timestamps = [bar.timestamp for bar in bars]
    contexts = {(bar.market, bar.symbol, bar.timeframe) for bar in bars}

    if not quality.is_complete:
        _add_issue(issues, "upstream_incomplete", "blocked", 1, "The source marked this window incomplete.")
    if contexts and contexts != {(request.market, request.symbol, request.timeframe)}:
        _add_issue(issues, "context_mismatch", "blocked", 1, "Bars do not match the requested market context.")
    duplicate_count = len(timestamps) - len(set(timestamps))
    if duplicate_count:
        _add_issue(issues, "duplicate_timestamp", "blocked", duplicate_count, "Duplicate timestamps were detected.")
    disorder_count = sum(current < previous for previous, current in zip(timestamps, timestamps[1:]))
    if disorder_count:
        _add_issue(issues, "timestamp_disorder", "blocked", disorder_count, "Bars are not ordered by timestamp.")

    normalized: list[dict[str, Any]] = []
    if bars and not duplicate_count:
        try:
            normalized = normalize_snapshot_bars(bars)
        except ValueError as error:
            _add_issue(issues, str(error), "blocked", 1, _canonical_error_message(str(error)))
    elif not bars:
        _add_issue(issues, "empty_window", "blocked", 1, "No OHLCV bars were returned.")

    sorted_bars = sorted(bars, key=lambda bar: bar.timestamp)
    gap_count = market_data_gap_count(request, sorted_bars)
    if gap_count:
        severity = "blocked" if request.market == "crypto" or request.timeframe not in {"1d", "1w"} else "warning"
        _add_issue(issues, "missing_bar_gap", severity, gap_count, "Expected bar intervals are missing.")

    forming_count = sum(not _bar_is_complete(request, bar, observed, calendar) for bar in sorted_bars)
    if forming_count:
        _add_issue(issues, "forming_bar", "warning", forming_count, "The window contains a bar that is still forming.")

    market_time = sorted_bars[-1].timestamp if sorted_bars else None
    freshness = _freshness(request, market_time, observed, calendar, source=quality.source)
    if freshness == "stale":
        _add_issue(issues, "stale_data", "warning", 1, "The latest market bar is stale for this context.")

    warnings = list(dict.fromkeys([
        *quality.warnings,
        *(str(issue["message"]) for issue in issues),
    ]))
    expected_rows = len(sorted_bars) + gap_count
    coverage = {
        "actualRows": len(sorted_bars),
        "expectedRows": expected_rows,
        "gapCount": gap_count,
        "ratio": round(len(sorted_bars) / expected_rows, 6) if expected_rows else 0.0,
    }
    blocking = any(issue["severity"] == "blocked" for issue in issues)
    return replace(
        quality,
        is_complete=quality.is_complete and not blocking,
        warnings=warnings,
        rows=len(bars),
        observed_at=observed,
        market_time=_aware(market_time) if market_time else None,
        calendar_id=f"{request.market}:{calendar['timezone']}:{calendar['source']}",
        freshness=freshness,
        coverage=coverage,
        canonical_hash=canonical_data_hash(normalized) if normalized else "",
        issues=issues,
        origin_source=quality.origin_source or quality.source,
    )


def completed_market_bars(
    request: MarketDataRequest,
    bars: list[OHLCVBar],
    *,
    observed_at: datetime,
) -> list[OHLCVBar]:
    observed = _aware(observed_at)
    calendar = build_market_calendar_status(request.market, at=observed)
    return sorted(
        (
            bar
            for bar in bars
            if _bar_is_complete(request, bar, observed, calendar)
        ),
        key=lambda bar: bar.timestamp,
    )


def data_quality_to_payload(quality: DataQuality) -> dict[str, object]:
    return {
        "source": quality.source,
        "originSource": quality.origin_source,
        "isComplete": quality.is_complete,
        "warnings": list(quality.warnings),
        "rows": quality.rows,
        "observedAt": quality.observed_at.isoformat() if quality.observed_at else None,
        "marketTime": quality.market_time.isoformat() if quality.market_time else None,
        "calendarId": quality.calendar_id,
        "adjustmentMode": quality.adjustment_mode,
        "freshness": quality.freshness,
        "coverage": dict(quality.coverage),
        "canonicalHash": quality.canonical_hash,
        "issues": [dict(issue) for issue in quality.issues],
    }


def data_quality_from_payload(payload: dict[str, Any]) -> DataQuality:
    warnings = payload.get("warnings")
    issues = payload.get("issues")
    coverage = payload.get("coverage")
    return DataQuality(
        source=str(payload.get("source") or "unknown"),
        origin_source=_optional_string(payload.get("originSource")),
        is_complete=bool(payload.get("isComplete", payload.get("is_complete", False))),
        warnings=[str(item) for item in warnings] if isinstance(warnings, list) else [],
        rows=max(0, _int(payload.get("rows"))),
        observed_at=_optional_datetime(payload.get("observedAt")),
        market_time=_optional_datetime(payload.get("marketTime")),
        calendar_id=_optional_string(payload.get("calendarId")),
        adjustment_mode=str(payload.get("adjustmentMode") or "none"),
        freshness=str(payload.get("freshness") or "unknown"),
        coverage=dict(coverage) if isinstance(coverage, dict) else {},
        canonical_hash=str(payload.get("canonicalHash") or ""),
        issues=[dict(item) for item in issues if isinstance(item, dict)] if isinstance(issues, list) else [],
    )


def build_cross_source_difference_report(
    primary_source: str,
    primary_bars: list[OHLCVBar],
    secondary_source: str,
    secondary_bars: list[OHLCVBar],
) -> dict[str, Any]:
    primary = {row["timestamp"]: row for row in normalize_snapshot_bars(primary_bars)}
    secondary = {row["timestamp"]: row for row in normalize_snapshot_bars(secondary_bars)}
    common = sorted(primary.keys() & secondary.keys())
    if not common:
        return unavailable_cross_source_report(
            primary_source,
            secondary_source,
            "no_overlapping_rows",
        )

    fields: dict[str, dict[str, Any]] = {}
    differences: list[dict[str, Any]] = []
    status = "agreement"
    for field in ("open", "high", "low", "close", "volume"):
        threshold_warning, threshold_blocked = ((0.005, 0.02) if field != "volume" else (0.05, 0.25))
        field_differences = [
            _relative_difference(float(primary[timestamp][field]), float(secondary[timestamp][field]))
            for timestamp in common
        ]
        maximum = max(field_differences, default=0.0)
        classification = "blocked" if maximum > threshold_blocked else "warning" if maximum > threshold_warning else "agreement"
        status = _stronger_status(status, classification)
        fields[field] = {
            "classification": classification,
            "maxRelativeDifference": round(maximum, 8),
            "warningThreshold": threshold_warning,
            "blockedThreshold": threshold_blocked,
        }
        for timestamp, difference in zip(common, field_differences):
            if difference > threshold_warning:
                differences.append({
                    "timestamp": timestamp,
                    "field": field,
                    "relativeDifference": round(difference, 8),
                    "classification": "blocked" if difference > threshold_blocked else "warning",
                })

    overlap_ratio = len(common) / max(len(primary), len(secondary))
    if overlap_ratio < 0.5:
        status = "blocked"
    elif overlap_ratio < 0.8:
        status = _stronger_status(status, "warning")
    report = {
        "schemaVersion": 1,
        "status": status,
        "primarySource": primary_source,
        "secondarySource": secondary_source,
        "primaryRows": len(primary),
        "secondaryRows": len(secondary),
        "overlapRows": len(common),
        "overlapRatio": round(overlap_ratio, 6),
        "fields": fields,
        "differences": sorted(
            differences,
            key=lambda item: (-float(item["relativeDifference"]), str(item["timestamp"]), str(item["field"])),
        )[:20],
        "valuesMerged": False,
        "reason": None,
    }
    report["reportHash"] = canonical_sha256(report)
    return report


def unavailable_cross_source_report(primary_source: str, secondary_source: str, reason: str) -> dict[str, Any]:
    report = {
        "schemaVersion": 1,
        "status": "unavailable",
        "primarySource": primary_source,
        "secondarySource": secondary_source,
        "primaryRows": 0,
        "secondaryRows": 0,
        "overlapRows": 0,
        "overlapRatio": 0.0,
        "fields": {},
        "differences": [],
        "valuesMerged": False,
        "reason": reason,
    }
    report["reportHash"] = canonical_sha256(report)
    return report


def normalize_cross_source_difference_report(value: object) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    report = dict(value)
    supplied_hash = report.pop("reportHash", None)
    if report.get("schemaVersion") != 1:
        raise ValueError("source_comparison_schema_invalid")
    if report.get("status") not in {"agreement", "warning", "blocked", "unavailable"}:
        raise ValueError("source_comparison_status_invalid")
    required_fields = {
        "primarySource",
        "secondarySource",
        "primaryRows",
        "secondaryRows",
        "overlapRows",
        "overlapRatio",
        "fields",
        "differences",
        "reason",
    }
    numeric_fields = ("primaryRows", "secondaryRows", "overlapRows", "overlapRatio")
    if (
        not isinstance(supplied_hash, str)
        or not required_fields.issubset(report)
        or not isinstance(report["primarySource"], str)
        or not isinstance(report["secondarySource"], str)
        or any(
            isinstance(report[field], bool) or not isinstance(report[field], (int, float))
            for field in numeric_fields
        )
        or not isinstance(report["fields"], dict)
        or not isinstance(report["differences"], list)
        or (report["reason"] is not None and not isinstance(report["reason"], str))
    ):
        raise ValueError("source_comparison_schema_invalid")
    if report.get("valuesMerged") is not False:
        raise ValueError("source_comparison_values_must_not_be_merged")
    if supplied_hash != canonical_sha256(report):
        raise ValueError("source_comparison_hash_mismatch")
    report["reportHash"] = supplied_hash
    return report


def offline_replay_evidence(bars: list[OHLCVBar | dict[str, Any]], expected_hash: str) -> dict[str, Any]:
    normalized = normalize_snapshot_bars(bars)
    actual_hash = canonical_data_hash(normalized)
    if actual_hash != expected_hash:
        raise ValueError("data_snapshot_hash_mismatch")
    return {
        "status": "verified",
        "mode": "embedded_snapshot",
        "rows": len(normalized),
        "canonicalHash": actual_hash,
        "networkRequired": False,
    }


def market_data_gap_count(request: MarketDataRequest, bars: list[OHLCVBar]) -> int:
    if len(bars) < 2:
        return 0
    step = _TIMEFRAME_SECONDS[request.timeframe]
    gaps = 0
    for previous, current in zip(bars, bars[1:]):
        delta = int((current.timestamp - previous.timestamp).total_seconds())
        if delta <= step:
            continue
        if request.market == "crypto":
            gaps += max(1, round(delta / step) - 1)
        elif request.timeframe == "1d":
            gaps += _weekday_gap_count(previous, current)
        elif request.timeframe == "1w":
            gaps += max(0, round(delta / step) - 1)
        elif _same_equity_session(request.market, previous.timestamp, current.timestamp):
            gaps += max(1, round(delta / step) - 1)
    return gaps


def _weekday_gap_count(previous: OHLCVBar, current: OHLCVBar) -> int:
    day = previous.timestamp.date() + timedelta(days=1)
    missing = 0
    while day < current.timestamp.date():
        missing += int(day.weekday() < 5)
        day += timedelta(days=1)
    return missing


def _same_equity_session(market: str, previous: datetime, current: datetime) -> bool:
    if previous.date() != current.date():
        return False
    if market == "ashare":
        previous_minute = previous.hour * 60 + previous.minute
        current_minute = current.hour * 60 + current.minute
        return (
            570 <= previous_minute <= 690 and 570 <= current_minute <= 690
        ) or (
            780 <= previous_minute <= 900 and 780 <= current_minute <= 900
        )
    return current - previous <= timedelta(hours=8)


def _bar_is_complete(
    request: MarketDataRequest,
    bar: OHLCVBar,
    observed: datetime,
    calendar: dict[str, object],
) -> bool:
    if request.timeframe == "1d" and request.market != "crypto":
        trading_day = datetime.fromisoformat(str(calendar["tradingDay"])).date()
        if bar.timestamp.date() < trading_day:
            return True
        return (
            bar.timestamp.date() == trading_day
            and calendar.get("status") == "closed"
            and calendar.get("session") == "after_hours"
        )
    return _aware(bar.timestamp) + timedelta(seconds=_TIMEFRAME_SECONDS[request.timeframe]) <= observed


def _freshness(
    request: MarketDataRequest,
    market_time: datetime | None,
    observed: datetime,
    calendar: dict[str, object],
    *,
    source: str,
) -> str:
    if market_time is None:
        return "unknown"
    market_timestamp = _aware(market_time)
    age = observed - market_timestamp
    if request.end and _aware(request.end) < observed - timedelta(days=2):
        return "historical"
    if request.timeframe == "1w":
        stale = age > timedelta(days=14)
    elif request.timeframe == "1d":
        stale = age > timedelta(days=7 if request.market != "crypto" else 3)
    elif request.market == "crypto" or calendar.get("status") == "open":
        stale = age > timedelta(seconds=max(120, _TIMEFRAME_SECONDS[request.timeframe] * 2))
    else:
        trading_day = datetime.fromisoformat(str(calendar["tradingDay"])).date()
        stale = market_timestamp.date() < trading_day - timedelta(days=4)
    if stale and source == "local-cache":
        return "historical"
    return "stale" if stale else "fresh"


def _add_issue(
    issues: list[dict[str, Any]],
    code: str,
    severity: str,
    count: int,
    message: str,
) -> None:
    issues.append({
        "code": code,
        "severity": severity,
        "count": max(1, int(count)),
        "message": message,
    })


def _canonical_error_message(code: str) -> str:
    return {
        "data_snapshot_duplicate_timestamp": "Duplicate timestamps were detected.",
        "data_snapshot_ohlc_relationship_invalid": "An OHLC relationship is invalid.",
        "data_snapshot_number_must_be_finite": "A market value is not finite.",
        "data_snapshot_price_invalid": "A price is not positive.",
        "data_snapshot_volume_invalid": "A volume is negative.",
    }.get(code, "The market data window failed canonical validation.")


def _relative_difference(first: float, second: float) -> float:
    return abs(first - second) / max(abs(first), abs(second), 1e-12)


def _stronger_status(current: str, candidate: str) -> str:
    order = {"agreement": 0, "warning": 1, "blocked": 2}
    return candidate if order[candidate] > order[current] else current


def _aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _optional_datetime(value: object) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return _aware(datetime.fromisoformat(value.replace("Z", "+00:00")))
    except ValueError:
        return None


def _optional_string(value: object) -> str | None:
    text = str(value or "").strip()
    return text or None


def _int(value: object) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0
