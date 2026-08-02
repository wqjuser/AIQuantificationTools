import { Download, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Panel } from "./AppPanel";
import type { AppI18n } from "../lib/i18n";
import {
  filterBacktestRunComparisonMatrixRows,
  type BacktestAssumptionField,
  type BacktestAssumptionRow,
  type BacktestEvidenceCard,
  type BacktestReadinessGate,
  type BacktestReport,
  type BacktestRunComparisonMatrixBadge,
  type BacktestRunComparisonMatrixRow,
  type BacktestRunComparisonMatrixSummary,
  type BacktestTradeRow
} from "../lib/terminal-workbench";

function BacktestReportPanel({
  assumptionRows,
  className,
  evidenceCards,
  experimentSection,
  i18n,
  onExportMarkdown,
  onUpdateAssumption,
  report,
  readinessGates,
  runComparisonMatrixRows,
  runComparisonMatrixSummary,
  rows
}: {
  assumptionRows: BacktestAssumptionRow[];
  className?: string;
  evidenceCards: BacktestEvidenceCard[];
  experimentSection: ReactNode;
  i18n: AppI18n;
  onExportMarkdown?: () => void;
  onUpdateAssumption: (field: BacktestAssumptionField, value: number) => void;
  report: BacktestReport;
  readinessGates: BacktestReadinessGate[];
  runComparisonMatrixRows: BacktestRunComparisonMatrixRow[];
  runComparisonMatrixSummary: BacktestRunComparisonMatrixSummary | null;
  rows: BacktestTradeRow[];
}) {
  const [runComparisonMatrixQuery, setRunComparisonMatrixQuery] = useState("");
  const diagnosticCard = evidenceCards.find((card) => card.id === "diagnostics");
  const reportCards = evidenceCards.filter((card) => card.id !== "diagnostics");
  const diagnostics = report.diagnostics.length ? report.diagnostics : [];
  const equityStart = report.equityCurve[0]?.equity ?? null;
  const equityEnd = report.equityCurve.at(-1)?.equity ?? null;
  const filteredRunComparisonMatrixRows = filterBacktestRunComparisonMatrixRows(
    runComparisonMatrixRows,
    runComparisonMatrixQuery
  );
  const currentComparisonRow = runComparisonMatrixSummary?.currentRunId
    ? runComparisonMatrixRows.find((row) => row.runId === runComparisonMatrixSummary.currentRunId) ?? null
    : null;
  const bestReturnComparisonRow = runComparisonMatrixSummary?.bestReturnRunId
    ? runComparisonMatrixRows.find((row) => row.runId === runComparisonMatrixSummary.bestReturnRunId) ?? null
    : null;
  const lowestDrawdownComparisonRow = runComparisonMatrixSummary?.lowestDrawdownRunId
    ? runComparisonMatrixRows.find((row) => row.runId === runComparisonMatrixSummary.lowestDrawdownRunId) ?? null
    : null;
  const previousComparisonRow = runComparisonMatrixSummary?.previousRunId
    ? runComparisonMatrixRows.find((row) => row.runId === runComparisonMatrixSummary.previousRunId) ?? null
    : null;

  return (
    <Panel
      title={i18n.t("panel.backtest.title")}
      subtitle={i18n.t("panel.backtest.subtitle")}
      className={className}
      action={
        onExportMarkdown ? (
          <button
            className="report-export-button"
            disabled={!report.runId}
            onClick={onExportMarkdown}
            title={i18n.t("backtest.exportMarkdown")}
            type="button"
          >
            <Download size={13} />
            <span>{i18n.t("backtest.exportMarkdown")}</span>
          </button>
        ) : undefined
      }
    >
      <div className="backtest-report">
        <div className="backtest-report-hero" data-status={report.status}>
          <div>
            <span>{i18n.locale === "zh-CN" ? "审计回测报告" : "Audited Backtest Report"}</span>
            <strong>{backtestReportHeadline(i18n, report)}</strong>
            <p>{backtestReportSummary(i18n, report)}</p>
          </div>
          <em>{report.runId ?? (i18n.locale === "zh-CN" ? "等待运行编号" : "No run id")}</em>
        </div>

        <div className="backtest-benchmark-strip" data-tone={report.benchmark.tone}>
          <div>
            <span>{i18n.locale === "zh-CN" ? "基准对比" : "Benchmark comparison"}</span>
            <strong>{backtestBenchmarkLabel(i18n, report.benchmark.label)}</strong>
            <p>{backtestBenchmarkDetail(i18n, report.benchmark.detail)}</p>
          </div>
          <dl>
            <div>
              <dt>{i18n.locale === "zh-CN" ? "策略" : "Strategy"}</dt>
              <dd>{report.benchmark.strategyReturn}</dd>
            </div>
            <div>
              <dt>{i18n.locale === "zh-CN" ? "持有" : "Hold"}</dt>
              <dd>{backtestBenchmarkValue(i18n, report.benchmark.benchmarkReturn)}</dd>
            </div>
            <div>
              <dt>Alpha</dt>
              <dd>{report.benchmark.alpha}</dd>
            </div>
          </dl>
        </div>

        <div className="backtest-report-grid">
          {report.metrics.map((metric) => (
            <article className={metric.tone} key={metric.label}>
              <span>{i18n.metricLabel(metric.label)}</span>
              <strong>{metric.value}</strong>
              <p>{i18n.locale === "zh-CN" ? "来自当前审计回测。" : "From the current audited backtest."}</p>
            </article>
          ))}
          <article className={report.aiReviewReady ? "positive" : "risk"}>
            <span>{i18n.locale === "zh-CN" ? "AI 评审准备" : "AI review readiness"}</span>
            <strong>{report.aiReviewReady ? (i18n.locale === "zh-CN" ? "已就绪" : "Ready") : i18n.locale === "zh-CN" ? "阻断" : "Blocked"}</strong>
            <p>{i18n.locale === "zh-CN" ? "AI 只能引用这份已审计报告。" : "AI may cite only this audited report."}</p>
          </article>
          <article className={report.researchEvidenceReady ? "positive" : "warning"}>
            <span>{i18n.locale === "zh-CN" ? "生产预检证据" : "Production preflight evidence"}</span>
            <strong>{report.researchEvidenceReady ? (i18n.locale === "zh-CN" ? "证据完整" : "Evidence ready") : i18n.locale === "zh-CN" ? "需复核" : "Review"}</strong>
            <p>{i18n.locale === "zh-CN" ? "最终生产资格由核心服务复算，不会在回测中授权或下单。" : "The core service revalidates final eligibility; backtesting never authorizes or submits orders."}</p>
          </article>
        </div>

        <section className="backtest-report-section">
          <div className="backtest-replay-title">
            <span>{i18n.locale === "zh-CN" ? "运行对比矩阵" : "Run comparison matrix"}</span>
            <strong>{runComparisonMatrixRows.length}</strong>
          </div>
          {runComparisonMatrixSummary ? (
            <div className="backtest-run-comparison-summary" data-tone={runComparisonMatrixSummary.tone}>
              <article>
                <span>{i18n.locale === "zh-CN" ? "同类上下文" : "Comparable context"}</span>
                <strong>{runComparisonMatrixSummary.context}</strong>
                <p>{backtestRunComparisonSummaryDetail(i18n, runComparisonMatrixSummary)}</p>
              </article>
              <article>
                <span>{i18n.locale === "zh-CN" ? "当前运行" : "Current run"}</span>
                <strong>{currentComparisonRow?.runId ?? "N/A"}</strong>
                <p>{currentComparisonRow ? `${currentComparisonRow.returnPct} · ${currentComparisonRow.maxDrawdownPct}` : "N/A"}</p>
              </article>
              <article>
                <span>{i18n.locale === "zh-CN" ? "最佳收益" : "Best return"}</span>
                <strong>{bestReturnComparisonRow?.runId ?? "N/A"}</strong>
                <p>{bestReturnComparisonRow ? `${bestReturnComparisonRow.returnPct} · DD ${bestReturnComparisonRow.maxDrawdownPct}` : "N/A"}</p>
              </article>
              <article>
                <span>{i18n.locale === "zh-CN" ? "最低回撤" : "Lowest drawdown"}</span>
                <strong>{lowestDrawdownComparisonRow?.runId ?? "N/A"}</strong>
                <p>{lowestDrawdownComparisonRow ? `${lowestDrawdownComparisonRow.maxDrawdownPct} · ${lowestDrawdownComparisonRow.returnPct}` : "N/A"}</p>
              </article>
            </div>
          ) : null}
          <div className="backtest-run-comparison-toolbar">
            <label>
              <Search size={13} />
              <input
                aria-label={i18n.locale === "zh-CN" ? "搜索运行对比矩阵" : "Search run comparison matrix"}
                onChange={(event) => setRunComparisonMatrixQuery(event.currentTarget.value)}
                placeholder={i18n.locale === "zh-CN" ? "搜索运行、版本、标签或质量状态" : "Search run, revision, badge, or quality"}
                type="search"
                value={runComparisonMatrixQuery}
              />
            </label>
            <span>
              {i18n.locale === "zh-CN"
                ? `显示 ${filteredRunComparisonMatrixRows.length}/${runComparisonMatrixRows.length}`
                : `${filteredRunComparisonMatrixRows.length}/${runComparisonMatrixRows.length} shown`}
            </span>
          </div>
          <div className="backtest-run-comparison-matrix">
            <div className="backtest-run-comparison-row backtest-run-comparison-head">
              <span>{i18n.locale === "zh-CN" ? "运行" : "Run"}</span>
              <span>{i18n.locale === "zh-CN" ? "标签" : "Badges"}</span>
              <span>{i18n.metricLabel("Return")}</span>
              <span>{i18n.metricLabel("Max DD")}</span>
              <span>{i18n.metricLabel("Win rate")}</span>
              <span>{i18n.metricLabel("Trades")}</span>
              <span>{i18n.locale === "zh-CN" ? "数据质量" : "Data quality"}</span>
              <span>{i18n.locale === "zh-CN" ? "假设" : "Assumptions"}</span>
            </div>
            {filteredRunComparisonMatrixRows.length ? (
              filteredRunComparisonMatrixRows.map((row) => (
                <article className="backtest-run-comparison-row" data-tone={row.tone} key={row.id}>
                  <span>
                    <strong>{row.runId}</strong>
                    <em>{row.strategyName} · {row.strategyRevision}</em>
                  </span>
                  <span className="backtest-run-comparison-badges">
                    {row.badges.map((badge) => (
                      <b key={badge}>{backtestRunComparisonBadgeLabel(i18n, badge)}</b>
                    ))}
                  </span>
                  <span>{row.returnPct}</span>
                  <span>{row.maxDrawdownPct}</span>
                  <span>{row.winRatePct}</span>
                  <span>{row.tradeCount}</span>
                  <span>{row.dataQualityLabel}</span>
                  <span>{row.assumptions}</span>
                </article>
              ))
            ) : (
              <article className="backtest-run-comparison-row" data-tone="neutral">
                <span>
                  {i18n.locale === "zh-CN"
                    ? "没有匹配的同上下文审计运行。"
                    : "No comparable audited runs match the filter."}
                </span>
              </article>
            )}
          </div>
          {previousComparisonRow ? (
            <p className="backtest-run-comparison-note">
              {i18n.locale === "zh-CN"
                ? `上一轮可比运行：${previousComparisonRow.runId}。矩阵仅用于复盘历史证据，不构成投资建议。`
                : `Previous comparable run: ${previousComparisonRow.runId}. Matrix is historical evidence only, not investment advice.`}
            </p>
          ) : null}
        </section>

        <section className="backtest-report-section">
          <div className="backtest-replay-title">
            <span>{i18n.locale === "zh-CN" ? "证据包" : "Evidence package"}</span>
            <strong>{reportCards.length}</strong>
          </div>
          <div className="backtest-evidence-grid">
            {reportCards.map((card) => (
              <article className={card.tone} key={card.id}>
                <span>{backtestEvidenceLabel(i18n, card)}</span>
                <strong>{backtestEvidenceValue(i18n, card)}</strong>
                <p>{backtestEvidenceDetail(i18n, card)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="backtest-report-section">
          <div className="backtest-replay-title">
            <span>{i18n.locale === "zh-CN" ? "准备闸门" : "Readiness gates"}</span>
            <strong>{readinessGates.length}</strong>
          </div>
          <div className="backtest-readiness-list">
            {readinessGates.map((gate) => (
              <article className={gate.tone} key={gate.id}>
                <span>{backtestGateLabel(i18n, gate)}</span>
                <strong>{backtestGateStatusLabel(i18n, gate.status)}</strong>
                <p>{backtestGateDetail(i18n, gate.detail)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="backtest-report-section">
          <div className="backtest-replay-title">
            <span>{i18n.locale === "zh-CN" ? "权益与诊断" : "Equity and diagnostics"}</span>
            <strong>{report.equityPointCount} / {report.diagnosticCount}</strong>
          </div>
          <div className="backtest-report-grid compact">
            <article className="neutral">
              <span>{i18n.locale === "zh-CN" ? "权益起点" : "Equity start"}</span>
              <strong>{equityStart === null ? "N/A" : equityStart.toLocaleString("en-US")}</strong>
              <p>{report.equityCurve[0]?.timestamp ?? (i18n.locale === "zh-CN" ? "等待权益曲线" : "Pending equity curve")}</p>
            </article>
            <article className={equityEnd !== null && equityStart !== null && equityEnd >= equityStart ? "positive" : "warning"}>
              <span>{i18n.locale === "zh-CN" ? "权益终点" : "Equity end"}</span>
              <strong>{equityEnd === null ? "N/A" : equityEnd.toLocaleString("en-US")}</strong>
              <p>{report.equityCurve.at(-1)?.timestamp ?? (i18n.locale === "zh-CN" ? "等待权益曲线" : "Pending equity curve")}</p>
            </article>
          </div>
          {diagnosticCard ? (
            <div className="backtest-diagnostic-strip" data-tone={diagnosticCard.tone}>
              <span>{backtestEvidenceLabel(i18n, diagnosticCard)}</span>
              <strong>{backtestEvidenceValue(i18n, diagnosticCard)}</strong>
              <p>{backtestEvidenceDetail(i18n, diagnosticCard)}</p>
            </div>
          ) : null}
          {diagnostics.length ? (
            <div className="backtest-diagnostic-list">
              {diagnostics.map((diagnostic) => (
                <article className={diagnostic.tone} key={diagnostic.id}>
                  <span>{diagnostic.label}</span>
                  <strong>{diagnostic.value}</strong>
                  <p>{diagnostic.detail}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <div className="backtest-assumptions">
          <div className="backtest-replay-title">
            <span>{i18n.t("backtest.assumptions")}</span>
            <strong>{report.assumptionRows.length}</strong>
          </div>
          <div className="backtest-assumption-grid">
            {assumptionRows.map((row) => (
              <label key={row.field}>
                <span>{backtestAssumptionLabel(i18n, row.field, row.label)}</span>
                <div className="assumption-input">
                  <input
                    min={row.min}
                    onChange={(event) => onUpdateAssumption(row.field, Number(event.currentTarget.value))}
                    step={row.step}
                    type="number"
                    value={row.value}
                  />
                  <em>{backtestAssumptionSuffixLabel(i18n, row.suffix)}</em>
                </div>
              </label>
            ))}
          </div>
        </div>

        {experimentSection}

        <div className="backtest-replay-title">
          <span>{i18n.t("backtest.replay")}</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="backtest-table">
          <div className="backtest-row backtest-head">
            <span>{i18n.t("backtest.time")}</span>
            <span>{i18n.t("execution.side")}</span>
            <span>{i18n.t("execution.status")}</span>
            <span>{i18n.t("execution.price")}</span>
            <span>{i18n.t("execution.quantity")}</span>
            <span>{i18n.t("backtest.exposure")}</span>
            <span>{i18n.t("backtest.pnl")}</span>
            <span>{i18n.t("execution.reason")}</span>
          </div>
          {rows.map((row) => (
            <article className={`backtest-row ${row.tone}`} key={row.id}>
              <span>{row.timestamp}</span>
              <span>{backtestSideLabel(i18n, row.side)}</span>
              <span>{backtestStatusLabel(i18n, row.status)}</span>
              <span>{row.price}</span>
              <span>{row.quantity}</span>
              <span>{backtestExposureLabel(i18n, row.exposure)}</span>
              <span>{row.pnl}</span>
              <span>{i18n.strategyText(row.reason)}</span>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function backtestSideLabel(i18n: AppI18n, side: BacktestTradeRow["side"]): string {
  if (i18n.locale === "en-US") {
    return side;
  }
  return { BUY: "买入", SELL: "卖出", RISK: "风控", HOLD: "持有" }[side];
}

function backtestStatusLabel(i18n: AppI18n, status: BacktestTradeRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { filled: "已成交", open: "观察中", review: "复核", blocked: "已阻断" }[status];
}

function backtestRunComparisonBadgeLabel(i18n: AppI18n, badge: BacktestRunComparisonMatrixBadge): string {
  if (i18n.locale === "en-US") {
    return badge.replace("_", " ");
  }
  return {
    best_return: "最佳收益",
    current: "当前",
    history: "历史",
    lowest_drawdown: "最低回撤",
    previous_run: "上一轮"
  }[badge];
}

function backtestRunComparisonSummaryDetail(
  i18n: AppI18n,
  summary: BacktestRunComparisonMatrixSummary
): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  return `${summary.totalRows} 个同市场、同标的、同周期的已审计运行；只做历史证据对比，不构成投资建议。`;
}

function backtestExposureLabel(i18n: AppI18n, exposure: string): string {
  if (i18n.locale === "en-US") {
    return exposure;
  }
  return exposure.replace("drawdown", "回撤").replace("paper", "模拟");
}

function backtestAssumptionLabel(i18n: AppI18n, field: BacktestAssumptionField, fallback: string): string {
  const key = {
    initialCash: "backtest.initialCash",
    feeBps: "backtest.feeBps",
    slippageBps: "backtest.slippageBps"
  }[field] as Parameters<AppI18n["t"]>[0];
  return i18n.t(key) || fallback;
}

function backtestAssumptionSuffixLabel(i18n: AppI18n, suffix: string): string {
  if (i18n.locale === "zh-CN") {
    return suffix === "CNY" ? "资金" : "基点";
  }
  return suffix;
}

function backtestBenchmarkLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return label === "Buy and hold" ? "同标的买入持有" : label;
}

function backtestBenchmarkValue(i18n: AppI18n, value: string): string {
  if (i18n.locale === "en-US" || value !== "Pending snapshot") {
    return value;
  }
  return "等待快照";
}

function backtestBenchmarkDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  const auditedBars = detail.match(/^(\d+) audited bars from (.+) · (.+) to (.+)\.$/);
  if (auditedBars) {
    return `${auditedBars[1]} 根审计K线 · 来源 ${auditedBars[2]} · ${auditedBars[3]} 至 ${auditedBars[4]}`;
  }
  if (detail === "Run Pipeline must include a data snapshot before benchmark comparison.") {
    return "先运行流水线并锁定数据快照，再计算基准对比。";
  }
  return detail;
}

function backtestReportHeadline(i18n: AppI18n, report: BacktestReport): string {
  if (i18n.locale === "en-US") {
    return report.headline;
  }
  if (report.headline === "Backtest report needs an audited run") {
    return "回测报告需要审计运行";
  }
  const bound = report.headline.match(/^Backtest report bound to (.+)$/);
  return bound ? `回测报告已绑定 ${bound[1]}` : report.headline;
}

function backtestReportSummary(i18n: AppI18n, report: BacktestReport): string {
  if (i18n.locale === "en-US") {
    return report.summary;
  }
  if (report.summary === "Run Pipeline to create a reproducible backtest before AI review or production qualification.") {
    return "先运行流水线生成可复现回测，再进入 AI 评审或生产资格预检。";
  }
  return report.summary
    .replace("bars", "根K线")
    .replace("trades", "笔交易")
    .replace("AI review ready", "AI 评审已就绪")
    .replace("AI review blocked", "AI 评审已阻断");
}

function backtestEvidenceLabel(i18n: AppI18n, card: BacktestEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.label;
  }
  return (
    {
      run: "运行包",
      strategy: "策略版本",
      costs: "费用模型",
      diagnostics: "诊断"
    }[card.id] ?? card.label
  );
}

function backtestEvidenceValue(i18n: AppI18n, card: BacktestEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.value;
  }
  if (card.value === "Draft workspace") {
    return "本地草稿";
  }
  if (card.value === "Local draft") {
    return "本地版本";
  }
  return card.value.replace(/checks?/u, "项检查").replaceAll("bps", "基点");
}

function backtestEvidenceDetail(i18n: AppI18n, card: BacktestEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.detail;
  }
  return card.detail
    .replace("Run Pipeline to bind a reproducible run id.", "运行流水线以绑定可复现运行编号。")
    .replace("No core diagnostics supplied yet.", "核心服务尚未返回诊断。")
    .replace("audited backtest", "审计回测")
    .replace("Cash", "资金")
    .replace("bars", "根K线")
    .replace("paper_only", "仅模拟盘")
    .replace("certified_live", "认证实盘")
    .replace("blocked_live", "实盘阻断")
    .replace("snapshot", "快照");
}

function backtestGateLabel(i18n: AppI18n, gate: BacktestReadinessGate): string {
  if (i18n.locale === "en-US") {
    return gate.label;
  }
  return (
    {
      data: "数据快照",
      strategy: "策略结构",
      costs: "费用模型",
      execution: "生产预检输入"
    }[gate.id] ?? gate.label
  );
}

function backtestGateStatusLabel(i18n: AppI18n, status: BacktestReadinessGate["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { passed: "通过", blocked: "阻断", review: "复核" }[status];
}

function backtestGateDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail
    .replace("Run Pipeline to bind a reproducible OHLCV snapshot.", "运行流水线以绑定可复现 OHLCV 快照。")
    .replace("Complete entry, exit, position, and risk rules before audit.", "审计前需要补齐入场、出场、仓位和风控规则。")
    .replace("Production qualification waits for an audited run id.", "生产资格预检等待可审计运行编号。")
    .replace(
      "Audited evidence can enter server-side production qualification; it does not authorize or submit an order.",
      "审计证据可以进入服务端生产资格复核；本步骤不会授权或提交订单。"
    )
    .replace("is parseable.", "已可解析。")
    .replace("Audited", "已审计")
    .replace("bars are bound.", "根K线已绑定。")
    .replace("Cash", "资金")
    .replace("fee", "手续费")
    .replace("slippage", "滑点")
    .replaceAll("bps", "基点");
}
