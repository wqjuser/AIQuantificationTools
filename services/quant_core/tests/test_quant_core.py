import tempfile
import unittest
from datetime import datetime, timezone


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
                "Idea Lab",
                "Data & Factor",
                "Strategy Builder",
                "Backtest Lab",
                "Agent Review",
                "Paper Trading",
                "Broker Center",
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
