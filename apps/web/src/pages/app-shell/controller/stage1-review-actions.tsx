import { buildDailyOpsControlRoomReviewAuditEvent, buildDailyStartBriefReviewAuditEvent, buildStage1P0DailyUseArchiveReviewAuditEvent, saveAuditEvent } from "../../../lib/terminal-api";
import { buildStage1P0DailyUseArchiveBundle as buildStage1P0DailyUseArchiveBundleModel, buildStage1P0InvalidShareDiagnosticsCopyText, buildStage1P0ShareLinkBundleCopyText } from "../../../lib/terminal-workbench";
import { mergeAuditEvidenceReportEvent } from "../../audit/event-merges";
import { AUDIT_REPORT_EVENTS_PAGE_SIZE, initialStage1P0DailyUseShareDeepLinkState, initialStage1P0DailyUseShareDeepLinkStatus, quantCoreBaseUrl } from "../initial-state";
import { buildStage1P0WorkspaceShareUrl } from "../url-state";
import { useCallback } from "react";
import type { AppControllerBindings } from "./bindings";

type Dependencies = Pick<AppControllerBindings, "auditEvidenceReportEvents" | "copiedDailyOpsControlRoomReview" | "copiedDailyStartBriefReview" | "copiedStage1P0DailyUseArchive" | "copiedStage1P0DailyUsePrimaryLink" | "copiedStage1P0DailyUseStartupSnapshot" | "copiedStage1P0InvalidShareDiagnostics" | "copiedStage1P0ShareLinkBundle" | "copyAuditReportLedgerQueryLink" | "dailyOpsControlRoom" | "dailyOpsControlRoomReviewMarkdown" | "dailyOpsControlRoomReviewReference" | "dailyStartBrief" | "dailyStartBriefReviewMarkdown" | "dailyStartBriefReviewReference" | "error" | "openAuditReportLedgerQuery" | "savingDailyOpsControlRoomReview" | "savingDailyStartBriefReview" | "savingStage1P0DailyUseArchive" | "selectProductWorkArea" | "setAuditEvidenceReportEvents" | "setCopiedDailyOpsControlRoomReview" | "setCopiedDailyStartBriefReview" | "setCopiedStage1P0DailyUseArchive" | "setCopiedStage1P0DailyUsePrimaryLink" | "setCopiedStage1P0DailyUseStartupSnapshot" | "setCopiedStage1P0InvalidShareDiagnostics" | "setCopiedStage1P0ShareLinkBundle" | "setSavingDailyOpsControlRoomReview" | "setSavingDailyStartBriefReview" | "setSavingStage1P0DailyUseArchive" | "setStage1P0DailyUseRefreshOutcome" | "setWorkspaceState" | "source" | "stage1P0DailyUseArchiveReviewReference" | "stage1P0DailyUseClosure" | "stage1P0DailyUseRefreshOutcome" | "stage1P0DailyUseStartupSnapshot" | "statusLabel" | "workspace">;
type Result = Pick<AppControllerBindings, "openDailyOpsControlRoomReviewInAudit" | "copyDailyOpsControlRoomReviewAuditLink" | "copyDailyOpsControlRoomReview" | "copyStage1P0DailyUsePrimaryLink" | "buildStage1P0ShareLinkBundleText" | "copyStage1P0ShareLinkBundle" | "buildStage1P0InvalidShareDiagnosticsText" | "copyStage1P0InvalidShareDiagnostics" | "buildStage1P0DailyUseArchiveBundle" | "copyStage1P0DailyUseArchive" | "openStage1P0DailyUsePrimaryAction" | "downloadStage1P0ShareLinkBundle" | "downloadStage1P0DailyUseArchive" | "recordStage1P0DailyUseArchive" | "openStage1P0DailyUseArchiveReviewInAudit" | "copyStage1P0DailyUseArchiveReviewAuditLink" | "copyStage1P0DailyUseArchiveReviewSummary" | "downloadStage1P0DailyUseArchiveReviewSummary" | "copyStage1P0DailyUseStartupSnapshot" | "downloadStage1P0DailyUseStartupSnapshot" | "downloadDailyOpsControlRoomReview" | "recordDailyOpsControlRoomReview" | "openDailyStartBriefReviewInAudit" | "copyDailyStartBriefReviewAuditLink" | "copyDailyStartBriefReview" | "downloadDailyStartBriefReview" | "recordDailyStartBriefReview">;

export function useStage1ReviewActions(controller: Dependencies): Result {
  const {
    auditEvidenceReportEvents, copiedDailyOpsControlRoomReview, copiedDailyStartBriefReview, copiedStage1P0DailyUseArchive, copiedStage1P0DailyUsePrimaryLink, copiedStage1P0DailyUseStartupSnapshot,
    copiedStage1P0InvalidShareDiagnostics, copiedStage1P0ShareLinkBundle, copyAuditReportLedgerQueryLink, dailyOpsControlRoom, dailyOpsControlRoomReviewMarkdown, dailyOpsControlRoomReviewReference,
    dailyStartBrief, dailyStartBriefReviewMarkdown, dailyStartBriefReviewReference, error, openAuditReportLedgerQuery, savingDailyOpsControlRoomReview,
    savingDailyStartBriefReview, savingStage1P0DailyUseArchive, selectProductWorkArea, setAuditEvidenceReportEvents, setCopiedDailyOpsControlRoomReview, setCopiedDailyStartBriefReview,
    setCopiedStage1P0DailyUseArchive, setCopiedStage1P0DailyUsePrimaryLink, setCopiedStage1P0DailyUseStartupSnapshot, setCopiedStage1P0InvalidShareDiagnostics, setCopiedStage1P0ShareLinkBundle, setSavingDailyOpsControlRoomReview,
    setSavingDailyStartBriefReview, setSavingStage1P0DailyUseArchive, setStage1P0DailyUseRefreshOutcome, setWorkspaceState, source, stage1P0DailyUseArchiveReviewReference,
    stage1P0DailyUseClosure, stage1P0DailyUseRefreshOutcome, stage1P0DailyUseStartupSnapshot, statusLabel, workspace
  } = controller;
  const openDailyOpsControlRoomReviewInAudit = useCallback(() => {
      if (!dailyOpsControlRoomReviewReference.query) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Daily ops review audit reference missing",
          error: "No daily ops review has been recorded yet."
        }));
        return;
      }

      openAuditReportLedgerQuery(dailyOpsControlRoomReviewReference.query, "Daily ops review audit query selected");
    }, [dailyOpsControlRoomReviewReference.query, openAuditReportLedgerQuery]);
  const copyDailyOpsControlRoomReviewAuditLink = useCallback(() => {
      if (!dailyOpsControlRoomReviewReference.query) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Daily ops review link copy failed",
          error: "No daily ops review has been recorded yet."
        }));
        return;
      }

      void copyAuditReportLedgerQueryLink(dailyOpsControlRoomReviewReference.query);
    }, [copyAuditReportLedgerQueryLink, dailyOpsControlRoomReviewReference.query]);
  const copyDailyOpsControlRoomReview = useCallback(async () => {
      if (!navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Daily ops review copy failed",
          error: "Clipboard is unavailable"
        }));
        return;
      }

      await navigator.clipboard.writeText(dailyOpsControlRoomReviewMarkdown);
      setCopiedDailyOpsControlRoomReview(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily ops review copied",
        error: undefined
      }));
    }, [dailyOpsControlRoomReviewMarkdown]);
  const copyStage1P0DailyUsePrimaryLink = useCallback(
      async (copiedStatusLabel = "Stage 1 daily primary link copied") => {
        try {
          if (!navigator.clipboard?.writeText) {
            throw new Error("Clipboard API unavailable");
          }

          const primaryShareUrl = buildStage1P0WorkspaceShareUrl(stage1P0DailyUseClosure.primaryWorkspaceLink);
          await navigator.clipboard.writeText(primaryShareUrl);
          setCopiedStage1P0DailyUsePrimaryLink(true);
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: copiedStatusLabel,
            error: undefined
          }));
        } catch (copyError) {
          setCopiedStage1P0DailyUsePrimaryLink(false);
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Stage 1 daily primary link copy failed",
            error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
          }));
        }
      },
      [stage1P0DailyUseClosure.primaryWorkspaceLink]
    );
  const buildStage1P0ShareLinkBundleText = useCallback(
      () =>
        buildStage1P0ShareLinkBundleCopyText({
          closure: stage1P0DailyUseClosure,
          refreshOutcome: stage1P0DailyUseRefreshOutcome,
          resolveShareUrl: buildStage1P0WorkspaceShareUrl
        }),
      [stage1P0DailyUseClosure, stage1P0DailyUseRefreshOutcome]
    );
  const copyStage1P0ShareLinkBundle = useCallback(async () => {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }

        const shareLinkBundleCopyText = buildStage1P0ShareLinkBundleText();
        await navigator.clipboard.writeText(shareLinkBundleCopyText);
        setCopiedStage1P0ShareLinkBundle(true);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 share link bundle copied",
          error: undefined
        }));
      } catch (copyError) {
        setCopiedStage1P0ShareLinkBundle(false);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 share link bundle copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    }, [buildStage1P0ShareLinkBundleText]);
  const buildStage1P0InvalidShareDiagnosticsText = useCallback(() => {
      const replacementLink = buildStage1P0WorkspaceShareUrl(stage1P0DailyUseClosure.primaryWorkspaceLink);
      const incomingSearch = typeof window === "undefined" ? "" : window.location.search;
      return buildStage1P0InvalidShareDiagnosticsCopyText({
        incomingSearch,
        primaryActionLabel: stage1P0DailyUseClosure.primaryActionLabel,
        primaryTargetWorkspaceId: stage1P0DailyUseClosure.primaryTargetWorkspaceId,
        replacementLink,
        status: initialStage1P0DailyUseShareDeepLinkStatus
      });
    }, [
      stage1P0DailyUseClosure.primaryActionLabel,
      stage1P0DailyUseClosure.primaryTargetWorkspaceId,
      stage1P0DailyUseClosure.primaryWorkspaceLink
    ]);
  const copyStage1P0InvalidShareDiagnostics = useCallback(async () => {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }

        const diagnosticsCopyText = buildStage1P0InvalidShareDiagnosticsText();
        await navigator.clipboard.writeText(diagnosticsCopyText);
        setCopiedStage1P0InvalidShareDiagnostics(true);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 invalid share diagnostics copied",
          error: undefined
        }));
      } catch (copyError) {
        setCopiedStage1P0InvalidShareDiagnostics(false);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 invalid share diagnostics copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    }, [buildStage1P0InvalidShareDiagnosticsText]);
  const buildStage1P0DailyUseArchiveBundle = useCallback(
      async () =>
        buildStage1P0DailyUseArchiveBundleModel({
          closure: stage1P0DailyUseClosure,
          invalidShareDiagnosticsCopyText:
            initialStage1P0DailyUseShareDeepLinkStatus.status === "invalid"
              ? buildStage1P0InvalidShareDiagnosticsText()
              : null,
          invalidShareStatus: initialStage1P0DailyUseShareDeepLinkStatus,
          refreshOutcome: stage1P0DailyUseRefreshOutcome,
          resolveShareUrl: buildStage1P0WorkspaceShareUrl,
          shareDeepLinkState: initialStage1P0DailyUseShareDeepLinkState
        }),
      [
        buildStage1P0DailyUseArchiveBundleModel,
        buildStage1P0InvalidShareDiagnosticsText,
        buildStage1P0WorkspaceShareUrl,
        initialStage1P0DailyUseShareDeepLinkState,
        initialStage1P0DailyUseShareDeepLinkStatus,
        stage1P0DailyUseClosure,
        stage1P0DailyUseRefreshOutcome
      ]
    );
  const copyStage1P0DailyUseArchive = useCallback(async () => {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }

        const archive = await buildStage1P0DailyUseArchiveBundle();
        await navigator.clipboard.writeText(archive.contentMarkdown);
        setCopiedStage1P0DailyUseArchive(true);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Stage 1 daily-use archive copied · sha256 ${archive.bodySha256.hash.slice(0, 12)}`,
          error: undefined
        }));
      } catch (copyError) {
        setCopiedStage1P0DailyUseArchive(false);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 daily-use archive copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    }, [buildStage1P0DailyUseArchiveBundle]);
  const openStage1P0DailyUsePrimaryAction = useCallback(() => {
      selectProductWorkArea(stage1P0DailyUseClosure.primaryTargetWorkspaceId);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Stage 1 daily primary action opened · ${stage1P0DailyUseClosure.primaryActionId} -> ${stage1P0DailyUseClosure.primaryTargetWorkspaceId}`,
        error: undefined
      }));
    }, [
      selectProductWorkArea,
      stage1P0DailyUseClosure.primaryActionId,
      stage1P0DailyUseClosure.primaryTargetWorkspaceId
    ]);
  const downloadStage1P0ShareLinkBundle = useCallback(() => {
      let objectUrl: string | null = null;
      try {
        const shareLinkBundleCopyText = buildStage1P0ShareLinkBundleText();
        objectUrl = URL.createObjectURL(
          new Blob([shareLinkBundleCopyText], { type: "text/markdown;charset=utf-8" })
        );
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = "stage1-p0-share-link-bundle.md";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 share link bundle download ready",
          error: undefined
        }));
      } catch (downloadError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 share link bundle download failed",
          error: downloadError instanceof Error ? downloadError.message : "Share link bundle download failed"
        }));
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }, [buildStage1P0ShareLinkBundleText]);
  const downloadStage1P0DailyUseArchive = useCallback(async () => {
      let objectUrl: string | null = null;
      try {
        const archive = await buildStage1P0DailyUseArchiveBundle();
        objectUrl = URL.createObjectURL(
          new Blob([archive.contentMarkdown], { type: "text/markdown;charset=utf-8" })
        );
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = archive.fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Stage 1 daily-use archive download ready · ${archive.fileName} · sha256 ${archive.bodySha256.hash.slice(0, 12)}`,
          error: undefined
        }));
      } catch (downloadError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 daily-use archive download failed",
          error: downloadError instanceof Error ? downloadError.message : "Daily-use archive download failed"
        }));
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }, [
      buildStage1P0DailyUseArchiveBundle,
      initialStage1P0DailyUseShareDeepLinkState,
      initialStage1P0DailyUseShareDeepLinkStatus,
      stage1P0DailyUseClosure
    ]);
  const recordStage1P0DailyUseArchive = useCallback(async () => {
      setSavingStage1P0DailyUseArchive(true);
      try {
        const archive = await buildStage1P0DailyUseArchiveBundle();
        const auditEvent = await buildStage1P0DailyUseArchiveReviewAuditEvent({
          archive,
          closure: stage1P0DailyUseClosure,
          generatedAt: new Date().toISOString(),
          invalidShareStatus: initialStage1P0DailyUseShareDeepLinkStatus,
          refreshOutcome: stage1P0DailyUseRefreshOutcome,
          shareDeepLinkState: initialStage1P0DailyUseShareDeepLinkState
        });
        const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        if (result.source === "core" && result.event) {
          setAuditEvidenceReportEvents((current) =>
            mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
          );
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: `Stage 1 daily-use archive audited · ${result.event!.eventId}`,
            error: undefined
          }));
          return;
        }

        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 daily-use archive ledger save failed",
          error: result.error ?? "Stage 1 daily-use archive ledger save failed"
        }));
      } catch (recordError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 daily-use archive ledger save failed",
          error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
        }));
      } finally {
        setSavingStage1P0DailyUseArchive(false);
      }
    }, [
      buildStage1P0DailyUseArchiveBundle,
      initialStage1P0DailyUseShareDeepLinkState,
      initialStage1P0DailyUseShareDeepLinkStatus,
      quantCoreBaseUrl,
      stage1P0DailyUseClosure,
      stage1P0DailyUseRefreshOutcome
    ]);
  const openStage1P0DailyUseArchiveReviewInAudit = useCallback(() => {
      if (!stage1P0DailyUseArchiveReviewReference.query) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 archive review audit reference missing",
          error: "No Stage 1 daily-use archive review has been recorded yet."
        }));
        return;
      }

      openAuditReportLedgerQuery(
        stage1P0DailyUseArchiveReviewReference.query,
        "Stage 1 archive review audit query selected"
      );
    }, [openAuditReportLedgerQuery, stage1P0DailyUseArchiveReviewReference.query]);
  const copyStage1P0DailyUseArchiveReviewAuditLink = useCallback(() => {
      if (!stage1P0DailyUseArchiveReviewReference.query) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 archive review link copy failed",
          error: "No Stage 1 daily-use archive review has been recorded yet."
        }));
        return;
      }

      void copyAuditReportLedgerQueryLink(stage1P0DailyUseArchiveReviewReference.query);
    }, [copyAuditReportLedgerQueryLink, stage1P0DailyUseArchiveReviewReference.query]);
  const copyStage1P0DailyUseArchiveReviewSummary = useCallback(async () => {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }

        await navigator.clipboard.writeText(stage1P0DailyUseArchiveReviewReference.copyText);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 archive review summary copied",
          error: undefined
        }));
      } catch (copyError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 archive review summary copy failed",
          error: copyError instanceof Error ? copyError.message : "Archive review summary copy failed"
        }));
      }
    }, [stage1P0DailyUseArchiveReviewReference.copyText]);
  const downloadStage1P0DailyUseArchiveReviewSummary = useCallback(() => {
      let objectUrl: string | null = null;
      try {
        objectUrl = URL.createObjectURL(
          new Blob([stage1P0DailyUseArchiveReviewReference.copyText], { type: "text/markdown;charset=utf-8" })
        );
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = stage1P0DailyUseArchiveReviewReference.fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Stage 1 archive review summary download ready · ${stage1P0DailyUseArchiveReviewReference.fileName}`,
          error: undefined
        }));
      } catch (downloadError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 archive review summary download failed",
          error: downloadError instanceof Error ? downloadError.message : "Archive review summary download failed"
        }));
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }, [stage1P0DailyUseArchiveReviewReference.copyText, stage1P0DailyUseArchiveReviewReference.fileName]);
  const copyStage1P0DailyUseStartupSnapshot = useCallback(async () => {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }

        await navigator.clipboard.writeText(stage1P0DailyUseStartupSnapshot.copyText);
        setCopiedStage1P0DailyUseStartupSnapshot(true);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 startup snapshot copied",
          error: undefined
        }));
      } catch (copyError) {
        setCopiedStage1P0DailyUseStartupSnapshot(false);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 startup snapshot copy failed",
          error: copyError instanceof Error ? copyError.message : "Startup snapshot copy failed"
        }));
      }
    }, [stage1P0DailyUseStartupSnapshot.copyText]);
  const downloadStage1P0DailyUseStartupSnapshot = useCallback(() => {
      let objectUrl: string | null = null;
      try {
        objectUrl = URL.createObjectURL(
          new Blob([stage1P0DailyUseStartupSnapshot.copyText], { type: "text/markdown;charset=utf-8" })
        );
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = stage1P0DailyUseStartupSnapshot.fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Stage 1 startup snapshot download ready · ${stage1P0DailyUseStartupSnapshot.fileName}`,
          error: undefined
        }));
      } catch (downloadError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 startup snapshot download failed",
          error: downloadError instanceof Error ? downloadError.message : "Startup snapshot download failed"
        }));
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }, [stage1P0DailyUseStartupSnapshot.copyText, stage1P0DailyUseStartupSnapshot.fileName]);
  const downloadDailyOpsControlRoomReview = useCallback(() => {
      const objectUrl = URL.createObjectURL(
        new Blob([dailyOpsControlRoomReviewMarkdown], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "daily-ops-control-room-review.md";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily ops review download ready",
        error: undefined
      }));
    }, [dailyOpsControlRoomReviewMarkdown]);
  const recordDailyOpsControlRoomReview = useCallback(async () => {
      setSavingDailyOpsControlRoomReview(true);
      try {
        const auditEvent = await buildDailyOpsControlRoomReviewAuditEvent({
          markdown: dailyOpsControlRoomReviewMarkdown,
          summary: dailyOpsControlRoom
        });
        const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        if (result.source === "core" && result.event) {
          setAuditEvidenceReportEvents((current) =>
            mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
          );
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: `Daily ops review audited · ${result.event!.eventId}`,
            error: undefined
          }));
          return;
        }

        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Daily ops review ledger save failed",
          error: result.error ?? "Daily ops review ledger save failed"
        }));
      } catch (recordError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Daily ops review ledger save failed",
          error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
        }));
      } finally {
        setSavingDailyOpsControlRoomReview(false);
      }
    }, [dailyOpsControlRoom, dailyOpsControlRoomReviewMarkdown, quantCoreBaseUrl]);
  const openDailyStartBriefReviewInAudit = useCallback(() => {
      if (!dailyStartBriefReviewReference.query) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Daily start review audit reference missing",
          error: "No daily start review has been recorded yet."
        }));
        return;
      }

      openAuditReportLedgerQuery(dailyStartBriefReviewReference.query, "Daily start review audit query selected");
    }, [dailyStartBriefReviewReference.query, openAuditReportLedgerQuery]);
  const copyDailyStartBriefReviewAuditLink = useCallback(() => {
      if (!dailyStartBriefReviewReference.query) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Daily start review link copy failed",
          error: "No daily start review has been recorded yet."
        }));
        return;
      }

      void copyAuditReportLedgerQueryLink(dailyStartBriefReviewReference.query);
    }, [copyAuditReportLedgerQueryLink, dailyStartBriefReviewReference.query]);
  const copyDailyStartBriefReview = useCallback(async () => {
      if (!navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Daily start review copy failed",
          error: "Clipboard is unavailable"
        }));
        return;
      }

      await navigator.clipboard.writeText(dailyStartBriefReviewMarkdown);
      setCopiedDailyStartBriefReview(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily start review copied",
        error: undefined
      }));
    }, [dailyStartBriefReviewMarkdown]);
  const downloadDailyStartBriefReview = useCallback(() => {
      const objectUrl = URL.createObjectURL(
        new Blob([dailyStartBriefReviewMarkdown], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "daily-start-brief-review.md";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily start review download ready",
        error: undefined
      }));
    }, [dailyStartBriefReviewMarkdown]);
  const recordDailyStartBriefReview = useCallback(async () => {
      setSavingDailyStartBriefReview(true);
      try {
        const auditEvent = await buildDailyStartBriefReviewAuditEvent({
          brief: dailyStartBrief,
          markdown: dailyStartBriefReviewMarkdown
        });
        const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        if (result.source === "core" && result.event) {
          setAuditEvidenceReportEvents((current) =>
            mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
          );
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: `Daily start review audited · ${result.event!.eventId}`,
            error: undefined
          }));
          return;
        }

        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Daily start review ledger save failed",
          error: result.error ?? "Daily start review ledger save failed"
        }));
      } catch (recordError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Daily start review ledger save failed",
          error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
        }));
      } finally {
        setSavingDailyStartBriefReview(false);
      }
    }, [dailyStartBrief, dailyStartBriefReviewMarkdown, quantCoreBaseUrl]);
  return {
    openDailyOpsControlRoomReviewInAudit, copyDailyOpsControlRoomReviewAuditLink, copyDailyOpsControlRoomReview, copyStage1P0DailyUsePrimaryLink, buildStage1P0ShareLinkBundleText, copyStage1P0ShareLinkBundle,
    buildStage1P0InvalidShareDiagnosticsText, copyStage1P0InvalidShareDiagnostics, buildStage1P0DailyUseArchiveBundle, copyStage1P0DailyUseArchive, openStage1P0DailyUsePrimaryAction, downloadStage1P0ShareLinkBundle,
    downloadStage1P0DailyUseArchive, recordStage1P0DailyUseArchive, openStage1P0DailyUseArchiveReviewInAudit, copyStage1P0DailyUseArchiveReviewAuditLink, copyStage1P0DailyUseArchiveReviewSummary, downloadStage1P0DailyUseArchiveReviewSummary,
    copyStage1P0DailyUseStartupSnapshot, downloadStage1P0DailyUseStartupSnapshot, downloadDailyOpsControlRoomReview, recordDailyOpsControlRoomReview, openDailyStartBriefReviewInAudit, copyDailyStartBriefReviewAuditLink,
    copyDailyStartBriefReview, downloadDailyStartBriefReview, recordDailyStartBriefReview
  };
}
