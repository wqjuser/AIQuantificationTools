from __future__ import annotations

from datetime import datetime, timedelta, timezone
import unittest

from quant_core.market_ai_selection_core.research_value import build_research_value_cohorts


UTC = timezone.utc


def selection(
    index: int,
    *,
    weights: str = "weights-v1",
    provider: str = "provider-a",
    horizon: str = "short",
) -> dict[str, object]:
    started = datetime(2026, 1, 1, tzinfo=UTC) + timedelta(days=index * 4)
    return {
        "selectionId": f"selection-{index}",
        "generatedAt": started,
        "market": "ashare",
        "profile": "balanced",
        "horizon": horizon,
        "weightsVersion": weights,
        "providerIdentity": {"providerId": provider, "model": "model-a"},
        "recommendations": [{"evidenceId": f"evidence-{index}-{item}"} for item in range(5)],
    }


def review(index: int, *, alpha: float = 1.0, overlap: bool = False) -> dict[str, object]:
    started = datetime(2026, 1, 1, tzinfo=UTC) + timedelta(days=0 if overlap else index * 4)
    ended = started + timedelta(days=2)
    items = [
        {
            "candidateEvidenceId": f"evidence-{index}-{item}",
            "status": "completed",
            "referenceAt": started.isoformat(),
            "outcomeAt": ended.isoformat(),
            "returnPct": 2.0,
            "absoluteHit": True,
            "benchmarkSymbol": "000300",
            "relativeReturnPct": alpha,
            "benchmarkHit": alpha > 0,
        }
        for item in range(4)
    ]
    items.append(
        {
            "candidateEvidenceId": f"evidence-{index}-4",
            "status": "data_insufficient",
            "reason": "benchmark_must_use_different_symbol",
            "referenceAt": started.isoformat(),
            "outcomeAt": ended.isoformat(),
            "returnPct": 2.0,
            "absoluteHit": True,
        }
    )
    return {
        "selectionId": f"selection-{index}",
        "createdAt": ended,
        "reviewMode": "automatic_fixed_benchmark",
        "benchmarkPolicyVersion": "market-ai-selection-benchmark-v1",
        "benchmark": {"symbol": "000300"},
        "items": items,
    }


class ResearchValueCohortTest(unittest.TestCase):
    def test_thirty_non_overlapping_positive_batches_prove_stable_value(self) -> None:
        cohorts = build_research_value_cohorts(
            [selection(index) for index in range(30)],
            {f"selection-{index}": review(index) for index in range(30)},
        )

        self.assertEqual(len(cohorts), 1)
        cohort = cohorts[0]
        self.assertEqual(cohort["status"], "stable_positive")
        self.assertEqual(cohort["nonOverlappingSampleCount"], 30)
        self.assertEqual(cohort["benchmarkCoveragePct"], 80.0)
        self.assertEqual(cohort["relativeHitCount"], 30)
        self.assertGreater(cohort["relativeHitWilsonLowerPct"], 50.0)
        self.assertEqual(cohort["medianBatchAlphaPct"], 1.0)
        self.assertGreaterEqual(cohort["calendarMonthCount"], 3)

    def test_threshold_failures_collect_or_report_not_stable(self) -> None:
        collecting = build_research_value_cohorts(
            [selection(index) for index in range(29)],
            {f"selection-{index}": review(index) for index in range(29)},
        )[0]
        negative = build_research_value_cohorts(
            [selection(index) for index in range(30)],
            {f"selection-{index}": review(index, alpha=-1.0) for index in range(30)},
        )[0]

        self.assertEqual(collecting["status"], "collecting")
        self.assertEqual(negative["status"], "not_stable")

    def test_overlapping_windows_do_not_inflate_samples_and_cohorts_do_not_mix(self) -> None:
        selections = [selection(index) for index in range(30)]
        reviews = {f"selection-{index}": review(index, overlap=True) for index in range(30)}
        selections.append(selection(30, weights="weights-v2", provider="provider-b"))
        reviews["selection-30"] = review(30)

        cohorts = build_research_value_cohorts(selections, reviews)

        self.assertEqual(len(cohorts), 2)
        first = next(item for item in cohorts if item["weightsVersion"] == "weights-v1")
        self.assertEqual(first["nonOverlappingSampleCount"], 1)
        self.assertEqual(first["overlappingSampleCount"], 29)
        self.assertEqual(
            sum(batch["overlapping"] is True for batch in first["batches"]),
            29,
        )

    def test_benchmark_policy_versions_remain_separate_historical_cohorts(self) -> None:
        selections = [selection(0), selection(1)]
        first = review(0)
        second = review(1)
        second["benchmarkPolicyVersion"] = "market-ai-selection-benchmark-v2"
        second["benchmark"] = {"symbol": "000905"}
        for item in second["items"]:
            if item.get("status") == "completed":
                item["benchmarkSymbol"] = "000905"

        cohorts = build_research_value_cohorts(
            selections,
            {"selection-0": first, "selection-1": second},
        )

        self.assertEqual(len(cohorts), 2)
        self.assertEqual(
            {cohort["benchmarkPolicyVersion"] for cohort in cohorts},
            {
                "market-ai-selection-benchmark-v1",
                "market-ai-selection-benchmark-v2",
            },
        )
        historical = next(
            cohort
            for cohort in cohorts
            if cohort["benchmarkPolicyVersion"] == "market-ai-selection-benchmark-v2"
        )
        self.assertEqual(historical["benchmarkSymbol"], "000905")
        self.assertEqual(historical["reviewedBatchCount"], 1)

    def test_holding_horizons_remain_separate_cohorts(self) -> None:
        cohorts = build_research_value_cohorts(
            [selection(0, horizon="short"), selection(1, horizon="medium")],
            {"selection-0": review(0), "selection-1": review(1)},
        )

        self.assertEqual(len(cohorts), 2)
        self.assertEqual({cohort["horizon"] for cohort in cohorts}, {"short", "medium"})
        self.assertEqual({cohort["selectionBatchCount"] for cohort in cohorts}, {1})


if __name__ == "__main__":
    unittest.main()
