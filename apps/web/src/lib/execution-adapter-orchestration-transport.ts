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
  isSecretFreeRecord,
  type AuditEventRecord
} from "./terminal-api-contract";

type WorkspaceSource = "core" | "fallback";

export type ExecutionAdapterOrchestrationDryRunStatus = "blocked" | "dry_run_recorded";
export type ExecutionAdapterOrchestrationDryRunConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterOrchestrationDryRunConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterOrchestrationDryRunConfirmationStatus;
}

export interface ExecutionAdapterOrchestrationDryRunResult {
  schemaVersion: 1;
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
  status: ExecutionAdapterOrchestrationDryRunStatus;
  operator: string;
  recordedAt: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterOrchestrationDryRunConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterOrchestrationDryRunRequest {
  adapterId: string;
  acceptanceId: string;
  operator?: string;
  orchestrationMode?: string;
  confirmations?: {
    acceptedChainReviewed?: boolean;
    sandboxHandshakeDryRunPassed?: boolean;
    orderSchemaDryRunPassed?: boolean;
    accountSyncDryRunPassed?: boolean;
    operatorConfirmedNoLiveOrders?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterOrchestrationDryRunRecordResult {
  adapterOrchestrationDryRun?: ExecutionAdapterOrchestrationDryRunResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterOrchestrationDryRunHistoryResult {
  adapterOrchestrationDryRuns: ExecutionAdapterOrchestrationDryRunResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterOrchestrationExecutionStatus = "blocked" | "execution_recorded";
export type ExecutionAdapterOrchestrationExecutionConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterOrchestrationExecutionConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterOrchestrationExecutionConfirmationStatus;
}

export interface ExecutionAdapterOrchestrationExecutionResult {
  schemaVersion: 1;
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
  status: ExecutionAdapterOrchestrationExecutionStatus;
  operator: string;
  recordedAt: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterOrchestrationExecutionConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterOrchestrationExecutionRequest {
  adapterId: string;
  dryRunId: string;
  operator?: string;
  orchestrationExecutionMode?: string;
  confirmations?: {
    dryRunEvidenceReviewed?: boolean;
    sandboxRouteLocked?: boolean;
    killSwitchArmed?: boolean;
    idempotencyKeyRecorded?: boolean;
    operatorConfirmedNoCapital?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterOrchestrationExecutionRecordResult {
  adapterOrchestrationExecution?: ExecutionAdapterOrchestrationExecutionResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterOrchestrationExecutionHistoryResult {
  adapterOrchestrationExecutions: ExecutionAdapterOrchestrationExecutionResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterHumanConfirmationStatus = "blocked" | "confirmation_recorded";
export type ExecutionAdapterHumanConfirmationConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterHumanConfirmationConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterHumanConfirmationConfirmationStatus;
}

export interface ExecutionAdapterHumanConfirmationResult {
  schemaVersion: 1;
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
  status: ExecutionAdapterHumanConfirmationStatus;
  operator: string;
  recordedAt: string;
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
  requiredConfirmations: ExecutionAdapterHumanConfirmationConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterHumanConfirmationRequest {
  adapterId: string;
  orchestrationExecutionId: string;
  operator?: string;
  confirmationMode?: string;
  confirmations?: {
    orchestrationExecutionReviewed?: boolean;
    riskApprovalStillValid?: boolean;
    paperExecutionReviewed?: boolean;
    killSwitchReady?: boolean;
    operatorConfirmedFinalBoundary?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterHumanConfirmationRecordResult {
  adapterHumanConfirmation?: ExecutionAdapterHumanConfirmationResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterHumanConfirmationHistoryResult {
  adapterHumanConfirmations: ExecutionAdapterHumanConfirmationResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterSandboxProbePlanStatus = "blocked" | "probe_plan_recorded";
export type ExecutionAdapterSandboxProbePlanConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSandboxProbePlanConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterSandboxProbePlanConfirmationStatus;
}

export interface ExecutionAdapterSandboxProbePlanResult {
  schemaVersion: 1;
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
  status: ExecutionAdapterSandboxProbePlanStatus;
  operator: string;
  recordedAt: string;
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
  requiredConfirmations: ExecutionAdapterSandboxProbePlanConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSandboxProbePlanRequest {
  adapterId: string;
  humanConfirmationId: string;
  operator?: string;
  probeMode?: string;
  confirmations?: {
    humanConfirmationReviewed?: boolean;
    testnetEndpointLocked?: boolean;
    credentialsAreSandboxOnly?: boolean;
    orderRoutingDisabled?: boolean;
    probeLimitsDocumented?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSandboxProbePlanRecordResult {
  adapterSandboxProbePlan?: ExecutionAdapterSandboxProbePlanResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSandboxProbePlanHistoryResult {
  adapterSandboxProbePlans: ExecutionAdapterSandboxProbePlanResult[];
  source: WorkspaceSource;
  error?: string;
}


export function buildExecutionAdapterOrchestrationDryRunUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-orchestration-dry-runs");
}

export function buildExecutionAdapterOrchestrationExecutionUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-orchestration-executions");
}

export function buildExecutionAdapterHumanConfirmationUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-human-confirmations");
}

export function buildExecutionAdapterSandboxProbePlanUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-probe-plans");
}


export function buildExecutionAdapterOrchestrationDryRunHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-orchestration-dry-runs", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterOrchestrationExecutionHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-orchestration-executions", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterHumanConfirmationHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-human-confirmations", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterSandboxProbePlanHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-probe-plans", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}


export async function recordExecutionAdapterOrchestrationDryRun(
  baseUrl: string,
  request: ExecutionAdapterOrchestrationDryRunRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterOrchestrationDryRunRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterOrchestrationDryRunUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        acceptanceId: request.acceptanceId,
        operator: request.operator ?? "local-operator",
        orchestrationMode: request.orchestrationMode ?? "manual_adapter_orchestration_dry_run",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterOrchestrationDryRunRecordPayload(payload)) {
      return {
        adapterOrchestrationDryRun: payload.adapterOrchestrationDryRun,
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
    throw new Error("Invalid execution adapter orchestration dry run contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter orchestration dry run error"
    };
  }
}

export async function recordExecutionAdapterOrchestrationExecution(
  baseUrl: string,
  request: ExecutionAdapterOrchestrationExecutionRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterOrchestrationExecutionRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterOrchestrationExecutionUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        dryRunId: request.dryRunId,
        operator: request.operator ?? "local-operator",
        orchestrationExecutionMode:
          request.orchestrationExecutionMode ?? "manual_adapter_orchestration_execution",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterOrchestrationExecutionRecordPayload(payload)) {
      return {
        adapterOrchestrationExecution: payload.adapterOrchestrationExecution,
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
    throw new Error("Invalid execution adapter orchestration execution contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter orchestration execution error"
    };
  }
}

export async function recordExecutionAdapterHumanConfirmation(
  baseUrl: string,
  request: ExecutionAdapterHumanConfirmationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterHumanConfirmationRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterHumanConfirmationUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        orchestrationExecutionId: request.orchestrationExecutionId,
        operator: request.operator ?? "local-operator",
        confirmationMode: request.confirmationMode ?? "manual_final_human_confirmation",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterHumanConfirmationRecordPayload(payload)) {
      return {
        adapterHumanConfirmation: payload.adapterHumanConfirmation,
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
    throw new Error("Invalid execution adapter human confirmation contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter human confirmation error"
    };
  }
}

export async function recordExecutionAdapterSandboxProbePlan(
  baseUrl: string,
  request: ExecutionAdapterSandboxProbePlanRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSandboxProbePlanRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxProbePlanUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        humanConfirmationId: request.humanConfirmationId,
        operator: request.operator ?? "local-operator",
        probeMode: request.probeMode ?? "manual_sandbox_probe_plan",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSandboxProbePlanRecordPayload(payload)) {
      return {
        adapterSandboxProbePlan: payload.adapterSandboxProbePlan,
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
    throw new Error("Invalid execution adapter sandbox probe plan contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox probe plan error"
    };
  }
}


export async function loadExecutionAdapterOrchestrationDryRuns(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterOrchestrationDryRunHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterOrchestrationDryRunHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterOrchestrationDryRunHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter orchestration dry run history contract");
    }
    return {
      adapterOrchestrationDryRuns: payload.adapterOrchestrationDryRuns,
      source: "core"
    };
  } catch (error) {
    return {
      adapterOrchestrationDryRuns: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter orchestration dry run history error"
    };
  }
}

export async function loadExecutionAdapterOrchestrationExecutions(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterOrchestrationExecutionHistoryResult> {
  try {
    const response = await fetcher(
      buildExecutionAdapterOrchestrationExecutionHistoryUrl(baseUrl, { adapterId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterOrchestrationExecutionHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter orchestration execution history contract");
    }
    return {
      adapterOrchestrationExecutions: payload.adapterOrchestrationExecutions,
      source: "core"
    };
  } catch (error) {
    return {
      adapterOrchestrationExecutions: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter orchestration execution history error"
    };
  }
}

export async function loadExecutionAdapterHumanConfirmations(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterHumanConfirmationHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterHumanConfirmationHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterHumanConfirmationHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter human confirmation history contract");
    }
    return {
      adapterHumanConfirmations: payload.adapterHumanConfirmations,
      source: "core"
    };
  } catch (error) {
    return {
      adapterHumanConfirmations: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter human confirmation history error"
    };
  }
}

export async function loadExecutionAdapterSandboxProbePlans(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSandboxProbePlanHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxProbePlanHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSandboxProbePlanHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter sandbox probe plan history contract");
    }
    return {
      adapterSandboxProbePlans: payload.adapterSandboxProbePlans,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSandboxProbePlans: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox probe plan history error"
    };
  }
}


function isExecutionAdapterOrchestrationDryRunRecordPayload(
  value: unknown
): value is {
  adapterOrchestrationDryRun: ExecutionAdapterOrchestrationDryRunResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterOrchestrationDryRun?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterOrchestrationDryRunResult(payload.adapterOrchestrationDryRun) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterOrchestrationExecutionRecordPayload(
  value: unknown
): value is {
  adapterOrchestrationExecution: ExecutionAdapterOrchestrationExecutionResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterOrchestrationExecution?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterOrchestrationExecutionResult(payload.adapterOrchestrationExecution) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterHumanConfirmationRecordPayload(
  value: unknown
): value is {
  adapterHumanConfirmation: ExecutionAdapterHumanConfirmationResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterHumanConfirmation?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterHumanConfirmationResult(payload.adapterHumanConfirmation) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterSandboxProbePlanRecordPayload(
  value: unknown
): value is {
  adapterSandboxProbePlan: ExecutionAdapterSandboxProbePlanResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxProbePlan?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterSandboxProbePlanResult(payload.adapterSandboxProbePlan) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}


function isExecutionAdapterOrchestrationDryRunHistoryPayload(
  value: unknown
): value is { adapterOrchestrationDryRuns: ExecutionAdapterOrchestrationDryRunResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterOrchestrationDryRuns?: unknown };
  return (
    Array.isArray(payload.adapterOrchestrationDryRuns) &&
    payload.adapterOrchestrationDryRuns.every(isExecutionAdapterOrchestrationDryRunResult)
  );
}

function isExecutionAdapterOrchestrationExecutionHistoryPayload(
  value: unknown
): value is { adapterOrchestrationExecutions: ExecutionAdapterOrchestrationExecutionResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterOrchestrationExecutions?: unknown };
  return (
    Array.isArray(payload.adapterOrchestrationExecutions) &&
    payload.adapterOrchestrationExecutions.every(isExecutionAdapterOrchestrationExecutionResult)
  );
}

function isExecutionAdapterHumanConfirmationHistoryPayload(
  value: unknown
): value is { adapterHumanConfirmations: ExecutionAdapterHumanConfirmationResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterHumanConfirmations?: unknown };
  return (
    Array.isArray(payload.adapterHumanConfirmations) &&
    payload.adapterHumanConfirmations.every(isExecutionAdapterHumanConfirmationResult)
  );
}

function isExecutionAdapterSandboxProbePlanHistoryPayload(
  value: unknown
): value is { adapterSandboxProbePlans: ExecutionAdapterSandboxProbePlanResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxProbePlans?: unknown };
  return (
    Array.isArray(payload.adapterSandboxProbePlans) &&
    payload.adapterSandboxProbePlans.every(isExecutionAdapterSandboxProbePlanResult)
  );
}


function isExecutionAdapterOrchestrationDryRunResult(
  value: unknown
): value is ExecutionAdapterOrchestrationDryRunResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterOrchestrationDryRunResult>;
  return (
    result.schemaVersion === 1 &&
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
    isExecutionAdapterOrchestrationDryRunStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
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
    result.requiredConfirmations.every(isExecutionAdapterOrchestrationDryRunConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterOrchestrationExecutionResult(
  value: unknown
): value is ExecutionAdapterOrchestrationExecutionResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterOrchestrationExecutionResult>;
  return (
    result.schemaVersion === 1 &&
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
    isExecutionAdapterOrchestrationExecutionStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
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
    result.requiredConfirmations.every(isExecutionAdapterOrchestrationExecutionConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterHumanConfirmationResult(
  value: unknown
): value is ExecutionAdapterHumanConfirmationResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterHumanConfirmationResult>;
  return (
    result.schemaVersion === 1 &&
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
    isExecutionAdapterHumanConfirmationStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
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
    result.requiredConfirmations.every(isExecutionAdapterHumanConfirmationConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSandboxProbePlanResult(
  value: unknown
): value is ExecutionAdapterSandboxProbePlanResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSandboxProbePlanResult>;
  return (
    result.schemaVersion === 1 &&
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
    isExecutionAdapterSandboxProbePlanStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
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
    result.requiredConfirmations.every(isExecutionAdapterSandboxProbePlanConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterOrchestrationDryRunConfirmation(
  value: unknown
): value is ExecutionAdapterOrchestrationDryRunConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterOrchestrationDryRunConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterOrchestrationExecutionConfirmation(
  value: unknown
): value is ExecutionAdapterOrchestrationExecutionConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterOrchestrationExecutionConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterHumanConfirmationConfirmation(
  value: unknown
): value is ExecutionAdapterHumanConfirmationConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterHumanConfirmationConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterSandboxProbePlanConfirmation(
  value: unknown
): value is ExecutionAdapterSandboxProbePlanConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterSandboxProbePlanConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterOrchestrationDryRunStatus(
  value: unknown
): value is ExecutionAdapterOrchestrationDryRunStatus {
  return value === "blocked" || value === "dry_run_recorded";
}

function isExecutionAdapterOrchestrationExecutionStatus(
  value: unknown
): value is ExecutionAdapterOrchestrationExecutionStatus {
  return value === "blocked" || value === "execution_recorded";
}

function isExecutionAdapterHumanConfirmationStatus(
  value: unknown
): value is ExecutionAdapterHumanConfirmationStatus {
  return value === "blocked" || value === "confirmation_recorded";
}

function isExecutionAdapterSandboxProbePlanStatus(
  value: unknown
): value is ExecutionAdapterSandboxProbePlanStatus {
  return value === "blocked" || value === "probe_plan_recorded";
}
