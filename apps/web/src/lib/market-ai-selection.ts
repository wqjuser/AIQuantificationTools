import type { AiReviewProviderId } from "./ai-review-stage3";
import type { Market } from "./terminal-workbench";
import {
  buildApiUrl,
  coreErrorDetail,
  defaultFetcher,
  type WorkspaceFetcher
} from "./terminal-api-http";

type MarketAiSelectionDiscoverySort =
  | "changePct"
  | "amount"
  | "turnoverRate"
  | "marketCap"
  | "peRatio";

type MarketAiSelectionSource = "core" | "fallback";

export type MarketAiSelectionProfile =
  | "balanced"
  | "quality_growth"
  | "value"
  | "trend";

export type MarketAiSelectionHorizon = "short" | "medium" | "long";

export interface MarketAiSelectionDiscovery {
  query?: string;
  minChangePct?: number;
  maxChangePct?: number;
  minAmount?: number;
  minTurnoverRate?: number;
  maxPe?: number;
  sort?: MarketAiSelectionDiscoverySort;
  direction?: "asc" | "desc";
}

export interface MarketAiSelectionRequest {
  market: Market;
  universeMode: "discovery" | "watchlist";
  discovery: MarketAiSelectionDiscovery;
  profile: MarketAiSelectionProfile;
  horizon: MarketAiSelectionHorizon;
  providerId: AiReviewProviderId;
  externalDataApproved: boolean;
}

export interface MarketAiSelectionCandidate {
  evidenceId: string;
  market: Market;
  symbol: string;
  name: string;
  score: number;
  pillarScores: Record<string, number>;
  fundamentalPeriod: string | null;
  dataGaps: string[];
}

export interface MarketAiSelectionRecommendation extends MarketAiSelectionCandidate {
  rank: number;
  tier: "priority_research" | "watch" | "insufficient_evidence";
  reasons: string[];
  risks: string[];
  evidenceReferences: string[];
  summary: string;
}

export interface MarketAiSelectionResult {
  selectionId: string;
  status: "completed" | "partial";
  generatedAt: string;
  marketSnapshot: {
    snapshotHash: string;
    observedAt: string;
    source: string;
    freshness: "fresh" | "stale" | "partial";
    warnings: string[];
  };
  baselineCandidates: MarketAiSelectionCandidate[];
  recommendations: MarketAiSelectionRecommendation[];
  exclusions: Array<{
    market: Market;
    symbol: string;
    name: string;
    reason: string;
  }>;
  generation: {
    requestedProvider: AiReviewProviderId;
    usedProvider: AiReviewProviderId;
    status: "completed" | "failed" | "skipped";
    fallbackUsed: boolean;
    model: string | null;
    sanitizedBaseUrl: string | null;
    latencyMs: number;
    externalDataApproved: boolean;
    outboundFields: string[];
    errorCode: string | null;
  };
  auditEventId: string;
  boundary: {
    researchOnly: true;
    watchlistModified: false;
    researchStarted: false;
    riskModified: false;
    autoTradingModified: false;
    orderSubmissionAllowed: false;
    routeExecuted: false;
  };
}

export interface MarketAiSelectionLoadResult {
  selection?: MarketAiSelectionResult;
  source: MarketAiSelectionSource;
  error?: string;
}

export interface MarketAiSelectionReviewRequest {
  selectionId: string;
  benchmarkRunId: string;
}

interface MarketAiSelectionReviewItemBase {
  candidateEvidenceId: string;
  researchRunId?: string;
  rank: number;
  tier: "priority_research" | "watch" | "insufficient_evidence";
  market: Market;
  symbol: string;
  timeframe: "1d";
  horizon: MarketAiSelectionHorizon;
  horizonBars: number;
  referenceAt: string;
  referencePrice: number;
}

export interface MarketAiSelectionReviewCompletedItem
  extends MarketAiSelectionReviewItemBase {
  researchRunId: string;
  status: "completed";
  completedBars: number;
  remainingBars: 0;
  outcomeAt: string;
  outcomePrice: number;
  returnPct: number;
  absoluteHit: boolean;
  outcomeSource: string;
  outcomeAdjustmentMode: string;
  outcomeDataHash: string;
  benchmarkRunId: string;
  benchmarkSymbol: string;
  benchmarkReferencePrice?: number;
  benchmarkOutcomePrice?: number;
  benchmarkReturnPct: number;
  relativeReturnPct: number;
  benchmarkHit: boolean;
  benchmarkSource: string;
  benchmarkAdjustmentMode: string;
  benchmarkDataHash: string;
}

export interface MarketAiSelectionReviewObservingItem
  extends MarketAiSelectionReviewItemBase {
  researchRunId: string;
  status: "observing";
  completedBars: number;
  remainingBars: number;
}

export interface MarketAiSelectionReviewInsufficientItem
  extends MarketAiSelectionReviewItemBase {
  status: "data_insufficient";
  reason: string;
  completedBars?: number;
  remainingBars?: number;
  outcomeAt?: string;
  outcomePrice?: number;
  returnPct?: number;
  absoluteHit?: boolean;
  outcomeSource?: string;
  outcomeAdjustmentMode?: string;
  outcomeDataHash?: string;
}

export type MarketAiSelectionReviewItem =
  | MarketAiSelectionReviewCompletedItem
  | MarketAiSelectionReviewObservingItem
  | MarketAiSelectionReviewInsufficientItem;

export interface MarketAiSelectionReview {
  schemaVersion: 1 | 2;
  recordType: "aiqt.marketAiSelectionReview";
  reviewId: string;
  selectionId: string;
  selectionRecordHash: string;
  createdAt: string;
  market: Market;
  timeframe: "1d";
  benchmark: {
    runId: string;
    symbol: string;
    auditHash: string;
  };
  items: MarketAiSelectionReviewItem[];
  summary: {
    recommendationCount: number;
    maturedCount: number;
    observingCount: number;
    dataInsufficientCount: number;
    absoluteHitCount: number;
    absoluteSampleCount: number;
    absoluteHitRatePct: number | null;
    benchmarkHitCount: number;
    benchmarkSampleCount: number;
    benchmarkHitRatePct: number | null;
  };
  boundary: {
    researchOnly: true;
    affectsRisk: false;
    affectsAuthorization: false;
    affectsPermissions: false;
    affectsOrderRouting: false;
    orderSubmissionAllowed: false;
    routeExecuted: false;
  };
  recordHash: string;
}

export interface MarketAiSelectionReviewLoadResult {
  review?: MarketAiSelectionReview;
  source: MarketAiSelectionSource;
  error?: string;
}

export interface MarketAiSelectionQualityStatistics {
  schemaVersion: 1;
  recordType: "aiqt.marketAiSelectionQualityStatistics";
  generatedAt: string;
  selectionCount: number;
  candidateQualification: {
    qualifiedCount: number;
    sampleCount: number;
    ratePct: number | null;
  };
  majorExclusions: {
    excludedCount: number;
    reasons: Array<{ reason: string; count: number; ratePct: number }>;
  };
  dataSourceDegradation: {
    degradedCount: number;
    sampleCount: number;
    ratePct: number | null;
  };
  aiSuccess: {
    successCount: number;
    sampleCount: number;
    ratePct: number | null;
  };
  stylePerformance: Array<{
    profile: MarketAiSelectionProfile;
    selectionCount: number;
    reviewedSelectionCount: number;
    absoluteHitCount: number;
    absoluteSampleCount: number;
    absoluteHitRatePct: number | null;
    benchmarkHitCount: number;
    benchmarkSampleCount: number;
    benchmarkHitRatePct: number | null;
  }>;
  boundary: MarketAiSelectionResult["boundary"];
}

export interface MarketAiSelectionQualityStatisticsLoadResult {
  statistics?: MarketAiSelectionQualityStatistics;
  source: MarketAiSelectionSource;
  error?: string;
}


export function isMarketAiSelectionPayload(
  value: unknown,
  request: MarketAiSelectionRequest
): value is MarketAiSelectionResult {
  if (!hasExactAiReviewEnvelopeKeys(value, [
    "selectionId",
    "status",
    "generatedAt",
    "marketSnapshot",
    "baselineCandidates",
    "recommendations",
    "exclusions",
    "generation",
    "auditEventId",
    "boundary"
  ])) {
    return false;
  }
  if (
    typeof value.selectionId !== "string"
    || !value.selectionId.trim()
    || (value.status !== "completed" && value.status !== "partial")
    || typeof value.generatedAt !== "string"
    || !value.generatedAt.trim()
    || !isMarketAiSelectionSnapshot(value.marketSnapshot)
    || !Array.isArray(value.baselineCandidates)
    || value.baselineCandidates.length > 20
    || !value.baselineCandidates.every((item) =>
      isMarketAiSelectionCandidate(item, request.market)
    )
    || !Array.isArray(value.recommendations)
    || value.recommendations.length > 5
    || !value.recommendations.every((item) =>
      isMarketAiSelectionRecommendation(item, request.market)
    )
    || !Array.isArray(value.exclusions)
    || !value.exclusions.every((item) =>
      isMarketAiSelectionExclusion(item, request.market)
    )
    || !isMarketAiSelectionGeneration(value.generation, request)
    || typeof value.auditEventId !== "string"
    || !value.auditEventId.trim()
    || !isMarketAiSelectionBoundary(value.boundary)
  ) {
    return false;
  }
  const baselineEvidenceIds = new Set(
    value.baselineCandidates.map((item) => item.evidenceId)
  );
  const recommendationEvidenceIds = new Set<string>();
  const ranks = new Set<number>();
  return value.recommendations.every((item) => {
    if (
      !baselineEvidenceIds.has(item.evidenceId)
      || recommendationEvidenceIds.has(item.evidenceId)
      || ranks.has(item.rank)
    ) {
      return false;
    }
    recommendationEvidenceIds.add(item.evidenceId);
    ranks.add(item.rank);
    return true;
  });
}

export function isMarketAiSelectionQualityStatistics(
  value: unknown
): value is MarketAiSelectionQualityStatistics {
  if (!hasExactAiReviewEnvelopeKeys(value, [
    "schemaVersion",
    "recordType",
    "generatedAt",
    "selectionCount",
    "candidateQualification",
    "majorExclusions",
    "dataSourceDegradation",
    "aiSuccess",
    "stylePerformance",
    "boundary"
  ])) {
    return false;
  }
  const qualification = value.candidateQualification;
  const exclusions = value.majorExclusions;
  const degradation = value.dataSourceDegradation;
  const aiSuccess = value.aiSuccess;
  if (
    value.schemaVersion !== 1
    || value.recordType !== "aiqt.marketAiSelectionQualityStatistics"
    || !isOffsetDateTime(value.generatedAt)
    || !isMarketAiSelectionNonNegativeInteger(value.selectionCount)
    || !isMarketAiSelectionQualityRate(
      qualification,
      "qualifiedCount",
      "sampleCount",
      "ratePct",
    )
    || !hasExactAiReviewEnvelopeKeys(exclusions, ["excludedCount", "reasons"])
    || !isMarketAiSelectionNonNegativeInteger(exclusions.excludedCount)
    || Number(qualification.sampleCount)
      !== Number(qualification.qualifiedCount) + Number(exclusions.excludedCount)
    || !Array.isArray(exclusions.reasons)
    || exclusions.reasons.length > 5
    || !exclusions.reasons.every((item) => (
      hasExactAiReviewEnvelopeKeys(item, ["reason", "count", "ratePct"])
      && typeof item.reason === "string"
      && Boolean(item.reason.trim())
      && isMarketAiSelectionNonNegativeInteger(item.count)
      && item.count > 0
      && isMarketAiSelectionReviewHitRate(
        item.ratePct,
        item.count,
        Number(exclusions.excludedCount),
      )
    ))
    || (exclusions.excludedCount === 0) !== (exclusions.reasons.length === 0)
    || exclusions.reasons.reduce((total, item) => total + item.count, 0)
      > exclusions.excludedCount
    || !isMarketAiSelectionQualityRate(
      degradation,
      "degradedCount",
      "sampleCount",
      "ratePct",
    )
    || Number(degradation.sampleCount) !== value.selectionCount
    || !isMarketAiSelectionQualityRate(
      aiSuccess,
      "successCount",
      "sampleCount",
      "ratePct",
    )
    || Number(aiSuccess.sampleCount) > value.selectionCount
    || !Array.isArray(value.stylePerformance)
    || value.stylePerformance.length !== 4
    || !isMarketAiSelectionBoundary(value.boundary)
  ) {
    return false;
  }
  const profiles = new Set<MarketAiSelectionProfile>();
  let styleSelectionCount = 0;
  for (const item of value.stylePerformance) {
    if (
      !hasExactAiReviewEnvelopeKeys(item, [
        "profile",
        "selectionCount",
        "reviewedSelectionCount",
        "absoluteHitCount",
        "absoluteSampleCount",
        "absoluteHitRatePct",
        "benchmarkHitCount",
        "benchmarkSampleCount",
        "benchmarkHitRatePct"
      ])
      || !["balanced", "quality_growth", "value", "trend"].includes(String(item.profile))
      || profiles.has(item.profile as MarketAiSelectionProfile)
      || !isMarketAiSelectionNonNegativeInteger(item.selectionCount)
      || !isMarketAiSelectionNonNegativeInteger(item.reviewedSelectionCount)
      || item.reviewedSelectionCount > item.selectionCount
      || !isMarketAiSelectionReviewHitRate(
        item.absoluteHitRatePct,
        Number(item.absoluteHitCount),
        Number(item.absoluteSampleCount),
      )
      || !isMarketAiSelectionReviewHitRate(
        item.benchmarkHitRatePct,
        Number(item.benchmarkHitCount),
        Number(item.benchmarkSampleCount),
      )
      || !isMarketAiSelectionNonNegativeInteger(item.absoluteHitCount)
      || !isMarketAiSelectionNonNegativeInteger(item.absoluteSampleCount)
      || item.absoluteHitCount > item.absoluteSampleCount
      || !isMarketAiSelectionNonNegativeInteger(item.benchmarkHitCount)
      || !isMarketAiSelectionNonNegativeInteger(item.benchmarkSampleCount)
      || item.benchmarkHitCount > item.benchmarkSampleCount
      || item.benchmarkSampleCount > item.absoluteSampleCount
      || (item.reviewedSelectionCount === 0
        && (item.absoluteSampleCount !== 0 || item.benchmarkSampleCount !== 0))
    ) {
      return false;
    }
    profiles.add(item.profile as MarketAiSelectionProfile);
    styleSelectionCount += item.selectionCount;
  }
  return styleSelectionCount === value.selectionCount;
}

function isMarketAiSelectionQualityRate(
  value: unknown,
  numeratorKey: string,
  denominatorKey: string,
  rateKey: string,
): value is Record<string, number | null> {
  if (!hasExactAiReviewEnvelopeKeys(value, [numeratorKey, denominatorKey, rateKey])) {
    return false;
  }
  const numerator = value[numeratorKey];
  const denominator = value[denominatorKey];
  return isMarketAiSelectionNonNegativeInteger(numerator)
    && isMarketAiSelectionNonNegativeInteger(denominator)
    && numerator <= denominator
    && isMarketAiSelectionReviewHitRate(value[rateKey], numerator, denominator);
}

function isMarketAiSelectionNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

const marketAiSelectionReviewItemBaseKeys = [
  "candidateEvidenceId",
  "rank",
  "tier",
  "market",
  "symbol",
  "timeframe",
  "horizon",
  "horizonBars",
  "referenceAt",
  "referencePrice"
] as const;

export function isMarketAiSelectionReviewPayload(
  value: unknown,
  request: MarketAiSelectionReviewRequest
): value is MarketAiSelectionReview {
  if (!hasExactAiReviewEnvelopeKeys(value, [
    "schemaVersion",
    "recordType",
    "reviewId",
    "selectionId",
    "selectionRecordHash",
    "createdAt",
    "market",
    "timeframe",
    "benchmark",
    "items",
    "summary",
    "boundary",
    "recordHash"
  ])) {
    return false;
  }
  const schemaVersion = value.schemaVersion;
  if (
    (schemaVersion !== 1 && schemaVersion !== 2)
    || value.recordType !== "aiqt.marketAiSelectionReview"
    || typeof value.reviewId !== "string"
    || !value.reviewId.trim()
    || value.selectionId !== request.selectionId
    || !isSha256Text(value.selectionRecordHash)
    || typeof value.createdAt !== "string"
    || !value.createdAt.trim()
    || !isOffsetDateTime(value.createdAt)
    || value.timeframe !== "1d"
    || !isSha256Text(value.recordHash)
  ) {
    return false;
  }
  if (
    !isMarket(value.market)
    || !hasExactAiReviewEnvelopeKeys(value.benchmark, ["runId", "symbol", "auditHash"])
  ) {
    return false;
  }
  const market = value.market;
  const benchmark = value.benchmark;
  if (
    benchmark.runId !== request.benchmarkRunId
    || typeof benchmark.symbol !== "string"
    || !benchmark.symbol.trim()
    || !isSha256Text(benchmark.auditHash)
  ) {
    return false;
  }
  const benchmarkSymbol = benchmark.symbol;
  if (
    !Array.isArray(value.items)
    || value.items.length < 1
    || value.items.length > 5
    || !value.items.every((item) => isMarketAiSelectionReviewItem(
      item,
      market,
      request.benchmarkRunId,
      benchmarkSymbol,
      Date.parse(String(value.createdAt)),
      schemaVersion,
    ))
    || !isMarketAiSelectionReviewSummary(value.summary, value.items)
    || !isMarketAiSelectionReviewBoundary(value.boundary)
  ) {
    return false;
  }
  const evidenceIds = new Set<string>();
  const ranks = new Set<number>();
  const horizon = value.items[0]?.horizon;
  return value.items.every((item) => {
    if (
      evidenceIds.has(item.candidateEvidenceId)
      || ranks.has(item.rank)
      || item.horizon !== horizon
    ) {
      return false;
    }
    evidenceIds.add(item.candidateEvidenceId);
    ranks.add(item.rank);
    return true;
  });
}

function isMarketAiSelectionReviewItem(
  value: unknown,
  market: Market,
  benchmarkRunId: string,
  benchmarkSymbol: string,
  createdAtMs: number,
  schemaVersion: 1 | 2,
): value is MarketAiSelectionReviewItem {
  if (!isPlainRecord(value)) {
    return false;
  }
  const hasResearchRun = Object.prototype.hasOwnProperty.call(value, "researchRunId");
  const hasMaturity = Object.prototype.hasOwnProperty.call(value, "completedBars")
    || Object.prototype.hasOwnProperty.call(value, "remainingBars");
  const hasOutcome = Object.prototype.hasOwnProperty.call(value, "returnPct");
  const outcomeKeys = [
    "completedBars", "remainingBars", "outcomeAt", "outcomePrice", "returnPct",
    "absoluteHit", "outcomeSource", "outcomeAdjustmentMode", "outcomeDataHash"
  ];
  const statusKeys = value.status === "completed"
    ? [
        "status", "researchRunId", "completedBars", "remainingBars", "outcomeAt",
        "outcomePrice", "returnPct", "absoluteHit", "outcomeSource",
        "outcomeAdjustmentMode", "outcomeDataHash", "benchmarkRunId",
        "benchmarkSymbol",
        ...(schemaVersion === 2
          ? ["benchmarkReferencePrice", "benchmarkOutcomePrice"]
          : []),
        "benchmarkReturnPct", "relativeReturnPct", "benchmarkHit",
        "benchmarkSource", "benchmarkAdjustmentMode", "benchmarkDataHash"
      ]
    : value.status === "observing"
      ? ["status", "researchRunId", "completedBars", "remainingBars"]
      : value.status === "data_insufficient"
        ? [
            "status",
            "reason",
            ...(hasResearchRun ? ["researchRunId"] : []),
            ...(hasOutcome ? outcomeKeys : hasMaturity ? ["completedBars", "remainingBars"] : [])
          ]
        : [];
  if (
    statusKeys.length === 0
    || !hasExactAiReviewEnvelopeKeys(value, [
      ...marketAiSelectionReviewItemBaseKeys,
      ...statusKeys
    ])
    || typeof value.candidateEvidenceId !== "string"
    || !value.candidateEvidenceId.trim()
    || !Number.isInteger(value.rank)
    || Number(value.rank) < 1
    || Number(value.rank) > 5
    || (
      value.tier !== "priority_research"
      && value.tier !== "watch"
      && value.tier !== "insufficient_evidence"
    )
    || value.market !== market
    || typeof value.symbol !== "string"
    || !value.symbol.trim()
    || value.timeframe !== "1d"
    || (
      value.horizon !== "short"
      && value.horizon !== "medium"
      && value.horizon !== "long"
    )
    || value.horizonBars !== marketAiSelectionReviewHorizonBars(market, value.horizon)
    || typeof value.referenceAt !== "string"
    || !value.referenceAt.trim()
    || !isOffsetDateTime(value.referenceAt)
    || Date.parse(value.referenceAt) > createdAtMs
    || !isPositiveFiniteNumber(value.referencePrice)
    || (hasResearchRun && (
      typeof value.researchRunId !== "string"
      || !value.researchRunId.trim()
    ))
  ) {
    return false;
  }
  const referenceAtMs = Date.parse(value.referenceAt);
  if (value.status === "data_insufficient") {
    if (typeof value.reason !== "string" || !value.reason.trim()) {
      return false;
    }
    const unknownMaturityReasons = new Set([
      "research_evidence_not_bound",
      "outcome_bars_unavailable",
      "outcome_bars_incomplete",
      "outcome_bar_context_mismatch",
      "reference_time_invalid",
    ]);
    const optionalMaturityReasons = new Set([
      "outcome_reference_bar_missing",
      "outcome_reference_price_mismatch",
    ]);
    const requiredMaturityWithoutOutcomeReasons = new Set(["outcome_bar_gap"]);
    const benchmarkReasons = new Set([
      "benchmark_must_use_different_symbol",
      "benchmark_bars_unavailable",
      "benchmark_bars_incomplete",
      "benchmark_adjustment_mode_mismatch",
      "benchmark_bar_context_mismatch",
      "benchmark_same_period_coverage_missing",
    ]);
    const outcomeValidationReasons = new Set([
      "review_price_invalid",
      "review_bar_window_invalid",
    ]);
    if (unknownMaturityReasons.has(value.reason)) {
      return !hasMaturity && !hasOutcome;
    }
    if (optionalMaturityReasons.has(value.reason)) {
      if (hasOutcome) {
        return false;
      }
      if (!hasMaturity) {
        return true;
      }
    }
    if (requiredMaturityWithoutOutcomeReasons.has(value.reason) && hasOutcome) {
      return false;
    }
    if (
      !optionalMaturityReasons.has(value.reason)
      && !requiredMaturityWithoutOutcomeReasons.has(value.reason)
      && !benchmarkReasons.has(value.reason)
      && !outcomeValidationReasons.has(value.reason)
    ) {
      return false;
    }
    if (!hasMaturity) {
      return false;
    }
    if (
      !Number.isInteger(value.completedBars)
      || value.completedBars !== value.horizonBars
      || value.remainingBars !== 0
    ) {
      return false;
    }
    if (
      optionalMaturityReasons.has(value.reason)
      || requiredMaturityWithoutOutcomeReasons.has(value.reason)
    ) {
      return true;
    }
    return benchmarkReasons.has(value.reason)
      ? hasOutcome && isMarketAiSelectionReviewOutcome(value, referenceAtMs, createdAtMs)
      : !hasOutcome || isMarketAiSelectionReviewOutcome(value, referenceAtMs, createdAtMs);
  }
  if (
    !Number.isInteger(value.completedBars)
    || Number(value.completedBars) < 0
    || !Number.isInteger(value.remainingBars)
    || Number(value.remainingBars) < 0
    || Number(value.completedBars) + Number(value.remainingBars) !== value.horizonBars
  ) {
    return false;
  }
  if (value.status === "observing") {
    return Number(value.completedBars) < value.horizonBars
      && Number(value.remainingBars) > 0;
  }
  return isMarketAiSelectionReviewOutcome(value, referenceAtMs, createdAtMs)
    && value.benchmarkRunId === benchmarkRunId
    && value.benchmarkSymbol === benchmarkSymbol
    && value.symbol !== benchmarkSymbol
    && isFiniteNumber(value.benchmarkReturnPct)
    && (schemaVersion === 1 || (
      isPositiveFiniteNumber(value.benchmarkReferencePrice)
      && isPositiveFiniteNumber(value.benchmarkOutcomePrice)
      && Math.abs(
        value.benchmarkReturnPct
        - (value.benchmarkOutcomePrice / value.benchmarkReferencePrice - 1) * 100
      ) <= 0.500001e-6
    ))
    && isFiniteNumber(value.relativeReturnPct)
    && isFiniteNumber(value.returnPct)
    && Math.abs(value.relativeReturnPct - (value.returnPct - value.benchmarkReturnPct)) < 0.000001
    && typeof value.benchmarkHit === "boolean"
    && value.benchmarkHit === (value.relativeReturnPct > 0)
    && isNonEmptyText(value.benchmarkSource)
    && isNonEmptyText(value.benchmarkAdjustmentMode)
    && value.benchmarkAdjustmentMode === value.outcomeAdjustmentMode
    && isSha256Text(value.benchmarkDataHash);
}

function isMarketAiSelectionReviewOutcome(
  value: Record<string, unknown>,
  referenceAtMs: number,
  createdAtMs: number
): boolean {
  if (
    !Number.isInteger(value.completedBars)
    || value.completedBars !== value.horizonBars
    || value.remainingBars !== 0
    || !isOffsetDateTime(value.outcomeAt)
    || Date.parse(value.outcomeAt) <= referenceAtMs
    || Date.parse(value.outcomeAt) > createdAtMs
    || !isPositiveFiniteNumber(value.referencePrice)
    || !isPositiveFiniteNumber(value.outcomePrice)
    || !isFiniteNumber(value.returnPct)
    || typeof value.absoluteHit !== "boolean"
    || value.absoluteHit !== (value.returnPct > 0)
    || !isNonEmptyText(value.outcomeSource)
    || !isNonEmptyText(value.outcomeAdjustmentMode)
    || !isSha256Text(value.outcomeDataHash)
  ) {
    return false;
  }
  const rawReturn = (value.outcomePrice / value.referencePrice - 1) * 100;
  return Math.abs(value.returnPct - rawReturn) <= 0.500001e-6;
}

function isMarketAiSelectionReviewSummary(
  value: unknown,
  items: MarketAiSelectionReviewItem[]
): value is MarketAiSelectionReview["summary"] {
  if (!hasExactAiReviewEnvelopeKeys(value, [
    "recommendationCount",
    "maturedCount",
    "observingCount",
    "dataInsufficientCount",
    "absoluteHitCount",
    "absoluteSampleCount",
    "absoluteHitRatePct",
    "benchmarkHitCount",
    "benchmarkSampleCount",
    "benchmarkHitRatePct"
  ])) {
    return false;
  }
  const matured = items.filter(
    (item) => item.completedBars === item.horizonBars
  );
  const absoluteSampleCount = items.filter(
    (item) => "absoluteHit" in item && typeof item.absoluteHit === "boolean"
  ).length;
  const benchmarkSampleCount = items.filter(
    (item) => item.status === "completed"
  ).length;
  const absoluteHits = items.filter(
    (item) => "absoluteHit" in item && item.absoluteHit === true
  ).length;
  const benchmarkHits = items.filter(
    (item) => item.status === "completed" && item.benchmarkHit
  ).length;
  return value.recommendationCount === items.length
    && value.maturedCount === matured.length
    && value.observingCount === items.filter((item) => item.status === "observing").length
    && value.dataInsufficientCount === items.filter(
      (item) => item.status === "data_insufficient"
    ).length
    && value.absoluteHitCount === absoluteHits
    && value.absoluteSampleCount === absoluteSampleCount
    && isMarketAiSelectionReviewHitRate(
      value.absoluteHitRatePct,
      absoluteHits,
      absoluteSampleCount
    )
    && value.benchmarkHitCount === benchmarkHits
    && value.benchmarkSampleCount === benchmarkSampleCount
    && isMarketAiSelectionReviewHitRate(
      value.benchmarkHitRatePct,
      benchmarkHits,
      benchmarkSampleCount
    );
}

function isMarketAiSelectionReviewBoundary(
  value: unknown
): value is MarketAiSelectionReview["boundary"] {
  return hasExactAiReviewEnvelopeKeys(value, [
    "researchOnly",
    "affectsRisk",
    "affectsAuthorization",
    "affectsPermissions",
    "affectsOrderRouting",
    "orderSubmissionAllowed",
    "routeExecuted"
  ])
    && value.researchOnly === true
    && value.affectsRisk === false
    && value.affectsAuthorization === false
    && value.affectsPermissions === false
    && value.affectsOrderRouting === false
    && value.orderSubmissionAllowed === false
    && value.routeExecuted === false;
}

function marketAiSelectionReviewHorizonBars(
  market: Market,
  horizon: MarketAiSelectionHorizon
): number {
  if (market === "crypto") {
    return { short: 7, medium: 30, long: 90 }[horizon];
  }
  return { short: 5, medium: 20, long: 60 }[horizon];
}

function isMarketAiSelectionReviewHitRate(
  value: unknown,
  hits: number,
  samples: number
): boolean {
  if (samples === 0) {
    return hits === 0 && value === null;
  }
  return isFiniteNumber(value)
    && Math.abs(value - Math.round(hits / samples * 10_000) / 100) < 0.000001;
}

function isSha256Text(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function isOffsetDateTime(value: unknown): value is string {
  return typeof value === "string"
    && /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function isMarketAiSelectionSnapshot(
  value: unknown
): value is MarketAiSelectionResult["marketSnapshot"] {
  return hasExactAiReviewEnvelopeKeys(value, [
    "snapshotHash",
    "observedAt",
    "source",
    "freshness",
    "warnings"
  ])
    && typeof value.snapshotHash === "string"
    && Boolean(value.snapshotHash.trim())
    && typeof value.observedAt === "string"
    && Boolean(value.observedAt.trim())
    && typeof value.source === "string"
    && Boolean(value.source.trim())
    && (
      value.freshness === "fresh"
      || value.freshness === "stale"
      || value.freshness === "partial"
    )
    && Array.isArray(value.warnings)
    && value.warnings.every((warning) => typeof warning === "string");
}

function isMarketAiSelectionCandidate(
  value: unknown,
  market: Market
): value is MarketAiSelectionCandidate {
  if (!hasExactAiReviewEnvelopeKeys(value, [
    "evidenceId",
    "market",
    "symbol",
    "name",
    "score",
    "pillarScores",
    "fundamentalPeriod",
    "dataGaps"
  ])) {
    return false;
  }
  return typeof value.evidenceId === "string"
    && Boolean(value.evidenceId.trim())
    && value.market === market
    && typeof value.symbol === "string"
    && Boolean(value.symbol.trim())
    && typeof value.name === "string"
    && Boolean(value.name.trim())
    && isMarketAiSelectionScore(value.score)
    && isPlainRecord(value.pillarScores)
    && Object.keys(value.pillarScores).length > 0
    && Object.values(value.pillarScores).every(isMarketAiSelectionScore)
    && (value.fundamentalPeriod === null || typeof value.fundamentalPeriod === "string")
    && Array.isArray(value.dataGaps)
    && value.dataGaps.every((gap) => typeof gap === "string");
}

function isMarketAiSelectionRecommendation(
  value: unknown,
  market: Market
): value is MarketAiSelectionRecommendation {
  return hasExactAiReviewEnvelopeKeys(value, [
    "evidenceId",
    "market",
    "symbol",
    "name",
    "score",
    "pillarScores",
    "fundamentalPeriod",
    "dataGaps",
    "rank",
    "tier",
    "reasons",
    "risks",
    "evidenceReferences",
    "summary"
  ])
    && isMarketAiSelectionCandidate({
      evidenceId: value.evidenceId,
      market: value.market,
      symbol: value.symbol,
      name: value.name,
      score: value.score,
      pillarScores: value.pillarScores,
      fundamentalPeriod: value.fundamentalPeriod,
      dataGaps: value.dataGaps
    }, market)
    && Number.isInteger(value.rank)
    && Number(value.rank) >= 1
    && Number(value.rank) <= 5
    && (
      value.tier === "priority_research"
      || value.tier === "watch"
      || value.tier === "insufficient_evidence"
    )
    && Array.isArray(value.reasons)
    && value.reasons.every((reason) => typeof reason === "string")
    && Array.isArray(value.risks)
    && value.risks.every((risk) => typeof risk === "string")
    && Array.isArray(value.evidenceReferences)
    && value.evidenceReferences.every((reference) => typeof reference === "string")
    && typeof value.summary === "string";
}

function isMarketAiSelectionExclusion(
  value: unknown,
  market: Market
): value is MarketAiSelectionResult["exclusions"][number] {
  return hasExactAiReviewEnvelopeKeys(value, ["market", "symbol", "name", "reason"])
    && value.market === market
    && typeof value.symbol === "string"
    && typeof value.name === "string"
    && typeof value.reason === "string";
}

function isMarketAiSelectionGeneration(
  value: unknown,
  request: MarketAiSelectionRequest
): value is MarketAiSelectionResult["generation"] {
  if (!hasExactAiReviewEnvelopeKeys(value, [
    "requestedProvider",
    "usedProvider",
    "status",
    "fallbackUsed",
    "model",
    "sanitizedBaseUrl",
    "latencyMs",
    "externalDataApproved",
    "outboundFields",
    "errorCode"
  ])) {
    return false;
  }
  if (
    !isAiReviewProviderId(value.requestedProvider)
    || !isAiReviewProviderId(value.usedProvider)
    || value.requestedProvider !== request.providerId
    || typeof value.fallbackUsed !== "boolean"
    || (value.model !== null && typeof value.model !== "string")
    || (value.sanitizedBaseUrl !== null && typeof value.sanitizedBaseUrl !== "string")
    || !Number.isInteger(value.latencyMs)
    || Number(value.latencyMs) < 0
    || value.externalDataApproved !== request.externalDataApproved
    || !Array.isArray(value.outboundFields)
    || !value.outboundFields.every((field) => typeof field === "string")
    || (value.errorCode !== null && typeof value.errorCode !== "string")
  ) {
    return false;
  }
  if (request.providerId === "local") {
    return value.usedProvider === "local"
      && value.status === "skipped"
      && value.fallbackUsed === false
      && value.externalDataApproved === false
      && value.outboundFields.length === 0
      && value.errorCode === null;
  }
  if (!value.externalDataApproved) {
    return false;
  }
  return value.status === "completed"
    ? value.usedProvider === value.requestedProvider
      && value.fallbackUsed === false
      && value.outboundFields.length > 0
      && value.errorCode === null
    : value.status === "failed"
      ? value.usedProvider === "local"
        && value.fallbackUsed === true
        && typeof value.errorCode === "string"
        && Boolean(value.errorCode)
      : false;
}

function isMarketAiSelectionBoundary(
  value: unknown
): value is MarketAiSelectionResult["boundary"] {
  return hasExactAiReviewEnvelopeKeys(value, [
    "researchOnly",
    "watchlistModified",
    "researchStarted",
    "riskModified",
    "autoTradingModified",
    "orderSubmissionAllowed",
    "routeExecuted"
  ])
    && value.researchOnly === true
    && value.watchlistModified === false
    && value.researchStarted === false
    && value.riskModified === false
    && value.autoTradingModified === false
    && value.orderSubmissionAllowed === false
    && value.routeExecuted === false;
}

function isMarketAiSelectionScore(value: unknown): value is number {
  return typeof value === "number"
    && Number.isFinite(value)
    && value >= 0
    && value <= 100;
}

function hasExactAiReviewEnvelopeKeys(
  value: unknown,
  keys: readonly string[]
): value is Record<string, unknown> {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every((key) => key in value);
}

function isAiReviewProviderId(value: unknown): value is AiReviewProviderId {
  return value === "local"
    || value === "openai"
    || value === "openai-compatible"
    || value === "ollama";
}

function isMarket(value: unknown): value is Market {
  return value === "ashare" || value === "us" || value === "crypto";
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function buildMarketAiSelectionsUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/market/ai-selections");
}

export function buildMarketAiSelectionReviewsUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/market/ai-selection-reviews");
}

export function buildMarketAiSelectionStatisticsUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/market/ai-selection-statistics");
}

export async function createMarketAiSelection(
  baseUrl: string,
  request: MarketAiSelectionRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketAiSelectionLoadResult> {
  try {
    const response = await fetcher(buildMarketAiSelectionsUrl(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        market: request.market,
        universeMode: request.universeMode,
        discovery: request.discovery,
        profile: request.profile,
        horizon: request.horizon,
        providerId: request.providerId,
        externalDataApproved: request.externalDataApproved
      })
    });
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!response.ok) {
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
    if (!isMarketAiSelectionPayload(payload, request)) {
      throw new Error("Invalid market AI selection contract");
    }
    return {
      selection: payload,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown market AI selection error"
    };
  }
}

export async function createMarketAiSelectionReview(
  baseUrl: string,
  request: MarketAiSelectionReviewRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketAiSelectionReviewLoadResult> {
  try {
    const response = await fetcher(buildMarketAiSelectionReviewsUrl(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        selectionId: request.selectionId,
        benchmarkRunId: request.benchmarkRunId
      })
    });
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!response.ok) {
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
    if (
      !hasExactAiReviewEnvelopeKeys(payload, ["review"])
      || !isMarketAiSelectionReviewPayload(payload.review, request)
    ) {
      throw new Error("Invalid market AI selection review contract");
    }
    return {
      review: payload.review,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error
        ? error.message
        : "Unknown market AI selection review error"
    };
  }
}

export async function loadMarketAiSelectionQualityStatistics(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketAiSelectionQualityStatisticsLoadResult> {
  try {
    const response = await fetcher(buildMarketAiSelectionStatisticsUrl(baseUrl));
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
    if (
      !hasExactAiReviewEnvelopeKeys(payload, ["statistics"])
      || !isMarketAiSelectionQualityStatistics(payload.statistics)
    ) {
      throw new Error("Invalid market AI selection statistics contract");
    }
    return { statistics: payload.statistics, source: "core" };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error
        ? error.message
        : "Unknown market AI selection statistics error"
    };
  }
}
