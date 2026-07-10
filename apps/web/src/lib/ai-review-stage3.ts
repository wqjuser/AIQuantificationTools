import type { StrategyExperimentListItem } from "./terminal-workbench";

export type AiReviewProviderId = "local" | "openai" | "openai-compatible" | "ollama";

export interface AiReviewProviderStatus {
  providerId: AiReviewProviderId;
  configured: boolean;
  model: string | null;
  sanitizedBaseUrl: string | null;
}

export type AiReviewStance = "supported" | "caution" | "blocked" | "insufficient_evidence";
export type AiReviewRiskSeverity = "low" | "medium" | "high" | "critical";
export type AiReviewConsistency = "consistent" | "mixed" | "divergent" | "insufficient";

export interface AiReviewAssessmentRisk {
  severity: AiReviewRiskSeverity;
  message: string;
  evidenceReferences: string[];
}

export interface AiReviewAssessment {
  stance: AiReviewStance;
  summary: string;
  risks: AiReviewAssessmentRisk[];
  invalidationConditions: string[];
  watchItems: string[];
  evidenceGaps: string[];
  consistency: AiReviewConsistency;
}

export interface AiReviewExperimentReference {
  experimentId: string;
  sourceRunId: string;
  strategyRevision: string;
  snapshotId: string;
  definitionHash: string;
  resultHash: string;
  selectedCandidateId: string;
  candidateRevision: string;
  canonicalDataHash: string;
  dataRange: { startAt: string; endAt: string };
}

export interface AiReviewEvidenceItem {
  id: string;
  kind: "experiment_context" | "strategy_definition" | "data_quality" | "candidate_metrics";
  value: Record<string, unknown>;
}

export interface AiReviewEvidenceBundle {
  schemaVersion: 1;
  mode: "single" | "comparison";
  primaryExperiment: AiReviewExperimentReference;
  comparisonExperiments: AiReviewExperimentReference[];
  strategyLineageKey: string;
  evidenceItems: AiReviewEvidenceItem[];
  safetyBoundary: {
    paperOnly: true;
    liveTradingAllowed: false;
    orderSubmissionAllowed: false;
  };
  evidenceHash: string;
}

export type AiReviewExternalErrorCode =
  | "ai_review_provider_not_configured"
  | "ai_review_provider_failed"
  | "timeout"
  | "http_error"
  | "response_too_large"
  | "invalid_json"
  | "invalid_schema"
  | "unknown_evidence_reference";

export interface AiReviewExternalAssessment {
  status: "completed" | "failed" | "skipped";
  provider: AiReviewProviderId;
  model: string | null;
  sanitizedBaseUrl: string | null;
  endpointHash: string | null;
  promptTemplateVersion: "aiqt-ai-review-v1";
  outputSchemaVersion: "aiqt-ai-review-assessment-v1";
  renderedPrompt: string;
  renderedPromptHash: string;
  evidenceHash: string;
  requestHash: string | null;
  responseHash: string | null;
  assessment: AiReviewAssessment | null;
  usage: Partial<Record<"inputTokens" | "outputTokens" | "totalTokens", number>> | null;
  latencyMs: number;
  error: { code: AiReviewExternalErrorCode; message: string } | null;
}

export interface AuthoritativeAiReviewRun {
  schemaVersion: 2;
  authority: "authoritative";
  recordType: "aiqt.aiReviewRun";
  aiReviewId: string;
  createdAt: string;
  mode: "single" | "comparison";
  primaryExperiment: AiReviewExperimentReference;
  comparisonExperiments: AiReviewExperimentReference[];
  strategyLineageKey: string;
  evidenceBundle: AiReviewEvidenceBundle;
  evidenceHash: string;
  deterministicAssessment: AiReviewAssessment;
  externalAssessment: AiReviewExternalAssessment;
  boundary: {
    purpose: "research_evidence_review_only";
    paperOnly: true;
    liveTradingAllowed: false;
    orderSubmissionAllowed: false;
  };
  recordHash: string;
}

export interface LegacyAiReviewHistoryRecord {
  schemaVersion: 1;
  authority: "legacy";
  recordType: "aiqt.aiReviewRun";
  aiReviewId: string;
  runId: string;
  createdAt: string;
  status: string;
  summary: Record<string, unknown>;
  dossier: Record<string, unknown>;
  citations: unknown[];
  rounds: unknown[];
  decisionLog: unknown[];
  boundary: string;
}

export type AiReviewHistoryRecord = AuthoritativeAiReviewRun | LegacyAiReviewHistoryRecord;

export type AiReviewDecisionStatus =
  | "accepted_for_research"
  | "revision_requested"
  | "rejected"
  | "insufficient_evidence";

export interface AiReviewDecision {
  schemaVersion: 1;
  recordType: "aiqt.aiReviewDecision";
  decisionId: string;
  aiReviewId: string;
  createdAt: string;
  operator: string;
  status: AiReviewDecisionStatus;
  rationale: string;
  supersedesDecisionId: string | null;
  reviewRecordHash: string;
  evidenceHash: string;
  boundary: {
    paperOnly: true;
    liveTradingAllowed: false;
    orderSubmissionAllowed: false;
  };
  recordHash: string;
}

export interface CreateAuthoritativeAiReviewRequest {
  primaryExperimentId: string;
  comparisonExperimentIds: string[];
  providerId: AiReviewProviderId;
  externalDataApproved: boolean;
}

export interface AppendAiReviewDecisionRequest {
  operator: string;
  status: AiReviewDecisionStatus;
  rationale: string;
  supersedesDecisionId: string | null;
}

export type ComparisonIneligibilityReason =
  | "primary"
  | "not-completed"
  | "context-mismatch"
  | "lineage-mismatch"
  | "already-selected"
  | "limit-reached";

export interface ComparisonEligibility {
  eligible: boolean;
  reason: ComparisonIneligibilityReason | null;
}

const providerIds = new Set<AiReviewProviderId>(["local", "openai", "openai-compatible", "ollama"]);
const stances = new Set<AiReviewStance>(["supported", "caution", "blocked", "insufficient_evidence"]);
const severities = new Set<AiReviewRiskSeverity>(["low", "medium", "high", "critical"]);
const consistencies = new Set<AiReviewConsistency>(["consistent", "mixed", "divergent", "insufficient"]);
const decisionStatuses = new Set<AiReviewDecisionStatus>([
  "accepted_for_research",
  "revision_requested",
  "rejected",
  "insufficient_evidence"
]);
const externalErrorCodes = new Set<AiReviewExternalErrorCode>([
  "ai_review_provider_not_configured",
  "ai_review_provider_failed",
  "timeout",
  "http_error",
  "response_too_large",
  "invalid_json",
  "invalid_schema",
  "unknown_evidence_reference"
]);
const hashPattern = /^[0-9a-f]{64}$/;
const reviewIdPattern = /^ai-review-[0-9a-f]{32}$/;
const decisionIdPattern = /^ai-review-decision-[0-9a-f]{32}$/;
const openAiBaseUrl = "https://api.openai.com/v1";
const safeRawPathPattern = /^(?:[A-Za-z0-9/:@\-._~!$&'()*+,;=]|%[0-9a-f]{2})*$/i;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: unknown, required: readonly string[], optional: readonly string[] = []): value is Record<string, unknown> {
  if (!isObject(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return required.every((key) => key in value) && keys.every((key) => required.includes(key) || optional.includes(key));
}

function isNonEmptyText(value: unknown, maximum = Number.POSITIVE_INFINITY): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
}

function isTrimmedText(value: unknown, maximum = Number.POSITIVE_INFINITY): value is string {
  return isNonEmptyText(value, maximum) && value === value.trim();
}

function isHash(value: unknown): value is string {
  return typeof value === "string" && hashPattern.test(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isUtcTimestamp(value: unknown): value is string {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?\+00:00$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function isValidHostname(hostname: string): boolean {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    try {
      return new URL(`http://${hostname}`).hostname === hostname.toLowerCase();
    } catch {
      return false;
    }
  }
  try {
    if (/[\\\s]/.test(hostname)) {
      return false;
    }
    const ascii = /^[\x00-\x7f]+$/.test(hostname)
      ? hostname.replace(/\.$/, "")
      : new URL(`http://${hostname}`).hostname.replace(/\.$/, "");
    return ascii.length > 0
      && ascii.length <= 253
      && ascii.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
  } catch {
    return false;
  }
}

function isSafeBaseUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value || value !== value.trim()
    || value.includes("?") || value.includes("#")) {
    return false;
  }
  const match = /^(https?):\/\/([^/?#]+)([^?#]*)$/.exec(value);
  if (!match) {
    return false;
  }
  const [, , authority, rawPath] = match;
  if (authority.includes("@") || !safeRawPathPattern.test(rawPath)) {
    return false;
  }
  let hostname = authority;
  if (authority.startsWith("[")) {
    const ipv6 = /^(\[[^\]]+\])(?::([0-9]+))?$/.exec(authority);
    if (!ipv6) {
      return false;
    }
    hostname = ipv6[1];
    if (ipv6[2] !== undefined && String(Number(ipv6[2])) !== ipv6[2]) {
      return false;
    }
  } else {
    const separator = authority.lastIndexOf(":");
    if (separator >= 0) {
      const port = authority.slice(separator + 1);
      hostname = authority.slice(0, separator);
      if (!/^\d+$/.test(port) || String(Number(port)) !== port) {
        return false;
      }
    }
    if (hostname.includes(":")) {
      return false;
    }
  }
  if (!hostname || hostname !== hostname.toLowerCase() || !isValidHostname(hostname)) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:")
      && Boolean(parsed.hostname)
      && !parsed.username
      && !parsed.password
      && !parsed.search
      && !parsed.hash
      && !rawPath.replace(/\/+$/, "").endsWith("/chat/completions")
      && !rawPath.replace(/\/+$/, "").endsWith("/api/chat");
  } catch {
    return false;
  }
}

function isProviderBaseUrl(
  provider: AiReviewProviderId,
  value: unknown,
  allowNull: boolean
): value is string | null {
  if (provider === "local") {
    return value === null;
  }
  if (value === null) {
    return allowNull;
  }
  return isSafeBaseUrl(value) && (provider !== "openai" || value === openAiBaseUrl);
}

function isPaperBoundary(value: unknown): value is AiReviewDecision["boundary"] {
  return hasExactKeys(value, ["paperOnly", "liveTradingAllowed", "orderSubmissionAllowed"])
    && value.paperOnly === true
    && value.liveTradingAllowed === false
    && value.orderSubmissionAllowed === false;
}

function isExperimentReference(value: unknown): value is AiReviewExperimentReference {
  if (!hasExactKeys(value, [
    "experimentId",
    "sourceRunId",
    "strategyRevision",
    "snapshotId",
    "definitionHash",
    "resultHash",
    "selectedCandidateId",
    "candidateRevision",
    "canonicalDataHash",
    "dataRange"
  ])) {
    return false;
  }
  if (!["experimentId", "sourceRunId", "strategyRevision", "selectedCandidateId", "candidateRevision"]
    .every((field) => isTrimmedText(value[field]))) {
    return false;
  }
  if (!["snapshotId", "definitionHash", "resultHash", "canonicalDataHash"]
    .every((field) => isHash(value[field]))) {
    return false;
  }
  return hasExactKeys(value.dataRange, ["startAt", "endAt"])
    && isUtcTimestamp(value.dataRange.startAt)
    && isUtcTimestamp(value.dataRange.endAt)
    && Date.parse(value.dataRange.startAt) <= Date.parse(value.dataRange.endAt);
}

function isStringArray(value: unknown, maximum = 50, nonempty = true): value is string[] {
  return Array.isArray(value)
    && value.length <= maximum
    && value.every((item) => nonempty ? isNonEmptyText(item, 2000) : typeof item === "string");
}

function isAssessment(value: unknown, evidenceIds: ReadonlySet<string>): value is AiReviewAssessment {
  if (!hasExactKeys(value, [
    "stance",
    "summary",
    "risks",
    "invalidationConditions",
    "watchItems",
    "evidenceGaps",
    "consistency"
  ])) {
    return false;
  }
  if (typeof value.stance !== "string" || !stances.has(value.stance as AiReviewStance)
    || !isNonEmptyText(value.summary, 2000)
    || typeof value.consistency !== "string" || !consistencies.has(value.consistency as AiReviewConsistency)
    || !Array.isArray(value.risks) || value.risks.length > 50
    || !isStringArray(value.invalidationConditions)
    || !isStringArray(value.watchItems)
    || !isStringArray(value.evidenceGaps)) {
    return false;
  }
  return value.risks.every((risk) => hasExactKeys(risk, ["severity", "message", "evidenceReferences"])
    && typeof risk.severity === "string"
    && severities.has(risk.severity as AiReviewRiskSeverity)
    && isNonEmptyText(risk.message, 2000)
    && isStringArray(risk.evidenceReferences)
    && risk.evidenceReferences.every((reference) => evidenceIds.has(reference)));
}

function isCondition(value: unknown): boolean {
  if (!hasExactKeys(value, ["kind", "params"]) || !isTrimmedText(value.kind) || !isObject(value.params)) {
    return false;
  }
  return Object.values(value.params).every((item) => item === null
    || typeof item === "string"
    || typeof item === "boolean"
    || isFiniteNumber(item));
}

function isStrategyDefinition(value: unknown): boolean {
  if (!hasExactKeys(value, [
    "name", "revision", "market", "symbols", "timeframe", "version",
    "entryConditions", "exitConditions", "risk"
  ])) {
    return false;
  }
  const risk = value.risk;
  if (!["name", "revision", "market", "timeframe"].every((field) => isTrimmedText(value[field]))
    || !Array.isArray(value.symbols) || !value.symbols.every((symbol) => isTrimmedText(symbol))
    || !Number.isInteger(value.version) || (value.version as number) < 1
    || !Array.isArray(value.entryConditions) || !value.entryConditions.every(isCondition)
    || !Array.isArray(value.exitConditions) || !value.exitConditions.every(isCondition)
    || !hasExactKeys(risk, ["positionPct", "stopLossPct", "takeProfitPct", "maxDrawdownPct"])) {
    return false;
  }
  return ["positionPct", "stopLossPct", "takeProfitPct", "maxDrawdownPct"]
    .every((field) => risk[field] === null || isFiniteNumber(risk[field]));
}

const metricFields = ["totalReturnPct", "annualReturnPct", "maxDrawdownPct", "winRatePct", "profitFactor", "tradeCount"] as const;

function isMetrics(value: unknown): boolean {
  if (!hasExactKeys(value, [], metricFields)) {
    return false;
  }
  return Object.entries(value).every(([field, item]) => field === "tradeCount" ? isNonNegativeInteger(item) : isFiniteNumber(item));
}

function isWalkForward(value: unknown): boolean {
  const summaryFields = ["validationWindowCount", "positiveReturnCount", "medianReturnPct", "worstDrawdownPct"];
  if (!hasExactKeys(value, ["windows"], summaryFields) || !Array.isArray(value.windows)) {
    return false;
  }
  for (const field of ["validationWindowCount", "positiveReturnCount"]) {
    if (field in value && !isNonNegativeInteger(value[field])) {
      return false;
    }
  }
  for (const field of ["medianReturnPct", "worstDrawdownPct"]) {
    if (field in value && value[field] !== null && !isFiniteNumber(value[field])) {
      return false;
    }
  }
  const indexFields = ["index", "trainStartIndex", "trainEndIndex", "validationStartIndex", "validationEndIndex"];
  const windowFields = [...indexFields, ...metricFields, "trainMetrics", "validationMetrics"];
  return value.windows.every((window) => {
    if (!hasExactKeys(window, [], windowFields)) {
      return false;
    }
    if (indexFields.some((field) => field in window && !isNonNegativeInteger(window[field]))) {
      return false;
    }
    const flatMetrics = Object.fromEntries(metricFields.filter((field) => field in window).map((field) => [field, window[field]]));
    return isMetrics(flatMetrics)
      && (!("trainMetrics" in window) || isMetrics(window.trainMetrics))
      && (!("validationMetrics" in window) || isMetrics(window.validationMetrics));
  });
}

function isEvidenceItem(value: unknown): value is AiReviewEvidenceItem {
  if (!hasExactKeys(value, ["id", "kind", "value"]) || !isTrimmedText(value.id) || typeof value.kind !== "string") {
    return false;
  }
  if (value.kind === "experiment_context") {
    const context = value.value;
    return hasExactKeys(context, ["market", "symbol", "timeframe"])
      && ["market", "symbol", "timeframe"].every((field) => isTrimmedText(context[field]));
  }
  if (value.kind === "strategy_definition") {
    return isStrategyDefinition(value.value);
  }
  if (value.kind === "data_quality") {
    if (!hasExactKeys(value.value, [
      "source", "isComplete", "warnings", "rows", "canonicalDataHash", "startAt", "endAt"
    ], ["tradeCount"])) {
      return false;
    }
    return isTrimmedText(value.value.source)
      && typeof value.value.isComplete === "boolean"
      && isStringArray(value.value.warnings, Number.POSITIVE_INFINITY, false)
      && isNonNegativeInteger(value.value.rows)
      && (!("tradeCount" in value.value) || isNonNegativeInteger(value.value.tradeCount))
      && isHash(value.value.canonicalDataHash)
      && isUtcTimestamp(value.value.startAt)
      && isUtcTimestamp(value.value.endAt)
      && Date.parse(value.value.startAt) <= Date.parse(value.value.endAt);
  }
  if (value.kind !== "candidate_metrics" || !hasExactKeys(value.value, [
    "candidateId", "candidateRevision", "parameters", "trainMetrics", "validationMetrics",
    "walkForward", "eligible", "rank", "selected"
  ], ["testMetrics"])) {
    return false;
  }
  if (!isTrimmedText(value.value.candidateId) || !isTrimmedText(value.value.candidateRevision)
    || !Array.isArray(value.value.parameters)
    || !value.value.parameters.every((parameter) => hasExactKeys(parameter, ["conditionSide", "conditionIndex", "parameter", "value"])
      && (parameter.conditionSide === "entry" || parameter.conditionSide === "exit")
      && isNonNegativeInteger(parameter.conditionIndex)
      && typeof parameter.parameter === "string" && /^[A-Za-z][A-Za-z0-9_]*$/.test(parameter.parameter)
      && isFiniteNumber(parameter.value))
    || !isMetrics(value.value.trainMetrics)
    || !isMetrics(value.value.validationMetrics)
    || !isWalkForward(value.value.walkForward)
    || typeof value.value.eligible !== "boolean"
    || typeof value.value.selected !== "boolean"
    || (value.value.rank !== null && (!Number.isInteger(value.value.rank) || (value.value.rank as number) < 1))) {
    return false;
  }
  return value.value.selected ? "testMetrics" in value.value && isMetrics(value.value.testMetrics) : !("testMetrics" in value.value);
}

function canonicalJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalJsonValue);
  }
  if (!isObject(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalJsonValue(value[key])])
  );
}

function sameCanonicalValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonicalJsonValue(left)) === JSON.stringify(canonicalJsonValue(right));
}

function isEvidenceBundle(value: unknown): value is AiReviewEvidenceBundle {
  if (!hasExactKeys(value, [
    "schemaVersion", "mode", "primaryExperiment", "comparisonExperiments", "strategyLineageKey",
    "evidenceItems", "safetyBoundary", "evidenceHash"
  ]) || value.schemaVersion !== 1 || (value.mode !== "single" && value.mode !== "comparison")
    || !isExperimentReference(value.primaryExperiment)
    || !Array.isArray(value.comparisonExperiments) || value.comparisonExperiments.length > 4
    || !value.comparisonExperiments.every(isExperimentReference)
    || !isHash(value.strategyLineageKey)
    || !Array.isArray(value.evidenceItems) || value.evidenceItems.length === 0
    || !value.evidenceItems.every(isEvidenceItem)
    || !isPaperBoundary(value.safetyBoundary)
    || !isHash(value.evidenceHash)) {
    return false;
  }
  const comparisonIds = value.comparisonExperiments.map((item) => item.experimentId);
  const evidenceIds = value.evidenceItems.map((item) => item.id);
  return new Set(comparisonIds).size === comparisonIds.length
    && !comparisonIds.includes(value.primaryExperiment.experimentId)
    && new Set(evidenceIds).size === evidenceIds.length
    && ((value.mode === "single" && comparisonIds.length === 0) || (value.mode === "comparison" && comparisonIds.length > 0));
}

function isUsage(value: unknown): value is NonNullable<AiReviewExternalAssessment["usage"]> {
  const keys = ["inputTokens", "outputTokens", "totalTokens"];
  return hasExactKeys(value, [], keys) && Object.values(value).every(isNonNegativeInteger);
}

function isExternalError(value: unknown): value is NonNullable<AiReviewExternalAssessment["error"]> {
  return hasExactKeys(value, ["code", "message"])
    && typeof value.code === "string"
    && externalErrorCodes.has(value.code as AiReviewExternalErrorCode)
    && isTrimmedText(value.message, 500)
    && !/(?:\btoken\b|access[_ -]?token|api[_ -]?key|private[_ -]?key|authorization|password|bearer|secret|\bsk-(?:proj-)?[a-z0-9_-]{8,}\b)/i.test(value.message);
}

function isExternalAssessment(
  value: unknown,
  evidenceHash: string,
  evidenceIds: ReadonlySet<string>
): value is AiReviewExternalAssessment {
  if (!hasExactKeys(value, [
    "status", "provider", "model", "sanitizedBaseUrl", "endpointHash", "promptTemplateVersion",
    "outputSchemaVersion", "renderedPrompt", "renderedPromptHash", "evidenceHash", "requestHash",
    "responseHash", "assessment", "usage", "latencyMs", "error"
  ]) || (value.status !== "completed" && value.status !== "failed" && value.status !== "skipped")
    || typeof value.provider !== "string" || !providerIds.has(value.provider as AiReviewProviderId)
    || value.promptTemplateVersion !== "aiqt-ai-review-v1"
    || value.outputSchemaVersion !== "aiqt-ai-review-assessment-v1"
    || typeof value.renderedPrompt !== "string"
    || !isHash(value.renderedPromptHash)
    || value.evidenceHash !== evidenceHash
    || !isNonNegativeInteger(value.latencyMs)) {
    return false;
  }
  if (value.status === "skipped") {
    return value.provider === "local"
      && value.model === null && value.sanitizedBaseUrl === null && value.endpointHash === null
      && value.renderedPrompt === "" && value.requestHash === null && value.responseHash === null
      && value.assessment === null && value.usage === null && value.latencyMs === 0 && value.error === null;
  }
  if (value.provider === "local") {
    return false;
  }
  if (value.status === "failed" && isExternalError(value.error)
    && value.error.code === "ai_review_provider_not_configured") {
    return value.endpointHash === null && value.requestHash === null && value.responseHash === null
      && value.assessment === null && value.usage === null && value.latencyMs === 0
      && (value.model === null || isTrimmedText(value.model))
      && isProviderBaseUrl(value.provider as AiReviewProviderId, value.sanitizedBaseUrl, true);
  }
  if (!isTrimmedText(value.model)
    || !isProviderBaseUrl(value.provider as AiReviewProviderId, value.sanitizedBaseUrl, false)
    || !isHash(value.endpointHash) || !isHash(value.requestHash)) {
    return false;
  }
  if (value.status === "failed") {
    return value.responseHash === null && value.assessment === null && value.usage === null && isExternalError(value.error);
  }
  return isHash(value.responseHash)
    && isAssessment(value.assessment, evidenceIds)
    && isUsage(value.usage)
    && value.error === null;
}

export function isAiReviewProviderStatus(value: unknown): value is AiReviewProviderStatus {
  if (!hasExactKeys(value, ["providerId", "configured", "model", "sanitizedBaseUrl"])
    || typeof value.providerId !== "string" || !providerIds.has(value.providerId as AiReviewProviderId)
    || typeof value.configured !== "boolean"
    || (value.model !== null && !isTrimmedText(value.model))
    || !isProviderBaseUrl(value.providerId as AiReviewProviderId, value.sanitizedBaseUrl, true)) {
    return false;
  }
  if (value.providerId === "local") {
    return value.configured === true && value.model === null && value.sanitizedBaseUrl === null;
  }
  if (value.providerId === "openai" && value.sanitizedBaseUrl !== openAiBaseUrl) {
    return false;
  }
  return !value.configured || (isTrimmedText(value.model) && value.sanitizedBaseUrl !== null);
}

export function isAuthoritativeAiReviewRun(value: unknown): value is AuthoritativeAiReviewRun {
  if (!hasExactKeys(value, [
    "schemaVersion", "authority", "recordType", "aiReviewId", "createdAt", "mode", "primaryExperiment",
    "comparisonExperiments", "strategyLineageKey", "evidenceBundle", "evidenceHash", "deterministicAssessment",
    "externalAssessment", "boundary", "recordHash"
  ]) || value.schemaVersion !== 2 || value.authority !== "authoritative" || value.recordType !== "aiqt.aiReviewRun"
    || typeof value.aiReviewId !== "string" || !reviewIdPattern.test(value.aiReviewId)
    || !isUtcTimestamp(value.createdAt) || (value.mode !== "single" && value.mode !== "comparison")
    || !isExperimentReference(value.primaryExperiment)
    || !Array.isArray(value.comparisonExperiments) || value.comparisonExperiments.length > 4
    || !value.comparisonExperiments.every(isExperimentReference)
    || !isHash(value.strategyLineageKey) || !isHash(value.evidenceHash) || !isHash(value.recordHash)
    || !isEvidenceBundle(value.evidenceBundle)
    || value.evidenceBundle.mode !== value.mode
    || value.evidenceBundle.strategyLineageKey !== value.strategyLineageKey
    || value.evidenceBundle.evidenceHash !== value.evidenceHash
    || !sameCanonicalValue(value.evidenceBundle.primaryExperiment, value.primaryExperiment)
    || !sameCanonicalValue(value.evidenceBundle.comparisonExperiments, value.comparisonExperiments)
    || !hasExactKeys(value.boundary, ["purpose", "paperOnly", "liveTradingAllowed", "orderSubmissionAllowed"])
    || value.boundary.purpose !== "research_evidence_review_only"
    || !isPaperBoundary({
      paperOnly: value.boundary.paperOnly,
      liveTradingAllowed: value.boundary.liveTradingAllowed,
      orderSubmissionAllowed: value.boundary.orderSubmissionAllowed
    })) {
    return false;
  }
  const evidenceIds = new Set(value.evidenceBundle.evidenceItems.map((item) => item.id));
  return isAssessment(value.deterministicAssessment, evidenceIds)
    && isExternalAssessment(value.externalAssessment, value.evidenceHash, evidenceIds);
}

export function isLegacyAiReviewHistoryRecord(value: unknown): value is LegacyAiReviewHistoryRecord {
  return isObject(value)
    && value.schemaVersion === 1
    && value.authority === "legacy"
    && value.recordType === "aiqt.aiReviewRun"
    && isTrimmedText(value.aiReviewId)
    && isTrimmedText(value.runId)
    && isTrimmedText(value.createdAt)
    && isTrimmedText(value.status)
    && isObject(value.summary)
    && isObject(value.dossier)
    && Array.isArray(value.citations)
    && Array.isArray(value.rounds)
    && Array.isArray(value.decisionLog)
    && isTrimmedText(value.boundary);
}

export function isAiReviewHistoryRecord(value: unknown): value is AiReviewHistoryRecord {
  return isAuthoritativeAiReviewRun(value) || isLegacyAiReviewHistoryRecord(value);
}

export function isAiReviewDecision(value: unknown): value is AiReviewDecision {
  return hasExactKeys(value, [
    "schemaVersion", "recordType", "decisionId", "aiReviewId", "createdAt", "operator", "status", "rationale",
    "supersedesDecisionId", "reviewRecordHash", "evidenceHash", "boundary", "recordHash"
  ])
    && value.schemaVersion === 1
    && value.recordType === "aiqt.aiReviewDecision"
    && typeof value.decisionId === "string" && decisionIdPattern.test(value.decisionId)
    && isTrimmedText(value.aiReviewId)
    && isUtcTimestamp(value.createdAt)
    && isTrimmedText(value.operator, 80)
    && typeof value.status === "string" && decisionStatuses.has(value.status as AiReviewDecisionStatus)
    && isTrimmedText(value.rationale, 2000)
    && (value.supersedesDecisionId === null
      || (typeof value.supersedesDecisionId === "string" && decisionIdPattern.test(value.supersedesDecisionId)))
    && isHash(value.reviewRecordHash)
    && isHash(value.evidenceHash)
    && isPaperBoundary(value.boundary)
    && isHash(value.recordHash);
}

export function isAiReviewDecisionChain(value: unknown): value is AiReviewDecision[] {
  if (!Array.isArray(value) || !value.every(isAiReviewDecision)) {
    return false;
  }
  return new Set(value.map((decision) => decision.decisionId)).size === value.length
    && value.every((decision, index) => {
    const previous = value[index - 1];
    return decision.supersedesDecisionId === (previous?.decisionId ?? null)
      && (index === 0 || (
        decision.aiReviewId === value[0].aiReviewId
        && decision.reviewRecordHash === value[0].reviewRecordHash
        && decision.evidenceHash === value[0].evidenceHash
      ));
    });
}

function strategyStructureSignature(experiment: StrategyExperimentListItem): string {
  const strategy = experiment.definition.baseStrategy;
  const conditions = (items: typeof strategy.entryConditions) => items.map((condition) => ({
    kind: condition.kind,
    parameterKeys: Object.keys(condition.params).sort()
  }));
  return JSON.stringify({
    name: strategy.name.trim().replace(/\s+/gu, " ").toLocaleLowerCase(),
    entryConditions: conditions(strategy.entryConditions),
    exitConditions: conditions(strategy.exitConditions)
  });
}

export function buildComparisonEligibility(
  primary: StrategyExperimentListItem,
  candidate: StrategyExperimentListItem,
  selected: readonly (string | StrategyExperimentListItem)[] = []
): ComparisonEligibility {
  let reason: ComparisonIneligibilityReason | null = null;
  if (candidate.experimentId === primary.experimentId) {
    reason = "primary";
  } else if (candidate.status !== "completed") {
    reason = "not-completed";
  } else if (candidate.market !== primary.market
    || candidate.symbol !== primary.symbol
    || candidate.timeframe !== primary.timeframe) {
    reason = "context-mismatch";
  } else if (strategyStructureSignature(candidate) !== strategyStructureSignature(primary)) {
    reason = "lineage-mismatch";
  } else {
    const selectedIds = selected.map((item) => typeof item === "string" ? item : item.experimentId);
    if (selectedIds.includes(candidate.experimentId)) {
      reason = "already-selected";
    } else if (selectedIds.length >= 4) {
      reason = "limit-reached";
    }
  }
  return { eligible: reason === null, reason };
}
