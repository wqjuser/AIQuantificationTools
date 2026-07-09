from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timezone

from quant_core.canonical import (
    DATA_SNAPSHOT_HASH_VERSION,
    canonical_data_hash,
    canonical_json,
    normalize_snapshot_bars,
    strategy_config_from_payload,
    strategy_config_to_payload,
)
from quant_core.domain import DataQuality, OHLCVBar
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
