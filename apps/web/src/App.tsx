import {
  Activity,
  BarChart3,
  BrainCircuit,
  Cable,
  Database,
  GitBranch,
  Play,
  Radar,
  RefreshCw,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  loadResearchRunHistory,
  loadTerminalWorkspace,
  resolveQuantCoreBaseUrl,
  runTerminalResearch,
  ResearchRunHistoryResult,
  WorkspaceLoadResult
} from "./lib/terminal-api";
import {
  buildTerminalWorkspace,
  executionModeLabel,
  Market,
  ResearchRunAudit,
  researchRunHistoryLabel,
  researchRunLabel,
  TerminalModule,
  TerminalWorkspace
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

const marketLabels: Record<Market, string> = {
  ashare: "A 股",
  us: "美股",
  crypto: "Crypto"
};

const moduleIcons: Record<TerminalModule["accent"], typeof BarChart3> = {
  market: Radar,
  strategy: GitBranch,
  ai: BrainCircuit,
  execution: WalletCards
};

export function App() {
  const [{ workspace, source, statusLabel, error }, setWorkspaceState] = useState(initialWorkspaceState);
  const [{ runs: runHistory }, setRunHistoryState] = useState(initialRunHistoryState);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

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

  const runPipeline = useCallback(async () => {
    setIsRunning(true);
    const result = await runTerminalResearch(
      quantCoreBaseUrl,
      {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: "1d"
      },
      workspace
    );
    setWorkspaceState(result);
    await refreshRunHistory();
    setIsRunning(false);
  }, [refreshRunHistory, workspace]);

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  return (
    <div className="terminal-shell">
      <aside className="left-rail">
        <div className="brand">
          <span className="brand-mark">AQ</span>
          <div>
            <strong>AIQuant Terminal</strong>
            <span>Local-first quant OS</span>
          </div>
        </div>

        <section className="rail-section">
          <p className="section-label">Quant Loop</p>
          <nav className="loop-nav">
            {workspace.quantLoop.map((step, index) => (
              <button className={`loop-step ${step.status}`} key={step.id}>
                <span>{index + 1}</span>
                {step.label}
              </button>
            ))}
          </nav>
        </section>

        <section className="rail-section">
          <p className="section-label">Terminal Modules</p>
          <div className="module-list">
            {workspace.modules.map((module) => {
              const Icon = moduleIcons[module.accent];
              return (
                <button className={`module-button ${module.accent}`} key={module.id}>
                  <Icon size={16} />
                  {module.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="workspace-card">
          <span className="section-label">Audit Trail</span>
          <strong>A-share trend research</strong>
          <p>{researchRunLabel(workspace.researchRun)}</p>
        </section>
      </aside>

      <main className="terminal-main">
        <header className="terminal-topbar">
          <div>
            <p className="section-label">Professional Quant Workbench</p>
            <h1>{workspace.selectedInstrument.name} · {workspace.selectedInstrument.symbol}</h1>
          </div>
          <div className="topbar-actions">
            <span className={`status-pill ${source === "core" ? "ok" : "paper"}`} title={error}>
              {statusLabel}
            </span>
            <span className="status-pill paper">{executionModeLabel(workspace.execution)}</span>
            <button className="run-button" disabled={isRefreshing || isRunning} onClick={runPipeline}>
              {isRefreshing || isRunning ? <RefreshCw className="spin" size={17} /> : <Play size={17} />}
              Run Pipeline
            </button>
          </div>
        </header>

        <section className="watchlist-strip">
          {workspace.watchlist.map((instrument) => (
            <article className="ticker" key={instrument.symbol}>
              <span>{marketLabels[instrument.market]}</span>
              <strong>{instrument.symbol}</strong>
              <em className={instrument.changePct >= 0 ? "up" : "down"}>
                {instrument.changePct >= 0 ? "+" : ""}
                {instrument.changePct.toFixed(2)}%
              </em>
            </article>
          ))}
        </section>

        <section className="metrics-row">
          {workspace.metrics.map((metric) => (
            <article className={`metric-card ${metric.tone}`} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>

        <section className="center-grid">
          <Panel title="Chart & Factor Overlays" subtitle="Price · SMA20 · Trades" className="chart-panel">
            <div className="chart-canvas" aria-label="terminal chart preview">
              <svg viewBox="0 0 720 280" preserveAspectRatio="none">
                <line x1="0" y1="64" x2="720" y2="64" />
                <line x1="0" y1="132" x2="720" y2="132" />
                <line x1="0" y1="200" x2="720" y2="200" />
                <polyline
                  className="price-line"
                  points="0,220 55,196 96,208 142,154 184,168 238,112 292,134 340,94 392,116 448,72 506,84 562,48 626,62 720,42"
                />
                <polyline
                  className="factor-line"
                  points="0,232 55,224 96,212 142,196 184,178 238,166 292,150 340,138 392,120 448,108 506,92 562,80 626,68 720,58"
                />
              </svg>
            </div>
          </Panel>

          <Panel title="Strategy Snapshot" subtitle={workspace.strategy.name}>
            <dl className="strategy-list">
              <StrategyFact label="Entry" value={workspace.strategy.entry} />
              <StrategyFact label="Exit" value={workspace.strategy.exit} />
              <StrategyFact label="Position" value={workspace.strategy.position} />
              <StrategyFact label="Risk" value={workspace.strategy.risk} />
            </dl>
          </Panel>

          <Panel title="Node Workflow" subtitle="Visual pipeline">
            <div className="node-row">
              {workspace.workflowNodes.map((node) => (
                <article className="workflow-node" key={node.id}>
                  <strong>{node.label}</strong>
                  <span>{node.detail}</span>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Execution Center" subtitle="Paper first · certified live only">
            <div className="execution-grid">
              <ExecutionTile icon={Database} label="Account Sync" value="paper account" />
              <ExecutionTile icon={WalletCards} label="Positions" value="4 watched / 0 live" />
              <ExecutionTile icon={ShieldCheck} label="Risk State" value="live blocked" />
            </div>
            <div className="gate-list">
              {workspace.execution.gates.map((gate) => (
                <span key={gate.id} className={gate.passed ? "passed" : "blocked"}>
                  {gate.label}
                </span>
              ))}
            </div>
          </Panel>
        </section>
      </main>

      <aside className="agent-rail">
        <Panel title="Agent Committee" subtitle="TradingAgents-style review" className="agent-panel">
          <div className="agent-grid">
            {workspace.agents.map((agent) => (
              <span className={`agent-role ${agent.stance}`} key={agent.id}>
                {agent.label}
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="Decision Log" subtitle="Traceable AI research">
          <div className="decision-log">
            {workspace.decisionLog.map((entry) => (
              <article className={`decision-entry ${entry.tone}`} key={`${entry.agent}-${entry.message}`}>
                <strong>{entry.agent}</strong>
                <p>{entry.message}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Run History" subtitle="Recent audited runs">
          <div className="run-history">
            {runHistory.length ? (
              runHistory.map((run) => <RunHistoryRow key={run.runId} run={run} />)
            ) : (
              <span className="empty-state">No audited runs</span>
            )}
          </div>
        </Panel>

        <Panel title="AI Actions" subtitle="Structured, not generic chat">
          <div className="ai-actions">
            <button>
              <BrainCircuit size={15} />
              Run agent debate
            </button>
            <button>
              <BarChart3 size={15} />
              Explain backtest
            </button>
            <button>
              <Cable size={15} />
              Generate strategy draft
            </button>
          </div>
        </Panel>

        <footer className="safety-footer">
          <Activity size={16} />
          <span>Live execution requires adapter certification, risk approval, and human confirmation.</span>
        </footer>
      </aside>
    </div>
  );
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

function RunHistoryRow({ run }: { run: ResearchRunAudit }) {
  return (
    <article className="history-row">
      <strong>{researchRunHistoryLabel(run)}</strong>
      <span>{run.runId}</span>
    </article>
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
