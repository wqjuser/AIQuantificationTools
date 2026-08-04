import {
  buildApiUrl,
  isStrategyProductionBindingPayload,
  type StrategyProductionBinding,
  type WorkspaceFetcher
} from "../../lib/terminal-api";
import {
  formatTime,
  type AutoTradingEconomics,
  type AutoTradingSnapshot,
  type AutoTradingState
} from "../shared/auto-trading-contract";

export const defaultFetcher: WorkspaceFetcher = (url, init) => fetch(url, init);

export const AUTO_TRADING_STATUS_REFRESH_INTERVAL_MS = 5_000;

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

export function showBuiltInAutoTradingSignalControls(
  binding?: Pick<StrategyProductionBinding, "kind"> | null
) {
  return binding?.kind !== "library";
}

export function isAutoTradingSnapshot(payload: unknown): payload is AutoTradingSnapshot {
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
    "initialCash",
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
    && typeof stateRecord.paperSessionId === "string"
    && typeof stateRecord.paperSessionStartedAt === "string"
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

export function isAutoTradingEconomics(payload: unknown): payload is AutoTradingEconomics {
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

export interface MonitoringIncident {
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

export interface MonitoringJob {
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

export interface MonitoringObservedJob {
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

export function localizeMonitoringText(value: string) {
  return value.replace(/\s*Webhook/g, "回调通知");
}

export type Draft = Pick<
  AutoTradingState,
  "triggerPct" | "orderNotional" | "stopLossPct" | "takeProfitPct" | "dailyLossLimitPct"
  | "dailyProfitDrawdownLimitPct" | "maxTradesPerHour" | "providerId" | "executionMode"
  | "liveOperator" | "initialCash"
>;

export const defaultDraft: Draft = {
  triggerPct: 0.3,
  orderNotional: 10,
  stopLossPct: 1,
  takeProfitPct: 2,
  dailyLossLimitPct: 2,
  dailyProfitDrawdownLimitPct: 2,
  maxTradesPerHour: 3,
  initialCash: 100,
  providerId: "auto",
  executionMode: "paper",
  liveOperator: ""
};

export function autoTradingDraftForExecutionMode(
  draft: Draft,
  executionMode: Draft["executionMode"]
): Draft {
  return {
    ...draft,
    executionMode,
    orderNotional: executionMode === "paper"
      ? draft.orderNotional
      : Math.min(draft.orderNotional, 10)
  };
}

export function autoTradingConfigurationPayload(
  draft: Draft,
  enabled: boolean,
  testnetConfirmed: boolean,
  liveConfirmed: boolean,
  paperAccountResetConfirmed: boolean
) {
  const { initialCash, ...configuration } = draft;
  return {
    ...configuration,
    ...(draft.executionMode === "paper" ? { initialCash } : {}),
    enabled,
    testnetConfirmed,
    liveConfirmed,
    paperAccountResetConfirmed
  };
}

export type SystemNotificationPermission = NotificationPermission | "unsupported";

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

export type AutoTradingRuntimeState = Pick<
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

export function decisionLabel(action?: "buy" | "sell" | "hold") {
  return action === "buy" ? "买入" : action === "sell" ? "卖出" : action === "hold" ? "观望" : "待评估";
}

export function providerLabel(providerId: string) {
  return providerId === "openai-compatible" ? "OpenAI 兼容服务"
    : providerId === "openai" ? "OpenAI"
      : providerId === "ollama" ? "Ollama"
        : providerId === "rules" ? "规则引擎"
          : providerId === "risk" ? "风险保护"
            : providerId === "exchange" ? "交易所对账" : providerId;
}

export function riskDecisionLabel(decision: "preserve" | "reduce" | "zero" | "reject") {
  return {
    preserve: "保持目标",
    reduce: "缩减目标",
    zero: "清零目标",
    reject: "拒绝目标"
  }[decision];
}

export function percent(value?: number | null) {
  return typeof value === "number" ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}%` : "—";
}

export function money(value?: number) {
  return typeof value === "number" ? value.toFixed(2) : "—";
}

export function signedMoney(value?: number) {
  return typeof value === "number" ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}` : "—";
}

export function ledgerMoney(value?: number) {
  return typeof value === "number"
    ? new Intl.NumberFormat("zh-CN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }).format(value)
    : "—";
}

export function signedLedgerMoney(value?: number) {
  return typeof value === "number" ? `${value >= 0 ? "+" : ""}${ledgerMoney(value)}` : "—";
}

export function percentRate(value: number) {
  return `${(value * 100).toFixed(3)}%`;
}

export function formatNumber(value?: number | null) {
  return typeof value === "number"
    ? new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 8 }).format(value)
    : "—";
}

export function executionModeLabel(mode?: string) {
  return mode === "live" ? "生产实盘" : mode === "testnet" ? "测试网" : mode === "paper" ? "纸面模拟" : "未知模式";
}

export function orderStateLabel(state?: string) {
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

export function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function formatFeeBreakdown(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const fee = item as Record<string, unknown>;
    const cost = numberValue(fee.cost);
    const currency = stringValue(fee.currency);
    return cost === undefined || !currency ? [] : [`${formatNumber(cost)} ${currency}`];
  }).join(" + ");
}

export function stringValue(value: unknown, fallback = "") {
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
    stage10_auto_live_order_notional_exceeded: "上一轮生产订单风险预算超过 10 USDT 上限",
    paper_account_reset_confirmation_required: "修改模拟账户初始资金前，请确认新建模拟账户",
    paper_account_must_be_paused_before_reset: "请先暂停自动监控，再新建模拟账户",
    paper_account_mode_required: "仅纸面模拟模式可以新建模拟账户",
    initialCash_out_of_range: "模拟账户初始资金必须在 1 到 10 亿 USDT 之间",
    orderNotional_out_of_range: "单笔金额超出当前执行模式允许范围",
    triggerPct_out_of_range: "触发涨跌幅必须在 0.05% 到 20% 之间",
    dailyLossLimitPct_out_of_range: "亏损回撤上限必须在 0.1% 到 20% 之间",
    dailyProfitDrawdownLimitPct_out_of_range: "盈利回撤上限必须在 0.1% 到 20% 之间",
    live_position_or_order_must_be_reconciled: "生产持仓或委托尚未完成，不能切换执行模式",
    testnet_position_or_order_must_be_reconciled: "测试网持仓或委托尚未完成，不能切换执行模式"
  };
  return labels[detail] ?? (detail || "自动交易操作失败");
}
