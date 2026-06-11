import { describe, expect, test } from "vitest";
import {
  agentRoleLabels,
  buildAgentCommitteeRounds,
  buildAiActionWorkflowState,
  buildAiEvidenceCards,
  buildAiReviewDossier,
  buildAiReviewReportMarkdown,
  buildAiReviewRecordDriftRows,
  buildAiReviewRunRecord,
  buildAiReviewAuditTimelineItems,
  buildAiReviewExportEvidenceIndexRows,
  buildAuditEvidenceReportMarkdown,
  buildAuditEvidenceSummary,
  buildAuditEvidenceReportLedgerRows,
  buildAuditEvidenceReportLedgerSummary,
  buildAuditSigningKeyRotationLedgerRows,
  buildResearchRunExportPreviewRows,
  buildResearchRunExportBrowserRows,
  buildResearchRunExportIndexRows,
  buildResearchRunImportDiffRows,
  buildResearchRunImportAuditEvent,
  buildResearchRunImportAuditAggregation,
  buildResearchRunImportUndoAuditEvent,
  buildResearchRunImportUndoConfirmation,
  buildResearchRunImportUndoFailureAuditEvent,
  buildAuditReplayWorkflowState,
  buildBacktestAssumptionRows,
  buildBacktestEvidenceCards,
  buildBacktestParameterScanRows,
  buildBacktestParameterScanSummary,
  buildBacktestReport,
  buildBacktestReportMarkdown,
  buildBacktestCrossSymbolComparisonRows,
  buildBacktestCrossSymbolComparisonSummary,
  buildBacktestRunComparisonMatrixRows,
  buildBacktestRunComparisonMatrixSummary,
  buildBacktestReadinessGates,
  buildBacktestTradeRows,
  buildBrokerAdapterRows,
  buildExecutionAdapterCertificationApplyConfirmationRows,
  buildExecutionAdapterCertificationApplyRows,
  buildExecutionAdapterControlledRestartEvidenceRows,
  buildExecutionAdapterEnvironmentBindingRows,
  buildExecutionAdapterRestartAcceptanceRows,
  buildExecutionAdapterRuntimeReloadExecutionRows,
  buildExecutionAdapterRuntimeReloadPlanRows,
  buildExecutionAdapterSecretMaterializationRows,
  buildExecutionAdapterSecretReferenceRows,
  createDefaultExecutionAdapterCertificationApplyConfirmations,
  buildExecutionAdapterCertificationRows,
  buildExecutionAdapterLedgerRows,
  buildGoldenPathRunbookPreview,
  buildGoldenPathWorkspaceContext,
  buildInstrumentFromSymbol,
  buildModuleNewsEvents,
  buildPaperExecutionSummaryTiles,
  buildPaperPositionRows,
  buildPaperTradingRows,
  buildPromotionReadiness,
  buildPortfolioRiskRows,
  buildPortfolioBacktestDraft,
  buildPortfolioBacktestDiagnosticRows,
  buildPortfolioBacktestReportMarkdown,
  buildPortfolioPaperOrderApprovalRows,
  buildPortfolioPaperOrderLifecycleRows,
  buildPortfolioPaperOrderReplayPositionRows,
  buildPortfolioPaperOrderReplaySummaryTiles,
  buildPortfolioPaperOrderStateHistoryRows,
  buildPortfolioPeerAuditPlan,
  buildProductDevelopmentStages,
  buildProductWorkAreas,
  buildQuantLoopNavigationTarget,
  mergeStrategyReadinessGatesWithLocalAudit,
  resolveQuantLoopSelection,
  resolveSavedResearchWorkspaceSelection,
  resolveSavedResearchWorkspaceId,
  resolveResearchContextUrlState,
  researchWorkspaceStateMatchesDraft,
  resolveProductWorkAreaSelection,
  buildResearchRunComparisonRows,
  buildResearchContextEvidenceRows,
  buildResearchContextReadinessRows,
  buildWatchlistCacheRefreshItemRows,
  buildWatchlistCacheRefreshCoverageRow,
  buildWatchlistCacheRefreshHistoryRows,
  buildResearchPipelinePreflight,
  buildResearchRunContextBinding,
  buildResearchWorkspaceStateDraft,
  workspaceWithSavedResearchWorkspaceState,
  workspaceWithAppliedResearchWorkspaceState,
  workspaceWithResearchContextUrlState,
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
  filterAiReviewExportEvidenceIndexRows,
  filterResearchRunExportPreviewRows,
  filterResearchRunExportBrowserRows,
  filterResearchRunExportIndexRows,
  filterResearchRunImportDiffRows,
  filterResearchRunImportAuditEvents,
  filterAuditEvidenceReportLedgerRows,
  filterAuditSigningKeyRotationLedgerRows,
  filterBacktestCrossSymbolComparisonRows,
  filterBacktestRunComparisonMatrixRows,
  filterAiReviewRecordDriftRows,
  formatInstrumentPrice,
  researchRunEvidenceLogLabel,
  researchRunHistoryLabel,
  researchRunLabel,
  watchlistIncludesInstrument,
  resolveWatchlistCacheRefreshRunIdFromUrl,
  resolveWatchlistCacheRefreshRunSelection,
  mergeResearchRunImportAuditEvents,
  quantLoopLabels,
  resolveBacktestAssumptions,
  type AiReviewRecordDriftRow,
  type AiReviewAuditTimelineItem,
  type AiReviewExportEvidenceIndexRow,
  type ResearchRunExportPreviewRow,
  type ResearchRunExportBrowserRow,
  type ResearchRunExportIndexRow,
  type ResearchRunExportBrowserPackage,
  type ResearchContextMarketCalendar,
  type ResearchRunImportAuditEvent,
  type ResearchRunImportDiffRow,
  type ResearchRunAudit,
  type TerminalWorkspace,
  type WatchlistCacheRefreshItemSnapshot,
  type WatchlistCacheRefreshRunSnapshot,
  type WorkflowRunState,
  visiblePanels,
  workspaceWithAiAction,
  workspaceWithBacktestAssumption,
  workspaceWithBacktestParameterCandidate,
  workspaceWithPreservedInteractiveState,
  workspaceWithPreservedSelection,
  workspaceWithSavedWatchlist,
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

function watchlistRefreshRunFixture(
  overrides: Partial<WatchlistCacheRefreshRunSnapshot> & {
    item?: Partial<WatchlistCacheRefreshItemSnapshot>;
  } = {}
): WatchlistCacheRefreshRunSnapshot {
  const item: WatchlistCacheRefreshItemSnapshot = {
    market: overrides.item?.market ?? "ashare",
    symbol: overrides.item?.symbol ?? "600000",
    name: overrides.item?.name ?? "浦发银行",
    timeframe: overrides.item?.timeframe ?? "1d",
    requestedLimit: overrides.item?.requestedLimit ?? 500,
    upsertedRows: overrides.item?.upsertedRows ?? 240,
    status: overrides.item?.status ?? "refreshed",
    quality: overrides.item?.quality ?? {
      source: "tencent",
      isComplete: true,
      warnings: [],
      rows: 240
    },
    error: overrides.item?.error ?? null
  };
  return {
    runId: overrides.runId ?? "cache-refresh-ready",
    createdAt: overrides.createdAt ?? "2026-06-10T06:00:00+00:00",
    timeframe: overrides.timeframe ?? item.timeframe,
    requestedLimit: overrides.requestedLimit ?? item.requestedLimit,
    summary: overrides.summary ?? {
      totalSymbols: 1,
      refreshed: item.status === "refreshed" ? 1 : 0,
      skipped: item.status === "skipped" ? 1 : 0,
      failed: item.status === "failed" ? 1 : 0,
      upsertedRows: item.upsertedRows
    },
    items: overrides.items ?? [item]
  };
}

function auditedRunFixture(
  overrides: Partial<ResearchRunAudit> & {
    drawdown?: number;
    returnPct?: number;
    source?: string;
    tradeCount?: number;
    warnings?: string[];
  }
): ResearchRunAudit {
  const returnPct = overrides.returnPct ?? 5;
  const drawdown = overrides.drawdown ?? 4;
  const tradeCount = overrides.tradeCount ?? 8;
  const warnings = overrides.warnings ?? [];
  const source = overrides.source ?? "tencent";
  return {
    runId: overrides.runId ?? "run-fixture",
    createdAt: overrides.createdAt ?? "2026-05-26T08:00:00+00:00",
    market: overrides.market ?? "ashare",
    symbol: overrides.symbol ?? "600000",
    timeframe: overrides.timeframe ?? "1d",
    strategyName: overrides.strategyName ?? "SMA Trend / Bank Sector",
    strategyRevision: overrides.strategyRevision ?? "rev-fixture",
    dataRows: overrides.dataRows ?? 240,
    metrics: {
      total_return_pct: returnPct,
      max_drawdown_pct: drawdown,
      win_rate_pct: overrides.metrics?.win_rate_pct ?? 52,
      trade_count: tradeCount,
      ...overrides.metrics
    },
    decisions: overrides.decisions ?? [],
    executionMode: overrides.executionMode ?? "paper_only",
    dataQuality: overrides.dataQuality ?? {
      source,
      isComplete: true,
      warnings,
      rows: overrides.dataRows ?? 240
    },
    backtestAssumptions: overrides.backtestAssumptions ?? {
      initialCash: 100_000,
      feeBps: 3,
      slippageBps: 2
    }
  };
}

describe("terminal workbench model", () => {
  test("defines stage-gated product delivery in platform order", () => {
    const stages = buildProductDevelopmentStages();

    expect(stages.map((stage) => stage.id)).toEqual([
      "foundation",
      "market-research",
      "strategy-backtest",
      "ai-review",
      "portfolio-paper",
      "live-readiness"
    ]);
    expect(stages.find((stage) => stage.id === "market-research")).toMatchObject({
      label: "Stage 1 · Market and Research",
      status: "current",
      focus: "Finish the reliable search, quote, K-line, cache, data-quality, and notes loop before expanding later work."
    });
    expect(stages.filter((stage) => stage.status === "current").map((stage) => stage.id)).toEqual([
      "market-research"
    ]);
  });

  test("builds a Stage 1 research workspace state draft from the selected context", () => {
    const workspace = workspaceWithSelectedTimeframe(
      workspaceWithSelectedInstrument(buildTerminalWorkspace(), {
        market: "us",
        symbol: "MSFT",
        name: "Microsoft",
        changePct: 1.2,
        price: 420.5
      }),
      "5m"
    );

    expect(buildResearchWorkspaceStateDraft(workspace, "research")).toEqual({
      market: "us",
      symbol: "MSFT",
      name: "Microsoft",
      timeframe: "5m",
      workspaceId: "research"
    });
    expect(buildResearchWorkspaceStateDraft(workspace, "execution").workspaceId).toBe("research");
  });

  test("detects whether the current Stage 1 research workspace state is saved", () => {
    const workspace = workspaceWithSelectedTimeframe(buildTerminalWorkspace(), "1d");
    const draft = buildResearchWorkspaceStateDraft(workspace, "research");

    expect(
      researchWorkspaceStateMatchesDraft(
        {
          ...draft,
          name: "Saved display name can drift",
          updatedAt: "2026-06-10T00:00:00+00:00"
        },
        draft
      )
    ).toBe(true);
    expect(
      researchWorkspaceStateMatchesDraft(
        {
          ...draft,
          timeframe: "5m",
          updatedAt: "2026-06-10T00:00:00+00:00"
        },
        draft
      )
    ).toBe(false);
    expect(researchWorkspaceStateMatchesDraft(null, draft)).toBe(false);
  });

  test("merges a saved Stage 1 research workspace state snapshot without changing context", () => {
    const workspace = workspaceWithSelectedTimeframe(buildTerminalWorkspace(), "5m");
    const merged = workspaceWithSavedResearchWorkspaceState(workspace, {
      market: "ashare",
      symbol: "600000",
      name: "浦发银行",
      timeframe: "5m",
      workspaceId: "research",
      updatedAt: "2026-06-10T00:00:00+00:00"
    });

    expect(merged.selectedInstrument).toEqual(workspace.selectedInstrument);
    expect(merged.selectedTimeframe).toBe("5m");
    expect(merged.researchWorkspaceState?.updatedAt).toBe("2026-06-10T00:00:00+00:00");
  });

  test("applies a saved Stage 1 research workspace state to the selected context", () => {
    const workspace: TerminalWorkspace = {
      ...buildTerminalWorkspace(),
      researchWorkspaceState: {
        market: "crypto",
        symbol: "BTC/USDT",
        name: "Bitcoin",
        timeframe: "5m",
        workspaceId: "research",
        updatedAt: "2026-06-10T00:00:00+00:00"
      }
    };
    const restored = workspaceWithAppliedResearchWorkspaceState(workspace);

    expect(restored.selectedInstrument).toMatchObject({
      market: "crypto",
      symbol: "BTC/USDT",
      name: "Bitcoin"
    });
    expect(restored.selectedTimeframe).toBe("5m");
    expect(restored.researchWorkspaceState?.symbol).toBe("BTC/USDT");
    expect(restored.watchlist.some((instrument) => instrument.market === "crypto" && instrument.symbol === "BTC/USDT")).toBe(true);
  });

  test("parses valid Stage 1 research context URL parameters", () => {
    expect(resolveResearchContextUrlState("?market=crypto&symbol=btcusdt&timeframe=5m")).toEqual({
      market: "crypto",
      symbol: "BTC/USDT",
      timeframe: "5m"
    });
    expect(resolveResearchContextUrlState(new URLSearchParams("market=ashare&symbol=sh600000&timeframe=1d"))).toEqual({
      market: "ashare",
      symbol: "600000",
      timeframe: "1d"
    });
    expect(resolveResearchContextUrlState("?market=fx&symbol=EURUSD&timeframe=5m")).toBeNull();
    expect(resolveResearchContextUrlState("?market=us&symbol=MSFT&timeframe=2h")).toBeNull();
    expect(resolveResearchContextUrlState("?market=us&symbol=&timeframe=5m")).toBeNull();
  });

  test("applies URL research context ahead of saved workspace state", () => {
    const workspace: TerminalWorkspace = {
      ...buildTerminalWorkspace(),
      researchWorkspaceState: {
        market: "crypto",
        symbol: "BTC/USDT",
        name: "Bitcoin",
        timeframe: "5m",
        workspaceId: "research",
        updatedAt: "2026-06-10T00:00:00+00:00"
      }
    };

    const restored = workspaceWithResearchContextUrlState(workspace, {
      market: "us",
      symbol: "AAPL",
      timeframe: "15m"
    });

    expect(restored.selectedInstrument).toMatchObject({
      market: "us",
      symbol: "AAPL",
      name: "Apple",
      price: 191.2
    });
    expect(restored.selectedTimeframe).toBe("15m");
    expect(restored.researchWorkspaceState?.symbol).toBe("BTC/USDT");
  });

  test("resolves the saved Stage 1 work area from workspace state", () => {
    const workspace: TerminalWorkspace = {
      ...buildTerminalWorkspace(),
      researchWorkspaceState: {
        market: "ashare",
        symbol: "600000",
        name: "浦发银行",
        timeframe: "1d",
        workspaceId: "market",
        updatedAt: "2026-06-09T00:00:00+00:00"
      }
    };

    expect(resolveSavedResearchWorkspaceId(workspace, "research")).toBe("market");
    expect(resolveSavedResearchWorkspaceId(buildTerminalWorkspace(), "research")).toBe("research");
  });

  test("resolves a full product selection from saved Stage 1 workspace state", () => {
    const workspace: TerminalWorkspace = {
      ...buildTerminalWorkspace(),
      researchWorkspaceState: {
        market: "ashare",
        symbol: "600000",
        name: "浦发银行",
        timeframe: "1d",
        workspaceId: "market",
        updatedAt: "2026-06-09T00:00:00+00:00"
      }
    };

    expect(resolveSavedResearchWorkspaceSelection(workspace, "research")).toMatchObject({
      areaId: "market",
      quantLoopStepId: "research",
      workflowStageId: "data"
    });
  });

  test("builds ready Stage 1 research context readiness rows", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: workspaceWithSavedResearchWorkspaceState(buildTerminalWorkspace(), {
        market: "ashare",
        symbol: "600000",
        name: "浦发银行",
        timeframe: "1d",
        workspaceId: "research",
        updatedAt: "2026-05-26T08:40:00+08:00"
      }),
      barCount: 240,
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      cacheContext: {
        rowCount: 240,
        freshness: "fresh",
        ageHours: 1,
        latestTimestamp: "2026-05-26T08:00:00+08:00"
      },
      note: {
        source: "core",
        body: "观察假设：银行板块修复中，等待成交量确认。",
        updatedAt: "2026-05-26T08:30:00+08:00"
      }
    });

    expect(rows.map((row) => row.id)).toEqual(["instrument", "klines", "cache", "note", "workspace"]);
    expect(rows.map((row) => row.status)).toEqual(["ready", "ready", "ready", "ready", "ready"]);
    expect(rows.map((row) => row.action ?? null)).toEqual([null, null, null, null, null]);
    expect(rows.find((row) => row.id === "instrument")).toMatchObject({
      value: "600000 · 1d",
      tone: "positive"
    });
    expect(rows.find((row) => row.id === "cache")).toMatchObject({
      value: "fresh · 240 rows",
      detail: "Ready for audited research · Latest cache 2026-05-26T08:00:00+08:00 · 1h old"
    });
    expect(rows.find((row) => row.id === "note")).toMatchObject({
      value: "saved",
      detail: "Saved 2026-05-26T08:30:00+08:00 · 观察假设：银行板块修复中，等待成交量确认。"
    });
    expect(rows.find((row) => row.id === "workspace")).toMatchObject({
      value: "saved",
      detail: "Saved 2026-05-26T08:40:00+08:00 · research entry"
    });
  });

  test("marks open market calendar as ready in Stage 1 calendar readiness", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: workspaceWithSavedResearchWorkspaceState(buildTerminalWorkspace(), {
        market: "ashare",
        symbol: "600000",
        name: "浦发银行",
        timeframe: "1d",
        workspaceId: "research",
        updatedAt: "2026-05-26T08:40:00+08:00"
      }),
      barCount: 240,
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      marketCalendar: {
        market: "ashare",
        timezone: "Asia/Shanghai",
        status: "open",
        isOpen: true,
        session: "morning",
        asOf: "2026-06-11T10:00:00+08:00",
        tradingDay: "2026-06-11",
        nextOpen: null,
        nextClose: "2026-06-11T11:30:00+08:00",
        detail: "A-share market is open in the morning session.",
        warnings: [],
        source: "static-session-template"
      },
      cacheContext: {
        rowCount: 240,
        freshness: "fresh",
        ageHours: 1,
        latestTimestamp: "2026-05-26T08:00:00+08:00"
      },
      note: {
        source: "core",
        body: "观察假设：银行板块修复中，等待成交量确认。",
        savedBody: "观察假设：银行板块修复中，等待成交量确认。",
        updatedAt: "2026-05-26T08:30:00+08:00"
      }
    });

    expect(rows.map((row) => row.id)).toEqual(["instrument", "calendar", "klines", "cache", "note", "workspace"]);
    expect(rows.find((row) => row.id === "calendar")).toMatchObject({
      label: "Market calendar",
      value: "open · morning",
      detail: "Asia/Shanghai · next close 2026-06-11T11:30:00+08:00 · static-session-template",
      status: "ready",
      tone: "positive"
    });
    expect(rows.find((row) => row.id === "calendar")?.action).toBeUndefined();
  });

  test("marks static-template market calendar readiness warnings as review without blocking research", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: workspaceWithSavedResearchWorkspaceState(buildTerminalWorkspace(), {
        market: "ashare",
        symbol: "600000",
        name: "浦发银行",
        timeframe: "1d",
        workspaceId: "research",
        updatedAt: "2026-05-26T08:40:00+08:00"
      }),
      barCount: 240,
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      marketCalendar: {
        market: "ashare",
        timezone: "Asia/Shanghai",
        status: "break",
        isOpen: false,
        session: "lunch_break",
        asOf: "2026-06-11T12:00:00+08:00",
        tradingDay: "2026-06-11",
        nextOpen: "2026-06-11T13:00:00+08:00",
        nextClose: null,
        detail: "A-share market is between sessions until 2026-06-11T13:00:00+08:00.",
        warnings: ["Static session template only; exchange holiday calendar is not configured."],
        source: "static-session-template"
      },
      cacheContext: {
        rowCount: 240,
        freshness: "fresh",
        ageHours: 1,
        latestTimestamp: "2026-05-26T08:00:00+08:00"
      },
      note: {
        source: "core",
        body: "观察假设：银行板块修复中，等待成交量确认。",
        savedBody: "观察假设：银行板块修复中，等待成交量确认。",
        updatedAt: "2026-05-26T08:30:00+08:00"
      }
    });

    expect(rows.find((row) => row.id === "calendar")).toMatchObject({
      value: "break · lunch_break",
      detail: "Asia/Shanghai · next open 2026-06-11T13:00:00+08:00 · Static session template only; exchange holiday calendar is not configured.",
      status: "review",
      tone: "warning"
    });
    expect(rows.find((row) => row.id === "calendar")?.action).toBeUndefined();
    expect(buildResearchPipelinePreflight(rows).status).toBe("review");
  });

  test("marks matching refresh evidence ready in Stage 1 research context readiness", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: workspaceWithSavedResearchWorkspaceState(buildTerminalWorkspace(), {
        market: "ashare",
        symbol: "600000",
        name: "浦发银行",
        timeframe: "1d",
        workspaceId: "research",
        updatedAt: "2026-05-26T08:40:00+08:00"
      }),
      barCount: 240,
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      cacheContext: {
        rowCount: 240,
        freshness: "fresh",
        ageHours: 1,
        latestTimestamp: "2026-05-26T08:00:00+08:00"
      },
      watchlistRefreshRuns: [watchlistRefreshRunFixture()],
      note: {
        source: "core",
        body: "观察假设：银行板块修复中，等待成交量确认。",
        savedBody: "观察假设：银行板块修复中，等待成交量确认。",
        updatedAt: "2026-05-26T08:30:00+08:00"
      }
    });

    expect(rows.map((row) => row.id)).toEqual(["instrument", "klines", "cache", "refresh", "note", "workspace"]);
    expect(rows.find((row) => row.id === "refresh")).toMatchObject({
      label: "Refresh evidence",
      value: "refreshed · cache-refresh-ready",
      detail: "2026-06-10T06:00:00+00:00 · tencent · 240 rows cached",
      status: "ready",
      tone: "positive",
      evidenceRunId: "cache-refresh-ready",
      action: undefined
    });
  });

  test("marks missing refresh evidence as review without blocking the research pipeline", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: workspaceWithSavedResearchWorkspaceState(buildTerminalWorkspace(), {
        market: "ashare",
        symbol: "600000",
        name: "浦发银行",
        timeframe: "1d",
        workspaceId: "research",
        updatedAt: "2026-05-26T08:40:00+08:00"
      }),
      barCount: 240,
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      cacheContext: {
        rowCount: 240,
        freshness: "fresh",
        ageHours: 1,
        latestTimestamp: "2026-05-26T08:00:00+08:00"
      },
      watchlistRefreshRuns: [
        watchlistRefreshRunFixture({
          runId: "cache-refresh-aapl",
          item: {
            market: "us",
            symbol: "AAPL",
            name: "Apple",
            timeframe: "1d"
          }
        })
      ],
      note: {
        source: "core",
        body: "观察假设：银行板块修复中，等待成交量确认。",
        savedBody: "观察假设：银行板块修复中，等待成交量确认。",
        updatedAt: "2026-05-26T08:30:00+08:00"
      }
    });

    expect(rows.find((row) => row.id === "refresh")).toMatchObject({
      value: "no matching refresh",
      detail: "Run watchlist cache refresh for ASHARE · 600000 · 1d before relying on this context.",
      status: "review",
      tone: "warning",
      evidenceRunId: undefined,
      action: "refresh-watchlist-cache"
    });
    expect(buildResearchPipelinePreflight(rows)).toMatchObject({
      status: "review",
      canRun: true,
      requiresConfirmation: true,
      summary: "Review 1 research context gate before running the pipeline.",
      primaryAction: "refresh-watchlist-cache",
      issues: [
        {
          id: "refresh",
          label: "Refresh evidence",
          status: "review",
          action: "refresh-watchlist-cache"
        }
      ]
    });
  });

  test("marks unsaved workspace persistence as review with save action", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: buildTerminalWorkspace(),
      barCount: 240,
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      cacheContext: {
        rowCount: 240,
        freshness: "fresh",
        ageHours: 1,
        latestTimestamp: "2026-05-26T08:00:00+08:00"
      },
      note: {
        source: "core",
        body: "观察假设：银行板块修复中，等待成交量确认。",
        savedBody: "观察假设：银行板块修复中，等待成交量确认。",
        updatedAt: "2026-05-26T08:30:00+08:00"
      }
    });

    expect(rows.find((row) => row.id === "workspace")).toMatchObject({
      value: "not saved",
      detail: "Save ASHARE · 600000 · 1d · research before relying on this workspace context.",
      status: "review",
      tone: "warning",
      action: "save-workspace"
    });
  });

  test("marks unsaved watchlist persistence as review with save action", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: workspaceWithSavedResearchWorkspaceState(buildTerminalWorkspace(), {
        market: "ashare",
        symbol: "600000",
        name: "浦发银行",
        timeframe: "1d",
        workspaceId: "research",
        updatedAt: "2026-05-26T08:40:00+08:00"
      }),
      barCount: 240,
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      watchlist: {
        hasUnsavedChanges: true
      },
      cacheContext: {
        rowCount: 240,
        freshness: "fresh",
        ageHours: 1,
        latestTimestamp: "2026-05-26T08:00:00+08:00"
      },
      note: {
        source: "core",
        body: "观察假设：银行板块修复中，等待成交量确认。",
        savedBody: "观察假设：银行板块修复中，等待成交量确认。",
        updatedAt: "2026-05-26T08:30:00+08:00"
      }
    });

    expect(rows.map((row) => row.id)).toEqual(["instrument", "watchlist", "klines", "cache", "note", "workspace"]);
    expect(rows.find((row) => row.id === "watchlist")).toMatchObject({
      value: "unsaved changes",
      detail: "Save 4 watched symbols before relying on this research context.",
      status: "review",
      tone: "warning",
      action: "save-watchlist"
    });
    expect(buildResearchPipelinePreflight(rows)).toMatchObject({
      status: "review",
      canRun: true,
      requiresConfirmation: true,
      primaryAction: "save-watchlist",
      issues: [
        {
          id: "watchlist",
          label: "Watchlist state",
          status: "review",
          action: "save-watchlist"
        }
      ]
    });
  });

  test("flags blocked or review Stage 1 research context gaps", () => {
    const workspace = workspaceWithSelectedInstrument(buildTerminalWorkspace(), {
      symbol: "MSFT",
      name: "Microsoft",
      market: "us",
      changePct: 0
    });

    const rows = buildResearchContextReadinessRows({
      workspace,
      barCount: 0,
      dataQuality: { source: "demo-fallback", isComplete: false, warnings: ["upstream timeout"], rows: 0 },
      note: {
        source: "fallback",
        body: "",
        updatedAt: null,
        error: "core unavailable"
      }
    });

    expect(rows.map((row) => [row.id, row.status])).toEqual([
      ["instrument", "ready"],
      ["klines", "blocked"],
      ["cache", "blocked"],
      ["note", "review"],
      ["workspace", "review"]
    ]);
    expect(rows.find((row) => row.id === "klines")).toMatchObject({
      value: "0 bars",
      detail: "demo-fallback review · upstream timeout",
      action: "refresh-cache"
    });
    expect(rows.find((row) => row.id === "cache")).toMatchObject({
      value: "missing",
      detail:
        "No current-timeframe cache coverage yet. Use search suggestion refresh or refresh current cache before audited research.",
      action: "refresh-cache"
    });
    expect(rows.find((row) => row.id === "note")).toMatchObject({
      value: "not saved",
      detail: "core unavailable",
      action: "save-note"
    });
  });

  test("builds research context evidence rows for missing, matched, and mismatched audited runs", () => {
    expect(buildResearchContextEvidenceRows(buildTerminalWorkspace())).toEqual([
      {
        id: "audit-run",
        label: "Audited run",
        value: "no audited run",
        detail: "Run Pipeline to bind a matching audited research run.",
        status: "review",
        tone: "warning"
      }
    ]);

    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-context-match",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-context",
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

    expect(buildResearchContextEvidenceRows(auditedWorkspace)).toEqual([
      {
        id: "audit-run",
        label: "Audited run",
        value: "run-context-match",
        detail: "Audited run run-context-match matches the selected research context.",
        status: "ready",
        tone: "positive"
      }
    ]);

    const mismatchedWorkspace = {
      ...auditedWorkspace,
      selectedInstrument: {
        symbol: "AAPL",
        name: "Apple",
        market: "us" as const,
        price: 191.2,
        changePct: 0
      }
    };

    expect(buildResearchContextEvidenceRows(mismatchedWorkspace)).toEqual([
      {
        id: "audit-run",
        label: "Audited run",
        value: "run-context-match",
        detail: "Audited run run-context-match belongs to ASHARE · 600000 · 1d, not US · AAPL · 1d.",
        status: "blocked",
        tone: "risk"
      }
    ]);
  });

  test("marks warning K-line data as review instead of ready", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: buildTerminalWorkspace(),
      barCount: 240,
      dataQuality: { source: "tencent", isComplete: true, warnings: ["5 missing sessions"], rows: 240 },
      cacheContext: {
        rowCount: 240,
        freshness: "fresh",
        ageHours: 1,
        latestTimestamp: "2026-05-26T08:00:00+08:00"
      },
      note: {
        source: "core",
        body: "观察假设：银行板块修复中，等待成交量确认。",
        savedBody: "观察假设：银行板块修复中，等待成交量确认。",
        updatedAt: "2026-05-26T08:30:00+08:00"
      }
    });

    expect(rows.find((row) => row.id === "klines")).toMatchObject({
      value: "240 bars",
      detail: "tencent complete · 5 missing sessions",
      status: "review",
      tone: "warning",
      action: "refresh-cache"
    });
  });

  test("marks demo fallback K-line data as review even when rows exist", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: buildTerminalWorkspace(),
      barCount: 160,
      dataQuality: { source: "demo-fallback", isComplete: true, warnings: [], rows: 160 },
      cacheContext: {
        rowCount: 0,
        freshness: "empty",
        ageHours: null,
        latestTimestamp: null
      },
      note: {
        source: "fallback",
        body: "",
        updatedAt: null
      }
    });

    expect(rows.find((row) => row.id === "klines")).toMatchObject({
      value: "160 bars",
      detail: "demo-fallback complete · source requires review",
      status: "review",
      tone: "warning",
      action: "refresh-cache"
    });
  });

  test("marks stale Stage 1 cache as refreshable before audited research", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: buildTerminalWorkspace(),
      barCount: 240,
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      cacheContext: {
        rowCount: 120,
        freshness: "stale",
        ageHours: 18,
        latestTimestamp: "2026-05-25T14:00:00+08:00"
      },
      note: {
        source: "core",
        body: "观察假设：银行板块修复中，等待成交量确认。",
        savedBody: "观察假设：银行板块修复中，等待成交量确认。",
        updatedAt: "2026-05-26T08:30:00+08:00"
      }
    });

    expect(rows.find((row) => row.id === "cache")).toMatchObject({
      value: "stale · 120 rows",
      detail:
        "Cache is stale. Refresh from search suggestions or current cache before audited research · latest 2026-05-25T14:00:00+08:00 · 18h old",
      status: "review",
      tone: "warning",
      action: "refresh-cache"
    });
  });

  test("blocks the research pipeline when readiness rows contain blockers", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: buildTerminalWorkspace(),
      barCount: 0,
      dataQuality: { source: "demo-fallback", isComplete: false, warnings: ["upstream timeout"], rows: 0 },
      cacheContext: {
        rowCount: 0,
        freshness: "empty",
        ageHours: null,
        latestTimestamp: null
      },
      note: {
        source: "fallback",
        body: "观察假设：等待真实 K 线恢复。",
        savedBody: "观察假设：等待真实 K 线恢复。",
        updatedAt: "2026-05-26T08:30:00+08:00"
      }
    });

    expect(buildResearchPipelinePreflight(rows)).toMatchObject({
      status: "blocked",
      canRun: false,
      requiresConfirmation: false,
      summary: "Fix 2 blocked research context gates before running the pipeline.",
      primaryAction: "refresh-cache",
      issues: [
        {
          id: "klines",
          label: "K-line data",
          status: "blocked",
          action: "refresh-cache"
        },
        {
          id: "cache",
          label: "Local cache",
          status: "blocked",
          action: "refresh-cache"
        },
        {
          id: "workspace",
          label: "Workspace state",
          status: "review",
          action: "save-workspace"
        }
      ]
    });
  });

  test("requires confirmation but allows the research pipeline when readiness rows need review", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: buildTerminalWorkspace(),
      barCount: 240,
      dataQuality: { source: "tencent", isComplete: true, warnings: ["5 missing sessions"], rows: 240 },
      cacheContext: {
        rowCount: 240,
        freshness: "fresh",
        ageHours: 1,
        latestTimestamp: "2026-05-26T08:00:00+08:00"
      },
      note: {
        source: "core",
        body: "观察假设：银行板块修复中，等待成交量二次确认。",
        savedBody: "观察假设：银行板块修复中，等待成交量确认。",
        updatedAt: "2026-05-26T08:30:00+08:00"
      }
    });

    expect(buildResearchPipelinePreflight(rows)).toMatchObject({
      status: "review",
      canRun: true,
      requiresConfirmation: true,
      summary: "Review 3 research context gates before running the pipeline.",
      primaryAction: "refresh-cache",
      issues: [
        {
          id: "klines",
          label: "K-line data",
          status: "review",
          action: "refresh-cache"
        },
        {
          id: "note",
          label: "Research note",
          status: "review",
          action: "save-note"
        },
        {
          id: "workspace",
          label: "Workspace state",
          status: "review",
          action: "save-workspace"
        }
      ]
    });
  });

  test("marks a new research note draft as unsaved until it is stored", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: buildTerminalWorkspace(),
      barCount: 240,
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      cacheContext: {
        rowCount: 240,
        freshness: "fresh",
        ageHours: 1,
        latestTimestamp: "2026-05-26T08:00:00+08:00"
      },
      note: {
        source: "fallback",
        body: "新增观察：等待量能确认后再进入策略工坊。",
        savedBody: null,
        updatedAt: null
      }
    });

    expect(rows.find((row) => row.id === "note")).toMatchObject({
      value: "draft not saved",
      detail: "Draft not saved · 新增观察：等待量能确认后再进入策略工坊。",
      status: "review",
      tone: "warning",
      action: "save-note"
    });
  });

  test("marks edited research note drafts as unsaved changes", () => {
    const rows = buildResearchContextReadinessRows({
      workspace: buildTerminalWorkspace(),
      barCount: 240,
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      cacheContext: {
        rowCount: 240,
        freshness: "fresh",
        ageHours: 1,
        latestTimestamp: "2026-05-26T08:00:00+08:00"
      },
      note: {
        source: "core",
        body: "观察假设：银行板块修复中，等待成交量二次确认。",
        savedBody: "观察假设：银行板块修复中，等待成交量确认。",
        updatedAt: "2026-05-26T08:30:00+08:00"
      }
    });

    expect(rows.find((row) => row.id === "note")).toMatchObject({
      value: "unsaved changes",
      detail: "Unsaved changes since 2026-05-26T08:30:00+08:00 · 观察假设：银行板块修复中，等待成交量二次确认。",
      status: "review",
      tone: "warning",
      action: "save-note"
    });
  });

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
      status: "blocked",
      deliveryStageId: "portfolio-paper",
      deliveryStageStatus: "planned"
    });
    expect(areas.find((area) => area.id === "market")).toMatchObject({
      deliveryStageId: "market-research",
      deliveryStageStatus: "current"
    });
    expect(areas.find((area) => area.id === "audit")).toMatchObject({
      deliveryStageId: "foundation",
      deliveryStageStatus: "maintenance"
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

  test("builds a compact golden path runbook preview from the current blocker", () => {
    const preview = buildGoldenPathRunbookPreview({
      runbook: [
        {
          stepId: "market-data",
          label: "Market data",
          workspaceId: "market",
          status: "passed",
          current: false,
          passed: true,
          detail: "Fresh cache exists.",
          blocker: null,
          actionId: null,
          actionLabel: null
        },
        {
          stepId: "research-run",
          label: "Audited research run",
          workspaceId: "research",
          status: "blocked",
          current: true,
          passed: false,
          detail: "Run the pipeline.",
          blocker: "Run the pipeline.",
          actionId: "run-pipeline",
          actionLabel: "Run research pipeline"
        },
        {
          stepId: "backtest-report",
          label: "Backtest report",
          workspaceId: "backtest",
          status: "blocked",
          current: false,
          passed: false,
          detail: "Backtest waits for audit.",
          blocker: "Backtest waits for audit.",
          actionId: "run-pipeline",
          actionLabel: "Run research pipeline"
        },
        {
          stepId: "ai-review",
          label: "AI review",
          workspaceId: "ai-review",
          status: "blocked",
          current: false,
          passed: false,
          detail: "AI waits for backtest.",
          blocker: "AI waits for backtest.",
          actionId: "run-ai-review",
          actionLabel: "Run AI review"
        }
      ]
    });

    expect(preview).toEqual([
      {
        stepId: "research-run",
        label: "Audited research run",
        workspaceId: "research",
        status: "blocked",
        current: true,
        detail: "Run the pipeline.",
        actionLabel: "Run research pipeline"
      },
      {
        stepId: "backtest-report",
        label: "Backtest report",
        workspaceId: "backtest",
        status: "blocked",
        current: false,
        detail: "Backtest waits for audit.",
        actionLabel: "Run research pipeline"
      },
      {
        stepId: "ai-review",
        label: "AI review",
        workspaceId: "ai-review",
        status: "blocked",
        current: false,
        detail: "AI waits for backtest.",
        actionLabel: "Run AI review"
      }
    ]);
  });

  test("builds selected product work-area context from golden path runbook evidence", () => {
    const context = buildGoldenPathWorkspaceContext(
      {
        workspaces: [
          {
            id: "backtest",
            label: "Backtest Lab",
            status: "needs_run",
            current: false,
            stepIds: ["backtest-report"],
            reason: "Backtest report waits for the audited pipeline.",
            actionId: "run-pipeline"
          }
        ],
        runbook: [
          {
            stepId: "research-run",
            label: "Audited research run",
            workspaceId: "research",
            status: "passed",
            current: false,
            passed: true,
            detail: "Audit run is available.",
            blocker: null,
            actionId: null,
            actionLabel: null
          },
          {
            stepId: "backtest-report",
            label: "Backtest report",
            workspaceId: "backtest",
            status: "blocked",
            current: false,
            passed: false,
            detail: "Backtest report waits for the audited pipeline.",
            blocker: "Run the research pipeline to refresh the report.",
            actionId: "run-pipeline",
            actionLabel: "Run research pipeline"
          }
        ]
      },
      "backtest"
    );

    expect(context).toEqual({
      workspaceId: "backtest",
      status: "needs_run",
      current: false,
      reason: "Backtest report waits for the audited pipeline.",
      stepIds: ["backtest-report"],
      totalStepCount: 1,
      passedStepCount: 0,
      primaryStepId: "backtest-report",
      primaryStepLabel: "Backtest report",
      detail: "Run the research pipeline to refresh the report.",
      actionId: "run-pipeline",
      actionLabel: "Run research pipeline",
      actionTargetWorkspaceId: "backtest"
    });
  });

  test("builds selected product work-area context from golden path runbook action targets", () => {
    const context = buildGoldenPathWorkspaceContext(
      {
        workspaces: [
          {
            id: "market",
            label: "Market",
            status: "needs_run",
            current: true,
            stepIds: ["market-data"],
            reason: "Market calendar review requires Research confirmation.",
            actionId: "run-pipeline"
          }
        ],
        runbook: [
          {
            stepId: "market-data",
            label: "Market data",
            workspaceId: "market",
            status: "review",
            current: true,
            passed: false,
            detail: "Market calendar review requires Research confirmation.",
            blocker: "Market calendar review requires Research confirmation.",
            actionId: "run-pipeline",
            actionLabel: "Run research pipeline",
            targetWorkspace: "research"
          }
        ] as any
      },
      "market"
    );

    expect(context).toMatchObject({
      workspaceId: "market",
      actionId: "run-pipeline",
      actionTargetWorkspaceId: "research"
    });
  });

  test("returns no work-area context when the golden path has no matching workspace", () => {
    expect(buildGoldenPathWorkspaceContext({ workspaces: [], runbook: [] }, "execution")).toBeNull();
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

  test("blocks Strategy Lab audit evidence when an audited run belongs to another context", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-strategy-context",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-strategy-context",
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
    const mismatchedWorkspace = {
      ...auditedWorkspace,
      selectedInstrument: {
        symbol: "AAPL",
        name: "Apple",
        market: "us" as const,
        price: 191.2,
        changePct: 0
      }
    };

    expect(buildStrategyReadinessGates(mismatchedWorkspace).find((gate) => gate.id === "audit")).toEqual({
      id: "audit",
      label: "Audit evidence",
      value: "run-strategy-context",
      detail: "Audited run run-strategy-context belongs to ASHARE · 600000 · 1d, not US · AAPL · 1d.",
      status: "blocked",
      tone: "risk"
    });
  });

  test("keeps local audit context gate when core validation returns a passed audit gate", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-core-validation-stale",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-core-validation-stale",
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
    const mismatchedWorkspace = {
      ...auditedWorkspace,
      selectedInstrument: {
        symbol: "AAPL",
        name: "Apple",
        market: "us" as const,
        price: 191.2,
        changePct: 0
      }
    };
    const localGates = buildStrategyReadinessGates(mismatchedWorkspace);
    const coreGates = localGates.map((gate) =>
      gate.id === "audit"
        ? {
            id: "audit" as const,
            label: "Audit evidence" as const,
            value: "run-core-validation-stale",
            detail: "This draft is bound to a reproducible audit run.",
            status: "passed" as const,
            tone: "positive" as const
          }
        : gate
    );

    const merged = mergeStrategyReadinessGatesWithLocalAudit(coreGates, localGates);

    expect(merged.find((gate) => gate.id === "audit")).toEqual({
      id: "audit",
      label: "Audit evidence",
      value: "run-core-validation-stale",
      detail: "Audited run run-core-validation-stale belongs to ASHARE · 600000 · 1d, not US · AAPL · 1d.",
      status: "blocked",
      tone: "risk"
    });
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

  test("identifies whether an audited run matches the selected research context", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-context-match",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-context",
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

    expect(buildResearchRunContextBinding(auditedWorkspace)).toMatchObject({
      status: "matched",
      canUseRun: true,
      runId: "run-context-match",
      selectedContext: "ASHARE · 600000 · 1d",
      runContext: "ASHARE · 600000 · 1d",
      detail: "Audited run run-context-match matches the selected research context."
    });

    const mismatchedWorkspace = {
      ...auditedWorkspace,
      selectedInstrument: {
        symbol: "AAPL",
        name: "Apple",
        market: "us" as const,
        changePct: 0,
        price: 191.2
      }
    };

    expect(buildResearchRunContextBinding(mismatchedWorkspace)).toMatchObject({
      status: "mismatched",
      canUseRun: false,
      runId: "run-context-match",
      selectedContext: "US · AAPL · 1d",
      runContext: "ASHARE · 600000 · 1d",
      detail: "Audited run run-context-match belongs to ASHARE · 600000 · 1d, not US · AAPL · 1d."
    });
  });

  test("blocks Backtest report evidence when an audited run belongs to another context", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-context-mismatch",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-context",
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
    const mismatchedWorkspace = {
      ...auditedWorkspace,
      selectedTimeframe: "5m" as const
    };

    expect(buildBacktestEvidenceCards(mismatchedWorkspace)[0]).toMatchObject({
      id: "run",
      value: "run-context-mismatch",
      tone: "risk",
      detail: "Audited run run-context-mismatch belongs to ASHARE · 600000 · 1d, not ASHARE · 600000 · 5m."
    });
    expect(buildBacktestReadinessGates(mismatchedWorkspace)[0]).toMatchObject({
      id: "data",
      status: "blocked",
      tone: "risk",
      detail: "Audited run run-context-mismatch belongs to ASHARE · 600000 · 1d, not ASHARE · 600000 · 5m."
    });
    expect(buildBacktestReport(mismatchedWorkspace)).toMatchObject({
      status: "blocked",
      headline: "Backtest report needs a matching audited run",
      summary: "Run Pipeline to create a fresh audited run for the selected market, symbol, and timeframe.",
      runId: "run-context-mismatch",
      aiReviewReady: false,
      executionReady: false
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

  test("blocks AI review artifacts when the audited run belongs to another context", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-ai-stale",
      createdAt: "2026-05-28T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-ai-stale",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [],
      executionMode: "paper_only"
    });
    const mismatchedWorkspace: TerminalWorkspace = {
      ...auditedWorkspace,
      selectedInstrument: {
        symbol: "AAPL",
        name: "Apple",
        market: "us",
        price: 191.2,
        changePct: -0.36
      }
    };

    expect(buildAiEvidenceCards(mismatchedWorkspace).find((card) => card.id === "backtest")).toEqual({
      id: "backtest",
      label: "Backtest evidence",
      value: "Stale audited run",
      detail: "Audited run run-ai-stale belongs to ASHARE · 600000 · 1d, not US · AAPL · 1d.",
      tone: "risk"
    });
    expect(buildAiReviewDossier(mismatchedWorkspace)).toEqual({
      status: "blocked",
      headline: "Current audit context required",
      summary: "Run Pipeline to bind AI review to the selected research context before exporting or saving records.",
      citations: [
        {
          id: "run",
          label: "Run id",
          value: "run-ai-stale",
          detail: "Audited run run-ai-stale belongs to ASHARE · 600000 · 1d, not US · AAPL · 1d.",
          tone: "risk"
        },
        {
          id: "data-quality",
          label: "Data quality",
          value: "Stale context",
          detail: "Data quality cannot be trusted until the run matches the selected market, symbol, and timeframe.",
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
    expect(buildAiReviewReportMarkdown(mismatchedWorkspace)).toBeNull();
    expect(buildAiReviewRunRecord(mismatchedWorkspace)).toBeNull();
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
        ],
        preparationEvidence: {
          kind: "watchlist_cache_refresh",
          runId: "cache-refresh-ai-record",
          createdAt: "2026-05-26T08:05:00+00:00",
          market: "ashare",
          symbol: "600000",
          name: "浦发银行",
          timeframe: "1d",
          status: "refreshed",
          requestedLimit: 240,
          upsertedRows: 240,
          quality: {
            source: "tencent",
            isComplete: true,
            warnings: [],
            rows: 240
          },
          error: null
        }
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
    expect(record?.evidenceAnchors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "run:run-ai-record",
          type: "research-run",
          reference: "run-ai-record",
          exportPath: "researchRun.runId"
        }),
        expect.objectContaining({
          id: "strategy:rev-ai-record",
          type: "strategy-revision",
          reference: "rev-ai-record",
          exportPath: "researchRun.strategyConfig.revision"
        }),
        expect.objectContaining({
          id: "data:snapshot-ai-record",
          type: "data-snapshot",
          reference: "snapshot-ai-record",
          exportPath: "researchRun.dataSnapshot.hash"
        }),
        expect.objectContaining({
          id: "preparationEvidence:cache-refresh-ai-record",
          type: "data-preparation",
          label: "Data preparation",
          reference: "cache-refresh-ai-record",
          exportPath: "researchRun.dataSnapshot.preparationEvidence"
        }),
        expect.objectContaining({
          id: "citation:parameter-scan",
          type: "citation",
          reference: "parameter-scan",
          exportPath: "aiReviewRuns[].record.citations[parameter-scan]"
        }),
        expect.objectContaining({
          id: "boundary:evidence-explanation-only",
          type: "risk-boundary",
          reference: "Evidence explanation only",
          exportPath: "aiReviewRuns[].record.boundary"
        })
      ])
    );
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

  test("surfaces market calendar report evidence in AI anchors and Backtest Markdown", () => {
    const marketCalendar = {
      market: "ashare",
      timezone: "Asia/Shanghai",
      status: "break",
      isOpen: false,
      session: "lunch_break",
      asOf: "2026-06-11T12:00:00+08:00",
      tradingDay: "2026-06-11",
      nextOpen: "2026-06-11T13:00:00+08:00",
      nextClose: "2026-06-11T15:00:00+08:00",
      detail: "A-share lunch break.",
      warnings: ["Static session template only; exchange holiday calendar is not configured."],
      source: "static-session-template"
    } satisfies ResearchContextMarketCalendar;
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-calendar-report-evidence",
      createdAt: "2026-06-11T04:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "Calendar evidence SMA",
      strategyRevision: "rev-calendar-report",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "Technical", message: "Calendar evidence is bound to the audit.", tone: "positive" }],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-06-10T08:00:00+00:00",
        end: "2026-06-11T04:00:00+00:00",
        hash: "snapshot-calendar-report",
        bars: [
          {
            timestamp: "2026-06-10T08:00:00+00:00",
            timestampMs: 1781078400000,
            open: 10,
            high: 10.2,
            low: 9.9,
            close: 10,
            volume: 1200000
          },
          {
            timestamp: "2026-06-11T04:00:00+00:00",
            timestampMs: 1781150400000,
            open: 10.1,
            high: 10.7,
            low: 10,
            close: 10.5,
            volume: 1300000
          }
        ],
        marketCalendar
      },
      backtestTrades: [
        {
          id: "trade-calendar-report",
          timestamp: "2026-06-11T04:00:00+00:00",
          symbol: "600000",
          side: "BUY",
          status: "filled",
          price: "10.50",
          quantity: "2000",
          exposure: "20%",
          pnl: "+8.20%",
          reason: "Close > SMA20",
          tone: "positive"
        }
      ]
    });

    const record = buildAiReviewRunRecord(workspace);
    const markdown = buildBacktestReportMarkdown(workspace);

    expect(record?.evidenceAnchors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "marketCalendar:ashare:2026-06-11",
          type: "market-calendar",
          label: "Market calendar",
          reference: "ashare 2026-06-11 break/lunch_break",
          exportPath: "researchRun.dataSnapshot.marketCalendar"
        })
      ])
    );
    expect(markdown).toContain(
      "| Market calendar | ashare · Asia/Shanghai · break/lunch_break · next open 2026-06-11T13:00:00+08:00 · Static session template only; exchange holiday calendar is not configured. · 1 warning |"
    );
  });

  test("builds audit drift rows for saved AI review records", () => {
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
      decisions: [{ agent: "Technical", message: "Trend improved after the audit run.", tone: "positive" }],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-26T08:00:00+00:00",
        end: "2026-05-27T08:00:00+00:00",
        hash: "snapshot-ai-record",
        bars: []
      }
    });
    const currentRecord = buildAiReviewRunRecord(workspace);
    expect(currentRecord).not.toBeNull();
    const staleRecord = {
      ...currentRecord!,
      aiReviewId: "ai-review:run-ai-record:rev-old",
      strategyRevision: "rev-old",
      summary: {
        ...currentRecord!.summary,
        citationCount: currentRecord!.summary.citationCount - 1,
        roundCount: currentRecord!.summary.roundCount - 1,
        liveExecutionBlocked: false
      }
    };

    const rows = buildAiReviewRecordDriftRows({
      currentCitationCount: currentRecord!.summary.citationCount,
      currentRunId: currentRecord!.runId,
      currentStatus: currentRecord!.status,
      currentStrategyRevision: currentRecord!.strategyRevision,
      liveExecutionBlocked: true,
      records: [currentRecord!, staleRecord],
      roundCount: currentRecord!.summary.roundCount
    });

    expect(rows).toEqual([
      expect.objectContaining({
        aiReviewId: "ai-review:run-ai-record:rev-ai-record",
        driftCount: 0,
        driftReasons: [],
        status: "matched"
      }),
      expect.objectContaining({
        aiReviewId: "ai-review:run-ai-record:rev-old",
        driftCount: 4,
        driftReasons: ["strategy", "citations", "rounds", "boundary"],
        status: "drift"
      })
    ]);
  });

  test("filters AI review drift rows by revision, id, status, and drift reason", () => {
    const rows: AiReviewRecordDriftRow[] = [
      {
        aiReviewId: "ai-review:run-a:rev-current",
        createdAt: "2026-05-28T08:00:00+00:00",
        strategyRevision: "rev-current",
        citationCount: 6,
        roundCount: 5,
        liveExecutionBlocked: true,
        status: "matched" as const,
        driftCount: 0,
        driftReasons: []
      },
      {
        aiReviewId: "ai-review:run-a:rev-old",
        createdAt: "2026-05-27T08:00:00+00:00",
        strategyRevision: "rev-old",
        citationCount: 4,
        roundCount: 4,
        liveExecutionBlocked: false,
        status: "drift" as const,
        driftCount: 3,
        driftReasons: ["strategy", "citations", "boundary"]
      }
    ];

    expect(filterAiReviewRecordDriftRows(rows, "")).toEqual(rows);
    expect(filterAiReviewRecordDriftRows(rows, "REV-OLD").map((row) => row.strategyRevision)).toEqual(["rev-old"]);
    expect(filterAiReviewRecordDriftRows(rows, "matched").map((row) => row.strategyRevision)).toEqual(["rev-current"]);
    expect(filterAiReviewRecordDriftRows(rows, "boundary").map((row) => row.strategyRevision)).toEqual(["rev-old"]);
    expect(filterAiReviewRecordDriftRows(rows, "run-a:rev-current").map((row) => row.aiReviewId)).toEqual([
      "ai-review:run-a:rev-current"
    ]);
  });

  test("builds an AI review audit timeline for approval references", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-ai-timeline",
      createdAt: "2026-05-28T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-ai-timeline",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "Technical", message: "Trend improved after the audit run.", tone: "positive" }],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-26T08:00:00+00:00",
        end: "2026-05-27T08:00:00+00:00",
        hash: "snapshot-ai-timeline",
        bars: []
      }
    });
    const currentRecord = buildAiReviewRunRecord(workspace);
    expect(currentRecord).not.toBeNull();
    const olderRecord = {
      ...currentRecord!,
      aiReviewId: "ai-review:run-ai-timeline:rev-old",
      createdAt: "2026-05-27T08:00:00+00:00",
      strategyRevision: "rev-old",
      summary: {
        ...currentRecord!.summary,
        citationCount: currentRecord!.summary.citationCount - 1,
        roundCount: currentRecord!.summary.roundCount - 1
      }
    };

    const items = buildAiReviewAuditTimelineItems({
      currentRunId: currentRecord!.runId,
      currentStrategyRevision: currentRecord!.strategyRevision,
      dossier: buildAiReviewDossier(workspace),
      records: [olderRecord, currentRecord!],
      riskApproval: {
        status: "paper_ready",
        headline: "Paper execution approved",
        summary: "Audited run can stage paper orders; live trading remains blocked.",
        gates: []
      }
    });

    expect(items.map((item) => item.id)).toEqual([
      "current:run-ai-timeline",
      "strategy:rev-ai-timeline",
      "saved:ai-review:run-ai-timeline:rev-ai-timeline",
      "saved:ai-review:run-ai-timeline:rev-old",
      "risk:paper_ready"
    ]);
    expect(items[0]).toMatchObject<Partial<AiReviewAuditTimelineItem>>({
      kind: "current-evidence",
      status: "passed",
      tone: "ai",
      reference: "run-ai-timeline",
      exportAnchor: "run:run-ai-timeline",
      targetWorkspaceId: "backtest",
      targetRecordId: null,
      actionLabel: "Open backtest evidence"
    });
    expect(items[1]).toMatchObject<Partial<AiReviewAuditTimelineItem>>({
      kind: "strategy-revision-evidence",
      reference: "rev-ai-timeline",
      exportAnchor: "strategy:rev-ai-timeline",
      status: "passed",
      tone: "positive",
      targetWorkspaceId: "strategy",
      targetRecordId: null,
      actionLabel: "Open strategy revision"
    });
    expect(items[2]).toMatchObject<Partial<AiReviewAuditTimelineItem>>({
      kind: "saved-review",
      reference: "ai-review:run-ai-timeline:rev-ai-timeline",
      exportAnchor: "aiReviewRun:ai-review:run-ai-timeline:rev-ai-timeline",
      status: "passed",
      tone: "ai",
      targetWorkspaceId: null,
      targetRecordId: "ai-review:run-ai-timeline:rev-ai-timeline",
      actionLabel: "Compare saved review"
    });
    expect(items[4]).toMatchObject<Partial<AiReviewAuditTimelineItem>>({
      kind: "risk-approval",
      reference: "risk:paper_ready",
      exportAnchor: "riskApproval:paper_ready",
      status: "review",
      tone: "warning",
      targetWorkspaceId: "execution",
      targetRecordId: null,
      actionLabel: "Open execution approval"
    });
  });

  test("adds committee rounds evidence to the AI review audit timeline and evidence index", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-committee-timeline",
      createdAt: "2026-06-11T04:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-committee-timeline",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "Technical", message: "Committee evidence is locked.", tone: "positive" }],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240,
        start: "2026-06-10T08:00:00+00:00",
        end: "2026-06-11T08:00:00+00:00",
        hash: "snapshot-committee-timeline",
        bars: []
      }
    });
    const currentRecord = buildAiReviewRunRecord(workspace);
    expect(currentRecord).not.toBeNull();
    const roundCount = currentRecord!.summary.roundCount;
    expect(roundCount).toBeGreaterThan(0);

    const timelineItems = buildAiReviewAuditTimelineItems({
      currentRunId: currentRecord!.runId,
      currentStrategyRevision: currentRecord!.strategyRevision,
      dossier: buildAiReviewDossier(workspace),
      records: [],
      riskApproval: {
        status: "blocked",
        headline: "Risk review blocked",
        summary: "No execution handoff without review.",
        gates: []
      },
      roundCount
    });
    const committeeItem = timelineItems.find((item) => item.kind === "committee-rounds-evidence");

    expect(committeeItem).toMatchObject<Partial<AiReviewAuditTimelineItem>>({
      id: `committee:${roundCount}-rounds`,
      kind: "committee-rounds-evidence",
      label: "Committee rounds",
      reference: String(roundCount),
      exportAnchor: `committee:${roundCount}-rounds`,
      status: "passed",
      tone: "ai",
      targetWorkspaceId: "ai-review",
      targetRecordId: null,
      actionLabel: "Open committee rounds"
    });

    const rows = buildAiReviewExportEvidenceIndexRows({
      currentRecord: currentRecord!,
      records: [],
      timelineItems
    });
    expect(rows).toEqual(
      expect.arrayContaining<AiReviewExportEvidenceIndexRow>([
        expect.objectContaining({
          id: `timeline:${roundCount}`,
          group: "timeline",
          anchor: `committee:${roundCount}-rounds`,
          reference: String(roundCount),
          exportPath: "aiReviewRuns[].record.rounds"
        })
      ])
    );
    expect(filterAiReviewExportEvidenceIndexRows(rows, `${roundCount}-rounds`).map((row) => row.anchor)).toContain(
      `committee:${roundCount}-rounds`
    );
  });

  test("adds decision log evidence to the AI review audit timeline and evidence index", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-decision-log-timeline",
      createdAt: "2026-06-11T05:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-decision-log-timeline",
      dataRows: 240,
      metrics: {
        total_return_pct: 7.4,
        max_drawdown_pct: 2.9,
        win_rate_pct: 57,
        trade_count: 8
      },
      decisions: [
        { agent: "Technical", message: "Trend evidence is locked.", tone: "positive" },
        { agent: "Risk", message: "Paper-only boundary remains active.", tone: "warning" }
      ],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240,
        start: "2026-06-10T08:00:00+00:00",
        end: "2026-06-11T08:00:00+00:00",
        hash: "snapshot-decision-log-timeline",
        bars: []
      }
    });
    const currentRecord = buildAiReviewRunRecord(workspace);
    expect(currentRecord).not.toBeNull();
    const decisionCount = currentRecord!.summary.decisionCount;
    expect(decisionCount).toBeGreaterThan(0);

    const timelineItems = buildAiReviewAuditTimelineItems({
      currentRunId: currentRecord!.runId,
      currentStrategyRevision: currentRecord!.strategyRevision,
      decisionCount,
      dossier: buildAiReviewDossier(workspace),
      records: [],
      riskApproval: {
        status: "blocked",
        headline: "Risk review blocked",
        summary: "No execution handoff without review.",
        gates: []
      },
      roundCount: currentRecord!.summary.roundCount
    });
    const decisionItem = timelineItems.find((item) => item.kind === "decision-log-evidence");

    expect(decisionItem).toMatchObject<Partial<AiReviewAuditTimelineItem>>({
      id: `decision-log:${decisionCount}`,
      kind: "decision-log-evidence",
      label: "Decision log",
      reference: String(decisionCount),
      exportAnchor: `decision-log:${decisionCount}`,
      status: "passed",
      tone: "ai",
      targetWorkspaceId: "ai-review",
      targetRecordId: null,
      actionLabel: "Open decision log"
    });

    const rows = buildAiReviewExportEvidenceIndexRows({
      currentRecord: currentRecord!,
      records: [],
      timelineItems
    });
    expect(rows).toEqual(
      expect.arrayContaining<AiReviewExportEvidenceIndexRow>([
        expect.objectContaining({
          id: `timeline:${decisionCount}`,
          group: "timeline",
          anchor: `decision-log:${decisionCount}`,
          reference: String(decisionCount),
          exportPath: "aiReviewRuns[].record.decisionLog"
        })
      ])
    );
    expect(filterAiReviewExportEvidenceIndexRows(rows, `decision-log:${decisionCount}`).map((row) => row.anchor)).toContain(
      `decision-log:${decisionCount}`
    );
  });

  test("adds AI boundary evidence to the AI review audit timeline and evidence index", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-boundary-timeline",
      createdAt: "2026-06-11T06:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-boundary-timeline",
      dataRows: 240,
      metrics: {
        total_return_pct: 6.8,
        max_drawdown_pct: 2.4,
        win_rate_pct: 54,
        trade_count: 7
      },
      decisions: [
        { agent: "Risk", message: "Explanation-only boundary remains locked.", tone: "warning" }
      ],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240,
        start: "2026-06-10T08:00:00+00:00",
        end: "2026-06-11T08:00:00+00:00",
        hash: "snapshot-boundary-timeline",
        bars: []
      }
    });
    const currentRecord = buildAiReviewRunRecord(workspace);
    expect(currentRecord).not.toBeNull();
    expect(currentRecord!.boundary).toContain("Evidence explanation only");

    const timelineItems = buildAiReviewAuditTimelineItems({
      aiBoundary: currentRecord!.boundary,
      currentRunId: currentRecord!.runId,
      currentStrategyRevision: currentRecord!.strategyRevision,
      decisionCount: currentRecord!.summary.decisionCount,
      dossier: buildAiReviewDossier(workspace),
      records: [],
      riskApproval: {
        status: "blocked",
        headline: "Risk review blocked",
        summary: "No execution handoff without review.",
        gates: []
      },
      roundCount: currentRecord!.summary.roundCount
    });
    const boundaryItem = timelineItems.find((item) => item.kind === "ai-boundary-evidence");

    expect(boundaryItem).toMatchObject<Partial<AiReviewAuditTimelineItem>>({
      id: "boundary:evidence-explanation-only",
      kind: "ai-boundary-evidence",
      label: "AI boundary",
      reference: "Evidence explanation only",
      exportAnchor: "boundary:evidence-explanation-only",
      status: "blocked",
      tone: "risk",
      targetWorkspaceId: "ai-review",
      targetRecordId: null,
      actionLabel: "Open AI boundary"
    });

    const rows = buildAiReviewExportEvidenceIndexRows({
      currentRecord: currentRecord!,
      records: [],
      timelineItems
    });
    expect(rows).toEqual(
      expect.arrayContaining<AiReviewExportEvidenceIndexRow>([
        expect.objectContaining({
          id: "timeline:Evidence explanation only",
          group: "timeline",
          anchor: "boundary:evidence-explanation-only",
          reference: "Evidence explanation only",
          exportPath: "aiReviewRuns[].record.boundary"
        })
      ])
    );
    expect(filterAiReviewExportEvidenceIndexRows(rows, "boundary:evidence").map((row) => row.anchor)).toContain(
      "boundary:evidence-explanation-only"
    );
  });

  test("adds citation bundle evidence to the AI review audit timeline and evidence index", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-citation-bundle-timeline",
      createdAt: "2026-06-11T07:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-citation-bundle-timeline",
      dataRows: 240,
      metrics: {
        total_return_pct: 7.1,
        max_drawdown_pct: 2.7,
        win_rate_pct: 56,
        trade_count: 8
      },
      decisions: [{ agent: "Technical", message: "Citation bundle is locked.", tone: "positive" }],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240,
        start: "2026-06-10T08:00:00+00:00",
        end: "2026-06-11T08:00:00+00:00",
        hash: "snapshot-citation-bundle-timeline",
        bars: []
      }
    });
    const currentRecord = buildAiReviewRunRecord(workspace);
    expect(currentRecord).not.toBeNull();
    const citationCount = currentRecord!.summary.citationCount;
    expect(citationCount).toBeGreaterThan(0);

    const timelineItems = buildAiReviewAuditTimelineItems({
      aiBoundary: currentRecord!.boundary,
      citationCount,
      currentRunId: currentRecord!.runId,
      currentStrategyRevision: currentRecord!.strategyRevision,
      decisionCount: currentRecord!.summary.decisionCount,
      dossier: buildAiReviewDossier(workspace),
      records: [],
      riskApproval: {
        status: "blocked",
        headline: "Risk review blocked",
        summary: "No execution handoff without review.",
        gates: []
      },
      roundCount: currentRecord!.summary.roundCount
    });
    const citationBundleItem = timelineItems.find((item) => item.kind === "citation-bundle-evidence");

    expect(citationBundleItem).toMatchObject<Partial<AiReviewAuditTimelineItem>>({
      id: `citations:${citationCount}`,
      kind: "citation-bundle-evidence",
      label: "Citation bundle",
      reference: String(citationCount),
      exportAnchor: `citations:${citationCount}`,
      status: "passed",
      tone: "ai",
      targetWorkspaceId: "ai-review",
      targetRecordId: null,
      actionLabel: "Open citations"
    });

    const rows = buildAiReviewExportEvidenceIndexRows({
      currentRecord: currentRecord!,
      records: [],
      timelineItems
    });
    expect(rows).toEqual(
      expect.arrayContaining<AiReviewExportEvidenceIndexRow>([
        expect.objectContaining({
          id: `timeline:${citationCount}`,
          group: "timeline",
          anchor: `citations:${citationCount}`,
          reference: String(citationCount),
          exportPath: "aiReviewRuns[].record.citations"
        })
      ])
    );
    expect(filterAiReviewExportEvidenceIndexRows(rows, `citations:${citationCount}`).map((row) => row.anchor)).toContain(
      `citations:${citationCount}`
    );
  });

  test("adds market calendar evidence to the AI review audit timeline and evidence index", () => {
    const marketCalendar = {
      market: "ashare",
      timezone: "Asia/Shanghai",
      status: "break",
      isOpen: false,
      session: "lunch_break",
      asOf: "2026-06-11T12:00:00+08:00",
      tradingDay: "2026-06-11",
      nextOpen: "2026-06-11T13:00:00+08:00",
      nextClose: "2026-06-11T15:00:00+08:00",
      detail: "A-share lunch break",
      warnings: ["Static session template only; exchange holiday calendar is not configured."],
      source: "static-session-template"
    } satisfies ResearchContextMarketCalendar;
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-calendar-timeline",
      createdAt: "2026-06-11T04:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-calendar-timeline",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "Technical", message: "Calendar evidence requires review.", tone: "warning" }],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-06-10T08:00:00+00:00",
        end: "2026-06-11T08:00:00+00:00",
        hash: "snapshot-calendar-timeline",
        bars: [],
        marketCalendar
      }
    });
    const currentRecord = buildAiReviewRunRecord(workspace);
    expect(currentRecord).not.toBeNull();

    const timelineItems = buildAiReviewAuditTimelineItems({
      currentRunId: currentRecord!.runId,
      currentStrategyRevision: currentRecord!.strategyRevision,
      dossier: buildAiReviewDossier(workspace),
      records: [],
      riskApproval: {
        status: "blocked",
        headline: "Risk review blocked",
        summary: "No execution handoff without review.",
        gates: []
      },
      marketCalendar
    });
    const calendarItem = timelineItems.find((item) => item.kind === "market-calendar-evidence");

    expect(calendarItem).toMatchObject<Partial<AiReviewAuditTimelineItem>>({
      id: "calendar:ashare:2026-06-11",
      kind: "market-calendar-evidence",
      label: "Market calendar",
      reference: "ashare 2026-06-11 break/lunch_break",
      exportAnchor: "marketCalendar:ashare:2026-06-11",
      status: "review",
      tone: "warning",
      targetWorkspaceId: "backtest",
      actionLabel: "Open calendar evidence"
    });

    const rows = buildAiReviewExportEvidenceIndexRows({
      currentRecord: currentRecord!,
      records: [],
      timelineItems
    });
    expect(rows).toEqual(
      expect.arrayContaining<AiReviewExportEvidenceIndexRow>([
        expect.objectContaining({
          id: "timeline:ashare 2026-06-11 break/lunch_break",
          group: "timeline",
          anchor: "marketCalendar:ashare:2026-06-11",
          reference: "ashare 2026-06-11 break/lunch_break",
          exportPath: "researchRun.dataSnapshot.marketCalendar"
        })
      ])
    );
    expect(filterAiReviewExportEvidenceIndexRows(rows, "marketCalendar").map((row) => row.anchor)).toContain(
      "marketCalendar:ashare:2026-06-11"
    );
  });

  test("adds data preparation evidence to the AI review audit timeline and evidence index", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-preparation-timeline",
      createdAt: "2026-06-11T04:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-preparation-timeline",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "Technical", message: "Prepared cache evidence is locked.", tone: "positive" }],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240,
        start: "2026-06-10T08:00:00+00:00",
        end: "2026-06-11T08:00:00+00:00",
        hash: "snapshot-preparation-timeline",
        bars: [],
        preparationEvidence: {
          kind: "watchlist_cache_refresh",
          runId: "cache-refresh-timeline",
          createdAt: "2026-06-11T03:50:00+00:00",
          market: "ashare",
          symbol: "600000",
          name: "浦发银行",
          timeframe: "1d",
          status: "refreshed",
          requestedLimit: 240,
          upsertedRows: 240,
          quality: {
            source: "tencent",
            isComplete: true,
            warnings: [],
            rows: 240
          },
          error: null
        }
      }
    });
    const currentRecord = buildAiReviewRunRecord(workspace);
    expect(currentRecord).not.toBeNull();
    const preparationEvidence = workspace.researchRun?.dataSnapshot?.preparationEvidence ?? null;
    expect(preparationEvidence).not.toBeNull();

    const timelineItems = buildAiReviewAuditTimelineItems({
      currentRunId: currentRecord!.runId,
      currentStrategyRevision: currentRecord!.strategyRevision,
      dossier: buildAiReviewDossier(workspace),
      records: [],
      riskApproval: {
        status: "blocked",
        headline: "Risk review blocked",
        summary: "No execution handoff without review.",
        gates: []
      },
      preparationEvidence
    });
    const preparationItem = timelineItems.find((item) => item.kind === "data-preparation-evidence");

    expect(preparationItem).toMatchObject<Partial<AiReviewAuditTimelineItem>>({
      id: "preparation:cache-refresh-timeline",
      kind: "data-preparation-evidence",
      label: "Data preparation",
      reference: "cache-refresh-timeline",
      exportAnchor: "preparationEvidence:cache-refresh-timeline",
      status: "passed",
      tone: "positive",
      targetWorkspaceId: "backtest",
      actionLabel: "Open preparation evidence"
    });

    const rows = buildAiReviewExportEvidenceIndexRows({
      currentRecord: currentRecord!,
      records: [],
      timelineItems
    });
    expect(rows).toEqual(
      expect.arrayContaining<AiReviewExportEvidenceIndexRow>([
        expect.objectContaining({
          id: "timeline:cache-refresh-timeline",
          group: "timeline",
          anchor: "preparationEvidence:cache-refresh-timeline",
          reference: "cache-refresh-timeline",
          exportPath: "researchRun.dataSnapshot.preparationEvidence"
        })
      ])
    );
    expect(filterAiReviewExportEvidenceIndexRows(rows, "cache-refresh-timeline").map((row) => row.anchor)).toContain(
      "preparationEvidence:cache-refresh-timeline"
    );
  });

  test("adds data snapshot evidence to the AI review audit timeline and evidence index", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-snapshot-timeline",
      createdAt: "2026-06-11T04:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-snapshot-timeline",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "Technical", message: "Snapshot hash is locked.", tone: "positive" }],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240,
        start: "2026-06-10T08:00:00+00:00",
        end: "2026-06-11T08:00:00+00:00",
        hash: "snapshot-timeline-hash",
        bars: []
      }
    });
    const currentRecord = buildAiReviewRunRecord(workspace);
    expect(currentRecord).not.toBeNull();
    const dataSnapshot = workspace.researchRun?.dataSnapshot ?? null;
    expect(dataSnapshot).not.toBeNull();

    const timelineItems = buildAiReviewAuditTimelineItems({
      currentRunId: currentRecord!.runId,
      currentStrategyRevision: currentRecord!.strategyRevision,
      dossier: buildAiReviewDossier(workspace),
      records: [],
      riskApproval: {
        status: "blocked",
        headline: "Risk review blocked",
        summary: "No execution handoff without review.",
        gates: []
      },
      dataSnapshot
    });
    const snapshotItem = timelineItems.find((item) => item.kind === "data-snapshot-evidence");

    expect(snapshotItem).toMatchObject<Partial<AiReviewAuditTimelineItem>>({
      id: "snapshot:snapshot-timeline-hash",
      kind: "data-snapshot-evidence",
      label: "Data snapshot",
      reference: "snapshot-timeline-hash",
      exportAnchor: "data:snapshot-timeline-hash",
      status: "passed",
      tone: "positive",
      targetWorkspaceId: "backtest",
      actionLabel: "Open data snapshot"
    });

    const rows = buildAiReviewExportEvidenceIndexRows({
      currentRecord: currentRecord!,
      records: [],
      timelineItems
    });
    expect(rows).toEqual(
      expect.arrayContaining<AiReviewExportEvidenceIndexRow>([
        expect.objectContaining({
          id: "timeline:snapshot-timeline-hash",
          group: "timeline",
          anchor: "data:snapshot-timeline-hash",
          reference: "snapshot-timeline-hash",
          exportPath: "researchRun.dataSnapshot.hash"
        })
      ])
    );
    expect(filterAiReviewExportEvidenceIndexRows(rows, "snapshot-timeline-hash").map((row) => row.anchor)).toContain(
      "data:snapshot-timeline-hash"
    );
  });

  test("adds strategy revision evidence to the AI review audit timeline and evidence index", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-strategy-timeline",
      createdAt: "2026-06-11T04:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-strategy-timeline",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "Technical", message: "Strategy revision is locked.", tone: "positive" }],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240,
        start: "2026-06-10T08:00:00+00:00",
        end: "2026-06-11T08:00:00+00:00",
        hash: "snapshot-strategy-timeline",
        bars: []
      }
    });
    const currentRecord = buildAiReviewRunRecord(workspace);
    expect(currentRecord).not.toBeNull();

    const timelineItems = buildAiReviewAuditTimelineItems({
      currentRunId: currentRecord!.runId,
      currentStrategyRevision: currentRecord!.strategyRevision,
      dossier: buildAiReviewDossier(workspace),
      records: [],
      riskApproval: {
        status: "blocked",
        headline: "Risk review blocked",
        summary: "No execution handoff without review.",
        gates: []
      }
    });
    const strategyItem = timelineItems.find((item) => item.kind === "strategy-revision-evidence");

    expect(strategyItem).toMatchObject<Partial<AiReviewAuditTimelineItem>>({
      id: "strategy:rev-strategy-timeline",
      kind: "strategy-revision-evidence",
      label: "Strategy revision",
      reference: "rev-strategy-timeline",
      exportAnchor: "strategy:rev-strategy-timeline",
      status: "passed",
      tone: "positive",
      targetWorkspaceId: "strategy",
      actionLabel: "Open strategy revision"
    });

    const rows = buildAiReviewExportEvidenceIndexRows({
      currentRecord: currentRecord!,
      records: [],
      timelineItems
    });
    expect(rows).toEqual(
      expect.arrayContaining<AiReviewExportEvidenceIndexRow>([
        expect.objectContaining({
          id: "timeline:rev-strategy-timeline",
          group: "timeline",
          anchor: "strategy:rev-strategy-timeline",
          reference: "rev-strategy-timeline",
          exportPath: "researchRun.strategyConfig.revision"
        })
      ])
    );
    expect(filterAiReviewExportEvidenceIndexRows(rows, "rev-strategy-timeline").map((row) => row.anchor)).toContain(
      "strategy:rev-strategy-timeline"
    );
  });

  test("builds a searchable AI review export evidence index", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-ai-index",
      createdAt: "2026-05-28T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev-ai-index",
      dataRows: 240,
      metrics: {
        total_return_pct: 8.2,
        max_drawdown_pct: 3.1,
        win_rate_pct: 55,
        trade_count: 9
      },
      decisions: [{ agent: "Technical", message: "Trend improved after the audit run.", tone: "positive" }],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-26T08:00:00+00:00",
        end: "2026-05-27T08:00:00+00:00",
        hash: "snapshot-ai-index",
        bars: []
      }
    });
    const currentRecord = buildAiReviewRunRecord(workspace);
    expect(currentRecord).not.toBeNull();
    const savedRecord = {
      ...currentRecord!,
      aiReviewId: "ai-review:run-ai-index:rev-saved",
      strategyRevision: "rev-saved",
      evidenceAnchors: [
        {
          id: "run:run-ai-index",
          type: "research-run" as const,
          label: "Research run",
          reference: "run-ai-index",
          exportPath: "researchRun.runId"
        },
        {
          id: "citation:parameter-scan",
          type: "citation" as const,
          label: "Parameter scan",
          reference: "parameter-scan",
          exportPath: "aiReviewRuns[].record.citations[parameter-scan]"
        }
      ]
    };
    const timelineItems = buildAiReviewAuditTimelineItems({
      currentRunId: currentRecord!.runId,
      currentStrategyRevision: currentRecord!.strategyRevision,
      dossier: buildAiReviewDossier(workspace),
      records: [savedRecord],
      riskApproval: {
        status: "paper_ready",
        headline: "Paper execution approved",
        summary: "Audited run can stage paper orders; live trading remains blocked.",
        gates: []
      }
    });

    const rows = buildAiReviewExportEvidenceIndexRows({
      currentRecord: currentRecord!,
      records: [savedRecord],
      timelineItems
    });

    expect(rows).toEqual(
      expect.arrayContaining<AiReviewExportEvidenceIndexRow>([
        expect.objectContaining({
          id: "current:run:run-ai-index",
          group: "current-record",
          anchor: "run:run-ai-index",
          exportPath: "researchRun.runId",
          reference: "run-ai-index"
        }),
        expect.objectContaining({
          id: "saved:ai-review:run-ai-index:rev-saved:citation:parameter-scan",
          group: "saved-record",
          anchor: "citation:parameter-scan",
          exportPath: "aiReviewRuns[].record.citations[parameter-scan]",
          reference: "parameter-scan"
        }),
        expect.objectContaining({
          id: "timeline:risk:paper_ready",
          group: "timeline",
          anchor: "riskApproval:paper_ready",
          exportPath: "executionHandoff.requiredGates",
          reference: "risk:paper_ready"
        })
      ])
    );
    expect(filterAiReviewExportEvidenceIndexRows(rows, "parameter-scan").map((row) => row.anchor)).toContain(
      "citation:parameter-scan"
    );
    expect(filterAiReviewExportEvidenceIndexRows(rows, "executionHandoff").map((row) => row.group)).toEqual([
      "timeline"
    ]);
  });

  test("builds a reproducible research run export preview from active audit evidence", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-export-preview",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-export-preview",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [{ agent: "Technical", message: "Trend improved after audit.", tone: "positive" }],
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
        rows: 240,
        start: "2026-05-26T08:00:00+00:00",
        end: "2026-05-27T08:00:00+00:00",
        hash: "snapshot-export-preview",
        bars: [
          {
            timestamp: "2026-05-26T08:00:00+00:00",
            timestampMs: 1779782400000,
            open: 9.1,
            high: 9.32,
            low: 9.09,
            close: 9.27,
            volume: 1_464_000
          }
        ],
        preparationEvidence: {
          kind: "watchlist_cache_refresh",
          runId: "cache-refresh-export-preview",
          createdAt: "2026-05-26T08:05:00+00:00",
          market: "ashare",
          symbol: "600000",
          name: "浦发银行",
          timeframe: "1d",
          status: "refreshed",
          requestedLimit: 240,
          upsertedRows: 240,
          quality: {
            source: "tencent",
            isComplete: true,
            warnings: [],
            rows: 240
          },
          error: null
        }
      },
      researchNote: {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        body: "Bank sector context and SMA hypothesis.",
        updatedAt: "2026-05-26T08:10:00+00:00"
      },
      strategyConfig: {
        name: "SMA Trend / Bank Sector",
        revision: "rev-export-preview",
        market: "ashare",
        symbols: ["600000"],
        timeframe: "1d",
        version: 1,
        entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
        exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
        risk: { positionPct: 0.2, stopLossPct: 0.08, takeProfitPct: 0.18, maxDrawdownPct: 0.12 }
      },
      backtestTrades: [
        {
          id: "trade-export-preview",
          timestamp: "2026-05-26T08:00:00+00:00",
          symbol: "600000",
          side: "BUY",
          status: "filled",
          price: "9.27",
          quantity: "2100",
          exposure: "20%",
          pnl: "+12.4%",
          reason: "Close > SMA20",
          tone: "positive"
        }
      ],
      backtestEquityCurve: [{ timestamp: "2026-05-26T08:00:00+00:00", equity: 100_000 }]
    });
    const currentRecord = buildAiReviewRunRecord(workspace);
    expect(currentRecord).not.toBeNull();
    const paperExecution = {
      executionId: "paper-export-preview",
      runId: "run-export-preview",
      createdAt: "2026-05-26T08:20:00+00:00",
      mode: "paper_only",
      account: { cash: 80_659, equity: 100_000, positions: { "600000": 2100 } },
      orders: [
        {
          orderId: "order-export-preview",
          symbol: "600000",
          side: "buy" as const,
          quantity: 2100,
          price: 9.21,
          status: "filled" as const,
          reason: "filled_immediately",
          timestamp: "2026-05-26T08:20:00+00:00"
        }
      ],
      gates: [{ id: "paper-risk-check", label: "Paper risk check", passed: true, reason: "passed" }]
    };
    const promotion = buildPromotionReadiness(workspace, paperExecution, buildBrokerAdapterRows(workspace));
    const rows = buildResearchRunExportPreviewRows({
      workspace,
      aiReviewRecords: [
        {
          aiReviewId: "ai-review:run-export-preview:rev-export-preview",
          runId: "run-export-preview",
          createdAt: "2026-05-26T08:30:00+00:00",
          record: currentRecord!
        }
      ],
      currentAiReviewRecord: currentRecord,
      paperExecution,
      promotionCandidate: {
        ...promotion,
        runId: "run-export-preview",
        candidateId: "promotion-export-preview",
        createdAt: "2026-05-26T08:40:00+00:00",
        liveTradingAllowed: false,
        evidence: { paperExecutions: 1, filledOrders: 1, passedPaperRiskChecks: 1 }
      },
      riskApproval: buildRiskApprovalSummary(workspace)
    });

    expect(rows).toEqual(
      expect.arrayContaining<ResearchRunExportPreviewRow>([
        expect.objectContaining({
          id: "research-run",
          status: "ready",
          count: "1",
          exportPath: "researchRun",
          anchor: "run:run-export-preview"
        }),
        expect.objectContaining({
          id: "data-snapshot",
          status: "ready",
          count: "240",
          exportPath: "researchRun.dataSnapshot",
          anchor: "dataSnapshot:snapshot-export-preview"
        }),
        expect.objectContaining({
          id: "preparation-evidence",
          status: "ready",
          count: "240 rows",
          exportPath: "researchRun.dataSnapshot.preparationEvidence",
          anchor: "preparationEvidence:cache-refresh-export-preview"
        }),
        expect.objectContaining({
          id: "strategy-config",
          status: "ready",
          exportPath: "researchRun.strategyConfig",
          anchor: "strategy:rev-export-preview"
        }),
        expect.objectContaining({
          id: "ai-review-runs",
          status: "ready",
          count: "1 saved / current ready",
          exportPath: "aiReviewRuns[]",
          anchor: "aiReviewRun:ai-review:run-export-preview:rev-export-preview"
        }),
        expect.objectContaining({
          id: "paper-executions",
          status: "ready",
          count: "1 order",
          exportPath: "paperExecutions[]",
          anchor: "paperExecution:paper-export-preview"
        }),
        expect.objectContaining({
          id: "promotion-candidate",
          status: "blocked",
          exportPath: "promotionCandidate",
          anchor: "promotion:promotion-export-preview"
        }),
        expect.objectContaining({
          id: "execution-handoff",
          status: "ready",
          exportPath: "executionHandoff.requiredGates"
        })
      ])
    );
    expect(filterResearchRunExportPreviewRows(rows, "snapshot").map((row) => row.id)).toEqual([
      "data-snapshot",
      "market-calendar",
      "preparation-evidence"
    ]);
    expect(filterResearchRunExportPreviewRows(rows, "cache-refresh-export-preview").map((row) => row.id)).toEqual([
      "preparation-evidence"
    ]);
    expect(filterResearchRunExportPreviewRows(rows, "paperExecutions").map((row) => row.id)).toEqual([
      "paper-executions"
    ]);
  });

  test("builds a searchable research run export package browser from manifest artifacts", () => {
    const rows = buildResearchRunExportBrowserRows({
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-05-26T08:50:00+00:00",
      integrity: {
        algorithm: "sha256",
        hash: "b".repeat(64)
      },
      manifest: {
        runId: "run-browser",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-browser",
        dataHash: "snapshot-browser",
        dataRows: 240,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: {
          bars: 240,
          trades: 12,
          equityPoints: 240,
          decisions: 4,
          aiRisks: 2,
          paperExecutions: 1,
          portfolioPaperOrderBatches: 1,
          portfolioPaperOrderApprovals: 1,
          portfolioPaperOrderSimulations: 1,
          promotionCandidates: 1,
          researchNotes: 1,
          aiReviewRuns: 2
        }
      },
      researchRun: {
        runId: "run-browser",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Browser SMA",
        strategyRevision: "rev-browser",
        dataRows: 240,
        dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 240,
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-27T08:00:00+00:00",
          hash: "snapshot-browser",
          bars: [],
          preparationEvidence: {
            kind: "watchlist_cache_refresh",
            runId: "cache-refresh-browser",
            createdAt: "2026-05-26T08:05:00+00:00",
            market: "ashare",
            symbol: "600000",
            name: "浦发银行",
            timeframe: "1d",
            status: "refreshed",
            requestedLimit: 240,
            upsertedRows: 240,
            quality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
            error: null
          }
        },
        metrics: {},
        decisions: [],
        executionMode: "paper_only",
        backtestTrades: [],
        backtestEquityCurve: []
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [
          { id: "adapter-certified", label: "Adapter certified", passed: false, reason: "not configured" },
          { id: "risk-approved", label: "Risk approved", passed: true, reason: "paper approved" }
        ]
      },
      paperExecutions: [
        {
          executionId: "paper-browser",
          runId: "run-browser",
          createdAt: "2026-05-26T08:20:00+00:00",
          mode: "paper_only",
          account: { cash: 80_659, equity: 100_000, positions: { "600000": 2100 } },
          orders: [],
          gates: []
        }
      ],
      portfolioPaperOrderBatches: [
        {
          batchId: "portfolio-paper-batch-browser",
          baseRunId: "run-browser",
          portfolioName: "Browser basket",
          createdAt: "2026-05-26T08:25:00+00:00",
          mode: "portfolio_paper_order_review",
          source: "portfolio_backtest",
          summary: {
            totalOrders: 1,
            totalNotionalValue: 19341,
            statusCounts: { pending_review: 1 },
            riskStatusCounts: { review: 1 }
          },
          orders: [
            {
              timestamp: "2026-05-26T08:25:00+00:00",
              eventType: "portfolio_paper_order",
              orderId: "portfolio-paper-order-browser",
              symbol: "600000",
              sourceRunId: "run-browser",
              side: "buy",
              notionalValue: 19341,
              quantity: 2100,
              status: "pending_review",
              riskStatus: "review",
              reason: "Operator review required."
            }
          ]
        }
      ],
      portfolioPaperOrderApprovals: [
        {
          approvalId: "portfolio-paper-order-approval-portfolio-paper-batch-browser-portfolio-paper-order-browser",
          baseRunId: "run-browser",
          batchId: "portfolio-paper-batch-browser",
          orderId: "portfolio-paper-order-browser",
          reviewedAt: "2026-05-26T08:26:00+00:00",
          approved: true,
          reviewer: "operator-browser",
          reason: "Approved for paper simulation."
        }
      ],
      portfolioPaperOrderSimulations: [
        {
          simulationId: "portfolio-paper-order-simulation-portfolio-paper-batch-browser-portfolio-paper-order-browser",
          baseRunId: "run-browser",
          batchId: "portfolio-paper-batch-browser",
          orderId: "portfolio-paper-order-browser",
          simulatedAt: "2026-05-26T08:27:00+00:00",
          mode: "portfolio_paper_order_simulation",
          symbol: "600000",
          sourceRunId: "run-browser",
          side: "buy",
          quantity: 2100,
          fillPrice: 9.21,
          notionalValue: 19341,
          orderState: "filled",
          fillStatus: "filled",
          reason: "Paper-only simulated fill.",
          approvedBy: "operator-browser",
          paperOnly: true,
          liveExecutionBlocked: true
        }
      ],
      promotionCandidate: {
        candidateId: "promotion-browser",
        runId: "run-browser",
        createdAt: "2026-05-26T08:40:00+00:00",
        liveTradingAllowed: false,
        status: "certification_pending",
        headline: "Live promotion pending certification",
        summary: "Adapter certification is still required.",
        stages: [],
        evidence: { paperExecutions: 1, filledOrders: 1, passedPaperRiskChecks: 1 }
      },
      aiReviewRuns: [
        {
          aiReviewId: "ai-review:run-browser:rev-browser",
          runId: "run-browser",
          createdAt: "2026-05-26T08:45:00+00:00",
          record: {
            recordType: "aiqt.aiReviewRun",
            schemaVersion: 1,
            aiReviewId: "ai-review:run-browser:rev-browser",
            runId: "run-browser",
            createdAt: "2026-05-26T08:45:00+00:00",
            strategyRevision: "rev-browser",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            executionMode: "paper_only",
            status: "ready",
            summary: {
              citationCount: 1,
              roundCount: 1,
              decisionCount: 1,
              parameterScanBound: false,
              liveExecutionBlocked: true
            },
            dossier: { status: "ready", headline: "Evidence ready", summary: "AI evidence is bound.", citations: [] },
            citations: [],
            rounds: [],
            decisionLog: [],
            boundary: "AI can explain supplied evidence only."
          }
        }
      ],
      auditEvidenceSummary: {
        kind: "aiqt.auditEvidenceSummary",
        schemaVersion: 1,
        runId: "run-browser",
        generatedAt: "2026-06-04T08:00:00+00:00",
        auditQuery: "manual-smoke",
        packageQuery: "manifest:run-browser",
        importDiffQuery: "manifest:run-browser",
        focusQuery: "manifest:run-browser",
        deepLinkStatus: "loaded",
        deepLinkError: null,
        package: { ready: 5, missing: 1, blocked: 2, matched: 1, total: 9 },
        importDiff: { changes: 1, adds: 0, blocked: 0, matched: 1, total: 11 },
        copyText: "AIQT Audit Evidence Summary\nRun: run-browser"
      },
      auditReport: {
        kind: "aiqt.auditReport",
        schemaVersion: 1,
        runId: "run-browser",
        generatedAt: "2026-06-04T08:00:00+00:00",
        format: "text/markdown",
        fileName: "run-browser-audit-evidence-report.md",
        contentSha256: {
          algorithm: "sha256",
          hash: "d".repeat(64)
        },
        contentMarkdown: "# AIQuant Audit Evidence Report\n",
        signature: {
          status: "verified",
          algorithm: "hmac-sha256",
          eventId: "audit-report-run-imported-signed",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          signedAt: "2026-06-04T08:01:00.000Z",
          verifiedAt: "2026-06-04T08:02:00.000Z",
          chainId: "audit-chain-local",
          value: "a".repeat(64)
        },
        evidenceSummary: {
          kind: "aiqt.auditEvidenceSummary",
          schemaVersion: 1,
          runId: "run-browser",
          generatedAt: "2026-06-04T08:00:00+00:00",
          auditQuery: "manual-smoke",
          packageQuery: "manifest:run-browser",
          importDiffQuery: "manifest:run-browser",
          focusQuery: "manifest:run-browser",
          deepLinkStatus: "loaded",
          deepLinkError: null,
          package: { ready: 5, missing: 1, blocked: 2, matched: 1, total: 9 },
          importDiff: { changes: 1, adds: 0, blocked: 0, matched: 1, total: 11 },
          copyText: "AIQT Audit Evidence Summary\nRun: run-browser"
        }
      },
      backtestReport: {
        kind: "aiqt.backtestReport",
        schemaVersion: 1,
        runId: "run-browser",
        generatedAt: "2026-06-04T08:00:00+00:00",
        format: "text/markdown",
        fileName: "run-browser-backtest-report.md",
        contentSha256: {
          algorithm: "sha256",
          hash: "e".repeat(64)
        },
        contentMarkdown: "# AIQuant Audited Backtest Report\n",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-browser",
        executionMode: "paper_only",
        dataRows: 240,
        runComparisonRows: 2,
        boundary: "historical audited evidence only; no investment advice",
        signature: {
          status: "signed",
          algorithm: "hmac-sha256",
          eventId: "backtest-report-run-imported-signed",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          signedAt: "2026-06-04T08:03:00.000Z",
          chainId: "audit-chain-local",
          value: "b".repeat(64)
        }
      }
    });

    expect(rows).toEqual(
      expect.arrayContaining<ResearchRunExportBrowserRow>([
        expect.objectContaining({
          id: "package",
          status: "ready",
          value: "run-browser · rev-browser",
          exportPath: "manifest.runId"
        }),
        expect.objectContaining({
          id: "integrity",
          status: "ready",
          value: "sha256 · bbbbbbbb",
          exportPath: "integrity.hash"
        }),
        expect.objectContaining({
          id: "data",
          status: "ready",
          value: "240/240 bars",
          exportPath: "manifest.artifactCounts.bars"
        }),
        expect.objectContaining({
          id: "preparation-evidence",
          status: "ready",
          value: "cache-refresh-browser",
          detail: "cache-refresh-browser · watchlist_cache_refresh · 600000 1d · tencent complete · 240 rows cached",
          exportPath: "researchRun.dataSnapshot.preparationEvidence"
        }),
        expect.objectContaining({
          id: "backtest",
          status: "ready",
          value: "12 trades / 240 equity",
          exportPath: "researchRun.backtestTrades"
        }),
        expect.objectContaining({
          id: "backtest-report",
          status: "ready",
          value: "sha256 · eeeeeeee",
          detail: "run-browser-backtest-report.md · 2 comparable runs · Signed report hash · Local Audit Key · local-audit-key · hmac-sha256",
          exportPath: "backtestReport.contentSha256.hash"
        }),
        expect.objectContaining({
          id: "ai-reviews",
          status: "blocked",
          value: "2 manifest / 1 package",
          exportPath: "aiReviewRuns[]"
        }),
        expect.objectContaining({
          id: "portfolio-paper-orders",
          status: "ready",
          value: "1 batches / 1 approvals / 1 fills",
          detail: expect.stringContaining(
            "Portfolio paper order batch, approval, and simulated-fill counts match the package payload."
          ),
          exportPath: "portfolioPaperOrderBatches[] portfolioPaperOrderApprovals[] portfolioPaperOrderSimulations[]"
        }),
        expect.objectContaining({
          id: "audit-summary",
          status: "ready",
          value: "1/9 package · 0 diff blocked",
          exportPath: "auditEvidenceSummary"
        }),
        expect.objectContaining({
          id: "audit-report",
          status: "ready",
          value: "sha256 · dddddddd",
          detail:
            "run-browser-audit-evidence-report.md · generated 2026-06-04T08:00:00+00:00 · Verified signature · Local Audit Key · local-audit-key · hmac-sha256",
          exportPath: "auditReport.contentSha256.hash"
        }),
        expect.objectContaining({
          id: "execution-handoff",
          status: "blocked",
          value: "1/2 gates",
          exportPath: "executionHandoff.requiredGates"
        })
      ])
    );
    expect(filterResearchRunExportBrowserRows(rows, "integrity.hash").map((row) => row.id)).toEqual(["integrity"]);
    expect(filterResearchRunExportBrowserRows(rows, "cache-refresh-browser").map((row) => row.id)).toEqual([
      "preparation-evidence"
    ]);
    expect(filterResearchRunExportBrowserRows(rows, "aiReviewRuns").map((row) => row.id)).toEqual(["ai-reviews"]);
    expect(filterResearchRunExportBrowserRows(rows, "portfolioPaperOrderBatches").map((row) => row.id)).toEqual([
      "portfolio-paper-orders"
    ]);
    expect(filterResearchRunExportBrowserRows(rows, "portfolioPaperOrderSimulations").map((row) => row.id)).toEqual([
      "portfolio-paper-orders"
    ]);
    expect(filterResearchRunExportBrowserRows(rows, "auditEvidenceSummary").map((row) => row.id)).toEqual([
      "audit-summary"
    ]);
    expect(filterResearchRunExportBrowserRows(rows, "auditReport").map((row) => row.id)).toEqual(["audit-report"]);
    expect(filterResearchRunExportBrowserRows(rows, "backtestReport").map((row) => row.id)).toEqual([
      "backtest-report"
    ]);
    expect(filterResearchRunExportBrowserRows(rows, "local-audit-key").map((row) => row.id)).toEqual([
      "backtest-report",
      "audit-report"
    ]);
  });

  test("surfaces market calendar export evidence across preview browser index and import diff", () => {
    const marketCalendar = {
      market: "ashare",
      timezone: "Asia/Shanghai",
      status: "open",
      isOpen: true,
      session: "morning",
      asOf: "2026-06-11T10:15:00+08:00",
      tradingDay: "2026-06-11",
      nextOpen: null,
      nextClose: "2026-06-11T11:30:00+08:00",
      detail: "A-share morning session is open.",
      warnings: [],
      source: "static-session-template"
    } satisfies ResearchContextMarketCalendar;
    const researchRunAudit = {
      runId: "run-calendar-export",
      createdAt: "2026-06-11T02:15:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "Calendar evidence SMA",
      strategyRevision: "rev-calendar-export",
      dataRows: 240,
      metrics: { total_return_pct: 4.2, max_drawdown_pct: 2.1, win_rate_pct: 52, trade_count: 8 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240,
        start: "2026-06-10T08:00:00+00:00",
        end: "2026-06-11T02:15:00+00:00",
        hash: "snapshot-calendar-export",
        bars: [],
        marketCalendar
      },
      backtestTrades: [],
      backtestEquityCurve: []
    } satisfies ResearchRunAudit;
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), researchRunAudit);
    const exportPackage = {
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-06-11T02:20:00+00:00",
      integrity: { algorithm: "sha256", hash: "a".repeat(64) },
      manifest: {
        runId: "run-calendar-export",
        createdAt: "2026-06-11T02:15:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-calendar-export",
        dataHash: "snapshot-calendar-export",
        dataRows: 240,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: {
          bars: 240,
          trades: 0,
          equityPoints: 0,
          decisions: 0,
          aiRisks: 0,
          paperExecutions: 0,
          portfolioPaperOrderBatches: 0,
          portfolioPaperOrderApprovals: 0,
          portfolioPaperOrderSimulations: 0,
          promotionCandidates: 0,
          researchNotes: 0,
          aiReviewRuns: 0
        }
      },
      researchRun: researchRunAudit,
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: []
      }
    } satisfies ResearchRunExportBrowserPackage;

    const previewRows = buildResearchRunExportPreviewRows({ workspace });
    const browserRows = buildResearchRunExportBrowserRows(exportPackage);
    const indexRows = buildResearchRunExportIndexRows([exportPackage]);
    const importRows = buildResearchRunImportDiffRows({ workspace: buildTerminalWorkspace(), exportPackage });

    expect(previewRows).toEqual(
      expect.arrayContaining<ResearchRunExportPreviewRow>([
        expect.objectContaining({
          id: "market-calendar",
          label: "Market calendar",
          status: "ready",
          count: "open · morning",
          anchor: "marketCalendar:ashare:2026-06-11",
          exportPath: "researchRun.dataSnapshot.marketCalendar",
          detail:
            "ashare · Asia/Shanghai · open/morning · next close 2026-06-11T11:30:00+08:00 · static-session-template · 0 warnings",
          tone: "positive"
        })
      ])
    );
    expect(browserRows).toEqual(
      expect.arrayContaining<ResearchRunExportBrowserRow>([
        expect.objectContaining({
          id: "market-calendar",
          status: "ready",
          value: "open · morning",
          detail:
            "ashare · Asia/Shanghai · open/morning · next close 2026-06-11T11:30:00+08:00 · static-session-template · 0 warnings",
          exportPath: "researchRun.dataSnapshot.marketCalendar",
          tone: "positive"
        })
      ])
    );
    expect(indexRows).toEqual(
      expect.arrayContaining<ResearchRunExportIndexRow>([
        expect.objectContaining({
          id: "run-calendar-export",
          artifacts: expect.stringContaining("calendar open/morning")
        })
      ])
    );
    expect(importRows).toEqual(
      expect.arrayContaining<ResearchRunImportDiffRow>([
        expect.objectContaining({
          id: "market-calendar",
          status: "add",
          current: "No market calendar evidence",
          incoming:
            "ashare · Asia/Shanghai · open/morning · next close 2026-06-11T11:30:00+08:00 · static-session-template · 0 warnings",
          exportPath: "researchRun.dataSnapshot.marketCalendar",
          tone: "warning"
        })
      ])
    );

    expect(filterResearchRunExportPreviewRows(previewRows, "static-session-template").map((row) => row.id)).toEqual([
      "market-calendar"
    ]);
    expect(filterResearchRunExportBrowserRows(browserRows, "marketCalendar").map((row) => row.id)).toEqual([
      "market-calendar"
    ]);
    expect(filterResearchRunExportIndexRows(indexRows, "morning").map((row) => row.id)).toEqual([
      "run-calendar-export"
    ]);
    expect(filterResearchRunImportDiffRows(importRows, "next close").map((row) => row.id)).toEqual([
      "market-calendar"
    ]);
  });

  test("builds a searchable recent export package index across packages", () => {
    const basePackage = {
      kind: "aiqt.researchRun.export" as const,
      packageVersion: 1,
      exportedAt: "2026-05-26T08:50:00+00:00",
      integrity: {
        algorithm: "sha256" as const,
        hash: "c".repeat(64)
      },
      manifest: {
        runId: "run-index-a",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "1d" as const,
        strategyRevision: "rev-index-a",
        dataHash: "hash-index-a",
        dataRows: 500,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: {
          bars: 500,
          trades: 18,
          equityPoints: 500,
          decisions: 4,
          aiRisks: 1,
          paperExecutions: 1,
          portfolioPaperOrderBatches: 1,
          portfolioPaperOrderApprovals: 1,
          portfolioPaperOrderSimulations: 1,
          promotionCandidates: 1,
          researchNotes: 1,
          aiReviewRuns: 1
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [
          { id: "adapter-certified", label: "Adapter certified", passed: false, reason: "not configured" },
          { id: "risk-approved", label: "Risk approved", passed: true, reason: "paper approved" }
        ]
      },
      researchRun: {
        ...auditedRunFixture({
          runId: "run-index-a",
          strategyRevision: "rev-index-a",
          dataRows: 500,
          tradeCount: 18
        }),
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 500,
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-27T08:00:00+00:00",
          hash: "hash-index-a",
          bars: [],
          preparationEvidence: {
            kind: "watchlist_cache_refresh" as const,
            runId: "cache-refresh-index-a",
            createdAt: "2026-05-26T08:05:00+00:00",
            market: "ashare" as const,
            symbol: "600000",
            name: "浦发银行",
            timeframe: "1d" as const,
            status: "refreshed",
            requestedLimit: 500,
            upsertedRows: 500,
            quality: {
              source: "tencent",
              isComplete: true,
              warnings: [],
              rows: 500
            },
            error: null
          }
        }
      },
      paperExecutions: [
        {
          executionId: "paper-index-a",
          runId: "run-index-a",
          createdAt: "2026-05-26T08:20:00+00:00",
          mode: "paper_only",
          account: { cash: 80_659, equity: 100_000, positions: { "600000": 2100 } },
          orders: [],
          gates: []
        }
      ],
      portfolioPaperOrderBatches: [
        {
          batchId: "portfolio-paper-batch-index-a",
          baseRunId: "run-index-a",
          portfolioName: "Index basket",
          createdAt: "2026-05-26T08:25:00+00:00",
          mode: "portfolio_paper_order_review" as const,
          source: "portfolio_backtest",
          summary: {
            totalOrders: 1,
            totalNotionalValue: 19341,
            statusCounts: { pending_review: 1 },
            riskStatusCounts: { review: 1 }
          },
          orders: [
            {
              timestamp: "2026-05-26T08:25:00+00:00",
              eventType: "portfolio_paper_order" as const,
              orderId: "portfolio-paper-order-index-a",
              symbol: "600000",
              sourceRunId: "run-index-a",
              side: "buy" as const,
              notionalValue: 19341,
              quantity: 2100,
              status: "pending_review" as const,
              riskStatus: "review" as const,
              reason: "Operator review required."
            }
          ]
        }
      ],
      portfolioPaperOrderApprovals: [
        {
          approvalId: "portfolio-paper-order-approval-portfolio-paper-batch-index-a-portfolio-paper-order-index-a",
          baseRunId: "run-index-a",
          batchId: "portfolio-paper-batch-index-a",
          orderId: "portfolio-paper-order-index-a",
          reviewedAt: "2026-05-26T08:26:00+00:00",
          approved: true,
          reviewer: "operator-index",
          reason: "Approved for paper simulation."
        }
      ],
      portfolioPaperOrderSimulations: [
        {
          simulationId: "portfolio-paper-order-simulation-portfolio-paper-batch-index-a-portfolio-paper-order-index-a",
          baseRunId: "run-index-a",
          batchId: "portfolio-paper-batch-index-a",
          orderId: "portfolio-paper-order-index-a",
          simulatedAt: "2026-05-26T08:27:00+00:00",
          mode: "portfolio_paper_order_simulation" as const,
          symbol: "600000",
          sourceRunId: "run-index-a",
          side: "buy" as const,
          quantity: 2100,
          fillPrice: 9.21,
          notionalValue: 19341,
          orderState: "filled" as const,
          fillStatus: "filled" as const,
          reason: "Paper-only simulated fill.",
          approvedBy: "operator-index",
          paperOnly: true,
          liveExecutionBlocked: true
        }
      ],
      promotionCandidate: {
        candidateId: "promotion-index-a",
        runId: "run-index-a",
        createdAt: "2026-05-26T08:40:00+00:00",
        liveTradingAllowed: false,
        status: "certification_pending" as const,
        headline: "Live promotion pending certification",
        summary: "Adapter certification is still required.",
        stages: [],
        evidence: { paperExecutions: 1, filledOrders: 1, passedPaperRiskChecks: 1 }
      },
      aiReviewRuns: [
        {
          aiReviewId: "ai-review:run-index-a:rev-index-a",
          runId: "run-index-a",
          createdAt: "2026-05-26T08:45:00+00:00",
          record: {
            recordType: "aiqt.aiReviewRun" as const,
            schemaVersion: 1 as const,
            aiReviewId: "ai-review:run-index-a:rev-index-a",
            runId: "run-index-a",
            createdAt: "2026-05-26T08:45:00+00:00",
            strategyRevision: "rev-index-a",
            market: "ashare" as const,
            symbol: "600000",
            timeframe: "1d" as const,
            executionMode: "paper_only",
            status: "ready" as const,
            summary: {
              citationCount: 1,
              roundCount: 1,
              decisionCount: 1,
              parameterScanBound: false,
              liveExecutionBlocked: true
            },
            dossier: { status: "ready" as const, headline: "Evidence ready", summary: "AI evidence is bound.", citations: [] },
            citations: [],
            rounds: [],
            decisionLog: [],
            boundary: "AI can explain supplied evidence only."
          }
        }
      ],
      auditReport: {
        kind: "aiqt.auditReport" as const,
        schemaVersion: 1 as const,
        runId: "run-index-a",
        generatedAt: "2026-05-26T08:46:00+00:00",
        format: "text/markdown" as const,
        fileName: "run-index-a-audit-evidence-report.md",
        contentSha256: {
          algorithm: "sha256" as const,
          hash: "e".repeat(64)
        },
        contentMarkdown: "# AIQuant Audit Evidence Report\n",
        signature: {
          status: "verified",
          algorithm: "hmac-sha256",
          eventId: "audit-report-run-imported-signed",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          signedAt: "2026-05-26T08:48:00.000Z",
          verifiedAt: "2026-05-26T08:49:00.000Z",
          chainId: "audit-chain-local",
          value: "a".repeat(64)
        },
        evidenceSummary: {
          kind: "aiqt.auditEvidenceSummary" as const,
          schemaVersion: 1 as const,
          runId: "run-index-a",
          generatedAt: "2026-05-26T08:46:00+00:00",
          auditQuery: "manual-smoke",
          packageQuery: "manifest:run-index-a",
          importDiffQuery: "manifest:run-index-a",
          focusQuery: "manifest:run-index-a",
          deepLinkStatus: "loaded" as const,
          deepLinkError: null,
          package: { ready: 6, missing: 1, blocked: 1, matched: 1, total: 10 },
          importDiff: { changes: 3, adds: 2, blocked: 0, matched: 1, total: 12 },
          copyText: "AIQT Audit Evidence Summary\nRun: run-index-a"
        }
      },
      backtestReport: {
        kind: "aiqt.backtestReport" as const,
        schemaVersion: 1 as const,
        runId: "run-index-a",
        generatedAt: "2026-05-26T08:47:00+00:00",
        format: "text/markdown" as const,
        fileName: "run-index-a-backtest-report.md",
        contentSha256: {
          algorithm: "sha256" as const,
          hash: "f".repeat(64)
        },
        contentMarkdown: "# AIQuant Audited Backtest Report\n",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "1d" as const,
        strategyRevision: "rev-index-a",
        executionMode: "paper_only",
        dataRows: 500,
        runComparisonRows: 3,
        boundary: "historical audited evidence only; no investment advice" as const,
        signature: {
          status: "signed",
          algorithm: "hmac-sha256",
          eventId: "backtest-report-run-imported-signed",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          signedAt: "2026-05-26T08:49:30.000Z",
          chainId: "audit-chain-local",
          value: "b".repeat(64)
        }
      }
    };
    const rows = buildResearchRunExportIndexRows([
      basePackage,
      {
        ...basePackage,
        exportedAt: "2026-05-26T09:50:00+00:00",
        integrity: undefined,
        manifest: {
          ...basePackage.manifest,
          runId: "run-index-b",
          symbol: "AAPL",
          market: "us",
          strategyRevision: "rev-index-b",
          dataHash: "",
          artifactCounts: {
            ...basePackage.manifest.artifactCounts,
            bars: 499,
            paperExecutions: 2,
            portfolioPaperOrderApprovals: 2,
            portfolioPaperOrderSimulations: 3,
            aiReviewRuns: 3
          }
        },
        paperExecutions: [],
        researchRun: undefined,
        aiReviewRuns: []
      }
    ]);

    expect(rows).toEqual(
      expect.arrayContaining<ResearchRunExportIndexRow>([
        expect.objectContaining({
          id: "run-index-b",
          runId: "run-index-b",
          status: "blocked",
          context: "AAPL · 1d",
          integrity: "No hash",
          detail:
            "Integrity missing; Data snapshot mismatch; Paper execution count mismatch; Portfolio paper order count mismatch; AI review count mismatch; Audit report mismatch; Backtest report mismatch"
        }),
        expect.objectContaining({
          id: "run-index-a",
          runId: "run-index-a",
          status: "review",
          context: "600000 · 1d",
          integrity: "sha256 · cccccccc",
          artifacts:
            "500 bars / 18 trades / prep cache-refresh-index-a / 1 portfolio batches / 1 approvals / 1 fills / 1 AI / 2 reports / auditReport eeeeeeee verified / backtestReport ffffffff signed",
          execution: "1/2 gates · paper_only"
        })
      ])
    );
    expect(rows.map((row) => row.id)).toEqual(["run-index-b", "run-index-a"]);
    expect(filterResearchRunExportIndexRows(rows, "AAPL").map((row) => row.id)).toEqual(["run-index-b"]);
    expect(filterResearchRunExportIndexRows(rows, "integrity missing").map((row) => row.id)).toEqual(["run-index-b"]);
    expect(filterResearchRunExportIndexRows(rows, "hash-index-a").map((row) => row.id)).toEqual(["run-index-a"]);
    expect(filterResearchRunExportIndexRows(rows, "auditReport").map((row) => row.id)).toEqual(["run-index-b", "run-index-a"]);
    expect(filterResearchRunExportIndexRows(rows, "backtestReport").map((row) => row.id)).toEqual([
      "run-index-b",
      "run-index-a"
    ]);
    expect(filterResearchRunExportIndexRows(rows, "2 reports").map((row) => row.id)).toEqual([
      "run-index-b",
      "run-index-a"
    ]);
    expect(filterResearchRunExportIndexRows(rows, "local-audit-key").map((row) => row.id)).toEqual(["run-index-a"]);
    expect(filterResearchRunExportIndexRows(rows, "cache-refresh-index-a").map((row) => row.id)).toEqual([
      "run-index-a"
    ]);
  });

  test("builds searchable import diff rows before applying a research run export package", () => {
    const currentWorkspace: TerminalWorkspace = {
      ...buildTerminalWorkspace(),
      selectedInstrument: {
        symbol: "600000",
        name: "浦发银行",
        market: "ashare",
        changePct: 1.2,
        price: 9.21
      },
      selectedTimeframe: "1d",
      researchRun: {
        runId: "run-current",
        createdAt: "2026-05-26T08:00:00+00:00",
        timeframe: "1d",
        strategyRevision: "rev-current",
        dataRows: 240,
        dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
        dataSnapshot: {
          rows: 240,
          hash: "hash-current",
          source: "tencent",
          isComplete: true,
          warnings: [],
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:00:00+00:00",
          bars: [],
          preparationEvidence: {
            kind: "watchlist_cache_refresh",
            runId: "cache-refresh-current",
            createdAt: "2026-05-26T07:55:00+00:00",
            market: "ashare",
            symbol: "600000",
            name: "浦发银行",
            timeframe: "1d",
            status: "refreshed",
            requestedLimit: 240,
            upsertedRows: 240,
            quality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
            error: null
          }
        },
        executionMode: "paper_only",
        strategyConfig: {
          version: 1,
          revision: "rev-current",
          name: "Current SMA",
          market: "ashare",
          symbols: ["600000"],
          timeframe: "1d",
          entryConditions: [{ kind: "close_above_sma", params: { window: 20, threshold: 0 } }],
          exitConditions: [{ kind: "close_below_sma", params: { window: 20, threshold: 0 } }],
          risk: { positionPct: 20, stopLossPct: 8, takeProfitPct: 16, maxDrawdownPct: 12 }
        },
        researchNote: {
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          body: "Current local research note",
          updatedAt: "2026-05-26T07:50:00+00:00"
        }
      }
    };
    const exportPackage = {
      kind: "aiqt.researchRun.export" as const,
      packageVersion: 1,
      exportedAt: "2026-05-26T09:00:00+00:00",
      integrity: {
        algorithm: "sha256" as const,
        hash: "d".repeat(64)
      },
      manifest: {
        runId: "run-imported",
        createdAt: "2026-05-26T08:30:00+00:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "5m" as const,
        strategyRevision: "rev-imported",
        dataHash: "hash-imported",
        dataRows: 500,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: {
          bars: 500,
          trades: 18,
          equityPoints: 500,
          decisions: 4,
          aiRisks: 1,
          paperExecutions: 1,
          portfolioPaperOrderBatches: 1,
          promotionCandidates: 0,
          researchNotes: 1,
          aiReviewRuns: 2
        }
      },
      researchRun: {
        runId: "run-imported",
        createdAt: "2026-05-26T08:30:00+00:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "5m" as const,
        strategyName: "Imported SMA + RSI",
        strategyRevision: "rev-imported",
        dataRows: 500,
        dataQuality: { source: "local-cache", isComplete: true, warnings: ["cache replay"], rows: 500 },
        dataSnapshot: {
          rows: 500,
          hash: "hash-imported",
          source: "local-cache",
          isComplete: true,
          warnings: ["cache replay"],
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:30:00+00:00",
          bars: [],
          preparationEvidence: {
            kind: "watchlist_cache_refresh",
            runId: "cache-refresh-imported",
            createdAt: "2026-05-26T08:20:00+00:00",
            market: "ashare",
            symbol: "600000",
            name: "浦发银行",
            timeframe: "5m",
            status: "refreshed",
            requestedLimit: 500,
            upsertedRows: 500,
            quality: { source: "local-cache", isComplete: true, warnings: ["cache replay"], rows: 500 },
            error: null
          }
        },
        metrics: { totalReturnPct: 12.4, maxDrawdownPct: 5.8, winRatePct: 51, profitFactor: 1.6, tradeCount: 18 },
        decisions: [],
        backtestTrades: [],
        backtestEquityCurve: [],
        executionMode: "paper_only",
        strategyConfig: {
          version: 1,
          revision: "rev-imported",
          name: "Imported SMA + RSI",
          market: "ashare" as const,
          symbols: ["600000"],
          timeframe: "5m" as const,
          entryConditions: [{ kind: "rsi_below", params: { window: 14, threshold: 30 } }],
          exitConditions: [{ kind: "close_below_sma", params: { window: 20, threshold: 0 } }],
          risk: { positionPct: 15, stopLossPct: 7, takeProfitPct: 14, maxDrawdownPct: 10 }
        },
        researchNote: {
          market: "ashare" as const,
          symbol: "600000",
          timeframe: "5m" as const,
          body: "Imported package note",
          updatedAt: "2026-05-26T08:25:00+00:00"
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [{ id: "risk-approved", label: "Risk approved", passed: true, reason: "paper approved" }]
      },
      paperExecutions: [
        {
          executionId: "paper-imported",
          runId: "run-imported",
          createdAt: "2026-05-26T08:45:00+00:00",
          mode: "paper_only",
          account: { cash: 80_000, equity: 100_000, positions: { "600000": 1600 } },
          orders: [],
          gates: []
        }
      ],
      portfolioPaperOrderBatches: [
        {
          batchId: "portfolio-paper-batch-imported",
          baseRunId: "run-imported",
          portfolioName: "Imported basket",
          createdAt: "2026-05-26T08:46:00+00:00",
          mode: "portfolio_paper_order_review" as const,
          source: "portfolio_backtest",
          summary: {
            totalOrders: 1,
            totalNotionalValue: 14736,
            statusCounts: { pending_review: 1 },
            riskStatusCounts: { review: 1 }
          },
          orders: [
            {
              timestamp: "2026-05-26T08:46:00+00:00",
              eventType: "portfolio_paper_order" as const,
              orderId: "portfolio-paper-order-imported",
              symbol: "600000",
              sourceRunId: "run-imported",
              side: "buy" as const,
              notionalValue: 14736,
              quantity: 1600,
              status: "pending_review" as const,
              riskStatus: "review" as const,
              reason: "Import should restore this batch."
            }
          ]
        }
      ],
      aiReviewRuns: [
        {
          aiReviewId: "ai-review:run-imported:rev-imported",
          runId: "run-imported",
          createdAt: "2026-05-26T08:50:00+00:00",
          record: {
            recordType: "aiqt.aiReviewRun" as const,
            schemaVersion: 1 as const,
            aiReviewId: "ai-review:run-imported:rev-imported",
            runId: "run-imported",
            createdAt: "2026-05-26T08:50:00+00:00",
            strategyRevision: "rev-imported",
            market: "ashare" as const,
            symbol: "600000",
            timeframe: "5m" as const,
            executionMode: "paper_only",
            status: "ready" as const,
            summary: {
              citationCount: 2,
              roundCount: 5,
              decisionCount: 4,
              parameterScanBound: true,
              liveExecutionBlocked: true
            },
            dossier: { status: "ready" as const, headline: "Imported evidence", summary: "Ready.", citations: [] },
            citations: [],
            rounds: [],
            decisionLog: [],
            boundary: "AI can explain supplied evidence only."
          }
        }
      ],
      auditEvidenceSummary: {
        kind: "aiqt.auditEvidenceSummary",
        schemaVersion: 1,
        runId: "run-imported",
        generatedAt: "2026-06-04T08:05:00+00:00",
        auditQuery: "manual-smoke",
        packageQuery: "manifest:run-imported",
        importDiffQuery: "manifest:run-imported",
        focusQuery: "manifest:run-imported",
        deepLinkStatus: "loaded",
        deepLinkError: null,
        package: { ready: 6, missing: 1, blocked: 1, matched: 1, total: 10 },
        importDiff: { changes: 3, adds: 2, blocked: 0, matched: 1, total: 12 },
        copyText: "AIQT Audit Evidence Summary\nRun: run-imported\nPackage focus: manifest:run-imported"
      },
      auditReport: {
        kind: "aiqt.auditReport",
        schemaVersion: 1,
        runId: "run-imported",
        generatedAt: "2026-06-04T08:05:30+00:00",
        format: "text/markdown",
        fileName: "run-imported-audit-evidence-report.md",
        contentSha256: {
          algorithm: "sha256",
          hash: "e".repeat(64)
        },
        contentMarkdown: "# AIQuant Audit Evidence Report\n",
        signature: {
          status: "verified",
          algorithm: "hmac-sha256",
          eventId: "audit-report-run-imported-import-diff",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          signedAt: "2026-06-04T08:05:40.000Z",
          verifiedAt: "2026-06-04T08:05:50.000Z",
          importVerificationReason: "signature_verified",
          importVerificationSource: "local-core",
          importVerificationStatus: "verified",
          importVerifiedAt: "2026-06-04T08:05:50.000Z",
          chainId: "audit-chain-local",
          value: "a".repeat(64)
        },
        evidenceSummary: {
          kind: "aiqt.auditEvidenceSummary",
          schemaVersion: 1,
          runId: "run-imported",
          generatedAt: "2026-06-04T08:05:00+00:00",
          auditQuery: "manual-smoke",
          packageQuery: "manifest:run-imported",
          importDiffQuery: "manifest:run-imported",
          focusQuery: "manifest:run-imported",
          deepLinkStatus: "loaded",
          deepLinkError: null,
          package: { ready: 6, missing: 1, blocked: 1, matched: 1, total: 10 },
          importDiff: { changes: 3, adds: 2, blocked: 0, matched: 1, total: 12 },
          copyText: "AIQT Audit Evidence Summary\nRun: run-imported\nPackage focus: manifest:run-imported"
        }
      },
      backtestReport: {
        kind: "aiqt.backtestReport",
        schemaVersion: 1,
        runId: "run-imported",
        generatedAt: "2026-06-04T08:06:00+00:00",
        format: "text/markdown",
        fileName: "run-imported-backtest-report.md",
        contentSha256: {
          algorithm: "sha256",
          hash: "f".repeat(64)
        },
        contentMarkdown: "# AIQuant Audited Backtest Report\n",
        market: "ashare",
        symbol: "600000",
        timeframe: "5m",
        strategyRevision: "rev-imported",
        executionMode: "paper_only",
        dataRows: 500,
        runComparisonRows: 3,
        boundary: "historical audited evidence only; no investment advice",
        signature: {
          status: "signed",
          algorithm: "hmac-sha256",
          eventId: "backtest-report-run-imported-import-diff",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          signedAt: "2026-06-04T08:06:20.000Z",
          chainId: "audit-chain-local",
          value: "b".repeat(64)
        }
      }
    } satisfies ResearchRunExportBrowserPackage;

    const rows = buildResearchRunImportDiffRows({ workspace: currentWorkspace, exportPackage });

    expect(rows).toEqual(
      expect.arrayContaining<ResearchRunImportDiffRow>([
        expect.objectContaining({
          id: "run-id",
          status: "replace",
          current: "run-current",
          incoming: "run-imported",
          exportPath: "researchRun.runId"
        }),
        expect.objectContaining({
          id: "timeframe",
          status: "change",
          current: "1d",
          incoming: "5m",
          detail: "Current research context will switch to the package timeframe."
        }),
        expect.objectContaining({
          id: "data-snapshot",
          status: "change",
          current: "240 rows · hash-current",
          incoming: "500 rows · hash-imported",
          tone: "warning"
        }),
        expect.objectContaining({
          id: "preparation-evidence",
          status: "change",
          current: "cache-refresh-current · watchlist_cache_refresh · 600000 1d · tencent complete · 240 rows cached",
          incoming:
            "cache-refresh-imported · watchlist_cache_refresh · 600000 5m · local-cache complete · 500 rows cached",
          exportPath: "researchRun.dataSnapshot.preparationEvidence",
          tone: "warning"
        }),
        expect.objectContaining({
          id: "research-note",
          status: "change",
          current: "Current local research note",
          incoming: "Imported package note",
          exportPath: "researchRun.researchNote"
        }),
        expect.objectContaining({
          id: "ai-review-runs",
          status: "add",
          current: "0 saved",
          incoming: "1 saved / 2 manifest"
        }),
        expect.objectContaining({
          id: "portfolio-paper-orders",
          status: "add",
          incoming: "1 batches / 1 manifest",
          exportPath: "portfolioPaperOrderBatches[]"
        }),
        expect.objectContaining({
          id: "audit-summary",
          status: "add",
          current: "No local package summary",
          incoming: "run-imported · manifest:run-imported",
          detail: "Audit focus carries 1/10 package matches and 0 import diff blockers.",
          exportPath: "auditEvidenceSummary"
        }),
        expect.objectContaining({
          id: "audit-report",
          status: "add",
          current: "No local audit report",
          incoming: "run-imported · sha256 eeeeeeee · run-imported-audit-evidence-report.md · Verified signature",
          detail:
            "Package includes a portable Audit Markdown report bound to this manifest. · Verified signature · Local Audit Key · local-audit-key · hmac-sha256 · Local core import verification: verified · signature_verified",
          exportPath: "auditReport.contentSha256.hash"
        }),
        expect.objectContaining({
          id: "backtest-report",
          status: "add",
          current: "No local backtest report",
          incoming: "run-imported · sha256 ffffffff · 3 comparisons · Signed report hash",
          detail:
            "Package includes a portable Backtest Markdown report bound to this manifest. · Signed report hash · Local Audit Key · local-audit-key · hmac-sha256",
          exportPath: "backtestReport.contentSha256.hash"
        })
      ])
    );
    expect(filterResearchRunImportDiffRows(rows, "hash-imported").map((row) => row.id)).toEqual(["data-snapshot"]);
    expect(filterResearchRunImportDiffRows(rows, "cache-refresh-imported").map((row) => row.id)).toEqual([
      "preparation-evidence"
    ]);
    expect(filterResearchRunImportDiffRows(rows, "researchNote").map((row) => row.id)).toEqual(["research-note"]);
    expect(filterResearchRunImportDiffRows(rows, "portfolioPaperOrderBatches").map((row) => row.id)).toEqual([
      "portfolio-paper-orders"
    ]);
    expect(filterResearchRunImportDiffRows(rows, "auditEvidenceSummary").map((row) => row.id)).toEqual([
      "audit-summary"
    ]);
    expect(filterResearchRunImportDiffRows(rows, "auditReport").map((row) => row.id)).toEqual(["audit-report"]);
    expect(filterResearchRunImportDiffRows(rows, "backtestReport").map((row) => row.id)).toEqual([
      "backtest-report"
    ]);
    expect(filterResearchRunImportDiffRows(rows, "local-audit-key").map((row) => row.id)).toEqual([
      "audit-report",
      "backtest-report"
    ]);
    expect(filterResearchRunImportDiffRows(rows, "local core import verification").map((row) => row.id)).toEqual([
      "audit-report"
    ]);
  });

  test("blocks import diff report rows when package report signatures are unsafe", () => {
    const exportPackage = {
      kind: "aiqt.researchRun.export" as const,
      packageVersion: 1,
      exportedAt: "2026-05-26T09:00:00+00:00",
      integrity: {
        algorithm: "sha256" as const,
        hash: "a".repeat(64)
      },
      manifest: {
        runId: "run-unsafe-signature",
        createdAt: "2026-05-26T08:30:00+00:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "1d" as const,
        strategyRevision: "rev-unsafe-signature",
        dataHash: "hash-safe",
        dataRows: 240,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: {
          bars: 240,
          trades: 0,
          equityPoints: 0,
          decisions: 0,
          aiRisks: 0,
          paperExecutions: 0,
          promotionCandidates: 0,
          researchNotes: 0,
          aiReviewRuns: 0
        }
      },
      researchRun: {
        runId: "run-unsafe-signature",
        createdAt: "2026-05-26T08:30:00+00:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "1d" as const,
        strategyName: "Unsafe signature package",
        strategyRevision: "rev-unsafe-signature",
        dataRows: 240,
        dataSnapshot: {
          rows: 240,
          hash: "hash-safe",
          source: "local-cache",
          isComplete: true,
          warnings: [],
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:30:00+00:00",
          bars: []
        },
        metrics: { totalReturnPct: 1.2, maxDrawdownPct: 2.4, winRatePct: 51, profitFactor: 1.1, tradeCount: 0 },
        decisions: [],
        backtestTrades: [],
        backtestEquityCurve: [],
        executionMode: "paper_only"
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: []
      },
      auditReport: {
        kind: "aiqt.auditReport",
        schemaVersion: 1,
        runId: "run-unsafe-signature",
        generatedAt: "2026-06-04T08:05:30+00:00",
        format: "text/markdown",
        fileName: "run-unsafe-signature-audit-evidence-report.md",
        contentSha256: {
          algorithm: "sha256",
          hash: "c".repeat(64)
        },
        contentMarkdown: "# AIQuant Audit Evidence Report\n",
        signature: {
          status: "revoked",
          algorithm: "hmac-sha256",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          signedAt: "2026-06-04T08:05:40.000Z",
          revokedAt: "2026-06-04T09:05:40.000Z",
          revokedReason: "operator revoked this report",
          chainId: "audit-chain-local",
          value: "c".repeat(64)
        },
        evidenceSummary: {
          kind: "aiqt.auditEvidenceSummary",
          schemaVersion: 1,
          runId: "run-unsafe-signature",
          generatedAt: "2026-06-04T08:05:00+00:00",
          auditQuery: "",
          packageQuery: "manifest:run-unsafe-signature",
          importDiffQuery: "manifest:run-unsafe-signature",
          focusQuery: "manifest:run-unsafe-signature",
          deepLinkStatus: "loaded",
          deepLinkError: null,
          package: { ready: 1, missing: 0, blocked: 0, matched: 1, total: 1 },
          importDiff: { changes: 0, adds: 0, blocked: 0, matched: 1, total: 1 },
          copyText: "Run: run-unsafe-signature"
        }
      },
      backtestReport: {
        kind: "aiqt.backtestReport",
        schemaVersion: 1,
        runId: "run-unsafe-signature",
        generatedAt: "2026-06-04T08:06:00+00:00",
        format: "text/markdown",
        fileName: "run-unsafe-signature-backtest-report.md",
        contentSha256: {
          algorithm: "sha256",
          hash: "d".repeat(64)
        },
        contentMarkdown: "# AIQuant Audited Backtest Report\n",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-unsafe-signature",
        executionMode: "paper_only",
        dataRows: 240,
        runComparisonRows: 1,
        boundary: "historical audited evidence only; no investment advice",
        signature: {
          status: "invalid",
          algorithm: "hmac-sha256",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          invalidReason: "content hash mismatch",
          chainId: "audit-chain-local",
          value: "d".repeat(64)
        }
      }
    } satisfies ResearchRunExportBrowserPackage;

    const rows = buildResearchRunImportDiffRows({ workspace: buildTerminalWorkspace(), exportPackage });

    expect(rows).toEqual(
      expect.arrayContaining<ResearchRunImportDiffRow>([
        expect.objectContaining({
          id: "audit-report",
          status: "blocked",
          incoming: "run-unsafe-signature · sha256 cccccccc · run-unsafe-signature-audit-evidence-report.md · Revoked signature",
          detail:
            "Audit report signature is revoked or invalid and cannot be trusted for import. · Revoked signature · Local Audit Key · local-audit-key · hmac-sha256",
          tone: "risk"
        }),
        expect.objectContaining({
          id: "backtest-report",
          status: "blocked",
          incoming: "run-unsafe-signature · sha256 dddddddd · 1 comparisons · Signature chain blocked",
          detail:
            "Backtest report signature is revoked or invalid and cannot be trusted for import. · Signature chain blocked · Local Audit Key · local-audit-key · hmac-sha256",
          tone: "risk"
        })
      ])
    );
    expect(filterResearchRunImportDiffRows(rows, "revoked signature").map((row) => row.id)).toEqual([
      "audit-report"
    ]);
    expect(filterResearchRunImportDiffRows(rows, "signature chain blocked").map((row) => row.id)).toEqual([
      "backtest-report"
    ]);

    const incompleteSignaturePackage = {
      ...exportPackage,
      auditReport: {
        ...exportPackage.auditReport,
        signature: {
          status: "signed",
          algorithm: "hmac-sha256",
          keyId: "local-audit-key"
        }
      }
    } satisfies ResearchRunExportBrowserPackage;
    const incompleteRows = buildResearchRunImportDiffRows({
      workspace: buildTerminalWorkspace(),
      exportPackage: incompleteSignaturePackage
    });

    expect(incompleteRows).toEqual(
      expect.arrayContaining<ResearchRunImportDiffRow>([
        expect.objectContaining({
          id: "audit-report",
          status: "blocked",
          detail:
            "Audit report signature metadata is incomplete and cannot be trusted for import. · Signed report hash · local-audit-key · hmac-sha256"
        })
      ])
    );
  });

  test("blocks import diff audit reports that carry invalid imported evidence", () => {
    const exportPackage = {
      kind: "aiqt.researchRun.export" as const,
      packageVersion: 1,
      exportedAt: "2026-05-26T09:00:00+00:00",
      integrity: {
        algorithm: "sha256" as const,
        hash: "a".repeat(64)
      },
      manifest: {
        runId: "run-invalid-import-evidence",
        createdAt: "2026-05-26T08:30:00+00:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "1d" as const,
        strategyRevision: "rev-invalid-import-evidence",
        dataHash: "hash-safe",
        dataRows: 240,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: {
          bars: 240,
          trades: 0,
          equityPoints: 0,
          decisions: 0,
          aiRisks: 0,
          paperExecutions: 0,
          promotionCandidates: 0,
          researchNotes: 0,
          aiReviewRuns: 0
        }
      },
      researchRun: {
        runId: "run-invalid-import-evidence",
        createdAt: "2026-05-26T08:30:00+00:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "1d" as const,
        strategyName: "Invalid imported evidence package",
        strategyRevision: "rev-invalid-import-evidence",
        dataRows: 240,
        dataSnapshot: {
          rows: 240,
          hash: "hash-safe",
          source: "local-cache",
          isComplete: true,
          warnings: [],
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:30:00+00:00",
          bars: []
        },
        metrics: { totalReturnPct: 1.2, maxDrawdownPct: 2.4, winRatePct: 51, profitFactor: 1.1, tradeCount: 0 },
        decisions: [],
        backtestTrades: [],
        backtestEquityCurve: [],
        executionMode: "paper_only"
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: []
      },
      auditReport: {
        kind: "aiqt.auditReport",
        schemaVersion: 1,
        runId: "run-invalid-import-evidence",
        generatedAt: "2026-06-04T08:05:30+00:00",
        format: "text/markdown",
        fileName: "run-invalid-import-evidence-audit-evidence-report.md",
        contentSha256: {
          algorithm: "sha256",
          hash: "c".repeat(64)
        },
        contentMarkdown: "# AIQuant Audit Evidence Report\n",
        signature: {
          status: "verified",
          algorithm: "hmac-sha256",
          eventId: "audit-report-run-invalid-import-evidence",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          signedAt: "2026-06-04T08:05:40.000Z",
          verifiedAt: "2026-06-04T08:05:50.000Z",
          chainId: "audit-chain-local",
          value: "c".repeat(64)
        },
        evidenceSummary: {
          kind: "aiqt.auditEvidenceSummary",
          schemaVersion: 1,
          runId: "run-invalid-import-evidence",
          generatedAt: "2026-06-04T08:05:00+00:00",
          auditQuery: "",
          packageQuery: "manifest:run-invalid-import-evidence",
          importDiffQuery: "manifest:run-invalid-import-evidence",
          focusQuery: "manifest:run-invalid-import-evidence",
          deepLinkStatus: "loaded",
          deepLinkError: null,
          package: { ready: 1, missing: 0, blocked: 0, matched: 1, total: 1 },
          importDiff: { changes: 0, adds: 0, blocked: 0, matched: 1, total: 1 },
          importVerification: {
            verified: 0,
            invalid: 1,
            buckets: [
              {
                count: 1,
                latestExportPath: "auditReport.contentSha256.hash",
                latestReason: "signature_mismatch",
                source: "local-core",
                status: "invalid"
              }
            ]
          },
          copyText: "Run: run-invalid-import-evidence"
        }
      }
    } satisfies ResearchRunExportBrowserPackage;

    const rows = buildResearchRunImportDiffRows({ workspace: buildTerminalWorkspace(), exportPackage });

    expect(rows).toEqual(
      expect.arrayContaining<ResearchRunImportDiffRow>([
        expect.objectContaining({
          id: "audit-report",
          status: "blocked",
          incoming:
            "run-invalid-import-evidence · sha256 cccccccc · run-invalid-import-evidence-audit-evidence-report.md · Verified signature",
          detail:
            "Audit report carries invalid imported evidence and cannot be trusted for import. · Verified signature · Local Audit Key · local-audit-key · hmac-sha256",
          tone: "risk"
        })
      ])
    );
    expect(filterResearchRunImportDiffRows(rows, "invalid imported evidence").map((row) => row.id)).toEqual([
      "audit-report"
    ]);
  });

  test("blocks import diff rows when package integrity or artifact counts are unsafe", () => {
    const exportPackage = {
      kind: "aiqt.researchRun.export" as const,
      packageVersion: 1,
      exportedAt: "2026-05-26T09:00:00+00:00",
      integrity: {
        algorithm: "sha256" as const,
        hash: "not-a-sha256"
      },
      manifest: {
        runId: "run-unsafe-import",
        createdAt: "2026-05-26T08:30:00+00:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "1d" as const,
        strategyRevision: "rev-unsafe",
        dataHash: "hash-unsafe",
        dataRows: 500,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: {
          bars: 500,
          trades: 3,
          equityPoints: 500,
          decisions: 4,
          aiRisks: 1,
          paperExecutions: 2,
          portfolioPaperOrderBatches: 2,
          portfolioPaperOrderApprovals: 2,
          portfolioPaperOrderSimulations: 2,
          promotionCandidates: 1,
          researchNotes: 1,
          aiReviewRuns: 3
        }
      },
      researchRun: {
        runId: "run-unsafe-import",
        createdAt: "2026-05-26T08:30:00+00:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "1d" as const,
        strategyName: "Unsafe package",
        strategyRevision: "rev-unsafe",
        dataRows: 500,
        dataSnapshot: {
          rows: 500,
          hash: "hash-unsafe",
          source: "local-cache",
          isComplete: true,
          warnings: [],
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:30:00+00:00",
          bars: []
        },
        metrics: { totalReturnPct: 1.2, maxDrawdownPct: 2.4, winRatePct: 51, profitFactor: 1.1, tradeCount: 3 },
        decisions: [],
        backtestTrades: [],
        backtestEquityCurve: [],
        executionMode: "paper_only"
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: []
      },
      paperExecutions: [],
      portfolioPaperOrderBatches: [],
      promotionCandidate: null,
      aiReviewRuns: []
    };

    const rows = buildResearchRunImportDiffRows({ workspace: buildTerminalWorkspace(), exportPackage });
    const integrityRow = rows.find((row) => String(row.id) === "package-integrity");
    const artifactRow = rows.find((row) => String(row.id) === "artifact-counts");

    expect(integrityRow).toEqual(
      expect.objectContaining({
        status: "blocked",
        current: "Local verification required",
        incoming: "sha256 · invalid",
        exportPath: "integrity.hash",
        tone: "risk"
      })
    );
    expect(artifactRow).toEqual(
      expect.objectContaining({
        status: "blocked",
        exportPath: "manifest.artifactCounts",
        tone: "risk"
      })
    );
    expect(artifactRow?.detail).toContain("paperExecutions 2/0");
    expect(artifactRow?.detail).toContain("portfolioPaperOrderBatches 2/0");
    expect(artifactRow?.detail).toContain("portfolioPaperOrderApprovals 2/0");
    expect(artifactRow?.detail).toContain("portfolioPaperOrderSimulations 2/0");
    expect(artifactRow?.detail).toContain("promotionCandidates 1/0");
    expect(artifactRow?.detail).toContain("aiReviewRuns 3/0");
    expect(filterResearchRunImportDiffRows(rows, "invalid").map((row) => row.id)).toEqual(["package-integrity"]);
  });

  test("builds a searchable audit ledger for research run import attempts", () => {
    const exportPackage: ResearchRunExportBrowserPackage = {
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-05-26T09:00:00+00:00",
      integrity: {
        algorithm: "sha256",
        hash: "b".repeat(64)
      },
      manifest: {
        runId: "run-import-ledger",
        createdAt: "2026-05-26T08:30:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-import-ledger",
        dataHash: "hash-ledger",
        dataRows: 500,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: {
          bars: 500,
          trades: 3,
          equityPoints: 500,
          decisions: 4,
          aiRisks: 1,
          paperExecutions: 0,
          promotionCandidates: 0,
          researchNotes: 1,
          aiReviewRuns: 0
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: []
      },
      researchRun: undefined,
      paperExecutions: [],
      promotionCandidate: null,
      aiReviewRuns: []
    };
    const rows: ResearchRunImportDiffRow[] = [
      {
        id: "package-integrity",
        label: "Package integrity",
        status: "blocked",
        current: "Local verification required",
        incoming: "sha256 · invalid",
        detail: "Import must stop until the package has valid canonical SHA-256 metadata.",
        exportPath: "integrity.hash",
        tone: "risk"
      },
      {
        id: "run-id",
        label: "Research run",
        status: "replace",
        current: "run-current",
        incoming: "run-import-ledger",
        detail: "Import will replace the current replay context with the package run.",
        exportPath: "researchRun.runId",
        tone: "warning"
      },
      {
        id: "audit-report",
        label: "Audit report",
        status: "blocked",
        current: "No local audit report",
        incoming: "run-import-ledger · sha256 aaaaaaaa · Revoked signature",
        detail:
          "Audit report signature is revoked or invalid and cannot be trusted for import. · Revoked signature · Local Audit Key · local-audit-key · hmac-sha256",
        exportPath: "auditReport.contentSha256.hash",
        tone: "risk"
      },
      {
        id: "backtest-report",
        label: "Backtest report",
        status: "blocked",
        current: "No local backtest report",
        incoming: "run-import-ledger · sha256 bbbbbbbb · Signature chain blocked",
        detail:
          "Backtest report signature is revoked or invalid and cannot be trusted for import. · Signature chain blocked · Local Audit Key · local-audit-key · hmac-sha256",
        exportPath: "backtestReport.contentSha256.hash",
        tone: "risk"
      }
    ];

    const blockedPreview = buildResearchRunImportAuditEvent({
      createdAt: "2026-05-26T09:10:00+00:00",
      exportPackage,
      fileName: "unsafe-import.json",
      rows,
      stage: "preview"
    });
    const confirmedRows: ResearchRunImportDiffRow[] = [
      rows[1] as ResearchRunImportDiffRow,
      {
        id: "audit-report",
        label: "Audit report",
        status: "add",
        current: "No local audit report",
        incoming: "run-import-ledger · sha256 cccccccc · Verified signature",
        detail:
          "Package includes a portable Audit Markdown report bound to this manifest. · Verified signature · Local Audit Key · local-audit-key · hmac-sha256 · Local core import verification: verified · signature_verified",
        exportPath: "auditReport.contentSha256.hash",
        tone: "ai"
      }
    ];
    const confirmed = buildResearchRunImportAuditEvent({
      createdAt: "2026-05-26T09:12:00+00:00",
      exportPackage,
      fileName: "unsafe-import.json",
      previousRunId: "run-current",
      rows: confirmedRows,
      stage: "confirmed",
      undoToken: "import-undo-ledger"
    });
    const failed = buildResearchRunImportAuditEvent({
      createdAt: "2026-05-26T09:13:00+00:00",
      error: "Invalid research run export contract",
      exportPackage: null,
      fileName: "broken.json",
      rows: [],
      stage: "failed"
    });
    const undone = buildResearchRunImportUndoAuditEvent({
      createdAt: "2026-05-26T09:14:00+00:00",
      event: confirmed
    });
    const undoFailed = buildResearchRunImportUndoFailureAuditEvent({
      createdAt: "2026-05-26T09:15:00+00:00",
      error: "research_run_import_undo_run_mismatch",
      event: confirmed
    });
    const undoConfirmation = buildResearchRunImportUndoConfirmation(confirmed);

    expect(blockedPreview).toEqual(
      expect.objectContaining({
        stage: "blocked",
        runId: "run-import-ledger",
        fileName: "unsafe-import.json",
        summary: "Import preview blocked",
        blockedCount: 3,
        changeCount: 1,
        exportPath: "manifest:run-import-ledger",
        tone: "risk"
      })
    );
    expect(blockedPreview.detail).toContain("3 blocked");
    expect(blockedPreview.detail).toContain("1 change");
    expect(blockedPreview.blockedRows).toEqual([
      {
        id: "package-integrity",
        label: "Package integrity",
        detail: "Import must stop until the package has valid canonical SHA-256 metadata.",
        exportPath: "integrity.hash",
        incoming: "sha256 · invalid"
      },
      {
        id: "audit-report",
        label: "Audit report",
        detail:
          "Audit report signature is revoked or invalid and cannot be trusted for import. · Revoked signature · Local Audit Key · local-audit-key · hmac-sha256",
        exportPath: "auditReport.contentSha256.hash",
        incoming: "run-import-ledger · sha256 aaaaaaaa · Revoked signature"
      },
      {
        id: "backtest-report",
        label: "Backtest report",
        detail:
          "Backtest report signature is revoked or invalid and cannot be trusted for import. · Signature chain blocked · Local Audit Key · local-audit-key · hmac-sha256",
        exportPath: "backtestReport.contentSha256.hash",
        incoming: "run-import-ledger · sha256 bbbbbbbb · Signature chain blocked"
      }
    ]);
    expect(confirmed).toEqual(
      expect.objectContaining({
        stage: "confirmed",
        summary: "Import applied",
        blockedCount: 0,
        changeCount: 2,
        rollbackTargetRunId: "run-current",
        undoToken: "import-undo-ledger",
        recoveryHint: "Undo import import-undo-ledger to restore the audited stores.",
        tone: "positive"
      })
    );
    expect(confirmed.verifiedReportSignatures).toEqual([
      {
        id: "audit-report",
        label: "Audit report",
        detail: "Local core import verification: verified · signature_verified",
        exportPath: "auditReport.contentSha256.hash",
        incoming: "run-import-ledger · sha256 cccccccc · Verified signature",
        reason: "signature_verified",
        source: "local-core",
        status: "verified"
      }
    ]);
    expect(failed).toEqual(
      expect.objectContaining({
        stage: "failed",
        runId: "unknown",
        fileName: "broken.json",
        detail: "Schema contract invalid: Invalid research run export contract",
        failureCategory: "schema",
        recoveryHint: "Choose a valid aiqt.researchRun.export package or a wrapped { export } payload.",
        rollbackTargetRunId: null,
        exportPath: "import:file:broken.json",
        tone: "risk"
      })
    );
    expect(undone).toEqual(
      expect.objectContaining({
        stage: "undone",
        summary: "Import undone",
        detail: "Research run import undo restored the previous audited stores.",
        rollbackTargetRunId: "run-current",
        undoToken: null,
        recoveryHint: "Import undo has already consumed import-undo-ledger.",
        exportPath: "manifest:run-import-ledger",
        tone: "warning"
      })
    );
    expect(undoFailed).toEqual(
      expect.objectContaining({
        stage: "undo-failed",
        summary: "Import undo failed",
        detail: "Core import rejected the package: research_run_import_undo_run_mismatch",
        failureCategory: "core",
        rollbackTargetRunId: "run-current",
        undoToken: "import-undo-ledger",
        recoveryHint:
          "Review the undo rejection detail, replay the previous audited run if needed, then retry with the matching import event.",
        exportPath: "manifest:run-import-ledger",
        tone: "risk"
      })
    );
    expect(undoConfirmation).toEqual({
      undoToken: "import-undo-ledger",
      runId: "run-import-ledger",
      fileName: "unsafe-import.json",
      message: "Confirm import undo",
      detail: "Undo import import-undo-ledger will restore previous audited stores and cannot be repeated."
    });
    expect(buildResearchRunImportUndoConfirmation(blockedPreview)).toBeNull();
    expect(buildResearchRunImportUndoConfirmation(undone)).toBeNull();
    expect(buildResearchRunImportUndoConfirmation(undoFailed)).toBeNull();

    const merged = mergeResearchRunImportAuditEvents([blockedPreview], confirmed);
    expect(merged.map((event) => event.stage)).toEqual(["confirmed", "blocked"]);
    expect(mergeResearchRunImportAuditEvents(merged, undone).map((event) => event.stage)).toEqual([
      "undone",
      "blocked"
    ]);
    expect(mergeResearchRunImportAuditEvents(merged, undoFailed).map((event) => event.stage)).toEqual([
      "undo-failed",
      "confirmed",
      "blocked"
    ]);
    expect(mergeResearchRunImportAuditEvents(merged, blockedPreview).map((event) => event.id)).toEqual([
      blockedPreview.id,
      confirmed.id
    ]);
    expect(filterResearchRunImportAuditEvents([blockedPreview, confirmed, failed, undone], "contract").map((event) => event.id)).toEqual([
      failed.id
    ]);
    expect(filterResearchRunImportAuditEvents([blockedPreview, confirmed, failed, undone], "rollback").map((event) => event.id)).toEqual([
      confirmed.id
    ]);
    expect(filterResearchRunImportAuditEvents([blockedPreview, confirmed, failed, undone, undoFailed], "undo").map((event) => event.stage)).toEqual([
      "confirmed",
      "undone",
      "undo-failed"
    ]);
    expect(filterResearchRunImportAuditEvents([blockedPreview, confirmed, failed, undone, undoFailed], "mismatch").map((event) => event.stage)).toEqual([
      "undo-failed"
    ]);
    expect(filterResearchRunImportAuditEvents([blockedPreview, confirmed, failed, undone], "consumed").map((event) => event.stage)).toEqual([
      "undone"
    ]);
    expect(filterResearchRunImportAuditEvents([blockedPreview, confirmed, failed, undone], "unsafe-import").map((event) => event.stage)).toEqual([
      "blocked",
      "confirmed",
      "undone"
    ]);
    expect(filterResearchRunImportAuditEvents([blockedPreview, confirmed, failed, undone], "local core import verification").map((event) => event.stage)).toEqual([
      "confirmed"
    ]);

    const allAuditEvents = [blockedPreview, confirmed, failed, undone, undoFailed];
    const aggregation = buildResearchRunImportAuditAggregation(allAuditEvents);
    expect(aggregation).toEqual(
      expect.objectContaining({
        total: 5,
        blocked: 1,
        confirmed: 1,
        failed: 1,
        undone: 1,
        undoFailed: 1,
        needsReview: 3,
        undoable: 1,
        recoverable: 4
      })
    );
    expect(aggregation.failureBuckets.map((bucket) => `${bucket.category}:${bucket.count}:${bucket.latestRunId}`)).toEqual([
      "blocked:1:run-import-ledger",
      "schema:1:unknown",
      "core:1:run-import-ledger"
    ]);
    expect(aggregation.failureBuckets.at(-1)).toEqual(
      expect.objectContaining({
        category: "core",
        label: "Core rejection",
        stageCounts: {
          "undo-failed": 1
        },
        latestFileName: "unsafe-import.json",
        recoveryHint:
          "Review the undo rejection detail, replay the previous audited run if needed, then retry with the matching import event.",
        tone: "risk"
      })
    );
    expect(
      aggregation.blockedEvidenceBuckets.map(
        (bucket) => `${bucket.category}:${bucket.count}:${bucket.latestRunId}:${bucket.rowIds.join(",")}`
      )
    ).toEqual([
      "report-signature:2:run-import-ledger:audit-report,backtest-report",
      "package-integrity:1:run-import-ledger:package-integrity"
    ]);
    expect(aggregation.blockedEvidenceBuckets.at(0)).toEqual(
      expect.objectContaining({
        category: "report-signature",
        label: "Report signature",
        latestDetail:
          "Backtest report signature is revoked or invalid and cannot be trusted for import. · Signature chain blocked · Local Audit Key · local-audit-key · hmac-sha256",
        latestExportPath: "backtestReport.contentSha256.hash",
        latestFileName: "unsafe-import.json",
        tone: "risk"
      })
    );
    expect(
      aggregation.verifiedReportSignatureBuckets.map(
        (bucket) =>
          `${bucket.status}:${bucket.count}:${bucket.latestRunId}:${bucket.rowIds.join(",")}:${bucket.latestReason}:${bucket.source}`
      )
    ).toEqual(["verified:1:run-import-ledger:audit-report:signature_verified:local-core"]);
    expect(aggregation.verifiedReportSignatureBuckets.at(0)).toEqual(
      expect.objectContaining({
        status: "verified",
        label: "Local core verified",
        latestDetail: "Local core import verification: verified · signature_verified",
        latestExportPath: "auditReport.contentSha256.hash",
        latestFileName: "unsafe-import.json",
        latestReason: "signature_verified",
        source: "local-core",
        tone: "positive"
      })
    );
    expect(filterResearchRunImportAuditEvents(allAuditEvents, "", "needs-review").map((event) => event.stage)).toEqual([
      "blocked",
      "failed",
      "undo-failed"
    ]);
    expect(filterResearchRunImportAuditEvents(allAuditEvents, "", "undoable").map((event) => event.id)).toEqual([
      confirmed.id
    ]);
    expect(filterResearchRunImportAuditEvents(allAuditEvents, "schema", "needs-review").map((event) => event.id)).toEqual([
      failed.id
    ]);
    expect(filterResearchRunImportAuditEvents(allAuditEvents, "signature chain blocked").map((event) => event.id)).toEqual([
      blockedPreview.id
    ]);
  });

  test("groups invalid imported evidence blockers separately from signature chain blockers", () => {
    const invalidEvidenceBlockedEvent: ResearchRunImportAuditEvent = {
      id: "import:run-invalid-import-evidence:blocked:2026-06-04T09:00:00.000Z:invalid-evidence.json",
      stage: "blocked",
      runId: "run-invalid-import-evidence",
      previousRunId: "run-current",
      rollbackTargetRunId: "run-current",
      undoToken: null,
      fileName: "invalid-evidence.json",
      createdAt: "2026-06-04T09:00:00.000Z",
      summary: "Import blocked",
      detail: "Research run import blocked by invalid imported evidence.",
      failureCategory: null,
      recoveryHint: "Review the blocked audit report evidence, then re-export after fixing imported signatures.",
      blockedCount: 1,
      blockedRows: [
        {
          id: "audit-report",
          label: "Audit report",
          incoming:
            "run-invalid-import-evidence · sha256 cccccccc · run-invalid-import-evidence-audit-evidence-report.md · Verified signature",
          detail:
            "Audit report carries invalid imported evidence and cannot be trusted for import. · Verified signature · Local Audit Key · local-audit-key · hmac-sha256",
          exportPath: "auditReport.contentSha256.hash"
        }
      ],
      changeCount: 0,
      exportPath: "manifest:run-invalid-import-evidence",
      tone: "risk",
      verifiedReportSignatures: []
    };

    const aggregation = buildResearchRunImportAuditAggregation([invalidEvidenceBlockedEvent]);

    expect(
      aggregation.blockedEvidenceBuckets.map(
        (bucket) => `${bucket.category}:${bucket.count}:${bucket.latestRunId}:${bucket.rowIds.join(",")}`
      )
    ).toEqual(["import-verification:1:run-invalid-import-evidence:audit-report"]);
    expect(aggregation.blockedEvidenceBuckets.at(0)).toEqual(
      expect.objectContaining({
        category: "import-verification",
        label: "Import verification",
        latestDetail:
          "Audit report carries invalid imported evidence and cannot be trusted for import. · Verified signature · Local Audit Key · local-audit-key · hmac-sha256",
        latestExportPath: "auditReport.contentSha256.hash",
        latestFileName: "invalid-evidence.json",
        tone: "risk"
      })
    );
  });

  test("builds a copyable audit evidence summary from ledger, package, and diff focus", () => {
    const packageRows: ResearchRunExportBrowserRow[] = [
      {
        id: "package",
        label: "Package",
        status: "ready",
        value: "run-a1f3a5369574",
        detail: "Manifest loaded",
        exportPath: "manifest:run-a1f3a5369574",
        tone: "positive"
      },
      {
        id: "integrity",
        label: "Integrity",
        status: "blocked",
        value: "sha256 missing",
        detail: "Missing canonical hash",
        exportPath: "integrity.hash",
        tone: "risk"
      }
    ];
    const diffRows: ResearchRunImportDiffRow[] = [
      {
        id: "data-snapshot",
        label: "Data snapshot",
        status: "change",
        current: "hash-current",
        incoming: "hash-imported",
        detail: "Import will replay the package data hash.",
        exportPath: "researchRun.dataHash",
        tone: "warning"
      },
      {
        id: "live-boundary",
        label: "Live boundary",
        status: "blocked",
        current: "paper",
        incoming: "live",
        detail: "Live handoff is blocked.",
        exportPath: "executionHandoff.liveTradingAllowed",
        tone: "risk"
      }
    ];

    const summary = buildAuditEvidenceSummary({
      auditQuery: "manual-smoke",
      deepLinkError: null,
      deepLinkRunId: "run-a1f3a5369574",
      deepLinkStatus: "loaded",
      importDiffQuery: "hash-imported",
      importDiffRows: diffRows,
      importAuditEvents: [
        {
          id: "import:run-a1f3a5369574:confirmed:2026-06-04T07:59:00.000Z:verified-import.json",
          stage: "confirmed",
          runId: "run-a1f3a5369574",
          previousRunId: "run-previous",
          rollbackTargetRunId: "run-previous",
          undoToken: "import-undo-summary",
          fileName: "verified-import.json",
          createdAt: "2026-06-04T07:59:00.000Z",
          summary: "Import applied",
          detail: "Research run import applied with 1 replay changes.",
          failureCategory: null,
          recoveryHint: "Undo import import-undo-summary to restore the audited stores.",
          blockedCount: 0,
          blockedRows: [],
          changeCount: 1,
          exportPath: "manifest:run-a1f3a5369574",
          tone: "positive",
          verifiedReportSignatures: [
            {
              id: "audit-report",
              label: "Audit report",
              detail: "Local core import verification: verified · signature_verified",
              exportPath: "auditReport.contentSha256.hash",
              incoming: "run-a1f3a5369574 · sha256 cccccccc · Verified signature",
              reason: "signature_verified",
              source: "local-core",
              status: "verified"
            }
          ]
        },
        {
          id: "import:run-a1f3a5369574:blocked:2026-06-04T08:02:00.000Z:invalid-evidence.json",
          stage: "blocked",
          runId: "run-a1f3a5369574",
          previousRunId: "run-previous",
          rollbackTargetRunId: "run-previous",
          undoToken: null,
          fileName: "invalid-evidence.json",
          createdAt: "2026-06-04T08:02:00.000Z",
          summary: "Import blocked",
          detail: "Research run import blocked by invalid imported evidence.",
          failureCategory: null,
          recoveryHint: "Fix the imported report evidence and export again.",
          blockedCount: 1,
          blockedRows: [
            {
              id: "audit-report",
              label: "Audit report",
              incoming: "run-a1f3a5369574 · sha256 cccccccc · Verified signature",
              detail:
                "Audit report carries invalid imported evidence and cannot be trusted for import. · Verified signature · Local Audit Key",
              exportPath: "auditReport.contentSha256.hash"
            }
          ],
          changeCount: 0,
          exportPath: "manifest:run-a1f3a5369574",
          tone: "risk",
          verifiedReportSignatures: []
        }
      ],
      packageQuery: "manifest:run-a1f3a5369574",
      packageRows
    });

    expect(summary).toMatchObject({
      auditQuery: "manual-smoke",
      deepLinkStatus: "loaded",
      importDiffBlockedCount: 1,
      importDiffChangeCount: 1,
      importDiffMatchedCount: 1,
      importVerificationInvalidCount: 0,
      importVerificationVerifiedCount: 1,
      importPolicyBlockedCount: 1,
      packageBlockedCount: 1,
      packageMatchedCount: 1,
      runId: "run-a1f3a5369574"
    });
    expect(summary.importPolicyBlockerBuckets).toEqual([
      expect.objectContaining({
        category: "import-verification",
        count: 1,
        label: "Import verification",
        latestExportPath: "auditReport.contentSha256.hash",
        latestRunId: "run-a1f3a5369574",
        tone: "risk"
      })
    ]);
    expect(summary.importVerificationBuckets).toEqual([
      expect.objectContaining({
        status: "verified",
        count: 1,
        latestExportPath: "auditReport.contentSha256.hash",
        latestReason: "signature_verified",
        source: "local-core"
      })
    ]);
    expect(summary.copyText).toContain("AIQT Audit Evidence Summary");
    expect(summary.copyText).toContain("Run: run-a1f3a5369574");
    expect(summary.copyText).toContain("Audit query: manual-smoke");
    expect(summary.copyText).toContain("Package checks: 1 ready / 0 missing / 1 blocked / 1 of 2 matched");
    expect(summary.copyText).toContain("Import diff: 1 changes / 0 adds / 1 blocked / 1 of 2 matched");
    expect(summary.copyText).toContain(
      "Import report verification: 1 verified / 0 invalid / latest verified auditReport.contentSha256.hash · signature_verified"
    );
    expect(summary.copyText).toContain(
      "Import policy blockers: 1 blocked / latest Import verification auditReport.contentSha256.hash · Audit report carries invalid imported evidence"
    );

    const reportMarkdown = buildAuditEvidenceReportMarkdown(summary, {
      generatedAt: "2026-06-04T08:00:00.000Z"
    });

    expect(reportMarkdown).toContain("# AIQuant Audit Evidence Report");
    expect(reportMarkdown).toContain("Generated at: `2026-06-04T08:00:00.000Z`");
    expect(reportMarkdown).toContain("Run ID: `run-a1f3a5369574`");
    expect(reportMarkdown).toContain("| Package checks | 1 ready | 0 missing | 1 blocked | 1 / 2 |");
    expect(reportMarkdown).toContain("| Import diff | 1 changes | 0 adds | 1 blocked | 1 / 2 |");
    expect(reportMarkdown).toContain("## Import Report Verification");
    expect(reportMarkdown).toContain("| verified | 1 | local-core | auditReport.contentSha256.hash | signature_verified |");
    expect(reportMarkdown).toContain("## Import Policy Blockers");
    expect(reportMarkdown).toContain(
      "| Import verification | 1 | run-a1f3a5369574 | auditReport.contentSha256.hash | Audit report carries invalid imported evidence"
    );
    expect(reportMarkdown).toContain("Deep link status: `loaded`");
    expect(reportMarkdown).toContain("```text\nAIQT Audit Evidence Summary");
    expect(reportMarkdown).toContain("Import report verification: 1 verified / 0 invalid / latest verified auditReport.contentSha256.hash · signature_verified\n```");
  });

  test("builds an audit report ledger from persisted report events", () => {
    const reportHash = "a".repeat(64);
    const reportEvents = [
      {
        schemaVersion: 1,
        eventId: "audit-report-run-a1-audit",
        eventType: "audit_evidence_report",
        runId: "run-a1f3a5369574",
        createdAt: "2026-06-04T08:00:00.000Z",
        stage: "generated",
        source: "web",
        summary: "Audit evidence report generated for run-a1f3a5369574",
        detail: "run-a1f3a5369574-audit-evidence-report.md · sha256 aaaaaaaaaaaa · focus manifest:run-a1f3a5369574",
        metadata: {
          artifactKind: "aiqt.auditReport",
          contentSha256: reportHash,
          contentSha256Algorithm: "sha256",
          deepLinkStatus: "loaded",
          evidenceFocus: "manifest:run-a1f3a5369574",
          fileName: "run-a1f3a5369574-audit-evidence-report.md",
          format: "text/markdown",
          importDiffBlocked: 1,
          importDiffTotal: 11,
          importVerificationInvalid: 0,
          importVerificationLatestExportPath: "auditReport.contentSha256.hash",
          importVerificationLatestReason: "signature_verified",
          importVerificationLatestSource: "local-core",
          importVerificationLatestStatus: "verified",
          importVerificationVerified: 1,
          packageMatched: 3,
          packageTotal: 9
        }
      },
      {
        schemaVersion: 1,
        eventId: "audit-report-run-b-bad",
        eventType: "audit_evidence_report",
        runId: "run-bad",
        createdAt: "2026-06-04T08:05:00.000Z",
        stage: "generated",
        source: "web",
        summary: "Audit evidence report generated for run-bad",
        detail: "bad report",
        metadata: {
          contentSha256: "bad",
          fileName: "bad-audit-evidence-report.md"
        }
      },
      {
        schemaVersion: 1,
        eventId: "audit-import-run",
        eventType: "research_run_import",
        runId: "run-import",
        createdAt: "2026-06-04T08:10:00.000Z",
        stage: "confirmed",
        source: "web",
        summary: "Import applied",
        detail: "Ignored by report ledger",
        metadata: {}
      }
    ];

    const rows = buildAuditEvidenceReportLedgerRows(reportEvents);
    const summary = buildAuditEvidenceReportLedgerSummary(rows);

    expect(rows.map((row) => `${row.id}:${row.status}:${row.shortHash}:${row.signatureStatus}`)).toEqual([
      "audit-report-run-a1-audit:ready:aaaaaaaaaaaa:unsigned",
      "audit-report-run-b-bad:invalid:bad:invalid"
    ]);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        contentSha256: reportHash,
        deepLinkStatus: "loaded",
        fileName: "run-a1f3a5369574-audit-evidence-report.md",
        focusQuery: "manifest:run-a1f3a5369574",
        importDiffBlocked: 1,
        importVerificationDetail: "Import report verification: 1 verified / 0 invalid · latest verified auditReport.contentSha256.hash · signature_verified · local-core",
        importVerificationInvalid: 0,
        importVerificationVerified: 1,
        packageMatched: 3,
        runId: "run-a1f3a5369574",
        signatureLabel: "Unsigned report hash",
        statusLabel: "Report hash recorded",
        tone: "ai"
      })
    );
    expect(summary).toEqual({
      attention: 1,
      chainStatus: "attention",
      invalid: 1,
      importVerificationInvalid: 0,
      importVerificationVerified: 1,
      latestHash: reportHash,
      ready: 1,
      revoked: 0,
      signed: 0,
      total: 2,
      unsigned: 1,
      verified: 0
    });
    expect(filterAuditEvidenceReportLedgerRows(rows, "manifest:run-a1").map((row) => row.id)).toEqual([
      "audit-report-run-a1-audit"
    ]);
    expect(filterAuditEvidenceReportLedgerRows(rows, "local-core signature_verified").map((row) => row.id)).toEqual([
      "audit-report-run-a1-audit"
    ]);
    expect(filterAuditEvidenceReportLedgerRows(rows, "bad").map((row) => row.id)).toEqual([
      "audit-report-run-b-bad"
    ]);
  });

  test("includes backtest markdown report events in the audit report ledger", () => {
    const backtestHash = "e".repeat(64);
    const rows = buildAuditEvidenceReportLedgerRows([
      {
        schemaVersion: 1,
        eventId: "backtest-report-run-a1-eeeeeeeeeeeeeeee",
        eventType: "backtest_report",
        runId: "run-a1",
        createdAt: "2026-06-05T09:00:00.000Z",
        stage: "generated",
        source: "web",
        summary: "Backtest Markdown report generated for run-a1",
        detail: "run-a1-backtest-report.md · sha256 eeeeeeeeeeee · 3 comparable runs",
        metadata: {
          artifactKind: "aiqt.backtestReport",
          boundary: "historical audited evidence only; no investment advice",
          contentSha256: backtestHash,
          contentSha256Algorithm: "sha256",
          dataRows: 240,
          executionMode: "paper_only",
          fileName: "run-a1-backtest-report.md",
          format: "text/markdown",
          hasRunComparisonMatrix: true,
          market: "ashare",
          runComparisonRows: 3,
          strategyRevision: "rev-a1",
          symbol: "600000",
          timeframe: "1d"
        }
      }
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        artifactKind: "aiqt.backtestReport",
        contentSha256: backtestHash,
        deepLinkStatus: "backtest-report",
        fileName: "run-a1-backtest-report.md",
        focusQuery: "ashare 600000 1d rev-a1",
        importDiffBlocked: 0,
        importDiffTotal: 0,
        packageMatched: 3,
        packageTotal: 240,
        reportKind: "backtest_report",
        runId: "run-a1",
        signatureLabel: "Unsigned report hash",
        signatureStatus: "unsigned",
        statusLabel: "Backtest report hash recorded",
        tone: "ai"
      })
    );
    expect(filterAuditEvidenceReportLedgerRows(rows, "600000 rev-a1").map((row) => row.id)).toEqual([
      "backtest-report-run-a1-eeeeeeeeeeeeeeee"
    ]);
  });

  test("promotes backtest report ledger rows when signature chain metadata is present", () => {
    const backtestHash = "e".repeat(64);
    const rows = buildAuditEvidenceReportLedgerRows([
      {
        schemaVersion: 1,
        eventId: "backtest-report-run-signed",
        eventType: "backtest_report",
        runId: "run-signed",
        createdAt: "2026-06-05T10:00:00.000Z",
        stage: "generated",
        source: "web",
        summary: "Backtest Markdown report generated for run-signed",
        detail: "signed backtest report",
        metadata: {
          artifactKind: "aiqt.backtestReport",
          contentSha256: backtestHash,
          dataRows: 240,
          fileName: "run-signed-backtest-report.md",
          market: "ashare",
          runComparisonRows: 3,
          signature: {
            algorithm: "hmac-sha256",
            chainId: "audit-chain-local",
            keyId: "local-audit-key",
            signer: "Local Audit Key",
            signedAt: "2026-06-05T10:01:00.000Z",
            status: "verified",
            value: "a".repeat(64),
            verifiedAt: "2026-06-05T10:02:00.000Z"
          },
          strategyRevision: "rev-signed",
          symbol: "600000",
          timeframe: "1d"
        }
      }
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        artifactKind: "aiqt.backtestReport",
        chainId: "audit-chain-local",
        reportKind: "backtest_report",
        signatureDetail: "Local Audit Key · local-audit-key · hmac-sha256",
        signatureLabel: "Verified signature",
        signatureStatus: "verified",
        tone: "positive"
      })
    );
    expect(filterAuditEvidenceReportLedgerRows(rows, "backtest_report verified").map((row) => row.id)).toEqual([
      "backtest-report-run-signed"
    ]);
  });

  test("includes portfolio markdown report events in the audit report ledger", () => {
    const portfolioHash = "f".repeat(64);
    const rows = buildAuditEvidenceReportLedgerRows([
      {
        schemaVersion: 1,
        eventId: "portfolio-report-run-a1-ffffffffffffffff",
        eventType: "portfolio_report",
        runId: "run-a1",
        createdAt: "2026-06-06T10:00:00.000Z",
        stage: "generated",
        source: "web",
        summary: "Portfolio Markdown report generated for ashare 1d audited basket",
        detail: "run-a1-ashare-1d-portfolio-report.md · sha256 ffffffffffff · 2 legs · 4 diagnostics",
        metadata: {
          artifactKind: "aiqt.portfolioReport",
          boundary: "historical audited portfolio evidence only; no investment advice",
          cashWeight: 0.1,
          contentSha256: portfolioHash,
          contentSha256Algorithm: "sha256",
          diagnosticsCount: 4,
          equityRows: 240,
          fileName: "run-a1-ashare-1d-portfolio-report.md",
          format: "text/markdown",
          incompleteDataQuality: false,
          initialCash: 100000,
          legCount: 2,
          market: "ashare",
          negativeContributionLegs: 1,
          portfolioName: "ashare 1d audited basket",
          timeframe: "1d"
        }
      }
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        artifactKind: "aiqt.portfolioReport",
        contentSha256: portfolioHash,
        deepLinkStatus: "portfolio-report",
        fileName: "run-a1-ashare-1d-portfolio-report.md",
        focusQuery: "ashare 1d ashare 1d audited basket",
        importDiffBlocked: 0,
        importDiffTotal: 0,
        packageMatched: 2,
        packageTotal: 240,
        reportKind: "portfolio_report",
        runId: "run-a1",
        signatureLabel: "Unsigned report hash",
        signatureStatus: "unsigned",
        statusLabel: "Portfolio report hash recorded",
        tone: "ai"
      })
    );
    expect(filterAuditEvidenceReportLedgerRows(rows, "portfolio_report basket").map((row) => row.id)).toEqual([
      "portfolio-report-run-a1-ffffffffffffffff"
    ]);
  });

  test("promotes audit report ledger rows when signature chain metadata is present", () => {
    const verifiedHash = "b".repeat(64);
    const signedHash = "c".repeat(64);
    const revokedHash = "d".repeat(64);
    const reportEvents = [
      {
        schemaVersion: 1,
        eventId: "audit-report-verified",
        eventType: "audit_evidence_report",
        runId: "run-verified",
        createdAt: "2026-06-04T09:00:00.000Z",
        stage: "generated",
        source: "web",
        summary: "Audit evidence report generated for run-verified",
        detail: "verified report",
        metadata: {
          contentSha256: verifiedHash,
          fileName: "verified.md",
          signature: {
            algorithm: "ed25519-sha256",
            chainId: "audit-chain-local",
            keyId: "local-audit-key",
            signedAt: "2026-06-04T09:01:00.000Z",
            signer: "Local Audit Key",
            status: "verified",
            verifiedAt: "2026-06-04T09:02:00.000Z"
          }
        }
      },
      {
        schemaVersion: 1,
        eventId: "audit-report-signed",
        eventType: "audit_evidence_report",
        runId: "run-signed",
        createdAt: "2026-06-04T09:03:00.000Z",
        stage: "generated",
        source: "web",
        summary: "Audit evidence report generated for run-signed",
        detail: "signed report",
        metadata: {
          contentSha256: signedHash,
          fileName: "signed.md",
          signature: {
            chainId: "audit-chain-local",
            keyId: "local-audit-key",
            signedAt: "2026-06-04T09:04:00.000Z",
            signer: "Local Audit Key",
            status: "signed"
          }
        }
      },
      {
        schemaVersion: 1,
        eventId: "audit-report-revoked",
        eventType: "audit_evidence_report",
        runId: "run-revoked",
        createdAt: "2026-06-04T09:05:00.000Z",
        stage: "generated",
        source: "web",
        summary: "Audit evidence report generated for run-revoked",
        detail: "revoked report",
        metadata: {
          contentSha256: revokedHash,
          fileName: "revoked.md",
          signature: {
            chainId: "audit-chain-local",
            keyId: "local-audit-key",
            revokedReason: "superseded by corrected evidence package",
            signedAt: "2026-06-04T09:06:00.000Z",
            signer: "Local Audit Key",
            status: "revoked"
          }
        }
      }
    ];

    const rows = buildAuditEvidenceReportLedgerRows(reportEvents);
    const summary = buildAuditEvidenceReportLedgerSummary(rows);

    expect(rows.map((row) => `${row.id}:${row.signatureStatus}:${row.signatureLabel}:${row.tone}`)).toEqual([
      "audit-report-verified:verified:Verified signature:positive",
      "audit-report-signed:signed:Signed report hash:positive",
      "audit-report-revoked:revoked:Revoked signature:risk"
    ]);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        chainId: "audit-chain-local",
        signatureAlgorithm: "ed25519-sha256",
        signatureKeyId: "local-audit-key",
        signatureSignedAt: "2026-06-04T09:01:00.000Z",
        signatureVerifiedAt: "2026-06-04T09:02:00.000Z",
        signer: "Local Audit Key",
        signatureDetail: "Local Audit Key · local-audit-key · ed25519-sha256"
      })
    );
    expect(summary).toEqual(
      expect.objectContaining({
        attention: 1,
        chainStatus: "attention",
        revoked: 1,
        signed: 1,
        total: 3,
        unsigned: 0,
        verified: 1
      })
    );
    expect(filterAuditEvidenceReportLedgerRows(rows, "local-audit-key").map((row) => row.id)).toEqual([
      "audit-report-verified",
      "audit-report-signed",
      "audit-report-revoked"
    ]);
    expect(filterAuditEvidenceReportLedgerRows(rows, "revoked").map((row) => row.id)).toEqual([
      "audit-report-revoked"
    ]);
  });

  test("builds signing key rotation history rows from persisted audit events", () => {
    const rotationEvents = [
      {
        schemaVersion: 1,
        eventId: "audit-signing-key-rotation-next-audit-key-9b1bb415ca4c",
        eventType: "audit_signing_key_rotation_plan",
        runId: "audit-signing-key-rotation",
        createdAt: "2026-06-04T10:30:00+00:00",
        stage: "prepared",
        source: "web",
        summary: "Audit signing key rotation plan prepared for next-audit-key",
        detail: "active-audit-key -> next-audit-key · legacy template sha256 9b1bb415ca4c · restart required",
        metadata: {
          blockedReasons: [],
          currentKeyFingerprint: "a".repeat(16),
          currentKeyId: "active-audit-key",
          environmentUpdateNames: [
            "AIQT_AUDIT_SIGNING_KEY_ID",
            "AIQT_AUDIT_SIGNING_SECRET",
            "AIQT_AUDIT_SIGNING_KEYS_JSON"
          ],
          legacyRegistryTemplateSha256: "b".repeat(64),
          proposedChainId: "audit-chain-next",
          proposedKeyId: "next-audit-key",
          proposedSigner: "Next Audit Key",
          requiresRestart: true,
          rotationRequired: true,
          secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"],
          stepIds: ["set-new-active-key", "verify-legacy-reports"]
        }
      },
      {
        schemaVersion: 1,
        eventId: "audit-signing-key-rotation-blocked",
        eventType: "audit_signing_key_rotation_plan",
        runId: "audit-signing-key-rotation",
        createdAt: "2026-06-04T10:35:00+00:00",
        stage: "blocked",
        source: "web",
        summary: "Audit signing key rotation plan prepared for active-audit-key",
        detail: "blocked plan",
        metadata: {
          blockedReasons: ["proposed_key_matches_current_active_key"],
          currentKeyFingerprint: "c".repeat(16),
          currentKeyId: "active-audit-key",
          environmentUpdateNames: [],
          legacyRegistryTemplateSha256: "bad",
          proposedChainId: "audit-chain-active",
          proposedKeyId: "active-audit-key",
          proposedSigner: "Active Audit Key",
          requiresRestart: true,
          rotationRequired: true,
          secretPlaceholderNames: [],
          stepIds: []
        }
      },
      {
        schemaVersion: 1,
        eventId: "audit-signing-key-rotation-apply-next-audit-key-0f7c5d5c5d5c",
        eventType: "audit_signing_key_rotation_apply",
        runId: "audit-signing-key-rotation",
        createdAt: "2026-06-04T10:36:00+00:00",
        stage: "blocked",
        source: "web",
        summary: "Audit signing key rotation apply blocked for next-audit-key",
        detail: "active-audit-key -> next-audit-key · manual_secret_store · new_secret_material_not_confirmed / operator_review_not_confirmed",
        metadata: {
          applyMode: "manual_secret_store",
          auditEventType: "audit_signing_key_rotation_apply",
          blockedReasons: ["new_secret_material_not_confirmed", "operator_review_not_confirmed"],
          confirmedConfirmationIds: ["legacy-secret-stored"],
          currentActiveKeyFingerprint: "d".repeat(16),
          currentActiveKeyId: "active-audit-key",
          environmentUpdateNames: ["AIQT_AUDIT_SIGNING_KEY_ID", "AIQT_AUDIT_SIGNING_SECRET"],
          missingConfirmationIds: ["new-secret-material-stored", "operator-reviewed-plan"],
          proposedActiveKeyId: "next-audit-key",
          proposedChainId: "audit-chain-next",
          proposedSigner: "Next Audit Key",
          restartRequired: true,
          secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"],
          status: "blocked"
        }
      },
      {
        schemaVersion: 1,
        eventId: "audit-signing-key-controlled-restart-next-audit-key-42",
        eventType: "audit_signing_key_controlled_restart_evidence",
        runId: "audit-signing-key-rotation",
        createdAt: "2026-06-04T10:38:00+00:00",
        stage: "evidence_recorded",
        source: "audit-signing-key-ledger",
        summary: "Audit signing key controlled restart evidence recorded for next-audit-key.",
        detail: "Controlled restart evidence records operator confirmations only.",
        metadata: {
          applyEventId: "audit-signing-key-rotation-apply-next-audit-key-0f7c5d5c5d5c",
          blockedReasons: [],
          confirmedConfirmationIds: [
            "restart-window-executed",
            "rollback-plan-confirmed",
            "post-restart-validation-passed",
            "operator-reviewed-restart-logs"
          ],
          currentActiveKeyFingerprint: "e".repeat(16),
          currentActiveKeyId: "active-audit-key",
          evidenceMode: "manual_controlled_restart",
          liveTradingAllowed: false,
          operator: "audit-operator",
          paperOnly: true,
          proposedActiveKeyId: "next-audit-key",
          proposedChainId: "audit-chain-next",
          proposedSigner: "Next Audit Key",
          requiredConfirmationIds: [
            "restart-window-executed",
            "rollback-plan-confirmed",
            "post-restart-validation-passed",
            "operator-reviewed-restart-logs"
          ],
          restartRequired: true,
          status: "evidence_recorded"
        }
      },
      {
        schemaVersion: 1,
        eventId: "audit-signing-key-secret-materialization-next-audit-key-42",
        eventType: "audit_signing_key_secret_materialization",
        runId: "audit-signing-key-rotation",
        createdAt: "2026-06-04T10:35:00+00:00",
        stage: "audit-signing-key-secret-materialization",
        source: "audit-signing-key-ledger",
        summary: "Audit signing key secret materialization manifest recorded.",
        detail: "Manifest path only; raw secrets remain outside this API.",
        metadata: {
          backend: "local-secret-store",
          blockedReasons: [],
          confirmedConfirmationIds: [
            "local-secret-store-write-verified",
            "raw-secret-boundary-confirmed",
            "env-binding-plan-documented",
            "rollback-plan-documented"
          ],
          currentActiveKeyFingerprint: "f".repeat(16),
          currentActiveKeyId: "active-audit-key",
          liveTradingAllowed: false,
          manifestPath: "local-secret-store://audit-signing/next-audit-key",
          materializationMode: "local_secret_store_manifest",
          operator: "audit-operator",
          paperOnly: true,
          planEventId: "audit-signing-key-rotation-next-audit-key-9b1bb415ca4c",
          proposedActiveKeyId: "next-audit-key",
          proposedChainId: "audit-chain-next",
          proposedSigner: "Next Audit Key",
          requiredConfirmationIds: [
            "local-secret-store-write-verified",
            "raw-secret-boundary-confirmed",
            "env-binding-plan-documented",
            "rollback-plan-documented"
          ],
          requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"],
          secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"],
          status: "manifest_recorded"
        }
      },
      {
        schemaVersion: 1,
        eventId: "audit-signing-key-environment-binding-next-audit-key-42",
        eventType: "audit_signing_key_environment_binding",
        runId: "audit-signing-key-rotation",
        createdAt: "2026-06-04T10:37:00+00:00",
        stage: "audit-signing-key-environment-binding",
        source: "audit-signing-key-ledger",
        summary: "Audit signing key environment binding evidence recorded.",
        detail: "Runtime env mapping only; raw secrets remain outside this API.",
        metadata: {
          backend: "local-secret-store",
          bindingId: "audit-signing-key-environment-binding-next-audit-key-42",
          bindingMode: "container_env_reference",
          blockedReasons: [],
          confirmedConfirmationIds: [
            "runtime-env-mapping-verified",
            "config-reload-plan-documented",
            "raw-secret-boundary-confirmed",
            "rollback-snapshot-recorded"
          ],
          currentActiveKeyFingerprint: "g".repeat(16),
          currentActiveKeyId: "active-audit-key",
          liveTradingAllowed: false,
          manifestPath: "local-secret-store://audit-signing/next-audit-key",
          materializationId: "audit-signing-key-secret-materialization-next-audit-key-42",
          operator: "audit-operator",
          paperOnly: true,
          planEventId: "audit-signing-key-rotation-next-audit-key-9b1bb415ca4c",
          proposedActiveKeyId: "next-audit-key",
          proposedChainId: "audit-chain-next",
          proposedSigner: "Next Audit Key",
          requiredConfirmationIds: [
            "runtime-env-mapping-verified",
            "config-reload-plan-documented",
            "raw-secret-boundary-confirmed",
            "rollback-snapshot-recorded"
          ],
          requiredEnvVars: [
            "AIQT_AUDIT_SIGNING_KEY_ID",
            "AIQT_AUDIT_SIGNING_SECRET",
            "AIQT_AUDIT_SIGNING_KEYS_JSON",
            "AIQT_AUDIT_SIGNING_CHAIN_ID",
            "AIQT_AUDIT_SIGNING_PUBLIC_KEY"
          ],
          status: "binding_recorded"
        }
      },
      {
        schemaVersion: 1,
        eventId: "audit-signing-key-runtime-reload-plan-next-audit-key-42",
        eventType: "audit_signing_key_runtime_reload_plan",
        runId: "audit-signing-key-rotation",
        createdAt: "2026-06-04T10:39:00+00:00",
        stage: "audit-signing-key-runtime-reload-plan",
        source: "audit-signing-key-ledger",
        summary: "Audit signing key runtime reload plan recorded for next-audit-key.",
        detail: "Runtime reload plan records orchestration evidence only.",
        metadata: {
          backend: "local-secret-store",
          bindingId: "audit-signing-key-environment-binding-next-audit-key-42",
          bindingMode: "container_env_reference",
          blockedReasons: [],
          confirmedConfirmationIds: [
            "maintenance-window-approved",
            "health-baseline-captured",
            "config-diff-reviewed",
            "post-reload-smoke-plan-documented",
            "rollback-owner-assigned"
          ],
          currentActiveKeyFingerprint: "h".repeat(16),
          currentActiveKeyId: "active-audit-key",
          liveTradingAllowed: false,
          maintenanceWindowId: "audit-window-1",
          manifestPath: "local-secret-store://audit-signing/next-audit-key",
          materializationId: "audit-signing-key-secret-materialization-next-audit-key-42",
          operator: "audit-operator",
          paperOnly: true,
          planEventId: "audit-signing-key-rotation-next-audit-key-9b1bb415ca4c",
          proposedActiveKeyId: "next-audit-key",
          proposedChainId: "audit-chain-next",
          proposedSigner: "Next Audit Key",
          reloadMode: "manual_container_reload_plan",
          requiredConfirmationIds: [
            "maintenance-window-approved",
            "health-baseline-captured",
            "config-diff-reviewed",
            "post-reload-smoke-plan-documented",
            "rollback-owner-assigned"
          ],
          requiredEnvVars: [
            "AIQT_AUDIT_SIGNING_KEY_ID",
            "AIQT_AUDIT_SIGNING_SECRET",
            "AIQT_AUDIT_SIGNING_KEYS_JSON"
          ],
          status: "plan_recorded"
        }
      },
      {
        schemaVersion: 1,
        eventId: "audit-report-ignore",
        eventType: "audit_evidence_report",
        runId: "run-audit",
        createdAt: "2026-06-04T10:40:00+00:00",
        stage: "generated",
        source: "web",
        summary: "Ignored",
        detail: "Ignored",
        metadata: {}
      }
    ];

    const rows = buildAuditSigningKeyRotationLedgerRows(rotationEvents);

    expect(rows.map((row) => `${row.id}:${row.status}:${row.templateShortHash}:${row.tone}`)).toEqual([
      "audit-signing-key-rotation-next-audit-key-9b1bb415ca4c:prepared:bbbbbbbbbbbb:warning",
      "audit-signing-key-rotation-blocked:blocked:invalid:risk",
      "audit-signing-key-rotation-apply-next-audit-key-0f7c5d5c5d5c:blocked:apply:risk",
      "audit-signing-key-controlled-restart-next-audit-key-42:evidence_recorded:restart:positive",
      "audit-signing-key-secret-materialization-next-audit-key-42:manifest_recorded:manifest:positive",
      "audit-signing-key-environment-binding-next-audit-key-42:binding_recorded:binding:positive",
      "audit-signing-key-runtime-reload-plan-next-audit-key-42:plan_recorded:reload:positive"
    ]);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        blockedReasonLabel: "none",
        currentKeyFingerprint: "a".repeat(16),
        currentKeyId: "active-audit-key",
        environmentUpdateCount: 3,
        proposedChainId: "audit-chain-next",
        proposedKeyId: "next-audit-key",
        proposedSigner: "Next Audit Key",
        requiresRestart: true,
        secretPlaceholderCount: 2,
        stepCount: 2,
        statusLabel: "Rotation plan prepared"
      })
    );
    expect(rows[1]).toEqual(
      expect.objectContaining({
        blockedReasonLabel: "proposed_key_matches_current_active_key",
        statusLabel: "Rotation plan blocked",
        templateShortHash: "invalid"
      })
    );
    expect(rows[2]).toEqual(
      expect.objectContaining({
        applyMode: "manual_secret_store",
        confirmedConfirmationCount: 1,
        currentKeyFingerprint: "d".repeat(16),
        eventKind: "apply",
        missingConfirmationCount: 2,
        proposedKeyId: "next-audit-key",
        statusLabel: "Rotation apply blocked",
        templateShortHash: "apply"
      })
    );
    expect(rows[3]).toEqual(
      expect.objectContaining({
        applyEventId: "audit-signing-key-rotation-apply-next-audit-key-0f7c5d5c5d5c",
        applyMode: "manual_controlled_restart",
        confirmedConfirmationCount: 4,
        currentKeyFingerprint: "e".repeat(16),
        eventKind: "restart",
        liveTradingAllowed: false,
        operator: "audit-operator",
        paperOnly: true,
        proposedKeyId: "next-audit-key",
        statusLabel: "Controlled restart evidence recorded",
        templateShortHash: "restart"
      })
    );
    expect(rows[4]).toEqual(
      expect.objectContaining({
        applyMode: "local_secret_store_manifest",
        confirmedConfirmationCount: 4,
        currentKeyFingerprint: "f".repeat(16),
        eventKind: "materialization",
        liveTradingAllowed: false,
        operator: "audit-operator",
        paperOnly: true,
        proposedKeyId: "next-audit-key",
        secretPlaceholderCount: 2,
        statusLabel: "Secret materialization recorded",
        templateShortHash: "manifest"
      })
    );
    expect(rows[5]).toEqual(
      expect.objectContaining({
        applyMode: "container_env_reference",
        confirmedConfirmationCount: 4,
        currentKeyFingerprint: "g".repeat(16),
        environmentUpdateCount: 5,
        eventKind: "environment_binding",
        liveTradingAllowed: false,
        operator: "audit-operator",
        paperOnly: true,
        proposedKeyId: "next-audit-key",
        statusLabel: "Environment binding recorded",
        templateShortHash: "binding"
      })
    );
    expect(rows[6]).toEqual(
      expect.objectContaining({
        applyEventId: "audit-signing-key-environment-binding-next-audit-key-42",
        applyMode: "manual_container_reload_plan",
        confirmedConfirmationCount: 5,
        currentKeyFingerprint: "h".repeat(16),
        environmentUpdateCount: 3,
        eventKind: "runtime_reload_plan",
        liveTradingAllowed: false,
        operator: "audit-operator",
        paperOnly: true,
        proposedKeyId: "next-audit-key",
        statusLabel: "Runtime reload plan recorded",
        templateShortHash: "reload"
      })
    );
    expect(filterAuditSigningKeyRotationLedgerRows(rows, "next-audit-key").map((row) => row.id)).toEqual([
      "audit-signing-key-rotation-next-audit-key-9b1bb415ca4c",
      "audit-signing-key-rotation-apply-next-audit-key-0f7c5d5c5d5c",
      "audit-signing-key-controlled-restart-next-audit-key-42",
      "audit-signing-key-secret-materialization-next-audit-key-42",
      "audit-signing-key-environment-binding-next-audit-key-42",
      "audit-signing-key-runtime-reload-plan-next-audit-key-42"
    ]);
    expect(filterAuditSigningKeyRotationLedgerRows(rows, "blocked").map((row) => row.id)).toEqual([
      "audit-signing-key-rotation-blocked",
      "audit-signing-key-rotation-apply-next-audit-key-0f7c5d5c5d5c"
    ]);
    expect(filterAuditSigningKeyRotationLedgerRows(rows, "operator-reviewed-plan").map((row) => row.id)).toEqual([
      "audit-signing-key-rotation-apply-next-audit-key-0f7c5d5c5d5c"
    ]);
    expect(filterAuditSigningKeyRotationLedgerRows(rows, "restart-window-executed").map((row) => row.id)).toEqual([
      "audit-signing-key-controlled-restart-next-audit-key-42"
    ]);
    expect(filterAuditSigningKeyRotationLedgerRows(rows, "raw-secret-boundary-confirmed").map((row) => row.id)).toEqual([
      "audit-signing-key-secret-materialization-next-audit-key-42",
      "audit-signing-key-environment-binding-next-audit-key-42"
    ]);
    expect(filterAuditSigningKeyRotationLedgerRows(rows, "runtime-env-mapping-verified").map((row) => row.id)).toEqual([
      "audit-signing-key-environment-binding-next-audit-key-42"
    ]);
    expect(filterAuditSigningKeyRotationLedgerRows(rows, "maintenance-window-approved").map((row) => row.id)).toEqual([
      "audit-signing-key-runtime-reload-plan-next-audit-key-42"
    ]);
    expect(filterAuditSigningKeyRotationLedgerRows(rows, "manual_container_reload_plan").map((row) => row.id)).toEqual([
      "audit-signing-key-runtime-reload-plan-next-audit-key-42"
    ]);
    expect(filterAuditSigningKeyRotationLedgerRows(rows, "audit-operator").map((row) => row.id)).toEqual([
      "audit-signing-key-controlled-restart-next-audit-key-42",
      "audit-signing-key-secret-materialization-next-audit-key-42",
      "audit-signing-key-environment-binding-next-audit-key-42",
      "audit-signing-key-runtime-reload-plan-next-audit-key-42"
    ]);
    expect(JSON.stringify(rows)).not.toContain("<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>");
    expect(JSON.stringify(rows)).not.toContain("local-dev-audit-secret");
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

  test("builds a default portfolio backtest draft from audited run history", () => {
    const current = {
      ...auditedRunFixture({
        runId: "run-current-600000",
        symbol: "600000",
        market: "ashare",
        timeframe: "1d",
        createdAt: "2026-05-26T08:00:00+00:00"
      }),
      backtestEquityCurve: [
        { timestamp: "2026-05-26T08:00:00+00:00", equity: 100000 },
        { timestamp: "2026-05-27T08:00:00+00:00", equity: 105000 }
      ]
    };
    const peer = {
      ...auditedRunFixture({
        runId: "run-peer-000300",
        symbol: "000300",
        market: "ashare",
        timeframe: "1d",
        createdAt: "2026-05-26T07:00:00+00:00"
      }),
      backtestEquityCurve: [
        { timestamp: "2026-05-26T08:00:00+00:00", equity: 100000 },
        { timestamp: "2026-05-27T08:00:00+00:00", equity: 120000 }
      ]
    };
    const otherMarket = {
      ...auditedRunFixture({
        runId: "run-us-aapl",
        symbol: "AAPL",
        market: "us",
        timeframe: "1d",
        createdAt: "2026-05-26T09:00:00+00:00"
      }),
      backtestEquityCurve: [
        { timestamp: "2026-05-26T08:00:00+00:00", equity: 100000 },
        { timestamp: "2026-05-27T08:00:00+00:00", equity: 101000 }
      ]
    };

    const draft = buildPortfolioBacktestDraft([otherMarket, peer, current], current.runId);

    expect(draft.status).toBe("ready");
    expect(draft.request).toEqual({
      name: "ashare 1d audited basket",
      initialCash: 100000,
      legs: [
        { runId: "run-current-600000", targetWeight: 0.5 },
        { runId: "run-peer-000300", targetWeight: 0.4 }
      ]
    });
    expect(draft.cashWeight).toBe(0.1);
    expect(draft.rows.map((row) => `${row.symbol}:${row.weightLabel}:${row.current}`)).toEqual([
      "600000:50.0%:true",
      "000300:40.0%:false"
    ]);
    expect(draft.summary).toContain("2 audited runs");
  });

  test("builds a peer audit plan for missing same-market portfolio runs", () => {
    const current = {
      ...auditedRunFixture({
        runId: "run-current-600000",
        symbol: "600000",
        market: "ashare",
        timeframe: "1d"
      }),
      backtestEquityCurve: [
        { timestamp: "2026-05-26T08:00:00+00:00", equity: 100000 },
        { timestamp: "2026-05-27T08:00:00+00:00", equity: 105000 }
      ]
    };
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), current);

    const plan = buildPortfolioPeerAuditPlan(workspace, [current]);

    expect(plan.status).toBe("ready");
    expect(plan.auditedCount).toBe(1);
    expect(plan.missingCount).toBe(1);
    expect(plan.candidates.map((candidate) => `${candidate.symbol}:${candidate.status}:${candidate.runId ?? "missing"}`)).toEqual([
      "600000:audited:run-current-600000",
      "000300:missing:missing"
    ]);
    expect(plan.summary).toContain("1 peer audit");
  });

  test("marks the peer audit plan complete when enough audited legs exist", () => {
    const current = {
      ...auditedRunFixture({
        runId: "run-current-600000",
        symbol: "600000",
        market: "ashare",
        timeframe: "1d"
      }),
      backtestEquityCurve: [
        { timestamp: "2026-05-26T08:00:00+00:00", equity: 100000 },
        { timestamp: "2026-05-27T08:00:00+00:00", equity: 105000 }
      ]
    };
    const peer = {
      ...auditedRunFixture({
        runId: "run-peer-000300",
        symbol: "000300",
        market: "ashare",
        timeframe: "1d"
      }),
      backtestEquityCurve: [
        { timestamp: "2026-05-26T08:00:00+00:00", equity: 100000 },
        { timestamp: "2026-05-27T08:00:00+00:00", equity: 101000 }
      ]
    };
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), current);

    const plan = buildPortfolioPeerAuditPlan(workspace, [peer, current]);

    expect(plan.status).toBe("complete");
    expect(plan.auditedCount).toBe(2);
    expect(plan.missingCount).toBe(0);
    expect(plan.candidates.map((candidate) => `${candidate.symbol}:${candidate.status}:${candidate.runId ?? "missing"}`)).toEqual([
      "600000:audited:run-current-600000",
      "000300:audited:run-peer-000300"
    ]);
  });

  test("derives portfolio backtest diagnostics from combined run evidence", () => {
    const diagnostics = buildPortfolioBacktestDiagnosticRows({
      name: "ashare 1d audited basket",
      market: "ashare",
      timeframe: "1d",
      initialCash: 100000,
      cashWeight: 0.1,
      metrics: {
        totalReturnPct: 6.2,
        annualReturnPct: 12.4,
        maxDrawdownPct: 8.1,
        winRatePct: 52,
        profitFactor: 1.2,
        tradeCount: 18
      },
      equityCurve: [
        { timestamp: "2026-05-26T08:00:00+00:00", equity: 100000 },
        { timestamp: "2026-05-27T08:00:00+00:00", equity: 106200 }
      ],
      allocationEvents: [
        {
          timestamp: "2026-05-26T08:00:00+00:00",
          eventType: "allocate" as const,
          symbol: "600000",
          sourceRunId: "run-current-600000",
          targetWeight: 0.65,
          notionalValue: 65000,
          reason: "static target allocation"
        },
        {
          timestamp: "2026-05-26T08:00:00+00:00",
          eventType: "allocate" as const,
          symbol: "000300",
          sourceRunId: "run-peer-000300",
          targetWeight: 0.25,
          notionalValue: 25000,
          reason: "static target allocation"
        },
        {
          timestamp: "2026-05-26T08:00:00+00:00",
          eventType: "cash_buffer" as const,
          symbol: "CASH",
          sourceRunId: null,
          targetWeight: 0.1,
          notionalValue: 10000,
          reason: "unallocated cash buffer"
        }
      ],
      rebalanceEvents: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "rebalance_review" as const,
          symbol: "600000",
          sourceRunId: "run-current-600000",
          targetWeight: 0.65,
          endingWeight: 0.6733,
          currentValue: 71500,
          targetValue: 69030,
          deltaValue: -2470,
          driftPct: 2.33,
          status: "review" as const,
          reason: "ending weight drift requires review; no order is routed"
        },
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "rebalance_review" as const,
          symbol: "CASH",
          sourceRunId: null,
          targetWeight: 0.1,
          endingWeight: 0.0942,
          currentValue: 10000,
          targetValue: 10620,
          deltaValue: 620,
          driftPct: -0.58,
          status: "within_band" as const,
          reason: "ending weight remains inside the review band"
        }
      ],
      tradeReviewEvents: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "trade_review" as const,
          symbol: "600000",
          sourceRunId: "run-current-600000",
          side: "sell" as const,
          notionalValue: 2470,
          targetWeight: 0.65,
          endingWeight: 0.6733,
          status: "paper_review" as const,
          reason: "paper-only rebalance intent generated from audited portfolio drift; no order is routed"
        }
      ],
      preTradeRiskChecks: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "pre_trade_risk_check" as const,
          scope: "portfolio" as const,
          symbol: null,
          sourceRunId: null,
          checkId: "portfolio_data_quality" as const,
          status: "blocked" as const,
          value: 0,
          limit: 1,
          reason: "portfolio composite data quality is incomplete; no paper order should be staged"
        },
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "pre_trade_risk_check" as const,
          scope: "trade" as const,
          symbol: "600000",
          sourceRunId: "run-current-600000",
          checkId: "trade_notional_limit" as const,
          status: "passed" as const,
          value: 0.0233,
          limit: 0.2,
          reason: "trade notional remains inside the hard pre-trade limit"
        }
      ],
      paperOrderEvents: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "portfolio_paper_order" as const,
          orderId: "portfolio-paper-run-current-600000-sell",
          symbol: "600000",
          sourceRunId: "run-current-600000",
          side: "sell" as const,
          notionalValue: 2470,
          quantity: 2470,
          status: "rejected" as const,
          riskStatus: "blocked" as const,
          reason: "pre-trade risk checks blocked this portfolio paper order candidate"
        }
      ],
      legs: [
        {
          symbol: "600000",
          targetWeight: 0.65,
          startingValue: 65000,
          endingValue: 71500,
          contributionValue: 6500,
          contributionReturnPct: 10,
          maxDrawdownPct: 5.1,
          tradeCount: 12,
          dataQuality: { source: "local-cache", isComplete: true, warnings: [], rows: 2 }
        },
        {
          symbol: "000300",
          targetWeight: 0.25,
          startingValue: 25000,
          endingValue: 24000,
          contributionValue: -1000,
          contributionReturnPct: -4,
          maxDrawdownPct: 7.3,
          tradeCount: 6,
          dataQuality: { source: "local-cache", isComplete: false, warnings: ["missing 1 bar"], rows: 2 }
        }
      ],
      correlationPairs: [{ leftSymbol: "600000", rightSymbol: "000300", correlation: 0.91 }],
      covarianceRisk: {
        method: "population_covariance" as const,
        observations: 4,
        periodVolatilityPct: 1.8,
        annualizedVolatilityPct: 28.6,
        contributions: [
          {
            symbol: "600000",
            sourceRunId: "run-current-600000",
            targetWeight: 0.65,
            annualizedVolatilityPct: 31.2,
            marginalContributionPct: 24.8,
            contributionPct: 68.4
          },
          {
            symbol: "000300",
            sourceRunId: "run-peer-000300",
            targetWeight: 0.25,
            annualizedVolatilityPct: 18.5,
            marginalContributionPct: 12.6,
            contributionPct: 31.6
          }
        ]
      },
      dataQuality: {
        source: "portfolio-composite(600000:local-cache,000300:local-cache)",
        isComplete: false,
        warnings: ["000300: missing 1 bar"],
        rows: 2
      }
    });

    expect(diagnostics.map((row) => `${row.id}:${row.status}:${row.value}`)).toEqual([
      "concentration:review:600000 65.0%",
      "cash-buffer:passed:10.0%",
      "exposure-utilization:passed:90.0%",
      "rebalance-drift:review:000300 -2.4pp",
      "risk-contribution:review:600000 64.5%",
      "covariance-risk:review:600000 68.4%",
      "correlation-risk:review:600000/000300 0.91",
      "negative-contribution:review:000300 -4.0%",
      "data-quality:blocked:incomplete"
    ]);
    expect(diagnostics[0].detail).toContain("50%");
    expect(diagnostics[2].detail).toContain("cash/slippage");
    expect(diagnostics[3].detail).toContain("rebalance review");
    expect(diagnostics[4].detail).toContain("risk-budget contribution");
    expect(diagnostics[5].detail).toContain("covariance risk contribution");
    expect(diagnostics[6].detail).toContain("pairwise correlation");
    expect(diagnostics[7].detail).toContain("negative contribution");
    expect(diagnostics[8].detail).toContain("000300: missing 1 bar");
  });

  test("builds portfolio paper order lifecycle rows for the execution center", () => {
    const rows = buildPortfolioPaperOrderLifecycleRows([
      {
        batchId: "portfolio-paper-batch-1",
        baseRunId: "run-current-600000",
        portfolioName: "ashare audited basket",
        createdAt: "2026-05-27T08:05:00+00:00",
        mode: "portfolio_paper_order_review",
        source: "portfolio_backtest",
        summary: {
          totalOrders: 3,
          totalNotionalValue: 12850,
          statusCounts: { pending_review: 1, rejected: 1, skipped: 1 },
          riskStatusCounts: { review: 1, blocked: 1, passed: 1 }
        },
        orders: [
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            eventType: "portfolio_paper_order",
            orderId: "order-review",
            symbol: "600000",
            sourceRunId: "run-current-600000",
            side: "buy",
            notionalValue: 8000,
            quantity: 800,
            status: "pending_review",
            riskStatus: "review",
            reason: "operator review required"
          },
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            eventType: "portfolio_paper_order",
            orderId: "order-rejected",
            symbol: "000300",
            sourceRunId: "run-peer-000300",
            side: "sell",
            notionalValue: 4850,
            quantity: 2,
            status: "rejected",
            riskStatus: "blocked",
            reason: "pre-trade risk blocked"
          },
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            eventType: "portfolio_paper_order",
            orderId: "order-skipped",
            symbol: "CASH",
            sourceRunId: null,
            side: "hold",
            notionalValue: 0,
            quantity: 0,
            status: "skipped",
            riskStatus: "passed",
            reason: "cash buffer"
          }
        ]
      }
    ]);

    expect(rows).toEqual([
      {
        id: "portfolio-paper-batch-1",
        portfolioName: "ashare audited basket",
        batchId: "portfolio-paper-batch-1",
        baseRunId: "run-current-600000",
        createdAt: "2026-05-27T08:05:00+00:00",
        orderCount: 3,
        notionalValue: 12850,
        status: "review",
        statusLabel: "1 review / 1 rejected / 1 skipped",
        executionStateLabel: "1 awaiting review / 1 risk rejected / 1 skipped",
        routableOrders: 0,
        auditEventId: "portfolio-paper-order-batch-portfolio-paper-batch-1",
        detail: "3 paper-only candidates · 12850 notional · source portfolio_backtest",
        tone: "warning"
      }
    ]);
  });

  test("builds portfolio paper order approval rows for operator review", () => {
    const batches = [
      {
        batchId: "portfolio-paper-batch-1",
        baseRunId: "run-current-600000",
        portfolioName: "ashare audited basket",
        createdAt: "2026-05-27T08:05:00+00:00",
        mode: "portfolio_paper_order_review" as const,
        source: "portfolio_backtest",
        summary: {
          totalOrders: 3,
          totalNotionalValue: 12850,
          statusCounts: { pending_review: 2, rejected: 1 },
          riskStatusCounts: { passed: 1, review: 1, blocked: 1 }
        },
        orders: [
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            eventType: "portfolio_paper_order" as const,
            orderId: "order-ready",
            symbol: "600000",
            sourceRunId: "run-current-600000",
            side: "buy" as const,
            notionalValue: 8000,
            quantity: 800,
            status: "pending_review" as const,
            riskStatus: "passed" as const,
            reason: "operator review required"
          },
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            eventType: "portfolio_paper_order" as const,
            orderId: "order-risk-review",
            symbol: "600519",
            sourceRunId: "run-peer-600519",
            side: "buy" as const,
            notionalValue: 4000,
            quantity: 40,
            status: "pending_review" as const,
            riskStatus: "review" as const,
            reason: "risk review required"
          },
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            eventType: "portfolio_paper_order" as const,
            orderId: "order-blocked",
            symbol: "000300",
            sourceRunId: "run-peer-000300",
            side: "sell" as const,
            notionalValue: 850,
            quantity: 2,
            status: "rejected" as const,
            riskStatus: "blocked" as const,
            reason: "pre-trade risk blocked"
          }
        ]
      }
    ];
    const lifecycle = [
      {
        batchId: "portfolio-paper-batch-1",
        baseRunId: "run-current-600000",
        portfolioName: "ashare audited basket",
        orderId: "order-ready",
        symbol: "600000",
        sourceRunId: "run-current-600000",
        side: "buy" as const,
        quantity: 800,
        notionalValue: 8000,
        originalStatus: "pending_review" as const,
        riskStatus: "passed" as const,
        state: "ready_for_simulation" as const,
        routable: true,
        paperOnly: true,
        liveExecutionBlocked: true,
        approvedBy: "operator-a",
        reviewedAt: "2026-05-27T08:45:00+00:00",
        reason: "Approved for paper simulation only."
      }
    ];

    const rows = buildPortfolioPaperOrderApprovalRows(batches, lifecycle);

    expect(rows.map((row) => `${row.orderId}:${row.state}:${row.canApprove}:${row.canReject}:${row.tone}`)).toEqual([
      "order-ready:ready_for_simulation:false:false:positive",
      "order-risk-review:awaiting_operator_review:true:true:warning",
      "order-blocked:risk_rejected:false:false:risk"
    ]);
    expect(rows[0]).toMatchObject({
      approvedBy: "operator-a",
      actionHint: "Approved by operator-a; ready for paper simulation."
    });
    expect(rows[1]).toMatchObject({
      batchId: "portfolio-paper-batch-1",
      baseRunId: "run-current-600000",
      actionHint: "Operator approval or rejection is required before this paper-only order can move on."
    });
    expect(rows[2].actionHint).toContain("Risk rejected");
  });

  test("builds a markdown report from portfolio backtest evidence", () => {
    const portfolio = {
      name: "ashare 1d audited basket",
      market: "ashare" as const,
      timeframe: "1d" as const,
      initialCash: 100000,
      cashWeight: 0.1,
      metrics: {
        totalReturnPct: 6.2,
        annualReturnPct: 12.4,
        maxDrawdownPct: 8.1,
        winRatePct: 52,
        profitFactor: 1.2,
        tradeCount: 18
      },
      equityCurve: [
        { timestamp: "2026-05-26T08:00:00+00:00", equity: 100000 },
        { timestamp: "2026-05-27T08:00:00+00:00", equity: 106200 }
      ],
      allocationEvents: [
        {
          timestamp: "2026-05-26T08:00:00+00:00",
          eventType: "allocate" as const,
          symbol: "600000",
          sourceRunId: "run-current-600000",
          targetWeight: 0.65,
          notionalValue: 65000,
          reason: "static target allocation"
        },
        {
          timestamp: "2026-05-26T08:00:00+00:00",
          eventType: "allocate" as const,
          symbol: "000300",
          sourceRunId: "run-peer-000300",
          targetWeight: 0.25,
          notionalValue: 25000,
          reason: "static target allocation"
        },
        {
          timestamp: "2026-05-26T08:00:00+00:00",
          eventType: "cash_buffer" as const,
          symbol: "CASH",
          sourceRunId: null,
          targetWeight: 0.1,
          notionalValue: 10000,
          reason: "unallocated cash buffer"
        }
      ],
      rebalanceEvents: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "rebalance_review" as const,
          symbol: "600000",
          sourceRunId: "run-current-600000",
          targetWeight: 0.65,
          endingWeight: 0.6733,
          currentValue: 71500,
          targetValue: 69030,
          deltaValue: -2470,
          driftPct: 2.33,
          status: "review" as const,
          reason: "ending weight drift requires review; no order is routed"
        },
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "rebalance_review" as const,
          symbol: "CASH",
          sourceRunId: null,
          targetWeight: 0.1,
          endingWeight: 0.0942,
          currentValue: 10000,
          targetValue: 10620,
          deltaValue: 620,
          driftPct: -0.58,
          status: "within_band" as const,
          reason: "ending weight remains inside the review band"
        }
      ],
      tradeReviewEvents: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "trade_review" as const,
          symbol: "600000",
          sourceRunId: "run-current-600000",
          side: "sell" as const,
          notionalValue: 2470,
          targetWeight: 0.65,
          endingWeight: 0.6733,
          status: "paper_review" as const,
          reason: "paper-only rebalance intent generated from audited portfolio drift; no order is routed"
        }
      ],
      preTradeRiskChecks: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "pre_trade_risk_check" as const,
          scope: "portfolio" as const,
          symbol: null,
          sourceRunId: null,
          checkId: "portfolio_data_quality" as const,
          status: "blocked" as const,
          value: 0,
          limit: 1,
          reason: "portfolio composite data quality is incomplete; no paper order should be staged"
        },
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "pre_trade_risk_check" as const,
          scope: "trade" as const,
          symbol: "600000",
          sourceRunId: "run-current-600000",
          checkId: "trade_notional_limit" as const,
          status: "passed" as const,
          value: 0.0233,
          limit: 0.2,
          reason: "trade notional remains inside the hard pre-trade limit"
        }
      ],
      paperOrderEvents: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "portfolio_paper_order" as const,
          orderId: "portfolio-paper-run-current-600000-sell",
          symbol: "600000",
          sourceRunId: "run-current-600000",
          side: "sell" as const,
          notionalValue: 2470,
          quantity: 2470,
          status: "rejected" as const,
          riskStatus: "blocked" as const,
          reason: "pre-trade risk checks blocked this portfolio paper order candidate"
        }
      ],
      legs: [
        {
          symbol: "600000",
          targetWeight: 0.65,
          startingValue: 65000,
          endingValue: 71500,
          contributionValue: 6500,
          contributionReturnPct: 10,
          maxDrawdownPct: 5.1,
          tradeCount: 12,
          dataQuality: { source: "local-cache", isComplete: true, warnings: [], rows: 2 }
        },
        {
          symbol: "000300",
          targetWeight: 0.25,
          startingValue: 25000,
          endingValue: 24000,
          contributionValue: -1000,
          contributionReturnPct: -4,
          maxDrawdownPct: 7.3,
          tradeCount: 6,
          dataQuality: { source: "local-cache", isComplete: false, warnings: ["missing 1 bar"], rows: 2 }
        }
      ],
      correlationPairs: [{ leftSymbol: "600000", rightSymbol: "000300", correlation: 0.91 }],
      covarianceRisk: {
        method: "population_covariance" as const,
        observations: 4,
        periodVolatilityPct: 1.8,
        annualizedVolatilityPct: 28.6,
        contributions: [
          {
            symbol: "600000",
            sourceRunId: "run-current-600000",
            targetWeight: 0.65,
            annualizedVolatilityPct: 31.2,
            marginalContributionPct: 24.8,
            contributionPct: 68.4
          },
          {
            symbol: "000300",
            sourceRunId: "run-peer-000300",
            targetWeight: 0.25,
            annualizedVolatilityPct: 18.5,
            marginalContributionPct: 12.6,
            contributionPct: 31.6
          }
        ]
      },
      dataQuality: {
        source: "portfolio-composite(600000:local-cache,000300:local-cache)",
        isComplete: false,
        warnings: ["000300: missing 1 bar"],
        rows: 2
      }
    };
    const draft = {
      status: "ready" as const,
      headline: "Portfolio backtest ready",
      summary: "2 audited runs from ashare 1d; cash buffer 10.0%.",
      cashWeight: 0.1,
      request: {
        name: "ashare 1d audited basket",
        initialCash: 100000,
        legs: [
          { runId: "run-current-600000", targetWeight: 0.65 },
          { runId: "run-peer-000300", targetWeight: 0.25 }
        ]
      },
      rows: [
        {
          runId: "run-current-600000",
          symbol: "600000",
          targetWeight: 0.65,
          weightLabel: "65.0%",
          strategyRevision: "rev-current",
          totalReturnPct: "+10.00%",
          maxDrawdownPct: "5.10%",
          current: true
        },
        {
          runId: "run-peer-000300",
          symbol: "000300",
          targetWeight: 0.25,
          weightLabel: "25.0%",
          strategyRevision: "rev-peer",
          totalReturnPct: "-4.00%",
          maxDrawdownPct: "7.30%",
          current: false
        }
      ]
    };

    const markdown = buildPortfolioBacktestReportMarkdown(portfolio, draft, {
      generatedAt: "2026-06-06T09:00:00+08:00"
    });

    expect(markdown).toContain("# AIQuant Portfolio Backtest Report");
    expect(markdown).toContain("Portfolio: `ashare 1d audited basket`");
    expect(markdown).toContain("Generated at: `2026-06-06T09:00:00+08:00`");
    expect(markdown).toContain("| Total return | 6.20% |");
    expect(markdown).toContain("| Cash weight | 10.00% |");
    expect(markdown).toContain("| Concentration | 600000 65.0% | review |");
    expect(markdown).toContain("| Gross exposure | 90.0% | passed |");
    expect(markdown).toContain("| Rebalance drift | 000300 -2.4pp | review |");
    expect(markdown).toContain("| Risk contribution | 600000 64.5% | review |");
    expect(markdown).toContain("| Covariance risk | 600000 68.4% | review |");
    expect(markdown).toContain("| Correlation risk | 600000/000300 0.91 | review |");
    expect(markdown).toContain("| Data quality | incomplete | blocked |");
    expect(markdown).toContain("| 000300 | run-peer-000300 | 25.0% | -1000.00 | -4.00% |");
    expect(markdown).toContain("## Covariance Risk");
    expect(markdown).toContain("| Portfolio annualized volatility | 28.60% |");
    expect(markdown).toContain("| 600000 | run-current-600000 | 65.0% | 31.20% | 24.80% | 68.40% |");
    expect(markdown).toContain("## Allocation Ledger");
    expect(markdown).toContain("| 2026-05-26T08:00:00+00:00 | allocate | 600000 | run-current-600000 | 65.0% | 65000.00 |");
    expect(markdown).toContain("| 2026-05-26T08:00:00+00:00 | cash_buffer | CASH | - | 10.0% | 10000.00 |");
    expect(markdown).toContain("## Rebalance Review Ledger");
    expect(markdown).toContain("| 2026-05-27T08:00:00+00:00 | 600000 | run-current-600000 | 65.0% | 67.3% | -2470.00 | review |");
    expect(markdown).toContain("| 2026-05-27T08:00:00+00:00 | CASH | - | 10.0% | 9.4% | 620.00 | within_band |");
    expect(markdown).toContain("## Trade Review Ledger");
    expect(markdown).toContain("| 2026-05-27T08:00:00+00:00 | 600000 | run-current-600000 | sell | 2470.00 | 65.0% | 67.3% | paper_review |");
    expect(markdown).toContain("## Pre-Trade Risk Checks");
    expect(markdown).toContain("| 2026-05-27T08:00:00+00:00 | portfolio | - | - | portfolio_data_quality | blocked | 0.00 | 1.00 |");
    expect(markdown).toContain("| 2026-05-27T08:00:00+00:00 | trade | 600000 | run-current-600000 | trade_notional_limit | passed | 0.02 | 0.20 |");
    expect(markdown).toContain("## Portfolio Paper Orders");
    expect(markdown).toContain("| 2026-05-27T08:00:00+00:00 | portfolio-paper-run-current-600000-sell | 600000 | run-current-600000 | sell | 2470.00 | 2470.00 | rejected | blocked |");
    expect(markdown).toContain("historical audited portfolio evidence only");
    expect(markdown).toContain("No investment advice");
  });

  test("does not build a portfolio markdown report before a portfolio run exists", () => {
    expect(buildPortfolioBacktestReportMarkdown(null)).toBeNull();
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

  test("blocks execution approval and paper previews when audited evidence belongs to another context", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-execution-stale",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-execution-stale",
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
    const mismatchedWorkspace: TerminalWorkspace = {
      ...auditedWorkspace,
      selectedTimeframe: "5m"
    };

    const approval = buildRiskApprovalSummary(mismatchedWorkspace);
    const paperRows = buildPaperTradingRows(mismatchedWorkspace);
    const positionRows = buildPaperPositionRows(mismatchedWorkspace);
    const readiness = buildPromotionReadiness(mismatchedWorkspace, null, buildBrokerAdapterRows(mismatchedWorkspace));

    expect(approval.status).toBe("blocked");
    expect(approval.gates.find((gate) => gate.id === "audited-run")).toMatchObject({
      value: "run-execution-stale",
      detail:
        "Audited run run-execution-stale belongs to ASHARE · 600000 · 1d, not ASHARE · 600000 · 5m.",
      status: "blocked",
      tone: "risk"
    });
    expect(paperRows[0]).toMatchObject({
      quantity: "-",
      price: "-",
      notional: "-",
      status: "blocked",
      reason:
        "Audited run run-execution-stale belongs to ASHARE · 600000 · 1d, not ASHARE · 600000 · 5m."
    });
    expect(positionRows[0]).toMatchObject({
      quantity: "0",
      marketValue: "0.00",
      status: "blocked"
    });
    expect(readiness.stages.find((stage) => stage.id === "audited-run")).toMatchObject({
      value: "run-execution-stale",
      status: "blocked",
      tone: "risk"
    });
    expect(readiness.status).toBe("blocked");
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

  test("summarizes portfolio paper order replay account and positions", () => {
    const replay = {
      schemaVersion: 1 as const,
      baseRunId: "portfolio-run-replay",
      generatedAt: "2026-05-27T09:00:00+00:00",
      mode: "portfolio_paper_order_replay" as const,
      initialCash: 50000,
      account: {
        cash: 40800,
        equity: 50000,
        positions: { "600000": 1000 }
      },
      positions: [
        {
          symbol: "600000",
          quantity: 1000,
          avgCost: 9.2,
          lastPrice: 9.2,
          marketValue: 9200,
          unrealizedPnl: 0
        }
      ],
      orders: [
        {
          simulationId: "sim-replay-api",
          batchId: "portfolio-paper-batch-1",
          orderId: "portfolio-paper-run-a-buy",
          simulatedAt: "2026-05-27T08:46:00+00:00",
          symbol: "600000",
          side: "buy" as const,
          quantity: 1000,
          fillPrice: 9.2,
          notionalValue: 9200,
          cashAfter: 40800,
          positionAfter: 1000,
          replayState: "applied" as const,
          paperOnly: true,
          liveExecutionBlocked: true
        }
      ],
      summary: {
        filledOrders: 1,
        buyNotional: 9200,
        sellNotional: 0,
        netNotional: 9200,
        realizedPnl: 0,
        unrealizedPnl: 0,
        positionCount: 1,
        warnings: []
      },
      paperOnly: true,
      liveExecutionBlocked: true
    };

    const tiles = buildPortfolioPaperOrderReplaySummaryTiles(replay);
    const rows = buildPortfolioPaperOrderReplayPositionRows(replay);

    expect(tiles.map((tile) => tile.id)).toEqual(["portfolio-account", "portfolio-positions", "portfolio-replay-boundary"]);
    expect(tiles[0]).toMatchObject({
      label: "Portfolio account",
      value: "Cash 40,800 / Equity 50,000",
      tone: "positive"
    });
    expect(tiles[1]).toMatchObject({
      value: "1 position / 1 fill",
      detail: "Buy 9,200 / Sell 0 / Net 9,200"
    });
    expect(rows).toEqual([
      {
        id: "portfolio-replay-position-600000",
        symbol: "600000",
        quantity: "1000",
        avgCost: "9.20",
        lastPrice: "9.20",
        marketValue: "9200.00",
        unrealizedPnl: "+0.00",
        tone: "neutral"
      }
    ]);
  });

  test("builds compact portfolio paper order state history rows", () => {
    const rows = buildPortfolioPaperOrderStateHistoryRows([
      {
        schemaVersion: 1,
        baseRunId: "portfolio-run-state",
        batchId: "portfolio-paper-batch-state",
        portfolioName: "A-share state basket",
        generatedAt: "2026-05-27T09:00:00+00:00",
        mode: "portfolio_paper_order_state_history",
        summary: {
          orderCount: 1,
          eventCount: 4,
          approvedOrders: 1,
          rejectedOrders: 0,
          filledOrders: 1,
          liveBlockedEvents: 1,
          stateCounts: { live_blocked: 1 }
        },
        orders: [
          {
            batchId: "portfolio-paper-batch-state",
            baseRunId: "portfolio-run-state",
            portfolioName: "A-share state basket",
            orderId: "portfolio-paper-run-a-buy",
            symbol: "600000",
            sourceRunId: "run-a",
            side: "buy",
            quantity: 1000,
            notionalValue: 9200,
            originalStatus: "pending_review",
            riskStatus: "passed",
            currentState: "live_blocked",
            currentStateLabel: "Live route blocked",
            paperOnly: true,
            liveExecutionBlocked: true,
            events: [
              {
                eventId: "state-created",
                batchId: "portfolio-paper-batch-state",
                baseRunId: "portfolio-run-state",
                orderId: "portfolio-paper-run-a-buy",
                timestamp: "2026-05-27T08:30:00+00:00",
                state: "created",
                label: "Paper order created",
                actor: "portfolio_backtest",
                source: "portfolio_backtest",
                reason: "Created.",
                paperOnly: true,
                liveExecutionBlocked: true
              },
              {
                eventId: "state-filled",
                batchId: "portfolio-paper-batch-state",
                baseRunId: "portfolio-run-state",
                orderId: "portfolio-paper-run-a-buy",
                timestamp: "2026-05-27T08:46:00+00:00",
                state: "simulation_filled",
                label: "Paper simulation filled",
                actor: "operator-a",
                source: "paper-simulator",
                reason: "Filled.",
                paperOnly: true,
                liveExecutionBlocked: true
              },
              {
                eventId: "state-live-blocked",
                batchId: "portfolio-paper-batch-state",
                baseRunId: "portfolio-run-state",
                orderId: "portfolio-paper-run-a-buy",
                timestamp: "2026-05-27T08:46:00+00:00",
                state: "live_blocked",
                label: "Live route blocked",
                actor: "execution-guard",
                source: "live-route-guard",
                reason: "Live execution blocked.",
                paperOnly: true,
                liveExecutionBlocked: true
              }
            ]
          }
        ],
        paperOnly: true,
        liveExecutionBlocked: true
      }
    ]);

    expect(rows.map((row) => row.state)).toEqual(["live_blocked", "simulation_filled", "created"]);
    expect(rows[0]).toMatchObject({
      id: "state-live-blocked",
      symbol: "600000",
      orderId: "portfolio-paper-run-a-buy",
      label: "Live route blocked",
      actor: "execution-guard",
      tone: "risk"
    });
    expect(rows[1]).toMatchObject({
      state: "simulation_filled",
      tone: "positive",
      reason: "Filled."
    });
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

  test("builds execution adapter ledger rows from state events", () => {
    const rows = buildExecutionAdapterLedgerRows({
      schemaVersion: 1,
      generatedAt: "2026-06-07T09:31:00+00:00",
      mode: "execution_adapter_state_ledger",
      liveTradingAllowed: false,
      requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"],
      summary: {
        adapterCount: 2,
        liveAdapterCount: 1,
        certifiedLiveAdapters: 0,
        paperReadyAdapters: 1,
        blockedLiveAdapters: 1,
        configRequiredAdapters: 0,
        requiredGateCount: 3
      },
      adapters: [
        {
          id: "paper-local",
          market: "multi",
          adapter: "Paper Trading",
          route: "paper",
          status: "paper_ready",
          certification: "local",
          currentState: "paper_ready",
          liveTradingAllowed: false,
          note: "Paper only.",
          nextStep: "Use paper execution before live certification.",
          gates: [
            { id: "paper-order-risk", label: "Paper risk check", passed: true, reason: "Local risk checks are available." }
          ],
          events: [
            {
              eventId: "adapter-ledger:paper-local:paper_ready",
              adapterId: "paper-local",
              timestamp: "2026-06-07T09:31:00+00:00",
              state: "paper_ready",
              label: "Paper adapter ready",
              actor: "execution-safety",
              source: "settings-status",
              reason: "Paper execution is available locally.",
              liveTradingAllowed: false
            }
          ]
        },
        {
          id: "ashare-live",
          market: "ashare",
          adapter: "A-share broker adapter",
          route: "live",
          status: "blocked",
          certification: "interface_only",
          currentState: "blocked",
          liveTradingAllowed: false,
          note: "Real A-share trading stays blocked.",
          nextStep: "Keep live trading blocked until certification passes.",
          gates: [
            { id: "adapter-certified", label: "Adapter certified", passed: false, reason: "No certified adapter." }
          ],
          events: [
            {
              eventId: "adapter-ledger:ashare-live:live_blocked",
              adapterId: "ashare-live",
              timestamp: "2026-06-07T09:32:00+00:00",
              state: "live_blocked",
              label: "Live route blocked",
              actor: "execution-safety",
              source: "settings-status",
              reason: "Live execution remains blocked until gates pass.",
              liveTradingAllowed: false
            }
          ]
        }
      ]
    });

    expect(rows.map((row) => row.id)).toEqual([
      "adapter-ledger:ashare-live:live_blocked",
      "adapter-ledger:paper-local:paper_ready"
    ]);
    expect(rows[0]).toMatchObject({
      adapterId: "ashare-live",
      adapter: "A-share broker adapter",
      state: "live_blocked",
      route: "live",
      gateSummary: "0/1 gates",
      tone: "risk"
    });
    expect(rows[1]).toMatchObject({
      adapterId: "paper-local",
      state: "paper_ready",
      route: "paper",
      gateSummary: "1/1 gates",
      tone: "positive"
    });
  });

  test("builds compact execution adapter certification rows from persisted evidence", () => {
    const rows = buildExecutionAdapterCertificationRows([
      {
        schemaVersion: 1,
        certificationId: "adapter-certification-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        status: "blocked",
        operator: "local-operator",
        startedAt: "2026-06-08T08:00:00+00:00",
        completedAt: "2026-06-08T08:01:00+00:00",
        checks: [
          {
            id: "sandbox-credentials",
            label: "Sandbox credentials",
            status: "passed",
            detail: "Sandbox references are present.",
            metadata: { keyId: "paper-us-key", apiKey: "[redacted]" }
          },
          {
            id: "controlled-restart",
            label: "Controlled restart",
            status: "blocked",
            detail: "Controlled restart evidence is missing."
          }
        ],
        metadata: { source: "settings-panel", password: "[redacted]" },
        summary: {
          checkCount: 2,
          checkStatusCounts: { passed: 1, blocked: 1 },
          passedChecks: 1,
          blockedChecks: 1,
          failedChecks: 0,
          reviewChecks: 0
        },
        liveTradingAllowed: false,
        paperOnly: true
      }
    ]);

    expect(rows).toEqual([
      {
        id: "adapter-certification-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        timestamp: "2026-06-08T08:01:00+00:00",
        status: "blocked",
        statusLabel: "Blocked",
        checkSummary: "1 passed / 1 blocked / 2 checks",
        auditEventId: "adapter-certification-us-live",
        boundary: "Paper only · live trading blocked",
        liveTradingAllowed: false,
        tone: "risk"
      }
    ]);
    expect(JSON.stringify(rows)).not.toContain("apiKey");
    expect(JSON.stringify(rows)).not.toContain("password");
  });

  test("builds compact execution adapter certification apply rows from preflight results", () => {
    const rows = buildExecutionAdapterCertificationApplyRows([
      {
        schemaVersion: 1,
        applyId: "execution-adapter-certification-apply-us-live",
        certificationId: "adapter-certification-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        status: "blocked",
        operator: "settings-panel",
        generatedAt: "2026-06-08T08:02:00+00:00",
        applyMode: "manual_secret_store",
        restartRequired: false,
        requiredConfirmations: [
          { id: "secret-reference-stored", label: "Secret reference stored", status: "missing" },
          { id: "controlled-restart", label: "Controlled restart", status: "missing" },
          { id: "operator-review", label: "Operator review", status: "missing" }
        ],
        blockedReasons: [
          "secret_reference_not_confirmed",
          "controlled_restart_not_confirmed",
          "operator_review_not_confirmed"
        ],
        metadata: { source: "settings-panel", token: "[redacted]" },
        liveTradingAllowed: false,
        paperOnly: true
      }
    ]);

    expect(rows).toEqual([
      {
        id: "execution-adapter-certification-apply-us-live",
        certificationId: "adapter-certification-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        timestamp: "2026-06-08T08:02:00+00:00",
        status: "blocked",
        statusLabel: "Blocked",
        applyMode: "manual_secret_store",
        confirmationSummary: "0 confirmed / 3 missing",
        blockerSummary: "3 blockers",
        boundary: "Paper only · live trading blocked",
        restartRequired: false,
        auditEventId: "execution-adapter-certification-apply-us-live",
        tone: "risk"
      }
    ]);
    expect(JSON.stringify(rows)).not.toContain("token");
  });

  test("builds certification apply confirmation rows with stable payload keys", () => {
    const rows = buildExecutionAdapterCertificationApplyConfirmationRows({
      secretReferenceStored: true,
      controlledRestartWindowApproved: false,
      operatorReviewedCertification: true
    });

    expect(createDefaultExecutionAdapterCertificationApplyConfirmations()).toEqual({
      secretReferenceStored: false,
      controlledRestartWindowApproved: false,
      operatorReviewedCertification: false
    });
    expect(rows).toEqual([
      {
        id: "secret-reference-stored",
        key: "secretReferenceStored",
        label: "Secret-store reference saved",
        detail: "Confirm the real credential reference is stored outside this UI.",
        checked: true,
        tone: "positive"
      },
      {
        id: "controlled-restart-window-approved",
        key: "controlledRestartWindowApproved",
        label: "Controlled restart window approved",
        detail: "Confirm an operator-approved restart window exists before applying.",
        checked: false,
        tone: "neutral"
      },
      {
        id: "operator-reviewed-certification",
        key: "operatorReviewedCertification",
        label: "Operator reviewed certification",
        detail: "Confirm the certification evidence and restart impact were reviewed.",
        checked: true,
        tone: "positive"
      }
    ]);
  });

  test("builds compact controlled restart evidence rows from ledger results", () => {
    const rows = buildExecutionAdapterControlledRestartEvidenceRows([
      {
        schemaVersion: 1,
        evidenceId: "execution-adapter-controlled-restart-us-live",
        applyId: "execution-adapter-certification-apply-us-live",
        certificationId: "adapter-certification-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        status: "evidence_recorded",
        operator: "settings-panel",
        recordedAt: "2026-06-08T08:05:00+00:00",
        evidenceMode: "manual_controlled_restart",
        restartRequired: true,
        requiredConfirmations: [
          { id: "restart-window-executed", label: "Restart window", status: "confirmed" },
          { id: "rollback-plan-confirmed", label: "Rollback plan", status: "confirmed" },
          { id: "post-restart-validation-passed", label: "Validation", status: "confirmed" },
          { id: "operator-reviewed-restart-logs", label: "Log review", status: "confirmed" }
        ],
        blockedReasons: [],
        metadata: { source: "settings-panel", token: "[redacted]" },
        liveTradingAllowed: false,
        paperOnly: true
      }
    ]);

    expect(rows).toEqual([
      {
        id: "execution-adapter-controlled-restart-us-live",
        applyId: "execution-adapter-certification-apply-us-live",
        certificationId: "adapter-certification-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        timestamp: "2026-06-08T08:05:00+00:00",
        status: "evidence_recorded",
        statusLabel: "Evidence recorded",
        evidenceMode: "manual_controlled_restart",
        confirmationSummary: "4 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        restartRequired: true,
        auditEventId: "execution-adapter-controlled-restart-us-live",
        tone: "positive"
      }
    ]);
    expect(JSON.stringify(rows)).not.toContain("token");
  });

  test("builds compact restart acceptance rows from ledger results", () => {
    const rows = buildExecutionAdapterRestartAcceptanceRows([
      {
        schemaVersion: 1,
        acceptanceId: "execution-adapter-restart-acceptance-us-live",
        evidenceId: "execution-adapter-controlled-restart-us-live",
        applyId: "execution-adapter-certification-apply-us-live",
        certificationId: "adapter-certification-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        status: "acceptance_recorded",
        operator: "settings-panel",
        recordedAt: "2026-06-08T08:15:00+00:00",
        acceptanceMode: "manual_post_restart_acceptance",
        restartRequired: true,
        requiredConfirmations: [
          { id: "core-health-checked", label: "Core health", status: "confirmed" },
          { id: "settings-reload-observed", label: "Settings reload", status: "confirmed" },
          { id: "paper-route-handshake-passed", label: "Paper route", status: "confirmed" },
          { id: "emergency-stop-armed", label: "Emergency stop", status: "confirmed" },
          { id: "account-sync-dry-run-passed", label: "Account sync dry-run", status: "confirmed" }
        ],
        blockedReasons: [],
        metadata: { source: "settings-panel", token: "[redacted]" },
        liveTradingAllowed: false,
        paperOnly: true
      }
    ]);

    expect(rows).toEqual([
      {
        id: "execution-adapter-restart-acceptance-us-live",
        evidenceId: "execution-adapter-controlled-restart-us-live",
        applyId: "execution-adapter-certification-apply-us-live",
        certificationId: "adapter-certification-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        timestamp: "2026-06-08T08:15:00+00:00",
        status: "acceptance_recorded",
        statusLabel: "Acceptance recorded",
        acceptanceMode: "manual_post_restart_acceptance",
        confirmationSummary: "5 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        restartRequired: true,
        auditEventId: "execution-adapter-restart-acceptance-us-live",
        tone: "positive"
      }
    ]);
    expect(JSON.stringify(rows)).not.toContain("token");
  });

  test("builds compact secret reference rows from ledger results", () => {
    const rows = buildExecutionAdapterSecretReferenceRows([
      {
        schemaVersion: 1,
        referenceId: "execution-adapter-secret-reference-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        status: "reference_recorded",
        operator: "settings-panel",
        recordedAt: "2026-06-09T08:00:00+00:00",
        referenceName: "us-live/alpaca-sandbox",
        backend: "local-secret-store",
        requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
        requiredConfirmations: [
          { id: "reference-created-outside-ui", label: "Reference created outside UI", status: "confirmed" },
          { id: "operator-verified-fingerprint", label: "Fingerprint verified", status: "confirmed" },
          { id: "rotation-plan-documented", label: "Rotation plan documented", status: "confirmed" }
        ],
        blockedReasons: [],
        metadata: { source: "settings-panel", secret: "[redacted]" },
        liveTradingAllowed: false,
        paperOnly: true
      }
    ]);

    expect(rows).toEqual([
      {
        id: "execution-adapter-secret-reference-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        timestamp: "2026-06-09T08:00:00+00:00",
        status: "reference_recorded",
        statusLabel: "Reference recorded",
        referenceName: "us-live/alpaca-sandbox",
        backend: "local-secret-store",
        envVarSummary: "2 env vars",
        confirmationSummary: "3 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        auditEventId: "execution-adapter-secret-reference-us-live",
        tone: "positive"
      }
    ]);
    expect(JSON.stringify(rows)).not.toContain("[redacted]");
  });

  test("builds compact secret materialization rows from ledger results", () => {
    const rows = buildExecutionAdapterSecretMaterializationRows([
      {
        schemaVersion: 1,
        materializationId: "execution-adapter-secret-materialization-us-live",
        referenceId: "execution-adapter-secret-reference-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        status: "manifest_recorded",
        operator: "settings-panel",
        recordedAt: "2026-06-09T08:15:00+00:00",
        referenceName: "us-live/alpaca-sandbox",
        backend: "local-secret-store",
        manifestPath: "local-secret-store://us-live/alpaca-sandbox",
        materializationMode: "local_secret_store_manifest",
        requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
        requiredConfirmations: [
          { id: "local-secret-store-write-verified", label: "Local store write verified", status: "confirmed" },
          { id: "no-raw-secret-in-payload", label: "Raw secret boundary confirmed", status: "confirmed" },
          { id: "env-binding-plan-documented", label: "Env binding plan documented", status: "confirmed" },
          { id: "rollback-plan-documented", label: "Rollback plan documented", status: "confirmed" }
        ],
        blockedReasons: [],
        metadata: { secret: "[redacted]", fingerprint: "sha256:local-manifest" },
        liveTradingAllowed: false,
        paperOnly: true
      }
    ]);

    expect(rows).toEqual([
      {
        id: "execution-adapter-secret-materialization-us-live",
        referenceId: "execution-adapter-secret-reference-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        timestamp: "2026-06-09T08:15:00+00:00",
        status: "manifest_recorded",
        statusLabel: "Manifest recorded",
        referenceName: "us-live/alpaca-sandbox",
        backend: "local-secret-store",
        manifestPath: "local-secret-store://us-live/alpaca-sandbox",
        materializationMode: "local_secret_store_manifest",
        envVarSummary: "2 env vars",
        confirmationSummary: "4 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        auditEventId: "execution-adapter-secret-materialization-us-live",
        tone: "positive"
      }
    ]);
    expect(JSON.stringify(rows)).not.toContain("[redacted]");
  });

  test("builds compact environment binding rows from ledger results", () => {
    const rows = buildExecutionAdapterEnvironmentBindingRows([
      {
        schemaVersion: 1,
        bindingId: "execution-adapter-environment-binding-us-live",
        materializationId: "execution-adapter-secret-materialization-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        status: "binding_recorded",
        operator: "settings-panel",
        recordedAt: "2026-06-09T08:20:00+00:00",
        bindingMode: "container_env_reference",
        manifestPath: "local-secret-store://us-live/alpaca-sandbox",
        requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
        requiredConfirmations: [
          { id: "runtime-env-mapping-verified", label: "Runtime env mapping verified", status: "confirmed" },
          { id: "config-reload-plan-documented", label: "Config reload plan documented", status: "confirmed" },
          { id: "no-raw-secret-in-payload", label: "Raw secret boundary confirmed", status: "confirmed" },
          { id: "rollback-snapshot-recorded", label: "Rollback snapshot recorded", status: "confirmed" }
        ],
        blockedReasons: [],
        metadata: { secret: "[redacted]", fingerprint: "sha256:env-binding" },
        liveTradingAllowed: false,
        paperOnly: true
      }
    ]);

    expect(rows).toEqual([
      {
        id: "execution-adapter-environment-binding-us-live",
        materializationId: "execution-adapter-secret-materialization-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        timestamp: "2026-06-09T08:20:00+00:00",
        status: "binding_recorded",
        statusLabel: "Binding recorded",
        bindingMode: "container_env_reference",
        manifestPath: "local-secret-store://us-live/alpaca-sandbox",
        envVarSummary: "2 env vars",
        confirmationSummary: "4 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        auditEventId: "execution-adapter-environment-binding-us-live",
        tone: "positive"
      }
    ]);
    expect(JSON.stringify(rows)).not.toContain("[redacted]");
  });

  test("builds compact runtime reload plan rows from ledger results", () => {
    const rows = buildExecutionAdapterRuntimeReloadPlanRows([
      {
        schemaVersion: 1,
        planId: "execution-adapter-runtime-reload-plan-us-live",
        bindingId: "execution-adapter-environment-binding-us-live",
        materializationId: "execution-adapter-secret-materialization-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        status: "plan_recorded",
        operator: "settings-panel",
        recordedAt: "2026-06-09T08:30:00+00:00",
        reloadMode: "manual_container_reload_plan",
        maintenanceWindowId: "window-us-live-1",
        bindingMode: "container_env_reference",
        manifestPath: "local-secret-store://us-live/alpaca-sandbox",
        requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
        requiredConfirmations: [
          { id: "maintenance-window-approved", label: "Maintenance window approved", status: "confirmed" },
          { id: "health-baseline-captured", label: "Health baseline captured", status: "confirmed" },
          { id: "config-diff-reviewed", label: "Config diff reviewed", status: "confirmed" },
          { id: "post-reload-smoke-plan-documented", label: "Post reload smoke plan", status: "confirmed" },
          { id: "rollback-owner-assigned", label: "Rollback owner assigned", status: "confirmed" }
        ],
        blockedReasons: [],
        metadata: { token: "[redacted]", fingerprint: "sha256:runtime-reload" },
        liveTradingAllowed: false,
        paperOnly: true
      }
    ]);

    expect(rows).toEqual([
      {
        id: "execution-adapter-runtime-reload-plan-us-live",
        bindingId: "execution-adapter-environment-binding-us-live",
        materializationId: "execution-adapter-secret-materialization-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        timestamp: "2026-06-09T08:30:00+00:00",
        status: "plan_recorded",
        statusLabel: "Plan recorded",
        reloadMode: "manual_container_reload_plan",
        maintenanceWindowId: "window-us-live-1",
        bindingMode: "container_env_reference",
        manifestPath: "local-secret-store://us-live/alpaca-sandbox",
        envVarSummary: "2 env vars",
        confirmationSummary: "5 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        auditEventId: "execution-adapter-runtime-reload-plan-us-live",
        tone: "positive"
      }
    ]);
    expect(JSON.stringify(rows)).not.toContain("[redacted]");
  });

  test("builds compact runtime reload execution rows from ledger results", () => {
    const rows = buildExecutionAdapterRuntimeReloadExecutionRows([
      {
        schemaVersion: 1,
        executionId: "execution-adapter-runtime-reload-execution-us-live",
        planId: "execution-adapter-runtime-reload-plan-us-live",
        bindingId: "execution-adapter-environment-binding-us-live",
        materializationId: "execution-adapter-secret-materialization-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        status: "execution_recorded",
        operator: "settings-panel",
        recordedAt: "2026-06-09T08:45:00+00:00",
        executionMode: "manual_controlled_reload",
        reloadMode: "manual_container_reload_plan",
        maintenanceWindowId: "window-us-live-1",
        bindingMode: "container_env_reference",
        manifestPath: "local-secret-store://us-live/alpaca-sandbox",
        requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
        requiredConfirmations: [
          { id: "pre-reload-health-verified", label: "Pre reload health verified", status: "confirmed" },
          { id: "reload-action-recorded", label: "Reload action recorded", status: "confirmed" },
          { id: "post-reload-smoke-passed", label: "Post reload smoke passed", status: "confirmed" },
          { id: "rollback-readiness-confirmed", label: "Rollback readiness confirmed", status: "confirmed" },
          { id: "operator-confirmed-live-blocked", label: "Live route remains blocked", status: "confirmed" }
        ],
        blockedReasons: [],
        metadata: { token: "[redacted]", fingerprint: "sha256:runtime-reload-execution" },
        liveTradingAllowed: false,
        paperOnly: true
      }
    ]);

    expect(rows).toEqual([
      {
        id: "execution-adapter-runtime-reload-execution-us-live",
        planId: "execution-adapter-runtime-reload-plan-us-live",
        bindingId: "execution-adapter-environment-binding-us-live",
        materializationId: "execution-adapter-secret-materialization-us-live",
        adapterId: "us-live",
        market: "us",
        route: "live",
        timestamp: "2026-06-09T08:45:00+00:00",
        status: "execution_recorded",
        statusLabel: "Execution recorded",
        executionMode: "manual_controlled_reload",
        reloadMode: "manual_container_reload_plan",
        maintenanceWindowId: "window-us-live-1",
        bindingMode: "container_env_reference",
        manifestPath: "local-secret-store://us-live/alpaca-sandbox",
        envVarSummary: "2 env vars",
        confirmationSummary: "5 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        auditEventId: "execution-adapter-runtime-reload-execution-us-live",
        tone: "positive"
      }
    ]);
    expect(JSON.stringify(rows)).not.toContain("[redacted]");
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

  test("keeps promotion blocked while surfacing recent adapter certification evidence", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-promotion-cert-evidence",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-promotion-cert-evidence",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 }
    });
    const execution = {
      executionId: "paper-promotion-cert-evidence",
      runId: "run-promotion-cert-evidence",
      createdAt: "2026-05-26T08:00:00+00:00",
      mode: "paper_only",
      account: {
        cash: 80_659,
        equity: 100_000,
        positions: { "600000": 2100 }
      },
      orders: [
        {
          orderId: "order-promotion-cert-evidence",
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
    const certificationRows = [
      {
        id: "adapter-certification-ashare-live",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-08T08:01:00+00:00",
        status: "blocked" as const,
        statusLabel: "Blocked",
        checkSummary: "1 passed / 2 blocked / 1 review / 4 checks",
        auditEventId: "adapter-certification-ashare-live",
        boundary: "Paper only · live trading blocked",
        liveTradingAllowed: false,
        tone: "risk" as const
      }
    ];

    const readiness = buildPromotionReadiness(workspace, execution, buildBrokerAdapterRows(workspace), certificationRows);

    expect(readiness.status).toBe("certification_pending");
    expect(readiness.stages.find((stage) => stage.id === "adapter-certification")).toMatchObject({
      value: "Blocked · ashare-live",
      status: "blocked",
      tone: "risk",
      detail:
        "Latest certification adapter-certification-ashare-live: 1 passed / 2 blocked / 1 review / 4 checks · Paper only · live trading blocked."
    });
  });

  test("requires workspace gates and human confirmation even after a positive adapter certification", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-promotion-cert-positive",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-promotion-cert-positive",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 }
    });
    const execution = {
      executionId: "paper-promotion-cert-positive",
      runId: "run-promotion-cert-positive",
      createdAt: "2026-05-26T08:00:00+00:00",
      mode: "paper_only",
      account: {
        cash: 80_659,
        equity: 100_000,
        positions: { "600000": 2100 }
      },
      orders: [
        {
          orderId: "order-promotion-cert-positive",
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
    const brokerRows = buildBrokerAdapterRows(workspace).map((row) =>
      row.id === "ashare-live" ? { ...row, status: "paper_ready" as const } : row
    );
    const certificationRows = [
      {
        id: "adapter-certification-ashare-positive",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-08T08:01:00+00:00",
        status: "passed" as const,
        statusLabel: "Passed",
        checkSummary: "4 passed / 4 checks",
        auditEventId: "adapter-certification-ashare-positive",
        boundary: "Live trading allowed",
        liveTradingAllowed: true,
        tone: "positive" as const
      }
    ];

    const readiness = buildPromotionReadiness(workspace, execution, brokerRows, certificationRows);

    expect(readiness.status).toBe("certification_pending");
    expect(readiness.stages.find((stage) => stage.id === "adapter-certification")).toMatchObject({
      value: "Passed · ashare-live",
      status: "blocked",
      tone: "warning",
      detail:
        "Latest certification adapter-certification-ashare-positive: 4 passed / 4 checks · Live trading allowed. Workspace adapter gate is still blocked."
    });
    expect(readiness.stages.find((stage) => stage.id === "human-confirmation")).toMatchObject({
      status: "blocked"
    });
  });

  test("binds certification apply preflight evidence into the promotion adapter stage", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-promotion-apply-evidence",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-promotion-apply-evidence",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 }
    });
    const execution = {
      executionId: "paper-promotion-apply-evidence",
      runId: "run-promotion-apply-evidence",
      createdAt: "2026-05-26T08:00:00+00:00",
      mode: "paper_only",
      account: {
        cash: 80_659,
        equity: 100_000,
        positions: { "600000": 2100 }
      },
      orders: [
        {
          orderId: "order-promotion-apply-evidence",
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
    const brokerRows = buildBrokerAdapterRows(workspace).map((row) =>
      row.id === "ashare-live" ? { ...row, status: "paper_ready" as const } : row
    );
    const certificationRows = [
      {
        id: "adapter-certification-ashare-apply",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-08T08:01:00+00:00",
        status: "passed" as const,
        statusLabel: "Passed",
        checkSummary: "4 passed / 4 checks",
        auditEventId: "adapter-certification-ashare-apply",
        boundary: "Live trading allowed",
        liveTradingAllowed: true,
        tone: "positive" as const
      }
    ];
    const applyRows = [
      {
        id: "execution-adapter-certification-apply-ashare-ready",
        certificationId: "adapter-certification-ashare-apply",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-08T08:03:00+00:00",
        status: "ready_for_restart" as const,
        statusLabel: "Ready for restart",
        applyMode: "manual_secret_store",
        confirmationSummary: "3 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        restartRequired: true,
        auditEventId: "execution-adapter-certification-apply-ashare-ready",
        tone: "positive" as const
      }
    ];

    const readiness = buildPromotionReadiness(workspace, execution, brokerRows, certificationRows, applyRows);

    expect(readiness.status).toBe("certification_pending");
    expect(readiness.stages.find((stage) => stage.id === "adapter-certification")).toMatchObject({
      value: "Ready for restart · ashare-live",
      status: "blocked",
      tone: "warning",
      detail:
        "Latest certification adapter-certification-ashare-apply: 4 passed / 4 checks · Live trading allowed. Latest apply execution-adapter-certification-apply-ashare-ready: Ready for restart · 3 confirmed / 0 missing · No blockers · Paper only · live trading blocked. Controlled restart evidence is still required before live routing."
    });
  });

  test("keeps promotion blocked after controlled restart evidence is recorded", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-promotion-restart-evidence",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-promotion-restart-evidence",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      strategyConfig: {
        name: "SMA Trend / Bank Sector",
        revision: "rev-promotion-restart-evidence",
        market: "ashare",
        symbols: ["600000"],
        timeframe: "1d",
        version: 1,
        entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
        exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
        risk: {
          positionPct: 0.2,
          stopLossPct: 0.08,
          takeProfitPct: 0.12,
          maxDrawdownPct: 0.12
        }
      }
    });
    const execution = {
      executionId: "paper-execution-promotion-restart-evidence",
      runId: "run-promotion-restart-evidence",
      createdAt: "2026-05-26T08:05:00+00:00",
      mode: "paper",
      account: {
        cash: 80_659,
        equity: 100_000,
        positions: { "600000": 2100 }
      },
      orders: [
        {
          orderId: "order-promotion-restart-evidence",
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
    const brokerRows = buildBrokerAdapterRows(workspace).map((row) =>
      row.id === "ashare-live" ? { ...row, status: "paper_ready" as const } : row
    );
    const certificationRows = [
      {
        id: "adapter-certification-ashare-restart",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-08T08:01:00+00:00",
        status: "passed" as const,
        statusLabel: "Passed",
        checkSummary: "4 passed / 4 checks",
        auditEventId: "adapter-certification-ashare-restart",
        boundary: "Live trading allowed",
        liveTradingAllowed: true,
        tone: "positive" as const
      }
    ];
    const applyRows = [
      {
        id: "execution-adapter-certification-apply-ashare-restart",
        certificationId: "adapter-certification-ashare-restart",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-08T08:03:00+00:00",
        status: "ready_for_restart" as const,
        statusLabel: "Ready for restart",
        applyMode: "manual_secret_store",
        confirmationSummary: "3 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        restartRequired: true,
        auditEventId: "execution-adapter-certification-apply-ashare-restart",
        tone: "positive" as const
      }
    ];
    const restartEvidenceRows = [
      {
        id: "execution-adapter-controlled-restart-ashare-recorded",
        applyId: "execution-adapter-certification-apply-ashare-restart",
        certificationId: "adapter-certification-ashare-restart",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-08T08:06:00+00:00",
        status: "evidence_recorded" as const,
        statusLabel: "Evidence recorded",
        evidenceMode: "manual_controlled_restart",
        confirmationSummary: "4 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        restartRequired: true,
        auditEventId: "execution-adapter-controlled-restart-ashare-recorded",
        tone: "positive" as const
      }
    ];

    const readiness = buildPromotionReadiness(
      workspace,
      execution,
      brokerRows,
      certificationRows,
      applyRows,
      restartEvidenceRows
    );

    expect(readiness.status).toBe("certification_pending");
    expect(readiness.stages.find((stage) => stage.id === "adapter-certification")).toMatchObject({
      value: "Evidence recorded · ashare-live",
      status: "blocked",
      tone: "warning",
      detail:
        "Latest certification adapter-certification-ashare-restart: 4 passed / 4 checks · Live trading allowed. Latest apply execution-adapter-certification-apply-ashare-restart: Ready for restart · 3 confirmed / 0 missing · No blockers · Paper only · live trading blocked. Latest restart evidence execution-adapter-controlled-restart-ashare-recorded: Evidence recorded · 4 confirmed / 0 missing · No blockers · Paper only · live trading blocked. Controlled restart evidence is recorded; live routing remains blocked until controlled orchestration and human confirmation pass."
    });
  });

  test("keeps promotion blocked after restart acceptance is recorded", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-promotion-restart-acceptance",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-promotion-restart-acceptance",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      strategyConfig: {
        name: "SMA Trend / Bank Sector",
        revision: "rev-promotion-restart-acceptance",
        market: "ashare",
        symbols: ["600000"],
        timeframe: "1d",
        version: 1,
        entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
        exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
        risk: {
          positionPct: 0.2,
          stopLossPct: 0.08,
          takeProfitPct: 0.12,
          maxDrawdownPct: 0.12
        }
      }
    });
    const execution = {
      executionId: "paper-execution-promotion-restart-acceptance",
      runId: "run-promotion-restart-acceptance",
      createdAt: "2026-05-26T08:05:00+00:00",
      mode: "paper",
      account: {
        cash: 80_659,
        equity: 100_000,
        positions: { "600000": 2100 }
      },
      orders: [
        {
          orderId: "order-promotion-restart-acceptance",
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
    const brokerRows = buildBrokerAdapterRows(workspace).map((row) =>
      row.id === "ashare-live" ? { ...row, status: "paper_ready" as const } : row
    );
    const certificationRows = [
      {
        id: "adapter-certification-ashare-acceptance",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-08T08:01:00+00:00",
        status: "passed" as const,
        statusLabel: "Passed",
        checkSummary: "4 passed / 4 checks",
        auditEventId: "adapter-certification-ashare-acceptance",
        boundary: "Live trading allowed",
        liveTradingAllowed: true,
        tone: "positive" as const
      }
    ];
    const applyRows = [
      {
        id: "execution-adapter-certification-apply-ashare-acceptance",
        certificationId: "adapter-certification-ashare-acceptance",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-08T08:03:00+00:00",
        status: "ready_for_restart" as const,
        statusLabel: "Ready for restart",
        applyMode: "manual_secret_store",
        confirmationSummary: "3 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        restartRequired: true,
        auditEventId: "execution-adapter-certification-apply-ashare-acceptance",
        tone: "positive" as const
      }
    ];
    const restartEvidenceRows = [
      {
        id: "execution-adapter-controlled-restart-ashare-acceptance",
        applyId: "execution-adapter-certification-apply-ashare-acceptance",
        certificationId: "adapter-certification-ashare-acceptance",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-08T08:06:00+00:00",
        status: "evidence_recorded" as const,
        statusLabel: "Evidence recorded",
        evidenceMode: "manual_controlled_restart",
        confirmationSummary: "4 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        restartRequired: true,
        auditEventId: "execution-adapter-controlled-restart-ashare-acceptance",
        tone: "positive" as const
      }
    ];
    const acceptanceRows = [
      {
        id: "execution-adapter-restart-acceptance-ashare-recorded",
        evidenceId: "execution-adapter-controlled-restart-ashare-acceptance",
        applyId: "execution-adapter-certification-apply-ashare-acceptance",
        certificationId: "adapter-certification-ashare-acceptance",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-08T08:15:00+00:00",
        status: "acceptance_recorded" as const,
        statusLabel: "Acceptance recorded",
        acceptanceMode: "manual_post_restart_acceptance",
        confirmationSummary: "5 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        restartRequired: true,
        auditEventId: "execution-adapter-restart-acceptance-ashare-recorded",
        tone: "positive" as const
      }
    ];

    const readiness = buildPromotionReadiness(
      workspace,
      execution,
      brokerRows,
      certificationRows,
      applyRows,
      restartEvidenceRows,
      acceptanceRows
    );

    expect(readiness.status).toBe("certification_pending");
    expect(readiness.stages.find((stage) => stage.id === "adapter-certification")).toMatchObject({
      value: "Acceptance recorded · ashare-live",
      status: "blocked",
      tone: "warning",
      detail:
        "Latest certification adapter-certification-ashare-acceptance: 4 passed / 4 checks · Live trading allowed. Latest apply execution-adapter-certification-apply-ashare-acceptance: Ready for restart · 3 confirmed / 0 missing · No blockers · Paper only · live trading blocked. Latest restart evidence execution-adapter-controlled-restart-ashare-acceptance: Evidence recorded · 4 confirmed / 0 missing · No blockers · Paper only · live trading blocked. Latest restart acceptance execution-adapter-restart-acceptance-ashare-recorded: Acceptance recorded · 5 confirmed / 0 missing · No blockers · Paper only · live trading blocked. Post-restart acceptance is recorded; live routing remains blocked until real adapter orchestration and human confirmation pass."
    });
  });

  test("keeps promotion blocked after secret materialization manifest is recorded", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-promotion-secret-materialization",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-promotion-secret-materialization",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 }
    });
    const execution = {
      executionId: "paper-execution-promotion-secret-materialization",
      runId: "run-promotion-secret-materialization",
      createdAt: "2026-05-26T08:05:00+00:00",
      mode: "paper",
      account: {
        cash: 80_659,
        equity: 100_000,
        positions: { "600000": 2100 }
      },
      orders: [
        {
          orderId: "order-promotion-secret-materialization",
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
    const brokerRows = buildBrokerAdapterRows(workspace).map((row) =>
      row.id === "ashare-live" ? { ...row, status: "paper_ready" as const } : row
    );
    const certificationRows = [
      {
        id: "adapter-certification-ashare-materialized",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-08T08:01:00+00:00",
        status: "passed" as const,
        statusLabel: "Passed",
        checkSummary: "4 passed / 4 checks",
        auditEventId: "adapter-certification-ashare-materialized",
        boundary: "Live trading allowed",
        liveTradingAllowed: true,
        tone: "positive" as const
      }
    ];
    const secretReferenceRows = [
      {
        id: "execution-adapter-secret-reference-ashare-live",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-09T08:00:00+00:00",
        status: "reference_recorded" as const,
        statusLabel: "Reference recorded",
        referenceName: "ashare-live/broker-vault",
        backend: "local-secret-store",
        envVarSummary: "2 env vars",
        confirmationSummary: "3 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        auditEventId: "execution-adapter-secret-reference-ashare-live",
        tone: "positive" as const
      }
    ];
    const secretMaterializationRows = [
      {
        id: "execution-adapter-secret-materialization-ashare-live",
        referenceId: "execution-adapter-secret-reference-ashare-live",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-09T08:15:00+00:00",
        status: "manifest_recorded" as const,
        statusLabel: "Manifest recorded",
        referenceName: "ashare-live/broker-vault",
        backend: "local-secret-store",
        manifestPath: "local-secret-store://ashare-live/broker-vault",
        materializationMode: "local_secret_store_manifest",
        envVarSummary: "2 env vars",
        confirmationSummary: "4 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        auditEventId: "execution-adapter-secret-materialization-ashare-live",
        tone: "positive" as const
      }
    ];
    const environmentBindingRows = [
      {
        id: "execution-adapter-environment-binding-ashare-live",
        materializationId: "execution-adapter-secret-materialization-ashare-live",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-09T08:30:00+00:00",
        status: "binding_recorded" as const,
        statusLabel: "Binding recorded",
        bindingMode: "local_runtime_env",
        manifestPath: "local-secret-store://ashare-live/broker-vault",
        envVarSummary: "2 env vars",
        confirmationSummary: "4 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        auditEventId: "execution-adapter-environment-binding-ashare-live",
        tone: "positive" as const
      }
    ];
    const runtimeReloadPlanRows = [
      {
        id: "execution-adapter-runtime-reload-plan-ashare-live",
        bindingId: "execution-adapter-environment-binding-ashare-live",
        materializationId: "execution-adapter-secret-materialization-ashare-live",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-09T08:45:00+00:00",
        status: "plan_recorded" as const,
        statusLabel: "Plan recorded",
        reloadMode: "manual_runtime_reload",
        maintenanceWindowId: "maintenance-2026-06-10",
        bindingMode: "local_runtime_env",
        manifestPath: "local-secret-store://ashare-live/broker-vault",
        envVarSummary: "2 env vars",
        confirmationSummary: "5 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        auditEventId: "execution-adapter-runtime-reload-plan-ashare-live",
        tone: "positive" as const
      }
    ];

    const readiness = buildPromotionReadiness(
      workspace,
      execution,
      brokerRows,
      certificationRows,
      [],
      [],
      [],
      secretReferenceRows,
      secretMaterializationRows,
      environmentBindingRows,
      runtimeReloadPlanRows
    );

    expect(readiness.status).toBe("certification_pending");
    expect(readiness.stages.find((stage) => stage.id === "adapter-certification")).toMatchObject({
      value: "Passed · ashare-live",
      status: "blocked",
      tone: "warning",
      detail:
        "Latest secret reference execution-adapter-secret-reference-ashare-live: Reference recorded · 3 confirmed / 0 missing · No blockers · local-secret-store · 2 env vars · Paper only · live trading blocked. Latest secret materialization execution-adapter-secret-materialization-ashare-live: Manifest recorded · 4 confirmed / 0 missing · No blockers · local-secret-store · 2 env vars · Paper only · live trading blocked. Secret materialization manifest is recorded; live routing remains blocked until env writes, restart orchestration, and human confirmation pass. Latest environment binding execution-adapter-environment-binding-ashare-live: Binding recorded · 4 confirmed / 0 missing · No blockers · local_runtime_env · 2 env vars · Paper only · live trading blocked. Environment binding is recorded; live routing remains blocked until runtime reload orchestration and human confirmation pass. Latest runtime reload plan execution-adapter-runtime-reload-plan-ashare-live: Plan recorded · 5 confirmed / 0 missing · No blockers · manual_runtime_reload · maintenance-2026-06-10 · Paper only · live trading blocked. Runtime reload plan is recorded; live routing remains blocked until controlled reload execution, acceptance, and human confirmation pass. Latest certification adapter-certification-ashare-materialized: 4 passed / 4 checks · Live trading allowed. Workspace adapter gate is still blocked."
    });
  });

  test("surfaces controlled runtime reload execution evidence in promotion readiness", () => {
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-promotion-runtime-reload-execution",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-promotion-runtime-reload-execution",
      dataRows: 240,
      metrics: { total_return_pct: 12.4, max_drawdown_pct: 5.8, win_rate_pct: 51, trade_count: 42 },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 }
    });
    const execution = {
      executionId: "paper-promotion-runtime-reload-execution",
      runId: "run-promotion-runtime-reload-execution",
      createdAt: "2026-05-26T08:00:00+00:00",
      mode: "paper_only",
      account: {
        cash: 80_659,
        equity: 100_000,
        positions: { "600000": 2100 }
      },
      orders: [
        {
          orderId: "order-promotion-runtime-reload-execution",
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
    const brokerRows = [
      ...buildBrokerAdapterRows(workspace),
      {
        id: "ashare-live",
        market: "ashare" as const,
        adapter: "A-share live adapter",
        route: "live" as const,
        label: "A-share live adapter",
        provider: "broker-gateway",
        status: "paper_ready" as const,
        statusLabel: "Paper ready",
        certification: "passed",
        latency: "manual",
        nextStep: "Keep live route blocked until final confirmation.",
        risk: "blocked",
        detail: "Live route remains blocked until every execution evidence layer is present.",
        tone: "warning" as const
      }
    ];
    const certificationRows = [
      {
        id: "adapter-certification-ashare-runtime-reload-execution",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-09T08:00:00+00:00",
        status: "passed" as const,
        statusLabel: "Passed",
        checkSummary: "4 passed / 4 checks",
        auditEventId: "adapter-certification-ashare-runtime-reload-execution",
        boundary: "Live trading allowed",
        liveTradingAllowed: true,
        tone: "positive" as const
      }
    ];
    const secretMaterializationRows = [
      {
        id: "execution-adapter-secret-materialization-ashare-live",
        referenceId: "execution-adapter-secret-reference-ashare-live",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-09T08:15:00+00:00",
        status: "manifest_recorded" as const,
        statusLabel: "Manifest recorded",
        referenceName: "ashare-live/broker-vault",
        backend: "local-secret-store",
        manifestPath: "local-secret-store://ashare-live/broker-vault",
        materializationMode: "local_secret_store_manifest",
        envVarSummary: "2 env vars",
        confirmationSummary: "4 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        auditEventId: "execution-adapter-secret-materialization-ashare-live",
        tone: "positive" as const
      }
    ];
    const environmentBindingRows = [
      {
        id: "execution-adapter-environment-binding-ashare-live",
        materializationId: "execution-adapter-secret-materialization-ashare-live",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-09T08:30:00+00:00",
        status: "binding_recorded" as const,
        statusLabel: "Binding recorded",
        bindingMode: "local_runtime_env",
        manifestPath: "local-secret-store://ashare-live/broker-vault",
        envVarSummary: "2 env vars",
        confirmationSummary: "4 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        auditEventId: "execution-adapter-environment-binding-ashare-live",
        tone: "positive" as const
      }
    ];
    const runtimeReloadPlanRows = [
      {
        id: "execution-adapter-runtime-reload-plan-ashare-live",
        bindingId: "execution-adapter-environment-binding-ashare-live",
        materializationId: "execution-adapter-secret-materialization-ashare-live",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-09T08:45:00+00:00",
        status: "plan_recorded" as const,
        statusLabel: "Plan recorded",
        reloadMode: "manual_runtime_reload",
        maintenanceWindowId: "maintenance-2026-06-10",
        bindingMode: "local_runtime_env",
        manifestPath: "local-secret-store://ashare-live/broker-vault",
        envVarSummary: "2 env vars",
        confirmationSummary: "5 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        auditEventId: "execution-adapter-runtime-reload-plan-ashare-live",
        tone: "positive" as const
      }
    ];
    const runtimeReloadExecutionRows = [
      {
        id: "execution-adapter-runtime-reload-execution-ashare-live",
        planId: "execution-adapter-runtime-reload-plan-ashare-live",
        bindingId: "execution-adapter-environment-binding-ashare-live",
        materializationId: "execution-adapter-secret-materialization-ashare-live",
        adapterId: "ashare-live",
        market: "ashare" as const,
        route: "live" as const,
        timestamp: "2026-06-09T09:00:00+00:00",
        status: "execution_recorded" as const,
        statusLabel: "Execution recorded",
        executionMode: "manual_controlled_reload",
        reloadMode: "manual_runtime_reload",
        maintenanceWindowId: "maintenance-2026-06-10",
        bindingMode: "local_runtime_env",
        manifestPath: "local-secret-store://ashare-live/broker-vault",
        envVarSummary: "2 env vars",
        confirmationSummary: "5 confirmed / 0 missing",
        blockerSummary: "No blockers",
        boundary: "Paper only · live trading blocked",
        auditEventId: "execution-adapter-runtime-reload-execution-ashare-live",
        tone: "positive" as const
      }
    ];

    const readiness = buildPromotionReadiness(
      workspace,
      execution,
      brokerRows,
      certificationRows,
      [],
      [],
      [],
      [],
      secretMaterializationRows,
      environmentBindingRows,
      runtimeReloadPlanRows,
      runtimeReloadExecutionRows
    );

    const adapterStage = readiness.stages.find((stage) => stage.id === "adapter-certification");
    expect(readiness.status).toBe("certification_pending");
    expect(adapterStage).toMatchObject({
      value: "Execution recorded · ashare-live",
      status: "blocked",
      tone: "warning"
    });
    expect(adapterStage?.detail).toContain(
      "Latest runtime reload execution execution-adapter-runtime-reload-execution-ashare-live: Execution recorded · 5 confirmed / 0 missing · No blockers · manual_controlled_reload · manual_runtime_reload · maintenance-2026-06-10 · Paper only · live trading blocked. Runtime reload execution evidence is recorded; live routing remains blocked until post-reload acceptance, real adapter orchestration, and human confirmation pass."
    );
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
        ],
        preparationEvidence: {
          kind: "watchlist_cache_refresh",
          runId: "cache-refresh-report-md",
          createdAt: "2026-05-28T08:05:00+00:00",
          market: "ashare",
          symbol: "600000",
          name: "浦发银行",
          timeframe: "1d",
          status: "refreshed",
          requestedLimit: 240,
          upsertedRows: 240,
          quality: {
            source: "tencent",
            isComplete: true,
            warnings: [],
            rows: 240
          },
          error: null
        }
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
    expect(markdown).toContain(
      "| Preparation evidence | cache-refresh-report-md · watchlist_cache_refresh · 600000 1d · tencent complete · 240 rows cached |"
    );
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

  test("includes the like-for-like run comparison matrix in markdown backtest reports", () => {
    const currentRun = auditedRunFixture({
      createdAt: "2026-05-26T08:00:00+00:00",
      drawdown: 4,
      returnPct: 5,
      runId: "run-md-current",
      strategyRevision: "rev-md-current",
      tradeCount: 8
    });
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), currentRun);
    const runHistory: ResearchRunAudit[] = [
      currentRun,
      auditedRunFixture({
        createdAt: "2026-05-25T08:00:00+00:00",
        drawdown: 6,
        returnPct: 2,
        runId: "run-md-previous",
        source: "local-cache",
        strategyRevision: "rev-md-previous",
        warnings: ["upstream unavailable"]
      }),
      auditedRunFixture({
        createdAt: "2026-05-24T08:00:00+00:00",
        drawdown: 9,
        returnPct: 8,
        runId: "run-md-best",
        strategyRevision: "rev-md-best",
        tradeCount: 12
      }),
      auditedRunFixture({
        createdAt: "2026-05-23T08:00:00+00:00",
        drawdown: 2,
        returnPct: 3,
        runId: "run-md-lowdd",
        strategyRevision: "rev-md-lowdd"
      }),
      auditedRunFixture({
        market: "us",
        runId: "run-md-other",
        symbol: "AAPL",
        returnPct: 40,
        strategyRevision: "rev-md-other"
      })
    ];

    const markdown = buildBacktestReportMarkdown(workspace, runHistory);

    expect(markdown).toContain("## Run Comparison Matrix");
    expect(markdown).toContain("4 comparable audited runs");
    expect(markdown).toContain("| run-md-current | current | +5.00% | 4.00% |");
    expect(markdown).toContain("| run-md-previous | previous_run | +2.00% | 6.00% |");
    expect(markdown).toContain("| run-md-best | best_return | +8.00% | 9.00% |");
    expect(markdown).toContain("| run-md-lowdd | lowest_drawdown | +3.00% | 2.00% |");
    expect(markdown).not.toContain("run-md-other");
    expect(markdown).toContain("local-cache complete · 1 warning");
    expect(markdown).toContain("historical audited evidence only, not investment advice");
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

  test("warns instead of explaining when audited evidence belongs to another context", () => {
    const auditedWorkspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), {
      runId: "run-ai-mismatch",
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
      decisions: [],
      executionMode: "paper_only"
    });
    const mismatchedWorkspace: TerminalWorkspace = {
      ...auditedWorkspace,
      selectedTimeframe: "5m"
    };

    const workspace = workspaceWithAiAction(mismatchedWorkspace, "explain");
    const state = buildAiActionWorkflowState(workspace, "explain");

    expect(workspace.decisionLog[0]).toEqual({
      agent: "AI Review Gate",
      message:
        "AI explanation blocked for 600000: Audited run run-ai-mismatch belongs to ASHARE · 600000 · 1d, not ASHARE · 600000 · 5m.",
      tone: "warning"
    });
    expect(state.activeStageId).toBe("backtest");
    expect(state.log.at(-1)?.message).toBe(
      "AI explanation blocked for 600000: Audited run run-ai-mismatch belongs to ASHARE · 600000 · 1d, not ASHARE · 600000 · 5m."
    );
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

  test("builds a like-for-like backtest run comparison matrix for the selected audit context", () => {
    const runs: ResearchRunAudit[] = [
      auditedRunFixture({
        createdAt: "2026-05-26T08:00:00+00:00",
        drawdown: 4,
        returnPct: 5,
        runId: "run-current",
        strategyRevision: "rev-current",
        tradeCount: 8
      }),
      auditedRunFixture({
        createdAt: "2026-05-25T08:00:00+00:00",
        drawdown: 6,
        returnPct: 2,
        runId: "run-previous",
        source: "local-cache",
        strategyRevision: "rev-previous",
        tradeCount: 7,
        warnings: ["upstream unavailable"]
      }),
      auditedRunFixture({
        createdAt: "2026-05-24T08:00:00+00:00",
        drawdown: 9,
        returnPct: 8,
        runId: "run-best-return",
        strategyRevision: "rev-best",
        tradeCount: 12
      }),
      auditedRunFixture({
        createdAt: "2026-05-23T08:00:00+00:00",
        drawdown: 2,
        returnPct: 3,
        runId: "run-low-drawdown",
        strategyRevision: "rev-lowdd",
        tradeCount: 5
      }),
      auditedRunFixture({
        market: "us",
        runId: "run-other-symbol",
        symbol: "AAPL",
        returnPct: 40,
        strategyRevision: "rev-ignore"
      })
    ];

    const rows = buildBacktestRunComparisonMatrixRows(runs, "run-current");

    expect(rows.map((row) => `${row.runId}:${row.badges.join("+")}:${row.returnPct}:${row.maxDrawdownPct}`)).toEqual([
      "run-current:current:+5.00%:4.00%",
      "run-previous:previous_run:+2.00%:6.00%",
      "run-best-return:best_return:+8.00%:9.00%",
      "run-low-drawdown:lowest_drawdown:+3.00%:2.00%"
    ]);
    expect(rows[1]).toMatchObject({
      dataQualityLabel: "local-cache complete · 1 warning",
      tone: "warning"
    });
    expect(rows.some((row) => row.runId === "run-other-symbol")).toBe(false);

    const summary = buildBacktestRunComparisonMatrixSummary(rows);
    expect(summary).toMatchObject({
      bestReturnRunId: "run-best-return",
      context: "ashare 600000 1d",
      currentRunId: "run-current",
      headline: "4 comparable audited runs",
      lowestDrawdownRunId: "run-low-drawdown",
      previousRunId: "run-previous",
      tone: "warning",
      totalRows: 4
    });
    expect(summary?.detail).toContain("Best return run-best-return +8.00%");
    expect(summary?.detail).toContain("Lowest drawdown run-low-drawdown 2.00%");
    expect(summary?.detail).toContain("not investment advice");

    expect(filterBacktestRunComparisonMatrixRows(rows, "REV-BEST").map((row) => row.runId)).toEqual([
      "run-best-return"
    ]);
    expect(filterBacktestRunComparisonMatrixRows(rows, "lowest_drawdown").map((row) => row.runId)).toEqual([
      "run-low-drawdown"
    ]);
  });

  test("builds cross-symbol backtest comparison rows for the selected market and timeframe", () => {
    const runs: ResearchRunAudit[] = [
      auditedRunFixture({
        createdAt: "2026-05-26T08:00:00+00:00",
        drawdown: 4,
        returnPct: 5,
        runId: "run-current",
        strategyRevision: "rev-current",
        symbol: "600000",
        tradeCount: 9
      }),
      auditedRunFixture({
        createdAt: "2026-05-26T08:10:00+00:00",
        drawdown: 5,
        returnPct: 11,
        runId: "run-peer-000300",
        strategyRevision: "rev-peer-best",
        symbol: "000300",
        tradeCount: 6
      }),
      auditedRunFixture({
        createdAt: "2026-05-26T08:20:00+00:00",
        drawdown: 1.5,
        returnPct: 3,
        runId: "run-peer-600519",
        strategyRevision: "rev-peer-lowdd",
        symbol: "600519",
        tradeCount: 4
      }),
      auditedRunFixture({
        runId: "run-other-timeframe",
        symbol: "601398",
        timeframe: "5m"
      }),
      auditedRunFixture({
        market: "us",
        runId: "run-other-market",
        symbol: "AAPL"
      })
    ];

    const rows = buildBacktestCrossSymbolComparisonRows(runs, "run-current");

    expect(rows.map((row) => `${row.symbol}:${row.badges.join("+")}:${row.returnPct}:${row.maxDrawdownPct}`)).toEqual([
      "600519:lowest_drawdown:+3.00%:1.50%",
      "000300:best_return:+11.00%:5.00%",
      "600000:current:+5.00%:4.00%"
    ]);
    expect(rows.some((row) => row.runId === "run-other-timeframe")).toBe(false);
    expect(rows.some((row) => row.runId === "run-other-market")).toBe(false);

    const summary = buildBacktestCrossSymbolComparisonSummary(rows);
    expect(summary).toMatchObject({
      bestReturnRunId: "run-peer-000300",
      context: "ashare 1d cross-symbol",
      currentRunId: "run-current",
      headline: "3 audited symbols compared",
      lowestDrawdownRunId: "run-peer-600519",
      tone: "positive",
      totalRows: 3
    });
    expect(summary?.detail).toContain("Best return 000300 run-peer-000300 +11.00%");
    expect(summary?.detail).toContain("Lowest drawdown 600519 run-peer-600519 1.50%");
    expect(summary?.detail).toContain("not investment advice");

    expect(filterBacktestCrossSymbolComparisonRows(rows, "600519").map((row) => row.runId)).toEqual([
      "run-peer-600519"
    ]);
    expect(filterBacktestCrossSymbolComparisonRows(rows, "REV-PEER-BEST").map((row) => row.runId)).toEqual([
      "run-peer-000300"
    ]);
  });

  test("adds cross-symbol comparison evidence to exported backtest markdown", () => {
    const currentRun = auditedRunFixture({
      drawdown: 4,
      returnPct: 5,
      runId: "run-current",
      strategyRevision: "rev-current",
      symbol: "600000",
      tradeCount: 9
    });
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), currentRun);
    const runHistory = [
      currentRun,
      auditedRunFixture({
        drawdown: 5,
        returnPct: 11,
        runId: "run-peer-000300",
        symbol: "000300",
        strategyRevision: "rev-peer-best",
        tradeCount: 6
      }),
      auditedRunFixture({
        drawdown: 1.5,
        returnPct: 3,
        runId: "run-peer-600519",
        symbol: "600519",
        strategyRevision: "rev-peer-lowdd",
        tradeCount: 4
      })
    ] satisfies ResearchRunAudit[];
    const markdown = buildBacktestReportMarkdown(workspace, runHistory);

    expect(markdown).toContain("## Cross-Symbol Comparison");
    expect(markdown).toContain("3 audited symbols compared");
    expect(markdown).toContain("| 000300 | run-peer-000300 | best_return | +11.00% | 5.00% |");
    expect(markdown).toContain("historical audited evidence only");
  });

  test("formats optional live quote prices for watchlist display", () => {
    expect(formatInstrumentPrice(8.66)).toBe("8.66");
    expect(formatInstrumentPrice(3898.221)).toBe("3898.22");
    expect(formatInstrumentPrice(undefined)).toBe("N/A");
  });

  test("summarizes recent watchlist cache refresh runs for the market health panel", () => {
    const rows = buildWatchlistCacheRefreshHistoryRows(
      [
        {
          runId: "cache-refresh-latest",
          createdAt: "2026-06-09T23:10:00+08:00",
          timeframe: "1d",
          requestedLimit: 240,
          summary: { totalSymbols: 3, refreshed: 2, skipped: 1, failed: 0, upsertedRows: 480 },
          items: []
        },
        {
          runId: "cache-refresh-failed",
          createdAt: "2026-06-09T22:50:00+08:00",
          timeframe: "5m",
          requestedLimit: 120,
          summary: { totalSymbols: 2, refreshed: 1, skipped: 0, failed: 1, upsertedRows: 120 },
          items: []
        }
      ],
      2
    );

    expect(rows).toEqual([
      {
        id: "cache-refresh-latest",
        runId: "cache-refresh-latest",
        createdAt: "2026-06-09T23:10:00+08:00",
        timeframe: "1d",
        label: "cache-refresh-latest · 1d",
        total: 3,
        refreshed: 2,
        skipped: 1,
        failed: 0,
        upsertedRows: 480,
        value: "2/3 refreshed",
        detail: "480 rows cached · 1 skipped · 0 failed",
        selected: false,
        tone: "warning"
      },
      {
        id: "cache-refresh-failed",
        runId: "cache-refresh-failed",
        createdAt: "2026-06-09T22:50:00+08:00",
        timeframe: "5m",
        label: "cache-refresh-failed · 5m",
        total: 2,
        refreshed: 1,
        skipped: 0,
        failed: 1,
        upsertedRows: 120,
        value: "1/2 refreshed",
        detail: "120 rows cached · 0 skipped · 1 failed",
        selected: false,
        tone: "risk"
      }
    ]);
  });

  test("marks the selected watchlist cache refresh history row", () => {
    const rows = buildWatchlistCacheRefreshHistoryRows(
      [
        {
          runId: "cache-refresh-latest",
          createdAt: "2026-06-09T23:10:00+08:00",
          timeframe: "1d",
          requestedLimit: 240,
          summary: { totalSymbols: 2, refreshed: 2, skipped: 0, failed: 0, upsertedRows: 480 },
          items: []
        },
        {
          runId: "cache-refresh-older",
          createdAt: "2026-06-09T22:50:00+08:00",
          timeframe: "5m",
          requestedLimit: 120,
          summary: { totalSymbols: 2, refreshed: 1, skipped: 1, failed: 0, upsertedRows: 120 },
          items: []
        }
      ],
      2,
      "cache-refresh-older"
    );

    expect(rows.map((row) => ({ runId: row.runId, selected: row.selected }))).toEqual([
      { runId: "cache-refresh-latest", selected: false },
      { runId: "cache-refresh-older", selected: true }
    ]);
  });

  test("resolves the selected watchlist cache refresh run with latest fallback", () => {
    const latest = {
      runId: "cache-refresh-latest",
      createdAt: "2026-06-09T23:10:00+08:00",
      timeframe: "1d" as const,
      requestedLimit: 240,
      summary: { totalSymbols: 2, refreshed: 2, skipped: 0, failed: 0, upsertedRows: 480 },
      items: []
    };
    const older = {
      runId: "cache-refresh-older",
      createdAt: "2026-06-09T22:50:00+08:00",
      timeframe: "5m" as const,
      requestedLimit: 120,
      summary: { totalSymbols: 2, refreshed: 1, skipped: 1, failed: 0, upsertedRows: 120 },
      items: []
    };

    expect(resolveWatchlistCacheRefreshRunSelection([latest, older], "cache-refresh-older")?.runId).toBe(
      "cache-refresh-older"
    );
    expect(resolveWatchlistCacheRefreshRunSelection([latest, older], "missing")?.runId).toBe("cache-refresh-latest");
    expect(resolveWatchlistCacheRefreshRunSelection([], "missing")).toBeNull();
  });

  test("resolves a watchlist cache refresh run id from the URL", () => {
    expect(
      resolveWatchlistCacheRefreshRunIdFromUrl(
        "?workspace=market&watchlistRefreshRun=cache-refresh-f10efd7401b7"
      )
    ).toBe("cache-refresh-f10efd7401b7");
    expect(resolveWatchlistCacheRefreshRunIdFromUrl("?watchlistRefreshRun=run:600000_1d.20260610")).toBe(
      "run:600000_1d.20260610"
    );
  });

  test("rejects unsafe watchlist cache refresh run ids from the URL", () => {
    expect(resolveWatchlistCacheRefreshRunIdFromUrl("?watchlistRefreshRun=")).toBeNull();
    expect(resolveWatchlistCacheRefreshRunIdFromUrl("?watchlistRefreshRun=../cache-refresh-latest")).toBeNull();
    expect(resolveWatchlistCacheRefreshRunIdFromUrl("?watchlistRefreshRun=<script>alert(1)</script>")).toBeNull();
    expect(resolveWatchlistCacheRefreshRunIdFromUrl("?workspace=market")).toBeNull();
  });

  test("summarizes watchlist cache refresh item details for the market health panel", () => {
    const rows = buildWatchlistCacheRefreshItemRows({
      runId: "cache-refresh-run-1",
      createdAt: "2026-06-09T23:10:00+08:00",
      timeframe: "1d",
      requestedLimit: 240,
      summary: { totalSymbols: 3, refreshed: 1, skipped: 1, failed: 1, upsertedRows: 240 },
      items: [
        {
          market: "ashare",
          symbol: "600000",
          name: "浦发银行",
          timeframe: "1d",
          requestedLimit: 240,
          upsertedRows: 240,
          status: "refreshed",
          quality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
          error: null
        },
        {
          market: "ashare",
          symbol: "000300",
          name: "沪深300",
          timeframe: "1d",
          requestedLimit: 240,
          upsertedRows: 0,
          status: "skipped",
          quality: { source: "demo-fallback", isComplete: false, warnings: ["incomplete upstream data"], rows: 0 },
          error: null
        },
        {
          market: "us",
          symbol: "AAPL",
          name: "Apple",
          timeframe: "1d",
          requestedLimit: 240,
          upsertedRows: 0,
          status: "failed",
          quality: { source: "unknown", isComplete: false, warnings: [], rows: 0 },
          error: "rate limited"
        }
      ]
    });

    expect(rows).toEqual([
      {
        id: "cache-refresh-run-1:ashare:600000",
        market: "ashare",
        symbol: "600000",
        name: "浦发银行",
        timeframe: "1d",
        instrument: { symbol: "600000", name: "浦发银行", market: "ashare", changePct: 0 },
        status: "refreshed",
        statusLabel: "refreshed",
        source: "tencent",
        rows: 240,
        upsertedRows: 240,
        value: "240 rows cached",
        detail: "tencent · complete",
        tone: "positive"
      },
      {
        id: "cache-refresh-run-1:ashare:000300",
        market: "ashare",
        symbol: "000300",
        name: "沪深300",
        timeframe: "1d",
        instrument: { symbol: "000300", name: "沪深300", market: "ashare", changePct: 0 },
        status: "skipped",
        statusLabel: "skipped",
        source: "demo-fallback",
        rows: 0,
        upsertedRows: 0,
        value: "0 rows cached",
        detail: "demo-fallback · incomplete upstream data",
        tone: "warning"
      },
      {
        id: "cache-refresh-run-1:us:AAPL",
        market: "us",
        symbol: "AAPL",
        name: "Apple",
        timeframe: "1d",
        instrument: { symbol: "AAPL", name: "Apple", market: "us", changePct: 0 },
        status: "failed",
        statusLabel: "failed",
        source: "unknown",
        rows: 0,
        upsertedRows: 0,
        value: "0 rows cached",
        detail: "rate limited",
        tone: "risk"
      }
    ]);
  });

  test("summarizes selected watchlist refresh coverage for the current research context", () => {
    const workspace = buildTerminalWorkspace();
    const row = buildWatchlistCacheRefreshCoverageRow(watchlistRefreshRunFixture(), workspace);

    expect(row).toEqual({
      id: "cache-refresh-ready:coverage",
      runId: "cache-refresh-ready",
      label: "Selected refresh coverage",
      value: "covered · refreshed",
      detail: "600000 · 1d covered by tencent · 240 rows cached",
      status: "ready",
      tone: "positive",
      canOpenResearch: true
    });
  });

  test("marks selected watchlist refresh coverage as review when it misses the current context", () => {
    const workspace = buildTerminalWorkspace();
    const row = buildWatchlistCacheRefreshCoverageRow(
      watchlistRefreshRunFixture({
        runId: "cache-refresh-other",
        item: {
          symbol: "000300",
          name: "沪深300"
        }
      }),
      workspace
    );

    expect(row).toEqual({
      id: "cache-refresh-other:coverage",
      runId: "cache-refresh-other",
      label: "Selected refresh coverage",
      value: "not current context",
      detail: "Selected run does not include ASHARE · 600000 · 1d; choose a matching run or refresh the watchlist cache.",
      status: "review",
      tone: "warning",
      canOpenResearch: false
    });
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

  test("detects whether an instrument already belongs to the active watchlist", () => {
    const workspace = buildTerminalWorkspace();

    expect(watchlistIncludesInstrument(workspace.watchlist, { market: "ashare", symbol: "600000" })).toBe(true);
    expect(watchlistIncludesInstrument(workspace.watchlist, { market: "us", symbol: "MSFT" })).toBe(false);
  });

  test("merges a saved watchlist into the selected research context", () => {
    const workspace = workspaceWithSelectedInstrument(
      buildTerminalWorkspace(),
      buildInstrumentFromSymbol("us", "MSFT")!
    );

    const saved = workspaceWithSavedWatchlist(workspace, [
      { market: "us", symbol: "MSFT", name: "Microsoft", changePct: 1.2, price: 420.5 },
      { market: "ashare", symbol: "600000", name: "浦发银行", changePct: -2.33, price: 9.21 }
    ]);

    expect(saved.watchlist[0]?.name).toBe("Microsoft");
    expect(saved.watchlist[0]?.price).toBe(420.5);
    expect(saved.selectedInstrument.name).toBe("Microsoft");
    expect(saved.selectedInstrument.price).toBe(420.5);
    expect(saved.researchRun).toBeNull();
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
