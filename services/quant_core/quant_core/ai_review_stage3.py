from __future__ import annotations

import math
import re
from collections.abc import Collection, Mapping, Sequence
from typing import Any

from quant_core.canonical import (
    DATA_SNAPSHOT_HASH_VERSION,
    canonical_data_hash,
    canonical_json,
    canonical_sha256,
    canonical_snapshot_id,
    normalize_snapshot_bars,
    strategy_config_from_payload,
    strategy_config_to_payload,
)
from quant_core.runs import ResearchRunStore
from quant_core.strategy_experiment_store import (
    StrategyExperimentCandidateRecord,
    StrategyExperimentDetail,
    StrategyExperimentStore,
)


class AiReviewStage3Error(ValueError):
    def __init__(self, code: str, status: int, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.status = status
        self.detail = detail


MIN_REVIEW_TRADE_COUNT = 10
MAX_REVIEW_DRAWDOWN_PCT = 15.0
WALK_FORWARD_FAILURE_RATIO = 0.5
MAX_ASSESSMENT_ITEMS = 50
MAX_ASSESSMENT_TEXT_CHARS = 2_000

_ASSESSMENT_FIELDS = {
    "stance",
    "summary",
    "risks",
    "invalidationConditions",
    "watchItems",
    "evidenceGaps",
    "consistency",
}
_RISK_FIELDS = {"severity", "message", "evidenceReferences"}
_STANCES = {"supported", "caution", "blocked", "insufficient_evidence"}
_SEVERITIES = {"low", "medium", "high", "critical"}
_CONSISTENCIES = {"consistent", "mixed", "divergent", "insufficient"}
_SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")


def validate_assessment(
    payload: Mapping[str, Any],
    known_evidence_ids: Collection[str],
) -> dict[str, Any]:
    if not isinstance(payload, Mapping) or set(payload) != _ASSESSMENT_FIELDS:
        raise ValueError("assessment_fields_invalid")
    _validate_enum(payload["stance"], _STANCES, "assessment_stance_invalid")
    _validate_text(payload["summary"], "assessment_summary_invalid")
    _validate_enum(payload["consistency"], _CONSISTENCIES, "assessment_consistency_invalid")

    known_ids = set(known_evidence_ids)
    risks = _validate_array(payload["risks"], "assessment_risks_invalid")
    for risk in risks:
        if not isinstance(risk, Mapping) or set(risk) != _RISK_FIELDS:
            raise ValueError("assessment_risk_fields_invalid")
        _validate_enum(risk["severity"], _SEVERITIES, "assessment_risk_severity_invalid")
        _validate_text(risk["message"], "assessment_risk_message_invalid")
        references = _validate_array(
            risk["evidenceReferences"],
            "assessment_evidence_references_invalid",
        )
        for reference in references:
            _validate_text(reference, "assessment_evidence_reference_invalid")
            if reference not in known_ids:
                raise ValueError("assessment_evidence_reference_unknown")

    for field in ("invalidationConditions", "watchItems", "evidenceGaps"):
        for item in _validate_array(payload[field], f"assessment_{field}_invalid"):
            _validate_text(item, f"assessment_{field}_item_invalid")
    return dict(payload)


class DeterministicAiReviewEngine:
    def evaluate(self, evidence_bundle: Mapping[str, Any]) -> dict[str, Any]:
        if not isinstance(evidence_bundle, Mapping):
            raise ValueError("evidence_bundle_must_be_object")
        raw_items = evidence_bundle.get("evidenceItems")
        if not isinstance(raw_items, list):
            raise ValueError("evidence_items_must_be_array")
        evidence_items = [item for item in raw_items if isinstance(item, Mapping)]
        known_ids = {
            item["id"]
            for item in evidence_items
            if isinstance(item.get("id"), str) and item["id"].strip()
        }
        references = _review_experiment_references(evidence_bundle)
        risks: list[dict[str, Any]] = []
        gaps: list[str] = []
        blocked = False

        expected_hash = canonical_sha256(
            {key: value for key, value in evidence_bundle.items() if key != "evidenceHash"}
        )
        if evidence_bundle.get("evidenceHash") != expected_hash:
            blocked = True
            risks.append(
                _assessment_risk(
                    "critical",
                    "The canonical evidence hash does not match the supplied bundle.",
                )
            )

        if evidence_bundle.get("safetyBoundary") != {
            "paperOnly": True,
            "liveTradingAllowed": False,
            "orderSubmissionAllowed": False,
        }:
            blocked = True
            risks.append(
                _assessment_risk(
                    "critical",
                    "The research-only safety boundary is invalid.",
                )
            )

        signatures: dict[str, tuple[int, int, bool, bool]] = {}
        for reference in references:
            experiment_id = reference.get("experimentId")
            if not isinstance(experiment_id, str) or not experiment_id.strip():
                blocked = True
                risks.append(_assessment_risk("critical", "An experiment reference is invalid."))
                continue

            data_quality_id = f"experiment:{experiment_id}:data-quality"
            data_quality_item = next(
                (
                    item
                    for item in evidence_items
                    if item.get("id") == data_quality_id and item.get("kind") == "data_quality"
                ),
                None,
            )
            if data_quality_item is None or not isinstance(data_quality_item.get("value"), Mapping):
                gaps.append(f"{experiment_id} data quality evidence is missing.")
            else:
                quality = data_quality_item["value"]
                if quality.get("isComplete") is not True:
                    blocked = True
                    risks.append(
                        _assessment_risk(
                            "critical",
                            "Data quality is incomplete.",
                            data_quality_id,
                        )
                    )
                if not _data_quality_binding_is_valid(reference, quality):
                    blocked = True
                    risks.append(
                        _assessment_risk(
                            "critical",
                            "The data hash or range boundary conflicts with the experiment reference.",
                            data_quality_id,
                        )
                    )

            candidate_item = next(
                (
                    item
                    for item in evidence_items
                    if item.get("kind") == "candidate_metrics"
                    and str(item.get("id", "")).startswith(f"experiment:{experiment_id}:candidate:")
                    and isinstance(item.get("value"), Mapping)
                    and item["value"].get("selected") is True
                ),
                None,
            )
            if candidate_item is None:
                gaps.append(f"{experiment_id} selected candidate evidence is missing.")
                continue
            candidate_id = str(candidate_item["id"])
            candidate = candidate_item["value"]
            validation = _complete_metrics(candidate.get("validationMetrics"))
            test = _complete_metrics(candidate.get("testMetrics"))
            walk_forward_returns = _walk_forward_returns(candidate.get("walkForward"))
            if validation is None:
                gaps.append(f"{experiment_id} validationMetrics evidence is missing or incomplete.")
            if test is None:
                gaps.append(f"{experiment_id} testMetrics evidence is missing or incomplete.")
            if walk_forward_returns is None:
                gaps.append(f"{experiment_id} walkForward evidence is missing or incomplete.")
            if validation is None or test is None or walk_forward_returns is None:
                continue

            validation_return, validation_drawdown, validation_trades = validation
            test_return, test_drawdown, test_trades = test
            signatures[experiment_id] = (
                _direction(validation_return),
                _direction(test_return),
                validation_drawdown > MAX_REVIEW_DRAWDOWN_PCT,
                test_drawdown > MAX_REVIEW_DRAWDOWN_PCT,
            )
            if validation_return * test_return < 0:
                risks.append(
                    _assessment_risk(
                        "high",
                        "Validation and test returns reverse direction.",
                        candidate_id,
                    )
                )
            if max(validation_drawdown, test_drawdown) > MAX_REVIEW_DRAWDOWN_PCT:
                risks.append(
                    _assessment_risk(
                        "high",
                        f"Maximum drawdown exceeds {MAX_REVIEW_DRAWDOWN_PCT:.2f}%.",
                        candidate_id,
                    )
                )
            if min(validation_trades, test_trades) < MIN_REVIEW_TRADE_COUNT:
                risks.append(
                    _assessment_risk(
                        "medium",
                        f"Trade count is below {MIN_REVIEW_TRADE_COUNT}.",
                        candidate_id,
                    )
                )
            failure_count = sum(value <= 0 for value in walk_forward_returns)
            if failure_count / len(walk_forward_returns) > WALK_FORWARD_FAILURE_RATIO:
                risks.append(
                    _assessment_risk(
                        "high",
                        "A majority of walk-forward windows have non-positive returns.",
                        candidate_id,
                    )
                )

        consistency = _review_consistency(references, signatures)
        gaps = list(dict.fromkeys(gaps))
        if blocked:
            stance = "blocked"
            summary = "Assessment blocked by evidence integrity or data-quality risk."
        elif gaps:
            stance = "insufficient_evidence"
            summary = f"Evidence is incomplete; {len(gaps)} required item(s) are missing or invalid."
        elif risks:
            stance = "caution"
            summary = f"Evidence is complete with {len(risks)} deterministic caution signal(s)."
        else:
            stance = "supported"
            summary = "Evidence is complete and no deterministic caution threshold was crossed."

        assessment = {
            "stance": stance,
            "summary": summary,
            "risks": risks,
            "invalidationConditions": [
                "Invalidate support if validation and test returns reverse direction.",
                f"Invalidate support if maximum drawdown exceeds {MAX_REVIEW_DRAWDOWN_PCT:.2f}%.",
                f"Invalidate support if trade count falls below {MIN_REVIEW_TRADE_COUNT}.",
                "Invalidate support if more than "
                f"{WALK_FORWARD_FAILURE_RATIO:.0%} of walk-forward windows have non-positive returns.",
            ],
            "watchItems": [
                f"Monitor validation and test trade counts against the minimum of {MIN_REVIEW_TRADE_COUNT}.",
                f"Monitor maximum drawdown against the {MAX_REVIEW_DRAWDOWN_PCT:.2f}% limit.",
                f"Monitor whether non-positive walk-forward windows exceed {WALK_FORWARD_FAILURE_RATIO:.0%}.",
            ],
            "evidenceGaps": gaps,
            "consistency": consistency,
        }
        return validate_assessment(assessment, known_ids)


def _review_experiment_references(evidence_bundle: Mapping[str, Any]) -> list[Mapping[str, Any]]:
    primary = evidence_bundle.get("primaryExperiment")
    comparisons = evidence_bundle.get("comparisonExperiments")
    if not isinstance(primary, Mapping) or not isinstance(comparisons, list):
        return []
    return [primary, *(item for item in comparisons if isinstance(item, Mapping))]


def _data_quality_binding_is_valid(
    reference: Mapping[str, Any],
    quality: Mapping[str, Any],
) -> bool:
    data_hash = quality.get("canonicalDataHash")
    reference_range = reference.get("dataRange")
    start = quality.get("startAt")
    end = quality.get("endAt")
    return bool(
        isinstance(data_hash, str)
        and _SHA256_PATTERN.fullmatch(data_hash)
        and data_hash == reference.get("canonicalDataHash")
        and isinstance(reference_range, Mapping)
        and isinstance(start, str)
        and start
        and isinstance(end, str)
        and end
        and start <= end
        and start == reference_range.get("startAt")
        and end == reference_range.get("endAt")
    )


def _complete_metrics(value: Any) -> tuple[float, float, float] | None:
    if not isinstance(value, Mapping):
        return None
    metrics = tuple(
        _finite_number(value.get(field))
        for field in ("totalReturnPct", "maxDrawdownPct", "tradeCount")
    )
    if any(item is None for item in metrics):
        return None
    return metrics  # type: ignore[return-value]


def _walk_forward_returns(value: Any) -> list[float] | None:
    if not isinstance(value, Mapping) or not isinstance(value.get("windows"), list):
        return None
    returns: list[float] = []
    for window in value["windows"]:
        if not isinstance(window, Mapping):
            return None
        metrics = window.get("validationMetrics")
        raw_return = metrics.get("totalReturnPct") if isinstance(metrics, Mapping) else window.get("totalReturnPct")
        item = _finite_number(raw_return)
        if item is None:
            return None
        returns.append(item)
    return returns or None


def _review_consistency(
    references: list[Mapping[str, Any]],
    signatures: Mapping[str, tuple[int, int, bool, bool]],
) -> str:
    experiment_ids = [reference.get("experimentId") for reference in references]
    if len(experiment_ids) < 2 or any(experiment_id not in signatures for experiment_id in experiment_ids):
        return "insufficient"
    primary_signature = signatures[str(experiment_ids[0])]
    comparison_signatures = [signatures[str(experiment_id)] for experiment_id in experiment_ids[1:]]
    conflict_count = sum(signature != primary_signature for signature in comparison_signatures)
    if conflict_count == 0:
        return "consistent"
    if conflict_count * 2 > len(comparison_signatures):
        return "divergent"
    return "mixed"


def _assessment_risk(
    severity: str,
    message: str,
    evidence_reference: str | None = None,
) -> dict[str, Any]:
    return {
        "severity": severity,
        "message": message,
        "evidenceReferences": [evidence_reference] if evidence_reference else [],
    }


def _direction(value: float) -> int:
    return 1 if value > 0 else -1 if value < 0 else 0


def _finite_number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    number = float(value)
    return number if math.isfinite(number) else None


def _validate_text(value: Any, error: str) -> None:
    if not isinstance(value, str) or not value.strip() or len(value) > MAX_ASSESSMENT_TEXT_CHARS:
        raise ValueError(error)


def _validate_enum(value: Any, allowed: set[str], error: str) -> None:
    _validate_text(value, error)
    if value not in allowed:
        raise ValueError(error)


def _validate_array(value: Any, error: str) -> list[Any]:
    if not isinstance(value, list) or len(value) > MAX_ASSESSMENT_ITEMS:
        raise ValueError(error)
    return value


def build_strategy_lineage_key(experiment: Mapping[str, Any]) -> str:
    strategy = experiment["strategy"]
    if not isinstance(strategy, Mapping):
        raise ValueError("strategy_must_be_object")
    body = {
        "market": _normalize_token(experiment["market"]),
        "symbol": _normalize_token(experiment["symbol"]),
        "timeframe": _normalize_token(experiment["timeframe"]),
        "strategyName": _normalize_strategy_name(strategy["name"]),
        "entryConditions": _condition_shapes(strategy["entryConditions"]),
        "exitConditions": _condition_shapes(strategy["exitConditions"]),
    }
    return canonical_sha256(body)


class AiReviewEvidenceAssembler:
    def __init__(
        self,
        experiment_store: StrategyExperimentStore,
        run_store: ResearchRunStore,
    ) -> None:
        self.experiment_store = experiment_store
        self.run_store = run_store

    def assemble(
        self,
        primary_experiment_id: str,
        comparison_experiment_ids: Sequence[str],
    ) -> dict[str, Any]:
        primary_id, comparison_ids = _validate_request(primary_experiment_id, comparison_experiment_ids)
        primary = self._load_validated(primary_id)
        comparisons = [self._load_validated(experiment_id) for experiment_id in comparison_ids]
        primary_context = tuple(_normalize_token(primary[key]) for key in ("market", "symbol", "timeframe"))
        primary_lineage = build_strategy_lineage_key(primary)
        for comparison in comparisons:
            comparison_context = tuple(
                _normalize_token(comparison[key]) for key in ("market", "symbol", "timeframe")
            )
            if comparison_context != primary_context or build_strategy_lineage_key(comparison) != primary_lineage:
                raise AiReviewStage3Error(
                    "ai_review_comparison_ineligible",
                    409,
                    (
                        f"Experiment {comparison['reference']['experimentId']} has a different context "
                        "or strategy lineage."
                    ),
                )

        bundle = {
            "schemaVersion": 1,
            "mode": "comparison" if comparisons else "single",
            "primaryExperiment": primary["reference"],
            "comparisonExperiments": [comparison["reference"] for comparison in comparisons],
            "strategyLineageKey": primary_lineage,
            "evidenceItems": [
                item
                for experiment in [primary, *comparisons]
                for item in experiment["evidenceItems"]
            ],
            "safetyBoundary": {
                "paperOnly": True,
                "liveTradingAllowed": False,
                "orderSubmissionAllowed": False,
            },
        }
        bundle["evidenceHash"] = canonical_sha256(bundle)
        return bundle

    def _load_validated(self, experiment_id: str) -> dict[str, Any]:
        try:
            detail = self.experiment_store.get(experiment_id)
        except (TypeError, ValueError) as error:
            raise _evidence_conflict(experiment_id, "stored experiment evidence is invalid") from error
        if detail is None:
            raise AiReviewStage3Error(
                "ai_review_experiment_not_found",
                404,
                f"Experiment {experiment_id} was not found.",
            )
        if detail.experiment.status != "completed":
            raise AiReviewStage3Error(
                "ai_review_experiment_not_completed",
                409,
                f"Experiment {experiment_id} is not completed.",
            )
        return self._validate_detail(detail)

    def _validate_detail(self, detail: StrategyExperimentDetail) -> dict[str, Any]:
        experiment = detail.experiment
        snapshot = detail.snapshot
        definition = experiment.definition
        if canonical_sha256(definition) != experiment.definition_hash:
            raise _evidence_conflict(experiment.experiment_id, "definition hash does not match")
        try:
            strategy = strategy_config_to_payload(
                strategy_config_from_payload(definition["baseStrategy"])
            )
        except (KeyError, TypeError, ValueError) as error:
            raise _evidence_conflict(experiment.experiment_id, "strategy definition is invalid") from error
        if canonical_json(strategy) != canonical_json(definition["baseStrategy"]):
            raise _evidence_conflict(experiment.experiment_id, "strategy definition is not canonical")

        context = (experiment.market, experiment.symbol, experiment.timeframe)
        if (
            definition.get("sourceRunId") != experiment.source_run_id
            or definition.get("snapshotId") != experiment.snapshot_id
            or definition.get("canonicalDataHash") != snapshot.canonical_data_hash
            or definition.get("strategyRevision") != experiment.strategy_revision
            or tuple(definition.get(key) for key in ("market", "symbol", "timeframe")) != context
            or tuple(getattr(snapshot, key) for key in ("market", "symbol", "timeframe")) != context
            or strategy["revision"] != experiment.strategy_revision
            or (strategy["market"], strategy["symbols"][0], strategy["timeframe"]) != context
            or snapshot.snapshot_id != experiment.snapshot_id
            or snapshot.test_definition_hash != experiment.definition_hash
            or snapshot.test_consumed_at is None
        ):
            raise _evidence_conflict(experiment.experiment_id, "experiment definition and snapshot bindings differ")

        try:
            bars = normalize_snapshot_bars(snapshot.bars)
            data_hash = canonical_data_hash(bars)
        except (TypeError, ValueError) as error:
            raise _evidence_conflict(experiment.experiment_id, "snapshot bars are invalid") from error
        expected_snapshot_id = canonical_snapshot_id(
            market=experiment.market,
            symbol=experiment.symbol,
            timeframe=experiment.timeframe,
            canonical_data_hash=data_hash,
        )
        if (
            data_hash != snapshot.canonical_data_hash
            or expected_snapshot_id != snapshot.snapshot_id
            or snapshot.rows != len(bars)
            or not bars
            or snapshot.start_at != bars[0]["timestamp"]
            or snapshot.end_at != bars[-1]["timestamp"]
        ):
            raise _evidence_conflict(experiment.experiment_id, "snapshot metadata does not match its bars")

        try:
            source_run = self.run_store.get(experiment.source_run_id)
        except (TypeError, ValueError) as error:
            raise _evidence_conflict(experiment.experiment_id, "source run evidence is invalid") from error
        if source_run is None:
            raise _evidence_conflict(experiment.experiment_id, "source run was not found")
        source_snapshot = source_run.data_snapshot
        if (
            (source_run.market, source_run.symbol, source_run.timeframe) != context
            or source_run.strategy_revision != experiment.strategy_revision
            or source_run.strategy_name != strategy["name"]
            or canonical_json(source_run.strategy_config or {}) != canonical_json(strategy)
            or source_run.data_rows != snapshot.rows
            or str(source_snapshot.get("hashVersion") or "") != DATA_SNAPSHOT_HASH_VERSION
            or source_snapshot.get("hash") != snapshot.canonical_data_hash
            or source_snapshot.get("rows") != snapshot.rows
            or source_snapshot.get("start") != snapshot.start_at
            or source_snapshot.get("end") != snapshot.end_at
        ):
            raise _evidence_conflict(experiment.experiment_id, "source run does not match the experiment")

        selected = next(
            (
                candidate
                for candidate in detail.candidates
                if candidate.candidate_id == experiment.selected_candidate_id
            ),
            None,
        )
        if selected is None:
            raise _evidence_conflict(experiment.experiment_id, "selected candidate was not found")
        if selected.test_metrics is None:
            raise _evidence_conflict(experiment.experiment_id, "selected candidate has no test metrics")
        if any(
            candidate.test_metrics is not None
            for candidate in detail.candidates
            if candidate.candidate_id != selected.candidate_id
        ):
            raise _evidence_conflict(experiment.experiment_id, "unselected candidate contains test metrics")
        if _result_hash(detail.candidates, selected, experiment.completion_reason) != experiment.result_hash:
            raise _evidence_conflict(experiment.experiment_id, "result hash does not match")

        reference = {
            "experimentId": experiment.experiment_id,
            "sourceRunId": experiment.source_run_id,
            "strategyRevision": experiment.strategy_revision,
            "snapshotId": snapshot.snapshot_id,
            "definitionHash": experiment.definition_hash,
            "resultHash": experiment.result_hash,
            "selectedCandidateId": selected.candidate_id,
            "candidateRevision": selected.candidate_revision,
            "canonicalDataHash": snapshot.canonical_data_hash,
            "dataRange": {"startAt": snapshot.start_at, "endAt": snapshot.end_at},
        }
        prefix = f"experiment:{experiment.experiment_id}"
        return {
            "market": experiment.market,
            "symbol": experiment.symbol,
            "timeframe": experiment.timeframe,
            "strategy": strategy,
            "reference": reference,
            "evidenceItems": [
                {
                    "id": f"{prefix}:context",
                    "kind": "experiment_context",
                    "value": {
                        "market": experiment.market,
                        "symbol": experiment.symbol,
                        "timeframe": experiment.timeframe,
                    },
                },
                {
                    "id": f"{prefix}:strategy",
                    "kind": "strategy_definition",
                    "value": strategy,
                },
                {
                    "id": f"{prefix}:data-quality",
                    "kind": "data_quality",
                    "value": {
                        **source_run.data_quality,
                        "canonicalDataHash": snapshot.canonical_data_hash,
                        "startAt": snapshot.start_at,
                        "endAt": snapshot.end_at,
                    },
                },
                *[_candidate_evidence(prefix, candidate, selected.candidate_id) for candidate in detail.candidates],
            ],
        }


def _validate_request(
    primary_experiment_id: str,
    comparison_experiment_ids: Sequence[str],
) -> tuple[str, list[str]]:
    if (
        not isinstance(primary_experiment_id, str)
        or not primary_experiment_id.strip()
        or isinstance(comparison_experiment_ids, (str, bytes))
        or not isinstance(comparison_experiment_ids, Sequence)
    ):
        raise _invalid_request("Primary and comparison experiment IDs are invalid.")
    primary = primary_experiment_id.strip()
    comparisons = list(comparison_experiment_ids)
    if any(not isinstance(value, str) or not value.strip() for value in comparisons):
        raise _invalid_request("Comparison experiment IDs are invalid.")
    comparisons = [value.strip() for value in comparisons]
    if len(comparisons) > 4:
        raise _invalid_request("At most four comparison experiments are allowed.")
    if len(comparisons) != len(set(comparisons)) or primary in comparisons:
        raise _invalid_request("Comparison experiment IDs must be unique and exclude the primary experiment.")
    return primary, comparisons


def _result_hash(
    candidates: list[StrategyExperimentCandidateRecord],
    selected: StrategyExperimentCandidateRecord,
    completion_reason: str | None,
) -> str:
    ordered = sorted(candidates, key=lambda candidate: canonical_json(candidate.parameters))
    return canonical_sha256(
        {
            "candidates": [
                {
                    "parameters": candidate.parameters,
                    "trainMetrics": candidate.train_metrics,
                    "validationMetrics": candidate.validation_metrics,
                    "walkForward": candidate.walk_forward,
                }
                for candidate in ordered
            ],
            "selection": {
                "parameters": selected.parameters,
                "testMetrics": selected.test_metrics,
            },
            "completionReason": completion_reason,
            "schemaVersion": 1,
        }
    )


def _candidate_evidence(
    prefix: str,
    candidate: StrategyExperimentCandidateRecord,
    selected_candidate_id: str,
) -> dict[str, Any]:
    selected = candidate.candidate_id == selected_candidate_id
    value = {
        "candidateId": candidate.candidate_id,
        "candidateRevision": candidate.candidate_revision,
        "parameters": candidate.parameters,
        "trainMetrics": candidate.train_metrics,
        "validationMetrics": candidate.validation_metrics,
        "walkForward": candidate.walk_forward,
        "eligible": candidate.eligible,
        "rank": candidate.rank,
        "selected": selected,
    }
    if selected:
        value["testMetrics"] = candidate.test_metrics
    return {
        "id": f"{prefix}:candidate:{candidate.candidate_id}",
        "kind": "candidate_metrics",
        "value": value,
    }


def _condition_shapes(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        raise ValueError("strategy_conditions_must_be_array")
    shapes = []
    for condition in value:
        if not isinstance(condition, Mapping) or not isinstance(condition.get("params"), Mapping):
            raise ValueError("strategy_condition_must_be_object")
        shapes.append(
            {
                "kind": _normalize_token(condition.get("kind")),
                "parameterKeys": sorted(_normalize_token(key) for key in condition["params"]),
            }
        )
    return shapes


def _normalize_token(value: Any) -> str:
    return str(value).strip().casefold()


def _normalize_strategy_name(value: Any) -> str:
    return " ".join(str(value).strip().split()).casefold()


def _evidence_conflict(experiment_id: str, detail: str) -> AiReviewStage3Error:
    return AiReviewStage3Error(
        "ai_review_evidence_conflict",
        409,
        f"Experiment {experiment_id} evidence conflict: {detail}.",
    )


def _invalid_request(detail: str) -> AiReviewStage3Error:
    return AiReviewStage3Error("invalid_ai_review_request", 400, detail)
