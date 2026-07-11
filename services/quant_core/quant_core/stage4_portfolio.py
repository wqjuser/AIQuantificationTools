from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
import math
from typing import Any

from quant_core.portfolio_backtest import PortfolioBacktestRun, portfolio_backtest_run_to_payload


_SAFETY = {
    "paperOnly": True,
    "liveTradingAllowed": False,
    "orderSubmissionEnabled": False,
    "routeExecuted": False,
    "liveBlockedBoundary": True,
}
_KEYS = {
    "kind",
    "schemaVersion",
    "workflowId",
    "generatedAt",
    "baseRunId",
    "portfolioRequest",
    "portfolio",
    "riskTemplate",
    "batch",
    "approvals",
    "simulations",
    "stateHistory",
    "replay",
    *_SAFETY,
    "workflowHash",
}


def build_stage4_portfolio_workflow_snapshot(
    *,
    workflow_id: str,
    base_run_id: str,
    portfolio_request: dict[str, Any],
    portfolio: PortfolioBacktestRun | dict[str, Any],
    risk_template: dict[str, Any],
    batch: dict[str, Any],
    approvals: list[dict[str, Any]],
    simulations: list[dict[str, Any]],
    state_history: dict[str, Any],
    replay: dict[str, Any],
) -> dict[str, Any]:
    workflow_id = _nonempty_string(workflow_id, "workflowId")
    base_run_id = _nonempty_string(base_run_id, "baseRunId")
    snapshot = {
        "kind": "aiqt.stage4PortfolioWorkflow",
        "schemaVersion": 1,
        "workflowId": workflow_id,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "baseRunId": base_run_id,
        "portfolioRequest": _plain(portfolio_request),
        "portfolio": _plain(
            portfolio_backtest_run_to_payload(portfolio)
            if isinstance(portfolio, PortfolioBacktestRun)
            else portfolio
        ),
        "riskTemplate": _plain(risk_template),
        "batch": _plain(batch),
        "approvals": _plain(approvals),
        "simulations": _plain(simulations),
        "stateHistory": _plain(state_history),
        "replay": _plain(replay),
        **_SAFETY,
    }
    snapshot["workflowHash"] = stage4_portfolio_workflow_hash(snapshot)
    return validate_stage4_portfolio_workflow_snapshot(snapshot)


def validate_stage4_portfolio_workflow_snapshot(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != _KEYS:
        raise ValueError("stage4 portfolio workflow must contain exact fields")
    if (
        value.get("kind") != "aiqt.stage4PortfolioWorkflow"
        or isinstance(value.get("schemaVersion"), bool)
        or value.get("schemaVersion") != 1
    ):
        raise ValueError("stage4 portfolio workflow schema is invalid")
    for field in ("workflowId", "generatedAt", "baseRunId"):
        if not isinstance(value.get(field), str) or not value[field].strip():
            raise ValueError(f"stage4 portfolio workflow {field} is required")
    try:
        generated_at = datetime.fromisoformat(value["generatedAt"])
    except ValueError as error:
        raise ValueError("stage4 portfolio workflow generatedAt is invalid") from error
    if generated_at.tzinfo is None or generated_at.utcoffset() is None:
        raise ValueError("stage4 portfolio workflow generatedAt must include a timezone")
    for field, expected in _SAFETY.items():
        if value.get(field) is not expected:
            raise ValueError(f"stage4 portfolio workflow {field} is immutable")

    request = _object(value, "portfolioRequest")
    portfolio = _object(value, "portfolio")
    legs = request.get("legs")
    portfolio_legs = portfolio.get("legs")
    if not isinstance(legs, list) or len(legs) < 2 or not all(isinstance(leg, dict) for leg in legs):
        raise ValueError("stage4 portfolio workflow requires at least two legs")
    if not isinstance(portfolio_legs, list) or len(portfolio_legs) != len(legs):
        raise ValueError("stage4 portfolio workflow portfolio legs do not match request")
    market = _required_string(portfolio, "market")
    timeframe = _required_string(portfolio, "timeframe")
    weights = []
    for index, leg in enumerate(legs):
        if _required_string(leg, "market") != market or _required_string(leg, "timeframe") != timeframe:
            raise ValueError("stage4 portfolio workflow legs must share market and timeframe")
        _required_string(leg, "runId")
        symbol = _required_string(leg, "symbol")
        weight = _number(leg.get("targetWeight"), "portfolio leg targetWeight")
        if weight <= 0:
            raise ValueError("stage4 portfolio workflow leg weights must be positive")
        result_leg = portfolio_legs[index]
        if not isinstance(result_leg, dict) or result_leg.get("symbol") != symbol or result_leg.get("targetWeight") != weight:
            raise ValueError("stage4 portfolio workflow portfolio legs do not match request")
        weights.append(weight)
    total_weight = math.fsum(weights)
    if total_weight > 1:
        raise ValueError("stage4 portfolio workflow leg weights cannot exceed one")
    if abs(_number(portfolio.get("cashWeight"), "portfolio cashWeight") - (1 - total_weight)) > 1e-9:
        raise ValueError("stage4 portfolio workflow cash weight does not match legs")
    risk_template = _object(value, "riskTemplate")
    if _number(risk_template.get("minCashAfter"), "risk minCashAfter") < 0:
        raise ValueError("stage4 portfolio workflow minCashAfter must be non-negative")
    for field in ("maxSymbolNotional", "maxBatchNotional"):
        if _number(risk_template.get(field), f"risk {field}") <= 0:
            raise ValueError(f"stage4 portfolio workflow {field} must be positive")

    base_run_id = value["baseRunId"]
    if base_run_id not in [leg["runId"] for leg in legs]:
        raise ValueError("stage4 portfolio workflow base run must be a portfolio leg")
    batch = _object(value, "batch")
    _safety_declarations(batch, "batch")
    batch_id = _required_string(batch, "batchId")
    if batch.get("baseRunId") != base_run_id:
        raise ValueError("stage4 portfolio workflow batch base run does not match")
    orders = batch.get("orders")
    if not isinstance(orders, list) or not orders or not all(isinstance(order, dict) for order in orders):
        raise ValueError("stage4 portfolio workflow batch orders are required")
    order_ids = [_required_string(order, "orderId") for order in orders]
    if len(set(order_ids)) != len(order_ids):
        raise ValueError("stage4 portfolio workflow order ids must be unique")

    approvals = _bound_rows(value.get("approvals"), base_run_id, batch_id, "approval")
    simulations = _bound_rows(value.get("simulations"), base_run_id, batch_id, "simulation")
    if [row.get("orderId") for row in approvals] != order_ids or any(row.get("approved") is not True for row in approvals):
        raise ValueError("stage4 portfolio workflow approvals must match approved batch order sequence")
    if [row.get("orderId") for row in simulations] != order_ids:
        raise ValueError("stage4 portfolio workflow simulations must match batch order sequence")
    for simulation in simulations:
        if simulation.get("orderState") != "filled" or simulation.get("fillStatus") != "filled":
            raise ValueError("stage4 portfolio workflow simulations must be filled")
        _paper_only(simulation, "simulation")

    state_history = _bound_evidence(_object(value, "stateHistory"), base_run_id, batch_id, "state history")
    _safety_declarations(state_history, "state history")
    _paper_only(state_history, "state history")
    state_orders = state_history.get("orders")
    if not isinstance(state_orders, list) or not all(isinstance(row, dict) for row in state_orders) or [row.get("orderId") for row in state_orders] != order_ids:
        raise ValueError("stage4 portfolio workflow state history orders do not match")
    state_summary = _nested_object(state_history, "summary", "state history")
    _count(state_summary, "orderCount", len(order_ids), "state history")
    _count(state_summary, "filledOrders", len(simulations), "state history")
    _count(state_summary, "liveBlockedEvents", len(simulations), "state history")

    replay = _object(value, "replay")
    if replay.get("baseRunId") != base_run_id:
        raise ValueError("stage4 portfolio workflow replay base run does not match")
    _paper_only(replay, "replay")
    _safety_declarations(replay, "replay")
    replay_orders = replay.get("orders")
    if not isinstance(replay_orders, list) or not all(isinstance(row, dict) for row in replay_orders) or [row.get("orderId") for row in replay_orders] != order_ids:
        raise ValueError("stage4 portfolio workflow replay orders do not match")
    replay_summary = _nested_object(replay, "summary", "replay")
    replay_positions = replay.get("positions")
    account = _nested_object(replay, "account", "replay")
    if not isinstance(replay_positions, list) or not isinstance(account.get("positions"), dict):
        raise ValueError("stage4 portfolio workflow replay positions are invalid")
    _count(replay_summary, "filledOrders", len(simulations), "replay")
    _count(replay_summary, "positionCount", len(replay_positions), "replay")
    if not isinstance(replay_summary.get("warnings"), list):
        raise ValueError("stage4 portfolio workflow replay warnings are invalid")
    for field in ("cash", "equity"):
        _number(account.get(field), f"replay account {field}")

    workflow_hash = value.get("workflowHash")
    if not isinstance(workflow_hash, str) or len(workflow_hash) != 64 or workflow_hash != stage4_portfolio_workflow_hash(value):
        raise ValueError("stage4 portfolio workflow hash does not match")
    return value


def stage4_portfolio_workflow_hash(value: Any) -> str:
    if not isinstance(value, dict):
        raise ValueError("stage4 portfolio workflow must be an object")
    payload = {key: item for key, item in value.items() if key != "workflowHash"}
    canonical = _canonical_json(payload)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _plain(value: Any) -> Any:
    return json.loads(_canonical_json(value))


def _canonical_json(value: Any) -> str:
    try:
        return json.dumps(value, allow_nan=False, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    except (TypeError, ValueError) as error:
        raise ValueError("stage4 portfolio workflow must contain canonical JSON values") from error


def _object(value: dict[str, Any], field: str) -> dict[str, Any]:
    item = value.get(field)
    if not isinstance(item, dict):
        raise ValueError(f"stage4 portfolio workflow {field} must be an object")
    return item


def _nested_object(value: dict[str, Any], field: str, label: str) -> dict[str, Any]:
    item = value.get(field)
    if not isinstance(item, dict):
        raise ValueError(f"stage4 portfolio workflow {label} {field} must be an object")
    return item


def _required_string(value: dict[str, Any], field: str) -> str:
    return _nonempty_string(value.get(field), field)


def _nonempty_string(value: Any, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"stage4 portfolio workflow {label} is required")
    return value.strip()


def _number(value: Any, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"stage4 portfolio workflow {label} must be numeric")
    number = float(value)
    if number != number or number in (float("inf"), float("-inf")):
        raise ValueError(f"stage4 portfolio workflow {label} must be finite")
    return number


def _count(value: dict[str, Any], field: str, expected: int, label: str) -> None:
    if type(value.get(field)) is not int or value[field] != expected:
        raise ValueError(f"stage4 portfolio workflow {label} {field} does not match")


def _bound_rows(value: Any, base_run_id: str, batch_id: str, label: str) -> list[dict[str, Any]]:
    if not isinstance(value, list) or not value or not all(isinstance(row, dict) for row in value):
        raise ValueError(f"stage4 portfolio workflow {label}s are required")
    if any(row.get("baseRunId") != base_run_id or row.get("batchId") != batch_id for row in value):
        raise ValueError(f"stage4 portfolio workflow {label} binding does not match")
    for row in value:
        _safety_declarations(row, label)
    return value


def _bound_evidence(value: dict[str, Any], base_run_id: str, batch_id: str, label: str) -> dict[str, Any]:
    if value.get("baseRunId") != base_run_id or value.get("batchId") != batch_id:
        raise ValueError(f"stage4 portfolio workflow {label} binding does not match")
    return value


def _paper_only(value: dict[str, Any], label: str) -> None:
    if value.get("paperOnly") is not True or value.get("liveExecutionBlocked") is not True:
        raise ValueError(f"stage4 portfolio workflow {label} must remain paper-only")


def _safety_declarations(value: dict[str, Any], label: str) -> None:
    if any(field in value and value[field] is not expected for field, expected in _SAFETY.items()):
        raise ValueError(f"stage4 portfolio workflow {label} safety declaration conflicts")
