# Terminal Workbench Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the demo dashboard with a production-shaped terminal workbench shell based on the approved AIQuant Terminal design.

**Architecture:** Add a typed frontend workspace model that describes the quant loop, terminal modules, AI agent committee, execution gates, metrics, and panel data. Refactor the React app to render a dense terminal layout from that model instead of hard-coded demo dashboard sections.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, lucide-react, existing Python demo API.

---

### Task 1: Terminal Workspace Model

**Files:**
- Create: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/terminal-workbench.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import {
  agentRoleLabels,
  buildTerminalWorkspace,
  executionModeLabel,
  quantLoopLabels,
  visiblePanels
} from "./terminal-workbench";

describe("terminal workbench model", () => {
  test("builds a complete terminal shell with quant loop and terminal panels", () => {
    const workspace = buildTerminalWorkspace();

    expect(quantLoopLabels(workspace)).toEqual([
      "Idea Lab",
      "Data & Factor",
      "Strategy Builder",
      "Backtest Lab",
      "Agent Review",
      "Paper Trading",
      "Broker Center"
    ]);
    expect(visiblePanels(workspace)).toEqual([
      "watchlist",
      "chart",
      "strategy",
      "backtest",
      "node-workflow",
      "execution",
      "agent-committee"
    ]);
  });

  test("keeps live execution blocked by default with explicit safety gates", () => {
    const workspace = buildTerminalWorkspace();

    expect(executionModeLabel(workspace.execution)).toBe("Paper only");
    expect(workspace.execution.liveEnabled).toBe(false);
    expect(workspace.execution.gates.map((gate) => gate.id)).toEqual([
      "adapter-certified",
      "risk-approved",
      "human-confirmed"
    ]);
  });

  test("renders the TradingAgents-style committee roles in fixed order", () => {
    const workspace = buildTerminalWorkspace();

    expect(agentRoleLabels(workspace)).toEqual([
      "Technical Analyst",
      "Fundamental Analyst",
      "News Analyst",
      "Sentiment Analyst",
      "Bull Researcher",
      "Bear Researcher",
      "Risk Manager",
      "Portfolio Manager"
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts
```

Expected: FAIL because `./terminal-workbench` does not exist.

- [ ] **Step 3: Implement the model**

Create `apps/web/src/lib/terminal-workbench.ts` with exported interfaces and functions used by the test:

```ts
export type PanelId =
  | "watchlist"
  | "chart"
  | "strategy"
  | "backtest"
  | "node-workflow"
  | "execution"
  | "agent-committee";

export interface QuantLoopStep {
  id: string;
  label: string;
  status: "active" | "ready" | "locked";
}

export interface TerminalPanel {
  id: PanelId;
  title: string;
  visible: boolean;
}

export interface AgentRole {
  id: string;
  label: string;
  stance: "analysis" | "debate" | "risk" | "decision";
}

export interface ExecutionGate {
  id: string;
  label: string;
  passed: boolean;
}

export interface ExecutionState {
  mode: "paper_only" | "certified_live" | "blocked_live";
  liveEnabled: boolean;
  gates: ExecutionGate[];
}

export interface TerminalWorkspace {
  quantLoop: QuantLoopStep[];
  panels: TerminalPanel[];
  agents: AgentRole[];
  execution: ExecutionState;
}

export function buildTerminalWorkspace(): TerminalWorkspace {
  return {
    quantLoop: [
      { id: "idea", label: "Idea Lab", status: "active" },
      { id: "data", label: "Data & Factor", status: "ready" },
      { id: "strategy", label: "Strategy Builder", status: "ready" },
      { id: "backtest", label: "Backtest Lab", status: "ready" },
      { id: "agent-review", label: "Agent Review", status: "ready" },
      { id: "paper", label: "Paper Trading", status: "ready" },
      { id: "broker", label: "Broker Center", status: "locked" }
    ],
    panels: [
      { id: "watchlist", title: "Watchlist", visible: true },
      { id: "chart", title: "Chart & Factor Overlays", visible: true },
      { id: "strategy", title: "Strategy Snapshot", visible: true },
      { id: "backtest", title: "Backtest Metrics", visible: true },
      { id: "node-workflow", title: "Node Workflow", visible: true },
      { id: "execution", title: "Execution Center", visible: true },
      { id: "agent-committee", title: "Agent Committee", visible: true }
    ],
    agents: [
      { id: "technical", label: "Technical Analyst", stance: "analysis" },
      { id: "fundamental", label: "Fundamental Analyst", stance: "analysis" },
      { id: "news", label: "News Analyst", stance: "analysis" },
      { id: "sentiment", label: "Sentiment Analyst", stance: "analysis" },
      { id: "bull", label: "Bull Researcher", stance: "debate" },
      { id: "bear", label: "Bear Researcher", stance: "debate" },
      { id: "risk", label: "Risk Manager", stance: "risk" },
      { id: "portfolio", label: "Portfolio Manager", stance: "decision" }
    ],
    execution: {
      mode: "paper_only",
      liveEnabled: false,
      gates: [
        { id: "adapter-certified", label: "Adapter certified", passed: false },
        { id: "risk-approved", label: "Risk approved", passed: false },
        { id: "human-confirmed", label: "Human confirmed", passed: false }
      ]
    }
  };
}

export function quantLoopLabels(workspace: TerminalWorkspace): string[] {
  return workspace.quantLoop.map((step) => step.label);
}

export function visiblePanels(workspace: TerminalWorkspace): PanelId[] {
  return workspace.panels.filter((panel) => panel.visible).map((panel) => panel.id);
}

export function agentRoleLabels(workspace: TerminalWorkspace): string[] {
  return workspace.agents.map((agent) => agent.label);
}

export function executionModeLabel(execution: ExecutionState): string {
  return execution.mode === "paper_only" ? "Paper only" : execution.mode === "certified_live" ? "Certified live" : "Blocked live";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts
```

Expected: PASS.

### Task 2: Terminal React Shell

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [ ] **Step 1: Refactor `App.tsx`**

Render the first screen from `buildTerminalWorkspace()`:

- Left rail: product name, quant loop, terminal modules.
- Center: watchlist strip, selected instrument, chart/factor panel, strategy snapshot, backtest metrics, node workflow, execution center.
- Right rail: agent committee, decision log, AI actions.
- Footer: workflow state and live-trading safety status.

- [ ] **Step 2: Refactor `styles.css`**

Use a dense terminal palette:

- Background: near-black blue-gray.
- Accents: amber for quant/product, teal for positive/system, violet for AI, red/orange for risk.
- Cards limited to real panels; no marketing hero or oversized empty dashboard spacing.

- [ ] **Step 3: Verify frontend**

Run:

```powershell
npm run test --workspace @aiqt/web
npm run build
```

Expected: tests pass and Vite build succeeds.

### Task 3: Publish Phase 1 Progress

**Files:**
- Modify: current git branch

- [ ] **Step 1: Run full verification**

Run:

```powershell
npm run test
npm run build
```

Expected: Python tests pass, Vitest tests pass, Vite build succeeds.

- [ ] **Step 2: Commit and push**

Run:

```powershell
git add .
git commit -m "feat: add terminal workbench shell"
git -c http.version=HTTP/1.1 push
```

Expected: commit is pushed to `origin/main`.

## Self-Review

- Spec coverage: Phase 1 covers terminal shell, quant-loop navigation, AI committee, execution safety gates, and dense workbench layout.
- Deferred intentionally: backend persistence, real data adapters, broker certification, and live execution adapter implementation.
- Placeholder scan: no TBD/TODO placeholders.
