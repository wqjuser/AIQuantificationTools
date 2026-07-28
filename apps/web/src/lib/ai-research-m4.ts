export type AiResearchClaimKind = "fact" | "calculation" | "assumption" | "model_inference";
export type AiResearchRecommendationStance = "bullish" | "bearish" | "neutral";
export type FinancialFactId =
  | "revenue"
  | "net_profit"
  | "operating_cash_flow"
  | "total_assets"
  | "shareholders_equity"
  | "eps";

export interface FinancialFactObservationInput {
  source: string;
  value: number;
  period: string;
  unit: string;
  observedAt: string;
}

export interface FinancialFactInput {
  factId: FinancialFactId;
  label: string;
  period: string;
  unit: string;
  primary: FinancialFactObservationInput;
  comparison: FinancialFactObservationInput;
}

export interface CreateAiResearchEvidenceRequest {
  recommendation: {
    stance: AiResearchRecommendationStance;
    horizonBars: number;
  };
  multiViewEnabled: boolean;
  financialFacts: FinancialFactInput[];
}

export interface AiResearchClaim {
  claimId: string;
  kind: AiResearchClaimKind;
  text: string;
  evidenceReferences: string[];
}

export interface AiResearchEvidence {
  schemaVersion: 1;
  recordType: "aiqt.aiResearchEvidence";
  researchEvidenceId: string;
  aiReviewId: string;
  sourceRunId: string;
  createdAt: string;
  market: string;
  symbol: string;
  timeframe: string;
  snapshotHash: string;
  claims: AiResearchClaim[];
  informationRichness: {
    score: number;
    level: "low" | "medium" | "high";
    claimKindCount: number;
    evidenceKindCount: number;
    gaps: string[];
    basis: string;
  };
  investmentCertainty: {
    level: "low" | "medium";
    basis: string;
    derivedFromInformationRichness: false;
  };
  financialFactReport: {
    status: "not_applicable" | "unavailable" | "agreement" | "warning" | "blocked";
    facts: Array<FinancialFactInput & {
      relativeDifferencePct: number;
      warningThresholdPct: 0.5;
      blockedThresholdPct: 5;
      status: "agreement" | "warning" | "blocked";
      mismatchReasons: Array<"reporting_period_mismatch" | "unit_mismatch">;
      valuesMerged: false;
    }>;
    valuesMerged: false;
    summary: string;
  };
  multiView: {
    status: "disabled" | "completed";
    engine: "not_run" | "existing_external_assessment" | "deterministic_evidence_projection";
    roles: Array<{
      role: "bullish" | "bearish" | "neutral";
      thesis: string;
      evidenceReferences: string[];
    }>;
  };
  recommendation: {
    recommendationId: string;
    stance: AiResearchRecommendationStance;
    declaredHorizonBars: number;
    timeframe: string;
    referenceAt: string;
    referencePrice: number;
    snapshotHash: string;
    aiReviewId: string;
    researchOnly: true;
  };
  priorOutcomeLessons: Array<{
    outcomeId: string;
    recommendationId: string;
    outcomeAt: string;
    stanceAdjustedReturnPct: number;
    alphaPct: number;
    lesson: string;
  }>;
  boundary: AiResearchBoundary;
  recordHash: string;
}

export interface AiResearchOutcome {
  schemaVersion: 1;
  recordType: "aiqt.aiResearchOutcome";
  outcomeId: string;
  researchEvidenceId: string;
  recommendationId: string;
  aiReviewId: string;
  sourceRunId: string;
  snapshotHash: string;
  createdAt: string;
  status: "completed";
  market: string;
  symbol: string;
  timeframe: string;
  stance: AiResearchRecommendationStance;
  horizonBars: number;
  referenceAt: string;
  outcomeAt: string;
  referencePrice: number;
  outcomePrice: number;
  rawReturnPct: number;
  stanceAdjustedReturnPct: number;
  adverseExcursionPct: number;
  benchmarkRunId: string;
  benchmarkSymbol: string;
  benchmarkReturnPct: number;
  alphaPct: number;
  outcomeRunId: string;
  outcomeSnapshotHash: string;
  benchmarkSnapshotHash: string;
  lesson: string;
  boundary: AiResearchBoundary;
  recordHash: string;
}

export interface EvaluateAiResearchOutcomeRequest {
  researchEvidenceId: string;
  outcomeRunId: string;
  benchmarkRunId: string;
}

export interface AiResearchBoundary {
  researchContextOnly: true;
  affectsRisk: false;
  affectsAuthorization: false;
  affectsPermissions: false;
  affectsOrderRouting: false;
}

const hashes = /^[0-9a-f]{64}$/;
const claimKinds = new Set<AiResearchClaimKind>(["fact", "calculation", "assumption", "model_inference"]);
const stances = new Set<AiResearchRecommendationStance>(["bullish", "bearish", "neutral"]);

export function isAiResearchEvidence(value: unknown): value is AiResearchEvidence {
  if (!hasExactKeys(value, [
    "schemaVersion", "recordType", "researchEvidenceId", "aiReviewId", "sourceRunId", "createdAt",
    "market", "symbol", "timeframe", "snapshotHash", "claims", "informationRichness",
    "investmentCertainty", "financialFactReport", "multiView", "recommendation",
    "priorOutcomeLessons", "boundary", "recordHash"
  ]) || value.schemaVersion !== 1 || value.recordType !== "aiqt.aiResearchEvidence"
    || !text(value.researchEvidenceId) || !text(value.aiReviewId) || !text(value.sourceRunId)
    || !timestamp(value.createdAt) || !text(value.market) || !text(value.symbol) || !text(value.timeframe)
    || !hash(value.snapshotHash) || !hash(value.recordHash)
    || !Array.isArray(value.claims) || !value.claims.every(isClaim)
    || new Set(value.claims.map((item) => item.kind)).size !== claimKinds.size
    || !isInformationRichness(value.informationRichness)
    || !isInvestmentCertainty(value.investmentCertainty)
    || !isFinancialFactReport(value.financialFactReport)
    || !isMultiView(value.multiView)
    || !isRecommendation(value.recommendation)
    || value.recommendation.aiReviewId !== value.aiReviewId
    || value.recommendation.snapshotHash !== value.snapshotHash
    || !Array.isArray(value.priorOutcomeLessons) || !value.priorOutcomeLessons.every(isPriorLesson)
    || !isBoundary(value.boundary)) {
    return false;
  }
  return [...claimKinds].every((kind) =>
    value.claims.some((claim: AiResearchClaim) => claim.kind === kind)
  );
}

export function isAiResearchOutcome(value: unknown): value is AiResearchOutcome {
  if (!hasExactKeys(value, [
    "schemaVersion", "recordType", "outcomeId", "researchEvidenceId", "recommendationId", "aiReviewId",
    "sourceRunId", "snapshotHash", "createdAt", "status", "market", "symbol", "timeframe", "stance",
    "horizonBars", "referenceAt", "outcomeAt", "referencePrice", "outcomePrice", "rawReturnPct",
    "stanceAdjustedReturnPct", "adverseExcursionPct", "benchmarkRunId", "benchmarkSymbol",
    "benchmarkReturnPct", "alphaPct", "outcomeRunId", "outcomeSnapshotHash", "benchmarkSnapshotHash",
    "lesson", "boundary", "recordHash"
  ]) || value.schemaVersion !== 1 || value.recordType !== "aiqt.aiResearchOutcome"
    || value.status !== "completed" || !text(value.outcomeId) || !text(value.researchEvidenceId)
    || !text(value.recommendationId) || !text(value.aiReviewId) || !text(value.sourceRunId)
    || !hash(value.snapshotHash) || !timestamp(value.createdAt) || !text(value.market)
    || !text(value.symbol) || !text(value.timeframe) || !stances.has(value.stance as AiResearchRecommendationStance)
    || !integer(value.horizonBars, 1, 250) || !timestamp(value.referenceAt) || !timestamp(value.outcomeAt)
    || !finite(value.referencePrice) || !finite(value.outcomePrice) || !finite(value.rawReturnPct)
    || !finite(value.stanceAdjustedReturnPct) || !finite(value.adverseExcursionPct)
    || !text(value.benchmarkRunId) || !text(value.benchmarkSymbol) || !finite(value.benchmarkReturnPct)
    || !finite(value.alphaPct) || !text(value.outcomeRunId) || !hash(value.outcomeSnapshotHash)
    || !hash(value.benchmarkSnapshotHash) || !text(value.lesson) || !isBoundary(value.boundary)
    || !hash(value.recordHash)) {
    return false;
  }
  return true;
}

function isClaim(value: unknown): value is AiResearchClaim {
  return hasExactKeys(value, ["claimId", "kind", "text", "evidenceReferences"])
    && text(value.claimId) && claimKinds.has(value.kind as AiResearchClaimKind) && text(value.text)
    && textList(value.evidenceReferences);
}

function isInformationRichness(value: unknown): boolean {
  return hasExactKeys(value, ["score", "level", "claimKindCount", "evidenceKindCount", "gaps", "basis"])
    && integer(value.score, 0, 100) && ["low", "medium", "high"].includes(String(value.level))
    && integer(value.claimKindCount, 1, 4) && integer(value.evidenceKindCount, 1, 20)
    && textList(value.gaps) && text(value.basis);
}

function isInvestmentCertainty(value: unknown): boolean {
  return hasExactKeys(value, ["level", "basis", "derivedFromInformationRichness"])
    && ["low", "medium"].includes(String(value.level)) && text(value.basis)
    && value.derivedFromInformationRichness === false;
}

function isFinancialFactReport(value: unknown): boolean {
  return hasExactKeys(value, ["status", "facts", "valuesMerged", "summary"])
    && ["not_applicable", "unavailable", "agreement", "warning", "blocked"].includes(String(value.status))
    && Array.isArray(value.facts) && value.facts.every(isFinancialFactRow)
    && value.valuesMerged === false && text(value.summary);
}

function isFinancialFactRow(value: unknown): boolean {
  return hasExactKeys(value, [
    "factId", "label", "period", "unit", "primary", "comparison", "relativeDifferencePct",
    "warningThresholdPct", "blockedThresholdPct", "status", "mismatchReasons", "valuesMerged"
  ]) && text(value.factId) && text(value.label) && text(value.period) && text(value.unit)
    && isObservation(value.primary) && isObservation(value.comparison)
    && finite(value.relativeDifferencePct) && value.warningThresholdPct === 0.5
    && value.blockedThresholdPct === 5
    && ["agreement", "warning", "blocked"].includes(String(value.status))
    && Array.isArray(value.mismatchReasons)
    && value.mismatchReasons.every((reason: unknown) =>
      reason === "reporting_period_mismatch" || reason === "unit_mismatch"
    )
    && value.valuesMerged === false;
}

function isObservation(value: unknown): boolean {
  return hasExactKeys(value, ["source", "value", "period", "unit", "observedAt"])
    && text(value.source) && finite(value.value) && text(value.period) && text(value.unit)
    && timestamp(value.observedAt);
}

function isMultiView(value: unknown): boolean {
  return hasExactKeys(value, ["status", "engine", "roles"])
    && ["disabled", "completed"].includes(String(value.status))
    && ["not_run", "existing_external_assessment", "deterministic_evidence_projection"].includes(String(value.engine))
    && Array.isArray(value.roles) && value.roles.every((role) =>
      hasExactKeys(role, ["role", "thesis", "evidenceReferences"])
      && stances.has(role.role as AiResearchRecommendationStance)
      && text(role.thesis) && textList(role.evidenceReferences)
    )
    && (value.status === "disabled"
      ? value.roles.length === 0 && value.engine === "not_run"
      : value.roles.length === 3);
}

function isRecommendation(value: unknown): boolean {
  return hasExactKeys(value, [
    "recommendationId", "stance", "declaredHorizonBars", "timeframe", "referenceAt",
    "referencePrice", "snapshotHash", "aiReviewId", "researchOnly"
  ]) && text(value.recommendationId) && stances.has(value.stance as AiResearchRecommendationStance)
    && integer(value.declaredHorizonBars, 1, 250) && text(value.timeframe)
    && timestamp(value.referenceAt) && finite(value.referencePrice) && hash(value.snapshotHash)
    && text(value.aiReviewId) && value.researchOnly === true;
}

function isPriorLesson(value: unknown): boolean {
  return hasExactKeys(value, [
    "outcomeId", "recommendationId", "outcomeAt", "stanceAdjustedReturnPct", "alphaPct", "lesson"
  ]) && text(value.outcomeId) && text(value.recommendationId) && timestamp(value.outcomeAt)
    && finite(value.stanceAdjustedReturnPct) && finite(value.alphaPct) && text(value.lesson);
}

function isBoundary(value: unknown): value is AiResearchBoundary {
  return hasExactKeys(value, [
    "researchContextOnly", "affectsRisk", "affectsAuthorization", "affectsPermissions", "affectsOrderRouting"
  ]) && value.researchContextOnly === true && value.affectsRisk === false
    && value.affectsAuthorization === false && value.affectsPermissions === false
    && value.affectsOrderRouting === false;
}

function hasExactKeys(value: unknown, keys: string[]): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function textList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(text);
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function integer(value: unknown, minimum: number, maximum: number): value is number {
  return Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum;
}

function timestamp(value: unknown): value is string {
  return text(value) && Number.isFinite(Date.parse(value));
}

function hash(value: unknown): value is string {
  return typeof value === "string" && hashes.test(value);
}
