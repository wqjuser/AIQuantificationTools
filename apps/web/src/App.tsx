import {
  Activity,
  BarChart3,
  BrainCircuit,
  Database,
  Play,
  RefreshCw,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildDemoUrl,
  DemoPayload,
  formatPct,
  lastUpdatedLabel,
  Market,
  marketLabel,
  summarizeBacktest,
  Timeframe
} from "./lib/research";

const defaultSymbols: Record<Market, string> = {
  ashare: "600000",
  us: "AAPL",
  crypto: "BTC/USDT"
};

const fallbackPayload: DemoPayload = {
  quality: {
    source: "local-demo",
    is_complete: true,
    warnings: ["启动 Python 服务后可同步本地缓存数据。"],
    rows: 80
  },
  strategy: {
    name: "SMA trend demo",
    revision: "local"
  },
  backtest: {
    metrics: {
      total_return_pct: 6.12,
      annual_return_pct: 8.9,
      max_drawdown_pct: 4.7,
      win_rate_pct: 52.0,
      profit_factor: 1.34,
      trade_count: 12
    },
    trades: [
      { side: "buy", timestamp: "2026-01-08T00:00:00+00:00", price: 101.2, quantity: 79, reason: "entry_conditions" },
      { side: "sell", timestamp: "2026-02-12T00:00:00+00:00", price: 108.4, quantity: 79, reason: "exit_conditions" }
    ],
    equity_curve: Array.from({ length: 40 }, (_, index) => ({
      timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
      equity: 100000 + index * 120 + Math.sin(index / 2) * 1200
    }))
  },
  aiReport: {
    summary: "SMA trend demo 当前样本表现为温和正收益，回撤可控，但仍需要扩大样本和加入费用压力测试。",
    risks: ["样本来自演示数据，不能代表真实市场。", "分钟级策略需要持续缓存后再评估稳定性。"],
    improvements: ["加入沪深 300 或 SPY 基准对比。", "对 SMA 窗口做滚动验证，观察参数敏感度。"],
    disclaimer: "研究报告仅用于复盘和风险识别，不构成投资建议或收益承诺。"
  },
  bars: Array.from({ length: 40 }, (_, index) => ({
    timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    open: 100 + index * 0.2,
    high: 102 + index * 0.24,
    low: 98 + index * 0.12,
    close: 100 + index * 0.2 + Math.sin(index / 3) * 4,
    volume: 10000 + index * 120
  }))
};

export function App() {
  const [market, setMarket] = useState<Market>("ashare");
  const [symbol, setSymbol] = useState(defaultSymbols.ashare);
  const [timeframe, setTimeframe] = useState<Timeframe>("1d");
  const [apiBase, setApiBase] = useState("http://127.0.0.1:8765");
  const [payload, setPayload] = useState<DemoPayload>(fallbackPayload);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "offline">("idle");

  const summary = useMemo(() => summarizeBacktest(payload), [payload]);
  const chartPath = useMemo(() => buildEquityPath(payload.backtest.equity_curve ?? []), [payload]);
  const candleBars = payload.bars ?? [];

  async function runResearch() {
    setStatus("loading");
    try {
      const response = await fetch(buildDemoUrl(apiBase, market, symbol, timeframe));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setPayload((await response.json()) as DemoPayload);
      setStatus("ready");
    } catch {
      setPayload(fallbackPayload);
      setStatus("offline");
    }
  }

  function changeMarket(nextMarket: Market) {
    setMarket(nextMarket);
    setSymbol(defaultSymbols[nextMarket]);
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">AQ</span>
          <div>
            <strong>AIQuant</strong>
            <span>Research</span>
          </div>
        </div>
        <nav className="nav">
          <a className="active" href="#research">
            <BarChart3 size={18} /> 研究
          </a>
          <a href="#data">
            <Database size={18} /> 数据
          </a>
          <a href="#ai">
            <BrainCircuit size={18} /> AI
          </a>
          <a href="#paper">
            <WalletCards size={18} /> 模拟
          </a>
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">本地研究工作台</p>
            <h1>AI 量化研究平台</h1>
          </div>
          <button className="icon-button" onClick={runResearch} aria-label="运行研究" title="运行研究">
            {status === "loading" ? <RefreshCw className="spin" size={20} /> : <Play size={20} />}
          </button>
        </header>

        <section className="controls" id="research">
          <label>
            市场
            <select value={market} onChange={(event) => changeMarket(event.target.value as Market)}>
              <option value="ashare">A 股</option>
              <option value="us">美股</option>
              <option value="crypto">加密货币</option>
            </select>
          </label>
          <label>
            标的
            <input value={symbol} onChange={(event) => setSymbol(event.target.value)} />
          </label>
          <label>
            周期
            <select value={timeframe} onChange={(event) => setTimeframe(event.target.value as Timeframe)}>
              <option value="1d">日线</option>
              <option value="1m">1 分钟</option>
              <option value="5m">5 分钟</option>
              <option value="15m">15 分钟</option>
            </select>
          </label>
          <label className="api-field">
            本地 API
            <input value={apiBase} onChange={(event) => setApiBase(event.target.value)} />
          </label>
        </section>

        <section className="metrics-grid">
          <MetricCard title="市场" value={marketLabel(market)} detail={symbol} />
          <MetricCard title="总收益" value={summary.totalReturn} detail="Backtest" tone="green" />
          <MetricCard title="最大回撤" value={summary.maxDrawdown} detail="Risk" tone="amber" />
          <MetricCard title="交易记录" value={String(summary.tradeCount)} detail={`${summary.riskCount} 条风险提示`} />
        </section>

        <section className="analysis-grid">
          <div className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Equity Curve</p>
                <h2>{summary.title}</h2>
              </div>
              <span>{summary.revision}</span>
            </div>
            <svg viewBox="0 0 720 260" role="img" aria-label="资金曲线">
              <defs>
                <linearGradient id="equityFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#1f9d8a" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#1f9d8a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${chartPath} L 700 235 L 20 235 Z`} fill="url(#equityFill)" />
              <path d={chartPath} fill="none" stroke="#1f9d8a" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>

          <div className="panel" id="ai">
            <div className="panel-heading compact">
              <BrainCircuit size={20} />
              <h2>AI 研究报告</h2>
            </div>
            <p className="report">{payload.aiReport.summary}</p>
            <div className="note-list">
              {payload.aiReport.risks.map((risk) => (
                <span key={risk}>{risk}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="lower-grid">
          <div className="panel" id="data">
            <div className="panel-heading compact">
              <Database size={20} />
              <h2>数据缓存</h2>
            </div>
            <dl className="facts">
              <div>
                <dt>来源</dt>
                <dd>{payload.quality?.source ?? "demo"}</dd>
              </div>
              <div>
                <dt>行数</dt>
                <dd>{payload.quality?.rows ?? candleBars.length}</dd>
              </div>
              <div>
                <dt>最近</dt>
                <dd>{lastUpdatedLabel(candleBars.at(-1)?.timestamp)}</dd>
              </div>
            </dl>
            <div className="candles" aria-label="K 线缩略图">
              {candleBars.slice(-36).map((bar) => (
                <span
                  key={bar.timestamp}
                  style={{ height: `${Math.max(12, Math.min(80, 28 + (bar.close - bar.open) * 6))}px` }}
                  className={bar.close >= bar.open ? "up" : "down"}
                />
              ))}
            </div>
          </div>

          <div className="panel" id="paper">
            <div className="panel-heading compact">
              <ShieldCheck size={20} />
              <h2>模拟执行</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>方向</th>
                  <th>价格</th>
                  <th>原因</th>
                </tr>
              </thead>
              <tbody>
                {payload.backtest.trades.slice(-5).map((trade, index) => (
                  <tr key={`${trade.timestamp}-${index}`}>
                    <td>{trade.side === "buy" ? "开仓" : "平仓"}</td>
                    <td>{trade.price?.toFixed(2) ?? "-"}</td>
                    <td>{trade.reason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer>
          <Activity size={16} />
          <span>
            {status === "offline"
              ? "本地 API 未连接，当前显示演示数据"
              : status === "ready"
                ? "已同步本地 Python 核心"
                : "待运行"}
          </span>
          <span>{payload.aiReport.disclaimer}</span>
        </footer>
      </main>
    </div>
  );
}

function MetricCard({ title, value, detail, tone }: { title: string; value: string; detail: string; tone?: string }) {
  return (
    <article className={`metric ${tone ?? ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function buildEquityPath(points: { equity: number }[]): string {
  if (!points.length) {
    return "M 20 235 L 700 235";
  }
  const values = points.map((point) => point.equity);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  return points
    .map((point, index) => {
      const x = 20 + (index / Math.max(points.length - 1, 1)) * 680;
      const y = 235 - ((point.equity - min) / span) * 200;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
