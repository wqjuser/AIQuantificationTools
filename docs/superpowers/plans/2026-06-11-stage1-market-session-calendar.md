# Stage 1 Market Session Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only market session calendar/status contract for A 股、美股和加密货币, and surface the selected market status inside the Market workspace.

**Architecture:** Implement a deterministic local session-template calendar in the Python core, exposed through `GET /api/market/calendar`. The frontend API client validates the contract and the React shell displays a compact Market workspace card; the feature is explicitly informational and does not unlock live trading or order routing.

**Tech Stack:** Python `zoneinfo` + `unittest`, local HTTP API, React/TypeScript, Vitest source/contract tests, CSS.

---

### Task 1: Backend Market Calendar Contract

**Files:**
- Create: `services/quant_core/quant_core/market_calendar.py`
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `services/quant_core/tests/test_quant_core.py`

- [x] **Step 1: Write failing core/API tests**

Add tests that assert:
- A 股 at `2026-06-11T10:00:00+08:00` is `open`, session `morning`, next close `2026-06-11T11:30:00+08:00`.
- A 股 at `2026-06-11T12:00:00+08:00` is `break`, session `lunch_break`, next open `2026-06-11T13:00:00+08:00`.
- US market at `2026-06-11T10:00:00-04:00` is `open`, session `regular`, timezone `America/New_York`.
- Crypto market is `always_open` with no next close.
- `/api/market/calendar` validates the response shape and rejects invalid markets.

- [x] **Step 2: Run focused backend test**

Run:
```powershell
python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest -k market_calendar
```

Expected: fail because `quant_core.market_calendar` and `/api/market/calendar` do not exist yet.

- [x] **Step 3: Implement calendar module and route**

Implement a local session-template calendar:
- `ashare`: `Asia/Shanghai`, weekdays, `09:30-11:30` and `13:00-15:00`.
- `us`: `America/New_York`, weekdays, `09:30-16:00`.
- `crypto`: `UTC`, continuous.

Return `market`, `timezone`, `status`, `isOpen`, `session`, `asOf`, `tradingDay`, `nextOpen`, `nextClose`, `detail`, `warnings`, and `source`.

- [x] **Step 4: Verify backend**

Run:
```powershell
python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest -k market_calendar
```

Expected: pass.

### Task 2: Frontend API Client Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-api.test.ts`

- [x] **Step 1: Write failing client tests**

Add tests for:
- `buildMarketCalendarUrl("/", "ashare")` returns `/api/market/calendar?market=ashare`.
- `loadMarketCalendarStatus` accepts a valid payload and returns `source: "core"`.
- Invalid payloads fall back to `source: "fallback"` with a clear error.

- [x] **Step 2: Run focused frontend API test**

Run:
```powershell
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "market calendar"
```

Expected: fail because the client functions/types do not exist yet.

- [x] **Step 3: Implement client types, URL builder, loader, and guard**

Add `MarketCalendarStatus`, `MarketCalendarResult`, `buildMarketCalendarUrl`, `loadMarketCalendarStatus`, and `isMarketCalendarPayload`.

- [x] **Step 4: Verify client**

Run:
```powershell
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "market calendar"
```

Expected: pass.

### Task 3: Market Workspace Surface

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Write failing UI source-contract test**

Assert that the app imports `loadMarketCalendarStatus`, stores `marketCalendarState`, calls it when selected market changes, and renders a `.market-calendar-card` in the Market workspace.

- [x] **Step 2: Run focused UI test**

Run:
```powershell
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "market calendar"
```

Expected: fail because the card is not rendered yet.

- [x] **Step 3: Implement UI card**

Load selected market calendar status on workspace load and market changes. Render a compact card with market, status, session, as-of time, next open/close, source, and warning count.

- [x] **Step 4: Verify UI**

Run:
```powershell
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "market calendar"
```

Expected: pass.

### Task 4: Product Plan And Full Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-11-stage1-market-session-calendar.md`

- [x] **Step 1: Update product plan**

Record that Stage 1 now includes a read-only market session calendar/status contract and Market workspace card, with static-session warnings and no trading unlock.

- [x] **Step 2: Run verification**

Run:
```powershell
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "market calendar"
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "market calendar"
npm --prefix apps/web run build
npm test
npm run docker:smoke
```

Expected: all pass.

**Progress:**
- 2026-06-11: Planned a Stage 1 market session calendar/status slice to close the trading-calendar gap without touching execution or live routing.
- 2026-06-11: Added RED backend/API tests, implemented `quant_core.market_calendar` and `/api/market/calendar`, and verified focused backend tests pass.
- 2026-06-11: Added RED TypeScript API client tests, implemented market calendar URL/loading/contract guards, and verified focused client tests pass.
- 2026-06-11: Added the Market workspace calendar status card, wired it to the selected market, verified the focused UI source-contract test, and recorded the read-only/static-template boundary in the product plan.
- 2026-06-11: Full verification passed: focused backend/client/UI tests, `npm --prefix apps/web run build`, `npm test`, `npm run docker:smoke`, browser smoke on `workspace=market`, and `git diff --check`. Docker smoke also gained UTF-8 output decoding to avoid Windows locale failures.
