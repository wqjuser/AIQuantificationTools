import type { TerminalWorkspace } from "../core/workspace-contracts";
import { backtestAssumptionSpecs } from "../core/workspace-contracts";
import type { ExecutionAdapterControlledRestartEvidenceSnapshot, ExecutionAdapterControlledRestartEvidenceStatus, ExecutionAdapterEnvironmentBindingSnapshot, ExecutionAdapterEnvironmentBindingStatus, ExecutionAdapterHumanConfirmationSnapshot, ExecutionAdapterHumanConfirmationStatus, ExecutionAdapterOrchestrationDryRunSnapshot, ExecutionAdapterOrchestrationDryRunStatus, ExecutionAdapterOrchestrationExecutionSnapshot, ExecutionAdapterOrchestrationExecutionStatus, ExecutionAdapterRestartAcceptanceSnapshot, ExecutionAdapterRestartAcceptanceStatus, ExecutionAdapterRuntimeReloadAcceptanceSnapshot, ExecutionAdapterRuntimeReloadAcceptanceStatus, ExecutionAdapterRuntimeReloadExecutionSnapshot, ExecutionAdapterRuntimeReloadExecutionStatus, ExecutionAdapterRuntimeReloadPlanSnapshot, ExecutionAdapterRuntimeReloadPlanStatus, ExecutionAdapterSecretManifestValidationStatus, ExecutionAdapterSecretMaterializationSnapshot, ExecutionAdapterSecretMaterializationStatus, ExecutionAdapterSecretReferenceSnapshot, ExecutionAdapterSecretReferenceStatus } from "../execution/adapter-contracts";
import type { ExecutionAdapterHealthProbeSnapshot, ExecutionAdapterHealthProbeStatus, ExecutionAdapterOpsStateSnapshot, ExecutionAdapterPaperExecutionSnapshot, ExecutionAdapterPaperExecutionStatus } from "../execution/ops-contracts";
import type { ExecutionAdapterOpsStateStatus, ExecutionAdapterPaperOrderLifecycleSnapshot, ExecutionAdapterPaperOrderLifecycleStatus, ExecutionAdapterPaperRouteRunbookSnapshot, ExecutionAdapterPaperRouteRunbookStatus, ExecutionAdapterProductionRouteReviewSnapshot, ExecutionAdapterProductionRouteReviewStatus, ExecutionAdapterSandboxOrderSchemaDryRunSnapshot, ExecutionAdapterSandboxOrderSchemaDryRunStatus, ExecutionAdapterSandboxProbeExecutionSnapshot, ExecutionAdapterSandboxProbeExecutionStatus, ExecutionAdapterSandboxProbePlanSnapshot, ExecutionAdapterSandboxProbePlanStatus, ExecutionAdapterSandboxProbeReviewSnapshot, ExecutionAdapterSandboxProbeReviewStatus } from "../execution/validation-contracts";
import type { BacktestAssumptionField } from "../stage1/review-contracts";

export function executionAdapterCertificationApplyBlockerSummary(blockedReasons: string[]): string {
  if (!blockedReasons.length) {
    return "No blockers";
  }
  return blockedReasons.length === 1 ? "1 blocker" : `${blockedReasons.length} blockers`;
}

export function executionAdapterControlledRestartEvidenceTone(
  status: ExecutionAdapterControlledRestartEvidenceStatus
): "positive" | "warning" | "neutral" | "risk" {
  if (status === "evidence_recorded") {
    return "positive";
  }
  return "risk";
}

export function executionAdapterControlledRestartEvidenceStatusLabel(
  status: ExecutionAdapterControlledRestartEvidenceStatus
): string {
  return (
    {
      blocked: "Blocked",
      evidence_recorded: "Evidence recorded"
    } satisfies Record<ExecutionAdapterControlledRestartEvidenceStatus, string>
  )[status];
}

export function executionAdapterControlledRestartEvidenceConfirmationSummary(
  confirmations: ExecutionAdapterControlledRestartEvidenceSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterControlledRestartEvidenceBlockerSummary(blockedReasons: string[]): string {
  if (!blockedReasons.length) {
    return "No blockers";
  }
  return blockedReasons.length === 1 ? "1 blocker" : `${blockedReasons.length} blockers`;
}

export function executionAdapterRestartAcceptanceTone(
  status: ExecutionAdapterRestartAcceptanceStatus
): "positive" | "warning" | "neutral" | "risk" {
  if (status === "acceptance_recorded") {
    return "positive";
  }
  return "risk";
}

export function executionAdapterRestartAcceptanceStatusLabel(status: ExecutionAdapterRestartAcceptanceStatus): string {
  return (
    {
      blocked: "Blocked",
      acceptance_recorded: "Acceptance recorded"
    } satisfies Record<ExecutionAdapterRestartAcceptanceStatus, string>
  )[status];
}

export function executionAdapterRestartAcceptanceConfirmationSummary(
  confirmations: ExecutionAdapterRestartAcceptanceSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterRestartAcceptanceBlockerSummary(blockedReasons: string[]): string {
  if (!blockedReasons.length) {
    return "No blockers";
  }
  return blockedReasons.length === 1 ? "1 blocker" : `${blockedReasons.length} blockers`;
}

export function executionAdapterSecretReferenceTone(
  status: ExecutionAdapterSecretReferenceStatus
): "positive" | "warning" | "neutral" | "risk" {
  if (status === "reference_recorded") {
    return "positive";
  }
  return "risk";
}

export function executionAdapterSecretReferenceStatusLabel(status: ExecutionAdapterSecretReferenceStatus): string {
  return (
    {
      blocked: "Blocked",
      reference_recorded: "Reference recorded"
    } satisfies Record<ExecutionAdapterSecretReferenceStatus, string>
  )[status];
}

export function executionAdapterSecretReferenceEnvVarSummary(requiredEnvVars: string[]): string {
  if (!requiredEnvVars.length) {
    return "No env vars";
  }
  return requiredEnvVars.length === 1 ? "1 env var" : `${requiredEnvVars.length} env vars`;
}

export function executionAdapterSecretReferenceConfirmationSummary(
  confirmations: ExecutionAdapterSecretReferenceSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterSecretReferenceBlockerSummary(blockedReasons: string[]): string {
  if (!blockedReasons.length) {
    return "No blockers";
  }
  return blockedReasons.length === 1 ? "1 blocker" : `${blockedReasons.length} blockers`;
}

export function executionAdapterSecretMaterializationTone(
  status: ExecutionAdapterSecretMaterializationStatus
): "positive" | "warning" | "neutral" | "risk" {
  if (status === "manifest_recorded") {
    return "positive";
  }
  return "risk";
}

export function executionAdapterSecretMaterializationStatusLabel(
  status: ExecutionAdapterSecretMaterializationStatus
): string {
  return (
    {
      blocked: "Blocked",
      manifest_recorded: "Manifest recorded"
    } satisfies Record<ExecutionAdapterSecretMaterializationStatus, string>
  )[status];
}

export function executionAdapterSecretMaterializationConfirmationSummary(
  confirmations: ExecutionAdapterSecretMaterializationSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterSecretManifestValidationTone(
  status: ExecutionAdapterSecretManifestValidationStatus
): "positive" | "warning" | "neutral" | "risk" {
  return status === "validated" ? "positive" : "risk";
}

export function executionAdapterSecretManifestValidationStatusLabel(
  status: ExecutionAdapterSecretManifestValidationStatus
): string {
  return (
    {
      blocked: "Blocked",
      validated: "Validated"
    } satisfies Record<ExecutionAdapterSecretManifestValidationStatus, string>
  )[status];
}

export function executionAdapterSecretManifestValidationCoverageSummary(
  requiredEnvVars: string[],
  coveredEnvVars: string[]
): string {
  if (!requiredEnvVars.length) {
    return "No env vars";
  }
  const covered = requiredEnvVars.filter((name) => coveredEnvVars.includes(name)).length;
  return `${covered}/${requiredEnvVars.length} env vars covered`;
}

export function executionAdapterEnvironmentBindingTone(
  status: ExecutionAdapterEnvironmentBindingStatus
): "positive" | "warning" | "neutral" | "risk" {
  return status === "binding_recorded" ? "positive" : "risk";
}

export function executionAdapterEnvironmentBindingStatusLabel(status: ExecutionAdapterEnvironmentBindingStatus): string {
  return (
    {
      binding_recorded: "Binding recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterEnvironmentBindingStatus, string>
  )[status];
}

export function executionAdapterEnvironmentBindingConfirmationSummary(
  confirmations: ExecutionAdapterEnvironmentBindingSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterRuntimeReloadPlanTone(
  status: ExecutionAdapterRuntimeReloadPlanStatus
): "positive" | "warning" | "neutral" | "risk" {
  return status === "plan_recorded" ? "positive" : "risk";
}

export function executionAdapterRuntimeReloadPlanStatusLabel(status: ExecutionAdapterRuntimeReloadPlanStatus): string {
  return (
    {
      plan_recorded: "Plan recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterRuntimeReloadPlanStatus, string>
  )[status];
}

export function executionAdapterRuntimeReloadPlanConfirmationSummary(
  confirmations: ExecutionAdapterRuntimeReloadPlanSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterRuntimeReloadExecutionTone(
  status: ExecutionAdapterRuntimeReloadExecutionStatus
): "positive" | "warning" | "neutral" | "risk" {
  return status === "execution_recorded" ? "positive" : "risk";
}

export function executionAdapterRuntimeReloadExecutionStatusLabel(
  status: ExecutionAdapterRuntimeReloadExecutionStatus
): string {
  return (
    {
      execution_recorded: "Execution recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterRuntimeReloadExecutionStatus, string>
  )[status];
}

export function executionAdapterRuntimeReloadExecutionConfirmationSummary(
  confirmations: ExecutionAdapterRuntimeReloadExecutionSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterRuntimeReloadAcceptanceTone(
  status: ExecutionAdapterRuntimeReloadAcceptanceStatus
): "positive" | "warning" | "neutral" | "risk" {
  return status === "acceptance_recorded" ? "positive" : "risk";
}

export function executionAdapterRuntimeReloadAcceptanceStatusLabel(
  status: ExecutionAdapterRuntimeReloadAcceptanceStatus
): string {
  return (
    {
      acceptance_recorded: "Acceptance recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterRuntimeReloadAcceptanceStatus, string>
  )[status];
}

export function executionAdapterRuntimeReloadAcceptanceConfirmationSummary(
  confirmations: ExecutionAdapterRuntimeReloadAcceptanceSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterOrchestrationDryRunTone(
  status: ExecutionAdapterOrchestrationDryRunStatus
): "positive" | "warning" | "neutral" | "risk" {
  return status === "dry_run_recorded" ? "positive" : "risk";
}

export function executionAdapterOrchestrationDryRunStatusLabel(
  status: ExecutionAdapterOrchestrationDryRunStatus
): string {
  return (
    {
      dry_run_recorded: "Dry run recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterOrchestrationDryRunStatus, string>
  )[status];
}

export function executionAdapterOrchestrationDryRunConfirmationSummary(
  confirmations: ExecutionAdapterOrchestrationDryRunSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterOrchestrationExecutionTone(
  status: ExecutionAdapterOrchestrationExecutionStatus
): "positive" | "warning" | "neutral" | "risk" {
  return status === "execution_recorded" ? "positive" : "risk";
}

export function executionAdapterOrchestrationExecutionStatusLabel(
  status: ExecutionAdapterOrchestrationExecutionStatus
): string {
  return (
    {
      execution_recorded: "Execution recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterOrchestrationExecutionStatus, string>
  )[status];
}

export function executionAdapterOrchestrationExecutionConfirmationSummary(
  confirmations: ExecutionAdapterOrchestrationExecutionSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterHumanConfirmationTone(
  status: ExecutionAdapterHumanConfirmationStatus
): "positive" | "warning" | "neutral" | "risk" {
  return status === "confirmation_recorded" ? "positive" : "risk";
}

export function executionAdapterHumanConfirmationStatusLabel(
  status: ExecutionAdapterHumanConfirmationStatus
): string {
  return (
    {
      confirmation_recorded: "Confirmation recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterHumanConfirmationStatus, string>
  )[status];
}

export function executionAdapterHumanConfirmationConfirmationSummary(
  confirmations: ExecutionAdapterHumanConfirmationSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterSandboxProbePlanTone(
  status: ExecutionAdapterSandboxProbePlanStatus
): "positive" | "warning" | "neutral" | "risk" {
  return status === "probe_plan_recorded" ? "positive" : "risk";
}

export function executionAdapterSandboxProbePlanStatusLabel(
  status: ExecutionAdapterSandboxProbePlanStatus
): string {
  return (
    {
      probe_plan_recorded: "Probe plan recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterSandboxProbePlanStatus, string>
  )[status];
}

export function executionAdapterSandboxProbePlanConfirmationSummary(
  confirmations: ExecutionAdapterSandboxProbePlanSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterSandboxProbeExecutionTone(
  status: ExecutionAdapterSandboxProbeExecutionStatus
): "positive" | "warning" | "neutral" | "risk" {
  return status === "probe_execution_recorded" ? "positive" : "risk";
}

export function executionAdapterSandboxProbeExecutionStatusLabel(
  status: ExecutionAdapterSandboxProbeExecutionStatus
): string {
  return (
    {
      probe_execution_recorded: "Probe execution recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterSandboxProbeExecutionStatus, string>
  )[status];
}

export function executionAdapterSandboxProbeExecutionConfirmationSummary(
  confirmations: ExecutionAdapterSandboxProbeExecutionSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterSandboxProbeHealthSummary(metadata: Record<string, unknown>): string {
  const evidence = metadata.authoritativeHealthProbe;
  if (!evidence || typeof evidence !== "object") {
    return "Authoritative health probe missing";
  }
  const payload = evidence as Record<string, unknown>;
  const status = typeof payload.status === "string" ? payload.status : "unknown";
  const exchangeId = typeof payload.exchangeId === "string" ? payload.exchangeId : "unknown";
  const probeId = typeof payload.probeId === "string" ? payload.probeId : "unknown";
  const evidenceHash = typeof payload.evidenceHash === "string" ? payload.evidenceHash : "";
  return `${status} · ${exchangeId} · ${probeId} · sha256 ${evidenceHash.slice(0, 12) || "missing"}`;
}

export function executionAdapterSandboxProbeAuthoritativeHealthReady(
  execution: ExecutionAdapterSandboxProbeExecutionSnapshot
): boolean {
  const confirmations = new Map(execution.requiredConfirmations.map((row) => [row.id, row.status]));
  return Boolean(
    execution.metadata.authoritativeHealthProbe &&
    confirmations.get("readonly-handshake-captured") === "confirmed" &&
    confirmations.get("account-snapshot-redacted") === "confirmed"
  );
}

export function executionAdapterSandboxProbeReviewTone(
  status: ExecutionAdapterSandboxProbeReviewStatus
): "positive" | "warning" | "neutral" | "risk" {
  return status === "probe_review_recorded" ? "positive" : "risk";
}

export function executionAdapterSandboxProbeReviewStatusLabel(
  status: ExecutionAdapterSandboxProbeReviewStatus
): string {
  return (
    {
      probe_review_recorded: "Probe review recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterSandboxProbeReviewStatus, string>
  )[status];
}

export function executionAdapterSandboxProbeReviewConfirmationSummary(
  confirmations: ExecutionAdapterSandboxProbeReviewSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterProductionRouteReviewTone(
  status: ExecutionAdapterProductionRouteReviewStatus
): "positive" | "warning" | "neutral" | "risk" {
  return status === "route_review_recorded" ? "positive" : "risk";
}

export function executionAdapterProductionRouteReviewStatusLabel(
  status: ExecutionAdapterProductionRouteReviewStatus
): string {
  return (
    {
      route_review_recorded: "Route review recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterProductionRouteReviewStatus, string>
  )[status];
}

export function executionAdapterProductionRouteReviewConfirmationSummary(
  confirmations: ExecutionAdapterProductionRouteReviewSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterSandboxOrderSchemaDryRunTone(
  status: ExecutionAdapterSandboxOrderSchemaDryRunStatus,
  orderSubmitted: boolean
): "positive" | "warning" | "neutral" | "risk" {
  if (orderSubmitted) {
    return "risk";
  }
  return status === "schema_dry_run_recorded" ? "positive" : "risk";
}

export function executionAdapterSandboxOrderSchemaDryRunStatusLabel(
  status: ExecutionAdapterSandboxOrderSchemaDryRunStatus
): string {
  return (
    {
      schema_dry_run_recorded: "Schema dry-run recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterSandboxOrderSchemaDryRunStatus, string>
  )[status];
}

export function executionAdapterSandboxOrderSchemaDryRunConfirmationSummary(
  confirmations: ExecutionAdapterSandboxOrderSchemaDryRunSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterPaperOrderLifecycleTone(
  status: ExecutionAdapterPaperOrderLifecycleStatus,
  liveOrderSubmitted: boolean
): "positive" | "warning" | "neutral" | "risk" {
  if (liveOrderSubmitted) {
    return "risk";
  }
  return status === "lifecycle_recorded" ? "positive" : "risk";
}

export function executionAdapterPaperOrderLifecycleStatusLabel(status: ExecutionAdapterPaperOrderLifecycleStatus): string {
  return (
    {
      lifecycle_recorded: "Lifecycle recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterPaperOrderLifecycleStatus, string>
  )[status];
}

export function executionAdapterPaperOrderLifecycleConfirmationSummary(
  confirmations: ExecutionAdapterPaperOrderLifecycleSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterPaperOrderLifecycleStepSummary(
  steps: ExecutionAdapterPaperOrderLifecycleSnapshot["lifecycleSteps"]
): string {
  const recorded = steps.filter((step) => step.status === "recorded").length;
  const blocked = steps.filter((step) => step.status === "blocked").length;
  return `${recorded} recorded / ${blocked} blocked`;
}

export function executionAdapterPaperRouteRunbookTone(
  status: ExecutionAdapterPaperRouteRunbookStatus,
  routeExecuted: boolean
): "positive" | "warning" | "neutral" | "risk" {
  if (routeExecuted) {
    return "risk";
  }
  return status === "runbook_recorded" ? "positive" : "risk";
}

export function executionAdapterPaperRouteRunbookStatusLabel(status: ExecutionAdapterPaperRouteRunbookStatus): string {
  return (
    {
      runbook_recorded: "Runbook recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterPaperRouteRunbookStatus, string>
  )[status];
}

export function executionAdapterPaperRouteRunbookConfirmationSummary(
  confirmations: ExecutionAdapterPaperRouteRunbookSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterPaperRouteRunbookStepSummary(
  steps: ExecutionAdapterPaperRouteRunbookSnapshot["runbookSteps"]
): string {
  const recorded = steps.filter((step) => step.status === "recorded").length;
  const blocked = steps.filter((step) => step.status === "blocked").length;
  return `${recorded} recorded / ${blocked} blocked`;
}

export function executionAdapterPaperRouteRunbookBoundary(row: ExecutionAdapterPaperRouteRunbookSnapshot): string {
  if (row.routeExecuted) {
    return "Route execution detected · blocked";
  }
  if (row.liveTradingAllowed) {
    return "Live trading allowed";
  }
  return row.paperOnly
    ? "Paper route runbook recorded · no route executed · live trading blocked"
    : "No route executed · live trading blocked";
}

export function executionAdapterOpsStateTone(row: ExecutionAdapterOpsStateSnapshot): "positive" | "warning" | "neutral" | "risk" {
  if (row.routeExecuted || row.liveTradingAllowed) {
    return "risk";
  }
  return row.status === "ops_state_recorded" ? "positive" : "risk";
}

export function executionAdapterOpsStateStatusLabel(status: ExecutionAdapterOpsStateStatus): string {
  return (
    {
      ops_state_recorded: "Ops state recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterOpsStateStatus, string>
  )[status];
}

export function executionAdapterOpsStateConfirmationSummary(
  confirmations: ExecutionAdapterOpsStateSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterOpsStateStepSummary(steps: ExecutionAdapterOpsStateSnapshot["opsSteps"]): string {
  const recorded = steps.filter((step) => step.status === "recorded").length;
  const blocked = steps.filter((step) => step.status === "blocked").length;
  return `${recorded} recorded / ${blocked} blocked`;
}

export function executionAdapterOpsStateBoundary(row: ExecutionAdapterOpsStateSnapshot): string {
  if (row.routeExecuted) {
    return "Route execution detected · blocked";
  }
  if (row.liveTradingAllowed) {
    return "Live trading allowed";
  }
  return row.paperOnly
    ? "Adapter ops state recorded · no route executed · live trading blocked"
    : "No route executed · live trading blocked";
}

export function executionAdapterPaperExecutionTone(
  row: ExecutionAdapterPaperExecutionSnapshot
): "positive" | "warning" | "neutral" | "risk" {
  if (row.orderSubmitted || row.liveOrderSubmitted || row.routeExecuted || row.liveTradingAllowed) {
    return "risk";
  }
  return row.status === "paper_execution_recorded" && row.paperFillRecorded ? "positive" : "risk";
}

export function executionAdapterPaperExecutionStatusLabel(status: ExecutionAdapterPaperExecutionStatus): string {
  return (
    {
      paper_execution_recorded: "Paper execution recorded",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterPaperExecutionStatus, string>
  )[status];
}

export function executionAdapterPaperExecutionConfirmationSummary(
  confirmations: ExecutionAdapterPaperExecutionSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

export function executionAdapterPaperExecutionStepSummary(
  steps: ExecutionAdapterPaperExecutionSnapshot["paperExecutionSteps"]
): string {
  const recorded = steps.filter((step) => step.status === "recorded").length;
  const blocked = steps.filter((step) => step.status === "blocked").length;
  return `${recorded} recorded / ${blocked} blocked`;
}

export function executionAdapterPaperExecutionFillSummary(
  fill: ExecutionAdapterPaperExecutionSnapshot["simulatedFill"]
): string {
  const quantity = formatExecutionAdapterOrderNumber(fill.quantity);
  const base = `${fill.status} ${fill.side} ${quantity} ${fill.symbol}`;
  return typeof fill.price === "number" ? `${base} @ ${formatExecutionAdapterOrderNumber(fill.price)}` : base;
}

export function executionAdapterPaperExecutionBoundary(row: ExecutionAdapterPaperExecutionSnapshot): string {
  if (row.orderSubmitted || row.liveOrderSubmitted || row.routeExecuted) {
    return "Route or order execution detected · blocked";
  }
  if (row.liveTradingAllowed) {
    return "Live trading allowed";
  }
  return row.paperOnly && row.paperFillRecorded
    ? "Paper execution recorded · simulated fill only · live route blocked"
    : "Simulated fill missing · live route blocked";
}

export function executionAdapterSandboxOrderIntentSummary(
  orderIntent: ExecutionAdapterSandboxOrderSchemaDryRunSnapshot["orderIntent"]
): string {
  const quantity = formatExecutionAdapterOrderNumber(orderIntent.quantity);
  const base = `${orderIntent.side} ${quantity} ${orderIntent.symbol} · ${orderIntent.type}`;
  return typeof orderIntent.price === "number" ? `${base} @ ${formatExecutionAdapterOrderNumber(orderIntent.price)}` : base;
}

export function formatExecutionAdapterOrderNumber(value: number): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 8
  });
}

export function executionAdapterHealthProbeTone(
  status: ExecutionAdapterHealthProbeStatus
): "positive" | "warning" | "neutral" | "risk" {
  if (status === "ready") {
    return "positive";
  }
  return status === "review" ? "warning" : "risk";
}

export function executionAdapterHealthProbeStatusLabel(status: ExecutionAdapterHealthProbeStatus): string {
  return (
    {
      ready: "Ready",
      review: "Review required",
      blocked: "Blocked"
    } satisfies Record<ExecutionAdapterHealthProbeStatus, string>
  )[status];
}

export function executionAdapterHealthProbeCredentialSummary(
  credentials: ExecutionAdapterHealthProbeSnapshot["credentials"]
): string {
  const apiKey = credentials.apiKeyConfigured ? `API key ${credentials.apiKeySource ?? "configured"}` : "API key missing";
  const secret = credentials.secretConfigured ? `secret ${credentials.secretSource ?? "configured"}` : "secret missing";
  return `${apiKey} · ${secret}`;
}

export function executionAdapterHealthProbeRouteReviewSummary(probe: ExecutionAdapterHealthProbeSnapshot): string {
  if (!probe.routeReview) {
    return "No production route review bound";
  }
  const envVarCount = probe.routeReview.requiredEnvVars.length;
  return `Route review · ${probe.routeReview.maintenanceWindowId} · ${envVarCount} env vars`;
}

export function executionAdapterHealthProbeCheckSummary(checks: ExecutionAdapterHealthProbeSnapshot["checks"]): string {
  const passed = checks.filter((check) => check.status === "passed").length;
  const review = checks.filter((check) => check.status === "review" || check.status === "skipped").length;
  const blocked = checks.filter((check) => check.status === "blocked").length;
  return `${passed} passed / ${review} review / ${blocked} blocked`;
}

export function formatAssumptionCurrency(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function normalizeBacktestAssumptionValue(
  field: BacktestAssumptionField,
  value: number | undefined,
  fallback: number
): number {
  const spec = backtestAssumptionSpecs[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(spec.min, Math.round(value));
}

export function inferExposureFromPosition(position: string): string {
  const cap = position.match(/(\d+(?:\.\d+)?)%\s*cap/i);
  return cap ? `${cap[1]}%` : "paper";
}

export function resolvePaperOrderPrice(workspace: TerminalWorkspace): number {
  const selectedPrice = workspace.selectedInstrument.price;
  if (selectedPrice !== undefined && selectedPrice !== null && Number.isFinite(selectedPrice) && selectedPrice > 0) {
    return selectedPrice;
  }
  return 1;
}
