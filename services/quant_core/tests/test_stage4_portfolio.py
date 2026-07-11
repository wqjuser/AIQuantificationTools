from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from quant_core.stage4_portfolio import (
    build_stage4_portfolio_workflow_snapshot,
    stage4_portfolio_workflow_hash,
    validate_stage4_portfolio_workflow_snapshot,
)


class Stage4PortfolioWorkflowSnapshotTest(unittest.TestCase):
    def setUp(self) -> None:
        self.portfolio_request = {
            "name": "Stage 4",
            "initialCash": 100_000,
            "legs": [
                {
                    "runId": "run-a",
                    "symbol": "600000",
                    "market": "ashare",
                    "timeframe": "1d",
                    "targetWeight": 0.55,
                },
                {
                    "runId": "run-b",
                    "symbol": "000300",
                    "market": "ashare",
                    "timeframe": "1d",
                    "targetWeight": 0.35,
                },
            ],
        }
        self.portfolio = {
            "name": "Stage 4",
            "market": "ashare",
            "timeframe": "1d",
            "initialCash": 100_000,
            "cashWeight": 0.1,
            "legs": [
                {"symbol": "600000", "targetWeight": 0.55},
                {"symbol": "000300", "targetWeight": 0.35},
            ],
            "preTradeRiskChecks": [
                {"checkId": "portfolio_data_quality", "status": "passed"},
                {"checkId": "trade_notional_limit", "status": "passed"},
            ],
        }
        self.batch = {
            "batchId": "batch-1",
            "baseRunId": "run-a",
            "orders": [
                {"orderId": "order-a", "symbol": "600000"},
                {"orderId": "order-b", "symbol": "000300"},
            ],
        }
        self.approvals = [
            {"baseRunId": "run-a", "batchId": "batch-1", "orderId": "order-a", "approved": True},
            {"baseRunId": "run-a", "batchId": "batch-1", "orderId": "order-b", "approved": True},
        ]
        self.simulations = [
            {
                "baseRunId": "run-a",
                "batchId": "batch-1",
                "orderId": "order-a",
                "orderState": "filled",
                "fillStatus": "filled",
                "paperOnly": True,
                "liveExecutionBlocked": True,
            },
            {
                "baseRunId": "run-a",
                "batchId": "batch-1",
                "orderId": "order-b",
                "orderState": "filled",
                "fillStatus": "filled",
                "paperOnly": True,
                "liveExecutionBlocked": True,
            },
        ]
        self.state_history = {
            "baseRunId": "run-a",
            "batchId": "batch-1",
            "summary": {"orderCount": 2, "filledOrders": 2, "liveBlockedEvents": 2},
            "orders": [{"orderId": "order-a"}, {"orderId": "order-b"}],
            "paperOnly": True,
            "liveExecutionBlocked": True,
        }
        self.replay = {
            "baseRunId": "run-a",
            "account": {"cash": 20_000, "positions": {"600000": 100, "000300": 50}, "equity": 100_000},
            "positions": [{"symbol": "000300"}, {"symbol": "600000"}],
            "orders": [{"orderId": "order-a"}, {"orderId": "order-b"}],
            "summary": {"filledOrders": 2, "positionCount": 2, "warnings": []},
            "paperOnly": True,
            "liveExecutionBlocked": True,
        }

    def build(self) -> dict:
        return build_stage4_portfolio_workflow_snapshot(
            workflow_id="stage4-workflow-1",
            base_run_id="run-a",
            portfolio_request=self.portfolio_request,
            portfolio=self.portfolio,
            risk_template={"minCashAfter": 10_000, "maxSymbolNotional": 50_000, "maxBatchNotional": 90_000},
            batch=self.batch,
            approvals=self.approvals,
            simulations=self.simulations,
            state_history=self.state_history,
            replay=self.replay,
        )

    def assert_rejected(self, mutate) -> None:
        snapshot = copy.deepcopy(self.build())
        mutate(snapshot)
        snapshot["workflowHash"] = stage4_portfolio_workflow_hash(snapshot)
        with self.assertRaises(ValueError):
            validate_stage4_portfolio_workflow_snapshot(snapshot)

    def test_builds_exact_canonical_snapshot_and_sorted_json_hash(self) -> None:
        snapshot = self.build()

        self.assertEqual(
            set(snapshot),
            {
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
                "paperOnly",
                "liveTradingAllowed",
                "orderSubmissionEnabled",
                "routeExecuted",
                "liveBlockedBoundary",
                "workflowHash",
            },
        )
        expected = copy.deepcopy(snapshot)
        expected.pop("workflowHash")
        expected_hash = hashlib.sha256(
            json.dumps(expected, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
        ).hexdigest()
        self.assertEqual(snapshot["workflowHash"], expected_hash)
        self.assertEqual(stage4_portfolio_workflow_hash(snapshot), expected_hash)
        self.assertIs(validate_stage4_portfolio_workflow_snapshot(snapshot), snapshot)

    def test_rejects_invalid_leg_context_and_weights(self) -> None:
        mutations = [
            lambda value: value["portfolioRequest"].update({"legs": value["portfolioRequest"]["legs"][:1]}),
            lambda value: value["portfolioRequest"]["legs"][1].update({"market": "us"}),
            lambda value: value["portfolioRequest"]["legs"][1].update({"timeframe": "1m"}),
            lambda value: value["portfolioRequest"]["legs"][1].update({"targetWeight": 0}),
            lambda value: value["portfolioRequest"]["legs"][1].update({"targetWeight": 0.55}),
        ]
        for mutate in mutations:
            with self.subTest(mutate=mutate):
                self.assert_rejected(mutate)

    def test_rejects_broken_batch_approval_simulation_and_replay_bindings(self) -> None:
        mutations = [
            lambda value: value["batch"].update({"baseRunId": "run-b"}),
            lambda value: value["approvals"].reverse(),
            lambda value: value["approvals"][0].update({"batchId": "batch-2"}),
            lambda value: value["simulations"].reverse(),
            lambda value: value["simulations"][0].update({"orderState": "pending"}),
            lambda value: value["stateHistory"]["summary"].update({"filledOrders": 1}),
            lambda value: value["replay"]["summary"].update({"filledOrders": 1}),
            lambda value: value["replay"]["summary"].update({"positionCount": 1}),
            lambda value: value["replay"]["orders"].reverse(),
        ]
        for mutate in mutations:
            with self.subTest(mutate=mutate):
                self.assert_rejected(mutate)

    def test_rejects_mutated_safety_fields_nested_live_fields_and_extra_keys(self) -> None:
        mutations = [
            lambda value: value.update({"paperOnly": False}),
            lambda value: value.update({"liveTradingAllowed": True}),
            lambda value: value.update({"orderSubmissionEnabled": True}),
            lambda value: value.update({"routeExecuted": True}),
            lambda value: value.update({"liveBlockedBoundary": False}),
            lambda value: value["simulations"][0].update({"liveExecutionBlocked": False}),
            lambda value: value["stateHistory"].update({"paperOnly": False}),
            lambda value: value["replay"].update({"liveExecutionBlocked": False}),
            lambda value: value.update({"unexpected": True}),
        ]
        for mutate in mutations:
            with self.subTest(mutate=mutate):
                self.assert_rejected(mutate)

    def test_rejects_hash_tampering(self) -> None:
        snapshot = self.build()
        snapshot["workflowHash"] = "0" * 64
        with self.assertRaises(ValueError):
            validate_stage4_portfolio_workflow_snapshot(snapshot)


if __name__ == "__main__":
    unittest.main()
