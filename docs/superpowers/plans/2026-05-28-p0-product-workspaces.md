# P0 Product Workspaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the terminal-style workflow rail with a product work-area skeleton for the P0 quantitative trading platform.

**Architecture:** Keep existing market data, chart, strategy, backtest, AI, paper trading, and audit logic intact. Add a thin product work-area model in `terminal-workbench.ts`, drive left navigation and URL state from that model, then arrange current panels into nine explicit work areas: Market, Research, Strategy, Backtest, AI Review, Portfolio, Execution, Audit, and Settings.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, klinecharts, local Python quant core.

---

## File Structure

- Modify: `apps/web/src/lib/terminal-workbench.ts`
  - Add `ProductWorkAreaId`, `ProductWorkArea`, `ProductWorkAreaSelection`, `buildProductWorkAreas`, and `resolveProductWorkAreaSelection`.
  - Map product work areas to existing quant loop steps and workflow stages so current behavior is preserved.
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
  - Add unit tests for the new work-area model and selection behavior.
- Modify: `apps/web/src/App.tsx`
  - Replace the left rail source from `workspace.quantLoop` to `productWorkAreas`.
  - Add `activeWorkAreaId` state with `?workspace=` URL persistence.
  - Route each work area to a concrete page composition.
  - Add small Market Data Health and Settings panels using existing workspace and K-line state.
- Modify: `apps/web/src/lib/i18n.ts`
  - Add localized work-area labels, descriptions, and statuses.
- Modify: `apps/web/src/styles.css`
  - Style the wider product navigation and the new work-area panels.
- Modify: `apps/web/src/lib/layout-css.test.js`
  - Update layout source/CSS assertions from terminal workflow rail to product work-area rail.

## Task 1: Product Work-Area Model

- [ ] **Step 1: Write failing model tests**

Add this import group to `apps/web/src/lib/terminal-workbench.test.ts`:

```ts
import {
  buildProductWorkAreas,
  resolveProductWorkAreaSelection
} from "./terminal-workbench";
```

Add tests:

```ts
test("builds the P0 product work areas in platform order", () => {
  const areas = buildProductWorkAreas(buildTerminalWorkspace());

  expect(areas.map((area) => area.id)).toEqual([
    "market",
    "research",
    "strategy",
    "backtest",
    "ai-review",
    "portfolio",
    "execution",
    "audit",
    "settings"
  ]);
  expect(areas.find((area) => area.id === "execution")).toMatchObject({
    quantLoopStepId: "paper",
    workflowStageId: "execution",
    status: "blocked"
  });
});

test("marks evidence-dependent work areas ready after an audited run is bound", () => {
  const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
    runId: "run-product-area",
    createdAt: "2026-05-28T08:00:00+00:00",
    market: "ashare",
    symbol: "600000",
    timeframe: "1d",
    strategyName: "SMA trend demo",
    strategyRevision: "rev-product",
    dataRows: 120,
    metrics: {
      total_return_pct: 8.2,
      max_drawdown_pct: 3.1,
      win_rate_pct: 55,
      trade_count: 9
    },
    decisions: [],
    executionMode: "paper_only"
  });

  const statuses = Object.fromEntries(buildProductWorkAreas(workspace).map((area) => [area.id, area.status]));

  expect(statuses["ai-review"]).toBe("ready");
  expect(statuses.portfolio).toBe("ready");
  expect(statuses.execution).toBe("ready");
  expect(statuses.audit).toBe("ready");
});

test("resolves product work-area navigation without hiding blocked execution pages", () => {
  expect(resolveProductWorkAreaSelection(buildTerminalWorkspace(), "execution")).toEqual({
    areaId: "execution",
    quantLoopStepId: "paper",
    workflowStageId: "execution"
  });
  expect(resolveProductWorkAreaSelection(buildTerminalWorkspace(), "missing", "strategy")).toEqual({
    areaId: "strategy",
    quantLoopStepId: "strategy",
    workflowStageId: "factor"
  });
});
```

- [ ] **Step 2: Run test to verify red**

Run:

```powershell
npm run test --workspace @aiqt/web -- apps/web/src/lib/terminal-workbench.test.ts
```

Expected: FAIL because `buildProductWorkAreas` and `resolveProductWorkAreaSelection` are not exported.

- [ ] **Step 3: Implement the model**

Add exported types and functions to `apps/web/src/lib/terminal-workbench.ts`:

```ts
export type ProductWorkAreaId =
  | "market"
  | "research"
  | "strategy"
  | "backtest"
  | "ai-review"
  | "portfolio"
  | "execution"
  | "audit"
  | "settings";

export type ProductWorkAreaStatus = "ready" | "needs_run" | "blocked";

export interface ProductWorkArea {
  id: ProductWorkAreaId;
  label: string;
  description: string;
  accent: TerminalModule["accent"];
  quantLoopStepId: string;
  workflowStageId: string;
  status: ProductWorkAreaStatus;
}

export interface ProductWorkAreaSelection {
  areaId: ProductWorkAreaId;
  quantLoopStepId: string;
  workflowStageId: string;
}
```

Define the ordered work areas and implement status derivation:

```ts
const productWorkAreaDefinitions = [
  { id: "market", label: "Market Center", description: "Search, quotes, K-lines, source health", accent: "market", quantLoopStepId: "research", workflowStageId: "data" },
  { id: "research", label: "Research Terminal", description: "Chart, factors, notes, context", accent: "market", quantLoopStepId: "research", workflowStageId: "data" },
  { id: "strategy", label: "Strategy Lab", description: "Rules, versions, risk configuration", accent: "strategy", quantLoopStepId: "strategy", workflowStageId: "factor" },
  { id: "backtest", label: "Backtest Lab", description: "Assumptions, trades, reproducible run", accent: "ai", quantLoopStepId: "backtest", workflowStageId: "backtest" },
  { id: "ai-review", label: "AI Review Board", description: "Evidence-locked agent committee", accent: "ai", quantLoopStepId: "agent-review", workflowStageId: "agent" },
  { id: "portfolio", label: "Portfolio & Risk", description: "Exposure, positions, live gates", accent: "execution", quantLoopStepId: "paper", workflowStageId: "execution" },
  { id: "execution", label: "Execution Center", description: "Paper orders and adapter readiness", accent: "execution", quantLoopStepId: "paper", workflowStageId: "execution" },
  { id: "audit", label: "Audit & Replay", description: "Run history, import, export, replay", accent: "ai", quantLoopStepId: "backtest", workflowStageId: "backtest" },
  { id: "settings", label: "Settings", description: "Data sources, API keys, safety gates", accent: "execution", quantLoopStepId: "research", workflowStageId: "data" }
] as const satisfies readonly Omit<ProductWorkArea, "status">[];
```

- [ ] **Step 4: Verify green**

Run:

```powershell
npm run test --workspace @aiqt/web -- apps/web/src/lib/terminal-workbench.test.ts
```

Expected: PASS.

## Task 2: Product Navigation And URL State

- [ ] **Step 1: Write failing layout tests**

Modify `apps/web/src/lib/layout-css.test.js` to expect product work-area navigation:

```js
test("uses product work areas as the primary left navigation", () => {
  const leftRailSource = sourceBetween('<aside className="left-rail">', "</aside>");

  expect(appSource).toContain("buildProductWorkAreas(workspace)");
  expect(appSource).toContain("resolveInitialWorkAreaId");
  expect(appSource).toContain('new URLSearchParams(window.location.search).get("workspace")');
  expect(appSource).toContain("productWorkAreas.map");
  expect(leftRailSource).toContain('className={`work-area-button');
  expect(leftRailSource).toContain("i18n.productWorkAreaLabel");
  expect(leftRailSource).toContain("i18n.productWorkAreaDescription");
  expect(leftRailSource).not.toContain("workspace.quantLoop.map");
});
```

- [ ] **Step 2: Run test to verify red**

Run:

```powershell
npm run test --workspace @aiqt/web -- apps/web/src/lib/layout-css.test.js
```

Expected: FAIL because the app still renders quant loop navigation.

- [ ] **Step 3: Implement navigation**

Modify `apps/web/src/App.tsx`:

- Import the new work-area helpers and type.
- Add `activeWorkAreaId` state.
- Add `resolveInitialWorkAreaId`.
- Add `selectProductWorkArea`.
- Render `productWorkAreas.map(...)` in the left rail.
- Persist `?workspace=` in the URL.

- [ ] **Step 4: Add i18n labels**

Modify `apps/web/src/lib/i18n.ts` with work-area label, description, and status methods.

- [ ] **Step 5: Add navigation CSS**

Modify `apps/web/src/styles.css`:

```css
.work-area-nav {
  display: grid;
  gap: 8px;
}

.work-area-button {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  width: 100%;
  min-height: 56px;
  border: 1px solid #27364a;
  border-radius: 8px;
  background: #172233;
  color: #dce6ee;
  cursor: pointer;
  padding: 9px 10px;
  text-align: left;
}
```

- [ ] **Step 6: Verify navigation tests**

Run:

```powershell
npm run test --workspace @aiqt/web -- apps/web/src/lib/layout-css.test.js
```

Expected: PASS.

## Task 3: Product Work-Area Page Composition

- [ ] **Step 1: Add failing layout assertions**

Extend `apps/web/src/lib/layout-css.test.js`:

```js
test("renders distinct product work-area compositions", () => {
  expect(appSource).toContain("renderActiveProductWorkspace()");
  expect(appSource).toContain('activeWorkAreaId === "market"');
  expect(appSource).toContain('activeWorkAreaId === "settings"');
  expect(appSource).toContain("MarketDataHealthPanel");
  expect(appSource).toContain("PlatformSettingsPanel");
  expect(cssBlock(".product-workspace-layout")).toContain("display: grid;");
});
```

- [ ] **Step 2: Run test to verify red**

Run:

```powershell
npm run test --workspace @aiqt/web -- apps/web/src/lib/layout-css.test.js
```

Expected: FAIL because the product work-area renderer and panels do not exist yet.

- [ ] **Step 3: Implement work-area renderer**

Rename `renderActiveWorkflow` to `renderActiveProductWorkspace` and switch by `activeWorkAreaId`. Keep existing panels where possible, add:

- `MarketDataHealthPanel`
- `PlatformSettingsPanel`

- [ ] **Step 4: Verify page composition tests**

Run:

```powershell
npm run test --workspace @aiqt/web -- apps/web/src/lib/layout-css.test.js
```

Expected: PASS.

## Task 4: Full Verification

- [ ] **Step 1: Type, unit, and build verification**

Run:

```powershell
npm test
npm run build
```

Expected: all tests pass and the web build succeeds.

- [ ] **Step 2: Browser verification**

Open `http://127.0.0.1:5173/` in the in-app browser. Verify:

- Left navigation shows nine product work areas.
- Clicking Market, Strategy, Backtest, AI Review, Execution, Audit, and Settings changes the main content.
- The chart remains visible in Market/Research/Strategy where intended.
- No nested scroll bars appear on the main desktop layout.

- [ ] **Step 3: Commit and push**

Run:

```powershell
git add apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/App.tsx apps/web/src/lib/i18n.ts apps/web/src/styles.css apps/web/src/lib/layout-css.test.js docs/superpowers/plans/2026-05-28-p0-product-workspaces.md
git commit -m "feat: add product workspace navigation"
git push origin codex/p0-product-workspaces
```
