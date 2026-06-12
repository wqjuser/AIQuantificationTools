import { describe, expect, test } from "vitest";
import {
  type AiReviewRunRecord,
  buildBacktestReportMarkdown,
  buildP0PlatformActionOutcome,
  buildP0PlatformActionOutcomeEvidenceLink,
  buildP0PlatformBacklogItems,
  buildP0PlatformReadinessReportMarkdown,
  buildP0PlatformReadinessSummary,
  buildPortfolioBacktestReportMarkdown,
  buildTerminalWorkspace,
  workspaceFromResearchRunAudit,
  workspaceWithBacktestAssumption,
  workspaceWithStrategyField,
  type ResearchRunAudit
} from "./terminal-workbench";
import {
  buildResearchRunUrl,
  buildResearchRunDetailUrl,
  buildResearchRunExportUrl,
  buildResearchRunImportUrl,
  buildResearchRunImportUndoUrl,
  buildResearchNoteUrl,
  buildResearchRunPaperExecutionsUrl,
  buildResearchRunPromotionUrl,
  buildResearchRunAiReviewsUrl,
  buildMarketCalendarUrl,
  buildPortfolioBacktestUrl,
  buildPortfolioPaperOrderApprovalsUrl,
  buildPortfolioPaperOrdersUrl,
  buildPortfolioPaperOrderReplayUrl,
  buildPortfolioPaperOrderStateHistoryUrl,
  buildPortfolioPaperOrderSimulationsUrl,
  buildAuditEventsUrl,
  buildAuditReportSignUrl,
  buildAuditReportVerifyUrl,
  buildAuditReportVerifyPackageUrl,
  buildAuditReportRevokeUrl,
  buildAuditSigningKeysUrl,
  buildAuditSigningKeyEnvironmentBindingHistoryUrl,
  buildAuditSigningKeyEnvironmentBindingUrl,
  buildAuditSigningKeyRuntimeReloadExecutionHistoryUrl,
  buildAuditSigningKeyRuntimeReloadExecutionUrl,
  buildAuditSigningKeyRotationAcceptanceHistoryUrl,
  buildAuditSigningKeyRotationAcceptanceUrl,
  buildAuditSigningKeyRuntimeReloadPlanHistoryUrl,
  buildAuditSigningKeyRuntimeReloadPlanUrl,
  buildAuditSigningKeySecretMaterializationHistoryUrl,
  buildAuditSigningKeySecretMaterializationUrl,
  buildAuditSigningKeyRotationApplyUrl,
  buildAuditSigningKeyRotationPlanUrl,
  buildAuditSigningKeyRotationRestartEvidenceUrl,
  buildCacheRefreshUrl,
  buildWatchlistCacheRefreshUrl,
  buildExecutionAdapterCertificationApplyUrl,
  buildExecutionAdapterCertificationAppliesUrl,
  buildExecutionAdapterControlledRestartEvidenceHistoryUrl,
  buildExecutionAdapterControlledRestartEvidenceUrl,
  buildExecutionAdapterRestartAcceptanceHistoryUrl,
  buildExecutionAdapterRestartAcceptanceUrl,
  buildExecutionAdapterSecretMaterializationHistoryUrl,
  buildExecutionAdapterSecretMaterializationUrl,
  buildExecutionAdapterEnvironmentBindingHistoryUrl,
  buildExecutionAdapterEnvironmentBindingUrl,
  buildExecutionAdapterRuntimeReloadAcceptanceHistoryUrl,
  buildExecutionAdapterRuntimeReloadAcceptanceUrl,
  buildExecutionAdapterRuntimeReloadExecutionHistoryUrl,
  buildExecutionAdapterRuntimeReloadExecutionUrl,
  buildExecutionAdapterRuntimeReloadPlanHistoryUrl,
  buildExecutionAdapterRuntimeReloadPlanUrl,
  buildExecutionAdapterSecretReferenceHistoryUrl,
  buildExecutionAdapterSecretReferenceUrl,
  buildExecutionAdapterCertificationsUrl,
  buildExecutionAdapterLedgerUrl,
  buildSettingsStatusUrl,
  buildStrategiesUrl,
  buildStrategyDetailUrl,
  buildStrategyValidationUrl,
  buildResearchRunsUrl,
  buildMarketKlinesUrl,
  buildMarketSearchUrl,
  buildWatchlistUrl,
  buildLoadingMarketKlinesResult,
  buildGoldenPathStatusUrl,
  loadGoldenPathStatus,
  loadMarketKlines,
  loadMarketCalendarStatus,
  loadMarketSearch,
  loadResearchRunDetail,
  loadResearchRunExport,
  loadLatestResearchRunPaperExecution,
  loadResearchRunPromotion,
  loadPortfolioPaperOrderBatches,
  loadPortfolioPaperOrderApprovals,
  loadPortfolioPaperOrderReplay,
  loadPortfolioPaperOrderStateHistory,
  loadPortfolioPaperOrderSimulations,
  loadExecutionAdapterLedger,
  loadExecutionAdapterCertificationApplies,
  loadExecutionAdapterControlledRestartEvidence,
  loadExecutionAdapterRestartAcceptances,
  loadExecutionAdapterSecretMaterializations,
  loadExecutionAdapterEnvironmentBindings,
  loadExecutionAdapterRuntimeReloadAcceptances,
  loadExecutionAdapterRuntimeReloadExecutions,
  loadExecutionAdapterRuntimeReloadPlans,
  loadExecutionAdapterSecretReferences,
  loadExecutionAdapterCertifications,
  runPortfolioBacktest,
  recordPortfolioPaperOrderBatch,
  recordPortfolioPaperOrderApproval,
  recordPortfolioPaperOrderSimulation,
  recordExecutionAdapterCertification,
  recordExecutionAdapterCertificationApply,
  recordExecutionAdapterControlledRestartEvidence,
  recordExecutionAdapterRestartAcceptance,
  recordExecutionAdapterSecretMaterialization,
  recordExecutionAdapterEnvironmentBinding,
  recordExecutionAdapterRuntimeReloadAcceptance,
  recordExecutionAdapterRuntimeReloadExecution,
  recordExecutionAdapterRuntimeReloadPlan,
  recordExecutionAdapterSecretReference,
  loadResearchNote,
  loadPlatformSettings,
  loadWatchlistCacheRefreshRuns,
  refreshMarketCache,
  refreshMarketCacheBatch,
  refreshWatchlistCacheRun,
  loadStrategyLibrary,
  validateStrategySnapshot,
  submitResearchRunPaperExecution,
  saveAiReviewRunRecord,
  loadResearchRunAiReviews,
  saveAuditEvent,
  loadAuditEvents,
  loadAuditSigningKeys,
  loadAuditSigningKeyEnvironmentBindings,
  loadAuditSigningKeyRotationAcceptances,
  loadAuditSigningKeyRuntimeReloadExecutions,
  loadAuditSigningKeyRuntimeReloadPlans,
  loadAuditSigningKeySecretMaterializations,
  applyAuditSigningKeyRotationPlan,
  prepareAuditSigningKeyRotationPlan,
  recordAuditSigningKeySecretMaterialization,
  recordAuditSigningKeyEnvironmentBinding,
  recordAuditSigningKeyRotationAcceptance,
  recordAuditSigningKeyRuntimeReloadExecution,
  recordAuditSigningKeyRuntimeReloadPlan,
  recordAuditSigningKeyControlledRestartEvidence,
  signAuditReportEvent,
  verifyAuditReportEvent,
  verifyResearchRunExportReportSignature,
  revokeAuditReportEvent,
  saveResearchNote,
  saveStrategySnapshot,
  withResearchRunExportAuditEvidenceArtifacts,
  buildBacktestReportAuditEvent,
  buildPortfolioBacktestReportAuditEvent,
  buildP0PlatformReadinessReportAuditEvent,
  buildResearchRunExportAuditReport,
  buildAuditEvidenceReportAuditEvent,
  buildAuditSigningKeyRotationApplyAuditEvent,
  buildAuditSigningKeyRotationPlanAuditEvent,
  withResearchRunExportReportSignatures,
  withVerifiedResearchRunExportPackageReportSignatures,
  withResearchRunExportAuditEvidenceSummary,
  normalizeResearchRunExportPackagePayload,
  importResearchRunExport,
  undoResearchRunImport,
  marketKlinesFromResearchRunAudit,
  mergeMarketKlines,
  buildWorkspaceUrl,
  loadResearchRunHistory,
  loadTerminalWorkspace,
  resolveQuantCoreBaseUrl,
  runTerminalResearch,
  buildResearchWorkspaceStateUrl,
  saveResearchWorkspaceState,
  saveWatchlist,
  type AuditEventRecord,
  type PortfolioBacktestRun,
  type ResearchRunExportPackage
} from "./terminal-api";

describe("terminal workspace API client", () => {
  test("builds the local core workspace URL without duplicate slashes", () => {
    expect(buildWorkspaceUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/workspace");
  });

  test("saves the market watchlist through the local core", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          watchlist: [
            {
              market: "us",
              symbol: "MSFT",
              name: "Microsoft",
              changePct: 1.2,
              price: 420.5
            }
          ]
        })
      };
    };

    expect(buildWatchlistUrl("/")).toBe("/api/watchlist");

    const result = await saveWatchlist(
      "/",
      [{ market: "us", symbol: "MSFT", name: "Microsoft", changePct: 1.2, price: 420.5 }],
      fetcher
    );

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
  });

  test("saves the research workspace state through the local core", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          state: {
            market: "us",
            symbol: "MSFT",
            name: "Microsoft",
            timeframe: "5m",
            workspaceId: "research",
            updatedAt: "2026-06-09T00:00:00+00:00"
          }
        })
      };
    };

    expect(buildResearchWorkspaceStateUrl("/")).toBe("/api/research/workspace-state");

    const result = await saveResearchWorkspaceState(
      "/",
      { market: "us", symbol: "MSFT", name: "Microsoft", timeframe: "5m", workspaceId: "research" },
      fetcher
    );

    expect(calls).toEqual([
      {
        url: "/api/research/workspace-state",
        method: "PUT",
        body: {
          state: { market: "us", symbol: "MSFT", name: "Microsoft", timeframe: "5m", workspaceId: "research" }
        }
      }
    ]);
    expect(result.source).toBe("core");
    expect(result.state?.symbol).toBe("MSFT");
    expect(result.state?.timeframe).toBe("5m");
  });

  test("loads the selected market calendar status through the local core", async () => {
    const calls: string[] = [];
    const fetcher = async (url: string) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          calendar: {
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
            warnings: ["Static session template only; exchange holiday calendar is not configured."],
            source: "static-session-template"
          }
        })
      };
    };

    expect(buildMarketCalendarUrl("/", "ashare")).toBe("/api/market/calendar?market=ashare");

    const result = await loadMarketCalendarStatus("/", "ashare", fetcher);

    expect(calls).toEqual(["/api/market/calendar?market=ashare"]);
    expect(result.source).toBe("core");
    expect(result.calendar?.market).toBe("ashare");
    expect(result.calendar?.status).toBe("open");
    expect(result.calendar?.nextClose).toBe("2026-06-11T11:30:00+08:00");
  });

  test("falls back when the market calendar contract is invalid", async () => {
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ calendar: { market: "ashare", status: "open" } })
    });

    const result = await loadMarketCalendarStatus("/", "ashare", fetcher);

    expect(result.source).toBe("fallback");
    expect(result.calendar?.market).toBe("ashare");
    expect(result.calendar?.status).toBe("unknown");
    expect(result.error).toBe("Invalid market calendar contract");
  });

  test("builds same-origin API URLs for containerized web deployments", () => {
    expect(resolveQuantCoreBaseUrl({ VITE_QUANT_API_BASE: "/" })).toBe("/");
    expect(buildWorkspaceUrl("/")).toBe("/api/workspace");
    expect(buildResearchRunDetailUrl("/", "run 你好/1")).toBe("/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1");
    expect(buildMarketSearchUrl("/", "ashare", "浦发", 8)).toBe(
      "/api/market/search?market=ashare&query=%E6%B5%A6%E5%8F%91&limit=8"
    );
  });

  test("builds the research run URL with selected instrument context", () => {
    expect(buildResearchRunUrl("http://127.0.0.1:8765/", "ashare", "600000", "1d")).toBe(
      "http://127.0.0.1:8765/api/research/run?market=ashare&symbol=600000&timeframe=1d&limit=500"
    );
  });

  test("builds the research run URL with locked watchlist refresh evidence", () => {
    expect(
      buildResearchRunUrl(
        "http://127.0.0.1:8765/",
        "ashare",
        "600000",
        "1d",
        undefined,
        120,
        undefined,
        "cache-refresh-f10efd7401b7"
      )
    ).toBe(
      "http://127.0.0.1:8765/api/research/run?market=ashare&symbol=600000&timeframe=1d&limit=120&watchlistRefreshRunId=cache-refresh-f10efd7401b7"
    );
  });

  test("builds the research run URL with editable backtest assumptions", () => {
    expect(
      buildResearchRunUrl("http://127.0.0.1:8765/", "ashare", "600000", "1d", {
        initialCash: 250000,
        feeBps: 8,
        slippageBps: 4
      })
    ).toBe(
      "http://127.0.0.1:8765/api/research/run?market=ashare&symbol=600000&timeframe=1d&limit=500&initialCash=250000&feeBps=8&slippageBps=4"
    );
  });

  test("builds the research run URL with editable strategy snapshot fields", () => {
    const url = new URL(
      buildResearchRunUrl(
        "http://127.0.0.1:8765/",
        "ashare",
        "600000",
        "1d",
        undefined,
        500,
        {
          name: "Custom SMA risk plan",
          entry: "Close > SMA5",
          exit: "Close < SMA7",
          position: "25% cap per instrument",
          risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
        }
      )
    );

    expect(url.searchParams.get("strategyName")).toBe("Custom SMA risk plan");
    expect(url.searchParams.get("strategyEntry")).toBe("Close > SMA5");
    expect(url.searchParams.get("strategyExit")).toBe("Close < SMA7");
    expect(url.searchParams.get("strategyPosition")).toBe("25% cap per instrument");
    expect(url.searchParams.get("strategyRisk")).toBe("Stop -6%, take profit +12%, drawdown guard 9%, paper only");
  });

  test("builds the research run history URL with a bounded limit", () => {
    expect(buildResearchRunsUrl("http://127.0.0.1:8765/", 5)).toBe(
      "http://127.0.0.1:8765/api/research/runs?limit=5"
    );
  });

  test("builds the research run detail URL with an encoded run id", () => {
    expect(buildResearchRunDetailUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1"
    );
  });

  test("builds the research run export URL with an encoded run id", () => {
    expect(buildResearchRunExportUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1/export"
    );
  });

  test("builds the research run import URL", () => {
    expect(buildResearchRunImportUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/research/runs/import"
    );
  });

  test("builds the research note URL for the selected context", () => {
    expect(buildResearchNoteUrl("http://127.0.0.1:8765/", "ashare", "600000", "1d")).toBe(
      "http://127.0.0.1:8765/api/research/notes?market=ashare&symbol=600000&timeframe=1d"
    );
  });

  test("builds the paper execution URL with an encoded run id", () => {
    expect(buildResearchRunPaperExecutionsUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1/paper-executions"
    );
  });

  test("builds the promotion candidate URL with an encoded run id", () => {
    expect(buildResearchRunPromotionUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1/promotion"
    );
  });

  test("builds the portfolio backtest URL", () => {
    expect(buildPortfolioBacktestUrl("/")).toBe("/api/portfolio/backtest");
  });

  test("builds the portfolio paper order URL with a bounded query", () => {
    expect(buildPortfolioPaperOrdersUrl("/", { baseRunId: "portfolio run/你好", limit: 200 })).toBe(
      "/api/portfolio/paper-orders?baseRunId=portfolio+run%2F%E4%BD%A0%E5%A5%BD&limit=50"
    );
  });

  test("builds the portfolio paper order approval URL with an encoded batch query", () => {
    expect(
      buildPortfolioPaperOrderApprovalsUrl("/", {
        baseRunId: "portfolio run/你好",
        batchId: "portfolio-paper-batch/1"
      })
    ).toBe(
      "/api/portfolio/paper-order-approvals?baseRunId=portfolio+run%2F%E4%BD%A0%E5%A5%BD&batchId=portfolio-paper-batch%2F1"
    );
  });

  test("builds the portfolio paper order simulation URL with an encoded batch query", () => {
    expect(
      buildPortfolioPaperOrderSimulationsUrl("/", {
        baseRunId: "portfolio run/你好",
        batchId: "portfolio-paper-batch/1"
      })
    ).toBe(
      "/api/portfolio/paper-order-simulations?baseRunId=portfolio+run%2F%E4%BD%A0%E5%A5%BD&batchId=portfolio-paper-batch%2F1"
    );
  });

  test("builds the portfolio paper order state history URL with an encoded batch query", () => {
    expect(
      buildPortfolioPaperOrderStateHistoryUrl("/", {
        baseRunId: "portfolio run/你好",
        batchId: "portfolio-paper-batch/1"
      })
    ).toBe(
      "/api/portfolio/paper-order-state-history?baseRunId=portfolio+run%2F%E4%BD%A0%E5%A5%BD&batchId=portfolio-paper-batch%2F1"
    );
  });

  test("builds the portfolio paper order replay URL with initial cash", () => {
    expect(buildPortfolioPaperOrderReplayUrl("/", { baseRunId: "portfolio run/你好", initialCash: 50000 })).toBe(
      "/api/portfolio/paper-order-replay?baseRunId=portfolio+run%2F%E4%BD%A0%E5%A5%BD&initialCash=50000"
    );
  });

  test("builds the settings status URL", () => {
    expect(buildSettingsStatusUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/settings/status");
  });

  test("builds the execution adapter ledger URL", () => {
    expect(buildExecutionAdapterLedgerUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-ledger"
    );
  });

  test("builds the execution adapter certifications URL with an encoded adapter query", () => {
    expect(buildExecutionAdapterCertificationsUrl("http://127.0.0.1:8765/", { adapterId: "us live/1", limit: 3 })).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-certifications?adapterId=us+live%2F1&limit=3"
    );
    expect(buildExecutionAdapterCertificationsUrl("/", { adapterId: "crypto-live" })).toBe(
      "/api/execution/adapter-certifications?adapterId=crypto-live"
    );
  });

  test("builds the golden path status URL for the selected context", () => {
    expect(buildGoldenPathStatusUrl("/", { market: "ashare", symbol: "600000", timeframe: "1d" })).toBe(
      "/api/golden-path/status?market=ashare&symbol=600000&timeframe=1d"
    );
  });

  test("builds the cache refresh URL", () => {
    expect(buildCacheRefreshUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/cache/refresh");
  });

  test("builds strategy library URLs for context and detail lookup", () => {
    expect(buildStrategiesUrl("http://127.0.0.1:8765/", { market: "ashare", symbol: "600000", limit: 5 })).toBe(
      "http://127.0.0.1:8765/api/strategies?market=ashare&symbol=600000&limit=5"
    );
    expect(buildStrategyDetailUrl("http://127.0.0.1:8765/", "rev 你好/1")).toBe(
      "http://127.0.0.1:8765/api/strategies/rev%20%E4%BD%A0%E5%A5%BD%2F1"
    );
    expect(buildStrategyValidationUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/strategies/validate"
    );
  });

  test("builds the market klines URL with selected chart context", () => {
    expect(buildMarketKlinesUrl("http://127.0.0.1:8765/", "ashare", "600000", "1d", 160)).toBe(
      "http://127.0.0.1:8765/api/market/klines?market=ashare&symbol=600000&timeframe=1d&limit=160"
    );
  });

  test("builds the market klines URL with an optional end boundary for historical paging", () => {
    expect(
      buildMarketKlinesUrl("http://127.0.0.1:8765/", "ashare", "600000", "60m", 500, "2026-05-26T09:45:00.000Z")
    ).toBe(
      "http://127.0.0.1:8765/api/market/klines?market=ashare&symbol=600000&timeframe=60m&limit=500&end=2026-05-26T09%3A45%3A00.000Z"
    );
  });

  test("builds the market search URL with encoded Chinese query text and optional timeframe", () => {
    expect(buildMarketSearchUrl("http://127.0.0.1:8765/", "ashare", "浦发", 8)).toBe(
      "http://127.0.0.1:8765/api/market/search?market=ashare&query=%E6%B5%A6%E5%8F%91&limit=8"
    );
    expect(buildMarketSearchUrl("http://127.0.0.1:8765/", "ashare", "浦发", 8, "5m")).toBe(
      "http://127.0.0.1:8765/api/market/search?market=ashare&query=%E6%B5%A6%E5%8F%91&limit=8&timeframe=5m"
    );
  });

  test("builds an empty chart loading state for the newly selected symbol", () => {
    expect(buildLoadingMarketKlinesResult({ market: "ashare", symbol: "600004", timeframe: "1d" })).toEqual({
      market: "ashare",
      symbol: "600004",
      timeframe: "1d",
      bars: [],
      quality: {
        source: "loading",
        isComplete: false,
        warnings: [],
        rows: 0
      },
      source: "fallback"
    });
  });

  test("resolves the local core base URL from Vite environment with a default", () => {
    expect(resolveQuantCoreBaseUrl({ VITE_QUANT_API_BASE: "http://localhost:9999" })).toBe("http://localhost:9999");
    expect(resolveQuantCoreBaseUrl({})).toBe("http://127.0.0.1:8765");
  });

  test("loads the workspace contract from the Python core", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      schemaVersion: 1,
      selectedInstrument: {
        symbol: "AAPL",
        name: "Apple",
        market: "us",
        changePct: -0.36
      }
    };
    const calls: string[] = [];
    const result = await loadTerminalWorkspace("http://127.0.0.1:8765/", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => remoteWorkspace
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/workspace"]);
    expect(result.source).toBe("core");
    expect(result.statusLabel).toBe("Core connected");
    expect(result.workspace.selectedInstrument.symbol).toBe("AAPL");
  });

  test("runs a portfolio backtest against audited run ids", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          portfolio: {
            name: "A-share core basket",
            market: "ashare",
            timeframe: "1d",
            initialCash: 100000,
            cashWeight: 0.1,
            metrics: {
              totalReturnPct: 9,
              annualReturnPct: 109,
              maxDrawdownPct: 1.2,
              winRatePct: 50,
              profitFactor: 1.5,
              tradeCount: 4
            },
            equityCurve: [
              { timestamp: "2026-05-26T08:00:00+00:00", equity: 100000 },
              { timestamp: "2026-05-27T08:00:00+00:00", equity: 109000 }
            ],
            allocationEvents: [
              {
                timestamp: "2026-05-26T08:00:00+00:00",
                eventType: "allocate",
                symbol: "600000",
                sourceRunId: "run-a",
                targetWeight: 0.6,
                notionalValue: 60000,
                reason: "static target allocation"
              },
              {
                timestamp: "2026-05-26T08:00:00+00:00",
                eventType: "cash_buffer",
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
                eventType: "rebalance_review",
                symbol: "600000",
                sourceRunId: "run-a",
                targetWeight: 0.6,
                endingWeight: 0.578,
                currentValue: 63000,
                targetValue: 65400,
                deltaValue: 2400,
                driftPct: -2.2,
                status: "review",
                reason: "ending weight drift requires review; no order is routed"
              },
              {
                timestamp: "2026-05-27T08:00:00+00:00",
                eventType: "rebalance_review",
                symbol: "CASH",
                sourceRunId: null,
                targetWeight: 0.1,
                endingWeight: 0.092,
                currentValue: 10000,
                targetValue: 10900,
                deltaValue: 900,
                driftPct: -0.8,
                status: "within_band",
                reason: "ending weight remains inside the review band"
              }
            ],
            tradeReviewEvents: [
              {
                timestamp: "2026-05-27T08:00:00+00:00",
                eventType: "trade_review",
                symbol: "600000",
                sourceRunId: "run-a",
                side: "buy",
                notionalValue: 2400,
                targetWeight: 0.6,
                endingWeight: 0.578,
                status: "paper_review",
                reason: "paper-only rebalance intent generated from audited portfolio drift; no order is routed"
              }
            ],
            preTradeRiskChecks: [
              {
                timestamp: "2026-05-27T08:00:00+00:00",
                eventType: "pre_trade_risk_check",
                scope: "trade",
                symbol: "600000",
                sourceRunId: "run-a",
                checkId: "trade_notional_limit",
                status: "passed",
                value: 0.022,
                limit: 0.2,
                reason: "trade notional remains inside the hard pre-trade limit"
              }
            ],
            paperOrderEvents: [
              {
                timestamp: "2026-05-27T08:00:00+00:00",
                eventType: "portfolio_paper_order",
                orderId: "portfolio-paper-run-a-buy",
                symbol: "600000",
                sourceRunId: "run-a",
                side: "buy",
                notionalValue: 2400,
                quantity: 2400,
                status: "pending_review",
                riskStatus: "review",
                reason: "portfolio paper order candidate requires operator review before staging"
              }
            ],
            covarianceRisk: {
              method: "population_covariance",
              observations: 1,
              periodVolatilityPct: 1.8,
              annualizedVolatilityPct: 28.6,
              contributions: [
                {
                  symbol: "600000",
                  sourceRunId: "run-a",
                  targetWeight: 0.6,
                  annualizedVolatilityPct: 31.2,
                  marginalContributionPct: 24.8,
                  contributionPct: 68.4
                },
                {
                  symbol: "000300",
                  sourceRunId: "run-b",
                  targetWeight: 0.3,
                  annualizedVolatilityPct: 18.5,
                  marginalContributionPct: 12.6,
                  contributionPct: 31.6
                }
              ]
            },
            legs: [
              {
                symbol: "600000",
                targetWeight: 0.6,
                startingValue: 60000,
                endingValue: 63000,
                contributionValue: 3000,
                contributionReturnPct: 5,
                maxDrawdownPct: 4.5,
                tradeCount: 2,
                dataQuality: { source: "local-cache", isComplete: true, warnings: [], rows: 2 }
              },
              {
                symbol: "000300",
                targetWeight: 0.3,
                startingValue: 30000,
                endingValue: 36000,
                contributionValue: 6000,
                contributionReturnPct: 20,
                maxDrawdownPct: 5,
                tradeCount: 2,
                dataQuality: { source: "local-cache", isComplete: true, warnings: [], rows: 2 }
              }
            ],
            dataQuality: { source: "portfolio-composite(600000:local-cache,000300:local-cache)", isComplete: true, warnings: [], rows: 2 }
          }
        })
      };
    };

    const result = await runPortfolioBacktest(
      "/",
      {
        name: "A-share core basket",
        initialCash: 100000,
        legs: [
          { runId: "run-a", targetWeight: 0.6 },
          { runId: "run-b", targetWeight: 0.3 }
        ]
      },
      fetcher
    );

    expect(result.source).toBe("core");
    expect(result.portfolio?.metrics.totalReturnPct).toBe(9);
    expect(result.portfolio?.cashWeight).toBe(0.1);
    expect(result.portfolio?.legs.map((leg) => `${leg.symbol}:${leg.contributionValue}`)).toEqual(["600000:3000", "000300:6000"]);
    expect(result.portfolio?.allocationEvents?.map((event) => `${event.eventType}:${event.symbol}:${event.notionalValue}`)).toEqual([
      "allocate:600000:60000",
      "cash_buffer:CASH:10000"
    ]);
    expect(result.portfolio?.rebalanceEvents?.map((event) => `${event.symbol}:${event.status}:${event.deltaValue}`)).toEqual([
      "600000:review:2400",
      "CASH:within_band:900"
    ]);
    expect(result.portfolio?.tradeReviewEvents?.map((event) => `${event.symbol}:${event.side}:${event.status}:${event.notionalValue}`)).toEqual([
      "600000:buy:paper_review:2400"
    ]);
    expect(result.portfolio?.preTradeRiskChecks?.map((check) => `${check.symbol}:${check.checkId}:${check.status}:${check.limit}`)).toEqual([
      "600000:trade_notional_limit:passed:0.2"
    ]);
    expect(result.portfolio?.paperOrderEvents?.map((event) => `${event.symbol}:${event.side}:${event.status}:${event.riskStatus}:${event.quantity}`)).toEqual([
      "600000:buy:pending_review:review:2400"
    ]);
    expect(result.portfolio?.covarianceRisk?.contributions.map((item) => `${item.symbol}:${item.contributionPct}`)).toEqual([
      "600000:68.4",
      "000300:31.6"
    ]);
    expect(calls[0]).toMatchObject({ url: "/api/portfolio/backtest" });
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      name: "A-share core basket",
      initialCash: 100000,
      legs: [
        { runId: "run-a", targetWeight: 0.6 },
        { runId: "run-b", targetWeight: 0.3 }
      ]
    });
  });

  test("records and loads portfolio paper order batches from the Python core", async () => {
    const order = {
      timestamp: "2026-05-27T08:00:00+00:00",
      eventType: "portfolio_paper_order" as const,
      orderId: "portfolio-paper-run-a-buy",
      symbol: "600000",
      sourceRunId: "run-a",
      side: "buy" as const,
      notionalValue: 2400,
      quantity: 2400,
      status: "pending_review" as const,
      riskStatus: "review" as const,
      reason: "portfolio paper order candidate requires operator review before staging"
    };
    const batch = {
      batchId: "portfolio-paper-batch-1",
      baseRunId: "portfolio-run-1",
      portfolioName: "A-share core basket",
      createdAt: "2026-05-27T08:05:00+00:00",
      mode: "portfolio_paper_order_review" as const,
      source: "portfolio_backtest",
      summary: {
        totalOrders: 1,
        totalNotionalValue: 2400,
        statusCounts: { pending_review: 1 },
        riskStatusCounts: { review: 1 }
      },
      orders: [order]
    };
    const auditEvent = {
      schemaVersion: 1 as const,
      eventId: "portfolio-paper-order-batch-portfolio-paper-batch-1",
      eventType: "portfolio_paper_order_batch",
      runId: "portfolio-run-1",
      createdAt: "2026-05-27T08:05:00+00:00",
      stage: "portfolio-paper-order-review",
      source: "portfolio_backtest",
      summary: "A-share core basket recorded 1 portfolio paper order candidates.",
      detail: "Portfolio paper order batch is paper-only and requires operator review before any simulated routing.",
      metadata: {
        batchId: "portfolio-paper-batch-1",
        totalOrders: 1,
        statusCounts: { pending_review: 1 },
        paperOnly: true,
        liveExecutionBlocked: true
      }
    };
    const lifecycle = [
      {
        batchId: "portfolio-paper-batch-1",
        baseRunId: "portfolio-run-1",
        portfolioName: "A-share core basket",
        orderId: "portfolio-paper-run-a-buy",
        symbol: "600000",
        sourceRunId: "run-a",
        side: "buy",
        quantity: 2400,
        notionalValue: 2400,
        originalStatus: "pending_review",
        riskStatus: "review",
        state: "awaiting_operator_review",
        routable: false,
        paperOnly: true,
        liveExecutionBlocked: true,
        approvedBy: null,
        reviewedAt: null,
        reason: "portfolio paper order candidate requires operator review before staging"
      }
    ];
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        json: async () =>
          init?.method === "POST"
            ? { portfolioPaperOrderBatch: batch, portfolioPaperOrderLifecycle: lifecycle, auditEvent }
            : { portfolioPaperOrderBatches: [batch] }
      };
    };

    const recordResult = await recordPortfolioPaperOrderBatch(
      "/",
      {
        baseRunId: "portfolio-run-1",
        portfolioName: "A-share core basket",
        orders: [order]
      },
      fetcher
    );
    const historyResult = await loadPortfolioPaperOrderBatches("/", "portfolio-run-1", fetcher);

    expect(recordResult.source).toBe("core");
    expect(recordResult.batch?.summary.statusCounts.pending_review).toBe(1);
    expect(recordResult.lifecycle?.map((row) => `${row.orderId}:${row.state}:${row.routable}`)).toEqual([
      "portfolio-paper-run-a-buy:awaiting_operator_review:false"
    ]);
    expect(recordResult.auditEvent?.eventId).toBe("portfolio-paper-order-batch-portfolio-paper-batch-1");
    expect(recordResult.auditEvent?.metadata.paperOnly).toBe(true);
    expect(historyResult.source).toBe("core");
    expect(historyResult.batches[0].orders[0].orderId).toBe("portfolio-paper-run-a-buy");
    expect(calls[0]).toMatchObject({ url: "/api/portfolio/paper-orders" });
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      baseRunId: "portfolio-run-1",
      portfolioName: "A-share core basket",
      orders: [order],
      source: "portfolio_backtest"
    });
    expect(calls[1].url).toBe("/api/portfolio/paper-orders?baseRunId=portfolio-run-1&limit=20");
  });

  test("records and loads portfolio paper order approvals from the Python core", async () => {
    const approval = {
      approvalId: "portfolio-paper-order-approval-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderId: "portfolio-paper-run-a-buy",
      reviewedAt: "2026-05-27T08:45:00+00:00",
      approved: true,
      reviewer: "operator-a",
      reason: "Approved for paper simulation only."
    };
    const lifecycle = [
      {
        batchId: "portfolio-paper-batch-1",
        baseRunId: "portfolio-run-1",
        portfolioName: "A-share core basket",
        orderId: "portfolio-paper-run-a-buy",
        symbol: "600000",
        sourceRunId: "run-a",
        side: "buy",
        quantity: 2400,
        notionalValue: 2400,
        originalStatus: "pending_review",
        riskStatus: "passed",
        state: "ready_for_simulation",
        routable: true,
        paperOnly: true,
        liveExecutionBlocked: true,
        approvedBy: "operator-a",
        reviewedAt: "2026-05-27T08:45:00+00:00",
        reason: "Approved for paper simulation only."
      }
    ];
    const auditEvent = {
      schemaVersion: 1 as const,
      eventId: "portfolio-paper-order-approval-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      eventType: "portfolio_paper_order_approval",
      runId: "portfolio-run-1",
      createdAt: "2026-05-27T08:45:00+00:00",
      stage: "portfolio-paper-order-approval",
      source: "operator-review",
      summary: "operator-a approved portfolio paper order portfolio-paper-run-a-buy.",
      detail: "Approved for paper simulation only.",
      metadata: {
        approvalId: "portfolio-paper-order-approval-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
        batchId: "portfolio-paper-batch-1",
        orderId: "portfolio-paper-run-a-buy",
        approved: true,
        reviewer: "operator-a",
        approvalState: "ready_for_simulation",
        routable: true,
        paperOnly: true,
        liveExecutionBlocked: true
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        json: async () =>
          init?.method === "POST"
            ? { approval, approvals: [approval], portfolioPaperOrderLifecycle: lifecycle, auditEvent }
            : { approvals: [approval], portfolioPaperOrderLifecycle: lifecycle }
      };
    };

    const recordResult = await recordPortfolioPaperOrderApproval(
      "/",
      {
        baseRunId: "portfolio-run-1",
        batchId: "portfolio-paper-batch-1",
        orderId: "portfolio-paper-run-a-buy",
        approved: true,
        reviewer: "operator-a",
        reviewedAt: "2026-05-27T08:45:00+00:00",
        reason: "Approved for paper simulation only."
      },
      fetcher
    );
    const historyResult = await loadPortfolioPaperOrderApprovals(
      "/",
      "portfolio-run-1",
      "portfolio-paper-batch-1",
      fetcher
    );

    expect(recordResult.source).toBe("core");
    expect(recordResult.approval?.reviewer).toBe("operator-a");
    expect(recordResult.lifecycle?.map((row) => `${row.orderId}:${row.state}:${row.routable}:${row.approvedBy}`)).toEqual([
      "portfolio-paper-run-a-buy:ready_for_simulation:true:operator-a"
    ]);
    expect(recordResult.auditEvent?.metadata.approvalState).toBe("ready_for_simulation");
    expect(historyResult.source).toBe("core");
    expect(historyResult.approvals[0].approvalId).toBe(
      "portfolio-paper-order-approval-portfolio-paper-batch-1-portfolio-paper-run-a-buy"
    );
    expect(historyResult.lifecycle.map((row) => row.state)).toEqual(["ready_for_simulation"]);
    expect(calls[0]).toMatchObject({ url: "/api/portfolio/paper-order-approvals" });
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderId: "portfolio-paper-run-a-buy",
      approved: true,
      reviewer: "operator-a",
      reviewedAt: "2026-05-27T08:45:00+00:00",
      reason: "Approved for paper simulation only."
    });
    expect(calls[1].url).toBe(
      "/api/portfolio/paper-order-approvals?baseRunId=portfolio-run-1&batchId=portfolio-paper-batch-1"
    );
  });

  test("records and loads portfolio paper order simulations from the Python core", async () => {
    const simulation = {
      simulationId: "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderId: "portfolio-paper-run-a-buy",
      simulatedAt: "2026-05-27T08:46:00+00:00",
      mode: "portfolio_paper_order_simulation",
      symbol: "600000",
      sourceRunId: "run-a",
      side: "buy",
      quantity: 2400,
      fillPrice: 9.2,
      notionalValue: 22080,
      orderState: "filled",
      fillStatus: "filled",
      reason: "Paper-only simulation filled the approved portfolio order.",
      approvedBy: "operator-a",
      paperOnly: true,
      liveExecutionBlocked: true
    };
    const lifecycle = [
      {
        batchId: "portfolio-paper-batch-1",
        baseRunId: "portfolio-run-1",
        portfolioName: "A-share core basket",
        orderId: "portfolio-paper-run-a-buy",
        symbol: "600000",
        sourceRunId: "run-a",
        side: "buy",
        quantity: 2400,
        notionalValue: 22080,
        originalStatus: "pending_review",
        riskStatus: "passed",
        state: "ready_for_simulation",
        routable: true,
        paperOnly: true,
        liveExecutionBlocked: true,
        approvedBy: "operator-a",
        reviewedAt: "2026-05-27T08:45:00+00:00",
        reason: "Approved for paper simulation only."
      }
    ];
    const auditEvent = {
      schemaVersion: 1 as const,
      eventId: "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      eventType: "portfolio_paper_order_simulation",
      runId: "portfolio-run-1",
      createdAt: "2026-05-27T08:46:00+00:00",
      stage: "portfolio-paper-order-simulation",
      source: "paper-simulator",
      summary: "Paper simulation filled portfolio-paper-run-a-buy.",
      detail: "Paper-only simulation filled the approved portfolio order.",
      metadata: {
        simulationId: "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
        batchId: "portfolio-paper-batch-1",
        orderId: "portfolio-paper-run-a-buy",
        orderState: "filled",
        fillStatus: "filled",
        approvalState: "ready_for_simulation",
        paperOnly: true,
        liveExecutionBlocked: true
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        json: async () =>
          init?.method === "POST"
            ? { simulation, simulations: [simulation], portfolioPaperOrderLifecycle: lifecycle, auditEvent }
            : { simulations: [simulation], portfolioPaperOrderLifecycle: lifecycle }
      };
    };

    const recordResult = await recordPortfolioPaperOrderSimulation(
      "/",
      {
        baseRunId: "portfolio-run-1",
        batchId: "portfolio-paper-batch-1",
        orderId: "portfolio-paper-run-a-buy",
        simulatedAt: "2026-05-27T08:46:00+00:00"
      },
      fetcher
    );
    const historyResult = await loadPortfolioPaperOrderSimulations(
      "/",
      "portfolio-run-1",
      "portfolio-paper-batch-1",
      fetcher
    );

    expect(recordResult.source).toBe("core");
    expect(recordResult.simulation?.orderState).toBe("filled");
    expect(recordResult.simulation?.fillPrice).toBe(9.2);
    expect(recordResult.lifecycle?.map((row) => row.state)).toEqual(["ready_for_simulation"]);
    expect(recordResult.auditEvent?.metadata.approvalState).toBe("ready_for_simulation");
    expect(historyResult.source).toBe("core");
    expect(historyResult.simulations[0].simulationId).toBe(
      "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy"
    );
    expect(calls[0]).toMatchObject({ url: "/api/portfolio/paper-order-simulations" });
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderId: "portfolio-paper-run-a-buy",
      simulatedAt: "2026-05-27T08:46:00+00:00"
    });
    expect(calls[1].url).toBe(
      "/api/portfolio/paper-order-simulations?baseRunId=portfolio-run-1&batchId=portfolio-paper-batch-1"
    );
  });

  test("loads portfolio paper order replay account snapshots", async () => {
    const replay = {
      schemaVersion: 1 as const,
      baseRunId: "portfolio-run-1",
      generatedAt: "2026-05-27T09:00:00+00:00",
      mode: "portfolio_paper_order_replay" as const,
      initialCash: 50000,
      account: { cash: 40800, positions: { "600000": 1000 }, equity: 50000 },
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
    const calls: string[] = [];
    const fetcher = async (url: string) => {
      calls.push(url);
      return { ok: true, json: async () => ({ replay }) };
    };

    const result = await loadPortfolioPaperOrderReplay("/", "portfolio-run-1", fetcher, 50000);

    expect(buildPortfolioPaperOrderReplayUrl("/", { baseRunId: "portfolio-run-1", initialCash: 50000 })).toBe(
      "/api/portfolio/paper-order-replay?baseRunId=portfolio-run-1&initialCash=50000"
    );
    expect(calls[0]).toBe("/api/portfolio/paper-order-replay?baseRunId=portfolio-run-1&initialCash=50000");
    expect(result.source).toBe("core");
    expect(result.replay?.account.cash).toBe(40800);
    expect(result.replay?.positions[0].symbol).toBe("600000");
    expect(result.replay?.orders[0].replayState).toBe("applied");
  });

  test("loads portfolio paper order state history timelines", async () => {
    const stateHistory = {
      schemaVersion: 1 as const,
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      portfolioName: "A-share state basket",
      generatedAt: "2026-05-27T09:00:00+00:00",
      mode: "portfolio_paper_order_state_history" as const,
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
          batchId: "portfolio-paper-batch-1",
          baseRunId: "portfolio-run-1",
          portfolioName: "A-share state basket",
          orderId: "portfolio-paper-run-a-buy",
          symbol: "600000",
          sourceRunId: "run-a",
          side: "buy" as const,
          quantity: 1000,
          notionalValue: 9200,
          originalStatus: "pending_review" as const,
          riskStatus: "passed" as const,
          currentState: "live_blocked",
          currentStateLabel: "Live route blocked",
          paperOnly: true,
          liveExecutionBlocked: true,
          events: [
            {
              eventId: "portfolio-paper-batch-1:portfolio-paper-run-a-buy:created:1",
              batchId: "portfolio-paper-batch-1",
              baseRunId: "portfolio-run-1",
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
              eventId: "portfolio-paper-batch-1:portfolio-paper-run-a-buy:operator_approved:3",
              batchId: "portfolio-paper-batch-1",
              baseRunId: "portfolio-run-1",
              orderId: "portfolio-paper-run-a-buy",
              timestamp: "2026-05-27T08:45:00+00:00",
              state: "operator_approved",
              label: "Operator approved",
              actor: "operator-a",
              source: "operator-review",
              reason: "Approved.",
              paperOnly: true,
              liveExecutionBlocked: true
            },
            {
              eventId: "portfolio-paper-batch-1:portfolio-paper-run-a-buy:simulation_filled:4",
              batchId: "portfolio-paper-batch-1",
              baseRunId: "portfolio-run-1",
              orderId: "portfolio-paper-run-a-buy",
              timestamp: "2026-05-27T08:46:00+00:00",
              state: "simulation_filled",
              label: "Paper simulation filled",
              actor: "operator-a",
              source: "paper-simulator",
              reason: "Filled.",
              paperOnly: true,
              liveExecutionBlocked: true,
              metadata: { simulationId: "sim-state", fillPrice: 9.2, fillStatus: "filled", orderState: "filled" }
            },
            {
              eventId: "portfolio-paper-batch-1:portfolio-paper-run-a-buy:live_blocked:5",
              batchId: "portfolio-paper-batch-1",
              baseRunId: "portfolio-run-1",
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
    };
    const calls: string[] = [];
    const fetcher = async (url: string) => {
      calls.push(url);
      return { ok: true, json: async () => ({ stateHistory }) };
    };

    const result = await loadPortfolioPaperOrderStateHistory(
      "/",
      "portfolio-run-1",
      "portfolio-paper-batch-1",
      fetcher
    );

    expect(calls[0]).toBe(
      "/api/portfolio/paper-order-state-history?baseRunId=portfolio-run-1&batchId=portfolio-paper-batch-1"
    );
    expect(result.source).toBe("core");
    expect(result.stateHistory?.summary.eventCount).toBe(4);
    expect(result.stateHistory?.orders[0].events.map((event) => event.state)).toEqual([
      "created",
      "operator_approved",
      "simulation_filled",
      "live_blocked"
    ]);
  });

  test("loads golden path status from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadGoldenPathStatus(
      "http://127.0.0.1:8765/",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => ({
            goldenPath: {
              schemaVersion: 1,
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              status: "blocked",
              currentStepId: "paper-execution",
              latestRunId: "run-golden",
              nextAction: {
                id: "submit-paper-order",
                label: "Submit paper order",
                targetWorkspace: "execution",
                reason: "Audited AI evidence is ready, but no paper execution is bound."
              },
              summary: {
                totalSteps: 6,
                passedSteps: 4,
                reviewSteps: 1,
                blockedSteps: 1,
                currentStepLabel: "Paper execution",
                nextActionId: "submit-paper-order",
                liveTradingAllowed: false
              },
              workspaces: [
                {
                  id: "research",
                  label: "Research",
                  status: "ready",
                  current: false,
                  stepIds: ["research-run"],
                  reason: "Audit run is bound.",
                  actionId: null
                },
                {
                  id: "execution",
                  label: "Execution",
                  status: "needs_run",
                  current: true,
                  stepIds: ["paper-execution"],
                  reason: "Submit a paper execution before promotion.",
                  actionId: "submit-paper-order"
                }
              ],
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
                  stepId: "paper-execution",
                  label: "Paper execution",
                  workspaceId: "execution",
                  status: "review",
                  current: true,
                  passed: false,
                  detail: "Submit a paper execution before promotion.",
                  blocker: "Submit a paper execution before promotion.",
                  actionId: "submit-paper-order",
                  actionLabel: "Submit paper order"
                }
              ],
              steps: [
                {
                  id: "market-data",
                  label: "Market data",
                  status: "passed",
                  passed: true,
                  detail: "Fresh cache exists.",
                  actionId: null
                },
                {
                  id: "paper-execution",
                  label: "Paper execution",
                  status: "review",
                  passed: false,
                  detail: "Submit a paper execution before promotion.",
                  actionId: "submit-paper-order"
                }
              ]
            }
          })
        };
      }
    );

    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/golden-path/status?market=ashare&symbol=600000&timeframe=1d"
    ]);
    expect(result.source).toBe("core");
    expect(result.goldenPath?.currentStepId).toBe("paper-execution");
    expect(result.goldenPath?.nextAction?.targetWorkspace).toBe("execution");
    expect(result.goldenPath?.summary.passedSteps).toBe(4);
    expect(result.goldenPath?.workspaces.find((workspace) => workspace.id === "execution")?.status).toBe("needs_run");
    expect(result.goldenPath?.runbook.find((item) => item.stepId === "paper-execution")?.workspaceId).toBe("execution");
  });

  test("rejects stale golden path status payloads without a runbook", async () => {
    const result = await loadGoldenPathStatus(
      "http://127.0.0.1:8765/",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      async () => ({
        ok: true,
        json: async () => ({
          goldenPath: {
            schemaVersion: 1,
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            status: "blocked",
            currentStepId: "research-run",
            latestRunId: null,
            nextAction: {
              id: "run-pipeline",
              label: "Run research pipeline",
              targetWorkspace: "research",
              reason: "Run the research pipeline."
            },
            summary: {
              totalSteps: 6,
              passedSteps: 1,
              reviewSteps: 0,
              blockedSteps: 5,
              currentStepLabel: "Audited research run",
              nextActionId: "run-pipeline",
              liveTradingAllowed: false
            },
            workspaces: [],
            steps: []
          }
        })
      })
    );

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid golden path status contract");
  });

  test("validates the active strategy draft through the Python core", async () => {
    const calls: Array<{ url: string; body?: string }> = [];
    const result = await validateStrategySnapshot(
      "http://127.0.0.1:8765/",
      {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategy: {
          name: "Validated SMA plan",
          entry: "Close > SMA8",
          exit: "Close < SMA21",
          position: "40% cap per instrument",
          risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
        }
      },
      async (url, init) => {
        calls.push({ url, body: String(init?.body ?? "") });
        return {
          ok: true,
          json: async () => ({
            validation: {
              status: "review",
              revision: "rev-validated",
              gates: [
                {
                  id: "schema",
                  label: "Strategy schema",
                  value: "SMA8 / SMA21",
                  detail: "Entry and exit conditions are structured.",
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
              ],
              strategyConfig: {
                name: "Validated SMA plan",
                revision: "rev-validated",
                market: "ashare",
                symbols: ["600000"],
                timeframe: "1d",
                version: 1,
                entryConditions: [{ kind: "close_above_sma", params: { window: 8 } }],
                exitConditions: [{ kind: "close_below_sma", params: { window: 21 } }],
                risk: {
                  positionPct: 0.4,
                  stopLossPct: 0.06,
                  takeProfitPct: 0.12,
                  maxDrawdownPct: 0.09
                }
              }
            }
          })
        };
      }
    );

    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/strategies/validate");
    expect(JSON.parse(calls[0].body ?? "{}").strategy.entry).toBe("Close > SMA8");
    expect(result.source).toBe("core");
    expect(result.validation?.status).toBe("review");
    expect(result.validation?.gates[0]).toMatchObject({ id: "schema", status: "passed" });
  });

  test("surfaces blocked strategy save validation from the Python core", async () => {
    const result = await saveStrategySnapshot(
      "http://127.0.0.1:8765/",
      {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategy: {
          name: "Blocked SMA plan",
          entry: "Close > SMA8",
          exit: "Close < SMA21",
          position: "40% cap per instrument",
          risk: "Stop -6%, drawdown guard 9%, paper only"
        }
      },
      async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          error: "strategy_not_ready",
          detail: "strategy_preflight_blocked",
          validation: {
            status: "blocked",
            revision: "rev-blocked",
            gates: [
              {
                id: "risk",
                label: "Risk controls",
                value: "pending",
                detail: "Position sizing and risk guardrails must be explicit.",
                status: "blocked",
                tone: "risk"
              }
            ],
            strategyConfig: {
              name: "Blocked SMA plan",
              revision: "rev-blocked",
              market: "ashare",
              symbols: ["600000"],
              timeframe: "1d",
              version: 1,
              entryConditions: [{ kind: "close_above_sma", params: { window: 8 } }],
              exitConditions: [{ kind: "close_below_sma", params: { window: 21 } }],
              risk: {
                positionPct: 0.4,
                stopLossPct: 0.06,
                takeProfitPct: 0.18,
                maxDrawdownPct: 0.09
              }
            }
          }
        })
      })
    );

    expect(result.source).toBe("core");
    expect(result.strategy).toBeUndefined();
    expect(result.error).toBe("strategy_not_ready");
    expect(result.validation?.status).toBe("blocked");
    expect(result.validation?.gates[0]).toMatchObject({ id: "risk", status: "blocked" });
  });

  test("normalizes older core workspace navigation to the workflow-first contract", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      quantLoop: [
        { id: "idea", label: "Idea Lab", status: "active" },
        { id: "data", label: "Data & Factor", status: "ready" },
        { id: "strategy", label: "Strategy Builder", status: "ready" },
        { id: "backtest", label: "Backtest Lab", status: "ready" },
        { id: "agent-review", label: "Agent Review", status: "ready" },
        { id: "paper", label: "Paper Trading", status: "ready" },
        { id: "broker", label: "Broker Center", status: "locked" }
      ]
    };

    const result = await loadTerminalWorkspace("http://127.0.0.1:8765", async () => ({
      ok: true,
      json: async () => remoteWorkspace
    }));

    expect(result.workspace.quantLoop.map((step) => step.id)).toEqual([
      "research",
      "strategy",
      "backtest",
      "agent-review",
      "paper"
    ]);
    expect(result.workspace.quantLoop.map((step) => step.label)).toEqual([
      "Market Research",
      "Strategy Lab",
      "Backtest Review",
      "Agent Review",
      "Paper Trading"
    ]);
  });

  test("falls back to the bundled workspace when the Python core is unavailable", async () => {
    const result = await loadTerminalWorkspace("http://127.0.0.1:8765", async () => {
      throw new Error("offline");
    });

    expect(result.source).toBe("fallback");
    expect(result.statusLabel).toBe("Offline snapshot");
    expect(result.workspace.execution.liveEnabled).toBe(false);
    expect(result.workspace.selectedInstrument.symbol).toBe("600000");
  });

  test("loads settings status without exposing secret values", async () => {
    const calls: string[] = [];
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          settings: {
            schemaVersion: 1,
            generatedAt: "2026-05-31T09:00:00+08:00",
            dataSources: [
              {
                market: "us",
                label: "US equities",
                quoteSource: "finnhub / yfinance",
                klineSource: "yahoo / yfinance",
                status: "ready",
                optionalKeyName: "FINNHUB_API_KEY",
                optionalKeyConfigured: true,
                note: "Secret values stay local."
              }
            ],
            cache: {
              engine: "sqlite",
              path: "data/market.sqlite",
              exists: true,
              scope: "ohlcv",
              rowCount: 1280,
              contextCount: 12,
              latestTimestamp: "2026-05-29T00:00:00+00:00",
              freshnessSummary: {
                fresh: 1,
                stale: 0,
                empty: 0
              },
              contexts: [
                {
                  market: "ashare",
                  symbol: "600000",
                  timeframe: "1d",
                  rowCount: 500,
                  startTimestamp: "2025-09-12T00:00:00+08:00",
                  endTimestamp: "2026-05-29T00:00:00+08:00",
                  freshness: "fresh",
                  ageHours: 48
                }
              ]
            },
            executionAdapters: [
              {
                id: "paper-local",
                market: "multi",
                adapter: "Paper Trading",
                route: "paper",
                status: "paper_ready",
                certification: "local",
                liveTradingAllowed: false,
                note: "Paper only."
              }
            ],
            safety: {
              liveTradingAllowed: false,
              requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
            }
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/settings/status"]);
    expect(result.source).toBe("core");
    expect(result.settings?.dataSources[0]).toMatchObject({
      market: "us",
      optionalKeyName: "FINNHUB_API_KEY",
      optionalKeyConfigured: true
    });
    expect((result.settings?.cache as unknown as { rowCount?: number }).rowCount).toBe(1280);
    expect((result.settings?.cache as unknown as { contextCount?: number }).contextCount).toBe(12);
    expect((result.settings?.cache as unknown as { latestTimestamp?: string | null }).latestTimestamp).toBe(
      "2026-05-29T00:00:00+00:00"
    );
    expect((result.settings?.cache as unknown as { contexts?: unknown[] }).contexts?.[0]).toMatchObject({
      market: "ashare",
      symbol: "600000",
      rowCount: 500
    });
    expect((result.settings?.cache as unknown as { contexts?: Array<{ freshness?: string; ageHours?: number }> }).contexts?.[0]).toMatchObject({
      freshness: "fresh",
      ageHours: 48
    });
    expect((result.settings?.cache as unknown as { freshnessSummary?: { fresh?: number } }).freshnessSummary?.fresh).toBe(1);
    expect(JSON.stringify(result.settings)).not.toContain("secret-finnhub-token");
  });

  test("loads execution adapter state ledger from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadExecutionAdapterLedger("http://127.0.0.1:8765/", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          adapterLedger: {
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
                  {
                    id: "paper-order-risk",
                    label: "Paper risk check",
                    passed: true,
                    reason: "Local risk checks are available."
                  }
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
                  {
                    id: "adapter-certified",
                    label: "Adapter certified",
                    passed: false,
                    reason: "No certified A-share broker API is connected."
                  }
                ],
                events: [
                  {
                    eventId: "adapter-ledger:ashare-live:live_blocked",
                    adapterId: "ashare-live",
                    timestamp: "2026-06-07T09:31:00+00:00",
                    state: "live_blocked",
                    label: "Live route blocked",
                    actor: "execution-safety",
                    source: "settings-status",
                    reason: "Live execution remains blocked until adapter certification, risk approval, and human confirmation pass.",
                    liveTradingAllowed: false
                  }
                ]
              }
            ]
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/execution/adapter-ledger"]);
    expect(result.source).toBe("core");
    expect(result.adapterLedger?.summary.blockedLiveAdapters).toBe(1);
    expect(result.adapterLedger?.adapters[1].events[0]).toMatchObject({
      adapterId: "ashare-live",
      state: "live_blocked",
      liveTradingAllowed: false
    });
    expect(JSON.stringify(result.adapterLedger)).not.toContain("secret");
  });

  test("records and loads execution adapter certification evidence without secrets", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const certification = {
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
          metadata: { apiKey: "[redacted]", keyId: "paper-us-key" }
        },
        {
          id: "controlled-restart",
          label: "Controlled restart",
          status: "blocked",
          detail: "Controlled restart evidence is missing.",
          metadata: { token: "[redacted]", restartWindow: "manual" }
        }
      ],
      metadata: { source: "settings-panel", password: "[redacted]" },
      summary: {
        checkCount: 2,
        checkStatusCounts: { blocked: 1, passed: 1 },
        passedChecks: 1,
        blockedChecks: 1,
        failedChecks: 0,
        reviewChecks: 0
      },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (init?.method === "POST") {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            adapterCertification: certification,
            auditEvent: {
              schemaVersion: 1,
              eventId: "adapter-certification-us-live",
              eventType: "execution_adapter_certification",
              runId: "",
              createdAt: "2026-06-08T08:01:00+00:00",
              stage: "execution-adapter-certification",
              source: "execution-adapter-ledger",
              summary: "us-live certification recorded as blocked.",
              detail: "Adapter certification evidence is stored without secrets and live trading remains blocked.",
              metadata: {
                adapterId: "us-live",
                status: "blocked",
                liveTradingAllowed: false
              }
            }
          })
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ adapterCertifications: [certification] })
      };
    };

    const recordResult = await recordExecutionAdapterCertification(
      "/",
      {
        adapterId: "us-live",
        market: "us",
        route: "live",
        operator: "local-operator",
        checks: [
          {
            id: "sandbox-credentials",
            label: "Sandbox credentials",
            status: "passed",
            detail: "Sandbox references are present.",
            metadata: { credentialRef: "paper-us-key" }
          },
          {
            id: "controlled-restart",
            label: "Controlled restart",
            status: "blocked",
            detail: "Controlled restart evidence is missing.",
            metadata: { restartWindow: "manual" }
          }
        ],
        metadata: { source: "settings-panel" }
      },
      fetcher
    );
    const loadResult = await loadExecutionAdapterCertifications("/", "us-live", fetcher, 3);

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-certifications",
      "GET /api/execution/adapter-certifications?adapterId=us-live&limit=3"
    ]);
    expect(calls[0].body).toMatchObject({
      adapterId: "us-live",
      route: "live",
      checks: [{ id: "sandbox-credentials" }, { id: "controlled-restart" }]
    });
    expect(JSON.stringify(calls[0].body)).not.toContain("apiKey");
    expect(recordResult.source).toBe("core");
    expect(recordResult.adapterCertification?.status).toBe("blocked");
    expect(recordResult.adapterCertification?.summary.checkStatusCounts).toEqual({ blocked: 1, passed: 1 });
    expect(recordResult.auditEvent?.eventType).toBe("execution_adapter_certification");
    expect(loadResult.adapterCertifications[0].adapterId).toBe("us-live");
    expect(loadResult.adapterCertifications[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(recordResult)).not.toContain("secret-key-should-not-leak");
    expect(JSON.stringify(loadResult)).not.toContain("token-should-not-leak");
  });

  test("records execution adapter certification apply preflight results", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const certificationApply = {
      schemaVersion: 1,
      applyId: "execution-adapter-certification-apply-us-live",
      certificationId: "adapter-certification-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "blocked",
      operator: "local-operator",
      generatedAt: "2026-06-08T08:05:00+00:00",
      applyMode: "manual_secret_store",
      restartRequired: true,
      requiredConfirmations: [
        {
          id: "secret-reference-stored",
          label: "Secret-store reference is saved outside the UI",
          status: "missing"
        },
        {
          id: "controlled-restart-window-approved",
          label: "Controlled restart window is approved",
          status: "missing"
        },
        {
          id: "operator-reviewed-certification",
          label: "Operator reviewed certification evidence and restart impact",
          status: "missing"
        }
      ],
      blockedReasons: [
        "secret_reference_not_confirmed",
        "controlled_restart_not_confirmed",
        "operator_review_not_confirmed"
      ],
      metadata: { source: "settings-panel", secretStorePath: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return {
        ok: false,
        status: 409,
        json: async () => ({
          certificationApply,
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-certification-apply-us-live",
            eventType: "execution_adapter_certification_apply",
            runId: "",
            createdAt: "2026-06-08T08:05:00+00:00",
            stage: "execution-adapter-certification-apply",
            source: "execution-adapter-ledger",
            summary: "us-live certification apply preflight recorded as blocked.",
            detail: "Certification apply preflight records manual confirmations without secrets.",
            metadata: {
              certificationId: "adapter-certification-us-live",
              adapterId: "us-live",
              status: "blocked",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterCertificationApplyUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-certifications/apply"
    );

    const result = await recordExecutionAdapterCertificationApply(
      "/",
      {
        certificationId: "adapter-certification-us-live",
        operator: "local-operator",
        confirmations: {
          secretReferenceStored: false,
          controlledRestartWindowApproved: false,
          operatorReviewedCertification: false
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-certifications/apply"
    ]);
    expect(calls[0]?.body).toEqual({
      certificationId: "adapter-certification-us-live",
      operator: "local-operator",
      confirmations: {
        secretReferenceStored: false,
        controlledRestartWindowApproved: false,
        operatorReviewedCertification: false
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.certificationApply?.status).toBe("blocked");
    expect(result.certificationApply?.blockedReasons).toContain("controlled_restart_not_confirmed");
    expect(result.auditEvent?.eventType).toBe("execution_adapter_certification_apply");
  });

  test("loads execution adapter certification apply history from the local core", async () => {
    const calls: string[] = [];
    const certificationApply = {
      schemaVersion: 1,
      applyId: "execution-adapter-certification-apply-us-live-ready",
      certificationId: "adapter-certification-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "ready_for_restart",
      operator: "local-operator",
      generatedAt: "2026-06-08T08:06:00+00:00",
      applyMode: "manual_secret_store",
      restartRequired: true,
      requiredConfirmations: [
        {
          id: "secret-reference-stored",
          label: "Secret-store reference is saved outside the UI",
          status: "confirmed"
        },
        {
          id: "controlled-restart-window-approved",
          label: "Controlled restart window is approved",
          status: "confirmed"
        },
        {
          id: "operator-reviewed-certification",
          label: "Operator reviewed certification evidence and restart impact",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", secretStorePath: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterCertificationApplies(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ certificationApplies: [certificationApply] })
        };
      },
      5
    );

    expect(buildExecutionAdapterCertificationAppliesUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-certifications/applies?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-certifications/applies?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.certificationApplies).toHaveLength(1);
    expect(result.certificationApplies[0].status).toBe("ready_for_restart");
    expect(result.certificationApplies[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret-key-should-not-leak");
  });

  test("records controlled restart evidence without enabling live routing", async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null
      });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          controlledRestartEvidence: {
            schemaVersion: 1,
            evidenceId: "execution-adapter-controlled-restart-us-live",
            applyId: "execution-adapter-certification-apply-us-live-ready",
            certificationId: "adapter-certification-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "evidence_recorded",
            operator: "restart-operator",
            recordedAt: "2026-06-08T08:10:00+00:00",
            evidenceMode: "manual_controlled_restart",
            restartRequired: true,
            requiredConfirmations: [
              {
                id: "restart-window-executed",
                label: "Controlled restart window was executed",
                status: "confirmed"
              },
              {
                id: "rollback-plan-confirmed",
                label: "Rollback plan is available and confirmed",
                status: "confirmed"
              },
              {
                id: "post-restart-validation-passed",
                label: "Post-restart validation passed",
                status: "confirmed"
              },
              {
                id: "operator-reviewed-restart-logs",
                label: "Operator reviewed restart logs and adapter status",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { restartWindowId: "window-us-live-1", privateKey: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-controlled-restart-us-live",
            eventType: "execution_adapter_controlled_restart_evidence",
            runId: "",
            createdAt: "2026-06-08T08:10:00+00:00",
            stage: "execution-adapter-controlled-restart",
            source: "execution-adapter-ledger",
            summary: "us-live controlled restart evidence recorded as evidence_recorded.",
            detail: "Controlled restart evidence is paper-only.",
            metadata: {
              evidenceId: "execution-adapter-controlled-restart-us-live",
              adapterId: "us-live",
              status: "evidence_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterControlledRestartEvidenceUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-certifications/restart-evidence"
    );

    const result = await recordExecutionAdapterControlledRestartEvidence(
      "/",
      {
        applyId: "execution-adapter-certification-apply-us-live-ready",
        operator: "restart-operator",
        confirmations: {
          restartWindowExecuted: true,
          rollbackPlanConfirmed: true,
          postRestartValidationPassed: true,
          operatorReviewedRestartLogs: true
        },
        metadata: { restartWindowId: "window-us-live-1" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-certifications/restart-evidence"
    ]);
    expect(calls[0]?.body).toEqual({
      applyId: "execution-adapter-certification-apply-us-live-ready",
      operator: "restart-operator",
      confirmations: {
        restartWindowExecuted: true,
        rollbackPlanConfirmed: true,
        postRestartValidationPassed: true,
        operatorReviewedRestartLogs: true
      },
      metadata: { restartWindowId: "window-us-live-1" }
    });
    expect(result.source).toBe("core");
    expect(result.controlledRestartEvidence?.status).toBe("evidence_recorded");
    expect(result.controlledRestartEvidence?.liveTradingAllowed).toBe(false);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_controlled_restart_evidence");
  });

  test("loads controlled restart evidence history from the local core", async () => {
    const calls: string[] = [];
    const controlledRestartEvidence = {
      schemaVersion: 1,
      evidenceId: "execution-adapter-controlled-restart-us-live",
      applyId: "execution-adapter-certification-apply-us-live-ready",
      certificationId: "adapter-certification-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "evidence_recorded",
      operator: "restart-operator",
      recordedAt: "2026-06-08T08:10:00+00:00",
      evidenceMode: "manual_controlled_restart",
      restartRequired: true,
      requiredConfirmations: [
        {
          id: "restart-window-executed",
          label: "Controlled restart window was executed",
          status: "confirmed"
        },
        {
          id: "rollback-plan-confirmed",
          label: "Rollback plan is available and confirmed",
          status: "confirmed"
        },
        {
          id: "post-restart-validation-passed",
          label: "Post-restart validation passed",
          status: "confirmed"
        },
        {
          id: "operator-reviewed-restart-logs",
          label: "Operator reviewed restart logs and adapter status",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { restartWindowId: "window-us-live-1", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterControlledRestartEvidence(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ controlledRestartEvidence: [controlledRestartEvidence] })
        };
      },
      5
    );

    expect(buildExecutionAdapterControlledRestartEvidenceHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-certifications/restart-evidence?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-certifications/restart-evidence?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.controlledRestartEvidence).toHaveLength(1);
    expect(result.controlledRestartEvidence[0].status).toBe("evidence_recorded");
    expect(result.controlledRestartEvidence[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toContain("restart-secret-should-not-leak");
  });

  test("records restart acceptance evidence without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          restartAcceptance: {
            schemaVersion: 1,
            acceptanceId: "execution-adapter-restart-acceptance-us-live",
            evidenceId: "execution-adapter-controlled-restart-us-live",
            applyId: "execution-adapter-certification-apply-us-live-ready",
            certificationId: "adapter-certification-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "acceptance_recorded",
            operator: "acceptance-operator",
            recordedAt: "2026-06-08T08:15:00+00:00",
            acceptanceMode: "manual_post_restart_acceptance",
            restartRequired: true,
            requiredConfirmations: [
              {
                id: "core-health-checked",
                label: "Local core health was checked after restart",
                status: "confirmed"
              },
              {
                id: "settings-reload-observed",
                label: "Adapter settings reload was observed",
                status: "confirmed"
              },
              {
                id: "paper-route-handshake-passed",
                label: "Sandbox or paper route handshake passed",
                status: "confirmed"
              },
              {
                id: "emergency-stop-armed",
                label: "Emergency stop remains armed",
                status: "confirmed"
              },
              {
                id: "account-sync-dry-run-passed",
                label: "Account sync dry-run passed",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { probeId: "post-restart-acceptance-1", privateKey: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-restart-acceptance-us-live",
            eventType: "execution_adapter_restart_acceptance",
            runId: "",
            createdAt: "2026-06-08T08:15:00+00:00",
            stage: "execution-adapter-restart-acceptance",
            source: "execution-adapter-ledger",
            summary: "us-live restart acceptance recorded as acceptance_recorded.",
            detail: "Post-restart acceptance is paper-only.",
            metadata: {
              acceptanceId: "execution-adapter-restart-acceptance-us-live",
              adapterId: "us-live",
              status: "acceptance_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterRestartAcceptanceUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-certifications/restart-acceptance"
    );

    const result = await recordExecutionAdapterRestartAcceptance(
      "/",
      {
        evidenceId: "execution-adapter-controlled-restart-us-live",
        operator: "acceptance-operator",
        confirmations: {
          coreHealthChecked: true,
          settingsReloadObserved: true,
          paperRouteHandshakePassed: true,
          emergencyStopArmed: true,
          accountSyncDryRunPassed: true
        },
        metadata: { probeId: "post-restart-acceptance-1" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-certifications/restart-acceptance"
    ]);
    expect(calls[0]?.body).toEqual({
      evidenceId: "execution-adapter-controlled-restart-us-live",
      operator: "acceptance-operator",
      confirmations: {
        coreHealthChecked: true,
        settingsReloadObserved: true,
        paperRouteHandshakePassed: true,
        emergencyStopArmed: true,
        accountSyncDryRunPassed: true
      },
      metadata: { probeId: "post-restart-acceptance-1" }
    });
    expect(result.source).toBe("core");
    expect(result.restartAcceptance?.status).toBe("acceptance_recorded");
    expect(result.restartAcceptance?.liveTradingAllowed).toBe(false);
    expect(result.restartAcceptance?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_restart_acceptance");
  });

  test("loads restart acceptance history from the local core", async () => {
    const calls: string[] = [];
    const restartAcceptance = {
      schemaVersion: 1,
      acceptanceId: "execution-adapter-restart-acceptance-us-live",
      evidenceId: "execution-adapter-controlled-restart-us-live",
      applyId: "execution-adapter-certification-apply-us-live-ready",
      certificationId: "adapter-certification-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "acceptance_recorded",
      operator: "acceptance-operator",
      recordedAt: "2026-06-08T08:15:00+00:00",
      acceptanceMode: "manual_post_restart_acceptance",
      restartRequired: true,
      requiredConfirmations: [
        {
          id: "core-health-checked",
          label: "Local core health was checked after restart",
          status: "confirmed"
        },
        {
          id: "settings-reload-observed",
          label: "Adapter settings reload was observed",
          status: "confirmed"
        },
        {
          id: "paper-route-handshake-passed",
          label: "Sandbox or paper route handshake passed",
          status: "confirmed"
        },
        {
          id: "emergency-stop-armed",
          label: "Emergency stop remains armed",
          status: "confirmed"
        },
        {
          id: "account-sync-dry-run-passed",
          label: "Account sync dry-run passed",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { probeId: "post-restart-acceptance-1", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterRestartAcceptances(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ restartAcceptances: [restartAcceptance] })
        };
      },
      5
    );

    expect(buildExecutionAdapterRestartAcceptanceHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-certifications/restart-acceptance?adapterId=us-live&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-certifications/restart-acceptance?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.restartAcceptances).toHaveLength(1);
    expect(result.restartAcceptances[0].status).toBe("acceptance_recorded");
    expect(result.restartAcceptances[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toContain("acceptance-secret-should-not-leak");
  });

  test("records execution adapter secret references without raw secret values", async () => {
    const calls: { url: string; method?: string; body?: unknown }[] = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method,
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterSecretReference: {
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
              {
                id: "reference-created-outside-ui",
                label: "Secret reference was created outside this UI",
                status: "confirmed"
              },
              {
                id: "operator-verified-fingerprint",
                label: "Operator verified the stored secret fingerprint",
                status: "confirmed"
              },
              {
                id: "rotation-plan-documented",
                label: "Secret rotation plan is documented",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel", secret: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-secret-reference-us-live",
            eventType: "execution_adapter_secret_reference",
            runId: "",
            createdAt: "2026-06-09T08:00:00+00:00",
            stage: "execution-adapter-secret-reference",
            source: "execution-adapter-ledger",
            summary: "us-live secret reference recorded as reference_recorded.",
            detail: "Secret reference is paper-only.",
            metadata: {
              referenceId: "execution-adapter-secret-reference-us-live",
              adapterId: "us-live",
              status: "reference_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterSecretReferenceUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-secret-references"
    );

    const result = await recordExecutionAdapterSecretReference(
      "/",
      {
        adapterId: "us-live",
        market: "us",
        route: "live",
        operator: "settings-panel",
        referenceName: "us-live/alpaca-sandbox",
        backend: "local-secret-store",
        requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
        confirmations: {
          referenceCreatedOutsideUi: true,
          operatorVerifiedFingerprint: true,
          rotationPlanDocumented: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-secret-references"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      market: "us",
      route: "live",
      operator: "settings-panel",
      referenceName: "us-live/alpaca-sandbox",
      backend: "local-secret-store",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      confirmations: {
        referenceCreatedOutsideUi: true,
        operatorVerifiedFingerprint: true,
        rotationPlanDocumented: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterSecretReference?.status).toBe("reference_recorded");
    expect(result.adapterSecretReference?.liveTradingAllowed).toBe(false);
    expect(result.adapterSecretReference?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_secret_reference");
  });

  test("loads secret reference history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const secretReference = {
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
        {
          id: "reference-created-outside-ui",
          label: "Secret reference was created outside this UI",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", privateKey: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterSecretReferences(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterSecretReferences: [secretReference] })
        };
      },
      5
    );

    expect(buildExecutionAdapterSecretReferenceHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-secret-references?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-secret-references?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterSecretReferences).toHaveLength(1);
    expect(result.adapterSecretReferences[0].status).toBe("reference_recorded");
    expect(result.adapterSecretReferences[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterSecretReferences(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterSecretReferences: [
            {
              ...secretReference,
              metadata: { privateKey: "secret-reference-private-key-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterSecretReferences).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("secret-reference-private-key-should-not-leak");
  });

  test("records secret materialization manifests against a reference without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterSecretMaterialization: {
            schemaVersion: 1,
            materializationId: "execution-adapter-secret-materialization-us-live",
            referenceId: "execution-adapter-secret-reference-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "manifest_recorded",
            operator: "settings-panel",
            recordedAt: "2026-06-09T08:10:00+00:00",
            materializationMode: "local_secret_store_manifest",
            referenceName: "us-live/alpaca-sandbox",
            backend: "local-secret-store",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              {
                id: "local-secret-store-write-verified",
                label: "Local secret-store write was verified",
                status: "confirmed"
              },
              {
                id: "no-raw-secret-in-payload",
                label: "No raw secret is present in this payload",
                status: "confirmed"
              },
              {
                id: "env-binding-plan-documented",
                label: "Environment binding plan is documented",
                status: "confirmed"
              },
              {
                id: "rollback-plan-documented",
                label: "Rollback plan is documented",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-secret-materialization-us-live",
            eventType: "execution_adapter_secret_materialization",
            runId: "",
            createdAt: "2026-06-09T08:10:00+00:00",
            stage: "execution-adapter-secret-materialization",
            source: "execution-adapter-ledger",
            summary: "us-live secret materialization manifest recorded as manifest_recorded.",
            detail: "Secret materialization is paper-only.",
            metadata: {
              materializationId: "execution-adapter-secret-materialization-us-live",
              adapterId: "us-live",
              status: "manifest_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterSecretMaterializationUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-secret-materializations"
    );

    const result = await recordExecutionAdapterSecretMaterialization(
      "/",
      {
        adapterId: "us-live",
        referenceId: "execution-adapter-secret-reference-us-live",
        operator: "settings-panel",
        manifestPath: "local-secret-store://us-live/alpaca-sandbox",
        confirmations: {
          localSecretStoreWriteVerified: true,
          noRawSecretInPayload: true,
          envBindingPlanDocumented: true,
          rollbackPlanDocumented: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-secret-materializations"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      referenceId: "execution-adapter-secret-reference-us-live",
      operator: "settings-panel",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      confirmations: {
        localSecretStoreWriteVerified: true,
        noRawSecretInPayload: true,
        envBindingPlanDocumented: true,
        rollbackPlanDocumented: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterSecretMaterialization?.status).toBe("manifest_recorded");
    expect(result.adapterSecretMaterialization?.referenceId).toBe("execution-adapter-secret-reference-us-live");
    expect(result.adapterSecretMaterialization?.liveTradingAllowed).toBe(false);
    expect(result.adapterSecretMaterialization?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_secret_materialization");
  });

  test("loads secret materialization history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const materialization = {
      schemaVersion: 1,
      materializationId: "execution-adapter-secret-materialization-us-live",
      referenceId: "execution-adapter-secret-reference-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "manifest_recorded",
      operator: "settings-panel",
      recordedAt: "2026-06-09T08:10:00+00:00",
      materializationMode: "local_secret_store_manifest",
      referenceName: "us-live/alpaca-sandbox",
      backend: "local-secret-store",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        {
          id: "local-secret-store-write-verified",
          label: "Local secret-store write was verified",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", privateKey: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterSecretMaterializations(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterSecretMaterializations: [materialization] })
        };
      },
      5
    );

    expect(buildExecutionAdapterSecretMaterializationHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-secret-materializations?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-secret-materializations?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterSecretMaterializations).toHaveLength(1);
    expect(result.adapterSecretMaterializations[0].status).toBe("manifest_recorded");
    expect(result.adapterSecretMaterializations[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterSecretMaterializations(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterSecretMaterializations: [
            {
              ...materialization,
              metadata: { privateKey: "secret-materialization-private-key-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterSecretMaterializations).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("secret-materialization-private-key-should-not-leak");
  });

  test("records environment binding evidence after secret materialization without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterEnvironmentBinding: {
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
              {
                id: "runtime-env-mapping-verified",
                label: "Runtime environment mapping was verified",
                status: "confirmed"
              },
              {
                id: "config-reload-plan-documented",
                label: "Config reload plan is documented",
                status: "confirmed"
              },
              {
                id: "no-raw-secret-in-payload",
                label: "No raw secret is present in this payload",
                status: "confirmed"
              },
              {
                id: "rollback-snapshot-recorded",
                label: "Rollback snapshot is recorded",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-environment-binding-us-live",
            eventType: "execution_adapter_environment_binding",
            runId: "",
            createdAt: "2026-06-09T08:20:00+00:00",
            stage: "execution-adapter-environment-binding",
            source: "execution-adapter-ledger",
            summary: "us-live environment binding recorded as binding_recorded.",
            detail: "Environment binding is paper-only.",
            metadata: {
              bindingId: "execution-adapter-environment-binding-us-live",
              adapterId: "us-live",
              status: "binding_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterEnvironmentBindingUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-environment-bindings"
    );

    const result = await recordExecutionAdapterEnvironmentBinding(
      "/",
      {
        adapterId: "us-live",
        materializationId: "execution-adapter-secret-materialization-us-live",
        operator: "settings-panel",
        bindingMode: "container_env_reference",
        confirmations: {
          runtimeEnvMappingVerified: true,
          configReloadPlanDocumented: true,
          noRawSecretInPayload: true,
          rollbackSnapshotRecorded: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-environment-bindings"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      operator: "settings-panel",
      bindingMode: "container_env_reference",
      confirmations: {
        runtimeEnvMappingVerified: true,
        configReloadPlanDocumented: true,
        noRawSecretInPayload: true,
        rollbackSnapshotRecorded: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterEnvironmentBinding?.status).toBe("binding_recorded");
    expect(result.adapterEnvironmentBinding?.materializationId).toBe("execution-adapter-secret-materialization-us-live");
    expect(result.adapterEnvironmentBinding?.liveTradingAllowed).toBe(false);
    expect(result.adapterEnvironmentBinding?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_environment_binding");
  });

  test("loads environment binding history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const binding = {
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
        {
          id: "runtime-env-mapping-verified",
          label: "Runtime environment mapping was verified",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", privateKey: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterEnvironmentBindings(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterEnvironmentBindings: [binding] })
        };
      },
      5
    );

    expect(buildExecutionAdapterEnvironmentBindingHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-environment-bindings?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-environment-bindings?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterEnvironmentBindings).toHaveLength(1);
    expect(result.adapterEnvironmentBindings[0].status).toBe("binding_recorded");
    expect(result.adapterEnvironmentBindings[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterEnvironmentBindings(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterEnvironmentBindings: [
            {
              ...binding,
              metadata: { privateKey: "environment-binding-private-key-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterEnvironmentBindings).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("environment-binding-private-key-should-not-leak");
  });

  test("records runtime reload plan evidence after environment binding without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterRuntimeReloadPlan: {
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
              {
                id: "maintenance-window-approved",
                label: "Maintenance window is approved",
                status: "confirmed"
              },
              {
                id: "health-baseline-captured",
                label: "Pre-reload health baseline was captured",
                status: "confirmed"
              },
              {
                id: "config-diff-reviewed",
                label: "Configuration diff was reviewed",
                status: "confirmed"
              },
              {
                id: "post-reload-smoke-plan-documented",
                label: "Post-reload smoke plan is documented",
                status: "confirmed"
              },
              {
                id: "rollback-owner-assigned",
                label: "Rollback trigger owner is assigned",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-runtime-reload-plan-us-live",
            eventType: "execution_adapter_runtime_reload_plan",
            runId: "",
            createdAt: "2026-06-09T08:30:00+00:00",
            stage: "execution-adapter-runtime-reload-plan",
            source: "execution-adapter-ledger",
            summary: "us-live runtime reload plan recorded as plan_recorded.",
            detail: "Runtime reload plan is paper-only.",
            metadata: {
              planId: "execution-adapter-runtime-reload-plan-us-live",
              adapterId: "us-live",
              status: "plan_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterRuntimeReloadPlanUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-runtime-reload-plans"
    );

    const result = await recordExecutionAdapterRuntimeReloadPlan(
      "/",
      {
        adapterId: "us-live",
        bindingId: "execution-adapter-environment-binding-us-live",
        operator: "settings-panel",
        reloadMode: "manual_container_reload_plan",
        maintenanceWindowId: "window-us-live-1",
        confirmations: {
          maintenanceWindowApproved: true,
          healthBaselineCaptured: true,
          configDiffReviewed: true,
          postReloadSmokePlanDocumented: true,
          rollbackOwnerAssigned: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-runtime-reload-plans"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      operator: "settings-panel",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      confirmations: {
        maintenanceWindowApproved: true,
        healthBaselineCaptured: true,
        configDiffReviewed: true,
        postReloadSmokePlanDocumented: true,
        rollbackOwnerAssigned: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterRuntimeReloadPlan?.status).toBe("plan_recorded");
    expect(result.adapterRuntimeReloadPlan?.bindingId).toBe("execution-adapter-environment-binding-us-live");
    expect(result.adapterRuntimeReloadPlan?.liveTradingAllowed).toBe(false);
    expect(result.adapterRuntimeReloadPlan?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_runtime_reload_plan");
  });

  test("loads runtime reload plan history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const plan = {
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
        {
          id: "maintenance-window-approved",
          label: "Maintenance window is approved",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", privateKey: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterRuntimeReloadPlans(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterRuntimeReloadPlans: [plan] })
        };
      },
      5
    );

    expect(buildExecutionAdapterRuntimeReloadPlanHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-runtime-reload-plans?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-runtime-reload-plans?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterRuntimeReloadPlans).toHaveLength(1);
    expect(result.adapterRuntimeReloadPlans[0].status).toBe("plan_recorded");
    expect(result.adapterRuntimeReloadPlans[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterRuntimeReloadPlans(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterRuntimeReloadPlans: [
            {
              ...plan,
              metadata: { privateKey: "runtime-reload-private-key-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterRuntimeReloadPlans).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("runtime-reload-private-key-should-not-leak");
  });

  test("records runtime reload execution evidence after a reload plan without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterRuntimeReloadExecution: {
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
              {
                id: "pre-reload-health-verified",
                label: "Pre-reload health is verified",
                status: "confirmed"
              },
              {
                id: "reload-action-recorded",
                label: "Reload action is recorded",
                status: "confirmed"
              },
              {
                id: "post-reload-smoke-passed",
                label: "Post-reload smoke passed",
                status: "confirmed"
              },
              {
                id: "rollback-readiness-confirmed",
                label: "Rollback readiness is confirmed",
                status: "confirmed"
              },
              {
                id: "operator-confirmed-live-blocked",
                label: "Operator confirmed live routing remains blocked",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-runtime-reload-execution-us-live",
            eventType: "execution_adapter_runtime_reload_execution",
            runId: "",
            createdAt: "2026-06-09T08:45:00+00:00",
            stage: "execution-adapter-runtime-reload-execution",
            source: "execution-adapter-ledger",
            summary: "us-live runtime reload execution recorded as execution_recorded.",
            detail: "Runtime reload execution evidence is paper-only.",
            metadata: {
              executionId: "execution-adapter-runtime-reload-execution-us-live",
              planId: "execution-adapter-runtime-reload-plan-us-live",
              adapterId: "us-live",
              status: "execution_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterRuntimeReloadExecutionUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-runtime-reload-executions"
    );

    const result = await recordExecutionAdapterRuntimeReloadExecution(
      "/",
      {
        adapterId: "us-live",
        planId: "execution-adapter-runtime-reload-plan-us-live",
        operator: "settings-panel",
        executionMode: "manual_controlled_reload",
        confirmations: {
          preReloadHealthVerified: true,
          reloadActionRecorded: true,
          postReloadSmokePassed: true,
          rollbackReadinessConfirmed: true,
          operatorConfirmedLiveBlocked: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-runtime-reload-executions"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      operator: "settings-panel",
      executionMode: "manual_controlled_reload",
      confirmations: {
        preReloadHealthVerified: true,
        reloadActionRecorded: true,
        postReloadSmokePassed: true,
        rollbackReadinessConfirmed: true,
        operatorConfirmedLiveBlocked: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterRuntimeReloadExecution?.status).toBe("execution_recorded");
    expect(result.adapterRuntimeReloadExecution?.planId).toBe("execution-adapter-runtime-reload-plan-us-live");
    expect(result.adapterRuntimeReloadExecution?.liveTradingAllowed).toBe(false);
    expect(result.adapterRuntimeReloadExecution?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_runtime_reload_execution");
  });

  test("loads runtime reload execution history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const execution = {
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
        {
          id: "pre-reload-health-verified",
          label: "Pre-reload health is verified",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterRuntimeReloadExecutions(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterRuntimeReloadExecutions: [execution] })
        };
      },
      5
    );

    expect(buildExecutionAdapterRuntimeReloadExecutionHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-runtime-reload-executions?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-runtime-reload-executions?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterRuntimeReloadExecutions).toHaveLength(1);
    expect(result.adapterRuntimeReloadExecutions[0].status).toBe("execution_recorded");
    expect(result.adapterRuntimeReloadExecutions[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterRuntimeReloadExecutions(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterRuntimeReloadExecutions: [
            {
              ...execution,
              metadata: { token: "runtime-reload-execution-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterRuntimeReloadExecutions).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("runtime-reload-execution-token-should-not-leak");
  });

  test("records runtime reload acceptance after execution without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterRuntimeReloadAcceptance: {
            schemaVersion: 1,
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "acceptance_recorded",
            operator: "settings-panel",
            recordedAt: "2026-06-09T09:00:00+00:00",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              {
                id: "execution-evidence-reviewed",
                label: "Runtime reload execution evidence is reviewed",
                status: "confirmed"
              },
              {
                id: "post-reload-health-verified",
                label: "Post-reload health is verified",
                status: "confirmed"
              },
              {
                id: "adapter-handshake-verified",
                label: "Adapter handshake is verified",
                status: "confirmed"
              },
              {
                id: "kill-switch-still-enabled",
                label: "Kill switch remains enabled",
                status: "confirmed"
              },
              {
                id: "operator-confirmed-live-blocked",
                label: "Operator confirmed live routing remains blocked",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-runtime-reload-acceptance-us-live",
            eventType: "execution_adapter_runtime_reload_acceptance",
            runId: "",
            createdAt: "2026-06-09T09:00:00+00:00",
            stage: "execution-adapter-runtime-reload-acceptance",
            source: "execution-adapter-ledger",
            summary: "us-live runtime reload acceptance recorded as acceptance_recorded.",
            detail: "Runtime reload acceptance is paper-only.",
            metadata: {
              acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
              executionId: "execution-adapter-runtime-reload-execution-us-live",
              planId: "execution-adapter-runtime-reload-plan-us-live",
              adapterId: "us-live",
              status: "acceptance_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterRuntimeReloadAcceptanceUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-runtime-reload-acceptances"
    );

    const result = await recordExecutionAdapterRuntimeReloadAcceptance(
      "/",
      {
        adapterId: "us-live",
        executionId: "execution-adapter-runtime-reload-execution-us-live",
        operator: "settings-panel",
        acceptanceMode: "manual_runtime_reload_acceptance",
        confirmations: {
          executionEvidenceReviewed: true,
          postReloadHealthVerified: true,
          adapterHandshakeVerified: true,
          killSwitchStillEnabled: true,
          operatorConfirmedLiveBlocked: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-runtime-reload-acceptances"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      operator: "settings-panel",
      acceptanceMode: "manual_runtime_reload_acceptance",
      confirmations: {
        executionEvidenceReviewed: true,
        postReloadHealthVerified: true,
        adapterHandshakeVerified: true,
        killSwitchStillEnabled: true,
        operatorConfirmedLiveBlocked: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterRuntimeReloadAcceptance?.status).toBe("acceptance_recorded");
    expect(result.adapterRuntimeReloadAcceptance?.executionId).toBe(
      "execution-adapter-runtime-reload-execution-us-live"
    );
    expect(result.adapterRuntimeReloadAcceptance?.liveTradingAllowed).toBe(false);
    expect(result.adapterRuntimeReloadAcceptance?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_runtime_reload_acceptance");
  });

  test("loads runtime reload acceptance history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const acceptance = {
      schemaVersion: 1,
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "acceptance_recorded",
      operator: "settings-panel",
      recordedAt: "2026-06-09T09:00:00+00:00",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        {
          id: "execution-evidence-reviewed",
          label: "Runtime reload execution evidence is reviewed",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterRuntimeReloadAcceptances(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterRuntimeReloadAcceptances: [acceptance] })
        };
      },
      5
    );

    expect(buildExecutionAdapterRuntimeReloadAcceptanceHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-runtime-reload-acceptances?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-runtime-reload-acceptances?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterRuntimeReloadAcceptances).toHaveLength(1);
    expect(result.adapterRuntimeReloadAcceptances[0].status).toBe("acceptance_recorded");
    expect(result.adapterRuntimeReloadAcceptances[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterRuntimeReloadAcceptances(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterRuntimeReloadAcceptances: [
            {
              ...acceptance,
              metadata: { token: "runtime-reload-acceptance-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterRuntimeReloadAcceptances).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("runtime-reload-acceptance-token-should-not-leak");
  });

  test("loads audit signing key registry without exposing secrets", async () => {
    const calls: string[] = [];
    const result = await loadAuditSigningKeys("http://127.0.0.1:8765/", async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          registry: {
            schemaVersion: 1,
            generatedAt: "2026-06-04T09:45:00+00:00",
            activeKeyId: "active-audit-key",
            rotationRequired: false,
            keys: [
              {
                keyId: "active-audit-key",
                signer: "Active Audit Key",
                algorithm: "hmac-sha256",
                chainId: "audit-chain-active",
                status: "active",
                source: "env",
                fingerprint: "a".repeat(16),
                canSign: true,
                canVerify: true,
                createdAt: null,
                activatedAt: "2026-06-04T09:45:00+00:00",
                retiredAt: null
              },
              {
                keyId: "legacy-audit-key",
                signer: "Legacy Audit Key",
                algorithm: "hmac-sha256",
                chainId: "audit-chain-legacy",
                status: "retired",
                source: "registry",
                fingerprint: "b".repeat(16),
                canSign: false,
                canVerify: true,
                createdAt: "2026-05-01T00:00:00+00:00",
                activatedAt: null,
                retiredAt: "2026-06-01T00:00:00+00:00"
              }
            ]
          }
        })
      };
    });

    expect(buildAuditSigningKeysUrl("http://127.0.0.1:8765")).toBe("http://127.0.0.1:8765/api/audit/signing-keys");
    expect(calls).toEqual(["http://127.0.0.1:8765/api/audit/signing-keys"]);
    expect(result.source).toBe("core");
    expect(result.registry?.activeKeyId).toBe("active-audit-key");
    expect(result.registry?.keys.map((key) => `${key.keyId}:${key.status}:${key.canVerify}`)).toEqual([
      "active-audit-key:active:true",
      "legacy-audit-key:retired:true"
    ]);
    expect(JSON.stringify(result.registry)).not.toContain("secret");
  });

  test("rejects audit signing key registry payloads that expose secret material", async () => {
    const result = await loadAuditSigningKeys("http://127.0.0.1:8765/", async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        registry: {
          schemaVersion: 1,
          generatedAt: "2026-06-04T09:45:00+00:00",
          activeKeyId: "active-audit-key",
          rotationRequired: false,
          keys: [
            {
              keyId: "active-audit-key",
              signer: "Active Audit Key",
              algorithm: "hmac-sha256",
              chainId: "audit-chain-active",
              status: "active",
              source: "env",
              fingerprint: "a".repeat(16),
              canSign: true,
              canVerify: true,
              createdAt: null,
              activatedAt: "2026-06-04T09:45:00+00:00",
              retiredAt: null,
              secret: "must-not-cross-wire"
            }
          ]
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid audit signing key registry contract");
  });

  test("prepares an audit signing key rotation plan without exposing secrets", async () => {
    const calls: Array<{ init?: RequestInit; url: string }> = [];
    const result = await prepareAuditSigningKeyRotationPlan(
      "http://127.0.0.1:8765/",
      {
        proposedChainId: "audit-chain-next",
        proposedKeyId: "next-audit-key",
        proposedSigner: "Next Audit Key"
      },
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            rotationPlan: {
              schemaVersion: 1,
              generatedAt: "2026-06-04T10:30:00+00:00",
              currentActiveKey: {
                keyId: "active-audit-key",
                signer: "Active Audit Key",
                chainId: "audit-chain-active",
                fingerprint: "a".repeat(16)
              },
              proposedActiveKey: {
                keyId: "next-audit-key",
                signer: "Next Audit Key",
                chainId: "audit-chain-next"
              },
              rotationRequired: true,
              requiresRestart: true,
              environmentUpdates: [
                { name: "AIQT_AUDIT_SIGNING_KEY_ID", value: "next-audit-key", sensitivity: "public" },
                { name: "AIQT_AUDIT_SIGNER_NAME", value: "Next Audit Key", sensitivity: "public" },
                { name: "AIQT_AUDIT_CHAIN_ID", value: "audit-chain-next", sensitivity: "public" },
                { name: "AIQT_AUDIT_SIGNING_SECRET", value: "<set-new-key-material-outside-ui>", sensitivity: "secret" },
                {
                  name: "AIQT_AUDIT_SIGNING_KEYS_JSON",
                  value:
                    '[{"keyId":"active-audit-key","signer":"Active Audit Key","chainId":"audit-chain-active","status":"retired","secret":"<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>"}]',
                  sensitivity: "secret"
                }
              ],
              legacyRegistryTemplate:
                '[{"keyId":"active-audit-key","signer":"Active Audit Key","chainId":"audit-chain-active","status":"retired","secret":"<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>"}]',
              steps: [
                { id: "set-new-active-key", title: "Set new active key", detail: "Update active env vars.", status: "manual" },
                { id: "verify-legacy-reports", title: "Verify legacy reports", detail: "Keep retired key available.", status: "required" }
              ],
              blockedReasons: []
            }
          })
        };
      }
    );

    expect(buildAuditSigningKeyRotationPlanUrl("http://127.0.0.1:8765")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/rotation-plan"
    );
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/audit/signing-keys/rotation-plan");
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      proposedChainId: "audit-chain-next",
      proposedKeyId: "next-audit-key",
      proposedSigner: "Next Audit Key"
    });
    expect(result.source).toBe("core");
    expect(result.rotationPlan?.proposedActiveKey.keyId).toBe("next-audit-key");
    expect(result.rotationPlan?.steps.map((step) => step.id)).toContain("verify-legacy-reports");
    expect(JSON.stringify(result.rotationPlan)).not.toContain("active-audit-secret");
  });

  test("rejects audit signing key rotation plans that expose raw secret material", async () => {
    const result = await prepareAuditSigningKeyRotationPlan("http://127.0.0.1:8765/", {}, async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        rotationPlan: {
          schemaVersion: 1,
          generatedAt: "2026-06-04T10:30:00+00:00",
          currentActiveKey: {
            keyId: "active-audit-key",
            signer: "Active Audit Key",
            chainId: "audit-chain-active",
            fingerprint: "a".repeat(16),
            secretMaterial: "active-audit-secret"
          },
          proposedActiveKey: {
            keyId: "next-audit-key",
            signer: "Next Audit Key",
            chainId: "audit-chain-next"
          },
          rotationRequired: true,
          requiresRestart: true,
          environmentUpdates: [],
          legacyRegistryTemplate: "[]",
          steps: [],
          blockedReasons: []
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid audit signing key rotation plan contract");
  });

  test("preflights audit signing key rotation apply without exposing secrets", async () => {
    const calls: Array<{ init?: RequestInit; url: string }> = [];
    const rotationPlan = {
      schemaVersion: 1 as const,
      generatedAt: "2026-06-04T10:30:00+00:00",
      currentActiveKey: {
        keyId: "active-audit-key",
        signer: "Active Audit Key",
        chainId: "audit-chain-active",
        fingerprint: "a".repeat(16)
      },
      proposedActiveKey: {
        keyId: "next-audit-key",
        signer: "Next Audit Key",
        chainId: "audit-chain-next"
      },
      rotationRequired: true,
      requiresRestart: true,
      environmentUpdates: [
        { name: "AIQT_AUDIT_SIGNING_KEY_ID", value: "next-audit-key", sensitivity: "public" as const },
        { name: "AIQT_AUDIT_SIGNING_SECRET", value: "<set-new-key-material-outside-ui>", sensitivity: "secret" as const },
        { name: "AIQT_AUDIT_SIGNING_KEYS_JSON", value: "legacy-template-placeholder", sensitivity: "secret" as const }
      ],
      legacyRegistryTemplate: "legacy-template-placeholder",
      steps: [
        { id: "set-new-active-key", title: "Set new active key", detail: "Update active env vars.", status: "manual" as const }
      ],
      blockedReasons: []
    };
    const result = await applyAuditSigningKeyRotationPlan(
      "http://127.0.0.1:8765/",
      {
        confirmations: {
          legacySecretStored: false,
          newSecretMaterialStored: false,
          operatorReviewedPlan: false
        },
        rotationPlan
      },
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: false,
          status: 409,
          json: async () => ({
            rotationApply: {
              schemaVersion: 1,
              generatedAt: "2026-06-04T10:35:00+00:00",
              status: "blocked",
              applyMode: "manual_secret_store",
              auditEventType: "audit_signing_key_rotation_apply",
              currentActiveKeyId: "active-audit-key",
              currentActiveKeyFingerprint: "a".repeat(16),
              proposedActiveKeyId: "next-audit-key",
              proposedSigner: "Next Audit Key",
              proposedChainId: "audit-chain-next",
              restartRequired: true,
              requiredConfirmations: [
                {
                  id: "new-secret-material-stored",
                  label: "New signing secret generated and stored outside the UI",
                  status: "missing"
                },
                {
                  id: "legacy-secret-stored",
                  label: "Current active secret copied into the legacy registry outside the UI",
                  status: "missing"
                },
                {
                  id: "operator-reviewed-plan",
                  label: "Operator reviewed key ids, fingerprints, and restart impact",
                  status: "missing"
                }
              ],
              blockedReasons: [
                "new_secret_material_not_confirmed",
                "legacy_secret_not_confirmed",
                "operator_review_not_confirmed"
              ],
              environmentUpdateNames: [
                "AIQT_AUDIT_SIGNING_KEY_ID",
                "AIQT_AUDIT_SIGNING_SECRET",
                "AIQT_AUDIT_SIGNING_KEYS_JSON"
              ],
              secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"]
            }
          })
        };
      }
    );

    expect(buildAuditSigningKeyRotationApplyUrl("http://127.0.0.1:8765")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/rotation-apply"
    );
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/audit/signing-keys/rotation-apply");
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      confirmations: {
        legacySecretStored: false,
        newSecretMaterialStored: false,
        operatorReviewedPlan: false
      },
      rotationPlan
    });
    expect(result.source).toBe("core");
    expect(result.rotationApply?.status).toBe("blocked");
    expect(result.rotationApply?.blockedReasons).toEqual([
      "new_secret_material_not_confirmed",
      "legacy_secret_not_confirmed",
      "operator_review_not_confirmed"
    ]);
    expect(result.rotationApply?.secretPlaceholderNames).toEqual([
      "AIQT_AUDIT_SIGNING_SECRET",
      "AIQT_AUDIT_SIGNING_KEYS_JSON"
    ]);
    expect(JSON.stringify(result.rotationApply)).not.toContain("active-audit-secret");
    expect(JSON.stringify(result.rotationApply)).not.toContain("<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>");
  });

  test("rejects audit signing key rotation apply payloads that expose raw secret material", async () => {
    const result = await applyAuditSigningKeyRotationPlan(
      "http://127.0.0.1:8765/",
      {
        confirmations: {},
        rotationPlan: {
          schemaVersion: 1,
          generatedAt: "2026-06-04T10:30:00+00:00",
          currentActiveKey: { keyId: "active-audit-key", signer: "Active Audit Key", chainId: "audit-chain-active", fingerprint: "a".repeat(16) },
          proposedActiveKey: { keyId: "next-audit-key", signer: "Next Audit Key", chainId: "audit-chain-next" },
          rotationRequired: true,
          requiresRestart: true,
          environmentUpdates: [],
          legacyRegistryTemplate: "[]",
          steps: [],
          blockedReasons: []
        }
      },
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          rotationApply: {
            schemaVersion: 1,
            generatedAt: "2026-06-04T10:35:00+00:00",
            status: "ready_for_restart",
            applyMode: "manual_secret_store",
            auditEventType: "audit_signing_key_rotation_apply",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            restartRequired: true,
            requiredConfirmations: [],
            blockedReasons: [],
            environmentUpdateNames: [],
            secretPlaceholderNames: [],
            secret: "active-audit-secret"
          }
        })
      })
    );

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid audit signing key rotation apply contract");
  });

  test("records audit signing key controlled restart evidence without enabling live signing", async () => {
    const calls: Array<{ body: unknown; method: string; url: string }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        method: init?.method ?? "GET",
        url
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          restartEvidence: {
            schemaVersion: 1,
            evidenceId: "audit-signing-key-controlled-restart-next-audit-key",
            applyEventId: "audit-signing-key-rotation-apply-next-audit-key-test",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            status: "evidence_recorded",
            operator: "audit-operator",
            recordedAt: "2026-06-04T10:45:00+00:00",
            evidenceMode: "manual_controlled_restart",
            restartRequired: true,
            requiredConfirmations: [
              {
                id: "restart-window-executed",
                label: "Controlled restart window was executed",
                status: "confirmed"
              },
              {
                id: "rollback-plan-confirmed",
                label: "Rollback plan is available and confirmed",
                status: "confirmed"
              },
              {
                id: "post-restart-validation-passed",
                label: "Post-restart validation passed",
                status: "confirmed"
              },
              {
                id: "operator-reviewed-restart-logs",
                label: "Operator reviewed restart logs and audit signing status",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { ticket: "CHG-42", apiKey: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "audit-signing-key-controlled-restart-next-audit-key",
            eventType: "audit_signing_key_controlled_restart_evidence",
            runId: "audit-signing-key-rotation",
            createdAt: "2026-06-04T10:45:00+00:00",
            stage: "audit-signing-key-controlled-restart",
            source: "audit-signing-key-ledger",
            summary: "Audit signing key controlled restart evidence recorded.",
            detail: "Controlled restart evidence is paper-only.",
            metadata: {
              evidenceId: "audit-signing-key-controlled-restart-next-audit-key",
              applyEventId: "audit-signing-key-rotation-apply-next-audit-key-test",
              status: "evidence_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildAuditSigningKeyRotationRestartEvidenceUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/rotation-restart-evidence"
    );

    const result = await recordAuditSigningKeyControlledRestartEvidence(
      "/",
      {
        applyEventId: "audit-signing-key-rotation-apply-next-audit-key-test",
        operator: "audit-operator",
        confirmations: {
          restartWindowExecuted: true,
          rollbackPlanConfirmed: true,
          postRestartValidationPassed: true,
          operatorReviewedRestartLogs: true
        },
        metadata: { ticket: "CHG-42" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/audit/signing-keys/rotation-restart-evidence"
    ]);
    expect(calls[0]?.body).toEqual({
      applyEventId: "audit-signing-key-rotation-apply-next-audit-key-test",
      operator: "audit-operator",
      confirmations: {
        restartWindowExecuted: true,
        rollbackPlanConfirmed: true,
        postRestartValidationPassed: true,
        operatorReviewedRestartLogs: true
      },
      metadata: { ticket: "CHG-42" }
    });
    expect(result.source).toBe("core");
    expect(result.restartEvidence?.status).toBe("evidence_recorded");
    expect(result.restartEvidence?.applyEventId).toBe("audit-signing-key-rotation-apply-next-audit-key-test");
    expect(result.restartEvidence?.metadata.apiKey).toBe("[redacted]");
    expect(result.restartEvidence?.liveTradingAllowed).toBe(false);
    expect(result.restartEvidence?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("audit_signing_key_controlled_restart_evidence");
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("records audit signing key secret materialization manifests without raw secrets", async () => {
    const calls: Array<{ body: unknown; method: string; url: string }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        method: init?.method ?? "GET",
        url
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          secretMaterialization: {
            schemaVersion: 1,
            materializationId: "audit-signing-key-secret-materialization-next-audit-key",
            planEventId: "audit-signing-key-rotation-next-audit-key-test",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            status: "manifest_recorded",
            operator: "audit-operator",
            recordedAt: "2026-06-04T10:40:00+00:00",
            materializationMode: "local_secret_store_manifest",
            backend: "local-secret-store",
            manifestPath: "local-secret-store://audit-signing/next-audit-key",
            requiredEnvVars: [
              "AIQT_AUDIT_SIGNING_KEY_ID",
              "AIQT_AUDIT_SIGNING_SECRET",
              "AIQT_AUDIT_SIGNING_KEYS_JSON"
            ],
            secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"],
            requiredConfirmations: [
              { id: "local-secret-store-write-verified", label: "Local secret-store write was verified", status: "confirmed" },
              { id: "raw-secret-boundary-confirmed", label: "No raw secret is present in this payload", status: "confirmed" },
              { id: "env-binding-plan-documented", label: "Environment binding plan is documented", status: "confirmed" },
              { id: "rollback-plan-documented", label: "Rollback plan is documented", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { fingerprint: "sha256:next-audit-key", apiKey: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "audit-signing-key-secret-materialization-next-audit-key",
            eventType: "audit_signing_key_secret_materialization",
            runId: "audit-signing-key-rotation",
            createdAt: "2026-06-04T10:40:00+00:00",
            stage: "audit-signing-key-secret-materialization",
            source: "audit-signing-key-ledger",
            summary: "Audit signing key secret materialization manifest recorded.",
            detail: "Secret materialization is paper-only.",
            metadata: {
              materializationId: "audit-signing-key-secret-materialization-next-audit-key",
              planEventId: "audit-signing-key-rotation-next-audit-key-test",
              status: "manifest_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildAuditSigningKeySecretMaterializationUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/secret-materializations"
    );

    const result = await recordAuditSigningKeySecretMaterialization(
      "/",
      {
        backend: "local-secret-store",
        confirmations: {
          localSecretStoreWriteVerified: true,
          noRawSecretInPayload: true,
          envBindingPlanDocumented: true,
          rollbackPlanDocumented: true
        },
        manifestPath: "local-secret-store://audit-signing/next-audit-key",
        metadata: { fingerprint: "sha256:next-audit-key" },
        operator: "audit-operator",
        planEventId: "audit-signing-key-rotation-next-audit-key-test"
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/audit/signing-keys/secret-materializations"
    ]);
    expect(calls[0]?.body).toEqual({
      backend: "local-secret-store",
      confirmations: {
        localSecretStoreWriteVerified: true,
        noRawSecretInPayload: true,
        envBindingPlanDocumented: true,
        rollbackPlanDocumented: true
      },
      manifestPath: "local-secret-store://audit-signing/next-audit-key",
      metadata: { fingerprint: "sha256:next-audit-key" },
      operator: "audit-operator",
      planEventId: "audit-signing-key-rotation-next-audit-key-test"
    });
    expect(result.source).toBe("core");
    expect(result.secretMaterialization?.status).toBe("manifest_recorded");
    expect(result.secretMaterialization?.proposedActiveKeyId).toBe("next-audit-key");
    expect(result.secretMaterialization?.metadata.apiKey).toBe("[redacted]");
    expect(result.secretMaterialization?.liveTradingAllowed).toBe(false);
    expect(result.secretMaterialization?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("audit_signing_key_secret_materialization");
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("loads audit signing key secret materialization history from the local core", async () => {
    const calls: string[] = [];
    const result = await loadAuditSigningKeySecretMaterializations(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            secretMaterializations: [
              {
                schemaVersion: 1,
                materializationId: "audit-signing-key-secret-materialization-next-audit-key",
                planEventId: "audit-signing-key-rotation-next-audit-key-test",
                currentActiveKeyId: "active-audit-key",
                currentActiveKeyFingerprint: "a".repeat(16),
                proposedActiveKeyId: "next-audit-key",
                proposedSigner: "Next Audit Key",
                proposedChainId: "audit-chain-next",
                status: "manifest_recorded",
                operator: "audit-operator",
                recordedAt: "2026-06-04T10:40:00+00:00",
                materializationMode: "local_secret_store_manifest",
                backend: "local-secret-store",
                manifestPath: "local-secret-store://audit-signing/next-audit-key",
                requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET"],
                secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET"],
                requiredConfirmations: [
                  { id: "local-secret-store-write-verified", label: "Local secret-store write was verified", status: "confirmed" },
                  { id: "raw-secret-boundary-confirmed", label: "No raw secret is present in this payload", status: "confirmed" },
                  { id: "env-binding-plan-documented", label: "Environment binding plan is documented", status: "confirmed" },
                  { id: "rollback-plan-documented", label: "Rollback plan is documented", status: "confirmed" }
                ],
                blockedReasons: [],
                metadata: { apiKey: "[redacted]" },
                liveTradingAllowed: false,
                paperOnly: true
              }
            ]
          })
        };
      },
      5
    );

    expect(buildAuditSigningKeySecretMaterializationHistoryUrl("http://127.0.0.1:8765/", {
      limit: 5,
      proposedKeyId: "next-audit-key"
    })).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/secret-materializations?proposedKeyId=next-audit-key&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/audit/signing-keys/secret-materializations?proposedKeyId=next-audit-key&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.secretMaterializations).toHaveLength(1);
    expect(result.secretMaterializations[0].status).toBe("manifest_recorded");
    expect(result.secretMaterializations[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("records an audit signing key environment binding without raw secret material", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          environmentBinding: {
            schemaVersion: 1,
            bindingId: "audit-signing-key-environment-binding-next-audit-key",
            materializationId: "audit-signing-key-secret-materialization-next-audit-key",
            planEventId: "audit-signing-key-rotation-next-audit-key-test",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            status: "binding_recorded",
            operator: "audit-operator",
            recordedAt: "2026-06-04T10:50:00+00:00",
            bindingMode: "container_env_reference",
            backend: "local-secret-store",
            manifestPath: "local-secret-store://audit-signing/next-audit-key",
            requiredEnvVars: [
              "AIQT_AUDIT_SIGNING_KEY_ID",
              "AIQT_AUDIT_SIGNER_NAME",
              "AIQT_AUDIT_CHAIN_ID",
              "AIQT_AUDIT_SIGNING_SECRET",
              "AIQT_AUDIT_SIGNING_KEYS_JSON"
            ],
            requiredConfirmations: [
              { id: "runtime-env-mapping-verified", label: "Runtime environment mapping was verified", status: "confirmed" },
              { id: "config-reload-plan-documented", label: "Config reload plan is documented", status: "confirmed" },
              { id: "no-raw-secret-in-payload", label: "No raw secret is present in this payload", status: "confirmed" },
              { id: "rollback-snapshot-recorded", label: "Rollback snapshot is recorded", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { apiKey: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "audit-signing-key-environment-binding-next-audit-key",
            eventType: "audit_signing_key_environment_binding",
            runId: "audit-signing-key-rotation",
            createdAt: "2026-06-04T10:50:00+00:00",
            stage: "audit-signing-key-environment-binding",
            source: "audit-signing-key-ledger",
            summary: "Audit signing key environment binding recorded.",
            detail: "Environment binding is paper-only.",
            metadata: {
              bindingId: "audit-signing-key-environment-binding-next-audit-key",
              materializationId: "audit-signing-key-secret-materialization-next-audit-key",
              status: "binding_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildAuditSigningKeyEnvironmentBindingUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/environment-bindings"
    );

    const result = await recordAuditSigningKeyEnvironmentBinding(
      "/",
      {
        bindingMode: "container_env_reference",
        confirmations: {
          configReloadPlanDocumented: true,
          noRawSecretInPayload: true,
          rollbackSnapshotRecorded: true,
          runtimeEnvMappingVerified: true
        },
        materializationId: "audit-signing-key-secret-materialization-next-audit-key",
        metadata: { source: "audit-panel" },
        operator: "audit-operator"
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/audit/signing-keys/environment-bindings"
    ]);
    expect(calls[0]?.body).toEqual({
      bindingMode: "container_env_reference",
      confirmations: {
        configReloadPlanDocumented: true,
        noRawSecretInPayload: true,
        rollbackSnapshotRecorded: true,
        runtimeEnvMappingVerified: true
      },
      materializationId: "audit-signing-key-secret-materialization-next-audit-key",
      metadata: { source: "audit-panel" },
      operator: "audit-operator"
    });
    expect(result.source).toBe("core");
    expect(result.environmentBinding?.status).toBe("binding_recorded");
    expect(result.environmentBinding?.proposedActiveKeyId).toBe("next-audit-key");
    expect(result.environmentBinding?.metadata.apiKey).toBe("[redacted]");
    expect(result.environmentBinding?.liveTradingAllowed).toBe(false);
    expect(result.environmentBinding?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("audit_signing_key_environment_binding");
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("loads audit signing key environment binding history from the local core", async () => {
    const calls: string[] = [];
    const result = await loadAuditSigningKeyEnvironmentBindings(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            environmentBindings: [
              {
                schemaVersion: 1,
                bindingId: "audit-signing-key-environment-binding-next-audit-key",
                materializationId: "audit-signing-key-secret-materialization-next-audit-key",
                planEventId: "audit-signing-key-rotation-next-audit-key-test",
                currentActiveKeyId: "active-audit-key",
                currentActiveKeyFingerprint: "a".repeat(16),
                proposedActiveKeyId: "next-audit-key",
                proposedSigner: "Next Audit Key",
                proposedChainId: "audit-chain-next",
                status: "binding_recorded",
                operator: "audit-operator",
                recordedAt: "2026-06-04T10:50:00+00:00",
                bindingMode: "container_env_reference",
                backend: "local-secret-store",
                manifestPath: "local-secret-store://audit-signing/next-audit-key",
                requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET"],
                requiredConfirmations: [
                  { id: "runtime-env-mapping-verified", label: "Runtime environment mapping was verified", status: "confirmed" },
                  { id: "config-reload-plan-documented", label: "Config reload plan is documented", status: "confirmed" },
                  { id: "no-raw-secret-in-payload", label: "No raw secret is present in this payload", status: "confirmed" },
                  { id: "rollback-snapshot-recorded", label: "Rollback snapshot is recorded", status: "confirmed" }
                ],
                blockedReasons: [],
                metadata: { apiKey: "[redacted]" },
                liveTradingAllowed: false,
                paperOnly: true
              }
            ]
          })
        };
      },
      5
    );

    expect(buildAuditSigningKeyEnvironmentBindingHistoryUrl("http://127.0.0.1:8765/", {
      limit: 5,
      proposedKeyId: "next-audit-key"
    })).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/environment-bindings?proposedKeyId=next-audit-key&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/audit/signing-keys/environment-bindings?proposedKeyId=next-audit-key&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.environmentBindings).toHaveLength(1);
    expect(result.environmentBindings[0].status).toBe("binding_recorded");
    expect(result.environmentBindings[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("records an audit signing key runtime reload plan without executing reloads", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          runtimeReloadPlan: {
            schemaVersion: 1,
            planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
            bindingId: "audit-signing-key-environment-binding-next-audit-key",
            materializationId: "audit-signing-key-secret-materialization-next-audit-key",
            planEventId: "audit-signing-key-rotation-next-audit-key-test",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            status: "plan_recorded",
            operator: "audit-operator",
            recordedAt: "2026-06-04T11:00:00+00:00",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "audit-window-1",
            bindingMode: "container_env_reference",
            backend: "local-secret-store",
            manifestPath: "local-secret-store://audit-signing/next-audit-key",
            requiredEnvVars: [
              "AIQT_AUDIT_SIGNING_KEY_ID",
              "AIQT_AUDIT_SIGNER_NAME",
              "AIQT_AUDIT_CHAIN_ID",
              "AIQT_AUDIT_SIGNING_SECRET",
              "AIQT_AUDIT_SIGNING_KEYS_JSON"
            ],
            requiredConfirmations: [
              { id: "maintenance-window-approved", label: "Maintenance window is approved", status: "confirmed" },
              { id: "health-baseline-captured", label: "Pre-reload health baseline was captured", status: "confirmed" },
              { id: "config-diff-reviewed", label: "Configuration diff was reviewed", status: "confirmed" },
              { id: "post-reload-smoke-plan-documented", label: "Post-reload smoke plan is documented", status: "confirmed" },
              { id: "rollback-owner-assigned", label: "Rollback trigger owner is assigned", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { apiKey: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "audit-signing-key-runtime-reload-plan-next-audit-key",
            eventType: "audit_signing_key_runtime_reload_plan",
            runId: "audit-signing-key-rotation",
            createdAt: "2026-06-04T11:00:00+00:00",
            stage: "audit-signing-key-runtime-reload-plan",
            source: "audit-signing-key-ledger",
            summary: "Audit signing key runtime reload plan recorded.",
            detail: "Runtime reload plan is paper-only.",
            metadata: {
              bindingId: "audit-signing-key-environment-binding-next-audit-key",
              planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
              status: "plan_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildAuditSigningKeyRuntimeReloadPlanUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/runtime-reload-plans"
    );

    const result = await recordAuditSigningKeyRuntimeReloadPlan(
      "/",
      {
        bindingId: "audit-signing-key-environment-binding-next-audit-key",
        confirmations: {
          configDiffReviewed: true,
          healthBaselineCaptured: true,
          maintenanceWindowApproved: true,
          postReloadSmokePlanDocumented: true,
          rollbackOwnerAssigned: true
        },
        maintenanceWindowId: "audit-window-1",
        metadata: { source: "audit-panel" },
        operator: "audit-operator",
        reloadMode: "manual_container_reload_plan"
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/audit/signing-keys/runtime-reload-plans"
    ]);
    expect(calls[0]?.body).toEqual({
      bindingId: "audit-signing-key-environment-binding-next-audit-key",
      confirmations: {
        configDiffReviewed: true,
        healthBaselineCaptured: true,
        maintenanceWindowApproved: true,
        postReloadSmokePlanDocumented: true,
        rollbackOwnerAssigned: true
      },
      maintenanceWindowId: "audit-window-1",
      metadata: { source: "audit-panel" },
      operator: "audit-operator",
      reloadMode: "manual_container_reload_plan"
    });
    expect(result.source).toBe("core");
    expect(result.runtimeReloadPlan?.status).toBe("plan_recorded");
    expect(result.runtimeReloadPlan?.proposedActiveKeyId).toBe("next-audit-key");
    expect(result.runtimeReloadPlan?.metadata.apiKey).toBe("[redacted]");
    expect(result.runtimeReloadPlan?.liveTradingAllowed).toBe(false);
    expect(result.runtimeReloadPlan?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("audit_signing_key_runtime_reload_plan");
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("loads audit signing key runtime reload plan history from the local core", async () => {
    const calls: string[] = [];
    const result = await loadAuditSigningKeyRuntimeReloadPlans(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            runtimeReloadPlans: [
              {
                schemaVersion: 1,
                planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
                bindingId: "audit-signing-key-environment-binding-next-audit-key",
                materializationId: "audit-signing-key-secret-materialization-next-audit-key",
                planEventId: "audit-signing-key-rotation-next-audit-key-test",
                currentActiveKeyId: "active-audit-key",
                currentActiveKeyFingerprint: "a".repeat(16),
                proposedActiveKeyId: "next-audit-key",
                proposedSigner: "Next Audit Key",
                proposedChainId: "audit-chain-next",
                status: "plan_recorded",
                operator: "audit-operator",
                recordedAt: "2026-06-04T11:00:00+00:00",
                reloadMode: "manual_container_reload_plan",
                maintenanceWindowId: "audit-window-1",
                bindingMode: "container_env_reference",
                backend: "local-secret-store",
                manifestPath: "local-secret-store://audit-signing/next-audit-key",
                requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET"],
                requiredConfirmations: [
                  { id: "maintenance-window-approved", label: "Maintenance window is approved", status: "confirmed" },
                  { id: "health-baseline-captured", label: "Pre-reload health baseline was captured", status: "confirmed" },
                  { id: "config-diff-reviewed", label: "Configuration diff was reviewed", status: "confirmed" },
                  { id: "post-reload-smoke-plan-documented", label: "Post-reload smoke plan is documented", status: "confirmed" },
                  { id: "rollback-owner-assigned", label: "Rollback trigger owner is assigned", status: "confirmed" }
                ],
                blockedReasons: [],
                metadata: { apiKey: "[redacted]" },
                liveTradingAllowed: false,
                paperOnly: true
              }
            ]
          })
        };
      },
      5
    );

    expect(buildAuditSigningKeyRuntimeReloadPlanHistoryUrl("http://127.0.0.1:8765/", {
      limit: 5,
      proposedKeyId: "next-audit-key"
    })).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/runtime-reload-plans?proposedKeyId=next-audit-key&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/audit/signing-keys/runtime-reload-plans?proposedKeyId=next-audit-key&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.runtimeReloadPlans).toHaveLength(1);
    expect(result.runtimeReloadPlans[0].status).toBe("plan_recorded");
    expect(result.runtimeReloadPlans[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("records an audit signing key runtime reload execution without restarting containers", async () => {
    const calls: Array<{ method?: string; url: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        method: init?.method,
        url,
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          runtimeReloadExecution: {
            schemaVersion: 1,
            executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
            planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
            bindingId: "audit-signing-key-environment-binding-next-audit-key",
            materializationId: "audit-signing-key-secret-materialization-next-audit-key",
            planEventId: "audit-signing-key-rotation-next-audit-key-test",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            status: "execution_recorded",
            operator: "audit-operator",
            recordedAt: "2026-06-04T11:05:00+00:00",
            executionMode: "manual_controlled_reload_evidence",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "audit-window-1",
            bindingMode: "container_env_reference",
            backend: "local-secret-store",
            manifestPath: "local-secret-store://audit-signing/next-audit-key",
            requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"],
            requiredConfirmations: [
              { id: "pre-reload-health-verified", label: "Pre-reload health is verified", status: "confirmed" },
              { id: "reload-action-recorded", label: "Reload action is recorded", status: "confirmed" },
              { id: "post-reload-smoke-passed", label: "Post-reload smoke passed", status: "confirmed" },
              { id: "rollback-readiness-confirmed", label: "Rollback readiness is confirmed", status: "confirmed" },
              {
                id: "operator-confirmed-live-blocked",
                label: "Operator confirmed live routing remains blocked",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { apiKey: "[redacted]", source: "audit-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "audit-signing-key-runtime-reload-execution-next-audit-key",
            eventType: "audit_signing_key_runtime_reload_execution",
            runId: "audit-signing-key-rotation",
            createdAt: "2026-06-04T11:05:00+00:00",
            stage: "audit-signing-key-runtime-reload-execution",
            source: "audit-signing-key-ledger",
            summary: "Audit signing key runtime reload execution recorded.",
            detail: "Runtime reload execution evidence is paper-only.",
            metadata: {
              executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
              status: "execution_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildAuditSigningKeyRuntimeReloadExecutionUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/runtime-reload-executions"
    );

    const result = await recordAuditSigningKeyRuntimeReloadExecution(
      "/",
      {
        planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
        operator: "audit-operator",
        executionMode: "manual_controlled_reload_evidence",
        confirmations: {
          preReloadHealthVerified: true,
          reloadActionRecorded: true,
          postReloadSmokePassed: true,
          rollbackReadinessConfirmed: true,
          operatorConfirmedLiveBlocked: true
        },
        metadata: { source: "audit-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/audit/signing-keys/runtime-reload-executions"
    ]);
    expect(calls[0]?.body).toEqual({
      planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
      operator: "audit-operator",
      executionMode: "manual_controlled_reload_evidence",
      confirmations: {
        preReloadHealthVerified: true,
        reloadActionRecorded: true,
        postReloadSmokePassed: true,
        rollbackReadinessConfirmed: true,
        operatorConfirmedLiveBlocked: true
      },
      metadata: { source: "audit-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.runtimeReloadExecution?.status).toBe("execution_recorded");
    expect(result.runtimeReloadExecution?.proposedActiveKeyId).toBe("next-audit-key");
    expect(result.runtimeReloadExecution?.liveTradingAllowed).toBe(false);
    expect(result.runtimeReloadExecution?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("audit_signing_key_runtime_reload_execution");
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("loads audit signing key runtime reload execution history from the local core", async () => {
    const execution = {
      schemaVersion: 1,
      executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
      planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
      bindingId: "audit-signing-key-environment-binding-next-audit-key",
      materializationId: "audit-signing-key-secret-materialization-next-audit-key",
      planEventId: "audit-signing-key-rotation-next-audit-key-test",
      currentActiveKeyId: "active-audit-key",
      currentActiveKeyFingerprint: "a".repeat(16),
      proposedActiveKeyId: "next-audit-key",
      proposedSigner: "Next Audit Key",
      proposedChainId: "audit-chain-next",
      status: "execution_recorded",
      operator: "audit-operator",
      recordedAt: "2026-06-04T11:05:00+00:00",
      executionMode: "manual_controlled_reload_evidence",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "audit-window-1",
      bindingMode: "container_env_reference",
      backend: "local-secret-store",
      manifestPath: "local-secret-store://audit-signing/next-audit-key",
      requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET"],
      requiredConfirmations: [
        { id: "pre-reload-health-verified", label: "Pre-reload health is verified", status: "confirmed" }
      ],
      blockedReasons: [],
      metadata: { source: "audit-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const calls: string[] = [];
    const result = await loadAuditSigningKeyRuntimeReloadExecutions(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ runtimeReloadExecutions: [execution] })
        };
      },
      5
    );

    expect(buildAuditSigningKeyRuntimeReloadExecutionHistoryUrl("http://127.0.0.1:8765/", {
      limit: 5,
      proposedKeyId: "next-audit-key"
    })).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/runtime-reload-executions?proposedKeyId=next-audit-key&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/audit/signing-keys/runtime-reload-executions?proposedKeyId=next-audit-key&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.runtimeReloadExecutions).toHaveLength(1);
    expect(result.runtimeReloadExecutions[0].status).toBe("execution_recorded");
    expect(result.runtimeReloadExecutions[0].liveTradingAllowed).toBe(false);

    const rejected = await loadAuditSigningKeyRuntimeReloadExecutions(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          runtimeReloadExecutions: [
            {
              ...execution,
              metadata: { token: "reload-execution-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.runtimeReloadExecutions).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("reload-execution-token-should-not-leak");
  });

  test("records an audit signing key rotation acceptance without activating keys", async () => {
    const calls: Array<{ method?: string; url: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        method: init?.method,
        url,
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          rotationAcceptance: {
            schemaVersion: 1,
            acceptanceId: "audit-signing-key-rotation-acceptance-next-audit-key",
            executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
            planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
            bindingId: "audit-signing-key-environment-binding-next-audit-key",
            materializationId: "audit-signing-key-secret-materialization-next-audit-key",
            planEventId: "audit-signing-key-rotation-next-audit-key-test",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            status: "acceptance_recorded",
            operator: "audit-operator",
            recordedAt: "2026-06-04T11:10:00+00:00",
            acceptanceMode: "manual_rotation_acceptance",
            executionMode: "manual_controlled_reload_evidence",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "audit-window-1",
            requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"],
            requiredConfirmations: [
              {
                id: "execution-evidence-reviewed",
                label: "Runtime reload execution evidence was reviewed",
                status: "confirmed"
              },
              { id: "signature-probe-verified", label: "Post-reload signing probe was verified", status: "confirmed" },
              {
                id: "legacy-verification-confirmed",
                label: "Legacy report verification was confirmed",
                status: "confirmed"
              },
              { id: "rollback-window-still-open", label: "Rollback window remains open", status: "confirmed" },
              {
                id: "operator-confirmed-activation-blocked",
                label: "Operator confirmed activation and live routing remain blocked",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { privateKey: "[redacted]", source: "audit-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "audit-signing-key-rotation-acceptance-next-audit-key",
            eventType: "audit_signing_key_rotation_acceptance",
            runId: "audit-signing-key-rotation",
            createdAt: "2026-06-04T11:10:00+00:00",
            stage: "audit-signing-key-rotation-acceptance",
            source: "audit-signing-key-ledger",
            summary: "Audit signing key rotation acceptance recorded.",
            detail: "Rotation acceptance evidence is paper-only.",
            metadata: {
              acceptanceId: "audit-signing-key-rotation-acceptance-next-audit-key",
              status: "acceptance_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildAuditSigningKeyRotationAcceptanceUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/rotation-acceptances"
    );

    const result = await recordAuditSigningKeyRotationAcceptance(
      "/",
      {
        executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
        operator: "audit-operator",
        acceptanceMode: "manual_rotation_acceptance",
        confirmations: {
          executionEvidenceReviewed: true,
          signatureProbeVerified: true,
          legacyVerificationConfirmed: true,
          rollbackWindowStillOpen: true,
          operatorConfirmedActivationBlocked: true
        },
        metadata: { source: "audit-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/audit/signing-keys/rotation-acceptances"
    ]);
    expect(calls[0]?.body).toEqual({
      executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
      operator: "audit-operator",
      acceptanceMode: "manual_rotation_acceptance",
      confirmations: {
        executionEvidenceReviewed: true,
        signatureProbeVerified: true,
        legacyVerificationConfirmed: true,
        rollbackWindowStillOpen: true,
        operatorConfirmedActivationBlocked: true
      },
      metadata: { source: "audit-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.rotationAcceptance?.status).toBe("acceptance_recorded");
    expect(result.rotationAcceptance?.proposedActiveKeyId).toBe("next-audit-key");
    expect(result.rotationAcceptance?.liveTradingAllowed).toBe(false);
    expect(result.rotationAcceptance?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("audit_signing_key_rotation_acceptance");
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("loads audit signing key rotation acceptance history from the local core", async () => {
    const acceptance = {
      schemaVersion: 1,
      acceptanceId: "audit-signing-key-rotation-acceptance-next-audit-key",
      executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
      planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
      bindingId: "audit-signing-key-environment-binding-next-audit-key",
      materializationId: "audit-signing-key-secret-materialization-next-audit-key",
      planEventId: "audit-signing-key-rotation-next-audit-key-test",
      currentActiveKeyId: "active-audit-key",
      currentActiveKeyFingerprint: "a".repeat(16),
      proposedActiveKeyId: "next-audit-key",
      proposedSigner: "Next Audit Key",
      proposedChainId: "audit-chain-next",
      status: "acceptance_recorded",
      operator: "audit-operator",
      recordedAt: "2026-06-04T11:10:00+00:00",
      acceptanceMode: "manual_rotation_acceptance",
      executionMode: "manual_controlled_reload_evidence",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "audit-window-1",
      requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET"],
      requiredConfirmations: [
        {
          id: "execution-evidence-reviewed",
          label: "Runtime reload execution evidence was reviewed",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "audit-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const calls: string[] = [];
    const result = await loadAuditSigningKeyRotationAcceptances(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ rotationAcceptances: [acceptance] })
        };
      },
      5
    );

    expect(buildAuditSigningKeyRotationAcceptanceHistoryUrl("http://127.0.0.1:8765/", {
      limit: 5,
      proposedKeyId: "next-audit-key"
    })).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/rotation-acceptances?proposedKeyId=next-audit-key&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/audit/signing-keys/rotation-acceptances?proposedKeyId=next-audit-key&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.rotationAcceptances).toHaveLength(1);
    expect(result.rotationAcceptances[0].status).toBe("acceptance_recorded");
    expect(result.rotationAcceptances[0].liveTradingAllowed).toBe(false);

    const rejected = await loadAuditSigningKeyRotationAcceptances(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          rotationAcceptances: [
            {
              ...acceptance,
              metadata: { token: "rotation-acceptance-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.rotationAcceptances).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("rotation-acceptance-token-should-not-leak");
  });

  test("refreshes a market cache context and returns updated settings", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await refreshMarketCache(
      "http://127.0.0.1:8765/",
      { market: "ashare", symbol: "600000", timeframe: "1d", limit: 240 },
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          json: async () => ({
            refresh: {
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              requestedLimit: 240,
              upsertedRows: 3,
              quality: {
                source: "tencent",
                isComplete: true,
                warnings: [],
                rows: 3
              }
            },
            settings: {
              schemaVersion: 1,
              generatedAt: "2026-05-31T09:00:00+08:00",
              dataSources: [
                {
                  market: "ashare",
                  label: "A shares",
                  quoteSource: "tencent",
                  klineSource: "tencent",
                  status: "ready",
                  optionalKeyName: null,
                  optionalKeyConfigured: false,
                  note: "No key required."
                }
              ],
              cache: {
                engine: "sqlite",
                path: "data/market.sqlite",
                exists: true,
                scope: "ohlcv",
                rowCount: 3,
                contextCount: 1,
                latestTimestamp: "2026-05-27T00:00:00+00:00",
                freshnessSummary: {
                  fresh: 1,
                  stale: 0,
                  empty: 0
                },
                contexts: [
                  {
                    market: "ashare",
                    symbol: "600000",
                    timeframe: "1d",
                    rowCount: 3,
                    startTimestamp: "2026-05-25T00:00:00+00:00",
                    endTimestamp: "2026-05-27T00:00:00+00:00",
                    freshness: "fresh",
                    ageHours: 48
                  }
                ]
              },
              executionAdapters: [
                {
                  id: "paper-local",
                  market: "multi",
                  adapter: "Paper Trading",
                  route: "paper",
                  status: "paper_ready",
                  certification: "local",
                  liveTradingAllowed: false,
                  note: "Paper only."
                }
              ],
              safety: {
                liveTradingAllowed: false,
                requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
              }
            }
          })
        };
      }
    );

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/cache/refresh");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0]?.init?.body))).toMatchObject({
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      limit: 240
    });
    expect(result.source).toBe("core");
    expect(result.refresh?.upsertedRows).toBe(3);
    expect(result.settings?.cache.rowCount).toBe(3);
  });

  test("refreshes multiple market cache contexts in request order", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await refreshMarketCacheBatch(
      "http://127.0.0.1:8765/",
      [
        { market: "ashare", symbol: "600000", timeframe: "1d", limit: 240 },
        { market: "us", symbol: "AAPL", timeframe: "1d", limit: 240 }
      ],
      async (url, init) => {
        calls.push({ url, init });
        const body = JSON.parse(String(init?.body)) as { market: string; symbol: string; timeframe: string; limit: number };
        const rowCount = body.symbol === "600000" ? 500 : 240;
        return {
          ok: true,
          json: async () => ({
            refresh: {
              market: body.market,
              symbol: body.symbol,
              timeframe: body.timeframe,
              requestedLimit: body.limit,
              upsertedRows: rowCount,
              quality: {
                source: body.market === "ashare" ? "tencent" : "yfinance",
                isComplete: true,
                warnings: [],
                rows: rowCount
              }
            },
            settings: {
              schemaVersion: 1,
              generatedAt: "2026-05-31T09:00:00+08:00",
              dataSources: [
                {
                  market: "ashare",
                  label: "A shares",
                  quoteSource: "tencent",
                  klineSource: "tencent",
                  status: "ready",
                  optionalKeyName: null,
                  optionalKeyConfigured: false,
                  note: "No key required."
                }
              ],
              cache: {
                engine: "sqlite",
                path: "data/market.sqlite",
                exists: true,
                scope: "ohlcv",
                rowCount,
                contextCount: calls.length,
                latestTimestamp: "2026-05-29T00:00:00+00:00",
                freshnessSummary: {
                  fresh: calls.length,
                  stale: 0,
                  empty: 0
                },
                contexts: [
                  {
                    market: body.market,
                    symbol: body.symbol,
                    timeframe: body.timeframe,
                    rowCount,
                    startTimestamp: "2026-05-25T00:00:00+00:00",
                    endTimestamp: "2026-05-29T00:00:00+00:00",
                    freshness: "fresh",
                    ageHours: 48
                  }
                ]
              },
              executionAdapters: [
                {
                  id: "paper-local",
                  market: "multi",
                  adapter: "Paper Trading",
                  route: "paper",
                  status: "paper_ready",
                  certification: "local",
                  liveTradingAllowed: false,
                  note: "Paper only."
                }
              ],
              safety: {
                liveTradingAllowed: false,
                requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
              }
            }
          })
        };
      }
    );

    expect(calls).toHaveLength(2);
    expect(calls.map((call) => JSON.parse(String(call.init?.body)).symbol)).toEqual(["600000", "AAPL"]);
    expect(result.source).toBe("core");
    expect(result.refreshes.map((refresh) => refresh.symbol)).toEqual(["600000", "AAPL"]);
    expect(result.settings?.cache.rowCount).toBe(240);
    expect(result.failedCount).toBe(0);
  });

  test("records a watchlist cache refresh run", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await refreshWatchlistCacheRun(
      "http://127.0.0.1:8765/",
      {
        timeframe: "1d",
        limit: 240,
        watchlist: [
          { market: "ashare", symbol: "600000", name: "浦发银行", changePct: 0 },
          { market: "us", symbol: "AAPL", name: "Apple", changePct: 0 }
        ]
      },
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          json: async () => ({
            watchlistRefresh: {
              runId: "cache-refresh-run-1",
              createdAt: "2026-06-09T22:50:00+08:00",
              timeframe: "1d",
              requestedLimit: 240,
              summary: {
                totalSymbols: 2,
                refreshed: 2,
                skipped: 0,
                failed: 0,
                upsertedRows: 740
              },
              items: [
                {
                  market: "ashare",
                  symbol: "600000",
                  name: "浦发银行",
                  timeframe: "1d",
                  requestedLimit: 240,
                  upsertedRows: 500,
                  status: "refreshed",
                  error: null,
                  quality: { source: "tencent", isComplete: true, warnings: [], rows: 500 }
                },
                {
                  market: "us",
                  symbol: "AAPL",
                  name: "Apple",
                  timeframe: "1d",
                  requestedLimit: 240,
                  upsertedRows: 240,
                  status: "refreshed",
                  error: null,
                  quality: { source: "yfinance", isComplete: true, warnings: [], rows: 240 }
                }
              ]
            },
            settings: {
              schemaVersion: 1,
              generatedAt: "2026-05-31T09:00:00+08:00",
              dataSources: [
                {
                  market: "ashare",
                  label: "A shares",
                  quoteSource: "tencent",
                  klineSource: "tencent",
                  status: "ready",
                  optionalKeyName: null,
                  optionalKeyConfigured: false,
                  note: "No key required."
                }
              ],
              cache: {
                engine: "sqlite",
                path: "data/market.sqlite",
                exists: true,
                scope: "ohlcv",
                rowCount: 740,
                contextCount: 2,
                latestTimestamp: "2026-05-29T00:00:00+00:00",
                freshnessSummary: { fresh: 2, stale: 0, empty: 0 },
                contexts: [
                  {
                    market: "ashare",
                    symbol: "600000",
                    timeframe: "1d",
                    rowCount: 500,
                    startTimestamp: "2026-05-25T00:00:00+00:00",
                    endTimestamp: "2026-05-29T00:00:00+00:00",
                    freshness: "fresh",
                    ageHours: 48
                  }
                ]
              },
              executionAdapters: [
                {
                  id: "paper-local",
                  market: "multi",
                  adapter: "Paper Trading",
                  route: "paper",
                  status: "paper_ready",
                  certification: "local",
                  liveTradingAllowed: false,
                  note: "Paper only."
                }
              ],
              safety: {
                liveTradingAllowed: false,
                requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
              }
            }
          })
        };
      }
    );

    expect(buildWatchlistCacheRefreshUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/cache/watchlist-refreshes"
    );
    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/cache/watchlist-refreshes");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0]?.init?.body))).toMatchObject({
      timeframe: "1d",
      limit: 240,
      watchlist: [
        { market: "ashare", symbol: "600000", name: "浦发银行" },
        { market: "us", symbol: "AAPL", name: "Apple" }
      ]
    });
    expect(result.source).toBe("core");
    expect(result.watchlistRefresh?.runId).toBe("cache-refresh-run-1");
    expect(result.watchlistRefresh?.summary.refreshed).toBe(2);
    expect(result.watchlistRefresh?.items.map((item) => item.symbol)).toEqual(["600000", "AAPL"]);
    expect(result.settings?.cache.rowCount).toBe(740);
  });

  test("loads recent watchlist cache refresh runs", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await loadWatchlistCacheRefreshRuns("http://127.0.0.1:8765/", { limit: 2 }, async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        json: async () => ({
          watchlistRefreshes: [
            {
              runId: "cache-refresh-run-2",
              createdAt: "2026-06-09T23:10:00+08:00",
              timeframe: "1d",
              requestedLimit: 240,
              summary: { totalSymbols: 2, refreshed: 1, skipped: 1, failed: 0, upsertedRows: 240 },
              items: [
                {
                  market: "ashare",
                  symbol: "600000",
                  name: "浦发银行",
                  timeframe: "1d",
                  requestedLimit: 240,
                  upsertedRows: 240,
                  status: "refreshed",
                  error: null,
                  quality: { source: "tencent", isComplete: true, warnings: [], rows: 240 }
                }
              ]
            },
            {
              runId: "cache-refresh-run-1",
              createdAt: "2026-06-09T22:50:00+08:00",
              timeframe: "1d",
              requestedLimit: 160,
              summary: { totalSymbols: 1, refreshed: 1, skipped: 0, failed: 0, upsertedRows: 160 },
              items: [
                {
                  market: "us",
                  symbol: "AAPL",
                  name: "Apple",
                  timeframe: "1d",
                  requestedLimit: 160,
                  upsertedRows: 160,
                  status: "refreshed",
                  error: null,
                  quality: { source: "yfinance", isComplete: true, warnings: [], rows: 160 }
                }
              ]
            }
          ]
        })
      };
    });

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/cache/watchlist-refreshes?limit=2");
    expect(calls[0]?.init).toBeUndefined();
    expect(result.source).toBe("core");
    expect(result.watchlistRefreshes.map((run) => run.runId)).toEqual(["cache-refresh-run-2", "cache-refresh-run-1"]);
    expect(result.watchlistRefreshes[0]?.summary.skipped).toBe(1);
  });

  test("rejects settings status when cache freshness summary is missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-05-31T09:00:00+08:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 500,
            contextCount: 1,
            latestTimestamp: "2026-05-29T00:00:00+00:00",
            contexts: [
              {
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                rowCount: 500,
                startTimestamp: "2025-09-12T00:00:00+08:00",
                endTimestamp: "2026-05-29T00:00:00+08:00",
                freshness: "fresh",
                ageHours: 48
              }
            ]
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when cache context freshness is missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-05-31T09:00:00+08:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 500,
            contextCount: 1,
            latestTimestamp: "2026-05-29T00:00:00+00:00",
            contexts: [
              {
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                rowCount: 500,
                startTimestamp: "2025-09-12T00:00:00+08:00",
                endTimestamp: "2026-05-29T00:00:00+08:00"
              }
            ]
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when cache contexts are missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-05-31T09:00:00+08:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 1280,
            contextCount: 12,
            latestTimestamp: "2026-05-29T00:00:00+00:00"
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("runs terminal research and returns a core-backed workspace", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      schemaVersion: 1,
      quantLoop: [
        { id: "idea", label: "Idea Lab", status: "active" },
        { id: "data", label: "Data & Factor", status: "ready" },
        { id: "strategy", label: "Strategy Builder", status: "ready" },
        { id: "backtest", label: "Backtest Lab", status: "ready" },
        { id: "agent-review", label: "Agent Review", status: "ready" },
        { id: "paper", label: "Paper Trading", status: "ready" },
        { id: "broker", label: "Broker Center", status: "locked" }
      ],
      metrics: [
        { label: "Return", value: "+3.20%", tone: "positive" },
        { label: "Max DD", value: "1.10%", tone: "warning" },
        { label: "Win Rate", value: "50.00%", tone: "neutral" },
        { label: "Trades", value: "8", tone: "neutral" }
      ]
    };
    const calls: string[] = [];
    const currentWorkspace = workspaceWithStrategyField(
      workspaceWithBacktestAssumption(
        workspaceWithBacktestAssumption(buildTerminalWorkspace(), "initialCash", 250000),
        "feeBps",
        8
      ),
      "entry",
      "Close > SMA5"
    );
    const result = await runTerminalResearch(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d", watchlistRefreshRunId: "cache-refresh-f10efd7401b7" },
      workspaceWithBacktestAssumption(currentWorkspace, "slippageBps", 4),
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => remoteWorkspace
        };
      }
    );

    const requestUrl = new URL(calls[0]);
    expect(requestUrl.searchParams.get("market")).toBe("ashare");
    expect(requestUrl.searchParams.get("symbol")).toBe("600000");
    expect(requestUrl.searchParams.get("timeframe")).toBe("1d");
    expect(requestUrl.searchParams.get("limit")).toBe("500");
    expect(requestUrl.searchParams.get("initialCash")).toBe("250000");
    expect(requestUrl.searchParams.get("feeBps")).toBe("8");
    expect(requestUrl.searchParams.get("slippageBps")).toBe("4");
    expect(requestUrl.searchParams.get("watchlistRefreshRunId")).toBe("cache-refresh-f10efd7401b7");
    expect(requestUrl.searchParams.get("strategyName")).toBe("SMA Trend / Bank Sector");
    expect(requestUrl.searchParams.get("strategyEntry")).toBe("Close > SMA5");
    expect(result.source).toBe("core");
    expect(result.statusLabel).toBe("Research run complete");
    expect(result.workspace.metrics[0].value).toBe("+3.20%");
    expect(result.workspace.quantLoop.map((step) => step.id)).toEqual([
      "research",
      "strategy",
      "backtest",
      "agent-review",
      "paper"
    ]);
  });

  test("hydrates research run detail when the run workspace omits its data snapshot", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      schemaVersion: 1,
      researchRun: {
        runId: "run-needs-detail",
        createdAt: "2026-05-29T08:00:00+00:00",
        timeframe: "1d",
        strategyRevision: "rev-snapshot",
        dataRows: 2,
        executionMode: "paper_only"
      },
      metrics: [
        { label: "Return", value: "+8.20%", tone: "positive" },
        { label: "Max DD", value: "3.10%", tone: "warning" },
        { label: "Win Rate", value: "55.00%", tone: "neutral" },
        { label: "Trades", value: "9", tone: "neutral" }
      ]
    };
    const calls: string[] = [];
    const result = await runTerminalResearch(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      buildTerminalWorkspace(),
      async (url) => {
        calls.push(url);
        if (url.endsWith("/api/research/runs/run-needs-detail")) {
          return {
            ok: true,
            json: async () => ({
              run: {
                runId: "run-needs-detail",
                createdAt: "2026-05-29T08:00:00+00:00",
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                strategyName: "SMA trend demo",
                strategyRevision: "rev-snapshot",
                dataRows: 2,
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
                  start: "2026-05-28T08:00:00Z",
                  end: "2026-05-29T08:00:00Z",
                  hash: "snapshot-hydrated",
                  bars: [
                    {
                      timestamp: "2026-05-28T08:00:00Z",
                      timestampMs: 1779955200000,
                      open: 10,
                      high: 10.2,
                      low: 9.9,
                      close: 10,
                      volume: 1000
                    },
                    {
                      timestamp: "2026-05-29T08:00:00Z",
                      timestampMs: 1780041600000,
                      open: 10.2,
                      high: 10.6,
                      low: 10.1,
                      close: 10.5,
                      volume: 1200
                    }
                  ]
                }
              }
            })
          };
        }
        return {
          ok: true,
          json: async () => remoteWorkspace
        };
      }
    );

    const runUrl = new URL(calls[0]);
    expect(runUrl.pathname).toBe("/api/research/run");
    expect(runUrl.searchParams.get("symbol")).toBe("600000");
    expect(calls[1]).toBe("http://127.0.0.1:8765/api/research/runs/run-needs-detail");
    expect(result.source).toBe("core");
    expect(result.workspace.researchRun?.dataSnapshot?.hash).toBe("snapshot-hydrated");
    expect(result.workspace.researchRun?.dataSnapshot?.bars).toHaveLength(2);
  });

  test("keeps the current workspace when research run fails", async () => {
    const currentWorkspace = buildTerminalWorkspace();
    const result = await runTerminalResearch(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      currentWorkspace,
      async () => {
        throw new Error("core offline");
      }
    );

    expect(result.source).toBe("fallback");
    expect(result.statusLabel).toBe("Research run failed");
    expect(result.workspace).toBe(currentWorkspace);
    expect(result.error).toBe("core offline");
  });

  test("loads recent research run history from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunHistory("http://127.0.0.1:8765", 2, async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          runs: [
            {
              runId: "run-new",
              createdAt: "2026-05-26T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyName: "SMA trend demo",
              strategyRevision: "rev123",
              dataRows: 120,
              metrics: { total_return_pct: 3.4, trade_count: 8 },
              decisions: [],
              executionMode: "paper_only",
              aiReport: {
                summary: "SMA trend demo research summary",
                risks: ["Sample risk"],
                improvements: ["Compare benchmark"],
                disclaimer: "No investment advice"
              },
              dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 120 },
              strategyConfig: {
                name: "SMA trend demo",
                revision: "rev123",
                market: "ashare",
                symbols: ["600000"],
                timeframe: "1d",
                version: 1,
                entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
                exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
                risk: { positionPct: 0.8, stopLossPct: 0.08, takeProfitPct: 0.18, maxDrawdownPct: 0.2 }
              },
              backtestAssumptions: { initialCash: 250000, feeBps: 8, slippageBps: 4 },
              backtestTrades: [
                {
                  id: "trade-1",
                  timestamp: "2026-05-26T08:00:00+00:00",
                  symbol: "600000",
                  side: "BUY",
                  status: "filled",
                  price: "9.20",
                  quantity: "2100",
                  exposure: "19.32%",
                  pnl: "-",
                  reason: "entry_conditions",
                  tone: "neutral"
                }
              ],
              backtestEquityCurve: [
                { timestamp: "2026-05-26T08:00:00+00:00", equity: 250000 },
                { timestamp: "2026-05-27T08:00:00+00:00", equity: 253400 }
              ],
              backtestDiagnostics: [
                {
                  id: "return-profile",
                  label: "Return profile",
                  value: "+3.40%",
                  detail: "Total return over 120 bars",
                  tone: "positive"
                }
              ]
            }
          ]
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs?limit=2"]);
    expect(result.source).toBe("core");
    expect(result.runs[0].runId).toBe("run-new");
    expect(result.runs[0].metrics.trade_count).toBe(8);
    expect(result.runs[0].aiReport?.summary).toBe("SMA trend demo research summary");
    expect(result.runs[0].aiReport?.risks[0]).toBe("Sample risk");
    expect(result.runs[0].aiReport?.improvements[0]).toBe("Compare benchmark");
    expect(result.runs[0].aiReport?.disclaimer).toBe("No investment advice");
    expect(result.runs[0].dataQuality).toEqual({ source: "tencent", isComplete: true, warnings: [], rows: 120 });
    expect(result.runs[0].strategyConfig?.entryConditions[0].params).toEqual({ window: 20 });
    expect(result.runs[0].strategyConfig?.risk.positionPct).toBe(0.8);
    expect(result.runs[0].backtestAssumptions).toEqual({ initialCash: 250000, feeBps: 8, slippageBps: 4 });
    expect(result.runs[0].backtestTrades?.[0]).toMatchObject({ id: "trade-1", side: "BUY" });
    expect(result.runs[0].backtestEquityCurve?.at(-1)?.equity).toBe(253400);
    expect(result.runs[0].backtestDiagnostics?.[0]).toMatchObject({ id: "return-profile", tone: "positive" });
  });

  test("loads one research run detail from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          run: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyName: "SMA trend demo",
            strategyRevision: "rev123",
            dataRows: 120,
            metrics: { total_return_pct: 3.4, trade_count: 8 },
            decisions: [],
            executionMode: "paper_only",
            aiReport: {
              summary: "SMA trend detail research summary",
              risks: ["Detail risk"],
              improvements: ["Review slippage"],
              disclaimer: "No investment advice"
            },
            dataSnapshot: {
              source: "tencent",
              isComplete: true,
              warnings: [],
              rows: 2,
              start: "2026-05-26T08:00:00+00:00",
              end: "2026-05-27T08:00:00+00:00",
              hash: "snapshot-detail",
              bars: [
                {
                  timestamp: "2026-05-26T08:00:00+00:00",
                  timestampMs: 1779782400000,
                  open: 9.1,
                  high: 9.3,
                  low: 9,
                  close: 9.2,
                  volume: 1200000
                },
                {
                  timestamp: "2026-05-27T08:00:00+00:00",
                  timestampMs: 1779868800000,
                  open: 9.2,
                  high: 9.4,
                  low: 9.1,
                  close: 9.3,
                  volume: 1300000
                }
              ]
            },
            dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 120 },
            strategyConfig: {
              name: "SMA trend demo",
              revision: "rev123",
              market: "ashare",
              symbols: ["600000"],
              timeframe: "1d",
              version: 1,
              entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
              exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
              risk: { positionPct: 0.8, stopLossPct: 0.08, takeProfitPct: 0.18, maxDrawdownPct: 0.2 }
            },
            backtestAssumptions: { initialCash: 250000, feeBps: 8, slippageBps: 4 }
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-new"]);
    expect(result.source).toBe("core");
    expect(result.run?.runId).toBe("run-new");
    expect(result.run?.aiReport?.summary).toBe("SMA trend detail research summary");
    expect(result.run?.aiReport?.risks[0]).toBe("Detail risk");
    expect(result.run?.aiReport?.improvements[0]).toBe("Review slippage");
    expect(result.run?.aiReport?.disclaimer).toBe("No investment advice");
    expect(result.run?.dataSnapshot?.hash).toBe("snapshot-detail");
    expect(result.run?.dataSnapshot?.bars.at(-1)?.close).toBe(9.3);
    expect(result.run?.dataQuality).toEqual({ source: "tencent", isComplete: true, warnings: [], rows: 120 });
    expect(result.run?.strategyConfig?.entryConditions[0].params).toEqual({ window: 20 });
    expect(result.run?.strategyConfig?.risk.positionPct).toBe(0.8);
    expect(result.run?.backtestAssumptions).toEqual({ initialCash: 250000, feeBps: 8, slippageBps: 4 });
  });

  test("loads one research run export package from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunExport("http://127.0.0.1:8765", "run-new", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          export: {
            kind: "aiqt.researchRun.export",
            packageVersion: 1,
            exportedAt: "2026-05-26T08:05:00+00:00",
            integrity: {
              algorithm: "sha256",
              hash: "a".repeat(64)
            },
            manifest: {
              runId: "run-new",
              createdAt: "2026-05-26T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyRevision: "rev123",
              dataHash: "snapshot-detail",
              dataRows: 2,
              executionMode: "paper_only",
              paperOnly: true,
              liveTradingAllowed: false,
              artifactCounts: {
                bars: 2,
                trades: 1,
                equityPoints: 2,
                decisions: 0,
                aiRisks: 1,
                paperExecutions: 1,
                portfolioPaperOrderBatches: 1,
                promotionCandidates: 1,
                researchNotes: 1,
                aiReviewRuns: 1
              }
            },
            researchRun: {
              runId: "run-new",
              createdAt: "2026-05-26T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyName: "SMA trend demo",
              strategyRevision: "rev123",
              dataRows: 2,
              metrics: { total_return_pct: 3.4, trade_count: 8 },
              decisions: [],
              executionMode: "paper_only",
              researchNote: {
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                body: "关注银行板块相对强度，等待放量确认。",
                updatedAt: "2026-05-29T07:55:00+00:00"
              },
              dataSnapshot: {
                source: "tencent",
                isComplete: true,
                warnings: [],
                rows: 2,
                start: "2026-05-26T08:00:00+00:00",
                end: "2026-05-27T08:00:00+00:00",
                hash: "snapshot-detail",
                bars: [
                  {
                    timestamp: "2026-05-26T08:00:00+00:00",
                    timestampMs: 1779782400000,
                    open: 9.1,
                    high: 9.3,
                    low: 9,
                    close: 9.2,
                    volume: 1200000
                  },
                  {
                    timestamp: "2026-05-27T08:00:00+00:00",
                    timestampMs: 1779868800000,
                    open: 9.2,
                    high: 9.4,
                    low: 9.1,
                    close: 9.3,
                    volume: 1300000
                  }
                ]
              }
            },
            executionHandoff: {
              mode: "paper_only",
              paperOnly: true,
              liveTradingAllowed: false,
              requiredGates: [
                {
                  id: "adapter-certified",
                  label: "Adapter certified",
                  passed: false,
                  reason: "No certified live adapter is bound to this audited run."
                }
              ]
            },
            paperExecutions: [
              {
                executionId: "paper-exported",
                runId: "run-new",
                createdAt: "2026-05-26T08:20:00+00:00",
                mode: "paper_only",
                account: { cash: 80680, positions: { "600000": 2100 }, equity: 100000 },
                orders: [
                  {
                    orderId: "order-exported",
                    symbol: "600000",
                    side: "buy",
                    quantity: 2100,
                    price: 9.2,
                    status: "filled",
                    reason: "filled_immediately",
                    timestamp: "2026-05-26T08:20:00+00:00"
                  }
                ],
                gates: [
                  {
                    id: "paper-risk-check",
                    label: "Paper risk check",
                    passed: true,
                    reason: "filled_immediately"
                  }
                ]
              }
            ],
            portfolioPaperOrderBatches: [
              {
                batchId: "portfolio-paper-batch-exported",
                baseRunId: "run-new",
                portfolioName: "Portable basket",
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
                    orderId: "portfolio-paper-order-exported",
                    symbol: "600000",
                    sourceRunId: "run-new",
                    side: "buy",
                    notionalValue: 19341,
                    quantity: 2100,
                    status: "pending_review",
                    riskStatus: "review",
                    reason: "Portfolio order requires operator review."
                  }
                ]
              }
            ],
            promotionCandidate: {
              candidateId: "promotion-run-new",
              runId: "run-new",
              createdAt: "2026-05-26T08:20:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyRevision: "rev123",
              latestPaperExecutionId: "paper-exported",
              status: "certification_pending",
              headline: "Live promotion pending certification",
              summary: "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass.",
              liveTradingAllowed: false,
              evidence: { paperExecutions: 1, filledOrders: 1, passedPaperRiskChecks: 1 },
              stages: [
                {
                  id: "paper-execution",
                  label: "Paper execution",
                  value: "1 filled order",
                  detail: "Paper snapshot paper-exported passed local risk checks before live promotion.",
                  status: "passed",
                  tone: "positive",
                  passed: true,
                  reason: "Paper snapshot paper-exported passed local risk checks before live promotion."
                }
              ]
            }
            ,
            aiReviewRuns: [
              {
                aiReviewId: "ai-review:run-new:rev123",
                runId: "run-new",
                createdAt: "2026-05-26T08:30:00+00:00",
                record: {
                  schemaVersion: 1,
                  recordType: "aiqt.aiReviewRun",
                  aiReviewId: "ai-review:run-new:rev123",
                  runId: "run-new",
                  createdAt: "2026-05-26T08:30:00+00:00",
                  market: "ashare",
                  symbol: "600000",
                  timeframe: "1d",
                  strategyRevision: "rev123",
                  executionMode: "paper_only",
                  status: "ready",
                  summary: {
                    citationCount: 1,
                    roundCount: 1,
                    decisionCount: 1,
                    parameterScanBound: true,
                    liveExecutionBlocked: true
                  },
                  dossier: {
                    status: "ready",
                    headline: "AI review saved",
                    summary: "Evidence only.",
                    citations: []
                  },
                  citations: [
                    {
                      id: "parameter-scan",
                      label: "Parameter scan",
                      value: "SMA20",
                      detail: "Re-audit before promotion.",
                      tone: "warning"
                    }
                  ],
                  rounds: [
                    {
                      id: "technical-analysis",
                      phase: "analysis",
                      agent: "Technical Analyst",
                      thesis: "Trend remains constructive but needs audited evidence.",
                      evidence: "SMA20 and parameter scan are attached.",
                      verdict: "support",
                      confidence: 0.64,
                      tone: "positive"
                    }
                  ],
                  decisionLog: [{ agent: "Technical", message: "Evidence only.", tone: "positive" }],
                  evidenceAnchors: [
                    {
                      id: "run:run-new",
                      type: "research-run",
                      label: "Research run",
                      reference: "run-new",
                      exportPath: "researchRun.runId"
                    },
                    {
                      id: "citation:parameter-scan",
                      type: "citation",
                      label: "Parameter scan",
                      reference: "parameter-scan",
                      exportPath: "aiReviewRuns[].record.citations[parameter-scan]"
                    }
                  ],
                  boundary: "Evidence explanation only; no buy/sell instructions or guaranteed returns."
                }
              }
            ]
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-new/export"]);
    expect(result.source).toBe("core");
    expect(result.exportPackage?.integrity?.algorithm).toBe("sha256");
    expect(result.exportPackage?.manifest.dataHash).toBe("snapshot-detail");
    expect(result.exportPackage?.manifest.artifactCounts.bars).toBe(2);
    expect(result.exportPackage?.manifest.artifactCounts.paperExecutions).toBe(1);
    expect(result.exportPackage?.manifest.artifactCounts.portfolioPaperOrderBatches).toBe(1);
    expect(result.exportPackage?.manifest.artifactCounts.promotionCandidates).toBe(1);
    expect(result.exportPackage?.manifest.artifactCounts.researchNotes).toBe(1);
    expect(result.exportPackage?.manifest.artifactCounts.aiReviewRuns).toBe(1);
    expect(result.exportPackage?.researchRun.researchNote?.body).toBe("关注银行板块相对强度，等待放量确认。");
    expect(result.exportPackage?.researchRun.dataSnapshot?.bars.at(-1)?.close).toBe(9.3);
    expect(result.exportPackage?.executionHandoff.liveTradingAllowed).toBe(false);
    expect(result.exportPackage?.paperExecutions?.[0]?.executionId).toBe("paper-exported");
    expect(result.exportPackage?.portfolioPaperOrderBatches?.[0]?.batchId).toBe("portfolio-paper-batch-exported");
    expect(result.exportPackage?.promotionCandidate?.status).toBe("certification_pending");
    expect(result.exportPackage?.aiReviewRuns?.[0]?.aiReviewId).toBe("ai-review:run-new:rev123");
    expect(result.exportPackage?.aiReviewRuns?.[0]?.record.evidenceAnchors?.map((anchor) => anchor.id)).toEqual([
      "run:run-new",
      "citation:parameter-scan"
    ]);
  });

  test("returns fallback when research run export package is malformed", async () => {
    const result = await loadResearchRunExport("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        export: {
          kind: "aiqt.researchRun.export",
          packageVersion: 1,
          manifest: { runId: "run-new" },
          researchRun: { runId: "run-new" },
          executionHandoff: { liveTradingAllowed: true }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.exportPackage).toBeUndefined();
    expect(result.error).toBe("Invalid research run export contract");
  });

  test("normalizes raw and wrapped research run export package payloads for preview", () => {
    const exportPackage = {
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-05-26T08:05:00+00:00",
      manifest: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-preview",
        dataHash: "hash-preview",
        dataRows: 1,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: { bars: 1, trades: 0, equityPoints: 0, decisions: 0, aiRisks: 0 }
      },
      researchRun: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Preview SMA trend",
        strategyRevision: "rev-preview",
        dataRows: 1,
        metrics: { total_return_pct: 1.2, trade_count: 0 },
        decisions: [],
        executionMode: "paper_only",
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 1,
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:00:00+00:00",
          hash: "hash-preview",
          bars: [
            {
              timestamp: "2026-05-26T08:00:00+00:00",
              timestampMs: 1779782400000,
              open: 9.1,
              high: 9.3,
              low: 9,
              close: 9.2,
              volume: 1200000
            }
          ]
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
      }
    } satisfies ResearchRunExportPackage;

    expect(normalizeResearchRunExportPackagePayload(exportPackage)?.manifest.runId).toBe("run-preview");
    expect(normalizeResearchRunExportPackagePayload({ export: exportPackage })?.manifest.runId).toBe("run-preview");
    expect(normalizeResearchRunExportPackagePayload({ export: { manifest: { runId: "broken" } } })).toBeNull();
  });

  test("rejects malformed portfolio paper order batches in export packages", () => {
    const exportPackage = {
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-05-26T08:05:00+00:00",
      manifest: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-preview",
        dataHash: "hash-preview",
        dataRows: 1,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: {
          bars: 1,
          trades: 0,
          equityPoints: 0,
          decisions: 0,
          aiRisks: 0,
          portfolioPaperOrderBatches: 1
        }
      },
      researchRun: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Preview SMA trend",
        strategyRevision: "rev-preview",
        dataRows: 1,
        metrics: { total_return_pct: 1.2, trade_count: 0 },
        decisions: [],
        executionMode: "paper_only",
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 1,
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:00:00+00:00",
          hash: "hash-preview",
          bars: [
            {
              timestamp: "2026-05-26T08:00:00+00:00",
              timestampMs: 1779782400000,
              open: 9.1,
              high: 9.3,
              low: 9,
              close: 9.2,
              volume: 1200000
            }
          ]
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
      },
      portfolioPaperOrderBatches: [{ batchId: "broken-batch" }]
    };

    expect(normalizeResearchRunExportPackagePayload(exportPackage)).toBeNull();
  });

  test("rejects malformed portfolio paper order approvals and simulations in export packages", () => {
    const exportPackage = {
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-05-26T08:05:00+00:00",
      manifest: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-preview",
        dataHash: "hash-preview",
        dataRows: 1,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: {
          bars: 1,
          trades: 0,
          equityPoints: 0,
          decisions: 0,
          aiRisks: 0,
          portfolioPaperOrderApprovals: 1,
          portfolioPaperOrderSimulations: 1
        }
      },
      researchRun: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Preview SMA trend",
        strategyRevision: "rev-preview",
        dataRows: 1,
        metrics: { total_return_pct: 1.2, trade_count: 0 },
        decisions: [],
        executionMode: "paper_only",
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 1,
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:00:00+00:00",
          hash: "hash-preview",
          bars: [
            {
              timestamp: "2026-05-26T08:00:00+00:00",
              timestampMs: 1779782400000,
              open: 9.1,
              high: 9.3,
              low: 9,
              close: 9.2,
              volume: 1200000
            }
          ]
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
      },
      portfolioPaperOrderApprovals: [{ approvalId: "broken-approval" }],
      portfolioPaperOrderSimulations: [{ simulationId: "broken-simulation" }]
    };

    expect(normalizeResearchRunExportPackagePayload(exportPackage)).toBeNull();
  });

  test("strips untrusted local package verification markers from external package signatures", () => {
    const exportPackage = {
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-05-26T08:05:00+00:00",
      manifest: {
        runId: "run-untrusted-verification",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-untrusted-verification",
        dataHash: "hash-untrusted-verification",
        dataRows: 1,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: { bars: 1, trades: 0, equityPoints: 0, decisions: 0, aiRisks: 0 }
      },
      researchRun: {
        runId: "run-untrusted-verification",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Untrusted marker test",
        strategyRevision: "rev-untrusted-verification",
        dataRows: 1,
        metrics: { total_return_pct: 1.2, trade_count: 0 },
        decisions: [],
        executionMode: "paper_only",
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 1,
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:00:00+00:00",
          hash: "hash-untrusted-verification",
          bars: []
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
      },
      auditReport: {
        kind: "aiqt.auditReport",
        schemaVersion: 1,
        runId: "run-untrusted-verification",
        generatedAt: "2026-05-26T08:01:00+00:00",
        format: "text/markdown",
        fileName: "run-untrusted-verification-audit-evidence-report.md",
        contentSha256: { algorithm: "sha256", hash: "b".repeat(64) },
        contentMarkdown: "# report",
        signature: {
          eventId: "audit-report-untrusted-verification",
          status: "signed",
          algorithm: "hmac-sha256",
          chainId: "audit-chain-local",
          keyId: "local-audit-key",
          signedAt: "2026-05-26T08:01:00+00:00",
          signer: "Local Audit Key",
          value: "c".repeat(64),
          importVerificationReason: "signature_verified",
          importVerificationSource: "local-core",
          importVerificationStatus: "verified",
          importVerifiedAt: "2026-05-26T08:02:00+00:00"
        },
        evidenceSummary: {
          kind: "aiqt.auditEvidenceSummary",
          schemaVersion: 1,
          runId: "run-untrusted-verification",
          generatedAt: "2026-05-26T08:01:00+00:00",
          auditQuery: "manifest:run-untrusted-verification",
          packageQuery: "manifest:run-untrusted-verification",
          importDiffQuery: "manifest:run-untrusted-verification",
          focusQuery: "manifest:run-untrusted-verification",
          deepLinkStatus: "loaded",
          deepLinkError: null,
          package: { ready: 1, missing: 0, blocked: 0, matched: 1, total: 1 },
          importDiff: { changes: 0, adds: 1, blocked: 0, matched: 1, total: 1 },
          copyText: "Run: run-untrusted-verification"
        }
      }
    };

    const normalized = normalizeResearchRunExportPackagePayload(exportPackage);

    expect(normalized?.auditReport?.signature?.status).toBe("signed");
    expect(normalized?.auditReport?.signature?.importVerificationSource).toBeUndefined();
    expect(normalized?.auditReport?.signature?.importVerificationStatus).toBeUndefined();
    expect(normalized?.auditReport?.signature?.importVerificationReason).toBeUndefined();
    expect(normalized?.auditReport?.signature?.importVerifiedAt).toBeUndefined();
  });

  test("attaches audit evidence summary metadata to research run export packages", async () => {
    const exportPackage = {
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-05-26T08:05:00+00:00",
      integrity: { algorithm: "sha256", hash: "a".repeat(64) },
      manifest: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-preview",
        dataHash: "hash-preview",
        dataRows: 1,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: { bars: 1, trades: 0, equityPoints: 0, decisions: 0, aiRisks: 0 }
      },
      researchRun: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Preview SMA trend",
        strategyRevision: "rev-preview",
        dataRows: 1,
        metrics: { total_return_pct: 1.2, trade_count: 0 },
        decisions: [],
        executionMode: "paper_only",
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 1,
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:00:00+00:00",
          hash: "hash-preview",
          bars: [
            {
              timestamp: "2026-05-26T08:00:00+00:00",
              timestampMs: 1779782400000,
              open: 9.1,
              high: 9.3,
              low: 9,
              close: 9.2,
              volume: 1200000
            }
          ]
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
      }
    } satisfies ResearchRunExportPackage;

    const summary = {
      auditQuery: "manual-smoke",
      copyText: "AIQT Audit Evidence Summary\nRun: run-preview",
      deepLinkError: null,
      deepLinkStatus: "loaded" as const,
      focusQuery: "manifest:run-preview",
      importDiffAddCount: 0,
      importDiffBlockedCount: 0,
      importDiffChangeCount: 0,
      importDiffMatchedCount: 1,
      importDiffQuery: "manifest:run-preview",
      importDiffTotalCount: 11,
      importVerificationBuckets: [
        {
          count: 1,
          latestExportPath: "auditReport.contentSha256.hash",
          latestReason: "signature_verified",
          source: "local-core" as const,
          status: "verified" as const
        }
      ],
      importVerificationInvalidCount: 0,
      importVerificationVerifiedCount: 1,
      importPolicyBlockedCount: 1,
      importPolicyBlockerBuckets: [
        {
          category: "import-verification" as const,
          count: 1,
          label: "Import verification",
          latestDetail: "Audit report carries invalid imported evidence and cannot be trusted for import.",
          latestExportPath: "auditReport.contentSha256.hash",
          latestFileName: "invalid-evidence.json",
          latestRunId: "run-preview",
          tone: "risk" as const
        }
      ],
      packageBlockedCount: 0,
      packageMatchedCount: 1,
      packageMissingCount: 0,
      packageQuery: "manifest:run-preview",
      packageReadyCount: 5,
      packageTotalCount: 9,
      runId: "run-preview"
    };

    const enrichedPackage = withResearchRunExportAuditEvidenceSummary(
      exportPackage,
      summary,
      "2026-06-04T08:00:00+00:00"
    );
    const auditReport = await buildResearchRunExportAuditReport(summary, "2026-06-04T08:00:00+00:00");
    const enrichedArtifactPackage = await withResearchRunExportAuditEvidenceArtifacts(
      exportPackage,
      summary,
      "2026-06-04T08:00:00+00:00"
    );

    expect(enrichedPackage.auditEvidenceSummary).toMatchObject({
      kind: "aiqt.auditEvidenceSummary",
      schemaVersion: 1,
      runId: "run-preview",
      generatedAt: "2026-06-04T08:00:00+00:00",
      package: { ready: 5, missing: 0, blocked: 0, matched: 1, total: 9 },
      importDiff: { changes: 0, adds: 0, blocked: 0, matched: 1, total: 11 },
      importVerification: {
        verified: 1,
        invalid: 0,
        buckets: [
          {
            count: 1,
            latestExportPath: "auditReport.contentSha256.hash",
            latestReason: "signature_verified",
            source: "local-core",
            status: "verified"
          }
        ]
      },
      importPolicyBlockers: {
        blocked: 1,
        buckets: [
          {
            category: "import-verification",
            count: 1,
            label: "Import verification",
            latestDetail: "Audit report carries invalid imported evidence and cannot be trusted for import.",
            latestExportPath: "auditReport.contentSha256.hash",
            latestFileName: "invalid-evidence.json",
            latestRunId: "run-preview",
            tone: "risk"
          }
        ]
      }
    });
    expect(normalizeResearchRunExportPackagePayload(enrichedPackage)?.auditEvidenceSummary?.copyText).toContain(
      "AIQT Audit Evidence Summary"
    );
    expect(normalizeResearchRunExportPackagePayload({ export: enrichedPackage })?.auditEvidenceSummary?.package.matched).toBe(
      1
    );
    expect(
      normalizeResearchRunExportPackagePayload({ export: enrichedPackage })?.auditEvidenceSummary?.importVerification?.verified
    ).toBe(1);
    expect(
      normalizeResearchRunExportPackagePayload({ export: enrichedPackage })?.auditEvidenceSummary?.importPolicyBlockers?.blocked
    ).toBe(1);
    expect(auditReport).toMatchObject({
      kind: "aiqt.auditReport",
      schemaVersion: 1,
      runId: "run-preview",
      generatedAt: "2026-06-04T08:00:00+00:00",
      format: "text/markdown",
      fileName: "run-preview-audit-evidence-report.md",
      contentSha256: { algorithm: "sha256" }
    });
    expect(auditReport.contentSha256.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(auditReport.contentMarkdown).toContain("# AIQuant Audit Evidence Report");
    expect(auditReport.evidenceSummary.copyText).toContain("AIQT Audit Evidence Summary");
    expect(enrichedArtifactPackage.auditEvidenceSummary?.runId).toBe("run-preview");
    expect(enrichedArtifactPackage.auditReport?.contentSha256.hash).toBe(auditReport.contentSha256.hash);
    expect(enrichedArtifactPackage.backtestReport).toMatchObject({
      kind: "aiqt.backtestReport",
      schemaVersion: 1,
      runId: "run-preview",
      generatedAt: "2026-06-04T08:00:00+00:00",
      format: "text/markdown",
      fileName: "run-preview-backtest-report.md",
      contentSha256: { algorithm: "sha256" },
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyRevision: "rev-preview",
      executionMode: "paper_only",
      dataRows: 1,
      boundary: "historical audited evidence only; no investment advice"
    });
    expect(enrichedArtifactPackage.backtestReport?.contentSha256.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(enrichedArtifactPackage.backtestReport?.contentMarkdown).toContain("# AIQuant Audited Backtest Report");
    expect(normalizeResearchRunExportPackagePayload(enrichedArtifactPackage)?.auditReport?.fileName).toBe(
      "run-preview-audit-evidence-report.md"
    );
    expect(normalizeResearchRunExportPackagePayload(enrichedArtifactPackage)?.backtestReport?.fileName).toBe(
      "run-preview-backtest-report.md"
    );
    const signedArtifactPackage = {
      ...enrichedArtifactPackage,
      auditReport: {
        ...enrichedArtifactPackage.auditReport,
        signature: {
          status: "verified",
          algorithm: "hmac-sha256",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          signedAt: "2026-06-04T08:01:00.000Z",
          verifiedAt: "2026-06-04T08:02:00.000Z",
          chainId: "audit-chain-local",
          value: "a".repeat(64)
        }
      },
      backtestReport: {
        ...enrichedArtifactPackage.backtestReport,
        signature: {
          status: "signed",
          algorithm: "hmac-sha256",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          signedAt: "2026-06-04T08:03:00.000Z",
          chainId: "audit-chain-local",
          value: "b".repeat(64)
        }
      }
    };
    expect(normalizeResearchRunExportPackagePayload(signedArtifactPackage)?.auditReport?.signature).toMatchObject({
      keyId: "local-audit-key",
      status: "verified"
    });
    expect(normalizeResearchRunExportPackagePayload(signedArtifactPackage)?.backtestReport?.signature).toMatchObject({
      keyId: "local-audit-key",
      status: "signed"
    });
    const signedAuditEvent: AuditEventRecord = {
      schemaVersion: 1,
      eventId: "audit-report-run-preview-signed",
      eventType: "audit_evidence_report",
      runId: "run-preview",
      createdAt: "2026-06-04T08:04:00.000Z",
      stage: "generated",
      source: "web",
      summary: "Audit evidence report generated for run-preview",
      detail: "signed audit report",
      metadata: {
        artifactKind: "aiqt.auditReport",
        fileName: enrichedArtifactPackage.auditReport?.fileName,
        contentSha256: enrichedArtifactPackage.auditReport?.contentSha256.hash,
        contentSha256Algorithm: "sha256",
        signature: {
          status: "verified",
          algorithm: "hmac-sha256",
          chainId: "audit-chain-local",
          keyId: "local-audit-key",
          signedAt: "2026-06-04T08:04:00.000Z",
          signer: "Local Audit Key",
          value: "c".repeat(64),
          verifiedAt: "2026-06-04T08:05:00.000Z"
        }
      }
    };
    const signedBacktestEvent: AuditEventRecord = {
      schemaVersion: 1,
      eventId: "backtest-report-run-preview-signed",
      eventType: "backtest_report",
      runId: "run-preview",
      createdAt: "2026-06-04T08:06:00.000Z",
      stage: "generated",
      source: "web",
      summary: "Backtest Markdown report generated for run-preview",
      detail: "signed backtest report",
      metadata: {
        artifactKind: "aiqt.backtestReport",
        fileName: enrichedArtifactPackage.backtestReport?.fileName,
        contentSha256: enrichedArtifactPackage.backtestReport?.contentSha256.hash,
        contentSha256Algorithm: "sha256",
        signature: {
          status: "signed",
          algorithm: "hmac-sha256",
          chainId: "audit-chain-local",
          keyId: "local-audit-key",
          signedAt: "2026-06-04T08:06:00.000Z",
          signer: "Local Audit Key",
          value: "d".repeat(64)
        }
      }
    };
    const signedExportPackage = withResearchRunExportReportSignatures(enrichedArtifactPackage, [
      {
        ...signedAuditEvent,
        eventId: "audit-report-wrong-hash",
        metadata: { ...signedAuditEvent.metadata, contentSha256: "0".repeat(64) }
      },
      signedAuditEvent,
      {
        ...signedBacktestEvent,
        eventId: "backtest-report-leaky-signature",
        metadata: {
          ...signedBacktestEvent.metadata,
          signature: { ...(signedBacktestEvent.metadata.signature as Record<string, unknown>), secret: "nope" }
        }
      },
      signedBacktestEvent
    ]);
    expect(signedExportPackage.auditReport?.signature).toMatchObject({
      eventId: "audit-report-run-preview-signed",
      keyId: "local-audit-key",
      status: "verified",
      verifiedAt: "2026-06-04T08:05:00.000Z"
    });
    expect(signedExportPackage.backtestReport?.signature).toMatchObject({
      eventId: "backtest-report-run-preview-signed",
      keyId: "local-audit-key",
      status: "signed",
      signedAt: "2026-06-04T08:06:00.000Z"
    });
    expect(
      normalizeResearchRunExportPackagePayload({
        ...signedArtifactPackage,
        auditReport: {
          ...signedArtifactPackage.auditReport,
          signature: { ...signedArtifactPackage.auditReport.signature, secret: "do-not-import" }
        }
      })
    ).toBeNull();
    expect(
      normalizeResearchRunExportPackagePayload({
        ...signedArtifactPackage,
        backtestReport: {
          ...signedArtifactPackage.backtestReport,
          signature: { ...signedArtifactPackage.backtestReport.signature, privateKey: "do-not-import" }
        }
      })
    ).toBeNull();
    expect(
      normalizeResearchRunExportPackagePayload({
        ...enrichedPackage,
        auditEvidenceSummary: { ...enrichedPackage.auditEvidenceSummary, schemaVersion: 2 }
      })
    ).toBeNull();
    expect(
      normalizeResearchRunExportPackagePayload({
        ...enrichedArtifactPackage,
        auditReport: { ...enrichedArtifactPackage.auditReport, contentSha256: { algorithm: "sha256", hash: "bad" } }
      })
    ).toBeNull();
    expect(
      normalizeResearchRunExportPackagePayload({
        ...enrichedArtifactPackage,
        backtestReport: {
          ...enrichedArtifactPackage.backtestReport,
          contentSha256: { algorithm: "sha256", hash: "bad" }
        }
      })
    ).toBeNull();
  });

  test("builds a ledger audit event when an audit evidence report is generated", async () => {
    const summary = {
      auditQuery: "manifest:run-preview",
      copyText: "AIQT Audit Evidence Summary\nRun: run-preview\nFocus: manifest:run-preview",
      deepLinkError: null,
      deepLinkStatus: "loaded" as const,
      focusQuery: "manifest:run-preview",
      importDiffAddCount: 1,
      importDiffBlockedCount: 2,
      importDiffChangeCount: 3,
      importDiffMatchedCount: 4,
      importDiffQuery: "auditReport.contentSha256.hash",
      importDiffTotalCount: 11,
      importPolicyBlockedCount: 0,
      importPolicyBlockerBuckets: [],
      importVerificationBuckets: [
        {
          count: 1,
          latestExportPath: "auditReport.contentSha256.hash",
          latestReason: "signature_verified",
          source: "local-core" as const,
          status: "verified" as const
        }
      ],
      importVerificationInvalidCount: 0,
      importVerificationVerifiedCount: 1,
      packageBlockedCount: 1,
      packageMatchedCount: 2,
      packageMissingCount: 0,
      packageQuery: "auditReport",
      packageReadyCount: 6,
      packageTotalCount: 9,
      runId: "run-preview"
    };
    const auditReport = await buildResearchRunExportAuditReport(summary, "2026-06-04T08:00:00+00:00");
    const event = buildAuditEvidenceReportAuditEvent(auditReport, summary);

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "audit_evidence_report",
      runId: "run-preview",
      createdAt: "2026-06-04T08:00:00+00:00",
      stage: "generated",
      source: "web",
      summary: "Audit evidence report generated for run-preview",
      metadata: {
        artifactKind: "aiqt.auditReport",
        fileName: "run-preview-audit-evidence-report.md",
        format: "text/markdown",
        contentSha256: auditReport.contentSha256.hash,
        contentSha256Algorithm: "sha256",
        evidenceFocus: "manifest:run-preview",
        auditQuery: "manifest:run-preview",
        packageQuery: "auditReport",
        importDiffQuery: "auditReport.contentSha256.hash",
        packageMatched: 2,
        packageTotal: 9,
        importDiffBlocked: 2,
        importDiffTotal: 11,
        importVerificationInvalid: 0,
        importVerificationLatestExportPath: "auditReport.contentSha256.hash",
        importVerificationLatestReason: "signature_verified",
        importVerificationLatestSource: "local-core",
        importVerificationLatestStatus: "verified",
        importVerificationVerified: 1,
        deepLinkStatus: "loaded",
        deepLinkError: null
      }
    });
    expect(event.eventId).toBe(`audit-report-run-preview-${auditReport.contentSha256.hash.slice(0, 16)}`);
    expect(event.detail).toContain("run-preview-audit-evidence-report.md");
    expect(event.detail).toContain(auditReport.contentSha256.hash.slice(0, 12));
  });

  test("builds a ledger audit event when a P0 readiness report is generated", async () => {
    const goldenPath = {
      status: "blocked",
      summary: {
        totalSteps: 5,
        passedSteps: 2,
        reviewSteps: 1,
        blockedSteps: 2,
        currentStepLabel: "Backtest report",
        nextActionId: "run-pipeline",
        liveTradingAllowed: false
      },
      nextAction: {
        id: "run-pipeline",
        label: "Run research pipeline",
        targetWorkspace: "research",
        reason: "Refresh audited backtest evidence."
      },
      runbook: [
        {
          stepId: "backtest-report",
          label: "Backtest report",
          workspaceId: "backtest",
          status: "review",
          current: true,
          passed: false,
          detail: "Refresh audited backtest evidence.",
          blocker: "Refresh audited backtest evidence.",
          actionId: "run-pipeline",
          actionLabel: "Run research pipeline",
          targetWorkspace: "research"
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
          actionLabel: "Run AI review",
          targetWorkspace: "ai-review"
        }
      ]
    } satisfies Parameters<typeof buildP0PlatformReadinessSummary>[0];
    const summary = buildP0PlatformReadinessSummary(goldenPath);
    const backlogItems = buildP0PlatformBacklogItems(goldenPath, 3);
    const outcome = buildP0PlatformActionOutcome({
      goldenPath: {
        latestRunId: "run-p0-readiness",
        status: "review",
        summary: { liveTradingAllowed: false }
      },
      paperExecution: null,
      statusLabel: "Golden Path audit run loaded"
    });
    const evidenceLink = buildP0PlatformActionOutcomeEvidenceLink(outcome);
    const markdown = buildP0PlatformReadinessReportMarkdown({
      backlogItems,
      evidenceLink,
      generatedAt: "2026-06-12T10:00:00.000Z",
      outcome,
      summary
    });

    const event = await buildP0PlatformReadinessReportAuditEvent({
      backlogItems,
      evidenceLink,
      generatedAt: "2026-06-12T10:00:00.000Z",
      markdown,
      outcome,
      summary
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "p0_readiness_report",
      runId: "run-p0-readiness",
      createdAt: "2026-06-12T10:00:00.000Z",
      stage: "generated",
      source: "web",
      summary: "P0 readiness report generated",
      metadata: {
        artifactKind: "aiqt.p0ReadinessReport",
        fileName: "run-p0-readiness-p0-readiness-report.md",
        format: "text/markdown",
        contentSha256Algorithm: "sha256",
        state: "blocked",
        progressPct: 40,
        passedSteps: 2,
        totalSteps: 5,
        reviewSteps: 1,
        blockedSteps: 2,
        openStepCount: 3,
        currentGapStepId: "backtest-report",
        currentGapLabel: "Backtest report",
        currentGapStatus: "review",
        latestEvidenceState: "audit_run",
        latestEvidenceId: "run-p0-readiness",
        latestEvidenceLink: "workspace=audit&runId=run-p0-readiness&exportPath=manifest%3Arun-p0-readiness",
        backlogCount: 2,
        firstBacklogStepId: "backtest-report",
        liveTradingAllowed: false,
        liveBoundary: "Paper-only boundary",
        boundary: "P0 readiness audit aid only; no live trading authorization or investment advice"
      }
    });
    expect(typeof event.metadata.contentSha256).toBe("string");
    expect(String(event.metadata.contentSha256)).toHaveLength(64);
    expect(event.eventId).toBe(`p0-readiness-report-run-p0-readiness-${String(event.metadata.contentSha256).slice(0, 16)}`);
    expect(event.detail).toContain("run-p0-readiness-p0-readiness-report.md");
    expect(event.detail).toContain("2/5 steps");
    expect(event.detail).not.toContain(markdown);
  });

  test("builds a ledger audit event when a backtest markdown report is exported", async () => {
    const run: ResearchRunAudit = {
      runId: "run-backtest-report",
      createdAt: "2026-06-05T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-backtest-report",
      dataRows: 240,
      dataQuality: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240
      },
      metrics: {
        total_return_pct: 5,
        max_drawdown_pct: 4,
        win_rate_pct: 52,
        trade_count: 8
      },
      decisions: [],
      executionMode: "paper_only"
    };
    const previousRun: ResearchRunAudit = {
      ...run,
      runId: "run-backtest-report-prev",
      createdAt: "2026-06-04T08:00:00+00:00",
      strategyRevision: "rev-backtest-report-prev",
      metrics: {
        total_return_pct: 2,
        max_drawdown_pct: 6,
        win_rate_pct: 48,
        trade_count: 7
      }
    };
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), run);
    const markdown = buildBacktestReportMarkdown(workspace, [run, previousRun]);

    expect(markdown).toContain("## Run Comparison Matrix");

    const event = await buildBacktestReportAuditEvent({
      generatedAt: "2026-06-05T09:00:00+00:00",
      markdown: markdown ?? "",
      runHistory: [run, previousRun],
      workspace
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "backtest_report",
      runId: "run-backtest-report",
      createdAt: "2026-06-05T09:00:00+00:00",
      stage: "generated",
      source: "web",
      summary: "Backtest Markdown report generated for run-backtest-report",
      metadata: {
        artifactKind: "aiqt.backtestReport",
        fileName: "run-backtest-report-backtest-report.md",
        format: "text/markdown",
        contentSha256Algorithm: "sha256",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-backtest-report",
        executionMode: "paper_only",
        dataRows: 240,
        runComparisonRows: 2,
        hasRunComparisonMatrix: true,
        boundary: "historical audited evidence only; no investment advice"
      }
    });
    expect(typeof event?.metadata.contentSha256).toBe("string");
    expect(event?.eventId).toBe(
      `backtest-report-run-backtest-report-${String(event?.metadata.contentSha256).slice(0, 16)}`
    );
    expect(event?.detail).toContain("run-backtest-report-backtest-report.md");
    expect(event?.detail).toContain("2 comparable runs");
    expect(event?.detail).not.toContain(markdown ?? "");
  });

  test("builds a portfolio report audit event from a combined backtest report", async () => {
    const portfolio: PortfolioBacktestRun = {
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
          dataQuality: {
            source: "local-cache",
            isComplete: true,
            warnings: [],
            rows: 2
          }
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
          dataQuality: {
            source: "local-cache",
            isComplete: false,
            warnings: ["missing 1 bar"],
            rows: 2
          }
        }
      ],
      correlationPairs: [{ leftSymbol: "600000", rightSymbol: "000300", correlation: 0.91 }],
      covarianceRisk: {
        method: "population_covariance",
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
      tradeReviewEvents: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "trade_review",
          symbol: "600000",
          sourceRunId: "run-current-600000",
          side: "sell",
          notionalValue: 2470,
          targetWeight: 0.65,
          endingWeight: 0.6733,
          status: "paper_review",
          reason: "paper-only rebalance intent generated from audited portfolio drift; no order is routed"
        }
      ],
      preTradeRiskChecks: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "pre_trade_risk_check",
          scope: "portfolio",
          symbol: null,
          sourceRunId: null,
          checkId: "portfolio_data_quality",
          status: "blocked",
          value: 0,
          limit: 1,
          reason: "portfolio composite data quality is incomplete; no paper order should be staged"
        }
      ],
      paperOrderEvents: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "portfolio_paper_order",
          orderId: "portfolio-paper-run-current-600000-sell",
          symbol: "600000",
          sourceRunId: "run-current-600000",
          side: "sell",
          notionalValue: 2470,
          quantity: 2470,
          status: "rejected",
          riskStatus: "blocked",
          reason: "pre-trade risk checks blocked this portfolio paper order candidate"
        }
      ],
      dataQuality: {
        source: "portfolio-composite(600000:local-cache,000300:local-cache)",
        isComplete: false,
        warnings: ["000300: missing 1 bar"],
        rows: 2
      }
    };
    const markdown = buildPortfolioBacktestReportMarkdown(
      portfolio,
      {
        status: "ready",
        headline: "Audited basket ready",
        summary: "2 legs from audited runs",
        cashWeight: 0.1,
        request: {
          name: portfolio.name,
          initialCash: portfolio.initialCash,
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
            totalReturnPct: "+10.0%",
            maxDrawdownPct: "5.1%",
            current: true
          },
          {
            runId: "run-peer-000300",
            symbol: "000300",
            targetWeight: 0.25,
            weightLabel: "25.0%",
            strategyRevision: "rev-peer",
            totalReturnPct: "-4.0%",
            maxDrawdownPct: "7.3%",
            current: false
          }
        ]
      },
      { generatedAt: "2026-06-06T10:00:00+08:00" }
    );

    expect(markdown).toContain("## Diagnostics");

    const event = await buildPortfolioBacktestReportAuditEvent({
      baseRunId: "run-current-600000",
      generatedAt: "2026-06-06T10:00:00+08:00",
      markdown: markdown ?? "",
      portfolio
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "portfolio_report",
      runId: "run-current-600000",
      createdAt: "2026-06-06T10:00:00+08:00",
      stage: "generated",
      source: "web",
      summary: "Portfolio Markdown report generated for ashare 1d audited basket",
      metadata: {
        artifactKind: "aiqt.portfolioReport",
        fileName: "run-current-600000-ashare-1d-portfolio-report.md",
        format: "text/markdown",
        contentSha256Algorithm: "sha256",
        portfolioName: "ashare 1d audited basket",
        market: "ashare",
        timeframe: "1d",
        initialCash: 100000,
        cashWeight: 0.1,
        legCount: 2,
        equityRows: 2,
        tradeReviewEventCount: 1,
        preTradeRiskCheckCount: 1,
        paperOrderEventCount: 1,
        covarianceRiskContributionCount: 2,
        covarianceRiskAnnualizedVolatilityPct: 28.6,
        diagnosticsCount: 9,
        incompleteDataQuality: true,
        negativeContributionLegs: 1,
        boundary: "historical audited portfolio evidence only; no investment advice"
      }
    });
    expect(event?.metadata.contentSha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(event?.eventId).toBe(
      `portfolio-report-run-current-600000-${String(event?.metadata.contentSha256).slice(0, 16)}`
    );
    expect(event?.detail).toContain("run-current-600000-ashare-1d-portfolio-report.md");
    expect(event?.detail).toContain("2 legs");
    expect(event?.detail).toContain("9 diagnostics");
    expect(event?.detail).not.toContain(markdown ?? "");
  });

  test("does not build a portfolio report audit event without an anchored research run", async () => {
    const event = await buildPortfolioBacktestReportAuditEvent({
      baseRunId: null,
      markdown: "# Portfolio report",
      portfolio: null
    });

    expect(event).toBeNull();
  });

  test("builds a secret-free audit event when an audit signing key rotation plan is prepared", async () => {
    const event = await buildAuditSigningKeyRotationPlanAuditEvent({
      schemaVersion: 1,
      generatedAt: "2026-06-04T10:30:00+00:00",
      currentActiveKey: {
        keyId: "active-audit-key",
        signer: "Active Audit Key",
        chainId: "audit-chain-active",
        fingerprint: "a".repeat(16)
      },
      proposedActiveKey: {
        keyId: "next-audit-key",
        signer: "Next Audit Key",
        chainId: "audit-chain-next"
      },
      rotationRequired: true,
      requiresRestart: true,
      environmentUpdates: [
        { name: "AIQT_AUDIT_SIGNING_KEY_ID", value: "next-audit-key", sensitivity: "public" },
        { name: "AIQT_AUDIT_SIGNER_NAME", value: "Next Audit Key", sensitivity: "public" },
        { name: "AIQT_AUDIT_SIGNING_SECRET", value: "<set-new-key-material-outside-ui>", sensitivity: "secret" },
        {
          name: "AIQT_AUDIT_SIGNING_KEYS_JSON",
          value:
            '[{"keyId":"active-audit-key","signer":"Active Audit Key","secret":"<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>"}]',
          sensitivity: "secret"
        }
      ],
      legacyRegistryTemplate:
        '[{"keyId":"active-audit-key","signer":"Active Audit Key","secret":"<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>"}]',
      steps: [
        {
          id: "set-new-active-key",
          title: "Set new active signing key",
          detail: "Update active signing key environment variables with new locally generated key material.",
          status: "manual"
        },
        {
          id: "verify-legacy-reports",
          title: "Verify legacy reports",
          detail: "Run Audit report verification on old signed reports before removing any retired key.",
          status: "required"
        }
      ],
      blockedReasons: []
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "audit_signing_key_rotation_plan",
      runId: "audit-signing-key-rotation",
      createdAt: "2026-06-04T10:30:00+00:00",
      stage: "prepared",
      source: "web",
      summary: "Audit signing key rotation plan prepared for next-audit-key",
      metadata: {
        currentKeyId: "active-audit-key",
        currentKeyFingerprint: "a".repeat(16),
        proposedKeyId: "next-audit-key",
        proposedSigner: "Next Audit Key",
        proposedChainId: "audit-chain-next",
        rotationRequired: true,
        requiresRestart: true,
        environmentUpdateNames: [
          "AIQT_AUDIT_SIGNING_KEY_ID",
          "AIQT_AUDIT_SIGNER_NAME",
          "AIQT_AUDIT_SIGNING_SECRET",
          "AIQT_AUDIT_SIGNING_KEYS_JSON"
        ],
        secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"],
        stepIds: ["set-new-active-key", "verify-legacy-reports"],
        blockedReasons: []
      }
    });
    expect(event.eventId).toMatch(/^audit-signing-key-rotation-next-audit-key-[a-f0-9]{12}$/);
    expect(String(event.metadata.legacyRegistryTemplateSha256)).toMatch(/^[a-f0-9]{64}$/);
    expect(event.detail).toContain("legacy template sha256");
    expect(JSON.stringify(event)).not.toContain("<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>");
    expect(JSON.stringify(event)).not.toContain("<set-new-key-material-outside-ui>");
    expect(JSON.stringify(event)).not.toContain("active-audit-secret");
  });

  test("builds a secret-free audit event when an audit signing key rotation apply preflight runs", async () => {
    const event = await buildAuditSigningKeyRotationApplyAuditEvent({
      schemaVersion: 1,
      generatedAt: "2026-06-04T11:00:00+00:00",
      status: "blocked",
      applyMode: "manual_secret_store",
      auditEventType: "audit_signing_key_rotation_apply",
      currentActiveKeyId: "active-audit-key",
      currentActiveKeyFingerprint: "a".repeat(16),
      proposedActiveKeyId: "next-audit-key",
      proposedSigner: "Next Audit Key",
      proposedChainId: "audit-chain-next",
      restartRequired: true,
      requiredConfirmations: [
        { id: "new-secret-material-stored", label: "New signing secret generated and stored outside the UI", status: "missing" },
        { id: "legacy-secret-stored", label: "Current active secret copied into legacy registry outside the UI", status: "confirmed" }
      ],
      blockedReasons: ["new_secret_material_not_confirmed"],
      environmentUpdateNames: ["AIQT_AUDIT_SIGNING_KEY_ID", "AIQT_AUDIT_SIGNING_SECRET"],
      secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET"]
    });

    expect(event).toEqual(
      expect.objectContaining({
        eventType: "audit_signing_key_rotation_apply",
        runId: "audit-signing-key-rotation",
        source: "web",
        stage: "blocked",
        summary: "Audit signing key rotation apply blocked for next-audit-key"
      })
    );
    expect(event.eventId).toMatch(/^audit-signing-key-rotation-apply-next-audit-key-[a-f0-9]{12}$/u);
    expect(event.metadata).toEqual(
      expect.objectContaining({
        applyMode: "manual_secret_store",
        auditEventType: "audit_signing_key_rotation_apply",
        blockedReasons: ["new_secret_material_not_confirmed"],
        confirmedConfirmationIds: ["legacy-secret-stored"],
        currentActiveKeyFingerprint: "a".repeat(16),
        currentActiveKeyId: "active-audit-key",
        environmentUpdateNames: ["AIQT_AUDIT_SIGNING_KEY_ID", "AIQT_AUDIT_SIGNING_SECRET"],
        missingConfirmationIds: ["new-secret-material-stored"],
        proposedActiveKeyId: "next-audit-key",
        proposedChainId: "audit-chain-next",
        proposedSigner: "Next Audit Key",
        restartRequired: true,
        secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET"],
        status: "blocked"
      })
    );
    expect(JSON.stringify(event)).not.toContain("<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>");
    expect(JSON.stringify(event)).not.toContain("local-dev-audit-secret");
  });

  test("returns fallback when research run export integrity is malformed", async () => {
    const result = await loadResearchRunExport("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        export: {
          kind: "aiqt.researchRun.export",
          packageVersion: 1,
          exportedAt: "2026-05-26T08:05:00+00:00",
          integrity: { algorithm: "md5", hash: "abc" },
          manifest: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyRevision: "rev123",
            dataHash: "snapshot-detail",
            dataRows: 1,
            executionMode: "paper_only",
            paperOnly: true,
            liveTradingAllowed: false,
            artifactCounts: { bars: 1, trades: 0, equityPoints: 0, decisions: 0, aiRisks: 0 }
          },
          researchRun: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyName: "SMA trend demo",
            strategyRevision: "rev123",
            dataRows: 1,
            metrics: { total_return_pct: 3.4, trade_count: 0 },
            decisions: [],
            executionMode: "paper_only",
            dataSnapshot: {
              source: "tencent",
              isComplete: true,
              warnings: [],
              rows: 1,
              start: null,
              end: null,
              hash: "snapshot-detail",
              bars: [
                {
                  timestamp: "2026-05-26T08:00:00+00:00",
                  timestampMs: 1779782400000,
                  open: 9.1,
                  high: 9.3,
                  low: 9,
                  close: 9.2,
                  volume: 1200000
                }
              ]
            }
          },
          executionHandoff: {
            mode: "paper_only",
            paperOnly: true,
            liveTradingAllowed: false,
            requiredGates: []
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid research run export contract");
  });

  test("returns fallback when research run export ai review records are malformed", async () => {
    const result = await loadResearchRunExport("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        export: {
          kind: "aiqt.researchRun.export",
          packageVersion: 1,
          exportedAt: "2026-05-26T08:05:00+00:00",
          manifest: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyRevision: "rev123",
            dataHash: "snapshot-detail",
            dataRows: 1,
            executionMode: "paper_only",
            paperOnly: true,
            liveTradingAllowed: false,
            artifactCounts: {
              bars: 1,
              trades: 0,
              equityPoints: 0,
              decisions: 0,
              aiRisks: 0,
              aiReviewRuns: 1
            }
          },
          researchRun: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyName: "SMA trend demo",
            strategyRevision: "rev123",
            dataRows: 1,
            metrics: { total_return_pct: 3.4, trade_count: 0 },
            decisions: [],
            executionMode: "paper_only",
            dataSnapshot: {
              source: "tencent",
              isComplete: true,
              warnings: [],
              rows: 1,
              start: null,
              end: null,
              hash: "snapshot-detail",
              bars: [
                {
                  timestamp: "2026-05-26T08:00:00+00:00",
                  timestampMs: 1779782400000,
                  open: 9.1,
                  high: 9.3,
                  low: 9,
                  close: 9.2,
                  volume: 1200000
                }
              ]
            }
          },
          executionHandoff: {
            mode: "paper_only",
            paperOnly: true,
            liveTradingAllowed: false,
            requiredGates: []
          },
          aiReviewRuns: [{ aiReviewId: "broken-ai-review" }]
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.exportPackage).toBeUndefined();
    expect(result.error).toBe("Invalid research run export contract");
  });

  test("imports one research run export package into the Python core", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await importResearchRunExport(
      "http://127.0.0.1:8765",
      {
        kind: "aiqt.researchRun.export",
        packageVersion: 1,
        exportedAt: "2026-05-26T08:05:00+00:00",
        manifest: {
          runId: "run-import",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyRevision: "rev-import",
          dataHash: "snapshot-import",
          dataRows: 2,
          executionMode: "paper_only",
          paperOnly: true,
          liveTradingAllowed: false,
          artifactCounts: { bars: 2, trades: 1, equityPoints: 1, decisions: 1, aiRisks: 1, researchNotes: 1 }
        },
        researchRun: {
          runId: "run-import",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "Imported SMA trend",
          strategyRevision: "rev-import",
          dataRows: 2,
          metrics: { total_return_pct: 4.2, trade_count: 1 },
          decisions: [{ agent: "AI Summary", message: "Imported evidence only", tone: "ai" }],
          executionMode: "paper_only",
          researchNote: {
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            body: "导入包里的研究笔记应恢复到本地笔记库。",
            updatedAt: "2026-05-26T08:03:00+00:00"
          },
          dataSnapshot: {
            source: "tencent",
            isComplete: true,
            warnings: [],
            rows: 2,
            start: "2026-05-26T08:00:00+00:00",
            end: "2026-05-27T08:00:00+00:00",
            hash: "snapshot-import",
            bars: [
              {
                timestamp: "2026-05-26T08:00:00+00:00",
                timestampMs: 1779782400000,
                open: 9.1,
                high: 9.3,
                low: 9,
                close: 9.2,
                volume: 1200000
              }
            ]
          }
        },
        executionHandoff: {
          mode: "paper_only",
          paperOnly: true,
          liveTradingAllowed: false,
          requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
        }
      },
      async (url, init) => {
        calls.push({ url, init });
        if (url.includes("/api/research/notes")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              note: {
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                body: "导入包里的研究笔记应恢复到本地笔记库。",
                updatedAt: "2026-05-26T08:03:00+00:00"
              }
            })
          };
        }
        if (url.includes("/api/strategies")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              strategies: [
                {
                  strategyId: "strategy-rev-import",
                  createdAt: "2026-05-26T08:00:00+00:00",
                  name: "Imported SMA trend",
                  revision: "rev-import",
                  market: "ashare",
                  symbol: "600000",
                  timeframe: "1d",
                  version: 1,
                  status: "audited",
                  auditRunId: "run-import",
                  strategySnapshot: {
                    name: "Imported SMA trend",
                    entry: "Close > SMA20",
                    exit: "Close < SMA20",
                    position: "80% cap per instrument",
                    risk: "Stop -8%, take profit +18%, drawdown guard 20%, paper only"
                  },
                  strategyConfig: {
                    name: "Imported SMA trend",
                    revision: "rev-import",
                    market: "ashare",
                    symbols: ["600000"],
                    timeframe: "1d",
                    version: 1,
                    entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
                    exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
                    risk: {
                      positionPct: 0.8,
                      stopLossPct: 0.08,
                      takeProfitPct: 0.18,
                      maxDrawdownPct: 0.2
                    }
                  }
                }
              ]
            })
          };
        }
        return {
          ok: true,
          status: 201,
          json: async () => ({
            undoToken: "import-undo-client-token",
            run: {
              runId: "run-import",
              createdAt: "2026-05-26T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyName: "Imported SMA trend",
              strategyRevision: "rev-import",
              dataRows: 2,
              metrics: { total_return_pct: 4.2, trade_count: 1 },
              decisions: [{ agent: "AI Summary", message: "Imported evidence only", tone: "ai" }],
              executionMode: "paper_only",
              researchNote: {
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                body: "导入包里的研究笔记应恢复到本地笔记库。",
                updatedAt: "2026-05-26T08:03:00+00:00"
              },
              dataSnapshot: {
                source: "tencent",
                isComplete: true,
                warnings: [],
                rows: 1,
                start: "2026-05-26T08:00:00+00:00",
                end: "2026-05-26T08:00:00+00:00",
                hash: "snapshot-import",
                bars: [
                  {
                    timestamp: "2026-05-26T08:00:00+00:00",
                    timestampMs: 1779782400000,
                    open: 9.1,
                    high: 9.3,
                    low: 9,
                    close: 9.2,
                    volume: 1200000
                  }
                ]
              }
            }
          })
        };
      }
    );

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/research/runs/import");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(calls[0]?.init?.body)).kind).toBe("aiqt.researchRun.export");
    expect(calls[1]?.url).toBe("http://127.0.0.1:8765/api/research/notes?market=ashare&symbol=600000&timeframe=1d");
    expect(calls[2]?.url).toBe("http://127.0.0.1:8765/api/strategies?market=ashare&symbol=600000&limit=12");
    expect(result.source).toBe("core");
    expect(result.run?.runId).toBe("run-import");
    expect(result.undoToken).toBe("import-undo-client-token");
    expect(result.run?.dataSnapshot?.hash).toBe("snapshot-import");
    expect(result.note?.body).toBe("导入包里的研究笔记应恢复到本地笔记库。");
    expect(result.strategies?.[0]?.revision).toBe("rev-import");
    expect(result.strategies?.[0]?.status).toBe("audited");
  });

  test("undoes a successful research run import through the Python core", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await undoResearchRunImport(
      "http://127.0.0.1:8765",
      "import-undo-client-token",
      "run-import",
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            undo: {
              undoToken: "import-undo-client-token",
              runId: "run-import",
              createdAt: "2026-05-26T08:06:00+00:00",
              consumedAt: "2026-05-26T08:07:00+00:00",
              status: "undone"
            },
            run: {
              runId: "run-before-import",
              createdAt: "2026-05-25T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyName: "Previous SMA trend",
              strategyRevision: "rev-before-import",
              dataRows: 1,
              metrics: { total_return_pct: -1.0, trade_count: 1 },
              decisions: [],
              executionMode: "paper_only",
              dataSnapshot: {
                source: "tencent",
                isComplete: true,
                warnings: [],
                rows: 1,
                start: "2026-05-25T08:00:00+00:00",
                end: "2026-05-25T08:00:00+00:00",
                hash: "snapshot-before-import",
                bars: [
                  {
                    timestamp: "2026-05-25T08:00:00+00:00",
                    timestampMs: 1779696000000,
                    open: 8.9,
                    high: 9,
                    low: 8.7,
                    close: 8.8,
                    volume: 1100000
                  }
                ]
              }
            }
          })
        };
      }
    );

    expect(buildResearchRunImportUndoUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/research/runs/import/undo"
    );
    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/research/runs/import/undo");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({
      undoToken: "import-undo-client-token",
      expectedRunId: "run-import"
    });
    expect(result.source).toBe("core");
    expect(result.undo?.status).toBe("undone");
    expect(result.run?.runId).toBe("run-before-import");
  });

  test("surfaces detailed research run import errors from the Python core", async () => {
    const result = await importResearchRunExport(
      "http://127.0.0.1:8765",
      {
        kind: "aiqt.researchRun.export",
        packageVersion: 1,
        exportedAt: "2026-05-26T08:05:00+00:00",
        manifest: {
          runId: "run-import-broken",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyRevision: "rev-import",
          dataHash: "snapshot-import",
          dataRows: 1,
          executionMode: "paper_only",
          paperOnly: true,
          liveTradingAllowed: false,
          artifactCounts: { bars: 1, trades: 0, equityPoints: 1, decisions: 0, aiRisks: 0, researchNotes: 0 }
        },
        researchRun: {
          runId: "run-import-broken",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "Imported SMA trend",
          strategyRevision: "rev-import",
          dataRows: 1,
          metrics: { total_return_pct: 0, trade_count: 0 },
          decisions: [],
          executionMode: "paper_only"
        },
        executionHandoff: {
          mode: "paper_only",
          paperOnly: true,
          liveTradingAllowed: false,
          requiredGates: []
        }
      },
      async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          error: "invalid_research_run_export",
          detail: "integrity_hash_mismatch"
        })
      })
    );

    expect(result.source).toBe("core");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("integrity_hash_mismatch");
  });

  test("submits a paper execution for an audited research run", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await submitResearchRunPaperExecution("http://127.0.0.1:8765", "run-new", async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          execution: {
            executionId: "paper-123",
            runId: "run-new",
            createdAt: "2026-05-26T08:10:00+00:00",
            mode: "paper_only",
            account: { cash: 80680, positions: { "600000": 2100 }, equity: 100000 },
            orders: [
              {
                orderId: "order-1",
                symbol: "600000",
                side: "buy",
                quantity: 2100,
                price: 9.2,
                status: "filled",
                reason: "filled_immediately",
                timestamp: "2026-05-26T08:10:00+00:00"
              }
            ],
            gates: [
              {
                id: "audit-run-bound",
                label: "Audit run bound",
                passed: true,
                reason: "Paper execution is linked to audited run run-new."
              },
              {
                id: "paper-risk-check",
                label: "Paper risk check",
                passed: true,
                reason: "filled_immediately"
              },
              {
                id: "live-route-blocked",
                label: "Live route blocked",
                passed: false,
                reason: "Live execution is blocked; this record is paper-only."
              }
            ]
          },
          promotion: {
            candidateId: "promotion-run-new",
            runId: "run-new",
            createdAt: "2026-05-26T08:10:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyRevision: "rev123",
            latestPaperExecutionId: "paper-123",
            status: "certification_pending",
            headline: "Live promotion pending certification",
            summary: "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass.",
            liveTradingAllowed: false,
            evidence: { paperExecutions: 1, filledOrders: 1, passedPaperRiskChecks: 1 },
            stages: [
              {
                id: "paper-execution",
                label: "Paper execution",
                value: "1 filled order",
                detail: "Paper snapshot paper-123 passed local risk checks before live promotion.",
                status: "passed",
                tone: "positive",
                passed: true,
                reason: "Paper snapshot paper-123 passed local risk checks before live promotion."
              }
            ]
          }
        })
      };
    });

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/research/runs/run-new/paper-executions");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(result.source).toBe("core");
    expect(result.execution?.orders[0]?.status).toBe("filled");
    expect(result.execution?.gates[2]?.passed).toBe(false);
    expect(result.promotion?.runId).toBe("run-new");
    expect(result.promotion?.status).toBe("certification_pending");
    expect(result.promotion?.stages[0]?.status).toBe("passed");
  });

  test("loads a promotion candidate for an audited research run", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunPromotion("http://127.0.0.1:8765", "run-new", async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          promotion: {
            candidateId: "promotion-run-new",
            runId: "run-new",
            createdAt: "2026-05-26T08:20:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyRevision: "rev123",
            latestPaperExecutionId: "paper-latest",
            status: "certification_pending",
            headline: "Live promotion pending certification",
            summary: "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass.",
            liveTradingAllowed: false,
            evidence: { paperExecutions: 1, filledOrders: 1, passedPaperRiskChecks: 1 },
            stages: [
              {
                id: "paper-execution",
                label: "Paper execution",
                value: "1 filled order",
                detail: "Paper snapshot paper-latest passed local risk checks before live promotion.",
                status: "passed",
                tone: "positive",
                passed: true,
                reason: "Paper snapshot paper-latest passed local risk checks before live promotion."
              }
            ]
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-new/promotion"]);
    expect(result.source).toBe("core");
    expect(result.promotion?.latestPaperExecutionId).toBe("paper-latest");
    expect(result.promotion?.evidence.filledOrders).toBe(1);
  });

  test("saves an AI review run record for an audited research run", async () => {
    const record: AiReviewRunRecord = {
      schemaVersion: 1,
      recordType: "aiqt.aiReviewRun",
      aiReviewId: "ai-review:run-ai-save:rev-ai-save",
      runId: "run-ai-save",
      createdAt: "2026-06-02T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyRevision: "rev-ai-save",
      executionMode: "paper_only",
      status: "ready",
      summary: {
        citationCount: 2,
        roundCount: 1,
        decisionCount: 1,
        parameterScanBound: true,
        liveExecutionBlocked: true
      },
      dossier: {
        status: "ready",
        headline: "AI review bound to run-ai-save",
        summary: "Agents explain supplied evidence only.",
        citations: [
          {
            id: "run",
            label: "Run id",
            value: "run-ai-save",
            detail: "500 1d bars",
            tone: "positive"
          },
          {
            id: "parameter-scan",
            label: "Parameter scan",
            value: "Current rank 2 of 9",
            detail: "Candidate requires fresh audited run.",
            tone: "neutral"
          }
        ]
      },
      citations: [
        {
          id: "run",
          label: "Run id",
          value: "run-ai-save",
          detail: "500 1d bars",
          tone: "positive"
        }
      ],
      rounds: [
        {
          id: "technical-analysis",
          phase: "analysis",
          agent: "Technical Analyst",
          thesis: "Trend improving",
          evidence: "Close above SMA20",
          verdict: "support",
          confidence: 64,
          tone: "positive"
        }
      ],
      decisionLog: [
        {
          agent: "AI Boundary",
          message: "No buy/sell instructions.",
          tone: "ai"
        }
      ],
      evidenceAnchors: [
        {
          id: "run:run-ai-save",
          type: "research-run",
          label: "Research run",
          reference: "run-ai-save",
          exportPath: "researchRun.runId"
        }
      ],
      boundary: "Evidence explanation only; no buy/sell instructions or guaranteed returns."
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];

    const result = await saveAiReviewRunRecord("http://127.0.0.1:8765", record, async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          aiReview: {
            aiReviewId: record.aiReviewId,
            runId: record.runId,
            createdAt: record.createdAt,
            record
          }
        })
      };
    });

    expect(buildResearchRunAiReviewsUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1/ai-reviews"
    );
    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/research/runs/run-ai-save/ai-reviews");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual(record);
    expect(result.source).toBe("core");
    expect(result.aiReview?.record.summary.parameterScanBound).toBe(true);
  });

  test("loads AI review run records for replay and audit history", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunAiReviews("http://127.0.0.1:8765", "run-ai-save", async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          aiReviews: [
            {
              aiReviewId: "ai-review:run-ai-save:rev-ai-save",
              runId: "run-ai-save",
              createdAt: "2026-06-02T08:00:00+00:00",
              record: {
                schemaVersion: 1,
                recordType: "aiqt.aiReviewRun",
                aiReviewId: "ai-review:run-ai-save:rev-ai-save",
                runId: "run-ai-save",
                createdAt: "2026-06-02T08:00:00+00:00",
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                strategyRevision: "rev-ai-save",
                executionMode: "paper_only",
                status: "ready",
                summary: {
                  citationCount: 1,
                  roundCount: 1,
                  decisionCount: 1,
                  parameterScanBound: false,
                  liveExecutionBlocked: true
                },
                dossier: {
                  status: "ready",
                  headline: "AI review bound to run-ai-save",
                  summary: "Evidence only.",
                  citations: []
                },
                citations: [],
                rounds: [],
                decisionLog: [],
                boundary: "Evidence explanation only; no buy/sell instructions or guaranteed returns."
              }
            }
          ]
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-ai-save/ai-reviews"]);
    expect(result.source).toBe("core");
    expect(result.aiReviews).toHaveLength(1);
    expect(result.aiReviews[0]?.record.boundary).toContain("Evidence explanation only");
  });

  test("loads paged AI review run records with backend search metadata", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunAiReviews(
      "http://127.0.0.1:8765",
      "run-ai-save",
      { query: "risk drift", limit: 5, offset: 10 },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            aiReviews: [],
            pagination: {
              limit: 5,
              offset: 10,
              total: 24,
              query: "risk drift"
            }
          })
        };
      }
    );

    expect(buildResearchRunAiReviewsUrl("http://127.0.0.1:8765", "run-ai-save", { query: "risk drift", limit: 5, offset: 10 })).toBe(
      "http://127.0.0.1:8765/api/research/runs/run-ai-save/ai-reviews?query=risk+drift&limit=5&offset=10"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/research/runs/run-ai-save/ai-reviews?query=risk+drift&limit=5&offset=10"
    ]);
    expect(result.source).toBe("core");
    expect(result.pagination).toEqual({ limit: 5, offset: 10, total: 24, query: "risk drift" });
  });

  test("saves import audit events through the Python core", async () => {
    const event: AuditEventRecord = {
      schemaVersion: 1,
      eventId: "audit-import-run-ledger-confirmed",
      eventType: "research_run_import",
      runId: "run-ledger",
      createdAt: "2026-06-03T09:12:00+00:00",
      stage: "confirmed",
      source: "web",
      summary: "Import applied",
      detail: "Research run import wrote to the local audit store. 0 blocked · 2 changes.",
      metadata: {
        fileName: "safe-import.json",
        blockedCount: 0,
        changeCount: 2,
        exportPath: "manifest:run-ledger",
        tone: "positive"
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];

    const result = await saveAuditEvent("http://127.0.0.1:8765", event, async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({ event })
      };
    });

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/audit/events");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual(event);
    expect(result.source).toBe("core");
    expect(result.event?.metadata.fileName).toBe("safe-import.json");
  });

  test("loads paged import audit events with backend search metadata", async () => {
    const event: AuditEventRecord = {
      schemaVersion: 1,
      eventId: "audit-import-run-ledger-blocked",
      eventType: "research_run_import",
      runId: "run-ledger",
      createdAt: "2026-06-03T09:10:00+00:00",
      stage: "blocked",
      source: "web",
      summary: "Import preview blocked",
      detail: "Import preview found blocked preflight gates. 1 blocked · 2 changes.",
      metadata: {
        fileName: "unsafe-import.json",
        blockedCount: 1,
        changeCount: 2,
        exportPath: "manifest:run-ledger",
        tone: "risk"
      }
    };
    const calls: string[] = [];

    const result = await loadAuditEvents(
      "http://127.0.0.1:8765",
      { eventType: "research_run_import", runId: "run-ledger", query: "unsafe-import", limit: 5, offset: 10 },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            events: [event],
            pagination: {
              limit: 5,
              offset: 10,
              total: 1,
              query: "unsafe-import"
            }
          })
        };
      }
    );

    expect(
      buildAuditEventsUrl("http://127.0.0.1:8765", {
        eventType: "research_run_import",
        runId: "run-ledger",
        query: "unsafe-import",
        limit: 5,
        offset: 10
      })
    ).toBe(
      "http://127.0.0.1:8765/api/audit/events?eventType=research_run_import&runId=run-ledger&query=unsafe-import&limit=5&offset=10"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/audit/events?eventType=research_run_import&runId=run-ledger&query=unsafe-import&limit=5&offset=10"
    ]);
    expect(result.source).toBe("core");
    expect(result.events[0]?.stage).toBe("blocked");
    expect(result.pagination).toEqual({ limit: 5, offset: 10, total: 1, query: "unsafe-import" });
  });

  test("signs verifies and revokes audit report events through the local core", async () => {
    const signedEvent: AuditEventRecord = {
      schemaVersion: 1,
      eventId: "audit-report-run-signed",
      eventType: "audit_evidence_report",
      runId: "run-signed",
      createdAt: "2026-06-04T09:20:00+00:00",
      stage: "generated",
      source: "web",
      summary: "Audit evidence report generated for run-signed",
      detail: "signed report",
      metadata: {
        contentSha256: "f".repeat(64),
        fileName: "run-signed-audit-evidence-report.md",
        signature: {
          algorithm: "hmac-sha256",
          chainId: "audit-chain-local",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          status: "verified",
          value: "a".repeat(64)
        }
      }
    };
    const signedSignature = signedEvent.metadata.signature as Record<string, unknown>;
    const revokedEvent: AuditEventRecord = {
      ...signedEvent,
      metadata: {
        ...signedEvent.metadata,
        signature: {
          ...signedSignature,
          revokedAt: "2026-06-04T09:25:00+00:00",
          revokedReason: "superseded by corrected evidence package",
          status: "revoked"
        }
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];

    const signResult = await signAuditReportEvent("http://127.0.0.1:8765", "audit-report-run-signed", async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          event: signedEvent,
          signature: signedEvent.metadata.signature,
          verification: { status: "verified", reason: "signature_verified" }
        })
      };
    });
    const verifyResult = await verifyAuditReportEvent("http://127.0.0.1:8765", "audit-report-run-signed", async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          event: signedEvent,
          signature: signedEvent.metadata.signature,
          verification: { status: "verified", reason: "signature_verified" }
        })
      };
    });
    const revokeResult = await revokeAuditReportEvent(
      "http://127.0.0.1:8765",
      "audit-report-run-signed",
      "superseded by corrected evidence package",
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            event: revokedEvent,
            signature: revokedEvent.metadata.signature,
            verification: { status: "invalid", reason: "signature_revoked" }
          })
        };
      }
    );

    expect(buildAuditReportSignUrl("http://127.0.0.1:8765")).toBe("http://127.0.0.1:8765/api/audit/reports/sign");
    expect(buildAuditReportVerifyUrl("http://127.0.0.1:8765")).toBe("http://127.0.0.1:8765/api/audit/reports/verify");
    expect(buildAuditReportRevokeUrl("http://127.0.0.1:8765")).toBe("http://127.0.0.1:8765/api/audit/reports/revoke");
    expect(calls.map((call) => call.url)).toEqual([
      "http://127.0.0.1:8765/api/audit/reports/sign",
      "http://127.0.0.1:8765/api/audit/reports/verify",
      "http://127.0.0.1:8765/api/audit/reports/revoke"
    ]);
    expect(calls[0]?.init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ eventId: "audit-report-run-signed" });
    expect(JSON.parse(String(calls[2]?.init?.body))).toEqual({
      eventId: "audit-report-run-signed",
      reason: "superseded by corrected evidence package"
    });
    expect(signResult.source).toBe("core");
    expect(signResult.event?.metadata.signature).toEqual(signedEvent.metadata.signature);
    expect(signResult.verification).toEqual({ status: "verified", reason: "signature_verified" });
    expect(verifyResult.source).toBe("core");
    expect(verifyResult.signature?.keyId).toBe("local-audit-key");
    expect(revokeResult.source).toBe("core");
    expect(revokeResult.signature?.status).toBe("revoked");
    expect(revokeResult.verification).toEqual({ status: "invalid", reason: "signature_revoked" });
  });

  test("verifies external package report signatures through the local core", async () => {
    const report: NonNullable<ResearchRunExportPackage["backtestReport"]> = {
      kind: "aiqt.backtestReport",
      schemaVersion: 1,
      runId: "run-package-verify",
      generatedAt: "2026-06-05T10:00:00+00:00",
      format: "text/markdown",
      fileName: "run-package-verify-backtest-report.md",
      contentSha256: { algorithm: "sha256", hash: "a".repeat(64) },
      contentMarkdown: "# Backtest report",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyRevision: "rev-package-verify",
      executionMode: "paper_only",
      dataRows: 240,
      runComparisonRows: 3,
      signature: {
        eventId: "backtest-report-package-verify",
        status: "signed",
        algorithm: "hmac-sha256",
        chainId: "audit-chain-local",
        keyId: "local-audit-key",
        signedAt: "2026-06-05T10:00:00+00:00",
        signer: "Local Audit Key",
        value: "a".repeat(64)
      },
      boundary: "historical audited evidence only; no investment advice"
    };
    const verifiedEvent: AuditEventRecord = {
      schemaVersion: 1,
      eventId: "backtest-report-package-verify",
      eventType: "backtest_report",
      runId: "run-package-verify",
      createdAt: "2026-06-05T10:00:00+00:00",
      stage: "generated",
      source: "package",
      summary: "Backtest package report signature verified",
      detail: "run-package-verify-backtest-report.md · sha256 aaaaaaaa",
      metadata: {
        artifactKind: "aiqt.backtestReport",
        contentSha256: "a".repeat(64),
        contentSha256Algorithm: "sha256",
        fileName: "run-package-verify-backtest-report.md",
        signature: { ...report.signature, status: "verified", verifiedAt: "2026-06-05T10:01:00+00:00" }
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];

    const result = await verifyResearchRunExportReportSignature("http://127.0.0.1:8765", report, async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          event: verifiedEvent,
          signature: verifiedEvent.metadata.signature,
          verification: { status: "verified", reason: "signature_verified" }
        })
      };
    });

    expect(buildAuditReportVerifyPackageUrl("http://127.0.0.1:8765")).toBe(
      "http://127.0.0.1:8765/api/audit/reports/verify-package"
    );
    expect(calls.map((call) => call.url)).toEqual(["http://127.0.0.1:8765/api/audit/reports/verify-package"]);
    expect(calls[0]?.init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ report });
    expect(result.source).toBe("core");
    expect(result.event?.eventType).toBe("backtest_report");
    expect(result.signature?.status).toBe("verified");
    expect(result.verification).toEqual({ status: "verified", reason: "signature_verified" });

    const exportPackage = {
      kind: "aiqt.researchRun.export" as const,
      packageVersion: 1,
      exportedAt: "2026-06-05T10:00:00+00:00",
      manifest: {
        runId: "run-package-verify",
        createdAt: "2026-06-05T10:00:00+00:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "1d" as const,
        strategyRevision: "rev-package-verify",
        dataHash: "hash-package-verify",
        dataRows: 240,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: { bars: 240, trades: 12, equityPoints: 240, decisions: 1, aiRisks: 0 }
      },
      researchRun: {
        runId: "run-package-verify",
        createdAt: "2026-06-05T10:00:00+00:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "1d" as const,
        strategyName: "Package verify",
        strategyRevision: "rev-package-verify",
        dataRows: 240,
        metrics: {},
        decisions: [],
        executionMode: "paper_only",
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 240,
          start: "2026-06-05T10:00:00+00:00",
          end: "2026-06-05T10:00:00+00:00",
          hash: "hash-package-verify",
          bars: []
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: []
      },
      backtestReport: report
    };

    const verifiedPackage = await withVerifiedResearchRunExportPackageReportSignatures(
      "http://127.0.0.1:8765",
      exportPackage,
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          event: verifiedEvent,
          signature: verifiedEvent.metadata.signature,
          verification: { status: "verified", reason: "signature_verified" }
        })
      })
    );

    expect(verifiedPackage.backtestReport?.signature).toMatchObject({
      importVerificationReason: "signature_verified",
      importVerificationSource: "local-core",
      importVerificationStatus: "verified",
      importVerifiedAt: "2026-06-05T10:01:00+00:00",
      status: "verified"
    });
  });

  test("returns fallback when AI review run history payload is malformed", async () => {
    const result = await loadResearchRunAiReviews("http://127.0.0.1:8765", "run-ai-save", async () => ({
      ok: true,
      status: 200,
      json: async () => ({ aiReviews: [{ runId: "run-ai-save" }] })
    }));

    expect(result.source).toBe("fallback");
    expect(result.aiReviews).toEqual([]);
    expect(result.error).toBe("Invalid AI review run history contract");
  });

  test("returns fallback when AI review evidence anchors are malformed", async () => {
    const result = await loadResearchRunAiReviews("http://127.0.0.1:8765", "run-ai-save", async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        aiReviews: [
          {
            aiReviewId: "ai-review:run-ai-save:rev-ai-save",
            runId: "run-ai-save",
            createdAt: "2026-06-02T08:00:00+00:00",
            record: {
              schemaVersion: 1,
              recordType: "aiqt.aiReviewRun",
              aiReviewId: "ai-review:run-ai-save:rev-ai-save",
              runId: "run-ai-save",
              createdAt: "2026-06-02T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyRevision: "rev-ai-save",
              executionMode: "paper_only",
              status: "ready",
              summary: {
                citationCount: 1,
                roundCount: 1,
                decisionCount: 1,
                parameterScanBound: false,
                liveExecutionBlocked: true
              },
              dossier: {
                status: "ready",
                headline: "AI review bound to run-ai-save",
                summary: "Evidence only.",
                citations: []
              },
              citations: [],
              rounds: [],
              decisionLog: [],
              evidenceAnchors: [{ id: "run:run-ai-save", type: "unknown", label: "Bad", reference: "run-ai-save" }],
              boundary: "Evidence explanation only; no buy/sell instructions or guaranteed returns."
            }
          }
        ]
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.aiReviews).toEqual([]);
    expect(result.error).toBe("Invalid AI review run history contract");
  });

  test("loads and saves a research note for the selected context", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: init?.method === "POST" ? 201 : 200,
        json: async () => ({
          note: {
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            body: "关注银行板块相对强度。",
            updatedAt: "2026-05-29T08:00:00+00:00"
          }
        })
      };
    };

    const loaded = await loadResearchNote(
      "http://127.0.0.1:8765/",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      fetcher
    );
    const saved = await saveResearchNote(
      "http://127.0.0.1:8765/",
      {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        body: "关注银行板块相对强度。"
      },
      fetcher
    );

    expect(loaded.note?.body).toBe("关注银行板块相对强度。");
    expect(saved.note?.updatedAt).toBe("2026-05-29T08:00:00+00:00");
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/research/notes?market=ashare&symbol=600000&timeframe=1d");
    expect(calls[1]).toMatchObject({
      url: "http://127.0.0.1:8765/api/research/notes",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }
    });
    expect(JSON.parse(String(calls[1].init?.body))).toMatchObject({
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      body: "关注银行板块相对强度。"
    });
  });

  test("saves the current strategy snapshot to the strategy library", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await saveStrategySnapshot(
      "http://127.0.0.1:8765",
      {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        auditRunId: "run-strategy-api",
        strategy: {
          name: "API saved SMA plan",
          entry: "Close > SMA8",
          exit: "Close < SMA21",
          position: "40% cap per instrument",
          risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
        }
      },
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          status: 201,
          json: async () => ({
            strategy: {
              strategyId: "strategy-rev123",
              createdAt: "2026-05-29T08:00:00+00:00",
              name: "API saved SMA plan",
              revision: "rev123",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              version: 1,
              status: "audited",
              auditRunId: "run-strategy-api",
              strategySnapshot: {
                name: "API saved SMA plan",
                entry: "Close > SMA8",
                exit: "Close < SMA21",
                position: "40% cap per instrument",
                risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
              },
              strategyConfig: {
                name: "API saved SMA plan",
                revision: "rev123",
                market: "ashare",
                symbols: ["600000"],
                timeframe: "1d",
                version: 1,
                entryConditions: [{ kind: "close_above_sma", params: { window: 8 } }],
                exitConditions: [{ kind: "close_below_sma", params: { window: 21 } }],
                risk: {
                  positionPct: 0.4,
                  stopLossPct: 0.06,
                  takeProfitPct: 0.12,
                  maxDrawdownPct: 0.09
                }
              }
            }
          })
        };
      }
    );

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/strategies");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(calls[0]?.init?.body)).strategy.entry).toBe("Close > SMA8");
    expect(result.source).toBe("core");
    expect(result.strategy?.revision).toBe("rev123");
    expect(result.strategy?.status).toBe("audited");
    expect(result.strategy?.strategyConfig.risk.positionPct).toBe(0.4);
  });

  test("loads strategy library versions for the selected instrument", async () => {
    const calls: string[] = [];
    const result = await loadStrategyLibrary(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", limit: 5 },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            strategies: [
              {
                strategyId: "strategy-rev123",
                createdAt: "2026-05-29T08:00:00+00:00",
                name: "Saved SMA plan",
                revision: "rev123",
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                version: 1,
                status: "draft",
                auditRunId: null,
                strategySnapshot: {
                  name: "Saved SMA plan",
                  entry: "Close > SMA8",
                  exit: "Close < SMA21",
                  position: "40% cap per instrument",
                  risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
                },
                strategyConfig: {
                  name: "Saved SMA plan",
                  revision: "rev123",
                  market: "ashare",
                  symbols: ["600000"],
                  timeframe: "1d",
                  version: 1,
                  entryConditions: [{ kind: "close_above_sma", params: { window: 8 } }],
                  exitConditions: [{ kind: "close_below_sma", params: { window: 21 } }],
                  risk: {
                    positionPct: 0.4,
                    stopLossPct: 0.06,
                    takeProfitPct: 0.12,
                    maxDrawdownPct: 0.09
                  }
                }
              }
            ]
          })
        };
      }
    );

    expect(calls).toEqual(["http://127.0.0.1:8765/api/strategies?market=ashare&symbol=600000&limit=5"]);
    expect(result.source).toBe("core");
    expect(result.strategies).toHaveLength(1);
    expect(result.strategies[0]?.strategySnapshot.entry).toBe("Close > SMA8");
  });

  test("loads the latest paper execution for an audited research run", async () => {
    const calls: string[] = [];
    const result = await loadLatestResearchRunPaperExecution("http://127.0.0.1:8765", "run-new", async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          executions: [
            {
              executionId: "paper-latest",
              runId: "run-new",
              createdAt: "2026-05-26T08:20:00+00:00",
              mode: "paper_only",
              account: { cash: 80680, positions: { "600000": 2100 }, equity: 100000 },
              orders: [
                {
                  orderId: "order-latest",
                  symbol: "600000",
                  side: "buy",
                  quantity: 2100,
                  price: 9.2,
                  status: "filled",
                  reason: "filled_immediately",
                  timestamp: "2026-05-26T08:20:00+00:00"
                }
              ],
              gates: []
            },
            {
              executionId: "paper-older",
              runId: "run-new",
              createdAt: "2026-05-26T08:10:00+00:00",
              mode: "paper_only",
              account: { cash: 90000, positions: {}, equity: 90000 },
              orders: [],
              gates: []
            }
          ]
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-new/paper-executions"]);
    expect(result.source).toBe("core");
    expect(result.execution?.executionId).toBe("paper-latest");
    expect(result.execution?.orders[0]?.orderId).toBe("order-latest");
  });

  test("returns core without execution when a run has no paper execution history", async () => {
    const result = await loadLatestResearchRunPaperExecution("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      status: 200,
      json: async () => ({ executions: [] })
    }));

    expect(result.source).toBe("core");
    expect(result.execution).toBeUndefined();
  });

  test("returns fallback when paper execution payload is malformed", async () => {
    const result = await submitResearchRunPaperExecution("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      status: 201,
      json: async () => ({ execution: { runId: "run-new", orders: [] } })
    }));

    expect(result.source).toBe("fallback");
    expect(result.execution).toBeUndefined();
    expect(result.error).toBe("Invalid paper execution contract");
  });

  test("surfaces core paper execution gate rejections without treating them as offline fallback", async () => {
    const result = await submitResearchRunPaperExecution("http://127.0.0.1:8765", "run-risk", async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        error: "invalid_paper_execution",
        detail: "paper_execution_strategy_risk_incomplete"
      })
    }));

    expect(result.source).toBe("core");
    expect(result.execution).toBeUndefined();
    expect(result.error).toBe("paper_execution_strategy_risk_incomplete");
  });

  test("returns fallback when the research run detail payload is invalid", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({ run: { runId: "run-new" } })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("returns fallback when research run strategy config is malformed", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        run: {
          runId: "run-new",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "SMA trend demo",
          strategyRevision: "rev123",
          dataRows: 120,
          metrics: { total_return_pct: 3.4, trade_count: 8 },
          decisions: [],
          executionMode: "paper_only",
          strategyConfig: {
            name: "SMA trend demo",
            revision: "rev123",
            market: "ashare",
            symbols: ["600000"],
            timeframe: "1d",
            version: 1,
            entryConditions: [{ kind: "close_above_sma", params: "window=20" }],
            exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
            risk: { positionPct: 0.8 }
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("returns fallback when research run data quality is malformed", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        run: {
          runId: "run-new",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "SMA trend demo",
          strategyRevision: "rev123",
          dataRows: 120,
          metrics: { total_return_pct: 3.4, trade_count: 8 },
          decisions: [],
          executionMode: "paper_only",
          dataQuality: { source: "tencent", isComplete: "yes", warnings: [], rows: 120 }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("returns fallback when research run AI report is malformed", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        run: {
          runId: "run-new",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "SMA trend demo",
          strategyRevision: "rev123",
          dataRows: 120,
          metrics: { total_return_pct: 3.4, trade_count: 8 },
          decisions: [],
          executionMode: "paper_only",
          aiReport: {
            summary: "Malformed research summary",
            risks: "risk should be a list",
            improvements: [],
            disclaimer: "No investment advice"
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("returns fallback when research run data snapshot is malformed", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        run: {
          runId: "run-new",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "SMA trend demo",
          strategyRevision: "rev123",
          dataRows: 120,
          metrics: { total_return_pct: 3.4, trade_count: 8 },
          decisions: [],
          executionMode: "paper_only",
          dataSnapshot: {
            source: "tencent",
            isComplete: true,
            warnings: [],
            rows: 1,
            start: "2026-05-26T08:00:00+00:00",
            end: "2026-05-26T08:00:00+00:00",
            hash: "snapshot-bad",
            bars: [{ timestamp: "2026-05-26T08:00:00+00:00", close: 9.2 }]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("builds chart klines from an audited research run data snapshot", () => {
    const klines = marketKlinesFromResearchRunAudit({
      runId: "run-snapshot",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev123",
      dataRows: 2,
      metrics: { total_return_pct: 3.4, trade_count: 8 },
      decisions: [],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-26T08:00:00+00:00",
        end: "2026-05-27T08:00:00+00:00",
        hash: "snapshot-chart",
        bars: [
          {
            timestamp: "2026-05-26T08:00:00+00:00",
            timestampMs: 1779782400000,
            open: 9.1,
            high: 9.3,
            low: 9,
            close: 9.2,
            volume: 1200000
          },
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            timestampMs: 1779868800000,
            open: 9.2,
            high: 9.4,
            low: 9.1,
            close: 9.3,
            volume: 1300000
          }
        ]
      }
    });

    expect(klines).toEqual({
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      source: "core",
      quality: { source: "tencent", isComplete: true, warnings: [], rows: 2 },
      bars: [
        {
          timestamp: "2026-05-26T08:00:00+00:00",
          timestampMs: 1779782400000,
          open: 9.1,
          high: 9.3,
          low: 9,
          close: 9.2,
          volume: 1200000
        },
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          timestampMs: 1779868800000,
          open: 9.2,
          high: 9.4,
          low: 9.1,
          close: 9.3,
          volume: 1300000
        }
      ]
    });
  });

  test("loads market klines from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadMarketKlines(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d", limit: 2 },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => ({
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            quality: { source: "tencent", isComplete: true, warnings: [], rows: 2 },
            bars: [
              {
                timestamp: "2026-05-22T00:00:00+08:00",
                timestampMs: 1779379200000,
                open: 9,
                high: 9.12,
                low: 8.98,
                close: 9.08,
                volume: 100000
              },
              {
                timestamp: "2026-05-25T00:00:00+08:00",
                timestampMs: 1779638400000,
                open: 9.1,
                high: 9.32,
                low: 9.09,
                close: 9.27,
                volume: 120000
              }
            ]
          })
        };
      }
    );

    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/market/klines?market=ashare&symbol=600000&timeframe=1d&limit=2"
    ]);
    expect(result.source).toBe("core");
    expect(result.quality.source).toBe("tencent");
    expect(result.bars.at(-1)?.close).toBe(9.27);
  });

  test("loads historical market klines with the requested end boundary", async () => {
    const calls: string[] = [];
    const result = await loadMarketKlines(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "60m", limit: 500, end: "2026-05-26T09:45:00.000Z" },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => ({
            market: "ashare",
            symbol: "600000",
            timeframe: "60m",
            quality: { source: "demo-fallback", isComplete: false, warnings: [], rows: 1 },
            bars: [
              {
                timestamp: "2026-05-26T09:00:00+08:00",
                timestampMs: 1779738000000,
                open: 9.1,
                high: 9.2,
                low: 9.0,
                close: 9.16,
                volume: 3200
              }
            ]
          })
        };
      }
    );

    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/market/klines?market=ashare&symbol=600000&timeframe=60m&limit=500&end=2026-05-26T09%3A45%3A00.000Z"
    ]);
    expect(result.source).toBe("core");
    expect(result.bars[0].timestamp).toBe("2026-05-26T09:00:00+08:00");
  });

  test("merges historical market klines before existing bars without duplicates", () => {
    const current = {
      market: "ashare" as const,
      symbol: "600000",
      timeframe: "60m" as const,
      source: "core" as const,
      quality: { source: "demo-fallback", isComplete: false, warnings: ["current"], rows: 2 },
      bars: [
        {
          timestamp: "2026-05-26T10:00:00+08:00",
          timestampMs: 1779746400000,
          open: 9.1,
          high: 9.3,
          low: 9.0,
          close: 9.2,
          volume: 1000
        },
        {
          timestamp: "2026-05-26T11:00:00+08:00",
          timestampMs: 1779750000000,
          open: 9.2,
          high: 9.4,
          low: 9.1,
          close: 9.3,
          volume: 1200
        }
      ]
    };
    const incoming = {
      ...current,
      quality: { source: "demo-fallback", isComplete: false, warnings: ["older"], rows: 2 },
      bars: [
        {
          timestamp: "2026-05-26T09:00:00+08:00",
          timestampMs: 1779742800000,
          open: 9.0,
          high: 9.2,
          low: 8.9,
          close: 9.1,
          volume: 900
        },
        current.bars[0]
      ]
    };

    const merged = mergeMarketKlines(current, incoming);

    expect(merged.bars.map((bar) => bar.timestampMs)).toEqual([1779742800000, 1779746400000, 1779750000000]);
    expect(merged.quality.rows).toBe(3);
    expect(merged.quality.warnings).toEqual(["current", "older"]);
  });

  test("loads market symbol search suggestions from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadMarketSearch(
      "http://127.0.0.1:8765",
      { market: "ashare", query: "600", limit: 2, timeframe: "1d" },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => ({
            market: "ashare",
            query: "600",
            timeframe: "1d",
            results: [
              {
                market: "ashare",
                symbol: "600000",
                name: "浦发银行",
                source: "eastmoney",
                exchange: "沪A",
                pinyin: "PFYH",
                cache: {
                  freshness: "fresh",
                  rowCount: 240,
                  ageHours: 12,
                  startTimestamp: "2026-05-01T00:00:00+00:00",
                  endTimestamp: "2026-06-09T00:00:00+00:00"
                }
              }
            ]
          })
        };
      }
    );

    expect(calls).toEqual(["http://127.0.0.1:8765/api/market/search?market=ashare&query=600&limit=2&timeframe=1d"]);
    expect(result.source).toBe("core");
    expect(result.timeframe).toBe("1d");
    expect(result.results[0].name).toBe("浦发银行");
    expect(result.results[0].cache).toMatchObject({ freshness: "fresh", rowCount: 240, ageHours: 12 });
  });

  test("returns an empty run history when the Python core is unavailable", async () => {
    const result = await loadResearchRunHistory("http://127.0.0.1:8765", 5, async () => {
      throw new Error("offline");
    });

    expect(result.source).toBe("fallback");
    expect(result.runs).toEqual([]);
    expect(result.error).toBe("offline");
  });
});
