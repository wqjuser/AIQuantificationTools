from __future__ import annotations

import os
from .production_evidence import (
    _adapter_error_message,
    _adapter_error_target,
)
from .runtime import (
    _build_auto_paper_trading_service,
    _handler_monitoring_environment,
    _runtime_int,
)
from quant_core.adapter_error_ledger import (
    create_market_data_adapter_error_event,
    market_data_adapter_error_event_to_payload,
)
from quant_core.adapters import build_free_stockdb_adapter
from quant_core.domain import (
    DataQuality,
    MarketDataRequest,
)
from quant_core.monitoring import build_webhook_notifier
from quant_core.settings import build_settings_status

class HandlerRuntimeMixin:
    def _settings_status_payload(
        self,
        *,
        cache_contexts: list[dict[str, object]] | None = None,
        free_stockdb_probe_succeeded: bool | None = None,
        auto_trading: dict[str, Any] | None = None,
    ) -> dict[str, object]:
        environment = self._effective_platform_settings_environment()
        configuration = self.platform_settings_store.configuration_payload(
            self._platform_settings_base_environment(),
            restart_required=type(self).settings_restart_required,
        )
        finnhub_api_key = environment.get("FINNHUB_API_KEY", "")
        if configuration["source"] == "environment" and not finnhub_api_key:
            finnhub_api_key = getattr(self.quote_adapter, "finnhub_api_key", "")
        status = build_settings_status(
            cache_path=self.cache.path,
            cache_contexts=self.cache.contexts(limit=8) if cache_contexts is None else cache_contexts,
            cache_stats=self.cache.stats(),
            finnhub_api_key=finnhub_api_key,
            sec_edgar_user_agent=environment.get("SEC_EDGAR_USER_AGENT", ""),
            ccxt_exchange=environment.get("CCXT_DEFAULT_EXCHANGE", ""),
            adapter_error_events=[
                market_data_adapter_error_event_to_payload(event)
                for event in self.adapter_error_store.list_recent(limit=50)
            ],
            free_stockdb_url=str(self._data_foundation_environment().get("AIQT_FREE_STOCKDB_URL") or ""),
            free_stockdb_probe_succeeded=free_stockdb_probe_succeeded,
        )
        if auto_trading is None:
            auto_trading = self._auto_paper_trading_service().snapshot()
        auto_state = auto_trading.get("state", {})
        status["safety"] = {
            **status["safety"],
            "liveTradingAllowed": auto_trading.get("liveTradingAllowed") is True,
            "executionMode": str(auto_state.get("executionMode") or "paper"),
            "liveConfirmed": auto_state.get("liveConfirmed") is True,
            "liveSessionTtlHours": auto_state.get("liveSessionTtlHours"),
            "liveAuthorizedUntil": auto_state.get("liveAuthorizedUntil"),
            "productionLive": auto_trading.get("productionLive"),
        }
        status["configuration"] = configuration
        return status

    def _platform_settings_base_environment(self) -> dict[str, str]:
        configured = self.platform_settings_environ
        return configured if isinstance(configured, dict) else os.environ

    def _effective_platform_settings_environment(self) -> dict[str, str]:
        return self.platform_settings_store.effective_environment(
            self._platform_settings_base_environment()
        )

    def _execution_adapter_environment(self) -> dict[str, str]:
        configured = type(self).execution_adapter_health_environ
        return (
            configured
            if isinstance(configured, dict)
            else self._effective_platform_settings_environment()
        )

    def _reload_platform_runtime(self) -> None:
        self.platform_settings_store.apply_to_environment(
            self._platform_settings_base_environment()
        )
        environment = self._effective_platform_settings_environment()
        updater = getattr(type(self).quote_adapter, "update_finnhub_api_key", None)
        if callable(updater):
            updater(environment.get("FINNHUB_API_KEY", ""))
        information_updater = getattr(
            type(self).market_information_service,
            "update_finnhub_api_key",
            None,
        )
        if callable(information_updater):
            information_updater(environment.get("FINNHUB_API_KEY", ""))
        kline_updater = getattr(type(self).kline_adapter, "update_ccxt_settings", None)
        if callable(kline_updater):
            kline_updater(
                environment.get("CCXT_DEFAULT_EXCHANGE", "binance"),
                _runtime_int(environment.get("CCXT_TIMEOUT"), 10_000, 1_000, 120_000),
            )
        monitoring_service = type(self).monitoring_service
        if monitoring_service is not None:
            notifier, channel = build_webhook_notifier(
                _handler_monitoring_environment(type(self))
            )
            monitoring_service.configure_notifier(notifier, channel)
        auto_service = type(self).auto_paper_trading_service
        if auto_service is not None:
            refreshed = _build_auto_paper_trading_service(type(self))
            auto_service.reload_runtime(
                refreshed.providers,
                refreshed.sandbox,
                refreshed.production,
                live_session_ttl_hours=refreshed.live_session_ttl_hours,
            )
        auto_runner = type(self).auto_paper_trading_runner
        if auto_runner is not None:
            auto_runner.update_interval(
                _runtime_int(
                    environment.get("AIQT_AUTO_TRADING_INTERVAL_SECONDS"),
                    35,
                    5,
                    3_600,
                )
            )
        type(self).settings_restart_required = False

    def _data_foundation_environment(self) -> dict[str, str]:
        configured = self.data_foundation_environ
        return configured if isinstance(configured, dict) else self._effective_platform_settings_environment()

    def _comparison_market_data_adapter(self, market: str, timeframe: str):
        if market != "ashare" or timeframe != "1d":
            return None
        try:
            return build_free_stockdb_adapter(self._data_foundation_environment())
        except ValueError:
            return None

    def _probe_free_stockdb(self) -> bool | None:
        try:
            adapter = build_free_stockdb_adapter(self._data_foundation_environment())
            if adapter is None:
                return None
            bars, quality = adapter.fetch_ohlcv(
                MarketDataRequest(market="ashare", symbol="600000", timeframe="1d"),
                limit=1,
            )
            return bool(bars) and quality.is_complete
        except (RuntimeError, ValueError):
            return False

    def _record_adapter_error_if_needed(
        self,
        request: MarketDataRequest,
        *,
        quality: DataQuality | None,
        context: str,
        error: str | None = None,
    ) -> None:
        target = _adapter_error_target(
            request.market,
            source=quality.source if quality else None,
        )
        if not target:
            return
        message = _adapter_error_message(quality=quality, error=error)
        if not message:
            return
        adapter_id, provider = target
        self.adapter_error_store.record(
            create_market_data_adapter_error_event(
                adapter_id=adapter_id,
                provider=provider,
                market=request.market,
                symbol=request.symbol,
                timeframe=request.timeframe,
                source=quality.source if quality else "unavailable",
                context=context,
                message=message,
            )
        )
