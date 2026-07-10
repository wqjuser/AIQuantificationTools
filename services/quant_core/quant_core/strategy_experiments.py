from __future__ import annotations

import copy
import itertools
import json
import math
import statistics
import time
import uuid
from dataclasses import dataclass, replace
from datetime import datetime, timezone
from typing import Any, Callable, Literal, Sequence, cast

from quant_core.ai_review_stage3 import build_strategy_lineage_key_from_parts
from quant_core.backtest import BacktestEngine
from quant_core.canonical import (
    DATA_SNAPSHOT_HASH_VERSION,
    canonical_data_hash,
    canonical_json,
    canonical_sha256,
    canonical_snapshot_id,
    normalize_snapshot_bars,
    snapshot_bars_to_ohlcv,
    strategy_config_from_payload,
    strategy_config_to_payload,
)
from quant_core.domain import BacktestMetrics, BacktestRun, StrategyConfig
from quant_core.runs import ResearchRunStore
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
ENGINE_VERSION = "backtest-v1"
RESULT_SCHEMA_VERSION = 1

_SUPPORTED_PARAMETERS = {
    "close_above_sma": {"window"},
    "close_below_sma": {"window"},
    "volume_above_sma": {"window"},
    "rsi_below": {"window", "threshold"},
    "rsi_above": {"window", "threshold"},
}


@dataclass(frozen=True)
class ParameterDimension:
    side: Literal["entry", "exit"]
    condition_index: int
    parameter: Literal["window", "threshold"]
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
    dimensions: Sequence[ParameterDimension],
) -> tuple[ExpandedCandidate, ...]:
    normalized = _normalize_dimensions(base_strategy, dimensions)
    candidate_count = math.prod(len(dimension.values) for dimension in normalized)
    if not 1 <= candidate_count <= MAX_CANDIDATES:
        raise _invalid("Strategy experiments require between 1 and 81 canonical candidates.")
    candidates: list[ExpandedCandidate] = []
    for values in itertools.product(*(dimension.values for dimension in normalized)):
        parameters = [
            {
                "conditionSide": dimension.side,
                "conditionIndex": dimension.condition_index,
                "parameter": dimension.parameter,
                "value": value,
            }
            for dimension, value in zip(normalized, values, strict=True)
        ]
        payload = copy.deepcopy(strategy_config_to_payload(base_strategy))
        for parameter in parameters:
            conditions = payload[
                "entryConditions" if parameter["conditionSide"] == "entry" else "exitConditions"
            ]
            cast(list[dict[str, Any]], conditions)[parameter["conditionIndex"]]["params"][parameter["parameter"]] = (
                parameter["value"]
            )
        candidates.append(
            ExpandedCandidate(
                candidate_id=canonical_sha256(parameters)[:12],
                strategy=strategy_config_from_payload(payload),
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
    ) -> None:
        self.strategy_store = strategy_store
        self.run_store = run_store
        self.experiment_store = experiment_store
        self.monotonic = monotonic
        self._evaluation_count = 0

    def run_new(self, payload: dict[str, Any]) -> StrategyExperimentDetail:
        return self._run(self._definition_from_source(payload))

    def replay(self, experiment_id: str) -> StrategyExperimentDetail:
        prior = self.experiment_store.get(experiment_id)
        if prior is None:
            raise StrategyExperimentError(
                status=404,
                error="strategy_experiment_not_found",
                detail=f"Strategy experiment {experiment_id} was not found.",
            )
        return self._run(self._definition_from_record(prior))

    def _run(self, definition: _ExperimentDefinition) -> StrategyExperimentDetail:
        experiment_id = f"experiment-{uuid.uuid4().hex}"
        created_at = datetime.now(timezone.utc)
        self._evaluation_count = 0
        try:
            claimed = self.experiment_store.claimed_definition(definition.snapshot.snapshot_id)
            if claimed is not None and claimed != definition.definition_hash:
                raise StrategyExperimentError(
                    status=409,
                    error="test_holdout_consumed",
                    detail="The test holdout is already bound to a different experiment definition.",
                )
            deadline = self.monotonic() + DEADLINE_SECONDS
            candidate_records, selected_candidate_id, completion_reason = self._evaluate_candidates(
                definition,
                experiment_id=experiment_id,
                deadline=deadline,
            )
            result_hash = _result_hash(
                definition.definition_hash,
                candidate_records,
                selected_candidate_id=selected_candidate_id,
                completion_reason=completion_reason,
            )
            experiment = self._record(
                definition,
                experiment_id=experiment_id,
                created_at=created_at,
                status="completed",
                selected_candidate_id=selected_candidate_id,
                completion_reason=completion_reason,
                result_hash=result_hash,
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

    def _definition_from_source(self, payload: dict[str, Any]) -> _ExperimentDefinition:
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
        guardrails = _normalize_guardrails(payload.get("guardrails"))
        dimensions = _dimensions_from_payload(payload.get("dimensions"))
        candidates = expand_candidates(library_strategy, dimensions)
        train_end, validation_end = _split_boundaries(rows)
        walk_forward, windows = _normalize_walk_forward(payload.get("walkForward"), validation_end)
        evaluation_budget = 2 * len(candidates) + 2 * len(candidates) * len(windows) + 1
        if evaluation_budget > MAX_EVALUATIONS:
            raise _invalid("Strategy experiment evaluation budget exceeds 512 engine calls.")
        _validate_warmup_capacity(candidates, train_end, walk_forward)

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
            "engineVersion": ENGINE_VERSION,
            "resultSchemaVersion": RESULT_SCHEMA_VERSION,
        }
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

    def _definition_from_record(self, prior: StrategyExperimentDetail) -> _ExperimentDefinition:
        definition = cast(dict[str, Any], _canonical_copy(prior.experiment.definition))
        if canonical_sha256(definition) != prior.experiment.definition_hash:
            raise _conflict("Stored experiment definition hash is invalid.")
        if (
            definition.get("engineVersion") != ENGINE_VERSION
            or definition.get("resultSchemaVersion") != RESULT_SCHEMA_VERSION
        ):
            raise _conflict("Stored experiment definition version is unsupported.")
        try:
            strategy = strategy_config_from_payload(cast(dict[str, Any], definition["baseStrategy"]))
            dimensions = _dimensions_from_payload(definition["dimensions"])
            candidates = expand_candidates(strategy, dimensions)
            normalized_bars = normalize_snapshot_bars(prior.snapshot.bars)
        except (KeyError, TypeError, ValueError) as error:
            raise _conflict("Stored experiment definition is invalid.") from error
        if (
            strategy.revision != prior.experiment.strategy_revision
            or definition.get("strategyRevision") != prior.experiment.strategy_revision
            or definition.get("sourceRunId") != prior.experiment.source_run_id
            or definition.get("snapshotId") != prior.snapshot.snapshot_id
            or definition.get("canonicalDataHash") != prior.snapshot.canonical_data_hash
            or canonical_data_hash(normalized_bars) != prior.snapshot.canonical_data_hash
            or prior.snapshot.rows != len(normalized_bars)
        ):
            raise _conflict("Stored experiment definition and snapshot do not match.")
        train_end, validation_end = _split_boundaries(len(normalized_bars))
        walk_forward, windows = _normalize_walk_forward(definition.get("walkForward"), validation_end)
        evaluation_budget = 2 * len(candidates) + 2 * len(candidates) * len(windows) + 1
        if definition.get("evaluationBudget") != evaluation_budget or evaluation_budget > MAX_EVALUATIONS:
            raise _conflict("Stored experiment evaluation budget is invalid.")
        _normalize_assumptions(definition.get("assumptions"))
        _normalize_guardrails(definition.get("guardrails"))
        _validate_warmup_capacity(candidates, train_end, walk_forward)
        finished = self._finish_definition(
            definition,
            snapshot=prior.snapshot,
            strategy=strategy,
            candidates=candidates,
            train_end=train_end,
            validation_end=validation_end,
            windows=windows,
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
    ) -> _ExperimentDefinition:
        canonical_definition = cast(dict[str, Any], _canonical_copy(definition))
        definition_hash = canonical_sha256(canonical_definition)
        holdout_key = canonical_sha256(
            {"snapshotId": snapshot.snapshot_id, "validationEndIndex": validation_end}
        )
        bars = snapshot_bars_to_ohlcv(
            snapshot.bars,
            market=snapshot.market,
            symbol=snapshot.symbol,
            timeframe=snapshot.timeframe,
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
        )

    def _evaluate_candidates(
        self,
        definition: _ExperimentDefinition,
        *,
        experiment_id: str,
        deadline: float,
    ) -> tuple[list[StrategyExperimentCandidateRecord], str | None, str]:
        records: list[StrategyExperimentCandidateRecord] = []
        guardrails = definition.definition["guardrails"]
        for candidate in definition.candidates:
            warmup = _warmup_bars(candidate.strategy)
            train = self._run_engine(
                candidate.strategy,
                list(definition.bars[: definition.train_end]),
                evaluation_start_index=warmup,
                definition=definition,
                deadline=deadline,
            )
            validation = self._run_engine(
                candidate.strategy,
                list(definition.bars[definition.train_end - warmup : definition.validation_end]),
                evaluation_start_index=warmup,
                definition=definition,
                deadline=deadline,
            )
            validation_metrics = metrics_to_payload(validation.metrics)
            maximum_drawdown = guardrails["maximumDrawdownPct"]
            eligible = validation.metrics.trade_count >= guardrails["minimumTradeCount"] and (
                maximum_drawdown is None or validation.metrics.max_drawdown_pct <= maximum_drawdown
            )
            records.append(
                StrategyExperimentCandidateRecord(
                    experiment_id=experiment_id,
                    candidate_id=candidate.candidate_id,
                    candidate_revision=candidate.strategy.revision,
                    parameters=candidate.parameters,
                    train_metrics=metrics_to_payload(train.metrics),
                    validation_metrics=validation_metrics,
                    test_metrics=None,
                    walk_forward=self._walk_forward(candidate.strategy, definition, deadline=deadline),
                    eligible=eligible,
                    rank=None,
                )
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
        if not ranked_indexes:
            return records, None, "no_eligible_candidate"

        selected_index = ranked_indexes[0]
        selected = definition.candidates[
            next(
                index
                for index, candidate in enumerate(definition.candidates)
                if candidate.candidate_id == records[selected_index].candidate_id
            )
        ]
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
        warmup = _warmup_bars(selected.strategy)
        test = self._run_engine(
            selected.strategy,
            list(definition.bars[definition.validation_end - warmup :]),
            evaluation_start_index=warmup,
            definition=definition,
            deadline=deadline,
        )
        records[selected_index] = replace(records[selected_index], test_metrics=metrics_to_payload(test.metrics))
        return records, records[selected_index].candidate_id, "selected"

    def _walk_forward(
        self,
        strategy: StrategyConfig,
        definition: _ExperimentDefinition,
        *,
        deadline: float,
    ) -> dict[str, Any]:
        windows: list[dict[str, Any]] = []
        validation_returns: list[float] = []
        validation_drawdowns: list[float] = []
        warmup = _warmup_bars(strategy)
        for index, (start, train_end, validation_end) in enumerate(definition.walk_forward_windows):
            train = self._run_engine(
                strategy,
                list(definition.bars[start:train_end]),
                evaluation_start_index=warmup,
                definition=definition,
                deadline=deadline,
            )
            validation = self._run_engine(
                strategy,
                list(definition.bars[train_end - warmup : validation_end]),
                evaluation_start_index=warmup,
                definition=definition,
                deadline=deadline,
            )
            train_metrics = metrics_to_payload(train.metrics)
            validation_metrics = metrics_to_payload(validation.metrics)
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
        deadline: float,
    ) -> BacktestRun:
        if self.monotonic() >= deadline:
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
        status: Literal["completed", "failed"],
        selected_candidate_id: str | None = None,
        completion_reason: str | None = None,
        result_hash: str | None = None,
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


def metrics_to_payload(metrics: BacktestMetrics) -> dict[str, int | float]:
    return {
        "totalReturnPct": metrics.total_return_pct,
        "annualReturnPct": metrics.annual_return_pct,
        "maxDrawdownPct": metrics.max_drawdown_pct,
        "winRatePct": metrics.win_rate_pct,
        "profitFactor": metrics.profit_factor,
        "tradeCount": metrics.trade_count,
    }


def strategy_experiment_detail_to_payload(detail: StrategyExperimentDetail) -> dict[str, Any]:
    payload = _record_to_payload(detail.experiment)
    payload["holdoutStatus"] = (
        "unconsumed"
        if detail.snapshot.test_definition_hash is None
        else "consumed"
        if detail.snapshot.test_definition_hash == detail.experiment.definition_hash
        else "consumed_by_other_definition"
    )
    payload["snapshot"] = {
        "snapshotId": detail.snapshot.snapshot_id,
        "createdAt": detail.snapshot.created_at.isoformat(),
        "market": detail.snapshot.market,
        "symbol": detail.snapshot.symbol,
        "timeframe": detail.snapshot.timeframe,
        "canonicalDataHash": detail.snapshot.canonical_data_hash,
        "rows": detail.snapshot.rows,
        "startAt": detail.snapshot.start_at,
        "endAt": detail.snapshot.end_at,
        "bars": detail.snapshot.bars,
        "testDefinitionHash": detail.snapshot.test_definition_hash,
        "testOwnerExperimentId": detail.snapshot.test_owner_experiment_id,
        "testConsumedAt": (
            detail.snapshot.test_consumed_at.isoformat() if detail.snapshot.test_consumed_at else None
        ),
    }
    payload["candidates"] = [
        {
            "candidateId": candidate.candidate_id,
            "candidateRevision": candidate.candidate_revision,
            "parameters": candidate.parameters,
            "trainMetrics": candidate.train_metrics,
            "validationMetrics": candidate.validation_metrics,
            "testMetrics": candidate.test_metrics,
            "walkForward": candidate.walk_forward,
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
        "errorCode": record.error_code,
        "errorDetail": record.error_detail,
    }


def _normalize_dimensions(
    strategy: StrategyConfig,
    dimensions: Sequence[ParameterDimension],
) -> tuple[ParameterDimension, ...]:
    if not isinstance(dimensions, (list, tuple)) or not dimensions:
        raise _invalid("At least one parameter dimension is required.")
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


def _dimensions_from_payload(value: Any) -> tuple[ParameterDimension, ...]:
    if not isinstance(value, list) or not value:
        raise _invalid("At least one parameter dimension is required.")
    dimensions: list[ParameterDimension] = []
    for item in value:
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


def _dimension_to_payload(dimension: ParameterDimension) -> dict[str, Any]:
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


def _normalize_assumptions(value: Any) -> dict[str, int | float]:
    if not isinstance(value, dict) or set(value) != {"initialCash", "feeBps", "slippageBps"}:
        raise _invalid("Backtest assumptions are invalid.")
    initial_cash = _finite_number(value.get("initialCash"), "Initial cash must be finite and positive.")
    fee_bps = _finite_number(value.get("feeBps"), "Fee basis points must be finite.")
    slippage_bps = _finite_number(value.get("slippageBps"), "Slippage basis points must be finite.")
    if initial_cash <= 0 or not 0 <= fee_bps <= 1_000 or not 0 <= slippage_bps <= 1_000:
        raise _invalid("Backtest assumptions are outside supported bounds.")
    return {
        "initialCash": _canonical_number(initial_cash),
        "feeBps": _canonical_number(fee_bps),
        "slippageBps": _canonical_number(slippage_bps),
    }


def _normalize_guardrails(value: Any) -> dict[str, int | float | None]:
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
    windows = [
        int(condition.params["window"])
        for condition in (*strategy.entry_conditions, *strategy.exit_conditions)
        if "window" in condition.params
    ]
    return max(windows, default=0) + 1


def _result_hash(
    _definition_hash: str,
    candidates: list[StrategyExperimentCandidateRecord],
    *,
    selected_candidate_id: str | None,
    completion_reason: str,
) -> str:
    ordered = sorted(candidates, key=lambda candidate: canonical_json(candidate.parameters))
    selected = next(
        (candidate for candidate in ordered if candidate.candidate_id == selected_candidate_id),
        None,
    )
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
            "selection": (
                {"parameters": selected.parameters, "testMetrics": selected.test_metrics}
                if selected is not None
                else None
            ),
            "completionReason": completion_reason,
            "schemaVersion": RESULT_SCHEMA_VERSION,
        }
    )


def _required_string(value: Any) -> str:
    if not isinstance(value, str) or not value.strip():
        raise _invalid("Strategy revision and source run ID are required.")
    return value.strip()


def _exact_int(value: Any) -> int | None:
    return value if isinstance(value, int) and not isinstance(value, bool) else None


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
