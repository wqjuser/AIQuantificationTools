from __future__ import annotations

import json
import os
import sqlite3
import sys
import tempfile
import unittest
from contextlib import closing
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
from quant_core.settings import (
    PlatformSettingsStore,
    build_settings_status,
    install_optional_data_dependency,
)


class PlatformSettingsTests(unittest.TestCase):
    def test_optional_data_dependency_can_be_installed_without_restart(self):
        installed_dependencies: set[str] = set()

        def fake_install(command, **_options):
            installed_dependencies.add(command[-1])

        with (
            patch.dict(
                os.environ,
                {
                    "HTTPS_PROXY": "http://proxy.example.test:8080",
                    "OPENAI_API_KEY": "must-not-reach-pip",
                },
                clear=True,
            ),
            patch(
                "quant_core.settings.find_spec",
                side_effect=lambda dependency: (
                    object() if dependency in installed_dependencies else None
                ),
            ),
            patch("quant_core.settings.import_module") as import_module,
            patch("quant_core.settings.invalidate_caches") as invalidate_caches,
            patch("quant_core.settings.subprocess.run", side_effect=fake_install) as run,
        ):
            self.assertTrue(install_optional_data_dependency("akshare"))
            command = run.call_args.args[0]
            options = run.call_args.kwargs
            self.assertEqual(
                command,
                [
                    sys.executable,
                    "-m",
                    "pip",
                    "install",
                    "--disable-pip-version-check",
                    "--no-cache-dir",
                    "--no-input",
                    "akshare",
                ],
            )
            self.assertEqual(options["timeout"], 80)
            self.assertEqual(options["env"]["HTTPS_PROXY"], "http://proxy.example.test:8080")
            self.assertNotIn("OPENAI_API_KEY", options["env"])
            invalidate_caches.assert_called_once_with()
            import_module.side_effect = ImportError("broken optional dependency")
            with self.assertRaisesRegex(RuntimeError, "optional_data_dependency_install_failed"):
                install_optional_data_dependency("akshare")

        class TestHandler(QuantApiHandler):
            def _settings_status_payload(self, **_options):
                return {"marketDataAdapters": []}

        server = HTTPServer(("127.0.0.1", 0), TestHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(*server.server_address, timeout=5)
        install_headers = {
            "Content-Type": "application/json",
            "Origin": "http://127.0.0.1:5173",
            "Sec-Fetch-Site": "same-site",
            "X-AIQT-Install-Intent": "settings-ui",
        }

        def post(path, headers):
            connection.request("POST", path, body="{}", headers=headers)
            response = connection.getresponse()
            return response.status, json.loads(response.read().decode("utf-8"))

        try:
            with patch("quant_core.http_api.routes.core.install_optional_data_dependency", return_value=True) as installer:
                missing_intent = post(
                    "/api/settings/dependencies/akshare/install",
                    {key: value for key, value in install_headers.items() if key != "X-AIQT-Install-Intent"},
                )
                cross_site = post(
                    "/api/settings/dependencies/akshare/install",
                    {**install_headers, "Origin": "https://cross-site.example.test", "Sec-Fetch-Site": "cross-site"},
                )
                missing_metadata = post(
                    "/api/settings/dependencies/akshare/install",
                    {key: value for key, value in install_headers.items() if key != "Sec-Fetch-Site"},
                )
                unsupported = post("/api/settings/dependencies/numpy/install", install_headers)
                installed = post("/api/settings/dependencies/akshare/install", install_headers)
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

        self.assertEqual([missing_intent[0], cross_site[0], missing_metadata[0]], [403, 403, 403])
        self.assertEqual(unsupported, (400, {
            "error": "optional_data_dependency_not_supported",
            "detail": "Only akshare and yfinance can be installed at runtime.",
        }))
        self.assertEqual(installed[0], 201)
        self.assertEqual(
            installed[1]["dependencyInstallation"],
            {"dependency": "akshare", "installed": True, "alreadyInstalled": False},
        )
        installer.assert_called_once_with("akshare")

    def test_settings_status_projects_current_execution_mode_and_production_gate(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            environment = {}
            sec_user_agent = "AIQuantificationTools settings-test@example.test"

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
                platform_settings_environ = environment

                def _auto_paper_trading_service(self):
                    return AutoTradingService()

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/settings/status")
                response = connection.getresponse()
                initial_settings = json.loads(response.read().decode("utf-8"))["settings"]
                safety = initial_settings["safety"]
                initial_sources = {
                    source["id"]: source
                    for source in initial_settings["fundamentalDataSources"]
                }
                configuration = {
                    **initial_settings["configuration"]["values"],
                    "secEdgarUserAgent": sec_user_agent,
                }
                connection.request(
                    "PUT",
                    "/api/settings/configuration",
                    body=json.dumps(
                        {
                            "configuration": configuration,
                            "secretUpdates": {},
                            "clearSecrets": [],
                        }
                    ),
                    headers={"Content-Type": "application/json"},
                )
                saved_response = connection.getresponse()
                saved_settings = json.loads(saved_response.read().decode("utf-8"))[
                    "settings"
                ]
                saved_sources = {
                    source["id"]: source
                    for source in saved_settings["fundamentalDataSources"]
                }
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
            self.assertEqual(
                initial_sources["us-sec-companyfacts"],
                {
                    "id": "us-sec-companyfacts",
                    "market": "us",
                    "provider": "sec-companyfacts",
                    "status": "blocked",
                    "configured": False,
                    "reasonCode": "sec_edgar_user_agent_missing",
                    "reason": "请配置 SEC EDGAR User-Agent 联系信息。",
                },
            )
            self.assertEqual(saved_response.status, 200)
            self.assertEqual(saved_sources["us-sec-companyfacts"]["status"], "ready")
            self.assertTrue(saved_sources["us-sec-companyfacts"]["configured"])
            self.assertEqual(
                saved_sources["us-sec-companyfacts"]["reasonCode"],
                "sec_edgar_user_agent_configured",
            )
            self.assertNotIn(
                sec_user_agent,
                json.dumps(saved_sources["us-sec-companyfacts"], ensure_ascii=False),
            )
            self.assertEqual(environment["SEC_EDGAR_USER_AGENT"], sec_user_agent)
            self.assertEqual(
                saved_sources["crypto-coingecko-binance-mapping"]["status"],
                "ready_for_probe",
            )

    def test_fundamental_status_respects_akshare_dependency_override(self):
        blocked = build_settings_status(
            cache_path="unused.sqlite",
            adapter_dependency_statuses={
                "akshare": False,
                "yfinance": True,
                "ccxt": True,
            },
        )
        ready = build_settings_status(
            cache_path="unused.sqlite",
            adapter_dependency_statuses={
                "akshare": True,
                "yfinance": True,
                "ccxt": True,
            },
        )
        invalid_sec = build_settings_status(
            cache_path="unused.sqlite",
            sec_edgar_user_agent="AIQT contact@example",
            adapter_dependency_statuses={
                "akshare": True,
                "yfinance": True,
                "ccxt": True,
            },
        )

        blocked_source = next(
            source
            for source in blocked["fundamentalDataSources"]
            if source["id"] == "ashare-akshare-financials"
        )
        ready_source = next(
            source
            for source in ready["fundamentalDataSources"]
            if source["id"] == "ashare-akshare-financials"
        )
        invalid_sec_source = next(
            source
            for source in invalid_sec["fundamentalDataSources"]
            if source["id"] == "us-sec-companyfacts"
        )
        self.assertEqual(
            (blocked_source["status"], blocked_source["reasonCode"]),
            ("blocked", "dependency_missing"),
        )
        self.assertEqual(
            (ready_source["status"], ready_source["reasonCode"]),
            ("ready", "dependency_available"),
        )
        self.assertEqual(
            (
                invalid_sec_source["status"],
                invalid_sec_source["configured"],
                invalid_sec_source["reasonCode"],
            ),
            ("blocked", True, "sec_edgar_user_agent_invalid"),
        )

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
                "AIQT_ENABLE_PRODUCTION_TRADING": "false",
                "OPENAI_API_KEY": "environment-openai-secret",
                "OPENAI_MODEL": "environment-model",
                "OLLAMA_BASE_URL": "http://127.0.0.1:11434",
                "SEC_EDGAR_USER_AGENT": "environment-contact@example.test",
                "AIQT_MONITORING_WEBHOOK_TIMEOUT_SECONDS": "5",
                "AIQT_FREE_STOCKDB_TIMEOUT_SECONDS": "3",
            }
            store = PlatformSettingsStore(
                root / "platform_settings.sqlite",
                root / "platform-settings.key",
            )

            class RuntimeAutoTradingService:
                reloaded_production_enabled = None
                reloaded_ttl_hours = None

                def reload_runtime(
                    self,
                    _providers,
                    _sandbox,
                    production,
                    *,
                    live_session_ttl_hours,
                ):
                    self.reloaded_production_enabled = production.auto_route.status()["enabled"]
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

            class RuntimeAutoTradingRunner:
                interval_seconds = 35

                def update_interval(self, interval_seconds):
                    self.interval_seconds = interval_seconds

            runtime_auto_trading = RuntimeAutoTradingService()
            runtime_auto_trading_runner = RuntimeAutoTradingRunner()

            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(root / "market.sqlite")
                adapter_error_store = MarketDataAdapterErrorStore(root / "adapter_errors.sqlite")
                platform_settings_store = store
                platform_settings_environ = environment
                settings_restart_required = False
                auto_paper_trading_service = runtime_auto_trading
                auto_paper_trading_runner = runtime_auto_trading_runner

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
                            "productionTradingEnabled": True,
                            "liveSessionTtlHours": 0,
                            "autoTradingIntervalSeconds": 17,
                            "openaiModel": "database-model",
                            "secEdgarUserAgent": "AIQuantificationTools database-contact@example.test",
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
                saved_payload = json.loads(saved_raw)
                self.assertEqual(saved_response.status, 200, saved_payload)
                saved_settings = saved_payload["settings"]
                saved = saved_settings["configuration"]
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            self.assertEqual(initial_response.status, 200)
            self.assertEqual(initial["source"], "environment")
            self.assertEqual(initial["values"]["openaiModel"], "environment-model")
            self.assertEqual(
                initial["values"]["secEdgarUserAgent"],
                "environment-contact@example.test",
            )
            self.assertEqual(initial["values"]["liveSessionTtlHours"], 8)
            self.assertEqual(initial["values"]["autoTradingIntervalSeconds"], 35)
            self.assertFalse(initial["values"]["productionTradingEnabled"])
            self.assertTrue(initial["secrets"]["openaiApiKey"]["configured"])
            self.assertEqual(saved_response.status, 200)
            self.assertEqual(saved["source"], "database")
            self.assertEqual(saved["revision"], 1)
            self.assertFalse(saved["restartRequired"])
            self.assertEqual(saved["values"]["ccxtDefaultExchange"], "kraken")
            self.assertTrue(saved["values"]["productionTradingEnabled"])
            self.assertEqual(saved["values"]["liveSessionTtlHours"], 0)
            self.assertEqual(saved["values"]["autoTradingIntervalSeconds"], 17)
            self.assertEqual(saved["values"]["openaiModel"], "database-model")
            self.assertEqual(
                saved["values"]["secEdgarUserAgent"],
                "AIQuantificationTools database-contact@example.test",
            )
            self.assertEqual(runtime_auto_trading.reloaded_ttl_hours, 0)
            self.assertTrue(runtime_auto_trading.reloaded_production_enabled)
            self.assertEqual(runtime_auto_trading_runner.interval_seconds, 17)
            self.assertEqual(environment["CCXT_DEFAULT_EXCHANGE"], "kraken")
            self.assertEqual(environment["AIQT_AUTO_TRADING_INTERVAL_SECONDS"], "17")
            self.assertEqual(environment["AIQT_ENABLE_PRODUCTION_TRADING"].lower(), "true")
            self.assertEqual(environment["OPENAI_MODEL"], "database-model")
            self.assertEqual(
                environment["SEC_EDGAR_USER_AGENT"],
                "AIQuantificationTools database-contact@example.test",
            )
            self.assertEqual(saved["secrets"]["openaiApiKey"]["masked"], "data••••••••cret")
            self.assertEqual(saved["secrets"]["monitoringWebhookUrl"]["masked"], "http••••••••vate")
            self.assertFalse(saved_settings["safety"]["liveTradingAllowed"])
            self.assertEqual(saved_settings["safety"]["executionMode"], "paper")
            self.assertFalse(saved_settings["safety"]["liveConfirmed"])
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
                    "SEC_EDGAR_USER_AGENT": "changed-contact@example.test",
                    "AIQT_ENABLE_PRODUCTION_TRADING": "false",
                }
            )
            self.assertEqual(effective["CCXT_DEFAULT_EXCHANGE"], "kraken")
            self.assertEqual(effective["AIQT_LIVE_SESSION_TTL_HOURS"], "0")
            self.assertEqual(effective["AIQT_AUTO_TRADING_INTERVAL_SECONDS"], "17")
            self.assertEqual(effective["OPENAI_MODEL"], "database-model")
            self.assertEqual(
                effective["SEC_EDGAR_USER_AGENT"],
                "AIQuantificationTools database-contact@example.test",
            )
            self.assertEqual(effective["OPENAI_API_KEY"], "database-openai-secret")
            self.assertEqual(
                effective["CCXT_PRODUCTION_TRADING_SECRET"],
                "database-production-secret",
            )
            self.assertEqual(effective["AIQT_ENABLE_PRODUCTION_TRADING"].lower(), "true")
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

            invalid = {**saved["values"], "autoTradingIntervalSeconds": 4}
            with self.assertRaisesRegex(
                ValueError,
                "autoTradingIntervalSeconds_out_of_range",
            ):
                store.save(invalid, {}, [], effective)
            invalid = {**saved["values"], "productionTradingEnabled": "true"}
            with self.assertRaisesRegex(ValueError, "productionTradingEnabled_must_be_boolean"):
                store.save(invalid, {}, [], effective)

    def test_legacy_database_configuration_defaults_production_trading_to_disabled(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            environment = {"AIQT_ENABLE_PRODUCTION_TRADING": "true"}
            settings_store = PlatformSettingsStore(
                root / "platform_settings.sqlite",
                root / "platform-settings.key",
            )
            settings_store.save(
                settings_store.configuration_payload(environment)["values"],
                {},
                [],
                environment,
            )
            with closing(sqlite3.connect(settings_store.path)) as connection, connection:
                public_values = json.loads(connection.execute(
                    "SELECT public_json FROM platform_settings WHERE id = 1"
                ).fetchone()[0])
                public_values.pop("AIQT_ENABLE_PRODUCTION_TRADING")
                connection.execute(
                    "UPDATE platform_settings SET public_json = ? WHERE id = 1",
                    (json.dumps(public_values),),
                )

            class TestHandler(QuantApiHandler):
                audit_event_store = AuditEventStore(root / "audit.sqlite")
                cache = MarketDataCache(root / "market.sqlite")
                adapter_error_store = MarketDataAdapterErrorStore(root / "adapter_errors.sqlite")
                platform_settings_store = settings_store
                platform_settings_environ = environment
                execution_adapter_health_environ = None
                auto_paper_trading_service = None

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            try:
                connection.request("GET", "/api/settings/status")
                response = connection.getresponse()
                settings = json.loads(response.read().decode("utf-8"))["settings"]
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            self.assertEqual(response.status, 200)
            self.assertEqual(settings["configuration"]["source"], "database")
            self.assertFalse(
                settings["configuration"]["values"]["productionTradingEnabled"]
            )
            self.assertFalse(settings["safety"]["productionLive"]["enabled"])
            self.assertFalse(settings["safety"]["liveTradingAllowed"])

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
            self.assertEqual(configuration["secEdgarUserAgent"], "")
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
                    "quant_core.http_api.routes.core.discover_openai_compatible_models",
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
