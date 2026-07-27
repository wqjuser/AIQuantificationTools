from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime, timedelta
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


def build_decision_proposal(
    *,
    snapshot_hash: str,
    strategy_revision: str,
    proposal_action: DecisionAction,
    proposal_confidence: float,
    proposal_reason: str,
    provider_id: str,
    proposed_at: datetime,
    proposal_metadata: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    if not math.isfinite(proposal_confidence) or not 0 <= proposal_confidence <= 1:
        raise ValueError("decision_proposal_confidence_invalid")
    metadata = proposal_metadata or {}
    payload = {
        "snapshotHash": snapshot_hash,
        "strategyRevision": strategy_revision,
        "source": provider_id if provider_id in {"rules", "risk"} else "ai",
        "providerId": provider_id,
        "model": metadata.get("model"),
        "promptTemplateVersion": metadata.get("promptTemplateVersion"),
        "outputSchemaVersion": metadata.get("outputSchemaVersion"),
        "usage": metadata.get("usage"),
        "latencyMs": int(metadata.get("latencyMs") or 0),
        "evidenceReferences": [snapshot_hash],
        "action": proposal_action,
        "confidence": round(proposal_confidence, 4),
        "reason": proposal_reason,
    }
    return {
        "proposalId": canonical_sha256(payload),
        **payload,
        "proposedAt": proposed_at.isoformat(),
    }


def build_standard_signal(
    decision_proposal: Mapping[str, Any],
    *,
    strategy_id: str,
    timeframe: str,
    evaluated_bar_at: str,
    generated_at: datetime,
    current_quantity: float,
) -> dict[str, Any]:
    if not isinstance(strategy_id, str) or not strategy_id.strip():
        raise ValueError("signal_strategy_id_required")
    signal_lifetime = {
        "1m": timedelta(minutes=1),
        "5m": timedelta(minutes=5),
        "15m": timedelta(minutes=15),
        "30m": timedelta(minutes=30),
        "60m": timedelta(minutes=60),
        "1d": timedelta(days=1),
        "1w": timedelta(weeks=1),
    }.get(timeframe)
    if signal_lifetime is None:
        raise ValueError("signal_timeframe_unsupported")
    action = decision_proposal.get("action")
    confidence = decision_proposal.get("confidence")
    reason = decision_proposal.get("reason")
    if (
        action not in {"buy", "sell", "hold"}
        or type(confidence) not in {int, float}
        or not math.isfinite(confidence)
        or not isinstance(reason, str)
        or not reason
    ):
        raise ValueError("decision_proposal_invalid")
    signal_action, signal_reason = standardize_signal_action(
        proposal_action=action,
        proposal_reason=reason,
        current_quantity=current_quantity,
    )
    payload = {
        "proposalId": str(decision_proposal.get("proposalId") or ""),
        "snapshotHash": str(decision_proposal.get("snapshotHash") or ""),
        "strategyId": strategy_id,
        "strategyRevision": str(decision_proposal.get("strategyRevision") or ""),
        "horizon": timeframe,
        "evaluatedBarAt": evaluated_bar_at,
        "expiresAt": (generated_at + signal_lifetime).isoformat(),
        "action": signal_action,
        "confidence": round(float(confidence), 4),
        "reason": signal_reason,
    }
    if not payload["proposalId"] or not payload["snapshotHash"] or not payload["strategyRevision"]:
        raise ValueError("decision_proposal_identity_missing")
    return {
        "signalId": canonical_sha256(payload),
        **payload,
        "generatedAt": generated_at.isoformat(),
    }


def build_decision_contract(
    *,
    bars: list[OHLCVBar],
    market: str,
    symbol: str,
    timeframe: str,
    data_source: str,
    strategy_id: str,
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
    account_check: Mapping[str, Any] | None = None,
    proposal_metadata: Mapping[str, Any] | None = None,
    execution_preparation: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    normalized_bars = normalize_snapshot_bars(bars)
    data_hash = canonical_data_hash(normalized_bars)
    snapshot_hash = canonical_snapshot_id(
        market=market,
        symbol=symbol,
        timeframe=timeframe,
        canonical_data_hash=data_hash,
    )
    generated_at_text = generated_at.isoformat()
    account_check_data = account_check or {}
    unexpected_open_order_count = int(
        account_check_data.get("unexpectedOpenAutoOrderCount") or 0
    )
    if unexpected_open_order_count < 0:
        raise ValueError("account_check_open_order_count_invalid")
    account_check_payload = {
        "source": "venue_account" if account_check is not None else "strategy_ledger",
        "accountCovered": (
            account_check_data.get("accountCovered") is True
            if account_check is not None
            else True
        ),
        "positionCovered": (
            account_check_data.get("positionCovered") is True
            if account_check is not None
            else True
        ),
        "quoteCovered": (
            account_check_data.get("quoteCovered") is True
            if account_check is not None
            else True
        ),
        "unexpectedOpenAutoOrderCount": unexpected_open_order_count,
        "checkedAt": str(account_check_data.get("checkedAt") or generated_at_text),
    }
    normalized_account_check = {
        "accountCheckId": canonical_sha256(account_check_payload),
        **account_check_payload,
    }
    proposal = build_decision_proposal(
        snapshot_hash=snapshot_hash,
        strategy_revision=strategy_revision,
        proposal_action=proposal_action,
        proposal_confidence=proposal_confidence,
        proposal_reason=proposal_reason,
        provider_id=provider_id,
        proposed_at=generated_at,
        proposal_metadata=proposal_metadata,
    )
    proposal_id = proposal["proposalId"]
    signal = build_standard_signal(
        proposal,
        strategy_id=strategy_id,
        timeframe=timeframe,
        evaluated_bar_at=normalized_bars[-1]["timestamp"],
        generated_at=generated_at,
        current_quantity=current_quantity,
    )
    signal_action = signal["action"]
    signal_id = signal["signalId"]
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
        account_check=normalized_account_check,
        fee_rate=fee_rate,
        execution_preparation=execution_preparation,
    )
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
        "accountCheck": normalized_account_check,
        "decisionProposal": proposal,
        "signal": signal,
        "portfolioTarget": portfolio_target,
        "riskAdjustedTarget": risk_adjusted_target,
        "orderIntent": order_intent,
    }


def replay_decision_proposal(
    recorded_proposal: Mapping[str, Any],
    *,
    bars: list[OHLCVBar],
    market: str,
    symbol: str,
    timeframe: str,
    data_source: str,
    strategy_id: str,
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
    account_check: Mapping[str, Any] | None = None,
    execution_preparation: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    proposal_payload = {
        key: recorded_proposal.get(key)
        for key in (
            "snapshotHash",
            "strategyRevision",
            "source",
            "providerId",
            "model",
            "promptTemplateVersion",
            "outputSchemaVersion",
            "usage",
            "latencyMs",
            "evidenceReferences",
            "action",
            "confidence",
            "reason",
        )
    }
    proposal_id = str(recorded_proposal.get("proposalId") or "")
    if not proposal_id or canonical_sha256(proposal_payload) != proposal_id:
        raise ValueError("recorded_proposal_identity_mismatch")
    action = proposal_payload["action"]
    confidence = proposal_payload["confidence"]
    reason = proposal_payload["reason"]
    provider_id = proposal_payload["providerId"]
    strategy_revision = proposal_payload["strategyRevision"]
    proposed_at = recorded_proposal.get("proposedAt")
    if (
        action not in {"buy", "sell", "hold"}
        or type(confidence) not in {int, float}
        or not math.isfinite(confidence)
        or not isinstance(reason, str)
        or not reason.strip()
        or not isinstance(provider_id, str)
        or not provider_id
        or not isinstance(strategy_revision, str)
        or not strategy_revision
        or not isinstance(proposed_at, str)
    ):
        raise ValueError("recorded_proposal_invalid")
    try:
        datetime.fromisoformat(proposed_at)
    except ValueError as error:
        raise ValueError("recorded_proposal_invalid") from error

    contract = build_decision_contract(
        bars=bars,
        market=market,
        symbol=symbol,
        timeframe=timeframe,
        data_source=data_source,
        strategy_id=strategy_id,
        strategy_revision=strategy_revision,
        proposal_action=action,
        proposal_confidence=float(confidence),
        proposal_reason=reason,
        provider_id=provider_id,
        current_quantity=current_quantity,
        reference_price=reference_price,
        available_cash=available_cash,
        order_notional=order_notional,
        fee_rate=fee_rate,
        daily_drawdown_pct=daily_drawdown_pct,
        daily_loss_limit_pct=daily_loss_limit_pct,
        recent_trade_count=recent_trade_count,
        max_trades_per_hour=max_trades_per_hour,
        generated_at=generated_at,
        account_check=account_check,
        proposal_metadata={
            "model": proposal_payload["model"],
            "promptTemplateVersion": proposal_payload["promptTemplateVersion"],
            "outputSchemaVersion": proposal_payload["outputSchemaVersion"],
            "usage": proposal_payload["usage"],
            "latencyMs": proposal_payload["latencyMs"],
        },
        execution_preparation=execution_preparation,
    )
    if contract["decisionProposal"]["proposalId"] != proposal_id:
        raise ValueError("recorded_proposal_context_mismatch")
    contract["decisionProposal"]["proposedAt"] = proposed_at
    return contract


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
    account_check: Mapping[str, Any],
    fee_rate: float,
    execution_preparation: Mapping[str, Any] | None = None,
) -> dict[str, Any] | None:
    delta = float(risk_adjusted_target["approvedDeltaQuantity"])
    if not math.isfinite(delta):
        raise ValueError("order_intent_quantity_must_be_finite")
    if abs(delta) <= 1e-12:
        return None
    if account_check.get("accountCovered") is not True:
        raise ValueError("order_intent_account_not_covered")
    reference_price = float(portfolio_target["referencePrice"])
    if not math.isfinite(reference_price) or reference_price <= 0:
        raise ValueError("order_intent_reference_price_invalid")
    quantity = round(abs(delta), 12)
    side = "buy" if delta > 0 else "sell"
    notional = round(quantity * reference_price, 8)
    if not math.isfinite(fee_rate) or fee_rate < 0:
        raise ValueError("order_intent_fee_rate_invalid")
    market_rules = {
        "source": "strategy_ledger",
        "quantityPrecision": None,
        "pricePrecision": None,
        "minimumQuantity": None,
        "minimumNotional": None,
    }
    execution_assumptions = {
        "feeRate": round(fee_rate, 8),
        "feeEstimated": True,
        "slippageBps": 0.0,
        "slippageModel": "none",
    }
    if execution_preparation is not None:
        if (
            execution_preparation.get("symbol") != portfolio_target["symbol"]
            or execution_preparation.get("side") != side
        ):
            raise ValueError("order_intent_preparation_identity_mismatch")
        prepared_quantity = _positive_finite_number(
            execution_preparation.get("quantity"),
            "order_intent_prepared_quantity_invalid",
        )
        prepared_price = _positive_finite_number(
            execution_preparation.get("referencePrice"),
            "order_intent_prepared_price_invalid",
        )
        prepared_notional = _positive_finite_number(
            execution_preparation.get("notionalValue"),
            "order_intent_prepared_notional_invalid",
        )
        if (
            prepared_quantity > quantity + 1e-12
            or prepared_notional > notional + 1e-8
            or not math.isclose(
                prepared_notional,
                prepared_quantity * prepared_price,
                rel_tol=0,
                abs_tol=1e-8,
            )
        ):
            raise ValueError("order_intent_preparation_amplifies_target")
        market_rules = _normalize_market_rules(
            execution_preparation.get("marketRules")
        )
        execution_assumptions = _normalize_execution_assumptions(
            execution_preparation.get("executionAssumptions"),
            fallback_fee_rate=fee_rate,
        )
        quantity = round(prepared_quantity, 12)
        reference_price = round(prepared_price, 8)
        notional = round(prepared_notional, 8)
    payload = {
        "marketSnapshotHash": market_snapshot_hash,
        "strategyRevision": strategy_revision,
        "proposalId": proposal_id,
        "signalId": signal_id,
        "portfolioTargetId": portfolio_target["portfolioTargetId"],
        "riskAdjustedTargetId": risk_adjusted_target["riskAdjustedTargetId"],
        "accountCheckId": str(account_check["accountCheckId"]),
        "symbol": portfolio_target["symbol"],
        "side": side,
        "type": "market",
        "quantity": quantity,
        "referencePrice": round(reference_price, 8),
        "notionalValue": notional,
        "marketRules": market_rules,
        "executionAssumptions": execution_assumptions,
    }
    return {"orderIntentId": canonical_sha256(payload), **payload}


def _normalize_market_rules(value: Any) -> dict[str, Any]:
    expected = {
        "source",
        "quantityPrecision",
        "pricePrecision",
        "minimumQuantity",
        "minimumNotional",
    }
    if not isinstance(value, Mapping) or set(value) != expected:
        raise ValueError("order_intent_market_rules_invalid")
    source = str(value.get("source") or "").strip()
    if not source:
        raise ValueError("order_intent_market_rules_invalid")
    return {
        "source": source,
        **{
            key: _optional_nonnegative_finite_number(
                value.get(key),
                "order_intent_market_rules_invalid",
            )
            for key in expected - {"source"}
        },
    }


def _normalize_execution_assumptions(
    value: Any,
    *,
    fallback_fee_rate: float,
) -> dict[str, Any]:
    expected = {"feeRate", "feeEstimated", "slippageBps", "slippageModel"}
    if not isinstance(value, Mapping) or set(value) != expected:
        raise ValueError("order_intent_execution_assumptions_invalid")
    fee_rate = _optional_nonnegative_finite_number(
        value.get("feeRate"),
        "order_intent_execution_assumptions_invalid",
    )
    slippage_bps = _optional_nonnegative_finite_number(
        value.get("slippageBps"),
        "order_intent_execution_assumptions_invalid",
    )
    slippage_model = str(value.get("slippageModel") or "").strip()
    if value.get("feeEstimated") is not True or not slippage_model:
        raise ValueError("order_intent_execution_assumptions_invalid")
    return {
        "feeRate": round(fallback_fee_rate if fee_rate is None else fee_rate, 8),
        "feeEstimated": True,
        "slippageBps": None if slippage_bps is None else round(slippage_bps, 4),
        "slippageModel": slippage_model,
    }


def _positive_finite_number(value: Any, error: str) -> float:
    number = _optional_nonnegative_finite_number(value, error)
    if number is None or number <= 0:
        raise ValueError(error)
    return number


def _optional_nonnegative_finite_number(value: Any, error: str) -> float | None:
    if value is None:
        return None
    if (
        type(value) not in {int, float}
        or not math.isfinite(float(value))
        or float(value) < 0
    ):
        raise ValueError(error)
    return float(value)


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
    raw_fees = evidence.get("fees")
    if raw_fees is not None and not isinstance(raw_fees, list):
        raise ValueError("order_result_fees_invalid")
    fees = []
    for item in raw_fees or []:
        if not isinstance(item, Mapping):
            raise ValueError("order_result_fees_invalid")
        currency = str(item.get("currency") or "").strip()
        cost = item.get("cost")
        if (
            not currency
            or type(cost) not in {int, float}
            or not math.isfinite(cost)
            or cost < 0
        ):
            raise ValueError("order_result_fees_invalid")
        fees.append({"currency": currency, "cost": round(float(cost), 12)})
    fee_estimated = evidence.get("feeEstimated") is True
    if fee_estimated and not fees:
        raise ValueError("order_result_estimated_fee_missing")
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
        "fees": fees,
        "feeEstimated": fee_estimated,
        "error": str(evidence.get("error") or ""),
    }
    return {"orderResultId": canonical_sha256(payload), **payload}
