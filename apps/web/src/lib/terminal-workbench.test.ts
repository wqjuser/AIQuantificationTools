import { describe, expect, test } from "vitest";
import {
  agentRoleLabels,
  buildAgentCommitteeRounds,
  buildAiEvidenceCards,
  buildAuditReplayWorkflowState,
  buildBacktestAssumptionRows,
  buildBacktestTradeRows,
  buildBrokerAdapterRows,
  buildInstrumentFromSymbol,
  buildModuleNewsEvents,
  buildPaperPositionRows,
  buildPaperTradingRows,
  buildPortfolioRiskRows,
  buildQuantLoopNavigationTarget,
  buildResearchRunComparisonRows,
  buildScannerCandidates,
  buildStrategyRuleRows,
  buildTerminalWorkspace,
  buildWorkflowStages,
  executionModeLabel,
  formatInstrumentPrice,
  researchRunHistoryLabel,
  researchRunLabel,
  quantLoopLabels,
  resolveBacktestAssumptions,
  type WorkflowRunState,
  visiblePanels,
  workspaceWithAiAction,
  workspaceWithBacktestAssumption,
  workspaceWithPreservedInteractiveState,
  workspaceWithPreservedSelection,
  workspaceWithStrategyField,
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

  test("maps quant loop steps to concrete workspace navigation targets", () => {
    expect(buildQuantLoopNavigationTarget("idea")).toEqual({
      moduleId: "watchlist",
      workflowStageId: "data"
    });
    expect(buildQuantLoopNavigationTarget("data")).toEqual({
      moduleId: "workflow",
      workflowStageId: "data"
    });
    expect(buildQuantLoopNavigationTarget("strategy")).toEqual({
      moduleId: "watchlist",
      workflowStageId: "factor"
    });
    expect(buildQuantLoopNavigationTarget("backtest")).toEqual({
      moduleId: "workflow",
      workflowStageId: "backtest"
    });
    expect(buildQuantLoopNavigationTarget("agent-review")).toEqual({
      moduleId: "workflow",
      workflowStageId: "agent"
    });
    expect(buildQuantLoopNavigationTarget("paper")).toEqual({
      moduleId: "portfolio",
      workflowStageId: "execution"
    });
    expect(buildQuantLoopNavigationTarget("broker")).toEqual({
      moduleId: "broker",
      workflowStageId: "execution"
    });
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

  test("derives TradingAgents-style committee rounds from workspace evidence", () => {
    const rounds = buildAgentCommitteeRounds(buildTerminalWorkspace());

    expect(rounds.map((round) => round.id)).toEqual([
      "technical-analysis",
      "bull-research",
      "bear-research",
      "risk-manager",
      "portfolio-decision"
    ]);
    expect(rounds[0]).toMatchObject({
      phase: "analysis",
      agent: "Technical Analyst",
      verdict: "support",
      evidence: "600000 · 1d · Return +12.4% · Max DD 5.8%",
      confidence: 64
    });
    expect(rounds.find((round) => round.id === "risk-manager")).toMatchObject({
      phase: "risk",
      agent: "Risk Manager",
      verdict: "risk",
      thesis: "Live order is blocked until adapter certification and user confirmation pass.",
      confidence: 82
    });
  });

  test("builds AI evidence cards from local context and guardrails", () => {
    const cards = buildAiEvidenceCards(buildTerminalWorkspace());

    expect(cards).toEqual([
      {
        id: "context",
        label: "Research context",
        value: "600000 · 1d",
        detail: "ashare · price 8.66",
        tone: "neutral"
      },
      {
        id: "backtest",
        label: "Backtest evidence",
        value: "Pending audited run",
        detail: "Run Pipeline before trusting AI review.",
        tone: "warning"
      },
      {
        id: "risk",
        label: "Risk gates",
        value: "3 blocked gates",
        detail: "Adapter certified: blocked · Risk approved: blocked · Human confirmed: blocked",
        tone: "risk"
      },
      {
        id: "safety",
        label: "AI boundary",
        value: "No buy/sell advice",
        detail: "AI can explain supplied evidence only; no guaranteed outcome.",
        tone: "ai"
      }
    ]);
  });

  test("binds AI evidence cards to audited run metadata when available", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-evidence",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "5m",
      strategyName: "SMA trend demo",
      strategyRevision: "rev123",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "AI Summary", message: "Replay loaded", tone: "ai" }],
      executionMode: "paper_only"
    });

    expect(buildAiEvidenceCards(workspace)[1]).toEqual({
      id: "backtest",
      label: "Backtest evidence",
      value: "240 5m bars",
      detail: "Audited run run-evidence · revision rev123",
      tone: "positive"
    });
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

  test("derives paper trading rows with sizing and live gate rejection", () => {
    const rows = buildPaperTradingRows(buildTerminalWorkspace());

    expect(rows.map((row) => row.id)).toEqual(["paper-order", "risk-check", "account-sync"]);
    expect(rows[0]).toMatchObject({
      symbol: "600000",
      side: "BUY",
      quantity: "2300",
      price: "8.66",
      notional: "19918.00",
      status: "queued",
      tone: "positive"
    });
    expect(rows[1]).toMatchObject({
      side: "RISK",
      status: "blocked",
      reason: "3 live gates blocked; paper route remains available.",
      tone: "warning"
    });
  });

  test("derives paper position rows from sizing and audited return", () => {
    const rows = buildPaperPositionRows(buildTerminalWorkspace());

    expect(rows.map((row) => row.id)).toEqual(["selected-paper-position"]);
    expect(rows[0]).toMatchObject({
      symbol: "600000",
      quantity: "2300",
      avgCost: "7.70",
      markPrice: "8.66",
      marketValue: "19918.00",
      unrealizedPnl: "+2197.36",
      returnPct: "+12.4%",
      status: "paper",
      tone: "positive"
    });
  });

  test("surfaces broker adapters and certification status before live execution is available", () => {
    const rows = buildBrokerAdapterRows(buildTerminalWorkspace());

    expect(rows.map((row) => row.id)).toEqual(["paper-local", "ashare-live", "us-live", "crypto-live"]);
    expect(rows[0]).toMatchObject({
      adapter: "Local Paper Trading",
      market: "ashare",
      route: "paper",
      status: "paper_ready",
      tone: "positive"
    });
    expect(rows[1]).toMatchObject({
      adapter: "A-share broker interface",
      route: "live",
      status: "interface_only",
      tone: "risk"
    });
    expect(rows.slice(1).every((row) => row.route === "live" && row.status !== "paper_ready")).toBe(true);
  });

  test("derives visual strategy rule rows from the active strategy snapshot", () => {
    const rows = buildStrategyRuleRows(buildTerminalWorkspace());

    expect(rows.map((row) => row.id)).toEqual(["entry-rule", "exit-rule", "position-rule", "risk-rule"]);
    expect(rows[0]).toMatchObject({
      group: "entry",
      label: "Entry signal",
      condition: "Close > SMA20 and relative strength improving",
      parameter: "SMA20 / relative strength",
      status: "active",
      tone: "positive"
    });
    expect(rows[1]).toMatchObject({
      group: "exit",
      parameter: "Trend support / risk downgrade"
    });
    expect(rows.at(-1)).toMatchObject({
      group: "risk",
      label: "Risk guardrail",
      parameter: "Stop / drawdown / execution mode",
      status: "guardrail",
      tone: "risk"
    });
  });

  test("derives audited backtest trade rows from strategy and metrics", () => {
    const rows = buildBacktestTradeRows(buildTerminalWorkspace());

    expect(rows.map((row) => row.id)).toEqual(["entry-fill", "risk-review", "exit-review"]);
    expect(rows[0]).toMatchObject({
      symbol: "600000",
      side: "BUY",
      status: "filled",
      price: "8.66",
      quantity: "2300",
      exposure: "20%",
      pnl: "+12.4%",
      tone: "positive"
    });
    expect(rows[1]).toMatchObject({
      side: "RISK",
      status: "review",
      price: "-",
      quantity: "-",
      exposure: "drawdown",
      pnl: "-5.8%",
      tone: "warning"
    });
    expect(rows[2]).toMatchObject({
      side: "SELL",
      status: "open",
      reason: "Close < SMA20 or risk manager downgrade",
      tone: "neutral"
    });
  });

  test("uses audited backtest trade rows when the core supplies real trades", () => {
    const workspace = {
      ...buildTerminalWorkspace(),
      backtestTrades: [
        {
          id: "trade-1",
          timestamp: "2026-01-05T00:00:00+00:00",
          symbol: "600000",
          side: "BUY" as const,
          status: "filled" as const,
          price: "9.20",
          quantity: "2100",
          exposure: "19.3%",
          pnl: "-",
          reason: "entry_conditions",
          tone: "neutral" as const
        },
        {
          id: "trade-2",
          timestamp: "2026-02-01T00:00:00+00:00",
          symbol: "600000",
          side: "SELL" as const,
          status: "filled" as const,
          price: "10.40",
          quantity: "2100",
          exposure: "21.8%",
          pnl: "+2512.00",
          reason: "exit_conditions",
          tone: "positive" as const
        }
      ]
    };

    expect(buildBacktestTradeRows(workspace)).toEqual(workspace.backtestTrades);
  });

  test("derives module news events from local market, audit, execution, and agent evidence", () => {
    const workspace = {
      ...buildTerminalWorkspace(),
      selectedInstrument: {
        symbol: "600000",
        name: "浦发银行",
        market: "ashare" as const,
        changePct: 2.4,
        price: 9.27,
        quoteSource: "tencent",
        quoteAsOf: "2026-05-27T00:36:00+08:00"
      },
      researchRun: {
        runId: "run-local",
        createdAt: "2026-05-27T00:35:00+08:00",
        timeframe: "5m" as const,
        strategyRevision: "rev-local",
        dataRows: 240,
        executionMode: "paper_only"
      }
    };

    const events = buildModuleNewsEvents(workspace);

    expect(events[0]).toMatchObject({
      id: "quote-update",
      source: "Market data",
      impact: "positive"
    });
    expect(events[0].title).toBe("600000 quote 9.27 from tencent");
    expect(events[1]).toMatchObject({
      id: "audit-run",
      source: "Audit log",
      title: "Run run-local bound to 600000"
    });
    expect(events[2]).toMatchObject({
      id: "execution-gates",
      source: "Risk engine",
      impact: "risk"
    });
    expect(events.map((event) => event.id)).not.toContain("live-feed-pending");
  });

  test("asks for a fresh audited run in local events when no run is bound", () => {
    const events = buildModuleNewsEvents(buildTerminalWorkspace());

    expect(events.some((event) => event.id === "audit-needed")).toBe(true);
    expect(events.find((event) => event.id === "audit-needed")).toMatchObject({
      source: "Audit log",
      impact: "warning",
      title: "600000 needs a fresh audited run"
    });
    expect(events.map((event) => event.source)).toContain("AI committee");
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
      "Trades",
      "Initial cash",
      "Fee",
      "Slippage"
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

  test("compares the two latest audited research runs", () => {
    const rows = buildResearchRunComparisonRows([
      {
        runId: "run-new",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "SMA trend demo",
        strategyRevision: "rev-new",
        dataRows: 120,
        metrics: { total_return_pct: 4.2, max_drawdown_pct: 3.1, trade_count: 9 },
        decisions: [],
        executionMode: "paper_only",
        backtestAssumptions: { initialCash: 250000, feeBps: 8, slippageBps: 4 }
      },
      {
        runId: "run-old",
        createdAt: "2026-05-26T07:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "SMA trend demo",
        strategyRevision: "rev-old",
        dataRows: 100,
        metrics: { total_return_pct: 1.2, max_drawdown_pct: 4.6, trade_count: 6 },
        decisions: [],
        executionMode: "paper_only",
        backtestAssumptions: { initialCash: 100000, feeBps: 3, slippageBps: 2 }
      }
    ]);

    expect(rows).toEqual([
      {
        id: "return",
        label: "Return",
        current: "+4.20%",
        previous: "+1.20%",
        delta: "+3.00pp",
        tone: "positive"
      },
      {
        id: "drawdown",
        label: "Max DD",
        current: "3.10%",
        previous: "4.60%",
        delta: "-1.50pp",
        tone: "positive"
      },
      {
        id: "trades",
        label: "Trades",
        current: "9",
        previous: "6",
        delta: "+3",
        tone: "neutral"
      },
      {
        id: "assumptions",
        label: "Assumptions",
        current: "Cash 250,000 · Fee 8bps · Slippage 4bps",
        previous: "Cash 100,000 · Fee 3bps · Slippage 2bps",
        delta: "changed",
        tone: "warning"
      }
    ]);
  });

  test("does not compare history until two audited runs are available", () => {
    expect(buildResearchRunComparisonRows([])).toEqual([]);
    expect(
      buildResearchRunComparisonRows([
        {
          runId: "run-only",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "SMA trend demo",
          strategyRevision: "rev-only",
          dataRows: 120,
          metrics: { total_return_pct: 4.2, max_drawdown_pct: 3.1, trade_count: 9 },
          decisions: [],
          executionMode: "paper_only"
        }
      ])
    ).toEqual([]);
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
      executionMode: "paper_only",
      backtestAssumptions: { initialCash: 250000, feeBps: 8, slippageBps: 4 },
      backtestTrades: [
        {
          id: "trade-1",
          timestamp: "2026-05-26T08:00:00+00:00",
          symbol: "AAPL",
          side: "BUY",
          status: "filled",
          price: "191.20",
          quantity: "100",
          exposure: "19.12%",
          pnl: "-",
          reason: "entry_conditions",
          tone: "neutral"
        }
      ],
      backtestEquityCurve: [
        { timestamp: "2026-05-26T08:00:00+00:00", equity: 250000 },
        { timestamp: "2026-05-27T08:00:00+00:00", equity: 252000 }
      ],
      backtestDiagnostics: [
        {
          id: "return-profile",
          label: "Return profile",
          value: "-1.25%",
          detail: "Total return over 120 bars",
          tone: "warning"
        }
      ]
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
    expect(workspace.backtestAssumptions).toEqual({ initialCash: 250000, feeBps: 8, slippageBps: 4 });
    expect(workspace.backtestTrades).toEqual([
      {
        id: "trade-1",
        timestamp: "2026-05-26T08:00:00+00:00",
        symbol: "AAPL",
        side: "BUY",
        status: "filled",
        price: "191.20",
        quantity: "100",
        exposure: "19.12%",
        pnl: "-",
        reason: "entry_conditions",
        tone: "neutral"
      }
    ]);
    expect(workspace.backtestEquityCurve).toEqual([
      { timestamp: "2026-05-26T08:00:00+00:00", equity: 250000 },
      { timestamp: "2026-05-27T08:00:00+00:00", equity: 252000 }
    ]);
    expect(workspace.backtestDiagnostics).toEqual([
      {
        id: "return-profile",
        label: "Return profile",
        value: "-1.25%",
        detail: "Total return over 120 bars",
        tone: "warning"
      }
    ]);
    expect(workspace.decisionLog[0].message).toBe("Replay loaded");
    expect(workspace.researchRun?.runId).toBe("run-history");
  });

  test("replays structured strategy config into the strategy snapshot", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-structured",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "Custom SMA risk plan",
      strategyRevision: "rev-structured",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [],
      executionMode: "paper_only",
      strategyConfig: {
        name: "Custom SMA risk plan",
        revision: "rev-structured",
        market: "ashare",
        symbols: ["600000"],
        timeframe: "1d",
        version: 1,
        entryConditions: [{ kind: "close_above_sma", params: { window: 5 } }],
        exitConditions: [{ kind: "close_below_sma", params: { window: 7 } }],
        risk: {
          positionPct: 0.25,
          stopLossPct: 0.06,
          takeProfitPct: 0.12,
          maxDrawdownPct: 0.09
        }
      }
    });

    expect(workspace.strategy).toEqual({
      name: "Custom SMA risk plan",
      entry: "close_above_sma(window=5)",
      exit: "close_below_sma(window=7)",
      position: "25.00% position cap",
      risk: "Stop 6.00% / take profit 12.00% / max drawdown 9.00%"
    });
  });

  test("replays audited AI report into the decision log when raw decisions are absent", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-ai-report",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-ai-report",
      dataRows: 180,
      metrics: {
        total_return_pct: 6.2,
        max_drawdown_pct: 2.4,
        win_rate_pct: 55,
        trade_count: 7
      },
      decisions: [],
      executionMode: "paper_only",
      aiReport: {
        summary: "Audited AI summary grounded in backtest metrics.",
        risks: ["Volume confirmation is still weak."],
        improvements: ["Compare against sector benchmark before paper execution."],
        disclaimer: "This is research context only, not investment advice."
      }
    });

    expect(workspace.decisionLog).toEqual([
      {
        agent: "AI Summary",
        message: "Audited AI summary grounded in backtest metrics.",
        tone: "ai"
      },
      {
        agent: "Risk Manager",
        message: "Volume confirmation is still weak.",
        tone: "risk"
      },
      {
        agent: "Portfolio Manager",
        message: "Compare against sector benchmark before paper execution.",
        tone: "warning"
      },
      {
        agent: "AI Boundary",
        message: "This is research context only, not investment advice.",
        tone: "ai"
      }
    ]);
  });

  test("builds a full workflow state when an audited run is replayed", () => {
    const state = buildAuditReplayWorkflowState({
      runId: "run-history",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "15m",
      strategyName: "SMA trend demo",
      strategyRevision: "rev123",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [
        { agent: "AI Summary", message: "Replay loaded", tone: "ai" },
        { agent: "Risk", message: "Risk review loaded", tone: "risk" }
      ],
      executionMode: "paper_only"
    });

    expect(state.activeStageId).toBe("execution");
    expect(state.completedStageIds).toEqual(["data", "factor", "backtest", "agent"]);
    expect(state.log.map((entry) => entry.stageId)).toEqual(["data", "factor", "backtest", "agent", "execution"]);
    expect(state.log[0]).toMatchObject({
      level: "success",
      message: "Audit data snapshot restored: 600000 · 15m · 240 bars"
    });
    expect(state.log[1].message).toBe("Strategy revision restored: rev123");
    expect(state.log[3].message).toBe("Decision notes restored: 2");
    expect(state.log[4]).toMatchObject({
      level: "warning",
      message: "Execution mode restored: paper_only; live gates remain controlled locally"
    });
  });

  test("surfaces audited run data quality in the replay workflow state", () => {
    const state = buildAuditReplayWorkflowState({
      runId: "run-quality",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1m",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-quality",
      dataRows: 160,
      metrics: {
        total_return_pct: 2.4,
        max_drawdown_pct: 1.2,
        win_rate_pct: 50,
        trade_count: 4
      },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: {
        source: "demo-fallback",
        isComplete: false,
        warnings: ["upstream minute data unavailable"],
        rows: 160
      }
    });

    expect(state.log[0]).toMatchObject({
      level: "warning",
      message: "Audit data snapshot restored: 600000 · 1m · 160 bars · source demo-fallback · 1 warning"
    });
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

  test("edits strategy fields locally and invalidates stale audited results", () => {
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

    const workspace = workspaceWithStrategyField(auditedWorkspace, "entry", "RSI < 30 rebound confirmation");

    expect(workspace.strategy.entry).toBe("RSI < 30 rebound confirmation");
    expect(workspace.researchRun).toBeNull();
    expect(workspace.metrics.map((metric) => metric.value)).toEqual(["N/A", "N/A", "N/A", "0"]);
    expect(workspace.decisionLog[0]).toEqual({
      agent: "Strategy Editor",
      message: "Strategy field entry updated locally. Run Pipeline to generate a fresh audited backtest.",
      tone: "warning"
    });
  });

  test("edits backtest assumptions locally and invalidates stale audited results", () => {
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

    const workspace = workspaceWithBacktestAssumption(auditedWorkspace, "feeBps", 8);

    expect(resolveBacktestAssumptions(buildTerminalWorkspace())).toEqual({
      initialCash: 100000,
      feeBps: 3,
      slippageBps: 2
    });
    expect(workspace.backtestAssumptions).toEqual({
      initialCash: 100000,
      feeBps: 8,
      slippageBps: 2
    });
    expect(workspace.researchRun).toBeNull();
    expect(workspace.metrics.map((metric) => metric.value)).toEqual(["N/A", "N/A", "N/A", "0"]);
    expect(workspace.decisionLog[0]).toEqual({
      agent: "Backtest Lab",
      message: "Backtest assumption feeBps updated locally. Run Pipeline to generate a fresh audited backtest.",
      tone: "warning"
    });
  });

  test("derives editable backtest assumption rows for the replay panel", () => {
    const rows = buildBacktestAssumptionRows(
      workspaceWithBacktestAssumption(buildTerminalWorkspace(), "initialCash", 250000)
    );

    expect(rows).toEqual([
      { field: "initialCash", label: "Initial cash", value: 250000, suffix: "CNY", min: 1000, step: 1000 },
      { field: "feeBps", label: "Fee", value: 3, suffix: "bps", min: 0, step: 1 },
      { field: "slippageBps", label: "Slippage", value: 2, suffix: "bps", min: 0, step: 1 }
    ]);
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
