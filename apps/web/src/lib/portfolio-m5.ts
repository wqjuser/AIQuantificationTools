import type { Stage4PortfolioWorkflow } from "./portfolio-stage4";
import {
  buildApiUrl,
  coreErrorDetail,
  type WorkspaceFetcher,
  type WorkspaceSource,
} from "./terminal-api";

export interface PortfolioRiskClassification {
  symbol: string;
  industry: string;
  currency: string;
}

export interface PortfolioRiskObservations {
  dailyLossPct: number;
  tradesToday: number;
}

export interface PortfolioRiskLimits {
  maxDrawdownPct: number;
  maxDailyLossPct: number;
  maxTradesPerDay: number;
  maxTotalExposureWeight: number;
  maxSymbolWeight: number;
  maxIndustryWeight: number;
  maxMarketWeight: number;
  maxCurrencyWeight: number;
  maxCorrelation: number;
  maxRiskContributionPct: number;
}

export interface PortfolioRiskAssessmentRequest {
  workflowId: string;
  operator: string;
  classifications: PortfolioRiskClassification[];
  observations: PortfolioRiskObservations;
  limits: PortfolioRiskLimits;
}

export interface PortfolioRiskAllocation {
  symbol: string;
  sourceRunId: string;
  market: string;
  industry: string;
  currency: string;
  currentQuantity: number;
  currentValue: number;
  currentWeight: number;
  targetWeight: number;
  adjustedTargetWeight: number;
  driftPct: number;
  proposedDeltaValue: number;
  side: "buy" | "sell" | "hold";
  status: "candidate" | "blocked" | "no_action";
  reason: string;
}

export interface PortfolioRiskExposure {
  dimension: "industry" | "market" | "currency";
  group: string;
  currentWeight: number;
  targetWeight: number;
  adjustedTargetWeight: number;
  limit: number;
  status: "passed" | "reduced";
}

export interface PortfolioRiskCheck {
  checkId: string;
  scope: "account" | "portfolio";
  status: "passed" | "reduced" | "blocked";
  value: number;
  limit: number;
  unit: "count" | "pct" | "weight" | "correlation";
  reason: string;
}

export interface PortfolioRiskAssessment {
  kind: "aiqt.portfolioRiskAssessment";
  schemaVersion: 1;
  assessmentId: string;
  createdAt: string;
  baseRunId: string;
  workflowId: string;
  workflowHash: string;
  operator: string;
  classifications: PortfolioRiskClassification[];
  observations: PortfolioRiskObservations;
  limits: PortfolioRiskLimits;
  account: {
    source: "stage4_paper_replay";
    observedAt: string;
    equity: number;
    cash: number;
    unmatchedSymbols: string[];
  };
  allocations: PortfolioRiskAllocation[];
  cash: {
    currentValue: number;
    currentWeight: number;
    targetWeight: number;
    adjustedTargetWeight: number;
    proposedDeltaValue: number;
  };
  exposures: PortfolioRiskExposure[];
  correlations: Array<{
    leftSymbol: string;
    rightSymbol: string;
    correlation: number;
    limit: number;
    status: "passed" | "blocked";
  }>;
  riskContributions: Array<{
    symbol: string;
    sourceRunId: string | null;
    contributionPct: number;
    limitPct: number;
    status: "passed" | "blocked";
  }>;
  checks: PortfolioRiskCheck[];
  batch: {
    status: "ready" | "reduced" | "blocked";
    orders: Array<{
      symbol: string;
      sourceRunId: string;
      side: "buy" | "sell" | "hold";
      notionalValue: number;
      status: "candidate" | "blocked" | "no_action";
      reason: string;
    }>;
    blockedReasons: string[];
  };
  summary: {
    currentExposureWeight: number;
    targetExposureWeight: number;
    adjustedTargetExposureWeight: number;
    currentWeightSum: number;
    targetWeightSum: number;
    adjustedTargetWeightSum: number;
    proposedTradeCount: number;
    reducedTargetCount: number;
    unmatchedHoldingCount: number;
    blockedCheckCount: number;
  };
  paperOnly: true;
  liveTradingAllowed: false;
  orderSubmissionEnabled: false;
  routeExecuted: false;
  liveBlockedBoundary: true;
  recordHash: string;
}

export interface PortfolioRiskAssessmentResult {
  assessment?: PortfolioRiskAssessment;
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioRiskAssessmentHistoryResult {
  assessments: PortfolioRiskAssessment[];
  source: WorkspaceSource;
  error?: string;
}

export const DEFAULT_PORTFOLIO_RISK_LIMITS: PortfolioRiskLimits = {
  maxDrawdownPct: 20,
  maxDailyLossPct: 3,
  maxTradesPerDay: 20,
  maxTotalExposureWeight: 0.95,
  maxSymbolWeight: 0.4,
  maxIndustryWeight: 0.6,
  maxMarketWeight: 0.95,
  maxCurrencyWeight: 0.95,
  maxCorrelation: 0.8,
  maxRiskContributionPct: 60,
};

export function buildPortfolioRiskAssessmentDraft(
  workflow: Stage4PortfolioWorkflow,
): PortfolioRiskAssessmentRequest {
  const observedDay = workflow.replay.generatedAt.slice(0, 10);
  return {
    workflowId: workflow.workflowId,
    operator: "local-operator",
    classifications: workflow.portfolioRequest.legs.map((leg) => ({
      symbol: leg.symbol,
      industry: "未分类",
      currency: currencyForMarket(leg.market),
    })),
    observations: {
      dailyLossPct: 0,
      tradesToday: workflow.replay.orders.filter(
        (order) => order.simulatedAt.slice(0, 10) === observedDay,
      ).length,
    },
    limits: { ...DEFAULT_PORTFOLIO_RISK_LIMITS },
  };
}

export function buildPortfolioRiskAssessmentsUrl(
  baseUrl: string,
  baseRunId?: string,
  limit = 20,
): string {
  return buildApiUrl(
    baseUrl,
    "/api/portfolio/risk-assessments",
    baseRunId === undefined
      ? undefined
      : (url) => {
          url.searchParams.set("baseRunId", baseRunId);
          url.searchParams.set("limit", String(limit));
        },
  );
}

export async function createPortfolioRiskAssessment(
  baseUrl: string,
  request: PortfolioRiskAssessmentRequest,
  fetcher: WorkspaceFetcher = defaultFetcher,
): Promise<PortfolioRiskAssessmentResult> {
  try {
    const response = await fetcher(buildPortfolioRiskAssessmentsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
    if (!isRecord(payload) || !isPortfolioRiskAssessment(payload.assessment)) {
      throw new Error("Invalid portfolio risk assessment contract");
    }
    return { assessment: payload.assessment, source: "core" };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio risk assessment error",
    };
  }
}

export async function loadPortfolioRiskAssessments(
  baseUrl: string,
  baseRunId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
): Promise<PortfolioRiskAssessmentHistoryResult> {
  try {
    const response = await fetcher(buildPortfolioRiskAssessmentsUrl(baseUrl, baseRunId));
    const payload = await response.json();
    if (
      !response.ok
      || !isRecord(payload)
      || !Array.isArray(payload.assessments)
      || !payload.assessments.every(isPortfolioRiskAssessment)
    ) {
      throw new Error(
        coreErrorDetail(payload) ??
          (response.ok
            ? "Invalid portfolio risk assessment history contract"
            : `HTTP ${response.status ?? "error"}`),
      );
    }
    return { assessments: payload.assessments, source: "core" };
  } catch (error) {
    return {
      assessments: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio risk assessment history error",
    };
  }
}

export function isPortfolioRiskAssessment(value: unknown): value is PortfolioRiskAssessment {
  if (!isRecord(value)) return false;
  const assessment = value as unknown as PortfolioRiskAssessment;
  return (
    assessment.kind === "aiqt.portfolioRiskAssessment" &&
    assessment.schemaVersion === 1 &&
    nonempty(assessment.assessmentId) &&
    nonempty(assessment.createdAt) &&
    nonempty(assessment.baseRunId) &&
    nonempty(assessment.workflowId) &&
    nonempty(assessment.operator) &&
    /^[0-9a-f]{64}$/.test(assessment.workflowHash) &&
    /^[0-9a-f]{64}$/.test(assessment.recordHash) &&
    assessment.paperOnly === true &&
    assessment.liveTradingAllowed === false &&
    assessment.orderSubmissionEnabled === false &&
    assessment.routeExecuted === false &&
    assessment.liveBlockedBoundary === true &&
    Array.isArray(assessment.classifications) &&
    assessment.classifications.length >= 2 &&
    assessment.classifications.every(isClassification) &&
    isObservations(assessment.observations) &&
    isLimits(assessment.limits) &&
    isRecord(assessment.account) &&
    assessment.account.source === "stage4_paper_replay" &&
    finite(assessment.account.equity) &&
    assessment.account.equity > 0 &&
    finite(assessment.account.cash) &&
    Array.isArray(assessment.account.unmatchedSymbols) &&
    assessment.account.unmatchedSymbols.every(nonempty) &&
    Array.isArray(assessment.allocations) &&
    assessment.allocations.length >= 2 &&
    assessment.allocations.every(isAllocation) &&
    Array.isArray(assessment.exposures) &&
    assessment.exposures.every(isExposure) &&
    Array.isArray(assessment.checks) &&
    assessment.checks.length > 0 &&
    assessment.checks.every(isCheck) &&
    isRecord(assessment.cash) &&
    finite(assessment.cash.currentValue) &&
    finite(assessment.cash.currentWeight) &&
    finite(assessment.cash.targetWeight) &&
    finite(assessment.cash.adjustedTargetWeight) &&
    finite(assessment.cash.proposedDeltaValue) &&
    Array.isArray(assessment.correlations) &&
    assessment.correlations.every((row) =>
      isRecord(row) &&
      nonempty(row.leftSymbol) &&
      nonempty(row.rightSymbol) &&
      finite(row.correlation) &&
      finite(row.limit) &&
      ["passed", "blocked"].includes(String(row.status))
    ) &&
    Array.isArray(assessment.riskContributions) &&
    assessment.riskContributions.every((row) =>
      isRecord(row) &&
      nonempty(row.symbol) &&
      finite(row.contributionPct) &&
      finite(row.limitPct) &&
      ["passed", "blocked"].includes(String(row.status))
    ) &&
    isRecord(assessment.batch) &&
    ["ready", "reduced", "blocked"].includes(assessment.batch.status) &&
    Array.isArray(assessment.batch.orders) &&
    assessment.batch.orders.every((row) =>
      isRecord(row) &&
      nonempty(row.symbol) &&
      nonempty(row.sourceRunId) &&
      ["buy", "sell", "hold"].includes(String(row.side)) &&
      finite(row.notionalValue) &&
      ["candidate", "blocked", "no_action"].includes(String(row.status)) &&
      nonempty(row.reason)
    ) &&
    Array.isArray(assessment.batch.blockedReasons) &&
    assessment.batch.blockedReasons.every((reason) => typeof reason === "string") &&
    isRecord(assessment.summary) &&
    [
      assessment.summary.currentExposureWeight,
      assessment.summary.targetExposureWeight,
      assessment.summary.adjustedTargetExposureWeight,
      assessment.summary.currentWeightSum,
      assessment.summary.targetWeightSum,
      assessment.summary.adjustedTargetWeightSum,
      assessment.summary.proposedTradeCount,
      assessment.summary.reducedTargetCount,
      assessment.summary.unmatchedHoldingCount,
      assessment.summary.blockedCheckCount,
    ].every(finite)
  );
}

function isAllocation(value: unknown): value is PortfolioRiskAllocation {
  if (!isRecord(value)) return false;
  const row = value as unknown as PortfolioRiskAllocation;
  return (
    nonempty(row.symbol) &&
    nonempty(row.sourceRunId) &&
    nonempty(row.market) &&
    nonempty(row.industry) &&
    nonempty(row.currency) &&
    finite(row.currentQuantity) &&
    finite(row.currentValue) &&
    finite(row.currentWeight) &&
    finite(row.targetWeight) &&
    finite(row.adjustedTargetWeight) &&
    row.adjustedTargetWeight <= row.targetWeight + 1e-12 &&
    finite(row.driftPct) &&
    finite(row.proposedDeltaValue) &&
    ["buy", "sell", "hold"].includes(row.side) &&
    ["candidate", "blocked", "no_action"].includes(row.status) &&
    nonempty(row.reason)
  );
}

function isExposure(value: unknown): value is PortfolioRiskExposure {
  if (!isRecord(value)) return false;
  const row = value as unknown as PortfolioRiskExposure;
  return (
    ["industry", "market", "currency"].includes(row.dimension) &&
    nonempty(row.group) &&
    finite(row.currentWeight) &&
    finite(row.targetWeight) &&
    finite(row.adjustedTargetWeight) &&
    row.adjustedTargetWeight <= row.targetWeight + 1e-12 &&
    finite(row.limit) &&
    ["passed", "reduced"].includes(row.status)
  );
}

function isCheck(value: unknown): value is PortfolioRiskCheck {
  if (!isRecord(value)) return false;
  const row = value as unknown as PortfolioRiskCheck;
  return (
    nonempty(row.checkId) &&
    ["account", "portfolio"].includes(row.scope) &&
    ["passed", "reduced", "blocked"].includes(row.status) &&
    finite(row.value) &&
    finite(row.limit) &&
    ["count", "pct", "weight", "correlation"].includes(row.unit) &&
    nonempty(row.reason)
  );
}

function isClassification(value: unknown): value is PortfolioRiskClassification {
  return (
    isRecord(value) &&
    nonempty(value.symbol) &&
    nonempty(value.industry) &&
    nonempty(value.currency)
  );
}

function isObservations(value: unknown): value is PortfolioRiskObservations {
  return (
    isRecord(value) &&
    finite(value.dailyLossPct) &&
    Number.isInteger(value.tradesToday) &&
    Number(value.tradesToday) >= 0
  );
}

function isLimits(value: unknown): value is PortfolioRiskLimits {
  return (
    isRecord(value) &&
    [
      value.maxDrawdownPct,
      value.maxDailyLossPct,
      value.maxTradesPerDay,
      value.maxTotalExposureWeight,
      value.maxSymbolWeight,
      value.maxIndustryWeight,
      value.maxMarketWeight,
      value.maxCurrencyWeight,
      value.maxCorrelation,
      value.maxRiskContributionPct,
    ].every(finite)
  );
}

function currencyForMarket(market: string): string {
  return market === "ashare" ? "CNY" : market === "us" ? "USD" : "USDT";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const defaultFetcher: WorkspaceFetcher = (url, init) => fetch(url, init);
