import tempfile
import unittest
import importlib.util
from datetime import datetime, timedelta, timezone
from pathlib import Path


class QuantCoreContractTest(unittest.TestCase):
    def _load_docker_smoke_module(self):
        root = Path(__file__).resolve().parents[3]
        module_path = root / "tools" / "docker_smoke.py"
        spec = importlib.util.spec_from_file_location("docker_smoke", module_path)
        self.assertIsNotNone(spec)
        self.assertIsNotNone(spec.loader)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def _sample_research_run_audit(self, *, run_id: str, strategy_revision: str):
        from quant_core.runs import ResearchRunAudit

        return ResearchRunAudit(
            run_id=run_id,
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="Portable SMA trend",
            strategy_revision=strategy_revision,
            data_rows=2,
            metrics={"total_return_pct": 4.2, "max_drawdown_pct": 1.1, "win_rate_pct": 50, "trade_count": 1},
            decisions=[{"agent": "AI Summary", "message": "Portable evidence only", "tone": "ai"}],
            execution_mode="paper_only",
            ai_report={
                "summary": "Portable package summary",
                "risks": ["Portable paper-only risk"],
                "improvements": ["Review imported execution evidence"],
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
                "hash": f"snapshot-{run_id}",
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
                "revision": strategy_revision,
                "market": "ashare",
                "symbols": ["600000"],
                "timeframe": "1d",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                "risk": {"positionPct": 0.2, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.2},
            },
            backtest_assumptions={"initialCash": 100000, "feeBps": 3, "slippageBps": 2},
            backtest_trades=[{"id": f"trade-{run_id}", "side": "BUY", "price": "9.20"}],
            backtest_equity_curve=[{"timestamp": "2026-05-26T08:00:00+00:00", "equity": 100000.0}],
            backtest_diagnostics=[{"id": "return-profile", "label": "Return profile", "value": "+4.20%"}],
        )

    def test_docker_smoke_validates_workspace_payload(self):
        docker_smoke = self._load_docker_smoke_module()

        summary = docker_smoke.validate_workspace_payload(
            {
                "schemaVersion": 1,
                "selectedInstrument": {"symbol": "600000"},
                "watchlist": [{"symbol": "600000"}, {"symbol": "AAPL"}],
            }
        )

        self.assertEqual(summary, "workspace schema=1 selected=600000 watchlist=2")

    def test_docker_smoke_rejects_invalid_workspace_payload(self):
        docker_smoke = self._load_docker_smoke_module()

        with self.assertRaisesRegex(RuntimeError, "Invalid /api/workspace response"):
            docker_smoke.validate_workspace_payload({"schemaVersion": 1, "watchlist": []})

    def test_docker_smoke_compose_up_args_support_optional_build(self):
        docker_smoke = self._load_docker_smoke_module()

        self.assertEqual(docker_smoke.compose_up_args(build=True), ["docker", "compose", "up", "-d", "--build"])
        self.assertEqual(docker_smoke.compose_up_args(build=False), ["docker", "compose", "up", "-d"])

    def test_docker_smoke_command_runner_keeps_success_output_quiet(self):
        import contextlib
        import io
        import subprocess

        docker_smoke = self._load_docker_smoke_module()
        calls = []

        def fake_run(*args, **kwargs):
            calls.append((args, kwargs))
            return subprocess.CompletedProcess(args=args[0], returncode=0, stdout="verbose compose config\n")

        original_run = docker_smoke.subprocess.run
        docker_smoke.subprocess.run = fake_run
        output = io.StringIO()
        try:
            with contextlib.redirect_stdout(output):
                docker_smoke.run_command(["docker", "compose", "config"], cwd=Path("F:/MyProjects/AIQuantificationTools"))
        finally:
            docker_smoke.subprocess.run = original_run

        self.assertEqual(output.getvalue(), "$ docker compose config\n")
        self.assertEqual(calls[0][1]["stdout"], subprocess.PIPE)
        self.assertEqual(calls[0][1]["stderr"], subprocess.STDOUT)

    def test_docker_smoke_command_runner_uses_utf8_output_decoding(self):
        import subprocess

        docker_smoke = self._load_docker_smoke_module()
        calls = []

        def fake_run(*args, **kwargs):
            calls.append((args, kwargs))
            return subprocess.CompletedProcess(args=args[0], returncode=0, stdout="compose ✓\n")

        original_run = docker_smoke.subprocess.run
        docker_smoke.subprocess.run = fake_run
        try:
            docker_smoke.run_command(["docker", "compose", "config"], cwd=Path("F:/MyProjects/AIQuantificationTools"))
        finally:
            docker_smoke.subprocess.run = original_run

        self.assertEqual(calls[0][1]["encoding"], "utf-8")
        self.assertEqual(calls[0][1]["errors"], "replace")

    def test_quant_api_bind_uses_container_environment(self):
        from quant_core.api import resolve_api_bind

        self.assertEqual(resolve_api_bind(environ={}), ("127.0.0.1", 8765))
        self.assertEqual(
            resolve_api_bind(environ={"QUANT_CORE_HOST": "0.0.0.0", "QUANT_CORE_PORT": "8765"}),
            ("0.0.0.0", 8765),
        )
        self.assertEqual(resolve_api_bind(environ={"QUANT_CORE_PORT": "not-a-number"}), ("127.0.0.1", 8765))

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

    def test_strategy_snapshot_parses_volume_confirmation_condition(self):
        from quant_core.research import strategy_config_from_snapshot
        from quant_core.terminal import StrategySnapshot

        snapshot = StrategySnapshot(
            name="Volume confirmed SMA",
            entry="Close > SMA5 with volume above SMA10",
            exit="Close < SMA5",
            position="35% cap per instrument",
            risk="Stop -7%, take profit +14%, drawdown guard 10%, paper only",
        )

        strategy = strategy_config_from_snapshot(snapshot, market="ashare", symbol="600000", timeframe="1d")

        self.assertEqual(
            [(condition.kind, condition.params) for condition in strategy.entry_conditions],
            [
                ("close_above_sma", {"window": 5}),
                ("volume_above_sma", {"window": 10}),
            ],
        )

    def test_strategy_snapshot_defaults_volume_confirmation_window_when_only_context_mentions_timeframe(self):
        from quant_core.research import strategy_config_from_snapshot
        from quant_core.terminal import StrategySnapshot

        snapshot = StrategySnapshot(
            name="AI volume draft",
            entry="Close above SMA20 with volume confirmation after 1d research context",
            exit="Close < SMA20",
            position="35% cap per instrument",
            risk="Stop -7%, take profit +14%, drawdown guard 10%, paper only",
        )

        strategy = strategy_config_from_snapshot(snapshot, market="ashare", symbol="600000", timeframe="1d")

        self.assertEqual(strategy.entry_conditions[1].kind, "volume_above_sma")
        self.assertEqual(strategy.entry_conditions[1].params, {"window": 20})

    def test_strategy_snapshot_parses_rsi_conditions_without_defaulting_to_sma(self):
        from quant_core.research import strategy_config_from_snapshot
        from quant_core.terminal import StrategySnapshot

        snapshot = StrategySnapshot(
            name="RSI reversal",
            entry="RSI14 < 30 with volume above SMA10",
            exit="RSI14 > 55",
            position="35% cap per instrument",
            risk="Stop -7%, take profit +14%, drawdown guard 10%, paper only",
        )

        strategy = strategy_config_from_snapshot(snapshot, market="ashare", symbol="600000", timeframe="1d")

        self.assertEqual(
            [(condition.kind, condition.params) for condition in strategy.entry_conditions],
            [
                ("rsi_below", {"window": 14, "threshold": 30.0}),
                ("volume_above_sma", {"window": 10}),
            ],
        )
        self.assertEqual(
            [(condition.kind, condition.params) for condition in strategy.exit_conditions],
            [("rsi_above", {"window": 14, "threshold": 55.0})],
        )

    def test_strategy_snapshot_parses_combined_sma_rsi_and_volume_entry_conditions(self):
        from quant_core.research import strategy_config_from_snapshot
        from quant_core.terminal import StrategySnapshot

        snapshot = StrategySnapshot(
            name="Combined entry",
            entry="Close > SMA5 AND RSI14 > 55 AND Volume > VOL10",
            exit="Close < SMA13",
            position="20% max capital allocation",
            risk="Stop -6%, take profit +16%, drawdown guard 9%, paper only",
        )

        strategy = strategy_config_from_snapshot(snapshot, market="ashare", symbol="600000", timeframe="1d")

        self.assertEqual(
            [(condition.kind, condition.params) for condition in strategy.entry_conditions],
            [
                ("close_above_sma", {"window": 5}),
                ("rsi_above", {"window": 14, "threshold": 55.0}),
                ("volume_above_sma", {"window": 10}),
            ],
        )

    def test_backtest_waits_for_volume_confirmation_before_entry(self):
        from quant_core.backtest import BacktestEngine
        from quant_core.domain import Condition, OHLCVBar, RiskRules, StrategyConfig

        start = datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc)
        bars = [
            OHLCVBar("600000", "ashare", "1d", start + timedelta(days=0), 10, 10, 10, 10, 100),
            OHLCVBar("600000", "ashare", "1d", start + timedelta(days=1), 11, 11, 11, 11, 100),
            OHLCVBar("600000", "ashare", "1d", start + timedelta(days=2), 12, 12, 12, 12, 80),
            OHLCVBar("600000", "ashare", "1d", start + timedelta(days=3), 13, 13, 13, 13, 220),
            OHLCVBar("600000", "ashare", "1d", start + timedelta(days=4), 14, 14, 14, 14, 220),
        ]
        strategy = StrategyConfig(
            name="Volume confirmed SMA",
            market="ashare",
            symbols=["600000"],
            timeframe="1d",
            entry_conditions=[
                Condition(kind="close_above_sma", params={"window": 2}),
                Condition(kind="volume_above_sma", params={"window": 3}),
            ],
            exit_conditions=[],
            risk=RiskRules(position_pct=0.5),
        )

        result = BacktestEngine().run(strategy, bars)

        self.assertEqual(result.trades[0].side, "buy")
        self.assertEqual(result.trades[0].timestamp, bars[3].timestamp)
        self.assertEqual(result.trades[0].reason, "entry_conditions")

    def test_backtest_waits_for_rsi_threshold_before_entry(self):
        from quant_core.backtest import BacktestEngine
        from quant_core.domain import Condition, OHLCVBar, RiskRules, StrategyConfig

        start = datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc)
        closes = [10, 9, 8, 7, 8, 9]
        bars = [
            OHLCVBar("600000", "ashare", "1d", start + timedelta(days=index), close, close, close, close, 1000)
            for index, close in enumerate(closes)
        ]
        strategy = StrategyConfig(
            name="RSI reversal",
            market="ashare",
            symbols=["600000"],
            timeframe="1d",
            entry_conditions=[Condition(kind="rsi_below", params={"window": 3, "threshold": 30})],
            exit_conditions=[Condition(kind="close_above_sma", params={"window": 2})],
            risk=RiskRules(position_pct=0.5),
        )

        result = BacktestEngine().run(strategy, bars)

        self.assertEqual([(trade.side, trade.timestamp) for trade in result.trades[:2]], [("buy", bars[3].timestamp), ("sell", bars[4].timestamp)])
        self.assertEqual(result.trades[0].reason, "entry_conditions")
        self.assertEqual(result.trades[1].reason, "exit_conditions")

    def test_portfolio_backtest_combines_symbol_runs_with_weights_and_cash_buffer(self):
        from quant_core.domain import BacktestMetrics, BacktestRun, DataQuality, EquityPoint
        from quant_core.portfolio_backtest import PortfolioBacktestEngine, PortfolioLeg

        start = datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc)
        timestamps = [start + timedelta(days=index) for index in range(3)]

        def audited_run(symbol: str, equities: list[float], return_pct: float, drawdown_pct: float) -> BacktestRun:
            return BacktestRun(
                strategy_name="Audited SMA plan",
                strategy_revision=f"rev-{symbol}",
                symbol=symbol,
                market="ashare",
                timeframe="1d",
                metrics=BacktestMetrics(
                    total_return_pct=return_pct,
                    annual_return_pct=return_pct,
                    max_drawdown_pct=drawdown_pct,
                    win_rate_pct=50.0,
                    profit_factor=1.5,
                    trade_count=2,
                ),
                trades=[],
                equity_curve=[
                    EquityPoint(timestamp=timestamp, equity=equity)
                    for timestamp, equity in zip(timestamps, equities, strict=True)
                ],
                data_quality=DataQuality(source="local-cache", is_complete=True, rows=len(equities)),
            )

        result = PortfolioBacktestEngine(initial_cash=100_000).run(
            name="A-share core basket",
            legs=[
                PortfolioLeg(target_weight=0.6, run=audited_run("600000", [100_000, 110_000, 105_000], 5.0, 4.5)),
                PortfolioLeg(target_weight=0.3, run=audited_run("000300", [100_000, 95_000, 120_000], 20.0, 5.0)),
            ],
        )

        self.assertEqual(result.name, "A-share core basket")
        self.assertEqual(result.market, "ashare")
        self.assertEqual(result.timeframe, "1d")
        self.assertAlmostEqual(result.cash_weight, 0.1)
        self.assertEqual([point.equity for point in result.equity_curve], [100_000, 104_500, 109_000])
        self.assertAlmostEqual(result.metrics.total_return_pct, 9.0)
        self.assertEqual(result.metrics.trade_count, 4)
        self.assertEqual(result.data_quality.rows, 3)
        self.assertTrue(result.data_quality.is_complete)
        self.assertEqual(
            [(leg.symbol, leg.target_weight, leg.contribution_return_pct, leg.contribution_value) for leg in result.legs],
            [("600000", 0.6, 5.0, 3000.0), ("000300", 0.3, 20.0, 6000.0)],
        )

    def test_portfolio_backtest_outputs_pairwise_correlation_evidence(self):
        from quant_core.domain import BacktestMetrics, BacktestRun, DataQuality, EquityPoint
        from quant_core.portfolio_backtest import PortfolioBacktestEngine, PortfolioLeg, portfolio_backtest_run_to_payload

        start = datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc)
        timestamps = [start + timedelta(days=index) for index in range(4)]

        def audited_run(symbol: str, equities: list[float]) -> BacktestRun:
            return BacktestRun(
                strategy_name="Audited SMA plan",
                strategy_revision=f"rev-{symbol}",
                symbol=symbol,
                market="ashare",
                timeframe="1d",
                metrics=BacktestMetrics(
                    total_return_pct=equities[-1] / equities[0] * 100 - 100,
                    annual_return_pct=0.0,
                    max_drawdown_pct=5.0,
                    win_rate_pct=50.0,
                    profit_factor=1.5,
                    trade_count=2,
                ),
                trades=[],
                equity_curve=[
                    EquityPoint(timestamp=timestamp, equity=equity)
                    for timestamp, equity in zip(timestamps, equities, strict=True)
                ],
                data_quality=DataQuality(source="local-cache", is_complete=True, rows=len(equities)),
            )

        result = PortfolioBacktestEngine(initial_cash=100_000).run(
            name="A-share correlated basket",
            legs=[
                PortfolioLeg(target_weight=0.5, run=audited_run("600000", [100_000, 105_000, 102_000, 108_000])),
                PortfolioLeg(target_weight=0.4, run=audited_run("000300", [100_000, 104_000, 101_000, 107_000])),
            ],
        )

        self.assertEqual(len(result.correlation_pairs), 1)
        self.assertEqual((result.correlation_pairs[0].left_symbol, result.correlation_pairs[0].right_symbol), ("600000", "000300"))
        self.assertGreater(result.correlation_pairs[0].correlation, 0.99)
        payload = portfolio_backtest_run_to_payload(result)
        self.assertEqual(payload["correlationPairs"][0]["leftSymbol"], "600000")
        self.assertEqual(payload["correlationPairs"][0]["rightSymbol"], "000300")
        self.assertGreater(payload["correlationPairs"][0]["correlation"], 0.99)

    def test_portfolio_backtest_outputs_covariance_risk_summary(self):
        from quant_core.domain import BacktestMetrics, BacktestRun, DataQuality, EquityPoint
        from quant_core.portfolio_backtest import PortfolioBacktestEngine, PortfolioLeg, portfolio_backtest_run_to_payload

        start = datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc)
        timestamps = [start + timedelta(days=index) for index in range(5)]

        def audited_run(symbol: str, equities: list[float]) -> BacktestRun:
            return BacktestRun(
                strategy_name="Audited covariance plan",
                strategy_revision=f"rev-{symbol}",
                symbol=symbol,
                market="ashare",
                timeframe="1d",
                metrics=BacktestMetrics(
                    total_return_pct=equities[-1] / equities[0] * 100 - 100,
                    annual_return_pct=0.0,
                    max_drawdown_pct=5.0,
                    win_rate_pct=50.0,
                    profit_factor=1.5,
                    trade_count=2,
                ),
                trades=[],
                equity_curve=[
                    EquityPoint(timestamp=timestamp, equity=equity)
                    for timestamp, equity in zip(timestamps, equities, strict=True)
                ],
                data_quality=DataQuality(source="local-cache", is_complete=True, rows=len(equities)),
            )

        result = PortfolioBacktestEngine(initial_cash=100_000).run(
            name="A-share covariance basket",
            legs=[
                PortfolioLeg(target_weight=0.6, run=audited_run("600000", [100_000, 103_000, 101_000, 106_000, 104_000]), run_id="run-a"),
                PortfolioLeg(target_weight=0.3, run=audited_run("000300", [100_000, 101_000, 102_000, 100_000, 103_000]), run_id="run-b"),
            ],
        )

        self.assertEqual(result.covariance_risk.method, "population_covariance")
        self.assertEqual(result.covariance_risk.observations, 4)
        self.assertGreater(result.covariance_risk.annualized_volatility_pct, 20)
        self.assertEqual(
            [(item.symbol, item.source_run_id, item.target_weight) for item in result.covariance_risk.contributions],
            [("600000", "run-a", 0.6), ("000300", "run-b", 0.3)],
        )
        self.assertAlmostEqual(
            sum(item.contribution_pct for item in result.covariance_risk.contributions),
            100.0,
            places=2,
        )
        self.assertGreater(result.covariance_risk.contributions[0].contribution_pct, result.covariance_risk.contributions[1].contribution_pct)
        payload = portfolio_backtest_run_to_payload(result)
        self.assertEqual(payload["covarianceRisk"]["method"], "population_covariance")
        self.assertEqual(payload["covarianceRisk"]["observations"], 4)
        self.assertEqual(payload["covarianceRisk"]["contributions"][0]["symbol"], "600000")
        self.assertEqual(payload["covarianceRisk"]["contributions"][0]["sourceRunId"], "run-a")
        self.assertGreater(payload["covarianceRisk"]["contributions"][0]["contributionPct"], 50)

    def test_portfolio_backtest_outputs_static_allocation_events(self):
        from quant_core.domain import BacktestMetrics, BacktestRun, DataQuality, EquityPoint
        from quant_core.portfolio_backtest import PortfolioBacktestEngine, PortfolioLeg, portfolio_backtest_run_to_payload

        start = datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc)
        timestamps = [start + timedelta(days=index) for index in range(2)]

        def audited_run(symbol: str, equities: list[float]) -> BacktestRun:
            return BacktestRun(
                strategy_name="Audited SMA plan",
                strategy_revision=f"rev-{symbol}",
                symbol=symbol,
                market="ashare",
                timeframe="1d",
                metrics=BacktestMetrics(
                    total_return_pct=equities[-1] / equities[0] * 100 - 100,
                    annual_return_pct=0.0,
                    max_drawdown_pct=3.0,
                    win_rate_pct=50.0,
                    profit_factor=1.5,
                    trade_count=2,
                ),
                trades=[],
                equity_curve=[
                    EquityPoint(timestamp=timestamp, equity=equity)
                    for timestamp, equity in zip(timestamps, equities, strict=True)
                ],
                data_quality=DataQuality(source="local-cache", is_complete=True, rows=len(equities)),
            )

        result = PortfolioBacktestEngine(initial_cash=100_000).run(
            name="A-share allocation basket",
            legs=[
                PortfolioLeg(target_weight=0.6, run=audited_run("600000", [100_000, 105_000]), run_id="run-a"),
                PortfolioLeg(target_weight=0.3, run=audited_run("000300", [100_000, 102_000]), run_id="run-b"),
            ],
        )

        self.assertEqual(
            [
                (event.event_type, event.symbol, event.source_run_id, event.target_weight, event.notional_value)
                for event in result.allocation_events
            ],
            [
                ("allocate", "600000", "run-a", 0.6, 60000.0),
                ("allocate", "000300", "run-b", 0.3, 30000.0),
                ("cash_buffer", "CASH", None, 0.1, 10000.0),
            ],
        )
        self.assertEqual(result.allocation_events[0].timestamp, start)
        payload = portfolio_backtest_run_to_payload(result)
        self.assertEqual(payload["allocationEvents"][0]["sourceRunId"], "run-a")
        self.assertEqual(payload["allocationEvents"][2]["eventType"], "cash_buffer")
        self.assertEqual(payload["allocationEvents"][2]["notionalValue"], 10000.0)

    def test_portfolio_backtest_outputs_rebalance_review_events(self):
        from quant_core.domain import BacktestMetrics, BacktestRun, DataQuality, EquityPoint
        from quant_core.portfolio_backtest import PortfolioBacktestEngine, PortfolioLeg, portfolio_backtest_run_to_payload

        start = datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc)
        timestamps = [start + timedelta(days=index) for index in range(2)]

        def audited_run(symbol: str, equities: list[float]) -> BacktestRun:
            return BacktestRun(
                strategy_name="Audited SMA plan",
                strategy_revision=f"rev-{symbol}",
                symbol=symbol,
                market="ashare",
                timeframe="1d",
                metrics=BacktestMetrics(
                    total_return_pct=equities[-1] / equities[0] * 100 - 100,
                    annual_return_pct=0.0,
                    max_drawdown_pct=3.0,
                    win_rate_pct=50.0,
                    profit_factor=1.5,
                    trade_count=2,
                ),
                trades=[],
                equity_curve=[
                    EquityPoint(timestamp=timestamp, equity=equity)
                    for timestamp, equity in zip(timestamps, equities, strict=True)
                ],
                data_quality=DataQuality(source="local-cache", is_complete=True, rows=len(equities)),
            )

        result = PortfolioBacktestEngine(initial_cash=100_000).run(
            name="A-share rebalance review basket",
            legs=[
                PortfolioLeg(target_weight=0.6, run=audited_run("600000", [100_000, 120_000]), run_id="run-a"),
                PortfolioLeg(target_weight=0.3, run=audited_run("000300", [100_000, 90_000]), run_id="run-b"),
            ],
        )

        self.assertEqual(
            [
                (event.symbol, event.source_run_id, event.status, event.current_value, event.target_value, event.delta_value)
                for event in result.rebalance_events
            ],
            [
                ("600000", "run-a", "review", 72000.0, 65400.0, -6600.0),
                ("000300", "run-b", "review", 27000.0, 32700.0, 5700.0),
                ("CASH", None, "within_band", 10000.0, 10900.0, 900.0),
            ],
        )
        self.assertEqual(result.rebalance_events[0].timestamp, timestamps[-1])
        self.assertAlmostEqual(result.rebalance_events[0].ending_weight, 0.6606)
        self.assertAlmostEqual(result.rebalance_events[0].drift_pct, 6.055)
        payload = portfolio_backtest_run_to_payload(result)
        self.assertEqual(payload["rebalanceEvents"][0]["eventType"], "rebalance_review")
        self.assertEqual(payload["rebalanceEvents"][0]["sourceRunId"], "run-a")
        self.assertEqual(payload["rebalanceEvents"][0]["status"], "review")
        self.assertEqual(payload["rebalanceEvents"][0]["deltaValue"], -6600.0)
        self.assertEqual(payload["rebalanceEvents"][2]["symbol"], "CASH")

    def test_portfolio_backtest_outputs_trade_review_events_from_rebalance_drift(self):
        from quant_core.domain import BacktestMetrics, BacktestRun, DataQuality, EquityPoint
        from quant_core.portfolio_backtest import PortfolioBacktestEngine, PortfolioLeg, portfolio_backtest_run_to_payload

        start = datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc)
        timestamps = [start + timedelta(days=index) for index in range(2)]

        def audited_run(symbol: str, equities: list[float]) -> BacktestRun:
            return BacktestRun(
                strategy_name="Audited SMA plan",
                strategy_revision=f"rev-{symbol}",
                symbol=symbol,
                market="ashare",
                timeframe="1d",
                metrics=BacktestMetrics(
                    total_return_pct=equities[-1] / equities[0] * 100 - 100,
                    annual_return_pct=0.0,
                    max_drawdown_pct=3.0,
                    win_rate_pct=50.0,
                    profit_factor=1.5,
                    trade_count=2,
                ),
                trades=[],
                equity_curve=[
                    EquityPoint(timestamp=timestamp, equity=equity)
                    for timestamp, equity in zip(timestamps, equities, strict=True)
                ],
                data_quality=DataQuality(source="local-cache", is_complete=True, rows=len(equities)),
            )

        result = PortfolioBacktestEngine(initial_cash=100_000).run(
            name="A-share trade review basket",
            legs=[
                PortfolioLeg(target_weight=0.6, run=audited_run("600000", [100_000, 120_000]), run_id="run-a"),
                PortfolioLeg(target_weight=0.3, run=audited_run("000300", [100_000, 90_000]), run_id="run-b"),
            ],
        )

        self.assertEqual(
            [
                (
                    event.symbol,
                    event.source_run_id,
                    event.side,
                    event.notional_value,
                    event.target_weight,
                    event.ending_weight,
                    event.status,
                )
                for event in result.trade_review_events
            ],
            [
                ("600000", "run-a", "sell", 6600.0, 0.6, 0.6606, "paper_review"),
                ("000300", "run-b", "buy", 5700.0, 0.3, 0.2477, "paper_review"),
            ],
        )
        self.assertEqual(result.trade_review_events[0].timestamp, timestamps[-1])
        payload = portfolio_backtest_run_to_payload(result)
        self.assertEqual(payload["tradeReviewEvents"][0]["eventType"], "trade_review")
        self.assertEqual(payload["tradeReviewEvents"][0]["side"], "sell")
        self.assertEqual(payload["tradeReviewEvents"][0]["notionalValue"], 6600.0)
        self.assertNotIn("CASH", [event["symbol"] for event in payload["tradeReviewEvents"]])

    def test_portfolio_backtest_outputs_pre_trade_risk_checks_for_trade_reviews(self):
        from quant_core.domain import BacktestMetrics, BacktestRun, DataQuality, EquityPoint
        from quant_core.portfolio_backtest import PortfolioBacktestEngine, PortfolioLeg, portfolio_backtest_run_to_payload

        start = datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc)
        timestamps = [start + timedelta(days=index) for index in range(2)]

        def audited_run(symbol: str, equities: list[float]) -> BacktestRun:
            return BacktestRun(
                strategy_name="Audited SMA plan",
                strategy_revision=f"rev-{symbol}",
                symbol=symbol,
                market="ashare",
                timeframe="1d",
                metrics=BacktestMetrics(
                    total_return_pct=equities[-1] / equities[0] * 100 - 100,
                    annual_return_pct=0.0,
                    max_drawdown_pct=3.0,
                    win_rate_pct=50.0,
                    profit_factor=1.5,
                    trade_count=2,
                ),
                trades=[],
                equity_curve=[
                    EquityPoint(timestamp=timestamp, equity=equity)
                    for timestamp, equity in zip(timestamps, equities, strict=True)
                ],
                data_quality=DataQuality(source="local-cache", is_complete=True, rows=len(equities)),
            )

        result = PortfolioBacktestEngine(initial_cash=100_000).run(
            name="A-share pre-trade checks basket",
            legs=[
                PortfolioLeg(target_weight=0.6, run=audited_run("600000", [100_000, 200_000]), run_id="run-a"),
                PortfolioLeg(target_weight=0.3, run=audited_run("000300", [100_000, 50_000]), run_id="run-b"),
            ],
        )

        self.assertEqual(
            [(check.scope, check.symbol, check.check_id, check.status) for check in result.pre_trade_risk_checks],
            [
                ("portfolio", None, "portfolio_data_quality", "passed"),
                ("trade", "600000", "trade_review_status", "blocked"),
                ("trade", "600000", "trade_notional_limit", "blocked"),
                ("trade", "000300", "trade_review_status", "blocked"),
                ("trade", "000300", "trade_notional_limit", "review"),
            ],
        )
        self.assertGreater(result.pre_trade_risk_checks[2].value, 0.2)
        self.assertEqual(result.pre_trade_risk_checks[2].limit, 0.2)
        payload = portfolio_backtest_run_to_payload(result)
        self.assertEqual(payload["preTradeRiskChecks"][0]["eventType"], "pre_trade_risk_check")
        self.assertEqual(payload["preTradeRiskChecks"][0]["checkId"], "portfolio_data_quality")
        self.assertEqual(payload["preTradeRiskChecks"][2]["status"], "blocked")
        self.assertEqual(payload["preTradeRiskChecks"][2]["limit"], 0.2)

    def test_portfolio_backtest_outputs_paper_order_events_from_pre_trade_checks(self):
        from quant_core.domain import BacktestMetrics, BacktestRun, DataQuality, EquityPoint
        from quant_core.portfolio_backtest import PortfolioBacktestEngine, PortfolioLeg, portfolio_backtest_run_to_payload

        start = datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc)
        timestamps = [start + timedelta(days=index) for index in range(2)]

        def audited_run(symbol: str, equities: list[float]) -> BacktestRun:
            return BacktestRun(
                strategy_name="Audited SMA plan",
                strategy_revision=f"rev-{symbol}",
                symbol=symbol,
                market="ashare",
                timeframe="1d",
                metrics=BacktestMetrics(
                    total_return_pct=equities[-1] / equities[0] * 100 - 100,
                    annual_return_pct=0.0,
                    max_drawdown_pct=3.0,
                    win_rate_pct=50.0,
                    profit_factor=1.5,
                    trade_count=2,
                ),
                trades=[],
                equity_curve=[
                    EquityPoint(timestamp=timestamp, equity=equity)
                    for timestamp, equity in zip(timestamps, equities, strict=True)
                ],
                data_quality=DataQuality(source="local-cache", is_complete=True, rows=len(equities)),
            )

        result = PortfolioBacktestEngine(initial_cash=100_000).run(
            name="A-share paper order basket",
            legs=[
                PortfolioLeg(target_weight=0.6, run=audited_run("600000", [100_000, 120_000]), run_id="run-a"),
                PortfolioLeg(target_weight=0.3, run=audited_run("000300", [100_000, 90_000]), run_id="run-b"),
                PortfolioLeg(target_weight=0.05, run=audited_run("002415", [100_000, 100_000]), run_id="run-c"),
            ],
        )

        self.assertEqual(
            [
                (event.symbol, event.side, event.status, event.notional_value, event.quantity, event.risk_status)
                for event in result.paper_order_events
            ],
            [
                ("600000", "sell", "pending_review", 6600.0, 6600.0, "review"),
                ("000300", "buy", "pending_review", 5700.0, 5700.0, "review"),
                ("002415", "hold", "skipped", 0.0, 0.0, "passed"),
            ],
        )
        self.assertEqual(result.paper_order_events[0].order_id, "portfolio-paper-run-a-sell")
        self.assertEqual(result.paper_order_events[0].source_run_id, "run-a")
        self.assertIn("operator review", result.paper_order_events[0].reason)

        payload = portfolio_backtest_run_to_payload(result)
        self.assertEqual(payload["paperOrderEvents"][0]["eventType"], "portfolio_paper_order")
        self.assertEqual(payload["paperOrderEvents"][0]["status"], "pending_review")
        self.assertEqual(payload["paperOrderEvents"][0]["quantity"], 6600.0)
        self.assertEqual(payload["paperOrderEvents"][2]["status"], "skipped")

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

    def test_strategy_library_store_preserves_imported_strategy_revision(self):
        from quant_core.strategy_library import StrategyLibraryStore, strategy_library_record_to_payload

        imported_config = {
            "name": "Imported SMA plan",
            "revision": "external-rev-001",
            "market": "ashare",
            "symbols": ["600000"],
            "timeframe": "1d",
            "version": 1,
            "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
            "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
            "risk": {"positionPct": 0.8, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.2},
        }

        with tempfile.TemporaryDirectory() as tmp:
            store = StrategyLibraryStore(f"{tmp}/strategies.sqlite")
            record = store.save_payload(imported_config, audit_run_id="run-imported-strategy")
            payload = strategy_library_record_to_payload(record)

        self.assertEqual(payload["revision"], "external-rev-001")
        self.assertEqual(payload["status"], "audited")
        self.assertEqual(payload["auditRunId"], "run-imported-strategy")
        self.assertEqual(payload["strategyConfig"]["revision"], "external-rev-001")
        self.assertEqual(payload["strategySnapshot"]["entry"], "Close > SMA20")

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

    def test_strategy_validation_accepts_structured_rsi_conditions(self):
        from quant_core.strategy_validation import validate_strategy_snapshot
        from quant_core.terminal import StrategySnapshot

        validation = validate_strategy_snapshot(
            StrategySnapshot(
                name="RSI reversal",
                entry="RSI14 < 30",
                exit="RSI14 > 55",
                position="35% cap per instrument",
                risk="Stop -7%, take profit +14%, drawdown guard 10%, paper only",
            ),
            market="ashare",
            symbol="600000",
            timeframe="1d",
        )

        self.assertEqual(validation.status, "review")
        self.assertEqual(validation.gates[0].status, "passed")
        self.assertEqual(validation.gates[0].value, "RSI14 < 30 / RSI14 > 55")

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
        from quant_core.domain import OHLCVBar
        from quant_core.live_quotes import QuantDingerLiveQuoteAdapter

        with tempfile.TemporaryDirectory() as tmp:
            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(f"{tmp}/market.sqlite")
                quote_adapter = QuantDingerLiveQuoteAdapter(finnhub_api_key="secret-finnhub-token")

            TestHandler.cache.upsert_bars(
                [
                    OHLCVBar(
                        symbol="600000",
                        market="ashare",
                        timeframe="1d",
                        timestamp=datetime(2026, 5, 28, tzinfo=timezone.utc),
                        open=9.1,
                        high=9.4,
                        low=9.0,
                        close=9.21,
                        volume=1_000_000,
                    ),
                    OHLCVBar(
                        symbol="BTC/USDT",
                        market="crypto",
                        timeframe="1d",
                        timestamp=datetime(2026, 5, 29, tzinfo=timezone.utc),
                        open=68_000,
                        high=69_000,
                        low=67_000,
                        close=68_200,
                        volume=2_000,
                    ),
                ]
            )

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
        self.assertEqual(settings["cache"]["rowCount"], 2)
        self.assertEqual(settings["cache"]["contextCount"], 2)
        self.assertEqual(settings["cache"]["latestTimestamp"], "2026-05-29T00:00:00+00:00")
        cache_contexts = settings["cache"]["contexts"]
        self.assertEqual(len(cache_contexts), 2)
        self.assertEqual(cache_contexts[0]["market"], "crypto")
        self.assertEqual(cache_contexts[0]["symbol"], "BTC/USDT")
        self.assertEqual(cache_contexts[0]["rowCount"], 1)
        self.assertIn(cache_contexts[0]["freshness"], ["fresh", "stale"])
        self.assertIsInstance(cache_contexts[0]["ageHours"], int)
        self.assertEqual(cache_contexts[1]["market"], "ashare")
        self.assertEqual(cache_contexts[1]["symbol"], "600000")
        self.assertEqual(cache_contexts[1]["rowCount"], 1)
        self.assertIn(cache_contexts[1]["freshness"], ["fresh", "stale"])
        self.assertIsInstance(cache_contexts[1]["ageHours"], int)
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

    def test_sqlite_cache_reports_row_context_and_latest_timestamp_stats(self):
        from quant_core.cache import MarketDataCache
        from quant_core.domain import OHLCVBar

        first = OHLCVBar(
            symbol="600000",
            market="ashare",
            timeframe="1d",
            timestamp=datetime(2026, 5, 27, tzinfo=timezone.utc),
            open=9.0,
            high=9.4,
            low=8.9,
            close=9.2,
            volume=1000,
        )
        second = OHLCVBar(
            symbol="600000",
            market="ashare",
            timeframe="1d",
            timestamp=datetime(2026, 5, 28, tzinfo=timezone.utc),
            open=9.2,
            high=9.5,
            low=9.1,
            close=9.3,
            volume=1100,
        )
        third = OHLCVBar(
            symbol="AAPL",
            market="us",
            timeframe="1d",
            timestamp=datetime(2026, 5, 29, tzinfo=timezone.utc),
            open=190,
            high=195,
            low=188,
            close=192,
            volume=12_000,
        )

        with tempfile.TemporaryDirectory() as tmp:
            cache = MarketDataCache(f"{tmp}/market.sqlite")
            cache.upsert_bars([first, second, third])
            stats = cache.stats()

        self.assertEqual(stats["row_count"], 3)
        self.assertEqual(stats["context_count"], 2)
        self.assertEqual(stats["latest_timestamp"], "2026-05-29T00:00:00+00:00")

    def test_sqlite_cache_lists_contexts_by_latest_timestamp(self):
        from quant_core.cache import MarketDataCache
        from quant_core.domain import OHLCVBar

        bars = [
            OHLCVBar(
                symbol="600000",
                market="ashare",
                timeframe="1d",
                timestamp=datetime(2026, 5, 27, tzinfo=timezone.utc),
                open=9.0,
                high=9.4,
                low=8.9,
                close=9.2,
                volume=1000,
            ),
            OHLCVBar(
                symbol="600000",
                market="ashare",
                timeframe="1d",
                timestamp=datetime(2026, 5, 28, tzinfo=timezone.utc),
                open=9.2,
                high=9.5,
                low=9.1,
                close=9.3,
                volume=1100,
            ),
            OHLCVBar(
                symbol="AAPL",
                market="us",
                timeframe="1d",
                timestamp=datetime(2026, 5, 29, tzinfo=timezone.utc),
                open=190,
                high=195,
                low=188,
                close=192,
                volume=12_000,
            ),
        ]

        with tempfile.TemporaryDirectory() as tmp:
            cache = MarketDataCache(f"{tmp}/market.sqlite")
            cache.upsert_bars(bars)
            contexts = cache.contexts(limit=2)

        self.assertEqual(
            contexts,
            [
                {
                    "market": "us",
                    "symbol": "AAPL",
                    "timeframe": "1d",
                    "row_count": 1,
                    "start_timestamp": "2026-05-29T00:00:00+00:00",
                    "end_timestamp": "2026-05-29T00:00:00+00:00",
                },
                {
                    "market": "ashare",
                    "symbol": "600000",
                    "timeframe": "1d",
                    "row_count": 2,
                    "start_timestamp": "2026-05-27T00:00:00+00:00",
                    "end_timestamp": "2026-05-28T00:00:00+00:00",
                },
            ],
        )

    def test_settings_status_marks_cache_context_freshness(self):
        from quant_core.settings import build_settings_status

        with tempfile.TemporaryDirectory() as tmp:
            settings = build_settings_status(
                cache_path=f"{tmp}/market.sqlite",
                cache_contexts=[
                    {
                        "market": "ashare",
                        "symbol": "600000",
                        "timeframe": "1d",
                        "row_count": 500,
                        "start_timestamp": "2026-05-01T00:00:00+00:00",
                        "end_timestamp": "2026-05-29T00:00:00+00:00",
                    },
                    {
                        "market": "crypto",
                        "symbol": "BTC/USDT",
                        "timeframe": "5m",
                        "row_count": 100,
                        "start_timestamp": "2026-05-30T00:00:00+00:00",
                        "end_timestamp": "2026-05-30T22:00:00+00:00",
                    },
                    {
                        "market": "us",
                        "symbol": "AAPL",
                        "timeframe": "1d",
                        "row_count": 100,
                        "start_timestamp": "2026-05-01T00:00:00+00:00",
                        "end_timestamp": "2026-05-20T00:00:00+00:00",
                    },
                    {
                        "market": "ashare",
                        "symbol": "000001",
                        "timeframe": "1d",
                        "row_count": 0,
                        "start_timestamp": None,
                        "end_timestamp": None,
                    },
                ],
                cache_stats={"row_count": 700, "context_count": 4, "latest_timestamp": "2026-05-30T22:00:00+00:00"},
                generated_at=datetime(2026, 5, 31, tzinfo=timezone.utc),
            )

        contexts = settings["cache"]["contexts"]
        self.assertEqual(settings["cache"]["freshnessSummary"], {"fresh": 2, "stale": 1, "empty": 1})
        self.assertEqual(contexts[0]["freshness"], "fresh")
        self.assertEqual(contexts[0]["ageHours"], 48)
        self.assertEqual(contexts[1]["freshness"], "fresh")
        self.assertEqual(contexts[1]["ageHours"], 2)
        self.assertEqual(contexts[2]["freshness"], "stale")
        self.assertEqual(contexts[2]["ageHours"], 264)
        self.assertEqual(contexts[3]["freshness"], "empty")
        self.assertIsNone(contexts[3]["ageHours"])

    def test_execution_adapter_state_ledger_summarizes_live_blocked_routes(self):
        from quant_core.settings import build_execution_adapter_state_ledger, build_settings_status

        with tempfile.TemporaryDirectory() as tmp:
            settings = build_settings_status(
                cache_path=f"{tmp}/market.sqlite",
                generated_at=datetime(2026, 6, 7, 9, 30, tzinfo=timezone.utc),
            )
            ledger = build_execution_adapter_state_ledger(
                settings,
                generated_at=datetime(2026, 6, 7, 9, 31, tzinfo=timezone.utc),
            )

        self.assertEqual(ledger["schemaVersion"], 1)
        self.assertEqual(ledger["mode"], "execution_adapter_state_ledger")
        self.assertFalse(ledger["liveTradingAllowed"])
        self.assertEqual(ledger["summary"]["adapterCount"], 4)
        self.assertEqual(ledger["summary"]["paperReadyAdapters"], 1)
        self.assertEqual(ledger["summary"]["certifiedLiveAdapters"], 0)
        self.assertEqual(ledger["summary"]["blockedLiveAdapters"], 3)
        self.assertEqual(ledger["summary"]["requiredGateCount"], 3)
        paper = ledger["adapters"][0]
        self.assertEqual(paper["id"], "paper-local")
        self.assertEqual(paper["currentState"], "paper_ready")
        self.assertEqual(paper["events"][0]["state"], "paper_ready")
        self.assertIn("paper execution", paper["events"][0]["reason"].lower())
        live = next(row for row in ledger["adapters"] if row["id"] == "ashare-live")
        self.assertEqual(live["currentState"], "blocked")
        self.assertEqual([gate["id"] for gate in live["gates"]], ["adapter-certified", "risk-approved", "human-confirmed"])
        self.assertFalse(all(gate["passed"] for gate in live["gates"]))
        self.assertEqual(live["events"][0]["state"], "live_blocked")
        self.assertEqual(live["events"][0]["actor"], "execution-safety")

    def test_execution_adapter_state_ledger_api_returns_read_only_status(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.cache_path = Path(tmp) / "market.sqlite"
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/execution/adapter-ledger")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["adapterLedger"]["mode"], "execution_adapter_state_ledger")
        self.assertFalse(payload["adapterLedger"]["liveTradingAllowed"])
        self.assertEqual(payload["adapterLedger"]["summary"]["certifiedLiveAdapters"], 0)
        self.assertEqual(payload["adapterLedger"]["adapters"][0]["id"], "paper-local")

    def test_execution_adapter_certification_store_persists_secret_free_runs(self):
        import json

        from quant_core.execution import (
            ExecutionAdapterCertificationStore,
            create_execution_adapter_certification_run,
            execution_adapter_certification_to_audit_event_payload,
            execution_adapter_certification_to_payload,
        )

        run = create_execution_adapter_certification_run(
            adapter_id="us-live",
            market="us",
            route="live",
            operator="local-operator",
            started_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            completed_at=datetime(2026, 5, 26, 8, 1, tzinfo=timezone.utc),
            checks=[
                {
                    "id": "sandbox-credentials",
                    "label": "Sandbox credentials",
                    "status": "passed",
                    "detail": "Sandbox credential references are present.",
                    "metadata": {"apiKey": "secret-key-should-not-leak", "keyId": "paper-us-key"},
                },
                {
                    "id": "order-lifecycle",
                    "label": "Order lifecycle",
                    "status": "blocked",
                    "detail": "Sandbox fill replay has not completed.",
                    "metadata": {"token": "token-should-not-leak", "attempts": 0},
                },
            ],
            metadata={
                "source": "settings-panel",
                "password": "password-should-not-leak",
                "nested": {"privateKey": "private-key-should-not-leak", "safe": "kept"},
            },
        )

        with tempfile.TemporaryDirectory() as tmp:
            store = ExecutionAdapterCertificationStore(Path(tmp) / "adapter_certifications.sqlite")
            store.record(run)
            fetched = store.list_by_adapter("us-live")

        payload = execution_adapter_certification_to_payload(fetched[0])
        serialized = json.dumps(payload, ensure_ascii=False, sort_keys=True)
        self.assertEqual(payload["adapterId"], "us-live")
        self.assertEqual(payload["status"], "blocked")
        self.assertFalse(payload["liveTradingAllowed"])
        self.assertEqual(payload["summary"]["checkStatusCounts"], {"blocked": 1, "passed": 1})
        self.assertEqual(payload["checks"][0]["metadata"]["apiKey"], "[redacted]")
        self.assertEqual(payload["checks"][1]["metadata"]["token"], "[redacted]")
        self.assertEqual(payload["metadata"]["password"], "[redacted]")
        self.assertEqual(payload["metadata"]["nested"]["privateKey"], "[redacted]")
        self.assertEqual(payload["metadata"]["nested"]["safe"], "kept")
        self.assertNotIn("secret-key-should-not-leak", serialized)
        self.assertNotIn("token-should-not-leak", serialized)
        self.assertNotIn("password-should-not-leak", serialized)
        self.assertNotIn("private-key-should-not-leak", serialized)

        audit_payload = execution_adapter_certification_to_audit_event_payload(fetched[0])
        audit_serialized = json.dumps(audit_payload, ensure_ascii=False, sort_keys=True)
        self.assertEqual(audit_payload["eventType"], "execution_adapter_certification")
        self.assertEqual(audit_payload["metadata"]["adapterId"], "us-live")
        self.assertEqual(audit_payload["metadata"]["status"], "blocked")
        self.assertFalse(audit_payload["metadata"]["liveTradingAllowed"])
        self.assertNotIn("secret-key-should-not-leak", audit_serialized)
        self.assertNotIn("token-should-not-leak", audit_serialized)

    def test_execution_adapter_certification_api_records_and_lists_runs(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore
        from quant_core.execution import ExecutionAdapterCertificationStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.execution_adapter_certification_store = ExecutionAdapterCertificationStore(
                Path(tmp) / "adapter_certifications.sqlite"
            )
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                request = {
                    "adapterId": "crypto-live",
                    "market": "crypto",
                    "route": "live",
                    "operator": "local-operator",
                    "startedAt": "2026-05-26T08:00:00+00:00",
                    "completedAt": "2026-05-26T08:02:00+00:00",
                    "checks": [
                        {
                            "id": "sandbox-credentials",
                            "label": "Sandbox credentials",
                            "status": "passed",
                            "detail": "Sandbox credentials are configured.",
                            "metadata": {"apiKey": "crypto-secret-key-should-not-leak"},
                        },
                        {
                            "id": "kill-switch",
                            "label": "Kill switch",
                            "status": "blocked",
                            "detail": "Emergency stop has not been acknowledged.",
                            "metadata": {"token": "crypto-token-should-not-leak"},
                        },
                    ],
                    "metadata": {"source": "settings-panel", "password": "crypto-password-should-not-leak"},
                }
                body = json.dumps(request).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications",
                    body=body,
                    headers={"Content-Type": "application/json"},
                )
                post_response = connection.getresponse()
                post_payload = json.loads(post_response.read().decode("utf-8"))

                connection.request("GET", "/api/execution/adapter-certifications?adapterId=crypto-live")
                get_response = connection.getresponse()
                get_payload = json.loads(get_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized_post = json.dumps(post_payload, ensure_ascii=False, sort_keys=True)
        serialized_get = json.dumps(get_payload, ensure_ascii=False, sort_keys=True)
        self.assertEqual(post_response.status, 201)
        self.assertEqual(post_payload["adapterCertification"]["adapterId"], "crypto-live")
        self.assertEqual(post_payload["adapterCertification"]["status"], "blocked")
        self.assertFalse(post_payload["adapterCertification"]["liveTradingAllowed"])
        self.assertEqual(post_payload["auditEvent"]["eventType"], "execution_adapter_certification")
        self.assertEqual(get_response.status, 200)
        self.assertEqual(len(get_payload["adapterCertifications"]), 1)
        self.assertEqual(get_payload["adapterCertifications"][0]["adapterId"], "crypto-live")
        self.assertNotIn("crypto-secret-key-should-not-leak", serialized_post)
        self.assertNotIn("crypto-token-should-not-leak", serialized_post)
        self.assertNotIn("crypto-password-should-not-leak", serialized_get)

    def test_execution_adapter_certification_apply_preflight_requires_confirmations_without_leaking_secret(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore
        from quant_core.execution import ExecutionAdapterCertificationStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.execution_adapter_certification_store = ExecutionAdapterCertificationStore(
                Path(tmp) / "adapter_certifications.sqlite"
            )
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                certification_request = {
                    "adapterId": "ashare-live",
                    "market": "ashare",
                    "route": "live",
                    "operator": "local-operator",
                    "startedAt": "2026-06-08T08:00:00+00:00",
                    "completedAt": "2026-06-08T08:02:00+00:00",
                    "checks": [
                        {
                            "id": "sandbox-credentials",
                            "label": "Sandbox credentials",
                            "status": "passed",
                            "detail": "Sandbox references are present.",
                            "metadata": {"apiKey": "cert-secret-key-should-not-leak"},
                        },
                        {
                            "id": "order-lifecycle",
                            "label": "Order lifecycle",
                            "status": "passed",
                            "detail": "Order lifecycle replay is complete.",
                            "metadata": {"token": "cert-token-should-not-leak"},
                        },
                    ],
                    "metadata": {"source": "settings-panel", "password": "cert-password-should-not-leak"},
                }
                certification_body = json.dumps(certification_request).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications",
                    body=certification_body,
                    headers={"Content-Type": "application/json"},
                )
                certification_response = connection.getresponse()
                certification_payload = json.loads(certification_response.read().decode("utf-8"))
                certification_id = certification_payload["adapterCertification"]["certificationId"]

                blocked_body = json.dumps(
                    {
                        "certificationId": certification_id,
                        "operator": "apply-operator",
                        "confirmations": {},
                        "metadata": {
                            "source": "settings-panel",
                            "secretStorePath": "vault://paper/ashare-live",
                            "password": "apply-password-should-not-leak",
                        },
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications/apply",
                    body=blocked_body,
                    headers={"Content-Type": "application/json"},
                )
                blocked_response = connection.getresponse()
                blocked_payload = json.loads(blocked_response.read().decode("utf-8"))

                ready_body = json.dumps(
                    {
                        "certificationId": certification_id,
                        "operator": "apply-operator",
                        "confirmations": {
                            "secretReferenceStored": True,
                            "controlledRestartWindowApproved": True,
                            "operatorReviewedCertification": True,
                        },
                        "metadata": {
                            "source": "settings-panel",
                            "apiToken": "apply-token-should-not-leak",
                            "restartWindow": "manual-maintenance",
                        },
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications/apply",
                    body=ready_body,
                    headers={"Content-Type": "application/json"},
                )
                ready_response = connection.getresponse()
                ready_payload = json.loads(ready_response.read().decode("utf-8"))
                apply_events = TestHandler.audit_event_store.list_recent(
                    event_type="execution_adapter_certification_apply",
                    limit=5,
                )
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "blocked": blocked_payload,
                "ready": ready_payload,
                "events": [event.metadata for event in apply_events],
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(certification_response.status, 201)
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["certificationApply"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["certificationApply"]["blockedReasons"],
            [
                "secret_reference_not_confirmed",
                "controlled_restart_not_confirmed",
                "operator_review_not_confirmed",
            ],
        )
        self.assertEqual(
            [item["id"] for item in blocked_payload["certificationApply"]["requiredConfirmations"]],
            ["secret-reference-stored", "controlled-restart-window-approved", "operator-reviewed-certification"],
        )
        self.assertEqual(ready_response.status, 200)
        self.assertEqual(ready_payload["certificationApply"]["status"], "ready_for_restart")
        self.assertEqual(ready_payload["certificationApply"]["blockedReasons"], [])
        self.assertFalse(ready_payload["certificationApply"]["liveTradingAllowed"])
        self.assertTrue(ready_payload["certificationApply"]["paperOnly"])
        self.assertEqual(ready_payload["auditEvent"]["eventType"], "execution_adapter_certification_apply")
        self.assertEqual(len(apply_events), 2)
        self.assertNotIn("cert-secret-key-should-not-leak", serialized)
        self.assertNotIn("cert-token-should-not-leak", serialized)
        self.assertNotIn("cert-password-should-not-leak", serialized)
        self.assertNotIn("apply-password-should-not-leak", serialized)
        self.assertNotIn("apply-token-should-not-leak", serialized)

    def test_execution_adapter_certification_apply_history_lists_recent_preflights_without_leaking_secret(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore
        from quant_core.execution import ExecutionAdapterCertificationStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.execution_adapter_certification_store = ExecutionAdapterCertificationStore(
                Path(tmp) / "adapter_certifications.sqlite"
            )
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                certification_request = {
                    "adapterId": "ashare-live",
                    "market": "ashare",
                    "route": "live",
                    "operator": "local-operator",
                    "startedAt": "2026-06-08T08:00:00+00:00",
                    "completedAt": "2026-06-08T08:02:00+00:00",
                    "checks": [
                        {
                            "id": "sandbox-credentials",
                            "label": "Sandbox credentials",
                            "status": "passed",
                            "detail": "Sandbox references are present.",
                            "metadata": {"apiKey": "history-cert-key-should-not-leak"},
                        },
                        {
                            "id": "order-lifecycle",
                            "label": "Order lifecycle",
                            "status": "passed",
                            "detail": "Order lifecycle replay is complete.",
                            "metadata": {"token": "history-cert-token-should-not-leak"},
                        },
                    ],
                    "metadata": {"source": "settings-panel", "password": "history-cert-password-should-not-leak"},
                }
                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications",
                    body=json.dumps(certification_request).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                certification_response = connection.getresponse()
                certification_payload = json.loads(certification_response.read().decode("utf-8"))
                certification_id = certification_payload["adapterCertification"]["certificationId"]

                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications/apply",
                    body=json.dumps(
                        {
                            "certificationId": certification_id,
                            "operator": "apply-operator",
                            "confirmations": {},
                            "metadata": {
                                "source": "settings-panel",
                                "secretStorePath": "vault://paper/ashare-live",
                                "password": "history-apply-password-should-not-leak",
                            },
                        }
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                blocked_response = connection.getresponse()
                blocked_response.read()

                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications/apply",
                    body=json.dumps(
                        {
                            "certificationId": certification_id,
                            "operator": "apply-operator",
                            "confirmations": {
                                "secretReferenceStored": True,
                                "controlledRestartWindowApproved": True,
                                "operatorReviewedCertification": True,
                            },
                            "metadata": {
                                "source": "settings-panel",
                                "apiToken": "history-apply-token-should-not-leak",
                            },
                        }
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                ready_response = connection.getresponse()
                ready_response.read()

                connection.request(
                    "GET",
                    "/api/execution/adapter-certifications/applies?adapterId=ashare-live&limit=5",
                )
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(history_payload, ensure_ascii=False, sort_keys=True)
        self.assertEqual(certification_response.status, 201)
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(ready_response.status, 200)
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["certificationApplies"]), 2)
        self.assertEqual(history_payload["certificationApplies"][0]["status"], "ready_for_restart")
        self.assertEqual(history_payload["certificationApplies"][1]["status"], "blocked")
        self.assertEqual(history_payload["certificationApplies"][0]["adapterId"], "ashare-live")
        self.assertFalse(history_payload["certificationApplies"][0]["liveTradingAllowed"])
        self.assertTrue(history_payload["certificationApplies"][0]["paperOnly"])
        self.assertEqual(
            [item["status"] for item in history_payload["certificationApplies"][0]["requiredConfirmations"]],
            ["confirmed", "confirmed", "confirmed"],
        )
        self.assertEqual(
            [item["status"] for item in history_payload["certificationApplies"][1]["requiredConfirmations"]],
            ["missing", "missing", "missing"],
        )
        self.assertNotIn("history-cert-key-should-not-leak", serialized)
        self.assertNotIn("history-cert-token-should-not-leak", serialized)
        self.assertNotIn("history-cert-password-should-not-leak", serialized)
        self.assertNotIn("history-apply-password-should-not-leak", serialized)
        self.assertNotIn("history-apply-token-should-not-leak", serialized)

    def test_execution_adapter_controlled_restart_evidence_records_history_without_enabling_live(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore
        from quant_core.execution import ExecutionAdapterCertificationStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.execution_adapter_certification_store = ExecutionAdapterCertificationStore(
                Path(tmp) / "adapter_certifications.sqlite"
            )
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                certification_request = {
                    "adapterId": "ashare-live",
                    "market": "ashare",
                    "route": "live",
                    "operator": "local-operator",
                    "startedAt": "2026-06-08T08:00:00+00:00",
                    "completedAt": "2026-06-08T08:02:00+00:00",
                    "checks": [
                        {
                            "id": "sandbox-credentials",
                            "label": "Sandbox credentials",
                            "status": "passed",
                            "detail": "Sandbox references are present.",
                            "metadata": {"apiKey": "restart-cert-key-should-not-leak"},
                        },
                        {
                            "id": "order-lifecycle",
                            "label": "Order lifecycle",
                            "status": "passed",
                            "detail": "Order lifecycle replay is complete.",
                            "metadata": {"token": "restart-cert-token-should-not-leak"},
                        },
                    ],
                    "metadata": {"source": "settings-panel", "password": "restart-cert-password-should-not-leak"},
                }
                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications",
                    body=json.dumps(certification_request).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                certification_response = connection.getresponse()
                certification_payload = json.loads(certification_response.read().decode("utf-8"))
                certification_id = certification_payload["adapterCertification"]["certificationId"]

                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications/apply",
                    body=json.dumps(
                        {
                            "certificationId": certification_id,
                            "operator": "apply-operator",
                            "confirmations": {
                                "secretReferenceStored": True,
                                "controlledRestartWindowApproved": True,
                                "operatorReviewedCertification": True,
                            },
                            "metadata": {
                                "source": "settings-panel",
                                "apiToken": "restart-apply-token-should-not-leak",
                            },
                        }
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                apply_response = connection.getresponse()
                apply_payload = json.loads(apply_response.read().decode("utf-8"))
                apply_id = apply_payload["certificationApply"]["applyId"]

                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications/restart-evidence",
                    body=json.dumps(
                        {
                            "applyId": apply_id,
                            "operator": "restart-operator",
                            "confirmations": {},
                            "metadata": {
                                "restartWindowId": "window-ashare-live-1",
                                "secret": "restart-evidence-secret-should-not-leak",
                            },
                        }
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                blocked_response = connection.getresponse()
                blocked_payload = json.loads(blocked_response.read().decode("utf-8"))

                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications/restart-evidence",
                    body=json.dumps(
                        {
                            "applyId": apply_id,
                            "operator": "restart-operator",
                            "confirmations": {
                                "restartWindowExecuted": True,
                                "rollbackPlanConfirmed": True,
                                "postRestartValidationPassed": True,
                                "operatorReviewedRestartLogs": True,
                            },
                            "metadata": {
                                "restartWindowId": "window-ashare-live-1",
                                "privateKey": "restart-evidence-private-key-should-not-leak",
                            },
                        }
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                recorded_response = connection.getresponse()
                recorded_payload = json.loads(recorded_response.read().decode("utf-8"))

                connection.request(
                    "GET",
                    "/api/execution/adapter-certifications/restart-evidence?adapterId=ashare-live&limit=5",
                )
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "blocked": blocked_payload,
                "recorded": recorded_payload,
                "history": history_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(certification_response.status, 201)
        self.assertEqual(apply_response.status, 200)
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["controlledRestartEvidence"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["controlledRestartEvidence"]["blockedReasons"],
            [
                "restart_window_not_confirmed",
                "rollback_plan_not_confirmed",
                "post_restart_validation_not_confirmed",
                "restart_logs_not_confirmed",
            ],
        )
        self.assertEqual(recorded_response.status, 200)
        self.assertEqual(recorded_payload["controlledRestartEvidence"]["status"], "evidence_recorded")
        self.assertEqual(recorded_payload["controlledRestartEvidence"]["applyId"], apply_id)
        self.assertFalse(recorded_payload["controlledRestartEvidence"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["controlledRestartEvidence"]["paperOnly"])
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "execution_adapter_controlled_restart_evidence")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["controlledRestartEvidence"]), 2)
        self.assertEqual(history_payload["controlledRestartEvidence"][0]["status"], "evidence_recorded")
        self.assertEqual(history_payload["controlledRestartEvidence"][1]["status"], "blocked")
        self.assertNotIn("restart-cert-key-should-not-leak", serialized)
        self.assertNotIn("restart-cert-token-should-not-leak", serialized)
        self.assertNotIn("restart-cert-password-should-not-leak", serialized)
        self.assertNotIn("restart-apply-token-should-not-leak", serialized)
        self.assertNotIn("restart-evidence-secret-should-not-leak", serialized)
        self.assertNotIn("restart-evidence-private-key-should-not-leak", serialized)

    def test_execution_adapter_restart_acceptance_records_history_without_enabling_live(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore
        from quant_core.execution import ExecutionAdapterCertificationStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.execution_adapter_certification_store = ExecutionAdapterCertificationStore(
                Path(tmp) / "adapter_certifications.sqlite"
            )
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                certification_request = {
                    "adapterId": "ashare-live",
                    "market": "ashare",
                    "route": "live",
                    "operator": "local-operator",
                    "startedAt": "2026-06-08T08:00:00+00:00",
                    "completedAt": "2026-06-08T08:02:00+00:00",
                    "checks": [
                        {
                            "id": "sandbox-credentials",
                            "label": "Sandbox credentials",
                            "status": "passed",
                            "detail": "Sandbox references are present.",
                            "metadata": {"apiKey": "acceptance-cert-key-should-not-leak"},
                        },
                        {
                            "id": "order-lifecycle",
                            "label": "Order lifecycle",
                            "status": "passed",
                            "detail": "Order lifecycle replay is complete.",
                            "metadata": {"token": "acceptance-cert-token-should-not-leak"},
                        },
                    ],
                    "metadata": {"source": "settings-panel", "password": "acceptance-cert-password-should-not-leak"},
                }
                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications",
                    body=json.dumps(certification_request).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                certification_response = connection.getresponse()
                certification_payload = json.loads(certification_response.read().decode("utf-8"))
                certification_id = certification_payload["adapterCertification"]["certificationId"]

                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications/apply",
                    body=json.dumps(
                        {
                            "certificationId": certification_id,
                            "operator": "apply-operator",
                            "confirmations": {
                                "secretReferenceStored": True,
                                "controlledRestartWindowApproved": True,
                                "operatorReviewedCertification": True,
                            },
                            "metadata": {"source": "settings-panel", "apiToken": "acceptance-apply-token-should-not-leak"},
                        }
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                apply_response = connection.getresponse()
                apply_payload = json.loads(apply_response.read().decode("utf-8"))
                apply_id = apply_payload["certificationApply"]["applyId"]

                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications/restart-evidence",
                    body=json.dumps(
                        {
                            "applyId": apply_id,
                            "operator": "restart-operator",
                            "confirmations": {
                                "restartWindowExecuted": True,
                                "rollbackPlanConfirmed": True,
                                "postRestartValidationPassed": True,
                                "operatorReviewedRestartLogs": True,
                            },
                            "metadata": {"restartWindowId": "window-ashare-live-1", "secret": "acceptance-restart-secret"},
                        }
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                restart_response = connection.getresponse()
                restart_payload = json.loads(restart_response.read().decode("utf-8"))
                evidence_id = restart_payload["controlledRestartEvidence"]["evidenceId"]

                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications/restart-acceptance",
                    body=json.dumps(
                        {
                            "evidenceId": evidence_id,
                            "operator": "acceptance-operator",
                            "confirmations": {},
                            "metadata": {
                                "probeId": "post-restart-acceptance-1",
                                "secret": "acceptance-blocked-secret-should-not-leak",
                            },
                        }
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                blocked_response = connection.getresponse()
                blocked_payload = json.loads(blocked_response.read().decode("utf-8"))

                connection.request(
                    "POST",
                    "/api/execution/adapter-certifications/restart-acceptance",
                    body=json.dumps(
                        {
                            "evidenceId": evidence_id,
                            "operator": "acceptance-operator",
                            "confirmations": {
                                "coreHealthChecked": True,
                                "settingsReloadObserved": True,
                                "paperRouteHandshakePassed": True,
                                "emergencyStopArmed": True,
                                "accountSyncDryRunPassed": True,
                            },
                            "metadata": {
                                "probeId": "post-restart-acceptance-1",
                                "privateKey": "acceptance-private-key-should-not-leak",
                            },
                        }
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                recorded_response = connection.getresponse()
                recorded_payload = json.loads(recorded_response.read().decode("utf-8"))

                connection.request(
                    "GET",
                    "/api/execution/adapter-certifications/restart-acceptance?adapterId=ashare-live&limit=5",
                )
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "blocked": blocked_payload,
                "recorded": recorded_payload,
                "history": history_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(certification_response.status, 201)
        self.assertEqual(apply_response.status, 200)
        self.assertEqual(restart_response.status, 200)
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["restartAcceptance"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["restartAcceptance"]["blockedReasons"],
            [
                "local_core_health_not_confirmed",
                "settings_reload_not_confirmed",
                "paper_route_handshake_not_confirmed",
                "emergency_stop_not_confirmed",
                "account_sync_dry_run_not_confirmed",
            ],
        )
        self.assertEqual(recorded_response.status, 200)
        self.assertEqual(recorded_payload["restartAcceptance"]["status"], "acceptance_recorded")
        self.assertEqual(recorded_payload["restartAcceptance"]["evidenceId"], evidence_id)
        self.assertFalse(recorded_payload["restartAcceptance"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["restartAcceptance"]["paperOnly"])
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "execution_adapter_restart_acceptance")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["restartAcceptances"]), 2)
        self.assertEqual(history_payload["restartAcceptances"][0]["status"], "acceptance_recorded")
        self.assertEqual(history_payload["restartAcceptances"][1]["status"], "blocked")
        self.assertNotIn("acceptance-cert-key-should-not-leak", serialized)
        self.assertNotIn("acceptance-cert-token-should-not-leak", serialized)
        self.assertNotIn("acceptance-cert-password-should-not-leak", serialized)
        self.assertNotIn("acceptance-apply-token-should-not-leak", serialized)
        self.assertNotIn("acceptance-blocked-secret-should-not-leak", serialized)
        self.assertNotIn("acceptance-private-key-should-not-leak", serialized)

    def test_execution_adapter_secret_reference_records_history_without_leaking_secret(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                blocked_request = {
                    "adapterId": "ashare-live",
                    "market": "ashare",
                    "route": "live",
                    "operator": "settings-panel",
                    "referenceName": "ashare-live/broker-sandbox",
                    "backend": "local-secret-store",
                    "requiredEnvVars": [
                        "ASHARE_BROKER_CLIENT_ID",
                        "ASHARE_BROKER_CLIENT_SECRET",
                    ],
                    "confirmations": {},
                    "metadata": {
                        "source": "settings-panel",
                        "secret": "secret-reference-blocked-secret-should-not-leak",
                    },
                }
                connection.request(
                    "POST",
                    "/api/execution/adapter-secret-references",
                    body=json.dumps(blocked_request).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                blocked_response = connection.getresponse()
                blocked_payload = json.loads(blocked_response.read().decode("utf-8"))

                recorded_request = {
                    **blocked_request,
                    "confirmations": {
                        "referenceCreatedOutsideUi": True,
                        "operatorVerifiedFingerprint": True,
                        "rotationPlanDocumented": True,
                    },
                    "metadata": {
                        "source": "settings-panel",
                        "fingerprint": "sha256:paper-only-reference",
                        "privateKey": "secret-reference-private-key-should-not-leak",
                    },
                }
                connection.request(
                    "POST",
                    "/api/execution/adapter-secret-references",
                    body=json.dumps(recorded_request).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                recorded_response = connection.getresponse()
                recorded_payload = json.loads(recorded_response.read().decode("utf-8"))

                connection.request("GET", "/api/execution/adapter-secret-references?adapterId=ashare-live&limit=5")
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "blocked": blocked_payload,
                "recorded": recorded_payload,
                "history": history_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["adapterSecretReference"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["adapterSecretReference"]["blockedReasons"],
            [
                "secret_reference_not_created",
                "secret_reference_fingerprint_not_verified",
                "secret_reference_rotation_plan_not_documented",
            ],
        )
        self.assertEqual(recorded_response.status, 201)
        self.assertEqual(recorded_payload["adapterSecretReference"]["status"], "reference_recorded")
        self.assertEqual(recorded_payload["adapterSecretReference"]["adapterId"], "ashare-live")
        self.assertEqual(recorded_payload["adapterSecretReference"]["referenceName"], "ashare-live/broker-sandbox")
        self.assertEqual(recorded_payload["adapterSecretReference"]["requiredEnvVars"][0], "ASHARE_BROKER_CLIENT_ID")
        self.assertFalse(recorded_payload["adapterSecretReference"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["adapterSecretReference"]["paperOnly"])
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "execution_adapter_secret_reference")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["adapterSecretReferences"]), 2)
        self.assertEqual(history_payload["adapterSecretReferences"][0]["status"], "reference_recorded")
        self.assertEqual(history_payload["adapterSecretReferences"][1]["status"], "blocked")
        self.assertNotIn("secret-reference-blocked-secret-should-not-leak", serialized)
        self.assertNotIn("secret-reference-private-key-should-not-leak", serialized)

    def test_execution_adapter_secret_materialization_records_manifest_without_leaking_secret(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                reference_request = {
                    "adapterId": "ashare-live",
                    "market": "ashare",
                    "route": "live",
                    "operator": "settings-panel",
                    "referenceName": "ashare-live/broker-sandbox",
                    "backend": "local-secret-store",
                    "requiredEnvVars": [
                        "ASHARE_BROKER_CLIENT_ID",
                        "ASHARE_BROKER_CLIENT_SECRET",
                    ],
                    "confirmations": {
                        "referenceCreatedOutsideUi": True,
                        "operatorVerifiedFingerprint": True,
                        "rotationPlanDocumented": True,
                    },
                    "metadata": {
                        "source": "settings-panel",
                        "fingerprint": "sha256:reference-before-materialization",
                    },
                }
                connection.request(
                    "POST",
                    "/api/execution/adapter-secret-references",
                    body=json.dumps(reference_request).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                reference_response = connection.getresponse()
                reference_payload = json.loads(reference_response.read().decode("utf-8"))
                reference_id = reference_payload["adapterSecretReference"]["referenceId"]

                blocked_request = {
                    "adapterId": "ashare-live",
                    "referenceId": reference_id,
                    "operator": "settings-panel",
                    "manifestPath": "local-secret-store://ashare-live/broker-sandbox",
                    "confirmations": {},
                    "metadata": {
                        "source": "settings-panel",
                        "secret": "secret-materialization-blocked-secret-should-not-leak",
                    },
                }
                connection.request(
                    "POST",
                    "/api/execution/adapter-secret-materializations",
                    body=json.dumps(blocked_request).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                blocked_response = connection.getresponse()
                blocked_payload = json.loads(blocked_response.read().decode("utf-8"))

                recorded_request = {
                    **blocked_request,
                    "confirmations": {
                        "localSecretStoreWriteVerified": True,
                        "noRawSecretInPayload": True,
                        "envBindingPlanDocumented": True,
                        "rollbackPlanDocumented": True,
                    },
                    "metadata": {
                        "source": "settings-panel",
                        "fingerprint": "sha256:materialized-reference",
                        "privateKey": "secret-materialization-private-key-should-not-leak",
                    },
                }
                connection.request(
                    "POST",
                    "/api/execution/adapter-secret-materializations",
                    body=json.dumps(recorded_request).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                recorded_response = connection.getresponse()
                recorded_payload = json.loads(recorded_response.read().decode("utf-8"))

                connection.request("GET", "/api/execution/adapter-secret-materializations?adapterId=ashare-live&limit=5")
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "reference": reference_payload,
                "blocked": blocked_payload,
                "recorded": recorded_payload,
                "history": history_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(reference_response.status, 201)
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["adapterSecretMaterialization"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["adapterSecretMaterialization"]["blockedReasons"],
            [
                "secret_materialization_local_store_not_verified",
                "secret_materialization_raw_secret_boundary_not_confirmed",
                "secret_materialization_env_binding_plan_missing",
                "secret_materialization_rollback_plan_missing",
            ],
        )
        self.assertEqual(recorded_response.status, 201)
        self.assertEqual(recorded_payload["adapterSecretMaterialization"]["status"], "manifest_recorded")
        self.assertEqual(recorded_payload["adapterSecretMaterialization"]["referenceId"], reference_id)
        self.assertEqual(recorded_payload["adapterSecretMaterialization"]["adapterId"], "ashare-live")
        self.assertEqual(recorded_payload["adapterSecretMaterialization"]["referenceName"], "ashare-live/broker-sandbox")
        self.assertEqual(recorded_payload["adapterSecretMaterialization"]["backend"], "local-secret-store")
        self.assertEqual(recorded_payload["adapterSecretMaterialization"]["manifestPath"], "local-secret-store://ashare-live/broker-sandbox")
        self.assertEqual(recorded_payload["adapterSecretMaterialization"]["requiredEnvVars"][0], "ASHARE_BROKER_CLIENT_ID")
        self.assertFalse(recorded_payload["adapterSecretMaterialization"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["adapterSecretMaterialization"]["paperOnly"])
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "execution_adapter_secret_materialization")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["adapterSecretMaterializations"]), 2)
        self.assertEqual(history_payload["adapterSecretMaterializations"][0]["status"], "manifest_recorded")
        self.assertEqual(history_payload["adapterSecretMaterializations"][1]["status"], "blocked")
        self.assertNotIn("secret-materialization-blocked-secret-should-not-leak", serialized)
        self.assertNotIn("secret-materialization-private-key-should-not-leak", serialized)

    def test_execution_adapter_environment_binding_records_evidence_without_leaking_secret(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                reference_request = {
                    "adapterId": "ashare-live",
                    "market": "ashare",
                    "route": "live",
                    "operator": "settings-panel",
                    "referenceName": "ashare-live/broker-sandbox",
                    "backend": "local-secret-store",
                    "requiredEnvVars": [
                        "ASHARE_BROKER_CLIENT_ID",
                        "ASHARE_BROKER_CLIENT_SECRET",
                    ],
                    "confirmations": {
                        "referenceCreatedOutsideUi": True,
                        "operatorVerifiedFingerprint": True,
                        "rotationPlanDocumented": True,
                    },
                    "metadata": {"source": "settings-panel"},
                }
                connection.request(
                    "POST",
                    "/api/execution/adapter-secret-references",
                    body=json.dumps(reference_request).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                reference_response = connection.getresponse()
                reference_payload = json.loads(reference_response.read().decode("utf-8"))
                reference_id = reference_payload["adapterSecretReference"]["referenceId"]

                materialization_request = {
                    "adapterId": "ashare-live",
                    "referenceId": reference_id,
                    "operator": "settings-panel",
                    "manifestPath": "local-secret-store://ashare-live/broker-sandbox",
                    "confirmations": {
                        "localSecretStoreWriteVerified": True,
                        "noRawSecretInPayload": True,
                        "envBindingPlanDocumented": True,
                        "rollbackPlanDocumented": True,
                    },
                    "metadata": {"source": "settings-panel"},
                }
                connection.request(
                    "POST",
                    "/api/execution/adapter-secret-materializations",
                    body=json.dumps(materialization_request).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                materialization_response = connection.getresponse()
                materialization_payload = json.loads(materialization_response.read().decode("utf-8"))
                materialization_id = materialization_payload["adapterSecretMaterialization"]["materializationId"]

                blocked_request = {
                    "adapterId": "ashare-live",
                    "materializationId": materialization_id,
                    "operator": "settings-panel",
                    "bindingMode": "container_env_reference",
                    "confirmations": {},
                    "metadata": {
                        "source": "settings-panel",
                        "secret": "environment-binding-blocked-secret-should-not-leak",
                    },
                }
                connection.request(
                    "POST",
                    "/api/execution/adapter-environment-bindings",
                    body=json.dumps(blocked_request).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                blocked_response = connection.getresponse()
                blocked_payload = json.loads(blocked_response.read().decode("utf-8"))

                recorded_request = {
                    **blocked_request,
                    "confirmations": {
                        "runtimeEnvMappingVerified": True,
                        "configReloadPlanDocumented": True,
                        "noRawSecretInPayload": True,
                        "rollbackSnapshotRecorded": True,
                    },
                    "metadata": {
                        "source": "settings-panel",
                        "fingerprint": "sha256:env-binding-reference",
                        "privateKey": "environment-binding-private-key-should-not-leak",
                    },
                }
                connection.request(
                    "POST",
                    "/api/execution/adapter-environment-bindings",
                    body=json.dumps(recorded_request).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                recorded_response = connection.getresponse()
                recorded_payload = json.loads(recorded_response.read().decode("utf-8"))

                connection.request("GET", "/api/execution/adapter-environment-bindings?adapterId=ashare-live&limit=5")
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "blocked": blocked_payload,
                "recorded": recorded_payload,
                "history": history_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(reference_response.status, 201)
        self.assertEqual(materialization_response.status, 201)
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["adapterEnvironmentBinding"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["adapterEnvironmentBinding"]["blockedReasons"],
            [
                "environment_binding_runtime_env_mapping_missing",
                "environment_binding_config_reload_plan_missing",
                "environment_binding_raw_secret_boundary_not_confirmed",
                "environment_binding_rollback_snapshot_missing",
            ],
        )
        self.assertEqual(recorded_response.status, 201)
        self.assertEqual(recorded_payload["adapterEnvironmentBinding"]["status"], "binding_recorded")
        self.assertEqual(recorded_payload["adapterEnvironmentBinding"]["materializationId"], materialization_id)
        self.assertEqual(recorded_payload["adapterEnvironmentBinding"]["adapterId"], "ashare-live")
        self.assertEqual(recorded_payload["adapterEnvironmentBinding"]["bindingMode"], "container_env_reference")
        self.assertEqual(recorded_payload["adapterEnvironmentBinding"]["requiredEnvVars"][0], "ASHARE_BROKER_CLIENT_ID")
        self.assertFalse(recorded_payload["adapterEnvironmentBinding"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["adapterEnvironmentBinding"]["paperOnly"])
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "execution_adapter_environment_binding")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["adapterEnvironmentBindings"]), 2)
        self.assertEqual(history_payload["adapterEnvironmentBindings"][0]["status"], "binding_recorded")
        self.assertEqual(history_payload["adapterEnvironmentBindings"][1]["status"], "blocked")
        self.assertNotIn("environment-binding-blocked-secret-should-not-leak", serialized)
        self.assertNotIn("environment-binding-private-key-should-not-leak", serialized)

    def test_execution_adapter_runtime_reload_plan_records_evidence_without_enabling_live(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)

            def post_json(path, payload):
                connection.request(
                    "POST",
                    path,
                    body=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                response = connection.getresponse()
                return response, json.loads(response.read().decode("utf-8"))

            try:
                reference_response, reference_payload = post_json(
                    "/api/execution/adapter-secret-references",
                    {
                        "adapterId": "crypto-live",
                        "market": "crypto",
                        "route": "live",
                        "operator": "settings-panel",
                        "referenceName": "crypto-live/binance-sandbox",
                        "backend": "local-secret-store",
                        "requiredEnvVars": ["CCXT_API_KEY", "CCXT_API_SECRET"],
                        "confirmations": {
                            "referenceCreatedOutsideUi": True,
                            "operatorVerifiedFingerprint": True,
                            "rotationPlanDocumented": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                reference_id = reference_payload["adapterSecretReference"]["referenceId"]

                materialization_response, materialization_payload = post_json(
                    "/api/execution/adapter-secret-materializations",
                    {
                        "adapterId": "crypto-live",
                        "referenceId": reference_id,
                        "operator": "settings-panel",
                        "manifestPath": "local-secret-store://crypto-live/binance-sandbox",
                        "confirmations": {
                            "localSecretStoreWriteVerified": True,
                            "noRawSecretInPayload": True,
                            "envBindingPlanDocumented": True,
                            "rollbackPlanDocumented": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                materialization_id = materialization_payload["adapterSecretMaterialization"]["materializationId"]

                binding_response, binding_payload = post_json(
                    "/api/execution/adapter-environment-bindings",
                    {
                        "adapterId": "crypto-live",
                        "materializationId": materialization_id,
                        "operator": "settings-panel",
                        "bindingMode": "container_env_reference",
                        "confirmations": {
                            "runtimeEnvMappingVerified": True,
                            "configReloadPlanDocumented": True,
                            "noRawSecretInPayload": True,
                            "rollbackSnapshotRecorded": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                binding_id = binding_payload["adapterEnvironmentBinding"]["bindingId"]

                blocked_response, blocked_payload = post_json(
                    "/api/execution/adapter-runtime-reload-plans",
                    {
                        "adapterId": "crypto-live",
                        "bindingId": binding_id,
                        "operator": "runtime-operator",
                        "reloadMode": "manual_container_reload_plan",
                        "maintenanceWindowId": "window-crypto-live-1",
                        "confirmations": {},
                        "metadata": {
                            "source": "settings-panel",
                            "token": "runtime-reload-blocked-token-should-not-leak",
                        },
                    },
                )

                recorded_response, recorded_payload = post_json(
                    "/api/execution/adapter-runtime-reload-plans",
                    {
                        "adapterId": "crypto-live",
                        "bindingId": binding_id,
                        "operator": "runtime-operator",
                        "reloadMode": "manual_container_reload_plan",
                        "maintenanceWindowId": "window-crypto-live-1",
                        "confirmations": {
                            "maintenanceWindowApproved": True,
                            "healthBaselineCaptured": True,
                            "configDiffReviewed": True,
                            "postReloadSmokePlanDocumented": True,
                            "rollbackOwnerAssigned": True,
                        },
                        "metadata": {
                            "source": "settings-panel",
                            "privateKey": "runtime-reload-private-key-should-not-leak",
                        },
                    },
                )

                connection.request("GET", "/api/execution/adapter-runtime-reload-plans?adapterId=crypto-live&limit=5")
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "blocked": blocked_payload,
                "recorded": recorded_payload,
                "history": history_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(reference_response.status, 201)
        self.assertEqual(materialization_response.status, 201)
        self.assertEqual(binding_response.status, 201)
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["adapterRuntimeReloadPlan"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["adapterRuntimeReloadPlan"]["blockedReasons"],
            [
                "runtime_reload_maintenance_window_missing",
                "runtime_reload_health_baseline_missing",
                "runtime_reload_config_diff_missing",
                "runtime_reload_smoke_plan_missing",
                "runtime_reload_rollback_owner_missing",
            ],
        )
        self.assertEqual(recorded_response.status, 201)
        self.assertEqual(recorded_payload["adapterRuntimeReloadPlan"]["status"], "plan_recorded")
        self.assertEqual(recorded_payload["adapterRuntimeReloadPlan"]["bindingId"], binding_id)
        self.assertEqual(recorded_payload["adapterRuntimeReloadPlan"]["adapterId"], "crypto-live")
        self.assertEqual(recorded_payload["adapterRuntimeReloadPlan"]["reloadMode"], "manual_container_reload_plan")
        self.assertEqual(recorded_payload["adapterRuntimeReloadPlan"]["maintenanceWindowId"], "window-crypto-live-1")
        self.assertEqual(recorded_payload["adapterRuntimeReloadPlan"]["requiredEnvVars"], ["CCXT_API_KEY", "CCXT_API_SECRET"])
        self.assertFalse(recorded_payload["adapterRuntimeReloadPlan"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["adapterRuntimeReloadPlan"]["paperOnly"])
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "execution_adapter_runtime_reload_plan")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["adapterRuntimeReloadPlans"]), 2)
        self.assertEqual(history_payload["adapterRuntimeReloadPlans"][0]["status"], "plan_recorded")
        self.assertEqual(history_payload["adapterRuntimeReloadPlans"][1]["status"], "blocked")
        self.assertNotIn("runtime-reload-blocked-token-should-not-leak", serialized)
        self.assertNotIn("runtime-reload-private-key-should-not-leak", serialized)

    def test_execution_adapter_runtime_reload_execution_records_evidence_without_enabling_live(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)

            def post_json(path, payload):
                connection.request(
                    "POST",
                    path,
                    body=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                response = connection.getresponse()
                return response, json.loads(response.read().decode("utf-8"))

            try:
                reference_response, reference_payload = post_json(
                    "/api/execution/adapter-secret-references",
                    {
                        "adapterId": "us-live",
                        "market": "us",
                        "route": "live",
                        "operator": "settings-panel",
                        "referenceName": "us-live/alpaca-sandbox",
                        "backend": "local-secret-store",
                        "requiredEnvVars": ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
                        "confirmations": {
                            "referenceCreatedOutsideUi": True,
                            "operatorVerifiedFingerprint": True,
                            "rotationPlanDocumented": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                reference_id = reference_payload["adapterSecretReference"]["referenceId"]

                materialization_response, materialization_payload = post_json(
                    "/api/execution/adapter-secret-materializations",
                    {
                        "adapterId": "us-live",
                        "referenceId": reference_id,
                        "operator": "settings-panel",
                        "manifestPath": "local-secret-store://us-live/alpaca-sandbox",
                        "confirmations": {
                            "localSecretStoreWriteVerified": True,
                            "noRawSecretInPayload": True,
                            "envBindingPlanDocumented": True,
                            "rollbackPlanDocumented": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                materialization_id = materialization_payload["adapterSecretMaterialization"]["materializationId"]

                binding_response, binding_payload = post_json(
                    "/api/execution/adapter-environment-bindings",
                    {
                        "adapterId": "us-live",
                        "materializationId": materialization_id,
                        "operator": "settings-panel",
                        "bindingMode": "container_env_reference",
                        "confirmations": {
                            "runtimeEnvMappingVerified": True,
                            "configReloadPlanDocumented": True,
                            "noRawSecretInPayload": True,
                            "rollbackSnapshotRecorded": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                binding_id = binding_payload["adapterEnvironmentBinding"]["bindingId"]

                plan_response, plan_payload = post_json(
                    "/api/execution/adapter-runtime-reload-plans",
                    {
                        "adapterId": "us-live",
                        "bindingId": binding_id,
                        "operator": "runtime-operator",
                        "reloadMode": "manual_container_reload_plan",
                        "maintenanceWindowId": "window-us-live-1",
                        "confirmations": {
                            "maintenanceWindowApproved": True,
                            "healthBaselineCaptured": True,
                            "configDiffReviewed": True,
                            "postReloadSmokePlanDocumented": True,
                            "rollbackOwnerAssigned": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                plan_id = plan_payload["adapterRuntimeReloadPlan"]["planId"]

                blocked_response, blocked_payload = post_json(
                    "/api/execution/adapter-runtime-reload-executions",
                    {
                        "adapterId": "us-live",
                        "planId": plan_id,
                        "operator": "runtime-operator",
                        "executionMode": "manual_controlled_reload",
                        "confirmations": {},
                        "metadata": {
                            "source": "settings-panel",
                            "token": "runtime-reload-execution-blocked-token-should-not-leak",
                        },
                    },
                )

                recorded_response, recorded_payload = post_json(
                    "/api/execution/adapter-runtime-reload-executions",
                    {
                        "adapterId": "us-live",
                        "planId": plan_id,
                        "operator": "runtime-operator",
                        "executionMode": "manual_controlled_reload",
                        "confirmations": {
                            "preReloadHealthVerified": True,
                            "reloadActionRecorded": True,
                            "postReloadSmokePassed": True,
                            "rollbackReadinessConfirmed": True,
                            "operatorConfirmedLiveBlocked": True,
                        },
                        "metadata": {
                            "source": "settings-panel",
                            "privateKey": "runtime-reload-execution-private-key-should-not-leak",
                        },
                    },
                )

                connection.request("GET", "/api/execution/adapter-runtime-reload-executions?adapterId=us-live&limit=5")
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "blocked": blocked_payload,
                "recorded": recorded_payload,
                "history": history_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(reference_response.status, 201)
        self.assertEqual(materialization_response.status, 201)
        self.assertEqual(binding_response.status, 201)
        self.assertEqual(plan_response.status, 201)
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["adapterRuntimeReloadExecution"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["adapterRuntimeReloadExecution"]["blockedReasons"],
            [
                "runtime_reload_execution_pre_health_missing",
                "runtime_reload_execution_action_record_missing",
                "runtime_reload_execution_post_smoke_missing",
                "runtime_reload_execution_rollback_readiness_missing",
                "runtime_reload_execution_live_block_boundary_missing",
            ],
        )
        self.assertEqual(recorded_response.status, 201)
        self.assertEqual(recorded_payload["adapterRuntimeReloadExecution"]["status"], "execution_recorded")
        self.assertEqual(recorded_payload["adapterRuntimeReloadExecution"]["planId"], plan_id)
        self.assertEqual(recorded_payload["adapterRuntimeReloadExecution"]["adapterId"], "us-live")
        self.assertEqual(recorded_payload["adapterRuntimeReloadExecution"]["executionMode"], "manual_controlled_reload")
        self.assertEqual(recorded_payload["adapterRuntimeReloadExecution"]["maintenanceWindowId"], "window-us-live-1")
        self.assertEqual(recorded_payload["adapterRuntimeReloadExecution"]["requiredEnvVars"], ["ALPACA_API_KEY", "ALPACA_API_SECRET"])
        self.assertFalse(recorded_payload["adapterRuntimeReloadExecution"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["adapterRuntimeReloadExecution"]["paperOnly"])
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "execution_adapter_runtime_reload_execution")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["adapterRuntimeReloadExecutions"]), 2)
        self.assertEqual(history_payload["adapterRuntimeReloadExecutions"][0]["status"], "execution_recorded")
        self.assertEqual(history_payload["adapterRuntimeReloadExecutions"][1]["status"], "blocked")
        self.assertNotIn("runtime-reload-execution-blocked-token-should-not-leak", serialized)
        self.assertNotIn("runtime-reload-execution-private-key-should-not-leak", serialized)

    def test_execution_adapter_runtime_reload_acceptance_records_final_gate_without_enabling_live(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)

            def post_json(path, payload):
                connection.request(
                    "POST",
                    path,
                    body=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                response = connection.getresponse()
                return response, json.loads(response.read().decode("utf-8"))

            try:
                reference_response, reference_payload = post_json(
                    "/api/execution/adapter-secret-references",
                    {
                        "adapterId": "crypto-live",
                        "market": "crypto",
                        "route": "live",
                        "operator": "settings-panel",
                        "referenceName": "crypto-live/ccxt-sandbox",
                        "backend": "local-secret-store",
                        "requiredEnvVars": ["CCXT_API_KEY", "CCXT_API_SECRET"],
                        "confirmations": {
                            "referenceCreatedOutsideUi": True,
                            "operatorVerifiedFingerprint": True,
                            "rotationPlanDocumented": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                reference_id = reference_payload["adapterSecretReference"]["referenceId"]

                materialization_response, materialization_payload = post_json(
                    "/api/execution/adapter-secret-materializations",
                    {
                        "adapterId": "crypto-live",
                        "referenceId": reference_id,
                        "operator": "settings-panel",
                        "manifestPath": "local-secret-store://crypto-live/ccxt-sandbox",
                        "confirmations": {
                            "localSecretStoreWriteVerified": True,
                            "noRawSecretInPayload": True,
                            "envBindingPlanDocumented": True,
                            "rollbackPlanDocumented": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                materialization_id = materialization_payload["adapterSecretMaterialization"]["materializationId"]

                binding_response, binding_payload = post_json(
                    "/api/execution/adapter-environment-bindings",
                    {
                        "adapterId": "crypto-live",
                        "materializationId": materialization_id,
                        "operator": "settings-panel",
                        "bindingMode": "container_env_reference",
                        "confirmations": {
                            "runtimeEnvMappingVerified": True,
                            "configReloadPlanDocumented": True,
                            "noRawSecretInPayload": True,
                            "rollbackSnapshotRecorded": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                binding_id = binding_payload["adapterEnvironmentBinding"]["bindingId"]

                plan_response, plan_payload = post_json(
                    "/api/execution/adapter-runtime-reload-plans",
                    {
                        "adapterId": "crypto-live",
                        "bindingId": binding_id,
                        "operator": "runtime-operator",
                        "reloadMode": "manual_container_reload_plan",
                        "maintenanceWindowId": "window-crypto-live-acceptance-1",
                        "confirmations": {
                            "maintenanceWindowApproved": True,
                            "healthBaselineCaptured": True,
                            "configDiffReviewed": True,
                            "postReloadSmokePlanDocumented": True,
                            "rollbackOwnerAssigned": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                plan_id = plan_payload["adapterRuntimeReloadPlan"]["planId"]

                execution_response, execution_payload = post_json(
                    "/api/execution/adapter-runtime-reload-executions",
                    {
                        "adapterId": "crypto-live",
                        "planId": plan_id,
                        "operator": "runtime-operator",
                        "executionMode": "manual_controlled_reload",
                        "confirmations": {
                            "preReloadHealthVerified": True,
                            "reloadActionRecorded": True,
                            "postReloadSmokePassed": True,
                            "rollbackReadinessConfirmed": True,
                            "operatorConfirmedLiveBlocked": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                execution_id = execution_payload["adapterRuntimeReloadExecution"]["executionId"]

                missing_execution_response, missing_execution_payload = post_json(
                    "/api/execution/adapter-runtime-reload-acceptances",
                    {
                        "adapterId": "crypto-live",
                        "executionId": "missing-runtime-reload-execution",
                        "operator": "runtime-operator",
                        "confirmations": {},
                    },
                )

                blocked_response, blocked_payload = post_json(
                    "/api/execution/adapter-runtime-reload-acceptances",
                    {
                        "adapterId": "crypto-live",
                        "executionId": execution_id,
                        "operator": "runtime-operator",
                        "acceptanceMode": "manual_runtime_reload_acceptance",
                        "confirmations": {},
                        "metadata": {
                            "source": "settings-panel",
                            "token": "runtime-reload-acceptance-blocked-token-should-not-leak",
                        },
                    },
                )

                recorded_response, recorded_payload = post_json(
                    "/api/execution/adapter-runtime-reload-acceptances",
                    {
                        "adapterId": "crypto-live",
                        "executionId": execution_id,
                        "operator": "runtime-operator",
                        "acceptanceMode": "manual_runtime_reload_acceptance",
                        "confirmations": {
                            "executionEvidenceReviewed": True,
                            "postReloadHealthVerified": True,
                            "adapterHandshakeVerified": True,
                            "killSwitchStillEnabled": True,
                            "operatorConfirmedLiveBlocked": True,
                        },
                        "metadata": {
                            "source": "settings-panel",
                            "privateKey": "runtime-reload-acceptance-private-key-should-not-leak",
                        },
                    },
                )

                connection.request("GET", "/api/execution/adapter-runtime-reload-acceptances?adapterId=crypto-live&limit=5")
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "blocked": blocked_payload,
                "recorded": recorded_payload,
                "history": history_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(reference_response.status, 201)
        self.assertEqual(materialization_response.status, 201)
        self.assertEqual(binding_response.status, 201)
        self.assertEqual(plan_response.status, 201)
        self.assertEqual(execution_response.status, 201)
        self.assertEqual(missing_execution_response.status, 404)
        self.assertEqual(missing_execution_payload["error"], "execution_adapter_runtime_reload_execution_not_found")
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["adapterRuntimeReloadAcceptance"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["adapterRuntimeReloadAcceptance"]["blockedReasons"],
            [
                "runtime_reload_acceptance_execution_evidence_not_reviewed",
                "runtime_reload_acceptance_post_health_missing",
                "runtime_reload_acceptance_adapter_handshake_missing",
                "runtime_reload_acceptance_kill_switch_missing",
                "runtime_reload_acceptance_live_block_boundary_missing",
            ],
        )
        self.assertEqual(recorded_response.status, 201)
        self.assertEqual(recorded_payload["adapterRuntimeReloadAcceptance"]["status"], "acceptance_recorded")
        self.assertEqual(recorded_payload["adapterRuntimeReloadAcceptance"]["executionId"], execution_id)
        self.assertEqual(recorded_payload["adapterRuntimeReloadAcceptance"]["planId"], plan_id)
        self.assertEqual(recorded_payload["adapterRuntimeReloadAcceptance"]["adapterId"], "crypto-live")
        self.assertEqual(recorded_payload["adapterRuntimeReloadAcceptance"]["acceptanceMode"], "manual_runtime_reload_acceptance")
        self.assertEqual(recorded_payload["adapterRuntimeReloadAcceptance"]["requiredEnvVars"], ["CCXT_API_KEY", "CCXT_API_SECRET"])
        self.assertFalse(recorded_payload["adapterRuntimeReloadAcceptance"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["adapterRuntimeReloadAcceptance"]["paperOnly"])
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "execution_adapter_runtime_reload_acceptance")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["adapterRuntimeReloadAcceptances"]), 2)
        self.assertEqual(history_payload["adapterRuntimeReloadAcceptances"][0]["status"], "acceptance_recorded")
        self.assertEqual(history_payload["adapterRuntimeReloadAcceptances"][1]["status"], "blocked")
        self.assertNotIn("runtime-reload-acceptance-blocked-token-should-not-leak", serialized)
        self.assertNotIn("runtime-reload-acceptance-private-key-should-not-leak", serialized)

    def test_execution_adapter_orchestration_dry_run_records_preflight_without_enabling_live(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)

            def post_json(path, payload):
                connection.request(
                    "POST",
                    path,
                    body=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                response = connection.getresponse()
                return response, json.loads(response.read().decode("utf-8"))

            try:
                reference_response, reference_payload = post_json(
                    "/api/execution/adapter-secret-references",
                    {
                        "adapterId": "ibkr-live",
                        "market": "us",
                        "route": "live",
                        "operator": "settings-panel",
                        "referenceName": "ibkr-live/paper-gateway",
                        "backend": "local-secret-store",
                        "requiredEnvVars": ["IBKR_ACCOUNT_ID", "IBKR_GATEWAY_HOST"],
                        "confirmations": {
                            "referenceCreatedOutsideUi": True,
                            "operatorVerifiedFingerprint": True,
                            "rotationPlanDocumented": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                reference_id = reference_payload["adapterSecretReference"]["referenceId"]

                materialization_response, materialization_payload = post_json(
                    "/api/execution/adapter-secret-materializations",
                    {
                        "adapterId": "ibkr-live",
                        "referenceId": reference_id,
                        "operator": "settings-panel",
                        "manifestPath": "local-secret-store://ibkr-live/paper-gateway",
                        "confirmations": {
                            "localSecretStoreWriteVerified": True,
                            "noRawSecretInPayload": True,
                            "envBindingPlanDocumented": True,
                            "rollbackPlanDocumented": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                materialization_id = materialization_payload["adapterSecretMaterialization"]["materializationId"]

                binding_response, binding_payload = post_json(
                    "/api/execution/adapter-environment-bindings",
                    {
                        "adapterId": "ibkr-live",
                        "materializationId": materialization_id,
                        "operator": "settings-panel",
                        "bindingMode": "container_env_reference",
                        "confirmations": {
                            "runtimeEnvMappingVerified": True,
                            "configReloadPlanDocumented": True,
                            "noRawSecretInPayload": True,
                            "rollbackSnapshotRecorded": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                binding_id = binding_payload["adapterEnvironmentBinding"]["bindingId"]

                plan_response, plan_payload = post_json(
                    "/api/execution/adapter-runtime-reload-plans",
                    {
                        "adapterId": "ibkr-live",
                        "bindingId": binding_id,
                        "operator": "runtime-operator",
                        "reloadMode": "manual_container_reload_plan",
                        "maintenanceWindowId": "window-ibkr-orchestration-1",
                        "confirmations": {
                            "maintenanceWindowApproved": True,
                            "healthBaselineCaptured": True,
                            "configDiffReviewed": True,
                            "postReloadSmokePlanDocumented": True,
                            "rollbackOwnerAssigned": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                plan_id = plan_payload["adapterRuntimeReloadPlan"]["planId"]

                execution_response, execution_payload = post_json(
                    "/api/execution/adapter-runtime-reload-executions",
                    {
                        "adapterId": "ibkr-live",
                        "planId": plan_id,
                        "operator": "runtime-operator",
                        "executionMode": "manual_controlled_reload",
                        "confirmations": {
                            "preReloadHealthVerified": True,
                            "reloadActionRecorded": True,
                            "postReloadSmokePassed": True,
                            "rollbackReadinessConfirmed": True,
                            "operatorConfirmedLiveBlocked": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                execution_id = execution_payload["adapterRuntimeReloadExecution"]["executionId"]

                acceptance_response, acceptance_payload = post_json(
                    "/api/execution/adapter-runtime-reload-acceptances",
                    {
                        "adapterId": "ibkr-live",
                        "executionId": execution_id,
                        "operator": "runtime-operator",
                        "acceptanceMode": "manual_runtime_reload_acceptance",
                        "confirmations": {
                            "executionEvidenceReviewed": True,
                            "postReloadHealthVerified": True,
                            "adapterHandshakeVerified": True,
                            "killSwitchStillEnabled": True,
                            "operatorConfirmedLiveBlocked": True,
                        },
                        "metadata": {"source": "settings-panel"},
                    },
                )
                acceptance_id = acceptance_payload["adapterRuntimeReloadAcceptance"]["acceptanceId"]

                missing_acceptance_response, missing_acceptance_payload = post_json(
                    "/api/execution/adapter-orchestration-dry-runs",
                    {
                        "adapterId": "ibkr-live",
                        "acceptanceId": "missing-runtime-reload-acceptance",
                        "operator": "runtime-operator",
                        "confirmations": {},
                    },
                )

                blocked_response, blocked_payload = post_json(
                    "/api/execution/adapter-orchestration-dry-runs",
                    {
                        "adapterId": "ibkr-live",
                        "acceptanceId": acceptance_id,
                        "operator": "runtime-operator",
                        "orchestrationMode": "manual_adapter_orchestration_dry_run",
                        "confirmations": {},
                        "metadata": {
                            "source": "settings-panel",
                            "apiKey": "orchestration-dry-run-blocked-api-key-should-not-leak",
                        },
                    },
                )

                recorded_response, recorded_payload = post_json(
                    "/api/execution/adapter-orchestration-dry-runs",
                    {
                        "adapterId": "ibkr-live",
                        "acceptanceId": acceptance_id,
                        "operator": "runtime-operator",
                        "orchestrationMode": "manual_adapter_orchestration_dry_run",
                        "confirmations": {
                            "acceptedChainReviewed": True,
                            "sandboxHandshakeDryRunPassed": True,
                            "orderSchemaDryRunPassed": True,
                            "accountSyncDryRunPassed": True,
                            "operatorConfirmedNoLiveOrders": True,
                        },
                        "metadata": {
                            "source": "settings-panel",
                            "privateKey": "orchestration-dry-run-private-key-should-not-leak",
                        },
                    },
                )

                connection.request("GET", "/api/execution/adapter-orchestration-dry-runs?adapterId=ibkr-live&limit=5")
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "blocked": blocked_payload,
                "recorded": recorded_payload,
                "history": history_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(reference_response.status, 201)
        self.assertEqual(materialization_response.status, 201)
        self.assertEqual(binding_response.status, 201)
        self.assertEqual(plan_response.status, 201)
        self.assertEqual(execution_response.status, 201)
        self.assertEqual(acceptance_response.status, 201)
        self.assertEqual(missing_acceptance_response.status, 404)
        self.assertEqual(missing_acceptance_payload["error"], "execution_adapter_runtime_reload_acceptance_not_found")
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["adapterOrchestrationDryRun"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["adapterOrchestrationDryRun"]["blockedReasons"],
            [
                "orchestration_dry_run_acceptance_not_reviewed",
                "orchestration_dry_run_sandbox_handshake_missing",
                "orchestration_dry_run_order_schema_missing",
                "orchestration_dry_run_account_sync_missing",
                "orchestration_dry_run_live_order_boundary_missing",
            ],
        )
        self.assertEqual(recorded_response.status, 201)
        self.assertEqual(recorded_payload["adapterOrchestrationDryRun"]["status"], "dry_run_recorded")
        self.assertEqual(recorded_payload["adapterOrchestrationDryRun"]["acceptanceId"], acceptance_id)
        self.assertEqual(recorded_payload["adapterOrchestrationDryRun"]["adapterId"], "ibkr-live")
        self.assertEqual(recorded_payload["adapterOrchestrationDryRun"]["orchestrationMode"], "manual_adapter_orchestration_dry_run")
        self.assertEqual(recorded_payload["adapterOrchestrationDryRun"]["requiredEnvVars"], ["IBKR_ACCOUNT_ID", "IBKR_GATEWAY_HOST"])
        self.assertFalse(recorded_payload["adapterOrchestrationDryRun"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["adapterOrchestrationDryRun"]["paperOnly"])
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "execution_adapter_orchestration_dry_run")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["adapterOrchestrationDryRuns"]), 2)
        self.assertEqual(history_payload["adapterOrchestrationDryRuns"][0]["status"], "dry_run_recorded")
        self.assertEqual(history_payload["adapterOrchestrationDryRuns"][1]["status"], "blocked")
        self.assertNotIn("orchestration-dry-run-blocked-api-key-should-not-leak", serialized)
        self.assertNotIn("orchestration-dry-run-private-key-should-not-leak", serialized)

    def test_cache_refresh_api_fetches_bars_and_returns_updated_settings(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.domain import DataQuality, OHLCVBar

        class RecordingKlineAdapter:
            def __init__(self):
                self.calls = []

            def fetch_ohlcv(self, request, limit=160):
                self.calls.append((request.market, request.symbol, request.timeframe, limit))
                base_timestamp = datetime.now(timezone.utc) - timedelta(days=2)
                bars = [
                    OHLCVBar(
                        market=request.market,
                        symbol=request.symbol,
                        timeframe=request.timeframe,
                        timestamp=base_timestamp + timedelta(days=index),
                        open=10 + index,
                        high=11 + index,
                        low=9 + index,
                        close=10.5 + index,
                        volume=1000 + index,
                    )
                    for index in range(3)
                ]
                return bars, DataQuality(source="test-kline", is_complete=True, warnings=[], rows=len(bars))

        with tempfile.TemporaryDirectory() as tmp:
            adapter = RecordingKlineAdapter()

            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(f"{tmp}/market.sqlite")
                kline_adapter = adapter

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request(
                    "POST",
                    "/api/cache/refresh",
                    body=json.dumps(
                        {
                            "market": "ashare",
                            "symbol": "600000",
                            "timeframe": "1d",
                            "limit": 240,
                        }
                    ).encode("utf-8"),
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
        self.assertEqual(adapter.calls, [("ashare", "600000", "1d", 240)])
        self.assertEqual(payload["refresh"]["upsertedRows"], 3)
        self.assertEqual(payload["refresh"]["quality"]["source"], "test-kline")
        self.assertEqual(payload["settings"]["cache"]["rowCount"], 3)
        self.assertEqual(payload["settings"]["cache"]["contexts"][0]["symbol"], "600000")
        self.assertEqual(payload["settings"]["cache"]["freshnessSummary"]["fresh"], 1)

    def test_watchlist_cache_refresh_api_records_refresh_run(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.cache_refresh_runs import WatchlistCacheRefreshRunStore
        from quant_core.domain import DataQuality, OHLCVBar

        class RecordingKlineAdapter:
            def __init__(self):
                self.calls = []

            def fetch_ohlcv(self, request, limit=160):
                self.calls.append((request.market, request.symbol, request.timeframe, limit))
                base_timestamp = datetime(2026, 5, 25, tzinfo=timezone.utc)
                bars = [
                    OHLCVBar(
                        market=request.market,
                        symbol=request.symbol,
                        timeframe=request.timeframe,
                        timestamp=base_timestamp + timedelta(days=index),
                        open=10 + index,
                        high=11 + index,
                        low=9 + index,
                        close=10.5 + index,
                        volume=1000 + index,
                    )
                    for index in range(2)
                ]
                return bars, DataQuality(source="test-kline", is_complete=True, warnings=[], rows=len(bars))

        with tempfile.TemporaryDirectory() as tmp:
            adapter = RecordingKlineAdapter()

            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(f"{tmp}/market.sqlite")
                watchlist_cache_refresh_store = WatchlistCacheRefreshRunStore(f"{tmp}/watchlist_cache_refreshes.sqlite")
                kline_adapter = adapter

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request(
                    "POST",
                    "/api/cache/watchlist-refreshes",
                    body=json.dumps(
                        {
                            "timeframe": "1d",
                            "limit": 240,
                            "watchlist": [
                                {"market": "ashare", "symbol": "600000", "name": "浦发银行"},
                                {"market": "us", "symbol": "AAPL", "name": "Apple"},
                            ],
                        }
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
                connection.request("GET", "/api/cache/watchlist-refreshes?limit=3")
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 201)
        self.assertEqual(adapter.calls, [("ashare", "600000", "1d", 240), ("us", "AAPL", "1d", 240)])
        self.assertEqual(payload["watchlistRefresh"]["summary"]["totalSymbols"], 2)
        self.assertEqual(payload["watchlistRefresh"]["summary"]["refreshed"], 2)
        self.assertEqual(payload["watchlistRefresh"]["summary"]["failed"], 0)
        self.assertEqual(payload["watchlistRefresh"]["summary"]["upsertedRows"], 4)
        self.assertEqual(payload["watchlistRefresh"]["items"][0]["symbol"], "600000")
        self.assertEqual(payload["watchlistRefresh"]["items"][0]["status"], "refreshed")
        self.assertEqual(payload["settings"]["cache"]["rowCount"], 4)
        self.assertEqual(history_response.status, 200)
        self.assertEqual(history_payload["watchlistRefreshes"][0]["runId"], payload["watchlistRefresh"]["runId"])
        self.assertEqual(history_payload["watchlistRefreshes"][0]["summary"]["refreshed"], 2)

    def test_market_calendar_builds_deterministic_session_status(self):
        from quant_core.market_calendar import build_market_calendar_status

        ashare_open = build_market_calendar_status("ashare", at="2026-06-11T10:00:00+08:00")
        self.assertEqual(ashare_open["market"], "ashare")
        self.assertEqual(ashare_open["timezone"], "Asia/Shanghai")
        self.assertEqual(ashare_open["status"], "open")
        self.assertEqual(ashare_open["session"], "morning")
        self.assertEqual(ashare_open["nextClose"], "2026-06-11T11:30:00+08:00")
        self.assertIsNone(ashare_open["nextOpen"])
        self.assertIn("holiday calendar", ashare_open["warnings"][0])

        ashare_break = build_market_calendar_status("ashare", at="2026-06-11T12:00:00+08:00")
        self.assertEqual(ashare_break["status"], "break")
        self.assertFalse(ashare_break["isOpen"])
        self.assertEqual(ashare_break["session"], "lunch_break")
        self.assertEqual(ashare_break["nextOpen"], "2026-06-11T13:00:00+08:00")

        us_open = build_market_calendar_status("us", at="2026-06-11T10:00:00-04:00")
        self.assertEqual(us_open["timezone"], "America/New_York")
        self.assertEqual(us_open["status"], "open")
        self.assertEqual(us_open["session"], "regular")
        self.assertEqual(us_open["nextClose"], "2026-06-11T16:00:00-04:00")

        crypto = build_market_calendar_status("crypto", at="2026-06-11T10:00:00+08:00")
        self.assertEqual(crypto["timezone"], "UTC")
        self.assertEqual(crypto["status"], "always_open")
        self.assertTrue(crypto["isOpen"])
        self.assertIsNone(crypto["nextOpen"])
        self.assertIsNone(crypto["nextClose"])

    def test_market_calendar_api_returns_status_and_rejects_invalid_market(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler

        server = HTTPServer(("127.0.0.1", 0), QuantApiHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
        try:
            connection.request("GET", "/api/market/calendar?market=ashare&at=2026-06-11T10%3A00%3A00%2B08%3A00")
            response = connection.getresponse()
            payload = json.loads(response.read().decode("utf-8"))
            connection.request("GET", "/api/market/calendar?market=forex")
            invalid_response = connection.getresponse()
            invalid_payload = json.loads(invalid_response.read().decode("utf-8"))
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["calendar"]["market"], "ashare")
        self.assertEqual(payload["calendar"]["status"], "open")
        self.assertEqual(payload["calendar"]["source"], "static-session-template")
        self.assertEqual(invalid_response.status, 400)
        self.assertEqual(invalid_payload["error"], "invalid_market_calendar_request")

    def test_market_klines_api_serves_sqlite_cache_when_adapter_unavailable(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.domain import OHLCVBar

        class OfflineKlineAdapter:
            def fetch_ohlcv(self, request, limit=160):
                raise RuntimeError("upstream offline")

        with tempfile.TemporaryDirectory() as tmp:
            local_cache = MarketDataCache(f"{tmp}/market.sqlite")
            local_cache.upsert_bars(
                [
                    OHLCVBar(
                        market="ashare",
                        symbol="600000",
                        timeframe="1d",
                        timestamp=datetime(2026, 5, 27 + index, tzinfo=timezone.utc),
                        open=9.0 + index,
                        high=9.5 + index,
                        low=8.8 + index,
                        close=9.2 + index,
                        volume=1000 + index,
                    )
                    for index in range(3)
                ]
            )

            class TestHandler(QuantApiHandler):
                cache = local_cache
                kline_adapter = OfflineKlineAdapter()

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/market/klines?market=ashare&symbol=600000&timeframe=1d&limit=2")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["quality"]["source"], "local-cache")
        self.assertTrue(payload["quality"]["isComplete"])
        self.assertEqual(payload["quality"]["rows"], 2)
        self.assertIn("upstream offline", payload["quality"]["warnings"][0])
        self.assertEqual([bar["close"] for bar in payload["bars"]], [10.2, 11.2])

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
        from quant_core.execution import (
            PortfolioPaperOrderStore,
            PaperExecutionStore,
            create_paper_execution_from_audit,
            paper_execution_record_to_payload,
        )
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
            data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 1},
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

    def test_portfolio_paper_order_store_persists_batches_bound_to_base_run(self):
        from quant_core.execution import (
            PortfolioPaperOrderStore,
            create_portfolio_paper_order_batch,
            portfolio_paper_order_batch_to_payload,
        )

        orders = [
            {
                "timestamp": "2026-05-26T08:00:00+00:00",
                "eventType": "portfolio_paper_order",
                "orderId": "portfolio-paper-run-a-sell",
                "symbol": "600000",
                "sourceRunId": "run-a",
                "side": "sell",
                "notionalValue": 6600.0,
                "quantity": 6600.0,
                "status": "pending_review",
                "riskStatus": "review",
                "reason": "Portfolio drift requires operator review.",
            },
            {
                "timestamp": "2026-05-26T08:00:00+00:00",
                "eventType": "portfolio_paper_order",
                "orderId": "portfolio-paper-run-c-hold",
                "symbol": "002415",
                "sourceRunId": "run-c",
                "side": "hold",
                "notionalValue": 0.0,
                "quantity": 0.0,
                "status": "skipped",
                "riskStatus": "passed",
                "reason": "Within rebalance band.",
            },
        ]

        with tempfile.TemporaryDirectory() as tmp:
            store = PortfolioPaperOrderStore(f"{tmp}/portfolio_orders.sqlite")
            batch = create_portfolio_paper_order_batch(
                base_run_id="portfolio-run-001",
                portfolio_name="A-share paper order basket",
                orders=orders,
                created_at=datetime(2026, 5, 26, 8, 30, tzinfo=timezone.utc),
            )
            store.record(batch)
            fetched = store.list_by_base_run("portfolio-run-001")

        payload = portfolio_paper_order_batch_to_payload(fetched[0])
        self.assertEqual(payload["baseRunId"], "portfolio-run-001")
        self.assertEqual(payload["portfolioName"], "A-share paper order basket")
        self.assertEqual(payload["mode"], "portfolio_paper_order_review")
        self.assertEqual(payload["summary"]["totalOrders"], 2)
        self.assertEqual(payload["summary"]["statusCounts"], {"pending_review": 1, "skipped": 1})
        self.assertEqual(payload["summary"]["riskStatusCounts"], {"passed": 1, "review": 1})
        self.assertEqual(payload["orders"][0]["orderId"], "portfolio-paper-run-a-sell")
        self.assertEqual(payload["orders"][1]["status"], "skipped")

    def test_portfolio_paper_order_lifecycle_requires_operator_approval_before_simulation(self):
        from quant_core.execution import (
            build_portfolio_paper_order_lifecycle,
            create_portfolio_paper_order_batch,
        )

        batch = create_portfolio_paper_order_batch(
            base_run_id="portfolio-run-lifecycle",
            portfolio_name="A-share lifecycle basket",
            created_at=datetime(2026, 5, 26, 8, 30, tzinfo=timezone.utc),
            orders=[
                {
                    "timestamp": "2026-05-26T08:00:00+00:00",
                    "eventType": "portfolio_paper_order",
                    "orderId": "order-ready-after-approval",
                    "symbol": "600000",
                    "sourceRunId": "run-a",
                    "side": "buy",
                    "notionalValue": 9200.0,
                    "quantity": 1000.0,
                    "status": "pending_review",
                    "riskStatus": "passed",
                    "reason": "Operator approval required before staging.",
                },
                {
                    "timestamp": "2026-05-26T08:00:00+00:00",
                    "eventType": "portfolio_paper_order",
                    "orderId": "order-risk-blocked",
                    "symbol": "000300",
                    "sourceRunId": "run-b",
                    "side": "sell",
                    "notionalValue": 4600.0,
                    "quantity": 2.0,
                    "status": "rejected",
                    "riskStatus": "blocked",
                    "reason": "Pre-trade risk blocked.",
                },
                {
                    "timestamp": "2026-05-26T08:00:00+00:00",
                    "eventType": "portfolio_paper_order",
                    "orderId": "order-skipped",
                    "symbol": "CASH",
                    "sourceRunId": None,
                    "side": "hold",
                    "notionalValue": 0.0,
                    "quantity": 0.0,
                    "status": "skipped",
                    "riskStatus": "passed",
                    "reason": "No action inside rebalance band.",
                },
            ],
        )

        pending_rows = build_portfolio_paper_order_lifecycle(batch)
        approved_rows = build_portfolio_paper_order_lifecycle(
            batch,
            approvals={
                "order-ready-after-approval": {
                    "approved": True,
                    "reviewer": "operator-a",
                    "reviewedAt": "2026-05-26T08:45:00+00:00",
                    "reason": "Approved for paper simulation only.",
                }
            },
        )

        self.assertEqual([row["state"] for row in pending_rows], ["awaiting_operator_review", "risk_rejected", "skipped"])
        self.assertFalse(any(row["routable"] for row in pending_rows))
        self.assertEqual(approved_rows[0]["state"], "ready_for_simulation")
        self.assertTrue(approved_rows[0]["routable"])
        self.assertEqual(approved_rows[0]["approvedBy"], "operator-a")
        self.assertTrue(approved_rows[0]["paperOnly"])
        self.assertTrue(approved_rows[0]["liveExecutionBlocked"])
        self.assertEqual(approved_rows[1]["state"], "risk_rejected")
        self.assertEqual(approved_rows[2]["state"], "skipped")

    def test_ai_review_run_store_persists_records_bound_to_research_run(self):
        from quant_core.ai_review_runs import AiReviewRunStore, ai_review_run_record_to_payload

        review_record = {
            "schemaVersion": 1,
            "recordType": "aiqt.aiReviewRun",
            "aiReviewId": "ai-review:run-ai-store:rev-ai-store",
            "runId": "run-ai-store",
            "createdAt": "2026-05-26T08:05:00+00:00",
            "market": "ashare",
            "symbol": "600000",
            "timeframe": "1d",
            "strategyRevision": "rev-ai-store",
            "executionMode": "paper_only",
            "status": "ready",
            "summary": {
                "citationCount": 7,
                "roundCount": 5,
                "decisionCount": 2,
                "parameterScanBound": True,
                "liveExecutionBlocked": True,
            },
            "dossier": {"status": "ready", "headline": "AI review bound", "summary": "Evidence only", "citations": []},
            "citations": [{"id": "parameter-scan", "label": "Parameter scan", "value": "SMA5", "detail": "re-audit", "tone": "warning"}],
            "rounds": [{"id": "risk-manager", "phase": "risk", "agent": "Risk Manager", "verdict": "risk"}],
            "decisionLog": [{"agent": "Risk", "message": "Live routing blocked.", "tone": "risk"}],
            "boundary": "Evidence explanation only; no buy/sell instructions or guaranteed returns.",
        }

        with tempfile.TemporaryDirectory() as tmp:
            store = AiReviewRunStore(f"{tmp}/ai_reviews.sqlite")
            stored = store.record(review_record)
            fetched = store.list_by_run("run-ai-store")

        self.assertEqual(stored.ai_review_id, "ai-review:run-ai-store:rev-ai-store")
        self.assertEqual(len(fetched), 1)
        payload = ai_review_run_record_to_payload(fetched[0])
        self.assertEqual(payload["runId"], "run-ai-store")
        self.assertEqual(payload["record"]["recordType"], "aiqt.aiReviewRun")
        self.assertEqual(payload["record"]["summary"]["parameterScanBound"], True)
        self.assertEqual(payload["record"]["boundary"], "Evidence explanation only; no buy/sell instructions or guaranteed returns.")

    def test_ai_review_run_store_pages_and_searches_records_bound_to_run(self):
        from quant_core.ai_review_runs import AiReviewRunStore

        def review_record(revision: str, created_at: str, headline: str) -> dict:
            return {
                "schemaVersion": 1,
                "recordType": "aiqt.aiReviewRun",
                "aiReviewId": f"ai-review:run-ai-page:{revision}",
                "runId": "run-ai-page",
                "createdAt": created_at,
                "market": "ashare",
                "symbol": "600000",
                "timeframe": "1d",
                "strategyRevision": revision,
                "executionMode": "paper_only",
                "status": "ready",
                "summary": {
                    "citationCount": 1,
                    "roundCount": 1,
                    "decisionCount": 1,
                    "parameterScanBound": False,
                    "liveExecutionBlocked": True,
                },
                "dossier": {"status": "ready", "headline": headline, "summary": "Evidence only", "citations": []},
                "citations": [],
                "rounds": [],
                "decisionLog": [],
                "boundary": "Evidence explanation only; no buy/sell instructions or guaranteed returns.",
            }

        with tempfile.TemporaryDirectory() as tmp:
            store = AiReviewRunStore(f"{tmp}/ai_reviews.sqlite")
            store.record(review_record("rev-old", "2026-05-26T08:01:00+00:00", "Old review"))
            store.record(review_record("rev-mid", "2026-05-26T08:02:00+00:00", "Risk review"))
            store.record(review_record("rev-new", "2026-05-26T08:03:00+00:00", "Latest review"))
            page = store.list_by_run("run-ai-page", limit=1, offset=1)
            filtered = store.list_by_run("run-ai-page", query="risk")
            total = store.count_by_run("run-ai-page")
            filtered_total = store.count_by_run("run-ai-page", query="risk")

        self.assertEqual([record.ai_review_id for record in page], ["ai-review:run-ai-page:rev-mid"])
        self.assertEqual([record.ai_review_id for record in filtered], ["ai-review:run-ai-page:rev-mid"])
        self.assertEqual(total, 3)
        self.assertEqual(filtered_total, 1)

    def test_audit_event_store_persists_searchable_import_events(self):
        from quant_core.audit_events import AuditEventStore, audit_event_record_to_payload

        event = {
            "schemaVersion": 1,
            "eventId": "audit-import-run-ledger-blocked",
            "eventType": "research_run_import",
            "runId": "run-ledger",
            "createdAt": "2026-06-03T09:10:00+00:00",
            "stage": "blocked",
            "source": "web",
            "summary": "Import preview blocked",
            "detail": "Import preview found blocked preflight gates. 1 blocked · 2 changes.",
            "metadata": {
                "fileName": "unsafe-import.json",
                "blockedCount": 1,
                "changeCount": 2,
                "exportPath": "manifest:run-ledger",
                "tone": "risk",
            },
        }

        with tempfile.TemporaryDirectory() as tmp:
            store = AuditEventStore(f"{tmp}/audit-events.sqlite")
            stored = store.record(event)
            by_run = store.list_recent(run_id="run-ledger", event_type="research_run_import")
            filtered = store.list_recent(event_type="research_run_import", query="unsafe-import")
            total = store.count(event_type="research_run_import", query="unsafe-import")

        payload = audit_event_record_to_payload(stored)
        self.assertEqual(payload["eventId"], "audit-import-run-ledger-blocked")
        self.assertEqual(payload["runId"], "run-ledger")
        self.assertEqual(payload["stage"], "blocked")
        self.assertEqual(payload["metadata"]["blockedCount"], 1)
        self.assertEqual([record.event_id for record in by_run], ["audit-import-run-ledger-blocked"])
        self.assertEqual([record.event_id for record in filtered], ["audit-import-run-ledger-blocked"])
        self.assertEqual(total, 1)

    def test_audit_event_store_filters_comma_separated_report_event_types(self):
        from quant_core.audit_events import AuditEventStore

        base_event = {
            "schemaVersion": 1,
            "runId": "run-report-ledger",
            "createdAt": "2026-06-05T09:12:00+00:00",
            "stage": "generated",
            "source": "web",
            "summary": "Report generated",
            "detail": "report detail",
            "metadata": {"contentSha256": "a" * 64},
        }
        events = [
            {**base_event, "eventId": "audit-report-ledger", "eventType": "audit_evidence_report"},
            {
                **base_event,
                "eventId": "backtest-report-ledger",
                "eventType": "backtest_report",
                "createdAt": "2026-06-05T09:13:00+00:00",
            },
            {
                **base_event,
                "eventId": "import-ledger",
                "eventType": "research_run_import",
                "createdAt": "2026-06-05T09:14:00+00:00",
            },
        ]

        with tempfile.TemporaryDirectory() as tmp:
            store = AuditEventStore(f"{tmp}/audit-events.sqlite")
            for event in events:
                store.record(event)
            report_events = store.list_recent(event_type="audit_evidence_report,backtest_report")
            total = store.count(event_type="audit_evidence_report,backtest_report")

        self.assertEqual([record.event_id for record in report_events], ["backtest-report-ledger", "audit-report-ledger"])
        self.assertEqual(total, 2)

    def test_audit_event_api_records_and_lists_import_events(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        event = {
            "schemaVersion": 1,
            "eventId": "audit-import-run-api-confirmed",
            "eventType": "research_run_import",
            "runId": "run-api-ledger",
            "createdAt": "2026-06-03T09:12:00+00:00",
            "stage": "confirmed",
            "source": "web",
            "summary": "Import applied",
            "detail": "Research run import wrote to the local audit store. 0 blocked · 2 changes.",
            "metadata": {
                "fileName": "safe-import.json",
                "blockedCount": 0,
                "changeCount": 2,
                "exportPath": "manifest:run-api-ledger",
                "tone": "positive",
            },
        }

        with tempfile.TemporaryDirectory() as tmp:
            audit_event_store = AuditEventStore(f"{tmp}/audit-events.sqlite")

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.audit_event_store = audit_event_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                body = json.dumps(event).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/events",
                    body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                response = connection.getresponse()
                saved_payload = json.loads(response.read().decode("utf-8"))
                connection.request(
                    "GET",
                    "/api/audit/events?eventType=research_run_import&runId=run-api-ledger&query=safe-import",
                )
                list_response = connection.getresponse()
                list_payload = json.loads(list_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 201)
        self.assertEqual(saved_payload["event"]["eventId"], "audit-import-run-api-confirmed")
        self.assertEqual(list_response.status, 200)
        self.assertEqual(list_payload["events"][0]["eventId"], "audit-import-run-api-confirmed")
        self.assertEqual(list_payload["events"][0]["metadata"]["fileName"], "safe-import.json")
        self.assertEqual(list_payload["pagination"], {"limit": 20, "offset": 0, "total": 1, "query": "safe-import"})

    def test_audit_report_sign_and_verify_api_updates_signature_metadata(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        event = {
            "schemaVersion": 1,
            "eventId": "audit-report-api-signable",
            "eventType": "audit_evidence_report",
            "runId": "run-api-report",
            "createdAt": "2026-06-04T09:20:00+00:00",
            "stage": "generated",
            "source": "web",
            "summary": "Audit evidence report generated for run-api-report",
            "detail": "run-api-report-audit-evidence-report.md · sha256 ffffff · focus manifest:run-api-report",
            "metadata": {
                "artifactKind": "aiqt.auditReport",
                "fileName": "run-api-report-audit-evidence-report.md",
                "contentSha256": "f" * 64,
                "contentSha256Algorithm": "sha256",
                "evidenceFocus": "manifest:run-api-report",
            },
        }

        with tempfile.TemporaryDirectory() as tmp:
            audit_event_store = AuditEventStore(f"{tmp}/audit-events.sqlite")
            audit_event_store.record(event)

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.audit_event_store = audit_event_store
            TestHandler.audit_signing_secret = "unit-test-audit-secret"
            TestHandler.audit_signing_key_id = "unit-test-key"
            TestHandler.audit_signer_name = "Unit Test Audit Key"

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                sign_body = json.dumps({"eventId": "audit-report-api-signable"}).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/reports/sign",
                    body=sign_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(sign_body))},
                )
                sign_response = connection.getresponse()
                sign_payload = json.loads(sign_response.read().decode("utf-8"))

                verify_body = json.dumps({"eventId": "audit-report-api-signable"}).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/reports/verify",
                    body=verify_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(verify_body))},
                )
                verify_response = connection.getresponse()
                verify_payload = json.loads(verify_response.read().decode("utf-8"))

                revoke_body = json.dumps(
                    {
                        "eventId": "audit-report-api-signable",
                        "reason": "superseded by corrected evidence package",
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/reports/revoke",
                    body=revoke_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(revoke_body))},
                )
                revoke_response = connection.getresponse()
                revoke_payload = json.loads(revoke_response.read().decode("utf-8"))

                connection.request(
                    "POST",
                    "/api/audit/reports/verify",
                    body=verify_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(verify_body))},
                )
                revoked_verify_response = connection.getresponse()
                revoked_verify_payload = json.loads(revoked_verify_response.read().decode("utf-8"))

                tampered = {
                    **event,
                    "metadata": {
                        **event["metadata"],
                        "contentSha256": "e" * 64,
                        "signature": sign_payload.get("signature", {}),
                    },
                }
                audit_event_store.record(tampered)
                connection.request(
                    "POST",
                    "/api/audit/reports/verify",
                    body=verify_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(verify_body))},
                )
                tampered_response = connection.getresponse()
                tampered_payload = json.loads(tampered_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(sign_response.status, 200)
        self.assertEqual(sign_payload["signature"]["status"], "verified")
        self.assertEqual(sign_payload["signature"]["algorithm"], "hmac-sha256")
        self.assertEqual(sign_payload["signature"]["keyId"], "unit-test-key")
        self.assertEqual(sign_payload["signature"]["signer"], "Unit Test Audit Key")
        self.assertEqual(sign_payload["verification"]["status"], "verified")
        self.assertRegex(sign_payload["signature"]["value"], r"^[a-f0-9]{64}$")
        self.assertEqual(sign_payload["event"]["metadata"]["signature"]["status"], "verified")
        self.assertEqual(verify_response.status, 200)
        self.assertEqual(verify_payload["verification"]["status"], "verified")
        self.assertEqual(revoke_response.status, 200)
        self.assertEqual(revoke_payload["signature"]["status"], "revoked")
        self.assertEqual(revoke_payload["signature"]["revokedReason"], "superseded by corrected evidence package")
        self.assertRegex(revoke_payload["signature"]["revokedAt"], r"^\d{4}-\d{2}-\d{2}T")
        self.assertEqual(revoked_verify_response.status, 409)
        self.assertEqual(revoked_verify_payload["verification"]["status"], "invalid")
        self.assertEqual(revoked_verify_payload["verification"]["reason"], "signature_revoked")
        self.assertEqual(tampered_response.status, 409)
        self.assertEqual(tampered_payload["verification"]["status"], "invalid")
        self.assertEqual(tampered_payload["verification"]["reason"], "signature_mismatch")

    def test_audit_report_sign_api_rejects_invalid_import_verification_evidence(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        event = {
            "schemaVersion": 1,
            "eventId": "audit-report-api-invalid-import-verification",
            "eventType": "audit_evidence_report",
            "runId": "run-api-report-invalid-import-verification",
            "createdAt": "2026-06-04T09:20:00+00:00",
            "stage": "generated",
            "source": "web",
            "summary": "Audit evidence report generated with invalid imported evidence",
            "detail": "run-api-report-invalid-import-verification.md · sha256 dddddd · import verification failed",
            "metadata": {
                "artifactKind": "aiqt.auditReport",
                "fileName": "run-api-report-invalid-import-verification.md",
                "contentSha256": "d" * 64,
                "contentSha256Algorithm": "sha256",
                "evidenceFocus": "manifest:run-api-report-invalid-import-verification",
                "importVerificationInvalid": 1,
                "importVerificationVerified": 0,
                "importVerificationLatestReason": "signature_mismatch",
                "importVerificationLatestSource": "local-core",
            },
        }

        with tempfile.TemporaryDirectory() as tmp:
            audit_event_store = AuditEventStore(f"{tmp}/audit-events.sqlite")
            audit_event_store.record(event)

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.audit_event_store = audit_event_store
            TestHandler.audit_signing_secret = "unit-test-audit-secret"
            TestHandler.audit_signing_key_id = "unit-test-key"
            TestHandler.audit_signer_name = "Unit Test Audit Key"

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                sign_body = json.dumps({"eventId": "audit-report-api-invalid-import-verification"}).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/reports/sign",
                    body=sign_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(sign_body))},
                )
                sign_response = connection.getresponse()
                sign_payload = json.loads(sign_response.read().decode("utf-8"))
                saved_event = audit_event_store.get("audit-report-api-invalid-import-verification")
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(sign_response.status, 409)
        self.assertEqual(sign_payload["error"], "invalid_audit_report_signature")
        self.assertEqual(sign_payload["detail"], "audit_report_import_verification_invalid")
        self.assertIsNotNone(saved_event)
        self.assertNotIn("signature", saved_event.metadata)

    def test_backtest_report_sign_and_verify_api_updates_signature_metadata(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        event = {
            "schemaVersion": 1,
            "eventId": "backtest-report-api-signable",
            "eventType": "backtest_report",
            "runId": "run-api-backtest-report",
            "createdAt": "2026-06-05T09:20:00+00:00",
            "stage": "generated",
            "source": "web",
            "summary": "Backtest Markdown report generated for run-api-backtest-report",
            "detail": "run-api-backtest-report-backtest-report.md · sha256 cccccc · 3 comparable runs",
            "metadata": {
                "artifactKind": "aiqt.backtestReport",
                "fileName": "run-api-backtest-report-backtest-report.md",
                "contentSha256": "c" * 64,
                "contentSha256Algorithm": "sha256",
                "format": "text/markdown",
                "market": "ashare",
                "symbol": "600000",
                "timeframe": "1d",
                "strategyRevision": "rev-backtest-report",
                "dataRows": 240,
                "runComparisonRows": 3,
            },
        }

        with tempfile.TemporaryDirectory() as tmp:
            audit_event_store = AuditEventStore(f"{tmp}/audit-events.sqlite")
            audit_event_store.record(event)

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.audit_event_store = audit_event_store
            TestHandler.audit_signing_secret = "unit-test-audit-secret"
            TestHandler.audit_signing_key_id = "unit-test-key"
            TestHandler.audit_signer_name = "Unit Test Audit Key"

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                sign_body = json.dumps({"eventId": "backtest-report-api-signable"}).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/reports/sign",
                    body=sign_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(sign_body))},
                )
                sign_response = connection.getresponse()
                sign_payload = json.loads(sign_response.read().decode("utf-8"))

                verify_body = json.dumps({"eventId": "backtest-report-api-signable"}).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/reports/verify",
                    body=verify_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(verify_body))},
                )
                verify_response = connection.getresponse()
                verify_payload = json.loads(verify_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(sign_response.status, 200)
        self.assertEqual(sign_payload["event"]["eventType"], "backtest_report")
        self.assertEqual(sign_payload["event"]["metadata"]["artifactKind"], "aiqt.backtestReport")
        self.assertEqual(sign_payload["signature"]["status"], "verified")
        self.assertEqual(sign_payload["signature"]["algorithm"], "hmac-sha256")
        self.assertEqual(sign_payload["signature"]["keyId"], "unit-test-key")
        self.assertRegex(sign_payload["signature"]["value"], r"^[a-f0-9]{64}$")
        self.assertEqual(verify_response.status, 200)
        self.assertEqual(verify_payload["verification"]["status"], "verified")
        self.assertEqual(verify_payload["event"]["metadata"]["signature"]["status"], "verified")

    def test_portfolio_report_sign_and_verify_api_updates_signature_metadata(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        event = {
            "schemaVersion": 1,
            "eventId": "portfolio-report-api-signable",
            "eventType": "portfolio_report",
            "runId": "run-api-portfolio-report",
            "createdAt": "2026-06-06T10:20:00+00:00",
            "stage": "generated",
            "source": "web",
            "summary": "Portfolio Markdown report generated for ashare 1d audited basket",
            "detail": "run-api-portfolio-report-ashare-1d-portfolio-report.md · sha256 dddddd · 2 legs · 4 diagnostics",
            "metadata": {
                "artifactKind": "aiqt.portfolioReport",
                "fileName": "run-api-portfolio-report-ashare-1d-portfolio-report.md",
                "contentSha256": "d" * 64,
                "contentSha256Algorithm": "sha256",
                "format": "text/markdown",
                "market": "ashare",
                "timeframe": "1d",
                "portfolioName": "ashare 1d audited basket",
                "initialCash": 100000,
                "cashWeight": 0.1,
                "legCount": 2,
                "equityRows": 240,
                "diagnosticsCount": 4,
                "negativeContributionLegs": 1,
                "incompleteDataQuality": False,
            },
        }

        with tempfile.TemporaryDirectory() as tmp:
            audit_event_store = AuditEventStore(f"{tmp}/audit-events.sqlite")
            audit_event_store.record(event)

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.audit_event_store = audit_event_store
            TestHandler.audit_signing_secret = "unit-test-audit-secret"
            TestHandler.audit_signing_key_id = "unit-test-key"
            TestHandler.audit_signer_name = "Unit Test Audit Key"

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                sign_body = json.dumps({"eventId": "portfolio-report-api-signable"}).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/reports/sign",
                    body=sign_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(sign_body))},
                )
                sign_response = connection.getresponse()
                sign_payload = json.loads(sign_response.read().decode("utf-8"))

                verify_body = json.dumps({"eventId": "portfolio-report-api-signable"}).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/reports/verify",
                    body=verify_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(verify_body))},
                )
                verify_response = connection.getresponse()
                verify_payload = json.loads(verify_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(sign_response.status, 200)
        self.assertEqual(sign_payload["event"]["eventType"], "portfolio_report")
        self.assertEqual(sign_payload["event"]["metadata"]["artifactKind"], "aiqt.portfolioReport")
        self.assertEqual(sign_payload["signature"]["status"], "verified")
        self.assertEqual(sign_payload["signature"]["algorithm"], "hmac-sha256")
        self.assertEqual(sign_payload["signature"]["keyId"], "unit-test-key")
        self.assertRegex(sign_payload["signature"]["value"], r"^[a-f0-9]{64}$")
        self.assertEqual(verify_response.status, 200)
        self.assertEqual(verify_payload["verification"]["status"], "verified")
        self.assertEqual(verify_payload["event"]["metadata"]["signature"]["status"], "verified")

    def test_package_report_signature_verify_api_checks_external_artifact_without_recording(self):
        import hashlib
        import hmac
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        secret = "unit-test-audit-secret"
        event_id = "audit-report-package-external"
        run_id = "run-package-report"
        file_name = "run-package-report-audit-evidence-report.md"
        content_sha256 = "a" * 64
        message = "\n".join(
            [
                "aiqt.auditReport.v1",
                event_id,
                run_id,
                "aiqt.auditReport",
                file_name,
                content_sha256,
            ]
        )
        signature_value = hmac.new(secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()
        report = {
            "kind": "aiqt.auditReport",
            "schemaVersion": 1,
            "runId": run_id,
            "generatedAt": "2026-06-05T10:00:00+00:00",
            "format": "text/markdown",
            "fileName": file_name,
            "contentSha256": {"algorithm": "sha256", "hash": content_sha256},
            "contentMarkdown": "# external report",
            "signature": {
                "eventId": event_id,
                "status": "signed",
                "algorithm": "hmac-sha256",
                "chainId": "audit-chain-local",
                "keyId": "unit-test-key",
                "signedAt": "2026-06-05T10:00:00+00:00",
                "signer": "Unit Test Audit Key",
                "value": signature_value,
            },
        }

        with tempfile.TemporaryDirectory() as tmp:
            audit_event_store = AuditEventStore(f"{tmp}/audit-events.sqlite")

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.audit_event_store = audit_event_store
            TestHandler.audit_signing_secret = secret
            TestHandler.audit_signing_key_id = "unit-test-key"
            TestHandler.audit_signer_name = "Unit Test Audit Key"
            TestHandler.audit_chain_id = "audit-chain-local"

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                verify_body = json.dumps({"report": report}).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/reports/verify-package",
                    body=verify_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(verify_body))},
                )
                verify_response = connection.getresponse()
                verify_payload = json.loads(verify_response.read().decode("utf-8"))

                tampered_report = {
                    **report,
                    "contentSha256": {"algorithm": "sha256", "hash": "b" * 64},
                }
                tampered_body = json.dumps({"report": tampered_report}).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/reports/verify-package",
                    body=tampered_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(tampered_body))},
                )
                tampered_response = connection.getresponse()
                tampered_payload = json.loads(tampered_response.read().decode("utf-8"))
                recorded_package_event = audit_event_store.get(event_id)
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(verify_response.status, 200)
        self.assertEqual(verify_payload["event"]["eventId"], event_id)
        self.assertEqual(verify_payload["event"]["eventType"], "audit_evidence_report")
        self.assertEqual(verify_payload["event"]["metadata"]["artifactKind"], "aiqt.auditReport")
        self.assertEqual(verify_payload["signature"]["status"], "verified")
        self.assertEqual(verify_payload["signature"]["eventId"], event_id)
        self.assertEqual(verify_payload["verification"], {"status": "verified", "reason": "signature_verified"})
        self.assertIsNone(recorded_package_event)
        self.assertEqual(tampered_response.status, 409)
        self.assertEqual(tampered_payload["verification"], {"status": "invalid", "reason": "signature_mismatch"})

    def test_portfolio_package_report_signature_verify_api_checks_external_artifact(self):
        import hashlib
        import hmac
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        secret = "unit-test-audit-secret"
        event_id = "portfolio-report-package-external"
        run_id = "portfolio-run-package-report"
        file_name = "portfolio-run-package-report.md"
        content_sha256 = "c" * 64
        message = "\n".join(
            [
                "aiqt.auditReport.v1",
                event_id,
                run_id,
                "aiqt.portfolioReport",
                file_name,
                content_sha256,
            ]
        )
        signature_value = hmac.new(secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()
        report = {
            "kind": "aiqt.portfolioReport",
            "schemaVersion": 1,
            "runId": run_id,
            "generatedAt": "2026-06-05T10:00:00+00:00",
            "format": "text/markdown",
            "fileName": file_name,
            "contentSha256": {"algorithm": "sha256", "hash": content_sha256},
            "contentMarkdown": "# external portfolio report",
            "signature": {
                "eventId": event_id,
                "status": "signed",
                "algorithm": "hmac-sha256",
                "chainId": "audit-chain-local",
                "keyId": "unit-test-key",
                "signedAt": "2026-06-05T10:00:00+00:00",
                "signer": "Unit Test Audit Key",
                "value": signature_value,
            },
        }

        with tempfile.TemporaryDirectory() as tmp:
            audit_event_store = AuditEventStore(f"{tmp}/audit-events.sqlite")

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.audit_event_store = audit_event_store
            TestHandler.audit_signing_secret = secret
            TestHandler.audit_signing_key_id = "unit-test-key"
            TestHandler.audit_signer_name = "Unit Test Audit Key"
            TestHandler.audit_chain_id = "audit-chain-local"

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                verify_body = json.dumps({"report": report}).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/reports/verify-package",
                    body=verify_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(verify_body))},
                )
                verify_response = connection.getresponse()
                verify_payload = json.loads(verify_response.read().decode("utf-8"))
                recorded_package_event = audit_event_store.get(event_id)
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(verify_response.status, 200)
        self.assertEqual(verify_payload["event"]["eventId"], event_id)
        self.assertEqual(verify_payload["event"]["eventType"], "portfolio_report")
        self.assertEqual(verify_payload["event"]["metadata"]["artifactKind"], "aiqt.portfolioReport")
        self.assertEqual(verify_payload["signature"]["status"], "verified")
        self.assertEqual(verify_payload["signature"]["eventId"], event_id)
        self.assertEqual(verify_payload["verification"], {"status": "verified", "reason": "signature_verified"})
        self.assertIsNone(recorded_package_event)

    def test_audit_signing_key_registry_lists_active_and_verifies_legacy_key(self):
        import hashlib
        import hmac
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        def signature_value(secret: str, event_id: str, run_id: str, file_name: str, content_sha256: str) -> str:
            message = "\n".join(
                [
                    "aiqt.auditReport.v1",
                    event_id,
                    run_id,
                    "aiqt.auditReport",
                    file_name,
                    content_sha256,
                ]
            )
            return hmac.new(secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()

        content_sha256 = "d" * 64
        event = {
            "schemaVersion": 1,
            "eventId": "audit-report-api-legacy-key",
            "eventType": "audit_evidence_report",
            "runId": "run-legacy-key",
            "createdAt": "2026-06-04T09:40:00+00:00",
            "stage": "generated",
            "source": "web",
            "summary": "Audit evidence report generated for run-legacy-key",
            "detail": "run-legacy-key-audit-evidence-report.md · sha256 dddddd",
            "metadata": {
                "artifactKind": "aiqt.auditReport",
                "fileName": "run-legacy-key-audit-evidence-report.md",
                "contentSha256": content_sha256,
                "signature": {
                    "algorithm": "hmac-sha256",
                    "chainId": "audit-chain-legacy",
                    "keyId": "legacy-audit-key",
                    "signer": "Legacy Audit Key",
                    "status": "verified",
                    "value": signature_value(
                        "legacy-audit-secret",
                        "audit-report-api-legacy-key",
                        "run-legacy-key",
                        "run-legacy-key-audit-evidence-report.md",
                        content_sha256,
                    ),
                },
            },
        }

        with tempfile.TemporaryDirectory() as tmp:
            audit_event_store = AuditEventStore(f"{tmp}/audit-events.sqlite")
            audit_event_store.record(event)

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.audit_event_store = audit_event_store
            TestHandler.audit_signing_secret = "active-audit-secret"
            TestHandler.audit_signing_key_id = "active-audit-key"
            TestHandler.audit_signer_name = "Active Audit Key"
            TestHandler.audit_chain_id = "audit-chain-active"
            TestHandler.audit_signing_keys_json = json.dumps(
                [
                    {
                        "keyId": "legacy-audit-key",
                        "signer": "Legacy Audit Key",
                        "secret": "legacy-audit-secret",
                        "chainId": "audit-chain-legacy",
                        "status": "retired",
                        "createdAt": "2026-05-01T00:00:00+00:00",
                        "retiredAt": "2026-06-01T00:00:00+00:00",
                    }
                ]
            )

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/audit/signing-keys")
                registry_response = connection.getresponse()
                registry_payload = json.loads(registry_response.read().decode("utf-8"))

                verify_body = json.dumps({"eventId": "audit-report-api-legacy-key"}).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/reports/verify",
                    body=verify_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(verify_body))},
                )
                verify_response = connection.getresponse()
                verify_payload = json.loads(verify_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(registry_response.status, 200)
        self.assertEqual(registry_payload["registry"]["activeKeyId"], "active-audit-key")
        self.assertEqual([key["keyId"] for key in registry_payload["registry"]["keys"]], ["active-audit-key", "legacy-audit-key"])
        self.assertEqual(registry_payload["registry"]["keys"][0]["status"], "active")
        self.assertEqual(registry_payload["registry"]["keys"][1]["status"], "retired")
        self.assertRegex(registry_payload["registry"]["keys"][0]["fingerprint"], r"^[a-f0-9]{16}$")
        self.assertNotIn("active-audit-secret", json.dumps(registry_payload))
        self.assertNotIn("legacy-audit-secret", json.dumps(registry_payload))
        self.assertEqual(verify_response.status, 200)
        self.assertEqual(verify_payload["verification"]["status"], "verified")
        self.assertEqual(verify_payload["signature"]["keyId"], "legacy-audit-key")

    def test_audit_signing_key_rotation_plan_preserves_legacy_verification_without_leaking_secret(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler

        with tempfile.TemporaryDirectory():
            class TestHandler(QuantApiHandler):
                pass

            TestHandler.audit_signing_secret = "active-audit-secret"
            TestHandler.audit_signing_key_id = "active-audit-key"
            TestHandler.audit_signer_name = "Active Audit Key"
            TestHandler.audit_chain_id = "audit-chain-active"
            TestHandler.audit_signing_keys_json = json.dumps(
                [
                    {
                        "keyId": "legacy-audit-key",
                        "signer": "Legacy Audit Key",
                        "secret": "legacy-audit-secret",
                        "chainId": "audit-chain-legacy",
                        "status": "retired",
                    }
                ]
            )

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                body = json.dumps(
                    {
                        "proposedKeyId": "next-audit-key",
                        "proposedSigner": "Next Audit Key",
                        "proposedChainId": "audit-chain-next",
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/rotation-plan",
                    body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["rotationPlan"]["schemaVersion"], 1)
        self.assertEqual(payload["rotationPlan"]["currentActiveKey"]["keyId"], "active-audit-key")
        self.assertRegex(payload["rotationPlan"]["currentActiveKey"]["fingerprint"], r"^[a-f0-9]{16}$")
        self.assertEqual(payload["rotationPlan"]["proposedActiveKey"]["keyId"], "next-audit-key")
        self.assertEqual(payload["rotationPlan"]["proposedActiveKey"]["chainId"], "audit-chain-next")
        self.assertEqual(
            [item["name"] for item in payload["rotationPlan"]["environmentUpdates"]],
            [
                "AIQT_AUDIT_SIGNING_KEY_ID",
                "AIQT_AUDIT_SIGNER_NAME",
                "AIQT_AUDIT_CHAIN_ID",
                "AIQT_AUDIT_SIGNING_SECRET",
                "AIQT_AUDIT_SIGNING_KEYS_JSON",
            ],
        )
        self.assertIn("active-audit-key", payload["rotationPlan"]["legacyRegistryTemplate"])
        self.assertIn("<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>", payload["rotationPlan"]["legacyRegistryTemplate"])
        self.assertIn("verify-legacy-reports", [step["id"] for step in payload["rotationPlan"]["steps"]])
        self.assertNotIn("active-audit-secret", json.dumps(payload))
        self.assertNotIn("legacy-audit-secret", json.dumps(payload))

    def test_audit_signing_key_secret_materialization_records_manifest_without_leaking_secret(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            TestHandler.audit_signing_secret = "active-audit-secret"
            TestHandler.audit_signing_key_id = "active-audit-key"
            TestHandler.audit_signer_name = "Active Audit Key"
            TestHandler.audit_chain_id = "audit-chain-active"

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                plan_body = json.dumps(
                    {
                        "proposedKeyId": "next-audit-key",
                        "proposedSigner": "Next Audit Key",
                        "proposedChainId": "audit-chain-next",
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/rotation-plan",
                    body=plan_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(plan_body))},
                )
                plan_response = connection.getresponse()
                plan_payload = json.loads(plan_response.read().decode("utf-8"))
                rotation_plan = plan_payload["rotationPlan"]
                plan_event_id = "audit-signing-key-rotation-next-audit-key-test"
                TestHandler.audit_event_store.record(
                    {
                        "schemaVersion": 1,
                        "eventId": plan_event_id,
                        "eventType": "audit_signing_key_rotation_plan",
                        "runId": "audit-signing-key-rotation",
                        "createdAt": rotation_plan["generatedAt"],
                        "stage": "prepared",
                        "source": "unit-test",
                        "summary": "Audit signing key rotation plan prepared for next-audit-key",
                        "detail": "active-audit-key -> next-audit-key",
                        "metadata": {
                            "currentKeyId": rotation_plan["currentActiveKey"]["keyId"],
                            "currentKeyFingerprint": rotation_plan["currentActiveKey"]["fingerprint"],
                            "proposedKeyId": rotation_plan["proposedActiveKey"]["keyId"],
                            "proposedSigner": rotation_plan["proposedActiveKey"]["signer"],
                            "proposedChainId": rotation_plan["proposedActiveKey"]["chainId"],
                            "requiresRestart": rotation_plan["requiresRestart"],
                            "environmentUpdateNames": [
                                item["name"] for item in rotation_plan["environmentUpdates"]
                            ],
                            "secretPlaceholderNames": [
                                item["name"]
                                for item in rotation_plan["environmentUpdates"]
                                if item["sensitivity"] == "secret"
                            ],
                            "blockedReasons": [],
                        },
                    }
                )

                blocked_request = {
                    "planEventId": plan_event_id,
                    "operator": "audit-operator",
                    "backend": "local-secret-store",
                    "manifestPath": "local-secret-store://audit-signing/next-audit-key",
                    "confirmations": {},
                    "metadata": {
                        "source": "audit-panel",
                        "secret": "blocked-secret-should-not-leak",
                    },
                }
                blocked_body = json.dumps(blocked_request).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/secret-materializations",
                    body=blocked_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(blocked_body))},
                )
                blocked_response = connection.getresponse()
                blocked_payload = json.loads(blocked_response.read().decode("utf-8"))

                recorded_request = {
                    **blocked_request,
                    "confirmations": {
                        "localSecretStoreWriteVerified": True,
                        "noRawSecretInPayload": True,
                        "envBindingPlanDocumented": True,
                        "rollbackPlanDocumented": True,
                    },
                    "metadata": {
                        "source": "audit-panel",
                        "fingerprint": "sha256:next-audit-key",
                        "apiKey": "recorded-api-key-should-not-leak",
                        "privateKey": "recorded-private-key-should-not-leak",
                    },
                }
                recorded_body = json.dumps(recorded_request).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/secret-materializations",
                    body=recorded_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(recorded_body))},
                )
                recorded_response = connection.getresponse()
                recorded_payload = json.loads(recorded_response.read().decode("utf-8"))

                connection.request(
                    "GET",
                    "/api/audit/signing-keys/secret-materializations?proposedKeyId=next-audit-key&limit=5",
                )
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "blocked": blocked_payload,
                "recorded": recorded_payload,
                "history": history_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(plan_response.status, 200)
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["secretMaterialization"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["secretMaterialization"]["blockedReasons"],
            [
                "secret_materialization_local_store_not_verified",
                "secret_materialization_raw_secret_boundary_not_confirmed",
                "secret_materialization_env_binding_plan_missing",
                "secret_materialization_rollback_plan_missing",
            ],
        )
        self.assertEqual(recorded_response.status, 201)
        self.assertEqual(recorded_payload["secretMaterialization"]["status"], "manifest_recorded")
        self.assertEqual(recorded_payload["secretMaterialization"]["planEventId"], plan_event_id)
        self.assertEqual(recorded_payload["secretMaterialization"]["proposedActiveKeyId"], "next-audit-key")
        self.assertEqual(recorded_payload["secretMaterialization"]["backend"], "local-secret-store")
        self.assertEqual(
            recorded_payload["secretMaterialization"]["manifestPath"],
            "local-secret-store://audit-signing/next-audit-key",
        )
        self.assertIn("AIQT_AUDIT_SIGNING_SECRET", recorded_payload["secretMaterialization"]["requiredEnvVars"])
        self.assertIn("AIQT_AUDIT_SIGNING_KEYS_JSON", recorded_payload["secretMaterialization"]["secretPlaceholderNames"])
        self.assertFalse(recorded_payload["secretMaterialization"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["secretMaterialization"]["paperOnly"])
        self.assertEqual(recorded_payload["secretMaterialization"]["metadata"]["apiKey"], "[redacted]")
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "audit_signing_key_secret_materialization")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["secretMaterializations"]), 2)
        self.assertEqual(history_payload["secretMaterializations"][0]["status"], "manifest_recorded")
        self.assertEqual(history_payload["secretMaterializations"][1]["status"], "blocked")
        self.assertNotIn("active-audit-secret", serialized)
        self.assertNotIn("blocked-secret-should-not-leak", serialized)
        self.assertNotIn("recorded-api-key-should-not-leak", serialized)
        self.assertNotIn("recorded-private-key-should-not-leak", serialized)

    def test_audit_signing_key_environment_binding_records_redacted_runtime_mapping(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            TestHandler.audit_signing_secret = "active-audit-secret"
            TestHandler.audit_signing_key_id = "active-audit-key"
            TestHandler.audit_signer_name = "Active Audit Key"
            TestHandler.audit_chain_id = "audit-chain-active"

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                plan_body = json.dumps(
                    {
                        "proposedKeyId": "next-audit-key",
                        "proposedSigner": "Next Audit Key",
                        "proposedChainId": "audit-chain-next",
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/rotation-plan",
                    body=plan_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(plan_body))},
                )
                plan_response = connection.getresponse()
                plan_payload = json.loads(plan_response.read().decode("utf-8"))
                rotation_plan = plan_payload["rotationPlan"]
                plan_event_id = "audit-signing-key-rotation-next-audit-key-binding-test"
                TestHandler.audit_event_store.record(
                    {
                        "schemaVersion": 1,
                        "eventId": plan_event_id,
                        "eventType": "audit_signing_key_rotation_plan",
                        "runId": "audit-signing-key-rotation",
                        "createdAt": rotation_plan["generatedAt"],
                        "stage": "prepared",
                        "source": "unit-test",
                        "summary": "Audit signing key rotation plan prepared for next-audit-key",
                        "detail": "active-audit-key -> next-audit-key",
                        "metadata": {
                            "currentKeyId": rotation_plan["currentActiveKey"]["keyId"],
                            "currentKeyFingerprint": rotation_plan["currentActiveKey"]["fingerprint"],
                            "proposedKeyId": rotation_plan["proposedActiveKey"]["keyId"],
                            "proposedSigner": rotation_plan["proposedActiveKey"]["signer"],
                            "proposedChainId": rotation_plan["proposedActiveKey"]["chainId"],
                            "requiresRestart": rotation_plan["requiresRestart"],
                            "environmentUpdateNames": [
                                item["name"] for item in rotation_plan["environmentUpdates"]
                            ],
                            "secretPlaceholderNames": [
                                item["name"]
                                for item in rotation_plan["environmentUpdates"]
                                if item["sensitivity"] == "secret"
                            ],
                            "blockedReasons": [],
                        },
                    }
                )

                materialization_body = json.dumps(
                    {
                        "planEventId": plan_event_id,
                        "operator": "audit-operator",
                        "backend": "local-secret-store",
                        "manifestPath": "local-secret-store://audit-signing/next-audit-key",
                        "confirmations": {
                            "localSecretStoreWriteVerified": True,
                            "noRawSecretInPayload": True,
                            "envBindingPlanDocumented": True,
                            "rollbackPlanDocumented": True,
                        },
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/secret-materializations",
                    body=materialization_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(materialization_body))},
                )
                materialization_response = connection.getresponse()
                materialization_payload = json.loads(materialization_response.read().decode("utf-8"))
                materialization_id = materialization_payload["secretMaterialization"]["materializationId"]

                blocked_body = json.dumps(
                    {
                        "materializationId": materialization_id,
                        "operator": "audit-operator",
                        "bindingMode": "container_env_reference",
                        "confirmations": {},
                        "metadata": {"secret": "blocked-binding-secret-should-not-leak"},
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/environment-bindings",
                    body=blocked_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(blocked_body))},
                )
                blocked_response = connection.getresponse()
                blocked_payload = json.loads(blocked_response.read().decode("utf-8"))

                recorded_body = json.dumps(
                    {
                        "materializationId": materialization_id,
                        "operator": "audit-operator",
                        "bindingMode": "container_env_reference",
                        "confirmations": {
                            "runtimeEnvMappingVerified": True,
                            "configReloadPlanDocumented": True,
                            "noRawSecretInPayload": True,
                            "rollbackSnapshotRecorded": True,
                        },
                        "metadata": {
                            "source": "audit-panel",
                            "apiKey": "binding-api-key-should-not-leak",
                            "privateKey": "binding-private-key-should-not-leak",
                        },
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/environment-bindings",
                    body=recorded_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(recorded_body))},
                )
                recorded_response = connection.getresponse()
                recorded_payload = json.loads(recorded_response.read().decode("utf-8"))

                connection.request(
                    "GET",
                    "/api/audit/signing-keys/environment-bindings?proposedKeyId=next-audit-key&limit=5",
                )
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {"blocked": blocked_payload, "recorded": recorded_payload, "history": history_payload},
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(plan_response.status, 200)
        self.assertEqual(materialization_response.status, 201)
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["environmentBinding"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["environmentBinding"]["blockedReasons"],
            [
                "environment_binding_runtime_env_mapping_missing",
                "environment_binding_config_reload_plan_missing",
                "environment_binding_raw_secret_boundary_not_confirmed",
                "environment_binding_rollback_snapshot_missing",
            ],
        )
        self.assertEqual(recorded_response.status, 201)
        self.assertEqual(recorded_payload["environmentBinding"]["status"], "binding_recorded")
        self.assertEqual(recorded_payload["environmentBinding"]["materializationId"], materialization_id)
        self.assertEqual(recorded_payload["environmentBinding"]["proposedActiveKeyId"], "next-audit-key")
        self.assertEqual(recorded_payload["environmentBinding"]["bindingMode"], "container_env_reference")
        self.assertIn("AIQT_AUDIT_SIGNING_SECRET", recorded_payload["environmentBinding"]["requiredEnvVars"])
        self.assertFalse(recorded_payload["environmentBinding"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["environmentBinding"]["paperOnly"])
        self.assertEqual(recorded_payload["environmentBinding"]["metadata"]["apiKey"], "[redacted]")
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "audit_signing_key_environment_binding")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["environmentBindings"]), 2)
        self.assertEqual(history_payload["environmentBindings"][0]["status"], "binding_recorded")
        self.assertEqual(history_payload["environmentBindings"][1]["status"], "blocked")
        self.assertNotIn("active-audit-secret", serialized)
        self.assertNotIn("blocked-binding-secret-should-not-leak", serialized)
        self.assertNotIn("binding-api-key-should-not-leak", serialized)
        self.assertNotIn("binding-private-key-should-not-leak", serialized)

    def test_audit_signing_key_runtime_reload_plan_records_evidence_without_restarting(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            TestHandler.audit_signing_secret = "active-audit-secret"
            TestHandler.audit_signing_key_id = "active-audit-key"
            TestHandler.audit_signer_name = "Active Audit Key"
            TestHandler.audit_chain_id = "audit-chain-active"

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                plan_body = json.dumps(
                    {
                        "proposedKeyId": "next-audit-key",
                        "proposedSigner": "Next Audit Key",
                        "proposedChainId": "audit-chain-next",
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/rotation-plan",
                    body=plan_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(plan_body))},
                )
                plan_response = connection.getresponse()
                plan_payload = json.loads(plan_response.read().decode("utf-8"))
                rotation_plan = plan_payload["rotationPlan"]
                plan_event_id = "audit-signing-key-rotation-next-audit-key-reload-plan-test"
                TestHandler.audit_event_store.record(
                    {
                        "schemaVersion": 1,
                        "eventId": plan_event_id,
                        "eventType": "audit_signing_key_rotation_plan",
                        "runId": "audit-signing-key-rotation",
                        "createdAt": rotation_plan["generatedAt"],
                        "stage": "prepared",
                        "source": "unit-test",
                        "summary": "Audit signing key rotation plan prepared for next-audit-key",
                        "detail": "active-audit-key -> next-audit-key",
                        "metadata": {
                            "currentKeyId": rotation_plan["currentActiveKey"]["keyId"],
                            "currentKeyFingerprint": rotation_plan["currentActiveKey"]["fingerprint"],
                            "proposedKeyId": rotation_plan["proposedActiveKey"]["keyId"],
                            "proposedSigner": rotation_plan["proposedActiveKey"]["signer"],
                            "proposedChainId": rotation_plan["proposedActiveKey"]["chainId"],
                            "requiresRestart": rotation_plan["requiresRestart"],
                            "environmentUpdateNames": [
                                item["name"] for item in rotation_plan["environmentUpdates"]
                            ],
                            "secretPlaceholderNames": [
                                item["name"]
                                for item in rotation_plan["environmentUpdates"]
                                if item["sensitivity"] == "secret"
                            ],
                            "blockedReasons": [],
                        },
                    }
                )

                materialization_body = json.dumps(
                    {
                        "planEventId": plan_event_id,
                        "operator": "audit-operator",
                        "backend": "local-secret-store",
                        "manifestPath": "local-secret-store://audit-signing/next-audit-key",
                        "confirmations": {
                            "localSecretStoreWriteVerified": True,
                            "noRawSecretInPayload": True,
                            "envBindingPlanDocumented": True,
                            "rollbackPlanDocumented": True,
                        },
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/secret-materializations",
                    body=materialization_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(materialization_body))},
                )
                materialization_response = connection.getresponse()
                materialization_payload = json.loads(materialization_response.read().decode("utf-8"))
                materialization_id = materialization_payload["secretMaterialization"]["materializationId"]

                binding_body = json.dumps(
                    {
                        "materializationId": materialization_id,
                        "operator": "audit-operator",
                        "bindingMode": "container_env_reference",
                        "confirmations": {
                            "runtimeEnvMappingVerified": True,
                            "configReloadPlanDocumented": True,
                            "noRawSecretInPayload": True,
                            "rollbackSnapshotRecorded": True,
                        },
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/environment-bindings",
                    body=binding_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(binding_body))},
                )
                binding_response = connection.getresponse()
                binding_payload = json.loads(binding_response.read().decode("utf-8"))
                binding_id = binding_payload["environmentBinding"]["bindingId"]

                missing_binding_body = json.dumps(
                    {
                        "bindingId": "missing-binding",
                        "operator": "audit-operator",
                        "maintenanceWindowId": "audit-window-1",
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/runtime-reload-plans",
                    body=missing_binding_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(missing_binding_body))},
                )
                missing_binding_response = connection.getresponse()
                missing_binding_payload = json.loads(missing_binding_response.read().decode("utf-8"))

                blocked_body = json.dumps(
                    {
                        "bindingId": binding_id,
                        "operator": "audit-operator",
                        "reloadMode": "manual_container_reload_plan",
                        "maintenanceWindowId": "audit-window-1",
                        "confirmations": {},
                        "metadata": {"secret": "blocked-reload-secret-should-not-leak"},
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/runtime-reload-plans",
                    body=blocked_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(blocked_body))},
                )
                blocked_response = connection.getresponse()
                blocked_payload = json.loads(blocked_response.read().decode("utf-8"))

                recorded_body = json.dumps(
                    {
                        "bindingId": binding_id,
                        "operator": "audit-operator",
                        "reloadMode": "manual_container_reload_plan",
                        "maintenanceWindowId": "audit-window-1",
                        "confirmations": {
                            "maintenanceWindowApproved": True,
                            "healthBaselineCaptured": True,
                            "configDiffReviewed": True,
                            "postReloadSmokePlanDocumented": True,
                            "rollbackOwnerAssigned": True,
                        },
                        "metadata": {
                            "source": "audit-panel",
                            "apiKey": "reload-api-key-should-not-leak",
                            "privateKey": "reload-private-key-should-not-leak",
                        },
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/runtime-reload-plans",
                    body=recorded_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(recorded_body))},
                )
                recorded_response = connection.getresponse()
                recorded_payload = json.loads(recorded_response.read().decode("utf-8"))

                connection.request(
                    "GET",
                    "/api/audit/signing-keys/runtime-reload-plans?proposedKeyId=next-audit-key&limit=5",
                )
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "missing": missing_binding_payload,
                "blocked": blocked_payload,
                "recorded": recorded_payload,
                "history": history_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(plan_response.status, 200)
        self.assertEqual(materialization_response.status, 201)
        self.assertEqual(binding_response.status, 201)
        self.assertEqual(missing_binding_response.status, 404)
        self.assertEqual(missing_binding_payload["error"], "audit_signing_key_environment_binding_not_found")
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["runtimeReloadPlan"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["runtimeReloadPlan"]["blockedReasons"],
            [
                "runtime_reload_maintenance_window_missing",
                "runtime_reload_health_baseline_missing",
                "runtime_reload_config_diff_missing",
                "runtime_reload_smoke_plan_missing",
                "runtime_reload_rollback_owner_missing",
            ],
        )
        self.assertEqual(recorded_response.status, 201)
        self.assertEqual(recorded_payload["runtimeReloadPlan"]["status"], "plan_recorded")
        self.assertEqual(recorded_payload["runtimeReloadPlan"]["bindingId"], binding_id)
        self.assertEqual(recorded_payload["runtimeReloadPlan"]["proposedActiveKeyId"], "next-audit-key")
        self.assertEqual(recorded_payload["runtimeReloadPlan"]["reloadMode"], "manual_container_reload_plan")
        self.assertEqual(recorded_payload["runtimeReloadPlan"]["maintenanceWindowId"], "audit-window-1")
        self.assertIn("AIQT_AUDIT_SIGNING_SECRET", recorded_payload["runtimeReloadPlan"]["requiredEnvVars"])
        self.assertFalse(recorded_payload["runtimeReloadPlan"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["runtimeReloadPlan"]["paperOnly"])
        self.assertEqual(recorded_payload["runtimeReloadPlan"]["metadata"]["apiKey"], "[redacted]")
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "audit_signing_key_runtime_reload_plan")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["runtimeReloadPlans"]), 2)
        self.assertEqual(history_payload["runtimeReloadPlans"][0]["status"], "plan_recorded")
        self.assertEqual(history_payload["runtimeReloadPlans"][1]["status"], "blocked")
        self.assertNotIn("active-audit-secret", serialized)
        self.assertNotIn("blocked-reload-secret-should-not-leak", serialized)
        self.assertNotIn("reload-api-key-should-not-leak", serialized)
        self.assertNotIn("reload-private-key-should-not-leak", serialized)

    def test_audit_signing_key_runtime_reload_execution_records_evidence_without_restarting(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            TestHandler.audit_signing_secret = "active-audit-secret"
            TestHandler.audit_signing_key_id = "active-audit-key"
            TestHandler.audit_signer_name = "Active Audit Key"
            TestHandler.audit_chain_id = "audit-chain-active"

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)

            def post_json(path, payload):
                body = json.dumps(payload).encode("utf-8")
                connection.request(
                    "POST",
                    path,
                    body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                response = connection.getresponse()
                return response, json.loads(response.read().decode("utf-8"))

            try:
                plan_response, plan_payload = post_json(
                    "/api/audit/signing-keys/rotation-plan",
                    {
                        "proposedKeyId": "next-audit-key",
                        "proposedSigner": "Next Audit Key",
                        "proposedChainId": "audit-chain-next",
                    },
                )
                rotation_plan = plan_payload["rotationPlan"]
                plan_event_id = "audit-signing-key-rotation-next-audit-key-reload-execution-test"
                TestHandler.audit_event_store.record(
                    {
                        "schemaVersion": 1,
                        "eventId": plan_event_id,
                        "eventType": "audit_signing_key_rotation_plan",
                        "runId": "audit-signing-key-rotation",
                        "createdAt": rotation_plan["generatedAt"],
                        "stage": "prepared",
                        "source": "unit-test",
                        "summary": "Audit signing key rotation plan prepared for next-audit-key",
                        "detail": "active-audit-key -> next-audit-key",
                        "metadata": {
                            "currentKeyId": rotation_plan["currentActiveKey"]["keyId"],
                            "currentKeyFingerprint": rotation_plan["currentActiveKey"]["fingerprint"],
                            "proposedKeyId": rotation_plan["proposedActiveKey"]["keyId"],
                            "proposedSigner": rotation_plan["proposedActiveKey"]["signer"],
                            "proposedChainId": rotation_plan["proposedActiveKey"]["chainId"],
                            "requiresRestart": rotation_plan["requiresRestart"],
                            "environmentUpdateNames": [
                                item["name"] for item in rotation_plan["environmentUpdates"]
                            ],
                            "secretPlaceholderNames": [
                                item["name"]
                                for item in rotation_plan["environmentUpdates"]
                                if item["sensitivity"] == "secret"
                            ],
                            "blockedReasons": [],
                        },
                    }
                )

                materialization_response, materialization_payload = post_json(
                    "/api/audit/signing-keys/secret-materializations",
                    {
                        "planEventId": plan_event_id,
                        "operator": "audit-operator",
                        "backend": "local-secret-store",
                        "manifestPath": "local-secret-store://audit-signing/next-audit-key",
                        "confirmations": {
                            "localSecretStoreWriteVerified": True,
                            "noRawSecretInPayload": True,
                            "envBindingPlanDocumented": True,
                            "rollbackPlanDocumented": True,
                        },
                    },
                )
                materialization_id = materialization_payload["secretMaterialization"]["materializationId"]

                binding_response, binding_payload = post_json(
                    "/api/audit/signing-keys/environment-bindings",
                    {
                        "materializationId": materialization_id,
                        "operator": "audit-operator",
                        "bindingMode": "container_env_reference",
                        "confirmations": {
                            "runtimeEnvMappingVerified": True,
                            "configReloadPlanDocumented": True,
                            "noRawSecretInPayload": True,
                            "rollbackSnapshotRecorded": True,
                        },
                    },
                )
                binding_id = binding_payload["environmentBinding"]["bindingId"]

                reload_plan_response, reload_plan_payload = post_json(
                    "/api/audit/signing-keys/runtime-reload-plans",
                    {
                        "bindingId": binding_id,
                        "operator": "audit-operator",
                        "reloadMode": "manual_container_reload_plan",
                        "maintenanceWindowId": "audit-window-1",
                        "confirmations": {
                            "maintenanceWindowApproved": True,
                            "healthBaselineCaptured": True,
                            "configDiffReviewed": True,
                            "postReloadSmokePlanDocumented": True,
                            "rollbackOwnerAssigned": True,
                        },
                        "metadata": {"source": "audit-panel"},
                    },
                )
                reload_plan_id = reload_plan_payload["runtimeReloadPlan"]["planId"]

                missing_plan_response, missing_plan_payload = post_json(
                    "/api/audit/signing-keys/runtime-reload-executions",
                    {
                        "planId": "missing-audit-runtime-reload-plan",
                        "operator": "audit-operator",
                    },
                )

                blocked_response, blocked_payload = post_json(
                    "/api/audit/signing-keys/runtime-reload-executions",
                    {
                        "planId": reload_plan_id,
                        "operator": "audit-operator",
                        "executionMode": "manual_controlled_reload_evidence",
                        "confirmations": {},
                        "metadata": {"token": "blocked-reload-execution-token-should-not-leak"},
                    },
                )

                recorded_response, recorded_payload = post_json(
                    "/api/audit/signing-keys/runtime-reload-executions",
                    {
                        "planId": reload_plan_id,
                        "operator": "audit-operator",
                        "executionMode": "manual_controlled_reload_evidence",
                        "confirmations": {
                            "preReloadHealthVerified": True,
                            "reloadActionRecorded": True,
                            "postReloadSmokePassed": True,
                            "rollbackReadinessConfirmed": True,
                            "operatorConfirmedLiveBlocked": True,
                        },
                        "metadata": {
                            "source": "audit-panel",
                            "apiKey": "reload-execution-api-key-should-not-leak",
                            "privateKey": "reload-execution-private-key-should-not-leak",
                        },
                    },
                )

                connection.request(
                    "GET",
                    "/api/audit/signing-keys/runtime-reload-executions?proposedKeyId=next-audit-key&limit=5",
                )
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "missing": missing_plan_payload,
                "blocked": blocked_payload,
                "recorded": recorded_payload,
                "history": history_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(plan_response.status, 200)
        self.assertEqual(materialization_response.status, 201)
        self.assertEqual(binding_response.status, 201)
        self.assertEqual(reload_plan_response.status, 201)
        self.assertEqual(missing_plan_response.status, 404)
        self.assertEqual(missing_plan_payload["error"], "audit_signing_key_runtime_reload_plan_not_found")
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["runtimeReloadExecution"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["runtimeReloadExecution"]["blockedReasons"],
            [
                "runtime_reload_execution_pre_health_missing",
                "runtime_reload_execution_action_record_missing",
                "runtime_reload_execution_post_smoke_missing",
                "runtime_reload_execution_rollback_readiness_missing",
                "runtime_reload_execution_live_block_boundary_missing",
            ],
        )
        self.assertEqual(recorded_response.status, 201)
        self.assertEqual(recorded_payload["runtimeReloadExecution"]["status"], "execution_recorded")
        self.assertEqual(recorded_payload["runtimeReloadExecution"]["planId"], reload_plan_id)
        self.assertEqual(recorded_payload["runtimeReloadExecution"]["bindingId"], binding_id)
        self.assertEqual(recorded_payload["runtimeReloadExecution"]["proposedActiveKeyId"], "next-audit-key")
        self.assertEqual(recorded_payload["runtimeReloadExecution"]["executionMode"], "manual_controlled_reload_evidence")
        self.assertEqual(recorded_payload["runtimeReloadExecution"]["reloadMode"], "manual_container_reload_plan")
        self.assertEqual(recorded_payload["runtimeReloadExecution"]["maintenanceWindowId"], "audit-window-1")
        self.assertIn("AIQT_AUDIT_SIGNING_SECRET", recorded_payload["runtimeReloadExecution"]["requiredEnvVars"])
        self.assertFalse(recorded_payload["runtimeReloadExecution"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["runtimeReloadExecution"]["paperOnly"])
        self.assertEqual(recorded_payload["runtimeReloadExecution"]["metadata"]["apiKey"], "[redacted]")
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "audit_signing_key_runtime_reload_execution")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["runtimeReloadExecutions"]), 2)
        self.assertEqual(history_payload["runtimeReloadExecutions"][0]["status"], "execution_recorded")
        self.assertEqual(history_payload["runtimeReloadExecutions"][1]["status"], "blocked")
        self.assertNotIn("active-audit-secret", serialized)
        self.assertNotIn("blocked-reload-execution-token-should-not-leak", serialized)
        self.assertNotIn("reload-execution-api-key-should-not-leak", serialized)
        self.assertNotIn("reload-execution-private-key-should-not-leak", serialized)

    def test_audit_signing_key_rotation_acceptance_records_final_gate_without_enabling_live(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        class TestHandler(QuantApiHandler):
            pass

        with tempfile.TemporaryDirectory() as tmp:
            TestHandler.audit_event_store = AuditEventStore(Path(tmp) / "audit_events.sqlite")
            TestHandler.audit_signing_secret = "active-audit-secret"
            TestHandler.audit_signing_key_id = "active-audit-key"
            TestHandler.audit_signer_name = "Active Audit Key"
            TestHandler.audit_chain_id = "audit-chain-active"

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)

            def post_json(path, payload):
                body = json.dumps(payload).encode("utf-8")
                connection.request(
                    "POST",
                    path,
                    body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                response = connection.getresponse()
                return response, json.loads(response.read().decode("utf-8"))

            try:
                plan_response, plan_payload = post_json(
                    "/api/audit/signing-keys/rotation-plan",
                    {
                        "proposedKeyId": "next-audit-key",
                        "proposedSigner": "Next Audit Key",
                        "proposedChainId": "audit-chain-next",
                    },
                )
                rotation_plan = plan_payload["rotationPlan"]
                plan_event_id = "audit-signing-key-rotation-next-audit-key-acceptance-test"
                TestHandler.audit_event_store.record(
                    {
                        "schemaVersion": 1,
                        "eventId": plan_event_id,
                        "eventType": "audit_signing_key_rotation_plan",
                        "runId": "audit-signing-key-rotation",
                        "createdAt": rotation_plan["generatedAt"],
                        "stage": "prepared",
                        "source": "unit-test",
                        "summary": "Audit signing key rotation plan prepared for next-audit-key",
                        "detail": "active-audit-key -> next-audit-key",
                        "metadata": {
                            "currentKeyId": rotation_plan["currentActiveKey"]["keyId"],
                            "currentKeyFingerprint": rotation_plan["currentActiveKey"]["fingerprint"],
                            "proposedKeyId": rotation_plan["proposedActiveKey"]["keyId"],
                            "proposedSigner": rotation_plan["proposedActiveKey"]["signer"],
                            "proposedChainId": rotation_plan["proposedActiveKey"]["chainId"],
                            "requiresRestart": rotation_plan["requiresRestart"],
                            "environmentUpdateNames": [
                                item["name"] for item in rotation_plan["environmentUpdates"]
                            ],
                            "secretPlaceholderNames": [
                                item["name"]
                                for item in rotation_plan["environmentUpdates"]
                                if item["sensitivity"] == "secret"
                            ],
                            "blockedReasons": [],
                        },
                    }
                )

                materialization_response, materialization_payload = post_json(
                    "/api/audit/signing-keys/secret-materializations",
                    {
                        "planEventId": plan_event_id,
                        "operator": "audit-operator",
                        "backend": "local-secret-store",
                        "manifestPath": "local-secret-store://audit-signing/next-audit-key",
                        "confirmations": {
                            "localSecretStoreWriteVerified": True,
                            "noRawSecretInPayload": True,
                            "envBindingPlanDocumented": True,
                            "rollbackPlanDocumented": True,
                        },
                    },
                )
                materialization_id = materialization_payload["secretMaterialization"]["materializationId"]

                binding_response, binding_payload = post_json(
                    "/api/audit/signing-keys/environment-bindings",
                    {
                        "materializationId": materialization_id,
                        "operator": "audit-operator",
                        "bindingMode": "container_env_reference",
                        "confirmations": {
                            "runtimeEnvMappingVerified": True,
                            "configReloadPlanDocumented": True,
                            "noRawSecretInPayload": True,
                            "rollbackSnapshotRecorded": True,
                        },
                    },
                )
                binding_id = binding_payload["environmentBinding"]["bindingId"]

                reload_plan_response, reload_plan_payload = post_json(
                    "/api/audit/signing-keys/runtime-reload-plans",
                    {
                        "bindingId": binding_id,
                        "operator": "audit-operator",
                        "reloadMode": "manual_container_reload_plan",
                        "maintenanceWindowId": "audit-window-acceptance-1",
                        "confirmations": {
                            "maintenanceWindowApproved": True,
                            "healthBaselineCaptured": True,
                            "configDiffReviewed": True,
                            "postReloadSmokePlanDocumented": True,
                            "rollbackOwnerAssigned": True,
                        },
                    },
                )
                reload_plan_id = reload_plan_payload["runtimeReloadPlan"]["planId"]

                execution_response, execution_payload = post_json(
                    "/api/audit/signing-keys/runtime-reload-executions",
                    {
                        "planId": reload_plan_id,
                        "operator": "audit-operator",
                        "executionMode": "manual_controlled_reload_evidence",
                        "confirmations": {
                            "preReloadHealthVerified": True,
                            "reloadActionRecorded": True,
                            "postReloadSmokePassed": True,
                            "rollbackReadinessConfirmed": True,
                            "operatorConfirmedLiveBlocked": True,
                        },
                    },
                )
                execution_id = execution_payload["runtimeReloadExecution"]["executionId"]

                missing_execution_response, missing_execution_payload = post_json(
                    "/api/audit/signing-keys/rotation-acceptances",
                    {
                        "executionId": "missing-runtime-reload-execution",
                        "operator": "audit-operator",
                    },
                )

                blocked_response, blocked_payload = post_json(
                    "/api/audit/signing-keys/rotation-acceptances",
                    {
                        "executionId": execution_id,
                        "operator": "audit-operator",
                        "confirmations": {},
                        "metadata": {"token": "blocked-rotation-acceptance-token-should-not-leak"},
                    },
                )

                recorded_response, recorded_payload = post_json(
                    "/api/audit/signing-keys/rotation-acceptances",
                    {
                        "executionId": execution_id,
                        "operator": "audit-operator",
                        "acceptanceMode": "manual_rotation_acceptance",
                        "confirmations": {
                            "executionEvidenceReviewed": True,
                            "signatureProbeVerified": True,
                            "legacyVerificationConfirmed": True,
                            "rollbackWindowStillOpen": True,
                            "operatorConfirmedActivationBlocked": True,
                        },
                        "metadata": {
                            "source": "audit-panel",
                            "apiKey": "rotation-acceptance-api-key-should-not-leak",
                            "privateKey": "rotation-acceptance-private-key-should-not-leak",
                        },
                    },
                )

                connection.request(
                    "GET",
                    "/api/audit/signing-keys/rotation-acceptances?proposedKeyId=next-audit-key&limit=5",
                )
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        serialized = json.dumps(
            {
                "missing": missing_execution_payload,
                "blocked": blocked_payload,
                "recorded": recorded_payload,
                "history": history_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
        self.assertEqual(plan_response.status, 200)
        self.assertEqual(materialization_response.status, 201)
        self.assertEqual(binding_response.status, 201)
        self.assertEqual(reload_plan_response.status, 201)
        self.assertEqual(execution_response.status, 201)
        self.assertEqual(missing_execution_response.status, 404)
        self.assertEqual(missing_execution_payload["error"], "audit_signing_key_runtime_reload_execution_not_found")
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["rotationAcceptance"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["rotationAcceptance"]["blockedReasons"],
            [
                "rotation_acceptance_execution_evidence_not_reviewed",
                "rotation_acceptance_signature_probe_missing",
                "rotation_acceptance_legacy_verification_missing",
                "rotation_acceptance_rollback_window_missing",
                "rotation_acceptance_activation_boundary_missing",
            ],
        )
        self.assertEqual(recorded_response.status, 201)
        self.assertEqual(recorded_payload["rotationAcceptance"]["status"], "acceptance_recorded")
        self.assertEqual(recorded_payload["rotationAcceptance"]["executionId"], execution_id)
        self.assertEqual(recorded_payload["rotationAcceptance"]["planId"], reload_plan_id)
        self.assertEqual(recorded_payload["rotationAcceptance"]["proposedActiveKeyId"], "next-audit-key")
        self.assertEqual(recorded_payload["rotationAcceptance"]["acceptanceMode"], "manual_rotation_acceptance")
        self.assertEqual(recorded_payload["rotationAcceptance"]["executionMode"], "manual_controlled_reload_evidence")
        self.assertIn("AIQT_AUDIT_SIGNING_SECRET", recorded_payload["rotationAcceptance"]["requiredEnvVars"])
        self.assertFalse(recorded_payload["rotationAcceptance"]["liveTradingAllowed"])
        self.assertTrue(recorded_payload["rotationAcceptance"]["paperOnly"])
        self.assertEqual(recorded_payload["rotationAcceptance"]["metadata"]["apiKey"], "[redacted]")
        self.assertEqual(recorded_payload["auditEvent"]["eventType"], "audit_signing_key_rotation_acceptance")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["rotationAcceptances"]), 2)
        self.assertEqual(history_payload["rotationAcceptances"][0]["status"], "acceptance_recorded")
        self.assertEqual(history_payload["rotationAcceptances"][1]["status"], "blocked")
        self.assertNotIn("active-audit-secret", serialized)
        self.assertNotIn("blocked-rotation-acceptance-token-should-not-leak", serialized)
        self.assertNotIn("rotation-acceptance-api-key-should-not-leak", serialized)
        self.assertNotIn("rotation-acceptance-private-key-should-not-leak", serialized)

    def test_audit_signing_key_rotation_apply_preflight_requires_confirmations_without_leaking_secret(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler

        with tempfile.TemporaryDirectory():
            class TestHandler(QuantApiHandler):
                pass

            TestHandler.audit_signing_secret = "active-audit-secret"
            TestHandler.audit_signing_key_id = "active-audit-key"
            TestHandler.audit_signer_name = "Active Audit Key"
            TestHandler.audit_chain_id = "audit-chain-active"
            TestHandler.audit_signing_keys_json = json.dumps(
                [
                    {
                        "keyId": "legacy-audit-key",
                        "signer": "Legacy Audit Key",
                        "secret": "legacy-audit-secret",
                        "chainId": "audit-chain-legacy",
                        "status": "retired",
                    }
                ]
            )

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                plan_body = json.dumps(
                    {
                        "proposedKeyId": "next-audit-key",
                        "proposedSigner": "Next Audit Key",
                        "proposedChainId": "audit-chain-next",
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/rotation-plan",
                    body=plan_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(plan_body))},
                )
                plan_response = connection.getresponse()
                plan_payload = json.loads(plan_response.read().decode("utf-8"))

                blocked_body = json.dumps({"rotationPlan": plan_payload["rotationPlan"], "confirmations": {}}).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/rotation-apply",
                    body=blocked_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(blocked_body))},
                )
                blocked_response = connection.getresponse()
                blocked_payload = json.loads(blocked_response.read().decode("utf-8"))

                ready_body = json.dumps(
                    {
                        "rotationPlan": plan_payload["rotationPlan"],
                        "confirmations": {
                            "legacySecretStored": True,
                            "newSecretMaterialStored": True,
                            "operatorReviewedPlan": True,
                        },
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/rotation-apply",
                    body=ready_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(ready_body))},
                )
                ready_response = connection.getresponse()
                ready_payload = json.loads(ready_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(plan_response.status, 200)
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["rotationApply"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["rotationApply"]["blockedReasons"],
            ["new_secret_material_not_confirmed", "legacy_secret_not_confirmed", "operator_review_not_confirmed"],
        )
        self.assertEqual(
            [item["id"] for item in blocked_payload["rotationApply"]["requiredConfirmations"]],
            ["new-secret-material-stored", "legacy-secret-stored", "operator-reviewed-plan"],
        )
        self.assertEqual(ready_response.status, 200)
        self.assertEqual(ready_payload["rotationApply"]["status"], "ready_for_restart")
        self.assertEqual(ready_payload["rotationApply"]["blockedReasons"], [])
        self.assertEqual(
            ready_payload["rotationApply"]["environmentUpdateNames"],
            [
                "AIQT_AUDIT_SIGNING_KEY_ID",
                "AIQT_AUDIT_SIGNER_NAME",
                "AIQT_AUDIT_CHAIN_ID",
                "AIQT_AUDIT_SIGNING_SECRET",
                "AIQT_AUDIT_SIGNING_KEYS_JSON",
            ],
        )
        serialized = json.dumps([blocked_payload, ready_payload])
        self.assertNotIn("active-audit-secret", serialized)
        self.assertNotIn("legacy-audit-secret", serialized)
        self.assertNotIn("<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>", serialized)

    def test_audit_signing_key_controlled_restart_evidence_requires_ready_apply_event(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        with tempfile.TemporaryDirectory() as tmp:
            audit_event_store = AuditEventStore(f"{tmp}/audit-events.sqlite")

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.audit_event_store = audit_event_store
            TestHandler.audit_signing_secret = "active-audit-secret"
            TestHandler.audit_signing_key_id = "active-audit-key"
            TestHandler.audit_signer_name = "Active Audit Key"
            TestHandler.audit_chain_id = "audit-chain-active"

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                plan_body = json.dumps(
                    {
                        "proposedKeyId": "next-audit-key",
                        "proposedSigner": "Next Audit Key",
                        "proposedChainId": "audit-chain-next",
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/rotation-plan",
                    body=plan_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(plan_body))},
                )
                plan_response = connection.getresponse()
                plan_payload = json.loads(plan_response.read().decode("utf-8"))

                apply_body = json.dumps(
                    {
                        "rotationPlan": plan_payload["rotationPlan"],
                        "confirmations": {
                            "legacySecretStored": True,
                            "newSecretMaterialStored": True,
                            "operatorReviewedPlan": True,
                        },
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/rotation-apply",
                    body=apply_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(apply_body))},
                )
                apply_response = connection.getresponse()
                apply_payload = json.loads(apply_response.read().decode("utf-8"))
                rotation_apply = apply_payload["rotationApply"]
                apply_event_id = "audit-signing-key-rotation-apply-next-audit-key-test"
                audit_event_store.record(
                    {
                        "schemaVersion": 1,
                        "eventId": apply_event_id,
                        "eventType": "audit_signing_key_rotation_apply",
                        "runId": "audit-signing-key-rotation",
                        "createdAt": rotation_apply["generatedAt"],
                        "stage": "ready_for_restart",
                        "source": "unit-test",
                        "summary": "Audit signing key rotation apply ready for next-audit-key",
                        "detail": "active-audit-key -> next-audit-key · manual_secret_store · ready for restart",
                        "metadata": {
                            **rotation_apply,
                            "status": "ready_for_restart",
                        },
                    }
                )

                blocked_body = json.dumps({"applyEventId": apply_event_id, "confirmations": {}}).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/rotation-restart-evidence",
                    body=blocked_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(blocked_body))},
                )
                blocked_response = connection.getresponse()
                blocked_payload = json.loads(blocked_response.read().decode("utf-8"))

                ready_body = json.dumps(
                    {
                        "applyEventId": apply_event_id,
                        "operator": "audit-operator",
                        "confirmations": {
                            "restartWindowExecuted": True,
                            "rollbackPlanConfirmed": True,
                            "postRestartValidationPassed": True,
                            "operatorReviewedRestartLogs": True,
                        },
                        "metadata": {"ticket": "CHG-42", "apiKey": "must-not-leak"},
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/audit/signing-keys/rotation-restart-evidence",
                    body=ready_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(ready_body))},
                )
                ready_response = connection.getresponse()
                ready_payload = json.loads(ready_response.read().decode("utf-8"))

                connection.request("GET", "/api/audit/events?eventType=audit_signing_key_controlled_restart_evidence&limit=5")
                history_response = connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(plan_response.status, 200)
        self.assertEqual(apply_response.status, 200)
        self.assertEqual(blocked_response.status, 409)
        self.assertEqual(blocked_payload["restartEvidence"]["status"], "blocked")
        self.assertEqual(
            blocked_payload["restartEvidence"]["blockedReasons"],
            [
                "restart_window_not_confirmed",
                "rollback_plan_not_confirmed",
                "post_restart_validation_not_confirmed",
                "restart_logs_not_confirmed",
            ],
        )
        self.assertEqual(ready_response.status, 201)
        self.assertEqual(ready_payload["restartEvidence"]["status"], "evidence_recorded")
        self.assertEqual(ready_payload["restartEvidence"]["applyEventId"], apply_event_id)
        self.assertEqual(ready_payload["restartEvidence"]["proposedActiveKeyId"], "next-audit-key")
        self.assertFalse(ready_payload["restartEvidence"]["liveTradingAllowed"])
        self.assertTrue(ready_payload["restartEvidence"]["paperOnly"])
        self.assertEqual(ready_payload["restartEvidence"]["metadata"]["ticket"], "CHG-42")
        self.assertEqual(ready_payload["restartEvidence"]["metadata"]["apiKey"], "[redacted]")
        self.assertEqual(ready_payload["auditEvent"]["eventType"], "audit_signing_key_controlled_restart_evidence")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(history_payload["pagination"]["total"], 2)
        serialized = json.dumps([blocked_payload, ready_payload, history_payload])
        self.assertNotIn("active-audit-secret", serialized)
        self.assertNotIn("must-not-leak", serialized)

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
            data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 1},
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
            data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 1},
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
            data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 1},
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

    def test_portfolio_backtest_api_combines_audited_runs_by_weight(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.runs import ResearchRunAudit, ResearchRunStore

        start = datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc)
        timestamps = [start + timedelta(days=index) for index in range(3)]

        def audit(run_id: str, symbol: str, equities: list[float], return_pct: float) -> ResearchRunAudit:
            return ResearchRunAudit(
                run_id=run_id,
                created_at=start,
                market="ashare",
                symbol=symbol,
                timeframe="1d",
                strategy_name="Audited SMA plan",
                strategy_revision=f"rev-{symbol}",
                data_rows=len(equities),
                metrics={"total_return_pct": return_pct, "win_rate_pct": 50.0, "profit_factor": 1.5, "trade_count": 2},
                decisions=[],
                execution_mode="paper_only",
                ai_report={"summary": "Audited", "risks": [], "improvements": [], "disclaimer": "No advice"},
                data_quality={"source": "local-cache", "isComplete": True, "warnings": [], "rows": len(equities)},
                backtest_equity_curve=[
                    {"timestamp": timestamp.isoformat(), "equity": equity}
                    for timestamp, equity in zip(timestamps, equities, strict=True)
                ],
            )

        with tempfile.TemporaryDirectory() as tmp:
            research_store = ResearchRunStore(f"{tmp}/runs.sqlite")
            research_store.record(audit("run-a", "600000", [100_000, 110_000, 105_000], 5.0))
            research_store.record(audit("run-b", "000300", [100_000, 95_000, 120_000], 20.0))

            class TestHandler(QuantApiHandler):
                run_store = research_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                body = json.dumps(
                    {
                        "name": "A-share core basket",
                        "initialCash": 100000,
                        "legs": [
                            {"runId": "run-a", "targetWeight": 0.6},
                            {"runId": "run-b", "targetWeight": 0.3},
                        ],
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/portfolio/backtest",
                    body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["portfolio"]["name"], "A-share core basket")
        self.assertEqual(payload["portfolio"]["metrics"]["totalReturnPct"], 9.0)
        self.assertEqual(payload["portfolio"]["cashWeight"], 0.1)
        self.assertEqual(payload["portfolio"]["equityCurve"][-1]["equity"], 109000.0)
        self.assertEqual(
            [
                (event["eventType"], event["symbol"], event["sourceRunId"], event["targetWeight"], event["notionalValue"])
                for event in payload["portfolio"]["allocationEvents"]
            ],
            [
                ("allocate", "600000", "run-a", 0.6, 60000.0),
                ("allocate", "000300", "run-b", 0.3, 30000.0),
                ("cash_buffer", "CASH", None, 0.1, 10000.0),
            ],
        )
        self.assertEqual(
            [
                (event["eventType"], event["symbol"], event["sourceRunId"], event["status"])
                for event in payload["portfolio"]["rebalanceEvents"]
            ],
            [
                ("rebalance_review", "600000", "run-a", "review"),
                ("rebalance_review", "000300", "run-b", "review"),
                ("rebalance_review", "CASH", None, "within_band"),
            ],
        )
        self.assertEqual(
            [(leg["symbol"], leg["targetWeight"], leg["contributionValue"]) for leg in payload["portfolio"]["legs"]],
            [("600000", 0.6, 3000.0), ("000300", 0.3, 6000.0)],
        )

    def test_portfolio_paper_order_api_records_and_lists_batches(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.audit_events import AuditEventStore
        from quant_core.api import QuantApiHandler
        from quant_core.execution import PortfolioPaperOrderStore

        with tempfile.TemporaryDirectory() as tmp:
            portfolio_order_store = PortfolioPaperOrderStore(f"{tmp}/portfolio_orders.sqlite")
            portfolio_order_audit_store = AuditEventStore(f"{tmp}/audit_events.sqlite")

            class TestHandler(QuantApiHandler):
                portfolio_paper_order_store = portfolio_order_store
                audit_event_store = portfolio_order_audit_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                body = json.dumps(
                    {
                        "baseRunId": "portfolio-run-api",
                        "portfolioName": "A-share core basket",
                        "orders": [
                            {
                                "timestamp": "2026-05-26T08:00:00+00:00",
                                "eventType": "portfolio_paper_order",
                                "orderId": "portfolio-paper-run-a-buy",
                                "symbol": "600000",
                                "sourceRunId": "run-a",
                                "side": "buy",
                                "notionalValue": 60000.0,
                                "quantity": 6500.0,
                                "status": "pending_review",
                                "riskStatus": "review",
                                "reason": "Requires operator review before simulated routing.",
                            }
                        ],
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/portfolio/paper-orders",
                    body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
                connection.request("GET", "/api/portfolio/paper-orders?baseRunId=portfolio-run-api")
                list_response = connection.getresponse()
                list_payload = json.loads(list_response.read().decode("utf-8"))
                connection.request(
                    "GET",
                    "/api/audit/events?eventType=portfolio_paper_order_batch&runId=portfolio-run-api",
                )
                audit_response = connection.getresponse()
                audit_payload = json.loads(audit_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 201)
        self.assertEqual(payload["portfolioPaperOrderBatch"]["baseRunId"], "portfolio-run-api")
        self.assertEqual(payload["portfolioPaperOrderBatch"]["summary"]["statusCounts"], {"pending_review": 1})
        self.assertEqual(list_response.status, 200)
        self.assertEqual(len(list_payload["portfolioPaperOrderBatches"]), 1)
        self.assertEqual(
            list_payload["portfolioPaperOrderBatches"][0]["batchId"],
            payload["portfolioPaperOrderBatch"]["batchId"],
        )
        self.assertEqual(audit_response.status, 200)
        self.assertEqual(payload["auditEvent"]["eventType"], "portfolio_paper_order_batch")
        self.assertEqual(payload["auditEvent"]["runId"], "portfolio-run-api")
        self.assertEqual(payload["auditEvent"]["metadata"]["batchId"], payload["portfolioPaperOrderBatch"]["batchId"])
        self.assertEqual(payload["auditEvent"]["metadata"]["totalOrders"], 1)
        self.assertEqual(payload["auditEvent"]["metadata"]["statusCounts"], {"pending_review": 1})
        self.assertEqual(payload["portfolioPaperOrderLifecycle"][0]["state"], "awaiting_operator_review")
        self.assertFalse(payload["portfolioPaperOrderLifecycle"][0]["routable"])
        self.assertEqual(payload["auditEvent"]["metadata"]["lifecycleStateCounts"], {"awaiting_operator_review": 1})
        self.assertEqual(payload["auditEvent"]["metadata"]["routableOrders"], 0)
        self.assertTrue(payload["auditEvent"]["metadata"]["paperOnly"])
        self.assertEqual(len(audit_payload["events"]), 1)
        self.assertEqual(audit_payload["events"][0]["eventId"], payload["auditEvent"]["eventId"])

    def test_portfolio_paper_order_approval_api_records_review_and_updates_lifecycle(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.audit_events import AuditEventStore
        from quant_core.api import QuantApiHandler
        from quant_core.execution import (
            PortfolioPaperOrderApprovalStore,
            PortfolioPaperOrderStore,
            create_portfolio_paper_order_batch,
        )

        with tempfile.TemporaryDirectory() as tmp:
            portfolio_order_store = PortfolioPaperOrderStore(f"{tmp}/portfolio_orders.sqlite")
            portfolio_order_approval_store = PortfolioPaperOrderApprovalStore(f"{tmp}/portfolio_order_approvals.sqlite")
            portfolio_order_audit_store = AuditEventStore(f"{tmp}/audit_events.sqlite")
            portfolio_order_store.record(
                create_portfolio_paper_order_batch(
                    base_run_id="portfolio-run-approval-api",
                    portfolio_name="A-share approval basket",
                    batch_id="portfolio-paper-batch-approval",
                    created_at=datetime(2026, 5, 26, 8, 30, tzinfo=timezone.utc),
                    orders=[
                        {
                            "timestamp": "2026-05-26T08:00:00+00:00",
                            "eventType": "portfolio_paper_order",
                            "orderId": "portfolio-paper-run-a-buy",
                            "symbol": "600000",
                            "sourceRunId": "run-a",
                            "side": "buy",
                            "notionalValue": 9200.0,
                            "quantity": 1000.0,
                            "status": "pending_review",
                            "riskStatus": "passed",
                            "reason": "Requires operator review before simulated routing.",
                        }
                    ],
                )
            )

            class TestHandler(QuantApiHandler):
                portfolio_paper_order_store = portfolio_order_store
                portfolio_paper_order_approval_store = portfolio_order_approval_store
                audit_event_store = portfolio_order_audit_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                body = json.dumps(
                    {
                        "baseRunId": "portfolio-run-approval-api",
                        "batchId": "portfolio-paper-batch-approval",
                        "orderId": "portfolio-paper-run-a-buy",
                        "approved": True,
                        "reviewer": "operator-a",
                        "reviewedAt": "2026-05-26T08:45:00+00:00",
                        "reason": "Approved for paper simulation only.",
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/portfolio/paper-order-approvals",
                    body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
                connection.request(
                    "GET",
                    "/api/portfolio/paper-order-approvals?baseRunId=portfolio-run-approval-api&batchId=portfolio-paper-batch-approval",
                )
                list_response = connection.getresponse()
                list_payload = json.loads(list_response.read().decode("utf-8"))
                connection.request(
                    "GET",
                    "/api/audit/events?eventType=portfolio_paper_order_approval&runId=portfolio-run-approval-api",
                )
                audit_response = connection.getresponse()
                audit_payload = json.loads(audit_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 201)
        self.assertEqual(payload["approval"]["approvalId"], "portfolio-paper-order-approval-portfolio-paper-batch-approval-portfolio-paper-run-a-buy")
        self.assertTrue(payload["approval"]["approved"])
        self.assertEqual(payload["approval"]["reviewer"], "operator-a")
        self.assertEqual(payload["portfolioPaperOrderLifecycle"][0]["state"], "ready_for_simulation")
        self.assertTrue(payload["portfolioPaperOrderLifecycle"][0]["routable"])
        self.assertEqual(payload["portfolioPaperOrderLifecycle"][0]["approvedBy"], "operator-a")
        self.assertEqual(payload["auditEvent"]["eventType"], "portfolio_paper_order_approval")
        self.assertEqual(payload["auditEvent"]["metadata"]["approvalState"], "ready_for_simulation")
        self.assertTrue(payload["auditEvent"]["metadata"]["paperOnly"])
        self.assertEqual(list_response.status, 200)
        self.assertEqual(len(list_payload["approvals"]), 1)
        self.assertEqual(list_payload["portfolioPaperOrderLifecycle"][0]["state"], "ready_for_simulation")
        self.assertEqual(audit_response.status, 200)
        self.assertEqual(audit_payload["events"][0]["eventId"], payload["auditEvent"]["eventId"])

    def test_portfolio_paper_order_simulation_api_fills_ready_orders_and_records_audit_event(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.audit_events import AuditEventStore
        from quant_core.api import QuantApiHandler
        from quant_core.execution import (
            PortfolioPaperOrderApprovalStore,
            PortfolioPaperOrderSimulationStore,
            PortfolioPaperOrderStore,
            create_portfolio_paper_order_approval,
            create_portfolio_paper_order_batch,
        )

        with tempfile.TemporaryDirectory() as tmp:
            portfolio_order_store = PortfolioPaperOrderStore(f"{tmp}/portfolio_orders.sqlite")
            portfolio_order_approval_store = PortfolioPaperOrderApprovalStore(f"{tmp}/portfolio_order_approvals.sqlite")
            portfolio_order_simulation_store = PortfolioPaperOrderSimulationStore(f"{tmp}/portfolio_order_simulations.sqlite")
            portfolio_order_audit_store = AuditEventStore(f"{tmp}/audit_events.sqlite")
            portfolio_order_store.record(
                create_portfolio_paper_order_batch(
                    base_run_id="portfolio-run-simulation-api",
                    portfolio_name="A-share simulation basket",
                    batch_id="portfolio-paper-batch-simulation",
                    created_at=datetime(2026, 5, 26, 8, 30, tzinfo=timezone.utc),
                    orders=[
                        {
                            "timestamp": "2026-05-26T08:00:00+00:00",
                            "eventType": "portfolio_paper_order",
                            "orderId": "portfolio-paper-run-a-buy",
                            "symbol": "600000",
                            "sourceRunId": "run-a",
                            "side": "buy",
                            "notionalValue": 9200.0,
                            "quantity": 1000.0,
                            "status": "pending_review",
                            "riskStatus": "passed",
                            "reason": "Approved order should be paper-filled.",
                        }
                    ],
                )
            )
            portfolio_order_approval_store.record(
                create_portfolio_paper_order_approval(
                    base_run_id="portfolio-run-simulation-api",
                    batch_id="portfolio-paper-batch-simulation",
                    order_id="portfolio-paper-run-a-buy",
                    approved=True,
                    reviewer="operator-a",
                    reviewed_at="2026-05-26T08:45:00+00:00",
                    reason="Approved for paper simulation only.",
                )
            )

            class TestHandler(QuantApiHandler):
                portfolio_paper_order_store = portfolio_order_store
                portfolio_paper_order_approval_store = portfolio_order_approval_store
                portfolio_paper_order_simulation_store = portfolio_order_simulation_store
                audit_event_store = portfolio_order_audit_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                body = json.dumps(
                    {
                        "baseRunId": "portfolio-run-simulation-api",
                        "batchId": "portfolio-paper-batch-simulation",
                        "orderId": "portfolio-paper-run-a-buy",
                        "simulatedAt": "2026-05-26T08:46:00+00:00",
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/portfolio/paper-order-simulations",
                    body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
                connection.request(
                    "GET",
                    "/api/portfolio/paper-order-simulations?baseRunId=portfolio-run-simulation-api&batchId=portfolio-paper-batch-simulation",
                )
                list_response = connection.getresponse()
                list_payload = json.loads(list_response.read().decode("utf-8"))
                connection.request(
                    "GET",
                    "/api/audit/events?eventType=portfolio_paper_order_simulation&runId=portfolio-run-simulation-api",
                )
                audit_response = connection.getresponse()
                audit_payload = json.loads(audit_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 201)
        self.assertEqual(
            payload["simulation"]["simulationId"],
            "portfolio-paper-order-simulation-portfolio-paper-batch-simulation-portfolio-paper-run-a-buy",
        )
        self.assertEqual(payload["simulation"]["orderState"], "filled")
        self.assertEqual(payload["simulation"]["fillStatus"], "filled")
        self.assertEqual(payload["simulation"]["fillPrice"], 9.2)
        self.assertEqual(payload["simulation"]["quantity"], 1000.0)
        self.assertEqual(payload["simulation"]["notionalValue"], 9200.0)
        self.assertTrue(payload["simulation"]["paperOnly"])
        self.assertTrue(payload["simulation"]["liveExecutionBlocked"])
        self.assertEqual(payload["portfolioPaperOrderLifecycle"][0]["state"], "ready_for_simulation")
        self.assertEqual(payload["auditEvent"]["eventType"], "portfolio_paper_order_simulation")
        self.assertEqual(payload["auditEvent"]["metadata"]["orderState"], "filled")
        self.assertEqual(payload["auditEvent"]["metadata"]["approvalState"], "ready_for_simulation")
        self.assertEqual(list_response.status, 200)
        self.assertEqual(len(list_payload["simulations"]), 1)
        self.assertEqual(list_payload["simulations"][0]["orderId"], "portfolio-paper-run-a-buy")
        self.assertEqual(audit_response.status, 200)
        self.assertEqual(audit_payload["events"][0]["eventId"], payload["auditEvent"]["eventId"])

    def test_portfolio_paper_order_state_history_builds_order_timeline(self):
        from quant_core.execution import (
            build_portfolio_paper_order_lifecycle,
            build_portfolio_paper_order_state_history,
            create_portfolio_paper_order_approval,
            create_portfolio_paper_order_batch,
            create_portfolio_paper_order_simulation,
            portfolio_paper_order_approvals_to_map,
        )

        batch = create_portfolio_paper_order_batch(
            base_run_id="portfolio-run-state",
            portfolio_name="A-share state basket",
            batch_id="portfolio-paper-batch-state",
            created_at=datetime(2026, 5, 26, 8, 30, tzinfo=timezone.utc),
            orders=[
                {
                    "timestamp": "2026-05-26T08:00:00+00:00",
                    "eventType": "portfolio_paper_order",
                    "orderId": "portfolio-paper-run-a-buy",
                    "symbol": "600000",
                    "sourceRunId": "run-a",
                    "side": "buy",
                    "notionalValue": 9200.0,
                    "quantity": 1000.0,
                    "status": "pending_review",
                    "riskStatus": "passed",
                    "reason": "State history should show creation.",
                }
            ],
        )
        approval = create_portfolio_paper_order_approval(
            base_run_id="portfolio-run-state",
            batch_id="portfolio-paper-batch-state",
            order_id="portfolio-paper-run-a-buy",
            approved=True,
            reviewer="operator-a",
            reviewed_at="2026-05-26T08:45:00+00:00",
            reason="Approved for paper simulation only.",
        )
        lifecycle = build_portfolio_paper_order_lifecycle(
            batch,
            approvals=portfolio_paper_order_approvals_to_map([approval]),
        )
        simulation = create_portfolio_paper_order_simulation(
            batch=batch,
            lifecycle_row=lifecycle[0],
            simulated_at="2026-05-26T08:46:00+00:00",
        )

        history = build_portfolio_paper_order_state_history(
            batch,
            approvals=[approval],
            simulations=[simulation],
            generated_at=datetime(2026, 5, 26, 9, 0, tzinfo=timezone.utc),
        )

        self.assertEqual(history["schemaVersion"], 1)
        self.assertEqual(history["mode"], "portfolio_paper_order_state_history")
        self.assertEqual(history["baseRunId"], "portfolio-run-state")
        self.assertEqual(history["batchId"], "portfolio-paper-batch-state")
        self.assertEqual(history["summary"]["orderCount"], 1)
        self.assertEqual(history["summary"]["eventCount"], 4)
        self.assertEqual(history["summary"]["filledOrders"], 1)
        self.assertEqual(history["summary"]["liveBlockedEvents"], 1)
        order = history["orders"][0]
        self.assertEqual(order["orderId"], "portfolio-paper-run-a-buy")
        self.assertEqual(order["currentState"], "live_blocked")
        self.assertEqual(order["quantity"], 1000.0)
        self.assertEqual(order["notionalValue"], 9200.0)
        self.assertTrue(order["paperOnly"])
        self.assertTrue(order["liveExecutionBlocked"])
        self.assertEqual(
            [event["state"] for event in order["events"]],
            ["created", "operator_approved", "simulation_filled", "live_blocked"],
        )
        self.assertEqual(order["events"][1]["actor"], "operator-a")
        self.assertEqual(order["events"][2]["source"], "paper-simulator")
        self.assertTrue(order["events"][3]["liveExecutionBlocked"])

    def test_portfolio_paper_order_state_history_api_returns_batch_timeline(self):
        import json
        import tempfile
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.execution import (
            PortfolioPaperOrderApprovalStore,
            PortfolioPaperOrderSimulationStore,
            PortfolioPaperOrderStore,
            build_portfolio_paper_order_lifecycle,
            create_portfolio_paper_order_approval,
            create_portfolio_paper_order_batch,
            create_portfolio_paper_order_simulation,
            portfolio_paper_order_approvals_to_map,
        )

        with tempfile.TemporaryDirectory() as tmp:
            portfolio_order_store = PortfolioPaperOrderStore(f"{tmp}/portfolio_orders.sqlite")
            portfolio_order_approval_store = PortfolioPaperOrderApprovalStore(f"{tmp}/portfolio_order_approvals.sqlite")
            portfolio_order_simulation_store = PortfolioPaperOrderSimulationStore(f"{tmp}/portfolio_order_simulations.sqlite")
            batch = create_portfolio_paper_order_batch(
                base_run_id="portfolio-run-state-api",
                portfolio_name="A-share state API basket",
                batch_id="portfolio-paper-batch-state-api",
                created_at=datetime(2026, 5, 26, 8, 30, tzinfo=timezone.utc),
                orders=[
                    {
                        "timestamp": "2026-05-26T08:00:00+00:00",
                        "eventType": "portfolio_paper_order",
                        "orderId": "portfolio-paper-run-a-buy",
                        "symbol": "600000",
                        "sourceRunId": "run-a",
                        "side": "buy",
                        "notionalValue": 9200.0,
                        "quantity": 1000.0,
                        "status": "pending_review",
                        "riskStatus": "passed",
                        "reason": "State history API should show creation.",
                    }
                ],
            )
            approval = create_portfolio_paper_order_approval(
                base_run_id="portfolio-run-state-api",
                batch_id="portfolio-paper-batch-state-api",
                order_id="portfolio-paper-run-a-buy",
                approved=True,
                reviewer="operator-a",
                reviewed_at="2026-05-26T08:45:00+00:00",
                reason="Approved for paper simulation only.",
            )
            lifecycle = build_portfolio_paper_order_lifecycle(
                batch,
                approvals=portfolio_paper_order_approvals_to_map([approval]),
            )
            simulation = create_portfolio_paper_order_simulation(
                batch=batch,
                lifecycle_row=lifecycle[0],
                simulated_at="2026-05-26T08:46:00+00:00",
            )
            portfolio_order_store.record(batch)
            portfolio_order_approval_store.record(approval)
            portfolio_order_simulation_store.record(simulation)

            class TestHandler(QuantApiHandler):
                portfolio_paper_order_store = portfolio_order_store
                portfolio_paper_order_approval_store = portfolio_order_approval_store
                portfolio_paper_order_simulation_store = portfolio_order_simulation_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request(
                    "GET",
                    "/api/portfolio/paper-order-state-history?baseRunId=portfolio-run-state-api&batchId=portfolio-paper-batch-state-api",
                )
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["stateHistory"]["batchId"], "portfolio-paper-batch-state-api")
        self.assertEqual(payload["stateHistory"]["summary"]["eventCount"], 4)
        self.assertEqual(
            [event["state"] for event in payload["stateHistory"]["orders"][0]["events"]],
            ["created", "operator_approved", "simulation_filled", "live_blocked"],
        )
        self.assertTrue(payload["stateHistory"]["liveExecutionBlocked"])

    def test_portfolio_paper_order_replay_rebuilds_cash_positions_and_orders(self):
        from quant_core.execution import (
            PortfolioPaperOrderSimulation,
            build_portfolio_paper_order_replay,
        )

        simulations = [
            PortfolioPaperOrderSimulation(
                simulation_id="sim-buy-late",
                base_run_id="portfolio-run-replay",
                batch_id="batch-replay",
                order_id="order-buy-late",
                simulated_at=datetime(2026, 5, 26, 8, 48, tzinfo=timezone.utc),
                mode="portfolio_paper_order_simulation",
                symbol="600000",
                source_run_id="run-a",
                side="buy",
                quantity=500,
                fill_price=10.0,
                notional_value=5000.0,
                order_state="filled",
                fill_status="filled",
                reason="Second fill.",
                approved_by="operator-a",
            ),
            PortfolioPaperOrderSimulation(
                simulation_id="sim-buy-early",
                base_run_id="portfolio-run-replay",
                batch_id="batch-replay",
                order_id="order-buy-early",
                simulated_at=datetime(2026, 5, 26, 8, 46, tzinfo=timezone.utc),
                mode="portfolio_paper_order_simulation",
                symbol="600000",
                source_run_id="run-a",
                side="buy",
                quantity=1000,
                fill_price=9.2,
                notional_value=9200.0,
                order_state="filled",
                fill_status="filled",
                reason="First fill.",
                approved_by="operator-a",
            ),
        ]

        replay = build_portfolio_paper_order_replay(
            simulations,
            base_run_id="portfolio-run-replay",
            initial_cash=50_000,
            generated_at=datetime(2026, 5, 26, 9, 0, tzinfo=timezone.utc),
        )

        self.assertEqual(replay["baseRunId"], "portfolio-run-replay")
        self.assertEqual(replay["mode"], "portfolio_paper_order_replay")
        self.assertEqual(replay["account"]["cash"], 35800.0)
        self.assertEqual(replay["account"]["positions"], {"600000": 1500.0})
        self.assertEqual(replay["summary"]["filledOrders"], 2)
        self.assertEqual(replay["summary"]["buyNotional"], 14200.0)
        self.assertEqual(replay["summary"]["positionCount"], 1)
        self.assertEqual(replay["positions"][0]["symbol"], "600000")
        self.assertEqual(replay["positions"][0]["quantity"], 1500.0)
        self.assertAlmostEqual(replay["positions"][0]["avgCost"], 9.466667, places=6)
        self.assertEqual([order["orderId"] for order in replay["orders"]], ["order-buy-early", "order-buy-late"])
        self.assertEqual(replay["orders"][0]["cashAfter"], 40800.0)
        self.assertTrue(replay["paperOnly"])
        self.assertTrue(replay["liveExecutionBlocked"])

    def test_portfolio_paper_order_replay_api_returns_base_run_account_snapshot(self):
        import json
        import tempfile
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.execution import PortfolioPaperOrderSimulation, PortfolioPaperOrderSimulationStore

        with tempfile.TemporaryDirectory() as temp_dir:
            simulation_store = PortfolioPaperOrderSimulationStore(Path(temp_dir) / "portfolio_paper_simulations.sqlite")
            simulation_store.record(
                PortfolioPaperOrderSimulation(
                    simulation_id="sim-replay-api",
                    base_run_id="portfolio-run-replay-api",
                    batch_id="batch-replay-api",
                    order_id="order-replay-api",
                    simulated_at=datetime(2026, 5, 26, 8, 46, tzinfo=timezone.utc),
                    mode="portfolio_paper_order_simulation",
                    symbol="600000",
                    source_run_id="run-a",
                    side="buy",
                    quantity=1000,
                    fill_price=9.2,
                    notional_value=9200.0,
                    order_state="filled",
                    fill_status="filled",
                    reason="API replay fill.",
                    approved_by="operator-a",
                )
            )

            class TestHandler(QuantApiHandler):
                portfolio_paper_order_simulation_store = simulation_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request(
                    "GET",
                    "/api/portfolio/paper-order-replay?baseRunId=portfolio-run-replay-api&initialCash=50000",
                )
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["replay"]["baseRunId"], "portfolio-run-replay-api")
        self.assertEqual(payload["replay"]["account"]["cash"], 40800.0)
        self.assertEqual(payload["replay"]["positions"][0]["symbol"], "600000")
        self.assertEqual(payload["replay"]["orders"][0]["simulationId"], "sim-replay-api")
        self.assertTrue(payload["replay"]["liveExecutionBlocked"])

    def test_research_run_ai_review_api_records_review_for_run(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.ai_review_runs import AiReviewRunStore
        from quant_core.api import QuantApiHandler
        from quant_core.runs import ResearchRunAudit, ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

        audit = ResearchRunAudit(
            run_id="run-ai-review-api",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-ai-review-api",
            data_rows=2,
            metrics={"total_return_pct": 2.4, "max_drawdown_pct": 1.1, "win_rate_pct": 50, "trade_count": 1},
            decisions=[],
            execution_mode="paper_only",
            ai_report={"summary": "AI review", "risks": [], "improvements": [], "disclaimer": "No advice"},
            data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 2},
        )
        review_record = {
            "schemaVersion": 1,
            "recordType": "aiqt.aiReviewRun",
            "aiReviewId": "ai-review:run-ai-review-api:rev-ai-review-api",
            "runId": "run-ai-review-api",
            "createdAt": "2026-05-26T08:05:00+00:00",
            "market": "ashare",
            "symbol": "600000",
            "timeframe": "1d",
            "strategyRevision": "rev-ai-review-api",
            "executionMode": "paper_only",
            "status": "ready",
            "summary": {
                "citationCount": 7,
                "roundCount": 5,
                "decisionCount": 2,
                "parameterScanBound": True,
                "liveExecutionBlocked": True,
            },
            "dossier": {"status": "ready", "headline": "AI review bound", "summary": "Evidence only", "citations": []},
            "citations": [{"id": "parameter-scan", "label": "Parameter scan", "value": "SMA5", "detail": "re-audit", "tone": "warning"}],
            "rounds": [{"id": "technical-analysis", "phase": "analysis", "agent": "Technical Analyst", "verdict": "support"}],
            "decisionLog": [{"agent": "Technical", "message": "Evidence only.", "tone": "positive"}],
            "evidenceAnchors": [
                {
                    "id": "run:run-ai-review-api",
                    "type": "research-run",
                    "label": "Research run",
                    "reference": "run-ai-review-api",
                    "exportPath": "researchRun.runId",
                },
                {
                    "id": "citation:parameter-scan",
                    "type": "citation",
                    "label": "Parameter scan",
                    "reference": "parameter-scan",
                    "exportPath": "aiReviewRuns[].record.citations[parameter-scan]",
                },
            ],
            "boundary": "Evidence explanation only; no buy/sell instructions or guaranteed returns.",
        }

        with tempfile.TemporaryDirectory() as tmp:
            research_store = ResearchRunStore(f"{tmp}/runs.sqlite")
            review_store = AiReviewRunStore(f"{tmp}/ai_reviews.sqlite")
            research_store.record(audit)

            class TestHandler(QuantApiHandler):
                run_store = research_store
                ai_review_store = review_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                body = json.dumps(review_record).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/research/runs/run-ai-review-api/ai-reviews",
                    body=body,
                    headers={"Content-Type": "application/json"},
                )
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
                connection.request("GET", "/api/research/runs/run-ai-review-api/ai-reviews")
                list_response = connection.getresponse()
                list_payload = json.loads(list_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 201)
        self.assertEqual(payload["aiReview"]["runId"], "run-ai-review-api")
        self.assertEqual(payload["aiReview"]["record"]["summary"]["parameterScanBound"], True)
        self.assertEqual(list_response.status, 200)
        self.assertEqual(list_payload["aiReviews"][0]["aiReviewId"], "ai-review:run-ai-review-api:rev-ai-review-api")
        self.assertEqual(list_payload["aiReviews"][0]["record"]["boundary"], "Evidence explanation only; no buy/sell instructions or guaranteed returns.")

    def test_research_run_ai_review_api_pages_and_searches_review_records(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.ai_review_runs import AiReviewRunStore
        from quant_core.api import QuantApiHandler
        from quant_core.runs import ResearchRunAudit, ResearchRunStore

        def review_record(revision: str, created_at: str, headline: str) -> dict:
            return {
                "schemaVersion": 1,
                "recordType": "aiqt.aiReviewRun",
                "aiReviewId": f"ai-review:run-ai-review-page:{revision}",
                "runId": "run-ai-review-page",
                "createdAt": created_at,
                "market": "ashare",
                "symbol": "600000",
                "timeframe": "1d",
                "strategyRevision": revision,
                "executionMode": "paper_only",
                "status": "ready",
                "summary": {
                    "citationCount": 1,
                    "roundCount": 1,
                    "decisionCount": 1,
                    "parameterScanBound": False,
                    "liveExecutionBlocked": True,
                },
                "dossier": {"status": "ready", "headline": headline, "summary": "Evidence only", "citations": []},
                "citations": [],
                "rounds": [],
                "decisionLog": [],
                "boundary": "Evidence explanation only; no buy/sell instructions or guaranteed returns.",
            }

        audit = ResearchRunAudit(
            run_id="run-ai-review-page",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-ai-review-page",
            data_rows=2,
            metrics={"total_return_pct": 2.4, "max_drawdown_pct": 1.1, "win_rate_pct": 50, "trade_count": 1},
            decisions=[],
            execution_mode="paper_only",
            ai_report={"summary": "AI review", "risks": [], "improvements": [], "disclaimer": "No advice"},
            data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 2},
        )

        with tempfile.TemporaryDirectory() as tmp:
            research_store = ResearchRunStore(f"{tmp}/runs.sqlite")
            review_store = AiReviewRunStore(f"{tmp}/ai_reviews.sqlite")
            research_store.record(audit)
            review_store.record(review_record("rev-risk-old", "2026-05-26T08:01:00+00:00", "Risk review old"))
            review_store.record(review_record("rev-other", "2026-05-26T08:02:00+00:00", "Technical review"))
            review_store.record(review_record("rev-risk-new", "2026-05-26T08:03:00+00:00", "Risk review new"))

            class TestHandler(QuantApiHandler):
                run_store = research_store
                ai_review_store = review_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/research/runs/run-ai-review-page/ai-reviews?query=risk&limit=1&offset=1")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["pagination"], {"limit": 1, "offset": 1, "total": 2, "query": "risk"})
        self.assertEqual([item["aiReviewId"] for item in payload["aiReviews"]], ["ai-review:run-ai-review-page:rev-risk-old"])

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
            data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 1},
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

    def test_research_run_paper_execution_api_rejects_incomplete_data_quality(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.execution import PaperExecutionStore
        from quant_core.runs import ResearchRunAudit, ResearchRunStore

        audit = ResearchRunAudit(
            run_id="run-paper-incomplete-data",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="Incomplete data quality",
            strategy_revision="rev-paper-incomplete-data",
            data_rows=1,
            metrics={"total_return_pct": 2.4, "trade_count": 1},
            decisions=[],
            execution_mode="paper_only",
            ai_report={"summary": "Paper", "risks": [], "improvements": [], "disclaimer": "No advice"},
            data_quality={"source": "demo-fallback", "isComplete": False, "warnings": ["upstream unavailable"], "rows": 1},
            data_snapshot={
                "source": "demo-fallback",
                "isComplete": False,
                "warnings": ["upstream unavailable"],
                "rows": 1,
                "hash": "snapshot-paper-incomplete-data",
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
                "name": "Incomplete data quality",
                "revision": "rev-paper-incomplete-data",
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
                connection.request("POST", "/api/research/runs/run-paper-incomplete-data/paper-executions")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            executions = paper_store.list_by_run("run-paper-incomplete-data")

        self.assertEqual(response.status, 400)
        self.assertEqual(payload["error"], "invalid_paper_execution")
        self.assertEqual(payload["detail"], "paper_execution_data_quality_incomplete")
        self.assertEqual(executions, [])

    def test_research_run_promotion_api_and_export_include_candidate(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.execution import PaperExecutionStore, create_paper_execution_from_audit
        from quant_core.runs import ResearchRunAudit, ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

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
            data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 1},
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

    def test_golden_path_status_blocks_at_research_when_cache_exists_without_audit_run(self):
        from quant_core.golden_path import build_golden_path_status

        status = build_golden_path_status(
            market="ashare",
            symbol="600000",
            timeframe="1d",
            settings={
                "cache": {
                    "contexts": [
                        {
                            "market": "ashare",
                            "symbol": "600000",
                            "timeframe": "1d",
                            "rowCount": 500,
                            "freshness": "fresh",
                        }
                    ]
                },
                "safety": {"liveTradingAllowed": False},
            },
            runs=[],
            paper_executions=[],
        )

        self.assertEqual(status["schemaVersion"], 1)
        self.assertEqual(status["status"], "blocked")
        self.assertEqual(status["currentStepId"], "research-run")
        self.assertEqual(status["nextAction"]["id"], "run-pipeline")
        self.assertEqual(status["steps"][0]["id"], "market-data")
        self.assertEqual(status["steps"][0]["status"], "passed")
        self.assertEqual(status["steps"][0]["detail"], "500 fresh cached K-line rows are available for audited research.")
        self.assertEqual(status["steps"][1]["id"], "research-run")
        self.assertEqual(status["steps"][1]["status"], "blocked")
        self.assertEqual(status["summary"]["totalSteps"], 6)
        self.assertEqual(status["summary"]["passedSteps"], 1)
        self.assertEqual(status["summary"]["blockedSteps"], 5)
        self.assertEqual(status["summary"]["currentStepLabel"], "Audited research run")
        runbook_by_step = {item["stepId"]: item for item in status["runbook"]}
        self.assertEqual(len(status["runbook"]), 6)
        self.assertTrue(runbook_by_step["market-data"]["passed"])
        self.assertEqual(runbook_by_step["market-data"]["workspaceId"], "market")
        self.assertIsNone(runbook_by_step["market-data"]["blocker"])
        self.assertTrue(runbook_by_step["research-run"]["current"])
        self.assertEqual(runbook_by_step["research-run"]["workspaceId"], "research")
        self.assertEqual(runbook_by_step["research-run"]["actionId"], "run-pipeline")
        self.assertEqual(runbook_by_step["research-run"]["actionLabel"], "Run research pipeline")
        self.assertIn("Run the research pipeline", runbook_by_step["research-run"]["blocker"])
        workspaces = {workspace["id"]: workspace for workspace in status["workspaces"]}
        self.assertEqual(workspaces["market"]["status"], "ready")
        self.assertEqual(workspaces["research"]["status"], "needs_run")
        self.assertEqual(workspaces["backtest"]["status"], "needs_run")
        self.assertEqual(workspaces["execution"]["status"], "blocked")
        self.assertEqual(workspaces["research"]["actionId"], "run-pipeline")

    def test_golden_path_status_points_stale_cache_to_market_refresh_before_research(self):
        from quant_core.golden_path import build_golden_path_status

        status = build_golden_path_status(
            market="ashare",
            symbol="600000",
            timeframe="1d",
            settings={
                "cache": {
                    "contexts": [
                        {
                            "market": "ashare",
                            "symbol": "600000",
                            "timeframe": "1d",
                            "rowCount": 120,
                            "freshness": "stale",
                        }
                    ]
                },
                "safety": {"liveTradingAllowed": False},
            },
            runs=[],
            paper_executions=[],
        )

        self.assertEqual(status["status"], "review")
        self.assertEqual(status["currentStepId"], "market-data")
        self.assertEqual(status["nextAction"]["id"], "refresh-data")
        self.assertEqual(status["nextAction"]["targetWorkspace"], "market")
        self.assertEqual(status["nextAction"]["reason"], "120 cached rows are stale. Refresh market data before audited research.")
        self.assertEqual(status["steps"][0]["status"], "review")
        self.assertEqual(status["steps"][0]["detail"], "120 cached rows are stale. Refresh market data before audited research.")
        runbook_by_step = {item["stepId"]: item for item in status["runbook"]}
        self.assertEqual(runbook_by_step["market-data"]["actionId"], "refresh-data")
        self.assertEqual(runbook_by_step["market-data"]["blocker"], "120 cached rows are stale. Refresh market data before audited research.")
        workspaces = {workspace["id"]: workspace for workspace in status["workspaces"]}
        self.assertEqual(workspaces["market"]["status"], "needs_run")
        self.assertEqual(workspaces["market"]["reason"], "120 cached rows are stale. Refresh market data before audited research.")
        self.assertEqual(workspaces["market"]["actionId"], "refresh-data")

    def test_golden_path_status_points_missing_cache_to_market_refresh_before_research(self):
        from quant_core.golden_path import build_golden_path_status

        status = build_golden_path_status(
            market="ashare",
            symbol="600000",
            timeframe="1d",
            settings={"cache": {"contexts": []}, "safety": {"liveTradingAllowed": False}},
            runs=[],
            paper_executions=[],
        )

        expected_detail = "No cached K-line context exists for the selected instrument. Refresh market data before audited research."
        self.assertEqual(status["status"], "blocked")
        self.assertEqual(status["currentStepId"], "market-data")
        self.assertEqual(status["nextAction"]["id"], "refresh-data")
        self.assertEqual(status["nextAction"]["reason"], expected_detail)
        self.assertEqual(status["steps"][0]["status"], "blocked")
        self.assertEqual(status["steps"][0]["detail"], expected_detail)
        runbook_by_step = {item["stepId"]: item for item in status["runbook"]}
        self.assertEqual(runbook_by_step["market-data"]["blocker"], expected_detail)
        workspaces = {workspace["id"]: workspace for workspace in status["workspaces"]}
        self.assertEqual(workspaces["market"]["status"], "needs_run")
        self.assertEqual(workspaces["market"]["reason"], expected_detail)

    def test_golden_path_status_points_empty_cache_to_market_refresh_before_research(self):
        from quant_core.golden_path import build_golden_path_status

        status = build_golden_path_status(
            market="ashare",
            symbol="600000",
            timeframe="1d",
            settings={
                "cache": {
                    "contexts": [
                        {
                            "market": "ashare",
                            "symbol": "600000",
                            "timeframe": "1d",
                            "rowCount": 0,
                            "freshness": "empty",
                        }
                    ]
                },
                "safety": {"liveTradingAllowed": False},
            },
            runs=[],
            paper_executions=[],
        )

        expected_detail = "The selected context has no usable cached K-line rows. Refresh market data before audited research."
        self.assertEqual(status["status"], "blocked")
        self.assertEqual(status["currentStepId"], "market-data")
        self.assertEqual(status["nextAction"]["id"], "refresh-data")
        self.assertEqual(status["nextAction"]["reason"], expected_detail)
        self.assertEqual(status["steps"][0]["status"], "blocked")
        self.assertEqual(status["steps"][0]["detail"], expected_detail)
        runbook_by_step = {item["stepId"]: item for item in status["runbook"]}
        self.assertEqual(runbook_by_step["market-data"]["blocker"], expected_detail)
        workspaces = {workspace["id"]: workspace for workspace in status["workspaces"]}
        self.assertEqual(workspaces["market"]["status"], "needs_run")
        self.assertEqual(workspaces["market"]["reason"], expected_detail)

    def test_golden_path_status_marks_fresh_cache_review_without_matching_refresh_evidence(self):
        from quant_core.golden_path import build_golden_path_status

        status = build_golden_path_status(
            market="ashare",
            symbol="600000",
            timeframe="1d",
            settings={
                "cache": {
                    "contexts": [
                        {
                            "market": "ashare",
                            "symbol": "600000",
                            "timeframe": "1d",
                            "rowCount": 500,
                            "freshness": "fresh",
                        }
                    ]
                },
                "safety": {"liveTradingAllowed": False},
            },
            runs=[],
            paper_executions=[],
            watchlist_refreshes=[],
        )

        expected_detail = (
            "500 fresh cached K-line rows are available, but no matching watchlist cache refresh evidence covers "
            "ASHARE · 600000 · 1d. Refresh watchlist cache before audited research."
        )
        self.assertEqual(status["status"], "review")
        self.assertEqual(status["currentStepId"], "market-data")
        self.assertEqual(status["nextAction"]["id"], "refresh-watchlist-cache")
        self.assertEqual(status["nextAction"]["targetWorkspace"], "market")
        self.assertEqual(status["nextAction"]["reason"], expected_detail)
        self.assertEqual(status["steps"][0]["status"], "review")
        self.assertEqual(status["steps"][0]["detail"], expected_detail)
        runbook_by_step = {item["stepId"]: item for item in status["runbook"]}
        self.assertEqual(runbook_by_step["market-data"]["actionId"], "refresh-watchlist-cache")
        self.assertEqual(runbook_by_step["market-data"]["blocker"], expected_detail)
        workspaces = {workspace["id"]: workspace for workspace in status["workspaces"]}
        self.assertEqual(workspaces["market"]["status"], "needs_run")
        self.assertEqual(workspaces["market"]["reason"], expected_detail)
        self.assertEqual(workspaces["market"]["actionId"], "refresh-watchlist-cache")

    def test_golden_path_status_passes_with_matching_refresh_evidence(self):
        from quant_core.golden_path import build_golden_path_status

        status = build_golden_path_status(
            market="ashare",
            symbol="600000",
            timeframe="1d",
            settings={
                "cache": {
                    "contexts": [
                        {
                            "market": "ashare",
                            "symbol": "600000",
                            "timeframe": "1d",
                            "rowCount": 500,
                            "freshness": "fresh",
                        }
                    ]
                },
                "safety": {"liveTradingAllowed": False},
            },
            runs=[],
            paper_executions=[],
            watchlist_refreshes=[
                {
                    "runId": "cache-refresh-ready",
                    "createdAt": "2026-06-10T06:00:00+00:00",
                    "items": [
                        {
                            "market": "ashare",
                            "symbol": "600000",
                            "name": "浦发银行",
                            "timeframe": "1d",
                            "status": "refreshed",
                            "upsertedRows": 240,
                            "quality": {"source": "tencent", "isComplete": True, "warnings": [], "rows": 240},
                            "error": None,
                        }
                    ],
                }
            ],
        )

        self.assertEqual(status["status"], "blocked")
        self.assertEqual(status["currentStepId"], "research-run")
        self.assertEqual(status["nextAction"]["id"], "run-pipeline")
        self.assertEqual(status["steps"][0]["status"], "passed")
        self.assertEqual(
            status["steps"][0]["detail"],
            "500 fresh cached K-line rows are available. Matching watchlist cache refresh evidence cache-refresh-ready confirms 240 rows from tencent.",
        )
        runbook_by_step = {item["stepId"]: item for item in status["runbook"]}
        self.assertIsNone(runbook_by_step["market-data"]["blocker"])
        workspaces = {workspace["id"]: workspace for workspace in status["workspaces"]}
        self.assertEqual(workspaces["market"]["status"], "ready")
        self.assertEqual(workspaces["research"]["actionId"], "run-pipeline")

    def test_golden_path_status_marks_market_calendar_review_after_fresh_data(self):
        from quant_core.golden_path import build_golden_path_status

        status = build_golden_path_status(
            market="ashare",
            symbol="600000",
            timeframe="1d",
            settings={
                "cache": {
                    "contexts": [
                        {
                            "market": "ashare",
                            "symbol": "600000",
                            "timeframe": "1d",
                            "rowCount": 500,
                            "freshness": "fresh",
                        }
                    ]
                },
                "safety": {"liveTradingAllowed": False},
            },
            runs=[],
            paper_executions=[],
            watchlist_refreshes=[
                {
                    "runId": "cache-refresh-ready",
                    "createdAt": "2026-06-10T06:00:00+00:00",
                    "items": [
                        {
                            "market": "ashare",
                            "symbol": "600000",
                            "name": "浦发银行",
                            "timeframe": "1d",
                            "status": "refreshed",
                            "upsertedRows": 240,
                            "quality": {"source": "tencent", "isComplete": True, "warnings": [], "rows": 240},
                            "error": None,
                        }
                    ],
                }
            ],
            market_calendar={
                "market": "ashare",
                "timezone": "Asia/Shanghai",
                "status": "break",
                "isOpen": False,
                "session": "lunch_break",
                "asOf": "2026-06-11T12:00:00+08:00",
                "tradingDay": "2026-06-11",
                "nextOpen": "2026-06-11T13:00:00+08:00",
                "nextClose": "2026-06-11T15:00:00+08:00",
                "detail": "A-share lunch break.",
                "warnings": ["Static session template only; exchange holiday calendar is not configured."],
                "source": "static-session-template",
            },
        )

        expected_detail = (
            "500 fresh cached K-line rows are available. Matching watchlist cache refresh evidence "
            "cache-refresh-ready confirms 240 rows from tencent. Market calendar review: "
            "break/lunch_break · next open 2026-06-11T13:00:00+08:00 · "
            "Static session template only; exchange holiday calendar is not configured."
        )
        self.assertEqual(status["status"], "review")
        self.assertEqual(status["currentStepId"], "market-data")
        self.assertEqual(status["nextAction"]["id"], "run-pipeline")
        self.assertEqual(status["nextAction"]["targetWorkspace"], "research")
        self.assertEqual(status["nextAction"]["reason"], expected_detail)
        self.assertEqual(status["steps"][0]["status"], "review")
        self.assertEqual(status["steps"][0]["detail"], expected_detail)
        runbook_by_step = {item["stepId"]: item for item in status["runbook"]}
        self.assertEqual(len(status["runbook"]), 6)
        self.assertEqual(runbook_by_step["market-data"]["actionId"], "run-pipeline")
        self.assertEqual(runbook_by_step["market-data"]["targetWorkspace"], "research")
        self.assertEqual(runbook_by_step["market-data"]["blocker"], expected_detail)
        workspaces = {workspace["id"]: workspace for workspace in status["workspaces"]}
        self.assertEqual(workspaces["market"]["status"], "needs_run")
        self.assertEqual(workspaces["market"]["actionId"], "run-pipeline")
        self.assertEqual(workspaces["market"]["reason"], expected_detail)

    def test_golden_path_status_advances_to_paper_execution_after_audited_ai_run(self):
        from quant_core.golden_path import build_golden_path_status
        from quant_core.runs import ResearchRunAudit

        audit = ResearchRunAudit(
            run_id="run-golden-ai",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend",
            strategy_revision="rev-golden",
            data_rows=240,
            metrics={"total_return_pct": 12.4, "max_drawdown_pct": 5.8, "trade_count": 3},
            decisions=[{"agent": "Technical Analyst", "message": "Evidence bound"}],
            execution_mode="paper_only",
            ai_report={
                "summary": "Trend evidence is positive but needs paper execution.",
                "risks": ["Live trading disabled"],
                "improvements": ["Run paper execution"],
                "disclaimer": "No investment advice",
            },
            data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 240},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 240,
                "hash": "snapshot-golden",
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
                "name": "SMA trend",
                "revision": "rev-golden",
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

        status = build_golden_path_status(
            market="ashare",
            symbol="600000",
            timeframe="1d",
            settings={
                "cache": {
                    "contexts": [
                        {
                            "market": "ashare",
                            "symbol": "600000",
                            "timeframe": "1d",
                            "rowCount": 500,
                            "freshness": "fresh",
                        }
                    ]
                },
                "safety": {"liveTradingAllowed": False},
            },
            runs=[audit],
            paper_executions=[],
        )

        steps = {step["id"]: step for step in status["steps"]}
        self.assertEqual(status["latestRunId"], "run-golden-ai")
        self.assertEqual(status["currentStepId"], "paper-execution")
        self.assertEqual(status["nextAction"]["id"], "submit-paper-order")
        self.assertEqual(steps["research-run"]["status"], "passed")
        self.assertEqual(steps["backtest-report"]["status"], "passed")
        self.assertEqual(steps["ai-review"]["status"], "passed")
        self.assertEqual(steps["paper-execution"]["status"], "review")
        self.assertEqual(steps["live-gate"]["status"], "blocked")
        self.assertEqual(status["summary"]["passedSteps"], 4)
        self.assertEqual(status["summary"]["reviewSteps"], 1)
        self.assertEqual(status["summary"]["blockedSteps"], 1)
        self.assertEqual(status["summary"]["nextActionId"], "submit-paper-order")
        runbook_by_step = {item["stepId"]: item for item in status["runbook"]}
        self.assertTrue(runbook_by_step["paper-execution"]["current"])
        self.assertEqual(runbook_by_step["paper-execution"]["workspaceId"], "execution")
        self.assertEqual(runbook_by_step["paper-execution"]["actionId"], "submit-paper-order")
        self.assertEqual(runbook_by_step["paper-execution"]["actionLabel"], "Submit paper order")
        self.assertEqual(runbook_by_step["live-gate"]["workspaceId"], "settings")
        self.assertEqual(runbook_by_step["live-gate"]["actionId"], "certify-live-adapter")
        workspaces = {workspace["id"]: workspace for workspace in status["workspaces"]}
        self.assertEqual(workspaces["research"]["status"], "ready")
        self.assertEqual(workspaces["backtest"]["status"], "ready")
        self.assertEqual(workspaces["ai-review"]["status"], "ready")
        self.assertEqual(workspaces["execution"]["status"], "needs_run")
        self.assertEqual(workspaces["execution"]["actionId"], "submit-paper-order")

    def test_golden_path_status_api_returns_selected_context_progress(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.cache_refresh_runs import (
            WatchlistCacheRefreshItem,
            WatchlistCacheRefreshRunStore,
            create_watchlist_cache_refresh_run,
        )
        from quant_core.domain import DataQuality, OHLCVBar
        from quant_core.execution import PaperExecutionStore
        from quant_core.runs import ResearchRunAudit, ResearchRunStore

        audit = ResearchRunAudit(
            run_id="run-golden-api",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend",
            strategy_revision="rev-golden-api",
            data_rows=1,
            metrics={"total_return_pct": 3.2, "max_drawdown_pct": 1.5, "trade_count": 1},
            decisions=[],
            execution_mode="paper_only",
            ai_report={"summary": "Audited", "risks": ["Paper pending"], "improvements": [], "disclaimer": "No advice"},
            data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 1},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-golden-api",
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
                "name": "SMA trend",
                "revision": "rev-golden-api",
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
            cache = MarketDataCache(f"{tmp}/market.sqlite")
            cache.upsert_bars(
                [
                    OHLCVBar(
                        market="ashare",
                        symbol="600000",
                        timeframe="1d",
                        timestamp=datetime.now(timezone.utc),
                        open=9.1,
                        high=9.3,
                        low=9.0,
                        close=9.2,
                        volume=1200000,
                    )
                ]
            )
            research_store = ResearchRunStore(f"{tmp}/runs.sqlite")
            paper_store = PaperExecutionStore(f"{tmp}/paper.sqlite")
            refresh_store = WatchlistCacheRefreshRunStore(f"{tmp}/watchlist_cache_refreshes.sqlite")
            refresh_store.record(
                create_watchlist_cache_refresh_run(
                    run_id="cache-refresh-golden-api",
                    created_at=datetime(2026, 6, 10, 6, 0, tzinfo=timezone.utc),
                    timeframe="1d",
                    requested_limit=240,
                    items=[
                        WatchlistCacheRefreshItem(
                            market="ashare",
                            symbol="600000",
                            name="浦发银行",
                            timeframe="1d",
                            requested_limit=240,
                            upserted_rows=240,
                            status="refreshed",
                            quality=DataQuality(source="tencent", is_complete=True, warnings=[], rows=240),
                        )
                    ],
                )
            )
            research_store.record(audit)

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.cache = cache
            TestHandler.run_store = research_store
            TestHandler.paper_execution_store = paper_store
            TestHandler.watchlist_cache_refresh_store = refresh_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/golden-path/status?market=ashare&symbol=600000&timeframe=1d")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["goldenPath"]["latestRunId"], "run-golden-api")
        self.assertEqual(payload["goldenPath"]["currentStepId"], "paper-execution")
        self.assertEqual(payload["goldenPath"]["nextAction"]["targetWorkspace"], "execution")
        self.assertEqual(payload["goldenPath"]["summary"]["nextActionId"], "submit-paper-order")
        self.assertEqual(payload["goldenPath"]["runbook"][4]["stepId"], "paper-execution")
        self.assertEqual(payload["goldenPath"]["runbook"][4]["workspaceId"], "execution")
        self.assertEqual(payload["goldenPath"]["runbook"][4]["actionId"], "submit-paper-order")
        self.assertEqual(payload["goldenPath"]["workspaces"][0]["id"], "market")
        self.assertEqual(payload["goldenPath"]["workspaces"][0]["status"], "ready")

    def test_golden_path_status_api_uses_watchlist_refresh_evidence(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.cache_refresh_runs import (
            WatchlistCacheRefreshItem,
            WatchlistCacheRefreshRunStore,
            create_watchlist_cache_refresh_run,
        )
        from quant_core.domain import DataQuality, OHLCVBar
        from quant_core.execution import PaperExecutionStore
        from quant_core.runs import ResearchRunStore

        with tempfile.TemporaryDirectory() as tmp:
            cache = MarketDataCache(f"{tmp}/market.sqlite")
            cache.upsert_bars(
                [
                    OHLCVBar(
                        market="ashare",
                        symbol="600000",
                        timeframe="1d",
                        timestamp=datetime.now(timezone.utc),
                        open=9.1,
                        high=9.3,
                        low=9.0,
                        close=9.2,
                        volume=1200000,
                    )
                ]
            )
            refresh_store = WatchlistCacheRefreshRunStore(f"{tmp}/watchlist_cache_refreshes.sqlite")
            refresh_store.record(
                create_watchlist_cache_refresh_run(
                    run_id="cache-refresh-api-ready",
                    created_at=datetime(2026, 6, 10, 6, 0, tzinfo=timezone.utc),
                    timeframe="1d",
                    requested_limit=240,
                    items=[
                        WatchlistCacheRefreshItem(
                            market="ashare",
                            symbol="600000",
                            name="浦发银行",
                            timeframe="1d",
                            requested_limit=240,
                            upserted_rows=240,
                            status="refreshed",
                            quality=DataQuality(source="tencent", is_complete=True, warnings=[], rows=240),
                        )
                    ],
                )
            )
            research_store = ResearchRunStore(f"{tmp}/runs.sqlite")
            paper_store = PaperExecutionStore(f"{tmp}/paper.sqlite")

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.cache = cache
            TestHandler.run_store = research_store
            TestHandler.paper_execution_store = paper_store
            TestHandler.watchlist_cache_refresh_store = refresh_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/golden-path/status?market=ashare&symbol=600000&timeframe=1d")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["goldenPath"]["status"], "review")
        self.assertEqual(payload["goldenPath"]["currentStepId"], "market-data")
        self.assertEqual(payload["goldenPath"]["nextAction"]["id"], "run-pipeline")
        self.assertEqual(payload["goldenPath"]["nextAction"]["targetWorkspace"], "research")
        self.assertEqual(payload["goldenPath"]["steps"][0]["status"], "review")
        self.assertIn(
            "1 fresh cached K-line rows are available. Matching watchlist cache refresh evidence cache-refresh-api-ready confirms 240 rows from tencent.",
            payload["goldenPath"]["steps"][0]["detail"],
        )
        self.assertIn("Market calendar review:", payload["goldenPath"]["steps"][0]["detail"])
        self.assertIn("Static session template only", payload["goldenPath"]["steps"][0]["detail"])

    def test_research_run_paper_execution_api_returns_404_for_missing_run(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.execution import PaperExecutionStore
        from quant_core.runs import ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

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

    def test_watchlist_store_persists_ordered_instruments(self):
        from quant_core.terminal import Instrument
        from quant_core.watchlist import WatchlistStore

        with tempfile.TemporaryDirectory() as tmp:
            store = WatchlistStore(Path(tmp) / "watchlist.sqlite")
            store.replace_all(
                [
                    Instrument(symbol="MSFT", name="Microsoft", market="us", change_pct=0.0, price=420.5),
                    Instrument(symbol="600000", name="浦发银行", market="ashare", change_pct=0.0, price=9.21),
                    Instrument(symbol="MSFT", name="Duplicate", market="us", change_pct=0.0, price=1.0),
                ]
            )

            saved = store.list_instruments()

        self.assertEqual(
            [(instrument.market, instrument.symbol, instrument.name, instrument.price) for instrument in saved],
            [("us", "MSFT", "Microsoft", 420.5), ("ashare", "600000", "浦发银行", 9.21)],
        )

    def test_watchlist_api_persists_user_watchlist_for_workspace(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.watchlist import WatchlistStore

        class EmptyQuoteAdapter:
            def fetch_quotes(self, instruments):
                return []

        with tempfile.TemporaryDirectory() as tmp:
            watchlist_store = WatchlistStore(Path(tmp) / "watchlist.sqlite")

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.watchlist_store = watchlist_store
            TestHandler.quote_adapter = EmptyQuoteAdapter()

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request(
                    "PUT",
                    "/api/watchlist",
                    body=json.dumps(
                        {
                            "watchlist": [
                                {"market": "us", "symbol": "MSFT", "name": "Microsoft", "price": 420.5, "changePct": 1.2},
                                {"market": "ashare", "symbol": "600000", "name": "浦发银行", "price": 9.21, "changePct": -2.33},
                            ]
                        },
                        ensure_ascii=False,
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                save_response = connection.getresponse()
                save_payload = json.loads(save_response.read().decode("utf-8"))

                connection.request("GET", "/api/workspace")
                workspace_response = connection.getresponse()
                workspace_payload = json.loads(workspace_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(save_response.status, 200)
        self.assertEqual(save_payload["watchlist"][0]["symbol"], "MSFT")
        self.assertEqual(workspace_response.status, 200)
        self.assertEqual(workspace_payload["watchlist"][0]["symbol"], "MSFT")
        self.assertEqual(workspace_payload["watchlist"][0]["name"], "Microsoft")
        self.assertEqual(workspace_payload["selectedInstrument"]["symbol"], "MSFT")

    def test_research_workspace_state_store_persists_context(self):
        from quant_core.workspace_state import ResearchWorkspaceStateStore

        with tempfile.TemporaryDirectory() as tmp:
            store = ResearchWorkspaceStateStore(Path(tmp) / "workspace_state.sqlite")
            state = store.save(
                {
                    "market": "us",
                    "symbol": "msft",
                    "name": "Microsoft",
                    "timeframe": "5m",
                    "workspaceId": "research",
                }
            )

            saved = store.get()

        self.assertIsNotNone(saved)
        self.assertEqual(state.symbol, "MSFT")
        self.assertEqual(saved.market, "us")
        self.assertEqual(saved.symbol, "MSFT")
        self.assertEqual(saved.name, "Microsoft")
        self.assertEqual(saved.timeframe, "5m")
        self.assertEqual(saved.workspace_id, "research")

    def test_research_workspace_state_api_restores_workspace_context(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.watchlist import WatchlistStore
        from quant_core.workspace_state import ResearchWorkspaceStateStore

        class EmptyQuoteAdapter:
            def fetch_quotes(self, instruments):
                return []

        with tempfile.TemporaryDirectory() as tmp:
            workspace_state_store = ResearchWorkspaceStateStore(Path(tmp) / "workspace_state.sqlite")
            watchlist_store = WatchlistStore(Path(tmp) / "watchlist.sqlite")

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.workspace_state_store = workspace_state_store
            TestHandler.watchlist_store = watchlist_store
            TestHandler.quote_adapter = EmptyQuoteAdapter()

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request(
                    "PUT",
                    "/api/research/workspace-state",
                    body=json.dumps(
                        {
                            "state": {
                                "market": "us",
                                "symbol": "MSFT",
                                "name": "Microsoft",
                                "timeframe": "5m",
                                "workspaceId": "research",
                            }
                        },
                        ensure_ascii=False,
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                save_response = connection.getresponse()
                save_payload = json.loads(save_response.read().decode("utf-8"))

                connection.request("GET", "/api/workspace")
                workspace_response = connection.getresponse()
                workspace_payload = json.loads(workspace_response.read().decode("utf-8"))

                connection.request("GET", "/api/research/workspace-state")
                state_response = connection.getresponse()
                state_payload = json.loads(state_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(save_response.status, 200)
        self.assertEqual(save_payload["state"]["symbol"], "MSFT")
        self.assertEqual(workspace_response.status, 200)
        self.assertEqual(workspace_payload["selectedInstrument"]["symbol"], "MSFT")
        self.assertEqual(workspace_payload["selectedInstrument"]["name"], "Microsoft")
        self.assertEqual(workspace_payload["selectedTimeframe"], "5m")
        self.assertEqual(workspace_payload["watchlist"][0]["symbol"], "MSFT")
        self.assertEqual(workspace_payload["researchWorkspaceState"]["workspaceId"], "research")
        self.assertEqual(workspace_payload["researchWorkspaceState"]["symbol"], "MSFT")
        self.assertEqual(state_response.status, 200)
        self.assertEqual(state_payload["state"]["workspaceId"], "research")

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
        from quant_core.strategy_library import StrategyLibraryStore

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
                strategy_store = StrategyLibraryStore(f"{tmp}/strategies.sqlite")
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

    def test_research_api_locks_matching_watchlist_refresh_evidence_into_data_snapshot(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread
        from urllib.parse import urlencode

        from quant_core.ai import LocalResearchAssistant
        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.cache_refresh_runs import (
            WatchlistCacheRefreshRunStore,
            create_watchlist_cache_refresh_run,
            watchlist_cache_refresh_item_from_quality,
        )
        from quant_core.domain import DataQuality
        from quant_core.runs import ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore
        from quant_core.terminal import Instrument

        with tempfile.TemporaryDirectory() as tmp:
            refresh_store = WatchlistCacheRefreshRunStore(f"{tmp}/watchlist_cache_refreshes.sqlite")
            refresh_run = refresh_store.record(
                create_watchlist_cache_refresh_run(
                    items=[
                        watchlist_cache_refresh_item_from_quality(
                            instrument=Instrument(symbol="600000", name="浦发银行", market="ashare", change_pct=0),
                            timeframe="1d",
                            requested_limit=120,
                            quality=DataQuality(source="tencent", is_complete=True, warnings=[], rows=120),
                            upserted_rows=120,
                        )
                    ],
                    timeframe="1d",
                    requested_limit=120,
                )
            )

            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(f"{tmp}/market.sqlite")
                assistant = LocalResearchAssistant()
                run_store = ResearchRunStore(f"{tmp}/runs.sqlite")
                strategy_store = StrategyLibraryStore(f"{tmp}/strategies.sqlite")
                watchlist_cache_refresh_store = refresh_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            params = urlencode(
                {
                    "market": "ashare",
                    "symbol": "600000",
                    "timeframe": "1d",
                    "limit": "120",
                    "watchlistRefreshRunId": refresh_run.run_id,
                }
            )
            try:
                connection.request("GET", f"/api/research/run?{params}")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
                run_id = payload["researchRun"]["runId"]
                connection.request("GET", f"/api/research/runs/{run_id}")
                detail_response = connection.getresponse()
                detail_payload = json.loads(detail_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(detail_response.status, 200)
        evidence = detail_payload["run"]["dataSnapshot"]["preparationEvidence"]
        self.assertEqual(evidence["kind"], "watchlist_cache_refresh")
        self.assertEqual(evidence["runId"], refresh_run.run_id)
        self.assertEqual(evidence["market"], "ashare")
        self.assertEqual(evidence["symbol"], "600000")
        self.assertEqual(evidence["timeframe"], "1d")
        self.assertEqual(evidence["status"], "refreshed")
        self.assertEqual(evidence["upsertedRows"], 120)
        self.assertEqual(evidence["quality"]["source"], "tencent")

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
        from quant_core.strategy_library import StrategyLibraryStore

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
                strategy_store = StrategyLibraryStore(f"{tmp}/strategies.sqlite")
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

    def test_terminal_research_run_records_market_calendar_snapshot(self):
        from quant_core.cache import MarketDataCache
        from quant_core.research import run_terminal_research
        from quant_core.runs import ResearchRunStore, research_run_audit_to_payload
        from quant_core.terminal import terminal_workspace_to_payload

        with tempfile.TemporaryDirectory() as tmp:
            store = ResearchRunStore(f"{tmp}/runs.sqlite")
            workspace = run_terminal_research(
                market="ashare",
                symbol="600000",
                timeframe="1d",
                cache=MarketDataCache(f"{tmp}/market.sqlite"),
                run_store=store,
                data_limit=120,
            )
            audit = store.get(workspace.research_run.run_id)

        self.assertIsNotNone(audit)
        workspace_payload = terminal_workspace_to_payload(workspace)
        immediate_calendar = workspace_payload["researchRun"]["dataSnapshot"]["marketCalendar"]
        persisted_calendar = research_run_audit_to_payload(audit, include_data_snapshot=True)["dataSnapshot"]["marketCalendar"]

        self.assertEqual(immediate_calendar["market"], "ashare")
        self.assertEqual(immediate_calendar["timezone"], "Asia/Shanghai")
        self.assertEqual(immediate_calendar["source"], "static-session-template")
        self.assertIn(immediate_calendar["status"], ["open", "closed", "break"])
        self.assertIsInstance(immediate_calendar["isOpen"], bool)
        self.assertIsInstance(immediate_calendar["warnings"], list)
        self.assertEqual(persisted_calendar["market"], immediate_calendar["market"])
        self.assertEqual(persisted_calendar["source"], "static-session-template")
        self.assertEqual(persisted_calendar["asOf"], immediate_calendar["asOf"])

    def test_terminal_research_uses_sqlite_cache_when_adapter_unavailable(self):
        from quant_core.cache import MarketDataCache
        from quant_core.domain import OHLCVBar
        from quant_core.research import run_terminal_research
        from quant_core.runs import ResearchRunStore
        from quant_core.terminal import terminal_workspace_to_payload

        class OfflineAdapter:
            def fetch_ohlcv(self, request, limit=160):
                raise RuntimeError("research upstream offline")

        cached_bars = [
            OHLCVBar(
                market="ashare",
                symbol="600000",
                timeframe="1d",
                timestamp=datetime(2026, 1, 1, tzinfo=timezone.utc) + timedelta(days=index),
                open=9.0 + index * 0.1,
                high=9.2 + index * 0.1,
                low=8.8 + index * 0.1,
                close=9.1 + index * 0.1,
                volume=1000 + index,
            )
            for index in range(30)
        ]

        with tempfile.TemporaryDirectory() as tmp:
            cache = MarketDataCache(f"{tmp}/market.sqlite")
            store = ResearchRunStore(f"{tmp}/runs.sqlite")
            cache.upsert_bars(cached_bars)
            workspace = run_terminal_research(
                market="ashare",
                symbol="600000",
                timeframe="1d",
                adapter=OfflineAdapter(),
                cache=cache,
                run_store=store,
                data_limit=24,
            )
            audit = store.get(workspace.research_run.run_id)

        payload = terminal_workspace_to_payload(workspace)

        self.assertIsNotNone(audit)
        self.assertEqual(audit.data_quality["source"], "local-cache")
        self.assertTrue(audit.data_quality["isComplete"])
        self.assertEqual(audit.data_quality["rows"], 24)
        self.assertTrue(any("research upstream offline" in warning for warning in audit.data_quality["warnings"]))
        self.assertEqual(audit.data_snapshot["source"], "local-cache")
        self.assertEqual(audit.data_snapshot["rows"], 24)
        self.assertEqual(audit.data_snapshot["bars"][-1]["close"], cached_bars[-1].close)
        self.assertEqual(payload["researchRun"]["dataSnapshot"]["source"], "local-cache")
        self.assertEqual(payload["researchRun"]["dataRows"], 24)

    def test_terminal_research_prefers_cache_over_incomplete_fallback_data(self):
        from quant_core.cache import MarketDataCache
        from quant_core.domain import DataQuality, OHLCVBar
        from quant_core.research import run_terminal_research
        from quant_core.runs import ResearchRunStore

        cached_bars = [
            OHLCVBar(
                market="ashare",
                symbol="600000",
                timeframe="1d",
                timestamp=datetime(2026, 1, 1, tzinfo=timezone.utc) + timedelta(days=index),
                open=9.0 + index * 0.1,
                high=9.2 + index * 0.1,
                low=8.8 + index * 0.1,
                close=9.1 + index * 0.1,
                volume=1000 + index,
            )
            for index in range(30)
        ]
        fallback_bars = [
            OHLCVBar(
                market="ashare",
                symbol="600000",
                timeframe="1d",
                timestamp=datetime(2026, 3, 1, tzinfo=timezone.utc) + timedelta(days=index),
                open=100 + index,
                high=101 + index,
                low=99 + index,
                close=100.5 + index,
                volume=10,
            )
            for index in range(5)
        ]

        class IncompleteFallbackAdapter:
            def fetch_ohlcv(self, request, limit=160):
                return fallback_bars, DataQuality(
                    source="demo-fallback",
                    is_complete=False,
                    warnings=["upstream returned generated fallback"],
                    rows=len(fallback_bars),
                )

        with tempfile.TemporaryDirectory() as tmp:
            cache = MarketDataCache(f"{tmp}/market.sqlite")
            store = ResearchRunStore(f"{tmp}/runs.sqlite")
            cache.upsert_bars(cached_bars)
            workspace = run_terminal_research(
                market="ashare",
                symbol="600000",
                timeframe="1d",
                adapter=IncompleteFallbackAdapter(),
                cache=cache,
                run_store=store,
                data_limit=24,
            )
            audit = store.get(workspace.research_run.run_id)
            cache_stats = cache.stats()

        self.assertIsNotNone(audit)
        self.assertEqual(audit.data_quality["source"], "local-cache")
        self.assertTrue(audit.data_quality["isComplete"])
        self.assertTrue(any("demo-fallback" in warning for warning in audit.data_quality["warnings"]))
        self.assertEqual(audit.data_snapshot["bars"][-1]["close"], cached_bars[-1].close)
        self.assertEqual(cache_stats["row_count"], len(cached_bars))

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
        self.assertEqual(payload["researchRun"]["dataQuality"], latest[0].data_quality)
        self.assertEqual(payload["researchRun"]["strategyConfig"], latest[0].strategy_config)
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

    def test_research_run_import_allows_frontend_audit_evidence_metadata(self):
        from quant_core.runs import ResearchRunAudit, research_run_export_to_payload, research_run_import_to_audit

        audit = ResearchRunAudit(
            run_id="run-audit-summary",
            created_at=datetime(2026, 6, 4, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-audit-summary",
            data_rows=1,
            metrics={"total_return_pct": 1.2, "trade_count": 1},
            decisions=[{"agent": "AI Summary", "message": "Summary metadata", "tone": "ai"}],
            execution_mode="paper_only",
            ai_report={"summary": "Original", "risks": ["Risk"], "improvements": [], "disclaimer": "No advice"},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "start": "2026-06-04T08:00:00+00:00",
                "end": "2026-06-04T08:00:00+00:00",
                "hash": "snapshot-audit-summary",
                "bars": [
                    {
                        "timestamp": "2026-06-04T08:00:00+00:00",
                        "timestampMs": 1780560000000,
                        "open": 9.1,
                        "high": 9.3,
                        "low": 9.0,
                        "close": 9.2,
                        "volume": 1200000,
                    }
                ],
            },
            backtest_trades=[{"id": "trade-1"}],
            backtest_equity_curve=[{"timestamp": "2026-06-04T08:00:00+00:00", "equity": 101200.0}],
        )
        export_package = research_run_export_to_payload(audit)
        export_package["auditEvidenceSummary"] = {
            "kind": "aiqt.auditEvidenceSummary",
            "schemaVersion": 1,
            "runId": "run-audit-summary",
            "generatedAt": "2026-06-04T08:05:00+00:00",
            "auditQuery": "manual-smoke",
            "packageQuery": "manifest:run-audit-summary",
            "importDiffQuery": "manifest:run-audit-summary",
            "focusQuery": "manifest:run-audit-summary",
            "deepLinkStatus": "loaded",
            "deepLinkError": None,
            "package": {"ready": 5, "missing": 0, "blocked": 0, "matched": 1, "total": 9},
            "importDiff": {"changes": 0, "adds": 0, "blocked": 0, "matched": 1, "total": 11},
            "copyText": "AIQT Audit Evidence Summary\nRun: run-audit-summary",
        }
        export_package["auditReport"] = {
            "kind": "aiqt.auditReport",
            "schemaVersion": 1,
            "runId": "run-audit-summary",
            "generatedAt": "2026-06-04T08:05:00+00:00",
            "format": "text/markdown",
            "fileName": "run-audit-summary-audit-evidence-report.md",
            "contentSha256": {"algorithm": "sha256", "hash": "e" * 64},
            "contentMarkdown": "# AIQuant Audit Evidence Report\n",
            "evidenceSummary": export_package["auditEvidenceSummary"],
        }
        export_package["backtestReport"] = {
            "kind": "aiqt.backtestReport",
            "schemaVersion": 1,
            "runId": "run-audit-summary",
            "generatedAt": "2026-06-04T08:05:00+00:00",
            "format": "text/markdown",
            "fileName": "run-audit-summary-backtest-report.md",
            "contentSha256": {"algorithm": "sha256", "hash": "b" * 64},
            "contentMarkdown": "# AIQuant Audited Backtest Report\n",
            "market": "ashare",
            "symbol": "600000",
            "timeframe": "1d",
            "strategyRevision": "rev-audit-summary",
            "executionMode": "paper_only",
            "dataRows": 1,
            "runComparisonRows": 1,
            "boundary": "historical audited evidence only; no investment advice",
        }

        imported = research_run_import_to_audit(export_package)

        self.assertEqual(imported.run_id, "run-audit-summary")
        self.assertEqual(imported.strategy_revision, "rev-audit-summary")

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

    def test_research_run_import_rejects_promotion_candidate_count_mismatch(self):
        from quant_core.runs import ResearchRunAudit, research_run_export_to_payload, research_run_import_to_audit

        audit = ResearchRunAudit(
            run_id="run-promotion-counts",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-promotion-counts",
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
                "hash": "snapshot-promotion-counts",
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
        export_package = research_run_export_to_payload(
            audit,
            promotion_candidate={
                "candidateId": "promotion-run-promotion-counts",
                "runId": "run-promotion-counts",
                "createdAt": "2026-05-26T08:05:00+00:00",
                "market": "ashare",
                "symbol": "600000",
                "timeframe": "1d",
                "strategyRevision": "rev-promotion-counts",
                "latestPaperExecutionId": "paper-counts",
                "status": "certification_pending",
                "headline": "Live promotion pending certification",
                "summary": "Paper passed; live route blocked.",
                "liveTradingAllowed": False,
                "evidence": {"paperExecutions": 1, "filledOrders": 1, "passedPaperRiskChecks": 1},
                "stages": [],
            },
        )
        export_package.pop("integrity", None)
        export_package["manifest"]["artifactCounts"]["promotionCandidates"] = 0

        with self.assertRaisesRegex(ValueError, "artifact_count_promotion_candidates_mismatch"):
            research_run_import_to_audit(export_package)

    def test_research_run_export_import_preserves_portfolio_paper_order_batches(self):
        from quant_core.execution import create_portfolio_paper_order_batch, portfolio_paper_order_batch_to_payload
        from quant_core.runs import (
            research_run_export_to_payload,
            research_run_import_portfolio_paper_orders,
            research_run_import_to_audit,
        )

        audit = self._sample_research_run_audit(
            run_id="run-portfolio-orders-export",
            strategy_revision="rev-portfolio-orders-export",
        )
        batch = create_portfolio_paper_order_batch(
            base_run_id=audit.run_id,
            portfolio_name="Portable basket",
            source="portfolio_backtest",
            created_at=datetime(2026, 5, 26, 8, 7, tzinfo=timezone.utc),
            batch_id="portfolio-paper-batch-portable",
            orders=[
                {
                    "timestamp": "2026-05-26T08:07:00+00:00",
                    "eventType": "portfolio_paper_order",
                    "orderId": "portfolio-paper-order-1",
                    "symbol": "600000",
                    "sourceRunId": audit.run_id,
                    "side": "buy",
                    "notionalValue": 19341.0,
                    "quantity": 2100,
                    "status": "pending_review",
                    "riskStatus": "passed",
                    "reason": "Portfolio rebalance requires operator review.",
                }
            ],
        )

        export_package = research_run_export_to_payload(
            audit,
            portfolio_paper_orders=[portfolio_paper_order_batch_to_payload(batch)],
        )
        imported = research_run_import_to_audit(export_package)
        imported_batches = research_run_import_portfolio_paper_orders(export_package, base_run_id=audit.run_id)

        self.assertEqual(imported.run_id, audit.run_id)
        self.assertEqual(export_package["manifest"]["artifactCounts"]["portfolioPaperOrderBatches"], 1)
        self.assertEqual(export_package["portfolioPaperOrderBatches"][0]["batchId"], "portfolio-paper-batch-portable")
        self.assertEqual(imported_batches[0]["baseRunId"], audit.run_id)
        self.assertEqual(imported_batches[0]["summary"]["riskStatusCounts"], {"passed": 1})

        tampered_package = dict(export_package)
        tampered_package.pop("integrity", None)
        tampered_package["manifest"] = dict(export_package["manifest"])
        tampered_package["manifest"]["artifactCounts"] = dict(export_package["manifest"]["artifactCounts"])
        tampered_package["manifest"]["artifactCounts"]["portfolioPaperOrderBatches"] = 0
        with self.assertRaisesRegex(ValueError, "artifact_count_portfolio_paper_order_batches_mismatch"):
            research_run_import_to_audit(tampered_package)

    def test_research_run_import_rejects_ai_review_run_id_mismatch(self):
        from quant_core.runs import ResearchRunAudit, research_run_export_to_payload, research_run_import_to_audit

        audit = ResearchRunAudit(
            run_id="run-ai-review-mismatch",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="SMA trend demo",
            strategy_revision="rev-ai-review-mismatch",
            data_rows=1,
            metrics={"total_return_pct": 1.2, "trade_count": 1},
            decisions=[],
            execution_mode="paper_only",
            ai_report={"summary": "AI review mismatch", "risks": [], "improvements": [], "disclaimer": "No advice"},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-ai-review-mismatch",
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
        ai_review = {
            "aiReviewId": "ai-review:run-ai-review-mismatch:rev-ai-review-mismatch",
            "runId": "run-ai-review-mismatch",
            "createdAt": "2026-05-26T08:05:00+00:00",
            "record": {
                "schemaVersion": 1,
                "recordType": "aiqt.aiReviewRun",
                "aiReviewId": "ai-review:run-ai-review-mismatch:rev-ai-review-mismatch",
                "runId": "run-ai-review-mismatch",
                "createdAt": "2026-05-26T08:05:00+00:00",
                "market": "ashare",
                "symbol": "600000",
                "timeframe": "1d",
                "strategyRevision": "rev-ai-review-mismatch",
                "executionMode": "paper_only",
                "status": "ready",
                "summary": {"citationCount": 1, "roundCount": 1, "decisionCount": 1, "parameterScanBound": True, "liveExecutionBlocked": True},
                "dossier": {"status": "ready", "headline": "Evidence", "summary": "Evidence only", "citations": []},
                "citations": [{"id": "parameter-scan", "label": "Parameter scan", "value": "SMA20", "detail": "audit", "tone": "warning"}],
                "rounds": [{"id": "risk-manager", "phase": "risk", "agent": "Risk Manager", "verdict": "risk"}],
                "decisionLog": [{"agent": "Risk", "message": "Evidence only.", "tone": "risk"}],
                "boundary": "Evidence explanation only; no buy/sell instructions or guaranteed returns.",
            },
        }
        export_package = research_run_export_to_payload(audit, ai_review_runs=[ai_review])
        export_package.pop("integrity", None)
        export_package["aiReviewRuns"][0]["record"]["runId"] = "run-other"

        with self.assertRaisesRegex(ValueError, "ai_review_record_run_id_mismatch"):
            research_run_import_to_audit(export_package)

    def test_research_run_import_api_persists_export_package_for_replay(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.research_notes import ResearchNoteStore
        from quant_core.runs import ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

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
                "artifactCounts": {
                    "bars": 2,
                    "trades": 1,
                    "equityPoints": 1,
                    "decisions": 1,
                    "aiRisks": 1,
                    "researchNotes": 1,
                },
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
                "researchNote": {
                    "market": "ashare",
                    "symbol": "600000",
                    "timeframe": "1d",
                    "body": "导入包里的研究笔记应恢复到本地笔记库。",
                    "updatedAt": "2026-05-26T08:03:00+00:00",
                },
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
            strategy_library = StrategyLibraryStore(f"{tmp}/strategies.sqlite")
            note_library = ResearchNoteStore(f"{tmp}/notes.sqlite")

            class TestHandler(QuantApiHandler):
                run_store = store
                strategy_store = strategy_library
                note_store = note_library

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
                connection.request("GET", "/api/strategies?market=ashare&symbol=600000&limit=5")
                strategies_response = connection.getresponse()
                strategies_payload = json.loads(strategies_response.read().decode("utf-8"))
                connection.request("GET", "/api/research/notes?market=ashare&symbol=600000&timeframe=1d")
                notes_response = connection.getresponse()
                notes_payload = json.loads(notes_response.read().decode("utf-8"))
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
        self.assertEqual(strategies_response.status, 200)
        self.assertEqual(len(strategies_payload["strategies"]), 1)
        self.assertEqual(strategies_payload["strategies"][0]["revision"], "rev-import")
        self.assertEqual(strategies_payload["strategies"][0]["status"], "audited")
        self.assertEqual(strategies_payload["strategies"][0]["auditRunId"], "run-import")
        self.assertEqual(strategies_payload["strategies"][0]["strategySnapshot"]["entry"], "Close > SMA20")
        self.assertEqual(notes_response.status, 200)
        self.assertEqual(notes_payload["note"]["body"], "导入包里的研究笔记应恢复到本地笔记库。")
        self.assertEqual(notes_payload["note"]["symbol"], "600000")

    def test_research_run_import_api_rolls_back_partial_writes_on_store_failure(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.ai_review_runs import AiReviewRunStore
        from quant_core.api import QuantApiHandler
        from quant_core.execution import (
            PortfolioPaperOrderStore,
            PaperExecutionStore,
            create_paper_execution_from_audit,
            paper_execution_record_to_payload,
        )
        from quant_core.research_notes import ResearchNoteStore
        from quant_core.runs import ResearchRunAudit, ResearchRunStore, research_run_export_to_payload
        from quant_core.strategy_library import StrategyLibraryStore

        audit = ResearchRunAudit(
            run_id="run-import-rollback",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="Rollback SMA trend",
            strategy_revision="rev-import-rollback",
            data_rows=1,
            metrics={"total_return_pct": 1.2, "max_drawdown_pct": 0.4, "trade_count": 1},
            decisions=[{"agent": "AI Summary", "message": "Rollback evidence only", "tone": "ai"}],
            execution_mode="paper_only",
            ai_report={"summary": "Rollback", "risks": ["Import write can fail"], "improvements": [], "disclaimer": "No advice"},
            data_quality={"source": "tencent", "isComplete": True, "warnings": [], "rows": 1},
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-import-rollback",
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
            research_note={
                "market": "ashare",
                "symbol": "600000",
                "timeframe": "1d",
                "body": "Imported note should be rolled back.",
                "updatedAt": "2026-05-26T08:03:00+00:00",
            },
            strategy_config={
                "name": "Rollback SMA trend",
                "revision": "rev-import-rollback",
                "market": "ashare",
                "symbols": ["600000"],
                "timeframe": "1d",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                "risk": {"positionPct": 0.2, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.12},
            },
            backtest_trades=[{"id": "trade-rollback"}],
            backtest_equity_curve=[{"timestamp": "2026-05-26T08:00:00+00:00", "equity": 101200.0}],
        )
        paper_execution = paper_execution_record_to_payload(create_paper_execution_from_audit(audit))
        ai_review = {
            "schemaVersion": 1,
            "recordType": "aiqt.aiReviewRun",
            "aiReviewId": "ai-review:run-import-rollback:rev-import-rollback",
            "runId": "run-import-rollback",
            "createdAt": "2026-05-26T08:05:00+00:00",
            "market": "ashare",
            "symbol": "600000",
            "timeframe": "1d",
            "strategyRevision": "rev-import-rollback",
            "executionMode": "paper_only",
            "status": "ready",
            "summary": {"citationCount": 1, "roundCount": 1, "decisionCount": 1, "liveExecutionBlocked": True},
            "dossier": {"status": "ready", "headline": "Rollback AI review", "summary": "Evidence only", "citations": []},
            "citations": [],
            "rounds": [],
            "decisionLog": [],
            "boundary": "Evidence explanation only; no buy/sell instructions or guaranteed returns.",
        }
        export_package = research_run_export_to_payload(
            audit,
            paper_executions=[paper_execution],
            ai_review_runs=[
                {
                    "aiReviewId": ai_review["aiReviewId"],
                    "runId": ai_review["runId"],
                    "createdAt": ai_review["createdAt"],
                    "record": ai_review,
                }
            ],
        )

        with tempfile.TemporaryDirectory() as tmp:
            research_store = ResearchRunStore(f"{tmp}/runs.sqlite")
            note_library = ResearchNoteStore(f"{tmp}/notes.sqlite")
            strategy_library = StrategyLibraryStore(f"{tmp}/strategies.sqlite")
            paper_library = PaperExecutionStore(f"{tmp}/paper.sqlite")
            portfolio_order_library = PortfolioPaperOrderStore(f"{tmp}/portfolio_orders.sqlite")

            class FailingAiReviewStore(AiReviewRunStore):
                def record(self, record):
                    raise RuntimeError("ai_review_write_failed")

            review_store = FailingAiReviewStore(f"{tmp}/ai_reviews.sqlite")
            note_library.save(
                market="ashare",
                symbol="600000",
                timeframe="1d",
                body="Existing note must survive rollback.",
                updated_at=datetime(2026, 5, 25, 8, 0, tzinfo=timezone.utc),
            )

            class TestHandler(QuantApiHandler):
                run_store = research_store
                note_store = note_library
                strategy_store = strategy_library
                paper_execution_store = paper_library
                portfolio_paper_order_store = portfolio_order_library
                ai_review_store = review_store

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
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            restored_run = research_store.get("run-import-rollback")
            restored_note = note_library.get(market="ashare", symbol="600000", timeframe="1d")
            restored_strategy = strategy_library.get("rev-import-rollback")
            restored_paper_executions = paper_library.list_by_run("run-import-rollback")
            restored_ai_review_count = review_store.count_by_run("run-import-rollback")

        self.assertEqual(response.status, 500)
        self.assertEqual(payload["error"], "research_run_import_write_failed")
        self.assertEqual(payload["detail"], "ai_review_write_failed")
        self.assertIsNone(restored_run)
        self.assertEqual(restored_note.body, "Existing note must survive rollback.")
        self.assertIsNone(restored_strategy)
        self.assertEqual(restored_paper_executions, [])
        self.assertEqual(restored_ai_review_count, 0)

    def test_research_run_import_rollback_restores_all_previous_paper_executions(self):
        import sqlite3

        from quant_core.ai_review_runs import AiReviewRunStore
        from quant_core.api import _persist_research_run_import
        from quant_core.execution import (
            PortfolioPaperOrderApprovalStore,
            PortfolioPaperOrderSimulationStore,
            PortfolioPaperOrderStore,
            PaperExecutionStore,
            create_paper_execution_from_audit,
            create_portfolio_paper_order_batch,
        )
        from quant_core.research_notes import ResearchNoteStore
        from quant_core.runs import ResearchRunAudit, ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

        audit = ResearchRunAudit(
            run_id="run-import-rollback-many-paper",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="Rollback many paper executions",
            strategy_revision="rev-import-rollback-many-paper",
            data_rows=1,
            metrics={"total_return_pct": 1.2, "max_drawdown_pct": 0.4, "trade_count": 1},
            decisions=[{"agent": "AI Summary", "message": "Rollback evidence only", "tone": "ai"}],
            execution_mode="paper_only",
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-import-rollback-many-paper",
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
        )
        failing_review = {
            "schemaVersion": 1,
            "recordType": "aiqt.aiReviewRun",
            "aiReviewId": "ai-review:run-import-rollback-many-paper:failing",
            "runId": "run-import-rollback-many-paper",
            "createdAt": "2026-05-26T08:05:00+00:00",
            "boundary": "Evidence explanation only; no buy/sell instructions or guaranteed returns.",
        }

        with tempfile.TemporaryDirectory() as tmp:
            research_store = ResearchRunStore(f"{tmp}/runs.sqlite")
            note_library = ResearchNoteStore(f"{tmp}/notes.sqlite")
            strategy_library = StrategyLibraryStore(f"{tmp}/strategies.sqlite")
            paper_library = PaperExecutionStore(f"{tmp}/paper.sqlite")
            portfolio_order_library = PortfolioPaperOrderStore(f"{tmp}/portfolio_orders.sqlite")
            portfolio_order_approval_library = PortfolioPaperOrderApprovalStore(
                f"{tmp}/portfolio_order_approvals.sqlite"
            )
            portfolio_order_simulation_library = PortfolioPaperOrderSimulationStore(
                f"{tmp}/portfolio_order_simulations.sqlite"
            )

            class FailingAiReviewStore(AiReviewRunStore):
                def record(self, record):
                    raise RuntimeError("ai_review_write_failed")

            review_store = FailingAiReviewStore(f"{tmp}/ai_reviews.sqlite")
            research_store.record(audit)
            for index in range(51):
                paper_library.record(
                    create_paper_execution_from_audit(
                        audit,
                        created_at=audit.created_at + timedelta(minutes=index),
                    )
                )
            portfolio_order_library.record(
                create_portfolio_paper_order_batch(
                    base_run_id=audit.run_id,
                    portfolio_name="Previous basket",
                    source="portfolio_backtest",
                    created_at=audit.created_at + timedelta(minutes=2),
                    batch_id="portfolio-paper-batch-previous",
                    orders=[
                        {
                            "timestamp": "2026-05-26T08:02:00+00:00",
                            "eventType": "portfolio_paper_order",
                            "orderId": "portfolio-paper-order-previous",
                            "symbol": "600000",
                            "sourceRunId": audit.run_id,
                            "side": "buy",
                            "notionalValue": 9000,
                            "quantity": 1000,
                            "status": "pending_review",
                            "riskStatus": "review",
                            "reason": "Existing batch must survive rollback.",
                        }
                    ],
                )
            )
            imported_batch = create_portfolio_paper_order_batch(
                base_run_id=audit.run_id,
                portfolio_name="Imported basket",
                source="portfolio_backtest",
                created_at=audit.created_at + timedelta(minutes=3),
                batch_id="portfolio-paper-batch-imported",
                orders=[
                    {
                        "timestamp": "2026-05-26T08:03:00+00:00",
                        "eventType": "portfolio_paper_order",
                        "orderId": "portfolio-paper-order-imported",
                        "symbol": "600000",
                        "sourceRunId": audit.run_id,
                        "side": "buy",
                        "notionalValue": 18000,
                        "quantity": 2000,
                        "status": "pending_review",
                        "riskStatus": "review",
                        "reason": "Imported batch should be removed on rollback.",
                    }
                ],
            )

            with self.assertRaises(RuntimeError):
                _persist_research_run_import(
                    run_store=research_store,
                    note_store=note_library,
                    strategy_store=strategy_library,
                    paper_execution_store=paper_library,
                    portfolio_paper_order_store=portfolio_order_library,
                    portfolio_paper_order_approval_store=portfolio_order_approval_library,
                    portfolio_paper_order_simulation_store=portfolio_order_simulation_library,
                    ai_review_store=review_store,
                    audit=audit,
                    imported_note=None,
                    paper_execution_records=[],
                    portfolio_paper_order_batches=[imported_batch],
                    portfolio_paper_order_approvals=[],
                    portfolio_paper_order_simulations=[],
                    ai_review_records=[failing_review],
                )

            connection = sqlite3.connect(f"{tmp}/paper.sqlite")
            try:
                paper_count = connection.execute(
                    "select count(*) from paper_executions where run_id = ?",
                    ("run-import-rollback-many-paper",),
                ).fetchone()[0]
            finally:
                connection.close()
            portfolio_batch_ids = [
                batch.batch_id for batch in portfolio_order_library.list_all_by_base_run("run-import-rollback-many-paper")
            ]

        self.assertEqual(paper_count, 51)
        self.assertEqual(portfolio_batch_ids, ["portfolio-paper-batch-previous"])

    def test_research_run_import_api_can_undo_successful_import(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.ai_review_runs import AiReviewRunStore
        from quant_core.api import QuantApiHandler
        from quant_core.execution import PaperExecutionStore, create_paper_execution_from_audit, paper_execution_record_to_payload
        from quant_core.research_import_undo import ResearchRunImportUndoStore
        from quant_core.research_notes import ResearchNoteStore
        from quant_core.runs import ResearchRunAudit, ResearchRunStore, research_run_export_to_payload
        from quant_core.strategy_library import StrategyLibraryStore

        previous_audit = ResearchRunAudit(
            run_id="run-import-undo",
            created_at=datetime(2026, 5, 25, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="Previous SMA trend",
            strategy_revision="rev-import-undo-old",
            data_rows=1,
            metrics={"total_return_pct": -1.0, "max_drawdown_pct": 1.5, "trade_count": 1},
            decisions=[{"agent": "AI Summary", "message": "Previous evidence", "tone": "warning"}],
            execution_mode="paper_only",
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-import-undo-old",
                "bars": [
                    {
                        "timestamp": "2026-05-25T08:00:00+00:00",
                        "timestampMs": 1779696000000,
                        "open": 8.9,
                        "high": 9.0,
                        "low": 8.7,
                        "close": 8.8,
                        "volume": 1100000,
                    }
                ],
            },
            research_note={
                "market": "ashare",
                "symbol": "600000",
                "timeframe": "1d",
                "body": "Previous note should return after undo.",
                "updatedAt": "2026-05-25T08:03:00+00:00",
            },
            strategy_config={
                "name": "Previous SMA trend",
                "revision": "rev-import-undo-old",
                "market": "ashare",
                "symbols": ["600000"],
                "timeframe": "1d",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                "risk": {"positionPct": 0.1, "stopLossPct": 0.06, "takeProfitPct": 0.14, "maxDrawdownPct": 0.1},
            },
        )
        imported_audit = ResearchRunAudit(
            run_id="run-import-undo",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="Imported SMA trend",
            strategy_revision="rev-import-undo-new",
            data_rows=1,
            metrics={"total_return_pct": 3.2, "max_drawdown_pct": 0.5, "trade_count": 1},
            decisions=[{"agent": "AI Summary", "message": "Imported evidence", "tone": "positive"}],
            execution_mode="paper_only",
            data_snapshot={
                "source": "tencent",
                "isComplete": True,
                "warnings": [],
                "rows": 1,
                "hash": "snapshot-import-undo-new",
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
            research_note={
                "market": "ashare",
                "symbol": "600000",
                "timeframe": "1d",
                "body": "Imported note should be undone.",
                "updatedAt": "2026-05-26T08:03:00+00:00",
            },
            strategy_config={
                "name": "Imported SMA trend",
                "revision": "rev-import-undo-new",
                "market": "ashare",
                "symbols": ["600000"],
                "timeframe": "1d",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 10}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 10}}],
                "risk": {"positionPct": 0.2, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.12},
            },
        )
        previous_review = {
            "schemaVersion": 1,
            "recordType": "aiqt.aiReviewRun",
            "aiReviewId": "ai-review:run-import-undo:old",
            "runId": "run-import-undo",
            "createdAt": "2026-05-25T08:05:00+00:00",
            "market": "ashare",
            "symbol": "600000",
            "timeframe": "1d",
            "strategyRevision": "rev-import-undo-old",
            "executionMode": "paper_only",
            "status": "ready",
            "summary": {"citationCount": 1, "roundCount": 1, "decisionCount": 1, "liveExecutionBlocked": True},
            "dossier": {"status": "ready", "headline": "Previous AI review", "summary": "Old evidence", "citations": []},
            "citations": [],
            "rounds": [],
            "decisionLog": [],
            "boundary": "Evidence explanation only; no buy/sell instructions or guaranteed returns.",
        }
        imported_review = {
            **previous_review,
            "aiReviewId": "ai-review:run-import-undo:new",
            "createdAt": "2026-05-26T08:05:00+00:00",
            "strategyRevision": "rev-import-undo-new",
            "dossier": {"status": "ready", "headline": "Imported AI review", "summary": "New evidence", "citations": []},
        }
        imported_package = research_run_export_to_payload(
            imported_audit,
            paper_executions=[paper_execution_record_to_payload(create_paper_execution_from_audit(imported_audit))],
            ai_review_runs=[
                {
                    "aiReviewId": imported_review["aiReviewId"],
                    "runId": imported_review["runId"],
                    "createdAt": imported_review["createdAt"],
                    "record": imported_review,
                }
            ],
        )

        with tempfile.TemporaryDirectory() as tmp:
            research_store = ResearchRunStore(f"{tmp}/runs.sqlite")
            note_library = ResearchNoteStore(f"{tmp}/notes.sqlite")
            strategy_library = StrategyLibraryStore(f"{tmp}/strategies.sqlite")
            paper_library = PaperExecutionStore(f"{tmp}/paper.sqlite")
            review_store = AiReviewRunStore(f"{tmp}/ai_reviews.sqlite")
            undo_store = ResearchRunImportUndoStore(f"{tmp}/import_undo.sqlite")

            research_store.record(previous_audit)
            note_library.save(
                market="ashare",
                symbol="600000",
                timeframe="1d",
                body="Previous note should return after undo.",
                updated_at=datetime(2026, 5, 25, 8, 3, tzinfo=timezone.utc),
            )
            strategy_library.save_payload(previous_audit.strategy_config, audit_run_id=previous_audit.run_id)
            paper_library.record(create_paper_execution_from_audit(previous_audit))
            review_store.record(previous_review)

            class TestHandler(QuantApiHandler):
                run_store = research_store
                note_store = note_library
                strategy_store = strategy_library
                paper_execution_store = paper_library
                ai_review_store = review_store
                import_undo_store = undo_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                body = json.dumps(imported_package).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/research/runs/import",
                    body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                import_response = connection.getresponse()
                import_payload = json.loads(import_response.read().decode("utf-8"))
                undo_body = json.dumps(
                    {
                        "undoToken": import_payload.get("undoToken"),
                        "expectedRunId": "run-import-undo",
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/research/runs/import/undo",
                    body=undo_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(undo_body))},
                )
                undo_response = connection.getresponse()
                undo_payload = json.loads(undo_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            restored_run = research_store.get("run-import-undo")
            restored_note = note_library.get(market="ashare", symbol="600000", timeframe="1d")
            restored_old_strategy = strategy_library.get("rev-import-undo-old")
            restored_new_strategy = strategy_library.get("rev-import-undo-new")
            restored_paper = paper_library.list_all_by_run("run-import-undo")
            restored_reviews = review_store.list_all_by_run("run-import-undo")
            consumed_undo = undo_store.get(import_payload.get("undoToken"))

        self.assertEqual(import_response.status, 201)
        self.assertTrue(import_payload["undoToken"].startswith("import-undo-"))
        self.assertEqual(undo_response.status, 200)
        self.assertEqual(undo_payload["undo"]["status"], "undone")
        self.assertEqual(restored_run.strategy_revision, "rev-import-undo-old")
        self.assertEqual(restored_run.metrics["total_return_pct"], -1.0)
        self.assertEqual(restored_note.body, "Previous note should return after undo.")
        self.assertEqual(restored_old_strategy.revision, "rev-import-undo-old")
        self.assertIsNone(restored_new_strategy)
        self.assertEqual(len(restored_paper), 1)
        self.assertEqual([review.ai_review_id for review in restored_reviews], ["ai-review:run-import-undo:old"])
        self.assertIsNotNone(consumed_undo.consumed_at)

    def test_research_run_import_undo_rejects_cross_run_token_use(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.ai_review_runs import AiReviewRunStore
        from quant_core.api import QuantApiHandler
        from quant_core.execution import PaperExecutionStore
        from quant_core.research_import_undo import ResearchRunImportUndoStore
        from quant_core.research_notes import ResearchNoteStore
        from quant_core.runs import ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

        undo_snapshot = {
            "schemaVersion": 1,
            "runId": "run-import-undo-owner",
            "importedRun": None,
            "importedNote": None,
            "strategyRevision": "",
            "previous": {
                "run": None,
                "note": None,
                "strategy": None,
                "paperExecutions": [],
                "aiReviewRuns": [],
            },
        }

        with tempfile.TemporaryDirectory() as tmp:
            undo_store = ResearchRunImportUndoStore(f"{tmp}/import_undo.sqlite")
            undo_record = undo_store.record(
                run_id="run-import-undo-owner",
                snapshot=undo_snapshot,
                undo_token="import-undo-cross-run-token",
            )

            class TestHandler(QuantApiHandler):
                run_store = ResearchRunStore(f"{tmp}/runs.sqlite")
                note_store = ResearchNoteStore(f"{tmp}/notes.sqlite")
                strategy_store = StrategyLibraryStore(f"{tmp}/strategies.sqlite")
                paper_execution_store = PaperExecutionStore(f"{tmp}/paper.sqlite")
                ai_review_store = AiReviewRunStore(f"{tmp}/ai_reviews.sqlite")
                import_undo_store = undo_store

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                undo_body = json.dumps(
                    {
                        "undoToken": undo_record.undo_token,
                        "expectedRunId": "run-import-undo-other",
                    }
                ).encode("utf-8")
                connection.request(
                    "POST",
                    "/api/research/runs/import/undo",
                    body=undo_body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(undo_body))},
                )
                undo_response = connection.getresponse()
                undo_payload = json.loads(undo_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            reloaded_undo = undo_store.get(undo_record.undo_token)

        self.assertEqual(undo_response.status, 409)
        self.assertEqual(undo_payload["error"], "research_run_import_undo_run_mismatch")
        self.assertEqual(undo_payload["runId"], "run-import-undo-owner")
        self.assertEqual(undo_payload["expectedRunId"], "run-import-undo-other")
        self.assertIsNone(reloaded_undo.consumed_at)

    def test_research_run_export_import_preserves_paper_execution_history(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.execution import PaperExecutionStore, create_paper_execution_from_audit
        from quant_core.runs import ResearchRunAudit, ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

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
            target_strategy_store = StrategyLibraryStore(f"{tmp}/target-strategies.sqlite")
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
                strategy_store = target_strategy_store

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

    def test_research_run_export_import_preserves_portfolio_paper_order_history(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.ai_review_runs import AiReviewRunStore
        from quant_core.api import QuantApiHandler
        from quant_core.execution import (
            PortfolioPaperOrderApprovalStore,
            PortfolioPaperOrderSimulationStore,
            PaperExecutionStore,
            PortfolioPaperOrderStore,
            build_portfolio_paper_order_lifecycle,
            create_portfolio_paper_order_approval,
            create_portfolio_paper_order_batch,
            create_portfolio_paper_order_simulation,
            portfolio_paper_order_approvals_to_map,
        )
        from quant_core.research_notes import ResearchNoteStore
        from quant_core.runs import ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

        audit = self._sample_research_run_audit(
            run_id="run-portfolio-orders-portable",
            strategy_revision="rev-portfolio-orders-portable",
        )
        batch = create_portfolio_paper_order_batch(
            base_run_id=audit.run_id,
            portfolio_name="Portable basket",
            source="portfolio_backtest",
            created_at=datetime(2026, 5, 26, 8, 7, tzinfo=timezone.utc),
            batch_id="portfolio-paper-batch-api-portable",
            orders=[
                {
                    "timestamp": "2026-05-26T08:07:00+00:00",
                    "eventType": "portfolio_paper_order",
                    "orderId": "portfolio-paper-order-api-1",
                    "symbol": "600000",
                    "sourceRunId": audit.run_id,
                    "side": "buy",
                    "notionalValue": 19341.0,
                    "quantity": 2100,
                    "status": "pending_review",
                    "riskStatus": "passed",
                    "reason": "Portfolio rebalance requires operator review.",
                }
            ],
        )
        approval = create_portfolio_paper_order_approval(
            base_run_id=audit.run_id,
            batch_id=batch.batch_id,
            order_id="portfolio-paper-order-api-1",
            approved=True,
            reviewer="operator-portable",
            reviewed_at=datetime(2026, 5, 26, 8, 8, tzinfo=timezone.utc),
            reason="Approved for portable paper-only simulation.",
        )
        lifecycle = build_portfolio_paper_order_lifecycle(
            batch,
            approvals=portfolio_paper_order_approvals_to_map([approval]),
        )
        simulation = create_portfolio_paper_order_simulation(
            batch=batch,
            lifecycle_row=lifecycle[0],
            simulated_at=datetime(2026, 5, 26, 8, 9, tzinfo=timezone.utc),
        )

        with tempfile.TemporaryDirectory() as tmp:
            source_run_store = ResearchRunStore(f"{tmp}/source-runs.sqlite")
            source_paper_store = PaperExecutionStore(f"{tmp}/source-paper.sqlite")
            source_ai_review_store = AiReviewRunStore(f"{tmp}/source-ai-reviews.sqlite")
            source_portfolio_order_store = PortfolioPaperOrderStore(f"{tmp}/source-portfolio-orders.sqlite")
            source_portfolio_order_approval_store = PortfolioPaperOrderApprovalStore(
                f"{tmp}/source-portfolio-order-approvals.sqlite"
            )
            source_portfolio_order_simulation_store = PortfolioPaperOrderSimulationStore(
                f"{tmp}/source-portfolio-order-simulations.sqlite"
            )
            target_run_store = ResearchRunStore(f"{tmp}/target-runs.sqlite")
            target_note_store = ResearchNoteStore(f"{tmp}/target-notes.sqlite")
            target_strategy_store = StrategyLibraryStore(f"{tmp}/target-strategies.sqlite")
            target_paper_store = PaperExecutionStore(f"{tmp}/target-paper.sqlite")
            target_ai_review_store = AiReviewRunStore(f"{tmp}/target-ai-reviews.sqlite")
            target_portfolio_order_store = PortfolioPaperOrderStore(f"{tmp}/target-portfolio-orders.sqlite")
            target_portfolio_order_approval_store = PortfolioPaperOrderApprovalStore(
                f"{tmp}/target-portfolio-order-approvals.sqlite"
            )
            target_portfolio_order_simulation_store = PortfolioPaperOrderSimulationStore(
                f"{tmp}/target-portfolio-order-simulations.sqlite"
            )
            source_run_store.record(audit)
            source_portfolio_order_store.record(batch)
            source_portfolio_order_approval_store.record(approval)
            source_portfolio_order_simulation_store.record(simulation)

            class SourceHandler(QuantApiHandler):
                run_store = source_run_store
                paper_execution_store = source_paper_store
                ai_review_store = source_ai_review_store
                portfolio_paper_order_store = source_portfolio_order_store
                portfolio_paper_order_approval_store = source_portfolio_order_approval_store
                portfolio_paper_order_simulation_store = source_portfolio_order_simulation_store

            source_server = HTTPServer(("127.0.0.1", 0), SourceHandler)
            source_thread = Thread(target=source_server.serve_forever, daemon=True)
            source_thread.start()
            source_connection = HTTPConnection(source_server.server_address[0], source_server.server_address[1], timeout=5)
            try:
                source_connection.request("GET", "/api/research/runs/run-portfolio-orders-portable/export")
                export_response = source_connection.getresponse()
                export_payload = json.loads(export_response.read().decode("utf-8"))
            finally:
                source_connection.close()
                source_server.shutdown()
                source_thread.join(timeout=5)
                source_server.server_close()

            class TargetHandler(QuantApiHandler):
                run_store = target_run_store
                note_store = target_note_store
                strategy_store = target_strategy_store
                paper_execution_store = target_paper_store
                ai_review_store = target_ai_review_store
                portfolio_paper_order_store = target_portfolio_order_store
                portfolio_paper_order_approval_store = target_portfolio_order_approval_store
                portfolio_paper_order_simulation_store = target_portfolio_order_simulation_store

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
                target_connection.request("GET", "/api/portfolio/paper-orders?baseRunId=run-portfolio-orders-portable")
                history_response = target_connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
                target_connection.request(
                    "GET",
                    "/api/portfolio/paper-order-approvals"
                    "?baseRunId=run-portfolio-orders-portable&batchId=portfolio-paper-batch-api-portable",
                )
                approval_history_response = target_connection.getresponse()
                approval_history_payload = json.loads(approval_history_response.read().decode("utf-8"))
                target_connection.request(
                    "GET",
                    "/api/portfolio/paper-order-simulations"
                    "?baseRunId=run-portfolio-orders-portable&batchId=portfolio-paper-batch-api-portable",
                )
                simulation_history_response = target_connection.getresponse()
                simulation_history_payload = json.loads(simulation_history_response.read().decode("utf-8"))
            finally:
                target_connection.close()
                target_server.shutdown()
                target_thread.join(timeout=5)
                target_server.server_close()

        self.assertEqual(export_response.status, 200)
        self.assertEqual(export_payload["export"]["manifest"]["artifactCounts"]["portfolioPaperOrderBatches"], 1)
        self.assertEqual(export_payload["export"]["manifest"]["artifactCounts"]["portfolioPaperOrderApprovals"], 1)
        self.assertEqual(export_payload["export"]["manifest"]["artifactCounts"]["portfolioPaperOrderSimulations"], 1)
        self.assertEqual(
            export_payload["export"]["portfolioPaperOrderBatches"][0]["batchId"],
            "portfolio-paper-batch-api-portable",
        )
        self.assertEqual(
            export_payload["export"]["portfolioPaperOrderApprovals"][0]["approvalId"],
            "portfolio-paper-order-approval-portfolio-paper-batch-api-portable-portfolio-paper-order-api-1",
        )
        self.assertEqual(
            export_payload["export"]["portfolioPaperOrderSimulations"][0]["simulationId"],
            "portfolio-paper-order-simulation-portfolio-paper-batch-api-portable-portfolio-paper-order-api-1",
        )
        self.assertEqual(import_response.status, 201)
        self.assertEqual(import_payload["run"]["runId"], "run-portfolio-orders-portable")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["portfolioPaperOrderBatches"]), 1)
        self.assertEqual(
            history_payload["portfolioPaperOrderBatches"][0]["batchId"],
            "portfolio-paper-batch-api-portable",
        )
        self.assertEqual(history_payload["portfolioPaperOrderBatches"][0]["summary"]["totalOrders"], 1)
        self.assertEqual(approval_history_response.status, 200)
        self.assertEqual(approval_history_payload["approvals"][0]["reviewer"], "operator-portable")
        self.assertEqual(approval_history_payload["portfolioPaperOrderLifecycle"][0]["state"], "ready_for_simulation")
        self.assertEqual(simulation_history_response.status, 200)
        self.assertEqual(simulation_history_payload["simulations"][0]["fillStatus"], "filled")
        self.assertEqual(simulation_history_payload["simulations"][0]["fillPrice"], 9.210000)

    def test_research_run_export_import_preserves_ai_review_records(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.ai_review_runs import AiReviewRunStore
        from quant_core.api import QuantApiHandler
        from quant_core.runs import ResearchRunAudit, ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

        audit = ResearchRunAudit(
            run_id="run-ai-review-portable",
            created_at=datetime(2026, 5, 26, 8, 0, tzinfo=timezone.utc),
            market="ashare",
            symbol="600000",
            timeframe="1d",
            strategy_name="Portable AI review SMA",
            strategy_revision="rev-ai-review-portable",
            data_rows=2,
            metrics={"total_return_pct": 4.2, "max_drawdown_pct": 1.1, "win_rate_pct": 50, "trade_count": 1},
            decisions=[{"agent": "AI Summary", "message": "Portable evidence only", "tone": "ai"}],
            execution_mode="paper_only",
            ai_report={
                "summary": "Portable AI review summary",
                "risks": ["Portable AI review risk"],
                "improvements": ["Review imported AI evidence"],
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
                "hash": "snapshot-ai-review-portable",
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
                "name": "Portable AI review SMA",
                "revision": "rev-ai-review-portable",
                "market": "ashare",
                "symbols": ["600000"],
                "timeframe": "1d",
                "version": 1,
                "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
                "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
                "risk": {"positionPct": 0.2, "stopLossPct": 0.08, "takeProfitPct": 0.18, "maxDrawdownPct": 0.2},
            },
            backtest_assumptions={"initialCash": 100000, "feeBps": 3, "slippageBps": 2},
            backtest_trades=[{"id": "trade-ai-review-portable", "side": "BUY", "price": "9.20"}],
            backtest_equity_curve=[{"timestamp": "2026-05-26T08:00:00+00:00", "equity": 100000.0}],
            backtest_diagnostics=[{"id": "return-profile", "label": "Return profile", "value": "+4.20%"}],
        )
        review_record = {
            "schemaVersion": 1,
            "recordType": "aiqt.aiReviewRun",
            "aiReviewId": "ai-review:run-ai-review-portable:rev-ai-review-portable",
            "runId": "run-ai-review-portable",
            "createdAt": "2026-05-26T08:05:00+00:00",
            "market": "ashare",
            "symbol": "600000",
            "timeframe": "1d",
            "strategyRevision": "rev-ai-review-portable",
            "executionMode": "paper_only",
            "status": "ready",
            "summary": {
                "citationCount": 7,
                "roundCount": 5,
                "decisionCount": 2,
                "parameterScanBound": True,
                "liveExecutionBlocked": True,
            },
            "dossier": {"status": "ready", "headline": "Portable AI review", "summary": "Evidence only", "citations": []},
            "citations": [
                {"id": "parameter-scan", "label": "Parameter scan", "value": "SMA20", "detail": "portable", "tone": "warning"}
            ],
            "rounds": [{"id": "technical-analysis", "phase": "analysis", "agent": "Technical Analyst", "verdict": "support"}],
            "decisionLog": [{"agent": "Technical", "message": "Evidence only.", "tone": "positive"}],
            "evidenceAnchors": [
                {
                    "id": "run:run-ai-review-portable",
                    "type": "research-run",
                    "label": "Research run",
                    "reference": "run-ai-review-portable",
                    "exportPath": "researchRun.runId",
                },
                {
                    "id": "citation:parameter-scan",
                    "type": "citation",
                    "label": "Parameter scan",
                    "reference": "parameter-scan",
                    "exportPath": "aiReviewRuns[].record.citations[parameter-scan]",
                },
            ],
            "boundary": "Evidence explanation only; no buy/sell instructions or guaranteed returns.",
        }

        with tempfile.TemporaryDirectory() as tmp:
            source_run_store = ResearchRunStore(f"{tmp}/source-runs.sqlite")
            source_ai_review_store = AiReviewRunStore(f"{tmp}/source-ai-reviews.sqlite")
            target_run_store = ResearchRunStore(f"{tmp}/target-runs.sqlite")
            target_ai_review_store = AiReviewRunStore(f"{tmp}/target-ai-reviews.sqlite")
            target_strategy_store = StrategyLibraryStore(f"{tmp}/target-strategies.sqlite")
            source_run_store.record(audit)
            source_ai_review_store.record(review_record)

            class SourceHandler(QuantApiHandler):
                run_store = source_run_store
                ai_review_store = source_ai_review_store

            source_server = HTTPServer(("127.0.0.1", 0), SourceHandler)
            source_thread = Thread(target=source_server.serve_forever, daemon=True)
            source_thread.start()
            source_connection = HTTPConnection(source_server.server_address[0], source_server.server_address[1], timeout=5)
            try:
                source_connection.request("GET", "/api/research/runs/run-ai-review-portable/export")
                export_response = source_connection.getresponse()
                export_payload = json.loads(export_response.read().decode("utf-8"))
            finally:
                source_connection.close()
                source_server.shutdown()
                source_thread.join(timeout=5)
                source_server.server_close()

            class TargetHandler(QuantApiHandler):
                run_store = target_run_store
                ai_review_store = target_ai_review_store
                strategy_store = target_strategy_store

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
                target_connection.request("GET", "/api/research/runs/run-ai-review-portable/ai-reviews")
                history_response = target_connection.getresponse()
                history_payload = json.loads(history_response.read().decode("utf-8"))
            finally:
                target_connection.close()
                target_server.shutdown()
                target_thread.join(timeout=5)
                target_server.server_close()

        self.assertEqual(export_response.status, 200)
        self.assertEqual(export_payload["export"]["manifest"]["artifactCounts"]["aiReviewRuns"], 1)
        self.assertEqual(export_payload["export"]["aiReviewRuns"][0]["aiReviewId"], "ai-review:run-ai-review-portable:rev-ai-review-portable")
        self.assertEqual(
            export_payload["export"]["aiReviewRuns"][0]["record"]["evidenceAnchors"][0]["id"],
            "run:run-ai-review-portable",
        )
        self.assertEqual(import_response.status, 201)
        self.assertEqual(import_payload["run"]["runId"], "run-ai-review-portable")
        self.assertEqual(history_response.status, 200)
        self.assertEqual(len(history_payload["aiReviews"]), 1)
        self.assertEqual(history_payload["aiReviews"][0]["aiReviewId"], "ai-review:run-ai-review-portable:rev-ai-review-portable")
        self.assertEqual(
            history_payload["aiReviews"][0]["record"]["boundary"],
            "Evidence explanation only; no buy/sell instructions or guaranteed returns.",
        )
        self.assertEqual(
            history_payload["aiReviews"][0]["record"]["evidenceAnchors"][1]["exportPath"],
            "aiReviewRuns[].record.citations[parameter-scan]",
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

    def test_yfinance_quote_fallback_suppresses_vendor_stderr(self):
        import contextlib
        import io
        import sys
        import types

        from quant_core.live_quotes import QuantDingerLiveQuoteAdapter

        class NoisyTicker:
            def __init__(self, symbol: str) -> None:
                self.symbol = symbol

            @property
            def fast_info(self) -> dict[str, float]:
                print("$AAPL: possibly delisted; No price data found", file=sys.stderr)
                return {"lastPrice": 101.5, "previousClose": 100.0, "dayHigh": 102.0, "dayLow": 99.5, "open": 100.5}

        original_yfinance = sys.modules.get("yfinance")
        sys.modules["yfinance"] = types.SimpleNamespace(Ticker=NoisyTicker)
        stderr = io.StringIO()
        try:
            adapter = QuantDingerLiveQuoteAdapter(finnhub_api_key="")
            with contextlib.redirect_stderr(stderr):
                quote = adapter.fetch_quote("us", "AAPL")
        finally:
            if original_yfinance is None:
                sys.modules.pop("yfinance", None)
            else:
                sys.modules["yfinance"] = original_yfinance

        self.assertEqual(quote.source, "yfinance")
        self.assertEqual(quote.price, 101.5)
        self.assertEqual(stderr.getvalue(), "")

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

    def test_market_symbol_search_payload_marks_current_timeframe_cache_coverage(self):
        from quant_core.market_search import MarketSymbolSearchAdapter, market_search_to_payload

        adapter = MarketSymbolSearchAdapter(fetch_text=lambda _url, _encoding="utf-8": (_ for _ in ()).throw(OSError("offline")))
        results = adapter.search("ashare", "600", limit=2)
        payload = market_search_to_payload(
            "ashare",
            "600",
            results,
            timeframe="1d",
            cache_contexts=[
                {
                    "market": "ashare",
                    "symbol": "600000",
                    "timeframe": "1d",
                    "row_count": 240,
                    "start_timestamp": "2026-05-01T00:00:00+00:00",
                    "end_timestamp": "2026-06-09T00:00:00+00:00",
                }
            ],
            generated_at=datetime(2026, 6, 10, 8, 0, tzinfo=timezone.utc),
        )

        self.assertEqual(payload["timeframe"], "1d")
        self.assertEqual(payload["results"][0]["cache"]["freshness"], "fresh")
        self.assertEqual(payload["results"][0]["cache"]["rowCount"], 240)
        self.assertEqual(payload["results"][0]["cache"]["ageHours"], 32)
        self.assertEqual(payload["results"][0]["cache"]["endTimestamp"], "2026-06-09T00:00:00+00:00")
        self.assertEqual(payload["results"][1]["cache"]["freshness"], "empty")
        self.assertEqual(payload["results"][1]["cache"]["rowCount"], 0)

    def test_market_search_api_includes_current_timeframe_cache_coverage(self):
        import json
        from http.client import HTTPConnection
        from http.server import HTTPServer
        from threading import Thread

        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.domain import OHLCVBar
        from quant_core.market_search import MarketSymbolSearchAdapter

        with tempfile.TemporaryDirectory() as tmp:
            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(f"{tmp}/market.sqlite")
                search_adapter = MarketSymbolSearchAdapter(
                    fetch_text=lambda _url, _encoding="utf-8": (_ for _ in ()).throw(OSError("offline"))
                )

            TestHandler.cache.upsert_bars(
                [
                    OHLCVBar(
                        symbol="600000",
                        market="ashare",
                        timeframe="1d",
                        timestamp=datetime.now(timezone.utc) - timedelta(hours=2),
                        open=9.1,
                        high=9.4,
                        low=9.0,
                        close=9.21,
                        volume=1_000_000,
                    )
                ]
            )

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                connection.request("GET", "/api/market/search?market=ashare&query=600&limit=2&timeframe=1d")
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["timeframe"], "1d")
        self.assertEqual(payload["results"][0]["symbol"], "600000")
        self.assertEqual(payload["results"][0]["cache"]["freshness"], "fresh")
        self.assertEqual(payload["results"][0]["cache"]["rowCount"], 1)
        self.assertEqual(payload["results"][1]["cache"]["freshness"], "empty")

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
        from quant_core.market_klines import akshare_minute_frame_to_bars

        class AkshareMinuteFrame:
            empty = False
            columns = ["时间", "开盘", "收盘", "最高", "最低", "成交量"]

            def iterrows(self):
                rows = [
                    {"时间": "2026-05-26 09:30:00", "开盘": 9.10, "收盘": 9.16, "最高": 9.18, "最低": 9.09, "成交量": 3200},
                    {"时间": "2026-05-26 09:31:00", "开盘": 9.16, "收盘": 9.20, "最高": 9.21, "最低": 9.15, "成交量": 4100},
                ]
                return enumerate(rows)

        frame = AkshareMinuteFrame()

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
