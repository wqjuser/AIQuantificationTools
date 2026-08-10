from __future__ import annotations

import copy
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path

from quant_core.canonical import strategy_config_from_payload, strategy_config_to_payload
from quant_core.domain import (
    CostAwareRangeReversionPolicy,
    ReversionEntryRule,
    ReversionExitRule,
    StrategyConfig,
)
from quant_core.http_api.support.p0 import (
    _p0_strategy_config_from_payload,
    _p0_strategy_snapshot_from_payload,
)
from quant_core.strategy_experiment_store import StrategyExperimentCandidateRecord
from quant_core.strategy_experiments import (
    PolicyParameterDimension,
    StrategyExperimentError,
    _apply_adjacent_candidate_gate,
    expand_candidates,
)
from quant_core.strategy_library import (
    StrategyLibraryStore,
    strategy_library_record_to_payload,
)


def canonical_range_reversion_payload() -> dict[str, object]:
    return {
        "name": "BTC Cost-Aware Range Reversion v1",
        "market": "crypto",
        "symbols": ["BTC/USDT"],
        "timeframe": "1m",
        "version": 2,
        "entryConditions": [],
        "exitConditions": [],
        "policy": {
            "kind": "cost_aware_range_reversion_v1",
            "decisionTimeframe": "4h",
            "completedBarsOnly": True,
            "fillTiming": "next_completed_bar_open",
            "rangeRegime": {
                "fastEmaWindow": 6,
                "slowEmaWindow": 42,
                "indicatorAnchorBars": 42,
                "maximumSeparationPct": 0.01,
                "emaSeed": "first_complete_window_sma",
                "emaAlpha": "2/(window+1)",
            },
            "reversion": {
                "zScoreWindow": 24,
                "standardDeviation": "population",
                "entryZThreshold": -2.0,
                "recoveryWindowBars": 3,
                "minimumExpectedDistancePct": 0.012,
                "requireCloseRising": True,
                "requireZScoreRising": True,
                "requireNegativeZScore": True,
                "oneShotPerEvent": True,
            },
            "atr": {
                "window": 14,
                "smoothing": "wilder",
                "initialMultiple": 2.5,
                "fixedFromEntry": True,
                "neverLoosen": True,
            },
            "exit": {"zScoreThreshold": 0.0, "exitOnRangeClose": True},
            "holding": {"maxBars": 18},
            "cooldown": {
                "bars": 6,
                "startsAfter": "filled_exit",
                "requiresNewReversionEvent": True,
            },
        },
        "risk": {
            "positionPct": 0.6,
            "riskBudgetPct": 0.015,
            "stopLossPct": None,
            "takeProfitPct": None,
            "maxDrawdownPct": 0.03,
            "dailyLossLimitPct": 0.02,
            "maxTradeGroupsPerHour": 1,
            "maxEntryNotionalQuote": None,
            "exitNotionalCapQuote": None,
        },
    }


def canonical_range_reversion_v11_payload() -> dict[str, object]:
    payload = copy.deepcopy(canonical_range_reversion_payload())
    payload["name"] = "BTC Cost-Aware Range Reversion v1.1"
    policy = payload["policy"]
    if not isinstance(policy, dict):
        raise AssertionError("range reversion policy fixture must be an object")
    policy["kind"] = "cost_aware_range_reversion_v1_1"
    range_regime = policy["rangeRegime"]
    if not isinstance(range_regime, dict):
        raise AssertionError("range regime fixture must be an object")
    range_regime["indicatorAnchorBars"] = 139
    return payload


def canonical_regime_breakout_payload() -> dict[str, object]:
    return {
        "name": "Regime Breakout compatibility fixture",
        "market": "crypto",
        "symbols": ["BTC/USDT"],
        "timeframe": "1m",
        "version": 2,
        "entryConditions": [],
        "exitConditions": [],
        "policy": {
            "kind": "regime_breakout_v2",
            "decisionTimeframe": "5m",
            "completedBarsOnly": True,
            "fillTiming": "next_completed_bar_open",
            "regime": {
                "timeframe": "60m",
                "closeAboveSmaWindow": 40,
                "smaSlopeLookbackBars": 3,
            },
            "breakout": {
                "lookbackBars": 8,
                "excludeSignalBar": True,
                "oneShotPerEvent": True,
            },
            "volume": {
                "smaWindow": 20,
                "multiplier": 1.0,
                "excludeSignalBar": True,
            },
            "atr": {
                "window": 14,
                "smoothing": "wilder",
                "initialMultiple": 1,
                "trailingMultiple": 2,
                "trailingStartsAfterProfit": True,
                "trailingActivation": "positive_close",
                "anchor": "highest_high_since_entry",
                "neverLoosen": True,
            },
            "holding": {
                "maxBars": 48,
                "exitOnlyWithoutPositiveProgress": True,
                "progressDefinition": "highest_close_above_entry",
            },
            "cooldown": {
                "bars": 12,
                "startsAfter": "filled_exit",
                "requiresNewBreakoutEvent": True,
            },
        },
        "risk": {
            "positionPct": 0.6,
            "riskBudgetPct": 0.005,
            "stopLossPct": None,
            "takeProfitPct": None,
            "maxDrawdownPct": 0.03,
            "dailyLossLimitPct": 0.02,
            "maxTradeGroupsPerHour": 1,
            "maxEntryNotionalQuote": None,
            "exitNotionalCapQuote": None,
        },
    }


def set_path(payload: dict[str, object], path: tuple[str, ...], value: object) -> None:
    target = payload
    for segment in path[:-1]:
        nested = target[segment]
        if not isinstance(nested, dict):
            raise AssertionError(f"fixture path is not an object: {path}")
        target = nested
    target[path[-1]] = value


def p0_range_reversion_payload() -> dict[str, object]:
    canonical = canonical_range_reversion_v11_payload()
    return {
        "name": canonical["name"],
        "version": 2,
        "policy": copy.deepcopy(canonical["policy"]),
        "position": {"maxPositionPct": 60},
        "risk": {
            "riskBudgetPct": 1.5,
            "maxDrawdownPct": 3,
            "dailyLossLimitPct": 2,
            "maxTradeGroupsPerHour": 1,
            "maxEntryNotionalQuote": None,
            "exitNotionalCapQuote": None,
        },
    }


class CostAwareRangeReversionCanonicalTests(unittest.TestCase):
    def test_v11_is_a_distinct_139_bar_profile_and_v1_remains_replayable(self) -> None:
        legacy_payload = canonical_range_reversion_payload()
        legacy = strategy_config_from_payload(copy.deepcopy(legacy_payload))
        self.assertEqual(legacy.revision, "a56f68f6d14d")
        self.assertEqual(
            strategy_config_to_payload(legacy),
            {**legacy_payload, "revision": "a56f68f6d14d"},
        )

        v11_payload = canonical_range_reversion_v11_payload()
        v11 = strategy_config_from_payload(copy.deepcopy(v11_payload))
        self.assertEqual(v11.revision, "d24a37e2e199")
        self.assertEqual(
            strategy_config_to_payload(v11),
            {**v11_payload, "revision": v11.revision},
        )
        self.assertEqual(StrategyConfig.from_json(v11.to_json()), v11)

        downcast = copy.deepcopy(v11_payload)
        set_path(downcast, ("policy", "kind"), "cost_aware_range_reversion_v1")
        with self.assertRaisesRegex(
            ValueError,
            "^cost_aware_range_reversion_v1_range_regime_invalid$",
        ):
            strategy_config_from_payload(downcast)

        mutated_legacy = copy.deepcopy(legacy_payload)
        set_path(
            mutated_legacy,
            ("policy", "rangeRegime", "indicatorAnchorBars"),
            139,
        )
        with self.assertRaisesRegex(
            ValueError,
            "^cost_aware_range_reversion_v1_range_regime_invalid$",
        ):
            strategy_config_from_payload(mutated_legacy)

    def test_exact_canonical_round_trip_preserves_new_policy_and_old_revision(self) -> None:
        payload = canonical_range_reversion_payload()

        strategy = strategy_config_from_payload(copy.deepcopy(payload))

        self.assertEqual(strategy.revision, "a56f68f6d14d")
        self.assertEqual(
            strategy_config_to_payload(strategy),
            {**payload, "revision": "a56f68f6d14d"},
        )
        self.assertEqual(StrategyConfig.from_json(strategy.to_json()), strategy)

        assert isinstance(strategy.policy, CostAwareRangeReversionPolicy)
        direct_integer_zero = replace(
            strategy,
            policy=replace(
                strategy.policy,
                exit=ReversionExitRule(
                    z_score_threshold=0,
                    exit_on_range_close=True,
                ),
            ),
        )
        self.assertEqual(direct_integer_zero.revision, strategy.revision)
        self.assertEqual(
            strategy_config_to_payload(direct_integer_zero),
            strategy_config_to_payload(strategy),
        )
        direct_integer_entry = replace(
            strategy,
            policy=replace(
                strategy.policy,
                reversion=ReversionEntryRule(
                    z_score_window=24,
                    standard_deviation="population",
                    entry_z_threshold=-2,
                    recovery_window_bars=3,
                    minimum_expected_distance_pct=0.012,
                    require_close_rising=True,
                    require_z_score_rising=True,
                    require_negative_z_score=True,
                    one_shot_per_event=True,
                ),
            ),
        )
        self.assertEqual(direct_integer_entry.revision, strategy.revision)
        self.assertEqual(
            strategy_config_to_payload(direct_integer_entry),
            strategy_config_to_payload(strategy),
        )

        old_strategy = strategy_config_from_payload(canonical_regime_breakout_payload())
        self.assertEqual(old_strategy.revision, "215131192ba7")
        self.assertEqual(
            strategy_config_to_payload(old_strategy),
            {**canonical_regime_breakout_payload(), "revision": "215131192ba7"},
        )
        self.assertEqual(StrategyConfig.from_json(old_strategy.to_json()), old_strategy)

    def test_canonical_parser_rejects_unknown_or_drifted_frozen_fields(self) -> None:
        drifts = {
            "root field": (("unexpected",), True),
            "policy field": (("policy", "unexpected"), True),
            "fast ema": (("policy", "rangeRegime", "fastEmaWindow"), 7),
            "slow ema": (("policy", "rangeRegime", "slowEmaWindow"), 41),
            "indicator anchor": (("policy", "rangeRegime", "indicatorAnchorBars"), 41),
            "range width": (("policy", "rangeRegime", "maximumSeparationPct"), 0.02),
            "ema seed": (("policy", "rangeRegime", "emaSeed"), "first_close"),
            "ema alpha": (("policy", "rangeRegime", "emaAlpha"), "custom"),
            "z window": (("policy", "reversion", "zScoreWindow"), 20),
            "z population": (("policy", "reversion", "standardDeviation"), "sample"),
            "z grid": (("policy", "reversion", "entryZThreshold"), -1.0),
            "recovery window": (("policy", "reversion", "recoveryWindowBars"), 4),
            "distance": (("policy", "reversion", "minimumExpectedDistancePct"), 0.01),
            "close confirmation": (("policy", "reversion", "requireCloseRising"), False),
            "z confirmation": (("policy", "reversion", "requireZScoreRising"), False),
            "negative z": (("policy", "reversion", "requireNegativeZScore"), False),
            "event semantics": (("policy", "reversion", "oneShotPerEvent"), False),
            "atr window": (("policy", "atr", "window"), 13),
            "atr smoothing": (("policy", "atr", "smoothing"), "simple"),
            "atr multiple": (("policy", "atr", "initialMultiple"), 2.0),
            "atr fixed": (("policy", "atr", "fixedFromEntry"), False),
            "atr loosen": (("policy", "atr", "neverLoosen"), False),
            "exit z": (("policy", "exit", "zScoreThreshold"), 0.1),
            "range exit": (("policy", "exit", "exitOnRangeClose"), False),
            "holding": (("policy", "holding", "maxBars"), 12),
            "cooldown bars": (("policy", "cooldown", "bars"), 5),
            "cooldown start": (("policy", "cooldown", "startsAfter"), "signal"),
            "cooldown event": (("policy", "cooldown", "requiresNewReversionEvent"), False),
            "position": (("risk", "positionPct"), 0.5),
            "risk budget": (("risk", "riskBudgetPct"), 0.005),
            "drawdown": (("risk", "maxDrawdownPct"), 0.04),
            "daily loss": (("risk", "dailyLossLimitPct"), 0.03),
            "trade groups": (("risk", "maxTradeGroupsPerHour"), 2),
            "entry cap": (("risk", "maxEntryNotionalQuote"), 10),
            "exit cap": (("risk", "exitNotionalCapQuote"), 10),
        }
        for label, (path, value) in drifts.items():
            with self.subTest(label=label):
                payload = canonical_range_reversion_payload()
                set_path(payload, path, value)
                with self.assertRaises(ValueError):
                    strategy_config_from_payload(payload)

        for threshold in (-2.5, -2.0, -1.5):
            with self.subTest(threshold=threshold):
                payload = canonical_range_reversion_payload()
                set_path(payload, ("policy", "reversion", "entryZThreshold"), threshold)
                strategy = strategy_config_from_payload(payload)
                self.assertIsInstance(strategy.policy, CostAwareRangeReversionPolicy)
                assert isinstance(strategy.policy, CostAwareRangeReversionPolicy)
                self.assertEqual(strategy.policy.reversion.entry_z_threshold, threshold)


class CostAwareRangeReversionFormalCandidateTests(unittest.TestCase):
    def test_expands_only_the_registered_signed_threshold_grid_as_canonical_candidates(
        self,
    ) -> None:
        strategy = strategy_config_from_payload(canonical_range_reversion_v11_payload())

        candidates = expand_candidates(
            strategy,
            (
                PolicyParameterDimension(
                    policy_path="reversion.entryZThreshold",
                    values=(-1.5, -2, -2.0, -2.5),
                ),
            ),
        )

        self.assertEqual(
            [candidate.parameters for candidate in candidates],
            [
                [{"policyPath": "reversion.entryZThreshold", "value": -2.5}],
                [{"policyPath": "reversion.entryZThreshold", "value": -2}],
                [{"policyPath": "reversion.entryZThreshold", "value": -1.5}],
            ],
        )
        self.assertEqual(
            [candidate.candidate_id for candidate in candidates],
            ["2ce86c2f281d", "9483e5caceab", "2667242f4ff0"],
        )
        self.assertEqual(
            [candidate.strategy.revision for candidate in candidates],
            ["08cd1403253b", "d24a37e2e199", "ab7f274daaa6"],
        )
        baseline = strategy_config_to_payload(strategy)
        for candidate in candidates:
            payload = strategy_config_to_payload(candidate.strategy)
            self.assertEqual(payload["policy"]["kind"], "cost_aware_range_reversion_v1_1")
            self.assertEqual(payload["timeframe"], "1m")
            self.assertEqual(payload["risk"], baseline["risk"])
        self.assertEqual(strategy.revision, "d24a37e2e199")

    def test_rejects_policy_kind_timeframe_risk_and_safety_dimensions(self) -> None:
        strategy = strategy_config_from_payload(canonical_range_reversion_v11_payload())

        for policy_path in (
            "kind",
            "decisionTimeframe",
            "completedBarsOnly",
            "risk.positionPct",
            "reversion.requireNegativeZScore",
        ):
            with self.subTest(policy_path=policy_path), self.assertRaises(
                StrategyExperimentError
            ):
                expand_candidates(
                    strategy,
                    (PolicyParameterDimension(policy_path=policy_path, values=(1,)),),
                )
        with self.assertRaises(StrategyExperimentError):
            expand_candidates(
                strategy,
                (
                    PolicyParameterDimension(
                        policy_path="breakout.lookbackBars",
                        values=(18,),
                    ),
                ),
            )

    def test_rejects_non_finite_out_of_bounds_or_noncanonical_signed_thresholds(
        self,
    ) -> None:
        strategy = strategy_config_from_payload(canonical_range_reversion_v11_payload())

        for values in ((-101,), (101,), (-2.25,), (True,), ("-2",), (float("inf"),)):
            with self.subTest(values=values), self.assertRaises(StrategyExperimentError):
                expand_candidates(
                    strategy,
                    (
                        PolicyParameterDimension(
                            policy_path="reversion.entryZThreshold",
                            values=values,
                        ),
                    ),
                )

    def test_center_threshold_has_two_direct_neighbors_for_the_formal_stability_gate(
        self,
    ) -> None:
        strategy = strategy_config_from_payload(canonical_range_reversion_v11_payload())
        candidates = expand_candidates(
            strategy,
            (
                PolicyParameterDimension(
                    policy_path="reversion.entryZThreshold",
                    values=(-2.5, -2.0, -1.5),
                ),
            ),
        )
        records = [
            StrategyExperimentCandidateRecord(
                experiment_id="experiment-range-reversion",
                candidate_id=candidate.candidate_id,
                candidate_revision=candidate.strategy.revision,
                parameters=candidate.parameters,
                train_metrics={"totalReturnPct": 1},
                validation_metrics={"totalReturnPct": 1},
                test_metrics=None,
                walk_forward={},
                eligible=True,
                rank=None,
                gate_evaluation={"pretest": {"passed": True}},
            )
            for candidate in candidates
        ]

        gated = _apply_adjacent_candidate_gate(
            records,
            [
                {
                    "policyPath": "reversion.entryZThreshold",
                    "values": [-2.5, -2, -1.5],
                }
            ],
        )

        center = next(
            record for record in gated if record.parameters[0]["value"] == -2
        )
        edges = [record for record in gated if record is not center]
        self.assertTrue(center.eligible)
        self.assertEqual(
            center.gate_evaluation["stability"],
            {
                "passed": True,
                "pending": False,
                "completeNeighborhood": True,
                "neighbors": [
                    {
                        "candidateId": "2667242f4ff0",
                        "validationReturnPct": 1.0,
                        "positive": True,
                    },
                    {
                        "candidateId": "2ce86c2f281d",
                        "validationReturnPct": 1.0,
                        "positive": True,
                    },
                ],
            },
        )
        self.assertTrue(all(not record.eligible for record in edges))


class CostAwareRangeReversionP0SchemaTests(unittest.TestCase):
    def test_p0_schema_normalizes_exact_canonical_config_and_summary(self) -> None:
        payload = p0_range_reversion_payload()

        strategy = _p0_strategy_config_from_payload(
            copy.deepcopy(payload),
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
        )
        summary = _p0_strategy_snapshot_from_payload(payload)

        self.assertIsNotNone(strategy)
        assert strategy is not None
        self.assertEqual(
            strategy_config_to_payload(strategy),
            {
                **canonical_range_reversion_v11_payload(),
                "revision": "d24a37e2e199",
            },
        )
        self.assertEqual(summary.name, "BTC Cost-Aware Range Reversion v1.1")
        self.assertEqual(
            summary.entry,
            "4h 139-bar indicator anchor; range |EMA6/EMA42-1| <= 1%; "
            "Z24 <= -2; recover within 3 bars; mean distance >= 1.2%",
        )
        self.assertEqual(
            summary.exit,
            "Z24 >= 0, ATR14 fixed 2.5x, range close, max hold 18 bars, cooldown 6 bars",
        )
        self.assertEqual(summary.position, "60% cap per instrument")
        self.assertEqual(
            summary.risk,
            "Risk budget 1.5%, drawdown guard 3%, daily loss 2%, paper only",
        )

    def test_draft_strategy_library_readback_projects_range_reversion_rules(self) -> None:
        strategy = strategy_config_from_payload(canonical_range_reversion_v11_payload())
        with tempfile.TemporaryDirectory() as directory:
            store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            saved = store.save(strategy)

            payload = strategy_library_record_to_payload(store.get(saved.revision))

        self.assertEqual(payload["status"], "draft")
        self.assertIsNone(payload["auditRunId"])
        self.assertEqual(
            payload["strategyConfig"],
            {
                **canonical_range_reversion_v11_payload(),
                "revision": "d24a37e2e199",
            },
        )
        self.assertEqual(
            payload["strategySnapshot"],
            {
                "name": "BTC Cost-Aware Range Reversion v1.1",
                "entry": (
                    "4h 139-bar indicator anchor; range |EMA6/EMA42-1| <= 1%; "
                    "Z24 <= -2; recover within 3 bars; mean distance >= 1.2%"
                ),
                "exit": (
                    "Z24 >= 0, ATR14 fixed 2.5x, range close, "
                    "max hold 18 bars, cooldown 6 bars"
                ),
                "position": "60% cap per instrument",
                "risk": "Risk budget 1.5%, drawdown guard 3%, daily loss 2%, paper only",
            },
        )

    def test_p0_schema_rejects_percentage_policy_or_cap_drift(self) -> None:
        drifts = {
            "unexpected": (("unexpected",), True),
            "position": (("position", "maxPositionPct"), 50),
            "risk budget": (("risk", "riskBudgetPct"), 0.5),
            "drawdown": (("risk", "maxDrawdownPct"), 4),
            "daily loss": (("risk", "dailyLossLimitPct"), 3),
            "trade groups": (("risk", "maxTradeGroupsPerHour"), 2),
            "entry cap": (("risk", "maxEntryNotionalQuote"), 10),
            "exit cap": (("risk", "exitNotionalCapQuote"), 10),
            "policy": (("policy", "rangeRegime", "fastEmaWindow"), 7),
            "indicator anchor": (("policy", "rangeRegime", "indicatorAnchorBars"), 42),
        }
        for label, (path, value) in drifts.items():
            with self.subTest(label=label):
                payload = p0_range_reversion_payload()
                set_path(payload, path, value)
                with self.assertRaises(ValueError):
                    _p0_strategy_config_from_payload(
                        payload,
                        market="crypto",
                        symbol="BTC/USDT",
                        timeframe="1m",
                    )


if __name__ == "__main__":
    unittest.main()
