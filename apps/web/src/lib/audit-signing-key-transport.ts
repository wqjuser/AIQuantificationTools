import {
  isAuditEventRecord,
  isSecretFreeRecord,
  type AuditEventRecord
} from "./terminal-api-contract";
import {
  buildApiUrl,
  coreErrorDetail,
  defaultFetcher,
  type WorkspaceFetcher
} from "./terminal-api-http";

type WorkspaceSource = "core" | "fallback";

export type AuditSigningKeyStatus = "active" | "retired" | "revoked";

export interface AuditSigningKeyRecord {
  keyId: string;
  signer: string;
  algorithm: "hmac-sha256";
  chainId: string;
  status: AuditSigningKeyStatus;
  source: string;
  fingerprint: string;
  canSign: boolean;
  canVerify: boolean;
  createdAt: string | null;
  activatedAt: string | null;
  retiredAt: string | null;
}

export interface AuditSigningKeyRegistry {
  schemaVersion: 1;
  generatedAt: string;
  activeKeyId: string;
  rotationRequired: boolean;
  keys: AuditSigningKeyRecord[];
}

export interface AuditSigningKeyRegistryResult {
  registry?: AuditSigningKeyRegistry;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyRotationPlanEnvUpdate {
  name: string;
  value: string;
  sensitivity: "public" | "secret";
}

export interface AuditSigningKeyRotationPlanStep {
  id: string;
  title: string;
  detail: string;
  status: "manual" | "required" | "blocked";
}

export interface AuditSigningKeyRotationPlan {
  schemaVersion: 1;
  generatedAt: string;
  currentActiveKey: Pick<AuditSigningKeyRecord, "chainId" | "fingerprint" | "keyId" | "signer">;
  proposedActiveKey: Pick<AuditSigningKeyRecord, "chainId" | "keyId" | "signer">;
  rotationRequired: boolean;
  requiresRestart: boolean;
  environmentUpdates: AuditSigningKeyRotationPlanEnvUpdate[];
  legacyRegistryTemplate: string;
  steps: AuditSigningKeyRotationPlanStep[];
  blockedReasons: string[];
}

export interface AuditSigningKeyRotationPlanParams {
  proposedChainId?: string;
  proposedKeyId?: string;
  proposedSigner?: string;
}

export interface AuditSigningKeyRotationPlanResult {
  rotationPlan?: AuditSigningKeyRotationPlan;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyRotationApplyConfirmation {
  id: string;
  label: string;
  status: "confirmed" | "missing";
}

export interface AuditSigningKeyRotationApply {
  schemaVersion: 1;
  generatedAt: string;
  status: "blocked" | "ready_for_restart";
  applyMode: "manual_secret_store";
  auditEventType: "audit_signing_key_rotation_apply";
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  restartRequired: boolean;
  requiredConfirmations: AuditSigningKeyRotationApplyConfirmation[];
  blockedReasons: string[];
  environmentUpdateNames: string[];
  secretPlaceholderNames: string[];
}

export interface AuditSigningKeyRotationApplyParams {
  rotationPlan: AuditSigningKeyRotationPlan;
  confirmations: {
    legacySecretStored?: boolean;
    newSecretMaterialStored?: boolean;
    operatorReviewedPlan?: boolean;
  };
}

export interface AuditSigningKeyRotationApplyResult {
  rotationApply?: AuditSigningKeyRotationApply;
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeyControlledRestartEvidenceStatus = "blocked" | "evidence_recorded";
export type AuditSigningKeyControlledRestartEvidenceConfirmationStatus = "confirmed" | "missing";

export interface AuditSigningKeyControlledRestartEvidenceConfirmation {
  id: string;
  label: string;
  status: AuditSigningKeyControlledRestartEvidenceConfirmationStatus;
}

export interface AuditSigningKeyControlledRestartEvidence {
  schemaVersion: 1;
  evidenceId: string;
  applyEventId: string;
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  status: AuditSigningKeyControlledRestartEvidenceStatus;
  operator: string;
  recordedAt: string;
  evidenceMode: "manual_controlled_restart";
  restartRequired: boolean;
  requiredConfirmations: AuditSigningKeyControlledRestartEvidenceConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface AuditSigningKeyControlledRestartEvidenceRequest {
  applyEventId: string;
  operator?: string;
  confirmations?: {
    restartWindowExecuted?: boolean;
    rollbackPlanConfirmed?: boolean;
    postRestartValidationPassed?: boolean;
    operatorReviewedRestartLogs?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface AuditSigningKeyControlledRestartEvidenceResult {
  restartEvidence?: AuditSigningKeyControlledRestartEvidence;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeySecretMaterializationStatus = "blocked" | "manifest_recorded";
export type AuditSigningKeySecretMaterializationConfirmationStatus = "confirmed" | "missing";

export interface AuditSigningKeySecretMaterializationConfirmation {
  id: string;
  label: string;
  status: AuditSigningKeySecretMaterializationConfirmationStatus;
}

export interface AuditSigningKeySecretMaterialization {
  schemaVersion: 1;
  materializationId: string;
  planEventId: string;
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  status: AuditSigningKeySecretMaterializationStatus;
  operator: string;
  recordedAt: string;
  materializationMode: "local_secret_store_manifest";
  backend: string;
  manifestPath: string;
  requiredEnvVars: string[];
  secretPlaceholderNames: string[];
  requiredConfirmations: AuditSigningKeySecretMaterializationConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface AuditSigningKeySecretMaterializationRequest {
  planEventId: string;
  operator?: string;
  backend: string;
  manifestPath: string;
  confirmations?: {
    localSecretStoreWriteVerified?: boolean;
    noRawSecretInPayload?: boolean;
    envBindingPlanDocumented?: boolean;
    rollbackPlanDocumented?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface AuditSigningKeySecretMaterializationResult {
  secretMaterialization?: AuditSigningKeySecretMaterialization;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeySecretMaterializationHistoryResult {
  secretMaterializations: AuditSigningKeySecretMaterialization[];
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeyEnvironmentBindingStatus = "blocked" | "binding_recorded";
export type AuditSigningKeyEnvironmentBindingConfirmationStatus = "confirmed" | "missing";

export interface AuditSigningKeyEnvironmentBindingConfirmation {
  id: string;
  label: string;
  status: AuditSigningKeyEnvironmentBindingConfirmationStatus;
}

export interface AuditSigningKeyEnvironmentBinding {
  schemaVersion: 1;
  bindingId: string;
  materializationId: string;
  planEventId: string;
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  status: AuditSigningKeyEnvironmentBindingStatus;
  operator: string;
  recordedAt: string;
  bindingMode: "container_env_reference";
  backend: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: AuditSigningKeyEnvironmentBindingConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface AuditSigningKeyEnvironmentBindingRequest {
  materializationId: string;
  operator?: string;
  bindingMode?: "container_env_reference";
  confirmations?: {
    runtimeEnvMappingVerified?: boolean;
    configReloadPlanDocumented?: boolean;
    noRawSecretInPayload?: boolean;
    rollbackSnapshotRecorded?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface AuditSigningKeyEnvironmentBindingResult {
  environmentBinding?: AuditSigningKeyEnvironmentBinding;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyEnvironmentBindingHistoryResult {
  environmentBindings: AuditSigningKeyEnvironmentBinding[];
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeyRuntimeReloadPlanStatus = "blocked" | "plan_recorded";
export type AuditSigningKeyRuntimeReloadPlanConfirmationStatus = "confirmed" | "missing";

export interface AuditSigningKeyRuntimeReloadPlanConfirmation {
  id: string;
  label: string;
  status: AuditSigningKeyRuntimeReloadPlanConfirmationStatus;
}

export interface AuditSigningKeyRuntimeReloadPlan {
  schemaVersion: 1;
  planId: string;
  bindingId: string;
  materializationId: string;
  planEventId: string;
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  status: AuditSigningKeyRuntimeReloadPlanStatus;
  operator: string;
  recordedAt: string;
  reloadMode: "manual_container_reload_plan";
  maintenanceWindowId: string;
  bindingMode: "container_env_reference";
  backend: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: AuditSigningKeyRuntimeReloadPlanConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface AuditSigningKeyRuntimeReloadPlanRequest {
  bindingId: string;
  operator?: string;
  reloadMode?: "manual_container_reload_plan";
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

export interface AuditSigningKeyRuntimeReloadPlanResult {
  runtimeReloadPlan?: AuditSigningKeyRuntimeReloadPlan;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyRuntimeReloadPlanHistoryResult {
  runtimeReloadPlans: AuditSigningKeyRuntimeReloadPlan[];
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeyRuntimeReloadExecutionStatus = "blocked" | "execution_recorded";
export type AuditSigningKeyRuntimeReloadExecutionConfirmationStatus = "confirmed" | "missing";

export interface AuditSigningKeyRuntimeReloadExecutionConfirmation {
  id: string;
  label: string;
  status: AuditSigningKeyRuntimeReloadExecutionConfirmationStatus;
}

export interface AuditSigningKeyRuntimeReloadExecution {
  schemaVersion: 1;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  planEventId: string;
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  status: AuditSigningKeyRuntimeReloadExecutionStatus;
  operator: string;
  recordedAt: string;
  executionMode: "manual_controlled_reload_evidence";
  reloadMode: "manual_container_reload_plan";
  maintenanceWindowId: string;
  bindingMode: "container_env_reference";
  backend: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: AuditSigningKeyRuntimeReloadExecutionConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface AuditSigningKeyRuntimeReloadExecutionRequest {
  planId: string;
  operator?: string;
  executionMode?: "manual_controlled_reload_evidence";
  confirmations?: {
    preReloadHealthVerified?: boolean;
    reloadActionRecorded?: boolean;
    postReloadSmokePassed?: boolean;
    rollbackReadinessConfirmed?: boolean;
    operatorConfirmedLiveBlocked?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface AuditSigningKeyRuntimeReloadExecutionResult {
  runtimeReloadExecution?: AuditSigningKeyRuntimeReloadExecution;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyRuntimeReloadExecutionHistoryResult {
  runtimeReloadExecutions: AuditSigningKeyRuntimeReloadExecution[];
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeyRotationAcceptanceStatus = "blocked" | "acceptance_recorded";
export type AuditSigningKeyRotationAcceptanceConfirmationStatus = "confirmed" | "missing";

export interface AuditSigningKeyRotationAcceptanceConfirmation {
  id: string;
  label: string;
  status: AuditSigningKeyRotationAcceptanceConfirmationStatus;
}

export interface AuditSigningKeyRotationAcceptance {
  schemaVersion: 1;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  planEventId: string;
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  status: AuditSigningKeyRotationAcceptanceStatus;
  operator: string;
  recordedAt: string;
  acceptanceMode: "manual_rotation_acceptance";
  executionMode: "manual_controlled_reload_evidence";
  reloadMode: "manual_container_reload_plan";
  maintenanceWindowId: string;
  requiredEnvVars: string[];
  requiredConfirmations: AuditSigningKeyRotationAcceptanceConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface AuditSigningKeyRotationAcceptanceRequest {
  executionId: string;
  operator?: string;
  acceptanceMode?: "manual_rotation_acceptance";
  confirmations?: {
    executionEvidenceReviewed?: boolean;
    signatureProbeVerified?: boolean;
    legacyVerificationConfirmed?: boolean;
    rollbackWindowStillOpen?: boolean;
    operatorConfirmedActivationBlocked?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface AuditSigningKeyRotationAcceptanceResult {
  rotationAcceptance?: AuditSigningKeyRotationAcceptance;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyRotationAcceptanceHistoryResult {
  rotationAcceptances: AuditSigningKeyRotationAcceptance[];
  source: WorkspaceSource;
  error?: string;
}

export function buildAuditSigningKeysUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys");
}

export function buildAuditSigningKeyRotationPlanUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/rotation-plan");
}

export function buildAuditSigningKeyRotationApplyUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/rotation-apply");
}

export function buildAuditSigningKeyRotationRestartEvidenceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/rotation-restart-evidence");
}

export function buildAuditSigningKeySecretMaterializationUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/secret-materializations");
}

export function buildAuditSigningKeySecretMaterializationHistoryUrl(
  baseUrl: string,
  params: { proposedKeyId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/secret-materializations", (url) => {
    if (params.proposedKeyId?.trim()) {
      url.searchParams.set("proposedKeyId", params.proposedKeyId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildAuditSigningKeyEnvironmentBindingUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/environment-bindings");
}

export function buildAuditSigningKeyEnvironmentBindingHistoryUrl(
  baseUrl: string,
  params: { proposedKeyId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/environment-bindings", (url) => {
    if (params.proposedKeyId?.trim()) {
      url.searchParams.set("proposedKeyId", params.proposedKeyId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildAuditSigningKeyRuntimeReloadPlanUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/runtime-reload-plans");
}

export function buildAuditSigningKeyRuntimeReloadPlanHistoryUrl(
  baseUrl: string,
  params: { proposedKeyId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/runtime-reload-plans", (url) => {
    if (params.proposedKeyId?.trim()) {
      url.searchParams.set("proposedKeyId", params.proposedKeyId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildAuditSigningKeyRuntimeReloadExecutionUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/runtime-reload-executions");
}

export function buildAuditSigningKeyRuntimeReloadExecutionHistoryUrl(
  baseUrl: string,
  params: { proposedKeyId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/runtime-reload-executions", (url) => {
    if (params.proposedKeyId?.trim()) {
      url.searchParams.set("proposedKeyId", params.proposedKeyId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildAuditSigningKeyRotationAcceptanceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/rotation-acceptances");
}

export function buildAuditSigningKeyRotationAcceptanceHistoryUrl(
  baseUrl: string,
  params: { proposedKeyId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/rotation-acceptances", (url) => {
    if (params.proposedKeyId?.trim()) {
      url.searchParams.set("proposedKeyId", params.proposedKeyId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export async function loadAuditSigningKeys(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRegistryResult> {
  try {
    const response = await fetcher(buildAuditSigningKeysUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRegistryPayload(payload)) {
      throw new Error("Invalid audit signing key registry contract");
    }
    return {
      registry: payload.registry,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key registry error"
    };
  }
}

export async function prepareAuditSigningKeyRotationPlan(
  baseUrl: string,
  params: AuditSigningKeyRotationPlanParams = {},
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRotationPlanResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRotationPlanUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposedChainId: params.proposedChainId ?? "",
        proposedKeyId: params.proposedKeyId ?? "",
        proposedSigner: params.proposedSigner ?? ""
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRotationPlanPayload(payload)) {
      throw new Error("Invalid audit signing key rotation plan contract");
    }
    return {
      rotationPlan: payload.rotationPlan,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key rotation plan error"
    };
  }
}

export async function applyAuditSigningKeyRotationPlan(
  baseUrl: string,
  params: AuditSigningKeyRotationApplyParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRotationApplyResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRotationApplyUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        confirmations: {
          legacySecretStored: params.confirmations.legacySecretStored === true,
          newSecretMaterialStored: params.confirmations.newSecretMaterialStored === true,
          operatorReviewedPlan: params.confirmations.operatorReviewedPlan === true
        },
        rotationPlan: params.rotationPlan
      })
    });
    if (!response.ok && response.status !== 409) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRotationApplyPayload(payload)) {
      throw new Error("Invalid audit signing key rotation apply contract");
    }
    return {
      rotationApply: payload.rotationApply,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key rotation apply error"
    };
  }
}

export async function recordAuditSigningKeyControlledRestartEvidence(
  baseUrl: string,
  request: AuditSigningKeyControlledRestartEvidenceRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyControlledRestartEvidenceResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRotationRestartEvidenceUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applyEventId: request.applyEventId,
        operator: request.operator ?? "local-operator",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isAuditSigningKeyControlledRestartEvidencePayload(payload)) {
      return {
        restartEvidence: payload.restartEvidence,
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
    throw new Error("Invalid audit signing key controlled restart evidence contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key controlled restart evidence error"
    };
  }
}

export async function recordAuditSigningKeySecretMaterialization(
  baseUrl: string,
  request: AuditSigningKeySecretMaterializationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeySecretMaterializationResult> {
  try {
    const response = await fetcher(buildAuditSigningKeySecretMaterializationUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planEventId: request.planEventId,
        operator: request.operator ?? "local-operator",
        backend: request.backend,
        manifestPath: request.manifestPath,
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isAuditSigningKeySecretMaterializationPayload(payload)) {
      return {
        secretMaterialization: payload.secretMaterialization,
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
    throw new Error("Invalid audit signing key secret materialization contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key secret materialization error"
    };
  }
}

export async function loadAuditSigningKeySecretMaterializations(
  baseUrl: string,
  proposedKeyId = "",
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<AuditSigningKeySecretMaterializationHistoryResult> {
  try {
    const response = await fetcher(
      buildAuditSigningKeySecretMaterializationHistoryUrl(baseUrl, { proposedKeyId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeySecretMaterializationHistoryPayload(payload)) {
      throw new Error("Invalid audit signing key secret materialization history contract");
    }
    return {
      secretMaterializations: payload.secretMaterializations,
      source: "core"
    };
  } catch (error) {
    return {
      secretMaterializations: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key secret materialization history error"
    };
  }
}

export async function recordAuditSigningKeyEnvironmentBinding(
  baseUrl: string,
  request: AuditSigningKeyEnvironmentBindingRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyEnvironmentBindingResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyEnvironmentBindingUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materializationId: request.materializationId,
        operator: request.operator ?? "local-operator",
        bindingMode: request.bindingMode ?? "container_env_reference",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isAuditSigningKeyEnvironmentBindingPayload(payload)) {
      return {
        environmentBinding: payload.environmentBinding,
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
    throw new Error("Invalid audit signing key environment binding contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key environment binding error"
    };
  }
}

export async function loadAuditSigningKeyEnvironmentBindings(
  baseUrl: string,
  proposedKeyId = "",
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<AuditSigningKeyEnvironmentBindingHistoryResult> {
  try {
    const response = await fetcher(
      buildAuditSigningKeyEnvironmentBindingHistoryUrl(baseUrl, { proposedKeyId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyEnvironmentBindingHistoryPayload(payload)) {
      throw new Error("Invalid audit signing key environment binding history contract");
    }
    return {
      environmentBindings: payload.environmentBindings,
      source: "core"
    };
  } catch (error) {
    return {
      environmentBindings: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key environment binding history error"
    };
  }
}

export async function recordAuditSigningKeyRuntimeReloadPlan(
  baseUrl: string,
  request: AuditSigningKeyRuntimeReloadPlanRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRuntimeReloadPlanResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRuntimeReloadPlanUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bindingId: request.bindingId,
        operator: request.operator ?? "local-operator",
        reloadMode: request.reloadMode ?? "manual_container_reload_plan",
        maintenanceWindowId: request.maintenanceWindowId,
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isAuditSigningKeyRuntimeReloadPlanPayload(payload)) {
      return {
        runtimeReloadPlan: payload.runtimeReloadPlan,
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
    throw new Error("Invalid audit signing key runtime reload plan contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key runtime reload plan error"
    };
  }
}

export async function loadAuditSigningKeyRuntimeReloadPlans(
  baseUrl: string,
  proposedKeyId = "",
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<AuditSigningKeyRuntimeReloadPlanHistoryResult> {
  try {
    const response = await fetcher(
      buildAuditSigningKeyRuntimeReloadPlanHistoryUrl(baseUrl, { proposedKeyId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRuntimeReloadPlanHistoryPayload(payload)) {
      throw new Error("Invalid audit signing key runtime reload plan history contract");
    }
    return {
      runtimeReloadPlans: payload.runtimeReloadPlans,
      source: "core"
    };
  } catch (error) {
    return {
      runtimeReloadPlans: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key runtime reload plan history error"
    };
  }
}

export async function recordAuditSigningKeyRuntimeReloadExecution(
  baseUrl: string,
  request: AuditSigningKeyRuntimeReloadExecutionRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRuntimeReloadExecutionResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRuntimeReloadExecutionUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: request.planId,
        operator: request.operator ?? "local-operator",
        executionMode: request.executionMode ?? "manual_controlled_reload_evidence",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isAuditSigningKeyRuntimeReloadExecutionPayload(payload)) {
      return {
        runtimeReloadExecution: payload.runtimeReloadExecution,
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
    throw new Error("Invalid audit signing key runtime reload execution contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key runtime reload execution error"
    };
  }
}

export async function loadAuditSigningKeyRuntimeReloadExecutions(
  baseUrl: string,
  proposedKeyId = "",
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<AuditSigningKeyRuntimeReloadExecutionHistoryResult> {
  try {
    const response = await fetcher(
      buildAuditSigningKeyRuntimeReloadExecutionHistoryUrl(baseUrl, { proposedKeyId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRuntimeReloadExecutionHistoryPayload(payload)) {
      throw new Error("Invalid audit signing key runtime reload execution history contract");
    }
    return {
      runtimeReloadExecutions: payload.runtimeReloadExecutions,
      source: "core"
    };
  } catch (error) {
    return {
      runtimeReloadExecutions: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key runtime reload execution history error"
    };
  }
}

export async function recordAuditSigningKeyRotationAcceptance(
  baseUrl: string,
  request: AuditSigningKeyRotationAcceptanceRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRotationAcceptanceResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRotationAcceptanceUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        executionId: request.executionId,
        operator: request.operator ?? "local-operator",
        acceptanceMode: request.acceptanceMode ?? "manual_rotation_acceptance",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isAuditSigningKeyRotationAcceptancePayload(payload)) {
      return {
        rotationAcceptance: payload.rotationAcceptance,
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
    throw new Error("Invalid audit signing key rotation acceptance contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key rotation acceptance error"
    };
  }
}

export async function loadAuditSigningKeyRotationAcceptances(
  baseUrl: string,
  proposedKeyId = "",
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<AuditSigningKeyRotationAcceptanceHistoryResult> {
  try {
    const response = await fetcher(
      buildAuditSigningKeyRotationAcceptanceHistoryUrl(baseUrl, { proposedKeyId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRotationAcceptanceHistoryPayload(payload)) {
      throw new Error("Invalid audit signing key rotation acceptance history contract");
    }
    return {
      rotationAcceptances: payload.rotationAcceptances,
      source: "core"
    };
  } catch (error) {
    return {
      rotationAcceptances: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key rotation acceptance history error"
    };
  }
}

function isAuditSigningKeyRegistryPayload(value: unknown): value is { registry: AuditSigningKeyRegistry } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { registry?: unknown };
  return isAuditSigningKeyRegistry(payload.registry);
}

function isAuditSigningKeyRegistry(value: unknown): value is AuditSigningKeyRegistry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const registry = value as Partial<AuditSigningKeyRegistry>;
  return (
    registry.schemaVersion === 1 &&
    typeof registry.generatedAt === "string" &&
    typeof registry.activeKeyId === "string" &&
    typeof registry.rotationRequired === "boolean" &&
    Array.isArray(registry.keys) &&
    registry.keys.every(isAuditSigningKeyRecord)
  );
}

function isAuditSigningKeyRecord(value: unknown): value is AuditSigningKeyRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(value, "secret")) {
    return false;
  }
  const key = value as Partial<AuditSigningKeyRecord>;
  return (
    typeof key.keyId === "string" &&
    typeof key.signer === "string" &&
    key.algorithm === "hmac-sha256" &&
    typeof key.chainId === "string" &&
    (key.status === "active" || key.status === "retired" || key.status === "revoked") &&
    typeof key.source === "string" &&
    typeof key.fingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(key.fingerprint) &&
    typeof key.canSign === "boolean" &&
    typeof key.canVerify === "boolean" &&
    (key.createdAt === null || typeof key.createdAt === "string") &&
    (key.activatedAt === null || typeof key.activatedAt === "string") &&
    (key.retiredAt === null || typeof key.retiredAt === "string")
  );
}

function isAuditSigningKeyRotationPlanPayload(value: unknown): value is { rotationPlan: AuditSigningKeyRotationPlan } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { rotationPlan?: unknown };
  return isAuditSigningKeyRotationPlan(payload.rotationPlan);
}

function isAuditSigningKeyRotationPlan(value: unknown): value is AuditSigningKeyRotationPlan {
  if (!value || typeof value !== "object" || containsDisallowedSecretField(value)) {
    return false;
  }
  const plan = value as Partial<AuditSigningKeyRotationPlan>;
  return (
    plan.schemaVersion === 1 &&
    typeof plan.generatedAt === "string" &&
    isAuditSigningKeyRotationCurrentKey(plan.currentActiveKey) &&
    isAuditSigningKeyRotationProposedKey(plan.proposedActiveKey) &&
    typeof plan.rotationRequired === "boolean" &&
    typeof plan.requiresRestart === "boolean" &&
    Array.isArray(plan.environmentUpdates) &&
    plan.environmentUpdates.every(isAuditSigningKeyRotationEnvUpdate) &&
    typeof plan.legacyRegistryTemplate === "string" &&
    Array.isArray(plan.steps) &&
    plan.steps.every(isAuditSigningKeyRotationStep) &&
    Array.isArray(plan.blockedReasons) &&
    plan.blockedReasons.every((reason) => typeof reason === "string")
  );
}

function isAuditSigningKeyRotationCurrentKey(
  value: unknown
): value is AuditSigningKeyRotationPlan["currentActiveKey"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const key = value as Partial<AuditSigningKeyRotationPlan["currentActiveKey"]>;
  return (
    typeof key.keyId === "string" &&
    typeof key.signer === "string" &&
    typeof key.chainId === "string" &&
    typeof key.fingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(key.fingerprint)
  );
}

function isAuditSigningKeyRotationProposedKey(
  value: unknown
): value is AuditSigningKeyRotationPlan["proposedActiveKey"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const key = value as Partial<AuditSigningKeyRotationPlan["proposedActiveKey"]>;
  return typeof key.keyId === "string" && typeof key.signer === "string" && typeof key.chainId === "string";
}

function isAuditSigningKeyRotationEnvUpdate(value: unknown): value is AuditSigningKeyRotationPlanEnvUpdate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const update = value as Partial<AuditSigningKeyRotationPlanEnvUpdate>;
  return (
    typeof update.name === "string" &&
    typeof update.value === "string" &&
    (update.sensitivity === "public" || update.sensitivity === "secret")
  );
}

function isAuditSigningKeyRotationStep(value: unknown): value is AuditSigningKeyRotationPlanStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<AuditSigningKeyRotationPlanStep>;
  return (
    typeof step.id === "string" &&
    typeof step.title === "string" &&
    typeof step.detail === "string" &&
    (step.status === "manual" || step.status === "required" || step.status === "blocked")
  );
}

function isAuditSigningKeyRotationApplyPayload(value: unknown): value is { rotationApply: AuditSigningKeyRotationApply } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { rotationApply?: unknown };
  return isAuditSigningKeyRotationApply(payload.rotationApply);
}

function isAuditSigningKeyRotationApply(value: unknown): value is AuditSigningKeyRotationApply {
  if (!value || typeof value !== "object" || containsDisallowedSecretField(value)) {
    return false;
  }
  const rotationApply = value as Partial<AuditSigningKeyRotationApply>;
  return (
    rotationApply.schemaVersion === 1 &&
    typeof rotationApply.generatedAt === "string" &&
    (rotationApply.status === "blocked" || rotationApply.status === "ready_for_restart") &&
    rotationApply.applyMode === "manual_secret_store" &&
    rotationApply.auditEventType === "audit_signing_key_rotation_apply" &&
    typeof rotationApply.currentActiveKeyId === "string" &&
    typeof rotationApply.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(rotationApply.currentActiveKeyFingerprint) &&
    typeof rotationApply.proposedActiveKeyId === "string" &&
    typeof rotationApply.proposedSigner === "string" &&
    typeof rotationApply.proposedChainId === "string" &&
    typeof rotationApply.restartRequired === "boolean" &&
    Array.isArray(rotationApply.requiredConfirmations) &&
    rotationApply.requiredConfirmations.every(isAuditSigningKeyRotationApplyConfirmation) &&
    Array.isArray(rotationApply.blockedReasons) &&
    rotationApply.blockedReasons.every((reason) => typeof reason === "string") &&
    Array.isArray(rotationApply.environmentUpdateNames) &&
    rotationApply.environmentUpdateNames.every((name) => typeof name === "string") &&
    Array.isArray(rotationApply.secretPlaceholderNames) &&
    rotationApply.secretPlaceholderNames.every((name) => typeof name === "string")
  );
}

function isAuditSigningKeyRotationApplyConfirmation(
  value: unknown
): value is AuditSigningKeyRotationApplyConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeyRotationApplyConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeyControlledRestartEvidencePayload(
  value: unknown
): value is { restartEvidence: AuditSigningKeyControlledRestartEvidence; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { restartEvidence?: unknown; auditEvent?: unknown };
  return (
    isAuditSigningKeyControlledRestartEvidence(payload.restartEvidence) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isAuditSigningKeyControlledRestartEvidence(
  value: unknown
): value is AuditSigningKeyControlledRestartEvidence {
  if (!value || typeof value !== "object") {
    return false;
  }
  const evidence = value as Partial<AuditSigningKeyControlledRestartEvidence>;
  return (
    evidence.schemaVersion === 1 &&
    typeof evidence.evidenceId === "string" &&
    typeof evidence.applyEventId === "string" &&
    typeof evidence.currentActiveKeyId === "string" &&
    typeof evidence.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(evidence.currentActiveKeyFingerprint) &&
    typeof evidence.proposedActiveKeyId === "string" &&
    typeof evidence.proposedSigner === "string" &&
    typeof evidence.proposedChainId === "string" &&
    isAuditSigningKeyControlledRestartEvidenceStatus(evidence.status) &&
    typeof evidence.operator === "string" &&
    typeof evidence.recordedAt === "string" &&
    evidence.evidenceMode === "manual_controlled_restart" &&
    typeof evidence.restartRequired === "boolean" &&
    Array.isArray(evidence.requiredConfirmations) &&
    evidence.requiredConfirmations.every(isAuditSigningKeyControlledRestartEvidenceConfirmation) &&
    Array.isArray(evidence.blockedReasons) &&
    evidence.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(evidence.metadata) &&
    evidence.liveTradingAllowed === false &&
    evidence.paperOnly === true
  );
}

function isAuditSigningKeyControlledRestartEvidenceConfirmation(
  value: unknown
): value is AuditSigningKeyControlledRestartEvidenceConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeyControlledRestartEvidenceConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeyControlledRestartEvidenceStatus(
  value: unknown
): value is AuditSigningKeyControlledRestartEvidenceStatus {
  return value === "blocked" || value === "evidence_recorded";
}

function isAuditSigningKeySecretMaterializationPayload(
  value: unknown
): value is { secretMaterialization: AuditSigningKeySecretMaterialization; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { secretMaterialization?: unknown; auditEvent?: unknown };
  return (
    isAuditSigningKeySecretMaterialization(payload.secretMaterialization) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isAuditSigningKeySecretMaterializationHistoryPayload(
  value: unknown
): value is { secretMaterializations: AuditSigningKeySecretMaterialization[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { secretMaterializations?: unknown };
  return (
    Array.isArray(payload.secretMaterializations) &&
    payload.secretMaterializations.every(isAuditSigningKeySecretMaterialization)
  );
}

function isAuditSigningKeySecretMaterialization(
  value: unknown
): value is AuditSigningKeySecretMaterialization {
  if (!value || typeof value !== "object") {
    return false;
  }
  const materialization = value as Partial<AuditSigningKeySecretMaterialization>;
  return (
    materialization.schemaVersion === 1 &&
    typeof materialization.materializationId === "string" &&
    typeof materialization.planEventId === "string" &&
    typeof materialization.currentActiveKeyId === "string" &&
    typeof materialization.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(materialization.currentActiveKeyFingerprint) &&
    typeof materialization.proposedActiveKeyId === "string" &&
    typeof materialization.proposedSigner === "string" &&
    typeof materialization.proposedChainId === "string" &&
    isAuditSigningKeySecretMaterializationStatus(materialization.status) &&
    typeof materialization.operator === "string" &&
    typeof materialization.recordedAt === "string" &&
    materialization.materializationMode === "local_secret_store_manifest" &&
    typeof materialization.backend === "string" &&
    typeof materialization.manifestPath === "string" &&
    Array.isArray(materialization.requiredEnvVars) &&
    materialization.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(materialization.secretPlaceholderNames) &&
    materialization.secretPlaceholderNames.every((name) => typeof name === "string") &&
    Array.isArray(materialization.requiredConfirmations) &&
    materialization.requiredConfirmations.every(isAuditSigningKeySecretMaterializationConfirmation) &&
    Array.isArray(materialization.blockedReasons) &&
    materialization.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(materialization.metadata) &&
    materialization.liveTradingAllowed === false &&
    materialization.paperOnly === true
  );
}

function isAuditSigningKeySecretMaterializationConfirmation(
  value: unknown
): value is AuditSigningKeySecretMaterializationConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeySecretMaterializationConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeySecretMaterializationStatus(
  value: unknown
): value is AuditSigningKeySecretMaterializationStatus {
  return value === "blocked" || value === "manifest_recorded";
}

function isAuditSigningKeyEnvironmentBindingPayload(
  value: unknown
): value is { environmentBinding: AuditSigningKeyEnvironmentBinding; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { environmentBinding?: unknown; auditEvent?: unknown };
  return (
    isAuditSigningKeyEnvironmentBinding(payload.environmentBinding) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isAuditSigningKeyEnvironmentBindingHistoryPayload(
  value: unknown
): value is { environmentBindings: AuditSigningKeyEnvironmentBinding[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { environmentBindings?: unknown };
  return Array.isArray(payload.environmentBindings) && payload.environmentBindings.every(isAuditSigningKeyEnvironmentBinding);
}

function isAuditSigningKeyEnvironmentBinding(
  value: unknown
): value is AuditSigningKeyEnvironmentBinding {
  if (!value || typeof value !== "object") {
    return false;
  }
  const binding = value as Partial<AuditSigningKeyEnvironmentBinding>;
  return (
    binding.schemaVersion === 1 &&
    typeof binding.bindingId === "string" &&
    typeof binding.materializationId === "string" &&
    typeof binding.planEventId === "string" &&
    typeof binding.currentActiveKeyId === "string" &&
    typeof binding.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(binding.currentActiveKeyFingerprint) &&
    typeof binding.proposedActiveKeyId === "string" &&
    typeof binding.proposedSigner === "string" &&
    typeof binding.proposedChainId === "string" &&
    isAuditSigningKeyEnvironmentBindingStatus(binding.status) &&
    typeof binding.operator === "string" &&
    typeof binding.recordedAt === "string" &&
    binding.bindingMode === "container_env_reference" &&
    typeof binding.backend === "string" &&
    typeof binding.manifestPath === "string" &&
    Array.isArray(binding.requiredEnvVars) &&
    binding.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(binding.requiredConfirmations) &&
    binding.requiredConfirmations.every(isAuditSigningKeyEnvironmentBindingConfirmation) &&
    Array.isArray(binding.blockedReasons) &&
    binding.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(binding.metadata) &&
    binding.liveTradingAllowed === false &&
    binding.paperOnly === true
  );
}

function isAuditSigningKeyEnvironmentBindingConfirmation(
  value: unknown
): value is AuditSigningKeyEnvironmentBindingConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeyEnvironmentBindingConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeyEnvironmentBindingStatus(
  value: unknown
): value is AuditSigningKeyEnvironmentBindingStatus {
  return value === "blocked" || value === "binding_recorded";
}

function isAuditSigningKeyRuntimeReloadPlanPayload(
  value: unknown
): value is { runtimeReloadPlan: AuditSigningKeyRuntimeReloadPlan; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { runtimeReloadPlan?: unknown; auditEvent?: unknown };
  return (
    isAuditSigningKeyRuntimeReloadPlan(payload.runtimeReloadPlan) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isAuditSigningKeyRuntimeReloadPlanHistoryPayload(
  value: unknown
): value is { runtimeReloadPlans: AuditSigningKeyRuntimeReloadPlan[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { runtimeReloadPlans?: unknown };
  return Array.isArray(payload.runtimeReloadPlans) && payload.runtimeReloadPlans.every(isAuditSigningKeyRuntimeReloadPlan);
}

function isAuditSigningKeyRuntimeReloadPlan(
  value: unknown
): value is AuditSigningKeyRuntimeReloadPlan {
  if (!value || typeof value !== "object") {
    return false;
  }
  const plan = value as Partial<AuditSigningKeyRuntimeReloadPlan>;
  return (
    plan.schemaVersion === 1 &&
    typeof plan.planId === "string" &&
    typeof plan.bindingId === "string" &&
    typeof plan.materializationId === "string" &&
    typeof plan.planEventId === "string" &&
    typeof plan.currentActiveKeyId === "string" &&
    typeof plan.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(plan.currentActiveKeyFingerprint) &&
    typeof plan.proposedActiveKeyId === "string" &&
    typeof plan.proposedSigner === "string" &&
    typeof plan.proposedChainId === "string" &&
    isAuditSigningKeyRuntimeReloadPlanStatus(plan.status) &&
    typeof plan.operator === "string" &&
    typeof plan.recordedAt === "string" &&
    plan.reloadMode === "manual_container_reload_plan" &&
    typeof plan.maintenanceWindowId === "string" &&
    plan.bindingMode === "container_env_reference" &&
    typeof plan.backend === "string" &&
    typeof plan.manifestPath === "string" &&
    Array.isArray(plan.requiredEnvVars) &&
    plan.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(plan.requiredConfirmations) &&
    plan.requiredConfirmations.every(isAuditSigningKeyRuntimeReloadPlanConfirmation) &&
    Array.isArray(plan.blockedReasons) &&
    plan.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(plan.metadata) &&
    plan.liveTradingAllowed === false &&
    plan.paperOnly === true
  );
}

function isAuditSigningKeyRuntimeReloadPlanConfirmation(
  value: unknown
): value is AuditSigningKeyRuntimeReloadPlanConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeyRuntimeReloadPlanConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeyRuntimeReloadPlanStatus(
  value: unknown
): value is AuditSigningKeyRuntimeReloadPlanStatus {
  return value === "blocked" || value === "plan_recorded";
}

function isAuditSigningKeyRuntimeReloadExecutionPayload(
  value: unknown
): value is { runtimeReloadExecution: AuditSigningKeyRuntimeReloadExecution; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { runtimeReloadExecution?: unknown; auditEvent?: unknown };
  return (
    isAuditSigningKeyRuntimeReloadExecution(payload.runtimeReloadExecution) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isAuditSigningKeyRuntimeReloadExecutionHistoryPayload(
  value: unknown
): value is { runtimeReloadExecutions: AuditSigningKeyRuntimeReloadExecution[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { runtimeReloadExecutions?: unknown };
  return (
    Array.isArray(payload.runtimeReloadExecutions) &&
    payload.runtimeReloadExecutions.every(isAuditSigningKeyRuntimeReloadExecution)
  );
}

function isAuditSigningKeyRuntimeReloadExecution(
  value: unknown
): value is AuditSigningKeyRuntimeReloadExecution {
  if (!value || typeof value !== "object") {
    return false;
  }
  const execution = value as Partial<AuditSigningKeyRuntimeReloadExecution>;
  return (
    execution.schemaVersion === 1 &&
    typeof execution.executionId === "string" &&
    typeof execution.planId === "string" &&
    typeof execution.bindingId === "string" &&
    typeof execution.materializationId === "string" &&
    typeof execution.planEventId === "string" &&
    typeof execution.currentActiveKeyId === "string" &&
    typeof execution.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(execution.currentActiveKeyFingerprint) &&
    typeof execution.proposedActiveKeyId === "string" &&
    typeof execution.proposedSigner === "string" &&
    typeof execution.proposedChainId === "string" &&
    isAuditSigningKeyRuntimeReloadExecutionStatus(execution.status) &&
    typeof execution.operator === "string" &&
    typeof execution.recordedAt === "string" &&
    execution.executionMode === "manual_controlled_reload_evidence" &&
    execution.reloadMode === "manual_container_reload_plan" &&
    typeof execution.maintenanceWindowId === "string" &&
    execution.bindingMode === "container_env_reference" &&
    typeof execution.backend === "string" &&
    typeof execution.manifestPath === "string" &&
    Array.isArray(execution.requiredEnvVars) &&
    execution.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(execution.requiredConfirmations) &&
    execution.requiredConfirmations.every(isAuditSigningKeyRuntimeReloadExecutionConfirmation) &&
    Array.isArray(execution.blockedReasons) &&
    execution.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(execution.metadata) &&
    execution.liveTradingAllowed === false &&
    execution.paperOnly === true
  );
}

function isAuditSigningKeyRuntimeReloadExecutionConfirmation(
  value: unknown
): value is AuditSigningKeyRuntimeReloadExecutionConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeyRuntimeReloadExecutionConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeyRuntimeReloadExecutionStatus(
  value: unknown
): value is AuditSigningKeyRuntimeReloadExecutionStatus {
  return value === "blocked" || value === "execution_recorded";
}

function isAuditSigningKeyRotationAcceptancePayload(
  value: unknown
): value is { rotationAcceptance: AuditSigningKeyRotationAcceptance; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { rotationAcceptance?: unknown; auditEvent?: unknown };
  return (
    isAuditSigningKeyRotationAcceptance(payload.rotationAcceptance) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isAuditSigningKeyRotationAcceptanceHistoryPayload(
  value: unknown
): value is { rotationAcceptances: AuditSigningKeyRotationAcceptance[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { rotationAcceptances?: unknown };
  return (
    Array.isArray(payload.rotationAcceptances) &&
    payload.rotationAcceptances.every(isAuditSigningKeyRotationAcceptance)
  );
}

function isAuditSigningKeyRotationAcceptance(value: unknown): value is AuditSigningKeyRotationAcceptance {
  if (!value || typeof value !== "object") {
    return false;
  }
  const acceptance = value as Partial<AuditSigningKeyRotationAcceptance>;
  return (
    acceptance.schemaVersion === 1 &&
    typeof acceptance.acceptanceId === "string" &&
    typeof acceptance.executionId === "string" &&
    typeof acceptance.planId === "string" &&
    typeof acceptance.bindingId === "string" &&
    typeof acceptance.materializationId === "string" &&
    typeof acceptance.planEventId === "string" &&
    typeof acceptance.currentActiveKeyId === "string" &&
    typeof acceptance.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(acceptance.currentActiveKeyFingerprint) &&
    typeof acceptance.proposedActiveKeyId === "string" &&
    typeof acceptance.proposedSigner === "string" &&
    typeof acceptance.proposedChainId === "string" &&
    isAuditSigningKeyRotationAcceptanceStatus(acceptance.status) &&
    typeof acceptance.operator === "string" &&
    typeof acceptance.recordedAt === "string" &&
    acceptance.acceptanceMode === "manual_rotation_acceptance" &&
    acceptance.executionMode === "manual_controlled_reload_evidence" &&
    acceptance.reloadMode === "manual_container_reload_plan" &&
    typeof acceptance.maintenanceWindowId === "string" &&
    Array.isArray(acceptance.requiredEnvVars) &&
    acceptance.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(acceptance.requiredConfirmations) &&
    acceptance.requiredConfirmations.every(isAuditSigningKeyRotationAcceptanceConfirmation) &&
    Array.isArray(acceptance.blockedReasons) &&
    acceptance.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(acceptance.metadata) &&
    acceptance.liveTradingAllowed === false &&
    acceptance.paperOnly === true
  );
}

function isAuditSigningKeyRotationAcceptanceConfirmation(
  value: unknown
): value is AuditSigningKeyRotationAcceptanceConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeyRotationAcceptanceConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeyRotationAcceptanceStatus(
  value: unknown
): value is AuditSigningKeyRotationAcceptanceStatus {
  return value === "blocked" || value === "acceptance_recorded";
}

function containsDisallowedSecretField(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const disallowedSecretFields = new Set(["secret", "secretMaterial", "secretValue", "rawSecret", "privateKey", "keyMaterial"]);
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => {
    if (disallowedSecretFields.has(key)) {
      return true;
    }
    return typeof child === "object" && containsDisallowedSecretField(child);
  });
}
