import { ProductWorkAreaId } from "../../../lib/terminal-workbench";
import { goldenPathActionLabel, goldenPathDetail } from "../../stage1/golden-path-formatters";
import { automatedTradingWorkflowActionKey, automatedTradingWorkflowRequiresManualAction } from "../../stage1/platform-overview-formatters";
import { productWorkAreaIds } from "../navigation";
import { useEffect } from "react";
import type { AppControllerBindings } from "./bindings";

type Dependencies = Pick<AppControllerBindings, "activeWorkAreaId" | "automatedTradingWorkflowActionErrorRef" | "automatedTradingWorkflowActionInFlightRef" | "automatedTradingWorkflowActionKeyRef" | "automatedTradingWorkflowContextRef" | "automatedTradingWorkflowRunIdRef" | "automatedTradingWorkflowStatus" | "error" | "goldenPath" | "goldenPathActionHint" | "i18n" | "isAutomatedTradingWorkflowRunning" | "isChartLoading" | "isGoldenPathActionDisabledById" | "openLiveTradingGate" | "productWorkAreas" | "refreshGoldenPathStatus" | "runGoldenPathActionById" | "selectProductWorkArea" | "setActiveWorkAreaId" | "setAutomatedTradingWorkflowStatus" | "setIsAutomatedTradingWorkflowRunning" | "setIsChartLoading" | "setWorkspaceState" | "source" | "statusLabel" | "stopAutomatedTradingWorkflow" | "workspace">;
type Result = void;

export function useAutomationRuntimeEffect(controller: Dependencies): Result {
  const {
    activeWorkAreaId, automatedTradingWorkflowActionErrorRef, automatedTradingWorkflowActionInFlightRef, automatedTradingWorkflowActionKeyRef, automatedTradingWorkflowContextRef, automatedTradingWorkflowRunIdRef,
    automatedTradingWorkflowStatus, error, goldenPath, goldenPathActionHint, i18n, isAutomatedTradingWorkflowRunning,
    isChartLoading, isGoldenPathActionDisabledById, openLiveTradingGate, productWorkAreas, refreshGoldenPathStatus, runGoldenPathActionById,
    selectProductWorkArea, setActiveWorkAreaId, setAutomatedTradingWorkflowStatus, setIsAutomatedTradingWorkflowRunning, setIsChartLoading, setWorkspaceState,
    source, statusLabel, stopAutomatedTradingWorkflow, workspace
  } = controller;
  useEffect(() => {
      if (
        !isAutomatedTradingWorkflowRunning ||
        !goldenPath ||
        automatedTradingWorkflowActionInFlightRef.current
      ) {
        return;
      }
      const currentContextKey = [
        workspace.selectedInstrument.market,
        workspace.selectedInstrument.symbol,
        workspace.selectedTimeframe
      ].join(":");
      if (automatedTradingWorkflowContextRef.current !== currentContextKey) {
        stopAutomatedTradingWorkflow(
          i18n.locale === "zh-CN"
            ? "自动流程已暂停：标的或周期已改变。"
            : "The automated workflow paused because the instrument or timeframe changed."
        );
        return;
      }
      const action = goldenPath.nextAction;
      if (!action) {
        selectProductWorkArea("audit");
        stopAutomatedTradingWorkflow(
          i18n.locale === "zh-CN"
            ? "自动流程已完成，审计证据已就绪。"
            : "The automated workflow is complete and audit evidence is ready."
        );
        return;
      }
      if (action.id === "certify-live-adapter") {
        openLiveTradingGate();
        stopAutomatedTradingWorkflow(
          i18n.locale === "zh-CN"
            ? "可自动执行的模拟交易流程已完成；实盘操作需要人工确认。"
            : "The automated paper-trading flow is complete; live trading requires manual confirmation."
        );
        return;
      }
      const targetWorkspace = productWorkAreaIds.includes(action.targetWorkspace as ProductWorkAreaId)
        ? (action.targetWorkspace as ProductWorkAreaId)
        : null;
      if (targetWorkspace && activeWorkAreaId !== targetWorkspace) {
        const targetWorkArea = productWorkAreas.find((area) => area.id === targetWorkspace);
        const targetLabel = targetWorkArea ? i18n.productWorkAreaLabel(targetWorkArea) : targetWorkspace;
        setAutomatedTradingWorkflowStatus(
          i18n.locale === "zh-CN" ? `正在前往：${targetLabel}` : `Opening: ${targetLabel}`
        );
        selectProductWorkArea(targetWorkspace);
        return;
      }
      if (automatedTradingWorkflowRequiresManualAction(action.id)) {
        stopAutomatedTradingWorkflow(
          i18n.locale === "zh-CN"
            ? "自动流程已暂停：执行交接需要人工复核。"
            : "The automated workflow paused because the execution handoff requires manual review."
        );
        return;
      }
      if (action.id === "run-pipeline" && isChartLoading) {
        return;
      }
      if (isGoldenPathActionDisabledById(action.id)) {
        stopAutomatedTradingWorkflow(
          goldenPathActionHint ??
            goldenPathDetail(
              i18n,
              goldenPath.steps.find((step) => step.id === goldenPath.currentStepId),
              action.reason,
              goldenPath
            )
        );
        return;
      }

      const actionKey = automatedTradingWorkflowActionKey(goldenPath);
      if (!actionKey || automatedTradingWorkflowActionKeyRef.current === actionKey) {
        stopAutomatedTradingWorkflow(
          i18n.locale === "zh-CN"
            ? "自动流程已暂停：当前步骤执行后未推进，请检查页面中的阻断原因。"
            : "The automated workflow paused because the current step did not advance."
        );
        return;
      }

      const runId = automatedTradingWorkflowRunIdRef.current;
      const actionLabel = goldenPathActionLabel(i18n, action);
      automatedTradingWorkflowActionKeyRef.current = actionKey;
      automatedTradingWorkflowActionInFlightRef.current = true;
      setAutomatedTradingWorkflowStatus(
        i18n.locale === "zh-CN" ? `正在自动执行：${actionLabel}` : `Running automatically: ${actionLabel}`
      );
      void (async () => {
        try {
          const executed = await runGoldenPathActionById(
            action.id,
            action.targetWorkspace,
            goldenPath.latestRunId,
            true
          );
          if (automatedTradingWorkflowRunIdRef.current !== runId) {
            return;
          }
          const nextResult = await refreshGoldenPathStatus();
          if (automatedTradingWorkflowRunIdRef.current !== runId) {
            return;
          }
          automatedTradingWorkflowActionInFlightRef.current = false;
          const nextGoldenPath = nextResult.goldenPath;
          if (!executed || !nextGoldenPath) {
            const actionError = automatedTradingWorkflowActionErrorRef.current;
            stopAutomatedTradingWorkflow(
              i18n.locale === "zh-CN"
                ? `自动流程已暂停：${nextResult.error ?? (actionError ? `${actionLabel} 未完成：${actionError}` : `${actionLabel} 未完成。`)}`
                : `The automated workflow paused: ${nextResult.error ?? (actionError ? `${actionLabel} did not complete: ${actionError}` : `${actionLabel} did not complete.`)}`
            );
            return;
          }
          if (automatedTradingWorkflowActionKey(nextGoldenPath) === actionKey) {
            stopAutomatedTradingWorkflow(
              i18n.locale === "zh-CN"
                ? `${actionLabel} 已执行，但流程状态未推进；请检查当前页面的阻断原因。`
                : `${actionLabel} ran, but the workflow status did not advance.`
            );
            return;
          }
          setAutomatedTradingWorkflowStatus(
            i18n.locale === "zh-CN" ? `${actionLabel} 已完成，正在继续下一步…` : `${actionLabel} complete. Continuing…`
          );
        } catch (error) {
          if (automatedTradingWorkflowRunIdRef.current === runId) {
            stopAutomatedTradingWorkflow(
              i18n.locale === "zh-CN"
                ? `自动流程已暂停：${error instanceof Error ? error.message : "步骤执行失败。"}`
                : `The automated workflow paused: ${error instanceof Error ? error.message : "The step failed."}`
            );
          }
        }
      })();
    }, [
      activeWorkAreaId,
      goldenPath,
      goldenPathActionHint,
      i18n,
      isAutomatedTradingWorkflowRunning,
      isChartLoading,
      isGoldenPathActionDisabledById,
      openLiveTradingGate,
      productWorkAreas,
      refreshGoldenPathStatus,
      runGoldenPathActionById,
      selectProductWorkArea,
      stopAutomatedTradingWorkflow,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]);
}
