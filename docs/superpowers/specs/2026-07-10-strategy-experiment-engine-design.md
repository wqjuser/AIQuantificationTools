# Strategy Experiment Engine Design

## Status

Approved design for the Stage 2 Strategy and Backtest development phase. It adds reproducible, persisted parameter experiments on top of the existing strategy library, audited research runs, and deterministic `BacktestEngine`.

## Problem

AIQuantificationTools can save strategy revisions and run a deterministic single-symbol backtest. The web client also performs local SMA, RSI, and volume parameter scans. Those scans are useful previews, but they are not authoritative experiments: their definitions and candidate results are not persisted together, they do not reserve a reusable out-of-sample boundary, and the frontend simulation can diverge from the backend engine.

Two existing storage details also matter:

- `ResearchRunStore` can overwrite or delete a run during import and undo operations, so a run ID alone is not an immutable experiment input.
- Legacy data snapshot hashes were calculated before persistence normalization. Their stored bars cannot reproduce the old hash byte for byte.

The next phase must therefore create its own immutable, content-addressed experiment evidence and introduce one canonical snapshot/hash contract. It must not add another optimizer UI on top of the current preview.

## Goals

- Run bounded parameter experiments through the existing backend `BacktestEngine`.
- Bind each experiment to a verified strategy body and a content-addressed copy of an audited data snapshot.
- Use chronological train, validation, and test partitions without candidate selection seeing test results.
- Prevent a revealed test holdout from being reused by a different experiment definition.
- Persist definitions, candidate evidence, the selected test result, and deterministic hashes in SQLite.
- Upgrade the existing Backtest parameter-scan section into the authoritative experiment UI.
- Feed Backtest report and AI evidence summaries from persisted experiment evidence instead of the frontend simulator.
- Preserve strategy audit and promotion gates. An experiment never audits or promotes a strategy automatically.

## Non-Goals

- A generic strategy DSL or new condition kinds.
- Multi-symbol or portfolio optimization.
- Genetic, Bayesian, or AI-selected parameters.
- Distributed execution, a worker queue, cancellation, or progress streaming.
- Automatic paper or live promotion.
- A general frontend workbench refactor.
- A new third-party dependency.

## Stage Gate

The implementation begins by recording the already-completed Stage 1 exit in `docs/product-plan.md` and making Stage 2 the current product stage. Stage 1 becomes maintenance-only and its existing acceptance remains a regression gate. This stage change is part of the same commit series; Stage 2 feature work must not land while the product plan still says Stage 2 is frozen.

## User-Visible Outcome

The current Backtest parameter-scan section becomes one Strategy Experiment panel. A user selects a saved strategy revision and a compatible audited research run, chooses bounded values for existing SMA, RSI, or volume condition parameters, reviews explicit validation settings, and starts the experiment.

The completed view shows:

- immutable strategy, source-run, snapshot, market, symbol, timeframe, and cost bindings;
- train and validation metrics for every candidate;
- eligibility, deterministic rank, and optional walk-forward stability evidence;
- the final test result for only the selected candidate;
- holdout-consumption status, history, JSON export, exact replay, and Load into draft;
- reproducibility through `definitionHash` and `resultHash`.

Loading a candidate changes only the current Strategy editor draft. Saving uses the existing validation and `/api/strategies` path to create the normal immutable revision. The source strategy's audit state is not inherited.

## Architecture

```text
strategy library record + audited research run
                    |
                    v
       canonical strategy/snapshot verification
                    |
                    v
       content-addressed snapshot store
                    |
                    v
         StrategyExperimentRunner
          |                    |
          v                    v
 existing BacktestEngine   canonical hashes
                    |
                    v
         StrategyExperimentStore
                    |
                    v
       three HTTP routes + existing panel
```

### Canonical Snapshot Contract

New research runs add `hashVersion: "aiqt-data-v2"`. Version 2 normalizes snapshot bars first and then calculates a full SHA-256 hash from canonical bar JSON. The same normalizer is used during research-run creation, persistence, import validation, and experiment ingestion.

Legacy runs without `aiqt-data-v2` remain readable and exportable, but they cannot start an experiment. The UI and `409 source_snapshot_reaudit_required` response direct the user to run the research pipeline again. Existing audit artifacts are not silently rewritten.

### Canonical Strategy Binding

A single pure converter turns the repository's camelCase strategy payload into `StrategyConfig`. Before an experiment runs, the backend reconstructs and hashes both the strategy-library body and the source run's embedded strategy body. Their recomputed revisions and canonical bodies must match each other, the library record key, and the source run's `strategyRevision`.

The runner never trusts an imported external revision without recomputing it. `StrategyConfig.from_json` is not used directly because the stored payload contract is camelCase.

### StrategyExperimentRunner

The runner owns request validation, candidate expansion, chronological partitioning, bounded execution, deterministic ranking, holdout protection, the single final test, optional walk-forward evidence, and result hashing. It reuses `StrategyConfig`, `OHLCVBar`, `BacktestMetrics`, and `BacktestEngine`; it does not duplicate indicator or execution logic.

`BacktestEngine` gains one optional evaluation-start argument so preceding bars can warm indicators while trades remain blocked before a partition begins. Metrics and annualization start at the evaluation boundary. Existing callers retain current behavior when the argument is absent.

### StrategyExperimentStore

The store follows existing SQLite store patterns and owns three tables: content-addressed snapshots, experiments, and candidates. It owns schema initialization, insert-or-read snapshot deduplication, atomic writes, immutable reads, holdout lookups, and recent-history queries.

Completed experiments and candidates are inserted in one transaction. Failed executions create only a failed experiment record. Snapshot content, completed experiments, and candidates have no update or delete API; only the snapshot row's write-once holdout claim can change after insertion.

### HTTP and UI Integration

The existing HTTP server owns trust-boundary validation. A synchronous experiment request stays synchronous to its caller, while the server uses the standard-library `ThreadingHTTPServer` so health and read requests remain responsive. The existing frontend API client, parameter table, staging behavior, localization, and download helper are reused.

## Snapshot Eligibility and Content Addressing

For a new experiment, the backend loads the strategy record and source run, then verifies:

1. Both records exist.
2. Both canonical strategy bodies produce the requested revision.
3. Strategy and run market, symbol, and timeframe agree.
4. The source run contains a complete, non-empty `aiqt-data-v2` snapshot.
5. Snapshot row count equals the stored bar count, with at most 500 bars.
6. Timestamps are parseable, unique, and strictly chronological after sorting.
7. OHLCV values are finite, prices are positive, volume is non-negative, and high/low relationships are valid.
8. A fresh canonical bar hash equals the stored v2 hash.

After verification:

- `canonicalDataHash` is the full SHA-256 hash of canonical bar JSON.
- `snapshotId` is the full SHA-256 hash of canonical JSON containing market, symbol, timeframe, and `canonicalDataHash`.
- `strategy_experiment_snapshots` inserts the normalized bars only when `snapshotId` is new.
- Reusing an existing `snapshotId` requires its context, hash, row count, and bars JSON to match exactly.

The experiment stores `sourceRunId` for provenance and `snapshotId` for replay. Later source-run overwrite or deletion cannot change an experiment.

## Experiment Definition

The normalized immutable definition contains:

- canonical base strategy JSON and `strategyRevision`;
- `sourceRunId`, `snapshotId`, and `canonicalDataHash`;
- backend-derived market, symbol, and timeframe;
- `assumptions`: `initialCash`, `feeBps`, and `slippageBps`;
- fixed chronological split percentages `60`, `20`, and `20`;
- parameter dimensions;
- visible guardrails;
- optional walk-forward settings;
- `engineVersion: "backtest-v1"` and `resultSchemaVersion: 1`.

`initialCash` must be finite and positive. Fee and slippage must each be finite and between 0 and 1,000 basis points. `minimumTradeCount` must be a non-negative integer. `maximumDrawdownPct`, when present, must be finite and between 0 and 100.

The visible defaults are `minimumTradeCount: 2` and no maximum drawdown. The count uses existing `BacktestMetrics.trade_count` execution-event semantics. There are no hidden score thresholds.

## Supported Parameter Dimensions

Dimensions target only existing engine parameters:

- `window` on `close_above_sma` and `close_below_sma`;
- `window` on `volume_above_sma`;
- `window` and `threshold` on `rsi_below` and `rsi_above`.

Each dimension identifies an entry or exit condition by zero-based index. Windows are integers from 1 through 250. RSI thresholds are finite numbers from 0 through 100. A dimension is invalid when the condition does not support it, its values are empty, a value is outside the range, or two dimensions target the same condition parameter.

Dimensions are sorted by condition side, condition index, and parameter name. Values are numerically normalized, deduplicated, and sorted. The Cartesian product is then deduplicated and must contain between 1 and 81 candidates.

The base strategy remains unchanged. Each candidate receives a derived `StrategyConfig` and revision without being written to the strategy library.

## Execution Budget

Synchronous execution is bounded by all of these hard limits:

- at most 500 source bars;
- at most 81 candidates;
- at most 12 walk-forward windows;
- at most 512 total backtest evaluations;
- a 15-second monotonic deadline checked before each evaluation.

For `C` candidates and `W` walk-forward windows, the conservative evaluation count is `2C + 2CW + 1`: train and validation for every candidate, train and validation for every walk-forward window, and one possible final test. Requests above 512 are rejected before execution.

Crossing the deadline records a failed experiment with `experiment_timeout` and no candidate rows. The standard-library threaded server prevents that bounded request from blocking health probes or unrelated reads; it is not a task queue.

A client disconnect does not cancel execution. The server finishes and persists the completed or failed experiment, and the user can recover it from history. Failure while writing the HTTP response does not rewrite a completed experiment as failed.

## Execution Semantics

### Chronological Partitions

For `n` sorted bars:

- training ends before index `floor(n * 0.60)`;
- validation ends before index `floor(n * 0.80)`;
- test contains the remaining bars.

All partitions must be non-empty. `warmupBars` is the largest candidate indicator window plus one bar, covering SMA and RSI behavior. Training must contain at least `warmupBars` plus one evaluation bar.

Validation and test prepend exactly `warmupBars` from preceding history. Cash remains unchanged and orders remain suppressed until the evaluation boundary. Metrics and annualization use only evaluation bars. Every partition starts with fresh cash and no position, and any open position closes at the partition end.

### Candidate Selection

Every candidate runs on training and validation. Training metrics are diagnostic and do not change rank. A candidate is eligible only when validation metrics satisfy the explicit guardrails.

Eligible candidates are ranked using the persisted, engine-rounded metrics in this exact order:

1. validation total return, descending;
2. validation maximum drawdown, ascending;
3. validation profit factor, descending;
4. canonical candidate ID, ascending.

Ineligible candidates remain visible without rank. If none is eligible, the experiment completes with `selectedCandidateId: null`, `completionReason: "no_eligible_candidate"`, and no test result.

Only the highest-ranked eligible candidate runs on test, exactly once. No other candidate receives test metrics.

### Optional Walk-Forward Evidence

Walk-forward is off by default. When enabled, positive `trainBars`, `validationBars`, and `stepBars` are required. The first window starts at the first bar, validation immediately follows training, and each later window advances by `stepBars`. Complete windows are generated only inside the combined training and validation region. The final test region remains untouched.

Each candidate receives train and validation metrics for each window plus validation window count, positive-return count, median return, and worst drawdown. These values are evidence only and do not change holdout rank.

### Test Holdout Consumption

`holdoutKey` is the SHA-256 hash of `snapshotId` plus the fixed test boundary. The holdout remains unconsumed until an eligible selected candidate is ready to access test bars.

Request validation first rejects an existing claim for another definition before candidate execution. For an unclaimed holdout, immediately before the selected candidate can access test bars, the store starts `BEGIN IMMEDIATE` and atomically checks the snapshot row's write-once `test_definition_hash` again. An empty claim is set to the current `definitionHash`; an equal claim permits exact replay; a different claim returns `409`. This second check serializes racing requests before either can evaluate test. A claim made before a test-time failure remains consumed because test access may already have occurred, but the same definition can retry. Failures before the claim and no-eligible-candidate experiments do not consume test.

- An exact replay with the same `definitionHash` is allowed and must create a new experiment ID.
- A different definition can never access consumed test bars: an existing claim fails during request validation, while a concurrent loser fails at the atomic claim.
- A no-eligible-candidate experiment does not consume test because it never evaluates test.
- Testing a revised definition requires a new audited v2 snapshot, normally produced by rerunning research with newer data.

This applies across strategy revisions so saving a test-informed candidate cannot silently reuse the same test bars.

## Canonical JSON and Hashes

All experiment hashes use UTF-8 JSON with sorted object keys, compact separators, preserved semantic array order, and non-finite numbers rejected. Numeric normalization converts negative zero to zero and integral floats to integers. Dimension values, candidates, and walk-forward windows use the deterministic orders defined above.

- `candidateId`: first 12 hexadecimal characters of SHA-256 over the canonical parameter patch.
- `definitionHash`: full SHA-256 over the canonical definition, including base strategy, snapshot binding, assumptions, split, dimensions, guardrails, engine version, and result schema version.
- `resultHash`: full SHA-256 over `definitionHash`, candidates ordered by candidate ID, each candidate's parameter patch and persisted train/validation/walk-forward metrics, selected candidate ID, selected test metrics, completion reason, and result schema version.

Candidate/result hashes contain metrics only; they do not claim to hash trade or equity arrays that the experiment does not persist. Experiment ID, timestamps, storage status, and presentation text are excluded.

## Persistence Model

### `strategy_experiment_snapshots`

- `snapshot_id` primary key
- `created_at`
- `market`, `symbol`, `timeframe`
- `canonical_data_hash`
- `rows`, `start_at`, `end_at`
- `bars_json`
- nullable write-once `test_definition_hash`
- nullable `test_owner_experiment_id` and `test_consumed_at`

Snapshot content is insert-only and deduplicated by `snapshot_id`. Holdout claim fields can transition only from null to one definition and are guarded by an immediate transaction; exact replay reads but does not replace the claim.

### `strategy_experiments`

- `experiment_id` primary key
- `created_at`
- `status`: `completed` or `failed`
- `definition_hash`
- `holdout_key`
- `strategy_revision`
- `source_run_id`
- `snapshot_id`
- `market`, `symbol`, `timeframe`
- `definition_json`
- `evaluation_count`
- nullable `selected_candidate_id`
- nullable `completion_reason`
- nullable `result_hash`
- nullable stable `error_code` and sanitized `error_detail`

### `strategy_experiment_candidates`

- composite primary key: `experiment_id`, `candidate_id`
- `candidate_revision`
- `parameters_json`
- `train_metrics_json`
- `validation_metrics_json`
- nullable `test_metrics_json`
- `walk_forward_json`
- `eligible`
- nullable `rank`

Indexes on strategy revision/source run/creation time support history. The snapshot primary key plus its atomic claim fields enforce holdout ownership. A rerun inserts another immutable experiment.

## HTTP Contract

### `POST /api/strategy-experiments`

Two mutually exclusive request modes are supported:

- New experiment: `strategyRevision`, `sourceRunId`, assumptions, dimensions, guardrails, and optional walk-forward settings.
- Exact replay: `replayOfExperimentId` only. The backend reloads the prior immutable definition, base strategy, and content-addressed snapshot.

The endpoint rejects client-supplied bars, strategy bodies, metrics, ranks, selections, or hashes. A successful synchronous execution returns `201` with `{ "experiment": ... }`. Exact replay creates a new ID and is permitted by the existing same-definition holdout claim.

### `GET /api/strategy-experiments`

Returns `{ "experiments": [...] }` in reverse creation order. Optional `strategyRevision`, `sourceRunId`, and bounded `limit` filters are supported. List items include definition context, status, selected summary, holdout status, hashes, and failure summary. Candidate arrays and snapshot bars are omitted.

### `GET /api/strategy-experiments/{experimentId}`

Returns the full immutable definition, candidate evidence, and content-addressed snapshot bars for review/export, or `404` when absent.

No staging or export route is added. Loading a candidate uses existing draft behavior. Export serializes the detail response with the existing browser download helper.

## Failure Handling

- `400 invalid_strategy_experiment`: malformed assumptions, unsupported dimensions, invalid guardrails, fixed-split violation, insufficient partitions, source over 500 bars, invalid walk-forward, or an execution budget over 512. Invalid requests are not persisted.
- `404 strategy_not_found`, `research_run_not_found`, or `strategy_experiment_not_found`: an identifier is absent. New requests are not persisted.
- `409 source_snapshot_reaudit_required`: a legacy snapshot lacks the v2 canonical contract.
- `409 strategy_experiment_conflict`: canonical strategy bodies, revisions, context, rows, v2 snapshot hash, or an existing content-addressed snapshot disagree.
- `409 test_holdout_consumed`: a different definition attempts to reuse revealed test bars.
- `500 strategy_experiment_failed`: an unexpected runner, timeout, or persistence failure after trust validation. The response includes an experiment ID when a failed record was saved. Stack traces and raw database errors are never returned.

The UI keeps the last successful result visible when a later request fails and shows the stable error plus actionable detail. Running state is client-local; there is no persisted queued/running state.

## Frontend and Evidence Migration

The existing Parameter Sensitivity section is upgraded in place; a second scan table is not added. Existing table styling, candidate staging, localization, and report-download helpers are reused.

The panel has four compact areas:

1. Context/configuration: verified revision, run, v2 snapshot, assumptions, fixed split, dimensions, guardrails, optional walk-forward, and budget count.
2. Run/history: Run experiment plus recent immutable experiments for the active strategy/run.
3. Candidate comparison: parameters, train/validation evidence, eligibility, rank, and optional stability.
4. Final evidence: selected test metrics, holdout status, hashes, Export JSON, Exact replay, and Load into draft.

The current pure-frontend parameter simulator stops being an evidence source. Backtest Markdown and AI dossier parameter citations consume the latest completed experiment matching the active strategy revision and source run. Without one, they show “persisted experiment required” instead of calculating an automatic scan. This is an evidence-source migration, not a new Stage 3 AI capability.

## Testing Strategy

### Canonical Contracts

- v2 normalization and hash equality across creation, persistence, import, and experiment ingestion;
- legacy snapshot rejection without rewriting old artifacts;
- snapshot content-address deduplication and collision/mismatch rejection;
- camelCase strategy conversion, recomputed revision, body equality, and imported-revision rejection;
- byte-level canonical JSON cases for `1`, `1.0`, negative zero, ordering, and non-finite values.

### Runner and Store

- candidate expansion, deterministic IDs, deduplication, supported ranges, and 81 limit;
- 500-bar, 512-evaluation, 12-window, and timeout boundaries;
- exact chronological splits, no overlap, warm-up, suppressed pre-boundary trades, and isolated positions;
- guardrails, deterministic rank, no-eligible behavior, and selected-only test execution;
- walk-forward construction and summaries;
- holdout consumption, different-definition rejection, and exact-replay allowance;
- concurrent holdout claims proving only one definition can access test;
- deterministic definition/result hashes;
- atomic complete/failed persistence, snapshot reuse, immutability, ordering, and detail reads.

### API and Frontend

- new/replay POST modes, filtered list, detail/export, and all error contracts;
- rejection of client-supplied evidence fields;
- health/read responsiveness while a bounded experiment runs;
- idle, running, completed, no-eligible, legacy-source, holdout-consumed, and failed UI states;
- candidate loading without inherited audit status;
- frontend preview retirement and persisted experiment use in Backtest report and AI citations;
- last successful result preservation after failure.

## Acceptance

The phase is complete only when all of these are true:

1. Product plan and UI stage metadata show Stage 1 complete/maintenance and Stage 2 current.
2. A newly audited v2 research run produces a content-addressed snapshot and persisted multi-candidate experiment.
3. Reusing the same snapshot stores one snapshot row, not one bars copy per experiment.
4. Strategy body, revision, run context, and v2 snapshot hash are verified before execution.
5. Selection uses validation only, and only the selected candidate has test evidence.
6. Sequential or concurrent different definitions cannot reuse consumed test bars; exact replay creates a new ID.
7. Exact replay on unchanged code/input produces the same `definitionHash` and `resultHash`.
8. Candidate loading creates an unaudited draft and never changes paper/live gates.
9. The existing frontend-only scan no longer supplies Backtest report or AI evidence.
10. Focused backend/frontend tests, full Python tests, full web tests, and production build pass.
11. A rebuilt Docker deployment with the existing volume creates a fresh v2 run and completes one API-to-UI experiment while health remains responsive.
12. Current Stage 1 acceptance commands still pass after the rebuild.

## Delivery Boundary

This is one coherent Stage 2 phase: canonical snapshot/revision contracts, content-addressed persistence, bounded backend experiments, three HTTP routes, an in-place Backtest UI upgrade, evidence migration, and end-to-end verification. It stops before a generic strategy language, portfolio optimization, AI parameter recommendations, or asynchronous execution.
