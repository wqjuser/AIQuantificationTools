import { buildAiReviewDossier, persistedStrategyExperimentRequired } from "../ai-review/report-builders";
import { marketCalendarNextEventDetail, normalizedResearchNote } from "../audit/signing-key-ledger";
import { formatSignedPct, formatSignedPointDelta } from "../core/workspace-audit-formatters";
import type { ResearchRunAudit, TerminalWorkspace } from "../core/workspace-contracts";
import { defaultStrategyRuleDraft } from "../core/workspace-contracts";
import { formatConditionNumber, formatInstrumentPrice } from "../core/workspace-operations";
import type { ExecutionAdapterCertificationApplySnapshot, ExecutionAdapterCertificationApplyStatus, ExecutionAdapterCertificationSnapshot, ExecutionAdapterCertificationStatus } from "../execution/adapter-contracts";
import type { BacktestReport } from "../portfolio/paper-contracts";
import type { ResearchRunDataPreparationEvidence, StrategyExperimentDetail } from "../research/workspace-contracts";
import type { ModuleNewsEvent, ResearchContextMarketCalendar } from "../stage1/archive-contracts";
import type { BacktestBenchmark, BacktestReadinessGate, StrategyConditionKind, StrategyRuleDraft } from "../stage1/review-contracts";
import { buildBacktestCrossSymbolComparisonRows, buildBacktestCrossSymbolComparisonSummary, buildBacktestRunComparisonMatrixRows, buildBacktestRunComparisonMatrixSummary } from "./comparison-builders";
import { buildBacktestAssumptionRows, buildBacktestEvidenceCards, buildBacktestTradeRows, buildResearchRunContextBinding, buildStrategyExperimentEvidenceSummary, resolveBacktestAssumptions } from "./experiment-builders";
import { formatAssumptionCurrency } from "./workflow-builders";

export function buildBacktestReadinessGates(workspace: TerminalWorkspace): BacktestReadinessGate[] {
  const assumptions = resolveBacktestAssumptions(workspace);
  const contextBinding = buildResearchRunContextBinding(workspace);
  const run = workspace.researchRun;
  const hasAuditedRun = contextBinding.canUseRun;
  const strategyIsParseable =
    !isPendingStrategyText(workspace.strategy.entry) &&
    !isPendingStrategyText(workspace.strategy.exit) &&
    !isPendingStrategyText(workspace.strategy.position) &&
    !isPendingStrategyText(workspace.strategy.risk);

  return [
    hasAuditedRun
      ? {
          id: "data",
          label: "Data snapshot",
          status: "passed",
          detail: `Audited ${run?.dataRows ?? 0} ${run?.timeframe ?? workspace.selectedTimeframe} bars are bound.`,
          tone: "positive"
        }
      : run
        ? {
            id: "data",
            label: "Data snapshot",
            status: "blocked",
            detail: contextBinding.detail,
            tone: "risk"
          }
      : {
          id: "data",
          label: "Data snapshot",
          status: "blocked",
          detail: "Run Pipeline to bind a reproducible OHLCV snapshot.",
          tone: "risk"
        },
    strategyIsParseable
      ? {
          id: "strategy",
          label: "Strategy schema",
          status: "passed",
          detail: `${workspace.strategy.name} is parseable.`,
          tone: "positive"
        }
      : {
          id: "strategy",
          label: "Strategy schema",
          status: "blocked",
          detail: "Complete entry, exit, position, and risk rules before audit.",
          tone: "risk"
        },
    {
      id: "costs",
      label: "Cost model",
      status: "passed",
      detail: `Cash ${formatAssumptionCurrency(assumptions.initialCash)} · fee ${assumptions.feeBps} bps · slippage ${assumptions.slippageBps} bps.`,
      tone: "neutral"
    },
    hasAuditedRun
      ? {
          id: "execution",
          label: "Production preflight input",
          status: "review",
          detail: "Audited evidence can enter server-side production qualification; it does not authorize or submit an order.",
          tone: "warning"
        }
      : {
          id: "execution",
          label: "Production preflight input",
          status: "blocked",
          detail: "Production qualification waits for an audited run id.",
          tone: "risk"
        }
  ];
}

export function buildBacktestReport(workspace: TerminalWorkspace): BacktestReport {
  const assumptions = resolveBacktestAssumptions(workspace);
  const assumptionRows = buildBacktestAssumptionRows(workspace);
  const evidenceCards = buildBacktestEvidenceCards(workspace);
  const readinessGates = buildBacktestReadinessGates(workspace);
  const trades = buildBacktestTradeRows(workspace);
  const diagnostics = workspace.backtestDiagnostics ?? [];
  const equityCurve = workspace.backtestEquityCurve ?? [];
  const run = workspace.researchRun;
  const contextBinding = buildResearchRunContextBinding(workspace);
  const benchmark = buildBacktestBenchmark(workspace);
  const blockedGates = readinessGates.filter((gate) => gate.status === "blocked");
  const aiReviewReady =
    contextBinding.canUseRun && !blockedGates.some((gate) => gate.id === "data" || gate.id === "strategy");
  const researchEvidenceReady = contextBinding.canUseRun && !blockedGates.length;
  const metricTradeCount = metricValue(workspace, "Trades", "0");

  if (!run) {
    return {
      status: "blocked",
      headline: "Backtest report needs an audited run",
      summary: "Run Pipeline to create a reproducible backtest before AI review or production qualification.",
      runId: null,
      aiReviewReady: false,
      researchEvidenceReady: false,
      assumptions,
      assumptionRows,
      evidenceCards,
      readinessGates,
      benchmark,
      metrics: workspace.metrics,
      trades,
      diagnostics,
      equityCurve,
      tradeCount: trades.length,
      equityPointCount: equityCurve.length,
      diagnosticCount: diagnostics.length
    };
  }

  if (!contextBinding.canUseRun) {
    return {
      status: "blocked",
      headline: "Backtest report needs a matching audited run",
      summary: "Run Pipeline to create a fresh audited run for the selected market, symbol, and timeframe.",
      runId: run.runId,
      aiReviewReady: false,
      researchEvidenceReady: false,
      assumptions,
      assumptionRows,
      evidenceCards,
      readinessGates,
      benchmark,
      metrics: workspace.metrics,
      trades,
      diagnostics,
      equityCurve,
      tradeCount: trades.length,
      equityPointCount: equityCurve.length,
      diagnosticCount: diagnostics.length
    };
  }

  return {
    status: aiReviewReady ? "ready" : "blocked",
    headline: `Backtest report bound to ${run.runId}`,
    summary: `${run.dataRows} ${run.timeframe} bars · ${metricTradeCount} trades · ${
      aiReviewReady ? "AI review ready" : "AI review blocked"
    }`,
    runId: run.runId,
    aiReviewReady,
    researchEvidenceReady,
    assumptions,
    assumptionRows,
    evidenceCards,
    readinessGates,
    benchmark,
    metrics: workspace.metrics,
    trades,
    diagnostics,
    equityCurve,
    tradeCount: trades.length,
    equityPointCount: equityCurve.length,
    diagnosticCount: diagnostics.length
  };
}

export function buildBacktestReportMarkdown(
  workspace: TerminalWorkspace,
  runHistory: ResearchRunAudit[] = [],
  experiment: StrategyExperimentDetail | null = null
): string | null {
  const run = workspace.researchRun;
  if (!run) {
    return null;
  }

  const report = buildBacktestReport(workspace);
  const aiDossier = buildAiReviewDossier(workspace, experiment);
  const snapshot = run.dataSnapshot;
  const sourceComparison = snapshot?.sourceComparison;
  const preparationEvidence = snapshot?.preparationEvidence ?? null;
  const marketCalendar = snapshot?.marketCalendar ?? null;
  const researchNote = normalizedResearchNote(run.researchNote);
  const metricRows = report.metrics.map((metric) => [metric.label, metric.value, metric.tone]);
  const experimentEvidence = buildStrategyExperimentEvidenceSummary(workspace, experiment);
  const benchmarkRows = [
    ["Strategy", report.benchmark.strategyReturn],
    ["Benchmark buy and hold", report.benchmark.benchmarkReturn],
    ["Alpha", report.benchmark.alpha]
  ];
  const assumptionRows = report.assumptionRows.map((row) => [row.label, `${row.value} ${row.suffix}`]);
  const runComparisonRows = buildBacktestRunComparisonMatrixRows(runHistory, run.runId);
  const runComparisonSummary = buildBacktestRunComparisonMatrixSummary(runComparisonRows);
  const runComparisonMarkdownRows = runComparisonRows.map((row) => [
    row.runId,
    row.badges.join(", "),
    row.returnPct,
    row.maxDrawdownPct,
    row.winRatePct,
    row.tradeCount,
    row.dataQualityLabel,
    row.assumptions
  ]);
  const crossSymbolComparisonRows = buildBacktestCrossSymbolComparisonRows(runHistory, run.runId);
  const crossSymbolComparisonSummary = buildBacktestCrossSymbolComparisonSummary(crossSymbolComparisonRows);
  const crossSymbolComparisonMarkdownRows = crossSymbolComparisonRows.map((row) => [
    row.symbol,
    row.runId,
    row.badges.join(", "),
    row.returnPct,
    row.maxDrawdownPct,
    row.winRatePct,
    row.tradeCount,
    row.dataQualityLabel
  ]);
  const gateRows = report.readinessGates.map((gate) => [gate.label, gate.status, gate.detail]);
  const aiCitationRows = aiDossier.citations.map((citation) => [
    citation.label,
    citation.value,
    citation.detail
  ]);
  const tradeRows = report.trades.map((trade) => [
    trade.timestamp,
    trade.side,
    trade.status,
    trade.price,
    trade.quantity,
    trade.pnl,
    trade.reason
  ]);

  return [
    "# AIQuant Audited Backtest Report",
    "",
    `Run ID: \`${run.runId}\``,
    `Market: \`${workspace.selectedInstrument.market}\``,
    `Symbol: \`${workspace.selectedInstrument.symbol}\``,
    `Timeframe: \`${run.timeframe}\``,
    `Strategy revision: \`${run.strategyRevision}\``,
    `Execution mode: \`${run.executionMode}\``,
    "",
    "## Summary",
    "",
    report.summary,
    "",
    "## Metrics",
    "",
    markdownTable(["Metric", "Value", "Tone"], metricRows),
    "",
    "## Benchmark",
    "",
    report.benchmark.detail,
    "",
    markdownTable(["Item", "Value"], benchmarkRows),
    "",
    "## Data Snapshot",
    "",
    markdownTable(
      ["Field", "Value"],
      [
        ["Source", snapshot?.source ?? "missing"],
        ["Rows", String(snapshot?.rows ?? run.dataRows)],
        ["Content hash", snapshot?.hash ?? ""],
        ["Snapshot identity", snapshot?.snapshotHash ?? snapshot?.hash ?? ""],
        ["Window", `${snapshot?.start ?? "unknown"} -> ${snapshot?.end ?? "unknown"}`],
        ["Observed / market time", `${snapshot?.observedAt ?? "unknown"} / ${snapshot?.marketTime ?? "unknown"}`],
        ["Calendar identity", snapshot?.calendarId ?? "not attached"],
        ["Adjustment / freshness", `${snapshot?.adjustmentMode ?? "none"} / ${snapshot?.freshness ?? "unknown"}`],
        [
          "Coverage",
          snapshot?.coverage
            ? `${(snapshot.coverage.ratio * 100).toFixed(1)}% · ${snapshot.coverage.gapCount} gaps`
            : "not attached"
        ],
        [
          "Offline replay",
          snapshot?.offlineReplay?.status === "verified" && snapshot.offlineReplay.networkRequired === false
            ? "verified · network not required"
            : "not verified"
        ],
        [
          "Source comparison",
          sourceComparison
            ? `${sourceComparison.status} · ${sourceComparison.overlapRows} overlapping rows · ${sourceComparison.reportHash}`
            : "not attached"
        ],
        ["Quality", run.dataQuality ? `${run.dataQuality.source} · ${run.dataQuality.isComplete ? "complete" : "incomplete"}` : "not attached"],
        ["Market calendar", marketCalendar ? formatMarketCalendarEvidenceDetail(marketCalendar) : "not locked"],
        ["Preparation evidence", preparationEvidence ? formatPreparationEvidenceDetail(preparationEvidence) : "not locked"]
      ]
    ),
    "",
    "## Backtest Assumptions",
    "",
    markdownTable(["Assumption", "Value"], assumptionRows),
    "",
    "## Persisted Strategy Experiment",
    "",
    experimentEvidence
      ? markdownTable(
          ["Field", "Value"],
          [
            ["Experiment ID", experimentEvidence.experimentId],
            ["Definition hash", experimentEvidence.definitionHash],
            ["Result hash", experimentEvidence.resultHash],
            ["Selected candidate", `${experimentEvidence.selectedCandidateId} (${experimentEvidence.candidateRevision})`],
            ["Holdout", experimentEvidence.holdoutStatus]
          ]
        )
      : persistedStrategyExperimentRequired,
    "",
    "## Run Comparison Matrix",
    "",
    runComparisonSummary
      ? [
          runComparisonSummary.headline,
          "",
          runComparisonSummary.detail,
          "",
          markdownTable(
            ["Run", "Badges", "Return", "Max drawdown", "Win rate", "Trades", "Data quality", "Assumptions"],
            runComparisonMarkdownRows
          )
        ].join("\n")
      : "Run comparison matrix requires at least one audited run in history for the same market, symbol, and timeframe.",
    "",
    "## Cross-Symbol Comparison",
    "",
    crossSymbolComparisonSummary
      ? [
          crossSymbolComparisonSummary.headline,
          "",
          crossSymbolComparisonSummary.detail,
          "",
          markdownTable(
            ["Symbol", "Run", "Badges", "Return", "Max drawdown", "Win rate", "Trades", "Data quality"],
            crossSymbolComparisonMarkdownRows
          )
        ].join("\n")
      : "Cross-symbol comparison requires audited runs in history for the same market and timeframe.",
    "",
    "## AI Evidence Boundary",
    "",
    "No investment advice. AI can explain supplied audited evidence only and must not promise returns.",
    "",
    markdownTable(["Citation", "Value", "Evidence"], aiCitationRows),
    "",
    researchNote ? "## Locked Research Note" : "",
    researchNote ? "" : "",
    researchNote ? researchNote.body : "",
    researchNote ? "" : "",
    "## Readiness Gates",
    "",
    markdownTable(["Gate", "Status", "Detail"], gateRows),
    "",
    "## Trade Replay",
    "",
    tradeRows.length
      ? markdownTable(["Time", "Side", "Status", "Price", "Quantity", "PnL", "Reason"], tradeRows)
      : "No trade rows are attached to this audited run.",
    "",
    "## Production Handoff Boundary",
    "",
    report.researchEvidenceReady
      ? "Audited research evidence may enter server-side production qualification. This report does not authorize live trading, start monitoring, evaluate, or submit an order."
      : "Production qualification remains blocked until all research evidence gates pass."
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n")
    .trimEnd()
    .concat("\n");
}

export function buildBacktestBenchmark(workspace: TerminalWorkspace): BacktestBenchmark {
  const contextBinding = buildResearchRunContextBinding(workspace);
  const run = workspace.researchRun;
  const snapshot = run?.dataSnapshot;
  const bars = snapshot?.bars.filter((bar) => Number.isFinite(bar.close) && bar.close > 0) ?? [];
  const strategyReturn = parsePercentMetric(metricValue(workspace, "Return", "N/A"));
  const formattedStrategyReturn = strategyReturn === null ? "N/A" : formatSignedPct(strategyReturn);

  if (!run || !contextBinding.canUseRun || bars.length < 2) {
    return {
      label: "Buy and hold",
      symbol: workspace.selectedInstrument.symbol,
      strategyReturn: formattedStrategyReturn,
      benchmarkReturn: "Pending snapshot",
      alpha: "N/A",
      detail:
        run && !contextBinding.canUseRun
          ? contextBinding.detail
          : "Run Pipeline must include a data snapshot before benchmark comparison.",
      tone: "warning",
      sampleBars: 0,
      source: snapshot?.source ?? "missing snapshot"
    };
  }

  const firstClose = bars[0].close;
  const lastClose = bars[bars.length - 1].close;
  const benchmarkReturn = ((lastClose - firstClose) / firstClose) * 100;
  const alpha = strategyReturn === null ? null : strategyReturn - benchmarkReturn;
  const tone = alpha === null ? "neutral" : alpha >= 0 ? "positive" : "warning";

  return {
    label: "Buy and hold",
    symbol: workspace.selectedInstrument.symbol,
    strategyReturn: formattedStrategyReturn,
    benchmarkReturn: formatSignedPct(benchmarkReturn),
    alpha: alpha === null ? "N/A" : formatSignedPointDelta(alpha),
    detail: `${bars.length} audited bars from ${snapshot?.source ?? "unknown"} · ${bars[0].timestamp} to ${
      bars[bars.length - 1].timestamp
    }.`,
    tone,
    sampleBars: bars.length,
    source: snapshot?.source ?? "unknown"
  };
}

export function markdownTable(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>): string {
  return [
    `| ${headers.map(markdownCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(markdownCell).join(" | ")} |`)
  ].join("\n");
}

export function markdownCell(value: string | number | boolean | null | undefined): string {
  return String(value ?? "")
    .replace(/\r?\n+/gu, " ")
    .replace(/\|/gu, "\\|")
    .trim();
}

export function aiBenchmarkDetail(benchmark: BacktestBenchmark): string {
  if (benchmark.sampleBars <= 0 || benchmark.benchmarkReturn === "Pending snapshot") {
    return "Benchmark comparison waits for an audited data snapshot.";
  }
  return `Strategy ${benchmark.strategyReturn} vs buy-and-hold ${benchmark.benchmarkReturn} over ${benchmark.sampleBars} audited bars.`;
}

export function buildModuleNewsEvents(workspace: TerminalWorkspace): ModuleNewsEvent[] {
  const selectedInstrument = workspace.selectedInstrument;
  const selectedSymbol = selectedInstrument.symbol;
  const price = selectedInstrument.price;
  const quoteSource = selectedInstrument.quoteSource ?? "workspace";
  const hasQuote = price !== undefined && price !== null && Number.isFinite(price);
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const localEvents: ModuleNewsEvent[] = [
    hasQuote
      ? {
          id: "quote-update",
          source: "Market data",
          title: `${selectedSymbol} quote ${formatInstrumentPrice(price)} from ${quoteSource}`,
          impact: selectedInstrument.changePct < 0 ? "warning" : "positive",
          detail: `As of ${selectedInstrument.quoteAsOf ?? "latest workspace refresh"} · change ${formatSignedPct(
            selectedInstrument.changePct
          )}`
        }
      : {
          id: "quote-missing",
          source: "Market data",
          title: `${selectedSymbol} quote unavailable`,
          impact: "warning",
          detail: "Refresh workspace or configure a market data adapter."
        },
    workspace.researchRun
      ? {
          id: "audit-run",
          source: "Audit log",
          title: `Run ${workspace.researchRun.runId} bound to ${selectedSymbol}`,
          impact: "ai",
          detail: `${workspace.researchRun.dataRows} ${workspace.researchRun.timeframe} bars · revision ${workspace.researchRun.strategyRevision} · ${workspace.researchRun.executionMode}`
        }
      : {
          id: "audit-needed",
          source: "Audit log",
          title: `${selectedSymbol} needs a fresh audited run`,
          impact: "warning",
          detail: "Run Pipeline to bind data, backtest, agent review, and execution gates."
        },
    {
      id: "execution-gates",
      source: "Risk engine",
      title: workspace.execution.liveEnabled ? "Live execution gates open" : `${blockedGateCount} execution gates blocked`,
      impact: workspace.execution.liveEnabled ? "positive" : "risk",
      detail: workspace.execution.gates.map((gate) => `${gate.label}: ${gate.passed ? "passed" : "blocked"}`).join(" · ")
    }
  ];
  const committeeEvents = workspace.decisionLog.slice(0, 3).map((entry, index) => ({
    id: `committee-${index}`,
    source: "AI committee",
    title: `${entry.agent}: ${entry.message}`,
    impact: entry.tone,
    detail: `Linked to ${selectedSymbol} research context.`
  }));
  return [...localEvents, ...committeeEvents];
}

export function inferSmaConditionKind(text: string, fallback: StrategyConditionKind): StrategyConditionKind {
  const normalized = text.toLowerCase();
  if (normalized.includes("below") || text.includes("<")) {
    return "close_below_sma";
  }
  if (normalized.includes("above") || text.includes(">")) {
    return "close_above_sma";
  }
  return fallback;
}

export function inferSmaWindow(text: string, fallback: number): number {
  const match = text.match(/sma\s*(\d+)/iu) ?? text.match(/window\s*=\s*(\d+)/iu);
  return normalizeStrategyWindow(match ? Number(match[1]) : fallback);
}

export function rsiOperatorToConditionKind(operator: "<" | ">"): StrategyConditionKind {
  return operator === "<" ? "rsi_below" : "rsi_above";
}

export function inferPercent(text: string, fallback: number): number {
  const match = text.match(/(\d+(?:\.\d+)?)\s*%/u);
  return normalizeStrategyPercent(match ? Number(match[1]) : fallback, fallback);
}

export function inferPercentNearKeywords(text: string, keywords: string[], fallback: number): number {
  const normalized = text.toLowerCase();
  for (const match of normalized.matchAll(/([+-]?\d+(?:\.\d+)?)\s*%/gu)) {
    const index = match.index ?? 0;
    const prefix = normalized.slice(Math.max(0, index - 36), index);
    if (keywords.some((keyword) => prefix.includes(keyword))) {
      return normalizeStrategyPercent(Math.abs(Number(match[1])), fallback);
    }
  }
  return normalizeStrategyPercent(fallback, fallback);
}

export function normalizeStrategyRuleDraft(draft: StrategyRuleDraft): StrategyRuleDraft {
  const entryKind = normalizeStrategyConditionKind(draft.entryKind, defaultStrategyRuleDraft.entryKind);
  return {
    name: draft.name.trim() || defaultStrategyRuleDraft.name,
    entryKind,
    entryWindow: normalizeStrategyWindow(draft.entryWindow),
    entryThreshold: normalizeStrategyThreshold(draft.entryThreshold, defaultStrategyRuleDraft.entryThreshold),
    entryRsiConfirm: !isRsiConditionKind(entryKind) && Boolean(draft.entryRsiConfirm),
    entryRsiWindow: normalizeStrategyWindow(draft.entryRsiWindow),
    entryRsiThreshold: normalizeStrategyThreshold(draft.entryRsiThreshold, defaultStrategyRuleDraft.entryRsiThreshold),
    entryVolumeConfirm: Boolean(draft.entryVolumeConfirm),
    entryVolumeWindow: normalizeStrategyWindow(draft.entryVolumeWindow),
    exitKind: normalizeStrategyConditionKind(draft.exitKind, defaultStrategyRuleDraft.exitKind),
    exitWindow: normalizeStrategyWindow(draft.exitWindow),
    exitThreshold: normalizeStrategyThreshold(draft.exitThreshold, defaultStrategyRuleDraft.exitThreshold),
    positionPct: normalizeStrategyPercent(draft.positionPct, defaultStrategyRuleDraft.positionPct),
    stopLossPct: normalizeStrategyPercent(draft.stopLossPct, defaultStrategyRuleDraft.stopLossPct),
    takeProfitPct: normalizeStrategyPercent(draft.takeProfitPct, defaultStrategyRuleDraft.takeProfitPct),
    maxDrawdownPct: normalizeStrategyPercent(draft.maxDrawdownPct, defaultStrategyRuleDraft.maxDrawdownPct),
    paperOnly: draft.paperOnly
  };
}

export function normalizeStrategyConditionKind(kind: StrategyConditionKind, fallback: StrategyConditionKind): StrategyConditionKind {
  return ["close_above_sma", "close_below_sma", "rsi_below", "rsi_above"].includes(kind) ? kind : fallback;
}

export function isRsiConditionKind(kind: StrategyConditionKind): boolean {
  return kind === "rsi_below" || kind === "rsi_above";
}

export function normalizeStrategyWindow(value: number): number {
  if (!Number.isFinite(value)) {
    return defaultStrategyRuleDraft.entryWindow;
  }
  return Math.max(1, Math.min(Math.round(value), 250));
}

export function normalizeStrategyThreshold(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(Number(value.toFixed(2)), 100));
}

export function normalizeStrategyPercent(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(Number(value.toFixed(2)), 100));
}

export function strategyConditionSnapshotText(kind: StrategyConditionKind, window: number, threshold: number): string {
  if (kind === "close_below_sma") {
    return `Close < SMA${window}`;
  }
  if (kind === "rsi_below") {
    return `RSI${window} < ${formatConditionNumber(threshold)}`;
  }
  if (kind === "rsi_above") {
    return `RSI${window} > ${formatConditionNumber(threshold)}`;
  }
  return `Close > SMA${window}`;
}

export function formatPercentValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/u, "").replace(/\.$/u, "");
}

export function isPendingStrategyText(text: string): boolean {
  return text.startsWith("Pending") || text.startsWith("Run Pipeline");
}

export function metricValue(workspace: TerminalWorkspace, label: string, fallback: string): string {
  return workspace.metrics.find((metric) => metric.label === label)?.value ?? fallback;
}

export function normalizeDrawdownLoss(value: string): string {
  if (value === "N/A" || value.startsWith("-")) {
    return value;
  }
  return `-${value}`;
}

export function formatWarningCount(count: number): string {
  return count === 1 ? "1 warning" : `${count} warnings`;
}

export function formatPreparationEvidenceDetail(evidence: ResearchRunDataPreparationEvidence): string {
  const parts = [
    evidence.runId,
    evidence.kind,
    `${evidence.symbol} ${evidence.timeframe}`,
    `${evidence.quality.source} ${evidence.quality.isComplete ? "complete" : "review"}`,
    `${evidence.upsertedRows} rows cached`
  ];
  if (evidence.overrideAuditEventId) {
    parts.push(`override ${evidence.overrideAuditEventId}`);
  }
  return parts.join(" · ");
}

export function formatMarketCalendarEvidenceDetail(calendar: ResearchContextMarketCalendar): string {
  const warnings = calendar.warnings.filter((warning) => warning.trim());
  return [
    calendar.market,
    calendar.timezone,
    `${calendar.status}/${calendar.session}`,
    marketCalendarNextEventDetail(calendar),
    warnings[0] ?? calendar.source,
    formatWarningCount(warnings.length)
  ].join(" · ");
}

export function marketCalendarEvidenceTone(calendar: ResearchContextMarketCalendar): "positive" | "warning" {
  const hasWarnings = calendar.warnings.some((warning) => warning.trim());
  return (calendar.status === "open" || calendar.status === "always_open") && !hasWarnings ? "positive" : "warning";
}

export function parsePercentMetric(value: string): number | null {
  const normalized = value.trim().replace("%", "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatSignedCurrency(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

export function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/0+$/u, "").replace(/\.$/u, "");
}

export function portfolioPaperOrderStateTone(state: string): "positive" | "warning" | "neutral" | "risk" {
  if (state === "operator_approved" || state === "ready_for_simulation" || state === "simulation_filled") {
    return "positive";
  }
  if (state === "awaiting_operator_review" || state === "risk_review" || state === "simulation_recorded") {
    return "warning";
  }
  if (state === "operator_rejected" || state === "risk_rejected" || state === "invalid_order" || state === "live_blocked") {
    return "risk";
  }
  return "neutral";
}

export function executionAdapterLedgerTone(state: string): "positive" | "warning" | "neutral" | "risk" {
  if (state === "paper_ready" || state === "live_ready") {
    return "positive";
  }
  if (state === "config_required") {
    return "warning";
  }
  if (state === "live_blocked" || state === "blocked") {
    return "risk";
  }
  return "neutral";
}

export function executionAdapterCertificationTone(
  status: ExecutionAdapterCertificationStatus
): "positive" | "warning" | "neutral" | "risk" {
  if (status === "passed") {
    return "positive";
  }
  if (status === "review") {
    return "warning";
  }
  if (status === "blocked" || status === "failed") {
    return "risk";
  }
  return "neutral";
}

export function executionAdapterCertificationStatusLabel(status: ExecutionAdapterCertificationStatus): string {
  return (
    {
      blocked: "Blocked",
      failed: "Failed",
      passed: "Passed",
      review: "Review"
    } satisfies Record<ExecutionAdapterCertificationStatus, string>
  )[status];
}

export function executionAdapterCertificationCheckSummary(
  summary: ExecutionAdapterCertificationSnapshot["summary"]
): string {
  const parts = [
    [summary.passedChecks, "passed"],
    [summary.blockedChecks, "blocked"],
    [summary.failedChecks, "failed"],
    [summary.reviewChecks, "review"]
  ]
    .filter(([count]) => Number(count) > 0)
    .map(([count, label]) => `${count} ${label}`);
  return [...(parts.length ? parts : ["0 passed"]), `${summary.checkCount} checks`].join(" / ");
}

export function executionAdapterCertificationApplyTone(
  status: ExecutionAdapterCertificationApplyStatus
): "positive" | "warning" | "neutral" | "risk" {
  if (status === "ready_for_restart") {
    return "warning";
  }
  return "risk";
}

export function executionAdapterCertificationApplyStatusLabel(status: ExecutionAdapterCertificationApplyStatus): string {
  return (
    {
      blocked: "Blocked",
      ready_for_restart: "Ready for restart"
    } satisfies Record<ExecutionAdapterCertificationApplyStatus, string>
  )[status];
}

export function executionAdapterCertificationApplyConfirmationSummary(
  confirmations: ExecutionAdapterCertificationApplySnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}
