import { describe, expect, test } from "vitest";
import {
  agentRoleLabels,
  buildTerminalWorkspace,
  executionModeLabel,
  researchRunHistoryLabel,
  researchRunLabel,
  quantLoopLabels,
  visiblePanels,
  workspaceWithSelectedTimeframe,
  workspaceWithSelectedInstrument,
  workspaceFromResearchRunAudit
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
    expect(workspace.selectedTimeframe).toBe("1d");
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

  test("formats research run audit summaries for the terminal", () => {
    expect(
      researchRunLabel({
        runId: "run-abc123",
        createdAt: "2026-05-26T08:00:00+00:00",
        timeframe: "1d",
        strategyRevision: "rev123",
        dataRows: 120,
        executionMode: "paper_only"
      })
    ).toBe("run-abc123 · 120 1d bars · paper_only");
    expect(researchRunLabel(undefined)).toBe("No audited run yet");
  });

  test("formats research run history rows for dense terminal display", () => {
    expect(
      researchRunHistoryLabel({
        runId: "run-history",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "SMA trend demo",
        strategyRevision: "rev123",
        dataRows: 120,
        metrics: { total_return_pct: 3.4, trade_count: 8 },
        decisions: [],
        executionMode: "paper_only"
      })
    ).toBe("600000 · 1d · +3.40% · 8 trades");
  });

  test("replays an audited research run into the terminal workspace", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-history",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "us",
      symbol: "AAPL",
      timeframe: "5m",
      strategyName: "SMA trend demo",
      strategyRevision: "rev123",
      dataRows: 120,
      metrics: {
        total_return_pct: -1.25,
        max_drawdown_pct: 4.5,
        win_rate_pct: 40,
        trade_count: 5
      },
      decisions: [{ agent: "AI Summary", message: "Replay loaded", tone: "ai" }],
      executionMode: "paper_only"
    });

    expect(workspace.selectedInstrument).toEqual({
      symbol: "AAPL",
      name: "Apple",
      market: "us",
      changePct: -0.36
    });
    expect(workspace.selectedTimeframe).toBe("5m");
    expect(workspace.strategy.name).toBe("SMA trend demo");
    expect(workspace.strategy.risk).toContain("rev123");
    expect(workspace.metrics.map((metric) => metric.value)).toEqual(["-1.25%", "4.50%", "40.00%", "5"]);
    expect(workspace.decisionLog[0].message).toBe("Replay loaded");
    expect(workspace.researchRun?.runId).toBe("run-history");
  });

  test("selects a watchlist instrument as a fresh research context", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-history",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev123",
      dataRows: 120,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "AI Summary", message: "Previous run", tone: "ai" }],
      executionMode: "paper_only"
    });

    const workspace = workspaceWithSelectedInstrument(auditedWorkspace, {
      symbol: "AAPL",
      name: "Apple",
      market: "us",
      changePct: -0.36
    });

    expect(workspace.selectedInstrument.symbol).toBe("AAPL");
    expect(workspace.researchRun).toBeNull();
    expect(workspace.metrics.map((metric) => metric.value)).toEqual(["N/A", "N/A", "N/A", "0"]);
    expect(workspace.decisionLog[0]).toEqual({
      agent: "Research Context",
      message: "AAPL 1d selected. Run Pipeline to generate an audited backtest and agent review.",
      tone: "ai"
    });
  });

  test("selects a timeframe as a fresh research context", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-history",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev123",
      dataRows: 120,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "AI Summary", message: "Previous run", tone: "ai" }],
      executionMode: "paper_only"
    });

    const workspace = workspaceWithSelectedTimeframe(auditedWorkspace, "15m");

    expect(workspace.selectedInstrument.symbol).toBe("600000");
    expect(workspace.selectedTimeframe).toBe("15m");
    expect(workspace.researchRun).toBeNull();
    expect(workspace.metrics.map((metric) => metric.value)).toEqual(["N/A", "N/A", "N/A", "0"]);
    expect(workspace.decisionLog[0]).toEqual({
      agent: "Research Context",
      message: "600000 15m selected. Run Pipeline to generate an audited backtest and agent review.",
      tone: "ai"
    });
  });
});
