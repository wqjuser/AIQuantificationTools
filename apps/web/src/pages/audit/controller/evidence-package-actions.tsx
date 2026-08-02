import { loadResearchRunExport, ResearchRunExportPackage } from "../../../lib/terminal-api";
import { buildEvidencePackageControlRoomRows, EvidencePackageControlRoomRow, ResearchRunAudit, ResearchRunImportAuditEvent } from "../../../lib/terminal-workbench";
import { quantCoreBaseUrl } from "../../app-shell/initial-state";
import { type InitialImportAuditEvidenceDeepLink } from "../../app-shell/url-state";
import { researchRunImportAuditEvidenceQuery } from "../ResearchPackageFormatters";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeWorkAreaId" | "auditEvidenceReportEvents" | "auditEvidenceReportLedgerRows" | "error" | "importAuditEvidenceDeepLinkStatus" | "indexedExportPackages" | "inspectRunExportPackageByRunId" | "inspectedArchiveSnapshot" | "isIndexingExportPackages" | "p0AcceptanceSummary" | "pendingImportPackage" | "researchRunExportBrowserQuery" | "researchRunExportIndexRows" | "researchRunImportAuditEvents" | "researchRunImportDiffQuery" | "runHistory" | "setActiveWorkAreaId" | "setAuditEvidenceReportEvents" | "setImportAuditEvidenceDeepLinkStatus" | "setIndexedExportPackages" | "setIsIndexingExportPackages" | "setPendingImportPackage" | "setResearchRunExportBrowserQuery" | "setResearchRunImportAuditEvents" | "setResearchRunImportDiffQuery" | "setRunHistoryState" | "setWorkspaceState" | "source" | "statusLabel" | "updateAuditEvidenceReportQuery" | "updateResearchRunImportAuditQuery" | "workspace">;
type Result = Pick<AppControllerBindings, "researchRunImportArchiveSnapshot" | "evidencePackageControlRoom" | "inspectRunExportPackage" | "inspectResearchRunImportAuditEvent" | "loadImportAuditEvidenceDeepLink" | "retryImportAuditEvidenceDeepLink" | "indexRecentRunExportPackages" | "runEvidencePackageControlAction">;

export function useEvidencePackageActions(controller: Dependencies): Result {
  const {
    activeWorkAreaId, auditEvidenceReportEvents, auditEvidenceReportLedgerRows, error, importAuditEvidenceDeepLinkStatus, indexedExportPackages,
    inspectRunExportPackageByRunId, inspectedArchiveSnapshot, isIndexingExportPackages, p0AcceptanceSummary, pendingImportPackage, researchRunExportBrowserQuery,
    researchRunExportIndexRows, researchRunImportAuditEvents, researchRunImportDiffQuery, runHistory, setActiveWorkAreaId, setAuditEvidenceReportEvents,
    setImportAuditEvidenceDeepLinkStatus, setIndexedExportPackages, setIsIndexingExportPackages, setPendingImportPackage, setResearchRunExportBrowserQuery, setResearchRunImportAuditEvents,
    setResearchRunImportDiffQuery, setRunHistoryState, setWorkspaceState, source, statusLabel, updateAuditEvidenceReportQuery,
    updateResearchRunImportAuditQuery, workspace
  } = controller;
  const researchRunImportArchiveSnapshot =
      pendingImportPackage?.aiReviewArchiveSnapshot ?? inspectedArchiveSnapshot;
  const evidencePackageControlRoom = buildEvidencePackageControlRoomRows({
      acceptanceReviewEvents: auditEvidenceReportEvents,
      auditLedgerRows: auditEvidenceReportLedgerRows,
      exportIndexRows: researchRunExportIndexRows,
      importAuditEvents: researchRunImportAuditEvents,
      p0AcceptanceSummary
    });
  const inspectRunExportPackage = useCallback(
      async (run: ResearchRunAudit) => {
        setResearchRunExportBrowserQuery("");
        setResearchRunImportDiffQuery("");
        await inspectRunExportPackageByRunId(run.runId);
      },
      [inspectRunExportPackageByRunId]
    );
  const inspectResearchRunImportAuditEvent = useCallback(
      async (event: ResearchRunImportAuditEvent) => {
        const focusQuery = researchRunImportAuditEvidenceQuery(event);
        setResearchRunExportBrowserQuery(focusQuery);
        setResearchRunImportDiffQuery(focusQuery);
        await inspectRunExportPackageByRunId(event.runId);
      },
      [inspectRunExportPackageByRunId]
    );
  const loadImportAuditEvidenceDeepLink = useCallback(
      async (deepLink: InitialImportAuditEvidenceDeepLink) => {
        setImportAuditEvidenceDeepLinkStatus({ ...deepLink, status: "loading", error: null });
        setResearchRunExportBrowserQuery(deepLink.focusQuery);
        setResearchRunImportDiffQuery(deepLink.focusQuery);
        const inspection = await inspectRunExportPackageByRunId(deepLink.runId);
        setImportAuditEvidenceDeepLinkStatus({
          ...deepLink,
          status: inspection.ok ? "loaded" : "failed",
          error: inspection.error ?? null
        });
      },
      [inspectRunExportPackageByRunId]
    );
  const retryImportAuditEvidenceDeepLink = useCallback(() => {
      if (!importAuditEvidenceDeepLinkStatus) {
        return;
      }
      void loadImportAuditEvidenceDeepLink({
        auditEventId: importAuditEvidenceDeepLinkStatus.auditEventId,
        exportPath: importAuditEvidenceDeepLinkStatus.exportPath,
        focusQuery: importAuditEvidenceDeepLinkStatus.focusQuery,
        runId: importAuditEvidenceDeepLinkStatus.runId
      });
    }, [importAuditEvidenceDeepLinkStatus, loadImportAuditEvidenceDeepLink]);
  const indexRecentRunExportPackages = useCallback(async () => {
      if (!runHistory.length) {
        setIndexedExportPackages([]);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research run export index empty",
          error: undefined
        }));
        return;
      }

      setIsIndexingExportPackages(true);
      try {
        const results = await Promise.all(runHistory.map((run) => loadResearchRunExport(quantCoreBaseUrl, run.runId)));
        const exportPackages = results
          .map((result) => (result.source === "core" ? result.exportPackage : null))
          .filter((exportPackage): exportPackage is ResearchRunExportPackage => Boolean(exportPackage));
        const failedCount = results.length - exportPackages.length;
        setIndexedExportPackages(exportPackages);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: failedCount ? "Research run export index partial" : "Research run export index loaded",
          error: failedCount ? `${failedCount} recent export package(s) failed to load.` : undefined
        }));
      } finally {
        setIsIndexingExportPackages(false);
      }
    }, [runHistory]);
  const runEvidencePackageControlAction = useCallback(
      (row: EvidencePackageControlRoomRow) => {
        const focusQuery = row.focusQuery || row.exportPath || row.runId;
        setActiveWorkAreaId("audit");
        if (row.nextActionId === "open-import-audit") {
          updateResearchRunImportAuditQuery(focusQuery);
          setResearchRunExportBrowserQuery(row.exportPath || row.runId);
          setResearchRunImportDiffQuery(row.exportPath || row.runId);
        } else if (row.nextActionId === "inspect-package") {
          setResearchRunExportBrowserQuery(row.exportPath || row.runId);
          setResearchRunImportDiffQuery(row.exportPath || row.runId);
          updateAuditEvidenceReportQuery(row.runId);
        } else if (row.nextActionId === "open-acceptance") {
          updateAuditEvidenceReportQuery(`p0_acceptance_review ${row.runId}`);
        } else if (row.nextActionId === "open-signature-ledger") {
          updateAuditEvidenceReportQuery(focusQuery);
        } else {
          setResearchRunExportBrowserQuery(row.exportPath || row.runId);
          updateAuditEvidenceReportQuery(focusQuery);
        }
        setWorkspaceState((current) => ({
          ...current,
          error: undefined,
          statusLabel: `Evidence package focus · ${row.runId} · ${row.statusLabel}`
        }));
      },
      [updateAuditEvidenceReportQuery, updateResearchRunImportAuditQuery]
    );
  return {
    researchRunImportArchiveSnapshot, evidencePackageControlRoom, inspectRunExportPackage, inspectResearchRunImportAuditEvent, loadImportAuditEvidenceDeepLink, retryImportAuditEvidenceDeepLink,
    indexRecentRunExportPackages, runEvidencePackageControlAction
  };
}
