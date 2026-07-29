from __future__ import annotations

import json
import tempfile
import unittest
from http.client import HTTPConnection
from http.server import HTTPServer
from pathlib import Path
from threading import Thread
from unittest.mock import patch

from quant_core.adapter_error_ledger import MarketDataAdapterErrorStore
from quant_core.api import QuantApiHandler
from quant_core.audit_events import AuditEventStore
from quant_core.cache import MarketDataCache
from quant_core.live_quotes import QuantDingerLiveQuoteAdapter
from quant_core.monitoring import MonitoringService
from quant_core.settings import PlatformSettingsStore


class PlatformSettingsTests(unittest.TestCase):
    def test_settings_status_projects_current_execution_mode_and_production_gate(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            class AutoTradingService:
                @staticmethod
                def snapshot():
                    return {
                        "state": {
                            "executionMode": "testnet",
                            "liveConfirmed": False,
                            "liveAuthorizedUntil": None,
                        },
                        "productionLive": {
                            "enabled": True,
                            "credentialsConfigured": True,
                            "controlActive": False,
                            "controlRecordedActive": True,
                            "evidenceFresh": False,
                            "blockingReason": "stage10_production_execution_control_evidence_stale",
                            "triggered": False,
                        },
                        "liveTradingAllowed": False,
                    }

            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(root / "market.sqlite")
                adapter_error_store = MarketDataAdapterErrorStore(root / "adapter_errors.sqlite")
                platform_settings_store = PlatformSettingsStore(
                    root / "platform_settings.sqlite",
                    root / "platform-settings.key",
                )

                def _auto_paper_trading_service(self):
                    return AutoTradingService()

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/settings/status")
                response = connection.getresponse()
                safety = json.loads(response.read().decode("utf-8"))["settings"]["safety"]
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            self.assertEqual(response.status, 200)
            self.assertEqual(safety["executionMode"], "testnet")
            self.assertFalse(safety["liveConfirmed"])
            self.assertIsNone(safety["liveAuthorizedUntil"])
            self.assertEqual(
                safety["productionLive"]["blockingReason"],
                "stage10_production_execution_control_evidence_stale",
            )
            self.assertFalse(safety["productionLive"]["controlActive"])

    def test_finnhub_key_is_applied_to_live_quotes_without_api_restart(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            environment = {"FINNHUB_API_KEY": "environment-finnhub-key"}
            store = PlatformSettingsStore(
                root / "platform_settings.sqlite",
                root / "platform-settings.key",
            )
            requested_urls = []

            def fetch_text(url, _encoding):
                requested_urls.append(url)
                return json.dumps({
                    "c": 123.45,
                    "d": 1.25,
                    "dp": 1.02,
                    "h": 124,
                    "l": 121,
                    "o": 122,
                    "pc": 122.2,
                    "t": 1785250800,
                })

            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(root / "market.sqlite")
                adapter_error_store = MarketDataAdapterErrorStore(root / "adapter_errors.sqlite")
                platform_settings_store = store
                platform_settings_environ = environment
                settings_restart_required = False
                quote_adapter = QuantDingerLiveQuoteAdapter(
                    finnhub_api_key="environment-finnhub-key",
                    fetch_text=fetch_text,
                )

            TestHandler.quote_adapter.fetch_quote("us", "AAPL")
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/settings/status")
                initial_response = connection.getresponse()
                configuration = json.loads(initial_response.read().decode("utf-8"))["settings"]["configuration"]
                connection.request(
                    "PUT",
                    "/api/settings/configuration",
                    body=json.dumps({
                        "configuration": configuration["values"],
                        "secretUpdates": {"finnhubApiKey": "database-finnhub-key"},
                        "clearSecrets": [],
                    }),
                    headers={"Content-Type": "application/json"},
                )
                saved_response = connection.getresponse()
                saved = json.loads(saved_response.read().decode("utf-8"))["settings"]["configuration"]
                connection.request("GET", "/api/market/quotes?market=us&symbol=AAPL")
                quote_response = connection.getresponse()
                quotes = json.loads(quote_response.read().decode("utf-8"))["quotes"]
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            self.assertEqual(saved_response.status, 200)
            self.assertFalse(saved["restartRequired"])
            self.assertEqual(TestHandler.quote_adapter.finnhub_api_key, "database-finnhub-key")
            self.assertEqual(quote_response.status, 200)
            self.assertEqual(quotes[0]["source"], "finnhub")
            self.assertIn("token=environment-finnhub-key", requested_urls[0])
            self.assertIn("token=database-finnhub-key", requested_urls[-1])

    def test_webhook_is_applied_and_can_be_tested_without_api_restart(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            environment = {"AIQT_MONITORING_WEBHOOK_TIMEOUT_SECONDS": "5"}
            store = PlatformSettingsStore(
                root / "platform_settings.sqlite",
                root / "platform-settings.key",
            )
            monitoring = MonitoringService(AuditEventStore(root / "audit.sqlite"))
            calls = []

            class Response:
                status = 204

                def __enter__(self):
                    return self

                def __exit__(self, *_args):
                    return None

            def fake_urlopen(request, *, timeout):
                calls.append((request, timeout))
                return Response()

            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(root / "market.sqlite")
                adapter_error_store = MarketDataAdapterErrorStore(root / "adapter_errors.sqlite")
                platform_settings_store = store
                platform_settings_environ = environment
                settings_restart_required = False
                monitoring_service = monitoring

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/settings/status")
                initial_response = connection.getresponse()
                configuration = json.loads(initial_response.read().decode("utf-8"))["settings"]["configuration"]
                with patch("quant_core.monitoring.urlopen", side_effect=fake_urlopen):
                    connection.request(
                        "PUT",
                        "/api/settings/configuration",
                        body=json.dumps({
                            "configuration": {
                                **configuration["values"],
                                "monitoringWebhookTimeoutSeconds": 7,
                            },
                            "secretUpdates": {
                                "monitoringWebhookUrl": "https://hooks.example.test/private",
                            },
                            "clearSecrets": [],
                        }),
                        headers={"Content-Type": "application/json"},
                    )
                    saved_response = connection.getresponse()
                    saved_raw = saved_response.read().decode("utf-8")
                    saved = json.loads(saved_raw)["settings"]["configuration"]
                    connection.request(
                        "POST",
                        "/api/operations/monitoring/test-notifications",
                        body="{}",
                        headers={"Content-Type": "application/json"},
                    )
                    test_response = connection.getresponse()
                    test_raw = test_response.read().decode("utf-8")
                    test_result = json.loads(test_raw)["monitoringTestNotification"]
                connection.request("GET", "/api/operations/monitoring")
                monitoring_response = connection.getresponse()
                monitoring_payload = json.loads(monitoring_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            self.assertEqual(saved_response.status, 200)
            self.assertFalse(saved["restartRequired"])
            self.assertNotIn("hooks.example", saved_raw)
            self.assertEqual(test_response.status, 201)
            self.assertEqual(test_result["deliveryStatus"], "sent")
            self.assertFalse(test_result["tradingActionsAvailable"])
            self.assertNotIn("hooks.example", test_raw)
            self.assertEqual(monitoring_response.status, 200)
            self.assertEqual(monitoring_payload["channel"]["status"], "ready")
            self.assertTrue(monitoring_payload["channel"]["configured"])
            self.assertNotIn("hooks.example", json.dumps(monitoring_payload))
            request, timeout = calls[0]
            self.assertEqual(request.full_url, "https://hooks.example.test/private")
            self.assertEqual(timeout, 7)
            self.assertEqual(json.loads(request.data)["lifecycle"], "test")

    def test_web_configuration_is_encrypted_and_overrides_environment_after_first_save(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            environment = {
                "CCXT_DEFAULT_EXCHANGE": "binance",
                "CCXT_TIMEOUT": "10000",
                "OPENAI_API_KEY": "environment-openai-secret",
                "OPENAI_MODEL": "environment-model",
                "OLLAMA_BASE_URL": "http://127.0.0.1:11434",
                "AIQT_MONITORING_WEBHOOK_TIMEOUT_SECONDS": "5",
                "AIQT_FREE_STOCKDB_TIMEOUT_SECONDS": "3",
            }
            store = PlatformSettingsStore(
                root / "platform_settings.sqlite",
                root / "platform-settings.key",
            )

            class RuntimeAutoTradingService:
                reloaded_ttl_hours = None

                def reload_runtime(
                    self,
                    _providers,
                    _sandbox,
                    _production,
                    *,
                    live_session_ttl_hours,
                ):
                    self.reloaded_ttl_hours = live_session_ttl_hours

                @staticmethod
                def snapshot():
                    return {
                        "state": {
                            "executionMode": "paper",
                            "liveConfirmed": False,
                            "liveSessionTtlHours": 8,
                            "liveAuthorizedUntil": None,
                        },
                        "productionLive": None,
                        "liveTradingAllowed": False,
                    }

            runtime_auto_trading = RuntimeAutoTradingService()

            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(root / "market.sqlite")
                adapter_error_store = MarketDataAdapterErrorStore(root / "adapter_errors.sqlite")
                platform_settings_store = store
                platform_settings_environ = environment
                settings_restart_required = False
                auto_paper_trading_service = runtime_auto_trading

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/settings/status")
                initial_response = connection.getresponse()
                initial = json.loads(initial_response.read().decode("utf-8"))["settings"]["configuration"]

                body = json.dumps(
                    {
                        "configuration": {
                            **initial["values"],
                            "ccxtDefaultExchange": "kraken",
                            "liveSessionTtlHours": 0,
                            "openaiModel": "database-model",
                        },
                        "secretUpdates": {
                            "openaiApiKey": "database-openai-secret",
                            "monitoringWebhookUrl": "https://hooks.example.test/private",
                            "ccxtProductionTradingSecret": "database-production-secret",
                        },
                        "clearSecrets": [],
                    }
                )
                connection.request(
                    "PUT",
                    "/api/settings/configuration",
                    body=body,
                    headers={"Content-Type": "application/json"},
                )
                saved_response = connection.getresponse()
                saved_raw = saved_response.read().decode("utf-8")
                saved_settings = json.loads(saved_raw)["settings"]
                saved = saved_settings["configuration"]
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            self.assertEqual(initial_response.status, 200)
            self.assertEqual(initial["source"], "environment")
            self.assertEqual(initial["values"]["openaiModel"], "environment-model")
            self.assertEqual(initial["values"]["liveSessionTtlHours"], 8)
            self.assertTrue(initial["secrets"]["openaiApiKey"]["configured"])
            self.assertEqual(saved_response.status, 200)
            self.assertEqual(saved["source"], "database")
            self.assertEqual(saved["revision"], 1)
            self.assertFalse(saved["restartRequired"])
            self.assertEqual(saved["values"]["ccxtDefaultExchange"], "kraken")
            self.assertEqual(saved["values"]["liveSessionTtlHours"], 0)
            self.assertEqual(saved["values"]["openaiModel"], "database-model")
            self.assertEqual(runtime_auto_trading.reloaded_ttl_hours, 0)
            self.assertEqual(environment["CCXT_DEFAULT_EXCHANGE"], "kraken")
            self.assertEqual(environment["OPENAI_MODEL"], "database-model")
            self.assertEqual(saved["secrets"]["openaiApiKey"]["masked"], "data••••••••cret")
            self.assertEqual(saved["secrets"]["monitoringWebhookUrl"]["masked"], "http••••••••vate")
            self.assertFalse(saved_settings["safety"]["liveTradingAllowed"])
            self.assertNotIn("environment-openai-secret", saved_raw)
            self.assertNotIn("database-openai-secret", saved_raw)
            database_bytes = store.path.read_bytes().decode("latin1")
            self.assertNotIn("environment-openai-secret", database_bytes)
            self.assertNotIn("database-openai-secret", database_bytes)
            self.assertNotIn("database-production-secret", database_bytes)

            effective = store.effective_environment(
                {
                    **environment,
                    "CCXT_DEFAULT_EXCHANGE": "coinbase",
                    "OPENAI_API_KEY": "changed-environment-secret",
                    "OPENAI_MODEL": "changed-environment-model",
                }
            )
            self.assertEqual(effective["CCXT_DEFAULT_EXCHANGE"], "kraken")
            self.assertEqual(effective["AIQT_LIVE_SESSION_TTL_HOURS"], "0")
            self.assertEqual(effective["OPENAI_MODEL"], "database-model")
            self.assertEqual(effective["OPENAI_API_KEY"], "database-openai-secret")
            self.assertEqual(
                effective["CCXT_PRODUCTION_TRADING_SECRET"],
                "database-production-secret",
            )
            self.assertNotIn("AIQT_ENABLE_PRODUCTION_TRADING", effective)
            self.assertEqual(
                effective["AIQT_MONITORING_WEBHOOK_URL"],
                "https://hooks.example.test/private",
            )

            store.save(saved["values"], {}, ["openaiApiKey"], effective)
            cleared = store.effective_environment(effective)
            self.assertNotIn("OPENAI_API_KEY", cleared)
            self.assertEqual(
                store.configuration_payload(effective)["secrets"]["openaiApiKey"],
                {"configured": False, "masked": None},
            )

    def test_model_discovery_uses_effective_encrypted_configuration(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            environment = {
                "OPENAI_COMPATIBLE_BASE_URL": "https://environment.example.test/v1",
                "OPENAI_COMPATIBLE_API_KEY": "environment-secret",
            }
            store = PlatformSettingsStore(
                root / "platform_settings.sqlite",
                root / "platform-settings.key",
            )
            configuration = store.configuration_payload(environment)["values"]
            store.save(
                {
                    **configuration,
                    "openaiCompatibleBaseUrl": "https://database.example.test/v1",
                    "openaiCompatibleModel": "model-a",
                },
                {"openaiCompatibleApiKey": "database-secret"},
                [],
                environment,
            )

            class TestHandler(QuantApiHandler):
                platform_settings_store = store
                platform_settings_environ = environment

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                with patch(
                    "quant_core.api.discover_openai_compatible_models",
                    return_value=("model-a", "model-b"),
                ) as discover:
                    connection.request(
                        "GET",
                        "/api/settings/openai-compatible-models"
                        "?baseUrl=https%3A%2F%2Fedited.example.test%2Fv1",
                    )
                    response = connection.getresponse()
                    payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            self.assertEqual(response.status, 200)
            self.assertEqual(payload, {"models": ["model-a", "model-b"]})
            discover.assert_called_once_with(
                "https://edited.example.test/v1",
                "database-secret",
            )


if __name__ == "__main__":
    unittest.main()
