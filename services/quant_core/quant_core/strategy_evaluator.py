from __future__ import annotations

import math
from dataclasses import asdict, dataclass, replace
from datetime import datetime, timedelta, timezone
from statistics import fmean
from typing import Any, Literal, cast

from quant_core.canonical import canonical_sha256
from quant_core.domain import (
    CostAwareRangeReversionPolicy,
    OHLCVBar,
    StrategyConfig,
    Timeframe,
)


@dataclass(frozen=True)
class PositionSnapshot:
    quantity: float = 0.0
    entry_price: float = 0.0


@dataclass(frozen=True)
class StrategyRuntimeState:
    version: int
    strategy_revision: str
    last_decision_5m_bar_at: datetime | None = None
    decision_count: int = 0
    breakout_condition_active: bool = False
    last_breakout_event_id: str | None = None
    entry_filled_at: datetime | None = None
    entry_decision_count: int | None = None
    entry_price: float = 0.0
    atr_at_entry: float | None = None
    highest_high: float = 0.0
    highest_close: float = 0.0
    active_stop: float | None = None
    cooldown_until_decision_count: int = 0

    @property
    def state_hash(self) -> str:
        return canonical_sha256(_runtime_state_payload(self))


@dataclass(frozen=True)
class CostAwareRangeReversionRuntimeState:
    version: int
    strategy_revision: str
    last_decision_4h_bar_at: datetime | None = None
    decision_count: int = 0
    reversion_condition_active: bool = False
    armed_reversion_event_id: str | None = None
    armed_at_decision_count: int | None = None
    entry_filled_at: datetime | None = None
    entry_decision_count: int | None = None
    entry_price: float = 0.0
    atr_at_entry: float | None = None
    active_stop: float | None = None
    cooldown_until_decision_count: int = 0

    @property
    def state_hash(self) -> str:
        return canonical_sha256(_runtime_state_payload(self))


RuntimeState = StrategyRuntimeState | CostAwareRangeReversionRuntimeState


@dataclass(frozen=True)
class MarketContext:
    base_bars: tuple[OHLCVBar, ...]
    decision_bars: tuple[OHLCVBar, ...]
    regime_bars: tuple[OHLCVBar, ...]
    context_hash: str
    atr_value: float | None = None
    decision_bar_count: int = 0
    regime_bar_count: int = 0
    fast_ema_value: float | None = None
    slow_ema_value: float | None = None
    z_score_value: float | None = None
    z_score_mean_value: float | None = None


class PolicyMarketContextSession:
    """Single-pass UTC aggregation and indicator context shared by research and runtime."""

    def __init__(self, strategy: StrategyConfig) -> None:
        if strategy.policy is None:
            raise ValueError("strategy_policy_required")
        self.strategy = strategy
        self._latest_timestamp: datetime | None = None
        self._latest_base_bar: OHLCVBar | None = None
        self._five_start: datetime | None = None
        self._five_rows: list[OHLCVBar] = []
        self._sixty_start: datetime | None = None
        self._sixty_rows: list[OHLCVBar] = []
        self._four_hour_start: datetime | None = None
        self._four_hour_rows: list[OHLCVBar] = []
        self._decision_bars: list[OHLCVBar] = []
        self._regime_bars: list[OHLCVBar] = []
        self._decision_bar_count = 0
        self._regime_bar_count = 0
        self._previous_decision_close: float | None = None
        self._atr_seed: list[float] = []
        self._atr_value: float | None = None
        self._fast_ema_value: float | None = None
        self._slow_ema_value: float | None = None
        self._z_score_value: float | None = None
        self._z_score_mean_value: float | None = None

    def ingest(
        self,
        bar: OHLCVBar,
        *,
        include_context_hash: bool = True,
    ) -> MarketContext | None:
        if (
            bar.market != self.strategy.market
            or bar.symbol != self.strategy.symbols[0]
            or bar.timeframe != self.strategy.timeframe
        ):
            raise ValueError("strategy_market_context_mismatch")
        timestamp = _utc(bar.timestamp)
        if self._latest_timestamp is not None and timestamp <= self._latest_timestamp:
            raise ValueError("strategy_market_context_not_strictly_ordered")
        if (
            isinstance(self.strategy.policy, CostAwareRangeReversionPolicy)
            and self._latest_timestamp is not None
            and timestamp != self._latest_timestamp + timedelta(minutes=1)
        ):
            raise ValueError("strategy_market_context_not_contiguous")
        self._latest_timestamp = timestamp
        self._latest_base_bar = bar

        policy = self.strategy.policy
        if isinstance(policy, CostAwareRangeReversionPolicy):
            decision_bar = self._ingest_four_hour(bar)
            regime_bar = None
        else:
            decision_bar = self._ingest_five_minute(bar)
            regime_bar = self._ingest_sixty_minute(bar)
        if regime_bar is not None:
            self._regime_bar_count += 1
            self._regime_bars.append(regime_bar)
            keep = (
                self.strategy.policy.regime.close_above_sma_window
                + self.strategy.policy.regime.sma_slope_lookback_bars
            )
            self._regime_bars = self._regime_bars[-keep:]
        if decision_bar is None:
            return None

        if isinstance(policy, CostAwareRangeReversionPolicy):
            self._decision_bar_count = _utc_four_hour_bar_number(decision_bar.timestamp)
            keep = max(
                policy.range_regime.indicator_anchor_bars,
                policy.reversion.z_score_window + 1,
                policy.atr.window,
            )
            self._decision_bars.append(decision_bar)
            self._decision_bars = self._decision_bars[-keep:]
            self._update_range_reversion_indicators(policy)
        else:
            self._decision_bar_count += 1
            self._update_atr(decision_bar)
            self._decision_bars.append(decision_bar)
            keep = max(
                policy.breakout.lookback_bars + 2,
                policy.volume.sma_window + 1,
                policy.atr.window + 1,
            )
            self._decision_bars = self._decision_bars[-keep:]
        return self.latest_context(include_context_hash=include_context_hash)

    def latest_context(self, *, include_context_hash: bool = True) -> MarketContext:
        if self._latest_base_bar is None:
            raise ValueError("strategy_market_context_incomplete")
        policy = self.strategy.policy
        if include_context_hash and isinstance(policy, CostAwareRangeReversionPolicy):
            evidence = {
                "aggregationVersion": "ohlcv-utc-v1",
                "baseLatest": _bar_payload(self._latest_base_bar),
                "decision": [_bar_payload(bar) for bar in self._decision_bars],
                "atr": self._atr_value,
                "fastEma": self._fast_ema_value,
                "slowEma": self._slow_ema_value,
                "zScore": self._z_score_value,
                "zScoreMean": self._z_score_mean_value,
                "decisionBarCount": self._decision_bar_count,
            }
        elif include_context_hash:
            evidence = {
                "aggregationVersion": "ohlcv-utc-v1",
                "baseLatest": _bar_payload(self._latest_base_bar),
                "decision": [_bar_payload(bar) for bar in self._decision_bars],
                "regime": [_bar_payload(bar) for bar in self._regime_bars],
                "atr": self._atr_value,
                "decisionBarCount": self._decision_bar_count,
                "regimeBarCount": self._regime_bar_count,
            }
        return MarketContext(
            base_bars=(self._latest_base_bar,),
            decision_bars=tuple(self._decision_bars),
            regime_bars=tuple(self._regime_bars),
            context_hash=canonical_sha256(evidence) if include_context_hash else "",
            atr_value=self._atr_value,
            decision_bar_count=self._decision_bar_count,
            regime_bar_count=self._regime_bar_count,
            fast_ema_value=self._fast_ema_value,
            slow_ema_value=self._slow_ema_value,
            z_score_value=self._z_score_value,
            z_score_mean_value=self._z_score_mean_value,
        )

    def _ingest_five_minute(self, bar: OHLCVBar) -> OHLCVBar | None:
        start = _bucket_start(bar.timestamp, 5)
        if start != self._five_start:
            self._five_start = start
            self._five_rows = []
        self._five_rows.append(bar)
        return _completed_bucket(self._five_rows, start=start, minutes=5, timeframe="5m")

    def _ingest_sixty_minute(self, bar: OHLCVBar) -> OHLCVBar | None:
        start = _bucket_start(bar.timestamp, 60)
        if start != self._sixty_start:
            self._sixty_start = start
            self._sixty_rows = []
        self._sixty_rows.append(bar)
        return _completed_bucket(self._sixty_rows, start=start, minutes=60, timeframe="60m")

    def _ingest_four_hour(self, bar: OHLCVBar) -> OHLCVBar | None:
        start = _bucket_start(bar.timestamp, 240)
        if start != self._four_hour_start:
            self._four_hour_start = start
            self._four_hour_rows = []
        self._four_hour_rows.append(bar)
        return _completed_bucket(self._four_hour_rows, start=start, minutes=240, timeframe="4h")

    def _update_atr(self, bar: OHLCVBar) -> None:
        previous_close = self._previous_decision_close
        true_range = (
            bar.high - bar.low
            if previous_close is None
            else max(
                bar.high - bar.low,
                abs(bar.high - previous_close),
                abs(bar.low - previous_close),
            )
        )
        self._previous_decision_close = bar.close
        window = self.strategy.policy.atr.window
        if self._atr_value is None:
            self._atr_seed.append(true_range)
            if len(self._atr_seed) == window:
                self._atr_value = fmean(self._atr_seed)
            return
        self._atr_value = ((self._atr_value * (window - 1)) + true_range) / window

    def _update_range_reversion_indicators(
        self,
        policy: CostAwareRangeReversionPolicy,
    ) -> None:
        anchor_bars = self._decision_bars[-policy.range_regime.indicator_anchor_bars :]
        if (
            policy.kind == "cost_aware_range_reversion_v1_1"
            and len(anchor_bars) < policy.range_regime.indicator_anchor_bars
        ):
            self._fast_ema_value = None
            self._slow_ema_value = None
            self._atr_value = None
            self._z_score_value = None
            self._z_score_mean_value = None
            return
        closes = [bar.close for bar in anchor_bars]
        self._fast_ema_value = _seeded_ema(
            closes,
            policy.range_regime.fast_ema_window,
        )
        self._slow_ema_value = _seeded_ema(
            closes,
            policy.range_regime.slow_ema_window,
        )
        self._atr_value = _wilder_atr(anchor_bars, policy.atr.window)
        score = _population_z_score(closes, policy.reversion.z_score_window)
        if score is None:
            self._z_score_mean_value = None
            self._z_score_value = None
        else:
            self._z_score_mean_value, self._z_score_value = score


@dataclass(frozen=True)
class StrategyEvaluation:
    evaluation_id: str
    action: Literal["hold", "buy", "sell"]
    reason: str
    evaluated_at: datetime
    decision_bar_at: datetime
    context_hash: str
    breakout_event_id: str | None
    atr: float | None
    active_stop: float | None
    gates: dict[str, bool]
    state_before_hash: str
    state_after: RuntimeState

    @property
    def state_after_hash(self) -> str:
        return self.state_after.state_hash


@dataclass(frozen=True)
class EntrySizing:
    quantity: float
    notional: float
    reason: str


def initial_runtime_state(strategy: StrategyConfig) -> RuntimeState:
    if isinstance(strategy.policy, CostAwareRangeReversionPolicy):
        return CostAwareRangeReversionRuntimeState(
            version=1,
            strategy_revision=strategy.revision,
        )
    return StrategyRuntimeState(version=1, strategy_revision=strategy.revision)


def runtime_state_to_payload(state: RuntimeState) -> dict[str, Any]:
    if isinstance(state, CostAwareRangeReversionRuntimeState):
        return {
            "version": state.version,
            "strategyRevision": state.strategy_revision,
            "lastDecision4hBarAt": _optional_time_text(state.last_decision_4h_bar_at),
            "decisionCount": state.decision_count,
            "reversionConditionActive": state.reversion_condition_active,
            "armedReversionEventId": state.armed_reversion_event_id,
            "armedAtDecisionCount": state.armed_at_decision_count,
            "entryFilledAt": _optional_time_text(state.entry_filled_at),
            "entryDecisionCount": state.entry_decision_count,
            "entryPrice": state.entry_price,
            "atrAtEntry": state.atr_at_entry,
            "activeStop": state.active_stop,
            "cooldownUntilDecisionCount": state.cooldown_until_decision_count,
            "stateHash": state.state_hash,
        }
    return {
        "version": state.version,
        "strategyRevision": state.strategy_revision,
        "lastDecision5mBarAt": _optional_time_text(state.last_decision_5m_bar_at),
        "decisionCount": state.decision_count,
        "breakoutConditionActive": state.breakout_condition_active,
        "lastBreakoutEventId": state.last_breakout_event_id,
        "entryFilledAt": _optional_time_text(state.entry_filled_at),
        "entryDecisionCount": state.entry_decision_count,
        "entryPrice": state.entry_price,
        "atrAtEntry": state.atr_at_entry,
        "highestHigh": state.highest_high,
        "highestClose": state.highest_close,
        "activeStop": state.active_stop,
        "cooldownUntilDecisionCount": state.cooldown_until_decision_count,
        "stateHash": state.state_hash,
    }


def runtime_state_from_payload(strategy: StrategyConfig, value: Any) -> RuntimeState:
    if value is None:
        return initial_runtime_state(strategy)
    if isinstance(strategy.policy, CostAwareRangeReversionPolicy):
        return _range_reversion_runtime_state_from_payload(strategy, value)
    expected_keys = {
        "version",
        "strategyRevision",
        "lastDecision5mBarAt",
        "decisionCount",
        "breakoutConditionActive",
        "lastBreakoutEventId",
        "entryFilledAt",
        "entryDecisionCount",
        "entryPrice",
        "atrAtEntry",
        "highestHigh",
        "highestClose",
        "activeStop",
        "cooldownUntilDecisionCount",
        "stateHash",
    }
    if not isinstance(value, dict) or set(value) != expected_keys:
        raise ValueError("strategy_runtime_state_invalid")
    if value.get("version") != 1:
        raise ValueError("strategy_runtime_state_version_invalid")
    state = StrategyRuntimeState(
        version=1,
        strategy_revision=str(value.get("strategyRevision") or ""),
        last_decision_5m_bar_at=_optional_time(value.get("lastDecision5mBarAt")),
        decision_count=int(value.get("decisionCount") or 0),
        breakout_condition_active=value.get("breakoutConditionActive") is True,
        last_breakout_event_id=_optional_text(value.get("lastBreakoutEventId")),
        entry_filled_at=_optional_time(value.get("entryFilledAt")),
        entry_decision_count=(
            int(value["entryDecisionCount"])
            if value.get("entryDecisionCount") is not None
            else None
        ),
        entry_price=float(value.get("entryPrice") or 0),
        atr_at_entry=_optional_number(value.get("atrAtEntry")),
        highest_high=float(value.get("highestHigh") or 0),
        highest_close=float(value.get("highestClose") or 0),
        active_stop=_optional_number(value.get("activeStop")),
        cooldown_until_decision_count=int(value.get("cooldownUntilDecisionCount") or 0),
    )
    if state.strategy_revision != strategy.revision:
        raise ValueError("strategy_runtime_revision_mismatch")
    if (
        state.decision_count < 0
        or state.cooldown_until_decision_count < 0
        or state.entry_price < 0
        or state.highest_high < 0
        or state.highest_close < 0
        or (
            state.entry_decision_count is not None
            and not 0 <= state.entry_decision_count <= state.decision_count
        )
    ):
        raise ValueError("strategy_runtime_state_invalid")
    supplied_hash = str(value.get("stateHash") or "")
    if supplied_hash != state.state_hash:
        raise ValueError("strategy_runtime_state_hash_mismatch")
    return state


def _range_reversion_runtime_state_from_payload(
    strategy: StrategyConfig,
    value: Any,
) -> CostAwareRangeReversionRuntimeState:
    expected_keys = {
        "version",
        "strategyRevision",
        "lastDecision4hBarAt",
        "decisionCount",
        "reversionConditionActive",
        "armedReversionEventId",
        "armedAtDecisionCount",
        "entryFilledAt",
        "entryDecisionCount",
        "entryPrice",
        "atrAtEntry",
        "activeStop",
        "cooldownUntilDecisionCount",
        "stateHash",
    }
    if not isinstance(value, dict) or set(value) != expected_keys:
        raise ValueError("strategy_runtime_state_invalid")
    if value.get("version") != 1:
        raise ValueError("strategy_runtime_state_version_invalid")
    state = CostAwareRangeReversionRuntimeState(
        version=1,
        strategy_revision=str(value.get("strategyRevision") or ""),
        last_decision_4h_bar_at=_optional_time(value.get("lastDecision4hBarAt")),
        decision_count=int(value.get("decisionCount") or 0),
        reversion_condition_active=value.get("reversionConditionActive") is True,
        armed_reversion_event_id=_optional_text(value.get("armedReversionEventId")),
        armed_at_decision_count=(
            int(value["armedAtDecisionCount"])
            if value.get("armedAtDecisionCount") is not None
            else None
        ),
        entry_filled_at=_optional_time(value.get("entryFilledAt")),
        entry_decision_count=(
            int(value["entryDecisionCount"])
            if value.get("entryDecisionCount") is not None
            else None
        ),
        entry_price=float(value.get("entryPrice") or 0),
        atr_at_entry=_optional_number(value.get("atrAtEntry")),
        active_stop=_optional_number(value.get("activeStop")),
        cooldown_until_decision_count=int(value.get("cooldownUntilDecisionCount") or 0),
    )
    if state.strategy_revision != strategy.revision:
        raise ValueError("strategy_runtime_revision_mismatch")
    if (
        state.decision_count < 0
        or state.cooldown_until_decision_count < 0
        or state.entry_price < 0
        or (
            state.armed_at_decision_count is not None
            and not 0 <= state.armed_at_decision_count <= state.decision_count
        )
        or (
            state.entry_decision_count is not None
            and not 0 <= state.entry_decision_count <= state.decision_count
        )
        or ((state.armed_reversion_event_id is None) != (state.armed_at_decision_count is None))
    ):
        raise ValueError("strategy_runtime_state_invalid")
    supplied_hash = str(value.get("stateHash") or "")
    if supplied_hash != state.state_hash:
        raise ValueError("strategy_runtime_state_hash_mismatch")
    return state


def strategy_evaluation_to_payload(evaluation: StrategyEvaluation) -> dict[str, Any]:
    return {
        "evaluationId": evaluation.evaluation_id,
        "action": evaluation.action,
        "reason": evaluation.reason,
        "evaluatedAt": evaluation.evaluated_at.isoformat(),
        "decisionBarAt": evaluation.decision_bar_at.isoformat(),
        "contextHash": evaluation.context_hash,
        "breakoutEventId": evaluation.breakout_event_id,
        "atr": evaluation.atr,
        "activeStop": evaluation.active_stop,
        "gates": dict(evaluation.gates),
        "stateBeforeHash": evaluation.state_before_hash,
        "stateAfter": runtime_state_to_payload(evaluation.state_after),
        "stateAfterHash": evaluation.state_after_hash,
    }


def strategy_evaluation_from_payload(strategy: StrategyConfig, value: Any) -> StrategyEvaluation:
    expected_keys = {
        "evaluationId",
        "action",
        "reason",
        "evaluatedAt",
        "decisionBarAt",
        "contextHash",
        "breakoutEventId",
        "atr",
        "activeStop",
        "gates",
        "stateBeforeHash",
        "stateAfter",
        "stateAfterHash",
    }
    if not isinstance(value, dict) or set(value) != expected_keys:
        raise ValueError("strategy_evaluation_required")
    state_after = runtime_state_from_payload(strategy, value.get("stateAfter"))
    if str(value.get("stateAfterHash") or "") != state_after.state_hash:
        raise ValueError("strategy_evaluation_state_hash_mismatch")
    action = str(value.get("action") or "")
    if action not in {"hold", "buy", "sell"}:
        raise ValueError("strategy_evaluation_action_invalid")
    gates = value.get("gates")
    if not isinstance(gates, dict) or any(not isinstance(item, bool) for item in gates.values()):
        raise ValueError("strategy_evaluation_gates_invalid")
    evaluation = StrategyEvaluation(
        evaluation_id=str(value.get("evaluationId") or ""),
        action=cast(Literal["hold", "buy", "sell"], action),
        reason=str(value.get("reason") or ""),
        evaluated_at=_required_time(value.get("evaluatedAt")),
        decision_bar_at=_required_time(value.get("decisionBarAt")),
        context_hash=str(value.get("contextHash") or ""),
        breakout_event_id=_optional_text(value.get("breakoutEventId")),
        atr=_optional_number(value.get("atr")),
        active_stop=_optional_number(value.get("activeStop")),
        gates=dict(gates),
        state_before_hash=str(value.get("stateBeforeHash") or ""),
        state_after=state_after,
    )
    expected_id = canonical_sha256(
        {
            "evaluatorVersion": _evaluator_version(strategy),
            "strategyRevision": strategy.revision,
            "contextHash": evaluation.context_hash,
            "stateBeforeHash": evaluation.state_before_hash,
            "decisionBarAt": evaluation.decision_bar_at.isoformat(),
        }
    )[:24]
    if (
        not evaluation.context_hash
        or not evaluation.state_before_hash
        or evaluation.evaluation_id != expected_id
    ):
        raise ValueError("strategy_evaluation_identity_mismatch")
    return evaluation


def build_market_context(strategy: StrategyConfig, bars: list[OHLCVBar]) -> MarketContext:
    if strategy.policy is None:
        raise ValueError("strategy_policy_required")
    ordered = sorted(bars, key=lambda bar: bar.timestamp)
    if not ordered:
        raise ValueError("strategy_market_context_incomplete")
    session = PolicyMarketContextSession(strategy)
    for bar in ordered:
        session.ingest(bar)
    return session.latest_context()


def aggregate_complete_bars(
    bars: list[OHLCVBar],
    *,
    minutes: int,
    timeframe: Timeframe,
) -> list[OHLCVBar]:
    if minutes <= 0:
        raise ValueError("aggregation_minutes_must_be_positive")
    grouped: dict[datetime, list[OHLCVBar]] = {}
    for bar in sorted(bars, key=lambda item: item.timestamp):
        timestamp = _utc(bar.timestamp).replace(second=0, microsecond=0)
        bucket_start = _bucket_start(timestamp, minutes)
        grouped.setdefault(bucket_start, []).append(bar)

    aggregated: list[OHLCVBar] = []
    expected_offsets = [offset for offset in range(minutes)]
    for bucket_start, rows in sorted(grouped.items()):
        offsets = [int((_utc(row.timestamp) - bucket_start).total_seconds() // 60) for row in rows]
        if offsets != expected_offsets:
            continue
        first = rows[0]
        aggregated.append(
            OHLCVBar(
                symbol=first.symbol,
                market=first.market,
                timeframe=timeframe,
                timestamp=bucket_start,
                open=first.open,
                high=max(row.high for row in rows),
                low=min(row.low for row in rows),
                close=rows[-1].close,
                volume=sum(row.volume for row in rows),
            )
        )
    return aggregated


def _bucket_start(value: datetime, minutes: int) -> datetime:
    timestamp = _utc(value).replace(second=0, microsecond=0)
    minute_of_day = timestamp.hour * 60 + timestamp.minute
    bucket_minute = (minute_of_day // minutes) * minutes
    return timestamp.replace(hour=bucket_minute // 60, minute=bucket_minute % 60)


def _utc_four_hour_bar_number(value: datetime) -> int:
    return int(_utc(value).timestamp() // (4 * 60 * 60)) + 1


def _completed_bucket(
    rows: list[OHLCVBar],
    *,
    start: datetime,
    minutes: int,
    timeframe: Timeframe,
) -> OHLCVBar | None:
    if len(rows) != minutes:
        return None
    offsets = [int((_utc(row.timestamp) - start).total_seconds() // 60) for row in rows]
    if offsets != list(range(minutes)):
        return None
    first = rows[0]
    return OHLCVBar(
        symbol=first.symbol,
        market=first.market,
        timeframe=timeframe,
        timestamp=start,
        open=first.open,
        high=max(row.high for row in rows),
        low=min(row.low for row in rows),
        close=rows[-1].close,
        volume=sum(row.volume for row in rows),
    )


def _bar_payload(bar: OHLCVBar) -> dict[str, Any]:
    timestamp = _utc(bar.timestamp)
    return {
        "timestamp": timestamp.isoformat(),
        "timestampMs": int(timestamp.timestamp() * 1000),
        "open": float(bar.open),
        "high": float(bar.high),
        "low": float(bar.low),
        "close": float(bar.close),
        "volume": float(bar.volume),
    }


def evaluate_strategy(
    strategy: StrategyConfig,
    context: MarketContext,
    position: PositionSnapshot,
    state: RuntimeState,
) -> StrategyEvaluation:
    policy = strategy.policy
    if isinstance(policy, CostAwareRangeReversionPolicy):
        if not isinstance(state, CostAwareRangeReversionRuntimeState):
            raise ValueError("strategy_runtime_policy_mismatch")
        return _evaluate_cost_aware_range_reversion(
            strategy,
            policy,
            context,
            position,
            state,
        )
    if policy is None or policy.kind != "regime_breakout_v2":
        raise ValueError("strategy_policy_unsupported")
    if not isinstance(state, StrategyRuntimeState):
        raise ValueError("strategy_runtime_policy_mismatch")
    if state.strategy_revision != strategy.revision:
        raise ValueError("strategy_runtime_revision_mismatch")
    if not context.decision_bars or not context.base_bars:
        raise ValueError("strategy_market_context_incomplete")
    if position.quantity > 0:
        if (
            state.entry_filled_at is None
            or state.entry_decision_count is None
            or state.entry_price <= 0
            or state.atr_at_entry is None
            or state.active_stop is None
        ):
            raise ValueError("strategy_runtime_position_state_mismatch")
    elif any(
        value is not None
        for value in (state.entry_filled_at, state.entry_decision_count, state.atr_at_entry, state.active_stop)
    ) or state.entry_price != 0:
        raise ValueError("strategy_runtime_position_state_mismatch")

    decision_bar = context.decision_bars[-1]
    evaluated_at = context.base_bars[-1].timestamp
    if state.last_decision_5m_bar_at is not None and decision_bar.timestamp <= state.last_decision_5m_bar_at:
        return _evaluation(
            strategy=strategy,
            context=context,
            state_before=state,
            state_after=state,
            action="hold",
            reason="no_new_complete_decision_bar",
            decision_bar=decision_bar,
            evaluated_at=evaluated_at,
            breakout_event_id=None,
            atr_value=None,
            active_stop=state.active_stop,
            gates={},
        )

    elapsed_decisions = 1
    if state.last_decision_5m_bar_at is not None:
        elapsed_decisions = max(
            1,
            int((decision_bar.timestamp - state.last_decision_5m_bar_at).total_seconds() // 300),
        )
    next_count = state.decision_count + elapsed_decisions
    breakout_ready = len(context.decision_bars) > policy.breakout.lookback_bars
    volume_ready = len(context.decision_bars) > policy.volume.sma_window
    regime_ready = len(context.regime_bars) >= (
        policy.regime.close_above_sma_window + policy.regime.sma_slope_lookback_bars
    )
    atr_value = (
        context.atr_value
        if context.atr_value is not None
        else _wilder_atr(list(context.decision_bars), policy.atr.window)
    )
    atr_ready = atr_value is not None

    current_decision_index = len(context.decision_bars) - 1
    prior_high = _prior_high(
        list(context.decision_bars),
        current_decision_index,
        policy.breakout.lookback_bars,
    )
    breakout_condition = prior_high is not None and decision_bar.close > prior_high
    prior_breakout_active = state.breakout_condition_active
    if elapsed_decisions > 1:
        previous_high = _prior_high(
            list(context.decision_bars),
            current_decision_index - 1,
            policy.breakout.lookback_bars,
        )
        prior_breakout_active = (
            previous_high is not None
            and context.decision_bars[current_decision_index - 1].close > previous_high
        )
    breakout_event = breakout_condition and not prior_breakout_active
    breakout_event_id = (
        canonical_sha256(
            {
                "strategyRevision": strategy.revision,
                "decisionBarAt": decision_bar.timestamp.isoformat(),
                "priorHigh": prior_high,
            }
        )[:20]
        if breakout_event
        else None
    )

    volume_average = (
        fmean(bar.volume for bar in context.decision_bars[-policy.volume.sma_window - 1 : -1])
        if volume_ready
        else None
    )
    volume_confirmed = (
        volume_average is not None and decision_bar.volume >= volume_average * policy.volume.multiplier
    )
    regime_open = _regime_open(strategy, context)
    cooldown_complete = next_count > state.cooldown_until_decision_count

    state_after = replace(
        state,
        last_decision_5m_bar_at=decision_bar.timestamp,
        decision_count=next_count,
        breakout_condition_active=breakout_condition,
        last_breakout_event_id=breakout_event_id or state.last_breakout_event_id,
    )
    action: Literal["hold", "buy", "sell"] = "hold"
    reason = "conditions_not_met"
    active_stop = state.active_stop

    if position.quantity > 0:
        entry_price = state.entry_price or position.entry_price
        highest_high = max(state.highest_high or entry_price, decision_bar.high)
        highest_close = max(state.highest_close or entry_price, decision_bar.close)
        entry_atr = state.atr_at_entry or atr_value
        trigger_stop = state.active_stop
        if active_stop is None and entry_atr is not None:
            active_stop = entry_price - policy.atr.initial_multiple * entry_atr
        if (
            atr_value is not None
            and highest_close > entry_price
            and policy.atr.trailing_starts_after_profit
        ):
            trailing_stop = highest_high - policy.atr.trailing_multiple * atr_value
            active_stop = max(active_stop if active_stop is not None else trailing_stop, trailing_stop)
        state_after = replace(
            state_after,
            highest_high=highest_high,
            highest_close=highest_close,
            active_stop=active_stop,
        )
        bars_held = (
            next_count - state.entry_decision_count
            if state.entry_decision_count is not None
            else 0
        )
        positive_progress = highest_close > entry_price
        if trigger_stop is not None and decision_bar.low <= trigger_stop:
            action = "sell"
            reason = "atr_stop"
            active_stop = trigger_stop
            state_after = replace(state_after, active_stop=trigger_stop)
        elif not regime_open:
            action = "sell"
            reason = "regime_gate_closed"
        elif bars_held >= policy.holding.max_bars and not positive_progress:
            action = "sell"
            reason = "no_positive_progress"
    elif not all((breakout_ready, volume_ready, regime_ready, atr_ready)):
        reason = "indicator_warmup"
    elif not cooldown_complete:
        reason = "cooldown_active"
    elif breakout_event and volume_confirmed and regime_open:
        action = "buy"
        reason = "regime_breakout"

    gates = {
        "breakoutReady": breakout_ready,
        "breakoutEvent": breakout_event,
        "volumeReady": volume_ready,
        "volumeConfirmed": volume_confirmed,
        "regimeReady": regime_ready,
        "regimeOpen": regime_open,
        "atrReady": atr_ready,
        "cooldownComplete": cooldown_complete,
    }
    return _evaluation(
        strategy=strategy,
        context=context,
        state_before=state,
        state_after=state_after,
        action=action,
        reason=reason,
        decision_bar=decision_bar,
        evaluated_at=evaluated_at,
        breakout_event_id=breakout_event_id,
        atr_value=atr_value,
        active_stop=active_stop,
        gates=gates,
    )


def _evaluate_cost_aware_range_reversion(
    strategy: StrategyConfig,
    policy: CostAwareRangeReversionPolicy,
    context: MarketContext,
    position: PositionSnapshot,
    state: CostAwareRangeReversionRuntimeState,
) -> StrategyEvaluation:
    if state.strategy_revision != strategy.revision:
        raise ValueError("strategy_runtime_revision_mismatch")
    if not context.decision_bars or not context.base_bars:
        raise ValueError("strategy_market_context_incomplete")
    if position.quantity > 0:
        if (
            state.entry_filled_at is None
            or state.entry_decision_count is None
            or state.entry_price <= 0
            or state.atr_at_entry is None
            or state.active_stop is None
        ):
            raise ValueError("strategy_runtime_position_state_mismatch")
    elif any(
        value is not None
        for value in (
            state.entry_filled_at,
            state.entry_decision_count,
            state.atr_at_entry,
            state.active_stop,
        )
    ) or state.entry_price != 0:
        raise ValueError("strategy_runtime_position_state_mismatch")

    decision_bar = context.decision_bars[-1]
    evaluated_at = context.base_bars[-1].timestamp
    if (
        state.last_decision_4h_bar_at is not None
        and decision_bar.timestamp <= state.last_decision_4h_bar_at
    ):
        return _evaluation(
            strategy=strategy,
            context=context,
            state_before=state,
            state_after=state,
            action="hold",
            reason="no_new_complete_decision_bar",
            decision_bar=decision_bar,
            evaluated_at=evaluated_at,
            breakout_event_id=state.armed_reversion_event_id,
            atr_value=None,
            active_stop=state.active_stop,
            gates={},
        )

    elapsed_decisions = 1
    if state.last_decision_4h_bar_at is not None:
        elapsed_decisions = max(
            1,
            int(
                (decision_bar.timestamp - state.last_decision_4h_bar_at).total_seconds()
                // (4 * 60 * 60)
            ),
        )
    next_count = state.decision_count + elapsed_decisions
    closes = [bar.close for bar in context.decision_bars]
    previous_score = _population_z_score(
        closes[:-1],
        policy.reversion.z_score_window,
    )
    previous_z = previous_score[1] if previous_score is not None else None
    z_score = context.z_score_value
    z_mean = context.z_score_mean_value
    range_ready = context.fast_ema_value is not None and context.slow_ema_value is not None
    range_open = bool(
        range_ready
        and context.slow_ema_value
        and abs(context.fast_ema_value / context.slow_ema_value - 1)
        <= policy.range_regime.maximum_separation_pct
    )
    atr_value = (
        context.atr_value
        if context.atr_value is not None
        else _wilder_atr(list(context.decision_bars), policy.atr.window)
    )
    atr_ready = atr_value is not None
    z_score_ready = z_score is not None and z_mean is not None and previous_z is not None
    below_threshold = z_score is not None and z_score <= policy.reversion.entry_z_threshold
    prior_below_threshold = state.reversion_condition_active
    if elapsed_decisions > 1:
        prior_below_threshold = (
            previous_z is not None
            and previous_z <= policy.reversion.entry_z_threshold
        )
    breach_event = below_threshold and not prior_below_threshold
    breach_event_id = (
        canonical_sha256(
            {
                "strategyRevision": strategy.revision,
                "decisionBarAt": decision_bar.timestamp.isoformat(),
                "zScore": z_score,
                "entryZThreshold": policy.reversion.entry_z_threshold,
            }
        )[:20]
        if breach_event
        else None
    )
    cooldown_complete = next_count >= state.cooldown_until_decision_count
    armed_event_id = state.armed_reversion_event_id
    armed_at = state.armed_at_decision_count
    if armed_event_id is not None and armed_at is not None:
        event_age = next_count - armed_at
        if not range_open or event_age > policy.reversion.recovery_window_bars:
            armed_event_id = None
            armed_at = None
    else:
        event_age = None
    expiring_event_id = (
        armed_event_id
        if event_age is not None
        and event_age >= policy.reversion.recovery_window_bars
        else None
    )

    state_after = replace(
        state,
        last_decision_4h_bar_at=decision_bar.timestamp,
        decision_count=next_count,
        reversion_condition_active=below_threshold,
        armed_reversion_event_id=armed_event_id,
        armed_at_decision_count=armed_at,
    )
    action: Literal["hold", "buy", "sell"] = "hold"
    reason = "conditions_not_met"
    expected_distance = (
        (z_mean - decision_bar.close) / decision_bar.close
        if z_mean is not None and decision_bar.close > 0
        else None
    )
    close_rising = len(closes) > 1 and decision_bar.close > closes[-2]
    z_score_rising = z_score is not None and previous_z is not None and z_score > previous_z
    negative_z_score = z_score is not None and z_score < 0
    expected_distance_ready = (
        expected_distance is not None
        and expected_distance >= policy.reversion.minimum_expected_distance_pct
    )
    recovery = bool(
        armed_event_id is not None
        and event_age is not None
        and 1 <= event_age <= policy.reversion.recovery_window_bars
        and close_rising
        and z_score_rising
        and negative_z_score
        and expected_distance_ready
        and range_open
    )

    if position.quantity > 0:
        bars_held = (
            next_count - state.entry_decision_count
            if state.entry_decision_count is not None
            else 0
        )
        if state.active_stop is not None and decision_bar.low <= state.active_stop:
            action = "sell"
            reason = "atr_stop"
        elif z_score is not None and z_score >= policy.exit.z_score_threshold:
            action = "sell"
            reason = "z_score_mean_reached"
        elif policy.exit.exit_on_range_close and not range_open:
            action = "sell"
            reason = "range_regime_closed"
        elif bars_held >= policy.holding.max_bars:
            action = "sell"
            reason = "maximum_holding_bars"
        else:
            reason = "position_open"
    elif not all((range_ready, z_score_ready, atr_ready)):
        reason = "indicator_warmup"
    elif recovery and cooldown_complete:
        action = "buy"
        reason = "range_reversion_recovery"
    elif breach_event and range_open:
        armed_event_id = breach_event_id
        armed_at = next_count
        state_after = replace(
            state_after,
            armed_reversion_event_id=armed_event_id,
            armed_at_decision_count=armed_at,
        )
        reason = "reversion_event_armed"
    elif not cooldown_complete:
        reason = "cooldown_active"

    if (
        action != "buy"
        and armed_event_id == expiring_event_id
        and armed_event_id is not None
        and event_age is not None
        and event_age >= policy.reversion.recovery_window_bars
    ):
        armed_event_id = None
        armed_at = None
        state_after = replace(
            state_after,
            armed_reversion_event_id=None,
            armed_at_decision_count=None,
        )

    gates = {
        "rangeReady": range_ready,
        "rangeOpen": range_open,
        "zScoreReady": z_score_ready,
        "atrReady": atr_ready,
        "breachEvent": breach_event,
        "recovery": recovery,
        "closeRising": close_rising,
        "zScoreRising": z_score_rising,
        "negativeZScore": negative_z_score,
        "expectedDistanceReady": expected_distance_ready,
        "cooldownComplete": cooldown_complete,
    }
    return _evaluation(
        strategy=strategy,
        context=context,
        state_before=state,
        state_after=state_after,
        action=action,
        reason=reason,
        decision_bar=decision_bar,
        evaluated_at=evaluated_at,
        breakout_event_id=armed_event_id or breach_event_id,
        atr_value=atr_value,
        active_stop=state.active_stop,
        gates=gates,
    )


def apply_fill(
    strategy: StrategyConfig,
    evaluation: StrategyEvaluation,
    *,
    side: Literal["buy", "sell"],
    price: float,
    filled_at: datetime,
) -> RuntimeState:
    policy = strategy.policy
    if policy is None:
        raise ValueError("strategy_policy_required")
    state = evaluation.state_after
    if isinstance(policy, CostAwareRangeReversionPolicy):
        if not isinstance(state, CostAwareRangeReversionRuntimeState):
            raise ValueError("strategy_runtime_policy_mismatch")
        if side == "buy":
            if evaluation.atr is None:
                raise ValueError("strategy_entry_atr_required")
            return replace(
                state,
                armed_reversion_event_id=None,
                armed_at_decision_count=None,
                entry_filled_at=filled_at,
                entry_decision_count=state.decision_count,
                entry_price=price,
                atr_at_entry=evaluation.atr,
                active_stop=price - policy.atr.initial_multiple * evaluation.atr,
            )
        return replace(
            state,
            entry_filled_at=None,
            entry_decision_count=None,
            entry_price=0.0,
            atr_at_entry=None,
            active_stop=None,
            cooldown_until_decision_count=state.decision_count + policy.cooldown.bars,
        )
    if not isinstance(state, StrategyRuntimeState):
        raise ValueError("strategy_runtime_policy_mismatch")
    if side == "buy":
        if evaluation.atr is None:
            raise ValueError("strategy_entry_atr_required")
        return replace(
            state,
            entry_filled_at=filled_at,
            entry_decision_count=state.decision_count,
            entry_price=price,
            atr_at_entry=evaluation.atr,
            highest_high=price,
            highest_close=price,
            active_stop=price - policy.atr.initial_multiple * evaluation.atr,
        )
    return replace(
        state,
        entry_filled_at=None,
        entry_decision_count=None,
        entry_price=0.0,
        atr_at_entry=None,
        highest_high=0.0,
        highest_close=0.0,
        active_stop=None,
        cooldown_until_decision_count=state.decision_count + policy.cooldown.bars,
    )


def size_entry(
    strategy: StrategyConfig,
    *,
    equity: float,
    available_cash: float,
    execution_price: float,
    atr_value: float,
    fee_rate: float,
    slippage_rate: float,
    quantity_step: float = 0.00001,
    minimum_notional: float = 5.0,
) -> EntrySizing:
    policy = strategy.policy
    risk = strategy.risk
    if policy is None or risk.risk_budget_pct is None:
        return EntrySizing(0.0, 0.0, "risk_configuration_missing")
    unit_loss = policy.atr.initial_multiple * atr_value + execution_price * (
        fee_rate * 2 + slippage_rate
    )
    if execution_price <= 0 or unit_loss <= 0 or quantity_step <= 0:
        return EntrySizing(0.0, 0.0, "entry_sizing_invalid")
    quantity_limits = [
        equity * risk.risk_budget_pct / unit_loss,
        equity * risk.position_pct / execution_price,
        available_cash / (execution_price * (1 + fee_rate)),
    ]
    if risk.max_entry_notional_quote is not None:
        quantity_limits.append(risk.max_entry_notional_quote / execution_price)
    quantity = min(quantity_limits)
    quantity = math.floor(max(0.0, quantity) / quantity_step) * quantity_step
    notional = quantity * execution_price
    if quantity <= 0 or notional + 1e-12 < minimum_notional:
        return EntrySizing(0.0, 0.0, "venue_minimum_notional")
    return EntrySizing(quantity, notional, "ready")


def _regime_open(strategy: StrategyConfig, context: MarketContext) -> bool:
    policy = strategy.policy
    if policy is None:
        return False
    closes = [bar.close for bar in context.regime_bars]
    window = policy.regime.close_above_sma_window
    slope = policy.regime.sma_slope_lookback_bars
    current_index = len(closes) - 1
    previous_index = current_index - slope
    current_sma = _sma_at(closes, window, current_index)
    previous_sma = _sma_at(closes, window, previous_index)
    return (
        current_sma is not None
        and previous_sma is not None
        and closes[current_index] > current_sma
        and current_sma > previous_sma
    )


def _sma_at(values: list[float], window: int, index: int) -> float | None:
    start = index - window + 1
    if start < 0 or index >= len(values):
        return None
    return fmean(values[start : index + 1])


def _seeded_ema(
    values: list[float],
    window: int,
) -> float | None:
    if len(values) < window:
        return None
    current = fmean(values[:window])
    alpha = 2 / (window + 1)
    for value in values[window:]:
        current = alpha * value + (1 - alpha) * current
    return current


def _population_z_score(
    values: list[float],
    window: int,
) -> tuple[float, float] | None:
    if len(values) < window:
        return None
    sample = values[-window:]
    mean = fmean(sample)
    variance = fmean((value - mean) ** 2 for value in sample)
    return mean, ((sample[-1] - mean) / math.sqrt(variance) if variance > 0 else 0.0)


def _prior_high(bars: list[OHLCVBar], index: int, lookback: int) -> float | None:
    start = index - lookback
    if start < 0 or index <= 0 or index >= len(bars):
        return None
    return max(bar.high for bar in bars[start:index])


def _wilder_atr(bars: list[OHLCVBar], window: int) -> float | None:
    if len(bars) < window:
        return None
    true_ranges: list[float] = []
    for index, bar in enumerate(bars):
        if index == 0:
            true_ranges.append(bar.high - bar.low)
        else:
            previous_close = bars[index - 1].close
            true_ranges.append(
                max(
                    bar.high - bar.low,
                    abs(bar.high - previous_close),
                    abs(bar.low - previous_close),
                )
            )
    atr_value = fmean(true_ranges[:window])
    for true_range in true_ranges[window:]:
        atr_value = ((atr_value * (window - 1)) + true_range) / window
    return atr_value


def _evaluation(
    *,
    strategy: StrategyConfig,
    context: MarketContext,
    state_before: RuntimeState,
    state_after: RuntimeState,
    action: Literal["hold", "buy", "sell"],
    reason: str,
    decision_bar: OHLCVBar,
    evaluated_at: datetime,
    breakout_event_id: str | None,
    atr_value: float | None,
    active_stop: float | None,
    gates: dict[str, bool],
) -> StrategyEvaluation:
    evaluation_id = canonical_sha256(
        {
            "evaluatorVersion": _evaluator_version(strategy),
            "strategyRevision": strategy.revision,
            "contextHash": context.context_hash,
            "stateBeforeHash": state_before.state_hash,
            "decisionBarAt": decision_bar.timestamp.isoformat(),
        }
    )[:24]
    return StrategyEvaluation(
        evaluation_id=evaluation_id,
        action=action,
        reason=reason,
        evaluated_at=evaluated_at,
        decision_bar_at=decision_bar.timestamp,
        context_hash=context.context_hash,
        breakout_event_id=breakout_event_id,
        atr=atr_value,
        active_stop=active_stop,
        gates=gates,
        state_before_hash=state_before.state_hash,
        state_after=state_after,
    )


def _evaluator_version(strategy: StrategyConfig) -> str:
    if isinstance(strategy.policy, CostAwareRangeReversionPolicy):
        return (
            "cost-aware-range-reversion-evaluator-v1.1"
            if strategy.policy.kind == "cost_aware_range_reversion_v1_1"
            else "cost-aware-range-reversion-evaluator-v1"
        )
    return "strategy-evaluator-v2"


def _runtime_state_payload(state: RuntimeState) -> dict[str, Any]:
    payload = asdict(state)
    timestamp_keys = (
        ("last_decision_4h_bar_at", "entry_filled_at")
        if isinstance(state, CostAwareRangeReversionRuntimeState)
        else ("last_decision_5m_bar_at", "entry_filled_at")
    )
    for key in timestamp_keys:
        value = payload[key]
        payload[key] = value.isoformat() if isinstance(value, datetime) else None
    return payload


def _utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _optional_time_text(value: datetime | None) -> str | None:
    return value.isoformat() if value is not None else None


def _required_time(value: Any) -> datetime:
    parsed = _optional_time(value)
    if parsed is None:
        raise ValueError("strategy_runtime_timestamp_invalid")
    return parsed


def _optional_time(value: Any) -> datetime | None:
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise ValueError("strategy_runtime_timestamp_invalid")
    try:
        return _utc(datetime.fromisoformat(value.replace("Z", "+00:00")))
    except ValueError as error:
        raise ValueError("strategy_runtime_timestamp_invalid") from error


def _optional_number(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        raise ValueError("strategy_runtime_number_invalid")
    number = float(value)
    if not math.isfinite(number):
        raise ValueError("strategy_runtime_number_invalid")
    return number


def _optional_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None
