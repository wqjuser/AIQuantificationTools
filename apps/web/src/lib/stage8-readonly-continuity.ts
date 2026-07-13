import { buildApiUrl, coreErrorDetail, type WorkspaceFetcher, type WorkspaceSource } from "./terminal-api";

export interface Stage8ProductionReadonlyAccessControl {
  kind: "aiqt.stage8ProductionReadonlyAccessControl";
  schemaVersion: 1;
  controlId: string;
  action: "revoke" | "restore";
  status: "active" | "revoked";
  operator: string;
  reason: string;
  recordedAt: string;
  productionRouteReviewId: string | null;
  previousControlId: string | null;
  productionReadOnly: true;
  liveTradingAllowed: false;
  orderRoutingEnabled: false;
  liveOrderSubmitted: false;
  liveRouteExecuted: false;
  liveBlockedBoundary: true;
  controlHash: string;
}

export interface Stage8ProductionReadonlyContinuity {
  kind: "aiqt.stage8ProductionReadonlyContinuity";
  schemaVersion: 1;
  generatedAt: string;
  status: "current" | "stale" | "blocked" | "revoked" | "missing";
  accessState: "active" | "revoked";
  accessControl: Stage8ProductionReadonlyAccessControl | null;
  latestProbe: {
    probeId: string;
    evidenceHash: string;
    status: "ready" | "review" | "blocked";
    generatedAt: string;
    productionRouteReviewId: string;
  } | null;
  expiresAt: string | null;
  stage6HashMatches: boolean;
  routeReviewCurrent: boolean;
  probeFresh: boolean;
  permissionDrift: boolean;
  blockedReasons: string[];
  productionReadOnly: true;
  liveTradingAllowed: false;
  orderRoutingEnabled: false;
  liveOrderSubmitted: false;
  liveRouteExecuted: false;
  liveBlockedBoundary: true;
  continuityHash: string;
}

export async function loadStage8ProductionReadonlyContinuity(
  baseUrl: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ continuity?: Stage8ProductionReadonlyContinuity; source: WorkspaceSource; error?: string }> {
  try {
    const response = await fetcher(buildApiUrl(baseUrl, "/api/execution/stage8/production-readonly-continuity"));
    const payload = await response.json();
    if (!response.ok) throw new Error(coreErrorDetail(payload) || `HTTP ${response.status}`);
    if (!record(payload) || !isStage8ProductionReadonlyContinuity(payload.productionReadonlyContinuity)) {
      throw new Error("Invalid Stage 8 production read-only continuity contract");
    }
    return { continuity: payload.productionReadonlyContinuity, source: "core" };
  } catch (error) {
    return { source: "fallback", error: message(error) };
  }
}

export async function setStage8ProductionReadonlyAccess(
  baseUrl: string,
  action: "revoke" | "restore",
  reason: string,
  productionRouteReviewId: string | null,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ continuity?: Stage8ProductionReadonlyContinuity; source: WorkspaceSource; error?: string }> {
  try {
    const response = await fetcher(buildApiUrl(baseUrl, "/api/execution/stage8/production-readonly-access-controls"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, operator: "execution-workspace", reason, productionRouteReviewId })
    });
    const payload = await response.json();
    if (response.ok && record(payload) && isStage8ProductionReadonlyContinuity(payload.productionReadonlyContinuity)) {
      return { continuity: payload.productionReadonlyContinuity, source: "core" };
    }
    throw new Error(coreErrorDetail(payload) || `HTTP ${response.status}`);
  } catch (error) {
    return { source: "fallback", error: message(error) };
  }
}

export function isStage8ProductionReadonlyContinuity(value: unknown): value is Stage8ProductionReadonlyContinuity {
  if (!record(value)) return false;
  const control = value.accessControl;
  const probe = value.latestProbe;
  const exactFields = [
    "kind", "schemaVersion", "generatedAt", "status", "accessState", "accessControl", "latestProbe",
    "expiresAt", "stage6HashMatches", "routeReviewCurrent", "probeFresh", "permissionDrift",
    "blockedReasons", "productionReadOnly", "liveTradingAllowed", "orderRoutingEnabled",
    "liveOrderSubmitted", "liveRouteExecuted", "liveBlockedBoundary", "continuityHash"
  ];
  return hasExactKeys(value, exactFields) && value.kind === "aiqt.stage8ProductionReadonlyContinuity" &&
    value.schemaVersion === 1 && ["current", "stale", "blocked", "revoked", "missing"].includes(value.status) &&
    ["active", "revoked"].includes(value.accessState) && zoned(value.generatedAt) &&
    (value.expiresAt === null || zoned(value.expiresAt)) &&
    [value.stage6HashMatches, value.routeReviewCurrent, value.probeFresh, value.permissionDrift].every(
      (flag) => typeof flag === "boolean"
    ) && Array.isArray(value.blockedReasons) && value.blockedReasons.every(nonempty) && hash(value.continuityHash) &&
    (control === null ? value.accessState === "active" : isAccessControl(control) && control.status === value.accessState) &&
    (probe === null || isProbeReference(probe)) &&
    value.productionReadOnly === true && value.liveTradingAllowed === false && value.orderRoutingEnabled === false &&
    value.liveOrderSubmitted === false && value.liveRouteExecuted === false && value.liveBlockedBoundary === true &&
    (value.status !== "current" || (probe?.status === "ready" && value.accessState === "active" &&
      value.stage6HashMatches && value.routeReviewCurrent && value.probeFresh && !value.permissionDrift &&
      value.blockedReasons.length === 0)) &&
    (value.status !== "revoked" || value.accessState === "revoked") &&
    (value.status !== "missing" || probe === null);
}

function isAccessControl(value: unknown): value is Stage8ProductionReadonlyAccessControl {
  if (!record(value)) return false;
  const action = value.action;
  const exactFields = [
    "kind", "schemaVersion", "controlId", "action", "status", "operator", "reason", "recordedAt",
    "productionRouteReviewId", "previousControlId", "productionReadOnly", "liveTradingAllowed",
    "orderRoutingEnabled", "liveOrderSubmitted", "liveRouteExecuted", "liveBlockedBoundary", "controlHash"
  ];
  return hasExactKeys(value, exactFields) && value.kind === "aiqt.stage8ProductionReadonlyAccessControl" &&
    value.schemaVersion === 1 && ["revoke", "restore"].includes(action) &&
    value.status === (action === "revoke" ? "revoked" : "active") &&
    nonempty(value.controlId) && nonempty(value.operator) && nonempty(value.reason) && zoned(value.recordedAt) &&
    (value.productionRouteReviewId === null || nonempty(value.productionRouteReviewId)) &&
    (value.previousControlId === null || nonempty(value.previousControlId)) && hash(value.controlHash) &&
    value.productionReadOnly === true && value.liveTradingAllowed === false && value.orderRoutingEnabled === false &&
    value.liveOrderSubmitted === false && value.liveRouteExecuted === false && value.liveBlockedBoundary === true;
}

function isProbeReference(value: unknown): boolean {
  return record(value) && hasExactKeys(value, [
    "probeId", "evidenceHash", "status", "generatedAt", "productionRouteReviewId"
  ]) && nonempty(value.probeId) && value.probeId.startsWith("stage7-production-readonly-") && hash(value.evidenceHash) &&
    ["ready", "review", "blocked"].includes(value.status) && zoned(value.generatedAt) &&
    nonempty(value.productionRouteReviewId);
}

function record(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function hasExactKeys(value: Record<string, any>, fields: string[]): boolean {
  return Object.keys(value).length === fields.length && fields.every((field) => Object.hasOwn(value, field));
}
function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function hash(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}
function zoned(value: unknown): value is string {
  return nonempty(value) && !Number.isNaN(Date.parse(value)) && /(Z|[+-]\d{2}:\d{2})$/.test(value);
}
function message(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Stage 8 production read-only continuity error";
}
