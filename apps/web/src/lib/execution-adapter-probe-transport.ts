import type { Market } from "./terminal-workbench";
import {
  buildApiUrl,
  coreErrorDetail,
  defaultFetcher,
  type WorkspaceFetcher
} from "./terminal-api-http";
import {
  isAuditEventRecord,
  isMarket,
  isPlainRecord,
  isSecretFreeRecord,
  type AuditEventRecord
} from "./terminal-api-contract";

type WorkspaceSource = "core" | "fallback";

export type ExecutionAdapterSandboxProbeExecutionStatus = "blocked" | "probe_execution_recorded";
export type ExecutionAdapterSandboxProbeExecutionConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSandboxProbeExecutionConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterSandboxProbeExecutionConfirmationStatus;
}

export interface ExecutionAdapterSandboxProbeExecutionResult {
  schemaVersion: 1;
  sandboxProbeExecutionId: string;
  sandboxProbePlanId: string;
  humanConfirmationId: string;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterSandboxProbeExecutionStatus;
  operator: string;
  recordedAt: string;
  probeExecutionMode: string;
  probeMode: string;
  confirmationMode: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterSandboxProbeExecutionConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSandboxProbeExecutionRequest {
  adapterId: string;
  sandboxProbePlanId: string;
  exchangeId?: string;
  operator?: string;
  probeExecutionMode?: string;
  confirmations?: {
    probePlanReviewed?: boolean;
    readonlyHandshakeCaptured?: boolean;
    accountSnapshotRedacted?: boolean;
    orderSchemaValidated?: boolean;
    operatorConfirmedNoOrdersSubmitted?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSandboxProbeExecutionRecordResult {
  adapterSandboxProbeExecution?: ExecutionAdapterSandboxProbeExecutionResult;
  adapterHealthProbe?: ExecutionAdapterHealthProbeResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSandboxProbeExecutionHistoryResult {
  adapterSandboxProbeExecutions: ExecutionAdapterSandboxProbeExecutionResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterSandboxProbeReviewStatus = "blocked" | "probe_review_recorded";
export type ExecutionAdapterSandboxProbeReviewConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSandboxProbeReviewConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterSandboxProbeReviewConfirmationStatus;
}

export interface ExecutionAdapterSandboxProbeReviewResult {
  schemaVersion: 1;
  sandboxProbeReviewId: string;
  sandboxProbeExecutionId: string;
  sandboxProbePlanId: string;
  humanConfirmationId: string;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterSandboxProbeReviewStatus;
  operator: string;
  recordedAt: string;
  reviewMode: string;
  probeExecutionMode: string;
  probeMode: string;
  confirmationMode: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterSandboxProbeReviewConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSandboxProbeReviewRequest {
  adapterId: string;
  sandboxProbeExecutionId: string;
  operator?: string;
  reviewMode?: string;
  confirmations?: {
    probeExecutionReviewed?: boolean;
    readonlyEvidenceMatchesPlan?: boolean;
    redactedSnapshotArchived?: boolean;
    orderSchemaRiskReviewed?: boolean;
    productionRouteStillBlocked?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSandboxProbeReviewRecordResult {
  adapterSandboxProbeReview?: ExecutionAdapterSandboxProbeReviewResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSandboxProbeReviewHistoryResult {
  adapterSandboxProbeReviews: ExecutionAdapterSandboxProbeReviewResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterProductionRouteReviewStatus = "blocked" | "route_review_recorded";
export type ExecutionAdapterProductionRouteReviewConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterProductionRouteReviewConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterProductionRouteReviewConfirmationStatus;
}

export interface ExecutionAdapterProductionRouteReviewResult {
  schemaVersion: 1;
  productionRouteReviewId: string;
  sandboxProbeReviewId: string;
  sandboxProbeExecutionId: string;
  sandboxProbePlanId: string;
  humanConfirmationId: string;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterProductionRouteReviewStatus;
  operator: string;
  recordedAt: string;
  reviewMode: string;
  sandboxReviewMode: string;
  probeExecutionMode: string;
  probeMode: string;
  confirmationMode: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterProductionRouteReviewConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterProductionRouteReviewRequest {
  adapterId: string;
  sandboxProbeReviewId: string;
  operator?: string;
  reviewMode?: string;
  confirmations?: {
    sandboxProbeReviewAccepted?: boolean;
    killSwitchPolicyReviewed?: boolean;
    orderRoutingDisabledVerified?: boolean;
    positionLimitPolicyReviewed?: boolean;
    rollbackOwnerRecorded?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterProductionRouteReviewRecordResult {
  adapterProductionRouteReview?: ExecutionAdapterProductionRouteReviewResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterProductionRouteReviewHistoryResult {
  adapterProductionRouteReviews: ExecutionAdapterProductionRouteReviewResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterHealthProbeStatus = "ready" | "review" | "blocked";
export type ExecutionAdapterHealthProbeCheckStatus = "passed" | "review" | "blocked" | "skipped";

export interface ExecutionAdapterHealthProbeCheck {
  id: string;
  label: string;
  status: ExecutionAdapterHealthProbeCheckStatus;
  detail: string;
  latencyMs: number | null;
}

export interface ExecutionAdapterHealthProbeCredentials {
  apiKeyConfigured: boolean;
  apiKeySource: string | null;
  secretConfigured: boolean;
  secretSource: string | null;
  passwordConfigured: boolean;
  passwordSource: string | null;
}

export interface ExecutionAdapterHealthProbeRouteReview {
  productionRouteReviewId: string;
  status: "route_review_recorded";
  adapterId: string;
  market: string;
  route: "live";
  maintenanceWindowId: string;
  requiredEnvVars: string[];
  liveTradingAllowed: false;
  paperOnly: true;
}

export interface ExecutionAdapterHealthProbeResult {
  schemaVersion: 1;
  probeId: string;
  adapterId: string;
  provider: "ccxt";
  exchangeId: string;
  mode: "sandbox";
  status: ExecutionAdapterHealthProbeStatus;
  generatedAt: string;
  checks: ExecutionAdapterHealthProbeCheck[];
  capabilities: Record<string, boolean>;
  credentials: ExecutionAdapterHealthProbeCredentials;
  marketCount: number;
  exchangeStatus: string | null;
  serverTimeMs: number | null;
  accountSyncState: string;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  productionRouteReviewId?: string;
  productionRouteReviewStatus?: "route_review_recorded";
  routeReview?: ExecutionAdapterHealthProbeRouteReview;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  orderRoutingEnabled: boolean;
}

export interface ExecutionAdapterHealthProbeLoadResult {
  adapterHealthProbe?: ExecutionAdapterHealthProbeResult;
  source: WorkspaceSource;
  error?: string;
}

export function buildExecutionAdapterSandboxProbeExecutionUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-probe-executions");
}

export function buildExecutionAdapterSandboxProbeReviewUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-probe-reviews");
}

export function buildExecutionAdapterProductionRouteReviewUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-production-route-reviews");
}

export function buildExecutionAdapterHealthProbeUrl(
  baseUrl: string,
  params: { adapterId?: string; exchange?: string; productionRouteReviewId?: string } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-health/ccxt-sandbox", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.exchange?.trim()) {
      url.searchParams.set("exchange", params.exchange.trim());
    }
    if (params.productionRouteReviewId?.trim()) {
      url.searchParams.set("productionRouteReviewId", params.productionRouteReviewId.trim());
    }
  });
}

export function buildExecutionAdapterSandboxProbeExecutionHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-probe-executions", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterSandboxProbeReviewHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-probe-reviews", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterProductionRouteReviewHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-production-route-reviews", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export async function recordExecutionAdapterSandboxProbeExecution(
  baseUrl: string,
  request: ExecutionAdapterSandboxProbeExecutionRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSandboxProbeExecutionRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxProbeExecutionUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        sandboxProbePlanId: request.sandboxProbePlanId,
        exchangeId: request.exchangeId,
        operator: request.operator ?? "local-operator",
        probeExecutionMode: request.probeExecutionMode ?? "manual_readonly_sandbox_probe",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSandboxProbeExecutionRecordPayload(payload)) {
      return {
        adapterSandboxProbeExecution: payload.adapterSandboxProbeExecution,
        adapterHealthProbe: payload.adapterHealthProbe,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter sandbox probe execution contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox probe execution error"
    };
  }
}

export async function recordExecutionAdapterSandboxProbeReview(
  baseUrl: string,
  request: ExecutionAdapterSandboxProbeReviewRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSandboxProbeReviewRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxProbeReviewUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        sandboxProbeExecutionId: request.sandboxProbeExecutionId,
        operator: request.operator ?? "local-operator",
        reviewMode: request.reviewMode ?? "manual_sandbox_probe_review",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSandboxProbeReviewRecordPayload(payload)) {
      return {
        adapterSandboxProbeReview: payload.adapterSandboxProbeReview,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter sandbox probe review contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox probe review error"
    };
  }
}

export async function recordExecutionAdapterProductionRouteReview(
  baseUrl: string,
  request: ExecutionAdapterProductionRouteReviewRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterProductionRouteReviewRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterProductionRouteReviewUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        sandboxProbeReviewId: request.sandboxProbeReviewId,
        operator: request.operator ?? "local-operator",
        reviewMode: request.reviewMode ?? "manual_production_route_review",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterProductionRouteReviewRecordPayload(payload)) {
      return {
        adapterProductionRouteReview: payload.adapterProductionRouteReview,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter production route review contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter production route review error"
    };
  }
}

export async function loadExecutionAdapterHealthProbe(
  baseUrl: string,
  params: { adapterId?: string; exchange?: string; productionRouteReviewId?: string } = {},
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterHealthProbeLoadResult> {
  try {
    const response = await fetcher(buildExecutionAdapterHealthProbeUrl(baseUrl, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterHealthProbePayload(payload)) {
      throw new Error("Invalid execution adapter health probe contract");
    }
    return {
      adapterHealthProbe: payload.adapterHealthProbe,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter health probe error"
    };
  }
}

export async function loadExecutionAdapterSandboxProbeExecutions(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSandboxProbeExecutionHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxProbeExecutionHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSandboxProbeExecutionHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter sandbox probe execution history contract");
    }
    return {
      adapterSandboxProbeExecutions: payload.adapterSandboxProbeExecutions,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSandboxProbeExecutions: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox probe execution history error"
    };
  }
}

export async function loadExecutionAdapterSandboxProbeReviews(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSandboxProbeReviewHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxProbeReviewHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSandboxProbeReviewHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter sandbox probe review history contract");
    }
    return {
      adapterSandboxProbeReviews: payload.adapterSandboxProbeReviews,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSandboxProbeReviews: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox probe review history error"
    };
  }
}

export async function loadExecutionAdapterProductionRouteReviews(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterProductionRouteReviewHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterProductionRouteReviewHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterProductionRouteReviewHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter production route review history contract");
    }
    return {
      adapterProductionRouteReviews: payload.adapterProductionRouteReviews,
      source: "core"
    };
  } catch (error) {
    return {
      adapterProductionRouteReviews: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter production route review history error"
    };
  }
}

function isExecutionAdapterHealthProbePayload(
  value: unknown
): value is { adapterHealthProbe: ExecutionAdapterHealthProbeResult } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterHealthProbe?: unknown };
  return isExecutionAdapterHealthProbeResult(payload.adapterHealthProbe);
}

function isExecutionAdapterHealthProbeResult(value: unknown): value is ExecutionAdapterHealthProbeResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const probe = value as Partial<ExecutionAdapterHealthProbeResult>;
  return (
    probe.schemaVersion === 1 &&
    typeof probe.probeId === "string" &&
    typeof probe.adapterId === "string" &&
    probe.provider === "ccxt" &&
    typeof probe.exchangeId === "string" &&
    probe.mode === "sandbox" &&
    isExecutionAdapterHealthProbeStatus(probe.status) &&
    typeof probe.generatedAt === "string" &&
    Array.isArray(probe.checks) &&
    probe.checks.every(isExecutionAdapterHealthProbeCheck) &&
    isBooleanRecord(probe.capabilities) &&
    isExecutionAdapterHealthProbeCredentials(probe.credentials) &&
    typeof probe.marketCount === "number" &&
    (probe.exchangeStatus === null || typeof probe.exchangeStatus === "string") &&
    (probe.serverTimeMs === null || typeof probe.serverTimeMs === "number") &&
    typeof probe.accountSyncState === "string" &&
    Array.isArray(probe.blockedReasons) &&
    probe.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(probe.metadata) &&
    (probe.productionRouteReviewId === undefined || typeof probe.productionRouteReviewId === "string") &&
    (probe.productionRouteReviewStatus === undefined || probe.productionRouteReviewStatus === "route_review_recorded") &&
    (probe.routeReview === undefined || isExecutionAdapterHealthProbeRouteReview(probe.routeReview)) &&
    probe.paperOnly === true &&
    probe.liveTradingAllowed === false &&
    probe.orderRoutingEnabled === false
  );
}

function isExecutionAdapterHealthProbeRouteReview(value: unknown): value is ExecutionAdapterHealthProbeRouteReview {
  if (!value || typeof value !== "object") {
    return false;
  }
  const routeReview = value as Partial<ExecutionAdapterHealthProbeRouteReview>;
  return (
    typeof routeReview.productionRouteReviewId === "string" &&
    routeReview.status === "route_review_recorded" &&
    typeof routeReview.adapterId === "string" &&
    typeof routeReview.market === "string" &&
    routeReview.route === "live" &&
    typeof routeReview.maintenanceWindowId === "string" &&
    Array.isArray(routeReview.requiredEnvVars) &&
    routeReview.requiredEnvVars.every((name) => typeof name === "string") &&
    routeReview.liveTradingAllowed === false &&
    routeReview.paperOnly === true
  );
}

function isExecutionAdapterHealthProbeCheck(value: unknown): value is ExecutionAdapterHealthProbeCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<ExecutionAdapterHealthProbeCheck>;
  return (
    typeof check.id === "string" &&
    typeof check.label === "string" &&
    isExecutionAdapterHealthProbeCheckStatus(check.status) &&
    typeof check.detail === "string" &&
    (check.latencyMs === null || typeof check.latencyMs === "number")
  );
}

function isExecutionAdapterHealthProbeCredentials(
  value: unknown
): value is ExecutionAdapterHealthProbeCredentials {
  if (!value || typeof value !== "object") {
    return false;
  }
  const credentials = value as Partial<ExecutionAdapterHealthProbeCredentials>;
  return (
    typeof credentials.apiKeyConfigured === "boolean" &&
    (credentials.apiKeySource === null || typeof credentials.apiKeySource === "string") &&
    typeof credentials.secretConfigured === "boolean" &&
    (credentials.secretSource === null || typeof credentials.secretSource === "string") &&
    typeof credentials.passwordConfigured === "boolean" &&
    (credentials.passwordSource === null || typeof credentials.passwordSource === "string")
  );
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  return isPlainRecord(value) && Object.values(value).every((item) => typeof item === "boolean");
}


function isExecutionAdapterSandboxProbeExecutionRecordPayload(
  value: unknown
): value is {
  adapterSandboxProbeExecution: ExecutionAdapterSandboxProbeExecutionResult;
  adapterHealthProbe?: ExecutionAdapterHealthProbeResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    adapterSandboxProbeExecution?: unknown;
    adapterHealthProbe?: unknown;
    auditEvent?: unknown;
  };
  return (
    isExecutionAdapterSandboxProbeExecutionResult(payload.adapterSandboxProbeExecution) &&
    (payload.adapterHealthProbe === undefined || isExecutionAdapterHealthProbeResult(payload.adapterHealthProbe)) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterSandboxProbeReviewRecordPayload(
  value: unknown
): value is {
  adapterSandboxProbeReview: ExecutionAdapterSandboxProbeReviewResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxProbeReview?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterSandboxProbeReviewResult(payload.adapterSandboxProbeReview) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterProductionRouteReviewRecordPayload(
  value: unknown
): value is {
  adapterProductionRouteReview: ExecutionAdapterProductionRouteReviewResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterProductionRouteReview?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterProductionRouteReviewResult(payload.adapterProductionRouteReview) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterSandboxProbeExecutionHistoryPayload(
  value: unknown
): value is { adapterSandboxProbeExecutions: ExecutionAdapterSandboxProbeExecutionResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxProbeExecutions?: unknown };
  return (
    Array.isArray(payload.adapterSandboxProbeExecutions) &&
    payload.adapterSandboxProbeExecutions.every(isExecutionAdapterSandboxProbeExecutionResult)
  );
}

function isExecutionAdapterSandboxProbeReviewHistoryPayload(
  value: unknown
): value is { adapterSandboxProbeReviews: ExecutionAdapterSandboxProbeReviewResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxProbeReviews?: unknown };
  return (
    Array.isArray(payload.adapterSandboxProbeReviews) &&
    payload.adapterSandboxProbeReviews.every(isExecutionAdapterSandboxProbeReviewResult)
  );
}

function isExecutionAdapterProductionRouteReviewHistoryPayload(
  value: unknown
): value is { adapterProductionRouteReviews: ExecutionAdapterProductionRouteReviewResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterProductionRouteReviews?: unknown };
  return (
    Array.isArray(payload.adapterProductionRouteReviews) &&
    payload.adapterProductionRouteReviews.every(isExecutionAdapterProductionRouteReviewResult)
  );
}

function isExecutionAdapterSandboxProbeExecutionResult(
  value: unknown
): value is ExecutionAdapterSandboxProbeExecutionResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSandboxProbeExecutionResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.sandboxProbeExecutionId === "string" &&
    typeof result.sandboxProbePlanId === "string" &&
    typeof result.humanConfirmationId === "string" &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterSandboxProbeExecutionStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.probeExecutionMode === "string" &&
    typeof result.probeMode === "string" &&
    typeof result.confirmationMode === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterSandboxProbeExecutionConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSandboxProbeReviewResult(
  value: unknown
): value is ExecutionAdapterSandboxProbeReviewResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSandboxProbeReviewResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.sandboxProbeReviewId === "string" &&
    typeof result.sandboxProbeExecutionId === "string" &&
    typeof result.sandboxProbePlanId === "string" &&
    typeof result.humanConfirmationId === "string" &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterSandboxProbeReviewStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.reviewMode === "string" &&
    typeof result.probeExecutionMode === "string" &&
    typeof result.probeMode === "string" &&
    typeof result.confirmationMode === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterSandboxProbeReviewConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterProductionRouteReviewResult(
  value: unknown
): value is ExecutionAdapterProductionRouteReviewResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterProductionRouteReviewResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.productionRouteReviewId === "string" &&
    typeof result.sandboxProbeReviewId === "string" &&
    typeof result.sandboxProbeExecutionId === "string" &&
    typeof result.sandboxProbePlanId === "string" &&
    typeof result.humanConfirmationId === "string" &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterProductionRouteReviewStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.reviewMode === "string" &&
    typeof result.sandboxReviewMode === "string" &&
    typeof result.probeExecutionMode === "string" &&
    typeof result.probeMode === "string" &&
    typeof result.confirmationMode === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterProductionRouteReviewConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSandboxProbeExecutionConfirmation(
  value: unknown
): value is ExecutionAdapterSandboxProbeExecutionConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterSandboxProbeExecutionConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterSandboxProbeReviewConfirmation(
  value: unknown
): value is ExecutionAdapterSandboxProbeReviewConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterSandboxProbeReviewConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterProductionRouteReviewConfirmation(
  value: unknown
): value is ExecutionAdapterProductionRouteReviewConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterProductionRouteReviewConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterSandboxProbeExecutionStatus(
  value: unknown
): value is ExecutionAdapterSandboxProbeExecutionStatus {
  return value === "blocked" || value === "probe_execution_recorded";
}

function isExecutionAdapterSandboxProbeReviewStatus(
  value: unknown
): value is ExecutionAdapterSandboxProbeReviewStatus {
  return value === "blocked" || value === "probe_review_recorded";
}

function isExecutionAdapterProductionRouteReviewStatus(
  value: unknown
): value is ExecutionAdapterProductionRouteReviewStatus {
  return value === "blocked" || value === "route_review_recorded";
}

function isExecutionAdapterHealthProbeStatus(value: unknown): value is ExecutionAdapterHealthProbeStatus {
  return value === "ready" || value === "review" || value === "blocked";
}

function isExecutionAdapterHealthProbeCheckStatus(
  value: unknown
): value is ExecutionAdapterHealthProbeCheckStatus {
  return value === "passed" || value === "review" || value === "blocked" || value === "skipped";
}
