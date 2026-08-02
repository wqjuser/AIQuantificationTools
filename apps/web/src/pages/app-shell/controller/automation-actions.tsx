import { Panel } from "../../../components/AppPanel";
import { ExecutionAcceptanceAuditLedgerPanel } from "../../../components/ExecutionStage9ProductionAdmissionSection";
import { buildP0AcceptanceReviewAuditEvent, buildP2ManifestChainPreflightReviewAuditEvent, saveAuditEvent } from "../../../lib/terminal-api";
import { buildLocalReviewCoverageNextActionUrlSearch, buildP0CompletionGapUrlSearch, buildP0PlatformActionOutcomeEvidenceLink, P0PlatformActionOutcome, ProductWorkAreaId, resolveLocalReviewCoverageNextActionDeepLinkState } from "../../../lib/terminal-workbench";
import { mergeAuditEvidenceReportEvent } from "../../audit/event-merges";
import { CompactWorkflowNodes } from "../../shared/WorkflowArtifactPanels";
import { localReviewCoverageNextActionCopyStatusLabel } from "../../stage1/local-review-formatters";
import { AUDIT_REPORT_EVENTS_PAGE_SIZE, quantCoreBaseUrl } from "../initial-state";
import { buildStage1P0WorkspaceShareUrl } from "../url-state";
import { useCallback } from "react";
import type { AppControllerBindings } from "./bindings";

type Dependencies = Pick<AppControllerBindings, "activeWorkAreaId" | "activeWorkflowStageId" | "activeWorkspaceContext" | "auditEvidenceReportEvents" | "automatedTradingWorkflowActionInFlightRef" | "automatedTradingWorkflowActionKeyRef" | "automatedTradingWorkflowContextRef" | "automatedTradingWorkflowRunIdRef" | "automatedTradingWorkflowStatus" | "colorScheme" | "copiedP0AcceptanceReview" | "copiedP0ActionOutcomeEvidenceId" | "copiedP2ManifestChainPreflightReview" | "copiedStage1P0DailyUseRefreshOutcome" | "copiedStage1P0DailyUseRefreshOutcomeLink" | "error" | "executionAcceptanceAuditEvents" | "goldenPath" | "i18n" | "isAutomatedTradingWorkflowRunning" | "p0AcceptanceLatestState" | "p0AcceptanceReviewMarkdown" | "p0AcceptanceSummary" | "p2ManifestChainPreflightLatestState" | "p2ManifestChainPreflightReviewAuditEvent" | "p2ManifestChainPreflightReviewMarkdown" | "p2ManifestChainPreflightSummary" | "refreshGoldenPathStatus" | "savingP0AcceptanceReview" | "savingP2ManifestChainPreflightReview" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setAuditEvidenceReportEvents" | "setAutomatedTradingWorkflowStatus" | "setCopiedP0AcceptanceReview" | "setCopiedP0ActionOutcomeEvidenceId" | "setCopiedP2ManifestChainPreflightReview" | "setCopiedStage1P0DailyUseRefreshOutcome" | "setCopiedStage1P0DailyUseRefreshOutcomeLink" | "setExecutionAcceptanceAuditEvents" | "setIsAutomatedTradingWorkflowRunning" | "setP0AcceptanceLatestState" | "setP2ManifestChainPreflightLatestState" | "setP2ManifestChainPreflightReviewAuditEvent" | "setSavingP0AcceptanceReview" | "setSavingP2ManifestChainPreflightReview" | "setStage1P0DailyUseRefreshOutcome" | "setStage6KillSwitchState" | "setStage6SandboxBatch" | "setTextScale" | "setWorkflowRunState" | "setWorkspaceState" | "source" | "stage1P0DailyUseRefreshOutcome" | "stage6KillSwitch" | "stage6SandboxBatch" | "statusLabel" | "textScale" | "workflowRunState" | "workflowStages" | "workspace">;
type Result = Pick<AppControllerBindings, "copyP0CompletionGapLink" | "copyLocalReviewCoverageNextActionLink" | "copyP0ActionOutcomeEvidenceLink" | "copyP0AcceptanceReview" | "downloadP0AcceptanceReview" | "copyStage1P0DailyUseRefreshOutcome" | "copyStage1P0DailyUseRefreshOutcomeLink" | "downloadStage1P0DailyUseRefreshOutcome" | "copyP2ManifestChainPreflightReview" | "downloadP2ManifestChainPreflightReview" | "saveP2ManifestChainPreflightReview" | "saveP0AcceptanceReview" | "goldenPathActionId" | "workspaceContextActionId" | "stopAutomatedTradingWorkflow" | "runAutomatedTradingWorkflow" | "renderWorkflowNodesPanel" | "executionTestnetKillSwitch" | "executionAcceptanceAuditPanel" | "colorSchemeToggleLabel" | "textScalePercent" | "authoritativeFooterSnapshotExpected">;

export function useAutomationActions(controller: Dependencies): Result {
  const {
    activeWorkAreaId, activeWorkflowStageId, activeWorkspaceContext, auditEvidenceReportEvents, automatedTradingWorkflowActionInFlightRef, automatedTradingWorkflowActionKeyRef,
    automatedTradingWorkflowContextRef, automatedTradingWorkflowRunIdRef, automatedTradingWorkflowStatus, colorScheme, copiedP0AcceptanceReview, copiedP0ActionOutcomeEvidenceId,
    copiedP2ManifestChainPreflightReview, copiedStage1P0DailyUseRefreshOutcome, copiedStage1P0DailyUseRefreshOutcomeLink, error, executionAcceptanceAuditEvents, goldenPath,
    i18n, isAutomatedTradingWorkflowRunning, p0AcceptanceLatestState, p0AcceptanceReviewMarkdown, p0AcceptanceSummary, p2ManifestChainPreflightLatestState,
    p2ManifestChainPreflightReviewAuditEvent, p2ManifestChainPreflightReviewMarkdown, p2ManifestChainPreflightSummary, refreshGoldenPathStatus, savingP0AcceptanceReview, savingP2ManifestChainPreflightReview,
    setActiveWorkAreaId, setActiveWorkflowStageId, setAuditEvidenceReportEvents, setAutomatedTradingWorkflowStatus, setCopiedP0AcceptanceReview, setCopiedP0ActionOutcomeEvidenceId,
    setCopiedP2ManifestChainPreflightReview, setCopiedStage1P0DailyUseRefreshOutcome, setCopiedStage1P0DailyUseRefreshOutcomeLink, setExecutionAcceptanceAuditEvents, setIsAutomatedTradingWorkflowRunning, setP0AcceptanceLatestState,
    setP2ManifestChainPreflightLatestState, setP2ManifestChainPreflightReviewAuditEvent, setSavingP0AcceptanceReview, setSavingP2ManifestChainPreflightReview, setStage1P0DailyUseRefreshOutcome, setStage6KillSwitchState,
    setStage6SandboxBatch, setTextScale, setWorkflowRunState, setWorkspaceState, source, stage1P0DailyUseRefreshOutcome,
    stage6KillSwitch, stage6SandboxBatch, statusLabel, textScale, workflowRunState, workflowStages,
    workspace
  } = controller;
  const copyP0CompletionGapLink = useCallback(
      async (targetWorkspaceId: ProductWorkAreaId | null | undefined, auditReportQuery: string) => {
        const normalizedSearch = buildP0CompletionGapUrlSearch({
          auditReportQuery,
          targetWorkspaceId
        });
        if (!normalizedSearch || !navigator.clipboard?.writeText) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "P0 completion gap link copy failed",
            error: "Clipboard is unavailable or the P0 completion gap link is incomplete."
          }));
          return;
        }

        const url = new URL(window.location.href);
        url.search = `?${normalizedSearch}`;
        url.hash = "";
        await navigator.clipboard.writeText(url.toString());
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P0 completion gap link copied",
          error: undefined
        }));
      },
      []
    );
  const copyLocalReviewCoverageNextActionLink = useCallback(
      async (targetWorkspaceId: ProductWorkAreaId | null | undefined, auditReportQuery: string) => {
        const normalizedSearch = buildLocalReviewCoverageNextActionUrlSearch({
          auditReportQuery,
          targetWorkspaceId
        });
        if (!normalizedSearch || !navigator.clipboard?.writeText) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Local review coverage next-step link copy failed",
            error: "Clipboard is unavailable or the local review coverage next-step link is incomplete."
          }));
          return;
        }

        const url = new URL(window.location.href);
        url.search = `?${normalizedSearch}`;
        url.hash = "";
        await navigator.clipboard.writeText(url.toString());
        const state = resolveLocalReviewCoverageNextActionDeepLinkState(normalizedSearch);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: state
            ? localReviewCoverageNextActionCopyStatusLabel(state)
            : "Local review coverage next-step link copied",
          error: undefined
        }));
      },
      []
    );
  const copyP0ActionOutcomeEvidenceLink = useCallback(async (outcome: P0PlatformActionOutcome) => {
      const link = buildP0PlatformActionOutcomeEvidenceLink(outcome);
      if (!link || !navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P0 evidence link copy failed",
          error: "Clipboard is unavailable or no P0 evidence link exists"
        }));
        return;
      }

      const url = new URL(window.location.href);
      url.search = `?${link.search}`;
      url.hash = "";
      await navigator.clipboard.writeText(url.toString());
      setCopiedP0ActionOutcomeEvidenceId(link.evidenceId);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `${link.label} copied`,
        error: undefined
      }));
    }, []);
  const copyP0AcceptanceReview = useCallback(async () => {
      if (!navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P0 acceptance review copy failed",
          error: "Clipboard is unavailable"
        }));
        return;
      }

      await navigator.clipboard.writeText(p0AcceptanceReviewMarkdown);
      setCopiedP0AcceptanceReview(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P0 acceptance review copied",
        error: undefined
      }));
    }, [p0AcceptanceReviewMarkdown]);
  const downloadP0AcceptanceReview = useCallback(() => {
      const objectUrl = URL.createObjectURL(
        new Blob([p0AcceptanceReviewMarkdown], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      const safeRunId = (p0AcceptanceSummary.runId || "latest").replace(/[^a-z0-9._-]+/giu, "-");
      anchor.href = objectUrl;
      anchor.download = `${safeRunId}-p0-acceptance-review.md`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P0 acceptance review download ready",
        error: undefined
      }));
    }, [p0AcceptanceReviewMarkdown, p0AcceptanceSummary.runId]);
  const copyStage1P0DailyUseRefreshOutcome = useCallback(async () => {
      if (!stage1P0DailyUseRefreshOutcome) {
        return;
      }

      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }

        await navigator.clipboard.writeText(stage1P0DailyUseRefreshOutcome.copyText);
        setCopiedStage1P0DailyUseRefreshOutcome(true);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 refresh receipt copied",
          error: undefined
        }));
      } catch (copyError) {
        setCopiedStage1P0DailyUseRefreshOutcome(false);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 refresh receipt copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    }, [stage1P0DailyUseRefreshOutcome]);
  const copyStage1P0DailyUseRefreshOutcomeLink = useCallback(async () => {
      if (!stage1P0DailyUseRefreshOutcome) {
        return;
      }

      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }

        const nextShareUrl = buildStage1P0WorkspaceShareUrl(stage1P0DailyUseRefreshOutcome.targetWorkspaceLink);
        await navigator.clipboard.writeText(nextShareUrl);
        setCopiedStage1P0DailyUseRefreshOutcomeLink(true);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 refresh receipt next link copied",
          error: undefined
        }));
      } catch (copyError) {
        setCopiedStage1P0DailyUseRefreshOutcomeLink(false);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 refresh receipt next link copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    }, [stage1P0DailyUseRefreshOutcome]);
  const downloadStage1P0DailyUseRefreshOutcome = useCallback(() => {
      if (!stage1P0DailyUseRefreshOutcome) {
        return;
      }

      let objectUrl: string | null = null;
      try {
        objectUrl = URL.createObjectURL(
          new Blob([stage1P0DailyUseRefreshOutcome.copyText], { type: "text/markdown;charset=utf-8" })
        );
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = "stage1-p0-daily-refresh-receipt.md";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 refresh receipt download ready",
          error: undefined
        }));
      } catch (downloadError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 refresh receipt download failed",
          error: downloadError instanceof Error ? downloadError.message : "Refresh receipt download failed"
        }));
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }, [stage1P0DailyUseRefreshOutcome]);
  const copyP2ManifestChainPreflightReview = useCallback(async () => {
      if (!navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P2 manifest chain preflight review copy failed",
          error: "Clipboard is unavailable"
        }));
        return;
      }

      await navigator.clipboard.writeText(p2ManifestChainPreflightReviewMarkdown);
      setCopiedP2ManifestChainPreflightReview(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P2 manifest chain preflight review copied",
        error: undefined
      }));
    }, [p2ManifestChainPreflightReviewMarkdown]);
  const downloadP2ManifestChainPreflightReview = useCallback(() => {
      const objectUrl = URL.createObjectURL(
        new Blob([p2ManifestChainPreflightReviewMarkdown], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "p2-manifest-chain-preflight-review.md";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P2 manifest chain preflight review download ready",
        error: undefined
      }));
    }, [p2ManifestChainPreflightReviewMarkdown]);
  const saveP2ManifestChainPreflightReview = useCallback(async () => {
      setSavingP2ManifestChainPreflightReview(true);
      try {
        const auditEvent = await buildP2ManifestChainPreflightReviewAuditEvent({
          markdown: p2ManifestChainPreflightReviewMarkdown,
          preflight: p2ManifestChainPreflightLatestState.preflight ?? null,
          summary: p2ManifestChainPreflightSummary
        });
        const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        if (result.source === "core" && result.event) {
          setP2ManifestChainPreflightReviewAuditEvent(result.event);
          setAuditEvidenceReportEvents((current) =>
            mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
          );
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "P2 manifest chain preflight review saved to audit ledger",
            error: undefined
          }));
          return;
        }

        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P2 manifest chain preflight review ledger save failed",
          error: result.error ?? "P2 manifest chain preflight review ledger save failed"
        }));
      } finally {
        setSavingP2ManifestChainPreflightReview(false);
      }
    }, [
      p2ManifestChainPreflightLatestState.preflight,
      p2ManifestChainPreflightReviewMarkdown,
      p2ManifestChainPreflightSummary,
      quantCoreBaseUrl
    ]);
  const saveP0AcceptanceReview = useCallback(async () => {
      setSavingP0AcceptanceReview(true);
      try {
        const auditEvent = await buildP0AcceptanceReviewAuditEvent({
          acceptance: p0AcceptanceLatestState.acceptance ?? null,
          markdown: p0AcceptanceReviewMarkdown,
          summary: p0AcceptanceSummary
        });
        const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        if (result.source === "core" && result.event) {
          setAuditEvidenceReportEvents((current) =>
            mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
          );
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "P0 acceptance review saved to audit ledger",
            error: undefined
          }));
          return;
        }

        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P0 acceptance review ledger save failed",
          error: result.error ?? "P0 acceptance review ledger save failed"
        }));
      } finally {
        setSavingP0AcceptanceReview(false);
      }
    }, [
      p0AcceptanceLatestState.acceptance,
      p0AcceptanceReviewMarkdown,
      p0AcceptanceSummary,
      quantCoreBaseUrl
    ]);
  const goldenPathActionId = goldenPath?.nextAction?.id;
  const workspaceContextActionId = activeWorkspaceContext?.actionId;
  const stopAutomatedTradingWorkflow = useCallback((message: string) => {
      automatedTradingWorkflowRunIdRef.current += 1;
      automatedTradingWorkflowContextRef.current = null;
      automatedTradingWorkflowActionKeyRef.current = null;
      automatedTradingWorkflowActionInFlightRef.current = false;
      setAutomatedTradingWorkflowStatus(message);
      setIsAutomatedTradingWorkflowRunning(false);
    }, []);
  const runAutomatedTradingWorkflow = useCallback(() => {
      if (isAutomatedTradingWorkflowRunning) {
        return;
      }
      const runId = automatedTradingWorkflowRunIdRef.current + 1;
      automatedTradingWorkflowRunIdRef.current = runId;
      automatedTradingWorkflowContextRef.current = [
        workspace.selectedInstrument.market,
        workspace.selectedInstrument.symbol,
        workspace.selectedTimeframe
      ].join(":");
      automatedTradingWorkflowActionKeyRef.current = null;
      automatedTradingWorkflowActionInFlightRef.current = true;
      setAutomatedTradingWorkflowStatus(
        i18n.locale === "zh-CN" ? "正在读取最新流程状态…" : "Loading the latest workflow status…"
      );
      setIsAutomatedTradingWorkflowRunning(true);
      void refreshGoldenPathStatus().then((result) => {
        if (automatedTradingWorkflowRunIdRef.current !== runId) {
          return;
        }
        automatedTradingWorkflowActionInFlightRef.current = false;
        if (!result.goldenPath) {
          stopAutomatedTradingWorkflow(
            i18n.locale === "zh-CN"
              ? `自动流程无法启动：${result.error ?? "未读取到流程状态。"}`
              : `The automated workflow could not start: ${result.error ?? "No workflow status was returned."}`
          );
          return;
        }
        setAutomatedTradingWorkflowStatus(
          i18n.locale === "zh-CN" ? "流程已就绪，正在切换到下一步…" : "Workflow ready. Opening the next step…"
        );
      });
    }, [
      i18n.locale,
      isAutomatedTradingWorkflowRunning,
      refreshGoldenPathStatus,
      stopAutomatedTradingWorkflow,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]);
  const renderWorkflowNodesPanel = (
      className = "watchlist-workflow-panel",
      title = i18n.t("panel.nodeWorkflow.title"),
      subtitle = i18n.t("panel.nodeWorkflow.subtitle")
    ) => (
      <Panel title={title} subtitle={subtitle} className={className}>
        <CompactWorkflowNodes
          activeStageId={activeWorkflowStageId}
          i18n={i18n}
          runState={workflowRunState}
          stages={workflowStages}
        />
      </Panel>
    );
  const executionTestnetKillSwitch = stage6SandboxBatch?.killSwitch ?? stage6KillSwitch;
  const executionAcceptanceAuditPanel = (
      <ExecutionAcceptanceAuditLedgerPanel
        className="workflow-execution-acceptance-audit-panel"
        events={executionAcceptanceAuditEvents}
        locale={i18n.locale}
      />
    );
  const colorSchemeToggleLabel = i18n.locale === "zh-CN"
      ? colorScheme === "dark" ? "切换到浅色模式" : "切换到深色模式"
      : colorScheme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const textScalePercent = Math.round(textScale * 100);
  const authoritativeFooterSnapshotExpected = activeWorkAreaId === "execution"
      || activeWorkAreaId === "dynamic-trading"
      || activeWorkAreaId === "portfolio";
  return {
    copyP0CompletionGapLink, copyLocalReviewCoverageNextActionLink, copyP0ActionOutcomeEvidenceLink, copyP0AcceptanceReview, downloadP0AcceptanceReview, copyStage1P0DailyUseRefreshOutcome,
    copyStage1P0DailyUseRefreshOutcomeLink, downloadStage1P0DailyUseRefreshOutcome, copyP2ManifestChainPreflightReview, downloadP2ManifestChainPreflightReview, saveP2ManifestChainPreflightReview, saveP0AcceptanceReview,
    goldenPathActionId, workspaceContextActionId, stopAutomatedTradingWorkflow, runAutomatedTradingWorkflow, renderWorkflowNodesPanel, executionTestnetKillSwitch,
    executionAcceptanceAuditPanel, colorSchemeToggleLabel, textScalePercent, authoritativeFooterSnapshotExpected
  };
}
