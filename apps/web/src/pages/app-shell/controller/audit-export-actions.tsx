import { buildAuditEvidenceReportAuditEvent, buildResearchRunExportAuditReport, loadAuditEvents, loadResearchRunDetail, loadResearchRunExport, ResearchRunExportAuditReport, saveAuditEvent, withResearchRunExportAuditEvidenceArtifacts, withResearchRunExportReportSignatures } from "../../../lib/terminal-api";
import { buildAuditEvidenceReportMarkdown, buildAuditEvidenceSummary, goldenPathRunRebindIsCurrent, ResearchRunAudit } from "../../../lib/terminal-workbench";
import { mergeAuditEvidenceReportEvent } from "../../audit/event-merges";
import { AUDIT_REPORT_EVENTS_PAGE_SIZE, quantCoreBaseUrl } from "../initial-state";
import { useCallback } from "react";
import type { AppControllerBindings } from "./bindings";

type Dependencies = Pick<AppControllerBindings, "activeLoopStepId" | "activeWorkAreaId" | "activeWorkflowStageId" | "auditEvidenceReportCopyResetTimerRef" | "auditEvidenceReportEvents" | "auditEvidenceSummaryCopyResetTimerRef" | "copiedAuditEvidenceReport" | "copiedAuditEvidenceSummary" | "error" | "goldenPath" | "importAuditEvidenceDeepLinkStatus" | "manualSelectionVersionRef" | "replayRun" | "researchRunContextBinding" | "researchRunExportBrowserQuery" | "researchRunExportBrowserRows" | "researchRunImportAuditEvents" | "researchRunImportAuditQuery" | "researchRunImportDiffQuery" | "researchRunImportDiffRows" | "runHistory" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setAuditEvidenceReportEvents" | "setCopiedAuditEvidenceReport" | "setCopiedAuditEvidenceSummary" | "setImportAuditEvidenceDeepLinkStatus" | "setResearchRunExportBrowserQuery" | "setResearchRunImportAuditEvents" | "setResearchRunImportAuditQuery" | "setResearchRunImportDiffQuery" | "setRunHistoryState" | "setWorkspaceState" | "source" | "statusLabel" | "strategyDraftRequiresReaudit" | "strategyExperimentWorkspaceRef" | "visibleStrategyExperimentActive" | "workflowRunIdRef" | "workspace">;
type Result = Pick<AppControllerBindings, "auditEvidenceSummary" | "replayImportRollbackRun" | "ensureGoldenPathLatestRunBound" | "persistAuditEvidenceReportEvent" | "exportRun" | "copyAuditEvidenceSummary" | "copyAuditEvidenceReport" | "downloadAuditEvidenceReport">;

export function useAuditExportActions(controller: Dependencies): Result {
  const {
    activeLoopStepId, activeWorkAreaId, activeWorkflowStageId, auditEvidenceReportCopyResetTimerRef, auditEvidenceReportEvents, auditEvidenceSummaryCopyResetTimerRef,
    copiedAuditEvidenceReport, copiedAuditEvidenceSummary, error, goldenPath, importAuditEvidenceDeepLinkStatus, manualSelectionVersionRef,
    replayRun, researchRunContextBinding, researchRunExportBrowserQuery, researchRunExportBrowserRows, researchRunImportAuditEvents, researchRunImportAuditQuery,
    researchRunImportDiffQuery, researchRunImportDiffRows, runHistory, setActiveLoopStepId, setActiveWorkAreaId, setActiveWorkflowStageId,
    setAuditEvidenceReportEvents, setCopiedAuditEvidenceReport, setCopiedAuditEvidenceSummary, setImportAuditEvidenceDeepLinkStatus, setResearchRunExportBrowserQuery, setResearchRunImportAuditEvents,
    setResearchRunImportAuditQuery, setResearchRunImportDiffQuery, setRunHistoryState, setWorkspaceState, source, statusLabel,
    strategyDraftRequiresReaudit, strategyExperimentWorkspaceRef, visibleStrategyExperimentActive, workflowRunIdRef, workspace
  } = controller;
  const auditEvidenceSummary = buildAuditEvidenceSummary({
      auditQuery: researchRunImportAuditQuery,
      deepLinkError: importAuditEvidenceDeepLinkStatus?.error ?? null,
      deepLinkRunId: importAuditEvidenceDeepLinkStatus?.runId ?? workspace.researchRun?.runId ?? null,
      deepLinkStatus: importAuditEvidenceDeepLinkStatus?.status ?? "none",
      importDiffQuery: researchRunImportDiffQuery,
      importDiffRows: researchRunImportDiffRows,
      importAuditEvents: researchRunImportAuditEvents,
      packageQuery: researchRunExportBrowserQuery,
      packageRows: researchRunExportBrowserRows
    });
  const replayImportRollbackRun = useCallback(
      async (runId: string) => {
        const historyRun = runHistory.find((run) => run.runId === runId);
        if (historyRun) {
          await replayRun(historyRun);
          return;
        }
        const detail = await loadResearchRunDetail(quantCoreBaseUrl, runId);
        if (detail.run) {
          await replayRun(detail.run);
          return;
        }
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Import rollback replay failed",
          error: detail.error ?? `Rollback target ${runId} was not found`
        }));
      },
      [replayRun, runHistory]
    );
  const ensureGoldenPathLatestRunBound = useCallback(async (latestRunIdOverride?: string | null): Promise<boolean> => {
      if (strategyDraftRequiresReaudit) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Strategy draft requires audit",
          error: "Run Pipeline to audit the current strategy draft before paper execution."
        }));
        return false;
      }
      if (researchRunContextBinding.canUseRun) {
        return true;
      }
      const latestRunId = latestRunIdOverride ?? goldenPath?.latestRunId;
      if (!latestRunId) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Golden Path audit run not loaded",
          error: "Golden Path did not return a latest audited run id for paper execution."
        }));
        return false;
      }

      const capturedWorkspace = strategyExperimentWorkspaceRef.current;
      const capturedSelectionVersion = manualSelectionVersionRef.current;
      const capturedWorkflowRunId = workflowRunIdRef.current;
      const rebindIsCurrent = () => goldenPathRunRebindIsCurrent(
        capturedWorkspace,
        strategyExperimentWorkspaceRef.current,
        capturedSelectionVersion,
        manualSelectionVersionRef.current,
        capturedWorkflowRunId,
        workflowRunIdRef.current
      );

      const historyRun = runHistory.find((run) => run.runId === latestRunId);
      if (historyRun) {
        if (!rebindIsCurrent()) {
          return false;
        }
        const rebound = await replayRun(historyRun);
        if (!rebound) {
          return false;
        }
        setActiveWorkAreaId("execution");
        setActiveLoopStepId("paper");
        setActiveWorkflowStageId("execution");
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Golden Path audit run loaded for paper execution",
          error: undefined
        }));
        return true;
      }

      const detail = await loadResearchRunDetail(quantCoreBaseUrl, latestRunId);
      if (!rebindIsCurrent()) {
        return false;
      }
      if (detail.run) {
        const rebound = await replayRun(detail.run);
        if (!rebound) {
          return false;
        }
        setActiveWorkAreaId("execution");
        setActiveLoopStepId("paper");
        setActiveWorkflowStageId("execution");
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Golden Path audit run loaded for paper execution",
          error: undefined
        }));
        return true;
      }

      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Golden Path audit run replay failed",
        error: detail.error ?? `Golden Path latest run ${latestRunId} was not found`
      }));
      return false;
    }, [
      goldenPath?.latestRunId,
      quantCoreBaseUrl,
      replayRun,
      researchRunContextBinding.canUseRun,
      runHistory,
      strategyDraftRequiresReaudit
    ]);
  const persistAuditEvidenceReportEvent = useCallback(
      (auditReport: ResearchRunExportAuditReport | undefined) => {
        if (!auditReport) {
          return;
        }
        void saveAuditEvent(quantCoreBaseUrl, buildAuditEvidenceReportAuditEvent(auditReport, auditEvidenceSummary)).then((result) => {
          if (result.source === "core" && result.event) {
            setAuditEvidenceReportEvents((current) =>
              mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
            );
            return;
          }
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Audit evidence report ledger save failed",
            error: result.error ?? "Audit evidence report ledger save failed"
          }));
        });
      },
      [auditEvidenceSummary, quantCoreBaseUrl]
    );
  const exportRun = useCallback(async (run: ResearchRunAudit) => {
      const result = await loadResearchRunExport(quantCoreBaseUrl, run.runId);
      if (result.source === "fallback" || !result.exportPackage) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research run export failed",
          error: result.error ?? "Research run export failed"
        }));
        return;
      }

      const fileName = `${run.runId}-research-export.json`;
      const exportPackage = await withResearchRunExportAuditEvidenceArtifacts(
        result.exportPackage,
        auditEvidenceSummary,
        undefined,
        runHistory,
        visibleStrategyExperimentActive
      );
      const reportHistory = await loadAuditEvents(quantCoreBaseUrl, {
        eventType: "audit_evidence_report,backtest_report",
        runId: run.runId,
        limit: 50
      });
      const signedExportPackage =
        reportHistory.source === "core"
          ? withResearchRunExportReportSignatures(exportPackage, reportHistory.events)
          : exportPackage;
      persistAuditEvidenceReportEvent(exportPackage.auditReport);
      const objectUrl = URL.createObjectURL(
        new Blob([JSON.stringify(signedExportPackage, null, 2)], { type: "application/json;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research run export ready",
        error: undefined
      }));
    }, [...[auditEvidenceSummary, persistAuditEvidenceReportEvent, quantCoreBaseUrl, runHistory], visibleStrategyExperimentActive]);
  const copyAuditEvidenceSummary = useCallback(async () => {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }
        await navigator.clipboard.writeText(auditEvidenceSummary.copyText);
        setCopiedAuditEvidenceSummary(true);
        if (auditEvidenceSummaryCopyResetTimerRef.current !== null) {
          window.clearTimeout(auditEvidenceSummaryCopyResetTimerRef.current);
        }
        auditEvidenceSummaryCopyResetTimerRef.current = window.setTimeout(() => {
          setCopiedAuditEvidenceSummary(false);
          auditEvidenceSummaryCopyResetTimerRef.current = null;
        }, 1800);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Audit evidence summary copied",
          error: undefined
        }));
      } catch (copyError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Audit evidence summary copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    }, [auditEvidenceSummary.copyText]);
  const copyAuditEvidenceReport = useCallback(async () => {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }
        await navigator.clipboard.writeText(buildAuditEvidenceReportMarkdown(auditEvidenceSummary));
        setCopiedAuditEvidenceReport(true);
        if (auditEvidenceReportCopyResetTimerRef.current !== null) {
          window.clearTimeout(auditEvidenceReportCopyResetTimerRef.current);
        }
        auditEvidenceReportCopyResetTimerRef.current = window.setTimeout(() => {
          setCopiedAuditEvidenceReport(false);
          auditEvidenceReportCopyResetTimerRef.current = null;
        }, 1800);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Audit evidence report copied",
          error: undefined
        }));
      } catch (copyError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Audit evidence report copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    }, [auditEvidenceSummary]);
  const downloadAuditEvidenceReport = useCallback(async () => {
      try {
        const auditReport = await buildResearchRunExportAuditReport(auditEvidenceSummary);
        persistAuditEvidenceReportEvent(auditReport);
        const objectUrl = URL.createObjectURL(
          new Blob([auditReport.contentMarkdown], { type: "text/markdown;charset=utf-8" })
        );
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = auditReport.fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Audit evidence report download ready",
          error: undefined
        }));
      } catch (downloadError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Audit evidence report download failed",
          error: downloadError instanceof Error ? downloadError.message : "Audit evidence report download failed"
        }));
      }
    }, [auditEvidenceSummary, persistAuditEvidenceReportEvent]);
  return {
    auditEvidenceSummary, replayImportRollbackRun, ensureGoldenPathLatestRunBound, persistAuditEvidenceReportEvent, exportRun, copyAuditEvidenceSummary,
    copyAuditEvidenceReport, downloadAuditEvidenceReport
  };
}
