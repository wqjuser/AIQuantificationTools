from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
import hashlib
import math
import time
from threading import Event, Lock, Thread
from typing import Any
from uuid import uuid4

from quant_core.ai_review_providers import AiReviewProviderRegistry
from quant_core.audit_events import AuditEventStore, audit_event_record_to_payload
from quant_core.backtest import BacktestEngine, strategy_conditions_met, strategy_required_bars
from quant_core.canonical import (
    canonical_data_hash,
    canonical_sha256,
    canonical_snapshot_id,
    normalize_snapshot_bars,
    snapshot_bars_to_ohlcv,
    strategy_config_from_payload,
    strategy_config_to_payload,
)
from quant_core.decision_contract import (
    build_decision_contract,
    build_order_intent,
    build_order_result,
    build_risk_adjusted_target,
)
from quant_core.domain import OHLCVBar, StrategyConfig
from quant_core.runs import ResearchRunAudit, ResearchRunStore
from quant_core.stage6_sandbox import Stage6SandboxExecutionService
from quant_core.stage10_production_execution import Stage10ProductionExecutionService
from quant_core.strategy_library import StrategyLibraryRecord, StrategyLibraryStore


CONTROL_EVENT_ID = "auto-paper-trading-current-state"
FEE_RATE = 0.001
PRODUCTION_REPLAY_SLIPPAGE_RATE = 0.001
_UNRESOLVED_ORDER_STATES = {
    "submission_pending",
    "open",
    "partially_filled",
    "reconciliation_required",
}
_LOCK = Lock()
AUTO_STRATEGY_ID = "auto-pct-v1"
AUTO_DECISION_PROMPT_TEMPLATE_VERSION = "aiqt-auto-decision-v1"
AUTO_DECISION_OUTPUT_SCHEMA_VERSION = "aiqt-auto-decision-output-v1"
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

    def update_interval(self, interval_seconds: float) -> None:
        if interval_seconds <= 0:
            raise ValueError("auto_trading_interval_must_be_positive")
        self.interval_seconds = interval_seconds
        self.service.record_runner_state(
            "running" if self.running else "stopped",
            self.interval_seconds,
        )

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
            cycle_finished_at = time.monotonic()
            while not self._stopped.is_set():
                remaining = self.interval_seconds - (
                    time.monotonic() - cycle_finished_at
                )
                if remaining <= 0:
                    break
                self._stopped.wait(min(1.0, remaining))


class AutoPaperTradingService:
    # ponytail: one local API process needs one lock; move state to a transactional table for multi-worker deployment.
    def __init__(
        self,
        store: AuditEventStore,
        providers: AiReviewProviderRegistry,
        sandbox: Stage6SandboxExecutionService | None = None,
        production: Stage10ProductionExecutionService | None = None,
        *,
        live_session_ttl_hours: int = 8,
        strategy_store: StrategyLibraryStore | None = None,
        run_store: ResearchRunStore | None = None,
    ) -> None:
        if not 0 <= live_session_ttl_hours <= 8_760:
            raise ValueError("live_session_ttl_hours_out_of_range")
        self.store = store
        self.providers = providers
        self.sandbox = sandbox
        self.production = production
        self.live_session_ttl_hours = live_session_ttl_hours
        self.strategy_store = strategy_store
        self.run_store = run_store
        self.execution_guard: Callable[[], bool] | None = None
        self._validated_strategy_key: tuple[str, str, str] | None = None
        self._validated_strategy_production_drawdown: float | None = None

    def reload_runtime(
        self,
        providers: AiReviewProviderRegistry,
        sandbox: Stage6SandboxExecutionService | None,
        production: Stage10ProductionExecutionService | None,
        *,
        live_session_ttl_hours: int,
    ) -> None:
        if not 0 <= live_session_ttl_hours <= 8_760:
            raise ValueError("live_session_ttl_hours_out_of_range")
        with _LOCK:
            self.providers = providers
            self.sandbox = sandbox
            self.production = production
            self.live_session_ttl_hours = live_session_ttl_hours

    def snapshot(self) -> dict[str, Any]:
        state = self._load()
        return self._payload(state)

    def preflight_strategy_binding(self, run_id: str) -> dict[str, Any]:
        if not isinstance(run_id, str) or not run_id.strip():
            raise ValueError("strategy_binding_audit_run_required")
        run_id = run_id.strip()
        with _LOCK:
            if self.strategy_store is None or self.run_store is None:
                raise ValueError("strategy_binding_store_unavailable")
            requested_audit = self.run_store.get(run_id)
            if requested_audit is None:
                raise ValueError("strategy_binding_audit_run_not_found")
            state = self._load()
            already_bound = (
                state.get("activeStrategyRevision") == requested_audit.strategy_revision
                and state.get("activeStrategyAuditRunId") == run_id
            )
            record = self.strategy_store.get(requested_audit.strategy_revision)
            if record is None:
                raise ValueError("strategy_binding_strategy_not_found")
            if not already_bound and record.audit_run_id != run_id:
                raise ValueError("strategy_binding_audit_run_mismatch")
            if already_bound:
                active_audit_hash = str(
                    state.get("activeStrategyAuditHash") or ""
                ).strip()
                if not active_audit_hash:
                    raise ValueError("strategy_binding_audit_identity_missing")
                record, strategy, audit = self._load_audited_strategy(
                    requested_audit.strategy_revision,
                    expected_audit_run_id=run_id,
                    expected_audit_hash=active_audit_hash,
                )
            else:
                record, strategy, audit = self._load_audited_strategy(
                    requested_audit.strategy_revision
                )
            blocker = None if already_bound else _strategy_switch_blocker(state)
            assumptions = audit.backtest_assumptions
            production_drawdown = self._validated_strategy_production_drawdown
            if not isinstance(assumptions, dict) or production_drawdown is None:
                raise ValueError("strategy_binding_backtest_assumptions_invalid")
            return {
                "runId": audit.run_id,
                "strategyId": record.strategy_id,
                "strategyRevision": record.revision,
                "strategyName": record.name,
                "market": strategy.market,
                "symbol": strategy.symbols[0],
                "timeframe": strategy.timeframe,
                "status": (
                    "active"
                    if already_bound
                    else "ready"
                    if blocker is None
                    else "review"
                ),
                "evidenceStatus": "eligible",
                "switchAllowed": already_bound or blocker is None,
                "switchBlockedReason": blocker,
                "alreadyBound": already_bound,
                "auditHash": _strategy_audit_hash(audit),
                "dataSnapshotHash": str(
                    audit.data_snapshot.get("snapshotHash")
                    or audit.data_snapshot.get("hash")
                    or ""
                ),
                "productionReplay": {
                    "feeBps": max(float(assumptions["feeBps"]), FEE_RATE * 10_000),
                    "slippageBps": max(
                        float(assumptions["slippageBps"]),
                        PRODUCTION_REPLAY_SLIPPAGE_RATE * 10_000,
                    ),
                    "auditedMaxDrawdownPct": float(
                        audit.metrics["max_drawdown_pct"]
                    ),
                    "productionMaxDrawdownPct": production_drawdown,
                    "strategyMaxDrawdownPct": float(
                        strategy.risk.max_drawdown_pct or 0
                    ) * 100,
                },
                "boundary": {
                    "authorizesLive": False,
                    "startsMonitoring": False,
                    "evaluatesNow": False,
                    "submitsOrder": False,
                },
            }

    def required_bar_count(self) -> int:
        state = self._load()
        try:
            strategy = self._active_strategy(state)
        except ValueError:
            try:
                strategy = self._frozen_active_strategy(state)
            except ValueError:
                return 6
        return max(6, strategy_required_bars(strategy)) if strategy else 6

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
                state["lastRunnerError"] = (str(error).strip() or "runner_failed")[:240]
            state["updatedAt"] = now
            self._save(state)
            return self._payload(state)

    def configure(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        with _LOCK:
            state = self._load()
            next_state = dict(state)
            strategy_binding_event = (
                self._prepare_strategy_binding(state, next_state, payload)
                if "strategyRevision" in payload
                else None
            )
            if "strategyRevision" in payload and strategy_binding_event is None:
                return self._payload(state)
            for key, minimum, maximum in (
                ("triggerPct", 0.05, 20.0),
                ("orderNotional", 1.0, 10.0),
                ("stopLossPct", 0.1, 20.0),
                ("takeProfitPct", 0.1, 50.0),
                ("dailyLossLimitPct", 0.1, 20.0),
                ("dailyProfitDrawdownLimitPct", 0.1, 20.0),
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
            continuing_live_session = bool(
                state["executionMode"] == "live"
                and state["enabled"] is True
                and state.get("liveConfirmed") is True
                and _live_session_authorized(state)
                and next_state["executionMode"] == "live"
                and next_state["enabled"] is True
                and next_state["liveOperator"] == state.get("liveOperator")
            )
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
                if not next_state["liveOperator"]:
                    raise ValueError("live_operator_required")
                if not continuing_live_session:
                    if payload.get("liveConfirmed") is not True:
                        raise ValueError("live_confirmation_required")
                    if self.production is None:
                        raise ValueError("live_route_unavailable")
                    control = self.production.authorize_auto_session()
                    next_state["liveConfirmed"] = True
                    next_state["liveControlId"] = control["controlId"]
                    next_state["liveIpRestricted"] = (
                        control["autoRouteSafety"]["ipRestricted"] is True
                    )
                    next_state["liveSessionTtlHours"] = self.live_session_ttl_hours
                    next_state["liveAuthorizedUntil"] = (
                        (_now() + timedelta(hours=self.live_session_ttl_hours)).isoformat()
                        if self.live_session_ttl_hours
                        else None
                    )
            else:
                next_state["liveConfirmed"] = False
                next_state["liveControlId"] = None
                next_state["liveIpRestricted"] = False
                next_state["liveAuthorizedUntil"] = None
            next_state["updatedAt"] = _now().isoformat()
            result = self._payload(next_state)
            live = bool(result["liveTradingAllowed"])
            control_event = _event(
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
                    **_strategy_evidence(next_state),
                },
            )
            self._save(
                next_state,
                related_events=[
                    *([strategy_binding_event] if strategy_binding_event is not None else []),
                    control_event,
                ],
            )
            return result

    def _prepare_strategy_binding(
        self,
        state: dict[str, Any],
        next_state: dict[str, Any],
        payload: Mapping[str, Any],
    ) -> dict[str, Any] | None:
        allowed = {"strategyRevision", "auditRunId", "operator", "confirmed"}
        if set(payload) - allowed:
            raise ValueError("strategy_binding_request_must_be_separate")
        raw_revision = payload.get("strategyRevision")
        if raw_revision is not None and not isinstance(raw_revision, str):
            raise ValueError("strategy_revision_invalid")
        revision = str(raw_revision or "").strip()
        current_revision = str(state.get("activeStrategyRevision") or "")
        raw_audit_run_id = payload.get("auditRunId")
        if raw_audit_run_id is not None and not isinstance(raw_audit_run_id, str):
            raise ValueError("strategy_binding_audit_run_mismatch")
        requested_audit_run_id = str(raw_audit_run_id or "").strip()
        current_audit_run_id = str(state.get("activeStrategyAuditRunId") or "")
        if not revision and requested_audit_run_id:
            raise ValueError("strategy_binding_audit_run_mismatch")
        if payload.get("confirmed") is not True:
            raise ValueError("strategy_binding_confirmation_required")
        raw_operator = payload.get("operator")
        if not isinstance(raw_operator, str):
            raise ValueError("strategy_binding_operator_required")
        operator = raw_operator.strip()
        if not operator or len(operator) > 80:
            raise ValueError("strategy_binding_operator_required")
        if revision == current_revision and requested_audit_run_id == current_audit_run_id:
            return None
        blocker = _strategy_switch_blocker(state)
        if blocker:
            raise ValueError(blocker)

        binding_id = f"strategy-binding-{uuid4().hex[:12]}"
        if revision:
            record, strategy, audit = self._load_audited_strategy(revision)
            if requested_audit_run_id != record.audit_run_id:
                raise ValueError("strategy_binding_audit_run_mismatch")
            audit_hash = _strategy_audit_hash(audit)
            strategy_snapshot = strategy_config_to_payload(strategy)
            next_state.update(
                {
                    "activeStrategyBindingId": binding_id,
                    "activeStrategyRevision": record.revision,
                    "activeStrategyName": record.name,
                    "activeStrategyAuditRunId": record.audit_run_id,
                    "activeStrategyAuditHash": audit_hash,
                    "activeStrategyConfig": strategy_snapshot,
                    "activeStrategyConfigHash": canonical_sha256(strategy_snapshot),
                    "activeStrategyOperator": operator,
                }
            )
            detail = f"已将审计策略 {record.name} 交接给自动交易；自动交易保持暂停。"
            metadata = {
                "bindingId": binding_id,
                "operator": operator,
                "strategyId": record.strategy_id,
                "strategyRevision": record.revision,
                "strategyName": record.name,
                "auditRunId": record.audit_run_id,
                "auditHash": audit_hash,
                "market": strategy.market,
                "symbol": strategy.symbols[0],
                "timeframe": strategy.timeframe,
                "dataSnapshotHash": str(
                    audit.data_snapshot.get("snapshotHash")
                    or audit.data_snapshot.get("hash")
                    or ""
                ),
                "paperOnly": False,
                "liveTradingAllowed": False,
                "orderSubmissionEnabled": False,
                "routeExecuted": False,
                "liveBlockedBoundary": True,
            }
            run_id = None
        else:
            next_state.update(
                {
                    "activeStrategyBindingId": None,
                    "activeStrategyRevision": None,
                    "activeStrategyName": None,
                    "activeStrategyAuditRunId": None,
                    "activeStrategyAuditHash": None,
                    "activeStrategyConfig": None,
                    "activeStrategyConfigHash": None,
                    "activeStrategyOperator": operator,
                }
            )
            detail = "已恢复内置涨跌幅与 AI 自动策略；自动交易保持暂停。"
            metadata = {
                "bindingId": binding_id,
                "operator": operator,
                "strategyId": AUTO_STRATEGY_ID,
                "strategyRevision": _strategy_revision(next_state),
                "strategyName": "内置涨跌幅与 AI 自动策略",
                "auditRunId": None,
                "market": next_state["market"],
                "symbol": next_state["symbol"],
                "timeframe": next_state["timeframe"],
                "paperOnly": False,
                "liveTradingAllowed": False,
                "orderSubmissionEnabled": False,
                "routeExecuted": False,
                "liveBlockedBoundary": True,
            }
            run_id = None
        _reset_strategy_decision_context(next_state)
        next_state["status"] = "paused"
        next_state["detail"] = detail
        return _event(
            event_id=binding_id,
            event_type="auto_trading_strategy_binding",
            summary="自动交易生产策略已更新",
            detail=detail,
            metadata=metadata,
            run_id=run_id,
        )

    def _load_audited_strategy(
        self,
        revision: str,
        *,
        expected_audit_run_id: str | None = None,
        expected_audit_hash: str | None = None,
    ) -> tuple[StrategyLibraryRecord, StrategyConfig, Any]:
        if self.strategy_store is None or self.run_store is None:
            raise ValueError("strategy_binding_store_unavailable")
        record = self.strategy_store.get(revision)
        if record is None:
            raise ValueError("strategy_binding_strategy_not_found")
        if record.status != "audited" or not record.audit_run_id:
            raise ValueError("strategy_binding_audit_required")
        strategy = strategy_config_from_payload(record.strategy_config)
        if strategy.revision != record.revision:
            raise ValueError("strategy_binding_revision_mismatch")
        if (
            record.market != strategy.market
            or record.symbol != strategy.symbols[0]
            or record.timeframe != strategy.timeframe
        ):
            raise ValueError("strategy_binding_context_mismatch")
        if (
            strategy.market != "crypto"
            or strategy.symbols != ["BTC/USDT"]
            or strategy.timeframe != "1m"
        ):
            raise ValueError("strategy_binding_context_unsupported")
        risk = strategy.risk
        if (
            not 0 < risk.position_pct <= 1
            or risk.stop_loss_pct is None
            or not 0 < risk.stop_loss_pct <= 1
            or risk.take_profit_pct is None
            or not 0 < risk.take_profit_pct <= 5
            or risk.max_drawdown_pct is None
            or not 0 < risk.max_drawdown_pct <= 1
        ):
            raise ValueError("strategy_binding_risk_invalid")

        audit_run_id = expected_audit_run_id or record.audit_run_id
        audit = self.run_store.get(audit_run_id)
        if audit is None:
            raise ValueError(
                "strategy_binding_audit_run_changed"
                if expected_audit_run_id
                else "strategy_binding_audit_run_not_found"
            )
        audit_hash = _strategy_audit_hash(audit)
        if expected_audit_run_id and audit.run_id != expected_audit_run_id:
            raise ValueError("strategy_binding_audit_run_changed")
        if expected_audit_hash and audit_hash != expected_audit_hash:
            raise ValueError("strategy_binding_audit_evidence_changed")
        if (
            audit.market != record.market
            or audit.symbol != record.symbol
            or audit.timeframe != record.timeframe
            or audit.strategy_revision != record.revision
        ):
            raise ValueError("strategy_binding_audit_context_mismatch")
        if audit.execution_mode != "paper_only":
            raise ValueError("strategy_binding_audit_execution_mode_invalid")
        if not isinstance(audit.strategy_config, dict):
            raise ValueError("strategy_binding_audit_strategy_missing")
        audit_strategy = strategy_config_from_payload(audit.strategy_config)
        if audit_strategy.revision != record.revision:
            raise ValueError("strategy_binding_audit_revision_mismatch")
        if canonical_sha256(
            strategy_config_to_payload(audit_strategy)
        ) != canonical_sha256(strategy_config_to_payload(strategy)):
            raise ValueError("strategy_binding_audit_strategy_mismatch")
        if (
            audit_strategy.market != audit.market
            or audit_strategy.symbols != [audit.symbol]
            or audit_strategy.timeframe != audit.timeframe
        ):
            raise ValueError("strategy_binding_audit_context_mismatch")
        if (
            audit.data_quality.get("isComplete") is not True
            or audit.data_snapshot.get("isComplete") is not True
            or audit.data_rows < strategy_required_bars(strategy)
        ):
            raise ValueError("strategy_binding_audit_data_incomplete")
        snapshot_bars = audit.data_snapshot.get("bars")
        if not isinstance(snapshot_bars, list) or len(snapshot_bars) != audit.data_rows:
            raise ValueError("strategy_binding_audit_data_incomplete")
        normalized_bars = normalize_snapshot_bars(snapshot_bars)
        data_hash = canonical_data_hash(normalized_bars)
        snapshot_hash = canonical_snapshot_id(
            market=audit.market,
            symbol=audit.symbol,
            timeframe=audit.timeframe,
            canonical_data_hash=data_hash,
        )
        if (
            audit.data_snapshot.get("hash") != data_hash
            or audit.data_snapshot.get("snapshotHash") != snapshot_hash
            or audit.data_quality.get("canonicalHash") != data_hash
        ):
            raise ValueError("strategy_binding_audit_snapshot_mismatch")
        validation_key = (record.revision, audit.run_id, audit_hash)
        if (
            validation_key == self._validated_strategy_key
            and self._validated_strategy_production_drawdown is not None
        ):
            production_drawdown = self._validated_strategy_production_drawdown
        else:
            production_replay = _validate_strategy_backtest_evidence(
                audit,
                strategy,
                normalized_bars,
            )
            production_drawdown = production_replay.metrics.max_drawdown_pct
            self._validated_strategy_key = validation_key
            self._validated_strategy_production_drawdown = production_drawdown
        observed_drawdown_value = audit.metrics.get("max_drawdown_pct")
        if (
            isinstance(observed_drawdown_value, bool)
            or not isinstance(observed_drawdown_value, (int, float))
            or not math.isfinite(float(observed_drawdown_value))
            or float(observed_drawdown_value) < 0
        ):
            raise ValueError("strategy_binding_audit_metrics_invalid")
        observed_drawdown = float(observed_drawdown_value)
        if (
            observed_drawdown > risk.max_drawdown_pct * 100
            or production_drawdown > risk.max_drawdown_pct * 100
        ):
            raise ValueError("strategy_binding_drawdown_limit_exceeded")
        return record, strategy, audit

    def _active_strategy(self, state: Mapping[str, Any]) -> StrategyConfig | None:
        revision = str(state.get("activeStrategyRevision") or "").strip()
        if not revision:
            return None
        audit_run_id = str(state.get("activeStrategyAuditRunId") or "").strip()
        audit_hash = str(state.get("activeStrategyAuditHash") or "").strip()
        if not audit_run_id or not audit_hash:
            raise ValueError("strategy_binding_audit_identity_missing")
        _record, strategy, _audit = self._load_audited_strategy(
            revision,
            expected_audit_run_id=audit_run_id,
            expected_audit_hash=audit_hash,
        )
        return strategy

    def _frozen_active_strategy(
        self,
        state: Mapping[str, Any],
    ) -> StrategyConfig | None:
        revision = str(state.get("activeStrategyRevision") or "").strip()
        if not revision:
            return None
        snapshot = state.get("activeStrategyConfig")
        snapshot_hash = str(state.get("activeStrategyConfigHash") or "").strip()
        if not isinstance(snapshot, dict) or not snapshot_hash:
            raise ValueError("strategy_binding_snapshot_missing")
        if canonical_sha256(snapshot) != snapshot_hash:
            raise ValueError("strategy_binding_snapshot_changed")
        strategy = strategy_config_from_payload(snapshot)
        if strategy.revision != revision:
            raise ValueError("strategy_binding_snapshot_revision_mismatch")
        if (
            strategy.market != state["market"]
            or strategy.symbols != [state["symbol"]]
            or strategy.timeframe != state["timeframe"]
        ):
            raise ValueError("strategy_binding_snapshot_context_mismatch")
        return strategy

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
                    or not _live_session_authorized(state)
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
            observed_bar_timestamp = (
                max(bars, key=lambda bar: bar.timestamp).timestamp.isoformat()
                if bars
                else None
            )
            mismatch = self._verify_account_coverage(
                state,
                observed_bar_timestamp=observed_bar_timestamp,
            )
            if mismatch is not None:
                return mismatch
            strategy_binding_error: str | None = None
            try:
                active_strategy = self._active_strategy(state)
            except ValueError as error:
                strategy_binding_error = str(error)
                if float(state["position"]) <= 1e-12:
                    return self._finish(
                        state,
                        status="risk_paused",
                        detail=_strategy_binding_error_detail(strategy_binding_error),
                    )
                try:
                    active_strategy = self._frozen_active_strategy(state)
                except ValueError as snapshot_error:
                    return self._finish(
                        state,
                        status="risk_paused",
                        detail=_strategy_binding_error_detail(str(snapshot_error)),
                    )
            required_bars = (
                max(6, strategy_required_bars(active_strategy))
                if active_strategy
                else 6
            )
            if len(bars) < required_bars:
                return self._finish(
                    state,
                    status="data_blocked",
                    detail=f"完整 K 线不足 {required_bars} 根，已跳过本轮决策。",
                )

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
            equity = (
                float(state["accountEquity"])
                if state["executionMode"] in {"testnet", "live"}
                and state.get("accountAuthority") == "binance_spot"
                else cash + position * price
            )
            if state["dailyDate"] != now.date().isoformat():
                state["dailyDate"] = now.date().isoformat()
                state["dailyStartEquity"] = equity
                state["dailyPeakEquity"] = equity
                state["dailyReleasedDustNotional"] = 0.0
                state["dailyRiskHaltReason"] = None
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
            released_dust = (
                0.0
                if state.get("accountAuthority") == "binance_spot"
                else float(state["dailyReleasedDustNotional"])
            )
            daily_start = max(
                float(state["dailyStartEquity"])
                - released_dust,
                0.00000001,
            )
            state["dailyPeakEquity"] = max(
                float(state["dailyPeakEquity"]),
                equity + released_dust,
            )
            effective_loss_limit_pct = min(
                float(state["dailyLossLimitPct"]),
                (
                    float(active_strategy.risk.max_drawdown_pct) * 100
                    if active_strategy
                    and active_strategy.risk.max_drawdown_pct is not None
                    else float(state["dailyLossLimitPct"])
                ),
            )
            effective_profit_drawdown_limit_pct = min(
                float(state["dailyProfitDrawdownLimitPct"]),
                (
                    float(active_strategy.risk.max_drawdown_pct) * 100
                    if active_strategy
                    and active_strategy.risk.max_drawdown_pct is not None
                    else float(state["dailyProfitDrawdownLimitPct"])
                ),
            )
            daily_peak = max(
                float(state["dailyPeakEquity"]) - released_dust,
                daily_start,
            )
            loss_drawdown_pct = max(0.0, (daily_start - equity) / daily_start * 100)
            profit_drawdown_pct = (
                max(0.0, (daily_peak - equity) / daily_peak * 100)
                if daily_peak > daily_start
                else 0.0
            )
            state["dailyLossDrawdownPct"] = round(loss_drawdown_pct, 4)
            state["dailyProfitDrawdownPct"] = round(profit_drawdown_pct, 4)
            if not state.get("dailyRiskHaltReason"):
                if loss_drawdown_pct >= effective_loss_limit_pct:
                    state["dailyRiskHaltReason"] = "已达到当日亏损回撤上限。"
                elif profit_drawdown_pct >= effective_profit_drawdown_limit_pct:
                    state["dailyRiskHaltReason"] = "已达到当日盈利回撤上限。"

            action = "hold"
            confidence = 1.0
            reason = "涨跌幅尚未达到 AI 评估触发线。"
            provider_id = "rules"
            proposal_metadata: Mapping[str, Any] | None = None
            try:
                if active_strategy is not None:
                    closes = [float(bar.close) for bar in ordered]
                    volumes = [float(bar.volume) for bar in ordered]
                    index = len(ordered) - 1
                    effective_stop_loss_pct = min(
                        float(state["stopLossPct"]),
                        float(active_strategy.risk.stop_loss_pct) * 100,
                    )
                    effective_take_profit_pct = min(
                        float(state["takeProfitPct"]),
                        float(active_strategy.risk.take_profit_pct) * 100,
                    )
                    if position > 0 and avg_cost > 0:
                        position_return = _pct_change(avg_cost, price)
                        if position_return <= -effective_stop_loss_pct:
                            action, reason, provider_id = "sell", "触发生产策略止损。", "risk"
                        elif position_return >= effective_take_profit_pct:
                            action, reason, provider_id = "sell", "触发生产策略止盈。", "risk"
                        elif strategy_conditions_met(
                            active_strategy.exit_conditions,
                            closes,
                            volumes,
                            index,
                        ):
                            action, reason = "sell", "生产策略退出条件已满足。"
                    elif strategy_binding_error is None and strategy_conditions_met(
                        active_strategy.entry_conditions,
                        closes,
                        volumes,
                        index,
                    ):
                        action, reason = "buy", "生产策略入场条件已满足。"
                    else:
                        reason = (
                            "生产策略审计证据失效；已禁止开新仓，现有持仓仅按固定策略快照退出。"
                            if strategy_binding_error
                            else "生产策略条件尚未满足。"
                        )
                elif position > 0 and avg_cost > 0:
                    position_return = _pct_change(avg_cost, price)
                    if position_return <= -float(state["stopLossPct"]):
                        action, reason, provider_id = "sell", "触发止损。", "risk"
                    elif position_return >= float(state["takeProfitPct"]):
                        action, reason, provider_id = "sell", "触发止盈。", "risk"
                    elif abs(window_change) >= float(state["triggerPct"]):
                        (
                            action,
                            confidence,
                            reason,
                            provider_id,
                            proposal_metadata,
                        ) = self._ai_decision(state, one_bar_change, window_change)
                elif abs(window_change) >= float(state["triggerPct"]):
                    (
                        action,
                        confidence,
                        reason,
                        provider_id,
                        proposal_metadata,
                    ) = self._ai_decision(state, one_bar_change, window_change)
            except ValueError as error:
                return self._finish(state, status="ai_error", detail=str(error))

            proposal_action = action
            proposal_reason = reason
            effective_order_notional = float(state["orderNotional"])
            if active_strategy is not None and action == "buy":
                remaining_strategy_notional = max(
                    0.0,
                    equity * float(active_strategy.risk.position_pct)
                    - position * price,
                )
                effective_order_notional = min(
                    effective_order_notional,
                    remaining_strategy_notional,
                )
                if effective_order_notional <= 0:
                    proposal_action = "hold"
                    proposal_reason = "已达到生产策略仓位上限。"
            decision_contract = build_decision_contract(
                bars=ordered[-required_bars:],
                market=str(state["market"]),
                symbol=str(state["symbol"]),
                timeframe=str(state["timeframe"]),
                data_source=data_source,
                strategy_id=_strategy_id(state),
                strategy_revision=_strategy_revision(state),
                proposal_action=proposal_action,
                proposal_confidence=confidence,
                proposal_reason=proposal_reason,
                provider_id=provider_id,
                current_quantity=position,
                reference_price=price,
                available_cash=(
                    float(state.get("availableCash") or 0)
                    if state["executionMode"] in {"testnet", "live"}
                    and state.get("accountAuthority") == "binance_spot"
                    else cash
                ),
                order_notional=effective_order_notional,
                fee_rate=FEE_RATE,
                daily_drawdown_pct=loss_drawdown_pct,
                daily_loss_limit_pct=effective_loss_limit_pct,
                recent_trade_count=len(recent_trades),
                max_trades_per_hour=int(state["maxTradesPerHour"]),
                generated_at=now,
                profit_drawdown_pct=profit_drawdown_pct,
                profit_drawdown_limit_pct=effective_profit_drawdown_limit_pct,
                account_check=(
                    state.get("lastAccountCheck")
                    if state["executionMode"] in {"testnet", "live"}
                    else None
                ),
                proposal_metadata=proposal_metadata,
            )
            signal = decision_contract["signal"]
            action = str(signal["action"])
            confidence = float(signal["confidence"])
            reason = str(signal["reason"])
            state["lastDecision"] = {
                "action": action,
                "confidence": confidence,
                "reason": reason,
                "providerId": provider_id,
                "evaluatedAt": now.isoformat(),
            }
            state["lastDecisionContract"] = decision_contract
            portfolio_target = decision_contract["portfolioTarget"]
            increases_risk = float(portfolio_target["targetQuantity"]) > position + 1e-12
            risk_reason = (
                str(state["dailyRiskHaltReason"])
                if increases_risk and state.get("dailyRiskHaltReason")
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
            if (
                state["executionMode"] in {"testnet", "live"}
                and isinstance(order_intent, dict)
            ):
                try:
                    execution_preparation = self._prepare_order_intent(
                        state,
                        order_intent,
                    )
                    order_intent = build_order_intent(
                        market_snapshot_hash=decision_contract["marketSnapshot"]["snapshotHash"],
                        strategy_revision=decision_contract["strategyRevision"],
                        proposal_id=decision_contract["decisionProposal"]["proposalId"],
                        signal_id=decision_contract["signal"]["signalId"],
                        portfolio_target=decision_contract["portfolioTarget"],
                        risk_adjusted_target=adjusted_target,
                        account_check=decision_contract["accountCheck"],
                        fee_rate=FEE_RATE,
                        execution_preparation=execution_preparation,
                    )
                    decision_contract["orderIntent"] = order_intent
                except (LookupError, RuntimeError, ValueError) as error:
                    decision_contract["orderIntent"] = None
                    if self._release_untradeable_dust(
                        state,
                        order_intent,
                        adjusted_target,
                        error,
                    ):
                        return self._finish(
                            state,
                            status="monitoring",
                            detail=(
                                "剩余仓位低于交易所最小交易金额，已从策略账本释放为账户尘埃资产，"
                                "不会重复提交卖出委托。"
                            ),
                        )
                    return self._finish(
                        state,
                        status="order_rejected",
                        detail=str(error)[:240],
                    )
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
                if not _settle_sell_fill(
                    state,
                    quantity=quantity,
                    notional=notional,
                    cash_fee=cash_fee,
                    base_fee=base_fee,
                ):
                    if routed:
                        routed["state"] = "reconciliation_required"
                        routed["error"] = "auto_trading_sell_fee_exceeds_strategy_position"
                        self._remember_routed_order(state, routed)
                    return self._finish(
                        state,
                        status="order_pending" if routed else "evaluation_error",
                        detail="成交扣费超过策略持仓，已停止新委托并等待对账。",
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
                            **_order_result_fee_evidence(
                                None,
                                symbol=str(state["symbol"]),
                                price=float(trade["price"]),
                                notional=float(trade["notional"]),
                            ),
                        },
                    )
                self._record_trade(state, trade, recent_trades, now)
            return self._finish(
                state,
                status=(
                    "traded"
                    if trade
                    else "risk_paused"
                    if state.get("dailyRiskHaltReason") or strategy_binding_error
                    else "monitoring"
                ),
                detail=str(state.get("dailyRiskHaltReason") or reason),
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
            self._require_execution_guard()
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
        if side == "buy" and quantity <= base_fee:
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
        elif not _settle_sell_fill(
            state,
            quantity=quantity,
            notional=notional,
            cash_fee=cash_fee,
            base_fee=base_fee,
        ):
            return None
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
        self._require_execution_guard()
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
                **_strategy_evidence(state),
            },
        ))
        created_at = str(stored.metadata.get("createdAt") or now.isoformat())
        trade["createdAt"] = created_at
        state["tradeCount"] = int(state["tradeCount"]) + 1
        state["exchangeFeeTotal"] = round(
            float(state.get("exchangeFeeTotal") or 0)
            + float(trade["fee"]),
            8,
        )
        state["estimatedFeeCount"] = (
            int(state.get("estimatedFeeCount") or 0)
            + int(trade.get("feeEstimated") is True)
        )
        state["feeEvidenceComplete"] = state.get("feeEvidenceComplete") is True
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
        self._require_execution_guard()
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
                **_strategy_evidence(state),
            },
        ))
        stored_runtime = {
            "executionMode": intent.metadata.get("executionMode"),
            "order": intent.metadata.get("order"),
            "orderIntent": intent.metadata.get("orderIntent"),
            "tradeIntent": intent.metadata.get("tradeIntent"),
        }
        candidate_runtime = {
            "executionMode": mode,
            "order": order,
            "orderIntent": order_intent,
            "tradeIntent": trade_intent,
        }
        if (
            intent.event_type != f"auto_{mode}_order_intent"
            or intent.run_id is not None
            or intent.stage != "auto-paper-trading"
            or intent.source != "auto-paper-trading"
            or canonical_sha256(stored_runtime) != canonical_sha256(candidate_runtime)
        ):
            raise ValueError("auto_trading_order_intent_identity_conflict")
        state[
            "lastLiveOrderIntentId"
            if mode == "live"
            else "lastTestnetOrderIntentId"
        ] = intent.event_id
        try:
            self._require_execution_guard()
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

    def _prepare_order_intent(
        self,
        state: dict[str, Any],
        order_intent: dict[str, Any],
    ) -> dict[str, Any]:
        mode = str(state["executionMode"])
        order = {
            "symbol": order_intent["symbol"],
            "side": order_intent["side"],
            "quantity": order_intent["quantity"],
            "referencePrice": order_intent["referencePrice"],
            "notionalValue": order_intent["notionalValue"],
        }
        if mode == "testnet":
            if self.sandbox is None or state.get("testnetConfirmed") is not True:
                raise ValueError("testnet_route_not_authorized")
            return self.sandbox.prepare_auto_market_order(order)
        if mode == "live":
            if self.production is None or state.get("liveConfirmed") is not True:
                raise ValueError("live_route_not_authorized")
            order["riskBudgetNotional"] = (
                float(order["notionalValue"])
                if order["side"] == "buy"
                else float(order["quantity"]) * float(state.get("avgCost") or 0)
            )
            return self.production.prepare_auto_market_order(
                order,
                control_id=str(state.get("liveControlId") or ""),
                operator=str(state.get("liveOperator") or ""),
            )
        raise ValueError("execution_mode_invalid")

    def _verify_account_coverage(
        self,
        state: dict[str, Any],
        *,
        observed_bar_timestamp: str | None = None,
    ) -> dict[str, Any] | None:
        mode = str(state["executionMode"])
        if mode == "paper":
            return None
        authoritative_account = state.get("accountAuthority") == "binance_spot"
        expected_position = (
            0.0
            if authoritative_account
            else float(state["position"])
        )
        required_quote = (
            0.0
            if expected_position > 0 or authoritative_account
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
            account_snapshot = coverage.get("accountSnapshot")
            if authoritative_account and not isinstance(account_snapshot, Mapping):
                raise ValueError("binance_spot_account_snapshot_required")
            if isinstance(account_snapshot, Mapping):
                state["lastAccountCheck"]["accountSnapshotHash"] = str(
                    account_snapshot["snapshotHash"]
                )
                if account_snapshot.get("valuationComplete") is True:
                    synchronized = self._synchronize_account_snapshot(
                        state,
                        account_snapshot,
                    )
                    state["lastAccountCheck"].update({
                        "accountCovered": not state["lastAccountCheck"].get(
                            "unexpectedOpenOrderCount"
                        ),
                        "positionCovered": True,
                        "quoteCovered": True,
                    })
                    if synchronized:
                        state["lastBarTimestamp"] = observed_bar_timestamp
                        return self._finish(
                            state,
                            status="account_synchronized",
                            detail="已采用 Binance Spot 权威账户快照，等待下一根新 K 线。",
                        )
        except Exception as error:
            error_code = str(error)
            state["lastAccountCheck"] = {
                "accountCovered": False,
                "positionCovered": False,
                "quoteCovered": False,
                "unexpectedOpenAutoOrderCount": 0,
                "unexpectedOpenOrderCount": 0,
                "checkError": error.__class__.__name__,
                "checkCode": (
                    error_code
                    if error_code in {
                        "binance_spot_account_identity_changed",
                        "binance_spot_account_snapshot_invalid",
                        "binance_spot_account_snapshot_required",
                    }
                    else None
                ),
                "checkedAt": _now().isoformat(),
            }
        if state["lastAccountCheck"]["accountCovered"]:
            return None
        check = state["lastAccountCheck"]
        snapshot = check.get("accountSnapshot")
        if (
            check.get("unexpectedOpenOrderCount")
            or check.get("unexpectedOpenAutoOrderCount")
        ):
            detail = "检测到 Binance Spot 未决挂单，已暂停新决策。"
        elif (
            isinstance(snapshot, Mapping)
            and snapshot.get("valuationComplete") is False
        ):
            unpriced = "、".join(
                str(asset) for asset in snapshot.get("unpricedAssets", [])
            )
            detail = (
                f"Binance Spot 现货资产 {unpriced} 无法按 USDT 估值，"
                "已暂停新决策。"
            )
        elif check.get("checkCode") == "binance_spot_account_identity_changed":
            detail = "检测到 Binance Spot 账户身份变化，已暂停新决策。"
        else:
            detail = "Binance Spot 完整账户快照未通过安全检查，已暂停新决策。"
        return self._finish(state, status="account_mismatch", detail=detail)

    def _synchronize_account_snapshot(
        self,
        state: dict[str, Any],
        snapshot: Mapping[str, Any],
    ) -> bool:
        base_asset, quote_asset = str(state["symbol"]).split("/", 1)
        assets = snapshot.get("assets")
        snapshot_hash = snapshot.get("snapshotHash")
        account_fingerprint = snapshot.get("accountFingerprint")
        total_equity = snapshot.get("totalEquityUsdt")
        if (
            snapshot.get("valuationComplete") is not True
            or snapshot.get("quoteCurrency") != quote_asset
            or not isinstance(snapshot_hash, str)
            or not snapshot_hash
            or not isinstance(assets, Mapping)
            or isinstance(total_equity, bool)
            or not isinstance(total_equity, (int, float))
            or not math.isfinite(float(total_equity))
            or float(total_equity) < 0
            or (
                account_fingerprint is not None
                and (
                    not isinstance(account_fingerprint, str)
                    or not account_fingerprint
                )
            )
        ):
            raise ValueError("binance_spot_account_snapshot_invalid")
        previous_fingerprint = state.get("accountFingerprint")
        if (
            previous_fingerprint is not None
            and account_fingerprint != previous_fingerprint
        ):
            raise ValueError("binance_spot_account_identity_changed")
        validated_assets = {
            str(asset): _account_asset(value)
            for asset, value in assets.items()
            if isinstance(asset, str) and asset
        }
        if set(validated_assets) != set(assets):
            raise ValueError("binance_spot_account_snapshot_invalid")
        base = validated_assets.get(base_asset) or _empty_account_asset()
        quote = validated_assets.get(quote_asset) or _empty_account_asset(price=1.0)
        previous_unmanaged_base = max(
            0.0,
            float(state.get("unmanagedBaseQuantity") or 0),
        )
        next_unmanaged_base = min(previous_unmanaged_base, base["total"])
        managed_base_total = max(0.0, base["total"] - next_unmanaged_base)
        synchronized_at = _now().isoformat()
        previous_hash = state.get("accountSnapshotHash")
        if previous_hash == snapshot_hash:
            state["availableCash"] = round(quote["free"], 8)
            return False
        previous_assets = state.get("accountAssets")
        if previous_hash and not isinstance(previous_assets, Mapping):
            raise ValueError("binance_spot_account_snapshot_invalid")
        previous = (
            {
                str(asset): _account_asset(value)
                for asset, value in previous_assets.items()
                if isinstance(asset, str) and asset
            }
            if isinstance(previous_assets, Mapping)
            else {}
        )
        asset_deltas = []
        external_flow = 0.0
        for asset in sorted(set(previous) | set(validated_assets)):
            before = previous.get(asset, _empty_account_asset())
            after = validated_assets.get(asset, _empty_account_asset())
            expected_total = (
                float(state["position"]) + previous_unmanaged_base
                if asset == base_asset
                else float(state["cash"])
                if asset == quote_asset
                else before["total"]
            )
            delta = after["total"] - expected_total
            if math.isclose(delta, 0.0, rel_tol=0, abs_tol=1e-12):
                continue
            price = after["priceUsdt"] or before["priceUsdt"]
            value = delta * price
            external_flow += value
            asset_deltas.append({
                "asset": asset,
                "beforeTotal": round(expected_total, 12),
                "afterTotal": round(after["total"], 12),
                "delta": round(delta, 12),
                "priceUsdt": round(price, 8),
                "valueUsdt": round(value, 8),
            })
        first_snapshot = not previous_hash
        previous_position = float(state["position"])
        previous_average_cost = float(state["avgCost"])
        if managed_base_total <= 1e-12:
            next_average_cost = 0.0
        elif first_snapshot or previous_position <= 1e-12:
            next_average_cost = base["priceUsdt"]
        elif managed_base_total > previous_position:
            next_average_cost = (
                previous_position * previous_average_cost
                + (managed_base_total - previous_position) * base["priceUsdt"]
            ) / managed_base_total
        else:
            next_average_cost = previous_average_cost
        adjusted_start = (
            float(total_equity)
            if first_snapshot
            else max(
                0.00000001,
                float(state["dailyStartEquity"]) + external_flow,
            )
        )
        adjusted_peak = (
            float(total_equity)
            if first_snapshot
            else max(
                adjusted_start,
                float(state["dailyPeakEquity"]) + external_flow,
            )
        )
        state.update({
            "initialCash": round(
                float(total_equity)
                if first_snapshot
                else max(0.0, float(state["initialCash"]) + external_flow),
                8,
            ),
            "cash": round(quote["total"], 8),
            "availableCash": round(quote["free"], 8),
            "position": round(managed_base_total, 12),
            "unmanagedBaseQuantity": round(next_unmanaged_base, 12),
            "avgCost": round(next_average_cost, 8),
            "equity": round(float(total_equity), 8),
            "accountEquity": round(float(total_equity), 8),
            "dailyDate": _now().date().isoformat(),
            "dailyStartEquity": round(adjusted_start, 8),
            "dailyPeakEquity": round(adjusted_peak, 8),
            "dailyLossDrawdownPct": 0.0,
            "dailyProfitDrawdownPct": 0.0,
            "dailyRiskHaltReason": None,
            "accountAuthority": "binance_spot",
            "accountFingerprint": account_fingerprint or previous_fingerprint,
            "accountAssets": validated_assets,
            "accountSnapshotHash": snapshot_hash,
            "accountSynchronizedAt": synchronized_at,
            "lastExternalFlowUsdt": round(0.0 if first_snapshot else external_flow, 8),
            "externalFlowUsdt": round(
                0.0
                if first_snapshot
                else float(state.get("externalFlowUsdt") or 0) + external_flow,
                8,
            ),
        })
        if not first_snapshot and not asset_deltas:
            return False
        self._require_execution_guard()
        self.store.record_if_absent(_event(
            event_id=f"auto-{state['executionMode']}-account-sync-{snapshot_hash[:20]}",
            event_type=f"auto_{state['executionMode']}_account_sync",
            summary=(
                "Binance Spot 权威账户基线已建立"
                if first_snapshot
                else "Binance Spot 账户资产构成已同步"
            ),
            detail=(
                f"{state['symbol']} 自动交易已采用交易所现货账户快照。"
                if first_snapshot
                else f"{state['symbol']} 资产变化已作为外部资金流同步。"
            ),
            metadata={
                "kind": "baseline" if first_snapshot else "external_asset_change",
                "executionMode": state["executionMode"],
                "symbol": state["symbol"],
                "previousSnapshotHash": previous_hash,
                "snapshotHash": snapshot_hash,
                "accountFingerprint": account_fingerprint,
                "totalEquityUsdt": round(float(total_equity), 8),
                "externalFlowUsdt": round(
                    0.0 if first_snapshot else external_flow,
                    8,
                ),
                "assetDeltas": asset_deltas,
                "synchronizedAt": synchronized_at,
                "paperOnly": False,
                "sandboxOnly": state["executionMode"] == "testnet",
                "liveTradingAllowed": False,
                "orderSubmissionEnabled": False,
                "routeExecuted": False,
                "liveBlockedBoundary": True,
                **_strategy_evidence(state),
            },
        ))
        return True

    def _release_untradeable_dust(
        self,
        state: dict[str, Any],
        order_intent: Mapping[str, Any],
        adjusted_target: Mapping[str, Any],
        error: Exception,
    ) -> bool:
        reason = str(error)
        mode = str(state["executionMode"])
        quantity = float(state["position"])
        if (
            mode not in {"testnet", "live"}
            or order_intent.get("side") != "sell"
            or float(adjusted_target.get("approvedTargetQuantity") or 0) > 1e-12
            or quantity <= 0
            or reason not in {
                "stage6_sandbox_amount_below_minimum",
                "stage6_sandbox_cost_below_minimum",
            }
        ):
            return False
        reference_price = float(order_intent.get("referencePrice") or 0)
        released_at = _now().isoformat()
        disposition = {
            "executionMode": mode,
            "symbol": str(state["symbol"]),
            "quantity": quantity,
            "referencePrice": reference_price,
            "estimatedNotional": round(quantity * reference_price, 8),
            "reason": reason,
            "releasedAt": released_at,
            "orderSubmitted": False,
        }
        signal_id = str(
            (state.get("lastDecisionContract") or {}).get("signal", {}).get("signalId")
            or order_intent.get("signalId")
            or hashlib.sha256(
                f"{mode}:{state['symbol']}:{quantity}:{reference_price}".encode()
            ).hexdigest()
        )
        self._require_execution_guard()
        recorded, _ = self.store.record_if_absent(_event(
            event_id=f"auto-{mode}-dust-{signal_id}",
            event_type=f"auto_{mode}_dust_disposition",
            summary=(
                f"{'生产实盘' if mode == 'live' else '测试网'}自动交易尘埃仓位已释放"
            ),
            detail=(
                f"{state['symbol']} {quantity} 低于交易所最小交易金额，"
                "未提交委托。"
            ),
            metadata={
                **disposition,
                "paperOnly": False,
                "sandboxOnly": mode == "testnet",
                "liveTradingAllowed": False,
                "orderSubmissionEnabled": False,
                "routeExecuted": False,
                "liveBlockedBoundary": True,
                **_strategy_evidence(state),
            },
        ))
        state["lastDustDisposition"] = {
            key: recorded.metadata[key]
            for key in disposition
        }
        state["dailyReleasedDustNotional"] = round(
            float(state["dailyReleasedDustNotional"])
            + float(recorded.metadata["estimatedNotional"]),
            8,
        )
        state["position"] = 0.0
        if state.get("accountAuthority") == "binance_spot":
            state["unmanagedBaseQuantity"] = round(
                float(state.get("unmanagedBaseQuantity") or 0) + quantity,
                12,
            )
        state["avgCost"] = 0.0
        state["equity"] = round(
            float(state.get("accountEquity") or state["cash"]),
            8,
        )
        return True

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
            price = float(
                routed.get("averagePrice")
                or order_intent["referencePrice"]
            )
            notional = float(
                routed.get("filledNotional")
                or float(routed.get("filledQuantity") or 0) * price
            )
            state["lastOrderResult"] = build_order_result(
                order_intent,
                execution_mode=mode,
                evidence={
                    **routed,
                    **_order_result_fee_evidence(
                        routed,
                        symbol=str(order_intent["symbol"]),
                        price=price,
                        notional=notional,
                    ),
                },
            )

    def _ai_decision(
        self,
        state: dict[str, Any],
        one_bar_change: float,
        window_change: float,
    ) -> tuple[str, float, str, str, dict[str, Any]]:
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
        try:
            attempt = provider.assess(
                rendered_prompt=prompt,
                output_schema=_OUTPUT_SCHEMA,
                known_evidence_ids=frozenset(),
                response_validator=_validate_decision,
            )
        except ValueError:
            state["aiUsageEvidenceComplete"] = False
            raise
        if (
            attempt.provider_id != provider_id
            or not isinstance(attempt.model, str)
            or not attempt.model.strip()
        ):
            state["aiUsageEvidenceComplete"] = False
            raise ValueError("ai_trading_provider_identity_invalid")
        if (
            not isinstance(attempt.usage, Mapping)
            or any(
                key not in {"inputTokens", "outputTokens", "totalTokens"}
                or type(value) is not int
                or value < 0
                for key, value in attempt.usage.items()
            )
            or type(attempt.latency_ms) is not int
            or attempt.latency_ms < 0
        ):
            state["aiUsageEvidenceComplete"] = False
            raise ValueError("ai_trading_provider_metadata_invalid")
        usage = dict(attempt.usage)
        if set(usage) != {"inputTokens", "outputTokens", "totalTokens"}:
            state["aiUsageEvidenceComplete"] = False
        previous_usage = (
            state.get("aiUsage")
            if isinstance(state.get("aiUsage"), Mapping)
            else {}
        )
        input_tokens = int(usage.get("inputTokens") or 0)
        output_tokens = int(usage.get("outputTokens") or 0)
        total_tokens = int(
            usage.get("totalTokens")
            or input_tokens + output_tokens
        )
        state["aiUsage"] = {
            "callCount": int(previous_usage.get("callCount") or 0) + 1,
            "inputTokens": int(previous_usage.get("inputTokens") or 0) + input_tokens,
            "outputTokens": int(previous_usage.get("outputTokens") or 0) + output_tokens,
            "totalTokens": int(previous_usage.get("totalTokens") or 0) + total_tokens,
            "providerId": provider_id,
            "model": attempt.model,
            "latencyMs": attempt.latency_ms,
        }
        assessment = attempt.assessment
        return (
            str(assessment["action"]),
            float(assessment["confidence"]),
            str(assessment["reason"]),
            provider_id,
            {
                "model": attempt.model,
                "promptTemplateVersion": AUTO_DECISION_PROMPT_TEMPLATE_VERSION,
                "outputSchemaVersion": AUTO_DECISION_OUTPUT_SCHEMA_VERSION,
                "usage": usage,
                "latencyMs": attempt.latency_ms,
            },
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
        if isinstance(stored, dict) and "dailyPeakEquity" not in stored:
            state["dailyPeakEquity"] = float(state["dailyStartEquity"])
        if isinstance(stored, dict) and "aiUsage" not in stored:
            contract = state.get("lastDecisionContract")
            proposal = (
                contract.get("decisionProposal")
                if isinstance(contract, Mapping)
                else None
            )
            usage = proposal.get("usage") if isinstance(proposal, Mapping) else None
            if (
                isinstance(proposal, Mapping)
                and proposal.get("source") == "ai"
                and isinstance(usage, Mapping)
            ):
                input_tokens = int(usage.get("inputTokens") or 0)
                output_tokens = int(usage.get("outputTokens") or 0)
                state["aiUsage"] = {
                    "callCount": 1,
                    "inputTokens": input_tokens,
                    "outputTokens": output_tokens,
                    "totalTokens": int(
                        usage.get("totalTokens")
                        or input_tokens + output_tokens
                    ),
                    "providerId": proposal.get("providerId"),
                    "model": proposal.get("model"),
                    "latencyMs": int(proposal.get("latencyMs") or 0),
                }
        if isinstance(stored, dict) and "aiUsageEvidenceComplete" not in stored:
            state["aiUsageEvidenceComplete"] = False
        if (
            isinstance(stored, dict)
            and (
                "exchangeFeeTotal" not in stored
                or "estimatedFeeCount" not in stored
                or "feeEvidenceComplete" not in stored
            )
        ):
            (
                state["exchangeFeeTotal"],
                state["estimatedFeeCount"],
                state["feeEvidenceComplete"],
            ) = self._trade_fee_summary(state)
        mode = str(state["executionMode"])
        if mode in {"testnet", "live"}:
            state["dailyReleasedDustNotional"] = self._daily_released_dust_notional(state)
            intent_events = self.store.list_recent(
                event_type=f"auto_{mode}_order_intent",
                run_id_is_null=True,
                stage="auto-paper-trading",
                source="auto-paper-trading",
                limit=20,
            )
            intent = next(
                (
                    event
                    for event in intent_events
                    if _is_local_order_intent_event(event, mode, state)
                ),
                None,
            )
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

    def _daily_released_dust_notional(self, state: Mapping[str, Any]) -> float:
        mode = str(state["executionMode"])
        daily_date = str(state["dailyDate"])
        total = 0.0
        offset = 0
        while True:
            events = self.store.list_recent(
                event_type=f"auto_{mode}_dust_disposition",
                limit=50,
                offset=offset,
            )
            if not events:
                break
            reached_older_day = False
            for event in events:
                event_date = event.created_at.astimezone(timezone.utc).date().isoformat()
                if event_date < daily_date:
                    reached_older_day = True
                    break
                if (
                    event_date == daily_date
                    and event.metadata.get("executionMode") == mode
                    and event.metadata.get("symbol") == state["symbol"]
                ):
                    total += max(0.0, float(event.metadata.get("estimatedNotional") or 0))
            if reached_older_day or len(events) < 50:
                break
            offset += len(events)
        return round(total, 8)

    def _trade_fee_summary(
        self,
        state: Mapping[str, Any],
    ) -> tuple[float, int, bool]:
        remaining = max(0, int(state.get("tradeCount") or 0))
        if remaining == 0:
            return 0.0, 0, True
        event_type = {
            "live": "auto_live_trade",
            "testnet": "auto_testnet_trade",
        }.get(str(state["executionMode"]), "auto_paper_trade")
        total = 0.0
        estimated_count = 0
        complete = True
        offset = 0
        while remaining > 0:
            events = self.store.list_recent(
                event_type=event_type,
                limit=min(50, remaining),
                offset=offset,
            )
            if not events:
                complete = False
                break
            for event in events:
                metadata = event.metadata
                fee = metadata.get("fee")
                valid = (
                    metadata.get("executionMode") == state["executionMode"]
                    and metadata.get("symbol") == state["symbol"]
                    and isinstance(fee, (int, float))
                    and not isinstance(fee, bool)
                    and math.isfinite(float(fee))
                    and float(fee) >= 0
                )
                if not valid:
                    complete = False
                    continue
                total += float(fee)
                estimated_count += int(metadata.get("feeEstimated") is True)
            offset += len(events)
            remaining -= len(events)
            if len(events) < min(50, remaining + len(events)):
                complete = False
                break
        return round(total, 8), estimated_count, complete

    def _save(
        self,
        state: dict[str, Any],
        *,
        related_events: list[dict[str, Any]] | None = None,
    ) -> None:
        self._require_execution_guard()
        state_event = _event(
            event_id=CONTROL_EVENT_ID,
            event_type="auto_paper_trading_state",
            summary="AI 自动交易当前状态",
            detail=str(state.get("detail") or "等待监控。"),
            metadata={"state": state},
        )
        if related_events:
            self.store.record_many([state_event, *related_events])
        else:
            self.store.record(state_event)

    def _require_execution_guard(self) -> None:
        if self.execution_guard is not None and not self.execution_guard():
            raise RuntimeError("public_lease_lost")

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
            and _live_session_authorized(state)
            and live_status.get("enabled") is True
            and live_status.get(
                "controlRecordedActive",
                live_status["controlActive"],
            )
            and live_status["controlId"] == state.get("liveControlId")
        )
        state_payload = {**state, "runnerHealth": _runner_health(state)}
        return {
            "state": state_payload,
            "strategyBinding": self._strategy_binding_payload(state),
            "economics": self._economics_payload(state),
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

    def _economics_payload(self, state: Mapping[str, Any]) -> dict[str, Any]:
        trade_count = max(0, int(state.get("tradeCount") or 0))
        fee_evidence_complete = state.get("feeEvidenceComplete") is True
        trading_fees = (
            round(float(state.get("exchangeFeeTotal") or 0), 8)
            if fee_evidence_complete
            else None
        )
        position = float(state["position"])
        average_cost = float(state["avgCost"])
        last_price = state.get("lastPrice")
        unrealized_pnl = (
            0.0
            if position <= 0
            else round((float(last_price) - average_cost) * position, 8)
            if (
                isinstance(last_price, (int, float))
                and not isinstance(last_price, bool)
                and math.isfinite(float(last_price))
                and float(last_price) > 0
                and average_cost > 0
            )
            else None
        )
        realized_pnl = round(float(state["realizedPnl"]), 8)
        trading_pnl = (
            round(realized_pnl + unrealized_pnl, 8)
            if unrealized_pnl is not None
            else None
        )
        usage = state.get("aiUsage")
        ai_usage = (
            {
                "callCount": int(usage.get("callCount") or 0),
                "inputTokens": int(usage.get("inputTokens") or 0),
                "outputTokens": int(usage.get("outputTokens") or 0),
                "totalTokens": int(usage.get("totalTokens") or 0),
                "providerId": str(usage.get("providerId") or ""),
                "model": usage.get("model"),
                "latencyMs": int(usage.get("latencyMs") or 0),
            }
            if (
                isinstance(usage, Mapping)
                and int(usage.get("callCount") or 0) > 0
            )
            else None
        )
        return {
            "currency": "USDT",
            "executionMode": state["executionMode"],
            "tradeCount": trade_count,
            "tradingPnlBeforeAi": trading_pnl,
            "tradingFees": trading_fees,
            "tradingFeesEstimated": int(state.get("estimatedFeeCount") or 0) > 0,
            "estimatedFeeCount": int(state.get("estimatedFeeCount") or 0),
            "feeEvidenceComplete": fee_evidence_complete,
            "realizedPnl": realized_pnl,
            "unrealizedPnl": unrealized_pnl,
            "aiUsage": ai_usage,
            "aiUsageEvidenceComplete": state.get("aiUsageEvidenceComplete") is True,
            "aiCostUsdt": None,
            "aiCostStatus": "unpriced",
            "netPnlAfterAi": None,
        }

    def _strategy_binding_payload(self, state: Mapping[str, Any]) -> dict[str, Any]:
        blocker = _strategy_switch_blocker(state)
        revision = str(state.get("activeStrategyRevision") or "").strip()
        if not revision:
            return {
                "kind": "builtin",
                "bindingId": None,
                "strategyId": AUTO_STRATEGY_ID,
                "revision": _strategy_revision(state),
                "name": "内置涨跌幅与 AI 自动策略",
                "auditRunId": None,
                "market": state["market"],
                "symbol": state["symbol"],
                "timeframe": state["timeframe"],
                "status": "ready",
                "detail": "当前自动交易使用内置涨跌幅触发与 AI 决策。",
                "switchAllowed": blocker is None,
                "switchBlockedReason": blocker,
                "operator": str(
                    state.get("activeStrategyOperator")
                    or state.get("liveOperator")
                    or ""
                ),
            }
        try:
            expected_audit_run_id = str(
                state.get("activeStrategyAuditRunId") or ""
            ).strip()
            expected_audit_hash = str(
                state.get("activeStrategyAuditHash") or ""
            ).strip()
            if not expected_audit_run_id or not expected_audit_hash:
                raise ValueError("strategy_binding_audit_identity_missing")
            record, strategy, _audit = self._load_audited_strategy(
                revision,
                expected_audit_run_id=expected_audit_run_id,
                expected_audit_hash=expected_audit_hash,
            )
            status = "ready"
            detail = "当前自动交易将使用该审计策略的入场、退出与更严格风控。"
            strategy_id = record.strategy_id
            name = record.name
            audit_run_id = expected_audit_run_id
            market = strategy.market
            symbol = strategy.symbols[0]
            timeframe = strategy.timeframe
        except ValueError as error:
            status = "blocked"
            detail = _strategy_binding_error_detail(str(error))
            strategy_id = f"strategy-{revision}"
            name = str(state.get("activeStrategyName") or revision)
            audit_run_id = state.get("activeStrategyAuditRunId")
            market = state["market"]
            symbol = state["symbol"]
            timeframe = state["timeframe"]
        return {
            "kind": "library",
            "bindingId": state.get("activeStrategyBindingId"),
            "strategyId": strategy_id,
            "revision": revision,
            "name": name,
            "auditRunId": audit_run_id,
            "market": market,
            "symbol": symbol,
            "timeframe": timeframe,
            "status": status,
            "detail": detail,
            "switchAllowed": blocker is None,
            "switchBlockedReason": blocker,
            "operator": str(
                state.get("activeStrategyOperator")
                or state.get("liveOperator")
                or ""
            ),
        }


def _strategy_audit_hash(audit: ResearchRunAudit) -> str:
    return canonical_sha256(
        {
            "runId": audit.run_id,
            "createdAt": audit.created_at.isoformat(),
            "market": audit.market,
            "symbol": audit.symbol,
            "timeframe": audit.timeframe,
            "strategyRevision": audit.strategy_revision,
            "strategyConfig": audit.strategy_config,
            "dataSnapshotHash": audit.data_snapshot.get("snapshotHash"),
            "backtestAssumptions": audit.backtest_assumptions,
            "metrics": audit.metrics,
            "backtestTrades": audit.backtest_trades,
            "backtestEquityCurve": audit.backtest_equity_curve,
        }
    )


def _validate_strategy_backtest_evidence(
    audit: ResearchRunAudit,
    strategy: StrategyConfig,
    normalized_bars: list[dict[str, Any]],
) -> Any:
    assumptions = audit.backtest_assumptions
    if not isinstance(assumptions, dict):
        raise ValueError("strategy_binding_backtest_assumptions_invalid")
    initial_cash = _finite_number(
        assumptions.get("initialCash"),
        "strategy_binding_backtest_assumptions_invalid",
    )
    fee_bps = _finite_number(
        assumptions.get("feeBps"),
        "strategy_binding_backtest_assumptions_invalid",
    )
    slippage_bps = _finite_number(
        assumptions.get("slippageBps"),
        "strategy_binding_backtest_assumptions_invalid",
    )
    if (
        not 0 < initial_cash <= 1_000_000_000
        or not 0 <= fee_bps <= 1_000
        or not 0 <= slippage_bps <= 1_000
    ):
        raise ValueError("strategy_binding_backtest_assumptions_invalid")
    bars = snapshot_bars_to_ohlcv(
        normalized_bars,
        market=audit.market,
        symbol=audit.symbol,
        timeframe=audit.timeframe,
    )
    replay = BacktestEngine(
        initial_cash=initial_cash,
        fee_rate=fee_bps / 10_000,
        slippage_rate=slippage_bps / 10_000,
    ).run(strategy, bars)
    replay_metrics = asdict(replay.metrics)
    for key, expected in replay_metrics.items():
        observed = audit.metrics.get(key)
        if (
            isinstance(observed, bool)
            or not isinstance(observed, (int, float))
            or not math.isfinite(float(observed))
            or not math.isclose(float(observed), float(expected), abs_tol=0.0001)
        ):
            raise ValueError("strategy_binding_backtest_replay_mismatch")
    if replay.metrics.trade_count < 2:
        raise ValueError("strategy_binding_backtest_has_no_completed_trade")
    if len(audit.backtest_trades) != len(replay.trades):
        raise ValueError("strategy_binding_backtest_replay_mismatch")
    for stored, expected in zip(audit.backtest_trades, replay.trades):
        if not isinstance(stored, dict):
            raise ValueError("strategy_binding_backtest_replay_mismatch")
        try:
            price = float(stored.get("price"))
            quantity = float(stored.get("quantity"))
        except (TypeError, ValueError):
            raise ValueError("strategy_binding_backtest_replay_mismatch") from None
        if (
            str(stored.get("side") or "").lower() != expected.side
            or str(stored.get("status") or "").lower() != "filled"
            or str(stored.get("timestamp") or "") != expected.timestamp.isoformat()
            or not math.isclose(price, expected.price, abs_tol=0.011)
            or not math.isclose(quantity, expected.quantity, abs_tol=0.000001)
        ):
            raise ValueError("strategy_binding_backtest_replay_mismatch")
    if len(audit.backtest_equity_curve) != len(replay.equity_curve):
        raise ValueError("strategy_binding_backtest_replay_mismatch")
    for stored, expected in zip(audit.backtest_equity_curve, replay.equity_curve):
        if not isinstance(stored, dict):
            raise ValueError("strategy_binding_backtest_replay_mismatch")
        try:
            equity = float(stored.get("equity"))
        except (TypeError, ValueError):
            raise ValueError("strategy_binding_backtest_replay_mismatch") from None
        if (
            str(stored.get("timestamp") or "") != expected.timestamp.isoformat()
            or not math.isclose(equity, expected.equity, abs_tol=0.001)
        ):
            raise ValueError("strategy_binding_backtest_replay_mismatch")
    return BacktestEngine(
        initial_cash=initial_cash,
        fee_rate=max(fee_bps / 10_000, FEE_RATE),
        slippage_rate=max(
            slippage_bps / 10_000,
            PRODUCTION_REPLAY_SLIPPAGE_RATE,
        ),
    ).run(strategy, bars)


def _finite_number(value: Any, error: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(error)
    parsed = float(value)
    if not math.isfinite(parsed):
        raise ValueError(error)
    return parsed


def _account_asset(value: Any) -> dict[str, float]:
    if not isinstance(value, Mapping):
        raise ValueError("binance_spot_account_snapshot_invalid")
    result = {
        key: _finite_number(
            value.get(key),
            "binance_spot_account_snapshot_invalid",
        )
        for key in ("free", "used", "total", "priceUsdt", "valueUsdt")
    }
    if (
        any(amount < 0 for amount in result.values())
        or not math.isclose(
            result["free"] + result["used"],
            result["total"],
            rel_tol=0,
            abs_tol=1e-8,
        )
    ):
        raise ValueError("binance_spot_account_snapshot_invalid")
    return result


def _empty_account_asset(*, price: float = 0.0) -> dict[str, float]:
    return {
        "free": 0.0,
        "used": 0.0,
        "total": 0.0,
        "priceUsdt": price,
        "valueUsdt": 0.0,
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
            "availableCash": float(state.get("initialCash") or 100.0),
            "position": 0.0,
            "unmanagedBaseQuantity": 0.0,
            "avgCost": 0.0,
            "equity": float(state.get("initialCash") or 100.0),
            "accountEquity": None,
            "accountAuthority": None,
            "accountFingerprint": None,
            "accountAssets": None,
            "accountSnapshotHash": None,
            "accountSynchronizedAt": None,
            "lastExternalFlowUsdt": 0.0,
            "externalFlowUsdt": 0.0,
            "realizedPnl": 0.0,
            "dailyDate": now.date().isoformat(),
            "dailyStartEquity": float(state.get("initialCash") or 100.0),
            "dailyPeakEquity": float(state.get("initialCash") or 100.0),
            "dailyReleasedDustNotional": 0.0,
            "dailyLossDrawdownPct": 0.0,
            "dailyProfitDrawdownPct": 0.0,
            "dailyRiskHaltReason": None,
            "tradeCount": 0,
            "exchangeFeeTotal": 0.0,
            "estimatedFeeCount": 0,
            "feeEvidenceComplete": True,
            "tradeTimestamps": [],
            "lastBarTimestamp": None,
            "lastPrice": None,
            "oneBarChangePct": None,
            "windowChangePct": None,
            "dataSource": None,
            "lastDecision": None,
            "aiUsage": {
                "callCount": 0,
                "inputTokens": 0,
                "outputTokens": 0,
                "totalTokens": 0,
                "providerId": None,
                "model": None,
                "latencyMs": None,
            },
            "aiUsageEvidenceComplete": True,
            "lastTrade": None,
            "lastTestnetOrder": None,
            "lastLiveOrder": None,
            "lastAccountCheck": None,
            "lastDecisionContract": None,
            "lastOrderResult": None,
            "lastDustDisposition": None,
        }
    )


def _reset_strategy_decision_context(state: dict[str, Any]) -> None:
    state.update(
        {
            "lastBarTimestamp": None,
            "oneBarChangePct": None,
            "windowChangePct": None,
            "dataSource": None,
            "lastDecision": None,
            "lastDecisionContract": None,
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
        "liveSessionTtlHours": 8,
        "liveAuthorizedUntil": None,
        "runnerState": "stopped",
        "runnerIntervalSeconds": 35,
        "runnerCycleCount": 0,
        "consecutiveRunnerFailures": 0,
        "lastRunnerCycleAt": None,
        "lastRunnerSuccessAt": None,
        "lastRunnerErrorAt": None,
        "lastRunnerError": None,
        "market": "crypto",
        "symbol": "BTC/USDT",
        "timeframe": "1m",
        "activeStrategyBindingId": None,
        "activeStrategyRevision": None,
        "activeStrategyName": None,
        "activeStrategyAuditRunId": None,
        "activeStrategyAuditHash": None,
        "activeStrategyConfig": None,
        "activeStrategyConfigHash": None,
        "activeStrategyOperator": "",
        "triggerPct": 0.3,
        "orderNotional": 10.0,
        "stopLossPct": 1.0,
        "takeProfitPct": 2.0,
        "dailyLossLimitPct": 2.0,
        "dailyProfitDrawdownLimitPct": 2.0,
        "maxTradesPerHour": 3,
        "providerId": "auto",
        "initialCash": 100.0,
        "cash": 100.0,
        "availableCash": 100.0,
        "position": 0.0,
        "unmanagedBaseQuantity": 0.0,
        "avgCost": 0.0,
        "equity": 100.0,
        "accountEquity": None,
        "accountAuthority": None,
        "accountFingerprint": None,
        "accountAssets": None,
        "accountSnapshotHash": None,
        "accountSynchronizedAt": None,
        "lastExternalFlowUsdt": 0.0,
        "externalFlowUsdt": 0.0,
        "realizedPnl": 0.0,
        "dailyDate": now.date().isoformat(),
        "dailyStartEquity": 100.0,
        "dailyPeakEquity": 100.0,
        "dailyReleasedDustNotional": 0.0,
        "dailyLossDrawdownPct": 0.0,
        "dailyProfitDrawdownPct": 0.0,
        "dailyRiskHaltReason": None,
        "tradeCount": 0,
        "exchangeFeeTotal": 0.0,
        "estimatedFeeCount": 0,
        "feeEvidenceComplete": True,
        "tradeTimestamps": [],
        "lastBarTimestamp": None,
        "lastPrice": None,
        "oneBarChangePct": None,
        "windowChangePct": None,
        "dataSource": None,
        "lastDecision": None,
        "aiUsage": {
            "callCount": 0,
            "inputTokens": 0,
            "outputTokens": 0,
            "totalTokens": 0,
            "providerId": None,
            "model": None,
            "latencyMs": None,
        },
        "aiUsageEvidenceComplete": True,
        "lastDecisionContract": None,
        "lastOrderResult": None,
        "lastTrade": None,
        "lastTestnetOrder": None,
        "lastLiveOrder": None,
        "lastTestnetOrderIntentId": None,
        "lastLiveOrderIntentId": None,
        "lastAccountCheck": None,
        "lastDustDisposition": None,
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
    active_revision = str(state.get("activeStrategyRevision") or "").strip()
    if active_revision:
        return active_revision
    return canonical_sha256({
        "kind": AUTO_STRATEGY_ID,
        "market": state["market"],
        "symbol": state["symbol"],
        "timeframe": state["timeframe"],
        "triggerPct": state["triggerPct"],
        "stopLossPct": state["stopLossPct"],
        "takeProfitPct": state["takeProfitPct"],
        "providerId": state["providerId"],
    })


def _strategy_id(state: Mapping[str, Any]) -> str:
    revision = str(state.get("activeStrategyRevision") or "").strip()
    return f"strategy-{revision}" if revision else AUTO_STRATEGY_ID


def _strategy_evidence(state: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "strategyBindingId": state.get("activeStrategyBindingId"),
        "strategyId": _strategy_id(state),
        "strategyRevision": _strategy_revision(state),
        "auditRunId": state.get("activeStrategyAuditRunId"),
        "auditHash": state.get("activeStrategyAuditHash"),
    }


def _strategy_switch_blocker(state: Mapping[str, Any]) -> str | None:
    if state.get("enabled") is True:
        return "strategy_switch_requires_paused_monitoring"
    if float(state.get("position") or 0) > 1e-12:
        return "strategy_switch_requires_flat_position"
    for key in ("lastTestnetOrder", "lastLiveOrder"):
        order = state.get(key)
        if isinstance(order, dict) and order.get("state") in _UNRESOLVED_ORDER_STATES:
            return "strategy_switch_requires_reconciled_orders"
    return None


def _strategy_binding_error_detail(code: str) -> str:
    reason = {
        "strategy_binding_audit_run_changed": "绑定的审计运行已变更",
        "strategy_binding_audit_evidence_changed": "绑定的审计证据已变更",
        "strategy_binding_audit_identity_missing": "缺少绑定的审计身份",
        "strategy_binding_snapshot_missing": "缺少绑定时固定的策略快照",
        "strategy_binding_snapshot_changed": "绑定时固定的策略快照校验失败",
        "strategy_binding_snapshot_revision_mismatch": "固定策略快照与绑定版本不一致",
        "strategy_binding_snapshot_context_mismatch": "固定策略快照与运行上下文不一致",
    }.get(code, "生产策略绑定校验失败")
    if code.startswith("strategy_binding_snapshot_"):
        return f"{reason}；已停止自动开仓与自动退出，请立即人工处理现有持仓。"
    return f"{reason}；已禁止开新仓，如有持仓仍按固定策略快照只减仓退出。"


def _is_local_order_intent_event(
    event: Any,
    mode: str,
    state: Mapping[str, Any],
) -> bool:
    metadata = event.metadata if isinstance(event.metadata, dict) else {}
    order = metadata.get("order")
    order_intent = metadata.get("orderIntent")
    trade_intent = metadata.get("tradeIntent")
    if (
        event.event_type != f"auto_{mode}_order_intent"
        or event.run_id is not None
        or event.stage != "auto-paper-trading"
        or event.source != "auto-paper-trading"
        or metadata.get("executionMode") != mode
        or not isinstance(order, dict)
        or not isinstance(order_intent, dict)
        or not isinstance(trade_intent, dict)
    ):
        return False
    client_order_id = str(order.get("clientOrderId") or "")
    if (
        not client_order_id
        or event.event_id != f"auto-{mode}-order-intent-{client_order_id}"
        or order.get("symbol") != state["symbol"]
        or order.get("side") not in {"buy", "sell"}
    ):
        return False
    try:
        if any(
            _finite_number(order.get(key), "auto_trading_order_intent_invalid") <= 0
            for key in ("quantity", "referencePrice", "notionalValue")
        ):
            return False
        comparable = ("symbol", "side", "quantity", "referencePrice", "notionalValue")
        return canonical_sha256({key: order.get(key) for key in comparable}) == canonical_sha256(
            {key: order_intent.get(key) for key in comparable}
        )
    except ValueError:
        return False


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


def _settle_sell_fill(
    state: dict[str, Any],
    *,
    quantity: float,
    notional: float,
    cash_fee: float,
    base_fee: float,
) -> bool:
    position = float(state["position"])
    sold_inventory = quantity + base_fee
    if sold_inventory > position + 1e-12:
        return False
    sold_inventory = min(position, sold_inventory)
    average_cost = float(state["avgCost"])
    state["cash"] = round(float(state["cash"]) + notional - cash_fee, 8)
    state["position"] = round(max(0.0, position - sold_inventory), 12)
    state["avgCost"] = round(average_cost, 8) if state["position"] else 0.0
    state["realizedPnl"] = round(
        float(state["realizedPnl"])
        + notional
        - cash_fee
        - average_cost * sold_inventory,
        8,
    )
    return True


def _order_result_fee_evidence(
    routed: dict[str, Any] | None,
    *,
    symbol: str,
    price: float,
    notional: float,
) -> dict[str, Any]:
    fee, estimated, _, _ = _fee_accounting(routed, symbol, price, notional)
    raw_fees = routed.get("fees") if isinstance(routed, dict) else None
    fees = (
        raw_fees
        if isinstance(raw_fees, list) and raw_fees
        else [{"currency": symbol.rpartition("/")[2], "cost": round(fee, 8)}]
        if notional > 0
        else []
    )
    return {"fees": fees, "feeEstimated": estimated if fees else False}


def _event(
    *,
    event_id: str,
    event_type: str,
    summary: str,
    detail: str,
    metadata: dict[str, Any],
    run_id: str | None = None,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": event_id,
        "eventType": event_type,
        "runId": run_id,
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


def _live_session_authorized(state: Mapping[str, Any]) -> bool:
    return (
        state.get("liveSessionTtlHours") == 0
        or _parse_time(state.get("liveAuthorizedUntil")) >= _now()
    )


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)
