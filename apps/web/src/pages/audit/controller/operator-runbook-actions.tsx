import { buildOperatorRunbookAuditEvent, saveAuditEvent } from "../../../lib/terminal-api";
import { buildOperatorRunbookAuditCoverage, buildOperatorRunbookMarkdown, buildOperatorRunbookSummary, ProductWorkAreaId } from "../../../lib/terminal-workbench";
import { AUDIT_REPORT_EVENTS_PAGE_SIZE, quantCoreBaseUrl } from "../../app-shell/initial-state";
import { productWorkAreaIds } from "../../app-shell/navigation";
import { replaceAuditEvidenceReportQueryUrlParam } from "../../app-shell/url-state";
import { mergeAuditEvidenceReportEvent } from "../event-merges";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeLoopStepId" | "activeWorkAreaId" | "activeWorkflowStageId" | "auditEvidenceReportEvents" | "auditEvidenceReportLedgerRows" | "auditEvidenceReportOffset" | "auditEvidenceReportQuery" | "copiedOperatorRunbook" | "copyAuditReportLedgerQueryLink" | "error" | "executionAdapterChainHealthRollups" | "isRecordingOperatorRunbook" | "loadImportAuditEvidenceDeepLink" | "loadPaperExecutionDeepLink" | "operatorRunbookCopyResetTimerRef" | "p2PreLiveAcceptanceSummary" | "paperExecutionReplayGate" | "preLiveReadinessChecklist" | "selectProductWorkArea" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setAuditEvidenceReportEvents" | "setAuditEvidenceReportOffset" | "setAuditEvidenceReportQuery" | "setCopiedOperatorRunbook" | "setIsRecordingOperatorRunbook" | "setWorkspaceState" | "source" | "statusLabel" | "updateAuditEvidenceReportQuery" | "workspace">;
type Result = Pick<AppControllerBindings, "operatorRunbookSummary" | "operatorRunbookAuditCoverage" | "copyOperatorRunbook" | "downloadOperatorRunbook" | "recordOperatorRunbook" | "focusOperatorRunbookAudit" | "openAuditReportLedgerEvidenceLink" | "openAuditReportLedgerQuery" | "copyOperatorRunbookAuditLink">;

export function useOperatorRunbookActions(controller: Dependencies): Result {
  const {
    activeLoopStepId, activeWorkAreaId, activeWorkflowStageId, auditEvidenceReportEvents, auditEvidenceReportLedgerRows, auditEvidenceReportOffset,
    auditEvidenceReportQuery, copiedOperatorRunbook, copyAuditReportLedgerQueryLink, error, executionAdapterChainHealthRollups, isRecordingOperatorRunbook,
    loadImportAuditEvidenceDeepLink, loadPaperExecutionDeepLink, operatorRunbookCopyResetTimerRef, p2PreLiveAcceptanceSummary, paperExecutionReplayGate, preLiveReadinessChecklist,
    selectProductWorkArea, setActiveLoopStepId, setActiveWorkAreaId, setActiveWorkflowStageId, setAuditEvidenceReportEvents, setAuditEvidenceReportOffset,
    setAuditEvidenceReportQuery, setCopiedOperatorRunbook, setIsRecordingOperatorRunbook, setWorkspaceState, source, statusLabel,
    updateAuditEvidenceReportQuery, workspace
  } = controller;
  const operatorRunbookSummary = buildOperatorRunbookSummary({
      adapterChainHealthRollups: executionAdapterChainHealthRollups,
      p2PreLiveAcceptance: p2PreLiveAcceptanceSummary,
      paperExecutionReplayGate,
      preLiveChecklist: preLiveReadinessChecklist,
      workspace
    });
  const operatorRunbookAuditCoverage = buildOperatorRunbookAuditCoverage(
      auditEvidenceReportLedgerRows,
      operatorRunbookSummary,
      workspace
    );
  const copyOperatorRunbook = useCallback(async () => {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }
        await navigator.clipboard.writeText(buildOperatorRunbookMarkdown(operatorRunbookSummary));
        setCopiedOperatorRunbook(true);
        if (operatorRunbookCopyResetTimerRef.current !== null) {
          window.clearTimeout(operatorRunbookCopyResetTimerRef.current);
        }
        operatorRunbookCopyResetTimerRef.current = window.setTimeout(() => {
          setCopiedOperatorRunbook(false);
          operatorRunbookCopyResetTimerRef.current = null;
        }, 1800);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Operator runbook copied",
          error: undefined
        }));
      } catch (copyError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Operator runbook copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    }, [operatorRunbookSummary]);
  const downloadOperatorRunbook = useCallback(() => {
      let objectUrl: string | null = null;
      try {
        const markdown = buildOperatorRunbookMarkdown(operatorRunbookSummary);
        objectUrl = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
        const anchor = document.createElement("a");
        const safeAdapterId = operatorRunbookSummary.adapterId.replace(/[^a-z0-9._-]+/giu, "-");
        const safeContext = operatorRunbookSummary.contextLabel.replace(/[^a-z0-9._-]+/giu, "-");
        anchor.href = objectUrl;
        anchor.download = `${safeAdapterId}-${safeContext}-operator-runbook.md`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Operator runbook download ready",
          error: undefined
        }));
      } catch (downloadError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Operator runbook download failed",
          error: downloadError instanceof Error ? downloadError.message : "Runbook download failed"
        }));
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }, [operatorRunbookSummary]);
  const recordOperatorRunbook = useCallback(async () => {
      setIsRecordingOperatorRunbook(true);
      try {
        const markdown = buildOperatorRunbookMarkdown(operatorRunbookSummary);
        const auditEvent = await buildOperatorRunbookAuditEvent({
          markdown,
          runbook: operatorRunbookSummary,
          workspace
        });
        const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        if (result.source !== "core" || !result.event) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Operator runbook audit failed",
            error: result.error ?? "Audit ledger unavailable"
          }));
          return;
        }
        setAuditEvidenceReportEvents((current) =>
          mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Operator runbook audited · ${result.event!.eventId}`,
          error: undefined
        }));
      } catch (recordError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Operator runbook audit failed",
          error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
        }));
      } finally {
        setIsRecordingOperatorRunbook(false);
      }
    }, [operatorRunbookSummary, quantCoreBaseUrl, workspace]);
  const focusOperatorRunbookAudit = useCallback(() => {
      const query = operatorRunbookAuditCoverage.query;
      selectProductWorkArea("audit");
      if (!query) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Operator runbook audit coverage unavailable",
          error: "No matching operator runbook report has been recorded yet."
        }));
        return;
      }
      updateAuditEvidenceReportQuery(query);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Operator runbook audit coverage selected",
        error: undefined
      }));
    }, [operatorRunbookAuditCoverage.query, selectProductWorkArea, updateAuditEvidenceReportQuery]);
  const openAuditReportLedgerEvidenceLink = useCallback(
      (search: string) => {
        const params = new URLSearchParams(search);
        const targetWorkspace = params.get("workspace");
        const targetWorkspaceId =
          targetWorkspace && productWorkAreaIds.includes(targetWorkspace as ProductWorkAreaId)
            ? (targetWorkspace as ProductWorkAreaId)
            : null;
        const runId = params.get("runId");
        const exportPath = params.get("exportPath") ?? (runId ? `manifest:${runId}` : "");
        const paperExecutionId = params.get("paperExecution");

        if (!targetWorkspaceId) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Audit report evidence link failed",
            error: "The report evidence link does not target a known workspace."
          }));
          return;
        }

        selectProductWorkArea(targetWorkspaceId);
        if (targetWorkspaceId === "audit" && runId) {
          void loadImportAuditEvidenceDeepLink({
            auditEventId: null,
            exportPath,
            focusQuery: runId,
            runId
          });
          return;
        }

        if (targetWorkspaceId === "execution" && runId && paperExecutionId) {
          void loadPaperExecutionDeepLink({ executionId: paperExecutionId, runId });
          return;
        }

        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Audit report evidence workspace opened",
          error: undefined
        }));
      },
      [loadImportAuditEvidenceDeepLink, loadPaperExecutionDeepLink, selectProductWorkArea]
    );
  const openAuditReportLedgerQuery = useCallback(
      (query: string, statusLabel = "Audit report query selected") => {
        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
          selectProductWorkArea("audit");
          return;
        }
        setAuditEvidenceReportQuery(normalizedQuery);
        setAuditEvidenceReportOffset(0);
        replaceAuditEvidenceReportQueryUrlParam(normalizedQuery);
        setActiveWorkAreaId("audit");
        setActiveLoopStepId("backtest");
        setActiveWorkflowStageId("execution");
        setWorkspaceState((current) => ({
          ...current,
          statusLabel,
          error: undefined
        }));
      },
      [selectProductWorkArea]
    );
  const copyOperatorRunbookAuditLink = useCallback(async () => {
      const query = operatorRunbookAuditCoverage.query;
      if (!query) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Operator runbook audit link copy failed",
          error: "No matching operator runbook report has been recorded yet."
        }));
        return;
      }
      await copyAuditReportLedgerQueryLink(query);
    }, [copyAuditReportLedgerQueryLink, operatorRunbookAuditCoverage.query]);
  return {
    operatorRunbookSummary, operatorRunbookAuditCoverage, copyOperatorRunbook, downloadOperatorRunbook, recordOperatorRunbook, focusOperatorRunbookAudit,
    openAuditReportLedgerEvidenceLink, openAuditReportLedgerQuery, copyOperatorRunbookAuditLink
  };
}
