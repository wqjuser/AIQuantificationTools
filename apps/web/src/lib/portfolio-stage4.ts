import {
  buildApiUrl,
  coreErrorDetail,
  isPortfolioBacktestRun,
  isPortfolioPaperOrderApproval,
  isPortfolioPaperOrderBatch,
  isPortfolioPaperOrderReplay,
  isPortfolioPaperOrderSimulation,
  isPortfolioPaperOrderStateHistory,
  type GoldenPathOverallStatus,
  type GoldenPathStep,
  type PortfolioBacktestLegRequest,
  type PortfolioBacktestRun,
  type PortfolioPaperOrderApproval,
  type PortfolioPaperOrderBatch,
  type PortfolioPaperOrderLifecycleEvent,
  type PortfolioPaperOrderReplay,
  type PortfolioPaperOrderSimulation,
  type PortfolioPaperOrderStateHistory,
  type WorkspaceFetcher,
  type WorkspaceSource
} from "./terminal-api";
import type {
  PortfolioPaperOrderApprovalRow,
  PortfolioPaperOrderSimulationRouteRow
} from "./terminal-workbench";

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

export interface Stage4PortfolioGoldenPathInput {
  baseRunId: string;
  portfolio?: PortfolioBacktestRun | null;
  batches?: readonly PortfolioPaperOrderBatch[];
  lifecycle?: readonly PortfolioPaperOrderLifecycleEvent[];
  approvalRows?: readonly PortfolioPaperOrderApprovalRow[];
  routeRows?: readonly PortfolioPaperOrderSimulationRouteRow[];
  stateHistory?: PortfolioPaperOrderStateHistory | null;
  replay?: PortfolioPaperOrderReplay | null;
  workflow?: Stage4PortfolioWorkflow | null;
}

export interface Stage4PortfolioGoldenPath {
  status: GoldenPathOverallStatus;
  currentStepId: string;
  steps: GoldenPathStep[];
  primaryActionId: string | null;
  blockers: string[];
}

const GOLDEN_PATH_STEPS = [
  ["portfolio-build", "Portfolio build"],
  ["risk-review", "Risk review"],
  ["operator-approval", "Operator approval"],
  ["paper-simulation", "Paper simulation"],
  ["account-replay", "Account replay"]
] as const;

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

export function buildStage4PortfolioGoldenPath(input: Stage4PortfolioGoldenPathInput): Stage4PortfolioGoldenPath {
  const batches = input.batches ?? [];
  const lifecycle = input.lifecycle ?? [];
  const approvalRows = input.approvalRows ?? [];
  const routeRows = input.routeRows ?? [];
  const workflow = input.workflow;

  if (workflow?.baseRunId === input.baseRunId) return goldenPathResult(4, null, null, false, true);
  if (!input.portfolio) return goldenPathResult(0, "run-portfolio-backtest", "portfolio-missing");

  const batch = [...batches]
    .filter((row) => row.baseRunId === input.baseRunId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  if ((workflow && workflow.baseRunId !== input.baseRunId) || (!batch && batches.length)) {
    return goldenPathResult(0, "run-portfolio-backtest", "stale-base-run", true);
  }
  if (!batch) return goldenPathResult(1, "record-paper-order-batch", "paper-batch-missing");

  const orderIds = new Set(batch.orders.map((order) => order.orderId));
  const boundLifecycle = lifecycle.filter((row) =>
    row.baseRunId === input.baseRunId && row.batchId === batch.batchId && orderIds.has(row.orderId)
  );
  if (batch.orders.some((order) => order.riskStatus === "blocked") ||
      boundLifecycle.some((row) => row.state === "risk_rejected" || row.riskStatus === "blocked")) {
    return goldenPathResult(1, "review-portfolio-risk", "risk-rejected", true);
  }
  if (batch.orders.some((order) => order.riskStatus === "review") ||
      boundLifecycle.some((row) => row.state === "risk_review" || row.riskStatus === "review")) {
    return goldenPathResult(1, "review-portfolio-risk", "risk-review-required");
  }

  const hasMixedRows = [...lifecycle, ...approvalRows, ...routeRows].some(
    (row) => orderIds.has(row.orderId) && row.batchId !== batch.batchId
  );
  if (hasMixedRows) return goldenPathResult(2, "review-portfolio-orders", "mixed-batch", true);

  const boundApprovals = approvalRows.filter((row) =>
    row.baseRunId === input.baseRunId && row.batchId === batch.batchId && orderIds.has(row.orderId)
  );
  if (boundLifecycle.some((row) => row.state === "operator_rejected") ||
      boundApprovals.some((row) => row.state === "operator_rejected")) {
    return goldenPathResult(2, "review-portfolio-orders", "operator-rejected", true);
  }
  const approvedOrderIds = new Set(boundApprovals
    .filter((row) => row.state === "ready_for_simulation" || row.approvedBy !== null)
    .map((row) => row.orderId));
  if ([...orderIds].some((orderId) => !approvedOrderIds.has(orderId))) {
    return goldenPathResult(2, "review-portfolio-orders", "operator-approval-required");
  }

  const boundRoutes = routeRows.filter((row) => row.batchId === batch.batchId && orderIds.has(row.orderId));
  if (boundRoutes.some((row) => row.routeState === "blocked")) {
    return goldenPathResult(3, "review-route-risk", "route-risk-blocked", true);
  }
  const filledOrderIds = new Set(boundRoutes
    .filter((row) => row.routeState === "filled" && row.simulationId)
    .map((row) => row.orderId));
  if ([...orderIds].some((orderId) => !filledOrderIds.has(orderId))) {
    return goldenPathResult(3, "simulate-portfolio-batch", "paper-simulation-missing");
  }

  const historyMatches = input.stateHistory?.baseRunId === input.baseRunId &&
    input.stateHistory.batchId === batch.batchId &&
    hasExactOrderIds(input.stateHistory.orders, orderIds);
  const replayMatches = input.replay?.baseRunId === input.baseRunId &&
    input.replay.orders.every((row) => row.batchId === batch.batchId) &&
    hasExactOrderIds(input.replay.orders, orderIds);
  if (!historyMatches || !replayMatches) {
    return goldenPathResult(4, "refresh-account-replay", "account-replay-missing");
  }
  return goldenPathResult(4, "record-stage4-workflow", "authoritative-workflow-missing");
}

function hasExactOrderIds(rows: readonly { orderId: string }[], orderIds: ReadonlySet<string>): boolean {
  return rows.length === orderIds.size && new Set(rows.map((row) => row.orderId)).size === orderIds.size &&
    rows.every((row) => orderIds.has(row.orderId));
}

function goldenPathResult(
  currentIndex: number,
  actionId: string | null,
  blocker: string | null,
  blocked = false,
  complete = false
): Stage4PortfolioGoldenPath {
  const steps: GoldenPathStep[] = GOLDEN_PATH_STEPS.map(([id, label], index) => ({
    id,
    label,
    status: complete || index < currentIndex ? "passed" : index === currentIndex && blocked ? "blocked" : "review",
    passed: complete || index < currentIndex,
    detail: index === currentIndex && blocker ? blocker : complete || index < currentIndex ? "Complete" : "Pending",
    actionId: index === currentIndex ? actionId : null
  }));
  return {
    status: complete ? "ready" : blocked ? "blocked" : "review",
    currentStepId: GOLDEN_PATH_STEPS[currentIndex][0],
    steps,
    primaryActionId: actionId,
    blockers: blocker ? [blocker] : []
  };
}

export function isStage4PortfolioWorkflow(value: unknown): value is Stage4PortfolioWorkflow {
  if (!isRecord(value) || !hasExactKeys(value, WORKFLOW_KEYS)) return false;
  const workflow = value as unknown as Stage4PortfolioWorkflow;
  if (
    workflow.kind !== "aiqt.stage4PortfolioWorkflow" || workflow.schemaVersion !== 1 ||
    !nonempty(workflow.workflowId) || !zonedDate(workflow.generatedAt) || !nonempty(workflow.baseRunId) ||
    workflow.paperOnly !== true || workflow.liveTradingAllowed !== false || workflow.orderSubmissionEnabled !== false ||
    workflow.routeExecuted !== false || workflow.liveBlockedBoundary !== true ||
    !/^[0-9a-f]{64}$/.test(workflow.workflowHash) ||
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
        baseRunId: request.baseRunId,
        name: request.name,
        initialCash: request.initialCash,
        legs: request.legs.map(({ runId, targetWeight }) => ({ runId, targetWeight })),
        riskTemplate: {
          minCashAfter: request.riskTemplate.minCashAfter,
          maxSymbolNotional: request.riskTemplate.maxSymbolNotional,
          maxBatchNotional: request.riskTemplate.maxBatchNotional
        },
        batchId: request.batchId,
        operator: request.operator
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
  if (!response.ok) {
    let errorPayload: unknown;
    try {
      errorPayload = await response.json();
    } catch {
      // Empty and non-JSON errors intentionally fall back to the status-only message.
    }
    throw new Error(coreErrorDetail(errorPayload) ?? `HTTP ${response.status ?? "error"}`);
  }
  return response.json();
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
  if (!nonempty(value)) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, , offsetHour = "00", offsetMinute = "00"] = match;
  const y = Number(year), m = Number(month), d = Number(day);
  return y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= new Date(Date.UTC(y, m, 0)).getUTCDate() &&
    Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59 &&
    Number(offsetHour) <= 23 && Number(offsetMinute) <= 59;
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
