import { buildAiReviewDossier } from "../ai-review/report-builders";
import type { PortfolioBacktestDiagnosticInput, PortfolioBacktestDiagnosticRow, PortfolioBacktestDiagnosticStatus, PortfolioBacktestDraft, PortfolioBacktestReportInput, PortfolioBacktestReportOptions, RiskApprovalGate, RiskApprovalStatus, RiskApprovalSummary } from "../audit/execution-contracts";
import type { TerminalWorkspace } from "../core/workspace-contracts";
import { buildPortfolioBacktestDiagnosticRows } from "./risk-and-ops-builders";
import type { ResearchRunSummary } from "../stage1/archive-contracts";
import type { StrategyRuleDraft } from "../stage1/review-contracts";
import { formatPercentValue, formatWarningCount, markdownTable, metricValue, parsePercentMetric } from "../strategy/backtest-builders";
import { buildResearchRunContextBinding, buildStrategyRuleDraft } from "../strategy/experiment-builders";

export function buildPortfolioBacktestReportMarkdown<T extends PortfolioBacktestReportInput>(
  portfolio: T | null | undefined,
  draft?: PortfolioBacktestDraft | null,
  options: PortfolioBacktestReportOptions = {}
): string | null {
  if (!portfolio) {
    return null;
  }

  const runIdBySymbol = new Map((draft?.rows ?? []).map((row) => [row.symbol, row.runId]));
  const diagnostics = buildPortfolioBacktestDiagnosticRows(portfolio);
  const metricRows = [
    ["Total return", formatReportPercent(portfolio.metrics.totalReturnPct)],
    ["Annual return", formatReportPercent(portfolio.metrics.annualReturnPct)],
    ["Max drawdown", formatReportPercent(portfolio.metrics.maxDrawdownPct)],
    ["Win rate", formatReportPercent(portfolio.metrics.winRatePct)],
    ["Profit factor", formatReportNumber(portfolio.metrics.profitFactor)],
    ["Trade count", portfolio.metrics.tradeCount],
    ["Cash weight", formatReportPercent(portfolio.cashWeight * 100)],
    ["Equity points", portfolio.equityCurve.length]
  ];
  const diagnosticRows = diagnostics.map((row) => [row.label, row.value, row.status, row.detail]);
  const legRows = portfolio.legs.map((leg) => [
    leg.symbol,
    runIdBySymbol.get(leg.symbol) ?? "unknown",
    formatDiagnosticWeight(leg.targetWeight),
    formatReportNumber(leg.contributionValue),
    formatReportPercent(leg.contributionReturnPct),
    formatReportPercent(leg.maxDrawdownPct),
    leg.tradeCount,
    leg.dataQuality.isComplete ? "complete" : "incomplete",
    leg.dataQuality.warnings.join("; ")
  ]);
  const allocationRows = (portfolio.allocationEvents ?? []).map((event) => [
    event.timestamp,
    event.eventType,
    event.symbol,
    event.sourceRunId ?? "-",
    formatDiagnosticWeight(event.targetWeight),
    formatReportNumber(event.notionalValue),
    event.reason
  ]);
  const rebalanceRows = (portfolio.rebalanceEvents ?? []).map((event) => [
    event.timestamp,
    event.symbol,
    event.sourceRunId ?? "-",
    formatDiagnosticWeight(event.targetWeight),
    formatDiagnosticWeight(event.endingWeight),
    formatReportNumber(event.deltaValue),
    event.status,
    event.reason
  ]);
  const tradeReviewRows = (portfolio.tradeReviewEvents ?? []).map((event) => [
    event.timestamp,
    event.symbol,
    event.sourceRunId ?? "-",
    event.side,
    formatReportNumber(event.notionalValue),
    formatDiagnosticWeight(event.targetWeight),
    formatDiagnosticWeight(event.endingWeight),
    event.status,
    event.reason
  ]);
  const preTradeRiskRows = (portfolio.preTradeRiskChecks ?? []).map((check) => [
    check.timestamp,
    check.scope,
    check.symbol ?? "-",
    check.sourceRunId ?? "-",
    check.checkId,
    check.status,
    formatReportNumber(check.value),
    formatReportNumber(check.limit),
    check.reason
  ]);
  const paperOrderRows = (portfolio.paperOrderEvents ?? []).map((event) => [
    event.timestamp,
    event.orderId,
    event.symbol,
    event.sourceRunId ?? "-",
    event.side,
    formatReportNumber(event.notionalValue),
    formatReportNumber(event.quantity),
    event.status,
    event.riskStatus,
    event.reason
  ]);
  const covarianceSummaryRows = portfolio.covarianceRisk
    ? [
        ["Method", portfolio.covarianceRisk.method],
        ["Observations", portfolio.covarianceRisk.observations],
        ["Portfolio period volatility", formatReportPercent(portfolio.covarianceRisk.periodVolatilityPct)],
        ["Portfolio annualized volatility", formatReportPercent(portfolio.covarianceRisk.annualizedVolatilityPct)]
      ]
    : [];
  const covarianceContributionRows = (portfolio.covarianceRisk?.contributions ?? []).map((contribution) => [
    contribution.symbol,
    contribution.sourceRunId ?? "-",
    formatDiagnosticWeight(contribution.targetWeight),
    formatReportPercent(contribution.annualizedVolatilityPct),
    formatReportPercent(contribution.marginalContributionPct),
    formatReportPercent(contribution.contributionPct)
  ]);

  return [
    "# AIQuant Portfolio Backtest Report",
    "",
    `Portfolio: \`${portfolio.name}\``,
    `Market: \`${portfolio.market}\``,
    `Timeframe: \`${portfolio.timeframe}\``,
    `Initial cash: \`${formatReportNumber(portfolio.initialCash)}\``,
    `Generated at: \`${options.generatedAt ?? new Date().toISOString()}\``,
    "",
    "## Summary",
    "",
    "Static-weight portfolio report built from already audited single-symbol backtest evidence.",
    "",
    "## Metrics",
    "",
    markdownTable(["Metric", "Value"], metricRows),
    "",
    "## Diagnostics",
    "",
    markdownTable(["Diagnostic", "Value", "Status", "Detail"], diagnosticRows),
    "",
    "## Legs",
    "",
    markdownTable(
      ["Symbol", "Run ID", "Weight", "Contribution value", "Contribution return", "Max drawdown", "Trades", "Data quality", "Warnings"],
      legRows
    ),
    "",
    "## Covariance Risk",
    "",
    covarianceSummaryRows.length
      ? [
          markdownTable(["Field", "Value"], covarianceSummaryRows),
          "",
          markdownTable(
            ["Symbol", "Run ID", "Target weight", "Annualized volatility", "Marginal contribution", "Contribution share"],
            covarianceContributionRows
          )
        ].join("\n")
      : "No covariance risk summary is attached to this portfolio run.",
    "",
    "## Allocation Ledger",
    "",
    allocationRows.length
      ? markdownTable(["Timestamp", "Event", "Symbol", "Run ID", "Weight", "Notional", "Reason"], allocationRows)
      : "No static allocation ledger is attached to this portfolio run.",
    "",
    "## Rebalance Review Ledger",
    "",
    rebalanceRows.length
      ? markdownTable(["Timestamp", "Symbol", "Run ID", "Target weight", "Ending weight", "Delta value", "Status", "Reason"], rebalanceRows)
      : "No rebalance review ledger is attached to this portfolio run.",
    "",
    "## Trade Review Ledger",
    "",
    tradeReviewRows.length
      ? markdownTable(
          ["Timestamp", "Symbol", "Run ID", "Side", "Notional", "Target weight", "Ending weight", "Status", "Reason"],
          tradeReviewRows
        )
      : "No trade review ledger is attached to this portfolio run.",
    "",
    "## Pre-Trade Risk Checks",
    "",
    preTradeRiskRows.length
      ? markdownTable(
          ["Timestamp", "Scope", "Symbol", "Run ID", "Check", "Status", "Value", "Limit", "Reason"],
          preTradeRiskRows
        )
      : "No pre-trade risk checks are attached to this portfolio run.",
    "",
    "## Portfolio Paper Orders",
    "",
    paperOrderRows.length
      ? markdownTable(
          ["Timestamp", "Order ID", "Symbol", "Run ID", "Side", "Notional", "Quantity", "Status", "Risk", "Reason"],
          paperOrderRows
        )
      : "No portfolio paper order events are attached to this portfolio run.",
    "",
    "## Composite Data Quality",
    "",
    markdownTable(
      ["Field", "Value"],
      [
        ["Source", portfolio.dataQuality.source],
        ["Complete", portfolio.dataQuality.isComplete],
        ["Rows", portfolio.dataQuality.rows],
        ["Warnings", portfolio.dataQuality.warnings.join("; ")]
      ]
    ),
    "",
    "## Evidence Boundary",
    "",
    "This report uses historical audited portfolio evidence only. It does not rebalance, optimize allocations, route orders, or certify live trading readiness.",
    "",
    "No investment advice. No guaranteed outcome."
  ].join("\n");
}

export function blockedPortfolioBacktestDraft(headline: string, summary: string): PortfolioBacktestDraft {
  return {
    status: "blocked",
    headline,
    summary,
    cashWeight: 1,
    request: null,
    rows: []
  };
}

export function roundWeight(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function formatWeightLabel(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDiagnosticWeight(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDiagnosticPointDrift(value: number): string {
  if (!Number.isFinite(value)) {
    return "n/a";
  }
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}pp`;
}

export function formatDiagnosticPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatReportPercent(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : "N/A";
}

export function formatReportNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "N/A";
}

export function diagnosticTone(status: PortfolioBacktestDiagnosticStatus): PortfolioBacktestDiagnosticRow["tone"] {
  if (status === "passed") {
    return "positive";
  }
  return status === "blocked" ? "risk" : "warning";
}

export function buildPortfolioRebalanceDriftReview<T extends PortfolioBacktestDiagnosticInput>(portfolio: T): {
  value: string;
  detail: string;
  status: PortfolioBacktestDiagnosticStatus;
} {
  const endingPortfolioValue = portfolioEndingValue(portfolio);
  if (!endingPortfolioValue) {
    return {
      value: "n/a",
      detail: "Ending weights are unavailable; run a portfolio backtest before rebalance drift review.",
      status: "review"
    };
  }

  const drifts = portfolio.legs
    .filter((leg) => Number.isFinite(leg.endingValue) && (leg.endingValue ?? 0) > 0)
    .map((leg) => ({
      symbol: leg.symbol,
      drift: (leg.endingValue ?? 0) / endingPortfolioValue - leg.targetWeight
    }));

  if (!drifts.length) {
    return {
      value: "n/a",
      detail: "Ending leg values are unavailable; run a portfolio backtest before rebalance drift review.",
      status: "review"
    };
  }

  const rankedDrifts = drifts.sort((left, right) => Math.abs(right.drift) - Math.abs(left.drift));
  const largestDrift = rankedDrifts[0];
  const absoluteDrift = Math.abs(largestDrift.drift);
  const status: PortfolioBacktestDiagnosticStatus = absoluteDrift >= 0.1 ? "blocked" : absoluteDrift > 0.02 ? "review" : "passed";
  const detail =
    status === "blocked"
      ? "Largest end-weight drift exceeds the 10pp hard rebalance threshold."
      : status === "review"
        ? "Largest end-weight drift exceeds the 2pp rebalance review threshold."
        : "Largest end-weight drift remains inside the 2pp rebalance review threshold.";

  return {
    value: `${largestDrift.symbol} ${formatDiagnosticPointDrift(largestDrift.drift)}`,
    detail,
    status
  };
}

export function portfolioEndingValue<T extends PortfolioBacktestDiagnosticInput>(portfolio: T): number | null {
  const lastEquity = portfolio.equityCurve?.at(-1)?.equity;
  if (Number.isFinite(lastEquity) && (lastEquity ?? 0) > 0) {
    return lastEquity ?? null;
  }

  const legEndingValue = portfolio.legs.reduce((sum, leg) => sum + (Number.isFinite(leg.endingValue) ? (leg.endingValue ?? 0) : 0), 0);
  if (legEndingValue <= 0) {
    return null;
  }

  const cashValue = Number.isFinite(portfolio.initialCash) ? (portfolio.initialCash ?? 0) * portfolio.cashWeight : 0;
  return legEndingValue + Math.max(0, cashValue);
}

export function buildPortfolioRiskContributionReview<T extends PortfolioBacktestDiagnosticInput>(portfolio: T): {
  value: string;
  detail: string;
  status: PortfolioBacktestDiagnosticStatus;
} {
  const riskBudgets = portfolio.legs
    .map((leg) => ({
      symbol: leg.symbol,
      riskBudget: Math.abs(leg.maxDrawdownPct) * leg.targetWeight
    }))
    .filter((row) => Number.isFinite(row.riskBudget) && row.riskBudget > 0);

  const totalRiskBudget = riskBudgets.reduce((sum, row) => sum + row.riskBudget, 0);
  if (!riskBudgets.length || totalRiskBudget <= 0) {
    return {
      value: "n/a",
      detail: "Leg drawdown evidence is unavailable; risk-budget contribution needs review.",
      status: "review"
    };
  }

  const largest = riskBudgets.sort((left, right) => right.riskBudget - left.riskBudget)[0];
  const contributionShare = largest.riskBudget / totalRiskBudget;
  const status: PortfolioBacktestDiagnosticStatus =
    contributionShare >= 0.75 ? "blocked" : contributionShare > 0.6 ? "review" : "passed";
  const detail =
    status === "blocked"
      ? "Largest risk-budget contribution exceeds the 75% hard concentration threshold."
      : status === "review"
        ? "Largest risk-budget contribution exceeds the 60% review threshold."
        : "Largest risk-budget contribution remains inside the 60% review threshold.";

  return {
    value: `${largest.symbol} ${formatDiagnosticWeight(contributionShare)}`,
    detail,
    status
  };
}

export function buildPortfolioCovarianceRiskReview<T extends PortfolioBacktestDiagnosticInput>(
  portfolio: T
): {
  value: string;
  detail: string;
  status: PortfolioBacktestDiagnosticStatus;
} | null {
  const contributions = portfolio.covarianceRisk?.contributions.filter((contribution) =>
    Number.isFinite(contribution.contributionPct)
  );
  if (!portfolio.covarianceRisk || !contributions?.length) {
    return null;
  }

  const largest = [...contributions].sort((left, right) => right.contributionPct - left.contributionPct)[0];
  const status: PortfolioBacktestDiagnosticStatus =
    largest.contributionPct >= 75 ? "blocked" : largest.contributionPct > 60 ? "review" : "passed";
  const detail =
    status === "blocked"
      ? "Largest covariance risk contribution exceeds the 75% hard concentration threshold."
      : status === "review"
        ? "Largest covariance risk contribution exceeds the 60% review threshold."
        : "Largest covariance risk contribution remains inside the 60% review threshold.";

  return {
    value: `${largest.symbol} ${formatDiagnosticPercent(largest.contributionPct)}`,
    detail: `${detail} Portfolio annualized volatility ${formatReportPercent(
      portfolio.covarianceRisk.annualizedVolatilityPct
    )}; observations ${portfolio.covarianceRisk.observations}.`,
    status
  };
}

export function buildPortfolioCorrelationReview<T extends PortfolioBacktestDiagnosticInput>(portfolio: T): {
  value: string;
  detail: string;
  status: PortfolioBacktestDiagnosticStatus;
} {
  const pairs = (portfolio.correlationPairs ?? []).filter(
    (pair) => typeof pair.leftSymbol === "string" && typeof pair.rightSymbol === "string" && Number.isFinite(pair.correlation)
  );
  if (!pairs.length) {
    return {
      value: "n/a",
      detail: "Pairwise correlation evidence is unavailable; rerun the portfolio backtest to refresh correlation risk.",
      status: "review"
    };
  }

  const largest = [...pairs].sort((left, right) => Math.abs(right.correlation) - Math.abs(left.correlation))[0];
  const absoluteCorrelation = Math.abs(largest.correlation);
  const status: PortfolioBacktestDiagnosticStatus =
    absoluteCorrelation >= 0.95 ? "blocked" : absoluteCorrelation > 0.85 ? "review" : "passed";
  const detail =
    status === "blocked"
      ? "Highest pairwise correlation exceeds the 0.95 hard clustering threshold."
      : status === "review"
        ? "Highest pairwise correlation exceeds the 0.85 review threshold."
        : "Highest pairwise correlation remains inside the 0.85 review threshold.";

  return {
    value: `${largest.leftSymbol}/${largest.rightSymbol} ${largest.correlation.toFixed(2)}`,
    detail,
    status
  };
}

export function formatMetricPercent(metrics: Record<string, number>, snakeKey: string, camelKey: string): string {
  const value = metrics[snakeKey] ?? metrics[camelKey];
  return Number.isFinite(value) ? `${formatPercentValue(value)}%` : "N/A";
}

export function buildRiskApprovalSummary(workspace: TerminalWorkspace): RiskApprovalSummary {
  const aiDossier = buildAiReviewDossier(workspace);
  const auditBinding = buildResearchRunContextBinding(workspace);
  const strategyDraft = buildStrategyRuleDraft(workspace);
  const approvalRisk = buildRiskApprovalRisk(workspace, strategyDraft);
  const researchRun = auditBinding.canUseRun ? workspace.researchRun : null;
  const dataQualityGate = researchRun ? buildRiskApprovalDataQualityGate(researchRun) : null;
  const dataQualityIsReady = dataQualityGate?.status === "passed";
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const drawdownMetric = parsePercentMetric(metricValue(workspace, "Max DD", "N/A"));
  const drawdownValue = drawdownMetric === null ? "N/A" : `${formatPercentValue(drawdownMetric)}%`;
  const positionIsReady = approvalRisk.positionPct !== null && approvalRisk.positionPct > 0;
  const drawdownIsReady = approvalRisk.maxDrawdownPct !== null && approvalRisk.maxDrawdownPct > 0;
  const drawdownLimit = drawdownIsReady ? `${formatPercentValue(approvalRisk.maxDrawdownPct ?? 0)}%` : "N/A";
  const drawdownPassed = drawdownMetric !== null && drawdownIsReady && drawdownMetric <= (approvalRisk.maxDrawdownPct ?? 0);
  const riskIsComplete =
    positionIsReady &&
    drawdownIsReady &&
    approvalRisk.stopLossPct !== null &&
    approvalRisk.stopLossPct > 0 &&
    approvalRisk.takeProfitPct !== null &&
    approvalRisk.takeProfitPct > 0;
  const paperCanStage =
    Boolean(researchRun) && aiDossier.status === "ready" && dataQualityIsReady && riskIsComplete && drawdownPassed;
  const liveCanRoute = paperCanStage && workspace.execution.liveEnabled && blockedGateCount === 0;

  if (!researchRun) {
    const auditedRunValue = auditBinding.status === "mismatched" ? (auditBinding.runId ?? "Stale audited run") : "No audited run";
    const auditedRunDetail =
      auditBinding.status === "mismatched"
        ? auditBinding.detail
        : "Run Pipeline must produce a reproducible research run before execution.";
    return {
      status: "blocked",
      headline: "Risk approval blocked",
      summary: "Bind an audited run before paper or live execution.",
      gates: [
        {
          id: "audited-run",
          label: "Audited run",
          value: auditedRunValue,
          detail: auditedRunDetail,
          status: "blocked",
          tone: "risk"
        },
        {
          id: "ai-evidence",
          label: "AI evidence",
          value: "Evidence dossier blocked",
          detail: aiDossier.summary,
          status: "blocked",
          tone: "risk"
        },
        {
          id: "position-limit",
          label: "Position limit",
          value: `${formatPercentValue(strategyDraft.positionPct)}% cap`,
          detail: "Position cap is parsed but cannot be approved without audited evidence.",
          status: "review",
          tone: "warning"
        },
        {
          id: "drawdown-limit",
          label: "Drawdown guard",
          value: `${drawdownValue} / ${drawdownLimit} guard`,
          detail: "Drawdown is provisional until a run snapshot is bound.",
          status: "review",
          tone: "warning"
        },
        {
          id: "execution-route",
          label: "Execution route",
          value: "paper blocked",
          detail: "Paper route waits for audited evidence; live route remains gated.",
          status: "blocked",
          tone: "risk"
        }
      ]
    };
  }

  const approvedDataQualityGate = dataQualityGate ?? buildRiskApprovalDataQualityGate(researchRun);
  const executionRouteGate: RiskApprovalGate = liveCanRoute
    ? {
        id: "execution-route",
        label: "Execution route",
        value: "certified live",
        detail: "All execution gates passed; live route is available after human confirmation.",
        status: "passed",
        tone: "positive"
      }
    : !riskIsComplete
      ? {
          id: "execution-route",
          label: "Execution route",
          value: "risk blocked",
          detail: "Audited strategy risk configuration is incomplete before execution staging.",
          status: "blocked",
          tone: "risk"
        }
      : !dataQualityIsReady
        ? {
            id: "execution-route",
            label: "Execution route",
            value: "data blocked",
            detail: approvedDataQualityGate.detail,
            status: "blocked",
            tone: "risk"
          }
        : {
            id: "execution-route",
            label: "Execution route",
            value: "paper only",
            detail: `Paper route can stage; ${blockedGateCount} live gates still blocked.`,
            status: "review",
            tone: "warning"
          };

  const status: RiskApprovalStatus = liveCanRoute ? "live_ready" : paperCanStage ? "paper_ready" : "blocked";
  return {
    status,
    headline:
      status === "live_ready" ? "Certified live route ready" : status === "paper_ready" ? "Paper execution approved" : "Risk approval blocked",
    summary:
      status === "live_ready"
        ? `Audited run ${researchRun.runId} can route through certified live execution.`
        : status === "paper_ready"
          ? `Audited run ${researchRun.runId} can stage paper orders; live trading remains blocked until ${blockedGateCount} gates pass.`
          : `Audited run ${researchRun.runId} needs risk review before staging execution.`,
    gates: [
      {
        id: "audited-run",
        label: "Audited run",
        value: researchRun.runId,
        detail: `${researchRun.dataRows} ${researchRun.timeframe} bars · ${researchRun.executionMode}`,
        status: "passed",
        tone: "positive"
      },
      {
        id: "ai-evidence",
        label: "AI evidence",
        value: aiDossier.status === "ready" ? "Evidence locked" : "Evidence dossier blocked",
        detail: aiDossier.headline,
        status: aiDossier.status === "ready" ? "passed" : "blocked",
        tone: aiDossier.status === "ready" ? "ai" : "risk"
      },
      approvedDataQualityGate,
      {
        id: "position-limit",
        label: "Position limit",
        value: positionIsReady ? `${formatPercentValue(approvalRisk.positionPct ?? 0)}% cap` : "N/A cap",
        detail: positionIsReady
          ? approvalRisk.source === "audit"
            ? "Sizing uses the audited strategy position guardrail."
            : "Sizing uses the current strategy position guardrail."
          : "Audited strategy position guardrail is missing.",
        status: positionIsReady ? "passed" : "blocked",
        tone: positionIsReady ? ((approvalRisk.positionPct ?? 0) <= 30 ? "positive" : "warning") : "risk"
      },
      {
        id: "drawdown-limit",
        label: "Drawdown guard",
        value: `${drawdownValue} / ${drawdownLimit} guard`,
        detail: !drawdownIsReady
          ? "Audited strategy drawdown guardrail is missing."
          : drawdownPassed
            ? "Audited drawdown is inside the configured guardrail."
            : "Audited drawdown breaches the configured guardrail.",
        status: drawdownPassed ? "passed" : "blocked",
        tone: drawdownPassed ? "positive" : "risk"
      },
      executionRouteGate
    ]
  };
}

export function buildRiskApprovalRisk(
  workspace: TerminalWorkspace,
  strategyDraft: StrategyRuleDraft
): {
  positionPct: number | null;
  stopLossPct: number | null;
  takeProfitPct: number | null;
  maxDrawdownPct: number | null;
  source: "audit" | "draft";
} {
  const auditedRisk = workspace.researchRun?.strategyConfig?.risk;
  if (auditedRisk) {
    return {
      positionPct: fractionToPercentOrNull(auditedRisk.positionPct),
      stopLossPct: fractionToPercentOrNull(auditedRisk.stopLossPct),
      takeProfitPct: fractionToPercentOrNull(auditedRisk.takeProfitPct),
      maxDrawdownPct: fractionToPercentOrNull(auditedRisk.maxDrawdownPct),
      source: "audit"
    };
  }
  return {
    positionPct: strategyDraft.positionPct,
    stopLossPct: strategyDraft.stopLossPct,
    takeProfitPct: strategyDraft.takeProfitPct,
    maxDrawdownPct: strategyDraft.maxDrawdownPct,
    source: "draft"
  };
}

export function fractionToPercentOrNull(value: number | null): number | null {
  return value === null || !Number.isFinite(value) ? null : value * 100;
}

export function buildRiskApprovalDataQualityGate(run: ResearchRunSummary): RiskApprovalGate {
  const dataQuality = run.dataQuality;
  if (!dataQuality) {
    return {
      id: "data-quality",
      label: "Data quality",
      value: "Not attached",
      detail: "Audited run metadata did not include data quality; rerun pipeline before paper execution.",
      status: "blocked",
      tone: "risk"
    };
  }

  const source = dataQuality.source.trim();
  const sourceIsTrusted = source !== "" && source !== "unknown" && source !== "demo-fallback";
  const rowsAreReady = Number.isFinite(dataQuality.rows) && dataQuality.rows > 0;
  const isReady = dataQuality.isComplete && sourceIsTrusted && rowsAreReady;

  return {
    id: "data-quality",
    label: "Data quality",
    value: `${source || "unknown"} · ${dataQuality.isComplete ? "complete" : "review"}`,
    detail: isReady
      ? `${dataQuality.rows} rows are approved for paper execution; ${formatWarningCount(dataQuality.warnings.length)}.`
      : `Paper execution requires complete audited market data; current source ${source || "unknown"} is review-only.`,
    status: isReady ? "passed" : "blocked",
    tone: isReady ? (dataQuality.warnings.length === 0 ? "positive" : "warning") : "risk"
  };
}
