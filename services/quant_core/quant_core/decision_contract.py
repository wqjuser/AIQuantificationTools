from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime
import math
from typing import Any, Literal

from quant_core.canonical import (
    canonical_data_hash,
    canonical_sha256,
    canonical_snapshot_id,
    normalize_snapshot_bars,
)
from quant_core.domain import OHLCVBar


DecisionAction = Literal["buy", "sell", "hold"]
RiskAdjustmentDecision = Literal["preserve", "reduce", "zero", "reject"]


def standardize_signal_action(
    *,
    proposal_action: DecisionAction,
    proposal_reason: str,
    current_quantity: float,
) -> tuple[DecisionAction, str]:
    if not math.isfinite(current_quantity) or current_quantity < 0:
        raise ValueError("standard_signal_current_quantity_invalid")
    if proposal_action == "buy" and current_quantity > 0:
        return "hold", "已有持仓，本轮不重复加仓。"
    if proposal_action == "sell" and current_quantity <= 0:
        return "hold", "当前没有可卖出的持仓。"
    return proposal_action, proposal_reason


def build_decision_contract(
    *,
    bars: list[OHLCVBar],
    market: str,
    symbol: str,
    timeframe: str,
    data_source: str,
    strategy_revision: str,
    proposal_action: DecisionAction,
    proposal_confidence: float,
    proposal_reason: str,
    provider_id: str,
    current_quantity: float,
    reference_price: float,
    available_cash: float,
    order_notional: float,
    fee_rate: float,
    daily_drawdown_pct: float,
    daily_loss_limit_pct: float,
    recent_trade_count: int,
    max_trades_per_hour: int,
    generated_at: datetime,
) -> dict[str, Any]:
    normalized_bars = normalize_snapshot_bars(bars)
    data_hash = canonical_data_hash(normalized_bars)
    snapshot_hash = canonical_snapshot_id(
        market=market,
        symbol=symbol,
        timeframe=timeframe,
        canonical_data_hash=data_hash,
    )
    proposal = {
        "snapshotHash": snapshot_hash,
        "strategyRevision": strategy_revision,
        "source": provider_id if provider_id in {"rules", "risk"} else "ai",
        "providerId": provider_id,
        "action": proposal_action,
        "confidence": round(proposal_confidence, 4),
        "reason": proposal_reason,
    }
    proposal_id = canonical_sha256(proposal)
    signal_action, signal_reason = standardize_signal_action(
        proposal_action=proposal_action,
        proposal_reason=proposal_reason,
        current_quantity=current_quantity,
    )
    signal = {
        "proposalId": proposal_id,
        "snapshotHash": snapshot_hash,
        "strategyRevision": strategy_revision,
        "action": signal_action,
        "confidence": round(proposal_confidence, 4),
        "reason": signal_reason,
    }
    signal_id = canonical_sha256(signal)
    portfolio_target = build_portfolio_target(
        signal_id=signal_id,
        action=signal_action,
        symbol=symbol,
        current_quantity=current_quantity,
        reference_price=reference_price,
        available_cash=available_cash,
        order_notional=order_notional,
        fee_rate=fee_rate,
    )
    risk_adjusted_target = build_risk_adjusted_target(
        portfolio_target,
        decision="preserve",
        reason="当前风险边界允许保持组合目标。",
        evidence={
            "dailyDrawdownPct": round(daily_drawdown_pct, 4),
            "dailyLossLimitPct": daily_loss_limit_pct,
            "recentTradeCount": recent_trade_count,
            "maxTradesPerHour": max_trades_per_hour,
        },
    )
    order_intent = build_order_intent(
        market_snapshot_hash=snapshot_hash,
        strategy_revision=strategy_revision,
        proposal_id=proposal_id,
        signal_id=signal_id,
        portfolio_target=portfolio_target,
        risk_adjusted_target=risk_adjusted_target,
    )
    generated_at_text = generated_at.isoformat()
    return {
        "contractVersion": "aiqt-decision-v1",
        "strategyRevision": strategy_revision,
        "marketSnapshot": {
            "snapshotHash": snapshot_hash,
            "dataHash": data_hash,
            "market": market,
            "symbol": symbol,
            "timeframe": timeframe,
            "dataSource": data_source,
            "barCount": len(normalized_bars),
            "latestBarAt": normalized_bars[-1]["timestamp"],
        },
        "decisionProposal": {
            "proposalId": proposal_id,
            **proposal,
            "proposedAt": generated_at_text,
        },
        "signal": {
            "signalId": signal_id,
            **signal,
            "generatedAt": generated_at_text,
        },
        "portfolioTarget": portfolio_target,
        "riskAdjustedTarget": risk_adjusted_target,
        "orderIntent": order_intent,
    }


def build_portfolio_target(
    *,
    signal_id: str,
    action: DecisionAction,
    symbol: str,
    current_quantity: float,
    reference_price: float,
    available_cash: float,
    order_notional: float,
    fee_rate: float,
) -> dict[str, Any]:
    values = (current_quantity, reference_price, available_cash, order_notional, fee_rate)
    if any(not math.isfinite(value) for value in values):
        raise ValueError("portfolio_target_number_must_be_finite")
    if current_quantity < 0 or reference_price <= 0 or available_cash < 0 or order_notional < 0 or fee_rate < 0:
        raise ValueError("portfolio_target_number_invalid")
    if action == "buy":
        budget = min(order_notional, available_cash)
        target_quantity = current_quantity + budget / (1 + fee_rate) / reference_price
    elif action == "sell":
        target_quantity = 0.0
    else:
        target_quantity = current_quantity
    target_quantity = round(target_quantity, 12)
    payload = {
        "signalId": signal_id,
        "symbol": symbol,
        "currentQuantity": round(current_quantity, 12),
        "targetQuantity": target_quantity,
        "deltaQuantity": round(target_quantity - current_quantity, 12),
        "referencePrice": round(reference_price, 8),
        "targetNotional": round(target_quantity * reference_price, 8),
    }
    return {"portfolioTargetId": canonical_sha256(payload), **payload}


def build_risk_adjusted_target(
    portfolio_target: dict[str, Any],
    *,
    decision: RiskAdjustmentDecision,
    reason: str,
    approved_target_quantity: float | None = None,
    evidence: dict[str, int | float] | None = None,
) -> dict[str, Any]:
    current = float(portfolio_target["currentQuantity"])
    requested = float(portfolio_target["targetQuantity"])
    approved = (
        requested
        if approved_target_quantity is None and decision == "preserve"
        else current
        if approved_target_quantity is None and decision == "reject"
        else 0.0
        if approved_target_quantity is None and decision == "zero"
        else approved_target_quantity
    )
    if approved is None or not math.isfinite(approved) or approved < 0:
        raise ValueError("risk_adjusted_target_number_invalid")
    if approved > max(current, requested) + 1e-12:
        raise ValueError("risk_adjustment_amplifies_target")
    if decision == "preserve" and approved != requested:
        raise ValueError("risk_adjustment_preserve_mismatch")
    if decision == "reduce" and not 0 <= approved < requested:
        raise ValueError("risk_adjustment_reduce_mismatch")
    if decision == "zero" and approved != 0:
        raise ValueError("risk_adjustment_zero_mismatch")
    if decision == "reject" and approved != current:
        raise ValueError("risk_adjustment_reject_mismatch")
    reference_price = float(portfolio_target["referencePrice"])
    payload = {
        "portfolioTargetId": portfolio_target["portfolioTargetId"],
        "decision": decision,
        "requestedTargetQuantity": round(requested, 12),
        "approvedTargetQuantity": round(approved, 12),
        "approvedDeltaQuantity": round(approved - current, 12),
        "approvedNotional": round(approved * reference_price, 8),
        "reason": reason,
        "evidence": dict(evidence or {}),
    }
    return {"riskAdjustedTargetId": canonical_sha256(payload), **payload}


def build_order_intent(
    *,
    market_snapshot_hash: str,
    strategy_revision: str,
    proposal_id: str,
    signal_id: str,
    portfolio_target: dict[str, Any],
    risk_adjusted_target: dict[str, Any],
) -> dict[str, Any] | None:
    delta = float(risk_adjusted_target["approvedDeltaQuantity"])
    if not math.isfinite(delta):
        raise ValueError("order_intent_quantity_must_be_finite")
    if abs(delta) <= 1e-12:
        return None
    reference_price = float(portfolio_target["referencePrice"])
    if not math.isfinite(reference_price) or reference_price <= 0:
        raise ValueError("order_intent_reference_price_invalid")
    quantity = round(abs(delta), 12)
    payload = {
        "marketSnapshotHash": market_snapshot_hash,
        "strategyRevision": strategy_revision,
        "proposalId": proposal_id,
        "signalId": signal_id,
        "portfolioTargetId": portfolio_target["portfolioTargetId"],
        "riskAdjustedTargetId": risk_adjusted_target["riskAdjustedTargetId"],
        "symbol": portfolio_target["symbol"],
        "side": "buy" if delta > 0 else "sell",
        "type": "market",
        "quantity": quantity,
        "referencePrice": round(reference_price, 8),
        "notionalValue": round(quantity * reference_price, 8),
    }
    return {"orderIntentId": canonical_sha256(payload), **payload}


def build_order_result(
    order_intent: Mapping[str, Any],
    *,
    execution_mode: str,
    evidence: Mapping[str, Any],
) -> dict[str, Any]:
    if execution_mode not in {"paper", "testnet", "live"}:
        raise ValueError("order_result_execution_mode_invalid")
    state = str(evidence.get("state") or "")
    allowed_states = {
        "submission_pending",
        "open",
        "partially_filled",
        "filled",
        "canceled",
        "expired",
        "rejected",
        "reconciliation_required",
    }
    if state not in allowed_states:
        raise ValueError("order_result_state_invalid")
    intent_quantity = float(order_intent["quantity"])
    filled_quantity = float(evidence.get("filledQuantity") or 0)
    average_price = float(evidence.get("averagePrice") or 0)
    filled_notional = float(
        evidence.get("filledNotional")
        or filled_quantity * average_price
    )
    remaining_quantity = float(
        evidence.get("remainingQuantity")
        if evidence.get("remainingQuantity") is not None
        else max(0.0, intent_quantity - filled_quantity)
    )
    values = (
        intent_quantity,
        filled_quantity,
        average_price,
        filled_notional,
        remaining_quantity,
    )
    if any(not math.isfinite(value) or value < 0 for value in values):
        raise ValueError("order_result_number_invalid")
    if filled_quantity > intent_quantity + 1e-12:
        raise ValueError("order_result_exceeds_intent")
    if filled_quantity > 0 and average_price <= 0:
        raise ValueError("order_result_average_price_invalid")
    request = evidence.get("request")
    request = request if isinstance(request, Mapping) else {}
    payload = {
        "orderIntentId": str(order_intent["orderIntentId"]),
        "executionMode": execution_mode,
        "state": state,
        "clientOrderId": str(
            evidence.get("clientOrderId")
            or request.get("clientOrderId")
            or ""
        ),
        "externalOrderId": str(evidence.get("exchangeOrderId") or ""),
        "filledQuantity": round(filled_quantity, 12),
        "remainingQuantity": round(remaining_quantity, 12),
        "averagePrice": round(average_price, 8),
        "filledNotional": round(filled_notional, 8),
        "error": str(evidence.get("error") or ""),
    }
    return {"orderResultId": canonical_sha256(payload), **payload}
