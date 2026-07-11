import {
  buildApiUrl,
  coreErrorDetail,
  isPortfolioBacktestRun,
  isPortfolioPaperOrderApproval,
  isPortfolioPaperOrderBatch,
  isPortfolioPaperOrderReplay,
  isPortfolioPaperOrderSimulation,
  isPortfolioPaperOrderStateHistory,
  type PortfolioBacktestLegRequest,
  type PortfolioBacktestRun,
  type PortfolioPaperOrderApproval,
  type PortfolioPaperOrderBatch,
  type PortfolioPaperOrderReplay,
  type PortfolioPaperOrderSimulation,
  type PortfolioPaperOrderStateHistory,
  type WorkspaceFetcher,
  type WorkspaceSource
} from "./terminal-api";

export interface Stage4PortfolioWorkflowRequest {
  baseRunId: string;
  name: string;
  initialCash: number;
  legs: PortfolioBacktestLegRequest[];
  riskTemplate: Stage4PortfolioRiskTemplate;
  batchId: string;
  operator: string;
}

export interface Stage4PortfolioRiskTemplate {
  minCashAfter: number;
  maxSymbolNotional: number;
  maxBatchNotional: number;
}

export interface Stage4PortfolioWorkflow {
  kind: "aiqt.stage4PortfolioWorkflow";
  schemaVersion: 1;
  workflowId: string;
  generatedAt: string;
  baseRunId: string;
  portfolioRequest: {
    name: string;
    initialCash: number;
    legs: Array<PortfolioBacktestLegRequest & {
      symbol: string;
      market: PortfolioBacktestRun["market"];
      timeframe: PortfolioBacktestRun["timeframe"];
    }>;
  };
  portfolio: PortfolioBacktestRun;
  riskTemplate: Stage4PortfolioRiskTemplate;
  batch: PortfolioPaperOrderBatch;
  approvals: PortfolioPaperOrderApproval[];
  simulations: PortfolioPaperOrderSimulation[];
  stateHistory: PortfolioPaperOrderStateHistory;
  replay: PortfolioPaperOrderReplay;
  paperOnly: true;
  liveTradingAllowed: false;
  orderSubmissionEnabled: false;
  routeExecuted: false;
  liveBlockedBoundary: true;
  workflowHash: string;
}

export interface Stage4PortfolioWorkflowRecordResult {
  workflow?: Stage4PortfolioWorkflow;
  source: WorkspaceSource;
  error?: string;
}

export interface Stage4PortfolioWorkflowHistoryResult {
  workflows: Stage4PortfolioWorkflow[];
  pagination?: { limit: number; total: number };
  source: WorkspaceSource;
  error?: string;
}

const WORKFLOW_KEYS = [
  "kind", "schemaVersion", "workflowId", "generatedAt", "baseRunId", "portfolioRequest", "portfolio",
  "riskTemplate", "batch", "approvals", "simulations", "stateHistory", "replay", "paperOnly",
  "liveTradingAllowed", "orderSubmissionEnabled", "routeExecuted", "liveBlockedBoundary", "workflowHash"
] as const;

export function buildStage4PortfolioWorkflowsUrl(baseUrl: string, baseRunId?: string, limit = 20): string {
  return buildApiUrl(baseUrl, "/api/portfolio/workflows", baseRunId === undefined ? undefined : (url) => {
    url.searchParams.set("baseRunId", baseRunId);
    url.searchParams.set("limit", String(limit));
  });
}

export function isStage4PortfolioWorkflow(value: unknown): value is Stage4PortfolioWorkflow {
  if (!isRecord(value) || !hasExactKeys(value, WORKFLOW_KEYS)) return false;
  const workflow = value as unknown as Stage4PortfolioWorkflow;
  if (
    workflow.kind !== "aiqt.stage4PortfolioWorkflow" || workflow.schemaVersion !== 1 ||
    !nonempty(workflow.workflowId) || !zonedDate(workflow.generatedAt) || !nonempty(workflow.baseRunId) ||
    workflow.paperOnly !== true || workflow.liveTradingAllowed !== false || workflow.orderSubmissionEnabled !== false ||
    workflow.routeExecuted !== false || workflow.liveBlockedBoundary !== true ||
    !/^[0-9a-f]{64}$/i.test(workflow.workflowHash) ||
    !isRecord(workflow.portfolioRequest) || !nonempty(workflow.portfolioRequest.name) ||
    !positive(workflow.portfolioRequest.initialCash) || !Array.isArray(workflow.portfolioRequest.legs) ||
    workflow.portfolioRequest.legs.length < 2 || !isPortfolioBacktestRun(workflow.portfolio) ||
    !isRiskTemplate(workflow.riskTemplate) || !isPortfolioPaperOrderBatch(workflow.batch) ||
    !Array.isArray(workflow.approvals) || !workflow.approvals.every(isPortfolioPaperOrderApproval) ||
    !Array.isArray(workflow.simulations) || !workflow.simulations.every(isPortfolioPaperOrderSimulation) ||
    !isPortfolioPaperOrderStateHistory(workflow.stateHistory) || !isPortfolioPaperOrderReplay(workflow.replay) ||
    !Array.isArray(workflow.portfolio.preTradeRiskChecks) || workflow.portfolio.preTradeRiskChecks.length === 0
  ) return false;

  const legs = workflow.portfolioRequest.legs;
  if (!legs.every((leg) => isRecord(leg) && hasExactKeys(leg, ["runId", "symbol", "market", "timeframe", "targetWeight"]) &&
    nonempty(leg.runId) && nonempty(leg.symbol) && leg.market === workflow.portfolio.market &&
    leg.timeframe === workflow.portfolio.timeframe && positive(leg.targetWeight))) return false;
  const totalWeight = legs.reduce((sum, leg) => sum + leg.targetWeight, 0);
  if (totalWeight > 1 || Math.abs(workflow.portfolio.cashWeight - (1 - totalWeight)) > 1e-9 ||
    workflow.portfolio.legs.length !== legs.length || !legs.some((leg) => leg.runId === workflow.baseRunId) ||
    !workflow.portfolio.legs.every((leg, index) => leg.symbol === legs[index].symbol && leg.targetWeight === legs[index].targetWeight)) return false;

  const orderIds = workflow.batch.orders.map((order) => order.orderId);
  if (![workflow.batch, ...workflow.approvals, ...workflow.simulations, workflow.stateHistory, workflow.replay].every(safeDeclarations) ||
    workflow.batch.baseRunId !== workflow.baseRunId || !orderIds.length || new Set(orderIds).size !== orderIds.length ||
    !boundRows(workflow.approvals, orderIds, workflow.baseRunId, workflow.batch.batchId, (row) => row.approved === true) ||
    !boundRows(workflow.simulations, orderIds, workflow.baseRunId, workflow.batch.batchId,
      (row) => row.orderState === "filled" && row.fillStatus === "filled" && row.paperOnly === true && row.liveExecutionBlocked === true)) return false;

  const history = workflow.stateHistory;
  const replay = workflow.replay;
  return history.baseRunId === workflow.baseRunId && history.batchId === workflow.batch.batchId &&
    history.orders.map((row) => row.orderId).join("\0") === orderIds.join("\0") &&
    integerEquals(history.summary.orderCount, orderIds.length) && integerEquals(history.summary.filledOrders, workflow.simulations.length) &&
    integerEquals(history.summary.liveBlockedEvents, workflow.simulations.length) &&
    replay.baseRunId === workflow.baseRunId && replay.orders.map((row) => row.orderId).join("\0") === orderIds.join("\0") &&
    integerEquals(replay.summary.filledOrders, workflow.simulations.length) &&
    integerEquals(replay.summary.positionCount, replay.positions.length) && Array.isArray(replay.summary.warnings);
}

export async function recordStage4PortfolioWorkflow(
  baseUrl: string,
  request: Stage4PortfolioWorkflowRequest,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<Stage4PortfolioWorkflowRecordResult> {
  try {
    const payload = await requestPayload(buildStage4PortfolioWorkflowsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseRunId: request.baseRunId, name: request.name, initialCash: request.initialCash, legs: request.legs,
        riskTemplate: request.riskTemplate, batchId: request.batchId, operator: request.operator
      })
    }, fetcher);
    if (!isRecord(payload) || !isStage4PortfolioWorkflow(payload.workflow)) {
      throw new Error("Invalid Stage 4 portfolio workflow contract");
    }
    return { workflow: payload.workflow, source: "core" };
  } catch (error) {
    return { source: "fallback", error: error instanceof Error ? error.message : "Unknown Stage 4 portfolio workflow error" };
  }
}

export async function loadStage4PortfolioWorkflows(
  baseUrl: string,
  baseRunId: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init),
  limit = 20
): Promise<Stage4PortfolioWorkflowHistoryResult> {
  try {
    const payload = await requestPayload(buildStage4PortfolioWorkflowsUrl(baseUrl, baseRunId, limit), undefined, fetcher);
    if (!isRecord(payload) || !Array.isArray(payload.workflows) || !payload.workflows.every(isStage4PortfolioWorkflow) ||
      !isPagination(payload.pagination) || payload.pagination.limit !== limit || payload.pagination.total < payload.workflows.length) {
      throw new Error("Invalid Stage 4 portfolio workflow history contract");
    }
    return { workflows: payload.workflows, pagination: payload.pagination, source: "core" };
  } catch (error) {
    return { workflows: [], source: "fallback", error: error instanceof Error ? error.message : "Unknown Stage 4 portfolio workflow history error" };
  }
}

async function requestPayload(url: string, init: RequestInit | undefined, fetcher: WorkspaceFetcher): Promise<unknown> {
  const response = await fetcher(url, init);
  const payload = await response.json();
  if (!response.ok) throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
  return payload;
}

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: object, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function positive(value: unknown): value is number {
  return finite(value) && value > 0;
}

function zonedDate(value: unknown): value is string {
  return nonempty(value) && !Number.isNaN(Date.parse(value)) && /(?:Z|[+-]\d\d:\d\d)$/.test(value);
}

function isRiskTemplate(value: unknown): value is Stage4PortfolioRiskTemplate {
  return isRecord(value) && hasExactKeys(value, ["minCashAfter", "maxSymbolNotional", "maxBatchNotional"]) &&
    finite(value.minCashAfter) && value.minCashAfter >= 0 && positive(value.maxSymbolNotional) && positive(value.maxBatchNotional);
}

function boundRows<T extends { orderId: string; baseRunId: string; batchId: string }>(
  rows: T[], orderIds: string[], baseRunId: string, batchId: string, extra: (row: T) => boolean
): boolean {
  return rows.length === orderIds.length && rows.every((row, index) => row.orderId === orderIds[index] &&
    row.baseRunId === baseRunId && row.batchId === batchId && extra(row));
}

function integerEquals(value: unknown, expected: number): boolean {
  return Number.isInteger(value) && value === expected;
}

function isPagination(value: unknown): value is { limit: number; total: number } {
  return isRecord(value) && hasExactKeys(value, ["limit", "total"]) && Number.isInteger(value.limit) &&
    value.limit >= 1 && value.limit <= 50 && Number.isInteger(value.total) && value.total >= 0;
}

function safeDeclarations(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return ([
    ["paperOnly", true],
    ["liveTradingAllowed", false],
    ["orderSubmissionEnabled", false],
    ["routeExecuted", false],
    ["liveBlockedBoundary", true]
  ] as const).every(([field, expected]) => !Object.hasOwn(value, field) || value[field] === expected);
}
