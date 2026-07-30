from __future__ import annotations

import hashlib
import json
import math
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Callable, Mapping
from urllib.parse import urlencode
from urllib.request import Request, urlopen

FetchText = Callable[[str, str], str]
Clock = Callable[[], datetime]
FetchAkshareSpot = Callable[[], object]

EASTMONEY_ASHARE_LIST_URL = "https://push2.eastmoney.com/api/qt/clist/get"
BINANCE_MARKET_DATA_BASE_URL = "https://data-api.binance.vision"
BINANCE_EXCHANGE_INFO_URL = (
    f"{BINANCE_MARKET_DATA_BASE_URL}/api/v3/exchangeInfo"
    "?symbolStatus=TRADING&showPermissionSets=false"
)
BINANCE_TICKER_24H_URL = f"{BINANCE_MARKET_DATA_BASE_URL}/api/v3/ticker/24hr"
EASTMONEY_PAGE_SIZE = 100
EASTMONEY_MAX_PAGES = 60
MARKET_DISCOVERY_QUERY_KEYS = frozenset(
    {
        "market",
        "query",
        "minChangePct",
        "maxChangePct",
        "minAmount",
        "minTurnoverRate",
        "maxPe",
        "sort",
        "direction",
        "limit",
    }
)
MARKET_DISCOVERY_SORTS = frozenset(
    {"changePct", "amount", "turnoverRate", "marketCap", "peRatio"}
)
MARKET_DISCOVERY_DIRECTIONS = frozenset({"asc", "desc"})
MARKET_DISCOVERY_MAX_LIMIT = 100
MARKET_DISCOVERY_CACHE_TTL = timedelta(minutes=5)
MARKET_DISCOVERY_RETRY_COOLDOWN = timedelta(seconds=30)


@dataclass(frozen=True)
class MarketDiscoveryQuery:
    market: str = "ashare"
    query: str = ""
    min_change_pct: float | None = None
    max_change_pct: float | None = None
    min_amount: float | None = None
    min_turnover_rate: float | None = None
    max_pe: float | None = None
    sort: str = "changePct"
    direction: str = "desc"
    limit: int = 20


@dataclass(frozen=True)
class AshareMarketSnapshotRow:
    symbol: str
    name: str
    price: float
    change_pct: float
    volume: float
    amount: float
    turnover_rate: float | None
    pe: float | None
    pb: float | None
    market_cap: float | None

    def to_payload(
        self,
        *,
        source: str = "eastmoney",
        observed_at: str | None = None,
    ) -> dict[str, object]:
        return {
            "market": "ashare",
            "symbol": self.symbol,
            "name": self.name,
            "price": self.price,
            "changePct": self.change_pct,
            "volume": self.volume,
            "amount": self.amount,
            "turnoverRate": self.turnover_rate,
            "peRatio": self.pe,
            "pbRatio": self.pb,
            "marketCap": self.market_cap,
            "source": source,
            "observedAt": observed_at,
        }


@dataclass(frozen=True)
class AshareMarketSnapshot:
    rows: tuple[AshareMarketSnapshotRow, ...]
    observed_at: datetime
    source: str
    snapshot_hash: str
    warnings: tuple[str, ...] = ()


@dataclass(frozen=True)
class BinanceCryptoMarketSnapshotRow:
    symbol: str
    name: str
    price: float
    change_pct: float
    volume: float
    amount: float
    turnover_rate: None = None
    pe: None = None
    pb: None = None
    market_cap: None = None

    def to_payload(
        self,
        *,
        source: str = "binance-data-api",
        observed_at: str | None = None,
    ) -> dict[str, object]:
        return {
            "market": "crypto",
            "symbol": self.symbol,
            "name": self.name,
            "price": self.price,
            "changePct": self.change_pct,
            "volume": self.volume,
            "amount": self.amount,
            "turnoverRate": None,
            "peRatio": None,
            "pbRatio": None,
            "marketCap": None,
            "source": source,
            "observedAt": observed_at,
        }


@dataclass(frozen=True)
class BinanceCryptoMarketSnapshot:
    rows: tuple[BinanceCryptoMarketSnapshotRow, ...]
    observed_at: datetime
    snapshot_hash: str


class MarketDiscoveryUnavailable(RuntimeError):
    pass


class AshareMarketDiscoveryService:
    def __init__(
        self,
        *,
        fetch_text: FetchText | None = None,
        fetch_akshare_spot: FetchAkshareSpot | None = None,
        clock: Clock | None = None,
    ) -> None:
        self.fetch_text = fetch_text or default_fetch_text
        self.fetch_akshare_spot = fetch_akshare_spot or default_fetch_akshare_spot
        self.clock = clock or (lambda: datetime.now(timezone.utc))
        self._snapshot: AshareMarketSnapshot | None = None
        self._snapshot_lock = Lock()

    def discover(self, query: MarketDiscoveryQuery) -> dict[str, object]:
        snapshot, freshness, warnings = self._load_snapshot()
        rows = list(snapshot.rows)
        observed_at_text = snapshot.observed_at.isoformat()
        matched = _filter_rows(rows, query)
        ordered = _sort_rows(matched, query.sort, query.direction)
        return {
            "market": "ashare",
            "overview": _market_overview(rows),
            "totalMatched": len(matched),
            "items": [
                row.to_payload(
                    source=snapshot.source,
                    observed_at=observed_at_text,
                )
                for row in ordered[: query.limit]
            ],
            "source": snapshot.source,
            "observedAt": observed_at_text,
            "freshness": freshness,
            "warnings": warnings,
            "snapshotHash": snapshot.snapshot_hash,
        }

    def _load_snapshot(
        self,
    ) -> tuple[AshareMarketSnapshot, str, list[str]]:
        now = self.clock().astimezone(timezone.utc)
        with self._snapshot_lock:
            if (
                self._snapshot is not None
                and now - self._snapshot.observed_at < MARKET_DISCOVERY_CACHE_TTL
            ):
                return self._snapshot, "fresh", list(self._snapshot.warnings)
            try:
                rows = self._fetch_snapshot_rows()
                source = "eastmoney"
                warnings: tuple[str, ...] = ()
            except Exception:
                try:
                    rows = akshare_spot_payload_to_rows(self.fetch_akshare_spot())
                    if not rows:
                        raise ValueError("empty_akshare_market_snapshot")
                except Exception as error:
                    if self._snapshot is not None:
                        return (
                            self._snapshot,
                            "stale",
                            [
                                *self._snapshot.warnings,
                                "市场快照刷新失败，已使用最近一次成功快照。",
                            ],
                        )
                    raise MarketDiscoveryUnavailable(
                        "A 股市场快照上游当前不可用。"
                    ) from error
                source = "akshare-sina"
                warnings = (
                    "东方财富市场快照不可用，已降级使用 AkShare 新浪实时行情；"
                    "换手率、估值和市值暂缺。",
                )
            snapshot = AshareMarketSnapshot(
                rows=tuple(rows),
                observed_at=now,
                source=source,
                snapshot_hash=_snapshot_hash(rows, source=source),
                warnings=warnings,
            )
            self._snapshot = snapshot
            return snapshot, "fresh", list(snapshot.warnings)

    def _fetch_snapshot_rows(self) -> list[AshareMarketSnapshotRow]:
        first_payload = json.loads(
            self.fetch_text(_eastmoney_ashare_list_url(page=1), "utf-8")
        )
        rows = eastmoney_ashare_list_payload_to_rows(first_payload)
        total = _eastmoney_total(first_payload)
        if total <= 0 or not rows:
            raise ValueError("empty_eastmoney_market_snapshot")
        if total > EASTMONEY_PAGE_SIZE * EASTMONEY_MAX_PAGES:
            raise ValueError("eastmoney_market_snapshot_exceeds_page_limit")
        page_count = min(
            max(1, (total + EASTMONEY_PAGE_SIZE - 1) // EASTMONEY_PAGE_SIZE),
            EASTMONEY_MAX_PAGES,
        )
        for page in range(2, page_count + 1):
            payload = json.loads(
                self.fetch_text(_eastmoney_ashare_list_url(page=page), "utf-8")
            )
            page_rows = eastmoney_ashare_list_payload_to_rows(payload)
            if not page_rows:
                raise ValueError("incomplete_eastmoney_market_snapshot")
            rows.extend(page_rows)
        return list({row.symbol: row for row in rows}.values())


class BinanceCryptoMarketDiscoveryService:
    def __init__(
        self,
        *,
        fetch_text: FetchText | None = None,
        clock: Clock | None = None,
    ) -> None:
        self.fetch_text = fetch_text or default_fetch_text
        self.clock = clock or (lambda: datetime.now(timezone.utc))
        self._snapshot: BinanceCryptoMarketSnapshot | None = None
        self._retry_after: datetime | None = None
        self._snapshot_lock = Lock()

    def discover(self, query: MarketDiscoveryQuery) -> dict[str, object]:
        snapshot, freshness, warnings = self._load_snapshot()
        rows = list(snapshot.rows)
        observed_at_text = snapshot.observed_at.isoformat()
        matched = _filter_rows(rows, query)
        ordered = _sort_rows(matched, query.sort, query.direction)
        return {
            "market": "crypto",
            "overview": _market_overview(rows),
            "totalMatched": len(matched),
            "items": [
                row.to_payload(observed_at=observed_at_text)
                for row in ordered[: query.limit]
            ],
            "source": "binance-data-api",
            "observedAt": observed_at_text,
            "freshness": freshness,
            "warnings": warnings,
            "snapshotHash": snapshot.snapshot_hash,
        }

    def _load_snapshot(
        self,
    ) -> tuple[BinanceCryptoMarketSnapshot, str, list[str]]:
        with self._snapshot_lock:
            now = self.clock().astimezone(timezone.utc)
            if (
                self._snapshot is not None
                and now - self._snapshot.observed_at < MARKET_DISCOVERY_CACHE_TTL
            ):
                return self._snapshot, "fresh", []
            if (
                self._snapshot is not None
                and self._retry_after is not None
                and now < self._retry_after
            ):
                return (
                    self._snapshot,
                    "stale",
                    ["Binance 行情刷新失败，已使用最近一次成功快照。"],
                )
            try:
                rows = self._fetch_snapshot_rows()
            except Exception as error:
                if self._snapshot is not None:
                    self._retry_after = (
                        self.clock().astimezone(timezone.utc)
                        + MARKET_DISCOVERY_RETRY_COOLDOWN
                    )
                    return (
                        self._snapshot,
                        "stale",
                        ["Binance 行情刷新失败，已使用最近一次成功快照。"],
                    )
                raise MarketDiscoveryUnavailable(
                    "Binance USDT 现货市场快照上游当前不可用。"
                ) from error
            snapshot = BinanceCryptoMarketSnapshot(
                rows=tuple(rows),
                observed_at=now,
                snapshot_hash=_snapshot_hash(rows, source="binance-data-api"),
            )
            self._snapshot = snapshot
            self._retry_after = None
            return snapshot, "fresh", []

    def _fetch_snapshot_rows(self) -> list[BinanceCryptoMarketSnapshotRow]:
        exchange_info = json.loads(self.fetch_text(BINANCE_EXCHANGE_INFO_URL, "utf-8"))
        tickers = json.loads(self.fetch_text(BINANCE_TICKER_24H_URL, "utf-8"))
        rows = binance_usdt_spot_payloads_to_rows(exchange_info, tickers)
        if not rows:
            raise ValueError("empty_binance_usdt_spot_snapshot")
        return rows


class MarketDiscoveryService:
    def __init__(
        self,
        *,
        ashare_service: AshareMarketDiscoveryService | None = None,
        crypto_service: BinanceCryptoMarketDiscoveryService | None = None,
    ) -> None:
        self.ashare_service = ashare_service or AshareMarketDiscoveryService()
        self.crypto_service = crypto_service or BinanceCryptoMarketDiscoveryService()

    def discover(self, query: MarketDiscoveryQuery) -> dict[str, object]:
        if query.market == "crypto":
            return self.crypto_service.discover(query)
        return self.ashare_service.discover(query)


def market_discovery_query_from_params(
    params: Mapping[str, list[str]],
) -> MarketDiscoveryQuery:
    unknown = set(params) - MARKET_DISCOVERY_QUERY_KEYS
    if unknown:
        raise ValueError(f"unsupported_parameter:{sorted(unknown)[0]}")
    market = _single_param(params, "market", "ashare")
    if market not in {"ashare", "crypto"}:
        raise ValueError("unsupported_market")
    query = _single_param(params, "query", "")
    if len(query) > 64:
        raise ValueError("query_too_long")
    min_change_pct = _optional_float_param(params, "minChangePct")
    max_change_pct = _optional_float_param(params, "maxChangePct")
    if (
        min_change_pct is not None
        and max_change_pct is not None
        and min_change_pct > max_change_pct
    ):
        raise ValueError("invalid_change_pct_range")
    min_amount = _optional_float_param(params, "minAmount", minimum=0)
    min_turnover_rate = _optional_float_param(
        params,
        "minTurnoverRate",
        minimum=0,
    )
    max_pe = _optional_float_param(params, "maxPe")
    sort = _single_param(params, "sort", "changePct")
    if sort not in MARKET_DISCOVERY_SORTS:
        raise ValueError("invalid_sort")
    if market == "crypto" and (
        min_turnover_rate is not None
        or max_pe is not None
        or sort not in {"changePct", "amount"}
    ):
        raise ValueError("unsupported_crypto_filter")
    direction = _single_param(params, "direction", "desc")
    if direction not in MARKET_DISCOVERY_DIRECTIONS:
        raise ValueError("invalid_direction")
    raw_limit = _single_param(params, "limit", "20")
    try:
        limit = int(raw_limit)
    except ValueError as error:
        raise ValueError("invalid_limit") from error
    if not 1 <= limit <= MARKET_DISCOVERY_MAX_LIMIT:
        raise ValueError("invalid_limit")
    return MarketDiscoveryQuery(
        market=market,
        query=query,
        min_change_pct=min_change_pct,
        max_change_pct=max_change_pct,
        min_amount=min_amount,
        min_turnover_rate=min_turnover_rate,
        max_pe=max_pe,
        sort=sort,
        direction=direction,
        limit=limit,
    )


def binance_usdt_spot_payloads_to_rows(
    exchange_info: object,
    tickers: object,
) -> list[BinanceCryptoMarketSnapshotRow]:
    if not isinstance(exchange_info, dict) or not isinstance(tickers, list):
        return []
    symbols = exchange_info.get("symbols")
    if not isinstance(symbols, list):
        return []
    eligible: dict[str, tuple[str, str]] = {}
    for raw_symbol in symbols:
        if not isinstance(raw_symbol, dict):
            continue
        exchange_symbol = str(raw_symbol.get("symbol") or "").strip()
        base_asset = str(raw_symbol.get("baseAsset") or "").strip()
        quote_asset = str(raw_symbol.get("quoteAsset") or "").strip()
        if (
            exchange_symbol
            and base_asset
            and quote_asset == "USDT"
            and raw_symbol.get("status") == "TRADING"
            and raw_symbol.get("isSpotTradingAllowed") is True
        ):
            eligible[exchange_symbol] = (base_asset, quote_asset)
    rows: list[BinanceCryptoMarketSnapshotRow] = []
    for ticker in tickers:
        if not isinstance(ticker, dict):
            continue
        exchange_symbol = str(ticker.get("symbol") or "").strip()
        assets = eligible.get(exchange_symbol)
        price = _number(ticker.get("lastPrice"))
        change_pct = _number(ticker.get("priceChangePercent"))
        volume = _number(ticker.get("volume"))
        amount = _number(ticker.get("quoteVolume"))
        if assets is None or None in (price, change_pct, volume, amount):
            continue
        base_asset, quote_asset = assets
        rows.append(
            BinanceCryptoMarketSnapshotRow(
                symbol=f"{base_asset}/{quote_asset}",
                name=base_asset,
                price=price,
                change_pct=change_pct,
                volume=volume,
                amount=amount,
            )
        )
    return sorted(
        {row.symbol: row for row in rows}.values(),
        key=lambda row: row.symbol,
    )


def eastmoney_ashare_list_payload_to_rows(
    payload: dict[str, object],
) -> list[AshareMarketSnapshotRow]:
    data = payload.get("data")
    if not isinstance(data, dict):
        return []
    raw_rows = data.get("diff")
    if not isinstance(raw_rows, list):
        return []
    rows: list[AshareMarketSnapshotRow] = []
    for raw_row in raw_rows:
        if not isinstance(raw_row, dict):
            continue
        symbol = str(raw_row.get("f12") or "").strip()
        name = str(raw_row.get("f14") or "").strip()
        price = _number(raw_row.get("f2"))
        change_pct = _number(raw_row.get("f3"))
        volume = _number(raw_row.get("f5"))
        amount = _number(raw_row.get("f6"))
        turnover_rate = _number(raw_row.get("f8"))
        if not symbol or not name or None in (
            price,
            change_pct,
            volume,
            amount,
            turnover_rate,
        ):
            continue
        rows.append(
            AshareMarketSnapshotRow(
                symbol=symbol,
                name=name,
                price=price,
                change_pct=change_pct,
                volume=volume,
                amount=amount,
                turnover_rate=turnover_rate,
                pe=_number(raw_row.get("f9")),
                pb=_number(raw_row.get("f23")),
                market_cap=_number(raw_row.get("f20")),
            )
        )
    return rows


def akshare_spot_payload_to_rows(payload: object) -> list[AshareMarketSnapshotRow]:
    if isinstance(payload, list):
        raw_rows = payload
    else:
        to_dict = getattr(payload, "to_dict", None)
        raw_rows = to_dict("records") if callable(to_dict) else []
    if not isinstance(raw_rows, list):
        return []
    rows: list[AshareMarketSnapshotRow] = []
    for raw_row in raw_rows:
        if not isinstance(raw_row, dict):
            continue
        symbol = _normalize_ashare_symbol(raw_row.get("代码"))
        name = str(raw_row.get("名称") or "").strip()
        price = _number(raw_row.get("最新价"))
        change_pct = _number(raw_row.get("涨跌幅"))
        volume = _number(raw_row.get("成交量"))
        amount = _number(raw_row.get("成交额"))
        if not symbol or not name or None in (price, change_pct, volume, amount):
            continue
        rows.append(
            AshareMarketSnapshotRow(
                symbol=symbol,
                name=name,
                price=price,
                change_pct=change_pct,
                volume=volume,
                amount=amount,
                turnover_rate=None,
                pe=None,
                pb=None,
                market_cap=None,
            )
        )
    return rows


def _normalize_ashare_symbol(value: object) -> str:
    raw = str(value or "").strip().lower()
    if raw.isdigit() and len(raw) <= 6:
        return raw.zfill(6)
    match = re.fullmatch(r"(?:sh|sz|bj)(\d{6})", raw)
    return match.group(1) if match else ""


def _filter_rows(
    rows: list[AshareMarketSnapshotRow | BinanceCryptoMarketSnapshotRow],
    query: MarketDiscoveryQuery,
) -> list[AshareMarketSnapshotRow | BinanceCryptoMarketSnapshotRow]:
    search = query.query.strip().casefold()
    return [
        row
        for row in rows
        if _discovery_search_matches(row, search)
        and (query.min_change_pct is None or row.change_pct >= query.min_change_pct)
        and (query.max_change_pct is None or row.change_pct <= query.max_change_pct)
        and (query.min_amount is None or row.amount >= query.min_amount)
        and (
            query.min_turnover_rate is None
            or (
                row.turnover_rate is not None
                and row.turnover_rate >= query.min_turnover_rate
            )
        )
        and (query.max_pe is None or (row.pe is not None and row.pe <= query.max_pe))
    ]


def _discovery_search_matches(
    row: AshareMarketSnapshotRow | BinanceCryptoMarketSnapshotRow,
    search: str,
) -> bool:
    if not search:
        return True
    if search in row.symbol.casefold() or search in row.name.casefold():
        return True
    compact_search = re.sub(r"[\s/_-]", "", search)
    return bool(
        compact_search
        and compact_search in re.sub(r"[\s/_-]", "", row.symbol.casefold())
    )


def _sort_rows(
    rows: list[AshareMarketSnapshotRow | BinanceCryptoMarketSnapshotRow],
    sort: str,
    direction: str,
) -> list[AshareMarketSnapshotRow | BinanceCryptoMarketSnapshotRow]:
    field_by_sort = {
        "symbol": "symbol",
        "name": "name",
        "price": "price",
        "changePct": "change_pct",
        "amount": "amount",
        "turnoverRate": "turnover_rate",
        "peRatio": "pe",
        "marketCap": "market_cap",
    }
    field = field_by_sort.get(sort, "change_pct")
    available = sorted(
        (row for row in rows if getattr(row, field) is not None),
        key=lambda row: row.symbol,
    )
    missing = sorted(
        (row for row in rows if getattr(row, field) is None),
        key=lambda row: row.symbol,
    )
    return sorted(
        available,
        key=lambda row: getattr(row, field),
        reverse=direction == "desc",
    ) + missing


def _market_overview(
    rows: list[AshareMarketSnapshotRow | BinanceCryptoMarketSnapshotRow],
) -> dict[str, object]:
    return {
        "universeCount": len(rows),
        "advancing": sum(row.change_pct > 0 for row in rows),
        "declining": sum(row.change_pct < 0 for row in rows),
        "flat": sum(row.change_pct == 0 for row in rows),
        "totalAmount": sum(row.amount for row in rows),
    }


def _snapshot_hash(
    rows: list[AshareMarketSnapshotRow | BinanceCryptoMarketSnapshotRow],
    *,
    source: str,
) -> str:
    row_payloads = [row.to_payload(source=source) for row in rows]
    return hashlib.sha256(
        json.dumps(
            row_payloads,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
    ).hexdigest()


def _number(value: object) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        result = float(value)
        return result if math.isfinite(result) else None
    try:
        result = float(str(value))
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) else None


def _single_param(
    params: Mapping[str, list[str]],
    name: str,
    default: str,
) -> str:
    values = params.get(name)
    if values is None:
        return default
    if len(values) != 1:
        raise ValueError(f"duplicate_parameter:{name}")
    return values[0].strip()


def _optional_float_param(
    params: Mapping[str, list[str]],
    name: str,
    *,
    minimum: float | None = None,
) -> float | None:
    values = params.get(name)
    if values is None:
        return None
    raw = _single_param(params, name, "")
    if not raw:
        raise ValueError(f"invalid_number:{name}")
    try:
        value = float(raw)
    except ValueError as error:
        raise ValueError(f"invalid_number:{name}") from error
    if not math.isfinite(value) or (minimum is not None and value < minimum):
        raise ValueError(f"invalid_number:{name}")
    return value


def _eastmoney_total(payload: dict[str, object]) -> int:
    data = payload.get("data")
    if not isinstance(data, dict):
        return 0
    value = data.get("total")
    return value if isinstance(value, int) and not isinstance(value, bool) else 0


def _eastmoney_ashare_list_url(*, page: int) -> str:
    params = urlencode(
        {
            "pn": page,
            "pz": EASTMONEY_PAGE_SIZE,
            "po": 1,
            "np": 1,
            "fltt": 2,
            "invt": 2,
            "fid": "f3",
            "fs": "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048",
            "fields": "f2,f3,f5,f6,f8,f9,f12,f14,f20,f23",
        }
    )
    return f"{EASTMONEY_ASHARE_LIST_URL}?{params}"


def default_fetch_text(url: str, encoding: str = "utf-8") -> str:
    headers = {"User-Agent": "Mozilla/5.0 AIQuantificationTools/0.1"}
    if url.startswith(EASTMONEY_ASHARE_LIST_URL):
        headers["Referer"] = "https://quote.eastmoney.com/"
    request = Request(
        url,
        headers=headers,
    )
    timeout = 30 if url.startswith(BINANCE_MARKET_DATA_BASE_URL) else 10
    with urlopen(request, timeout=timeout) as response:
        return response.read().decode(encoding, errors="ignore")


def default_fetch_akshare_spot() -> object:
    import akshare

    return akshare.stock_zh_a_spot()
