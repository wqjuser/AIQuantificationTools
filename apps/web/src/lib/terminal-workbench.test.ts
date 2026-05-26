import { describe, expect, test } from "vitest";
import {
  agentRoleLabels,
  buildInstrumentFromSymbol,
  buildModuleNewsEvents,
  buildPortfolioRiskRows,
  buildScannerCandidates,
  buildTerminalWorkspace,
  buildWorkflowStages,
  executionModeLabel,
  formatInstrumentPrice,
  researchRunHistoryLabel,
  researchRunLabel,
  quantLoopLabels,
  type WorkflowRunState,
  visiblePanels,
  workspaceWithAiAction,
  workspaceWithPreservedInteractiveState,
  workspaceWithPreservedSelection,
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

  test("derives scanner candidates from the active watchlist", () => {
    const candidates = buildScannerCandidates(buildTerminalWorkspace());

    expect(candidates.map((candidate) => candidate.instrument.symbol)).toEqual(["BTC/USDT", "600000", "000300", "AAPL"]);
    expect(candidates[0]).toMatchObject({
      signal: "Momentum watch",
      risk: "medium",
      score: 72
    });
    expect(candidates.at(-1)).toMatchObject({
      signal: "Risk review",
      risk: "medium"
    });
  });

  test("derives paper portfolio risk rows from the workspace state", () => {
    const rows = buildPortfolioRiskRows(buildTerminalWorkspace());

    expect(rows.map((row) => row.id)).toEqual(["paper-exposure", "selected-risk", "live-gates"]);
    expect(rows[0].value).toBe("4 watched");
    expect(rows[1].detail).toContain("600000");
    expect(rows[2].tone).toBe("warning");
  });

  test("derives module news events without pretending to have a live feed", () => {
    const events = buildModuleNewsEvents(buildTerminalWorkspace());

    expect(events[0]).toMatchObject({
      source: "AI committee",
      impact: "positive"
    });
    expect(events.at(-1)).toMatchObject({
      source: "Local event watch",
      impact: "warning"
    });
    expect(events.at(-1)?.title).toContain("600000");
  });

  test("derives workflow stages with execution blocked until gates pass", () => {
    const stages = buildWorkflowStages(buildTerminalWorkspace());

    expect(stages.map((stage) => stage.id)).toEqual(["data", "factor", "backtest", "agent", "execution"]);
    expect(stages[0].status).toBe("active");
    expect(stages.at(-1)).toMatchObject({
      status: "blocked",
      output: "Paper execution only"
    });
  });

  test("derives workflow stages from a visible pipeline run state", () => {
    const runState: WorkflowRunState = {
      activeStageId: "backtest",
      completedStageIds: ["data", "factor"],
      log: [
        {
          id: "data-ready",
          stageId: "data",
          level: "success",
          message: "Data snapshot prepared for 600000 · 1d"
        }
      ]
    };

    const stages = buildWorkflowStages(buildTerminalWorkspace(), runState);

    expect(stages.map((stage) => [stage.id, stage.status])).toEqual([
      ["data", "completed"],
      ["factor", "completed"],
      ["backtest", "running"],
      ["agent", "ready"],
      ["execution", "blocked"]
    ]);
    expect(stages[0].output).toBe("Data snapshot prepared for 600000 · 1d");
  });

  test("attaches auditable artifacts to workflow stages", () => {
    const stages = buildWorkflowStages(buildTerminalWorkspace());

    expect(stages.find((stage) => stage.id === "data")?.artifacts).toEqual([
      { label: "Instrument", value: "600000", detail: "浦发银行 · ashare", tone: "neutral" },
      { label: "Timeframe", value: "1d", detail: "Selected research interval", tone: "neutral" },
      { label: "Rows", value: "Pending run", detail: "Run Pipeline to bind an audited data snapshot.", tone: "warning" }
    ]);
    expect(stages.find((stage) => stage.id === "backtest")?.artifacts.map((artifact) => artifact.label)).toEqual([
      "Return",
      "Max DD",
      "Win Rate",
      "Trades"
    ]);
    expect(stages.find((stage) => stage.id === "execution")?.artifacts.at(-1)).toEqual({
      label: "Live gates",
      value: "3 blocked",
      detail: "Adapter certified, Risk approved, Human confirmed",
      tone: "warning"
    });
  });

  test("adds a TradingAgents-style debate note to the decision log", () => {
    const workspace = workspaceWithAiAction(buildTerminalWorkspace(), "debate");

    expect(workspace.decisionLog[0]).toEqual({
      agent: "AI Debate",
      message:
        "Debate generated for 600000: bull case requires momentum confirmation; bear case flags drawdown and data quality.",
      tone: "ai"
    });
    expect(workspace.decisionLog).toHaveLength(5);
  });

  test("adds a grounded backtest explanation without promising returns", () => {
    const workspace = workspaceWithAiAction(buildTerminalWorkspace(), "explain");

    expect(workspace.decisionLog[0].agent).toBe("AI Summary");
    expect(workspace.decisionLog[0].message).toContain("return +12.4%");
    expect(workspace.decisionLog[0].message).toContain("no guaranteed outcome");
  });

  test("generates a paper-only strategy draft from the current context", () => {
    const workspace = workspaceWithAiAction(buildTerminalWorkspace(), "strategy-draft");

    expect(workspace.strategy.name).toBe("600000 1d AI draft");
    expect(workspace.strategy.entry).toBe("Momentum confirmation plus AI committee agreement");
    expect(workspace.strategy.risk).toBe("Paper only; require adapter certification, risk approval, and human confirmation");
    expect(workspace.decisionLog[0]).toMatchObject({
      agent: "Strategy Drafter",
      tone: "warning"
    });
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

  test("formats optional live quote prices for watchlist display", () => {
    expect(formatInstrumentPrice(8.66)).toBe("8.66");
    expect(formatInstrumentPrice(3898.221)).toBe("3898.22");
    expect(formatInstrumentPrice(undefined)).toBe("N/A");
  });

  test("builds a research instrument from a manually entered symbol", () => {
    expect(buildInstrumentFromSymbol("ashare", " 600000 ")).toEqual({
      symbol: "600000",
      name: "600000",
      market: "ashare",
      changePct: 0
    });
    expect(buildInstrumentFromSymbol("us", " aapl ")).toEqual({
      symbol: "AAPL",
      name: "AAPL",
      market: "us",
      changePct: 0
    });
    expect(buildInstrumentFromSymbol("crypto", " btcusdt ")).toEqual({
      symbol: "BTC/USDT",
      name: "BTC/USDT",
      market: "crypto",
      changePct: 0
    });
    expect(buildInstrumentFromSymbol("us", "   ")).toBeNull();
  });

  test("adds a manually selected instrument to the watchlist context", () => {
    const workspace = workspaceWithSelectedInstrument(
      buildTerminalWorkspace(),
      buildInstrumentFromSymbol("us", "MSFT")!
    );

    expect(workspace.selectedInstrument).toEqual({
      symbol: "MSFT",
      name: "MSFT",
      market: "us",
      changePct: 0
    });
    expect(workspace.watchlist[0].symbol).toBe("MSFT");
    expect(workspace.watchlist).toHaveLength(5);
    expect(workspace.researchRun).toBeNull();
  });

  test("preserves a manual symbol selection when a workspace refresh completes later", () => {
    const currentWorkspace = workspaceWithSelectedTimeframe(
      workspaceWithSelectedInstrument(buildTerminalWorkspace(), buildInstrumentFromSymbol("us", "MSFT")!),
      "5m"
    );
    const refreshedWorkspace = buildTerminalWorkspace();

    const merged = workspaceWithPreservedSelection(refreshedWorkspace, currentWorkspace);

    expect(merged.selectedInstrument.symbol).toBe("MSFT");
    expect(merged.selectedInstrument.market).toBe("us");
    expect(merged.selectedTimeframe).toBe("5m");
    expect(merged.watchlist[0].symbol).toBe("MSFT");
    expect(merged.researchRun).toBeNull();
  });

  test("preserves local AI action output when a workspace refresh completes later", () => {
    const currentWorkspace = workspaceWithAiAction(buildTerminalWorkspace(), "explain");
    const refreshedWorkspace = buildTerminalWorkspace();

    const merged = workspaceWithPreservedInteractiveState(refreshedWorkspace, currentWorkspace);

    expect(merged.selectedInstrument.symbol).toBe("600000");
    expect(merged.decisionLog[0].agent).toBe("AI Summary");
    expect(merged.decisionLog[0].message).toContain("no guaranteed outcome");
    expect(merged.strategy).toBe(currentWorkspace.strategy);
    expect(merged.watchlist[0].price).toBe(refreshedWorkspace.watchlist[0].price);
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
      changePct: -0.36,
      price: 191.2
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
