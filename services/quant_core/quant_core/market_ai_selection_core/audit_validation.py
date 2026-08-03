from __future__ import annotations

import re
from collections.abc import Mapping, Sequence
from typing import Any

from quant_core.canonical import canonical_sha256, normalize_snapshot_bars
from quant_core.runs import ResearchRunAudit

from .candidate_scoring import _market_ai_selection_v1_data_gaps
from .common import (
    _as_utc,
    _finite_or_none,
    _market_ai_selection_rate,
    _parse_datetime,
)
from .contracts import (
    _EVIDENCE_CANDIDATE_LIMIT,
    _HORIZON_BARS,
    _REVIEW_SCHEMA_VERSION,
    _SELECTION_SCHEMA_VERSION,
    MarketAiSelectionError,
)

def _market_ai_selection_run_hash(run: ResearchRunAudit) -> str:
    return canonical_sha256(
        {
            "runId": run.run_id,
            "createdAt": run.created_at.isoformat(),
            "market": run.market,
            "symbol": run.symbol,
            "timeframe": run.timeframe,
            "executionMode": run.execution_mode,
            "dataQuality": run.data_quality,
            "dataSnapshot": run.data_snapshot,
        }
    )

def _market_ai_selection_review_summary(
    items: Sequence[Mapping[str, Any]],
) -> dict[str, Any]:
    matured = [
        item
        for item in items
        if item.get("completedBars") == item.get("horizonBars")
    ]
    absolute_samples = [
        item for item in items if isinstance(item.get("absoluteHit"), bool)
    ]
    benchmark_samples = [
        item for item in items if isinstance(item.get("benchmarkHit"), bool)
    ]
    absolute_hits = sum(item.get("absoluteHit") is True for item in absolute_samples)
    benchmark_hits = sum(item.get("benchmarkHit") is True for item in benchmark_samples)
    absolute_sample_count = len(absolute_samples)
    benchmark_sample_count = len(benchmark_samples)
    return {
        "recommendationCount": len(items),
        "maturedCount": len(matured),
        "observingCount": sum(item.get("status") == "observing" for item in items),
        "dataInsufficientCount": sum(
            item.get("status") == "data_insufficient" for item in items
        ),
        "absoluteHitCount": absolute_hits,
        "absoluteSampleCount": absolute_sample_count,
        "absoluteHitRatePct": (
            round(absolute_hits / absolute_sample_count * 100, 2)
            if absolute_sample_count
            else None
        ),
        "benchmarkHitCount": benchmark_hits,
        "benchmarkSampleCount": benchmark_sample_count,
        "benchmarkHitRatePct": (
            round(benchmark_hits / benchmark_sample_count * 100, 2)
            if benchmark_sample_count
            else None
        ),
    }

def _public_market_ai_selection_review(
    review: Mapping[str, Any],
) -> dict[str, Any]:
    return {
        **review,
        "items": [
            {
                key: value
                for key, value in item.items()
                if key not in {"outcomeBars", "benchmarkBars"}
            }
            for item in review["items"]
        ],
    }

def _market_ai_selection_boundary() -> dict[str, bool]:
    return {
        "researchOnly": True,
        "watchlistModified": False,
        "researchStarted": False,
        "riskModified": False,
        "autoTradingModified": False,
        "orderSubmissionAllowed": False,
        "routeExecuted": False,
    }

def _market_ai_selection_review_boundary() -> dict[str, bool]:
    return {
        "researchOnly": True,
        "affectsRisk": False,
        "affectsAuthorization": False,
        "affectsPermissions": False,
        "affectsOrderRouting": False,
        "orderSubmissionAllowed": False,
        "routeExecuted": False,
    }

def _require_market_ai_selection_statistics(value: bool) -> None:
    if not value:
        raise ValueError("market_ai_selection_statistics_audit_invalid")

def _market_ai_selection_statistics_invalid() -> MarketAiSelectionError:
    return MarketAiSelectionError(
        "market_ai_selection_statistics_audit_invalid",
        409,
        "AI 选股质量统计检测到无效或冲突的受保护审计记录。",
    )

def _market_ai_selection_id_matches_artifact(
    value: str,
    artifact: Mapping[str, Any],
) -> bool:
    schema_version = artifact.get("schemaVersion")
    if type(schema_version) is not int:
        return False
    pattern = (
        r"selection-[0-9a-f]{20}"
        if schema_version == 1
        else rf"selection-v{_SELECTION_SCHEMA_VERSION}-[0-9a-f]{{20}}"
    )
    if re.fullmatch(pattern, value) is None:
        return False
    if schema_version == _SELECTION_SCHEMA_VERSION:
        identity = artifact.get("selectionIdentity")
        return (
            isinstance(identity, Mapping)
            and _valid_market_ai_selection_identity(identity, artifact)
            and value
            == f"selection-v{_SELECTION_SCHEMA_VERSION}-{canonical_sha256(identity)[:20]}"
        )
    if schema_version != 1:
        return False
    return any(
        value == f"selection-{canonical_sha256(identity)[:20]}"
        for identity in _legacy_market_ai_selection_identities(artifact)
    )

def _valid_market_ai_selection_identity(
    identity: Mapping[str, Any],
    artifact: Mapping[str, Any],
) -> bool:
    fields = {
        "schemaVersion",
        "request",
        "providerIdentity",
        "marketSnapshot",
        "marketContext",
        "newsHash",
        "newsWarnings",
        "exclusions",
        "timedOut",
        "weightsVersion",
        "evidence",
    }
    snapshot = identity.get("marketSnapshot")
    artifact_snapshot = artifact.get("marketSnapshot")
    news_warnings = identity.get("newsWarnings")
    generation = artifact.get("generation")
    if (
        set(identity) != fields
        or identity.get("schemaVersion") != _SELECTION_SCHEMA_VERSION
        or identity.get("request") != artifact.get("request")
        or identity.get("providerIdentity") != artifact.get("providerIdentity")
        or identity.get("marketContext") != artifact.get("marketContext")
        or identity.get("exclusions") != artifact.get("exclusions")
        or identity.get("weightsVersion") != artifact.get("weightsVersion")
        or not isinstance(identity.get("timedOut"), bool)
        or not isinstance(snapshot, Mapping)
        or not isinstance(artifact_snapshot, Mapping)
        or not isinstance(snapshot.get("warnings"), list)
        or not isinstance(artifact_snapshot.get("warnings"), list)
        or not isinstance(news_warnings, list)
        or not all(isinstance(item, str) and item.strip() for item in news_warnings)
        or not isinstance(generation, Mapping)
    ):
        return False
    source_snapshot = {
        **artifact_snapshot,
        "warnings": list(snapshot["warnings"]),
    }
    expected_warnings = [*snapshot["warnings"], *news_warnings]
    if identity["timedOut"]:
        expected_warnings.append("证据组装达到 20 秒预算，已使用按时完成的候选。")
    if generation.get("status") == "failed":
        expected_warnings.append("AI 分析失败，已返回确定性基准榜。")
    return (
        source_snapshot == snapshot
        and list(dict.fromkeys(expected_warnings)) == artifact_snapshot["warnings"]
        and identity.get("newsHash") == canonical_sha256(artifact.get("newsEvidence"))
        and identity.get("evidence") == _market_ai_selection_identity_evidence(artifact)
    )

def _market_ai_selection_identity_evidence(
    artifact: Mapping[str, Any],
) -> list[dict[str, Any]] | None:
    candidates = artifact.get("evidenceCandidates")
    if not isinstance(candidates, list) or not all(
        isinstance(item, Mapping) for item in candidates
    ):
        return None
    try:
        return [
            {
                "evidenceId": item["evidenceId"],
                "evidenceHash": item["evidenceHash"],
                "newsReferences": item["newsReferences"],
            }
            for item in candidates
        ]
    except KeyError:
        return None

def _legacy_market_ai_selection_identities(
    artifact: Mapping[str, Any],
) -> Iterator[dict[str, Any]]:
    snapshot = artifact.get("marketSnapshot")
    warnings = snapshot.get("warnings") if isinstance(snapshot, Mapping) else None
    generation = artifact.get("generation")
    evidence = _market_ai_selection_identity_evidence(artifact)
    required = (
        artifact.get("request"),
        artifact.get("providerIdentity"),
        snapshot,
        artifact.get("marketContext"),
        artifact.get("newsEvidence"),
        artifact.get("exclusions"),
        artifact.get("weightsVersion"),
        generation,
    )
    if (
        any(value is None for value in required)
        or not isinstance(warnings, list)
        or len(warnings) > 16
        or not isinstance(generation, Mapping)
        or evidence is None
    ):
        return
    for timed_out in (False, True):
        identity_warnings = list(warnings)
        if timed_out:
            identity_warnings = [
                warning
                for warning in identity_warnings
                if warning != "证据组装达到 20 秒预算，已使用按时完成的候选。"
            ]
        if generation.get("status") == "failed":
            identity_warnings = [
                warning
                for warning in identity_warnings
                if warning != "AI 分析失败，已返回确定性基准榜。"
            ]
        for split in range(len(identity_warnings) + 1):
            source_warnings = identity_warnings[:split]
            for overlap_mask in range(1 << split):
                news_warnings = [
                    warning
                    for index, warning in enumerate(source_warnings)
                    if overlap_mask & (1 << index)
                ] + identity_warnings[split:]
                expected_warnings = [*source_warnings, *news_warnings]
                if timed_out:
                    expected_warnings.append(
                        "证据组装达到 20 秒预算，已使用按时完成的候选。"
                    )
                if generation.get("status") == "failed":
                    expected_warnings.append("AI 分析失败，已返回确定性基准榜。")
                if list(dict.fromkeys(expected_warnings)) != warnings:
                    continue
                yield {
                    "request": artifact["request"],
                    "providerIdentity": artifact["providerIdentity"],
                    "marketSnapshot": {**snapshot, "warnings": source_warnings},
                    "marketContext": artifact["marketContext"],
                    "newsHash": canonical_sha256(artifact["newsEvidence"]),
                    "newsWarnings": news_warnings,
                    "exclusions": artifact["exclusions"],
                    "timedOut": timed_out,
                    "weightsVersion": artifact["weightsVersion"],
                    "evidence": evidence,
                }

def _valid_statistics_candidate(value: Any, market: str) -> bool:
    if (
        not isinstance(value, Mapping)
        or not isinstance(value.get("snapshot"), Mapping)
        or not isinstance(value.get("fundamental"), Mapping)
    ):
        return False
    return (
        value.get("market") == market
        and value.get("symbol") == value["snapshot"].get("symbol")
        and bool(str(value.get("evidenceId") or "").strip())
        and isinstance(value.get("dataGaps"), list)
        and value["dataGaps"]
        == _market_ai_selection_v1_data_gaps(value["fundamental"], market=market)
        and value.get("evidenceHash")
        == canonical_sha256(
            {
                "candidate": value.get("snapshot"),
                "dailyBars": value.get("dailyBars"),
                "factors": value.get("factors"),
                "fundamental": value.get("fundamental"),
            }
        )
    )

def _valid_statistics_exclusion(value: Any, market: str) -> bool:
    return (
        isinstance(value, Mapping)
        and set(value) == {"market", "symbol", "name", "reason"}
        and value.get("market") == market
        and bool(str(value.get("reason") or "").strip())
    )

def _valid_statistics_generation(value: Any, requested_provider: str) -> bool:
    if not isinstance(value, Mapping) or value.get("requestedProvider") != requested_provider:
        return False
    status = value.get("status")
    used_provider = value.get("usedProvider")
    fallback = value.get("fallbackUsed")
    return (
        requested_provider == "local"
        and status == "skipped"
        and used_provider == "local"
        and fallback is False
    ) or (
        requested_provider != "local"
        and (
            (status == "completed" and used_provider == requested_provider and fallback is False)
            or (status == "failed" and used_provider == "local" and fallback is True)
        )
    )

def _valid_statistics_review_item(
    value: Mapping[str, Any],
    *,
    selection: Mapping[str, Any],
    benchmark: Mapping[str, Any],
    source_run: ResearchRunAudit | None,
    expected_evidence: Mapping[str, Any] | None,
    reviewed_at: datetime,
    schema_version: int,
) -> bool:
    base_fields = {
        "candidateEvidenceId",
        "rank",
        "tier",
        "market",
        "symbol",
        "timeframe",
        "horizon",
        "horizonBars",
        "referenceAt",
        "referencePrice",
    }
    progress_fields = {"completedBars", "remainingBars"}
    outcome_fields = {
        "outcomeAt",
        "outcomePrice",
        "returnPct",
        "absoluteHit",
        "outcomeSource",
        "outcomeAdjustmentMode",
        "outcomeDataHash",
    }
    outcome_bar_fields = {"outcomeBars"}
    benchmark_fields = {
        "benchmarkRunId",
        "benchmarkSymbol",
        "benchmarkReturnPct",
        "relativeReturnPct",
        "benchmarkHit",
        "benchmarkSource",
        "benchmarkAdjustmentMode",
        "benchmarkDataHash",
    }
    benchmark_price_fields = {
        "benchmarkReferencePrice",
        "benchmarkOutcomePrice",
    }
    benchmark_bar_fields = {"benchmarkBars"}
    evidence_id = str(value.get("candidateEvidenceId") or "")
    candidate = next(
        (
            item
            for item in selection["evidenceCandidates"]
            if str(item.get("evidenceId") or "") == evidence_id
        ),
        None,
    )
    recommendation = next(
        (
            item
            for item in selection["recommendations"]
            if str(item.get("evidenceId") or "") == evidence_id
        ),
        None,
    )
    daily_bars = candidate.get("dailyBars") if isinstance(candidate, Mapping) else None
    reference_bar = (
        daily_bars[-1]
        if isinstance(daily_bars, list) and daily_bars
        else None
    )
    reference_price = (
        _finite_or_none(reference_bar.get("close"))
        if isinstance(reference_bar, Mapping)
        else None
    )
    status = value.get("status")
    fields = set(value)
    has_research = "researchRunId" in fields
    has_progress = bool(fields & progress_fields)
    has_outcome = bool(fields & (outcome_fields | outcome_bar_fields))
    has_benchmark = bool(
        fields & (benchmark_fields | benchmark_price_fields | benchmark_bar_fields)
    )
    expected_fields = base_fields | {"status"}
    if has_research:
        expected_fields.add("researchRunId")
    if has_progress:
        expected_fields |= progress_fields
    if has_outcome:
        expected_fields |= outcome_fields
        if schema_version == _REVIEW_SCHEMA_VERSION:
            expected_fields |= outcome_bar_fields
    if has_benchmark:
        expected_fields |= benchmark_fields
        if schema_version == _REVIEW_SCHEMA_VERSION:
            expected_fields |= benchmark_price_fields | benchmark_bar_fields
    if status == "data_insufficient":
        expected_fields.add("reason")
    if fields != expected_fields:
        return False

    horizon_bars = value.get("horizonBars")
    completed_bars = value.get("completedBars")
    remaining_bars = value.get("remainingBars")
    progress_valid = (
        not has_progress
        or isinstance(horizon_bars, int)
        and not isinstance(horizon_bars, bool)
        and isinstance(completed_bars, int)
        and not isinstance(completed_bars, bool)
        and isinstance(remaining_bars, int)
        and not isinstance(remaining_bars, bool)
        and 0 <= completed_bars <= horizon_bars
        and remaining_bars == horizon_bars - completed_bars
    )
    research_valid = (
        has_research
        and isinstance(value.get("researchRunId"), str)
        and bool(str(value["researchRunId"]).strip())
        and source_run is not None
        and expected_evidence is not None
        and source_run.run_id == value["researchRunId"]
        and source_run.market == selection["market"]
        and source_run.symbol == value.get("symbol")
        and source_run.timeframe == "1d"
        and _as_utc(source_run.created_at) <= reviewed_at
        and source_run.data_snapshot.get("marketAiSelectionEvidence")
        == expected_evidence
    )
    reference_at = _parse_datetime(value.get("referenceAt"))
    outcome_at = _parse_datetime(value.get("outcomeAt")) if has_outcome else None
    outcome_price = _finite_or_none(value.get("outcomePrice"))
    return_pct = _finite_or_none(value.get("returnPct"))
    outcome_bars = value.get("outcomeBars")
    normalized_outcome_bars = (
        normalize_snapshot_bars(outcome_bars)
        if schema_version == _REVIEW_SCHEMA_VERSION
        and isinstance(outcome_bars, list)
        else None
    )
    outcome_valid = (
        not has_outcome
        or has_progress
        and completed_bars == horizon_bars
        and remaining_bars == 0
        and reference_price is not None
        and reference_price > 0
        and outcome_price is not None
        and outcome_price > 0
        and return_pct
        == round((outcome_price / reference_price - 1) * 100, 6)
        and value.get("absoluteHit") is (return_pct > 0)
        and reference_at is not None
        and outcome_at is not None
        and reference_at < outcome_at <= reviewed_at
        and bool(str(value.get("outcomeSource") or "").strip())
        and bool(str(value.get("outcomeAdjustmentMode") or "").strip())
        and re.fullmatch(r"[0-9a-f]{64}", str(value.get("outcomeDataHash") or ""))
        is not None
        and (
            schema_version == 1
            or normalized_outcome_bars == outcome_bars
            and len(normalized_outcome_bars) == horizon_bars
            and canonical_sha256(normalized_outcome_bars)
            == value.get("outcomeDataHash")
            and normalized_outcome_bars[-1]["timestamp"] == value.get("outcomeAt")
            and _finite_or_none(normalized_outcome_bars[-1]["close"])
            == outcome_price
            and all(
                reference_at
                < _parse_datetime(item["timestamp"])
                <= outcome_at
                for item in normalized_outcome_bars
            )
        )
    )
    benchmark_start = _finite_or_none(value.get("benchmarkReferencePrice"))
    benchmark_end = _finite_or_none(value.get("benchmarkOutcomePrice"))
    benchmark_return = _finite_or_none(value.get("benchmarkReturnPct"))
    relative_return = _finite_or_none(value.get("relativeReturnPct"))
    benchmark_bars = value.get("benchmarkBars")
    normalized_benchmark_bars = (
        normalize_snapshot_bars(benchmark_bars)
        if schema_version == _REVIEW_SCHEMA_VERSION
        and isinstance(benchmark_bars, list)
        else None
    )
    benchmark_valid = (
        not has_benchmark
        or status == "completed"
        and has_outcome
        and value.get("benchmarkRunId") == benchmark.get("runId")
        and value.get("benchmarkSymbol") == benchmark.get("symbol")
        and benchmark_return is not None
        and (
            schema_version == 1
            or benchmark_start is not None
            and benchmark_start > 0
            and benchmark_end is not None
            and benchmark_end > 0
            and benchmark_return
            == round((benchmark_end / benchmark_start - 1) * 100, 6)
            and normalized_benchmark_bars == benchmark_bars
            and len(normalized_benchmark_bars) == 2
            and canonical_sha256(normalized_benchmark_bars)
            == value.get("benchmarkDataHash")
            and normalized_benchmark_bars[0]["timestamp"]
            == value.get("referenceAt")
            and normalized_benchmark_bars[-1]["timestamp"]
            == value.get("outcomeAt")
            and _finite_or_none(normalized_benchmark_bars[0]["close"])
            == benchmark_start
            and _finite_or_none(normalized_benchmark_bars[-1]["close"])
            == benchmark_end
        )
        and return_pct is not None
        and relative_return == round(return_pct - benchmark_return, 6)
        and value.get("benchmarkHit") is (relative_return > 0)
        and value.get("benchmarkAdjustmentMode")
        == value.get("outcomeAdjustmentMode")
        and bool(str(value.get("benchmarkSource") or "").strip())
        and re.fullmatch(r"[0-9a-f]{64}", str(value.get("benchmarkDataHash") or ""))
        is not None
    )
    common_valid = (
        isinstance(candidate, Mapping)
        and isinstance(recommendation, Mapping)
        and isinstance(reference_bar, Mapping)
        and reference_price is not None
        and value.get("rank") == recommendation.get("rank")
        and value.get("tier") == recommendation.get("tier")
        and value.get("market") == selection["market"]
        and value.get("symbol") == candidate.get("symbol")
        and value.get("timeframe") == "1d"
        and value.get("horizon") == selection["horizon"]
        and value.get("horizonBars")
        == _HORIZON_BARS[selection["market"]][selection["horizon"]]
        and value.get("referenceAt") == reference_bar.get("timestamp")
        and _finite_or_none(value.get("referencePrice")) == reference_price
        and status in {"observing", "data_insufficient", "completed"}
        and progress_valid
        and outcome_valid
        and benchmark_valid
    )
    if not common_valid:
        return False
    if status == "completed":
        return (
            research_valid
            and has_progress
            and has_outcome
            and has_benchmark
            and completed_bars == horizon_bars
            and remaining_bars == 0
        )
    if status == "observing":
        return (
            research_valid
            and has_progress
            and not has_outcome
            and not has_benchmark
            and isinstance(completed_bars, int)
            and completed_bars < horizon_bars
        )
    reasons = {
        "research_evidence_not_bound",
        "outcome_bars_unavailable",
        "outcome_bars_incomplete",
        "outcome_bar_context_mismatch",
        "reference_time_invalid",
        "outcome_reference_bar_missing",
        "outcome_reference_price_mismatch",
        "outcome_bar_gap",
        "review_price_invalid",
        "review_bar_window_invalid",
        "benchmark_must_use_different_symbol",
        "benchmark_bars_unavailable",
        "benchmark_bars_incomplete",
        "benchmark_adjustment_mode_mismatch",
        "benchmark_bar_context_mismatch",
        "benchmark_same_period_coverage_missing",
    }
    reason = value.get("reason")
    return (
        reason in reasons
        and not has_benchmark
        and (
            not has_research
            and reason == "research_evidence_not_bound"
            and not has_progress
            and not has_outcome
            and source_run is None
            and expected_evidence is None
            or research_valid
            and reason != "research_evidence_not_bound"
        )
    )

def _valid_statistics_source_coverage(
    value: Any,
    *,
    generated_at: str,
) -> bool:
    if not isinstance(value, Mapping) or set(value) != {
        "provider",
        "scope",
        "observedAt",
        "sampleCount",
        "mappedCount",
        "ambiguousCount",
        "missingCount",
        "unresolvedCount",
        "mappedRatePct",
    }:
        return False
    counts = [
        value[key]
        for key in (
            "mappedCount",
            "ambiguousCount",
            "missingCount",
            "unresolvedCount",
        )
    ]
    sample_count = value["sampleCount"]
    observed_at = _parse_datetime(value.get("observedAt"))
    selection_at = _parse_datetime(generated_at)
    return (
        value["provider"] == "coingecko-binance"
        and value["scope"] == "prefiltered_candidates"
        and observed_at is not None
        and selection_at is not None
        and observed_at <= selection_at
        and type(sample_count) is int
        and 0 < sample_count <= _EVIDENCE_CANDIDATE_LIMIT
        and all(type(count) is int and count >= 0 for count in counts)
        and sum(counts) == sample_count
        and value["mappedRatePct"]
        == _market_ai_selection_rate(value["mappedCount"], sample_count)
    )
