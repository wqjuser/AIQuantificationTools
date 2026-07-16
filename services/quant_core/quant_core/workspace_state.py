from __future__ import annotations

import sqlite3
from collections.abc import Mapping
from dataclasses import dataclass, replace
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from quant_core.domain import Market, Timeframe
from quant_core.terminal import Instrument, TerminalWorkspace
from quant_core.watchlist import MAX_WATCHLIST_ITEMS, normalize_watchlist


VALID_MARKETS = {"ashare", "us", "crypto"}
VALID_TIMEFRAMES = {"1d", "1w", "1m", "5m", "15m", "30m", "60m"}
VALID_STAGE1_WORKSPACES = {"market", "research"}


@dataclass(frozen=True)
class ResearchWorkspaceState:
    market: Market
    symbol: str
    name: str
    timeframe: Timeframe
    workspace_id: str
    updated_at: datetime


class ResearchWorkspaceStateStore:
    def __init__(self, db_path: str | Path):
        self.db_path = Path(db_path)

    def get(self) -> ResearchWorkspaceState | None:
        connection = self._connect()
        try:
            row = connection.execute(
                """
                SELECT market, symbol, name, timeframe, workspace_id, updated_at
                FROM research_workspace_state
                WHERE id = 1
                """
            ).fetchone()
        finally:
            connection.close()
        if row is None:
            return None
        return ResearchWorkspaceState(
            market=row["market"],
            symbol=row["symbol"],
            name=row["name"],
            timeframe=row["timeframe"],
            workspace_id=row["workspace_id"],
            updated_at=_parse_datetime(row["updated_at"]) or datetime.now(timezone.utc),
        )

    def save(self, payload: Mapping[str, object]) -> ResearchWorkspaceState:
        state = research_workspace_state_from_payload(payload)
        connection = self._connect()
        try:
            connection.execute(
                """
                INSERT INTO research_workspace_state (
                    id, market, symbol, name, timeframe, workspace_id, updated_at
                )
                VALUES (1, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    market = excluded.market,
                    symbol = excluded.symbol,
                    name = excluded.name,
                    timeframe = excluded.timeframe,
                    workspace_id = excluded.workspace_id,
                    updated_at = excluded.updated_at
                """,
                (
                    state.market,
                    state.symbol,
                    state.name,
                    state.timeframe,
                    state.workspace_id,
                    state.updated_at.isoformat(),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return state

    def _connect(self) -> sqlite3.Connection:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS research_workspace_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                market TEXT NOT NULL,
                symbol TEXT NOT NULL,
                name TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.commit()
        return connection


def research_workspace_state_from_payload(payload: Mapping[str, object]) -> ResearchWorkspaceState:
    market = str(payload.get("market") or "").strip()
    symbol = _normalize_symbol(market, payload.get("symbol"))
    timeframe = str(payload.get("timeframe") or "").strip()
    workspace_id = str(payload.get("workspaceId") or payload.get("workspace_id") or "research").strip()
    if market not in VALID_MARKETS or not symbol:
        raise ValueError("workspace_state_market_symbol_required")
    if timeframe not in VALID_TIMEFRAMES:
        raise ValueError("workspace_state_timeframe_invalid")
    if workspace_id not in VALID_STAGE1_WORKSPACES:
        raise ValueError("workspace_state_workspace_id_invalid")
    name = str(payload.get("name") or symbol).strip() or symbol
    return ResearchWorkspaceState(
        market=market,  # type: ignore[arg-type]
        symbol=symbol,
        name=name,
        timeframe=timeframe,  # type: ignore[arg-type]
        workspace_id=workspace_id,
        updated_at=datetime.now(timezone.utc),
    )


def research_workspace_state_to_payload(state: ResearchWorkspaceState) -> dict[str, Any]:
    return {
        "market": state.market,
        "symbol": state.symbol,
        "name": state.name,
        "timeframe": state.timeframe,
        "workspaceId": state.workspace_id,
        "updatedAt": state.updated_at.isoformat(),
    }


def workspace_with_research_workspace_state(
    workspace: TerminalWorkspace,
    state: ResearchWorkspaceState | None,
) -> TerminalWorkspace:
    if state is None:
        return workspace
    selected = _instrument_from_state(state, workspace)
    watchlist = normalize_watchlist([selected, *workspace.watchlist])[:MAX_WATCHLIST_ITEMS]
    return replace(
        workspace,
        selected_instrument=selected,
        selected_timeframe=state.timeframe,
        watchlist=watchlist,
    )


def _instrument_from_state(state: ResearchWorkspaceState, workspace: TerminalWorkspace) -> Instrument:
    existing = next(
        (
            instrument
            for instrument in workspace.watchlist
            if instrument.market == state.market and instrument.symbol.upper() == state.symbol.upper()
        ),
        None,
    )
    if existing:
        return replace(existing, name=state.name or existing.name)
    return Instrument(symbol=state.symbol, name=state.name, market=state.market, change_pct=0.0)


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


def _parse_datetime(value: object) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None
