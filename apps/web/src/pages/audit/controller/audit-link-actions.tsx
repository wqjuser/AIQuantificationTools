import { loadAiReviewArchiveImportSnapshot, loadResearchRunExport, recordAuditSigningKeyControlledRestartEvidence, saveAuditEvent } from "../../../lib/terminal-api";
import { mergeResearchRunImportAuditEvents, ResearchRunImportAuditEvent, verifyStage5SandboxReadinessDecisionHashes } from "../../../lib/terminal-workbench";
import { IMPORT_AUDIT_EVENTS_PAGE_SIZE, quantCoreBaseUrl, type ResearchRunExportPackageInspectionResult } from "../../app-shell/initial-state";
import { mergeAuditEvidenceReportEvent } from "../event-merges";
import { auditEventRecordToResearchRunImportEvent, buildResearchRunImportAuditEvidenceUrl, researchRunImportAuditEventToAuditEventRecord } from "../ResearchPackageFormatters";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeWorkAreaId" | "auditSigningKeyRestartEvidence" | "auditSigningKeyRestartEvidenceConfirmations" | "auditSigningKeyRotationApplyEventId" | "auditSigningKeyRotationEvents" | "copiedImportAuditEvidenceEventId" | "error" | "exportPackageRequestCoordinatorRef" | "focusedImportAuditEventId" | "importAuditCopyResetTimerRef" | "inspectedExportArchiveSnapshot" | "inspectedExportPackage" | "isInspectingExportPackage" | "isRecordingAuditSigningKeyRestartEvidence" | "pendingImportPackage" | "researchRunImportAuditEvents" | "researchRunImportAuditOffset" | "researchRunImportAuditPagination" | "researchRunImportAuditQuery" | "setActiveWorkAreaId" | "setAuditSigningKeyRestartEvidence" | "setAuditSigningKeyRestartEvidenceConfirmations" | "setAuditSigningKeyRotationApplyEventId" | "setAuditSigningKeyRotationEvents" | "setCopiedImportAuditEvidenceEventId" | "setFocusedImportAuditEventId" | "setInspectedExportArchiveSnapshot" | "setInspectedExportPackage" | "setIsInspectingExportPackage" | "setIsRecordingAuditSigningKeyRestartEvidence" | "setPendingImportPackage" | "setResearchRunImportAuditEvents" | "setResearchRunImportAuditOffset" | "setResearchRunImportAuditPagination" | "setResearchRunImportAuditQuery" | "setWorkspaceState" | "source" | "statusLabel" | "workspace">;
type Result = Pick<AppControllerBindings, "recordAuditSigningKeyRestartEvidenceForAudit" | "inspectRunExportPackageByRunId" | "copyResearchRunImportAuditEvidenceAnchor" | "appendResearchRunImportAuditEvent" | "updateResearchRunImportAuditQuery" | "previousResearchRunImportAuditPage" | "nextResearchRunImportAuditPage" | "copyAuditReportLedgerEvidenceLink" | "copyAuditReportLedgerQueryLink">;

export function useAuditLinkActions(controller: Dependencies): Result {
  const {
    activeWorkAreaId, auditSigningKeyRestartEvidence, auditSigningKeyRestartEvidenceConfirmations, auditSigningKeyRotationApplyEventId, auditSigningKeyRotationEvents, copiedImportAuditEvidenceEventId,
    error, exportPackageRequestCoordinatorRef, focusedImportAuditEventId, importAuditCopyResetTimerRef, inspectedExportArchiveSnapshot, inspectedExportPackage,
    isInspectingExportPackage, isRecordingAuditSigningKeyRestartEvidence, pendingImportPackage, researchRunImportAuditEvents, researchRunImportAuditOffset, researchRunImportAuditPagination,
    researchRunImportAuditQuery, setActiveWorkAreaId, setAuditSigningKeyRestartEvidence, setAuditSigningKeyRestartEvidenceConfirmations, setAuditSigningKeyRotationApplyEventId, setAuditSigningKeyRotationEvents,
    setCopiedImportAuditEvidenceEventId, setFocusedImportAuditEventId, setInspectedExportArchiveSnapshot, setInspectedExportPackage, setIsInspectingExportPackage, setIsRecordingAuditSigningKeyRestartEvidence,
    setPendingImportPackage, setResearchRunImportAuditEvents, setResearchRunImportAuditOffset, setResearchRunImportAuditPagination, setResearchRunImportAuditQuery, setWorkspaceState,
    source, statusLabel, workspace
  } = controller;
  const recordAuditSigningKeyRestartEvidenceForAudit = useCallback(async () => {
      if (!auditSigningKeyRotationApplyEventId) {
        setAuditSigningKeyRestartEvidence({
          source: "fallback",
          error: "Audit signing key rotation apply event id is required before restart evidence can be recorded"
        });
        return;
      }
      setIsRecordingAuditSigningKeyRestartEvidence(true);
      try {
        const result = await recordAuditSigningKeyControlledRestartEvidence(quantCoreBaseUrl, {
          applyEventId: auditSigningKeyRotationApplyEventId,
          confirmations: auditSigningKeyRestartEvidenceConfirmations,
          metadata: { source: "audit-signing-key-registry-panel" },
          operator: "local-operator"
        });
        setAuditSigningKeyRestartEvidence(result);
        if (result.auditEvent) {
          setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, result.auditEvent!));
        }
      } finally {
        setIsRecordingAuditSigningKeyRestartEvidence(false);
      }
    }, [auditSigningKeyRestartEvidenceConfirmations, auditSigningKeyRotationApplyEventId, quantCoreBaseUrl]);
  const inspectRunExportPackageByRunId = useCallback(async (runId: string): Promise<ResearchRunExportPackageInspectionResult> => {
      const requestCoordinator = exportPackageRequestCoordinatorRef.current;
      const inspectionRequestId = requestCoordinator.begin();
      setIsInspectingExportPackage(true);
      setPendingImportPackage(null);
      setInspectedExportPackage(null);
      setInspectedExportArchiveSnapshot(null);
      try {
        const result = await loadResearchRunExport(quantCoreBaseUrl, runId);
        if (!requestCoordinator.isCurrent(inspectionRequestId)) {
          return { ok: false, error: "Research run export inspect superseded" };
        }
        if (result.source === "fallback" || !result.exportPackage) {
          const errorMessage = result.error ?? `Research run export inspect failed for ${runId}`;
          setInspectedExportPackage(null);
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Research run export inspect failed",
            error: errorMessage
          }));
          return { ok: false, error: errorMessage };
        }

        const aiReviewArchiveSnapshot = await loadAiReviewArchiveImportSnapshot(
          quantCoreBaseUrl,
          result.exportPackage
        );
        await verifyStage5SandboxReadinessDecisionHashes(result.exportPackage);
        if (!requestCoordinator.isCurrent(inspectionRequestId)) {
          return { ok: false, error: "Research run export inspect superseded" };
        }

        setPendingImportPackage(null);
        setInspectedExportPackage(result.exportPackage);
        setInspectedExportArchiveSnapshot({
          aiReviewArchiveSnapshot,
          exportPackage: result.exportPackage,
          runId
        });
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research run export package loaded",
          error: undefined
        }));
        setActiveWorkAreaId("audit");
        return { ok: true };
      } finally {
        if (requestCoordinator.isCurrent(inspectionRequestId)) {
          setIsInspectingExportPackage(false);
        }
      }
    }, [quantCoreBaseUrl]);
  const copyResearchRunImportAuditEvidenceAnchor = useCallback(async (event: ResearchRunImportAuditEvent) => {
      const anchor = buildResearchRunImportAuditEvidenceUrl(event);
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }
        await navigator.clipboard.writeText(anchor);
        setCopiedImportAuditEvidenceEventId(event.id);
        if (importAuditCopyResetTimerRef.current !== null) {
          window.clearTimeout(importAuditCopyResetTimerRef.current);
        }
        importAuditCopyResetTimerRef.current = window.setTimeout(() => {
          setCopiedImportAuditEvidenceEventId(null);
          importAuditCopyResetTimerRef.current = null;
        }, 1800);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Audit evidence anchor copied",
          error: undefined
        }));
      } catch (copyError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Audit evidence anchor copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    }, []);
  const appendResearchRunImportAuditEvent = useCallback(
      (event: ResearchRunImportAuditEvent) => {
        setResearchRunImportAuditEvents((current) => mergeResearchRunImportAuditEvents(current, event));
        void saveAuditEvent(quantCoreBaseUrl, researchRunImportAuditEventToAuditEventRecord(event)).then((result) => {
          if (result.source !== "core" || !result.event) {
            return;
          }
          const savedEvent = auditEventRecordToResearchRunImportEvent(result.event);
          if (savedEvent) {
            setResearchRunImportAuditEvents((current) => mergeResearchRunImportAuditEvents(current, savedEvent));
          }
        });
      },
      [quantCoreBaseUrl]
    );
  const updateResearchRunImportAuditQuery = useCallback((query: string) => {
      setResearchRunImportAuditQuery(query);
      setResearchRunImportAuditOffset(0);
      setFocusedImportAuditEventId(null);
    }, []);
  const previousResearchRunImportAuditPage = useCallback(() => {
      setResearchRunImportAuditOffset((current) => Math.max(0, current - IMPORT_AUDIT_EVENTS_PAGE_SIZE));
    }, []);
  const nextResearchRunImportAuditPage = useCallback(() => {
      setResearchRunImportAuditOffset((current) => {
        const total = researchRunImportAuditPagination?.total ?? 0;
        if (!total) {
          return current;
        }
        const next = current + IMPORT_AUDIT_EVENTS_PAGE_SIZE;
        return next >= total ? current : next;
      });
    }, [researchRunImportAuditPagination?.total]);
  const copyAuditReportLedgerEvidenceLink = useCallback(async (search: string) => {
      if (!search || !navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Audit report evidence link copy failed",
          error: "Clipboard is unavailable or the report does not have an evidence link."
        }));
        return;
      }

      const url = new URL(window.location.href);
      url.search = `?${search}`;
      url.hash = "";
      await navigator.clipboard.writeText(url.toString());
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Audit report evidence link copied",
        error: undefined
      }));
    }, []);
  const copyAuditReportLedgerQueryLink = useCallback(async (query: string) => {
      if (!query.trim() || !navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Audit report query link copy failed",
          error: "Clipboard is unavailable or the report query is empty."
        }));
        return;
      }

      const url = new URL(window.location.href);
      url.search = "";
      url.searchParams.set("workspace", "audit");
      url.searchParams.set("auditReportQuery", query);
      url.hash = "";
      await navigator.clipboard.writeText(url.toString());
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Audit report query link copied",
        error: undefined
      }));
    }, []);
  return {
    recordAuditSigningKeyRestartEvidenceForAudit, inspectRunExportPackageByRunId, copyResearchRunImportAuditEvidenceAnchor, appendResearchRunImportAuditEvent, updateResearchRunImportAuditQuery, previousResearchRunImportAuditPage,
    nextResearchRunImportAuditPage, copyAuditReportLedgerEvidenceLink, copyAuditReportLedgerQueryLink
  };
}
