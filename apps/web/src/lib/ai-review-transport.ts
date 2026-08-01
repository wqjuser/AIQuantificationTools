import {
  isAiReviewDecision,
  isAiReviewDecisionChain,
  isAiReviewProviderStatus,
  isAuthoritativeAiReviewRun,
  parseAiReviewHistoryRecord,
  type AiReviewDecision,
  type AiReviewHistoryRecord,
  type AiReviewProviderStatus,
  type AppendAiReviewDecisionRequest,
  type AuthoritativeAiReviewRun,
  type CreateAuthoritativeAiReviewRequest,
  type LegacyAiReviewHistoryRecord
} from "./ai-review-stage3";
import {
  isAiResearchEvidence,
  isAiResearchOutcome,
  type AiResearchEvidence,
  type AiResearchOutcome,
  type CreateAiResearchEvidenceRequest,
  type EvaluateAiResearchOutcomeRequest
} from "./ai-research-m4";
import {
  buildApiUrl,
  defaultFetcher,
  requestJson,
  resolveRequestOptions,
  WorkspaceHttpError,
  type WorkspaceFetcher
} from "./terminal-api-http";
import { hasExactObjectKeys } from "./terminal-api-contract";

type WorkspaceSource = "core" | "fallback";

export interface AiReviewProviderStatusResult {
  providers: AiReviewProviderStatus[];
  source: WorkspaceSource;
  error?: string;
}

export interface AuthoritativeAiReviewResult {
  review?: AuthoritativeAiReviewRun;
  latestDecision?: AiReviewDecision | null;
  source: WorkspaceSource;
  error?: string;
  httpStatus?: number;
}

export interface AuthoritativeAiReviewFilters {
  runId?: string;
  experimentId?: string;
  limit?: number;
  offset?: number;
  query?: string;
}

export interface MixedAiReviewHistoryPagination {
  limit: number;
  offset: number;
  total: number;
  query: string;
}

export interface AuthoritativeAiReviewHistoryResult {
  reviews: AuthoritativeAiReviewRun[];
  legacyReviews: LegacyAiReviewHistoryRecord[];
  pagination?: MixedAiReviewHistoryPagination;
  source: WorkspaceSource;
  error?: string;
}

export interface AiReviewDecisionHistoryResult {
  decisions: AiReviewDecision[];
  source: WorkspaceSource;
  error?: string;
}

export interface AiReviewDecisionMutationResult {
  decision?: AiReviewDecision;
  source: WorkspaceSource;
  error?: string;
}

export interface AiResearchEvidenceResult {
  researchEvidence?: AiResearchEvidence | null;
  outcomes: AiResearchOutcome[];
  source: WorkspaceSource;
  error?: string;
  httpStatus?: number;
}

export interface AiResearchOutcomeResult {
  outcome?: AiResearchOutcome;
  source: WorkspaceSource;
  error?: string;
  httpStatus?: number;
}

export function buildAiReviewProvidersUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/ai-review/providers");
}

function requireTrimmedAiReviewId(value: unknown): string {
  if (typeof value !== "string" || !value || value !== value.trim()) {
    throw new TypeError("Invalid AI review ID");
  }
  return value;
}

function normalizeCreateAuthoritativeAiReviewRequest(
  request: CreateAuthoritativeAiReviewRequest
): CreateAuthoritativeAiReviewRequest {
  if (!Array.isArray(request.comparisonExperimentIds)) {
    throw new TypeError("Invalid AI review ID");
  }
  return {
    primaryExperimentId: requireTrimmedAiReviewId(request.primaryExperimentId),
    comparisonExperimentIds: request.comparisonExperimentIds.map(requireTrimmedAiReviewId),
    providerId: request.providerId,
    externalDataApproved: request.externalDataApproved
  };
}

export function buildAuthoritativeAiReviewsUrl(
  baseUrl: string,
  filters: AuthoritativeAiReviewFilters = {}
): string {
  if ((filters.limit !== undefined
    && (!Number.isFinite(filters.limit) || !Number.isInteger(filters.limit) || filters.limit < 1 || filters.limit > 50))
    || (filters.offset !== undefined
      && (!Number.isFinite(filters.offset) || !Number.isInteger(filters.offset) || filters.offset < 0))) {
    throw new RangeError("Invalid AI review filters");
  }
  return buildApiUrl(baseUrl, "api/ai-reviews", (url) => {
    if (filters.runId?.trim()) {
      url.searchParams.set("runId", filters.runId.trim());
    }
    if (filters.experimentId?.trim()) {
      url.searchParams.set("experimentId", filters.experimentId.trim());
    }
    if (filters.limit !== undefined) {
      url.searchParams.set("limit", String(filters.limit));
    }
    if (filters.offset !== undefined) {
      url.searchParams.set("offset", String(filters.offset));
    }
    if (filters.query?.trim()) {
      url.searchParams.set("query", filters.query.trim());
    }
  });
}

export function buildAuthoritativeAiReviewUrl(baseUrl: string, aiReviewId: string): string {
  return buildApiUrl(baseUrl, `api/ai-reviews/${encodeURIComponent(requireTrimmedAiReviewId(aiReviewId))}`);
}

export function buildAiReviewDecisionsUrl(baseUrl: string, aiReviewId: string): string {
  return buildApiUrl(baseUrl, `api/ai-reviews/${encodeURIComponent(requireTrimmedAiReviewId(aiReviewId))}/decisions`);
}

export function buildAiResearchEvidenceUrl(baseUrl: string, aiReviewId: string): string {
  return buildApiUrl(
    baseUrl,
    `api/ai-reviews/${encodeURIComponent(requireTrimmedAiReviewId(aiReviewId))}/research-evidence`
  );
}

export function buildAiResearchOutcomesUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/ai-research/outcomes");
}

function isAiReviewProvidersPayload(value: unknown): value is { providers: AiReviewProviderStatus[] } {
  return hasExactObjectKeys(value, ["providers"])
    && Array.isArray(value.providers)
    && value.providers.every(isAiReviewProviderStatus);
}

function isAuthoritativeAiReviewPayload(
  value: unknown
): value is { review: AuthoritativeAiReviewRun; latestDecision: AiReviewDecision | null } {
  if (!hasExactObjectKeys(value, ["review", "latestDecision"])
    || !isAuthoritativeAiReviewRun(value.review)
    || (value.latestDecision !== null && !isAiReviewDecision(value.latestDecision))) {
    return false;
  }
  return value.latestDecision === null || (
    value.latestDecision.aiReviewId === value.review.aiReviewId
    && value.latestDecision.reviewRecordHash === value.review.recordHash
    && value.latestDecision.evidenceHash === value.review.evidenceHash
  );
}

function isAuthoritativeAiReviewCreatePayload(
  value: unknown,
  request: CreateAuthoritativeAiReviewRequest
): value is { review: AuthoritativeAiReviewRun; latestDecision: null } {
  if (!isAuthoritativeAiReviewPayload(value) || value.latestDecision !== null) {
    return false;
  }
  const comparisonIds = value.review.comparisonExperiments.map((item) => item.experimentId);
  return value.review.primaryExperiment.experimentId === request.primaryExperimentId
    && comparisonIds.length === request.comparisonExperimentIds.length
    && comparisonIds.every((id, index) => id === request.comparisonExperimentIds[index])
    && value.review.externalAssessment.provider === request.providerId;
}

function parseAuthoritativeAiReviewHistoryPayload(
  value: unknown
): { reviews: AiReviewHistoryRecord[]; pagination: MixedAiReviewHistoryPagination } | null {
  if (!hasExactObjectKeys(value, ["reviews", "pagination"])
    || !Array.isArray(value.reviews)
    || !hasExactObjectKeys(value.pagination, ["limit", "offset", "total", "query"])) {
    return null;
  }
  if (!(Number.isInteger(value.pagination.limit) && (value.pagination.limit as number) >= 1
    && (value.pagination.limit as number) <= 50
    && Number.isInteger(value.pagination.offset) && (value.pagination.offset as number) >= 0
    && Number.isInteger(value.pagination.total) && (value.pagination.total as number) >= 0
    && typeof value.pagination.query === "string")) {
    return null;
  }
  const reviews = value.reviews.map(parseAiReviewHistoryRecord);
  if (reviews.some((review) => review === null)) {
    return null;
  }
  return {
    reviews: reviews as AiReviewHistoryRecord[],
    pagination: {
      limit: value.pagination.limit as number,
      offset: value.pagination.offset as number,
      total: value.pagination.total as number,
      query: value.pagination.query
    }
  };
}

function isAiReviewDecisionsPayload(
  value: unknown,
  aiReviewId: string
): value is { decisions: AiReviewDecision[] } {
  return hasExactObjectKeys(value, ["decisions"])
    && isAiReviewDecisionChain(value.decisions)
    && value.decisions.every((decision) => decision.aiReviewId === aiReviewId);
}

function isAiReviewDecisionPayload(
  value: unknown,
  aiReviewId: string,
  request: AppendAiReviewDecisionRequest
): value is { decision: AiReviewDecision } {
  return hasExactObjectKeys(value, ["decision"])
    && isAiReviewDecision(value.decision)
    && value.decision.aiReviewId === aiReviewId
    && value.decision.operator === request.operator
    && value.decision.status === request.status
    && value.decision.rationale === request.rationale
    && value.decision.supersedesDecisionId === request.supersedesDecisionId;
}

function isAiResearchEvidencePayload(
  value: unknown
): value is { researchEvidence: AiResearchEvidence | null; outcomes: AiResearchOutcome[] } {
  return hasExactObjectKeys(value, ["researchEvidence", "outcomes"])
    && (value.researchEvidence === null || isAiResearchEvidence(value.researchEvidence))
    && Array.isArray(value.outcomes)
    && value.outcomes.every(isAiResearchOutcome);
}

function isAiResearchEvidenceCreatePayload(
  value: unknown
): value is { researchEvidence: AiResearchEvidence } {
  return hasExactObjectKeys(value, ["researchEvidence"])
    && isAiResearchEvidence(value.researchEvidence);
}

function isAiResearchOutcomePayload(value: unknown): value is { outcome: AiResearchOutcome } {
  return hasExactObjectKeys(value, ["outcome"]) && isAiResearchOutcome(value.outcome);
}

export async function loadAiReviewProviders(
  baseUrl: string,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewProviderStatusResult> {
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  try {
    const payload = await requestJson(
      buildAiReviewProvidersUrl(baseUrl),
      signal ? { signal } : undefined,
      fetcher
    );
    if (!isAiReviewProvidersPayload(payload)) {
      throw new Error("Invalid AI review providers contract");
    }
    return { providers: payload.providers, source: "core" };
  } catch (error) {
    return {
      providers: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown AI review providers error"
    };
  }
}

export function createAuthoritativeAiReview(
  baseUrl: string,
  request: CreateAuthoritativeAiReviewRequest,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuthoritativeAiReviewResult> {
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  const comparisonExperimentIds = request.comparisonExperimentIds;
  const requestSnapshot: CreateAuthoritativeAiReviewRequest = {
    primaryExperimentId: request.primaryExperimentId,
    comparisonExperimentIds: Array.isArray(comparisonExperimentIds)
      ? [...comparisonExperimentIds]
      : comparisonExperimentIds,
    providerId: request.providerId,
    externalDataApproved: request.externalDataApproved
  };
  return Promise.resolve().then(() => {
    const normalizedRequest = normalizeCreateAuthoritativeAiReviewRequest(requestSnapshot);
    return requestJson(
      buildAuthoritativeAiReviewsUrl(baseUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedRequest),
        ...(signal ? { signal } : {})
      },
      fetcher
    ).then((payload) => ({ normalizedRequest, payload }));
  }).then(({ normalizedRequest, payload }) => {
    if (!isAuthoritativeAiReviewCreatePayload(payload, normalizedRequest)) {
      throw new Error("Invalid authoritative AI review create contract");
    }
    return { review: payload.review, latestDecision: payload.latestDecision, source: "core" as const };
  }).catch((error: unknown) => ({
    source: "fallback",
    error: error instanceof Error ? error.message : "Unknown authoritative AI review create error"
  }));
}

export function loadAuthoritativeAiReview(
  baseUrl: string,
  aiReviewId: string,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuthoritativeAiReviewResult> {
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  return Promise.resolve().then(() => {
    const normalizedAiReviewId = requireTrimmedAiReviewId(aiReviewId);
    return requestJson(
      buildAuthoritativeAiReviewUrl(baseUrl, normalizedAiReviewId),
      signal ? { signal } : undefined,
      fetcher
    ).then((payload) => ({ normalizedAiReviewId, payload }));
  }).then(({ normalizedAiReviewId, payload }) => {
    if (!isAuthoritativeAiReviewPayload(payload) || payload.review.aiReviewId !== normalizedAiReviewId) {
      throw new Error("Invalid authoritative AI review detail contract");
    }
    return { review: payload.review, latestDecision: payload.latestDecision, source: "core" as const };
  }).catch((error: unknown) => ({
    source: "fallback",
    error: error instanceof Error ? error.message : "Unknown authoritative AI review detail error",
    ...(error instanceof WorkspaceHttpError ? { httpStatus: error.status } : {})
  }));
}

export function createAiResearchEvidence(
  baseUrl: string,
  aiReviewId: string,
  request: CreateAiResearchEvidenceRequest,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiResearchEvidenceResult> {
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  const requestSnapshot: CreateAiResearchEvidenceRequest = {
    recommendation: { ...request.recommendation },
    multiViewEnabled: request.multiViewEnabled,
    financialFacts: request.financialFacts.map((fact) => ({
      ...fact,
      primary: { ...fact.primary },
      comparison: { ...fact.comparison }
    }))
  };
  return Promise.resolve().then(() => requestJson(
    buildAiResearchEvidenceUrl(baseUrl, aiReviewId),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestSnapshot),
      ...(signal ? { signal } : {})
    },
    fetcher
  )).then((payload) => {
    if (!isAiResearchEvidenceCreatePayload(payload)) {
      throw new Error("Invalid M4 AI research evidence create contract");
    }
    return {
      researchEvidence: payload.researchEvidence,
      outcomes: [],
      source: "core" as const
    };
  }).catch((error: unknown) => ({
    outcomes: [],
    source: "fallback" as const,
    error: error instanceof Error ? error.message : "Unknown M4 AI research evidence error",
    ...(error instanceof WorkspaceHttpError ? { httpStatus: error.status } : {})
  }));
}

export function loadAiResearchEvidence(
  baseUrl: string,
  aiReviewId: string,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiResearchEvidenceResult> {
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  return Promise.resolve().then(() => requestJson(
    buildAiResearchEvidenceUrl(baseUrl, aiReviewId),
    signal ? { signal } : undefined,
    fetcher
  )).then((payload) => {
    if (!isAiResearchEvidencePayload(payload)) {
      throw new Error("Invalid M4 AI research evidence contract");
    }
    return {
      researchEvidence: payload.researchEvidence,
      outcomes: payload.outcomes,
      source: "core" as const
    };
  }).catch((error: unknown) => ({
    outcomes: [],
    source: "fallback" as const,
    error: error instanceof Error ? error.message : "Unknown M4 AI research evidence error",
    ...(error instanceof WorkspaceHttpError ? { httpStatus: error.status } : {})
  }));
}

export function evaluateAiResearchOutcome(
  baseUrl: string,
  request: EvaluateAiResearchOutcomeRequest,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiResearchOutcomeResult> {
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  const requestSnapshot = {
    researchEvidenceId: requireTrimmedAiReviewId(request.researchEvidenceId),
    outcomeRunId: requireTrimmedAiReviewId(request.outcomeRunId),
    benchmarkRunId: requireTrimmedAiReviewId(request.benchmarkRunId)
  };
  return Promise.resolve().then(() => requestJson(
    buildAiResearchOutcomesUrl(baseUrl),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestSnapshot),
      ...(signal ? { signal } : {})
    },
    fetcher
  )).then((payload) => {
    if (!isAiResearchOutcomePayload(payload)) {
      throw new Error("Invalid M4 AI research outcome contract");
    }
    return { outcome: payload.outcome, source: "core" as const };
  }).catch((error: unknown) => ({
    source: "fallback" as const,
    error: error instanceof Error ? error.message : "Unknown M4 AI research outcome error",
    ...(error instanceof WorkspaceHttpError ? { httpStatus: error.status } : {})
  }));
}

export async function loadAuthoritativeAiReviews(
  baseUrl: string,
  filters: AuthoritativeAiReviewFilters = {},
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuthoritativeAiReviewHistoryResult> {
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  try {
    const responsePayload = await requestJson(
      buildAuthoritativeAiReviewsUrl(baseUrl, filters),
      signal ? { signal } : undefined,
      fetcher
    );
    const payload = parseAuthoritativeAiReviewHistoryPayload(responsePayload);
    if (payload === null) {
      throw new Error("Invalid authoritative AI review history contract");
    }
    return {
      reviews: payload.reviews.filter(isAuthoritativeAiReviewRun),
      legacyReviews: payload.reviews.filter(
        (review): review is LegacyAiReviewHistoryRecord => review.authority === "legacy"
      ),
      pagination: payload.pagination,
      source: "core"
    };
  } catch (error) {
    return {
      reviews: [],
      legacyReviews: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown authoritative AI review history error"
    };
  }
}

export function loadAiReviewDecisions(
  baseUrl: string,
  aiReviewId: string,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewDecisionHistoryResult> {
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  return Promise.resolve().then(() => {
    const normalizedAiReviewId = requireTrimmedAiReviewId(aiReviewId);
    return requestJson(
      buildAiReviewDecisionsUrl(baseUrl, normalizedAiReviewId),
      signal ? { signal } : undefined,
      fetcher
    ).then((payload) => ({ normalizedAiReviewId, payload }));
  }).then(({ normalizedAiReviewId, payload }) => {
    if (!isAiReviewDecisionsPayload(payload, normalizedAiReviewId)) {
      throw new Error("Invalid AI review decisions contract");
    }
    return { decisions: payload.decisions, source: "core" as const };
  }).catch((error: unknown) => ({
    decisions: [],
    source: "fallback",
    error: error instanceof Error ? error.message : "Unknown AI review decisions error"
  }));
}

export function appendAiReviewDecision(
  baseUrl: string,
  aiReviewId: string,
  request: AppendAiReviewDecisionRequest,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewDecisionMutationResult> {
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  const requestSnapshot: AppendAiReviewDecisionRequest = {
    operator: request.operator,
    status: request.status,
    rationale: request.rationale,
    supersedesDecisionId: request.supersedesDecisionId
  };
  return Promise.resolve().then(() => {
    const normalizedAiReviewId = requireTrimmedAiReviewId(aiReviewId);
    const normalizedRequest = requestSnapshot;
    return requestJson(
      buildAiReviewDecisionsUrl(baseUrl, normalizedAiReviewId),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedRequest),
        ...(signal ? { signal } : {})
      },
      fetcher
    ).then((payload) => ({ normalizedAiReviewId, normalizedRequest, payload }));
  }).then(({ normalizedAiReviewId, normalizedRequest, payload }) => {
    if (!isAiReviewDecisionPayload(payload, normalizedAiReviewId, normalizedRequest)) {
      throw new Error("Invalid AI review decision append contract");
    }
    return { decision: payload.decision, source: "core" as const };
  }).catch((error: unknown) => ({
    source: "fallback",
    error: error instanceof Error ? error.message : "Unknown AI review decision append error"
  }));
}

export type {
  AppendAiReviewDecisionRequest,
  CreateAiResearchEvidenceRequest,
  CreateAuthoritativeAiReviewRequest,
  EvaluateAiResearchOutcomeRequest
};
