from __future__ import annotations

from collections import Counter
from collections.abc import Mapping
from datetime import datetime
from typing import Any

from quant_core.canonical import canonical_sha256
from quant_core.runs import ResearchRunAudit

from .audit_validation import (
    _market_ai_selection_boundary,
    _market_ai_selection_benchmark_run_hash,
    _market_ai_selection_id_matches_artifact,
    _market_ai_selection_review_boundary,
    _market_ai_selection_review_summary,
    _market_ai_selection_run_hash,
    _market_ai_selection_statistics_invalid,
    _require_market_ai_selection_statistics,
    _valid_statistics_candidate,
    _valid_statistics_exclusion,
    _valid_statistics_generation,
    _valid_statistics_review_item,
    _valid_statistics_source_coverage,
)
from .candidate_scoring import _prefilter_candidates
from .automatic_review import has_fixed_benchmark_attestation
from .common import _as_utc, _market_ai_selection_rate, _parse_datetime
from .contracts import (
    _AI_TIERS,
    _EVIDENCE_CANDIDATE_LIMIT,
    _INITIAL_CANDIDATE_LIMIT,
    _QUALITY_STATISTICS_PROFILES,
    _RECOMMENDATION_LIMIT,
    _REVIEW_SCHEMA_VERSION,
    _SELECTION_SCHEMA_VERSION,
    _V1_NON_DEGRADED_EXCLUSION_REASONS,
    _V1_NON_DEGRADED_WARNINGS,
    _WEIGHTS_BY_VERSION,
    MarketAiSelectionError,
    validate_market_ai_selection_request,
)
from .research_evidence import resolve_market_ai_selection_research_evidence
from .research_value import build_research_value_cohorts

class _QualityStatisticsMixin:
    def quality_statistics(self) -> dict[str, Any]:
            computed_at = _as_utc(self.clock())
            selections = [
                self._quality_statistics_selection(record, computed_at=computed_at)
                for record in self._quality_statistics_events("market_ai_selection")
            ]
            qualified_count = sum(len(item["evidenceCandidates"]) for item in selections)
            exclusions = [
                exclusion
                for item in selections
                for exclusion in item["exclusions"]
            ]
            evaluated_count = qualified_count + len(exclusions)
            degraded_count = sum(bool(item["sourceDegraded"]) for item in selections)
            ai_attempts = [
                item["generation"]
                for item in selections
                if item["generation"]["requestedProvider"] != "local"
            ]
            ai_success_count = sum(
                item["status"] == "completed"
                and item["usedProvider"] == item["requestedProvider"]
                and item["fallbackUsed"] is False
                for item in ai_attempts
            )
            reason_counts = Counter(str(item["reason"]) for item in exclusions)
            style_selection_counts = Counter(str(item["profile"]) for item in selections)
            selections_by_id = {str(item["selectionId"]): item for item in selections}
            latest_reviews: dict[str, dict[str, Any]] = {}
            for record in self._quality_statistics_events("market_ai_selection_review"):
                review = self._quality_statistics_review(
                    record,
                    selections=selections_by_id,
                    computed_at=computed_at,
                )
                current = latest_reviews.get(str(review["selectionId"]))
                if current is None or (
                    review["createdAt"],
                    review["summary"]["absoluteSampleCount"],
                    review["summary"]["benchmarkSampleCount"],
                    review["reviewId"],
                ) > (
                    current["createdAt"],
                    current["summary"]["absoluteSampleCount"],
                    current["summary"]["benchmarkSampleCount"],
                    current["reviewId"],
                ):
                    latest_reviews[str(review["selectionId"])] = review
            performance_by_profile = {
                profile: {
                    "reviewedSelectionCount": 0,
                    "absoluteHitCount": 0,
                    "absoluteSampleCount": 0,
                    "benchmarkHitCount": 0,
                    "benchmarkSampleCount": 0,
                }
                for profile in _QUALITY_STATISTICS_PROFILES
            }
            for review in latest_reviews.values():
                profile = str(selections_by_id[str(review["selectionId"])]["profile"])
                performance = performance_by_profile[profile]
                summary = review["summary"]
                performance["reviewedSelectionCount"] += 1
                for key in (
                    "absoluteHitCount",
                    "absoluteSampleCount",
                    "benchmarkHitCount",
                    "benchmarkSampleCount",
                ):
                    performance[key] += int(summary[key])
            research_value_cohorts = build_research_value_cohorts(
                selections,
                latest_reviews,
            )
            return {
                "schemaVersion": 2,
                "recordType": "aiqt.marketAiSelectionQualityStatistics",
                "generatedAt": computed_at.isoformat(),
                "selectionCount": len(selections),
                "candidateQualification": {
                    "qualifiedCount": qualified_count,
                    "sampleCount": evaluated_count,
                    "ratePct": _market_ai_selection_rate(qualified_count, evaluated_count),
                },
                "majorExclusions": {
                    "excludedCount": len(exclusions),
                    "reasons": [
                        {
                            "reason": reason,
                            "count": count,
                            "ratePct": _market_ai_selection_rate(count, len(exclusions)),
                        }
                        for reason, count in sorted(
                            reason_counts.items(),
                            key=lambda item: (-item[1], item[0]),
                        )[:5]
                    ],
                },
                "dataSourceDegradation": {
                    "degradedCount": degraded_count,
                    "sampleCount": len(selections),
                    "ratePct": _market_ai_selection_rate(degraded_count, len(selections)),
                },
                "aiSuccess": {
                    "successCount": ai_success_count,
                    "sampleCount": len(ai_attempts),
                    "ratePct": _market_ai_selection_rate(ai_success_count, len(ai_attempts)),
                },
                "stylePerformance": [
                    {
                        "profile": profile,
                        "selectionCount": style_selection_counts[profile],
                        **performance_by_profile[profile],
                        "absoluteHitRatePct": _market_ai_selection_rate(
                            performance_by_profile[profile]["absoluteHitCount"],
                            performance_by_profile[profile]["absoluteSampleCount"],
                        ),
                        "benchmarkHitRatePct": _market_ai_selection_rate(
                            performance_by_profile[profile]["benchmarkHitCount"],
                            performance_by_profile[profile]["benchmarkSampleCount"],
                        ),
                    }
                    for profile in _QUALITY_STATISTICS_PROFILES
                ],
                "researchValueCohorts": research_value_cohorts,
                "boundary": _market_ai_selection_boundary(),
            }

    def _quality_statistics_events(self, event_type: str) -> list[Any]:
            records: list[Any] = []
            try:
                while True:
                    page = self.audit_store.list_recent(
                        event_type=event_type,
                        run_id_is_null=True,
                        limit=50,
                        offset=len(records),
                    )
                    records.extend(page)
                    if len(page) < 50:
                        return records
            except Exception as error:
                raise MarketAiSelectionError(
                    "market_ai_selection_statistics_audit_unavailable",
                    503,
                    "AI 选股质量审计暂不可用。",
                ) from error

    def _quality_statistics_selection(
            self,
            record: Any,
            *,
            computed_at: datetime,
        ) -> dict[str, Any]:
            try:
                artifact = record.metadata["artifact"]
                request = validate_market_ai_selection_request(artifact["request"])
                result = artifact["result"]
                candidates = artifact["evidenceCandidates"]
                initial_candidates = artifact["initialCandidates"]
                exclusions = artifact["exclusions"]
                generation = artifact["generation"]
                recommendations = result["recommendations"]
                market_snapshot = artifact["marketSnapshot"]
                market_context = artifact["marketContext"]
                selection_id = str(artifact["selectionId"])
                market = str(request["market"])
                profile = str(request["profile"])
                provider_identity = artifact["providerIdentity"]
                record_hash = canonical_sha256(
                    {key: value for key, value in artifact.items() if key != "recordHash"}
                )
                candidate_ids = {str(item["evidenceId"]) for item in candidates}
                recommendation_ids = [str(item["evidenceId"]) for item in recommendations]
                ranks = [item["rank"] for item in recommendations]
                initial_keys = [
                    (str(item["market"]), str(item["symbol"]))
                    for item in initial_candidates
                ]
                candidate_keys = [
                    (str(item["market"]), str(item["symbol"]))
                    for item in candidates
                ]
                exclusion_keys = [
                    (str(item["market"]), str(item["symbol"]))
                    for item in exclusions
                ]
                weights_by_market = _WEIGHTS_BY_VERSION.get(
                    str(artifact["weightsVersion"])
                )
                warnings = market_snapshot["warnings"]
                source_coverage = (
                    market_context.get("fundamentalSourceCoverage")
                    if isinstance(market_context, Mapping)
                    else None
                )
                schema_version = artifact["schemaVersion"]
                prefiltered_count = len(
                    _prefilter_candidates(initial_candidates, market=market)[0]
                )
                _require_market_ai_selection_statistics(
                    record.event_type == "market_ai_selection"
                    and record.run_id is None
                    and record.stage == "market_ai_selection"
                    and record.source == "market-ai-selection"
                    and set(record.metadata) == {"artifact"}
                    and type(schema_version) is int
                    and schema_version in {1, _SELECTION_SCHEMA_VERSION}
                    and artifact["recordType"] == "aiqt.marketAiSelection"
                    and _market_ai_selection_id_matches_artifact(
                        selection_id,
                        artifact,
                    )
                    and record.event_id == f"market-ai-selection-{selection_id}"
                    and artifact["recordHash"] == record_hash
                    and request == artifact["request"]
                    and weights_by_market is not None
                    and artifact["weights"]
                    == weights_by_market["crypto" if market == "crypto" else "stock"][profile]
                    and result["selectionId"] == selection_id
                    and result["auditEventId"] == record.event_id
                    and result["generatedAt"] == artifact["generatedAt"]
                    and result["marketSnapshot"] == market_snapshot
                    and result["exclusions"] == exclusions
                    and result["generation"] == generation
                    and result["boundary"] == artifact["boundary"]
                    and isinstance(market_snapshot, Mapping)
                    and isinstance(market_context, Mapping)
                    and (
                        market != "crypto"
                        and source_coverage is None
                        or market == "crypto"
                        and schema_version == 1
                        and (
                            source_coverage is None
                            or _valid_statistics_source_coverage(
                                source_coverage,
                                generated_at=str(artifact["generatedAt"]),
                            )
                        )
                        or market == "crypto"
                        and schema_version == _SELECTION_SCHEMA_VERSION
                        and _valid_statistics_source_coverage(
                            source_coverage,
                            generated_at=str(artifact["generatedAt"]),
                        )
                        and source_coverage["sampleCount"] == prefiltered_count
                    )
                    and isinstance(warnings, list)
                    and all(isinstance(item, str) and item.strip() for item in warnings)
                    and result["status"] == ("partial" if warnings else "completed")
                    and artifact["boundary"] == _market_ai_selection_boundary()
                    and _parse_datetime(artifact["generatedAt"]) == _as_utc(record.created_at)
                    and _as_utc(record.created_at) <= computed_at
                    and isinstance(candidates, list)
                    and 0 < len(candidates) <= _EVIDENCE_CANDIDATE_LIMIT
                    and all(_valid_statistics_candidate(item, market) for item in candidates)
                    and isinstance(initial_candidates, list)
                    and 0 < len(initial_candidates) <= _INITIAL_CANDIDATE_LIMIT
                    and all(key[0] == market and key[1] for key in initial_keys)
                    and len(set(initial_keys)) == len(initial_keys)
                    and len(set(candidate_keys)) == len(candidate_keys)
                    and isinstance(exclusions, list)
                    and all(_valid_statistics_exclusion(item, market) for item in exclusions)
                    and len(set(exclusion_keys)) == len(exclusion_keys)
                    and set(candidate_keys) <= set(initial_keys)
                    and set(candidate_keys).isdisjoint(exclusion_keys)
                    and (
                        schema_version == 1
                        and set(initial_keys)
                        <= set(candidate_keys) | set(exclusion_keys)
                        or schema_version == _SELECTION_SCHEMA_VERSION
                        and set(initial_keys)
                        == set(candidate_keys) | set(exclusion_keys)
                    )
                    and _valid_statistics_generation(generation, request["providerId"])
                    and isinstance(provider_identity, Mapping)
                    and provider_identity.get("providerId") == request["providerId"]
                    and isinstance(recommendations, list)
                    and 0 < len(recommendations) <= _RECOMMENDATION_LIMIT
                    and len(candidate_ids) == len(candidates)
                    and len(set(recommendation_ids)) == len(recommendation_ids)
                    and set(recommendation_ids) <= candidate_ids
                    and len(set(ranks)) == len(ranks)
                    and all(
                        isinstance(item, Mapping)
                        and isinstance(item.get("rank"), int)
                        and not isinstance(item.get("rank"), bool)
                        and 1 <= item["rank"] <= _RECOMMENDATION_LIMIT
                        and item.get("tier") in _AI_TIERS
                        for item in recommendations
                    )
                )
            except (KeyError, TypeError, ValueError, MarketAiSelectionError) as error:
                raise _market_ai_selection_statistics_invalid() from error
            return {
                "selectionId": selection_id,
                "recordHash": str(record_hash),
                "generatedAt": _as_utc(record.created_at),
                "market": market,
                "profile": profile,
                "horizon": str(request.get("horizon") or ""),
                "weightsVersion": str(artifact["weightsVersion"]),
                "providerIdentity": dict(provider_identity),
                "evidenceCandidates": list(candidates),
                "exclusions": list(exclusions),
                "generation": dict(generation),
                "recommendations": list(recommendations),
                "recommendationIds": frozenset(recommendation_ids),
                "sourceDegraded": any(candidate["dataGaps"] for candidate in candidates)
                or any(
                    exclusion["reason"] not in _V1_NON_DEGRADED_EXCLUSION_REASONS
                    for exclusion in exclusions
                )
                or any(
                    warning not in _V1_NON_DEGRADED_WARNINGS
                    for warning in warnings
                )
                or (
                    isinstance(source_coverage, Mapping)
                    and source_coverage["mappedCount"] < source_coverage["sampleCount"]
                ),
            }

    def _quality_statistics_review(
            self,
            record: Any,
            *,
            selections: Mapping[str, Mapping[str, Any]],
            computed_at: datetime,
        ) -> dict[str, Any]:
            try:
                review = record.metadata["review"]
                selection_id = str(review["selectionId"])
                selection = selections[selection_id]
                items = review["items"]
                summary = review["summary"]
                benchmark = review["benchmark"]
                benchmark_run = (
                    self.run_store.get(str(benchmark["runId"]))
                    if self.run_store is not None
                    else None
                )
                review_id = str(review["reviewId"])
                automatic = (
                    review.get("reviewMode") == "automatic_fixed_benchmark"
                    and isinstance(review.get("benchmarkPolicyVersion"), str)
                    and bool(review["benchmarkPolicyVersion"].strip())
                )
                item_ids = [str(item["candidateEvidenceId"]) for item in items]
                source_runs: dict[str, ResearchRunAudit | None] = {}
                expected_evidence: dict[str, dict[str, Any] | None] = {}
                for item in items:
                    evidence_id = str(item["candidateEvidenceId"])
                    symbol = str(item["symbol"])
                    run_id = item.get("researchRunId")
                    source_runs[evidence_id] = (
                        self.run_store.get(str(run_id))
                        if self.run_store is not None and isinstance(run_id, str)
                        else None
                    )
                    expected_evidence[evidence_id] = (
                        resolve_market_ai_selection_research_evidence(
                            {
                                "selectionId": selection_id,
                                "candidateEvidenceId": evidence_id,
                            },
                            audit_store=self.audit_store,
                            market=selection["market"],
                            symbol=symbol,
                            timeframe="1d",
                        )
                        if isinstance(run_id, str)
                        else None
                    )
                identity = {
                    "selectionId": selection_id,
                    "selectionRecordHash": review["selectionRecordHash"],
                    "benchmarkRunId": benchmark["runId"],
                    "benchmarkAuditHash": benchmark["auditHash"],
                    "items": items,
                    "summary": summary,
                    **(
                        {
                            "reviewMode": review["reviewMode"],
                            "benchmarkPolicyVersion": review[
                                "benchmarkPolicyVersion"
                            ],
                        }
                        if automatic
                        else {}
                    ),
                }
                base_review_fields = {
                    "schemaVersion",
                    "recordType",
                    "reviewId",
                    "selectionId",
                    "selectionRecordHash",
                    "createdAt",
                    "market",
                    "timeframe",
                    "benchmark",
                    "items",
                    "summary",
                    "boundary",
                    "recordHash",
                }
                _require_market_ai_selection_statistics(
                    record.event_type == "market_ai_selection_review"
                    and record.run_id is None
                    and record.stage == "market_ai_selection_review"
                    and record.source == "audited-selection-and-market-data"
                    and set(record.metadata) == {"review"}
                    and type(review["schemaVersion"]) is int
                    and review["schemaVersion"] in {1, _REVIEW_SCHEMA_VERSION}
                    and review["recordType"] == "aiqt.marketAiSelectionReview"
                    and set(review)
                    == base_review_fields
                    | (
                        {"reviewMode", "benchmarkPolicyVersion"}
                        if automatic
                        else set()
                    )
                    and record.event_id == review_id
                    and review["recordHash"] == canonical_sha256(
                        {key: value for key, value in review.items() if key != "recordHash"}
                    )
                    and review["selectionRecordHash"] == selection["recordHash"]
                    and review["market"] == selection["market"]
                    and review["timeframe"] == "1d"
                    and set(benchmark) == {"runId", "symbol", "auditHash"}
                    and bool(str(benchmark["runId"]).strip())
                    and bool(str(benchmark["symbol"]).strip())
                    and len(str(benchmark["auditHash"])) == 64
                    and benchmark_run is not None
                    and benchmark_run.market == selection["market"]
                    and benchmark_run.timeframe == "1d"
                    and benchmark_run.symbol == benchmark["symbol"]
                    and benchmark["auditHash"]
                    in (
                        {
                            _market_ai_selection_benchmark_run_hash(benchmark_run),
                            _market_ai_selection_run_hash(benchmark_run),
                        }
                        if automatic
                        else {_market_ai_selection_run_hash(benchmark_run)}
                    )
                    and _as_utc(benchmark_run.created_at) <= _as_utc(record.created_at)
                    and (
                        not automatic
                        or has_fixed_benchmark_attestation(
                            self.audit_store,
                            benchmark_run,
                            policy_version=review["benchmarkPolicyVersion"],
                        )
                    )
                    and isinstance(items, list)
                    and 0 < len(items) <= _RECOMMENDATION_LIMIT
                    and all(isinstance(item, Mapping) for item in items)
                    and len(set(item_ids)) == len(item_ids)
                    and set(item_ids) == selection["recommendationIds"]
                    and all(
                        item.get("market") == selection["market"]
                        and item.get("horizon") == selection["horizon"]
                        and _valid_statistics_review_item(
                            item,
                            selection=selection,
                            benchmark=benchmark,
                            source_run=source_runs[str(item["candidateEvidenceId"])],
                            expected_evidence=expected_evidence[
                                str(item["candidateEvidenceId"])
                            ],
                            reviewed_at=_as_utc(record.created_at),
                            schema_version=int(review["schemaVersion"]),
                            require_research_binding=not automatic,
                        )
                        for item in items
                    )
                    and isinstance(summary, Mapping)
                    and dict(summary) == _market_ai_selection_review_summary(items)
                    and summary["benchmarkSampleCount"] <= summary["absoluteSampleCount"]
                    and summary["absoluteSampleCount"] <= summary["maturedCount"]
                    and all(
                        not isinstance(item.get("benchmarkHit"), bool)
                        or isinstance(item.get("absoluteHit"), bool)
                        for item in items
                    )
                    and review["boundary"] == _market_ai_selection_review_boundary()
                    and review_id
                    == f"market-ai-selection-review-{canonical_sha256(identity)[:32]}"
                    and _parse_datetime(review["createdAt"]) == _as_utc(record.created_at)
                    and _as_utc(record.created_at) <= computed_at
                    and record.summary == "AI 选股到期表现已按已审计基准复盘。"
                    and record.detail
                    == (
                        f"matured={summary['maturedCount']} "
                        f"observing={summary['observingCount']} "
                        f"insufficient={summary['dataInsufficientCount']} "
                        "researchOnly=true"
                    )
                )
            except (KeyError, TypeError, ValueError) as error:
                raise _market_ai_selection_statistics_invalid() from error
            return {
                "reviewId": review_id,
                "selectionId": selection_id,
                "createdAt": _as_utc(record.created_at),
                "benchmark": dict(benchmark),
                "items": list(items),
                "summary": dict(summary),
                **(
                    {
                        "reviewMode": review["reviewMode"],
                        "benchmarkPolicyVersion": review[
                            "benchmarkPolicyVersion"
                        ],
                    }
                    if automatic
                    else {}
                ),
            }
