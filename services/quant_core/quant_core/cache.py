from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path

from quant_core.domain import OHLCVBar


class MarketDataCache:
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
                create table if not exists ohlcv (
                    market text not null,
                    symbol text not null,
                    timeframe text not null,
                    timestamp text not null,
                    open real not null,
                    high real not null,
                    low real not null,
                    close real not null,
                    volume real not null,
                    source text,
                    adjustment_mode text,
                    snapshot_id text,
                    primary key (market, symbol, timeframe, timestamp)
                )
                """
            )
            columns = {
                str(row[1])
                for row in connection.execute("pragma table_info(ohlcv)").fetchall()
            }
            for name in ("source", "adjustment_mode", "snapshot_id"):
                if name not in columns:
                    connection.execute(f"alter table ohlcv add column {name} text")
            connection.commit()
        finally:
            connection.close()

    def upsert_bars(
        self,
        bars: list[OHLCVBar],
        *,
        source: str | None = None,
        adjustment_mode: str | None = None,
        snapshot_id: str | None = None,
    ) -> int:
        rows = [
            (
                bar.market,
                bar.symbol,
                bar.timeframe,
                bar.timestamp.isoformat(),
                bar.open,
                bar.high,
                bar.low,
                bar.close,
                bar.volume,
                source,
                adjustment_mode,
                snapshot_id,
            )
            for bar in bars
        ]
        connection = self._connect()
        try:
            connection.executemany(
                """
                insert into ohlcv (
                    market, symbol, timeframe, timestamp, open, high, low, close, volume,
                    source, adjustment_mode, snapshot_id
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(market, symbol, timeframe, timestamp) do update set
                    open = excluded.open,
                    high = excluded.high,
                    low = excluded.low,
                    close = excluded.close,
                    volume = excluded.volume,
                    source = case
                        when excluded.source is not null then excluded.source
                        when excluded.open = ohlcv.open and excluded.high = ohlcv.high
                            and excluded.low = ohlcv.low and excluded.close = ohlcv.close
                            and excluded.volume = ohlcv.volume then ohlcv.source
                        else null
                    end,
                    adjustment_mode = case
                        when excluded.adjustment_mode is not null then excluded.adjustment_mode
                        when excluded.open = ohlcv.open and excluded.high = ohlcv.high
                            and excluded.low = ohlcv.low and excluded.close = ohlcv.close
                            and excluded.volume = ohlcv.volume then ohlcv.adjustment_mode
                        else null
                    end,
                    snapshot_id = case
                        when excluded.snapshot_id is not null then excluded.snapshot_id
                        when excluded.open = ohlcv.open and excluded.high = ohlcv.high
                            and excluded.low = ohlcv.low and excluded.close = ohlcv.close
                            and excluded.volume = ohlcv.volume then ohlcv.snapshot_id
                        else null
                    end
                """,
                rows,
            )
            connection.commit()
        finally:
            connection.close()
        return len(rows)

    def read_bars(
        self,
        market: str,
        symbol: str,
        timeframe: str,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> list[OHLCVBar]:
        params: list[str] = [market, symbol, timeframe]
        where = "market = ? and symbol = ? and timeframe = ?"
        if start is not None:
            where += " and timestamp >= ?"
            params.append(start.isoformat())
        if end is not None:
            where += " and timestamp <= ?"
            params.append(end.isoformat())

        connection = self._connect()
        try:
            rows = connection.execute(
                f"""
                select market, symbol, timeframe, timestamp, open, high, low, close, volume
                from ohlcv
                where {where}
                order by timestamp asc
                """,
                params,
            ).fetchall()
        finally:
            connection.close()

        return [
            OHLCVBar(
                market=row[0],
                symbol=row[1],
                timeframe=row[2],
                timestamp=datetime.fromisoformat(row[3]),
                open=row[4],
                high=row[5],
                low=row[6],
                close=row[7],
                volume=row[8],
            )
            for row in rows
        ]

    def read_provenance(
        self,
        market: str,
        symbol: str,
        timeframe: str,
        *,
        start: datetime,
        end: datetime,
    ) -> dict[str, str] | None:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select distinct source, adjustment_mode, snapshot_id
                from ohlcv
                where market = ? and symbol = ? and timeframe = ?
                  and timestamp >= ? and timestamp <= ?
                """,
                (
                    market,
                    symbol,
                    timeframe,
                    start.isoformat(),
                    end.isoformat(),
                ),
            ).fetchall()
        finally:
            connection.close()
        if (
            len(rows) != 1
            or not all(isinstance(value, str) and value for value in rows[0])
        ):
            return None
        return {
            "source": rows[0][0],
            "adjustmentMode": rows[0][1],
            "snapshotId": rows[0][2],
        }

    def stats(self) -> dict[str, int | str | None]:
        connection = self._connect()
        try:
            row_count = int(connection.execute("select count(*) from ohlcv").fetchone()[0])
            context_count = int(
                connection.execute(
                    """
                    select count(*)
                    from (
                        select market, symbol, timeframe
                        from ohlcv
                        group by market, symbol, timeframe
                    )
                    """
                ).fetchone()[0]
            )
            latest_timestamp = connection.execute("select max(timestamp) from ohlcv").fetchone()[0]
        finally:
            connection.close()

        return {
            "row_count": row_count,
            "context_count": context_count,
            "latest_timestamp": latest_timestamp,
        }

    def contexts(self, limit: int = 8) -> list[dict[str, int | str]]:
        bounded_limit = max(1, min(limit, 50))
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select market, symbol, timeframe, count(*) as row_count, min(timestamp), max(timestamp)
                from ohlcv
                group by market, symbol, timeframe
                order by max(timestamp) desc, market asc, symbol asc, timeframe asc
                limit ?
                """,
                (bounded_limit,),
            ).fetchall()
        finally:
            connection.close()

        return [
            {
                "market": row[0],
                "symbol": row[1],
                "timeframe": row[2],
                "row_count": int(row[3]),
                "start_timestamp": row[4],
                "end_timestamp": row[5],
            }
            for row in rows
        ]

    def context(self, market: str, symbol: str, timeframe: str) -> dict[str, int | str] | None:
        connection = self._connect()
        try:
            row = connection.execute(
                """
                select market, symbol, timeframe, count(*) as row_count, min(timestamp), max(timestamp)
                from ohlcv
                where market = ? and symbol = ? and timeframe = ?
                group by market, symbol, timeframe
                """,
                (market, symbol, timeframe),
            ).fetchone()
        finally:
            connection.close()
        if row is None:
            return None
        return {
            "market": row[0],
            "symbol": row[1],
            "timeframe": row[2],
            "row_count": int(row[3]),
            "start_timestamp": row[4],
            "end_timestamp": row[5],
        }
