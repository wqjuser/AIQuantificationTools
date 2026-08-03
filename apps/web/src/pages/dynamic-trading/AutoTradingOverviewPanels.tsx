import { WalletCards } from "lucide-react";
import {
  formatTime,
  liveAuthorizationLabel,
  type AutoTradingEconomics,
  type AutoTradingHistoryEvent,
  type AutoTradingProductionStrategySnapshot,
  type AutoTradingState
} from "../shared/auto-trading-contract";
import {
  autoTradingDailyDrawdown,
  autoTradingProfitDrawdown,
  autoTradingRuntimeHealth,
  decisionLabel,
  executionModeLabel,
  formatFeeBreakdown,
  formatNumber,
  ledgerMoney,
  localizeMonitoringText,
  money,
  numberValue,
  orderStateLabel,
  percentRate,
  providerLabel,
  riskDecisionLabel,
  showBuiltInAutoTradingSignalControls,
  signedLedgerMoney,
  signedMoney,
  stringValue,
  type MonitoringSnapshot
} from "./auto-trading-model";

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
