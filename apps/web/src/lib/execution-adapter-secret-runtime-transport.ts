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

export type ExecutionAdapterSecretReferenceStatus = "blocked" | "reference_recorded";
export type ExecutionAdapterSecretReferenceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSecretReferenceConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterSecretReferenceConfirmationStatus;
}

export interface ExecutionAdapterSecretReferenceResult {
  schemaVersion: 1;
  referenceId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterSecretReferenceStatus;
  operator: string;
  recordedAt: string;
  referenceName: string;
  backend: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterSecretReferenceConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSecretReferenceRequest {
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  operator?: string;
  referenceName: string;
  backend: string;
  requiredEnvVars: string[];
  confirmations?: {
    referenceCreatedOutsideUi?: boolean;
    operatorVerifiedFingerprint?: boolean;
    rotationPlanDocumented?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSecretReferenceRecordResult {
  adapterSecretReference?: ExecutionAdapterSecretReferenceResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSecretReferenceHistoryResult {
  adapterSecretReferences: ExecutionAdapterSecretReferenceResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterSecretMaterializationStatus = "blocked" | "manifest_recorded";
export type ExecutionAdapterSecretMaterializationConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSecretMaterializationConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterSecretMaterializationConfirmationStatus;
}

export interface ExecutionAdapterSecretMaterializationResult {
  schemaVersion: 1;
  materializationId: string;
  referenceId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterSecretMaterializationStatus;
  operator: string;
  recordedAt: string;
  materializationMode: string;
  referenceName: string;
  backend: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterSecretMaterializationConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSecretMaterializationRequest {
  adapterId: string;
  referenceId: string;
  operator?: string;
  manifestPath: string;
  confirmations?: {
    localSecretStoreWriteVerified?: boolean;
    noRawSecretInPayload?: boolean;
    envBindingPlanDocumented?: boolean;
    rollbackPlanDocumented?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSecretMaterializationRecordResult {
  adapterSecretMaterialization?: ExecutionAdapterSecretMaterializationResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSecretMaterializationHistoryResult {
  adapterSecretMaterializations: ExecutionAdapterSecretMaterializationResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterSecretManifestValidationStatus = "blocked" | "validated";

export interface ExecutionAdapterSecretManifestValidationResult {
  schemaVersion: 1;
  validationId: string;
  materializationId: string;
  referenceId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterSecretManifestValidationStatus;
  operator: string;
  recordedAt: string;
  validationMode: string;
  referenceName: string;
  backend: string;
  manifestPath: string;
  fingerprint: string;
  requiredEnvVars: string[];
  coveredEnvVars: string[];
  blockedReasons: string[];
  manifestSummary: Record<string, unknown>;
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSecretManifestValidationRequest {
  adapterId: string;
  materializationId: string;
  operator?: string;
  manifestPath?: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSecretManifestValidationRecordResult {
  adapterSecretManifestValidation?: ExecutionAdapterSecretManifestValidationResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSecretManifestValidationHistoryResult {
  adapterSecretManifestValidations: ExecutionAdapterSecretManifestValidationResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterEnvironmentBindingStatus = "blocked" | "binding_recorded";
export type ExecutionAdapterEnvironmentBindingConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterEnvironmentBindingConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterEnvironmentBindingConfirmationStatus;
}

export interface ExecutionAdapterEnvironmentBindingResult {
  schemaVersion: 1;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterEnvironmentBindingStatus;
  operator: string;
  recordedAt: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterEnvironmentBindingConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterEnvironmentBindingRequest {
  adapterId: string;
  materializationId?: string;
  manifestValidationId?: string;
  operator?: string;
  bindingMode?: string;
  confirmations?: {
    runtimeEnvMappingVerified?: boolean;
    configReloadPlanDocumented?: boolean;
    noRawSecretInPayload?: boolean;
    rollbackSnapshotRecorded?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterEnvironmentBindingRecordResult {
  adapterEnvironmentBinding?: ExecutionAdapterEnvironmentBindingResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterEnvironmentBindingHistoryResult {
  adapterEnvironmentBindings: ExecutionAdapterEnvironmentBindingResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterRuntimeReloadPlanStatus = "blocked" | "plan_recorded";
export type ExecutionAdapterRuntimeReloadPlanConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterRuntimeReloadPlanConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterRuntimeReloadPlanConfirmationStatus;
}

export interface ExecutionAdapterRuntimeReloadPlanResult {
  schemaVersion: 1;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterRuntimeReloadPlanStatus;
  operator: string;
  recordedAt: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterRuntimeReloadPlanConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterRuntimeReloadPlanRequest {
  adapterId: string;
  bindingId: string;
  operator?: string;
  reloadMode?: string;
  maintenanceWindowId: string;
  confirmations?: {
    maintenanceWindowApproved?: boolean;
    healthBaselineCaptured?: boolean;
    configDiffReviewed?: boolean;
    postReloadSmokePlanDocumented?: boolean;
    rollbackOwnerAssigned?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterRuntimeReloadPlanRecordResult {
  adapterRuntimeReloadPlan?: ExecutionAdapterRuntimeReloadPlanResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterRuntimeReloadPlanHistoryResult {
  adapterRuntimeReloadPlans: ExecutionAdapterRuntimeReloadPlanResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterRuntimeReloadExecutionStatus = "blocked" | "execution_recorded";
export type ExecutionAdapterRuntimeReloadExecutionConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterRuntimeReloadExecutionConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterRuntimeReloadExecutionConfirmationStatus;
}

export interface ExecutionAdapterRuntimeReloadExecutionResult {
  schemaVersion: 1;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterRuntimeReloadExecutionStatus;
  operator: string;
  recordedAt: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterRuntimeReloadExecutionConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterRuntimeReloadExecutionRequest {
  adapterId: string;
  planId: string;
  operator?: string;
  executionMode?: string;
  confirmations?: {
    preReloadHealthVerified?: boolean;
    reloadActionRecorded?: boolean;
    postReloadSmokePassed?: boolean;
    rollbackReadinessConfirmed?: boolean;
    operatorConfirmedLiveBlocked?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterRuntimeReloadExecutionRecordResult {
  adapterRuntimeReloadExecution?: ExecutionAdapterRuntimeReloadExecutionResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterRuntimeReloadExecutionHistoryResult {
  adapterRuntimeReloadExecutions: ExecutionAdapterRuntimeReloadExecutionResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterRuntimeReloadAcceptanceStatus = "blocked" | "acceptance_recorded";
export type ExecutionAdapterRuntimeReloadAcceptanceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterRuntimeReloadAcceptanceConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterRuntimeReloadAcceptanceConfirmationStatus;
}

export interface ExecutionAdapterRuntimeReloadAcceptanceResult {
  schemaVersion: 1;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterRuntimeReloadAcceptanceStatus;
  operator: string;
  recordedAt: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterRuntimeReloadAcceptanceConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterRuntimeReloadAcceptanceRequest {
  adapterId: string;
  executionId: string;
  operator?: string;
  acceptanceMode?: string;
  confirmations?: {
    executionEvidenceReviewed?: boolean;
    postReloadHealthVerified?: boolean;
    adapterHandshakeVerified?: boolean;
    killSwitchStillEnabled?: boolean;
    operatorConfirmedLiveBlocked?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterRuntimeReloadAcceptanceRecordResult {
  adapterRuntimeReloadAcceptance?: ExecutionAdapterRuntimeReloadAcceptanceResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterRuntimeReloadAcceptanceHistoryResult {
  adapterRuntimeReloadAcceptances: ExecutionAdapterRuntimeReloadAcceptanceResult[];
  source: WorkspaceSource;
  error?: string;
}


export function buildExecutionAdapterSecretReferenceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-secret-references");
}

export function buildExecutionAdapterSecretMaterializationUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-secret-materializations");
}

export function buildExecutionAdapterSecretManifestValidationUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-secret-manifest-validations");
}

export function buildExecutionAdapterEnvironmentBindingUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-environment-bindings");
}

export function buildExecutionAdapterRuntimeReloadPlanUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-runtime-reload-plans");
}

export function buildExecutionAdapterRuntimeReloadExecutionUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-runtime-reload-executions");
}

export function buildExecutionAdapterRuntimeReloadAcceptanceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-runtime-reload-acceptances");
}


export function buildExecutionAdapterSecretReferenceHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-secret-references", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterSecretMaterializationHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-secret-materializations", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterSecretManifestValidationHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-secret-manifest-validations", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterEnvironmentBindingHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-environment-bindings", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterRuntimeReloadPlanHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-runtime-reload-plans", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterRuntimeReloadExecutionHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-runtime-reload-executions", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterRuntimeReloadAcceptanceHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-runtime-reload-acceptances", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}


export async function recordExecutionAdapterSecretReference(
  baseUrl: string,
  request: ExecutionAdapterSecretReferenceRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSecretReferenceRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSecretReferenceUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        market: request.market,
        route: request.route,
        operator: request.operator ?? "local-operator",
        referenceName: request.referenceName,
        backend: request.backend,
        requiredEnvVars: request.requiredEnvVars,
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSecretReferenceRecordPayload(payload)) {
      return {
        adapterSecretReference: payload.adapterSecretReference,
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
    throw new Error("Invalid execution adapter secret reference contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter secret reference error"
    };
  }
}

export async function recordExecutionAdapterSecretMaterialization(
  baseUrl: string,
  request: ExecutionAdapterSecretMaterializationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSecretMaterializationRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSecretMaterializationUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        referenceId: request.referenceId,
        operator: request.operator ?? "local-operator",
        manifestPath: request.manifestPath,
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSecretMaterializationRecordPayload(payload)) {
      return {
        adapterSecretMaterialization: payload.adapterSecretMaterialization,
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
    throw new Error("Invalid execution adapter secret materialization contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter secret materialization error"
    };
  }
}

export async function recordExecutionAdapterSecretManifestValidation(
  baseUrl: string,
  request: ExecutionAdapterSecretManifestValidationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSecretManifestValidationRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSecretManifestValidationUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        materializationId: request.materializationId ?? "",
        operator: request.operator ?? "local-operator",
        manifestPath: request.manifestPath ?? "",
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSecretManifestValidationRecordPayload(payload)) {
      return {
        adapterSecretManifestValidation: payload.adapterSecretManifestValidation,
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
    throw new Error("Invalid execution adapter secret manifest validation contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter secret manifest validation error"
    };
  }
}

export async function recordExecutionAdapterEnvironmentBinding(
  baseUrl: string,
  request: ExecutionAdapterEnvironmentBindingRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterEnvironmentBindingRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterEnvironmentBindingUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        materializationId: request.materializationId,
        manifestValidationId: request.manifestValidationId ?? "",
        operator: request.operator ?? "local-operator",
        bindingMode: request.bindingMode ?? "container_env_reference",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterEnvironmentBindingRecordPayload(payload)) {
      return {
        adapterEnvironmentBinding: payload.adapterEnvironmentBinding,
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
    throw new Error("Invalid execution adapter environment binding contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter environment binding error"
    };
  }
}

export async function recordExecutionAdapterRuntimeReloadPlan(
  baseUrl: string,
  request: ExecutionAdapterRuntimeReloadPlanRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterRuntimeReloadPlanRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRuntimeReloadPlanUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        bindingId: request.bindingId,
        operator: request.operator ?? "local-operator",
        reloadMode: request.reloadMode ?? "manual_container_reload_plan",
        maintenanceWindowId: request.maintenanceWindowId,
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterRuntimeReloadPlanRecordPayload(payload)) {
      return {
        adapterRuntimeReloadPlan: payload.adapterRuntimeReloadPlan,
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
    throw new Error("Invalid execution adapter runtime reload plan contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter runtime reload plan error"
    };
  }
}

export async function recordExecutionAdapterRuntimeReloadExecution(
  baseUrl: string,
  request: ExecutionAdapterRuntimeReloadExecutionRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterRuntimeReloadExecutionRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRuntimeReloadExecutionUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        planId: request.planId,
        operator: request.operator ?? "local-operator",
        executionMode: request.executionMode ?? "manual_controlled_reload",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterRuntimeReloadExecutionRecordPayload(payload)) {
      return {
        adapterRuntimeReloadExecution: payload.adapterRuntimeReloadExecution,
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
    throw new Error("Invalid execution adapter runtime reload execution contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter runtime reload execution error"
    };
  }
}

export async function recordExecutionAdapterRuntimeReloadAcceptance(
  baseUrl: string,
  request: ExecutionAdapterRuntimeReloadAcceptanceRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterRuntimeReloadAcceptanceRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRuntimeReloadAcceptanceUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        executionId: request.executionId,
        operator: request.operator ?? "local-operator",
        acceptanceMode: request.acceptanceMode ?? "manual_runtime_reload_acceptance",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterRuntimeReloadAcceptanceRecordPayload(payload)) {
      return {
        adapterRuntimeReloadAcceptance: payload.adapterRuntimeReloadAcceptance,
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
    throw new Error("Invalid execution adapter runtime reload acceptance contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter runtime reload acceptance error"
    };
  }
}


export async function loadExecutionAdapterSecretReferences(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSecretReferenceHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSecretReferenceHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSecretReferenceHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter secret reference history contract");
    }
    return {
      adapterSecretReferences: payload.adapterSecretReferences,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSecretReferences: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter secret reference history error"
    };
  }
}

export async function loadExecutionAdapterSecretMaterializations(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSecretMaterializationHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSecretMaterializationHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSecretMaterializationHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter secret materialization history contract");
    }
    return {
      adapterSecretMaterializations: payload.adapterSecretMaterializations,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSecretMaterializations: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter secret materialization history error"
    };
  }
}

export async function loadExecutionAdapterSecretManifestValidations(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSecretManifestValidationHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSecretManifestValidationHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSecretManifestValidationHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter secret manifest validation history contract");
    }
    return {
      adapterSecretManifestValidations: payload.adapterSecretManifestValidations,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSecretManifestValidations: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter secret manifest validation history error"
    };
  }
}

export async function loadExecutionAdapterEnvironmentBindings(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterEnvironmentBindingHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterEnvironmentBindingHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterEnvironmentBindingHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter environment binding history contract");
    }
    return {
      adapterEnvironmentBindings: payload.adapterEnvironmentBindings,
      source: "core"
    };
  } catch (error) {
    return {
      adapterEnvironmentBindings: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter environment binding history error"
    };
  }
}

export async function loadExecutionAdapterRuntimeReloadPlans(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterRuntimeReloadPlanHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRuntimeReloadPlanHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterRuntimeReloadPlanHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter runtime reload plan history contract");
    }
    return {
      adapterRuntimeReloadPlans: payload.adapterRuntimeReloadPlans,
      source: "core"
    };
  } catch (error) {
    return {
      adapterRuntimeReloadPlans: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter runtime reload plan history error"
    };
  }
}

export async function loadExecutionAdapterRuntimeReloadExecutions(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterRuntimeReloadExecutionHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRuntimeReloadExecutionHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterRuntimeReloadExecutionHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter runtime reload execution history contract");
    }
    return {
      adapterRuntimeReloadExecutions: payload.adapterRuntimeReloadExecutions,
      source: "core"
    };
  } catch (error) {
    return {
      adapterRuntimeReloadExecutions: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter runtime reload execution history error"
    };
  }
}

export async function loadExecutionAdapterRuntimeReloadAcceptances(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterRuntimeReloadAcceptanceHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRuntimeReloadAcceptanceHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterRuntimeReloadAcceptanceHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter runtime reload acceptance history contract");
    }
    return {
      adapterRuntimeReloadAcceptances: payload.adapterRuntimeReloadAcceptances,
      source: "core"
    };
  } catch (error) {
    return {
      adapterRuntimeReloadAcceptances: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter runtime reload acceptance history error"
    };
  }
}


function isExecutionAdapterSecretReferenceRecordPayload(
  value: unknown
): value is { adapterSecretReference: ExecutionAdapterSecretReferenceResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSecretReference?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterSecretReferenceResult(payload.adapterSecretReference) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterSecretMaterializationRecordPayload(
  value: unknown
): value is { adapterSecretMaterialization: ExecutionAdapterSecretMaterializationResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSecretMaterialization?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterSecretMaterializationResult(payload.adapterSecretMaterialization) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterSecretManifestValidationRecordPayload(
  value: unknown
): value is { adapterSecretManifestValidation: ExecutionAdapterSecretManifestValidationResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSecretManifestValidation?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterSecretManifestValidationResult(payload.adapterSecretManifestValidation) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterEnvironmentBindingRecordPayload(
  value: unknown
): value is { adapterEnvironmentBinding: ExecutionAdapterEnvironmentBindingResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterEnvironmentBinding?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterEnvironmentBindingResult(payload.adapterEnvironmentBinding) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterRuntimeReloadPlanRecordPayload(
  value: unknown
): value is { adapterRuntimeReloadPlan: ExecutionAdapterRuntimeReloadPlanResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterRuntimeReloadPlan?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterRuntimeReloadPlanResult(payload.adapterRuntimeReloadPlan) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterRuntimeReloadExecutionRecordPayload(
  value: unknown
): value is { adapterRuntimeReloadExecution: ExecutionAdapterRuntimeReloadExecutionResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterRuntimeReloadExecution?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterRuntimeReloadExecutionResult(payload.adapterRuntimeReloadExecution) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterRuntimeReloadAcceptanceRecordPayload(
  value: unknown
): value is {
  adapterRuntimeReloadAcceptance: ExecutionAdapterRuntimeReloadAcceptanceResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterRuntimeReloadAcceptance?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterRuntimeReloadAcceptanceResult(payload.adapterRuntimeReloadAcceptance) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterSecretReferenceHistoryPayload(
  value: unknown
): value is { adapterSecretReferences: ExecutionAdapterSecretReferenceResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSecretReferences?: unknown };
  return (
    Array.isArray(payload.adapterSecretReferences) &&
    payload.adapterSecretReferences.every(isExecutionAdapterSecretReferenceResult)
  );
}

function isExecutionAdapterSecretMaterializationHistoryPayload(
  value: unknown
): value is { adapterSecretMaterializations: ExecutionAdapterSecretMaterializationResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSecretMaterializations?: unknown };
  return (
    Array.isArray(payload.adapterSecretMaterializations) &&
    payload.adapterSecretMaterializations.every(isExecutionAdapterSecretMaterializationResult)
  );
}

function isExecutionAdapterSecretManifestValidationHistoryPayload(
  value: unknown
): value is { adapterSecretManifestValidations: ExecutionAdapterSecretManifestValidationResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSecretManifestValidations?: unknown };
  return (
    Array.isArray(payload.adapterSecretManifestValidations) &&
    payload.adapterSecretManifestValidations.every(isExecutionAdapterSecretManifestValidationResult)
  );
}

function isExecutionAdapterEnvironmentBindingHistoryPayload(
  value: unknown
): value is { adapterEnvironmentBindings: ExecutionAdapterEnvironmentBindingResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterEnvironmentBindings?: unknown };
  return (
    Array.isArray(payload.adapterEnvironmentBindings) &&
    payload.adapterEnvironmentBindings.every(isExecutionAdapterEnvironmentBindingResult)
  );
}

function isExecutionAdapterRuntimeReloadPlanHistoryPayload(
  value: unknown
): value is { adapterRuntimeReloadPlans: ExecutionAdapterRuntimeReloadPlanResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterRuntimeReloadPlans?: unknown };
  return (
    Array.isArray(payload.adapterRuntimeReloadPlans) &&
    payload.adapterRuntimeReloadPlans.every(isExecutionAdapterRuntimeReloadPlanResult)
  );
}

function isExecutionAdapterRuntimeReloadExecutionHistoryPayload(
  value: unknown
): value is { adapterRuntimeReloadExecutions: ExecutionAdapterRuntimeReloadExecutionResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterRuntimeReloadExecutions?: unknown };
  return (
    Array.isArray(payload.adapterRuntimeReloadExecutions) &&
    payload.adapterRuntimeReloadExecutions.every(isExecutionAdapterRuntimeReloadExecutionResult)
  );
}

function isExecutionAdapterRuntimeReloadAcceptanceHistoryPayload(
  value: unknown
): value is { adapterRuntimeReloadAcceptances: ExecutionAdapterRuntimeReloadAcceptanceResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterRuntimeReloadAcceptances?: unknown };
  return (
    Array.isArray(payload.adapterRuntimeReloadAcceptances) &&
    payload.adapterRuntimeReloadAcceptances.every(isExecutionAdapterRuntimeReloadAcceptanceResult)
  );
}


function isExecutionAdapterSecretReferenceResult(
  value: unknown
): value is ExecutionAdapterSecretReferenceResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSecretReferenceResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.referenceId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterSecretReferenceStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.referenceName === "string" &&
    typeof result.backend === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterSecretReferenceConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSecretMaterializationResult(
  value: unknown
): value is ExecutionAdapterSecretMaterializationResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSecretMaterializationResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.materializationId === "string" &&
    typeof result.referenceId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterSecretMaterializationStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.materializationMode === "string" &&
    typeof result.referenceName === "string" &&
    typeof result.backend === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterSecretMaterializationConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSecretManifestValidationResult(
  value: unknown
): value is ExecutionAdapterSecretManifestValidationResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSecretManifestValidationResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.validationId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.referenceId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterSecretManifestValidationStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.validationMode === "string" &&
    typeof result.referenceName === "string" &&
    typeof result.backend === "string" &&
    typeof result.manifestPath === "string" &&
    typeof result.fingerprint === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.coveredEnvVars) &&
    result.coveredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.manifestSummary) &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterEnvironmentBindingResult(
  value: unknown
): value is ExecutionAdapterEnvironmentBindingResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterEnvironmentBindingResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterEnvironmentBindingStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterEnvironmentBindingConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterRuntimeReloadPlanResult(
  value: unknown
): value is ExecutionAdapterRuntimeReloadPlanResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterRuntimeReloadPlanResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterRuntimeReloadPlanStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterRuntimeReloadPlanConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterRuntimeReloadExecutionResult(
  value: unknown
): value is ExecutionAdapterRuntimeReloadExecutionResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterRuntimeReloadExecutionResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterRuntimeReloadExecutionStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterRuntimeReloadExecutionConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterRuntimeReloadAcceptanceResult(
  value: unknown
): value is ExecutionAdapterRuntimeReloadAcceptanceResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterRuntimeReloadAcceptanceResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterRuntimeReloadAcceptanceStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterRuntimeReloadAcceptanceConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}


function isExecutionAdapterSecretReferenceConfirmation(
  value: unknown
): value is ExecutionAdapterSecretReferenceConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterSecretReferenceConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterSecretMaterializationConfirmation(
  value: unknown
): value is ExecutionAdapterSecretMaterializationConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterSecretMaterializationConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterEnvironmentBindingConfirmation(
  value: unknown
): value is ExecutionAdapterEnvironmentBindingConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterEnvironmentBindingConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterRuntimeReloadPlanConfirmation(
  value: unknown
): value is ExecutionAdapterRuntimeReloadPlanConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterRuntimeReloadPlanConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterRuntimeReloadExecutionConfirmation(
  value: unknown
): value is ExecutionAdapterRuntimeReloadExecutionConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterRuntimeReloadExecutionConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterRuntimeReloadAcceptanceConfirmation(
  value: unknown
): value is ExecutionAdapterRuntimeReloadAcceptanceConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterRuntimeReloadAcceptanceConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}


function isExecutionAdapterSecretReferenceStatus(
  value: unknown
): value is ExecutionAdapterSecretReferenceStatus {
  return value === "blocked" || value === "reference_recorded";
}

function isExecutionAdapterSecretMaterializationStatus(
  value: unknown
): value is ExecutionAdapterSecretMaterializationStatus {
  return value === "blocked" || value === "manifest_recorded";
}

function isExecutionAdapterSecretManifestValidationStatus(
  value: unknown
): value is ExecutionAdapterSecretManifestValidationStatus {
  return value === "blocked" || value === "validated";
}

function isExecutionAdapterEnvironmentBindingStatus(value: unknown): value is ExecutionAdapterEnvironmentBindingStatus {
  return value === "blocked" || value === "binding_recorded";
}

function isExecutionAdapterRuntimeReloadPlanStatus(
  value: unknown
): value is ExecutionAdapterRuntimeReloadPlanStatus {
  return value === "blocked" || value === "plan_recorded";
}

function isExecutionAdapterRuntimeReloadExecutionStatus(
  value: unknown
): value is ExecutionAdapterRuntimeReloadExecutionStatus {
  return value === "blocked" || value === "execution_recorded";
}

function isExecutionAdapterRuntimeReloadAcceptanceStatus(
  value: unknown
): value is ExecutionAdapterRuntimeReloadAcceptanceStatus {
  return value === "blocked" || value === "acceptance_recorded";
}
