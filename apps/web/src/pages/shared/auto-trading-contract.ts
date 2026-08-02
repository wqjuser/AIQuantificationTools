import { buildApiUrl, type StrategyProductionBinding, type WorkspaceFetcher } from "../../lib/terminal-api";

const defaultFetcher: WorkspaceFetcher = (url, init) => fetch(url, init);

export interface AutoTradingState {
  enabled: boolean;
  executionMode: "paper" | "testnet" | "live";
  testnetConfirmed: boolean;
  liveConfirmed: boolean;
  liveOperator: string;
  liveSessionTtlHours?: number;
  liveAuthorizedUntil: string | null;
  runnerState: "running" | "stopping" | "stopped";
  runnerIntervalSeconds: number;
  runnerCycleCount: number;
  consecutiveRunnerFailures: number;
  lastRunnerCycleAt: string | null;
  lastRunnerSuccessAt: string | null;
  lastRunnerErrorAt: string | null;
  runnerHealth?: {
    status: "running" | "offline" | "delayed" | "blocked";
    reason: string;
    heartbeatAgeSeconds: number | null;
    staleAfterSeconds: number;
    lastHeartbeatAt: string | null;
    recovered: boolean;
  };
  status: string;
  detail: string;
  symbol: string;
  timeframe: string;
  triggerPct: number;
  orderNotional: number;
  stopLossPct: number;
  takeProfitPct: number;
  dailyLossLimitPct: number;
  dailyProfitDrawdownLimitPct: number;
  maxTradesPerHour: number;
  providerId: string;
  cash: number;
  availableCash?: number;
  position: number;
  avgCost: number;
  equity: number;
  accountEquity?: number | null;
  accountAuthority?: "binance_spot" | null;
  realizedPnl: number;
  dailyStartEquity: number;
  dailyPeakEquity?: number;
  dailyReleasedDustNotional?: number;
  dailyLossDrawdownPct?: number;
  dailyProfitDrawdownPct?: number;
  dailyRiskHaltReason?: string | null;
  tradeCount: number;
  tradeTimestamps: string[];
  windowChangePct: number | null;
  lastTestnetOrder: { state: string } | null;
  lastLiveOrder: { state: string } | null;
  lastOrderResult?: {
    orderResultId: string;
    orderIntentId: string;
    executionMode: "paper" | "testnet" | "live";
    state: string;
    clientOrderId: string;
    externalOrderId: string;
    filledQuantity: number;
    remainingQuantity: number;
    averagePrice: number;
    filledNotional: number;
    fees: Array<{ currency: string; cost: number }>;
    feeEstimated: boolean;
    error: string;
  } | null;
  lastDustDisposition?: {
    executionMode: "testnet" | "live";
    symbol: string;
    quantity: number;
    referencePrice: number;
    estimatedNotional: number;
    reason: string;
    releasedAt: string;
    orderSubmitted: false;
  } | null;
  lastAccountCheck: {
    accountCovered?: boolean;
    checkedAt?: string;
    positionCovered: boolean;
    quoteCovered: boolean;
    unexpectedOpenAutoOrderCount: number;
    unexpectedOpenOrderCount?: number;
    checkCode?: string;
    accountSnapshot?: {
      valuationComplete: boolean;
      unpricedAssets: string[];
      totalEquityUsdt: number;
      assets?: Record<string, {
        free: number;
        used: number;
        total: number;
        priceUsdt: number | null;
        valueUsdt: number | null;
      }>;
    };
  } | null;
  lastDecision: {
    action: "buy" | "sell" | "hold";
    confidence: number;
    reason: string;
    providerId: string;
    evaluatedAt?: string;
  } | null;
  lastDecisionContract?: {
    contractVersion: "aiqt-decision-v1";
    strategyRevision: string;
    marketSnapshot: {
      snapshotHash: string;
      dataHash: string;
      market: string;
      symbol: string;
      timeframe: string;
      dataSource: string;
      barCount: number;
      latestBarAt: string;
    };
    decisionProposal: {
      proposalId: string;
      snapshotHash: string;
      strategyRevision: string;
      source: "rules" | "risk" | "ai";
      providerId: string;
      model?: string | null;
      usage?: Partial<Record<"inputTokens" | "outputTokens" | "totalTokens", number>> | null;
      latencyMs?: number;
      action: "buy" | "sell" | "hold";
      confidence: number;
      reason: string;
      proposedAt: string;
    };
    signal: {
      signalId: string;
      proposalId: string;
      snapshotHash: string;
      strategyId: string;
      strategyRevision: string;
      horizon: string;
      evaluatedBarAt: string;
      expiresAt: string;
      action: "buy" | "sell" | "hold";
      confidence: number;
      reason: string;
      generatedAt: string;
    };
    portfolioTarget: {
      portfolioTargetId: string;
      signalId: string;
      symbol: string;
      currentQuantity: number;
      targetQuantity: number;
      deltaQuantity: number;
      referencePrice: number;
      targetNotional: number;
    };
    riskAdjustedTarget: {
      riskAdjustedTargetId: string;
      portfolioTargetId: string;
      decision: "preserve" | "reduce" | "zero" | "reject";
      requestedTargetQuantity: number;
      approvedTargetQuantity: number;
      approvedDeltaQuantity: number;
      approvedNotional: number;
      reason: string;
      evidence?: {
        dailyDrawdownPct: number;
        dailyLossDrawdownPct?: number;
        dailyLossLimitPct: number;
        dailyProfitDrawdownPct?: number;
        dailyProfitDrawdownLimitPct?: number;
        recentTradeCount: number;
        maxTradesPerHour: number;
      };
    };
    orderIntent?: {
      orderIntentId: string;
      marketSnapshotHash: string;
      strategyRevision: string;
      proposalId: string;
      signalId: string;
      portfolioTargetId: string;
      riskAdjustedTargetId: string;
      accountCheckId: string;
      symbol: string;
      side: "buy" | "sell";
      type: "market";
      quantity: number;
      referencePrice: number;
      notionalValue: number;
      marketRules?: {
        source: string;
        quantityPrecision: number | null;
        pricePrecision: number | null;
        minimumQuantity: number | null;
        minimumNotional: number | null;
      };
      executionAssumptions?: {
        feeRate: number;
        feeEstimated: boolean;
        slippageBps: number | null;
        slippageModel: string;
      };
    } | null;
  } | null;
}

export interface AutoTradingEconomics {
  currency: "USDT";
  executionMode: "paper" | "testnet" | "live";
  tradeCount: number;
  tradingPnlBeforeAi: number | null;
  tradingFees: number | null;
  tradingFeesEstimated: boolean;
  estimatedFeeCount: number;
  feeEvidenceComplete: boolean;
  realizedPnl: number;
  unrealizedPnl: number | null;
  aiUsage: {
    callCount: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    providerId: string;
    model: string | null;
    latencyMs: number;
  } | null;
  aiUsageEvidenceComplete: boolean;
  aiCostUsdt: null;
  aiCostStatus: "unpriced";
  netPnlAfterAi: null;
}

export interface AutoTradingHistoryEvent {
  eventId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface AutoTradingSnapshot {
  state: AutoTradingState;
  strategyBinding?: StrategyProductionBinding | null;
  economics: AutoTradingEconomics;
  providers: Array<{ providerId: string; configured: boolean; model: string | null }>;
  history: AutoTradingHistoryEvent[];
  paperOnly: boolean;
  sandboxOnly?: boolean;
  sandboxOrderSubmissionEnabled?: boolean;
  sandboxRouteExecuted?: boolean;
  sandboxKillSwitch?: { triggered: boolean } | null;
  productionLive?: {
    enabled: boolean;
    credentialsConfigured: boolean;
    controlActive: boolean;
    triggered: boolean;
  };
  liveTradingAllowed: boolean;
  orderSubmissionEnabled: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
}

export type AutoTradingProductionStrategySnapshot = Pick<AutoTradingSnapshot, "strategyBinding"> & {
  state: Pick<
    AutoTradingState,
    "executionMode" | "runnerIntervalSeconds" | "symbol" | "timeframe"
  >;
};

async function updateAutoTradingState(
  baseUrl: string,
  request: Record<string, unknown>,
  fetcher: WorkspaceFetcher = defaultFetcher
) {
  const response = await fetcher(buildApiUrl(baseUrl, "api/execution/auto-paper-trading"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  const payload = await response.json() as unknown;
  if (!response.ok) {
    throw new Error(
      typeof payload === "object" && payload && "detail" in payload
        ? String((payload as Record<string, unknown>).detail)
        : `HTTP ${response.status}`
    );
  }
  return payload;
}

export async function authorizeAutoLiveSession(
  baseUrl: string,
  operator: string,
  fetcher: WorkspaceFetcher = defaultFetcher
) {
  const payload = await updateAutoTradingState(baseUrl, {
    liveConfirmed: true,
    liveOperator: operator.trim()
  }, fetcher);
  if (
    !payload
    || typeof payload !== "object"
    || (payload as Record<string, unknown>).liveTradingAllowed !== true
  ) {
    throw new Error("自动交易尚未处于已启用的生产实盘模式");
  }
}

export async function startAutoLiveSession(
  baseUrl: string,
  operator: string,
  fetcher: WorkspaceFetcher = defaultFetcher
) {
  const payload = await updateAutoTradingState(baseUrl, {
    enabled: true,
    executionMode: "live",
    liveConfirmed: true,
    liveOperator: operator.trim()
  }, fetcher);
  const state = payload && typeof payload === "object"
    ? (payload as Record<string, unknown>).state
    : null;
  if (
    !payload
    || typeof payload !== "object"
    || (payload as Record<string, unknown>).liveTradingAllowed !== true
    || !state
    || typeof state !== "object"
    || (state as Record<string, unknown>).enabled !== true
    || (state as Record<string, unknown>).executionMode !== "live"
  ) {
    throw new Error("自动交易未能启动已启用的生产实盘模式");
  }
}

export function formatTime(value?: string | null) {
  if (!value) return "尚无时间";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString("zh-CN", {
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
      minute: "2-digit",
      month: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Shanghai"
    });
}

export function liveAuthorizationLabel(
  state?: Partial<Pick<
    AutoTradingState,
    "liveConfirmed" | "liveSessionTtlHours" | "liveAuthorizedUntil"
  >>,
) {
  if (state?.liveConfirmed !== true) return "未授权";
  if (state.liveSessionTtlHours === 0) return "永久有效";
  return state.liveAuthorizedUntil
    ? `有效至 ${formatTime(state.liveAuthorizedUntil)}`
    : "未授权";
}
