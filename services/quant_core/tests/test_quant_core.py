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
        self.assertEqual(payload["workflowNodes"][-1]["id"], "execution")
        self.assertGreaterEqual(len(payload["decisionLog"]), 4)

    def test_terminal_research_run_updates_workspace_from_backtest_and_ai_report(self):
        from quant_core.research import run_terminal_research
        from quant_core.terminal import terminal_workspace_to_payload

        workspace = run_terminal_research(market="ashare", symbol="600000", timeframe="5m")
        payload = terminal_workspace_to_payload(workspace)

        self.assertEqual(payload["schemaVersion"], 1)
        self.assertEqual(payload["selectedInstrument"]["symbol"], "600000")
        self.assertEqual(payload["selectedTimeframe"], "5m")
        self.assertEqual(payload["strategy"]["name"], "SMA trend demo")
        self.assertEqual([metric["label"] for metric in payload["metrics"]], ["Return", "Max DD", "Win Rate", "Trades"])
        self.assertTrue(payload["decisionLog"][0]["message"])
        self.assertEqual(payload["decisionLog"][0]["agent"], "AI Summary")
        self.assertEqual(payload["execution"]["mode"], "paper_only")
        self.assertFalse(payload["execution"]["liveEnabled"])

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
        )

        payload = research_run_audits_to_payload([newer, older])

        self.assertEqual(payload["runs"][0]["runId"], "run-new")
        self.assertEqual(payload["runs"][0]["createdAt"], "2026-05-26T08:00:00+00:00")
        self.assertEqual(payload["runs"][0]["strategyRevision"], "rev-new")
        self.assertEqual(payload["runs"][0]["metrics"]["trade_count"], 8)
        self.assertEqual(payload["runs"][1]["symbol"], "600000")

    def test_terminal_research_run_persists_audit_summary(self):
        from quant_core.research import run_terminal_research
        from quant_core.runs import ResearchRunStore
        from quant_core.terminal import terminal_workspace_to_payload

        with tempfile.TemporaryDirectory() as tmp:
            store = ResearchRunStore(f"{tmp}/runs.sqlite")
            workspace = run_terminal_research(market="ashare", symbol="600000", timeframe="1d", run_store=store)
            latest = store.list_recent(limit=1)

        payload = terminal_workspace_to_payload(workspace)

        self.assertEqual(len(latest), 1)
        self.assertEqual(payload["researchRun"]["runId"], latest[0].run_id)
        self.assertEqual(payload["researchRun"]["timeframe"], latest[0].timeframe)
        self.assertEqual(payload["researchRun"]["strategyRevision"], latest[0].strategy_revision)
        self.assertEqual(payload["researchRun"]["dataRows"], latest[0].data_rows)
        self.assertEqual(payload["researchRun"]["executionMode"], "paper_only")

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


if __name__ == "__main__":
    unittest.main()
