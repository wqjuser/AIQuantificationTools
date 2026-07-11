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

export interface Stage5ShadowState {
  status: "blocked" | "review" | "ready";
  actionId: "start-stage5-shadow" | "retry-stage5-shadow" | null;
  blocker: "stage4-workflow-missing" | "shadow-session-blocked" | null;
  session: Stage5ShadowSession | null;
}

export function buildStage5ShadowSessionsUrl(baseUrl: string, baseRunId?: string, limit = 20): string {
  return buildApiUrl(baseUrl, "/api/execution/shadow-sessions", baseRunId === undefined ? undefined : (url) => {
    url.searchParams.set("baseRunId", baseRunId);
    url.searchParams.set("limit", String(limit));
  });
}

export function buildStage5ShadowState(
  workflow: Stage4PortfolioWorkflow | null | undefined,
  sessions: readonly Stage5ShadowSession[]
): Stage5ShadowState {
  if (!workflow) return { status: "blocked", actionId: null, blocker: "stage4-workflow-missing", session: null };
  const session = [...sessions]
    .filter((row) => row.baseRunId === workflow.baseRunId && row.workflowHash === workflow.workflowHash)
    .sort((left, right) => right.attempt - left.attempt || right.generatedAt.localeCompare(left.generatedAt))[0] ?? null;
  if (!session) return { status: "review", actionId: "start-stage5-shadow", blocker: null, session: null };
  if (session.status === "recoverable_failure") {
    return { status: "review", actionId: "retry-stage5-shadow", blocker: null, session };
  }
  if (session.status === "blocked") {
    return { status: "blocked", actionId: null, blocker: "shadow-session-blocked", session };
  }
  return { status: "ready", actionId: null, blocker: null, session };
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

async function request(url: string, init: RequestInit | undefined, fetcher: WorkspaceFetcher): Promise<unknown> {
  const response = await fetcher(url, init);
  if (!response.ok) {
    let payload: unknown;
    try { payload = await response.json(); } catch { /* status fallback */ }
    throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
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
