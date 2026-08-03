import type { PaperExecutionSnapshot, PaperExecutionSnapshotOrder, WorkflowRunState, WorkflowStageArtifact, WorkflowStageStatus } from "../audit/execution-contracts";
import { formatAssumptionsForAudit, formatPct, formatSignedIntegerDelta, formatSignedPct, formatSignedPointDelta, metricNumber } from "../core/workspace-audit-formatters";
import type { BacktestRunComparisonMatrixBadge, BacktestRunComparisonMatrixRow, BacktestRunComparisonMatrixSummary, ResearchRunAudit, ResearchRunComparisonRow, ResearchRunContextBinding, TerminalWorkspace } from "../core/workspace-contracts";
import { activeQuantLoopStepId, buildPrimaryQuantLoopSteps } from "../core/workspace-contracts";
import { buildRiskApprovalRisk } from "../portfolio/report-builders";
import type { AiWorkbenchAction, ResearchRunSummary, WorkflowStageView } from "../stage1/archive-contracts";
import type { Market } from "../stage1/foundation-contracts";
import type { ExecutionState } from "../stage1/review-contracts";
import { buildBacktestBenchmark, formatWarningCount, metricValue } from "./backtest-builders";
import { buildResearchRunContextBinding, buildStrategyRuleDraft, normalizeBacktestAssumptions, resolveBacktestAssumptions } from "./experiment-builders";
import { formatAssumptionCurrency } from "./workflow-builders";

export function resolvePaperTargetNotional(workspace: TerminalWorkspace): number {
  const strategyDraft = buildStrategyRuleDraft(workspace);
  const approvalRisk = buildRiskApprovalRisk(workspace, strategyDraft);
  const assumptions = resolveBacktestAssumptions(workspace);
  const positionPct =
    approvalRisk.positionPct !== null && approvalRisk.positionPct > 0
      ? approvalRisk.positionPct / 100
      : strategyDraft.positionPct / 100;
  return Math.max(1, Math.min(assumptions.initialCash * positionPct, 20_000));
}

export function calculatePaperQuantity(market: Market, price: number, targetNotional = 20_000): number {
  const rawQuantity = Math.max(1, Math.floor(targetNotional / price));
  if (market === "ashare") {
    return Math.max(100, Math.floor(rawQuantity / 100) * 100);
  }
  if (market === "crypto") {
    return Math.max(1, Math.floor(rawQuantity));
  }
  return rawQuantity;
}

export function averageFilledPrice(orders: PaperExecutionSnapshotOrder[], symbol: string): number {
  const filledOrders = orders.filter((order) => order.symbol === symbol && order.status === "filled" && order.quantity > 0);
  const totalQuantity = filledOrders.reduce((sum, order) => sum + order.quantity, 0);
  if (totalQuantity <= 0) {
    return 0;
  }
  return filledOrders.reduce((sum, order) => sum + order.quantity * order.price, 0) / totalQuantity;
}

export function resolveExecutionMarkPrice(
  workspace: TerminalWorkspace,
  execution: PaperExecutionSnapshot,
  symbol: string,
  fallback: number
): number {
  if (workspace.selectedInstrument.symbol === symbol) {
    const selectedPrice = workspace.selectedInstrument.price;
    if (typeof selectedPrice === "number" && Number.isFinite(selectedPrice) && selectedPrice > 0) {
      return selectedPrice;
    }
  }
  const latestOrder = [...execution.orders]
    .reverse()
    .find((order) => order.symbol === symbol && order.status === "filled" && order.price > 0);
  return latestOrder?.price ?? fallback;
}

export function findDecisionMessage(workspace: TerminalWorkspace, agent: string): string {
  return workspace.decisionLog.find((entry) => entry.agent === agent)?.message ?? "No committee note recorded yet.";
}

export function buildWorkflowStages(workspace: TerminalWorkspace, runState?: WorkflowRunState): WorkflowStageView[] {
  const completedStageIds = new Set(runState?.completedStageIds ?? []);
  const latestOutputByStage = new Map<string, string>();
  for (const logEntry of runState?.log ?? []) {
    latestOutputByStage.set(logEntry.stageId, logEntry.message);
  }

  return workspace.workflowNodes.map((node, index) => {
    const isExecution = node.id === "execution";
    const defaultStatus: WorkflowStageStatus =
      isExecution && !workspace.execution.liveEnabled ? "blocked" : index === 0 ? "active" : "ready";
    const status: WorkflowStageStatus =
      isExecution && !workspace.execution.liveEnabled
        ? "blocked"
        : runState?.failedStageId === node.id
          ? "failed"
          : completedStageIds.has(node.id)
            ? "completed"
            : runState?.activeStageId === node.id
              ? "running"
              : defaultStatus;
    return {
      id: node.id,
      label: node.label,
      detail: node.detail,
      status,
      output:
        latestOutputByStage.get(node.id) ??
        (node.id === "data"
          ? `${workspace.selectedInstrument.symbol} · ${workspace.selectedTimeframe}`
          : isExecution && !workspace.execution.liveEnabled
            ? "Paper execution only"
            : "Ready for pipeline run"),
      artifacts: buildWorkflowStageArtifacts(workspace, node.id)
    };
  });
}

export function buildWorkflowStageArtifacts(workspace: TerminalWorkspace, stageId: string): WorkflowStageArtifact[] {
  if (stageId === "data") {
    const preparationEvidence = workspace.researchRun?.dataSnapshot?.preparationEvidence ?? null;
    return [
      {
        label: "Instrument",
        value: workspace.selectedInstrument.symbol,
        detail: `${workspace.selectedInstrument.name} · ${workspace.selectedInstrument.market}`,
        tone: "neutral"
      },
      {
        label: "Timeframe",
        value: workspace.selectedTimeframe,
        detail: "Selected research interval",
        tone: "neutral"
      },
      {
        label: "Rows",
        value: workspace.researchRun ? `${workspace.researchRun.dataRows} bars` : "Pending run",
        detail: workspace.researchRun
          ? `Bound to audited run ${workspace.researchRun.runId}.`
          : "Run Pipeline to bind an audited data snapshot.",
        tone: workspace.researchRun ? "positive" : "warning"
      },
      ...(preparationEvidence
        ? [
            {
              label: "Preparation evidence",
              value: preparationEvidence.runId,
              detail: `${preparationEvidence.upsertedRows} rows cached · ${preparationEvidence.quality.source}`,
              tone: preparationEvidence.quality.isComplete ? ("positive" as const) : ("warning" as const)
            }
          ]
        : [])
    ];
  }

  if (stageId === "factor") {
    return [
      { label: "Entry", value: workspace.strategy.entry, detail: "Signal gate", tone: "positive" },
      { label: "Exit", value: workspace.strategy.exit, detail: "Invalidation rule", tone: "warning" },
      { label: "Risk", value: workspace.strategy.risk, detail: "Sizing and guardrail", tone: "risk" }
    ];
  }

  if (stageId === "backtest") {
    const assumptions = resolveBacktestAssumptions(workspace);
    return [
      ...workspace.metrics.map((metric) => ({
        label: metric.label,
        value: metric.value,
        detail: "Latest audited metric for the selected context.",
        tone: metric.tone
      })),
      {
        label: "Initial cash",
        value: formatAssumptionCurrency(assumptions.initialCash),
        detail: "Backtest capital assumption.",
        tone: "neutral" as const
      },
      {
        label: "Fee",
        value: `${assumptions.feeBps} bps`,
        detail: "Round-trip fee assumption in basis points.",
        tone: "neutral" as const
      },
      {
        label: "Slippage",
        value: `${assumptions.slippageBps} bps`,
        detail: "Execution slippage assumption in basis points.",
        tone: "warning" as const
      }
    ];
  }

  if (stageId === "agent") {
    return workspace.decisionLog.slice(0, 4).map((entry) => ({
      label: entry.agent,
      value: entry.message,
      detail: "AI research note from supplied workspace context.",
      tone: entry.tone
    }));
  }

  if (stageId === "execution") {
    const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
    return [
      {
        label: "Mode",
        value: workspace.execution.mode,
        detail: workspace.execution.liveEnabled ? "Certified live route is available." : "Paper route only.",
        tone: workspace.execution.liveEnabled ? "positive" : "warning"
      },
      {
        label: "Live gates",
        value: workspace.execution.liveEnabled ? "open" : `${blockedGateCount} blocked`,
        detail: workspace.execution.gates.map((gate) => gate.label).join(", "),
        tone: workspace.execution.liveEnabled ? "positive" : "warning"
      }
    ];
  }

  return [];
}

export function workspaceWithAiAction(workspace: TerminalWorkspace, action: AiWorkbenchAction): TerminalWorkspace {
  const auditBinding = buildResearchRunContextBinding(workspace);
  const run = workspace.researchRun;
  if (!auditBinding.canUseRun || !run) {
    const actionLabel = action === "explain" ? "explanation" : "debate";
    return {
      ...workspace,
      decisionLog: [
        {
          agent: "AI Review Gate",
          message: aiReviewActionBlockedMessage(workspace, actionLabel, auditBinding),
          tone: "warning"
        },
        ...workspace.decisionLog
      ]
    };
  }

  if (action === "explain") {
    const returnMetric = workspace.metrics.find((metric) => metric.label === "Return")?.value ?? "N/A";
    const drawdownMetric = workspace.metrics.find((metric) => metric.label === "Max DD")?.value ?? "N/A";
    const tradeMetric = workspace.metrics.find((metric) => metric.label === "Trades")?.value ?? "0";
    const benchmark = buildBacktestBenchmark(workspace);
    const benchmarkClause =
      benchmark.sampleBars > 0 && benchmark.benchmarkReturn !== "Pending snapshot"
        ? `, benchmark ${benchmark.benchmarkReturn}, alpha ${benchmark.alpha}`
        : "";
    return {
      ...workspace,
      decisionLog: [
        {
          agent: "AI Summary",
          message: `Backtest explanation for ${workspace.selectedInstrument.symbol} using audited run ${run.runId}: return ${returnMetric}${benchmarkClause}, max drawdown ${drawdownMetric}, trades ${tradeMetric}; no guaranteed outcome.`,
          tone: "ai"
        },
        ...workspace.decisionLog
      ]
    };
  }

  return {
    ...workspace,
    decisionLog: [
      {
        agent: "AI Debate",
        message: `Debate generated for ${workspace.selectedInstrument.symbol} using audited run ${run.runId}: bull case requires momentum confirmation; bear case flags drawdown and data quality.`,
        tone: "ai"
      },
      ...workspace.decisionLog
    ]
  };
}

export function aiReviewActionBlockedMessage(
  workspace: TerminalWorkspace,
  actionLabel: "explanation" | "debate",
  auditBinding: ResearchRunContextBinding
): string {
  const reason =
    auditBinding.status === "mismatched" ? auditBinding.detail : "run Pipeline to create an audited backtest first.";
  return `AI ${actionLabel} blocked for ${workspace.selectedInstrument.symbol}: ${reason}`;
}

export function buildAiActionWorkflowState(workspace: TerminalWorkspace, action: AiWorkbenchAction): WorkflowRunState {
  const context = `${workspace.selectedInstrument.symbol} · ${workspace.selectedTimeframe}`;
  const returnMetric = metricValue(workspace, "Return", "N/A");
  const drawdownMetric = metricValue(workspace, "Max DD", "N/A");
  const benchmark = buildBacktestBenchmark(workspace);
  const auditBinding = buildResearchRunContextBinding(workspace);
  const run = auditBinding.canUseRun ? workspace.researchRun : null;
  if (!run) {
    const actionLabel = action === "explain" ? "explanation" : "debate";
    const blockedMessage = aiReviewActionBlockedMessage(workspace, actionLabel, auditBinding);
    return {
      activeStageId: "backtest",
      completedStageIds: ["data", "factor"],
      log: [
        {
          id: `ai-action-${workspace.selectedInstrument.symbol}-data`,
          stageId: "data",
          level: "success",
          message: `Research context selected: ${context}`
        },
        {
          id: `ai-action-${workspace.selectedInstrument.symbol}-factor`,
          stageId: "factor",
          level: "success",
          message: `Strategy context selected: ${workspace.strategy.name}`
        },
        {
          id: `ai-action-${workspace.selectedInstrument.symbol}-backtest`,
          stageId: "backtest",
          level: "warning",
          message:
            auditBinding.status === "mismatched"
              ? "Audited backtest does not match the current context; run Pipeline before AI review."
              : "Audited backtest is missing; run Pipeline before AI review."
        },
        {
          id: `ai-action-${workspace.selectedInstrument.symbol}-agent`,
          stageId: "agent",
          level: "warning",
          message: blockedMessage
        }
      ]
    };
  }

  const actionMessage =
    action === "explain"
      ? `AI explanation generated for ${workspace.selectedInstrument.symbol} using audited run ${
          run.runId
        }: return ${returnMetric}${
          benchmark.sampleBars > 0 && benchmark.benchmarkReturn !== "Pending snapshot"
            ? `, benchmark ${benchmark.benchmarkReturn}, alpha ${benchmark.alpha}`
            : ""
        }, max drawdown ${drawdownMetric}; no guaranteed outcome.`
      : `AI debate generated for ${workspace.selectedInstrument.symbol} using audited run ${run.runId}; bull, bear, and risk notes updated.`;

  return {
    activeStageId: "agent",
    completedStageIds: ["data", "factor", "backtest"],
    log: [
      {
        id: `ai-action-${workspace.selectedInstrument.symbol}-data`,
        stageId: "data",
        level: run ? "success" : "warning",
        message: run
          ? `Research context bound to ${run.runId}: ${context}`
          : `Research context selected without an audited run: ${context}`
      },
      {
        id: `ai-action-${workspace.selectedInstrument.symbol}-backtest`,
        stageId: "backtest",
        level: run ? "success" : "warning",
        message: run
          ? `Backtest evidence available: ${run.dataRows} bars`
          : "Backtest evidence is local workspace state; run Pipeline for an audited snapshot."
      },
      {
        id: `ai-action-${workspace.selectedInstrument.symbol}-agent`,
        stageId: "agent",
        level: "success",
        message: actionMessage
      }
    ]
  };
}

export function clearAuditedResearchResults(
  workspace: TerminalWorkspace,
  activeStepId = activeQuantLoopStepId(workspace)
): TerminalWorkspace {
  return {
    ...workspace,
    quantLoop: buildPrimaryQuantLoopSteps(activeStepId, false),
    metrics: [
      { label: "Return", value: "N/A", tone: "neutral" },
      { label: "Max DD", value: "N/A", tone: "warning" },
      { label: "Win Rate", value: "N/A", tone: "neutral" },
      { label: "Trades", value: "0", tone: "neutral" }
    ],
    backtestTrades: [],
    backtestEquityCurve: [],
    backtestDiagnostics: [],
    researchRun: null
  };
}

export function executionModeLabel(execution: ExecutionState): string {
  if (execution.mode === "paper_only") {
    return "Paper only";
  }
  if (execution.mode === "certified_live") {
    return "Certified live";
  }
  return "Blocked live";
}

export function researchRunLabel(summary: ResearchRunSummary | null | undefined): string {
  if (!summary) {
    return "No audited run yet";
  }
  return `${summary.runId} · ${summary.dataRows} ${summary.timeframe} bars · ${summary.executionMode}`;
}

export function researchRunEvidenceLogLabel(summary: ResearchRunSummary | null | undefined): string {
  if (!summary) {
    return "Audited backtest received";
  }
  const dataQuality = summary.dataQuality
    ? `${summary.dataQuality.source} ${summary.dataQuality.isComplete ? "complete" : "review"} · ${formatWarningCount(summary.dataQuality.warnings.length)}`
    : "data quality not attached";
  return `Audited backtest received: ${summary.dataRows} ${summary.timeframe} bars · ${dataQuality} · strategy ${summary.strategyRevision} · ${summary.executionMode}`;
}

export function researchRunHistoryLabel(run: ResearchRunAudit): string {
  const totalReturn = run.metrics.total_return_pct;
  const tradeCount = run.metrics.trade_count ?? 0;
  const returnLabel = Number.isFinite(totalReturn)
    ? `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}%`
    : "N/A";
  return `${run.symbol} · ${run.timeframe} · ${returnLabel} · ${tradeCount} trades`;
}

export function buildResearchRunComparisonRows(runs: ResearchRunAudit[]): ResearchRunComparisonRow[] {
  if (runs.length < 2) {
    return [];
  }
  const [current, previous] = runs;
  const returnDelta = metricNumber(current, "total_return_pct") - metricNumber(previous, "total_return_pct");
  const drawdownDelta = metricNumber(current, "max_drawdown_pct") - metricNumber(previous, "max_drawdown_pct");
  const tradeDelta = metricNumber(current, "trade_count") - metricNumber(previous, "trade_count");
  const currentAssumptions = normalizeBacktestAssumptions(current.backtestAssumptions);
  const previousAssumptions = normalizeBacktestAssumptions(previous.backtestAssumptions);
  const assumptionsChanged =
    currentAssumptions.initialCash !== previousAssumptions.initialCash ||
    currentAssumptions.feeBps !== previousAssumptions.feeBps ||
    currentAssumptions.slippageBps !== previousAssumptions.slippageBps;

  return [
    {
      id: "return",
      label: "Return",
      current: formatSignedPct(metricNumber(current, "total_return_pct")),
      previous: formatSignedPct(metricNumber(previous, "total_return_pct")),
      delta: formatSignedPointDelta(returnDelta),
      tone: returnDelta > 0 ? "positive" : returnDelta < 0 ? "warning" : "neutral"
    },
    {
      id: "drawdown",
      label: "Max DD",
      current: formatPct(metricNumber(current, "max_drawdown_pct")),
      previous: formatPct(metricNumber(previous, "max_drawdown_pct")),
      delta: formatSignedPointDelta(drawdownDelta),
      tone: drawdownDelta < 0 ? "positive" : drawdownDelta > 0 ? "warning" : "neutral"
    },
    {
      id: "trades",
      label: "Trades",
      current: String(metricNumber(current, "trade_count")),
      previous: String(metricNumber(previous, "trade_count")),
      delta: formatSignedIntegerDelta(tradeDelta),
      tone: "neutral"
    },
    {
      id: "assumptions",
      label: "Assumptions",
      current: formatAssumptionsForAudit(currentAssumptions),
      previous: formatAssumptionsForAudit(previousAssumptions),
      delta: assumptionsChanged ? "changed" : "same",
      tone: assumptionsChanged ? "warning" : "neutral"
    }
  ];
}

export function buildBacktestRunComparisonMatrixRows(
  runs: ResearchRunAudit[],
  currentRunId?: string | null
): BacktestRunComparisonMatrixRow[] {
  const selectedRun = runs.find((run) => run.runId === currentRunId) ?? runs[0] ?? null;
  if (!selectedRun) {
    return [];
  }

  const comparableRuns = runs
    .filter(
      (run) =>
        run.market === selectedRun.market &&
        run.symbol === selectedRun.symbol &&
        run.timeframe === selectedRun.timeframe
    )
    .slice()
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

  if (!comparableRuns.length) {
    return [];
  }

  const bestReturnRun = comparableRuns.reduce((best, run) =>
    metricNumber(run, "total_return_pct") > metricNumber(best, "total_return_pct") ? run : best
  );
  const lowestDrawdownRun = comparableRuns.reduce((best, run) =>
    metricNumber(run, "max_drawdown_pct") < metricNumber(best, "max_drawdown_pct") ? run : best
  );
  const selectedTimestamp = Date.parse(selectedRun.createdAt);
  const previousRun =
    comparableRuns.find((run) => run.runId !== selectedRun.runId && Date.parse(run.createdAt) < selectedTimestamp) ??
    comparableRuns.find((run) => run.runId !== selectedRun.runId) ??
    null;

  return comparableRuns.map((run) => {
    const badges = buildBacktestRunComparisonMatrixBadges(run, {
      bestReturnRun,
      currentRunId: selectedRun.runId,
      lowestDrawdownRun,
      previousRun
    });
    return {
      id: `backtest-run-compare-${run.runId}`,
      assumptions: formatAssumptionsForAudit(normalizeBacktestAssumptions(run.backtestAssumptions)),
      badges,
      context: `${run.market} ${run.symbol} ${run.timeframe}`,
      createdAt: run.createdAt,
      dataQualityLabel: backtestRunComparisonDataQualityLabel(run),
      dataRows: run.dataRows,
      maxDrawdownPct: formatPct(metricNumber(run, "max_drawdown_pct")),
      returnPct: formatSignedPct(metricNumber(run, "total_return_pct")),
      runId: run.runId,
      strategyName: run.strategyName,
      strategyRevision: run.strategyRevision,
      symbol: run.symbol,
      timeframe: run.timeframe,
      tone: backtestRunComparisonTone(run, badges),
      tradeCount: String(metricNumber(run, "trade_count")),
      winRatePct: formatPct(metricNumber(run, "win_rate_pct"))
    };
  });
}

export function buildBacktestCrossSymbolComparisonRows(
  runs: ResearchRunAudit[],
  currentRunId?: string | null
): BacktestRunComparisonMatrixRow[] {
  const selectedRun = runs.find((run) => run.runId === currentRunId) ?? runs[0] ?? null;
  if (!selectedRun) {
    return [];
  }

  const latestRunBySymbol = new Map<string, ResearchRunAudit>();
  runs
    .filter((run) => run.market === selectedRun.market && run.timeframe === selectedRun.timeframe)
    .forEach((run) => {
      const existing = latestRunBySymbol.get(run.symbol);
      if (
        run.runId === selectedRun.runId ||
        !existing ||
        (existing.runId !== selectedRun.runId && Date.parse(run.createdAt) > Date.parse(existing.createdAt))
      ) {
        latestRunBySymbol.set(run.symbol, run);
      }
    });

  const comparableRuns = Array.from(latestRunBySymbol.values()).sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
  );

  if (!comparableRuns.length) {
    return [];
  }

  const bestReturnRun = comparableRuns.reduce((best, run) =>
    metricNumber(run, "total_return_pct") > metricNumber(best, "total_return_pct") ? run : best
  );
  const lowestDrawdownRun = comparableRuns.reduce((best, run) =>
    metricNumber(run, "max_drawdown_pct") < metricNumber(best, "max_drawdown_pct") ? run : best
  );

  return comparableRuns.map((run) => {
    const badges = buildBacktestCrossSymbolComparisonBadges(run, {
      bestReturnRun,
      currentRunId: selectedRun.runId,
      lowestDrawdownRun
    });
    return {
      id: `backtest-cross-symbol-${run.runId}`,
      assumptions: formatAssumptionsForAudit(normalizeBacktestAssumptions(run.backtestAssumptions)),
      badges,
      context: `${run.market} ${run.timeframe} cross-symbol`,
      createdAt: run.createdAt,
      dataQualityLabel: backtestRunComparisonDataQualityLabel(run),
      dataRows: run.dataRows,
      maxDrawdownPct: formatPct(metricNumber(run, "max_drawdown_pct")),
      returnPct: formatSignedPct(metricNumber(run, "total_return_pct")),
      runId: run.runId,
      strategyName: run.strategyName,
      strategyRevision: run.strategyRevision,
      symbol: run.symbol,
      timeframe: run.timeframe,
      tone: backtestRunComparisonTone(run, badges),
      tradeCount: String(metricNumber(run, "trade_count")),
      winRatePct: formatPct(metricNumber(run, "win_rate_pct"))
    };
  });
}

export function buildBacktestRunComparisonMatrixSummary(
  rows: BacktestRunComparisonMatrixRow[]
): BacktestRunComparisonMatrixSummary | null {
  if (!rows.length) {
    return null;
  }
  const currentRow = rows.find((row) => row.badges.includes("current")) ?? null;
  const bestReturnRow = rows.find((row) => row.badges.includes("best_return")) ?? null;
  const lowestDrawdownRow = rows.find((row) => row.badges.includes("lowest_drawdown")) ?? null;
  const previousRow = rows.find((row) => row.badges.includes("previous_run")) ?? null;
  const hasRisk = rows.some((row) => row.tone === "risk");
  const hasWarning = rows.some((row) => row.tone === "warning");
  const tone: BacktestRunComparisonMatrixSummary["tone"] = hasRisk ? "risk" : hasWarning ? "warning" : "positive";

  return {
    bestReturnRunId: bestReturnRow?.runId ?? null,
    context: rows[0].context,
    currentRunId: currentRow?.runId ?? null,
    detail: [
      bestReturnRow ? `Best return ${bestReturnRow.runId} ${bestReturnRow.returnPct}.` : "Best return unavailable.",
      lowestDrawdownRow
        ? `Lowest drawdown ${lowestDrawdownRow.runId} ${lowestDrawdownRow.maxDrawdownPct}.`
        : "Lowest drawdown unavailable.",
      previousRow ? `Previous comparable run ${previousRow.runId}.` : "No previous comparable run.",
      "This is historical audited evidence only, not investment advice."
    ].join(" "),
    headline: `${rows.length} comparable audited runs`,
    lowestDrawdownRunId: lowestDrawdownRow?.runId ?? null,
    previousRunId: previousRow?.runId ?? null,
    tone,
    totalRows: rows.length
  };
}

export function buildBacktestCrossSymbolComparisonSummary(
  rows: BacktestRunComparisonMatrixRow[]
): BacktestRunComparisonMatrixSummary | null {
  if (!rows.length) {
    return null;
  }
  const currentRow = rows.find((row) => row.badges.includes("current")) ?? null;
  const bestReturnRow = rows.find((row) => row.badges.includes("best_return")) ?? null;
  const lowestDrawdownRow = rows.find((row) => row.badges.includes("lowest_drawdown")) ?? null;
  const hasRisk = rows.some((row) => row.tone === "risk");
  const hasWarning = rows.some((row) => row.tone === "warning");
  const tone: BacktestRunComparisonMatrixSummary["tone"] = hasRisk ? "risk" : hasWarning ? "warning" : "positive";

  return {
    bestReturnRunId: bestReturnRow?.runId ?? null,
    context: rows[0].context,
    currentRunId: currentRow?.runId ?? null,
    detail: [
      bestReturnRow
        ? `Best return ${bestReturnRow.symbol} ${bestReturnRow.runId} ${bestReturnRow.returnPct}.`
        : "Best return unavailable.",
      lowestDrawdownRow
        ? `Lowest drawdown ${lowestDrawdownRow.symbol} ${lowestDrawdownRow.runId} ${lowestDrawdownRow.maxDrawdownPct}.`
        : "Lowest drawdown unavailable.",
      "This is historical audited evidence only, not investment advice."
    ].join(" "),
    headline: `${rows.length} audited symbols compared`,
    lowestDrawdownRunId: lowestDrawdownRow?.runId ?? null,
    previousRunId: null,
    tone,
    totalRows: rows.length
  };
}

export function filterBacktestRunComparisonMatrixRows(
  rows: BacktestRunComparisonMatrixRow[],
  query: string
): BacktestRunComparisonMatrixRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  return rows.filter((row) =>
    [
      row.assumptions,
      row.badges.join(" "),
      row.context,
      row.createdAt,
      row.dataQualityLabel,
      row.maxDrawdownPct,
      row.returnPct,
      row.runId,
      row.strategyName,
      row.strategyRevision,
      row.tradeCount,
      row.winRatePct
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

export const filterBacktestCrossSymbolComparisonRows = filterBacktestRunComparisonMatrixRows;

export function buildBacktestCrossSymbolComparisonBadges(
  run: ResearchRunAudit,
  context: {
    bestReturnRun: ResearchRunAudit;
    currentRunId: string;
    lowestDrawdownRun: ResearchRunAudit;
  }
): BacktestRunComparisonMatrixBadge[] {
  const badges: BacktestRunComparisonMatrixBadge[] = [];
  if (run.runId === context.currentRunId) {
    badges.push("current");
  }
  if (run.runId === context.bestReturnRun.runId) {
    badges.push("best_return");
  }
  if (run.runId === context.lowestDrawdownRun.runId) {
    badges.push("lowest_drawdown");
  }
  return badges.length ? badges : ["history"];
}

export function buildBacktestRunComparisonMatrixBadges(
  run: ResearchRunAudit,
  context: {
    bestReturnRun: ResearchRunAudit;
    currentRunId: string;
    lowestDrawdownRun: ResearchRunAudit;
    previousRun: ResearchRunAudit | null;
  }
): BacktestRunComparisonMatrixBadge[] {
  const badges: BacktestRunComparisonMatrixBadge[] = [];
  if (run.runId === context.currentRunId) {
    badges.push("current");
  }
  if (run.runId === context.previousRun?.runId) {
    badges.push("previous_run");
  }
  if (run.runId === context.bestReturnRun.runId) {
    badges.push("best_return");
  }
  if (run.runId === context.lowestDrawdownRun.runId) {
    badges.push("lowest_drawdown");
  }
  return badges.length ? badges : ["history"];
}

export function backtestRunComparisonDataQualityLabel(run: ResearchRunAudit): string {
  const dataQuality = run.dataQuality;
  if (!dataQuality) {
    return "data quality not attached";
  }
  return `${dataQuality.source} ${dataQuality.isComplete ? "complete" : "review"} · ${formatWarningCount(
    dataQuality.warnings.length
  )}`;
}

export function backtestRunComparisonTone(
  run: ResearchRunAudit,
  badges: BacktestRunComparisonMatrixBadge[]
): BacktestRunComparisonMatrixRow["tone"] {
  const dataQuality = run.dataQuality;
  if (
    !dataQuality ||
    !dataQuality.isComplete ||
    dataQuality.source === "demo-fallback" ||
    dataQuality.source === "unknown"
  ) {
    return "risk";
  }
  if (dataQuality.warnings.length > 0) {
    return "warning";
  }
  if (badges.includes("best_return") || badges.includes("lowest_drawdown") || badges.includes("current")) {
    return "positive";
  }
  return "neutral";
}
