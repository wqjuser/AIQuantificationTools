import { buildP2ReadinessAcceptanceReviewAuditEvent, buildP2ReadinessEvidenceCoverageReviewAuditEvent, saveAuditEvent } from "../../../lib/terminal-api";
import { mergeAuditEvidenceReportEvent } from "../../audit/event-merges";
import { AUDIT_REPORT_EVENTS_PAGE_SIZE, quantCoreBaseUrl } from "../initial-state";
import { useCallback } from "react";
import type { AppControllerBindings } from "./bindings";

type Dependencies = Pick<AppControllerBindings, "auditEvidenceReportEvents" | "copiedP2ReadinessAcceptanceReview" | "copiedP2ReadinessEvidenceCoverageReview" | "error" | "p2ReadinessAcceptanceLatestState" | "p2ReadinessAcceptanceReviewAuditEvent" | "p2ReadinessAcceptanceReviewMarkdown" | "p2ReadinessAcceptanceSummary" | "p2ReadinessEvidenceCoverage" | "p2ReadinessEvidenceCoverageReviewAuditEvent" | "p2ReadinessEvidenceCoverageReviewMarkdown" | "savingP2ReadinessAcceptanceReview" | "savingP2ReadinessEvidenceCoverageReview" | "setAuditEvidenceReportEvents" | "setCopiedP2ReadinessAcceptanceReview" | "setCopiedP2ReadinessEvidenceCoverageReview" | "setP2ReadinessAcceptanceLatestState" | "setP2ReadinessAcceptanceReviewAuditEvent" | "setP2ReadinessEvidenceCoverageReviewAuditEvent" | "setSavingP2ReadinessAcceptanceReview" | "setSavingP2ReadinessEvidenceCoverageReview" | "setWorkspaceState" | "source" | "statusLabel" | "workspace">;
type Result = Pick<AppControllerBindings, "copyP2ReadinessAcceptanceReview" | "downloadP2ReadinessAcceptanceReview" | "saveP2ReadinessAcceptanceReview" | "copyP2ReadinessEvidenceCoverageReview" | "downloadP2ReadinessEvidenceCoverageReview" | "saveP2ReadinessEvidenceCoverageReview">;

export function useP2ReviewActions(controller: Dependencies): Result {
  const {
    auditEvidenceReportEvents, copiedP2ReadinessAcceptanceReview, copiedP2ReadinessEvidenceCoverageReview, error, p2ReadinessAcceptanceLatestState, p2ReadinessAcceptanceReviewAuditEvent,
    p2ReadinessAcceptanceReviewMarkdown, p2ReadinessAcceptanceSummary, p2ReadinessEvidenceCoverage, p2ReadinessEvidenceCoverageReviewAuditEvent, p2ReadinessEvidenceCoverageReviewMarkdown, savingP2ReadinessAcceptanceReview,
    savingP2ReadinessEvidenceCoverageReview, setAuditEvidenceReportEvents, setCopiedP2ReadinessAcceptanceReview, setCopiedP2ReadinessEvidenceCoverageReview, setP2ReadinessAcceptanceLatestState, setP2ReadinessAcceptanceReviewAuditEvent,
    setP2ReadinessEvidenceCoverageReviewAuditEvent, setSavingP2ReadinessAcceptanceReview, setSavingP2ReadinessEvidenceCoverageReview, setWorkspaceState, source, statusLabel,
    workspace
  } = controller;
  const copyP2ReadinessAcceptanceReview = useCallback(async () => {
      if (!navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P2 readiness acceptance review copy failed",
          error: "Clipboard is unavailable"
        }));
        return;
      }

      await navigator.clipboard.writeText(p2ReadinessAcceptanceReviewMarkdown);
      setCopiedP2ReadinessAcceptanceReview(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P2 readiness acceptance review copied",
        error: undefined
      }));
    }, [p2ReadinessAcceptanceReviewMarkdown]);
  const downloadP2ReadinessAcceptanceReview = useCallback(() => {
      const objectUrl = URL.createObjectURL(
        new Blob([p2ReadinessAcceptanceReviewMarkdown], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      const safeRunId = (p2ReadinessAcceptanceLatestState.acceptance?.runId || "latest").replace(/[^a-z0-9._-]+/giu, "-");
      anchor.href = objectUrl;
      anchor.download = `${safeRunId}-p2-readiness-acceptance-review.md`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P2 readiness acceptance review download ready",
        error: undefined
      }));
    }, [p2ReadinessAcceptanceLatestState.acceptance?.runId, p2ReadinessAcceptanceReviewMarkdown]);
  const saveP2ReadinessAcceptanceReview = useCallback(async () => {
      setSavingP2ReadinessAcceptanceReview(true);
      try {
        const auditEvent = await buildP2ReadinessAcceptanceReviewAuditEvent({
          acceptance: p2ReadinessAcceptanceLatestState.acceptance ?? null,
          markdown: p2ReadinessAcceptanceReviewMarkdown,
          summary: p2ReadinessAcceptanceSummary
        });
        const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        if (result.source === "core" && result.event) {
          setP2ReadinessAcceptanceReviewAuditEvent(result.event);
          setAuditEvidenceReportEvents((current) =>
            mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
          );
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "P2 readiness acceptance review saved to audit ledger",
            error: undefined
          }));
          return;
        }

        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P2 readiness acceptance review ledger save failed",
          error: result.error ?? "P2 readiness acceptance review ledger save failed"
        }));
      } finally {
        setSavingP2ReadinessAcceptanceReview(false);
      }
    }, [
      p2ReadinessAcceptanceLatestState.acceptance,
      p2ReadinessAcceptanceReviewMarkdown,
      p2ReadinessAcceptanceSummary,
      quantCoreBaseUrl
    ]);
  const copyP2ReadinessEvidenceCoverageReview = useCallback(async () => {
      if (!navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P2 readiness evidence coverage review copy failed",
          error: "Clipboard is unavailable"
        }));
        return;
      }

      await navigator.clipboard.writeText(p2ReadinessEvidenceCoverageReviewMarkdown);
      setCopiedP2ReadinessEvidenceCoverageReview(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P2 readiness evidence coverage review copied",
        error: undefined
      }));
    }, [p2ReadinessEvidenceCoverageReviewMarkdown]);
  const downloadP2ReadinessEvidenceCoverageReview = useCallback(() => {
      const objectUrl = URL.createObjectURL(
        new Blob([p2ReadinessEvidenceCoverageReviewMarkdown], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "p2-readiness-evidence-coverage-review.md";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P2 readiness evidence coverage review download ready",
        error: undefined
      }));
    }, [p2ReadinessEvidenceCoverageReviewMarkdown]);
  const saveP2ReadinessEvidenceCoverageReview = useCallback(async () => {
      setSavingP2ReadinessEvidenceCoverageReview(true);
      try {
        const auditEvent = await buildP2ReadinessEvidenceCoverageReviewAuditEvent({
          coverage: p2ReadinessEvidenceCoverage,
          markdown: p2ReadinessEvidenceCoverageReviewMarkdown
        });
        const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        if (result.source === "core" && result.event) {
          setP2ReadinessEvidenceCoverageReviewAuditEvent(result.event);
          setAuditEvidenceReportEvents((current) =>
            mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
          );
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "P2 readiness evidence coverage review saved to audit ledger",
            error: undefined
          }));
          return;
        }

        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P2 readiness evidence coverage review ledger save failed",
          error: result.error ?? "P2 readiness evidence coverage review ledger save failed"
        }));
      } finally {
        setSavingP2ReadinessEvidenceCoverageReview(false);
      }
    }, [
      p2ReadinessEvidenceCoverage,
      p2ReadinessEvidenceCoverageReviewMarkdown,
      quantCoreBaseUrl
    ]);
  return {
    copyP2ReadinessAcceptanceReview, downloadP2ReadinessAcceptanceReview, saveP2ReadinessAcceptanceReview, copyP2ReadinessEvidenceCoverageReview, downloadP2ReadinessEvidenceCoverageReview, saveP2ReadinessEvidenceCoverageReview
  };
}
