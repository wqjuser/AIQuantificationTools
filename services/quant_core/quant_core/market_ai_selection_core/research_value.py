from __future__ import annotations

from collections import defaultdict
from collections.abc import Mapping
import math
from statistics import median
from typing import Any

from quant_core.canonical import canonical_sha256

from .common import _finite_or_none, _market_ai_selection_rate, _parse_datetime


BENCHMARK_POLICY_VERSION = "market-ai-selection-benchmark-v1"
BENCHMARK_SYMBOLS = {
    "ashare": "000300",
    "us": "SPY",
    "crypto": "BTC/USDT",
}


def build_research_value_cohorts(
    selections: list[Mapping[str, Any]],
    reviews: Mapping[str, Mapping[str, Any]],
) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str, str, str, str], list[Mapping[str, Any]]] = defaultdict(list)
    provider_identities: dict[tuple[str, str, str, str, str], dict[str, Any]] = {}
    for selection in selections:
        provider_identity = dict(selection.get("providerIdentity") or {})
        review = reviews.get(str(selection.get("selectionId") or ""))
        policy_version = str(
            (review.get("benchmarkPolicyVersion") or BENCHMARK_POLICY_VERSION)
            if isinstance(review, Mapping)
            and review.get("reviewMode") == "automatic_fixed_benchmark"
            else BENCHMARK_POLICY_VERSION
        )
        key = (
            str(selection.get("market") or ""),
            str(selection.get("profile") or ""),
            str(selection.get("weightsVersion") or ""),
            canonical_sha256(provider_identity),
            policy_version,
        )
        grouped[key].append(selection)
        provider_identities[key] = provider_identity
    return [
        _cohort(key, rows, reviews, provider_identities[key])
        for key, rows in sorted(grouped.items())
    ]


def _cohort(
    key: tuple[str, str, str, str, str],
    selections: list[Mapping[str, Any]],
    reviews: Mapping[str, Mapping[str, Any]],
    provider_identity: dict[str, Any],
) -> dict[str, Any]:
    market, profile, weights_version, provider_hash, policy_version = key
    benchmark_symbol = next(
        (
            str(review.get("benchmark", {}).get("symbol") or "")
            for selection in selections
            if isinstance(
                review := reviews.get(str(selection.get("selectionId") or "")),
                Mapping,
            )
            and review.get("benchmarkPolicyVersion") == policy_version
            and isinstance(review.get("benchmark"), Mapping)
        ),
        BENCHMARK_SYMBOLS.get(market, ""),
    )
    batches = [
        _batch(
            selection,
            reviews.get(str(selection.get("selectionId") or "")),
            benchmark_symbol,
            policy_version,
        )
        for selection in selections
    ]
    batches.sort(key=lambda item: (item["referenceAt"] or item["generatedAt"], item["selectionId"]))
    last_outcome = None
    qualified: list[dict[str, Any]] = []
    for batch in batches:
        if batch["status"] != "qualified":
            continue
        reference_at = _parse_datetime(batch["referenceAt"])
        outcome_at = _parse_datetime(batch["outcomeAt"])
        if reference_at is None or outcome_at is None:
            batch["status"] = "data_insufficient"
            continue
        batch["overlapping"] = last_outcome is not None and reference_at <= last_outcome
        if not batch["overlapping"]:
            qualified.append(batch)
            last_outcome = outcome_at
    sample_count = len(qualified)
    hit_count = sum(float(batch["batchAlphaPct"]) > 0 for batch in qualified)
    recommendation_samples = sum(int(batch["recommendationCount"]) for batch in qualified)
    benchmark_samples = sum(int(batch["benchmarkSampleCount"]) for batch in qualified)
    coverage = _market_ai_selection_rate(benchmark_samples, recommendation_samples)
    hit_rate = _market_ai_selection_rate(hit_count, sample_count)
    wilson_lower = _wilson_lower_pct(hit_count, sample_count)
    median_alpha = round(median(float(batch["batchAlphaPct"]) for batch in qualified), 6) if qualified else None
    calendar_months = _calendar_month_count(qualified)
    enough_history = sample_count >= 30 and calendar_months >= 3
    stable = (
        enough_history
        and coverage is not None
        and coverage >= 80
        and wilson_lower is not None
        and wilson_lower > 50
        and median_alpha is not None
        and median_alpha > 0
    )
    status = (
        "insufficient_sample"
        if sample_count == 0
        else "collecting"
        if not enough_history
        else "stable_positive"
        if stable
        else "not_stable"
    )
    cohort_identity = {
        "market": market,
        "profile": profile,
        "weightsVersion": weights_version,
        "providerIdentity": provider_identity,
        "benchmarkPolicyVersion": policy_version,
    }
    return {
        "cohortId": f"research-value-{canonical_sha256(cohort_identity)[:24]}",
        **cohort_identity,
        "providerIdentityHash": provider_hash,
        "benchmarkSymbol": benchmark_symbol,
        "selectionBatchCount": len(selections),
        "reviewedBatchCount": sum(batch["reviewed"] for batch in batches),
        "qualifiedBatchCount": sum(batch["status"] == "qualified" for batch in batches),
        "nonOverlappingSampleCount": sample_count,
        "overlappingSampleCount": sum(batch["overlapping"] is True for batch in batches),
        "recommendationSampleCount": recommendation_samples,
        "benchmarkSampleCount": benchmark_samples,
        "benchmarkCoveragePct": coverage,
        "relativeHitCount": hit_count,
        "relativeHitRatePct": hit_rate,
        "relativeHitWilsonLowerPct": wilson_lower,
        "medianBatchAlphaPct": median_alpha,
        "calendarMonthCount": calendar_months,
        "status": status,
        "batches": batches,
    }


def _batch(
    selection: Mapping[str, Any],
    review: Mapping[str, Any] | None,
    benchmark_symbol: str,
    policy_version: str,
) -> dict[str, Any]:
    selection_id = str(selection.get("selectionId") or "")
    recommendations = selection.get("recommendations")
    recommendation_count = len(recommendations) if isinstance(recommendations, list) else 0
    fixed_review = bool(
        review is not None
        and review.get("reviewMode") == "automatic_fixed_benchmark"
        and review.get("benchmarkPolicyVersion") == policy_version
    )
    base = {
        "selectionId": selection_id,
        "generatedAt": _iso(selection.get("generatedAt")),
        "reviewed": fixed_review,
        "recommendationCount": recommendation_count,
        "benchmarkSampleCount": 0,
        "benchmarkCoveragePct": _market_ai_selection_rate(0, recommendation_count),
        "batchAlphaPct": None,
        "referenceAt": None,
        "outcomeAt": None,
        "overlapping": False,
        "status": "observing" if not fixed_review else "data_insufficient",
    }
    if not fixed_review or review.get("benchmark", {}).get("symbol") != benchmark_symbol:
        return base
    items = review.get("items")
    if not isinstance(items, list):
        return base
    relative_returns = [
        value
        for item in items
        if isinstance(item, Mapping)
        and item.get("status") == "completed"
        and item.get("benchmarkSymbol") == benchmark_symbol
        and (value := _finite_or_none(item.get("relativeReturnPct"))) is not None
    ]
    references = [_parse_datetime(item.get("referenceAt")) for item in items if isinstance(item, Mapping)]
    outcomes = [_parse_datetime(item.get("outcomeAt")) for item in items if isinstance(item, Mapping)]
    valid_references = [value for value in references if value is not None]
    valid_outcomes = [value for value in outcomes if value is not None]
    coverage = _market_ai_selection_rate(len(relative_returns), recommendation_count)
    qualified = recommendation_count == 5 and len(relative_returns) >= 4 and valid_references and valid_outcomes
    observing = any(
        isinstance(item, Mapping) and item.get("status") == "observing"
        for item in items
    )
    return {
        **base,
        "benchmarkSampleCount": len(relative_returns),
        "benchmarkCoveragePct": coverage,
        "batchAlphaPct": round(sum(relative_returns) / len(relative_returns), 6) if relative_returns else None,
        "referenceAt": min(valid_references).isoformat() if valid_references else None,
        "outcomeAt": max(valid_outcomes).isoformat() if valid_outcomes else None,
        "status": "qualified" if qualified else "observing" if observing else "data_insufficient",
    }


def _wilson_lower_pct(successes: int, samples: int) -> float | None:
    if samples == 0:
        return None
    z = 1.959963984540054
    proportion = successes / samples
    denominator = 1 + z * z / samples
    center = proportion + z * z / (2 * samples)
    margin = z * math.sqrt(proportion * (1 - proportion) / samples + z * z / (4 * samples * samples))
    return round((center - margin) / denominator * 100, 2)


def _calendar_month_count(batches: list[Mapping[str, Any]]) -> int:
    if not batches:
        return 0
    start = min(_parse_datetime(batch["referenceAt"]) for batch in batches)
    end = max(_parse_datetime(batch["outcomeAt"]) for batch in batches)
    if start is None or end is None:
        return 0
    return (end.year - start.year) * 12 + end.month - start.month + 1


def _iso(value: Any) -> str:
    parsed = _parse_datetime(value)
    return parsed.isoformat() if parsed else ""
