from __future__ import annotations


def post_forward_trial_binding(self, parsed) -> None:
    try:
        payload = self._read_json_body()
        result = self._auto_paper_trading_service().bind_forward_trial(payload)
    except ValueError as error:
        detail = str(error) or "forward_trial_binding_request_invalid"
        request_errors = {
            "forward_trial_binding_request_invalid",
            "forward_trial_strategy_revision_required",
            "forward_trial_source_run_required",
            "forward_trial_operator_required",
            "forward_trial_confirmation_required",
        }
        self._send_json(
            {"error": "invalid_forward_trial_binding", "detail": detail},
            status=(
                400
                if detail in request_errors or detail.startswith("request_body_")
                else 409
            ),
        )
        return
    self._send_json(result, status=201)
