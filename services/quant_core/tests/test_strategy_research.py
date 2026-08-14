from __future__ import annotations

import json
import tempfile
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from functools import cache
from http.client import HTTPConnection
from http.server import HTTPServer
from threading import Thread
from types import SimpleNamespace

from quant_core.ai_review_providers import (
    AiReviewProviderRegistry,
    ProviderAttempt,
    ProviderStatus,
)
from quant_core.canonical import (
    normalize_snapshot_bar_chunks,
    strategy_config_from_payload,
    strategy_config_to_payload,
)
from quant_core.api import QuantApiHandler
from quant_core.audit_events import AuditEventStore
from quant_core.domain import OHLCVBar
from quant_core.runs import ResearchRunAudit, ResearchRunStore
from quant_core.sealed_datasets import (
    SealedDatasetIntegrity,
    SealedDatasetSummary,
    sealed_research_snapshot_payload,
)
from quant_core.strategy_research import (
    AiStrategyResearchOrchestrator as _AiStrategyResearchOrchestrator,
    StrategyResearchCapabilityRegistry,
    StrategyResearchError,
)
from quant_core.strategy_experiments import (
    formal_scoring_metadata,
    strategy_experiment_id_from_idempotency_key,
    strategy_research_launch_definition_identity,
)


def AiStrategyResearchOrchestrator(**kwargs):
    kwargs.setdefault("sealed_bar_source", _SealedSource())
    return _AiStrategyResearchOrchestrator(**kwargs)


def _regime_breakout_strategy():
    return strategy_config_from_payload(
        {
            "name": "BTC Regime Breakout research baseline",
            "market": "crypto",
            "symbols": ["BTC/USDT"],
            "timeframe": "1m",
            "version": 2,
            "entryConditions": [],
            "exitConditions": [],
            "policy": {
                "kind": "regime_breakout_v2",
                "decisionTimeframe": "5m",
                "completedBarsOnly": True,
                "fillTiming": "next_completed_bar_open",
                "regime": {
                    "timeframe": "60m",
                    "closeAboveSmaWindow": 200,
                    "smaSlopeLookbackBars": 1,
                },
                "breakout": {
                    "lookbackBars": 20,
                    "excludeSignalBar": True,
                    "oneShotPerEvent": True,
                },
                "volume": {
                    "smaWindow": 20,
                    "multiplier": 1.5,
                    "excludeSignalBar": True,
                },
                "atr": {
                    "window": 14,
                    "smoothing": "wilder",
                    "initialMultiple": 1,
                    "trailingMultiple": 2,
                    "trailingStartsAfterProfit": True,
                    "trailingActivation": "positive_close",
                    "anchor": "highest_high_since_entry",
                    "neverLoosen": True,
                },
                "holding": {
                    "maxBars": 48,
                    "exitOnlyWithoutPositiveProgress": True,
                    "progressDefinition": "highest_close_above_entry",
                },
                "cooldown": {
                    "bars": 12,
                    "startsAfter": "filled_exit",
                    "requiresNewBreakoutEvent": True,
                },
            },
            "risk": {
                "positionPct": 0.6,
                "riskBudgetPct": 0.005,
                "stopLossPct": None,
                "takeProfitPct": None,
                "maxDrawdownPct": 0.03,
                "dailyLossLimitPct": 0.02,
                "maxTradeGroupsPerHour": 1,
                "maxEntryNotionalQuote": None,
                "exitNotionalCapQuote": None,
            },
        }
    )


def _cost_aware_range_reversion_strategy():
    return strategy_config_from_payload(
        {
            "name": "BTC Cost-Aware Range Reversion v1.1",
            "market": "crypto",
            "symbols": ["BTC/USDT"],
            "timeframe": "1m",
            "version": 2,
            "entryConditions": [],
            "exitConditions": [],
            "policy": {
                "kind": "cost_aware_range_reversion_v1_1",
                "decisionTimeframe": "4h",
                "completedBarsOnly": True,
                "fillTiming": "next_completed_bar_open",
                "rangeRegime": {
                    "fastEmaWindow": 6,
                    "slowEmaWindow": 42,
                    "indicatorAnchorBars": 139,
                    "maximumSeparationPct": 0.01,
                    "emaSeed": "first_complete_window_sma",
                    "emaAlpha": "2/(window+1)",
                },
                "reversion": {
                    "zScoreWindow": 24,
                    "standardDeviation": "population",
                    "entryZThreshold": -2.0,
                    "recoveryWindowBars": 3,
                    "minimumExpectedDistancePct": 0.012,
                    "requireCloseRising": True,
                    "requireZScoreRising": True,
                    "requireNegativeZScore": True,
                    "oneShotPerEvent": True,
                },
                "atr": {
                    "window": 14,
                    "smoothing": "wilder",
                    "initialMultiple": 2.5,
                    "fixedFromEntry": True,
                    "neverLoosen": True,
                },
                "exit": {"zScoreThreshold": 0.0, "exitOnRangeClose": True},
                "holding": {"maxBars": 18},
                "cooldown": {
                    "bars": 6,
                    "startsAfter": "filled_exit",
                    "requiresNewReversionEvent": True,
                },
            },
            "risk": {
                "positionPct": 0.6,
                "riskBudgetPct": 0.015,
                "stopLossPct": None,
                "takeProfitPct": None,
                "maxDrawdownPct": 0.03,
                "dailyLossLimitPct": 0.02,
                "maxTradeGroupsPerHour": 1,
                "maxEntryNotionalQuote": None,
                "exitNotionalCapQuote": None,
            },
        }
    )


class _RunStore:
    def __init__(self, run: ResearchRunAudit, *, owner_id: str | None = None) -> None:
        self.run = run
        self.owner_id = owner_id

    def get(self, run_id: str) -> ResearchRunAudit | None:
        return self.run if run_id == self.run.run_id else None


class _Provider:
    endpoint = "https://example.invalid/chat/completions"

    def __init__(
        self,
        template_id: str = "regime-breakout-v2",
        *,
        reason_codes: list[str] | None = None,
    ) -> None:
        self.prompt = ""
        self.output_schema: dict[str, object] = {}
        self.template_id = template_id
        self.reason_codes = reason_codes or [
            "context_compatible",
            "server_bounded_search",
            "formal_validation_required",
        ]

    def assess(
        self,
        *,
        rendered_prompt,
        output_schema,
        known_evidence_ids,
        response_validator=None,
    ):
        self.prompt = rendered_prompt
        self.output_schema = output_schema
        assessment = response_validator(
            {
                "templateId": self.template_id,
                "reasonCodes": list(self.reason_codes),
            },
            known_evidence_ids,
        )
        return ProviderAttempt(
            provider_id="openai-compatible",
            model="strategy-research-model",
            sanitized_base_url="https://example.invalid/v1",
            assessment=assessment,
            usage={"inputTokens": 10, "outputTokens": 20, "totalTokens": 30},
            latency_ms=12,
        )


class _ExperimentRunner:
    def __init__(self) -> None:
        self.calls: list[tuple[dict[str, object], str | None]] = []
        self.launch_intents: list[dict[str, object] | None] = []
        self.details: dict[str, object] = {}

    def run_new(self, payload, *, idempotency_key=None, launch_intent=None):
        self.calls.append((payload, idempotency_key))
        self.launch_intents.append(launch_intent)
        experiment_id = strategy_experiment_id_from_idempotency_key(idempotency_key)
        if experiment_id not in self.details:
            experiment = SimpleNamespace(
                experiment_id=experiment_id,
                created_at=datetime(2026, 8, 10, tzinfo=timezone.utc),
                status="pending",
                strategy_revision=payload["strategyRevision"],
                source_run_id=payload["sourceRunId"],
                evaluation_count=0,
                selected_candidate_id=None,
                completion_reason=None,
                profitability_gate_passed=False,
                error_code=None,
                error_detail=None,
                promotion_run_id=None,
                promoted_strategy_revision=None,
                promotion_lineage_hash=None,
                promoted_at=None,
                promotion_operator=None,
            )
            self.details[experiment_id] = SimpleNamespace(
                experiment=experiment,
                snapshot=SimpleNamespace(
                    test_definition_hash=None,
                    canonical_data_hash="server-only-dataset-hash",
                ),
                candidates=[],
            )
        return self.details[experiment_id]

    def get(self, experiment_id):
        return self.details.get(experiment_id)


@cache
def _sealed_fixture() -> tuple[
    tuple[OHLCVBar, ...],
    SealedDatasetSummary,
    list[dict[str, object]],
]:
    start = datetime(2026, 5, 1, tzinfo=timezone.utc)
    total_rows = 163_199
    withheld_rows = 18 * 24 * 60
    development_rows = total_rows - withheld_rows
    bars = tuple(
        OHLCVBar(
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            timestamp=start + timedelta(minutes=index),
            open=100,
            high=100.1,
            low=99.9,
            close=100,
            volume=100,
        )
        for index in range(development_rows)
    )
    development_hash = str(
        normalize_snapshot_bar_chunks(
            [list(bars[index : index + 500]) for index in range(0, len(bars), 500)],
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
        )["hash"]
    )
    summary = SealedDatasetSummary(
        dataset_id="sealed-" + "a" * 24,
        market="crypto",
        symbol="BTC/USDT",
        timeframe="1m",
        source="binance",
        adjustment_mode="none",
        start=start,
        development_end_exclusive=start + timedelta(minutes=development_rows),
        end_exclusive=start + timedelta(minutes=total_rows),
        rows=total_rows,
        development_rows=development_rows,
        withheld_rows=withheld_rows,
        dataset_hash="a" * 64,
        development_hash=development_hash,
    )
    equity = [
        {"timestamp": bar.timestamp.isoformat(), "equity": 10.0}
        for bar in bars
    ]
    return bars, summary, equity


class _SealedSource:
    def __init__(self, *, owner_id: str | None = None) -> None:
        bars, summary, _equity = _sealed_fixture()
        self.owner_id = owner_id
        self.development = list(bars)
        self.summary = summary
        self.content_version = 1
        self.development_reads = 0
        self.test_reads = 0

    def get_summary(self, dataset_id: str):
        return self.summary if dataset_id == self.summary.dataset_id else None

    def get_integrity(self, dataset_id: str):
        if dataset_id != self.summary.dataset_id:
            return None
        return SealedDatasetIntegrity(
            dataset_id=self.summary.dataset_id,
            manifest_token=self.summary.dataset_hash,
            content_version=self.content_version,
        )

    def read_development_bars(self, dataset_id: str):
        self.development_reads += 1
        if dataset_id != self.summary.dataset_id:
            raise ValueError("sealed_dataset_not_found")
        return list(self.development)

    def claim_test_partition(self, *args, **kwargs):
        del args, kwargs
        raise AssertionError("strategy research proposals must not claim sealed test bars")

    def read_claimed_test_bars(self, *args, **kwargs):
        del args, kwargs
        self.test_reads += 1
        raise AssertionError("strategy research proposals must not read sealed test bars")


def _source_run() -> ResearchRunAudit:
    strategy = _regime_breakout_strategy()
    _bars, summary, equity = _sealed_fixture()
    scoring = formal_scoring_metadata(summary)
    pre_roll_rows = int(scoring["scoringWindow"]["preRollRows"])
    snapshot = sealed_research_snapshot_payload(summary)
    snapshot.update(scoring)
    return ResearchRunAudit(
        run_id="run-server-owned-development",
        created_at=datetime(2026, 8, 10, tzinfo=timezone.utc),
        market="crypto",
        symbol="BTC/USDT",
        timeframe="1m",
        strategy_name=strategy.name,
        strategy_revision=strategy.revision,
        data_rows=summary.development_rows,
        metrics={
            "total_return_pct": 0.0,
            "annual_return_pct": 0.0,
            "max_drawdown_pct": 0.0,
            "win_rate_pct": 0.0,
            "profit_factor": 0.0,
            "trade_count": 0,
            "round_trip_count": 0,
        },
        decisions=[],
        execution_mode="paper_only",
        data_quality={
            "source": "binance",
            "isComplete": True,
            "warnings": [],
            "rows": summary.development_rows,
            "canonicalHash": summary.development_hash,
        },
        data_snapshot=snapshot,
        strategy_config=strategy_config_to_payload(strategy),
        backtest_assumptions={"initialCash": 10, "feeBps": 10, "slippageBps": 10},
        backtest_trades=[],
        backtest_equity_curve=equity[pre_roll_rows:],
    )


class StrategyResearchProposalTests(unittest.TestCase):
    def test_launch_definition_identity_ignores_dimension_order(self):
        definition = {
            "strategyRevision": "revision-1",
            "sourceRunId": "run-1",
            "assumptions": {"initialCash": 10},
            "dimensions": [
                {"policyPath": "regime.closeAboveSmaWindow", "values": [180, 200]},
                {"policyPath": "breakout.lookbackBars", "values": [18, 20]},
            ],
            "guardrails": {"development": {"minimumRoundTripCount": 30}},
            "walkForward": {"trainBars": 43_200},
        }

        reordered = {**definition, "dimensions": list(reversed(definition["dimensions"]))}

        self.assertEqual(
            strategy_research_launch_definition_identity(definition),
            strategy_research_launch_definition_identity(reordered),
        )

    def test_proposal_fails_closed_without_server_sealed_dataset_store(self) -> None:
        run = _source_run()
        with tempfile.TemporaryDirectory() as directory:
            orchestrator = _AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
            )

            with self.assertRaises(StrategyResearchError) as raised:
                orchestrator.propose(
                    {
                        "sourceRunId": run.run_id,
                        "goal": "缺少服务端密封数据时必须失败关闭",
                        "providerId": "local",
                        "externalDataApproved": False,
                    }
                )

        self.assertEqual(
            raised.exception.code,
            "strategy_research_sealed_dataset_unavailable",
        )

    def test_proposal_rejects_imported_metrics_that_do_not_match_development_replay(self) -> None:
        run = replace(
            _source_run(),
            metrics={
                "total_return_pct": 999.0,
                "annual_return_pct": 999.0,
                "max_drawdown_pct": 0.0,
                "win_rate_pct": 100.0,
                "profit_factor": 999.0,
                "trade_count": 999,
                "round_trip_count": 999,
            },
        )
        with tempfile.TemporaryDirectory() as directory:
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
            )

            with self.assertRaises(StrategyResearchError) as raised:
                orchestrator.propose(
                    {
                        "sourceRunId": run.run_id,
                        "goal": "导入的伪造收益指标不能进入策略研发提案",
                        "providerId": "local",
                        "externalDataApproved": False,
                    }
                )

        self.assertEqual(
            raised.exception.code,
            "strategy_research_source_replay_mismatch",
        )

    def test_proposal_rejects_incomplete_trade_and_equity_replay_facts(self) -> None:
        source = _source_run()
        tampered_runs = (
            replace(
                source,
                backtest_trades=[
                    {
                        "id": "forged-trade",
                        "timestamp": source.created_at.isoformat(),
                        "side": "BUY",
                    }
                ],
            ),
            replace(source, backtest_equity_curve=source.backtest_equity_curve[:-1]),
        )

        for run in tampered_runs:
            with self.subTest(
                trade_rows=len(run.backtest_trades),
                equity_rows=len(run.backtest_equity_curve),
            ), tempfile.TemporaryDirectory() as directory:
                orchestrator = AiStrategyResearchOrchestrator(
                    run_store=_RunStore(run),
                    provider_registry=AiReviewProviderRegistry(
                        (ProviderStatus("local", True, None, None),),
                        {},
                    ),
                    audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
                )
                with self.assertRaises(StrategyResearchError) as raised:
                    orchestrator.propose(
                        {
                            "sourceRunId": run.run_id,
                            "goal": "成交与净值曲线必须完整匹配开发集重放",
                            "providerId": "local",
                            "externalDataApproved": False,
                        }
                    )
                self.assertEqual(
                    raised.exception.code,
                    "strategy_research_source_replay_mismatch",
                )

    def test_proposal_revalidates_development_content_after_integrity_version_drift(self) -> None:
        run = _source_run()
        source = _SealedSource()
        source.development[0] = replace(
            source.development[0],
            high=101.1,
            close=101,
        )
        source.content_version += 1
        with tempfile.TemporaryDirectory() as directory:
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
                sealed_bar_source=source,
            )

            with self.assertRaises(StrategyResearchError) as raised:
                orchestrator.propose(
                    {
                        "sourceRunId": run.run_id,
                        "goal": "完整性版本漂移后必须重新验证开发集内容",
                        "providerId": "local",
                        "externalDataApproved": False,
                    }
                )

        self.assertEqual(raised.exception.code, "strategy_research_source_data_invalid")
        self.assertEqual(source.development_reads, 1)
        self.assertEqual(source.test_reads, 0)

    def test_proposal_rejects_cross_tenant_sealed_dataset_owner(self) -> None:
        run = _source_run()
        source = _SealedSource(owner_id="tenant-b")
        with tempfile.TemporaryDirectory() as directory:
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run, owner_id="tenant-a"),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
                sealed_bar_source=source,
            )

            with self.assertRaises(StrategyResearchError) as raised:
                orchestrator.propose(
                    {
                        "sourceRunId": run.run_id,
                        "goal": "不同租户的密封数据绝不能进入当前提案",
                        "providerId": "local",
                        "externalDataApproved": False,
                    }
                )

        self.assertEqual(
            raised.exception.code,
            "strategy_research_sealed_dataset_owner_mismatch",
        )
        self.assertEqual(source.development_reads, 0)

    def test_proposal_requires_exact_formal_backtest_assumptions(self) -> None:
        run = replace(
            _source_run(),
            backtest_assumptions={"initialCash": 10, "feeBps": 10, "slippageBps": 9},
        )
        source = _SealedSource()
        with tempfile.TemporaryDirectory() as directory:
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
                sealed_bar_source=source,
            )
            with self.assertRaises(StrategyResearchError) as raised:
                orchestrator.propose(
                    {
                        "sourceRunId": run.run_id,
                        "goal": "正式来源运行必须严格使用固定的十十十成本假设",
                        "providerId": "local",
                        "externalDataApproved": False,
                    }
                )

        self.assertEqual(
            raised.exception.code,
            "strategy_research_source_replay_mismatch",
        )
        self.assertEqual(source.development_reads, 0)

    def test_proposal_rejects_a_sealed_source_with_the_wrong_formal_split_before_replay(
        self,
    ) -> None:
        baseline = _source_run()
        source = _SealedSource()
        wrong_summary = replace(
            source.summary,
            development_end_exclusive=source.summary.development_end_exclusive
            + timedelta(minutes=1),
            development_rows=source.summary.development_rows + 1,
            withheld_rows=source.summary.withheld_rows - 1,
        )
        source.summary = wrong_summary
        wrong_snapshot = sealed_research_snapshot_payload(wrong_summary)
        wrong_snapshot.update(
            {
                "preRollVersion": baseline.data_snapshot["preRollVersion"],
                "scoringWindow": baseline.data_snapshot["scoringWindow"],
            }
        )
        run = replace(
            baseline,
            data_rows=wrong_summary.development_rows,
            data_quality={
                **baseline.data_quality,
                "rows": wrong_summary.development_rows,
            },
            data_snapshot=wrong_snapshot,
        )

        with tempfile.TemporaryDirectory() as directory:
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
                sealed_bar_source=source,
            )
            with self.assertRaises(StrategyResearchError) as raised:
                orchestrator.propose(
                    {
                        "sourceRunId": run.run_id,
                        "goal": "错误开发与留出分区不能进入注册模板提案",
                        "providerId": "local",
                        "externalDataApproved": False,
                    }
                )

        self.assertEqual(raised.exception.code, "strategy_research_template_unavailable")
        self.assertEqual(source.development_reads, 0)

    def test_proposal_rejects_a_drifted_formal_scoring_start_before_replay(self) -> None:
        baseline = _source_run()
        source = _SealedSource()
        scoring_window = dict(baseline.data_snapshot["scoringWindow"])
        scoring_window["start"] = (
            datetime.fromisoformat(str(scoring_window["start"]))
            + timedelta(minutes=1)
        ).isoformat()
        run = replace(
            baseline,
            data_snapshot={
                **baseline.data_snapshot,
                "scoringWindow": scoring_window,
            },
        )

        with tempfile.TemporaryDirectory() as directory:
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
                sealed_bar_source=source,
            )
            with self.assertRaises(StrategyResearchError) as raised:
                orchestrator.propose(
                    {
                        "sourceRunId": run.run_id,
                        "goal": "评分起点漂移时必须拒绝创建策略研发提案",
                        "providerId": "local",
                        "externalDataApproved": False,
                    }
                )

        self.assertEqual(raised.exception.code, "strategy_research_template_unavailable")
        self.assertEqual(source.development_reads, 0)

    def test_registered_templates_declare_complete_verifiable_capabilities(self) -> None:
        templates = StrategyResearchCapabilityRegistry().registered()

        self.assertEqual(
            [
                {
                    "templateId": template.template_id,
                    "version": template.version,
                    "market": template.market,
                    "symbol": template.symbol,
                    "timeframe": template.timeframe,
                    "sealedKind": template.sealed_data.kind,
                    "sealedHashVersion": template.sealed_data.hash_version,
                    "minimumRows": template.sealed_data.minimum_rows,
                    "minimumPreRollRows": template.sealed_data.minimum_pre_roll_rows,
                    "developmentScoringRows": template.sealed_data.development_scoring_rows,
                    "withheldRows": template.sealed_data.withheld_rows,
                    "completeRequired": template.sealed_data.complete_required,
                    "testPartitionHidden": template.sealed_data.test_partition_hidden,
                    "parameterPaths": [schema.policy_path for schema in template.parameter_schema],
                    "evaluatorVersion": template.evaluator_version,
                    "evaluatorCallable": callable(template.deterministic_evaluator),
                }
                for template in templates
            ],
            [
                {
                    "templateId": "regime-breakout-v2",
                    "version": "2",
                    "market": "crypto",
                    "symbol": "BTC/USDT",
                    "timeframe": "1m",
                    "sealedKind": "formal_sealed_dataset",
                    "sealedHashVersion": "aiqt-sealed-v1",
                    "minimumRows": 142_919,
                    "minimumPreRollRows": 13_319,
                    "developmentScoringRows": 103_680,
                    "withheldRows": 25_920,
                    "completeRequired": True,
                    "testPartitionHidden": True,
                    "parameterPaths": [
                        "regime.closeAboveSmaWindow",
                        "breakout.lookbackBars",
                    ],
                    "evaluatorVersion": "strategy-evaluator-v2",
                    "evaluatorCallable": True,
                },
                {
                    "templateId": "cost-aware-range-reversion-v1-1",
                    "version": "1.1",
                    "market": "crypto",
                    "symbol": "BTC/USDT",
                    "timeframe": "1m",
                    "sealedKind": "formal_sealed_dataset",
                    "sealedHashVersion": "aiqt-sealed-v1",
                    "minimumRows": 163_199,
                    "minimumPreRollRows": 33_599,
                    "developmentScoringRows": 103_680,
                    "withheldRows": 25_920,
                    "completeRequired": True,
                    "testPartitionHidden": True,
                    "parameterPaths": ["reversion.entryZThreshold"],
                    "evaluatorVersion": "strategy-evaluator-v2",
                    "evaluatorCallable": True,
                },
            ],
        )

    def test_registry_rejects_template_grid_outside_declared_parameter_bounds(self) -> None:
        baseline = StrategyResearchCapabilityRegistry().registered()[0]
        invalid = replace(
            baseline,
            dimensions=(
                {
                    "policyPath": "regime.closeAboveSmaWindow",
                    "values": [180, 501],
                },
                baseline.dimensions[1],
            ),
        )

        with self.assertRaisesRegex(
            ValueError,
            "strategy_research_template_capability_invalid",
        ):
            StrategyResearchCapabilityRegistry((invalid,))

    def test_registry_derives_the_full_server_ordered_compatible_set(self) -> None:
        defaults = StrategyResearchCapabilityRegistry().registered()
        conservative = replace(
            defaults[0],
            template_id="regime-breakout-conservative-v2",
            dimensions=(
                defaults[0].dimensions[0],
                {
                    "policyPath": "breakout.lookbackBars",
                    "values": [20, 22, 24],
                },
            ),
        )
        registry = StrategyResearchCapabilityRegistry(
            (defaults[0], conservative, defaults[1])
        )
        run = _source_run()
        matches = registry.compatible(
            policy_kind="regime_breakout_v2",
            market=run.market,
            symbol=run.symbol,
            timeframe=run.timeframe,
            sealed_context={
                "hashVersion": run.data_snapshot["hashVersion"],
                "preRollVersion": run.data_snapshot["preRollVersion"],
                "scoringWindow": run.data_snapshot["scoringWindow"],
                "sealedDataset": run.data_snapshot["sealedDataset"],
            },
        )
        with tempfile.TemporaryDirectory() as directory:
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
                capability_registry=registry,
            )
            proposal = orchestrator.propose(
                {
                    "sourceRunId": run.run_id,
                    "goal": "服务端注册顺序决定完整兼容模板集合",
                    "providerId": "local",
                    "externalDataApproved": False,
                }
            )

        self.assertEqual(proposal["template"]["templateId"], "regime-breakout-v2")
        self.assertEqual(
            [template.template_id for template in matches],
            [
                "regime-breakout-v2",
                "regime-breakout-conservative-v2",
            ],
        )

    def test_client_template_scope_field_is_rejected(self) -> None:
        run = _source_run()
        with tempfile.TemporaryDirectory() as directory:
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
            )

            with self.assertRaises(StrategyResearchError) as caught:
                orchestrator.propose(
                    {
                        "sourceRunId": run.run_id,
                        "goal": "未知注册模板必须失败关闭",
                        "providerId": "local",
                        "externalDataApproved": False,
                        "allowedTemplateIds": [
                            "regime-breakout-v2",
                            "unknown-template",
                        ],
                    }
                )

        self.assertEqual(caught.exception.code, "invalid_strategy_research_proposal")

    def test_cost_aware_range_reversion_v11_is_a_registered_bounded_template(self) -> None:
        baseline = _source_run()
        strategy = _cost_aware_range_reversion_strategy()
        run = replace(
            baseline,
            strategy_name=strategy.name,
            strategy_revision=strategy.revision,
            strategy_config=strategy_config_to_payload(strategy),
        )
        with tempfile.TemporaryDirectory() as directory:
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
            )

            proposal = orchestrator.propose(
                {
                    "sourceRunId": run.run_id,
                    "goal": "验证成本感知区间反转的冻结参数网格",
                    "providerId": "local",
                    "externalDataApproved": False,
                }
            )

        self.assertEqual(
            proposal["template"],
            {
                "templateId": "cost-aware-range-reversion-v1-1",
                "policyKind": "cost_aware_range_reversion_v1_1",
                "baseStrategyRevision": "d24a37e2e199",
            },
        )
        self.assertEqual(
            proposal["experiment"]["dimensions"],
            [
                {
                    "policyPath": "reversion.entryZThreshold",
                    "values": [-2.5, -2.0, -1.5],
                }
            ],
        )

    def test_local_proposal_uses_registered_template_and_only_server_owned_development_evidence(self) -> None:
        run = _source_run()
        source = _SealedSource()
        with tempfile.TemporaryDirectory() as directory:
            audit_store = AuditEventStore(f"{directory}/audit.sqlite")
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=audit_store,
                sealed_bar_source=source,
            )

            request = {
                "sourceRunId": run.run_id,
                "goal": "基于已完成历史行情研究低回撤的 BTC 趋势策略",
                "providerId": "local",
                "externalDataApproved": False,
            }
            proposal = orchestrator.propose(request)
            replay = orchestrator.propose(request)
            stored = audit_store.get(proposal["proposalId"])

        self.assertEqual(proposal, replay)
        self.assertIsNotNone(stored)
        self.assertEqual(stored.event_type, "strategy_research_proposal")
        self.assertEqual(stored.run_id, run.run_id)
        self.assertEqual(stored.metadata, {"proposal": proposal})
        self.assertRegex(proposal["proposalId"], r"^strategy-research-proposal-[0-9a-f]{24}$")
        self.assertEqual(
            proposal["template"],
            {
                "templateId": "regime-breakout-v2",
                "policyKind": "regime_breakout_v2",
                "baseStrategyRevision": run.strategy_revision,
            },
        )
        self.assertEqual(
            proposal["experiment"],
            {
                "dimensions": [
                    {
                        "policyPath": "regime.closeAboveSmaWindow",
                        "values": [180, 200, 220],
                    },
                    {
                        "policyPath": "breakout.lookbackBars",
                        "values": [18, 20, 22],
                    },
                ],
                "assumptions": {"initialCash": 10, "feeBps": 10, "slippageBps": 10},
                "guardrails": {
                    "development": {"minimumRoundTripCount": 30},
                    "validation": {
                        "requirePositiveReturn": True,
                        "minimumProfitFactor": 1.2,
                        "maximumDrawdownPct": 3,
                        "minimumRoundTripCount": 6,
                    },
                    "test": {
                        "requirePositiveReturn": True,
                        "minimumProfitFactor": 1.2,
                        "maximumDrawdownPct": 3,
                        "minimumRoundTripCount": 6,
                    },
                    "rolling": {"requiredWindowCount": 7, "minimumPositiveWindowCount": 5},
                    "stability": {"requirePositiveAdjacentCandidates": True},
                },
            },
        )
        self.assertEqual(
            proposal["evidence"],
            {
                "sourceRunId": run.run_id,
                "market": "crypto",
                "symbol": "BTC/USDT",
                "timeframe": "1m",
                "rows": _sealed_fixture()[1].development_rows,
                "startAt": _sealed_fixture()[1].start.isoformat(),
                "developmentEndExclusive": _sealed_fixture()[
                    1
                ].development_end_exclusive.isoformat(),
                "developmentHash": _sealed_fixture()[1].development_hash,
                "quality": "complete",
                "baselineMetrics": {
                    "totalReturnPct": 0.0,
                    "maxDrawdownPct": 0.0,
                    "profitFactor": 0.0,
                    "roundTripCount": 0,
                },
            },
        )
        self.assertEqual(
            proposal["generation"],
            {
                "requestedProvider": "local",
                "usedProvider": "local",
                "status": "skipped",
                "externalDataApproved": False,
                "reasons": [
                    "本地确定性方案沿用当前规范策略模板，不生成或执行任意代码。",
                    "实验参数由服务端注册表固定，收益、排名与留出集结果不能由浏览器上传。",
                    "候选必须经过正式实验和人工晋级，当前提案不会保存、绑定或启动策略。",
                ],
            },
        )
        serialized = repr(proposal)
        self.assertNotIn("datasetHash", serialized)
        self.assertNotIn("withheldRows", serialized)
        self.assertNotIn("a" * 64, serialized)
        self.assertNotIn("total_return_pct", serialized)
        self.assertEqual(source.test_reads, 0)
        self.assertEqual(
            proposal["boundary"],
            {
                "proposalOnly": True,
                "proposalPersisted": True,
                "strategySaved": False,
                "testRead": False,
                "promotionExecuted": False,
                "strategyBound": False,
                "monitoringStarted": False,
                "orderSubmitted": False,
                "paperOnly": True,
                "liveBlockedBoundary": True,
            },
        )

    def test_launch_reloads_persisted_proposal_and_only_starts_fixed_formal_experiment(self) -> None:
        run = _source_run()
        runner = _ExperimentRunner()
        with tempfile.TemporaryDirectory() as directory:
            audit_store = AuditEventStore(f"{directory}/audit.sqlite")
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=audit_store,
                experiment_runner=runner,
            )
            proposal = orchestrator.propose(
                {
                    "sourceRunId": run.run_id,
                    "goal": "生成可验证且保持 Paper-only 的 BTC 策略正式实验",
                    "providerId": "local",
                    "externalDataApproved": False,
                }
            )

            launch = orchestrator.launch(
                proposal["proposalId"],
                operator="operator@example.com",
                confirmed=True,
            )
            replay = orchestrator.launch(
                proposal["proposalId"],
                operator="operator@example.com",
                confirmed=True,
            )
            launch_event = audit_store.get(
                f"strategy-research-launch-{launch['experimentId']}"
            )

        self.assertEqual(launch, replay)
        self.assertEqual(len(runner.calls), 2)
        experiment_payload, idempotency_key = runner.calls[0]
        self.assertEqual(idempotency_key, proposal["proposalId"])
        self.assertEqual(
            experiment_payload,
            {
                "strategyRevision": run.strategy_revision,
                "sourceRunId": run.run_id,
                "assumptions": {"initialCash": 10, "feeBps": 10, "slippageBps": 10},
                "dimensions": proposal["experiment"]["dimensions"],
                "guardrails": proposal["experiment"]["guardrails"],
                "walkForward": {
                    "trainBars": 43_200,
                    "validationBars": 8_640,
                    "stepBars": 8_640,
                },
            },
        )
        self.assertEqual(launch["status"], "pending")
        self.assertEqual(launch["operator"], "operator@example.com")
        self.assertEqual(len(runner.launch_intents), 2)
        self.assertEqual(
            runner.launch_intents[0],
            runner.launch_intents[1],
        )
        assert runner.launch_intents[0] is not None
        self.assertEqual(
            runner.launch_intents[0]["proposalId"],
            proposal["proposalId"],
        )
        self.assertEqual(
            runner.launch_intents[0]["experimentId"],
            launch["experimentId"],
        )
        self.assertEqual(
            launch["boundary"],
            {
                "experimentStarted": True,
                "promotionExecuted": False,
                "strategyBound": False,
                "monitoringStarted": False,
                "orderSubmitted": False,
                "paperOnly": True,
                "liveBlockedBoundary": True,
            },
        )
        self.assertIsNotNone(launch_event)
        self.assertEqual(
            launch_event.metadata,
            {
                "proposalId": proposal["proposalId"],
                "experimentId": launch["experimentId"],
                "definitionIdentityHash": runner.launch_intents[0][
                    "definitionIdentityHash"
                ],
                "operator": "operator@example.com",
                "confirmed": True,
            },
        )

    def test_launch_audit_failure_cannot_queue_an_executable_experiment(self) -> None:
        run = _source_run()
        runner = _ExperimentRunner()

        class FailingLaunchAuditStore:
            def __init__(self, delegate) -> None:
                self.delegate = delegate

            def record_if_absent(self, event):
                if event.get("eventType") == "strategy_research_launch":
                    raise RuntimeError("injected_launch_audit_failure")
                return self.delegate.record_if_absent(event)

            def get(self, event_id):
                return self.delegate.get(event_id)

        with tempfile.TemporaryDirectory() as directory:
            audit_store = FailingLaunchAuditStore(
                AuditEventStore(f"{directory}/audit.sqlite")
            )
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=audit_store,
                experiment_runner=runner,
            )
            proposal = orchestrator.propose(
                {
                    "sourceRunId": run.run_id,
                    "goal": "审计失败时不得启动或排队正式策略实验",
                    "providerId": "local",
                    "externalDataApproved": False,
                }
            )

            with self.assertRaisesRegex(
                RuntimeError,
                "injected_launch_audit_failure",
            ):
                orchestrator.launch(
                    proposal["proposalId"],
                    operator="operator@example.com",
                    confirmed=True,
                )

        self.assertEqual(runner.calls, [])
        self.assertEqual(runner.details, {})

    def test_read_aggregates_existing_state_without_exposing_sealed_test_identity(self) -> None:
        run = _source_run()
        runner = _ExperimentRunner()
        with tempfile.TemporaryDirectory() as directory:
            audit_store = AuditEventStore(f"{directory}/audit.sqlite")
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=audit_store,
                experiment_runner=runner,
                experiment_store=runner,
            )
            proposal = orchestrator.propose(
                {
                    "sourceRunId": run.run_id,
                    "goal": "读取正式实验状态但不泄露密封测试集身份",
                    "providerId": "local",
                    "externalDataApproved": False,
                }
            )
            launch = orchestrator.launch(
                proposal["proposalId"],
                operator="operator@example.com",
                confirmed=True,
            )

            research = orchestrator.read(launch["experimentId"])

        self.assertEqual(research["proposal"]["proposalId"], proposal["proposalId"])
        self.assertEqual(research["experiment"]["status"], "pending")
        self.assertEqual(research["experiment"]["holdoutStatus"], "unconsumed")
        self.assertEqual(research["reviews"], [])
        self.assertIsNone(research["promotion"])
        self.assertEqual(research["paper"]["status"], "unavailable")
        self.assertEqual(research["nextActions"], ["wait_for_formal_experiment"])
        serialized = repr(research)
        self.assertNotIn("server-only-dataset-hash", serialized)
        self.assertNotIn("datasetHash", serialized)
        self.assertNotIn("withheldRows", serialized)
        self.assertEqual(
            research["boundary"],
            {
                "readOnly": True,
                "testBarsExposed": False,
                "promotionExecuted": False,
                "strategyBound": False,
                "monitoringStarted": False,
                "orderSubmitted": False,
                "paperOnly": False,
                "liveBlockedBoundary": False,
            },
        )

    def test_read_revokes_paper_trust_when_runtime_snapshot_is_live(self) -> None:
        run = _source_run()
        runner = _ExperimentRunner()
        with tempfile.TemporaryDirectory() as directory:
            audit_store = AuditEventStore(f"{directory}/audit.sqlite")
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=audit_store,
                experiment_runner=runner,
                experiment_store=runner,
                auto_snapshot_loader=lambda: {
                    "state": {"executionMode": "live", "enabled": True},
                    "strategyBinding": {
                        "experimentId": next(iter(runner.details)),
                        "revision": run.strategy_revision,
                    },
                    "paperOnly": False,
                    "liveBlockedBoundary": False,
                    "liveTradingAllowed": True,
                    "orderSubmissionEnabled": True,
                    "routeExecuted": True,
                },
            )
            proposal = orchestrator.propose(
                {
                    "sourceRunId": run.run_id,
                    "goal": "拒绝把实盘状态包装成 Paper 策略研发证据",
                    "providerId": "local",
                    "externalDataApproved": False,
                }
            )
            launch = orchestrator.launch(
                proposal["proposalId"],
                operator="operator@example.com",
                confirmed=True,
            )
            experiment = runner.details[launch["experimentId"]].experiment
            experiment.status = "completed"
            experiment.profitability_gate_passed = True
            experiment.promotion_run_id = "fresh-p0-run"
            experiment.promoted_strategy_revision = run.strategy_revision
            experiment.promotion_lineage_hash = "promotion-lineage"
            experiment.promoted_at = datetime(2026, 8, 10, tzinfo=timezone.utc)
            experiment.promotion_operator = "operator@example.com"

            research = orchestrator.read(launch["experimentId"])

        self.assertEqual(research["paper"]["status"], "unavailable")
        self.assertFalse(research["boundary"]["strategyBound"])
        self.assertFalse(research["boundary"]["monitoringStarted"])
        self.assertFalse(research["boundary"]["paperOnly"])
        self.assertFalse(research["boundary"]["liveBlockedBoundary"])
        self.assertEqual(
            research["nextActions"],
            ["inspect_paper_runtime_boundary"],
        )

    def test_read_fails_closed_for_blocked_or_corrupt_matching_paper_binding(self) -> None:
        run = _source_run()
        runner = _ExperimentRunner()
        snapshot = {
            "state": {"executionMode": "paper", "enabled": True},
            "strategyBinding": None,
            "paperOnly": True,
            "liveBlockedBoundary": True,
            "liveTradingAllowed": False,
            "orderSubmissionEnabled": False,
            "routeExecuted": False,
        }
        with tempfile.TemporaryDirectory() as directory:
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
                experiment_runner=runner,
                experiment_store=runner,
                auto_snapshot_loader=lambda: snapshot,
            )
            proposal = orchestrator.propose(
                {
                    "sourceRunId": run.run_id,
                    "goal": "损坏或阻塞的 Paper 绑定必须失败关闭",
                    "providerId": "local",
                    "externalDataApproved": False,
                }
            )
            launch = orchestrator.launch(
                proposal["proposalId"],
                operator="operator@example.com",
                confirmed=True,
            )
            experiment = runner.details[launch["experimentId"]].experiment
            experiment.status = "completed"
            experiment.profitability_gate_passed = True
            experiment.promotion_run_id = "fresh-p0-run"
            experiment.promoted_strategy_revision = run.strategy_revision
            experiment.promotion_lineage_hash = "promotion-lineage"
            experiment.promoted_at = datetime(2026, 8, 10, tzinfo=timezone.utc)
            experiment.promotion_operator = "operator@example.com"

            invalid_bindings = (
                {
                    "kind": "library",
                    "status": "blocked",
                    "paperOnly": True,
                    "experimentId": launch["experimentId"],
                    "revision": run.strategy_revision,
                },
                {
                    "kind": "external",
                    "status": "ready",
                    "paperOnly": True,
                    "experimentId": launch["experimentId"],
                    "revision": run.strategy_revision,
                },
                {
                    "kind": "library",
                    "status": "ready",
                    "paperOnly": False,
                    "experimentId": launch["experimentId"],
                    "revision": run.strategy_revision,
                },
            )
            projections = []
            for binding in invalid_bindings:
                snapshot["strategyBinding"] = binding
                projections.append(orchestrator.read(launch["experimentId"]))

        self.assertEqual(
            [projection["paper"]["status"] for projection in projections],
            ["unavailable", "unavailable", "unavailable"],
        )
        self.assertTrue(
            all(
                projection["nextActions"] == ["inspect_paper_runtime_boundary"]
                and projection["boundary"]["strategyBound"] is False
                and projection["boundary"]["monitoringStarted"] is False
                and projection["boundary"]["paperOnly"] is False
                for projection in projections
            )
        )

    def test_read_treats_safe_paper_snapshot_without_binding_as_not_bound(self) -> None:
        run = _source_run()
        runner = _ExperimentRunner()
        with tempfile.TemporaryDirectory() as directory:
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
                experiment_runner=runner,
                experiment_store=runner,
                auto_snapshot_loader=lambda: {
                    "state": {"executionMode": "paper", "enabled": False},
                    "strategyBinding": None,
                    "paperOnly": True,
                    "liveBlockedBoundary": True,
                    "liveTradingAllowed": False,
                    "orderSubmissionEnabled": False,
                    "routeExecuted": False,
                },
            )
            proposal = orchestrator.propose(
                {
                    "sourceRunId": run.run_id,
                    "goal": "把安全的 Paper 空绑定识别为尚未绑定",
                    "providerId": "local",
                    "externalDataApproved": False,
                }
            )
            launch = orchestrator.launch(
                proposal["proposalId"],
                operator="operator@example.com",
                confirmed=True,
            )

            research = orchestrator.read(launch["experimentId"])

        self.assertEqual(research["paper"]["status"], "not_bound")
        self.assertTrue(research["boundary"]["paperOnly"])
        self.assertTrue(research["boundary"]["liveBlockedBoundary"])

    def test_external_proposal_can_only_select_registered_template_from_safe_development_evidence(self) -> None:
        run = _source_run()
        provider = _Provider()
        with tempfile.TemporaryDirectory() as directory:
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (
                        ProviderStatus("local", True, None, None),
                        ProviderStatus(
                            "openai-compatible",
                            True,
                            "strategy-research-model",
                            "https://example.invalid/v1",
                        ),
                    ),
                    {"openai-compatible": provider},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
            )

            proposal = orchestrator.propose(
                {
                    "sourceRunId": run.run_id,
                    "goal": "基于开发集证据选择最合适的低回撤 BTC 策略模板",
                    "providerId": "openai-compatible",
                    "externalDataApproved": True,
                }
            )

        self.assertEqual(
            provider.output_schema["properties"]["templateId"]["enum"],
            ["regime-breakout-v2"],
        )
        self.assertEqual(
            provider.output_schema["properties"]["reasonCodes"],
            {
                "type": "array",
                "minItems": 3,
                "maxItems": 6,
                "uniqueItems": True,
                "items": {
                    "type": "string",
                    "enum": [
                        "context_compatible",
                        "development_evidence_supported",
                        "server_bounded_search",
                        "risk_objective_aligned",
                        "formal_validation_required",
                        "human_promotion_required",
                    ],
                },
            },
        )
        self.assertIn('"developmentEvidence"', provider.prompt)
        self.assertIn('"developmentHash"', provider.prompt)
        self.assertIn('"baselineMetrics"', provider.prompt)
        self.assertIn('"totalReturnPct":0.0', provider.prompt)
        self.assertNotIn("datasetHash", provider.prompt)
        self.assertNotIn("withheldRows", provider.prompt)
        self.assertNotIn("a" * 64, provider.prompt)
        self.assertNotIn("total_return_pct", provider.prompt)
        self.assertEqual(
            proposal["generation"],
            {
                "requestedProvider": "openai-compatible",
                "usedProvider": "openai-compatible",
                "status": "completed",
                "externalDataApproved": True,
                "model": "strategy-research-model",
                "sanitizedBaseUrl": "https://example.invalid/v1",
                "latencyMs": 12,
                "reasons": [
                    "注册模板的市场、标的、周期与当前开发证据上下文一致。",
                    "参数搜索范围已经由注册能力限制，模型不能扩大实验预算。",
                    "候选仍需通过滚动验证与唯一留出集检验。",
                ],
            },
        )

    def test_external_proposal_rejects_non_closed_reason_codes_without_audit_write(self) -> None:
        run = _source_run()
        invalid_reason_codes = (
            (
                "invisible_unicode",
                [
                    "context_compatible",
                    "server_bounded_search",
                    "formal_validation_required\u200b",
                ],
            ),
            (
                "profit_guarantee",
                ["context_compatible", "server_bounded_search", "必然盈利"],
            ),
            (
                "fabricated_test_return",
                ["context_compatible", "server_bounded_search", "测试集盈利999%"],
            ),
            (
                "safe_negation_with_dangerous_semantics",
                [
                    "context_compatible",
                    "server_bounded_search",
                    "这不是交易建议，但请立即满仓买入",
                ],
            ),
            (
                "unknown",
                ["context_compatible", "server_bounded_search", "unknown_reason"],
            ),
            (
                "duplicate",
                [
                    "context_compatible",
                    "server_bounded_search",
                    "server_bounded_search",
                ],
            ),
            (
                "insufficient",
                ["context_compatible", "server_bounded_search"],
            ),
        )
        for case, reason_codes in invalid_reason_codes:
            with self.subTest(case=case), tempfile.TemporaryDirectory() as directory:
                provider = _Provider(reason_codes=reason_codes)
                audit_store = AuditEventStore(f"{directory}/audit.sqlite")
                orchestrator = AiStrategyResearchOrchestrator(
                    run_store=_RunStore(run),
                    provider_registry=AiReviewProviderRegistry(
                        (
                            ProviderStatus("local", True, None, None),
                            ProviderStatus(
                                "openai-compatible",
                                True,
                                "strategy-research-model",
                                "https://example.invalid/v1",
                            ),
                        ),
                        {"openai-compatible": provider},
                    ),
                    audit_store=audit_store,
                )

                with self.assertRaisesRegex(
                    ValueError,
                    "strategy_research_provider_reason_codes_invalid",
                ):
                    orchestrator.propose(
                        {
                            "sourceRunId": run.run_id,
                            "goal": "外部解释不得输出危险语义或虚构事实",
                            "providerId": "openai-compatible",
                            "externalDataApproved": True,
                        }
                    )

                self.assertEqual(audit_store.count(), 0)

    def test_external_provider_selects_only_from_policy_compatible_registered_templates(self) -> None:
        run = _source_run()
        provider = _Provider("regime-breakout-conservative")
        defaults = StrategyResearchCapabilityRegistry().registered()
        registry = StrategyResearchCapabilityRegistry(
            (
                replace(
                    defaults[0],
                    template_id="regime-breakout-conservative",
                    dimensions=(
                        defaults[0].dimensions[0],
                        {"policyPath": "breakout.lookbackBars", "values": [20, 22, 24]},
                    ),
                ),
                defaults[0],
                defaults[1],
            )
        )
        with tempfile.TemporaryDirectory() as directory:
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(run),
                provider_registry=AiReviewProviderRegistry(
                    (
                        ProviderStatus("local", True, None, None),
                        ProviderStatus(
                            "openai-compatible",
                            True,
                            "strategy-research-model",
                            "https://example.invalid/v1",
                        ),
                    ),
                    {"openai-compatible": provider},
                ),
                audit_store=AuditEventStore(f"{directory}/audit.sqlite"),
                capability_registry=registry,
            )

            proposal = orchestrator.propose(
                {
                    "sourceRunId": run.run_id,
                    "goal": "从当前策略语义兼容的注册模板中选择正式实验",
                    "providerId": "openai-compatible",
                    "externalDataApproved": True,
                }
            )

        self.assertEqual(
            provider.output_schema["properties"]["templateId"]["enum"],
            ["regime-breakout-conservative", "regime-breakout-v2"],
        )
        self.assertNotIn("cost-aware-range-reversion-v1-1", provider.prompt)
        self.assertEqual(proposal["template"]["templateId"], "regime-breakout-conservative")
        self.assertEqual(
            proposal["experiment"]["dimensions"],
            [
                {
                    "policyPath": "regime.closeAboveSmaWindow",
                    "values": [180, 200, 220],
                },
                {"policyPath": "breakout.lookbackBars", "values": [20, 22, 24]},
            ],
        )


class StrategyResearchProposalApiTests(unittest.TestCase):
    def test_post_proposal_uses_stored_run_and_rejects_browser_metrics(self) -> None:
        registry = AiReviewProviderRegistry(
            (ProviderStatus("local", True, None, None),),
            {},
        )
        with tempfile.TemporaryDirectory() as directory:
            run_store = ResearchRunStore(f"{directory}/runs.sqlite")
            run_store.record(_source_run())

            class TestHandler(QuantApiHandler):
                ai_review_provider_registry = registry

                def log_message(self, format, *args):
                    del format, args

            TestHandler.run_store = run_store
            TestHandler.sealed_dataset_store = _SealedSource()
            TestHandler.audit_event_store = AuditEventStore(f"{directory}/audit.sqlite")

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            request = {
                "sourceRunId": "run-server-owned-development",
                "goal": "基于服务端开发证据生成 BTC 正式实验提案",
                "providerId": "local",
                "externalDataApproved": False,
            }
            try:
                status, payload = self._post(server, request)
                forged_status, forged_payload = self._post(
                    server,
                    {**request, "metrics": {"totalReturnPct": 99}},
                )
                unknown_status, unknown_payload = self._post(
                    server,
                    {
                        **request,
                        "allowedTemplateIds": [
                            "regime-breakout-v2",
                            "unknown-template",
                        ],
                    },
                )
            finally:
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(status, 200)
        self.assertEqual(payload["proposal"]["evidence"]["sourceRunId"], request["sourceRunId"])
        self.assertEqual(payload["proposal"]["template"]["templateId"], "regime-breakout-v2")
        self.assertTrue(payload["proposal"]["boundary"]["proposalOnly"])
        self.assertEqual(forged_status, 400)
        self.assertEqual(forged_payload["error"], "invalid_strategy_research_proposal")
        self.assertEqual(unknown_status, 400)
        self.assertEqual(unknown_payload["error"], "invalid_strategy_research_proposal")

    def test_post_launch_only_accepts_persisted_proposal_identity_and_confirmation(self) -> None:
        registry = AiReviewProviderRegistry(
            (ProviderStatus("local", True, None, None),),
            {},
        )
        runner = _ExperimentRunner()
        with tempfile.TemporaryDirectory() as directory:
            audit_store = AuditEventStore(f"{directory}/audit.sqlite")
            orchestrator = AiStrategyResearchOrchestrator(
                run_store=_RunStore(_source_run()),
                provider_registry=registry,
                audit_store=audit_store,
                experiment_runner=runner,
            )
            proposal = orchestrator.propose(
                {
                    "sourceRunId": "run-server-owned-development",
                    "goal": "确认后启动服务端固定的 BTC 正式策略实验",
                    "providerId": "local",
                    "externalDataApproved": False,
                }
            )

            class TestHandler(QuantApiHandler):
                def log_message(self, format, *args):
                    del format, args

                def _strategy_research_orchestrator(self):
                    return orchestrator

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            request = {
                "proposalId": proposal["proposalId"],
                "operator": "operator@example.com",
                "confirmed": True,
            }
            try:
                status, payload = self._post(
                    server,
                    request,
                    path="/api/strategy-research/launches",
                )
                forged_status, forged_payload = self._post(
                    server,
                    {**request, "profitabilityGatePassed": True},
                    path="/api/strategy-research/launches",
                )
                read_status, read_payload = self._get(
                    server,
                    "/api/strategy-research/experiments/"
                    + payload["launch"]["experimentId"],
                )
            finally:
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(status, 201)
        self.assertEqual(payload["launch"]["proposalId"], proposal["proposalId"])
        self.assertEqual(payload["launch"]["status"], "pending")
        self.assertTrue(payload["launch"]["boundary"]["liveBlockedBoundary"])
        self.assertEqual(forged_status, 400)
        self.assertEqual(forged_payload["error"], "invalid_strategy_research_launch")
        self.assertEqual(read_status, 200)
        self.assertEqual(
            read_payload["research"]["experiment"]["experimentId"],
            payload["launch"]["experimentId"],
        )
        self.assertTrue(read_payload["research"]["boundary"]["readOnly"])

    def _post(
        self,
        server: HTTPServer,
        payload: dict[str, object],
        *,
        path: str = "/api/strategy-research/proposals",
    ):
        connection = HTTPConnection(
            server.server_address[0],
            server.server_address[1],
            timeout=5,
        )
        try:
            connection.request(
                "POST",
                path,
                body=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            response = connection.getresponse()
            return response.status, json.loads(response.read().decode("utf-8"))
        finally:
            connection.close()

    def _get(self, server: HTTPServer, path: str):
        connection = HTTPConnection(
            server.server_address[0],
            server.server_address[1],
            timeout=5,
        )
        try:
            connection.request("GET", path)
            response = connection.getresponse()
            return response.status, json.loads(response.read().decode("utf-8"))
        finally:
            connection.close()


if __name__ == "__main__":
    unittest.main()
