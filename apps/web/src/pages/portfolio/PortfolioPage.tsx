import { AlertTriangle, Check, Play, RefreshCw, XCircle } from "lucide-react";
import { PortfolioM5Section } from "../../components/PortfolioM5Section";
import { compactRunId, EmptyState, PageHeader, Status, SurfacePanel } from "../../components/TerminalSurfaceUi";
import { liveAuthorizationLabel } from "../shared/auto-trading-contract";
import type { TerminalWorkspacePageProps } from "../shared/terminal-workspace-page";
import "./PortfolioPage.layout.css";

function DonutCanvas({ cashWeight }: { cashWeight: number }) {
  const equityPercent = Math.min(100, Math.max(0, (1 - cashWeight) * 100));
  return (
    <div
      aria-label="组合权益占比"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={equityPercent}
      aria-valuetext={`${equityPercent.toFixed(1)}%`}
      className="design-portfolio-donut"
      role="meter"
    >
      <svg aria-hidden="true" viewBox="0 0 100 100">
        <circle className="design-portfolio-donut-track" cx="50" cy="50" r="43" />
        {equityPercent > 0 ? (
          <circle
            className="design-portfolio-donut-value"
            cx="50"
            cy="50"
            pathLength="100"
            r="43"
            strokeDasharray="100"
            strokeDashoffset={100 - equityPercent}
            transform="rotate(-90 50 50)"
          />
        ) : null}
      </svg>
      <span>
        <strong>{equityPercent.toFixed(1)}%</strong>
        <small>权益占比</small>
      </span>
    </div>
  );
}

export function PortfolioPage({
  action,
  approvingPortfolioOrderId,
  onApprovePortfolioOrder,
  onRejectPortfolioOrder,
  portfolio,
  portfolioActionError,
  portfolioGoldenPath,
  portfolioPaperOrderApprovalRows,
  portfolioProductionRisk,
  portfolioRiskAssessment,
  portfolioStage4Workflow,
  productionStrategyHandoff,
  isRunningPortfolioRiskAssessment,
  onRunPortfolioRiskAssessment,
  workspace,
}: Pick<
  TerminalWorkspacePageProps,
  | "action"
  | "approvingPortfolioOrderId"
  | "onApprovePortfolioOrder"
  | "onRejectPortfolioOrder"
  | "portfolio"
  | "portfolioActionError"
  | "portfolioGoldenPath"
  | "portfolioPaperOrderApprovalRows"
  | "portfolioProductionRisk"
  | "portfolioRiskAssessment"
  | "portfolioStage4Workflow"
  | "productionStrategyHandoff"
  | "isRunningPortfolioRiskAssessment"
  | "onRunPortfolioRiskAssessment"
  | "workspace"
>) {
  const cashWeight = portfolio?.cashWeight ?? 1;
  const legs = portfolio?.legs ?? [];
  const riskAllocations = new Map(
    (portfolioRiskAssessment?.allocations ?? []).map((row) => [row.symbol, row]),
  );
  const approvalRows = portfolioPaperOrderApprovalRows ?? [];
  const pendingApprovalCount = approvalRows.filter(
    (row) => row.state === "awaiting_operator_review" || row.state === "risk_review",
  ).length;
  const approvedRows = approvalRows.filter((row) => row.state === "ready_for_simulation");
  const skippedApprovalCount = approvalRows.filter((row) => row.state === "skipped").length;
  const rejectedApprovalCount = approvalRows.filter(
    (row) => row.state === "operator_rejected" || row.state === "risk_rejected",
  ).length;
  const invalidApprovalCount = approvalRows.filter((row) => row.state === "invalid_order").length;
  const stepLabels: Record<string, string> = {
    "portfolio-build": "组合构建",
    "risk-review": "风控复核",
    "operator-approval": "人工审批",
    "paper-simulation": "批量模拟成交",
    "account-replay": "账户回放",
  };
  const steps = portfolioGoldenPath?.steps ??
    Object.entries(stepLabels).map(([id, label], index) => ({
      id,
      label,
      passed: false,
      status: "review" as const,
      detail: index === 0 ? "等待组合构建" : "等待前置步骤",
      actionId: index === 0 ? "run-portfolio-backtest" : null,
    }));
  const currentStepId = portfolioGoldenPath?.currentStepId ?? "portfolio-build";
  const showApprovalPanel =
    currentStepId === "operator-approval" || approvalRows.some((row) => row.state !== "skipped");
  const currentStep = steps.find((step) => step.id === currentStepId) ?? steps[0];
  const goldenPathComplete = portfolioGoldenPath?.status === "ready";
  const currentStepLabel = goldenPathComplete
    ? "黄金路径已完成"
    : stepLabels[currentStep?.id] ?? currentStep?.label ?? "组合构建";
  const productionSnapshot = portfolioProductionRisk?.snapshot;
  const productionState = productionSnapshot?.state;
  const productionBinding = productionSnapshot?.strategyBinding;
  const productionRiskTarget = productionState?.lastDecisionContract?.riskAdjustedTarget;
  const productionRiskEvidence = productionRiskTarget?.evidence;
  const productionPortfolioCoverageCount = productionBinding?.auditRunId
    ? legs.filter((leg) => {
      const allocation = riskAllocations.get(leg.symbol);
      return leg.symbol === productionBinding.symbol
        && allocation?.sourceRunId === productionBinding.auditRunId;
    }).length
    : 0;
  const productionCoversCurrentPortfolio =
    legs.length === 1 && productionPortfolioCoverageCount === 1;
  const productionRiskReady = Boolean(
    productionState?.executionMode === "live"
    && productionState.enabled
    && productionState.runnerState === "running"
    && productionState.runnerHealth?.status === "running"
    && !productionState.dailyRiskHaltReason
    && productionState.lastAccountCheck?.accountCovered === true
    && productionBinding?.status === "ready"
    && productionSnapshot?.liveTradingAllowed
    && productionSnapshot.orderSubmissionEnabled
    && !productionSnapshot.liveBlockedBoundary
  );
  const productionRiskTone: "positive" | "warning" | "risk" | "neutral" =
    portfolioProductionRisk?.error
      ? "risk"
      : !productionSnapshot || portfolioProductionRisk?.loading
        ? "neutral"
        : productionRiskReady && productionCoversCurrentPortfolio
          ? "positive"
          : productionRiskReady
            ? "warning"
          : productionState?.executionMode === "live"
            ? "risk"
            : "warning";
  const productionRiskStatus =
    portfolioProductionRisk?.error
      ? "生产风险读取失败"
      : !productionSnapshot || portfolioProductionRisk?.loading
        ? "正在读取生产风险"
        : productionRiskReady && productionCoversCurrentPortfolio
          ? "生产风险链运行中 · 已覆盖当前单策略组合"
          : productionRiskReady
            ? "独立生产链运行中 · 未覆盖当前研究组合"
          : productionState?.executionMode === "live"
            ? "生产风险链已阻断"
            : productionState?.executionMode === "testnet"
              ? "当前为测试网风险链"
              : "当前为纸面模拟风险链";
  const productionModeLabel = productionState?.executionMode === "live"
    ? "生产实盘"
    : productionState?.executionMode === "testnet"
      ? "测试网"
      : productionState
        ? "纸面模拟"
        : "等待连接";
  const productionRunnerLabel = productionState?.runnerHealth?.status === "running"
    ? "后台运行正常"
    : productionState?.runnerHealth?.status === "delayed"
      ? "后台心跳延迟"
      : productionState?.runnerHealth?.status === "blocked"
        ? "后台风险阻断"
        : productionState?.runnerState === "stopping"
          ? "正在停止"
          : productionState
            ? "后台已停止"
            : "—";
  const productionDecisionLabel = ({
    preserve: "保持目标",
    reduce: "下调目标",
    zero: "清零目标",
    reject: "拒绝目标",
  } as Record<string, string>)[productionRiskTarget?.decision ?? ""] ?? "尚无风险调整";
  const productionBaseAsset =
    (productionBinding?.symbol ?? productionState?.symbol)?.split("/")[0] ?? "标的";
  return (
    <>
      <PageHeader
        action={action}
        title="组合风控"
        subtitle={`/ ${portfolio?.name ?? "核心组合"}`}
      >
        <div aria-label="组合黄金路径进度" className="design-portfolio-steps">
          {steps.map((step, index) => {
            const isCurrent = !goldenPathComplete && step.id === currentStepId;
            return (
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`${step.passed ? "done" : ""} ${isCurrent ? "active" : ""} ${
                  isCurrent && step.status === "blocked" ? "blocked" : ""
                }`.trim()}
                key={step.id}
              >
                <i>{step.passed ? <Check size={12} /> : index + 1}</i>
                {stepLabels[step.id] ?? step.label}
              </span>
            );
          })}
        </div>
      </PageHeader>
      {portfolioActionError ? (
        <div className="design-portfolio-action-error" role="alert">
          <AlertTriangle aria-hidden="true" size={17} />
          <div>
            <strong>暂时无法继续黄金路径</strong>
            <span>{portfolioActionError}</span>
          </div>
        </div>
      ) : null}
      <div className="design-portfolio-grid">
        <SurfacePanel className="design-portfolio-summary" title="组合配置概览">
          <DonutCanvas cashWeight={cashWeight} />
          <div className="design-kv-row">
            <span>现金缓冲</span>
            <strong>{(cashWeight * 100).toFixed(2)}%</strong>
          </div>
          <div className="design-kv-row">
            <span>组合资产</span>
            <strong>
              {portfolio ? portfolio.initialCash.toLocaleString() : "等待构建"}
            </strong>
          </div>
        </SurfacePanel>
        <SurfacePanel
          className="design-portfolio-positions"
          title="组合腿位（已通过同市场/同周期运行审计）"
        >
          <table className="design-table">
            <thead>
              <tr>
                <th>代码</th>
                <th>策略 / 运行</th>
                <th>目标权重</th>
                <th>当前权重</th>
                <th>贡献度</th>
                <th>数据质量</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {legs.map((leg) => {
                const allocation = riskAllocations.get(leg.symbol);
                return (
                <tr key={leg.symbol}>
                  <td>{leg.symbol}</td>
                  <td>{compactRunId(allocation?.sourceRunId ?? workspace.researchRun?.runId)}</td>
                  <td>{(leg.targetWeight * 100).toFixed(2)}%</td>
                  <td>{allocation ? `${(allocation.currentWeight * 100).toFixed(2)}%` : "待评估"}</td>
                  <td
                    className={leg.contributionReturnPct >= 0 ? "up" : "down"}
                  >
                    {leg.contributionReturnPct.toFixed(2)}%
                  </td>
                  <td>{leg.dataQuality.rows}</td>
                  <td>
                    <Status tone={allocation?.status === "blocked" ? "risk" : allocation ? "positive" : "warning"}>
                      {allocation?.status === "blocked" ? "阻断" : allocation ? "已核对" : "待评估"}
                    </Status>
                  </td>
                </tr>
                );
              })}
              {!legs.length ? (
                <tr>
                  <td colSpan={7} className="design-empty">
                    <EmptyState
                      detail="继续右上角黄金路径，通过同市场、同周期审计后显示。"
                      title="暂无可展示的组合腿"
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </SurfacePanel>
        <div className="design-portfolio-side">
          <SurfacePanel title="工作流与权限">
            <div className="design-kv-row">
              <span>组合所有者</span>
              <strong>quant.user</strong>
            </div>
            <div className="design-kv-row">
              <span>当前步骤</span>
              <strong>{currentStepLabel}</strong>
            </div>
            <div className="design-kv-row">
              <span>操作权限</span>
              <Status tone={portfolioGoldenPath?.status === "blocked" ? "risk" : "positive"}>
                {portfolioGoldenPath?.status === "blocked"
                  ? "当前步骤已阻断"
                  : goldenPathComplete
                    ? "流程已完成"
                    : "可继续推进"}
              </Status>
            </div>
            <div className="design-kv-row">
              <span>高级组合风险评估</span>
              <Status
                tone={
                  portfolioRiskAssessment?.batch.status === "blocked"
                    ? "risk"
                    : portfolioStage4Workflow || portfolioRiskAssessment
                      ? "positive"
                      : "warning"
                }
              >
                {portfolioRiskAssessment?.batch.status === "blocked"
                  ? "最近评估已阻断"
                  : portfolioRiskAssessment
                    ? "已有可审计评估"
                    : portfolioStage4Workflow
                      ? "Stage 4 已就绪"
                      : "等待 Stage 4 账户回放"}
              </Status>
            </div>
          </SurfacePanel>
          <SurfacePanel title="审批状态">
            <div className="design-kv-row">
              <span>提交状态</span>
              <strong>
                {approvalRows.length
                  ? pendingApprovalCount
                    ? `${pendingApprovalCount} 笔待审批`
                    : rejectedApprovalCount
                      ? `${rejectedApprovalCount} 笔审批未通过`
                      : invalidApprovalCount
                        ? `${invalidApprovalCount} 笔委托无效`
                    : skippedApprovalCount === approvalRows.length
                      ? "无需人工审批"
                      : "审批完成"
                  : "—"}
              </strong>
            </div>
            <div className="design-kv-row">
              <span>审批人</span>
              <strong>{approvedRows[0]?.approvedBy ?? "—"}</strong>
            </div>
            <div className="design-kv-row">
              <span>审批意见</span>
              <strong>
                {rejectedApprovalCount
                  ? `${rejectedApprovalCount} 笔已拒绝`
                  : approvedRows.length
                    ? `${approvedRows.length} 笔已批准`
                    : skippedApprovalCount === approvalRows.length && approvalRows.length
                      ? "没有需审批委托"
                    : approvalRows.length
                      ? "等待人工确认"
                      : "—"}
              </strong>
            </div>
          </SurfacePanel>
          <SurfacePanel title="状态时间线">
            {steps.map((step) => {
              const isCurrent = !goldenPathComplete && step.id === currentStepId;
              return (
                <div className="design-history-row" key={step.id}>
                  <i className={step.passed ? "done" : isCurrent ? "current" : ""} />
                  <span>{stepLabels[step.id] ?? step.label}</span>
                  <strong>{step.passed ? "完成" : isCurrent ? "当前" : "—"}</strong>
                </div>
              );
            })}
          </SurfacePanel>
        </div>
        {portfolioProductionRisk ? (
          <SurfacePanel
            action={<Status tone={productionRiskTone}>{productionRiskStatus}</Status>}
            className="design-production-handoff design-portfolio-production-risk"
            subtitle="只读投影当前单策略自动交易链，不代表研究组合已接入生产"
            title="独立生产策略与运行风险"
          >
            <div className="design-production-handoff-status">
              <div>
                <span>生产运行状态</span>
                <strong>{productionRiskStatus}</strong>
              </div>
              <p>
                {portfolioProductionRisk.error
                  ?? (productionBinding?.status === "blocked" ? productionBinding.detail : null)
                  ?? (!productionBinding && productionSnapshot
                    ? "当前 API 尚未提供生产策略绑定证据，不能把最近决策解释为当前生产策略。"
                    : null)
                  ?? productionState?.detail
                  ?? "进入组合风控后会自动读取生产运行、账户覆盖与风险调整结果。"}
              </p>
            </div>
            <div className="design-production-handoff-grid">
              <div>
                <span>运行上下文</span>
                <strong>{productionState ? `${productionState.symbol} · ${productionState.timeframe}` : "—"}</strong>
                <small>{productionModeLabel} · {productionRunnerLabel}</small>
              </div>
              <div>
                <span>当前生产策略</span>
                <strong>{productionBinding?.name ?? "—"}</strong>
                <small>
                  {productionBinding
                    ? `修订 ${compactRunId(productionBinding.revision)} · ${productionBinding.status === "ready" ? "证据有效" : "证据阻断"}`
                    : "当前接口未提供绑定证据"}
                </small>
              </div>
              <div>
                <span>当前研究组合覆盖</span>
                <strong>
                  {legs.length
                    ? `${productionPortfolioCoverageCount} / ${legs.length} 个组合腿`
                    : "尚无研究组合"}
                </strong>
                <small>
                  {productionCoversCurrentPortfolio
                    ? `审计运行 ${compactRunId(productionBinding?.auditRunId)} 已匹配`
                    : "单策略生产链不会自动覆盖多标的研究组合"}
                </small>
              </div>
              <div>
                <span>风险调整目标</span>
                <strong>{productionDecisionLabel}</strong>
                <small>
                  {productionRiskTarget
                    ? `批准名义金额 ${productionRiskTarget.approvedNotional.toLocaleString("zh-CN", {
                      maximumFractionDigits: 4,
                    })} USDT`
                    : "尚无自动评估结果"}
                </small>
              </div>
              <div>
                <span>
                  {productionState?.accountAuthority === "binance_spot"
                    ? "Binance Spot 总净值 / BTC 现货总量"
                    : "策略账本权益 / 策略持仓"}
                </span>
                <strong>
                  {productionState
                    ? `${(productionState.accountEquity ?? productionState.equity).toLocaleString("zh-CN", {
                      maximumFractionDigits: 4,
                    })} USDT`
                    : "—"}
                </strong>
                <small>
                  {productionState
                    ? `${productionState.position.toLocaleString("zh-CN", {
                      maximumFractionDigits: 8,
                    })} ${productionBaseAsset}`
                    : "尚未读取账户快照"}
                </small>
              </div>
              <div>
                <span>亏损回撤</span>
                <strong>
                  {productionState
                    ? `${(productionState.dailyLossDrawdownPct ?? 0).toFixed(2)}% / ${productionState.dailyLossLimitPct.toFixed(2)}%`
                    : "—"}
                </strong>
                <small>{productionState?.dailyRiskHaltReason ? "已触发风险暂停" : "未触发亏损上限"}</small>
              </div>
              <div>
                <span>盈利回撤</span>
                <strong>
                  {productionState
                    ? `${(productionState.dailyProfitDrawdownPct ?? 0).toFixed(2)}% / ${productionState.dailyProfitDrawdownLimitPct.toFixed(2)}%`
                    : "—"}
                </strong>
                <small>按当日盈利峰值独立计算</small>
              </div>
              <div>
                <span>小时成交额度</span>
                <strong>
                  {productionState
                    ? `${productionRiskEvidence?.recentTradeCount ?? productionState.tradeTimestamps.length} / ${productionState.maxTradesPerHour} 笔`
                    : "—"}
                </strong>
                <small>来自最新风险调整证据</small>
              </div>
              <div>
                <span>账户与授权覆盖</span>
                <strong>{productionState?.lastAccountCheck?.accountCovered ? "账户已覆盖" : "等待账户覆盖"}</strong>
                <small>
                  生产授权：{liveAuthorizationLabel(productionState)}
                </small>
              </div>
            </div>
            {productionRiskTarget?.reason ? (
              <p className="design-production-handoff-message">
                最新风险判断：{productionRiskTarget.reason}
              </p>
            ) : null}
            <div className="design-production-handoff-actions">
              <button
                className="design-secondary-action"
                disabled={portfolioProductionRisk.loading}
                onClick={portfolioProductionRisk.onRefresh}
                type="button"
              >
                <RefreshCw className={portfolioProductionRisk.loading ? "spin" : undefined} size={14} />
                {portfolioProductionRisk.loading ? "刷新中…" : "刷新生产风险"}
              </button>
              <button
                className="design-secondary-action"
                disabled={!productionStrategyHandoff?.onOpenDynamicTrading}
                onClick={productionStrategyHandoff?.onOpenDynamicTrading}
                type="button"
              >
                <Play size={14} />
                前往动态交易复核
              </button>
            </div>
            <p className="design-production-handoff-message">
              下方组合研究评估仍为模拟链；当前生产后端只支持单策略、单标的运行，不会直接改写生产目标、授权或委托。
            </p>
          </SurfacePanel>
        ) : null}
        {showApprovalPanel ? (
          <SurfacePanel
            action={
              <Status tone={pendingApprovalCount ? "warning" : rejectedApprovalCount ? "risk" : "positive"}>
                {pendingApprovalCount
                  ? `${pendingApprovalCount} 笔待审批`
                  : rejectedApprovalCount
                    ? `${rejectedApprovalCount} 笔已拒绝`
                    : invalidApprovalCount
                      ? `${invalidApprovalCount} 笔委托无效`
                    : skippedApprovalCount === approvalRows.length
                      ? "无需人工审批"
                      : "审批完成"}
              </Status>
            }
            className="design-portfolio-approval"
            subtitle="人工确认只作用于模拟委托，不会提交真实订单"
            title="组合委托人工审批"
          >
            <div
              aria-label="组合委托人工审批"
              className="portfolio-order-approval"
              tabIndex={-1}
            >
              <div className="portfolio-order-approval-list">
                {approvalRows.map((row) => {
                  const isApproving = approvingPortfolioOrderId === row.id;
                  const sideLabel = row.side === "buy" ? "买入" : row.side === "sell" ? "卖出" : "持有";
                  const stateLabel =
                    row.state === "ready_for_simulation"
                      ? "已批准，等待模拟成交"
                      : row.state === "operator_rejected"
                        ? "人工已拒绝"
                        : row.state === "risk_rejected"
                          ? "风控已拒绝"
                          : row.state === "risk_review"
                            ? "等待风险复核"
                            : row.state === "invalid_order"
                              ? "委托无效"
                              : row.state === "skipped"
                                ? "无需审批"
                                : "等待人工审批";
                  const actionHint =
                    row.state === "ready_for_simulation"
                      ? "人工审批已通过，可以进入纸面模拟成交。"
                      : row.state === "operator_rejected"
                        ? "人工已拒绝，本委托不会进入模拟成交。"
                        : row.state === "risk_rejected"
                          ? "风控已拒绝，本委托不能进入模拟成交。"
                          : row.state === "risk_review"
                            ? "风险复核尚未完成，暂不能批准。"
                            : row.state === "invalid_order"
                              ? "委托参数无效，不能进入模拟成交。"
                              : row.state === "skipped"
                                ? "当前为持有或跳过委托，无需人工操作。"
                                : "风控已通过，等待人工批准或拒绝。";
                  return (
                    <article className={`portfolio-order-approval-row ${row.tone}`} key={row.id}>
                      <div>
                        <strong>{row.symbol} · {sideLabel}</strong>
                        <span>{row.orderId}</span>
                        <p>{actionHint}</p>
                      </div>
                      <div className="portfolio-order-approval-meta">
                        <span>
                          <small>数量</small>
                          {row.quantity.toLocaleString("zh-CN", { maximumFractionDigits: 4 })}
                        </span>
                        <span>
                          <small>名义金额</small>
                          {row.notionalValue.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}
                        </span>
                        <span>
                          <small>当前状态</small>
                          {stateLabel}
                        </span>
                      </div>
                      <div className="portfolio-order-approval-actions">
                        <button
                          aria-label={`批准 ${row.symbol}`}
                          className="approve"
                          disabled={!row.canApprove || isApproving || !onApprovePortfolioOrder}
                          onClick={() => onApprovePortfolioOrder?.(row)}
                          type="button"
                        >
                          {isApproving ? <RefreshCw className="spin" size={13} /> : <Check size={13} />}
                          批准
                        </button>
                        <button
                          aria-label={`拒绝 ${row.symbol}`}
                          className="reject"
                          disabled={!row.canReject || isApproving || !onRejectPortfolioOrder}
                          onClick={() => onRejectPortfolioOrder?.(row)}
                          type="button"
                        >
                          <XCircle size={13} />
                          拒绝
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </SurfacePanel>
        ) : null}
        {portfolioStage4Workflow || portfolioRiskAssessment ? (
          <PortfolioM5Section
            assessment={portfolioRiskAssessment ?? null}
            busy={isRunningPortfolioRiskAssessment ?? false}
            error={portfolioActionError}
            onAssess={onRunPortfolioRiskAssessment}
            workflow={portfolioStage4Workflow ?? null}
          />
        ) : null}
      </div>
    </>
  );
}
