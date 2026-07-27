from __future__ import annotations

from collections.abc import Callable, Mapping
from datetime import datetime, timedelta, timezone
import hashlib
from threading import Event, Lock, Thread
from typing import Any
from uuid import uuid4

from quant_core.ai_review_providers import AiReviewProviderRegistry
from quant_core.audit_events import AuditEventStore, audit_event_record_to_payload
from quant_core.canonical import canonical_sha256
from quant_core.decision_contract import (
    build_decision_contract,
    build_order_result,
    build_risk_adjusted_target,
)
from quant_core.domain import OHLCVBar
from quant_core.stage6_sandbox import Stage6SandboxExecutionService
from quant_core.stage10_production_execution import Stage10ProductionExecutionService


CONTROL_EVENT_ID = "auto-paper-trading-current-state"
FEE_RATE = 0.001
LIVE_SESSION_TTL = timedelta(hours=8)
_UNRESOLVED_ORDER_STATES = {
    "submission_pending",
    "open",
    "partially_filled",
    "reconciliation_required",
}
_LOCK = Lock()
_OUTPUT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "action": {"type": "string", "enum": ["buy", "sell", "hold"]},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        "reason": {"type": "string", "minLength": 1, "maxLength": 240},
    },
    "required": ["action", "confidence", "reason"],
}


class AutoPaperTradingRunner:
    def __init__(
        self,
        service: AutoPaperTradingService,
        evaluate_once: Callable[[], None],
        *,
        interval_seconds: float = 35,
    ) -> None:
        if interval_seconds <= 0:
            raise ValueError("auto_trading_interval_must_be_positive")
        self.service = service
        self.evaluate_once = evaluate_once
        self.interval_seconds = interval_seconds
        self._stopped = Event()
        self._thread: Thread | None = None

    @property
    def running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def start(self) -> None:
        if self.running:
            return
        self._stopped.clear()
        self._thread = Thread(
            target=self._run,
            name="auto-paper-trading-runner",
            daemon=True,
        )
        self.service.record_runner_state("running", self.interval_seconds)
        try:
            self._thread.start()
        except RuntimeError:
            self._thread = None
            self.service.record_runner_state("stopped", self.interval_seconds)
            raise

    def stop(self, timeout: float = 5) -> None:
        self._stopped.set()
        thread = self._thread
        if thread is None:
            return
        thread.join(timeout=max(0, timeout))
        if not thread.is_alive():
            self._thread = None
            self.service.record_runner_state("stopped", self.interval_seconds)

    def _run(self) -> None:
        while not self._stopped.is_set():
            cycle_error: str | None = None
            try:
                if self.service.reconcile_pending_order():
                    pass
                elif self.service.snapshot()["state"]["enabled"]:
                    self.evaluate_once()
            except Exception as error:
                cycle_error = str(error)
                self.service.record_evaluation_error(cycle_error)
            finally:
                self.service.record_runner_cycle(cycle_error)
            self._stopped.wait(self.interval_seconds)


class AutoPaperTradingService:
    # ponytail: one local API process needs one lock; move state to a transactional table for multi-worker deployment.
    def __init__(
        self,
        store: AuditEventStore,
        providers: AiReviewProviderRegistry,
        sandbox: Stage6SandboxExecutionService | None = None,
        production: Stage10ProductionExecutionService | None = None,
    ) -> None:
        self.store = store
        self.providers = providers
        self.sandbox = sandbox
        self.production = production

    def snapshot(self) -> dict[str, Any]:
        state = self._load()
        return self._payload(state)

    def reconcile_pending_order(self) -> dict[str, Any] | None:
        with _LOCK:
            return self._reconcile_pending_order(self._load())

    def record_evaluation_error(self, detail: str) -> dict[str, Any]:
        with _LOCK:
            state = self._load()
            if not state["enabled"]:
                return self._payload(state)
            return self._finish(
                state,
                status="evaluation_error",
                detail=(detail.strip() or "自动交易后台评估失败。")[:240],
            )

    def record_data_blocked(self, detail: str) -> dict[str, Any]:
        with _LOCK:
            state = self._load()
            if not state["enabled"]:
                return self._payload(state)
            return self._finish(
                state,
                status="data_blocked",
                detail=(detail.strip() or "自动交易行情不可用。")[:240],
            )

    def record_runner_state(
        self,
        runner_state: str,
        interval_seconds: float,
    ) -> dict[str, Any]:
        if runner_state not in {"running", "stopping", "stopped"}:
            raise ValueError("auto_trading_runner_state_invalid")
        with _LOCK:
            state = self._load()
            state["runnerState"] = runner_state
            state["runnerIntervalSeconds"] = interval_seconds
            state["updatedAt"] = _now().isoformat()
            self._save(state)
            return self._payload(state)

    def record_runner_cycle(self, error: str | None = None) -> dict[str, Any]:
        with _LOCK:
            state = self._load()
            now = _now().isoformat()
            state["runnerCycleCount"] = int(state["runnerCycleCount"]) + 1
            state["lastRunnerCycleAt"] = now
            if error is None:
                state["consecutiveRunnerFailures"] = 0
                state["lastRunnerSuccessAt"] = now
                if state["enabled"] and state["status"] == "evaluation_error":
                    state["status"] = "monitoring"
                    state["detail"] = "自动交易后台运行器已恢复。"
            else:
                state["consecutiveRunnerFailures"] = (
                    int(state["consecutiveRunnerFailures"]) + 1
                )
                state["lastRunnerErrorAt"] = now
            state["updatedAt"] = now
            self._save(state)
            return self._payload(state)

    def configure(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        with _LOCK:
            state = self._load()
            next_state = dict(state)
            for key, minimum, maximum in (
                ("triggerPct", 0.05, 20.0),
                ("orderNotional", 1.0, 10.0),
                ("stopLossPct", 0.1, 20.0),
                ("takeProfitPct", 0.1, 50.0),
                ("dailyLossLimitPct", 0.1, 20.0),
                ("maxTradesPerHour", 1.0, 60.0),
            ):
                if key in payload:
                    next_state[key] = _bounded_number(payload[key], key, minimum, maximum)
            if "enabled" in payload:
                if not isinstance(payload["enabled"], bool):
                    raise ValueError("enabled_must_be_boolean")
                next_state["enabled"] = payload["enabled"]
                next_state["status"] = "monitoring" if payload["enabled"] else "paused"
            if "providerId" in payload:
                provider_id = str(payload["providerId"] or "").strip()
                if provider_id not in {"auto", "openai", "openai-compatible", "ollama"}:
                    raise ValueError("provider_id_invalid")
                next_state["providerId"] = provider_id
            if "executionMode" in payload:
                execution_mode = str(payload["executionMode"] or "").strip()
                if execution_mode not in {"paper", "testnet", "live"}:
                    raise ValueError("execution_mode_invalid")
                next_state["executionMode"] = execution_mode
            if next_state["executionMode"] != state["executionMode"]:
                previous_mode = str(state["executionMode"])
                previous_order = state.get(
                    "lastLiveOrder"
                    if previous_mode == "live"
                    else "lastTestnetOrder"
                )
                if previous_mode in {"live", "testnet"} and (
                    float(state["position"]) > 0
                    or (
                        isinstance(previous_order, dict)
                        and previous_order.get("state") in _UNRESOLVED_ORDER_STATES
                    )
                ):
                    raise ValueError(
                        f"{previous_mode}_position_or_order_must_be_reconciled"
                    )
                _reset_strategy_ledger(next_state)
            if "liveOperator" in payload:
                next_state["liveOperator"] = str(payload["liveOperator"] or "").strip()
            if next_state["executionMode"] == "testnet":
                if (
                    next_state["enabled"]
                    and payload.get("testnetConfirmed") is not True
                    and next_state.get("testnetConfirmed") is not True
                ):
                    raise ValueError("testnet_confirmation_required")
                if next_state["enabled"] and self.sandbox is None:
                    raise ValueError("testnet_route_unavailable")
                if next_state["enabled"] and self.sandbox.kill_switch()["triggered"]:
                    raise ValueError("stage6_sandbox_kill_switch_triggered")
                next_state["testnetConfirmed"] = bool(next_state["enabled"])
            else:
                next_state["testnetConfirmed"] = False
            if next_state["executionMode"] == "live" and next_state["enabled"]:
                if payload.get("liveConfirmed") is not True:
                    raise ValueError("live_confirmation_required")
                if not next_state["liveOperator"]:
                    raise ValueError("live_operator_required")
                if self.production is None:
                    raise ValueError("live_route_unavailable")
                control = self.production.authorize_auto_session()
                next_state["liveConfirmed"] = True
                next_state["liveControlId"] = control["controlId"]
                next_state["liveIpRestricted"] = (
                    control["autoRouteSafety"]["ipRestricted"] is True
                )
                next_state["liveAuthorizedUntil"] = (
                    _now() + LIVE_SESSION_TTL
                ).isoformat()
            else:
                next_state["liveConfirmed"] = False
                next_state["liveControlId"] = None
                next_state["liveIpRestricted"] = False
                next_state["liveAuthorizedUntil"] = None
            next_state["updatedAt"] = _now().isoformat()
            self._save(next_state)
            live = next_state["executionMode"] == "live" and next_state["enabled"]
            self.store.record(_event(
                event_id=f"auto-paper-trading-control-{uuid4().hex[:12]}",
                event_type="auto_paper_trading_control_change",
                summary="自动交易监控已更新",
                detail="监控已启用。" if next_state["enabled"] else "监控已暂停。",
                metadata={
                    "enabled": next_state["enabled"],
                    "providerId": next_state["providerId"],
                    "executionMode": next_state["executionMode"],
                    "paperOnly": next_state["executionMode"] == "paper",
                    "sandboxOnly": next_state["executionMode"] == "testnet",
                    "liveTradingAllowed": live,
                    "orderSubmissionEnabled": live,
                    "routeExecuted": False,
                    "liveBlockedBoundary": not live,
                },
            ))
            return self._payload(next_state)

    def evaluate(self, bars: list[OHLCVBar], *, data_source: str) -> dict[str, Any]:
        with _LOCK:
            state = self._load()
            reconciled = self._reconcile_pending_order(state)
            if reconciled is not None:
                return reconciled
            if not state["enabled"]:
                return self._payload(state)
            if (
                state["executionMode"] == "testnet"
                and (self.sandbox is None or self.sandbox.kill_switch()["triggered"])
            ):
                return self._finish(state, status="risk_paused", detail="测试网急停已触发或路由不可用。")
            if state["executionMode"] == "live":
                if (
                    self.production is None
                    or state.get("liveConfirmed") is not True
                    or state.get("liveIpRestricted") is not True
                    or _parse_time(state.get("liveAuthorizedUntil")) < _now()
                ):
                    return self._finish(
                        state,
                        status="risk_paused",
                        detail="生产实盘会话未授权或已过期。",
                    )
                try:
                    self.production.require_auto_session(
                        str(state.get("liveControlId") or "")
                    )
                except ValueError as error:
                    return self._finish(
                        state,
                        status="risk_paused",
                        detail=str(error),
                    )
            mismatch = self._verify_account_coverage(state)
            if mismatch is not None:
                return mismatch
            if len(bars) < 6:
                return self._finish(state, status="data_blocked", detail="至少需要 6 根完整 K 线。")

            ordered = sorted(bars, key=lambda bar: bar.timestamp)
            latest = ordered[-1]
            price = float(latest.close)
            if price <= 0:
                return self._finish(state, status="data_blocked", detail="最新成交价无效。")
            bar_timestamp = latest.timestamp.isoformat()
            if state.get("lastBarTimestamp") == bar_timestamp:
                return self._payload(state)

            one_bar_change = _pct_change(ordered[-2].close, price)
            window_change = _pct_change(ordered[-6].close, price)
            now = _now()
            position = float(state["position"])
            cash = float(state["cash"])
            avg_cost = float(state["avgCost"])
            equity = cash + position * price
            if state["dailyDate"] != now.date().isoformat():
                state["dailyDate"] = now.date().isoformat()
                state["dailyStartEquity"] = equity
            state["lastBarTimestamp"] = bar_timestamp
            state["lastPrice"] = price
            state["equity"] = round(equity, 8)
            state["oneBarChangePct"] = round(one_bar_change, 4)
            state["windowChangePct"] = round(window_change, 4)
            state["dataSource"] = data_source

            recent_trades = [
                value for value in state["tradeTimestamps"]
                if _parse_time(value) >= now - timedelta(hours=1)
            ]
            state["tradeTimestamps"] = recent_trades
            daily_start = max(float(state["dailyStartEquity"]), 0.00000001)
            drawdown_pct = (daily_start - equity) / daily_start * 100

            action = "hold"
            confidence = 1.0
            reason = "涨跌幅尚未达到 AI 评估触发线。"
            provider_id = "rules"
            try:
                if position > 0 and avg_cost > 0:
                    position_return = _pct_change(avg_cost, price)
                    if position_return <= -float(state["stopLossPct"]):
                        action, reason, provider_id = "sell", "触发止损。", "risk"
                    elif position_return >= float(state["takeProfitPct"]):
                        action, reason, provider_id = "sell", "触发止盈。", "risk"
                    elif abs(window_change) >= float(state["triggerPct"]):
                        action, confidence, reason, provider_id = self._ai_decision(
                            state, one_bar_change, window_change
                        )
                elif abs(window_change) >= float(state["triggerPct"]):
                    action, confidence, reason, provider_id = self._ai_decision(
                        state, one_bar_change, window_change
                    )
            except ValueError as error:
                return self._finish(state, status="ai_error", detail=str(error))

            proposal_action = action
            proposal_reason = reason
            if action == "buy" and position > 0:
                action, reason = "hold", "已有持仓，本轮不重复加仓。"
            elif action == "sell" and position <= 0:
                action, reason = "hold", "当前没有可卖出的持仓。"

            state["lastDecision"] = {
                "action": action,
                "confidence": round(confidence, 4),
                "reason": reason,
                "providerId": provider_id,
                "evaluatedAt": now.isoformat(),
            }
            decision_contract = build_decision_contract(
                bars=ordered[-6:],
                market=str(state["market"]),
                symbol=str(state["symbol"]),
                timeframe=str(state["timeframe"]),
                data_source=data_source,
                strategy_revision=_strategy_revision(state),
                proposal_action=proposal_action,
                proposal_confidence=confidence,
                proposal_reason=proposal_reason,
                provider_id=provider_id,
                signal_action=action,
                signal_confidence=confidence,
                signal_reason=reason,
                current_quantity=position,
                reference_price=price,
                available_cash=cash,
                order_notional=float(state["orderNotional"]),
                fee_rate=FEE_RATE,
                daily_drawdown_pct=drawdown_pct,
                daily_loss_limit_pct=float(state["dailyLossLimitPct"]),
                recent_trade_count=len(recent_trades),
                max_trades_per_hour=int(state["maxTradesPerHour"]),
                generated_at=now,
            )
            state["lastDecisionContract"] = decision_contract
            portfolio_target = decision_contract["portfolioTarget"]
            increases_risk = float(portfolio_target["targetQuantity"]) > position + 1e-12
            risk_reason = (
                "已达到当日策略亏损上限。"
                if increases_risk and drawdown_pct >= float(state["dailyLossLimitPct"])
                else "已达到每小时成交次数上限。"
                if increases_risk and len(recent_trades) >= int(state["maxTradesPerHour"])
                else None
            )
            if risk_reason is not None:
                decision_contract["riskAdjustedTarget"] = build_risk_adjusted_target(
                    portfolio_target,
                    decision="reject",
                    reason=risk_reason,
                    evidence=decision_contract["riskAdjustedTarget"]["evidence"],
                )
                decision_contract["orderIntent"] = None
                state["lastDecision"] = {
                    "action": "hold",
                    "confidence": round(confidence, 4),
                    "reason": risk_reason,
                    "providerId": "risk",
                    "evaluatedAt": now.isoformat(),
                }
                return self._finish(state, status="risk_paused", detail=risk_reason)

            adjusted_target = decision_contract["riskAdjustedTarget"]
            order_intent = decision_contract["orderIntent"]
            trade = None
            if action == "buy":
                quantity = float(adjusted_target["approvedTargetQuantity"]) - position
                notional = quantity * price
                spend = notional * (1 + FEE_RATE)
                if spend < 1:
                    return self._finish(state, status="risk_paused", detail="账户可用资金不足。")
                routed = self._route_order(
                    state,
                    order_intent,
                    {
                        "reason": reason,
                        "providerId": provider_id,
                        "confidence": confidence,
                    },
                )
                if routed and routed["state"] != "filled":
                    self._remember_routed_order(state, routed)
                    rejected = routed["state"] == "rejected"
                    mode = "生产" if state["executionMode"] == "live" else "测试网"
                    return self._finish(
                        state,
                        status="order_rejected" if rejected else "order_pending",
                        detail=str(
                            routed.get("error")
                            or f"{mode}委托尚未成交，已停止重复下单。"
                        ),
                    )
                if routed:
                    self._remember_routed_order(state, routed)
                    quantity = float(routed["filledQuantity"])
                    price = float(routed["averagePrice"] or price)
                    notional = float(routed.get("filledNotional") or quantity * price)
                fee, fee_estimated, cash_fee, base_fee = _fee_accounting(
                    routed,
                    str(state["symbol"]),
                    price,
                    notional,
                )
                acquired = quantity - base_fee
                state["cash"] = round(cash - notional - cash_fee, 8)
                state["position"] = round(acquired, 12)
                state["avgCost"] = round(
                    (notional + cash_fee) / acquired,
                    8,
                )
                trade = _trade(
                    "buy", quantity, price, notional, fee, reason, provider_id, confidence,
                    fee_estimated=fee_estimated,
                    execution_mode=str(state["executionMode"]),
                    testnet_order=routed if state["executionMode"] == "testnet" else None,
                    live_order=routed if state["executionMode"] == "live" else None,
                )
            elif action == "sell":
                quantity = position - float(adjusted_target["approvedTargetQuantity"])
                notional = quantity * price
                routed = self._route_order(
                    state,
                    order_intent,
                    {
                        "reason": reason,
                        "providerId": provider_id,
                        "confidence": confidence,
                    },
                )
                if routed and routed["state"] != "filled":
                    self._remember_routed_order(state, routed)
                    rejected = routed["state"] == "rejected"
                    mode = "生产" if state["executionMode"] == "live" else "测试网"
                    return self._finish(
                        state,
                        status="order_rejected" if rejected else "order_pending",
                        detail=str(
                            routed.get("error")
                            or f"{mode}委托尚未成交，已停止重复下单。"
                        ),
                    )
                if routed:
                    self._remember_routed_order(state, routed)
                    quantity = float(routed["filledQuantity"])
                    price = float(routed["averagePrice"] or price)
                    notional = float(routed.get("filledNotional") or quantity * price)
                fee, fee_estimated, cash_fee, base_fee = _fee_accounting(
                    routed,
                    str(state["symbol"]),
                    price,
                    notional,
                )
                state["cash"] = round(cash + notional - cash_fee, 8)
                state["position"] = round(
                    max(0.0, position - quantity - base_fee),
                    12,
                )
                state["avgCost"] = round(avg_cost, 8) if state["position"] else 0.0
                state["realizedPnl"] = round(
                    float(state["realizedPnl"]) + (price - avg_cost) * quantity - fee,
                    8,
                )
                trade = _trade(
                    "sell", quantity, price, notional, fee, reason, provider_id, confidence,
                    fee_estimated=fee_estimated,
                    execution_mode=str(state["executionMode"]),
                    testnet_order=routed if state["executionMode"] == "testnet" else None,
                    live_order=routed if state["executionMode"] == "live" else None,
                )

            if trade:
                if state["executionMode"] == "paper" and isinstance(order_intent, dict):
                    state["lastOrderResult"] = build_order_result(
                        order_intent,
                        execution_mode="paper",
                        evidence={
                            "state": "filled",
                            "filledQuantity": trade["quantity"],
                            "remainingQuantity": 0,
                            "averagePrice": trade["price"],
                            "filledNotional": trade["notional"],
                        },
                    )
                self._record_trade(state, trade, recent_trades, now)
            return self._finish(
                state,
                status="traded" if trade else "monitoring",
                detail=reason,
            )

    def _reconcile_pending_order(
        self,
        state: dict[str, Any],
    ) -> dict[str, Any] | None:
        mode = str(state["executionMode"])
        key = "lastLiveOrder" if mode == "live" else "lastTestnetOrder"
        pending = state.get(key)
        if (
            mode not in {"live", "testnet"}
            or not isinstance(pending, dict)
            or pending.get("state") not in _UNRESOLVED_ORDER_STATES
        ):
            return None
        order = pending.get("request")
        if not isinstance(order, dict):
            pending["state"] = "reconciliation_required"
            pending["error"] = "auto_trading_order_request_missing"
            return self._finish(state, status="order_pending", detail=pending["error"])
        try:
            if mode == "live":
                if self.production is None:
                    raise ValueError("live_route_unavailable")
                evidence = self.production.reconcile_auto_market_order(
                    order,
                    pending,
                    operator=str(state.get("liveOperator") or ""),
                )
            else:
                if self.sandbox is None:
                    raise ValueError("testnet_route_unavailable")
                evidence = self.sandbox.reconcile_auto_market_order(order, pending)
        except (LookupError, RuntimeError, ValueError) as error:
            evidence = {
                "state": "reconciliation_required",
                "filledQuantity": float(pending.get("filledQuantity") or 0),
                "averagePrice": float(pending.get("averagePrice") or 0),
                "error": str(error)[:240],
                "operation": "query",
            }
        routed = {**pending, **evidence, "request": order}
        self._remember_routed_order(state, routed)
        if routed["state"] in _UNRESOLVED_ORDER_STATES:
            return self._finish(
                state,
                status="order_pending",
                detail=str(routed.get("error") or "上一笔委托仍需对账。"),
            )
        filled_quantity = float(routed.get("filledQuantity") or 0)
        if filled_quantity > 0:
            trade = self._settle_routed_trade(state, routed)
            if trade is None:
                routed["state"] = "reconciliation_required"
                routed["error"] = "auto_trading_filled_order_evidence_invalid"
                self._remember_routed_order(state, routed)
                return self._finish(state, status="order_pending", detail=routed["error"])
            now = _now()
            recent_trades = [
                value for value in state["tradeTimestamps"]
                if _parse_time(value) >= now - timedelta(hours=1)
            ]
            self._record_trade(state, trade, recent_trades, now)
            return self._finish(
                state,
                status="traded" if state["enabled"] else "paused",
                detail="上一笔委托已完成对账并计入策略账本。",
            )
        return self._finish(
            state,
            status="order_rejected" if routed["state"] == "rejected" else "order_closed",
            detail=str(routed.get("error") or "上一笔委托已结束且未成交。"),
        )

    def _settle_routed_trade(
        self,
        state: dict[str, Any],
        routed: dict[str, Any],
    ) -> dict[str, Any] | None:
        request = routed["request"]
        side = request.get("side")
        quantity = float(routed.get("filledQuantity") or 0)
        price = float(routed.get("averagePrice") or request.get("referencePrice") or 0)
        position = float(state["position"])
        if (
            side not in {"buy", "sell"}
            or quantity <= 0
            or price <= 0
        ):
            return None
        notional = float(routed.get("filledNotional") or quantity * price)
        fee, fee_estimated, cash_fee, base_fee = _fee_accounting(
            routed,
            str(state["symbol"]),
            price,
            notional,
        )
        if (
            (side == "buy" and quantity <= base_fee)
            or (side == "sell" and quantity + base_fee > position)
        ):
            return None
        if side == "buy":
            acquired = quantity - base_fee
            total_position = position + acquired
            state["cash"] = round(
                float(state["cash"]) - notional - cash_fee,
                8,
            )
            state["position"] = round(total_position, 12)
            state["avgCost"] = round(
                (
                    position * float(state["avgCost"])
                    + notional
                    + cash_fee
                )
                / total_position,
                8,
            )
        else:
            avg_cost = float(state["avgCost"])
            state["cash"] = round(
                float(state["cash"]) + notional - cash_fee,
                8,
            )
            state["position"] = round(
                max(0.0, position - quantity - base_fee),
                12,
            )
            state["avgCost"] = round(avg_cost, 8) if state["position"] else 0.0
            state["realizedPnl"] = round(
                float(state["realizedPnl"]) + (price - avg_cost) * quantity - fee,
                8,
            )
        routed["settled"] = True
        self._remember_routed_order(state, routed)
        intent = routed.get("tradeIntent")
        intent = intent if isinstance(intent, dict) else {}
        reason = str(intent.get("reason") or "委托对账完成。")
        provider_id = str(intent.get("providerId") or "exchange")
        confidence = float(intent.get("confidence") or 0)
        state["lastDecision"] = {
            "action": side,
            "confidence": round(confidence, 4),
            "reason": reason,
            "providerId": provider_id,
            "evaluatedAt": _now().isoformat(),
        }
        mode = str(state["executionMode"])
        return _trade(
            side,
            quantity,
            price,
            notional,
            fee,
            reason,
            provider_id,
            confidence,
            fee_estimated=fee_estimated,
            execution_mode=mode,
            testnet_order=routed if mode == "testnet" else None,
            live_order=routed if mode == "live" else None,
        )

    def _record_trade(
        self,
        state: dict[str, Any],
        trade: dict[str, Any],
        recent_trades: list[str],
        now: datetime,
    ) -> None:
        mode = str(state["executionMode"])
        stored, _ = self.store.record_if_absent(_event(
            event_id=trade["tradeId"],
            event_type=(
                "auto_live_trade"
                if mode == "live"
                else "auto_testnet_trade"
                if mode == "testnet"
                else "auto_paper_trade"
            ),
            summary=(
                f"AI {'生产实盘' if mode == 'live' else '测试网' if mode == 'testnet' else '纸面'}"
                f"自动交易：{'买入' if trade['side'] == 'buy' else '卖出'}"
            ),
            detail=f"{state['symbol']} {trade['quantity']} @ {trade['price']}",
            metadata={
                **trade,
                "market": state["market"],
                "symbol": state["symbol"],
                "timeframe": state["timeframe"],
                "cashAfter": state["cash"],
                "positionAfter": state["position"],
                "paperOnly": mode == "paper",
                "sandboxOnly": mode == "testnet",
                "sandboxOrderSubmitted": mode == "testnet",
                "sandboxRouteExecuted": mode == "testnet",
                "liveTradingAllowed": mode == "live",
                "orderSubmissionEnabled": mode == "live",
                "routeExecuted": mode == "live",
                "liveBlockedBoundary": mode != "live",
            },
        ))
        created_at = str(stored.metadata.get("createdAt") or now.isoformat())
        trade["createdAt"] = created_at
        state["tradeCount"] = int(state["tradeCount"]) + 1
        state["tradeTimestamps"] = [*recent_trades, created_at]
        state["lastTrade"] = trade

    def _route_order(
        self,
        state: dict[str, Any],
        order_intent: dict[str, Any],
        trade_intent: dict[str, Any],
    ) -> dict[str, Any] | None:
        mode = str(state["executionMode"])
        if mode == "paper":
            return None
        side = str(order_intent["side"])
        quantity = float(order_intent["quantity"])
        price = float(order_intent["referencePrice"])
        notional = float(order_intent["notionalValue"])
        identity = hashlib.sha256(
            f"{mode}:{order_intent['orderIntentId']}".encode()
        ).hexdigest()[:20]
        order = {
            "clientOrderId": f"aiqt-auto-{mode[0]}-{identity}",
            "symbol": order_intent["symbol"],
            "side": side,
            "quantity": quantity,
            "referencePrice": price,
            "notionalValue": notional,
        }
        if mode == "live":
            order["riskBudgetNotional"] = (
                notional
                if side == "buy"
                else quantity * float(state.get("avgCost") or 0)
            )
        intent, _ = self.store.record_if_absent(_event(
            event_id=f"auto-{mode}-order-intent-{order['clientOrderId']}",
            event_type=f"auto_{mode}_order_intent",
            summary=(
                f"AI {'生产实盘' if mode == 'live' else '测试网'}自动委托已准备"
            ),
            detail=f"{state['symbol']} {side} {quantity}",
            metadata={
                "executionMode": mode,
                "order": order,
                "orderIntent": order_intent,
                "tradeIntent": trade_intent,
                "paperOnly": False,
                "sandboxOnly": mode == "testnet",
                "liveTradingAllowed": mode == "live",
                "orderSubmissionEnabled": mode == "live",
                "routeExecuted": False,
                "liveBlockedBoundary": mode != "live",
            },
        ))
        stored_order = intent.metadata.get("order")
        stored_order_intent = intent.metadata.get("orderIntent")
        stored_trade_intent = intent.metadata.get("tradeIntent")
        if isinstance(stored_order, dict):
            order = stored_order
        if isinstance(stored_order_intent, dict):
            order_intent = stored_order_intent
        if isinstance(stored_trade_intent, dict):
            trade_intent = stored_trade_intent
        state[
            "lastLiveOrderIntentId"
            if mode == "live"
            else "lastTestnetOrderIntentId"
        ] = intent.event_id
        try:
            if mode == "testnet":
                if self.sandbox is None or state.get("testnetConfirmed") is not True:
                    raise ValueError("testnet_route_not_authorized")
                evidence = self.sandbox.submit_auto_market_order(order)
            elif mode == "live":
                if self.production is None or state.get("liveConfirmed") is not True:
                    raise ValueError("live_route_not_authorized")
                evidence = self.production.submit_auto_market_order(
                    order,
                    control_id=str(state.get("liveControlId") or ""),
                    operator=str(state.get("liveOperator") or ""),
                )
            else:
                raise ValueError("execution_mode_invalid")
            return {
                **evidence,
                "request": order,
                "orderIntent": order_intent,
                "tradeIntent": trade_intent,
            }
        except (LookupError, RuntimeError, ValueError) as error:
            return {
                "state": "rejected",
                "filledQuantity": 0.0,
                "averagePrice": 0.0,
                "error": str(error)[:240],
                "request": order,
                "orderIntent": order_intent,
                "tradeIntent": trade_intent,
            }

    def _verify_account_coverage(
        self,
        state: dict[str, Any],
    ) -> dict[str, Any] | None:
        mode = str(state["executionMode"])
        if mode == "paper":
            return None
        expected_position = float(state["position"])
        required_quote = (
            0.0
            if expected_position > 0
            else min(float(state["orderNotional"]), float(state["cash"]))
        )
        try:
            if mode == "testnet":
                if self.sandbox is None:
                    raise ValueError("testnet_route_not_authorized")
                coverage = self.sandbox.verify_auto_account_coverage(
                    expected_position,
                    required_quote,
                )
            else:
                if self.production is None:
                    raise ValueError("live_route_not_authorized")
                coverage = self.production.verify_auto_account_coverage(
                    expected_position,
                    required_quote,
                    control_id=str(state.get("liveControlId") or ""),
                    operator=str(state.get("liveOperator") or ""),
                )
            state["lastAccountCheck"] = {
                **coverage,
                "checkedAt": _now().isoformat(),
            }
        except Exception as error:
            state["lastAccountCheck"] = {
                "accountCovered": False,
                "positionCovered": False,
                "quoteCovered": False,
                "unexpectedOpenAutoOrderCount": 0,
                "checkError": error.__class__.__name__,
                "checkedAt": _now().isoformat(),
            }
        if state["lastAccountCheck"]["accountCovered"]:
            return None
        detail = (
            "检测到未纳入本地策略账本的自动挂单，已暂停新决策。"
            if state["lastAccountCheck"]["unexpectedOpenAutoOrderCount"]
            else "交易所可用资产不能覆盖本地策略账本，已暂停新决策。"
        )
        return self._finish(state, status="account_mismatch", detail=detail)

    @staticmethod
    def _remember_routed_order(
        state: dict[str, Any],
        routed: dict[str, Any],
    ) -> None:
        mode = str(state["executionMode"])
        if mode == "live":
            state["lastLiveOrder"] = routed
        elif mode == "testnet":
            state["lastTestnetOrder"] = routed
        order_intent = routed.get("orderIntent")
        if mode in {"testnet", "live"} and isinstance(order_intent, dict):
            state["lastOrderResult"] = build_order_result(
                order_intent,
                execution_mode=mode,
                evidence=routed,
            )

    def _ai_decision(
        self,
        state: dict[str, Any],
        one_bar_change: float,
        window_change: float,
    ) -> tuple[str, float, str, str]:
        provider_id, provider = self._provider(str(state["providerId"]))
        if provider is None:
            raise ValueError("ai_trading_provider_not_configured")
        prompt = (
            "你是自动交易信号分类器。目标是控制亏损并争取正收益，但不得承诺不亏。"
            "只根据给定数值输出 buy、sell 或 hold；不要决定数量。"
            f"\n市场={state['market']}; 标的={state['symbol']}; 周期={state['timeframe']};"
            f" 单根涨跌幅={one_bar_change:.4f}%; 五根涨跌幅={window_change:.4f}%;"
            f" 当前持仓={state['position']}; 账户现金={state['cash']};"
            f" 止损={state['stopLossPct']}%; 止盈={state['takeProfitPct']}%。"
        )
        attempt = provider.assess(
            rendered_prompt=prompt,
            output_schema=_OUTPUT_SCHEMA,
            known_evidence_ids=frozenset(),
            response_validator=_validate_decision,
        )
        assessment = attempt.assessment
        return (
            str(assessment["action"]),
            float(assessment["confidence"]),
            str(assessment["reason"]),
            provider_id,
        )

    def _provider(self, requested: str):
        order = ("openai-compatible", "openai", "ollama") if requested == "auto" else (requested,)
        for provider_id in order:
            provider = self.providers.get(provider_id)  # type: ignore[arg-type]
            if provider is not None:
                return provider_id, provider
        return requested, None

    def _finish(self, state: dict[str, Any], *, status: str, detail: str) -> dict[str, Any]:
        state["status"] = status
        state["detail"] = detail
        state["updatedAt"] = _now().isoformat()
        self._save(state)
        return self._payload(state)

    def _load(self) -> dict[str, Any]:
        event = self.store.get(CONTROL_EVENT_ID)
        stored = event.metadata.get("state") if event else None
        state = {**_default_state(), **stored} if isinstance(stored, dict) else _default_state()
        mode = str(state["executionMode"])
        if mode in {"testnet", "live"}:
            intent_events = self.store.list_recent(
                event_type=f"auto_{mode}_order_intent",
                limit=1,
            )
            intent = intent_events[0] if intent_events else None
            watermark_key = (
                "lastLiveOrderIntentId"
                if mode == "live"
                else "lastTestnetOrderIntentId"
            )
            metadata = intent.metadata if intent else {}
            order = metadata.get("order")
            if (
                intent is not None
                and intent.event_id != state.get(watermark_key)
                and isinstance(order, dict)
            ):
                state[watermark_key] = intent.event_id
                recovered_order = {
                    "state": "submission_pending",
                    "exchangeOrderId": "",
                    "filledQuantity": 0.0,
                    "remainingQuantity": float(order.get("quantity") or 0),
                    "averagePrice": 0.0,
                    "operation": "recover",
                    "error": "",
                    "request": order,
                    "orderIntent": metadata.get("orderIntent"),
                    "tradeIntent": metadata.get("tradeIntent"),
                }
                self._remember_routed_order(state, recovered_order)
                state["status"] = "order_pending"
                state["detail"] = "检测到尚未写回策略状态的委托，等待只读对账。"
        return state

    def _save(self, state: dict[str, Any]) -> None:
        self.store.record(_event(
            event_id=CONTROL_EVENT_ID,
            event_type="auto_paper_trading_state",
            summary="AI 自动交易当前状态",
            detail=str(state.get("detail") or "等待监控。"),
            metadata={"state": state},
        ))

    def _payload(self, state: dict[str, Any]) -> dict[str, Any]:
        providers = [
            {
                "providerId": item.provider_id,
                "configured": item.configured,
                "model": item.model,
            }
            for item in self.providers.statuses()
            if item.provider_id != "local"
        ]
        history_events = [
            *self.store.list_recent(event_type="auto_paper_trade", limit=5),
            *self.store.list_recent(event_type="auto_testnet_trade", limit=5),
            *self.store.list_recent(event_type="auto_live_trade", limit=5),
        ]
        history = [
            audit_event_record_to_payload(event)
            for event in sorted(history_events, key=lambda item: item.created_at, reverse=True)[:5]
        ]
        mode = str(state["executionMode"])
        testnet = mode == "testnet"
        live = mode == "live"
        kill_switch = self.sandbox.kill_switch() if self.sandbox is not None else None
        try:
            live_status = (
                self.production.auto_live_status()
                if self.production is not None
                else {
                    "enabled": False,
                    "credentialsConfigured": False,
                    "controlActive": False,
                    "controlId": None,
                    "triggered": True,
                }
            )
        except ValueError:
            live_status = {
                "enabled": False,
                "credentialsConfigured": False,
                "controlActive": False,
                "controlId": None,
                "triggered": True,
            }
        live_allowed = bool(
            live
            and state["enabled"]
            and state.get("liveConfirmed") is True
            and state.get("liveIpRestricted") is True
            and _parse_time(state.get("liveAuthorizedUntil")) >= _now()
            and live_status["controlActive"]
            and live_status["controlId"] == state.get("liveControlId")
        )
        state_payload = {**state, "runnerHealth": _runner_health(state)}
        return {
            "state": state_payload,
            "providers": providers,
            "history": history,
            "paperOnly": mode == "paper",
            "sandboxOnly": testnet,
            "sandboxOrderSubmissionEnabled": testnet and state["enabled"],
            "sandboxRouteExecuted": bool(
                testnet
                and isinstance(state.get("lastTrade"), dict)
                and state["lastTrade"].get("executionMode") == "testnet"
            ),
            "sandboxKillSwitch": kill_switch,
            "productionLive": live_status,
            "liveTradingAllowed": live_allowed,
            "orderSubmissionEnabled": live_allowed,
            "routeExecuted": bool(
                live_allowed
                and isinstance(state.get("lastTrade"), dict)
                and state["lastTrade"].get("executionMode") == "live"
            ),
            "liveBlockedBoundary": not live_allowed,
        }


def _runner_health(state: Mapping[str, Any]) -> dict[str, Any]:
    last_heartbeat_at = state.get("lastRunnerCycleAt")
    heartbeat_age = (
        max(0, round((_now() - _parse_time(last_heartbeat_at)).total_seconds()))
        if last_heartbeat_at
        else None
    )
    stale_after = max(90, round(float(state.get("runnerIntervalSeconds") or 35) * 3))
    recovered = bool(
        state.get("lastRunnerErrorAt")
        and state.get("lastRunnerSuccessAt")
        and _parse_time(state["lastRunnerSuccessAt"])
        > _parse_time(state["lastRunnerErrorAt"])
    )
    if state.get("runnerState") != "running":
        status, reason = "offline", "runner_stopped"
    elif heartbeat_age is None:
        status, reason = "offline", "heartbeat_missing"
    elif heartbeat_age > stale_after:
        status, reason = "delayed", "heartbeat_stale"
    elif int(state.get("consecutiveRunnerFailures") or 0) > 0:
        status, reason = "blocked", "runner_failures"
    elif state.get("enabled") and state.get("status") in {
        "account_mismatch",
        "ai_error",
        "data_blocked",
        "evaluation_error",
        "order_pending",
        "order_rejected",
        "risk_paused",
    }:
        status, reason = "blocked", str(state["status"])
    else:
        status, reason = "running", "healthy"
    return {
        "status": status,
        "reason": reason,
        "heartbeatAgeSeconds": heartbeat_age,
        "staleAfterSeconds": stale_after,
        "lastHeartbeatAt": last_heartbeat_at,
        "recovered": recovered,
    }


def _reset_strategy_ledger(state: dict[str, Any]) -> None:
    now = _now()
    state.update(
        {
            "cash": float(state.get("initialCash") or 100.0),
            "position": 0.0,
            "avgCost": 0.0,
            "equity": float(state.get("initialCash") or 100.0),
            "realizedPnl": 0.0,
            "dailyDate": now.date().isoformat(),
            "dailyStartEquity": float(state.get("initialCash") or 100.0),
            "tradeCount": 0,
            "tradeTimestamps": [],
            "lastBarTimestamp": None,
            "lastPrice": None,
            "oneBarChangePct": None,
            "windowChangePct": None,
            "dataSource": None,
            "lastDecision": None,
            "lastTrade": None,
            "lastTestnetOrder": None,
            "lastLiveOrder": None,
            "lastAccountCheck": None,
            "lastDecisionContract": None,
            "lastOrderResult": None,
        }
    )


def _default_state() -> dict[str, Any]:
    now = _now()
    return {
        "enabled": False,
        "status": "paused",
        "detail": "等待手动选择纸面、测试网或生产实盘自动交易。",
        "executionMode": "paper",
        "testnetConfirmed": False,
        "liveConfirmed": False,
        "liveOperator": "",
        "liveControlId": None,
        "liveIpRestricted": False,
        "liveAuthorizedUntil": None,
        "runnerState": "stopped",
        "runnerIntervalSeconds": 35,
        "runnerCycleCount": 0,
        "consecutiveRunnerFailures": 0,
        "lastRunnerCycleAt": None,
        "lastRunnerSuccessAt": None,
        "lastRunnerErrorAt": None,
        "market": "crypto",
        "symbol": "BTC/USDT",
        "timeframe": "1m",
        "triggerPct": 0.3,
        "orderNotional": 10.0,
        "stopLossPct": 1.0,
        "takeProfitPct": 2.0,
        "dailyLossLimitPct": 2.0,
        "maxTradesPerHour": 3,
        "providerId": "auto",
        "initialCash": 100.0,
        "cash": 100.0,
        "position": 0.0,
        "avgCost": 0.0,
        "equity": 100.0,
        "realizedPnl": 0.0,
        "dailyDate": now.date().isoformat(),
        "dailyStartEquity": 100.0,
        "tradeCount": 0,
        "tradeTimestamps": [],
        "lastBarTimestamp": None,
        "lastPrice": None,
        "oneBarChangePct": None,
        "windowChangePct": None,
        "dataSource": None,
        "lastDecision": None,
        "lastDecisionContract": None,
        "lastOrderResult": None,
        "lastTrade": None,
        "lastTestnetOrder": None,
        "lastLiveOrder": None,
        "lastTestnetOrderIntentId": None,
        "lastLiveOrderIntentId": None,
        "lastAccountCheck": None,
        "updatedAt": now.isoformat(),
    }


def _validate_decision(value: Mapping[str, Any], _known_ids: frozenset[str]) -> dict[str, Any]:
    action = value.get("action")
    confidence = value.get("confidence")
    reason = value.get("reason")
    if action not in {"buy", "sell", "hold"}:
        raise ValueError("ai_trading_action_invalid")
    if isinstance(confidence, bool) or not isinstance(confidence, (int, float)) or not 0 <= float(confidence) <= 1:
        raise ValueError("ai_trading_confidence_invalid")
    if not isinstance(reason, str) or not reason.strip() or len(reason.strip()) > 240:
        raise ValueError("ai_trading_reason_invalid")
    return {"action": action, "confidence": float(confidence), "reason": reason.strip()}


def _strategy_revision(state: Mapping[str, Any]) -> str:
    return canonical_sha256({
        "kind": "auto-pct-v1",
        "market": state["market"],
        "symbol": state["symbol"],
        "timeframe": state["timeframe"],
        "triggerPct": state["triggerPct"],
        "stopLossPct": state["stopLossPct"],
        "takeProfitPct": state["takeProfitPct"],
        "providerId": state["providerId"],
    })


def _trade(
    side: str,
    quantity: float,
    price: float,
    notional: float,
    fee: float,
    reason: str,
    provider_id: str,
    confidence: float,
    *,
    fee_estimated: bool,
    execution_mode: str,
    testnet_order: dict[str, Any] | None,
    live_order: dict[str, Any] | None,
) -> dict[str, Any]:
    routed = live_order or testnet_order or {}
    reported_fees = routed.get("fees")
    request = routed.get("request") if isinstance(routed, dict) else {}
    request = request if isinstance(request, dict) else {}
    client_order_id = str(
        routed.get("clientOrderId")
        or request.get("clientOrderId")
        or ""
    )
    trade_suffix = (
        hashlib.sha256(
            f"{execution_mode}:{client_order_id}".encode()
        ).hexdigest()[:20]
        if execution_mode in {"testnet", "live"} and client_order_id
        else uuid4().hex[:12]
    )
    return {
        "tradeId": f"auto-{execution_mode}-trade-{trade_suffix}",
        "executionMode": execution_mode,
        "side": side,
        "quantity": round(quantity, 12),
        "price": round(price, 8),
        "notional": round(notional, 8),
        "fee": round(fee, 8),
        "feeEstimated": fee_estimated,
        "feeBreakdown": reported_fees if isinstance(reported_fees, list) else [],
        "reason": reason,
        "providerId": provider_id,
        "confidence": round(confidence, 4),
        "testnetOrder": testnet_order,
        "liveOrder": live_order,
        "createdAt": _now().isoformat(),
    }


def _fee_accounting(
    routed: dict[str, Any] | None,
    symbol: str,
    price: float,
    notional: float,
) -> tuple[float, bool, float, float]:
    fees = routed.get("fees") if isinstance(routed, dict) else None
    parts = symbol.split("/")
    if isinstance(fees, list) and fees and len(parts) == 2:
        base, quote = parts
        if all(
            isinstance(item, dict)
            and item.get("currency") in {base, quote}
            and isinstance(item.get("cost"), (int, float))
            and not isinstance(item.get("cost"), bool)
            and float(item["cost"]) >= 0
            for item in fees
        ):
            base_fee = sum(
                float(item["cost"])
                for item in fees
                if item["currency"] == base
            )
            quote_fee = sum(
                float(item["cost"])
                for item in fees
                if item["currency"] == quote
            )
            return quote_fee + base_fee * price, False, quote_fee, base_fee
    # ponytail: third-currency fees need a price feed; estimate until account
    # reconciliation adds fee-asset valuation.
    estimated = notional * FEE_RATE
    return estimated, True, estimated, 0.0


def _event(
    *,
    event_id: str,
    event_type: str,
    summary: str,
    detail: str,
    metadata: dict[str, Any],
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": event_id,
        "eventType": event_type,
        "runId": None,
        "createdAt": _now().isoformat(),
        "stage": "auto-paper-trading",
        "source": "auto-paper-trading",
        "summary": summary,
        "detail": detail,
        "metadata": metadata,
    }


def _bounded_number(value: Any, key: str, minimum: float, maximum: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{key}_must_be_number")
    number = float(value)
    if number < minimum or number > maximum:
        raise ValueError(f"{key}_out_of_range")
    return int(number) if key == "maxTradesPerHour" else round(number, 4)


def _pct_change(start: float, end: float) -> float:
    return 0.0 if float(start) == 0 else (float(end) - float(start)) / float(start) * 100


def _parse_time(value: Any) -> datetime:
    try:
        parsed = datetime.fromisoformat(str(value))
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)
