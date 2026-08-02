import { createPortfolioStage4RequestCoordinator, selectCurrentStage4PortfolioWorkflow } from "../../../components/PortfolioStage4Section";
import { createPortfolioRiskAssessment, type PortfolioRiskAssessment, type PortfolioRiskAssessmentRequest } from "../../../lib/portfolio-m5";
import { buildStage4PortfolioGoldenPath, recordStage4PortfolioWorkflow, type Stage4PortfolioWorkflow } from "../../../lib/portfolio-stage4";
import { AuditEventHistoryPagination, AuditEventRecord, loadAuditEvents, loadPortfolioPaperOrderReplay, loadPortfolioPaperOrderStateHistory, PortfolioBacktestResult, PortfolioPaperOrderBatch, PortfolioPaperOrderLifecycleEvent, PortfolioPaperOrderReplay, PortfolioPaperOrderSimulation, PortfolioPaperOrderStateHistory, recordPortfolioPaperOrderApproval, recordPortfolioPaperOrderBatch, recordPortfolioPaperOrderSimulation, runPortfolioBacktest, runTerminalResearch } from "../../../lib/terminal-api";
import { buildInstrumentFromSymbol, buildPortfolioBacktestDiagnosticRows, buildPortfolioBacktestDraft, buildPortfolioPaperOpsQueueRows, buildPortfolioPaperOrderApprovalLockedLedgerMessage, buildPortfolioPaperOrderApprovalRows, buildPortfolioPaperOrderAuditLedgerRows, buildPortfolioPaperOrderLatestSimulationSummary, buildPortfolioPaperOrderLifecycleRows, buildPortfolioPaperOrderReplayPositionRows, buildPortfolioPaperOrderReplaySummaryTiles, buildPortfolioPaperOrderSimulationRouteRiskRequest, buildPortfolioPaperOrderSimulationRouteRows, buildPortfolioPaperOrderStateHistoryRows, buildPortfolioPeerAuditPlan, buildPortfolioRiskRows, defaultPortfolioPaperOrderRouteRiskTemplate, portfolioPaperOrderApprovalResultCarriesLockedLedgerState, PortfolioPaperOrderApprovalRow, PortfolioPaperOrderRouteRiskTemplate, workspaceWithPortfolioPeerAuditInstrument } from "../../../lib/terminal-workbench";
import { initialPortfolioBacktestState, PORTFOLIO_PAPER_ORDER_AUDIT_EVENT_TYPES, PORTFOLIO_PAPER_ORDER_AUDIT_EVENTS_PAGE_SIZE, quantCoreBaseUrl } from "../../app-shell/initial-state";
import { replaceAuditEvidenceReportQueryUrlParam, resolveInitialAuditEvidenceReportQuery } from "../../app-shell/url-state";
import { mergePortfolioPaperOrderLifecycleEvents, mergePortfolioPaperOrderSimulations, mergePortfolioPaperOrderStateHistories } from "../../audit/event-merges";
import { autoTradingErrorMessage, type AutoTradingSnapshot, loadAutoTradingSnapshot } from "../../dynamic-trading/ExecutionAutoPaperTradingSection";
import { chartKlineLimit } from "../../research/ChartComponents";
import { useCallback, useMemo, useRef, useState } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "currentResearchRunId" | "currentResearchRunIdRef" | "error" | "executionAdapterPaperExecutionRows" | "refreshRunHistory" | "refreshStrategyLibrary" | "runHistory" | "setRunHistoryState" | "setWorkspaceState" | "source" | "statusLabel" | "workspace">;
type Result = Pick<AppControllerBindings, "portfolioBacktestState" | "setPortfolioBacktestState" | "portfolioPaperOrderBatches" | "setPortfolioPaperOrderBatches" | "portfolioPaperOrderLifecycleEvents" | "setPortfolioPaperOrderLifecycleEvents" | "portfolioPaperOrderSimulations" | "setPortfolioPaperOrderSimulations" | "portfolioPaperOrderReplay" | "setPortfolioPaperOrderReplay" | "portfolioRouteRiskTemplate" | "setPortfolioRouteRiskTemplate" | "portfolioPaperOrderStateHistories" | "setPortfolioPaperOrderStateHistories" | "portfolioPaperOrderHistoryError" | "setPortfolioPaperOrderHistoryError" | "portfolioStage4Workflows" | "setPortfolioStage4Workflows" | "portfolioRiskAssessments" | "setPortfolioRiskAssessments" | "portfolioRiskAssessmentError" | "setPortfolioRiskAssessmentError" | "isRunningPortfolioRiskAssessment" | "setIsRunningPortfolioRiskAssessment" | "autoTradingSnapshot" | "setAutoTradingSnapshot" | "portfolioProductionRiskError" | "setPortfolioProductionRiskError" | "isLoadingPortfolioProductionRisk" | "setIsLoadingPortfolioProductionRisk" | "portfolioStage4RefreshGeneration" | "setPortfolioStage4RefreshGeneration" | "isRunningPortfolioBacktest" | "setIsRunningPortfolioBacktest" | "isRecordingPortfolioPaperOrders" | "setIsRecordingPortfolioPaperOrders" | "approvingPortfolioPaperOrderId" | "setApprovingPortfolioPaperOrderId" | "simulatingPortfolioPaperOrderId" | "setSimulatingPortfolioPaperOrderId" | "isSimulatingPortfolioPaperOrderBatch" | "setIsSimulatingPortfolioPaperOrderBatch" | "isRecordingPortfolioStage4Workflow" | "setIsRecordingPortfolioStage4Workflow" | "isPreparingPortfolioPeers" | "setIsPreparingPortfolioPeers" | "portfolioPaperOrderAuditEvents" | "setPortfolioPaperOrderAuditEvents" | "portfolioPaperOrderAuditPagination" | "setPortfolioPaperOrderAuditPagination" | "portfolioPaperOrderAuditQuery" | "setPortfolioPaperOrderAuditQuery" | "portfolioPaperOrderAuditOffset" | "setPortfolioPaperOrderAuditOffset" | "isLoadingPortfolioPaperOrderAudit" | "setIsLoadingPortfolioPaperOrderAudit" | "portfolioProductionRiskRequestIdRef" | "portfolioPaperOrderAuditRequestIdRef" | "portfolioStage4RequestCoordinatorRef" | "portfolioPeerAuditRequestIdRef" | "portfolioPeerAuditActiveRef" | "resetStage4PortfolioBusyState" | "portfolioRiskRows" | "portfolioBacktestDiagnosticRows" | "portfolioBacktestDraft" | "portfolioBacktestDraftKey" | "portfolioPeerAuditPlan" | "portfolioPaperOrderLifecycleRows" | "portfolioPaperOrderApprovalRows" | "portfolioPaperOrderReplaySummaryTiles" | "portfolioPaperOrderReplayPositionRows" | "portfolioPaperOrderLatestSimulationSummary" | "portfolioPaperOrderStateHistoryRows" | "portfolioPaperOrderSimulationRouteRows" | "portfolioPaperOpsQueue" | "portfolioPaperOrderRouteRiskRequest" | "portfolioStage4LatestBatch" | "portfolioStage4Workflow" | "portfolioRiskAssessment" | "portfolioStage4GoldenPath" | "portfolioPaperOrderAuditRows" | "refreshPortfolioProductionRisk" | "refreshPortfolioPaperOrderAuditEvents" | "preparePortfolioPeerAudits" | "runPortfolioBacktestDraft" | "recordPortfolioPaperOrders" | "reviewPortfolioPaperOrder" | "approvePortfolioPaperOrder" | "rejectPortfolioPaperOrder" | "updatePortfolioRouteRiskTemplate" | "simulatePortfolioPaperOrder" | "recordPortfolioStage4Workflow" | "runPortfolioRiskAssessment" | "updatePortfolioPaperOrderAuditQuery" | "previousPortfolioPaperOrderAuditPage"> & Pick<AppControllerBindings, "updateAutoTradingSnapshot">;

export function usePortfolioStateActions(controller: Dependencies): Result {
  const {
    currentResearchRunId, currentResearchRunIdRef, error, executionAdapterPaperExecutionRows, refreshRunHistory, refreshStrategyLibrary,
    runHistory, setRunHistoryState, setWorkspaceState, source, statusLabel, workspace
  } = controller;
  const [portfolioBacktestState, setPortfolioBacktestState] =
      useState<PortfolioBacktestResult>(initialPortfolioBacktestState);
  const [portfolioPaperOrderBatches, setPortfolioPaperOrderBatches] = useState<PortfolioPaperOrderBatch[]>([]);
  const [portfolioPaperOrderLifecycleEvents, setPortfolioPaperOrderLifecycleEvents] = useState<
      PortfolioPaperOrderLifecycleEvent[]
    >([]);
  const [portfolioPaperOrderSimulations, setPortfolioPaperOrderSimulations] = useState<PortfolioPaperOrderSimulation[]>([]);
  const [portfolioPaperOrderReplay, setPortfolioPaperOrderReplay] = useState<PortfolioPaperOrderReplay | null>(null);
  const [portfolioRouteRiskTemplate, setPortfolioRouteRiskTemplate] =
      useState<PortfolioPaperOrderRouteRiskTemplate>(defaultPortfolioPaperOrderRouteRiskTemplate);
  const [portfolioPaperOrderStateHistories, setPortfolioPaperOrderStateHistories] = useState<
      PortfolioPaperOrderStateHistory[]
    >([]);
  const [portfolioPaperOrderHistoryError, setPortfolioPaperOrderHistoryError] = useState<string | null>(null);
  const [portfolioStage4Workflows, setPortfolioStage4Workflows] = useState<Stage4PortfolioWorkflow[]>([]);
  const [portfolioRiskAssessments, setPortfolioRiskAssessments] = useState<PortfolioRiskAssessment[]>([]);
  const [portfolioRiskAssessmentError, setPortfolioRiskAssessmentError] = useState<string | null>(null);
  const [isRunningPortfolioRiskAssessment, setIsRunningPortfolioRiskAssessment] = useState(false);
  const [autoTradingSnapshot, setAutoTradingSnapshot] =
      useState<AutoTradingSnapshot | null>(null);
  const updateAutoTradingSnapshot = useCallback(
    (snapshot: AutoTradingSnapshot | null) => setAutoTradingSnapshot(snapshot),
    [],
  );
  const [portfolioProductionRiskError, setPortfolioProductionRiskError] = useState<string | null>(null);
  const [isLoadingPortfolioProductionRisk, setIsLoadingPortfolioProductionRisk] = useState(false);
  const [portfolioStage4RefreshGeneration, setPortfolioStage4RefreshGeneration] = useState(0);
  const [isRunningPortfolioBacktest, setIsRunningPortfolioBacktest] = useState(false);
  const [isRecordingPortfolioPaperOrders, setIsRecordingPortfolioPaperOrders] = useState(false);
  const [approvingPortfolioPaperOrderId, setApprovingPortfolioPaperOrderId] = useState<string | null>(null);
  const [simulatingPortfolioPaperOrderId, setSimulatingPortfolioPaperOrderId] = useState<string | null>(null);
  const [isSimulatingPortfolioPaperOrderBatch, setIsSimulatingPortfolioPaperOrderBatch] = useState(false);
  const [isRecordingPortfolioStage4Workflow, setIsRecordingPortfolioStage4Workflow] = useState(false);
  const [isPreparingPortfolioPeers, setIsPreparingPortfolioPeers] = useState(false);
  const [portfolioPaperOrderAuditEvents, setPortfolioPaperOrderAuditEvents] = useState<AuditEventRecord[]>([]);
  const [portfolioPaperOrderAuditPagination, setPortfolioPaperOrderAuditPagination] =
      useState<AuditEventHistoryPagination | null>(null);
  const [portfolioPaperOrderAuditQuery, setPortfolioPaperOrderAuditQuery] =
      useState(resolveInitialAuditEvidenceReportQuery);
  const [portfolioPaperOrderAuditOffset, setPortfolioPaperOrderAuditOffset] = useState(0);
  const [isLoadingPortfolioPaperOrderAudit, setIsLoadingPortfolioPaperOrderAudit] = useState(false);
  const portfolioProductionRiskRequestIdRef = useRef(0);
  const portfolioPaperOrderAuditRequestIdRef = useRef(0);
  const portfolioStage4RequestCoordinatorRef = useRef(createPortfolioStage4RequestCoordinator());
  const portfolioPeerAuditRequestIdRef = useRef(0);
  const portfolioPeerAuditActiveRef = useRef(false);
  const resetStage4PortfolioBusyState = useCallback(() => {
      setIsRunningPortfolioBacktest(false);
      setIsRecordingPortfolioPaperOrders(false);
      setApprovingPortfolioPaperOrderId(null);
      setSimulatingPortfolioPaperOrderId(null);
      setIsSimulatingPortfolioPaperOrderBatch(false);
      setIsRecordingPortfolioStage4Workflow(false);
    }, []);
  const portfolioRiskRows = buildPortfolioRiskRows(workspace);
  const portfolioBacktestDiagnosticRows = buildPortfolioBacktestDiagnosticRows(portfolioBacktestState.portfolio);
  const portfolioBacktestDraft = buildPortfolioBacktestDraft(runHistory, currentResearchRunId);
  const portfolioBacktestDraftKey =
      portfolioBacktestDraft.request?.legs.map((leg) => `${leg.runId}:${leg.targetWeight}`).join("|") ??
      portfolioBacktestDraft.status;
  const portfolioPeerAuditPlan = buildPortfolioPeerAuditPlan(workspace, runHistory);
  const portfolioPaperOrderLifecycleRows = buildPortfolioPaperOrderLifecycleRows(
      portfolioPaperOrderBatches,
      portfolioPaperOrderLifecycleEvents
    );
  const portfolioPaperOrderApprovalRows = buildPortfolioPaperOrderApprovalRows(
      portfolioPaperOrderBatches,
      portfolioPaperOrderLifecycleEvents
    );
  const portfolioPaperOrderReplaySummaryTiles = buildPortfolioPaperOrderReplaySummaryTiles(portfolioPaperOrderReplay);
  const portfolioPaperOrderReplayPositionRows = buildPortfolioPaperOrderReplayPositionRows(portfolioPaperOrderReplay);
  const portfolioPaperOrderLatestSimulationSummary = buildPortfolioPaperOrderLatestSimulationSummary(
      portfolioPaperOrderSimulations,
      portfolioPaperOrderReplay,
      portfolioPaperOrderStateHistories
    );
  const portfolioPaperOrderStateHistoryRows =
      buildPortfolioPaperOrderStateHistoryRows(portfolioPaperOrderStateHistories);
  const portfolioPaperOrderSimulationRouteRows = buildPortfolioPaperOrderSimulationRouteRows(
      portfolioPaperOrderApprovalRows,
      portfolioPaperOrderSimulations,
      portfolioPaperOrderStateHistoryRows,
      executionAdapterPaperExecutionRows
    );
  const portfolioPaperOpsQueue = buildPortfolioPaperOpsQueueRows({
      approvalRows: portfolioPaperOrderApprovalRows,
      lifecycleRows: portfolioPaperOrderLifecycleRows,
      routeRows: portfolioPaperOrderSimulationRouteRows,
      stateHistoryRows: portfolioPaperOrderStateHistoryRows
    });
  const portfolioPaperOrderRouteRiskRequest = useMemo(
      () => buildPortfolioPaperOrderSimulationRouteRiskRequest(portfolioRouteRiskTemplate, portfolioPaperOrderReplay),
      [portfolioPaperOrderReplay, portfolioRouteRiskTemplate]
    );
  const portfolioStage4LatestBatch = [...portfolioPaperOrderBatches]
      .filter((batch) => batch.baseRunId === currentResearchRunId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  const portfolioStage4Workflow = selectCurrentStage4PortfolioWorkflow(
      portfolioStage4Workflows,
      currentResearchRunId,
      portfolioStage4LatestBatch?.batchId
    );
  const portfolioRiskAssessment = portfolioRiskAssessments.find(
      (assessment) => assessment.workflowId === portfolioStage4Workflow?.workflowId
    ) ?? null;
  const portfolioStage4GoldenPath = buildStage4PortfolioGoldenPath({
      baseRunId: currentResearchRunId ?? "",
      portfolio: portfolioBacktestState.portfolio,
      batches: portfolioPaperOrderBatches,
      lifecycle: portfolioPaperOrderLifecycleEvents,
      approvalRows: portfolioPaperOrderApprovalRows,
      routeRows: portfolioPaperOrderSimulationRouteRows,
      stateHistory: portfolioPaperOrderStateHistories.find(
        (history) => history.batchId === portfolioStage4LatestBatch?.batchId
      ),
      replay: portfolioPaperOrderReplay,
      workflow: portfolioStage4Workflow
    });
  const portfolioPaperOrderAuditRows = buildPortfolioPaperOrderAuditLedgerRows(portfolioPaperOrderAuditEvents);
  const refreshPortfolioProductionRisk = useCallback(async (showLoading = false) => {
      const requestId = portfolioProductionRiskRequestIdRef.current + 1;
      portfolioProductionRiskRequestIdRef.current = requestId;
      if (showLoading) setIsLoadingPortfolioProductionRisk(true);
      try {
        const snapshot = await loadAutoTradingSnapshot(quantCoreBaseUrl);
        if (portfolioProductionRiskRequestIdRef.current !== requestId) return;
        setAutoTradingSnapshot(snapshot);
        setPortfolioProductionRiskError(null);
      } catch (error) {
        if (portfolioProductionRiskRequestIdRef.current !== requestId) return;
        setAutoTradingSnapshot(null);
        setPortfolioProductionRiskError(autoTradingErrorMessage(error));
      } finally {
        if (showLoading && portfolioProductionRiskRequestIdRef.current === requestId) {
          setIsLoadingPortfolioProductionRisk(false);
        }
      }
    }, [quantCoreBaseUrl]);
  const refreshPortfolioPaperOrderAuditEvents = useCallback(async () => {
      const requestId = portfolioPaperOrderAuditRequestIdRef.current + 1;
      portfolioPaperOrderAuditRequestIdRef.current = requestId;
      setIsLoadingPortfolioPaperOrderAudit(true);
      const auditHistory = await loadAuditEvents(quantCoreBaseUrl, {
        eventType: PORTFOLIO_PAPER_ORDER_AUDIT_EVENT_TYPES,
        limit: PORTFOLIO_PAPER_ORDER_AUDIT_EVENTS_PAGE_SIZE,
        offset: portfolioPaperOrderAuditOffset,
        query: portfolioPaperOrderAuditQuery.trim() || undefined
      });
      if (portfolioPaperOrderAuditRequestIdRef.current !== requestId) {
        return auditHistory;
      }
      if (auditHistory.source === "core") {
        setPortfolioPaperOrderAuditEvents(auditHistory.events);
        setPortfolioPaperOrderAuditPagination(auditHistory.pagination ?? null);
      } else {
        setPortfolioPaperOrderAuditPagination(null);
      }
      setIsLoadingPortfolioPaperOrderAudit(false);
      return auditHistory;
    }, [portfolioPaperOrderAuditOffset, portfolioPaperOrderAuditQuery, quantCoreBaseUrl]);
  const preparePortfolioPeerAudits = useCallback(async () => {
      const sourceRunId = currentResearchRunIdRef.current;
      if (!sourceRunId || portfolioPeerAuditActiveRef.current) {
        return null;
      }
      const missingCandidates = portfolioPeerAuditPlan.candidates
        .filter((candidate) => candidate.status === "missing")
        .slice(0, 1);
      if (!missingCandidates.length) {
        return null;
      }

      portfolioPeerAuditActiveRef.current = true;
      const requestId = ++portfolioPeerAuditRequestIdRef.current;
      const peerKlineLimit = Math.max(
        1,
        Math.min(
          chartKlineLimit,
          workspace.backtestEquityCurve?.length ?? workspace.researchRun?.dataRows ?? chartKlineLimit
        )
      );
      setIsPreparingPortfolioPeers(true);
      const failures: string[] = [];
      let refreshedRuns: Awaited<ReturnType<typeof refreshRunHistory>> | null = null;
      try {
        for (const candidate of missingCandidates) {
          const instrument =
            workspace.watchlist.find(
              (item) => item.market === candidate.market && item.symbol === candidate.symbol
            ) ??
            buildInstrumentFromSymbol(candidate.market, candidate.symbol) ?? {
              market: candidate.market,
              symbol: candidate.symbol,
              name: candidate.name,
              changePct: 0,
              price: null
            };
          const peerWorkspace = workspaceWithPortfolioPeerAuditInstrument(workspace, instrument);
          const result = await runTerminalResearch(
            quantCoreBaseUrl,
            {
              market: candidate.market,
              symbol: candidate.symbol,
              timeframe: candidate.timeframe,
              limit: peerKlineLimit,
              end: workspace.backtestEquityCurve?.at(-1)?.timestamp
            },
            peerWorkspace
          );
          if (result.source === "fallback") {
            failures.push(`${candidate.symbol}: ${result.error ?? result.statusLabel}`);
          }
        }
      } catch (error) {
        failures.push(error instanceof Error ? error.message : "Portfolio peer audit failed");
      } finally {
        const requestIsCurrent = () =>
          portfolioPeerAuditRequestIdRef.current === requestId &&
          currentResearchRunIdRef.current === sourceRunId;
        if (requestIsCurrent()) {
          refreshedRuns = await refreshRunHistory();
          if (refreshedRuns.source === "fallback") {
            failures.push(refreshedRuns.error ?? "Portfolio run history readback failed");
          }
          await refreshStrategyLibrary();
        }
        if (requestIsCurrent()) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: failures.length ? "Portfolio peer audit failed" : "Portfolio peer audits prepared",
            error: failures[0]
          }));
          portfolioPeerAuditActiveRef.current = false;
          setIsPreparingPortfolioPeers(false);
        }
      }
      return {
        history: refreshedRuns,
        error: failures[0]
      };
    }, [
      chartKlineLimit,
      portfolioPeerAuditPlan.candidates,
      quantCoreBaseUrl,
      refreshRunHistory,
      refreshStrategyLibrary,
      workspace
    ]);
  const runPortfolioBacktestDraft = useCallback(async () => {
      resetStage4PortfolioBusyState();
      setPortfolioBacktestState(initialPortfolioBacktestState);
      const request = portfolioStage4RequestCoordinatorRef.current.begin(currentResearchRunId);
      let draft = portfolioBacktestDraft;
      let peerAuditError: string | undefined;
      if (
        !draft.request &&
        draft.headline === "Portfolio backtest needs peers" &&
        portfolioPeerAuditPlan.status === "ready"
      ) {
        const peerAuditResult = await preparePortfolioPeerAudits();
        if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
        peerAuditError = peerAuditResult?.error;
        if (peerAuditResult?.history?.source === "core") {
          draft = buildPortfolioBacktestDraft(peerAuditResult.history.runs, currentResearchRunId);
        }
      }
      if (!draft.request) {
        if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
        setPortfolioBacktestState({
          source: "fallback",
          error: peerAuditError ?? draft.summary
        });
        return;
      }

      setIsRunningPortfolioBacktest(true);
      const result = await runPortfolioBacktest(quantCoreBaseUrl, draft.request);
      if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
      setPortfolioBacktestState(result);
      setIsRunningPortfolioBacktest(false);
    }, [
      currentResearchRunId,
      portfolioBacktestDraft,
      portfolioPeerAuditPlan.status,
      preparePortfolioPeerAudits,
      quantCoreBaseUrl,
      resetStage4PortfolioBusyState
    ]);
  const recordPortfolioPaperOrders = useCallback(async () => {
      const portfolio = portfolioBacktestState.portfolio;
      const baseRunId = currentResearchRunId;
      resetStage4PortfolioBusyState();
      const request = portfolioStage4RequestCoordinatorRef.current.begin(baseRunId);
      const orders = portfolio?.paperOrderEvents ?? [];
      if (!portfolio || !baseRunId || !orders.length) {
        if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Portfolio paper order record failed",
          error: "Run a portfolio backtest with paper order events before recording orders"
        }));
        return;
      }

      setIsRecordingPortfolioPaperOrders(true);
      const result = await recordPortfolioPaperOrderBatch(quantCoreBaseUrl, {
        baseRunId,
        portfolioName: portfolio.name,
        orders
      });
      if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
      setIsRecordingPortfolioPaperOrders(false);

      const recordedBatch = result.batch;
      if (recordedBatch) {
        setPortfolioPaperOrderBatches((current) => [
          recordedBatch,
          ...current.filter((batch) => batch.batchId !== recordedBatch.batchId)
        ]);
        if (result.lifecycle?.length) {
          setPortfolioPaperOrderLifecycleEvents((current) =>
            mergePortfolioPaperOrderLifecycleEvents(current, recordedBatch.batchId, result.lifecycle ?? [])
          );
        }
        const stateHistoryResult = await loadPortfolioPaperOrderStateHistory(
          quantCoreBaseUrl,
          recordedBatch.baseRunId,
          recordedBatch.batchId
        );
        if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
        const history = stateHistoryResult.stateHistory;
        if (history) {
          setPortfolioPaperOrderStateHistories((current) =>
            mergePortfolioPaperOrderStateHistories(current, history)
          );
        }
        setPortfolioPaperOrderHistoryError(stateHistoryResult.error ?? null);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: result.auditEvent
            ? `Portfolio paper orders recorded · ${result.auditEvent.eventId}`
            : "Portfolio paper orders recorded",
          error: undefined
        }));
        return;
      }

      setPortfolioPaperOrderHistoryError(result.error ?? "Portfolio paper order record failed");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Portfolio paper order record failed",
        error: result.error ?? "Portfolio paper order record failed"
      }));
    }, [currentResearchRunId, portfolioBacktestState.portfolio, resetStage4PortfolioBusyState]);
  const reviewPortfolioPaperOrder = useCallback(async (row: PortfolioPaperOrderApprovalRow, approved: boolean) => {
      if (row.baseRunId !== currentResearchRunId) return;
      resetStage4PortfolioBusyState();
      const request = portfolioStage4RequestCoordinatorRef.current.begin(row.baseRunId);
      setApprovingPortfolioPaperOrderId(row.id);
      const result = await recordPortfolioPaperOrderApproval(quantCoreBaseUrl, {
        baseRunId: row.baseRunId,
        batchId: row.batchId,
        orderId: row.orderId,
        approved,
        reviewer: "local-operator",
        reviewedAt: new Date().toISOString(),
        reason: approved
          ? "Operator approved this paper-only portfolio order for simulation."
          : "Operator rejected this paper-only portfolio order before simulation."
      });
      if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
      setApprovingPortfolioPaperOrderId(null);

      if (result.approval) {
        if (result.lifecycle?.length) {
          setPortfolioPaperOrderLifecycleEvents((current) =>
            mergePortfolioPaperOrderLifecycleEvents(current, row.batchId, result.lifecycle ?? [])
          );
        }
        const [stateHistoryResult, replayResult] = await Promise.all([
          loadPortfolioPaperOrderStateHistory(quantCoreBaseUrl, row.baseRunId, row.batchId),
          loadPortfolioPaperOrderReplay(quantCoreBaseUrl, row.baseRunId)
        ]);
        if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
        const history = stateHistoryResult.stateHistory;
        if (history) {
          setPortfolioPaperOrderStateHistories((current) =>
            mergePortfolioPaperOrderStateHistories(current, history)
          );
        }
        setPortfolioPaperOrderReplay(replayResult.replay ?? null);
        setPortfolioPaperOrderHistoryError(stateHistoryResult.error ?? replayResult.error ?? null);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: approved
            ? `Portfolio paper order approved · ${row.orderId}`
            : `Portfolio paper order rejected · ${row.orderId}`,
          error: undefined
        }));
        return;
      }

      const approvalError = buildPortfolioPaperOrderApprovalLockedLedgerMessage(result);
      setPortfolioPaperOrderHistoryError(approvalError);
      if (portfolioPaperOrderApprovalResultCarriesLockedLedgerState(result)) {
        setPortfolioPaperOrderLifecycleEvents((current) =>
          mergePortfolioPaperOrderLifecycleEvents(current, row.batchId, result.lifecycle ?? [])
        );
      }
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Portfolio paper order approval failed",
        error: approvalError
      }));
    }, [currentResearchRunId, quantCoreBaseUrl, resetStage4PortfolioBusyState]);
  const approvePortfolioPaperOrder = useCallback(
      (row: PortfolioPaperOrderApprovalRow) => reviewPortfolioPaperOrder(row, true),
      [reviewPortfolioPaperOrder]
    );
  const rejectPortfolioPaperOrder = useCallback(
      (row: PortfolioPaperOrderApprovalRow) => reviewPortfolioPaperOrder(row, false),
      [reviewPortfolioPaperOrder]
    );
  const updatePortfolioRouteRiskTemplate = useCallback(
      (field: keyof PortfolioPaperOrderRouteRiskTemplate, value: number) => {
        setPortfolioRouteRiskTemplate((current) => ({
          ...current,
          [field]: value
        }));
      },
      []
    );
  const simulatePortfolioPaperOrder = useCallback(async (row: PortfolioPaperOrderApprovalRow) => {
      if (row.baseRunId !== currentResearchRunId) return;
      resetStage4PortfolioBusyState();
      const request = portfolioStage4RequestCoordinatorRef.current.begin(row.baseRunId);
      setSimulatingPortfolioPaperOrderId(row.id);
      const routeRow = portfolioPaperOrderSimulationRouteRows.find(
        (candidate) => candidate.batchId === row.batchId && candidate.orderId === row.orderId
      );
      const result = await recordPortfolioPaperOrderSimulation(quantCoreBaseUrl, {
        baseRunId: row.baseRunId,
        batchId: row.batchId,
        orderId: row.orderId,
        simulatedAt: new Date().toISOString(),
        routeRisk: portfolioPaperOrderRouteRiskRequest,
        adapterPaperExecutionId: routeRow?.adapterPaperExecutionId ?? undefined,
        adapterManifestValidationId: routeRow?.adapterManifestValidationId ?? undefined,
        adapterPaperExecutionEvidence: routeRow?.adapterPaperExecutionId
          ? {
              adapterPaperExecutionId: routeRow.adapterPaperExecutionId,
              adapterManifestValidationId: routeRow.adapterManifestValidationId,
              evidenceLabel: routeRow.adapterPaperExecutionEvidenceLabel,
              paperFillRecorded: true,
              liveOrderSubmitted: false,
              routeExecuted: false
            }
          : undefined
      });
      if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
      setSimulatingPortfolioPaperOrderId(null);

      if (result.simulation) {
        if (result.simulations?.length) {
          setPortfolioPaperOrderSimulations((current) =>
            mergePortfolioPaperOrderSimulations(current, row.batchId, result.simulations)
          );
        }
        if (result.lifecycle?.length) {
          setPortfolioPaperOrderLifecycleEvents((current) =>
            mergePortfolioPaperOrderLifecycleEvents(current, row.batchId, result.lifecycle ?? [])
          );
        }
        const [stateHistoryResult, replayResult] = await Promise.all([
          loadPortfolioPaperOrderStateHistory(quantCoreBaseUrl, row.baseRunId, row.batchId),
          loadPortfolioPaperOrderReplay(quantCoreBaseUrl, row.baseRunId)
        ]);
        if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
        const history = stateHistoryResult.stateHistory;
        if (history) {
          setPortfolioPaperOrderStateHistories((current) =>
            mergePortfolioPaperOrderStateHistories(current, history)
          );
        }
        setPortfolioPaperOrderReplay(replayResult.replay ?? null);
        setPortfolioPaperOrderHistoryError(stateHistoryResult.error ?? replayResult.error ?? null);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Portfolio paper order simulated · ${row.orderId}`,
          error: undefined
        }));
        return;
      }

      setPortfolioPaperOrderHistoryError(result.error ?? "Portfolio paper order simulation failed");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Portfolio paper order simulation failed",
        error: result.error ?? "Portfolio paper order simulation failed"
      }));
    }, [
      currentResearchRunId,
      portfolioPaperOrderRouteRiskRequest,
      portfolioPaperOrderSimulationRouteRows,
      quantCoreBaseUrl,
      resetStage4PortfolioBusyState
    ]);
  const recordPortfolioStage4Workflow = useCallback(async () => {
      const workflowDraft = portfolioBacktestDraft.request;
      const batch = portfolioStage4LatestBatch;
      if (!workflowDraft || !currentResearchRunId || !batch) return;
      resetStage4PortfolioBusyState();
      const request = portfolioStage4RequestCoordinatorRef.current.begin(currentResearchRunId);
      setIsRecordingPortfolioStage4Workflow(true);
      const result = await recordStage4PortfolioWorkflow(quantCoreBaseUrl, {
        baseRunId: currentResearchRunId,
        name: workflowDraft.name,
        initialCash: workflowDraft.initialCash,
        legs: workflowDraft.legs,
        riskTemplate: {
          minCashAfter: portfolioPaperOrderRouteRiskRequest.minCashAfter,
          maxSymbolNotional: portfolioPaperOrderRouteRiskRequest.maxSymbolNotional,
          maxBatchNotional: portfolioPaperOrderRouteRiskRequest.maxBatchNotional
        },
        batchId: batch.batchId,
        operator: "local-operator"
      });
      if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
      setIsRecordingPortfolioStage4Workflow(false);
      const workflow = result.workflow;
      if (workflow) {
        setPortfolioStage4Workflows((current) => [
          workflow,
          ...current.filter((currentWorkflow) => currentWorkflow.workflowId !== workflow.workflowId)
        ]);
        setPortfolioPaperOrderHistoryError(null);
        return;
      }
      setPortfolioPaperOrderHistoryError(result.error ?? "Stage 4 portfolio workflow record failed");
    }, [
      currentResearchRunId,
      portfolioBacktestDraft.request,
      portfolioPaperOrderRouteRiskRequest,
      portfolioStage4LatestBatch,
      quantCoreBaseUrl,
      resetStage4PortfolioBusyState
    ]);
  const runPortfolioRiskAssessment = useCallback(async (
      assessmentRequest: PortfolioRiskAssessmentRequest
    ) => {
      if (isRunningPortfolioRiskAssessment) return;
      setIsRunningPortfolioRiskAssessment(true);
      setPortfolioRiskAssessmentError(null);
      const result = await createPortfolioRiskAssessment(quantCoreBaseUrl, assessmentRequest);
      setIsRunningPortfolioRiskAssessment(false);
      if (result.assessment) {
        setPortfolioRiskAssessments((current) => [
          result.assessment!,
          ...current.filter((assessment) => assessment.assessmentId !== result.assessment!.assessmentId)
        ]);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `M5 组合风险评估已记录 · ${result.assessment!.assessmentId}`,
          error: undefined
        }));
        return;
      }
      const message = result.error ?? "M5 组合风险评估失败";
      setPortfolioRiskAssessmentError(message);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "M5 组合风险评估失败",
        error: message
      }));
    }, [isRunningPortfolioRiskAssessment, quantCoreBaseUrl]);
  const updatePortfolioPaperOrderAuditQuery = useCallback((query: string) => {
      setPortfolioPaperOrderAuditQuery(query);
      setPortfolioPaperOrderAuditOffset(0);
      replaceAuditEvidenceReportQueryUrlParam(query);
    }, []);
  const previousPortfolioPaperOrderAuditPage = useCallback(() => {
      setPortfolioPaperOrderAuditOffset((current) =>
        Math.max(0, current - PORTFOLIO_PAPER_ORDER_AUDIT_EVENTS_PAGE_SIZE)
      );
    }, []);
  return {
    portfolioBacktestState, setPortfolioBacktestState, portfolioPaperOrderBatches, setPortfolioPaperOrderBatches, portfolioPaperOrderLifecycleEvents, setPortfolioPaperOrderLifecycleEvents,
    portfolioPaperOrderSimulations, setPortfolioPaperOrderSimulations, portfolioPaperOrderReplay, setPortfolioPaperOrderReplay, portfolioRouteRiskTemplate, setPortfolioRouteRiskTemplate,
    portfolioPaperOrderStateHistories, setPortfolioPaperOrderStateHistories, portfolioPaperOrderHistoryError, setPortfolioPaperOrderHistoryError, portfolioStage4Workflows, setPortfolioStage4Workflows,
    portfolioRiskAssessments, setPortfolioRiskAssessments, portfolioRiskAssessmentError, setPortfolioRiskAssessmentError, isRunningPortfolioRiskAssessment, setIsRunningPortfolioRiskAssessment,
    autoTradingSnapshot, setAutoTradingSnapshot, portfolioProductionRiskError, setPortfolioProductionRiskError, isLoadingPortfolioProductionRisk, setIsLoadingPortfolioProductionRisk,
    portfolioStage4RefreshGeneration, setPortfolioStage4RefreshGeneration, isRunningPortfolioBacktest, setIsRunningPortfolioBacktest, isRecordingPortfolioPaperOrders, setIsRecordingPortfolioPaperOrders,
    approvingPortfolioPaperOrderId, setApprovingPortfolioPaperOrderId, simulatingPortfolioPaperOrderId, setSimulatingPortfolioPaperOrderId, isSimulatingPortfolioPaperOrderBatch, setIsSimulatingPortfolioPaperOrderBatch,
    isRecordingPortfolioStage4Workflow, setIsRecordingPortfolioStage4Workflow, isPreparingPortfolioPeers, setIsPreparingPortfolioPeers, portfolioPaperOrderAuditEvents, setPortfolioPaperOrderAuditEvents,
    portfolioPaperOrderAuditPagination, setPortfolioPaperOrderAuditPagination, portfolioPaperOrderAuditQuery, setPortfolioPaperOrderAuditQuery, portfolioPaperOrderAuditOffset, setPortfolioPaperOrderAuditOffset,
    isLoadingPortfolioPaperOrderAudit, setIsLoadingPortfolioPaperOrderAudit, portfolioProductionRiskRequestIdRef, portfolioPaperOrderAuditRequestIdRef, portfolioStage4RequestCoordinatorRef, portfolioPeerAuditRequestIdRef,
    portfolioPeerAuditActiveRef, resetStage4PortfolioBusyState, portfolioRiskRows, portfolioBacktestDiagnosticRows, portfolioBacktestDraft, portfolioBacktestDraftKey,
    portfolioPeerAuditPlan, portfolioPaperOrderLifecycleRows, portfolioPaperOrderApprovalRows, portfolioPaperOrderReplaySummaryTiles, portfolioPaperOrderReplayPositionRows, portfolioPaperOrderLatestSimulationSummary,
    portfolioPaperOrderStateHistoryRows, portfolioPaperOrderSimulationRouteRows, portfolioPaperOpsQueue, portfolioPaperOrderRouteRiskRequest, portfolioStage4LatestBatch, portfolioStage4Workflow,
    portfolioRiskAssessment, portfolioStage4GoldenPath, portfolioPaperOrderAuditRows, refreshPortfolioProductionRisk, refreshPortfolioPaperOrderAuditEvents, preparePortfolioPeerAudits,
    runPortfolioBacktestDraft, recordPortfolioPaperOrders, reviewPortfolioPaperOrder, approvePortfolioPaperOrder, rejectPortfolioPaperOrder, updatePortfolioRouteRiskTemplate,
    simulatePortfolioPaperOrder, recordPortfolioStage4Workflow, runPortfolioRiskAssessment, updatePortfolioPaperOrderAuditQuery, previousPortfolioPaperOrderAuditPage,
    updateAutoTradingSnapshot
  };
}
