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
                    primary key (market, symbol, timeframe, timestamp)
                )
                """
            )
            connection.commit()
        finally:
            connection.close()

    def upsert_bars(self, bars: list[OHLCVBar]) -> int:
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
            )
            for bar in bars
        ]
        connection = self._connect()
        try:
            connection.executemany(
                """
                insert into ohlcv (market, symbol, timeframe, timestamp, open, high, low, close, volume)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(market, symbol, timeframe, timestamp) do update set
                    open = excluded.open,
                    high = excluded.high,
                    low = excluded.low,
                    close = excluded.close,
                    volume = excluded.volume
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
