import { buildPortfolioBacktestReportAuditEvent, loadPortfolioPaperOrderReplay, loadPortfolioPaperOrderStateHistory, recordPortfolioPaperOrderBatchSimulation, saveAuditEvent } from "../../../lib/terminal-api";
import { buildPortfolioBacktestReportMarkdown, PortfolioPaperOrderApprovalRow } from "../../../lib/terminal-workbench";
import { PORTFOLIO_PAPER_ORDER_AUDIT_EVENTS_PAGE_SIZE, quantCoreBaseUrl } from "../../app-shell/initial-state";
import { mergePortfolioPaperOrderLifecycleEvents, mergePortfolioPaperOrderSimulations, mergePortfolioPaperOrderStateHistories } from "../../audit/event-merges";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "currentResearchRunId" | "error" | "isSimulatingPortfolioPaperOrderBatch" | "portfolioBacktestDraft" | "portfolioBacktestState" | "portfolioPaperOrderApprovalRows" | "portfolioPaperOrderAuditOffset" | "portfolioPaperOrderAuditPagination" | "portfolioPaperOrderHistoryError" | "portfolioPaperOrderLifecycleEvents" | "portfolioPaperOrderReplay" | "portfolioPaperOrderRouteRiskRequest" | "portfolioPaperOrderSimulationRouteRows" | "portfolioPaperOrderSimulations" | "portfolioPaperOrderStateHistories" | "portfolioStage4RefreshGeneration" | "portfolioStage4RequestCoordinatorRef" | "recordPortfolioPaperOrders" | "recordPortfolioStage4Workflow" | "resetStage4PortfolioBusyState" | "runPortfolioBacktestDraft" | "setIsSimulatingPortfolioPaperOrderBatch" | "setPortfolioBacktestState" | "setPortfolioPaperOrderAuditOffset" | "setPortfolioPaperOrderAuditPagination" | "setPortfolioPaperOrderHistoryError" | "setPortfolioPaperOrderLifecycleEvents" | "setPortfolioPaperOrderReplay" | "setPortfolioPaperOrderSimulations" | "setPortfolioPaperOrderStateHistories" | "setPortfolioStage4RefreshGeneration" | "setWorkspaceState" | "source" | "statusLabel" | "workspace">;
type Result = Pick<AppControllerBindings, "simulatePortfolioPaperOrderBatch" | "runPortfolioStage4PrimaryAction" | "exportPortfolioBacktestMarkdown" | "nextPortfolioPaperOrderAuditPage">;

export function usePortfolioWorkflowActions(controller: Dependencies): Result {
  const {
    currentResearchRunId, error, isSimulatingPortfolioPaperOrderBatch, portfolioBacktestDraft, portfolioBacktestState, portfolioPaperOrderApprovalRows,
    portfolioPaperOrderAuditOffset, portfolioPaperOrderAuditPagination, portfolioPaperOrderHistoryError, portfolioPaperOrderLifecycleEvents, portfolioPaperOrderReplay, portfolioPaperOrderRouteRiskRequest,
    portfolioPaperOrderSimulationRouteRows, portfolioPaperOrderSimulations, portfolioPaperOrderStateHistories, portfolioStage4RefreshGeneration, portfolioStage4RequestCoordinatorRef, recordPortfolioPaperOrders,
    recordPortfolioStage4Workflow, resetStage4PortfolioBusyState, runPortfolioBacktestDraft, setIsSimulatingPortfolioPaperOrderBatch, setPortfolioBacktestState, setPortfolioPaperOrderAuditOffset,
    setPortfolioPaperOrderAuditPagination, setPortfolioPaperOrderHistoryError, setPortfolioPaperOrderLifecycleEvents, setPortfolioPaperOrderReplay, setPortfolioPaperOrderSimulations, setPortfolioPaperOrderStateHistories,
    setPortfolioStage4RefreshGeneration, setWorkspaceState, source, statusLabel, workspace
  } = controller;
  const simulatePortfolioPaperOrderBatch = useCallback(async () => {
      resetStage4PortfolioBusyState();
      const request = portfolioStage4RequestCoordinatorRef.current.begin(currentResearchRunId);
      const simulatedOrderKeys = new Set(
        portfolioPaperOrderSimulations.map((simulation) => `${simulation.batchId}:${simulation.orderId}`)
      );
      const eligibleRows = portfolioPaperOrderApprovalRows.filter(
        (row) =>
          row.baseRunId === currentResearchRunId &&
          row.state === "ready_for_simulation" &&
          (row.side === "buy" || row.side === "sell") &&
          !simulatedOrderKeys.has(`${row.batchId}:${row.orderId}`)
      );
      if (!eligibleRows.length) {
        if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Portfolio batch simulation skipped",
          error: "No ready portfolio paper orders are available for batch simulation"
        }));
        return;
      }

      const rowsByBatch = new Map<string, PortfolioPaperOrderApprovalRow[]>();
      for (const row of eligibleRows) {
        const key = `${row.baseRunId}:${row.batchId}`;
        rowsByBatch.set(key, [...(rowsByBatch.get(key) ?? []), row]);
      }

      setIsSimulatingPortfolioPaperOrderBatch(true);
      const simulatedAt = new Date().toISOString();
      let filledCount = 0;
      let blockedCount = 0;
      const errors: string[] = [];
      try {
        for (const rowsForBatch of rowsByBatch.values()) {
          const firstRow = rowsForBatch[0];
          if (!firstRow) {
            continue;
          }
          const adapterPaperExecutionEvidenceByOrderId: Record<
            string,
            {
              adapterPaperExecutionId: string;
              adapterManifestValidationId?: string;
              adapterPaperExecutionEvidence: Record<string, unknown>;
            }
          > = {};
          for (const row of rowsForBatch) {
            const routeRow = portfolioPaperOrderSimulationRouteRows.find(
              (candidate) => candidate.batchId === row.batchId && candidate.orderId === row.orderId
            );
            if (!routeRow?.adapterPaperExecutionId) {
              continue;
            }
            adapterPaperExecutionEvidenceByOrderId[row.orderId] = {
              adapterPaperExecutionId: routeRow.adapterPaperExecutionId,
              adapterManifestValidationId: routeRow.adapterManifestValidationId ?? undefined,
              adapterPaperExecutionEvidence: {
                adapterPaperExecutionId: routeRow.adapterPaperExecutionId,
                adapterManifestValidationId: routeRow.adapterManifestValidationId,
                evidenceLabel: routeRow.adapterPaperExecutionEvidenceLabel,
                paperFillRecorded: true,
                liveOrderSubmitted: false,
                routeExecuted: false
              }
            };
          }
          const result = await recordPortfolioPaperOrderBatchSimulation(quantCoreBaseUrl, {
            baseRunId: firstRow.baseRunId,
            batchId: firstRow.batchId,
            orderIds: rowsForBatch.map((row) => row.orderId),
            simulatedAt,
            routeRisk: portfolioPaperOrderRouteRiskRequest,
            adapterPaperExecutionEvidenceByOrderId:
              Object.keys(adapterPaperExecutionEvidenceByOrderId).length > 0
                ? adapterPaperExecutionEvidenceByOrderId
                : undefined
          });
          if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;

          filledCount += result.batchSimulation?.filledCount ?? result.createdSimulations.length;
          blockedCount += result.batchSimulation?.blockedCount ?? 0;
          if (result.error) {
            errors.push(result.error);
          }
          if (result.simulations.length) {
            setPortfolioPaperOrderSimulations((current) =>
              mergePortfolioPaperOrderSimulations(current, firstRow.batchId, result.simulations)
            );
          }
          if (result.lifecycle?.length) {
            setPortfolioPaperOrderLifecycleEvents((current) =>
              mergePortfolioPaperOrderLifecycleEvents(current, firstRow.batchId, result.lifecycle ?? [])
            );
          }
          const stateHistoryResult = await loadPortfolioPaperOrderStateHistory(
            quantCoreBaseUrl,
            firstRow.baseRunId,
            firstRow.batchId
          );
          if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
          const stateHistory = stateHistoryResult.stateHistory;
          if (stateHistory) {
            setPortfolioPaperOrderStateHistories((current) =>
              mergePortfolioPaperOrderStateHistories(current, stateHistory)
            );
          }
          if (stateHistoryResult.error) {
            errors.push(stateHistoryResult.error);
          }
          const replayResult = await loadPortfolioPaperOrderReplay(quantCoreBaseUrl, firstRow.baseRunId);
          if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
          setPortfolioPaperOrderReplay(replayResult.replay ?? null);
          if (replayResult.error) {
            errors.push(replayResult.error);
          }
        }
      } finally {
        if (portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) {
          setIsSimulatingPortfolioPaperOrderBatch(false);
        }
      }

      if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
      const statusLabel = `Portfolio batch simulation routed · ${filledCount} filled / ${blockedCount} blocked`;
      const error = errors.length ? errors.join("; ") : undefined;
      setPortfolioPaperOrderHistoryError(error ?? null);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel,
        error
      }));
    }, [
      currentResearchRunId,
      portfolioPaperOrderApprovalRows,
      portfolioPaperOrderRouteRiskRequest,
      portfolioPaperOrderSimulationRouteRows,
      portfolioPaperOrderSimulations,
      quantCoreBaseUrl,
      resetStage4PortfolioBusyState
    ]);
  const runPortfolioStage4PrimaryAction = useCallback((actionId: string) => {
      if (actionId === "run-portfolio-backtest") return void runPortfolioBacktestDraft();
      if (actionId === "record-paper-order-batch") return void recordPortfolioPaperOrders();
      if (actionId === "simulate-portfolio-batch") return void simulatePortfolioPaperOrderBatch();
      if (actionId === "refresh-account-replay") {
        resetStage4PortfolioBusyState();
        portfolioStage4RequestCoordinatorRef.current.invalidate(currentResearchRunId);
        setPortfolioStage4RefreshGeneration((current) => current + 1);
        return;
      }
      if (actionId === "record-stage4-workflow") return void recordPortfolioStage4Workflow();
      const selector = {
        "review-portfolio-risk": ".surface-portfolio .design-risk-ledger",
        "review-portfolio-orders": ".surface-portfolio .portfolio-order-approval",
        "review-route-risk": ".surface-portfolio .design-risk-ledger"
      }[actionId];
      if (!selector) return;
      const target = document.querySelector<HTMLElement>(selector);
      if (!target) {
        setPortfolioPaperOrderHistoryError("当前步骤的操作区域尚未加载，请刷新页面后重试。");
        return;
      }
      setPortfolioPaperOrderHistoryError(null);
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus({ preventScroll: true });
    }, [
      recordPortfolioPaperOrders,
      recordPortfolioStage4Workflow,
      runPortfolioBacktestDraft,
      simulatePortfolioPaperOrderBatch,
      currentResearchRunId,
      resetStage4PortfolioBusyState
    ]);
  const exportPortfolioBacktestMarkdown = useCallback(() => {
      const portfolio = portfolioBacktestState.portfolio;
      const markdown = buildPortfolioBacktestReportMarkdown(portfolio, portfolioBacktestDraft);
      if (!markdown || !portfolio) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Portfolio report export failed",
          error: "Run a portfolio backtest before exporting the portfolio report"
        }));
        return;
      }

      const context = `${workspace.researchRun?.runId ?? "portfolio"}-${portfolio.market}-${portfolio.timeframe}`;
      const objectUrl = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${context}-portfolio-report.md`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Portfolio report export ready",
        error: undefined
      }));
      void buildPortfolioBacktestReportAuditEvent({
        baseRunId: workspace.researchRun?.runId ?? null,
        markdown,
        portfolio
      }).then((portfolioReportAuditEvent) => {
        if (!portfolioReportAuditEvent) {
          return;
        }

        return saveAuditEvent(quantCoreBaseUrl, portfolioReportAuditEvent).then((result) => {
          if (result.event) {
            setWorkspaceState((current) => ({
              ...current,
              statusLabel: "Portfolio report exported and audited",
              error: undefined
            }));
            return;
          }

          if (result.error) {
            setWorkspaceState((current) => ({
              ...current,
              statusLabel: "Portfolio report export ready",
              error: `Audit ledger save failed: ${result.error}`
            }));
          }
        });
      });
    }, [portfolioBacktestDraft, portfolioBacktestState.portfolio, workspace.researchRun?.runId]);
  const nextPortfolioPaperOrderAuditPage = useCallback(() => {
      setPortfolioPaperOrderAuditOffset((current) => {
        const total = portfolioPaperOrderAuditPagination?.total ?? 0;
        if (!total) {
          return current;
        }
        const next = current + PORTFOLIO_PAPER_ORDER_AUDIT_EVENTS_PAGE_SIZE;
        return next >= total ? current : next;
      });
    }, [portfolioPaperOrderAuditPagination?.total]);
  return {
    simulatePortfolioPaperOrderBatch, runPortfolioStage4PrimaryAction, exportPortfolioBacktestMarkdown, nextPortfolioPaperOrderAuditPage
  };
}
