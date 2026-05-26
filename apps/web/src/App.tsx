import {
  Activity,
  BarChart3,
  BrainCircuit,
  Cable,
  Database,
  GitBranch,
  Languages,
  Play,
  Radar,
  RefreshCw,
  ShieldCheck,
  Timer,
  WalletCards
} from "lucide-react";
import { dispose, init, type Chart, type KLineData } from "klinecharts";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  loadMarketKlines,
  loadResearchRunHistory,
  loadTerminalWorkspace,
  MarketKlinesResult,
  resolveQuantCoreBaseUrl,
  runTerminalResearch,
  ResearchRunHistoryResult,
  WorkspaceLoadResult
} from "./lib/terminal-api";
import { createI18n, Locale, resolveInitialLocale, supportedLocales } from "./lib/i18n";
import {
  buildTerminalWorkspace,
  formatInstrumentPrice,
  Market,
  ResearchRunAudit,
  Timeframe,
  TerminalModule,
  TerminalWorkspace,
  workspaceFromResearchRunAudit,
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const i18n = createI18n(locale);

  const refreshRunHistory = useCallback(async () => {
    setRunHistoryState(await loadResearchRunHistory(quantCoreBaseUrl, 5));
  }, []);

  const refreshWorkspace = useCallback(async () => {
    setIsRefreshing(true);
    const result = await loadTerminalWorkspace(quantCoreBaseUrl);
    setWorkspaceState(result);
    await refreshRunHistory();
    setIsRefreshing(false);
  }, [refreshRunHistory]);

  const refreshChart = useCallback(async () => {
    setIsChartLoading(true);
    const result = await loadMarketKlines(quantCoreBaseUrl, {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe,
      limit: 160
    });
    setKlinesState(result);
    setIsChartLoading(false);
  }, [workspace.selectedInstrument.market, workspace.selectedInstrument.symbol, workspace.selectedTimeframe]);

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
      setWorkspaceState({
        workspace: workspaceFromResearchRunAudit(workspace, run),
        source: "core",
        statusLabel: "Audit replay loaded"
      });
    },
    [workspace]
  );

  const selectInstrument = useCallback(
    (instrument: TerminalWorkspace["selectedInstrument"]) => {
      setWorkspaceState({
        workspace: workspaceWithSelectedInstrument(workspace, instrument),
        source: "core",
        statusLabel: "Instrument selected"
      });
    },
    [workspace]
  );

  const selectTimeframe = useCallback(
    (timeframe: Timeframe) => {
      setWorkspaceState({
        workspace: workspaceWithSelectedTimeframe(workspace, timeframe),
        source: "core",
        statusLabel: "Timeframe selected"
      });
    },
    [workspace]
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
              <button className={`loop-step ${step.status}`} key={step.id}>
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
                <button className={`module-button ${module.accent}`} key={module.id}>
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

        <section className="metrics-row">
          {workspace.metrics.map((metric) => (
            <article className={`metric-card ${metric.tone}`} key={metric.label}>
              <span>{i18n.metricLabel(metric.label)}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>

        <section className="center-grid">
          <Panel
            title={i18n.t("panel.chart.title")}
            subtitle={i18n.t("panel.chart.subtitle", { timeframe: workspace.selectedTimeframe })}
            className="chart-panel"
          >
            <div className="chart-panel-body">
              <KlineChartCanvas
                bars={klinesState.bars}
                locale={locale}
                symbol={workspace.selectedInstrument.symbol}
                timeframe={workspace.selectedTimeframe}
              />
              {!klinesState.bars.length && !isChartLoading ? (
                <div className="chart-empty">{i18n.t("chart.noData")}</div>
              ) : null}
              <div className="chart-data-strip">
                <span>{i18n.t("chart.source")}: {klinesState.quality.source}</span>
                <span>{i18n.t("chart.bars", { count: klinesState.bars.length })}</span>
              </div>
            </div>
          </Panel>

          <Panel title={i18n.t("panel.strategy.title")} subtitle={i18n.strategyText(workspace.strategy.name)}>
            <dl className="strategy-list">
              <StrategyFact label={i18n.t("strategy.entry")} value={i18n.strategyText(workspace.strategy.entry)} />
              <StrategyFact label={i18n.t("strategy.exit")} value={i18n.strategyText(workspace.strategy.exit)} />
              <StrategyFact label={i18n.t("strategy.position")} value={i18n.strategyText(workspace.strategy.position)} />
              <StrategyFact label={i18n.t("strategy.risk")} value={i18n.strategyText(workspace.strategy.risk)} />
            </dl>
          </Panel>

          <Panel title={i18n.t("panel.nodeWorkflow.title")} subtitle={i18n.t("panel.nodeWorkflow.subtitle")}>
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
          </Panel>

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
        </section>
      </main>

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

function KlineChartCanvas({
  bars,
  locale,
  symbol,
  timeframe
}: {
  bars: MarketKlinesResult["bars"];
  locale: Locale;
  symbol: string;
  timeframe: Timeframe;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

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
    chart?.createIndicator("VOL", false, { height: 72, minHeight: 48 });

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
    chart.applyNewData(toKlineChartData(bars));
    chart.scrollToRealTime(0);
  }, [bars, symbol, timeframe]);

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

function Panel({
  title,
  subtitle,
  className,
  children
}: {
  title: string;
  subtitle: string;
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
