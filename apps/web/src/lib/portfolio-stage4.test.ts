import { describe, expect, test } from "vitest";
import {
  buildStage4PortfolioWorkflowsUrl,
  isStage4PortfolioWorkflow,
  loadStage4PortfolioWorkflows,
  recordStage4PortfolioWorkflow
} from "./portfolio-stage4";

const quality = { source: "fixture", isComplete: true, warnings: [], rows: 2 };

function workflow() {
  const order = (orderId: string, symbol: string, sourceRunId: string) => ({
    timestamp: "2026-07-11T08:00:00+00:00",
    eventType: "portfolio_paper_order" as const,
    orderId,
    symbol,
    sourceRunId,
    side: "buy" as const,
    notionalValue: 40_000,
    quantity: 100,
    status: "pending_review" as const,
    riskStatus: "passed" as const,
    reason: "Within paper limits."
  });
  const approval = (orderId: string) => ({
    approvalId: `approval-${orderId}`,
    baseRunId: "run-a",
    batchId: "batch-1",
    orderId,
    reviewedAt: "2026-07-11T08:05:00+00:00",
    approved: true,
    reviewer: "operator",
    reason: "Approved for paper simulation."
  });
  const simulation = (orderId: string, symbol: string, sourceRunId: string) => ({
    simulationId: `simulation-${orderId}`,
    baseRunId: "run-a",
    batchId: "batch-1",
    orderId,
    simulatedAt: "2026-07-11T08:10:00+00:00",
    mode: "portfolio_paper_order_simulation" as const,
    symbol,
    sourceRunId,
    side: "buy" as const,
    quantity: 100,
    fillPrice: 400,
    notionalValue: 40_000,
    orderState: "filled" as const,
    fillStatus: "filled" as const,
    reason: "Paper fill.",
    approvedBy: "operator",
    paperOnly: true,
    liveExecutionBlocked: true
  });
  const stateOrder = (orderId: string, symbol: string, sourceRunId: string) => ({
    batchId: "batch-1",
    baseRunId: "run-a",
    portfolioName: "Stage 4",
    orderId,
    symbol,
    sourceRunId,
    side: "buy" as const,
    quantity: 100,
    notionalValue: 40_000,
    originalStatus: "pending_review" as const,
    riskStatus: "passed" as const,
    currentState: "simulation_filled",
    currentStateLabel: "Filled",
    events: [],
    paperOnly: true,
    liveExecutionBlocked: true
  });
  const replayOrder = (orderId: string, symbol: string) => ({
    simulationId: `simulation-${orderId}`,
    batchId: "batch-1",
    orderId,
    simulatedAt: "2026-07-11T08:10:00+00:00",
    symbol,
    side: "buy" as const,
    quantity: 100,
    fillPrice: 400,
    notionalValue: 40_000,
    cashAfter: 20_000,
    positionAfter: 100,
    replayState: "applied" as const,
    paperOnly: true,
    liveExecutionBlocked: true
  });
  return {
    kind: "aiqt.stage4PortfolioWorkflow" as const,
    schemaVersion: 1 as const,
    workflowId: "stage4-workflow-1",
    generatedAt: "2026-07-11T08:15:00+00:00",
    baseRunId: "run-a",
    portfolioRequest: {
      name: "Stage 4",
      initialCash: 100_000,
      legs: [
        { runId: "run-a", symbol: "600000", market: "ashare", timeframe: "1d", targetWeight: 0.4 },
        { runId: "run-b", symbol: "000300", market: "ashare", timeframe: "1d", targetWeight: 0.4 }
      ]
    },
    portfolio: {
      name: "Stage 4",
      market: "ashare" as const,
      timeframe: "1d" as const,
      initialCash: 100_000,
      cashWeight: 0.2,
      metrics: {
        totalReturnPct: 1,
        annualReturnPct: 2,
        maxDrawdownPct: 3,
        winRatePct: 50,
        profitFactor: 1.2,
        tradeCount: 2
      },
      equityCurve: [{ timestamp: "2026-07-11T08:00:00+00:00", equity: 100_000 }],
      legs: [
        { symbol: "600000", targetWeight: 0.4, startingValue: 40_000, endingValue: 40_100, contributionValue: 100, contributionReturnPct: 0.25, maxDrawdownPct: 1, tradeCount: 1, dataQuality: quality },
        { symbol: "000300", targetWeight: 0.4, startingValue: 40_000, endingValue: 40_100, contributionValue: 100, contributionReturnPct: 0.25, maxDrawdownPct: 1, tradeCount: 1, dataQuality: quality }
      ],
      preTradeRiskChecks: [{
        timestamp: "2026-07-11T08:00:00+00:00",
        eventType: "pre_trade_risk_check" as const,
        scope: "portfolio" as const,
        symbol: null,
        sourceRunId: null,
        checkId: "portfolio_data_quality" as const,
        status: "passed" as const,
        value: 2,
        limit: 2,
        reason: "Complete."
      }],
      dataQuality: quality
    },
    riskTemplate: { minCashAfter: 10_000, maxSymbolNotional: 50_000, maxBatchNotional: 90_000 },
    batch: {
      batchId: "batch-1",
      baseRunId: "run-a",
      portfolioName: "Stage 4",
      createdAt: "2026-07-11T08:00:00+00:00",
      mode: "portfolio_paper_order_review" as const,
      source: "portfolio_backtest",
      summary: { totalOrders: 2, totalNotionalValue: 80_000, statusCounts: { pending_review: 2 }, riskStatusCounts: { passed: 2 } },
      orders: [order("order-a", "600000", "run-a"), order("order-b", "000300", "run-b")]
    },
    approvals: [approval("order-a"), approval("order-b")],
    simulations: [simulation("order-a", "600000", "run-a"), simulation("order-b", "000300", "run-b")],
    stateHistory: {
      schemaVersion: 1 as const,
      baseRunId: "run-a",
      batchId: "batch-1",
      portfolioName: "Stage 4",
      generatedAt: "2026-07-11T08:15:00+00:00",
      mode: "portfolio_paper_order_state_history" as const,
      summary: { orderCount: 2, eventCount: 6, approvedOrders: 2, rejectedOrders: 0, filledOrders: 2, liveBlockedEvents: 2, stateCounts: { simulation_filled: 2 } },
      orders: [stateOrder("order-a", "600000", "run-a"), stateOrder("order-b", "000300", "run-b")],
      paperOnly: true,
      liveExecutionBlocked: true
    },
    replay: {
      schemaVersion: 1 as const,
      baseRunId: "run-a",
      generatedAt: "2026-07-11T08:15:00+00:00",
      mode: "portfolio_paper_order_replay" as const,
      initialCash: 100_000,
      account: { cash: 20_000, equity: 100_000, positions: { "600000": 100, "000300": 100 } },
      positions: [
        { symbol: "600000", quantity: 100, avgCost: 400, lastPrice: 400, marketValue: 40_000, unrealizedPnl: 0 },
        { symbol: "000300", quantity: 100, avgCost: 400, lastPrice: 400, marketValue: 40_000, unrealizedPnl: 0 }
      ],
      orders: [replayOrder("order-a", "600000"), replayOrder("order-b", "000300")],
      summary: { filledOrders: 2, buyNotional: 80_000, sellNotional: 0, netNotional: 80_000, realizedPnl: 0, unrealizedPnl: 0, positionCount: 2, warnings: [] },
      paperOnly: true,
      liveExecutionBlocked: true
    },
    paperOnly: true as const,
    liveTradingAllowed: false as const,
    orderSubmissionEnabled: false as const,
    routeExecuted: false as const,
    liveBlockedBoundary: true as const,
    workflowHash: "a".repeat(64)
  };
}

describe("Stage 4 portfolio workflow contract", () => {
  test("accepts the exact nested paper-only snapshot and rejects unsafe or inconsistent variants", () => {
    expect(isStage4PortfolioWorkflow(workflow())).toBe(true);

    const mutations: Array<(value: any) => void> = [
      (value) => { value.extra = true; },
      (value) => { value.portfolioRequest.legs = value.portfolioRequest.legs.slice(0, 1); },
      (value) => { value.portfolio.preTradeRiskChecks = []; },
      (value) => { value.approvals[0].approved = false; },
      (value) => { value.approvals[0].liveTradingAllowed = true; },
      (value) => { value.simulations[0].liveExecutionBlocked = false; },
      (value) => { value.stateHistory.summary.filledOrders = 1; },
      (value) => { value.replay.summary.positionCount = 1; },
      (value) => { value.workflowHash = "a".repeat(63); },
      (value) => { value.workflowHash = "A".repeat(64); },
      (value) => { value.generatedAt = "2026-02-30T08:15:00+00:00"; },
      (value) => { value.paperOnly = false; },
      (value) => { value.liveTradingAllowed = true; },
      (value) => { value.orderSubmissionEnabled = true; },
      (value) => { value.routeExecuted = true; },
      (value) => { value.liveBlockedBoundary = false; }
    ];
    for (const mutate of mutations) {
      const value: any = structuredClone(workflow());
      mutate(value);
      expect(isStage4PortfolioWorkflow(value)).toBe(false);
    }
  });

  test("records the exact seven-field request and validates the response", async () => {
    const request: any = {
      baseRunId: "run-a",
      name: "Stage 4",
      initialCash: 100_000,
      legs: [{ runId: "run-a", targetWeight: 0.4, symbol: "must-not-send" }, { runId: "run-b", targetWeight: 0.4, liveTradingAllowed: true }],
      riskTemplate: { minCashAfter: 10_000, maxSymbolNotional: 50_000, maxBatchNotional: 90_000, routeExecuted: true },
      batchId: "batch-1",
      operator: "operator"
    };
    let captured: { url?: string; init?: RequestInit } = {};
    const result = await recordStage4PortfolioWorkflow("/", request, async (url, init) => {
      captured = { url, init };
      return { ok: true, status: 201, json: async () => ({ workflow: workflow(), auditEvent: {} }) };
    });

    expect(captured.url).toBe("/api/portfolio/workflows");
    expect(captured.init?.method).toBe("POST");
    expect(JSON.parse(String(captured.init?.body))).toEqual({
      baseRunId: "run-a",
      name: "Stage 4",
      initialCash: 100_000,
      legs: [{ runId: "run-a", targetWeight: 0.4 }, { runId: "run-b", targetWeight: 0.4 }],
      riskTemplate: { minCashAfter: 10_000, maxSymbolNotional: 50_000, maxBatchNotional: 90_000 },
      batchId: "batch-1",
      operator: "operator"
    });
    expect(result.workflow?.workflowId).toBe("stage4-workflow-1");
    expect(result.error).toBeUndefined();
  });

  test("encodes history query parameters and validates pagination", async () => {
    expect(buildStage4PortfolioWorkflowsUrl("/", "run /你好", 50)).toBe(
      "/api/portfolio/workflows?baseRunId=run+%2F%E4%BD%A0%E5%A5%BD&limit=50"
    );
    let requestedUrl = "";
    const result = await loadStage4PortfolioWorkflows("/", "run /你好", async (url) => {
      requestedUrl = url;
      return { ok: true, json: async () => ({ workflows: [workflow()], pagination: { limit: 20, total: 1 } }) };
    });

    expect(requestedUrl).toBe("/api/portfolio/workflows?baseRunId=run+%2F%E4%BD%A0%E5%A5%BD&limit=20");
    expect(result.pagination).toEqual({ limit: 20, total: 1 });
    expect(result.workflows).toHaveLength(1);
  });

  test("surfaces safe HTTP details and fails closed on malformed payloads", async () => {
    const http = await loadStage4PortfolioWorkflows("/", "run-a", async () => ({
      ok: false,
      status: 500,
      json: async () => ({ detail: "stored workflow is invalid", secret: "ignored" })
    }));
    const nonJson = await loadStage4PortfolioWorkflows("/", "run-a", async () => ({
      ok: false,
      status: 502,
      json: async () => { throw new SyntaxError("Unexpected end of JSON input"); }
    }));
    const malformed = await recordStage4PortfolioWorkflow("/", {
      baseRunId: "run-a",
      name: "Stage 4",
      initialCash: 100_000,
      legs: [{ runId: "run-a", targetWeight: 0.4 }, { runId: "run-b", targetWeight: 0.4 }],
      riskTemplate: { minCashAfter: 10_000, maxSymbolNotional: 50_000, maxBatchNotional: 90_000 },
      batchId: "batch-1",
      operator: "operator"
    }, async () => ({ ok: true, status: 201, json: async () => ({ workflow: { ...workflow(), routeExecuted: true } }) }));

    expect(http).toMatchObject({ workflows: [], source: "fallback", error: "stored workflow is invalid" });
    expect(nonJson).toMatchObject({ workflows: [], source: "fallback", error: "HTTP 502" });
    expect(malformed).toMatchObject({ source: "fallback", error: "Invalid Stage 4 portfolio workflow contract" });
    expect(malformed.workflow).toBeUndefined();
  });
});
