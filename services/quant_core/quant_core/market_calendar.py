from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo


@dataclass(frozen=True)
class MarketSessionTemplate:
    market: str
    timezone_name: str
    sessions: tuple[tuple[str, time, time], ...]
    warning: str | None = None


MARKET_SESSION_TEMPLATES: dict[str, MarketSessionTemplate] = {
    "ashare": MarketSessionTemplate(
        market="ashare",
        timezone_name="Asia/Shanghai",
        sessions=(
            ("morning", time(9, 30), time(11, 30)),
            ("afternoon", time(13, 0), time(15, 0)),
        ),
        warning="Static session template only; exchange holiday calendar is not configured.",
    ),
    "us": MarketSessionTemplate(
        market="us",
        timezone_name="America/New_York",
        sessions=(("regular", time(9, 30), time(16, 0)),),
        warning="Static session template only; exchange holiday calendar is not configured.",
    ),
    "crypto": MarketSessionTemplate(
        market="crypto",
        timezone_name="UTC",
        sessions=(),
        warning=None,
    ),
}


def build_market_calendar_status(market: str, at: datetime | str | None = None) -> dict[str, object]:
    normalized_market = (market or "").strip().lower()
    template = MARKET_SESSION_TEMPLATES.get(normalized_market)
    if not template:
        raise ValueError(f"Unsupported market calendar: {market}")

    market_timezone = ZoneInfo(template.timezone_name)
    as_of = _coerce_datetime(at).astimezone(market_timezone)
    trading_day = as_of.date()

    if normalized_market == "crypto":
        return {
            "market": normalized_market,
            "timezone": template.timezone_name,
            "status": "always_open",
            "isOpen": True,
            "session": "continuous",
            "asOf": _iso(as_of),
            "tradingDay": trading_day.isoformat(),
            "nextOpen": None,
            "nextClose": None,
            "detail": "Crypto markets trade continuously; exchange maintenance windows are not modeled.",
            "warnings": [],
            "source": "static-session-template",
        }

    warnings = [template.warning] if template.warning else []
    sessions = tuple(
        (label, _combine(trading_day, start, market_timezone), _combine(trading_day, end, market_timezone))
        for label, start, end in template.sessions
    )

    if trading_day.weekday() >= 5:
        next_open = _next_session_open(trading_day + timedelta(days=1), template, market_timezone)
        return _status_payload(
            template=template,
            as_of=as_of,
            trading_day=trading_day,
            status="closed",
            is_open=False,
            session="weekend",
            next_open=next_open,
            next_close=None,
            detail=f"{_market_label(normalized_market)} is closed for the weekend.",
            warnings=warnings,
        )

    first_label, first_start, _first_end = sessions[0]
    if as_of < first_start:
        return _status_payload(
            template=template,
            as_of=as_of,
            trading_day=trading_day,
            status="closed",
            is_open=False,
            session="pre_open",
            next_open=first_start,
            next_close=None,
            detail=f"{_market_label(normalized_market)} opens at {_iso(first_start)}.",
            warnings=warnings,
        )

    for index, (label, start, end) in enumerate(sessions):
        if start <= as_of < end:
            return _status_payload(
                template=template,
                as_of=as_of,
                trading_day=trading_day,
                status="open",
                is_open=True,
                session=label,
                next_open=None,
                next_close=end,
                detail=f"{_market_label(normalized_market)} is open in the {label} session.",
                warnings=warnings,
            )
        if index + 1 < len(sessions):
            next_label, next_start, _next_end = sessions[index + 1]
            if end <= as_of < next_start:
                return _status_payload(
                    template=template,
                    as_of=as_of,
                    trading_day=trading_day,
                    status="break",
                    is_open=False,
                    session="lunch_break" if normalized_market == "ashare" else f"before_{next_label}",
                    next_open=next_start,
                    next_close=None,
                    detail=f"{_market_label(normalized_market)} is between sessions until {_iso(next_start)}.",
                    warnings=warnings,
                )

    next_open = _next_session_open(trading_day + timedelta(days=1), template, market_timezone)
    return _status_payload(
        template=template,
        as_of=as_of,
        trading_day=trading_day,
        status="closed",
        is_open=False,
        session="after_hours",
        next_open=next_open,
        next_close=None,
        detail=f"{_market_label(normalized_market)} is closed after regular trading hours.",
        warnings=warnings,
    )


def _status_payload(
    *,
    template: MarketSessionTemplate,
    as_of: datetime,
    trading_day: date,
    status: str,
    is_open: bool,
    session: str,
    next_open: datetime | None,
    next_close: datetime | None,
    detail: str,
    warnings: list[str],
) -> dict[str, object]:
    return {
        "market": template.market,
        "timezone": template.timezone_name,
        "status": status,
        "isOpen": is_open,
        "session": session,
        "asOf": _iso(as_of),
        "tradingDay": trading_day.isoformat(),
        "nextOpen": _iso(next_open) if next_open else None,
        "nextClose": _iso(next_close) if next_close else None,
        "detail": detail,
        "warnings": warnings,
        "source": "static-session-template",
    }


def _coerce_datetime(value: datetime | str | None) -> datetime:
    if value is None:
        return datetime.now(timezone.utc)
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    normalized = value.strip().replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _combine(day: date, value: time, market_timezone: ZoneInfo) -> datetime:
    return datetime.combine(day, value, tzinfo=market_timezone)


def _next_session_open(start_day: date, template: MarketSessionTemplate, market_timezone: ZoneInfo) -> datetime:
    day = start_day
    while day.weekday() >= 5:
        day += timedelta(days=1)
    first_session = template.sessions[0]
    return _combine(day, first_session[1], market_timezone)


def _market_label(market: str) -> str:
    return {"ashare": "A-share market", "us": "US market", "crypto": "Crypto market"}.get(market, market)


def _iso(value: datetime) -> str:
    return value.isoformat(timespec="seconds")
