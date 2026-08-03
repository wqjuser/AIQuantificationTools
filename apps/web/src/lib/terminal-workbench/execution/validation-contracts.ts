import type { ExecutionAdapterHumanConfirmationStatus } from "./adapter-contracts";
import type { Market } from "../stage1/foundation-contracts";

export interface ExecutionAdapterHumanConfirmationRow {
  id: string;
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
  timestamp: string;
  status: ExecutionAdapterHumanConfirmationStatus;
  statusLabel: string;
  confirmationMode: string;
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

export type ExecutionAdapterSandboxProbePlanStatus = "blocked" | "probe_plan_recorded";

export type ExecutionAdapterSandboxProbePlanConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSandboxProbePlanSnapshot {
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
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterSandboxProbePlanConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSandboxProbePlanRow {
  id: string;
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
  timestamp: string;
  status: ExecutionAdapterSandboxProbePlanStatus;
  statusLabel: string;
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
  envVarSummary: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterSandboxProbeExecutionStatus = "blocked" | "probe_execution_recorded";

export type ExecutionAdapterSandboxProbeExecutionConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSandboxProbeExecutionSnapshot {
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
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterSandboxProbeExecutionConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSandboxProbeExecutionRow {
  id: string;
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
  timestamp: string;
  status: ExecutionAdapterSandboxProbeExecutionStatus;
  statusLabel: string;
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
  envVarSummary: string;
  confirmationSummary: string;
  healthProbeSummary: string;
  authoritativeHealthReady: boolean;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterSandboxProbeReviewStatus = "blocked" | "probe_review_recorded";

export type ExecutionAdapterSandboxProbeReviewConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSandboxProbeReviewSnapshot {
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
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterSandboxProbeReviewConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSandboxProbeReviewRow {
  id: string;
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
  timestamp: string;
  status: ExecutionAdapterSandboxProbeReviewStatus;
  statusLabel: string;
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
  envVarSummary: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterProductionRouteReviewStatus = "blocked" | "route_review_recorded";

export type ExecutionAdapterProductionRouteReviewConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterProductionRouteReviewSnapshot {
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
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterProductionRouteReviewConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterProductionRouteReviewRow {
  id: string;
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
  timestamp: string;
  status: ExecutionAdapterProductionRouteReviewStatus;
  statusLabel: string;
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
  envVarSummary: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterSandboxOrderSchemaDryRunStatus = "blocked" | "schema_dry_run_recorded";

export type ExecutionAdapterSandboxOrderSchemaDryRunConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSandboxOrderSchemaDryRunSnapshot {
  schemaVersion: 1;
  sandboxOrderSchemaDryRunId: string;
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
  status: ExecutionAdapterSandboxOrderSchemaDryRunStatus;
  operator: string;
  recordedAt: string;
  dryRunMode: string;
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
  orderIntent: {
    symbol: string;
    side: "buy" | "sell";
    type: string;
    quantity: number;
    price?: number;
    timeInForce?: string;
  };
  orderSubmitted: boolean;
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterSandboxOrderSchemaDryRunConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSandboxOrderSchemaDryRunRow {
  id: string;
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
  timestamp: string;
  status: ExecutionAdapterSandboxOrderSchemaDryRunStatus;
  statusLabel: string;
  dryRunMode: string;
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
  envVarSummary: string;
  orderIntentSummary: string;
  orderSubmitted: boolean;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterPaperOrderLifecycleStatus = "blocked" | "lifecycle_recorded";

export type ExecutionAdapterPaperOrderLifecycleConfirmationStatus = "confirmed" | "missing";

export type ExecutionAdapterPaperOrderLifecycleStepStatus = "blocked" | "recorded";

export interface ExecutionAdapterPaperOrderLifecycleSnapshot {
  schemaVersion: 1;
  paperOrderLifecycleId: string;
  sandboxOrderSchemaDryRunId: string;
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
  status: ExecutionAdapterPaperOrderLifecycleStatus;
  operator: string;
  recordedAt: string;
  lifecycleMode: string;
  dryRunMode: string;
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
  orderIntent: {
    symbol: string;
    side: "buy" | "sell";
    type: string;
    quantity: number;
    price?: number;
    timeInForce?: string;
  };
  lifecycleSteps: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterPaperOrderLifecycleStepStatus;
  }>;
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterPaperOrderLifecycleConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterPaperOrderLifecycleRow {
  id: string;
  sandboxOrderSchemaDryRunId: string;
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
  timestamp: string;
  status: ExecutionAdapterPaperOrderLifecycleStatus;
  statusLabel: string;
  lifecycleMode: string;
  dryRunMode: string;
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
  envVarSummary: string;
  orderIntentSummary: string;
  lifecycleStepSummary: string;
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterPaperRouteRunbookStatus = "blocked" | "runbook_recorded";

export type ExecutionAdapterPaperRouteRunbookConfirmationStatus = "confirmed" | "missing";

export type ExecutionAdapterPaperRouteRunbookStepStatus = "blocked" | "recorded";

export interface ExecutionAdapterPaperRouteRunbookSnapshot {
  schemaVersion: 1;
  paperRouteRunbookId: string;
  paperOrderLifecycleId: string;
  sandboxOrderSchemaDryRunId: string;
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
  status: ExecutionAdapterPaperRouteRunbookStatus;
  operator: string;
  recordedAt: string;
  runbookMode: string;
  lifecycleMode: string;
  dryRunMode: string;
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
  orderIntent: {
    symbol: string;
    side: "buy" | "sell";
    type: string;
    quantity: number;
    price?: number;
    timeInForce?: string;
  };
  lifecycleSteps: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterPaperOrderLifecycleStepStatus;
  }>;
  runbookSteps: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterPaperRouteRunbookStepStatus;
  }>;
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterPaperRouteRunbookConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterPaperRouteRunbookRow {
  id: string;
  paperOrderLifecycleId: string;
  sandboxOrderSchemaDryRunId: string;
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
  timestamp: string;
  status: ExecutionAdapterPaperRouteRunbookStatus;
  statusLabel: string;
  runbookMode: string;
  lifecycleMode: string;
  dryRunMode: string;
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
  envVarSummary: string;
  orderIntentSummary: string;
  lifecycleStepSummary: string;
  runbookStepSummary: string;
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterOpsStateStatus = "blocked" | "ops_state_recorded";

export type ExecutionAdapterOpsStateConfirmationStatus = "confirmed" | "missing";

export type ExecutionAdapterOpsStateStepStatus = "blocked" | "recorded";
