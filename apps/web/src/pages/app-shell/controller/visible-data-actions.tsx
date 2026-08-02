import { loadTerminalWorkspace, revokeAuditReportEvent, signAuditReportEvent, verifyAuditReportEvent } from "../../../lib/terminal-api";
import { workspaceWithSavedWatchlist } from "../../../lib/terminal-workbench";
import { mergeAuditEvidenceReportEvent } from "../../audit/event-merges";
import { quantCoreBaseUrl } from "../initial-state";
import { useCallback } from "react";
import type { AppControllerBindings } from "./bindings";

type Dependencies = Pick<AppControllerBindings, "activeWorkAreaId" | "auditEvidenceReportEvents" | "error" | "inspectedExportArchiveSnapshot" | "inspectedExportPackage" | "isChartLoading" | "refreshChart" | "refreshMarketCalendarStatus" | "revokingAuditReportEventId" | "setActiveWorkAreaId" | "setAuditEvidenceReportEvents" | "setInspectedExportArchiveSnapshot" | "setInspectedExportPackage" | "setIsChartLoading" | "setRevokingAuditReportEventId" | "setSigningAuditReportEventId" | "setVerifyingAuditReportEventId" | "setWorkspaceState" | "signingAuditReportEventId" | "source" | "statusLabel" | "verifyingAuditReportEventId" | "workspace" | "workspaceQuoteRequestIdRef">;
type Result = Pick<AppControllerBindings, "inspectedArchiveSnapshot" | "refreshVisiblePageData" | "signAuditEvidenceReportEvent" | "verifyAuditEvidenceReportEvent" | "revokeAuditEvidenceReportEvent">;

export function useVisibleDataActions(controller: Dependencies): Result {
  const {
    activeWorkAreaId, auditEvidenceReportEvents, error, inspectedExportArchiveSnapshot, inspectedExportPackage, isChartLoading,
    refreshChart, refreshMarketCalendarStatus, revokingAuditReportEventId, setActiveWorkAreaId, setAuditEvidenceReportEvents, setInspectedExportArchiveSnapshot,
    setInspectedExportPackage, setIsChartLoading, setRevokingAuditReportEventId, setSigningAuditReportEventId, setVerifyingAuditReportEventId, setWorkspaceState,
    signingAuditReportEventId, source, statusLabel, verifyingAuditReportEventId, workspace, workspaceQuoteRequestIdRef
  } = controller;
  const inspectedArchiveSnapshot =
      inspectedExportArchiveSnapshot?.exportPackage === inspectedExportPackage
        && inspectedExportArchiveSnapshot.runId === inspectedExportPackage.researchRun.runId
        ? inspectedExportArchiveSnapshot.aiReviewArchiveSnapshot
        : undefined;
  const refreshVisiblePageData = useCallback(async () => {
      const workspaceRequestId = workspaceQuoteRequestIdRef.current + 1;
      workspaceQuoteRequestIdRef.current = workspaceRequestId;
      const refreshTasks: Array<Promise<void>> = [refreshMarketCalendarStatus(true)];
      refreshTasks.push(
        loadTerminalWorkspace(quantCoreBaseUrl).then((result) => {
          if (result.source !== "core" || workspaceQuoteRequestIdRef.current !== workspaceRequestId) {
            return;
          }
          setWorkspaceState((current) => {
            const refreshedWatchlist = current.workspace.watchlist.map(
              (instrument) =>
                result.workspace.watchlist.find(
                  (candidate) =>
                    candidate.market === instrument.market && candidate.symbol === instrument.symbol
                ) ?? instrument
            );
            return {
              ...current,
              workspace: workspaceWithSavedWatchlist(current.workspace, refreshedWatchlist)
            };
          });
        })
      );
      if (
        !isChartLoading &&
        (activeWorkAreaId === "market" ||
          activeWorkAreaId === "research")
      ) {
        refreshTasks.push(refreshChart(true));
      }
      await Promise.all(refreshTasks);
    }, [activeWorkAreaId, isChartLoading, refreshChart, refreshMarketCalendarStatus]);
  const signAuditEvidenceReportEvent = useCallback(
      async (eventId: string) => {
        setSigningAuditReportEventId(eventId);
        const result = await signAuditReportEvent(quantCoreBaseUrl, eventId);
        if (result.event) {
          setAuditEvidenceReportEvents((current) => mergeAuditEvidenceReportEvent(current, result.event!));
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            source: result.source,
            statusLabel: result.source === "core" ? "Audit report signature failed" : "Offline signature fallback"
          }));
        }
        setSigningAuditReportEventId(null);
      },
      []
    );
  const verifyAuditEvidenceReportEvent = useCallback(
      async (eventId: string) => {
        setVerifyingAuditReportEventId(eventId);
        const result = await verifyAuditReportEvent(quantCoreBaseUrl, eventId);
        if (result.event) {
          setAuditEvidenceReportEvents((current) => mergeAuditEvidenceReportEvent(current, result.event!));
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            source: result.source,
            statusLabel: result.source === "core" ? "Audit report verification failed" : "Offline verification fallback"
          }));
        }
        setVerifyingAuditReportEventId(null);
      },
      []
    );
  const revokeAuditEvidenceReportEvent = useCallback(
      async (eventId: string) => {
        setRevokingAuditReportEventId(eventId);
        const result = await revokeAuditReportEvent(quantCoreBaseUrl, eventId, "manual audit revocation from Audit workspace");
        if (result.event) {
          setAuditEvidenceReportEvents((current) => mergeAuditEvidenceReportEvent(current, result.event!));
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            source: result.source,
            statusLabel: result.source === "core" ? "Audit report revocation failed" : "Offline revocation fallback"
          }));
        }
        setRevokingAuditReportEventId(null);
      },
      []
    );
  return {
    inspectedArchiveSnapshot, refreshVisiblePageData, signAuditEvidenceReportEvent, verifyAuditEvidenceReportEvent, revokeAuditEvidenceReportEvent
  };
}
