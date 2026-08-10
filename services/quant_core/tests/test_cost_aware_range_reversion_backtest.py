import unittest
from datetime import datetime, timedelta, timezone

from quant_core.backtest import (
    BacktestEngine,
    strategy_required_bars,
    strategy_required_fetch_bars,
)
from quant_core.canonical import canonical_sha256
from quant_core.decision_contract import (
    build_decision_contract,
    build_decision_proposal,
    build_standard_signal,
)
from quant_core.domain import (
    CostAwareRangeReversionKind,
    CostAwareRangeReversionPolicy,
    FixedAtrStopRule,
    MaximumHoldingRule,
    OHLCVBar,
    RangeRegimeRule,
    ReversionCooldownRule,
    ReversionEntryRule,
    ReversionExitRule,
    RiskRules,
    StrategyConfig,
)
from quant_core.strategy_evaluator import (
    PolicyMarketContextSession,
    PositionSnapshot,
    apply_fill,
    build_market_context,
    evaluate_strategy,
    initial_runtime_state,
    runtime_state_from_payload,
    runtime_state_to_payload,
    size_entry,
)


START = datetime(2026, 1, 1, tzinfo=timezone.utc)
INDICATOR_ANCHOR_BARS = 139
LEGACY_INDICATOR_ANCHOR_BARS = 42


def _strategy(
    *,
    entry_z_threshold: float = -2.0,
    policy_kind: CostAwareRangeReversionKind = "cost_aware_range_reversion_v1_1",
    indicator_anchor_bars: int = INDICATOR_ANCHOR_BARS,
) -> StrategyConfig:
    return StrategyConfig(
        name=(
            "Cost-aware range reversion v1.1 fixture"
            if policy_kind == "cost_aware_range_reversion_v1_1"
            else "Cost-aware range reversion v1 fixture"
        ),
        market="crypto",
        symbols=["BTC/USDT"],
        timeframe="1m",
        version=2,
        entry_conditions=[],
        exit_conditions=[],
        policy=CostAwareRangeReversionPolicy(
            kind=policy_kind,
            decision_timeframe="4h",
            completed_bars_only=True,
            fill_timing="next_completed_bar_open",
            range_regime=RangeRegimeRule(
                fast_ema_window=6,
                slow_ema_window=42,
                indicator_anchor_bars=indicator_anchor_bars,
                maximum_separation_pct=0.01,
                ema_seed="first_complete_window_sma",
                ema_alpha="2/(window+1)",
            ),
            reversion=ReversionEntryRule(
                z_score_window=24,
                standard_deviation="population",
                entry_z_threshold=entry_z_threshold,
                recovery_window_bars=3,
                minimum_expected_distance_pct=0.012,
                require_close_rising=True,
                require_z_score_rising=True,
                require_negative_z_score=True,
                one_shot_per_event=True,
            ),
            atr=FixedAtrStopRule(
                window=14,
                smoothing="wilder",
                initial_multiple=2.5,
                fixed_from_entry=True,
                never_loosen=True,
            ),
            exit=ReversionExitRule(
                z_score_threshold=0,
                exit_on_range_close=True,
            ),
            holding=MaximumHoldingRule(max_bars=18),
            cooldown=ReversionCooldownRule(
                bars=6,
                starts_after="filled_exit",
                requires_new_reversion_event=True,
            ),
        ),
        risk=RiskRules(
            position_pct=0.6,
            risk_budget_pct=0.015,
            max_drawdown_pct=0.03,
            daily_loss_limit_pct=0.02,
            max_trade_groups_per_hour=1,
            max_entry_notional_quote=None,
            exit_notional_cap_quote=None,
        ),
    )


def _one_minute_bars(
    decision_closes: list[float],
    *,
    decision_high_low: dict[int, tuple[float, float]] | None = None,
    following_open: float | None = None,
    following_close: float | None = None,
) -> list[OHLCVBar]:
    bars: list[OHLCVBar] = []
    decision_high_low = decision_high_low or {}
    for decision_index, close in enumerate(decision_closes):
        bucket_start = START + timedelta(hours=decision_index * 4)
        high, low = decision_high_low.get(
            decision_index,
            (close + 0.1, close - 0.1),
        )
        for minute in range(240):
            bars.append(
                OHLCVBar(
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    timestamp=bucket_start + timedelta(minutes=minute),
                    open=close,
                    high=high,
                    low=low,
                    close=close,
                    volume=1,
                )
            )
    if following_open is not None:
        close = following_close if following_close is not None else following_open
        bars.append(
            OHLCVBar(
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                timestamp=START + timedelta(hours=len(decision_closes) * 4),
                open=following_open,
                high=max(following_open, close) + 0.1,
                low=min(following_open, close) - 0.1,
                close=close,
                volume=1,
            )
        )
    return bars


class CostAwareRangeReversionBacktestTests(unittest.TestCase):
    def test_decision_contract_can_keep_base_evidence_but_use_four_hour_signal_identity(self):
        bars = _one_minute_bars([100.0])[-2:]
        decision_bar_at = START.isoformat()
        generated_at = bars[-1].timestamp

        contract = build_decision_contract(
            bars=bars,
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            data_source="test",
            strategy_id="cost-aware-range-reversion-v1.1",
            strategy_revision=_strategy().revision,
            proposal_action="buy",
            proposal_confidence=1,
            proposal_reason="range_reversion_recovery",
            provider_id="rules",
            current_quantity=0,
            reference_price=100,
            available_cash=10,
            order_notional=5,
            fee_rate=0.001,
            daily_drawdown_pct=0,
            daily_loss_limit_pct=2,
            profit_drawdown_pct=0,
            profit_drawdown_limit_pct=2,
            recent_trade_count=0,
            max_trades_per_hour=1,
            generated_at=generated_at,
            signal_timeframe="4h",
            evaluated_bar_at=decision_bar_at,
        )

        self.assertEqual(contract["marketSnapshot"]["timeframe"], "1m")
        self.assertEqual(contract["signal"]["horizon"], "4h")
        self.assertEqual(contract["signal"]["evaluatedBarAt"], decision_bar_at)
        self.assertEqual(
            contract["signal"]["expiresAt"],
            (generated_at + timedelta(hours=4)).isoformat(),
        )

    def test_required_fetch_bars_cover_slow_ema_and_partial_four_hour_bucket(self):
        strategy = _strategy()

        self.assertEqual(
            strategy_required_bars(strategy),
            INDICATOR_ANCHOR_BARS * 240,
        )
        self.assertEqual(
            strategy_required_fetch_bars(strategy),
            INDICATOR_ANCHOR_BARS * 240 + 239,
        )

        legacy = _strategy(
            policy_kind="cost_aware_range_reversion_v1",
            indicator_anchor_bars=LEGACY_INDICATOR_ANCHOR_BARS,
        )
        self.assertEqual(
            strategy_required_bars(legacy),
            LEGACY_INDICATOR_ANCHOR_BARS * 240,
        )
        self.assertEqual(
            strategy_required_fetch_bars(legacy),
            LEGACY_INDICATOR_ANCHOR_BARS * 240 + 239,
        )

    def test_breach_arms_and_recovery_fills_at_the_next_one_minute_open(self):
        bars = _one_minute_bars(
            [*[100.0] * INDICATOR_ANCHOR_BARS, 98.0, 98.6],
            following_open=99.0,
            following_close=99.5,
        )

        result = BacktestEngine(
            initial_cash=10,
            fee_rate=0.001,
            slippage_rate=0.001,
        ).run(_strategy(), bars)

        self.assertEqual([trade.side for trade in result.trades], ["buy", "sell"])
        buy = result.trades[0]
        self.assertEqual(
            buy.timestamp,
            START + timedelta(hours=(INDICATOR_ANCHOR_BARS + 2) * 4),
        )
        self.assertAlmostEqual(buy.price, 99.0 * 1.001)
        self.assertEqual(buy.reason, "range_reversion_recovery")
        self.assertGreaterEqual(buy.price * buy.quantity, 5.0)
        self.assertLessEqual(buy.price * buy.quantity, 6.0)

        strategy = _strategy()
        session = PolicyMarketContextSession(strategy)
        state = initial_runtime_state(strategy)
        evaluation = None
        for bar in bars[: (INDICATOR_ANCHOR_BARS + 2) * 240]:
            context = session.ingest(bar)
            if context is not None:
                evaluation = evaluate_strategy(
                    strategy,
                    context,
                    PositionSnapshot(),
                    state,
                )
                state = evaluation.state_after
        assert evaluation is not None
        proposal = build_decision_proposal(
            snapshot_hash=evaluation.context_hash,
            strategy_revision=strategy.revision,
            proposal_action="buy",
            proposal_confidence=1,
            proposal_reason=evaluation.reason,
            provider_id="rules",
            proposed_at=evaluation.evaluated_at,
        )
        signal = build_standard_signal(
            proposal,
            strategy_id=f"strategy-{strategy.revision}",
            timeframe="4h",
            evaluated_bar_at=evaluation.decision_bar_at.isoformat(),
            generated_at=evaluation.evaluated_at,
            current_quantity=0,
        )
        self.assertEqual(buy.snapshot_hash, evaluation.context_hash)
        self.assertEqual(buy.proposal_id, proposal["proposalId"])
        self.assertEqual(buy.signal_id, signal["signalId"])

    def test_z_score_mean_exit_fills_at_the_next_one_minute_open(self):
        bars = _one_minute_bars(
            [*[100.0] * INDICATOR_ANCHOR_BARS, 98.0, 98.6, 100.5],
            following_open=101.0,
        )

        result = BacktestEngine(
            initial_cash=10,
            fee_rate=0.001,
            slippage_rate=0.001,
        ).run(_strategy(), bars)

        self.assertEqual([trade.side for trade in result.trades], ["buy", "sell"])
        sell = result.trades[-1]
        self.assertEqual(
            sell.timestamp,
            START + timedelta(hours=(INDICATOR_ANCHOR_BARS + 3) * 4),
        )
        self.assertAlmostEqual(sell.price, 101.0 * 0.999)
        self.assertEqual(sell.reason, "z_score_mean_reached")

    def test_range_close_exits_a_position_while_z_score_is_still_negative(self):
        bars = _one_minute_bars(
            [*[100.0] * INDICATOR_ANCHOR_BARS, 98.0, 98.6, 95.0],
            following_open=96.0,
        )

        result = BacktestEngine(
            initial_cash=10,
            fee_rate=0.001,
            slippage_rate=0.001,
        ).run(_strategy(), bars)

        self.assertEqual([trade.side for trade in result.trades], ["buy", "sell"])
        self.assertEqual(result.trades[-1].reason, "range_regime_closed")
        self.assertEqual(
            result.trades[-1].timestamp,
            START + timedelta(hours=(INDICATOR_ANCHOR_BARS + 3) * 4),
        )

    def test_fixed_entry_atr_stop_uses_the_prior_state_and_fills_next_minute(self):
        bars = _one_minute_bars(
            [*[100.0] * INDICATOR_ANCHOR_BARS, 98.0, 98.6, 98.8],
            decision_high_low={INDICATOR_ANCHOR_BARS + 2: (105.0, 97.8)},
            following_open=98.2,
        )

        result = BacktestEngine(
            initial_cash=10,
            fee_rate=0.001,
            slippage_rate=0.001,
        ).run(_strategy(), bars)

        self.assertEqual([trade.side for trade in result.trades], ["buy", "sell"])
        self.assertEqual(result.trades[-1].reason, "atr_stop")
        self.assertEqual(
            result.trades[-1].timestamp,
            START + timedelta(hours=(INDICATOR_ANCHOR_BARS + 3) * 4),
        )
        self.assertAlmostEqual(result.trades[-1].price, 98.2 * 0.999)

    def test_maximum_holding_exit_occurs_after_eighteen_complete_four_hour_bars(self):
        held_closes = [99.0] * 18
        bars = _one_minute_bars(
            [
                *[100.0] * INDICATOR_ANCHOR_BARS,
                98.0,
                98.6,
                *held_closes,
            ],
            following_open=98.5,
        )

        result = BacktestEngine(
            initial_cash=10,
            fee_rate=0.001,
            slippage_rate=0.001,
        ).run(_strategy(), bars)

        self.assertEqual([trade.side for trade in result.trades], ["buy", "sell"])
        self.assertEqual(result.trades[-1].reason, "maximum_holding_bars")
        self.assertEqual(
            result.trades[-1].timestamp,
            START + timedelta(hours=(INDICATOR_ANCHOR_BARS + 20) * 4),
        )

    def test_venue_minimum_notional_keeps_a_valid_signal_as_hold(self):
        strategy = _strategy()
        sizing = size_entry(
            strategy,
            equity=10,
            available_cash=10,
            execution_price=100,
            atr_value=2,
            fee_rate=0.001,
            slippage_rate=0.001,
        )
        bars = _one_minute_bars(
            [*[100.0] * INDICATOR_ANCHOR_BARS, 98.0, 98.6],
            decision_high_low={
                index: (101.0, 99.0)
                for index in range(INDICATOR_ANCHOR_BARS)
            },
            following_open=99.0,
        )

        result = BacktestEngine(
            initial_cash=10,
            fee_rate=0.001,
            slippage_rate=0.001,
        ).run(strategy, bars)

        self.assertEqual(sizing.quantity, 0)
        self.assertEqual(sizing.reason, "venue_minimum_notional")
        self.assertEqual(result.trades, [])


class CostAwareRangeReversionEvaluatorTests(unittest.TestCase):
    def test_v11_waits_for_all_139_anchor_bars_before_indicators_can_trade(self):
        strategy = _strategy()
        session = PolicyMarketContextSession(strategy)
        context = None
        for bar in _one_minute_bars([100.0] * (INDICATOR_ANCHOR_BARS - 1)):
            completed = session.ingest(bar)
            if completed is not None:
                context = completed

        self.assertIsNotNone(context)
        assert context is not None
        self.assertIsNone(context.fast_ema_value)
        self.assertIsNone(context.slow_ema_value)
        self.assertIsNone(context.atr_value)

        result = BacktestEngine(
            initial_cash=10,
            fee_rate=0.001,
            slippage_rate=0.001,
        ).run(
            strategy,
            _one_minute_bars(
                [
                    *[100.0] * (INDICATOR_ANCHOR_BARS - 3),
                    98.0,
                    98.6,
                ],
                following_open=99.0,
            ),
        )
        self.assertEqual(result.trades, [])

        for bar in _one_minute_bars([100.0] * INDICATOR_ANCHOR_BARS)[
            (INDICATOR_ANCHOR_BARS - 1) * 240 :
        ]:
            completed = session.ingest(bar)
            if completed is not None:
                context = completed
        assert context is not None
        self.assertIsNotNone(context.fast_ema_value)
        self.assertIsNotNone(context.slow_ema_value)
        self.assertIsNotNone(context.atr_value)

        legacy = _strategy(
            policy_kind="cost_aware_range_reversion_v1",
            indicator_anchor_bars=LEGACY_INDICATOR_ANCHOR_BARS,
        )
        legacy_context = build_market_context(
            legacy,
            _one_minute_bars([100.0] * LEGACY_INDICATOR_ANCHOR_BARS),
        )
        self.assertIsNotNone(legacy_context.slow_ema_value)

    def test_missing_one_minute_bar_fails_closed(self):
        bars = _one_minute_bars([100.0] * 42)
        del bars[123]

        with self.assertRaisesRegex(
            ValueError,
            "^strategy_market_context_not_contiguous$",
        ):
            BacktestEngine(
                initial_cash=10,
                fee_rate=0.001,
                slippage_rate=0.001,
            ).run(_strategy(), bars)

    def test_missing_complete_four_hour_bucket_fails_closed(self):
        bars = _one_minute_bars([100.0] * 43)
        del bars[10 * 240 : 11 * 240]

        with self.assertRaisesRegex(
            ValueError,
            "^strategy_market_context_not_contiguous$",
        ):
            BacktestEngine(
                initial_cash=10,
                fee_rate=0.001,
                slippage_rate=0.001,
            ).run(_strategy(), bars)

    def test_adjacent_recent_window_rebuilds_match_one_continuous_session(self):
        strategy = _strategy()
        closes = [
            100.0 + index * 0.01 + (index % 7 - 3) * 0.2
            for index in range(INDICATOR_ANCHOR_BARS + 7)
        ]
        bars = _one_minute_bars(closes)
        continuous = PolicyMarketContextSession(strategy)
        continuous_contexts = {}

        for index, bar in enumerate(bars):
            continuous.ingest(bar)
            if index + 1 in {len(bars) - 1, len(bars)}:
                continuous_contexts[index + 1] = continuous.latest_context()

        for prefix_length in (len(bars) - 1, len(bars)):
            recent = bars[:prefix_length][-strategy_required_fetch_bars(strategy) :]
            rebuilt = build_market_context(strategy, recent)

            self.assertEqual(rebuilt, continuous_contexts[prefix_length])

    def test_recovery_identity_and_runtime_state_survive_restart(self):
        strategy = _strategy()
        session = PolicyMarketContextSession(strategy)
        state = initial_runtime_state(strategy)
        evaluation = None
        bars = _one_minute_bars(
            [*[100.0] * INDICATOR_ANCHOR_BARS, 98.0, 98.6]
        )

        for bar in bars:
            context = session.ingest(bar)
            if context is None:
                continue
            evaluation = evaluate_strategy(
                strategy,
                context,
                PositionSnapshot(),
                state,
            )
            state = evaluation.state_after

        self.assertIsNotNone(evaluation)
        assert evaluation is not None
        self.assertEqual(evaluation.action, "buy")
        self.assertEqual(
            evaluation.decision_bar_at,
            START + timedelta(hours=(INDICATOR_ANCHOR_BARS + 1) * 4),
        )
        self.assertEqual(
            evaluation.evaluated_at,
            START
            + timedelta(hours=(INDICATOR_ANCHOR_BARS + 2) * 4)
            - timedelta(minutes=1),
        )
        self.assertEqual(
            evaluation.evaluation_id,
            canonical_sha256(
                {
                    "evaluatorVersion": "cost-aware-range-reversion-evaluator-v1.1",
                    "strategyRevision": strategy.revision,
                    "contextHash": evaluation.context_hash,
                    "stateBeforeHash": evaluation.state_before_hash,
                    "decisionBarAt": evaluation.decision_bar_at.isoformat(),
                }
            )[:24],
        )
        restored = runtime_state_from_payload(
            strategy,
            runtime_state_to_payload(evaluation.state_after),
        )
        self.assertEqual(restored, evaluation.state_after)
        self.assertEqual(restored.state_hash, evaluation.state_after_hash)

    def test_persistent_low_z_does_not_rearm_and_event_expires_after_three_bars(self):
        strategy = _strategy()
        session = PolicyMarketContextSession(strategy)
        state = initial_runtime_state(strategy)
        evaluations = []

        for bar in _one_minute_bars(
            [
                *[100.0] * INDICATOR_ANCHOR_BARS,
                98.5,
                98.4,
                98.3,
                98.2,
            ]
        ):
            context = session.ingest(bar)
            if context is None:
                continue
            evaluation = evaluate_strategy(
                strategy,
                context,
                PositionSnapshot(),
                state,
            )
            state = evaluation.state_after
            evaluations.append(evaluation)

        armed = [item for item in evaluations if item.reason == "reversion_event_armed"]
        self.assertEqual(len(armed), 1)
        event_id = armed[0].state_after.armed_reversion_event_id
        self.assertIsNotNone(event_id)
        self.assertNotIn("buy", [item.action for item in evaluations])
        self.assertIsNone(state.armed_reversion_event_id)
        self.assertIsNone(state.armed_at_decision_count)

    def test_new_breach_on_expiring_events_third_bar_remains_armed(self):
        strategy = _strategy()
        session = PolicyMarketContextSession(strategy)
        state = initial_runtime_state(strategy)
        first_event_id = None
        final_evaluation = None

        for bar in _one_minute_bars(
            [
                *[100.0] * INDICATOR_ANCHOR_BARS,
                98.0,
                99.5,
                100.0,
                98.0,
            ]
        ):
            context = session.ingest(bar)
            if context is None:
                continue
            evaluation = evaluate_strategy(
                strategy,
                context,
                PositionSnapshot(),
                state,
            )
            state = evaluation.state_after
            if evaluation.reason == "reversion_event_armed" and first_event_id is None:
                first_event_id = state.armed_reversion_event_id
            final_evaluation = evaluation

        self.assertIsNotNone(first_event_id)
        self.assertIsNotNone(final_evaluation)
        assert final_evaluation is not None
        self.assertEqual(final_evaluation.reason, "reversion_event_armed")
        self.assertTrue(final_evaluation.gates["breachEvent"])
        self.assertIsNotNone(state.armed_reversion_event_id)
        self.assertNotEqual(state.armed_reversion_event_id, first_event_id)
        self.assertEqual(state.armed_at_decision_count, state.decision_count)

    def test_filled_exit_starts_six_bar_cooldown_and_survives_runtime_restart(self):
        strategy = _strategy()
        session = PolicyMarketContextSession(strategy)
        state = initial_runtime_state(strategy)
        position = PositionSnapshot()
        exit_count = None
        cooldown_gates = []
        post_exit_actions = []

        for bar in _one_minute_bars(
            [
                *[100.0] * INDICATOR_ANCHOR_BARS,
                98.0,
                98.6,
                100.5,
                *[100.5] * 7,
            ]
        ):
            context = session.ingest(bar)
            if context is None:
                continue
            evaluation = evaluate_strategy(strategy, context, position, state)
            state = evaluation.state_after
            if evaluation.action == "buy":
                state = apply_fill(
                    strategy,
                    evaluation,
                    side="buy",
                    price=98.7,
                    filled_at=evaluation.evaluated_at + timedelta(minutes=1),
                )
                position = PositionSnapshot(quantity=0.05, entry_price=98.7)
            elif evaluation.action == "sell":
                self.assertEqual(evaluation.reason, "z_score_mean_reached")
                state = apply_fill(
                    strategy,
                    evaluation,
                    side="sell",
                    price=100.4,
                    filled_at=evaluation.evaluated_at + timedelta(minutes=1),
                )
                position = PositionSnapshot()
                exit_count = evaluation.state_after.decision_count
                state = runtime_state_from_payload(
                    strategy,
                    runtime_state_to_payload(state),
                )
            elif exit_count is not None:
                cooldown_gates.append(evaluation.gates["cooldownComplete"])
                post_exit_actions.append(evaluation.action)

        self.assertIsNotNone(exit_count)
        assert exit_count is not None
        self.assertEqual(state.cooldown_until_decision_count, exit_count + 6)
        self.assertEqual(cooldown_gates, [False] * 5 + [True] * 2)
        self.assertNotIn("buy", post_exit_actions)
        self.assertIsNone(state.armed_reversion_event_id)


if __name__ == "__main__":
    unittest.main()
