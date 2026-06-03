from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ResearchNote:
    market: str
    symbol: str
    timeframe: str
    body: str
    updated_at: datetime | None


class ResearchNoteStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        if self.path.parent:
            self.path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_schema()

    def get(self, *, market: str, symbol: str, timeframe: str) -> ResearchNote:
        existing = self.get_existing(market=market, symbol=symbol, timeframe=timeframe)
        if existing:
            return existing
        market, symbol, timeframe = _normalize_context(market, symbol, timeframe)
        return ResearchNote(market=market, symbol=symbol, timeframe=timeframe, body="", updated_at=None)

    def get_existing(self, *, market: str, symbol: str, timeframe: str) -> ResearchNote | None:
        market, symbol, timeframe = _normalize_context(market, symbol, timeframe)
        connection = self._connect()
        try:
            row = connection.execute(
                """
                select market, symbol, timeframe, body, updated_at
                from research_notes
                where market = ? and symbol = ? and timeframe = ?
                limit 1
                """,
                (market, symbol, timeframe),
            ).fetchone()
        finally:
            connection.close()
        if not row:
            return None
        updated_at = datetime.fromisoformat(row[4])
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
        return ResearchNote(market=row[0], symbol=row[1], timeframe=row[2], body=row[3], updated_at=updated_at)

    def save(
        self,
        *,
        market: str,
        symbol: str,
        timeframe: str,
        body: str,
        updated_at: datetime | None = None,
    ) -> ResearchNote:
        market, symbol, timeframe = _normalize_context(market, symbol, timeframe)
        note_body = _normalize_body(body)
        timestamp = updated_at or datetime.now(timezone.utc)
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into research_notes (market, symbol, timeframe, body, updated_at)
                values (?, ?, ?, ?, ?)
                on conflict(market, symbol, timeframe) do update set
                    body = excluded.body,
                    updated_at = excluded.updated_at
                """,
                (market, symbol, timeframe, note_body, timestamp.isoformat()),
            )
            connection.commit()
        finally:
            connection.close()
        return self.get(market=market, symbol=symbol, timeframe=timeframe)

    def delete(self, *, market: str, symbol: str, timeframe: str) -> None:
        market, symbol, timeframe = _normalize_context(market, symbol, timeframe)
        connection = self._connect()
        try:
            connection.execute(
                "delete from research_notes where market = ? and symbol = ? and timeframe = ?",
                (market, symbol, timeframe),
            )
            connection.commit()
        finally:
            connection.close()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path)

    def _ensure_schema(self) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                create table if not exists research_notes (
                    market text not null,
                    symbol text not null,
                    timeframe text not null,
                    body text not null,
                    updated_at text not null,
                    primary key (market, symbol, timeframe)
                )
                """
            )
            connection.commit()
        finally:
            connection.close()


def research_note_to_payload(note: ResearchNote) -> dict[str, Any]:
    return {
        "market": note.market,
        "symbol": note.symbol,
        "timeframe": note.timeframe,
        "body": note.body,
        "updatedAt": note.updated_at.isoformat() if note.updated_at else None,
    }


def _normalize_context(market: str, symbol: str, timeframe: str) -> tuple[str, str, str]:
    normalized_market = str(market or "").strip()
    normalized_symbol = str(symbol or "").strip()
    normalized_timeframe = str(timeframe or "").strip()
    if not normalized_market:
        raise ValueError("market_required")
    if not normalized_symbol:
        raise ValueError("symbol_required")
    if normalized_timeframe not in {"1d", "1m", "5m", "15m", "30m", "60m"}:
        raise ValueError("unsupported_timeframe")
    return normalized_market, normalized_symbol, normalized_timeframe


def _normalize_body(body: str) -> str:
    note_body = str(body or "").strip()
    if len(note_body) > 20_000:
        raise ValueError("note_too_large")
    return note_body
