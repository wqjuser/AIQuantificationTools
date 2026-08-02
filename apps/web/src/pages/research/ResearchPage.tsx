import { Save, Sparkles, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AiReviewProviderId } from "../../lib/ai-review-stage3";
import { marketAiSelectionHorizonLabels, marketAiSelectionProfileLabels } from "../../components/MarketAiSelectionPanel";
import { aiProviderLabels, compactRunId, EmptyState, PageHeader, Status, SurfacePanel } from "../../components/TerminalSurfaceUi";
import type { TerminalWorkspacePageProps } from "../shared/terminal-workspace-page";
import { formatPrice } from "../shared/terminal-workspace-formatters";
import "./ResearchPage.layout.css";

export function ResearchPage({
  action,
  chart,
  marketAiSelectionResearchOrigin,
  researchPreparation,
  runs,
  workspace,
}: Pick<
  TerminalWorkspacePageProps,
  "action" | "chart" | "marketAiSelectionResearchOrigin" | "researchPreparation" | "runs" | "workspace"
>) {
  const researchNoteInputRef = useRef<HTMLTextAreaElement>(null);
  const [researchEvidenceTab, setResearchEvidenceTab] = useState<
    "activity" | "evidence"
  >("activity");
  const activeRun = workspace.researchRun;
  const auditedRun = activeRun
    ? runs.find((run) => run.runId === activeRun.runId) ?? null
    : null;
  const evidenceRun = auditedRun
    ?? runs.find(
      (run) =>
        run.market === workspace.selectedInstrument.market
        && run.symbol === workspace.selectedInstrument.symbol
        && run.timeframe === workspace.selectedTimeframe,
    )
    ?? null;
  const evidenceQuality = evidenceRun?.dataQuality ?? activeRun?.dataQuality;
  const evidenceSnapshot = evidenceRun?.dataSnapshot ?? activeRun?.dataSnapshot;
  const marketAiSelectionEvidence = evidenceSnapshot?.marketAiSelectionEvidence;
  const evidenceStrategy = evidenceRun?.strategyConfig ?? activeRun?.strategyConfig;
  const hasResearchEvidence = Boolean(evidenceRun || activeRun);
  const metricNumber = (...keys: string[]): number | null => {
    for (const key of keys) {
      const value = evidenceRun?.metrics[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
    }
    return null;
  };
  const workspaceMetricNumber = (label: string): number | null => {
    if (!hasResearchEvidence) {
      return null;
    }
    const value = workspace.metrics.find((metric) => metric.label === label)?.value;
    if (!value) {
      return null;
    }
    const parsed = Number.parseFloat(value.replace(/[,%+]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const formatPercent = (value: number | null, includeSign = false): string => {
    if (value === null) {
      return "—";
    }
    return `${includeSign && value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  };
  const totalReturn = metricNumber("total_return_pct", "return_pct")
    ?? workspaceMetricNumber("Return");
  const maxDrawdown = metricNumber("max_drawdown_pct")
    ?? workspaceMetricNumber("Max DD");
  const winRate = metricNumber("win_rate_pct")
    ?? workspaceMetricNumber("Win Rate");
  const tradeCount = metricNumber("trade_count")
    ?? workspaceMetricNumber("Trades");
  const profitFactor = metricNumber("profit_factor");
  const previousRun = evidenceRun
    ? runs.find(
      (run) =>
        run.runId !== evidenceRun.runId
        && run.market === evidenceRun.market
        && run.symbol === evidenceRun.symbol
        && run.timeframe === evidenceRun.timeframe,
    )
    : null;
  const previousReturn = previousRun?.metrics.total_return_pct
    ?? previousRun?.metrics.return_pct
    ?? null;
  const returnDelta = totalReturn !== null && typeof previousReturn === "number"
    ? totalReturn - previousReturn
    : null;
  const overviewScore = hasResearchEvidence ? winRate : null;
  const overviewScoreValue = Math.min(100, Math.max(0, overviewScore ?? 0));
  const overviewScoreColor = overviewScore === null
    ? "var(--border-strong)"
    : overviewScoreValue >= 60
      ? "var(--teal)"
      : overviewScoreValue >= 40
        ? "var(--amber)"
        : "var(--danger)";
  const factorRows = [
    {
      label: "策略收益",
      value: formatPercent(totalReturn, true),
      quality: totalReturn === null ? "证据缺失" : "已绑定",
      tone: totalReturn === null ? "warning" : "positive",
    },
    {
      label: "回撤风险",
      value: formatPercent(maxDrawdown),
      quality: maxDrawdown === null ? "证据缺失" : "已绑定",
      tone: maxDrawdown === null ? "warning" : "positive",
    },
    {
      label: "交易胜率",
      value: formatPercent(winRate),
      quality: winRate === null ? "证据缺失" : "已绑定",
      tone: winRate === null ? "warning" : "positive",
    },
    {
      label: "收益结构",
      value: profitFactor === null ? "—" : profitFactor.toFixed(2),
      quality: profitFactor === null ? "证据缺失" : "已绑定",
      tone: profitFactor === null ? "warning" : "positive",
    },
    {
      label: "样本密度",
      value: `${evidenceRun?.dataRows ?? activeRun?.dataRows ?? 0} 行`,
      quality: evidenceRun || activeRun ? "已绑定" : "待运行",
      tone: evidenceRun || activeRun ? "positive" : "warning",
    },
    {
      label: "数据完整",
      value: evidenceQuality?.isComplete ? "完整" : "待复核",
      quality: evidenceQuality?.warnings.length
        ? `${evidenceQuality.warnings.length} 项警告`
        : evidenceQuality
          ? "通过"
          : "待运行",
      tone:
        evidenceQuality?.isComplete && evidenceQuality.warnings.length === 0
          ? "positive"
          : "warning",
    },
  ] as const;
  const createdAt = evidenceRun?.createdAt ?? activeRun?.createdAt ?? null;
  const createdTime = createdAt
    ? new Date(createdAt).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    : "—";
  const dataSource = evidenceSnapshot?.source ?? evidenceQuality?.source ?? "—";
  const adjustmentMode = evidenceSnapshot?.adjustmentMode ?? evidenceQuality?.adjustmentMode ?? "none";
  const freshness = evidenceSnapshot?.freshness ?? evidenceQuality?.freshness ?? "unknown";
  const coverage = evidenceSnapshot?.coverage ?? evidenceQuality?.coverage;
  const sourceComparison = evidenceSnapshot?.sourceComparison;
  const sourceComparisonLabel = !sourceComparison
    ? "暂无对照数据"
    : sourceComparison.status === "unavailable"
      ? sourceComparison.reason === "comparison_not_required_for_context"
        ? "当前场景无需对照"
        : sourceComparison.reason?.startsWith("secondary_source_failed")
          ? "第二来源不可用"
          : "未配置第二来源"
      : {
        agreement: "来源一致",
        warning: "差异待复核",
        blocked: "差异阻断",
      }[sourceComparison.status];
  const sourceComparisonTone = !sourceComparison || sourceComparison.status === "agreement"
    ? "positive"
    : sourceComparison.status === "blocked"
      ? "risk"
      : "warning";
  const sourceComparisonNextAction = sourceComparison?.status === "warning"
    || sourceComparison?.status === "blocked"
    ? `复核 ${sourceComparison.differences.length} 项差异`
    : sourceComparison?.status === "unavailable"
      && sourceComparison.reason !== "comparison_not_required_for_context"
      ? "按需配置只读对照源"
      : "无需处理";
  const dataRows = evidenceSnapshot?.rows
    ?? evidenceQuality?.rows
    ?? evidenceRun?.dataRows
    ?? activeRun?.dataRows
    ?? 0;
  const snapshotHash = evidenceSnapshot?.snapshotHash ?? evidenceSnapshot?.hash ?? "—";
  const runId = evidenceRun?.runId ?? activeRun?.runId ?? null;
  const strategyRevision = evidenceRun?.strategyRevision
    ?? activeRun?.strategyRevision
    ?? "—";
  const strategyName = evidenceRun?.strategyName
    ?? evidenceStrategy?.name
    ?? workspace.strategy.name;
  const activityRows = runId
    ? [
      {
        time: createdTime,
        label: "研究流水线",
        badge: "运行完成",
        headline: strategyName,
        detail: `版本 ${strategyRevision} · ${dataRows.toLocaleString()} 行审计数据`,
        tone: "positive",
      },
      {
        time: "同次运行",
        label: "回测指标",
        badge: "证据已绑定",
        headline: `收益 ${formatPercent(totalReturn, true)} · 回撤 ${formatPercent(maxDrawdown)}`,
        detail: `胜率 ${formatPercent(winRate)} · ${tradeCount ?? 0} 笔交易`,
        tone: "ai",
      },
      {
        time: "同次运行",
        label: "数据快照",
        badge: evidenceQuality?.isComplete ? "快照完整" : "需要复核",
        headline: `${dataSource} · ${dataRows.toLocaleString()} 行`,
        detail: evidenceSnapshot?.end
          ? `最新数据 ${new Date(evidenceSnapshot.end).toLocaleString("zh-CN")}`
          : "数据时间范围已随运行归档",
        tone: evidenceQuality?.isComplete ? "positive" : "warning",
      },
      {
        time: "同次运行",
        label: "AI 研究摘要",
        badge: evidenceRun?.aiReport ? "摘要已绑定" : "本地基线",
        headline: evidenceRun?.aiReport?.summary ?? "确定性基线优先，等待外部评审证据。",
        detail: evidenceRun?.aiReport?.risks[0] ?? "不生成买卖指令或保证收益。",
        tone: evidenceRun?.aiReport ? "ai" : "warning",
      },
      {
        time: "同次运行",
        label: "审计记录",
        badge: "可复现",
        headline: runId,
        detail: `${strategyRevision} · ${evidenceRun?.executionMode ?? activeRun?.executionMode ?? "paper_only"}`,
        tone: "positive",
      },
    ]
    : [];
  const evidenceRows = [
    ["运行 ID", runId ?? "等待首次运行"],
    ["数据快照", snapshotHash],
    ["策略版本", strategyRevision],
    [
      "数据质量",
      evidenceQuality
        ? `${evidenceQuality.isComplete ? "完整" : "需复核"} · ${evidenceQuality.warnings.length} 项警告`
        : "未绑定",
    ],
    ["AI 报告", evidenceRun?.aiReport ? "已绑定" : "确定性本地基线"],
  ];
  const noteDraftBody = researchPreparation.noteDraft.trim();
  const savedNote = researchPreparation.note.note;
  const savedNoteBody = savedNote?.body.trim() ?? "";
  const noteIsSaved = Boolean(
    noteDraftBody &&
    savedNote &&
    noteDraftBody === savedNoteBody,
  );
  const preparationIsSaved = noteIsSaved && researchPreparation.workspaceSaved;
  const selectedProvider = researchPreparation.providers.find(
    (provider) => provider.providerId === researchPreparation.providerId,
  ) ?? {
    providerId: "local" as const,
    configured: true,
    model: null,
    sanitizedBaseUrl: null,
  };
  const usesExternalProvider = selectedProvider.providerId !== "local";
  const canGenerateNote = !researchPreparation.isGeneratingNote
    && selectedProvider.configured
    && (!usesExternalProvider || researchPreparation.externalDataApproved);
  useEffect(() => {
    const researchNoteInput = researchNoteInputRef.current;
    if (!researchPreparation.isGeneratingNote || !researchNoteInput) {
      return;
    }
    researchNoteInput.scrollTop = researchNoteInput.scrollHeight;
  }, [
    researchPreparation.isGeneratingNote,
    researchPreparation.noteDraft,
  ]);
  return (
    <>
      <PageHeader
        action={action}
        title="研究工作台"
        subtitle={`/ ${workspace.selectedInstrument.symbol} ${workspace.selectedInstrument.name}`}
      >
        <div className="design-inline-quote">
          <strong>{formatPrice(workspace.selectedInstrument.price)}</strong>
          <span
            className={
              workspace.selectedInstrument.changePct >= 0 ? "up" : "down"
            }
          >
            {workspace.selectedInstrument.changePct.toFixed(2)}%
          </span>
          <span>
            当前研究状态：
            {activeRun ? "证据已绑定" : evidenceRun ? "历史证据已载入" : "待运行"}
          </span>
        </div>
        {marketAiSelectionResearchOrigin && !marketAiSelectionEvidence ? (
          <div className="design-inline-quote">
            <strong>AI 选股候选待核验</strong>
            <span title={marketAiSelectionResearchOrigin.candidateEvidenceId}>
              运行研究后由核心服务绑定冻结证据
            </span>
          </div>
        ) : null}
      </PageHeader>
      <div className="design-research-grid">
        <SurfacePanel
          className="design-research-chart"
          title="价格与成交"
          subtitle={`日 K · ${workspace.selectedTimeframe}`}
        >
          <div className="design-chart-host">{chart}</div>
        </SurfacePanel>
        <SurfacePanel
          className="design-factor-panel"
          title="因子/信号概览"
          action={
            <time className="design-factor-date" dateTime={createdAt ?? ""}>
              {createdAt ? new Date(createdAt).toLocaleDateString("zh-CN") : "等待运行"}
            </time>
          }
        >
          <div className="design-factor-score-summary">
            <div
              aria-label="回测胜率"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={overviewScore === null ? undefined : overviewScoreValue}
              aria-valuetext={
                overviewScore === null
                  ? "暂无回测胜率"
                  : `${overviewScoreValue.toFixed(1)}%`
              }
              className="design-factor-score-ring"
              role="meter"
            >
              <svg
                aria-hidden="true"
                className="design-factor-score-ring-visual"
                viewBox="0 0 100 100"
              >
                <circle
                  className="design-factor-score-ring-track"
                  cx="50"
                  cy="50"
                  r="45"
                />
                <circle
                  className="design-factor-score-ring-value"
                  cx="50"
                  cy="50"
                  pathLength="100"
                  r="45"
                  stroke={overviewScoreColor}
                  strokeDasharray="100"
                  strokeDashoffset={overviewScore === null ? 100 : 100 - overviewScoreValue}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <span>
                <strong style={{ color: overviewScoreColor }}>
                  {overviewScore === null ? "—" : overviewScoreValue.toFixed(1)}
                </strong>
                <small>回测胜率</small>
              </span>
            </div>
            <div className="design-factor-score-copy">
              <span>历史回测</span>
              <strong>
                {totalReturn === null
                  ? "等待运行"
                  : totalReturn >= 0
                    ? "录得正收益"
                    : "录得负收益"}
              </strong>
              <small>
                较上次{" "}
                <b className={returnDelta !== null && returnDelta < 0 ? "down" : "up"}>
                  {formatPercent(returnDelta, true)}
                </b>
              </small>
            </div>
          </div>
          <div className="design-factor-quality">
            <h4>运行指标（审计证据）</h4>
            <div className="design-factor-quality-head">
              <span>指标</span>
              <span>结果</span>
              <span>证据</span>
            </div>
            {factorRows.map((row) => (
              <div className="design-factor-quality-row" key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
                <em className={row.tone === "warning" ? "down" : "up"}>
                  {row.quality}
                </em>
              </div>
            ))}
          </div>
          <div className="design-forecast-summary">
            <h4>研究摘要（历史回测）</h4>
            <div><span>策略收益</span><strong className={totalReturn !== null && totalReturn < 0 ? "down" : "up"}>{formatPercent(totalReturn, true)}</strong></div>
            <div><span>运行胜率</span><strong>{formatPercent(winRate)}</strong></div>
            <div><span>盈亏比</span><strong>{profitFactor === null ? "—" : profitFactor.toFixed(2)}</strong></div>
            <div><span>最大回撤</span><strong>{formatPercent(maxDrawdown)}</strong></div>
            <div><span>审计样本</span><strong>{dataRows.toLocaleString()} 根 K 线</strong></div>
            <small>展示当前审计回测证据，不构成未来收益承诺。</small>
          </div>
        </SurfacePanel>
        <section className="design-panel design-research-timeline">
          <header className="design-panel-head">
            <div className="design-research-tabs" role="tablist" aria-label="研究证据视图">
              <button
                aria-selected={researchEvidenceTab === "activity"}
                className={researchEvidenceTab === "activity" ? "active" : ""}
                onClick={() => setResearchEvidenceTab("activity")}
                role="tab"
                type="button"
              >
                研究动态
              </button>
              <button
                aria-selected={researchEvidenceTab === "evidence"}
                className={researchEvidenceTab === "evidence" ? "active" : ""}
                onClick={() => setResearchEvidenceTab("evidence")}
                role="tab"
                type="button"
              >
                证据链
              </button>
            </div>
          </header>
          <div className="design-panel-body">
            {researchEvidenceTab === "activity" ? (
              <>
                <h4 className="design-timeline-heading">实时运行轨迹</h4>
                {activityRows.length ? activityRows.map((row) => (
                  <article
                    className={`design-timeline-row is-${row.tone}`}
                    key={row.label}
                  >
                    <i aria-hidden="true" />
                    <time dateTime={createdAt ?? ""}>{row.time}</time>
                    <div className="design-timeline-copy">
                      <div>
                        <strong>{row.label}</strong>
                        <Status tone={row.tone === "warning" ? "warning" : "positive"}>
                          {row.badge}
                        </Status>
                      </div>
                      <p>{row.headline}</p>
                      <small>{row.detail}</small>
                    </div>
                  </article>
                )) : (
                  <EmptyState
                    detail="完成一次研究运行后，这里会按证据顺序恢复完整轨迹。"
                    title="等待首次运行"
                  />
                )}
              </>
            ) : (
              <div className="design-research-evidence-list">
                {evidenceRows.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong title={value}>{value}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        <div className="design-research-side">
          <SurfacePanel className="design-research-evidence-card" title="最新 AI 研究摘要">
            <div className="design-research-card-status">
              <span>结论</span>
              <Status tone={evidenceRun?.aiReport ? "positive" : "warning"}>
                {evidenceRun?.aiReport ? "报告已绑定" : activeRun ? "本地基线" : "待运行"}
              </Status>
            </div>
            <p>{evidenceRun?.aiReport?.summary ?? "确定性基线优先，外部模型失败不会覆盖本地结论。"}</p>
            <ul>
              {(evidenceRun?.aiReport?.risks.length
                ? evidenceRun.aiReport.risks
                : workspace.decisionLog.map((entry) => entry.message)
              ).slice(0, 2).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </SurfacePanel>
          <SurfacePanel className="design-research-evidence-card" title="数据源血缘">
            {marketAiSelectionEvidence ? (
              <>
                <div className="design-kv-row">
                  <span>AI 选股来源</span>
                  <Status>证据已绑定</Status>
                </div>
                <div className="design-kv-row">
                  <span>风格 / 周期</span>
                  <strong>
                    {marketAiSelectionProfileLabels[marketAiSelectionEvidence.profile]}
                    {" · "}
                    {marketAiSelectionHorizonLabels[marketAiSelectionEvidence.horizon]}
                    {" · "}
                    第 {marketAiSelectionEvidence.rank} 名
                  </strong>
                </div>
              </>
            ) : null}
            <div className="design-kv-row"><span>行情数据</span><strong>{dataSource}</strong></div>
            <div className="design-kv-row"><span>数据行数</span><strong>{dataRows.toLocaleString()}</strong></div>
            <div className="design-kv-row"><span>快照范围</span><strong>{evidenceSnapshot?.end ? new Date(evidenceSnapshot.end).toLocaleDateString("zh-CN") : "—"}</strong></div>
            <div className="design-kv-row"><span>完整性</span><Status tone={evidenceQuality?.isComplete ? "positive" : "warning"}>{evidenceQuality?.isComplete ? "完整" : "待复核"}</Status></div>
            <div className="design-kv-row"><span>复权 / 时效</span><strong>{adjustmentMode} · {freshness}</strong></div>
            <div className="design-kv-row"><span>覆盖率</span><strong>{coverage ? `${(coverage.ratio * 100).toFixed(1)}% · 缺口 ${coverage.gapCount}` : "—"}</strong></div>
            <div className="design-kv-row"><span>跨源差异</span><Status tone={sourceComparisonTone}>{sourceComparisonLabel}</Status></div>
            <div className="design-kv-row"><span>差异报告</span><strong title={sourceComparison?.reportHash ?? "—"}>{sourceComparison ? `${sourceComparison.overlapRows} 行重叠 · ${sourceComparison.reportHash.slice(0, 9)}…` : "—"}</strong></div>
            <div className="design-kv-row"><span>下一步</span><strong>{sourceComparisonNextAction}</strong></div>
          </SurfacePanel>
          <SurfacePanel className="design-research-evidence-card" title="审计回放">
            <div className="design-kv-row"><span>Run ID</span><strong title={runId ?? "—"}>{compactRunId(runId)}</strong></div>
            <div className="design-kv-row"><span>快照 Hash</span><strong title={snapshotHash}>{snapshotHash}</strong></div>
            <div className="design-kv-row"><span>版本</span><strong>{strategyRevision}</strong></div>
            <div className="design-kv-row"><span>状态</span><Status tone={runId ? "positive" : "warning"}>{runId ? "可复现" : "待运行"}</Status></div>
          </SurfacePanel>
          <SurfacePanel className="design-research-evidence-card" title="恢复与复现">
            <div className="design-kv-row"><span>持久化运行</span><Status>{runId ? "已归档" : "待运行"}</Status></div>
            <div className="design-kv-row"><span>自动重试</span><strong>未声明</strong></div>
            <div className="design-kv-row"><span>离线回放</span><strong>{evidenceSnapshot?.offlineReplay?.status === "verified" ? "哈希已验证 · 无需网络" : runId ? "历史快照" : "待运行"}</strong></div>
            <div className="design-kv-row"><span>市场日历</span><strong title={evidenceSnapshot?.calendarId ?? "—"}>{evidenceSnapshot?.calendarId ?? "—"}</strong></div>
          </SurfacePanel>
        </div>
        <SurfacePanel className="design-research-runs" title="最近研究运行">
          <table className="design-table">
            <thead>
              <tr>
                <th>运行 ID</th>
                <th>策略 / 研究名称</th>
                <th>标的</th>
                <th>状态</th>
                <th>最新结果</th>
                <th>更新时间</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 8).map((run) => (
                <tr key={run.runId}>
                  <td>
                    <Star size={12} /> {compactRunId(run.runId)}
                  </td>
                  <td>{run.strategyName}</td>
                  <td>
                    {run.symbol} · {run.timeframe}
                  </td>
                  <td>
                    <Status
                      tone={
                        run.dataQuality?.isComplete
                        && run.dataQuality.warnings.length === 0
                          ? "positive"
                          : "warning"
                      }
                    >
                      {run.dataQuality
                        ? run.dataQuality.isComplete
                          ? run.dataQuality.warnings.length
                            ? "有警告"
                            : "证据完整"
                          : "需复核"
                        : "已归档"}
                    </Status>
                  </td>
                  <td>
                    {typeof (run.metrics.total_return_pct ?? run.metrics.return_pct) === "number"
                      ? `收益 ${(run.metrics.total_return_pct ?? run.metrics.return_pct).toFixed(2)}%`
                      : `${run.dataRows} 行`}
                  </td>
                  <td>{new Date(run.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SurfacePanel>
        <SurfacePanel
          action={
            <Status tone={preparationIsSaved ? "positive" : "warning"}>
              {preparationIsSaved ? "准备已保存" : "有未保存项"}
            </Status>
          }
          className="design-research-preparation"
          subtitle="运行前保存研究假设和当前工作区上下文"
          title="研究准备"
        >
          <div className="design-research-preparation-body">
            <div className="design-research-note-column">
              <label className="design-research-note-field" htmlFor="research-note-input">
                <span>研究笔记</span>
                <textarea
                  id="research-note-input"
                  onChange={(event) => researchPreparation.onNoteChange(event.currentTarget.value)}
                  placeholder="记录研究假设、观察重点和风险条件"
                  ref={researchNoteInputRef}
                  rows={4}
                  value={researchPreparation.noteDraft}
                />
              </label>
            </div>
            <div className="design-research-preparation-actions">
              <div>
                <span>笔记状态</span>
                <strong>
                  {researchPreparation.note.error
                    ? "保存失败，请重试"
                    : !noteDraftBody
                      ? "尚未填写"
                      : noteIsSaved
                      ? `已保存${savedNote?.updatedAt
                        ? ` · ${new Date(savedNote.updatedAt).toLocaleString("zh-CN")}`
                        : ""}`
                      : "有未保存更改"}
                </strong>
              </div>
              <div className="design-research-ai-controls">
                <label htmlFor="research-note-provider">
                  <span>AI 辅助</span>
                  <select
                    disabled={researchPreparation.isGeneratingNote}
                    id="research-note-provider"
                    onChange={(event) => researchPreparation.onProviderChange(
                      event.currentTarget.value as AiReviewProviderId,
                    )}
                    value={selectedProvider.providerId}
                  >
                    {researchPreparation.providers.map((provider) => (
                      <option
                        disabled={!provider.configured}
                        key={provider.providerId}
                        value={provider.providerId}
                      >
                        {aiProviderLabels[provider.providerId]}
                        {provider.configured ? "" : " · 未配置"}
                      </option>
                    ))}
                  </select>
                </label>
                <small className="design-research-provider-meta">
                  {usesExternalProvider
                    ? `${selectedProvider.model ?? "模型未配置"} · ${selectedProvider.sanitizedBaseUrl ?? "地址未配置"}`
                    : "确定性本地草稿 · 不发送任何数据"}
                </small>
                {usesExternalProvider ? (
                  <>
                    <p>
                      仅发送市场、标的、周期、缓存区间、行数和派生统计；
                      不会发送原始 K 线或已有研究笔记。
                    </p>
                    <label
                      className="design-research-external-approval"
                      htmlFor="research-note-external-approval"
                    >
                      <input
                        checked={researchPreparation.externalDataApproved}
                        disabled={researchPreparation.isGeneratingNote}
                        id="research-note-external-approval"
                        onChange={(event) => researchPreparation.onExternalDataApprovedChange(
                          event.currentTarget.checked,
                        )}
                        type="checkbox"
                      />
                      <span>本次允许发送上述摘要</span>
                    </label>
                  </>
                ) : null}
                <button
                  className="design-secondary-action"
                  disabled={!canGenerateNote}
                  id="research-note-generate"
                  onClick={researchPreparation.onGenerateNote}
                  type="button"
                >
                  <Sparkles aria-hidden="true" size={13} />
                  {researchPreparation.isGeneratingNote
                    ? "正在生成草稿"
                    : usesExternalProvider
                      ? noteDraftBody
                        ? "AI 重新生成并替换"
                        : "AI 生成草稿"
                      : noteDraftBody
                        ? "重新生成并替换"
                        : "生成本地草稿"}
                </button>
                {researchPreparation.generationError ? (
                  <small className="design-research-generation-message error" role="alert">
                    {researchPreparation.generationError}
                  </small>
                ) : researchPreparation.generationStatus ? (
                  <small className="design-research-generation-message" role="status">
                    {researchPreparation.generationStatus}
                  </small>
                ) : null}
              </div>
              <button
                className="design-secondary-action"
                disabled={
                  researchPreparation.isGeneratingNote
                  || researchPreparation.isSavingNote
                  || !noteDraftBody
                }
                id="research-note-save"
                onClick={researchPreparation.onSaveNote}
                type="button"
              >
                <Save aria-hidden="true" size={13} />
                {researchPreparation.isSavingNote ? "正在保存笔记" : "保存研究笔记"}
              </button>
              <button
                className="design-secondary-action"
                disabled={researchPreparation.isSavingWorkspace}
                id="research-workspace-save"
                onClick={researchPreparation.onSaveWorkspace}
                type="button"
              >
                <Save aria-hidden="true" size={13} />
                {researchPreparation.isSavingWorkspace
                  ? "正在保存工作区"
                  : researchPreparation.workspaceSaved
                    ? "工作区已保存"
                    : "保存当前工作区"}
              </button>
            </div>
          </div>
        </SurfacePanel>
      </div>
    </>
  );
}
