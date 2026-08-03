from __future__ import annotations

import os
from http.server import ThreadingHTTPServer
from quant_core.auto_paper_trading import (
    AutoPaperTradingRunner,
    AutoPaperTradingService,
)
from quant_core.live_quotes import QuantDingerLiveQuoteAdapter
from quant_core.market_klines import QuantDingerKlineAdapter
from quant_core.monitoring import MonitoringRunner
from quant_core.stage6_sandbox import (
    BinanceSpotTestnetRoute,
    Stage6SandboxExecutionService,
)

from quant_core.http_api.handler import ComposedQuantApiHandler
from quant_core.http_api.support.execution_export import (
    _fetch_market_klines_with_cache,
)
from quant_core.http_api.support.market_data import (
    evaluate_auto_paper_trading_once,
)
from quant_core.http_api.support.runtime import (
    _build_auto_paper_trading_service,
    _build_monitoring_service,
    _handler_execution_environment,
    _handler_platform_environment,
    _runtime_int,
)
from quant_core.http_api.support.p0 import (
    _build_p0_ai_review_record,
)
from quant_core.http_api.support.production_evidence import (
    _adapter_error_message,
    _adapter_error_target,
    _stage7_production_route_review_is_current,
    _stage9_production_admission_candidate,
    _stage9_production_admission_candidates,
    _stage9_production_admission_reviews,
)
from quant_core.http_api.support.research_import_codecs import (
    _backtest_engine_from_query,
    _parse_kline_end,
)
from quant_core.http_api.support.research_import_transaction import (
    _persist_research_run_import,
)
from quant_core.http_api.support.stage5 import (
    _stage5_sandbox_authorization_probe_execution,
    _stage5_sandbox_authorization_sources_for_export,
    _stage5_shadow_sessions,
)

__all__ = (
    "QuantApiHandler",
    "_adapter_error_message",
    "_adapter_error_target",
    "_backtest_engine_from_query",
    "_build_p0_ai_review_record",
    "_fetch_market_klines_with_cache",
    "_parse_kline_end",
    "_persist_research_run_import",
    "_stage5_sandbox_authorization_probe_execution",
    "_stage5_sandbox_authorization_sources_for_export",
    "_stage5_shadow_sessions",
    "_stage7_production_route_review_is_current",
    "_stage9_production_admission_candidate",
    "_stage9_production_admission_candidates",
    "_stage9_production_admission_reviews",
    "build_auto_paper_trading_runner",
    "evaluate_auto_paper_trading_once",
    "resolve_api_bind",
    "run",
)


class QuantApiHandler(ComposedQuantApiHandler):
    pass


def resolve_api_bind(
    host: str | None = None,
    port: int | str | None = None,
    environ: dict[str, str] | None = None,
) -> tuple[str, int]:
    source = os.environ if environ is None else environ
    bind_host = (host or source.get("QUANT_CORE_HOST") or "127.0.0.1").strip() or "127.0.0.1"
    raw_port = port if port is not None else source.get("QUANT_CORE_PORT", "8765")
    try:
        bind_port = int(raw_port)
    except (TypeError, ValueError):
        bind_port = 8765
    if bind_port < 1 or bind_port > 65535:
        bind_port = 8765
    return bind_host, bind_port


def build_auto_paper_trading_runner(
    handler_type: type[QuantApiHandler] = QuantApiHandler,
    *,
    interval_seconds: float | None = None,
) -> AutoPaperTradingRunner:
    service = _build_auto_paper_trading_service(handler_type)
    if interval_seconds is None:
        interval_seconds = _runtime_int(
            _handler_platform_environment(handler_type).get(
                "AIQT_AUTO_TRADING_INTERVAL_SECONDS"
            ),
            35,
            5,
            3_600,
        )

    def evaluate_once() -> None:
        evaluate_auto_paper_trading_once(
            service,
            cache=handler_type.cache,
            adapter=handler_type.kline_adapter,
        )

    return AutoPaperTradingRunner(
        service,
        evaluate_once,
        interval_seconds=interval_seconds,
    )


def build_monitoring_runner(
    handler_type: type[QuantApiHandler] = QuantApiHandler,
    *,
    auto_trading_service: AutoPaperTradingService | None = None,
    interval_seconds: float = 35,
) -> MonitoringRunner:
    observed_service = (
        auto_trading_service
        or _build_auto_paper_trading_service(handler_type)
    )
    return MonitoringRunner(
        _build_monitoring_service(handler_type),
        observed_service.snapshot,
        interval_seconds=interval_seconds,
    )


def run(host: str | None = None, port: int | str | None = None) -> None:
    if QuantApiHandler.platform_settings_store.apply_to_environment(os.environ):
        QuantApiHandler.quote_adapter = QuantDingerLiveQuoteAdapter()
        QuantApiHandler.kline_adapter = QuantDingerKlineAdapter(
            fallback_adapter=QuantApiHandler.adapter
        )
        QuantApiHandler.market_information_service.update_finnhub_api_key(
            os.environ.get("FINNHUB_API_KEY", "")
        )
    bind_host, bind_port = resolve_api_bind(host=host, port=port)
    factory = QuantApiHandler.stage6_sandbox_route_factory
    route = (
        factory()
        if callable(factory)
        else BinanceSpotTestnetRoute(
            env=_handler_execution_environment(QuantApiHandler)
        )
    )
    Stage6SandboxExecutionService(QuantApiHandler.audit_event_store, route).recover_active_batches()
    server = ThreadingHTTPServer((bind_host, bind_port), QuantApiHandler)
    auto_trading_runner = build_auto_paper_trading_runner()
    QuantApiHandler.auto_paper_trading_service = auto_trading_runner.service
    QuantApiHandler.auto_paper_trading_runner = auto_trading_runner
    monitoring_runner = build_monitoring_runner(
        auto_trading_service=auto_trading_runner.service,
    )
    QuantApiHandler.monitoring_service = monitoring_runner.service
    try:
        auto_trading_runner.start()
        monitoring_runner.start()
        print(f"quant-core API listening on http://{bind_host}:{bind_port}")
        server.serve_forever()
    finally:
        monitoring_runner.stop()
        auto_trading_runner.stop()
        QuantApiHandler.auto_paper_trading_service = None
        QuantApiHandler.auto_paper_trading_runner = None
        server.server_close()


if __name__ == "__main__":
    run()
