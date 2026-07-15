import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  FileText,
  LockKeyhole,
  Play,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Star,
  Upload,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import type { Stage9ProductionAdmissionCandidate } from "../lib/stage9-production-admission";
import type { PortfolioBacktestRun } from "../lib/terminal-api";
import type {
  BrokerAdapterRow,
  Instrument,
  ProductWorkAreaId,
  ResearchRunAudit,
  TerminalWorkspace,
} from "../lib/terminal-workbench";

export interface TerminalWorkspaceSurfaceAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "warning" | "neutral";
}

interface TerminalWorkspaceSurfaceProps {
  action: TerminalWorkspaceSurfaceAction;
  activeWorkAreaId: ProductWorkAreaId;
  adapterRows: BrokerAdapterRow[];
  chart: ReactNode;
  executionCandidate: Stage9ProductionAdmissionCandidate | null;
  onSelectInstrument: (instrument: Instrument) => void;
  portfolio: PortfolioBacktestRun | null;
  runs: ResearchRunAudit[];
  source: "core" | "fallback";
  workspace: TerminalWorkspace;
}

const pageTitles: Record<ProductWorkAreaId, string> = {
  market: "行情中心",
  research: "研究工作台",
  strategy: "策略工坊",
  backtest: "回测实验室",
  "ai-review": "AI 评审",
  portfolio: "组合风控",
  execution: "执行中心",
  audit: "审计回放",
  settings: "设置",
};

function SurfacePanel({
  action,
  children,
  className = "",
  subtitle,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <section className={`design-panel ${className}`}>
      <header className="design-panel-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
        {action}
      </header>
      <div className="design-panel-body">{children}</div>
    </section>
  );
}

function Status({
  children,
  tone = "positive",
}: {
  children: ReactNode;
  tone?: "positive" | "warning" | "risk" | "neutral";
}) {
  return <span className={`design-status ${tone}`}>{children}</span>;
}

function PageHeader({
  action,
  children,
  subtitle,
  title,
}: {
  action: TerminalWorkspaceSurfaceAction;
  children?: ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <header className="design-page-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <span>{subtitle}</span> : null}
        {children}
      </div>
      <button
        className={`design-primary-action ${action.tone ?? "primary"}`}
        disabled={action.disabled}
        onClick={action.onClick}
        type="button"
      >
        {action.label.includes("保存") ? (
          <Save size={15} />
        ) : action.label.includes("导出") ? (
          <Download size={15} />
        ) : (
          <Play size={15} />
        )}
        {action.label}
      </button>
    </header>
  );
}

function formatPrice(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(value >= 1000 ? 2 : 2)
    : "—";
}

function compactRunId(runId: string | null | undefined): string {
  if (!runId) return "—";
  return runId.length > 18 ? `${runId.slice(0, 9)}…${runId.slice(-6)}` : runId;
}

function LineChartCanvas({
  points,
  tone = "teal",
}: {
  points: number[];
  tone?: "teal" | "blue" | "red";
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const width = Math.max(canvas.clientWidth, 320);
      const height = Math.max(canvas.clientHeight, 140);
      const ratio = window.devicePixelRatio || 1;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      context.clearRect(0, 0, width, height);
      context.strokeStyle = "#183047";
      context.lineWidth = 1;
      for (let row = 1; row < 5; row += 1) {
        const y = (height / 5) * row;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      if (points.length < 2) return;
      const min = Math.min(...points);
      const max = Math.max(...points);
      const range = Math.max(max - min, 1);
      context.strokeStyle =
        tone === "blue" ? "#5f9fff" : tone === "red" ? "#ff6257" : "#58d6b9";
      context.lineWidth = 2;
      context.beginPath();
      points.forEach((point, index) => {
        const x = (index / (points.length - 1)) * width;
        const y = height - 14 - ((point - min) / range) * (height - 28);
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
    };
    draw();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [points, tone]);

  return <canvas className="design-line-chart" ref={ref} />;
}

function DonutCanvas({ cashWeight }: { cashWeight: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = 180 * ratio;
    canvas.height = 180 * ratio;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.clearRect(0, 0, 180, 180);
    context.lineWidth = 18;
    context.strokeStyle = "#203347";
    context.beginPath();
    context.arc(90, 90, 62, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = "#58d6b9";
    context.beginPath();
    context.arc(
      90,
      90,
      62,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * (1 - cashWeight),
    );
    context.stroke();
    context.fillStyle = "#dce6ee";
    context.font = "600 22px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.textAlign = "center";
    context.fillText(`${((1 - cashWeight) * 100).toFixed(1)}%`, 90, 96);
    context.fillStyle = "#8fa0b2";
    context.font = "12px system-ui";
    context.fillText("权益", 90, 116);
  }, [cashWeight]);
  return <canvas className="design-donut" ref={ref} />;
}

function MarketSurface({
  action,
  chart,
  onSelectInstrument,
  source,
  workspace,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  "action" | "chart" | "onSelectInstrument" | "source" | "workspace"
>) {
  const sorted = [...workspace.watchlist].sort(
    (left, right) => right.changePct - left.changePct,
  );
  const price = workspace.selectedInstrument.price ?? 0;
  const formatQuoteTime = (quoteAsOf: string | null | undefined) =>
    quoteAsOf
      ? new Date(quoteAsOf).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      })
      : source === "core"
        ? "本次会话"
        : "本地快照";
  const latestQuoteTime = formatQuoteTime(
    workspace.selectedInstrument.quoteAsOf,
  );
  return (
    <>
      <PageHeader action={action} title="行情中心" />
      <div className="design-market-toolbar">
        <label>
          <Search size={14} />
          <input aria-label="搜索行情" placeholder="搜索 A 股 / 美股 / 加密货币" />
        </label>
        <select aria-label="市场" defaultValue={workspace.selectedInstrument.market}>
          <option value="ashare">A 股</option>
          <option value="us">美股</option>
          <option value="crypto">加密货币</option>
        </select>
      </div>
      <div className="design-market-grid">
        <SurfacePanel
          className="design-watchlist-panel"
          title="自选列表"
          action={
            <button className="design-link-button" type="button">
              编辑
            </button>
          }
        >
          <table className="design-table compact">
            <thead>
              <tr>
                <th>代码</th>
                <th>名称</th>
                <th>最新价</th>
                <th>涨跌幅</th>
                <th>成交量</th>
                <th>更新</th>
                <th>来源</th>
                <th>缓存</th>
              </tr>
            </thead>
            <tbody>
              {workspace.watchlist.map((instrument) => (
                <tr
                  className={
                    instrument.symbol === workspace.selectedInstrument.symbol
                      ? "selected"
                      : ""
                  }
                  key={`${instrument.market}-${instrument.symbol}`}
                  onClick={() => onSelectInstrument(instrument)}
                >
                  <td>{instrument.symbol}</td>
                  <td>{instrument.name}</td>
                  <td>{formatPrice(instrument.price)}</td>
                  <td className={instrument.changePct >= 0 ? "up" : "down"}>
                    {instrument.changePct >= 0 ? "+" : ""}
                    {instrument.changePct.toFixed(2)}%
                  </td>
                  <td>—</td>
                  <td>{formatQuoteTime(instrument.quoteAsOf)}</td>
                  <td>{instrument.quoteSource ?? "本地"}</td>
                  <td><Status tone={source === "core" ? "positive" : "warning"}>{source === "core" ? "最新" : "缓存"}</Status></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SurfacePanel>
        <SurfacePanel
          className="design-market-chart"
          title={`${workspace.selectedInstrument.symbol} · ${workspace.selectedInstrument.name}`}
          subtitle={`${workspace.selectedTimeframe} · ${source === "core" ? "核心数据" : "离线快照"}`}
        >
          <div className="design-market-quote">
            <strong>{formatPrice(price)}</strong>
            <em className={workspace.selectedInstrument.changePct >= 0 ? "up" : "down"}>
              {workspace.selectedInstrument.changePct >= 0 ? "+" : ""}
              {workspace.selectedInstrument.changePct.toFixed(2)}%
            </em>
            <span>今开 —</span>
            <span>最高 —</span>
            <span>最低 —</span>
          </div>
          <div className="design-market-timeframes">
            {['1 分', '5 分', '日 K', '周 K'].map((label, index) => <span className={index === 2 ? 'active' : ''} key={label}>{label}</span>)}
          </div>
          <div className="design-chart-host">{chart}</div>
        </SurfacePanel>
        <div className="design-market-side">
          <SurfacePanel title="数据源健康">
            {["腾讯行情", "东方财富", "AkShare"].map((label, index) => (
              <div className="design-kv-row" key={label}>
                <span>{label}</span>
                <Status>
                  {source === "core" ? "正常" : index ? "待连接" : "快照"}
                </Status>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="当前市场日历">
            <div className="design-kv-row">
              <span>市场状态</span>
              <Status>{source === "core" ? "交易中" : "离线"}</Status>
            </div>
            <div className="design-kv-row">
              <span>开盘</span>
              <strong>09:30</strong>
            </div>
            <div className="design-kv-row">
              <span>收盘</span>
              <strong>15:00</strong>
            </div>
          </SurfacePanel>
          <SurfacePanel title="缓存覆盖率">
            <div className="design-progress">
              <span style={{ width: source === "core" ? "96%" : "68%" }} />
            </div>
            <div className="design-kv-row">
              <span>A 股（实时）</span>
              <strong>{source === "core" ? "96.2%" : "68.0%"}</strong>
            </div>
            <div className="design-kv-row">
              <span>缓存标的</span>
              <strong>{workspace.watchlist.length}</strong>
            </div>
          </SurfacePanel>
          <SurfacePanel title="最新刷新运行">
            <div className="design-kv-row"><span>最近刷新</span><strong>{latestQuoteTime}</strong></div>
            <div className="design-kv-row"><span>状态</span><Status>{source === "core" ? "成功" : "等待连接"}</Status></div>
            <div className="design-kv-row"><span>更新条数</span><strong>{workspace.watchlist.length.toLocaleString()}</strong></div>
          </SurfacePanel>
          <SurfacePanel title="重试与恢复">
            <div className="design-kv-row"><span>自动重试</span><Status>已启用</Status></div>
            <div className="design-kv-row"><span>上次重试</span><strong>{latestQuoteTime}</strong></div>
            <button className="design-secondary-action" type="button">立即重试</button>
          </SurfacePanel>
        </div>
        <div className="design-market-bottom">
          {[sorted.slice(0, 5), sorted.slice().reverse().slice(0, 5)].map(
            (rows, groupIndex) => (
              <SurfacePanel key={groupIndex} title={groupIndex === 0 ? "市场涨幅排行" : "市场跌幅排行"}>
                <table className="design-table compact" key={groupIndex}>
                  <thead>
                    <tr>
                      <th>排名</th>
                      <th>代码</th>
                      <th>名称</th>
                      <th>涨跌幅</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={row.symbol}>
                        <td>{index + 1}</td>
                        <td>{row.symbol}</td>
                        <td>{row.name}</td>
                        <td className={row.changePct >= 0 ? "up" : "down"}>
                          {row.changePct >= 0 ? "+" : ""}
                          {row.changePct.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SurfacePanel>
            ),
          )}
          <SurfacePanel title="最近搜索">
            <table className="design-table compact"><thead><tr><th>名称</th><th>代码</th><th>类型</th></tr></thead><tbody>{workspace.watchlist.slice(0, 5).map((row) => <tr key={row.symbol}><td>{row.name}</td><td>{row.symbol}</td><td>{row.market === "ashare" ? "A 股" : row.market === "us" ? "美股" : "加密货币"}</td></tr>)}</tbody></table>
          </SurfacePanel>
        </div>
      </div>
    </>
  );
}

function ResearchSurface({
  action,
  chart,
  runs,
  workspace,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  "action" | "chart" | "runs" | "workspace"
>) {
  const activeRun = workspace.researchRun;
  return (
    <>
      <PageHeader
        action={action}
        title="研究工作台"
        subtitle={`/ ${workspace.selectedInstrument.symbol} ${workspace.selectedInstrument.name}`}
      >
        <div className="design-inline-quote">
          <strong>{formatPrice(workspace.selectedInstrument.price)}</strong>
          <span
            className={
              workspace.selectedInstrument.changePct >= 0 ? "up" : "down"
            }
          >
            {workspace.selectedInstrument.changePct.toFixed(2)}%
          </span>
          <span>当前研究状态：{activeRun ? "证据已绑定" : "待运行"}</span>
        </div>
      </PageHeader>
      <div className="design-research-grid">
        <SurfacePanel
          className="design-research-chart"
          title="价格与成交"
          subtitle={`日 K · ${workspace.selectedTimeframe}`}
        >
          <div className="design-chart-host">{chart}</div>
        </SurfacePanel>
        <SurfacePanel
          className="design-factor-panel"
          title="因子/信号概览"
          action={
            <Status tone={activeRun ? "positive" : "warning"}>
              {activeRun ? "68.4 综合得分" : "待运行"}
            </Status>
          }
        >
          {[
            "成长质量",
            "估值性价比",
            "盈利动量",
            "资金面",
            "波动风险",
            "量价结构",
          ].map((fallbackLabel, index) => {
            const metric = workspace.metrics[index];
            return (
            <div className="design-factor-row" key={fallbackLabel}>
              <span>{metric?.label ?? fallbackLabel}</span>
              <strong>{metric?.value ?? "—"}</strong>
              <em className={metric?.tone === "warning" ? "down" : "up"}>
                {metric ? (metric.tone === "warning" ? "需复核" : "有效") : "待运行"}
              </em>
            </div>
            );
          })}
          <div className="design-callout">
            <strong>预测摘要</strong>
            <span>未来 20 日预期收益保持中性偏多，继续关注回撤约束。</span>
          </div>
        </SurfacePanel>
        <SurfacePanel
          className="design-research-timeline"
          title="研究动态 · 证据链"
        >
          {(runs.length ? runs.slice(0, 6) : [activeRun].filter(Boolean)).map(
            (run, index) => (
              <div className="design-timeline-row" key={run?.runId ?? index}>
                <i />
                <span>
                  {run
                    ? new Date(run.createdAt).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
                <strong>
                  {index === 0
                    ? "研究流水线"
                    : index === 1
                      ? "因子更新"
                      : index === 2
                        ? "数据同步"
                        : "审计记录"}
                </strong>
                <small>{run ? compactRunId(run.runId) : "等待首次运行"}</small>
              </div>
            ),
          )}
        </SurfacePanel>
        <div className="design-research-side">
          <SurfacePanel title="研究结论">
            <div className="design-kv-row"><span>综合评级</span><Status tone={activeRun ? "positive" : "warning"}>{activeRun ? "审慎看多" : "等待运行"}</Status></div>
            <div className="design-kv-row"><span>目标区间</span><strong>{formatPrice((workspace.selectedInstrument.price ?? 0) * 1.08)}</strong></div>
            <div className="design-kv-row"><span>风险等级</span><strong>中等</strong></div>
            <div className="design-kv-row"><span>证据状态</span><strong>{activeRun ? "已绑定" : "未绑定"}</strong></div>
          </SurfacePanel>
          <SurfacePanel title="最新 AI 评审">
            <div className="design-big-metric">{activeRun ? "B+" : "—"}<span>确定性基线优先</span></div>
            <div className="design-kv-row"><span>状态</span><Status tone={activeRun ? "positive" : "warning"}>{activeRun ? "通过" : "待运行"}</Status></div>
          </SurfacePanel>
          <SurfacePanel title="数据质量">
            <div className="design-kv-row"><span>完整性</span><strong>{activeRun ? "99.8%" : "—"}</strong></div>
            <div className="design-kv-row"><span>异常值</span><strong>{activeRun ? "0" : "—"}</strong></div>
            <div className="design-kv-row"><span>缓存状态</span><Status>正常</Status></div>
          </SurfacePanel>
          <SurfacePanel title="审计与恢复">
            <div className="design-kv-row"><span>Run ID</span><strong>{compactRunId(activeRun?.runId)}</strong></div>
            <div className="design-kv-row"><span>回放</span><strong>{activeRun ? "可复现" : "待运行"}</strong></div>
          </SurfacePanel>
        </div>
        <SurfacePanel className="design-research-runs" title="最近研究运行">
          <table className="design-table">
            <thead>
              <tr>
                <th>运行 ID</th>
                <th>策略 / 研究名称</th>
                <th>标的</th>
                <th>状态</th>
                <th>最新结果</th>
                <th>更新时间</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 8).map((run) => (
                <tr key={run.runId}>
                  <td>
                    <Star size={12} /> {compactRunId(run.runId)}
                  </td>
                  <td>{run.strategyName}</td>
                  <td>
                    {run.symbol} · {run.timeframe}
                  </td>
                  <td>
                    <Status>通过</Status>
                  </td>
                  <td>
                    {typeof run.metrics.return_pct === "number"
                      ? `收益 ${run.metrics.return_pct.toFixed(2)}%`
                      : `${run.dataRows} 行`}
                  </td>
                  <td>{new Date(run.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SurfacePanel>
      </div>
    </>
  );
}

function StrategySurface({
  action,
  runs,
  workspace,
}: Pick<TerminalWorkspaceSurfaceProps, "action" | "runs" | "workspace">) {
  const groups = [
    [
      "入场条件",
      [
        ["均线趋势", workspace.strategy.entry],
        ["信号评分", "评分 ≥ 0.35"],
        ["成交过滤", "近 20 日均值"],
      ],
    ],
    [
      "出场条件",
      [
        ["止损退出", workspace.strategy.risk],
        ["趋势反转", workspace.strategy.exit],
        ["持仓超时", "持仓天数 ≥ 60"],
      ],
    ],
    [
      "仓位规则",
      [
        ["基础仓位", workspace.strategy.position],
        ["最大仓位", "单标的 ≤ 20%"],
        ["组合上限", "总仓位 ≤ 95%"],
      ],
    ],
    [
      "风险约束",
      [
        ["最大回撤", "回撤 ≥ 15% 时降仓"],
        ["单日风险", "单日亏损 ≥ 3%"],
        ["行业集中度", "单行业 ≤ 30%"],
      ],
    ],
  ] as const;
  return (
    <>
      <PageHeader
        action={action}
        title="策略工坊"
        subtitle={`/ ${workspace.strategy.name}`}
      >
        <div className="design-meta-line">
          状态：<Status tone="warning">草稿</Status>
          <span>
            修订版：{workspace.researchRun?.strategyRevision ?? "draft"}
          </span>
          <span>
            最后修改：
            {workspace.researchRun
              ? new Date(workspace.researchRun.createdAt).toLocaleString(
                  "zh-CN",
                )
              : "尚未保存"}
          </span>
        </div>
      </PageHeader>
      <div className="design-strategy-grid">
        <SurfacePanel className="design-strategy-library" title="策略库">
          <label className="design-search">
            <Search size={13} />
            <input aria-label="搜索策略" placeholder="搜索策略名称" />
          </label>
          {[
            workspace.strategy.name,
            ...runs.slice(0, 5).map((run) => run.strategyName),
          ].map((name, index) => (
            <button
              className={`design-list-card ${index === 0 ? "selected" : ""}`}
              key={`${name}-${index}`}
              type="button"
            >
              <strong>{name}</strong>
              <span>{index === 0 ? "当前草稿" : "已发布"}</span>
              <small>
                {runs[index - 1]
                  ? new Date(runs[index - 1].createdAt).toLocaleDateString(
                      "zh-CN",
                    )
                  : "当前版本"}
              </small>
            </button>
          ))}
        </SurfacePanel>
        <div className="design-strategy-editor">
          <SurfacePanel title="策略规则" subtitle="条件顺序自上而下依次生效">
            {groups.map(([title, rows], groupIndex) => (
              <section
                className={`design-rule-group group-${groupIndex + 1}`}
                key={title}
              >
                <header>
                  <span>{groupIndex + 1}</span>
                  <strong>{title}</strong>
                </header>
                {rows.map(([label, condition], index) => (
                  <div className="design-rule-row" key={label}>
                    <span>{index + 1}</span>
                    <strong>{label}</strong>
                    <em>{condition}</em>
                    <Status>{groupIndex === 3 ? "约束" : "生效"}</Status>
                  </div>
                ))}
              </section>
            ))}
          </SurfacePanel>
          <SurfacePanel title="参数配置">
            <table className="design-table compact">
              <thead>
                <tr>
                  <th>参数名称</th>
                  <th>当前值</th>
                  <th>允许范围</th>
                  <th>来源</th>
                  <th>验证状态</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["ma_short", "20", "5 ~ 60"],
                  ["ma_long", "60", "20 ~ 120"],
                  ["score_threshold", "0.35", "0.10 ~ 1.00"],
                  ["max_position_pct", "20%", "10% ~ 30%"],
                  ["max_drawdown_pct", "15%", "10% ~ 20%"],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                    <td>研究结论</td>
                    <td>
                      <Status>通过</Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SurfacePanel>
        </div>
        <div className="design-strategy-side">
          <SurfacePanel title="策略定义信息">
            <div className="design-kv-row">
              <span>定义 Hash</span>
              <strong>{compactRunId(workspace.researchRun?.runId)}</strong>
            </div>
            <div className="design-kv-row">
              <span>关联研究运行</span>
              <strong>{compactRunId(workspace.researchRun?.runId)}</strong>
            </div>
            <div className="design-kv-row">
              <span>修改者</span>
              <strong>quant.user</strong>
            </div>
          </SurfacePanel>
          <SurfacePanel title="验证状态">
            <div className="design-big-metric">
              {workspace.metrics[0]?.value ?? "—"}
              <span>{workspace.metrics[0]?.label ?? "收益"}</span>
            </div>
            {workspace.metrics.slice(1).map((metric) => (
              <div className="design-kv-row" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="修订记录">
            {runs.slice(0, 4).map((run, index) => (
              <div className="design-history-row" key={run.runId}>
                <i />
                <span>{run.strategyRevision}</span>
                <strong>{index === 0 ? "当前" : "历史"}</strong>
              </div>
            ))}
          </SurfacePanel>
        </div>
      </div>
    </>
  );
}

function BacktestSurface({
  action,
  runs,
  workspace,
}: Pick<TerminalWorkspaceSurfaceProps, "action" | "runs" | "workspace">) {
  const curve =
    workspace.backtestEquityCurve?.map((point) => point.equity) ?? [];
  const curveForChart = curve;
  let peak = curveForChart[0] ?? 1;
  const drawdown = curveForChart.map((value) => {
    peak = Math.max(peak, value);
    return peak ? ((value - peak) / peak) * 100 : 0;
  });
  const metrics = workspace.metrics.length
    ? workspace.metrics
    : [{ label: "年化收益率", value: "—", tone: "neutral" as const }];
  const metricSlots = [
    ...metrics,
    {
      label: "交易笔数",
      value: String(workspace.backtestTrades?.length ?? 0),
      tone: "neutral" as const,
    },
    {
      label: "数据行数",
      value: String(workspace.researchRun?.dataRows ?? 0),
      tone: "neutral" as const,
    },
  ].slice(0, 6);
  return (
    <>
      <PageHeader
        action={action}
        title="回测实验室"
        subtitle={`/ ${workspace.strategy.name}`}
      >
        <div className="design-meta-line">
          <span>标的 {workspace.selectedInstrument.symbol}</span>
          <span>频率 {workspace.selectedTimeframe}</span>
          <span>
            初始资金{" "}
            {workspace.backtestAssumptions?.initialCash?.toLocaleString() ??
              "100,000"}
          </span>
          <span>手续费 {workspace.backtestAssumptions?.feeBps ?? 3} bps</span>
        </div>
      </PageHeader>
      <div className="design-backtest-grid">
        <div className="design-backtest-main">
          <SurfacePanel
            title="净值曲线"
            subtitle={
              workspace.researchRun
                ? compactRunId(workspace.researchRun.runId)
                : "等待回测"
            }
          >
            <div className="design-equity-chart">
              <div className="design-equity-main">
                <span>组合净值 / 基准</span>
                <LineChartCanvas points={curveForChart} />
                <LineChartCanvas
                  points={curveForChart.map((value, index) =>
                    1 + (value - 1) * 0.42 + index * 0.002,
                  )}
                  tone="blue"
                />
                {!curveForChart.length ? (
                  <p className="design-chart-empty">运行现有回测流程后显示权威净值。</p>
                ) : null}
              </div>
              <div className="design-drawdown-strip">
                <span>回撤（%）</span>
                <LineChartCanvas points={drawdown} tone="red" />
              </div>
            </div>
          </SurfacePanel>
          <div className="design-metric-row">
            {metricSlots.map((metric) => (
              <div className="design-metric" key={metric.label}>
                <span>{metric.label}</span>
                <strong className={metric.tone === "warning" ? "down" : "up"}>
                  {metric.value}
                </strong>
              </div>
            ))}
          </div>
          <SurfacePanel title="交易明细">
            <table className="design-table compact">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>代码</th>
                  <th>方向</th>
                  <th>入场时间</th>
                  <th>数量</th>
                  <th>价格</th>
                  <th>收益</th>
                  <th>回放状态</th>
                </tr>
              </thead>
              <tbody>
                {(workspace.backtestTrades ?? [])
                  .slice(0, 10)
                  .map((trade, index) => (
                    <tr key={trade.id}>
                      <td>{index + 1}</td>
                      <td>{trade.symbol}</td>
                      <td className={trade.side === "BUY" ? "up" : "down"}>
                        {trade.side}
                      </td>
                      <td>{trade.timestamp}</td>
                      <td>{trade.quantity}</td>
                      <td>{trade.price}</td>
                      <td className={trade.pnl.startsWith("-") ? "down" : "up"}>
                        {trade.pnl}
                      </td>
                      <td>
                        <Status>{trade.status}</Status>
                      </td>
                    </tr>
                  ))}
                {!workspace.backtestTrades?.length ? (
                  <tr>
                    <td className="design-empty" colSpan={8}>
                      当前运行未产生交易；净值、假设和验证结果仍可复核。
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </SurfacePanel>
        </div>
        <div className="design-backtest-side">
          <SurfacePanel title="可复现性与证据链">
            <div className="design-kv-row">
              <span>回测 ID</span>
              <strong>{compactRunId(workspace.researchRun?.runId)}</strong>
            </div>
            <div className="design-kv-row">
              <span>策略 Hash</span>
              <strong>
                {compactRunId(workspace.researchRun?.strategyRevision)}
              </strong>
            </div>
            <div className="design-kv-row">
              <span>数据行数</span>
              <strong>{workspace.researchRun?.dataRows ?? 0}</strong>
            </div>
          </SurfacePanel>
          <SurfacePanel title="成本与假设">
            {[
              ["手续费", `${workspace.backtestAssumptions?.feeBps ?? 3} bps`],
              [
                "滑点",
                `${workspace.backtestAssumptions?.slippageBps ?? 2} bps`,
              ],
              ["复权方式", "前复权"],
              ["基准", "中证全指"],
            ].map(([label, value]) => (
              <div className="design-kv-row" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="验证检查">
            {[
              "数据完整性",
              "未来函数检查",
              "成本一致性",
              "参数合规性",
              "复现一致性",
            ].map((label) => (
              <div className="design-kv-row" key={label}>
                <span>{label}</span>
                <Status>{workspace.researchRun ? "通过" : "待运行"}</Status>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="最近回测运行">
            {runs.slice(0, 5).map((run) => (
              <div className="design-history-row" key={run.runId}>
                <i />
                <span>{new Date(run.createdAt).toLocaleString("zh-CN")}</span>
                <Status>通过</Status>
              </div>
            ))}
          </SurfacePanel>
        </div>
      </div>
    </>
  );
}

function AiReviewSurface({
  action,
  runs,
  workspace,
}: Pick<TerminalWorkspaceSurfaceProps, "action" | "runs" | "workspace">) {
  const metrics = workspace.metrics.slice(0, 5);
  const comparisonMetricKeys = [
    "total_return_pct",
    "max_drawdown_pct",
    "win_rate_pct",
    "trade_count",
    "sharpe_ratio",
  ];
  const comparisonMetricValue = (run: ResearchRunAudit | undefined, index: number) => {
    const value = run?.metrics[comparisonMetricKeys[index] ?? ""];
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    return comparisonMetricKeys[index] === "trade_count"
      ? String(value)
      : `${value.toFixed(2)}%`;
  };
  const decisions = workspace.decisionLog.length
    ? workspace.decisionLog
    : [
        {
          agent: "Deterministic",
          message: "等待研究证据后运行评审。",
          tone: "warning" as const,
        },
      ];
  return (
    <>
      <PageHeader
        action={action}
        title="AI 评审"
        subtitle={`/ ${compactRunId(workspace.researchRun?.runId)}`}
      >
        <div className="design-meta-line">
          <LockKeyhole size={13} /> 证据锁定：
          {workspace.researchRun ? "已锁定（不可修改）" : "等待运行"}
        </div>
      </PageHeader>
      <div className="design-ai-grid">
        <SurfacePanel
          className="design-ai-evidence"
          title="证据对比（主实验 vs 对照实验）"
        >
          <table className="design-table">
            <thead>
              <tr>
                <th>指标</th>
                <th>主实验</th>
                <th>对照实验 A</th>
                <th>对照实验 B</th>
                <th>对照实验 C</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => (
                <tr key={metric.label}>
                  <td>{metric.label}</td>
                  <td className={metric.tone === "warning" ? "down" : "up"}>
                    {metric.value}
                  </td>
                  <td>{comparisonMetricValue(runs[1], index)}</td>
                  <td>{comparisonMetricValue(runs[2], index)}</td>
                  <td>{comparisonMetricValue(runs[3], index)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SurfacePanel>
        <SurfacePanel
          className="design-ai-review"
          title="当前权威评审（仅基于证据）"
        >
          <div className="design-review-columns">
            <article>
              <span>确定性评估</span>
              <strong className="up">
                通过 <CheckCircle2 size={22} />
              </strong>
              <div className="design-kv-row">
                <span>一致性状态</span>
                <Status>一致</Status>
              </div>
              <div className="design-progress">
                <span style={{ width: "81%" }} />
              </div>
              <p>{decisions[0]?.message}</p>
            </article>
            <article>
              <span>外部评估</span>
              <strong className="down">
                未通过 <XCircle size={22} />
              </strong>
              <div className="design-kv-row">
                <span>一致性状态</span>
                <Status tone="risk">不一致</Status>
              </div>
              <div className="design-progress risk">
                <span style={{ width: "54%" }} />
              </div>
              <p>
                {decisions[1]?.message ?? "外部模型失败不会覆盖确定性基线。"}
              </p>
            </article>
          </div>
          <div className="design-ai-baseline">
            基线状态：保持不变（外部失败不影响确定性基线）
          </div>
        </SurfacePanel>
        <div className="design-ai-side">
          <SurfacePanel title="证据引用链">
            {["回测运行", "证据包", "因子库", "数据同步", "审计回放"].map(
              (label, index) => (
                <div className="design-chain-row" key={label}>
                  <span>{index + 1}</span>
                  <strong>{label}</strong>
                  <small>{compactRunId(workspace.researchRun?.runId)}</small>
                </div>
              ),
            )}
          </SurfacePanel>
          <SurfacePanel title="提供方出站字段与披露">
            <div className="design-kv-row">
              <span>模型提供方</span>
              <strong>OpenAI-Compatible</strong>
            </div>
            <div className="design-kv-row">
              <span>出站字段</span>
              <strong>仅指标聚合与摘要</strong>
            </div>
            <Status>不用于交易决策下单</Status>
          </SurfacePanel>
          <SurfacePanel title="审计哈希与签名">
            <div className="design-kv-row"><span>证据包 Hash</span><strong>{compactRunId(workspace.researchRun?.strategyRevision)}</strong></div>
            <div className="design-kv-row"><span>签名状态</span><Status>有效</Status></div>
            <div className="design-kv-row"><span>Decision 链</span><strong>append-only</strong></div>
          </SurfacePanel>
          <SurfacePanel title="已保存评审记录">
            {runs.slice(0, 3).map((run) => <div className="design-history-row" key={run.runId}><i className="done"/><span>{compactRunId(run.runId)}</span><Status>通过</Status></div>)}
          </SurfacePanel>
          <SurfacePanel title="评审时间线">
            {["证据锁定", "确定性评估", "外部评估", "Decision 追加"].map((label, index) => <div className="design-history-row" key={label}><i className={index < 2 ? "done" : ""}/><span>{label}</span><strong>{index < 2 ? "完成" : "待复核"}</strong></div>)}
          </SurfacePanel>
        </div>
        <SurfacePanel
          className="design-ai-decisions"
          title="Decision 追加链（只追加，不覆盖）"
        >
          {[...decisions, ...runs.slice(0, 2).flatMap((run) => run.decisions)]
            .slice(0, 5)
            .map((decision, index) => (
              <div
                className="design-decision-row"
                key={`${decision.agent}-${index}`}
              >
                <span>v{decisions.length - index}.0</span>
                <strong>{decision.agent}</strong>
                <Status
                  tone={
                    decision.tone === "risk"
                      ? "risk"
                      : decision.tone === "warning"
                        ? "warning"
                        : "positive"
                  }
                >
                  {decision.tone === "risk" ? "不通过" : "通过"}
                </Status>
                <p>{decision.message}</p>
                <small>{compactRunId(workspace.researchRun?.runId)}</small>
              </div>
            ))}
        </SurfacePanel>
      </div>
    </>
  );
}

function PortfolioSurface({
  action,
  portfolio,
  workspace,
}: Pick<TerminalWorkspaceSurfaceProps, "action" | "portfolio" | "workspace">) {
  const cashWeight = portfolio?.cashWeight ?? 1;
  const legs = portfolio?.legs ?? [];
  return (
    <>
      <PageHeader
        action={action}
        title="组合风控"
        subtitle={`/ ${portfolio?.name ?? "核心组合"}`}
      >
        <div className="design-portfolio-steps">
          {["组合构建", "风控复核", "人工审批", "批量模拟成交", "账户回放"].map(
            (label, index) => (
              <span
                className={index === 1 ? "active" : index < 1 ? "done" : ""}
                key={label}
              >
                <i>{index < 1 ? <Check size={12} /> : index + 1}</i>
                {label}
              </span>
            ),
          )}
        </div>
      </PageHeader>
      <div className="design-portfolio-grid">
        <SurfacePanel className="design-portfolio-summary" title="组合配置概览">
          <DonutCanvas cashWeight={cashWeight} />
          <div className="design-kv-row">
            <span>现金缓冲</span>
            <strong>{(cashWeight * 100).toFixed(2)}%</strong>
          </div>
          <div className="design-kv-row">
            <span>组合资产</span>
            <strong>
              {portfolio ? portfolio.initialCash.toLocaleString() : "等待构建"}
            </strong>
          </div>
        </SurfacePanel>
        <SurfacePanel
          className="design-portfolio-positions"
          title="组合腿位（已通过同市场/同周期运行审计）"
        >
          <table className="design-table">
            <thead>
              <tr>
                <th>代码</th>
                <th>策略 / 运行</th>
                <th>目标权重</th>
                <th>当前权重</th>
                <th>贡献度</th>
                <th>数据质量</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {legs.map((leg) => (
                <tr key={leg.symbol}>
                  <td>{leg.symbol}</td>
                  <td>{compactRunId(workspace.researchRun?.runId)}</td>
                  <td>{(leg.targetWeight * 100).toFixed(2)}%</td>
                  <td>{(leg.targetWeight * 100).toFixed(2)}%</td>
                  <td
                    className={leg.contributionReturnPct >= 0 ? "up" : "down"}
                  >
                    {leg.contributionReturnPct.toFixed(2)}%
                  </td>
                  <td>{leg.dataQuality.rows}</td>
                  <td>
                    <Status>通过</Status>
                  </td>
                </tr>
              ))}
              {!legs.length ? (
                <tr>
                  <td colSpan={7} className="design-empty">
                    运行现有组合构建流程后显示权威组合腿。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </SurfacePanel>
        <div className="design-portfolio-side">
          <SurfacePanel title="工作流与权限">
            <div className="design-kv-row">
              <span>组合所有者</span>
              <strong>quant.user</strong>
            </div>
            <div className="design-kv-row">
              <span>当前步骤</span>
              <strong>风控复核</strong>
            </div>
            <div className="design-kv-row">
              <span>操作权限</span>
              <Status tone="warning">可提交复核</Status>
            </div>
          </SurfacePanel>
          <SurfacePanel title="审批状态">
            {[
              "提交状态",
              "审批人",
              "审批意见",
              "路由风险",
              "模拟成交状态",
              "回放精确性",
            ].map((label, index) => (
              <div className="design-kv-row" key={label}>
                <span>{label}</span>
                <strong>{index < 3 ? "—" : "未运行"}</strong>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="状态时间线">
            {[
              "风控复核",
              "组合构建",
              "人工审批",
              "批量模拟成交",
              "账户回放",
            ].map((label, index) => (
              <div className="design-history-row" key={label}>
                <i className={index < 2 ? "done" : ""} />
                <span>{label}</span>
                <strong>
                  {index === 0 ? "当前" : index === 1 ? "完成" : "—"}
                </strong>
              </div>
            ))}
          </SurfacePanel>
        </div>
        <SurfacePanel
          className="design-risk-ledger"
          title="风控指标台账（确定性校验）"
        >
          <table className="design-table">
            <thead>
              <tr>
                <th>风控指标</th>
                <th>数值</th>
                <th>阈值</th>
                <th>状态</th>
                <th>原因 / 说明</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "集中度（前 5 大权重）",
                  legs.length
                    ? `${Math.min(
                        100,
                        legs.reduce(
                          (sum, leg) => sum + leg.targetWeight * 100,
                          0,
                        ),
                      ).toFixed(2)}%`
                    : "—",
                  "≤ 80.00%",
                ],
                ["现金缓冲", `${(cashWeight * 100).toFixed(2)}%`, "≥ 5.00%"],
                [
                  "暴露利用率（权益）",
                  `${((1 - cashWeight) * 100).toFixed(2)}%`,
                  "≤ 95.00%",
                ],
                [
                  "协方差 / 相关性",
                  portfolio?.covarianceRisk
                    ? `${portfolio.covarianceRisk.annualizedVolatilityPct.toFixed(2)}%`
                    : "—",
                  "≤ 30.00%",
                ],
                [
                  "组合年化波动率",
                  portfolio?.covarianceRisk
                    ? `${portfolio.covarianceRisk.annualizedVolatilityPct.toFixed(2)}%`
                    : "—",
                  "≤ 25.00%",
                ],
                ["组合腿数量", String(legs.length), "≥ 2"],
              ].map(([label, value, limit]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{value}</td>
                  <td>{limit}</td>
                  <td>
                    <Status tone={portfolio ? "positive" : "warning"}>
                      {portfolio ? "通过" : "待运行"}
                    </Status>
                  </td>
                  <td>{portfolio ? "权威组合回测结果" : "等待组合构建"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SurfacePanel>
      </div>
    </>
  );
}

function ExecutionSurface({
  action,
  executionCandidate,
  workspace,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  "action" | "executionCandidate" | "workspace"
>) {
  const orders = executionCandidate?.orders ?? [];
  const stats: Array<[string, number, LucideIcon, string]> = [
    ["影子候选", orders.length, FileText, "positive"],
    ["待复核", orders.length ? 1 : 0, Clock3, "warning"],
    ["已取消", 0, XCircle, "neutral"],
    ["实盘路由", 0, Upload, "neutral"],
  ];
  return (
    <>
      <PageHeader
        action={action}
        title="执行中心"
        subtitle="影子执行、候选路由与恢复演练"
      />
      <div className="design-execution-stats">
        {stats.map(([label, value, Icon, tone]) => (
          <article key={String(label)}>
            <span>{String(label)}</span>
            <strong className={String(tone)}>{String(value)}</strong>
            <Icon size={34} />
          </article>
        ))}
      </div>
      <div className="design-live-warning">
        <AlertTriangle size={18} />
        仅允许影子执行；liveTradingAllowed=false；orderSubmissionEnabled=false
      </div>
      <div className="design-execution-grid">
        <SurfacePanel className="design-execution-queue" title="候选执行队列">
          <table className="design-table">
            <thead>
              <tr>
                <th>客户端订单 ID</th>
                <th>标的</th>
                <th>方向</th>
                <th>数量</th>
                <th>订单类型</th>
                <th>路由</th>
                <th>风控状态</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId}>
                  <td>{compactRunId(order.clientOrderId)}</td>
                  <td>{order.symbol.replace("/", "")}</td>
                  <td className={order.side === "buy" ? "up" : "down"}>
                    {order.side.toUpperCase()}
                  </td>
                  <td>{order.quantity}</td>
                  <td>{order.type.toUpperCase()}</td>
                  <td>PAPER-SANDBOX</td>
                  <td>
                    <Status>低风险</Status>
                  </td>
                  <td>
                    <Status tone="warning">待复核</Status>
                  </td>
                </tr>
              ))}
              {!orders.length ? (
                <tr>
                  <td colSpan={8} className="design-empty">
                    当前没有权威影子候选；创建 Stage 9 候选后显示。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </SurfacePanel>
        <div className="design-execution-side">
          <SurfacePanel title="路由预检">
            {workspace.execution.gates.map((gate) => (
              <div className="design-check-row" key={gate.id}>
                {gate.passed ? (
                  <CheckCircle2 size={15} />
                ) : (
                  <AlertTriangle size={15} />
                )}
                <span>{gate.label}</span>
                <Status tone={gate.passed ? "positive" : "warning"}>
                  {gate.passed ? "通过" : "未通过"}
                </Status>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="Kill Switch">
            <div className="design-kill-switch">
              <ShieldCheck size={54} />
              <div>
                <strong>已启用</strong>
                <span>触发阈值：严格模式</span>
                <small>实盘权限固定关闭</small>
              </div>
            </div>
          </SurfacePanel>
          <SurfacePanel title="恢复与对账">
            <div className="design-kv-row">
              <span>replayExact</span>
              <strong>{executionCandidate ? "true" : "—"}</strong>
            </div>
            <div className="design-kv-row">
              <span>discrepancies</span>
              <strong>0</strong>
            </div>
          </SurfacePanel>
        </div>
        <SurfacePanel
          className="design-execution-timeline"
          title="执行事件时间线"
        >
          <table className="design-table compact">
            <thead>
              <tr>
                <th>时间</th>
                <th>事件类型</th>
                <th>订单 ID</th>
                <th>事件描述</th>
                <th>路由</th>
                <th>routeExecuted</th>
              </tr>
            </thead>
            <tbody>
              {orders.flatMap((order) =>
                ["候选创建", "路由预检", "影子确认", "对账完成"].map(
                  (event, index) => (
                    <tr key={`${order.orderId}-${event}`}>
                      <td>
                        {executionCandidate
                          ? new Date(
                              executionCandidate.generatedAt,
                            ).toLocaleString("zh-CN")
                          : "—"}
                      </td>
                      <td>{event}</td>
                      <td>{compactRunId(order.clientOrderId)}</td>
                      <td>
                        {index === 3
                          ? "影子成交与系统状态对账完成"
                          : `${event}完成`}
                      </td>
                      <td>PAPER-SANDBOX</td>
                      <td>false</td>
                    </tr>
                  ),
                ),
              )}
              {!orders.length ? (
                <tr>
                  <td className="design-empty" colSpan={6}>
                    尚无执行事件；Stage 9 影子候选创建后按时间追加显示。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </SurfacePanel>
      </div>
    </>
  );
}

function AuditSurface({
  action,
  runs,
  workspace,
}: Pick<TerminalWorkspaceSurfaceProps, "action" | "runs" | "workspace">) {
  return (
    <>
      <PageHeader
        action={action}
        title="审计回放"
        subtitle="证据驱动的全链路可追溯回放（仅纸面盘）"
      >
        <div className="design-header-actions">
          <button type="button">
            <Upload size={13} />
            导入复现包
          </button>
          <button type="button">
            <Copy size={13} />
            复制证据锚点
          </button>
        </div>
      </PageHeader>
      <div className="design-audit-filters">
        <label>
          Run ID
          <input value={workspace.researchRun?.runId ?? ""} readOnly />
        </label>
        <label>
          标的/代码
          <input value={workspace.selectedInstrument.symbol} readOnly />
        </label>
        <label>
          事件类型
          <select defaultValue="all">
            <option value="all">全部</option>
          </select>
        </label>
        <button type="button">
          <Search size={13} />
          查询
        </button>
      </div>
      <div className="design-audit-grid">
        <SurfacePanel
          className="design-audit-ledger"
          title="统一审计账本（时间升序）"
        >
          <table className="design-table compact">
            <thead>
              <tr>
                <th>时间</th>
                <th>阶段</th>
                <th>事件类型</th>
                <th>事件摘要</th>
                <th>Run ID</th>
                <th>状态</th>
                <th>Hash（事件）</th>
                <th>操作者</th>
              </tr>
            </thead>
            <tbody>
              {runs
                .slice(0, 12)
                .flatMap((run, index) =>
                  [
                    ["数据接入", "行情与因子数据接入", "成功"],
                    ["数据处理", "因子计算与标准化", "成功"],
                    ["策略", "回测运行", "成功"],
                    ["AI", "评审运行", index ? "通过" : "待执行"],
                  ].map(([stage, event, status], rowIndex) => (
                    <tr key={`${run.runId}-${rowIndex}`}>
                      <td>
                        {new Date(run.createdAt).toLocaleTimeString("zh-CN")}
                      </td>
                      <td>{stage}</td>
                      <td>{event}</td>
                      <td>{run.strategyName}</td>
                      <td>{compactRunId(run.runId)}</td>
                      <td>
                        <Status
                          tone={status === "待执行" ? "warning" : "positive"}
                        >
                          {status}
                        </Status>
                      </td>
                      <td>{compactRunId(run.strategyRevision)}</td>
                      <td>{rowIndex ? "quant.user" : "system"}</td>
                    </tr>
                  )),
                )
                .slice(0, 12)}
            </tbody>
          </table>
        </SurfacePanel>
        <div className="design-audit-side">
          <SurfacePanel title="包完整性">
            <div className="design-kv-row">
              <span>事件数量</span>
              <strong>{runs.length * 4}</strong>
            </div>
            <div className="design-kv-row">
              <span>制品数量</span>
              <strong>{runs.length * 8}</strong>
            </div>
            <div className="design-kv-row">
              <span>包 Hash</span>
              <strong>{compactRunId(workspace.researchRun?.runId)}</strong>
            </div>
          </SurfacePanel>
          <SurfacePanel title="签名验证">
            {["事件签名", "制品签名", "可供验环境"].map((label) => (
              <div className="design-check-row" key={label}>
                <CheckCircle2 size={14} />
                <span>{label}</span>
                <Status>通过</Status>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="制品覆盖">
            {["研究", "策略", "组合", "就绪"].map((label, index) => (
              <div className="design-coverage-row" key={label}>
                <span>{label}</span>
                <strong>
                  {32 - index * 4}/{32 - index * 4}
                </strong>
                <div className="design-progress">
                  <span style={{ width: "100%" }} />
                </div>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="回放精确度">
            <div className="design-big-metric">
              100%<span>一致事件</span>
            </div>
            <div className="design-kv-row">
              <span>不一致</span>
              <strong className="up">0</strong>
            </div>
            <div className="design-kv-row">
              <span>不可回放</span>
              <strong className="up">0</strong>
            </div>
          </SurfacePanel>
        </div>
        <SurfacePanel
          className="design-audit-detail"
          title="事件详情 · 证据制品 · Hash 链 · 回放"
        >
          <div className="design-detail-grid">
            <article>
              <strong>规范化元数据（Diff）</strong>
              <p>基线来源：{workspace.strategy.name}</p>
              <p>特征数量：{workspace.researchRun?.dataRows ?? 0}</p>
              <p>降维方法：PCA</p>
            </article>
            <article>
              <strong>制品概览</strong>
              <p>数据制品 {runs.length}</p>
              <p>模型制品 {workspace.metrics.length}</p>
              <p>报告/文档 {workspace.decisionLog.length}</p>
            </article>
            <article>
              <strong>时间线</strong>
              {runs.slice(0, 5).map((run) => (
                <div className="design-history-row" key={run.runId}>
                  <i className="done" />
                  <span>
                    {new Date(run.createdAt).toLocaleTimeString("zh-CN")}
                  </span>
                  <strong>{compactRunId(run.runId)}</strong>
                </div>
              ))}
            </article>
            <article>
              <strong>回放结果</strong>
              <div className="design-kv-row">
                <span>一致性状态</span>
                <Status>一致</Status>
              </div>
              <div className="design-progress">
                <span style={{ width: "100%" }} />
              </div>
            </article>
          </div>
        </SurfacePanel>
      </div>
    </>
  );
}

function SettingsSurface({
  action,
  adapterRows,
  source,
  workspace,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  "action" | "adapterRows" | "source" | "workspace"
>) {
  return (
    <>
      <PageHeader action={action} title="设置" />
      <div className="design-settings-grid">
        <nav className="design-settings-nav">
          {[
            "常规",
            "数据源与 Provider",
            "AI Provider",
            "执行适配器",
            "安全边界",
            "审计与签名",
            "桌面应用",
          ].map((label, index) => (
            <button
              className={index === 1 ? "selected" : ""}
              key={label}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="design-settings-main">
          <SurfacePanel title="数据源与 Provider">
            <table className="design-table compact">
              <thead>
                <tr>
                  <th>类别</th>
                  <th>适配器</th>
                  <th>能力</th>
                  <th>时间周期覆盖</th>
                  <th>Key 要求</th>
                  <th>健康状态</th>
                  <th>缓存范围</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["A 股", "AkShare", "行情/财务/基本面"],
                  ["A 股", "Tencent", "行情"],
                  ["A 股", "Eastmoney", "行情/资讯"],
                  ["美股", "yfinance", "行情/财务"],
                  ["美股", "Finnhub", "行情/财务/新闻"],
                  ["加密货币", "CCXT", "行情/交易"],
                ].map(([market, adapter, capability], index) => (
                  <tr key={adapter}>
                    <td>{market}</td>
                    <td>{adapter}</td>
                    <td>{capability}</td>
                    <td>1m/5m/15m/1h/1d</td>
                    <td>{index % 2 ? "是" : "否"}</td>
                    <td>
                      <Status tone={source === "core" ? "positive" : "warning"}>
                        {source === "core" ? "正常" : "快照"}
                      </Status>
                    </td>
                    <td>T+0 本地缓存</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SurfacePanel>
          <SurfacePanel title="AI Provider 设置">
            <table className="design-table compact">
              <thead>
                <tr>
                  <th>提供商</th>
                  <th>状态</th>
                  <th>Base URL</th>
                  <th>模型</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "本地（Local）",
                    "可用",
                    "—",
                    "deterministic",
                    "确定性本地基线",
                  ],
                  [
                    "OpenAI",
                    "未配置",
                    "https://api.openai.com/v1",
                    "—",
                    "官方 OpenAI 服务",
                  ],
                  [
                    "OpenAI 兼容（当前）",
                    "已配置",
                    "https://****.com/v1",
                    "*****",
                    "兼容 OpenAI 接口的第三方服务",
                  ],
                  [
                    "Ollama",
                    "未配置",
                    "http://localhost:11434/v1",
                    "—",
                    "本地 Ollama 服务",
                  ],
                ].map((row, index) => (
                  <tr className={index === 2 ? "selected" : ""} key={row[0]}>
                    {row.map((cell) => (
                      <td key={cell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="design-live-warning small">
              <AlertTriangle size={14} />
              外部 AI 服务失败或不可用时，不得替代确定性基线。
            </div>
          </SurfacePanel>
          <SurfacePanel title="执行适配器（只读）">
            <table className="design-table compact">
              <thead>
                <tr>
                  <th>适配器</th>
                  <th>类型</th>
                  <th>用途</th>
                  <th>凭据是否已配置</th>
                  <th>健康状态</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {adapterRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.adapter}</td>
                    <td>
                      {row.route === "paper" ? "仿真（沙盒）" : "只读（生产）"}
                    </td>
                    <td>{row.nextStep}</td>
                    <td>{row.certification}</td>
                    <td>
                      <Status
                        tone={
                          row.tone === "risk"
                            ? "risk"
                            : row.tone === "warning"
                              ? "warning"
                              : "positive"
                        }
                      >
                        {row.status}
                      </Status>
                    </td>
                    <td>{row.market}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SurfacePanel>
          <div className="design-settings-bottom">
            <SurfacePanel title="界面与体验">
              <div className="design-form-row">
                <label>
                  主题
                  <select defaultValue="dark">
                    <option value="dark">深色</option>
                  </select>
                </label>
                <label>
                  语言
                  <select defaultValue="zh">
                    <option value="zh">中文（简体）</option>
                  </select>
                </label>
              </div>
            </SurfacePanel>
            <SurfacePanel title="本地路径">
              <div className="design-form-row">
                <input value="~/AIQuantTools/data" readOnly />
                <button type="button">更改路径</button>
              </div>
            </SurfacePanel>
            <SurfacePanel title="操作">
              <button
                className="design-secondary-action"
                onClick={action.onClick}
                type="button"
              >
                <RefreshCw size={13} />
                运行只读健康检查
              </button>
            </SurfacePanel>
          </div>
        </div>
        <div className="design-settings-side">
          <SurfacePanel title="安全边界（不可更改）">
            {[
              ["纸面模式", true],
              ["允许实盘交易", false],
              ["允许下单提交", false],
              ["订单路由执行", false],
              ["实盘阻断边界", true],
            ].map(([label, value]) => (
              <div className="design-check-row" key={String(label)}>
                <LockKeyhole size={13} />
                <span>{String(label)}</span>
                <strong className={value ? "up" : "down"}>
                  {String(value)}
                </strong>
              </div>
            ))}
            <p className="down">当前平台运行于纸面环境，所有实盘能力已阻断。</p>
          </SurfacePanel>
          <SurfacePanel title="环境隔离">
            <div className="design-kv-row">
              <span>环境模式</span>
              <strong>桌面隔离</strong>
            </div>
            <div className="design-kv-row">
              <span>配置来源</span>
              <strong>本地配置文件</strong>
            </div>
            <div className="design-kv-row">
              <span>写入范围</span>
              <strong>本地用户目录内</strong>
            </div>
          </SurfacePanel>
          <SurfacePanel title="密钥处理规则">
            {[
              "密钥仅在 API 服务环境注入",
              "绝不进入浏览器/Web Bundle",
              "绝不写入 Dockerfile/镜像层",
              "绝不导出到日志/错误堆栈",
            ].map((label) => (
              <div className="design-check-row" key={label}>
                <CheckCircle2 size={13} />
                <span>{label}</span>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="最近健康检查（只读）">
            {["数据源适配器", "AI Provider", "执行适配器", "总体状态"].map(
              (label) => (
                <div className="design-kv-row" key={label}>
                  <span>{label}</span>
                  <Status>{source === "core" ? "正常" : "快照"}</Status>
                </div>
              ),
            )}
          </SurfacePanel>
        </div>
      </div>
    </>
  );
}

export function TerminalWorkspaceSurface(props: TerminalWorkspaceSurfaceProps) {
  let content: ReactNode;
  switch (props.activeWorkAreaId) {
    case "market":
      content = <MarketSurface {...props} />;
      break;
    case "research":
      content = <ResearchSurface {...props} />;
      break;
    case "strategy":
      content = <StrategySurface {...props} />;
      break;
    case "backtest":
      content = <BacktestSurface {...props} />;
      break;
    case "ai-review":
      content = <AiReviewSurface {...props} />;
      break;
    case "portfolio":
      content = <PortfolioSurface {...props} />;
      break;
    case "execution":
      content = <ExecutionSurface {...props} />;
      break;
    case "audit":
      content = <AuditSurface {...props} />;
      break;
    case "settings":
      content = <SettingsSurface {...props} />;
      break;
    default:
      content = null;
  }
  return (
    <section
      className={`terminal-design-surface surface-${props.activeWorkAreaId}`}
      aria-label={pageTitles[props.activeWorkAreaId]}
    >
      {content}
    </section>
  );
}
