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


if __name__ == "__main__":
    unittest.main()
