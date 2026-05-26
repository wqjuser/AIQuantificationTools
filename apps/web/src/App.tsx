import {
  Activity,
  BarChart3,
  BrainCircuit,
  Cable,
  Database,
  GitBranch,
  Languages,
  Maximize2,
  Play,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Timer,
  WalletCards,
  X
} from "lucide-react";
import { ActionType, dispose, init, LoadDataType, type Chart, type KLineData } from "klinecharts";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  buildLoadingMarketKlinesResult,
  loadMarketKlines,
  loadMarketSearch,
  loadResearchRunHistory,
  loadTerminalWorkspace,
  mergeMarketKlines,
  MarketKlinesResult,
  MarketSearchSuggestion,
  resolveQuantCoreBaseUrl,
  runTerminalResearch,
  ResearchRunHistoryResult,
  WorkspaceLoadResult
} from "./lib/terminal-api";
import { createI18n, Locale, resolveInitialLocale, supportedLocales } from "./lib/i18n";
import {
  buildTerminalWorkspace,
  buildModuleNewsEvents,
  buildPortfolioRiskRows,
  buildScannerCandidates,
  buildWorkflowStages,
  buildInstrumentFromSymbol,
  formatInstrumentPrice,
  Market,
  ModuleNewsEvent,
  PortfolioRiskRow,
  ResearchRunAudit,
  ScannerCandidate,
  Timeframe,
  TerminalModule,
  TerminalWorkspace,
  WorkflowStageView,
  workspaceFromResearchRunAudit,
  workspaceWithPreservedSelection,
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

const moduleIcons: Record<TerminalModule["accent"], typeof BarChart3> = {
  market: Radar,
  strategy: GitBranch,
  ai: BrainCircuit,
  execution: WalletCards
};

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
  const [marketDraft, setMarketDraft] = useState<Market>(workspace.selectedInstrument.market);
  const [symbolDraft, setSymbolDraft] = useState(workspace.selectedInstrument.symbol);
  const [searchSuggestions, setSearchSuggestions] = useState<MarketSearchSuggestion[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isSymbolSearching, setIsSymbolSearching] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const manualSelectionVersionRef = useRef(0);
  const chartRequestIdRef = useRef(0);
  const klinesStateRef = useRef(initialKlinesState);
  const historicalKlineRequestRef = useRef<string | null>(null);
  const symbolSearchRequestIdRef = useRef(0);
  const skipNextSymbolSearchRef = useRef(false);
  const i18n = createI18n(locale);
  const activeLoopStep = workspace.quantLoop.find((step) => step.id === activeLoopStepId) ?? workspace.quantLoop[0];
  const activeModule = workspace.modules.find((module) => module.id === activeModuleId) ?? workspace.modules[0];
  const latestChartBar = klinesState.bars.at(-1);
  const scannerCandidates = buildScannerCandidates(workspace);
  const portfolioRiskRows = buildPortfolioRiskRows(workspace);
  const moduleNewsEvents = buildModuleNewsEvents(workspace);
  const workflowStages = buildWorkflowStages(workspace);
  const activeWorkflowStage = workflowStages.find((stage) => stage.id === activeWorkflowStageId) ?? workflowStages[0];

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
        workspace: workspaceWithPreservedSelection(result.workspace, current.workspace),
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
    setIsRunning(true);
    const result = await runTerminalResearch(
      quantCoreBaseUrl,
      {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe
      },
      workspace
    );
    setWorkspaceState(result);
    await refreshRunHistory();
    setIsRunning(false);
  }, [refreshRunHistory, workspace]);

  const replayRun = useCallback(
    (run: ResearchRunAudit) => {
      manualSelectionVersionRef.current += 1;
      setWorkspaceState((current) => ({
        workspace: workspaceFromResearchRunAudit(current.workspace, run),
        source: "core",
        statusLabel: "Audit replay loaded"
      }));
    },
    []
  );

  const selectInstrument = useCallback(
    (instrument: TerminalWorkspace["selectedInstrument"]) => {
      manualSelectionVersionRef.current += 1;
      setWorkspaceState((current) => ({
        workspace: workspaceWithSelectedInstrument(current.workspace, instrument),
        source: "core",
        statusLabel: "Instrument selected"
      }));
    },
    []
  );

  const selectTimeframe = useCallback(
    (timeframe: Timeframe) => {
      manualSelectionVersionRef.current += 1;
      setWorkspaceState((current) => ({
        workspace: workspaceWithSelectedTimeframe(current.workspace, timeframe),
        source: "core",
        statusLabel: "Timeframe selected"
      }));
    },
    []
  );

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
                onClick={() => setActiveLoopStepId(step.id)}
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

        <section className={`center-grid ${activeModuleId === "watchlist" ? "" : "module-workspace-grid"}`}>
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

              <Panel title={i18n.t("panel.strategy.title")} subtitle={i18n.strategyText(workspace.strategy.name)}>
                <StrategySummary i18n={i18n} workspace={workspace} />
              </Panel>

              <Panel title={i18n.t("panel.nodeWorkflow.title")} subtitle={i18n.t("panel.nodeWorkflow.subtitle")}>
                <CompactWorkflowNodes i18n={i18n} workspace={workspace} />
              </Panel>

              <ExecutionPanel i18n={i18n} workspace={workspace} />
            </>
          ) : null}

          {activeModuleId === "scanner" ? (
            <ScannerWorkspace candidates={scannerCandidates} i18n={i18n} onSelectInstrument={selectInstrument} />
          ) : null}

          {activeModuleId === "portfolio" ? (
            <PortfolioWorkspace i18n={i18n} rows={portfolioRiskRows} workspace={workspace} />
          ) : null}

          {activeModuleId === "news" ? (
            <NewsWorkspace events={moduleNewsEvents} i18n={i18n} />
          ) : null}

          {activeModuleId === "workflow" ? (
            <WorkflowWorkspace
              activeStage={activeWorkflowStage}
              i18n={i18n}
              onRunPipeline={runPipeline}
              onSelectStage={setActiveWorkflowStageId}
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

      <aside className="agent-rail">
        <Panel title={i18n.t("panel.agent.title")} subtitle={i18n.t("panel.agent.subtitle")} className="agent-panel">
          <div className="agent-grid">
            {workspace.agents.map((agent) => (
              <span className={`agent-role ${agent.stance}`} key={agent.id}>
                {i18n.agentLabel(agent.id, agent.label)}
              </span>
            ))}
          </div>
        </Panel>

        <Panel title={i18n.t("panel.decision.title")} subtitle={i18n.t("panel.decision.subtitle")}>
          <div className="decision-log">
            {workspace.decisionLog.map((entry) => (
              <article className={`decision-entry ${entry.tone}`} key={`${entry.agent}-${entry.message}`}>
                <strong>{i18n.decisionAgent(entry.agent)}</strong>
                <p>{i18n.decisionMessage(entry.message)}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title={i18n.t("panel.history.title")} subtitle={i18n.t("panel.history.subtitle")}>
          <div className="run-history">
            {runHistory.length ? (
              runHistory.map((run) => (
                <RunHistoryRow
                  key={run.runId}
                  labelRun={i18n.researchRunHistoryLabel}
                  run={run}
                  isActive={workspace.researchRun?.runId === run.runId}
                  onReplay={replayRun}
                />
              ))
            ) : (
              <span className="empty-state">{i18n.t("empty.noAuditedRuns")}</span>
            )}
          </div>
        </Panel>

        <Panel title={i18n.t("panel.aiActions.title")} subtitle={i18n.t("panel.aiActions.subtitle")}>
          <div className="ai-actions">
            <button>
              <BrainCircuit size={15} />
              {i18n.t("aiAction.debate")}
            </button>
            <button>
              <BarChart3 size={15} />
              {i18n.t("aiAction.explain")}
            </button>
            <button>
              <Cable size={15} />
              {i18n.t("aiAction.strategyDraft")}
            </button>
          </div>
        </Panel>

        <footer className="safety-footer">
          <Activity size={16} />
          <span>{i18n.t("safety.footer")}</span>
        </footer>
      </aside>
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

function StrategySummary({ i18n, workspace }: { i18n: AppI18n; workspace: TerminalWorkspace }) {
  return (
    <dl className="strategy-list">
      <StrategyFact label={i18n.t("strategy.entry")} value={i18n.strategyText(workspace.strategy.entry)} />
      <StrategyFact label={i18n.t("strategy.exit")} value={i18n.strategyText(workspace.strategy.exit)} />
      <StrategyFact label={i18n.t("strategy.position")} value={i18n.strategyText(workspace.strategy.position)} />
      <StrategyFact label={i18n.t("strategy.risk")} value={i18n.strategyText(workspace.strategy.risk)} />
    </dl>
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

function ExecutionPanel({ i18n, workspace }: { i18n: AppI18n; workspace: TerminalWorkspace }) {
  return (
    <Panel title={i18n.t("panel.execution.title")} subtitle={i18n.t("panel.execution.subtitle")}>
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
  rows,
  workspace
}: {
  i18n: AppI18n;
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
      </Panel>
      <ExecutionPanel i18n={i18n} workspace={workspace} />
    </>
  );
}

function NewsWorkspace({ events, i18n }: { events: ModuleNewsEvent[]; i18n: AppI18n }) {
  return (
    <Panel title={i18n.t("module.news.title")} subtitle={i18n.t("module.news.subtitle")} className="module-workspace-panel">
      <div className="module-toolbar">
        <span>{i18n.t("module.news.pending")}</span>
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

function WorkflowWorkspace({
  activeStage,
  i18n,
  onRunPipeline,
  onSelectStage,
  stages
}: {
  activeStage?: WorkflowStageView;
  i18n: AppI18n;
  onRunPipeline: () => void;
  onSelectStage: (stageId: string) => void;
  stages: WorkflowStageView[];
}) {
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
          <button className="run-button compact" onClick={onRunPipeline} type="button">
            <Play size={15} />
            {i18n.t("module.workflow.run")}
          </button>
        }
      >
        <div className="workflow-output">
          <span>{i18n.t("module.workflow.output")}</span>
          <strong>{workflowOutputLabel(i18n, activeStage?.output ?? "Ready for pipeline run")}</strong>
          <p>{activeStage ? workflowStageLabel(i18n, activeStage).detail : ""}</p>
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

function eventSourceLabel(i18n: AppI18n, event: ModuleNewsEvent): string {
  if (i18n.locale === "en-US") {
    return event.source;
  }
  return event.source === "AI committee" ? "智能体委员会" : "本地事件观察";
}

function eventTitleLabel(i18n: AppI18n, event: ModuleNewsEvent): string {
  if (i18n.locale === "en-US") {
    return event.title;
  }
  if (event.id === "live-feed-pending") {
    return event.title.replace(" live event feed is not connected yet", " 实时事件源尚未接入");
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
  if (event.id === "live-feed-pending") {
    return "当前面板展示本地智能体上下文，后续可接入新闻供应商适配器。";
  }
  return event.detail.replace("Linked to ", "已关联 ").replace(" research context.", " 研究上下文。");
}

function workflowStatusLabel(i18n: AppI18n, status: WorkflowStageView["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { active: "运行中", ready: "就绪", blocked: "阻断" }[status];
}

function workflowOutputLabel(i18n: AppI18n, output: string): string {
  if (i18n.locale === "en-US") {
    return output;
  }
  return output.replace("Paper execution only", "仅模拟盘执行").replace("Ready for pipeline run", "等待运行流水线");
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
  onReplay,
  labelRun
}: {
  run: ResearchRunAudit;
  isActive: boolean;
  onReplay: (run: ResearchRunAudit) => void;
  labelRun: (run: ResearchRunAudit) => string;
}) {
  return (
    <button className={`history-row ${isActive ? "active" : ""}`} onClick={() => onReplay(run)}>
      <strong>{labelRun(run)}</strong>
      <span>{run.runId}</span>
    </button>
  );
}

function StrategyFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
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
