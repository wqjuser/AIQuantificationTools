import type { ExecutionAdapterCertificationApplyRow, ExecutionAdapterCertificationApplySnapshot, ExecutionAdapterCertificationRow, ExecutionAdapterCertificationSnapshot, ExecutionAdapterControlledRestartEvidenceRow, ExecutionAdapterControlledRestartEvidenceSnapshot, ExecutionAdapterEnvironmentBindingRow, ExecutionAdapterEnvironmentBindingSnapshot, ExecutionAdapterHumanConfirmationSnapshot, ExecutionAdapterOrchestrationDryRunRow, ExecutionAdapterOrchestrationDryRunSnapshot, ExecutionAdapterOrchestrationExecutionRow, ExecutionAdapterOrchestrationExecutionSnapshot, ExecutionAdapterRestartAcceptanceRow, ExecutionAdapterRestartAcceptanceSnapshot, ExecutionAdapterRuntimeReloadAcceptanceRow, ExecutionAdapterRuntimeReloadAcceptanceSnapshot, ExecutionAdapterRuntimeReloadExecutionRow, ExecutionAdapterRuntimeReloadExecutionSnapshot, ExecutionAdapterRuntimeReloadPlanRow, ExecutionAdapterRuntimeReloadPlanSnapshot, ExecutionAdapterSecretManifestValidationRow, ExecutionAdapterSecretManifestValidationSnapshot, ExecutionAdapterSecretMaterializationRow, ExecutionAdapterSecretMaterializationSnapshot, ExecutionAdapterSecretReferenceRow, ExecutionAdapterSecretReferenceSnapshot } from "./adapter-contracts";
import type { ExecutionAdapterHumanConfirmationRow, ExecutionAdapterProductionRouteReviewRow, ExecutionAdapterProductionRouteReviewSnapshot, ExecutionAdapterSandboxOrderSchemaDryRunRow, ExecutionAdapterSandboxOrderSchemaDryRunSnapshot, ExecutionAdapterSandboxProbeExecutionRow, ExecutionAdapterSandboxProbeExecutionSnapshot, ExecutionAdapterSandboxProbePlanRow, ExecutionAdapterSandboxProbePlanSnapshot, ExecutionAdapterSandboxProbeReviewRow, ExecutionAdapterSandboxProbeReviewSnapshot } from "./validation-contracts";
import { executionAdapterCertificationApplyConfirmationSummary, executionAdapterCertificationApplyStatusLabel, executionAdapterCertificationApplyTone, executionAdapterCertificationCheckSummary, executionAdapterCertificationStatusLabel, executionAdapterCertificationTone } from "../strategy/backtest-builders";
import { executionAdapterCertificationApplyBlockerSummary, executionAdapterControlledRestartEvidenceBlockerSummary, executionAdapterControlledRestartEvidenceConfirmationSummary, executionAdapterControlledRestartEvidenceStatusLabel, executionAdapterControlledRestartEvidenceTone, executionAdapterEnvironmentBindingConfirmationSummary, executionAdapterEnvironmentBindingStatusLabel, executionAdapterEnvironmentBindingTone, executionAdapterHumanConfirmationConfirmationSummary, executionAdapterHumanConfirmationStatusLabel, executionAdapterHumanConfirmationTone, executionAdapterOrchestrationDryRunConfirmationSummary, executionAdapterOrchestrationDryRunStatusLabel, executionAdapterOrchestrationDryRunTone, executionAdapterOrchestrationExecutionConfirmationSummary, executionAdapterOrchestrationExecutionStatusLabel, executionAdapterOrchestrationExecutionTone, executionAdapterProductionRouteReviewConfirmationSummary, executionAdapterProductionRouteReviewStatusLabel, executionAdapterProductionRouteReviewTone, executionAdapterRestartAcceptanceBlockerSummary, executionAdapterRestartAcceptanceConfirmationSummary, executionAdapterRestartAcceptanceStatusLabel, executionAdapterRestartAcceptanceTone, executionAdapterRuntimeReloadAcceptanceConfirmationSummary, executionAdapterRuntimeReloadAcceptanceStatusLabel, executionAdapterRuntimeReloadAcceptanceTone, executionAdapterRuntimeReloadExecutionConfirmationSummary, executionAdapterRuntimeReloadExecutionStatusLabel, executionAdapterRuntimeReloadExecutionTone, executionAdapterRuntimeReloadPlanConfirmationSummary, executionAdapterRuntimeReloadPlanStatusLabel, executionAdapterRuntimeReloadPlanTone, executionAdapterSandboxOrderIntentSummary, executionAdapterSandboxOrderSchemaDryRunConfirmationSummary, executionAdapterSandboxOrderSchemaDryRunStatusLabel, executionAdapterSandboxOrderSchemaDryRunTone, executionAdapterSandboxProbeAuthoritativeHealthReady, executionAdapterSandboxProbeExecutionConfirmationSummary, executionAdapterSandboxProbeExecutionStatusLabel, executionAdapterSandboxProbeExecutionTone, executionAdapterSandboxProbeHealthSummary, executionAdapterSandboxProbePlanConfirmationSummary, executionAdapterSandboxProbePlanStatusLabel, executionAdapterSandboxProbePlanTone, executionAdapterSandboxProbeReviewConfirmationSummary, executionAdapterSandboxProbeReviewStatusLabel, executionAdapterSandboxProbeReviewTone, executionAdapterSecretManifestValidationCoverageSummary, executionAdapterSecretManifestValidationStatusLabel, executionAdapterSecretManifestValidationTone, executionAdapterSecretMaterializationConfirmationSummary, executionAdapterSecretMaterializationStatusLabel, executionAdapterSecretMaterializationTone, executionAdapterSecretReferenceBlockerSummary, executionAdapterSecretReferenceConfirmationSummary, executionAdapterSecretReferenceEnvVarSummary, executionAdapterSecretReferenceStatusLabel, executionAdapterSecretReferenceTone } from "../strategy/workflow-builders";

export function buildExecutionAdapterCertificationRows(
  certifications: ExecutionAdapterCertificationSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterCertificationRow[] {
  return (certifications ?? [])
    .map((certification) => ({
      id: certification.certificationId,
      adapterId: certification.adapterId,
      market: certification.market,
      route: certification.route,
      timestamp: certification.completedAt ?? certification.startedAt,
      status: certification.status,
      statusLabel: executionAdapterCertificationStatusLabel(certification.status),
      checkSummary: executionAdapterCertificationCheckSummary(certification.summary),
      auditEventId: certification.certificationId,
      boundary: certification.liveTradingAllowed
        ? "Live trading allowed"
        : certification.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      liveTradingAllowed: certification.liveTradingAllowed,
      tone: executionAdapterCertificationTone(certification.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterCertificationApplyRows(
  applies: ExecutionAdapterCertificationApplySnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterCertificationApplyRow[] {
  return (applies ?? [])
    .map((apply) => ({
      id: apply.applyId,
      certificationId: apply.certificationId,
      adapterId: apply.adapterId,
      market: apply.market,
      route: apply.route,
      timestamp: apply.generatedAt,
      status: apply.status,
      statusLabel: executionAdapterCertificationApplyStatusLabel(apply.status),
      applyMode: apply.applyMode,
      confirmationSummary: executionAdapterCertificationApplyConfirmationSummary(apply.requiredConfirmations),
      blockerSummary: executionAdapterCertificationApplyBlockerSummary(apply.blockedReasons),
      boundary: apply.liveTradingAllowed
        ? "Live trading allowed"
        : apply.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      restartRequired: apply.restartRequired,
      auditEventId: apply.applyId,
      tone: executionAdapterCertificationApplyTone(apply.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterControlledRestartEvidenceRows(
  evidence: ExecutionAdapterControlledRestartEvidenceSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterControlledRestartEvidenceRow[] {
  return (evidence ?? [])
    .map((row) => ({
      id: row.evidenceId,
      applyId: row.applyId,
      certificationId: row.certificationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterControlledRestartEvidenceStatusLabel(row.status),
      evidenceMode: row.evidenceMode,
      confirmationSummary: executionAdapterControlledRestartEvidenceConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterControlledRestartEvidenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      restartRequired: row.restartRequired,
      auditEventId: row.evidenceId,
      tone: executionAdapterControlledRestartEvidenceTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterRestartAcceptanceRows(
  acceptances: ExecutionAdapterRestartAcceptanceSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterRestartAcceptanceRow[] {
  return (acceptances ?? [])
    .map((row) => ({
      id: row.acceptanceId,
      evidenceId: row.evidenceId,
      applyId: row.applyId,
      certificationId: row.certificationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterRestartAcceptanceStatusLabel(row.status),
      acceptanceMode: row.acceptanceMode,
      confirmationSummary: executionAdapterRestartAcceptanceConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterRestartAcceptanceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      restartRequired: row.restartRequired,
      auditEventId: row.acceptanceId,
      tone: executionAdapterRestartAcceptanceTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterSecretReferenceRows(
  references: ExecutionAdapterSecretReferenceSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterSecretReferenceRow[] {
  return (references ?? [])
    .map((row) => ({
      id: row.referenceId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterSecretReferenceStatusLabel(row.status),
      referenceName: row.referenceName,
      backend: row.backend,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterSecretReferenceConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.referenceId,
      tone: executionAdapterSecretReferenceTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterSecretMaterializationRows(
  materializations: ExecutionAdapterSecretMaterializationSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterSecretMaterializationRow[] {
  return (materializations ?? [])
    .map((row) => ({
      id: row.materializationId,
      referenceId: row.referenceId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterSecretMaterializationStatusLabel(row.status),
      referenceName: row.referenceName,
      backend: row.backend,
      manifestPath: row.manifestPath,
      materializationMode: row.materializationMode,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterSecretMaterializationConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.materializationId,
      tone: executionAdapterSecretMaterializationTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterSecretManifestValidationRows(
  validations: ExecutionAdapterSecretManifestValidationSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterSecretManifestValidationRow[] {
  return (validations ?? [])
    .map((row) => ({
      id: row.validationId,
      materializationId: row.materializationId,
      referenceId: row.referenceId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterSecretManifestValidationStatusLabel(row.status),
      referenceName: row.referenceName,
      backend: row.backend,
      manifestPath: row.manifestPath,
      validationMode: row.validationMode,
      fingerprint: row.fingerprint,
      envCoverageSummary: executionAdapterSecretManifestValidationCoverageSummary(
        row.requiredEnvVars,
        row.coveredEnvVars
      ),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.validationId,
      tone: executionAdapterSecretManifestValidationTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterEnvironmentBindingRows(
  bindings: ExecutionAdapterEnvironmentBindingSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterEnvironmentBindingRow[] {
  return (bindings ?? [])
    .map((row) => ({
      id: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterEnvironmentBindingStatusLabel(row.status),
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterEnvironmentBindingConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.bindingId,
      tone: executionAdapterEnvironmentBindingTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterRuntimeReloadPlanRows(
  plans: ExecutionAdapterRuntimeReloadPlanSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterRuntimeReloadPlanRow[] {
  return (plans ?? [])
    .map((row) => ({
      id: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterRuntimeReloadPlanStatusLabel(row.status),
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterRuntimeReloadPlanConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.planId,
      tone: executionAdapterRuntimeReloadPlanTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterRuntimeReloadExecutionRows(
  executions: ExecutionAdapterRuntimeReloadExecutionSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterRuntimeReloadExecutionRow[] {
  return (executions ?? [])
    .map((row) => ({
      id: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterRuntimeReloadExecutionStatusLabel(row.status),
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterRuntimeReloadExecutionConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.executionId,
      tone: executionAdapterRuntimeReloadExecutionTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterRuntimeReloadAcceptanceRows(
  acceptances: ExecutionAdapterRuntimeReloadAcceptanceSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterRuntimeReloadAcceptanceRow[] {
  return (acceptances ?? [])
    .map((row) => ({
      id: row.acceptanceId,
      executionId: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterRuntimeReloadAcceptanceStatusLabel(row.status),
      acceptanceMode: row.acceptanceMode,
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterRuntimeReloadAcceptanceConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.acceptanceId,
      tone: executionAdapterRuntimeReloadAcceptanceTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterOrchestrationDryRunRows(
  dryRuns: ExecutionAdapterOrchestrationDryRunSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterOrchestrationDryRunRow[] {
  return (dryRuns ?? [])
    .map((row) => ({
      id: row.dryRunId,
      acceptanceId: row.acceptanceId,
      executionId: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterOrchestrationDryRunStatusLabel(row.status),
      orchestrationMode: row.orchestrationMode,
      acceptanceMode: row.acceptanceMode,
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterOrchestrationDryRunConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.dryRunId,
      tone: executionAdapterOrchestrationDryRunTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterOrchestrationExecutionRows(
  executions: ExecutionAdapterOrchestrationExecutionSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterOrchestrationExecutionRow[] {
  return (executions ?? [])
    .map((row) => ({
      id: row.orchestrationExecutionId,
      dryRunId: row.dryRunId,
      acceptanceId: row.acceptanceId,
      executionId: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterOrchestrationExecutionStatusLabel(row.status),
      orchestrationExecutionMode: row.orchestrationExecutionMode,
      orchestrationMode: row.orchestrationMode,
      acceptanceMode: row.acceptanceMode,
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterOrchestrationExecutionConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.orchestrationExecutionId,
      tone: executionAdapterOrchestrationExecutionTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterHumanConfirmationRows(
  confirmations: ExecutionAdapterHumanConfirmationSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterHumanConfirmationRow[] {
  return (confirmations ?? [])
    .map((row) => ({
      id: row.humanConfirmationId,
      orchestrationExecutionId: row.orchestrationExecutionId,
      dryRunId: row.dryRunId,
      acceptanceId: row.acceptanceId,
      executionId: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterHumanConfirmationStatusLabel(row.status),
      confirmationMode: row.confirmationMode,
      orchestrationExecutionMode: row.orchestrationExecutionMode,
      orchestrationMode: row.orchestrationMode,
      acceptanceMode: row.acceptanceMode,
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterHumanConfirmationConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.humanConfirmationId,
      tone: executionAdapterHumanConfirmationTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterSandboxProbePlanRows(
  plans: ExecutionAdapterSandboxProbePlanSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterSandboxProbePlanRow[] {
  return (plans ?? [])
    .map((row) => ({
      id: row.sandboxProbePlanId,
      humanConfirmationId: row.humanConfirmationId,
      orchestrationExecutionId: row.orchestrationExecutionId,
      dryRunId: row.dryRunId,
      acceptanceId: row.acceptanceId,
      executionId: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterSandboxProbePlanStatusLabel(row.status),
      probeMode: row.probeMode,
      confirmationMode: row.confirmationMode,
      orchestrationExecutionMode: row.orchestrationExecutionMode,
      orchestrationMode: row.orchestrationMode,
      acceptanceMode: row.acceptanceMode,
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterSandboxProbePlanConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.sandboxProbePlanId,
      tone: executionAdapterSandboxProbePlanTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterSandboxProbeExecutionRows(
  executions: ExecutionAdapterSandboxProbeExecutionSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterSandboxProbeExecutionRow[] {
  return (executions ?? [])
    .map((row) => ({
      id: row.sandboxProbeExecutionId,
      sandboxProbePlanId: row.sandboxProbePlanId,
      humanConfirmationId: row.humanConfirmationId,
      orchestrationExecutionId: row.orchestrationExecutionId,
      dryRunId: row.dryRunId,
      acceptanceId: row.acceptanceId,
      executionId: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterSandboxProbeExecutionStatusLabel(row.status),
      probeExecutionMode: row.probeExecutionMode,
      probeMode: row.probeMode,
      confirmationMode: row.confirmationMode,
      orchestrationExecutionMode: row.orchestrationExecutionMode,
      orchestrationMode: row.orchestrationMode,
      acceptanceMode: row.acceptanceMode,
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterSandboxProbeExecutionConfirmationSummary(row.requiredConfirmations),
      healthProbeSummary: executionAdapterSandboxProbeHealthSummary(row.metadata),
      authoritativeHealthReady: executionAdapterSandboxProbeAuthoritativeHealthReady(row),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.sandboxProbeExecutionId,
      tone: executionAdapterSandboxProbeExecutionTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterSandboxProbeReviewRows(
  reviews: ExecutionAdapterSandboxProbeReviewSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterSandboxProbeReviewRow[] {
  return (reviews ?? [])
    .map((row) => ({
      id: row.sandboxProbeReviewId,
      sandboxProbeExecutionId: row.sandboxProbeExecutionId,
      sandboxProbePlanId: row.sandboxProbePlanId,
      humanConfirmationId: row.humanConfirmationId,
      orchestrationExecutionId: row.orchestrationExecutionId,
      dryRunId: row.dryRunId,
      acceptanceId: row.acceptanceId,
      executionId: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterSandboxProbeReviewStatusLabel(row.status),
      reviewMode: row.reviewMode,
      probeExecutionMode: row.probeExecutionMode,
      probeMode: row.probeMode,
      confirmationMode: row.confirmationMode,
      orchestrationExecutionMode: row.orchestrationExecutionMode,
      orchestrationMode: row.orchestrationMode,
      acceptanceMode: row.acceptanceMode,
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterSandboxProbeReviewConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.sandboxProbeReviewId,
      tone: executionAdapterSandboxProbeReviewTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterProductionRouteReviewRows(
  reviews: ExecutionAdapterProductionRouteReviewSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterProductionRouteReviewRow[] {
  return (reviews ?? [])
    .map((row) => ({
      id: row.productionRouteReviewId,
      sandboxProbeReviewId: row.sandboxProbeReviewId,
      sandboxProbeExecutionId: row.sandboxProbeExecutionId,
      sandboxProbePlanId: row.sandboxProbePlanId,
      humanConfirmationId: row.humanConfirmationId,
      orchestrationExecutionId: row.orchestrationExecutionId,
      dryRunId: row.dryRunId,
      acceptanceId: row.acceptanceId,
      executionId: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterProductionRouteReviewStatusLabel(row.status),
      reviewMode: row.reviewMode,
      sandboxReviewMode: row.sandboxReviewMode,
      probeExecutionMode: row.probeExecutionMode,
      probeMode: row.probeMode,
      confirmationMode: row.confirmationMode,
      orchestrationExecutionMode: row.orchestrationExecutionMode,
      orchestrationMode: row.orchestrationMode,
      acceptanceMode: row.acceptanceMode,
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterProductionRouteReviewConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.productionRouteReviewId,
      tone: executionAdapterProductionRouteReviewTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterSandboxOrderSchemaDryRunRows(
  dryRuns: ExecutionAdapterSandboxOrderSchemaDryRunSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterSandboxOrderSchemaDryRunRow[] {
  return (dryRuns ?? [])
    .map((row) => ({
      id: row.sandboxOrderSchemaDryRunId,
      productionRouteReviewId: row.productionRouteReviewId,
      sandboxProbeReviewId: row.sandboxProbeReviewId,
      sandboxProbeExecutionId: row.sandboxProbeExecutionId,
      sandboxProbePlanId: row.sandboxProbePlanId,
      humanConfirmationId: row.humanConfirmationId,
      orchestrationExecutionId: row.orchestrationExecutionId,
      dryRunId: row.dryRunId,
      acceptanceId: row.acceptanceId,
      executionId: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterSandboxOrderSchemaDryRunStatusLabel(row.status),
      dryRunMode: row.dryRunMode,
      reviewMode: row.reviewMode,
      sandboxReviewMode: row.sandboxReviewMode,
      probeExecutionMode: row.probeExecutionMode,
      probeMode: row.probeMode,
      confirmationMode: row.confirmationMode,
      orchestrationExecutionMode: row.orchestrationExecutionMode,
      orchestrationMode: row.orchestrationMode,
      acceptanceMode: row.acceptanceMode,
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      orderIntentSummary: executionAdapterSandboxOrderIntentSummary(row.orderIntent),
      orderSubmitted: row.orderSubmitted,
      confirmationSummary: executionAdapterSandboxOrderSchemaDryRunConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.orderSubmitted
        ? "Order submission detected · blocked"
        : row.liveTradingAllowed
          ? "Live trading allowed"
          : row.paperOnly
            ? "No order submitted · paper only · live trading blocked"
            : "No order submitted · live trading blocked",
      auditEventId: row.sandboxOrderSchemaDryRunId,
      tone: executionAdapterSandboxOrderSchemaDryRunTone(row.status, row.orderSubmitted)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}
