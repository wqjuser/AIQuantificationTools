import { runStage7ProductionReadonlyProbe } from "../../../lib/stage7-production-readonly";
import { loadStage8ProductionReadonlyContinuity, setStage8ProductionReadonlyAccess } from "../../../lib/stage8-readonly-continuity";
import { buildExecutionAdapterPreLiveRunbookAuditEvent, recordExecutionAdapterCertificationApply, saveAuditEvent } from "../../../lib/terminal-api";
import { buildBrokerAdapterRows, buildExecutionAdapterChainHealthRollups, buildExecutionAdapterPreLiveRunbookMarkdown, buildExecutionAdapterPreLiveRunbookSummary, buildPreLiveRunbookAuditCoverage, createDefaultExecutionAdapterCertificationApplyConfirmations, ExecutionAdapterCertificationRow, ExecutionAdapterPaperExecutionAuditLedgerRow } from "../../../lib/terminal-workbench";
import { AUDIT_REPORT_EVENTS_PAGE_SIZE, quantCoreBaseUrl } from "../../app-shell/initial-state";
import { buildExecutionAdapterPaperExecutionEvidenceUrl } from "../../app-shell/url-state";
import { adapterChainHealthDetailLabel, adapterChainHealthStageLabel, adapterChainHealthStatusLabel } from "../../audit/AuditControlFormatters";
import { mergeAuditEvidenceReportEvent } from "../../audit/event-merges";
import { adapterCertificationAdapterName, adapterCertificationApplyBlockerSummary, adapterHealthProbeBoundaryLabel, adapterHealthProbeCredentialSummaryLabel, adapterHealthProbeStatusLabel, adapterLedgerAdapterName, adapterLedgerLabel, adapterLedgerNextStep, adapterLedgerReason, brokerAdapterName, brokerCertificationLabel, brokerNextStepLabel } from "../AdapterFormatters";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "adapterCertificationApplyConfirmations" | "applyingAdapterCertificationId" | "auditEvidenceReportEvents" | "auditEvidenceReportLedgerRows" | "copiedPreLiveRunbook" | "error" | "executionAdapterCertificationApplies" | "executionAdapterCertificationRows" | "executionAdapterEnvironmentBindingRows" | "executionAdapterHealthProbeRows" | "executionAdapterHumanConfirmationRows" | "executionAdapterLedgerRows" | "executionAdapterOpsStateRows" | "executionAdapterOrchestrationDryRunRows" | "executionAdapterOrchestrationExecutionRows" | "executionAdapterPaperExecutionRows" | "executionAdapterPaperOrderLifecycleRows" | "executionAdapterPaperRouteRunbookRows" | "executionAdapterProductionRouteReviewRows" | "executionAdapterRuntimeReloadAcceptanceRows" | "executionAdapterRuntimeReloadExecutionRows" | "executionAdapterRuntimeReloadPlanRows" | "executionAdapterSandboxOrderSchemaDryRunRows" | "executionAdapterSandboxProbeExecutionRows" | "executionAdapterSandboxProbePlanRows" | "executionAdapterSandboxProbeReviewRows" | "executionAdapterSecretManifestValidationRows" | "executionAdapterSecretMaterializationRows" | "executionAdapterSecretReferenceRows" | "i18n" | "isRecordingPreLiveRunbook" | "isRunningStage7ProductionReadonly" | "isUpdatingStage8ProductionReadonly" | "latestCcxtProductionRouteReviewId" | "preLiveRunbookCopyResetTimerRef" | "setAdapterCertificationApplyConfirmations" | "setApplyingAdapterCertificationId" | "setAuditEvidenceReportEvents" | "setCopiedPreLiveRunbook" | "setExecutionAdapterCertificationApplies" | "setIsRecordingPreLiveRunbook" | "setIsRunningStage7ProductionReadonly" | "setIsUpdatingStage8ProductionReadonly" | "setStage7ProductionReadonlyError" | "setStage7ProductionReadonlyProbes" | "setStage8ProductionReadonlyContinuity" | "setStage8ProductionReadonlyError" | "setWorkspaceState" | "source" | "stage7ProductionReadonlyError" | "stage7ProductionReadonlyProbes" | "stage8ProductionReadonlyContinuity" | "stage8ProductionReadonlyError" | "statusLabel" | "workspace">;
type Result = Pick<AppControllerBindings, "brokerAdapterRows" | "latestStage7ProductionReadonlyProbe" | "executionAdapterChainHealthRollups" | "terminalBrokerAdapterRows" | "terminalExecutionAdapterLedgerRows" | "terminalExecutionAdapterHealthProbeRows" | "terminalExecutionAdapterChainHealthRollups" | "executionAdapterPreLiveRunbook" | "executionAdapterPreLiveRunbookAuditCoverage" | "applyAdapterCertificationPreflight" | "runStage7ProductionReadonlyAction" | "runStage8ProductionReadonlyAccessAction" | "copyExecutionAdapterPreLiveRunbook" | "downloadExecutionAdapterPreLiveRunbook" | "recordExecutionAdapterPreLiveRunbook" | "copyExecutionAdapterPaperExecutionEvidenceLink">;

export function usePreliveActions(controller: Dependencies): Result {
  const {
    adapterCertificationApplyConfirmations, applyingAdapterCertificationId, auditEvidenceReportEvents, auditEvidenceReportLedgerRows, copiedPreLiveRunbook, error,
    executionAdapterCertificationApplies, executionAdapterCertificationRows, executionAdapterEnvironmentBindingRows, executionAdapterHealthProbeRows, executionAdapterHumanConfirmationRows, executionAdapterLedgerRows,
    executionAdapterOpsStateRows, executionAdapterOrchestrationDryRunRows, executionAdapterOrchestrationExecutionRows, executionAdapterPaperExecutionRows, executionAdapterPaperOrderLifecycleRows, executionAdapterPaperRouteRunbookRows,
    executionAdapterProductionRouteReviewRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadPlanRows, executionAdapterSandboxOrderSchemaDryRunRows, executionAdapterSandboxProbeExecutionRows,
    executionAdapterSandboxProbePlanRows, executionAdapterSandboxProbeReviewRows, executionAdapterSecretManifestValidationRows, executionAdapterSecretMaterializationRows, executionAdapterSecretReferenceRows, i18n,
    isRecordingPreLiveRunbook, isRunningStage7ProductionReadonly, isUpdatingStage8ProductionReadonly, latestCcxtProductionRouteReviewId, preLiveRunbookCopyResetTimerRef, setAdapterCertificationApplyConfirmations,
    setApplyingAdapterCertificationId, setAuditEvidenceReportEvents, setCopiedPreLiveRunbook, setExecutionAdapterCertificationApplies, setIsRecordingPreLiveRunbook, setIsRunningStage7ProductionReadonly,
    setIsUpdatingStage8ProductionReadonly, setStage7ProductionReadonlyError, setStage7ProductionReadonlyProbes, setStage8ProductionReadonlyContinuity, setStage8ProductionReadonlyError, setWorkspaceState,
    source, stage7ProductionReadonlyError, stage7ProductionReadonlyProbes, stage8ProductionReadonlyContinuity, stage8ProductionReadonlyError, statusLabel,
    workspace
  } = controller;
  const brokerAdapterRows = buildBrokerAdapterRows(workspace);
  const latestStage7ProductionReadonlyProbe = stage7ProductionReadonlyProbes.find(
      (probe) => probe.productionRouteReviewId === latestCcxtProductionRouteReviewId
    ) ?? null;
  const executionAdapterChainHealthRollups = buildExecutionAdapterChainHealthRollups({
      adapterOpsStateRows: executionAdapterOpsStateRows,
      adapterPaperExecutionRows: executionAdapterPaperExecutionRows,
      brokerRows: brokerAdapterRows,
      environmentBindingRows: executionAdapterEnvironmentBindingRows,
      humanConfirmationRows: executionAdapterHumanConfirmationRows,
      orchestrationDryRunRows: executionAdapterOrchestrationDryRunRows,
      orchestrationExecutionRows: executionAdapterOrchestrationExecutionRows,
      paperOrderLifecycleRows: executionAdapterPaperOrderLifecycleRows,
      paperRouteRunbookRows: executionAdapterPaperRouteRunbookRows,
      productionRouteReviewRows: executionAdapterProductionRouteReviewRows,
      runtimeReloadAcceptanceRows: executionAdapterRuntimeReloadAcceptanceRows,
      runtimeReloadExecutionRows: executionAdapterRuntimeReloadExecutionRows,
      runtimeReloadPlanRows: executionAdapterRuntimeReloadPlanRows,
      sandboxOrderSchemaDryRunRows: executionAdapterSandboxOrderSchemaDryRunRows,
      sandboxProbeExecutionRows: executionAdapterSandboxProbeExecutionRows,
      sandboxProbePlanRows: executionAdapterSandboxProbePlanRows,
      sandboxProbeReviewRows: executionAdapterSandboxProbeReviewRows,
      secretManifestValidationRows: executionAdapterSecretManifestValidationRows,
      secretMaterializationRows: executionAdapterSecretMaterializationRows,
      secretReferenceRows: executionAdapterSecretReferenceRows
    });
  const terminalBrokerAdapterRows = brokerAdapterRows.map((row) => ({
      ...row,
      adapter: brokerAdapterName(i18n, row),
      certification: brokerCertificationLabel(i18n, row.certification),
      nextStep: brokerNextStepLabel(i18n, row.nextStep)
    }));
  const terminalExecutionAdapterLedgerRows = executionAdapterLedgerRows.map((row) => ({
      ...row,
      adapter: adapterLedgerAdapterName(i18n, row),
      label: adapterLedgerLabel(i18n, row),
      nextStep: adapterLedgerNextStep(i18n, row),
      reason: adapterLedgerReason(i18n, row)
    }));
  const terminalExecutionAdapterHealthProbeRows = executionAdapterHealthProbeRows.map((row) => ({
      ...row,
      blockerSummary: adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary),
      boundary: adapterHealthProbeBoundaryLabel(i18n, row.boundary),
      credentialSummary: adapterHealthProbeCredentialSummaryLabel(i18n, row.credentialSummary),
      statusLabel: adapterHealthProbeStatusLabel(i18n, row.statusLabel)
    }));
  const terminalExecutionAdapterChainHealthRollups = executionAdapterChainHealthRollups.map((row) => ({
      ...row,
      adapterName: adapterCertificationAdapterName(i18n, row.adapterId),
      blockerLabel: row.blockerStageId
        ? adapterChainHealthStageLabel(i18n, row.blockerStageId, row.blockerLabel)
        : row.blockerLabel,
      detail: adapterChainHealthDetailLabel(i18n, row),
      headline: adapterChainHealthStatusLabel(i18n, row.status)
    }));
  const executionAdapterPreLiveRunbook = buildExecutionAdapterPreLiveRunbookSummary({
      adapterLedgerRows: executionAdapterLedgerRows,
      certificationRows: executionAdapterCertificationRows,
      healthProbeRows: executionAdapterHealthProbeRows,
      humanConfirmationRows: executionAdapterHumanConfirmationRows,
      opsStateRows: executionAdapterOpsStateRows,
      paperExecutionRows: executionAdapterPaperExecutionRows,
      paperOrderLifecycleRows: executionAdapterPaperOrderLifecycleRows,
      paperRouteRunbookRows: executionAdapterPaperRouteRunbookRows,
      productionRouteReviewRows: executionAdapterProductionRouteReviewRows,
      runtimeReloadAcceptanceRows: executionAdapterRuntimeReloadAcceptanceRows,
      sandboxOrderSchemaDryRunRows: executionAdapterSandboxOrderSchemaDryRunRows,
      secretManifestValidationRows: executionAdapterSecretManifestValidationRows,
      workspace
    });
  const executionAdapterPreLiveRunbookAuditCoverage = buildPreLiveRunbookAuditCoverage(
      auditEvidenceReportLedgerRows,
      executionAdapterPreLiveRunbook,
      workspace
    );
  const applyAdapterCertificationPreflight = useCallback(
      async (row: ExecutionAdapterCertificationRow) => {
        const confirmations = adapterCertificationApplyConfirmations[row.id] ?? createDefaultExecutionAdapterCertificationApplyConfirmations();
        setApplyingAdapterCertificationId(row.id);
        try {
          const result = await recordExecutionAdapterCertificationApply(quantCoreBaseUrl, {
            certificationId: row.id,
            operator: "settings-panel",
            confirmations: confirmations,
            metadata: {
              adapterId: row.adapterId,
              source: "settings-panel"
            }
          });
          if (result.certificationApply) {
            setExecutionAdapterCertificationApplies((current) => [
              result.certificationApply!,
              ...current.filter((currentRow) => currentRow.applyId !== result.certificationApply!.applyId)
            ]);
          }
          if (result.error) {
            setWorkspaceState((current) => ({
              ...current,
              error: result.error,
              statusLabel: "Adapter apply preflight failed"
            }));
          } else {
            const status = result.certificationApply?.status ?? "blocked";
            setWorkspaceState((current) => ({
              ...current,
              error: undefined,
              statusLabel:
                status === "ready_for_restart"
                  ? `Adapter apply preflight ready · ${row.adapterId}`
                  : `Adapter apply preflight blocked · ${row.adapterId}`
            }));
          }
        } finally {
          setApplyingAdapterCertificationId(null);
        }
      },
      [adapterCertificationApplyConfirmations]
    );
  const runStage7ProductionReadonlyAction = useCallback(async (eligibilityConfirmed: boolean) => {
      if (isRunningStage7ProductionReadonly || !latestCcxtProductionRouteReviewId) return;
      setIsRunningStage7ProductionReadonly(true);
      setStage7ProductionReadonlyError(null);
      try {
        const result = await runStage7ProductionReadonlyProbe(
          quantCoreBaseUrl,
          latestCcxtProductionRouteReviewId,
          eligibilityConfirmed
        );
        if (!result.probe) throw new Error(result.error ?? "Stage 7 生产只读准入失败");
        setStage7ProductionReadonlyProbes((current) => [
          result.probe!, ...current.filter((row) => row.probeId !== result.probe!.probeId)
        ]);
        setStage7ProductionReadonlyError(result.error ?? null);
        const continuity = await loadStage8ProductionReadonlyContinuity(quantCoreBaseUrl);
        setStage8ProductionReadonlyContinuity(continuity.continuity ?? null);
        setStage8ProductionReadonlyError(continuity.error ?? null);
      } catch (error) {
        setStage7ProductionReadonlyError(error instanceof Error ? error.message : "Stage 7 生产只读准入失败");
      } finally {
        setIsRunningStage7ProductionReadonly(false);
      }
    }, [isRunningStage7ProductionReadonly, latestCcxtProductionRouteReviewId]);
  const runStage8ProductionReadonlyAccessAction = useCallback(async (
      action: "revoke" | "restore",
      reason: string
    ) => {
      if (isUpdatingStage8ProductionReadonly) return;
      setIsUpdatingStage8ProductionReadonly(true);
      setStage8ProductionReadonlyError(null);
      try {
        const result = await setStage8ProductionReadonlyAccess(
          quantCoreBaseUrl,
          action,
          reason,
          action === "restore" ? latestCcxtProductionRouteReviewId || null : null
        );
        if (!result.continuity) throw new Error(result.error ?? "Stage 8 生产只读控制失败");
        setStage8ProductionReadonlyContinuity(result.continuity);
      } catch (error) {
        setStage8ProductionReadonlyError(error instanceof Error ? error.message : "Stage 8 生产只读控制失败");
      } finally {
        setIsUpdatingStage8ProductionReadonly(false);
      }
    }, [isUpdatingStage8ProductionReadonly, latestCcxtProductionRouteReviewId]);
  const copyExecutionAdapterPreLiveRunbook = useCallback(async () => {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }
        await navigator.clipboard.writeText(buildExecutionAdapterPreLiveRunbookMarkdown(executionAdapterPreLiveRunbook));
        setCopiedPreLiveRunbook(true);
        if (preLiveRunbookCopyResetTimerRef.current !== null) {
          window.clearTimeout(preLiveRunbookCopyResetTimerRef.current);
        }
        preLiveRunbookCopyResetTimerRef.current = window.setTimeout(() => {
          setCopiedPreLiveRunbook(false);
          preLiveRunbookCopyResetTimerRef.current = null;
        }, 1800);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Pre-live runbook copied",
          error: undefined
        }));
      } catch (copyError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Pre-live runbook copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    }, [executionAdapterPreLiveRunbook]);
  const downloadExecutionAdapterPreLiveRunbook = useCallback(() => {
      let objectUrl: string | null = null;
      try {
        const markdown = buildExecutionAdapterPreLiveRunbookMarkdown(executionAdapterPreLiveRunbook);
        objectUrl = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
        const anchor = document.createElement("a");
        const safeAdapterId = executionAdapterPreLiveRunbook.adapterId.replace(/[^a-z0-9._-]+/giu, "-");
        anchor.href = objectUrl;
        anchor.download = `${safeAdapterId}-${executionAdapterPreLiveRunbook.market}-pre-live-runbook.md`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Pre-live runbook download ready",
          error: undefined
        }));
      } catch (downloadError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Pre-live runbook download failed",
          error: downloadError instanceof Error ? downloadError.message : "Runbook download failed"
        }));
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }, [executionAdapterPreLiveRunbook]);
  const recordExecutionAdapterPreLiveRunbook = useCallback(async () => {
      setIsRecordingPreLiveRunbook(true);
      try {
        const markdown = buildExecutionAdapterPreLiveRunbookMarkdown(executionAdapterPreLiveRunbook);
        const auditEvent = await buildExecutionAdapterPreLiveRunbookAuditEvent({
          markdown,
          runbook: executionAdapterPreLiveRunbook,
          workspace
        });
        const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        if (result.source !== "core" || !result.event) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Pre-live runbook audit failed",
            error: result.error ?? "Audit ledger unavailable"
          }));
          return;
        }
        setAuditEvidenceReportEvents((current) =>
          mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Pre-live runbook audited · ${result.event!.eventId}`,
          error: undefined
        }));
      } catch (recordError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Pre-live runbook audit failed",
          error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
        }));
      } finally {
        setIsRecordingPreLiveRunbook(false);
      }
    }, [executionAdapterPreLiveRunbook, quantCoreBaseUrl, workspace]);
  const copyExecutionAdapterPaperExecutionEvidenceLink = useCallback(
      async (row: ExecutionAdapterPaperExecutionAuditLedgerRow) => {
        if (!navigator.clipboard?.writeText) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Adapter paper execution evidence link copy failed",
            error: "Clipboard is unavailable."
          }));
          return;
        }
        await navigator.clipboard.writeText(buildExecutionAdapterPaperExecutionEvidenceUrl(row.id));
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Adapter paper execution evidence link copied",
          error: undefined
        }));
      },
      []
    );
  return {
    brokerAdapterRows, latestStage7ProductionReadonlyProbe, executionAdapterChainHealthRollups, terminalBrokerAdapterRows, terminalExecutionAdapterLedgerRows, terminalExecutionAdapterHealthProbeRows,
    terminalExecutionAdapterChainHealthRollups, executionAdapterPreLiveRunbook, executionAdapterPreLiveRunbookAuditCoverage, applyAdapterCertificationPreflight, runStage7ProductionReadonlyAction, runStage8ProductionReadonlyAccessAction,
    copyExecutionAdapterPreLiveRunbook, downloadExecutionAdapterPreLiveRunbook, recordExecutionAdapterPreLiveRunbook, copyExecutionAdapterPaperExecutionEvidenceLink
  };
}
