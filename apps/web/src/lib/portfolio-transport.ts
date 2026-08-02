import { isMarketKlineQuality, type MarketKlineQuality } from "./market-data-transport";
import {
  isAuditEventRecord,
  isMarket,
  isNumberRecord,
  isPaperExecutionAccount,
  isSecretFreeRecord,
  isTimeframe,
  type AuditEventRecord,
  type PaperExecutionAccount
} from "./terminal-api-contract";
import {
  buildApiUrl,
  coreErrorDetail,
  defaultFetcher,
  type WorkspaceFetcher
} from "./terminal-api-http";
import type { Market, Timeframe } from "./terminal-workbench";

type ResearchTimeframe = Timeframe;
type WorkspaceSource = "core" | "fallback";
export interface PortfolioBacktestLegRequest {
  runId: string;
  targetWeight: number;
}

export interface PortfolioBacktestRequest {
  name: string;
  initialCash: number;
  legs: PortfolioBacktestLegRequest[];
}

export interface PortfolioBacktestMetrics {
  totalReturnPct: number;
  annualReturnPct: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  tradeCount: number;
}

export interface PortfolioBacktestEquityPoint {
  timestamp: string;
  equity: number;
}

export interface PortfolioAllocationEvent {
  timestamp: string;
  eventType: "allocate" | "cash_buffer";
  symbol: string;
  sourceRunId: string | null;
  targetWeight: number;
  notionalValue: number;
  reason: string;
}

export interface PortfolioRebalanceEvent {
  timestamp: string;
  eventType: "rebalance_review";
  symbol: string;
  sourceRunId: string | null;
  targetWeight: number;
  endingWeight: number;
  currentValue: number;
  targetValue: number;
  deltaValue: number;
  driftPct: number;
  status: "within_band" | "review" | "blocked";
  reason: string;
}

export interface PortfolioTradeReviewEvent {
  timestamp: string;
  eventType: "trade_review";
  symbol: string;
  sourceRunId: string | null;
  side: "buy" | "sell" | "hold";
  notionalValue: number;
  targetWeight: number;
  endingWeight: number;
  status: "paper_review" | "blocked" | "no_action";
  reason: string;
}

export interface PortfolioPreTradeRiskCheck {
  timestamp: string;
  eventType: "pre_trade_risk_check";
  scope: "portfolio" | "trade";
  symbol: string | null;
  sourceRunId: string | null;
  checkId: "portfolio_data_quality" | "trade_review_status" | "trade_notional_limit";
  status: "passed" | "review" | "blocked";
  value: number;
  limit: number;
  reason: string;
}

export interface PortfolioPaperOrderEvent {
  timestamp: string;
  eventType: "portfolio_paper_order";
  orderId: string;
  symbol: string;
  sourceRunId: string | null;
  side: "buy" | "sell" | "hold";
  notionalValue: number;
  quantity: number;
  status: "pending_review" | "rejected" | "skipped";
  riskStatus: "passed" | "review" | "blocked";
  reason: string;
}

export interface PortfolioPaperOrderSummary {
  totalOrders: number;
  totalNotionalValue: number;
  statusCounts: Record<string, number>;
  riskStatusCounts: Record<string, number>;
}

export interface PortfolioPaperOrderBatch {
  batchId: string;
  baseRunId: string;
  portfolioName: string;
  createdAt: string;
  mode: "portfolio_paper_order_review";
  source: string;
  summary: PortfolioPaperOrderSummary;
  orders: PortfolioPaperOrderEvent[];
}

export interface PortfolioPaperOrderLifecycleEvent {
  batchId: string;
  baseRunId: string;
  portfolioName: string;
  orderId: string;
  symbol: string;
  sourceRunId: string | null;
  side: "buy" | "sell" | "hold";
  quantity: number;
  notionalValue: number;
  originalStatus: "pending_review" | "rejected" | "skipped";
  riskStatus: "passed" | "review" | "blocked";
  state:
    | "awaiting_operator_review"
    | "ready_for_simulation"
    | "risk_rejected"
    | "operator_rejected"
    | "risk_review"
    | "invalid_order"
    | "skipped";
  routable: boolean;
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
  approvedBy: string | null;
  reviewedAt: string | null;
  reason: string;
}

export interface PortfolioPaperOrderBatchRequest {
  baseRunId: string;
  portfolioName: string;
  orders: PortfolioPaperOrderEvent[];
  source?: string;
}

export interface PortfolioPaperOrderRecordResult {
  batch?: PortfolioPaperOrderBatch;
  lifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderHistoryResult {
  batches: PortfolioPaperOrderBatch[];
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderApproval {
  approvalId: string;
  baseRunId: string;
  batchId: string;
  orderId: string;
  reviewedAt: string;
  approved: boolean;
  reviewer: string;
  reason: string;
}

export interface PortfolioPaperOrderApprovalRequest {
  baseRunId: string;
  batchId: string;
  orderId: string;
  approved: boolean;
  reviewer: string;
  reason: string;
  reviewedAt?: string;
}

export interface PortfolioPaperOrderApprovalRecordResult {
  approval?: PortfolioPaperOrderApproval;
  existingApproval?: PortfolioPaperOrderApproval;
  existingSimulation?: PortfolioPaperOrderSimulation;
  approvals: PortfolioPaperOrderApproval[];
  lifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderApprovalHistoryResult {
  approvals: PortfolioPaperOrderApproval[];
  lifecycle: PortfolioPaperOrderLifecycleEvent[];
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderSimulation {
  simulationId: string;
  baseRunId: string;
  batchId: string;
  orderId: string;
  simulatedAt: string;
  mode: "portfolio_paper_order_simulation";
  symbol: string;
  sourceRunId: string | null;
  side: "buy" | "sell";
  quantity: number;
  fillPrice: number;
  notionalValue: number;
  orderState: "filled";
  fillStatus: "filled";
  reason: string;
  approvedBy: string | null;
  routeRisk?: PortfolioPaperOrderSimulationRouteRisk;
  adapterPaperExecutionId?: string;
  adapterManifestValidationId?: string;
  adapterPaperExecutionEvidence?: Record<string, unknown>;
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderSimulationRouteRisk {
  status?: "passed" | "blocked" | string;
  cashAfter?: number;
  blockedReasons?: string[];
  [key: string]: unknown;
}

export interface PortfolioPaperOrderAdapterEvidenceRequest {
  adapterPaperExecutionId?: string;
  adapterManifestValidationId?: string;
  adapterPaperExecutionEvidence?: Record<string, unknown>;
}

export interface PortfolioPaperOrderSimulationRequest {
  baseRunId: string;
  batchId: string;
  orderId: string;
  simulatedAt?: string;
  routeRisk?: {
    initialCash?: number;
    minCashAfter?: number;
    maxSymbolNotional?: number;
    maxBatchNotional?: number;
  };
  adapterPaperExecutionId?: string;
  adapterManifestValidationId?: string;
  adapterPaperExecutionEvidence?: Record<string, unknown>;
}

export interface PortfolioPaperOrderBatchSimulationRequest {
  baseRunId: string;
  batchId: string;
  orderIds?: string[];
  simulatedAt?: string;
  routeRisk?: {
    initialCash?: number;
    minCashAfter?: number;
    maxSymbolNotional?: number;
    maxBatchNotional?: number;
  };
  adapterPaperExecutionEvidenceByOrderId?: Record<string, PortfolioPaperOrderAdapterEvidenceRequest>;
}

export interface PortfolioPaperOrderBatchSimulationIssue {
  orderId: string;
  symbol?: string;
  side?: string;
  reason?: string;
  detail?: string;
}

export interface PortfolioPaperOrderBatchSimulation {
  schemaVersion: 1;
  mode: "portfolio_paper_order_batch_simulation";
  status: "filled" | "partial" | "blocked" | "skipped" | string;
  baseRunId: string;
  batchId: string;
  requestedCount: number;
  filledCount: number;
  blockedCount: number;
  skippedCount: number;
  filledOrderIds: string[];
  blockedOrders: PortfolioPaperOrderBatchSimulationIssue[];
  skippedOrders: PortfolioPaperOrderBatchSimulationIssue[];
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderSimulationRecordResult {
  simulation?: PortfolioPaperOrderSimulation;
  simulations: PortfolioPaperOrderSimulation[];
  lifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderBatchSimulationRecordResult {
  batchSimulation?: PortfolioPaperOrderBatchSimulation;
  simulations: PortfolioPaperOrderSimulation[];
  createdSimulations: PortfolioPaperOrderSimulation[];
  lifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvents: AuditEventRecord[];
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderSimulationHistoryResult {
  simulations: PortfolioPaperOrderSimulation[];
  lifecycle: PortfolioPaperOrderLifecycleEvent[];
  source: WorkspaceSource;
  error?: string;
}

export type PortfolioPaperOrderStateHistoryState =
  | "created"
  | "awaiting_operator_review"
  | "operator_approved"
  | "operator_rejected"
  | "ready_for_simulation"
  | "simulation_filled"
  | "simulation_recorded"
  | "live_blocked"
  | "risk_rejected"
  | "risk_review"
  | "invalid_order"
  | "skipped"
  | string;

export interface PortfolioPaperOrderStateHistoryEvent {
  eventId: string;
  batchId: string;
  baseRunId: string;
  orderId: string;
  timestamp: string;
  state: PortfolioPaperOrderStateHistoryState;
  label: string;
  actor: string;
  source: string;
  reason: string;
  metadata?: Record<string, unknown>;
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderStateHistoryOrder {
  batchId: string;
  baseRunId: string;
  portfolioName: string;
  orderId: string;
  symbol: string;
  sourceRunId: string | null;
  side: "buy" | "sell" | "hold";
  quantity: number;
  notionalValue: number;
  originalStatus: "pending_review" | "rejected" | "skipped";
  riskStatus: "passed" | "review" | "blocked";
  currentState: PortfolioPaperOrderStateHistoryState;
  currentStateLabel: string;
  events: PortfolioPaperOrderStateHistoryEvent[];
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderStateHistorySummary {
  orderCount: number;
  eventCount: number;
  approvedOrders: number;
  rejectedOrders: number;
  filledOrders: number;
  liveBlockedEvents: number;
  stateCounts: Record<string, number>;
}

export interface PortfolioPaperOrderStateHistory {
  schemaVersion: 1;
  baseRunId: string;
  batchId: string;
  portfolioName: string;
  generatedAt: string;
  mode: "portfolio_paper_order_state_history";
  summary: PortfolioPaperOrderStateHistorySummary;
  orders: PortfolioPaperOrderStateHistoryOrder[];
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderStateHistoryResult {
  stateHistory?: PortfolioPaperOrderStateHistory;
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderReplayPosition {
  symbol: string;
  quantity: number;
  avgCost: number;
  lastPrice: number;
  marketValue: number;
  unrealizedPnl: number;
}

export interface PortfolioPaperOrderReplayOrder {
  simulationId: string;
  batchId: string;
  orderId: string;
  simulatedAt: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  fillPrice: number;
  notionalValue: number;
  cashAfter: number;
  positionAfter: number;
  replayState: "applied" | "ignored";
  adapterPaperExecutionId?: string;
  adapterManifestValidationId?: string;
  adapterPaperExecutionEvidence?: Record<string, unknown>;
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderReplaySummary {
  filledOrders: number;
  buyNotional: number;
  sellNotional: number;
  netNotional: number;
  realizedPnl: number;
  unrealizedPnl: number;
  positionCount: number;
  warnings: string[];
}

export interface PortfolioPaperOrderReplay {
  schemaVersion: 1;
  baseRunId: string;
  generatedAt: string;
  mode: "portfolio_paper_order_replay";
  initialCash: number;
  account: PaperExecutionAccount;
  positions: PortfolioPaperOrderReplayPosition[];
  orders: PortfolioPaperOrderReplayOrder[];
  summary: PortfolioPaperOrderReplaySummary;
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderReplayResult {
  replay?: PortfolioPaperOrderReplay;
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioBacktestLeg {
  symbol: string;
  targetWeight: number;
  startingValue: number;
  endingValue: number;
  contributionValue: number;
  contributionReturnPct: number;
  maxDrawdownPct: number;
  tradeCount: number;
  dataQuality: MarketKlineQuality;
}

export interface PortfolioCorrelationPair {
  leftSymbol: string;
  rightSymbol: string;
  correlation: number;
}

export interface PortfolioCovarianceRiskContribution {
  symbol: string;
  sourceRunId: string | null;
  targetWeight: number;
  annualizedVolatilityPct: number;
  marginalContributionPct: number;
  contributionPct: number;
}

export interface PortfolioCovarianceRisk {
  method: "population_covariance";
  observations: number;
  periodVolatilityPct: number;
  annualizedVolatilityPct: number;
  contributions: PortfolioCovarianceRiskContribution[];
}

export interface PortfolioBacktestRun {
  name: string;
  market: Market;
  timeframe: ResearchTimeframe;
  initialCash: number;
  cashWeight: number;
  metrics: PortfolioBacktestMetrics;
  equityCurve: PortfolioBacktestEquityPoint[];
  legs: PortfolioBacktestLeg[];
  allocationEvents?: PortfolioAllocationEvent[];
  rebalanceEvents?: PortfolioRebalanceEvent[];
  tradeReviewEvents?: PortfolioTradeReviewEvent[];
  preTradeRiskChecks?: PortfolioPreTradeRiskCheck[];
  paperOrderEvents?: PortfolioPaperOrderEvent[];
  correlationPairs?: PortfolioCorrelationPair[];
  covarianceRisk?: PortfolioCovarianceRisk;
  dataQuality: MarketKlineQuality;
}

export interface PortfolioBacktestResult {
  portfolio?: PortfolioBacktestRun;
  source: WorkspaceSource;
  error?: string;
}

export function buildPortfolioBacktestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/portfolio/backtest");
}

export function buildPortfolioPaperOrdersUrl(
  baseUrl: string,
  params: { baseRunId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/portfolio/paper-orders", (url) => {
    if (params.baseRunId?.trim()) {
      url.searchParams.set("baseRunId", params.baseRunId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildPortfolioPaperOrderApprovalsUrl(
  baseUrl: string,
  params: { baseRunId?: string; batchId?: string } = {}
): string {
  return buildApiUrl(baseUrl, "api/portfolio/paper-order-approvals", (url) => {
    if (params.baseRunId?.trim()) {
      url.searchParams.set("baseRunId", params.baseRunId.trim());
    }
    if (params.batchId?.trim()) {
      url.searchParams.set("batchId", params.batchId.trim());
    }
  });
}

export function buildPortfolioPaperOrderSimulationsUrl(
  baseUrl: string,
  params: { baseRunId?: string; batchId?: string } = {}
): string {
  return buildApiUrl(baseUrl, "api/portfolio/paper-order-simulations", (url) => {
    if (params.baseRunId?.trim()) {
      url.searchParams.set("baseRunId", params.baseRunId.trim());
    }
    if (params.batchId?.trim()) {
      url.searchParams.set("batchId", params.batchId.trim());
    }
  });
}

export function buildPortfolioPaperOrderBatchSimulationsUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/portfolio/paper-order-simulations/batch");
}

export function buildPortfolioPaperOrderStateHistoryUrl(
  baseUrl: string,
  params: { baseRunId?: string; batchId?: string } = {}
): string {
  return buildApiUrl(baseUrl, "api/portfolio/paper-order-state-history", (url) => {
    if (params.baseRunId?.trim()) {
      url.searchParams.set("baseRunId", params.baseRunId.trim());
    }
    if (params.batchId?.trim()) {
      url.searchParams.set("batchId", params.batchId.trim());
    }
  });
}

export function buildPortfolioPaperOrderReplayUrl(
  baseUrl: string,
  params: { baseRunId?: string; initialCash?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/portfolio/paper-order-replay", (url) => {
    if (params.baseRunId?.trim()) {
      url.searchParams.set("baseRunId", params.baseRunId.trim());
    }
    if (params.initialCash !== undefined) {
      url.searchParams.set("initialCash", String(params.initialCash));
    }
  });
}

export async function runPortfolioBacktest(
  baseUrl: string,
  request: PortfolioBacktestRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioBacktestResult> {
  try {
    const response = await fetcher(buildPortfolioBacktestUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error(response.ok
        ? "Invalid portfolio backtest contract"
        : `HTTP ${response.status ?? "error"}`);
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isPortfolioBacktestPayload(payload)) {
      throw new Error("Invalid portfolio backtest contract");
    }
    return {
      portfolio: payload.portfolio,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio backtest error"
    };
  }
}

export async function recordPortfolioPaperOrderBatch(
  baseUrl: string,
  request: PortfolioPaperOrderBatchRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderRecordResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrdersUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseRunId: request.baseRunId,
        portfolioName: request.portfolioName,
        orders: request.orders,
        source: request.source ?? "portfolio_backtest"
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isPortfolioPaperOrderDuplicateBatchPayload(payload)) {
        return {
          batch: payload.existingBatch,
          lifecycle: payload.portfolioPaperOrderLifecycle,
          source: "core"
        };
      }
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isPortfolioPaperOrderBatchPayload(payload)) {
      throw new Error("Invalid portfolio paper order batch contract");
    }
    return {
      batch: payload.portfolioPaperOrderBatch,
      lifecycle: payload.portfolioPaperOrderLifecycle,
      auditEvent: payload.auditEvent,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order record error"
    };
  }
}

export async function loadPortfolioPaperOrderBatches(
  baseUrl: string,
  baseRunId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<PortfolioPaperOrderHistoryResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrdersUrl(baseUrl, { baseRunId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPortfolioPaperOrderBatchesPayload(payload)) {
      throw new Error("Invalid portfolio paper order history contract");
    }
    return {
      batches: payload.portfolioPaperOrderBatches,
      source: "core"
    };
  } catch (error) {
    return {
      batches: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order history error"
    };
  }
}

export async function recordPortfolioPaperOrderApproval(
  baseUrl: string,
  request: PortfolioPaperOrderApprovalRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderApprovalRecordResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderApprovalsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isPortfolioPaperOrderApprovalLockedPayload(payload)) {
        return {
          existingApproval: payload.existingApproval,
          existingSimulation: payload.existingSimulation,
          approvals: payload.approvals,
          lifecycle: payload.portfolioPaperOrderLifecycle,
          source: "core",
          error: payload.error
        };
      }
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          approvals: [],
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isPortfolioPaperOrderApprovalRecordPayload(payload)) {
      throw new Error("Invalid portfolio paper order approval contract");
    }
    return {
      approval: payload.approval,
      approvals: payload.approvals,
      lifecycle: payload.portfolioPaperOrderLifecycle,
      auditEvent: payload.auditEvent,
      source: "core"
    };
  } catch (error) {
    return {
      approvals: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order approval record error"
    };
  }
}

export async function loadPortfolioPaperOrderApprovals(
  baseUrl: string,
  baseRunId: string,
  batchId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderApprovalHistoryResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderApprovalsUrl(baseUrl, { baseRunId, batchId }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPortfolioPaperOrderApprovalHistoryPayload(payload)) {
      throw new Error("Invalid portfolio paper order approval history contract");
    }
    return {
      approvals: payload.approvals,
      lifecycle: payload.portfolioPaperOrderLifecycle,
      source: "core"
    };
  } catch (error) {
    return {
      approvals: [],
      lifecycle: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order approval history error"
    };
  }
}

export async function recordPortfolioPaperOrderSimulation(
  baseUrl: string,
  request: PortfolioPaperOrderSimulationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderSimulationRecordResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderSimulationsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isPortfolioPaperOrderDuplicateSimulationPayload(payload)) {
        return {
          simulation: payload.existingSimulation,
          simulations: payload.simulations,
          lifecycle: payload.portfolioPaperOrderLifecycle,
          source: "core"
        };
      }
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          simulations: [],
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isPortfolioPaperOrderSimulationRecordPayload(payload)) {
      throw new Error("Invalid portfolio paper order simulation contract");
    }
    return {
      simulation: payload.simulation,
      simulations: payload.simulations,
      lifecycle: payload.portfolioPaperOrderLifecycle,
      auditEvent: payload.auditEvent,
      source: "core"
    };
  } catch (error) {
    return {
      simulations: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order simulation record error"
    };
  }
}

export async function recordPortfolioPaperOrderBatchSimulation(
  baseUrl: string,
  request: PortfolioPaperOrderBatchSimulationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderBatchSimulationRecordResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderBatchSimulationsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    const payload = await response.json();
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          simulations: [],
          createdSimulations: [],
          auditEvents: [],
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isPortfolioPaperOrderBatchSimulationRecordPayload(payload)) {
      throw new Error("Invalid portfolio paper order batch simulation contract");
    }
    return {
      batchSimulation: payload.batchSimulation,
      simulations: payload.simulations,
      createdSimulations: payload.createdSimulations,
      lifecycle: payload.portfolioPaperOrderLifecycle,
      auditEvents: payload.auditEvents,
      source: "core"
    };
  } catch (error) {
    return {
      simulations: [],
      createdSimulations: [],
      auditEvents: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order batch simulation record error"
    };
  }
}

export async function loadPortfolioPaperOrderSimulations(
  baseUrl: string,
  baseRunId: string,
  batchId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderSimulationHistoryResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderSimulationsUrl(baseUrl, { baseRunId, batchId }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPortfolioPaperOrderSimulationHistoryPayload(payload)) {
      throw new Error("Invalid portfolio paper order simulation history contract");
    }
    return {
      simulations: payload.simulations,
      lifecycle: payload.portfolioPaperOrderLifecycle,
      source: "core"
    };
  } catch (error) {
    return {
      simulations: [],
      lifecycle: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order simulation history error"
    };
  }
}

export async function loadPortfolioPaperOrderStateHistory(
  baseUrl: string,
  baseRunId: string,
  batchId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderStateHistoryResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderStateHistoryUrl(baseUrl, { baseRunId, batchId }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPortfolioPaperOrderStateHistoryPayload(payload)) {
      throw new Error("Invalid portfolio paper order state history contract");
    }
    return {
      stateHistory: payload.stateHistory,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order state history error"
    };
  }
}

export async function loadPortfolioPaperOrderReplay(
  baseUrl: string,
  baseRunId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  initialCash = 100_000
): Promise<PortfolioPaperOrderReplayResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderReplayUrl(baseUrl, { baseRunId, initialCash }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPortfolioPaperOrderReplayPayload(payload)) {
      throw new Error("Invalid portfolio paper order replay contract");
    }
    return {
      replay: payload.replay,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order replay error"
    };
  }
}

function isPortfolioBacktestPayload(value: unknown): value is { portfolio: PortfolioBacktestRun } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { portfolio?: unknown };
  return isPortfolioBacktestRun(payload.portfolio);
}

function isPortfolioPaperOrderBatchPayload(
  value: unknown
): value is {
  portfolioPaperOrderBatch: PortfolioPaperOrderBatch;
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    portfolioPaperOrderBatch?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
    auditEvent?: unknown;
  };
  return (
    isPortfolioPaperOrderBatch(payload.portfolioPaperOrderBatch) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent))) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isPortfolioPaperOrderDuplicateBatchPayload(
  value: unknown
): value is {
  error: "portfolio_paper_order_batch_already_recorded";
  existingBatch: PortfolioPaperOrderBatch;
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    error?: unknown;
    existingBatch?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
  };
  return (
    payload.error === "portfolio_paper_order_batch_already_recorded" &&
    isPortfolioPaperOrderBatch(payload.existingBatch) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent)))
  );
}

function isPortfolioPaperOrderBatchesPayload(value: unknown): value is { portfolioPaperOrderBatches: PortfolioPaperOrderBatch[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { portfolioPaperOrderBatches?: unknown };
  return Array.isArray(payload.portfolioPaperOrderBatches) && payload.portfolioPaperOrderBatches.every(isPortfolioPaperOrderBatch);
}

function isPortfolioPaperOrderApprovalRecordPayload(
  value: unknown
): value is {
  approval: PortfolioPaperOrderApproval;
  approvals: PortfolioPaperOrderApproval[];
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    approval?: unknown;
    approvals?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
    auditEvent?: unknown;
  };
  return (
    isPortfolioPaperOrderApproval(payload.approval) &&
    Array.isArray(payload.approvals) &&
    payload.approvals.every(isPortfolioPaperOrderApproval) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent))) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isPortfolioPaperOrderApprovalLockedPayload(
  value: unknown
): value is {
  error: "portfolio_paper_order_approval_locked_after_simulation";
  existingApproval: PortfolioPaperOrderApproval;
  existingSimulation: PortfolioPaperOrderSimulation;
  approvals: PortfolioPaperOrderApproval[];
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    error?: unknown;
    existingApproval?: unknown;
    existingSimulation?: unknown;
    approvals?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
  };
  return (
    payload.error === "portfolio_paper_order_approval_locked_after_simulation" &&
    isPortfolioPaperOrderApproval(payload.existingApproval) &&
    isPortfolioPaperOrderSimulation(payload.existingSimulation) &&
    Array.isArray(payload.approvals) &&
    payload.approvals.every(isPortfolioPaperOrderApproval) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent)))
  );
}

function isPortfolioPaperOrderApprovalHistoryPayload(
  value: unknown
): value is { approvals: PortfolioPaperOrderApproval[]; portfolioPaperOrderLifecycle: PortfolioPaperOrderLifecycleEvent[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { approvals?: unknown; portfolioPaperOrderLifecycle?: unknown };
  return (
    Array.isArray(payload.approvals) &&
    payload.approvals.every(isPortfolioPaperOrderApproval) &&
    Array.isArray(payload.portfolioPaperOrderLifecycle) &&
    payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent)
  );
}

function isPortfolioPaperOrderSimulationRecordPayload(
  value: unknown
): value is {
  simulation: PortfolioPaperOrderSimulation;
  simulations: PortfolioPaperOrderSimulation[];
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    simulation?: unknown;
    simulations?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
    auditEvent?: unknown;
  };
  return (
    isPortfolioPaperOrderSimulation(payload.simulation) &&
    Array.isArray(payload.simulations) &&
    payload.simulations.every(isPortfolioPaperOrderSimulation) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent))) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isPortfolioPaperOrderDuplicateSimulationPayload(
  value: unknown
): value is {
  error: "portfolio_paper_order_simulation_already_recorded";
  existingSimulation: PortfolioPaperOrderSimulation;
  simulations: PortfolioPaperOrderSimulation[];
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    error?: unknown;
    existingSimulation?: unknown;
    simulations?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
  };
  return (
    payload.error === "portfolio_paper_order_simulation_already_recorded" &&
    isPortfolioPaperOrderSimulation(payload.existingSimulation) &&
    Array.isArray(payload.simulations) &&
    payload.simulations.every(isPortfolioPaperOrderSimulation) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent)))
  );
}

function isPortfolioPaperOrderBatchSimulationRecordPayload(
  value: unknown
): value is {
  batchSimulation: PortfolioPaperOrderBatchSimulation;
  simulations: PortfolioPaperOrderSimulation[];
  createdSimulations: PortfolioPaperOrderSimulation[];
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvents: AuditEventRecord[];
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    batchSimulation?: unknown;
    simulations?: unknown;
    createdSimulations?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
    auditEvents?: unknown;
  };
  return (
    isPortfolioPaperOrderBatchSimulation(payload.batchSimulation) &&
    Array.isArray(payload.simulations) &&
    payload.simulations.every(isPortfolioPaperOrderSimulation) &&
    Array.isArray(payload.createdSimulations) &&
    payload.createdSimulations.every(isPortfolioPaperOrderSimulation) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent))) &&
    Array.isArray(payload.auditEvents) &&
    payload.auditEvents.every(isAuditEventRecord)
  );
}

function isPortfolioPaperOrderBatchSimulation(value: unknown): value is PortfolioPaperOrderBatchSimulation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const simulation = value as Partial<PortfolioPaperOrderBatchSimulation>;
  return (
    simulation.schemaVersion === 1 &&
    simulation.mode === "portfolio_paper_order_batch_simulation" &&
    typeof simulation.status === "string" &&
    typeof simulation.baseRunId === "string" &&
    typeof simulation.batchId === "string" &&
    typeof simulation.requestedCount === "number" &&
    typeof simulation.filledCount === "number" &&
    typeof simulation.blockedCount === "number" &&
    typeof simulation.skippedCount === "number" &&
    Array.isArray(simulation.filledOrderIds) &&
    simulation.filledOrderIds.every((orderId) => typeof orderId === "string") &&
    Array.isArray(simulation.blockedOrders) &&
    simulation.blockedOrders.every(isPortfolioPaperOrderBatchSimulationIssue) &&
    Array.isArray(simulation.skippedOrders) &&
    simulation.skippedOrders.every(isPortfolioPaperOrderBatchSimulationIssue) &&
    typeof simulation.paperOnly === "boolean" &&
    typeof simulation.liveExecutionBlocked === "boolean"
  );
}

function isPortfolioPaperOrderBatchSimulationIssue(value: unknown): value is PortfolioPaperOrderBatchSimulationIssue {
  if (!value || typeof value !== "object") {
    return false;
  }
  const issue = value as Partial<PortfolioPaperOrderBatchSimulationIssue>;
  return (
    typeof issue.orderId === "string" &&
    (issue.symbol === undefined || typeof issue.symbol === "string") &&
    (issue.side === undefined || typeof issue.side === "string") &&
    (issue.reason === undefined || typeof issue.reason === "string") &&
    (issue.detail === undefined || typeof issue.detail === "string")
  );
}

function isPortfolioPaperOrderSimulationHistoryPayload(
  value: unknown
): value is { simulations: PortfolioPaperOrderSimulation[]; portfolioPaperOrderLifecycle: PortfolioPaperOrderLifecycleEvent[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { simulations?: unknown; portfolioPaperOrderLifecycle?: unknown };
  return (
    Array.isArray(payload.simulations) &&
    payload.simulations.every(isPortfolioPaperOrderSimulation) &&
    Array.isArray(payload.portfolioPaperOrderLifecycle) &&
    payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent)
  );
}

function isPortfolioPaperOrderStateHistoryPayload(
  value: unknown
): value is { stateHistory: PortfolioPaperOrderStateHistory } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { stateHistory?: unknown };
  return isPortfolioPaperOrderStateHistory(payload.stateHistory);
}

export function isPortfolioPaperOrderStateHistory(value: unknown): value is PortfolioPaperOrderStateHistory {
  if (!value || typeof value !== "object") {
    return false;
  }
  const history = value as Partial<PortfolioPaperOrderStateHistory>;
  return (
    history.schemaVersion === 1 &&
    typeof history.baseRunId === "string" &&
    typeof history.batchId === "string" &&
    typeof history.portfolioName === "string" &&
    typeof history.generatedAt === "string" &&
    history.mode === "portfolio_paper_order_state_history" &&
    isPortfolioPaperOrderStateHistorySummary(history.summary) &&
    Array.isArray(history.orders) &&
    history.orders.every(isPortfolioPaperOrderStateHistoryOrder) &&
    history.paperOnly === true &&
    history.liveExecutionBlocked === true
  );
}

function isPortfolioPaperOrderStateHistorySummary(value: unknown): value is PortfolioPaperOrderStateHistorySummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<PortfolioPaperOrderStateHistorySummary>;
  return (
    typeof summary.orderCount === "number" &&
    typeof summary.eventCount === "number" &&
    typeof summary.approvedOrders === "number" &&
    typeof summary.rejectedOrders === "number" &&
    typeof summary.filledOrders === "number" &&
    typeof summary.liveBlockedEvents === "number" &&
    isNumberRecord(summary.stateCounts)
  );
}

function isPortfolioPaperOrderStateHistoryOrder(value: unknown): value is PortfolioPaperOrderStateHistoryOrder {
  if (!value || typeof value !== "object") {
    return false;
  }
  const order = value as Partial<PortfolioPaperOrderStateHistoryOrder>;
  return (
    typeof order.batchId === "string" &&
    typeof order.baseRunId === "string" &&
    typeof order.portfolioName === "string" &&
    typeof order.orderId === "string" &&
    typeof order.symbol === "string" &&
    (typeof order.sourceRunId === "string" || order.sourceRunId === null) &&
    (order.side === "buy" || order.side === "sell" || order.side === "hold") &&
    typeof order.quantity === "number" &&
    typeof order.notionalValue === "number" &&
    (order.originalStatus === "pending_review" || order.originalStatus === "rejected" || order.originalStatus === "skipped") &&
    (order.riskStatus === "passed" || order.riskStatus === "review" || order.riskStatus === "blocked") &&
    typeof order.currentState === "string" &&
    typeof order.currentStateLabel === "string" &&
    Array.isArray(order.events) &&
    order.events.every(isPortfolioPaperOrderStateHistoryEvent) &&
    order.paperOnly === true &&
    order.liveExecutionBlocked === true
  );
}

function isPortfolioPaperOrderStateHistoryEvent(value: unknown): value is PortfolioPaperOrderStateHistoryEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<PortfolioPaperOrderStateHistoryEvent>;
  return (
    typeof event.eventId === "string" &&
    typeof event.batchId === "string" &&
    typeof event.baseRunId === "string" &&
    typeof event.orderId === "string" &&
    typeof event.timestamp === "string" &&
    typeof event.state === "string" &&
    typeof event.label === "string" &&
    typeof event.actor === "string" &&
    typeof event.source === "string" &&
    typeof event.reason === "string" &&
    (event.metadata === undefined || isSecretFreeRecord(event.metadata)) &&
    event.paperOnly === true &&
    event.liveExecutionBlocked === true
  );
}

function isPortfolioPaperOrderReplayPayload(value: unknown): value is { replay: PortfolioPaperOrderReplay } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { replay?: unknown };
  return isPortfolioPaperOrderReplay(payload.replay);
}

export function isPortfolioPaperOrderReplay(value: unknown): value is PortfolioPaperOrderReplay {
  if (!value || typeof value !== "object") {
    return false;
  }
  const replay = value as Partial<PortfolioPaperOrderReplay>;
  return (
    replay.schemaVersion === 1 &&
    typeof replay.baseRunId === "string" &&
    typeof replay.generatedAt === "string" &&
    replay.mode === "portfolio_paper_order_replay" &&
    typeof replay.initialCash === "number" &&
    isPaperExecutionAccount(replay.account) &&
    Array.isArray(replay.positions) &&
    replay.positions.every(isPortfolioPaperOrderReplayPosition) &&
    Array.isArray(replay.orders) &&
    replay.orders.every(isPortfolioPaperOrderReplayOrder) &&
    isPortfolioPaperOrderReplaySummary(replay.summary) &&
    replay.paperOnly === true &&
    replay.liveExecutionBlocked === true
  );
}

function isPortfolioPaperOrderReplayPosition(value: unknown): value is PortfolioPaperOrderReplayPosition {
  if (!value || typeof value !== "object") {
    return false;
  }
  const position = value as Partial<PortfolioPaperOrderReplayPosition>;
  return (
    typeof position.symbol === "string" &&
    typeof position.quantity === "number" &&
    typeof position.avgCost === "number" &&
    typeof position.lastPrice === "number" &&
    typeof position.marketValue === "number" &&
    typeof position.unrealizedPnl === "number"
  );
}

function isPortfolioPaperOrderReplayOrder(value: unknown): value is PortfolioPaperOrderReplayOrder {
  if (!value || typeof value !== "object") {
    return false;
  }
  const order = value as Partial<PortfolioPaperOrderReplayOrder>;
  return (
    typeof order.simulationId === "string" &&
    typeof order.batchId === "string" &&
    typeof order.orderId === "string" &&
    typeof order.simulatedAt === "string" &&
    typeof order.symbol === "string" &&
    (order.side === "buy" || order.side === "sell") &&
    typeof order.quantity === "number" &&
    typeof order.fillPrice === "number" &&
    typeof order.notionalValue === "number" &&
    typeof order.cashAfter === "number" &&
    typeof order.positionAfter === "number" &&
    (order.replayState === "applied" || order.replayState === "ignored") &&
    (order.adapterPaperExecutionId === undefined || typeof order.adapterPaperExecutionId === "string") &&
    (order.adapterManifestValidationId === undefined || typeof order.adapterManifestValidationId === "string") &&
    (order.adapterPaperExecutionEvidence === undefined ||
      isSecretFreeRecord(order.adapterPaperExecutionEvidence)) &&
    order.paperOnly === true &&
    order.liveExecutionBlocked === true
  );
}

function isPortfolioPaperOrderReplaySummary(value: unknown): value is PortfolioPaperOrderReplaySummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<PortfolioPaperOrderReplaySummary>;
  return (
    typeof summary.filledOrders === "number" &&
    typeof summary.buyNotional === "number" &&
    typeof summary.sellNotional === "number" &&
    typeof summary.netNotional === "number" &&
    typeof summary.realizedPnl === "number" &&
    typeof summary.unrealizedPnl === "number" &&
    typeof summary.positionCount === "number" &&
    Array.isArray(summary.warnings) &&
    summary.warnings.every((warning) => typeof warning === "string")
  );
}

export function isPortfolioPaperOrderApproval(value: unknown): value is PortfolioPaperOrderApproval {
  if (!value || typeof value !== "object") {
    return false;
  }
  const approval = value as Partial<PortfolioPaperOrderApproval>;
  return (
    typeof approval.approvalId === "string" &&
    typeof approval.baseRunId === "string" &&
    typeof approval.batchId === "string" &&
    typeof approval.orderId === "string" &&
    typeof approval.reviewedAt === "string" &&
    typeof approval.approved === "boolean" &&
    typeof approval.reviewer === "string" &&
    typeof approval.reason === "string"
  );
}

export function isPortfolioPaperOrderSimulation(value: unknown): value is PortfolioPaperOrderSimulation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const simulation = value as Partial<PortfolioPaperOrderSimulation>;
  return (
    typeof simulation.simulationId === "string" &&
    typeof simulation.baseRunId === "string" &&
    typeof simulation.batchId === "string" &&
    typeof simulation.orderId === "string" &&
    typeof simulation.simulatedAt === "string" &&
    simulation.mode === "portfolio_paper_order_simulation" &&
    typeof simulation.symbol === "string" &&
    (typeof simulation.sourceRunId === "string" || simulation.sourceRunId === null) &&
    (simulation.side === "buy" || simulation.side === "sell") &&
    typeof simulation.quantity === "number" &&
    typeof simulation.fillPrice === "number" &&
    typeof simulation.notionalValue === "number" &&
    simulation.orderState === "filled" &&
    simulation.fillStatus === "filled" &&
    typeof simulation.reason === "string" &&
    (typeof simulation.approvedBy === "string" || simulation.approvedBy === null) &&
    (simulation.routeRisk === undefined || isPortfolioPaperOrderSimulationRouteRisk(simulation.routeRisk)) &&
    (simulation.adapterPaperExecutionId === undefined || typeof simulation.adapterPaperExecutionId === "string") &&
    (simulation.adapterManifestValidationId === undefined ||
      typeof simulation.adapterManifestValidationId === "string") &&
    (simulation.adapterPaperExecutionEvidence === undefined ||
      isSecretFreeRecord(simulation.adapterPaperExecutionEvidence)) &&
    typeof simulation.paperOnly === "boolean" &&
    typeof simulation.liveExecutionBlocked === "boolean"
  );
}

function isPortfolioPaperOrderSimulationRouteRisk(value: unknown): value is PortfolioPaperOrderSimulationRouteRisk {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const routeRisk = value as Partial<PortfolioPaperOrderSimulationRouteRisk>;
  return (
    (routeRisk.status === undefined || typeof routeRisk.status === "string") &&
    (routeRisk.cashAfter === undefined || typeof routeRisk.cashAfter === "number") &&
    (routeRisk.blockedReasons === undefined ||
      (Array.isArray(routeRisk.blockedReasons) &&
        routeRisk.blockedReasons.every((reason) => typeof reason === "string")))
  );
}

export function isPortfolioPaperOrderBatch(value: unknown): value is PortfolioPaperOrderBatch {
  if (!value || typeof value !== "object") {
    return false;
  }
  const batch = value as Partial<PortfolioPaperOrderBatch>;
  return (
    typeof batch.batchId === "string" &&
    typeof batch.baseRunId === "string" &&
    typeof batch.portfolioName === "string" &&
    typeof batch.createdAt === "string" &&
    batch.mode === "portfolio_paper_order_review" &&
    typeof batch.source === "string" &&
    isPortfolioPaperOrderSummary(batch.summary) &&
    Array.isArray(batch.orders) &&
    batch.orders.every(isPortfolioPaperOrderEvent)
  );
}

function isPortfolioPaperOrderSummary(value: unknown): value is PortfolioPaperOrderSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<PortfolioPaperOrderSummary>;
  return (
    typeof summary.totalOrders === "number" &&
    typeof summary.totalNotionalValue === "number" &&
    isNumberRecord(summary.statusCounts) &&
    isNumberRecord(summary.riskStatusCounts)
  );
}

function isPortfolioPaperOrderLifecycleEvent(value: unknown): value is PortfolioPaperOrderLifecycleEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<PortfolioPaperOrderLifecycleEvent>;
  return (
    typeof row.batchId === "string" &&
    typeof row.baseRunId === "string" &&
    typeof row.portfolioName === "string" &&
    typeof row.orderId === "string" &&
    typeof row.symbol === "string" &&
    (typeof row.sourceRunId === "string" || row.sourceRunId === null) &&
    (row.side === "buy" || row.side === "sell" || row.side === "hold") &&
    typeof row.quantity === "number" &&
    typeof row.notionalValue === "number" &&
    (row.originalStatus === "pending_review" || row.originalStatus === "rejected" || row.originalStatus === "skipped") &&
    (row.riskStatus === "passed" || row.riskStatus === "review" || row.riskStatus === "blocked") &&
    isPortfolioPaperOrderLifecycleState(row.state) &&
    typeof row.routable === "boolean" &&
    typeof row.paperOnly === "boolean" &&
    typeof row.liveExecutionBlocked === "boolean" &&
    (typeof row.approvedBy === "string" || row.approvedBy === null) &&
    (typeof row.reviewedAt === "string" || row.reviewedAt === null) &&
    typeof row.reason === "string"
  );
}

function isPortfolioPaperOrderLifecycleState(value: unknown): value is PortfolioPaperOrderLifecycleEvent["state"] {
  return (
    value === "awaiting_operator_review" ||
    value === "ready_for_simulation" ||
    value === "risk_rejected" ||
    value === "operator_rejected" ||
    value === "risk_review" ||
    value === "invalid_order" ||
    value === "skipped"
  );
}

export function isPortfolioBacktestRun(value: unknown): value is PortfolioBacktestRun {
  if (!value || typeof value !== "object") {
    return false;
  }
  const run = value as Partial<PortfolioBacktestRun>;
  return (
    typeof run.name === "string" &&
    isMarket(run.market) &&
    isTimeframe(run.timeframe) &&
    typeof run.initialCash === "number" &&
    typeof run.cashWeight === "number" &&
    isPortfolioBacktestMetrics(run.metrics) &&
    Array.isArray(run.equityCurve) &&
    run.equityCurve.every(isPortfolioBacktestEquityPoint) &&
    Array.isArray(run.legs) &&
    run.legs.every(isPortfolioBacktestLeg) &&
    (run.allocationEvents === undefined ||
      (Array.isArray(run.allocationEvents) && run.allocationEvents.every(isPortfolioAllocationEvent))) &&
    (run.rebalanceEvents === undefined ||
      (Array.isArray(run.rebalanceEvents) && run.rebalanceEvents.every(isPortfolioRebalanceEvent))) &&
    (run.tradeReviewEvents === undefined ||
      (Array.isArray(run.tradeReviewEvents) && run.tradeReviewEvents.every(isPortfolioTradeReviewEvent))) &&
    (run.preTradeRiskChecks === undefined ||
      (Array.isArray(run.preTradeRiskChecks) && run.preTradeRiskChecks.every(isPortfolioPreTradeRiskCheck))) &&
    (run.paperOrderEvents === undefined ||
      (Array.isArray(run.paperOrderEvents) && run.paperOrderEvents.every(isPortfolioPaperOrderEvent))) &&
    (run.correlationPairs === undefined ||
      (Array.isArray(run.correlationPairs) && run.correlationPairs.every(isPortfolioCorrelationPair))) &&
    (run.covarianceRisk === undefined || isPortfolioCovarianceRisk(run.covarianceRisk)) &&
    isMarketKlineQuality(run.dataQuality)
  );
}

function isPortfolioBacktestMetrics(value: unknown): value is PortfolioBacktestMetrics {
  if (!value || typeof value !== "object") {
    return false;
  }
  const metrics = value as Partial<PortfolioBacktestMetrics>;
  return (
    typeof metrics.totalReturnPct === "number" &&
    typeof metrics.annualReturnPct === "number" &&
    typeof metrics.maxDrawdownPct === "number" &&
    typeof metrics.winRatePct === "number" &&
    typeof metrics.profitFactor === "number" &&
    typeof metrics.tradeCount === "number"
  );
}

function isPortfolioBacktestEquityPoint(value: unknown): value is PortfolioBacktestEquityPoint {
  if (!value || typeof value !== "object") {
    return false;
  }
  const point = value as Partial<PortfolioBacktestEquityPoint>;
  return typeof point.timestamp === "string" && typeof point.equity === "number";
}

function isPortfolioAllocationEvent(value: unknown): value is PortfolioAllocationEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<PortfolioAllocationEvent>;
  return (
    typeof event.timestamp === "string" &&
    (event.eventType === "allocate" || event.eventType === "cash_buffer") &&
    typeof event.symbol === "string" &&
    (event.sourceRunId === null || typeof event.sourceRunId === "string") &&
    typeof event.targetWeight === "number" &&
    typeof event.notionalValue === "number" &&
    typeof event.reason === "string"
  );
}

function isPortfolioRebalanceEvent(value: unknown): value is PortfolioRebalanceEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<PortfolioRebalanceEvent>;
  return (
    typeof event.timestamp === "string" &&
    event.eventType === "rebalance_review" &&
    typeof event.symbol === "string" &&
    (event.sourceRunId === null || typeof event.sourceRunId === "string") &&
    typeof event.targetWeight === "number" &&
    typeof event.endingWeight === "number" &&
    typeof event.currentValue === "number" &&
    typeof event.targetValue === "number" &&
    typeof event.deltaValue === "number" &&
    typeof event.driftPct === "number" &&
    (event.status === "within_band" || event.status === "review" || event.status === "blocked") &&
    typeof event.reason === "string"
  );
}

function isPortfolioTradeReviewEvent(value: unknown): value is PortfolioTradeReviewEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<PortfolioTradeReviewEvent>;
  return (
    typeof event.timestamp === "string" &&
    event.eventType === "trade_review" &&
    typeof event.symbol === "string" &&
    (event.sourceRunId === null || typeof event.sourceRunId === "string") &&
    (event.side === "buy" || event.side === "sell" || event.side === "hold") &&
    typeof event.notionalValue === "number" &&
    typeof event.targetWeight === "number" &&
    typeof event.endingWeight === "number" &&
    (event.status === "paper_review" || event.status === "blocked" || event.status === "no_action") &&
    typeof event.reason === "string"
  );
}

function isPortfolioPreTradeRiskCheck(value: unknown): value is PortfolioPreTradeRiskCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<PortfolioPreTradeRiskCheck>;
  return (
    typeof check.timestamp === "string" &&
    check.eventType === "pre_trade_risk_check" &&
    (check.scope === "portfolio" || check.scope === "trade") &&
    (check.symbol === null || typeof check.symbol === "string") &&
    (check.sourceRunId === null || typeof check.sourceRunId === "string") &&
    (check.checkId === "portfolio_data_quality" ||
      check.checkId === "trade_review_status" ||
      check.checkId === "trade_notional_limit") &&
    (check.status === "passed" || check.status === "review" || check.status === "blocked") &&
    typeof check.value === "number" &&
    typeof check.limit === "number" &&
    typeof check.reason === "string"
  );
}

function isPortfolioPaperOrderEvent(value: unknown): value is PortfolioPaperOrderEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<PortfolioPaperOrderEvent>;
  return (
    typeof event.timestamp === "string" &&
    event.eventType === "portfolio_paper_order" &&
    typeof event.orderId === "string" &&
    typeof event.symbol === "string" &&
    (event.sourceRunId === null || typeof event.sourceRunId === "string") &&
    (event.side === "buy" || event.side === "sell" || event.side === "hold") &&
    typeof event.notionalValue === "number" &&
    typeof event.quantity === "number" &&
    (event.status === "pending_review" || event.status === "rejected" || event.status === "skipped") &&
    (event.riskStatus === "passed" || event.riskStatus === "review" || event.riskStatus === "blocked") &&
    typeof event.reason === "string"
  );
}

function isPortfolioBacktestLeg(value: unknown): value is PortfolioBacktestLeg {
  if (!value || typeof value !== "object") {
    return false;
  }
  const leg = value as Partial<PortfolioBacktestLeg>;
  return (
    typeof leg.symbol === "string" &&
    typeof leg.targetWeight === "number" &&
    typeof leg.startingValue === "number" &&
    typeof leg.endingValue === "number" &&
    typeof leg.contributionValue === "number" &&
    typeof leg.contributionReturnPct === "number" &&
    typeof leg.maxDrawdownPct === "number" &&
    typeof leg.tradeCount === "number" &&
    isMarketKlineQuality(leg.dataQuality)
  );
}

function isPortfolioCorrelationPair(value: unknown): value is PortfolioCorrelationPair {
  if (!value || typeof value !== "object") {
    return false;
  }
  const pair = value as Partial<PortfolioCorrelationPair>;
  return typeof pair.leftSymbol === "string" && typeof pair.rightSymbol === "string" && typeof pair.correlation === "number";
}

function isPortfolioCovarianceRisk(value: unknown): value is PortfolioCovarianceRisk {
  if (!value || typeof value !== "object") {
    return false;
  }
  const risk = value as Partial<PortfolioCovarianceRisk>;
  return (
    risk.method === "population_covariance" &&
    typeof risk.observations === "number" &&
    typeof risk.periodVolatilityPct === "number" &&
    typeof risk.annualizedVolatilityPct === "number" &&
    Array.isArray(risk.contributions) &&
    risk.contributions.every(isPortfolioCovarianceRiskContribution)
  );
}

function isPortfolioCovarianceRiskContribution(value: unknown): value is PortfolioCovarianceRiskContribution {
  if (!value || typeof value !== "object") {
    return false;
  }
  const contribution = value as Partial<PortfolioCovarianceRiskContribution>;
  return (
    typeof contribution.symbol === "string" &&
    (contribution.sourceRunId === null || typeof contribution.sourceRunId === "string") &&
    typeof contribution.targetWeight === "number" &&
    typeof contribution.annualizedVolatilityPct === "number" &&
    typeof contribution.marginalContributionPct === "number" &&
    typeof contribution.contributionPct === "number"
  );
}
