import type { Market } from "../stage1/foundation-contracts";

export interface ExecutionAdapterLedgerRow {
  id: string;
  adapterId: string;
  adapter: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  state: string;
  label: string;
  actor: string;
  source: string;
  reason: string;
  nextStep: string;
  gateSummary: string;
  liveTradingAllowed: boolean;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterCertificationStatus = "passed" | "blocked" | "failed" | "review";

export interface ExecutionAdapterCertificationSnapshot {
  schemaVersion: 1;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterCertificationStatus;
  operator: string;
  startedAt: string;
  completedAt: string | null;
  checks: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterCertificationStatus;
    detail: string;
    metadata?: Record<string, unknown>;
  }>;
  metadata: Record<string, unknown>;
  summary: {
    checkCount: number;
    checkStatusCounts: Record<string, number>;
    passedChecks: number;
    blockedChecks: number;
    failedChecks: number;
    reviewChecks: number;
  };
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterCertificationRow {
  id: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterCertificationStatus;
  statusLabel: string;
  checkSummary: string;
  auditEventId: string;
  boundary: string;
  liveTradingAllowed: boolean;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterCertificationApplyStatus = "blocked" | "ready_for_restart";

export type ExecutionAdapterCertificationApplyConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterCertificationApplySnapshot {
  schemaVersion: 1;
  applyId: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterCertificationApplyStatus;
  operator: string;
  generatedAt: string;
  applyMode: string;
  restartRequired: boolean;
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterCertificationApplyConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterCertificationApplyRow {
  id: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterCertificationApplyStatus;
  statusLabel: string;
  applyMode: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  restartRequired: boolean;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterControlledRestartEvidenceStatus = "blocked" | "evidence_recorded";

export type ExecutionAdapterControlledRestartEvidenceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterControlledRestartEvidenceSnapshot {
  schemaVersion: 1;
  evidenceId: string;
  applyId: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterControlledRestartEvidenceStatus;
  operator: string;
  recordedAt: string;
  evidenceMode: string;
  restartRequired: boolean;
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterControlledRestartEvidenceConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterControlledRestartEvidenceRow {
  id: string;
  applyId: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterControlledRestartEvidenceStatus;
  statusLabel: string;
  evidenceMode: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  restartRequired: boolean;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterRestartAcceptanceStatus = "blocked" | "acceptance_recorded";

export type ExecutionAdapterRestartAcceptanceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterRestartAcceptanceSnapshot {
  schemaVersion: 1;
  acceptanceId: string;
  evidenceId: string;
  applyId: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterRestartAcceptanceStatus;
  operator: string;
  recordedAt: string;
  acceptanceMode: string;
  restartRequired: boolean;
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterRestartAcceptanceConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterRestartAcceptanceRow {
  id: string;
  evidenceId: string;
  applyId: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterRestartAcceptanceStatus;
  statusLabel: string;
  acceptanceMode: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  restartRequired: boolean;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterSecretReferenceStatus = "blocked" | "reference_recorded";

export type ExecutionAdapterSecretReferenceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSecretReferenceSnapshot {
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
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterSecretReferenceConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSecretReferenceRow {
  id: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterSecretReferenceStatus;
  statusLabel: string;
  referenceName: string;
  backend: string;
  envVarSummary: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterSecretMaterializationStatus = "blocked" | "manifest_recorded";

export type ExecutionAdapterSecretMaterializationConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSecretMaterializationSnapshot {
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
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterSecretMaterializationConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSecretMaterializationRow {
  id: string;
  referenceId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterSecretMaterializationStatus;
  statusLabel: string;
  referenceName: string;
  backend: string;
  manifestPath: string;
  materializationMode: string;
  envVarSummary: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterSecretManifestValidationStatus = "blocked" | "validated";

export interface ExecutionAdapterSecretManifestValidationSnapshot {
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

export interface ExecutionAdapterSecretManifestValidationRow {
  id: string;
  materializationId: string;
  referenceId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterSecretManifestValidationStatus;
  statusLabel: string;
  referenceName: string;
  backend: string;
  manifestPath: string;
  validationMode: string;
  fingerprint: string;
  envCoverageSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterEnvironmentBindingStatus = "blocked" | "binding_recorded";

export type ExecutionAdapterEnvironmentBindingConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterEnvironmentBindingSnapshot {
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
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterEnvironmentBindingConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterEnvironmentBindingRow {
  id: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterEnvironmentBindingStatus;
  statusLabel: string;
  bindingMode: string;
  manifestPath: string;
  envVarSummary: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterRuntimeReloadPlanStatus = "blocked" | "plan_recorded";

export type ExecutionAdapterRuntimeReloadPlanConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterRuntimeReloadPlanSnapshot {
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
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterRuntimeReloadPlanConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterRuntimeReloadPlanRow {
  id: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterRuntimeReloadPlanStatus;
  statusLabel: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  envVarSummary: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterRuntimeReloadExecutionStatus = "blocked" | "execution_recorded";

export type ExecutionAdapterRuntimeReloadExecutionConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterRuntimeReloadExecutionSnapshot {
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
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterRuntimeReloadExecutionConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterRuntimeReloadExecutionRow {
  id: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterRuntimeReloadExecutionStatus;
  statusLabel: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  envVarSummary: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterRuntimeReloadAcceptanceStatus = "blocked" | "acceptance_recorded";

export type ExecutionAdapterRuntimeReloadAcceptanceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterRuntimeReloadAcceptanceSnapshot {
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
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterRuntimeReloadAcceptanceConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterRuntimeReloadAcceptanceRow {
  id: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterRuntimeReloadAcceptanceStatus;
  statusLabel: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  envVarSummary: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterOrchestrationDryRunStatus = "blocked" | "dry_run_recorded";

export type ExecutionAdapterOrchestrationDryRunConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterOrchestrationDryRunSnapshot {
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
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterOrchestrationDryRunConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterOrchestrationDryRunRow {
  id: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterOrchestrationDryRunStatus;
  statusLabel: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  envVarSummary: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterOrchestrationExecutionStatus = "blocked" | "execution_recorded";

export type ExecutionAdapterOrchestrationExecutionConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterOrchestrationExecutionSnapshot {
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
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterOrchestrationExecutionConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterOrchestrationExecutionRow {
  id: string;
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
  timestamp: string;
  status: ExecutionAdapterOrchestrationExecutionStatus;
  statusLabel: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  envVarSummary: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterHumanConfirmationStatus = "blocked" | "confirmation_recorded";

export type ExecutionAdapterHumanConfirmationConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterHumanConfirmationSnapshot {
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
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterHumanConfirmationConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}
