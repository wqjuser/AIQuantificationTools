from __future__ import annotations

from ..support.execution_export import _fetch_market_klines_with_cache
from ..support.research_import_codecs import (
    _optional_audit_event_id,
    _parse_kline_end,
    _parse_search_limit,
)
from ..support.stage5 import (
    _parse_kline_limit,
    _parse_limit,
)
from concurrent.futures import ThreadPoolExecutor
from quant_core.adapter_error_ledger import market_data_adapter_error_event_to_payload
from quant_core.cache_refresh_runs import (
    create_watchlist_cache_refresh_run,
    watchlist_cache_refresh_item_from_quality,
    watchlist_cache_refresh_run_to_payload,
)
from quant_core.data_foundation import (
    assess_market_data_quality,
    data_quality_to_payload,
)
from quant_core.domain import (
    DataQuality,
    MarketDataRequest,
)
from quant_core.live_quotes import market_quotes_to_payload
from quant_core.market_ai_selection import MarketAiSelectionError
from quant_core.market_calendar import build_market_calendar_status
from quant_core.market_discovery import (
    MarketDiscoveryUnavailable,
    market_discovery_query_from_params,
)
from quant_core.market_information import (
    MarketInformationUnavailable,
    market_information_query_from_params,
)
from quant_core.market_klines import (
    build_market_data_readiness,
    kline_http_timeout,
    market_klines_to_payload,
)
from quant_core.market_search import market_search_to_payload
from quant_core.terminal import Instrument
from quant_core.watchlist import watchlist_from_payload
from urllib.parse import parse_qs

def post_market_ai_selections(self, parsed):
    try:
        selection = self._market_ai_selection_service().select(
            self._read_json_body()
        )
    except MarketAiSelectionError as error:
        self._send_json(
            {"error": error.code, "detail": error.detail},
            status=error.status,
        )
        return
    except ValueError:
        self._send_json(
            {
                "error": "invalid_market_ai_selection_request",
                "detail": "请求正文必须是有效的 JSON 对象。",
            },
            status=400,
        )
        return
    self._send_json(selection, status=201)
    return


def post_market_ai_selection_reviews(self, parsed):
    try:
        review = self._market_ai_selection_service().review(
            self._read_json_body()
        )
    except MarketAiSelectionError as error:
        self._send_json(
            {"error": error.code, "detail": error.detail},
            status=error.status,
        )
        return
    except ValueError:
        self._send_json(
            {
                "error": "invalid_market_ai_selection_review_request",
                "detail": "请求正文必须是有效的 JSON 对象。",
            },
            status=400,
        )
        return
    self._send_json({"review": review}, status=201)
    return


def post_cache_refresh(self, parsed):
    try:
        payload = self._read_json_body()
        market = str(payload.get("market") or "ashare")
        symbol = str(payload.get("symbol") or "600000")
        timeframe = str(payload.get("timeframe") or "1d")
        limit = _parse_kline_limit(str(payload.get("limit") or "160"))
        override_audit_event_id = _optional_audit_event_id(payload.get("overrideAuditEventId"))
        request = MarketDataRequest(market=market, symbol=symbol, timeframe=timeframe)
        bars, quality = self.kline_adapter.fetch_ohlcv(request, limit=limit)
        quality = assess_market_data_quality(request, bars, quality)
        self._record_adapter_error_if_needed(request, quality=quality, context="cache-refresh")
        upserted_rows = self.cache.upsert_bars(bars) if quality.is_complete else 0
        refresh_run = self.watchlist_cache_refresh_store.record(
            create_watchlist_cache_refresh_run(
                items=[
                    watchlist_cache_refresh_item_from_quality(
                        instrument=Instrument(
                            market=market,  # type: ignore[arg-type]
                            symbol=symbol,
                            name=symbol,
                            change_pct=0.0,
                        ),
                        timeframe=timeframe,
                        requested_limit=limit,
                        quality=quality,
                        upserted_rows=upserted_rows,
                    )
                ],
                timeframe=timeframe,
                requested_limit=limit,
                override_audit_event_id=override_audit_event_id,
            )
        )
    except ValueError as error:
        self._send_json({"error": "invalid_cache_refresh", "detail": str(error)}, status=400)
        return
    quality_payload = data_quality_to_payload(quality)
    self._send_json(
        {
            "refresh": {
                "market": market,
                "symbol": symbol,
                "timeframe": timeframe,
                "requestedLimit": limit,
                "upsertedRows": upserted_rows,
                "overrideAuditEventId": override_audit_event_id,
                "quality": quality_payload,
            },
            "watchlistRefresh": watchlist_cache_refresh_run_to_payload(refresh_run),
            "settings": self._settings_status_payload(),
        }
    )
    return


def post_cache_watchlist_refreshes(self, parsed):
    try:
        payload = self._read_json_body()
        instruments = watchlist_from_payload(payload.get("watchlist"))
        timeframe = str(payload.get("timeframe") or "1d")
        limit = _parse_kline_limit(str(payload.get("limit") or "160"))
        override_audit_event_id = _optional_audit_event_id(payload.get("overrideAuditEventId"))

        def fetch_instrument(instrument):
            request = MarketDataRequest(
                market=instrument.market,
                symbol=instrument.symbol,
                timeframe=timeframe,
            )
            try:
                with kline_http_timeout(3):
                    bars, quality = self.kline_adapter.fetch_ohlcv(request, limit=limit)
                    quality = assess_market_data_quality(request, bars, quality)
                return request, bars, quality, None
            except Exception as error:
                return request, [], None, str(error)

        with ThreadPoolExecutor(max_workers=min(4, len(instruments))) as executor:
            fetch_results = list(executor.map(fetch_instrument, instruments))

        items = []
        for instrument, (request, bars, quality, error) in zip(instruments, fetch_results):
            if quality is not None:
                try:
                    self._record_adapter_error_if_needed(
                        request,
                        quality=quality,
                        context="watchlist-cache-refresh",
                    )
                    upserted_rows = self.cache.upsert_bars(bars) if quality.is_complete else 0
                    items.append(
                        watchlist_cache_refresh_item_from_quality(
                            instrument=instrument,
                            timeframe=timeframe,
                            requested_limit=limit,
                            quality=quality,
                            upserted_rows=upserted_rows,
                        )
                    )
                    continue
                except Exception as item_error:
                    error = str(item_error)
            failure = error or "unknown market data error"
            self._record_adapter_error_if_needed(
                request,
                quality=None,
                context="watchlist-cache-refresh",
                error=failure,
            )
            items.append(
                watchlist_cache_refresh_item_from_quality(
                    instrument=instrument,
                    timeframe=timeframe,
                    requested_limit=limit,
                    quality=DataQuality(
                        source="unavailable",
                        is_complete=False,
                        warnings=[failure],
                        rows=0,
                    ),
                    upserted_rows=0,
                    error=failure,
                )
            )
        refresh_run = self.watchlist_cache_refresh_store.record(
            create_watchlist_cache_refresh_run(
                items=items,
                timeframe=timeframe,
                requested_limit=limit,
                override_audit_event_id=override_audit_event_id,
            )
        )
    except ValueError as error:
        self._send_json({"error": "invalid_watchlist_cache_refresh", "detail": str(error)}, status=400)
        return
    self._send_json(
        {
            "watchlistRefresh": watchlist_cache_refresh_run_to_payload(refresh_run),
            "settings": self._settings_status_payload(),
        },
        status=201,
    )
    return


def get_market_ai_selection_statistics(self, parsed):
    if parsed.query:
        self._send_json(
            {
                "error": "invalid_market_ai_selection_statistics_query",
                "detail": "AI 选股质量统计不接受浏览器提供的统计事实。",
            },
            status=400,
        )
        return
    try:
        statistics = self._market_ai_selection_service().quality_statistics()
    except MarketAiSelectionError as error:
        self._send_json(
            {"error": error.code, "detail": error.detail},
            status=error.status,
        )
        return
    self._send_json({"statistics": statistics})
    return


def get_cache_watchlist_refreshes(self, parsed):
    query = parse_qs(parsed.query)
    limit = _parse_limit(query.get("limit", ["10"])[0])
    refreshes = self.watchlist_cache_refresh_store.list_recent(limit=limit)
    self._send_json({"watchlistRefreshes": [watchlist_cache_refresh_run_to_payload(run) for run in refreshes]})
    return


def get_market_information(self, parsed):
    try:
        information_query = market_information_query_from_params(
            parse_qs(parsed.query, keep_blank_values=True)
        )
    except ValueError as error:
        self._send_json(
            {
                "error": "invalid_market_information_query",
                "detail": str(error),
            },
            status=400,
        )
        return
    try:
        payload = self.market_information_service.read(
            information_query
        )
    except MarketInformationUnavailable as error:
        self._send_json(
            {
                "error": "market_information_unavailable",
                "detail": str(error),
            },
            status=502,
        )
        return
    self._send_json(payload)
    return


def get_market_discovery(self, parsed):
    try:
        discovery_query = market_discovery_query_from_params(
            parse_qs(parsed.query, keep_blank_values=True)
        )
    except ValueError as error:
        self._send_json(
            {
                "error": "invalid_market_discovery_query",
                "detail": str(error),
            },
            status=400,
        )
        return
    try:
        payload = self.market_discovery_service.discover(discovery_query)
    except MarketDiscoveryUnavailable as error:
        self._send_json(
            {
                "error": "market_discovery_unavailable",
                "detail": str(error),
            },
            status=502,
        )
        return
    self._send_json(payload)
    return


def get_market_quotes(self, parsed):
    query = parse_qs(parsed.query)
    workspace = self._workspace_with_saved_watchlist()
    instruments = workspace.watchlist
    market = query.get("market", [""])[0]
    symbol = query.get("symbol", [""])[0]
    if market and symbol:
        instruments = [instrument for instrument in instruments if instrument.market == market and instrument.symbol == symbol]
        if not instruments:
            from quant_core.terminal import Instrument

            instruments = [Instrument(symbol=symbol, name=symbol, market=market, change_pct=0.0)]
    quotes = self.quote_adapter.fetch_quotes(instruments)
    self._send_json(market_quotes_to_payload(quotes))
    return


def get_market_calendar(self, parsed):
    query = parse_qs(parsed.query)
    market = query.get("market", ["ashare"])[0]
    at = query.get("at", [""])[0].strip() or None
    try:
        calendar = build_market_calendar_status(market, at=at)
    except ValueError as error:
        self._send_json({"error": "invalid_market_calendar_request", "detail": str(error)}, status=400)
        return
    self._send_json({"calendar": calendar})
    return


def get_market_search(self, parsed):
    query = parse_qs(parsed.query)
    market = query.get("market", ["ashare"])[0]
    search_query = query.get("query", [""])[0]
    limit = _parse_search_limit(query.get("limit", ["8"])[0])
    timeframe = query.get("timeframe", [""])[0].strip() or None
    results = self.search_adapter.search(market=market, query=search_query, limit=limit)
    cache_contexts = [
        self.cache.context(result.market, result.symbol, timeframe)
        for result in results
    ] if timeframe else None
    self._send_json(
        market_search_to_payload(
            market,
            search_query,
            results,
            timeframe=timeframe,
            cache_contexts=cache_contexts,
        )
    )
    return


def get_market_data_readiness(self, parsed):
    query = parse_qs(parsed.query)
    market = query.get("market", ["ashare"])[0]
    symbol = query.get("symbol", ["600000"])[0]
    timeframe = query.get("timeframe", ["1d"])[0]
    payload = build_market_data_readiness(
        market=market,
        symbol=symbol,
        timeframe=timeframe,
        cache_context=self.cache.context(market, symbol, timeframe),
        watchlist_refreshes=[
            watchlist_cache_refresh_run_to_payload(run)
            for run in self.watchlist_cache_refresh_store.list_recent(limit=25)
        ],
        adapter_error_events=[
            market_data_adapter_error_event_to_payload(event)
            for event in self.adapter_error_store.list_recent(limit=50)
        ],
    )
    self._send_json(payload)
    return


def get_market_klines(self, parsed):
    query = parse_qs(parsed.query)
    market = query.get("market", ["ashare"])[0]
    symbol = query.get("symbol", ["600000"])[0]
    timeframe = query.get("timeframe", ["1d"])[0]
    limit = _parse_kline_limit(query.get("limit", ["160"])[0])
    try:
        data_end = _parse_kline_end(query.get("end", [""])[0])
    except ValueError as error:
        self._send_json({"error": "invalid_kline_end", "detail": str(error)}, status=400)
        return
    request = MarketDataRequest(
        market=market,
        symbol=symbol,
        timeframe=timeframe,
        end=data_end,
    )
    try:
        bars, quality = _fetch_market_klines_with_cache(
            cache=self.cache,
            adapter=self.kline_adapter,
            request=request,
            limit=limit,
        )
    except ValueError as error:
        self._record_adapter_error_if_needed(
            request,
            quality=None,
            context="market-klines",
            error=str(error),
        )
        self._send_json({"error": "market_klines_unavailable", "detail": str(error)}, status=502)
        return
    self._record_adapter_error_if_needed(request, quality=quality, context="market-klines")
    self._send_json(market_klines_to_payload(market, symbol, timeframe, bars, quality))
    return
