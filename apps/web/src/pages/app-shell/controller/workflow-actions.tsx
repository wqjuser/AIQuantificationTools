import { AutomatedTradingWorkflowGuide } from "../../../components/AppWorkflowPanels";
import { type TerminalWorkspaceSurfaceAction } from "../../../components/TerminalWorkspaceSurface";
import { runP0AiReview } from "../../../lib/terminal-api";
import { normalizeP0CurrentGapActionId, ProductWorkAreaId } from "../../../lib/terminal-workbench";
import { goldenPathActionPreflightHint, strategyDraftReauditHint } from "../../research/ResearchPipelineFormatters";
import { goldenPathActionLabel, goldenPathDetail, translateGoldenPathDetail } from "../../stage1/golden-path-formatters";
import { automatedTradingWorkflowRequiresManualAction } from "../../stage1/platform-overview-formatters";
import { quantCoreBaseUrl } from "../initial-state";
import { productWorkAreaIds } from "../navigation";
import { useCallback } from "react";
import type { AppControllerBindings } from "./bindings";

type Dependencies = Pick<AppControllerBindings, "activeLoopStepId" | "activeWorkAreaId" | "activeWorkspaceContext" | "aiReviewActionLabel" | "automatedTradingWorkAreas" | "automatedTradingWorkflowActionErrorRef" | "automatedTradingWorkflowStatus" | "canRunTerminalAiReview" | "commitProductWorkAreaSelection" | "deferSettingsNavigation" | "ensureGoldenPathLatestRunBound" | "error" | "exportRun" | "goldenPath" | "goldenPathActionId" | "goldenPathCurrentStep" | "i18n" | "isAutomatedTradingWorkflowRunning" | "isLoadingMarketInformation" | "isPreparingPortfolioPeers" | "isRecordingPortfolioPaperOrders" | "isRecordingPortfolioStage4Workflow" | "isRefreshing" | "isRefreshingAdapterHealthProbe" | "isRefreshingWatchlistCache" | "isRunning" | "isRunningP0AiReview" | "isRunningPortfolioBacktest" | "isSavingStrategy" | "isSimulatingPortfolioPaperOrderBatch" | "isStrategyExperimentRunning" | "isSubmittingPaperExecution" | "marketDataRefreshGuard" | "openAutomaticTradingConsole" | "openLiveTradingGate" | "portfolioStage4GoldenPath" | "refreshExecutionAdapterHealthProbe" | "refreshGoldenPathStatus" | "refreshMarketInformation" | "refreshSelectedMarketCache" | "refreshWatchlistMarketCache" | "refreshingCacheKey" | "researchPipelinePreflight" | "researchRunContextBinding" | "riskApprovalSummary" | "runAiWorkbenchAction" | "runAutomatedTradingWorkflow" | "runHistory" | "runPipeline" | "runPortfolioStage4PrimaryAction" | "runStrategyExperiment" | "runTerminalAiReview" | "saveCurrentStrategyVersion" | "selectProductWorkArea" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setAutomatedTradingWorkflowStatus" | "setIsAutomatedTradingWorkflowRunning" | "setIsLoadingMarketInformation" | "setIsPreparingPortfolioPeers" | "setIsRecordingPortfolioPaperOrders" | "setIsRecordingPortfolioStage4Workflow" | "setIsRefreshing" | "setIsRefreshingAdapterHealthProbe" | "setIsRefreshingWatchlistCache" | "setIsRunning" | "setIsRunningP0AiReview" | "setIsRunningPortfolioBacktest" | "setIsSavingStrategy" | "setIsSimulatingPortfolioPaperOrderBatch" | "setIsStrategyExperimentRunning" | "setIsSubmittingPaperExecution" | "setRefreshingCacheKey" | "setRunHistoryState" | "setSettingsStatus" | "setWorkspaceState" | "settingsStatus" | "source" | "statusLabel" | "strategyDraftRequiresReaudit" | "submitPaperExecution" | "workspace" | "workspaceContextActionId">;
type Result = Pick<AppControllerBindings, "runActiveWorkflowAction" | "runGoldenPathActionById" | "runGoldenPathAction" | "runWorkspaceContextAction" | "isGoldenPathActionDisabledById" | "isGoldenPathActionDisabled" | "isWorkspaceContextActionDisabled" | "goldenPathActionHint" | "workspaceContextActionHint" | "runAutomatedTradingWorkflowFromCurrentWorkspace" | "syncExecutionSafety" | "terminalSurfaceAction" | "terminalSurfaceDisplayAction" | "automatedTradingGuideAction" | "automatedTradingGuide">;

export function useWorkflowActions(controller: Dependencies): Result {
  const {
    activeLoopStepId, activeWorkAreaId, activeWorkspaceContext, aiReviewActionLabel, automatedTradingWorkAreas, automatedTradingWorkflowActionErrorRef,
    automatedTradingWorkflowStatus, canRunTerminalAiReview, commitProductWorkAreaSelection, deferSettingsNavigation, ensureGoldenPathLatestRunBound, error,
    exportRun, goldenPath, goldenPathActionId, goldenPathCurrentStep, i18n, isAutomatedTradingWorkflowRunning,
    isLoadingMarketInformation, isPreparingPortfolioPeers, isRecordingPortfolioPaperOrders, isRecordingPortfolioStage4Workflow, isRefreshing, isRefreshingAdapterHealthProbe,
    isRefreshingWatchlistCache, isRunning, isRunningP0AiReview, isRunningPortfolioBacktest, isSavingStrategy, isSimulatingPortfolioPaperOrderBatch,
    isStrategyExperimentRunning, isSubmittingPaperExecution, marketDataRefreshGuard, openAutomaticTradingConsole, openLiveTradingGate, portfolioStage4GoldenPath,
    refreshExecutionAdapterHealthProbe, refreshGoldenPathStatus, refreshMarketInformation, refreshSelectedMarketCache, refreshWatchlistMarketCache, refreshingCacheKey,
    researchPipelinePreflight, researchRunContextBinding, riskApprovalSummary, runAiWorkbenchAction, runAutomatedTradingWorkflow, runHistory,
    runPipeline, runPortfolioStage4PrimaryAction, runStrategyExperiment, runTerminalAiReview, saveCurrentStrategyVersion, selectProductWorkArea,
    setActiveLoopStepId, setActiveWorkAreaId, setAutomatedTradingWorkflowStatus, setIsAutomatedTradingWorkflowRunning, setIsLoadingMarketInformation, setIsPreparingPortfolioPeers,
    setIsRecordingPortfolioPaperOrders, setIsRecordingPortfolioStage4Workflow, setIsRefreshing, setIsRefreshingAdapterHealthProbe, setIsRefreshingWatchlistCache, setIsRunning,
    setIsRunningP0AiReview, setIsRunningPortfolioBacktest, setIsSavingStrategy, setIsSimulatingPortfolioPaperOrderBatch, setIsStrategyExperimentRunning, setIsSubmittingPaperExecution,
    setRefreshingCacheKey, setRunHistoryState, setSettingsStatus, setWorkspaceState, settingsStatus, source,
    statusLabel, strategyDraftRequiresReaudit, submitPaperExecution, workspace, workspaceContextActionId
  } = controller;
  const runActiveWorkflowAction = useCallback(() => {
      if (activeLoopStepId === "strategy") {
        selectProductWorkArea("strategy");
        return;
      }
      if (activeLoopStepId === "agent-review") {
        runAiWorkbenchAction("debate");
        return;
      }
      if (activeLoopStepId === "paper") {
        void submitPaperExecution();
        return;
      }
      void runPipeline();
    }, [activeLoopStepId, runAiWorkbenchAction, runPipeline, selectProductWorkArea, submitPaperExecution]);
  const runGoldenPathActionById = useCallback(
      async (
        actionId: string | null | undefined,
        targetWorkspace?: string | null,
        latestRunIdOverride?: string | null,
        automated = false
      ): Promise<boolean> => {
        automatedTradingWorkflowActionErrorRef.current = null;
        if (actionId === "review-production-handoff") {
          selectProductWorkArea("execution");
          return false;
        }
        const executableActionId = normalizeP0CurrentGapActionId(actionId);
        if (!executableActionId) {
          runActiveWorkflowAction();
          return false;
        }
        if (executableActionId === "refresh-data") {
          return refreshSelectedMarketCache();
        }
        if (executableActionId === "refresh-watchlist-cache") {
          return refreshWatchlistMarketCache();
        }
        if (executableActionId === "run-pipeline") {
          return runPipeline(automated ? "accepted" : undefined);
        }
        if (executableActionId === "run-ai-review") {
          const runId = latestRunIdOverride ?? goldenPath?.latestRunId;
          selectProductWorkArea("ai-review");
          if (!runId) {
            if (!automated) {
              await runPipeline();
            }
            return false;
          }
          setIsRunningP0AiReview(true);
          try {
            const result = await runP0AiReview(quantCoreBaseUrl, {
              runId,
              market: workspace.selectedInstrument.market,
              symbol: workspace.selectedInstrument.symbol,
              timeframe: workspace.selectedTimeframe
            });
            setWorkspaceState((current) => ({
              ...current,
              source: result.source,
              statusLabel: result.statusLabel,
              error: result.error
            }));
            if (result.aiReview) {
              await refreshGoldenPathStatus();
            }
            return Boolean(result.aiReview);
          } finally {
            setIsRunningP0AiReview(false);
          }
        }
        if (executableActionId === "submit-paper-order") {
          const goldenPathRunId = latestRunIdOverride ?? goldenPath?.latestRunId;
          const runIsBound = await ensureGoldenPathLatestRunBound(goldenPathRunId);
          if (goldenPathRunId && runIsBound) {
            await submitPaperExecution(goldenPathRunId);
            return true;
          }
          return false;
        }
        if (executableActionId === "fix-paper-handoff") {
          selectProductWorkArea("execution");
          return false;
        }
        if (executableActionId === "certify-live-adapter") {
          openLiveTradingGate();
          return false;
        }
        if (targetWorkspace && productWorkAreaIds.includes(targetWorkspace as ProductWorkAreaId)) {
          selectProductWorkArea(targetWorkspace as ProductWorkAreaId);
          return true;
        }
        return false;
      },
      [
        refreshSelectedMarketCache,
        refreshWatchlistMarketCache,
        ensureGoldenPathLatestRunBound,
        goldenPath?.latestRunId,
        openLiveTradingGate,
        quantCoreBaseUrl,
        refreshGoldenPathStatus,
        runActiveWorkflowAction,
        runPipeline,
        selectProductWorkArea,
        submitPaperExecution,
        workspace.selectedInstrument.market,
        workspace.selectedInstrument.symbol,
        workspace.selectedTimeframe
      ]
    );
  const runGoldenPathAction = useCallback(() => {
      const action = goldenPath?.nextAction;
      if (!action) {
        runActiveWorkflowAction();
        return;
      }
      runGoldenPathActionById(action.id, action.targetWorkspace);
    }, [goldenPath?.nextAction, runActiveWorkflowAction, runGoldenPathActionById]);
  const runWorkspaceContextAction = useCallback(() => {
      if (!activeWorkspaceContext?.actionId) {
        return;
      }
      runGoldenPathActionById(
        activeWorkspaceContext.actionId,
        activeWorkspaceContext.actionTargetWorkspaceId ?? activeWorkspaceContext.workspaceId
      );
    }, [activeWorkspaceContext, runGoldenPathActionById]);
  const isGoldenPathActionDisabledById = useCallback(
      (actionId: string | null | undefined) => {
        const executableActionId = normalizeP0CurrentGapActionId(actionId);
        if (isRefreshing || isRunning) {
          return true;
        }
        if (executableActionId === "refresh-data") {
          return Boolean(refreshingCacheKey) || marketDataRefreshGuard.blocked;
        }
        if (executableActionId === "refresh-watchlist-cache") {
          return isRefreshingWatchlistCache || Boolean(refreshingCacheKey) || marketDataRefreshGuard.blocked;
        }
        if (executableActionId === "run-pipeline") {
          return !researchPipelinePreflight.canRun;
        }
        if (executableActionId === "run-ai-review") {
          return isRunningP0AiReview;
        }
        if (executableActionId === "submit-paper-order") {
          const canRebindGoldenPathRun =
            !strategyDraftRequiresReaudit &&
            Boolean(goldenPath?.latestRunId) &&
            !researchRunContextBinding.canUseRun;
          return (
            isSubmittingPaperExecution ||
            strategyDraftRequiresReaudit ||
            (!canRebindGoldenPathRun &&
              (!researchRunContextBinding.canUseRun || riskApprovalSummary.status === "blocked"))
          );
        }
        return false;
      },
      [
        goldenPath?.latestRunId,
        isRefreshing,
        isRefreshingWatchlistCache,
        isRunning,
        isRunningP0AiReview,
        isSubmittingPaperExecution,
        marketDataRefreshGuard.blocked,
        refreshingCacheKey,
        researchPipelinePreflight.canRun,
        researchRunContextBinding.canUseRun,
        riskApprovalSummary.status,
        strategyDraftRequiresReaudit
      ]
    );
  const isGoldenPathActionDisabled = isGoldenPathActionDisabledById(goldenPathActionId);
  const isWorkspaceContextActionDisabled =
      !workspaceContextActionId || isGoldenPathActionDisabledById(workspaceContextActionId);
  const goldenPathActionHint =
      strategyDraftReauditHint(i18n, goldenPathActionId, strategyDraftRequiresReaudit) ??
      goldenPathActionPreflightHint(i18n, goldenPathActionId, researchPipelinePreflight);
  const workspaceContextActionHint =
      strategyDraftReauditHint(i18n, workspaceContextActionId, strategyDraftRequiresReaudit) ??
      goldenPathActionPreflightHint(i18n, workspaceContextActionId, researchPipelinePreflight);
  const runAutomatedTradingWorkflowFromCurrentWorkspace = useCallback(() => {
      const targetWorkspace = goldenPath?.nextAction?.targetWorkspace;
      const targetWorkAreaId = targetWorkspace && productWorkAreaIds.includes(targetWorkspace as ProductWorkAreaId)
        ? targetWorkspace as ProductWorkAreaId
        : null;
      const leaveSettingsAndRun = targetWorkAreaId
        ? () => {
            commitProductWorkAreaSelection(targetWorkAreaId);
            runAutomatedTradingWorkflow();
          }
        : runAutomatedTradingWorkflow;
      if (targetWorkAreaId && deferSettingsNavigation(targetWorkAreaId, leaveSettingsAndRun)) return;
      runAutomatedTradingWorkflow();
    }, [
      commitProductWorkAreaSelection,
      deferSettingsNavigation,
      goldenPath?.nextAction?.targetWorkspace,
      runAutomatedTradingWorkflow,
    ]);
  const syncExecutionSafety = useCallback((
      executionMode: "paper" | "testnet" | "live",
      liveTradingAllowed: boolean
    ) => {
      setSettingsStatus((current) => {
        const settings = current.settings;
        if (!settings || (
          settings.safety.executionMode === executionMode
          && settings.safety.liveTradingAllowed === liveTradingAllowed
        )) return current;
        return {
          ...current,
          settings: {
            ...settings,
            safety: { ...settings.safety, executionMode, liveTradingAllowed }
          }
        };
      });
    }, []);
  const terminalSurfaceAction: TerminalWorkspaceSurfaceAction | null = (() => {
      switch (activeWorkAreaId) {
        case "market":
          return {
            label: isRefreshingWatchlistCache ? "刷新中…" : "刷新行情",
            onClick: () => void refreshWatchlistMarketCache(),
            disabled: isRefreshingWatchlistCache
          };
        case "market-information":
          return {
            label: isLoadingMarketInformation ? "加载资讯中…" : "刷新资讯",
            onClick: () => void refreshMarketInformation(),
            disabled: isLoadingMarketInformation
          };
        case "research":
          return {
            label: isRunning ? "研究运行中…" : "运行研究",
            onClick: () => void runPipeline(),
            disabled: isRunning
          };
        case "strategy":
          return {
            label: isSavingStrategy ? "正在保存…" : "保存版本",
            onClick: () => void saveCurrentStrategyVersion(),
            disabled: isSavingStrategy
          };
        case "backtest":
          return {
            label: isStrategyExperimentRunning ? "回测运行中…" : "运行回测",
            onClick: () => void runStrategyExperiment(),
            disabled: isStrategyExperimentRunning
          };
        case "ai-review":
          return {
            label: aiReviewActionLabel,
            onClick: () => void runTerminalAiReview(),
            disabled: !canRunTerminalAiReview
          };
        case "portfolio":
          return {
            label:
              isPreparingPortfolioPeers ||
              isRunningPortfolioBacktest ||
              isRecordingPortfolioPaperOrders ||
              isSimulatingPortfolioPaperOrderBatch ||
              isRecordingPortfolioStage4Workflow
                ? "黄金路径处理中…"
                : portfolioStage4GoldenPath.primaryActionId
                  ? portfolioStage4GoldenPath.primaryActionId === "review-portfolio-orders"
                    ? "查看人工审批"
                    : portfolioStage4GoldenPath.primaryActionId === "review-portfolio-risk" ||
                        portfolioStage4GoldenPath.primaryActionId === "review-route-risk"
                      ? "查看风控问题"
                      : "继续黄金路径"
                  : "黄金路径已完成",
            onClick: () => {
              if (portfolioStage4GoldenPath.primaryActionId) {
                runPortfolioStage4PrimaryAction(portfolioStage4GoldenPath.primaryActionId);
              }
            },
            disabled:
              !portfolioStage4GoldenPath.primaryActionId ||
              portfolioStage4GoldenPath.status === "blocked" ||
              isPreparingPortfolioPeers ||
              isRunningPortfolioBacktest ||
              isRecordingPortfolioPaperOrders ||
              isSimulatingPortfolioPaperOrderBatch ||
              isRecordingPortfolioStage4Workflow
          };
        case "execution":
          return {
            label: "打开自动交易控制台",
            onClick: openAutomaticTradingConsole
          };
        case "dynamic-trading":
          return null;
        case "audit":
          return {
            label: "导出审计包",
            onClick: () => runHistory[0] && void exportRun(runHistory[0]),
            disabled: !runHistory.length
          };
        case "settings":
          return {
            label: isRefreshingAdapterHealthProbe ? "检查中…" : "检查执行适配器",
            onClick: () => void refreshExecutionAdapterHealthProbe(),
            disabled: isRefreshingAdapterHealthProbe
          };
      }
    })();
  const terminalSurfaceDisplayAction =
      terminalSurfaceAction && activeWorkspaceContext
        ? {
            ...terminalSurfaceAction,
            workflowReason: translateGoldenPathDetail(
              i18n,
              activeWorkspaceContext.detail || activeWorkspaceContext.reason
            ),
            workflowStatus: activeWorkspaceContext.status
          }
        : terminalSurfaceAction;
  const automatedTradingGuideAction =
      goldenPath?.nextAction?.id === "certify-live-adapter"
        ? openLiveTradingGate
        : goldenPath?.nextAction
          ? runAutomatedTradingWorkflowFromCurrentWorkspace
          : openAutomaticTradingConsole;
  const automatedTradingGuide = (
      <AutomatedTradingWorkflowGuide
        actionDisabled={isAutomatedTradingWorkflowRunning || !goldenPath}
        actionLabel={
          !goldenPath
            ? i18n.locale === "zh-CN"
              ? "正在读取流程…"
              : "Loading workflow…"
            : isAutomatedTradingWorkflowRunning
              ? i18n.locale === "zh-CN"
                ? "自动执行中…"
                : "Running automatically…"
              : goldenPath.nextAction
                ? automatedTradingWorkflowRequiresManualAction(goldenPath.nextAction.id)
                  ? goldenPathActionLabel(i18n, goldenPath.nextAction)
                  : i18n.locale === "zh-CN"
                    ? "开始自动交易流程"
                    : "Start automated trading flow"
              : i18n.locale === "zh-CN"
                ? "打开自动交易控制台"
                : "Open auto-trading console"
        }
        activeWorkAreaId={activeWorkAreaId}
        currentWorkAreaId={activeWorkAreaId}
        detail={
          automatedTradingWorkflowStatus ??
          (goldenPath
            ? goldenPathDetail(i18n, goldenPathCurrentStep, goldenPath.nextAction?.reason, goldenPath)
            : i18n.locale === "zh-CN"
              ? "正在读取黄金路径和实盘闸门。"
              : "Loading the golden path and live-trading gates.")
        }
        i18n={i18n}
        onAction={automatedTradingGuideAction}
        onSelectWorkspace={selectProductWorkArea}
        workAreas={automatedTradingWorkAreas}
      />
    );
  return {
    runActiveWorkflowAction, runGoldenPathActionById, runGoldenPathAction, runWorkspaceContextAction, isGoldenPathActionDisabledById, isGoldenPathActionDisabled,
    isWorkspaceContextActionDisabled, goldenPathActionHint, workspaceContextActionHint, runAutomatedTradingWorkflowFromCurrentWorkspace, syncExecutionSafety, terminalSurfaceAction,
    terminalSurfaceDisplayAction, automatedTradingGuideAction, automatedTradingGuide
  };
}
