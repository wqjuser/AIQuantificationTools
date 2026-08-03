import type { TerminalWorkspace } from "../core/workspace-contracts";
import type { ExecutionAdapterEnvironmentBindingRow, ExecutionAdapterRuntimeReloadAcceptanceRow, ExecutionAdapterRuntimeReloadExecutionRow, ExecutionAdapterRuntimeReloadPlanRow, ExecutionAdapterSecretMaterializationRow } from "./adapter-contracts";
import type { ExecutionAdapterOpsStateRow, ExecutionAdapterPaperExecutionRow } from "./ops-contracts";
import type { ExecutionAdapterHumanConfirmationRow, ExecutionAdapterPaperOrderLifecycleRow, ExecutionAdapterPaperRouteRunbookRow, ExecutionAdapterProductionRouteReviewRow, ExecutionAdapterSandboxOrderSchemaDryRunRow, ExecutionAdapterSandboxProbeExecutionRow, ExecutionAdapterSandboxProbeReviewRow } from "./validation-contracts";

export function latestPromotionRuntimeReloadAcceptanceRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterRuntimeReloadAcceptanceRow[],
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null,
  latestEnvironmentBinding: ExecutionAdapterEnvironmentBindingRow | null,
  latestRuntimeReloadPlan: ExecutionAdapterRuntimeReloadPlanRow | null,
  latestRuntimeReloadExecution: ExecutionAdapterRuntimeReloadExecutionRow | null
): ExecutionAdapterRuntimeReloadAcceptanceRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestSecretMaterialization ||
            (row.adapterId === latestSecretMaterialization.adapterId &&
              row.materializationId === latestSecretMaterialization.id)) &&
          (!latestEnvironmentBinding ||
            (row.adapterId === latestEnvironmentBinding.adapterId && row.bindingId === latestEnvironmentBinding.id)) &&
          (!latestRuntimeReloadPlan ||
            (row.adapterId === latestRuntimeReloadPlan.adapterId && row.planId === latestRuntimeReloadPlan.id)) &&
          (!latestRuntimeReloadExecution ||
            (row.adapterId === latestRuntimeReloadExecution.adapterId &&
              row.executionId === latestRuntimeReloadExecution.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionHumanConfirmationRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterHumanConfirmationRow[]
): ExecutionAdapterHumanConfirmationRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local"
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionSandboxProbeExecutionRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterSandboxProbeExecutionRow[],
  latestHumanConfirmation: ExecutionAdapterHumanConfirmationRow | null,
  latestRuntimeReloadAcceptance: ExecutionAdapterRuntimeReloadAcceptanceRow | null,
  latestRuntimeReloadExecution: ExecutionAdapterRuntimeReloadExecutionRow | null,
  latestRuntimeReloadPlan: ExecutionAdapterRuntimeReloadPlanRow | null,
  latestEnvironmentBinding: ExecutionAdapterEnvironmentBindingRow | null,
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null
): ExecutionAdapterSandboxProbeExecutionRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestHumanConfirmation ||
            (row.adapterId === latestHumanConfirmation.adapterId &&
              row.humanConfirmationId === latestHumanConfirmation.id &&
              row.orchestrationExecutionId === latestHumanConfirmation.orchestrationExecutionId)) &&
          (!latestRuntimeReloadAcceptance ||
            (row.adapterId === latestRuntimeReloadAcceptance.adapterId &&
              row.acceptanceId === latestRuntimeReloadAcceptance.id)) &&
          (!latestRuntimeReloadExecution ||
            (row.adapterId === latestRuntimeReloadExecution.adapterId &&
              row.executionId === latestRuntimeReloadExecution.id)) &&
          (!latestRuntimeReloadPlan ||
            (row.adapterId === latestRuntimeReloadPlan.adapterId && row.planId === latestRuntimeReloadPlan.id)) &&
          (!latestEnvironmentBinding ||
            (row.adapterId === latestEnvironmentBinding.adapterId && row.bindingId === latestEnvironmentBinding.id)) &&
          (!latestSecretMaterialization ||
            (row.adapterId === latestSecretMaterialization.adapterId &&
              row.materializationId === latestSecretMaterialization.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionAdapterPaperExecutionRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterPaperExecutionRow[],
  latestAdapterOpsState: ExecutionAdapterOpsStateRow | null,
  latestPaperRouteRunbook: ExecutionAdapterPaperRouteRunbookRow | null,
  latestPaperOrderLifecycle: ExecutionAdapterPaperOrderLifecycleRow | null,
  latestSandboxOrderSchemaDryRun: ExecutionAdapterSandboxOrderSchemaDryRunRow | null,
  latestProductionRouteReview: ExecutionAdapterProductionRouteReviewRow | null,
  latestSandboxProbeReview: ExecutionAdapterSandboxProbeReviewRow | null,
  latestSandboxProbeExecution: ExecutionAdapterSandboxProbeExecutionRow | null,
  latestHumanConfirmation: ExecutionAdapterHumanConfirmationRow | null,
  latestRuntimeReloadAcceptance: ExecutionAdapterRuntimeReloadAcceptanceRow | null,
  latestRuntimeReloadExecution: ExecutionAdapterRuntimeReloadExecutionRow | null,
  latestRuntimeReloadPlan: ExecutionAdapterRuntimeReloadPlanRow | null,
  latestEnvironmentBinding: ExecutionAdapterEnvironmentBindingRow | null,
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null
): ExecutionAdapterPaperExecutionRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestAdapterOpsState ||
            (row.adapterId === latestAdapterOpsState.adapterId &&
              row.adapterOpsStateId === latestAdapterOpsState.id &&
              row.paperRouteRunbookId === latestAdapterOpsState.paperRouteRunbookId)) &&
          (!latestPaperRouteRunbook ||
            (row.adapterId === latestPaperRouteRunbook.adapterId &&
              row.paperRouteRunbookId === latestPaperRouteRunbook.id &&
              row.paperOrderLifecycleId === latestPaperRouteRunbook.paperOrderLifecycleId)) &&
          (!latestPaperOrderLifecycle ||
            (row.adapterId === latestPaperOrderLifecycle.adapterId &&
              row.paperOrderLifecycleId === latestPaperOrderLifecycle.id &&
              row.sandboxOrderSchemaDryRunId === latestPaperOrderLifecycle.sandboxOrderSchemaDryRunId)) &&
          (!latestSandboxOrderSchemaDryRun ||
            (row.adapterId === latestSandboxOrderSchemaDryRun.adapterId &&
              row.sandboxOrderSchemaDryRunId === latestSandboxOrderSchemaDryRun.id &&
              row.productionRouteReviewId === latestSandboxOrderSchemaDryRun.productionRouteReviewId)) &&
          (!latestProductionRouteReview ||
            (row.adapterId === latestProductionRouteReview.adapterId &&
              row.productionRouteReviewId === latestProductionRouteReview.id &&
              row.sandboxProbeReviewId === latestProductionRouteReview.sandboxProbeReviewId)) &&
          (!latestSandboxProbeReview ||
            (row.adapterId === latestSandboxProbeReview.adapterId &&
              row.sandboxProbeReviewId === latestSandboxProbeReview.id &&
              row.sandboxProbeExecutionId === latestSandboxProbeReview.sandboxProbeExecutionId)) &&
          (!latestSandboxProbeExecution ||
            (row.adapterId === latestSandboxProbeExecution.adapterId &&
              row.sandboxProbeExecutionId === latestSandboxProbeExecution.id &&
              row.humanConfirmationId === latestSandboxProbeExecution.humanConfirmationId)) &&
          (!latestHumanConfirmation ||
            (row.adapterId === latestHumanConfirmation.adapterId &&
              row.humanConfirmationId === latestHumanConfirmation.id &&
              row.orchestrationExecutionId === latestHumanConfirmation.orchestrationExecutionId)) &&
          (!latestRuntimeReloadAcceptance ||
            (row.adapterId === latestRuntimeReloadAcceptance.adapterId &&
              row.acceptanceId === latestRuntimeReloadAcceptance.id)) &&
          (!latestRuntimeReloadExecution ||
            (row.adapterId === latestRuntimeReloadExecution.adapterId &&
              row.executionId === latestRuntimeReloadExecution.id)) &&
          (!latestRuntimeReloadPlan ||
            (row.adapterId === latestRuntimeReloadPlan.adapterId && row.planId === latestRuntimeReloadPlan.id)) &&
          (!latestEnvironmentBinding ||
            (row.adapterId === latestEnvironmentBinding.adapterId && row.bindingId === latestEnvironmentBinding.id)) &&
          (!latestSecretMaterialization ||
            (row.adapterId === latestSecretMaterialization.adapterId &&
              row.materializationId === latestSecretMaterialization.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionAdapterOpsStateRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterOpsStateRow[],
  latestPaperRouteRunbook: ExecutionAdapterPaperRouteRunbookRow | null,
  latestPaperOrderLifecycle: ExecutionAdapterPaperOrderLifecycleRow | null,
  latestSandboxOrderSchemaDryRun: ExecutionAdapterSandboxOrderSchemaDryRunRow | null,
  latestProductionRouteReview: ExecutionAdapterProductionRouteReviewRow | null,
  latestSandboxProbeReview: ExecutionAdapterSandboxProbeReviewRow | null,
  latestSandboxProbeExecution: ExecutionAdapterSandboxProbeExecutionRow | null,
  latestHumanConfirmation: ExecutionAdapterHumanConfirmationRow | null,
  latestRuntimeReloadAcceptance: ExecutionAdapterRuntimeReloadAcceptanceRow | null,
  latestRuntimeReloadExecution: ExecutionAdapterRuntimeReloadExecutionRow | null,
  latestRuntimeReloadPlan: ExecutionAdapterRuntimeReloadPlanRow | null,
  latestEnvironmentBinding: ExecutionAdapterEnvironmentBindingRow | null,
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null
): ExecutionAdapterOpsStateRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestPaperRouteRunbook ||
            (row.adapterId === latestPaperRouteRunbook.adapterId &&
              row.paperRouteRunbookId === latestPaperRouteRunbook.id &&
              row.paperOrderLifecycleId === latestPaperRouteRunbook.paperOrderLifecycleId)) &&
          (!latestPaperOrderLifecycle ||
            (row.adapterId === latestPaperOrderLifecycle.adapterId &&
              row.paperOrderLifecycleId === latestPaperOrderLifecycle.id &&
              row.sandboxOrderSchemaDryRunId === latestPaperOrderLifecycle.sandboxOrderSchemaDryRunId)) &&
          (!latestSandboxOrderSchemaDryRun ||
            (row.adapterId === latestSandboxOrderSchemaDryRun.adapterId &&
              row.sandboxOrderSchemaDryRunId === latestSandboxOrderSchemaDryRun.id &&
              row.productionRouteReviewId === latestSandboxOrderSchemaDryRun.productionRouteReviewId)) &&
          (!latestProductionRouteReview ||
            (row.adapterId === latestProductionRouteReview.adapterId &&
              row.productionRouteReviewId === latestProductionRouteReview.id &&
              row.sandboxProbeReviewId === latestProductionRouteReview.sandboxProbeReviewId)) &&
          (!latestSandboxProbeReview ||
            (row.adapterId === latestSandboxProbeReview.adapterId &&
              row.sandboxProbeReviewId === latestSandboxProbeReview.id &&
              row.sandboxProbeExecutionId === latestSandboxProbeReview.sandboxProbeExecutionId)) &&
          (!latestSandboxProbeExecution ||
            (row.adapterId === latestSandboxProbeExecution.adapterId &&
              row.sandboxProbeExecutionId === latestSandboxProbeExecution.id &&
              row.humanConfirmationId === latestSandboxProbeExecution.humanConfirmationId)) &&
          (!latestHumanConfirmation ||
            (row.adapterId === latestHumanConfirmation.adapterId &&
              row.humanConfirmationId === latestHumanConfirmation.id &&
              row.orchestrationExecutionId === latestHumanConfirmation.orchestrationExecutionId)) &&
          (!latestRuntimeReloadAcceptance ||
            (row.adapterId === latestRuntimeReloadAcceptance.adapterId &&
              row.acceptanceId === latestRuntimeReloadAcceptance.id)) &&
          (!latestRuntimeReloadExecution ||
            (row.adapterId === latestRuntimeReloadExecution.adapterId &&
              row.executionId === latestRuntimeReloadExecution.id)) &&
          (!latestRuntimeReloadPlan ||
            (row.adapterId === latestRuntimeReloadPlan.adapterId && row.planId === latestRuntimeReloadPlan.id)) &&
          (!latestEnvironmentBinding ||
            (row.adapterId === latestEnvironmentBinding.adapterId && row.bindingId === latestEnvironmentBinding.id)) &&
          (!latestSecretMaterialization ||
            (row.adapterId === latestSecretMaterialization.adapterId &&
              row.materializationId === latestSecretMaterialization.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionPaperRouteRunbookRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterPaperRouteRunbookRow[],
  latestPaperOrderLifecycle: ExecutionAdapterPaperOrderLifecycleRow | null,
  latestSandboxOrderSchemaDryRun: ExecutionAdapterSandboxOrderSchemaDryRunRow | null,
  latestProductionRouteReview: ExecutionAdapterProductionRouteReviewRow | null,
  latestSandboxProbeReview: ExecutionAdapterSandboxProbeReviewRow | null,
  latestSandboxProbeExecution: ExecutionAdapterSandboxProbeExecutionRow | null,
  latestHumanConfirmation: ExecutionAdapterHumanConfirmationRow | null,
  latestRuntimeReloadAcceptance: ExecutionAdapterRuntimeReloadAcceptanceRow | null,
  latestRuntimeReloadExecution: ExecutionAdapterRuntimeReloadExecutionRow | null,
  latestRuntimeReloadPlan: ExecutionAdapterRuntimeReloadPlanRow | null,
  latestEnvironmentBinding: ExecutionAdapterEnvironmentBindingRow | null,
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null
): ExecutionAdapterPaperRouteRunbookRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestPaperOrderLifecycle ||
            (row.adapterId === latestPaperOrderLifecycle.adapterId &&
              row.paperOrderLifecycleId === latestPaperOrderLifecycle.id &&
              row.sandboxOrderSchemaDryRunId === latestPaperOrderLifecycle.sandboxOrderSchemaDryRunId)) &&
          (!latestSandboxOrderSchemaDryRun ||
            (row.adapterId === latestSandboxOrderSchemaDryRun.adapterId &&
              row.sandboxOrderSchemaDryRunId === latestSandboxOrderSchemaDryRun.id &&
              row.productionRouteReviewId === latestSandboxOrderSchemaDryRun.productionRouteReviewId)) &&
          (!latestProductionRouteReview ||
            (row.adapterId === latestProductionRouteReview.adapterId &&
              row.productionRouteReviewId === latestProductionRouteReview.id &&
              row.sandboxProbeReviewId === latestProductionRouteReview.sandboxProbeReviewId)) &&
          (!latestSandboxProbeReview ||
            (row.adapterId === latestSandboxProbeReview.adapterId &&
              row.sandboxProbeReviewId === latestSandboxProbeReview.id &&
              row.sandboxProbeExecutionId === latestSandboxProbeReview.sandboxProbeExecutionId)) &&
          (!latestSandboxProbeExecution ||
            (row.adapterId === latestSandboxProbeExecution.adapterId &&
              row.sandboxProbeExecutionId === latestSandboxProbeExecution.id &&
              row.humanConfirmationId === latestSandboxProbeExecution.humanConfirmationId)) &&
          (!latestHumanConfirmation ||
            (row.adapterId === latestHumanConfirmation.adapterId &&
              row.humanConfirmationId === latestHumanConfirmation.id &&
              row.orchestrationExecutionId === latestHumanConfirmation.orchestrationExecutionId)) &&
          (!latestRuntimeReloadAcceptance ||
            (row.adapterId === latestRuntimeReloadAcceptance.adapterId &&
              row.acceptanceId === latestRuntimeReloadAcceptance.id)) &&
          (!latestRuntimeReloadExecution ||
            (row.adapterId === latestRuntimeReloadExecution.adapterId &&
              row.executionId === latestRuntimeReloadExecution.id)) &&
          (!latestRuntimeReloadPlan ||
            (row.adapterId === latestRuntimeReloadPlan.adapterId && row.planId === latestRuntimeReloadPlan.id)) &&
          (!latestEnvironmentBinding ||
            (row.adapterId === latestEnvironmentBinding.adapterId && row.bindingId === latestEnvironmentBinding.id)) &&
          (!latestSecretMaterialization ||
            (row.adapterId === latestSecretMaterialization.adapterId &&
              row.materializationId === latestSecretMaterialization.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionPaperOrderLifecycleRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterPaperOrderLifecycleRow[],
  latestSandboxOrderSchemaDryRun: ExecutionAdapterSandboxOrderSchemaDryRunRow | null,
  latestProductionRouteReview: ExecutionAdapterProductionRouteReviewRow | null,
  latestSandboxProbeReview: ExecutionAdapterSandboxProbeReviewRow | null,
  latestSandboxProbeExecution: ExecutionAdapterSandboxProbeExecutionRow | null,
  latestHumanConfirmation: ExecutionAdapterHumanConfirmationRow | null,
  latestRuntimeReloadAcceptance: ExecutionAdapterRuntimeReloadAcceptanceRow | null,
  latestRuntimeReloadExecution: ExecutionAdapterRuntimeReloadExecutionRow | null,
  latestRuntimeReloadPlan: ExecutionAdapterRuntimeReloadPlanRow | null,
  latestEnvironmentBinding: ExecutionAdapterEnvironmentBindingRow | null,
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null
): ExecutionAdapterPaperOrderLifecycleRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestSandboxOrderSchemaDryRun ||
            (row.adapterId === latestSandboxOrderSchemaDryRun.adapterId &&
              row.sandboxOrderSchemaDryRunId === latestSandboxOrderSchemaDryRun.id &&
              row.productionRouteReviewId === latestSandboxOrderSchemaDryRun.productionRouteReviewId)) &&
          (!latestProductionRouteReview ||
            (row.adapterId === latestProductionRouteReview.adapterId &&
              row.productionRouteReviewId === latestProductionRouteReview.id &&
              row.sandboxProbeReviewId === latestProductionRouteReview.sandboxProbeReviewId)) &&
          (!latestSandboxProbeReview ||
            (row.adapterId === latestSandboxProbeReview.adapterId &&
              row.sandboxProbeReviewId === latestSandboxProbeReview.id &&
              row.sandboxProbeExecutionId === latestSandboxProbeReview.sandboxProbeExecutionId)) &&
          (!latestSandboxProbeExecution ||
            (row.adapterId === latestSandboxProbeExecution.adapterId &&
              row.sandboxProbeExecutionId === latestSandboxProbeExecution.id &&
              row.humanConfirmationId === latestSandboxProbeExecution.humanConfirmationId)) &&
          (!latestHumanConfirmation ||
            (row.adapterId === latestHumanConfirmation.adapterId &&
              row.humanConfirmationId === latestHumanConfirmation.id &&
              row.orchestrationExecutionId === latestHumanConfirmation.orchestrationExecutionId)) &&
          (!latestRuntimeReloadAcceptance ||
            (row.adapterId === latestRuntimeReloadAcceptance.adapterId &&
              row.acceptanceId === latestRuntimeReloadAcceptance.id)) &&
          (!latestRuntimeReloadExecution ||
            (row.adapterId === latestRuntimeReloadExecution.adapterId &&
              row.executionId === latestRuntimeReloadExecution.id)) &&
          (!latestRuntimeReloadPlan ||
            (row.adapterId === latestRuntimeReloadPlan.adapterId && row.planId === latestRuntimeReloadPlan.id)) &&
          (!latestEnvironmentBinding ||
            (row.adapterId === latestEnvironmentBinding.adapterId && row.bindingId === latestEnvironmentBinding.id)) &&
          (!latestSecretMaterialization ||
            (row.adapterId === latestSecretMaterialization.adapterId &&
              row.materializationId === latestSecretMaterialization.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionSandboxOrderSchemaDryRunRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterSandboxOrderSchemaDryRunRow[],
  latestProductionRouteReview: ExecutionAdapterProductionRouteReviewRow | null,
  latestSandboxProbeReview: ExecutionAdapterSandboxProbeReviewRow | null,
  latestSandboxProbeExecution: ExecutionAdapterSandboxProbeExecutionRow | null,
  latestHumanConfirmation: ExecutionAdapterHumanConfirmationRow | null,
  latestRuntimeReloadAcceptance: ExecutionAdapterRuntimeReloadAcceptanceRow | null,
  latestRuntimeReloadExecution: ExecutionAdapterRuntimeReloadExecutionRow | null,
  latestRuntimeReloadPlan: ExecutionAdapterRuntimeReloadPlanRow | null,
  latestEnvironmentBinding: ExecutionAdapterEnvironmentBindingRow | null,
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null
): ExecutionAdapterSandboxOrderSchemaDryRunRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestProductionRouteReview ||
            (row.adapterId === latestProductionRouteReview.adapterId &&
              row.productionRouteReviewId === latestProductionRouteReview.id &&
              row.sandboxProbeReviewId === latestProductionRouteReview.sandboxProbeReviewId)) &&
          (!latestSandboxProbeReview ||
            (row.adapterId === latestSandboxProbeReview.adapterId &&
              row.sandboxProbeReviewId === latestSandboxProbeReview.id &&
              row.sandboxProbeExecutionId === latestSandboxProbeReview.sandboxProbeExecutionId)) &&
          (!latestSandboxProbeExecution ||
            (row.adapterId === latestSandboxProbeExecution.adapterId &&
              row.sandboxProbeExecutionId === latestSandboxProbeExecution.id &&
              row.humanConfirmationId === latestSandboxProbeExecution.humanConfirmationId)) &&
          (!latestHumanConfirmation ||
            (row.adapterId === latestHumanConfirmation.adapterId &&
              row.humanConfirmationId === latestHumanConfirmation.id &&
              row.orchestrationExecutionId === latestHumanConfirmation.orchestrationExecutionId)) &&
          (!latestRuntimeReloadAcceptance ||
            (row.adapterId === latestRuntimeReloadAcceptance.adapterId &&
              row.acceptanceId === latestRuntimeReloadAcceptance.id)) &&
          (!latestRuntimeReloadExecution ||
            (row.adapterId === latestRuntimeReloadExecution.adapterId &&
              row.executionId === latestRuntimeReloadExecution.id)) &&
          (!latestRuntimeReloadPlan ||
            (row.adapterId === latestRuntimeReloadPlan.adapterId && row.planId === latestRuntimeReloadPlan.id)) &&
          (!latestEnvironmentBinding ||
            (row.adapterId === latestEnvironmentBinding.adapterId && row.bindingId === latestEnvironmentBinding.id)) &&
          (!latestSecretMaterialization ||
            (row.adapterId === latestSecretMaterialization.adapterId &&
              row.materializationId === latestSecretMaterialization.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionProductionRouteReviewRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterProductionRouteReviewRow[],
  latestSandboxProbeReview: ExecutionAdapterSandboxProbeReviewRow | null,
  latestSandboxProbeExecution: ExecutionAdapterSandboxProbeExecutionRow | null,
  latestHumanConfirmation: ExecutionAdapterHumanConfirmationRow | null,
  latestRuntimeReloadAcceptance: ExecutionAdapterRuntimeReloadAcceptanceRow | null,
  latestRuntimeReloadExecution: ExecutionAdapterRuntimeReloadExecutionRow | null,
  latestRuntimeReloadPlan: ExecutionAdapterRuntimeReloadPlanRow | null,
  latestEnvironmentBinding: ExecutionAdapterEnvironmentBindingRow | null,
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null
): ExecutionAdapterProductionRouteReviewRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestSandboxProbeReview ||
            (row.adapterId === latestSandboxProbeReview.adapterId &&
              row.sandboxProbeReviewId === latestSandboxProbeReview.id &&
              row.sandboxProbeExecutionId === latestSandboxProbeReview.sandboxProbeExecutionId)) &&
          (!latestSandboxProbeExecution ||
            (row.adapterId === latestSandboxProbeExecution.adapterId &&
              row.sandboxProbeExecutionId === latestSandboxProbeExecution.id &&
              row.humanConfirmationId === latestSandboxProbeExecution.humanConfirmationId)) &&
          (!latestHumanConfirmation ||
            (row.adapterId === latestHumanConfirmation.adapterId &&
              row.humanConfirmationId === latestHumanConfirmation.id &&
              row.orchestrationExecutionId === latestHumanConfirmation.orchestrationExecutionId)) &&
          (!latestRuntimeReloadAcceptance ||
            (row.adapterId === latestRuntimeReloadAcceptance.adapterId &&
              row.acceptanceId === latestRuntimeReloadAcceptance.id)) &&
          (!latestRuntimeReloadExecution ||
            (row.adapterId === latestRuntimeReloadExecution.adapterId &&
              row.executionId === latestRuntimeReloadExecution.id)) &&
          (!latestRuntimeReloadPlan ||
            (row.adapterId === latestRuntimeReloadPlan.adapterId && row.planId === latestRuntimeReloadPlan.id)) &&
          (!latestEnvironmentBinding ||
            (row.adapterId === latestEnvironmentBinding.adapterId && row.bindingId === latestEnvironmentBinding.id)) &&
          (!latestSecretMaterialization ||
            (row.adapterId === latestSecretMaterialization.adapterId &&
              row.materializationId === latestSecretMaterialization.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionSandboxProbeReviewRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterSandboxProbeReviewRow[],
  latestSandboxProbeExecution: ExecutionAdapterSandboxProbeExecutionRow | null,
  latestHumanConfirmation: ExecutionAdapterHumanConfirmationRow | null,
  latestRuntimeReloadAcceptance: ExecutionAdapterRuntimeReloadAcceptanceRow | null,
  latestRuntimeReloadExecution: ExecutionAdapterRuntimeReloadExecutionRow | null,
  latestRuntimeReloadPlan: ExecutionAdapterRuntimeReloadPlanRow | null,
  latestEnvironmentBinding: ExecutionAdapterEnvironmentBindingRow | null,
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null
): ExecutionAdapterSandboxProbeReviewRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestSandboxProbeExecution ||
            (row.adapterId === latestSandboxProbeExecution.adapterId &&
              row.sandboxProbeExecutionId === latestSandboxProbeExecution.id &&
              row.humanConfirmationId === latestSandboxProbeExecution.humanConfirmationId)) &&
          (!latestHumanConfirmation ||
            (row.adapterId === latestHumanConfirmation.adapterId &&
              row.humanConfirmationId === latestHumanConfirmation.id &&
              row.orchestrationExecutionId === latestHumanConfirmation.orchestrationExecutionId)) &&
          (!latestRuntimeReloadAcceptance ||
            (row.adapterId === latestRuntimeReloadAcceptance.adapterId &&
              row.acceptanceId === latestRuntimeReloadAcceptance.id)) &&
          (!latestRuntimeReloadExecution ||
            (row.adapterId === latestRuntimeReloadExecution.adapterId &&
              row.executionId === latestRuntimeReloadExecution.id)) &&
          (!latestRuntimeReloadPlan ||
            (row.adapterId === latestRuntimeReloadPlan.adapterId && row.planId === latestRuntimeReloadPlan.id)) &&
          (!latestEnvironmentBinding ||
            (row.adapterId === latestEnvironmentBinding.adapterId && row.bindingId === latestEnvironmentBinding.id)) &&
          (!latestSecretMaterialization ||
            (row.adapterId === latestSecretMaterialization.adapterId &&
              row.materializationId === latestSecretMaterialization.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}
