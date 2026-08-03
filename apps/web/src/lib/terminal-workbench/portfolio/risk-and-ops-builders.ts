import type { PortfolioBacktestDiagnosticInput, PortfolioBacktestDiagnosticRow, PortfolioBacktestDiagnosticStatus, PortfolioBacktestDraft, PortfolioPeerAuditCandidate, PortfolioPeerAuditPlan, PortfolioRiskRow, ResearchOpsQueueAction, ResearchOpsQueueRow, ResearchOpsQueueStage, ResearchOpsQueueSummary } from "../audit/execution-contracts";
import type { PortfolioPaperOrderApprovalLockedLedgerStateResult } from "../audit/report-contracts";
import { timestampSortValue } from "../audit/signing-key-ledger";
import type { ResearchRunAudit, TerminalWorkspace } from "../core/workspace-contracts";
import { buildInstrumentFromSymbol } from "../core/workspace-operations";
import type { PortfolioPaperOrderApprovalRow, PortfolioPaperOrderBatchSnapshot, PortfolioPaperOrderLifecycleRow, PortfolioPaperOrderLifecycleSnapshot } from "./paper-contracts";
import { blockedPortfolioBacktestDraft, buildPortfolioCorrelationReview, buildPortfolioCovarianceRiskReview, buildPortfolioRebalanceDriftReview, buildPortfolioRiskContributionReview, diagnosticTone, formatDiagnosticPercent, formatDiagnosticWeight, formatMetricPercent, formatWeightLabel, roundWeight } from "./report-builders";
import type { WatchlistCacheRefreshItemSnapshot } from "../research/workspace-contracts";
import type { Timeframe } from "../stage1/foundation-contracts";
import type { BacktestEquityPoint, Instrument } from "../stage1/review-contracts";

export function researchOpsActionLabel(action: ResearchOpsQueueAction): string {
  return {
    "refresh-watchlist-cache": "Refresh data",
    "run-pipeline": "Run pipeline",
    "run-ai-review": "Run AI review",
    "review-production-handoff": "Review production handoff"
  }[action];
}

export function researchOpsQueueDetail(
  stage: ResearchOpsQueueStage,
  instrument: Instrument,
  timeframe: Timeframe,
  run: ResearchRunAudit | null,
  cache: WatchlistCacheRefreshItemSnapshot | null,
  cacheIssue: string
): string {
  const context = `${instrument.symbol} · ${timeframe}`;
  if (stage === "needs_data") {
    return `${context}: ${cacheIssue}`;
  }
  if (stage === "ready_for_pipeline") {
    const rows = Math.max(0, cache?.quality.rows ?? cache?.upsertedRows ?? 0);
    const source = cache?.quality.source || "unknown";
    return `${context}: ${source} cache ready with ${rows} rows; audited pipeline can run.`;
  }
  if (stage === "needs_ai_review") {
    return `${context}: audited run ${run?.runId ?? "unknown"} is ready for evidence-bound AI review.`;
  }
  return `${context}: AI-reviewed run ${run?.runId ?? "unknown"} is ready for production handoff review.`;
}

export function researchOpsQueueSort(left: ResearchOpsQueueRow, right: ResearchOpsQueueRow): number {
  const stagePriority: Record<ResearchOpsQueueStage, number> = {
    needs_data: 0,
    ready_for_pipeline: 1,
    needs_ai_review: 2,
    paper_candidate: 3
  };
  const priorityDelta = stagePriority[left.stage] - stagePriority[right.stage];
  if (priorityDelta !== 0) {
    return priorityDelta;
  }
  if (left.selected !== right.selected) {
    return left.selected ? -1 : 1;
  }
  return left.symbol.localeCompare(right.symbol);
}

export function buildResearchOpsQueueSummary(rows: ResearchOpsQueueRow[]): ResearchOpsQueueSummary {
  const needsDataCount = rows.filter((row) => row.stage === "needs_data").length;
  const readyForPipelineCount = rows.filter((row) => row.stage === "ready_for_pipeline").length;
  const needsAiReviewCount = rows.filter((row) => row.stage === "needs_ai_review").length;
  const paperCandidateCount = rows.filter((row) => row.stage === "paper_candidate").length;
  const tone: ResearchOpsQueueSummary["tone"] =
    needsDataCount > 0 ? "warning" : readyForPipelineCount + needsAiReviewCount + paperCandidateCount > 0 ? "positive" : "neutral";
  return {
    total: rows.length,
    needsDataCount,
    readyForPipelineCount,
    needsAiReviewCount,
    paperCandidateCount,
    headline: `${rows.length} watched research tasks`,
    detail: `${needsDataCount} need data · ${readyForPipelineCount} ready for pipeline · ${needsAiReviewCount} need AI review · ${paperCandidateCount} reviewed candidates`,
    tone
  };
}

export function buildPortfolioRiskRows(workspace: TerminalWorkspace): PortfolioRiskRow[] {
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  return [
    {
      id: "paper-exposure",
      label: "Paper exposure",
      value: `${workspace.watchlist.length} watched`,
      detail: "No certified live positions are connected in this workspace.",
      tone: "neutral"
    },
    {
      id: "selected-risk",
      label: "Selected instrument",
      value: workspace.selectedInstrument.symbol,
      detail: `${workspace.selectedInstrument.symbol} remains paper-only until a fresh audited run passes gates.`,
      tone: workspace.selectedInstrument.changePct < 0 ? "warning" : "positive"
    },
    {
      id: "live-gates",
      label: "Live gates",
      value: workspace.execution.liveEnabled ? "open" : `${blockedGateCount} blocked`,
      detail: workspace.execution.liveEnabled
        ? "Execution adapter reports live trading enabled."
        : "Adapter certification, risk approval, and human confirmation are required.",
      tone: workspace.execution.liveEnabled ? "positive" : "warning"
    }
  ];
}

export function buildPortfolioBacktestDraft(
  runs: ResearchRunAudit[],
  currentRunId: string | null | undefined
): PortfolioBacktestDraft {
  const current = currentRunId ? runs.find((run) => run.runId === currentRunId) : undefined;
  if (!current) {
    return blockedPortfolioBacktestDraft("Portfolio backtest blocked", "Run at least one audited research pipeline first.");
  }
  const currentEquityCurve = current.backtestEquityCurve;
  if (!Array.isArray(currentEquityCurve) || currentEquityCurve.length === 0) {
    return blockedPortfolioBacktestDraft(
      "Portfolio backtest blocked",
      "Run at least one audited research pipeline with an equity curve first."
    );
  }

  const candidates = runs
    .filter(
      (run) =>
        run.market === current.market &&
        run.timeframe === current.timeframe &&
        Array.isArray(run.backtestEquityCurve) &&
        hasAlignedEquityTimestamps(currentEquityCurve, run.backtestEquityCurve)
    )
    .sort((left, right) => timestampSortValue(right.createdAt) - timestampSortValue(left.createdAt));

  const selected = [
    current,
    ...candidates.filter(
      (run, index) =>
        run.runId !== current.runId &&
        run.symbol !== current.symbol &&
        candidates.findIndex((candidate) => candidate.symbol === run.symbol) === index
    )
  ].slice(0, 3);

  if (selected.length < 2) {
    return blockedPortfolioBacktestDraft(
      "Portfolio backtest needs peers",
      "Need at least two audited runs from the same market and timeframe with aligned equity curves."
    );
  }

  const peerWeight = selected.length > 1 ? roundWeight(0.4 / (selected.length - 1)) : 0;
  const weights = selected.map((run, index) => (index === 0 ? 0.5 : peerWeight));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const cashWeight = roundWeight(Math.max(0, 1 - totalWeight));
  const rows = selected.map((run, index) => ({
    runId: run.runId,
    symbol: run.symbol,
    targetWeight: weights[index],
    weightLabel: formatWeightLabel(weights[index]),
    strategyRevision: run.strategyRevision,
    totalReturnPct: formatMetricPercent(run.metrics, "total_return_pct", "totalReturnPct"),
    maxDrawdownPct: formatMetricPercent(run.metrics, "max_drawdown_pct", "maxDrawdownPct"),
    current: run.runId === current.runId
  }));

  return {
    status: "ready",
    headline: "Portfolio backtest ready",
    summary: `${selected.length} audited runs from ${current.market} ${current.timeframe}; cash buffer ${formatWeightLabel(cashWeight)}.`,
    cashWeight,
    request: {
      name: `${current.market} ${current.timeframe} audited basket`,
      initialCash: current.backtestAssumptions?.initialCash ?? 100000,
      legs: selected.map((run, index) => ({ runId: run.runId, targetWeight: weights[index] }))
    },
    rows
  };
}

export function buildPortfolioPeerAuditPlan(
  workspace: TerminalWorkspace,
  runs: ResearchRunAudit[]
): PortfolioPeerAuditPlan {
  const market = workspace.selectedInstrument.market;
  const timeframe = workspace.selectedTimeframe;
  const sameMarketWatchlist = [
    workspace.selectedInstrument,
    ...workspace.watchlist,
    ...runs
      .filter((run) => run.market === market && run.timeframe === timeframe)
      .map(
        (run) =>
          buildInstrumentFromSymbol(run.market, run.symbol) ?? {
            market: run.market,
            symbol: run.symbol,
            name: run.symbol,
            changePct: 0,
            price: null
          }
      )
  ]
    .filter((instrument) => instrument.market === market)
    .filter(
      (instrument, index, instruments) =>
        instruments.findIndex((candidate) => candidate.symbol === instrument.symbol && candidate.market === instrument.market) === index
    )
    .slice(0, 4);

  if (!workspace.researchRun?.runId) {
    return {
      status: "blocked",
      headline: "Peer audit blocked",
      summary: "Run the selected instrument pipeline before preparing portfolio peers.",
      auditedCount: 0,
      missingCount: sameMarketWatchlist.length,
      candidates: sameMarketWatchlist.map((instrument) => ({
        market: instrument.market,
        symbol: instrument.symbol,
        name: instrument.name,
        timeframe,
        status: "missing",
        runId: null
      }))
    };
  }

  const auditedBySymbol = new Map<string, ResearchRunAudit>();
  const currentEquityCurve = workspace.backtestEquityCurve ?? [];
  for (const run of runs) {
    if (
      run.market === market &&
      run.timeframe === timeframe &&
      Array.isArray(run.backtestEquityCurve) &&
      hasAlignedEquityTimestamps(currentEquityCurve, run.backtestEquityCurve) &&
      !auditedBySymbol.has(run.symbol)
    ) {
      auditedBySymbol.set(run.symbol, run);
    }
  }

  const candidates: PortfolioPeerAuditCandidate[] = sameMarketWatchlist.map((instrument) => {
    const auditedRun = auditedBySymbol.get(instrument.symbol);
    return {
      market: instrument.market,
      symbol: instrument.symbol,
      name: instrument.name,
      timeframe,
      status: auditedRun ? "audited" : "missing",
      runId: auditedRun?.runId ?? null
    };
  });
  const auditedCount = candidates.filter((candidate) => candidate.status === "audited").length;
  const missingCount = candidates.filter((candidate) => candidate.status === "missing").length;

  if (auditedCount >= 2) {
    return {
      status: "complete",
      headline: "Peer audits complete",
      summary: `${auditedCount} audited portfolio legs are ready for a static-weight portfolio backtest.`,
      auditedCount,
      missingCount,
      candidates
    };
  }

  return {
    status: missingCount > 0 ? "ready" : "blocked",
    headline: missingCount > 0 ? "Peer audits available" : "Peer audit blocked",
    summary:
      missingCount > 0
        ? `${missingCount} peer audit${missingCount === 1 ? "" : "s"} can be generated from the current watchlist.`
        : "Add another same-market watchlist instrument before preparing a portfolio backtest.",
    auditedCount,
    missingCount,
    candidates
  };
}

export function hasAlignedEquityTimestamps(
  reference: readonly BacktestEquityPoint[],
  candidate: readonly BacktestEquityPoint[] | undefined
): boolean {
  return Boolean(
    candidate &&
      reference.length > 0 &&
      candidate.length === reference.length &&
      candidate.every((point, index) => point.timestamp === reference[index]?.timestamp)
  );
}

export function buildPortfolioBacktestDiagnosticRows<T extends PortfolioBacktestDiagnosticInput>(
  portfolio: T | null | undefined
): PortfolioBacktestDiagnosticRow[] {
  if (!portfolio || !portfolio.legs.length) {
    return [];
  }

  const largestLeg = [...portfolio.legs].sort((left, right) => right.targetWeight - left.targetWeight)[0];
  const concentrationStatus =
    largestLeg.targetWeight >= 0.75 ? "blocked" : largestLeg.targetWeight > 0.5 ? "review" : "passed";
  const concentrationDetail =
    concentrationStatus === "passed"
      ? "Largest leg remains under the 50% concentration review threshold."
      : concentrationStatus === "blocked"
        ? "Largest leg exceeds the 75% hard concentration threshold."
        : "Largest leg exceeds the 50% concentration review threshold.";

  const cashStatus = portfolio.cashWeight > 0.3 || portfolio.cashWeight < 0.02 ? "review" : "passed";
  const cashDetail =
    portfolio.cashWeight > 0.3
      ? "Cash buffer is high, so the basket may be under-invested."
      : portfolio.cashWeight < 0.02
        ? "Cash buffer is thin; execution slippage or round lots may need review."
        : "Cash buffer is inside the static-weight review band.";

  const grossExposure = portfolio.legs.reduce((sum, leg) => sum + leg.targetWeight, 0);
  const exposureStatus: PortfolioBacktestDiagnosticStatus =
    grossExposure > 1.0001 ? "blocked" : grossExposure >= 0.98 || grossExposure < 0.65 ? "review" : "passed";
  const exposureDetail =
    exposureStatus === "blocked"
      ? "Gross target exposure exceeds 100%; the basket cannot be promoted without resizing."
      : grossExposure >= 0.98
        ? "Gross target exposure is near fully invested; cash/slippage buffer needs review."
        : grossExposure < 0.65
          ? "Gross target exposure is low, so the basket may be under-invested."
          : "Gross target exposure leaves a cash/slippage buffer.";

  const driftReview = buildPortfolioRebalanceDriftReview(portfolio);
  const riskContributionReview = buildPortfolioRiskContributionReview(portfolio);
  const covarianceRiskReview = buildPortfolioCovarianceRiskReview(portfolio);
  const correlationReview = buildPortfolioCorrelationReview(portfolio);

  const negativeLegs = portfolio.legs.filter((leg) => leg.contributionValue < 0);
  const worstLeg = negativeLegs.sort((left, right) => left.contributionReturnPct - right.contributionReturnPct)[0];
  const negativeStatus = worstLeg ? "review" : "passed";
  const negativeValue = worstLeg
    ? `${worstLeg.symbol} ${formatDiagnosticPercent(worstLeg.contributionReturnPct)}`
    : "none";

  const warnings = [
    ...portfolio.dataQuality.warnings,
    ...portfolio.legs.flatMap((leg) => leg.dataQuality.warnings.map((warning) => `${leg.symbol}: ${warning}`))
  ].filter((warning, index, items) => items.indexOf(warning) === index);
  const incompleteLegs = portfolio.legs.filter((leg) => !leg.dataQuality.isComplete).map((leg) => leg.symbol);
  const dataQualityStatus: PortfolioBacktestDiagnosticStatus = !portfolio.dataQuality.isComplete
    ? "blocked"
    : warnings.length
      ? "review"
      : "passed";
  const dataQualityValue =
    dataQualityStatus === "blocked" ? "incomplete" : warnings.length ? `${warnings.length} warning${warnings.length === 1 ? "" : "s"}` : "complete";
  const dataQualityDetail =
    dataQualityStatus === "blocked"
      ? `Portfolio data quality is incomplete${incompleteLegs.length ? ` for ${incompleteLegs.join(", ")}` : ""}: ${
          warnings.slice(0, 3).join("; ") || "review source completeness before promotion"
        }.`
      : warnings.length
        ? `Portfolio data quality has warnings: ${warnings.slice(0, 3).join("; ")}.`
        : "Portfolio composite data quality is complete.";

  return [
    {
      id: "concentration",
      label: "Concentration",
      value: `${largestLeg.symbol} ${formatDiagnosticWeight(largestLeg.targetWeight)}`,
      detail: concentrationDetail,
      status: concentrationStatus,
      tone: diagnosticTone(concentrationStatus)
    },
    {
      id: "cash-buffer",
      label: "Cash buffer",
      value: formatDiagnosticWeight(portfolio.cashWeight),
      detail: cashDetail,
      status: cashStatus,
      tone: diagnosticTone(cashStatus)
    },
    {
      id: "exposure-utilization",
      label: "Gross exposure",
      value: formatDiagnosticWeight(grossExposure),
      detail: exposureDetail,
      status: exposureStatus,
      tone: diagnosticTone(exposureStatus)
    },
    {
      id: "rebalance-drift",
      label: "Rebalance drift",
      value: driftReview.value,
      detail: driftReview.detail,
      status: driftReview.status,
      tone: diagnosticTone(driftReview.status)
    },
    {
      id: "risk-contribution",
      label: "Risk contribution",
      value: riskContributionReview.value,
      detail: riskContributionReview.detail,
      status: riskContributionReview.status,
      tone: diagnosticTone(riskContributionReview.status)
    },
    ...(covarianceRiskReview
      ? [
          {
            id: "covariance-risk" as const,
            label: "Covariance risk",
            value: covarianceRiskReview.value,
            detail: covarianceRiskReview.detail,
            status: covarianceRiskReview.status,
            tone: diagnosticTone(covarianceRiskReview.status)
          }
        ]
      : []),
    {
      id: "correlation-risk",
      label: "Correlation risk",
      value: correlationReview.value,
      detail: correlationReview.detail,
      status: correlationReview.status,
      tone: diagnosticTone(correlationReview.status)
    },
    {
      id: "negative-contribution",
      label: "Negative contribution",
      value: negativeValue,
      detail: worstLeg
        ? `${worstLeg.symbol} has negative contribution in the audited portfolio backtest.`
        : "No negative contribution leg in the audited portfolio backtest.",
      status: negativeStatus,
      tone: diagnosticTone(negativeStatus)
    },
    {
      id: "data-quality",
      label: "Data quality",
      value: dataQualityValue,
      detail: dataQualityDetail,
      status: dataQualityStatus,
      tone: diagnosticTone(dataQualityStatus)
    }
  ];
}

export function buildPortfolioPaperOrderLifecycleRows(
  batches: PortfolioPaperOrderBatchSnapshot[] | null | undefined,
  lifecycleRows: PortfolioPaperOrderLifecycleSnapshot[] = []
): PortfolioPaperOrderLifecycleRow[] {
  const lifecycleByBatch = portfolioPaperOrderLifecycleRowsByBatch(lifecycleRows);
  return [...(batches ?? [])]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((batch) => {
      const pending = batch.summary.statusCounts.pending_review ?? 0;
      const rejected = batch.summary.statusCounts.rejected ?? 0;
      const skipped = batch.summary.statusCounts.skipped ?? 0;
      const blockedRisk = batch.summary.riskStatusCounts.blocked ?? 0;
      const reviewRisk = batch.summary.riskStatusCounts.review ?? 0;
      const lifecycleStateCounts =
        portfolioPaperOrderLifecycleStateCountsFromRows(lifecycleByBatch.get(batch.batchId)) ??
        batch.summary.lifecycleStateCounts ??
        portfolioPaperOrderLifecycleStateCounts(batch);
      const routableOrders = batch.summary.routableOrders ?? lifecycleStateCounts.ready_for_simulation ?? 0;
      const status: PortfolioPaperOrderLifecycleRow["status"] =
        (lifecycleStateCounts.awaiting_operator_review ?? 0) > 0 || (lifecycleStateCounts.risk_review ?? 0) > 0 || reviewRisk > 0
          ? "review"
          : rejected > 0 || blockedRisk > 0 || (lifecycleStateCounts.risk_rejected ?? 0) > 0 || (lifecycleStateCounts.operator_rejected ?? 0) > 0
            ? "blocked"
            : "ready";

      return {
        id: batch.batchId,
        portfolioName: batch.portfolioName,
        batchId: batch.batchId,
        baseRunId: batch.baseRunId,
        createdAt: batch.createdAt,
        orderCount: batch.summary.totalOrders,
        notionalValue: batch.summary.totalNotionalValue,
        status,
        statusLabel: [
          pending > 0 ? `${pending} review` : null,
          rejected > 0 ? `${rejected} rejected` : null,
          skipped > 0 ? `${skipped} skipped` : null
        ]
          .filter((item): item is string => Boolean(item))
          .join(" / "),
        executionStateLabel: portfolioPaperOrderExecutionStateLabel(lifecycleStateCounts),
        routableOrders,
        auditEventId: `portfolio-paper-order-batch-${batch.batchId}`,
        detail: `${batch.summary.totalOrders} paper-only candidates · ${batch.summary.totalNotionalValue} notional · source ${batch.source}`,
        tone: status === "ready" ? "positive" : status === "blocked" ? "risk" : "warning"
      };
    });
}

export function buildPortfolioPaperOrderApprovalRows(
  batches: PortfolioPaperOrderBatchSnapshot[] | null | undefined,
  lifecycleRows: PortfolioPaperOrderLifecycleSnapshot[] = []
): PortfolioPaperOrderApprovalRow[] {
  const lifecycleByOrder = portfolioPaperOrderLifecycleRowsByOrder(lifecycleRows);
  return [...(batches ?? [])]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .flatMap((batch) =>
      batch.orders.map((order) => {
        const lifecycle = lifecycleByOrder.get(`${batch.batchId}:${order.orderId}`) ?? inferPortfolioPaperOrderLifecycle(batch, order);
        return {
          id: `${batch.batchId}:${order.orderId}`,
          portfolioName: batch.portfolioName,
          batchId: batch.batchId,
          baseRunId: batch.baseRunId,
          orderId: order.orderId,
          symbol: order.symbol,
          side: order.side,
          quantity: lifecycle.quantity,
          notionalValue: lifecycle.notionalValue,
          riskStatus: lifecycle.riskStatus,
          state: lifecycle.state,
          canApprove: lifecycle.state === "awaiting_operator_review",
          canReject: lifecycle.state === "awaiting_operator_review" || lifecycle.state === "risk_review",
          approvedBy: lifecycle.approvedBy,
          reviewedAt: lifecycle.reviewedAt,
          actionHint: portfolioPaperOrderApprovalActionHint(lifecycle),
          tone: portfolioPaperOrderApprovalTone(lifecycle.state)
        };
      })
    );
}

export function portfolioPaperOrderApprovalResultCarriesLockedLedgerState(
  result: PortfolioPaperOrderApprovalLockedLedgerStateResult
): boolean {
  return (
    result.error === "portfolio_paper_order_approval_locked_after_simulation" &&
    result.approval === undefined &&
    Boolean(result.approvals?.length) &&
    Boolean(result.lifecycle?.length)
  );
}

export function buildPortfolioPaperOrderApprovalLockedLedgerMessage(
  result: PortfolioPaperOrderApprovalLockedLedgerStateResult
): string {
  if (
    result.error !== "portfolio_paper_order_approval_locked_after_simulation" ||
    !result.existingApproval ||
    !result.existingSimulation
  ) {
    return result.error ?? "Portfolio paper order approval failed";
  }
  const simulation = result.existingSimulation;
  const approval = result.existingApproval;
  return [
    `Approval locked: order ${simulation.orderId} already has filled simulation ${simulation.simulationId}`,
    `${simulation.side} ${simulation.quantity} @ ${simulation.fillPrice.toFixed(2)}`,
    `simulated ${simulation.simulatedAt}`,
    `existing approval by ${approval.reviewer} at ${approval.reviewedAt}.`
  ].join(" · ");
}

export function portfolioPaperOrderLifecycleStateCounts(batch: PortfolioPaperOrderBatchSnapshot): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const order of batch.orders) {
    const state =
      order.status === "skipped" || order.side === "hold"
        ? "skipped"
        : order.status === "rejected" || order.riskStatus === "blocked"
          ? "risk_rejected"
          : "awaiting_operator_review";
    counts[state] = (counts[state] ?? 0) + 1;
  }
  return counts;
}

export function portfolioPaperOrderLifecycleRowsByBatch(
  rows: PortfolioPaperOrderLifecycleSnapshot[]
): Map<string, PortfolioPaperOrderLifecycleSnapshot[]> {
  const byBatch = new Map<string, PortfolioPaperOrderLifecycleSnapshot[]>();
  for (const row of rows) {
    byBatch.set(row.batchId, [...(byBatch.get(row.batchId) ?? []), row]);
  }
  return byBatch;
}

export function portfolioPaperOrderLifecycleRowsByOrder(
  rows: PortfolioPaperOrderLifecycleSnapshot[]
): Map<string, PortfolioPaperOrderLifecycleSnapshot> {
  return new Map(rows.map((row) => [`${row.batchId}:${row.orderId}`, row]));
}

export function portfolioPaperOrderLifecycleStateCountsFromRows(
  rows: PortfolioPaperOrderLifecycleSnapshot[] | undefined
): Record<string, number> | null {
  if (!rows?.length) {
    return null;
  }
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.state] = (counts[row.state] ?? 0) + 1;
  }
  return counts;
}

export function inferPortfolioPaperOrderLifecycle(
  batch: PortfolioPaperOrderBatchSnapshot,
  order: PortfolioPaperOrderBatchSnapshot["orders"][number]
): PortfolioPaperOrderLifecycleSnapshot {
  const state =
    order.status === "skipped" || order.side === "hold"
      ? "skipped"
      : order.status === "rejected" || order.riskStatus === "blocked"
        ? "risk_rejected"
        : "awaiting_operator_review";
  return {
    batchId: batch.batchId,
    baseRunId: batch.baseRunId,
    portfolioName: batch.portfolioName,
    orderId: order.orderId,
    symbol: order.symbol,
    sourceRunId: order.sourceRunId,
    side: order.side,
    quantity: order.quantity,
    notionalValue: order.notionalValue,
    originalStatus: order.status,
    riskStatus: order.riskStatus,
    state,
    routable: false,
    paperOnly: true,
    liveExecutionBlocked: true,
    approvedBy: null,
    reviewedAt: null,
    reason: order.reason
  };
}

export function portfolioPaperOrderApprovalActionHint(row: PortfolioPaperOrderLifecycleSnapshot): string {
  if (row.state === "ready_for_simulation") {
    return `Approved by ${row.approvedBy ?? "operator"}; ready for paper simulation.`;
  }
  if (row.state === "operator_rejected") {
    return `Operator rejected this paper-only order: ${row.reason}`;
  }
  if (row.state === "risk_rejected") {
    return `Risk rejected this paper-only order: ${row.reason}`;
  }
  if (row.state === "skipped") {
    return "No paper order action is required for this row.";
  }
  if (row.state === "invalid_order") {
    return `Invalid paper order: ${row.reason}`;
  }
  if (row.state === "risk_review") {
    return "Risk review is still required before this approved order can be simulated.";
  }
  return "Operator approval or rejection is required before this paper-only order can move on.";
}

export function portfolioPaperOrderApprovalTone(state: PortfolioPaperOrderLifecycleSnapshot["state"]): PortfolioPaperOrderApprovalRow["tone"] {
  if (state === "ready_for_simulation") {
    return "positive";
  }
  if (state === "risk_rejected" || state === "operator_rejected" || state === "invalid_order") {
    return "risk";
  }
  if (state === "awaiting_operator_review" || state === "risk_review") {
    return "warning";
  }
  return "neutral";
}

export function portfolioPaperOrderExecutionStateLabel(counts: Record<string, number>): string {
  return [
    ["ready_for_simulation", "ready for simulation"],
    ["awaiting_operator_review", "awaiting review"],
    ["risk_review", "risk review"],
    ["risk_rejected", "risk rejected"],
    ["operator_rejected", "operator rejected"],
    ["invalid_order", "invalid"],
    ["skipped", "skipped"]
  ]
    .map(([state, label]) => {
      const count = counts[state] ?? 0;
      return count > 0 ? `${count} ${label}` : null;
    })
    .filter((item): item is string => Boolean(item))
    .join(" / ");
}
