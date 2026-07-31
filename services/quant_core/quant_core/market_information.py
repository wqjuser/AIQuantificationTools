from __future__ import annotations

import hashlib
import html
import json
import os
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Callable, Mapping
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from quant_core.market_discovery import MarketDiscoveryQuery, MarketDiscoveryService

FetchText = Callable[[str, str], str]
FetchFinnhubText = Callable[[str, str], str]
Clock = Callable[[], datetime]

EASTMONEY_FAST_NEWS_URL = "https://np-weblist.eastmoney.com/comm/web/getFastNewsList"
EASTMONEY_SEARCH_URL = "https://search-api-web.eastmoney.com/search/jsonp"
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"
MARKET_INFORMATION_CACHE_TTL = timedelta(minutes=5)
MARKET_INFORMATION_RETRY_COOLDOWN = timedelta(seconds=30)
MARKET_INFORMATION_MAX_NEWS_OFFSET = 1_000
MARKET_INFORMATION_QUERY_KEYS = frozenset({
    "market",
    "symbol",
    "name",
    "limit",
    "offset",
    "section",
    "scope",
})


@dataclass(frozen=True)
class MarketInformationQuery:
    market: str = "ashare"
    symbol: str = ""
    name: str = ""
    limit: int = 20
    offset: int = 0
    section: str = "all"
    scope: str = "all"


class MarketInformationUnavailable(RuntimeError):
    pass


def market_information_query_from_params(
    params: Mapping[str, list[str]],
) -> MarketInformationQuery:
    unknown = set(params) - MARKET_INFORMATION_QUERY_KEYS
    if unknown:
        raise ValueError(f"unsupported_parameter:{sorted(unknown)[0]}")
    market = _single_param(params, "market", "ashare").casefold()
    if market not in {"ashare", "us", "crypto"}:
        raise ValueError("unsupported_market")
    symbol = _single_param(params, "symbol", "").upper()
    if len(symbol) > 32 or (
        symbol
        and (
            not re.fullmatch(r"[A-Z0-9._/:-]+", symbol)
            or ".." in symbol
            or symbol[0] in "/:"
        )
    ):
        raise ValueError("invalid_symbol")
    name = "".join(
        character
        for character in _single_param(params, "name", "")
        if character.isprintable()
    ).strip()
    if len(name) > 64:
        raise ValueError("invalid_name")
    raw_limit = _single_param(params, "limit", "20")
    try:
        limit = int(raw_limit)
    except ValueError as error:
        raise ValueError("invalid_limit") from error
    if not 1 <= limit <= 50:
        raise ValueError("invalid_limit")
    raw_offset = _single_param(params, "offset", "0")
    try:
        offset = int(raw_offset)
    except ValueError as error:
        raise ValueError("invalid_offset") from error
    # ponytail: bound public-provider fan-out; use persisted provider cursors for deeper history.
    if not 0 <= offset <= MARKET_INFORMATION_MAX_NEWS_OFFSET:
        raise ValueError("invalid_offset")
    section = _single_param(params, "section", "all").casefold()
    if section not in {"all", "news"}:
        raise ValueError("unsupported_section")
    scope = _single_param(params, "scope", "all").casefold()
    if scope not in {"all", "market", "instrument"}:
        raise ValueError("unsupported_scope")
    return MarketInformationQuery(
        market=market,
        symbol=symbol,
        name=name,
        limit=limit,
        offset=offset,
        section=section,
        scope=scope,
    )


class MarketInformationService:
    def __init__(
        self,
        *,
        market_discovery_service: MarketDiscoveryService | None = None,
        fetch_text: FetchText | None = None,
        finnhub_api_key: str | None = None,
        fetch_finnhub_text: FetchFinnhubText | None = None,
        clock: Clock | None = None,
    ) -> None:
        self.market_discovery_service = (
            market_discovery_service or MarketDiscoveryService()
        )
        self.fetch_text = fetch_text or default_fetch_text
        self.finnhub_api_key = (
            finnhub_api_key
            if finnhub_api_key is not None
            else os.getenv("FINNHUB_API_KEY", "")
        )
        self.fetch_finnhub_text = (
            fetch_finnhub_text or default_fetch_finnhub_text
        )
        self.clock = clock or (lambda: datetime.now(timezone.utc))
        self._cache: dict[
            tuple[str, str, str, int, int, str, str],
            tuple[datetime, dict[str, object]],
        ] = {}
        self._retry_after: dict[
            tuple[str, str, str, int, int, str, str],
            datetime,
        ] = {}
        # ponytail: one lock keeps this low-volume read cache coherent; split per key if contention appears.
        self._cache_lock = Lock()

    def read(self, query: MarketInformationQuery) -> dict[str, object]:
        if query.market not in {"ashare", "us", "crypto"}:
            raise ValueError("unsupported_market")
        if query.section not in {"all", "news"}:
            raise ValueError("unsupported_section")
        if query.scope not in {"all", "market", "instrument"}:
            raise ValueError("unsupported_scope")
        if not 0 <= query.offset <= MARKET_INFORMATION_MAX_NEWS_OFFSET:
            raise ValueError("invalid_offset")
        now = self.clock().astimezone(timezone.utc)
        cache_key = (
            query.market,
            query.symbol,
            query.name,
            query.limit,
            query.offset,
            query.section,
            query.scope,
        )
        with self._cache_lock:
            cached = self._cache.get(cache_key)
            if cached is not None and now - cached[0] < MARKET_INFORMATION_CACHE_TTL:
                return dict(cached[1])
            retry_after = self._retry_after.get(cache_key)
            if (
                cached is not None
                and retry_after is not None
                and now < retry_after
            ):
                return _stale_cached_payload(cached[1])
            try:
                payload = self._read_uncached(query, now=now)
            except Exception as error:
                if cached is not None:
                    self._retry_after[cache_key] = (
                        now + MARKET_INFORMATION_RETRY_COOLDOWN
                    )
                    return _stale_cached_payload(cached[1])
                raise MarketInformationUnavailable(
                    "市场资讯上游当前不可用。"
                ) from error
            self._cache[cache_key] = (now, payload)
            self._retry_after.pop(cache_key, None)
            return dict(payload)

    def update_finnhub_api_key(self, api_key: str) -> None:
        if api_key == self.finnhub_api_key:
            return
        with self._cache_lock:
            self.finnhub_api_key = api_key
            self._cache.clear()
            self._retry_after.clear()

    def _read_uncached(
        self,
        query: MarketInformationQuery,
        *,
        now: datetime,
    ) -> dict[str, object]:
        warnings: list[str] = []
        discovery_results: list[dict[str, object]] = []
        if query.section == "news":
            leaders = active = None
        elif query.market in {"ashare", "crypto"}:
            try:
                leaders = self.market_discovery_service.discover(
                    MarketDiscoveryQuery(
                        market=query.market,
                        sort="changePct",
                        direction="desc",
                        limit=min(query.limit, 10),
                    )
                )
                discovery_results.append(leaders)
            except Exception:
                leaders = None
                warnings.append("市场涨幅榜暂不可用。")
            try:
                active = self.market_discovery_service.discover(
                    MarketDiscoveryQuery(
                        market=query.market,
                        sort="amount",
                        direction="desc",
                        limit=min(query.limit, 10),
                    )
                )
                discovery_results.append(active)
            except Exception:
                active = None
                warnings.append("市场活跃榜暂不可用。")
        else:
            leaders = active = None
            warnings.append("美股市场广度暂未接入。")
        if query.market == "ashare":
            news, news_warnings, news_available, news_has_more = self._ashare_news(
                query,
                at=now,
            )
            news_source = "eastmoney" if news_available else ""
        elif query.market == "us":
            news, news_warnings, news_available, news_has_more = self._finnhub_news(
                "general",
                query=query,
                at=now,
            )
            news_source = "finnhub" if news_available else ""
        else:
            news, news_warnings, news_available, news_has_more = self._finnhub_news(
                "crypto",
                query=query,
                at=now,
            )
            news_source = "finnhub" if news_available else ""
        known_empty_state = (
            query.market == "us"
            and not self.finnhub_api_key
        ) or (
            query.section == "news"
            and query.market == "crypto"
            and not self.finnhub_api_key
        )
        if not discovery_results and not news_available and not known_empty_state:
            raise RuntimeError("market_information_all_sources_unavailable")
        observed_at = now.isoformat()
        overview_result = leaders or active
        sources = [
            source
            for source in (
                *(
                    str(result.get("source") or "")
                    for result in discovery_results
                ),
                news_source,
            )
            if source
        ]
        warnings.extend(
            str(warning)
            for result in discovery_results
            for warning in result.get("warnings", [])
        )
        warnings.extend(news_warnings)
        payload: dict[str, object] = {
            "market": query.market,
            "symbol": query.symbol,
            "section": query.section,
            "overview": (
                overview_result["overview"]
                if overview_result is not None
                else _empty_overview()
            ),
            "leaders": leaders["items"] if leaders is not None else [],
            "active": active["items"] if active is not None else [],
            "news": news,
            "pagination": {
                "limit": query.limit,
                "offset": query.offset,
                "hasMore": news_has_more,
                "scope": query.scope,
            },
            "source": "+".join(dict.fromkeys(sources)),
            "observedAt": observed_at,
            "freshness": (
                "stale"
                if any(
                    result.get("freshness") == "stale"
                    for result in discovery_results
                )
                else "fresh"
            ),
            "warnings": list(dict.fromkeys(warnings)),
        }
        payload["snapshotHash"] = _payload_hash(payload)
        return payload

    def _ashare_news(
        self,
        query: MarketInformationQuery,
        *,
        at: datetime,
    ) -> tuple[list[dict[str, object]], list[str], bool, bool]:
        target = query.offset + query.limit + 1
        general: list[dict[str, object]] = []
        instrument: list[dict[str, object]] = []
        warnings: list[str] = []
        available = False
        general_has_more = False
        instrument_has_more = False
        if query.scope in {"all", "market"}:
            try:
                general, general_has_more = self._eastmoney_fast_news_window(
                    target,
                    at=at,
                )
                available = True
            except Exception:
                warnings.append("东方财富市场快讯暂不可用。")
        if query.scope in {"all", "instrument"}:
            if query.symbol:
                try:
                    instrument, instrument_has_more = (
                        self._eastmoney_search_news_window(query, target)
                    )
                    available = True
                except Exception:
                    warnings.append("东方财富个股新闻暂不可用。")
            elif query.scope == "instrument":
                warnings.append("当前市场未选择标的，暂无标的资讯。")
                available = True
        page, has_more = _news_page(
            general,
            instrument,
            query,
            market_has_more=general_has_more,
            instrument_has_more=instrument_has_more,
        )
        return page, warnings, available, has_more

    def _eastmoney_fast_news_window(
        self,
        target: int,
        *,
        at: datetime,
    ) -> tuple[list[dict[str, object]], bool]:
        items: list[dict[str, object]] = []
        sort_end = ""
        total: int | None = None
        while len(items) < target:
            page_size = min(200, target - len(items))
            params = urlencode({
                "client": "web",
                "biz": "web_724",
                "fastColumn": "102",
                "sortEnd": sort_end,
                "pageSize": page_size,
                "req_trace": str(int(at.timestamp() * 1_000)),
            })
            payload = json.loads(
                self.fetch_text(
                    f"{EASTMONEY_FAST_NEWS_URL}?{params}",
                    "utf-8",
                )
            )
            page = _eastmoney_fast_news(payload)
            data = payload.get("data") if isinstance(payload, dict) else None
            next_sort_end = (
                str(data.get("sortEnd") or "")
                if isinstance(data, dict)
                else ""
            )
            try:
                total = int(data.get("total")) if isinstance(data, dict) else None
            except (TypeError, ValueError):
                total = None
            items.extend(page)
            if not page or not next_sort_end or next_sort_end == sort_end:
                break
            sort_end = next_sort_end
        unique = _dedupe_news(items)
        return unique[:target], (
            total > len(items)
            if total is not None
            else len(items) >= target
        )

    def _eastmoney_search_news_window(
        self,
        query: MarketInformationQuery,
        target: int,
    ) -> tuple[list[dict[str, object]], bool]:
        items: list[dict[str, object]] = []
        page_index = 1
        page_size = min(100, target)
        total: int | None = None
        while len(items) < target:
            search_params = urlencode({
                "cb": "aiqt",
                "param": json.dumps(
                    {
                        "uid": "",
                        "keyword": query.name or query.symbol,
                        "type": ["cmsArticleWebOld"],
                        "client": "web",
                        "clientType": "web",
                        "clientVersion": "curr",
                        "param": {
                            "cmsArticleWebOld": {
                                "searchScope": "default",
                                "sort": "default",
                                "pageIndex": page_index,
                                "pageSize": page_size,
                                "preTag": "<em>",
                                "postTag": "</em>",
                            }
                        },
                    },
                    ensure_ascii=False,
                    separators=(",", ":"),
                ),
            })
            payload = _jsonp_payload(
                self.fetch_text(
                    f"{EASTMONEY_SEARCH_URL}?{search_params}",
                    "utf-8",
                )
            )
            page = _eastmoney_search_news(payload)
            try:
                total = int(payload.get("hitsTotal")) if isinstance(payload, dict) else None
            except (TypeError, ValueError):
                total = None
            items.extend(page)
            if len(page) < page_size:
                break
            page_index += 1
        unique = _dedupe_news(items)
        return unique[:target], (
            total > len(items)
            if total is not None
            else len(items) >= target
        )

    def _finnhub_news(
        self,
        category: str,
        *,
        query: MarketInformationQuery,
        at: datetime,
    ) -> tuple[list[dict[str, object]], list[str], bool, bool]:
        if query.scope == "instrument" and not query.symbol:
            return [], ["当前市场未选择标的，暂无标的资讯。"], True, False
        if not self.finnhub_api_key:
            return [], ["Finnhub API Key 未配置，新闻暂不可用。"], False, False
        market_news: list[dict[str, object]] = []
        company_news: list[dict[str, object]] = []
        warnings: list[str] = []
        available = False
        if query.scope in {"all", "market"}:
            url = f"{FINNHUB_BASE_URL}/news?{urlencode({'category': category})}"
            try:
                market_news = _finnhub_news_items(
                    json.loads(
                        self.fetch_finnhub_text(
                            url,
                            self.finnhub_api_key,
                        )
                    ),
                    scope="market",
                )
                available = True
            except Exception:
                warnings.append("Finnhub 市场新闻暂不可用。")
        if query.symbol and query.scope in {"all", "instrument"}:
            company_params = urlencode({
                'symbol': query.symbol,
                'from': (at.date() - timedelta(days=7)).isoformat(),
                'to': at.date().isoformat(),
            })
            company_url = f"{FINNHUB_BASE_URL}/company-news?{company_params}"
            try:
                company_news = _finnhub_news_items(
                    json.loads(
                        self.fetch_finnhub_text(
                            company_url,
                            self.finnhub_api_key,
                        )
                    ),
                    scope="instrument",
                )
                available = True
            except Exception:
                warnings.append("Finnhub 个股新闻暂不可用。")
        page, has_more = _news_page(
            market_news,
            company_news,
            query,
        )
        return page, warnings, available, has_more


def _finnhub_news_items(
    payload: object,
    *,
    scope: str,
) -> list[dict[str, object]]:
    if not isinstance(payload, list):
        raise ValueError("invalid_finnhub_news_payload")
    return [
        item
        for row in payload
        if isinstance(row, dict)
        and (
            item := _news_item(
                identifier=row.get("id"),
                headline=row.get("headline"),
                summary=row.get("summary"),
                published_at=_epoch_iso(row.get("datetime")),
                source=row.get("source") or "Finnhub",
                scope=scope,
                url=row.get("url"),
            )
        )
    ]


def _empty_overview() -> dict[str, int]:
    return {
        "universeCount": 0,
        "advancing": 0,
        "declining": 0,
        "flat": 0,
        "totalAmount": 0,
    }


def _stale_cached_payload(payload: dict[str, object]) -> dict[str, object]:
    stale = dict(payload)
    stale["freshness"] = "stale"
    stale["warnings"] = list(dict.fromkeys([
        *stale.get("warnings", []),
        "市场资讯刷新失败，已使用最近一次成功快照。",
    ]))
    return stale


def _eastmoney_fast_news(payload: object) -> list[dict[str, object]]:
    if not isinstance(payload, dict):
        raise ValueError("invalid_eastmoney_fast_news_payload")
    data = payload.get("data")
    rows = data.get("fastNewsList") if isinstance(data, dict) else None
    if not isinstance(rows, list):
        raise ValueError("invalid_eastmoney_fast_news_payload")
    return [
        item
        for row in rows
        if isinstance(row, dict)
        and (
            item := _news_item(
                identifier=row.get("code"),
                headline=row.get("title"),
                summary=row.get("summary"),
                published_at=row.get("showTime"),
                source="东方财富",
                scope="market",
                url=_eastmoney_article_url(row.get("code")),
            )
        )
    ]


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


def _eastmoney_search_news(payload: object) -> list[dict[str, object]]:
    if not isinstance(payload, dict):
        raise ValueError("invalid_eastmoney_search_news_payload")
    result = payload.get("result")
    rows = result.get("cmsArticleWebOld") if isinstance(result, dict) else None
    if not isinstance(rows, list):
        raise ValueError("invalid_eastmoney_search_news_payload")
    return [
        item
        for row in rows
        if isinstance(row, dict)
        and (
            item := _news_item(
                identifier=row.get("code"),
                headline=row.get("title"),
                summary=row.get("content"),
                published_at=row.get("date"),
                source=row.get("mediaName") or "东方财富",
                scope="instrument",
                url=row.get("url"),
            )
        )
    ]


def _news_item(
    *,
    identifier: object,
    headline: object,
    summary: object,
    published_at: object,
    source: object,
    scope: str,
    url: object,
) -> dict[str, object] | None:
    clean_headline = _plain_text(headline)
    if not clean_headline:
        return None
    return {
        "id": str(identifier or hashlib.sha256(clean_headline.encode()).hexdigest()[:16]),
        "headline": clean_headline,
        "summary": _plain_text(summary)[:280],
        "publishedAt": str(published_at or ""),
        "source": _plain_text(source),
        "scope": scope,
        "url": _safe_http_url(url),
    }


def _jsonp_payload(value: str) -> object:
    start = value.find("(")
    end = value.rfind(")")
    if start < 0 or end <= start:
        raise ValueError("invalid_eastmoney_news_payload")
    return json.loads(value[start + 1 : end])


def _plain_text(value: object) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", str(value or "")))).strip()


def _safe_http_url(value: object) -> str | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    parsed = urlparse(raw)
    return raw if parsed.scheme in {"http", "https"} and parsed.netloc else None


def _epoch_iso(value: object) -> str:
    try:
        timestamp = int(value)
    except (TypeError, ValueError):
        return ""
    return (
        datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()
        if timestamp > 0
        else ""
    )


def _eastmoney_article_url(code: object) -> str | None:
    value = str(code or "").strip()
    return (
        f"https://finance.eastmoney.com/a/{value}.html"
        if re.fullmatch(r"\d{10,24}", value)
        else None
    )


def _dedupe_news(items: list[dict[str, object]]) -> list[dict[str, object]]:
    unique: dict[tuple[object, object], dict[str, object]] = {}
    for item in items:
        unique.setdefault((item["headline"], item["url"]), item)
    return list(unique.values())


def _interleave_news(
    market_news: list[dict[str, object]],
    instrument_news: list[dict[str, object]],
) -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    for index in range(max(len(market_news), len(instrument_news))):
        if index < len(market_news):
            items.append(market_news[index])
        if index < len(instrument_news):
            items.append(instrument_news[index])
    return _dedupe_news(items)


def _news_page(
    market_news: list[dict[str, object]],
    instrument_news: list[dict[str, object]],
    query: MarketInformationQuery,
    *,
    market_has_more: bool = False,
    instrument_has_more: bool = False,
) -> tuple[list[dict[str, object]], bool]:
    if query.scope == "market":
        items = _dedupe_news(market_news)
        provider_has_more = market_has_more
    elif query.scope == "instrument":
        items = _dedupe_news(instrument_news)
        provider_has_more = instrument_has_more
    else:
        items = _interleave_news(market_news, instrument_news)
        provider_has_more = market_has_more or instrument_has_more
    end = query.offset + query.limit
    return items[query.offset:end], (
        (len(items) > end or provider_has_more)
        and end <= MARKET_INFORMATION_MAX_NEWS_OFFSET
    )


def _payload_hash(payload: dict[str, object]) -> str:
    return hashlib.sha256(
        json.dumps(
            payload,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode()
    ).hexdigest()


def default_fetch_text(url: str, encoding: str = "utf-8") -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 AIQuantificationTools/0.1",
            "Referer": "https://finance.eastmoney.com/",
        },
    )
    with urlopen(request, timeout=10) as response:
        return response.read().decode(encoding, errors="ignore")


def default_fetch_finnhub_text(url: str, api_key: str) -> str:
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "AIQuantificationTools/0.1",
            "X-Finnhub-Token": api_key,
        },
    )
    with urlopen(request, timeout=10) as response:
        return response.read().decode("utf-8", errors="ignore")
