import { selectCurrentStage4PortfolioWorkflow } from "../../../components/PortfolioStage4Section";
import { type AiReviewProviderStatus, buildAiReviewDecisionDraft, resolveAiReviewPrimaryExperiment, resolveAiReviewRestoredSelection } from "../../../lib/ai-review-stage3";
import { loadPortfolioRiskAssessments } from "../../../lib/portfolio-m5";
import { loadStage4PortfolioWorkflows } from "../../../lib/portfolio-stage4";
import { loadStage5ExitAcceptance, loadStage5SandboxAuthorizationPreflights, loadStage5SandboxAuthorizationReviews, loadStage5SandboxReadinessDecisions, loadStage5ShadowSessions } from "../../../lib/stage5-shadow";
import { loadStage6ExitAcceptance, loadStage6KillSwitch, loadStage6SandboxAuthorizations, loadStage6SandboxBatch } from "../../../lib/stage6-sandbox";
import { loadStage7ProductionReadonlyProbes } from "../../../lib/stage7-production-readonly";
import { loadStage8ProductionReadonlyContinuity } from "../../../lib/stage8-readonly-continuity";
import { loadStage9ProductionAdmissionCandidates, loadStage9ProductionAdmissionReviews } from "../../../lib/stage9-production-admission";
import { loadAiReviewProviders, loadAiReviewRunArchiveSnapshot, loadPortfolioPaperOrderApprovals, loadPortfolioPaperOrderBatches, loadPortfolioPaperOrderReplay, loadPortfolioPaperOrderSimulations, loadPortfolioPaperOrderStateHistory, validateStrategySnapshot } from "../../../lib/terminal-api";
import { buildDefaultStrategyExperimentDimensions, resolveAiReviewDraftExperiment } from "../../../lib/terminal-workbench";
import { initialPortfolioBacktestState, initialStage1P0DailyUseShareDeepLinkStatus, initialStrategyValidationState, quantCoreBaseUrl } from "../initial-state";
import { replaceStrategyExperimentUrlParam } from "../url-state";
import { useEffect, useLayoutEffect } from "react";
import type { AppControllerBindings } from "./bindings";

type Dependencies = Pick<AppControllerBindings, "activeWorkAreaId" | "activeWorkAreaIdRef" | "activeWorkspaceSurfaceRef" | "aiReviewArchivePreview" | "aiReviewArchivePreviewRequestIdRef" | "aiReviewStage3CandidateKey" | "aiReviewStage3ComparisonExperimentIds" | "aiReviewStage3ContextKey" | "aiReviewStage3CurrentReview" | "aiReviewStage3DecisionDraft" | "aiReviewStage3Decisions" | "aiReviewStage3Error" | "aiReviewStage3Experiments" | "aiReviewStage3ExternalDataApproved" | "aiReviewStage3History" | "aiReviewStage3LegacyHistory" | "aiReviewStage3PrimaryExperimentId" | "aiReviewStage3ProviderId" | "aiReviewStage3ProviderInitializedRef" | "aiReviewStage3Providers" | "aiReviewStage3RequestCoordinatorRef" | "copiedDailyOpsControlRoomReview" | "copiedDailyStartBriefReview" | "copiedP0AcceptanceReview" | "copiedP0ReadinessReport" | "copiedP2ManifestChainPreflightReview" | "copiedP2ReadinessAcceptanceReview" | "copiedP2ReadinessEvidenceCoverageReview" | "copiedPersonalTeamReadinessReview" | "copiedStage1P0DailyUseArchive" | "copiedStage1P0DailyUseHandoff" | "copiedStage1P0DailyUsePrimaryLink" | "copiedStage1P0DailyUseRefreshOutcome" | "copiedStage1P0DailyUseRefreshOutcomeLink" | "copiedStage1P0DailyUseStartupSnapshot" | "copiedStage1P0InvalidShareDiagnostics" | "copiedStage1P0ShareLinkBundle" | "currentResearchRunId" | "currentResearchRunIdRef" | "dailyOpsControlRoomReviewMarkdown" | "dailyStartBriefReviewMarkdown" | "error" | "initialStrategyExperimentIdRef" | "invalidateAiReviewStage3Review" | "isPreparingPortfolioPeers" | "isRunningStage5Shadow" | "isStrategyExperimentRunning" | "klinesState" | "klinesStateRef" | "p0AcceptanceReviewMarkdown" | "p0PlatformReadinessReportMarkdown" | "p2ManifestChainPreflightReviewMarkdown" | "p2ReadinessAcceptanceReviewMarkdown" | "p2ReadinessEvidenceCoverageReviewMarkdown" | "personalTeamReadinessReviewMarkdown" | "portfolioBacktestDraftKey" | "portfolioBacktestState" | "portfolioPaperOrderBatches" | "portfolioPaperOrderHistoryError" | "portfolioPaperOrderLifecycleEvents" | "portfolioPaperOrderReplay" | "portfolioPaperOrderSimulations" | "portfolioPaperOrderStateHistories" | "portfolioPeerAuditActiveRef" | "portfolioPeerAuditRequestIdRef" | "portfolioRiskAssessmentError" | "portfolioRiskAssessments" | "portfolioStage4RefreshGeneration" | "portfolioStage4RequestCoordinatorRef" | "portfolioStage4Workflows" | "refreshAuditEvidenceReportEvents" | "refreshAuditSigningKeyRotationEvents" | "refreshDesktopReleaseLatest" | "refreshExecutionAcceptanceAuditEvents" | "refreshExecutionAdapterPaperExecutionAuditEvents" | "refreshMarketDataRefreshOverrideAuditEvents" | "refreshP0AcceptanceLatest" | "refreshP1AcceptanceLatest" | "refreshP2ManifestChainPreflightLatest" | "refreshP2PaperReplayLatest" | "refreshP2PreLiveAcceptanceLatest" | "refreshP2ReadinessAcceptanceLatest" | "refreshPortfolioPaperOrderAuditEvents" | "refreshResearchRunImportAuditEvents" | "refreshStage1BootstrapPreflightLatest" | "refreshStage1DailyUseLatest" | "refreshStrategyExperiments" | "resetAiReviewHistoryState" | "resetStage4PortfolioBusyState" | "setActiveWorkAreaId" | "setAiReviewArchivePreview" | "setAiReviewStage3ComparisonExperimentIds" | "setAiReviewStage3CurrentReview" | "setAiReviewStage3DecisionDraft" | "setAiReviewStage3Decisions" | "setAiReviewStage3Error" | "setAiReviewStage3ExternalDataApproved" | "setAiReviewStage3History" | "setAiReviewStage3LegacyHistory" | "setAiReviewStage3PrimaryExperimentId" | "setAiReviewStage3ProviderId" | "setAiReviewStage3Providers" | "setCopiedDailyOpsControlRoomReview" | "setCopiedDailyStartBriefReview" | "setCopiedP0AcceptanceReview" | "setCopiedP0ReadinessReport" | "setCopiedP2ManifestChainPreflightReview" | "setCopiedP2ReadinessAcceptanceReview" | "setCopiedP2ReadinessEvidenceCoverageReview" | "setCopiedPersonalTeamReadinessReview" | "setCopiedStage1P0DailyUseArchive" | "setCopiedStage1P0DailyUseHandoff" | "setCopiedStage1P0DailyUsePrimaryLink" | "setCopiedStage1P0DailyUseRefreshOutcome" | "setCopiedStage1P0DailyUseRefreshOutcomeLink" | "setCopiedStage1P0DailyUseStartupSnapshot" | "setCopiedStage1P0InvalidShareDiagnostics" | "setCopiedStage1P0ShareLinkBundle" | "setIsPreparingPortfolioPeers" | "setIsRunningStage5Shadow" | "setIsStrategyExperimentRunning" | "setKlinesState" | "setPortfolioBacktestState" | "setPortfolioPaperOrderBatches" | "setPortfolioPaperOrderHistoryError" | "setPortfolioPaperOrderLifecycleEvents" | "setPortfolioPaperOrderReplay" | "setPortfolioPaperOrderSimulations" | "setPortfolioPaperOrderStateHistories" | "setPortfolioRiskAssessmentError" | "setPortfolioRiskAssessments" | "setPortfolioStage4RefreshGeneration" | "setPortfolioStage4Workflows" | "setStage1P0DailyUseRefreshOutcome" | "setStage5ExitAcceptance" | "setStage5ExitAcceptanceError" | "setStage5SandboxAuthorizationPreflights" | "setStage5SandboxAuthorizationReviews" | "setStage5SandboxReadinessDecisions" | "setStage5ShadowError" | "setStage5ShadowSessions" | "setStage6ExitAcceptance" | "setStage6KillSwitchState" | "setStage6SandboxAuthorizations" | "setStage6SandboxBatch" | "setStage6SandboxError" | "setStage7ProductionReadonlyError" | "setStage7ProductionReadonlyProbes" | "setStage8ProductionReadonlyContinuity" | "setStage8ProductionReadonlyError" | "setStage9ProductionAdmissionCandidates" | "setStage9ProductionAdmissionClock" | "setStage9ProductionAdmissionError" | "setStage9ProductionAdmissionReviews" | "setStrategyExperimentDimensions" | "setStrategyExperimentDraftSourceKey" | "setStrategyExperimentError" | "setStrategyExperimentGuardrails" | "setStrategyExperimentHistory" | "setStrategyExperimentHistorySourceKey" | "setStrategyExperimentWalkForward" | "setStrategyValidationState" | "setWorkspaceState" | "source" | "stage1P0DailyUseClosure" | "stage1P0DailyUseRefreshOutcome" | "stage1P0DailyUseStartupSnapshot" | "stage5ExitAcceptance" | "stage5ExitAcceptanceError" | "stage5SandboxAuthorizationPreflights" | "stage5SandboxAuthorizationReviews" | "stage5SandboxReadinessDecisions" | "stage5ShadowError" | "stage5ShadowRequestIdRef" | "stage5ShadowSessions" | "stage6ExitAcceptance" | "stage6KillSwitch" | "stage6SandboxAuthorizations" | "stage6SandboxBatch" | "stage6SandboxError" | "stage7ProductionReadonlyError" | "stage7ProductionReadonlyProbes" | "stage8ProductionReadonlyContinuity" | "stage8ProductionReadonlyError" | "stage9ProductionAdmissionCandidates" | "stage9ProductionAdmissionClock" | "stage9ProductionAdmissionError" | "stage9ProductionAdmissionExpiry" | "stage9ProductionAdmissionReviews" | "statusLabel" | "strategyExperimentDimensions" | "strategyExperimentDraftSourceKey" | "strategyExperimentError" | "strategyExperimentGuardrails" | "strategyExperimentHistory" | "strategyExperimentHistorySourceKey" | "strategyExperimentI18nRef" | "strategyExperimentRequestGenerationRef" | "strategyExperimentSourceRunId" | "strategyExperimentStrategyRevision" | "strategyExperimentUsableSourceKey" | "strategyExperimentWalkForward" | "strategyValidationRequestIdRef" | "strategyValidationState" | "syncAiReviewStage3Busy" | "visibleStrategyExperimentActive" | "visibleStrategyExperimentDimensions" | "visibleStrategyExperimentUrlId" | "workspace" | "workspaceScrollPositionsRef">;
type Result = void;

export function useWorkspaceRuntimeEffects(controller: Dependencies): Result {
  const {
    activeWorkAreaId, activeWorkAreaIdRef, activeWorkspaceSurfaceRef, aiReviewArchivePreview, aiReviewArchivePreviewRequestIdRef, aiReviewStage3CandidateKey,
    aiReviewStage3ComparisonExperimentIds, aiReviewStage3ContextKey, aiReviewStage3CurrentReview, aiReviewStage3DecisionDraft, aiReviewStage3Decisions, aiReviewStage3Error,
    aiReviewStage3Experiments, aiReviewStage3ExternalDataApproved, aiReviewStage3History, aiReviewStage3LegacyHistory, aiReviewStage3PrimaryExperimentId, aiReviewStage3ProviderId,
    aiReviewStage3ProviderInitializedRef, aiReviewStage3Providers, aiReviewStage3RequestCoordinatorRef, copiedDailyOpsControlRoomReview, copiedDailyStartBriefReview, copiedP0AcceptanceReview,
    copiedP0ReadinessReport, copiedP2ManifestChainPreflightReview, copiedP2ReadinessAcceptanceReview, copiedP2ReadinessEvidenceCoverageReview, copiedPersonalTeamReadinessReview, copiedStage1P0DailyUseArchive,
    copiedStage1P0DailyUseHandoff, copiedStage1P0DailyUsePrimaryLink, copiedStage1P0DailyUseRefreshOutcome, copiedStage1P0DailyUseRefreshOutcomeLink, copiedStage1P0DailyUseStartupSnapshot, copiedStage1P0InvalidShareDiagnostics,
    copiedStage1P0ShareLinkBundle, currentResearchRunId, currentResearchRunIdRef, dailyOpsControlRoomReviewMarkdown, dailyStartBriefReviewMarkdown, error,
    initialStrategyExperimentIdRef, invalidateAiReviewStage3Review, isPreparingPortfolioPeers, isRunningStage5Shadow, isStrategyExperimentRunning, klinesState,
    klinesStateRef, p0AcceptanceReviewMarkdown, p0PlatformReadinessReportMarkdown, p2ManifestChainPreflightReviewMarkdown, p2ReadinessAcceptanceReviewMarkdown, p2ReadinessEvidenceCoverageReviewMarkdown,
    personalTeamReadinessReviewMarkdown, portfolioBacktestDraftKey, portfolioBacktestState, portfolioPaperOrderBatches, portfolioPaperOrderHistoryError, portfolioPaperOrderLifecycleEvents,
    portfolioPaperOrderReplay, portfolioPaperOrderSimulations, portfolioPaperOrderStateHistories, portfolioPeerAuditActiveRef, portfolioPeerAuditRequestIdRef, portfolioRiskAssessmentError,
    portfolioRiskAssessments, portfolioStage4RefreshGeneration, portfolioStage4RequestCoordinatorRef, portfolioStage4Workflows, refreshAuditEvidenceReportEvents, refreshAuditSigningKeyRotationEvents,
    refreshDesktopReleaseLatest, refreshExecutionAcceptanceAuditEvents, refreshExecutionAdapterPaperExecutionAuditEvents, refreshMarketDataRefreshOverrideAuditEvents, refreshP0AcceptanceLatest, refreshP1AcceptanceLatest,
    refreshP2ManifestChainPreflightLatest, refreshP2PaperReplayLatest, refreshP2PreLiveAcceptanceLatest, refreshP2ReadinessAcceptanceLatest, refreshPortfolioPaperOrderAuditEvents, refreshResearchRunImportAuditEvents,
    refreshStage1BootstrapPreflightLatest, refreshStage1DailyUseLatest, refreshStrategyExperiments, resetAiReviewHistoryState, resetStage4PortfolioBusyState, setActiveWorkAreaId,
    setAiReviewArchivePreview, setAiReviewStage3ComparisonExperimentIds, setAiReviewStage3CurrentReview, setAiReviewStage3DecisionDraft, setAiReviewStage3Decisions, setAiReviewStage3Error,
    setAiReviewStage3ExternalDataApproved, setAiReviewStage3History, setAiReviewStage3LegacyHistory, setAiReviewStage3PrimaryExperimentId, setAiReviewStage3ProviderId, setAiReviewStage3Providers,
    setCopiedDailyOpsControlRoomReview, setCopiedDailyStartBriefReview, setCopiedP0AcceptanceReview, setCopiedP0ReadinessReport, setCopiedP2ManifestChainPreflightReview, setCopiedP2ReadinessAcceptanceReview,
    setCopiedP2ReadinessEvidenceCoverageReview, setCopiedPersonalTeamReadinessReview, setCopiedStage1P0DailyUseArchive, setCopiedStage1P0DailyUseHandoff, setCopiedStage1P0DailyUsePrimaryLink, setCopiedStage1P0DailyUseRefreshOutcome,
    setCopiedStage1P0DailyUseRefreshOutcomeLink, setCopiedStage1P0DailyUseStartupSnapshot, setCopiedStage1P0InvalidShareDiagnostics, setCopiedStage1P0ShareLinkBundle, setIsPreparingPortfolioPeers, setIsRunningStage5Shadow,
    setIsStrategyExperimentRunning, setKlinesState, setPortfolioBacktestState, setPortfolioPaperOrderBatches, setPortfolioPaperOrderHistoryError, setPortfolioPaperOrderLifecycleEvents,
    setPortfolioPaperOrderReplay, setPortfolioPaperOrderSimulations, setPortfolioPaperOrderStateHistories, setPortfolioRiskAssessmentError, setPortfolioRiskAssessments, setPortfolioStage4RefreshGeneration,
    setPortfolioStage4Workflows, setStage1P0DailyUseRefreshOutcome, setStage5ExitAcceptance, setStage5ExitAcceptanceError, setStage5SandboxAuthorizationPreflights, setStage5SandboxAuthorizationReviews,
    setStage5SandboxReadinessDecisions, setStage5ShadowError, setStage5ShadowSessions, setStage6ExitAcceptance, setStage6KillSwitchState, setStage6SandboxAuthorizations,
    setStage6SandboxBatch, setStage6SandboxError, setStage7ProductionReadonlyError, setStage7ProductionReadonlyProbes, setStage8ProductionReadonlyContinuity, setStage8ProductionReadonlyError,
    setStage9ProductionAdmissionCandidates, setStage9ProductionAdmissionClock, setStage9ProductionAdmissionError, setStage9ProductionAdmissionReviews, setStrategyExperimentDimensions, setStrategyExperimentDraftSourceKey,
    setStrategyExperimentError, setStrategyExperimentGuardrails, setStrategyExperimentHistory, setStrategyExperimentHistorySourceKey, setStrategyExperimentWalkForward, setStrategyValidationState,
    setWorkspaceState, source, stage1P0DailyUseClosure, stage1P0DailyUseRefreshOutcome, stage1P0DailyUseStartupSnapshot, stage5ExitAcceptance,
    stage5ExitAcceptanceError, stage5SandboxAuthorizationPreflights, stage5SandboxAuthorizationReviews, stage5SandboxReadinessDecisions, stage5ShadowError, stage5ShadowRequestIdRef,
    stage5ShadowSessions, stage6ExitAcceptance, stage6KillSwitch, stage6SandboxAuthorizations, stage6SandboxBatch, stage6SandboxError,
    stage7ProductionReadonlyError, stage7ProductionReadonlyProbes, stage8ProductionReadonlyContinuity, stage8ProductionReadonlyError, stage9ProductionAdmissionCandidates, stage9ProductionAdmissionClock,
    stage9ProductionAdmissionError, stage9ProductionAdmissionExpiry, stage9ProductionAdmissionReviews, statusLabel, strategyExperimentDimensions, strategyExperimentDraftSourceKey,
    strategyExperimentError, strategyExperimentGuardrails, strategyExperimentHistory, strategyExperimentHistorySourceKey, strategyExperimentI18nRef, strategyExperimentRequestGenerationRef,
    strategyExperimentSourceRunId, strategyExperimentStrategyRevision, strategyExperimentUsableSourceKey, strategyExperimentWalkForward, strategyValidationRequestIdRef, strategyValidationState,
    syncAiReviewStage3Busy, visibleStrategyExperimentActive, visibleStrategyExperimentDimensions, visibleStrategyExperimentUrlId, workspace, workspaceScrollPositionsRef
  } = controller;
  useLayoutEffect(() => {
      activeWorkAreaIdRef.current = activeWorkAreaId;
      const position = workspaceScrollPositionsRef.current[activeWorkAreaId] ?? {
        surfaceTop: 0,
        windowTop: 0
      };
      if (activeWorkspaceSurfaceRef.current) {
        activeWorkspaceSurfaceRef.current.scrollTop = position.surfaceTop;
      }
      if (typeof window !== "undefined") {
        window.scrollTo(0, position.windowTop);
      }
    }, [activeWorkAreaId]);
  useEffect(() => {
      if (typeof window === "undefined") {
        return;
      }
      const rememberWindowScroll = () => {
        const workAreaId = activeWorkAreaIdRef.current;
        workspaceScrollPositionsRef.current[workAreaId] = {
          surfaceTop:
            activeWorkspaceSurfaceRef.current?.scrollTop ??
            workspaceScrollPositionsRef.current[workAreaId]?.surfaceTop ??
            0,
          windowTop: window.scrollY
        };
      };
      window.addEventListener("scroll", rememberWindowScroll, { passive: true });
      return () => window.removeEventListener("scroll", rememberWindowScroll);
    }, []);
  useLayoutEffect(() => {
      resetStage4PortfolioBusyState();
      portfolioPeerAuditRequestIdRef.current += 1;
      portfolioPeerAuditActiveRef.current = false;
      setIsPreparingPortfolioPeers(false);
      setIsRunningStage5Shadow(false);
      stage5ShadowRequestIdRef.current += 1;
      portfolioStage4RequestCoordinatorRef.current.invalidate(currentResearchRunIdRef.current);
    }, [currentResearchRunId, resetStage4PortfolioBusyState]);
  useEffect(() => {
      if (!stage9ProductionAdmissionExpiry) return;
      const delay = Math.max(0, Math.min(
        Date.parse(stage9ProductionAdmissionExpiry) - Date.now() + 1,
        2_147_483_647
      ));
      const timer = window.setTimeout(() => setStage9ProductionAdmissionClock(Date.now()), delay);
      return () => window.clearTimeout(timer);
    }, [stage9ProductionAdmissionExpiry]);
  useEffect(() => {
      void loadStage6ExitAcceptance(quantCoreBaseUrl).then((result) => setStage6ExitAcceptance(result.acceptance ?? null));
      void loadStage6KillSwitch(quantCoreBaseUrl).then((result) => setStage6KillSwitchState(result.killSwitch ?? null));
      void loadStage7ProductionReadonlyProbes(quantCoreBaseUrl).then((result) => {
        setStage7ProductionReadonlyProbes(result.probes);
        setStage7ProductionReadonlyError(result.error ?? null);
      });
      void loadStage8ProductionReadonlyContinuity(quantCoreBaseUrl).then((result) => {
        setStage8ProductionReadonlyContinuity(result.continuity ?? null);
        setStage8ProductionReadonlyError(result.error ?? null);
      });
    }, []);
  useEffect(() => {
      klinesStateRef.current = klinesState;
    }, [klinesState]);
  useEffect(() => {
      setCopiedP0ReadinessReport(false);
    }, [p0PlatformReadinessReportMarkdown]);
  useEffect(() => {
      setCopiedP0AcceptanceReview(false);
    }, [p0AcceptanceReviewMarkdown]);
  useEffect(() => {
      setCopiedP2ReadinessAcceptanceReview(false);
    }, [p2ReadinessAcceptanceReviewMarkdown]);
  useEffect(() => {
      setCopiedP2ReadinessEvidenceCoverageReview(false);
    }, [p2ReadinessEvidenceCoverageReviewMarkdown]);
  useEffect(() => {
      setCopiedP2ManifestChainPreflightReview(false);
    }, [p2ManifestChainPreflightReviewMarkdown]);
  useEffect(() => {
      setCopiedPersonalTeamReadinessReview(false);
    }, [personalTeamReadinessReviewMarkdown]);
  useEffect(() => {
      setCopiedDailyOpsControlRoomReview(false);
    }, [dailyOpsControlRoomReviewMarkdown]);
  useEffect(() => {
      setCopiedDailyStartBriefReview(false);
    }, [dailyStartBriefReviewMarkdown]);
  useEffect(() => {
      setCopiedStage1P0DailyUseHandoff(false);
    }, [stage1P0DailyUseClosure.copyText]);
  useEffect(() => {
      setCopiedStage1P0DailyUsePrimaryLink(false);
    }, [stage1P0DailyUseClosure.primaryWorkspaceLink]);
  useEffect(() => {
      setCopiedStage1P0ShareLinkBundle(false);
    }, [stage1P0DailyUseClosure.copyText, stage1P0DailyUseRefreshOutcome?.copyText]);
  useEffect(() => {
      setCopiedStage1P0DailyUseArchive(false);
    }, [stage1P0DailyUseClosure.copyText, stage1P0DailyUseRefreshOutcome?.copyText]);
  useEffect(() => {
      setCopiedStage1P0DailyUseStartupSnapshot(false);
    }, [stage1P0DailyUseStartupSnapshot.copyText]);
  useEffect(() => {
      setCopiedStage1P0InvalidShareDiagnostics(false);
    }, [initialStage1P0DailyUseShareDeepLinkStatus, stage1P0DailyUseClosure.primaryWorkspaceLink]);
  useEffect(() => {
      setCopiedStage1P0DailyUseRefreshOutcome(false);
    }, [stage1P0DailyUseRefreshOutcome?.copyText]);
  useEffect(() => {
      setCopiedStage1P0DailyUseRefreshOutcomeLink(false);
    }, [stage1P0DailyUseRefreshOutcome?.targetWorkspaceLink]);
  useEffect(() => {
      setPortfolioBacktestState(initialPortfolioBacktestState);
    }, [portfolioBacktestDraftKey]);
  useEffect(() => {
      let cancelled = false;
      void loadStage5ExitAcceptance(quantCoreBaseUrl).then((result) => {
        if (cancelled) return;
        setStage5ExitAcceptance(result.acceptance);
        setStage5ExitAcceptanceError(result.error ?? null);
      });
      return () => { cancelled = true; };
    }, []);
  useEffect(() => {
      const baseRunId = currentResearchRunId;
      const request = portfolioStage4RequestCoordinatorRef.current.begin(baseRunId);
      const requestIsCurrent = () => portfolioStage4RequestCoordinatorRef.current.isCurrent(request);
      if (!baseRunId) {
        setPortfolioPaperOrderBatches([]);
        setPortfolioPaperOrderLifecycleEvents([]);
        setPortfolioPaperOrderSimulations([]);
        setPortfolioPaperOrderReplay(null);
        setPortfolioPaperOrderStateHistories([]);
        setPortfolioStage4Workflows([]);
        setPortfolioRiskAssessments([]);
        setPortfolioRiskAssessmentError(null);
        setPortfolioPaperOrderHistoryError(null);
        return;
      }
      setPortfolioPaperOrderHistoryError(null);
      void (async () => {
        const [batchResult, replayResult, workflowResult, riskAssessmentResult] = await Promise.all([
          loadPortfolioPaperOrderBatches(quantCoreBaseUrl, baseRunId),
          loadPortfolioPaperOrderReplay(quantCoreBaseUrl, baseRunId),
          loadStage4PortfolioWorkflows(quantCoreBaseUrl, baseRunId),
          loadPortfolioRiskAssessments(quantCoreBaseUrl, baseRunId)
        ]);
        if (!requestIsCurrent()) return;
        setPortfolioPaperOrderBatches(batchResult.batches);
        setPortfolioPaperOrderReplay(replayResult.replay ?? null);
        setPortfolioStage4Workflows(workflowResult.workflows);
        setPortfolioRiskAssessments(riskAssessmentResult.assessments);
        setPortfolioRiskAssessmentError(riskAssessmentResult.error ?? null);
        const latestBatch = [...batchResult.batches].sort(
          (left, right) => right.createdAt.localeCompare(left.createdAt)
        )[0];
        const restoredWorkflow = selectCurrentStage4PortfolioWorkflow(
          workflowResult.workflows,
          baseRunId,
          latestBatch?.batchId
        );
        if (restoredWorkflow) setPortfolioBacktestState({ portfolio: restoredWorkflow.portfolio, source: "core" });
        if (!batchResult.batches.length) {
          setPortfolioPaperOrderLifecycleEvents([]);
          setPortfolioPaperOrderSimulations([]);
          setPortfolioPaperOrderStateHistories([]);
          setPortfolioPaperOrderHistoryError(
            batchResult.error ?? replayResult.error ?? workflowResult.error ?? riskAssessmentResult.error ?? null
          );
          return;
        }
        const [approvalResults, simulationResults, stateHistoryResults] = await Promise.all([
          Promise.all(
            batchResult.batches.map((batch) => loadPortfolioPaperOrderApprovals(quantCoreBaseUrl, baseRunId, batch.batchId))
          ),
          Promise.all(
            batchResult.batches.map((batch) => loadPortfolioPaperOrderSimulations(quantCoreBaseUrl, baseRunId, batch.batchId))
          ),
          Promise.all(
            batchResult.batches.map((batch) => loadPortfolioPaperOrderStateHistory(quantCoreBaseUrl, baseRunId, batch.batchId))
          )
        ]);
        if (!requestIsCurrent()) return;
        setPortfolioPaperOrderLifecycleEvents(approvalResults.flatMap((result) => result.lifecycle));
        setPortfolioPaperOrderSimulations(simulationResults.flatMap((result) => result.simulations));
        setPortfolioPaperOrderStateHistories(stateHistoryResults.flatMap((result) =>
          result.stateHistory ? [result.stateHistory] : []));
        setPortfolioPaperOrderHistoryError([
          batchResult, replayResult, workflowResult, riskAssessmentResult,
          ...approvalResults, ...simulationResults, ...stateHistoryResults
        ].find((result) => result.error)?.error ?? null);
      })();
    }, [currentResearchRunId, portfolioStage4RefreshGeneration]);
  useEffect(() => {
      const baseRunId = currentResearchRunId;
      let cancelled = false;
      if (!baseRunId) {
        setStage5ShadowSessions([]);
        setStage5SandboxReadinessDecisions([]);
        setStage5SandboxAuthorizationPreflights([]);
        setStage5SandboxAuthorizationReviews([]);
        setStage5ShadowError(null);
        return;
      }
      setStage5ShadowError(null);
      void Promise.all([
        loadStage5ShadowSessions(quantCoreBaseUrl, baseRunId),
        loadStage5SandboxReadinessDecisions(quantCoreBaseUrl, baseRunId),
        loadStage5SandboxAuthorizationPreflights(quantCoreBaseUrl, baseRunId),
        loadStage5SandboxAuthorizationReviews(quantCoreBaseUrl, baseRunId)
      ]).then(([sessionResult, readinessResult, preflightResult, reviewResult]) => {
        if (cancelled) return;
        setStage5ShadowSessions(sessionResult.sessions);
        setStage5SandboxReadinessDecisions(readinessResult.decisions);
        setStage5SandboxAuthorizationPreflights(preflightResult.preflights);
        setStage5SandboxAuthorizationReviews(reviewResult.reviews);
        setStage5ShadowError(
          sessionResult.error ?? readinessResult.error ?? preflightResult.error ?? reviewResult.error ?? null
        );
      });
      return () => { cancelled = true; };
    }, [currentResearchRunId]);
  useEffect(() => {
      const baseRunId = currentResearchRunId;
      let cancelled = false;
      if (!baseRunId) {
        setStage9ProductionAdmissionCandidates([]);
        setStage9ProductionAdmissionReviews([]);
        setStage9ProductionAdmissionError(null);
        return;
      }
      void Promise.all([
        loadStage9ProductionAdmissionCandidates(quantCoreBaseUrl, baseRunId),
        loadStage9ProductionAdmissionReviews(quantCoreBaseUrl, baseRunId)
      ]).then(([candidateResult, reviewResult]) => {
        if (cancelled) return;
        setStage9ProductionAdmissionCandidates(candidateResult.candidates);
        setStage9ProductionAdmissionReviews(reviewResult.reviews);
        setStage9ProductionAdmissionError(candidateResult.error ?? reviewResult.error ?? null);
      });
      return () => { cancelled = true; };
    }, [currentResearchRunId]);
  useEffect(() => {
      const baseRunId = currentResearchRunId;
      let cancelled = false;
      if (!baseRunId) {
        setStage6SandboxAuthorizations([]);
        setStage6SandboxBatch(null);
        setStage6SandboxError(null);
        return;
      }
      void loadStage6SandboxAuthorizations(quantCoreBaseUrl, baseRunId).then(async (result) => {
        if (cancelled) return;
        setStage6SandboxAuthorizations(result.authorizations);
        setStage6SandboxError(result.error ?? null);
        const latest = result.authorizations[0];
        if (!latest) return setStage6SandboxBatch(null);
        const batchResult = await loadStage6SandboxBatch(quantCoreBaseUrl, latest.authorizationId);
        if (cancelled) return;
        setStage6SandboxBatch(batchResult.batch ?? null);
        if (batchResult.batch) setStage6KillSwitchState(batchResult.batch.killSwitch);
        setStage6SandboxError(batchResult.error ?? result.error ?? null);
      });
      return () => { cancelled = true; };
    }, [currentResearchRunId]);
  useEffect(() => {
      const requestId = strategyValidationRequestIdRef.current + 1;
      strategyValidationRequestIdRef.current = requestId;
      setStrategyValidationState(initialStrategyValidationState);
      void validateStrategySnapshot(quantCoreBaseUrl, {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe,
        auditRunId: workspace.researchRun?.runId ?? null,
        strategy: workspace.strategy
      }).then((result) => {
        if (strategyValidationRequestIdRef.current === requestId) {
          setStrategyValidationState(result);
        }
      });
    }, [
      workspace.researchRun?.runId,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe,
      workspace.strategy
    ]);
  useLayoutEffect(() => {
      const coordinator = aiReviewStage3RequestCoordinatorRef.current!;
      const request = coordinator.beginContext(aiReviewStage3ContextKey);
      syncAiReviewStage3Busy();
      setAiReviewStage3Providers([]);
      setAiReviewStage3ExternalDataApproved(false);
      setAiReviewStage3PrimaryExperimentId(null);
      setAiReviewStage3ComparisonExperimentIds([]);
      setAiReviewStage3History([]);
      setAiReviewStage3LegacyHistory([]);
      setAiReviewStage3CurrentReview(null);
      setAiReviewStage3Decisions([]);
      setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft([]));
      setAiReviewStage3Error(null);
      const applyProviders = (providers: AiReviewProviderStatus[]) => {
        setAiReviewStage3Providers(providers);
        setAiReviewStage3ProviderId((current) => {
          const currentConfigured = providers.some(
            (provider) => provider.providerId === current && provider.configured
          );
          const configuredExternal = providers.find(
            (provider) => provider.providerId !== "local" && provider.configured
          );
          const next = !aiReviewStage3ProviderInitializedRef.current && configuredExternal
            ? configuredExternal.providerId
            : currentConfigured ? current : "local";
          aiReviewStage3ProviderInitializedRef.current = true;
          return next;
        });
      };

      const loadsProviderRegistryOnly =
        activeWorkAreaId === "settings" || activeWorkAreaId === "market";
      if (loadsProviderRegistryOnly) {
        void loadAiReviewProviders(quantCoreBaseUrl, request.signal).then((providerResult) => {
          if (!coordinator.isCurrent(request)) {
            return;
          }
          applyProviders(providerResult.providers);
          coordinator.finish(request);
          syncAiReviewStage3Busy();
        });
        return () => coordinator.dispose();
      }

      if (activeWorkAreaId !== "ai-review") {
        coordinator.finish(request);
        syncAiReviewStage3Busy();
        return () => coordinator.dispose();
      }

      if (!strategyExperimentSourceRunId) {
        void loadAiReviewProviders(quantCoreBaseUrl, request.signal).then((providerResult) => {
          if (!coordinator.isCurrent(request)) {
            return;
          }
          applyProviders(providerResult.providers);
          setAiReviewStage3Error(providerResult.source === "core"
            ? null
            : strategyExperimentI18nRef.current.t("aiReviewStage3.error.serviceLoadFailed"));
          coordinator.finish(request);
          syncAiReviewStage3Busy();
        });
        return () => coordinator.dispose();
      }

      void Promise.all([
        loadAiReviewProviders(quantCoreBaseUrl, request.signal),
        loadAiReviewRunArchiveSnapshot(quantCoreBaseUrl, strategyExperimentSourceRunId, request.signal)
      ]).then(([providerResult, archiveResult]) => {
        if (!coordinator.isCurrent(request)) {
          return;
        }
        applyProviders(providerResult.providers);
        const restoredSelection = archiveResult.source === "core"
          ? resolveAiReviewRestoredSelection(
              archiveResult.authoritativeAiReviewRecords,
              archiveResult.aiReviewDecisions,
              strategyExperimentSourceRunId
            )
          : null;
        const restoredExperiment = restoredSelection
          ? resolveAiReviewDraftExperiment(
              restoredSelection.primaryExperimentId,
              aiReviewStage3Experiments,
              visibleStrategyExperimentDimensions,
              strategyExperimentGuardrails,
              strategyExperimentWalkForward
            )
          : null;
        if (archiveResult.source === "core" && restoredSelection) {
          setAiReviewStage3History(archiveResult.authoritativeAiReviewRecords);
          setAiReviewStage3LegacyHistory(archiveResult.legacyAiReviewRecords);
          if (restoredSelection.review) {
            setAiReviewStage3CurrentReview(restoredSelection.review);
            setAiReviewStage3Decisions(restoredSelection.decisions);
            setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft(restoredSelection.decisions));
            if (restoredExperiment) {
              setAiReviewStage3PrimaryExperimentId(restoredSelection.primaryExperimentId);
              setAiReviewStage3ComparisonExperimentIds(restoredSelection.comparisonExperimentIds);
            }
          }
        }
        setAiReviewStage3Error(providerResult.source !== "core"
          ? strategyExperimentI18nRef.current.t("aiReviewStage3.error.serviceLoadFailed")
          : archiveResult.source !== "core"
            ? strategyExperimentI18nRef.current.t("aiReviewStage3.error.historyLoadFailed")
            : restoredSelection === null
              ? strategyExperimentI18nRef.current.t("aiReviewStage3.error.readbackInconsistent")
              : null);
        coordinator.finish(request);
        syncAiReviewStage3Busy();
      });

      return () => coordinator.dispose();
    }, [
      activeWorkAreaId,
      aiReviewStage3CandidateKey,
      aiReviewStage3ContextKey,
      strategyExperimentSourceRunId,
      syncAiReviewStage3Busy
    ]);
  useLayoutEffect(() => {
      const primary = resolveAiReviewPrimaryExperiment(
        visibleStrategyExperimentActive,
        aiReviewStage3Experiments
      );
      invalidateAiReviewStage3Review();
      setAiReviewStage3PrimaryExperimentId(primary?.experimentId ?? null);
      setAiReviewStage3ComparisonExperimentIds([]);
      setAiReviewStage3ExternalDataApproved(false);
      setAiReviewStage3Error(null);
    }, [aiReviewStage3CandidateKey, aiReviewStage3ContextKey, invalidateAiReviewStage3Review]);
  useEffect(() => {
      resetAiReviewHistoryState();
    }, [resetAiReviewHistoryState, workspace.researchRun?.runId]);
  useEffect(() => {
      const requestGeneration = strategyExperimentRequestGenerationRef.current + 1;
      strategyExperimentRequestGenerationRef.current = requestGeneration;
      setIsStrategyExperimentRunning(false);
      setStrategyExperimentError(null);
      setStrategyExperimentDraftSourceKey(strategyExperimentUsableSourceKey);
      setStrategyExperimentDimensions(
        strategyExperimentUsableSourceKey && workspace.researchRun?.strategyConfig
          ? buildDefaultStrategyExperimentDimensions(workspace.researchRun.strategyConfig)
          : []
      );
      if (
        !strategyExperimentUsableSourceKey ||
        !strategyExperimentSourceRunId ||
        !strategyExperimentStrategyRevision
      ) {
        setStrategyExperimentHistory([]);
        setStrategyExperimentHistorySourceKey(null);
        return;
      }
      void refreshStrategyExperiments(
        requestGeneration,
        strategyExperimentUsableSourceKey,
        strategyExperimentSourceRunId,
        strategyExperimentStrategyRevision
      );
    }, [refreshStrategyExperiments, strategyExperimentUsableSourceKey]);
  useEffect(() => {
      if (initialStrategyExperimentIdRef.current) {
        return;
      }
      replaceStrategyExperimentUrlParam(visibleStrategyExperimentUrlId);
    }, [visibleStrategyExperimentUrlId]);
  useEffect(() => {
      void refreshP0AcceptanceLatest();
    }, [refreshP0AcceptanceLatest]);
  useEffect(() => {
      void refreshDesktopReleaseLatest();
    }, [refreshDesktopReleaseLatest]);
  useEffect(() => {
      void refreshStage1DailyUseLatest();
    }, [refreshStage1DailyUseLatest]);
  useEffect(() => {
      void refreshStage1BootstrapPreflightLatest();
    }, [refreshStage1BootstrapPreflightLatest]);
  useEffect(() => {
      void refreshP1AcceptanceLatest();
    }, [refreshP1AcceptanceLatest]);
  useEffect(() => {
      void refreshP2PaperReplayLatest();
    }, [refreshP2PaperReplayLatest]);
  useEffect(() => {
      void refreshP2PreLiveAcceptanceLatest();
    }, [refreshP2PreLiveAcceptanceLatest]);
  useEffect(() => {
      void refreshP2ReadinessAcceptanceLatest();
    }, [refreshP2ReadinessAcceptanceLatest]);
  useEffect(() => {
      void refreshP2ManifestChainPreflightLatest();
    }, [refreshP2ManifestChainPreflightLatest]);
  useEffect(() => {
      const requestId = aiReviewArchivePreviewRequestIdRef.current + 1;
      aiReviewArchivePreviewRequestIdRef.current = requestId;
      const aiReviewArchivePreviewController = new AbortController();
      const runId = currentResearchRunId ?? null;

      if (activeWorkAreaId !== "audit" || !runId) {
        setAiReviewArchivePreview({
          aiReviewDecisions: [],
          authoritativeAiReviewRecords: [],
          error: null,
          legacyAiReviewRecords: [],
          runId,
          status: "idle"
        });
        return () => aiReviewArchivePreviewController.abort();
      }

      setAiReviewArchivePreview({
        aiReviewDecisions: [],
        authoritativeAiReviewRecords: [],
        error: null,
        legacyAiReviewRecords: [],
        runId,
        status: "loading"
      });
      void loadAiReviewRunArchiveSnapshot(
        quantCoreBaseUrl,
        runId,
        aiReviewArchivePreviewController.signal
      ).then((result) => {
        if (
          aiReviewArchivePreviewController.signal.aborted
          || aiReviewArchivePreviewRequestIdRef.current !== requestId
        ) {
          return;
        }
        setAiReviewArchivePreview({
          aiReviewDecisions: result.source === "core" ? result.aiReviewDecisions : [],
          authoritativeAiReviewRecords: result.source === "core" ? result.authoritativeAiReviewRecords : [],
          error: result.source === "core" ? null : result.error ?? "AI Review archive readback failed.",
          legacyAiReviewRecords: result.source === "core" ? result.legacyAiReviewRecords : [],
          runId,
          status: result.source === "core" ? "ready" : "failed"
        });
      }).catch((archiveError: unknown) => {
        if (
          aiReviewArchivePreviewController.signal.aborted
          || aiReviewArchivePreviewRequestIdRef.current !== requestId
        ) {
          return;
        }
        setAiReviewArchivePreview({
          aiReviewDecisions: [],
          authoritativeAiReviewRecords: [],
          error: archiveError instanceof Error ? archiveError.message : "AI Review archive readback failed.",
          legacyAiReviewRecords: [],
          runId,
          status: "failed"
        });
      });

      return () => aiReviewArchivePreviewController.abort();
    }, [activeWorkAreaId, currentResearchRunId]);
  useEffect(() => {
      if (activeWorkAreaId !== "audit") {
        return;
      }
      void refreshAuditEvidenceReportEvents();
      void refreshExecutionAcceptanceAuditEvents();
      void refreshMarketDataRefreshOverrideAuditEvents();
      void refreshPortfolioPaperOrderAuditEvents();
      void refreshExecutionAdapterPaperExecutionAuditEvents();
      void refreshAuditSigningKeyRotationEvents();
      void refreshResearchRunImportAuditEvents();
    }, [
      activeWorkAreaId,
      refreshAuditEvidenceReportEvents,
      refreshExecutionAcceptanceAuditEvents,
      refreshMarketDataRefreshOverrideAuditEvents,
      refreshPortfolioPaperOrderAuditEvents,
      refreshExecutionAdapterPaperExecutionAuditEvents,
      refreshAuditSigningKeyRotationEvents,
      refreshResearchRunImportAuditEvents
    ]);
}
