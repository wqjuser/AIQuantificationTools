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

export type ExecutionAdapterSandboxOrderSchemaDryRunStatus = "blocked" | "schema_dry_run_recorded";
export type ExecutionAdapterSandboxOrderSchemaDryRunConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSandboxOrderSchemaDryRunConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterSandboxOrderSchemaDryRunConfirmationStatus;
}

export interface ExecutionAdapterSandboxOrderIntent {
  symbol: string;
  side: "buy" | "sell";
  type: string;
  quantity: number;
  price?: number;
  timeInForce?: string;
}

export interface ExecutionAdapterSandboxOrderSchemaDryRunResult {
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
  orderIntent: ExecutionAdapterSandboxOrderIntent;
  orderSubmitted: boolean;
  requiredConfirmations: ExecutionAdapterSandboxOrderSchemaDryRunConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSandboxOrderSchemaDryRunRequest {
  adapterId: string;
  productionRouteReviewId: string;
  operator?: string;
  dryRunMode?: string;
  orderIntent: ExecutionAdapterSandboxOrderIntent;
  confirmations?: {
    productionRouteReviewAccepted?: boolean;
    healthProbeBound?: boolean;
    orderIntentSchemaValidated?: boolean;
    sandboxEndpointStillLocked?: boolean;
    operatorConfirmedNoOrderSubmitted?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSandboxOrderSchemaDryRunRecordResult {
  adapterSandboxOrderSchemaDryRun?: ExecutionAdapterSandboxOrderSchemaDryRunResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSandboxOrderSchemaDryRunHistoryResult {
  adapterSandboxOrderSchemaDryRuns: ExecutionAdapterSandboxOrderSchemaDryRunResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterPaperOrderLifecycleStatus = "blocked" | "lifecycle_recorded";
export type ExecutionAdapterPaperOrderLifecycleConfirmationStatus = "confirmed" | "missing";
export type ExecutionAdapterPaperOrderLifecycleStepStatus = "blocked" | "recorded";

export interface ExecutionAdapterPaperOrderLifecycleConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterPaperOrderLifecycleConfirmationStatus;
}

export interface ExecutionAdapterPaperOrderLifecycleStep {
  id: string;
  label: string;
  status: ExecutionAdapterPaperOrderLifecycleStepStatus;
}

export interface ExecutionAdapterPaperOrderLifecycleResult {
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
  orderIntent: ExecutionAdapterSandboxOrderIntent;
  lifecycleSteps: ExecutionAdapterPaperOrderLifecycleStep[];
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  requiredConfirmations: ExecutionAdapterPaperOrderLifecycleConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterPaperOrderLifecycleRequest {
  adapterId: string;
  sandboxOrderSchemaDryRunId: string;
  operator?: string;
  lifecycleMode?: string;
  confirmations?: {
    schemaDryRunAccepted?: boolean;
    paperRouterLocked?: boolean;
    riskLimitsBound?: boolean;
    simulatedLifecycleGenerated?: boolean;
    operatorConfirmedNoLiveOrderSubmitted?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterPaperOrderLifecycleRecordResult {
  adapterPaperOrderLifecycle?: ExecutionAdapterPaperOrderLifecycleResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterPaperOrderLifecycleHistoryResult {
  adapterPaperOrderLifecycles: ExecutionAdapterPaperOrderLifecycleResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterPaperRouteRunbookStatus = "blocked" | "runbook_recorded";
export type ExecutionAdapterPaperRouteRunbookConfirmationStatus = "confirmed" | "missing";
export type ExecutionAdapterPaperRouteRunbookStepStatus = "blocked" | "recorded";

export interface ExecutionAdapterPaperRouteRunbookConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterPaperRouteRunbookConfirmationStatus;
}

export interface ExecutionAdapterPaperRouteRunbookStep {
  id: string;
  label: string;
  status: ExecutionAdapterPaperRouteRunbookStepStatus;
}

export interface ExecutionAdapterPaperRouteRunbookResult {
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
  orderIntent: ExecutionAdapterSandboxOrderIntent;
  lifecycleSteps: ExecutionAdapterPaperOrderLifecycleStep[];
  runbookSteps: ExecutionAdapterPaperRouteRunbookStep[];
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  requiredConfirmations: ExecutionAdapterPaperRouteRunbookConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterPaperRouteRunbookRequest {
  adapterId: string;
  paperOrderLifecycleId: string;
  operator?: string;
  runbookMode?: string;
  confirmations?: {
    paperLifecycleAccepted?: boolean;
    paperAccountSnapshotCaptured?: boolean;
    riskControlsVerified?: boolean;
    replayPlanRecorded?: boolean;
    operatorConfirmedNoLiveRouting?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterPaperRouteRunbookRecordResult {
  adapterPaperRouteRunbook?: ExecutionAdapterPaperRouteRunbookResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterPaperRouteRunbookHistoryResult {
  adapterPaperRouteRunbooks: ExecutionAdapterPaperRouteRunbookResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterOpsStateStatus = "blocked" | "ops_state_recorded";
export type ExecutionAdapterOpsStateConfirmationStatus = "confirmed" | "missing";
export type ExecutionAdapterOpsStateStepStatus = "blocked" | "recorded";

export interface ExecutionAdapterOpsStateConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterOpsStateConfirmationStatus;
}

export interface ExecutionAdapterOpsStateStep {
  id: string;
  label: string;
  status: ExecutionAdapterOpsStateStepStatus;
}

export interface ExecutionAdapterOpsStateResult {
  schemaVersion: 1;
  adapterOpsStateId: string;
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
  status: ExecutionAdapterOpsStateStatus;
  operator: string;
  recordedAt: string;
  opsMode: string;
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
  orderIntent: ExecutionAdapterSandboxOrderIntent;
  lifecycleSteps: ExecutionAdapterPaperOrderLifecycleStep[];
  runbookSteps: ExecutionAdapterPaperRouteRunbookStep[];
  opsSteps: ExecutionAdapterOpsStateStep[];
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  requiredConfirmations: ExecutionAdapterOpsStateConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterOpsStateRequest {
  adapterId: string;
  paperRouteRunbookId: string;
  operator?: string;
  opsMode?: string;
  confirmations?: {
    paperRouteRunbookAccepted?: boolean;
    monitoringChannelReady?: boolean;
    killSwitchDrillRecorded?: boolean;
    paperAccountReconciled?: boolean;
    operatorConfirmedLiveTradingDisabled?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterOpsStateRecordResult {
  adapterOpsState?: ExecutionAdapterOpsStateResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterOpsStateHistoryResult {
  adapterOpsStates: ExecutionAdapterOpsStateResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterPaperExecutionStatus = "blocked" | "paper_execution_recorded";
export type ExecutionAdapterPaperExecutionConfirmationStatus = "confirmed" | "missing";
export type ExecutionAdapterPaperExecutionStepStatus = "blocked" | "recorded";
export type ExecutionAdapterPaperExecutionFillStatus = "blocked" | "filled";

export interface ExecutionAdapterPaperExecutionConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterPaperExecutionConfirmationStatus;
}

export interface ExecutionAdapterPaperExecutionStep {
  id: string;
  label: string;
  status: ExecutionAdapterPaperExecutionStepStatus;
}

export interface ExecutionAdapterPaperExecutionFill {
  fillId: string;
  status: ExecutionAdapterPaperExecutionFillStatus;
  symbol: string;
  side: "buy" | "sell";
  type: string;
  quantity: number;
  price?: number;
  timeInForce?: string;
  source: string;
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
}

export interface ExecutionAdapterPaperExecutionResult {
  schemaVersion: 1;
  adapterPaperExecutionId: string;
  adapterOpsStateId: string;
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
  status: ExecutionAdapterPaperExecutionStatus;
  operator: string;
  recordedAt: string;
  paperExecutionMode: string;
  opsMode: string;
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
  orderIntent: ExecutionAdapterSandboxOrderIntent;
  lifecycleSteps: ExecutionAdapterPaperOrderLifecycleStep[];
  runbookSteps: ExecutionAdapterPaperRouteRunbookStep[];
  opsSteps: ExecutionAdapterOpsStateStep[];
  paperExecutionSteps: ExecutionAdapterPaperExecutionStep[];
  simulatedFill: ExecutionAdapterPaperExecutionFill;
  paperFillRecorded: boolean;
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  requiredConfirmations: ExecutionAdapterPaperExecutionConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterPaperExecutionRequest {
  adapterId: string;
  adapterOpsStateId: string;
  operator?: string;
  paperExecutionMode?: string;
  confirmations?: {
    opsStateAccepted?: boolean;
    paperAccountSynced?: boolean;
    riskBudgetBound?: boolean;
    simulatedFillGenerated?: boolean;
    operatorConfirmedNoLiveRouting?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterPaperExecutionRecordResult {
  adapterPaperExecution?: ExecutionAdapterPaperExecutionResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterPaperExecutionHistoryResult {
  adapterPaperExecutions: ExecutionAdapterPaperExecutionResult[];
  source: WorkspaceSource;
  error?: string;
}

export function buildExecutionAdapterSandboxOrderSchemaDryRunUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-order-schema-dry-runs");
}

export function buildExecutionAdapterPaperOrderLifecycleUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-paper-order-lifecycles");
}

export function buildExecutionAdapterPaperRouteRunbookUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-paper-route-runbooks");
}

export function buildExecutionAdapterOpsStateUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-ops-states");
}

export function buildExecutionAdapterPaperExecutionUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-paper-executions");
}



export function buildExecutionAdapterSandboxOrderSchemaDryRunHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-order-schema-dry-runs", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterPaperOrderLifecycleHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-paper-order-lifecycles", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterPaperRouteRunbookHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-paper-route-runbooks", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterOpsStateHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-ops-states", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterPaperExecutionHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-paper-executions", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export async function recordExecutionAdapterSandboxOrderSchemaDryRun(
  baseUrl: string,
  request: ExecutionAdapterSandboxOrderSchemaDryRunRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSandboxOrderSchemaDryRunRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxOrderSchemaDryRunUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        productionRouteReviewId: request.productionRouteReviewId,
        operator: request.operator ?? "local-operator",
        dryRunMode: request.dryRunMode ?? "manual_sandbox_order_schema_dry_run",
        orderIntent: request.orderIntent,
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSandboxOrderSchemaDryRunRecordPayload(payload)) {
      return {
        adapterSandboxOrderSchemaDryRun: payload.adapterSandboxOrderSchemaDryRun,
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
    throw new Error("Invalid execution adapter sandbox order schema dry-run contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox order schema dry-run error"
    };
  }
}

export async function recordExecutionAdapterPaperOrderLifecycle(
  baseUrl: string,
  request: ExecutionAdapterPaperOrderLifecycleRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterPaperOrderLifecycleRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterPaperOrderLifecycleUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        sandboxOrderSchemaDryRunId: request.sandboxOrderSchemaDryRunId,
        operator: request.operator ?? "local-operator",
        lifecycleMode: request.lifecycleMode ?? "manual_paper_order_lifecycle_adapter",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterPaperOrderLifecycleRecordPayload(payload)) {
      return {
        adapterPaperOrderLifecycle: payload.adapterPaperOrderLifecycle,
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
    throw new Error("Invalid execution adapter paper order lifecycle contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter paper order lifecycle error"
    };
  }
}

export async function recordExecutionAdapterPaperRouteRunbook(
  baseUrl: string,
  request: ExecutionAdapterPaperRouteRunbookRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterPaperRouteRunbookRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterPaperRouteRunbookUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        paperOrderLifecycleId: request.paperOrderLifecycleId,
        operator: request.operator ?? "local-operator",
        runbookMode: request.runbookMode ?? "manual_paper_route_runbook",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterPaperRouteRunbookRecordPayload(payload)) {
      return {
        adapterPaperRouteRunbook: payload.adapterPaperRouteRunbook,
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
    throw new Error("Invalid execution adapter paper route runbook contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter paper route runbook error"
    };
  }
}

export async function recordExecutionAdapterOpsState(
  baseUrl: string,
  request: ExecutionAdapterOpsStateRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterOpsStateRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterOpsStateUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        paperRouteRunbookId: request.paperRouteRunbookId,
        operator: request.operator ?? "local-operator",
        opsMode: request.opsMode ?? "manual_adapter_ops_state",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterOpsStateRecordPayload(payload)) {
      return {
        adapterOpsState: payload.adapterOpsState,
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
    throw new Error("Invalid execution adapter ops state contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter ops state error"
    };
  }
}

export async function recordExecutionAdapterPaperExecution(
  baseUrl: string,
  request: ExecutionAdapterPaperExecutionRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterPaperExecutionRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterPaperExecutionUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        adapterOpsStateId: request.adapterOpsStateId,
        operator: request.operator ?? "local-operator",
        paperExecutionMode: request.paperExecutionMode ?? "manual_adapter_paper_execution",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterPaperExecutionRecordPayload(payload)) {
      return {
        adapterPaperExecution: payload.adapterPaperExecution,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      if (isExecutionAdapterPaperExecutionDuplicatePayload(payload)) {
        return {
          adapterPaperExecution: payload.existingAdapterPaperExecution,
          source: "core",
          error: payload.error
        };
      }
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter paper execution contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter paper execution error"
    };
  }
}

export async function loadExecutionAdapterSandboxOrderSchemaDryRuns(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSandboxOrderSchemaDryRunHistoryResult> {
  try {
    const response = await fetcher(
      buildExecutionAdapterSandboxOrderSchemaDryRunHistoryUrl(baseUrl, { adapterId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSandboxOrderSchemaDryRunHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter sandbox order schema dry-run history contract");
    }
    return {
      adapterSandboxOrderSchemaDryRuns: payload.adapterSandboxOrderSchemaDryRuns,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSandboxOrderSchemaDryRuns: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox order schema dry-run history error"
    };
  }
}

export async function loadExecutionAdapterPaperOrderLifecycles(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterPaperOrderLifecycleHistoryResult> {
  try {
    const response = await fetcher(
      buildExecutionAdapterPaperOrderLifecycleHistoryUrl(baseUrl, { adapterId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterPaperOrderLifecycleHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter paper order lifecycle history contract");
    }
    return {
      adapterPaperOrderLifecycles: payload.adapterPaperOrderLifecycles,
      source: "core"
    };
  } catch (error) {
    return {
      adapterPaperOrderLifecycles: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter paper order lifecycle history error"
    };
  }
}

export async function loadExecutionAdapterPaperRouteRunbooks(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterPaperRouteRunbookHistoryResult> {
  try {
    const response = await fetcher(
      buildExecutionAdapterPaperRouteRunbookHistoryUrl(baseUrl, { adapterId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterPaperRouteRunbookHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter paper route runbook history contract");
    }
    return {
      adapterPaperRouteRunbooks: payload.adapterPaperRouteRunbooks,
      source: "core"
    };
  } catch (error) {
    return {
      adapterPaperRouteRunbooks: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter paper route runbook history error"
    };
  }
}

export async function loadExecutionAdapterOpsStates(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterOpsStateHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterOpsStateHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterOpsStateHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter ops state history contract");
    }
    return {
      adapterOpsStates: payload.adapterOpsStates,
      source: "core"
    };
  } catch (error) {
    return {
      adapterOpsStates: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter ops state history error"
    };
  }
}

export async function loadExecutionAdapterPaperExecutions(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterPaperExecutionHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterPaperExecutionHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterPaperExecutionHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter paper execution history contract");
    }
    return {
      adapterPaperExecutions: payload.adapterPaperExecutions,
      source: "core"
    };
  } catch (error) {
    return {
      adapterPaperExecutions: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter paper execution history error"
    };
  }
}

function isExecutionAdapterSandboxOrderSchemaDryRunRecordPayload(
  value: unknown
): value is {
  adapterSandboxOrderSchemaDryRun: ExecutionAdapterSandboxOrderSchemaDryRunResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxOrderSchemaDryRun?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterSandboxOrderSchemaDryRunResult(payload.adapterSandboxOrderSchemaDryRun) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterPaperOrderLifecycleRecordPayload(
  value: unknown
): value is {
  adapterPaperOrderLifecycle: ExecutionAdapterPaperOrderLifecycleResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterPaperOrderLifecycle?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterPaperOrderLifecycleResult(payload.adapterPaperOrderLifecycle) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterPaperRouteRunbookRecordPayload(
  value: unknown
): value is {
  adapterPaperRouteRunbook: ExecutionAdapterPaperRouteRunbookResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterPaperRouteRunbook?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterPaperRouteRunbookResult(payload.adapterPaperRouteRunbook) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterOpsStateRecordPayload(
  value: unknown
): value is {
  adapterOpsState: ExecutionAdapterOpsStateResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterOpsState?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterOpsStateResult(payload.adapterOpsState) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterPaperExecutionRecordPayload(
  value: unknown
): value is {
  adapterPaperExecution: ExecutionAdapterPaperExecutionResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterPaperExecution?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterPaperExecutionResult(payload.adapterPaperExecution) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterPaperExecutionDuplicatePayload(
  value: unknown
): value is {
  error: "execution_adapter_paper_execution_already_recorded";
  existingAdapterPaperExecution: ExecutionAdapterPaperExecutionResult;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    error?: unknown;
    existingAdapterPaperExecution?: unknown;
  };
  return (
    payload.error === "execution_adapter_paper_execution_already_recorded" &&
    isExecutionAdapterPaperExecutionResult(payload.existingAdapterPaperExecution)
  );
}

function isExecutionAdapterSandboxOrderSchemaDryRunHistoryPayload(
  value: unknown
): value is { adapterSandboxOrderSchemaDryRuns: ExecutionAdapterSandboxOrderSchemaDryRunResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxOrderSchemaDryRuns?: unknown };
  return (
    Array.isArray(payload.adapterSandboxOrderSchemaDryRuns) &&
    payload.adapterSandboxOrderSchemaDryRuns.every(isExecutionAdapterSandboxOrderSchemaDryRunResult)
  );
}

function isExecutionAdapterPaperOrderLifecycleHistoryPayload(
  value: unknown
): value is { adapterPaperOrderLifecycles: ExecutionAdapterPaperOrderLifecycleResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterPaperOrderLifecycles?: unknown };
  return (
    Array.isArray(payload.adapterPaperOrderLifecycles) &&
    payload.adapterPaperOrderLifecycles.every(isExecutionAdapterPaperOrderLifecycleResult)
  );
}

function isExecutionAdapterPaperRouteRunbookHistoryPayload(
  value: unknown
): value is { adapterPaperRouteRunbooks: ExecutionAdapterPaperRouteRunbookResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterPaperRouteRunbooks?: unknown };
  return (
    Array.isArray(payload.adapterPaperRouteRunbooks) &&
    payload.adapterPaperRouteRunbooks.every(isExecutionAdapterPaperRouteRunbookResult)
  );
}

function isExecutionAdapterOpsStateHistoryPayload(
  value: unknown
): value is { adapterOpsStates: ExecutionAdapterOpsStateResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterOpsStates?: unknown };
  return Array.isArray(payload.adapterOpsStates) && payload.adapterOpsStates.every(isExecutionAdapterOpsStateResult);
}

function isExecutionAdapterPaperExecutionHistoryPayload(
  value: unknown
): value is { adapterPaperExecutions: ExecutionAdapterPaperExecutionResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterPaperExecutions?: unknown };
  return (
    Array.isArray(payload.adapterPaperExecutions) &&
    payload.adapterPaperExecutions.every(isExecutionAdapterPaperExecutionResult)
  );
}

function isExecutionAdapterSandboxOrderSchemaDryRunResult(
  value: unknown
): value is ExecutionAdapterSandboxOrderSchemaDryRunResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSandboxOrderSchemaDryRunResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.sandboxOrderSchemaDryRunId === "string" &&
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
    isExecutionAdapterSandboxOrderSchemaDryRunStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.dryRunMode === "string" &&
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
    isExecutionAdapterSandboxOrderIntent(result.orderIntent) &&
    typeof result.orderSubmitted === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterSandboxOrderSchemaDryRunConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterPaperOrderLifecycleResult(value: unknown): value is ExecutionAdapterPaperOrderLifecycleResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterPaperOrderLifecycleResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.paperOrderLifecycleId === "string" &&
    typeof result.sandboxOrderSchemaDryRunId === "string" &&
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
    isExecutionAdapterPaperOrderLifecycleStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.lifecycleMode === "string" &&
    typeof result.dryRunMode === "string" &&
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
    isExecutionAdapterSandboxOrderIntent(result.orderIntent) &&
    Array.isArray(result.lifecycleSteps) &&
    result.lifecycleSteps.every(isExecutionAdapterPaperOrderLifecycleStep) &&
    typeof result.orderSubmitted === "boolean" &&
    typeof result.liveOrderSubmitted === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterPaperOrderLifecycleConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterPaperRouteRunbookResult(value: unknown): value is ExecutionAdapterPaperRouteRunbookResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterPaperRouteRunbookResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.paperRouteRunbookId === "string" &&
    typeof result.paperOrderLifecycleId === "string" &&
    typeof result.sandboxOrderSchemaDryRunId === "string" &&
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
    isExecutionAdapterPaperRouteRunbookStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.runbookMode === "string" &&
    typeof result.lifecycleMode === "string" &&
    typeof result.dryRunMode === "string" &&
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
    isExecutionAdapterSandboxOrderIntent(result.orderIntent) &&
    Array.isArray(result.lifecycleSteps) &&
    result.lifecycleSteps.every(isExecutionAdapterPaperOrderLifecycleStep) &&
    Array.isArray(result.runbookSteps) &&
    result.runbookSteps.every(isExecutionAdapterPaperRouteRunbookStep) &&
    typeof result.orderSubmitted === "boolean" &&
    typeof result.liveOrderSubmitted === "boolean" &&
    typeof result.routeExecuted === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterPaperRouteRunbookConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterOpsStateResult(value: unknown): value is ExecutionAdapterOpsStateResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterOpsStateResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.adapterOpsStateId === "string" &&
    typeof result.paperRouteRunbookId === "string" &&
    typeof result.paperOrderLifecycleId === "string" &&
    typeof result.sandboxOrderSchemaDryRunId === "string" &&
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
    isExecutionAdapterOpsStateStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.opsMode === "string" &&
    typeof result.runbookMode === "string" &&
    typeof result.lifecycleMode === "string" &&
    typeof result.dryRunMode === "string" &&
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
    isExecutionAdapterSandboxOrderIntent(result.orderIntent) &&
    Array.isArray(result.lifecycleSteps) &&
    result.lifecycleSteps.every(isExecutionAdapterPaperOrderLifecycleStep) &&
    Array.isArray(result.runbookSteps) &&
    result.runbookSteps.every(isExecutionAdapterPaperRouteRunbookStep) &&
    Array.isArray(result.opsSteps) &&
    result.opsSteps.every(isExecutionAdapterOpsStateStep) &&
    typeof result.orderSubmitted === "boolean" &&
    typeof result.liveOrderSubmitted === "boolean" &&
    typeof result.routeExecuted === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterOpsStateConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterPaperExecutionResult(value: unknown): value is ExecutionAdapterPaperExecutionResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterPaperExecutionResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.adapterPaperExecutionId === "string" &&
    typeof result.adapterOpsStateId === "string" &&
    typeof result.paperRouteRunbookId === "string" &&
    typeof result.paperOrderLifecycleId === "string" &&
    typeof result.sandboxOrderSchemaDryRunId === "string" &&
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
    isExecutionAdapterPaperExecutionStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.paperExecutionMode === "string" &&
    typeof result.opsMode === "string" &&
    typeof result.runbookMode === "string" &&
    typeof result.lifecycleMode === "string" &&
    typeof result.dryRunMode === "string" &&
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
    isExecutionAdapterSandboxOrderIntent(result.orderIntent) &&
    Array.isArray(result.lifecycleSteps) &&
    result.lifecycleSteps.every(isExecutionAdapterPaperOrderLifecycleStep) &&
    Array.isArray(result.runbookSteps) &&
    result.runbookSteps.every(isExecutionAdapterPaperRouteRunbookStep) &&
    Array.isArray(result.opsSteps) &&
    result.opsSteps.every(isExecutionAdapterOpsStateStep) &&
    Array.isArray(result.paperExecutionSteps) &&
    result.paperExecutionSteps.every(isExecutionAdapterPaperExecutionStep) &&
    isExecutionAdapterPaperExecutionFill(result.simulatedFill) &&
    typeof result.paperFillRecorded === "boolean" &&
    typeof result.orderSubmitted === "boolean" &&
    typeof result.liveOrderSubmitted === "boolean" &&
    typeof result.routeExecuted === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterPaperExecutionConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSandboxOrderIntent(value: unknown): value is ExecutionAdapterSandboxOrderIntent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const orderIntent = value as Partial<ExecutionAdapterSandboxOrderIntent>;
  return (
    typeof orderIntent.symbol === "string" &&
    (orderIntent.side === "buy" || orderIntent.side === "sell") &&
    typeof orderIntent.type === "string" &&
    typeof orderIntent.quantity === "number" &&
    Number.isFinite(orderIntent.quantity) &&
    orderIntent.quantity > 0 &&
    (orderIntent.price === undefined ||
      (typeof orderIntent.price === "number" && Number.isFinite(orderIntent.price) && orderIntent.price > 0)) &&
    (orderIntent.timeInForce === undefined || typeof orderIntent.timeInForce === "string")
  );
}

function isExecutionAdapterSandboxOrderSchemaDryRunConfirmation(
  value: unknown
): value is ExecutionAdapterSandboxOrderSchemaDryRunConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterSandboxOrderSchemaDryRunConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterPaperOrderLifecycleConfirmation(
  value: unknown
): value is ExecutionAdapterPaperOrderLifecycleConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterPaperOrderLifecycleConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    isExecutionAdapterPaperOrderLifecycleConfirmationStatus(confirmation.status)
  );
}

function isExecutionAdapterPaperOrderLifecycleStep(value: unknown): value is ExecutionAdapterPaperOrderLifecycleStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<ExecutionAdapterPaperOrderLifecycleStep>;
  return (
    typeof step.id === "string" &&
    typeof step.label === "string" &&
    isExecutionAdapterPaperOrderLifecycleStepStatus(step.status)
  );
}

function isExecutionAdapterPaperRouteRunbookConfirmation(
  value: unknown
): value is ExecutionAdapterPaperRouteRunbookConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterPaperRouteRunbookConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    isExecutionAdapterPaperRouteRunbookConfirmationStatus(confirmation.status)
  );
}

function isExecutionAdapterPaperRouteRunbookStep(value: unknown): value is ExecutionAdapterPaperRouteRunbookStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<ExecutionAdapterPaperRouteRunbookStep>;
  return (
    typeof step.id === "string" &&
    typeof step.label === "string" &&
    isExecutionAdapterPaperRouteRunbookStepStatus(step.status)
  );
}

function isExecutionAdapterOpsStateConfirmation(value: unknown): value is ExecutionAdapterOpsStateConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterOpsStateConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    isExecutionAdapterOpsStateConfirmationStatus(confirmation.status)
  );
}

function isExecutionAdapterOpsStateStep(value: unknown): value is ExecutionAdapterOpsStateStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<ExecutionAdapterOpsStateStep>;
  return (
    typeof step.id === "string" &&
    typeof step.label === "string" &&
    isExecutionAdapterOpsStateStepStatus(step.status)
  );
}

function isExecutionAdapterPaperExecutionConfirmation(
  value: unknown
): value is ExecutionAdapterPaperExecutionConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterPaperExecutionConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    isExecutionAdapterPaperExecutionConfirmationStatus(confirmation.status)
  );
}

function isExecutionAdapterPaperExecutionStep(value: unknown): value is ExecutionAdapterPaperExecutionStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<ExecutionAdapterPaperExecutionStep>;
  return (
    typeof step.id === "string" &&
    typeof step.label === "string" &&
    isExecutionAdapterPaperExecutionStepStatus(step.status)
  );
}

function isExecutionAdapterPaperExecutionFill(value: unknown): value is ExecutionAdapterPaperExecutionFill {
  if (!value || typeof value !== "object") {
    return false;
  }
  const fill = value as Partial<ExecutionAdapterPaperExecutionFill>;
  return (
    typeof fill.fillId === "string" &&
    isExecutionAdapterPaperExecutionFillStatus(fill.status) &&
    typeof fill.symbol === "string" &&
    (fill.side === "buy" || fill.side === "sell") &&
    typeof fill.type === "string" &&
    typeof fill.quantity === "number" &&
    (fill.price === undefined || typeof fill.price === "number") &&
    (fill.timeInForce === undefined || typeof fill.timeInForce === "string") &&
    typeof fill.source === "string" &&
    typeof fill.orderSubmitted === "boolean" &&
    typeof fill.liveOrderSubmitted === "boolean" &&
    typeof fill.routeExecuted === "boolean"
  );
}

function isExecutionAdapterSandboxOrderSchemaDryRunStatus(
  value: unknown
): value is ExecutionAdapterSandboxOrderSchemaDryRunStatus {
  return value === "blocked" || value === "schema_dry_run_recorded";
}

function isExecutionAdapterPaperOrderLifecycleStatus(value: unknown): value is ExecutionAdapterPaperOrderLifecycleStatus {
  return value === "blocked" || value === "lifecycle_recorded";
}

function isExecutionAdapterPaperOrderLifecycleConfirmationStatus(
  value: unknown
): value is ExecutionAdapterPaperOrderLifecycleConfirmationStatus {
  return value === "confirmed" || value === "missing";
}

function isExecutionAdapterPaperOrderLifecycleStepStatus(
  value: unknown
): value is ExecutionAdapterPaperOrderLifecycleStepStatus {
  return value === "blocked" || value === "recorded";
}

function isExecutionAdapterPaperRouteRunbookStatus(value: unknown): value is ExecutionAdapterPaperRouteRunbookStatus {
  return value === "blocked" || value === "runbook_recorded";
}

function isExecutionAdapterPaperRouteRunbookConfirmationStatus(
  value: unknown
): value is ExecutionAdapterPaperRouteRunbookConfirmationStatus {
  return value === "confirmed" || value === "missing";
}

function isExecutionAdapterPaperRouteRunbookStepStatus(
  value: unknown
): value is ExecutionAdapterPaperRouteRunbookStepStatus {
  return value === "blocked" || value === "recorded";
}

function isExecutionAdapterOpsStateStatus(value: unknown): value is ExecutionAdapterOpsStateStatus {
  return value === "blocked" || value === "ops_state_recorded";
}

function isExecutionAdapterOpsStateConfirmationStatus(
  value: unknown
): value is ExecutionAdapterOpsStateConfirmationStatus {
  return value === "confirmed" || value === "missing";
}

function isExecutionAdapterOpsStateStepStatus(value: unknown): value is ExecutionAdapterOpsStateStepStatus {
  return value === "blocked" || value === "recorded";
}

function isExecutionAdapterPaperExecutionStatus(value: unknown): value is ExecutionAdapterPaperExecutionStatus {
  return value === "blocked" || value === "paper_execution_recorded";
}

function isExecutionAdapterPaperExecutionConfirmationStatus(
  value: unknown
): value is ExecutionAdapterPaperExecutionConfirmationStatus {
  return value === "confirmed" || value === "missing";
}

function isExecutionAdapterPaperExecutionStepStatus(
  value: unknown
): value is ExecutionAdapterPaperExecutionStepStatus {
  return value === "blocked" || value === "recorded";
}

function isExecutionAdapterPaperExecutionFillStatus(
  value: unknown
): value is ExecutionAdapterPaperExecutionFillStatus {
  return value === "blocked" || value === "filled";
}

export { isExecutionAdapterPaperExecutionResult };
