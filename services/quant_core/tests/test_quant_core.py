import tempfile
import unittest
from datetime import datetime, timedelta, timezone


class QuantCoreContractTest(unittest.TestCase):
    def test_strategy_config_round_trips_with_stable_revision(self):
        from quant_core.domain import Condition, RiskRules, StrategyConfig

        strategy = StrategyConfig(
            name="SMA trend",
            market="ashare",
            symbols=["600000"],
            timeframe="1d",
            entry_conditions=[Condition(kind="close_above_sma", params={"window": 3})],
            exit_conditions=[Condition(kind="close_below_sma", params={"window": 3})],
            risk=RiskRules(position_pct=0.5, stop_loss_pct=0.08, take_profit_pct=0.16),
        )

        restored = StrategyConfig.from_json(strategy.to_json())

        self.assertEqual(restored, strategy)
        self.assertEqual(restored.revision, strategy.revision)
        self.assertEqual(restored.version, 1)

    def test_strategy_library_store_persists_stable_strategy_versions(self):
        from quant_core.research import strategy_config_from_snapshot
        from quant_core.strategy_library import StrategyLibraryStore, strategy_library_record_to_payload
        from quant_core.terminal import StrategySnapshot

        snapshot = StrategySnapshot(
            name="Saved SMA risk plan",
            entry="Close > SMA5",
            exit="Close < SMA13",
            position="35% cap per instrument",
            risk="Stop -7%, take profit +14%, drawdown guard 10%, paper only",
        )
        strategy = strategy_config_from_snapshot(snapshot, market="ashare", symbol="600000", timeframe="1d")

        with tempfile.TemporaryDirectory() as tmp:
            store = StrategyLibraryStore(f"{tmp}/strategies.sqlite")
            first = store.save(strategy, audit_run_id="run-strategy-audit")
            second = store.save(strategy)
            latest = store.list_recent(market="ashare", symbol="600000", limit=5)
            payload = strategy_library_record_to_payload(store.get(strategy.revision))

        self.assertEqual(first.revision, strategy.revision)
        self.assertEqual(second.revision, strategy.revision)
        self.assertEqual([record.revision for record in latest], [strategy.revision])
        self.assertEqual(payload["strategyId"], f"strategy-{strategy.revision}")
        self.assertEqual(payload["status"], "audited")
        self.assertEqual(payload["auditRunId"], "run-strategy-audit")
        self.assertEqual(payload["strategyConfig"]["entryConditions"][0]["params"], {"window": 5})
        self.assertEqual(payload["strategySnapshot"]["entry"], "Close > SMA5")

    def test_strategy_library_api_saves_lists_and_returns_strategy_versions(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.strategy_library import StrategyLibraryStore

        with tempfile.TemporaryDirectory() as tmp:
            class TestHandler(QuantApiHandler):
                strategy_store = StrategyLibraryStore(f"{tmp}/strategies.sqlite")

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            body = json.dumps(
                {
                    "market": "ashare",
                    "symbol": "600000",
                    "timeframe": "1d",
                    "auditRunId": "run-strategy-api",
                    "strategy": {
                        "name": "API saved SMA plan",
                        "entry": "Close > SMA8",
                        "exit": "Close < SMA21",
                        "position": "40% cap per instrument",
                        "risk": "Stop -6%, take profit +12%, drawdown guard 9%, paper only",
                    },
                }
            ).encode("utf-8")
            try:
                connection.request("POST", "/api/strategies", body=body, headers={"Content-Type": "application/json"})
                save_response = connection.getresponse()
                save_payload = json.loads(save_response.read().decode("utf-8"))
                revision = save_payload["strategy"]["revision"]
                connection.request("GET", "/api/strategies?market=ashare&symbol=600000&limit=5")
                list_response = connection.getresponse()
                list_payload = json.loads(list_response.read().decode("utf-8"))
                connection.request("GET", f"/api/strategies/{revision}")
                detail_response = connection.getresponse()
                detail_payload = json.loads(detail_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(save_response.status, 201)
        self.assertEqual(save_payload["strategy"]["status"], "audited")
        self.assertEqual(save_payload["strategy"]["auditRunId"], "run-strategy-api")
        self.assertEqual(save_payload["strategy"]["strategySnapshot"]["entry"], "Close > SMA8")
        self.assertEqual(list_response.status, 200)
        self.assertEqual([item["revision"] for item in list_payload["strategies"]], [revision])
        self.assertEqual(detail_response.status, 200)
        self.assertEqual(detail_payload["strategy"]["strategyConfig"]["risk"]["positionPct"], 0.4)

    def test_strategy_validation_summarizes_ready_and_blocked_gates(self):
        from quant_core.strategy_validation import strategy_validation_to_payload, validate_strategy_snapshot
        from quant_core.terminal import StrategySnapshot

        ready = validate_strategy_snapshot(
            StrategySnapshot(
                name="Validated SMA plan",
                entry="Close > SMA8",
                exit="Close < SMA21",
                position="40% cap per instrument",
                risk="Stop -6%, take profit +12%, drawdown guard 9%, paper only",
            ),
            market="ashare",
            symbol="600000",
            timeframe="1d",
        )
        blocked = validate_strategy_snapshot(
            StrategySnapshot(
                name="Pending context",
                entry="Run Pipeline to generate entry rules from the selected context",
                exit="Pending audited backtest",
                position="Pending risk sizing",
                risk="Paper only until a new audited run is available",
            ),
            market="ashare",
            symbol="300750",
            timeframe="1d",
        )

        self.assertEqual(ready.status, "review")
        self.assertEqual([gate.status for gate in ready.gates], ["passed", "passed", "passed", "review"])
        self.assertEqual(ready.gates[0].value, "SMA8 / SMA21")
        self.assertEqual(ready.gates[1].value, "40% / 6% / 12% / 9%")
        self.assertEqual(strategy_validation_to_payload(ready)["strategyConfig"]["revision"], ready.strategy.revision)
        self.assertEqual(blocked.status, "blocked")
        self.assertEqual([gate.status for gate in blocked.gates], ["blocked", "blocked", "passed", "blocked"])
        self.assertEqual(blocked.gates[0].detail, "Structured entry and exit rules are required before audit.")

    def test_strategy_validation_api_returns_preflight_contract(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler

        server = HTTPServer(("127.0.0.1", 0), QuantApiHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
        body = json.dumps(
            {
                "market": "ashare",
                "symbol": "600000",
                "timeframe": "1d",
                "strategy": {
                    "name": "API validated SMA plan",
                    "entry": "Close > SMA8",
                    "exit": "Close < SMA21",
                    "position": "40% cap per instrument",
                    "risk": "Stop -6%, take profit +12%, drawdown guard 9%, paper only",
                },
            }
        ).encode("utf-8")
        try:
            connection.request(
                "POST",
                "/api/strategies/validate",
                body=body,
                headers={"Content-Type": "application/json"},
            )
            response = connection.getresponse()
            payload = json.loads(response.read().decode("utf-8"))
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["validation"]["status"], "review")
        self.assertEqual(payload["validation"]["gates"][0]["id"], "schema")
        self.assertEqual(payload["validation"]["gates"][1]["value"], "40% / 6% / 12% / 9%")
        self.assertEqual(payload["validation"]["strategyConfig"]["symbols"], ["600000"])

    def test_settings_status_api_reports_sources_without_secret_values(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.live_quotes import QuantDingerLiveQuoteAdapter

        with tempfile.TemporaryDirectory() as tmp:
            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(f"{tmp}/market.sqlite")
                quote_adapter = QuantDingerLiveQuoteAdapter(finnhub_api_key="secret-finnhub-token")

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/settings/status")
                response = connection.getresponse()
                raw_body = response.read().decode("utf-8")
                payload = json.loads(raw_body)
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        settings = payload["settings"]
        us_source = next(row for row in settings["dataSources"] if row["market"] == "us")
        paper_adapter = next(row for row in settings["executionAdapters"] if row["id"] == "paper-local")

        self.assertEqual(response.status, 200)
        self.assertEqual(settings["schemaVersion"], 1)
        self.assertEqual(us_source["optionalKeyName"], "FINNHUB_API_KEY")
        self.assertTrue(us_source["optionalKeyConfigured"])
        self.assertNotIn("secret-finnhub-token", raw_body)
        self.assertEqual(settings["cache"]["engine"], "sqlite")
        self.assertTrue(settings["cache"]["exists"])
        self.assertTrue(settings["cache"]["path"].endswith("market.sqlite"))
        self.assertEqual(paper_adapter["route"], "paper")
        self.assertEqual(paper_adapter["status"], "paper_ready")
        self.assertFalse(settings["safety"]["liveTradingAllowed"])

    def test_strategy_save_api_rejects_blocked_draft_before_library_write(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.strategy_library import StrategyLibraryStore

        with tempfile.TemporaryDirectory() as tmp:
            class TestHandler(QuantApiHandler):
                strategy_store = StrategyLibraryStore(f"{tmp}/strategies.sqlite")

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            body = json.dumps(
                {
                    "market": "ashare",
                    "symbol": "600000",
                    "timeframe": "1d",
                    "strategy": {
                        "name": "Blocked SMA plan",
                        "entry": "Close > SMA8",
                        "exit": "Close < SMA21",
                        "position": "40% cap per instrument",
                        "risk": "Stop -6%, drawdown guard 9%, paper only",
                    },
                }
            ).encode("utf-8")
            try:
                connection.request(
                    "POST",
                    "/api/strategies",
                    body=body,
                    headers={"Content-Type": "application/json"},
                )
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            saved = TestHandler.strategy_store.list_recent()

        self.assertEqual(response.status, 400)
        self.assertEqual(payload["error"], "strategy_not_ready")
        self.assertEqual(payload["validation"]["status"], "blocked")
        self.assertEqual(payload["validation"]["gates"][1]["status"], "blocked")
        self.assertEqual(saved, [])

    def test_default_terminal_strategy_is_preflight_ready_before_audit(self):
        from quant_core.strategy_validation import validate_strategy_snapshot
        from quant_core.terminal import build_terminal_workspace

        workspace = build_terminal_workspace()

        validation = validate_strategy_snapshot(
            workspace.strategy,
            market=workspace.selected_instrument.market,
            symbol=workspace.selected_instrument.symbol,
            timeframe=workspace.selected_timeframe,
        )

        self.assertEqual(workspace.strategy.risk, "Stop -8%, take profit +18%, drawdown guard 12%, paper only")
        self.assertEqual(validation.status, "review")
        self.assertEqual([gate.status for gate in validation.gates], ["passed", "passed", "passed", "review"])

    def test_sqlite_cache_upserts_and_reads_ohlcv_in_time_order(self):
        from quant_core.cache import MarketDataCache
        from quant_core.domain import OHLCVBar

        older = OHLCVBar(
            symbol="BTC/USDT",
            market="crypto",
            timeframe="1d",
            timestamp=datetime(2026, 1, 1, tzinfo=timezone.utc),
            open=100,
            high=110,
            low=90,
            close=105,
            volume=10_000,
        )
        newer = OHLCVBar(
            symbol="BTC/USDT",
            market="crypto",
            timeframe="1d",
            timestamp=datetime(2026, 1, 2, tzinfo=timezone.utc),
            open=105,
            high=118,
            low=101,
            close=116,
            volume=12_000,
        )

        with tempfile.TemporaryDirectory() as tmp:
            cache = MarketDataCache(f"{tmp}/market.sqlite")
            cache.upsert_bars([newer, older, newer])
            bars = cache.read_bars("crypto", "BTC/USDT", "1d")

        self.assertEqual([bar.timestamp for bar in bars], [older.timestamp, newer.timestamp])
        self.assertEqual(bars[1].close, 116)

    def test_backtest_generates_metrics_and_trade_log_from_visual_strategy(self):
        from quant_core.backtest import BacktestEngine
        from quant_core.domain import Condition, OHLCVBar, RiskRules, StrategyConfig

        closes = [10, 10, 10, 12, 16, 18, 15, 13, 11]
        bars = [
            OHLCVBar(
                symbol="600000",
                market="ashare",
                timeframe="1d",
                timestamp=datetime(2026, 1, index + 1, tzinfo=timezone.utc),
                open=close,
                high=close + 1,
                low=close - 1,
                close=close,
                volume=1000,
            )
            for index, close in enumerate(closes)
        ]
        strategy = StrategyConfig(
            name="SMA cross",
            market="ashare",
            symbols=["600000"],
            timeframe="1d",
            entry_conditions=[Condition(kind="close_above_sma", params={"window": 3})],
            exit_conditions=[Condition(kind="close_below_sma", params={"window": 3})],
            risk=RiskRules(position_pct=1.0, stop_loss_pct=0.5, take_profit_pct=1.0),
        )

        result = BacktestEngine(initial_cash=10_000, fee_rate=0.0, slippage_rate=0.0).run(strategy, bars)

        self.assertEqual(result.strategy_name, "SMA cross")
        self.assertEqual(len(result.trades), 2)
        self.assertEqual(result.trades[0].side, "buy")
        self.assertEqual(result.trades[1].side, "sell")
        self.assertGreater(result.metrics.total_return_pct, 0)
        self.assertGreaterEqual(result.metrics.max_drawdown_pct, 0)
        self.assertEqual(len(result.equity_curve), len(bars))

    def test_ai_research_assistant_uses_results_without_promising_profit(self):
        from quant_core.ai import LocalResearchAssistant
        from quant_core.domain import AiResearchRequest, BacktestMetrics

        request = AiResearchRequest(
            strategy_name="SMA cross",
            market="ashare",
            risk_preference="balanced",
            metrics=BacktestMetrics(
                total_return_pct=12.3,
                annual_return_pct=8.1,
                max_drawdown_pct=5.5,
                win_rate_pct=50.0,
                profit_factor=1.7,
                trade_count=4,
            ),
            notes=["sample-only"],
        )

        report = LocalResearchAssistant().analyze(request)

        self.assertIn("SMA cross", report.summary)
        self.assertGreaterEqual(len(report.risks), 1)
        joined = " ".join([report.summary, *report.risks, *report.improvements])
        self.assertNotIn("保证", joined)
        self.assertNotIn("一定", joined)

    def test_paper_execution_rejects_orders_that_break_risk_limits(self):
        from quant_core.execution import PaperExecutionAdapter

        paper = PaperExecutionAdapter(initial_cash=10_000, max_position_value=2_000)

        rejected = paper.submit_order(symbol="600000", side="buy", quantity=300, price=10)
        accepted = paper.submit_order(symbol="600000", side="buy", quantity=100, price=10)

        self.assertEqual(rejected.status, "rejected")
        self.assertIn("max_position_value", rejected.reason)
        self.assertEqual(accepted.status, "filled")
        self.assertEqual(paper.account().positions["600000"], 100)

    def test_paper_execution_store_persists_orders_bound_to_research_run(self):
        from quant_core.execution import PaperExecutionStore, create_paper_execution_from_audit, paper_execution_record_to_payload
        from quant_core.runs import ResearchRunAudit

        audit = ResearchRunAudit(
            run_id="run-paper-store",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-paper-store",
            data_rows=1,
            metrics={"total_return_pct": 2.4, "trade_count": 1},
            decisions=[],
            execution_mode="paper_only",
            ai_report={"summary": "Paper", "risks": [], "improvements": [], "disclaimer": "No advice"},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-paper-store",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 9.1,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000,
                    }
                ],
            },
            strategy_config={
                "risk": {"positionPct": 0.2, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.2}
            },
            backtest_assumptions={"initialCash": 100000, "feeBps": 3, "slippageBps": 2},
        )

        with tempfile.TemporaryDirectory() as tmp:
            store = PaperExecutionStore(f"{tmp}/paper.sqlite")
            store.record(create_paper_execution_from_audit(audit))
            payload = paper_execution_record_to_payload(store.list_by_run("run-paper-store")[0])

        self.assertEqual(payload["runId"], "run-paper-store")
        self.assertEqual(payload["orders"][0]["symbol"], "600000")
        self.assertEqual(payload["orders"][0]["side"], "buy")
        self.assertEqual(payload["orders"][0]["quantity"], 2100)
        self.assertEqual(payload["orders"][0]["status"], "filled")
        self.assertEqual(payload["account"]["positions"], {"600000": 2100})
        self.assertEqual([gate["id"] for gate in payload["gates"]], ["audit-run-bound", "paper-risk-check", "live-route-blocked"])
        self.assertTrue(payload["gates"][0]["passed"])
        self.assertFalse(payload["gates"][2]["passed"])

    def test_promotion_candidate_tracks_paper_to_live_readiness(self):
        from quant_core.execution import build_promotion_candidate, create_paper_execution_from_audit
        from quant_core.runs import ResearchRunAudit

        audit = ResearchRunAudit(
            run_id="run-promotion-candidate",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-promotion-candidate",
            data_rows=1,
            metrics={"total_return_pct": 12.4, "max_drawdown_pct": 5.8, "trade_count": 12},
            decisions=[],
            execution_mode="paper_only",
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-promotion-candidate",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 9.1,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000,
                    }
                ],
            },
            strategy_config={
                "name": "SMA trend demo",
                "revision": "rev-promotion-candidate",
                "market": "ashare",
                "symbols": ["600000"],
                "timeframe": "1d",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                "risk": {"positionPct": 0.2, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.12},
            },
            backtest_assumptions={"initialCash": 100000, "feeBps": 3, "slippageBps": 2},
        )

        pending = build_promotion_candidate(audit, [])
        execution = create_paper_execution_from_audit(audit, created_at=datetime(2026, 5, 26, 8, 30, tzinfo=timezone.utc))
        candidate = build_promotion_candidate(audit, [execution])

        self.assertEqual(pending["status"], "paper_pending")
        self.assertEqual(pending["headline"], "Paper execution required")
        self.assertEqual(pending["evidence"]["paperExecutions"], 0)
        self.assertEqual(candidate["candidateId"], "promotion-run-promotion-candidate")
        self.assertEqual(candidate["status"], "certification_pending")
        self.assertEqual(candidate["headline"], "Live promotion pending certification")
        self.assertEqual(candidate["runId"], "run-promotion-candidate")
        self.assertEqual(candidate["latestPaperExecutionId"], execution.execution_id)
        self.assertEqual(candidate["evidence"], {"paperExecutions": 1, "filledOrders": 1, "passedPaperRiskChecks": 1})
        self.assertEqual(
            [stage["id"] for stage in candidate["stages"]],
            ["audited-run", "risk-approval", "paper-execution", "adapter-certification", "human-confirmation"],
        )
        self.assertEqual(candidate["stages"][2]["value"], "1 filled order")
        self.assertTrue(candidate["stages"][2]["passed"])
        self.assertFalse(candidate["liveTradingAllowed"])

    def test_promotion_candidate_blocks_when_strategy_risk_is_incomplete(self):
        from quant_core.execution import build_promotion_candidate, create_paper_execution_from_audit
        from quant_core.runs import ResearchRunAudit

        audit = ResearchRunAudit(
            run_id="run-promotion-missing-risk",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="Incomplete promotion risk",
            strategy_revision="rev-promotion-missing-risk",
            data_rows=1,
            metrics={"total_return_pct": 12.4, "max_drawdown_pct": 5.8, "trade_count": 12},
            decisions=[],
            execution_mode="paper_only",
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-promotion-missing-risk",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 9.1,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000,
                    }
                ],
            },
            strategy_config={
                "name": "Incomplete promotion risk",
                "revision": "rev-promotion-missing-risk",
                "market": "ashare",
                "symbols": ["600000"],
                "timeframe": "1d",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                "risk": {"positionPct": 0.2, "stopLossPct": 0.08, "takeProfitPct": None, "maxDrawdownPct": 0.12},
            },
            backtest_assumptions={"initialCash": 100000, "feeBps": 3, "slippageBps": 2},
        )
        execution = create_paper_execution_from_audit(audit, created_at=datetime(2026, 5, 26, 8, 30, tzinfo=timezone.utc))

        candidate = build_promotion_candidate(audit, [execution])
        risk_stage = next(stage for stage in candidate["stages"] if stage["id"] == "risk-approval")

        self.assertEqual(candidate["status"], "blocked")
        self.assertEqual(candidate["headline"], "Promotion queue blocked")
        self.assertEqual(candidate["latestPaperExecutionId"], execution.execution_id)
        self.assertEqual(risk_stage["value"], "risk blocked")
        self.assertEqual(risk_stage["status"], "blocked")
        self.assertFalse(risk_stage["passed"])
        self.assertEqual(candidate["evidence"]["filledOrders"], 1)

    def test_research_run_paper_execution_api_records_order_for_run(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.execution import PaperExecutionStore
        from quant_core.runs import ResearchRunAudit, ResearchRunStore

        audit = ResearchRunAudit(
            run_id="run-paper-api",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-paper-api",
            data_rows=1,
            metrics={"total_return_pct": 2.4, "trade_count": 1},
            decisions=[],
            execution_mode="paper_only",
            ai_report={"summary": "Paper", "risks": [], "improvements": [], "disclaimer": "No advice"},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-paper-api",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 9.1,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000,
                    }
                ],
            },
            strategy_config={
                "name": "SMA trend demo",
                "revision": "rev-paper-api",
                "market": "ashare",
                "symbols": ["600000"],
                "timeframe": "1d",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                "risk": {"positionPct": 0.2, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.12},
            },
            backtest_assumptions={"initialCash": 100000, "feeBps": 3, "slippageBps": 2},
        )

        with tempfile.TemporaryDirectory() as tmp:
            research_store = ResearchRunStore(f"{tmp}/runs.sqlite")
            paper_store = PaperExecutionStore(f"{tmp}/paper.sqlite")
            research_store.record(audit)

            class TestHandler(QuantApiHandler):
                run_store = research_store
                paper_execution_store = paper_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("POST", "/api/research/runs/run-paper-api/paper-executions")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
                connection.request("GET", "/api/research/runs/run-paper-api/paper-executions")
                list_response = connection.getresponse()
                list_payload = json.loads(list_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 201)
        self.assertEqual(payload["execution"]["runId"], "run-paper-api")
        self.assertEqual(payload["execution"]["orders"][0]["status"], "filled")
        self.assertEqual(payload["promotion"]["runId"], "run-paper-api")
        self.assertEqual(payload["promotion"]["status"], "certification_pending")
        self.assertEqual(payload["promotion"]["latestPaperExecutionId"], payload["execution"]["executionId"])
        self.assertEqual(list_response.status, 200)
        self.assertEqual(list_payload["executions"][0]["executionId"], payload["execution"]["executionId"])

    def test_research_run_paper_execution_api_rejects_incomplete_strategy_risk(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.execution import PaperExecutionStore
        from quant_core.runs import ResearchRunAudit, ResearchRunStore

        audit = ResearchRunAudit(
            run_id="run-paper-missing-risk",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="Incomplete paper risk",
            strategy_revision="rev-paper-missing-risk",
            data_rows=1,
            metrics={"total_return_pct": 2.4, "trade_count": 1},
            decisions=[],
            execution_mode="paper_only",
            ai_report={"summary": "Paper", "risks": [], "improvements": [], "disclaimer": "No advice"},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-paper-missing-risk",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 9.1,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000,
                    }
                ],
            },
            strategy_config={
                "name": "Incomplete paper risk",
                "revision": "rev-paper-missing-risk",
                "market": "ashare",
                "symbols": ["600000"],
                "timeframe": "1d",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                "risk": {"positionPct": 0.2, "stopLossPct": 0.08, "takeProfitPct": None, "maxDrawdownPct": 0.12},
            },
            backtest_assumptions={"initialCash": 100000, "feeBps": 3, "slippageBps": 2},
        )

        with tempfile.TemporaryDirectory() as tmp:
            research_store = ResearchRunStore(f"{tmp}/runs.sqlite")
            paper_store = PaperExecutionStore(f"{tmp}/paper.sqlite")
            research_store.record(audit)

            class TestHandler(QuantApiHandler):
                run_store = research_store
                paper_execution_store = paper_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("POST", "/api/research/runs/run-paper-missing-risk/paper-executions")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            executions = paper_store.list_by_run("run-paper-missing-risk")

        self.assertEqual(response.status, 400)
        self.assertEqual(payload["error"], "invalid_paper_execution")
        self.assertEqual(payload["detail"], "paper_execution_strategy_risk_incomplete")
        self.assertEqual(executions, [])

    def test_research_run_promotion_api_and_export_include_candidate(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.execution import PaperExecutionStore, create_paper_execution_from_audit
        from quant_core.runs import ResearchRunAudit, ResearchRunStore

        audit = ResearchRunAudit(
            run_id="run-promotion-api",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-promotion-api",
            data_rows=1,
            metrics={"total_return_pct": 12.4, "max_drawdown_pct": 5.8, "trade_count": 12},
            decisions=[],
            execution_mode="paper_only",
            ai_report={"summary": "Paper", "risks": ["No live adapter"], "improvements": [], "disclaimer": "No advice"},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-promotion-api",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 9.1,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000,
                    }
                ],
            },
            strategy_config={
                "name": "SMA trend demo",
                "revision": "rev-promotion-api",
                "market": "ashare",
                "symbols": ["600000"],
                "timeframe": "1d",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                "risk": {"positionPct": 0.2, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.12},
            },
            backtest_assumptions={"initialCash": 100000, "feeBps": 3, "slippageBps": 2},
            backtest_trades=[{"id": "trade-1"}],
            backtest_equity_curve=[{"timestamp": "2026-05-26T08:00:00+00:00", "equity": 100000}],
        )

        with tempfile.TemporaryDirectory() as tmp:
            research_store = ResearchRunStore(f"{tmp}/runs.sqlite")
            paper_store = PaperExecutionStore(f"{tmp}/paper.sqlite")
            research_store.record(audit)
            paper_store.record(create_paper_execution_from_audit(audit))

            class TestHandler(QuantApiHandler):
                run_store = research_store
                paper_execution_store = paper_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/research/runs/run-promotion-api/promotion")
                promotion_response = connection.getresponse()
                promotion_payload = json.loads(promotion_response.read().decode("utf-8"))
                connection.request("GET", "/api/research/runs/run-promotion-api/export")
                export_response = connection.getresponse()
                export_payload = json.loads(export_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(promotion_response.status, 200)
        self.assertEqual(promotion_payload["promotion"]["status"], "certification_pending")
        self.assertEqual(promotion_payload["promotion"]["evidence"]["filledOrders"], 1)
        self.assertEqual(export_response.status, 200)
        self.assertEqual(export_payload["export"]["manifest"]["artifactCounts"]["promotionCandidates"], 1)
        self.assertEqual(export_payload["export"]["promotionCandidate"]["runId"], "run-promotion-api")
        self.assertEqual(export_payload["export"]["promotionCandidate"]["status"], "certification_pending")

    def test_research_run_paper_execution_api_returns_404_for_missing_run(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.execution import PaperExecutionStore
        from quant_core.runs import ResearchRunStore

        with tempfile.TemporaryDirectory() as tmp:
            research_store = ResearchRunStore(f"{tmp}/runs.sqlite")
            paper_store = PaperExecutionStore(f"{tmp}/paper.sqlite")

            class TestHandler(QuantApiHandler):
                run_store = research_store
                paper_execution_store = paper_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("POST", "/api/research/runs/run-missing/paper-executions")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 404)
        self.assertEqual(payload["error"], "research_run_not_found")

    def test_terminal_workspace_contract_keeps_ai_and_execution_gates_traceable(self):
        from quant_core.terminal import (
            agent_role_labels,
            build_terminal_workspace,
            execution_gate_ids,
            quant_loop_labels,
        )

        workspace = build_terminal_workspace()

        self.assertEqual(workspace.schema_version, 1)
        self.assertEqual(
            quant_loop_labels(workspace),
            [
                "Market Research",
                "Strategy Lab",
                "Backtest Review",
                "Agent Review",
                "Paper Trading",
            ],
        )
        self.assertEqual(
            agent_role_labels(workspace),
            [
                "Technical Analyst",
                "Fundamental Analyst",
                "News Analyst",
                "Sentiment Analyst",
                "Bull Researcher",
                "Bear Researcher",
                "Risk Manager",
                "Portfolio Manager",
            ],
        )
        self.assertEqual(execution_gate_ids(workspace), ["adapter-certified", "risk-approved", "human-confirmed"])
        self.assertEqual(workspace.execution.mode, "paper_only")
        self.assertFalse(workspace.execution.live_enabled)

    def test_terminal_workspace_serializes_to_frontend_contract_shape(self):
        from quant_core.terminal import build_terminal_workspace, terminal_workspace_to_payload

        payload = terminal_workspace_to_payload(build_terminal_workspace())

        self.assertEqual(payload["schemaVersion"], 1)
        self.assertEqual(payload["selectedInstrument"]["symbol"], "600000")
        self.assertEqual(payload["selectedTimeframe"], "1d")
        self.assertEqual(payload["execution"]["liveEnabled"], False)
        self.assertEqual(payload["backtestAssumptions"], {"initialCash": 100000, "feeBps": 3, "slippageBps": 2})
        self.assertEqual(payload["workflowNodes"][-1]["id"], "execution")
        self.assertGreaterEqual(len(payload["decisionLog"]), 4)

    def test_research_api_builds_engine_from_backtest_assumption_query(self):
        from quant_core.api import _backtest_engine_from_query

        engine = _backtest_engine_from_query({"initialCash": ["250000"], "feeBps": ["8"], "slippageBps": ["4"]})

        self.assertEqual(engine.initial_cash, 250000)
        self.assertAlmostEqual(engine.fee_rate, 0.0008)
        self.assertAlmostEqual(engine.slippage_rate, 0.0004)

        fallback = _backtest_engine_from_query({"initialCash": ["0"], "feeBps": ["-1"], "slippageBps": ["abc"]})

        self.assertEqual(fallback.initial_cash, 100000)
        self.assertAlmostEqual(fallback.fee_rate, 0.0003)
        self.assertAlmostEqual(fallback.slippage_rate, 0.0002)

    def test_research_api_uses_kline_adapter_and_bounded_data_limit(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.adapters import DemoMarketDataAdapter
        from quant_core.ai import LocalResearchAssistant
        from quant_core.api import QuantApiHandler
        from quant_core.backtest import BacktestEngine
        from quant_core.cache import MarketDataCache
        from quant_core.runs import ResearchRunStore

        class FailingDemoAdapter:
            source = "demo"

            def fetch_ohlcv(self, request):
                raise AssertionError("research API should use the kline adapter")

        class RecordingKlineAdapter:
            source = "recording"

            def __init__(self):
                self.calls = []
                self.delegate = DemoMarketDataAdapter()

            def fetch_ohlcv(self, request, limit=160):
                self.calls.append((request.market, request.symbol, request.timeframe, limit))
                return self.delegate.fetch_ohlcv(request)

        with tempfile.TemporaryDirectory() as tmp:
            recording_adapter = RecordingKlineAdapter()

            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(f"{tmp}/market.sqlite")
                adapter = FailingDemoAdapter()
                assistant = LocalResearchAssistant()
                engine = BacktestEngine()
                run_store = ResearchRunStore(f"{tmp}/runs.sqlite")
                kline_adapter = recording_adapter

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/research/run?market=ashare&symbol=600000&timeframe=1d&limit=240")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["selectedInstrument"]["symbol"], "600000")
        self.assertEqual(recording_adapter.calls, [("ashare", "600000", "1d", 240)])

    def test_research_api_applies_submitted_strategy_snapshot(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread
        from urllib.parse import urlencode

        from quant_core.ai import LocalResearchAssistant
        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.runs import ResearchRunStore

        with tempfile.TemporaryDirectory() as tmp:
            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(f"{tmp}/market.sqlite")
                assistant = LocalResearchAssistant()
                run_store = ResearchRunStore(f"{tmp}/runs.sqlite")

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            params = urlencode(
                {
                    "market": "ashare",
                    "symbol": "600000",
                    "timeframe": "1d",
                    "strategyName": "Custom SMA risk plan",
                    "strategyEntry": "Close > SMA5",
                    "strategyExit": "Close < SMA7",
                    "strategyPosition": "25% cap per instrument",
                    "strategyRisk": "Stop -6%, take profit +12%, drawdown guard 9%, paper only",
                    "initialCash": "100000",
                    "feeBps": "3",
                    "slippageBps": "2",
                }
            )
            try:
                connection.request("GET", f"/api/research/run?{params}")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["strategy"]["name"], "Custom SMA risk plan")
        self.assertEqual(payload["strategy"]["entry"], "Close > SMA5")
        self.assertEqual(payload["strategy"]["exit"], "Close < SMA7")
        self.assertEqual(payload["strategy"]["position"], "25% cap per instrument")
        self.assertEqual(payload["strategy"]["risk"], "Stop -6%, take profit +12%, drawdown guard 9%, paper only")

    def test_research_api_rejects_blocked_strategy_snapshot_before_audit(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread
        from urllib.parse import urlencode

        from quant_core.ai import LocalResearchAssistant
        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.runs import ResearchRunStore

        with tempfile.TemporaryDirectory() as tmp:
            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(f"{tmp}/market.sqlite")
                assistant = LocalResearchAssistant()
                run_store = ResearchRunStore(f"{tmp}/runs.sqlite")

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            params = urlencode(
                {
                    "market": "ashare",
                    "symbol": "600000",
                    "timeframe": "1d",
                    "strategyName": "Incomplete risk plan",
                    "strategyEntry": "Close > SMA5",
                    "strategyExit": "Close < SMA7",
                    "strategyPosition": "25% cap per instrument",
                    "strategyRisk": "Stop -6%, drawdown guard 9%, paper only",
                }
            )
            try:
                connection.request("GET", f"/api/research/run?{params}")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 400)
        self.assertEqual(payload["error"], "strategy_not_ready")
        self.assertEqual(payload["validation"]["status"], "blocked")
        self.assertEqual(payload["validation"]["gates"][1]["id"], "risk")
        self.assertEqual(payload["validation"]["gates"][1]["status"], "blocked")

    def test_research_api_binds_audited_strategy_to_strategy_library(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread
        from urllib.parse import urlencode

        from quant_core.ai import LocalResearchAssistant
        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.runs import ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

        with tempfile.TemporaryDirectory() as tmp:
            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(f"{tmp}/market.sqlite")
                assistant = LocalResearchAssistant()
                run_store = ResearchRunStore(f"{tmp}/runs.sqlite")
                strategy_store = StrategyLibraryStore(f"{tmp}/strategies.sqlite")

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            params = urlencode(
                {
                    "market": "ashare",
                    "symbol": "600000",
                    "timeframe": "1d",
                    "strategyName": "Audited SMA library plan",
                    "strategyEntry": "Close > SMA6",
                    "strategyExit": "Close < SMA18",
                    "strategyPosition": "45% cap per instrument",
                    "strategyRisk": "Stop -5%, take profit +11%, drawdown guard 8%, paper only",
                }
            )
            try:
                connection.request("GET", f"/api/research/run?{params}")
                run_response = connection.getresponse()
                run_payload = json.loads(run_response.read().decode("utf-8"))
                connection.request("GET", "/api/strategies?market=ashare&symbol=600000&limit=3")
                strategy_response = connection.getresponse()
                strategy_payload = json.loads(strategy_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(run_response.status, 200)
        self.assertEqual(strategy_response.status, 200)
        self.assertEqual(len(strategy_payload["strategies"]), 1)
        saved_strategy = strategy_payload["strategies"][0]
        self.assertEqual(saved_strategy["revision"], run_payload["researchRun"]["strategyRevision"])
        self.assertEqual(saved_strategy["status"], "audited")
        self.assertEqual(saved_strategy["auditRunId"], run_payload["researchRun"]["runId"])
        self.assertEqual(saved_strategy["strategySnapshot"]["entry"], "Close > SMA6")

    def test_research_notes_api_persists_symbol_timeframe_notes(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.research_notes import ResearchNoteStore

        with tempfile.TemporaryDirectory() as tmp:
            class TestHandler(QuantApiHandler):
                note_store = ResearchNoteStore(f"{tmp}/notes.sqlite")

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/research/notes?market=ashare&symbol=600000&timeframe=1d")
                empty_response = connection.getresponse()
                empty_payload = json.loads(empty_response.read().decode("utf-8"))
                connection.request(
                    "POST",
                    "/api/research/notes",
                    body=json.dumps(
                        {
                            "market": "ashare",
                            "symbol": "600000",
                            "timeframe": "1d",
                            "body": "关注银行板块相对强度，等待放量确认。",
                        },
                        ensure_ascii=False,
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                save_response = connection.getresponse()
                save_payload = json.loads(save_response.read().decode("utf-8"))
                connection.request("GET", "/api/research/notes?market=ashare&symbol=600000&timeframe=1d")
                read_response = connection.getresponse()
                read_payload = json.loads(read_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(empty_response.status, 200)
        self.assertEqual(empty_payload["note"]["body"], "")
        self.assertIsNone(empty_payload["note"]["updatedAt"])
        self.assertEqual(save_response.status, 201)
        self.assertEqual(save_payload["note"]["body"], "关注银行板块相对强度，等待放量确认。")
        self.assertIsNotNone(save_payload["note"]["updatedAt"])
        self.assertEqual(read_response.status, 200)
        self.assertEqual(read_payload["note"], save_payload["note"])

    def test_research_run_api_locks_current_note_into_audit_evidence(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.adapters import DemoMarketDataAdapter
        from quant_core.ai import LocalResearchAssistant
        from quant_core.api import QuantApiHandler
        from quant_core.backtest import BacktestEngine
        from quant_core.cache import MarketDataCache
        from quant_core.research_notes import ResearchNoteStore
        from quant_core.runs import ResearchRunStore

        class DemoKlineAdapter:
            source = "demo-test"

            def __init__(self):
                self.delegate = DemoMarketDataAdapter()

            def fetch_ohlcv(self, request, limit=160):
                return self.delegate.fetch_ohlcv(request)

        with tempfile.TemporaryDirectory() as tmp:
            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(f"{tmp}/market.sqlite")
                assistant = LocalResearchAssistant()
                engine = BacktestEngine()
                run_store = ResearchRunStore(f"{tmp}/runs.sqlite")
                note_store = ResearchNoteStore(f"{tmp}/notes.sqlite")
                kline_adapter = DemoKlineAdapter()

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request(
                    "POST",
                    "/api/research/notes",
                    body=json.dumps(
                        {
                            "market": "ashare",
                            "symbol": "600000",
                            "timeframe": "1d",
                            "body": "关注银行板块相对强度，等待放量确认。",
                        },
                        ensure_ascii=False,
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                note_response = connection.getresponse()
                note_response.read()
                connection.request("GET", "/api/research/run?market=ashare&symbol=600000&timeframe=1d&limit=120")
                run_response = connection.getresponse()
                run_payload = json.loads(run_response.read().decode("utf-8"))
                run_id = run_payload["researchRun"]["runId"]
                connection.request("GET", f"/api/research/runs/{run_id}")
                detail_response = connection.getresponse()
                detail_payload = json.loads(detail_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(note_response.status, 201)
        self.assertEqual(run_response.status, 200)
        self.assertEqual(run_payload["researchRun"]["researchNote"]["body"], "关注银行板块相对强度，等待放量确认。")
        self.assertEqual(run_payload["researchRun"]["researchNote"]["symbol"], "600000")
        self.assertEqual(detail_response.status, 200)
        self.assertEqual(detail_payload["run"]["researchNote"]["body"], "关注银行板块相对强度，等待放量确认。")

    def test_terminal_research_run_updates_workspace_from_backtest_and_ai_report(self):
        from quant_core.research import run_terminal_research
        from quant_core.terminal import terminal_workspace_to_payload

        workspace = run_terminal_research(market="ashare", symbol="600000", timeframe="5m")
        payload = terminal_workspace_to_payload(workspace)

        self.assertEqual(payload["schemaVersion"], 1)
        self.assertEqual(payload["selectedInstrument"]["symbol"], "600000")
        self.assertEqual(payload["selectedTimeframe"], "5m")
        self.assertEqual(payload["strategy"]["name"], "SMA trend demo")
        self.assertEqual(payload["backtestAssumptions"], {"initialCash": 100000, "feeBps": 3, "slippageBps": 2})
        self.assertEqual([metric["label"] for metric in payload["metrics"]], ["Return", "Max DD", "Win Rate", "Trades"])
        self.assertGreater(len(payload["backtestTrades"]), 0)
        self.assertEqual(payload["backtestTrades"][0]["symbol"], "600000")
        self.assertIn(payload["backtestTrades"][0]["side"], ["BUY", "SELL"])
        self.assertEqual(payload["backtestTrades"][0]["status"], "filled")
        self.assertTrue(payload["backtestTrades"][0]["timestamp"])
        self.assertGreater(len(payload["backtestEquityCurve"]), 0)
        self.assertTrue(payload["backtestEquityCurve"][0]["timestamp"])
        self.assertIsInstance(payload["backtestEquityCurve"][0]["equity"], (int, float))
        self.assertEqual(
            [diagnostic["id"] for diagnostic in payload["backtestDiagnostics"]],
            ["return-profile", "drawdown-profile", "trade-quality", "data-coverage"],
        )
        self.assertIn(payload["backtestDiagnostics"][0]["tone"], ["positive", "warning", "neutral", "risk"])
        self.assertTrue(payload["decisionLog"][0]["message"])
        self.assertEqual(payload["decisionLog"][0]["agent"], "AI Summary")
        self.assertEqual(payload["execution"]["mode"], "paper_only")
        self.assertFalse(payload["execution"]["liveEnabled"])
        self.assertEqual(payload["researchRun"]["dataSnapshot"]["source"], "demo")
        self.assertGreater(len(payload["researchRun"]["dataSnapshot"]["bars"]), 0)
        self.assertEqual(
            payload["researchRun"]["dataSnapshot"]["bars"][-1]["timestamp"],
            payload["backtestEquityCurve"][-1]["timestamp"],
        )

    def test_terminal_research_run_builds_strategy_from_submitted_snapshot(self):
        from quant_core.backtest import BacktestEngine
        from quant_core.research import run_terminal_research
        from quant_core.terminal import StrategySnapshot, terminal_workspace_to_payload

        class RecordingBacktestEngine(BacktestEngine):
            def __init__(self):
                super().__init__(initial_cash=100_000, fee_rate=0.0003, slippage_rate=0.0002)
                self.strategy = None

            def run(self, strategy, bars):
                self.strategy = strategy
                return super().run(strategy, bars)

        engine = RecordingBacktestEngine()
        snapshot = StrategySnapshot(
            name="Custom SMA risk plan",
            entry="Close > SMA5",
            exit="Close < SMA7",
            position="25% cap per instrument",
            risk="Stop -6%, take profit +12%, drawdown guard 9%, paper only",
        )

        workspace = run_terminal_research(
            market="ashare",
            symbol="600000",
            timeframe="1d",
            engine=engine,
            strategy_snapshot=snapshot,
        )
        payload = terminal_workspace_to_payload(workspace)

        self.assertEqual(payload["strategy"], {
            "name": "Custom SMA risk plan",
            "entry": "Close > SMA5",
            "exit": "Close < SMA7",
            "position": "25% cap per instrument",
            "risk": "Stop -6%, take profit +12%, drawdown guard 9%, paper only",
        })
        self.assertIsNotNone(engine.strategy)
        self.assertEqual(engine.strategy.name, "Custom SMA risk plan")
        self.assertEqual(engine.strategy.entry_conditions[0].kind, "close_above_sma")
        self.assertEqual(engine.strategy.entry_conditions[0].params, {"window": 5})
        self.assertEqual(engine.strategy.exit_conditions[0].kind, "close_below_sma")
        self.assertEqual(engine.strategy.exit_conditions[0].params, {"window": 7})
        self.assertAlmostEqual(engine.strategy.risk.position_pct, 0.25)
        self.assertAlmostEqual(engine.strategy.risk.stop_loss_pct, 0.06)
        self.assertAlmostEqual(engine.strategy.risk.take_profit_pct, 0.12)
        self.assertAlmostEqual(engine.strategy.risk.max_drawdown_pct, 0.09)
        self.assertEqual(payload["researchRun"]["strategyRevision"], engine.strategy.revision)

    def test_research_run_store_records_and_reads_audit_records(self):
        from quant_core.runs import ResearchRunAudit, ResearchRunStore

        created_at = datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc)
        record = ResearchRunAudit(
            run_id="run-test",
            created_at=created_at,
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev123",
            data_rows=120,
            metrics={"total_return_pct": 1.2, "trade_count": 6},
            decisions=[{"agent": "AI Summary", "message": "研究完成", "tone": "ai"}],
            execution_mode="paper_only",
            ai_report={
                "summary": "AI summary for audited storage",
                "risks": ["Risk note"],
                "improvements": ["Compare against benchmark"],
                "disclaimer": "Not investment advice",
            },
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 2,
                "start": "2026-05-26T08:00:00+00:00",
                "end": "2026-05-27T08:00:00+00:00",
                "hash": "snapshot-test",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 9.1,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000,
                    },
                    {
                        "timestamp": "2026-05-27T08:00:00+00:00",
                        "timestampMs": 1779868800000,
                        "open": 9.2,
                        "high": 9.4,
                        "low": 9.1,
                        "close": 9.3,
                        "volume": 1300000,
                    },
                ],
            },
            data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 120},
            strategy_config={
                "name": "SMA trend demo",
                "revision": "rev123",
                "market": "ashare",
                "symbols": ["600000"],
                "timeframe": "1d",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                "risk": {"positionPct": 0.8, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.2},
            },
            backtest_assumptions={"initialCash": 250000, "feeBps": 8, "slippageBps": 4},
            backtest_trades=[
                {
                    "id": "trade-1",
                    "timestamp": "2026-05-26T08:00:00+00:00",
                    "symbol": "600000",
                    "side": "BUY",
                    "status": "filled",
                    "price": "9.20",
                    "quantity": "2100",
                    "exposure": "19.32%",
                    "pnl": "-",
                    "reason": "entry_conditions",
                    "tone": "neutral",
                }
            ],
            backtest_equity_curve=[
                {"timestamp": "2026-05-26T08:00:00+00:00", "equity": 250000.0},
                {"timestamp": "2026-05-27T08:00:00+00:00", "equity": 253000.0},
            ],
            backtest_diagnostics=[
                {
                    "id": "return-profile",
                    "label": "Return profile",
                    "value": "+1.20%",
                    "detail": "Total return over 120 bars",
                    "tone": "positive",
                }
            ],
        )

        with tempfile.TemporaryDirectory() as tmp:
            store = ResearchRunStore(f"{tmp}/runs.sqlite")
            store.record(record)
            latest = store.list_recent(limit=1)

        self.assertEqual(len(latest), 1)
        self.assertEqual(latest[0].run_id, "run-test")
        self.assertEqual(latest[0].created_at, created_at)
        self.assertEqual(latest[0].metrics["trade_count"], 6)
        self.assertEqual(latest[0].decisions[0]["agent"], "AI Summary")
        self.assertEqual(latest[0].ai_report["summary"], "AI summary for audited storage")
        self.assertEqual(latest[0].ai_report["risks"], ["Risk note"])
        self.assertEqual(latest[0].ai_report["improvements"], ["Compare against benchmark"])
        self.assertEqual(latest[0].ai_report["disclaimer"], "Not investment advice")
        self.assertEqual(latest[0].data_snapshot["source"], "tencent")
        self.assertEqual(latest[0].data_snapshot["rows"], 2)
        self.assertEqual(latest[0].data_snapshot["hash"], "snapshot-test")
        self.assertEqual(latest[0].data_snapshot["bars"][0]["close"], 9.2)
        self.assertEqual(latest[0].data_quality, {"source": "tencent", "isComplete": True, "warnings": [], "rows": 120})
        self.assertEqual(latest[0].strategy_config["entryConditions"][0]["params"], {"window": 20})
        self.assertEqual(latest[0].strategy_config["risk"]["positionPct"], 0.8)
        self.assertEqual(latest[0].backtest_assumptions, {"initialCash": 250000, "feeBps": 8, "slippageBps": 4})
        self.assertEqual(latest[0].backtest_trades[0]["id"], "trade-1")
        self.assertEqual(latest[0].backtest_trades[0]["side"], "BUY")
        self.assertEqual(latest[0].backtest_equity_curve[-1]["equity"], 253000.0)
        self.assertEqual(latest[0].backtest_diagnostics[0]["id"], "return-profile")

    def test_research_run_store_reads_single_audit_record_by_id(self):
        from quant_core.runs import ResearchRunAudit, ResearchRunStore

        older = ResearchRunAudit(
            run_id="run-older",
            created_at=datetime(2026, 5, 26, 7, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-old",
            data_rows=100,
            metrics={"total_return_pct": 1.2, "trade_count": 4},
            decisions=[],
            execution_mode="paper_only",
        )
        newer = ResearchRunAudit(
            run_id="run-newer",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="us",
            symbol="AAPL",
            timeframe="5m",
            strategy_name="SMA trend demo",
            strategy_revision="rev-new",
            data_rows=240,
            metrics={"total_return_pct": 3.4, "trade_count": 8},
            decisions=[{"agent": "AI Summary", "message": "Done", "tone": "ai"}],
            execution_mode="paper_only",
            ai_report={
                "summary": "Single detail AI summary",
                "risks": ["Single detail risk"],
                "improvements": ["Single detail improvement"],
                "disclaimer": "No direct trading advice",
            },
            data_snapshot={
                "source": "yfinance",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "start": "2026-05-26T08:00:00+00:00",
                "end": "2026-05-26T08:00:00+00:00",
                "hash": "snapshot-newer",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 191.0,
                        "high": 193.0,
                        "low": 190.0,
                        "close": 192.0,
                        "volume": 1000000,
                    }
                ],
            },
            data_quality={"source": "demo-fallback", "isComplete": False, "warnings": ["upstream unavailable"], "rows": 240},
            strategy_config={
                "name": "SMA trend demo",
                "revision": "rev-new",
                "market": "us",
                "symbols": ["AAPL"],
                "timeframe": "5m",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 5}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 7}}],
                "risk": {"positionPct": 0.25, "stopLossPct": 0.06, "takeProfitPct": 0.12, "maxDrawdownPct": 0.09},
            },
            backtest_assumptions={"initialCash": 250000, "feeBps": 8, "slippageBps": 4},
            backtest_trades=[
                {
                    "id": "trade-1",
                    "timestamp": "2026-05-26T08:00:00+00:00",
                    "symbol": "AAPL",
                    "side": "BUY",
                    "status": "filled",
                    "price": "191.20",
                    "quantity": "100",
                    "exposure": "19.12%",
                    "pnl": "-",
                    "reason": "entry_conditions",
                    "tone": "neutral",
                }
            ],
            backtest_equity_curve=[{"timestamp": "2026-05-26T08:00:00+00:00", "equity": 250000.0}],
            backtest_diagnostics=[
                {
                    "id": "return-profile",
                    "label": "Return profile",
                    "value": "+3.40%",
                    "detail": "Total return over 240 bars",
                    "tone": "positive",
                }
            ],
        )

        with tempfile.TemporaryDirectory() as tmp:
            store = ResearchRunStore(f"{tmp}/runs.sqlite")
            store.record(older)
            store.record(newer)
            restored = store.get("run-newer")
            missing = store.get("run-missing")

        self.assertIsNotNone(restored)
        assert restored is not None
        self.assertEqual(restored.run_id, "run-newer")
        self.assertEqual(restored.symbol, "AAPL")
        self.assertEqual(restored.ai_report["summary"], "Single detail AI summary")
        self.assertEqual(restored.ai_report["risks"], ["Single detail risk"])
        self.assertEqual(restored.ai_report["improvements"], ["Single detail improvement"])
        self.assertEqual(restored.ai_report["disclaimer"], "No direct trading advice")
        self.assertEqual(restored.data_snapshot["hash"], "snapshot-newer")
        self.assertEqual(restored.data_snapshot["bars"][0]["close"], 192.0)
        self.assertEqual(
            restored.data_quality,
            {"source": "demo-fallback", "isComplete": False, "warnings": ["upstream unavailable"], "rows": 240},
        )
        self.assertEqual(restored.strategy_config["symbols"], ["AAPL"])
        self.assertEqual(restored.strategy_config["entryConditions"][0]["params"], {"window": 5})
        self.assertEqual(restored.backtest_assumptions, {"initialCash": 250000, "feeBps": 8, "slippageBps": 4})
        self.assertEqual(restored.backtest_trades[0]["id"], "trade-1")
        self.assertEqual(restored.backtest_equity_curve[0]["equity"], 250000.0)
        self.assertEqual(restored.backtest_diagnostics[0]["id"], "return-profile")
        self.assertIsNone(missing)

    def test_research_run_audits_serialize_for_history_api(self):
        from quant_core.runs import ResearchRunAudit, research_run_audits_to_payload

        older = ResearchRunAudit(
            run_id="run-old",
            created_at=datetime(2026, 5, 26, 7, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-old",
            data_rows=100,
            metrics={"total_return_pct": 1.2, "trade_count": 4},
            decisions=[],
            execution_mode="paper_only",
        )
        newer = ResearchRunAudit(
            run_id="run-new",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="us",
            symbol="AAPL",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-new",
            data_rows=120,
            metrics={"total_return_pct": 3.4, "trade_count": 8},
            decisions=[{"agent": "AI Summary", "message": "Done", "tone": "ai"}],
            execution_mode="paper_only",
            ai_report={
                "summary": "History AI summary",
                "risks": ["History risk"],
                "improvements": ["History improvement"],
                "disclaimer": "No investment promise",
            },
            data_snapshot={
                "source": "yahoo",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "start": "2026-05-26T08:00:00+00:00",
                "end": "2026-05-26T08:00:00+00:00",
                "hash": "snapshot-history",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 191.0,
                        "high": 193.0,
                        "low": 190.0,
                        "close": 192.0,
                        "volume": 1000000,
                    }
                ],
            },
            data_quality={"source": "yahoo", "isComplete": True, "warnings": [], "rows": 120},
            strategy_config={
                "name": "SMA trend demo",
                "revision": "rev-new",
                "market": "us",
                "symbols": ["AAPL"],
                "timeframe": "1d",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                "risk": {"positionPct": 0.8, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.2},
            },
            backtest_assumptions={"initialCash": 250000, "feeBps": 8, "slippageBps": 4},
            backtest_trades=[
                {
                    "id": "trade-1",
                    "timestamp": "2026-05-26T08:00:00+00:00",
                    "symbol": "AAPL",
                    "side": "BUY",
                    "status": "filled",
                    "price": "191.20",
                    "quantity": "100",
                    "exposure": "19.12%",
                    "pnl": "-",
                    "reason": "entry_conditions",
                    "tone": "neutral",
                }
            ],
            backtest_equity_curve=[
                {"timestamp": "2026-05-26T08:00:00+00:00", "equity": 250000.0},
                {"timestamp": "2026-05-27T08:00:00+00:00", "equity": 254000.0},
            ],
            backtest_diagnostics=[
                {
                    "id": "return-profile",
                    "label": "Return profile",
                    "value": "+3.40%",
                    "detail": "Total return over 120 bars",
                    "tone": "positive",
                }
            ],
        )

        payload = research_run_audits_to_payload([newer, older])

        self.assertEqual(payload["runs"][0]["runId"], "run-new")
        self.assertEqual(payload["runs"][0]["createdAt"], "2026-05-26T08:00:00+00:00")
        self.assertEqual(payload["runs"][0]["strategyRevision"], "rev-new")
        self.assertEqual(payload["runs"][0]["aiReport"]["summary"], "History AI summary")
        self.assertEqual(payload["runs"][0]["aiReport"]["risks"], ["History risk"])
        self.assertEqual(payload["runs"][0]["aiReport"]["improvements"], ["History improvement"])
        self.assertEqual(payload["runs"][0]["aiReport"]["disclaimer"], "No investment promise")
        self.assertNotIn("dataSnapshot", payload["runs"][0])
        self.assertEqual(payload["runs"][0]["dataQuality"], {"source": "yahoo", "isComplete": True, "warnings": [], "rows": 120})
        self.assertEqual(payload["runs"][0]["strategyConfig"]["entryConditions"][0]["params"], {"window": 20})
        self.assertEqual(payload["runs"][0]["strategyConfig"]["risk"]["positionPct"], 0.8)
        self.assertEqual(payload["runs"][0]["backtestAssumptions"], {"initialCash": 250000, "feeBps": 8, "slippageBps": 4})
        self.assertEqual(payload["runs"][0]["backtestTrades"][0]["symbol"], "AAPL")
        self.assertEqual(payload["runs"][0]["backtestTrades"][0]["side"], "BUY")
        self.assertEqual(payload["runs"][0]["backtestEquityCurve"][-1]["equity"], 254000.0)
        self.assertEqual(payload["runs"][0]["backtestDiagnostics"][0]["label"], "Return profile")
        self.assertEqual(payload["runs"][0]["metrics"]["trade_count"], 8)
        self.assertEqual(payload["runs"][1]["symbol"], "600000")

    def test_terminal_research_run_persists_audit_summary(self):
        from quant_core.backtest import BacktestEngine
        from quant_core.research import run_terminal_research
        from quant_core.runs import ResearchRunStore
        from quant_core.terminal import terminal_workspace_to_payload

        with tempfile.TemporaryDirectory() as tmp:
            store = ResearchRunStore(f"{tmp}/runs.sqlite")
            workspace = run_terminal_research(
                market="ashare",
                symbol="600000",
                timeframe="1d",
                engine=BacktestEngine(initial_cash=250_000, fee_rate=0.0008, slippage_rate=0.0004),
                run_store=store,
            )
            latest = store.list_recent(limit=1)

        payload = terminal_workspace_to_payload(workspace)

        self.assertEqual(len(latest), 1)
        self.assertEqual(payload["researchRun"]["runId"], latest[0].run_id)
        self.assertEqual(payload["researchRun"]["timeframe"], latest[0].timeframe)
        self.assertEqual(payload["researchRun"]["strategyRevision"], latest[0].strategy_revision)
        self.assertEqual(payload["researchRun"]["dataRows"], latest[0].data_rows)
        self.assertEqual(payload["researchRun"]["executionMode"], "paper_only")
        self.assertEqual(payload["backtestAssumptions"], {"initialCash": 250000, "feeBps": 8, "slippageBps": 4})
        self.assertEqual(latest[0].data_quality["source"], "demo")
        self.assertEqual(latest[0].data_quality["rows"], latest[0].data_rows)
        self.assertEqual(latest[0].strategy_config["revision"], latest[0].strategy_revision)
        self.assertEqual(latest[0].strategy_config["entryConditions"][0]["params"], {"window": 20})
        self.assertEqual(latest[0].strategy_config["risk"]["positionPct"], 0.8)
        self.assertIn("SMA trend demo", latest[0].ai_report["summary"])
        self.assertTrue(latest[0].ai_report["risks"])
        self.assertTrue(latest[0].ai_report["improvements"])
        self.assertIn("不构成投资建议", latest[0].ai_report["disclaimer"])
        self.assertEqual(latest[0].data_snapshot["source"], "demo")
        self.assertEqual(latest[0].data_snapshot["rows"], latest[0].data_rows)
        self.assertEqual(len(latest[0].data_snapshot["bars"]), latest[0].data_rows)
        self.assertTrue(latest[0].data_snapshot["hash"])
        self.assertEqual(latest[0].data_snapshot["bars"][-1]["timestamp"], latest[0].backtest_equity_curve[-1]["timestamp"])
        self.assertEqual(latest[0].backtest_assumptions, {"initialCash": 250000, "feeBps": 8, "slippageBps": 4})
        self.assertEqual(latest[0].backtest_trades, payload["backtestTrades"])
        self.assertEqual(latest[0].backtest_equity_curve, payload["backtestEquityCurve"])
        self.assertEqual(latest[0].backtest_diagnostics, payload["backtestDiagnostics"])

    def test_research_run_detail_api_returns_audited_run_by_id(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.runs import ResearchRunAudit, ResearchRunStore

        with tempfile.TemporaryDirectory() as tmp:
            store = ResearchRunStore(f"{tmp}/runs.sqlite")
            store.record(
                ResearchRunAudit(
                    run_id="run-detail",
                    created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
                    market="ashare",
                    symbol="600000",
                    timeframe="1d",
                    strategy_name="SMA trend demo",
                    strategy_revision="rev-detail",
                    data_rows=120,
                    metrics={"total_return_pct": 3.4, "trade_count": 8},
                    decisions=[{"agent": "AI Summary", "message": "Done", "tone": "ai"}],
                    execution_mode="paper_only",
                    ai_report={
                        "summary": "Detail endpoint AI summary",
                        "risks": ["Detail endpoint risk"],
                        "improvements": ["Detail endpoint improvement"],
                        "disclaimer": "No investment advice",
                    },
                    data_snapshot={
                        "source": "tencent",
                        "isComplete": True,
                        "warnings": [],
                        "rows": 1,
                        "start": "2026-05-26T08:00:00+00:00",
                        "end": "2026-05-26T08:00:00+00:00",
                        "hash": "snapshot-detail",
                        "bars": [
                            {
                                "timestamp": "2026-05-26T08:00:00+00:00",
                                "timestampMs": 1779782400000,
                                "open": 9.1,
                                "high": 9.3,
                                "low": 9.0,
                                "close": 9.2,
                                "volume": 1200000,
                            }
                        ],
                    },
                    data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 120},
                    strategy_config={
                        "name": "SMA trend demo",
                        "revision": "rev-detail",
                        "market": "ashare",
                        "symbols": ["600000"],
                        "timeframe": "1d",
                        "version": 1,
                        "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                        "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                        "risk": {"positionPct": 0.8, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.2},
                    },
                    backtest_assumptions={"initialCash": 250000, "feeBps": 8, "slippageBps": 4},
                )
            )

            class TestHandler(QuantApiHandler):
                run_store = store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/research/runs/run-detail")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["run"]["runId"], "run-detail")
        self.assertEqual(payload["run"]["strategyRevision"], "rev-detail")
        self.assertEqual(payload["run"]["aiReport"]["summary"], "Detail endpoint AI summary")
        self.assertEqual(payload["run"]["aiReport"]["risks"], ["Detail endpoint risk"])
        self.assertEqual(payload["run"]["aiReport"]["improvements"], ["Detail endpoint improvement"])
        self.assertEqual(payload["run"]["aiReport"]["disclaimer"], "No investment advice")
        self.assertEqual(payload["run"]["dataSnapshot"]["source"], "tencent")
        self.assertEqual(payload["run"]["dataSnapshot"]["hash"], "snapshot-detail")
        self.assertEqual(payload["run"]["dataSnapshot"]["bars"][0]["close"], 9.2)
        self.assertEqual(payload["run"]["dataQuality"], {"source": "tencent", "isComplete": True, "warnings": [], "rows": 120})
        self.assertEqual(payload["run"]["strategyConfig"]["entryConditions"][0]["params"], {"window": 20})
        self.assertEqual(payload["run"]["strategyConfig"]["risk"]["positionPct"], 0.8)
        self.assertEqual(payload["run"]["backtestAssumptions"], {"initialCash": 250000, "feeBps": 8, "slippageBps": 4})

    def test_research_run_detail_api_returns_404_for_missing_run(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.runs import ResearchRunStore

        with tempfile.TemporaryDirectory() as tmp:
            store = ResearchRunStore(f"{tmp}/runs.sqlite")

            class TestHandler(QuantApiHandler):
                run_store = store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/research/runs/run-missing")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 404)
        self.assertEqual(payload, {"error": "research_run_not_found", "runId": "run-missing"})

    def test_research_run_export_api_returns_reproducible_package(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.runs import ResearchRunAudit, ResearchRunStore

        with tempfile.TemporaryDirectory() as tmp:
            store = ResearchRunStore(f"{tmp}/runs.sqlite")
            store.record(
                ResearchRunAudit(
                    run_id="run-export",
                    created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
                    market="ashare",
                    symbol="600000",
                    timeframe="1d",
                    strategy_name="SMA trend demo",
                    strategy_revision="rev-export",
                    data_rows=2,
                    metrics={"total_return_pct": 3.4, "max_drawdown_pct": 1.2, "win_rate_pct": 50, "trade_count": 1},
                    decisions=[{"agent": "AI Summary", "message": "Export ready", "tone": "ai"}],
                    execution_mode="paper_only",
                    ai_report={
                        "summary": "Export package summary",
                        "risks": ["Export risk"],
                        "improvements": ["Export improvement"],
                        "disclaimer": "No investment advice",
                    },
                    data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 2},
                    data_snapshot={
                        "source": "tencent",
                        "isComplete": True,
                        "warnings": [],
                        "rows": 2,
                        "start": "2026-05-26T08:00:00+00:00",
                        "end": "2026-05-27T08:00:00+00:00",
                        "hash": "snapshot-export",
                        "bars": [
                            {
                                "timestamp": "2026-05-26T08:00:00+00:00",
                                "timestampMs": 1779782400000,
                                "open": 9.1,
                                "high": 9.3,
                                "low": 9.0,
                                "close": 9.2,
                                "volume": 1200000,
                            },
                            {
                                "timestamp": "2026-05-27T08:00:00+00:00",
                                "timestampMs": 1779868800000,
                                "open": 9.2,
                                "high": 9.4,
                                "low": 9.1,
                                "close": 9.3,
                                "volume": 1300000,
                            },
                        ],
                    },
                    strategy_config={
                        "name": "SMA trend demo",
                        "revision": "rev-export",
                        "market": "ashare",
                        "symbols": ["600000"],
                        "timeframe": "1d",
                        "version": 1,
                        "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                        "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                        "risk": {"positionPct": 0.8, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.2},
                    },
                    backtest_assumptions={"initialCash": 250000, "feeBps": 8, "slippageBps": 4},
                    backtest_trades=[
                        {
                            "id": "trade-1",
                            "timestamp": "2026-05-26T08:00:00+00:00",
                            "symbol": "600000",
                            "side": "BUY",
                            "status": "filled",
                            "price": "9.20",
                            "quantity": "2100",
                            "exposure": "19.32%",
                            "pnl": "-",
                            "reason": "entry_conditions",
                            "tone": "neutral",
                        }
                    ],
                    backtest_equity_curve=[
                        {"timestamp": "2026-05-26T08:00:00+00:00", "equity": 250000.0},
                        {"timestamp": "2026-05-27T08:00:00+00:00", "equity": 253000.0},
                    ],
                    backtest_diagnostics=[
                        {
                            "id": "return-profile",
                            "label": "Return profile",
                            "value": "+3.40%",
                            "detail": "Total return over 2 bars",
                            "tone": "positive",
                        }
                    ],
                )
            )

            class TestHandler(QuantApiHandler):
                run_store = store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/research/runs/run-export/export")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        export = payload["export"]
        self.assertEqual(export["kind"], "aiqt.researchRun.export")
        self.assertEqual(export["packageVersion"], 1)
        self.assertEqual(export["manifest"]["runId"], "run-export")
        self.assertEqual(export["integrity"]["algorithm"], "sha256")
        self.assertEqual(len(export["integrity"]["hash"]), 64)
        self.assertEqual(export["manifest"]["dataHash"], "snapshot-export")
        self.assertEqual(export["manifest"]["artifactCounts"]["bars"], 2)
        self.assertEqual(export["manifest"]["artifactCounts"]["trades"], 1)
        self.assertFalse(export["manifest"]["liveTradingAllowed"])
        self.assertTrue(export["manifest"]["paperOnly"])
        self.assertEqual(export["researchRun"]["dataSnapshot"]["bars"][1]["close"], 9.3)
        self.assertEqual(export["executionHandoff"]["mode"], "paper_only")
        self.assertEqual(export["executionHandoff"]["requiredGates"][0]["id"], "adapter-certified")
        self.assertFalse(export["executionHandoff"]["requiredGates"][0]["passed"])

    def test_research_run_export_import_preserves_research_note_evidence(self):
        from quant_core.runs import ResearchRunAudit, research_run_export_to_payload, research_run_import_to_audit

        audit = ResearchRunAudit(
            run_id="run-note-export",
            created_at=datetime(2026, 5, 29, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-note-export",
            data_rows=2,
            metrics={"total_return_pct": 3.4, "trade_count": 1},
            decisions=[{"agent": "AI Summary", "message": "Note evidence only", "tone": "ai"}],
            execution_mode="paper_only",
            ai_report={"summary": "Note locked", "risks": ["Volume not confirmed"], "improvements": [], "disclaimer": "No advice"},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 2,
                "start": "2026-05-28T08:00:00+00:00",
                "end": "2026-05-29T08:00:00+00:00",
                "hash": "snapshot-note-export",
                "bars": [
                    {
                        "timestamp": "2026-05-28T08:00:00+00:00",
                        "timestampMs": 1779955200000,
                        "open": 9.1,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000,
                    },
                    {
                        "timestamp": "2026-05-29T08:00:00+00:00",
                        "timestampMs": 1780041600000,
                        "open": 9.2,
                        "high": 9.5,
                        "low": 9.1,
                        "close": 9.4,
                        "volume": 1500000,
                    },
                ],
            },
            research_note={
                "market": "ashare",
                "symbol": "600000",
                "timeframe": "1d",
                "body": "关注银行板块相对强度，等待放量确认。",
                "updatedAt": "2026-05-29T07:55:00+00:00",
            },
            backtest_trades=[{"id": "trade-1"}],
            backtest_equity_curve=[{"timestamp": "2026-05-29T08:00:00+00:00", "equity": 103400.0}],
        )

        export_package = research_run_export_to_payload(audit)
        imported = research_run_import_to_audit(export_package)

        self.assertEqual(export_package["manifest"]["artifactCounts"]["researchNotes"], 1)
        self.assertEqual(export_package["researchRun"]["researchNote"]["body"], "关注银行板块相对强度，等待放量确认。")
        self.assertEqual(export_package["researchRun"]["researchNote"]["updatedAt"], "2026-05-29T07:55:00+00:00")
        self.assertEqual(imported.research_note["body"], "关注银行板块相对强度，等待放量确认。")
        self.assertEqual(imported.research_note["symbol"], "600000")

    def test_research_run_import_rejects_tampered_integrity_hash(self):
        import copy

        from quant_core.runs import ResearchRunAudit, research_run_export_to_payload, research_run_import_to_audit

        audit = ResearchRunAudit(
            run_id="run-integrity",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-integrity",
            data_rows=1,
            metrics={"total_return_pct": 1.2, "trade_count": 1},
            decisions=[{"agent": "AI Summary", "message": "Original", "tone": "ai"}],
            execution_mode="paper_only",
            ai_report={"summary": "Original", "risks": ["Risk"], "improvements": [], "disclaimer": "No advice"},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "start": "2026-05-26T08:00:00+00:00",
                "end": "2026-05-26T08:00:00+00:00",
                "hash": "snapshot-integrity",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 9.1,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000,
                    }
                ],
            },
            backtest_trades=[{"id": "trade-1"}],
            backtest_equity_curve=[{"timestamp": "2026-05-26T08:00:00+00:00", "equity": 100000.0}],
        )
        export_package = research_run_export_to_payload(audit)
        tampered_package = copy.deepcopy(export_package)
        tampered_package["researchRun"]["metrics"]["total_return_pct"] = 99.9

        with self.assertRaisesRegex(ValueError, "integrity_hash_mismatch"):
            research_run_import_to_audit(tampered_package)

    def test_research_run_import_accepts_browser_json_number_round_trip(self):
        from quant_core.runs import ResearchRunAudit, research_run_export_to_payload, research_run_import_to_audit

        def browser_number_round_trip(value):
            if isinstance(value, dict):
                return {key: browser_number_round_trip(item) for key, item in value.items()}
            if isinstance(value, list):
                return [browser_number_round_trip(item) for item in value]
            if isinstance(value, float) and value.is_integer():
                return int(value)
            return value

        audit = ResearchRunAudit(
            run_id="run-browser-json",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-browser-json",
            data_rows=1,
            metrics={"total_return_pct": 1.0, "trade_count": 1},
            decisions=[],
            execution_mode="paper_only",
            ai_report={"summary": "Browser", "risks": [], "improvements": [], "disclaimer": "No advice"},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-browser-json",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 9.0,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000.0,
                    }
                ],
            },
            backtest_trades=[],
            backtest_equity_curve=[],
        )
        export_package = browser_number_round_trip(research_run_export_to_payload(audit))

        imported = research_run_import_to_audit(export_package)

        self.assertEqual(imported.run_id, "run-browser-json")
        self.assertEqual(imported.data_snapshot["bars"][0]["open"], 9)

    def test_research_run_import_accepts_timezone_equivalent_json_round_trip(self):
        from quant_core.runs import ResearchRunAudit, research_run_export_to_payload, research_run_import_to_audit

        def local_timezone_round_trip(value):
            if isinstance(value, dict):
                return {key: local_timezone_round_trip(item) for key, item in value.items()}
            if isinstance(value, list):
                return [local_timezone_round_trip(item) for item in value]
            if isinstance(value, str) and "T" in value:
                try:
                    parsed = datetime.fromisoformat(value)
                except ValueError:
                    return value
                if parsed.tzinfo is not None:
                    return parsed.astimezone(timezone(timedelta(hours=8))).isoformat()
            return value

        audit = ResearchRunAudit(
            run_id="run-timezone-json",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-timezone-json",
            data_rows=1,
            metrics={"total_return_pct": 1.2, "trade_count": 1},
            decisions=[],
            execution_mode="paper_only",
            ai_report={"summary": "Timezone", "risks": [], "improvements": [], "disclaimer": "No advice"},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "start": "2026-05-26T08:00:00+00:00",
                "end": "2026-05-26T08:00:00+00:00",
                "hash": "snapshot-timezone-json",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 9.1,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000,
                    }
                ],
            },
            backtest_trades=[],
            backtest_equity_curve=[{"timestamp": "2026-05-26T08:00:00+00:00", "equity": 100000.0}],
        )
        export_package = local_timezone_round_trip(research_run_export_to_payload(audit))

        imported = research_run_import_to_audit(export_package)

        self.assertEqual(imported.run_id, "run-timezone-json")
        self.assertEqual(imported.created_at.astimezone(timezone.utc), datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc))

    def test_research_run_import_rejects_manifest_artifact_count_mismatch(self):
        from quant_core.runs import ResearchRunAudit, research_run_export_to_payload, research_run_import_to_audit

        audit = ResearchRunAudit(
            run_id="run-counts",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-counts",
            data_rows=1,
            metrics={"total_return_pct": 1.2, "trade_count": 1},
            decisions=[],
            execution_mode="paper_only",
            ai_report={"summary": "Counts", "risks": [], "improvements": [], "disclaimer": "No advice"},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-counts",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 9.1,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000,
                    }
                ],
            },
            backtest_trades=[],
            backtest_equity_curve=[],
        )
        export_package = research_run_export_to_payload(audit)
        export_package.pop("integrity", None)
        export_package["manifest"]["artifactCounts"]["bars"] = 2

        with self.assertRaisesRegex(ValueError, "artifact_count_bars_mismatch"):
            research_run_import_to_audit(export_package)

    def test_research_run_import_api_persists_export_package_for_replay(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.runs import ResearchRunStore

        export_package = {
            "kind": "aiqt.researchRun.export",
            "packageVersion": 1,
            "exportedAt": "2026-05-26T08:05:00+00:00",
            "manifest": {
                "runId": "run-import",
                "createdAt": "2026-05-26T08:00:00+00:00",
                "market": "ashare",
                "symbol": "600000",
                "timeframe": "1d",
                "strategyRevision": "rev-import",
                "dataHash": "snapshot-import",
                "dataRows": 2,
                "executionMode": "paper_only",
                "paperOnly": True,
                "liveTradingAllowed": False,
                "artifactCounts": {"bars": 2, "trades": 1, "equityPoints": 1, "decisions": 1, "aiRisks": 1},
            },
            "researchRun": {
                "runId": "run-import",
                "createdAt": "2026-05-26T08:00:00+00:00",
                "market": "ashare",
                "symbol": "600000",
                "timeframe": "1d",
                "strategyName": "Imported SMA trend",
                "strategyRevision": "rev-import",
                "dataRows": 2,
                "metrics": {"total_return_pct": 4.2, "max_drawdown_pct": 1.1, "win_rate_pct": 50, "trade_count": 1},
                "decisions": [{"agent": "AI Summary", "message": "Imported evidence only", "tone": "ai"}],
                "executionMode": "paper_only",
                "aiReport": {
                    "summary": "Imported package summary",
                    "risks": ["Imported risk"],
                    "improvements": ["Imported improvement"],
                    "disclaimer": "No investment advice",
                },
                "dataQuality": {"source": "tencent", "isComplete": True, "warnings": [], "rows": 2},
                "dataSnapshot": {
                    "source": "tencent",
                    "isComplete": True,
                    "warnings": [],
                    "rows": 2,
                    "start": "2026-05-26T08:00:00+00:00",
                    "end": "2026-05-27T08:00:00+00:00",
                    "hash": "snapshot-import",
                    "bars": [
                        {
                            "timestamp": "2026-05-26T08:00:00+00:00",
                            "timestampMs": 1779782400000,
                            "open": 9.1,
                            "high": 9.3,
                            "low": 9.0,
                            "close": 9.2,
                            "volume": 1200000,
                        },
                        {
                            "timestamp": "2026-05-27T08:00:00+00:00",
                            "timestampMs": 1779868800000,
                            "open": 9.2,
                            "high": 9.4,
                            "low": 9.1,
                            "close": 9.3,
                            "volume": 1300000,
                        },
                    ],
                },
                "strategyConfig": {
                    "name": "Imported SMA trend",
                    "revision": "rev-import",
                    "market": "ashare",
                    "symbols": ["600000"],
                    "timeframe": "1d",
                    "version": 1,
                    "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                    "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                    "risk": {"positionPct": 0.8, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.2},
                },
                "backtestAssumptions": {"initialCash": 250000, "feeBps": 8, "slippageBps": 4},
                "backtestTrades": [{"id": "trade-import", "side": "BUY", "price": "9.20"}],
                "backtestEquityCurve": [{"timestamp": "2026-05-26T08:00:00+00:00", "equity": 250000.0}],
                "backtestDiagnostics": [{"id": "return-profile", "label": "Return profile", "value": "+4.20%"}],
            },
            "executionHandoff": {
                "mode": "paper_only",
                "paperOnly": True,
                "liveTradingAllowed": False,
                "requiredGates": [{"id": "adapter-certified", "label": "Adapter certified", "passed": False, "reason": "Blocked"}],
            },
        }

        with tempfile.TemporaryDirectory() as tmp:
            store = ResearchRunStore(f"{tmp}/runs.sqlite")

            class TestHandler(QuantApiHandler):
                run_store = store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                body = json.dumps(export_package).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/research/runs/import",
                    body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
                connection.request("GET", "/api/research/runs/run-import")
                detail_response = connection.getresponse()
                detail_payload = json.loads(detail_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 201)
        self.assertEqual(payload["run"]["runId"], "run-import")
        self.assertEqual(payload["run"]["dataSnapshot"]["hash"], "snapshot-import")
        self.assertEqual(payload["run"]["backtestAssumptions"], {"initialCash": 250000, "feeBps": 8, "slippageBps": 4})
        self.assertEqual(detail_response.status, 200)
        self.assertEqual(detail_payload["run"]["strategyConfig"]["revision"], "rev-import")
        self.assertEqual(detail_payload["run"]["dataSnapshot"]["bars"][1]["close"], 9.3)
        self.assertEqual(detail_payload["run"]["executionMode"], "paper_only")

    def test_research_run_export_import_preserves_paper_execution_history(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.execution import PaperExecutionStore, create_paper_execution_from_audit
        from quant_core.runs import ResearchRunAudit, ResearchRunStore

        audit = ResearchRunAudit(
            run_id="run-paper-portable",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="Portable SMA trend",
            strategy_revision="rev-paper-portable",
            data_rows=2,
            metrics={"total_return_pct": 4.2, "max_drawdown_pct": 1.1, "win_rate_pct": 50, "trade_count": 1},
            decisions=[{"agent": "AI Summary", "message": "Portable evidence only", "tone": "ai"}],
            execution_mode="paper_only",
            ai_report={
                "summary": "Portable package summary",
                "risks": ["Portable paper-only risk"],
                "improvements": ["Review imported execution gates"],
                "disclaimer": "No investment advice",
            },
            data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 2},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 2,
                "start": "2026-05-26T08:00:00+00:00",
                "end": "2026-05-27T08:00:00+00:00",
                "hash": "snapshot-paper-portable",
                "bars": [
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "timestampMs": 1779782400000,
                        "open": 9.1,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000,
                    },
                    {
                        "timestamp": "2026-05-27T08:00:00+00:00",
                        "timestampMs": 1779868800000,
                        "open": 9.2,
                        "high": 9.4,
                        "low": 9.1,
                        "close": 9.3,
                        "volume": 1300000,
                    },
                ],
            },
            strategy_config={
                "name": "Portable SMA trend",
                "revision": "rev-paper-portable",
                "market": "ashare",
                "symbols": ["600000"],
                "timeframe": "1d",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                "risk": {"positionPct": 0.2, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.2},
            },
            backtest_assumptions={"initialCash": 100000, "feeBps": 3, "slippageBps": 2},
            backtest_trades=[{"id": "trade-paper-portable", "side": "BUY", "price": "9.20"}],
            backtest_equity_curve=[{"timestamp": "2026-05-26T08:00:00+00:00", "equity": 100000.0}],
            backtest_diagnostics=[{"id": "return-profile", "label": "Return profile", "value": "+4.20%"}],
        )

        with tempfile.TemporaryDirectory() as tmp:
            source_run_store = ResearchRunStore(f"{tmp}/source-runs.sqlite")
            source_paper_store = PaperExecutionStore(f"{tmp}/source-paper.sqlite")
            target_run_store = ResearchRunStore(f"{tmp}/target-runs.sqlite")
            target_paper_store = PaperExecutionStore(f"{tmp}/target-paper.sqlite")
            source_run_store.record(audit)
            source_paper_store.record(
                create_paper_execution_from_audit(
                    audit,
                    created_at=datetime(2026, 5, 26, 8, 5, tzinfo=timezone.utc),
                )
            )

            class SourceHandler(QuantApiHandler):
                run_store = source_run_store
                paper_execution_store = source_paper_store

            source_server = HTTPServer(("127.0.0.1", 0), SourceHandler)
            source_thread = Thread(target=source_server.serve_forever, daemon=True)
            source_thread.start()
            source_connection = HTTPConnection(source_server.server_address[0], source_server.server_address[1], timeout=5)
            try:
                source_connection.request("GET", "/api/research/runs/run-paper-portable/export")
                export_response = source_connection.getresponse()
                export_payload = json.loads(export_response.read().decode("utf-8"))
            finally:
                source_connection.close()
                source_server.shutdown()
                source_thread.join(timeout=5)
                source_server.server_close()

            class TargetHandler(QuantApiHandler):
                run_store = target_run_store
                paper_execution_store = target_paper_store

            target_server = HTTPServer(("127.0.0.1", 0), TargetHandler)
            target_thread = Thread(target=target_server.serve_forever, daemon=True)
            target_thread.start()
            target_connection = HTTPConnection(target_server.server_address[0], target_server.server_address[1], timeout=5)
            try:
                body = json.dumps(export_payload["export"]).encode("utf-8")
                target_connection.request(
                    "POST",
                    "/api/research/runs/import",
                    body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                import_response = target_connection.getresponse()
                import_payload = json.loads(import_response.read().decode("utf-8"))
                target_connection.request("GET", "/api/research/runs/run-paper-portable/paper-executions")
                history_response = target_connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                target_connection.close()
                target_server.shutdown()
                target_thread.join(timeout=5)
                target_server.server_close()

        self.assertEqual(export_response.status, 200)
        self.assertEqual(export_payload["export"]["manifest"]["artifactCounts"]["paperExecutions"], 1)
        self.assertEqual(export_payload["export"]["paperExecutions"][0]["runId"], "run-paper-portable")
        self.assertEqual(import_response.status, 201)
        self.assertEqual(import_payload["run"]["runId"], "run-paper-portable")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["executions"]), 1)
        self.assertEqual(
            history_payload["executions"][0]["executionId"],
            export_payload["export"]["paperExecutions"][0]["executionId"],
        )

    def test_quantdinger_style_live_quote_adapter_maps_finnhub_and_tencent_quotes(self):
        from quant_core.live_quotes import QuantDingerLiveQuoteAdapter

        def fake_fetch_text(url: str, encoding: str = "utf-8") -> str:
            if "finnhub.io" in url:
                return '{"c": 191.20, "d": 1.25, "dp": 0.66, "h": 193.0, "l": 189.1, "o": 190.0, "pc": 189.95, "t": 1779780000}'
            if "qt.gtimg.cn" in url:
                return 'v_sh600000="1~浦发银行~600000~8.66~8.55~8.60~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~8.70~8.50";'
            raise AssertionError(url)

        adapter = QuantDingerLiveQuoteAdapter(finnhub_api_key="demo", fetch_text=fake_fetch_text)

        us_quote = adapter.fetch_quote("us", "AAPL")
        ashare_quote = adapter.fetch_quote("ashare", "600000")

        self.assertEqual(us_quote.source, "finnhub")
        self.assertEqual(us_quote.price, 191.2)
        self.assertEqual(us_quote.change_pct, 0.66)
        self.assertEqual(ashare_quote.source, "tencent")
        self.assertEqual(ashare_quote.price, 8.66)
        self.assertAlmostEqual(ashare_quote.change_pct, 1.29)

    def test_live_quote_adapter_reuses_ttl_cache_for_watchlist_prices(self):
        from quant_core.live_quotes import QuantDingerLiveQuoteAdapter

        calls = []

        def fake_fetch_text(url: str, encoding: str = "utf-8") -> str:
            calls.append(url)
            return '{"c": 100, "d": 2, "dp": 2.04, "h": 101, "l": 98, "o": 99, "pc": 98, "t": 1779780000}'

        adapter = QuantDingerLiveQuoteAdapter(
            finnhub_api_key="demo",
            fetch_text=fake_fetch_text,
            cache_ttl_seconds=30,
            now=lambda: 1000.0,
        )

        first = adapter.fetch_quote("us", "AAPL")
        second = adapter.fetch_quote("us", "AAPL")

        self.assertEqual(first.price, second.price)
        self.assertEqual(len(calls), 1)
        self.assertEqual(adapter.cache_key("us", "AAPL"), "watchlist_price:us:AAPL")

    def test_terminal_workspace_applies_live_quotes_to_watchlist_and_selected_symbol(self):
        from quant_core.domain import MarketQuote
        from quant_core.terminal import apply_market_quotes, build_terminal_workspace, terminal_workspace_to_payload

        workspace = build_terminal_workspace()
        updated = apply_market_quotes(
            workspace,
            [
                MarketQuote(
                    market="ashare",
                    symbol="600000",
                    price=8.66,
                    change=0.11,
                    change_pct=1.29,
                    source="tencent",
                    as_of=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
                )
            ],
        )
        payload = terminal_workspace_to_payload(updated)

        self.assertEqual(payload["selectedInstrument"]["price"], 8.66)
        self.assertEqual(payload["selectedInstrument"]["changePct"], 1.29)
        self.assertEqual(payload["selectedInstrument"]["quoteSource"], "tencent")
        self.assertEqual(payload["watchlist"][0]["price"], 8.66)

    def test_terminal_workspace_keeps_fallback_price_when_live_quote_unavailable(self):
        from quant_core.live_quotes import unavailable_quote
        from quant_core.terminal import apply_market_quotes, build_terminal_workspace, terminal_workspace_to_payload

        workspace = build_terminal_workspace()
        updated = apply_market_quotes(workspace, [unavailable_quote("us", "AAPL", "missing key")])
        payload = terminal_workspace_to_payload(updated)

        self.assertEqual(payload["watchlist"][2]["symbol"], "AAPL")
        self.assertEqual(payload["watchlist"][2]["price"], 191.2)
        self.assertEqual(payload["watchlist"][2]["changePct"], -0.36)
        self.assertIsNone(payload["watchlist"][2]["quoteSource"])

    def test_market_symbol_search_maps_eastmoney_code_and_chinese_results(self):
        from quant_core.market_search import MarketSymbolSearchAdapter, market_search_to_payload

        calls = []

        def fake_fetch_text(url: str, encoding: str = "utf-8") -> str:
            calls.append(url)
            self.assertIn("searchapi.eastmoney.com", url)
            return (
                '{"QuotationCodeTable":{"Data":['
                '{"Code":"600000","Name":"浦发银行","PinYin":"PFYH","Classify":"AStock","SecurityTypeName":"沪A","QuoteID":"1.600000"},'
                '{"Code":"360003","Name":"浦发优1","PinYin":"PFY1","Classify":"Bond","SecurityTypeName":"债券","QuoteID":"1.360003"}'
                '],"Status":0,"Message":"成功","TotalCount":2}}'
            )

        adapter = MarketSymbolSearchAdapter(fetch_text=fake_fetch_text)
        results = adapter.search("ashare", "浦发", limit=8)
        payload = market_search_to_payload("ashare", "浦发", results)

        self.assertIn("input=%E6%B5%A6%E5%8F%91", calls[0])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].symbol, "600000")
        self.assertEqual(results[0].name, "浦发银行")
        self.assertEqual(results[0].source, "eastmoney")
        self.assertEqual(payload["results"][0]["market"], "ashare")

    def test_market_symbol_search_uses_local_catalog_when_remote_is_unavailable(self):
        from quant_core.market_search import MarketSymbolSearchAdapter

        def failing_fetch_text(url: str, encoding: str = "utf-8") -> str:
            raise OSError("offline")

        adapter = MarketSymbolSearchAdapter(fetch_text=failing_fetch_text)

        ashare_results = adapter.search("ashare", "600", limit=3)
        us_results = adapter.search("us", "apple", limit=3)
        crypto_results = adapter.search("crypto", "btc", limit=3)

        self.assertEqual(ashare_results[0].symbol, "600000")
        self.assertEqual(ashare_results[0].name, "浦发银行")
        self.assertEqual(us_results[0].symbol, "AAPL")
        self.assertEqual(crypto_results[0].symbol, "BTC/USDT")

    def test_quantdinger_style_kline_adapter_maps_tencent_fqkline_rows(self):
        from quant_core.domain import MarketDataRequest
        from quant_core.market_klines import QuantDingerKlineAdapter, market_klines_to_payload

        def fake_fetch_text(url: str, encoding: str = "utf-8") -> str:
            self.assertIn("web.ifzq.gtimg.cn", url)
            self.assertIn("sh600000%2Cday", url)
            return (
                '{"code":0,"data":{"sh600000":{"qfqday":['
                '["2026-05-22","9.00","9.08","9.12","8.98","100000"],'
                '["2026-05-25","9.10","9.27","9.32","9.09","120000"]'
                ']}}}'
            )

        bars, quality = QuantDingerKlineAdapter(fetch_text=fake_fetch_text).fetch_ohlcv(
            MarketDataRequest(market="ashare", symbol="600000", timeframe="1d"),
            limit=2,
        )
        payload = market_klines_to_payload("ashare", "600000", "1d", bars, quality)

        self.assertEqual(quality.source, "tencent")
        self.assertEqual(quality.rows, 2)
        self.assertEqual(bars[-1].close, 9.27)
        self.assertEqual(payload["bars"][-1]["timestampMs"], int(bars[-1].timestamp.timestamp() * 1000))
        self.assertEqual(payload["bars"][-1]["volume"], 120000.0)

    def test_quantdinger_style_kline_cache_key_includes_time_window(self):
        from datetime import datetime, timezone

        from quant_core.domain import MarketDataRequest
        from quant_core.market_klines import QuantDingerKlineAdapter

        adapter = QuantDingerKlineAdapter()
        latest_key = adapter.cache_key(
            MarketDataRequest(market="ashare", symbol="600000", timeframe="60m", end=None),
            limit=500,
        )
        older_key = adapter.cache_key(
            MarketDataRequest(
                market="ashare",
                symbol="600000",
                timeframe="60m",
                end=datetime(2026, 5, 26, 9, 45, tzinfo=timezone.utc),
            ),
            limit=500,
        )

        self.assertNotEqual(latest_key, older_key)
        self.assertIn("2026-05-26T09:45:00+00:00", older_key)

    def test_api_parses_kline_end_boundary(self):
        from datetime import timezone

        from quant_core.api import _parse_kline_end

        parsed = _parse_kline_end("2026-05-26T09:45:00.000Z")

        self.assertEqual(parsed.isoformat(), "2026-05-26T09:45:00+00:00")
        self.assertEqual(_parse_kline_end("1779788700000").tzinfo, timezone.utc)
        self.assertIsNone(_parse_kline_end(""))
        self.assertIsNone(_parse_kline_end("not-a-date"))

    def test_quantdinger_style_kline_adapter_maps_akshare_minute_rows(self):
        import pandas as pd

        from quant_core.market_klines import akshare_minute_frame_to_bars

        frame = pd.DataFrame(
            [
                {"时间": "2026-05-26 09:30:00", "开盘": 9.10, "收盘": 9.16, "最高": 9.18, "最低": 9.09, "成交量": 3200},
                {"时间": "2026-05-26 09:31:00", "开盘": 9.16, "收盘": 9.20, "最高": 9.21, "最低": 9.15, "成交量": 4100},
            ]
        )

        bars = akshare_minute_frame_to_bars(frame, market="ashare", symbol="600000", timeframe="1m")

        self.assertEqual(len(bars), 2)
        self.assertEqual(bars[-1].close, 9.20)
        self.assertEqual(bars[-1].volume, 4100.0)

    def test_quantdinger_style_kline_adapter_maps_eastmoney_minute_rows(self):
        from quant_core.market_klines import eastmoney_minute_rows_to_bars

        bars = eastmoney_minute_rows_to_bars(
            [
                "2026-05-26 14:55,9.26,9.28,9.29,9.25,2000,1856000.00,9.264",
                "2026-05-26 15:00,9.28,9.27,9.29,9.27,26674,24739076.00,0.22,-0.11,-0.01,0.01",
            ],
            market="ashare",
            symbol="600000",
            timeframe="5m",
        )

        self.assertEqual(len(bars), 2)
        self.assertEqual(bars[-1].open, 9.28)
        self.assertEqual(bars[-1].close, 9.27)
        self.assertEqual(bars[-1].volume, 26674.0)

    def test_us_kline_adapter_uses_yahoo_chart_without_python_package(self):
        from quant_core.domain import MarketDataRequest
        from quant_core.market_klines import QuantDingerKlineAdapter

        def fake_fetch_text(url: str, encoding: str = "utf-8") -> str:
            self.assertIn("query1.finance.yahoo.com", url)
            self.assertIn("/AAPL?", url)
            self.assertIn("interval=1d", url)
            return (
                '{"chart":{"result":[{"timestamp":[1779408000,1779494400],'
                '"indicators":{"quote":[{'
                '"open":[190.00,192.40],"high":[193.20,195.00],"low":[188.90,191.50],'
                '"close":[192.10,194.80],"volume":[50100000,55200000]'
                "}]}}],\"error\":null}}"
            )

        bars, quality = QuantDingerKlineAdapter(fetch_text=fake_fetch_text).fetch_ohlcv(
            MarketDataRequest(market="us", symbol="AAPL", timeframe="1d"),
            limit=2,
        )

        self.assertEqual(quality.source, "yahoo")
        self.assertEqual(quality.rows, 2)
        self.assertEqual(bars[-1].market, "us")
        self.assertEqual(bars[-1].close, 194.8)
        self.assertEqual(bars[-1].volume, 55200000.0)

    def test_crypto_kline_adapter_uses_binance_without_ccxt(self):
        from quant_core.domain import MarketDataRequest
        from quant_core.market_klines import QuantDingerKlineAdapter

        def fake_fetch_text(url: str, encoding: str = "utf-8") -> str:
            self.assertIn("api.binance.com", url)
            self.assertIn("symbol=BTCUSDT", url)
            self.assertIn("interval=1d", url)
            return (
                "["
                "[1779408000000,\"100.0\",\"110.0\",\"95.0\",\"108.5\",\"1234.56\"],"
                "[1779494400000,\"108.5\",\"116.0\",\"107.0\",\"114.2\",\"1567.89\"]"
                "]"
            )

        bars, quality = QuantDingerKlineAdapter(fetch_text=fake_fetch_text).fetch_ohlcv(
            MarketDataRequest(market="crypto", symbol="BTC/USDT", timeframe="1d"),
            limit=2,
        )

        self.assertEqual(quality.source, "binance")
        self.assertEqual(quality.rows, 2)
        self.assertEqual(bars[-1].market, "crypto")
        self.assertEqual(bars[-1].close, 114.2)
        self.assertEqual(bars[-1].volume, 1567.89)

    def test_crypto_kline_adapter_falls_back_to_coinbase_when_binance_is_blocked(self):
        from quant_core.domain import MarketDataRequest
        from quant_core.market_klines import QuantDingerKlineAdapter

        def fake_fetch_text(url: str, encoding: str = "utf-8") -> str:
            if "api.binance.com" in url:
                return '{"code":451,"msg":"restricted"}'
            self.assertIn("api.exchange.coinbase.com", url)
            self.assertIn("/products/BTC-USD/candles", url)
            self.assertIn("granularity=86400", url)
            return (
                "["
                "[1779494400,107.0,116.0,108.5,114.2,1567.89],"
                "[1779408000,95.0,110.0,100.0,108.5,1234.56]"
                "]"
            )

        bars, quality = QuantDingerKlineAdapter(fetch_text=fake_fetch_text).fetch_ohlcv(
            MarketDataRequest(market="crypto", symbol="BTC/USDT", timeframe="1d"),
            limit=2,
        )

        self.assertEqual(quality.source, "coinbase")
        self.assertEqual(quality.rows, 2)
        self.assertEqual(bars[-1].close, 114.2)
        self.assertEqual(bars[-1].volume, 1567.89)


if __name__ == "__main__":
    unittest.main()
