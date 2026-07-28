import json
import tempfile
import threading
import unittest
from datetime import datetime, timezone
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path

from quant_core.ai_research_m4 import (
    AiResearchM4Service,
    build_financial_fact_report,
    validate_ai_research_evidence,
)
from quant_core.ai_review_runs import AuthoritativeAiReviewRunRecord
from quant_core.audit_events import AuditEventStore
from quant_core.runs import ResearchRunAudit


class FixedStore:
    def __init__(self, rows):
        self.rows = rows

    def get(self, row_id):
        return self.rows.get(row_id)


def assessment():
    return {
        "stance": "supported",
        "summary": "证据支持继续研究，但不构成交易指令。",
        "risks": [
            {
                "severity": "medium",
                "message": "样本外表现仍可能退化。",
                "evidenceReferences": ["candidate"],
            }
        ],
        "invalidationConditions": ["验证期最大回撤突破既有风险限制。"],
        "watchItems": ["继续观察样本外收益。"],
        "evidenceGaps": ["尚未覆盖公告事件。"],
        "consistency": "consistent",
    }


def review(run_id="run-source", snapshot_hash="a" * 64):
    record = {
        "aiReviewId": "ai-review-" + "1" * 32,
        "primaryExperiment": {
            "sourceRunId": run_id,
            "snapshotId": snapshot_hash,
        },
        "evidenceBundle": {
            "evidenceItems": [
                {
                    "id": "context",
                    "kind": "experiment_context",
                    "value": {"market": "ashare", "symbol": "600000", "timeframe": "1d"},
                },
                {
                    "id": "quality",
                    "kind": "data_quality",
                    "value": {"rows": 2, "isComplete": True},
                },
                {
                    "id": "strategy",
                    "kind": "strategy_definition",
                    "value": {"name": "SMA", "revision": "r1"},
                },
                {
                    "id": "candidate",
                    "kind": "candidate_metrics",
                    "value": {
                        "selected": True,
                        "validationMetrics": {
                            "totalReturnPct": 8.0,
                            "maxDrawdownPct": -3.0,
                            "tradeCount": 4,
                        },
                    },
                },
            ]
        },
        "deterministicAssessment": assessment(),
        "externalAssessment": {"status": "skipped", "assessment": None},
    }
    return AuthoritativeAiReviewRunRecord(
        ai_review_id=record["aiReviewId"],
        run_id=run_id,
        primary_experiment_id="experiment-1",
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        evidence_hash="b" * 64,
        record_hash="c" * 64,
        record=record,
    )


def run(run_id, symbol, snapshot_hash, bars):
    return ResearchRunAudit(
        run_id=run_id,
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        market="ashare",
        symbol=symbol,
        timeframe="1d",
        strategy_name="SMA",
        strategy_revision="r1",
        data_rows=len(bars),
        metrics={},
        decisions=[],
        execution_mode="paper_only",
        data_snapshot={
            "source": "fixture",
            "isComplete": True,
            "warnings": [],
            "rows": len(bars),
            "start": bars[0]["timestamp"],
            "end": bars[-1]["timestamp"],
            "hash": snapshot_hash,
            "snapshotHash": snapshot_hash,
            "bars": bars,
        },
    )


def bar(day, close, low=None, high=None):
    return {
        "timestamp": f"2026-01-{day:02d}T00:00:00+00:00",
        "open": close,
        "high": high if high is not None else close,
        "low": low if low is not None else close,
        "close": close,
        "volume": 1_000,
        "market": "ashare",
        "symbol": "600000",
        "timeframe": "1d",
    }


def financial_fact(primary=100.0, comparison=101.0):
    return {
        "factId": "revenue",
        "label": "营业收入",
        "period": "2025",
        "unit": "CNY_M",
        "primary": {
            "source": "source-a",
            "value": primary,
            "period": "2025",
            "unit": "CNY_M",
            "observedAt": "2026-01-02T00:00:00+00:00",
        },
        "comparison": {
            "source": "source-b",
            "value": comparison,
            "period": "2025",
            "unit": "CNY_M",
            "observedAt": "2026-01-02T00:00:00+00:00",
        },
    }


class AiResearchM4Tests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.source = run(
            "run-source",
            "600000",
            "a" * 64,
            [bar(1, 99), bar(2, 100)],
        )
        self.outcome = run(
            "run-outcome",
            "600000",
            "d" * 64,
            [bar(2, 100), bar(3, 104, low=96, high=105), bar(4, 110, low=103, high=111)],
        )
        benchmark_bars = [bar(2, 200), bar(3, 202), bar(4, 204)]
        for item in benchmark_bars:
            item["symbol"] = "000300"
        self.benchmark = run("run-benchmark", "000300", "e" * 64, benchmark_bars)
        self.review = review()
        self.audit_store = AuditEventStore(Path(self.temp_dir.name) / "audit.sqlite")
        moments = iter(
            [
                datetime(2026, 1, 2, 1, tzinfo=timezone.utc),
                datetime(2026, 1, 5, 1, tzinfo=timezone.utc),
                datetime(2026, 1, 6, 1, tzinfo=timezone.utc),
            ]
        )
        self.service = AiResearchM4Service(
            review_store=FixedStore({self.review.ai_review_id: self.review}),
            run_store=FixedStore(
                {
                    self.source.run_id: self.source,
                    self.outcome.run_id: self.outcome,
                    self.benchmark.run_id: self.benchmark,
                }
            ),
            audit_store=self.audit_store,
            now=lambda: next(moments),
        )

    def request(self):
        return {
            "recommendation": {"stance": "bullish", "horizonBars": 2},
            "multiViewEnabled": True,
            "financialFacts": [financial_fact()],
        }

    def test_records_labeled_evidence_ratings_financial_check_and_three_views(self):
        artifact = self.service.create_evidence(self.review.ai_review_id, self.request())
        repeated = self.service.create_evidence(self.review.ai_review_id, self.request())

        self.assertEqual({claim["kind"] for claim in artifact["claims"]}, {
            "fact",
            "calculation",
            "assumption",
            "model_inference",
        })
        self.assertEqual(artifact["financialFactReport"]["status"], "warning")
        self.assertFalse(artifact["financialFactReport"]["valuesMerged"])
        self.assertEqual(
            [row["role"] for row in artifact["multiView"]["roles"]],
            ["bullish", "bearish", "neutral"],
        )
        self.assertFalse(artifact["investmentCertainty"]["derivedFromInformationRichness"])
        self.assertEqual(artifact["recordHash"], repeated["recordHash"])
        self.assertEqual(
            self.audit_store.count(event_type="ai_research_evidence"),
            1,
        )

    def test_financial_comparison_classifies_without_merging_and_rejects_same_source(self):
        agreement = build_financial_fact_report("ashare", [financial_fact(100, 100.2)])
        warning = build_financial_fact_report("ashare", [financial_fact(100, 101)])
        blocked = build_financial_fact_report("ashare", [financial_fact(100, 110)])

        self.assertEqual(agreement["status"], "agreement")
        self.assertEqual(warning["status"], "warning")
        self.assertEqual(blocked["status"], "blocked")
        self.assertFalse(blocked["facts"][0]["valuesMerged"])
        unit_mismatch = financial_fact(100, 100)
        unit_mismatch["comparison"]["unit"] = "CNY_10K"
        period_mismatch = financial_fact(100, 100)
        period_mismatch["comparison"]["period"] = "2024"
        self.assertEqual(
            build_financial_fact_report("ashare", [unit_mismatch])["facts"][0]["mismatchReasons"],
            ["unit_mismatch"],
        )
        self.assertEqual(
            build_financial_fact_report("ashare", [period_mismatch])["facts"][0]["mismatchReasons"],
            ["reporting_period_mismatch"],
        )
        same_source = financial_fact()
        same_source["comparison"]["source"] = "SOURCE-A"
        request = self.request()
        request["financialFacts"] = [same_source]
        with self.assertRaisesRegex(ValueError, "financial_fact_sources_not_independent"):
            self.service.create_evidence(self.review.ai_review_id, request)

    def test_multiview_is_blocked_for_minute_research(self):
        minute_run = ResearchRunAudit(
            **{
                **self.source.__dict__,
                "run_id": "run-minute",
                "timeframe": "1m",
            }
        )
        minute_review = review("run-minute")
        minute_review.record["primaryExperiment"]["snapshotId"] = "a" * 64
        service = AiResearchM4Service(
            review_store=FixedStore({minute_review.ai_review_id: minute_review}),
            run_store=FixedStore({"run-minute": minute_run}),
            audit_store=self.audit_store,
        )
        with self.assertRaisesRegex(ValueError, "multi_view_not_allowed_for_timeframe"):
            service.create_evidence(minute_review.ai_review_id, self.request())

    def test_evaluates_only_after_horizon_with_audited_benchmark_and_supplies_lesson_later(self):
        artifact = self.service.create_evidence(self.review.ai_review_id, self.request())
        outcome = self.service.evaluate_outcome(
            {
                "researchEvidenceId": artifact["researchEvidenceId"],
                "outcomeRunId": self.outcome.run_id,
                "benchmarkRunId": self.benchmark.run_id,
            }
        )

        self.assertEqual(outcome["rawReturnPct"], 10.0)
        self.assertEqual(outcome["adverseExcursionPct"], -4.0)
        self.assertEqual(outcome["benchmarkReturnPct"], 2.0)
        self.assertEqual(outcome["alphaPct"], 8.0)
        self.assertEqual(outcome["snapshotHash"], "a" * 64)
        self.assertTrue(outcome["boundary"]["researchContextOnly"])
        later_request = self.request()
        later_request["recommendation"]["horizonBars"] = 3
        later = self.service.create_evidence(self.review.ai_review_id, later_request)
        self.assertEqual(later["priorOutcomeLessons"][0]["outcomeId"], outcome["outcomeId"])
        self.assertFalse(later["boundary"]["affectsRisk"])
        self.assertFalse(later["boundary"]["affectsOrderRouting"])

    def test_rejects_early_outcome_and_tampered_evidence(self):
        request = self.request()
        request["recommendation"]["horizonBars"] = 3
        artifact = self.service.create_evidence(self.review.ai_review_id, request)
        with self.assertRaisesRegex(ValueError, "ai_research_horizon_not_reached"):
            self.service.evaluate_outcome(
                {
                    "researchEvidenceId": artifact["researchEvidenceId"],
                    "outcomeRunId": self.outcome.run_id,
                    "benchmarkRunId": self.benchmark.run_id,
                }
            )
        same_symbol_benchmark = run(
            "run-same-symbol-benchmark",
            "600000",
            "f" * 64,
            [bar(2, 100), bar(3, 102), bar(4, 104), bar(5, 106)],
        )
        self.service.run_store.rows[same_symbol_benchmark.run_id] = same_symbol_benchmark
        with self.assertRaisesRegex(ValueError, "ai_research_benchmark_context_mismatch"):
            self.service.evaluate_outcome(
                {
                    "researchEvidenceId": artifact["researchEvidenceId"],
                    "outcomeRunId": self.outcome.run_id,
                    "benchmarkRunId": same_symbol_benchmark.run_id,
                }
            )
        artifact["claims"][0]["text"] = "tampered"
        with self.assertRaisesRegex(ValueError, "ai_research_record_hash_mismatch"):
            validate_ai_research_evidence(artifact)

    def test_http_contract_creates_reads_and_evaluates_from_existing_stores(self):
        from quant_core.api import QuantApiHandler

        review_store = FixedStore({self.review.ai_review_id: self.review})
        run_store = FixedStore(
            {
                self.source.run_id: self.source,
                self.outcome.run_id: self.outcome,
                self.benchmark.run_id: self.benchmark,
            }
        )
        audit_store = AuditEventStore(Path(self.temp_dir.name) / "http-audit.sqlite")

        class Handler(QuantApiHandler):
            pass

        Handler.ai_review_store = review_store
        Handler.run_store = run_store
        Handler.audit_event_store = audit_store
        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        server.daemon_threads = True
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        def request(method, path, payload=None):
            connection = HTTPConnection(*server.server_address, timeout=5)
            try:
                body = None if payload is None else json.dumps(payload).encode("utf-8")
                headers = {} if body is None else {"Content-Type": "application/json"}
                connection.request(method, path, body=body, headers=headers)
                response = connection.getresponse()
                return response.status, json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()

        try:
            path = f"/api/ai-reviews/{self.review.ai_review_id}/research-evidence"
            status, created = request("POST", path, self.request())
            self.assertEqual(status, 201)
            status, loaded = request("GET", path)
            self.assertEqual(status, 200)
            self.assertEqual(
                loaded["researchEvidence"]["recordHash"],
                created["researchEvidence"]["recordHash"],
            )
            status, evaluated = request(
                "POST",
                "/api/ai-research/outcomes",
                {
                    "researchEvidenceId": created["researchEvidence"]["researchEvidenceId"],
                    "outcomeRunId": self.outcome.run_id,
                    "benchmarkRunId": self.benchmark.run_id,
                },
            )
            self.assertEqual(status, 201)
            self.assertEqual(evaluated["outcome"]["alphaPct"], 8.0)
            status, loaded = request("GET", path)
            self.assertEqual(status, 200)
            self.assertEqual(len(loaded["outcomes"]), 1)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
