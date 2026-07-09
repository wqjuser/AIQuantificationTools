# Strategy Experiment Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Stage 2's authoritative, reproducible single-symbol strategy experiment workflow from canonical audited inputs through persisted backend results, in-place Backtest UI, evidence exports, Docker acceptance, and Stage 1 regression verification.

**Architecture:** Add one shared canonical contract for v2 snapshots and strategy bodies, run all candidates through the existing `BacktestEngine`, and persist deduplicated snapshots plus immutable experiments/candidates in SQLite. Expose three HTTP routes, replace the frontend-only parameter simulator in place, and keep the request synchronous but bounded and health-safe through `ThreadingHTTPServer`.

**Tech Stack:** Python 3.12 standard library, SQLite, `unittest`, React 19, TypeScript 5.9, Vitest 4, Vite 8, Docker Compose.

**Design:** `docs/superpowers/specs/2026-07-10-strategy-experiment-engine-design.md`

## Global Constraints

- No new third-party dependency, task queue, state library, download service, optimizer framework, or migration framework.
- V1 stays single-symbol and supports only current SMA, RSI, and volume condition parameters.
- New research snapshots use `hashVersion: "aiqt-data-v2"` and a full canonical SHA-256; legacy snapshots stay readable but cannot start experiments.
- Fixed split is 60% train, 20% validation, 20% test; candidate selection never reads test.
- Limits are 500 bars, 81 candidates, 12 walk-forward windows, 512 evaluations, and a 15-second monotonic deadline.
- A test holdout is atomically bound to one `definitionHash`; only exact replay may reuse it.
- Experiments never inherit audit state, submit orders, enable live trading, or bypass existing paper/live gates.
- Existing Stage 1 acceptance remains a required regression gate.
- Use RED/GREEN for every behavior task and commit after each independently reviewable deliverable.

## File Structure

### Create

- `services/quant_core/quant_core/canonical.py` — canonical JSON, v2 snapshot normalization/hash, content address, and camelCase strategy codec.
- `services/quant_core/quant_core/strategy_experiment_store.py` — three SQLite tables, immutable reads/writes, snapshot deduplication, and atomic holdout claims.
- `services/quant_core/quant_core/strategy_experiments.py` — request normalization, candidate expansion, bounded execution, ranking, walk-forward, replay, and result hashing.
- `services/quant_core/tests/test_strategy_experiments.py` — focused backend, store, runner, and HTTP contract tests.
- `apps/web/src/components/StrategyExperimentSection.tsx` — presentational replacement for the current parameter-scan section.

### Modify

- `services/quant_core/quant_core/backtest.py` — optional evaluation boundary for indicator warm-up.
- `services/quant_core/quant_core/research.py` — generate v2 snapshots and use the shared strategy codec.
- `services/quant_core/quant_core/runs.py` — persist/import legacy and v2 snapshots without rewriting legacy evidence.
- `services/quant_core/quant_core/strategy_library.py` — use the shared strategy serializer while preserving imported revisions.
- `services/quant_core/quant_core/strategy_validation.py` — use the shared strategy serializer.
- `services/quant_core/quant_core/api.py` — experiment store, routes, stable errors, and threaded server.
- `services/quant_core/tests/test_quant_core.py` — stage/Docker script contract tests only; experiment tests stay in the focused file.
- `apps/web/src/lib/terminal-api.ts` and `apps/web/src/lib/terminal-api.test.ts` — typed experiment HTTP client and validators.
- `apps/web/src/lib/terminal-workbench.ts` and `apps/web/src/lib/terminal-workbench.test.ts` — experiment domain/view models, staging, reports, and AI evidence.
- `apps/web/src/App.tsx` — experiment history/detail/run/replay/export state and actions.
- `apps/web/src/lib/i18n.ts` and `apps/web/src/lib/i18n.test.ts` — bilingual experiment copy.
- `apps/web/src/styles.css` and `apps/web/src/lib/layout-css.test.js` — in-place experiment layout and responsive checks.
- `tools/docker_smoke.py`, `package.json`, and `apps/web/src/lib/deployment.test.js` — repeatable Stage 2 container acceptance.
- `docs/product-plan.md` and `docs/architecture.md` — Stage 1 exit, Stage 2 current status, and final architecture.

---

### Task 1: Open the Stage 2 Gate

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts` (`productDevelopmentStageDefinitions`)
- Test: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `docs/product-plan.md`
- Modify: `docs/architecture.md`

**Interfaces:**
- Consumes: existing `buildProductDevelopmentStages()` and `ProductDevelopmentStageStatus`.
- Produces: exactly one current stage, `strategy-backtest`; Stage 1 remains visible as maintenance.

- [ ] **Step 1: Write the failing stage-gate test**

Add this assertion beside the existing delivery-stage tests:

```ts
test("opens Stage 2 after the Stage 1 exit", () => {
  const stages = buildProductDevelopmentStages();
  const areas = buildProductWorkAreas(buildTerminalWorkspace());
  expect(stages.filter((stage) => stage.status === "current").map((stage) => stage.id)).toEqual([
    "strategy-backtest"
  ]);
  expect(stages.find((stage) => stage.id === "market-research")?.status).toBe("maintenance");
  expect(stages.find((stage) => stage.id === "strategy-backtest")?.status).toBe("current");
  expect(areas.find((area) => area.id === "market")?.deliveryStageStatus).toBe("maintenance");
  expect(areas.find((area) => area.id === "strategy")?.deliveryStageStatus).toBe("current");
  expect(areas.find((area) => area.id === "backtest")?.deliveryStageStatus).toBe("current");
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "opens Stage 2"
```

Expected: FAIL because Stage 1 is still `current` and Stage 2 is `planned`.

- [ ] **Step 3: Change only the two stage definitions**

Set these exact statuses and focus text:

```ts
{
  id: "market-research",
  label: "Stage 1 · A-share P0 Golden Path",
  status: "maintenance",
  focus: "Preserve the accepted market and research golden path as a regression gate while Stage 2 ships."
}

{
  id: "strategy-backtest",
  label: "Stage 2 · Strategy and Backtest",
  status: "current",
  focus: "Ship canonical, persisted, holdout-safe strategy experiments from audited single-symbol evidence."
}
```

Set Stage 1 `workAreaIds` to `market` and `research`; keep the existing per-area `deliveryStageId` mapping, which already maps Strategy and Backtest to Stage 2. Update Stage 2 exit criteria to require v2 snapshot binding, deterministic replay hashes, selected-only test evidence, and candidate loading as a new unaudited draft.

- [ ] **Step 4: Record the stage transition in the two docs**

In `docs/product-plan.md`, replace the “Stage 1 only” rule with:

```markdown
- Stage 1 · Market and Research: accepted and maintenance-only; all existing acceptance commands remain regression gates.
- Stage 2 · Strategy and Backtest: current; new work is limited to the approved Strategy Experiment Engine design.
```

In `docs/architecture.md`, add one short Stage 2 section naming the canonical snapshot, experiment runner, content-addressed store, and existing Backtest workspace as the active boundary.

- [ ] **Step 5: Run the focused test and commit**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "opens Stage 2"
```

Expected: PASS.

Commit:

```bash
git add apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts docs/product-plan.md docs/architecture.md
git commit -m "docs: open stage2 strategy experiments"
```

---

### Task 2: Add Canonical V2 Snapshot and Strategy Contracts

**Files:**
- Create: `services/quant_core/quant_core/canonical.py`
- Modify: `services/quant_core/quant_core/research.py`
- Modify: `services/quant_core/quant_core/runs.py`
- Modify: `services/quant_core/quant_core/strategy_library.py`
- Modify: `services/quant_core/quant_core/strategy_validation.py`
- Test: `services/quant_core/tests/test_strategy_experiments.py`

**Interfaces:**
- Produces: `DATA_SNAPSHOT_HASH_VERSION`, `canonical_json`, `canonical_sha256`, `normalize_snapshot_bars`, `canonical_data_hash`, `canonical_snapshot_id`, `snapshot_bars_to_ohlcv`, `strategy_config_to_payload`, and `strategy_config_from_payload`.
- Consumed by: Tasks 4–7 and existing research/export/import paths.

- [ ] **Step 1: Create focused failing tests for byte stability and strategy revision recomputation**

Start `test_strategy_experiments.py` with `unittest` tests covering these exact cases:

```python
class CanonicalContractTests(unittest.TestCase):
    def test_canonical_json_normalizes_integral_float_and_negative_zero(self):
        self.assertEqual(canonical_json({"b": -0.0, "a": 1.0}), '{"a":1,"b":0}')

    def test_v2_snapshot_hash_survives_persistence_normalization(self):
        bars = normalize_snapshot_bars([snapshot_bar("2026-07-01T00:00:00+00:00", 100.0)])
        self.assertEqual(len(canonical_data_hash(bars)), 64)
        self.assertEqual(canonical_data_hash(json.loads(json.dumps(bars))), canonical_data_hash(bars))

    def test_strategy_payload_recomputes_revision_instead_of_trusting_external_value(self):
        payload = strategy_payload(revision="external-revision")
        strategy = strategy_config_from_payload(payload)
        self.assertNotEqual(strategy.revision, "external-revision")
        self.assertEqual(strategy_config_to_payload(strategy)["revision"], strategy.revision)
```

Define local `snapshot_bar()` and `strategy_payload()` fixture helpers in the test file with one A-share symbol, SMA entry/exit, and complete risk fields.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -p 'test_strategy_experiments.py' -v
```

Expected: import failure for `quant_core.canonical`.

- [ ] **Step 3: Implement canonical JSON and snapshot functions**

Create `canonical.py` with this public surface and normalization rules:

```python
DATA_SNAPSHOT_HASH_VERSION = "aiqt-data-v2"
MAX_SNAPSHOT_BARS = 500

def _canonical_value(value: Any) -> Any:
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError("canonical_number_must_be_finite")
        if value == 0:
            return 0
        return int(value) if value.is_integer() else value
    if isinstance(value, list) or isinstance(value, tuple):
        return [_canonical_value(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _canonical_value(item) for key, item in value.items()}
    return value

def canonical_json(value: Any) -> str:
    return json.dumps(_canonical_value(value), ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)

def canonical_sha256(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()

def canonical_data_hash(bars: list[dict[str, Any]]) -> str:
    return canonical_sha256(bars)

def canonical_snapshot_id(*, market: str, symbol: str, timeframe: str, canonical_data_hash: str) -> str:
    return canonical_sha256(
        {
            "market": market,
            "symbol": symbol,
            "timeframe": timeframe,
            "canonicalDataHash": canonical_data_hash,
        }
    )
```

`_canonical_value()` must recursively sort object keys through `json.dumps`, preserve list order, reject non-finite floats, convert `-0.0` to `0`, and convert integral floats to integers. `normalize_snapshot_bars()` must normalize timestamps to UTC ISO strings, derive `timestampMs`, sort by timestamp, reject duplicates, enforce positive OHLC prices, non-negative volume, valid high/low relationships, and the 500-row cap. `snapshot_bars_to_ohlcv()` must attach the trusted market/symbol/timeframe rather than reading them from bar rows.

- [ ] **Step 4: Implement the shared strategy codec**

Move the current serializer semantics from `research.py` into `canonical.py`. The decoder must build domain objects rather than retain the supplied revision:

```python
def strategy_config_from_payload(payload: dict[str, Any]) -> StrategyConfig:
    risk = payload.get("risk") if isinstance(payload.get("risk"), dict) else {}
    return StrategyConfig(
        name=str(payload.get("name") or "Imported strategy"),
        market=str(payload.get("market") or "ashare"),
        symbols=[str(symbol) for symbol in payload.get("symbols", [])],
        timeframe=str(payload.get("timeframe") or "1d"),
        entry_conditions=_conditions(payload.get("entryConditions", payload.get("entry_conditions", []))),
        exit_conditions=_conditions(payload.get("exitConditions", payload.get("exit_conditions", []))),
        risk=RiskRules(
            position_pct=float(risk.get("positionPct", risk.get("position_pct", 1.0))),
            stop_loss_pct=_optional_float(risk.get("stopLossPct", risk.get("stop_loss_pct"))),
            take_profit_pct=_optional_float(risk.get("takeProfitPct", risk.get("take_profit_pct"))),
            max_drawdown_pct=_optional_float(risk.get("maxDrawdownPct", risk.get("max_drawdown_pct"))),
        ),
        version=int(payload.get("version") or 1),
    )

def _conditions(value: Any) -> list[Condition]:
    if not isinstance(value, list) or not value:
        raise ValueError("strategy_conditions_required")
    conditions: list[Condition] = []
    for item in value:
        if not isinstance(item, dict) or not isinstance(item.get("params"), dict):
            raise ValueError("strategy_condition_invalid")
        conditions.append(Condition(kind=str(item.get("kind") or ""), params=dict(item["params"])))
    return conditions

def _optional_float(value: Any) -> float | None:
    if value is None:
        return None
    number = float(value)
    if not math.isfinite(number):
        raise ValueError("strategy_risk_must_be_finite")
    return number
```

Validate one symbol, supported market/timeframe values, condition objects, finite risk values, and required condition parameters before returning.

- [ ] **Step 5: Route new and imported snapshots through the shared contract**

In `research._data_snapshot_payload()`, normalize first and then emit:

```python
normalized_bars = normalize_snapshot_bars(bars)
snapshot = {
    "source": quality.source,
    "isComplete": quality.is_complete,
    "warnings": list(quality.warnings),
    "rows": len(normalized_bars),
    "start": normalized_bars[0]["timestamp"] if normalized_bars else None,
    "end": normalized_bars[-1]["timestamp"] if normalized_bars else None,
    "hashVersion": DATA_SNAPSHOT_HASH_VERSION,
    "hash": canonical_data_hash(normalized_bars),
    "bars": normalized_bars,
}
if preparation_evidence:
    snapshot["preparationEvidence"] = dict(preparation_evidence)
if market_calendar:
    snapshot["marketCalendar"] = dict(market_calendar)
return snapshot
```

In `runs._normalize_data_snapshot()`, preserve a missing legacy version. When the version is v2, normalize bars and require the stored full hash to equal `canonical_data_hash(normalized_bars)`. In `_validate_manifest_consistency()`, perform the same fresh v2 check in addition to the existing manifest/snapshot equality. Do not rewrite legacy hashes.

Update `research.py`, `strategy_library.py`, and `strategy_validation.py` imports to use `canonical.strategy_config_to_payload`; delete the duplicate serializer from `research.py`. Keep `StrategyLibraryStore.save_payload()` behavior unchanged so imported revisions remain restorable.

- [ ] **Step 6: Add legacy/v2 persistence and import tests**

Add tests proving:

```python
self.assertNotIn("hashVersion", store.get("legacy-run").data_snapshot)
self.assertEqual(store.get("v2-run").data_snapshot["hashVersion"], "aiqt-data-v2")
with self.assertRaisesRegex(ValueError, "data_snapshot_hash_mismatch"):
    research_run_import_to_audit(tampered_v2_package)
```

- [ ] **Step 7: Run focused and existing snapshot tests, then commit**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -p 'test_strategy_experiments.py' -v
npm run test:python
```

Expected: all canonical tests and the existing Python suite pass.

Commit:

```bash
git add services/quant_core/quant_core/canonical.py services/quant_core/quant_core/research.py services/quant_core/quant_core/runs.py services/quant_core/quant_core/strategy_library.py services/quant_core/quant_core/strategy_validation.py services/quant_core/tests/test_strategy_experiments.py
git commit -m "feat: canonicalize strategy experiment inputs"
```

---

### Task 3: Add the Backtest Evaluation Boundary

**Files:**
- Modify: `services/quant_core/quant_core/backtest.py`
- Test: `services/quant_core/tests/test_strategy_experiments.py`

**Interfaces:**
- Produces: `BacktestEngine.run(strategy, bars, *, evaluation_start_index: int = 0)`.
- Consumed by: the experiment runner in Task 5; all current callers remain unchanged.

- [ ] **Step 1: Write failing warm-up isolation tests**

Add tests using bars that satisfy the entry rule before the boundary and again after it:

```python
result = BacktestEngine().run(strategy, bars, evaluation_start_index=5)
self.assertTrue(all(trade.timestamp >= bars[5].timestamp for trade in result.trades))
self.assertEqual(result.data_quality.rows, len(bars) - 5)
self.assertEqual(result.equity_curve[0].timestamp, bars[5].timestamp)
self.assertEqual(len(BacktestEngine().run(strategy, bars).equity_curve), len(bars))
```

Also assert negative and out-of-range boundaries raise `ValueError("invalid_evaluation_start_index")`.

- [ ] **Step 2: Run the focused test and verify RED**

Run the focused Python discovery command from Task 2.

Expected: `BacktestEngine.run()` rejects the new keyword.

- [ ] **Step 3: Implement boundary-aware execution**

Change the signature exactly:

```python
def run(
    self,
    strategy: StrategyConfig,
    bars: list[OHLCVBar],
    *,
    evaluation_start_index: int = 0,
) -> BacktestRun:
```

After sorting bars, validate `0 <= evaluation_start_index < len(ordered_bars)`. Keep the complete close/volume arrays for indicators. Before the boundary, skip order logic and equity append. At and after the boundary, run the existing order logic unchanged and append equity. Compute metrics with `len(ordered_bars) - evaluation_start_index`, and set `DataQuality.rows` to that same value. The existing end-of-backtest close applies only to positions opened after the boundary.

- [ ] **Step 4: Run focused and existing backtest tests, then commit**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -p 'test_strategy_experiments.py' -v
npm run test:python
```

Expected: PASS with existing backtest behavior unchanged at boundary zero.

Commit:

```bash
git add services/quant_core/quant_core/backtest.py services/quant_core/tests/test_strategy_experiments.py
git commit -m "feat: isolate backtest evaluation windows"
```

---

### Task 4: Persist Content-Addressed Experiment Evidence

**Files:**
- Create: `services/quant_core/quant_core/strategy_experiment_store.py`
- Test: `services/quant_core/tests/test_strategy_experiments.py`

**Interfaces:**
- Produces: `StrategyExperimentSnapshot`, `StrategyExperimentRecord`, `StrategyExperimentCandidateRecord`, `StrategyExperimentDetail`, and `StrategyExperimentStore` CRUD/claim methods.
- Consumed by: Tasks 5–7.

- [ ] **Step 1: Write failing snapshot dedupe, atomicity, and holdout tests**

Cover these behaviors:

```python
first = store.put_snapshot(snapshot)
second = store.put_snapshot(snapshot)
self.assertEqual(first.snapshot_id, second.snapshot_id)
with sqlite3.connect(database_path) as connection:
    count = connection.execute("select count(*) from strategy_experiment_snapshots").fetchone()[0]
self.assertEqual(count, 1)

self.assertEqual(
    store.claim_test_holdout(
        snapshot_id=snapshot.snapshot_id,
        definition_hash="definition-a",
        experiment_id="experiment-a",
        consumed_at=now,
    ),
    "claimed",
)
self.assertEqual(
    store.claim_test_holdout(
        snapshot_id=snapshot.snapshot_id,
        definition_hash="definition-a",
        experiment_id="experiment-replay",
        consumed_at=now,
    ),
    "replay",
)
with self.assertRaisesRegex(ValueError, "test_holdout_consumed"):
    store.claim_test_holdout(
        snapshot_id=snapshot.snapshot_id,
        definition_hash="definition-b",
        experiment_id="experiment-b",
        consumed_at=now,
    )
```

Use two threads and two store instances against the same temporary database; assert racing different definitions yield exactly one success and one `test_holdout_consumed`. Add a transaction test proving a candidate insert failure leaves neither the completed experiment nor any candidate row.

- [ ] **Step 2: Run focused tests and verify RED**

Run the focused Python discovery command.

Expected: import failure for `strategy_experiment_store`.

- [ ] **Step 3: Create the three-table schema and immutable records**

Use these exact record boundaries:

```python
@dataclass(frozen=True)
class StrategyExperimentSnapshot:
    snapshot_id: str
    created_at: datetime
    market: str
    symbol: str
    timeframe: str
    canonical_data_hash: str
    rows: int
    start_at: str
    end_at: str
    bars: list[dict[str, Any]]
    test_definition_hash: str | None = None
    test_owner_experiment_id: str | None = None
    test_consumed_at: datetime | None = None

@dataclass(frozen=True)
class StrategyExperimentRecord:
    experiment_id: str
    created_at: datetime
    status: Literal["completed", "failed"]
    definition_hash: str
    holdout_key: str
    strategy_revision: str
    source_run_id: str
    snapshot_id: str
    market: str
    symbol: str
    timeframe: str
    definition: dict[str, Any]
    evaluation_count: int
    selected_candidate_id: str | None = None
    completion_reason: str | None = None
    result_hash: str | None = None
    error_code: str | None = None
    error_detail: str | None = None

@dataclass(frozen=True)
class StrategyExperimentCandidateRecord:
    experiment_id: str
    candidate_id: str
    candidate_revision: str
    parameters: list[dict[str, Any]]
    train_metrics: dict[str, Any]
    validation_metrics: dict[str, Any]
    test_metrics: dict[str, Any] | None
    walk_forward: dict[str, Any]
    eligible: bool
    rank: int | None

@dataclass(frozen=True)
class StrategyExperimentDetail:
    experiment: StrategyExperimentRecord
    snapshot: StrategyExperimentSnapshot
    candidates: list[StrategyExperimentCandidateRecord]
```

Create these tables in `_init_schema()`:

```sql
create table if not exists strategy_experiment_snapshots (
  snapshot_id text primary key,
  created_at text not null,
  market text not null,
  symbol text not null,
  timeframe text not null,
  canonical_data_hash text not null,
  rows integer not null,
  start_at text not null,
  end_at text not null,
  bars_json text not null,
  test_definition_hash text,
  test_owner_experiment_id text,
  test_consumed_at text
);

create table if not exists strategy_experiments (
  experiment_id text primary key,
  created_at text not null,
  status text not null check (status in ('completed', 'failed')),
  definition_hash text not null,
  holdout_key text not null,
  strategy_revision text not null,
  source_run_id text not null,
  snapshot_id text not null,
  market text not null,
  symbol text not null,
  timeframe text not null,
  definition_json text not null,
  evaluation_count integer not null,
  selected_candidate_id text,
  completion_reason text,
  result_hash text,
  error_code text,
  error_detail text
);

create table if not exists strategy_experiment_candidates (
  experiment_id text not null,
  candidate_id text not null,
  candidate_revision text not null,
  parameters_json text not null,
  train_metrics_json text not null,
  validation_metrics_json text not null,
  test_metrics_json text,
  walk_forward_json text not null,
  eligible integer not null,
  rank integer,
  primary key (experiment_id, candidate_id)
);
```

Add indexes for `(strategy_revision, created_at)`, `(source_run_id, created_at)`, and `holdout_key`.

- [ ] **Step 4: Implement snapshot dedupe and atomic holdout claim**

`put_snapshot()` uses `BEGIN IMMEDIATE`, inserts a new row, or reads and byte-compares every immutable field before returning the existing row. `claim_test_holdout()` uses this exact order inside `BEGIN IMMEDIATE`:

```python
claimed = connection.execute(
    "select test_definition_hash from strategy_experiment_snapshots where snapshot_id = ?",
    (snapshot_id,),
).fetchone()
if claimed is None:
    raise ValueError("strategy_experiment_snapshot_not_found")
if claimed[0] == definition_hash:
    connection.commit()
    return "replay"
if claimed[0] is not None:
    raise ValueError("test_holdout_consumed")
updated = connection.execute(
    """
    update strategy_experiment_snapshots
    set test_definition_hash = ?, test_owner_experiment_id = ?, test_consumed_at = ?
    where snapshot_id = ? and test_definition_hash is null
    """,
    (definition_hash, experiment_id, consumed_at.isoformat(), snapshot_id),
)
if updated.rowcount != 1:
    raise ValueError("test_holdout_consumed")
connection.commit()
return "claimed"
```

Do not replace the first owner during exact replay. Add `claimed_definition(snapshot_id) -> str | None` for the runner's early read-only conflict check. `record_completed()` inserts the experiment and all candidates in one transaction. `record_failed()` inserts only the failed experiment. `get()` joins candidates and snapshot; `list_recent()` returns summaries without bars/candidates and clamps `limit` to 1–50. Add no update/delete methods.

- [ ] **Step 5: Run focused tests and commit**

Run the focused Python command.

Expected: all store, transaction, and concurrency tests pass.

Commit:

```bash
git add services/quant_core/quant_core/strategy_experiment_store.py services/quant_core/tests/test_strategy_experiments.py
git commit -m "feat: persist strategy experiment evidence"
```

---

### Task 5: Implement the Bounded Experiment Runner

**Files:**
- Create: `services/quant_core/quant_core/strategy_experiments.py`
- Test: `services/quant_core/tests/test_strategy_experiments.py`

**Interfaces:**
- Consumes: Tasks 2–4 contracts and existing `BacktestEngine`.
- Produces: `ParameterDimension`, `expand_candidates`, `StrategyExperimentError`, `StrategyExperimentRunner.run_new()`, `StrategyExperimentRunner.replay()`, `strategy_experiment_detail_to_payload`, and `strategy_experiment_records_to_payload`.

- [ ] **Step 1: Write failing definition/candidate tests**

Add tests for numeric normalization, dimension ordering, supported condition/parameter pairs, duplicate removal, canonical candidate IDs, and exact limits. Include:

```python
dimensions = (
    ParameterDimension("entry", 0, "window", (15, 20, 25)),
    ParameterDimension("exit", 0, "window", (15, 20, 25)),
)
candidates = expand_candidates(base_strategy, dimensions)
self.assertEqual(len(candidates), 9)
self.assertEqual(candidates, expand_candidates(base_strategy, tuple(reversed(dimensions))))
self.assertTrue(all(len(candidate.candidate_id) == 12 for candidate in candidates))
```

Assert 82 candidates, 501 bars, 13 windows, and 513 calculated evaluations each raise `invalid_strategy_experiment` before an engine call.

- [ ] **Step 2: Write failing execution, holdout, and replay tests**

Use a recording engine to assert:

- every candidate receives train and validation;
- ranking uses validation return, drawdown, profit factor, then candidate ID;
- ineligible rows have no rank;
- no eligible candidate means no claim and no test;
- exactly one selected candidate receives test;
- walk-forward stays before the final 20%;
- a deadline crossing records `experiment_timeout` with no candidate rows;
- exact replay uses stored definition/snapshot after deleting the source run and strategy row;
- exact replay keeps `definitionHash` and `resultHash` but receives a new experiment ID.

- [ ] **Step 3: Run focused tests and verify RED**

Run the focused Python command.

Expected: import failure for `strategy_experiments`.

- [ ] **Step 4: Implement exact constants, errors, and public runner**

Use these constants and signatures:

```python
MAX_SOURCE_BARS = 500
MAX_CANDIDATES = 81
MAX_WALK_FORWARD_WINDOWS = 12
MAX_EVALUATIONS = 512
DEADLINE_SECONDS = 15.0
ENGINE_VERSION = "backtest-v1"
RESULT_SCHEMA_VERSION = 1

@dataclass(frozen=True)
class ParameterDimension:
    side: Literal["entry", "exit"]
    condition_index: int
    parameter: Literal["window", "threshold"]
    values: tuple[int | float, ...]

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
```

`StrategyExperimentError.__init__()` accepts keyword-only `status`, stable `error`, sanitized `detail`, and optional `experiment_id`. Invalid requests before a trusted definition exists are not persisted. After a definition exists, `run_new()` and `replay()` catch timeout or execution errors, call `record_failed()`, and re-raise a sanitized error containing the generated experiment ID.

- [ ] **Step 5: Implement source verification and canonical definitions**

For new runs, load both stores and use `strategy_config_from_payload()` on the library body and run body. Require both recomputed revisions, both canonical bodies, library key, run revision, and context to match. Require snapshot v2, fresh canonical hash, and complete data. Call `put_snapshot()` and persist the canonical base strategy inside `definition_json`.

Normalize dimensions into sorted immutable parameter-patch rows:

```python
{
    "conditionSide": "entry",
    "conditionIndex": 0,
    "parameter": "window",
    "value": 20,
}
```

Compute `candidateId` from the patch, `definitionHash` from the full normalized definition, and `holdoutKey` from `snapshotId` plus `validation_end`.

- [ ] **Step 6: Implement partitions and bounded engine calls**

Use:

```python
train_end = math.floor(len(bars) * 0.60)
validation_end = math.floor(len(bars) * 0.80)
evaluation_budget = 2 * candidate_count + 2 * candidate_count * walk_forward_window_count + 1
```

`warmup_bars(strategy)` is the largest condition window plus one. Execute:

```python
train_result = run_engine(
    candidate_strategy,
    bars[:train_end],
    evaluation_start_index=warmup,
)
validation_result = run_engine(
    candidate_strategy,
    bars[train_end - warmup : validation_end],
    evaluation_start_index=warmup,
)
```

Test uses `bars[validation_end - warmup:]`. Before every engine call, fail when `monotonic() >= deadline`, then increment `evaluation_count`. Each partition starts with a new `BacktestEngine` using normalized assumptions.

Implement the private engine boundary as `_run_engine(strategy, bars, *, evaluation_start_index, definition, deadline) -> BacktestRun`; it constructs `BacktestEngine` from definition cash/fee/slippage, performs the deadline check, and is the only place that increments the count.

- [ ] **Step 7: Implement ranking, holdout claim, walk-forward, and result hash**

Eligibility checks validation `trade_count` and optional maximum drawdown. Sort eligible rows by:

```python
(
    -candidate.validation_metrics["totalReturnPct"],
    candidate.validation_metrics["maxDrawdownPct"],
    -candidate.validation_metrics["profitFactor"],
    candidate.candidate_id,
)
```

Normalize every engine result through one helper with the frontend field names:

```python
def metrics_to_payload(metrics: BacktestMetrics) -> dict[str, int | float]:
    return {
        "totalReturnPct": metrics.total_return_pct,
        "annualReturnPct": metrics.annual_return_pct,
        "maxDrawdownPct": metrics.max_drawdown_pct,
        "winRatePct": metrics.win_rate_pct,
        "profitFactor": metrics.profit_factor,
        "tradeCount": metrics.trade_count,
    }
```

Perform the early holdout preflight before candidate work. Immediately before selected test, call `claim_test_holdout()`; a racing different definition fails without reading test. Exact replay receives `"replay"`. Hash only persisted metrics, parameter patches, selection, completion reason, and schema version; exclude IDs, timestamps, trades, and equity arrays.

- [ ] **Step 8: Run focused and full Python tests, then commit**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -p 'test_strategy_experiments.py' -v
npm run test:python
```

Expected: all runner/store tests and the full Python suite pass.

Commit:

```bash
git add services/quant_core/quant_core/strategy_experiments.py services/quant_core/tests/test_strategy_experiments.py
git commit -m "feat: run bounded strategy experiments"
```

---

### Task 6: Expose the Experiment HTTP Contract

**Files:**
- Modify: `services/quant_core/quant_core/api.py`
- Test: `services/quant_core/tests/test_strategy_experiments.py`

**Interfaces:**
- Produces: POST/list/detail experiment routes and a health-safe threaded runtime.
- Consumed by: frontend Task 7 and Docker Task 11.

- [ ] **Step 1: Write failing HTTP tests**

Start a temporary `HTTPServer` with a `QuantApiHandler` subclass whose run, strategy, and experiment stores all point into the temporary directory. Test:

```python
connection.request("POST", "/api/strategy-experiments", body=json.dumps(create_payload), headers=json_headers)
self.assertEqual(connection.getresponse().status, 201)

connection.request("GET", f"/api/strategy-experiments?strategyRevision={revision}&sourceRunId={run_id}&limit=5")
self.assertEqual(connection.getresponse().status, 200)

connection.request("GET", f"/api/strategy-experiments/{experiment_id}")
self.assertEqual(connection.getresponse().status, 200)
```

Add exact `400`, `404`, `409 source_snapshot_reaudit_required`, `409 test_holdout_consumed`, and sanitized `500` assertions. Send forbidden `bars`, `strategy`, `metrics`, `rank`, and `resultHash` fields and expect `400 invalid_strategy_experiment`.

- [ ] **Step 2: Run focused tests and verify RED**

Run the focused Python command.

Expected: routes return `404`.

- [ ] **Step 3: Wire the store and thin route handlers**

Add the class attribute and runner helper:

```python
strategy_experiment_store = StrategyExperimentStore(Path("data/strategy_experiments.sqlite"))

def _strategy_experiment_runner(self) -> StrategyExperimentRunner:
    return StrategyExperimentRunner(
        strategy_store=self.strategy_store,
        run_store=self.run_store,
        experiment_store=self.strategy_experiment_store,
    )
```

POST accepts either `replayOfExperimentId` alone or a new definition payload. Reject mixed modes and forbidden evidence fields before calling the runner. Catch `StrategyExperimentError` and return its status/code/detail. On unknown exceptions, return only `strategy_experiment_failed` and sanitized detail; the runner owns failed-record persistence once a trusted definition exists.

GET list parses optional `strategyRevision`, `sourceRunId`, and bounded `limit`; detail URL-decodes the ID and returns snapshot bars plus candidates. Serialize with `{"experiment": strategy_experiment_detail_to_payload(detail)}` and `{"experiments": strategy_experiment_records_to_payload(records)}`.

- [ ] **Step 4: Switch only production startup to the threaded standard-library server**

Change:

```python
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

server = ThreadingHTTPServer((bind_host, bind_port), QuantApiHandler)
```

Keep tests free to instantiate `HTTPServer(TestHandler)`. Add a runtime test using `ThreadingHTTPServer` and a blocking fake engine; assert `/health` returns `200` while the experiment request is still running.

- [ ] **Step 5: Run focused/full Python tests and commit**

Run the focused command and `npm run test:python`.

Expected: all API and concurrency tests pass.

Commit:

```bash
git add services/quant_core/quant_core/api.py services/quant_core/tests/test_strategy_experiments.py
git commit -m "feat: expose strategy experiment api"
```

---

### Task 7: Add the Typed Frontend Experiment Client

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts` (experiment types and snapshot `hashVersion`)
- Modify: `apps/web/src/lib/terminal-api.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`

**Interfaces:**
- Produces: experiment domain types, URL builders, create/replay/list/detail clients, and stable core error handling.
- Consumed by: Tasks 8–10.

- [ ] **Step 1: Write failing URL, payload, and business-error tests**

Add tests for encoded detail IDs and filters:

```ts
expect(
  buildStrategyExperimentsUrl("/", {
    strategyRevision: "rev/a",
    sourceRunId: "run 1",
    limit: 5
  })
).toBe("/api/strategy-experiments?strategyRevision=rev%2Fa&sourceRunId=run+1&limit=5");

expect(buildStrategyExperimentDetailUrl("/", "experiment/你好")).toBe(
  "/api/strategy-experiments/experiment%2F%E4%BD%A0%E5%A5%BD"
);
```

Mock `409 { error: "test_holdout_consumed", detail: "Use a fresh snapshot." }` and assert the result is `source: "core"`, not fallback, with the same `errorCode` and detail. Add valid create, replay, list, and detail payload tests.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "strategy experiment"
```

Expected: missing type/build/client exports.

- [ ] **Step 3: Add exact domain and client result types**

Define in `terminal-workbench.ts`:

```ts
export type StrategyExperimentStatus = "completed" | "failed";
export type StrategyExperimentErrorCode =
  | "invalid_strategy_experiment"
  | "strategy_not_found"
  | "research_run_not_found"
  | "strategy_experiment_not_found"
  | "source_snapshot_reaudit_required"
  | "strategy_experiment_conflict"
  | "test_holdout_consumed"
  | "strategy_experiment_failed";

export interface StrategyExperimentMetricSet {
  totalReturnPct: number;
  annualReturnPct: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  tradeCount: number;
}

export type StrategyExperimentCreateRequest =
  | {
      strategyRevision: string;
      sourceRunId: string;
      assumptions: BacktestAssumptions;
      dimensions: StrategyExperimentDimension[];
      guardrails: StrategyExperimentGuardrails;
      walkForward: StrategyExperimentWalkForward | null;
    }
  | { replayOfExperimentId: string };
```

Add the spec fields for dimensions, parameter patches, guardrails, walk-forward evidence, definition, candidate, list item, detail, and evidence summary. `StrategyExperimentDefinition.baseStrategy` uses `ResearchRunStrategyConfig`. Extend `ResearchRunDataSnapshot` with `hashVersion?: "aiqt-data-v2"`; update `isResearchRunDataSnapshot()` to accept absent legacy version or exactly `aiqt-data-v2` and reject other values.

In `terminal-api.ts`, add `StrategyExperimentCreateRequest`, history/detail/mutation result types, URL builders, payload guards, and `createStrategyExperiment`, `loadStrategyExperiments`, and `loadStrategyExperimentDetail`. Replay uses `createStrategyExperiment(baseUrl, { replayOfExperimentId })`.

- [ ] **Step 4: Preserve core errors distinctly from network fallback**

For non-OK responses with a valid core error payload, return:

```ts
return {
  source: "core",
  errorCode: payload.error as StrategyExperimentErrorCode,
  error: typeof payload.detail === "string" ? payload.detail : payload.error
};
```

Only fetch/JSON/contract exceptions return `source: "fallback"`.

- [ ] **Step 5: Run focused tests and commit**

Run the focused terminal API test.

Expected: PASS.

Commit:

```bash
git add apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts
git commit -m "feat: add strategy experiment client"
```

---

### Task 8: Replace Frontend Simulation with Persisted Experiment Models

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

**Interfaces:**
- Consumes: Task 7 types.
- Produces: default dimensions, evidence summary, strategy config conversion, and audit-clearing candidate staging.

- [ ] **Step 1: Write failing persisted-evidence tests**

Add tests proving:

```ts
const summary = buildStrategyExperimentEvidenceSummary(workspace, completedExperiment);
expect(summary?.experimentId).toBe("experiment-1");
expect(summary?.resultHash).toBe("result-hash-1");
expect(summary?.selectedCandidateId).toBe("candidate-a");

expect(buildStrategyExperimentEvidenceSummary(workspace, mismatchedExperiment)).toBeNull();
const dimensions = buildDefaultStrategyExperimentDimensions(strategyConfig);
expect(dimensions.map((dimension) => `${dimension.conditionSide}:${dimension.conditionIndex}:${dimension.parameter}`)).toEqual([
  "entry:0:window",
  "entry:1:window",
  "entry:1:threshold",
  "entry:2:window",
  "exit:0:window"
]);
expect(dimensions.reduce((count, dimension) => count * dimension.values.length, 1)).toBeLessThanOrEqual(81);
```

Stage a candidate and assert the new workspace has candidate rules, `researchRun: null`, cleared backtest evidence, and a decision-log instruction to rerun the pipeline.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "strategy experiment"
```

Expected: missing model functions.

- [ ] **Step 3: Implement persisted experiment helpers**

Add:

```ts
export function buildStrategyExperimentEvidenceSummary(
  workspace: TerminalWorkspace,
  experiment: StrategyExperimentDetail | null
): StrategyExperimentEvidenceSummary | null

export function buildDefaultStrategyExperimentDimensions(
  strategyConfig: ResearchRunStrategyConfig
): StrategyExperimentDimension[]

export function strategySnapshotFromStrategyConfig(
  strategyConfig: ResearchRunStrategyConfig
): StrategySnapshot

export function workspaceWithStrategyExperimentCandidate(
  workspace: TerminalWorkspace,
  experiment: StrategyExperimentDetail,
  candidateId: string
): TerminalWorkspace
```

Build every supported dimension from actual condition side/index; SMA and volume use `window`, RSI uses `window` and `threshold`. Start every dimension with its current value, then add valid plus/minus-five values in deterministic condition order only while the Cartesian product stays at or below 81. Deduplicate and sort every values array.

Candidate staging applies the candidate parameter patches to `experiment.definition.baseStrategy`, converts that config with `strategySnapshotFromStrategyConfig`, and returns `clearAuditedResearchResults(updatedWorkspace, "strategy")`.

- [ ] **Step 4: Freeze the old simulator until its remaining consumers migrate**

Do not add any new call to `BacktestParameterScanRow`, `BacktestParameterScanSummary`, `buildBacktestParameterScanRows`, `buildBacktestParameterScanSummary`, `simulateSmaParameterScan`, or `workspaceWithBacktestParameterCandidate`. Keep the existing exports temporarily because `App.tsx`, Backtest Markdown, AI evidence, and layout contracts still consume them until Tasks 9–10. Their deletion is part of Task 10 after those consumers move to persisted experiment evidence; Task 8 must remain independently buildable.

- [ ] **Step 5: Run focused tests and commit**

Run the focused terminal-workbench test.

Expected: PASS, the new persisted helpers have no dependency on `simulateSmaParameterScan`, and the existing frontend build remains valid until the final consumer migration.

Commit:

```bash
git add apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "refactor: use persisted strategy experiments"
```

---

### Task 9: Upgrade the Backtest Section In Place

**Files:**
- Create: `apps/web/src/components/StrategyExperimentSection.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/i18n.ts`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/src/lib/i18n.test.ts`
- Test: `apps/web/src/lib/layout-css.test.js`

**Interfaces:**
- Consumes: Tasks 7–8 clients/models.
- Produces: configuration, run, history, detail, exact replay, export, and candidate-load UI in the existing Backtest slot.

- [ ] **Step 1: Write failing i18n and layout contracts**

Require bilingual keys for title, run, replay, export, load draft, legacy re-audit, holdout consumed, persisted evidence required, train, validation, test, eligibility, and budget. Add layout assertions proving `App.tsx` imports `StrategyExperimentSection`, the old inline scan table is absent, and CSS includes responsive experiment config/history/candidate selectors.

- [ ] **Step 2: Run UI contract tests and verify RED**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/i18n.test.ts
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "backtest lab"
```

Expected: missing keys/component/layout.

- [ ] **Step 3: Create a presentational experiment section**

Use this prop boundary:

```tsx
export interface StrategyExperimentSectionProps {
  i18n: ReturnType<typeof createI18n>;
  dimensions: StrategyExperimentDimension[];
  guardrails: StrategyExperimentGuardrails;
  walkForward: StrategyExperimentWalkForward | null;
  history: StrategyExperimentListItem[];
  active: StrategyExperimentDetail | null;
  running: boolean;
  error: string | null;
  onDimensionsChange: (value: StrategyExperimentDimension[]) => void;
  onGuardrailsChange: (value: StrategyExperimentGuardrails) => void;
  onWalkForwardChange: (value: StrategyExperimentWalkForward | null) => void;
  onRun: () => void;
  onInspect: (experimentId: string) => void;
  onReplay: (experimentId: string) => void;
  onExport: (experiment: StrategyExperimentDetail) => void;
  onLoadCandidate: (candidateId: string) => void;
}
```

Render semantic `<section>`, `<label>`, numeric inputs, buttons with `type="button"`, disabled running states, a history list, candidate table, selected test evidence, holdout status, and hashes. Use native inputs and existing CSS tokens; add no component library.

- [ ] **Step 4: Add App state and actions without clearing successful evidence on failure**

Add state for history, active detail, draft config, running, and error. Refresh history when the active source run/revision changes. Implement:

```ts
refreshStrategyExperiments
runStrategyExperiment
inspectStrategyExperiment
replayStrategyExperiment
exportStrategyExperimentJson
loadStrategyExperimentCandidate
```

On successful run/replay, set active detail and refresh history. On failure, update only error/status; keep the prior active detail. Export uses the existing `Blob`, `URL.createObjectURL`, temporary `<a download>`, click, revoke pattern. Candidate load reuses the current reset of AI review, paper execution, promotion, workflow run, and active work area.

- [ ] **Step 5: Replace the old inline section, style responsively, and run tests**

Remove old scan props from `BacktestReportPanel` and mount `StrategyExperimentSection` at the same location. Rename/reuse `.parameter-scan-*` rules as `.strategy-experiment-*`; support narrow layouts without horizontal page overflow.

Run i18n/layout tests plus:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "strategy experiment"
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "strategy experiment"
```

Expected: PASS.

- [ ] **Step 6: Commit the in-place UI upgrade**

```bash
git add apps/web/src/components/StrategyExperimentSection.tsx apps/web/src/App.tsx apps/web/src/lib/i18n.ts apps/web/src/lib/i18n.test.ts apps/web/src/styles.css apps/web/src/lib/layout-css.test.js
git commit -m "feat: add strategy experiment workbench"
```

---

### Task 10: Migrate Backtest and AI Evidence Consumers

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`

**Interfaces:**
- Consumes: `StrategyExperimentDetail` and `buildStrategyExperimentEvidenceSummary`.
- Produces: persisted experiment citations in Backtest Markdown, AI dossier/run record, and export audit artifacts.

- [ ] **Step 1: Write failing report and AI evidence tests**

Assert a matching completed experiment adds experiment ID, definition hash, result hash, selected candidate, and holdout status to Backtest Markdown and the AI citation. Assert `null` or mismatched experiment produces the exact text `Persisted strategy experiment required.` and no synthetic candidate metrics.

Keep citation ID `parameter-scan` and `parameterScanBound` for saved-record compatibility, but assert the citation label/value identify the persisted experiment.

- [ ] **Step 2: Run focused report tests and verify RED**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "strategy experiment"
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "strategy experiment"
```

Expected: current reports either lack persisted hashes or still call removed scan helpers.

- [ ] **Step 3: Thread an optional experiment through report builders**

Use these compatible signatures:

```ts
buildAiReviewDossier(workspace, experiment: StrategyExperimentDetail | null = null)
buildAiReviewReportMarkdown(workspace, experiment: StrategyExperimentDetail | null = null)
buildAiReviewRunRecord(workspace, experiment: StrategyExperimentDetail | null = null)
buildBacktestReportMarkdown(workspace, runHistory = [], experiment: StrategyExperimentDetail | null = null)
```

Update `buildResearchRunExportBacktestReport`, `buildBacktestReportAuditEvent`, and `withResearchRunExportAuditEvidenceArtifacts` to accept/pass the same optional detail. Change App's report export and AI save call sites to pass `activeStrategyExperiment` only when revision and source run match.

- [ ] **Step 4: Delete the retired frontend simulator after the last consumer migrates**

Remove `BacktestParameterScanRow`, `BacktestParameterScanSummary`, `buildBacktestParameterScanRows`, `buildBacktestParameterScanSummary`, `parameterScanWindows`, `parameterScanThresholds`, `simulateSmaParameterScan`, its SMA/RSI/volume helpers, and `workspaceWithBacktestParameterCandidate`. Delete their old tests rather than keeping two authorities. Before continuing, verify `rg "BacktestParameterScan|buildBacktestParameterScan|workspaceWithBacktestParameterCandidate|simulateSmaParameterScan" apps/web/src` returns no production references.

- [ ] **Step 5: Run focused and full frontend tests, then commit**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "strategy experiment"
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "strategy experiment"
npm run test --workspace @aiqt/web
npm run build --workspace @aiqt/web
```

Expected: all web tests and production build pass.

Commit:

```bash
git add apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts apps/web/src/App.tsx
git commit -m "feat: cite persisted strategy experiments"
```

---

### Task 11: Add Repeatable Docker Stage 2 Acceptance

**Files:**
- Modify: `tools/docker_smoke.py`
- Modify: `package.json`
- Modify: `apps/web/src/lib/deployment.test.js`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `docs/product-plan.md`
- Modify: `docs/architecture.md`

**Interfaces:**
- Consumes: P0 pipeline plus experiment POST/list/detail routes.
- Produces: `docker:smoke:stage2`, `docker:smoke:stage2:validate`, and `data/stage2-strategy-experiment.json`.

- [ ] **Step 1: Write failing script/manifest tests**

Add deployment assertions for exact commands:

```js
expect(packageJson.scripts["docker:smoke:stage2"]).toBe(
  "node tools/run_python.mjs tools/docker_smoke.py --stage2-strategy-experiment --stage2-strategy-experiment-report data/stage2-strategy-experiment.json"
);
expect(packageJson.scripts["docker:smoke:stage2:validate"]).toBe(
  "node tools/run_python.mjs tools/docker_smoke.py --validate-stage2-strategy-experiment-report data/stage2-strategy-experiment.json"
);
```

In Python tests, fake `post_json`/`request_json` and assert the smoke sequence creates a fresh P0 v2 run, creates an experiment, exact-replays it, reads list/detail, and never sends live/order fields.

- [ ] **Step 2: Run focused script tests and verify RED**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/deployment.test.js
npm run test:python
```

Expected: missing scripts and Stage 2 smoke functions.

- [ ] **Step 3: Extend the existing smoke tool, not a new framework**

Add `run_stage2_strategy_experiment_acceptance()`, manifest build/write/load/validate helpers, and three CLI arguments. The manifest must include:

```python
{
    "kind": "aiqt.stage2StrategyExperimentAcceptance",
    "schemaVersion": 1,
    "runId": run_id,
    "strategyRevision": strategy_revision,
    "snapshotId": snapshot_id,
    "experimentId": experiment_id,
    "replayExperimentId": replay_experiment_id,
    "definitionHash": definition_hash,
    "resultHash": result_hash,
    "candidateCount": candidate_count,
    "holdoutKey": holdout_key,
    "paperOnly": True,
    "liveTradingAllowed": False,
    "orderSubmitted": False,
    "routeExecuted": False,
}
```

Validator requirements: different experiment/replay IDs; equal definition/result hashes; at least two candidates; non-empty snapshot/holdout; all safety flags false. Reuse `run_smoke()` lifecycle and existing volume; do not call `docker compose down -v`.

Document the repeatable commands in both docs:

```markdown
- Run Stage 2 container acceptance: `npm run docker:smoke:stage2 -- --no-build`
- Validate saved Stage 2 evidence: `npm run docker:smoke:stage2:validate`
- Re-run the Stage 1 regression chain: `npm run stage1:prepare`
```

- [ ] **Step 4: Run focused tests and commit acceptance automation**

Run deployment and Python tests again.

Expected: PASS.

Commit:

```bash
git add tools/docker_smoke.py package.json apps/web/src/lib/deployment.test.js services/quant_core/tests/test_quant_core.py docs/product-plan.md docs/architecture.md
git commit -m "test: add stage2 strategy experiment acceptance"
```

---

### Task 12: Verify the Entire Stage and Close the Plan

**Files:**
- Check: every file listed above

**Interfaces:**
- Consumes: all prior tasks.
- Produces: a clean, reproducible Stage 2 handoff with Stage 1 still green.

- [ ] **Step 1: Run all focused backend tests**

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -p 'test_strategy_experiments.py' -v
```

Expected: all canonical, boundary, store, runner, holdout, replay, HTTP, and threaded-health tests pass.

- [ ] **Step 2: Run all focused frontend tests**

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "strategy experiment"
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "strategy experiment"
npm run test --workspace @aiqt/web -- src/lib/i18n.test.ts
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "backtest lab"
```

Expected: all pass.

- [ ] **Step 3: Run repository gates**

```bash
npm test
npm run build
```

Expected: full Python and web suites pass; TypeScript and Vite production build succeed.

- [ ] **Step 4: Rebuild containers without deleting the data volume**

```bash
docker compose up -d --build
docker compose ps
npm run docker:smoke -- --no-build
npm run docker:smoke:stage2 -- --no-build
npm run docker:smoke:stage2:validate
```

Expected: API/web healthy; Stage 2 manifest validates; exact replay hashes match; no live/order route runs.

- [ ] **Step 5: Run the existing Stage 1 regression chain**

```bash
npm run stage1:prepare
```

Expected: P0/P1/P2 evidence, desktop release, daily-use 5/5, and bootstrap 7/7 all regenerate and validate. If the desktop artifact is intentionally excluded from this execution environment, run `npm run stage1:prepare:quick` only after recording that limitation in the handoff; do not claim the full Stage 1 gate.

- [ ] **Step 6: Perform the browser acceptance**

Open `http://127.0.0.1:5173` and verify this exact flow:

1. Backtest Lab shows Strategy Experiment in the old parameter-scan location.
2. A fresh v2 run loads default dimensions and budget.
3. Run returns ranked train/validation rows and one selected test result.
4. History/detail survive refresh.
5. Exact replay creates a new ID with equal hashes.
6. A changed definition on the same snapshot shows holdout consumed.
7. Export downloads JSON with snapshot bars.
8. Load candidate opens Strategy Lab, clears the audited run, and leaves paper/live actions blocked.
9. English and Chinese labels remain readable at desktop and narrow widths.

- [ ] **Step 7: Verify documented commands and leave a clean tree**

Run:

```bash
rg -n "docker:smoke:stage2|stage1:prepare" docs/product-plan.md docs/architecture.md
git diff --check
git status --short
```

Expected: both docs name the Stage 2 and Stage 1 commands, no whitespace errors, and a clean working tree. Final handoff must report focused/full test results, Docker/Stage 1 evidence, generated manifest path, remaining non-goals, and the exact final commit range.
