import { buildApiUrl, coreErrorDetail, type WorkspaceFetcher, type WorkspaceSource } from "./terminal-api";
import type { Stage4PortfolioWorkflow } from "./portfolio-stage4";

export type Stage5ShadowFailureMode = "none" | "timeout_once" | "adapter_rejected" | "reconciliation_mismatch" | "kill_switch";
export type Stage5ShadowStatus = "reconciled" | "recoverable_failure" | "blocked";

export interface Stage5ShadowOrder {
  orderId: string;
  clientOrderId: string;
  symbol: string;
  side: string;
  quantity: number;
  notionalValue: number;
  state: string;
  reason: string;
  transitions: Array<{ state: string; at: string }>;
}

export interface Stage5ShadowSession {
  kind: "aiqt.stage5ShadowExecutionSession";
  schemaVersion: 1;
  sessionId: string;
  sessionKey: string;
  generatedAt: string;
  baseRunId: string;
  workflowId: string;
  workflowHash: string;
  adapter: { id: "local-fake-shadow"; environment: "isolated-local"; mode: "shadow" };
  attempt: 1 | 2;
  failureMode: Stage5ShadowFailureMode;
  status: Stage5ShadowStatus;
  limits: { maxOrders: number; maxGrossNotional: number; timeoutSeconds: 3; maxAttempts: 2 };
  killSwitch: { enabled: true; triggered: boolean };
  orders: Stage5ShadowOrder[];
  reconciliation: {
    reconciled: boolean;
    reason: string;
    stage4OrderCount: number;
    shadowOrderCount: number;
    grossNotional: number;
  };
  paperOnly: true;
  shadowOnly: true;
  liveTradingAllowed: false;
  orderSubmissionEnabled: false;
  routeExecuted: false;
  liveBlockedBoundary: true;
  sessionHash: string;
}

export interface Stage5SandboxReadinessDecision {
  kind: "aiqt.stage5SandboxReadinessDecision";
  schemaVersion: 1;
  decisionId: string;
  decisionHash: string;
  generatedAt: string;
  baseRunId: string;
  workflowId: string;
  workflowHash: string;
  shadowSessionId: string;
  shadowSessionHash: string;
  adapterId: string;
  market: string;
  adapterPaperExecutionIds: string[];
  adapterManifestValidationIds: string[];
  adapterAuditEventIds: string[];
  operator: string;
  status: "ready_for_manually_authorized_sandbox_phase";
  paperOnly: true;
  shadowOnly: true;
  sandboxOrderSubmissionAllowed: false;
  liveTradingAllowed: false;
  orderSubmissionEnabled: false;
  routeExecuted: false;
  liveBlockedBoundary: true;
}

export interface Stage5SandboxAuthorizationPreflight {
  kind: "aiqt.stage5SandboxAuthorizationPreflight";
  schemaVersion: 1;
  preflightId: string;
  preflightHash: string;
  generatedAt: string;
  baseRunId: string;
  readinessDecisionId: string;
  readinessDecisionHash: string;
  adapterId: "ccxt-live";
  market: "crypto";
  sandboxProbeExecutionId: string;
  authoritativeHealthEvidenceHash: string;
  sandboxProbeReviewId: string;
  operator: string;
  status: "ready_for_separate_sandbox_authorization";
  humanAuthorizationRequired: true;
  sandboxOrderSubmissionAllowed: false;
  liveTradingAllowed: false;
  orderSubmissionEnabled: false;
  routeExecuted: false;
  liveBlockedBoundary: true;
}

export interface Stage5SandboxAuthorizationReview {
  kind: "aiqt.stage5SandboxAuthorizationReview";
  schemaVersion: 1;
  reviewId: string;
  reviewHash: string;
  generatedAt: string;
  baseRunId: string;
  preflightId: string;
  preflightHash: string;
  adapterId: "ccxt-live";
  market: "crypto";
  reviewer: string;
  outcome: "approved" | "rejected";
  reason: string;
  confirmedScopeIds: string[];
  status: "authorization_review_recorded";
  authorizationEffective: false;
  humanAuthorizationRequired: true;
  sandboxOrderSubmissionAllowed: false;
  liveTradingAllowed: false;
  orderSubmissionEnabled: false;
  routeExecuted: false;
  liveBlockedBoundary: true;
}

const STAGE5_SANDBOX_AUTHORIZATION_REVIEW_SCOPE_IDS = [
  "preflight-hash-reviewed",
  "sandbox-only-scope",
  "no-order-submission",
  "no-live-funds",
  "kill-switch-and-rollback-owner-reviewed"
] as const;

export interface Stage5ShadowState {
  status: "blocked" | "review" | "ready";
  actionId: "start-stage5-shadow" | "retry-stage5-shadow" | "review-stage5-sandbox-readiness" |
    "run-stage5-sandbox-authorization-preflight" | "record-stage5-sandbox-authorization-review" | null;
  blocker: "stage4-workflow-missing" | "shadow-session-blocked" | "sandbox-probe-missing" | null;
  session: Stage5ShadowSession | null;
  readinessDecision?: Stage5SandboxReadinessDecision | null;
  authorizationPreflight?: Stage5SandboxAuthorizationPreflight | null;
  authorizationReview?: Stage5SandboxAuthorizationReview | null;
  sandboxProbeExecutionId?: string | null;
  sandboxProbeReviewId?: string | null;
}

export function buildStage5ShadowSessionsUrl(baseUrl: string, baseRunId?: string, limit = 20): string {
  return buildApiUrl(baseUrl, "/api/execution/shadow-sessions", baseRunId === undefined ? undefined : (url) => {
    url.searchParams.set("baseRunId", baseRunId);
    url.searchParams.set("limit", String(limit));
  });
}

export function buildStage5SandboxReadinessDecisionsUrl(baseUrl: string, baseRunId?: string, limit = 20): string {
  return buildApiUrl(baseUrl, "/api/execution/sandbox-readiness-decisions", baseRunId === undefined ? undefined : (url) => {
    url.searchParams.set("baseRunId", baseRunId);
    url.searchParams.set("limit", String(limit));
  });
}

export function buildStage5SandboxAuthorizationPreflightsUrl(baseUrl: string, baseRunId?: string, limit = 20): string {
  return buildApiUrl(baseUrl, "/api/execution/sandbox-authorization-preflights", baseRunId === undefined ? undefined : (url) => {
    url.searchParams.set("baseRunId", baseRunId);
    url.searchParams.set("limit", String(limit));
  });
}

export function buildStage5SandboxAuthorizationReviewsUrl(baseUrl: string, baseRunId?: string, limit = 20): string {
  return buildApiUrl(baseUrl, "/api/execution/sandbox-authorization-reviews", baseRunId === undefined ? undefined : (url) => {
    url.searchParams.set("baseRunId", baseRunId);
    url.searchParams.set("limit", String(limit));
  });
}

export function buildStage5ShadowState(
  workflow: Stage4PortfolioWorkflow | null | undefined,
  sessions: readonly Stage5ShadowSession[],
  decisions: readonly Stage5SandboxReadinessDecision[] = [],
  preflights: readonly Stage5SandboxAuthorizationPreflight[] = [],
  authorizationReviews: readonly Stage5SandboxAuthorizationReview[] = [],
  probeExecutions: readonly { id: string; adapterId: string; market: string; status: string; authoritativeHealthReady: boolean }[] = [],
  probeReviews: readonly { id: string; sandboxProbeExecutionId: string; adapterId: string; market: string; status: string }[] = []
): Stage5ShadowState {
  if (!workflow) return { status: "blocked", actionId: null, blocker: "stage4-workflow-missing", session: null, readinessDecision: null };
  const session = [...sessions]
    .filter((row) => row.baseRunId === workflow.baseRunId && row.workflowHash === workflow.workflowHash)
    .sort((left, right) => right.attempt - left.attempt || right.generatedAt.localeCompare(left.generatedAt))[0] ?? null;
  if (!session) return { status: "review", actionId: "start-stage5-shadow", blocker: null, session: null, readinessDecision: null };
  if (session.status === "recoverable_failure") {
    return { status: "review", actionId: "retry-stage5-shadow", blocker: null, session, readinessDecision: null };
  }
  if (session.status === "blocked") {
    return { status: "blocked", actionId: null, blocker: "shadow-session-blocked", session, readinessDecision: null };
  }
  const readinessDecision = decisions.find((row) =>
    row.baseRunId === workflow.baseRunId && row.workflowHash === workflow.workflowHash &&
    row.shadowSessionHash === session.sessionHash
  ) ?? null;
  if (!readinessDecision) {
    return { status: "review", actionId: "review-stage5-sandbox-readiness", blocker: null, session, readinessDecision: null };
  }
  const authorizationPreflight = preflights.find((row) =>
    row.baseRunId === workflow.baseRunId && row.readinessDecisionHash === readinessDecision.decisionHash
  ) ?? null;
  if (authorizationPreflight) {
    const authorizationReview = authorizationReviews.find((row) =>
      row.baseRunId === workflow.baseRunId && row.preflightHash === authorizationPreflight.preflightHash
    ) ?? null;
    return authorizationReview
      ? { status: "ready", actionId: null, blocker: null, session, readinessDecision, authorizationPreflight, authorizationReview }
      : {
          status: "review", actionId: "record-stage5-sandbox-authorization-review", blocker: null,
          session, readinessDecision, authorizationPreflight, authorizationReview: null
        };
  }
  const execution = probeExecutions.find((row) =>
    row.adapterId === readinessDecision.adapterId && row.market === readinessDecision.market &&
    row.status === "probe_execution_recorded" && row.authoritativeHealthReady
  );
  const review = execution && probeReviews.find((row) =>
    row.sandboxProbeExecutionId === execution.id && row.adapterId === readinessDecision.adapterId &&
    row.market === readinessDecision.market && row.status === "probe_review_recorded"
  );
  return execution && review
    ? {
        status: "review", actionId: "run-stage5-sandbox-authorization-preflight", blocker: null,
        session, readinessDecision, authorizationPreflight: null,
        sandboxProbeExecutionId: execution.id, sandboxProbeReviewId: review.id
      }
    : {
        status: "review", actionId: null, blocker: "sandbox-probe-missing",
        session, readinessDecision, authorizationPreflight: null
      };
}

export function isStage5ShadowSession(value: unknown): value is Stage5ShadowSession {
  if (!record(value) || !exact(value, [
    "kind", "schemaVersion", "sessionId", "sessionKey", "generatedAt", "baseRunId", "workflowId", "workflowHash",
    "adapter", "attempt", "failureMode", "status", "limits", "killSwitch", "orders", "reconciliation", "paperOnly",
    "shadowOnly", "liveTradingAllowed", "orderSubmissionEnabled", "routeExecuted", "liveBlockedBoundary", "sessionHash"
  ])) return false;
  const row = value as unknown as Stage5ShadowSession;
  return row.kind === "aiqt.stage5ShadowExecutionSession" && row.schemaVersion === 1 &&
    [row.sessionId, row.baseRunId, row.workflowId].every(nonempty) &&
    [row.sessionKey, row.workflowHash, row.sessionHash].every(hash) && zoned(row.generatedAt) &&
    record(row.adapter) && exact(row.adapter, ["id", "environment", "mode"]) &&
    row.adapter.id === "local-fake-shadow" && row.adapter.environment === "isolated-local" && row.adapter.mode === "shadow" &&
    (row.attempt === 1 || row.attempt === 2) &&
    ["none", "timeout_once", "adapter_rejected", "reconciliation_mismatch", "kill_switch"].includes(row.failureMode) &&
    ["reconciled", "recoverable_failure", "blocked"].includes(row.status) &&
    row.paperOnly === true && row.shadowOnly === true && row.liveTradingAllowed === false &&
    row.orderSubmissionEnabled === false && row.routeExecuted === false && row.liveBlockedBoundary === true &&
    isLimits(row.limits) && record(row.killSwitch) && exact(row.killSwitch, ["enabled", "triggered"]) &&
    row.killSwitch.enabled === true && typeof row.killSwitch.triggered === "boolean" &&
    Array.isArray(row.orders) && row.orders.length > 0 && row.orders.every(isOrder) &&
    record(row.reconciliation) && exact(row.reconciliation, [
      "reconciled", "reason", "stage4OrderCount", "shadowOrderCount", "grossNotional"
    ]) && typeof row.reconciliation.reconciled === "boolean" && nonempty(row.reconciliation.reason) &&
    row.reconciliation.stage4OrderCount === row.orders.length && row.reconciliation.shadowOrderCount === row.orders.length &&
    finite(row.reconciliation.grossNotional) && row.reconciliation.grossNotional > 0 &&
    row.reconciliation.reconciled === (row.status === "reconciled");
}

export function isStage5SandboxReadinessDecision(value: unknown): value is Stage5SandboxReadinessDecision {
  if (!record(value) || !exact(value, [
    "kind", "schemaVersion", "decisionId", "generatedAt", "baseRunId", "workflowId", "workflowHash",
    "shadowSessionId", "shadowSessionHash", "adapterId", "market", "adapterPaperExecutionIds",
    "adapterManifestValidationIds", "adapterAuditEventIds", "operator", "status", "paperOnly", "shadowOnly",
    "sandboxOrderSubmissionAllowed", "liveTradingAllowed", "orderSubmissionEnabled", "routeExecuted",
    "liveBlockedBoundary", "decisionHash"
  ])) return false;
  const row = value as unknown as Stage5SandboxReadinessDecision;
  const refs = [row.adapterPaperExecutionIds, row.adapterManifestValidationIds, row.adapterAuditEventIds];
  return row.kind === "aiqt.stage5SandboxReadinessDecision" && row.schemaVersion === 1 &&
    [row.decisionId, row.baseRunId, row.workflowId, row.shadowSessionId, row.adapterId, row.market, row.operator].every(nonempty) &&
    [row.workflowHash, row.shadowSessionHash, row.decisionHash].every(hash) && zoned(row.generatedAt) &&
    row.status === "ready_for_manually_authorized_sandbox_phase" &&
    refs.every((items) => Array.isArray(items) && items.length > 0 && items.every(nonempty)) &&
    refs.every((items) => items.length === row.adapterPaperExecutionIds.length) &&
    new Set(row.adapterPaperExecutionIds).size === row.adapterPaperExecutionIds.length &&
    row.adapterAuditEventIds.every((id, index) => id === row.adapterPaperExecutionIds[index]) &&
    row.paperOnly === true && row.shadowOnly === true && row.sandboxOrderSubmissionAllowed === false &&
    row.liveTradingAllowed === false && row.orderSubmissionEnabled === false && row.routeExecuted === false &&
    row.liveBlockedBoundary === true;
}

export function isStage5SandboxAuthorizationPreflight(value: unknown): value is Stage5SandboxAuthorizationPreflight {
  if (!record(value) || !exact(value, [
    "kind", "schemaVersion", "preflightId", "generatedAt", "baseRunId", "readinessDecisionId",
    "readinessDecisionHash", "adapterId", "market", "sandboxProbeExecutionId",
    "authoritativeHealthEvidenceHash", "sandboxProbeReviewId", "operator", "status",
    "humanAuthorizationRequired", "sandboxOrderSubmissionAllowed", "liveTradingAllowed",
    "orderSubmissionEnabled", "routeExecuted", "liveBlockedBoundary", "preflightHash"
  ])) return false;
  const row = value as unknown as Stage5SandboxAuthorizationPreflight;
  return row.kind === "aiqt.stage5SandboxAuthorizationPreflight" && row.schemaVersion === 1 &&
    [row.preflightId, row.baseRunId, row.readinessDecisionId, row.sandboxProbeExecutionId,
      row.sandboxProbeReviewId, row.operator].every(nonempty) &&
    [row.preflightHash, row.readinessDecisionHash, row.authoritativeHealthEvidenceHash].every(hash) &&
    zoned(row.generatedAt) && row.adapterId === "ccxt-live" && row.market === "crypto" &&
    row.status === "ready_for_separate_sandbox_authorization" && row.humanAuthorizationRequired === true &&
    row.sandboxOrderSubmissionAllowed === false && row.liveTradingAllowed === false &&
    row.orderSubmissionEnabled === false && row.routeExecuted === false && row.liveBlockedBoundary === true;
}

export function isStage5SandboxAuthorizationReview(value: unknown): value is Stage5SandboxAuthorizationReview {
  if (!record(value) || !exact(value, [
    "kind", "schemaVersion", "reviewId", "reviewHash", "generatedAt", "baseRunId", "preflightId",
    "preflightHash", "adapterId", "market", "reviewer", "outcome", "reason", "confirmedScopeIds",
    "status", "authorizationEffective", "humanAuthorizationRequired", "sandboxOrderSubmissionAllowed",
    "liveTradingAllowed", "orderSubmissionEnabled", "routeExecuted", "liveBlockedBoundary"
  ])) return false;
  const row = value as unknown as Stage5SandboxAuthorizationReview;
  return row.kind === "aiqt.stage5SandboxAuthorizationReview" && row.schemaVersion === 1 &&
    [row.reviewId, row.baseRunId, row.preflightId, row.reviewer, row.reason].every(nonempty) &&
    [row.reviewHash, row.preflightHash].every(hash) && zoned(row.generatedAt) &&
    row.adapterId === "ccxt-live" && row.market === "crypto" &&
    ["approved", "rejected"].includes(row.outcome) && row.status === "authorization_review_recorded" &&
    Array.isArray(row.confirmedScopeIds) &&
    row.confirmedScopeIds.length === STAGE5_SANDBOX_AUTHORIZATION_REVIEW_SCOPE_IDS.length &&
    row.confirmedScopeIds.every((id, index) => id === STAGE5_SANDBOX_AUTHORIZATION_REVIEW_SCOPE_IDS[index]) &&
    row.authorizationEffective === false &&
    row.humanAuthorizationRequired === true && row.sandboxOrderSubmissionAllowed === false &&
    row.liveTradingAllowed === false && row.orderSubmissionEnabled === false &&
    row.routeExecuted === false && row.liveBlockedBoundary === true;
}

export async function runStage5ShadowSession(
  baseUrl: string,
  workflow: Stage4PortfolioWorkflow,
  failureMode: Stage5ShadowFailureMode = "none",
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ session?: Stage5ShadowSession; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(buildStage5ShadowSessionsUrl(baseUrl), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseRunId: workflow.baseRunId,
        workflowHash: workflow.workflowHash,
        failureMode,
        operator: "local-operator"
      })
    }, fetcher);
    if (!record(payload) || !isStage5ShadowSession(payload.shadowSession)) throw new Error("Invalid Stage 5 shadow session contract");
    return { session: payload.shadowSession, source: "core" };
  } catch (error) {
    return { source: "fallback", error: message(error) };
  }
}

export async function loadStage5ShadowSessions(
  baseUrl: string,
  baseRunId: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init),
  limit = 20
): Promise<{ sessions: Stage5ShadowSession[]; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(buildStage5ShadowSessionsUrl(baseUrl, baseRunId, limit), undefined, fetcher);
    if (!record(payload) || !Array.isArray(payload.shadowSessions) || !payload.shadowSessions.every(isStage5ShadowSession)) {
      throw new Error("Invalid Stage 5 shadow history contract");
    }
    return { sessions: payload.shadowSessions, source: "core" };
  } catch (error) {
    return { sessions: [], source: "fallback", error: message(error) };
  }
}

export async function runStage5SandboxReadinessDecision(
  baseUrl: string,
  workflow: Stage4PortfolioWorkflow,
  session: Stage5ShadowSession,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ decision?: Stage5SandboxReadinessDecision; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(buildStage5SandboxReadinessDecisionsUrl(baseUrl), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseRunId: workflow.baseRunId,
        workflowHash: workflow.workflowHash,
        sessionHash: session.sessionHash,
        operator: "local-operator",
        confirmed: true
      })
    }, fetcher);
    if (!record(payload) || !isStage5SandboxReadinessDecision(payload.sandboxReadinessDecision)) {
      throw new Error("Invalid Stage 5 sandbox readiness decision contract");
    }
    return { decision: payload.sandboxReadinessDecision, source: "core" };
  } catch (error) {
    return { source: "fallback", error: message(error) };
  }
}

export async function loadStage5SandboxReadinessDecisions(
  baseUrl: string,
  baseRunId: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init),
  limit = 20
): Promise<{ decisions: Stage5SandboxReadinessDecision[]; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(
      buildStage5SandboxReadinessDecisionsUrl(baseUrl, baseRunId, limit), undefined, fetcher
    );
    if (!record(payload) || !Array.isArray(payload.sandboxReadinessDecisions) ||
      !payload.sandboxReadinessDecisions.every(isStage5SandboxReadinessDecision)) {
      throw new Error("Invalid Stage 5 sandbox readiness history contract");
    }
    return { decisions: payload.sandboxReadinessDecisions, source: "core" };
  } catch (error) {
    return { decisions: [], source: "fallback", error: message(error) };
  }
}

export async function runStage5SandboxAuthorizationPreflight(
  baseUrl: string,
  decision: Stage5SandboxReadinessDecision,
  sandboxProbeExecutionId: string,
  sandboxProbeReviewId: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ preflight?: Stage5SandboxAuthorizationPreflight; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(buildStage5SandboxAuthorizationPreflightsUrl(baseUrl), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseRunId: decision.baseRunId,
        readinessDecisionHash: decision.decisionHash,
        sandboxProbeExecutionId,
        sandboxProbeReviewId,
        operator: "local-operator",
        confirmed: true
      })
    }, fetcher);
    if (!record(payload) || !isStage5SandboxAuthorizationPreflight(payload.sandboxAuthorizationPreflight)) {
      throw new Error("Invalid Stage 5 sandbox authorization preflight contract");
    }
    return { preflight: payload.sandboxAuthorizationPreflight, source: "core" };
  } catch (error) {
    return { source: "fallback", error: message(error) };
  }
}

export async function loadStage5SandboxAuthorizationPreflights(
  baseUrl: string,
  baseRunId: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init),
  limit = 20
): Promise<{ preflights: Stage5SandboxAuthorizationPreflight[]; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(
      buildStage5SandboxAuthorizationPreflightsUrl(baseUrl, baseRunId, limit), undefined, fetcher
    );
    if (!record(payload) || !Array.isArray(payload.sandboxAuthorizationPreflights) ||
      !payload.sandboxAuthorizationPreflights.every(isStage5SandboxAuthorizationPreflight)) {
      throw new Error("Invalid Stage 5 sandbox authorization preflight history contract");
    }
    return { preflights: payload.sandboxAuthorizationPreflights, source: "core" };
  } catch (error) {
    return { preflights: [], source: "fallback", error: message(error) };
  }
}

export async function runStage5SandboxAuthorizationReview(
  baseUrl: string,
  preflight: Stage5SandboxAuthorizationPreflight,
  outcome: "approved" | "rejected",
  reason: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ review?: Stage5SandboxAuthorizationReview; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(buildStage5SandboxAuthorizationReviewsUrl(baseUrl), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseRunId: preflight.baseRunId,
        preflightHash: preflight.preflightHash,
        reviewer: "local-reviewer",
        outcome,
        reason,
        confirmations: {
          "preflight-hash-reviewed": true,
          "sandbox-only-scope": true,
          "no-order-submission": true,
          "no-live-funds": true,
          "kill-switch-and-rollback-owner-reviewed": true
        }
      })
    }, fetcher);
    if (!record(payload) || !isStage5SandboxAuthorizationReview(payload.sandboxAuthorizationReview)) {
      throw new Error("Invalid Stage 5 sandbox authorization review contract");
    }
    return { review: payload.sandboxAuthorizationReview, source: "core" };
  } catch (error) {
    return { source: "fallback", error: message(error) };
  }
}

export async function loadStage5SandboxAuthorizationReviews(
  baseUrl: string,
  baseRunId: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init),
  limit = 20
): Promise<{ reviews: Stage5SandboxAuthorizationReview[]; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(
      buildStage5SandboxAuthorizationReviewsUrl(baseUrl, baseRunId, limit), undefined, fetcher
    );
    if (!record(payload) || !Array.isArray(payload.sandboxAuthorizationReviews) ||
      !payload.sandboxAuthorizationReviews.every(isStage5SandboxAuthorizationReview)) {
      throw new Error("Invalid Stage 5 sandbox authorization review history contract");
    }
    return { reviews: payload.sandboxAuthorizationReviews, source: "core" };
  } catch (error) {
    return { reviews: [], source: "fallback", error: message(error) };
  }
}

async function request(url: string, init: RequestInit | undefined, fetcher: WorkspaceFetcher): Promise<unknown> {
  const response = await fetcher(url, init);
  if (!response.ok) {
    let payload: unknown;
    try { payload = await response.json(); } catch { /* status fallback */ }
    const blockers = record(payload) && Array.isArray(payload.blockers)
      ? payload.blockers.filter(nonempty).join("; ")
      : "";
    throw new Error(blockers || coreErrorDetail(payload) || `HTTP ${response.status ?? "error"}`);
  }
  return response.json();
}

function isLimits(value: unknown): value is Stage5ShadowSession["limits"] {
  return record(value) && exact(value, ["maxOrders", "maxGrossNotional", "timeoutSeconds", "maxAttempts"]) &&
    Number.isInteger(value.maxOrders) && value.maxOrders > 0 && finite(value.maxGrossNotional) && value.maxGrossNotional > 0 &&
    value.timeoutSeconds === 3 && value.maxAttempts === 2;
}

function isOrder(value: unknown): value is Stage5ShadowOrder {
  return record(value) && exact(value, [
    "orderId", "clientOrderId", "symbol", "side", "quantity", "notionalValue", "state", "reason", "transitions"
  ]) && [value.orderId, value.clientOrderId, value.symbol, value.side, value.state, value.reason].every(nonempty) &&
    /^shadow-[0-9a-f]{24}$/.test(value.clientOrderId) && finite(value.quantity) && value.quantity > 0 &&
    finite(value.notionalValue) && value.notionalValue > 0 && Array.isArray(value.transitions) && value.transitions.length > 0 &&
    value.transitions.every((item) => record(item) && exact(item, ["state", "at"]) && nonempty(item.state) && zoned(item.at));
}

function record(value: unknown): value is Record<string, any> { return !!value && typeof value === "object" && !Array.isArray(value); }
function exact(value: object, keys: readonly string[]): boolean { const actual = Object.keys(value); return actual.length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function nonempty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function finite(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
function hash(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function zoned(value: unknown): value is string { return nonempty(value) && !Number.isNaN(Date.parse(value)) && /(Z|[+-]\d{2}:\d{2})$/.test(value); }
function message(error: unknown): string { return error instanceof Error ? error.message : "Unknown Stage 5 shadow error"; }
