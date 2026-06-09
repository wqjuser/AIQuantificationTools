# Stage 1 Watchlist Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the Stage 1 market watchlist in the local core service so selected research instruments can survive refreshes and Docker restarts.

**Architecture:** Add a small SQLite-backed watchlist store in the Python core, expose it through `/api/watchlist`, and make `/api/workspace` load the saved list before enriching live quotes. The React app keeps symbol selection local until the user explicitly saves the current watchlist.

**Tech Stack:** Python `sqlite3` + existing `BaseHTTPRequestHandler` API, React/TypeScript, Vitest, Python `unittest`.

---

### Task 1: Backend Watchlist Contract

**Files:**
- Create: `services/quant_core/quant_core/watchlist.py`
- Modify: `services/quant_core/quant_core/api.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] **Step 1: Write failing store and API tests**

Add tests that use a temporary SQLite database and a temporary HTTP server:

```python
def test_watchlist_store_persists_ordered_instruments(self):
    from quant_core.terminal import Instrument
    from quant_core.watchlist import WatchlistStore

    with tempfile.TemporaryDirectory() as temp_dir:
        store = WatchlistStore(Path(temp_dir) / "watchlist.sqlite")
        store.replace_all([
            Instrument(symbol="MSFT", name="Microsoft", market="us", change_pct=0.0),
            Instrument(symbol="600000", name="浦发银行", market="ashare", change_pct=0.0),
            Instrument(symbol="MSFT", name="Duplicate", market="us", change_pct=0.0),
        ])

        saved = store.list_instruments()

    self.assertEqual([(item.market, item.symbol, item.name) for item in saved], [
        ("us", "MSFT", "Microsoft"),
        ("ashare", "600000", "浦发银行"),
    ])
```

Add an API test that calls `PUT /api/watchlist` then `GET /api/workspace` and expects the saved symbol to be in `watchlist[0]`.

- [x] **Step 2: Run backend RED tests**

Run: `$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_watchlist_store_persists_ordered_instruments services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_watchlist_api_persists_user_watchlist_for_workspace`

Expected: FAIL because `quant_core.watchlist` and `/api/watchlist` do not exist yet.

- [x] **Step 3: Implement minimal backend**

Create `WatchlistStore` with:

```python
class WatchlistStore:
    def __init__(self, db_path: Path): ...
    def list_instruments(self) -> list[Instrument]: ...
    def replace_all(self, instruments: Iterable[Instrument]) -> list[Instrument]: ...
```

Rules: keep order, deduplicate by `(market, symbol.upper())`, trim names, cap at 12 rows, and store only user-facing instrument identity plus optional fallback quote values.

In `api.py`, add class attribute `watchlist_store = WatchlistStore(Path("data/watchlist.sqlite"))`, route `PUT /api/watchlist`, route `GET /api/watchlist`, and make `GET /api/workspace` call a helper that swaps the saved watchlist into the default workspace when present.

- [x] **Step 4: Run backend GREEN tests**

Run the same command as Step 2.

Expected: PASS.

### Task 2: Frontend API Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`

- [x] **Step 1: Write failing API client test**

Add a Vitest case that calls `saveWatchlist("/", instruments, fetcher)` and expects:

```ts
expect(calls).toEqual([
  {
    url: "/api/watchlist",
    method: "PUT",
    body: {
      watchlist: [
        { market: "us", symbol: "MSFT", name: "Microsoft", price: 420.5, changePct: 1.2 }
      ]
    }
  }
]);
expect(result.source).toBe("core");
expect(result.watchlist[0]?.symbol).toBe("MSFT");
```

- [x] **Step 2: Run frontend RED test**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "saves the market watchlist"`

Expected: FAIL because `saveWatchlist` is not exported yet.

- [x] **Step 3: Implement minimal API client**

Add:

```ts
export interface WatchlistSaveResult {
  watchlist: TerminalWorkspace["watchlist"];
  source: WorkspaceSource;
  error?: string;
}

export function buildWatchlistUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/watchlist");
}

export async function saveWatchlist(...): Promise<WatchlistSaveResult> { ... }
```

Fallback behavior should return the submitted instruments with `source: "fallback"` and the error string.

- [x] **Step 4: Run frontend GREEN test**

Run the same command as Step 2.

Expected: PASS.

### Task 3: Frontend Watchlist Save Interaction

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write failing workbench utility test**

Add a test for `workspaceWithSavedWatchlist`:

```ts
const workspace = workspaceWithSelectedInstrument(buildTerminalWorkspace(), buildInstrumentFromSymbol("us", "MSFT")!);
const saved = workspaceWithSavedWatchlist(workspace, [
  { market: "us", symbol: "MSFT", name: "Microsoft", changePct: 0, price: 420.5 }
]);

expect(saved.watchlist[0]?.name).toBe("Microsoft");
expect(saved.selectedInstrument.name).toBe("Microsoft");
expect(saved.researchRun).toBeNull();
```

- [x] **Step 2: Run frontend RED utility test**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "merges a saved watchlist"`

Expected: FAIL because `workspaceWithSavedWatchlist` does not exist.

- [x] **Step 3: Implement workbench utility and app action**

Add `workspaceWithSavedWatchlist(currentWorkspace, savedWatchlist)` that keeps selected instrument details synchronized with the saved watchlist row when the same market/symbol exists.

In `App.tsx`, add an `isSavingWatchlist` state and `saveCurrentWatchlist` handler. Render a compact button near the watchlist strip or selected task panel:

```tsx
<button className="watchlist-save-action" disabled={isSavingWatchlist} onClick={saveCurrentWatchlist} type="button">
  {isSavingWatchlist ? <RefreshCw className="spin" size={15} /> : <BookmarkPlus size={15} />}
  {i18n.t("action.saveWatchlist")}
</button>
```

- [x] **Step 4: Run frontend GREEN utility test**

Run the same command as Step 2.

Expected: PASS.

### Task 4: Product Plan, Verification, and Delivery

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/architecture.md`

- [x] **Step 1: Update docs**

Add a current Stage 1 bullet explaining that `/api/watchlist` now persists local watchlist rows and `/api/workspace` restores them before quote enrichment.

- [x] **Step 2: Run focused verification**

Run:

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_watchlist_store_persists_ordered_instruments services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_watchlist_api_persists_user_watchlist_for_workspace
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "saves the market watchlist"
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "merges a saved watchlist"
```

Expected: all PASS.

- [x] **Step 3: Run broader quality checks**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts
npm --prefix apps/web run build
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
```

Expected: all PASS, with no new warnings.

- [x] **Step 4: Keep Docker available**

Docker service was rebuilt and left running on `http://127.0.0.1:5173/`. Browser smoke verified the `保存自选` action and `/api/watchlist` response.

- [x] **Step 5: Push through proxy**

Pushed `ca1110b feat: persist stage1 watchlist` to `origin/codex/p0-product-workspaces` with `HTTP_PROXY` and `HTTPS_PROXY` set to `http://127.0.0.1:7890`.

Run Docker smoke or restart the service if needed, leaving the web app on `http://127.0.0.1:5173/`.

Push with:

```powershell
$env:HTTP_PROXY='http://127.0.0.1:7890'; $env:HTTPS_PROXY='http://127.0.0.1:7890'; git push
```

Expected: branch pushed to GitHub successfully.
