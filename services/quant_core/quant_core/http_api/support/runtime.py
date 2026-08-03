from __future__ import annotations

import os
from quant_core.ai_review_providers import AiReviewProviderRegistry
from quant_core.auto_paper_trading import AutoPaperTradingService
from quant_core.monitoring import (
    MonitoringService,
    build_webhook_notifier,
)
from quant_core.stage10_production_execution import (
    BinanceSpotProductionTradingRoute,
    Stage10ProductionExecutionService,
)
from quant_core.stage6_sandbox import (
    BinanceSpotTestnetRoute,
    Stage6SandboxExecutionService,
)

def _handler_platform_environment(
    handler_type: type,
) -> dict[str, str]:
    base = (
        handler_type.platform_settings_environ
        if isinstance(handler_type.platform_settings_environ, dict)
        else os.environ
    )
    return handler_type.platform_settings_store.effective_environment(base)


def _handler_execution_environment(
    handler_type: type,
) -> dict[str, str]:
    configured = handler_type.execution_adapter_health_environ
    return (
        configured
        if isinstance(configured, dict)
        else _handler_platform_environment(handler_type)
    )


def _handler_monitoring_environment(
    handler_type: type,
) -> dict[str, str]:
    configured = handler_type.monitoring_environ
    return (
        configured
        if isinstance(configured, dict)
        else _handler_platform_environment(handler_type)
    )


def _runtime_int(
    value: object,
    default: int,
    minimum: int,
    maximum: int,
) -> int:
    try:
        parsed = int(str(value))
    except (TypeError, ValueError):
        return default
    return parsed if minimum <= parsed <= maximum else default


def _build_auto_paper_trading_service(
    handler_type: type,
) -> AutoPaperTradingService:
    platform_environment = _handler_platform_environment(handler_type)
    execution_environment = _handler_execution_environment(handler_type)
    factory = handler_type.stage6_sandbox_route_factory
    sandbox_route = (
        factory()
        if callable(factory)
        else BinanceSpotTestnetRoute(env=execution_environment)
    )
    sandbox = Stage6SandboxExecutionService(
        handler_type.audit_event_store,
        sandbox_route,
    )
    production_route = BinanceSpotProductionTradingRoute(
        env=execution_environment,
        exchange_factory=handler_type.execution_adapter_health_exchange_factory,
    )
    production = Stage10ProductionExecutionService(
        handler_type.audit_event_store,
        auto_route=production_route,
        acquire_account_lease=handler_type.stage10_account_lease_acquire,
        release_account_lease=handler_type.stage10_account_lease_release,
    )
    providers = (
        handler_type.ai_review_provider_registry
        or AiReviewProviderRegistry.from_environment(platform_environment)
    )
    return AutoPaperTradingService(
        handler_type.audit_event_store,
        providers,
        sandbox,
        production,
        live_session_ttl_hours=_runtime_int(
            platform_environment.get("AIQT_LIVE_SESSION_TTL_HOURS"),
            8,
            0,
            8_760,
        ),
        strategy_store=handler_type.strategy_store,
        run_store=handler_type.run_store,
    )


def _build_monitoring_service(
    handler_type: type,
) -> MonitoringService:
    notifier, channel = build_webhook_notifier(
        _handler_monitoring_environment(handler_type)
    )
    return MonitoringService(
        handler_type.audit_event_store,
        notifier=notifier,
        channel=channel,
    )
