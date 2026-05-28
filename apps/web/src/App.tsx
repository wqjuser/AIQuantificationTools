import {
  Activity,
  BarChart3,
  BrainCircuit,
  Cable,
  Database,
  Download,
  GitBranch,
  Languages,
  Maximize2,
  Play,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Timer,
  Upload,
  WalletCards,
  X
} from "lucide-react";
import { ActionType, dispose, init, LoadDataType, type Chart, type KLineData } from "klinecharts";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  buildLoadingMarketKlinesResult,
  importResearchRunExport,
  loadMarketKlines,
  loadMarketSearch,
  loadResearchRunDetail,
  loadResearchRunExport,
  loadResearchRunHistory,
  loadTerminalWorkspace,
  marketKlinesFromResearchRunAudit,
  mergeMarketKlines,
  MarketKlinesResult,
  MarketSearchSuggestion,
  PaperExecutionRecord,
  resolveQuantCoreBaseUrl,
  runTerminalResearch,
  ResearchRunExportPackage,
  ResearchRunHistoryResult,
  submitResearchRunPaperExecution,
  WorkspaceLoadResult
} from "./lib/terminal-api";
import { createI18n, Locale, resolveInitialLocale, supportedLocales } from "./lib/i18n";
import {
  buildTerminalWorkspace,
  buildAgentCommitteeRounds,
  buildAiEvidenceCards,
  buildAuditReplayWorkflowState,
  buildBacktestAssumptionRows,
  buildBacktestTradeRows,
  buildBrokerAdapterRows,
  buildModuleNewsEvents,
  buildPaperPositionRows,
  buildPaperTradingRows,
  buildPortfolioRiskRows,
  buildQuantLoopNavigationTarget,
  buildResearchRunComparisonRows,
  buildScannerCandidates,
  buildStrategyRuleRows,
  buildWorkflowStages,
  buildInstrumentFromSymbol,
  formatInstrumentPrice,
  AiWorkbenchAction,
  AiEvidenceCard,
  Market,
  AgentCommitteeRound,
  BacktestAssumptionField,
  BacktestAssumptionRow,
  BacktestTradeRow,
  BrokerAdapterRow,
  ModuleNewsEvent,
  PaperPositionRow,
  PaperTradingRow,
  PortfolioRiskRow,
  ResearchRunAudit,
  ResearchRunComparisonRow,
  ScannerCandidate,
  StrategyRuleRow,
  StrategyField,
  Timeframe,
  TerminalModule,
  TerminalWorkspace,
  WorkflowRunLogEntry,
  WorkflowRunState,
  WorkflowStageView,
  workspaceFromResearchRunAudit,
  workspaceWithAiAction,
  workspaceWithBacktestAssumption,
  workspaceWithPreservedInteractiveState,
  workspaceWithStrategyField,
  workspaceWithSelectedTimeframe,
  workspaceWithSelectedInstrument
} from "./lib/terminal-workbench";

const quantCoreBaseUrl = resolveQuantCoreBaseUrl({
  VITE_QUANT_API_BASE: import.meta.env.VITE_QUANT_API_BASE
});
const initialWorkspaceState: WorkspaceLoadResult = {
  workspace: buildTerminalWorkspace(),
  source: "fallback",
  statusLabel: "Offline snapshot"
};
const initialRunHistoryState: ResearchRunHistoryResult = {
  runs: [],
  source: "fallback"
};
const initialKlinesState: MarketKlinesResult = {
  market: "ashare",
  symbol: "600000",
  timeframe: "1d",
  bars: [],
  quality: {
    source: "loading",
    isComplete: false,
    warnings: [],
    rows: 0
  },
  source: "fallback"
};

const timeframeOptions: Timeframe[] = ["1d", "1m", "5m", "15m", "30m", "60m"];
const chartKlineLimit = 500;
const chartRightBoundaryDistance = 0;
const workflowStepDelayMs = 180;

const moduleIcons: Record<TerminalModule["accent"], typeof BarChart3> = {
  market: Radar,
  strategy: GitBranch,
  ai: BrainCircuit,
  execution: WalletCards
};

function createWorkflowRunState(): WorkflowRunState {
  return {
    activeStageId: "data",
    completedStageIds: [],
    log: []
  };
}

function createWorkflowLogEntry(
  runId: number,
  index: number,
  stageId: string,
  level: WorkflowRunLogEntry["level"],
  message: string
): WorkflowRunLogEntry {
  return {
    id: `workflow-${runId}-${index}-${stageId}`,
    stageId,
    level,
    message
  };
}

function waitForWorkflowStep() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, workflowStepDelayMs));
}

export function App() {
  const [{ workspace, source, statusLabel, error }, setWorkspaceState] = useState(initialWorkspaceState);
  const [{ runs: runHistory }, setRunHistoryState] = useState(initialRunHistoryState);
  const [klinesState, setKlinesState] = useState(initialKlinesState);
  const [locale, setLocale] = useState<Locale>(() =>
    resolveInitialLocale(typeof window === "undefined" ? null : window.localStorage.getItem("aiqt.locale"))
  );
  const [activeLoopStepId, setActiveLoopStepId] = useState(workspace.quantLoop[0]?.id ?? "idea");
  const [activeModuleId, setActiveModuleId] = useState(workspace.modules[0]?.id ?? "watchlist");
  const [activeWorkflowStageId, setActiveWorkflowStageId] = useState(workspace.workflowNodes[0]?.id ?? "data");
  const [workflowRunState, setWorkflowRunState] = useState<WorkflowRunState>(() => createWorkflowRunState());
  const [marketDraft, setMarketDraft] = useState<Market>(workspace.selectedInstrument.market);
  const [symbolDraft, setSymbolDraft] = useState(workspace.selectedInstrument.symbol);
  const [searchSuggestions, setSearchSuggestions] = useState<MarketSearchSuggestion[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isSymbolSearching, setIsSymbolSearching] = useState(false);
  const [isSubmittingPaperExecution, setIsSubmittingPaperExecution] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [paperExecutionRecord, setPaperExecutionRecord] = useState<PaperExecutionRecord | null>(null);
  const manualSelectionVersionRef = useRef(0);
  const chartRequestIdRef = useRef(0);
  const workflowRunIdRef = useRef(0);
  const klinesStateRef = useRef(initialKlinesState);
  const historicalKlineRequestRef = useRef<string | null>(null);
  const symbolSearchRequestIdRef = useRef(0);
  const skipNextSymbolSearchRef = useRef(false);
  const i18n = createI18n(locale);
  const activeLoopStep = workspace.quantLoop.find((step) => step.id === activeLoopStepId) ?? workspace.quantLoop[0];
  const activeModule = workspace.modules.find((module) => module.id === activeModuleId) ?? workspace.modules[0];
  const latestChartBar = klinesState.bars.at(-1);
  const agentCommitteeRounds = buildAgentCommitteeRounds(workspace);
  const aiEvidenceCards = buildAiEvidenceCards(workspace);
  const scannerCandidates = buildScannerCandidates(workspace);
  const portfolioRiskRows = buildPortfolioRiskRows(workspace);
  const paperPositionRows = buildPaperPositionRows(workspace);
  const paperTradingRows = buildPaperTradingRows(workspace);
  const persistedPaperTradingRows =
    paperExecutionRecord?.runId && paperExecutionRecord.runId === workspace.researchRun?.runId
      ? paperTradingRowsFromExecutionRecord(paperExecutionRecord)
      : null;
  const visiblePaperTradingRows = persistedPaperTradingRows ?? paperTradingRows;
  const strategyRuleRows = buildStrategyRuleRows(workspace);
  const backtestAssumptionRows = buildBacktestAssumptionRows(workspace);
  const backtestTradeRows = buildBacktestTradeRows(workspace);
  const brokerAdapterRows = buildBrokerAdapterRows(workspace);
  const moduleNewsEvents = buildModuleNewsEvents(workspace);
  const workflowStages = buildWorkflowStages(workspace, workflowRunState);
  const activeWorkflowStage = workflowStages.find((stage) => stage.id === activeWorkflowStageId) ?? workflowStages[0];
  const runComparisonRows = buildResearchRunComparisonRows(runHistory);

  useEffect(() => {
    klinesStateRef.current = klinesState;
  }, [klinesState]);

  const refreshRunHistory = useCallback(async () => {
    setRunHistoryState(await loadResearchRunHistory(quantCoreBaseUrl, 5));
  }, []);

  const refreshWorkspace = useCallback(async () => {
    const startedSelectionVersion = manualSelectionVersionRef.current;
    setIsRefreshing(true);
    const result = await loadTerminalWorkspace(quantCoreBaseUrl);
    setWorkspaceState((current) => {
      if (manualSelectionVersionRef.current === startedSelectionVersion) {
        return result;
      }
      return {
        ...result,
        workspace: workspaceWithPreservedInteractiveState(result.workspace, current.workspace),
        statusLabel: current.statusLabel
      };
    });
    await refreshRunHistory();
    setIsRefreshing(false);
  }, [refreshRunHistory]);

  const refreshChart = useCallback(async () => {
    const requestId = chartRequestIdRef.current + 1;
    chartRequestIdRef.current = requestId;
    const params = {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe
    };
    setIsChartLoading(true);
    setKlinesState(buildLoadingMarketKlinesResult(params));
    const result = await loadMarketKlines(quantCoreBaseUrl, { ...params, limit: chartKlineLimit });
    if (chartRequestIdRef.current === requestId) {
      setKlinesState(result);
      setIsChartLoading(false);
    }
  }, [workspace.selectedInstrument.market, workspace.selectedInstrument.symbol, workspace.selectedTimeframe]);

  const loadHistoricalKlines = useCallback(async (beforeTimestampMs: number): Promise<MarketKlinesResult["bars"]> => {
    const current = klinesStateRef.current;
    const earliestTimestampMs = current.bars[0]?.timestampMs;
    if (!Number.isFinite(beforeTimestampMs) || !earliestTimestampMs) {
      return [];
    }

    const endMs = Math.min(beforeTimestampMs, earliestTimestampMs) - 1;
    const requestKey = `${current.market}:${current.symbol}:${current.timeframe}:${endMs}`;
    if (historicalKlineRequestRef.current === requestKey) {
      return [];
    }

    historicalKlineRequestRef.current = requestKey;
    try {
      const result = await loadMarketKlines(quantCoreBaseUrl, {
        market: current.market,
        symbol: current.symbol,
        timeframe: current.timeframe,
        limit: chartKlineLimit,
        end: new Date(endMs).toISOString()
      });
      const olderBars = result.bars.filter((bar) => bar.timestampMs < earliestTimestampMs);
      if (olderBars.length) {
        setKlinesState((existing) =>
          existing.market === result.market &&
          existing.symbol === result.symbol &&
          existing.timeframe === result.timeframe
            ? mergeMarketKlines(existing, result)
            : existing
        );
      }
      return olderBars;
    } finally {
      if (historicalKlineRequestRef.current === requestKey) {
        historicalKlineRequestRef.current = null;
      }
    }
  }, []);

  const runPipeline = useCallback(async () => {
    const runId = workflowRunIdRef.current + 1;
    workflowRunIdRef.current = runId;
    let log: WorkflowRunLogEntry[] = [];
    const selectedContext = `${workspace.selectedInstrument.symbol} · ${workspace.selectedTimeframe}`;
    const publishStage = (
      activeStageId: string,
      completedStageIds: string[],
      failedStageId: string | null = null
    ) => {
      if (workflowRunIdRef.current !== runId) {
        return;
      }
      setActiveWorkflowStageId(activeStageId);
      setWorkflowRunState({
        activeStageId,
        completedStageIds,
        failedStageId,
        log
      });
    };
    const appendLog = (stageId: string, level: WorkflowRunLogEntry["level"], message: string) => {
      log = [...log, createWorkflowLogEntry(runId, log.length + 1, stageId, level, message)];
    };

    setActiveModuleId("workflow");
    setIsRunning(true);
    setPaperExecutionRecord(null);
    appendLog("data", "info", `Data snapshot prepared for ${selectedContext}`);
    publishStage("data", []);
    await waitForWorkflowStep();
    if (workflowRunIdRef.current !== runId) {
      return;
    }
    appendLog("factor", "success", "Factor set staged: SMA / RSI / volume");
    publishStage("factor", ["data"]);
    await waitForWorkflowStep();
    if (workflowRunIdRef.current !== runId) {
      return;
    }
    appendLog("backtest", "info", "Backtest request sent to local core");
    publishStage("backtest", ["data", "factor"]);

    const result = await runTerminalResearch(
      quantCoreBaseUrl,
      {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe,
        limit: chartKlineLimit
      },
      workspace
    );
    if (workflowRunIdRef.current !== runId) {
      return;
    }
    setWorkspaceState(result);

    if (result.source === "fallback") {
      appendLog("backtest", "error", `Pipeline failed before audited backtest: ${result.error ?? result.statusLabel}`);
      publishStage("backtest", ["data", "factor"], "backtest");
      await refreshRunHistory();
      setIsRunning(false);
      return;
    }

    const researchSummary = result.workspace.researchRun;
    appendLog(
      "backtest",
      "success",
      researchSummary
        ? `Audited backtest received: ${researchSummary.dataRows} bars · ${researchSummary.executionMode}`
        : "Audited backtest received"
    );
    publishStage("agent", ["data", "factor", "backtest"]);
    await waitForWorkflowStep();
    if (workflowRunIdRef.current !== runId) {
      return;
    }
    appendLog("agent", "success", "Agent committee report received");
    appendLog("execution", "warning", "Live execution remains blocked; paper review is ready");
    publishStage("execution", ["data", "factor", "backtest", "agent"]);
    await refreshRunHistory();
    setIsRunning(false);
  }, [refreshRunHistory, workspace]);

  const replayRun = useCallback(
    async (run: ResearchRunAudit) => {
      const replayVersion = manualSelectionVersionRef.current + 1;
      manualSelectionVersionRef.current = replayVersion;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      const detail = await loadResearchRunDetail(quantCoreBaseUrl, run.runId);
      if (manualSelectionVersionRef.current !== replayVersion) {
        return;
      }
      const auditedRun = detail.run ?? run;
      const auditedKlines = marketKlinesFromResearchRunAudit(auditedRun);
      setWorkspaceState((current) => ({
        workspace: workspaceFromResearchRunAudit(current.workspace, auditedRun),
        source: "core",
        statusLabel: detail.source === "core" ? "Audit detail loaded" : "Audit replay loaded"
      }));
      if (auditedKlines) {
        setKlinesState(auditedKlines);
      }
      setActiveModuleId("workflow");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkflowRunState(buildAuditReplayWorkflowState(auditedRun));
    },
    []
  );

  const exportRun = useCallback(async (run: ResearchRunAudit) => {
    const result = await loadResearchRunExport(quantCoreBaseUrl, run.runId);
    if (result.source === "fallback" || !result.exportPackage) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research run export failed",
        error: result.error ?? "Research run export failed"
      }));
      return;
    }

    const fileName = `${run.runId}-research-export.json`;
    const objectUrl = URL.createObjectURL(
      new Blob([JSON.stringify(result.exportPackage, null, 2)], { type: "application/json;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Research run export ready",
      error: undefined
    }));
  }, []);

  const importRunExportFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      input.value = "";
      if (!file) {
        return;
      }

      const importVersion = manualSelectionVersionRef.current + 1;
      manualSelectionVersionRef.current = importVersion;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);

      try {
        const parsed = JSON.parse(await file.text()) as ResearchRunExportPackage | { export?: ResearchRunExportPackage };
        const exportPackage = "export" in parsed && parsed.export ? parsed.export : parsed;
        const result = await importResearchRunExport(quantCoreBaseUrl, exportPackage as ResearchRunExportPackage);
        if (manualSelectionVersionRef.current !== importVersion) {
          return;
        }
        if (result.source === "fallback" || !result.run) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Research run import failed",
            error: result.error ?? "Research run import failed"
          }));
          return;
        }
        const importedKlines = marketKlinesFromResearchRunAudit(result.run);
        setWorkspaceState((current) => ({
          workspace: workspaceFromResearchRunAudit(current.workspace, result.run as ResearchRunAudit),
          source: "core",
          statusLabel: "Research run import ready",
          error: undefined
        }));
        if (importedKlines) {
          setKlinesState(importedKlines);
        }
        setActiveModuleId("workflow");
        setActiveLoopStepId("backtest");
        setActiveWorkflowStageId("execution");
        setWorkflowRunState(buildAuditReplayWorkflowState(result.run));
        await refreshRunHistory();
      } catch (importError) {
        if (manualSelectionVersionRef.current !== importVersion) {
          return;
        }
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research run import failed",
          error: importError instanceof Error ? importError.message : "Research run import failed"
        }));
      }
    },
    [refreshRunHistory]
  );

  const selectInstrument = useCallback(
    (instrument: TerminalWorkspace["selectedInstrument"]) => {
      manualSelectionVersionRef.current += 1;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setWorkspaceState((current) => ({
        workspace: workspaceWithSelectedInstrument(current.workspace, instrument),
        source: "core",
        statusLabel: "Instrument selected"
      }));
      setActiveWorkflowStageId("data");
      setWorkflowRunState(createWorkflowRunState());
    },
    []
  );

  const selectTimeframe = useCallback(
    (timeframe: Timeframe) => {
      manualSelectionVersionRef.current += 1;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setWorkspaceState((current) => ({
        workspace: workspaceWithSelectedTimeframe(current.workspace, timeframe),
        source: "core",
        statusLabel: "Timeframe selected"
      }));
      setActiveWorkflowStageId("data");
      setWorkflowRunState(createWorkflowRunState());
    },
    []
  );

  const runAiWorkbenchAction = useCallback((action: AiWorkbenchAction) => {
    manualSelectionVersionRef.current += 1;
    setWorkspaceState((current) => ({
      workspace: workspaceWithAiAction(current.workspace, action),
      source: "core",
      statusLabel: "AI action generated"
    }));
    setActiveModuleId(action === "strategy-draft" ? "watchlist" : "news");
  }, []);

  const updateStrategyField = useCallback((field: StrategyField, value: string) => {
    manualSelectionVersionRef.current += 1;
    setWorkspaceState((current) => ({
      workspace: workspaceWithStrategyField(current.workspace, field, value),
      source: "core",
      statusLabel: "Strategy edited"
    }));
    setActiveLoopStepId("strategy");
    setActiveModuleId("watchlist");
    setActiveWorkflowStageId("factor");
  }, []);

  const updateBacktestAssumption = useCallback((field: BacktestAssumptionField, value: number) => {
    manualSelectionVersionRef.current += 1;
    setPaperExecutionRecord(null);
    setWorkspaceState((current) => ({
      workspace: workspaceWithBacktestAssumption(current.workspace, field, value),
      source: "core",
      statusLabel: "Backtest assumptions edited"
    }));
    setActiveLoopStepId("backtest");
    setActiveModuleId("watchlist");
    setActiveWorkflowStageId("backtest");
  }, []);

  const submitPaperExecution = useCallback(async () => {
    const runId = workspace.researchRun?.runId;
    if (!runId) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Paper execution failed",
        error: "Run the pipeline before submitting a paper execution."
      }));
      return;
    }

    setIsSubmittingPaperExecution(true);
    const result = await submitResearchRunPaperExecution(quantCoreBaseUrl, runId);
    if (result.source === "fallback" || !result.execution) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Paper execution failed",
        error: result.error ?? "Paper execution failed"
      }));
      setIsSubmittingPaperExecution(false);
      return;
    }

    setPaperExecutionRecord(result.execution);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Paper execution recorded",
      error: undefined
    }));
    setActiveModuleId("broker");
    setActiveLoopStepId("paper");
    setActiveWorkflowStageId("execution");
    setIsSubmittingPaperExecution(false);
  }, [workspace.researchRun?.runId]);

  const selectQuantLoopStep = useCallback((stepId: string) => {
    const target = buildQuantLoopNavigationTarget(stepId);
    setActiveLoopStepId(stepId);
    setActiveModuleId(target.moduleId);
    setActiveWorkflowStageId(target.workflowStageId);
  }, []);

  const submitSymbol = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const normalizedSymbol = buildInstrumentFromSymbol(marketDraft, symbolDraft)?.symbol;
      const matchedSuggestion = searchSuggestions.find(
        (suggestion) => suggestion.market === marketDraft && suggestion.symbol === normalizedSymbol
      );
      const instrument = matchedSuggestion
        ? {
            symbol: matchedSuggestion.symbol,
            name: matchedSuggestion.name,
            market: matchedSuggestion.market,
            changePct: 0
          }
        : buildInstrumentFromSymbol(marketDraft, symbolDraft);
      if (!instrument) {
        return;
      }
      selectInstrument(instrument);
      setSearchSuggestions([]);
      setIsSearchOpen(false);
      setActiveModuleId("watchlist");
    },
    [marketDraft, searchSuggestions, selectInstrument, symbolDraft]
  );

  const selectSearchSuggestion = useCallback(
    (suggestion: MarketSearchSuggestion) => {
      skipNextSymbolSearchRef.current = true;
      setMarketDraft(suggestion.market);
      setSymbolDraft(suggestion.symbol);
      setSearchSuggestions([]);
      setIsSearchOpen(false);
      selectInstrument({
        symbol: suggestion.symbol,
        name: suggestion.name,
        market: suggestion.market,
        changePct: 0
      });
      setActiveModuleId("watchlist");
    },
    [selectInstrument]
  );

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  useEffect(() => {
    void refreshChart();
  }, [refreshChart]);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("aiqt.locale", locale);
  }, [locale]);

  useEffect(() => {
    skipNextSymbolSearchRef.current = true;
    setMarketDraft(workspace.selectedInstrument.market);
    setSymbolDraft(workspace.selectedInstrument.symbol);
    setSearchSuggestions([]);
    setIsSearchOpen(false);
  }, [workspace.selectedInstrument.market, workspace.selectedInstrument.symbol]);

  useEffect(() => {
    const query = symbolDraft.trim();
    const requestId = symbolSearchRequestIdRef.current + 1;
    symbolSearchRequestIdRef.current = requestId;

    if (skipNextSymbolSearchRef.current) {
      skipNextSymbolSearchRef.current = false;
      setIsSymbolSearching(false);
      return;
    }

    if (!query) {
      setSearchSuggestions([]);
      setIsSearchOpen(false);
      setIsSymbolSearching(false);
      return;
    }

    setIsSymbolSearching(true);
    setIsSearchOpen(true);
    const timeoutId = window.setTimeout(async () => {
      const result = await loadMarketSearch(quantCoreBaseUrl, { market: marketDraft, query, limit: 8 });
      if (symbolSearchRequestIdRef.current === requestId) {
        setSearchSuggestions(result.results);
        setIsSearchOpen(true);
        setIsSymbolSearching(false);
      }
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [marketDraft, symbolDraft]);

  useEffect(() => {
    if (!isChartExpanded) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsChartExpanded(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isChartExpanded]);

  return (
    <div className="terminal-shell">
      <aside className="left-rail">
        <div className="brand">
          <span className="brand-mark">AQ</span>
          <div>
            <strong>AIQuant Terminal</strong>
            <span>{i18n.t("brand.subtitle")}</span>
          </div>
        </div>

        <section className="rail-section">
          <p className="section-label">{i18n.t("section.quantLoop")}</p>
          <nav className="loop-nav">
            {workspace.quantLoop.map((step, index) => (
              <button
                className={`loop-step ${step.status} ${activeLoopStepId === step.id ? "selected" : ""}`}
                key={step.id}
                onClick={() => selectQuantLoopStep(step.id)}
                type="button"
              >
                <span>{index + 1}</span>
                {i18n.quantLoopLabel(step.id, step.label)}
              </button>
            ))}
          </nav>
        </section>

        <section className="rail-section">
          <p className="section-label">{i18n.t("section.terminalModules")}</p>
          <div className="module-list">
            {workspace.modules.map((module) => {
              const Icon = moduleIcons[module.accent];
              return (
                <button
                  className={`module-button ${module.accent} ${activeModuleId === module.id ? "active" : ""}`}
                  key={module.id}
                  onClick={() => setActiveModuleId(module.id)}
                  type="button"
                >
                  <Icon size={16} />
                  {i18n.moduleLabel(module.id, module.label)}
                </button>
              );
            })}
          </div>
        </section>

        <section className="workspace-card">
          <span className="section-label">{i18n.t("section.auditTrail")}</span>
          <strong>{workspace.selectedInstrument.symbol} · {workspace.selectedTimeframe}</strong>
          <p>{i18n.researchRunLabel(workspace.researchRun)}</p>
        </section>
      </aside>

      <main className="terminal-main">
        <header className="terminal-topbar">
          <div>
            <p className="section-label">{i18n.t("topbar.eyebrow")}</p>
            <h1>{workspace.selectedInstrument.name} · {workspace.selectedInstrument.symbol}</h1>
          </div>
          <div className="topbar-actions">
            <form className="symbol-switcher" onSubmit={submitSymbol} aria-label={i18n.t("aria.symbolSwitcher")}>
              <select
                aria-label={i18n.t("symbol.market")}
                onChange={(event) => setMarketDraft(event.currentTarget.value as Market)}
                value={marketDraft}
              >
                {(["ashare", "us", "crypto"] as Market[]).map((market) => (
                  <option key={market} value={market}>
                    {i18n.marketLabel(market)}
                  </option>
                ))}
              </select>
              <div className="symbol-field">
                <input
                  aria-label={i18n.t("symbol.placeholder")}
                  autoComplete="off"
                  onChange={(event) => {
                    setSymbolDraft(event.currentTarget.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (symbolDraft.trim()) {
                      setIsSearchOpen(true);
                    }
                  }}
                  placeholder={i18n.t("symbol.placeholder")}
                  value={symbolDraft}
                />
                {isSearchOpen && symbolDraft.trim() ? (
                  <div className="symbol-suggestions" role="listbox">
                    {isSymbolSearching ? (
                      <span className="symbol-suggestion-state">{i18n.t("symbol.searching")}</span>
                    ) : null}
                    {!isSymbolSearching && searchSuggestions.length
                      ? searchSuggestions.map((suggestion) => (
                          <button
                            key={`${suggestion.market}-${suggestion.symbol}-${suggestion.source}`}
                            onClick={() => selectSearchSuggestion(suggestion)}
                            role="option"
                            type="button"
                          >
                            <span>
                              <strong>{suggestion.symbol}</strong>
                              <em>{suggestion.name}</em>
                            </span>
                            <small>
                              {i18n.marketLabel(suggestion.market)}
                              {suggestion.exchange ? ` · ${suggestion.exchange}` : ""}
                              {" · "}
                              {suggestion.source}
                            </small>
                          </button>
                        ))
                      : null}
                    {!isSymbolSearching && !searchSuggestions.length ? (
                      <span className="symbol-suggestion-state">{i18n.t("symbol.noResults")}</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <button type="submit">
                <Search size={15} />
                {i18n.t("action.switchSymbol")}
              </button>
            </form>
            <span className={`status-pill ${source === "core" ? "ok" : "paper"}`} title={error}>
              {i18n.statusLabel(statusLabel)}
            </span>
            <span className="status-pill paper">{i18n.executionMode(workspace.execution)}</span>
            <div className="locale-control" aria-label={i18n.t("aria.language")}>
              <Languages size={15} />
              <select
                aria-label={i18n.t("aria.language")}
                className="locale-select"
                onChange={(event) => setLocale(event.currentTarget.value as Locale)}
                value={locale}
              >
                {supportedLocales.map((candidate) => (
                  <option key={candidate} value={candidate}>
                    {i18n.localeOptionLabel(candidate)}
                  </option>
                ))}
              </select>
            </div>
            <div className="timeframe-control" aria-label={i18n.t("aria.timeframe")}>
              <Timer size={15} />
              {timeframeOptions.map((timeframe) => (
                <button
                  className={workspace.selectedTimeframe === timeframe ? "active" : ""}
                  key={timeframe}
                  onClick={() => selectTimeframe(timeframe)}
                >
                  {timeframe}
                </button>
              ))}
            </div>
            <button className="run-button" disabled={isRefreshing || isRunning} onClick={runPipeline}>
              {isRefreshing || isRunning ? <RefreshCw className="spin" size={17} /> : <Play size={17} />}
              {i18n.t("action.runPipeline")}
            </button>
          </div>
        </header>

        <section className="watchlist-strip">
          {workspace.watchlist.map((instrument) => (
            <button
              className={`ticker ${
                workspace.selectedInstrument.symbol === instrument.symbol &&
                workspace.selectedInstrument.market === instrument.market
                  ? "active"
                  : ""
              }`}
              key={`${instrument.market}-${instrument.symbol}`}
              onClick={() => selectInstrument(instrument)}
            >
              <span>{i18n.marketLabel(instrument.market)}</span>
              <strong>{instrument.symbol}</strong>
              <span className="ticker-price">{formatInstrumentPrice(instrument.price)}</span>
              <em className={instrument.changePct >= 0 ? "up" : "down"}>
                {instrument.changePct >= 0 ? "+" : ""}
                {instrument.changePct.toFixed(2)}%
              </em>
            </button>
          ))}
        </section>

        <section className={`module-focus-card ${activeModule?.accent ?? "market"}`}>
          <div>
            <span className="section-label">{i18n.t("moduleFocus.label")}</span>
            <strong>
              {i18n.moduleLabel(activeModule?.id ?? "watchlist", activeModule?.label ?? "Watchlist")} ·{" "}
              {i18n.quantLoopLabel(activeLoopStep?.id ?? "idea", activeLoopStep?.label ?? "Idea Lab")}
            </strong>
            <p>
              {i18n.moduleFocus(activeModule?.id ?? "watchlist", {
                market: i18n.marketLabel(workspace.selectedInstrument.market),
                symbol: workspace.selectedInstrument.symbol
              })}
            </p>
            <p>{i18n.quantLoopFocus(activeLoopStep?.id ?? "idea", { symbol: workspace.selectedInstrument.symbol })}</p>
          </div>
          <span className="module-focus-symbol">
            {i18n.t("moduleFocus.instrument")} · {workspace.selectedInstrument.symbol}
          </span>
        </section>

        <section className="metrics-row">
          {workspace.metrics.map((metric) => (
            <article className={`metric-card ${metric.tone}`} key={metric.label}>
              <span>{i18n.metricLabel(metric.label)}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>

        <AssistantCommandStrip i18n={i18n} onRunAiAction={runAiWorkbenchAction} workspace={workspace} />

        <section className={`center-grid ${activeModuleId === "watchlist" ? "watchlist-layout" : "module-workspace-grid"}`}>
          {activeModuleId === "watchlist" ? (
            <>
              <Panel
                title={i18n.t("panel.chart.title")}
                subtitle={i18n.t("panel.chart.subtitle", { timeframe: workspace.selectedTimeframe })}
                className="chart-panel"
                action={
                  <button
                    aria-label={i18n.t("chart.expand")}
                    className="panel-icon-button"
                    onClick={() => setIsChartExpanded(true)}
                    title={i18n.t("chart.expand")}
                    type="button"
                  >
                    <Maximize2 size={16} />
                  </button>
                }
              >
                <div className="chart-panel-body">
                  <KlineChartCanvas
                    key={`${workspace.selectedInstrument.market}-${workspace.selectedInstrument.symbol}-${workspace.selectedTimeframe}`}
                    bars={klinesState.bars}
                    locale={locale}
                    market={klinesState.market}
                    onLoadHistorical={loadHistoricalKlines}
                    symbol={klinesState.symbol}
                    timeframe={klinesState.timeframe}
                  />
                  {!klinesState.bars.length && !isChartLoading ? (
                    <div className="chart-empty">{i18n.t("chart.noData")}</div>
                  ) : null}
                  <ChartDataStrip i18n={i18n} latestChartBar={latestChartBar} state={klinesState} />
                </div>
              </Panel>

              <Panel
                title={i18n.t("panel.strategy.title")}
                subtitle={i18n.strategyText(workspace.strategy.name)}
                className="strategy-panel"
              >
                <StrategySummary
                  i18n={i18n}
                  onUpdateStrategyField={updateStrategyField}
                  rows={strategyRuleRows}
                  workspace={workspace}
                />
              </Panel>

              <BacktestReplayPanel
                assumptionRows={backtestAssumptionRows}
                className="watchlist-backtest-panel"
                i18n={i18n}
                onUpdateAssumption={updateBacktestAssumption}
                rows={backtestTradeRows}
              />

              <Panel
                title={i18n.t("panel.nodeWorkflow.title")}
                subtitle={i18n.t("panel.nodeWorkflow.subtitle")}
                className="watchlist-workflow-panel"
              >
                <CompactWorkflowNodes i18n={i18n} workspace={workspace} />
              </Panel>

              <Panel title={i18n.t("panel.agent.title")} subtitle={i18n.t("panel.agent.subtitle")} className="watchlist-ai-panel">
                <div className="agent-panel-body">
                  <AgentEvidenceBoard cards={aiEvidenceCards} i18n={i18n} />
                  <AgentCommitteeBoard i18n={i18n} rounds={agentCommitteeRounds} />
                </div>
              </Panel>

              <DecisionLogPanel className="watchlist-decision-panel" entries={workspace.decisionLog} i18n={i18n} />

              <ExecutionPanel
                i18n={i18n}
                isSubmitting={isSubmittingPaperExecution}
                onSubmit={submitPaperExecution}
                rows={visiblePaperTradingRows}
                workspace={workspace}
                className="watchlist-execution-panel"
              />

              <RunHistoryPanel
                className="watchlist-history-panel"
                i18n={i18n}
                onExport={exportRun}
                onImportFile={importRunExportFile}
                onReplay={replayRun}
                runComparisonRows={runComparisonRows}
                runHistory={runHistory}
                workspace={workspace}
              />
            </>
          ) : null}

          {activeModuleId === "scanner" ? (
            <ScannerWorkspace candidates={scannerCandidates} i18n={i18n} onSelectInstrument={selectInstrument} />
          ) : null}

          {activeModuleId === "portfolio" ? (
            <PortfolioWorkspace
              i18n={i18n}
              paperRows={visiblePaperTradingRows}
              positionRows={paperPositionRows}
              rows={portfolioRiskRows}
              workspace={workspace}
            />
          ) : null}

          {activeModuleId === "news" ? (
            <NewsWorkspace events={moduleNewsEvents} i18n={i18n} />
          ) : null}

          {activeModuleId === "broker" ? (
            <BrokerWorkspace
              adapterRows={brokerAdapterRows}
              executionRows={visiblePaperTradingRows}
              i18n={i18n}
              isSubmittingPaperExecution={isSubmittingPaperExecution}
              onSubmitPaperExecution={submitPaperExecution}
              workspace={workspace}
            />
          ) : null}

          {activeModuleId === "workflow" ? (
            <WorkflowWorkspace
              activeStage={activeWorkflowStage}
              i18n={i18n}
              isRunning={isRunning}
              onRunPipeline={runPipeline}
              onSelectStage={setActiveWorkflowStageId}
              runState={workflowRunState}
              stages={workflowStages}
            />
          ) : null}
        </section>
      </main>

      {isChartExpanded ? (
        <div className="chart-modal-backdrop" role="dialog" aria-modal="true" aria-label={i18n.t("panel.chart.title")}>
          <section className="chart-modal">
            <header>
              <div>
                <h2>{workspace.selectedInstrument.name} · {klinesState.symbol}</h2>
                <span>{workspace.selectedTimeframe} · {i18n.t("panel.chart.title")}</span>
              </div>
              <button
                aria-label={i18n.t("chart.closeExpanded")}
                className="panel-icon-button"
                onClick={() => setIsChartExpanded(false)}
                title={i18n.t("chart.closeExpanded")}
                type="button"
              >
                <X size={17} />
              </button>
            </header>
            <div className="chart-modal-body">
              <KlineChartCanvas
                key={`expanded-${klinesState.market}-${klinesState.symbol}-${klinesState.timeframe}`}
                bars={klinesState.bars}
                locale={locale}
                market={klinesState.market}
                onLoadHistorical={loadHistoricalKlines}
                symbol={klinesState.symbol}
                timeframe={klinesState.timeframe}
              />
              <div className="chart-data-strip">
                <span>{i18n.t("chart.symbol")}: {klinesState.symbol}</span>
                {latestChartBar ? <span>{i18n.t("chart.latestClose")}: {latestChartBar.close.toFixed(2)}</span> : null}
                {latestChartBar ? <span>{i18n.t("chart.asOf")}: {formatChartDate(latestChartBar.timestamp)}</span> : null}
                <span>{i18n.t("chart.source")}: {klinesState.quality.source}</span>
                <span>{i18n.t("chart.bars", { count: klinesState.bars.length })}</span>
              </div>
            </div>
          </section>
        </div>
      ) : null}

    </div>
  );
}

type AppI18n = ReturnType<typeof createI18n>;

function ChartDataStrip({
  i18n,
  latestChartBar,
  state
}: {
  i18n: AppI18n;
  latestChartBar: MarketKlinesResult["bars"][number] | undefined;
  state: MarketKlinesResult;
}) {
  return (
    <div className="chart-data-strip">
      <span>{i18n.t("chart.symbol")}: {state.symbol}</span>
      {latestChartBar ? <span>{i18n.t("chart.latestClose")}: {latestChartBar.close.toFixed(2)}</span> : null}
      {latestChartBar ? <span>{i18n.t("chart.asOf")}: {formatChartDate(latestChartBar.timestamp)}</span> : null}
      <span>{i18n.t("chart.source")}: {state.quality.source}</span>
      <span>{i18n.t("chart.bars", { count: state.bars.length })}</span>
    </div>
  );
}

function AssistantCommandStrip({
  i18n,
  onRunAiAction,
  workspace
}: {
  i18n: AppI18n;
  onRunAiAction: (action: AiWorkbenchAction) => void;
  workspace: TerminalWorkspace;
}) {
  return (
    <section className="assistant-command-strip">
      <Panel title={i18n.t("panel.agentRoles.title")} subtitle={i18n.t("panel.agentRoles.subtitle")} className="agent-panel">
        <div className="agent-grid">
          {workspace.agents.map((agent) => (
            <span className={`agent-role ${agent.stance}`} key={agent.id}>
              {i18n.agentLabel(agent.id, agent.label)}
            </span>
          ))}
        </div>
      </Panel>

      <Panel title={i18n.t("panel.aiActions.title")} subtitle={i18n.t("panel.aiActions.subtitle")}>
        <div className="ai-actions">
          <button onClick={() => onRunAiAction("debate")} type="button">
            <BrainCircuit size={15} />
            {i18n.t("aiAction.debate")}
          </button>
          <button onClick={() => onRunAiAction("explain")} type="button">
            <BarChart3 size={15} />
            {i18n.t("aiAction.explain")}
          </button>
          <button onClick={() => onRunAiAction("strategy-draft")} type="button">
            <Cable size={15} />
            {i18n.t("aiAction.strategyDraft")}
          </button>
        </div>
      </Panel>

      <footer className="safety-footer">
        <Activity size={16} />
        <span>{i18n.t("safety.footer")}</span>
      </footer>
    </section>
  );
}

function StrategySummary({
  i18n,
  onUpdateStrategyField,
  rows,
  workspace
}: {
  i18n: AppI18n;
  onUpdateStrategyField: (field: StrategyField, value: string) => void;
  rows: StrategyRuleRow[];
  workspace: TerminalWorkspace;
}) {
  return (
    <div className="strategy-workbench">
      <div className="strategy-editor">
        <label>
          <span>{i18n.t("strategy.name")}</span>
          <input
            onChange={(event) => onUpdateStrategyField("name", event.currentTarget.value)}
            value={workspace.strategy.name}
          />
        </label>
        <label>
          <span>{i18n.t("strategy.entry")}</span>
          <textarea
            onChange={(event) => onUpdateStrategyField("entry", event.currentTarget.value)}
            rows={2}
            value={workspace.strategy.entry}
          />
        </label>
        <label>
          <span>{i18n.t("strategy.exit")}</span>
          <textarea
            onChange={(event) => onUpdateStrategyField("exit", event.currentTarget.value)}
            rows={2}
            value={workspace.strategy.exit}
          />
        </label>
        <label>
          <span>{i18n.t("strategy.position")}</span>
          <input
            onChange={(event) => onUpdateStrategyField("position", event.currentTarget.value)}
            value={workspace.strategy.position}
          />
        </label>
        <label>
          <span>{i18n.t("strategy.risk")}</span>
          <textarea
            onChange={(event) => onUpdateStrategyField("risk", event.currentTarget.value)}
            rows={2}
            value={workspace.strategy.risk}
          />
        </label>
      </div>
      <div className="strategy-rule-board">
        <div className="strategy-rule-title">
          <span>{i18n.t("strategy.rules")}</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="strategy-rule-grid">
          <div className="strategy-rule-row strategy-rule-head">
            <span>{i18n.t("strategy.rules")}</span>
            <span>{i18n.t("strategy.condition")}</span>
            <span>{i18n.t("strategy.parameter")}</span>
            <span>{i18n.t("strategy.status")}</span>
          </div>
          {rows.map((row) => (
            <article className={`strategy-rule-row ${row.tone}`} key={row.id}>
              <span>
                <strong>{strategyRuleGroupLabel(i18n, row.group)}</strong>
                <em>{strategyRuleLabel(i18n, row.label)}</em>
              </span>
              <span>{i18n.strategyText(row.condition)}</span>
              <span>{strategyRuleParameterLabel(i18n, row.parameter)}</span>
              <span>{strategyRuleStatusLabel(i18n, row.status)}</span>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function BacktestReplayPanel({
  assumptionRows,
  className,
  i18n,
  onUpdateAssumption,
  rows
}: {
  assumptionRows: BacktestAssumptionRow[];
  className?: string;
  i18n: AppI18n;
  onUpdateAssumption: (field: BacktestAssumptionField, value: number) => void;
  rows: BacktestTradeRow[];
}) {
  return (
    <Panel title={i18n.t("panel.backtest.title")} subtitle={i18n.t("panel.backtest.subtitle")} className={className}>
      <div className="backtest-replay">
        <div className="backtest-assumptions">
          <div className="backtest-replay-title">
            <span>{i18n.t("backtest.assumptions")}</span>
            <strong>{assumptionRows.length}</strong>
          </div>
          <div className="backtest-assumption-grid">
            {assumptionRows.map((row) => (
              <label key={row.field}>
                <span>{backtestAssumptionLabel(i18n, row.field, row.label)}</span>
                <div className="assumption-input">
                  <input
                    min={row.min}
                    onChange={(event) => onUpdateAssumption(row.field, Number(event.currentTarget.value))}
                    step={row.step}
                    type="number"
                    value={row.value}
                  />
                  <em>{backtestAssumptionSuffixLabel(i18n, row.suffix)}</em>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="backtest-replay-title">
          <span>{i18n.t("backtest.replay")}</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="backtest-table">
          <div className="backtest-row backtest-head">
            <span>{i18n.t("backtest.time")}</span>
            <span>{i18n.t("execution.side")}</span>
            <span>{i18n.t("execution.status")}</span>
            <span>{i18n.t("execution.price")}</span>
            <span>{i18n.t("execution.quantity")}</span>
            <span>{i18n.t("backtest.exposure")}</span>
            <span>{i18n.t("backtest.pnl")}</span>
            <span>{i18n.t("execution.reason")}</span>
          </div>
          {rows.map((row) => (
            <article className={`backtest-row ${row.tone}`} key={row.id}>
              <span>{row.timestamp}</span>
              <span>{backtestSideLabel(i18n, row.side)}</span>
              <span>{backtestStatusLabel(i18n, row.status)}</span>
              <span>{row.price}</span>
              <span>{row.quantity}</span>
              <span>{backtestExposureLabel(i18n, row.exposure)}</span>
              <span>{row.pnl}</span>
              <span>{i18n.strategyText(row.reason)}</span>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function CompactWorkflowNodes({ i18n, workspace }: { i18n: AppI18n; workspace: TerminalWorkspace }) {
  return (
    <div className="node-row">
      {workspace.workflowNodes.map((node) => {
        const translated = i18n.workflowNode(node.id, node.label, node.detail);
        return (
          <article className="workflow-node" key={node.id}>
            <strong>{translated.label}</strong>
            <span>{translated.detail}</span>
          </article>
        );
      })}
    </div>
  );
}

function AgentEvidenceBoard({ cards, i18n }: { cards: AiEvidenceCard[]; i18n: AppI18n }) {
  return (
    <div className="agent-evidence">
      <div className="agent-rounds-title">
        <span>{i18n.t("panel.agent.evidence")}</span>
        <strong>{cards.length}</strong>
      </div>
      <div className="agent-evidence-grid">
        {cards.map((card) => (
          <article className={`agent-evidence-card ${card.tone}`} key={card.id}>
            <span>{agentEvidenceLabel(i18n, card)}</span>
            <strong>{agentEvidenceValue(i18n, card)}</strong>
            <p>{agentEvidenceDetail(i18n, card)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function AgentCommitteeBoard({ i18n, rounds }: { i18n: AppI18n; rounds: AgentCommitteeRound[] }) {
  return (
    <div className="agent-rounds">
      <div className="agent-rounds-title">
        <span>{i18n.t("panel.agent.rounds")}</span>
        <strong>{rounds.length}</strong>
      </div>
      {rounds.map((round) => (
        <article className={`agent-round ${round.tone}`} key={round.id}>
          <header>
            <span>{agentPhaseLabel(i18n, round.phase)}</span>
            <strong>{i18n.decisionAgent(round.agent)}</strong>
            <em>{round.confidence}%</em>
          </header>
          <p>{agentRoundThesis(i18n, round)}</p>
          <small>
            {agentVerdictLabel(i18n, round.verdict)} · {agentRoundEvidence(i18n, round.evidence)}
          </small>
        </article>
      ))}
    </div>
  );
}

function DecisionLogPanel({
  className,
  entries,
  i18n
}: {
  className?: string;
  entries: TerminalWorkspace["decisionLog"];
  i18n: AppI18n;
}) {
  return (
    <Panel title={i18n.t("panel.decision.title")} subtitle={i18n.t("panel.decision.subtitle")} className={className}>
      <div className="decision-log">
        {entries.map((entry) => (
          <article className={`decision-entry ${entry.tone}`} key={`${entry.agent}-${entry.message}`}>
            <strong>{i18n.decisionAgent(entry.agent)}</strong>
            <p>{i18n.decisionMessage(entry.message)}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function RunHistoryPanel({
  className,
  i18n,
  onExport,
  onImportFile,
  onReplay,
  runComparisonRows,
  runHistory,
  workspace
}: {
  className?: string;
  i18n: AppI18n;
  onExport: (run: ResearchRunAudit) => void;
  onImportFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onReplay: (run: ResearchRunAudit) => void;
  runComparisonRows: ResearchRunComparisonRow[];
  runHistory: ResearchRunAudit[];
  workspace: TerminalWorkspace;
}) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  return (
    <Panel
      title={i18n.t("panel.history.title")}
      subtitle={i18n.t("panel.history.subtitle")}
      className={className}
      action={
        <div className="history-panel-actions">
          <input
            accept="application/json,.json"
            className="history-import-input"
            onChange={onImportFile}
            ref={importInputRef}
            type="file"
          />
          <button className="history-import-button" onClick={() => importInputRef.current?.click()} type="button">
            <Upload size={13} />
            <span>{i18n.t("history.import")}</span>
          </button>
        </div>
      }
    >
      <div className="history-panel-body">
        {runComparisonRows.length ? <RunComparisonBoard i18n={i18n} rows={runComparisonRows} /> : null}
        <div className="run-history">
          {runHistory.length ? (
            runHistory.map((run) => (
              <RunHistoryRow
                key={run.runId}
                i18n={i18n}
                run={run}
                isActive={workspace.researchRun?.runId === run.runId}
                onExport={onExport}
                onReplay={onReplay}
              />
            ))
          ) : (
            <span className="empty-state">{i18n.t("empty.noAuditedRuns")}</span>
          )}
        </div>
      </div>
    </Panel>
  );
}

function ExecutionPanel({
  className,
  i18n,
  isSubmitting = false,
  onSubmit,
  rows,
  workspace
}: {
  className?: string;
  i18n: AppI18n;
  isSubmitting?: boolean;
  onSubmit?: () => void;
  rows: PaperTradingRow[];
  workspace: TerminalWorkspace;
}) {
  return (
    <Panel
      title={i18n.t("panel.execution.title")}
      subtitle={i18n.t("panel.execution.subtitle")}
      className={className}
      action={
        onSubmit ? (
          <button
            className="run-button compact"
            disabled={isSubmitting || !workspace.researchRun?.runId}
            onClick={onSubmit}
            title={i18n.t("execution.submitPaper")}
            type="button"
          >
            {isSubmitting ? <RefreshCw className="spin" size={15} /> : <Play size={15} />}
            {i18n.t("execution.submitPaper")}
          </button>
        ) : undefined
      }
    >
      <div className="execution-grid">
        <ExecutionTile icon={Database} label={i18n.t("execution.accountSync")} value={i18n.t("execution.paperAccount")} />
        <ExecutionTile icon={WalletCards} label={i18n.t("execution.positions")} value={i18n.t("execution.positionsValue")} />
        <ExecutionTile icon={ShieldCheck} label={i18n.t("execution.riskState")} value={i18n.t("execution.liveBlocked")} />
      </div>
      <div className="gate-list">
        {workspace.execution.gates.map((gate) => (
          <span key={gate.id} className={gate.passed ? "passed" : "blocked"}>
            {i18n.gateLabel(gate.id, gate.label)}
          </span>
        ))}
      </div>
      <div className="paper-blotter">
        <div className="paper-blotter-title">
          <span>{i18n.t("execution.paperBlotter")}</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="paper-blotter-table">
          <div className="paper-blotter-row paper-blotter-head">
            <span>{i18n.t("chart.symbol")}</span>
            <span>{i18n.t("execution.side")}</span>
            <span>{i18n.t("execution.quantity")}</span>
            <span>{i18n.t("execution.price")}</span>
            <span>{i18n.t("execution.notional")}</span>
            <span>{i18n.t("execution.status")}</span>
            <span>{i18n.t("execution.reason")}</span>
          </div>
          {rows.map((row) => (
            <div className={`paper-blotter-row ${row.tone}`} key={row.id}>
              <span>{row.symbol}</span>
              <span>{paperSideLabel(i18n, row.side)}</span>
              <span>{row.quantity}</span>
              <span>{row.price}</span>
              <span>{paperNotionalLabel(i18n, row.notional)}</span>
              <span>{paperStatusLabel(i18n, row.status)}</span>
              <span>{paperReasonLabel(i18n, row.reason)}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function ScannerWorkspace({
  candidates,
  i18n,
  onSelectInstrument
}: {
  candidates: ScannerCandidate[];
  i18n: AppI18n;
  onSelectInstrument: (instrument: TerminalWorkspace["selectedInstrument"]) => void;
}) {
  return (
    <Panel title={i18n.t("module.scanner.title")} subtitle={i18n.t("module.scanner.subtitle")} className="module-workspace-panel">
      <div className="module-toolbar">
        <span>{i18n.t("module.scanner.filters")}: watchlist · momentum · risk</span>
        <strong>{candidates.length}</strong>
      </div>
      <div className="scanner-table">
        <div className="scanner-row scanner-head">
          <span>{i18n.t("chart.symbol")}</span>
          <span>{i18n.t("module.scanner.score")}</span>
          <span>{i18n.t("module.scanner.signal")}</span>
          <span>{i18n.t("module.scanner.risk")}</span>
          <span>{i18n.t("module.scanner.research")}</span>
        </div>
        {candidates.map((candidate) => (
          <div className="scanner-row" key={`${candidate.instrument.market}-${candidate.instrument.symbol}`}>
            <span>
              <strong>{candidate.instrument.symbol}</strong>
              <em>{candidate.instrument.name}</em>
            </span>
            <span>
              <b>{candidate.score}</b>
              <i style={{ width: `${candidate.score}%` }} />
            </span>
            <span>{scannerSignalLabel(i18n, candidate.signal)}</span>
            <span className={`risk-chip ${candidate.risk}`}>{riskLabel(i18n, candidate.risk)}</span>
            <button onClick={() => onSelectInstrument(candidate.instrument)} type="button">
              <Search size={14} />
              {i18n.t("module.scanner.research")}
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PortfolioWorkspace({
  i18n,
  paperRows,
  positionRows,
  rows,
  workspace
}: {
  i18n: AppI18n;
  paperRows: PaperTradingRow[];
  positionRows: PaperPositionRow[];
  rows: PortfolioRiskRow[];
  workspace: TerminalWorkspace;
}) {
  return (
    <>
      <Panel title={i18n.t("module.portfolio.title")} subtitle={i18n.t("module.portfolio.subtitle")} className="module-workspace-panel">
        <div className="risk-ledger">
          {rows.map((row) => (
            <article className={`risk-ledger-row ${row.tone}`} key={row.id}>
              <span>{portfolioRiskLabel(i18n, row)}</span>
              <strong>{portfolioRiskValue(i18n, row)}</strong>
              <p>{portfolioRiskDetail(i18n, row)}</p>
            </article>
          ))}
        </div>
        <div className="paper-position-ledger">
          <div className="paper-position-title">
            <span>{i18n.t("portfolio.paperPositions")}</span>
            <strong>{positionRows.length}</strong>
          </div>
          <div className="paper-position-table">
            <div className="paper-position-row paper-position-head">
              <span>{i18n.t("chart.symbol")}</span>
              <span>{i18n.t("execution.quantity")}</span>
              <span>{i18n.t("portfolio.avgCost")}</span>
              <span>{i18n.t("portfolio.markPrice")}</span>
              <span>{i18n.t("portfolio.marketValue")}</span>
              <span>{i18n.t("portfolio.unrealizedPnl")}</span>
              <span>{i18n.t("portfolio.returnPct")}</span>
              <span>{i18n.t("execution.status")}</span>
            </div>
            {positionRows.map((row) => (
              <div className={`paper-position-row ${row.tone}`} key={row.id}>
                <span>{row.symbol}</span>
                <span>{row.quantity}</span>
                <span>{row.avgCost}</span>
                <span>{row.markPrice}</span>
                <span>{row.marketValue}</span>
                <span>{row.unrealizedPnl}</span>
                <span>{row.returnPct}</span>
                <span>{paperPositionStatusLabel(i18n, row.status)}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
      <ExecutionPanel i18n={i18n} rows={paperRows} workspace={workspace} />
    </>
  );
}

function NewsWorkspace({ events, i18n }: { events: ModuleNewsEvent[]; i18n: AppI18n }) {
  return (
    <Panel title={i18n.t("module.news.title")} subtitle={i18n.t("module.news.subtitle")} className="module-workspace-panel">
      <div className="module-toolbar">
        <span>{i18n.t("module.news.context")}</span>
      </div>
      <div className="event-stream">
        {events.map((event) => (
          <article className={`event-row ${event.impact}`} key={event.id}>
            <span>{eventSourceLabel(i18n, event)}</span>
            <strong>{eventTitleLabel(i18n, event)}</strong>
            <p>{eventDetailLabel(i18n, event)}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function BrokerWorkspace({
  adapterRows,
  executionRows,
  i18n,
  isSubmittingPaperExecution,
  onSubmitPaperExecution,
  workspace
}: {
  adapterRows: BrokerAdapterRow[];
  executionRows: PaperTradingRow[];
  i18n: AppI18n;
  isSubmittingPaperExecution: boolean;
  onSubmitPaperExecution: () => void;
  workspace: TerminalWorkspace;
}) {
  return (
    <>
      <Panel title={i18n.t("module.broker.title")} subtitle={i18n.t("module.broker.subtitle")} className="module-workspace-panel">
        <div className="broker-adapter-table">
          <div className="broker-adapter-row broker-adapter-head">
            <span>{i18n.t("broker.adapter")}</span>
            <span>{i18n.t("broker.market")}</span>
            <span>{i18n.t("broker.route")}</span>
            <span>{i18n.t("broker.status")}</span>
            <span>{i18n.t("broker.certification")}</span>
            <span>{i18n.t("broker.nextStep")}</span>
          </div>
          {adapterRows.map((row) => (
            <article className={`broker-adapter-row ${row.tone}`} key={row.id}>
              <span>{brokerAdapterName(i18n, row)}</span>
              <span>{i18n.marketLabel(row.market)}</span>
              <span>{brokerRouteLabel(i18n, row.route)}</span>
              <span>{brokerStatusLabel(i18n, row.status)}</span>
              <span>{brokerCertificationLabel(i18n, row.certification)}</span>
              <span>{brokerNextStepLabel(i18n, row.nextStep)}</span>
            </article>
          ))}
        </div>
      </Panel>
      <ExecutionPanel
        i18n={i18n}
        isSubmitting={isSubmittingPaperExecution}
        onSubmit={onSubmitPaperExecution}
        rows={executionRows}
        workspace={workspace}
      />
    </>
  );
}

function WorkflowWorkspace({
  activeStage,
  i18n,
  isRunning,
  onRunPipeline,
  onSelectStage,
  runState,
  stages
}: {
  activeStage?: WorkflowStageView;
  i18n: AppI18n;
  isRunning: boolean;
  onRunPipeline: () => void;
  onSelectStage: (stageId: string) => void;
  runState: WorkflowRunState;
  stages: WorkflowStageView[];
}) {
  const stageLabelById = new Map(stages.map((stage) => [stage.id, workflowStageLabel(i18n, stage).label]));
  const visibleLog = runState.log.slice(-6);

  return (
    <>
      <Panel title={i18n.t("module.workflow.title")} subtitle={i18n.t("module.workflow.subtitle")} className="module-workspace-panel workflow-workspace">
        <div className="workflow-canvas-label">{i18n.t("module.workflow.canvas")}</div>
        <div className="workflow-canvas-large">
          {stages.map((stage, index) => (
            <button
              className={`workflow-stage ${stage.status} ${activeStage?.id === stage.id ? "selected" : ""}`}
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              type="button"
            >
              <small>{String(index + 1).padStart(2, "0")}</small>
              <strong>{workflowStageLabel(i18n, stage).label}</strong>
              <span>{workflowStageLabel(i18n, stage).detail}</span>
            </button>
          ))}
        </div>
      </Panel>
      <Panel
        title={activeStage ? workflowStageLabel(i18n, activeStage).label : i18n.t("module.workflow.output")}
        subtitle={workflowStatusLabel(i18n, activeStage?.status ?? "ready")}
        action={
          <button className="run-button compact" disabled={isRunning} onClick={onRunPipeline} type="button">
            {isRunning ? <RefreshCw className="spin" size={15} /> : <Play size={15} />}
            {i18n.t("module.workflow.run")}
          </button>
        }
      >
        <div className="workflow-output">
          <span>{i18n.t("module.workflow.output")}</span>
          <strong>{workflowOutputLabel(i18n, activeStage?.output ?? "Ready for pipeline run")}</strong>
          <p>{activeStage ? workflowStageLabel(i18n, activeStage).detail : ""}</p>
        </div>
        {activeStage?.artifacts.length ? (
          <div className="workflow-artifacts">
            <span>{i18n.t("module.workflow.artifacts")}</span>
            <div className="workflow-artifact-grid">
              {activeStage.artifacts.map((artifact) => (
                <article className={`workflow-artifact ${artifact.tone}`} key={`${artifact.label}-${artifact.value}`}>
                  <span>{workflowArtifactLabel(i18n, artifact)}</span>
                  <strong>{workflowArtifactValue(i18n, artifact)}</strong>
                  <p>{workflowArtifactDetail(i18n, artifact)}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
        <div className="workflow-log">
          <span>{i18n.t("module.workflow.log")}</span>
          {visibleLog.length ? (
            <div className="workflow-log-list">
              {visibleLog.map((entry) => (
                <p className={`workflow-log-entry ${entry.level}`} key={entry.id}>
                  <small>{stageLabelById.get(entry.stageId) ?? entry.stageId}</small>
                  <span>{workflowOutputLabel(i18n, entry.message)}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="workflow-log-empty">{i18n.t("module.workflow.idle")}</p>
          )}
        </div>
      </Panel>
    </>
  );
}

function workflowStageLabel(i18n: AppI18n, stage: WorkflowStageView): { label: string; detail: string } {
  return i18n.workflowNode(stage.id, stage.label, stage.detail);
}

function scannerSignalLabel(i18n: AppI18n, signal: ScannerCandidate["signal"]): string {
  if (i18n.locale === "en-US") {
    return signal;
  }
  return {
    "Momentum watch": "动量观察",
    "Baseline watch": "基准观察",
    "Risk review": "风险复核"
  }[signal];
}

function riskLabel(i18n: AppI18n, risk: ScannerCandidate["risk"]): string {
  if (i18n.locale === "en-US") {
    return risk;
  }
  return { low: "低", medium: "中", high: "高" }[risk];
}

function strategyRuleGroupLabel(i18n: AppI18n, group: StrategyRuleRow["group"]): string {
  if (i18n.locale === "en-US") {
    return group;
  }
  return { entry: "入场", exit: "出场", position: "仓位", risk: "风控" }[group];
}

function strategyRuleLabel(i18n: AppI18n, label: StrategyRuleRow["label"]): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return {
    "Entry signal": "入场信号",
    "Exit signal": "出场信号",
    "Position sizing": "仓位规则",
    "Risk guardrail": "风险闸门"
  }[label] ?? label;
}

function strategyRuleParameterLabel(i18n: AppI18n, parameter: string): string {
  if (i18n.locale === "en-US") {
    return parameter;
  }
  return parameter
    .replace("SMA20 / relative strength", "SMA20 / 相对强度")
    .replace("Trend support / risk downgrade", "趋势支撑 / 风险下调")
    .replace("Exposure cap / paper sizing", "暴露上限 / 模拟定仓")
    .replace("Stop / drawdown / execution mode", "止损 / 回撤 / 执行模式");
}

function strategyRuleStatusLabel(i18n: AppI18n, status: StrategyRuleRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { active: "启用", pending: "待生成", guardrail: "保护" }[status];
}

function backtestSideLabel(i18n: AppI18n, side: BacktestTradeRow["side"]): string {
  if (i18n.locale === "en-US") {
    return side;
  }
  return { BUY: "买入", SELL: "卖出", RISK: "风控", HOLD: "持有" }[side];
}

function backtestStatusLabel(i18n: AppI18n, status: BacktestTradeRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { filled: "已成交", open: "观察中", review: "复核", blocked: "已阻断" }[status];
}

function backtestExposureLabel(i18n: AppI18n, exposure: string): string {
  if (i18n.locale === "en-US") {
    return exposure;
  }
  return exposure.replace("drawdown", "回撤").replace("paper", "模拟");
}

function backtestAssumptionLabel(i18n: AppI18n, field: BacktestAssumptionField, fallback: string): string {
  const key = {
    initialCash: "backtest.initialCash",
    feeBps: "backtest.feeBps",
    slippageBps: "backtest.slippageBps"
  }[field] as Parameters<AppI18n["t"]>[0];
  return i18n.t(key) || fallback;
}

function backtestAssumptionSuffixLabel(i18n: AppI18n, suffix: string): string {
  if (i18n.locale === "zh-CN") {
    return suffix === "CNY" ? "资金" : "基点";
  }
  return suffix;
}

function portfolioRiskLabel(i18n: AppI18n, row: PortfolioRiskRow): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  return {
    "paper-exposure": "模拟盘暴露",
    "selected-risk": "当前标的",
    "live-gates": "实盘闸门"
  }[row.id] ?? row.label;
}

function portfolioRiskValue(i18n: AppI18n, row: PortfolioRiskRow): string {
  if (i18n.locale === "en-US") {
    return row.value;
  }
  return row.value.replace("watched", "个观察").replace("blocked", "个阻断").replace("open", "已开启");
}

function portfolioRiskDetail(i18n: AppI18n, row: PortfolioRiskRow): string {
  if (i18n.locale === "en-US") {
    return row.detail;
  }
  if (row.id === "paper-exposure") {
    return "当前工作台没有连接已认证实盘持仓。";
  }
  if (row.id === "selected-risk") {
    return `${row.value} 在新的审计运行通过闸门前保持模拟盘。`;
  }
  if (row.id === "live-gates") {
    return "需要完成适配器认证、风控审批和人工确认。";
  }
  return row.detail;
}

function paperPositionStatusLabel(i18n: AppI18n, status: PaperPositionRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { paper: "模拟", flat: "空仓", blocked: "已阻断" }[status];
}

function agentPhaseLabel(i18n: AppI18n, phase: AgentCommitteeRound["phase"]): string {
  if (i18n.locale === "en-US") {
    return phase;
  }
  return { analysis: "分析", debate: "辩论", risk: "风控", decision: "决策" }[phase];
}

function agentVerdictLabel(i18n: AppI18n, verdict: AgentCommitteeRound["verdict"]): string {
  if (i18n.locale === "en-US") {
    return verdict;
  }
  return { support: "支持", challenge: "质疑", risk: "风险", watch: "观察" }[verdict];
}

function agentRoundThesis(i18n: AppI18n, round: AgentCommitteeRound): string {
  if (i18n.locale === "en-US") {
    return round.thesis;
  }
  const bullCase = round.thesis.match(/^Bull case requires (.+)\.$/);
  if (bullCase) {
    return `多头观点需要：${i18n.strategyText(bullCase[1])}。`;
  }
  const bearCase = round.thesis.match(/^Bear case challenges the setup if (.+)\.$/);
  if (bearCase) {
    return `空头观点在以下条件下质疑配置：${i18n.strategyText(bearCase[1])}。`;
  }
  return i18n.decisionMessage(round.thesis);
}

function agentRoundEvidence(i18n: AppI18n, evidence: string): string {
  if (i18n.locale === "en-US") {
    return evidence;
  }
  const positionRule = evidence.match(/^Position rule: (.+)\.$/);
  if (positionRule) {
    return `仓位规则：${i18n.strategyText(positionRule[1])}。`;
  }
  const riskRule = evidence.match(/^Risk rule: (.+)\.$/);
  if (riskRule) {
    return `风控规则：${i18n.strategyText(riskRule[1])}。`;
  }
  const auditedRun = evidence.match(/^Audited run (.+) · (.+) bars$/);
  if (auditedRun) {
    return `审计运行 ${auditedRun[1]} · ${auditedRun[2]} 根K线`;
  }
  return evidence
    .replace("Return", "收益率")
    .replace("Max DD", "最大回撤")
    .replace("Adapter certified: blocked", "适配器认证：阻断")
    .replace("Risk approved: blocked", "风控审批：阻断")
    .replace("Human confirmed: blocked", "人工确认：阻断")
    .replace("Adapter certified: passed", "适配器认证：通过")
    .replace("Risk approved: passed", "风控审批：通过")
    .replace("Human confirmed: passed", "人工确认：通过")
    .replace("No audited run is bound to this research context yet.", "当前研究上下文尚未绑定审计运行。");
}

function paperTradingRowsFromExecutionRecord(record: PaperExecutionRecord): PaperTradingRow[] {
  const orderRows = record.orders.map((order) => ({
    id: order.orderId,
    symbol: order.symbol,
    side: order.side === "sell" ? "SELL" : "BUY",
    quantity: String(order.quantity),
    price: order.price.toFixed(2),
    notional: (order.quantity * order.price).toFixed(2),
    status: order.status === "filled" ? "filled" : "blocked",
    reason: order.reason,
    tone: order.status === "filled" ? "positive" : "risk"
  })) satisfies PaperTradingRow[];

  const gateRows = record.gates.map((gate) => ({
    id: `gate-${gate.id}`,
    symbol: "PAPER",
    side: "RISK",
    quantity: "-",
    price: "-",
    notional: "-",
    status: gate.passed ? "paper" : "blocked",
    reason: `${gate.label}: ${gate.reason}`,
    tone: gate.passed ? "neutral" : "warning"
  })) satisfies PaperTradingRow[];

  return [...orderRows, ...gateRows];
}

function paperSideLabel(i18n: AppI18n, side: PaperTradingRow["side"]): string {
  if (i18n.locale === "en-US") {
    return side;
  }
  return { BUY: "买入", SELL: "卖出", RISK: "风控", SYNC: "同步" }[side];
}

function paperStatusLabel(i18n: AppI18n, status: PaperTradingRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { queued: "待处理", filled: "已成交", blocked: "已阻断", paper: "模拟" }[status];
}

function paperNotionalLabel(i18n: AppI18n, notional: string): string {
  if (i18n.locale === "en-US" || notional === "-") {
    return notional;
  }
  return `${notional} 模拟资金`;
}

function paperReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason;
  }
  const stagedOrder = reason.match(/^Paper order staged from (.+); no live route is used\.$/);
  if (stagedOrder) {
    return `已从 ${i18n.strategyText(stagedOrder[1])} 生成模拟委托；不使用实盘通道。`;
  }
  const blockedGate = reason.match(/^(\d+) live gates blocked; paper route remains available\.$/);
  if (blockedGate) {
    return `${blockedGate[1]} 个实盘闸门阻断；模拟盘通道可用。`;
  }
  return reason
    .replace("filled_immediately", "已模拟成交")
    .replace("max_position_value_exceeded", "超过单标的模拟仓位上限")
    .replace("insufficient_cash", "模拟现金不足")
    .replace("Audit run bound: ", "审计运行绑定：")
    .replace("Paper risk check: ", "模拟风控检查：")
    .replace("Live route blocked: ", "实盘通道阻断：")
    .replace(/^Paper execution is linked to audited run (.+)\.$/, "模拟执行已绑定审计运行 $1。")
    .replace("Live execution is blocked; this record is paper-only.", "实盘执行已阻断；该记录仅用于模拟盘。")
    .replace("Certified live route is available but this run stays paper-first.", "认证实盘通道可用，但本次仍优先模拟盘。")
    .replace("Local paper account only; broker account synchronization is not connected.", "仅本地模拟账户；尚未连接券商账户同步。");
}

function brokerAdapterName(i18n: AppI18n, row: BrokerAdapterRow): string {
  if (i18n.locale === "en-US") {
    return row.adapter;
  }
  return (
    {
      "paper-local": "本地模拟交易",
      "ashare-live": "A 股券商接口",
      "us-live": "IBKR / Alpaca 适配器形态",
      "crypto-live": "ccxt 交易所适配器形态"
    }[row.id] ?? row.adapter
  );
}

function brokerRouteLabel(i18n: AppI18n, route: BrokerAdapterRow["route"]): string {
  if (i18n.locale === "en-US") {
    return route;
  }
  return { paper: "模拟", live: "实盘" }[route];
}

function brokerStatusLabel(i18n: AppI18n, status: BrokerAdapterRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status.replaceAll("_", " ");
  }
  return {
    paper_ready: "模拟可用",
    interface_only: "仅接口",
    config_required: "需配置",
    blocked: "已阻断"
  }[status];
}

function brokerCertificationLabel(i18n: AppI18n, certification: string): string {
  if (i18n.locale === "en-US") {
    return certification;
  }
  return certification
    .replace("Simulated fills, order log, and risk checks are available locally.", "本地已具备模拟成交、委托日志和风控检查。")
    .replace("No certified A-share broker API is connected.", "尚未连接已认证 A 股券商 API。")
    .replace("Adapter shape is reserved; paper credentials are not configured.", "已预留适配器形态；尚未配置模拟账户凭据。")
    .replace("Exchange adapter shape is reserved; API keys are not configured.", "已预留交易所适配器形态；尚未配置 API Key。");
}

function brokerNextStepLabel(i18n: AppI18n, nextStep: string): string {
  if (i18n.locale === "en-US") {
    return nextStep;
  }
  return nextStep
    .replace("Use paper execution for research runs before certifying live adapters.", "实盘适配器认证前，研究运行统一走模拟执行。")
    .replace("Keep live trading blocked until a legal broker adapter passes certification.", "合法券商适配器通过认证前，继续阻断实盘交易。")
    .replace(
      "Configure a paper account and certify submit, cancel, fill, reject, and reconnect paths.",
      "先配置模拟账户，并认证下单、撤单、成交、拒单和重连路径。"
    )
    .replace(
      "Start with sandbox or testnet routes plus max order and emergency-stop limits.",
      "先使用 sandbox/testnet，并配置最大订单和紧急停止限制。"
    );
}

function agentEvidenceLabel(i18n: AppI18n, card: AiEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.label;
  }
  return (
    {
      context: "研究上下文",
      backtest: "回测证据",
      risk: "风控闸门",
      safety: "AI 边界"
    }[card.id] ?? card.label
  );
}

function agentEvidenceValue(i18n: AppI18n, card: AiEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.value;
  }
  if (card.value === "Pending audited run") {
    return "等待审计运行";
  }
  if (card.value === "No buy/sell advice") {
    return "不输出买卖建议";
  }
  if (card.value === "Live gates open") {
    return "实盘闸门已开启";
  }
  return card.value.replace("bars", "根K线").replace("blocked gates", "个阻断闸门");
}

function agentEvidenceDetail(i18n: AppI18n, card: AiEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.detail;
  }
  const context = card.detail.match(/^(.+) · price (.+)$/);
  if (context) {
    return `${i18n.marketLabel(context[1] as Market)} · 价格 ${context[2]}`;
  }
  const auditedRun = card.detail.match(/^Audited run (.+) · revision (.+)$/);
  if (auditedRun) {
    return `审计运行 ${auditedRun[1]} · 版本 ${auditedRun[2]}`;
  }
  if (card.detail === "Run Pipeline before trusting AI review.") {
    return "先运行流水线，再信任 AI 评审。";
  }
  if (card.detail === "AI can explain supplied evidence only; no guaranteed outcome.") {
    return "AI 只能解释已提供证据；不保证结果。";
  }
  return card.detail
    .replace("Adapter certified: blocked", "适配器认证：阻断")
    .replace("Risk approved: blocked", "风控审批：阻断")
    .replace("Human confirmed: blocked", "人工确认：阻断")
    .replace("Adapter certified: passed", "适配器认证：通过")
    .replace("Risk approved: passed", "风控审批：通过")
    .replace("Human confirmed: passed", "人工确认：通过");
}

function eventSourceLabel(i18n: AppI18n, event: ModuleNewsEvent): string {
  if (i18n.locale === "en-US") {
    return event.source;
  }
  return (
    {
      "AI committee": "智能体委员会",
      "Market data": "行情数据",
      "Audit log": "审计日志",
      "Risk engine": "风控引擎"
    }[event.source] ?? event.source
  );
}

function eventTitleLabel(i18n: AppI18n, event: ModuleNewsEvent): string {
  if (i18n.locale === "en-US") {
    return event.title;
  }
  const quoteUpdate = event.title.match(/^(.+) quote (.+) from (.+)$/);
  if (quoteUpdate) {
    return `${quoteUpdate[1]} 报价 ${quoteUpdate[2]} · ${quoteUpdate[3]}`;
  }
  const quoteMissing = event.title.match(/^(.+) quote unavailable$/);
  if (quoteMissing) {
    return `${quoteMissing[1]} 报价暂不可用`;
  }
  const auditRun = event.title.match(/^Run (.+) bound to (.+)$/);
  if (auditRun) {
    return `审计运行 ${auditRun[1]} 已绑定 ${auditRun[2]}`;
  }
  const auditNeeded = event.title.match(/^(.+) needs a fresh audited run$/);
  if (auditNeeded) {
    return `${auditNeeded[1]} 需要新的审计运行`;
  }
  const blockedGates = event.title.match(/^(\d+) execution gates blocked$/);
  if (blockedGates) {
    return `${blockedGates[1]} 个执行闸门阻断`;
  }
  if (event.title === "Live execution gates open") {
    return "实盘执行闸门已开启";
  }
  const separatorIndex = event.title.indexOf(": ");
  if (separatorIndex > 0) {
    const agent = event.title.slice(0, separatorIndex);
    const message = event.title.slice(separatorIndex + 2);
    return `${i18n.decisionAgent(agent)}: ${i18n.decisionMessage(message)}`;
  }
  return i18n.decisionMessage(event.title);
}

function eventDetailLabel(i18n: AppI18n, event: ModuleNewsEvent): string {
  if (i18n.locale === "en-US") {
    return event.detail;
  }
  const quoteDetail = event.detail.match(/^As of (.+) · change (.+)$/);
  if (quoteDetail) {
    return `截至 ${quoteDetail[1]} · 涨跌幅 ${quoteDetail[2]}`;
  }
  const auditRun = event.detail.match(/^(.+) (.+) bars · revision (.+) · (.+)$/);
  if (auditRun) {
    return `${auditRun[1]} 根 ${auditRun[2]} K线 · 版本 ${auditRun[3]} · ${auditRun[4].replace("paper_only", "模拟盘")}`;
  }
  if (event.detail === "Run Pipeline to bind data, backtest, agent review, and execution gates.") {
    return "运行流水线以绑定数据、回测、智能体评审和执行闸门。";
  }
  if (event.detail === "Refresh workspace or configure a market data adapter.") {
    return "刷新工作区或配置行情数据适配器。";
  }
  return event.detail
    .replace("Linked to ", "已关联 ")
    .replace(" research context.", " 研究上下文。")
    .replace("Adapter certified: blocked", "适配器认证：阻断")
    .replace("Risk approved: blocked", "风控审批：阻断")
    .replace("Human confirmed: blocked", "人工确认：阻断")
    .replace("Adapter certified: passed", "适配器认证：通过")
    .replace("Risk approved: passed", "风控审批：通过")
    .replace("Human confirmed: passed", "人工确认：通过");
}

function workflowStatusLabel(i18n: AppI18n, status: WorkflowStageView["status"]): string {
  if (i18n.locale === "en-US") {
    return {
      active: "Active",
      ready: "Ready",
      blocked: "Blocked",
      running: "Running",
      completed: "Completed",
      failed: "Failed"
    }[status];
  }
  return { active: "运行中", ready: "就绪", blocked: "阻断", running: "运行中", completed: "已完成", failed: "失败" }[
    status
  ];
}

function workflowOutputLabel(i18n: AppI18n, output: string): string {
  if (i18n.locale === "en-US") {
    return output;
  }
  const dataSnapshot = output.match(/^Data snapshot prepared for (.+)$/);
  if (dataSnapshot) {
    return `已准备数据快照：${dataSnapshot[1]}`;
  }
  const backtestReceived = output.match(/^Audited backtest received: (.+) bars · (.+)$/);
  if (backtestReceived) {
    return `已收到审计回测：${backtestReceived[1]} 根K线 · ${backtestReceived[2].replace("paper_only", "模拟盘")}`;
  }
  const replayLoaded = output.match(/^Audit replay loaded: (.+) bars · (.+)$/);
  if (replayLoaded) {
    return `已加载审计回放：${replayLoaded[1]} 根K线 · ${replayLoaded[2].replace("paper_only", "模拟盘")}`;
  }
  const restoredData = output.match(/^Audit data snapshot restored: (.+) · (.+) · (.+) bars$/);
  if (restoredData) {
    return `已恢复审计数据快照：${restoredData[1]} · ${restoredData[2]} · ${restoredData[3]} 根K线`;
  }
  const restoredRevision = output.match(/^Strategy revision restored: (.+)$/);
  if (restoredRevision) {
    return `已恢复策略版本：${restoredRevision[1]}`;
  }
  const restoredDecisions = output.match(/^Decision notes restored: (.+)$/);
  if (restoredDecisions) {
    return `已恢复决策记录：${restoredDecisions[1]} 条`;
  }
  const restoredExecution = output.match(/^Execution mode restored: (.+); live gates remain controlled locally$/);
  if (restoredExecution) {
    return `已恢复执行模式：${restoredExecution[1].replace("paper_only", "模拟盘")}；实盘闸门仍由本地控制`;
  }
  const failedBacktest = output.match(/^Pipeline failed before audited backtest: (.+)$/);
  if (failedBacktest) {
    return `审计回测前流水线失败：${failedBacktest[1]}`;
  }
  return output
    .replace("Paper execution only", "仅模拟盘执行")
    .replace("Ready for pipeline run", "等待运行流水线")
    .replace("Factor set staged: SMA / RSI / volume", "因子集已准备：SMA / RSI / 成交量")
    .replace("Backtest request sent to local core", "回测请求已发送到本地核心")
    .replace("Audited backtest received", "已收到审计回测")
    .replace("Agent committee report received", "智能体委员会报告已收到")
    .replace("Live execution remains blocked; paper review is ready", "实盘执行保持阻断；模拟复盘已就绪");
}

function workflowArtifactLabel(i18n: AppI18n, artifact: WorkflowStageView["artifacts"][number]): string {
  if (i18n.locale === "en-US") {
    return artifact.label;
  }
  const directLabel = {
    Instrument: "标的",
    Timeframe: "周期",
    Rows: "数据行",
    Entry: "入场",
    Exit: "出场",
    Risk: "风控",
    "Initial cash": "初始资金",
    Fee: "手续费",
    Slippage: "滑点",
    Mode: "模式",
    "Live gates": "实盘闸门"
  }[artifact.label];
  if (directLabel) {
    return directLabel;
  }
  const metricLabel = i18n.metricLabel(artifact.label);
  return metricLabel === artifact.label ? i18n.decisionAgent(artifact.label) : metricLabel;
}

function workflowArtifactValue(i18n: AppI18n, artifact: WorkflowStageView["artifacts"][number]): string {
  if (i18n.locale === "en-US") {
    return artifact.value;
  }
  if (artifact.label === "Rows") {
    return artifact.value.replace("Pending run", "等待运行").replace("bars", "根K线");
  }
  if (artifact.label === "Mode") {
    return artifact.value.replace("paper_only", "模拟盘").replace("certified_live", "认证实盘").replace("blocked_live", "实盘阻断");
  }
  if (artifact.label === "Live gates") {
    return artifact.value.replace("blocked", "个阻断").replace("open", "已开启");
  }
  if (artifact.label === "Initial cash") {
    return `${artifact.value} 资金`;
  }
  if (artifact.label === "Fee" || artifact.label === "Slippage") {
    return artifact.value.replace("bps", "基点");
  }
  if (artifact.label === "Entry" || artifact.label === "Exit" || artifact.label === "Risk") {
    return i18n.strategyText(artifact.value);
  }
  if (
    !["Instrument", "Timeframe", "Return", "Max DD", "Win Rate", "Trades", "Initial cash", "Fee", "Slippage"].includes(
      artifact.label
    )
  ) {
    return i18n.decisionMessage(artifact.value);
  }
  return artifact.value;
}

function workflowArtifactDetail(i18n: AppI18n, artifact: WorkflowStageView["artifacts"][number]): string {
  if (i18n.locale === "en-US") {
    return artifact.detail;
  }
  return artifact.detail
    .replace("Selected research interval", "当前研究周期")
    .replace("Run Pipeline to bind an audited data snapshot.", "运行流水线后绑定可审计数据快照。")
    .replace(/^Bound to audited run (.+)\.$/, "已绑定审计运行 $1。")
    .replace("Signal gate", "信号闸门")
    .replace("Invalidation rule", "失效规则")
    .replace("Sizing and guardrail", "仓位与保护")
    .replace("Latest audited metric for the selected context.", "当前上下文的最新审计指标。")
    .replace("Backtest capital assumption.", "回测初始资金假设。")
    .replace("Round-trip fee assumption in basis points.", "以基点表示的往返手续费假设。")
    .replace("Execution slippage assumption in basis points.", "以基点表示的成交滑点假设。")
    .replace("AI research note from supplied workspace context.", "来自当前工作台上下文的 AI 研究记录。")
    .replace("Paper route only.", "仅模拟盘路径。")
    .replace("Certified live route is available.", "已具备认证实盘路径。")
    .replace("Adapter certified, Risk approved, Human confirmed", "适配器认证、风控审批、人工确认");
}

function KlineChartCanvas({
  bars,
  locale,
  market,
  onLoadHistorical,
  symbol,
  timeframe
}: {
  bars: MarketKlinesResult["bars"];
  locale: Locale;
  market: Market;
  onLoadHistorical?: (beforeTimestampMs: number) => Promise<MarketKlinesResult["bars"]>;
  symbol: string;
  timeframe: Timeframe;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const contextKeyRef = useRef("");
  const historicalLoaderRef = useRef(onLoadHistorical);

  useEffect(() => {
    historicalLoaderRef.current = onLoadHistorical;
  }, [onLoadHistorical]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const chart = init(containerRef.current, {
      locale,
      styles: "dark",
      timezone: "Asia/Shanghai"
    });
    chartRef.current = chart;
    chart?.setPriceVolumePrecision(4, 2);
    chart?.setMaxOffsetRightDistance(chartRightBoundaryDistance);
    chart?.setOffsetRightDistance(chartRightBoundaryDistance);
    chart?.setRightMinVisibleBarCount(2);
    chart?.createIndicator("VOL", false, { height: 72, minHeight: 48 });
    chart?.setLoadDataCallback(({ type, data, callback }) => {
      if (type === LoadDataType.Forward && data?.timestamp) {
        const loader = historicalLoaderRef.current;
        if (!loader) {
          callback([], false);
          return;
        }
        void loader(data.timestamp)
          .then((loadedBars) => callback(toKlineChartData(loadedBars), loadedBars.length > 0))
          .catch(() => callback([], false));
        return;
      }
      if (type === LoadDataType.Backward) {
        chart.setOffsetRightDistance(chartRightBoundaryDistance);
      }
      callback([], false);
    });
    const clampFutureScroll = () => {
      if (chart && chart.getOffsetRightDistance() > chartRightBoundaryDistance) {
        chart.setOffsetRightDistance(chartRightBoundaryDistance);
      }
    };
    chart?.subscribeAction(ActionType.OnScroll, clampFutureScroll);
    chart?.subscribeAction(ActionType.OnVisibleRangeChange, clampFutureScroll);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            chart?.resize();
          });
    if (resizeObserver) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      chart?.unsubscribeAction(ActionType.OnScroll, clampFutureScroll);
      chart?.unsubscribeAction(ActionType.OnVisibleRangeChange, clampFutureScroll);
      resizeObserver?.disconnect();
      if (containerRef.current) {
        dispose(containerRef.current);
      } else if (chart) {
        dispose(chart);
      }
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setLocale(locale);
  }, [locale]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }
    const contextKey = `${market}:${symbol}:${timeframe}`;
    const isNewContext = contextKeyRef.current !== contextKey;
    contextKeyRef.current = contextKey;
    chart.applyNewData(toKlineChartData(bars), true, () => {
      chart.setMaxOffsetRightDistance(chartRightBoundaryDistance);
      if (isNewContext) {
        chart.setOffsetRightDistance(chartRightBoundaryDistance);
        chart.scrollToRealTime(0);
      }
    });
  }, [bars, market, symbol, timeframe]);

  return <div className="chart-canvas" ref={containerRef} aria-label={`${symbol} ${timeframe} K-line chart`} />;
}

function toKlineChartData(bars: MarketKlinesResult["bars"]): KLineData[] {
  return bars.map((bar) => ({
    timestamp: bar.timestampMs,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume
  }));
}

function formatChartDate(timestamp: string): string {
  return timestamp.slice(0, 10);
}

function Panel({
  title,
  subtitle,
  action,
  className,
  children
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`terminal-panel ${className ?? ""}`}>
      <header>
        <div>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function RunHistoryRow({
  run,
  isActive,
  onExport,
  onReplay,
  i18n
}: {
  run: ResearchRunAudit;
  isActive: boolean;
  onExport: (run: ResearchRunAudit) => void;
  onReplay: (run: ResearchRunAudit) => void;
  i18n: AppI18n;
}) {
  return (
    <article
      aria-current={isActive ? "true" : undefined}
      className={`history-row ${isActive ? "active" : ""}`}
    >
      <button className="history-row-main" onClick={() => onReplay(run)} type="button">
        <strong>{i18n.researchRunHistoryLabel(run)}</strong>
        <span>{historyRunDetailLabel(i18n, run)}</span>
        <span>{run.runId}</span>
      </button>
      <div className="history-row-actions">
        <button onClick={() => onReplay(run)} type="button">
          <Play size={13} />
          <small>{isActive ? i18n.t("history.active") : i18n.t("history.replay")}</small>
        </button>
        <button onClick={() => onExport(run)} type="button">
          <Download size={13} />
          <small>{i18n.t("history.export")}</small>
        </button>
      </div>
    </article>
  );
}

function RunComparisonBoard({ i18n, rows }: { i18n: AppI18n; rows: ResearchRunComparisonRow[] }) {
  return (
    <div className="history-comparison">
      <div className="history-comparison-title">
        <span>{i18n.t("history.comparison")}</span>
        <strong>{rows.length}</strong>
      </div>
      <div className="history-comparison-grid">
        <div className="history-comparison-row history-comparison-head">
          <span>{i18n.t("history.delta")}</span>
          <span>{i18n.t("history.current")}</span>
          <span>{i18n.t("history.previous")}</span>
        </div>
        {rows.map((row) => (
          <article className={`history-comparison-row ${row.tone}`} key={row.id}>
            <span>
              <strong>{historyComparisonLabel(i18n, row.label)}</strong>
              <em>{historyComparisonDeltaLabel(i18n, row.delta)}</em>
            </span>
            <span>{historyComparisonValue(i18n, row.current)}</span>
            <span>{historyComparisonValue(i18n, row.previous)}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

function historyRunDetailLabel(i18n: AppI18n, run: ResearchRunAudit): string {
  const rows = i18n.t("history.rows", { count: run.dataRows });
  const revision = `${i18n.t("history.revision")}: ${run.strategyRevision}`;
  const execution = `${i18n.t("history.execution")}: ${historyExecutionModeLabel(i18n, run.executionMode)}`;
  const assumptions = historyAssumptionLabel(i18n, run);
  return assumptions ? `${rows} · ${revision} · ${execution} · ${assumptions}` : `${rows} · ${revision} · ${execution}`;
}

function historyExecutionModeLabel(i18n: AppI18n, mode: string): string {
  if (i18n.locale === "zh-CN") {
    return mode.replace("paper_only", "模拟盘").replace("certified_live", "认证实盘").replace("blocked_live", "实盘阻断");
  }
  return mode;
}

function historyAssumptionLabel(i18n: AppI18n, run: ResearchRunAudit): string | null {
  if (!run.backtestAssumptions) {
    return null;
  }
  const cash = run.backtestAssumptions.initialCash.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (i18n.locale === "zh-CN") {
    return `资金 ${cash} / 手续费 ${run.backtestAssumptions.feeBps}基点 / 滑点 ${run.backtestAssumptions.slippageBps}基点`;
  }
  return `Cash ${cash} / Fee ${run.backtestAssumptions.feeBps}bps / Slippage ${run.backtestAssumptions.slippageBps}bps`;
}

function historyComparisonLabel(i18n: AppI18n, label: string): string {
  if (label === "Assumptions") {
    return i18n.locale === "zh-CN" ? "回测假设" : label;
  }
  return i18n.metricLabel(label);
}

function historyComparisonDeltaLabel(i18n: AppI18n, delta: string): string {
  if (delta === "changed") {
    return i18n.t("history.changed");
  }
  if (delta === "same") {
    return i18n.t("history.unchanged");
  }
  return delta;
}

function historyComparisonValue(i18n: AppI18n, value: string): string {
  if (i18n.locale === "en-US") {
    return value;
  }
  return value.replace("Cash", "资金").replace("Fee", "手续费").replace("Slippage", "滑点").replaceAll("bps", "基点");
}

function ExecutionTile({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Database;
  label: string;
  value: string;
}) {
  return (
    <article className="execution-tile">
      <Icon size={17} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
