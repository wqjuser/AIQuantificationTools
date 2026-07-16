from __future__ import annotations

import math
import sqlite3
from collections.abc import Iterable
from dataclasses import replace
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from quant_core.terminal import Instrument, TerminalWorkspace


MAX_WATCHLIST_ITEMS = 12
VALID_MARKETS = {"ashare", "us", "crypto"}


class WatchlistStore:
    def __init__(self, db_path: str | Path):
        self.db_path = Path(db_path)

    def list_instruments(self) -> list[Instrument]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                SELECT market, symbol, name, change_pct, price, quote_source, quote_as_of
                FROM watchlist
                ORDER BY position ASC, updated_at ASC
                """
            ).fetchall()
        finally:
            connection.close()
        return [
            Instrument(
                market=row["market"],
                symbol=row["symbol"],
                name=row["name"],
                change_pct=float(row["change_pct"]),
                price=float(row["price"]) if row["price"] is not None else None,
                quote_source=row["quote_source"],
                quote_as_of=_parse_datetime(row["quote_as_of"]),
            )
            for row in rows
        ]

    def replace_all(self, instruments: Iterable[Instrument]) -> list[Instrument]:
        normalized = normalize_watchlist(instruments)
        now = datetime.now(timezone.utc).isoformat()
        connection = self._connect()
        try:
            connection.execute("DELETE FROM watchlist")
            connection.executemany(
                """
                INSERT INTO watchlist (
                    market, symbol, name, position, change_pct, price, quote_source, quote_as_of, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        instrument.market,
                        instrument.symbol,
                        instrument.name,
                        index,
                        instrument.change_pct,
                        instrument.price,
                        instrument.quote_source,
                        instrument.quote_as_of.isoformat() if instrument.quote_as_of else None,
                        now,
                        now,
                    )
                    for index, instrument in enumerate(normalized)
                ],
            )
            connection.commit()
        finally:
            connection.close()
        return normalized

    def _connect(self) -> sqlite3.Connection:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS watchlist (
                market TEXT NOT NULL,
                symbol TEXT NOT NULL,
                name TEXT NOT NULL,
                position INTEGER NOT NULL,
                change_pct REAL NOT NULL DEFAULT 0,
                price REAL,
                quote_source TEXT,
                quote_as_of TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (market, symbol)
            )
            """
        )
        connection.commit()
        return connection


def normalize_watchlist(instruments: Iterable[Instrument]) -> list[Instrument]:
    normalized: list[Instrument] = []
    seen: set[tuple[str, str]] = set()
    for instrument in instruments:
        market = str(instrument.market).strip()
        symbol = _normalize_symbol(market, instrument.symbol)
        if market not in VALID_MARKETS or not symbol:
            continue
        key = (market, symbol.upper())
        if key in seen:
            continue
        seen.add(key)
        normalized.append(
            replace(
                instrument,
                market=market,  # type: ignore[arg-type]
                symbol=symbol,
                name=str(instrument.name or symbol).strip() or symbol,
                change_pct=_finite_float(instrument.change_pct, 0.0),
                price=_optional_finite_float(instrument.price),
            )
        )
        if len(normalized) >= MAX_WATCHLIST_ITEMS:
            break
    return normalized


def watchlist_from_payload(value: object) -> list[Instrument]:
    if not isinstance(value, list):
        raise ValueError("watchlist_must_be_array")
    instruments = [_instrument_from_payload(item) for item in value]
    normalized = normalize_watchlist(instruments)
    if not normalized:
        raise ValueError("watchlist_must_include_at_least_one_valid_instrument")
    return normalized


def instrument_to_payload(instrument: Instrument) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "symbol": instrument.symbol,
        "name": instrument.name,
        "market": instrument.market,
        "changePct": instrument.change_pct,
    }
    if instrument.price is not None:
        payload["price"] = instrument.price
    if instrument.quote_source:
        payload["quoteSource"] = instrument.quote_source
    if instrument.quote_as_of:
        payload["quoteAsOf"] = instrument.quote_as_of.isoformat()
    return payload


def workspace_with_watchlist(workspace: TerminalWorkspace, watchlist: list[Instrument]) -> TerminalWorkspace:
    if not watchlist:
        return workspace
    return replace(workspace, selected_instrument=watchlist[0], watchlist=watchlist)


def _instrument_from_payload(value: object) -> Instrument:
    if not isinstance(value, dict):
        raise ValueError("watchlist_item_must_be_object")
    market = str(value.get("market") or "").strip()
    symbol = _normalize_symbol(market, str(value.get("symbol") or ""))
    if market not in VALID_MARKETS or not symbol:
        raise ValueError("watchlist_item_market_symbol_required")
    name = str(value.get("name") or symbol).strip() or symbol
    return Instrument(
        market=market,  # type: ignore[arg-type]
        symbol=symbol,
        name=name,
        change_pct=_finite_float(value.get("changePct"), 0.0),
        price=_optional_finite_float(value.get("price")),
        quote_source=str(value.get("quoteSource") or "").strip() or None,
        quote_as_of=_parse_datetime(value.get("quoteAsOf")),
    )


def _normalize_symbol(market: str, raw_symbol: object) -> str:
    symbol = str(raw_symbol or "").strip().upper().replace(" ", "")
    if not symbol:
        return ""
    if market == "ashare":
        for prefix in ("SH", "SZ", "SSE", "SZSE", "CN:"):
            if symbol.startswith(prefix):
                symbol = symbol[len(prefix) :]
        for suffix in (".SH", ".SZ", ".SS", ".SSE", ".SZSE"):
            if symbol.endswith(suffix):
                symbol = symbol[: -len(suffix)]
        return symbol
    if market == "crypto":
        symbol = symbol.replace("-", "/")
        if "/" not in symbol and symbol.endswith("USDT") and len(symbol) > 4:
            return f"{symbol[:-4]}/USDT"
        return symbol
    return symbol


def _finite_float(value: object, fallback: float) -> float:
    if isinstance(value, (int, float)) and math.isfinite(float(value)):
        return float(value)
    return fallback


def _optional_finite_float(value: object) -> float | None:
    if isinstance(value, (int, float)) and math.isfinite(float(value)):
        return float(value)
    return None


def _parse_datetime(value: object) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None
