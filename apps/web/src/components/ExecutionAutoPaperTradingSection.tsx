import { useCallback, useEffect, useRef, useState } from "react";
import { buildApiUrl, type WorkspaceFetcher } from "../lib/terminal-api";

const defaultFetcher: WorkspaceFetcher = (url, init) => fetch(url, init);
const statusRefreshIntervalMs = 5_000;

interface AutoTradingState {
  enabled: boolean;
  executionMode: "paper" | "testnet" | "live";
  testnetConfirmed: boolean;
  liveConfirmed: boolean;
  liveOperator: string;
  liveAuthorizedUntil: string | null;
  runnerState: "running" | "stopping" | "stopped";
  runnerIntervalSeconds: number;
  runnerCycleCount: number;
  consecutiveRunnerFailures: number;
  lastRunnerCycleAt: string | null;
  lastRunnerSuccessAt: string | null;
  lastRunnerErrorAt: string | null;
  status: string;
  detail: string;
  symbol: string;
  timeframe: string;
  triggerPct: number;
  orderNotional: number;
  stopLossPct: number;
  takeProfitPct: number;
  dailyLossLimitPct: number;
  maxTradesPerHour: number;
  providerId: string;
  cash: number;
  position: number;
  avgCost: number;
  equity: number;
  realizedPnl: number;
  dailyStartEquity: number;
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
  lastAccountCheck: {
    accountCovered?: boolean;
    checkedAt?: string;
    positionCovered: boolean;
    quoteCovered: boolean;
    unexpectedOpenAutoOrderCount: number;
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
        dailyLossLimitPct: number;
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

interface AutoTradingHistoryEvent {
  eventId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

interface AutoTradingSnapshot {
  state: AutoTradingState;
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

interface MonitoringSnapshot {
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

type Draft = Pick<
  AutoTradingState,
  "triggerPct" | "orderNotional" | "stopLossPct" | "takeProfitPct" | "dailyLossLimitPct"
  | "maxTradesPerHour" | "providerId" | "executionMode" | "liveOperator"
>;

const defaultDraft: Draft = {
  triggerPct: 0.3,
  orderNotional: 10,
  stopLossPct: 1,
  takeProfitPct: 2,
  dailyLossLimitPct: 2,
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
    const orphanOrderCount = state.lastAccountCheck?.unexpectedOpenAutoOrderCount ?? 0;
    const issues = [
      state.lastAccountCheck?.positionCovered === false ? "可用 BTC 不足以覆盖策略持仓" : "",
      state.lastAccountCheck?.quoteCovered === false ? "可用 USDT 不足以覆盖下一笔预算" : "",
      orphanOrderCount
        ? `发现 ${orphanOrderCount} 笔未记录的自动挂单`
        : ""
    ].filter(Boolean);
    return {
      tone: "danger",
      title: orphanOrderCount ? "发现未记录的自动挂单" : "账户资产不足",
      detail: issues.length
        ? `${issues.join("；")}。${orphanOrderCount
          ? "请先在交易所核对并处理，再重新检查。"
          : "请补足资产或核对本地策略账本后重新检查。"}`
        : state.detail
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

export function AutoTradingLedger({
  history,
  state
}: {
  history: AutoTradingHistoryEvent[];
  state: Pick<
    AutoTradingState,
    "executionMode" | "lastDecision" | "lastDecisionContract" | "lastLiveOrder" | "lastTestnetOrder"
    | "lastOrderResult" | "position" | "realizedPnl"
  > | undefined;
}) {
  const decision = state?.lastDecision;
  const contract = state?.lastDecisionContract;
  const orderResult = state?.lastOrderResult;
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
            <small>仅本策略持仓</small>
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

export function AutoTradingRiskOverview({
  state
}: {
  state: Pick<
    AutoTradingState,
    "executionMode" | "equity" | "dailyStartEquity" | "dailyLossLimitPct" | "maxTradesPerHour"
    | "tradeTimestamps" | "position" | "avgCost" | "stopLossPct" | "takeProfitPct"
    | "lastAccountCheck" | "liveAuthorizedUntil"
  > | undefined;
}) {
  const dailyStartEquity = state?.dailyStartEquity ?? 0;
  const drawdown = dailyStartEquity > 0
    ? Math.max(0, (dailyStartEquity - (state?.equity ?? dailyStartEquity)) / dailyStartEquity * 100)
    : 0;
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
        <div>
          <dt>当日回撤</dt>
          <dd>{drawdown.toFixed(2)}% / {(state?.dailyLossLimitPct ?? 0).toFixed(2)}%</dd>
          <small>达到上限后暂停新交易</small>
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
            <dd>{state.liveAuthorizedUntil ? `有效至 ${formatTime(state.liveAuthorizedUntil)}` : "未授权"}</dd>
            <small>最长八小时，过期阻止新委托</small>
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
    ? "Webhook 已就绪"
    : snapshot?.channel.status === "invalid"
      ? "Webhook 配置无效" : "Webhook 未配置";

  return (
    <section className={`execution-auto-server-monitoring ${tone}`}
      aria-label="服务端监控告警">
      <header>
        <div>
          <span>M2 · 服务端告警</span>
          <strong>{error ? "监控状态读取失败" : snapshot?.reason ?? "等待服务端监控状态"}</strong>
        </div>
        <em>{snapshot?.activeIncidents.length ?? 0} 个待恢复事件</em>
      </header>
      <p>{error ?? snapshot?.nextAction ?? "本区域只读取运行状态，不执行评估、对账或委托。"}</p>
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
          <small>下一步：{active.nextAction}</small>
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

export function ExecutionAutoPaperTradingSection({
  baseUrl,
  fetcher = defaultFetcher
}: {
  baseUrl: string;
  fetcher?: WorkspaceFetcher;
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
  const [notificationPermission, setNotificationPermission] = useState<SystemNotificationPermission>(
    () => typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const requestInFlight = useRef(false);
  const lastNotificationKey = useRef<string | null>(null);

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
    try {
      const next = await request<AutoTradingSnapshot>("api/execution/auto-paper-trading");
      setSnapshot(next);
      setDraft({
        triggerPct: next.state.triggerPct,
        orderNotional: next.state.orderNotional,
        stopLossPct: next.state.stopLossPct,
        takeProfitPct: next.state.takeProfitPct,
        dailyLossLimitPct: next.state.dailyLossLimitPct,
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
      const detail = autoTradingErrorMessage(loadError);
      setError(detail);
      setStatusReadError(detail);
    }
  }, [request]);

  const refreshMonitoring = useCallback(async () => {
    try {
      setMonitoring(await request<MonitoringSnapshot>("api/operations/monitoring"));
      setMonitoringReadError(null);
    } catch (monitoringError) {
      setMonitoringReadError(autoTradingErrorMessage(monitoringError));
    }
  }, [request]);

  const evaluate = useCallback(async () => {
    if (requestInFlight.current) {
      return;
    }
    requestInFlight.current = true;
    try {
      setSnapshot(await request<AutoTradingSnapshot>(
        autoTradingActionPath(snapshot?.state),
        { method: "POST" }
      ));
      setError(null);
      setStatusReadError(null);
    } catch (evaluationError) {
      setError(autoTradingErrorMessage(evaluationError));
    } finally {
      requestInFlight.current = false;
    }
  }, [request, snapshot?.state]);

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await request<AutoTradingSnapshot>("api/execution/auto-paper-trading"));
      setError(null);
      setStatusReadError(null);
    } catch (refreshError) {
      const detail = autoTradingErrorMessage(refreshError);
      setError(detail);
      setStatusReadError(detail);
    }
  }, [request]);

  const save = useCallback(async (enabled: boolean) => {
    setBusy(true);
    try {
      const next = await request<AutoTradingSnapshot>("api/execution/auto-paper-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, enabled, testnetConfirmed, liveConfirmed })
      });
      setSnapshot(next);
      setTestnetConfirmed(next.state.testnetConfirmed);
      setLiveConfirmed(next.state.liveConfirmed);
      setError(null);
      setStatusReadError(null);
    } catch (saveError) {
      setError(autoTradingErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }, [draft, liveConfirmed, request, testnetConfirmed]);

  useEffect(() => {
    void load();
    void refreshMonitoring();
  }, [load, refreshMonitoring]);
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refresh();
      void refreshMonitoring();
    }, statusRefreshIntervalMs);
    return () => window.clearInterval(intervalId);
  }, [refresh, refreshMonitoring]);

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
  const modeLabel = liveMode ? "Binance Spot 生产实盘"
    : testnetMode ? "Binance Spot Testnet" : "模拟账户";
  const updateNumber = (key: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [key]: Number(value) }));
  };

  return (
    <section className={`execution-auto-paper ${state?.enabled ? "active" : ""}`}
      aria-labelledby="execution-auto-paper-title">
      <header>
        <div>
          <span>AI 自动交易 · {modeLabel}</span>
          <h2 id="execution-auto-paper-title">涨跌幅自动监控</h2>
          <p>由后端每 35 秒检查 BTC/USDT；触发后由 AI 选择买入、卖出或观望，仓位由风控计算。</p>
        </div>
        <strong>
          {state?.enabled
            ? state.runnerState === "running" ? "后端监控中" : "等待后端运行器"
            : "已暂停"} · {
            liveMode ? "生产实盘委托" : testnetMode ? "测试网委托" : "纸面模拟"
          }
        </strong>
      </header>

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
        <article><span>五根涨跌幅</span><strong>{percent(state?.windowChangePct)}</strong></article>
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
            <option value="testnet">Binance Spot Testnet</option>
            <option value="live">Binance Spot 生产实盘</option>
          </select>
        </label>
        <label>AI 服务
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
        <NumberField label="触发涨跌幅 %" min={0.05} max={20} step={0.05}
          value={draft.triggerPct} onChange={(value) => updateNumber("triggerPct", value)} />
        <NumberField label="单笔上限 USDT" min={1} max={10} step={1}
          value={draft.orderNotional} onChange={(value) => updateNumber("orderNotional", value)} />
        <NumberField label="止损 %" min={0.1} max={20} step={0.1}
          value={draft.stopLossPct} onChange={(value) => updateNumber("stopLossPct", value)} />
        <NumberField label="止盈 %" min={0.1} max={50} step={0.1}
          value={draft.takeProfitPct} onChange={(value) => updateNumber("takeProfitPct", value)} />
        <NumberField label="当日亏损上限 %" min={0.1} max={20} step={0.1}
          value={draft.dailyLossLimitPct} onChange={(value) => updateNumber("dailyLossLimitPct", value)} />
        <NumberField label="每小时最多成交" min={1} max={60} step={1}
          value={draft.maxTradesPerHour} onChange={(value) => updateNumber("maxTradesPerHour", value)} />
      </div>

      {testnetMode ? (
        <label className="execution-auto-paper-confirmation">
          <input checked={testnetConfirmed} onChange={(event) => setTestnetConfirmed(event.target.checked)}
            type="checkbox" />
          我确认自动策略会向 Binance Spot Testnet 提交真实测试网委托，并受 Stage 6 急停控制
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
            我确认自动策略会使用真实资金提交 Binance Spot 生产现货委托，单笔新增风险不超过 10 USDT
          </label>
          <small>
            还需先在下方 Stage 10 完成最新权限核验并恢复执行急停；授权会话最长 8 小时。
          </small>
        </div>
      ) : null}

      <div className="execution-auto-paper-actions">
        <button disabled={
          busy
          || (testnetMode && !testnetConfirmed)
          || (liveMode && (!liveConfirmed || !draft.liveOperator.trim()))
        } onClick={() => void save(true)} type="button">
          {busy ? "保存中…" : state?.enabled ? "保存参数"
            : liveMode ? "保存并开启生产实盘"
              : testnetMode ? "保存并开启测试网委托" : "保存并开启"}
        </button>
        <button disabled={(!state?.enabled && !hasUnresolvedOrder) || busy}
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
        低置信度不会被“必须不亏”条件拦截；数据异常、账户亏损上限、成交频率和 Stage 6 急停仍会暂停。
        测试网使用无价值资产；生产实盘会使用真实资金，并受 Stage 10 急停和 8 小时授权会话控制。
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
    live_confirmation_required: "请确认真实资金风险",
    live_operator_required: "请填写实名操作人",
    stage10_production_live_mode_disabled: "本地生产实盘开关尚未启用",
    stage10_production_execution_kill_switch_triggered: "Stage 10 急停已触发，请先完成权限核验并恢复执行控制",
    stage10_production_execution_control_evidence_stale: "Stage 10 权限证据已过期，请重新核验",
    stage10_production_trading_permissions_or_ip_invalid: "生产交易权限、危险权限或 IP 白名单不符合要求",
    live_position_or_order_must_be_reconciled: "生产持仓或委托尚未完成，不能切换执行模式",
    testnet_position_or_order_must_be_reconciled: "测试网持仓或委托尚未完成，不能切换执行模式"
  };
  return labels[detail] ?? (detail || "自动交易操作失败");
}
