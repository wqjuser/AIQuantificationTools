import { buildApiUrl, coreErrorDetail, type WorkspaceFetcher, type WorkspaceSource } from "./terminal-api";
import type { Stage6SandboxOrder } from "./stage6-sandbox";

const reviewScopeIds = [
  "candidate-hash-reviewed",
  "production-envelope-reviewed",
  "market-and-funding-checks-reviewed",
  "stage8-continuity-current",
  "no-production-execution-authority"
] as const;

interface Stage9Boundary {
  productionReadOnly: true; liveTradingAllowed: false; orderSubmissionEnabled: false;
  orderRoutingEnabled: false; liveOrderSubmitted: false; liveRouteExecuted: false; liveBlockedBoundary: true;
}

export interface Stage9ProductionAdmissionObservation extends Stage9Boundary {
  kind: "aiqt.stage9ProductionAdmissionObservation"; schemaVersion: 1; observedAt: string;
  exchangeId: "binance"; marketChecks: Array<{ orderId: string; passed: boolean }>;
  priceChecks: Array<{ orderId: string; quoteObservedAt: string; referencePrice: number; adverseDeviationPct: number; passed: boolean }>;
  fundingChecks: Array<{ orderId: string; passed: boolean }>;
  passed: boolean; blockedReasons: string[]; observationHash: string;
}

export interface Stage9ProductionAdmissionCandidate extends Stage9Boundary {
  kind: "aiqt.stage9ProductionOrderAdmissionCandidate"; schemaVersion: 1;
  candidateId: string; candidateKey: string; candidateHash: string; generatedAt: string; expiresAt: string;
  baseRunId: string; workflowId: string; workflowHash: string; batchId: string;
  sandboxAuthorizationId: string; sandboxAuthorizationHash: string; sandboxBatchStatus: "reconciled";
  stage8ContinuityHash: string; productionRouteReviewId: string; orders: Stage6SandboxOrder[];
  ordersHash: string; observation: Stage9ProductionAdmissionObservation; operator: string;
  status: "ready_for_review";
}

export interface Stage9ProductionAdmissionReview extends Stage9Boundary {
  kind: "aiqt.stage9ProductionOrderAdmissionReview"; schemaVersion: 1; reviewId: string; reviewHash: string;
  reviewedAt: string; baseRunId: string; candidateId: string; candidateHash: string;
  sandboxAuthorizationId: string; stage8ContinuityHash: string;
  reviewObservation: Stage9ProductionAdmissionObservation; reviewer: string;
  outcome: "approved" | "rejected"; reason: string; confirmedScopeIds: typeof reviewScopeIds;
  status: "admission_review_recorded"; authorizationEffective: false;
}

export async function loadStage9ProductionAdmissionCandidates(
  baseUrl: string, baseRunId: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ candidates: Stage9ProductionAdmissionCandidate[]; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(buildApiUrl(baseUrl, "/api/execution/stage9/production-order-admission-candidates", (url) => {
      url.searchParams.set("baseRunId", baseRunId);
    }), undefined, fetcher);
    if (!record(payload) || !Array.isArray(payload.productionOrderAdmissionCandidates) ||
      !payload.productionOrderAdmissionCandidates.every(isStage9ProductionAdmissionCandidate)) {
      throw new Error("Invalid Stage 9 candidate history contract");
    }
    return { candidates: payload.productionOrderAdmissionCandidates, source: "core" };
  } catch (error) {
    return { candidates: [], source: "fallback", error: message(error) };
  }
}

export async function createStage9ProductionAdmissionCandidate(
  baseUrl: string, authorizationId: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ candidate?: Stage9ProductionAdmissionCandidate; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(
      buildApiUrl(baseUrl, "/api/execution/stage9/production-order-admission-candidates"),
      post({ authorizationId, operator: "execution-workspace" }), fetcher
    );
    if (!record(payload) || !isStage9ProductionAdmissionCandidate(payload.productionOrderAdmissionCandidate)) {
      throw new Error("Invalid Stage 9 candidate contract");
    }
    return { candidate: payload.productionOrderAdmissionCandidate, source: "core" };
  } catch (error) {
    return { source: "fallback", error: message(error) };
  }
}

export async function loadStage9ProductionAdmissionReviews(
  baseUrl: string, baseRunId: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ reviews: Stage9ProductionAdmissionReview[]; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(buildApiUrl(baseUrl, "/api/execution/stage9/production-order-admission-reviews", (url) => {
      url.searchParams.set("baseRunId", baseRunId);
    }), undefined, fetcher);
    if (!record(payload) || !Array.isArray(payload.productionOrderAdmissionReviews) ||
      !payload.productionOrderAdmissionReviews.every(isStage9ProductionAdmissionReview)) {
      throw new Error("Invalid Stage 9 review history contract");
    }
    return { reviews: payload.productionOrderAdmissionReviews, source: "core" };
  } catch (error) {
    return { reviews: [], source: "fallback", error: message(error) };
  }
}

export async function createStage9ProductionAdmissionReview(
  baseUrl: string, candidateId: string, reviewer: string, outcome: "approved" | "rejected", reason: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ review?: Stage9ProductionAdmissionReview; source: WorkspaceSource; error?: string }> {
  try {
    const confirmations = Object.fromEntries(reviewScopeIds.map((id) => [id, true]));
    const payload = await request(
      buildApiUrl(baseUrl, "/api/execution/stage9/production-order-admission-reviews"),
      post({ candidateId, reviewer, outcome, reason, confirmations }), fetcher
    );
    if (!record(payload) || !isStage9ProductionAdmissionReview(payload.productionOrderAdmissionReview)) {
      throw new Error("Invalid Stage 9 review contract");
    }
    return { review: payload.productionOrderAdmissionReview, source: "core" };
  } catch (error) {
    return { source: "fallback", error: message(error) };
  }
}

export function isStage9ProductionAdmissionCandidate(value: unknown): value is Stage9ProductionAdmissionCandidate {
  if (!record(value) || !hasExactKeys(value, [
    "kind", "schemaVersion", "candidateId", "candidateKey", "candidateHash", "generatedAt", "expiresAt",
    "baseRunId", "workflowId", "workflowHash", "batchId", "sandboxAuthorizationId", "sandboxAuthorizationHash",
    "sandboxBatchStatus", "stage8ContinuityHash", "productionRouteReviewId", "orders", "ordersHash", "observation",
    "operator", "status", ...boundaryKeys
  ])) return false;
  return value.kind === "aiqt.stage9ProductionOrderAdmissionCandidate" && value.schemaVersion === 1 &&
    [value.candidateId, value.baseRunId, value.workflowId, value.batchId, value.sandboxAuthorizationId,
      value.productionRouteReviewId, value.operator].every(nonempty) &&
    [value.candidateKey, value.candidateHash, value.workflowHash, value.sandboxAuthorizationHash,
      value.stage8ContinuityHash, value.ordersHash].every(hash) && zoned(value.generatedAt) && zoned(value.expiresAt) &&
    value.sandboxBatchStatus === "reconciled" && value.status === "ready_for_review" &&
    Array.isArray(value.orders) && value.orders.length > 0 && value.orders.every(order) &&
    isObservation(value.observation) && boundary(value);
}

export function isStage9ProductionAdmissionReview(value: unknown): value is Stage9ProductionAdmissionReview {
  if (!record(value) || !hasExactKeys(value, [
    "kind", "schemaVersion", "reviewId", "reviewHash", "reviewedAt", "baseRunId", "candidateId", "candidateHash",
    "sandboxAuthorizationId", "stage8ContinuityHash", "reviewObservation", "reviewer", "outcome", "reason",
    "confirmedScopeIds", "status", "authorizationEffective", ...boundaryKeys
  ])) return false;
  return value.kind === "aiqt.stage9ProductionOrderAdmissionReview" && value.schemaVersion === 1 &&
    [value.reviewId, value.baseRunId, value.candidateId, value.sandboxAuthorizationId, value.reviewer, value.reason].every(nonempty) &&
    [value.reviewHash, value.candidateHash, value.stage8ContinuityHash].every(hash) && zoned(value.reviewedAt) &&
    ["approved", "rejected"].includes(value.outcome) && value.status === "admission_review_recorded" &&
    value.authorizationEffective === false && Array.isArray(value.confirmedScopeIds) &&
    value.confirmedScopeIds.join("|") === reviewScopeIds.join("|") && isObservation(value.reviewObservation) && boundary(value);
}

const boundaryKeys = [
  "productionReadOnly", "liveTradingAllowed", "orderSubmissionEnabled", "orderRoutingEnabled",
  "liveOrderSubmitted", "liveRouteExecuted", "liveBlockedBoundary"
] as const;
function boundary(value: Record<string, any>): boolean {
  return value.productionReadOnly === true && value.liveTradingAllowed === false &&
    value.orderSubmissionEnabled === false && value.orderRoutingEnabled === false &&
    value.liveOrderSubmitted === false && value.liveRouteExecuted === false && value.liveBlockedBoundary === true;
}
function isObservation(value: unknown): value is Stage9ProductionAdmissionObservation {
  if (!record(value) || !hasExactKeys(value, [
    "kind", "schemaVersion", "observedAt", "exchangeId", "marketChecks", "priceChecks", "fundingChecks",
    "passed", "blockedReasons", "observationHash", ...boundaryKeys
  ])) return false;
  const simple = (rows: unknown) => Array.isArray(rows) && rows.length > 0 && rows.every((row) =>
    record(row) && hasExactKeys(row, ["orderId", "passed"]) && nonempty(row.orderId) && typeof row.passed === "boolean"
  );
  return value.kind === "aiqt.stage9ProductionAdmissionObservation" && value.schemaVersion === 1 &&
    value.exchangeId === "binance" && zoned(value.observedAt) && simple(value.marketChecks) && simple(value.fundingChecks) &&
    Array.isArray(value.priceChecks) && value.priceChecks.length > 0 && value.priceChecks.every((row) =>
      record(row) && hasExactKeys(row, ["orderId", "quoteObservedAt", "referencePrice", "adverseDeviationPct", "passed"]) &&
      nonempty(row.orderId) && zoned(row.quoteObservedAt) && positive(row.referencePrice) &&
      finite(row.adverseDeviationPct) && row.adverseDeviationPct >= 0 && typeof row.passed === "boolean"
    ) && typeof value.passed === "boolean" && Array.isArray(value.blockedReasons) &&
    value.blockedReasons.every(nonempty) && hash(value.observationHash) && boundary(value);
}
function order(value: unknown): value is Stage6SandboxOrder {
  return record(value) && [value.orderId, value.clientOrderId, value.symbol].every(nonempty) &&
    ["buy", "sell"].includes(value.side) && value.type === "limit" && value.timeInForce === "GTC" &&
    [value.quantity, value.price, value.notionalValue].every(positive);
}
async function request(url: string, init: RequestInit | undefined, fetcher: WorkspaceFetcher): Promise<unknown> {
  const response = await fetcher(url, init);
  const payload = await response.json();
  if (!response.ok) {
    const blockers = record(payload) && Array.isArray(payload.blockers) ? payload.blockers.filter(nonempty).join("; ") : "";
    throw new Error(blockers || coreErrorDetail(payload) || `HTTP ${response.status}`);
  }
  return payload;
}
function post(body: object): RequestInit { return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }; }
function record(value: unknown): value is Record<string, any> { return !!value && typeof value === "object" && !Array.isArray(value); }
function hasExactKeys(value: Record<string, any>, fields: readonly string[]): boolean { return Object.keys(value).length === fields.length && fields.every((field) => Object.hasOwn(value, field)); }
function nonempty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function hash(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function zoned(value: unknown): value is string { return nonempty(value) && !Number.isNaN(Date.parse(value)) && /(Z|[+-]\d{2}:\d{2})$/.test(value); }
function finite(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
function positive(value: unknown): value is number { return finite(value) && value > 0; }
function message(error: unknown): string { return error instanceof Error ? error.message : "Unknown Stage 9 production admission error"; }
