from __future__ import annotations

import copy
from hashlib import sha256
import itertools
import json
import math
import statistics
import time
import uuid
from dataclasses import asdict, dataclass, replace
from datetime import datetime, timedelta, timezone
from threading import Thread
from typing import Any, Callable, Literal, Mapping, Protocol, Sequence, cast

from quant_core.ai_review_stage3 import build_strategy_lineage_key_from_parts
from quant_core.backtest import BacktestEngine, strategy_required_bars
from quant_core.canonical import (
    DATA_SNAPSHOT_HASH_VERSION,
    canonical_data_hash,
    canonical_json,
    canonical_sha256,
    canonical_snapshot_id,
    flatten_chunked_data_snapshot,
    normalize_snapshot_bar_chunks,
    normalize_snapshot_bars,
    snapshot_bars_to_ohlcv,
    strategy_config_from_payload,
    strategy_config_to_payload,
)
from quant_core.domain import BacktestMetrics, BacktestRun, OHLCVBar, StrategyConfig
from quant_core.research import (
    _backtest_equity_curve_rows,
    _backtest_trade_replay_payload,
    _backtest_trade_replay_rows,
)
from quant_core.runs import ResearchRunStore
from quant_core.sealed_datasets import (
    SEALED_DATASET_HASH_VERSION,
    normalize_sealed_research_snapshot,
)
from quant_core.strategy_experiment_store import (
    StrategyExperimentCandidateRecord,
    StrategyExperimentDetail,
    StrategyExperimentRecord,
    StrategyExperimentSnapshot,
    StrategyExperimentStore,
)
from quant_core.strategy_library import StrategyLibraryStore


MAX_SOURCE_BARS = 500
MAX_CANDIDATES = 81
MAX_WALK_FORWARD_WINDOWS = 12
MAX_EVALUATIONS = 512
DEADLINE_SECONDS = 15.0
MIN_FORMAL_SOURCE_BARS = 90 * 24 * 60
FORMAL_TRAIN_SCORING_BARS = 54 * 24 * 60
FORMAL_DEVELOPMENT_SCORING_BARS = 72 * 24 * 60
FORMAL_TEST_SCORING_BARS = 18 * 24 * 60
ENGINE_VERSION = "backtest-v1"
RESULT_SCHEMA_VERSION = 1
POLICY_ENGINE_VERSION = "backtest-v2"
POLICY_EVALUATOR_VERSION = "strategy-evaluator-v2"
POLICY_RESULT_SCHEMA_VERSION = 2
FORMAL_PRE_ROLL_VERSION_V1 = "formal-pre-roll-v1"
FORMAL_PRE_ROLL_VERSION = "formal-pre-roll-v2"

_SUPPORTED_PARAMETERS = {
    "close_above_sma": {"window"},
    "close_below_sma": {"window"},
    "volume_above_sma": {"window"},
    "rsi_below": {"window", "threshold"},
    "rsi_above": {"window", "threshold"},
}
_SUPPORTED_POLICY_PATHS = {
    "reversion.entryZThreshold": "signed_threshold",
    "regime.closeAboveSmaWindow": "window",
    "regime.smaSlopeLookbackBars": "slope",
    "breakout.lookbackBars": "window",
    "volume.smaWindow": "window",
    "volume.multiplier": "multiple",
    "atr.window": "window",
    "atr.initialMultiple": "multiple",
    "atr.trailingMultiple": "multiple",
    "holding.maxBars": "bars",
    "cooldown.bars": "cooldown",
}
_SUPPORTED_POLICY_PATHS_BY_KIND = {
    "regime_breakout_v2": frozenset(
        path for path in _SUPPORTED_POLICY_PATHS if path != "reversion.entryZThreshold"
    ),
    "cost_aware_range_reversion_v1": frozenset({"reversion.entryZThreshold"}),
    "cost_aware_range_reversion_v1_1": frozenset({"reversion.entryZThreshold"}),
}
FORMAL_PROFITABILITY_GUARDRAILS = {
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
}
FORMAL_BACKTEST_ASSUMPTIONS = {"initialCash": 10, "feeBps": 10, "slippageBps": 10}


class SealedBarSource(Protocol):
    def get_summary(self, dataset_id: str) -> Any | None: ...

    def read_development_bars(self, dataset_id: str) -> list[OHLCVBar]: ...

    def claim_test_partition(
        self,
        dataset_id: str,
        *,
        claimant_id: str,
        expected_dataset_hash: str,
    ) -> Any: ...

    def read_claimed_test_bars(
        self,
        dataset_id: str,
        *,
        claim_token: str,
    ) -> list[OHLCVBar]: ...


@dataclass(frozen=True)
class ParameterDimension:
    side: Literal["entry", "exit"]
    condition_index: int
    parameter: Literal["window", "threshold"]
    values: tuple[int | float, ...]


@dataclass(frozen=True)
class PolicyParameterDimension:
    policy_path: str
    values: tuple[int | float, ...]


@dataclass(frozen=True)
class ExpandedCandidate:
    candidate_id: str
    strategy: StrategyConfig
    parameters: list[dict[str, Any]]


@dataclass(frozen=True)
class _ExperimentDefinition:
    definition: dict[str, Any]
    definition_hash: str
    holdout_key: str
    snapshot: StrategyExperimentSnapshot
    strategy: StrategyConfig
    candidates: tuple[ExpandedCandidate, ...]
    bars: tuple[Any, ...]
    train_end: int
    validation_end: int
    walk_forward_windows: tuple[tuple[int, int, int], ...]
    score_start_index: int = 0
    sealed_dataset_id: str | None = None
    sealed_dataset_hash: str | None = None


class _ExperimentTimeout(RuntimeError):
    pass


class StrategyExperimentError(ValueError):
    def __init__(
        self,
        *,
        status: int,
        error: str,
        detail: str,
        experiment_id: str | None = None,
    ) -> None:
        super().__init__(detail)
        self.status = status
        self.error = error
        self.detail = detail
        self.experiment_id = experiment_id


def expand_candidates(
    base_strategy: StrategyConfig,
    dimensions: Sequence[ParameterDimension | PolicyParameterDimension],
) -> tuple[ExpandedCandidate, ...]:
    normalized = _normalize_dimensions(base_strategy, dimensions)
    candidate_count = math.prod(len(dimension.values) for dimension in normalized)
    if not 1 <= candidate_count <= MAX_CANDIDATES:
        raise _invalid("Strategy experiments require between 1 and 81 canonical candidates.")
    candidates: list[ExpandedCandidate] = []
    for values in itertools.product(*(dimension.values for dimension in normalized)):
        parameters = []
        for dimension, value in zip(normalized, values, strict=True):
            if isinstance(dimension, PolicyParameterDimension):
                parameters.append({"policyPath": dimension.policy_path, "value": value})
            else:
                parameters.append(
                    {
                        "conditionSide": dimension.side,
                        "conditionIndex": dimension.condition_index,
                        "parameter": dimension.parameter,
                        "value": value,
                    }
                )
        payload = copy.deepcopy(strategy_config_to_payload(base_strategy))
        for parameter in parameters:
            if "policyPath" in parameter:
                target = cast(dict[str, Any], payload["policy"])
                segments = str(parameter["policyPath"]).split(".")
                for segment in segments[:-1]:
                    target = cast(dict[str, Any], target[segment])
                target[segments[-1]] = parameter["value"]
            else:
                conditions = payload[
                    "entryConditions" if parameter["conditionSide"] == "entry" else "exitConditions"
                ]
                cast(list[dict[str, Any]], conditions)[parameter["conditionIndex"]]["params"][parameter["parameter"]] = (
                    parameter["value"]
                )
        try:
            candidate_strategy = strategy_config_from_payload(payload)
        except ValueError as error:
            raise _invalid("Candidate strategy is outside canonical policy bounds.") from error
        candidates.append(
            ExpandedCandidate(
                candidate_id=canonical_sha256(parameters)[:12],
                strategy=candidate_strategy,
                parameters=parameters,
            )
        )
    return tuple(candidates)


class StrategyExperimentRunner:
    def __init__(
        self,
        *,
        strategy_store: StrategyLibraryStore,
        run_store: ResearchRunStore,
        experiment_store: StrategyExperimentStore,
        monotonic: Callable[[], float] = time.monotonic,
        sealed_bar_source: SealedBarSource | None = None,
        job_launcher: Callable[[Callable[[], None]], None] | None = None,
        launch_evidence_loader: Callable[[str], Any] | None = None,
    ) -> None:
        self.strategy_store = strategy_store
        self.run_store = run_store
        self.experiment_store = experiment_store
        self.monotonic = monotonic
        self.sealed_bar_source = sealed_bar_source
        self.job_launcher = job_launcher or _launch_background_job
        self.launch_evidence_loader = launch_evidence_loader
        self._evaluation_count = 0

    def run_new(
        self,
        payload: dict[str, Any],
        *,
        idempotency_key: str | None = None,
        launch_intent: Mapping[str, Any] | None = None,
    ) -> StrategyExperimentDetail:
        definition = (
            self._definition_from_source(payload)
            if launch_intent is None
            else self._definition_from_source(
                payload,
                launch_intent=launch_intent,
            )
        )
        if definition.sealed_dataset_id is None:
            if idempotency_key is not None:
                raise StrategyExperimentError(
                    status=400,
                    error="strategy_experiment_idempotency_requires_formal",
                    detail="Idempotent launch keys are only supported for formal experiments.",
                )
            return self._run(definition)
        return self._queue_formal(
            definition,
            idempotency_key=idempotency_key,
        )

    def replay(self, experiment_id: str) -> StrategyExperimentDetail:
        prior = self.experiment_store.get(experiment_id)
        if prior is None:
            raise StrategyExperimentError(
                status=404,
                error="strategy_experiment_not_found",
                detail=f"Strategy experiment {experiment_id} was not found.",
            )
        definition = self._definition_from_record(prior)
        if prior.experiment.status == "completed":
            expected_result_hash = _result_hash(
                definition.definition_hash,
                prior.candidates,
                selected_candidate_id=prior.experiment.selected_candidate_id,
                completion_reason=str(prior.experiment.completion_reason or ""),
                profitability_gate_passed=prior.experiment.profitability_gate_passed,
                result_schema_version=int(
                    definition.definition["resultSchemaVersion"]
                ),
                pre_roll_version=definition.definition.get("preRollVersion"),
            )
            if prior.experiment.result_hash != expected_result_hash:
                raise _conflict("Stored experiment result hash is invalid.")
        replay_id = f"experiment-{uuid.uuid4().hex}"
        replay = replace(
            prior.experiment,
            experiment_id=replay_id,
            created_at=datetime.now(timezone.utc),
            evaluation_count=0,
            promotion_run_id=None,
            promoted_strategy_revision=None,
            promotion_lineage_hash=None,
            promoted_at=None,
            promotion_operator=None,
        )
        candidates = [
            replace(candidate, experiment_id=replay_id) for candidate in prior.candidates
        ]
        self.experiment_store.record_completed(replay, candidates)
        stored = self.experiment_store.get(replay_id)
        if stored is None:
            raise RuntimeError("strategy_experiment_replay_readback_failed")
        return stored

    def resume_pending(self, experiment_id: str) -> StrategyExperimentDetail:
        prior = self.experiment_store.get(_required_string(experiment_id))
        if prior is None:
            raise StrategyExperimentError(
                status=404,
                error="strategy_experiment_not_found",
                detail=f"Strategy experiment {experiment_id} was not found.",
            )
        if prior.experiment.status != "pending":
            return prior
        try:
            self._require_strategy_research_launch_evidence(prior.experiment)
        except StrategyExperimentError as error:
            failed = replace(
                prior.experiment,
                status="failed",
                selected_candidate_id=None,
                completion_reason=None,
                result_hash=None,
                profitability_gate_passed=False,
                error_code=error.error,
                error_detail=error.detail,
            )
            self.experiment_store.record_failed(failed)
            stored = self.experiment_store.get(prior.experiment.experiment_id)
            if stored is None:
                raise RuntimeError("strategy_experiment_recovery_readback_failed")
            return stored
        if self.experiment_store.claimed_definition(prior.snapshot.snapshot_id) is not None:
            failed = replace(
                prior.experiment,
                status="failed",
                selected_candidate_id=None,
                completion_reason=None,
                result_hash=None,
                profitability_gate_passed=False,
                error_code="test_holdout_consumed_before_recovery",
                error_detail=(
                    "The sealed test holdout was already consumed before the pending "
                    "experiment could be recovered."
                ),
            )
            self.experiment_store.record_failed(failed)
        else:
            try:
                definition = self._definition_from_record(prior)
            except StrategyExperimentError:
                failed = replace(
                    prior.experiment,
                    status="failed",
                    selected_candidate_id=None,
                    completion_reason=None,
                    result_hash=None,
                    profitability_gate_passed=False,
                    error_code="strategy_experiment_recovery_invalid",
                    error_detail="The pending experiment could not be safely recovered.",
                )
                self.experiment_store.record_failed(failed)
            else:
                self._execute_formal_job(
                    definition,
                    experiment_id=prior.experiment.experiment_id,
                    created_at=prior.experiment.created_at,
                )
        stored = self.experiment_store.get(prior.experiment.experiment_id)
        if stored is None:
            raise RuntimeError("strategy_experiment_recovery_readback_failed")
        return stored

    def promote_winner(
        self,
        experiment_id: str,
        *,
        fresh_source_run_id: str,
        operator: str,
        confirmed: bool,
    ) -> dict[str, Any]:
        normalized_experiment_id = _required_string(experiment_id)
        normalized_run_id = _required_string(fresh_source_run_id)
        normalized_operator = _required_string(operator)
        if confirmed is not True:
            raise StrategyExperimentError(
                status=400,
                error="strategy_experiment_promotion_confirmation_required",
                detail="Explicit promotion confirmation is required.",
            )
        detail = self.experiment_store.get(normalized_experiment_id)
        if detail is None:
            raise StrategyExperimentError(
                status=404,
                error="strategy_experiment_not_found",
                detail=f"Strategy experiment {normalized_experiment_id} was not found.",
            )
        selected = _promotable_selected_candidate(detail)
        winner = _winner_strategy(detail, selected)
        formal_identity_required = _fresh_p0_formal_identity_required(detail)
        fresh_run = self.run_store.get(normalized_run_id)
        if fresh_run is None:
            raise StrategyExperimentError(
                status=404,
                error="research_run_not_found",
                detail=f"Research run {normalized_run_id} was not found.",
            )
        (
            fresh_snapshot_hash,
            fresh_data_range,
            fresh_gate_evaluation,
        ) = _validate_fresh_p0_run(
            fresh_run,
            winner=winner,
            prior_snapshot_hash=detail.snapshot.canonical_data_hash,
            after=detail.snapshot.test_consumed_at,
            sealed_bar_source=self.sealed_bar_source,
            formal_identity_required=formal_identity_required,
        )
        prior_data_range = _experiment_snapshot_data_range(detail)
        if fresh_data_range == prior_data_range:
            raise StrategyExperimentError(
                status=409,
                error="fresh_p0_snapshot_invalid",
                detail="The promotion run must use a different data range from the formal experiment.",
            )
        result_hash = detail.experiment.result_hash
        if not result_hash:
            raise _conflict("The profitable experiment result hash is missing.")
        lineage = {
            "experimentId": detail.experiment.experiment_id,
            "definitionHash": detail.experiment.definition_hash,
            "resultHash": result_hash,
            "candidateId": selected.candidate_id,
            "candidateRevision": selected.candidate_revision,
            "freshSourceRunId": normalized_run_id,
            "freshSnapshotHash": fresh_snapshot_hash,
            "priorDataRange": prior_data_range,
            "freshDataRange": fresh_data_range,
            "freshSnapshotDistinct": True,
            "freshDataRangeDistinct": True,
            "freshGateEvaluation": fresh_gate_evaluation,
            "freshGateHash": canonical_sha256(fresh_gate_evaluation),
            "strategyRevision": winner.revision,
            "operator": normalized_operator,
            "profitabilityStatus": "formal_gate_passed",
            "paperOnly": True,
            "bindingBlocked": False,
        }
        lineage_hash = canonical_sha256(lineage)
        promotion_evidence = {**lineage, "lineageHash": lineage_hash}
        if detail.experiment.promotion_lineage_hash is not None and not (
            detail.experiment.promotion_run_id == normalized_run_id
            and detail.experiment.promoted_strategy_revision == winner.revision
            and detail.experiment.promotion_lineage_hash == lineage_hash
            and detail.experiment.promotion_operator == normalized_operator
        ):
            raise StrategyExperimentError(
                status=409,
                error="strategy_experiment_already_promoted",
                detail="The experiment is already bound to different promotion evidence.",
            )
        previous = self.strategy_store.get(winner.revision)
        if previous is not None and canonical_json(previous.strategy_config) != canonical_json(
            strategy_config_to_payload(winner)
        ):
            raise _conflict("The winner revision conflicts with the strategy library.")
        try:
            # These stores cannot share one transaction. The library's
            # same-experiment write-once rule elects one lineage first; exact
            # retries then converge the experiment marker after interruptions.
            self.strategy_store.save(
                winner,
                audit_run_id=normalized_run_id,
                promotion_evidence=promotion_evidence,
            )
            promoted = self.experiment_store.mark_promoted(
                experiment_id=detail.experiment.experiment_id,
                expected_result_hash=result_hash,
                promotion_run_id=normalized_run_id,
                promoted_strategy_revision=winner.revision,
                promotion_lineage_hash=lineage_hash,
                promoted_at=datetime.now(timezone.utc),
                promotion_operator=normalized_operator,
            )
        except Exception as error:
            if isinstance(error, ValueError) and str(error).startswith(
                "strategy_library_"
            ):
                raise StrategyExperimentError(
                    status=409,
                    error=str(error),
                    detail="The promoted strategy evidence conflicts with the strategy library.",
                ) from None
            if isinstance(error, ValueError) and str(error) in {
                "strategy_experiment_already_promoted",
                "strategy_experiment_not_promotable",
            }:
                raise StrategyExperimentError(
                    status=409,
                    error=str(error),
                    detail="The experiment promotion state changed before it could be recorded.",
                ) from None
            raise
        return {
            **lineage,
            "lineageHash": lineage_hash,
            "promotedAt": (
                promoted.experiment.promoted_at.isoformat()
                if promoted.experiment.promoted_at
                else None
            ),
            "libraryStatus": "audited",
            "auditRunId": normalized_run_id,
        }

    def _queue_formal(
        self,
        definition: _ExperimentDefinition,
        *,
        idempotency_key: str | None = None,
    ) -> StrategyExperimentDetail:
        experiment_id = (
            f"experiment-{uuid.uuid4().hex}"
            if idempotency_key is None
            else _idempotent_experiment_id(idempotency_key)
        )
        self._require_strategy_research_launch_evidence_for_definition(
            definition.definition,
            experiment_id=experiment_id,
        )
        if idempotency_key is not None:
            existing = self.experiment_store.get(experiment_id)
            if existing is not None:
                return _validated_idempotent_experiment(existing, definition)
        if self.experiment_store.claimed_definition(definition.snapshot.snapshot_id) is not None:
            raise StrategyExperimentError(
                status=409,
                error="test_holdout_consumed",
                detail="The test holdout is already bound to a different experiment definition.",
            )
        created_at = datetime.now(timezone.utc)
        self._evaluation_count = 0
        pending = self._record(
            definition,
            experiment_id=experiment_id,
            created_at=created_at,
            status="pending",
        )
        try:
            self.experiment_store.record_pending(pending)
        except Exception:
            if idempotency_key is not None:
                winner = self.experiment_store.get(experiment_id)
                if winner is not None:
                    return _validated_idempotent_experiment(winner, definition)
            raise
        self.job_launcher(
            lambda: self._execute_formal_job(
                definition,
                experiment_id=experiment_id,
                created_at=created_at,
            )
        )
        stored = self.experiment_store.get(experiment_id)
        if stored is None:
            raise RuntimeError("strategy_experiment_pending_readback_failed")
        return stored

    def _execute_formal_job(
        self,
        definition: _ExperimentDefinition,
        *,
        experiment_id: str,
        created_at: datetime,
    ) -> None:
        existing = self.experiment_store.get(experiment_id)
        development_checkpoint = None
        if (
            existing is not None
            and existing.experiment.status == "pending"
            and existing.experiment.completion_reason == "development_completed"
            and existing.candidates
        ):
            development_checkpoint = existing.candidates
            self._evaluation_count = existing.experiment.evaluation_count
        else:
            self._evaluation_count = 0
        try:
            self._require_strategy_research_launch_evidence_for_definition(
                definition.definition,
                experiment_id=experiment_id,
            )
            (
                candidate_records,
                selected_candidate_id,
                completion_reason,
                profitability_gate_passed,
            ) = self._evaluate_candidates(
                definition,
                experiment_id=experiment_id,
                deadline=None,
                development_checkpoint=development_checkpoint,
            )
            result_hash = _result_hash(
                definition.definition_hash,
                candidate_records,
                selected_candidate_id=selected_candidate_id,
                completion_reason=completion_reason,
                profitability_gate_passed=profitability_gate_passed,
                result_schema_version=int(definition.definition["resultSchemaVersion"]),
                pre_roll_version=definition.definition.get("preRollVersion"),
            )
            completed = self._record(
                definition,
                experiment_id=experiment_id,
                created_at=created_at,
                status="completed",
                selected_candidate_id=selected_candidate_id,
                completion_reason=completion_reason,
                result_hash=result_hash,
                profitability_gate_passed=profitability_gate_passed,
            )
            self.experiment_store.record_completed(completed, candidate_records)
        except StrategyExperimentError as error:
            self._persist_failure(
                definition,
                experiment_id=experiment_id,
                created_at=created_at,
                error_code=error.error,
                detail=error.detail,
            )
        except Exception:
            self._persist_failure(
                definition,
                experiment_id=experiment_id,
                created_at=created_at,
                error_code="strategy_experiment_failed",
                detail="Strategy experiment execution failed.",
            )

    def _run(self, definition: _ExperimentDefinition) -> StrategyExperimentDetail:
        experiment_id = f"experiment-{uuid.uuid4().hex}"
        created_at = datetime.now(timezone.utc)
        self._evaluation_count = 0
        try:
            claimed = self.experiment_store.claimed_definition(definition.snapshot.snapshot_id)
            if claimed is not None:
                raise StrategyExperimentError(
                    status=409,
                    error="test_holdout_consumed",
                    detail="The test holdout is already bound to a different experiment definition.",
                )
            deadline = self.monotonic() + DEADLINE_SECONDS
            (
                candidate_records,
                selected_candidate_id,
                completion_reason,
                profitability_gate_passed,
            ) = self._evaluate_candidates(
                definition,
                experiment_id=experiment_id,
                deadline=deadline,
            )
            result_hash = _result_hash(
                definition.definition_hash,
                candidate_records,
                selected_candidate_id=selected_candidate_id,
                completion_reason=completion_reason,
                profitability_gate_passed=profitability_gate_passed,
                result_schema_version=int(definition.definition["resultSchemaVersion"]),
                pre_roll_version=definition.definition.get("preRollVersion"),
            )
            experiment = self._record(
                definition,
                experiment_id=experiment_id,
                created_at=created_at,
                status="completed",
                selected_candidate_id=selected_candidate_id,
                completion_reason=completion_reason,
                result_hash=result_hash,
                profitability_gate_passed=profitability_gate_passed,
            )
            self.experiment_store.record_completed(experiment, candidate_records)
            stored = self.experiment_store.get(experiment_id)
            if stored is None:
                raise RuntimeError("strategy_experiment_readback_failed")
            return stored
        except StrategyExperimentError:
            raise
        except _ExperimentTimeout:
            self._persist_failure(
                definition,
                experiment_id=experiment_id,
                created_at=created_at,
                error_code="experiment_timeout",
                detail="Strategy experiment exceeded its execution deadline.",
            )
            raise StrategyExperimentError(
                status=500,
                error="strategy_experiment_failed",
                detail="Strategy experiment exceeded its execution deadline.",
                experiment_id=experiment_id,
            ) from None
        except Exception:
            self._persist_failure(
                definition,
                experiment_id=experiment_id,
                created_at=created_at,
                error_code="strategy_experiment_failed",
                detail="Strategy experiment execution failed.",
            )
            raise StrategyExperimentError(
                status=500,
                error="strategy_experiment_failed",
                detail="Strategy experiment execution failed.",
                experiment_id=experiment_id,
            ) from None

    def _definition_from_source(
        self,
        payload: dict[str, Any],
        *,
        launch_intent: Mapping[str, Any] | None = None,
    ) -> _ExperimentDefinition:
        if not isinstance(payload, dict) or set(payload) != {
            "strategyRevision",
            "sourceRunId",
            "assumptions",
            "dimensions",
            "guardrails",
            "walkForward",
        }:
            raise _invalid("Strategy experiment request fields are invalid.")
        strategy_revision = _required_string(payload.get("strategyRevision"))
        source_run_id = _required_string(payload.get("sourceRunId"))
        strategy_record = self.strategy_store.get(strategy_revision)
        if strategy_record is None:
            raise StrategyExperimentError(
                status=404,
                error="strategy_not_found",
                detail=f"Strategy {strategy_revision} was not found.",
            )
        source_run = self.run_store.get(source_run_id)
        if source_run is None:
            raise StrategyExperimentError(
                status=404,
                error="research_run_not_found",
                detail=f"Research run {source_run_id} was not found.",
            )

        try:
            library_strategy = strategy_config_from_payload(strategy_record.strategy_config)
            run_strategy = strategy_config_from_payload(source_run.strategy_config or {})
            library_payload = strategy_config_to_payload(library_strategy)
            run_payload = strategy_config_to_payload(run_strategy)
            library_body_is_canonical = canonical_json(strategy_record.strategy_config) == canonical_json(
                library_payload
            )
            run_body_is_canonical = canonical_json(source_run.strategy_config or {}) == canonical_json(
                run_payload
            )
        except (TypeError, ValueError) as error:
            raise _conflict("Stored strategy configuration is not canonical.") from error
        if (
            not library_body_is_canonical
            or not run_body_is_canonical
            or library_strategy.revision != strategy_revision
            or run_strategy.revision != strategy_revision
            or strategy_record.revision != strategy_revision
            or source_run.strategy_revision != strategy_revision
            or str(strategy_record.strategy_config.get("revision") or "") != strategy_revision
            or str((source_run.strategy_config or {}).get("revision") or "") != strategy_revision
            or canonical_json(library_payload) != canonical_json(run_payload)
        ):
            raise _conflict("Stored strategy bodies and revisions do not match.")
        symbol = library_strategy.symbols[0]
        if (
            strategy_record.market != library_strategy.market
            or strategy_record.symbol != symbol
            or strategy_record.timeframe != library_strategy.timeframe
            or source_run.market != library_strategy.market
            or source_run.symbol != symbol
            or source_run.timeframe != library_strategy.timeframe
            or source_run.strategy_name != library_strategy.name
        ):
            raise _conflict("Stored strategy and research run context do not match.")

        if library_strategy.policy is not None:
            return self._definition_from_sealed_source(
                payload,
                strategy=library_strategy,
                strategy_revision=strategy_revision,
                source_run_id=source_run_id,
                source_run=source_run,
                library_payload=library_payload,
                launch_intent=launch_intent,
            )

        snapshot_payload = source_run.data_snapshot
        if str(snapshot_payload.get("hashVersion") or "") != DATA_SNAPSHOT_HASH_VERSION:
            raise StrategyExperimentError(
                status=409,
                error="source_snapshot_reaudit_required",
                detail="The source run requires a complete aiqt-data-v2 snapshot.",
            )
        raw_bars = snapshot_payload.get("bars")
        if not isinstance(raw_bars, list) or not raw_bars:
            raise _conflict("The source snapshot is empty.")
        if len(raw_bars) > MAX_SOURCE_BARS:
            raise _invalid("Strategy experiments support at most 500 source bars.")
        if not bool(snapshot_payload.get("isComplete")) or not bool(source_run.data_quality.get("isComplete")):
            raise _conflict("The source snapshot is incomplete.")
        try:
            normalized_bars = normalize_snapshot_bars(raw_bars)
        except (TypeError, ValueError) as error:
            raise _conflict("The source snapshot bars are invalid.") from error
        rows = len(normalized_bars)
        if (
            _exact_int(snapshot_payload.get("rows")) != rows
            or source_run.data_rows != rows
            or _exact_int(source_run.data_quality.get("rows")) != rows
            or snapshot_payload.get("start") != normalized_bars[0]["timestamp"]
            or snapshot_payload.get("end") != normalized_bars[-1]["timestamp"]
        ):
            raise _conflict("The source snapshot row metadata does not match its bars.")
        digest = canonical_data_hash(normalized_bars)
        if str(snapshot_payload.get("hash") or "") != digest:
            raise _conflict("The source snapshot hash does not match its bars.")
        snapshot_id = canonical_snapshot_id(
            market=library_strategy.market,
            symbol=symbol,
            timeframe=library_strategy.timeframe,
            canonical_data_hash=digest,
        )
        snapshot = StrategyExperimentSnapshot(
            snapshot_id=snapshot_id,
            created_at=source_run.created_at,
            market=library_strategy.market,
            symbol=symbol,
            timeframe=library_strategy.timeframe,
            canonical_data_hash=digest,
            rows=rows,
            start_at=normalized_bars[0]["timestamp"],
            end_at=normalized_bars[-1]["timestamp"],
            bars=normalized_bars,
        )
        assumptions = _normalize_assumptions(payload.get("assumptions"))
        guardrails = _normalize_guardrails(
            payload.get("guardrails"),
            formal=library_strategy.policy is not None,
        )
        dimensions = _dimensions_from_payload(payload.get("dimensions"))
        candidates = expand_candidates(library_strategy, dimensions)
        train_end, validation_end = _split_boundaries(rows)
        walk_forward, windows = _normalize_walk_forward(payload.get("walkForward"), validation_end)
        evaluation_budget = 2 * len(candidates) + 2 * len(candidates) * len(windows) + 1
        if evaluation_budget > MAX_EVALUATIONS:
            raise _invalid("Strategy experiment evaluation budget exceeds 512 engine calls.")
        _validate_warmup_capacity(candidates, train_end, walk_forward)

        is_policy = library_strategy.policy is not None
        definition = {
            "baseStrategy": library_payload,
            "strategyRevision": strategy_revision,
            "sourceRunId": source_run_id,
            "snapshotId": snapshot_id,
            "canonicalDataHash": digest,
            "market": library_strategy.market,
            "symbol": symbol,
            "timeframe": library_strategy.timeframe,
            "assumptions": assumptions,
            "split": {"trainPct": 60, "validationPct": 20, "testPct": 20},
            "dimensions": [_dimension_to_payload(dimension) for dimension in _normalize_dimensions(library_strategy, dimensions)],
            "guardrails": guardrails,
            "walkForward": walk_forward,
            "evaluationBudget": evaluation_budget,
            "engineVersion": POLICY_ENGINE_VERSION if is_policy else ENGINE_VERSION,
            "resultSchemaVersion": POLICY_RESULT_SCHEMA_VERSION if is_policy else RESULT_SCHEMA_VERSION,
        }
        if is_policy:
            definition["evaluatorVersion"] = POLICY_EVALUATOR_VERSION
        try:
            snapshot = self.experiment_store.put_snapshot(snapshot)
        except ValueError as error:
            raise _conflict("The persisted experiment snapshot conflicts with the source snapshot.") from error
        return self._finish_definition(
            definition,
            snapshot=snapshot,
            strategy=library_strategy,
            candidates=candidates,
            train_end=train_end,
            validation_end=validation_end,
            windows=windows,
        )

    def _definition_from_sealed_source(
        self,
        payload: dict[str, Any],
        *,
        strategy: StrategyConfig,
        strategy_revision: str,
        source_run_id: str,
        source_run: Any,
        library_payload: dict[str, Any],
        launch_intent: Mapping[str, Any] | None = None,
    ) -> _ExperimentDefinition:
        source = self.sealed_bar_source
        snapshot_payload = source_run.data_snapshot
        sealed_payload = snapshot_payload.get("sealedDataset")
        if (
            source is None
            or snapshot_payload.get("hashVersion") != "aiqt-sealed-v1"
            or not isinstance(sealed_payload, dict)
            or "bars" in snapshot_payload
        ):
            raise StrategyExperimentError(
                status=409,
                error="sealed_dataset_required",
                detail="Version 2 formal experiments require a sealed dataset source.",
            )
        dataset_id = _required_string(sealed_payload.get("datasetId"))
        summary = source.get_summary(dataset_id)
        if summary is None:
            raise StrategyExperimentError(
                status=404,
                error="sealed_dataset_not_found",
                detail=f"Sealed dataset {dataset_id} was not found.",
            )
        expected_summary = _sealed_summary_payload(summary)
        if sealed_payload != expected_summary:
            raise _conflict("The source run sealed dataset summary does not match its source.")
        if (
            expected_summary.get("market") != strategy.market
            or expected_summary.get("symbol") != strategy.symbols[0]
            or expected_summary.get("timeframe") != strategy.timeframe
            or strategy.timeframe != "1m"
            or snapshot_payload.get("source") != expected_summary.get("source")
            or snapshot_payload.get("adjustmentMode")
            != expected_summary.get("adjustmentMode")
        ):
            raise _conflict("The sealed dataset context does not match the formal strategy.")
        total_rows = _exact_int(expected_summary.get("rows"))
        if total_rows is None or total_rows < MIN_FORMAL_SOURCE_BARS:
            raise _invalid("Formal experiments require at least 90 days of continuous 1m data.")
        try:
            pre_roll_rows, train_end, validation_end, score_start_at = (
                _formal_scoring_boundaries(expected_summary)
            )
        except ValueError as error:
            raise _conflict(
                "The sealed dataset does not match the frozen 90-day scoring window."
            ) from error
        if "preRollVersion" in snapshot_payload or "scoringWindow" in snapshot_payload:
            expected_source_scoring = formal_scoring_metadata(expected_summary)
            if {
                "preRollVersion": snapshot_payload.get("preRollVersion"),
                "scoringWindow": snapshot_payload.get("scoringWindow"),
            } != expected_source_scoring:
                raise _conflict(
                    "The source run formal scoring identity does not match its sealed dataset."
                )
        development_rows = validation_end
        if (
            source_run.data_rows != development_rows
            or _exact_int(source_run.data_quality.get("rows")) != development_rows
            or not bool(source_run.data_quality.get("isComplete"))
            or not bool(snapshot_payload.get("isComplete"))
            or _exact_int(snapshot_payload.get("rows")) != development_rows
            or snapshot_payload.get("hash") != expected_summary["developmentHash"]
            or source_run.data_quality.get("canonicalHash")
            != expected_summary["developmentHash"]
        ):
            raise _conflict("The source run does not match the sealed development partition.")
        assumptions = _normalize_assumptions(payload.get("assumptions"), formal=True)
        guardrails = _normalize_guardrails(payload.get("guardrails"), formal=True)
        dimensions = _dimensions_from_payload(payload.get("dimensions"))
        candidates = expand_candidates(strategy, dimensions)
        required_pre_roll = max(
            formal_strategy_required_pre_roll(candidate.strategy, score_start_at)
            for candidate in candidates
        )
        if pre_roll_rows < required_pre_roll:
            raise _invalid(
                "The sealed dataset does not include enough server-derived indicator pre-roll."
            )
        walk_forward, relative_windows = _normalize_walk_forward(
            payload.get("walkForward"),
            FORMAL_DEVELOPMENT_SCORING_BARS,
        )
        windows = tuple(
            (
                pre_roll_rows + start,
                pre_roll_rows + window_train_end,
                pre_roll_rows + window_validation_end,
            )
            for start, window_train_end, window_validation_end in relative_windows
        )
        if (
            walk_forward is None
            or len(windows) != 7
            or walk_forward["stepBars"] < walk_forward["validationBars"]
        ):
            raise _invalid(
                "Version 2 experiments require exactly seven non-overlapping rolling validation windows."
            )
        evaluation_budget = 2 * len(candidates) + 2 * len(candidates) * len(windows) + 1
        if evaluation_budget > MAX_EVALUATIONS:
            raise _invalid("Strategy experiment evaluation budget exceeds 512 engine calls.")
        _validate_warmup_capacity(candidates, FORMAL_TRAIN_SCORING_BARS, walk_forward)
        development_bars = source.read_development_bars(dataset_id)
        if len(development_bars) != development_rows:
            raise _conflict("The sealed development partition row count is invalid.")
        try:
            chunked, normalized_bars = _normalize_large_ohlcv_bars(
                development_bars,
                market=strategy.market,
                symbol=strategy.symbols[0],
                timeframe=strategy.timeframe,
            )
        except (TypeError, ValueError) as error:
            raise _conflict("The sealed development partition bars are invalid.") from error
        if (
            chunked["hash"] != expected_summary["developmentHash"]
            or chunked["start"] != expected_summary["start"]
            or chunked["endExclusive"] != expected_summary["developmentEndExclusive"]
        ):
            raise _conflict("The sealed development partition hash or range is invalid.")

        snapshot = StrategyExperimentSnapshot(
            snapshot_id=dataset_id,
            created_at=source_run.created_at,
            market=strategy.market,
            symbol=strategy.symbols[0],
            timeframe=strategy.timeframe,
            canonical_data_hash=str(expected_summary["datasetHash"]),
            rows=total_rows,
            start_at=str(expected_summary["start"]),
            end_at=str(expected_summary["endExclusive"]),
            bars=normalized_bars,
        )
        definition = {
            "baseStrategy": library_payload,
            "strategyRevision": strategy_revision,
            "sourceRunId": source_run_id,
            "snapshotId": dataset_id,
            "canonicalDataHash": expected_summary["datasetHash"],
            "developmentDataHash": expected_summary["developmentHash"],
            "sealedDataset": expected_summary,
            "market": strategy.market,
            "symbol": strategy.symbols[0],
            "timeframe": strategy.timeframe,
            "assumptions": assumptions,
            "costModel": {
                "feeBpsPerSide": 10,
                "slippageBpsPerSide": 10,
                "estimatedRoundTripBps": 40,
            },
            "scoringWindow": {
                "start": score_start_at.isoformat(),
                "endExclusive": expected_summary["endExclusive"],
                "rows": MIN_FORMAL_SOURCE_BARS,
                "preRollRows": pre_roll_rows,
            },
            "split": {"trainPct": 60, "validationPct": 20, "testPct": 20},
            "dimensions": [
                _dimension_to_payload(dimension)
                for dimension in _normalize_dimensions(strategy, dimensions)
            ],
            "guardrails": guardrails,
            "walkForward": walk_forward,
            "evaluationBudget": evaluation_budget,
            "engineVersion": POLICY_ENGINE_VERSION,
            "evaluatorVersion": POLICY_EVALUATOR_VERSION,
            "preRollVersion": FORMAL_PRE_ROLL_VERSION,
            "resultSchemaVersion": POLICY_RESULT_SCHEMA_VERSION,
        }
        if launch_intent is not None:
            normalized_launch_intent = _normalize_strategy_research_launch_intent(
                launch_intent,
                definition=definition,
            )
            definition["strategyResearchLaunch"] = normalized_launch_intent
        try:
            snapshot = self.experiment_store.put_snapshot(snapshot)
        except ValueError as error:
            raise _conflict("The persisted experiment snapshot conflicts with the sealed dataset.") from error
        return self._finish_definition(
            definition,
            snapshot=snapshot,
            strategy=strategy,
            candidates=candidates,
            train_end=train_end,
            validation_end=validation_end,
            windows=windows,
            score_start_index=pre_roll_rows,
            sealed_dataset_id=dataset_id,
            sealed_dataset_hash=str(expected_summary["datasetHash"]),
        )

    def _require_strategy_research_launch_evidence(
        self,
        experiment: StrategyExperimentRecord,
    ) -> None:
        self._require_strategy_research_launch_evidence_for_definition(
            experiment.definition,
            experiment_id=experiment.experiment_id,
        )

    def _require_strategy_research_launch_evidence_for_definition(
        self,
        definition: Mapping[str, Any],
        *,
        experiment_id: str,
    ) -> None:
        launch = definition.get("strategyResearchLaunch")
        if launch is None:
            return
        try:
            normalized = _normalize_strategy_research_launch_intent(
                launch,
                definition=definition,
            )
            if normalized["experimentId"] != experiment_id:
                raise ValueError("strategy_research_launch_experiment_mismatch")
            loader = self.launch_evidence_loader
            if not callable(loader):
                raise ValueError("strategy_research_launch_store_unavailable")
            record = loader(normalized["eventId"])
            metadata = getattr(record, "metadata", None)
            if (
                record is None
                or getattr(record, "event_id", None) != normalized["eventId"]
                or getattr(record, "event_type", None) != "strategy_research_launch"
                or getattr(record, "run_id", None) != definition.get("sourceRunId")
                or getattr(record, "stage", None) != "strategy_research"
                or getattr(record, "source", None)
                != "ai_strategy_research_orchestrator"
                or not isinstance(metadata, dict)
                or set(metadata)
                != {
                    "proposalId",
                    "experimentId",
                    "definitionIdentityHash",
                    "operator",
                    "confirmed",
                }
                or metadata.get("proposalId") != normalized["proposalId"]
                or metadata.get("experimentId") != experiment_id
                or metadata.get("definitionIdentityHash")
                != normalized["definitionIdentityHash"]
                or not isinstance(metadata.get("operator"), str)
                or not str(metadata["operator"]).strip()
                or metadata.get("confirmed") is not True
            ):
                raise ValueError("strategy_research_launch_evidence_mismatch")
        except (AttributeError, KeyError, TypeError, ValueError) as error:
            raise StrategyExperimentError(
                status=409,
                error="strategy_research_launch_evidence_invalid",
                detail=(
                    "The pending strategy research experiment does not have exact "
                    "protected launch evidence."
                ),
            ) from error

    def _definition_from_record(self, prior: StrategyExperimentDetail) -> _ExperimentDefinition:
        definition = cast(dict[str, Any], _canonical_copy(prior.experiment.definition))
        if canonical_sha256(definition) != prior.experiment.definition_hash:
            raise _conflict("Stored experiment definition hash is invalid.")
        try:
            strategy = strategy_config_from_payload(cast(dict[str, Any], definition["baseStrategy"]))
            dimensions = _dimensions_from_payload(definition["dimensions"])
            candidates = expand_candidates(strategy, dimensions)
            if strategy.policy is None:
                normalized_bars = normalize_snapshot_bars(prior.snapshot.bars)
                total_rows = len(normalized_bars)
                score_start_index = 0
                sealed_dataset_id = None
                sealed_dataset_hash = None
            else:
                stored_bars = _large_snapshot_records_to_ohlcv(
                    prior.snapshot.bars,
                    market=prior.snapshot.market,
                    symbol=prior.snapshot.symbol,
                    timeframe=prior.snapshot.timeframe,
                )
                chunked, normalized_bars = _normalize_large_ohlcv_bars(
                    stored_bars,
                    market=prior.snapshot.market,
                    symbol=prior.snapshot.symbol,
                    timeframe=prior.snapshot.timeframe,
                )
                total_rows = prior.snapshot.rows
                sealed_summary = cast(dict[str, Any], definition["sealedDataset"])
                sealed_dataset_id = str(sealed_summary["datasetId"])
                sealed_dataset_hash = str(sealed_summary["datasetHash"])
                (
                    score_start_index,
                    train_end,
                    validation_end,
                    score_start_at,
                ) = _formal_scoring_boundaries(sealed_summary)
                expected_scoring_window = {
                    "start": score_start_at.isoformat(),
                    "endExclusive": sealed_summary["endExclusive"],
                    "rows": MIN_FORMAL_SOURCE_BARS,
                    "preRollRows": score_start_index,
                }
                pre_roll_version = definition.get("preRollVersion")
                if pre_roll_version in (None, FORMAL_PRE_ROLL_VERSION_V1):
                    required_pre_roll = max(
                        _warmup_bars(candidate.strategy) for candidate in candidates
                    ) + _legacy_formal_alignment_rows(score_start_at)
                elif pre_roll_version == FORMAL_PRE_ROLL_VERSION:
                    required_pre_roll = max(
                        formal_strategy_required_pre_roll(
                            candidate.strategy,
                            score_start_at,
                        )
                        for candidate in candidates
                    )
                else:
                    raise ValueError("formal_pre_roll_version_invalid")
                if (
                    len(normalized_bars) != _exact_int(sealed_summary.get("developmentRows"))
                    or prior.snapshot.rows != _exact_int(sealed_summary.get("rows"))
                    or prior.snapshot.start_at != sealed_summary.get("start")
                    or prior.snapshot.end_at != sealed_summary.get("endExclusive")
                    or chunked["start"] != sealed_summary.get("start")
                    or chunked["endExclusive"]
                    != sealed_summary.get("developmentEndExclusive")
                    or chunked["hash"] != sealed_summary.get("developmentHash")
                    or definition.get("developmentDataHash")
                    != sealed_summary.get("developmentHash")
                    or validation_end != len(normalized_bars)
                    or definition.get("scoringWindow") != expected_scoring_window
                    or score_start_index < required_pre_roll
                ):
                    raise ValueError("sealed_development_snapshot_invalid")
        except (KeyError, TypeError, ValueError) as error:
            raise _conflict("Stored experiment definition is invalid.") from error
        if strategy.policy is None:
            supported_version = (
                definition.get("engineVersion") == ENGINE_VERSION
                and definition.get("resultSchemaVersion") == RESULT_SCHEMA_VERSION
                and "evaluatorVersion" not in definition
            )
        else:
            supported_version = (
                definition.get("engineVersion") == POLICY_ENGINE_VERSION
                and definition.get("evaluatorVersion") == POLICY_EVALUATOR_VERSION
                and definition.get("preRollVersion")
                in (None, FORMAL_PRE_ROLL_VERSION_V1, FORMAL_PRE_ROLL_VERSION)
                and definition.get("resultSchemaVersion") == POLICY_RESULT_SCHEMA_VERSION
            )
        if not supported_version:
            raise _conflict("Stored experiment definition version is unsupported.")
        if (
            strategy.revision != prior.experiment.strategy_revision
            or definition.get("strategyRevision") != prior.experiment.strategy_revision
            or definition.get("sourceRunId") != prior.experiment.source_run_id
            or definition.get("snapshotId") != prior.snapshot.snapshot_id
            or definition.get("canonicalDataHash") != prior.snapshot.canonical_data_hash
            or (
                strategy.policy is None
                and canonical_data_hash(normalized_bars) != prior.snapshot.canonical_data_hash
            )
            or (
                strategy.policy is None
                and prior.snapshot.rows != len(normalized_bars)
            )
        ):
            raise _conflict("Stored experiment definition and snapshot do not match.")
        if strategy.policy is None:
            train_end, validation_end = _split_boundaries(total_rows)
            walk_forward, windows = _normalize_walk_forward(
                definition.get("walkForward"), validation_end
            )
        else:
            walk_forward, relative_windows = _normalize_walk_forward(
                definition.get("walkForward"),
                FORMAL_DEVELOPMENT_SCORING_BARS,
            )
            windows = tuple(
                (
                    score_start_index + start,
                    score_start_index + window_train_end,
                    score_start_index + window_validation_end,
                )
                for start, window_train_end, window_validation_end in relative_windows
            )
        if strategy.policy is not None and (
            definition.get("costModel")
            != {
                "feeBpsPerSide": 10,
                "slippageBpsPerSide": 10,
                "estimatedRoundTripBps": 40,
            }
            or walk_forward is None
            or len(windows) != 7
            or walk_forward["stepBars"] < walk_forward["validationBars"]
        ):
            raise _conflict("Stored formal experiment policy is invalid.")
        evaluation_budget = 2 * len(candidates) + 2 * len(candidates) * len(windows) + 1
        if definition.get("evaluationBudget") != evaluation_budget or evaluation_budget > MAX_EVALUATIONS:
            raise _conflict("Stored experiment evaluation budget is invalid.")
        _normalize_assumptions(
            definition.get("assumptions"),
            formal=strategy.policy is not None,
        )
        _normalize_guardrails(definition.get("guardrails"), formal=strategy.policy is not None)
        _validate_warmup_capacity(
            candidates,
            FORMAL_TRAIN_SCORING_BARS if strategy.policy is not None else train_end,
            walk_forward,
        )
        finished = self._finish_definition(
            definition,
            snapshot=prior.snapshot,
            strategy=strategy,
            candidates=candidates,
            train_end=train_end,
            validation_end=validation_end,
            windows=windows,
            score_start_index=score_start_index,
            sealed_dataset_id=sealed_dataset_id,
            sealed_dataset_hash=sealed_dataset_hash,
        )
        if finished.holdout_key != prior.experiment.holdout_key:
            raise _conflict("Stored experiment holdout key is invalid.")
        return finished

    def _finish_definition(
        self,
        definition: dict[str, Any],
        *,
        snapshot: StrategyExperimentSnapshot,
        strategy: StrategyConfig,
        candidates: tuple[ExpandedCandidate, ...],
        train_end: int,
        validation_end: int,
        windows: tuple[tuple[int, int, int], ...],
        score_start_index: int = 0,
        sealed_dataset_id: str | None = None,
        sealed_dataset_hash: str | None = None,
    ) -> _ExperimentDefinition:
        canonical_definition = cast(dict[str, Any], _canonical_copy(definition))
        definition_hash = canonical_sha256(canonical_definition)
        holdout_key = canonical_sha256(
            {"snapshotId": snapshot.snapshot_id, "validationEndIndex": validation_end}
        )
        bars = (
            _large_snapshot_records_to_ohlcv(
                snapshot.bars,
                market=snapshot.market,
                symbol=snapshot.symbol,
                timeframe=snapshot.timeframe,
            )
            if sealed_dataset_id is not None
            else snapshot_bars_to_ohlcv(
                snapshot.bars,
                market=snapshot.market,
                symbol=snapshot.symbol,
                timeframe=snapshot.timeframe,
            )
        )
        return _ExperimentDefinition(
            definition=canonical_definition,
            definition_hash=definition_hash,
            holdout_key=holdout_key,
            snapshot=snapshot,
            strategy=strategy,
            candidates=candidates,
            bars=tuple(bars),
            train_end=train_end,
            validation_end=validation_end,
            walk_forward_windows=windows,
            score_start_index=score_start_index,
            sealed_dataset_id=sealed_dataset_id,
            sealed_dataset_hash=sealed_dataset_hash,
        )

    def _evaluate_candidates(
        self,
        definition: _ExperimentDefinition,
        *,
        experiment_id: str,
        deadline: float | None,
        development_checkpoint: Sequence[StrategyExperimentCandidateRecord] | None = None,
    ) -> tuple[list[StrategyExperimentCandidateRecord], str | None, str, bool]:
        guardrails = definition.definition["guardrails"]
        result_schema_version = int(definition.definition["resultSchemaVersion"])
        formal = result_schema_version == POLICY_RESULT_SCHEMA_VERSION
        if development_checkpoint is None:
            records = self._evaluate_development_candidates(
                definition,
                experiment_id=experiment_id,
                deadline=deadline,
                guardrails=guardrails,
                result_schema_version=result_schema_version,
                formal=formal,
            )
        else:
            if not formal:
                raise _conflict("Only formal experiments may resume development evidence.")
            records = _validate_development_checkpoint(
                definition,
                experiment_id=experiment_id,
                records=development_checkpoint,
                guardrails=guardrails,
            )
        ranked_indexes = [
            index
            for index, record in enumerate(records)
            if record.rank is not None
        ]
        ranked_indexes.sort(key=lambda index: int(records[index].rank or 0))
        if not ranked_indexes:
            reason = "no_validation_candidate" if formal else "no_eligible_candidate"
            return records, None, reason, False

        selected_index = ranked_indexes[0]
        selected = definition.candidates[
            next(
                index
                for index, candidate in enumerate(definition.candidates)
                if candidate.candidate_id == records[selected_index].candidate_id
            )
        ]
        warmup = _warmup_bars(selected.strategy)
        if formal and definition.sealed_dataset_id is not None:
            if development_checkpoint is None:
                pending = self.experiment_store.get(experiment_id)
                if pending is not None:
                    if (
                        pending.experiment.status != "pending"
                        or pending.candidates
                        or pending.experiment.completion_reason is not None
                    ):
                        raise _conflict("The formal experiment pending state is invalid.")
                    checkpoint = replace(
                        pending.experiment,
                        evaluation_count=self._evaluation_count,
                        selected_candidate_id=records[selected_index].candidate_id,
                        completion_reason="development_completed",
                    )
                    self.experiment_store.record_development_checkpoint(
                        checkpoint,
                        records,
                    )
            test_bars = self._claim_and_read_sealed_test(
                definition,
                experiment_id=experiment_id,
            )
            test_pre_roll = _formal_evaluation_pre_roll(selected.strategy, test_bars[0])
            evaluation_bars = [*definition.bars[-test_pre_roll:], *test_bars]
            test_evaluation_start = test_pre_roll
        else:
            try:
                self.experiment_store.claim_test_holdout(
                    snapshot_id=definition.snapshot.snapshot_id,
                    definition_hash=definition.definition_hash,
                    experiment_id=experiment_id,
                    consumed_at=datetime.now(timezone.utc),
                )
            except ValueError as error:
                if str(error) == "test_holdout_consumed":
                    raise StrategyExperimentError(
                        status=409,
                        error="test_holdout_consumed",
                        detail="The test holdout is already bound to a different experiment definition.",
                    ) from None
                raise
            evaluation_bars = list(definition.bars[definition.validation_end - warmup :])
            test_evaluation_start = warmup
        test = self._run_engine(
            selected.strategy,
            evaluation_bars,
            evaluation_start_index=test_evaluation_start,
            definition=definition,
            deadline=deadline,
        )
        test_metrics = metrics_to_payload(
            test.metrics,
            result_schema_version=result_schema_version,
        )
        if formal:
            test_gate = _formal_test_gate_evaluation(test_metrics, guardrails["test"])
            gate_evaluation = copy.deepcopy(records[selected_index].gate_evaluation)
            gate_evaluation["test"] = test_gate
            profitability_gate_passed = bool(test_gate["passed"])
            completion_reason = (
                "profitability_gate_passed" if profitability_gate_passed else "test_gate_failed"
            )
        else:
            gate_evaluation = records[selected_index].gate_evaluation
            profitability_gate_passed = False
            completion_reason = "selected"
        records[selected_index] = replace(
            records[selected_index],
            test_metrics=test_metrics,
            gate_evaluation=gate_evaluation,
        )
        return (
            records,
            records[selected_index].candidate_id,
            completion_reason,
            profitability_gate_passed,
        )

    def _evaluate_development_candidates(
        self,
        definition: _ExperimentDefinition,
        *,
        experiment_id: str,
        deadline: float | None,
        guardrails: Mapping[str, Any],
        result_schema_version: int,
        formal: bool,
    ) -> list[StrategyExperimentCandidateRecord]:
        records: list[StrategyExperimentCandidateRecord] = []
        for candidate in definition.candidates:
            warmup = _warmup_bars(candidate.strategy)
            train_evaluation_start = definition.score_start_index if formal else warmup
            validation_pre_roll = (
                _formal_evaluation_pre_roll(
                    candidate.strategy,
                    definition.bars[definition.train_end],
                )
                if formal
                else warmup
            )
            train = self._run_engine(
                candidate.strategy,
                list(definition.bars[: definition.train_end]),
                evaluation_start_index=train_evaluation_start,
                definition=definition,
                deadline=deadline,
            )
            validation = self._run_engine(
                candidate.strategy,
                list(
                    definition.bars[
                        definition.train_end - validation_pre_roll : definition.validation_end
                    ]
                ),
                evaluation_start_index=validation_pre_roll,
                definition=definition,
                deadline=deadline,
            )
            train_metrics = metrics_to_payload(
                train.metrics,
                result_schema_version=result_schema_version,
            )
            validation_metrics = metrics_to_payload(
                validation.metrics,
                result_schema_version=result_schema_version,
            )
            walk_forward = self._walk_forward(
                candidate.strategy,
                definition,
                deadline=deadline,
            )
            if formal:
                gate_evaluation = _formal_pretest_gate_evaluation(
                    train_metrics=train_metrics,
                    validation_metrics=validation_metrics,
                    walk_forward=walk_forward,
                    guardrails=guardrails,
                )
                eligible = bool(gate_evaluation["pretest"]["passed"])
            else:
                maximum_drawdown = guardrails["maximumDrawdownPct"]
                eligible = (
                    validation.metrics.trade_count >= guardrails["minimumTradeCount"]
                    and (
                        maximum_drawdown is None
                        or validation.metrics.max_drawdown_pct <= maximum_drawdown
                    )
                )
                gate_evaluation = {}
            records.append(
                StrategyExperimentCandidateRecord(
                    experiment_id=experiment_id,
                    candidate_id=candidate.candidate_id,
                    candidate_revision=candidate.strategy.revision,
                    parameters=candidate.parameters,
                    train_metrics=train_metrics,
                    validation_metrics=validation_metrics,
                    test_metrics=None,
                    walk_forward=walk_forward,
                    gate_evaluation=gate_evaluation,
                    eligible=eligible,
                    rank=None,
                )
            )

        if formal and guardrails["stability"]["requirePositiveAdjacentCandidates"]:
            records = _apply_adjacent_candidate_gate(
                records,
                definition.definition["dimensions"],
            )
        ranked_indexes = sorted(
            (index for index, record in enumerate(records) if record.eligible),
            key=lambda index: (
                -records[index].validation_metrics["totalReturnPct"],
                records[index].validation_metrics["maxDrawdownPct"],
                -records[index].validation_metrics["profitFactor"],
                records[index].candidate_id,
            ),
        )
        for rank, index in enumerate(ranked_indexes, start=1):
            records[index] = replace(records[index], rank=rank)
        return records

    def _claim_and_read_sealed_test(
        self,
        definition: _ExperimentDefinition,
        *,
        experiment_id: str,
    ) -> list[OHLCVBar]:
        source = self.sealed_bar_source
        dataset_id = definition.sealed_dataset_id
        dataset_hash = definition.sealed_dataset_hash
        if source is None or dataset_id is None or dataset_hash is None:
            raise StrategyExperimentError(
                status=409,
                error="sealed_dataset_unavailable",
                detail="The sealed dataset source is unavailable.",
            )
        try:
            # Reserve the canonical experiment holdout first. If the process
            # dies after this point, recovery sees the durable reservation and
            # fails closed without attempting another external claim or read.
            self.experiment_store.claim_test_holdout(
                snapshot_id=definition.snapshot.snapshot_id,
                definition_hash=definition.definition_hash,
                experiment_id=experiment_id,
                consumed_at=datetime.now(timezone.utc),
            )
            claim = source.claim_test_partition(
                dataset_id,
                claimant_id=experiment_id,
                expected_dataset_hash=dataset_hash,
            )
            claim_token = str(getattr(claim, "claim_token", ""))
            if not claim_token:
                raise ValueError("sealed_test_claim_invalid")
            bars = source.read_claimed_test_bars(dataset_id, claim_token=claim_token)
            _validate_claimed_test_bars(definition, bars)
            return bars
        except ValueError as error:
            if str(error) in {
                "sealed_test_partition_consumed",
                "test_holdout_consumed",
            }:
                raise StrategyExperimentError(
                    status=409,
                    error="test_holdout_consumed",
                    detail="The test holdout is already bound to a different experiment definition.",
                ) from None
            raise

    def _walk_forward(
        self,
        strategy: StrategyConfig,
        definition: _ExperimentDefinition,
        *,
        deadline: float | None,
    ) -> dict[str, Any]:
        windows: list[dict[str, Any]] = []
        validation_returns: list[float] = []
        validation_drawdowns: list[float] = []
        warmup = _warmup_bars(strategy)
        formal = definition.sealed_dataset_id is not None
        for index, (start, train_end, validation_end) in enumerate(definition.walk_forward_windows):
            train_pre_roll = (
                _formal_evaluation_pre_roll(strategy, definition.bars[start])
                if formal
                else warmup
            )
            validation_pre_roll = (
                _formal_evaluation_pre_roll(strategy, definition.bars[train_end])
                if formal
                else warmup
            )
            train = self._run_engine(
                strategy,
                list(
                    definition.bars[
                        start - train_pre_roll if formal else start : train_end
                    ]
                ),
                evaluation_start_index=train_pre_roll,
                definition=definition,
                deadline=deadline,
            )
            validation = self._run_engine(
                strategy,
                list(
                    definition.bars[
                        train_end - validation_pre_roll : validation_end
                    ]
                ),
                evaluation_start_index=validation_pre_roll,
                definition=definition,
                deadline=deadline,
            )
            result_schema_version = int(definition.definition["resultSchemaVersion"])
            train_metrics = metrics_to_payload(
                train.metrics,
                result_schema_version=result_schema_version,
            )
            validation_metrics = metrics_to_payload(
                validation.metrics,
                result_schema_version=result_schema_version,
            )
            validation_returns.append(float(validation_metrics["totalReturnPct"]))
            validation_drawdowns.append(float(validation_metrics["maxDrawdownPct"]))
            windows.append(
                {
                    "index": index,
                    "trainStartIndex": start,
                    "trainEndIndex": train_end,
                    "validationStartIndex": train_end,
                    "validationEndIndex": validation_end,
                    "trainMetrics": train_metrics,
                    "validationMetrics": validation_metrics,
                }
            )
        return {
            "windows": windows,
            "validationWindowCount": len(windows),
            "positiveReturnCount": sum(value > 0 for value in validation_returns),
            "medianReturnPct": statistics.median(validation_returns) if validation_returns else None,
            "worstDrawdownPct": max(validation_drawdowns) if validation_drawdowns else None,
        }

    def _run_engine(
        self,
        strategy: StrategyConfig,
        bars: list[Any],
        *,
        evaluation_start_index: int,
        definition: _ExperimentDefinition,
        deadline: float | None,
    ) -> BacktestRun:
        if deadline is not None and self.monotonic() >= deadline:
            raise _ExperimentTimeout()
        self._evaluation_count += 1
        assumptions = definition.definition["assumptions"]
        return BacktestEngine(
            initial_cash=assumptions["initialCash"],
            fee_rate=assumptions["feeBps"] / 10_000,
            slippage_rate=assumptions["slippageBps"] / 10_000,
        ).run(strategy, bars, evaluation_start_index=evaluation_start_index)

    def _record(
        self,
        definition: _ExperimentDefinition,
        *,
        experiment_id: str,
        created_at: datetime,
        status: Literal["pending", "completed", "failed"],
        selected_candidate_id: str | None = None,
        completion_reason: str | None = None,
        result_hash: str | None = None,
        profitability_gate_passed: bool = False,
        error_code: str | None = None,
        error_detail: str | None = None,
    ) -> StrategyExperimentRecord:
        return StrategyExperimentRecord(
            experiment_id=experiment_id,
            created_at=created_at,
            status=status,
            definition_hash=definition.definition_hash,
            holdout_key=definition.holdout_key,
            strategy_revision=definition.strategy.revision,
            source_run_id=str(definition.definition["sourceRunId"]),
            snapshot_id=definition.snapshot.snapshot_id,
            market=definition.snapshot.market,
            symbol=definition.snapshot.symbol,
            timeframe=definition.snapshot.timeframe,
            definition=definition.definition,
            evaluation_count=self._evaluation_count,
            selected_candidate_id=selected_candidate_id,
            completion_reason=completion_reason,
            result_hash=result_hash,
            profitability_gate_passed=profitability_gate_passed,
            error_code=error_code,
            error_detail=error_detail,
        )

    def _persist_failure(
        self,
        definition: _ExperimentDefinition,
        *,
        experiment_id: str,
        created_at: datetime,
        error_code: str,
        detail: str,
    ) -> None:
        failed = self._record(
            definition,
            experiment_id=experiment_id,
            created_at=created_at,
            status="failed",
            error_code=error_code,
            error_detail=detail,
        )
        try:
            self.experiment_store.record_failed(failed)
        except Exception:
            pass


def _validate_development_checkpoint(
    definition: _ExperimentDefinition,
    *,
    experiment_id: str,
    records: Sequence[StrategyExperimentCandidateRecord],
    guardrails: Mapping[str, Any],
) -> list[StrategyExperimentCandidateRecord]:
    expected_candidates = {
        candidate.candidate_id: candidate for candidate in definition.candidates
    }
    stored = {record.candidate_id: record for record in records}
    if len(stored) != len(records) or set(stored) != set(expected_candidates):
        raise _conflict("The development checkpoint candidate identity is invalid.")
    ordered: list[StrategyExperimentCandidateRecord] = []
    try:
        for candidate in definition.candidates:
            record = stored[candidate.candidate_id]
            if (
                record.experiment_id != experiment_id
                or record.candidate_revision != candidate.strategy.revision
                or record.parameters != candidate.parameters
                or record.test_metrics is not None
                or "test" in record.gate_evaluation
            ):
                raise ValueError("strategy_experiment_development_checkpoint_invalid")
            gate_evaluation = _formal_pretest_gate_evaluation(
                train_metrics=record.train_metrics,
                validation_metrics=record.validation_metrics,
                walk_forward=record.walk_forward,
                guardrails=guardrails,
            )
            ordered.append(
                replace(
                    record,
                    gate_evaluation=gate_evaluation,
                    eligible=bool(gate_evaluation["pretest"]["passed"]),
                    rank=None,
                )
            )
        if guardrails["stability"]["requirePositiveAdjacentCandidates"]:
            ordered = _apply_adjacent_candidate_gate(
                ordered,
                definition.definition["dimensions"],
            )
        ranked_indexes = sorted(
            (index for index, record in enumerate(ordered) if record.eligible),
            key=lambda index: (
                -ordered[index].validation_metrics["totalReturnPct"],
                ordered[index].validation_metrics["maxDrawdownPct"],
                -ordered[index].validation_metrics["profitFactor"],
                ordered[index].candidate_id,
            ),
        )
        for rank, index in enumerate(ranked_indexes, start=1):
            ordered[index] = replace(ordered[index], rank=rank)
    except (KeyError, TypeError, ValueError) as error:
        raise _conflict("The development checkpoint evidence is invalid.") from error

    if any(
        stored[record.candidate_id].eligible != record.eligible
        or stored[record.candidate_id].rank != record.rank
        or stored[record.candidate_id].gate_evaluation != record.gate_evaluation
        for record in ordered
    ):
        raise _conflict("The development checkpoint ranking evidence is invalid.")
    return [stored[record.candidate_id] for record in ordered]


def metrics_to_payload(
    metrics: BacktestMetrics,
    *,
    result_schema_version: int = RESULT_SCHEMA_VERSION,
) -> dict[str, int | float | bool]:
    payload: dict[str, int | float | bool] = {
        "totalReturnPct": metrics.total_return_pct,
        "annualReturnPct": metrics.annual_return_pct,
        "maxDrawdownPct": metrics.max_drawdown_pct,
        "winRatePct": metrics.win_rate_pct,
        "profitFactor": metrics.profit_factor,
        "tradeCount": metrics.trade_count,
    }
    if result_schema_version >= POLICY_RESULT_SCHEMA_VERSION:
        payload["roundTripCount"] = metrics.round_trip_count
        payload["profitFactorInfinite"] = bool(
            metrics.round_trip_count > 0
            and metrics.win_rate_pct == 100
            and metrics.total_return_pct > 0
        )
    return payload


def strategy_experiment_detail_to_payload(detail: StrategyExperimentDetail) -> dict[str, Any]:
    payload = _record_to_payload(detail.experiment)
    payload["holdoutStatus"] = (
        "unconsumed"
        if detail.snapshot.test_definition_hash is None
        else "consumed"
        if detail.snapshot.test_definition_hash == detail.experiment.definition_hash
        else "consumed_by_other_definition"
    )
    snapshot_payload = {
        "snapshotId": detail.snapshot.snapshot_id,
        "createdAt": detail.snapshot.created_at.isoformat(),
        "market": detail.snapshot.market,
        "symbol": detail.snapshot.symbol,
        "timeframe": detail.snapshot.timeframe,
        "canonicalDataHash": detail.snapshot.canonical_data_hash,
        "rows": detail.snapshot.rows,
        "startAt": detail.snapshot.start_at,
        "endAt": detail.snapshot.end_at,
        "testDefinitionHash": detail.snapshot.test_definition_hash,
        "testOwnerExperimentId": detail.snapshot.test_owner_experiment_id,
        "testConsumedAt": (
            detail.snapshot.test_consumed_at.isoformat() if detail.snapshot.test_consumed_at else None
        ),
    }
    if int(detail.experiment.definition.get("resultSchemaVersion") or 1) >= POLICY_RESULT_SCHEMA_VERSION:
        snapshot_payload["sealedDataset"] = detail.experiment.definition.get("sealedDataset")
    else:
        snapshot_payload["bars"] = detail.snapshot.bars
    payload["snapshot"] = snapshot_payload
    payload["candidates"] = [
        {
            "candidateId": candidate.candidate_id,
            "candidateRevision": candidate.candidate_revision,
            "parameters": candidate.parameters,
            "trainMetrics": candidate.train_metrics,
            "validationMetrics": candidate.validation_metrics,
            "testMetrics": candidate.test_metrics,
            "walkForward": candidate.walk_forward,
            "gateEvaluation": candidate.gate_evaluation,
            "eligible": candidate.eligible,
            "rank": candidate.rank,
        }
        for candidate in detail.candidates
    ]
    return payload


def strategy_experiment_records_to_payload(
    records: list[StrategyExperimentRecord],
) -> list[dict[str, Any]]:
    return [_record_to_payload(record) for record in records]


def _record_to_payload(record: StrategyExperimentRecord) -> dict[str, Any]:
    strategy_lineage_key = build_strategy_lineage_key_from_parts(
        market=record.market,
        symbol=record.symbol,
        timeframe=record.timeframe,
        strategy=record.definition.get("baseStrategy"),
    )
    return {
        "experimentId": record.experiment_id,
        "createdAt": record.created_at.isoformat(),
        "status": record.status,
        "definitionHash": record.definition_hash,
        "holdoutKey": record.holdout_key,
        "strategyLineageKey": strategy_lineage_key,
        "strategyRevision": record.strategy_revision,
        "sourceRunId": record.source_run_id,
        "snapshotId": record.snapshot_id,
        "market": record.market,
        "symbol": record.symbol,
        "timeframe": record.timeframe,
        "definition": record.definition,
        "evaluationCount": record.evaluation_count,
        "selectedCandidateId": record.selected_candidate_id,
        "completionReason": record.completion_reason,
        "resultHash": record.result_hash,
        "profitabilityGatePassed": record.profitability_gate_passed,
        "profitabilityStatus": (
            "formal_gate_passed"
            if record.profitability_gate_passed
            else "not_admissible"
        ),
        "promotion": (
            {
                "freshSourceRunId": record.promotion_run_id,
                "strategyRevision": record.promoted_strategy_revision,
                "lineageHash": record.promotion_lineage_hash,
                "promotedAt": record.promoted_at.isoformat() if record.promoted_at else None,
                "operator": record.promotion_operator,
                "profitabilityStatus": "formal_gate_passed",
                "paperOnly": True,
                "bindingBlocked": False,
            }
            if record.promotion_lineage_hash
            else None
        ),
        "errorCode": record.error_code,
        "errorDetail": record.error_detail,
    }


def _normalize_dimensions(
    strategy: StrategyConfig,
    dimensions: Sequence[ParameterDimension | PolicyParameterDimension],
) -> tuple[ParameterDimension | PolicyParameterDimension, ...]:
    if not isinstance(dimensions, (list, tuple)) or not dimensions:
        raise _invalid("At least one parameter dimension is required.")
    if strategy.policy is not None:
        return _normalize_policy_dimensions(strategy, dimensions)
    normalized: list[ParameterDimension] = []
    targets: set[tuple[str, int, str]] = set()
    for dimension in dimensions:
        if not isinstance(dimension, ParameterDimension):
            raise _invalid("Parameter dimensions are invalid.")
        if not isinstance(dimension.side, str) or dimension.side not in {"entry", "exit"}:
            raise _invalid("Parameter dimension side is invalid.")
        if (
            isinstance(dimension.condition_index, bool)
            or not isinstance(dimension.condition_index, int)
            or dimension.condition_index < 0
        ):
            raise _invalid("Parameter dimension condition index is invalid.")
        conditions = strategy.entry_conditions if dimension.side == "entry" else strategy.exit_conditions
        if dimension.condition_index >= len(conditions):
            raise _invalid("Parameter dimension condition index is invalid.")
        condition = conditions[dimension.condition_index]
        if (
            not isinstance(dimension.parameter, str)
            or dimension.parameter not in _SUPPORTED_PARAMETERS.get(condition.kind, set())
        ):
            raise _invalid("Parameter dimension is not supported by its condition.")
        if not isinstance(dimension.values, (list, tuple)) or not dimension.values:
            raise _invalid("Parameter dimension values are required.")
        values = tuple(sorted({_parameter_value(dimension.parameter, value) for value in dimension.values}))
        target = (dimension.side, dimension.condition_index, dimension.parameter)
        if target in targets:
            raise _invalid("Parameter dimensions cannot target the same condition parameter twice.")
        targets.add(target)
        normalized.append(
            ParameterDimension(
                side=dimension.side,
                condition_index=dimension.condition_index,
                parameter=dimension.parameter,
                values=values,
            )
        )
    return tuple(sorted(normalized, key=lambda value: (value.side, value.condition_index, value.parameter)))


def _normalize_policy_dimensions(
    strategy: StrategyConfig,
    dimensions: Sequence[ParameterDimension | PolicyParameterDimension],
) -> tuple[PolicyParameterDimension, ...]:
    normalized: list[PolicyParameterDimension] = []
    targets: set[str] = set()
    supported_paths = _SUPPORTED_POLICY_PATHS_BY_KIND.get(strategy.policy.kind, frozenset())
    for dimension in dimensions:
        if not isinstance(dimension, PolicyParameterDimension):
            raise _invalid("Version 2 strategies require policy parameter dimensions.")
        kind = _SUPPORTED_POLICY_PATHS.get(dimension.policy_path)
        if (
            kind is None
            or dimension.policy_path not in supported_paths
            or dimension.policy_path in targets
        ):
            raise _invalid("Policy parameter dimension is unsupported or duplicated.")
        if not dimension.values:
            raise _invalid("Policy parameter dimension values are required.")
        values = tuple(
            sorted({_policy_parameter_value(kind, value) for value in dimension.values})
        )
        targets.add(dimension.policy_path)
        normalized.append(
            PolicyParameterDimension(policy_path=dimension.policy_path, values=values)
        )
    return tuple(sorted(normalized, key=lambda value: value.policy_path))


def _dimensions_from_payload(
    value: Any,
) -> tuple[ParameterDimension | PolicyParameterDimension, ...]:
    if not isinstance(value, list) or not value:
        raise _invalid("At least one parameter dimension is required.")
    dimensions: list[ParameterDimension | PolicyParameterDimension] = []
    for item in value:
        if isinstance(item, dict) and set(item) == {"policyPath", "values"}:
            values = item.get("values")
            if not isinstance(values, list):
                raise _invalid("Policy parameter dimension values are invalid.")
            dimensions.append(
                PolicyParameterDimension(
                    policy_path=str(item.get("policyPath") or ""),
                    values=tuple(values),
                )
            )
            continue
        if not isinstance(item, dict) or set(item) != {
            "conditionSide",
            "conditionIndex",
            "parameter",
            "values",
        }:
            raise _invalid("Parameter dimension fields are invalid.")
        values = item.get("values")
        if not isinstance(values, list):
            raise _invalid("Parameter dimension values are invalid.")
        dimensions.append(
            ParameterDimension(
                side=cast(Any, item.get("conditionSide")),
                condition_index=cast(Any, item.get("conditionIndex")),
                parameter=cast(Any, item.get("parameter")),
                values=tuple(values),
            )
        )
    return tuple(dimensions)


def _dimension_to_payload(
    dimension: ParameterDimension | PolicyParameterDimension,
) -> dict[str, Any]:
    if isinstance(dimension, PolicyParameterDimension):
        return {"policyPath": dimension.policy_path, "values": list(dimension.values)}
    return {
        "conditionSide": dimension.side,
        "conditionIndex": dimension.condition_index,
        "parameter": dimension.parameter,
        "values": list(dimension.values),
    }


def _parameter_value(parameter: str, value: Any) -> int | float:
    number = _finite_number(value, "Parameter dimension values must be finite numbers.")
    if parameter == "window":
        if not number.is_integer() or not 1 <= number <= 250:
            raise _invalid("Window values must be integers from 1 through 250.")
        return int(number)
    if parameter == "threshold":
        if not 0 <= number <= 100:
            raise _invalid("Threshold values must be between 0 and 100.")
        return _canonical_number(number)
    raise _invalid("Parameter dimension is unsupported.")


def _policy_parameter_value(kind: str, value: Any) -> int | float:
    number = _finite_number(value, "Policy parameter values must be finite numbers.")
    if kind in {"window", "bars", "slope", "cooldown"}:
        minimum = 0 if kind == "cooldown" else 1 if kind in {"bars", "slope"} else 2
        maximum = 10_000 if kind in {"bars", "cooldown"} else 500 if kind == "window" else 50
        if not number.is_integer() or not minimum <= number <= maximum:
            raise _invalid("Policy integer parameter is outside supported bounds.")
        return int(number)
    if kind == "multiple" and 0 < number <= 20:
        return _canonical_number(number)
    if kind == "signed_threshold" and -100 <= number <= 100:
        return _canonical_number(number)
    raise _invalid("Policy parameter is outside supported bounds.")


def _normalize_assumptions(
    value: Any,
    *,
    formal: bool = False,
) -> dict[str, int | float]:
    if not isinstance(value, dict) or set(value) != {"initialCash", "feeBps", "slippageBps"}:
        raise _invalid("Backtest assumptions are invalid.")
    initial_cash = _finite_number(value.get("initialCash"), "Initial cash must be finite and positive.")
    fee_bps = _finite_number(value.get("feeBps"), "Fee basis points must be finite.")
    slippage_bps = _finite_number(value.get("slippageBps"), "Slippage basis points must be finite.")
    if initial_cash <= 0 or not 0 <= fee_bps <= 1_000 or not 0 <= slippage_bps <= 1_000:
        raise _invalid("Backtest assumptions are outside supported bounds.")
    normalized = {
        "initialCash": _canonical_number(initial_cash),
        "feeBps": _canonical_number(fee_bps),
        "slippageBps": _canonical_number(slippage_bps),
    }
    if formal and normalized != FORMAL_BACKTEST_ASSUMPTIONS:
        raise _invalid("Version 2 assumptions must match the frozen 10 USDT and 10 bps policy.")
    return normalized


def _normalize_guardrails(
    value: Any,
    *,
    formal: bool = False,
) -> dict[str, Any]:
    if formal:
        return _normalize_formal_guardrails(value)
    if not isinstance(value, dict) or set(value) != {"minimumTradeCount", "maximumDrawdownPct"}:
        raise _invalid("Strategy experiment guardrails are invalid.")
    minimum = value.get("minimumTradeCount")
    if isinstance(minimum, bool) or not isinstance(minimum, int) or minimum < 0:
        raise _invalid("Minimum trade count must be a non-negative integer.")
    maximum = value.get("maximumDrawdownPct")
    if maximum is not None:
        maximum_number = _finite_number(maximum, "Maximum drawdown must be finite.")
        if not 0 <= maximum_number <= 100:
            raise _invalid("Maximum drawdown must be between 0 and 100.")
        maximum = _canonical_number(maximum_number)
    return {"minimumTradeCount": minimum, "maximumDrawdownPct": maximum}


def _normalize_formal_guardrails(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != {
        "development",
        "validation",
        "test",
        "rolling",
        "stability",
    }:
        raise _invalid("Strategy experiment guardrails are invalid.")
    development = value.get("development")
    validation = value.get("validation")
    test = value.get("test")
    rolling = value.get("rolling")
    stability = value.get("stability")
    if not isinstance(development, dict) or set(development) != {"minimumRoundTripCount"}:
        raise _invalid("Development profitability guardrails are invalid.")
    if not isinstance(validation, dict) or set(validation) != {
        "requirePositiveReturn",
        "minimumProfitFactor",
        "maximumDrawdownPct",
        "minimumRoundTripCount",
    }:
        raise _invalid("Validation profitability guardrails are invalid.")
    if not isinstance(test, dict) or set(test) != {
        "requirePositiveReturn",
        "minimumProfitFactor",
        "maximumDrawdownPct",
        "minimumRoundTripCount",
    }:
        raise _invalid("Test profitability guardrails are invalid.")
    if not isinstance(rolling, dict) or set(rolling) != {
        "requiredWindowCount",
        "minimumPositiveWindowCount",
    }:
        raise _invalid("Rolling profitability guardrails are invalid.")
    if not isinstance(stability, dict) or set(stability) != {
        "requirePositiveAdjacentCandidates"
    }:
        raise _invalid("Stability profitability guardrails are invalid.")

    development_round_trips = _non_negative_int(
        development.get("minimumRoundTripCount"),
        "Development round-trip count must be a non-negative integer.",
    )
    validation_round_trips = _non_negative_int(
        validation.get("minimumRoundTripCount"),
        "Validation round-trip count must be a non-negative integer.",
    )
    test_round_trips = _non_negative_int(
        test.get("minimumRoundTripCount"),
        "Test round-trip count must be a non-negative integer.",
    )
    validation_positive = _required_bool(
        validation.get("requirePositiveReturn"),
        "Validation positive-return guardrail must be boolean.",
    )
    test_positive = _required_bool(
        test.get("requirePositiveReturn"),
        "Test positive-return guardrail must be boolean.",
    )
    adjacent_positive = _required_bool(
        stability.get("requirePositiveAdjacentCandidates"),
        "Adjacent-candidate guardrail must be boolean.",
    )
    validation_profit_factor = _bounded_number(
        validation.get("minimumProfitFactor"),
        minimum=0,
        maximum=1_000,
        detail="Validation profit factor is outside supported bounds.",
    )
    test_profit_factor = _bounded_number(
        test.get("minimumProfitFactor"),
        minimum=0,
        maximum=1_000,
        detail="Test profit factor is outside supported bounds.",
    )
    validation_drawdown = _bounded_number(
        validation.get("maximumDrawdownPct"),
        minimum=0,
        maximum=100,
        detail="Validation drawdown is outside supported bounds.",
    )
    test_drawdown = _bounded_number(
        test.get("maximumDrawdownPct"),
        minimum=0,
        maximum=100,
        detail="Test drawdown is outside supported bounds.",
    )
    required_window_count = _non_negative_int(
        rolling.get("requiredWindowCount"),
        "Rolling required window count must be a non-negative integer.",
    )
    minimum_positive_windows = _non_negative_int(
        rolling.get("minimumPositiveWindowCount"),
        "Rolling positive window count must be a non-negative integer.",
    )
    normalized = {
        "development": {"minimumRoundTripCount": development_round_trips},
        "validation": {
            "requirePositiveReturn": validation_positive,
            "minimumProfitFactor": validation_profit_factor,
            "maximumDrawdownPct": validation_drawdown,
            "minimumRoundTripCount": validation_round_trips,
        },
        "test": {
            "requirePositiveReturn": test_positive,
            "minimumProfitFactor": test_profit_factor,
            "maximumDrawdownPct": test_drawdown,
            "minimumRoundTripCount": test_round_trips,
        },
        "rolling": {
            "requiredWindowCount": required_window_count,
            "minimumPositiveWindowCount": minimum_positive_windows,
        },
        "stability": {"requirePositiveAdjacentCandidates": adjacent_positive},
    }
    if normalized != FORMAL_PROFITABILITY_GUARDRAILS:
        raise _invalid("Version 2 profitability guardrails must match the frozen formal policy.")
    return normalized


def _normalize_walk_forward(
    value: Any,
    validation_end: int,
) -> tuple[dict[str, int] | None, tuple[tuple[int, int, int], ...]]:
    if value is None:
        return None, ()
    if not isinstance(value, dict) or set(value) != {"trainBars", "validationBars", "stepBars"}:
        raise _invalid("Walk-forward settings are invalid.")
    settings: dict[str, int] = {}
    for key in ("trainBars", "validationBars", "stepBars"):
        item = value.get(key)
        if isinstance(item, bool) or not isinstance(item, int) or item <= 0:
            raise _invalid("Walk-forward bar counts must be positive integers.")
        settings[key] = item
    windows = tuple(
        (start, start + settings["trainBars"], start + settings["trainBars"] + settings["validationBars"])
        for start in range(0, validation_end, settings["stepBars"])
        if start + settings["trainBars"] + settings["validationBars"] <= validation_end
    )
    if not windows:
        raise _invalid("Walk-forward settings do not produce a complete window.")
    if len(windows) > MAX_WALK_FORWARD_WINDOWS:
        raise _invalid("Strategy experiments support at most 12 walk-forward windows.")
    return settings, windows


def _split_boundaries(rows: int) -> tuple[int, int]:
    train_end = math.floor(rows * 0.60)
    validation_end = math.floor(rows * 0.80)
    if train_end <= 0 or validation_end <= train_end or validation_end >= rows:
        raise _invalid("The fixed 60/20/20 split requires non-empty partitions.")
    return train_end, validation_end


def _formal_scoring_boundaries(
    sealed_summary: dict[str, Any],
) -> tuple[int, int, int, datetime]:
    total_rows = _exact_int(sealed_summary.get("rows"))
    development_rows = _exact_int(sealed_summary.get("developmentRows"))
    withheld_rows = _exact_int(sealed_summary.get("withheldRows"))
    if (
        total_rows is None
        or development_rows is None
        or withheld_rows is None
        or total_rows < MIN_FORMAL_SOURCE_BARS
    ):
        raise ValueError("formal_scoring_rows_invalid")
    try:
        start_at = datetime.fromisoformat(str(sealed_summary["start"]))
        development_end_at = datetime.fromisoformat(
            str(sealed_summary["developmentEndExclusive"])
        )
        end_at = datetime.fromisoformat(str(sealed_summary["endExclusive"]))
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError("formal_scoring_range_invalid") from error
    if any(value.tzinfo is None or value.utcoffset() is None for value in (start_at, development_end_at, end_at)):
        raise ValueError("formal_scoring_range_invalid")
    start_at = start_at.astimezone(timezone.utc)
    development_end_at = development_end_at.astimezone(timezone.utc)
    end_at = end_at.astimezone(timezone.utc)
    if any(value.second or value.microsecond for value in (start_at, development_end_at, end_at)):
        raise ValueError("formal_scoring_range_invalid")

    pre_roll_rows = total_rows - MIN_FORMAL_SOURCE_BARS
    score_start_at = end_at - timedelta(minutes=MIN_FORMAL_SOURCE_BARS)
    train_end = pre_roll_rows + FORMAL_TRAIN_SCORING_BARS
    validation_end = pre_roll_rows + FORMAL_DEVELOPMENT_SCORING_BARS
    if (
        start_at + timedelta(minutes=total_rows) != end_at
        or development_end_at
        != score_start_at + timedelta(minutes=FORMAL_DEVELOPMENT_SCORING_BARS)
        or development_rows != validation_end
        or withheld_rows != FORMAL_TEST_SCORING_BARS
    ):
        raise ValueError("formal_scoring_partition_invalid")
    return pre_roll_rows, train_end, validation_end, score_start_at


def formal_scoring_metadata(sealed_summary: Any) -> dict[str, Any]:
    payload = (
        sealed_summary.to_payload()
        if callable(getattr(sealed_summary, "to_payload", None))
        else sealed_summary
    )
    if not isinstance(payload, dict):
        raise ValueError("formal_scoring_summary_invalid")
    pre_roll_rows, _train_end, _validation_end, score_start_at = (
        _formal_scoring_boundaries(payload)
    )
    return {
        "preRollVersion": FORMAL_PRE_ROLL_VERSION,
        "scoringWindow": {
            "start": score_start_at.isoformat(),
            "endExclusive": payload["endExclusive"],
            "rows": MIN_FORMAL_SOURCE_BARS,
            "preRollRows": pre_roll_rows,
        },
    }


def formal_source_backtest_facts(
    strategy: StrategyConfig,
    bars: list[OHLCVBar],
    *,
    evaluation_start_index: int,
) -> dict[str, Any]:
    engine = BacktestEngine(
        initial_cash=float(FORMAL_BACKTEST_ASSUMPTIONS["initialCash"]),
        fee_rate=float(FORMAL_BACKTEST_ASSUMPTIONS["feeBps"]) / 10_000,
        slippage_rate=float(FORMAL_BACKTEST_ASSUMPTIONS["slippageBps"]) / 10_000,
    )
    replay = engine.run(
        strategy,
        bars,
        evaluation_start_index=evaluation_start_index,
    )
    return {
        "metrics": asdict(replay.metrics),
        "trades": [
            _backtest_trade_replay_payload(row)
            for row in _backtest_trade_replay_rows(
                replay,
                initial_cash=engine.initial_cash,
            )
        ],
        "equity": [asdict(row) for row in _backtest_equity_curve_rows(replay)],
    }


def _legacy_formal_alignment_rows(value: datetime) -> int:
    normalized = value.astimezone(timezone.utc)
    if normalized.second or normalized.microsecond:
        raise ValueError("formal_scoring_range_invalid")
    return normalized.minute


def _formal_policy_completion_minutes(strategy: StrategyConfig) -> int:
    policy = strategy.policy
    if policy is None:
        return 1
    timeframes = [policy.decision_timeframe]
    regime = getattr(policy, "regime", None)
    if regime is not None:
        timeframes.append(regime.timeframe)
    intervals: list[int] = []
    for timeframe in timeframes:
        if timeframe.endswith("m"):
            interval = int(timeframe[:-1])
        elif timeframe.endswith("h"):
            interval = int(timeframe[:-1]) * 60
        else:
            raise ValueError("formal_policy_timeframe_invalid")
        if interval <= 0:
            raise ValueError("formal_policy_timeframe_invalid")
        intervals.append(interval)
    return max(intervals)


def formal_strategy_required_pre_roll(
    strategy: StrategyConfig,
    boundary: datetime | None = None,
) -> int:
    """Return versioned policy warmup plus UTC completion alignment rows."""

    completion_minutes = _formal_policy_completion_minutes(strategy)
    if boundary is None:
        alignment_rows = completion_minutes - 1
    else:
        if boundary.tzinfo is None or boundary.utcoffset() is None:
            raise ValueError("formal_scoring_range_invalid")
        normalized = boundary.astimezone(timezone.utc)
        if normalized.second or normalized.microsecond:
            raise ValueError("formal_scoring_range_invalid")
        epoch_minutes = int(normalized.timestamp()) // 60
        alignment_rows = epoch_minutes % completion_minutes
    return _warmup_bars(strategy) + alignment_rows


def _formal_evaluation_pre_roll(strategy: StrategyConfig, boundary: Any) -> int:
    timestamp = getattr(boundary, "timestamp", None)
    if not isinstance(timestamp, datetime) or timestamp.tzinfo is None or timestamp.utcoffset() is None:
        raise ValueError("formal_evaluation_boundary_invalid")
    return formal_strategy_required_pre_roll(strategy, timestamp)


def _validate_warmup_capacity(
    candidates: tuple[ExpandedCandidate, ...],
    train_end: int,
    walk_forward: dict[str, int] | None,
) -> None:
    largest_warmup = max(_warmup_bars(candidate.strategy) for candidate in candidates)
    if train_end <= largest_warmup:
        raise _invalid("Training data is too short for the candidate indicator warm-up.")
    if walk_forward is not None and walk_forward["trainBars"] <= largest_warmup:
        raise _invalid("Walk-forward training data is too short for indicator warm-up.")


def _warmup_bars(strategy: StrategyConfig) -> int:
    if strategy.policy is not None:
        return strategy_required_bars(strategy)
    windows = [
        int(condition.params["window"])
        for condition in (*strategy.entry_conditions, *strategy.exit_conditions)
        if "window" in condition.params
    ]
    return max(windows, default=0) + 1


def _formal_pretest_gate_evaluation(
    *,
    train_metrics: dict[str, Any],
    validation_metrics: dict[str, Any],
    walk_forward: dict[str, Any],
    guardrails: dict[str, Any],
) -> dict[str, Any]:
    development_actual = int(train_metrics["roundTripCount"]) + int(
        validation_metrics["roundTripCount"]
    )
    development_minimum = int(guardrails["development"]["minimumRoundTripCount"])
    development_passed = development_actual >= development_minimum

    validation_rules = guardrails["validation"]
    validation_failures: list[str] = []
    if validation_rules["requirePositiveReturn"] and float(
        validation_metrics["totalReturnPct"]
    ) <= 0:
        validation_failures.append("non_positive_return")
    if not _profit_factor_passes(
        validation_metrics,
        float(validation_rules["minimumProfitFactor"]),
    ):
        validation_failures.append("profit_factor_below_minimum")
    if float(validation_metrics["maxDrawdownPct"]) > float(
        validation_rules["maximumDrawdownPct"]
    ):
        validation_failures.append("drawdown_above_maximum")
    if int(validation_metrics["roundTripCount"]) < int(
        validation_rules["minimumRoundTripCount"]
    ):
        validation_failures.append("round_trip_count_below_minimum")
    validation_passed = not validation_failures

    window_count = int(walk_forward["validationWindowCount"])
    positive_count = int(walk_forward["positiveReturnCount"])
    actual_positive_pct = positive_count / window_count * 100 if window_count else 0.0
    required_window_count = int(guardrails["rolling"]["requiredWindowCount"])
    minimum_positive_windows = int(
        guardrails["rolling"]["minimumPositiveWindowCount"]
    )
    rolling_passed = (
        window_count == required_window_count
        and positive_count >= minimum_positive_windows
    )
    base_passed = development_passed and validation_passed and rolling_passed
    return {
        "development": {
            "passed": development_passed,
            "actualRoundTripCount": development_actual,
            "minimumRoundTripCount": development_minimum,
        },
        "validation": {
            "passed": validation_passed,
            "failures": validation_failures,
            "metrics": validation_metrics,
            "guardrails": validation_rules,
        },
        "rolling": {
            "passed": rolling_passed,
            "positiveReturnCount": positive_count,
            "validationWindowCount": window_count,
            "actualPositiveReturnPct": round(actual_positive_pct, 4),
            "requiredWindowCount": required_window_count,
            "minimumPositiveWindowCount": minimum_positive_windows,
        },
        "stability": {"passed": False, "pending": True, "neighbors": []},
        "pretest": {"passed": base_passed},
    }


def _formal_test_gate_evaluation(
    test_metrics: dict[str, Any],
    guardrails: dict[str, Any],
) -> dict[str, Any]:
    failures: list[str] = []
    if guardrails["requirePositiveReturn"] and float(test_metrics["totalReturnPct"]) <= 0:
        failures.append("non_positive_return")
    if not _profit_factor_passes(test_metrics, float(guardrails["minimumProfitFactor"])):
        failures.append("profit_factor_below_minimum")
    if float(test_metrics["maxDrawdownPct"]) > float(guardrails["maximumDrawdownPct"]):
        failures.append("drawdown_above_maximum")
    if int(test_metrics["roundTripCount"]) < int(guardrails["minimumRoundTripCount"]):
        failures.append("round_trip_count_below_minimum")
    return {
        "passed": not failures,
        "failures": failures,
        "metrics": test_metrics,
        "guardrails": guardrails,
    }


def _profit_factor_passes(metrics: dict[str, Any], minimum: float) -> bool:
    return bool(metrics.get("profitFactorInfinite")) or float(metrics["profitFactor"]) >= minimum


def _apply_adjacent_candidate_gate(
    records: list[StrategyExperimentCandidateRecord],
    dimensions: list[dict[str, Any]],
) -> list[StrategyExperimentCandidateRecord]:
    paths = [str(dimension["policyPath"]) for dimension in dimensions]
    values_by_path = {
        str(dimension["policyPath"]): list(dimension["values"]) for dimension in dimensions
    }

    def coordinates(record: StrategyExperimentCandidateRecord) -> tuple[int | float, ...]:
        parameters = {str(item["policyPath"]): item["value"] for item in record.parameters}
        return tuple(cast(int | float, parameters[path]) for path in paths)

    records_by_coordinates = {coordinates(record): record for record in records}
    updated: list[StrategyExperimentCandidateRecord] = []
    for record in records:
        coordinate = coordinates(record)
        neighbor_coordinates: list[tuple[int | float, ...]] = []
        complete_neighborhood = True
        for dimension_index, path in enumerate(paths):
            values = values_by_path[path]
            try:
                value_index = values.index(coordinate[dimension_index])
            except ValueError:
                complete_neighborhood = False
                continue
            if value_index == 0 or value_index == len(values) - 1:
                complete_neighborhood = False
                continue
            for adjacent_index in (value_index - 1, value_index + 1):
                neighbor = list(coordinate)
                neighbor[dimension_index] = values[adjacent_index]
                neighbor_coordinates.append(tuple(neighbor))

        neighbors: list[dict[str, Any]] = []
        positive_neighbors = complete_neighborhood
        for neighbor_coordinate in neighbor_coordinates:
            neighbor_record = records_by_coordinates.get(neighbor_coordinate)
            if neighbor_record is None:
                positive_neighbors = False
                continue
            neighbor_return = float(neighbor_record.validation_metrics["totalReturnPct"])
            positive = neighbor_return > 0
            positive_neighbors = positive_neighbors and positive
            neighbors.append(
                {
                    "candidateId": neighbor_record.candidate_id,
                    "validationReturnPct": neighbor_return,
                    "positive": positive,
                }
            )
        gate_evaluation = copy.deepcopy(record.gate_evaluation)
        gate_evaluation["stability"] = {
            "passed": positive_neighbors,
            "pending": False,
            "completeNeighborhood": complete_neighborhood,
            "neighbors": sorted(neighbors, key=lambda item: item["candidateId"]),
        }
        gate_evaluation["pretest"]["passed"] = bool(
            gate_evaluation["pretest"]["passed"] and positive_neighbors
        )
        updated.append(
            replace(
                record,
                gate_evaluation=gate_evaluation,
                eligible=bool(record.eligible and positive_neighbors),
            )
        )
    return updated


def _result_hash(
    _definition_hash: str,
    candidates: list[StrategyExperimentCandidateRecord],
    *,
    selected_candidate_id: str | None,
    completion_reason: str,
    profitability_gate_passed: bool = False,
    result_schema_version: int = RESULT_SCHEMA_VERSION,
    pre_roll_version: str | None = None,
) -> str:
    ordered = sorted(candidates, key=lambda candidate: canonical_json(candidate.parameters))
    selected = next(
        (candidate for candidate in ordered if candidate.candidate_id == selected_candidate_id),
        None,
    )
    payload: dict[str, Any] = {
            "candidates": [
                {
                    "parameters": candidate.parameters,
                    "trainMetrics": candidate.train_metrics,
                    "validationMetrics": candidate.validation_metrics,
                    "walkForward": candidate.walk_forward,
                }
                for candidate in ordered
            ],
            "selection": (
                {"parameters": selected.parameters, "testMetrics": selected.test_metrics}
                if selected is not None
                else None
            ),
            "completionReason": completion_reason,
            "schemaVersion": result_schema_version,
    }
    if result_schema_version >= POLICY_RESULT_SCHEMA_VERSION:
        payload["candidates"] = [
            {
                "parameters": candidate.parameters,
                "trainMetrics": candidate.train_metrics,
                "validationMetrics": candidate.validation_metrics,
                "walkForward": candidate.walk_forward,
                "gateEvaluation": candidate.gate_evaluation,
            }
            for candidate in ordered
        ]
        payload["profitabilityGatePassed"] = profitability_gate_passed
        if pre_roll_version is not None:
            payload["preRollVersion"] = pre_roll_version
    return canonical_sha256(payload)


def _sealed_summary_payload(summary: Any) -> dict[str, Any]:
    to_payload = getattr(summary, "to_payload", None)
    if callable(to_payload):
        payload = to_payload()
        if not isinstance(payload, dict):
            raise _conflict("The sealed dataset summary is invalid.")
        return cast(dict[str, Any], _canonical_copy(payload))
    return {
        "datasetId": _required_string(getattr(summary, "dataset_id", None)),
        "market": _required_string(getattr(summary, "market", None)),
        "symbol": _required_string(getattr(summary, "symbol", None)),
        "timeframe": _required_string(getattr(summary, "timeframe", None)),
        "source": _required_string(getattr(summary, "source", None)),
        "adjustmentMode": str(getattr(summary, "adjustment_mode", "none") or "none"),
        "start": _datetime_or_string(getattr(summary, "start", None)),
        "developmentEndExclusive": _datetime_or_string(
            getattr(summary, "development_end_exclusive", None)
        ),
        "endExclusive": _datetime_or_string(getattr(summary, "end_exclusive", None)),
        "rows": _required_exact_int(getattr(summary, "rows", None)),
        "developmentRows": _required_exact_int(
            getattr(summary, "development_rows", None)
        ),
        "withheldRows": _required_exact_int(getattr(summary, "withheld_rows", None)),
        "datasetHash": _required_string(getattr(summary, "dataset_hash", None)),
        "developmentHash": _required_string(
            getattr(summary, "development_hash", None)
        ),
    }


def _promotable_selected_candidate(
    detail: StrategyExperimentDetail,
) -> StrategyExperimentCandidateRecord:
    experiment = detail.experiment
    if (
        experiment.status != "completed"
        or not experiment.profitability_gate_passed
        or experiment.completion_reason != "profitability_gate_passed"
        or not experiment.result_hash
        or not experiment.selected_candidate_id
        or detail.snapshot.test_definition_hash != experiment.definition_hash
        or detail.snapshot.test_owner_experiment_id != experiment.experiment_id
        or detail.snapshot.test_consumed_at is None
    ):
        raise StrategyExperimentError(
            status=409,
            error="strategy_experiment_not_promotable",
            detail="Only the uniquely tested profitable winner can be promoted.",
        )
    selected = next(
        (
            candidate
            for candidate in detail.candidates
            if candidate.candidate_id == experiment.selected_candidate_id
        ),
        None,
    )
    rank_one = [candidate for candidate in detail.candidates if candidate.rank == 1]
    if (
        selected is None
        or rank_one != [selected]
        or selected.test_metrics is None
        or not selected.eligible
        or not bool(selected.gate_evaluation.get("pretest", {}).get("passed"))
        or not bool(selected.gate_evaluation.get("test", {}).get("passed"))
    ):
        raise StrategyExperimentError(
            status=409,
            error="strategy_experiment_not_promotable",
            detail="Only the uniquely tested profitable winner can be promoted.",
        )
    return selected


def _winner_strategy(
    detail: StrategyExperimentDetail,
    selected: StrategyExperimentCandidateRecord,
) -> StrategyConfig:
    definition = detail.experiment.definition
    if canonical_sha256(definition) != detail.experiment.definition_hash:
        raise _conflict("The stored experiment definition hash is invalid.")
    try:
        base = strategy_config_from_payload(cast(dict[str, Any], definition["baseStrategy"]))
        dimensions = _dimensions_from_payload(definition["dimensions"])
        candidates = expand_candidates(base, dimensions)
    except (KeyError, TypeError, ValueError) as error:
        raise _conflict("The stored experiment definition is invalid.") from error
    winner = next(
        (candidate for candidate in candidates if candidate.candidate_id == selected.candidate_id),
        None,
    )
    if (
        winner is None
        or winner.strategy.revision != selected.candidate_revision
        or winner.parameters != selected.parameters
    ):
        raise _conflict("The stored experiment winner lineage is invalid.")
    return winner.strategy


def _fresh_p0_formal_identity_required(
    detail: StrategyExperimentDetail,
) -> bool:
    version = detail.experiment.definition.get("preRollVersion")
    if version in (None, FORMAL_PRE_ROLL_VERSION_V1):
        return False
    if version == FORMAL_PRE_ROLL_VERSION:
        return True
    raise _conflict("The stored experiment formal pre-roll version is unsupported.")


def _validate_fresh_p0_run(
    run: Any,
    *,
    winner: StrategyConfig,
    prior_snapshot_hash: str,
    after: datetime | None,
    sealed_bar_source: SealedBarSource | None = None,
    formal_identity_required: bool = False,
) -> tuple[str, dict[str, Any], dict[str, Any]]:
    try:
        run_strategy = strategy_config_from_payload(run.strategy_config or {})
    except (TypeError, ValueError) as error:
        raise _conflict("The fresh P0 run strategy is invalid.") from error
    expected_payload = strategy_config_to_payload(winner)
    if (
        run.execution_mode != "paper_only"
        or run.strategy_revision != winner.revision
        or run.strategy_name != winner.name
        or run.market != winner.market
        or run.symbol != winner.symbols[0]
        or run.timeframe != winner.timeframe
        or run_strategy.revision != winner.revision
        or canonical_json(strategy_config_to_payload(run_strategy))
        != canonical_json(expected_payload)
        or run.backtest_assumptions != FORMAL_BACKTEST_ASSUMPTIONS
        or after is None
        or run.created_at <= after
    ):
        raise StrategyExperimentError(
            status=409,
            error="fresh_p0_run_mismatch",
            detail="The fresh P0 run does not exactly match the selected winner.",
        )
    snapshot = run.data_snapshot
    if (
        formal_identity_required
        and snapshot.get("hashVersion") != SEALED_DATASET_HASH_VERSION
    ):
        raise StrategyExperimentError(
            status=409,
            error="fresh_p0_snapshot_invalid",
            detail=(
                "The promotion run must use a complete formal-pre-roll-v2 "
                "sealed snapshot."
            ),
        )
    if snapshot.get("hashVersion") == SEALED_DATASET_HASH_VERSION:
        snapshot_hash, data_range = _validate_fresh_sealed_p0_run(
            run,
            winner=winner,
            prior_snapshot_hash=prior_snapshot_hash,
            sealed_bar_source=sealed_bar_source,
            formal_identity_required=formal_identity_required,
        )
        fresh_gate_evaluation = fresh_p0_profitability_evaluation(run.metrics)
        return snapshot_hash, data_range, fresh_gate_evaluation
    raw_bars = snapshot.get("bars")
    if (
        snapshot.get("hashVersion") != DATA_SNAPSHOT_HASH_VERSION
        or not isinstance(raw_bars, list)
        or not raw_bars
        or not bool(snapshot.get("isComplete"))
        or not bool(run.data_quality.get("isComplete"))
    ):
        raise _conflict("The fresh P0 run requires a complete canonical snapshot.")
    try:
        normalized = normalize_snapshot_bars(raw_bars)
    except (TypeError, ValueError) as error:
        raise _conflict("The fresh P0 run snapshot bars are invalid.") from error
    try:
        last_bar_at = datetime.fromisoformat(
            str(normalized[-1]["timestamp"]).replace("Z", "+00:00")
        )
    except (KeyError, TypeError, ValueError) as error:
        raise StrategyExperimentError(
            status=409,
            error="fresh_p0_snapshot_invalid",
            detail="The promotion run must use a distinct, complete fresh snapshot.",
        ) from error
    if (
        last_bar_at.tzinfo is None
        or last_bar_at.utcoffset() is None
        or run.created_at.tzinfo is None
        or run.created_at.utcoffset() is None
        or last_bar_at.astimezone(timezone.utc) + timedelta(minutes=1)
        > run.created_at.astimezone(timezone.utc)
    ):
        raise StrategyExperimentError(
            status=409,
            error="fresh_p0_snapshot_invalid",
            detail="The promotion run must contain completed bars only.",
        )
    digest = canonical_data_hash(normalized)
    quality_issues = [
        *(
            run.data_quality.get("issues")
            if isinstance(run.data_quality.get("issues"), list)
            else []
        ),
        *(
            snapshot.get("qualityIssues")
            if isinstance(snapshot.get("qualityIssues"), list)
            else []
        ),
    ]
    incomplete_codes = {"forming_bar", "future_bar", "timestamp_disorder", "duplicate_timestamp"}
    if any(
        isinstance(issue, dict) and str(issue.get("code") or "") in incomplete_codes
        for issue in quality_issues
    ):
        raise _conflict("The fresh P0 run contains bars that were not completed.")
    if (
        digest == prior_snapshot_hash
        or str(snapshot.get("hash") or "") != digest
        or run.data_rows != len(normalized)
        or _exact_int(snapshot.get("rows")) != len(normalized)
        or _exact_int(run.data_quality.get("rows")) != len(normalized)
        or snapshot.get("start") != normalized[0]["timestamp"]
        or snapshot.get("end") != normalized[-1]["timestamp"]
        or (
            run.data_quality.get("canonicalHash")
            and run.data_quality.get("canonicalHash") != digest
        )
    ):
        raise StrategyExperimentError(
            status=409,
            error="fresh_p0_snapshot_invalid",
            detail="The promotion run must use a distinct, complete fresh snapshot.",
        )
    fresh_gate_evaluation = fresh_p0_profitability_evaluation(run.metrics)
    return (
        digest,
        {
            "start": normalized[0]["timestamp"],
            "endExclusive": (
                last_bar_at.astimezone(timezone.utc)
                + _timeframe_duration(winner.timeframe)
            ).isoformat(),
        },
        fresh_gate_evaluation,
    )


def fresh_p0_profitability_evaluation(metrics: Any) -> dict[str, Any]:
    try:
        if not isinstance(metrics, dict):
            raise ValueError("metrics_not_object")

        def finite_number(key: str) -> float:
            value = metrics.get(key)
            if (
                isinstance(value, bool)
                or not isinstance(value, (int, float))
                or not math.isfinite(float(value))
            ):
                raise ValueError(f"invalid_{key}")
            return float(value)

        total_return = finite_number("total_return_pct")
        maximum_drawdown = finite_number("max_drawdown_pct")
        win_rate = finite_number("win_rate_pct")
        profit_factor = finite_number("profit_factor")
        round_trips = metrics.get("round_trip_count")
        if (
            isinstance(round_trips, bool)
            or not isinstance(round_trips, int)
            or round_trips < 0
            or maximum_drawdown < 0
            or not 0 <= win_rate <= 100
            or profit_factor < 0
        ):
            raise ValueError("invalid_metric_domain")
    except (OverflowError, TypeError, ValueError) as error:
        raise StrategyExperimentError(
            status=409,
            error="fresh_p0_profitability_gate_failed",
            detail="The fresh P0 run has invalid_metrics and cannot be promoted.",
        ) from error

    normalized = {
        "totalReturnPct": total_return,
        "maxDrawdownPct": maximum_drawdown,
        "profitFactor": profit_factor,
        "profitFactorInfinite": bool(
            round_trips > 0 and win_rate == 100 and total_return > 0
        ),
        "roundTripCount": round_trips,
    }
    evaluation = _formal_test_gate_evaluation(
        normalized,
        FORMAL_PROFITABILITY_GUARDRAILS["test"],
    )
    if not evaluation["passed"]:
        failures = ",".join(str(item) for item in evaluation["failures"])
        raise StrategyExperimentError(
            status=409,
            error="fresh_p0_profitability_gate_failed",
            detail=f"The fresh P0 run failed the formal test gate: {failures}.",
        )
    return evaluation


def _validate_fresh_sealed_p0_run(
    run: Any,
    *,
    winner: StrategyConfig,
    prior_snapshot_hash: str,
    sealed_bar_source: SealedBarSource | None,
    formal_identity_required: bool = False,
) -> tuple[str, dict[str, Any]]:
    if sealed_bar_source is None:
        raise StrategyExperimentError(
            status=409,
            error="sealed_dataset_unavailable",
            detail="The fresh sealed P0 dataset is unavailable.",
        )
    try:
        snapshot = normalize_sealed_research_snapshot(
            run.data_snapshot,
            market=winner.market,
            symbol=winner.symbols[0],
            timeframe=winner.timeframe,
        )
        sealed_payload = cast(dict[str, Any], snapshot["sealedDataset"])
        dataset_id = _required_string(sealed_payload.get("datasetId"))
        summary = sealed_bar_source.get_summary(dataset_id)
        if summary is None:
            raise ValueError("sealed_dataset_not_found")
        expected_summary = _sealed_summary_payload(summary)
        development_rows = _exact_int(expected_summary.get("developmentRows"))
        supplied_scoring = None
        if "preRollVersion" in snapshot or "scoringWindow" in snapshot:
            expected_scoring = formal_scoring_metadata(expected_summary)
            supplied_scoring = {
                "preRollVersion": snapshot.get("preRollVersion"),
                "scoringWindow": snapshot.get("scoringWindow"),
            }
            if supplied_scoring != expected_scoring:
                raise ValueError("fresh_sealed_snapshot_scoring_invalid")
        if formal_identity_required and supplied_scoring is None:
            raise ValueError("fresh_sealed_snapshot_scoring_required")
        if formal_identity_required:
            scoring_window = cast(dict[str, Any], supplied_scoring["scoringWindow"])
            score_start = datetime.fromisoformat(str(scoring_window["start"]))
            pre_roll_rows = _exact_int(scoring_window.get("preRollRows"))
            if (
                pre_roll_rows is None
                or pre_roll_rows
                < formal_strategy_required_pre_roll(winner, score_start)
            ):
                raise ValueError("fresh_sealed_snapshot_pre_roll_insufficient")
        coverage = run.data_quality.get("coverage")
        issues = run.data_quality.get("issues")
        if (
            sealed_payload != expected_summary
            or expected_summary.get("market") != winner.market
            or expected_summary.get("symbol") != winner.symbols[0]
            or expected_summary.get("timeframe") != winner.timeframe
            or expected_summary.get("datasetHash") == prior_snapshot_hash
            or snapshot.get("isComplete") is not True
            or snapshot.get("source") != expected_summary.get("source")
            or snapshot.get("adjustmentMode")
            != expected_summary.get("adjustmentMode")
            or development_rows is None
            or run.data_rows != development_rows
            or run.data_quality.get("isComplete") is not True
            or _exact_int(run.data_quality.get("rows")) != development_rows
            or run.data_quality.get("canonicalHash")
            != expected_summary.get("developmentHash")
            or run.data_quality.get("source") != expected_summary.get("source")
            or run.data_quality.get("adjustmentMode")
            != expected_summary.get("adjustmentMode")
            or not isinstance(coverage, dict)
            or _exact_int(coverage.get("actualRows")) != development_rows
            or _exact_int(coverage.get("expectedRows")) != development_rows
            or _exact_int(coverage.get("gapCount")) != 0
            or float(coverage.get("ratio", -1)) != 1.0
            or not isinstance(issues, list)
            or any(
                isinstance(issue, dict)
                and (
                    issue.get("severity") == "blocked"
                    or str(issue.get("code") or "")
                    in {
                        "forming_bar",
                        "future_bar",
                        "timestamp_disorder",
                        "duplicate_timestamp",
                    }
                )
                for issue in issues
            )
        ):
            raise ValueError("fresh_sealed_snapshot_metadata_invalid")
        development_end = datetime.fromisoformat(
            str(expected_summary["developmentEndExclusive"]).replace("Z", "+00:00")
        )
        if (
            development_end.tzinfo is None
            or run.created_at.tzinfo is None
            or development_end.astimezone(timezone.utc)
            > run.created_at.astimezone(timezone.utc)
        ):
            raise ValueError("fresh_sealed_snapshot_forming_bar")
        development_bars = sealed_bar_source.read_development_bars(dataset_id)
        chunked, normalized = _normalize_large_ohlcv_bars(
            development_bars,
            market=winner.market,
            symbol=winner.symbols[0],
            timeframe=winner.timeframe,
        )
        if (
            len(normalized) != development_rows
            or chunked.get("hash") != expected_summary.get("developmentHash")
            or chunked.get("start") != expected_summary.get("start")
            or chunked.get("endExclusive")
            != expected_summary.get("developmentEndExclusive")
        ):
            raise ValueError("fresh_sealed_snapshot_content_invalid")
        if supplied_scoring is not None:
            expected_facts = formal_source_backtest_facts(
                winner,
                development_bars,
                evaluation_start_index=int(
                    supplied_scoring["scoringWindow"]["preRollRows"]
                ),
            )
            if {
                "metrics": run.metrics,
                "trades": run.backtest_trades,
                "equity": run.backtest_equity_curve,
            } != expected_facts:
                raise ValueError("fresh_sealed_snapshot_replay_mismatch")
        snapshot_identity = _required_string(snapshot.get("snapshotHash"))
    except StrategyExperimentError:
        raise
    except (KeyError, TypeError, ValueError) as error:
        raise StrategyExperimentError(
            status=409,
            error="fresh_p0_snapshot_invalid",
            detail="The promotion run must use a distinct, complete fresh sealed snapshot.",
        ) from error
    return snapshot_identity, {
        "start": expected_summary["start"],
        "endExclusive": expected_summary["developmentEndExclusive"],
    }


def _experiment_snapshot_data_range(
    detail: StrategyExperimentDetail,
) -> dict[str, str]:
    end_exclusive = detail.snapshot.end_at
    if not isinstance(detail.experiment.definition.get("sealedDataset"), dict):
        try:
            inclusive_end = datetime.fromisoformat(
                detail.snapshot.end_at.replace("Z", "+00:00")
            )
            if inclusive_end.tzinfo is None or inclusive_end.utcoffset() is None:
                raise ValueError("snapshot_end_timezone_required")
            end_exclusive = (
                inclusive_end.astimezone(timezone.utc)
                + _timeframe_duration(detail.snapshot.timeframe)
            ).isoformat()
        except (TypeError, ValueError) as error:
            raise _conflict("The formal experiment data range is invalid.") from error
    return {
        "start": detail.snapshot.start_at,
        "endExclusive": end_exclusive,
    }


def _timeframe_duration(timeframe: str) -> timedelta:
    steps = {
        "1m": timedelta(minutes=1),
        "5m": timedelta(minutes=5),
        "15m": timedelta(minutes=15),
        "30m": timedelta(minutes=30),
        "60m": timedelta(minutes=60),
        "1d": timedelta(days=1),
        "1w": timedelta(weeks=1),
    }
    try:
        return steps[timeframe]
    except KeyError as error:
        raise ValueError("unsupported_timeframe") from error


def _normalize_large_ohlcv_bars(
    bars: list[OHLCVBar],
    *,
    market: str,
    symbol: str,
    timeframe: str,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    if not bars:
        raise ValueError("sealed_dataset_empty")
    chunked = normalize_snapshot_bar_chunks(
        [bars[index : index + 500] for index in range(0, len(bars), 500)],
        market=market,
        symbol=symbol,
        timeframe=timeframe,
    )
    normalized = flatten_chunked_data_snapshot(
        chunked,
        market=market,
        symbol=symbol,
        timeframe=timeframe,
    )
    return chunked, normalized


def _large_snapshot_records_to_ohlcv(
    bars: list[dict[str, Any]],
    *,
    market: str,
    symbol: str,
    timeframe: str,
) -> list[OHLCVBar]:
    converted = [
        OHLCVBar(
            market=cast(Any, market),
            symbol=symbol,
            timeframe=cast(Any, timeframe),
            timestamp=datetime.fromisoformat(str(bar["timestamp"])),
            open=float(bar["open"]),
            high=float(bar["high"]),
            low=float(bar["low"]),
            close=float(bar["close"]),
            volume=float(bar["volume"]),
        )
        for bar in bars
    ]
    return converted


def _validate_claimed_test_bars(
    definition: _ExperimentDefinition,
    bars: list[OHLCVBar],
) -> None:
    sealed = definition.definition.get("sealedDataset")
    if not isinstance(sealed, dict):
        raise ValueError("sealed_dataset_summary_invalid")
    expected_rows = _exact_int(sealed.get("withheldRows"))
    if expected_rows is None or len(bars) != expected_rows:
        raise ValueError("sealed_test_partition_rows_mismatch")
    chunked, normalized = _normalize_large_ohlcv_bars(
        bars,
        market=definition.snapshot.market,
        symbol=definition.snapshot.symbol,
        timeframe=definition.snapshot.timeframe,
    )
    if (
        chunked["start"] != sealed.get("developmentEndExclusive")
        or chunked["endExclusive"] != sealed.get("endExclusive")
        or canonical_data_hash(definition.snapshot.bars)
        != sealed.get("developmentHash")
    ):
        raise ValueError("sealed_test_partition_integrity_invalid")


def _datetime_or_string(value: Any) -> str:
    if isinstance(value, datetime):
        if value.tzinfo is None or value.utcoffset() is None:
            raise _conflict("The sealed dataset range must be timezone-aware.")
        return value.astimezone(timezone.utc).isoformat()
    return _required_string(value)


def _required_exact_int(value: Any) -> int:
    normalized = _exact_int(value)
    if normalized is None or normalized < 0:
        raise _conflict("The sealed dataset row metadata is invalid.")
    return normalized


def _launch_background_job(job: Callable[[], None]) -> None:
    Thread(target=job, daemon=True, name="strategy-experiment").start()


_STRATEGY_RESEARCH_LAUNCH_DEFINITION_FIELDS = (
    "strategyRevision",
    "sourceRunId",
    "assumptions",
    "dimensions",
    "guardrails",
    "walkForward",
)


def strategy_research_launch_definition_identity(value: Mapping[str, Any]) -> str:
    if not isinstance(value, Mapping) or any(
        field not in value for field in _STRATEGY_RESEARCH_LAUNCH_DEFINITION_FIELDS
    ):
        raise ValueError("strategy_research_launch_definition_invalid")
    return canonical_sha256(
        {
            field: value[field]
            for field in _STRATEGY_RESEARCH_LAUNCH_DEFINITION_FIELDS
        }
    )


def strategy_experiment_id_from_idempotency_key(value: Any) -> str:
    return _idempotent_experiment_id(value)


def _normalize_strategy_research_launch_intent(
    value: Mapping[str, Any],
    *,
    definition: Mapping[str, Any],
) -> dict[str, str]:
    if not isinstance(value, Mapping) or set(value) != {
        "proposalId",
        "experimentId",
        "eventId",
        "definitionIdentityHash",
    }:
        raise ValueError("strategy_research_launch_intent_invalid")
    proposal_id = str(value.get("proposalId") or "").strip()
    experiment_id = str(value.get("experimentId") or "").strip()
    event_id = str(value.get("eventId") or "").strip()
    definition_identity_hash = str(
        value.get("definitionIdentityHash") or ""
    ).strip()
    if (
        not proposal_id.startswith("strategy-research-proposal-")
        or experiment_id != strategy_experiment_id_from_idempotency_key(proposal_id)
        or event_id != f"strategy-research-launch-{experiment_id}"
        or len(definition_identity_hash) != 64
        or any(character not in "0123456789abcdef" for character in definition_identity_hash)
        or definition_identity_hash
        != strategy_research_launch_definition_identity(definition)
    ):
        raise ValueError("strategy_research_launch_intent_invalid")
    return {
        "proposalId": proposal_id,
        "experimentId": experiment_id,
        "eventId": event_id,
        "definitionIdentityHash": definition_identity_hash,
    }


def _idempotent_experiment_id(value: Any) -> str:
    if not isinstance(value, str) or not value.strip() or len(value.strip()) > 512:
        raise StrategyExperimentError(
            status=400,
            error="invalid_strategy_experiment_idempotency_key",
            detail="The internal experiment idempotency key is invalid.",
        )
    digest = sha256(f"strategy-experiment:{value.strip()}".encode("utf-8")).hexdigest()
    return f"experiment-{digest[:24]}"


def _validated_idempotent_experiment(
    existing: StrategyExperimentDetail,
    definition: _ExperimentDefinition,
) -> StrategyExperimentDetail:
    record = existing.experiment
    if (
        record.definition_hash != definition.definition_hash
        or record.snapshot_id != definition.snapshot.snapshot_id
        or record.strategy_revision != definition.strategy.revision
        or record.source_run_id != str(definition.definition["sourceRunId"])
    ):
        raise StrategyExperimentError(
            status=409,
            error="strategy_experiment_idempotency_conflict",
            detail="The idempotency key is already bound to a different experiment definition.",
        )
    return existing


def _required_string(value: Any) -> str:
    if not isinstance(value, str) or not value.strip():
        raise _invalid("Strategy revision and source run ID are required.")
    return value.strip()


def _exact_int(value: Any) -> int | None:
    return value if isinstance(value, int) and not isinstance(value, bool) else None


def _non_negative_int(value: Any, detail: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise _invalid(detail)
    return value


def _required_bool(value: Any, detail: str) -> bool:
    if not isinstance(value, bool):
        raise _invalid(detail)
    return value


def _bounded_number(value: Any, *, minimum: float, maximum: float, detail: str) -> int | float:
    number = _finite_number(value, detail)
    if not minimum <= number <= maximum:
        raise _invalid(detail)
    return _canonical_number(number)


def _finite_number(value: Any, detail: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise _invalid(detail)
    number = float(value)
    if not math.isfinite(number):
        raise _invalid(detail)
    return number


def _canonical_number(value: float) -> int | float:
    if value == 0:
        return 0
    return int(value) if value.is_integer() else value


def _canonical_copy(value: Any) -> Any:
    return json.loads(canonical_json(value))


def _invalid(detail: str) -> StrategyExperimentError:
    return StrategyExperimentError(status=400, error="invalid_strategy_experiment", detail=detail)


def _conflict(detail: str) -> StrategyExperimentError:
    return StrategyExperimentError(status=409, error="strategy_experiment_conflict", detail=detail)
