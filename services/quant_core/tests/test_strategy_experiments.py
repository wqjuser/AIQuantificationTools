from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timezone

from quant_core.backtest import BacktestEngine
from quant_core.canonical import (
    DATA_SNAPSHOT_HASH_VERSION,
    canonical_data_hash,
    canonical_json,
    normalize_snapshot_bars,
    strategy_config_from_payload,
    strategy_config_to_payload,
)
from quant_core.domain import Condition, DataQuality, OHLCVBar, RiskRules, StrategyConfig
from quant_core.research import _data_snapshot_payload
from quant_core.runs import ResearchRunAudit, ResearchRunStore, research_run_export_to_payload, research_run_import_to_audit


def snapshot_bar(timestamp: str, close: float) -> dict[str, object]:
    return {
        "timestamp": timestamp,
        "timestampMs": 0,
        "open": close,
        "high": close + 1,
        "low": close - 1,
        "close": close,
        "volume": 1_000,
    }


def strategy_payload(*, revision: str) -> dict[str, object]:
    return {
        "name": "Canonical SMA",
        "revision": revision,
        "market": "ashare",
        "symbols": ["600000"],
        "timeframe": "1d",
        "version": 1,
        "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
        "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
        "risk": {
            "positionPct": 0.8,
            "stopLossPct": 0.08,
            "takeProfitPct": 0.18,
            "maxDrawdownPct": 0.2,
        },
    }


def research_audit(run_id: str, data_snapshot: dict[str, object]) -> ResearchRunAudit:
    return ResearchRunAudit(
        run_id=run_id,
        created_at=datetime(2026, 7, 1, tzinfo=timezone.utc),
        market="ashare",
        symbol="600000",
        timeframe="1d",
        strategy_name="Canonical SMA",
        strategy_revision="strategy-revision",
        data_rows=len(data_snapshot["bars"]),
        metrics={},
        decisions=[],
        execution_mode="paper_only",
        data_snapshot=data_snapshot,
    )


class BacktestEvaluationBoundaryTests(unittest.TestCase):
    def setUp(self):
        closes = [10, 12, 10, 12, 10, 12, 11]
        self.bars = [
            OHLCVBar(
                symbol="600000",
                market="ashare",
                timeframe="1d",
                timestamp=datetime(2026, 7, index + 1, tzinfo=timezone.utc),
                open=close,
                high=close,
                low=close,
                close=close,
                volume=1_000,
            )
            for index, close in enumerate(closes)
        ]
        self.strategy = StrategyConfig(
            name="Evaluation boundary",
            market="ashare",
            symbols=["600000"],
            timeframe="1d",
            entry_conditions=[Condition(kind="close_above_sma", params={"window": 2})],
            exit_conditions=[Condition(kind="close_below_sma", params={"window": 2})],
            risk=RiskRules(position_pct=0.5),
        )

    def test_warms_indicators_without_trading_before_evaluation_boundary(self):
        result = BacktestEngine().run(self.strategy, self.bars, evaluation_start_index=5)
        default_result = BacktestEngine().run(self.strategy, self.bars)

        self.assertEqual(result.trades[0].timestamp, self.bars[5].timestamp)
        self.assertTrue(all(trade.timestamp >= self.bars[5].timestamp for trade in result.trades))
        self.assertEqual(result.data_quality.rows, len(self.bars) - 5)
        self.assertEqual(result.equity_curve[0].timestamp, self.bars[5].timestamp)
        self.assertLess(default_result.trades[0].timestamp, self.bars[5].timestamp)
        self.assertEqual(len(default_result.equity_curve), len(self.bars))

    def test_rejects_invalid_evaluation_boundaries(self):
        for boundary in (-1, len(self.bars)):
            with self.subTest(boundary=boundary), self.assertRaisesRegex(
                ValueError, "^invalid_evaluation_start_index$"
            ):
                BacktestEngine().run(self.strategy, self.bars, evaluation_start_index=boundary)

    def test_preserves_empty_bars_error(self):
        with self.assertRaisesRegex(ValueError, "^backtest requires at least one OHLCV bar$"):
            BacktestEngine().run(self.strategy, [])


class CanonicalContractTests(unittest.TestCase):
    def test_canonical_json_normalizes_integral_float_and_negative_zero(self):
        self.assertEqual(canonical_json({"b": -0.0, "a": 1.0}), '{"a":1,"b":0}')

    def test_v2_snapshot_hash_survives_persistence_normalization(self):
        bars = normalize_snapshot_bars([snapshot_bar("2026-07-01T00:00:00+00:00", 100.0)])
        self.assertEqual(len(canonical_data_hash(bars)), 64)
        self.assertEqual(canonical_data_hash(json.loads(json.dumps(bars))), canonical_data_hash(bars))

    def test_strategy_payload_recomputes_revision_instead_of_trusting_external_value(self):
        payload = strategy_payload(revision="external-revision")
        strategy = strategy_config_from_payload(payload)
        self.assertNotEqual(strategy.revision, "external-revision")
        self.assertEqual(strategy_config_to_payload(strategy)["revision"], strategy.revision)

    def test_new_research_snapshot_uses_v2_full_canonical_hash(self):
        bar = OHLCVBar(
            market="ashare",
            symbol="600000",
            timeframe="1d",
            timestamp=datetime(2026, 7, 1, tzinfo=timezone.utc),
            open=100.0,
            high=101.0,
            low=99.0,
            close=100.0,
            volume=1_000.0,
        )

        snapshot = _data_snapshot_payload(
            [bar],
            DataQuality(source="fixture", is_complete=True, rows=1),
        )

        self.assertEqual(snapshot["hashVersion"], DATA_SNAPSHOT_HASH_VERSION)
        self.assertEqual(snapshot["hash"], canonical_data_hash(snapshot["bars"]))
        self.assertEqual(len(snapshot["hash"]), 64)

    def test_store_preserves_legacy_version_and_validates_v2_snapshot(self):
        bars = normalize_snapshot_bars([snapshot_bar("2026-07-01T00:00:00+00:00", 100.0)])
        legacy_snapshot = {"rows": 1, "hash": "legacy-hash", "bars": bars}
        v2_snapshot = {
            "rows": 1,
            "hashVersion": DATA_SNAPSHOT_HASH_VERSION,
            "hash": canonical_data_hash(bars),
            "bars": bars,
        }

        with tempfile.TemporaryDirectory() as tmp:
            store = ResearchRunStore(f"{tmp}/runs.sqlite")
            store.record(research_audit("legacy-run", legacy_snapshot))
            store.record(research_audit("v2-run", v2_snapshot))
            legacy = store.get("legacy-run")
            v2 = store.get("v2-run")

        assert legacy is not None
        assert v2 is not None
        self.assertNotIn("hashVersion", legacy.data_snapshot)
        self.assertEqual(legacy.data_snapshot["hash"], "legacy-hash")
        self.assertEqual(v2.data_snapshot["hashVersion"], DATA_SNAPSHOT_HASH_VERSION)

    def test_import_rejects_tampered_v2_snapshot_even_when_manifest_hash_matches(self):
        bars = normalize_snapshot_bars([snapshot_bar("2026-07-01T00:00:00+00:00", 100.0)])
        snapshot = {
            "rows": 1,
            "hashVersion": DATA_SNAPSHOT_HASH_VERSION,
            "hash": canonical_data_hash(bars),
            "bars": bars,
        }
        tampered_v2_package = research_run_export_to_payload(research_audit("v2-import", snapshot))
        tampered_v2_package.pop("integrity", None)
        data_snapshot = tampered_v2_package["researchRun"]["dataSnapshot"]
        data_snapshot["hashVersion"] = DATA_SNAPSHOT_HASH_VERSION
        data_snapshot["bars"][0]["close"] = 100.5

        with self.assertRaisesRegex(ValueError, "data_snapshot_hash_mismatch"):
            research_run_import_to_audit(tampered_v2_package)


if __name__ == "__main__":
    unittest.main()
