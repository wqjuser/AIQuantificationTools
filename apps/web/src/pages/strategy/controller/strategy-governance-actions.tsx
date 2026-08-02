import { Panel } from "../../../components/AppPanel";
import { StrategyLibraryItem } from "../../../lib/terminal-api";
import { StrategyExperimentWalkForward, StrategyGovernanceQueueRow, workspaceWithStrategyExperimentCandidate, workspaceWithStrategyLibraryItem } from "../../../lib/terminal-workbench";
import { createWorkflowRunState } from "../../app-shell/workflow-runtime";
import { strategyExperimentActionErrorMessage, strategyExperimentMatchesSourceKey } from "../StrategyFormatters";
import { StrategySummary } from "../StrategySummary";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeLoopStepId" | "activeWorkAreaId" | "activeWorkflowStageId" | "aiReviewStage3ComparisonExperimentIds" | "aiReviewStage3Error" | "aiReviewStage3ExternalDataApproved" | "aiReviewStage3PrimaryExperimentId" | "applyGeneratedStrategyDraft" | "applyStrategyTemplate" | "beginStrategyExperimentRequest" | "bindStrategyToProduction" | "bindingStrategyRevision" | "deleteSavedStrategyVersion" | "error" | "i18n" | "invalidateAiReviewStage3Review" | "isRunning" | "isSavingStrategy" | "isStrategyExperimentRunning" | "manualSelectionVersionRef" | "paperExecutionRecord" | "pendingStrategyGovernanceAction" | "promotionCandidateRecord" | "researchNoteProviders" | "resetAiReviewHistoryState" | "saveCurrentStrategyVersion" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setAiReviewStage3ComparisonExperimentIds" | "setAiReviewStage3Error" | "setAiReviewStage3ExternalDataApproved" | "setAiReviewStage3PrimaryExperimentId" | "setBindingStrategyRevision" | "setIsRunning" | "setIsSavingStrategy" | "setIsStrategyExperimentRunning" | "setPaperExecutionRecord" | "setPendingStrategyGovernanceAction" | "setPromotionCandidateRecord" | "setResearchNoteProviders" | "setStrategyExperimentError" | "setStrategyExperimentWalkForward" | "setStrategyProductionBindingState" | "setStrategyValidationState" | "setWorkflowRunState" | "setWorkspaceState" | "source" | "statusLabel" | "strategyExperimentActiveRef" | "strategyExperimentError" | "strategyExperimentI18nRef" | "strategyExperimentRequestIsCurrent" | "strategyExperimentUsableSourceKey" | "strategyExperimentWalkForward" | "strategyExperimentWorkspaceRef" | "strategyGovernanceQueue" | "strategyProductionBindingState" | "strategyReadinessGates" | "strategyRuleDraft" | "strategyRuleRows" | "strategyTemplateOptions" | "strategyValidationState" | "updateStrategyRuleDraftField" | "visibleStrategyExperimentActive" | "visibleStrategyLibrary" | "workflowRunIdRef" | "workflowRunState" | "workspace">;
type Result = Pick<AppControllerBindings, "configureStrategyExperimentWalkForward" | "loadSavedStrategyVersion" | "runStrategyGovernanceAction" | "loadStrategyExperimentCandidate" | "renderStrategyWorkbench" | "renderStrategyPanel">;

export function useStrategyGovernanceActions(controller: Dependencies): Result {
  const {
    activeLoopStepId, activeWorkAreaId, activeWorkflowStageId, aiReviewStage3ComparisonExperimentIds, aiReviewStage3Error, aiReviewStage3ExternalDataApproved,
    aiReviewStage3PrimaryExperimentId, applyGeneratedStrategyDraft, applyStrategyTemplate, beginStrategyExperimentRequest, bindStrategyToProduction, bindingStrategyRevision,
    deleteSavedStrategyVersion, error, i18n, invalidateAiReviewStage3Review, isRunning, isSavingStrategy,
    isStrategyExperimentRunning, manualSelectionVersionRef, paperExecutionRecord, pendingStrategyGovernanceAction, promotionCandidateRecord, researchNoteProviders,
    resetAiReviewHistoryState, saveCurrentStrategyVersion, setActiveLoopStepId, setActiveWorkAreaId, setActiveWorkflowStageId, setAiReviewStage3ComparisonExperimentIds,
    setAiReviewStage3Error, setAiReviewStage3ExternalDataApproved, setAiReviewStage3PrimaryExperimentId, setBindingStrategyRevision, setIsRunning, setIsSavingStrategy,
    setIsStrategyExperimentRunning, setPaperExecutionRecord, setPendingStrategyGovernanceAction, setPromotionCandidateRecord, setResearchNoteProviders, setStrategyExperimentError,
    setStrategyExperimentWalkForward, setStrategyProductionBindingState, setStrategyValidationState, setWorkflowRunState, setWorkspaceState, source,
    statusLabel, strategyExperimentActiveRef, strategyExperimentError, strategyExperimentI18nRef, strategyExperimentRequestIsCurrent, strategyExperimentUsableSourceKey,
    strategyExperimentWalkForward, strategyExperimentWorkspaceRef, strategyGovernanceQueue, strategyProductionBindingState, strategyReadinessGates, strategyRuleDraft,
    strategyRuleRows, strategyTemplateOptions, strategyValidationState, updateStrategyRuleDraftField, visibleStrategyExperimentActive, visibleStrategyLibrary,
    workflowRunIdRef, workflowRunState, workspace
  } = controller;
  const configureStrategyExperimentWalkForward = useCallback((
      walkForward: StrategyExperimentWalkForward | null
    ) => {
      invalidateAiReviewStage3Review();
      setStrategyExperimentWalkForward(walkForward);
      setAiReviewStage3PrimaryExperimentId(null);
      setAiReviewStage3ComparisonExperimentIds([]);
      setAiReviewStage3ExternalDataApproved(false);
      setAiReviewStage3Error(null);
    }, [invalidateAiReviewStage3Review]);
  const loadSavedStrategyVersion = useCallback((strategy: StrategyLibraryItem) => {
      manualSelectionVersionRef.current += 1;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
      resetAiReviewHistoryState();
      setWorkspaceState((current) => ({
        workspace: workspaceWithStrategyLibraryItem(current.workspace, strategy),
        source: "core",
        statusLabel: "Strategy version loaded"
      }));
      setActiveWorkAreaId("strategy");
      setActiveLoopStepId("strategy");
      setActiveWorkflowStageId("factor");
      setWorkflowRunState(createWorkflowRunState());
    }, [resetAiReviewHistoryState]);
  const runStrategyGovernanceAction = useCallback(
      (row: StrategyGovernanceQueueRow) => {
        if (row.nextActionId === "save-current-version") {
          void saveCurrentStrategyVersion();
          return;
        }
        const strategy = visibleStrategyLibrary.find((item) => item.revision === row.revision);
        if (!strategy) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Strategy governance action failed",
            error: i18n.locale === "zh-CN"
              ? `本地策略库中找不到修订版 ${row.revision}`
              : `Strategy revision ${row.revision} is not available in the local library`
          }));
          return;
        }
        setPendingStrategyGovernanceAction(row.nextActionId === "load-and-rerun" ? row : null);
        loadSavedStrategyVersion(strategy);
      },
      [i18n.locale, loadSavedStrategyVersion, saveCurrentStrategyVersion, visibleStrategyLibrary]
    );
  const loadStrategyExperimentCandidate = useCallback(async (candidateId: string) => {
      const sourceKey = strategyExperimentUsableSourceKey;
      const capturedActive = visibleStrategyExperimentActive;
      const capturedWorkspace = workspace;
      if (!sourceKey || !capturedActive || !strategyExperimentMatchesSourceKey(capturedActive, sourceKey)) {
        setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
        return;
      }
      const requestGeneration = beginStrategyExperimentRequest(sourceKey);
      if (requestGeneration === null) {
        return;
      }
      try {
        const nextWorkspace = await workspaceWithStrategyExperimentCandidate(
          capturedWorkspace,
          capturedActive,
          candidateId
        );
        if (!strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
          return;
        }
        if (
          strategyExperimentWorkspaceRef.current !== capturedWorkspace ||
          strategyExperimentActiveRef.current !== capturedActive
        ) {
          setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
          return;
        }
        if (nextWorkspace === capturedWorkspace) {
          setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
          return;
        }
        manualSelectionVersionRef.current += 1;
        workflowRunIdRef.current += 1;
        setIsRunning(false);
        setPaperExecutionRecord(null);
        setPromotionCandidateRecord(null);
        resetAiReviewHistoryState();
        setWorkspaceState({
          workspace: nextWorkspace,
          source: "core",
          statusLabel: "Strategy experiment candidate loaded"
        });
        setActiveWorkAreaId("strategy");
        setActiveLoopStepId("strategy");
        setActiveWorkflowStageId("factor");
        setWorkflowRunState(createWorkflowRunState());
      } catch (candidateError) {
        if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
          setStrategyExperimentError(strategyExperimentActionErrorMessage(
            strategyExperimentI18nRef.current,
            "strategyExperiment.candidateLoadFailed",
            candidateError
          ));
        }
      } finally {
        if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
          setIsStrategyExperimentRunning(false);
        }
      }
    }, [
      beginStrategyExperimentRequest,
      i18n,
      resetAiReviewHistoryState,
      strategyExperimentRequestIsCurrent,
      strategyExperimentUsableSourceKey,
      visibleStrategyExperimentActive,
      workspace
    ]);
  const renderStrategyWorkbench = (showSaveAction = true) => (
      <StrategySummary
        bindingStrategyRevision={bindingStrategyRevision}
        draft={strategyRuleDraft}
        i18n={i18n}
        isSavingStrategy={isSavingStrategy}
        library={visibleStrategyLibrary}
        onApplyAiStrategyDraft={applyGeneratedStrategyDraft}
        onApplyStrategyTemplate={applyStrategyTemplate}
        onBindStrategyToProduction={bindStrategyToProduction}
        onDeleteStrategyVersion={deleteSavedStrategyVersion}
        onLoadStrategyVersion={loadSavedStrategyVersion}
        onRunStrategyGovernanceAction={runStrategyGovernanceAction}
        onSaveStrategyVersion={saveCurrentStrategyVersion}
        onUpdateStrategyRuleDraftField={updateStrategyRuleDraftField}
        providers={researchNoteProviders}
        readinessGates={strategyReadinessGates}
        rows={strategyRuleRows}
        showSaveAction={showSaveAction}
        strategyGovernanceQueue={strategyGovernanceQueue}
        strategyProductionBinding={strategyProductionBindingState}
        templates={strategyTemplateOptions}
        validationSource={strategyValidationState.source}
        workspace={workspace}
      />
    );
  const renderStrategyPanel = (className = "strategy-panel") => (
      <Panel title={i18n.t("panel.strategy.title")} subtitle={i18n.strategyText(workspace.strategy.name)} className={className}>
        {renderStrategyWorkbench()}
      </Panel>
    );
  return {
    configureStrategyExperimentWalkForward, loadSavedStrategyVersion, runStrategyGovernanceAction, loadStrategyExperimentCandidate, renderStrategyWorkbench, renderStrategyPanel
  };
}
