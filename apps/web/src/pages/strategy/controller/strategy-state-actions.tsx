import { isStrategyExperimentDraftValid } from "../../../components/StrategyExperimentSection";
import { createStrategyExperiment, deleteStrategyVersion, loadStrategyExperimentDetail, loadStrategyExperiments, loadStrategyLibrary, loadStrategyProductionBinding, ProductionStrategyHandoffResult, saveStrategySnapshot, StrategyLibraryItem, StrategyLibraryResult, StrategyProductionBindingResult, StrategyValidationResult, updateStrategyProductionBinding, validateStrategySnapshot } from "../../../lib/terminal-api";
import { buildStrategyGovernanceQueueRows, buildStrategyReadinessGates, buildStrategyRuleDraft, buildStrategyRuleRows, buildStrategyTemplateOptions, DEFAULT_STRATEGY_EXPERIMENT_WALK_FORWARD, defaultBacktestAssumptions, mergeStrategyReadinessGatesWithLocalAudit, resolveStrategyExperimentIdForCurrentSource, StrategyExperimentDetail, StrategyExperimentDimension, StrategyExperimentGuardrails, StrategyExperimentListItem, StrategyExperimentWalkForward, StrategyGovernanceQueueRow, StrategyRuleDraft, StrategyRuleDraftField, StrategyTemplateId, workspaceNeedsStrategyReaudit, workspaceWithAiStrategyDraft, workspaceWithStrategyRuleDraftField, workspaceWithStrategyTemplate } from "../../../lib/terminal-workbench";
import { initialProductionStrategyHandoffState, initialStrategyExperimentId, initialStrategyLibraryState, initialStrategyProductionBindingState, initialStrategyValidationState, type ProductionStrategyBindingTarget, quantCoreBaseUrl } from "../../app-shell/initial-state";
import { strategyExperimentActionErrorMessage, strategyExperimentErrorMessage, strategyExperimentMatchesSourceKey, strategyProductionBindingErrorLabel } from "../StrategyFormatters";
import { useCallback, useRef, useState } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeLoopStepId" | "activeWorkAreaId" | "activeWorkflowStageId" | "error" | "i18n" | "locale" | "manualSelectionVersionRef" | "researchRunContextBinding" | "runHistory" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setLocale" | "setRunHistoryState" | "setWorkspaceState" | "source" | "statusLabel" | "workspace">;
type Result = Pick<AppControllerBindings, "strategyExperimentHistory" | "setStrategyExperimentHistory" | "strategyExperimentHistorySourceKey" | "setStrategyExperimentHistorySourceKey" | "strategyExperimentActive" | "setStrategyExperimentActive" | "strategyExperimentDimensions" | "setStrategyExperimentDimensions" | "strategyExperimentDraftSourceKey" | "setStrategyExperimentDraftSourceKey" | "strategyExperimentGuardrails" | "setStrategyExperimentGuardrails" | "strategyExperimentWalkForward" | "setStrategyExperimentWalkForward" | "isStrategyExperimentRunning" | "setIsStrategyExperimentRunning" | "strategyExperimentError" | "setStrategyExperimentError" | "strategyLibraryState" | "setStrategyLibraryState" | "strategyProductionBindingState" | "setStrategyProductionBindingState" | "productionStrategyHandoffState" | "setProductionStrategyHandoffState" | "bindingStrategyRevision" | "setBindingStrategyRevision" | "strategyValidationState" | "setStrategyValidationState" | "pendingStrategyGovernanceAction" | "setPendingStrategyGovernanceAction" | "isSavingStrategy" | "setIsSavingStrategy" | "strategyValidationRequestIdRef" | "strategyExperimentRequestGenerationRef" | "initialStrategyExperimentIdRef" | "strategyExperimentSourceKeyRef" | "strategyExperimentWorkspaceRef" | "strategyExperimentActiveRef" | "strategyExperimentI18nRef" | "strategyDraftRequiresReaudit" | "strategyExperimentUsableSourceKey" | "strategyExperimentSourceRunId" | "strategyExperimentStrategyRevision" | "visibleStrategyExperimentDimensions" | "visibleStrategyExperimentHistory" | "visibleStrategyExperimentActive" | "visibleStrategyExperimentUrlId" | "strategyRuleDraft" | "strategyTemplateOptions" | "localStrategyReadinessGates" | "strategyReadinessGates" | "strategyRuleRows" | "visibleStrategyLibrary" | "strategyGovernanceQueue" | "strategyExperimentRequestIsCurrent" | "beginStrategyExperimentRequest" | "refreshStrategyExperiments" | "refreshStrategyLibrary" | "refreshStrategyProductionBinding" | "updateStrategyRuleDraftField" | "applyStrategyTemplate" | "applyGeneratedStrategyDraft" | "saveCurrentStrategyVersion" | "bindStrategyToProduction" | "deleteSavedStrategyVersion" | "runStrategyExperiment" | "inspectStrategyExperiment" | "replayStrategyExperiment" | "exportStrategyExperimentJson">;

export function useStrategyStateActions(controller: Dependencies): Result {
  const {
    activeLoopStepId, activeWorkAreaId, activeWorkflowStageId, error, i18n, locale,
    manualSelectionVersionRef, researchRunContextBinding, runHistory, setActiveLoopStepId, setActiveWorkAreaId, setActiveWorkflowStageId,
    setLocale, setRunHistoryState, setWorkspaceState, source, statusLabel, workspace
  } = controller;
  const [strategyExperimentHistory, setStrategyExperimentHistory] = useState<StrategyExperimentListItem[]>([]);
  const [strategyExperimentHistorySourceKey, setStrategyExperimentHistorySourceKey] = useState<string | null>(null);
  const [strategyExperimentActive, setStrategyExperimentActive] = useState<StrategyExperimentDetail | null>(null);
  const [strategyExperimentDimensions, setStrategyExperimentDimensions] = useState<StrategyExperimentDimension[]>([]);
  const [strategyExperimentDraftSourceKey, setStrategyExperimentDraftSourceKey] = useState<string | null>(null);
  const [strategyExperimentGuardrails, setStrategyExperimentGuardrails] = useState<StrategyExperimentGuardrails>({
      minimumTradeCount: 2,
      maximumDrawdownPct: 20
    });
  const [strategyExperimentWalkForward, setStrategyExperimentWalkForward] =
      useState<StrategyExperimentWalkForward | null>(DEFAULT_STRATEGY_EXPERIMENT_WALK_FORWARD);
  const [isStrategyExperimentRunning, setIsStrategyExperimentRunning] = useState(false);
  const [strategyExperimentError, setStrategyExperimentError] = useState<string | null>(null);
  const [strategyLibraryState, setStrategyLibraryState] = useState<StrategyLibraryResult>(initialStrategyLibraryState);
  const [strategyProductionBindingState, setStrategyProductionBindingState] =
      useState<StrategyProductionBindingResult>(initialStrategyProductionBindingState);
  const [productionStrategyHandoffState, setProductionStrategyHandoffState] =
      useState<ProductionStrategyHandoffResult>(initialProductionStrategyHandoffState);
  const [bindingStrategyRevision, setBindingStrategyRevision] = useState<string | null>(null);
  const [strategyValidationState, setStrategyValidationState] =
      useState<StrategyValidationResult>(initialStrategyValidationState);
  const [pendingStrategyGovernanceAction, setPendingStrategyGovernanceAction] =
      useState<StrategyGovernanceQueueRow | null>(null);
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);
  const strategyValidationRequestIdRef = useRef(0);
  const strategyExperimentRequestGenerationRef = useRef(0);
  const initialStrategyExperimentIdRef = useRef(initialStrategyExperimentId);
  const strategyExperimentSourceKeyRef = useRef<string | null>(null);
  const strategyExperimentWorkspaceRef = useRef(workspace);
  const strategyExperimentActiveRef = useRef(strategyExperimentActive);
  const strategyExperimentI18nRef = useRef(i18n);
  const strategyDraftRequiresReaudit = workspaceNeedsStrategyReaudit(workspace);
  const strategyExperimentUsableSourceKey =
      researchRunContextBinding.canUseRun && workspace.researchRun
        ? `${workspace.researchRun.runId}:${workspace.researchRun.strategyRevision}`
        : null;
  const strategyExperimentSourceRunId = strategyExperimentUsableSourceKey ? workspace.researchRun!.runId : null;
  const strategyExperimentStrategyRevision = strategyExperimentUsableSourceKey
      ? workspace.researchRun!.strategyRevision
      : null;
  const visibleStrategyExperimentDimensions =
      strategyExperimentDraftSourceKey === strategyExperimentUsableSourceKey
        ? strategyExperimentDimensions
        : [];
  const visibleStrategyExperimentHistory =
      strategyExperimentHistorySourceKey === strategyExperimentUsableSourceKey
        ? strategyExperimentHistory
        : [];
  const visibleStrategyExperimentActive =
      strategyExperimentUsableSourceKey &&
      strategyExperimentActive &&
      strategyExperimentMatchesSourceKey(strategyExperimentActive, strategyExperimentUsableSourceKey)
        ? strategyExperimentActive
        : null;
  const visibleStrategyExperimentUrlId = resolveStrategyExperimentIdForCurrentSource(
      visibleStrategyExperimentActive,
      strategyExperimentUsableSourceKey
    );
  const strategyRuleDraft = buildStrategyRuleDraft(workspace);
  const strategyTemplateOptions = buildStrategyTemplateOptions();
  const localStrategyReadinessGates = buildStrategyReadinessGates(workspace);
  const strategyReadinessGates = mergeStrategyReadinessGatesWithLocalAudit(
      strategyValidationState.validation?.gates,
      localStrategyReadinessGates
    );
  const strategyRuleRows = buildStrategyRuleRows(workspace);
  const visibleStrategyLibrary = strategyLibraryState.strategies;
  const strategyGovernanceQueue = buildStrategyGovernanceQueueRows({
      workspace,
      library: visibleStrategyLibrary,
      runHistory
    });
  const strategyExperimentRequestIsCurrent = useCallback((requestGeneration: number, sourceKey: string) => (
      strategyExperimentRequestGenerationRef.current === requestGeneration &&
      strategyExperimentSourceKeyRef.current === sourceKey
    ), []);
  const beginStrategyExperimentRequest = useCallback((sourceKey: string): number | null => {
      if (strategyExperimentSourceKeyRef.current !== sourceKey) {
        return null;
      }
      const requestGeneration = strategyExperimentRequestGenerationRef.current + 1;
      strategyExperimentRequestGenerationRef.current = requestGeneration;
      setIsStrategyExperimentRunning(true);
      setStrategyExperimentError(null);
      return requestGeneration;
    }, []);
  const refreshStrategyExperiments = useCallback(async (
      requestGeneration: number,
      sourceKey: string,
      sourceRunId: string,
      strategyRevision: string
    ) => {
      try {
        const result = await loadStrategyExperiments(quantCoreBaseUrl, {
          sourceRunId,
          strategyRevision,
          limit: 20
        });
        if (!strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
          return;
        }
        if (result.error) {
          setStrategyExperimentError(
            strategyExperimentErrorMessage(strategyExperimentI18nRef.current, result.errorCode, result.error)
          );
          return;
        }
        setStrategyExperimentHistory(
          result.experiments.filter((experiment) => strategyExperimentMatchesSourceKey(experiment, sourceKey))
        );
        setStrategyExperimentHistorySourceKey(sourceKey);
        setStrategyExperimentError(null);
      } catch (historyError) {
        if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
          setStrategyExperimentError(strategyExperimentErrorMessage(
            strategyExperimentI18nRef.current,
            undefined,
            historyError instanceof Error ? historyError.message : undefined
          ));
        }
      }
    }, [strategyExperimentRequestIsCurrent]);
  const refreshStrategyLibrary = useCallback(async () => {
      const result = await loadStrategyLibrary(quantCoreBaseUrl, {
        limit: 12
      });
      setStrategyLibraryState(result);
      return result;
    }, []);
  const refreshStrategyProductionBinding = useCallback(async () => {
      const result = await loadStrategyProductionBinding(quantCoreBaseUrl);
      setStrategyProductionBindingState(result);
      return result;
    }, []);
  const updateStrategyRuleDraftField = useCallback((field: StrategyRuleDraftField, value: number | string | boolean) => {
      manualSelectionVersionRef.current += 1;
      setWorkspaceState((current) => ({
        workspace: workspaceWithStrategyRuleDraftField(current.workspace, field, value),
        source: "core",
        statusLabel: "Strategy rules edited"
      }));
      setActiveWorkAreaId("strategy");
      setActiveLoopStepId("strategy");
      setActiveWorkflowStageId("factor");
    }, []);
  const applyStrategyTemplate = useCallback((templateId: StrategyTemplateId) => {
      manualSelectionVersionRef.current += 1;
      setWorkspaceState((current) => ({
        workspace: workspaceWithStrategyTemplate(current.workspace, templateId),
        source: "core",
        statusLabel: "Strategy template applied"
      }));
      setActiveWorkAreaId("strategy");
      setActiveLoopStepId("strategy");
      setActiveWorkflowStageId("factor");
    }, []);
  const applyGeneratedStrategyDraft = useCallback((draft: StrategyRuleDraft, reasons: string[]) => {
      manualSelectionVersionRef.current += 1;
      setWorkspaceState((current) => ({
        workspace: workspaceWithAiStrategyDraft(current.workspace, draft, reasons),
        source: "core",
        statusLabel: "AI strategy draft applied"
      }));
      setStrategyValidationState(initialStrategyValidationState);
      setActiveWorkAreaId("strategy");
      setActiveLoopStepId("strategy");
      setActiveWorkflowStageId("factor");
    }, []);
  const saveCurrentStrategyVersion = useCallback(async () => {
      setIsSavingStrategy(true);
      const preflight = await validateStrategySnapshot(quantCoreBaseUrl, {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe,
        auditRunId: workspace.researchRun?.runId ?? null,
        strategy: workspace.strategy
      });
      setStrategyValidationState(preflight);
      if (preflight.validation?.status === "blocked") {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Strategy version blocked by readiness gates",
          error: "Strategy version blocked by readiness gates"
        }));
        setActiveWorkAreaId("strategy");
        setActiveLoopStepId("strategy");
        setActiveWorkflowStageId("factor");
        setIsSavingStrategy(false);
        return;
      }
      const result = await saveStrategySnapshot(quantCoreBaseUrl, {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe,
        auditRunId: workspace.researchRun?.runId ?? null,
        strategy: workspace.strategy
      });
      if (result.validation) {
        setStrategyValidationState({
          validation: result.validation,
          source: result.source,
          error: result.error
        });
      }
      if (result.strategy) {
        setStrategyLibraryState((current) => ({
          strategies: [result.strategy!, ...current.strategies.filter((item) => item.revision !== result.strategy!.revision)],
          source: "core",
          error: undefined
        }));
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Strategy version saved",
          error: undefined
        }));
      } else {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Strategy version save failed",
          error: result.error ?? "Strategy version save failed"
        }));
      }
      setIsSavingStrategy(false);
    }, [workspace.researchRun?.runId, workspace.selectedInstrument.market, workspace.selectedInstrument.symbol, workspace.selectedTimeframe, workspace.strategy]);
  const bindStrategyToProduction = useCallback(async (
      strategy: ProductionStrategyBindingTarget | null,
      operator: string
    ) => {
      if (
        bindingStrategyRevision
        || (strategy && (strategy.status !== "audited" || !strategy.auditRunId))
      ) {
        return false;
      }
      if (!operator.trim()) {
        return false;
      }

      const targetRevision = strategy?.revision ?? "builtin";
      setBindingStrategyRevision(targetRevision);
      const result = await updateStrategyProductionBinding(quantCoreBaseUrl, {
        strategyRevision: strategy?.revision ?? null,
        auditRunId: strategy?.auditRunId ?? null,
        operator: operator.trim()
      });
      setBindingStrategyRevision(null);
      setStrategyProductionBindingState((current) =>
        result.binding ? result : { ...result, binding: current.binding }
      );
      if (!result.binding) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: locale === "zh-CN" ? "生产策略交接失败" : "Production strategy handoff failed",
          error: strategyProductionBindingErrorLabel(i18n, result.error)
        }));
        return false;
      }
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: locale === "zh-CN" ? "生产策略已交接，自动交易保持暂停" : "Production strategy bound; automated trading remains paused",
        error: undefined
      }));
      return true;
    }, [
      bindingStrategyRevision,
      i18n,
      locale
    ]);
  const deleteSavedStrategyVersion = useCallback(async (strategy: StrategyLibraryItem) => {
      const result = await deleteStrategyVersion(quantCoreBaseUrl, strategy.revision);
      if (!result.deleted) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Strategy version delete failed",
          error: result.error ?? "Strategy version delete failed"
        }));
        return false;
      }
      await refreshStrategyLibrary();
      setPendingStrategyGovernanceAction((current) => current?.revision === strategy.revision ? null : current);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Strategy version deleted",
        error: undefined
      }));
      return true;
    }, [refreshStrategyLibrary]);
  const runStrategyExperiment = useCallback(async () => {
      const sourceRun = workspace.researchRun;
      const sourceKey = strategyExperimentUsableSourceKey;
      if (!sourceKey || !strategyExperimentSourceRunId || !strategyExperimentStrategyRevision || !sourceRun) {
        setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
        return null;
      }
      if (!isStrategyExperimentDraftValid(
        visibleStrategyExperimentDimensions,
        strategyExperimentGuardrails,
        strategyExperimentWalkForward
      )) {
        setStrategyExperimentError(i18n.t("strategyExperiment.invalidDraft"));
        return null;
      }
      const requestGeneration = beginStrategyExperimentRequest(sourceKey);
      if (requestGeneration === null) {
        return null;
      }
      try {
        const result = await createStrategyExperiment(quantCoreBaseUrl, {
          strategyRevision: strategyExperimentStrategyRevision,
          sourceRunId: strategyExperimentSourceRunId,
          assumptions: workspace.backtestAssumptions ?? defaultBacktestAssumptions,
          dimensions: visibleStrategyExperimentDimensions,
          guardrails: strategyExperimentGuardrails,
          walkForward: strategyExperimentWalkForward
        });
        if (!strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
          return null;
        }
        if (!result.experiment) {
          setStrategyExperimentError(
            strategyExperimentErrorMessage(strategyExperimentI18nRef.current, result.errorCode, result.error)
          );
          return null;
        }
        if (!strategyExperimentMatchesSourceKey(result.experiment, sourceKey)) {
          setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
          return null;
        }
        setStrategyExperimentActive(result.experiment);
        setStrategyExperimentError(null);
        await refreshStrategyExperiments(
          requestGeneration,
          sourceKey,
          strategyExperimentSourceRunId,
          strategyExperimentStrategyRevision
        );
        return result.experiment;
      } catch (runError) {
        if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
          setStrategyExperimentError(strategyExperimentErrorMessage(
            strategyExperimentI18nRef.current,
            undefined,
            runError instanceof Error ? runError.message : undefined
          ));
        }
        return null;
      } finally {
        if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
          setIsStrategyExperimentRunning(false);
        }
      }
    }, [
      beginStrategyExperimentRequest,
      i18n,
      refreshStrategyExperiments,
      strategyExperimentGuardrails,
      strategyExperimentRequestIsCurrent,
      strategyExperimentSourceRunId,
      strategyExperimentStrategyRevision,
      strategyExperimentUsableSourceKey,
      strategyExperimentWalkForward,
      visibleStrategyExperimentDimensions,
      workspace
    ]);
  const inspectStrategyExperiment = useCallback(async (experimentId: string) => {
      const sourceKey = strategyExperimentUsableSourceKey;
      if (!sourceKey) {
        setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
        return;
      }
      const requestGeneration = beginStrategyExperimentRequest(sourceKey);
      if (requestGeneration === null) {
        return;
      }
      try {
        const result = await loadStrategyExperimentDetail(quantCoreBaseUrl, experimentId);
        if (!strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
          return;
        }
        if (!result.experiment) {
          setStrategyExperimentError(
            strategyExperimentErrorMessage(strategyExperimentI18nRef.current, result.errorCode, result.error)
          );
          return;
        }
        if (!strategyExperimentMatchesSourceKey(result.experiment, sourceKey)) {
          setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
          return;
        }
        setStrategyExperimentActive(result.experiment);
        setStrategyExperimentError(null);
      } catch (inspectError) {
        if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
          setStrategyExperimentError(strategyExperimentErrorMessage(
            strategyExperimentI18nRef.current,
            undefined,
            inspectError instanceof Error ? inspectError.message : undefined
          ));
        }
      } finally {
        if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
          setIsStrategyExperimentRunning(false);
        }
      }
    }, [beginStrategyExperimentRequest, i18n, strategyExperimentRequestIsCurrent, strategyExperimentUsableSourceKey]);
  const replayStrategyExperiment = useCallback(async (experimentId: string) => {
      const sourceKey = strategyExperimentUsableSourceKey;
      if (!sourceKey || !strategyExperimentSourceRunId || !strategyExperimentStrategyRevision) {
        setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
        return;
      }
      const requestGeneration = beginStrategyExperimentRequest(sourceKey);
      if (requestGeneration === null) {
        return;
      }
      try {
        const result = await createStrategyExperiment(quantCoreBaseUrl, { replayOfExperimentId: experimentId });
        if (!strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
          return;
        }
        if (!result.experiment) {
          setStrategyExperimentError(
            strategyExperimentErrorMessage(strategyExperimentI18nRef.current, result.errorCode, result.error)
          );
          return;
        }
        if (!strategyExperimentMatchesSourceKey(result.experiment, sourceKey)) {
          setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
          return;
        }
        setStrategyExperimentActive(result.experiment);
        setStrategyExperimentError(null);
        await refreshStrategyExperiments(
          requestGeneration,
          sourceKey,
          strategyExperimentSourceRunId,
          strategyExperimentStrategyRevision
        );
      } catch (replayError) {
        if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
          setStrategyExperimentError(strategyExperimentErrorMessage(
            strategyExperimentI18nRef.current,
            undefined,
            replayError instanceof Error ? replayError.message : undefined
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
      refreshStrategyExperiments,
      strategyExperimentRequestIsCurrent,
      strategyExperimentSourceRunId,
      strategyExperimentStrategyRevision,
      strategyExperimentUsableSourceKey
    ]);
  const exportStrategyExperimentJson = useCallback((experiment: StrategyExperimentDetail) => {
      const sourceKey = strategyExperimentSourceKeyRef.current;
      if (!sourceKey || !strategyExperimentMatchesSourceKey(experiment, sourceKey)) {
        setStrategyExperimentError(
          strategyExperimentI18nRef.current.t("strategyExperiment.persistedEvidenceRequired")
        );
        return;
      }
      let objectUrl: string | null = null;
      let anchor: HTMLAnchorElement | null = null;
      try {
        objectUrl = URL.createObjectURL(
          new Blob([JSON.stringify(experiment, null, 2)], { type: "application/json;charset=utf-8" })
        );
        anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = `${experiment.experimentId}-strategy-experiment.json`;
        document.body.appendChild(anchor);
        anchor.click();
        setStrategyExperimentError(null);
      } catch (exportError) {
        setStrategyExperimentError(strategyExperimentActionErrorMessage(
          strategyExperimentI18nRef.current,
          "strategyExperiment.exportFailed",
          exportError
        ));
      } finally {
        anchor?.remove();
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }, []);
  return {
    strategyExperimentHistory, setStrategyExperimentHistory, strategyExperimentHistorySourceKey, setStrategyExperimentHistorySourceKey, strategyExperimentActive, setStrategyExperimentActive,
    strategyExperimentDimensions, setStrategyExperimentDimensions, strategyExperimentDraftSourceKey, setStrategyExperimentDraftSourceKey, strategyExperimentGuardrails, setStrategyExperimentGuardrails,
    strategyExperimentWalkForward, setStrategyExperimentWalkForward, isStrategyExperimentRunning, setIsStrategyExperimentRunning, strategyExperimentError, setStrategyExperimentError,
    strategyLibraryState, setStrategyLibraryState, strategyProductionBindingState, setStrategyProductionBindingState, productionStrategyHandoffState, setProductionStrategyHandoffState,
    bindingStrategyRevision, setBindingStrategyRevision, strategyValidationState, setStrategyValidationState, pendingStrategyGovernanceAction, setPendingStrategyGovernanceAction,
    isSavingStrategy, setIsSavingStrategy, strategyValidationRequestIdRef, strategyExperimentRequestGenerationRef, initialStrategyExperimentIdRef, strategyExperimentSourceKeyRef,
    strategyExperimentWorkspaceRef, strategyExperimentActiveRef, strategyExperimentI18nRef, strategyDraftRequiresReaudit, strategyExperimentUsableSourceKey, strategyExperimentSourceRunId,
    strategyExperimentStrategyRevision, visibleStrategyExperimentDimensions, visibleStrategyExperimentHistory, visibleStrategyExperimentActive, visibleStrategyExperimentUrlId, strategyRuleDraft,
    strategyTemplateOptions, localStrategyReadinessGates, strategyReadinessGates, strategyRuleRows, visibleStrategyLibrary, strategyGovernanceQueue,
    strategyExperimentRequestIsCurrent, beginStrategyExperimentRequest, refreshStrategyExperiments, refreshStrategyLibrary, refreshStrategyProductionBinding, updateStrategyRuleDraftField,
    applyStrategyTemplate, applyGeneratedStrategyDraft, saveCurrentStrategyVersion, bindStrategyToProduction, deleteSavedStrategyVersion, runStrategyExperiment,
    inspectStrategyExperiment, replayStrategyExperiment, exportStrategyExperimentJson
  };
}
