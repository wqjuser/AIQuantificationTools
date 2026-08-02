import { isStrategyExperimentDraftValid } from "../../../components/StrategyExperimentSection";
import { canRunAiReviewStage3 } from "../../../lib/ai-review-stage3";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "aiReviewNeedsExternalApproval" | "aiReviewStage3ComparisonExperimentIds" | "aiReviewStage3DraftExperiment" | "aiReviewStage3ExternalDataApproved" | "aiReviewStage3PrimaryExperimentId" | "aiReviewStage3ProviderId" | "aiReviewStage3Providers" | "aiReviewStage3SelectedExperiment" | "error" | "isAppendingAiReviewStage3Decision" | "isLoadingAiReviewStage3" | "isRunningAiReviewStage3" | "isStrategyExperimentRunning" | "runAiReviewStage3" | "runStrategyExperiment" | "setAiReviewStage3ComparisonExperimentIds" | "setAiReviewStage3ExternalDataApproved" | "setAiReviewStage3PrimaryExperimentId" | "setAiReviewStage3ProviderId" | "setAiReviewStage3Providers" | "setIsAppendingAiReviewStage3Decision" | "setIsLoadingAiReviewStage3" | "setIsRunningAiReviewStage3" | "setIsStrategyExperimentRunning" | "setStrategyExperimentGuardrails" | "setStrategyExperimentWalkForward" | "setWorkspaceState" | "source" | "statusLabel" | "strategyExperimentGuardrails" | "strategyExperimentSourceRunId" | "strategyExperimentStrategyRevision" | "strategyExperimentUsableSourceKey" | "strategyExperimentWalkForward" | "visibleStrategyExperimentDimensions" | "workspace">;
type Result = Pick<AppControllerBindings, "canPrepareTerminalAiReview" | "canRunTerminalAiReview" | "aiReviewActionLabel" | "runTerminalAiReview">;

export function useAiReviewReadiness(controller: Dependencies): Result {
  const {
    aiReviewNeedsExternalApproval, aiReviewStage3ComparisonExperimentIds, aiReviewStage3DraftExperiment, aiReviewStage3ExternalDataApproved, aiReviewStage3PrimaryExperimentId, aiReviewStage3ProviderId,
    aiReviewStage3Providers, aiReviewStage3SelectedExperiment, error, isAppendingAiReviewStage3Decision, isLoadingAiReviewStage3, isRunningAiReviewStage3,
    isStrategyExperimentRunning, runAiReviewStage3, runStrategyExperiment, setAiReviewStage3ComparisonExperimentIds, setAiReviewStage3ExternalDataApproved, setAiReviewStage3PrimaryExperimentId,
    setAiReviewStage3ProviderId, setAiReviewStage3Providers, setIsAppendingAiReviewStage3Decision, setIsLoadingAiReviewStage3, setIsRunningAiReviewStage3, setIsStrategyExperimentRunning,
    setStrategyExperimentGuardrails, setStrategyExperimentWalkForward, setWorkspaceState, source, statusLabel, strategyExperimentGuardrails,
    strategyExperimentSourceRunId, strategyExperimentStrategyRevision, strategyExperimentUsableSourceKey, strategyExperimentWalkForward, visibleStrategyExperimentDimensions, workspace
  } = controller;
  const canPrepareTerminalAiReview = Boolean(
      strategyExperimentUsableSourceKey
      && strategyExperimentSourceRunId
      && strategyExperimentStrategyRevision
      && workspace.researchRun
      && isStrategyExperimentDraftValid(
        visibleStrategyExperimentDimensions,
        strategyExperimentGuardrails,
        strategyExperimentWalkForward
      )
    );
  const canRunTerminalAiReview = canRunAiReviewStage3({
      primaryExperimentId: aiReviewStage3SelectedExperiment?.experimentId
        ?? aiReviewStage3DraftExperiment?.experimentId
        ?? (canPrepareTerminalAiReview ? "pending" : null),
      providers: aiReviewStage3Providers,
      providerId: aiReviewStage3ProviderId,
      externalDataApproved: aiReviewStage3ExternalDataApproved,
      busy: isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision
        || isStrategyExperimentRunning
    });
  const aiReviewActionLabel = isRunningAiReviewStage3 || isStrategyExperimentRunning
      ? "AI 评审运行中…"
      : isLoadingAiReviewStage3
        ? "正在加载评审…"
        : !strategyExperimentSourceRunId
          ? "请先完成研究运行"
          : !aiReviewStage3SelectedExperiment && !aiReviewStage3DraftExperiment && !canPrepareTerminalAiReview
            ? "请先完善实验参数"
            : aiReviewNeedsExternalApproval
              ? "请先授权已完成 K 线与证据"
              : canRunTerminalAiReview
                ? "运行 AI 评审"
                : "AI 评审暂不可用";
  const runTerminalAiReview = async () => {
      let primaryExperimentId = aiReviewStage3DraftExperiment?.experimentId ?? null;
      if (!primaryExperimentId) {
        const experiment = await runStrategyExperiment();
        if (!experiment) return;
        primaryExperimentId = experiment.experimentId;
        setAiReviewStage3PrimaryExperimentId(primaryExperimentId);
        setAiReviewStage3ComparisonExperimentIds([]);
      }
      await runAiReviewStage3(primaryExperimentId);
    };
  return {
    canPrepareTerminalAiReview, canRunTerminalAiReview, aiReviewActionLabel, runTerminalAiReview
  };
}
