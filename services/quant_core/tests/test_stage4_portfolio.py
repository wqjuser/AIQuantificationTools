from __future__ import annotations

import copy
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from quant_core.stage4_portfolio import (
    build_stage4_portfolio_workflow_snapshot,
    stage4_portfolio_workflow_hash,
    validate_stage4_portfolio_workflow_snapshot,
)
from quant_core.execution import (
    build_portfolio_paper_order_replay,
    build_portfolio_paper_order_simulation_route_risk,
    portfolio_paper_order_payload_to_simulation,
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
        self.risk_template = {
            "minCashAfter": 10_000,
            "maxSymbolNotional": 50_000,
            "maxBatchNotional": 90_000,
        }
        self.simulations = [self.simulation("order-a", "600000", 100, 100, 1), self.simulation("order-b", "000300", 50, 400, 2)]
        existing_simulations = []
        for simulation in self.simulations:
            simulation["routeRisk"] = build_portfolio_paper_order_simulation_route_risk(
                simulation,
                base_run_id="run-a",
                batch_id="batch-1",
                existing_simulations=existing_simulations,
                route_risk={"initialCash": 100_000, **self.risk_template},
            )
            existing_simulations.append(portfolio_paper_order_payload_to_simulation(simulation))
        self.state_history = {
            "baseRunId": "run-a",
            "batchId": "batch-1",
            "summary": {"orderCount": 2, "filledOrders": 2, "liveBlockedEvents": 2},
            "orders": [{"orderId": "order-a"}, {"orderId": "order-b"}],
            "paperOnly": True,
            "liveExecutionBlocked": True,
        }
        self.replay = build_portfolio_paper_order_replay(
            [portfolio_paper_order_payload_to_simulation(row) for row in self.simulations],
            base_run_id="run-a",
            initial_cash=100_000,
            generated_at=datetime(2026, 7, 11, 8, 5, tzinfo=timezone.utc),
        )

    def simulation(self, order_id, symbol, quantity, fill_price, minute) -> dict:
        notional = quantity * fill_price
        checks = [
            {"id": "cash_after_below_minimum", "passed": True, "limit": 10_000},
            {"id": "insufficient_symbol_position", "passed": True, "limit": 0},
            {"id": "symbol_notional_limit_exceeded", "passed": True, "limit": 50_000},
            {"id": "batch_notional_limit_exceeded", "passed": True, "limit": 90_000},
        ]
        return {
            "simulationId": f"simulation-{order_id}",
            "baseRunId": "run-a",
            "batchId": "batch-1",
            "orderId": order_id,
            "simulatedAt": datetime(2026, 7, 11, 8, minute, tzinfo=timezone.utc).isoformat(),
            "mode": "portfolio_paper_order_simulation",
            "symbol": symbol,
            "sourceRunId": "run-a" if symbol == "600000" else "run-b",
            "side": "buy",
            "quantity": quantity,
            "fillPrice": fill_price,
            "notionalValue": notional,
            "orderState": "filled",
            "fillStatus": "filled",
            "reason": "Paper fill.",
            "approvedBy": "local-operator",
            "routeRisk": {
                "status": "passed",
                "baseRunId": "run-a",
                "batchId": "batch-1",
                "orderId": order_id,
                "limits": {"initialCash": 100_000, **self.risk_template},
                "checks": checks,
                "blockedReasons": [],
            },
            "paperOnly": True,
            "liveExecutionBlocked": True,
        }

    def build(self, **overrides) -> dict:
        arguments = {
            "workflow_id": "stage4-workflow-1",
            "base_run_id": "run-a",
            "portfolio_request": self.portfolio_request,
            "portfolio": self.portfolio,
            "risk_template": self.risk_template,
            "batch": self.batch,
            "approvals": self.approvals,
            "simulations": self.simulations,
            "state_history": self.state_history,
            "replay": self.replay,
        }
        arguments.update(overrides)
        return build_stage4_portfolio_workflow_snapshot(**arguments)

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

        def exceed_one_by_a_small_amount(value) -> None:
            value["portfolioRequest"]["legs"][1]["targetWeight"] = 0.45000001
            value["portfolio"]["legs"][1]["targetWeight"] = 0.45000001
            value["portfolio"]["cashWeight"] = -0.00000001

        self.assert_rejected(exceed_one_by_a_small_amount)

    def test_rejects_rehashed_request_portfolio_identity_mutations(self) -> None:
        mutations = [
            lambda value: value["portfolio"].update({"name": "Other portfolio"}),
            lambda value: value["portfolio"].update({"initialCash": 99_999}),
            lambda value: value["portfolio"].update({"market": "us"}),
            lambda value: value["portfolio"].update({"timeframe": "1m"}),
            lambda value: value["portfolio"]["legs"][0].update({"symbol": "000001"}),
            lambda value: value["portfolio"]["legs"][0].update({"targetWeight": 0.5}),
            lambda value: value["portfolio"].update({"cashWeight": 0.2}),
        ]
        for mutate in mutations:
            with self.subTest(mutate=mutate):
                self.assert_rejected(mutate)

    def test_rejects_rehashed_route_risk_mutations(self) -> None:
        mutations = [
            lambda value: value["simulations"][0].pop("routeRisk"),
            lambda value: value["simulations"][0]["routeRisk"].update({"status": "blocked"}),
            lambda value: value["simulations"][0]["routeRisk"]["limits"].update({"initialCash": 90_000}),
            lambda value: value["simulations"][0]["routeRisk"]["limits"].update({"minCashAfter": 9_000}),
            lambda value: value["simulations"][0]["routeRisk"]["limits"].update({"maxSymbolNotional": 40_000}),
            lambda value: value["simulations"][0]["routeRisk"]["limits"].update({"maxBatchNotional": 80_000}),
            lambda value: value["simulations"][0]["routeRisk"]["checks"].append(
                copy.deepcopy(value["simulations"][0]["routeRisk"]["checks"][0])
            ),
            lambda value: value["simulations"][0]["routeRisk"]["checks"][0].update({"limit": 9_000}),
            lambda value: value["simulations"][0]["routeRisk"]["checks"][0].update({"passed": False}),
            lambda value: value["simulations"][0]["routeRisk"].update({"cashAfter": -999_999}),
            lambda value: value["simulations"][0]["routeRisk"]["checks"][0].update({"value": -999_999}),
            lambda value: value["simulations"][0]["routeRisk"]["checks"][1].update({"passed": False}),
        ]
        for mutate in mutations:
            with self.subTest(mutate=mutate):
                self.assert_rejected(mutate)

    def test_rejects_rehashed_replay_financial_mutations(self) -> None:
        mutations = [
            lambda value: value["replay"]["account"].update({"cash": value["replay"]["account"]["cash"] + 1}),
            lambda value: value["replay"]["account"].update({"equity": value["replay"]["account"]["equity"] + 1}),
            lambda value: value["replay"]["account"]["positions"].update({"600000": 101}),
            lambda value: value["replay"]["positions"][0].update(
                {"quantity": value["replay"]["positions"][0]["quantity"] + 1}
            ),
            lambda value: value["replay"]["summary"].update({"buyNotional": 1}),
            lambda value: value["replay"]["orders"][0].update({"cashAfter": 1}),
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
            lambda value: value["stateHistory"]["orders"].insert(1, None),
            lambda value: value["replay"]["orders"].insert(1, None),
        ]
        for mutate in mutations:
            with self.subTest(mutate=mutate):
                self.assert_rejected(mutate)

        nested = ["batch", "approvals", "simulations", "stateHistory", "replay"]
        conflicts = {
            "paperOnly": False,
            "liveTradingAllowed": True,
            "orderSubmissionEnabled": True,
            "routeExecuted": True,
            "liveBlockedBoundary": False,
        }
        for evidence in nested:
            for field, conflict in conflicts.items():
                with self.subTest(evidence=evidence, field=field):
                    self.assert_rejected(
                        lambda value, evidence=evidence, field=field, conflict=conflict: (
                            value[evidence][0] if isinstance(value[evidence], list) else value[evidence]
                        ).update({field: conflict})
                    )

    def test_rejects_invalid_schema_timestamp_and_builder_ids(self) -> None:
        mutations = [
            lambda value: value.update({"schemaVersion": True}),
            lambda value: value.update({"generatedAt": "2026-07-11T10:00:00"}),
        ]
        for mutate in mutations:
            with self.subTest(mutate=mutate):
                self.assert_rejected(mutate)

        for field, invalid in (("workflow_id", 123), ("workflow_id", "  "), ("base_run_id", 123), ("base_run_id", "")):
            with self.subTest(field=field, invalid=invalid):
                with self.assertRaises(ValueError):
                    self.build(**{field: invalid})

    def test_rejects_non_finite_values_outside_numeric_fields(self) -> None:
        for invalid in (float("nan"), float("inf"), float("-inf")):
            with self.subTest(copy=invalid):
                request = copy.deepcopy(self.portfolio_request)
                request["name"] = invalid
                with self.assertRaises(ValueError):
                    self.build(portfolio_request=request)

            with self.subTest(hash=invalid):
                snapshot = self.build()
                snapshot["batch"]["note"] = invalid
                with self.assertRaises(ValueError):
                    stage4_portfolio_workflow_hash(snapshot)

    def test_rejects_boolean_and_float_evidence_counts(self) -> None:
        fields = [
            ("stateHistory", "orderCount"),
            ("stateHistory", "filledOrders"),
            ("stateHistory", "liveBlockedEvents"),
            ("replay", "filledOrders"),
            ("replay", "positionCount"),
        ]
        single = self.build()
        single["batch"]["orders"] = single["batch"]["orders"][:1]
        single["approvals"] = single["approvals"][:1]
        single["simulations"] = single["simulations"][:1]
        single["stateHistory"]["orders"] = single["stateHistory"]["orders"][:1]
        single["replay"] = build_portfolio_paper_order_replay(
            [portfolio_paper_order_payload_to_simulation(single["simulations"][0])],
            base_run_id="run-a",
            initial_cash=100_000,
            generated_at=datetime(2026, 7, 11, 8, 5, tzinfo=timezone.utc),
        )
        single["stateHistory"]["summary"].update({"orderCount": 1, "filledOrders": 1, "liveBlockedEvents": 1})

        for evidence, field in fields:
            for baseline, invalid in ((single, True), (self.build(), 2.0)):
                with self.subTest(evidence=evidence, field=field, invalid=invalid):
                    snapshot = copy.deepcopy(baseline)
                    snapshot[evidence]["summary"][field] = invalid
                    snapshot["workflowHash"] = stage4_portfolio_workflow_hash(snapshot)
                    with self.assertRaises(ValueError):
                        validate_stage4_portfolio_workflow_snapshot(snapshot)

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
