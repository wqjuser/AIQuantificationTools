from __future__ import annotations

from ..support.market_data import evaluate_auto_paper_trading_once
from quant_core.domain import MarketDataRequest

def post_operations_monitoring_test_notifications(self, parsed):
    try:
        if self._read_json_body():
            raise ValueError("monitoring_webhook_test_request_invalid")
        result = self._monitoring_service().test_notification()
    except ValueError as error:
        code = str(error) or "monitoring_webhook_test_request_invalid"
        status = 409 if code in {
            "monitoring_webhook_unconfigured",
            "monitoring_webhook_configuration_invalid",
        } else 400
        self._send_json({"error": code, "detail": code}, status=status)
        return
    except RuntimeError as error:
        self._send_json(
            {
                "error": "monitoring_webhook_test_failed",
                "detail": str(error),
            },
            status=502,
        )
        return
    self._send_json({"monitoringTestNotification": result}, status=201)
    return


def post_execution_auto_paper_trading(self, parsed):
    try:
        payload = self._read_json_body()
        result = self._auto_paper_trading_service().configure(payload)
    except ValueError as error:
        detail = str(error)
        conflict = detail.startswith("strategy_switch_requires_") or detail in {
            "strategy_binding_audit_evidence_changed",
            "strategy_binding_audit_run_changed",
        }
        self._send_json(
            {"error": "invalid_auto_paper_trading_control", "detail": detail},
            status=409 if conflict else 400,
        )
        return
    self._send_json(result)
    return


def post_execution_auto_paper_trading_reconciliations(self, parsed):
    service = self._auto_paper_trading_service()
    self._send_json(
        service.reconcile_pending_order() or service.snapshot()
    )
    return


def post_execution_auto_paper_trading_evaluations(self, parsed):
    service = self._auto_paper_trading_service()
    state = service.snapshot()["state"]
    request = MarketDataRequest(
        market=state["market"],
        symbol=state["symbol"],
        timeframe=state["timeframe"],
    )
    try:
        result, quality = evaluate_auto_paper_trading_once(
            service,
            cache=self.cache,
            adapter=self.kline_adapter,
        )
    except ValueError as error:
        self._record_adapter_error_if_needed(
            request,
            quality=None,
            context="auto-paper-trading",
            error=str(error),
        )
        self._send_json({"error": "auto_paper_trading_evaluation_blocked", "detail": str(error)}, status=409)
        return
    self._record_adapter_error_if_needed(request, quality=quality, context="auto-paper-trading")
    self._send_json(result)
    return


def get_execution_auto_paper_trading(self, parsed):
    self._send_json(self._auto_paper_trading_service().snapshot())
    return


def get_operations_monitoring(self, parsed):
    self._send_json(self._monitoring_service().snapshot())
    return
