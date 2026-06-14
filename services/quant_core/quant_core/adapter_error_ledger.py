from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


@dataclass(frozen=True)
class MarketDataAdapterErrorEvent:
    event_id: str
    created_at: datetime
    adapter_id: str
    provider: str
    market: str
    symbol: str
    timeframe: str
    source: str
    context: str
    message: str


class MarketDataAdapterErrorStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path)

    def _init_schema(self) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                create table if not exists market_data_adapter_errors (
                    event_id text primary key,
                    created_at text not null,
                    adapter_id text not null,
                    provider text not null,
                    market text not null,
                    symbol text not null,
                    timeframe text not null,
                    source text not null,
                    context text not null,
                    message text not null
                )
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, event: MarketDataAdapterErrorEvent) -> MarketDataAdapterErrorEvent:
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into market_data_adapter_errors (
                    event_id,
                    created_at,
                    adapter_id,
                    provider,
                    market,
                    symbol,
                    timeframe,
                    source,
                    context,
                    message
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(event_id) do update set
                    created_at = excluded.created_at,
                    adapter_id = excluded.adapter_id,
                    provider = excluded.provider,
                    market = excluded.market,
                    symbol = excluded.symbol,
                    timeframe = excluded.timeframe,
                    source = excluded.source,
                    context = excluded.context,
                    message = excluded.message
                """,
                (
                    event.event_id,
                    event.created_at.isoformat(),
                    event.adapter_id,
                    event.provider,
                    event.market,
                    event.symbol,
                    event.timeframe,
                    event.source,
                    event.context,
                    event.message,
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return event

    def list_recent(self, *, adapter_id: str | None = None, limit: int = 10) -> list[MarketDataAdapterErrorEvent]:
        bounded_limit = max(1, min(int(limit or 10), 50))
        params: list[object] = []
        where = ""
        if adapter_id:
            where = "where adapter_id = ?"
            params.append(adapter_id)
        params.append(bounded_limit)
        connection = self._connect()
        try:
            rows = connection.execute(
                f"""
                select event_id, created_at, adapter_id, provider, market, symbol, timeframe, source, context, message
                from market_data_adapter_errors
                {where}
                order by created_at desc, event_id desc
                limit ?
                """,
                params,
            ).fetchall()
        finally:
            connection.close()
        return [_market_data_adapter_error_event_from_row(row) for row in rows]


def create_market_data_adapter_error_event(
    *,
    adapter_id: str,
    provider: str,
    market: str,
    symbol: str,
    timeframe: str,
    source: str,
    context: str,
    message: str,
    created_at: datetime | None = None,
    event_id: str | None = None,
) -> MarketDataAdapterErrorEvent:
    return MarketDataAdapterErrorEvent(
        event_id=event_id or f"adapter-error-{uuid4().hex[:12]}",
        created_at=created_at or datetime.now(timezone.utc),
        adapter_id=str(adapter_id),
        provider=str(provider),
        market=str(market),
        symbol=str(symbol),
        timeframe=str(timeframe),
        source=str(source),
        context=str(context),
        message=_safe_adapter_error_message(message),
    )


def market_data_adapter_error_event_to_payload(event: MarketDataAdapterErrorEvent) -> dict[str, object]:
    return {
        "eventId": event.event_id,
        "createdAt": event.created_at.isoformat(),
        "adapterId": event.adapter_id,
        "provider": event.provider,
        "market": event.market,
        "symbol": event.symbol,
        "timeframe": event.timeframe,
        "source": event.source,
        "context": event.context,
        "message": event.message,
    }


def market_data_adapter_error_events_to_json(events: list[MarketDataAdapterErrorEvent]) -> str:
    return json.dumps([market_data_adapter_error_event_to_payload(event) for event in events], ensure_ascii=False)


def _market_data_adapter_error_event_from_row(row: tuple[object, ...]) -> MarketDataAdapterErrorEvent:
    return MarketDataAdapterErrorEvent(
        event_id=str(row[0]),
        created_at=datetime.fromisoformat(str(row[1])),
        adapter_id=str(row[2]),
        provider=str(row[3]),
        market=str(row[4]),
        symbol=str(row[5]),
        timeframe=str(row[6]),
        source=str(row[7]),
        context=str(row[8]),
        message=str(row[9]),
    )


def _safe_adapter_error_message(message: object) -> str:
    text = " ".join(str(message or "provider error").strip().split())
    if not text:
        text = "provider error"
    lowered = text.lower()
    if any(marker in lowered for marker in ["secret", "password", "api_key", "apikey", "token="]):
        return "provider error redacted"
    return text[:320]
