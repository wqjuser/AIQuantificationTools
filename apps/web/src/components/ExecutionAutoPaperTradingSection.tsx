import {
  Activity,
  Bot,
  ChevronRight,
  CirclePause,
  Play,
  RefreshCw,
  Save,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  buildApiUrl,
  isStrategyProductionBindingPayload,
  type StrategyProductionBinding,
  type WorkspaceFetcher
} from "../lib/terminal-api";

const defaultFetcher: WorkspaceFetcher = (url, init) => fetch(url, init);
export const AUTO_TRADING_STATUS_REFRESH_INTERVAL_MS = 5_000;

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

export function autoTradingCycleCountdown(
  state: Pick<AutoTradingState, "enabled" | "lastRunnerCycleAt" | "runnerIntervalSeconds"> | undefined,
  nowMs = Date.now()
): number | null {
  if (!state?.enabled || !state.lastRunnerCycleAt) return null;
  const lastCycleAt = Date.parse(state.lastRunnerCycleAt);
  return Number.isFinite(lastCycleAt)
    ? Math.max(0, Math.ceil((lastCycleAt + state.runnerIntervalSeconds * 1_000 - nowMs) / 1_000))
    : null;
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

interface AutoTradingHistoryEvent {
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

type AutoTradingProductionStrategySnapshot = Pick<AutoTradingSnapshot, "strategyBinding"> & {
  state: Pick<
    AutoTradingState,
    "executionMode" | "runnerIntervalSeconds" | "symbol" | "timeframe"
  >;
};

export function showBuiltInAutoTradingSignalControls(
  binding?: Pick<StrategyProductionBinding, "kind"> | null
) {
  return binding?.kind !== "library";
}

export function AutoTradingProductionStrategyOverview({
  snapshot
}: {
  snapshot?: AutoTradingProductionStrategySnapshot | null;
}) {
  const binding = snapshot?.strategyBinding;
  const state = snapshot?.state;
  const libraryStrategy = !showBuiltInAutoTradingSignalControls(binding);
  const bindingBlocked = binding?.status === "blocked";
  const bindingUnavailable = Boolean(snapshot && !binding);
  return (
    <section
      aria-label="生产策略概览"
      className={`execution-auto-paper-risk execution-auto-production-strategy${
        bindingBlocked ? " blocked" : bindingUnavailable ? " unavailable" : ""
      }`}
    >
      <header>
        <strong>生产策略概览</strong>
        <span>
          {bindingBlocked
            ? "策略证据阻断"
            : binding
              ? libraryStrategy ? "已审计策略" : "内置策略"
              : snapshot ? "绑定证据未提供" : "正在读取"}
        </span>
      </header>
      <dl>
        <div>
          <dt>当前策略</dt>
          <dd>{binding?.name ?? (snapshot ? "未提供策略绑定身份" : "等待生产策略状态")}</dd>
        </div>
        <div>
          <dt>运行上下文</dt>
          <dd>{state ? `${state.symbol} · ${state.timeframe}` : "—"}</dd>
        </div>
        <div>
          <dt>运行模式</dt>
          <dd>{state ? executionModeLabel(state.executionMode) : "—"}</dd>
        </div>
        <div>
          <dt>自动评估</dt>
          <dd>{state ? `每 ${state.runnerIntervalSeconds} 秒` : "—"}</dd>
        </div>
        <div>
          <dt>审计证据</dt>
          <dd>{binding?.auditRunId ?? (binding ? "内置规则" : "—")}</dd>
        </div>
      </dl>
      <small>
        {binding?.detail ?? (snapshot
          ? "当前 API 响应未包含策略绑定证据，不能据此判断活动策略身份。"
          : "正在读取当前生产策略及运行上下文。")}
      </small>
      <small>
        {!binding
          ? "读取到绑定证据后，本页会区分已审计策略与内置策略的可配置边界。"
          : libraryStrategy
          ? "已审计策略的信号与触发条件由绑定版本固定；本页只配置执行模式、委托额度与账户级风控，不会改写策略。"
          : "内置策略使用涨跌幅阈值与已配置的智能决策服务；切换生产策略需先暂停监控并完成审计交接。"}
      </small>
    </section>
  );
}

function isAutoTradingSnapshot(payload: unknown): payload is AutoTradingSnapshot {
  if (!payload || typeof payload !== "object") return false;
  const snapshot = payload as Record<string, unknown>;
  const state = snapshot.state;
  const binding = snapshot.strategyBinding;
  const economics = snapshot.economics;
  if (!state || typeof state !== "object") return false;
  if (binding !== undefined && binding !== null && typeof binding !== "object") return false;
  if (!isAutoTradingEconomics(economics)) return false;
  const stateRecord = state as Record<string, unknown>;
  const numericStateFields = [
    "runnerIntervalSeconds",
    "runnerCycleCount",
    "consecutiveRunnerFailures",
    "triggerPct",
    "orderNotional",
    "stopLossPct",
    "takeProfitPct",
    "dailyLossLimitPct",
    "dailyProfitDrawdownLimitPct",
    "maxTradesPerHour",
    "cash",
    "equity",
    "position",
    "avgCost",
    "realizedPnl",
    "dailyStartEquity",
    "tradeCount",
  ];
  return ["paper", "testnet", "live"].includes(String(stateRecord.executionMode))
    && ["running", "stopping", "stopped"].includes(String(stateRecord.runnerState))
    && typeof stateRecord.enabled === "boolean"
    && typeof stateRecord.testnetConfirmed === "boolean"
    && typeof stateRecord.liveConfirmed === "boolean"
    && typeof stateRecord.liveOperator === "string"
    && typeof stateRecord.status === "string"
    && typeof stateRecord.detail === "string"
    && typeof stateRecord.symbol === "string"
    && typeof stateRecord.timeframe === "string"
    && typeof stateRecord.providerId === "string"
    && Array.isArray(stateRecord.tradeTimestamps)
    && numericStateFields.every((field) =>
      typeof stateRecord[field] === "number" && Number.isFinite(stateRecord[field])
    )
    && (
      binding === undefined
      || binding === null
      || isStrategyProductionBindingPayload({ strategyBinding: binding })
    )
    && typeof snapshot.liveTradingAllowed === "boolean"
    && typeof snapshot.orderSubmissionEnabled === "boolean"
    && typeof snapshot.routeExecuted === "boolean"
    && typeof snapshot.liveBlockedBoundary === "boolean"
    && typeof snapshot.paperOnly === "boolean"
    && Array.isArray(snapshot.providers)
    && Array.isArray(snapshot.history);
}

function isAutoTradingEconomics(payload: unknown): payload is AutoTradingEconomics {
  if (!payload || typeof payload !== "object") return false;
  const economics = payload as Record<string, unknown>;
  const nullableNumbers = ["tradingPnlBeforeAi", "tradingFees", "unrealizedPnl"];
  const aiUsage = economics.aiUsage;
  return economics.currency === "USDT"
    && ["paper", "testnet", "live"].includes(String(economics.executionMode))
    && typeof economics.tradeCount === "number"
    && Number.isInteger(economics.tradeCount)
    && economics.tradeCount >= 0
    && nullableNumbers.every((field) =>
      economics[field] === null
      || (typeof economics[field] === "number" && Number.isFinite(economics[field]))
    )
    && typeof economics.realizedPnl === "number"
    && Number.isFinite(economics.realizedPnl)
    && typeof economics.tradingFeesEstimated === "boolean"
    && typeof economics.estimatedFeeCount === "number"
    && Number.isInteger(economics.estimatedFeeCount)
    && economics.estimatedFeeCount >= 0
    && typeof economics.feeEvidenceComplete === "boolean"
    && typeof economics.aiUsageEvidenceComplete === "boolean"
    && economics.aiCostUsdt === null
    && economics.aiCostStatus === "unpriced"
    && economics.netPnlAfterAi === null
    && (
      aiUsage === null
      || (
        typeof aiUsage === "object"
        && ["callCount", "inputTokens", "outputTokens", "totalTokens", "latencyMs"].every((field) =>
          typeof (aiUsage as Record<string, unknown>)[field] === "number"
          && Number.isInteger((aiUsage as Record<string, unknown>)[field])
          && ((aiUsage as Record<string, unknown>)[field] as number) >= 0
        )
        && ((aiUsage as Record<string, unknown>).callCount as number) > 0
        && typeof (aiUsage as Record<string, unknown>).providerId === "string"
        && (
          (aiUsage as Record<string, unknown>).model === null
          || typeof (aiUsage as Record<string, unknown>).model === "string"
        )
      )
    );
}

export async function loadAutoTradingSnapshot(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
) {
  const response = await fetcher(buildApiUrl(baseUrl, "api/execution/auto-paper-trading"));
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof payload === "object" && payload && "detail" in payload
        ? String(payload.detail)
        : `HTTP ${response.status}`
    );
  }
  if (!isAutoTradingSnapshot(payload)) {
    throw new Error("auto_trading_snapshot_invalid");
  }
  return payload;
}

export interface DynamicTradingInstrument {
  symbol: string;
  name: string;
  market: "ashare" | "us" | "crypto";
  price?: number | null;
  changePct: number;
}

interface MonitoringIncident {
  incidentId: string;
  incidentKey: string;
  status: "active" | "resolved";
  severity: "warning" | "critical";
  title: string;
  detail: string;
  nextAction: string;
  openedAt: string;
  resolvedAt: string | null;
  occurrenceCount: number;
}

interface MonitoringJob {
  jobId: string;
  runnerState: "running" | "stopping" | "stopped";
  cycleCount: number;
  consecutiveFailures: number;
  lastCycleAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  nextEligibleRunAt: string | null;
  deliveryFailureCount: number;
  lastDeliveryErrorAt: string | null;
  lastDeliveryError: string | null;
  health: { status: string; detail: string };
}

interface MonitoringObservedJob {
  jobId: string;
  status: string;
  runnerState: string;
  scheduleKind: "continuous" | "market_calendar";
  calendarStatus: string;
  lastCycleAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  consecutiveFailures: number;
  nextEligibleRunAt: string | null;
}

export interface MonitoringSnapshot {
  schemaVersion: 1;
  status: "healthy" | "attention" | "degraded" | "waiting";
  reason: string;
  nextAction: string;
  job: MonitoringJob;
  observedJobs: MonitoringObservedJob[];
  activeIncidents: MonitoringIncident[];
  incidents: MonitoringIncident[];
  notifications: Array<{
    eventId: string;
    createdAt: string;
    metadata: {
      lifecycle?: "active" | "recovered";
      deliveryStatus?: string;
    };
  }>;
  channel: {
    type: "webhook";
    configured: boolean;
    status: "ready" | "unconfigured" | "invalid";
    configurationError: string | null;
  };
  tradingActionsAvailable: false;
}

export function isMonitoringSnapshot(payload: unknown): payload is MonitoringSnapshot {
  if (!payload || typeof payload !== "object") return false;
  const snapshot = payload as Record<string, unknown>;
  if (!snapshot.job || typeof snapshot.job !== "object") return false;
  if (!snapshot.channel || typeof snapshot.channel !== "object") return false;
  const job = snapshot.job as Record<string, unknown>;
  const channel = snapshot.channel as Record<string, unknown>;
  const health = job.health;
  return snapshot.schemaVersion === 1
    && ["healthy", "attention", "degraded", "waiting"].includes(String(snapshot.status))
    && typeof snapshot.reason === "string"
    && typeof snapshot.nextAction === "string"
    && Array.isArray(snapshot.observedJobs)
    && snapshot.observedJobs.every(
      (item) => Boolean(item && typeof item === "object"
        && typeof (item as Record<string, unknown>).jobId === "string")
    )
    && Array.isArray(snapshot.activeIncidents)
    && snapshot.activeIncidents.every(
      (item) => Boolean(item && typeof item === "object"
        && typeof (item as Record<string, unknown>).title === "string"
        && typeof (item as Record<string, unknown>).detail === "string"
        && typeof (item as Record<string, unknown>).nextAction === "string")
    )
    && Array.isArray(snapshot.incidents)
    && Array.isArray(snapshot.notifications)
    && snapshot.notifications.every(
      (item) => Boolean(item && typeof item === "object"
        && (item as Record<string, unknown>).metadata
        && typeof (item as Record<string, unknown>).metadata === "object")
    )
    && typeof job.jobId === "string"
    && typeof job.cycleCount === "number"
    && typeof job.consecutiveFailures === "number"
    && typeof job.deliveryFailureCount === "number"
    && Boolean(health && typeof health === "object"
      && typeof (health as Record<string, unknown>).detail === "string")
    && channel.type === "webhook"
    && ["ready", "unconfigured", "invalid"].includes(String(channel.status))
    && snapshot.tradingActionsAvailable === false;
}

function localizeMonitoringText(value: string) {
  return value.replace(/\s*Webhook/g, "回调通知");
}

type Draft = Pick<
  AutoTradingState,
  "triggerPct" | "orderNotional" | "stopLossPct" | "takeProfitPct" | "dailyLossLimitPct"
  | "dailyProfitDrawdownLimitPct" | "maxTradesPerHour" | "providerId" | "executionMode"
  | "liveOperator"
>;

const defaultDraft: Draft = {
  triggerPct: 0.3,
  orderNotional: 10,
  stopLossPct: 1,
  takeProfitPct: 2,
  dailyLossLimitPct: 2,
  dailyProfitDrawdownLimitPct: 2,
  maxTradesPerHour: 3,
  providerId: "auto",
  executionMode: "paper",
  liveOperator: ""
};

type SystemNotificationPermission = NotificationPermission | "unsupported";

export function hasUnresolvedAutoOrder(
  state: Pick<AutoTradingState, "executionMode" | "lastTestnetOrder" | "lastLiveOrder"> | undefined
) {
  const order = state?.executionMode === "live"
    ? state.lastLiveOrder
    : state?.executionMode === "testnet" ? state.lastTestnetOrder : null;
  return ["submission_pending", "open", "partially_filled", "reconciliation_required"]
    .includes(order?.state ?? "");
}

export function autoTradingActionPath(
  state: Parameters<typeof hasUnresolvedAutoOrder>[0]
) {
  return hasUnresolvedAutoOrder(state)
    ? "api/execution/auto-paper-trading/reconciliations"
    : "api/execution/auto-paper-trading/evaluations";
}

export async function authorizeAutoLiveSession(
  baseUrl: string,
  operator: string,
  fetcher: WorkspaceFetcher = defaultFetcher
) {
  const response = await fetcher(buildApiUrl(baseUrl, "api/execution/auto-paper-trading"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      liveConfirmed: true,
      liveOperator: operator.trim()
    })
  });
  const payload = await response.json() as unknown;
  if (!response.ok) {
    throw new Error(
      typeof payload === "object" && payload && "detail" in payload
        ? String((payload as Record<string, unknown>).detail)
        : `HTTP ${response.status}`
    );
  }
  if (
    !payload
    || typeof payload !== "object"
    || (payload as Record<string, unknown>).liveTradingAllowed !== true
  ) {
    throw new Error("自动交易尚未处于已启用的生产实盘模式");
  }
}

export function autoTradingAttention(
  state: Pick<
    AutoTradingState,
    "status" | "detail" | "executionMode" | "lastTestnetOrder" | "lastLiveOrder" | "lastAccountCheck"
  > | undefined
) {
  if (!state) return null;
  if (hasUnresolvedAutoOrder(state)) {
    return {
      tone: "warning",
      title: "上一笔委托等待对账",
      detail: "系统已停止新委托；可点击“立即对账”查询原订单。"
    };
  }
  if (state.status === "account_mismatch") {
    const pendingOrderCount = state.lastAccountCheck?.unexpectedOpenOrderCount
      ?? state.lastAccountCheck?.unexpectedOpenAutoOrderCount
      ?? 0;
    const accountSnapshot = state.lastAccountCheck?.accountSnapshot;
    if (pendingOrderCount) {
      return {
        tone: "danger",
        title: "存在未决现货挂单",
        detail: `发现 ${pendingOrderCount} 笔未决现货挂单。请先在交易所核对并处理，再重新检查。`
      };
    }
    if (accountSnapshot?.valuationComplete === false) {
      return {
        tone: "danger",
        title: "账户估值不完整",
        detail: `${accountSnapshot.unpricedAssets.join("、")} 无法按 USDT 估值，请先处理该资产或补充直接交易对。`
      };
    }
    if (state.lastAccountCheck?.checkCode === "binance_spot_account_identity_changed") {
      return {
        tone: "danger",
        title: "交易所账户已变化",
        detail: "当前 Binance Spot 账户与已同步账户不一致，自动交易已停止。"
      };
    }
    return {
      tone: "danger",
      title: "交易所账户检查未通过",
      detail: state.detail
    };
  }
  if (state.status === "risk_paused") {
    return {
      tone: "warning",
      title: "风险保护已暂停新交易",
      detail: state.detail
    };
  }
  if (["ai_error", "data_blocked", "evaluation_error"].includes(state.status)) {
    return {
      tone: "warning",
      title: "本轮自动评估未执行",
      detail: state.detail
    };
  }
  if (state.status === "order_rejected") {
    return {
      tone: "danger",
      title: "委托未成交",
      detail: state.detail
    };
  }
  return null;
}

export function autoTradingNotification(
  state: Pick<
    AutoTradingState,
    "status" | "detail" | "executionMode" | "lastTestnetOrder" | "lastLiveOrder" | "lastAccountCheck"
    | "runnerState" | "runnerIntervalSeconds" | "runnerCycleCount" | "consecutiveRunnerFailures"
    | "lastRunnerCycleAt" | "lastRunnerSuccessAt" | "lastRunnerErrorAt"
  > | undefined,
  nowMs = Date.now(),
  statusReadError?: string | null
) {
  if (statusReadError) {
    return {
      key: "connection:api",
      title: "自动交易服务连接中断",
      body: statusReadError
    };
  }
  const attention = autoTradingAttention(state);
  if (!state) return null;
  if (attention) {
    const orderState = state.executionMode === "live"
      ? state.lastLiveOrder?.state
      : state.executionMode === "testnet" ? state.lastTestnetOrder?.state : "";
    return {
      key: `attention:${state.status}:${orderState ?? ""}`,
      title: attention.title,
      body: attention.detail
    };
  }
  const runtime = autoTradingRuntimeHealth(state, nowMs);
  if (runtime.tone !== "danger") return null;
  return {
    key: `runner:${runtime.reason}`,
    title: runtime.title,
    body: runtime.reason === "stale"
      ? `自动交易后台已超过 ${runtime.staleAfterSeconds} 秒未上报心跳。`
      : runtime.reason === "failures"
        ? `自动交易后台连续 ${state.consecutiveRunnerFailures} 轮运行失败。`
        : "自动交易后台运行器已停止。"
  };
}

export function AutoTradingEconomicsSummary({
  economics
}: {
  economics?: AutoTradingEconomics;
}) {
  const usage = economics?.aiUsage;
  const modeEvidence = !economics
    ? "账本模式不可得"
    : economics.executionMode === "live"
      ? "生产策略账本"
      : economics.executionMode === "testnet"
        ? "测试网模拟金额"
        : "纸面模拟金额";
  const feeEvidence = !economics
    ? "正在读取费用证据"
    : !economics.feeEvidenceComplete
      ? "手续费证据不完整"
      : economics.tradingFeesEstimated
        ? "含估算手续费"
        : "手续费证据完整";

  return (
    <section aria-label="自动交易经济账本" className="dynamic-trading-economics">
      <header>
        <span><WalletCards size={14} /><strong>自动交易经济账本</strong></span>
        <em>{modeEvidence} · {feeEvidence}</em>
      </header>
      <dl>
        <div>
          <dt>AI 成本前交易盈亏</dt>
          <dd className={(economics?.tradingPnlBeforeAi ?? 0) < 0 ? "negative" : "positive"}>
            {economics?.tradingPnlBeforeAi === null || !economics
              ? "不可得"
              : `${signedLedgerMoney(economics.tradingPnlBeforeAi)} USDT`}
          </dd>
        </div>
        <div>
          <dt>交易手续费</dt>
          <dd>{economics?.tradingFees === null || !economics
            ? "不可得"
            : `${ledgerMoney(economics.tradingFees)} USDT`}</dd>
        </div>
        <div>
          <dt>已实现盈亏</dt>
          <dd className={(economics?.realizedPnl ?? 0) < 0 ? "negative" : "positive"}>
            {!economics ? "不可得" : `${signedLedgerMoney(economics.realizedPnl)} USDT`}
          </dd>
        </div>
        <div>
          <dt>未实现盈亏</dt>
          <dd className={(economics?.unrealizedPnl ?? 0) < 0 ? "negative" : "positive"}>
            {economics?.unrealizedPnl === null || !economics
              ? "不可得"
              : `${signedLedgerMoney(economics.unrealizedPnl)} USDT`}
          </dd>
        </div>
        <div>
          <dt>智能模型成本</dt>
          <dd>未计价</dd>
          <small>{usage
            ? `${usage.callCount} 次 · ${formatNumber(usage.totalTokens)} 令牌 · 最近 ${providerLabel(usage.providerId)} / ${usage.model || "模型未报告"} / ${usage.latencyMs} 毫秒${economics?.aiUsageEvidenceComplete ? "" : " · 历史用量不完整"}`
            : !economics
              ? "正在读取调用证据"
              : economics.aiUsageEvidenceComplete
                ? "尚无外部模型调用"
                : "旧版本未累计完整用量"}</small>
        </div>
        <div>
          <dt>扣除模型成本后净盈亏</dt>
          <dd>不可得</dd>
          <small>等待服务商账单或显式计价</small>
        </div>
      </dl>
      <footer>
        <span>交易盈亏 = 已实现盈亏 + 未实现盈亏，已包含已发生手续费，尚未计未来退出费用。</span>
        <span>模型调用仅作运行遥测，不是服务商账单；生产模式也不代表 Binance 全账户收益。</span>
      </footer>
    </section>
  );
}

export function AutoTradingLedger({
  history,
  state
}: {
  history: AutoTradingHistoryEvent[];
  state: Pick<
    AutoTradingState,
    "executionMode" | "lastDecision" | "lastDecisionContract" | "lastLiveOrder" | "lastTestnetOrder"
    | "lastOrderResult" | "lastDustDisposition" | "position" | "realizedPnl" | "accountAuthority"
  > | undefined;
}) {
  const decision = state?.lastDecision;
  const contract = state?.lastDecisionContract;
  const orderResult = state?.lastOrderResult;
  const dust = state?.lastDustDisposition;
  const order = state?.executionMode === "live"
    ? state.lastLiveOrder
    : state?.executionMode === "testnet" ? state.lastTestnetOrder : null;

  return (
    <details className="execution-auto-paper-ledger">
      <summary>
        <strong>自动交易运行台账</strong>
        <span>
          {decision ? `${decisionLabel(decision.action)} · ${Math.round(decision.confidence * 100)}%` : "等待首次判断"}
          {" · "}{history.length ? `最近 ${history.length} 笔成交` : "尚无成交"}
        </span>
      </summary>
      <div className="execution-auto-paper-ledger-body">
        <dl className="execution-auto-paper-ledger-summary">
          <div>
            <dt>最近判断</dt>
            <dd>{decision ? `${decisionLabel(decision.action)} · ${Math.round(decision.confidence * 100)}%` : "待评估"}</dd>
            <small>{decision ? providerLabel(decision.providerId) : "尚无 AI 判断"}</small>
          </div>
          <div>
            <dt>已实现盈亏</dt>
            <dd className={(state?.realizedPnl ?? 0) < 0 ? "negative" : "positive"}>
              {signedMoney(state?.realizedPnl)} USDT
            </dd>
            <small>策略账本累计</small>
          </div>
          <div>
            <dt>当前持仓</dt>
            <dd>{formatNumber(state?.position)} BTC</dd>
            <small>{state?.accountAuthority === "binance_spot" ? "Binance Spot 现货总量" : "仅本策略持仓"}</small>
          </div>
          <div>
            <dt>委托状态</dt>
            <dd>{orderStateLabel(orderResult?.state ?? order?.state)}</dd>
            <small>{executionModeLabel(state?.executionMode)}</small>
          </div>
        </dl>

        {decision ? (
          <p className="execution-auto-paper-decision">
            <time dateTime={decision.evaluatedAt}>{formatTime(decision.evaluatedAt)}</time>
            <span>{decision.reason}</span>
          </p>
        ) : null}

        {contract ? (
          <section className="execution-auto-paper-contract">
            <strong>决策证据链</strong>
            <dl className="execution-auto-paper-ledger-summary">
              <div>
                <dt>市场快照</dt>
                <dd title={contract.marketSnapshot.snapshotHash}>
                  {contract.marketSnapshot.snapshotHash.slice(0, 16)}
                </dd>
                <small>{contract.marketSnapshot.barCount} 根完整 K 线</small>
              </div>
              <div>
                <dt>{contract.decisionProposal.source === "ai" ? "AI 提案" : "规则提案"}</dt>
                <dd>{decisionLabel(contract.decisionProposal.action)}</dd>
                <small>{providerLabel(contract.decisionProposal.providerId)}</small>
              </div>
              <div>
                <dt>标准信号</dt>
                <dd>{decisionLabel(contract.signal.action)}</dd>
                <small>{Math.round(contract.signal.confidence * 100)}% 置信度</small>
              </div>
            </dl>
            <dl className="execution-auto-paper-ledger-summary execution-auto-paper-targets">
              <div>
                <dt>组合目标</dt>
                <dd>{formatNumber(contract.portfolioTarget.targetQuantity)} BTC</dd>
                <small>
                  目标变动 {contract.portfolioTarget.deltaQuantity >= 0 ? "+" : ""}
                  {formatNumber(contract.portfolioTarget.deltaQuantity)} BTC
                </small>
              </div>
              <div>
                <dt>风险调整</dt>
                <dd className={contract.riskAdjustedTarget.decision === "reject" ? "negative" : "positive"}>
                  {riskDecisionLabel(contract.riskAdjustedTarget.decision)}
                </dd>
                <small>
                  批准 {formatNumber(contract.riskAdjustedTarget.approvedTargetQuantity)} BTC
                  {" · "}{contract.riskAdjustedTarget.reason}
                </small>
              </div>
              {contract.orderIntent ? (
                <div>
                  <dt>订单意图</dt>
                  <dd>
                    {decisionLabel(contract.orderIntent.side)} {formatNumber(contract.orderIntent.quantity)} BTC
                  </dd>
                  <small>市价委托 · {money(contract.orderIntent.notionalValue)} USDT</small>
                  {contract.orderIntent.marketRules ? (
                    <small>
                      数量精度 {formatNumber(contract.orderIntent.marketRules.quantityPrecision)}
                      {" · "}最小量 {formatNumber(contract.orderIntent.marketRules.minimumQuantity)}
                      {" · "}最小金额 {money(contract.orderIntent.marketRules.minimumNotional ?? undefined)}
                    </small>
                  ) : null}
                  {contract.orderIntent.executionAssumptions ? (
                    <small>
                      费率 {percentRate(contract.orderIntent.executionAssumptions.feeRate)}
                      {" · "}{contract.orderIntent.executionAssumptions.slippageModel === "venue_market_fill"
                        ? "滑点按成交回执"
                        : `滑点 ${formatNumber(contract.orderIntent.executionAssumptions.slippageBps)} bps`}
                    </small>
                  ) : null}
                </div>
              ) : null}
              {contract.orderIntent && orderResult?.orderIntentId === contract.orderIntent.orderIntentId ? (
                <div>
                  <dt>订单结果</dt>
                  <dd>{orderStateLabel(orderResult.state)}</dd>
                  <small>
                    成交 {formatNumber(orderResult.filledQuantity)} BTC
                    {orderResult.filledNotional > 0 ? ` · ${money(orderResult.filledNotional)} USDT` : ""}
                  </small>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        {dust ? (
          <section className="execution-auto-paper-contract">
            <strong>尘埃仓位已释放</strong>
            <p>
              {formatNumber(dust.quantity)} BTC · 估值 {money(dust.estimatedNotional)} USDT
            </p>
            <small>
              低于交易所最小交易金额，已退出本策略账本；未提交交易所委托。
            </small>
          </section>
        ) : null}

        {history.length ? (
          <ol className="execution-auto-paper-trades">
            {history.map((event) => {
              const metadata = event.metadata;
              const mode = stringValue(metadata.executionMode);
              const side = stringValue(metadata.side);
              const feeEstimated = metadata.feeEstimated === true;
              const fee = formatNumber(numberValue(metadata.fee));
              const feeBreakdown = formatFeeBreakdown(metadata.feeBreakdown);
              return (
                <li key={event.eventId}>
                  <header>
                    <time dateTime={event.createdAt}>{formatTime(event.createdAt)}</time>
                    <span>{executionModeLabel(mode)}</span>
                    <strong className={side}>{side === "buy" ? "买入" : "卖出"}</strong>
                  </header>
                  <p>
                    <strong>{stringValue(metadata.symbol, "BTC/USDT")}</strong>
                    <span>{formatNumber(numberValue(metadata.quantity))} BTC @ {formatNumber(numberValue(metadata.price))}</span>
                  </p>
                  <dl>
                    <div>
                      <dt>成交金额</dt>
                      <dd>{money(numberValue(metadata.notional))} USDT</dd>
                    </div>
                    <div>
                      <dt>手续费</dt>
                      <dd>
                        {fee} USDT · {feeEstimated ? "估算" : "交易所实报"}
                        {feeBreakdown && feeBreakdown !== `${fee} USDT` ? ` · 实扣 ${feeBreakdown}` : null}
                      </dd>
                    </div>
                  </dl>
                  <small>
                    {providerLabel(stringValue(metadata.providerId, "rules"))}
                    {" · "}{Math.round((numberValue(metadata.confidence) ?? 0) * 100)}%
                    {" · "}{stringValue(metadata.reason, "未记录判断依据")}
                  </small>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="execution-auto-paper-ledger-empty">
            <strong>尚无自动成交</strong>
            <span>策略成交后，这里会显示成交价格、手续费和判断依据。</span>
          </div>
        )}
      </div>
    </details>
  );
}

export function autoTradingDailyDrawdown(
  state: Pick<
    AutoTradingState,
    "equity" | "dailyStartEquity" | "dailyReleasedDustNotional" | "dailyLossDrawdownPct"
  > | undefined
) {
  if (state?.dailyLossDrawdownPct !== undefined) {
    return Math.max(0, state.dailyLossDrawdownPct);
  }
  const adjustedStartEquity = Math.max(
    0,
    (state?.dailyStartEquity ?? 0) - (state?.dailyReleasedDustNotional ?? 0)
  );
  return adjustedStartEquity > 0
    ? Math.max(0, (adjustedStartEquity - (state?.equity ?? adjustedStartEquity)) / adjustedStartEquity * 100)
    : 0;
}

export function autoTradingProfitDrawdown(
  state: Pick<
    AutoTradingState,
    "equity" | "dailyStartEquity" | "dailyPeakEquity" | "dailyReleasedDustNotional"
    | "dailyProfitDrawdownPct"
  > | undefined
) {
  if (state?.dailyProfitDrawdownPct !== undefined) {
    return Math.max(0, state.dailyProfitDrawdownPct);
  }
  const releasedDust = state?.dailyReleasedDustNotional ?? 0;
  const adjustedStartEquity = Math.max(0, (state?.dailyStartEquity ?? 0) - releasedDust);
  const adjustedPeakEquity = Math.max(
    adjustedStartEquity,
    (state?.dailyPeakEquity ?? adjustedStartEquity) - releasedDust
  );
  return adjustedPeakEquity > adjustedStartEquity
    ? Math.max(0, (adjustedPeakEquity - (state?.equity ?? adjustedPeakEquity)) / adjustedPeakEquity * 100)
    : 0;
}

export function AutoTradingRiskOverview({
  state
}: {
  state: Pick<
    AutoTradingState,
    "executionMode" | "equity" | "dailyStartEquity" | "dailyLossLimitPct" | "maxTradesPerHour"
    | "tradeTimestamps" | "position" | "avgCost" | "stopLossPct" | "takeProfitPct"
    | "lastAccountCheck" | "liveAuthorizedUntil" | "dailyReleasedDustNotional"
    | "dailyPeakEquity" | "dailyLossDrawdownPct" | "dailyProfitDrawdownPct"
    | "dailyProfitDrawdownLimitPct" | "dailyRiskHaltReason"
  > & Partial<Pick<AutoTradingState, "liveConfirmed" | "liveSessionTtlHours">> | undefined;
}) {
  const lossDrawdown = autoTradingDailyDrawdown(state);
  const profitDrawdown = autoTradingProfitDrawdown(state);
  const usedTrades = state?.tradeTimestamps.length ?? 0;
  const remainingTrades = Math.max(0, (state?.maxTradesPerHour ?? 0) - usedTrades);
  const hasPosition = (state?.position ?? 0) > 0 && (state?.avgCost ?? 0) > 0;
  const stopLossPrice = hasPosition
    ? (state?.avgCost ?? 0) * (1 - (state?.stopLossPct ?? 0) / 100)
    : null;
  const takeProfitPrice = hasPosition
    ? (state?.avgCost ?? 0) * (1 + (state?.takeProfitPct ?? 0) / 100)
    : null;
  const accountCovered = state?.lastAccountCheck?.accountCovered;

  return (
    <section className="execution-auto-paper-risk" aria-label="风险边界">
      <header>
        <strong>风险边界</strong>
        <span>后端每轮强制检查</span>
      </header>
      <dl>
        <div className={state?.dailyRiskHaltReason?.includes("亏损") ? "danger" : undefined}>
          <dt>亏损回撤</dt>
          <dd>{lossDrawdown.toFixed(2)}% / {(state?.dailyLossLimitPct ?? 0).toFixed(2)}%</dd>
          <small>
            {(state?.dailyReleasedDustNotional ?? 0) > 0
              ? `已排除 ${money(state?.dailyReleasedDustNotional)} USDT 尾仓转出；上限仅暂停买入与加仓`
              : "达到上限后仅暂停买入与加仓"}
          </small>
        </div>
        <div className={state?.dailyRiskHaltReason?.includes("盈利") ? "danger" : undefined}>
          <dt>盈利回撤</dt>
          <dd>{profitDrawdown.toFixed(2)}% / {(state?.dailyProfitDrawdownLimitPct ?? 0).toFixed(2)}%</dd>
          <small>仅在权益高于当日起点并形成峰值后计算</small>
        </div>
        <div>
          <dt>小时成交额度</dt>
          <dd>剩余 {remainingTrades} 次</dd>
          <small>已用 {usedTrades} / {state?.maxTradesPerHour ?? 0}</small>
        </div>
        <div>
          <dt>持仓退出价格</dt>
          <dd>
            {hasPosition
              ? `止损 ${formatNumber(stopLossPrice)} · 止盈 ${formatNumber(takeProfitPrice)}`
              : "无持仓"}
          </dd>
          <small>按策略平均成本计算</small>
        </div>
        <div className={accountCovered === false ? "danger" : undefined}>
          <dt>账户覆盖</dt>
          <dd>{accountCovered === true ? "已通过" : accountCovered === false ? "未通过" : "待检查"}</dd>
          <small>
            {state?.lastAccountCheck?.checkedAt
              ? `最近检查 ${formatTime(state.lastAccountCheck.checkedAt)}`
              : "尚无检查记录"}
          </small>
        </div>
        {state?.executionMode === "live" ? (
          <div>
            <dt>生产授权</dt>
            <dd>{liveAuthorizationLabel(state)}</dd>
            <small>
              {state.liveSessionTtlHours === 0
                ? "手动暂停或急停前持续有效"
                : `${state.liveSessionTtlHours ?? 8} 小时授权，过期阻止新委托`}
            </small>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

type AutoTradingRuntimeState = Pick<
  AutoTradingState,
  "runnerState" | "runnerIntervalSeconds" | "runnerCycleCount" | "consecutiveRunnerFailures"
  | "lastRunnerCycleAt" | "lastRunnerSuccessAt" | "lastRunnerErrorAt"
>;

export function autoTradingRuntimeHealth(
  state: AutoTradingRuntimeState | undefined,
  nowMs = Date.now()
) {
  const lastCycleAt = state?.lastRunnerCycleAt ? Date.parse(state.lastRunnerCycleAt) : Number.NaN;
  const heartbeatAgeSeconds = Number.isFinite(lastCycleAt)
    ? Math.max(0, Math.round((nowMs - lastCycleAt) / 1000))
    : null;
  const staleAfterSeconds = Math.max(90, (state?.runnerIntervalSeconds ?? 35) * 3);
  const recovered = Boolean(
    state?.lastRunnerErrorAt
    && state.lastRunnerSuccessAt
    && Date.parse(state.lastRunnerSuccessAt) > Date.parse(state.lastRunnerErrorAt)
  );
  const heartbeatStale = heartbeatAgeSeconds !== null && heartbeatAgeSeconds > staleAfterSeconds;
  const reason = !state?.lastRunnerCycleAt ? "waiting"
    : state.runnerState !== "running" ? "stopped"
      : state.consecutiveRunnerFailures > 0 ? "failures"
        : heartbeatStale ? "stale" : "healthy";
  const title = reason === "waiting" ? "等待后台首次心跳"
    : reason === "stopped" ? "后台运行器已停止"
      : reason === "failures" ? `后台连续失败 ${state?.consecutiveRunnerFailures ?? 0} 次`
        : reason === "stale" ? "后台心跳已中断" : "后台运行正常";
  return {
    heartbeatAgeSeconds,
    reason,
    recovered,
    staleAfterSeconds,
    title,
    tone: ["stopped", "failures", "stale"].includes(reason)
      ? "danger"
      : reason === "healthy" ? "healthy" : "waiting"
  };
}

export function AutoTradingRuntimeHealth({
  nowMs = Date.now(),
  state
}: {
  nowMs?: number;
  state: Pick<
    AutoTradingState,
    "runnerState" | "runnerIntervalSeconds" | "runnerCycleCount" | "consecutiveRunnerFailures"
    | "lastRunnerCycleAt" | "lastRunnerSuccessAt" | "lastRunnerErrorAt"
  > | undefined;
}) {
  const { heartbeatAgeSeconds, recovered, title, tone } = autoTradingRuntimeHealth(state, nowMs);

  return (
    <div className={`execution-auto-runtime-health ${tone}`} role="status">
      <strong>{title}</strong>
      <span>已完成 {state?.runnerCycleCount ?? 0} 轮</span>
      <span>{heartbeatAgeSeconds === null ? "尚无心跳时间" : `最近心跳 ${heartbeatAgeSeconds} 秒前`}</span>
      {recovered ? <span>上次异常已恢复</span> : null}
    </div>
  );
}

export function AutoTradingServerMonitoring({
  error,
  snapshot
}: {
  error?: string | null;
  snapshot?: MonitoringSnapshot | null;
}) {
  const tone = error || snapshot?.status === "degraded"
    ? "danger"
    : snapshot?.status === "attention" ? "warning"
      : snapshot?.status === "healthy" ? "healthy" : "waiting";
  const active = snapshot?.activeIncidents[0];
  const observed = snapshot?.observedJobs.find((job) => job.jobId.startsWith("auto-trading:"));
  const recoveredCount = snapshot?.notifications.filter(
    (item) => item.metadata.lifecycle === "recovered"
  ).length ?? 0;
  const channelLabel = snapshot?.channel.status === "ready"
    ? "回调通知已就绪"
    : snapshot?.channel.status === "invalid"
      ? "回调通知配置无效" : "回调通知未配置";
  const nextAction = snapshot ? localizeMonitoringText(snapshot.nextAction) : undefined;

  return (
    <section className={`execution-auto-server-monitoring ${tone}`}
      aria-label="服务端监控告警">
      <header>
        <div>
          <span>服务端运行告警</span>
          <strong>{error ? "监控状态读取失败" : snapshot?.reason ?? "等待服务端监控状态"}</strong>
        </div>
        <em>{snapshot?.activeIncidents.length ?? 0} 个待恢复事件</em>
      </header>
      <p>{error ?? nextAction ?? "本区域只读取运行状态，不执行评估、对账或委托。"}</p>
      <dl>
        <div>
          <dt>监控任务</dt>
          <dd title={snapshot?.job.health.detail ?? "等待首次运行"}>
            {snapshot?.job.health.detail ?? "等待首次运行"}
          </dd>
        </div>
        <div>
          <dt>下次可运行</dt>
          <dd title={formatTime(observed?.nextEligibleRunAt ?? snapshot?.job.nextEligibleRunAt)}>
            {formatTime(observed?.nextEligibleRunAt ?? snapshot?.job.nextEligibleRunAt)}
          </dd>
        </div>
        <div>
          <dt>外部渠道</dt>
          <dd title={channelLabel}>{channelLabel}</dd>
        </div>
        <div>
          <dt>已恢复提醒</dt>
          <dd title={`${recoveredCount} 条`}>{recoveredCount} 条</dd>
        </div>
      </dl>
      {active ? (
        <div className="execution-auto-server-incident" role="alert">
          <strong>{active.title}</strong>
          <span>{active.detail}</span>
          <small>下一步：{localizeMonitoringText(active.nextAction)}</small>
        </div>
      ) : null}
      <details>
        <summary>运行与投递证据</summary>
        <div>
          <span>任务 ID：{snapshot?.job.jobId ?? "server-monitoring"}</span>
          <span>累计轮次：{snapshot?.job.cycleCount ?? 0}</span>
          <span>最近成功：{formatTime(snapshot?.job.lastSuccessAt)}</span>
          <span>连续失败：{snapshot?.job.consecutiveFailures ?? 0}</span>
          <span>投递失败：{snapshot?.job.deliveryFailureCount ?? 0}</span>
          {snapshot?.job.lastError ? <span>最近错误：{snapshot.job.lastError}</span> : null}
          {snapshot?.job.lastDeliveryError
            ? <span>最近投递错误：{snapshot.job.lastDeliveryError}</span> : null}
        </div>
      </details>
    </section>
  );
}

export function AutoTradingOperationsOverview({
  monitoring,
  monitoringError,
  onOpenAudit,
  onOpenDynamicTrading,
  onOpenExecution,
  snapshot,
  statusError
}: {
  monitoring?: MonitoringSnapshot | null;
  monitoringError?: string | null;
  onOpenAudit?: () => void;
  onOpenDynamicTrading?: () => void;
  onOpenExecution?: () => void;
  snapshot?: AutoTradingSnapshot | null;
  statusError?: string | null;
}) {
  const state = snapshot?.state;
  const runtime = autoTradingRuntimeHealth(state);
  const attention = autoTradingAttention(state);
  const liveMode = state?.executionMode === "live";
  const bindingBlocked = snapshot?.strategyBinding?.status === "blocked";
  const bindingReady = snapshot?.strategyBinding?.status === "ready";
  const currentOrderState = state?.lastOrderResult?.state
    ?? (liveMode ? state?.lastLiveOrder?.state : state?.lastTestnetOrder?.state);
  const healthy = Boolean(
    snapshot
    && monitoring
    && runtime.tone === "healthy"
    && monitoring.status === "healthy"
    && !attention
    && bindingReady
    && (!liveMode || snapshot.liveTradingAllowed)
  );
  const runtimeBlocked = runtime.tone === "danger";
  const monitoringDegraded = monitoring?.status === "degraded";
  const tone = statusError || monitoringError || runtimeBlocked || monitoringDegraded
    ? "danger"
    : attention || monitoring?.status === "attention" || (snapshot && !bindingReady)
      ? "warning"
      : healthy ? "healthy" : "waiting";
  const headline = statusError || monitoringError
    ? "生产运行状态读取失败"
    : runtimeBlocked
      ? runtime.title
      : monitoringDegraded
        ? monitoring?.reason ?? "服务端监控已降级"
        : attention
          ? attention.title
          : monitoring?.status === "attention"
            ? monitoring.reason
            : !snapshot || !monitoring
      ? "正在读取生产运行状态"
              : bindingBlocked
                ? "生产策略证据已阻断"
                : bindingReady ? monitoring.reason : "生产策略绑定证据待确认";
  const mode = state?.executionMode === "live"
    ? "币安现货生产实盘"
    : state?.executionMode === "testnet" ? "币安现货测试网" : "纸面模拟";

  return (
    <section
      aria-labelledby="operations-production-runtime-title"
      className={`operations-production-runtime ${tone}`}
    >
      <header>
        <div>
          <span>生产运行控制面</span>
          <h2 id="operations-production-runtime-title">生产自动交易运行总览</h2>
          <p>只读汇总活动策略、后台心跳、账户风险、委托状态与服务端告警。</p>
        </div>
        <div className="operations-production-runtime-actions">
          <strong>{headline}</strong>
          <nav aria-label="生产运行详情导航">
            {onOpenDynamicTrading ? (
              <button onClick={onOpenDynamicTrading} type="button">
                动态交易 <ChevronRight size={13} />
              </button>
            ) : null}
            {onOpenExecution ? (
              <button onClick={onOpenExecution} type="button">
                执行授权 <ChevronRight size={13} />
              </button>
            ) : null}
            {onOpenAudit ? (
              <button onClick={onOpenAudit} type="button">
                审计回放 <ChevronRight size={13} />
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      {statusError || attention ? (
        <div className={`operations-production-runtime-alert ${statusError ? "danger" : attention?.tone}`} role="alert">
          <strong>{statusError ? "自动交易状态不可用" : attention?.title}</strong>
          <span>{statusError ?? attention?.detail}</span>
        </div>
      ) : null}

      <div className="operations-production-runtime-metrics">
        <article>
          <span>当前执行</span>
          <strong>{state ? mode : "正在读取"}</strong>
          <small>
            {!state
              ? "等待权威运行状态"
              : liveMode
                ? snapshot?.liveTradingAllowed
                  ? liveAuthorizationLabel(state)
                  : "生产路由受保护，请查看阻断原因"
                : "不会使用生产资金"}
          </small>
        </article>
        <article>
          <span>后台运行器</span>
          <strong>{runtime.title}</strong>
          <small>
            已完成 {state?.runnerCycleCount ?? 0} 轮 · {
              runtime.heartbeatAgeSeconds === null ? "等待心跳" : `${runtime.heartbeatAgeSeconds} 秒前`
            }
          </small>
        </article>
        <article>
          <span>最近自动判断</span>
          <strong>{decisionLabel(state?.lastDecision?.action)}</strong>
          <small>{state?.lastDecision?.evaluatedAt ? formatTime(state.lastDecision.evaluatedAt) : "等待首次判断"}</small>
        </article>
        <article>
          <span>最近委托结果</span>
          <strong>{orderStateLabel(currentOrderState)}</strong>
          <small>{hasUnresolvedAutoOrder(state) ? "仅允许查询原委托并完成对账" : "没有待对账委托"}</small>
        </article>
      </div>

      <AutoTradingProductionStrategyOverview snapshot={snapshot} />
      <AutoTradingRiskOverview state={state} />
      <AutoTradingServerMonitoring error={monitoringError} snapshot={monitoring} />

      <footer>
        本生产总览只读取后端事实，不会自动评估、对账、授权、急停、切换模式或提交委托。
      </footer>
    </section>
  );
}

export function ExecutionAutoPaperTradingSection({
  baseUrl,
  chart,
  fetcher = defaultFetcher,
  instruments = [],
  onOpenAudit,
  onOpenDynamicTrading,
  onOpenExecution,
  onSafetyChange,
  onSnapshotChange,
  onSelectInstrument,
  selectedSymbol,
  variant = "section",
  workflowGuide
}: {
  baseUrl: string;
  chart?: ReactNode;
  fetcher?: WorkspaceFetcher;
  instruments?: DynamicTradingInstrument[];
  onOpenAudit?: () => void;
  onOpenDynamicTrading?: () => void;
  onOpenExecution?: () => void;
  onSafetyChange?: (
    executionMode: AutoTradingState["executionMode"],
    liveTradingAllowed: boolean
  ) => void;
  onSnapshotChange?: (snapshot: AutoTradingSnapshot | null) => void;
  onSelectInstrument?: (instrument: DynamicTradingInstrument) => void;
  selectedSymbol?: string;
  variant?: "section" | "workspace" | "operations";
  workflowGuide?: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<AutoTradingSnapshot | null>(null);
  const [monitoring, setMonitoring] = useState<MonitoringSnapshot | null>(null);
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusReadError, setStatusReadError] = useState<string | null>(null);
  const [monitoringReadError, setMonitoringReadError] = useState<string | null>(null);
  const [testnetConfirmed, setTestnetConfirmed] = useState(false);
  const [liveConfirmed, setLiveConfirmed] = useState(false);
  const [instrumentFilter, setInstrumentFilter] = useState<"all" | "crypto" | "other">("all");
  const [controlTab, setControlTab] = useState<"runtime" | "risk" | "authorization">("runtime");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());
  const [notificationPermission, setNotificationPermission] = useState<SystemNotificationPermission>(
    () => typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const mountedRef = useRef(true);
  const snapshotReadRequestIdRef = useRef(0);
  const monitoringReadRequestIdRef = useRef(0);
  const requestInFlight = useRef(false);
  const lastNotificationKey = useRef<string | null>(null);
  const commitSnapshot = useCallback((next: AutoTradingSnapshot | null) => {
    if (!mountedRef.current) return;
    setSnapshot(next);
    onSnapshotChange?.(next);
  }, [onSnapshotChange]);

  const request = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetcher(buildApiUrl(baseUrl, path), init);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(
        typeof payload === "object" && payload && "detail" in payload
          ? String(payload.detail)
          : `HTTP ${response.status}`
      );
    }
    return payload as T;
  }, [baseUrl, fetcher]);

  const load = useCallback(async () => {
    const requestId = snapshotReadRequestIdRef.current + 1;
    snapshotReadRequestIdRef.current = requestId;
    try {
      const next = await loadAutoTradingSnapshot(baseUrl, fetcher);
      if (!mountedRef.current || snapshotReadRequestIdRef.current !== requestId) return;
      commitSnapshot(next);
      setDraft({
        triggerPct: next.state.triggerPct,
        orderNotional: next.state.orderNotional,
        stopLossPct: next.state.stopLossPct,
        takeProfitPct: next.state.takeProfitPct,
        dailyLossLimitPct: next.state.dailyLossLimitPct,
        dailyProfitDrawdownLimitPct: next.state.dailyProfitDrawdownLimitPct ?? 2,
        maxTradesPerHour: next.state.maxTradesPerHour,
        providerId: next.state.providerId,
        executionMode: next.state.executionMode,
        liveOperator: next.state.liveOperator
      });
      setTestnetConfirmed(next.state.testnetConfirmed);
      setLiveConfirmed(next.state.liveConfirmed);
      setError(null);
      setStatusReadError(null);
    } catch (loadError) {
      if (!mountedRef.current || snapshotReadRequestIdRef.current !== requestId) return;
      const detail = autoTradingErrorMessage(loadError);
      commitSnapshot(null);
      setError(detail);
      setStatusReadError(detail);
    }
  }, [baseUrl, commitSnapshot, fetcher]);

  const refreshMonitoring = useCallback(async () => {
    const requestId = monitoringReadRequestIdRef.current + 1;
    monitoringReadRequestIdRef.current = requestId;
    try {
      const next = await request<unknown>("api/operations/monitoring");
      if (!mountedRef.current || monitoringReadRequestIdRef.current !== requestId) return;
      if (!isMonitoringSnapshot(next)) throw new Error("operations_monitoring_snapshot_invalid");
      setMonitoring(next);
      setMonitoringReadError(null);
    } catch (monitoringError) {
      if (!mountedRef.current || monitoringReadRequestIdRef.current !== requestId) return;
      setMonitoringReadError(autoTradingErrorMessage(monitoringError));
    }
  }, [request]);

  const evaluate = useCallback(async () => {
    if (requestInFlight.current) {
      return;
    }
    requestInFlight.current = true;
    snapshotReadRequestIdRef.current += 1;
    setControlTab("runtime");
    setEvaluating(true);
    setEvaluationFeedback(null);
    try {
      const next = await request<AutoTradingSnapshot>(
        autoTradingActionPath(snapshot?.state),
        { method: "POST" }
      );
      if (!mountedRef.current) return;
      commitSnapshot(next);
      setEvaluationFeedback(
        `${hasUnresolvedAutoOrder(snapshot?.state) ? "对账" : "评估"}完成 · `
        + `${decisionLabel(next.state.lastDecision?.action)} · `
        + formatTime(next.state.lastDecision?.evaluatedAt ?? new Date().toISOString())
      );
      setError(null);
      setStatusReadError(null);
    } catch (evaluationError) {
      if (!mountedRef.current) return;
      setEvaluationFeedback(null);
      setError(autoTradingErrorMessage(evaluationError));
    } finally {
      if (mountedRef.current) setEvaluating(false);
      requestInFlight.current = false;
    }
  }, [commitSnapshot, request, snapshot?.state]);

  const refresh = useCallback(async () => {
    if (requestInFlight.current) return;
    const requestId = snapshotReadRequestIdRef.current + 1;
    snapshotReadRequestIdRef.current = requestId;
    try {
      const next = await loadAutoTradingSnapshot(baseUrl, fetcher);
      if (!mountedRef.current || snapshotReadRequestIdRef.current !== requestId) return;
      commitSnapshot(next);
      setError(null);
      setStatusReadError(null);
    } catch (refreshError) {
      if (!mountedRef.current || snapshotReadRequestIdRef.current !== requestId) return;
      const detail = autoTradingErrorMessage(refreshError);
      commitSnapshot(null);
      setError(detail);
      setStatusReadError(detail);
    }
  }, [baseUrl, commitSnapshot, fetcher]);

  const save = useCallback(async (enabled: boolean) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    snapshotReadRequestIdRef.current += 1;
    setBusy(true);
    try {
      const next = await request<AutoTradingSnapshot>("api/execution/auto-paper-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, enabled, testnetConfirmed, liveConfirmed })
      });
      if (!mountedRef.current) return;
      commitSnapshot(next);
      setTestnetConfirmed(next.state.testnetConfirmed);
      setLiveConfirmed(next.state.liveConfirmed);
      setError(null);
      setStatusReadError(null);
    } catch (saveError) {
      if (!mountedRef.current) return;
      setError(autoTradingErrorMessage(saveError));
    } finally {
      if (mountedRef.current) setBusy(false);
      requestInFlight.current = false;
    }
  }, [commitSnapshot, draft, liveConfirmed, request, testnetConfirmed]);

  useEffect(() => {
    if (snapshot) onSafetyChange?.(snapshot.state.executionMode, snapshot.liveTradingAllowed);
  }, [onSafetyChange, snapshot]);
  useEffect(() => {
    mountedRef.current = true;
    void load();
    void refreshMonitoring();
    const intervalId = window.setInterval(() => {
      void refresh();
      void refreshMonitoring();
    }, AUTO_TRADING_STATUS_REFRESH_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      snapshotReadRequestIdRef.current += 1;
      monitoringReadRequestIdRef.current += 1;
      window.clearInterval(intervalId);
    };
  }, [load, refresh, refreshMonitoring]);
  useEffect(() => {
    setClockNowMs(Date.now());
    if (!snapshot?.state.enabled) return;
    const intervalId = window.setInterval(() => setClockNowMs(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, [snapshot?.state.enabled]);

  const state = snapshot?.state;
  const notification = autoTradingNotification(state, Date.now(), statusReadError);
  useEffect(() => {
    if (notificationPermission !== "granted" || typeof Notification === "undefined") return;
    if (!notification) {
      lastNotificationKey.current = null;
      return;
    }
    if (lastNotificationKey.current === notification.key) return;
    try {
      new Notification(`自动交易：${notification.title}`, {
        body: notification.body,
        tag: `aiqt-auto-trading-${notification.key}`
      });
      lastNotificationKey.current = notification.key;
    } catch {
      setNotificationPermission(Notification.permission);
    }
  }, [notification, notificationPermission]);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return;
    try {
      setNotificationPermission(await Notification.requestPermission());
    } catch {
      setNotificationPermission(Notification.permission);
    }
  };
  const hasUnresolvedOrder = hasUnresolvedAutoOrder(state);
  const attention = autoTradingAttention(state);
  const testnetMode = draft.executionMode === "testnet";
  const liveMode = draft.executionMode === "live";
  const modeLabel = liveMode ? "币安现货生产实盘"
    : testnetMode ? "币安现货测试网" : "模拟账户";
  const updateNumber = (key: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [key]: Number(value) }));
  };

  if (variant === "operations") {
    return (
      <AutoTradingOperationsOverview
        monitoring={monitoring}
        monitoringError={monitoringReadError}
        onOpenAudit={onOpenAudit}
        onOpenDynamicTrading={onOpenDynamicTrading}
        onOpenExecution={onOpenExecution}
        snapshot={snapshot}
        statusError={statusReadError}
      />
    );
  }

  if (variant === "workspace") {
    const runtime = autoTradingRuntimeHealth(state);
    const lossDrawdown = autoTradingDailyDrawdown(state);
    const profitDrawdown = autoTradingProfitDrawdown(state);
    const usedTrades = state?.tradeTimestamps.length ?? 0;
    const remainingTrades = Math.max(0, (state?.maxTradesPerHour ?? 0) - usedTrades);
    const contract = state?.lastDecisionContract;
    const orderIntent = contract?.orderIntent;
    const shownInstruments: DynamicTradingInstrument[] = instruments.length
      ? instruments
      : [{
          symbol: state?.symbol ?? "BTC/USDT",
          name: "Bitcoin",
          market: "crypto" as const,
          price: null,
          changePct: state?.windowChangePct ?? 0
        }];
    const filteredInstruments = shownInstruments.filter((instrument) =>
      instrumentFilter === "all"
      || (instrumentFilter === "crypto" ? instrument.market === "crypto" : instrument.market !== "crypto")
    );
    const activeInstrument = shownInstruments.find((instrument) => instrument.symbol === (selectedSymbol ?? state?.symbol))
      ?? shownInstruments[0];
    const viewingAutoSymbol = activeInstrument?.symbol === (state?.symbol ?? "BTC/USDT");
    const secondsUntilNextCycle = autoTradingCycleCountdown(state, clockNowMs);
    const currentOrderState = state?.lastOrderResult?.state
      ?? (state?.executionMode === "live" ? state.lastLiveOrder?.state : state?.lastTestnetOrder?.state);

    return (
      <section className="dynamic-trading-workspace" aria-labelledby="dynamic-trading-title">
        {workflowGuide}
        <header className="dynamic-trading-heading">
          <div>
            <span>自动交易控制台</span>
            <h2 id="dynamic-trading-title">动态交易</h2>
            <p>查看自动策略从行情快照、AI 判断、风险调整到委托结果的完整进程。</p>
          </div>
          <div className="dynamic-trading-heading-status">
            <span className={`dynamic-trading-status ${runtime.tone}`}>
              <Activity size={13} />
              {runtime.title}
            </span>
            <span className={`dynamic-trading-status ${snapshot?.liveTradingAllowed ? "healthy" : "warning"}`}>
              <ShieldCheck size={13} />
              {snapshot?.liveTradingAllowed ? "生产会话有效" : "生产闸门保护中"}
            </span>
          </div>
        </header>

        <div className="dynamic-trading-terminal">
          <aside className="dynamic-trading-watchlist">
            <header>
              <div>
                <strong>策略标的</strong>
                <span>{shownInstruments.length} 个已关注</span>
              </div>
              <small>自动 / 观察</small>
            </header>
            <div aria-label="策略标的筛选" className="dynamic-trading-watchlist-tabs" role="tablist">
              <button aria-selected={instrumentFilter === "all"}
                className={instrumentFilter === "all" ? "active" : ""}
                onClick={() => setInstrumentFilter("all")} role="tab" type="button">全部</button>
              <button aria-selected={instrumentFilter === "crypto"}
                className={instrumentFilter === "crypto" ? "active" : ""}
                onClick={() => setInstrumentFilter("crypto")} role="tab" type="button">加密货币</button>
              <button aria-selected={instrumentFilter === "other"}
                className={instrumentFilter === "other" ? "active" : ""}
                onClick={() => setInstrumentFilter("other")} role="tab" type="button">其他市场</button>
            </div>
            <div className="dynamic-trading-watchlist-rows">
              {filteredInstruments.map((instrument) => {
                const active = instrument.symbol === activeInstrument?.symbol;
                return (
                  <button
                    className={active ? "active" : ""}
                    key={`${instrument.market}-${instrument.symbol}`}
                    onClick={() => onSelectInstrument?.(instrument)}
                    type="button"
                  >
                    <span>
                      <strong>{instrument.symbol}</strong>
                      <small>{instrument.name} · {instrument.market}</small>
                    </span>
                    <span>
                      <strong>{instrument.price?.toLocaleString("zh-CN", { maximumFractionDigits: 4 }) ?? "—"}</strong>
                      <small className={instrument.changePct < 0 ? "negative" : "positive"}>
                        {instrument.changePct >= 0 ? "+" : ""}{instrument.changePct.toFixed(2)}%
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
            <footer>
              <span>生产自动交易</span>
              <strong>{state?.symbol ?? "BTC/USDT"} · {state?.timeframe ?? "1m"}</strong>
              <small>其他标的仅用于行情观察，不会改变后端固定交易标的。</small>
            </footer>
          </aside>

          <section className="dynamic-trading-chart-panel">
            <header>
              <div>
                <span>
                  {activeInstrument?.symbol ?? state?.symbol ?? "BTC/USDT"} · {viewingAutoSymbol ? "现货自动标的" : "行情观察"}
                </span>
                <strong>
                  {activeInstrument?.price?.toLocaleString("zh-CN", { maximumFractionDigits: 4 }) ?? "—"}
                  <em className={(state?.windowChangePct ?? 0) < 0 ? "negative" : "positive"}>
                    {percent(state?.windowChangePct)}
                  </em>
                </strong>
              </div>
              <dl>
                <div>
                  <dt>时间周期</dt>
                  <dd>{state?.timeframe ?? "1m"}</dd>
                </div>
                <div>
                  <dt>最近判断</dt>
                  <dd>{viewingAutoSymbol ? decisionLabel(state?.lastDecision?.action) : "仅观察"}</dd>
                </div>
                <div>
                  <dt>置信度</dt>
                  <dd>{viewingAutoSymbol && state?.lastDecision ? `${Math.round(state.lastDecision.confidence * 100)}%` : "—"}</dd>
                </div>
                <div>
                  <dt>数据快照</dt>
                  <dd title={viewingAutoSymbol ? contract?.marketSnapshot.snapshotHash : undefined}>
                    {viewingAutoSymbol ? contract?.marketSnapshot.snapshotHash.slice(0, 10) ?? "等待评估" : "观察行情"}
                  </dd>
                </div>
              </dl>
            </header>
            <div className="dynamic-trading-chart">
              {chart ?? <span className="dynamic-trading-chart-empty">正在读取行情图表…</span>}
            </div>
            <footer>
              <span><i className="positive" /> 买入 / 上涨</span>
              <span><i className="negative" /> 卖出 / 下跌</span>
              <span><i className="decision" /> 自动决策</span>
              <small>
                {viewingAutoSymbol
                  ? state?.lastDecision?.reason ?? "等待首次自动评估后显示判断依据"
                  : `此标的仅用于行情观察；自动交易目标仍为 ${state?.symbol ?? "BTC/USDT"}。`}
              </small>
            </footer>
          </section>

          <aside className="dynamic-trading-control-panel">
            <header>
              <div>
                <strong>自动交易控制</strong>
                <span>后台持续运行</span>
              </div>
              <span className={`dynamic-trading-runner-dot ${state?.enabled ? "active" : ""}`} />
            </header>
            <div aria-label="控制信息分区" className="dynamic-trading-control-sections" role="tablist">
              <button aria-selected={controlTab === "runtime"}
                className={controlTab === "runtime" ? "active" : ""}
                onClick={() => setControlTab("runtime")} role="tab" type="button">运行状态</button>
              <button aria-selected={controlTab === "risk"}
                className={controlTab === "risk" ? "active" : ""}
                onClick={() => setControlTab("risk")} role="tab" type="button">风险参数</button>
              <button aria-selected={controlTab === "authorization"}
                className={controlTab === "authorization" ? "active" : ""}
                onClick={() => setControlTab("authorization")} role="tab" type="button">授权证据</button>
            </div>
            <div className="dynamic-trading-control-view" hidden={controlTab !== "runtime"}>
              <div className={`dynamic-trading-cycle ${state?.enabled ? "active" : ""}`}>
                <span>
                  <strong><Activity size={12} />{state?.enabled ? "监控运行中" : "监控已暂停"}</strong>
                  <small>{modeLabel}</small>
                </span>
                <span>
                  <strong>{secondsUntilNextCycle === null ? "—" : `${secondsUntilNextCycle}s`}</strong>
                  <small>
                    {state?.enabled ? "至下次评估" : "监控已暂停"} / {state?.runnerIntervalSeconds ?? 35}s
                  </small>
                </span>
              </div>
              <section className="dynamic-trading-decision-card">
                <span>最近自动判断</span>
                <strong>{decisionLabel(state?.lastDecision?.action)}</strong>
                <em>{state?.lastDecision ? `${Math.round(state.lastDecision.confidence * 100)}% 置信度` : "等待首次判断"}</em>
                <p aria-live="polite">{evaluationFeedback
                  ?? state?.lastDecision?.reason
                  ?? "后台完成下一轮评估后，将在这里展示判断理由。"}</p>
              </section>
            </div>

            <div className="dynamic-trading-control-view" hidden={controlTab !== "risk"}>
              <div className="dynamic-trading-control-form">
                <label>执行模式
                  <select value={draft.executionMode} onChange={(event) => {
                    const executionMode = event.target.value as Draft["executionMode"];
                    setDraft((current) => ({ ...current, executionMode }));
                    if (executionMode === "paper") setTestnetConfirmed(false);
                    if (executionMode !== "live") setLiveConfirmed(false);
                  }}>
                    <option value="paper">纸面模拟</option>
                    <option value="testnet">币安测试网</option>
                    <option value="live">币安生产实盘</option>
                  </select>
                </label>
                <label>AI 服务
                  <select value={draft.providerId}
                    onChange={(event) => setDraft((current) => ({ ...current, providerId: event.target.value }))}>
                    <option value="auto">自动选择</option>
                    {snapshot?.providers.map((provider) => (
                      <option disabled={!provider.configured} key={provider.providerId} value={provider.providerId}>
                        {providerLabel(provider.providerId)}{provider.configured ? "" : "（未配置）"}
                      </option>
                    ))}
                  </select>
                </label>
                <NumberField label="触发涨跌幅 %（0.05–20）" min={0.05} max={20} step={0.05}
                  value={draft.triggerPct} onChange={(value) => updateNumber("triggerPct", value)} />
                <NumberField label="单笔上限 USDT" min={1} max={10} step={1}
                  value={draft.orderNotional} onChange={(value) => updateNumber("orderNotional", value)} />
                <NumberField label="止损 %" min={0.1} max={20} step={0.1}
                  value={draft.stopLossPct} onChange={(value) => updateNumber("stopLossPct", value)} />
                <NumberField label="止盈 %" min={0.1} max={50} step={0.1}
                  value={draft.takeProfitPct} onChange={(value) => updateNumber("takeProfitPct", value)} />
                <NumberField label="亏损回撤上限 %" min={0.1} max={20} step={0.1}
                  value={draft.dailyLossLimitPct} onChange={(value) => updateNumber("dailyLossLimitPct", value)} />
                <NumberField label="盈利回撤上限 %" min={0.1} max={20} step={0.1}
                  value={draft.dailyProfitDrawdownLimitPct}
                  onChange={(value) => updateNumber("dailyProfitDrawdownLimitPct", value)} />
                <NumberField label="每小时最多成交" min={1} max={60} step={1}
                  value={draft.maxTradesPerHour} onChange={(value) => updateNumber("maxTradesPerHour", value)} />
              </div>
              <dl className="dynamic-trading-control-kpis">
                <div><dt>亏损回撤</dt><dd>{lossDrawdown.toFixed(2)}%</dd></div>
                <div><dt>盈利回撤</dt><dd>{profitDrawdown.toFixed(2)}%</dd></div>
                <div><dt>小时额度</dt><dd>{remainingTrades} / {state?.maxTradesPerHour ?? 0} 次</dd></div>
                <div><dt>连续失败</dt><dd>{state?.consecutiveRunnerFailures ?? 0} 次</dd></div>
              </dl>
            </div>

            <div className="dynamic-trading-control-view" hidden={controlTab !== "authorization"}>
              <div className={`dynamic-trading-authorization ${snapshot?.liveTradingAllowed ? "active" : ""}`}>
                <span>
                  {liveMode
                    ? snapshot?.liveTradingAllowed ? "生产授权有效" : "生产授权待确认"
                    : "当前为非生产模式"}
                </span>
                <strong>
                  {liveMode && snapshot?.liveTradingAllowed
                    ? liveAuthorizationLabel(state)
                    : liveMode ? "需实名操作人与真实资金确认" : modeLabel}
                </strong>
              </div>

              {testnetMode ? (
                <label className="dynamic-trading-confirmation">
                  <input checked={testnetConfirmed}
                    onChange={(event) => setTestnetConfirmed(event.target.checked)} type="checkbox" />
                  确认向币安测试网提交委托
                </label>
              ) : null}
              {liveMode && !snapshot?.liveTradingAllowed ? (
                <div className="dynamic-trading-live-confirmation">
                  <label>实名操作人
                    <input value={draft.liveOperator}
                      onChange={(event) => setDraft((current) => ({ ...current, liveOperator: event.target.value }))}
                      placeholder="用于生产审计" />
                  </label>
                  <label className="dynamic-trading-confirmation">
                    <input checked={liveConfirmed}
                      onChange={(event) => setLiveConfirmed(event.target.checked)} type="checkbox" />
                    确认使用真实资金，单笔新增风险不超过 10 USDT
                  </label>
                </div>
              ) : null}
            </div>

            <div className="dynamic-trading-control-actions">
              <button disabled={
                busy
                || evaluating
                || (testnetMode && !testnetConfirmed)
                || (liveMode && (!liveConfirmed || !draft.liveOperator.trim()))
              } onClick={() => void save(true)} type="button">
                <Save size={14} />
                {busy ? "保存中…" : state?.enabled ? "保存配置" : "保存并开启"}
              </button>
              <button aria-busy={evaluating}
                disabled={(!state?.enabled && !hasUnresolvedOrder) || busy || evaluating}
                onClick={() => void evaluate()} type="button">
                {hasUnresolvedOrder ? <RefreshCw size={14} /> : <Play size={14} />}
                {evaluating ? hasUnresolvedOrder ? "对账中…" : "评估中…"
                  : hasUnresolvedOrder ? "立即对账" : "立即评估"}
              </button>
              {state?.enabled ? (
                <button className="danger" disabled={busy || evaluating}
                  onClick={() => void save(false)} type="button">
                  <CirclePause size={14} />暂停
                </button>
              ) : null}
            </div>
            {error ? (
              <p className="dynamic-trading-error" role="alert">{error}</p>
            ) : null}
          </aside>
        </div>

        {attention ? (
          <div className={`dynamic-trading-alert ${attention.tone}`} role="alert">
            <strong>{attention.title}</strong>
            <span>{attention.detail}</span>
          </div>
        ) : null}

        <AutoTradingEconomicsSummary economics={snapshot?.economics} />

        <div className="dynamic-trading-bottom-grid">
          <section>
            <header><WalletCards size={14} /><strong>当前持仓</strong></header>
            <dl className="dynamic-trading-kpis">
              <div><dt>{state?.accountAuthority === "binance_spot" ? "Binance Spot 总净值" : "管理中策略权益"}</dt>
                <dd>{money(state?.accountEquity ?? state?.equity)} USDT</dd></div>
              <div><dt>{state?.accountAuthority === "binance_spot" ? "BTC 现货总量" : "持仓数量"}</dt>
                <dd>{formatNumber(state?.position)} BTC</dd></div>
              <div><dt>平均成本</dt><dd>{money(state?.avgCost)} USDT</dd></div>
              <div><dt>已实现盈亏</dt><dd className={(state?.realizedPnl ?? 0) < 0 ? "negative" : "positive"}>
                {signedMoney(state?.realizedPnl)} USDT
              </dd></div>
            </dl>
          </section>

          <section>
            <header><Bot size={14} /><strong>委托意图</strong></header>
            {orderIntent ? (
              <div className="dynamic-trading-order-card">
                <span>{orderIntent.symbol}</span>
                <strong className={orderIntent.side}>{orderIntent.side === "buy" ? "买入" : "卖出"}</strong>
                <p>{formatNumber(orderIntent.quantity)} BTC · {money(orderIntent.notionalValue)} USDT</p>
                <small>{orderStateLabel(currentOrderState)}</small>
              </div>
            ) : (
              <div className="dynamic-trading-empty">当前没有待提交的委托意图</div>
            )}
            <button className="dynamic-trading-link" onClick={onOpenExecution} type="button">
              查看执行准入 <ChevronRight size={13} />
            </button>
          </section>

          <section>
            <header><Activity size={14} /><strong>最近成交</strong></header>
            {snapshot?.history.length ? (
              <ol className="dynamic-trading-trades">
                {snapshot.history.slice(0, 4).map((event) => (
                  <li key={event.eventId}>
                    <span className={stringValue(event.metadata.side)}>
                      {stringValue(event.metadata.side) === "buy" ? "买入" : "卖出"}
                    </span>
                    <strong>{formatNumber(numberValue(event.metadata.price))}</strong>
                    <time dateTime={event.createdAt}>{formatTime(event.createdAt)}</time>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="dynamic-trading-empty">尚无自动成交</div>
            )}
            <button className="dynamic-trading-link" onClick={onOpenAudit} type="button">
              查看完整审计 <ChevronRight size={13} />
            </button>
          </section>

          <section>
            <header><ShieldCheck size={14} /><strong>执行链</strong></header>
            <ol className="dynamic-trading-chain">
              {[
                ["市场快照", contract?.marketSnapshot.snapshotHash],
                ["决策提案", contract?.decisionProposal.proposalId],
                ["标准信号", contract?.signal.signalId],
                ["风险调整", contract?.riskAdjustedTarget.riskAdjustedTargetId],
                ["订单结果", state?.lastOrderResult?.orderResultId]
              ].map(([label, value], index) => (
                <li className={value ? "complete" : ""} key={label}>
                  <span>{index + 1}</span>
                  <div><strong>{label}</strong><small title={value}>{value ? value.slice(0, 12) : "等待"}</small></div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <header><ShieldCheck size={14} /><strong>账户与风险</strong></header>
            <dl className="dynamic-trading-risk-list">
              <div><dt>Binance Spot 总净值</dt><dd>{money(state?.accountEquity ?? state?.equity)} USDT</dd></div>
              <div><dt>可用 USDT</dt><dd>{money(state?.availableCash ?? state?.cash)} USDT</dd></div>
              <div><dt>可用 BTC</dt><dd>{formatNumber(state?.lastAccountCheck?.accountSnapshot?.assets?.BTC?.free)} BTC</dd></div>
              <div><dt>亏损回撤</dt><dd>{lossDrawdown.toFixed(2)} / {(state?.dailyLossLimitPct ?? 0).toFixed(2)}%</dd></div>
              <div><dt>盈利回撤</dt><dd>{profitDrawdown.toFixed(2)} / {(state?.dailyProfitDrawdownLimitPct ?? 0).toFixed(2)}%</dd></div>
              <div><dt>小时额度</dt><dd>剩余 {remainingTrades} 次</dd></div>
              <div><dt>账户覆盖</dt><dd>{state?.lastAccountCheck?.accountCovered === true ? "已通过" : "待检查"}</dd></div>
              <div><dt>生产授权</dt><dd>{liveAuthorizationLabel(state)}</dd></div>
            </dl>
          </section>
        </div>

        <footer className="dynamic-trading-boundary">
          <span>现货自动交易 · 不使用杠杆 · 不做空</span>
          <span>关闭页面不影响后端运行；生产委托仍受权限、急停、风控和实名确认约束。</span>
        </footer>
      </section>
    );
  }

  const persistedExecutionMode = state?.executionMode ?? draft.executionMode;
  const persistedModeLabel = executionModeLabel(persistedExecutionMode);
  const persistedTestnetMode = persistedExecutionMode === "testnet";
  const persistedLiveMode = persistedExecutionMode === "live";
  const showBuiltInSignalControls = showBuiltInAutoTradingSignalControls(snapshot?.strategyBinding);
  const strategyBindingBlocked = snapshot?.strategyBinding?.status === "blocked";
  const runtimeContext = state
    ? `${state.symbol} · ${state.timeframe}，每 ${state.runnerIntervalSeconds} 秒自动评估`
    : "正在读取已保存的运行上下文";

  return (
    <section className={`execution-auto-paper ${state?.enabled ? "active" : ""}`}
      aria-labelledby="execution-auto-paper-title">
      <header>
        <div>
          <span>自动交易 · {persistedModeLabel}</span>
          <h2 id="execution-auto-paper-title">自动交易运行与委托控制</h2>
          <p>{runtimeContext}；当前生产策略生成信号后，由风控计算仓位并进入受控委托链。</p>
        </div>
        <strong>
          {state?.enabled
            ? state.runnerState === "running" ? "后端监控中" : "等待后端运行器"
            : "已暂停"} · {
            persistedLiveMode ? "生产实盘委托" : persistedTestnetMode ? "测试网委托" : "纸面模拟"
          }
        </strong>
      </header>

      <AutoTradingProductionStrategyOverview snapshot={snapshot} />
      <div className="execution-auto-runtime-tools">
        <AutoTradingRuntimeHealth state={state} />
        <button
          className="execution-auto-notification-toggle"
          disabled={notificationPermission !== "default"}
          onClick={() => void enableNotifications()}
          title="页面保持打开时，异常状态变化会发送一次系统通知"
          type="button"
        >
          {notificationPermission === "default" ? "开启系统提醒"
            : notificationPermission === "granted" ? "系统提醒已开启"
              : notificationPermission === "denied" ? "系统提醒已关闭" : "系统通知不可用"}
        </button>
      </div>
      <AutoTradingServerMonitoring
        error={monitoringReadError}
        snapshot={monitoring}
      />

      <div className="execution-auto-paper-metrics">
        <article><span>当前窗口涨跌幅</span><strong>{percent(state?.windowChangePct)}</strong></article>
        <article><span>最近判断</span><strong>{decisionLabel(state?.lastDecision?.action)}</strong></article>
        <article><span>策略权益</span><strong>{money(state?.equity)} USDT</strong></article>
        <article><span>累计成交</span><strong>{state?.tradeCount ?? 0} 笔</strong></article>
      </div>

      {attention ? (
        <div className={`execution-auto-paper-alert ${attention.tone}`} role="alert">
          <strong>{attention.title}</strong>
          <span>{attention.detail}</span>
        </div>
      ) : null}

      <AutoTradingRiskOverview state={state} />
      <AutoTradingLedger history={snapshot?.history ?? []} state={state} />

      <div className="execution-auto-paper-form">
        <label>执行模式
          <select value={draft.executionMode} onChange={(event) => {
            const executionMode = event.target.value as Draft["executionMode"];
            setDraft((current) => ({ ...current, executionMode }));
            if (executionMode === "paper") {
              setTestnetConfirmed(false);
            }
            if (executionMode !== "live") {
              setLiveConfirmed(false);
            }
          }}>
            <option value="paper">纸面模拟</option>
            <option value="testnet">币安现货测试网</option>
            <option value="live">币安现货生产实盘</option>
          </select>
        </label>
        {showBuiltInSignalControls ? (
          <>
            <label>智能决策服务
              <select value={draft.providerId}
                onChange={(event) => setDraft((current) => ({ ...current, providerId: event.target.value }))}>
                <option value="auto">自动选择已配置服务</option>
                {snapshot?.providers.map((provider) => (
                  <option disabled={!provider.configured} key={provider.providerId} value={provider.providerId}>
                    {providerLabel(provider.providerId)}{provider.configured ? "" : "（未配置）"}
                  </option>
                ))}
              </select>
            </label>
            <NumberField label="触发涨跌幅 %（0.05–20）" min={0.05} max={20} step={0.05}
              value={draft.triggerPct} onChange={(value) => updateNumber("triggerPct", value)} />
          </>
        ) : null}
        <NumberField label="单笔上限 USDT" min={1} max={10} step={1}
          value={draft.orderNotional} onChange={(value) => updateNumber("orderNotional", value)} />
        <NumberField label="止损 %" min={0.1} max={20} step={0.1}
          value={draft.stopLossPct} onChange={(value) => updateNumber("stopLossPct", value)} />
        <NumberField label="止盈 %" min={0.1} max={50} step={0.1}
          value={draft.takeProfitPct} onChange={(value) => updateNumber("takeProfitPct", value)} />
        <NumberField label="亏损回撤上限 %" min={0.1} max={20} step={0.1}
          value={draft.dailyLossLimitPct} onChange={(value) => updateNumber("dailyLossLimitPct", value)} />
        <NumberField label="盈利回撤上限 %" min={0.1} max={20} step={0.1}
          value={draft.dailyProfitDrawdownLimitPct}
          onChange={(value) => updateNumber("dailyProfitDrawdownLimitPct", value)} />
        <NumberField label="每小时最多成交" min={1} max={60} step={1}
          value={draft.maxTradesPerHour} onChange={(value) => updateNumber("maxTradesPerHour", value)} />
      </div>

      {testnetMode ? (
        <label className="execution-auto-paper-confirmation">
          <input checked={testnetConfirmed} onChange={(event) => setTestnetConfirmed(event.target.checked)}
            type="checkbox" />
          我确认自动策略会向币安现货测试网提交测试委托，并受测试网急停控制
        </label>
      ) : null}
      {liveMode ? (
        <div className="execution-auto-live-confirmation">
          <label>实名操作人
            <input value={draft.liveOperator}
              onChange={(event) => setDraft((current) => ({ ...current, liveOperator: event.target.value }))}
              placeholder="用于生产审计" />
          </label>
          <label className="execution-auto-paper-confirmation">
            <input checked={liveConfirmed} onChange={(event) => setLiveConfirmed(event.target.checked)}
              type="checkbox" />
            我确认自动策略会使用真实资金提交币安现货生产委托，单笔新增风险不超过 10 USDT
          </label>
          <small>
            还需先在下方生产交易控制链完成最新权限核验并恢复执行急停；授权时长由设置页控制。
          </small>
        </div>
      ) : null}

      <div className="execution-auto-paper-actions">
        <button disabled={
          busy
          || strategyBindingBlocked
          || (testnetMode && !testnetConfirmed)
          || (liveMode && (!liveConfirmed || !draft.liveOperator.trim()))
        } onClick={() => void save(true)} type="button">
          {busy ? "保存中…" : state?.enabled ? "保存参数"
            : liveMode ? "保存并开启生产实盘"
              : testnetMode ? "保存并开启测试网委托" : "保存并开启"}
        </button>
        <button disabled={
          (!state?.enabled && !hasUnresolvedOrder)
          || (strategyBindingBlocked && !hasUnresolvedOrder)
          || busy
        }
          onClick={() => void evaluate()} type="button">
          {hasUnresolvedOrder ? "立即对账" : "立即评估"}
        </button>
        {state?.enabled ? (
          <button className="danger" disabled={busy} onClick={() => void save(false)} type="button">暂停监控</button>
        ) : null}
      </div>

      <p className={error ? "execution-auto-paper-error" : undefined} role="status">
        {error ?? state?.detail ?? "正在读取监控状态…"}
      </p>
      <small>
        后端运行器不依赖当前页面，关闭页面后仍会继续；
        {hasUnresolvedOrder ? "“立即对账”只查询既有委托，不会创建新委托。" : "“立即评估”只用于人工触发一次检查。"}
        低置信度不会被“必须不亏”条件拦截；数据异常、账户亏损上限、成交频率和测试网急停仍会暂停。
        测试网使用无价值资产；生产实盘会使用真实资金，并受生产急停和授权时长控制。
      </small>
    </section>
  );
}

function NumberField({
  label,
  max,
  min,
  onChange,
  step,
  value
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: string) => void;
  step: number;
  value: number;
}) {
  return (
    <label>{label}
      <input max={max} min={min} onChange={(event) => onChange(event.target.value)}
        step={step} type="number" value={value} />
    </label>
  );
}

function decisionLabel(action?: "buy" | "sell" | "hold") {
  return action === "buy" ? "买入" : action === "sell" ? "卖出" : action === "hold" ? "观望" : "待评估";
}

function providerLabel(providerId: string) {
  return providerId === "openai-compatible" ? "OpenAI 兼容服务"
    : providerId === "openai" ? "OpenAI"
      : providerId === "ollama" ? "Ollama"
        : providerId === "rules" ? "规则引擎"
          : providerId === "risk" ? "风险保护"
            : providerId === "exchange" ? "交易所对账" : providerId;
}

function riskDecisionLabel(decision: "preserve" | "reduce" | "zero" | "reject") {
  return {
    preserve: "保持目标",
    reduce: "缩减目标",
    zero: "清零目标",
    reject: "拒绝目标"
  }[decision];
}

function percent(value?: number | null) {
  return typeof value === "number" ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}%` : "—";
}

function money(value?: number) {
  return typeof value === "number" ? value.toFixed(2) : "—";
}

function signedMoney(value?: number) {
  return typeof value === "number" ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}` : "—";
}

function ledgerMoney(value?: number) {
  return typeof value === "number"
    ? new Intl.NumberFormat("zh-CN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }).format(value)
    : "—";
}

function signedLedgerMoney(value?: number) {
  return typeof value === "number" ? `${value >= 0 ? "+" : ""}${ledgerMoney(value)}` : "—";
}

function percentRate(value: number) {
  return `${(value * 100).toFixed(3)}%`;
}

function formatNumber(value?: number | null) {
  return typeof value === "number"
    ? new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 8 }).format(value)
    : "—";
}

function formatTime(value?: string | null) {
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

function executionModeLabel(mode?: string) {
  return mode === "live" ? "生产实盘" : mode === "testnet" ? "测试网" : mode === "paper" ? "纸面模拟" : "未知模式";
}

function orderStateLabel(state?: string) {
  const labels: Record<string, string> = {
    submission_pending: "待交易所确认",
    open: "委托已挂出",
    partially_filled: "部分成交",
    reconciliation_required: "等待人工对账",
    filled: "已成交",
    canceled: "已撤销",
    expired: "已过期",
    rejected: "已拒绝"
  };
  return labels[state ?? ""] ?? "尚无委托";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function formatFeeBreakdown(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const fee = item as Record<string, unknown>;
    const cost = numberValue(fee.cost);
    const currency = stringValue(fee.currency);
    return cost === undefined || !currency ? [] : [`${formatNumber(cost)} ${currency}`];
  }).join(" + ");
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value ? value : fallback;
}

export function autoTradingErrorMessage(error: unknown) {
  const detail = error instanceof Error ? error.message : "";
  const labels: Record<string, string> = {
    "Failed to fetch": "无法连接自动交易服务，请检查本地 API 是否运行。",
    "fetch failed": "无法连接自动交易服务，请检查本地 API 是否运行。",
    "NetworkError when attempting to fetch resource.": "无法连接自动交易服务，请检查本地 API 是否运行。",
    auto_trading_snapshot_invalid: "自动交易状态响应不完整，请稍后刷新或检查 API。",
    operations_monitoring_snapshot_invalid: "服务端监控响应不完整，请稍后刷新或检查 API。",
    live_confirmation_required: "请确认真实资金风险",
    live_operator_required: "请填写实名操作人",
    stage10_production_live_mode_disabled: "本地生产实盘开关尚未启用",
    stage10_production_execution_kill_switch_triggered: "生产执行急停已触发，请先完成权限核验并恢复执行控制",
    stage10_production_execution_control_evidence_stale: "生产权限证据已过期，请重新核验",
    stage10_production_trading_permissions_or_ip_invalid: "生产交易权限、危险权限或 IP 白名单不符合要求",
    triggerPct_out_of_range: "触发涨跌幅必须在 0.05% 到 20% 之间",
    dailyLossLimitPct_out_of_range: "亏损回撤上限必须在 0.1% 到 20% 之间",
    dailyProfitDrawdownLimitPct_out_of_range: "盈利回撤上限必须在 0.1% 到 20% 之间",
    live_position_or_order_must_be_reconciled: "生产持仓或委托尚未完成，不能切换执行模式",
    testnet_position_or_order_must_be_reconciled: "测试网持仓或委托尚未完成，不能切换执行模式"
  };
  return labels[detail] ?? (detail || "自动交易操作失败");
}
