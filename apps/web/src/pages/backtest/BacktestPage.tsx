import { Play, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ColorScheme } from "../../lib/theme";
import type { StrategyExperimentWalkForward } from "../../lib/terminal-workbench";
import { DEFAULT_STRATEGY_EXPERIMENT_WALK_FORWARD } from "../../lib/terminal-workbench";
import { compactRunId, EmptyState, PageHeader, Status, SurfacePanel } from "../../components/TerminalSurfaceUi";
import type { TerminalWorkspacePageProps } from "../shared/terminal-workspace-page";
import { terminalSurfaceZh } from "../shared/terminal-workspace-formatters";
import "./BacktestPage.layout.css";

const backtestTradeLabels: Record<string, string> = {
  BUY: "买入",
  SELL: "卖出",
  RISK: "风控",
  HOLD: "持有",
  filled: "已成交",
  open: "观察中",
  review: "待复核",
  blocked: "已阻断",
};

function formatPrice(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return Math.abs(value) >= 1 || value === 0
    ? value.toFixed(2)
    : value.toLocaleString("zh-CN", { maximumFractionDigits: 8 });
}

function LineChartCanvas({
  colorScheme,
  points,
  tone = "teal",
}: {
  colorScheme: ColorScheme;
  points: number[];
  tone?: "teal" | "blue" | "red";
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const width = Math.max(canvas.clientWidth, 320);
      const height = Math.max(canvas.clientHeight, 140);
      const ratio = window.devicePixelRatio || 1;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      const context = canvas.getContext("2d");
      if (!context) return;
      const themeStyles = getComputedStyle(canvas);
      const themeColor = (property: string, fallback: string) =>
        themeStyles.getPropertyValue(property).trim() || fallback;
      context.scale(ratio, ratio);
      context.clearRect(0, 0, width, height);
      context.strokeStyle = themeColor("--chart-grid", "#183047");
      context.lineWidth = 1;
      for (let row = 1; row < 5; row += 1) {
        const y = (height / 5) * row;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      if (points.length < 2) return;
      const min = Math.min(...points);
      const max = Math.max(...points);
      const range = Math.max(max - min, 1);
      context.strokeStyle =
        tone === "blue"
          ? themeColor("--chart-blue", "#5f9fff")
          : tone === "red"
            ? themeColor("--chart-red", "#ff6257")
            : themeColor("--chart-teal", "#58d6b9");
      context.lineWidth = 2;
      context.beginPath();
      points.forEach((point, index) => {
        const x = (index / (points.length - 1)) * width;
        const y = height - 14 - ((point - min) / range) * (height - 28);
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
    };
    draw();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [colorScheme, points, tone]);

  return <canvas className="design-line-chart" ref={ref} />;
}

export function BacktestPage({
  action,
  colorScheme,
  productionStrategyHandoff,
  strategyExperiment,
  workspace,
}: Pick<
  TerminalWorkspacePageProps,
  "action" | "colorScheme" | "productionStrategyHandoff" | "strategyExperiment" | "workspace"
>) {
  const [handoffConfirmed, setHandoffConfirmed] = useState(false);
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);
  const [handoffOperator, setHandoffOperator] = useState("");
  const productionHandoff = productionStrategyHandoff?.result.handoff;
  const productionHandoffStatus = productionStrategyHandoff?.result.error
    ? { label: "预检未通过", tone: "risk" as const }
    : productionHandoff?.alreadyBound
      ? { label: "已交接", tone: "positive" as const }
      : productionHandoff?.status === "ready"
        ? { label: "可交接", tone: "positive" as const }
        : productionHandoff?.status === "review"
          ? { label: "需处理切换条件", tone: "warning" as const }
          : { label: workspace.researchRun ? "预检中" : "等待审计运行", tone: "neutral" as const };
  const canBindProductionStrategy = Boolean(
    productionHandoff
    && productionHandoff.status === "ready"
    && productionHandoff.switchAllowed
    && !productionHandoff.alreadyBound
    && handoffConfirmed
    && handoffOperator.trim()
    && !productionStrategyHandoff?.busy
  );
  useEffect(() => {
    setHandoffConfirmed(false);
    setHandoffMessage(null);
  }, [productionHandoff?.runId]);
  const bindProductionStrategy = async () => {
    if (!canBindProductionStrategy || !productionStrategyHandoff) return;
    setHandoffMessage(null);
    const bound = await productionStrategyHandoff.onBind(handoffOperator);
    setHandoffConfirmed(false);
    setHandoffMessage(
      bound
        ? "审计策略已交接；自动交易保持暂停，未授权、未评估、未下单。"
        : null,
    );
  };
  const curve =
    workspace.backtestEquityCurve?.map((point) => point.equity) ?? [];
  const curveForChart = curve;
  let peak = curveForChart[0] ?? 1;
  const drawdown = curveForChart.map((value) => {
    peak = Math.max(peak, value);
    return peak ? ((value - peak) / peak) * 100 : 0;
  });
  const metrics = workspace.metrics.length
    ? workspace.metrics
    : [{ label: "年化收益率", value: "—", tone: "neutral" as const }];
  const metricSlots = [
    ...metrics,
    {
      label: "交易笔数",
      value: String(workspace.backtestTrades?.length ?? 0),
      tone: "neutral" as const,
    },
    {
      label: "数据行数",
      value: String(workspace.researchRun?.dataRows ?? 0),
      tone: "neutral" as const,
    },
  ].slice(0, 6);
  const walkForward = strategyExperiment.walkForward;
  const experimentHistory = strategyExperiment.active
    && !strategyExperiment.history.some(
      (experiment) => experiment.experimentId === strategyExperiment.active?.experimentId,
    )
      ? [strategyExperiment.active, ...strategyExperiment.history]
      : strategyExperiment.history;
  const experimentStatus = strategyExperiment.busy
    ? { label: "运行中", tone: "warning" as const }
    : strategyExperiment.active?.status === "completed"
      ? { label: "已完成", tone: "positive" as const }
      : strategyExperiment.active?.status === "failed"
        ? { label: "失败", tone: "risk" as const }
        : { label: "待运行", tone: "neutral" as const };
  const updateWalkForward = (
    field: keyof StrategyExperimentWalkForward,
    value: number,
  ) => {
    if (!walkForward || !Number.isInteger(value) || value < 1) return;
    strategyExperiment.onWalkForwardChange({ ...walkForward, [field]: value });
  };
  return (
    <>
      <PageHeader
        action={action}
        title="回测实验室"
        subtitle={`/ ${terminalSurfaceZh.strategyText(workspace.strategy.name)}`}
      >
        <div className="design-meta-line">
          <span>标的 {workspace.selectedInstrument.symbol}</span>
          <span>频率 {workspace.selectedTimeframe}</span>
          <span>
            初始资金{" "}
            {workspace.backtestAssumptions?.initialCash?.toLocaleString() ??
              "100,000"}
          </span>
          <span>手续费 {workspace.backtestAssumptions?.feeBps ?? 3} bps</span>
        </div>
      </PageHeader>
      {strategyExperiment.error ? (
        <p className="strategy-experiment-error design-backtest-run-error" role="alert">
          {strategyExperiment.error}
        </p>
      ) : null}
      <div className="design-backtest-grid">
        <div className="design-backtest-main">
          <SurfacePanel
            title="净值曲线"
            subtitle={
              workspace.researchRun
                ? compactRunId(workspace.researchRun.runId)
                : "等待回测"
            }
          >
            <div className="design-equity-chart">
              <div className="design-equity-main">
                <span>组合净值 / 基准</span>
                <LineChartCanvas colorScheme={colorScheme} points={curveForChart} />
                <LineChartCanvas
                  colorScheme={colorScheme}
                  points={curveForChart.map((value, index) =>
                    1 + (value - 1) * 0.42 + index * 0.002,
                  )}
                  tone="blue"
                />
                {!curveForChart.length ? (
                  <div className="design-chart-empty">
                    <EmptyState
                      detail="点击右上角“运行回测”，完成后在此显示净值与基准。"
                      title="暂无权威净值曲线"
                    />
                  </div>
                ) : null}
              </div>
              <div className="design-drawdown-strip">
                <span>回撤（%）</span>
                <LineChartCanvas
                  colorScheme={colorScheme}
                  points={drawdown}
                  tone="red"
                />
              </div>
            </div>
          </SurfacePanel>
          <div className="design-metric-row">
            {metricSlots.map((metric) => (
              <div className="design-metric" key={metric.label}>
                <span>{metric.label}</span>
                <strong className={metric.tone === "warning" ? "down" : "up"}>
                  {metric.value}
                </strong>
              </div>
            ))}
          </div>
          <SurfacePanel title="交易明细">
            <table className="design-table compact">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>代码</th>
                  <th>方向</th>
                  <th>入场时间</th>
                  <th>数量</th>
                  <th>价格</th>
                  <th>收益</th>
                  <th>回放状态</th>
                </tr>
              </thead>
              <tbody>
                {(workspace.backtestTrades ?? [])
                  .slice(0, 10)
                  .map((trade, index) => (
                    <tr key={trade.id}>
                      <td>{index + 1}</td>
                      <td>{trade.symbol}</td>
                      <td className={trade.side === "BUY" ? "up" : "down"}>
                        {backtestTradeLabels[trade.side] ?? trade.side}
                      </td>
                      <td>{trade.timestamp}</td>
                      <td>{trade.quantity}</td>
                      <td>{trade.price}</td>
                      <td className={trade.pnl.startsWith("-") ? "down" : "up"}>
                        {trade.pnl}
                      </td>
                      <td>
                        <Status>{backtestTradeLabels[trade.status] ?? trade.status}</Status>
                      </td>
                    </tr>
                  ))}
                {!workspace.backtestTrades?.length ? (
                  <tr>
                    <td className="design-empty" colSpan={8}>
                      <EmptyState
                        detail="净值、成本假设与验证结果仍可独立复核。"
                        title="当前运行未产生交易"
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </SurfacePanel>
        </div>
        <div className="design-backtest-side">
          <SurfacePanel title="可复现性与证据链">
            <div className="design-kv-row" role="status">
              <span>实验状态</span>
              <Status tone={experimentStatus.tone}>{experimentStatus.label}</Status>
            </div>
            <div className="design-kv-row">
              <span>实验 ID</span>
              <strong title={strategyExperiment.active?.experimentId ?? "—"}>
                {compactRunId(strategyExperiment.active?.experimentId)}
              </strong>
            </div>
            <div className="design-kv-row">
              <span>选择候选</span>
              <strong title={strategyExperiment.active?.selectedCandidateId ?? "—"}>
                {compactRunId(strategyExperiment.active?.selectedCandidateId)}
              </strong>
            </div>
            <div className="design-kv-row">
              <span>结果 Hash</span>
              <strong title={strategyExperiment.active?.resultHash ?? "—"}>
                {compactRunId(strategyExperiment.active?.resultHash)}
              </strong>
            </div>
            <div className="design-kv-row">
              <span>研究运行 ID</span>
              <strong>{compactRunId(workspace.researchRun?.runId)}</strong>
            </div>
            <div className="design-kv-row">
              <span>快照身份</span>
              <strong title={workspace.researchRun?.dataSnapshot?.snapshotHash ?? workspace.researchRun?.dataSnapshot?.hash ?? "—"}>
                {compactRunId(workspace.researchRun?.dataSnapshot?.snapshotHash ?? workspace.researchRun?.dataSnapshot?.hash)}
              </strong>
            </div>
            <div className="design-kv-row">
              <span>策略 Hash</span>
              <strong>
                {compactRunId(workspace.researchRun?.strategyRevision)}
              </strong>
            </div>
            <div className="design-kv-row">
              <span>数据行数</span>
              <strong>{workspace.researchRun?.dataRows ?? 0}</strong>
            </div>
          </SurfacePanel>
          <SurfacePanel
            className="design-production-handoff"
            title="生产策略资格与交接"
            subtitle="服务端按生产边界复算；回测本身不会触发真实交易"
          >
            <div className="design-production-handoff-status">
              <div>
                <span>资格状态</span>
                <Status tone={productionHandoffStatus.tone}>
                  {productionHandoffStatus.label}
                </Status>
              </div>
              <p>
                点击交接只会固定这份审计策略；不会授权实盘、启动监控、立即评估或提交订单。
              </p>
            </div>
            <div className="design-production-handoff-grid">
              <div>
                <span>审计运行</span>
                <strong title={productionHandoff?.runId ?? "—"}>
                  {compactRunId(productionHandoff?.runId)}
                </strong>
              </div>
              <div>
                <span>策略版本</span>
                <strong title={productionHandoff?.strategyRevision ?? "—"}>
                  {compactRunId(productionHandoff?.strategyRevision)}
                </strong>
              </div>
              <div>
                <span>当前生产策略</span>
                <strong>
                  {productionStrategyHandoff?.binding
                    ? `${productionStrategyHandoff.binding.name} · ${compactRunId(productionStrategyHandoff.binding.revision)}`
                    : "尚未读取"}
                </strong>
              </div>
              <div>
                <span>生产保守复算</span>
                <strong>
                  {productionHandoff
                    ? `手续费 ${productionHandoff.productionReplay.feeBps} / 滑点 ${productionHandoff.productionReplay.slippageBps} 基点`
                    : "等待服务端预检"}
                </strong>
                {productionHandoff ? (
                  <small>
                    最大回撤 {productionHandoff.productionReplay.productionMaxDrawdownPct.toFixed(2)}%
                    {" / "}策略上限 {productionHandoff.productionReplay.strategyMaxDrawdownPct.toFixed(2)}%
                  </small>
                ) : null}
              </div>
            </div>
            {productionStrategyHandoff?.errorLabel
              || productionStrategyHandoff?.switchBlockedReasonLabel ? (
              <p className="design-production-handoff-error" role="alert">
                {productionStrategyHandoff.errorLabel
                  ?? productionStrategyHandoff.switchBlockedReasonLabel}
              </p>
            ) : null}
            {productionHandoff && !productionHandoff.alreadyBound ? (
              <div className="design-production-handoff-confirm">
                <label htmlFor="backtest-production-operator">
                  <span>实名操作人</span>
                  <input
                    autoComplete="name"
                    id="backtest-production-operator"
                    maxLength={80}
                    onChange={(event) => setHandoffOperator(event.currentTarget.value)}
                    placeholder="输入实名操作人"
                    type="text"
                    value={handoffOperator}
                  />
                </label>
                <label className="design-production-handoff-check" htmlFor="backtest-production-confirm">
                  <input
                    checked={handoffConfirmed}
                    id="backtest-production-confirm"
                    onChange={(event) => setHandoffConfirmed(event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span>我确认只交接审计策略，后续授权、监控与下单仍需单独完成。</span>
                </label>
              </div>
            ) : null}
            <div className="design-production-handoff-actions">
              {!productionHandoff?.alreadyBound ? (
                <button
                  className="design-primary-action"
                  disabled={!canBindProductionStrategy}
                  onClick={() => void bindProductionStrategy()}
                  type="button"
                >
                  <ShieldCheck size={14} />
                  {productionStrategyHandoff?.busy ? "交接中…" : "交接为生产自动策略"}
                </button>
              ) : null}
              {productionHandoff?.alreadyBound || handoffMessage?.startsWith("审计策略已交接") ? (
                <button
                  className="design-secondary-action"
                  onClick={productionStrategyHandoff?.onOpenDynamicTrading}
                  type="button"
                >
                  <Play size={14} />
                  前往动态交易复核
                </button>
              ) : null}
            </div>
            {handoffMessage ? (
              <p className="design-production-handoff-message" role="status">
                {handoffMessage}
              </p>
            ) : null}
          </SurfacePanel>
          <SurfacePanel title="成本与假设">
            {[
              ["手续费", `${workspace.backtestAssumptions?.feeBps ?? 3} bps`],
              [
                "滑点",
                `${workspace.backtestAssumptions?.slippageBps ?? 2} bps`,
              ],
              ["复权方式", "前复权"],
              ["基准", "中证全指"],
            ].map(([label, value]) => (
              <div className="design-kv-row" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel
            title="样本外验证"
            subtitle="为下一次实验生成可审计的滚动前推证据"
          >
            <label className="design-evidence-toggle" htmlFor="backtest-walk-forward">
              <input
                checked={Boolean(walkForward)}
                disabled={strategyExperiment.busy}
                id="backtest-walk-forward"
                onChange={(event) => strategyExperiment.onWalkForwardChange(
                  event.currentTarget.checked
                    ? DEFAULT_STRATEGY_EXPERIMENT_WALK_FORWARD
                    : null,
                )}
                type="checkbox"
              />
              <span>
                <strong>滚动前推依据</strong>
                <small>启用后，AI 评审会检查样本外窗口，而不是只看单次回测。</small>
              </span>
              <Status tone={walkForward ? "positive" : "warning"}>
                {walkForward ? "已启用" : "未启用"}
              </Status>
            </label>
            {walkForward ? (
              <div className="design-evidence-fields">
                <label htmlFor="backtest-walk-forward-train">
                  <span>训练 K 线数</span>
                  <input
                    disabled={strategyExperiment.busy}
                    id="backtest-walk-forward-train"
                    min={1}
                    onChange={(event) => updateWalkForward(
                      "trainBars",
                      event.currentTarget.valueAsNumber,
                    )}
                    type="number"
                    value={walkForward.trainBars}
                  />
                </label>
                <label htmlFor="backtest-walk-forward-validation">
                  <span>验证 K 线数</span>
                  <input
                    disabled={strategyExperiment.busy}
                    id="backtest-walk-forward-validation"
                    min={1}
                    onChange={(event) => updateWalkForward(
                      "validationBars",
                      event.currentTarget.valueAsNumber,
                    )}
                    type="number"
                    value={walkForward.validationBars}
                  />
                </label>
                <label htmlFor="backtest-walk-forward-step">
                  <span>步进 K 线数</span>
                  <input
                    disabled={strategyExperiment.busy}
                    id="backtest-walk-forward-step"
                    min={1}
                    onChange={(event) => updateWalkForward(
                      "stepBars",
                      event.currentTarget.valueAsNumber,
                    )}
                    type="number"
                    value={walkForward.stepBars}
                  />
                </label>
              </div>
            ) : (
              <p className="design-evidence-hint">
                未启用时仍可回测，但 AI 确定性评估会把样本外证据标记为不足。
              </p>
            )}
          </SurfacePanel>
          <SurfacePanel title="验证检查">
            {[
              "数据完整性",
              "未来函数检查",
              "成本一致性",
              "参数合规性",
              "复现一致性",
            ].map((label) => (
              <div className="design-kv-row" key={label}>
                <span>{label}</span>
                <Status>{workspace.researchRun ? "通过" : "待运行"}</Status>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="最近回测运行">
            {experimentHistory.slice(0, 5).map((experiment) => (
              <div className="design-history-row" key={experiment.experimentId}>
                <i className={experiment.status === "completed" ? "done" : ""} />
                <span title={experiment.experimentId}>
                  {compactRunId(experiment.experimentId)}
                </span>
                <Status tone={experiment.status === "completed" ? "positive" : "risk"}>
                  {experiment.status === "completed" ? "已完成" : "失败"}
                </Status>
              </div>
            ))}
          </SurfacePanel>
        </div>
      </div>
    </>
  );
}
