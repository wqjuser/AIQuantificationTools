import { AiReviewDossierBoard, AiReviewRunRecordHistory } from "../../../components/AiReviewAuditBoards";
import { Panel } from "../../../components/AppPanel";
import { type AiReviewDecision, type AiReviewProviderId, type AiReviewProviderStatus, type AiReviewRequestCoordinator, aiReviewRequiresExternalApproval, appendAiReviewDecisionAndReadback, type AppendAiReviewDecisionRequest, type AuthoritativeAiReviewRun, buildAiReviewDecisionDraft, canRunAiReviewStage3, type LegacyAiReviewHistoryRecord, resolveAiReviewPrimaryExperiment, toggleAiReviewComparisonSelection } from "../../../lib/ai-review-stage3";
import { AiReviewRunHistoryPagination, AiReviewRunRecordEnvelope, appendAiReviewDecision, createAuthoritativeAiReview, loadAiReviewDecisions, loadAuthoritativeAiReview, loadResearchRunAiReviews, saveAiReviewRunRecord } from "../../../lib/terminal-api";
import { buildAgentCommitteeRounds, buildAiReviewDossier, buildAiReviewReportMarkdown, buildAiReviewRunRecord, buildAiReviewStage3CandidateKey, buildAiReviewStage3ContextKey, nextAiReviewHistoryRequestId, resolveAiReviewDraftExperiment } from "../../../lib/terminal-workbench";
import { AI_REVIEW_HISTORY_PAGE_SIZE, type AiReviewArchivePreviewState, initialAiReviewRunId, quantCoreBaseUrl } from "../../app-shell/initial-state";
import { AgentCommitteeBoard, AgentEvidenceBoard } from "../AgentBoards";
import { Database, Download, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeLoopStepId" | "activeWorkAreaId" | "activeWorkflowStageId" | "aiEvidenceCards" | "currentResearchRunId" | "error" | "i18n" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setStrategyExperimentGuardrails" | "setStrategyExperimentWalkForward" | "setWorkspaceState" | "source" | "statusLabel" | "strategyExperimentGuardrails" | "strategyExperimentI18nRef" | "strategyExperimentSourceRunId" | "strategyExperimentStrategyRevision" | "strategyExperimentWalkForward" | "visibleStrategyExperimentActive" | "visibleStrategyExperimentDimensions" | "visibleStrategyExperimentHistory" | "workspace">;
type Result = Pick<AppControllerBindings, "aiReviewStage3Providers" | "setAiReviewStage3Providers" | "aiReviewStage3ProviderId" | "setAiReviewStage3ProviderId" | "aiReviewStage3ExternalDataApproved" | "setAiReviewStage3ExternalDataApproved" | "aiReviewStage3PrimaryExperimentId" | "setAiReviewStage3PrimaryExperimentId" | "aiReviewStage3ComparisonExperimentIds" | "setAiReviewStage3ComparisonExperimentIds" | "aiReviewStage3CurrentReview" | "setAiReviewStage3CurrentReview" | "aiReviewStage3Decisions" | "setAiReviewStage3Decisions" | "aiReviewStage3History" | "setAiReviewStage3History" | "aiReviewStage3LegacyHistory" | "setAiReviewStage3LegacyHistory" | "aiReviewStage3DecisionDraft" | "setAiReviewStage3DecisionDraft" | "isLoadingAiReviewStage3" | "setIsLoadingAiReviewStage3" | "isRunningAiReviewStage3" | "setIsRunningAiReviewStage3" | "isAppendingAiReviewStage3Decision" | "setIsAppendingAiReviewStage3Decision" | "aiReviewStage3Error" | "setAiReviewStage3Error" | "isRunningP0AiReview" | "setIsRunningP0AiReview" | "isSavingAiReviewRecord" | "setIsSavingAiReviewRecord" | "isLoadingAiReviewHistory" | "setIsLoadingAiReviewHistory" | "aiReviewRunRecords" | "setAiReviewRunRecords" | "aiReviewArchivePreview" | "setAiReviewArchivePreview" | "aiReviewHistoryPagination" | "setAiReviewHistoryPagination" | "aiReviewHistoryQuery" | "setAiReviewHistoryQuery" | "aiReviewHistoryOffset" | "setAiReviewHistoryOffset" | "initialAiReviewRunIdRef" | "aiReviewRunRestoreAbortControllerRef" | "aiReviewStage3RequestCoordinatorRef" | "aiReviewStage3ProviderInitializedRef" | "aiReviewHistoryRequestIdRef" | "aiReviewArchivePreviewRequestIdRef" | "agentCommitteeRounds" | "aiReviewStage3Experiments" | "aiReviewStage3ContextKey" | "aiReviewStage3CandidateKey" | "aiReviewStage3DraftExperiment" | "aiReviewStage3SelectedExperiment" | "aiReviewStage3PrimaryReference" | "aiReviewStage3PrimaryCandidate" | "aiReviewStage3PrimaryCandidateAvailable" | "aiReviewDossier" | "currentAiReviewRunRecord" | "activeAiReviewRunRecords" | "currentAiReviewArchivePreview" | "resetAiReviewHistoryState" | "syncAiReviewStage3Busy" | "invalidateAiReviewStage3Review" | "selectAiReviewStage3Primary" | "toggleAiReviewStage3Comparison" | "selectAiReviewStage3Provider" | "approveAiReviewStage3ExternalData" | "runAiReviewStage3" | "inspectAiReviewStage3" | "updateAiReviewStage3DecisionDraft" | "appendAiReviewStage3Decision" | "refreshAiReviewRunHistory" | "exportAiReviewMarkdown" | "exportAiReviewRunRecord" | "saveCurrentAiReviewRunRecord" | "updateAiReviewHistoryQuery" | "previousAiReviewHistoryPage" | "nextAiReviewHistoryPage" | "renderAgentPanel" | "aiReviewNeedsExternalApproval"> & Pick<AppControllerBindings, "reportAiReviewContextError">;

export function useAiReviewStateActions(controller: Dependencies): Result {
  const {
    activeLoopStepId, activeWorkAreaId, activeWorkflowStageId, aiEvidenceCards, currentResearchRunId, error,
    i18n, setActiveLoopStepId, setActiveWorkAreaId, setActiveWorkflowStageId, setStrategyExperimentGuardrails, setStrategyExperimentWalkForward,
    setWorkspaceState, source, statusLabel, strategyExperimentGuardrails, strategyExperimentI18nRef, strategyExperimentSourceRunId,
    strategyExperimentStrategyRevision, strategyExperimentWalkForward, visibleStrategyExperimentActive, visibleStrategyExperimentDimensions, visibleStrategyExperimentHistory, workspace
  } = controller;
  const [aiReviewStage3Providers, setAiReviewStage3Providers] = useState<AiReviewProviderStatus[]>([]);
  const [aiReviewStage3ProviderId, setAiReviewStage3ProviderId] = useState<AiReviewProviderId>("local");
  const [aiReviewStage3ExternalDataApproved, setAiReviewStage3ExternalDataApproved] = useState(false);
  const [aiReviewStage3PrimaryExperimentId, setAiReviewStage3PrimaryExperimentId] = useState<string | null>(null);
  const [aiReviewStage3ComparisonExperimentIds, setAiReviewStage3ComparisonExperimentIds] = useState<string[]>([]);
  const [aiReviewStage3CurrentReview, setAiReviewStage3CurrentReview] = useState<AuthoritativeAiReviewRun | null>(null);
  const [aiReviewStage3Decisions, setAiReviewStage3Decisions] = useState<AiReviewDecision[]>([]);
  const [aiReviewStage3History, setAiReviewStage3History] = useState<AuthoritativeAiReviewRun[]>([]);
  const [aiReviewStage3LegacyHistory, setAiReviewStage3LegacyHistory] = useState<LegacyAiReviewHistoryRecord[]>([]);
  const [aiReviewStage3DecisionDraft, setAiReviewStage3DecisionDraft] =
      useState<AppendAiReviewDecisionRequest>(() => buildAiReviewDecisionDraft([]));
  const [isLoadingAiReviewStage3, setIsLoadingAiReviewStage3] = useState(false);
  const [isRunningAiReviewStage3, setIsRunningAiReviewStage3] = useState(false);
  const [isAppendingAiReviewStage3Decision, setIsAppendingAiReviewStage3Decision] = useState(false);
  const [aiReviewStage3Error, setAiReviewStage3Error] = useState<string | null>(null);
  const reportAiReviewContextError = useCallback((message: string) => setAiReviewStage3Error(message), []);
  const [isRunningP0AiReview, setIsRunningP0AiReview] = useState(false);
  const [isSavingAiReviewRecord, setIsSavingAiReviewRecord] = useState(false);
  const [isLoadingAiReviewHistory, setIsLoadingAiReviewHistory] = useState(false);
  const [aiReviewRunRecords, setAiReviewRunRecords] = useState<AiReviewRunRecordEnvelope[]>([]);
  const [aiReviewArchivePreview, setAiReviewArchivePreview] = useState<AiReviewArchivePreviewState>({
      aiReviewDecisions: [],
      authoritativeAiReviewRecords: [],
      error: null,
      legacyAiReviewRecords: [],
      runId: null,
      status: "idle"
    });
  const [aiReviewHistoryPagination, setAiReviewHistoryPagination] = useState<AiReviewRunHistoryPagination | null>(null);
  const [aiReviewHistoryQuery, setAiReviewHistoryQuery] = useState("");
  const [aiReviewHistoryOffset, setAiReviewHistoryOffset] = useState(0);
  const initialAiReviewRunIdRef = useRef(initialAiReviewRunId);
  const aiReviewRunRestoreAbortControllerRef = useRef<AbortController | null>(null);
  const aiReviewStage3RequestCoordinatorRef = useRef<AiReviewRequestCoordinator | null>(null);
  const aiReviewStage3ProviderInitializedRef = useRef(false);
  const aiReviewHistoryRequestIdRef = useRef(0);
  const aiReviewArchivePreviewRequestIdRef = useRef(0);
  const agentCommitteeRounds = buildAgentCommitteeRounds(workspace);
  const aiReviewStage3Experiments = visibleStrategyExperimentActive
      && !visibleStrategyExperimentHistory.some(
        (experiment) => experiment.experimentId === visibleStrategyExperimentActive.experimentId
      )
        ? [visibleStrategyExperimentActive, ...visibleStrategyExperimentHistory]
        : visibleStrategyExperimentHistory;
  const aiReviewStage3ContextKey = buildAiReviewStage3ContextKey({
      workspaceId: activeWorkAreaId,
      researchWorkspaceId: workspace.researchWorkspaceState?.workspaceId ?? null,
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe,
      sourceRunId: strategyExperimentSourceRunId,
      strategyRevision: strategyExperimentStrategyRevision
    });
  const aiReviewStage3CandidateKey = buildAiReviewStage3CandidateKey(
      visibleStrategyExperimentActive?.experimentId ?? null,
      aiReviewStage3Experiments
    );
  const aiReviewStage3DraftExperiment = resolveAiReviewDraftExperiment(
      aiReviewStage3PrimaryExperimentId ?? visibleStrategyExperimentActive?.experimentId ?? null,
      aiReviewStage3Experiments,
      visibleStrategyExperimentDimensions,
      strategyExperimentGuardrails,
      strategyExperimentWalkForward
    );
  const aiReviewStage3SelectedExperiment = resolveAiReviewPrimaryExperiment(
      aiReviewStage3Experiments.find(
        (experiment) => experiment.experimentId === aiReviewStage3PrimaryExperimentId
      ) ?? null,
      aiReviewStage3Experiments
    );
  const aiReviewStage3PrimaryReference = aiReviewStage3CurrentReview?.primaryExperiment ?? null;
  const aiReviewStage3PrimaryCandidate = visibleStrategyExperimentActive?.candidates.find(
      (candidate) => candidate.candidateId === visibleStrategyExperimentActive.selectedCandidateId
    ) ?? null;
  const aiReviewStage3PrimaryCandidateAvailable = Boolean(
      aiReviewStage3PrimaryReference
      && visibleStrategyExperimentActive?.status === "completed"
      && visibleStrategyExperimentActive.experimentId === aiReviewStage3PrimaryReference.experimentId
      && visibleStrategyExperimentActive.sourceRunId === aiReviewStage3PrimaryReference.sourceRunId
      && visibleStrategyExperimentActive.strategyRevision === aiReviewStage3PrimaryReference.strategyRevision
      && visibleStrategyExperimentActive.snapshotId === aiReviewStage3PrimaryReference.snapshotId
      && visibleStrategyExperimentActive.definitionHash === aiReviewStage3PrimaryReference.definitionHash
      && visibleStrategyExperimentActive.resultHash === aiReviewStage3PrimaryReference.resultHash
      && visibleStrategyExperimentActive.selectedCandidateId === aiReviewStage3PrimaryReference.selectedCandidateId
      && visibleStrategyExperimentActive.strategyLineageKey === aiReviewStage3CurrentReview?.strategyLineageKey
      && visibleStrategyExperimentActive.definition.canonicalDataHash === aiReviewStage3PrimaryReference.canonicalDataHash
      && visibleStrategyExperimentActive.snapshot.startAt === aiReviewStage3PrimaryReference.dataRange.startAt
      && visibleStrategyExperimentActive.snapshot.endAt === aiReviewStage3PrimaryReference.dataRange.endAt
      && aiReviewStage3PrimaryCandidate?.candidateRevision === aiReviewStage3PrimaryReference.candidateRevision
      && aiReviewStage3PrimaryCandidate.eligible
      && aiReviewStage3PrimaryCandidate.testMetrics
    );
  const aiReviewDossier = visibleStrategyExperimentActive
      ? buildAiReviewDossier(workspace, visibleStrategyExperimentActive)
      : buildAiReviewDossier(workspace);
  const currentAiReviewRunRecord = visibleStrategyExperimentActive
      ? buildAiReviewRunRecord(workspace, visibleStrategyExperimentActive)
      : buildAiReviewRunRecord(workspace);
  const activeAiReviewRunRecords = currentResearchRunId
      ? aiReviewRunRecords.filter((record) => record.runId === currentResearchRunId)
      : [];
  const currentAiReviewArchivePreview: AiReviewArchivePreviewState =
      aiReviewArchivePreview.runId === currentResearchRunId
        ? aiReviewArchivePreview
        : {
            aiReviewDecisions: [],
            authoritativeAiReviewRecords: [],
            error: null,
            legacyAiReviewRecords: [],
            runId: currentResearchRunId ?? null,
            status: currentResearchRunId ? "loading" : "idle"
          };
  const resetAiReviewHistoryState = useCallback(() => {
      aiReviewHistoryRequestIdRef.current = nextAiReviewHistoryRequestId(aiReviewHistoryRequestIdRef.current);
      setIsLoadingAiReviewHistory(false);
      setAiReviewRunRecords([]);
      setAiReviewHistoryQuery("");
      setAiReviewHistoryOffset(0);
      setAiReviewHistoryPagination(null);
    }, []);
  const syncAiReviewStage3Busy = useCallback(() => {
      const busy = aiReviewStage3RequestCoordinatorRef.current!.busy;
      setIsLoadingAiReviewStage3(busy.loading);
      setIsRunningAiReviewStage3(busy.running);
      setIsAppendingAiReviewStage3Decision(busy.appending);
    }, []);
  const invalidateAiReviewStage3Review = useCallback(() => {
      aiReviewStage3RequestCoordinatorRef.current!.invalidateReview();
      syncAiReviewStage3Busy();
      setAiReviewStage3CurrentReview(null);
      setAiReviewStage3Decisions([]);
      setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft([]));
    }, [syncAiReviewStage3Busy]);
  const selectAiReviewStage3Primary = useCallback((experimentId: string) => {
      const candidate = aiReviewStage3Experiments.find(
        (experiment) => experiment.experimentId === experimentId && experiment.status === "completed"
      );
      if (isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision
        || !candidate || candidate.experimentId === aiReviewStage3PrimaryExperimentId) {
        return;
      }
      invalidateAiReviewStage3Review();
      setAiReviewStage3PrimaryExperimentId(candidate.experimentId);
      setAiReviewStage3ComparisonExperimentIds([]);
      setAiReviewStage3ExternalDataApproved(false);
      setAiReviewStage3Error(null);
    }, [
      aiReviewStage3Experiments,
      aiReviewStage3PrimaryExperimentId,
      invalidateAiReviewStage3Review,
      isAppendingAiReviewStage3Decision,
      isLoadingAiReviewStage3,
      isRunningAiReviewStage3
    ]);
  const toggleAiReviewStage3Comparison = useCallback((experimentId: string) => {
      const primary = aiReviewStage3Experiments.find(
        (experiment) => experiment.experimentId === aiReviewStage3PrimaryExperimentId
      );
      const candidate = aiReviewStage3Experiments.find((experiment) => experiment.experimentId === experimentId);
      if (isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision
        || !primary || !candidate) {
        return;
      }
      const next = toggleAiReviewComparisonSelection(
        primary,
        candidate,
        aiReviewStage3ComparisonExperimentIds
      );
      if (next.join("|") === aiReviewStage3ComparisonExperimentIds.join("|")) {
        return;
      }
      invalidateAiReviewStage3Review();
      setAiReviewStage3ComparisonExperimentIds(next);
      setAiReviewStage3ExternalDataApproved(false);
      setAiReviewStage3Error(null);
    }, [
      aiReviewStage3ComparisonExperimentIds,
      aiReviewStage3Experiments,
      aiReviewStage3PrimaryExperimentId,
      invalidateAiReviewStage3Review,
      isAppendingAiReviewStage3Decision,
      isLoadingAiReviewStage3,
      isRunningAiReviewStage3
    ]);
  const selectAiReviewStage3Provider = useCallback((providerId: AiReviewProviderId) => {
      if (isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision
        || providerId === aiReviewStage3ProviderId) {
        return;
      }
      invalidateAiReviewStage3Review();
      setAiReviewStage3ProviderId(providerId);
      setAiReviewStage3ExternalDataApproved(false);
      setAiReviewStage3Error(null);
    }, [
      aiReviewStage3ProviderId,
      invalidateAiReviewStage3Review,
      isAppendingAiReviewStage3Decision,
      isLoadingAiReviewStage3,
      isRunningAiReviewStage3
    ]);
  const approveAiReviewStage3ExternalData = useCallback((approved: boolean) => {
      if (isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision
        || approved === aiReviewStage3ExternalDataApproved) {
        return;
      }
      invalidateAiReviewStage3Review();
      setAiReviewStage3ExternalDataApproved(approved);
      setAiReviewStage3Error(null);
    }, [
      aiReviewStage3ExternalDataApproved,
      invalidateAiReviewStage3Review,
      isAppendingAiReviewStage3Decision,
      isLoadingAiReviewStage3,
      isRunningAiReviewStage3
    ]);
  const runAiReviewStage3 = useCallback(async (primaryExperimentIdOverride?: string) => {
      const primaryExperimentId = primaryExperimentIdOverride ?? aiReviewStage3PrimaryExperimentId;
      const busy = isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision;
      if (busy) {
        return;
      }
      if (!primaryExperimentId) {
        setAiReviewStage3Error("未找到可评审的主实验，请先完成当前标的的回测实验。");
        return;
      }
      if (!aiReviewStage3Providers.some((provider) => provider.providerId === aiReviewStage3ProviderId)) {
        setAiReviewStage3Error("评审模型配置尚未加载完成，请稍后重试。");
        return;
      }
      if (aiReviewRequiresExternalApproval(aiReviewStage3ProviderId) && !aiReviewStage3ExternalDataApproved) {
        setAiReviewStage3Error("请先在评审设置中允许发送本次已完成 K 线与证据。");
        return;
      }
      if (!canRunAiReviewStage3({
        primaryExperimentId,
        providers: aiReviewStage3Providers,
        providerId: aiReviewStage3ProviderId,
        externalDataApproved: aiReviewStage3ExternalDataApproved,
        busy
      })) {
        setAiReviewStage3Error("当前评审服务不可用，请检查模型配置后重试。");
        return;
      }
      const coordinator = aiReviewStage3RequestCoordinatorRef.current!;
      const request = coordinator.beginReview("running");
      syncAiReviewStage3Busy();
      setAiReviewStage3Error(null);
      const result = await createAuthoritativeAiReview(quantCoreBaseUrl, {
        primaryExperimentId,
        comparisonExperimentIds: aiReviewStage3ComparisonExperimentIds,
        providerId: aiReviewStage3ProviderId,
        externalDataApproved: aiReviewStage3ExternalDataApproved
      }, request.signal);
      if (!coordinator.isCurrent(request)) {
        return;
      }
      coordinator.finish(request);
      syncAiReviewStage3Busy();
      if (result.source !== "core" || !result.review) {
        setAiReviewStage3Error(strategyExperimentI18nRef.current.t("aiReviewStage3.error.reviewFailed"));
        return;
      }
      setAiReviewStage3CurrentReview(result.review);
      setAiReviewStage3Decisions(result.latestDecision ? [result.latestDecision] : []);
      setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft(result.latestDecision ? [result.latestDecision] : []));
      setAiReviewStage3History((current) => [
        result.review!,
        ...current.filter((review) => review.aiReviewId !== result.review!.aiReviewId)
      ]);
    }, [
      aiReviewStage3ComparisonExperimentIds,
      aiReviewStage3ExternalDataApproved,
      aiReviewStage3PrimaryExperimentId,
      aiReviewStage3ProviderId,
      aiReviewStage3Providers,
      isAppendingAiReviewStage3Decision,
      isLoadingAiReviewStage3,
      isRunningAiReviewStage3,
      syncAiReviewStage3Busy
    ]);
  const inspectAiReviewStage3 = useCallback(async (aiReviewId: string) => {
      if (isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision) {
        return;
      }
      const coordinator = aiReviewStage3RequestCoordinatorRef.current!;
      const request = coordinator.beginReview("running");
      syncAiReviewStage3Busy();
      setAiReviewStage3CurrentReview(null);
      setAiReviewStage3Decisions([]);
      setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft([]));
      setAiReviewStage3Error(null);
      const [reviewResult, decisionResult] = await Promise.all([
        loadAuthoritativeAiReview(quantCoreBaseUrl, aiReviewId, request.signal),
        loadAiReviewDecisions(quantCoreBaseUrl, aiReviewId, request.signal)
      ]);
      if (!coordinator.isCurrent(request)) {
        return;
      }
      coordinator.finish(request);
      syncAiReviewStage3Busy();
      const latestDecision = decisionResult.decisions.at(-1) ?? null;
      if (reviewResult.source !== "core" || !reviewResult.review || decisionResult.source !== "core"
        || (reviewResult.latestDecision?.decisionId ?? null) !== (latestDecision?.decisionId ?? null)) {
        setAiReviewStage3Error(
          strategyExperimentI18nRef.current.t("aiReviewStage3.error.readbackInconsistent")
        );
        return;
      }
      setAiReviewStage3CurrentReview(reviewResult.review);
      setAiReviewStage3Decisions(decisionResult.decisions);
      setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft(decisionResult.decisions));
    }, [
      isAppendingAiReviewStage3Decision,
      isLoadingAiReviewStage3,
      isRunningAiReviewStage3,
      syncAiReviewStage3Busy
    ]);
  const updateAiReviewStage3DecisionDraft = useCallback((draft: AppendAiReviewDecisionRequest) => {
      if (isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision) {
        return;
      }
      setAiReviewStage3DecisionDraft({
        ...draft,
        supersedesDecisionId: aiReviewStage3Decisions.at(-1)?.decisionId ?? null
      });
    }, [
      aiReviewStage3Decisions,
      isAppendingAiReviewStage3Decision,
      isLoadingAiReviewStage3,
      isRunningAiReviewStage3
    ]);
  const appendAiReviewStage3Decision = useCallback(async () => {
      if (!aiReviewStage3CurrentReview
        || isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision) {
        return;
      }
      const coordinator = aiReviewStage3RequestCoordinatorRef.current!;
      const request = coordinator.beginReview("appending");
      syncAiReviewStage3Busy();
      const reviewId = aiReviewStage3CurrentReview.aiReviewId;
      const decisionRequest: AppendAiReviewDecisionRequest = {
        ...aiReviewStage3DecisionDraft,
        operator: aiReviewStage3DecisionDraft.operator.trim(),
        rationale: aiReviewStage3DecisionDraft.rationale.trim(),
        supersedesDecisionId: aiReviewStage3Decisions.at(-1)?.decisionId ?? null
      };
      setAiReviewStage3Error(null);
      const result = await appendAiReviewDecisionAndReadback({
        aiReviewId: reviewId,
        request: decisionRequest,
        signal: request.signal,
        append: async (currentReviewId, currentRequest, signal) => {
          const response = await appendAiReviewDecision(
            quantCoreBaseUrl,
            currentReviewId,
            currentRequest,
            signal
          );
          return response.source === "core" && response.decision ? { decision: response.decision } : {};
        },
        load: async (currentReviewId, signal) => {
          const response = await loadAiReviewDecisions(quantCoreBaseUrl, currentReviewId, signal);
          return response.source === "core" ? { decisions: response.decisions } : {};
        },
        isCurrent: () => coordinator.isCurrent(request)
      });
      if (result.status === "stale") {
        return;
      }
      coordinator.finish(request);
      syncAiReviewStage3Busy();
      if (result.status !== "committed" || !result.decisions) {
        setAiReviewStage3Error(
          strategyExperimentI18nRef.current.t(
            result.status === "append-failed"
              ? "aiReviewStage3.error.decisionAppendFailed"
              : "aiReviewStage3.error.decisionReadbackFailed"
          )
        );
        return;
      }
      setAiReviewStage3Decisions(result.decisions);
      setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft(
        result.decisions,
        decisionRequest.operator,
        ""
      ));
    }, [
      aiReviewStage3CurrentReview,
      aiReviewStage3DecisionDraft,
      aiReviewStage3Decisions,
      isAppendingAiReviewStage3Decision,
      isLoadingAiReviewStage3,
      isRunningAiReviewStage3,
      syncAiReviewStage3Busy
    ]);
  const refreshAiReviewRunHistory = useCallback(
      async (runId: string, options: { commit?: boolean; offset?: number; query?: string } = {}) => {
        const offset = options.offset ?? aiReviewHistoryOffset;
        const query = options.query ?? aiReviewHistoryQuery;
        const commit = options.commit !== false;
        const requestId = commit ? nextAiReviewHistoryRequestId(aiReviewHistoryRequestIdRef.current) : null;
        if (requestId !== null) {
          aiReviewHistoryRequestIdRef.current = requestId;
          setIsLoadingAiReviewHistory(true);
        }
        const aiReviewHistory = await loadResearchRunAiReviews(quantCoreBaseUrl, runId, {
          limit: AI_REVIEW_HISTORY_PAGE_SIZE,
          offset,
          query
        });
        if (requestId !== null && aiReviewHistoryRequestIdRef.current === requestId) {
          setAiReviewRunRecords(aiReviewHistory.aiReviews);
          setAiReviewHistoryPagination(aiReviewHistory.pagination ?? null);
          setIsLoadingAiReviewHistory(false);
        }
        return aiReviewHistory;
      },
      [aiReviewHistoryOffset, aiReviewHistoryQuery]
    );
  const exportAiReviewMarkdown = useCallback(() => {
      const markdown = visibleStrategyExperimentActive
        ? buildAiReviewReportMarkdown(workspace, visibleStrategyExperimentActive)
        : buildAiReviewReportMarkdown(workspace);
      const runId = workspace.researchRun?.runId;
      if (!markdown || !runId) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "AI review export failed",
          error: "Run Pipeline before exporting an AI review report"
        }));
        return;
      }

      const objectUrl = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${runId}-ai-review.md`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "AI review export ready",
        error: undefined
      }));
    }, [visibleStrategyExperimentActive, workspace]);
  const exportAiReviewRunRecord = useCallback(() => {
      const record = buildAiReviewRunRecord(workspace, visibleStrategyExperimentActive);
      const runId = workspace.researchRun?.runId;
      if (!record || !runId) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "AI review record export failed",
          error: "Run Pipeline before exporting an AI review run record"
        }));
        return;
      }

      const objectUrl = URL.createObjectURL(
        new Blob([JSON.stringify(record, null, 2)], { type: "application/json;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${runId}-ai-review-record.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "AI review record export ready",
        error: undefined
      }));
    }, [visibleStrategyExperimentActive, workspace]);
  const saveCurrentAiReviewRunRecord = useCallback(async () => {
      const runId = workspace.researchRun?.runId;
      const record = buildAiReviewRunRecord(workspace, visibleStrategyExperimentActive);
      if (!runId || !record) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "AI review record save failed",
          error: "Run Pipeline before saving an AI review run record"
        }));
        return;
      }

      setIsSavingAiReviewRecord(true);
      const result = await saveAiReviewRunRecord(quantCoreBaseUrl, record);
      if (result.source === "fallback" || !result.aiReview) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "AI review record save failed",
          error: result.error ?? "AI review record save failed"
        }));
        setIsSavingAiReviewRecord(false);
        return;
      }

      setAiReviewRunRecords((current) => [
        result.aiReview!,
        ...current.filter((item) => item.aiReviewId !== result.aiReview!.aiReviewId)
      ]);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "AI review record saved",
        error: undefined
      }));
      setActiveWorkAreaId("ai-review");
      setActiveLoopStepId("agent-review");
      setActiveWorkflowStageId("agent");
      setIsSavingAiReviewRecord(false);
    }, [quantCoreBaseUrl, visibleStrategyExperimentActive, workspace]);
  const updateAiReviewHistoryQuery = useCallback((query: string) => {
      setAiReviewHistoryQuery(query);
      setAiReviewHistoryOffset(0);
    }, []);
  const previousAiReviewHistoryPage = useCallback(() => {
      setAiReviewHistoryOffset((current) => Math.max(0, current - AI_REVIEW_HISTORY_PAGE_SIZE));
    }, []);
  const nextAiReviewHistoryPage = useCallback(() => {
      setAiReviewHistoryOffset((current) => {
        const total = aiReviewHistoryPagination?.total ?? 0;
        if (!total) {
          return current;
        }
        const next = current + AI_REVIEW_HISTORY_PAGE_SIZE;
        return next >= total ? current : next;
      });
    }, [aiReviewHistoryPagination?.total]);
  const renderAgentPanel = (className = "watchlist-ai-panel") => (
      <Panel
        title={i18n.t("panel.agent.title")}
        subtitle={i18n.t("panel.agent.subtitle")}
        action={
          <div className="report-export-actions">
            <button
              className="report-export-button"
              disabled={!workspace.researchRun}
              onClick={exportAiReviewMarkdown}
              title={i18n.t("aiReview.exportMarkdown")}
              type="button"
            >
              <Download size={13} />
              <span>{i18n.t("aiReview.exportMarkdown")}</span>
            </button>
            <button
              className="report-export-button"
              disabled={!workspace.researchRun}
              onClick={exportAiReviewRunRecord}
              title={i18n.t("aiReview.exportRecord")}
              type="button"
            >
              <Database size={13} />
              <span>{i18n.t("aiReview.exportRecord")}</span>
            </button>
            <button
              className="report-export-button"
              disabled={!workspace.researchRun || isSavingAiReviewRecord}
              onClick={saveCurrentAiReviewRunRecord}
              title={i18n.t("aiReview.saveRecord")}
              type="button"
            >
              <Upload size={13} />
              <span>{isSavingAiReviewRecord ? i18n.t("aiReview.savingRecord") : i18n.t("aiReview.saveRecord")}</span>
            </button>
          </div>
        }
        className={className}
      >
        <div className="agent-panel-body">
          <AiReviewDossierBoard dossier={aiReviewDossier} i18n={i18n} />
          <AiReviewRunRecordHistory
            i18n={i18n}
            query=""
            records={activeAiReviewRunRecords}
            totalRecords={activeAiReviewRunRecords.length}
          />
          <AgentEvidenceBoard cards={aiEvidenceCards} i18n={i18n} />
          <AgentCommitteeBoard i18n={i18n} rounds={agentCommitteeRounds} />
        </div>
      </Panel>
    );
  const aiReviewNeedsExternalApproval = aiReviewRequiresExternalApproval(aiReviewStage3ProviderId)
      && !aiReviewStage3ExternalDataApproved;
  return {
    aiReviewStage3Providers, setAiReviewStage3Providers, aiReviewStage3ProviderId, setAiReviewStage3ProviderId, aiReviewStage3ExternalDataApproved, setAiReviewStage3ExternalDataApproved,
    aiReviewStage3PrimaryExperimentId, setAiReviewStage3PrimaryExperimentId, aiReviewStage3ComparisonExperimentIds, setAiReviewStage3ComparisonExperimentIds, aiReviewStage3CurrentReview, setAiReviewStage3CurrentReview,
    aiReviewStage3Decisions, setAiReviewStage3Decisions, aiReviewStage3History, setAiReviewStage3History, aiReviewStage3LegacyHistory, setAiReviewStage3LegacyHistory,
    aiReviewStage3DecisionDraft, setAiReviewStage3DecisionDraft, isLoadingAiReviewStage3, setIsLoadingAiReviewStage3, isRunningAiReviewStage3, setIsRunningAiReviewStage3,
    isAppendingAiReviewStage3Decision, setIsAppendingAiReviewStage3Decision, aiReviewStage3Error, setAiReviewStage3Error, isRunningP0AiReview, setIsRunningP0AiReview,
    isSavingAiReviewRecord, setIsSavingAiReviewRecord, isLoadingAiReviewHistory, setIsLoadingAiReviewHistory, aiReviewRunRecords, setAiReviewRunRecords,
    aiReviewArchivePreview, setAiReviewArchivePreview, aiReviewHistoryPagination, setAiReviewHistoryPagination, aiReviewHistoryQuery, setAiReviewHistoryQuery,
    aiReviewHistoryOffset, setAiReviewHistoryOffset, initialAiReviewRunIdRef, aiReviewRunRestoreAbortControllerRef, aiReviewStage3RequestCoordinatorRef, aiReviewStage3ProviderInitializedRef,
    aiReviewHistoryRequestIdRef, aiReviewArchivePreviewRequestIdRef, agentCommitteeRounds, aiReviewStage3Experiments, aiReviewStage3ContextKey, aiReviewStage3CandidateKey,
    aiReviewStage3DraftExperiment, aiReviewStage3SelectedExperiment, aiReviewStage3PrimaryReference, aiReviewStage3PrimaryCandidate, aiReviewStage3PrimaryCandidateAvailable, aiReviewDossier,
    currentAiReviewRunRecord, activeAiReviewRunRecords, currentAiReviewArchivePreview, resetAiReviewHistoryState, syncAiReviewStage3Busy, invalidateAiReviewStage3Review,
    selectAiReviewStage3Primary, toggleAiReviewStage3Comparison, selectAiReviewStage3Provider, approveAiReviewStage3ExternalData, runAiReviewStage3, inspectAiReviewStage3,
    updateAiReviewStage3DecisionDraft, appendAiReviewStage3Decision, refreshAiReviewRunHistory, exportAiReviewMarkdown, exportAiReviewRunRecord, saveCurrentAiReviewRunRecord,
    updateAiReviewHistoryQuery, previousAiReviewHistoryPage, nextAiReviewHistoryPage, renderAgentPanel, aiReviewNeedsExternalApproval,
    reportAiReviewContextError
  };
}
