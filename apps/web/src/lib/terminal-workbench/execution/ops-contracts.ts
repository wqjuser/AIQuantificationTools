import type { TerminalWorkspace } from "../core/workspace-contracts";
import type { ExecutionAdapterCertificationRow, ExecutionAdapterLedgerRow, ExecutionAdapterRuntimeReloadAcceptanceRow, ExecutionAdapterSecretManifestValidationRow } from "./adapter-contracts";
import type { ExecutionAdapterHumanConfirmationRow, ExecutionAdapterOpsStateConfirmationStatus, ExecutionAdapterOpsStateStatus, ExecutionAdapterOpsStateStepStatus, ExecutionAdapterPaperOrderLifecycleRow, ExecutionAdapterPaperOrderLifecycleStepStatus, ExecutionAdapterPaperRouteRunbookStepStatus, ExecutionAdapterProductionRouteReviewRow, ExecutionAdapterSandboxOrderSchemaDryRunRow } from "./validation-contracts";
import type { PaperExecutionReplayGate } from "../portfolio/paper-contracts";
import type { Market, P2PreLiveAcceptanceSummary } from "../stage1/foundation-contracts";

export interface ExecutionAdapterOpsStateSnapshot {
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
  opsSteps: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterOpsStateStepStatus;
  }>;
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterOpsStateConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterOpsStateRow {
  id: string;
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
  timestamp: string;
  status: ExecutionAdapterOpsStateStatus;
  statusLabel: string;
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
  envVarSummary: string;
  orderIntentSummary: string;
  lifecycleStepSummary: string;
  runbookStepSummary: string;
  opsStepSummary: string;
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterPaperExecutionStatus = "blocked" | "paper_execution_recorded";

export type ExecutionAdapterPaperExecutionConfirmationStatus = "confirmed" | "missing";

export type ExecutionAdapterPaperExecutionStepStatus = "blocked" | "recorded";

export type ExecutionAdapterPaperExecutionFillStatus = "blocked" | "filled";

export interface ExecutionAdapterPaperExecutionSnapshot {
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
  opsSteps: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterOpsStateStepStatus;
  }>;
  paperExecutionSteps: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterPaperExecutionStepStatus;
  }>;
  simulatedFill: {
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
  };
  paperFillRecorded: boolean;
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterPaperExecutionConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterPaperExecutionRow {
  id: string;
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
  timestamp: string;
  status: ExecutionAdapterPaperExecutionStatus;
  statusLabel: string;
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
  envVarSummary: string;
  orderIntentSummary: string;
  simulatedSymbol: string;
  simulatedSide: "buy" | "sell";
  simulatedQuantity: number;
  lifecycleStepSummary: string;
  runbookStepSummary: string;
  opsStepSummary: string;
  paperExecutionStepSummary: string;
  fillSummary: string;
  paperFillRecorded: boolean;
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterChainHealthStatus = "empty" | "in_progress" | "blocked" | "paper_ready";

export type ExecutionAdapterChainHealthStageStatus = "missing" | "blocked" | "recorded" | "unsafe";

export type ExecutionAdapterChainHealthStageId =
  | "secret-reference"
  | "secret-materialization"
  | "secret-manifest-validation"
  | "environment-binding"
  | "runtime-reload-plan"
  | "runtime-reload-execution"
  | "runtime-reload-acceptance"
  | "orchestration-dry-run"
  | "orchestration-execution"
  | "human-confirmation"
  | "sandbox-probe-plan"
  | "sandbox-probe-execution"
  | "sandbox-probe-review"
  | "production-route-review"
  | "sandbox-order-schema-dry-run"
  | "paper-order-lifecycle"
  | "paper-route-runbook"
  | "ops-state"
  | "adapter-paper-execution";

export interface ExecutionAdapterChainHealthStage {
  id: ExecutionAdapterChainHealthStageId;
  label: string;
  status: ExecutionAdapterChainHealthStageStatus;
  evidenceId: string | null;
  auditEventId: string | null;
  timestamp: string | null;
  detail: string;
  blocker: string | null;
  tone: "positive" | "warning" | "risk";
}

export interface ExecutionAdapterChainHealthRollup {
  id: string;
  adapterId: string;
  adapterName: string;
  market: Market | "multi";
  route: "live";
  status: ExecutionAdapterChainHealthStatus;
  headline: string;
  detail: string;
  completedStageCount: number;
  totalStageCount: number;
  blockerStageId: ExecutionAdapterChainHealthStageId | null;
  blockerLabel: string | null;
  latestEvidenceId: string | null;
  latestEvidenceTimestamp: string | null;
  latestAuditEventId: string | null;
  manualRouteCandidate: boolean;
  orderSubmissionEnabled: false;
  liveTradingAllowed: false;
  stages: ExecutionAdapterChainHealthStage[];
  tone: "positive" | "warning" | "risk";
}

export type ExecutionAdapterHealthProbeStatus = "ready" | "review" | "blocked";

export type ExecutionAdapterHealthProbeCheckStatus = "passed" | "review" | "blocked" | "skipped";

export interface ExecutionAdapterHealthProbeSnapshot {
  schemaVersion: 1;
  probeId: string;
  adapterId: string;
  provider: "ccxt";
  exchangeId: string;
  mode: "sandbox";
  status: ExecutionAdapterHealthProbeStatus;
  generatedAt: string;
  checks: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterHealthProbeCheckStatus;
    detail: string;
    latencyMs: number | null;
  }>;
  capabilities: Record<string, boolean>;
  credentials: {
    apiKeyConfigured: boolean;
    apiKeySource: string | null;
    secretConfigured: boolean;
    secretSource: string | null;
    passwordConfigured: boolean;
    passwordSource: string | null;
  };
  marketCount: number;
  exchangeStatus: string | null;
  serverTimeMs: number | null;
  accountSyncState: string;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  productionRouteReviewId?: string;
  productionRouteReviewStatus?: "route_review_recorded";
  routeReview?: {
    productionRouteReviewId: string;
    status: "route_review_recorded";
    adapterId: string;
    market: string;
    route: "live";
    maintenanceWindowId: string;
    requiredEnvVars: string[];
    liveTradingAllowed: false;
    paperOnly: true;
  };
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  orderRoutingEnabled: boolean;
}

export interface ExecutionAdapterHealthProbeRow {
  id: string;
  adapterId: string;
  provider: "ccxt";
  exchangeId: string;
  mode: "sandbox";
  timestamp: string;
  status: ExecutionAdapterHealthProbeStatus;
  statusLabel: string;
  marketSummary: string;
  credentialSummary: string;
  accountSyncSummary: string;
  routeReviewSummary: string;
  checkSummary: string;
  blockerSummary: string;
  boundary: string;
  tone: "positive" | "warning" | "neutral" | "risk";
  checks: ExecutionAdapterHealthProbeSnapshot["checks"];
}

export type ExecutionAdapterCertificationApplyConfirmationKey =
  | "secretReferenceStored"
  | "controlledRestartWindowApproved"
  | "operatorReviewedCertification";

export type ExecutionAdapterCertificationApplyConfirmations = Record<
  ExecutionAdapterCertificationApplyConfirmationKey,
  boolean
>;

export interface ExecutionAdapterCertificationApplyConfirmationRow {
  id: string;
  key: ExecutionAdapterCertificationApplyConfirmationKey;
  label: string;
  detail: string;
  checked: boolean;
  tone: "positive" | "neutral";
}

export type PromotionReadinessStatus = "blocked" | "paper_pending" | "certification_pending" | "live_ready";

export interface PromotionQueueStage {
  id: "audited-run" | "risk-approval" | "paper-execution" | "adapter-certification" | "human-confirmation";
  label: string;
  value: string;
  detail: string;
  status: "passed" | "blocked" | "review";
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface PromotionReadiness {
  status: PromotionReadinessStatus;
  headline: string;
  summary: string;
  stages: PromotionQueueStage[];
}

export type PreLiveReadinessChecklistStatus =
  | "blocked"
  | "paper_pending"
  | "evidence_pending"
  | "operator_pending"
  | "manual_route_ready";

export type PreLiveReadinessChecklistItemId = PromotionQueueStage["id"] | "paper-execution-replay";

export interface PreLiveReadinessChecklistItem {
  id: PreLiveReadinessChecklistItemId;
  label: string;
  state: PromotionQueueStage["status"];
  tone: PromotionQueueStage["tone"];
  evidence: string;
  detail: string;
}

export interface PreLiveReadinessChecklist {
  status: PreLiveReadinessChecklistStatus;
  tone: "positive" | "warning" | "risk";
  headline: string;
  summary: string;
  passedCount: number;
  totalCount: number;
  blockingCount: number;
  nextActionId: PreLiveReadinessChecklistItemId | null;
  manualRouteCandidate: boolean;
  orderSubmissionEnabled: false;
  liveTradingAllowed: false;
  items: PreLiveReadinessChecklistItem[];
}

export interface PreLiveReadinessChecklistInput {
  paperExecutionReplayGate?: PaperExecutionReplayGate | null;
}

export type OperatorRunbookStatus = "blocked" | "review_pending" | "manual_review_ready";

export type OperatorRunbookTone = "positive" | "warning" | "risk";

export type OperatorRunbookSectionStatus = "passed" | "review" | "blocked";

export type OperatorRunbookSectionId =
  | "pre-live-checklist"
  | "paper-execution-replay"
  | "adapter-chain"
  | "p2-acceptance"
  | "safety-boundary";

export interface OperatorRunbookSection {
  id: OperatorRunbookSectionId;
  label: string;
  status: OperatorRunbookSectionStatus;
  evidence: string;
  detail: string;
  nextAction: string;
  tone: OperatorRunbookTone;
}

export interface OperatorRunbookControls {
  killSwitch: string;
  rollbackOwner: string;
  positionLimit: string;
  dataFreshness: string;
  auditPackage: string;
  environmentState: string;
}

export interface OperatorRunbookSummary {
  status: OperatorRunbookStatus;
  tone: OperatorRunbookTone;
  headline: string;
  summary: string;
  contextLabel: string;
  adapterId: string;
  completedSections: number;
  totalSections: number;
  nextActionId: OperatorRunbookSectionId | null;
  nextAction: string;
  controls: OperatorRunbookControls;
  sections: OperatorRunbookSection[];
  orderSubmissionEnabled: false;
  liveTradingAllowed: false;
  liveOrderSubmitted: false;
  routeExecuted: false;
}

export interface OperatorRunbookInput {
  adapterChainHealthRollups?: ExecutionAdapterChainHealthRollup[] | null;
  killSwitch?: string | null;
  maxPositionPct?: number | null;
  p2PreLiveAcceptance: P2PreLiveAcceptanceSummary;
  paperExecutionReplayGate: PaperExecutionReplayGate;
  preLiveChecklist: PreLiveReadinessChecklist;
  rollbackOwner?: string | null;
  workspace: TerminalWorkspace;
}

export type ExecutionAdapterPreLiveRunbookStatus = "blocked" | "in_progress" | "paper_rehearsal_ready";

export type ExecutionAdapterPreLiveRunbookStepStatus = "passed" | "review" | "blocked";

export type ExecutionAdapterPreLiveRunbookStepId =
  | "adapter-state"
  | "adapter-certification"
  | "secret-manifest"
  | "runtime-acceptance"
  | "human-confirmation"
  | "route-review-health"
  | "paper-rehearsal";

export interface ExecutionAdapterPreLiveRunbookStep {
  id: ExecutionAdapterPreLiveRunbookStepId;
  label: string;
  value: string;
  detail: string;
  evidenceId: string | null;
  evidenceTimestamp: string | null;
  nextStep: string;
  status: ExecutionAdapterPreLiveRunbookStepStatus;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface ExecutionAdapterPreLiveRunbookSummary {
  adapterId: string;
  boundary: string;
  completedSteps: number;
  headline: string;
  market: Market;
  nextStep: string;
  nextStepId: ExecutionAdapterPreLiveRunbookStepId | null;
  rows: ExecutionAdapterPreLiveRunbookStep[];
  status: ExecutionAdapterPreLiveRunbookStatus;
  summary: string;
  totalSteps: number;
}

export type ExecutionAdapterPreLiveRunbookInputRow<T> = T;

export type ExecutionAdapterPreLiveLedgerInputRow = ExecutionAdapterPreLiveRunbookInputRow<
  Pick<
    ExecutionAdapterLedgerRow,
    | "adapterId"
    | "gateSummary"
    | "id"
    | "label"
    | "liveTradingAllowed"
    | "market"
    | "reason"
    | "route"
    | "state"
    | "timestamp"
  >
>;

export type ExecutionAdapterPreLiveCertificationInputRow = ExecutionAdapterPreLiveRunbookInputRow<
  Pick<
    ExecutionAdapterCertificationRow,
    | "adapterId"
    | "auditEventId"
    | "boundary"
    | "checkSummary"
    | "id"
    | "market"
    | "route"
    | "status"
    | "statusLabel"
    | "timestamp"
  >
>;

export type ExecutionAdapterPreLiveSecretManifestInputRow = ExecutionAdapterPreLiveRunbookInputRow<
  Pick<
    ExecutionAdapterSecretManifestValidationRow,
    | "adapterId"
    | "auditEventId"
    | "boundary"
    | "envCoverageSummary"
    | "id"
    | "market"
    | "route"
    | "status"
    | "statusLabel"
    | "timestamp"
  >
>;

export type ExecutionAdapterPreLiveRuntimeAcceptanceInputRow = ExecutionAdapterPreLiveRunbookInputRow<
  Pick<
    ExecutionAdapterRuntimeReloadAcceptanceRow,
    | "adapterId"
    | "auditEventId"
    | "boundary"
    | "confirmationSummary"
    | "id"
    | "market"
    | "route"
    | "status"
    | "statusLabel"
    | "timestamp"
  >
>;

export type ExecutionAdapterPreLiveHumanConfirmationInputRow = ExecutionAdapterPreLiveRunbookInputRow<
  Pick<
    ExecutionAdapterHumanConfirmationRow,
    | "adapterId"
    | "auditEventId"
    | "boundary"
    | "confirmationSummary"
    | "id"
    | "market"
    | "route"
    | "status"
    | "statusLabel"
    | "timestamp"
  >
>;

export type ExecutionAdapterPreLiveProductionRouteReviewInputRow = ExecutionAdapterPreLiveRunbookInputRow<
  Pick<
    ExecutionAdapterProductionRouteReviewRow,
    | "adapterId"
    | "auditEventId"
    | "boundary"
    | "confirmationSummary"
    | "id"
    | "market"
    | "route"
    | "status"
    | "statusLabel"
    | "timestamp"
  >
>;

export type ExecutionAdapterPreLiveHealthProbeInputRow = ExecutionAdapterPreLiveRunbookInputRow<
  Pick<
    ExecutionAdapterHealthProbeRow,
    | "adapterId"
    | "boundary"
    | "checkSummary"
    | "id"
    | "status"
    | "statusLabel"
    | "timestamp"
  >
>;

export type ExecutionAdapterPreLiveSandboxOrderSchemaDryRunInputRow = ExecutionAdapterPreLiveRunbookInputRow<
  Pick<
    ExecutionAdapterSandboxOrderSchemaDryRunRow,
    | "adapterId"
    | "auditEventId"
    | "boundary"
    | "id"
    | "market"
    | "orderSubmitted"
    | "orderIntentSummary"
    | "route"
    | "status"
    | "statusLabel"
    | "timestamp"
  >
>;

export type ExecutionAdapterPreLivePaperOrderLifecycleInputRow = ExecutionAdapterPreLiveRunbookInputRow<
  Pick<
    ExecutionAdapterPaperOrderLifecycleRow,
    | "adapterId"
    | "auditEventId"
    | "boundary"
    | "id"
    | "lifecycleStepSummary"
    | "liveOrderSubmitted"
    | "market"
    | "route"
    | "status"
    | "statusLabel"
    | "timestamp"
  >
>;
