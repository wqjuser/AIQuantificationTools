import { PlatformSettingsStatus, recordExecutionAdapterCertification, recordExecutionAdapterHumanConfirmation, recordExecutionAdapterOpsState, recordExecutionAdapterOrchestrationDryRun, recordExecutionAdapterOrchestrationExecution, recordExecutionAdapterProductionRouteReview, recordExecutionAdapterRuntimeReloadAcceptance, recordExecutionAdapterSandboxProbeExecution, recordExecutionAdapterSandboxProbePlan, recordExecutionAdapterSandboxProbeReview } from "../../../lib/terminal-api";
import { ExecutionAdapterHumanConfirmationRow, ExecutionAdapterOrchestrationDryRunRow, ExecutionAdapterOrchestrationExecutionRow, ExecutionAdapterPaperRouteRunbookRow, ExecutionAdapterRuntimeReloadAcceptanceRow, ExecutionAdapterRuntimeReloadExecutionRow, ExecutionAdapterSandboxProbeExecutionRow, ExecutionAdapterSandboxProbePlanRow, ExecutionAdapterSandboxProbeReviewRow } from "../../../lib/terminal-workbench";
import { quantCoreBaseUrl } from "../../app-shell/initial-state";
import { loadAutoTradingSnapshot } from "../../dynamic-trading/ExecutionAutoPaperTradingSection";
import { buildAdapterCertificationEvidenceChecks } from "../certification-evidence";
import { createDefaultExecutionAdapterHumanConfirmationConfirmations, createDefaultExecutionAdapterOpsStateConfirmations, createDefaultExecutionAdapterOrchestrationDryRunConfirmations, createDefaultExecutionAdapterOrchestrationExecutionConfirmations, createDefaultExecutionAdapterProductionRouteReviewConfirmations, createDefaultExecutionAdapterRuntimeReloadAcceptanceConfirmations, createDefaultExecutionAdapterSandboxProbeExecutionConfirmations, createDefaultExecutionAdapterSandboxProbePlanConfirmations, createDefaultExecutionAdapterSandboxProbeReviewConfirmations } from "../ExecutionConfirmations";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "adapterHumanConfirmationConfirmations" | "adapterOpsStateConfirmations" | "adapterOrchestrationDryRunConfirmations" | "adapterOrchestrationExecutionConfirmations" | "adapterProductionRouteReviewConfirmations" | "adapterRuntimeReloadAcceptanceConfirmations" | "adapterSandboxProbeExecutionConfirmations" | "adapterSandboxProbePlanConfirmations" | "adapterSandboxProbeReviewConfirmations" | "authoritativeFooterSnapshotExpected" | "autoTradingSnapshot" | "error" | "executionAdapterCertifications" | "executionAdapterHealthProbe" | "executionAdapterHumanConfirmations" | "executionAdapterOpsStates" | "executionAdapterOrchestrationDryRuns" | "executionAdapterOrchestrationExecutions" | "executionAdapterProductionRouteReviews" | "executionAdapterRuntimeReloadAcceptances" | "executionAdapterSandboxProbeExecutions" | "executionAdapterSandboxProbePlans" | "executionAdapterSandboxProbeReviews" | "isLiveTradingGateDialogOpen" | "recordingAdapterCertificationId" | "recordingAdapterHumanConfirmationId" | "recordingAdapterOpsStateId" | "recordingAdapterOrchestrationDryRunId" | "recordingAdapterOrchestrationExecutionId" | "recordingAdapterProductionRouteReviewId" | "recordingAdapterRuntimeReloadAcceptanceId" | "recordingAdapterSandboxProbeExecutionId" | "recordingAdapterSandboxProbePlanId" | "recordingAdapterSandboxProbeReviewId" | "refreshGoldenPathStatus" | "refreshSettingsStatus" | "setAdapterHumanConfirmationConfirmations" | "setAdapterOpsStateConfirmations" | "setAdapterOrchestrationDryRunConfirmations" | "setAdapterOrchestrationExecutionConfirmations" | "setAdapterProductionRouteReviewConfirmations" | "setAdapterRuntimeReloadAcceptanceConfirmations" | "setAdapterSandboxProbeExecutionConfirmations" | "setAdapterSandboxProbePlanConfirmations" | "setAdapterSandboxProbeReviewConfirmations" | "setAutoTradingSnapshot" | "setExecutionAdapterCertifications" | "setExecutionAdapterHealthProbe" | "setExecutionAdapterHumanConfirmations" | "setExecutionAdapterOpsStates" | "setExecutionAdapterOrchestrationDryRuns" | "setExecutionAdapterOrchestrationExecutions" | "setExecutionAdapterProductionRouteReviews" | "setExecutionAdapterRuntimeReloadAcceptances" | "setExecutionAdapterSandboxProbeExecutions" | "setExecutionAdapterSandboxProbePlans" | "setExecutionAdapterSandboxProbeReviews" | "setIsLiveTradingGateDialogOpen" | "setRecordingAdapterCertificationId" | "setRecordingAdapterHumanConfirmationId" | "setRecordingAdapterOpsStateId" | "setRecordingAdapterOrchestrationDryRunId" | "setRecordingAdapterOrchestrationExecutionId" | "setRecordingAdapterProductionRouteReviewId" | "setRecordingAdapterRuntimeReloadAcceptanceId" | "setRecordingAdapterSandboxProbeExecutionId" | "setRecordingAdapterSandboxProbePlanId" | "setRecordingAdapterSandboxProbeReviewId" | "setSettingsStatus" | "setWorkspaceState" | "settingsStatus" | "source" | "statusLabel" | "workspace">;
type Result = Pick<AppControllerBindings, "recordAdapterCertificationEvidence" | "recordAdapterRuntimeReloadAcceptance" | "recordAdapterOrchestrationDryRun" | "recordAdapterOrchestrationExecution" | "recordAdapterHumanConfirmation" | "recordAdapterSandboxProbePlan" | "recordAdapterSandboxProbeExecution" | "recordAdapterSandboxProbeReview" | "recordAdapterProductionRouteReview" | "recordAdapterOpsState" | "completeLiveTradingGate" | "executionMode" | "footerExecutionSafety" | "footerExecutionStateAvailable" | "currentExecutionMode">;

export function useAdapterEvidenceActions(controller: Dependencies): Result {
  const {
    adapterHumanConfirmationConfirmations, adapterOpsStateConfirmations, adapterOrchestrationDryRunConfirmations, adapterOrchestrationExecutionConfirmations, adapterProductionRouteReviewConfirmations, adapterRuntimeReloadAcceptanceConfirmations,
    adapterSandboxProbeExecutionConfirmations, adapterSandboxProbePlanConfirmations, adapterSandboxProbeReviewConfirmations, authoritativeFooterSnapshotExpected, autoTradingSnapshot, error,
    executionAdapterCertifications, executionAdapterHealthProbe, executionAdapterHumanConfirmations, executionAdapterOpsStates, executionAdapterOrchestrationDryRuns, executionAdapterOrchestrationExecutions,
    executionAdapterProductionRouteReviews, executionAdapterRuntimeReloadAcceptances, executionAdapterSandboxProbeExecutions, executionAdapterSandboxProbePlans, executionAdapterSandboxProbeReviews, isLiveTradingGateDialogOpen,
    recordingAdapterCertificationId, recordingAdapterHumanConfirmationId, recordingAdapterOpsStateId, recordingAdapterOrchestrationDryRunId, recordingAdapterOrchestrationExecutionId, recordingAdapterProductionRouteReviewId,
    recordingAdapterRuntimeReloadAcceptanceId, recordingAdapterSandboxProbeExecutionId, recordingAdapterSandboxProbePlanId, recordingAdapterSandboxProbeReviewId, refreshGoldenPathStatus, refreshSettingsStatus,
    setAdapterHumanConfirmationConfirmations, setAdapterOpsStateConfirmations, setAdapterOrchestrationDryRunConfirmations, setAdapterOrchestrationExecutionConfirmations, setAdapterProductionRouteReviewConfirmations, setAdapterRuntimeReloadAcceptanceConfirmations,
    setAdapterSandboxProbeExecutionConfirmations, setAdapterSandboxProbePlanConfirmations, setAdapterSandboxProbeReviewConfirmations, setAutoTradingSnapshot, setExecutionAdapterCertifications, setExecutionAdapterHealthProbe,
    setExecutionAdapterHumanConfirmations, setExecutionAdapterOpsStates, setExecutionAdapterOrchestrationDryRuns, setExecutionAdapterOrchestrationExecutions, setExecutionAdapterProductionRouteReviews, setExecutionAdapterRuntimeReloadAcceptances,
    setExecutionAdapterSandboxProbeExecutions, setExecutionAdapterSandboxProbePlans, setExecutionAdapterSandboxProbeReviews, setIsLiveTradingGateDialogOpen, setRecordingAdapterCertificationId, setRecordingAdapterHumanConfirmationId,
    setRecordingAdapterOpsStateId, setRecordingAdapterOrchestrationDryRunId, setRecordingAdapterOrchestrationExecutionId, setRecordingAdapterProductionRouteReviewId, setRecordingAdapterRuntimeReloadAcceptanceId, setRecordingAdapterSandboxProbeExecutionId,
    setRecordingAdapterSandboxProbePlanId, setRecordingAdapterSandboxProbeReviewId, setSettingsStatus, setWorkspaceState, settingsStatus, source,
    statusLabel, workspace
  } = controller;
  const recordAdapterCertificationEvidence = useCallback(
      async (adapter: PlatformSettingsStatus["executionAdapters"][number]) => {
        const timestamp = new Date().toISOString();
        setRecordingAdapterCertificationId(adapter.id);
        try {
          const result = await recordExecutionAdapterCertification(quantCoreBaseUrl, {
            adapterId: adapter.id,
            market: adapter.market,
            route: adapter.route,
            operator: "settings-panel",
            startedAt: timestamp,
            completedAt: timestamp,
            checks: buildAdapterCertificationEvidenceChecks(adapter),
            metadata: {
              adapterStatus: adapter.status,
              liveTradingAllowed: adapter.liveTradingAllowed,
              source: "settings-panel"
            }
          });
          if (result.adapterCertification) {
            setExecutionAdapterCertifications((current) => [
              result.adapterCertification!,
              ...current.filter((row) => row.certificationId !== result.adapterCertification!.certificationId)
            ]);
          }
          if (result.error) {
            setWorkspaceState((current) => ({
              ...current,
              error: result.error,
              statusLabel: "Adapter certification evidence failed"
            }));
          } else {
            setWorkspaceState((current) => ({
              ...current,
              error: undefined,
              statusLabel: `Adapter certification recorded · ${adapter.id}`
            }));
            await refreshSettingsStatus();
          }
        } finally {
          setRecordingAdapterCertificationId(null);
        }
      },
      [refreshSettingsStatus]
    );
  const recordAdapterRuntimeReloadAcceptance = useCallback(
      async (row: ExecutionAdapterRuntimeReloadExecutionRow) => {
        const confirmations =
          adapterRuntimeReloadAcceptanceConfirmations[row.id] ??
          createDefaultExecutionAdapterRuntimeReloadAcceptanceConfirmations();
        setRecordingAdapterRuntimeReloadAcceptanceId(row.id);
        try {
          const result = await recordExecutionAdapterRuntimeReloadAcceptance(quantCoreBaseUrl, {
            acceptanceMode: "manual_runtime_reload_acceptance",
            adapterId: row.adapterId,
            confirmations,
            executionId: row.id,
            metadata: {
              bindingId: row.bindingId,
              materializationId: row.materializationId,
              planId: row.planId,
              source: "settings-panel"
            },
            operator: "settings-panel"
          });
          if (result.adapterRuntimeReloadAcceptance) {
            setExecutionAdapterRuntimeReloadAcceptances((current) => [
              result.adapterRuntimeReloadAcceptance!,
              ...current.filter(
                (currentRow) =>
                  currentRow.acceptanceId !== result.adapterRuntimeReloadAcceptance!.acceptanceId
              )
            ]);
          }
          if (result.error) {
            setWorkspaceState((current) => ({
              ...current,
              error: result.error,
              statusLabel: "Runtime reload acceptance recording failed"
            }));
          } else {
            const status = result.adapterRuntimeReloadAcceptance?.status ?? "blocked";
            setWorkspaceState((current) => ({
              ...current,
              error: undefined,
              statusLabel:
                status === "acceptance_recorded"
                  ? `Runtime reload acceptance recorded · ${row.adapterId}`
                  : `Runtime reload acceptance blocked · ${row.adapterId}`
            }));
            await refreshSettingsStatus();
          }
        } finally {
          setRecordingAdapterRuntimeReloadAcceptanceId(null);
        }
      },
      [adapterRuntimeReloadAcceptanceConfirmations, refreshSettingsStatus]
    );
  const recordAdapterOrchestrationDryRun = useCallback(
      async (row: ExecutionAdapterRuntimeReloadAcceptanceRow) => {
        const confirmations =
          adapterOrchestrationDryRunConfirmations[row.id] ??
          createDefaultExecutionAdapterOrchestrationDryRunConfirmations();
        setRecordingAdapterOrchestrationDryRunId(row.id);
        try {
          const result = await recordExecutionAdapterOrchestrationDryRun(quantCoreBaseUrl, {
            acceptanceId: row.id,
            adapterId: row.adapterId,
            confirmations,
            metadata: {
              bindingId: row.bindingId,
              executionId: row.executionId,
              materializationId: row.materializationId,
              planId: row.planId,
              source: "settings-panel"
            },
            operator: "settings-panel",
            orchestrationMode: "manual_adapter_orchestration_dry_run"
          });
          if (result.adapterOrchestrationDryRun) {
            setExecutionAdapterOrchestrationDryRuns((current) => [
              result.adapterOrchestrationDryRun!,
              ...current.filter(
                (currentRow) =>
                  currentRow.dryRunId !== result.adapterOrchestrationDryRun!.dryRunId
              )
            ]);
          }
          if (result.error) {
            setWorkspaceState((current) => ({
              ...current,
              error: result.error,
              statusLabel: "Adapter orchestration dry run failed"
            }));
          } else {
            const status = result.adapterOrchestrationDryRun?.status ?? "blocked";
            setWorkspaceState((current) => ({
              ...current,
              error: undefined,
              statusLabel:
                status === "dry_run_recorded"
                  ? `Adapter orchestration dry run recorded · ${row.adapterId}`
                  : `Adapter orchestration dry run blocked · ${row.adapterId}`
            }));
            await refreshSettingsStatus();
          }
        } finally {
          setRecordingAdapterOrchestrationDryRunId(null);
        }
      },
      [adapterOrchestrationDryRunConfirmations, refreshSettingsStatus]
    );
  const recordAdapterOrchestrationExecution = useCallback(
      async (row: ExecutionAdapterOrchestrationDryRunRow) => {
        const confirmations =
          adapterOrchestrationExecutionConfirmations[row.id] ??
          createDefaultExecutionAdapterOrchestrationExecutionConfirmations();
        setRecordingAdapterOrchestrationExecutionId(row.id);
        try {
          const result = await recordExecutionAdapterOrchestrationExecution(quantCoreBaseUrl, {
            adapterId: row.adapterId,
            confirmations,
            dryRunId: row.id,
            metadata: {
              acceptanceId: row.acceptanceId,
              bindingId: row.bindingId,
              executionId: row.executionId,
              materializationId: row.materializationId,
              planId: row.planId,
              source: "settings-panel"
            },
            operator: "settings-panel",
            orchestrationExecutionMode: "manual_adapter_orchestration_execution"
          });
          if (result.adapterOrchestrationExecution) {
            setExecutionAdapterOrchestrationExecutions((current) => [
              result.adapterOrchestrationExecution!,
              ...current.filter(
                (currentRow) =>
                  currentRow.orchestrationExecutionId !== result.adapterOrchestrationExecution!.orchestrationExecutionId
              )
            ]);
          }
          if (result.error) {
            setWorkspaceState((current) => ({
              ...current,
              error: result.error,
              statusLabel: "Adapter orchestration execution failed"
            }));
          } else {
            const status = result.adapterOrchestrationExecution?.status ?? "blocked";
            setWorkspaceState((current) => ({
              ...current,
              error: undefined,
              statusLabel:
                status === "execution_recorded"
                  ? `Adapter orchestration execution recorded · ${row.adapterId}`
                  : `Adapter orchestration execution blocked · ${row.adapterId}`
            }));
            await refreshSettingsStatus();
          }
        } finally {
          setRecordingAdapterOrchestrationExecutionId(null);
        }
      },
      [adapterOrchestrationExecutionConfirmations, refreshSettingsStatus]
    );
  const recordAdapterHumanConfirmation = useCallback(
      async (row: ExecutionAdapterOrchestrationExecutionRow) => {
        const confirmations =
          adapterHumanConfirmationConfirmations[row.id] ??
          createDefaultExecutionAdapterHumanConfirmationConfirmations();
        setRecordingAdapterHumanConfirmationId(row.id);
        try {
          const result = await recordExecutionAdapterHumanConfirmation(quantCoreBaseUrl, {
            adapterId: row.adapterId,
            confirmationMode: "manual_final_human_confirmation",
            confirmations,
            metadata: {
              acceptanceId: row.acceptanceId,
              bindingId: row.bindingId,
              dryRunId: row.dryRunId,
              executionId: row.executionId,
              materializationId: row.materializationId,
              planId: row.planId,
              source: "settings-panel"
            },
            operator: "settings-panel",
            orchestrationExecutionId: row.id
          });
          if (result.adapterHumanConfirmation) {
            setExecutionAdapterHumanConfirmations((current) => [
              result.adapterHumanConfirmation!,
              ...current.filter(
                (currentRow) => currentRow.humanConfirmationId !== result.adapterHumanConfirmation!.humanConfirmationId
              )
            ]);
          }
          if (result.error) {
            setWorkspaceState((current) => ({
              ...current,
              error: result.error,
              statusLabel: "Adapter human confirmation failed"
            }));
          } else {
            const status = result.adapterHumanConfirmation?.status ?? "blocked";
            setWorkspaceState((current) => ({
              ...current,
              error: undefined,
              statusLabel:
                status === "confirmation_recorded"
                  ? `Adapter human confirmation recorded · ${row.adapterId}`
                  : `Adapter human confirmation blocked · ${row.adapterId}`
            }));
            await refreshSettingsStatus();
          }
        } finally {
          setRecordingAdapterHumanConfirmationId(null);
        }
      },
      [adapterHumanConfirmationConfirmations, refreshSettingsStatus]
    );
  const recordAdapterSandboxProbePlan = useCallback(
      async (row: ExecutionAdapterHumanConfirmationRow) => {
        const confirmations =
          adapterSandboxProbePlanConfirmations[row.id] ??
          createDefaultExecutionAdapterSandboxProbePlanConfirmations();
        setRecordingAdapterSandboxProbePlanId(row.id);
        try {
          const result = await recordExecutionAdapterSandboxProbePlan(quantCoreBaseUrl, {
            adapterId: row.adapterId,
            confirmations,
            humanConfirmationId: row.id,
            metadata: {
              acceptanceId: row.acceptanceId,
              bindingId: row.bindingId,
              dryRunId: row.dryRunId,
              executionId: row.executionId,
              materializationId: row.materializationId,
              orchestrationExecutionId: row.orchestrationExecutionId,
              planId: row.planId,
              source: "settings-panel"
            },
            operator: "settings-panel",
            probeMode: "manual_sandbox_probe_plan"
          });
          if (result.adapterSandboxProbePlan) {
            setExecutionAdapterSandboxProbePlans((current) => [
              result.adapterSandboxProbePlan!,
              ...current.filter(
                (currentRow) =>
                  currentRow.sandboxProbePlanId !== result.adapterSandboxProbePlan!.sandboxProbePlanId
              )
            ]);
          }
          if (result.error) {
            setWorkspaceState((current) => ({
              ...current,
              error: result.error,
              statusLabel: "Adapter sandbox probe plan failed"
            }));
          } else {
            const status = result.adapterSandboxProbePlan?.status ?? "blocked";
            setWorkspaceState((current) => ({
              ...current,
              error: undefined,
              statusLabel:
                status === "probe_plan_recorded"
                  ? `Adapter sandbox probe plan recorded · ${row.adapterId}`
                  : `Adapter sandbox probe plan blocked · ${row.adapterId}`
            }));
            await refreshSettingsStatus();
          }
        } finally {
          setRecordingAdapterSandboxProbePlanId(null);
        }
      },
      [adapterSandboxProbePlanConfirmations, refreshSettingsStatus]
    );
  const recordAdapterSandboxProbeExecution = useCallback(
      async (row: ExecutionAdapterSandboxProbePlanRow) => {
        const confirmations =
          adapterSandboxProbeExecutionConfirmations[row.id] ??
          createDefaultExecutionAdapterSandboxProbeExecutionConfirmations();
        setRecordingAdapterSandboxProbeExecutionId(row.id);
        try {
          const result = await recordExecutionAdapterSandboxProbeExecution(quantCoreBaseUrl, {
            adapterId: row.adapterId,
            confirmations,
            metadata: {
              acceptanceId: row.acceptanceId,
              bindingId: row.bindingId,
              dryRunId: row.dryRunId,
              executionId: row.executionId,
              humanConfirmationId: row.humanConfirmationId,
              materializationId: row.materializationId,
              orchestrationExecutionId: row.orchestrationExecutionId,
              planId: row.planId,
              probeMode: row.probeMode,
              source: "settings-panel"
            },
            operator: "settings-panel",
            probeExecutionMode: "manual_readonly_sandbox_probe",
            sandboxProbePlanId: row.id
          });
          if (result.adapterSandboxProbeExecution) {
            setExecutionAdapterSandboxProbeExecutions((current) => [
              result.adapterSandboxProbeExecution!,
              ...current.filter(
                (currentRow) =>
                  currentRow.sandboxProbeExecutionId !== result.adapterSandboxProbeExecution!.sandboxProbeExecutionId
              )
            ]);
          }
          if (result.adapterHealthProbe) {
            setExecutionAdapterHealthProbe({ adapterHealthProbe: result.adapterHealthProbe, source: "core" });
          }
          if (result.error) {
            setWorkspaceState((current) => ({
              ...current,
              error: result.error,
              statusLabel: "Adapter sandbox probe execution failed"
            }));
          } else {
            const status = result.adapterSandboxProbeExecution?.status ?? "blocked";
            setWorkspaceState((current) => ({
              ...current,
              error: undefined,
              statusLabel:
                status === "probe_execution_recorded"
                  ? `Adapter sandbox probe execution recorded · ${row.adapterId}`
                  : `Adapter sandbox probe execution blocked · ${row.adapterId}`
            }));
            await refreshSettingsStatus();
          }
        } finally {
          setRecordingAdapterSandboxProbeExecutionId(null);
        }
      },
      [adapterSandboxProbeExecutionConfirmations, refreshSettingsStatus]
    );
  const recordAdapterSandboxProbeReview = useCallback(
      async (row: ExecutionAdapterSandboxProbeExecutionRow) => {
        const confirmations =
          adapterSandboxProbeReviewConfirmations[row.id] ??
          createDefaultExecutionAdapterSandboxProbeReviewConfirmations();
        setRecordingAdapterSandboxProbeReviewId(row.id);
        try {
          const result = await recordExecutionAdapterSandboxProbeReview(quantCoreBaseUrl, {
            adapterId: row.adapterId,
            confirmations,
            metadata: {
              acceptanceId: row.acceptanceId,
              bindingId: row.bindingId,
              dryRunId: row.dryRunId,
              executionId: row.executionId,
              humanConfirmationId: row.humanConfirmationId,
              materializationId: row.materializationId,
              orchestrationExecutionId: row.orchestrationExecutionId,
              planId: row.planId,
              probeExecutionMode: row.probeExecutionMode,
              probeMode: row.probeMode,
              sandboxProbePlanId: row.sandboxProbePlanId,
              source: "settings-panel"
            },
            operator: "settings-panel",
            reviewMode: "manual_sandbox_probe_review",
            sandboxProbeExecutionId: row.id
          });
          if (result.adapterSandboxProbeReview) {
            setExecutionAdapterSandboxProbeReviews((current) => [
              result.adapterSandboxProbeReview!,
              ...current.filter(
                (currentRow) =>
                  currentRow.sandboxProbeReviewId !== result.adapterSandboxProbeReview!.sandboxProbeReviewId
              )
            ]);
          }
          if (result.error) {
            setWorkspaceState((current) => ({
              ...current,
              error: result.error,
              statusLabel: "Adapter sandbox probe review failed"
            }));
          } else {
            const status = result.adapterSandboxProbeReview?.status ?? "blocked";
            setWorkspaceState((current) => ({
              ...current,
              error: undefined,
              statusLabel:
                status === "probe_review_recorded"
                  ? `Adapter sandbox probe review recorded · ${row.adapterId}`
                  : `Adapter sandbox probe review blocked · ${row.adapterId}`
            }));
            await refreshSettingsStatus();
          }
        } finally {
          setRecordingAdapterSandboxProbeReviewId(null);
        }
      },
      [adapterSandboxProbeReviewConfirmations, refreshSettingsStatus]
    );
  const recordAdapterProductionRouteReview = useCallback(
      async (row: ExecutionAdapterSandboxProbeReviewRow) => {
        const confirmations =
          adapterProductionRouteReviewConfirmations[row.id] ??
          createDefaultExecutionAdapterProductionRouteReviewConfirmations();
        setRecordingAdapterProductionRouteReviewId(row.id);
        try {
          const result = await recordExecutionAdapterProductionRouteReview(quantCoreBaseUrl, {
            adapterId: row.adapterId,
            confirmations,
            metadata: {
              acceptanceId: row.acceptanceId,
              bindingId: row.bindingId,
              dryRunId: row.dryRunId,
              executionId: row.executionId,
              humanConfirmationId: row.humanConfirmationId,
              materializationId: row.materializationId,
              orchestrationExecutionId: row.orchestrationExecutionId,
              planId: row.planId,
              probeExecutionMode: row.probeExecutionMode,
              probeMode: row.probeMode,
              sandboxProbeExecutionId: row.sandboxProbeExecutionId,
              sandboxProbePlanId: row.sandboxProbePlanId,
              sandboxReviewMode: row.reviewMode,
              source: "settings-panel"
            },
            operator: "settings-panel",
            reviewMode: "manual_production_route_review",
            sandboxProbeReviewId: row.id
          });
          if (result.adapterProductionRouteReview) {
            setExecutionAdapterProductionRouteReviews((current) => [
              result.adapterProductionRouteReview!,
              ...current.filter(
                (currentRow) =>
                  currentRow.productionRouteReviewId !==
                  result.adapterProductionRouteReview!.productionRouteReviewId
              )
            ]);
          }
          if (result.error) {
            setWorkspaceState((current) => ({
              ...current,
              error: result.error,
              statusLabel: "Adapter production route review failed"
            }));
          } else {
            const status = result.adapterProductionRouteReview?.status ?? "blocked";
            setWorkspaceState((current) => ({
              ...current,
              error: undefined,
              statusLabel:
                status === "route_review_recorded"
                  ? `Adapter production route review recorded · ${row.adapterId}`
                  : `Adapter production route review blocked · ${row.adapterId}`
            }));
            await refreshSettingsStatus();
          }
        } finally {
          setRecordingAdapterProductionRouteReviewId(null);
        }
      },
      [adapterProductionRouteReviewConfirmations, refreshSettingsStatus]
    );
  const recordAdapterOpsState = useCallback(
      async (row: ExecutionAdapterPaperRouteRunbookRow) => {
        const confirmations =
          adapterOpsStateConfirmations[row.id] ?? createDefaultExecutionAdapterOpsStateConfirmations();
        setRecordingAdapterOpsStateId(row.id);
        try {
          const result = await recordExecutionAdapterOpsState(quantCoreBaseUrl, {
            adapterId: row.adapterId,
            confirmations,
            metadata: {
              acceptanceId: row.acceptanceId,
              bindingId: row.bindingId,
              dryRunId: row.dryRunId,
              executionId: row.executionId,
              lifecycleMode: row.lifecycleMode,
              materializationId: row.materializationId,
              orchestrationExecutionId: row.orchestrationExecutionId,
              paperOrderLifecycleId: row.paperOrderLifecycleId,
              planId: row.planId,
              productionRouteReviewId: row.productionRouteReviewId,
              runbookMode: row.runbookMode,
              sandboxOrderSchemaDryRunId: row.sandboxOrderSchemaDryRunId,
              sandboxProbeExecutionId: row.sandboxProbeExecutionId,
              sandboxProbePlanId: row.sandboxProbePlanId,
              sandboxProbeReviewId: row.sandboxProbeReviewId,
              source: "settings-panel"
            },
            operator: "settings-panel",
            opsMode: "manual_adapter_ops_state",
            paperRouteRunbookId: row.id
          });
          if (result.adapterOpsState) {
            setExecutionAdapterOpsStates((current) => [
              result.adapterOpsState!,
              ...current.filter((currentRow) => currentRow.adapterOpsStateId !== result.adapterOpsState!.adapterOpsStateId)
            ]);
          }
          if (result.error) {
            setWorkspaceState((current) => ({
              ...current,
              error: result.error,
              statusLabel: "Adapter ops state failed"
            }));
          } else {
            const status = result.adapterOpsState?.status ?? "blocked";
            setWorkspaceState((current) => ({
              ...current,
              error: undefined,
              statusLabel:
                status === "ops_state_recorded"
                  ? `Adapter ops state recorded · ${row.adapterId}`
                  : `Adapter ops state blocked · ${row.adapterId}`
            }));
            await refreshSettingsStatus();
          }
        } finally {
          setRecordingAdapterOpsStateId(null);
        }
      },
      [adapterOpsStateConfirmations, refreshSettingsStatus]
    );
  const completeLiveTradingGate = useCallback(async () => {
      setAutoTradingSnapshot(null);
      const snapshot = await loadAutoTradingSnapshot(quantCoreBaseUrl);
      setAutoTradingSnapshot(snapshot);
      await Promise.all([
        refreshGoldenPathStatus(),
        refreshSettingsStatus()
      ]);
      setIsLiveTradingGateDialogOpen(false);
    }, [quantCoreBaseUrl, refreshGoldenPathStatus, refreshSettingsStatus]);
  const executionMode =
      autoTradingSnapshot?.state.executionMode
      ?? settingsStatus.settings?.safety.executionMode
      ?? "paper";
  const footerExecutionSafety = settingsStatus.settings?.safety;
  const footerExecutionStateAvailable = authoritativeFooterSnapshotExpected
      ? autoTradingSnapshot !== null
      : Boolean(footerExecutionSafety);
  const currentExecutionMode = authoritativeFooterSnapshotExpected
      ? autoTradingSnapshot?.state.executionMode ?? footerExecutionSafety?.executionMode
      : footerExecutionSafety?.executionMode;
  return {
    recordAdapterCertificationEvidence, recordAdapterRuntimeReloadAcceptance, recordAdapterOrchestrationDryRun, recordAdapterOrchestrationExecution, recordAdapterHumanConfirmation, recordAdapterSandboxProbePlan,
    recordAdapterSandboxProbeExecution, recordAdapterSandboxProbeReview, recordAdapterProductionRouteReview, recordAdapterOpsState, completeLiveTradingGate, executionMode,
    footerExecutionSafety, footerExecutionStateAvailable, currentExecutionMode
  };
}
