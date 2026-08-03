import type { BrokerAdapterRow, PaperExecutionSnapshot } from "../audit/execution-contracts";
import type { TerminalWorkspace } from "../core/workspace-contracts";
import type { ExecutionAdapterCertificationApplyRow, ExecutionAdapterCertificationRow, ExecutionAdapterControlledRestartEvidenceRow, ExecutionAdapterEnvironmentBindingRow, ExecutionAdapterRestartAcceptanceRow, ExecutionAdapterRuntimeReloadAcceptanceRow, ExecutionAdapterRuntimeReloadExecutionRow, ExecutionAdapterRuntimeReloadPlanRow, ExecutionAdapterSecretMaterializationRow, ExecutionAdapterSecretReferenceRow } from "./adapter-contracts";
import type { ExecutionAdapterOpsStateRow, ExecutionAdapterPaperExecutionRow, PromotionQueueStage, PromotionReadiness } from "./ops-contracts";
import { latestPromotionAdapterOpsStateRow, latestPromotionAdapterPaperExecutionRow, latestPromotionHumanConfirmationRow, latestPromotionPaperOrderLifecycleRow, latestPromotionPaperRouteRunbookRow, latestPromotionProductionRouteReviewRow, latestPromotionRuntimeReloadAcceptanceRow, latestPromotionSandboxOrderSchemaDryRunRow, latestPromotionSandboxProbeExecutionRow, latestPromotionSandboxProbeReviewRow } from "./promotion-evidence";
import { latestPromotionCertificationApplyRow, latestPromotionCertificationRow, latestPromotionControlledRestartEvidenceRow, latestPromotionEnvironmentBindingRow, latestPromotionRestartAcceptanceRow, latestPromotionRuntimeReloadExecutionRow, latestPromotionRuntimeReloadPlanRow, latestPromotionSecretMaterializationRow, latestPromotionSecretReferenceRow } from "./runbook-builders";
import type { ExecutionAdapterHumanConfirmationRow, ExecutionAdapterPaperOrderLifecycleRow, ExecutionAdapterPaperRouteRunbookRow, ExecutionAdapterProductionRouteReviewRow, ExecutionAdapterSandboxOrderSchemaDryRunRow, ExecutionAdapterSandboxProbeExecutionRow, ExecutionAdapterSandboxProbeReviewRow } from "./validation-contracts";
import { buildRiskApprovalSummary } from "../portfolio/report-builders";
import { buildResearchRunContextBinding } from "../strategy/experiment-builders";

export function buildPromotionAdapterCertificationStage(
  certifiedLiveAdapters: number,
  latestCertification: ExecutionAdapterCertificationRow | null,
  latestApply: ExecutionAdapterCertificationApplyRow | null,
  latestRestartEvidence: ExecutionAdapterControlledRestartEvidenceRow | null,
  latestRestartAcceptance: ExecutionAdapterRestartAcceptanceRow | null,
  latestSecretReference: ExecutionAdapterSecretReferenceRow | null,
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null,
  latestEnvironmentBinding: ExecutionAdapterEnvironmentBindingRow | null,
  latestRuntimeReloadPlan: ExecutionAdapterRuntimeReloadPlanRow | null,
  latestRuntimeReloadExecution: ExecutionAdapterRuntimeReloadExecutionRow | null,
  latestRuntimeReloadAcceptance: ExecutionAdapterRuntimeReloadAcceptanceRow | null,
  latestSandboxProbeExecution: ExecutionAdapterSandboxProbeExecutionRow | null,
  latestSandboxProbeReview: ExecutionAdapterSandboxProbeReviewRow | null,
  latestProductionRouteReview: ExecutionAdapterProductionRouteReviewRow | null,
  latestSandboxOrderSchemaDryRun: ExecutionAdapterSandboxOrderSchemaDryRunRow | null,
  latestPaperOrderLifecycle: ExecutionAdapterPaperOrderLifecycleRow | null,
  latestPaperRouteRunbook: ExecutionAdapterPaperRouteRunbookRow | null,
  latestAdapterOpsState: ExecutionAdapterOpsStateRow | null,
  latestAdapterPaperExecution: ExecutionAdapterPaperExecutionRow | null,
  liveAdapterCertified: boolean,
  adapterGatePassed: boolean
): PromotionQueueStage {
  const secretReferenceDetail = latestSecretReference
    ? `Latest secret reference ${latestSecretReference.auditEventId}: ${latestSecretReference.statusLabel} · ${latestSecretReference.confirmationSummary} · ${latestSecretReference.blockerSummary} · ${latestSecretReference.backend} · ${latestSecretReference.envVarSummary} · ${latestSecretReference.boundary}.`
    : "";
  const secretMaterializationDetail = latestSecretMaterialization
    ? `Latest secret materialization ${latestSecretMaterialization.auditEventId}: ${latestSecretMaterialization.statusLabel} · ${latestSecretMaterialization.confirmationSummary} · ${latestSecretMaterialization.blockerSummary} · ${latestSecretMaterialization.backend} · ${latestSecretMaterialization.envVarSummary} · ${latestSecretMaterialization.boundary}. ${promotionSecretMaterializationNextStep(latestSecretMaterialization)}`
    : "";
  const environmentBindingDetail = latestEnvironmentBinding
    ? `Latest environment binding ${latestEnvironmentBinding.auditEventId}: ${latestEnvironmentBinding.statusLabel} · ${latestEnvironmentBinding.confirmationSummary} · ${latestEnvironmentBinding.blockerSummary} · ${latestEnvironmentBinding.bindingMode} · ${latestEnvironmentBinding.envVarSummary} · ${latestEnvironmentBinding.boundary}. ${promotionEnvironmentBindingNextStep(latestEnvironmentBinding)}`
    : "";
  const runtimeReloadPlanValidationDetail = latestRuntimeReloadPlan?.manifestValidationId
    ? ` · ${latestRuntimeReloadPlan.manifestValidationId}`
    : "";
  const runtimeReloadPlanDetail = latestRuntimeReloadPlan
    ? `Latest runtime reload plan ${latestRuntimeReloadPlan.auditEventId}: ${latestRuntimeReloadPlan.statusLabel} · ${latestRuntimeReloadPlan.confirmationSummary} · ${latestRuntimeReloadPlan.blockerSummary} · ${latestRuntimeReloadPlan.reloadMode} · ${latestRuntimeReloadPlan.maintenanceWindowId}${runtimeReloadPlanValidationDetail} · ${latestRuntimeReloadPlan.boundary}. ${promotionRuntimeReloadPlanNextStep(latestRuntimeReloadPlan)}`
    : "";
  const runtimeReloadExecutionValidationDetail = latestRuntimeReloadExecution?.manifestValidationId
    ? ` · ${latestRuntimeReloadExecution.manifestValidationId}`
    : "";
  const runtimeReloadExecutionDetail = latestRuntimeReloadExecution
    ? `Latest runtime reload execution ${latestRuntimeReloadExecution.auditEventId}: ${latestRuntimeReloadExecution.statusLabel} · ${latestRuntimeReloadExecution.confirmationSummary} · ${latestRuntimeReloadExecution.blockerSummary} · ${latestRuntimeReloadExecution.executionMode} · ${latestRuntimeReloadExecution.reloadMode} · ${latestRuntimeReloadExecution.maintenanceWindowId}${runtimeReloadExecutionValidationDetail} · ${latestRuntimeReloadExecution.boundary}. ${promotionRuntimeReloadExecutionNextStep(latestRuntimeReloadExecution)}`
    : "";
  const runtimeReloadAcceptanceValidationDetail = latestRuntimeReloadAcceptance?.manifestValidationId
    ? ` · ${latestRuntimeReloadAcceptance.manifestValidationId}`
    : "";
  const runtimeReloadAcceptanceDetail = latestRuntimeReloadAcceptance
    ? `Latest runtime reload acceptance ${latestRuntimeReloadAcceptance.auditEventId}: ${latestRuntimeReloadAcceptance.statusLabel} · ${latestRuntimeReloadAcceptance.confirmationSummary} · ${latestRuntimeReloadAcceptance.blockerSummary} · ${latestRuntimeReloadAcceptance.acceptanceMode} · ${latestRuntimeReloadAcceptance.executionMode} · ${latestRuntimeReloadAcceptance.reloadMode} · ${latestRuntimeReloadAcceptance.maintenanceWindowId}${runtimeReloadAcceptanceValidationDetail} · ${latestRuntimeReloadAcceptance.boundary}. ${promotionRuntimeReloadAcceptanceNextStep(latestRuntimeReloadAcceptance)}`
    : "";
  const sandboxProbeExecutionValidationDetail = latestSandboxProbeExecution?.manifestValidationId
    ? ` · manifest ${latestSandboxProbeExecution.manifestValidationId}`
    : "";
  const sandboxProbeExecutionDetail = latestSandboxProbeExecution
    ? `Latest sandbox probe execution ${latestSandboxProbeExecution.auditEventId}: ${latestSandboxProbeExecution.statusLabel} · ${latestSandboxProbeExecution.confirmationSummary} · ${latestSandboxProbeExecution.blockerSummary} · ${latestSandboxProbeExecution.probeExecutionMode} · ${latestSandboxProbeExecution.probeMode}${sandboxProbeExecutionValidationDetail} · ${latestSandboxProbeExecution.boundary}. ${promotionSandboxProbeExecutionNextStep(latestSandboxProbeExecution)}`
    : "";
  const sandboxProbeReviewValidationDetail = latestSandboxProbeReview?.manifestValidationId
    ? ` · manifest ${latestSandboxProbeReview.manifestValidationId}`
    : "";
  const sandboxProbeReviewDetail = latestSandboxProbeReview
    ? `Latest sandbox probe review ${latestSandboxProbeReview.auditEventId}: ${latestSandboxProbeReview.statusLabel} · ${latestSandboxProbeReview.confirmationSummary} · ${latestSandboxProbeReview.blockerSummary} · ${latestSandboxProbeReview.reviewMode} · ${latestSandboxProbeReview.probeExecutionMode}${sandboxProbeReviewValidationDetail} · ${latestSandboxProbeReview.boundary}. ${promotionSandboxProbeReviewNextStep(latestSandboxProbeReview)}`
    : "";
  const productionRouteReviewValidationDetail = latestProductionRouteReview?.manifestValidationId
    ? ` · manifest ${latestProductionRouteReview.manifestValidationId}`
    : "";
  const productionRouteReviewDetail = latestProductionRouteReview
    ? `Latest production route review ${latestProductionRouteReview.auditEventId}: ${latestProductionRouteReview.statusLabel} · ${latestProductionRouteReview.confirmationSummary} · ${latestProductionRouteReview.blockerSummary} · ${latestProductionRouteReview.reviewMode} · ${latestProductionRouteReview.sandboxReviewMode}${productionRouteReviewValidationDetail} · ${latestProductionRouteReview.boundary}. ${promotionProductionRouteReviewNextStep(latestProductionRouteReview)}`
    : "";
  const sandboxOrderSchemaDryRunValidationDetail = latestSandboxOrderSchemaDryRun?.manifestValidationId
    ? ` · manifest ${latestSandboxOrderSchemaDryRun.manifestValidationId}`
    : "";
  const sandboxOrderSchemaDryRunDetail = latestSandboxOrderSchemaDryRun
    ? `Latest sandbox order schema dry-run ${latestSandboxOrderSchemaDryRun.auditEventId}: ${latestSandboxOrderSchemaDryRun.statusLabel} · ${latestSandboxOrderSchemaDryRun.orderIntentSummary} · ${latestSandboxOrderSchemaDryRun.confirmationSummary} · ${latestSandboxOrderSchemaDryRun.blockerSummary} · ${latestSandboxOrderSchemaDryRun.dryRunMode} · ${latestSandboxOrderSchemaDryRun.reviewMode}${sandboxOrderSchemaDryRunValidationDetail} · ${latestSandboxOrderSchemaDryRun.boundary}. ${promotionSandboxOrderSchemaDryRunNextStep(latestSandboxOrderSchemaDryRun)}`
    : "";
  const paperOrderLifecycleValidationDetail = latestPaperOrderLifecycle?.manifestValidationId
    ? ` · manifest ${latestPaperOrderLifecycle.manifestValidationId}`
    : "";
  const paperOrderLifecycleDetail = latestPaperOrderLifecycle
    ? `Latest paper order lifecycle ${latestPaperOrderLifecycle.auditEventId}: ${latestPaperOrderLifecycle.statusLabel} · ${latestPaperOrderLifecycle.orderIntentSummary} · ${latestPaperOrderLifecycle.lifecycleStepSummary} · ${latestPaperOrderLifecycle.confirmationSummary} · ${latestPaperOrderLifecycle.blockerSummary} · ${latestPaperOrderLifecycle.lifecycleMode} · ${latestPaperOrderLifecycle.dryRunMode}${paperOrderLifecycleValidationDetail} · ${latestPaperOrderLifecycle.boundary}. ${promotionPaperOrderLifecycleNextStep(latestPaperOrderLifecycle)}`
    : "";
  const paperRouteRunbookValidationDetail = latestPaperRouteRunbook?.manifestValidationId
    ? ` · manifest ${latestPaperRouteRunbook.manifestValidationId}`
    : "";
  const paperRouteRunbookDetail = latestPaperRouteRunbook
    ? `Latest paper route runbook ${latestPaperRouteRunbook.auditEventId}: ${latestPaperRouteRunbook.statusLabel} · ${latestPaperRouteRunbook.orderIntentSummary} · ${latestPaperRouteRunbook.runbookStepSummary} · ${latestPaperRouteRunbook.confirmationSummary} · ${latestPaperRouteRunbook.blockerSummary} · ${latestPaperRouteRunbook.runbookMode} · ${latestPaperRouteRunbook.lifecycleMode}${paperRouteRunbookValidationDetail} · ${latestPaperRouteRunbook.boundary}. ${promotionPaperRouteRunbookNextStep(latestPaperRouteRunbook)}`
    : "";
  const adapterOpsStateValidationDetail = latestAdapterOpsState?.manifestValidationId
    ? ` · manifest ${latestAdapterOpsState.manifestValidationId}`
    : "";
  const adapterOpsStateDetail = latestAdapterOpsState
    ? `Latest adapter ops state ${latestAdapterOpsState.auditEventId}: ${latestAdapterOpsState.statusLabel} · ${latestAdapterOpsState.orderIntentSummary} · ${latestAdapterOpsState.opsStepSummary} · ${latestAdapterOpsState.confirmationSummary} · ${latestAdapterOpsState.blockerSummary} · ${latestAdapterOpsState.opsMode} · ${latestAdapterOpsState.runbookMode}${adapterOpsStateValidationDetail} · ${latestAdapterOpsState.boundary}. ${promotionAdapterOpsStateNextStep(latestAdapterOpsState)}`
    : "";
  const adapterPaperExecutionValidationDetail = latestAdapterPaperExecution?.manifestValidationId
    ? ` · manifest ${latestAdapterPaperExecution.manifestValidationId}`
    : "";
  const adapterPaperExecutionDetail = latestAdapterPaperExecution
    ? `Latest adapter paper execution ${latestAdapterPaperExecution.auditEventId}: ${latestAdapterPaperExecution.statusLabel} · ${latestAdapterPaperExecution.fillSummary} · ${latestAdapterPaperExecution.confirmationSummary} · ${latestAdapterPaperExecution.blockerSummary} · ${latestAdapterPaperExecution.paperExecutionMode}${adapterPaperExecutionValidationDetail} · ${latestAdapterPaperExecution.boundary}. ${promotionAdapterPaperExecutionNextStep(latestAdapterPaperExecution)}`
    : "";
  if (!latestCertification) {
    const liveAdapterDetail = liveAdapterCertified
      ? "A certified live adapter is available for the selected market."
      : "Live adapters remain interface-only or configuration-required until certification passes.";
    return {
      id: "adapter-certification",
      label: "Adapter certification",
      value: latestAdapterPaperExecution
        ? `${latestAdapterPaperExecution.statusLabel} · ${latestAdapterPaperExecution.adapterId}`
        : latestAdapterOpsState
        ? `${latestAdapterOpsState.statusLabel} · ${latestAdapterOpsState.adapterId}`
        : latestPaperRouteRunbook
        ? `${latestPaperRouteRunbook.statusLabel} · ${latestPaperRouteRunbook.adapterId}`
        : latestPaperOrderLifecycle
        ? `${latestPaperOrderLifecycle.statusLabel} · ${latestPaperOrderLifecycle.adapterId}`
        : latestSandboxOrderSchemaDryRun
        ? `${latestSandboxOrderSchemaDryRun.statusLabel} · ${latestSandboxOrderSchemaDryRun.adapterId}`
        : latestProductionRouteReview
        ? `${latestProductionRouteReview.statusLabel} · ${latestProductionRouteReview.adapterId}`
        : latestSandboxProbeReview
        ? `${latestSandboxProbeReview.statusLabel} · ${latestSandboxProbeReview.adapterId}`
        : latestSandboxProbeExecution
        ? `${latestSandboxProbeExecution.statusLabel} · ${latestSandboxProbeExecution.adapterId}`
        : certifiedLiveAdapters === 1
          ? "1 certified live adapter"
          : `${certifiedLiveAdapters} certified live adapters`,
      detail: [
        liveAdapterDetail,
        secretReferenceDetail,
        secretMaterializationDetail,
        environmentBindingDetail,
        runtimeReloadPlanDetail,
        runtimeReloadExecutionDetail,
        runtimeReloadAcceptanceDetail,
        sandboxProbeExecutionDetail,
        sandboxProbeReviewDetail,
        productionRouteReviewDetail,
        sandboxOrderSchemaDryRunDetail,
        paperOrderLifecycleDetail,
        paperRouteRunbookDetail,
        adapterOpsStateDetail,
        adapterPaperExecutionDetail
      ]
        .filter(Boolean)
        .join(" "),
      status: liveAdapterCertified ? "passed" : "blocked",
      tone: liveAdapterCertified
        ? "positive"
        : latestAdapterPaperExecution?.status === "paper_execution_recorded" && latestAdapterPaperExecution.paperFillRecorded
          ? "warning"
        : latestAdapterPaperExecution
          ? latestAdapterPaperExecution.tone
        : latestAdapterOpsState?.status === "ops_state_recorded" &&
            !latestAdapterOpsState.routeExecuted &&
            !latestAdapterOpsState.liveOrderSubmitted
          ? "warning"
        : latestAdapterOpsState
          ? latestAdapterOpsState.tone
        : latestPaperRouteRunbook?.status === "runbook_recorded" &&
            !latestPaperRouteRunbook.routeExecuted &&
            !latestPaperRouteRunbook.liveOrderSubmitted
          ? "warning"
        : latestPaperRouteRunbook
          ? latestPaperRouteRunbook.tone
        : latestPaperOrderLifecycle?.status === "lifecycle_recorded" &&
            !latestPaperOrderLifecycle.orderSubmitted &&
            !latestPaperOrderLifecycle.liveOrderSubmitted
          ? "warning"
        : latestPaperOrderLifecycle
          ? latestPaperOrderLifecycle.tone
        : latestSandboxOrderSchemaDryRun?.status === "schema_dry_run_recorded" && !latestSandboxOrderSchemaDryRun.orderSubmitted
          ? "warning"
        : latestSandboxOrderSchemaDryRun
          ? latestSandboxOrderSchemaDryRun.tone
        : latestProductionRouteReview?.status === "route_review_recorded"
          ? "warning"
        : latestProductionRouteReview
          ? latestProductionRouteReview.tone
        : latestSandboxProbeReview?.status === "probe_review_recorded"
          ? "warning"
        : latestSandboxProbeReview
          ? latestSandboxProbeReview.tone
        : latestSandboxProbeExecution?.status === "probe_execution_recorded"
          ? "warning"
        : latestSandboxProbeExecution
          ? latestSandboxProbeExecution.tone
        : latestRuntimeReloadAcceptance?.status === "acceptance_recorded" ||
            latestRuntimeReloadExecution?.status === "execution_recorded" ||
            latestRuntimeReloadPlan?.status === "plan_recorded" ||
            latestEnvironmentBinding?.status === "binding_recorded" ||
            latestSecretMaterialization?.status === "manifest_recorded" ||
            latestSecretReference?.status === "reference_recorded"
          ? "warning"
          : "risk"
    };
  }

  const certificationDetail = `Latest certification ${latestCertification.auditEventId}: ${latestCertification.checkSummary} · ${latestCertification.boundary}.`;
  const restartEvidenceDetail = latestRestartEvidence
    ? `Latest restart evidence ${latestRestartEvidence.auditEventId}: ${latestRestartEvidence.statusLabel} · ${latestRestartEvidence.confirmationSummary} · ${latestRestartEvidence.blockerSummary} · ${latestRestartEvidence.boundary}.${latestRestartAcceptance ? "" : ` ${promotionControlledRestartEvidenceNextStep(latestRestartEvidence)}`}`
    : "";
  const restartAcceptanceDetail = latestRestartAcceptance
    ? `Latest restart acceptance ${latestRestartAcceptance.auditEventId}: ${latestRestartAcceptance.statusLabel} · ${latestRestartAcceptance.confirmationSummary} · ${latestRestartAcceptance.blockerSummary} · ${latestRestartAcceptance.boundary}. ${promotionRestartAcceptanceNextStep(latestRestartAcceptance)}`
    : "";
  const applyDetail = latestApply
    ? `Latest apply ${latestApply.auditEventId}: ${latestApply.statusLabel} · ${latestApply.confirmationSummary} · ${latestApply.blockerSummary} · ${latestApply.boundary}.${latestRestartEvidence ? "" : ` ${promotionCertificationApplyNextStep(latestApply)}`}`
    : "";
  const gateDetail =
    !latestApply && !latestRestartEvidence && latestCertification.status === "passed" && latestCertification.liveTradingAllowed && !adapterGatePassed
      ? "Workspace adapter gate is still blocked."
      : "";
  return {
    id: "adapter-certification",
    label: "Adapter certification",
    value: `${latestAdapterPaperExecution?.statusLabel ?? latestAdapterOpsState?.statusLabel ?? latestPaperRouteRunbook?.statusLabel ?? latestPaperOrderLifecycle?.statusLabel ?? latestSandboxOrderSchemaDryRun?.statusLabel ?? latestProductionRouteReview?.statusLabel ?? latestSandboxProbeReview?.statusLabel ?? latestSandboxProbeExecution?.statusLabel ?? latestRestartAcceptance?.statusLabel ?? latestRestartEvidence?.statusLabel ?? latestRuntimeReloadAcceptance?.statusLabel ?? latestRuntimeReloadExecution?.statusLabel ?? latestApply?.statusLabel ?? latestCertification.statusLabel} · ${latestCertification.adapterId}`,
    detail: [
      secretReferenceDetail,
      secretMaterializationDetail,
      environmentBindingDetail,
      runtimeReloadPlanDetail,
      runtimeReloadExecutionDetail,
      runtimeReloadAcceptanceDetail,
      sandboxProbeExecutionDetail,
      sandboxProbeReviewDetail,
      productionRouteReviewDetail,
      sandboxOrderSchemaDryRunDetail,
      paperOrderLifecycleDetail,
      paperRouteRunbookDetail,
      adapterOpsStateDetail,
      adapterPaperExecutionDetail,
      certificationDetail,
      applyDetail,
      restartEvidenceDetail,
      restartAcceptanceDetail,
      gateDetail
    ]
      .filter(Boolean)
      .join(" "),
    status: liveAdapterCertified ? "passed" : "blocked",
    tone: liveAdapterCertified
      ? "positive"
      : latestAdapterPaperExecution?.status === "paper_execution_recorded" && latestAdapterPaperExecution.paperFillRecorded
        ? "warning"
      : latestAdapterPaperExecution
        ? latestAdapterPaperExecution.tone
      : latestAdapterOpsState?.status === "ops_state_recorded" &&
          !latestAdapterOpsState.routeExecuted &&
          !latestAdapterOpsState.liveOrderSubmitted
        ? "warning"
      : latestAdapterOpsState
        ? latestAdapterOpsState.tone
      : latestPaperRouteRunbook?.status === "runbook_recorded" &&
          !latestPaperRouteRunbook.routeExecuted &&
          !latestPaperRouteRunbook.liveOrderSubmitted
        ? "warning"
      : latestPaperRouteRunbook
        ? latestPaperRouteRunbook.tone
      : latestPaperOrderLifecycle?.status === "lifecycle_recorded" &&
          !latestPaperOrderLifecycle.orderSubmitted &&
          !latestPaperOrderLifecycle.liveOrderSubmitted
        ? "warning"
      : latestPaperOrderLifecycle
        ? latestPaperOrderLifecycle.tone
      : latestSandboxOrderSchemaDryRun?.status === "schema_dry_run_recorded" && !latestSandboxOrderSchemaDryRun.orderSubmitted
        ? "warning"
      : latestSandboxOrderSchemaDryRun
        ? latestSandboxOrderSchemaDryRun.tone
      : latestProductionRouteReview?.status === "route_review_recorded"
        ? "warning"
      : latestProductionRouteReview
        ? latestProductionRouteReview.tone
      : latestSandboxProbeReview?.status === "probe_review_recorded"
        ? "warning"
      : latestSandboxProbeReview
        ? latestSandboxProbeReview.tone
      : latestSandboxProbeExecution?.status === "probe_execution_recorded"
        ? "warning"
      : latestSandboxProbeExecution
        ? latestSandboxProbeExecution.tone
      : latestRuntimeReloadAcceptance?.status === "acceptance_recorded" ||
          latestRuntimeReloadExecution?.status === "execution_recorded" ||
          latestRuntimeReloadPlan?.status === "plan_recorded" ||
          latestEnvironmentBinding?.status === "binding_recorded" ||
          latestSecretMaterialization?.status === "manifest_recorded" ||
          latestRestartAcceptance?.status === "acceptance_recorded" ||
          latestRestartEvidence?.status === "evidence_recorded" ||
          latestApply?.status === "ready_for_restart"
        ? "warning"
      : latestCertification.status === "passed" && latestCertification.liveTradingAllowed
        ? "warning"
        : latestCertification.tone
  };
}

export function promotionCertificationApplyNextStep(apply: ExecutionAdapterCertificationApplyRow): string {
  if (apply.status === "ready_for_restart") {
    return "Controlled restart evidence is still required before live routing.";
  }
  return "Resolve apply preflight blockers before live routing.";
}

export function promotionControlledRestartEvidenceNextStep(evidence: ExecutionAdapterControlledRestartEvidenceRow): string {
  if (evidence.status === "evidence_recorded") {
    return "Controlled restart evidence is recorded; live routing remains blocked until controlled orchestration and human confirmation pass.";
  }
  return "Resolve controlled restart evidence blockers before live routing.";
}

export function promotionRestartAcceptanceNextStep(acceptance: ExecutionAdapterRestartAcceptanceRow): string {
  if (acceptance.status === "acceptance_recorded") {
    return "Post-restart acceptance is recorded; live routing remains blocked until real adapter orchestration and human confirmation pass.";
  }
  return "Resolve post-restart acceptance blockers before live routing.";
}

export function promotionSecretMaterializationNextStep(materialization: ExecutionAdapterSecretMaterializationRow): string {
  if (materialization.status === "manifest_recorded") {
    return "Secret materialization manifest is recorded; live routing remains blocked until env writes, restart orchestration, and human confirmation pass.";
  }
  return "Resolve secret materialization blockers before restart orchestration.";
}

export function promotionEnvironmentBindingNextStep(binding: ExecutionAdapterEnvironmentBindingRow): string {
  if (binding.status === "binding_recorded") {
    return "Environment binding is recorded; live routing remains blocked until runtime reload orchestration and human confirmation pass.";
  }
  return "Resolve environment binding blockers before runtime reload planning.";
}

export function promotionRuntimeReloadPlanNextStep(plan: ExecutionAdapterRuntimeReloadPlanRow): string {
  if (plan.status === "plan_recorded") {
    return "Runtime reload plan is recorded; live routing remains blocked until controlled reload execution, acceptance, and human confirmation pass.";
  }
  return "Resolve runtime reload plan blockers before controlled reload execution.";
}

export function promotionRuntimeReloadExecutionNextStep(execution: ExecutionAdapterRuntimeReloadExecutionRow): string {
  if (execution.status === "execution_recorded") {
    return "Runtime reload execution evidence is recorded; live routing remains blocked until post-reload acceptance, real adapter orchestration, and human confirmation pass.";
  }
  return "Resolve runtime reload execution blockers before post-reload acceptance.";
}

export function promotionRuntimeReloadAcceptanceNextStep(acceptance: ExecutionAdapterRuntimeReloadAcceptanceRow): string {
  if (acceptance.status === "acceptance_recorded") {
    return "Runtime reload acceptance is recorded; live routing remains blocked until real adapter orchestration and human confirmation pass.";
  }
  return "Resolve runtime reload acceptance blockers before real adapter orchestration.";
}

export function promotionSandboxProbeExecutionNextStep(execution: ExecutionAdapterSandboxProbeExecutionRow): string {
  if (execution.status === "probe_execution_recorded") {
    return "Sandbox probe execution is recorded; live routing remains blocked until adapter certification policy explicitly allows production routing.";
  }
  return "Resolve sandbox probe execution blockers before treating sandbox evidence as reviewed.";
}

export function promotionSandboxProbeReviewNextStep(review: ExecutionAdapterSandboxProbeReviewRow): string {
  if (review.status === "probe_review_recorded") {
    return "Sandbox probe review is recorded; live routing remains blocked until production route policy review and certification allow it.";
  }
  return "Resolve sandbox probe review blockers before treating sandbox evidence as production-route ready.";
}

export function promotionProductionRouteReviewNextStep(review: ExecutionAdapterProductionRouteReviewRow): string {
  if (review.status === "route_review_recorded") {
    return "Production route review is recorded; live routing remains blocked until sandbox order schema dry-run, paper route runbook, and certification allow it.";
  }
  return "Resolve production route review blockers before preparing sandbox order schema dry-runs.";
}

export function promotionSandboxOrderSchemaDryRunNextStep(dryRun: ExecutionAdapterSandboxOrderSchemaDryRunRow): string {
  if (dryRun.status === "schema_dry_run_recorded" && !dryRun.orderSubmitted) {
    return "Sandbox order schema dry-run is recorded; live routing remains blocked until paper order lifecycle, route runbook, and certification allow it.";
  }
  return "Resolve sandbox order schema dry-run blockers before preparing paper order lifecycle evidence.";
}

export function promotionPaperOrderLifecycleNextStep(lifecycle: ExecutionAdapterPaperOrderLifecycleRow): string {
  if (lifecycle.status === "lifecycle_recorded" && !lifecycle.orderSubmitted && !lifecycle.liveOrderSubmitted) {
    return "Paper order lifecycle is recorded; live routing remains blocked until paper route runbook, ops state, and certification allow it.";
  }
  return "Resolve paper order lifecycle blockers before preparing route runbook evidence.";
}

export function promotionPaperRouteRunbookNextStep(runbook: ExecutionAdapterPaperRouteRunbookRow): string {
  if (runbook.status === "runbook_recorded" && !runbook.routeExecuted && !runbook.liveOrderSubmitted) {
    return "Paper route runbook is recorded; live routing remains blocked until adapter ops state, paper execution, and certification allow it.";
  }
  return "Resolve paper route runbook blockers before preparing adapter ops state evidence.";
}

export function promotionAdapterOpsStateNextStep(opsState: ExecutionAdapterOpsStateRow): string {
  if (opsState.status === "ops_state_recorded" && !opsState.routeExecuted && !opsState.liveOrderSubmitted) {
    return "Adapter ops state is recorded; live routing remains blocked until paper execution and certification allow it.";
  }
  return "Resolve adapter ops state blockers before preparing paper execution evidence.";
}

export function promotionAdapterPaperExecutionNextStep(execution: ExecutionAdapterPaperExecutionRow): string {
  if (execution.status === "paper_execution_recorded" && execution.paperFillRecorded) {
    return "Adapter paper execution is recorded with a simulated fill; live routing remains blocked until adapter certification policy explicitly allows production routing.";
  }
  return "Resolve adapter paper execution blockers before treating the paper route as reviewed.";
}

export function buildPromotionReadiness(
  workspace: TerminalWorkspace,
  execution: PaperExecutionSnapshot | null | undefined,
  brokerRows: BrokerAdapterRow[],
  certificationRows: ExecutionAdapterCertificationRow[] = [],
  certificationApplyRows: ExecutionAdapterCertificationApplyRow[] = [],
  controlledRestartEvidenceRows: ExecutionAdapterControlledRestartEvidenceRow[] = [],
  restartAcceptanceRows: ExecutionAdapterRestartAcceptanceRow[] = [],
  secretReferenceRows: ExecutionAdapterSecretReferenceRow[] = [],
  secretMaterializationRows: ExecutionAdapterSecretMaterializationRow[] = [],
  environmentBindingRows: ExecutionAdapterEnvironmentBindingRow[] = [],
  runtimeReloadPlanRows: ExecutionAdapterRuntimeReloadPlanRow[] = [],
  runtimeReloadExecutionRows: ExecutionAdapterRuntimeReloadExecutionRow[] = [],
  runtimeReloadAcceptanceRows: ExecutionAdapterRuntimeReloadAcceptanceRow[] = [],
  humanConfirmationRows: ExecutionAdapterHumanConfirmationRow[] = [],
  sandboxProbeExecutionRows: ExecutionAdapterSandboxProbeExecutionRow[] = [],
  adapterPaperExecutionRows: ExecutionAdapterPaperExecutionRow[] = [],
  sandboxProbeReviewRows: ExecutionAdapterSandboxProbeReviewRow[] = [],
  productionRouteReviewRows: ExecutionAdapterProductionRouteReviewRow[] = [],
  sandboxOrderSchemaDryRunRows: ExecutionAdapterSandboxOrderSchemaDryRunRow[] = [],
  paperOrderLifecycleRows: ExecutionAdapterPaperOrderLifecycleRow[] = [],
  paperRouteRunbookRows: ExecutionAdapterPaperRouteRunbookRow[] = [],
  adapterOpsStateRows: ExecutionAdapterOpsStateRow[] = []
): PromotionReadiness {
  const approval = buildRiskApprovalSummary(workspace);
  const auditBinding = buildResearchRunContextBinding(workspace);
  const run = auditBinding.canUseRun ? workspace.researchRun : null;
  const activeExecution = run && execution?.runId === run.runId ? execution : null;
  const filledOrders = activeExecution?.orders.filter((order) => order.status === "filled") ?? [];
  const paperRiskGate = activeExecution?.gates.find((gate) => gate.id === "paper-risk-check");
  const paperExecutionPassed = filledOrders.length > 0 && paperRiskGate?.passed === true;
  const adapterGatePassed = workspace.execution.gates.find((gate) => gate.id === "adapter-certified")?.passed === true;
  const latestCertification = latestPromotionCertificationRow(workspace, certificationRows);
  const latestCertificationApply = latestPromotionCertificationApplyRow(workspace, certificationApplyRows, latestCertification);
  const latestRestartEvidence = latestPromotionControlledRestartEvidenceRow(
    workspace,
    controlledRestartEvidenceRows,
    latestCertification,
    latestCertificationApply
  );
  const latestRestartAcceptance = latestPromotionRestartAcceptanceRow(
    workspace,
    restartAcceptanceRows,
    latestCertification,
    latestCertificationApply,
    latestRestartEvidence
  );
  const latestSecretReference = latestPromotionSecretReferenceRow(workspace, secretReferenceRows);
  const latestSecretMaterialization = latestPromotionSecretMaterializationRow(
    workspace,
    secretMaterializationRows,
    latestSecretReference
  );
  const latestEnvironmentBinding = latestPromotionEnvironmentBindingRow(
    workspace,
    environmentBindingRows,
    latestSecretMaterialization
  );
  const latestRuntimeReloadPlan = latestPromotionRuntimeReloadPlanRow(
    workspace,
    runtimeReloadPlanRows,
    latestSecretMaterialization,
    latestEnvironmentBinding
  );
  const latestRuntimeReloadExecution = latestPromotionRuntimeReloadExecutionRow(
    workspace,
    runtimeReloadExecutionRows,
    latestSecretMaterialization,
    latestEnvironmentBinding,
    latestRuntimeReloadPlan
  );
  const latestRuntimeReloadAcceptance = latestPromotionRuntimeReloadAcceptanceRow(
    workspace,
    runtimeReloadAcceptanceRows,
    latestSecretMaterialization,
    latestEnvironmentBinding,
    latestRuntimeReloadPlan,
    latestRuntimeReloadExecution
  );
  const latestHumanConfirmation = latestPromotionHumanConfirmationRow(workspace, humanConfirmationRows);
  const latestSandboxProbeExecution = latestPromotionSandboxProbeExecutionRow(
    workspace,
    sandboxProbeExecutionRows,
    latestHumanConfirmation,
    latestRuntimeReloadAcceptance,
    latestRuntimeReloadExecution,
    latestRuntimeReloadPlan,
    latestEnvironmentBinding,
    latestSecretMaterialization
  );
  const latestSandboxProbeReview = latestPromotionSandboxProbeReviewRow(
    workspace,
    sandboxProbeReviewRows,
    latestSandboxProbeExecution,
    latestHumanConfirmation,
    latestRuntimeReloadAcceptance,
    latestRuntimeReloadExecution,
    latestRuntimeReloadPlan,
    latestEnvironmentBinding,
    latestSecretMaterialization
  );
  const latestProductionRouteReview = latestPromotionProductionRouteReviewRow(
    workspace,
    productionRouteReviewRows,
    latestSandboxProbeReview,
    latestSandboxProbeExecution,
    latestHumanConfirmation,
    latestRuntimeReloadAcceptance,
    latestRuntimeReloadExecution,
    latestRuntimeReloadPlan,
    latestEnvironmentBinding,
    latestSecretMaterialization
  );
  const latestSandboxOrderSchemaDryRun = latestPromotionSandboxOrderSchemaDryRunRow(
    workspace,
    sandboxOrderSchemaDryRunRows,
    latestProductionRouteReview,
    latestSandboxProbeReview,
    latestSandboxProbeExecution,
    latestHumanConfirmation,
    latestRuntimeReloadAcceptance,
    latestRuntimeReloadExecution,
    latestRuntimeReloadPlan,
    latestEnvironmentBinding,
    latestSecretMaterialization
  );
  const latestPaperOrderLifecycle = latestPromotionPaperOrderLifecycleRow(
    workspace,
    paperOrderLifecycleRows,
    latestSandboxOrderSchemaDryRun,
    latestProductionRouteReview,
    latestSandboxProbeReview,
    latestSandboxProbeExecution,
    latestHumanConfirmation,
    latestRuntimeReloadAcceptance,
    latestRuntimeReloadExecution,
    latestRuntimeReloadPlan,
    latestEnvironmentBinding,
    latestSecretMaterialization
  );
  const latestPaperRouteRunbook = latestPromotionPaperRouteRunbookRow(
    workspace,
    paperRouteRunbookRows,
    latestPaperOrderLifecycle,
    latestSandboxOrderSchemaDryRun,
    latestProductionRouteReview,
    latestSandboxProbeReview,
    latestSandboxProbeExecution,
    latestHumanConfirmation,
    latestRuntimeReloadAcceptance,
    latestRuntimeReloadExecution,
    latestRuntimeReloadPlan,
    latestEnvironmentBinding,
    latestSecretMaterialization
  );
  const latestAdapterOpsState = latestPromotionAdapterOpsStateRow(
    workspace,
    adapterOpsStateRows,
    latestPaperRouteRunbook,
    latestPaperOrderLifecycle,
    latestSandboxOrderSchemaDryRun,
    latestProductionRouteReview,
    latestSandboxProbeReview,
    latestSandboxProbeExecution,
    latestHumanConfirmation,
    latestRuntimeReloadAcceptance,
    latestRuntimeReloadExecution,
    latestRuntimeReloadPlan,
    latestEnvironmentBinding,
    latestSecretMaterialization
  );
  const latestAdapterPaperExecution = latestPromotionAdapterPaperExecutionRow(
    workspace,
    adapterPaperExecutionRows,
    latestAdapterOpsState,
    latestPaperRouteRunbook,
    latestPaperOrderLifecycle,
    latestSandboxOrderSchemaDryRun,
    latestProductionRouteReview,
    latestSandboxProbeReview,
    latestSandboxProbeExecution,
    latestHumanConfirmation,
    latestRuntimeReloadAcceptance,
    latestRuntimeReloadExecution,
    latestRuntimeReloadPlan,
    latestEnvironmentBinding,
    latestSecretMaterialization
  );
  const humanGatePassed =
    workspace.execution.gates.find((gate) => gate.id === "human-confirmed")?.passed === true ||
    latestHumanConfirmation?.status === "confirmation_recorded";
  const evidenceCertified =
    latestCertification?.status === "passed" && latestCertification.liveTradingAllowed && latestCertification.route === "live";
  const certifiedLiveAdapters = brokerRows.filter(
    (row) =>
      row.route === "live" &&
      row.status === "paper_ready" &&
      (!latestCertification || (row.id === latestCertification.adapterId && evidenceCertified))
  ).length;
  const liveAdapterCertified = adapterGatePassed && evidenceCertified && certifiedLiveAdapters > 0;

  const auditedStage: PromotionQueueStage = run
    ? {
        id: "audited-run",
        label: "Audited run",
        value: run.runId,
        detail: `${run.dataRows} ${run.timeframe} bars are bound to the promotion queue.`,
        status: "passed",
        tone: "positive"
      }
    : {
        id: "audited-run",
        label: "Audited run",
        value: auditBinding.status === "mismatched" ? (auditBinding.runId ?? "Stale audited run") : "No audited run",
        detail:
          auditBinding.status === "mismatched"
            ? auditBinding.detail
            : "Run Pipeline before a strategy can enter the promotion queue.",
        status: "blocked",
        tone: "risk"
      };

  const riskStage: PromotionQueueStage = {
    id: "risk-approval",
    label: "Risk approval",
    value:
      approval.status === "live_ready" ? "live approved" : approval.status === "paper_ready" ? "paper approved" : "risk blocked",
    detail: approval.summary,
    status: approval.status === "blocked" ? "blocked" : "passed",
    tone: approval.status === "blocked" ? "risk" : "positive"
  };

  const paperStage: PromotionQueueStage = paperExecutionPassed
    ? {
        id: "paper-execution",
        label: "Paper execution",
        value: filledOrders.length === 1 ? "1 filled order" : `${filledOrders.length} filled orders`,
        detail: `Paper snapshot ${activeExecution?.executionId} passed local risk checks before live promotion.`,
        status: "passed",
        tone: "positive"
      }
    : {
        id: "paper-execution",
        label: "Paper execution",
        value: "No paper fill",
        detail: activeExecution
          ? "Paper execution exists, but a filled order and passing risk check are both required."
          : "Submit a paper order from the active audited run before live promotion review.",
        status: "blocked",
        tone: "warning"
      };

  const adapterStage = buildPromotionAdapterCertificationStage(
    certifiedLiveAdapters,
    latestCertification,
    latestCertificationApply,
    latestRestartEvidence,
    latestRestartAcceptance,
    latestSecretReference,
    latestSecretMaterialization,
    latestEnvironmentBinding,
    latestRuntimeReloadPlan,
    latestRuntimeReloadExecution,
    latestRuntimeReloadAcceptance,
    latestSandboxProbeExecution,
    latestSandboxProbeReview,
      latestProductionRouteReview,
      latestSandboxOrderSchemaDryRun,
      latestPaperOrderLifecycle,
      latestPaperRouteRunbook,
      latestAdapterOpsState,
      latestAdapterPaperExecution,
      liveAdapterCertified,
    adapterGatePassed
  );

  const humanConfirmationValidationDetail = latestHumanConfirmation?.manifestValidationId
    ? ` · manifest ${latestHumanConfirmation.manifestValidationId}`
    : "";
  const humanStage: PromotionQueueStage = latestHumanConfirmation
    ? {
        id: "human-confirmation",
        label: "Human confirmation",
        value: `${latestHumanConfirmation.statusLabel} · ${latestHumanConfirmation.adapterId}`,
        detail: `Latest human confirmation ${latestHumanConfirmation.auditEventId}: ${latestHumanConfirmation.statusLabel} · ${latestHumanConfirmation.confirmationSummary} · ${latestHumanConfirmation.blockerSummary}${humanConfirmationValidationDetail} · ${latestHumanConfirmation.boundary}.`,
        status: latestHumanConfirmation.status === "confirmation_recorded" ? "passed" : "blocked",
        tone: latestHumanConfirmation.tone
      }
    : {
        id: "human-confirmation",
        label: "Human confirmation",
        value: humanGatePassed ? "manual approval recorded" : "manual approval required",
        detail: humanGatePassed
          ? "A human operator confirmed this promotion path."
          : "Live promotion requires explicit human confirmation after adapter certification.",
        status: humanGatePassed ? "passed" : "blocked",
        tone: humanGatePassed ? "positive" : "warning"
      };

  const stages = [auditedStage, riskStage, paperStage, adapterStage, humanStage];
  if (!run || approval.status === "blocked") {
    return {
      status: "blocked",
      headline: "Promotion queue blocked",
      summary: "A strategy needs audited evidence and risk approval before it can enter execution promotion.",
      stages
    };
  }
  if (!paperExecutionPassed) {
    return {
      status: "paper_pending",
      headline: "Paper execution required",
      summary: "The audited run is risk-approved for paper trading, but no filled paper execution is bound yet.",
      stages
    };
  }
  if (!liveAdapterCertified || !humanGatePassed) {
    return {
      status: "certification_pending",
      headline: "Live promotion pending certification",
      summary: "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass.",
      stages
    };
  }
  return {
    status: "live_ready",
    headline: "Live promotion ready",
    summary: "Audited evidence, paper execution, certified adapter, and human confirmation are all bound.",
    stages
  };
}
