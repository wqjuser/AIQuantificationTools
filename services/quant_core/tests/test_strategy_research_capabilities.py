from __future__ import annotations

import json
import unittest
from datetime import datetime, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
from threading import Thread

from quant_core.api import QuantApiHandler
from quant_core.strategy_experiments import formal_strategy_required_pre_roll
from quant_core.strategy_research import StrategyResearchCapabilityRegistry


class StrategyResearchCapabilitiesHttpTests(unittest.TestCase):
    @staticmethod
    def _post(server: HTTPServer, payload: dict[str, object]) -> tuple[int, dict]:
        connection = HTTPConnection(*server.server_address, timeout=5)
        body = json.dumps(payload).encode("utf-8")
        try:
            connection.request(
                "POST",
                "/api/p0/pipeline",
                body=body,
                headers={
                    "Content-Type": "application/json",
                    "Content-Length": str(len(body)),
                },
            )
            response = connection.getresponse()
            return response.status, json.loads(response.read().decode("utf-8"))
        finally:
            connection.close()

    def test_get_returns_server_owned_launchable_registered_capabilities(self) -> None:
        class TestHandler(QuantApiHandler):
            def log_message(self, format, *args):
                del format, args

        server = HTTPServer(("127.0.0.1", 0), TestHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(*server.server_address, timeout=5)
        try:
            connection.request("GET", "/api/strategy-research/capabilities")
            response = connection.getresponse()
            payload = json.loads(response.read().decode("utf-8"))
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

        self.assertEqual(response.status, 200, payload)
        self.assertEqual(
            payload,
            {
                "capabilities": [
                    {
                        "templateId": "regime-breakout-v2",
                        "version": "2",
                        "policyKind": "regime_breakout_v2",
                        "market": "crypto",
                        "symbol": "BTC/USDT",
                        "timeframe": "1m",
                        "sealedData": {
                            "hashVersion": "aiqt-sealed-v1",
                            "minimumRows": 142_919,
                            "minimumPreRollRows": 13_319,
                            "developmentScoringRows": 103_680,
                            "withheldRows": 25_920,
                        },
                        "parameterSchema": [
                            {
                                "policyPath": "regime.closeAboveSmaWindow",
                                "type": "integer",
                                "minimum": 2,
                                "maximum": 500,
                            },
                            {
                                "policyPath": "breakout.lookbackBars",
                                "type": "integer",
                                "minimum": 2,
                                "maximum": 250,
                            },
                        ],
                        "evaluatorVersion": "strategy-evaluator-v2",
                    },
                    {
                        "templateId": "cost-aware-range-reversion-v1-1",
                        "version": "1.1",
                        "policyKind": "cost_aware_range_reversion_v1_1",
                        "market": "crypto",
                        "symbol": "BTC/USDT",
                        "timeframe": "1m",
                        "sealedData": {
                            "hashVersion": "aiqt-sealed-v1",
                            "minimumRows": 163_199,
                            "minimumPreRollRows": 33_599,
                            "developmentScoringRows": 103_680,
                            "withheldRows": 25_920,
                        },
                        "parameterSchema": [
                            {
                                "policyPath": "reversion.entryZThreshold",
                                "type": "number",
                                "minimum": -100,
                                "maximum": 100,
                            }
                        ],
                        "evaluatorVersion": "strategy-evaluator-v2",
                    },
                ]
            },
        )

    def test_cost_aware_pre_roll_covers_the_0359_utc_four_hour_boundary(self) -> None:
        template = StrategyResearchCapabilityRegistry().get(
            "cost-aware-range-reversion-v1-1"
        )
        assert template is not None

        self.assertEqual(
            formal_strategy_required_pre_roll(
                template.base_strategy,
                datetime(2026, 8, 10, 3, 59, tzinfo=timezone.utc),
            ),
            33_599,
        )
        self.assertEqual(
            template.sealed_data.minimum_pre_roll_rows,
            formal_strategy_required_pre_roll(template.base_strategy),
        )

    def test_p0_registered_template_is_strictly_server_owned_before_market_access(self) -> None:
        class ForbiddenAdapter:
            def fetch_ohlcv(self, *_args, **_kwargs):
                raise AssertionError("invalid bootstrap must fail before market access")

        class TestHandler(QuantApiHandler):
            kline_adapter = ForbiddenAdapter()

            def log_message(self, format, *args):
                del format, args

        server = HTTPServer(("127.0.0.1", 0), TestHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        valid_window = {
            "start": "2026-05-01T00:00:00+00:00",
            "developmentEndExclusive": "2026-08-04T05:59:00+00:00",
            "endExclusive": "2026-08-22T05:59:00+00:00",
        }
        base = {
            "market": "crypto",
            "symbol": "BTC/USDT",
            "timeframe": "1m",
            "registeredTemplateId": "regime-breakout-v2",
            "sealedDataset": valid_window,
        }
        try:
            both = self._post(
                server,
                {**base, "strategyConfig": {"version": 2}},
            )
            unknown = self._post(
                server,
                {**base, "registeredTemplateId": "unknown-template"},
            )
            mismatch = self._post(server, {**base, "symbol": "ETH/USDT"})
            missing_sealed = self._post(
                server,
                {key: value for key, value in base.items() if key != "sealedDataset"},
            )
            drifted_assumptions = self._post(
                server,
                {
                    **base,
                    "assumptions": {
                        "initialCash": 100_000,
                        "feeBps": 3,
                        "slippageBps": 2,
                    },
                },
            )
            client_policy = self._post(server, {**base, "policy": {"kind": "forged"}})
        finally:
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

        self.assertEqual(both, (400, {"error": "invalid_p0_pipeline", "detail": "p0_strategy_source_conflict"}))
        self.assertEqual(unknown[0], 400)
        self.assertEqual(unknown[1]["detail"], "strategy_research_template_unknown")
        self.assertEqual(mismatch[0], 400)
        self.assertEqual(mismatch[1]["detail"], "strategy_research_template_context_mismatch")
        self.assertEqual(missing_sealed[0], 400)
        self.assertEqual(
            missing_sealed[1]["detail"],
            "registered_template_sealed_dataset_required",
        )
        self.assertEqual(drifted_assumptions[0], 400)
        self.assertEqual(
            drifted_assumptions[1]["detail"],
            "registered_template_assumptions_invalid",
        )
        self.assertEqual(client_policy[0], 400)
        self.assertEqual(
            client_policy[1]["detail"],
            "registered_template_strategy_fields_forbidden",
        )


if __name__ == "__main__":
    unittest.main()
