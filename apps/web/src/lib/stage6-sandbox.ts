import { buildApiUrl, coreErrorDetail, type WorkspaceFetcher, type WorkspaceSource } from "./terminal-api";
import type { Stage4PortfolioWorkflow } from "./portfolio-stage4";
import type {
  Stage5SandboxAuthorizationPreflight,
  Stage5SandboxAuthorizationReview,
  Stage5SandboxReadinessDecision,
  Stage5ShadowSession
} from "./stage5-shadow";

export interface Stage6SandboxOrder {
  orderId: string; clientOrderId: string; symbol: string; side: "buy" | "sell";
  type: "limit"; timeInForce: "GTC"; quantity: number; price: number; notionalValue: number;
}

export interface Stage6SandboxBatchAuthorization {
  kind: "aiqt.stage6SandboxBatchAuthorization"; schemaVersion: 1; authorizationId: string;
  authorizationHash: string; generatedAt: string; expiresAt: string; baseRunId: string;
  workflowId: string; workflowHash: string; batchId: string; shadowSessionHash: string;
  readinessDecisionHash: string; preflightHash: string; reviewHash: string; orders: Stage6SandboxOrder[];
  ordersHash: string; operator: string; status: "authorized"; sandboxOnly: true;
  sandboxOrderSubmissionAllowed: true; sandboxOrderSubmitted: false; sandboxRouteExecuted: false;
  liveTradingAllowed: false; liveOrderSubmissionAllowed: false;
  liveOrderSubmitted: false; liveRouteExecuted: false; liveBlockedBoundary: true;
}

export interface Stage6SandboxBatchOrder extends Stage6SandboxOrder {
  state: "authorized" | "submission_pending" | "open" | "partially_filled" | "filled" |
    "canceled" | "expired" | "rejected" | "reconciliation_required";
  attempt: number; exchangeEvidence: Record<string, unknown>; sequence?: number; recordedAt?: string;
  transitionHash?: string; error?: string; authorizationId?: string; batchId?: string;
}

export interface Stage6SandboxBatch {
  authorizationId: string; baseRunId: string; batchId: string;
  status: "authorized" | "active" | "blocked" | "reconciliation_required" | "reconciled";
  orders: Stage6SandboxBatchOrder[];
  killSwitch: Stage6KillSwitch; sandboxOnly: true; sandboxOrderSubmitted: boolean; sandboxRouteExecuted: boolean;
  liveTradingAllowed: false; liveOrderSubmissionAllowed: false; liveOrderSubmitted: false;
  liveRouteExecuted: false; liveBlockedBoundary: true;
}

export interface Stage6KillSwitch {
  enabled: true; triggered: boolean; recordedAt: string | null; operator: string | null;
}

export interface Stage6ExitAcceptanceStatus {
  kind: "aiqt.stage6ExitAcceptanceStatus"; schemaVersion: 1;
  status: "accepted" | "missing" | "invalid"; available: boolean; sourcePath: string;
  summary: string; reason: string; authorizationId: string | null; exitHash: string | null;
  sandboxOrderSubmitted: boolean; sandboxRouteExecuted: boolean;
  liveTradingAllowed: boolean; liveBlockedBoundary: boolean;
}

export type Stage6GoldenPathAction = "authorize" | "submit" | "reconcile" | "cancel" | null;

export function buildStage6GoldenPath(
  workflow: Stage4PortfolioWorkflow | null | undefined,
  shadow: Stage5ShadowSession | null | undefined,
  readiness: Stage5SandboxReadinessDecision | null | undefined,
  preflight: Stage5SandboxAuthorizationPreflight | null | undefined,
  review: Stage5SandboxAuthorizationReview | null | undefined,
  authorization: Stage6SandboxBatchAuthorization | null | undefined,
  batch: Stage6SandboxBatch | null | undefined
): { action: Stage6GoldenPathAction; status: "blocked" | "review" | "active" | "reconciled"; detail: string } {
  if (!workflow || !shadow || !readiness || !preflight || !review || review.outcome !== "approved") {
    return { action: null, status: "blocked", detail: "Stage 4/5 权威证据链尚未批准。" };
  }
  if (!authorization) return { action: "authorize", status: "review", detail: "检查规范化订单并记录一次性批次授权。" };
  if (!batch || batch.status === "authorized") return { action: "submit", status: "review", detail: "授权批次尚未提交到 Binance Spot Testnet。" };
  if (batch.status === "reconciliation_required") return { action: "reconcile", status: "blocked", detail: "订单状态未知，必须先对账。" };
  if (batch.status === "active") return { action: "cancel", status: "active", detail: "批次存在未终态测试网订单。" };
  return { action: null, status: "reconciled", detail: "批次已按交易所事实完成对账。" };
}

export function isStage6SandboxBatchAuthorization(value: unknown): value is Stage6SandboxBatchAuthorization {
  if (!record(value)) return false;
  const row = value as unknown as Stage6SandboxBatchAuthorization;
  return row.kind === "aiqt.stage6SandboxBatchAuthorization" && row.schemaVersion === 1 &&
    [row.authorizationId, row.baseRunId, row.workflowId, row.batchId, row.operator].every(nonempty) &&
    [row.authorizationHash, row.workflowHash, row.shadowSessionHash, row.readinessDecisionHash,
      row.preflightHash, row.reviewHash, row.ordersHash].every(hash) &&
    zoned(row.generatedAt) && zoned(row.expiresAt) && row.status === "authorized" &&
    Array.isArray(row.orders) && row.orders.length > 0 && row.orders.every(isOrder) &&
    row.sandboxOnly === true && row.sandboxOrderSubmissionAllowed === true &&
    row.sandboxOrderSubmitted === false && row.sandboxRouteExecuted === false &&
    row.liveTradingAllowed === false && row.liveOrderSubmissionAllowed === false &&
    row.liveOrderSubmitted === false && row.liveRouteExecuted === false && row.liveBlockedBoundary === true;
}

export function isStage6SandboxBatch(value: unknown): value is Stage6SandboxBatch {
  if (!record(value)) return false;
  const row = value as unknown as Stage6SandboxBatch;
  return [row.authorizationId, row.baseRunId, row.batchId].every(nonempty) &&
    ["authorized", "active", "blocked", "reconciliation_required", "reconciled"].includes(row.status) &&
    Array.isArray(row.orders) && row.orders.length > 0 && row.orders.every((order) =>
      isOrder(order) && nonempty(order.state) && Number.isInteger(order.attempt) && order.attempt >= 0 && record(order.exchangeEvidence)
    ) && isKillSwitch(row.killSwitch) && row.sandboxOnly === true &&
    typeof row.sandboxOrderSubmitted === "boolean" && typeof row.sandboxRouteExecuted === "boolean" &&
    row.liveTradingAllowed === false && row.liveOrderSubmissionAllowed === false &&
    row.liveOrderSubmitted === false && row.liveRouteExecuted === false && row.liveBlockedBoundary === true;
}

export function buildStage6AuthorizationsUrl(baseUrl: string, baseRunId?: string): string {
  return buildApiUrl(baseUrl, "/api/execution/stage6/sandbox-authorizations", baseRunId ? (url) => url.searchParams.set("baseRunId", baseRunId) : undefined);
}

export function buildStage6BatchUrl(baseUrl: string, authorizationId?: string): string {
  return buildApiUrl(baseUrl, "/api/execution/stage6/sandbox-batches", authorizationId ? (url) => url.searchParams.set("authorizationId", authorizationId) : undefined);
}

export async function authorizeStage6SandboxBatch(
  baseUrl: string, workflow: Stage4PortfolioWorkflow, shadow: Stage5ShadowSession,
  readiness: Stage5SandboxReadinessDecision, preflight: Stage5SandboxAuthorizationPreflight,
  review: Stage5SandboxAuthorizationReview, fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ authorization?: Stage6SandboxBatchAuthorization; source: WorkspaceSource; error?: string }> {
  return result("sandboxBatchAuthorization", isStage6SandboxBatchAuthorization, buildStage6AuthorizationsUrl(baseUrl), {
    workflowId: workflow.workflowId, shadowSessionId: shadow.sessionId, readinessDecisionId: readiness.decisionId,
    preflightId: preflight.preflightId, reviewId: review.reviewId, operator: "local-operator"
  }, fetcher, "authorization");
}

export async function loadStage6SandboxAuthorizations(
  baseUrl: string, baseRunId: string, fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ authorizations: Stage6SandboxBatchAuthorization[]; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(buildStage6AuthorizationsUrl(baseUrl, baseRunId), undefined, fetcher);
    if (!record(payload) || !Array.isArray(payload.sandboxBatchAuthorizations) ||
      !payload.sandboxBatchAuthorizations.every(isStage6SandboxBatchAuthorization)) {
      throw new Error("Invalid Stage 6 authorization history contract");
    }
    return { authorizations: payload.sandboxBatchAuthorizations, source: "core" };
  } catch (error) { return { authorizations: [], source: "fallback", error: message(error) }; }
}

export async function submitStage6SandboxBatch(
  baseUrl: string, authorizationId: string, fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ batch?: Stage6SandboxBatch; source: WorkspaceSource; error?: string }> {
  return result("sandboxBatch", isStage6SandboxBatch, buildStage6BatchUrl(baseUrl), { authorizationId }, fetcher, "batch");
}

export async function reconcileStage6SandboxBatch(
  baseUrl: string, authorizationId: string, fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ batch?: Stage6SandboxBatch; source: WorkspaceSource; error?: string }> {
  return result("sandboxBatch", isStage6SandboxBatch, buildApiUrl(baseUrl, "/api/execution/stage6/sandbox-reconciliations"),
    { authorizationId }, fetcher, "batch");
}

export async function cancelStage6SandboxOrder(
  baseUrl: string, authorizationId: string, orderId: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ batch?: Stage6SandboxBatch; source: WorkspaceSource; error?: string }> {
  return result("sandboxBatch", isStage6SandboxBatch, buildApiUrl(baseUrl, "/api/execution/stage6/sandbox-cancellations"),
    { authorizationId, orderId }, fetcher, "batch");
}

export async function setStage6KillSwitch(
  baseUrl: string, triggered: boolean, fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ killSwitch?: Stage6KillSwitch; source: WorkspaceSource; error?: string }> {
  return result("killSwitch", isKillSwitch, buildApiUrl(baseUrl, "/api/execution/stage6/kill-switch"),
    { triggered, operator: "local-operator" }, fetcher, "killSwitch");
}

export async function loadStage6KillSwitch(
  baseUrl: string, fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ killSwitch?: Stage6KillSwitch; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(buildApiUrl(baseUrl, "/api/execution/stage6/kill-switch"), undefined, fetcher);
    if (!record(payload) || !isKillSwitch(payload.killSwitch)) throw new Error("Invalid Stage 6 kill switch contract");
    return { killSwitch: payload.killSwitch, source: "core" };
  } catch (error) { return { source: "fallback", error: message(error) }; }
}

export async function loadStage6SandboxBatch(
  baseUrl: string, authorizationId: string, fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ batch?: Stage6SandboxBatch; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(buildStage6BatchUrl(baseUrl, authorizationId), undefined, fetcher);
    if (!record(payload) || !isStage6SandboxBatch(payload.sandboxBatch)) throw new Error("Invalid Stage 6 batch contract");
    return { batch: payload.sandboxBatch, source: "core" };
  } catch (error) {
    return { source: "fallback", error: message(error) };
  }
}

export async function loadStage6ExitAcceptance(
  baseUrl: string, fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ acceptance?: Stage6ExitAcceptanceStatus; source: WorkspaceSource; error?: string }> {
  try {
    const payload = await request(buildApiUrl(baseUrl, "/api/stage6/exit-acceptance/latest"), undefined, fetcher);
    if (!record(payload) || !isExitAcceptance(payload.acceptance)) throw new Error("Invalid Stage 6 exit acceptance contract");
    return { acceptance: payload.acceptance, source: "core" };
  } catch (error) { return { source: "fallback", error: message(error) }; }
}

async function result<T, K extends "authorization" | "batch" | "killSwitch">(
  key: string, guard: (value: unknown) => value is T, url: string, body: object,
  fetcher: WorkspaceFetcher, output: K
): Promise<{ source: WorkspaceSource; error?: string } & Partial<Record<K, T>>> {
  try {
    const payload = await request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, fetcher);
    if (!record(payload) || !guard(payload[key])) throw new Error(`Invalid Stage 6 ${output} contract`);
    return { [output]: payload[key], source: "core" } as { source: WorkspaceSource } & Record<K, T>;
  } catch (error) {
    return { source: "fallback", error: message(error) } as { source: WorkspaceSource; error: string } & Partial<Record<K, T>>;
  }
}

async function request(url: string, init: RequestInit | undefined, fetcher: WorkspaceFetcher): Promise<unknown> {
  const response = await fetcher(url, init);
  if (!response.ok) {
    let payload: unknown;
    try { payload = await response.json(); } catch { /* status fallback */ }
    const blockers = record(payload) && Array.isArray(payload.blockers) ? payload.blockers.filter(nonempty).join("; ") : "";
    throw new Error(blockers || coreErrorDetail(payload) || `HTTP ${response.status}`);
  }
  return response.json();
}

function isOrder(value: unknown): value is Stage6SandboxOrder {
  return record(value) && [value.orderId, value.clientOrderId, value.symbol].every(nonempty) &&
    /^shadow-[0-9a-f]{24}$/.test(value.clientOrderId) && ["buy", "sell"].includes(value.side) &&
    value.type === "limit" && value.timeInForce === "GTC" &&
    [value.quantity, value.price, value.notionalValue].every((item) => typeof item === "number" && Number.isFinite(item) && item > 0);
}
function isKillSwitch(value: unknown): value is Stage6KillSwitch { return record(value) && value.enabled === true && typeof value.triggered === "boolean" && (value.recordedAt === null || zoned(value.recordedAt)) && (value.operator === null || nonempty(value.operator)); }
function isExitAcceptance(value: unknown): value is Stage6ExitAcceptanceStatus {
  return record(value) && value.kind === "aiqt.stage6ExitAcceptanceStatus" && value.schemaVersion === 1 &&
    ["accepted", "missing", "invalid"].includes(value.status) && typeof value.available === "boolean" &&
    [value.sourcePath, value.summary, value.reason].every((item) => typeof item === "string") &&
    (value.authorizationId === null || nonempty(value.authorizationId)) && (value.exitHash === null || hash(value.exitHash)) &&
    [value.sandboxOrderSubmitted, value.sandboxRouteExecuted, value.liveTradingAllowed, value.liveBlockedBoundary]
      .every((item) => typeof item === "boolean");
}
function record(value: unknown): value is Record<string, any> { return !!value && typeof value === "object" && !Array.isArray(value); }
function nonempty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function hash(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function zoned(value: unknown): value is string { return nonempty(value) && !Number.isNaN(Date.parse(value)) && /(Z|[+-]\d{2}:\d{2})$/.test(value); }
function message(error: unknown): string { return error instanceof Error ? error.message : "Unknown Stage 6 sandbox error"; }
