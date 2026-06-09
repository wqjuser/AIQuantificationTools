from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from quant_core.domain import DataQuality
from quant_core.terminal import Instrument


WatchlistCacheRefreshStatus = str


@dataclass(frozen=True)
class WatchlistCacheRefreshItem:
    market: str
    symbol: str
    name: str
    timeframe: str
    requested_limit: int
    upserted_rows: int
    status: WatchlistCacheRefreshStatus
    quality: DataQuality
    error: str | None = None


@dataclass(frozen=True)
class WatchlistCacheRefreshRun:
    run_id: str
    created_at: datetime
    timeframe: str
    requested_limit: int
    summary: dict[str, int]
    items: list[WatchlistCacheRefreshItem]


class WatchlistCacheRefreshRunStore:
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
                create table if not exists watchlist_cache_refresh_runs (
                    run_id text primary key,
                    created_at text not null,
                    timeframe text not null,
                    requested_limit integer not null,
                    summary_json text not null,
                    items_json text not null
                )
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, run: WatchlistCacheRefreshRun) -> WatchlistCacheRefreshRun:
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into watchlist_cache_refresh_runs (
                    run_id, created_at, timeframe, requested_limit, summary_json, items_json
                )
                values (?, ?, ?, ?, ?, ?)
                on conflict(run_id) do update set
                    created_at = excluded.created_at,
                    timeframe = excluded.timeframe,
                    requested_limit = excluded.requested_limit,
                    summary_json = excluded.summary_json,
                    items_json = excluded.items_json
                """,
                (
                    run.run_id,
                    run.created_at.isoformat(),
                    run.timeframe,
                    run.requested_limit,
                    json.dumps(run.summary, ensure_ascii=False, sort_keys=True),
                    json.dumps([watchlist_cache_refresh_item_to_payload(item) for item in run.items], ensure_ascii=False),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return run

    def list_recent(self, limit: int = 10) -> list[WatchlistCacheRefreshRun]:
        bounded_limit = max(1, min(int(limit or 10), 50))
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select run_id, created_at, timeframe, requested_limit, summary_json, items_json
                from watchlist_cache_refresh_runs
                order by created_at desc, run_id desc
                limit ?
                """,
                (bounded_limit,),
            ).fetchall()
        finally:
            connection.close()
        return [_watchlist_cache_refresh_run_from_row(row) for row in rows]


def create_watchlist_cache_refresh_run(
    *,
    items: list[WatchlistCacheRefreshItem],
    timeframe: str,
    requested_limit: int,
    created_at: datetime | None = None,
    run_id: str | None = None,
) -> WatchlistCacheRefreshRun:
    summary = {
        "totalSymbols": len(items),
        "refreshed": sum(1 for item in items if item.status == "refreshed"),
        "skipped": sum(1 for item in items if item.status == "skipped"),
        "failed": sum(1 for item in items if item.status == "failed"),
        "upsertedRows": sum(item.upserted_rows for item in items),
    }
    return WatchlistCacheRefreshRun(
        run_id=run_id or f"cache-refresh-{uuid4().hex[:12]}",
        created_at=created_at or datetime.now(timezone.utc),
        timeframe=timeframe,
        requested_limit=requested_limit,
        summary=summary,
        items=items,
    )


def watchlist_cache_refresh_item_from_quality(
    *,
    instrument: Instrument,
    timeframe: str,
    requested_limit: int,
    quality: DataQuality,
    upserted_rows: int,
    error: str | None = None,
) -> WatchlistCacheRefreshItem:
    if error:
        status = "failed"
    elif quality.is_complete:
        status = "refreshed"
    else:
        status = "skipped"
    return WatchlistCacheRefreshItem(
        market=instrument.market,
        symbol=instrument.symbol,
        name=instrument.name,
        timeframe=timeframe,
        requested_limit=requested_limit,
        upserted_rows=upserted_rows,
        status=status,
        quality=quality,
        error=error,
    )


def watchlist_cache_refresh_run_to_payload(run: WatchlistCacheRefreshRun) -> dict[str, object]:
    return {
        "runId": run.run_id,
        "createdAt": run.created_at.isoformat(),
        "timeframe": run.timeframe,
        "requestedLimit": run.requested_limit,
        "summary": dict(run.summary),
        "items": [watchlist_cache_refresh_item_to_payload(item) for item in run.items],
    }


def watchlist_cache_refresh_item_to_payload(item: WatchlistCacheRefreshItem) -> dict[str, object]:
    return {
        "market": item.market,
        "symbol": item.symbol,
        "name": item.name,
        "timeframe": item.timeframe,
        "requestedLimit": item.requested_limit,
        "upsertedRows": item.upserted_rows,
        "status": item.status,
        "quality": _data_quality_to_payload(item.quality),
        "error": item.error,
    }


def _watchlist_cache_refresh_run_from_row(row: tuple[object, ...]) -> WatchlistCacheRefreshRun:
    items_payload = json.loads(str(row[5]))
    return WatchlistCacheRefreshRun(
        run_id=str(row[0]),
        created_at=datetime.fromisoformat(str(row[1])),
        timeframe=str(row[2]),
        requested_limit=int(row[3]),
        summary={key: int(value) for key, value in json.loads(str(row[4])).items()},
        items=[_watchlist_cache_refresh_item_from_payload(item) for item in items_payload],
    )


def _watchlist_cache_refresh_item_from_payload(payload: object) -> WatchlistCacheRefreshItem:
    if not isinstance(payload, dict):
        raise ValueError("watchlist_cache_refresh_item_must_be_object")
    raw_quality = payload.get("quality")
    if not isinstance(raw_quality, dict):
        raise ValueError("watchlist_cache_refresh_quality_must_be_object")
    quality = DataQuality(
        source=str(raw_quality.get("source") or "unknown"),
        is_complete=bool(raw_quality.get("isComplete")),
        warnings=[str(warning) for warning in raw_quality.get("warnings", []) if isinstance(warning, str)],
        rows=int(raw_quality.get("rows") or 0),
    )
    return WatchlistCacheRefreshItem(
        market=str(payload.get("market") or ""),
        symbol=str(payload.get("symbol") or ""),
        name=str(payload.get("name") or ""),
        timeframe=str(payload.get("timeframe") or ""),
        requested_limit=int(payload.get("requestedLimit") or 0),
        upserted_rows=int(payload.get("upsertedRows") or 0),
        status=str(payload.get("status") or "failed"),
        quality=quality,
        error=str(payload.get("error")) if payload.get("error") is not None else None,
    )


def _data_quality_to_payload(quality: DataQuality) -> dict[str, object]:
    return {
        "source": quality.source,
        "isComplete": quality.is_complete,
        "warnings": list(quality.warnings),
        "rows": quality.rows,
    }
