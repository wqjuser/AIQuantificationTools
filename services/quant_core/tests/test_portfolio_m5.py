from __future__ import annotations

import copy
import json
import tempfile
import threading
import unittest
from datetime import datetime, timezone
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path

from quant_core.audit_events import AuditEventStore
from quant_core.execution import (
    build_portfolio_paper_order_replay,
    build_portfolio_paper_order_simulation_route_risk,
    portfolio_paper_order_payload_to_simulation,
)
from quant_core.portfolio_m5 import (
    PortfolioM5Service,
    build_portfolio_risk_assessment,
    validate_portfolio_risk_assessment,
)
from quant_core.stage4_portfolio import build_stage4_portfolio_workflow_snapshot


RISK_TEMPLATE = {
    "minCashAfter": 10_000,
    "maxSymbolNotional": 60_000,
    "maxBatchNotional": 90_000,
}


def _simulation(order_id: str, symbol: str, run_id: str, quantity: float, price: float, minute: int) -> dict:
    return {
        "simulationId": f"simulation-{order_id}",
        "baseRunId": "run-a",
        "batchId": "batch-1",
        "orderId": order_id,
        "simulatedAt": datetime(2026, 7, 20, 8, minute, tzinfo=timezone.utc).isoformat(),
        "mode": "portfolio_paper_order_simulation",
        "symbol": symbol,
        "sourceRunId": run_id,
        "side": "buy",
        "quantity": quantity,
        "fillPrice": price,
        "notionalValue": quantity * price,
        "orderState": "filled",
        "fillStatus": "filled",
        "reason": "Paper fill.",
        "approvedBy": "local-operator",
        "routeRisk": {},
        "paperOnly": True,
        "liveExecutionBlocked": True,
    }


def workflow(*, unmatched: bool = False) -> dict:
    simulations = [
        _simulation("order-a", "600000", "run-a", 100, 100, 1),
        _simulation("order-b", "000300", "run-b", 50, 400, 2),
    ]
    if unmatched:
        simulations.append(_simulation("order-x", "UNMATCHED", "run-a", 10, 500, 3))
    existing = []
    for simulation in simulations:
        simulation["routeRisk"] = build_portfolio_paper_order_simulation_route_risk(
            simulation,
            base_run_id="run-a",
            batch_id="batch-1",
            existing_simulations=existing,
            route_risk={"initialCash": 100_000, **RISK_TEMPLATE},
        )
        existing.append(portfolio_paper_order_payload_to_simulation(simulation))
    orders = [{"orderId": row["orderId"], "symbol": row["symbol"]} for row in simulations]
    approvals = [
        {
            "baseRunId": "run-a",
            "batchId": "batch-1",
            "orderId": row["orderId"],
            "approved": True,
        }
        for row in simulations
    ]
    replay = build_portfolio_paper_order_replay(
        existing,
        base_run_id="run-a",
        initial_cash=100_000,
        generated_at=datetime(2026, 7, 20, 9, tzinfo=timezone.utc),
    )
    portfolio_request = {
        "name": "M5 组合",
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
    portfolio = {
        "name": "M5 组合",
        "market": "ashare",
        "timeframe": "1d",
        "initialCash": 100_000,
        "cashWeight": 0.1,
        "metrics": {"maxDrawdownPct": -8.0},
        "legs": [
            {"symbol": "600000", "targetWeight": 0.55},
            {"symbol": "000300", "targetWeight": 0.35},
        ],
        "preTradeRiskChecks": [{"checkId": "portfolio_data_quality", "status": "passed"}],
        "correlationPairs": [
            {"leftSymbol": "600000", "rightSymbol": "000300", "correlation": 0.4}
        ],
        "covarianceRisk": {
            "contributions": [
                {"symbol": "600000", "sourceRunId": "run-a", "contributionPct": 60.0},
                {"symbol": "000300", "sourceRunId": "run-b", "contributionPct": 40.0},
            ]
        },
    }
    return build_stage4_portfolio_workflow_snapshot(
        workflow_id="stage4-portfolio-workflow-m5",
        base_run_id="run-a",
        portfolio_request=portfolio_request,
        portfolio=portfolio,
        risk_template=RISK_TEMPLATE,
        batch={"batchId": "batch-1", "baseRunId": "run-a", "orders": orders},
        approvals=approvals,
        simulations=simulations,
        state_history={
            "baseRunId": "run-a",
            "batchId": "batch-1",
            "summary": {
                "orderCount": len(orders),
                "filledOrders": len(orders),
                "liveBlockedEvents": len(orders),
            },
            "orders": orders,
            "paperOnly": True,
            "liveExecutionBlocked": True,
        },
        replay=replay,
    )


def request(workflow_id: str = "stage4-portfolio-workflow-m5") -> dict:
    return {
        "workflowId": workflow_id,
        "operator": "local-operator",
        "classifications": [
            {"symbol": "600000", "industry": "银行", "currency": "CNY"},
            {"symbol": "000300", "industry": "宽基指数", "currency": "CNY"},
        ],
        "observations": {"dailyLossPct": 1.0, "tradesToday": 2},
        "limits": {
            "maxDrawdownPct": 20.0,
            "maxDailyLossPct": 3.0,
            "maxTradesPerDay": 10,
            "maxTotalExposureWeight": 0.95,
            "maxSymbolWeight": 0.7,
            "maxIndustryWeight": 0.7,
            "maxMarketWeight": 0.95,
            "maxCurrencyWeight": 0.95,
            "maxCorrelation": 0.8,
            "maxRiskContributionPct": 70.0,
        },
    }


class PortfolioM5Tests(unittest.TestCase):
    def build(self, source: dict | None = None, payload: dict | None = None) -> dict:
        return build_portfolio_risk_assessment(
            source or workflow(),
            payload or request(),
            assessment_id="portfolio-risk-test",
            created_at=datetime(2026, 7, 20, 10, tzinfo=timezone.utc),
        )

    def test_compares_account_target_drift_cash_and_group_exposures(self):
        assessment = self.build()

        self.assertEqual(assessment["batch"]["status"], "ready")
        self.assertEqual(
            [(row["symbol"], row["currentWeight"], row["targetWeight"]) for row in assessment["allocations"]],
            [("600000", 0.1, 0.55), ("000300", 0.2, 0.35)],
        )
        self.assertEqual(assessment["cash"]["currentWeight"], 0.7)
        self.assertEqual(assessment["cash"]["targetWeight"], 0.1)
        self.assertEqual(assessment["summary"]["currentWeightSum"], 1.0)
        self.assertEqual(assessment["summary"]["targetWeightSum"], 1.0)
        self.assertEqual(
            {row["dimension"] for row in assessment["exposures"]},
            {"industry", "market", "currency"},
        )
        self.assertEqual(
            {row["symbol"]: row["contributionPct"] for row in assessment["riskContributions"]},
            {"600000": 60.0, "000300": 40.0},
        )

    def test_concentration_caps_reduce_targets_without_increasing_exposure_and_preserve_cash(self):
        payload = request()
        payload["limits"].update(
            {
                "maxTotalExposureWeight": 0.75,
                "maxSymbolWeight": 0.4,
                "maxIndustryWeight": 0.35,
                "maxMarketWeight": 0.75,
                "maxCurrencyWeight": 0.75,
            }
        )
        assessment = self.build(payload=payload)

        self.assertEqual(assessment["batch"]["status"], "reduced")
        self.assertGreater(assessment["summary"]["reducedTargetCount"], 0)
        self.assertTrue(all(
            row["adjustedTargetWeight"] <= row["targetWeight"]
            for row in assessment["allocations"]
        ))
        self.assertGreaterEqual(assessment["cash"]["adjustedTargetWeight"], 0.25)
        self.assertEqual(assessment["summary"]["adjustedTargetWeightSum"], 1.0)
        self.assertIn("reduced", {check["status"] for check in assessment["checks"]})

    def test_unmatched_account_holding_blocks_the_whole_candidate_batch(self):
        assessment = self.build(source=workflow(unmatched=True))

        self.assertEqual(assessment["account"]["unmatchedSymbols"], ["UNMATCHED"])
        self.assertEqual(assessment["batch"]["status"], "blocked")
        self.assertTrue(all(
            row["status"] in {"blocked", "no_action"}
            for row in assessment["batch"]["orders"]
        ))
        reconciliation = next(
            row for row in assessment["checks"] if row["checkId"] == "account_reconciliation"
        )
        self.assertEqual(reconciliation["status"], "blocked")

    def test_drawdown_daily_loss_trade_rate_correlation_and_risk_contribution_block_batch(self):
        payload = request()
        payload["observations"] = {"dailyLossPct": 4.0, "tradesToday": 11}
        payload["limits"].update(
            {
                "maxDrawdownPct": 7.0,
                "maxDailyLossPct": 3.0,
                "maxTradesPerDay": 10,
                "maxCorrelation": 0.3,
                "maxRiskContributionPct": 50.0,
            }
        )
        assessment = self.build(payload=payload)

        blocked = {
            row["checkId"] for row in assessment["checks"] if row["status"] == "blocked"
        }
        self.assertTrue({
            "max_drawdown",
            "daily_loss",
            "trade_rate",
            "correlation_concentration",
            "risk_contribution",
        } <= blocked)
        self.assertEqual(assessment["batch"]["status"], "blocked")

    def test_validator_rejects_hash_safety_and_exposure_increase_tampering(self):
        for mutate in (
            lambda value: value.update({"paperOnly": False}),
            lambda value: value["allocations"][0].update({"adjustedTargetWeight": 0.9}),
            lambda value: value.update({"recordHash": "0" * 64}),
        ):
            assessment = copy.deepcopy(self.build())
            mutate(assessment)
            with self.assertRaises(ValueError):
                validate_portfolio_risk_assessment(assessment)

        payload = request()
        payload["classifications"][0]["industry"] = "api_key=secret-value"
        with self.assertRaisesRegex(ValueError, "portfolio_m5_industry_invalid"):
            self.build(payload=payload)

    def test_service_and_real_http_handler_are_idempotent_and_read_back_audited_record(self):
        from quant_core.api import QuantApiHandler

        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            source = workflow()
            store.record(
                {
                    "schemaVersion": 1,
                    "eventId": source["workflowId"],
                    "eventType": "stage4_portfolio_workflow",
                    "runId": source["baseRunId"],
                    "createdAt": source["generatedAt"],
                    "stage": "stage4-portfolio-workflow",
                    "source": "test",
                    "summary": "fixture",
                    "detail": "fixture",
                    "metadata": {"snapshot": source},
                }
            )
            service = PortfolioM5Service(
                audit_store=store,
                now=lambda: datetime(2026, 7, 20, 10, tzinfo=timezone.utc),
            )
            first = service.create(request())
            second = service.create(request())
            self.assertEqual(first["recordHash"], second["recordHash"])
            self.assertEqual(store.count(event_type="portfolio_risk_assessment"), 1)

            class Handler(QuantApiHandler):
                audit_event_store = store

            server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
            server.daemon_threads = True
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()

            def http(method: str, path: str, payload: dict | None = None):
                connection = HTTPConnection(*server.server_address, timeout=5)
                try:
                    body = json.dumps(payload).encode() if payload is not None else None
                    headers = {"Content-Type": "application/json"} if body else {}
                    connection.request(method, path, body=body, headers=headers)
                    response = connection.getresponse()
                    return response.status, json.loads(response.read())
                finally:
                    connection.close()

            try:
                status, created = http("POST", "/api/portfolio/risk-assessments", request())
                self.assertEqual(status, 201)
                self.assertEqual(created["assessment"]["recordHash"], first["recordHash"])
                status, loaded = http(
                    "GET",
                    "/api/portfolio/risk-assessments?baseRunId=run-a&limit=20",
                )
                self.assertEqual(status, 200)
                self.assertEqual(
                    [row["recordHash"] for row in loaded["assessments"]],
                    [first["recordHash"]],
                )
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
