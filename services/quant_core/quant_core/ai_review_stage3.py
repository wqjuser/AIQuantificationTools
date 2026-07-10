from __future__ import annotations

from collections.abc import Mapping, Sequence
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
