import { describe, expect, test } from "vitest";
import {
  agentRoleLabels,
  buildAgentCommitteeRounds,
  buildAiActionWorkflowState,
  buildAiEvidenceCards,
  buildAiReviewDossier,
  buildAiReviewReportMarkdown,
  buildAiReviewRunRecord,
  buildAuditReplayWorkflowState,
  buildBacktestAssumptionRows,
  buildBacktestEvidenceCards,
  buildBacktestParameterScanRows,
  buildBacktestParameterScanSummary,
  buildBacktestReport,
  buildBacktestReportMarkdown,
  buildBacktestReadinessGates,
  buildBacktestTradeRows,
  buildBrokerAdapterRows,
  buildInstrumentFromSymbol,
  buildModuleNewsEvents,
  buildPaperExecutionSummaryTiles,
  buildPaperPositionRows,
  buildPaperTradingRows,
  buildPromotionReadiness,
  buildPortfolioRiskRows,
  buildProductWorkAreas,
  buildQuantLoopNavigationTarget,
  resolveQuantLoopSelection,
  resolveProductWorkAreaSelection,
  buildResearchRunComparisonRows,
  buildRiskApprovalSummary,
  buildScannerCandidates,
  buildStrategyReadinessGates,
  buildStrategyRuleDraft,
  buildStrategyRuleRows,
  buildStrategyTemplateOptions,
  buildStrategyVersionDiffRows,
  buildTerminalWorkspace,
  buildWorkflowStages,
  executionModeLabel,
  formatInstrumentPrice,
  researchRunEvidenceLogLabel,
  researchRunHistoryLabel,
  researchRunLabel,
  quantLoopLabels,
  resolveBacktestAssumptions,
  type TerminalWorkspace,
  type WorkflowRunState,
  visiblePanels,
  workspaceWithAiAction,
  workspaceWithBacktestAssumption,
  workspaceWithBacktestParameterCandidate,
  workspaceWithPreservedInteractiveState,
  workspaceWithPreservedSelection,
  workspaceWithStrategyLibraryItem,
  workspaceWithStrategyRuleDraftField,
  workspaceWithStrategyTemplate,
  workspaceWithStrategyField,
  workspaceWithSelectedTimeframe,
  workspaceWithSelectedInstrument,
  workspaceFromResearchRunAudit
} from "./terminal-workbench";

function quantLoopStatuses(workspace: TerminalWorkspace): Record<string, string> {
  return Object.fromEntries(workspace.quantLoop.map((step) => [step.id, step.status]));
}

function activeQuantLoopStep(workspace: TerminalWorkspace): string | undefined {
  return workspace.quantLoop.find((step) => step.status === "active")?.id;
}

describe("terminal workbench model", () => {
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

  test("builds a structured SMA strategy draft from the editable snapshot", () => {
    const workspace = workspaceWithStrategyField(
      workspaceWithStrategyField(
        workspaceWithStrategyField(buildTerminalWorkspace(), "entry", "Close > SMA5"),
        "exit",
        "Close < SMA13"
      ),
      "risk",
      "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
    );

    expect(buildStrategyRuleDraft(workspace)).toMatchObject({
      name: "SMA Trend / Bank Sector",
      entryKind: "close_above_sma",
      entryWindow: 5,
      exitKind: "close_below_sma",
      exitWindow: 13,
      positionPct: 20,
      stopLossPct: 6,
      takeProfitPct: 12,
      maxDrawdownPct: 9,
      paperOnly: true
    });
  });

  test("starts with canonical risk text that matches the structured editor defaults", () => {
    const workspace = buildTerminalWorkspace();

    expect(workspace.strategy.risk).toBe("Stop -8%, take profit +18%, drawdown guard 12%, paper only");
    expect(buildStrategyRuleDraft(workspace)).toMatchObject({
      positionPct: 20,
      stopLossPct: 8,
      takeProfitPct: 18,
      maxDrawdownPct: 12,
      paperOnly: true
    });
    expect(buildStrategyReadinessGates(workspace).map((gate) => gate.status)).toEqual([
      "passed",
      "passed",
      "passed",
      "review"
    ]);
  });

  test("updates structured strategy draft fields as canonical auditable strategy text", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-structured-editor",
      createdAt: "2026-05-28T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-structured",
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

    const updatedWorkspace = workspaceWithStrategyRuleDraftField(
      workspaceWithStrategyRuleDraftField(
        workspaceWithStrategyRuleDraftField(auditedWorkspace, "entryWindow", 7),
        "positionPct",
        35
      ),
      "takeProfitPct",
      16
    );

    expect(updatedWorkspace.strategy.entry).toBe("Close > SMA7");
    expect(updatedWorkspace.strategy.exit).toBe("Close < SMA20");
    expect(updatedWorkspace.strategy.position).toBe("35% max capital allocation");
    expect(updatedWorkspace.strategy.risk).toBe("Stop -8%, take profit +16%, drawdown guard 12%, paper only");
    expect(updatedWorkspace.researchRun).toBeNull();
    expect(quantLoopStatuses(updatedWorkspace).paper).toBe("locked");
    expect(updatedWorkspace.decisionLog[0]).toMatchObject({
      agent: "Strategy Builder",
      tone: "warning"
    });
  });

  test("updates structured RSI strategy draft fields as canonical auditable strategy text", () => {
    const workspace = workspaceWithStrategyRuleDraftField(
      workspaceWithStrategyRuleDraftField(
        workspaceWithStrategyRuleDraftField(
          workspaceWithStrategyRuleDraftField(
            workspaceWithStrategyRuleDraftField(
              workspaceWithStrategyRuleDraftField(buildTerminalWorkspace(), "entryKind", "rsi_below"),
              "entryWindow",
              14
            ),
            "entryThreshold",
            30
          ),
          "exitKind",
          "rsi_above"
        ),
        "exitWindow",
        14
      ),
      "exitThreshold",
      55
    );

    expect(workspace.strategy.entry).toBe("RSI14 < 30");
    expect(workspace.strategy.exit).toBe("RSI14 > 55");
    expect(buildStrategyRuleRows(workspace).map((row) => row.parameter)).toEqual([
      "RSI14<30",
      "RSI14>55",
      "20% exposure cap",
      "Stop / take profit / drawdown / execution mode"
    ]);
    expect(buildStrategyReadinessGates(workspace)[0]).toMatchObject({
      status: "passed",
      value: "RSI14<30 / RSI14>55"
    });
  });

  test("restores structured RSI strategy snapshots into editable draft fields", () => {
    const workspace = workspaceWithStrategyField(
      workspaceWithStrategyField(buildTerminalWorkspace(), "entry", "RSI14 < 30"),
      "exit",
      "RSI14 > 55"
    );

    expect(buildStrategyRuleDraft(workspace)).toMatchObject({
      entryKind: "rsi_below",
      entryWindow: 14,
      entryThreshold: 30,
      exitKind: "rsi_above",
      exitWindow: 14,
      exitThreshold: 55
    });
  });

  test("updates structured volume confirmation fields as canonical auditable entry text", () => {
    const workspace = workspaceWithStrategyRuleDraftField(
      workspaceWithStrategyRuleDraftField(
        workspaceWithStrategyRuleDraftField(buildTerminalWorkspace(), "entryWindow", 5),
        "entryVolumeConfirm",
        true
      ),
      "entryVolumeWindow",
      10
    );

    expect(workspace.strategy.entry).toBe("Close > SMA5 AND Volume > VOL10");
    expect(buildStrategyRuleRows(workspace)[0]).toMatchObject({
      condition: "Close > SMA5 AND Volume > VOL10",
      parameter: "SMA5 / VOL10"
    });
    expect(buildStrategyReadinessGates(workspace)[0]).toMatchObject({
      status: "passed",
      value: "SMA5 / VOL10 / SMA20"
    });
  });

  test("restores structured volume confirmation snapshots into editable draft fields", () => {
    const workspace = workspaceWithStrategyField(buildTerminalWorkspace(), "entry", "Close > SMA5 AND Volume > VOL10");

    expect(buildStrategyRuleDraft(workspace)).toMatchObject({
      entryKind: "close_above_sma",
      entryWindow: 5,
      entryVolumeConfirm: true,
      entryVolumeWindow: 10
    });
  });

  test("updates structured RSI confirmation fields as a combined entry gate", () => {
    const workspace = workspaceWithStrategyRuleDraftField(
      workspaceWithStrategyRuleDraftField(
        workspaceWithStrategyRuleDraftField(buildTerminalWorkspace(), "entryRsiConfirm", true),
        "entryRsiThreshold",
        55
      ),
      "entryRsiWindow",
      14
    );

    expect(workspace.strategy.entry).toBe("Close > SMA20 AND RSI14 > 55");
    expect(buildStrategyRuleDraft(workspace)).toMatchObject({
      entryKind: "close_above_sma",
      entryWindow: 20,
      entryRsiConfirm: true,
      entryRsiWindow: 14,
      entryRsiThreshold: 55
    });
    expect(buildStrategyRuleRows(workspace)[0]).toMatchObject({
      condition: "Close > SMA20 AND RSI14 > 55",
      parameter: "SMA20 / RSI14>55"
    });
  });

  test("restores combined SMA RSI and volume snapshots into editable draft fields", () => {
    const workspace = workspaceWithStrategyField(
      buildTerminalWorkspace(),
      "entry",
      "Close > SMA5 AND RSI14 > 55 AND Volume > VOL10"
    );

    expect(buildStrategyRuleDraft(workspace)).toMatchObject({
      entryKind: "close_above_sma",
      entryWindow: 5,
      entryRsiConfirm: true,
      entryRsiWindow: 14,
      entryRsiThreshold: 55,
      entryVolumeConfirm: true,
      entryVolumeWindow: 10
    });
    expect(buildStrategyReadinessGates(workspace)[0]).toMatchObject({
      status: "passed",
      value: "SMA5 / RSI14>55 / VOL10 / SMA20"
    });
  });

  test("lists structured strategy templates for Strategy Lab", () => {
    expect(buildStrategyTemplateOptions().map((template) => template.id)).toEqual([
      "sma_trend",
      "rsi_reversal",
      "volume_breakout"
    ]);
  });

  test("applies the RSI reversal template as a fresh auditable draft", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-template-rsi",
      createdAt: "2026-05-28T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "Old audited strategy",
      strategyRevision: "rev-old-template",
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

    const workspace = workspaceWithStrategyTemplate(auditedWorkspace, "rsi_reversal");

    expect(workspace.strategy).toMatchObject({
      name: "RSI Reversal / Mean Reversion",
      entry: "RSI14 < 30",
      exit: "RSI14 > 55",
      position: "18% max capital allocation",
      risk: "Stop -7%, take profit +14%, drawdown guard 10%, paper only"
    });
    expect(workspace.researchRun).toBeNull();
    expect(buildStrategyRuleDraft(workspace)).toMatchObject({
      entryKind: "rsi_below",
      entryThreshold: 30,
      exitKind: "rsi_above",
      exitThreshold: 55,
      positionPct: 18
    });
    expect(workspace.decisionLog[0]).toMatchObject({
      agent: "Strategy Template",
      tone: "warning"
    });
  });

  test("applies the volume breakout template with volume confirmation enabled", () => {
    const workspace = workspaceWithStrategyTemplate(buildTerminalWorkspace(), "volume_breakout");

    expect(workspace.strategy.entry).toBe("Close > SMA5 AND Volume > VOL10");
    expect(buildStrategyRuleDraft(workspace)).toMatchObject({
      name: "Volume Breakout / Trend Follow",
      entryKind: "close_above_sma",
      entryWindow: 5,
      entryVolumeConfirm: true,
      entryVolumeWindow: 10,
      exitKind: "close_below_sma",
      exitWindow: 13
    });
  });

  test("keeps strategy rule matrix parameters aligned with structured edits", () => {
    const workspace = workspaceWithStrategyRuleDraftField(buildTerminalWorkspace(), "entryWindow", 7);

    expect(buildStrategyRuleRows(workspace).map((row) => row.parameter)).toEqual([
      "SMA7",
      "SMA20",
      "20% exposure cap",
      "Stop / take profit / drawdown / execution mode"
    ]);
  });

  test("summarizes Strategy Lab readiness gates before a new audit run", () => {
    const workspace = workspaceWithStrategyRuleDraftField(buildTerminalWorkspace(), "entryWindow", 8);

    expect(buildStrategyReadinessGates(workspace)).toEqual([
      {
        id: "schema",
        label: "Strategy schema",
        value: "SMA8 / SMA20",
        detail: "Entry and exit conditions are structured.",
        status: "passed",
        tone: "positive"
      },
      {
        id: "risk",
        label: "Risk controls",
        value: "20% / 8% / 18% / 12%",
        detail: "Position, stop, take profit, and drawdown guards are parseable.",
        status: "passed",
        tone: "positive"
      },
      {
        id: "execution",
        label: "Execution mode",
        value: "paper only",
        detail: "Live routing stays blocked until adapter, risk, and human gates pass.",
        status: "passed",
        tone: "positive"
      },
      {
        id: "audit",
        label: "Audit evidence",
        value: "needs run",
        detail: "Run Pipeline to bind this draft to a reproducible audit run.",
        status: "review",
        tone: "warning"
      }
    ]);
  });

  test("blocks Strategy Lab readiness when the selected context has pending rules", () => {
    const workspace = workspaceWithSelectedInstrument(buildTerminalWorkspace(), {
      symbol: "300750",
      name: "宁德时代",
      market: "ashare",
      changePct: 0,
      price: 189.5
    });

    expect(buildStrategyReadinessGates(workspace)).toEqual([
      {
        id: "schema",
        label: "Strategy schema",
        value: "pending",
        detail: "Structured entry and exit rules are required before audit.",
        status: "blocked",
        tone: "risk"
      },
      {
        id: "risk",
        label: "Risk controls",
        value: "pending",
        detail: "Position sizing and risk guardrails must be explicit.",
        status: "blocked",
        tone: "risk"
      },
      {
        id: "execution",
        label: "Execution mode",
        value: "paper only",
        detail: "Live routing stays blocked until adapter, risk, and human gates pass.",
        status: "passed",
        tone: "positive"
      },
      {
        id: "audit",
        label: "Audit evidence",
        value: "blocked",
        detail: "Fix blocked gates before running an audit pipeline.",
        status: "blocked",
        tone: "risk"
      }
    ]);
  });

  test("builds a complete terminal shell with quant loop and terminal panels", () => {
    const workspace = buildTerminalWorkspace();

    expect(quantLoopLabels(workspace)).toEqual([
      "Market Research",
      "Strategy Lab",
      "Backtest Review",
      "Agent Review",
      "Paper Trading"
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

  test("locks paper trading in the quant loop until an audited run is bound", () => {
    const workspace = buildTerminalWorkspace();

    expect(quantLoopStatuses(workspace)).toEqual({
      research: "active",
      strategy: "ready",
      backtest: "ready",
      "agent-review": "ready",
      paper: "locked"
    });
  });

  test("unlocks paper trading after an audited research run is bound", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-quant-loop",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev123",
      dataRows: 120,
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-25T08:00:00Z",
        end: "2026-05-26T08:00:00Z",
        hash: "snapshot-quant-loop",
        bars: [
          {
            timestamp: "2026-05-25T08:00:00Z",
            timestampMs: 1779696000000,
            open: 10,
            high: 10.2,
            low: 9.9,
            close: 10,
            volume: 1000
          },
          {
            timestamp: "2026-05-26T08:00:00Z",
            timestampMs: 1779782400000,
            open: 10.2,
            high: 10.6,
            low: 10.1,
            close: 10.5,
            volume: 1200
          }
        ]
      },
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "AI Summary", message: "Run loaded", tone: "ai" }],
      executionMode: "paper_only"
    });

    expect(quantLoopStatuses(workspace).paper).toBe("ready");
  });

  test("locks paper trading again when local strategy or backtest edits invalidate the audit", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-stale",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev123",
      dataRows: 120,
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-25T08:00:00Z",
        end: "2026-05-26T08:00:00Z",
        hash: "snapshot-stale",
        bars: [
          {
            timestamp: "2026-05-25T08:00:00Z",
            timestampMs: 1779696000000,
            open: 10,
            high: 10.2,
            low: 9.9,
            close: 10,
            volume: 1000
          },
          {
            timestamp: "2026-05-26T08:00:00Z",
            timestampMs: 1779782400000,
            open: 10.2,
            high: 10.6,
            low: 10.1,
            close: 10.5,
            volume: 1200
          }
        ]
      },
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "AI Summary", message: "Run loaded", tone: "ai" }],
      executionMode: "paper_only"
    });

    expect(quantLoopStatuses(workspaceWithStrategyField(auditedWorkspace, "entry", "RSI rebound")).paper).toBe(
      "locked"
    );
    expect(quantLoopStatuses(workspaceWithBacktestAssumption(auditedWorkspace, "feeBps", 8)).paper).toBe("locked");
  });

  test("moves back to research when a selected paper workflow is invalidated by a fresh market context", () => {
    const paperWorkspace = workspaceFromResearchRunAudit(
      {
        ...buildTerminalWorkspace(),
        quantLoop: [
          { id: "research", label: "Market Research", status: "ready" },
          { id: "strategy", label: "Strategy Lab", status: "ready" },
          { id: "backtest", label: "Backtest Review", status: "ready" },
          { id: "agent-review", label: "Agent Review", status: "ready" },
          { id: "paper", label: "Paper Trading", status: "active" }
        ]
      },
      {
        runId: "run-paper-active",
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
        decisions: [{ agent: "AI Summary", message: "Run loaded", tone: "ai" }],
        executionMode: "paper_only"
      }
    );

    const workspace = workspaceWithSelectedTimeframe(paperWorkspace, "15m");

    expect(activeQuantLoopStep(workspace)).toBe("research");
    expect(quantLoopStatuses(workspace).paper).toBe("locked");
  });

  test("keeps strategy and backtest edits on their matching unlocked workflow steps", () => {
    const paperWorkspace = workspaceFromResearchRunAudit(
      {
        ...buildTerminalWorkspace(),
        quantLoop: [
          { id: "research", label: "Market Research", status: "ready" },
          { id: "strategy", label: "Strategy Lab", status: "ready" },
          { id: "backtest", label: "Backtest Review", status: "ready" },
          { id: "agent-review", label: "Agent Review", status: "ready" },
          { id: "paper", label: "Paper Trading", status: "active" }
        ]
      },
      {
        runId: "run-paper-active",
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
        decisions: [{ agent: "AI Summary", message: "Run loaded", tone: "ai" }],
        executionMode: "paper_only"
      }
    );

    expect(activeQuantLoopStep(workspaceWithStrategyField(paperWorkspace, "entry", "RSI rebound"))).toBe("strategy");
    expect(activeQuantLoopStep(workspaceWithBacktestAssumption(paperWorkspace, "feeBps", 8))).toBe("backtest");
  });

  test("falls back to the active research step when a locked quant loop step is requested", () => {
    const selection = resolveQuantLoopSelection(buildTerminalWorkspace(), "paper");

    expect(selection).toEqual({
      stepId: "research",
      target: {
        moduleId: "watchlist",
        workflowStageId: "data"
      }
    });
  });

  test("allows paper quant loop navigation after an audited run is bound", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-paper-nav",
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
      decisions: [{ agent: "AI Summary", message: "Run loaded", tone: "ai" }],
      executionMode: "paper_only"
    });

    expect(resolveQuantLoopSelection(workspace, "paper")).toEqual({
      stepId: "paper",
      target: {
        moduleId: "portfolio",
        workflowStageId: "execution"
      }
    });
  });

  test("maps quant loop steps to concrete workspace navigation targets", () => {
    expect(buildQuantLoopNavigationTarget("research")).toEqual({
      moduleId: "watchlist",
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
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-26T08:00:00+00:00",
        end: "2026-05-27T08:00:00+00:00",
        hash: "snapshot-evidence",
        bars: [
          {
            timestamp: "2026-05-26T08:00:00+00:00",
            timestampMs: 1779782400000,
            open: 10,
            high: 10.2,
            low: 9.9,
            close: 10,
            volume: 1200000
          },
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            timestampMs: 1779868800000,
            open: 10.1,
            high: 10.7,
            low: 10,
            close: 10.5,
            volume: 1300000
          }
        ]
      }
    });

    expect(buildAiEvidenceCards(workspace)[1]).toEqual({
      id: "backtest",
      label: "Backtest evidence",
      value: "240 5m bars",
      detail: "Audited run run-evidence · revision rev123",
      tone: "positive"
    });
    expect(buildAiEvidenceCards(workspace).find((card) => card.id === "benchmark")).toEqual({
      id: "benchmark",
      label: "Benchmark alpha",
      value: "+3.20pp",
      detail: "Strategy +8.20% vs buy-and-hold +5.00% over 2 audited bars.",
      tone: "positive"
    });
  });

  test("adds locked research notes to the AI evidence boundary", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-note-evidence",
      createdAt: "2026-05-29T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-note",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [],
      executionMode: "paper_only",
      researchNote: {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        body: "关注银行板块相对强度，等待放量确认。",
        updatedAt: "2026-05-29T07:55:00+00:00"
      }
    });

    expect(buildAiEvidenceCards(workspace).find((card) => card.id === "research-note")).toEqual({
      id: "research-note",
      label: "Research note",
      value: "Locked note snapshot",
      detail: "关注银行板块相对强度，等待放量确认。",
      tone: "ai"
    });
    expect(buildAiReviewDossier(workspace).citations.find((citation) => citation.id === "research-note")).toEqual({
      id: "research-note",
      label: "Research note",
      value: "Locked note snapshot",
      detail: "关注银行板块相对强度，等待放量确认。",
      tone: "ai"
    });
  });

  test("blocks the AI review dossier until an audited run is bound", () => {
    expect(buildAiReviewDossier(buildTerminalWorkspace())).toEqual({
      status: "blocked",
      headline: "Audited evidence required",
      summary: "Run Pipeline before agent debate, explanation, or strategy promotion.",
      citations: [
        {
          id: "run",
          label: "Run id",
          value: "Missing audited run",
          detail: "No reproducible backtest is bound to this context.",
          tone: "risk"
        },
        {
          id: "data-quality",
          label: "Data quality",
          value: "Unavailable",
          detail: "Data quality is only trusted after an audited run is loaded.",
          tone: "warning"
        },
        {
          id: "risk-gates",
          label: "Risk gates",
          value: "3 blocked gates",
          detail: "Adapter certified: blocked · Risk approved: blocked · Human confirmed: blocked",
          tone: "risk"
        }
      ]
    });
  });

  test("builds an evidence-locked AI review dossier from audited run metadata", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-ai-dossier",
      createdAt: "2026-05-28T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-ai-dossier",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240
      },
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-26T08:00:00+00:00",
        end: "2026-05-27T08:00:00+00:00",
        hash: "snapshot-dossier",
        bars: [
          {
            timestamp: "2026-05-26T08:00:00+00:00",
            timestampMs: 1779782400000,
            open: 10,
            high: 10.2,
            low: 9.9,
            close: 10,
            volume: 1200000
          },
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            timestampMs: 1779868800000,
            open: 10.1,
            high: 10.7,
            low: 10,
            close: 10.5,
            volume: 1300000
          }
        ]
      }
    });

    expect(buildAiReviewDossier(workspace)).toEqual({
      status: "ready",
      headline: "AI review bound to run-ai-dossier",
      summary: "Agents may explain evidence for 600000, but live execution remains gated.",
      citations: [
        {
          id: "run",
          label: "Run id",
          value: "run-ai-dossier",
          detail: "240 1d bars · paper_only",
          tone: "positive"
        },
        {
          id: "metrics",
          label: "Backtest metrics",
          value: "+8.20% / 3.10% / 9 trades",
          detail: "Win rate 55.00%; no guaranteed outcome.",
          tone: "positive"
        },
        {
          id: "benchmark",
          label: "Benchmark alpha",
          value: "+3.20pp",
          detail: "Strategy +8.20% vs buy-and-hold +5.00% over 2 audited bars.",
          tone: "positive"
        },
        {
          id: "parameter-scan",
          label: "Parameter scan",
          value: expect.stringMatching(/candidate for re-audit|No candidate cleared for re-audit/u),
          detail: expect.stringContaining("not investment advice"),
          tone: expect.stringMatching(/positive|warning|neutral|risk/u)
        },
        {
          id: "strategy",
          label: "Strategy revision",
          value: "rev-ai-dossier",
          detail: "SMA trend demo",
          tone: "positive"
        },
        {
          id: "data-quality",
          label: "Data quality",
          value: "tencent · complete",
          detail: "240 rows · 0 warnings",
          tone: "positive"
        },
        {
          id: "risk-gates",
          label: "Risk gates",
          value: "3 blocked gates",
          detail: "Adapter certified: blocked · Risk approved: blocked · Human confirmed: blocked",
          tone: "risk"
        }
      ]
    });
  });

  test("builds a portable AI review markdown report from audited evidence", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-ai-report-md",
      createdAt: "2026-05-28T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-ai-report-md",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [
        { agent: "Technical", message: "Trend improved after the audit run.", tone: "positive" },
        { agent: "Risk", message: "Keep paper-only gates closed for live routing.", tone: "risk" }
      ],
      executionMode: "paper_only",
      dataQuality: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240
      },
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-26T08:00:00+00:00",
        end: "2026-05-27T08:00:00+00:00",
        hash: "snapshot-ai-report-md",
        bars: [
          {
            timestamp: "2026-05-26T08:00:00+00:00",
            timestampMs: 1779782400000,
            open: 10,
            high: 10.2,
            low: 9.9,
            close: 10,
            volume: 1200000
          },
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            timestampMs: 1779868800000,
            open: 10.1,
            high: 10.7,
            low: 10,
            close: 10.5,
            volume: 1300000
          }
        ]
      },
      researchNote: {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        body: "关注银行板块相对强度，等待放量确认。",
        updatedAt: "2026-05-29T07:55:00+00:00"
      }
    });

    const markdown = buildAiReviewReportMarkdown(workspace);

    expect(markdown).toContain("# AIQuant Evidence-Locked AI Review");
    expect(markdown).toContain("Run ID: `run-ai-report-md`");
    expect(markdown).toContain("Strategy revision: `rev-ai-report-md`");
    expect(markdown).toContain("| Benchmark alpha | +3.20pp |");
    expect(markdown).toContain("## Parameter Scan Summary");
    expect(markdown).toContain("| Candidate for re-audit |");
    expect(markdown).toContain("Candidate must be re-audited; no investment advice.");
    expect(markdown).toContain("| Technical Analyst | support | 64% | Trend improved after the audit run. |");
    expect(markdown).toContain("| Risk Manager | risk | 82% | Keep paper-only gates closed for live routing. |");
    expect(markdown).toContain("关注银行板块相对强度");
    expect(markdown).toContain("AI must not output buy/sell instructions or guaranteed returns.");
  });

  test("does not export an AI review report before audited evidence exists", () => {
    expect(buildAiReviewReportMarkdown(buildTerminalWorkspace())).toBeNull();
  });

  test("builds a structured AI review run record from audited evidence", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-ai-record",
      createdAt: "2026-05-28T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-ai-record",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [
        { agent: "Technical", message: "Trend improved after the audit run.", tone: "positive" },
        { agent: "Risk", message: "Keep paper-only gates closed for live routing.", tone: "risk" }
      ],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-26T08:00:00+00:00",
        end: "2026-05-27T08:00:00+00:00",
        hash: "snapshot-ai-record",
        bars: [
          {
            timestamp: "2026-05-26T08:00:00+00:00",
            timestampMs: 1779782400000,
            open: 10,
            high: 10.2,
            low: 9.9,
            close: 10,
            volume: 1200000
          },
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            timestampMs: 1779868800000,
            open: 10.1,
            high: 10.7,
            low: 10,
            close: 10.5,
            volume: 1300000
          }
        ]
      }
    });

    const record = buildAiReviewRunRecord(workspace);

    expect(record).toMatchObject({
      schemaVersion: 1,
      recordType: "aiqt.aiReviewRun",
      aiReviewId: "ai-review:run-ai-record:rev-ai-record",
      runId: "run-ai-record",
      strategyRevision: "rev-ai-record",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      executionMode: "paper_only",
      status: "ready",
      summary: {
        citationCount: expect.any(Number),
        roundCount: 5,
        decisionCount: 2,
        parameterScanBound: true,
        liveExecutionBlocked: true
      },
      boundary: "Evidence explanation only; no buy/sell instructions or guaranteed returns."
    });
    expect(record?.citations.map((citation) => citation.id)).toContain("parameter-scan");
    expect(record?.rounds.map((round) => round.id)).toEqual([
      "technical-analysis",
      "bull-research",
      "bear-research",
      "risk-manager",
      "portfolio-decision"
    ]);
    expect(record?.decisionLog).toHaveLength(2);
  });

  test("does not build an AI review run record before audited evidence exists", () => {
    expect(buildAiReviewRunRecord(buildTerminalWorkspace())).toBeNull();
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

  test("blocks execution approval until audited evidence is bound", () => {
    const approval = buildRiskApprovalSummary(buildTerminalWorkspace());

    expect(approval.status).toBe("blocked");
    expect(approval.headline).toBe("Risk approval blocked");
    expect(approval.gates.map((gate) => gate.id)).toEqual([
      "audited-run",
      "ai-evidence",
      "position-limit",
      "drawdown-limit",
      "execution-route"
    ]);
    expect(approval.gates[0]).toMatchObject({
      value: "No audited run",
      status: "blocked",
      tone: "risk"
    });
    expect(approval.gates[1]).toMatchObject({
      value: "Evidence dossier blocked",
      status: "blocked"
    });
    expect(approval.gates[4]).toMatchObject({
      value: "paper blocked",
      status: "blocked"
    });
  });

  test("approves paper execution while live gates remain closed after audited evidence", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-risk-ready",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-risk-ready",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240
      }
    });

    const approval = buildRiskApprovalSummary(workspace);

    expect(approval.status).toBe("paper_ready");
    expect(approval.headline).toBe("Paper execution approved");
    expect(approval.summary).toBe(
      "Audited run run-risk-ready can stage paper orders; live trading remains blocked until 3 gates pass."
    );
    expect(approval.gates.map((gate) => gate.status)).toEqual(["passed", "passed", "passed", "passed", "passed", "review"]);
    expect(approval.gates[2]).toMatchObject({
      id: "data-quality",
      value: "tencent · complete",
      tone: "positive"
    });
    expect(approval.gates[3]).toMatchObject({
      value: "20% cap",
      tone: "positive"
    });
    expect(approval.gates[4]).toMatchObject({
      value: "5.8% / 12% guard",
      tone: "positive"
    });
    expect(approval.gates[5]).toMatchObject({
      value: "paper only",
      detail: "Paper route can stage; 3 live gates still blocked."
    });
  });

  test("blocks paper execution when audited data quality is incomplete", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-risk-incomplete-data",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-risk-incomplete-data",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: {
        source: "demo-fallback",
        isComplete: false,
        warnings: ["upstream unavailable"],
        rows: 240
      }
    });

    const approval = buildRiskApprovalSummary(workspace);
    const rows = buildPaperTradingRows(workspace);
    const readiness = buildPromotionReadiness(workspace, null, buildBrokerAdapterRows(workspace));

    expect(approval.status).toBe("blocked");
    expect(approval.gates.find((gate) => gate.id === "data-quality")).toMatchObject({
      value: "demo-fallback · review",
      status: "blocked",
      tone: "risk"
    });
    expect(rows[0]).toMatchObject({
      status: "blocked",
      reason: "Risk approval blocked before staging paper execution."
    });
    expect(rows[1]).toMatchObject({
      status: "blocked",
      reason: "Paper execution requires complete audited market data; current source demo-fallback is review-only."
    });
    expect(readiness.status).toBe("blocked");
    expect(readiness.stages.find((stage) => stage.id === "risk-approval")).toMatchObject({
      value: "risk blocked",
      status: "blocked"
    });
  });

  test("uses audited strategy risk for approval even when the visible draft changes", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-risk-locked",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "Audited SMA plan",
      strategyRevision: "rev-risk-locked",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240
      },
      strategyConfig: {
        name: "Audited SMA plan",
        revision: "rev-risk-locked",
        market: "ashare",
        symbols: ["600000"],
        timeframe: "1d",
        version: 1,
        entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
        exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
        risk: {
          positionPct: 0.1,
          stopLossPct: 0.08,
          takeProfitPct: 0.18,
          maxDrawdownPct: 0.2
        }
      }
    });
    const editedWorkspace = {
      ...auditedWorkspace,
      strategy: {
        ...auditedWorkspace.strategy,
        position: "80% cap per instrument",
        risk: "Stop -2%, take profit +3%, drawdown guard 2%, paper only"
      }
    };

    const approval = buildRiskApprovalSummary(editedWorkspace);

    expect(approval.status).toBe("paper_ready");
    expect(approval.gates.find((gate) => gate.id === "position-limit")).toMatchObject({
      value: "10% cap",
      detail: "Sizing uses the audited strategy position guardrail."
    });
    expect(approval.gates.find((gate) => gate.id === "drawdown-limit")).toMatchObject({
      value: "5.8% / 20% guard",
      status: "passed"
    });
  });

  test("blocks paper trading rows until an audited research run is bound", () => {
    const rows = buildPaperTradingRows(buildTerminalWorkspace());

    expect(rows.map((row) => row.id)).toEqual(["paper-order", "risk-check", "account-sync"]);
    expect(rows[0]).toMatchObject({
      symbol: "600000",
      side: "BUY",
      quantity: "-",
      price: "-",
      notional: "-",
      status: "blocked",
      reason: "Run Pipeline before staging a paper order.",
      tone: "warning"
    });
    expect(rows[1]).toMatchObject({
      side: "RISK",
      status: "blocked",
      reason: "No audited research run is bound; paper route remains blocked.",
      tone: "warning"
    });
  });

  test("derives paper trading rows with sizing and live gate rejection after audit", () => {
    const rows = buildPaperTradingRows({
      ...buildTerminalWorkspace(),
      researchRun: {
        runId: "run-paper-ready",
        createdAt: "2026-05-26T08:00:00+00:00",
        timeframe: "1d",
        strategyRevision: "rev-paper-ready",
        dataRows: 240,
        executionMode: "paper_only",
        dataQuality: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 240
        }
      }
    });

    expect(rows[0]).toMatchObject({
      symbol: "600000",
      side: "BUY",
      quantity: "2300",
      price: "8.66",
      notional: "19918.00",
      status: "queued",
      reason: "Paper order staged from SMA Trend / Bank Sector using audited run run-paper-ready; no live route is used.",
      tone: "positive"
    });
    expect(rows[1]).toMatchObject({
      side: "RISK",
      status: "blocked",
      reason: "3 live gates blocked; paper route remains available.",
      tone: "warning"
    });
  });

  test("sizes paper trading previews from audited strategy position risk", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-paper-audited-sizing",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "Audited sizing",
      strategyRevision: "rev-paper-audited-sizing",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240
      },
      strategyConfig: {
        name: "Audited sizing",
        revision: "rev-paper-audited-sizing",
        market: "ashare",
        symbols: ["600000"],
        timeframe: "1d",
        version: 1,
        entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
        exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
        risk: {
          positionPct: 0.1,
          stopLossPct: 0.08,
          takeProfitPct: 0.18,
          maxDrawdownPct: 0.2
        }
      },
      backtestAssumptions: { initialCash: 100000, feeBps: 3, slippageBps: 2 }
    });
    const editedWorkspace = {
      ...auditedWorkspace,
      strategy: {
        ...auditedWorkspace.strategy,
        position: "80% cap per instrument"
      }
    };

    const rows = buildPaperTradingRows(editedWorkspace);
    const positions = buildPaperPositionRows(editedWorkspace);

    expect(rows[0]).toMatchObject({
      quantity: "1100",
      price: "8.66",
      notional: "9526.00"
    });
    expect(positions[0]).toMatchObject({
      quantity: "1100",
      marketValue: "9526.00"
    });
  });

  test("keeps paper orders blocked when the approval drawdown gate fails", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-risk-blocked",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-risk-blocked",
      dataRows: 240,
      metrics: { total_return_pct: -4.2, max_drawdown_pct: 18.5, win_rate_pct: 44, trade_count: 18 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240
      }
    });

    const approval = buildRiskApprovalSummary(workspace);
    const rows = buildPaperTradingRows(workspace);

    expect(approval.status).toBe("blocked");
    expect(approval.gates.find((gate) => gate.id === "drawdown-limit")).toMatchObject({
      status: "blocked",
      value: "18.5% / 12% guard"
    });
    expect(rows[0]).toMatchObject({
      symbol: "600000",
      side: "BUY",
      status: "blocked",
      reason: "Risk approval blocked before staging paper execution.",
      tone: "risk"
    });
    expect(rows[1]).toMatchObject({
      side: "RISK",
      status: "blocked",
      reason: "Audited drawdown breaches the configured guardrail.",
      tone: "risk"
    });
  });

  test("summarizes paper execution account state before any execution record exists", () => {
    const tiles = buildPaperExecutionSummaryTiles(buildTerminalWorkspace(), null);

    expect(tiles.map((tile) => tile.id)).toEqual(["account-sync", "paper-positions", "risk-gates"]);
    expect(tiles[0]).toMatchObject({
      label: "Account sync",
      value: "No paper execution",
      detail: "Run Pipeline and submit a paper order to create a local account snapshot.",
      tone: "warning"
    });
    expect(tiles[1]).toMatchObject({
      value: "0 paper / 0 live",
      detail: "No filled paper positions are linked to the active audited run."
    });
    expect(tiles[2]).toMatchObject({
      value: "3 live gates blocked",
      tone: "warning"
    });
  });

  test("summarizes paper execution account, positions, and gates from persisted execution", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-paper-account",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-paper-account",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240
      }
    });
    const execution = {
      executionId: "paper-summary",
      runId: "run-paper-account",
      createdAt: "2026-05-26T08:00:00+00:00",
      mode: "paper_only",
      account: {
        cash: 80_659,
        equity: 100_000,
        positions: { "600000": 2100 }
      },
      orders: [
        {
          orderId: "order-paper-summary",
          symbol: "600000",
          side: "buy" as const,
          quantity: 2100,
          price: 9.21,
          status: "filled" as const,
          reason: "filled_immediately",
          timestamp: "2026-05-26T08:00:00+00:00"
        }
      ],
      gates: [
        { id: "audit-run-bound", label: "Audit run bound", passed: true, reason: "bound" },
        { id: "paper-risk-check", label: "Paper risk check", passed: true, reason: "filled_immediately" },
        { id: "live-route-blocked", label: "Live route blocked", passed: false, reason: "paper only" }
      ]
    };

    const tiles = buildPaperExecutionSummaryTiles(workspace, execution);
    const positions = buildPaperPositionRows(workspace, execution);

    expect(tiles[0]).toMatchObject({
      value: "Cash 80,659 / Equity 100,000",
      detail: "Snapshot paper-summary · paper_only",
      tone: "positive"
    });
    expect(tiles[1]).toMatchObject({
      value: "1 paper / 0 live",
      detail: "600000: 2100"
    });
    expect(tiles[2]).toMatchObject({
      value: "2 passed / 1 blocked",
      detail: "Audit run bound: passed · Paper risk check: passed · Live route blocked: blocked",
      tone: "warning"
    });
    expect(positions).toEqual([
      {
        id: "paper-position-600000",
        symbol: "600000",
        quantity: "2100",
        avgCost: "9.21",
        markPrice: "8.66",
        marketValue: "18186.00",
        unrealizedPnl: "-1155.00",
        returnPct: "-5.97%",
        status: "paper",
        tone: "warning"
      }
    ]);
  });

  test("blocks paper position rows until audited return is bound", () => {
    const rows = buildPaperPositionRows(buildTerminalWorkspace());

    expect(rows.map((row) => row.id)).toEqual(["selected-paper-position"]);
    expect(rows[0]).toMatchObject({
      symbol: "600000",
      quantity: "0",
      avgCost: "-",
      markPrice: "8.66",
      marketValue: "0.00",
      unrealizedPnl: "-",
      returnPct: "N/A",
      status: "blocked",
      tone: "warning"
    });
  });

  test("derives paper position rows from sizing and audited return", () => {
    const rows = buildPaperPositionRows({
      ...buildTerminalWorkspace(),
      researchRun: {
        runId: "run-position-ready",
        createdAt: "2026-05-26T08:00:00+00:00",
        timeframe: "1d",
        strategyRevision: "rev-position-ready",
        dataRows: 240,
        executionMode: "paper_only"
      }
    });

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

  test("blocks promotion readiness before an audited run is bound", () => {
    const workspace = buildTerminalWorkspace();
    const readiness = buildPromotionReadiness(workspace, null, buildBrokerAdapterRows(workspace));

    expect(readiness.status).toBe("blocked");
    expect(readiness.headline).toBe("Promotion queue blocked");
    expect(readiness.stages.map((stage) => stage.id)).toEqual([
      "audited-run",
      "risk-approval",
      "paper-execution",
      "adapter-certification",
      "human-confirmation"
    ]);
    expect(readiness.stages[0]).toMatchObject({
      value: "No audited run",
      status: "blocked",
      tone: "risk"
    });
    expect(readiness.stages[2]).toMatchObject({
      value: "No paper fill",
      status: "blocked"
    });
  });

  test("requires paper execution before a run can enter live promotion", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-promotion-paper-required",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-promotion-paper-required",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240
      }
    });

    const readiness = buildPromotionReadiness(workspace, null, buildBrokerAdapterRows(workspace));

    expect(readiness.status).toBe("paper_pending");
    expect(readiness.headline).toBe("Paper execution required");
    expect(readiness.stages.find((stage) => stage.id === "audited-run")).toMatchObject({
      value: "run-promotion-paper-required",
      status: "passed"
    });
    expect(readiness.stages.find((stage) => stage.id === "risk-approval")).toMatchObject({
      value: "paper approved",
      status: "passed"
    });
    expect(readiness.stages.find((stage) => stage.id === "paper-execution")).toMatchObject({
      value: "No paper fill",
      status: "blocked"
    });
  });

  test("keeps live promotion pending certification after paper execution fills", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-promotion-filled",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-promotion-filled",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240
      }
    });
    const execution = {
      executionId: "paper-promotion",
      runId: "run-promotion-filled",
      createdAt: "2026-05-26T08:00:00+00:00",
      mode: "paper_only",
      account: {
        cash: 80_659,
        equity: 100_000,
        positions: { "600000": 2100 }
      },
      orders: [
        {
          orderId: "order-promotion",
          symbol: "600000",
          side: "buy" as const,
          quantity: 2100,
          price: 9.21,
          status: "filled" as const,
          reason: "filled_immediately",
          timestamp: "2026-05-26T08:00:00+00:00"
        }
      ],
      gates: [
        { id: "audit-run-bound", label: "Audit run bound", passed: true, reason: "bound" },
        { id: "paper-risk-check", label: "Paper risk check", passed: true, reason: "filled_immediately" },
        { id: "live-route-blocked", label: "Live route blocked", passed: false, reason: "paper only" }
      ]
    };

    const readiness = buildPromotionReadiness(workspace, execution, buildBrokerAdapterRows(workspace));

    expect(readiness.status).toBe("certification_pending");
    expect(readiness.headline).toBe("Live promotion pending certification");
    expect(readiness.stages.find((stage) => stage.id === "paper-execution")).toMatchObject({
      value: "1 filled order",
      status: "passed",
      tone: "positive"
    });
    expect(readiness.stages.find((stage) => stage.id === "adapter-certification")).toMatchObject({
      value: "0 certified live adapters",
      status: "blocked",
      tone: "risk"
    });
    expect(readiness.stages.find((stage) => stage.id === "human-confirmation")).toMatchObject({
      value: "manual approval required",
      status: "blocked"
    });
  });

  test("derives visual strategy rule rows from the active strategy snapshot", () => {
    const rows = buildStrategyRuleRows(buildTerminalWorkspace());

    expect(rows.map((row) => row.id)).toEqual(["entry-rule", "exit-rule", "position-rule", "risk-rule"]);
    expect(rows[0]).toMatchObject({
      group: "entry",
      label: "Entry signal",
      condition: "Close > SMA20 and relative strength improving",
      parameter: "SMA20",
      status: "active",
      tone: "positive"
    });
    expect(rows[1]).toMatchObject({
      group: "exit",
      parameter: "SMA20"
    });
    expect(rows.at(-1)).toMatchObject({
      group: "risk",
      label: "Risk guardrail",
      parameter: "Stop / take profit / drawdown / execution mode",
      status: "guardrail",
      tone: "risk"
    });
  });

  test("formats audited volume confirmation conditions for strategy replay", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-volume-condition",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "Volume confirmed SMA",
      strategyRevision: "rev-volume-condition",
      dataRows: 240,
      metrics: { total_return_pct: 8.4, max_drawdown_pct: 4.1, win_rate_pct: 55, trade_count: 10 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      strategyConfig: {
        name: "Volume confirmed SMA",
        revision: "rev-volume-condition",
        market: "ashare",
        symbols: ["600000"],
        timeframe: "1d",
        version: 1,
        entryConditions: [
          { kind: "close_above_sma", params: { window: 5 } },
          { kind: "volume_above_sma", params: { window: 10 } }
        ],
        exitConditions: [{ kind: "close_below_sma", params: { window: 5 } }],
        risk: {
          positionPct: 0.2,
          stopLossPct: 0.08,
          takeProfitPct: 0.18,
          maxDrawdownPct: 0.12
        }
      }
    });

    const rows = buildStrategyRuleRows(workspace);

    expect(workspace.strategy.entry).toBe("Close > SMA5 AND Volume > VOL10");
    expect(rows[0]).toMatchObject({
      condition: "Close > SMA5 AND Volume > VOL10",
      parameter: "SMA5 / VOL10"
    });
  });

  test("formats audited RSI conditions for strategy replay and rule parameters", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-rsi-condition",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "RSI reversal",
      strategyRevision: "rev-rsi-condition",
      dataRows: 240,
      metrics: { total_return_pct: 5.4, max_drawdown_pct: 3.1, win_rate_pct: 52, trade_count: 8 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      strategyConfig: {
        name: "RSI reversal",
        revision: "rev-rsi-condition",
        market: "ashare",
        symbols: ["600000"],
        timeframe: "1d",
        version: 1,
        entryConditions: [{ kind: "rsi_below", params: { window: 14, threshold: 30 } }],
        exitConditions: [{ kind: "rsi_above", params: { window: 14, threshold: 55 } }],
        risk: {
          positionPct: 0.35,
          stopLossPct: 0.07,
          takeProfitPct: 0.14,
          maxDrawdownPct: 0.1
        }
      }
    });

    const rows = buildStrategyRuleRows(workspace);
    const gates = buildStrategyReadinessGates(workspace);

    expect(workspace.strategy.entry).toBe("RSI14 < 30");
    expect(workspace.strategy.exit).toBe("RSI14 > 55");
    expect(rows[0]).toMatchObject({ parameter: "RSI14<30" });
    expect(rows[1]).toMatchObject({ parameter: "RSI14>55" });
    expect(gates[0]).toMatchObject({
      status: "passed",
      value: "RSI14<30 / RSI14>55"
    });
  });

  test("keeps timeframe text from becoming a volume window", () => {
    const workspace = workspaceWithAiAction(buildTerminalWorkspace(), "strategy-draft");
    const rows = buildStrategyRuleRows(workspace);

    expect(workspace.strategy.entry).toBe("Close above SMA20 with volume confirmation after 1d research context");
    expect(rows[0]).toMatchObject({
      parameter: "SMA20 / VOL20"
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

  test("builds an audited backtest evidence package from the bound research run", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-backtest-package",
      createdAt: "2026-05-28T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-backtest-package",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-28T08:00:00+00:00",
        end: "2026-05-29T08:00:00+00:00",
        hash: "snapshot-report",
        bars: [
          {
            timestamp: "2026-05-28T08:00:00+00:00",
            timestampMs: 1779955200000,
            open: 10,
            high: 10.2,
            low: 9.9,
            close: 10,
            volume: 1200000
          },
          {
            timestamp: "2026-05-29T08:00:00+00:00",
            timestampMs: 1780041600000,
            open: 10.1,
            high: 10.7,
            low: 10,
            close: 10.5,
            volume: 1300000
          }
        ]
      },
      backtestAssumptions: { initialCash: 250000, feeBps: 8, slippageBps: 4 },
      backtestDiagnostics: [
        {
          id: "turnover",
          label: "Turnover",
          value: "18.2%",
          detail: "Turnover remains inside portfolio risk limits.",
          tone: "positive"
        }
      ]
    });

    expect(buildBacktestEvidenceCards(workspace)).toEqual([
      {
        id: "run",
        label: "Run package",
        value: "run-backtest-package",
        detail: "240 1d bars · paper_only",
        tone: "positive"
      },
      {
        id: "strategy",
        label: "Strategy revision",
        value: "rev-backtest-package",
        detail: "SMA trend demo",
        tone: "positive"
      },
      {
        id: "costs",
        label: "Cost model",
        value: "8 bps / 4 bps",
        detail: "Cash 250,000",
        tone: "neutral"
      },
      {
        id: "diagnostics",
        label: "Diagnostics",
        value: "1 check",
        detail: "Turnover: Turnover remains inside portfolio risk limits.",
        tone: "positive"
      }
    ]);
  });

  test("builds an auditable backtest report for AI review and execution handoff", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-report",
      createdAt: "2026-05-29T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-report",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-28T08:00:00+00:00",
        end: "2026-05-29T08:00:00+00:00",
        hash: "snapshot-report",
        bars: [
          {
            timestamp: "2026-05-28T08:00:00+00:00",
            timestampMs: 1779955200000,
            open: 10,
            high: 10.2,
            low: 9.9,
            close: 10,
            volume: 1200000
          },
          {
            timestamp: "2026-05-29T08:00:00+00:00",
            timestampMs: 1780041600000,
            open: 10.1,
            high: 10.7,
            low: 10,
            close: 10.5,
            volume: 1300000
          }
        ]
      },
      backtestAssumptions: { initialCash: 250000, feeBps: 8, slippageBps: 4 },
      backtestTrades: [
        {
          id: "trade-1",
          timestamp: "2026-05-29T08:00:00+00:00",
          symbol: "600000",
          side: "BUY",
          status: "filled",
          price: "9.20",
          quantity: "2100",
          exposure: "20%",
          pnl: "+8.20%",
          reason: "Close > SMA20",
          tone: "positive"
        }
      ],
      backtestEquityCurve: [
        { timestamp: "2026-05-28T08:00:00+00:00", equity: 100000 },
        { timestamp: "2026-05-29T08:00:00+00:00", equity: 108200 }
      ],
      backtestDiagnostics: [
        {
          id: "coverage",
          label: "Data coverage",
          value: "240 bars",
          detail: "Data snapshot is complete.",
          tone: "positive"
        }
      ]
    });

    expect(buildBacktestReport(workspace)).toMatchObject({
      status: "ready",
      headline: "Backtest report bound to run-report",
      summary: "240 1d bars · 9 trades · AI review ready",
      runId: "run-report",
      aiReviewReady: true,
      executionReady: true,
      assumptions: { initialCash: 250000, feeBps: 8, slippageBps: 4 },
      benchmark: {
        label: "Buy and hold",
        symbol: "600000",
        strategyReturn: "+8.20%",
        benchmarkReturn: "+5.00%",
        alpha: "+3.20pp",
        sampleBars: 2,
        source: "tencent",
        tone: "positive"
      },
      tradeCount: 1,
      equityPointCount: 2,
      diagnosticCount: 1
    });
  });

  test("builds parameter scan rows from the audited data snapshot", () => {
    const workspace = workspaceFromResearchRunAudit(
      {
        ...buildTerminalWorkspace(),
        strategy: {
          name: "Short SMA audit",
          entry: "Close > SMA3",
          exit: "Close < SMA3",
          position: "20% max capital allocation",
          risk: "Stop -8%, take profit +18%, drawdown guard 12%, paper only"
        }
      },
      {
        runId: "run-parameter-scan",
        createdAt: "2026-05-28T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Short SMA audit",
        strategyRevision: "rev-parameter-scan",
        dataRows: 10,
        metrics: {
          total_return_pct: 4,
          max_drawdown_pct: 2,
          win_rate_pct: 50,
          trade_count: 4
        },
        decisions: [],
        executionMode: "paper_only",
        strategyConfig: {
          name: "Short SMA audit",
          revision: "rev-parameter-scan",
          market: "ashare",
          symbols: ["600000"],
          timeframe: "1d",
          version: 1,
          entryConditions: [{ kind: "close_above_sma", params: { window: 3 } }],
          exitConditions: [{ kind: "close_below_sma", params: { window: 3 } }],
          risk: {
            positionPct: 0.2,
            stopLossPct: 0.08,
            takeProfitPct: 0.18,
            maxDrawdownPct: 0.12
          }
        },
        dataSnapshot: {
          source: "unit-test",
          isComplete: true,
          warnings: [],
          rows: 10,
          start: "2026-05-01T00:00:00+00:00",
          end: "2026-05-10T00:00:00+00:00",
          hash: "snapshot-parameter-scan",
          bars: [10, 11, 12, 11, 13, 14, 13, 15, 16, 17].map((close, index) => ({
            timestamp: `2026-05-${String(index + 1).padStart(2, "0")}T00:00:00+00:00`,
            timestampMs: 1777593600000 + index * 86_400_000,
            open: close - 0.2,
            high: close + 0.4,
            low: close - 0.5,
            close,
            volume: 1_000_000 + index * 10_000
          }))
        }
      }
    );

    const rows = buildBacktestParameterScanRows(workspace);

    expect(rows).toHaveLength(9);
    expect(rows.map((row) => `${row.entryWindow}/${row.exitWindow}`)).toEqual([
      "1/1",
      "1/3",
      "1/8",
      "3/1",
      "3/3",
      "3/8",
      "8/1",
      "8/3",
      "8/8"
    ]);
    expect(rows.find((row) => row.status === "current")).toMatchObject({
      id: "scan-entry-3-exit-3",
      entryWindow: 3,
      exitWindow: 3,
      condition: "SMA3 / SMA3",
      dataRows: 10,
      runId: "run-parameter-scan",
      alphaVsCurrent: expect.stringMatching(/pp$/u)
    });
    expect(rows.every((row) => row.source === "snapshot-parameter-scan")).toBe(true);
  });

  test("summarizes parameter scan rows without turning them into advice", () => {
    const workspace = workspaceFromResearchRunAudit(
      {
        ...buildTerminalWorkspace(),
        strategy: {
          name: "Short SMA audit",
          entry: "Close > SMA3",
          exit: "Close < SMA3",
          position: "20% max capital allocation",
          risk: "Stop -8%, take profit +18%, drawdown guard 12%, paper only"
        }
      },
      {
        runId: "run-parameter-summary",
        createdAt: "2026-05-28T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Short SMA audit",
        strategyRevision: "rev-parameter-summary",
        dataRows: 10,
        metrics: {
          total_return_pct: 4,
          max_drawdown_pct: 2,
          win_rate_pct: 50,
          trade_count: 4
        },
        decisions: [],
        executionMode: "paper_only",
        strategyConfig: {
          name: "Short SMA audit",
          revision: "rev-parameter-summary",
          market: "ashare",
          symbols: ["600000"],
          timeframe: "1d",
          version: 1,
          entryConditions: [{ kind: "close_above_sma", params: { window: 3 } }],
          exitConditions: [{ kind: "close_below_sma", params: { window: 3 } }],
          risk: {
            positionPct: 0.2,
            stopLossPct: 0.08,
            takeProfitPct: 0.18,
            maxDrawdownPct: 0.12
          }
        },
        dataSnapshot: {
          source: "unit-test",
          isComplete: true,
          warnings: [],
          rows: 10,
          start: "2026-05-01T00:00:00+00:00",
          end: "2026-05-10T00:00:00+00:00",
          hash: "snapshot-parameter-summary",
          bars: [10, 11, 12, 11, 13, 14, 13, 15, 16, 17].map((close, index) => ({
            timestamp: `2026-05-${String(index + 1).padStart(2, "0")}T00:00:00+00:00`,
            timestampMs: 1777593600000 + index * 86_400_000,
            open: close - 0.2,
            high: close + 0.4,
            low: close - 0.5,
            close,
            volume: 1_000_000 + index * 10_000
          }))
        }
      }
    );

    const summary = buildBacktestParameterScanSummary(workspace);

    expect(summary).toMatchObject({
      totalRows: 9,
      candidateCount: 8,
      currentCondition: "SMA3 / SMA3",
      currentRank: expect.any(Number),
      bestCandidateId: expect.stringMatching(/^scan-entry-/u),
      bestCandidateCondition: expect.any(String),
      bestCandidateReturnPct: expect.stringMatching(/%$/u),
      bestCandidateMaxDrawdownPct: expect.stringMatching(/%$/u),
      bestCandidateDelta: expect.stringMatching(/pp$/u),
      riskCount: expect.any(Number),
      positiveCount: expect.any(Number),
      tone: expect.stringMatching(/positive|warning|neutral|risk/u)
    });
    expect(summary?.bestCandidateId).not.toBe("scan-entry-3-exit-3");
    expect(summary?.detail.toLowerCase()).toContain("re-audit");
    expect(summary?.detail.toLowerCase()).not.toContain("buy");
  });

  test("does not summarize parameter scans without audited rows", () => {
    expect(buildBacktestParameterScanSummary(buildTerminalWorkspace())).toBeNull();
  });

  test("builds parameter scan rows for RSI confirmation thresholds", () => {
    const workspace = workspaceFromResearchRunAudit(
      {
        ...buildTerminalWorkspace(),
        strategy: {
          name: "RSI confirmed SMA audit",
          entry: "Close > SMA3 AND RSI14 > 55",
          exit: "Close < SMA3",
          position: "20% max capital allocation",
          risk: "Stop -8%, take profit +18%, drawdown guard 12%, paper only"
        }
      },
      {
        runId: "run-rsi-parameter-scan",
        createdAt: "2026-05-28T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "RSI confirmed SMA audit",
        strategyRevision: "rev-rsi-parameter-scan",
        dataRows: 20,
        metrics: {
          total_return_pct: 4,
          max_drawdown_pct: 2,
          win_rate_pct: 50,
          trade_count: 4
        },
        decisions: [],
        executionMode: "paper_only",
        strategyConfig: {
          name: "RSI confirmed SMA audit",
          revision: "rev-rsi-parameter-scan",
          market: "ashare",
          symbols: ["600000"],
          timeframe: "1d",
          version: 1,
          entryConditions: [
            { kind: "close_above_sma", params: { window: 3 } },
            { kind: "rsi_above", params: { window: 14, threshold: 55 } }
          ],
          exitConditions: [{ kind: "close_below_sma", params: { window: 3 } }],
          risk: {
            positionPct: 0.2,
            stopLossPct: 0.08,
            takeProfitPct: 0.18,
            maxDrawdownPct: 0.12
          }
        },
        dataSnapshot: {
          source: "unit-test",
          isComplete: true,
          warnings: [],
          rows: 20,
          start: "2026-05-01T00:00:00+00:00",
          end: "2026-05-20T00:00:00+00:00",
          hash: "snapshot-rsi-parameter-scan",
          bars: [
            10, 11, 12, 11, 13, 14, 13, 15, 16, 17, 16, 18, 19, 18, 20, 21, 20, 22, 23, 24
          ].map((close, index) => ({
            timestamp: `2026-05-${String(index + 1).padStart(2, "0")}T00:00:00+00:00`,
            timestampMs: 1777593600000 + index * 86_400_000,
            open: close - 0.2,
            high: close + 0.4,
            low: close - 0.5,
            close,
            volume: 1_000_000 + index * 10_000
          }))
        }
      }
    );

    const rows = buildBacktestParameterScanRows(workspace);

    expect(rows).toHaveLength(27);
    expect(Array.from(new Set(rows.map((row) => row.entryRsiThreshold)))).toEqual([50, 55, 60]);
    expect(rows.find((row) => row.status === "current")).toMatchObject({
      id: "scan-entry-3-exit-3-rsi-55",
      entryWindow: 3,
      exitWindow: 3,
      entryRsiThreshold: 55,
      condition: "SMA3 / SMA3 / RSI>55",
      dataRows: 20,
      runId: "run-rsi-parameter-scan"
    });
  });

  test("builds parameter scan rows for volume confirmation windows", () => {
    const workspace = workspaceFromResearchRunAudit(
      {
        ...buildTerminalWorkspace(),
        strategy: {
          name: "Volume confirmed SMA audit",
          entry: "Close > SMA5 AND Volume > VOL10",
          exit: "Close < SMA5",
          position: "20% max capital allocation",
          risk: "Stop -8%, take profit +18%, drawdown guard 12%, paper only"
        }
      },
      {
        runId: "run-volume-parameter-scan",
        createdAt: "2026-05-28T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Volume confirmed SMA audit",
        strategyRevision: "rev-volume-parameter-scan",
        dataRows: 20,
        metrics: {
          total_return_pct: 4,
          max_drawdown_pct: 2,
          win_rate_pct: 50,
          trade_count: 4
        },
        decisions: [],
        executionMode: "paper_only",
        strategyConfig: {
          name: "Volume confirmed SMA audit",
          revision: "rev-volume-parameter-scan",
          market: "ashare",
          symbols: ["600000"],
          timeframe: "1d",
          version: 1,
          entryConditions: [
            { kind: "close_above_sma", params: { window: 5 } },
            { kind: "volume_above_sma", params: { window: 10 } }
          ],
          exitConditions: [{ kind: "close_below_sma", params: { window: 5 } }],
          risk: {
            positionPct: 0.2,
            stopLossPct: 0.08,
            takeProfitPct: 0.18,
            maxDrawdownPct: 0.12
          }
        },
        dataSnapshot: {
          source: "unit-test",
          isComplete: true,
          warnings: [],
          rows: 20,
          start: "2026-05-01T00:00:00+00:00",
          end: "2026-05-20T00:00:00+00:00",
          hash: "snapshot-volume-parameter-scan",
          bars: [
            10, 11, 12, 11, 13, 14, 13, 15, 16, 17, 16, 18, 19, 18, 20, 21, 20, 22, 23, 24
          ].map((close, index) => ({
            timestamp: `2026-05-${String(index + 1).padStart(2, "0")}T00:00:00+00:00`,
            timestampMs: 1777593600000 + index * 86_400_000,
            open: close - 0.2,
            high: close + 0.4,
            low: close - 0.5,
            close,
            volume: 1_000_000 + (index % 5) * 80_000 + index * 10_000
          }))
        }
      }
    );

    const rows = buildBacktestParameterScanRows(workspace);

    expect(rows).toHaveLength(27);
    expect(Array.from(new Set(rows.map((row) => row.entryVolumeWindow)))).toEqual([5, 10, 15]);
    expect(rows.find((row) => row.status === "current")).toMatchObject({
      id: "scan-entry-5-exit-5-vol-10",
      entryWindow: 5,
      exitWindow: 5,
      entryVolumeWindow: 10,
      condition: "SMA5 / SMA5 / VOL10",
      dataRows: 20,
      runId: "run-volume-parameter-scan"
    });
  });

  test("does not build parameter scan rows without an audited data snapshot", () => {
    expect(buildBacktestParameterScanRows(buildTerminalWorkspace())).toEqual([]);
  });

  test("stages a parameter scan candidate as a fresh strategy draft", () => {
    const workspace = workspaceFromResearchRunAudit(
      {
        ...buildTerminalWorkspace(),
        strategy: {
          name: "Short SMA audit",
          entry: "Close > SMA3",
          exit: "Close < SMA3",
          position: "20% max capital allocation",
          risk: "Stop -8%, take profit +18%, drawdown guard 12%, paper only"
        }
      },
      {
        runId: "run-stage-parameter",
        createdAt: "2026-05-28T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Short SMA audit",
        strategyRevision: "rev-stage-parameter",
        dataRows: 10,
        metrics: {
          total_return_pct: 4,
          max_drawdown_pct: 2,
          win_rate_pct: 50,
          trade_count: 4
        },
        decisions: [],
        executionMode: "paper_only",
        strategyConfig: {
          name: "Short SMA audit",
          revision: "rev-stage-parameter",
          market: "ashare",
          symbols: ["600000"],
          timeframe: "1d",
          version: 1,
          entryConditions: [{ kind: "close_above_sma", params: { window: 3 } }],
          exitConditions: [{ kind: "close_below_sma", params: { window: 3 } }],
          risk: {
            positionPct: 0.2,
            stopLossPct: 0.08,
            takeProfitPct: 0.18,
            maxDrawdownPct: 0.12
          }
        },
        dataSnapshot: {
          source: "unit-test",
          isComplete: true,
          warnings: [],
          rows: 10,
          start: "2026-05-01T00:00:00+00:00",
          end: "2026-05-10T00:00:00+00:00",
          hash: "snapshot-stage-parameter",
          bars: [10, 11, 12, 11, 13, 14, 13, 15, 16, 17].map((close, index) => ({
            timestamp: `2026-05-${String(index + 1).padStart(2, "0")}T00:00:00+00:00`,
            timestampMs: 1777593600000 + index * 86_400_000,
            open: close - 0.2,
            high: close + 0.4,
            low: close - 0.5,
            close,
            volume: 1_000_000 + index * 10_000
          }))
        }
      }
    );

    const staged = workspaceWithBacktestParameterCandidate(workspace, "scan-entry-1-exit-1");

    expect(staged.strategy).toMatchObject({
      entry: "Close > SMA1",
      exit: "Close < SMA1",
      position: "20% max capital allocation"
    });
    expect(staged.researchRun).toBeNull();
    expect(quantLoopStatuses(staged)).toMatchObject({
      strategy: "active",
      backtest: "ready",
      "agent-review": "ready",
      paper: "locked"
    });
    expect(staged.metrics.map((metric) => metric.value)).toEqual(["N/A", "N/A", "N/A", "0"]);
    expect(staged.backtestTrades).toEqual([]);
    expect(staged.decisionLog[0]).toMatchObject({
      agent: "Backtest Lab",
      tone: "warning",
      message: "Parameter candidate SMA1 / SMA1 staged from run run-stage-parameter. Run Pipeline to generate a fresh audited backtest."
    });
  });

  test("stages an RSI threshold parameter candidate as a fresh strategy draft", () => {
    const workspace = workspaceFromResearchRunAudit(
      {
        ...buildTerminalWorkspace(),
        strategy: {
          name: "RSI confirmed SMA audit",
          entry: "Close > SMA3 AND RSI14 > 55",
          exit: "Close < SMA3",
          position: "20% max capital allocation",
          risk: "Stop -8%, take profit +18%, drawdown guard 12%, paper only"
        }
      },
      {
        runId: "run-stage-rsi-parameter",
        createdAt: "2026-05-28T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "RSI confirmed SMA audit",
        strategyRevision: "rev-stage-rsi-parameter",
        dataRows: 20,
        metrics: {
          total_return_pct: 4,
          max_drawdown_pct: 2,
          win_rate_pct: 50,
          trade_count: 4
        },
        decisions: [],
        executionMode: "paper_only",
        strategyConfig: {
          name: "RSI confirmed SMA audit",
          revision: "rev-stage-rsi-parameter",
          market: "ashare",
          symbols: ["600000"],
          timeframe: "1d",
          version: 1,
          entryConditions: [
            { kind: "close_above_sma", params: { window: 3 } },
            { kind: "rsi_above", params: { window: 14, threshold: 55 } }
          ],
          exitConditions: [{ kind: "close_below_sma", params: { window: 3 } }],
          risk: {
            positionPct: 0.2,
            stopLossPct: 0.08,
            takeProfitPct: 0.18,
            maxDrawdownPct: 0.12
          }
        },
        dataSnapshot: {
          source: "unit-test",
          isComplete: true,
          warnings: [],
          rows: 20,
          start: "2026-05-01T00:00:00+00:00",
          end: "2026-05-20T00:00:00+00:00",
          hash: "snapshot-stage-rsi-parameter",
          bars: [
            10, 11, 12, 11, 13, 14, 13, 15, 16, 17, 16, 18, 19, 18, 20, 21, 20, 22, 23, 24
          ].map((close, index) => ({
            timestamp: `2026-05-${String(index + 1).padStart(2, "0")}T00:00:00+00:00`,
            timestampMs: 1777593600000 + index * 86_400_000,
            open: close - 0.2,
            high: close + 0.4,
            low: close - 0.5,
            close,
            volume: 1_000_000 + index * 10_000
          }))
        }
      }
    );

    const staged = workspaceWithBacktestParameterCandidate(workspace, "scan-entry-1-exit-1-rsi-50");

    expect(staged.strategy).toMatchObject({
      entry: "Close > SMA1 AND RSI14 > 50",
      exit: "Close < SMA1",
      position: "20% max capital allocation"
    });
    expect(staged.researchRun).toBeNull();
    expect(staged.decisionLog[0]).toMatchObject({
      agent: "Backtest Lab",
      tone: "warning",
      message:
        "Parameter candidate SMA1 / SMA1 / RSI>50 staged from run run-stage-rsi-parameter. Run Pipeline to generate a fresh audited backtest."
    });
  });

  test("stages a volume window parameter candidate as a fresh strategy draft", () => {
    const workspace = workspaceFromResearchRunAudit(
      {
        ...buildTerminalWorkspace(),
        strategy: {
          name: "Volume confirmed SMA audit",
          entry: "Close > SMA5 AND Volume > VOL10",
          exit: "Close < SMA5",
          position: "20% max capital allocation",
          risk: "Stop -8%, take profit +18%, drawdown guard 12%, paper only"
        }
      },
      {
        runId: "run-stage-volume-parameter",
        createdAt: "2026-05-28T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Volume confirmed SMA audit",
        strategyRevision: "rev-stage-volume-parameter",
        dataRows: 20,
        metrics: {
          total_return_pct: 4,
          max_drawdown_pct: 2,
          win_rate_pct: 50,
          trade_count: 4
        },
        decisions: [],
        executionMode: "paper_only",
        strategyConfig: {
          name: "Volume confirmed SMA audit",
          revision: "rev-stage-volume-parameter",
          market: "ashare",
          symbols: ["600000"],
          timeframe: "1d",
          version: 1,
          entryConditions: [
            { kind: "close_above_sma", params: { window: 5 } },
            { kind: "volume_above_sma", params: { window: 10 } }
          ],
          exitConditions: [{ kind: "close_below_sma", params: { window: 5 } }],
          risk: {
            positionPct: 0.2,
            stopLossPct: 0.08,
            takeProfitPct: 0.18,
            maxDrawdownPct: 0.12
          }
        },
        dataSnapshot: {
          source: "unit-test",
          isComplete: true,
          warnings: [],
          rows: 20,
          start: "2026-05-01T00:00:00+00:00",
          end: "2026-05-20T00:00:00+00:00",
          hash: "snapshot-stage-volume-parameter",
          bars: [
            10, 11, 12, 11, 13, 14, 13, 15, 16, 17, 16, 18, 19, 18, 20, 21, 20, 22, 23, 24
          ].map((close, index) => ({
            timestamp: `2026-05-${String(index + 1).padStart(2, "0")}T00:00:00+00:00`,
            timestampMs: 1777593600000 + index * 86_400_000,
            open: close - 0.2,
            high: close + 0.4,
            low: close - 0.5,
            close,
            volume: 1_000_000 + (index % 5) * 80_000 + index * 10_000
          }))
        }
      }
    );

    const staged = workspaceWithBacktestParameterCandidate(workspace, "scan-entry-1-exit-1-vol-5");

    expect(staged.strategy).toMatchObject({
      entry: "Close > SMA1 AND Volume > VOL5",
      exit: "Close < SMA1",
      position: "20% max capital allocation"
    });
    expect(staged.researchRun).toBeNull();
    expect(staged.decisionLog[0]).toMatchObject({
      agent: "Backtest Lab",
      tone: "warning",
      message:
        "Parameter candidate SMA1 / SMA1 / VOL5 staged from run run-stage-volume-parameter. Run Pipeline to generate a fresh audited backtest."
    });
  });

  test("builds a portable markdown report from audited backtest evidence", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-report-md",
      createdAt: "2026-05-29T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-report-md",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "AI Summary", message: "Trend improved but benchmark still matters.", tone: "ai" }],
      executionMode: "paper_only",
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-28T08:00:00+00:00",
        end: "2026-05-29T08:00:00+00:00",
        hash: "snapshot-report-md",
        bars: [
          {
            timestamp: "2026-05-28T08:00:00+00:00",
            timestampMs: 1779955200000,
            open: 10,
            high: 10.2,
            low: 9.9,
            close: 10,
            volume: 1200000
          },
          {
            timestamp: "2026-05-29T08:00:00+00:00",
            timestampMs: 1780041600000,
            open: 10.1,
            high: 10.7,
            low: 10,
            close: 10.5,
            volume: 1300000
          }
        ]
      },
      backtestAssumptions: { initialCash: 250000, feeBps: 8, slippageBps: 4 },
      backtestTrades: [
        {
          id: "trade-1",
          timestamp: "2026-05-29T08:00:00+00:00",
          symbol: "600000",
          side: "BUY",
          status: "filled",
          price: "9.20",
          quantity: "2100",
          exposure: "20%",
          pnl: "+8.20%",
          reason: "Close > SMA20",
          tone: "positive"
        }
      ],
      researchNote: {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        body: "关注银行板块相对强度，等待放量确认。",
        updatedAt: "2026-05-29T07:55:00+00:00"
      }
    });

    const markdown = buildBacktestReportMarkdown(workspace);

    expect(markdown).toContain("# AIQuant Audited Backtest Report");
    expect(markdown).toContain("Run ID: `run-report-md`");
    expect(markdown).toContain("Strategy revision: `rev-report-md`");
    expect(markdown).toContain("| Benchmark buy and hold | +5.00% |");
    expect(markdown).toContain("| Alpha | +3.20pp |");
    expect(markdown).toContain("snapshot-report-md");
    expect(markdown).toContain("AI Evidence Boundary");
    expect(markdown).toContain("No investment advice");
    expect(markdown).toContain("Parameter Sensitivity");
    expect(markdown).toContain("| Condition | Return | Max drawdown | Trades | Delta | Status |");
    expect(markdown).toContain("Parameter Scan Summary");
    expect(markdown).toContain("No investment advice");
    expect(markdown).toContain("关注银行板块相对强度");
    expect(markdown).toContain("| BUY | filled | 9.20 | 2100 | +8.20% |");
  });

  test("does not build a markdown report before an audited run exists", () => {
    expect(buildBacktestReportMarkdown(buildTerminalWorkspace())).toBeNull();
  });

  test("blocks the backtest report until a reproducible run exists", () => {
    const report = buildBacktestReport(buildTerminalWorkspace());

    expect(report).toMatchObject({
      status: "blocked",
      headline: "Backtest report needs an audited run",
      summary: "Run Pipeline to create a reproducible backtest before AI review or execution.",
      runId: null,
      aiReviewReady: false,
      executionReady: false,
      benchmark: {
        benchmarkReturn: "Pending snapshot",
        alpha: "N/A",
        sampleBars: 0,
        tone: "warning"
      }
    });
    expect(report.readinessGates.find((gate) => gate.id === "data")).toMatchObject({ status: "blocked" });
  });

  test("marks backtest readiness gates blocked until evidence is reproducible", () => {
    const draftWorkspace = buildTerminalWorkspace();

    expect(buildBacktestEvidenceCards(draftWorkspace)[0]).toMatchObject({
      id: "run",
      value: "Draft workspace",
      tone: "warning"
    });
    expect(buildBacktestReadinessGates(draftWorkspace)).toEqual([
      {
        id: "data",
        label: "Data snapshot",
        status: "blocked",
        detail: "Run Pipeline to bind a reproducible OHLCV snapshot.",
        tone: "risk"
      },
      {
        id: "strategy",
        label: "Strategy schema",
        status: "passed",
        detail: "SMA Trend / Bank Sector is parseable.",
        tone: "positive"
      },
      {
        id: "costs",
        label: "Cost model",
        status: "passed",
        detail: "Cash 100,000 · fee 3 bps · slippage 2 bps.",
        tone: "neutral"
      },
      {
        id: "execution",
        label: "Execution promotion",
        status: "blocked",
        detail: "Paper execution waits for an audited run id.",
        tone: "risk"
      }
    ]);
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

  test("builds a visible workflow trail for generated strategy drafts", () => {
    const workspace = workspaceWithAiAction(buildTerminalWorkspace(), "strategy-draft");
    const state = buildAiActionWorkflowState(workspace, "strategy-draft");

    expect(state.activeStageId).toBe("factor");
    expect(state.completedStageIds).toEqual(["data"]);
    expect(state.log.map((entry) => [entry.stageId, entry.level])).toEqual([
      ["data", "success"],
      ["factor", "warning"]
    ]);
    expect(state.log[1].message).toBe("Strategy draft staged: 600000 1d AI draft; audit required before backtest.");
  });

  test("blocks AI explanation and debate workflow trails until an audited run is bound", () => {
    const workspace = buildTerminalWorkspace();

    const explainState = buildAiActionWorkflowState(workspaceWithAiAction(workspace, "explain"), "explain");
    expect(explainState.activeStageId).toBe("backtest");
    expect(explainState.completedStageIds).toEqual(["data", "factor"]);
    expect(explainState.log.at(-1)?.message).toBe(
      "AI explanation blocked for 600000: run Pipeline to create an audited backtest first."
    );
    expect(explainState.log.at(-1)?.level).toBe("warning");

    const debateState = buildAiActionWorkflowState(workspaceWithAiAction(workspace, "debate"), "debate");
    expect(debateState.activeStageId).toBe("backtest");
    expect(debateState.completedStageIds).toEqual(["data", "factor"]);
    expect(debateState.log.at(-1)?.message).toBe(
      "AI debate blocked for 600000: run Pipeline to create an audited backtest first."
    );
    expect(debateState.log.at(-1)?.level).toBe("warning");
  });

  test("adds a TradingAgents-style debate note to the decision log from audited evidence", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-ai-review",
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
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-26T08:00:00+00:00",
        end: "2026-05-27T08:00:00+00:00",
        hash: "snapshot-explain",
        bars: [
          {
            timestamp: "2026-05-26T08:00:00+00:00",
            timestampMs: 1779782400000,
            open: 10,
            high: 10.2,
            low: 9.9,
            close: 10,
            volume: 1200000
          },
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            timestampMs: 1779868800000,
            open: 10.1,
            high: 10.7,
            low: 10,
            close: 10.5,
            volume: 1300000
          }
        ]
      }
    });
    const workspace = workspaceWithAiAction(auditedWorkspace, "debate");

    expect(workspace.decisionLog[0]).toEqual({
      agent: "AI Debate",
      message:
        "Debate generated for 600000 using audited run run-ai-review: bull case requires momentum confirmation; bear case flags drawdown and data quality.",
      tone: "ai"
    });
  });

  test("adds a grounded audited backtest explanation without promising returns", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-ai-explain",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev123",
      dataRows: 120,
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-25T08:00:00Z",
        end: "2026-05-26T08:00:00Z",
        hash: "snapshot-ai-explain",
        bars: [
          {
            timestamp: "2026-05-25T08:00:00Z",
            timestampMs: 1779696000000,
            open: 10,
            high: 10.2,
            low: 9.9,
            close: 10,
            volume: 1000
          },
          {
            timestamp: "2026-05-26T08:00:00Z",
            timestampMs: 1779782400000,
            open: 10.2,
            high: 10.6,
            low: 10.1,
            close: 10.5,
            volume: 1200
          }
        ]
      },
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "AI Summary", message: "Previous run", tone: "ai" }],
      executionMode: "paper_only"
    });
    const workspace = workspaceWithAiAction(auditedWorkspace, "explain");

    expect(workspace.decisionLog[0].agent).toBe("AI Summary");
    expect(workspace.decisionLog[0].message).toContain("using audited run run-ai-explain");
    expect(workspace.decisionLog[0].message).toContain("return +8.20%");
    expect(workspace.decisionLog[0].message).toContain("benchmark +5.00%");
    expect(workspace.decisionLog[0].message).toContain("alpha +3.20pp");
    expect(workspace.decisionLog[0].message).toContain("no guaranteed outcome");
  });

  test("warns instead of explaining when AI review has no audited evidence", () => {
    const workspace = workspaceWithAiAction(buildTerminalWorkspace(), "explain");

    expect(workspace.decisionLog[0]).toEqual({
      agent: "AI Review Gate",
      message: "AI explanation blocked for 600000: run Pipeline to create an audited backtest first.",
      tone: "warning"
    });
  });

  test("generates a paper-only strategy draft from the current context", () => {
    const workspace = workspaceWithAiAction(buildTerminalWorkspace(), "strategy-draft");

    expect(workspace.strategy.name).toBe("600000 1d AI draft");
    expect(workspace.strategy.entry).toBe("Close above SMA20 with volume confirmation after 1d research context");
    expect(workspace.strategy.risk).toBe("Stop -8%, take profit +18%, drawdown guard 12%, paper only");
    expect(workspace.decisionLog[0]).toMatchObject({
      agent: "Strategy Drafter",
      tone: "warning"
    });
  });

  test("invalidates stale audit results when a strategy draft is generated", () => {
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
      executionMode: "paper_only",
      backtestTrades: [
        {
          id: "old-trade",
          timestamp: "T+0",
          symbol: "600000",
          side: "BUY",
          status: "filled",
          price: "8.66",
          quantity: "2100",
          exposure: "20%",
          pnl: "+8.20%",
          reason: "previous strategy",
          tone: "positive"
        }
      ],
      backtestEquityCurve: [{ timestamp: "2026-05-26T08:00:00+00:00", equity: 108200 }],
      backtestDiagnostics: [
        {
          id: "old-diagnostic",
          label: "Old diagnostic",
          value: "stale",
          detail: "Previous run diagnostic",
          tone: "neutral"
        }
      ]
    });

    const workspace = workspaceWithAiAction(auditedWorkspace, "strategy-draft");

    expect(workspace.researchRun).toBeNull();
    expect(workspace.metrics.map((metric) => metric.value)).toEqual(["N/A", "N/A", "N/A", "0"]);
    expect(workspace.backtestTrades).toEqual([]);
    expect(workspace.backtestEquityCurve).toEqual([]);
    expect(workspace.backtestDiagnostics).toEqual([]);
    expect(workspace.decisionLog[0]).toEqual({
      agent: "Strategy Drafter",
      message: "Strategy draft generated for 600000 from run-history. Run Pipeline to audit the new rules before backtest or paper execution.",
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

  test("formats research run evidence for workflow logs", () => {
    expect(
      researchRunEvidenceLogLabel({
        runId: "run-abc123",
        createdAt: "2026-05-26T08:00:00+00:00",
        timeframe: "5m",
        strategyRevision: "rev-audit",
        dataRows: 240,
        executionMode: "paper_only",
        dataQuality: {
          source: "local-cache",
          isComplete: true,
          warnings: ["research upstream unavailable"],
          rows: 240
        }
      })
    ).toBe("Audited backtest received: 240 5m bars · local-cache complete · 1 warning · strategy rev-audit · paper_only");

    expect(
      researchRunEvidenceLogLabel({
        runId: "run-old",
        createdAt: "2026-05-26T08:00:00+00:00",
        timeframe: "1d",
        strategyRevision: "rev-old",
        dataRows: 120,
        executionMode: "paper_only"
      })
    ).toBe("Audited backtest received: 120 1d bars · data quality not attached · strategy rev-old · paper_only");

    expect(researchRunEvidenceLogLabel(null)).toBe("Audited backtest received");
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
    expect(merged.decisionLog[0].agent).toBe("AI Review Gate");
    expect(merged.decisionLog[0].message).toContain("run Pipeline to create an audited backtest first");
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
      entry: "Close > SMA5",
      exit: "Close < SMA7",
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

  test("loads a saved strategy version as a fresh cross-context draft", () => {
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
      executionMode: "paper_only",
      backtestTrades: [
        {
          id: "trade-1",
          timestamp: "T+0",
          symbol: "600000",
          side: "BUY",
          status: "filled",
          price: "9.20",
          quantity: "2100",
          exposure: "20%",
          pnl: "+8.2%",
          reason: "Close > SMA20",
          tone: "positive"
        }
      ]
    });

    const workspace = workspaceWithStrategyLibraryItem(auditedWorkspace, {
      name: "US momentum draft",
      revision: "rev-aapl-sma8",
      market: "us",
      symbol: "AAPL",
      timeframe: "5m",
      status: "audited",
      auditRunId: "run-aapl-audited",
      strategySnapshot: {
        name: "US momentum draft",
        entry: "Close > SMA8",
        exit: "Close < SMA21",
        position: "35% max capital allocation",
        risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
      }
    });

    expect(workspace.selectedInstrument).toMatchObject({
      market: "us",
      symbol: "AAPL",
      name: "Apple"
    });
    expect(workspace.selectedTimeframe).toBe("5m");
    expect(workspace.watchlist[0]).toMatchObject({ market: "us", symbol: "AAPL" });
    expect(workspace.strategy).toEqual({
      name: "US momentum draft",
      entry: "Close > SMA8",
      exit: "Close < SMA21",
      position: "35% max capital allocation",
      risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
    });
    expect(workspace.researchRun).toBeNull();
    expect(workspace.backtestTrades).toEqual([]);
    expect(workspace.metrics.map((metric) => metric.value)).toEqual(["N/A", "N/A", "N/A", "0"]);
    expect(quantLoopStatuses(workspace)).toEqual({
      research: "ready",
      strategy: "active",
      backtest: "ready",
      "agent-review": "ready",
      paper: "locked"
    });
    expect(workspace.decisionLog[0]).toEqual({
      agent: "Strategy Library",
      message:
        "Strategy revision rev-aapl-sma8 loaded for AAPL 5m. Archived audit run run-aapl-audited remains read-only; Run Pipeline to generate a fresh audited backtest.",
      tone: "warning"
    });
  });

  test("summarizes saved strategy version differences before loading", () => {
    const workspace = workspaceWithStrategyRuleDraftField(buildTerminalWorkspace(), "entryWindow", 8);
    const diffRows = buildStrategyVersionDiffRows(workspace, {
      name: "AAPL breakout draft",
      revision: "rev-aapl-diff",
      market: "us",
      symbol: "AAPL",
      timeframe: "5m",
      status: "draft",
      auditRunId: null,
      strategySnapshot: {
        name: "AAPL breakout draft",
        entry: "Close > SMA8",
        exit: workspace.strategy.exit,
        position: "35% max capital allocation",
        risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
      }
    });

    expect(diffRows).toEqual([
      {
        id: "context",
        label: "Context",
        current: "ASHARE · 600000 · 1d",
        saved: "US · AAPL · 5m",
        changed: true,
        tone: "warning"
      },
      {
        id: "name",
        label: "Name",
        current: workspace.strategy.name,
        saved: "AAPL breakout draft",
        changed: true,
        tone: "warning"
      },
      {
        id: "entry",
        label: "Entry",
        current: "Close > SMA8",
        saved: "Close > SMA8",
        changed: false,
        tone: "neutral"
      },
      {
        id: "exit",
        label: "Exit",
        current: workspace.strategy.exit,
        saved: workspace.strategy.exit,
        changed: false,
        tone: "neutral"
      },
      {
        id: "position",
        label: "Position",
        current: workspace.strategy.position,
        saved: "35% max capital allocation",
        changed: true,
        tone: "warning"
      },
      {
        id: "risk",
        label: "Risk",
        current: workspace.strategy.risk,
        saved: "Stop -6%, take profit +12%, drawdown guard 9%, paper only",
        changed: true,
        tone: "warning"
      }
    ]);
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
