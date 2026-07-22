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
  Sparkles,
  Star,
  Upload,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { Stage9ProductionAdmissionCandidate } from "../lib/stage9-production-admission";
import type { Stage4PortfolioGoldenPath } from "../lib/portfolio-stage4";
import {
  aiReviewRequiresExternalApproval,
  buildComparisonEligibility,
  type AiReviewDecision,
  type AiReviewExperimentReference,
  type AiReviewProviderId,
  type AiReviewProviderStatus,
  type AiReviewStance,
  type AuthoritativeAiReviewRun,
} from "../lib/ai-review-stage3";
import type {
  CacheWatchlistRefreshRun,
  MarketCalendarStatus,
  PortfolioBacktestRun,
  ResearchNoteResult,
} from "../lib/terminal-api";
import type { ColorScheme } from "../lib/theme";
import { createI18n, type TranslationKey } from "../lib/i18n";
import type {
  BrokerAdapterRow,
  Instrument,
  PortfolioPaperOrderApprovalRow,
  ProductWorkAreaId,
  ResearchRunAudit,
  StrategyExperimentListItem,
  StrategyExperimentWalkForward,
  TerminalWorkspace,
  Timeframe,
} from "../lib/terminal-workbench";
import { DEFAULT_STRATEGY_EXPERIMENT_WALK_FORWARD } from "../lib/terminal-workbench";

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
  aiReview: {
    busy: boolean;
    comparisonExperimentIds: string[];
    currentReview: AuthoritativeAiReviewRun | null;
    decisions: AiReviewDecision[];
    error: string | null;
    experiments: StrategyExperimentListItem[];
    externalDataApproved: boolean;
    history: AuthoritativeAiReviewRun[];
    onComparisonToggle: (experimentId: string) => void;
    onExternalDataApprovedChange: (approved: boolean) => void;
    onProviderChange: (providerId: AiReviewProviderId) => void;
    primaryExperimentId: string | null;
    providerId: AiReviewProviderId;
    providers: AiReviewProviderStatus[];
  };
  chart: ReactNode;
  colorScheme: ColorScheme;
  executionCandidate: Stage9ProductionAdmissionCandidate | null;
  executionReadiness?: ReactNode;
  isSavingWatchlist: boolean;
  latestWatchlistCacheRefresh: CacheWatchlistRefreshRun | null;
  marketCalendar?: MarketCalendarStatus;
  marketRefreshIssue: string | null;
  onApprovePortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onRemoveWatchlistInstrument: (instrument: Instrument) => void;
  onRejectPortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onSaveWatchlist: () => void;
  onScrollPositionChange: (scrollTop: number) => void;
  onSelectInstrument: (instrument: Instrument) => void;
  onSelectTimeframe: (timeframe: Timeframe) => void;
  approvingPortfolioOrderId?: string | null;
  portfolio: PortfolioBacktestRun | null;
  portfolioActionError?: string | null;
  portfolioGoldenPath?: Stage4PortfolioGoldenPath;
  portfolioPaperOrderApprovalRows?: PortfolioPaperOrderApprovalRow[];
  researchPreparation: {
    externalDataApproved: boolean;
    generationError: string | null;
    generationStatus: string | null;
    isGeneratingNote: boolean;
    isSavingNote: boolean;
    isSavingWorkspace: boolean;
    note: ResearchNoteResult;
    noteDraft: string;
    onExternalDataApprovedChange: (approved: boolean) => void;
    onGenerateNote: () => void;
    onNoteChange: (value: string) => void;
    onProviderChange: (providerId: AiReviewProviderId) => void;
    onSaveNote: () => void;
    onSaveWorkspace: () => void;
    providerId: AiReviewProviderId;
    providers: AiReviewProviderStatus[];
    workspaceSaved: boolean;
  };
  runs: ResearchRunAudit[];
  source: "core" | "fallback";
  strategyExperiment: {
    busy: boolean;
    onWalkForwardChange: (walkForward: StrategyExperimentWalkForward | null) => void;
    walkForward: StrategyExperimentWalkForward | null;
  };
  strategyWorkbench: ReactNode;
  surfaceRef: RefObject<HTMLElement | null>;
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
  operations: "运行管理",
  audit: "审计回放",
  settings: "设置",
};

const marketTimeframeOptions: Array<{ label: string; value: Timeframe }> = [
  { label: "1 分", value: "1m" },
  { label: "5 分", value: "5m" },
  { label: "日 K", value: "1d" },
  { label: "周 K", value: "1w" },
];

const aiProviderLabels: Record<AiReviewProviderId, string> = {
  local: "本地基线",
  openai: "OpenAI",
  "openai-compatible": "OpenAI 兼容服务",
  ollama: "Ollama",
};

const terminalSurfaceZh = createI18n("zh-CN");

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

function EmptyState({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="design-empty-state">
      <FileText aria-hidden="true" size={20} />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
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
  colorScheme,
  points,
  tone = "teal",
}: {
  colorScheme: ColorScheme;
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
      const themeStyles = getComputedStyle(canvas);
      const themeColor = (property: string, fallback: string) =>
        themeStyles.getPropertyValue(property).trim() || fallback;
      context.scale(ratio, ratio);
      context.clearRect(0, 0, width, height);
      context.strokeStyle = themeColor("--chart-grid", "#183047");
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
        tone === "blue"
          ? themeColor("--chart-blue", "#5f9fff")
          : tone === "red"
            ? themeColor("--chart-red", "#ff6257")
            : themeColor("--chart-teal", "#58d6b9");
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
  }, [colorScheme, points, tone]);

  return <canvas className="design-line-chart" ref={ref} />;
}

function DonutCanvas({ cashWeight }: { cashWeight: number }) {
  const equityPercent = Math.min(100, Math.max(0, (1 - cashWeight) * 100));
  return (
    <div
      aria-label="组合权益占比"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={equityPercent}
      aria-valuetext={`${equityPercent.toFixed(1)}%`}
      className="design-portfolio-donut"
      role="meter"
    >
      <svg aria-hidden="true" viewBox="0 0 100 100">
        <circle className="design-portfolio-donut-track" cx="50" cy="50" r="43" />
        {equityPercent > 0 ? (
          <circle
            className="design-portfolio-donut-value"
            cx="50"
            cy="50"
            pathLength="100"
            r="43"
            strokeDasharray="100"
            strokeDashoffset={100 - equityPercent}
            transform="rotate(-90 50 50)"
          />
        ) : null}
      </svg>
      <span>
        <strong>{equityPercent.toFixed(1)}%</strong>
        <small>权益占比</small>
      </span>
    </div>
  );
}

function MarketSurface({
  action,
  chart,
  isSavingWatchlist,
  latestWatchlistCacheRefresh,
  marketCalendar,
  marketRefreshIssue,
  onRemoveWatchlistInstrument,
  onSaveWatchlist,
  onSelectInstrument,
  onSelectTimeframe,
  source,
  workspace,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  | "action"
  | "chart"
  | "isSavingWatchlist"
  | "latestWatchlistCacheRefresh"
  | "marketCalendar"
  | "marketRefreshIssue"
  | "onRemoveWatchlistInstrument"
  | "onSaveWatchlist"
  | "onSelectInstrument"
  | "onSelectTimeframe"
  | "source"
  | "workspace"
>) {
  const [isEditingWatchlist, setIsEditingWatchlist] = useState(false);
  const sorted = [...workspace.watchlist].sort(
    (left, right) => right.changePct - left.changePct,
  );
  const advancingCount = workspace.watchlist.filter(
    (instrument) => instrument.changePct >= 0,
  ).length;
  const decliningCount = workspace.watchlist.length - advancingCount;
  const canRemoveWatchlistInstrument = workspace.watchlist.length > 1;
  const marketCount = new Set(
    workspace.watchlist.map((instrument) => instrument.market),
  ).size;
  const marketBreakdown = ([
    ["ashare", "A 股"],
    ["us", "美股"],
    ["crypto", "加密货币"],
  ] as const)
    .map(([market, label]) => ({
      count: workspace.watchlist.filter((instrument) => instrument.market === market).length,
      label,
      market,
    }))
    .filter((item) => item.count > 0);
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
  let latestRefreshStatus = "等待首次刷新";
  let latestRefreshTone: "positive" | "warning" | "risk" | "neutral" = "neutral";
  if (marketRefreshIssue) {
    latestRefreshStatus = "刷新未完成";
    latestRefreshTone = "risk";
  } else if (latestWatchlistCacheRefresh) {
    const { failed, refreshed, skipped } = latestWatchlistCacheRefresh.summary;
    if (failed > 0) {
      latestRefreshStatus = refreshed > 0 ? "部分失败" : "失败";
      latestRefreshTone = "warning";
    } else if (skipped > 0) {
      latestRefreshStatus = refreshed > 0 ? "部分跳过" : "全部跳过";
      latestRefreshTone = "warning";
    } else {
      latestRefreshStatus = "成功";
      latestRefreshTone = "positive";
    }
  }
  const latestRefreshTime = marketRefreshIssue
    ? "本次尝试"
    : latestWatchlistCacheRefresh
      ? formatQuoteTime(latestWatchlistCacheRefresh.createdAt)
      : "—";
  const calendarStatus = marketCalendar?.status ?? "unknown";
  const calendarStatusLabel =
    calendarStatus === "always_open"
      ? "全天交易"
      : calendarStatus === "open"
        ? "交易中"
        : calendarStatus === "closed"
          ? "休市"
          : calendarStatus === "break"
            ? "午间休市"
            : source === "core"
              ? "未知"
              : "离线";
  const calendarNextEvent =
    calendarStatus === "open"
      ? marketCalendar?.nextClose
      : calendarStatus === "closed" || calendarStatus === "break"
        ? marketCalendar?.nextOpen
        : null;
  const calendarNextValue =
    calendarStatus === "always_open"
      ? "24/7"
      : calendarNextEvent
        ? new Date(calendarNextEvent).toLocaleString("zh-CN", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: marketCalendar?.timezone === "unknown" ? undefined : marketCalendar?.timezone,
        })
        : "—";
  return (
    <>
      <PageHeader action={action} title="行情中心" />
      <div className="design-market-grid">
        <SurfacePanel
          className="design-watchlist-panel"
          title="自选列表"
          action={
            <div className="design-watchlist-actions">
              <button
                className="design-link-button"
                disabled={isSavingWatchlist}
                id="market-watchlist-save"
                onClick={onSaveWatchlist}
                type="button"
              >
                <Save aria-hidden="true" size={12} />
                {isSavingWatchlist ? "保存中" : "保存"}
              </button>
              <button
                aria-pressed={isEditingWatchlist}
                className="design-link-button"
                onClick={() => setIsEditingWatchlist((current) => !current)}
                type="button"
              >
                {isEditingWatchlist ? "完成" : "编辑"}
              </button>
            </div>
          }
        >
          <div className="design-watchlist-table-scroll">
            <table className={`design-table compact${isEditingWatchlist ? " editing" : ""}`}>
              <thead>
                <tr>
                  <th>代码</th>
                  <th>名称</th>
                  <th>最新价</th>
                  <th>涨跌幅</th>
                  <th>成交量</th>
                  <th>更新</th>
                  <th>来源</th>
                  <th>{isEditingWatchlist ? "操作" : "缓存"}</th>
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
                    onClick={isEditingWatchlist ? undefined : () => onSelectInstrument(instrument)}
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
                    <td>
                      {isEditingWatchlist ? (
                        <button
                          aria-label={
                            canRemoveWatchlistInstrument
                              ? `从自选列表移除 ${instrument.name}`
                              : `${instrument.name} 是最后一个自选标的，至少保留一项`
                          }
                          className="design-watchlist-remove"
                          disabled={isSavingWatchlist || !canRemoveWatchlistInstrument}
                          onClick={() => onRemoveWatchlistInstrument(instrument)}
                          title={!canRemoveWatchlistInstrument ? "自选列表至少保留 1 个标的" : undefined}
                          type="button"
                        >
                          {isSavingWatchlist
                            ? "保存中"
                            : canRemoveWatchlistInstrument
                              ? "移除"
                              : "需保留"}
                        </button>
                      ) : (
                        <Status tone={source === "core" ? "positive" : "warning"}>{source === "core" ? "最新" : "缓存"}</Status>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="design-watchlist-overview">
            <div className="design-watchlist-overview-head">
              <span>当前自选概览</span>
              <strong>{workspace.watchlist.length} 个标的</strong>
            </div>
            <div className="design-watchlist-overview-stats">
              <article>
                <strong className="up">{advancingCount}</strong>
                <span>上涨</span>
              </article>
              <article>
                <strong className="down">{decliningCount}</strong>
                <span>下跌</span>
              </article>
              <article>
                <strong>{marketCount}</strong>
                <span>覆盖市场</span>
              </article>
            </div>
            <div className="design-watchlist-market-breakdown">
              <div className="design-watchlist-market-breakdown-head">
                <span>市场分布</span>
                <strong>{workspace.watchlist.length} 个标的</strong>
              </div>
              {marketBreakdown.map((item) => (
                <div className="design-watchlist-market-row" key={item.market}>
                  <span>{item.label}</span>
                  <i aria-hidden="true">
                    <b style={{ width: `${Math.max(12, (item.count / workspace.watchlist.length) * 100)}%` }} />
                  </i>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </div>
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
            <span>更新 {latestQuoteTime}</span>
            <span>来源 {workspace.selectedInstrument.quoteSource ?? "本地"}</span>
            <span>{source === "core" ? "实时数据" : "离线快照"}</span>
          </div>
          <div className="design-market-timeframes">
            {marketTimeframeOptions.map(({ label, value }) => (
              <button
                aria-pressed={workspace.selectedTimeframe === value}
                className={workspace.selectedTimeframe === value ? "active" : ""}
                key={value}
                onClick={() => onSelectTimeframe(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="design-chart-host">{chart}</div>
        </SurfacePanel>
        <div className="design-market-side">
          <div className="design-market-side-top">
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
                <Status tone={calendarStatus === "open" || calendarStatus === "always_open" ? "positive" : calendarStatus === "unknown" ? "neutral" : "warning"}>
                  {calendarStatusLabel}
                </Status>
              </div>
              <div className="design-kv-row">
                <span>{calendarStatus === "open" ? "本次收盘" : calendarStatus === "closed" || calendarStatus === "break" ? "下次开盘" : "交易时段"}</span>
                <strong>{calendarNextValue}</strong>
              </div>
              <div className="design-kv-row">
                <span>{calendarStatus === "always_open" ? "时区" : "交易日"}</span>
                <strong>{calendarStatus === "always_open" ? marketCalendar?.timezone ?? "—" : marketCalendar?.tradingDay || "—"}</strong>
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
              <div className="design-kv-row"><span>最近刷新</span><strong>{latestRefreshTime}</strong></div>
              <div className="design-kv-row"><span>状态</span><Status tone={latestRefreshTone}>{latestRefreshStatus}</Status></div>
              <div className="design-kv-row"><span>更新条数</span><strong>{marketRefreshIssue ? "—" : (latestWatchlistCacheRefresh?.summary.upsertedRows ?? 0).toLocaleString()}</strong></div>
            </SurfacePanel>
          </div>
          <SurfacePanel className="design-market-retry-panel" title="重试与恢复">
            <div className="design-kv-row"><span>自动重试</span><Status>已启用</Status></div>
            <div className="design-kv-row"><span>上次重试</span><strong>{latestRefreshTime}</strong></div>
            {marketRefreshIssue ? <p className="design-refresh-issue">{marketRefreshIssue}</p> : null}
            <button
              className="design-secondary-action design-market-retry-action"
              disabled={action.disabled}
              onClick={action.onClick}
              type="button"
            >
              {action.disabled ? "重试中…" : "立即重试"}
            </button>
          </SurfacePanel>
        </div>
        <div className="design-market-bottom">
          {[sorted, sorted.slice().reverse()].map(
            (rows, groupIndex) => (
              <SurfacePanel key={groupIndex} title={groupIndex === 0 ? "自选涨幅排行" : "自选弱势排行"}>
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
          <SurfacePanel title="关注标的">
            <table className="design-table compact"><thead><tr><th>名称</th><th>代码</th><th>类型</th></tr></thead><tbody>{workspace.watchlist.map((row) => <tr key={row.symbol}><td>{row.name}</td><td>{row.symbol}</td><td>{row.market === "ashare" ? "A 股" : row.market === "us" ? "美股" : "加密货币"}</td></tr>)}</tbody></table>
          </SurfacePanel>
        </div>
      </div>
    </>
  );
}

function ResearchSurface({
  action,
  chart,
  researchPreparation,
  runs,
  workspace,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  "action" | "chart" | "researchPreparation" | "runs" | "workspace"
>) {
  const researchNoteInputRef = useRef<HTMLTextAreaElement>(null);
  const [researchEvidenceTab, setResearchEvidenceTab] = useState<
    "activity" | "evidence"
  >("activity");
  const activeRun = workspace.researchRun;
  const auditedRun = activeRun
    ? runs.find((run) => run.runId === activeRun.runId) ?? null
    : null;
  const evidenceRun = auditedRun
    ?? runs.find(
      (run) =>
        run.market === workspace.selectedInstrument.market
        && run.symbol === workspace.selectedInstrument.symbol
        && run.timeframe === workspace.selectedTimeframe,
    )
    ?? null;
  const evidenceQuality = evidenceRun?.dataQuality ?? activeRun?.dataQuality;
  const evidenceSnapshot = evidenceRun?.dataSnapshot ?? activeRun?.dataSnapshot;
  const evidenceStrategy = evidenceRun?.strategyConfig ?? activeRun?.strategyConfig;
  const hasResearchEvidence = Boolean(evidenceRun || activeRun);
  const metricNumber = (...keys: string[]): number | null => {
    for (const key of keys) {
      const value = evidenceRun?.metrics[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
    }
    return null;
  };
  const workspaceMetricNumber = (label: string): number | null => {
    if (!hasResearchEvidence) {
      return null;
    }
    const value = workspace.metrics.find((metric) => metric.label === label)?.value;
    if (!value) {
      return null;
    }
    const parsed = Number.parseFloat(value.replace(/[,%+]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const formatPercent = (value: number | null, includeSign = false): string => {
    if (value === null) {
      return "—";
    }
    return `${includeSign && value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  };
  const totalReturn = metricNumber("total_return_pct", "return_pct")
    ?? workspaceMetricNumber("Return");
  const maxDrawdown = metricNumber("max_drawdown_pct")
    ?? workspaceMetricNumber("Max DD");
  const winRate = metricNumber("win_rate_pct")
    ?? workspaceMetricNumber("Win Rate");
  const tradeCount = metricNumber("trade_count")
    ?? workspaceMetricNumber("Trades");
  const profitFactor = metricNumber("profit_factor");
  const previousRun = evidenceRun
    ? runs.find(
      (run) =>
        run.runId !== evidenceRun.runId
        && run.market === evidenceRun.market
        && run.symbol === evidenceRun.symbol
        && run.timeframe === evidenceRun.timeframe,
    )
    : null;
  const previousReturn = previousRun?.metrics.total_return_pct
    ?? previousRun?.metrics.return_pct
    ?? null;
  const returnDelta = totalReturn !== null && typeof previousReturn === "number"
    ? totalReturn - previousReturn
    : null;
  const overviewScore = hasResearchEvidence ? winRate : null;
  const overviewScoreValue = Math.min(100, Math.max(0, overviewScore ?? 0));
  const overviewScoreColor = overviewScore === null
    ? "var(--border-strong)"
    : overviewScoreValue >= 60
      ? "var(--teal)"
      : overviewScoreValue >= 40
        ? "var(--amber)"
        : "var(--danger)";
  const factorRows = [
    {
      label: "策略收益",
      value: formatPercent(totalReturn, true),
      quality: totalReturn === null ? "证据缺失" : "已绑定",
      tone: totalReturn === null ? "warning" : "positive",
    },
    {
      label: "回撤风险",
      value: formatPercent(maxDrawdown),
      quality: maxDrawdown === null ? "证据缺失" : "已绑定",
      tone: maxDrawdown === null ? "warning" : "positive",
    },
    {
      label: "交易胜率",
      value: formatPercent(winRate),
      quality: winRate === null ? "证据缺失" : "已绑定",
      tone: winRate === null ? "warning" : "positive",
    },
    {
      label: "收益结构",
      value: profitFactor === null ? "—" : profitFactor.toFixed(2),
      quality: profitFactor === null ? "证据缺失" : "已绑定",
      tone: profitFactor === null ? "warning" : "positive",
    },
    {
      label: "样本密度",
      value: `${evidenceRun?.dataRows ?? activeRun?.dataRows ?? 0} 行`,
      quality: evidenceRun || activeRun ? "已绑定" : "待运行",
      tone: evidenceRun || activeRun ? "positive" : "warning",
    },
    {
      label: "数据完整",
      value: evidenceQuality?.isComplete ? "完整" : "待复核",
      quality: evidenceQuality?.warnings.length
        ? `${evidenceQuality.warnings.length} 项警告`
        : evidenceQuality
          ? "通过"
          : "待运行",
      tone:
        evidenceQuality?.isComplete && evidenceQuality.warnings.length === 0
          ? "positive"
          : "warning",
    },
  ] as const;
  const createdAt = evidenceRun?.createdAt ?? activeRun?.createdAt ?? null;
  const createdTime = createdAt
    ? new Date(createdAt).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    : "—";
  const dataSource = evidenceSnapshot?.source ?? evidenceQuality?.source ?? "—";
  const dataRows = evidenceSnapshot?.rows
    ?? evidenceQuality?.rows
    ?? evidenceRun?.dataRows
    ?? activeRun?.dataRows
    ?? 0;
  const snapshotHash = evidenceSnapshot?.hash ?? "—";
  const runId = evidenceRun?.runId ?? activeRun?.runId ?? null;
  const strategyRevision = evidenceRun?.strategyRevision
    ?? activeRun?.strategyRevision
    ?? "—";
  const strategyName = evidenceRun?.strategyName
    ?? evidenceStrategy?.name
    ?? workspace.strategy.name;
  const activityRows = runId
    ? [
      {
        time: createdTime,
        label: "研究流水线",
        badge: "运行完成",
        headline: strategyName,
        detail: `版本 ${strategyRevision} · ${dataRows.toLocaleString()} 行审计数据`,
        tone: "positive",
      },
      {
        time: "同次运行",
        label: "回测指标",
        badge: "证据已绑定",
        headline: `收益 ${formatPercent(totalReturn, true)} · 回撤 ${formatPercent(maxDrawdown)}`,
        detail: `胜率 ${formatPercent(winRate)} · ${tradeCount ?? 0} 笔交易`,
        tone: "ai",
      },
      {
        time: "同次运行",
        label: "数据快照",
        badge: evidenceQuality?.isComplete ? "快照完整" : "需要复核",
        headline: `${dataSource} · ${dataRows.toLocaleString()} 行`,
        detail: evidenceSnapshot?.end
          ? `最新数据 ${new Date(evidenceSnapshot.end).toLocaleString("zh-CN")}`
          : "数据时间范围已随运行归档",
        tone: evidenceQuality?.isComplete ? "positive" : "warning",
      },
      {
        time: "同次运行",
        label: "AI 研究摘要",
        badge: evidenceRun?.aiReport ? "摘要已绑定" : "本地基线",
        headline: evidenceRun?.aiReport?.summary ?? "确定性基线优先，等待外部评审证据。",
        detail: evidenceRun?.aiReport?.risks[0] ?? "不生成买卖指令或保证收益。",
        tone: evidenceRun?.aiReport ? "ai" : "warning",
      },
      {
        time: "同次运行",
        label: "审计记录",
        badge: "可复现",
        headline: runId,
        detail: `${strategyRevision} · ${evidenceRun?.executionMode ?? activeRun?.executionMode ?? "paper_only"}`,
        tone: "positive",
      },
    ]
    : [];
  const evidenceRows = [
    ["运行 ID", runId ?? "等待首次运行"],
    ["数据快照", snapshotHash],
    ["策略版本", strategyRevision],
    [
      "数据质量",
      evidenceQuality
        ? `${evidenceQuality.isComplete ? "完整" : "需复核"} · ${evidenceQuality.warnings.length} 项警告`
        : "未绑定",
    ],
    ["AI 报告", evidenceRun?.aiReport ? "已绑定" : "确定性本地基线"],
  ];
  const noteDraftBody = researchPreparation.noteDraft.trim();
  const savedNote = researchPreparation.note.note;
  const savedNoteBody = savedNote?.body.trim() ?? "";
  const noteIsSaved = Boolean(
    noteDraftBody &&
    savedNote &&
    noteDraftBody === savedNoteBody,
  );
  const preparationIsSaved = noteIsSaved && researchPreparation.workspaceSaved;
  const selectedProvider = researchPreparation.providers.find(
    (provider) => provider.providerId === researchPreparation.providerId,
  ) ?? {
    providerId: "local" as const,
    configured: true,
    model: null,
    sanitizedBaseUrl: null,
  };
  const usesExternalProvider = selectedProvider.providerId !== "local";
  const canGenerateNote = !researchPreparation.isGeneratingNote
    && selectedProvider.configured
    && (!usesExternalProvider || researchPreparation.externalDataApproved);
  useEffect(() => {
    const researchNoteInput = researchNoteInputRef.current;
    if (!researchPreparation.isGeneratingNote || !researchNoteInput) {
      return;
    }
    researchNoteInput.scrollTop = researchNoteInput.scrollHeight;
  }, [
    researchPreparation.isGeneratingNote,
    researchPreparation.noteDraft,
  ]);
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
          <span>
            当前研究状态：
            {activeRun ? "证据已绑定" : evidenceRun ? "历史证据已载入" : "待运行"}
          </span>
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
            <time className="design-factor-date" dateTime={createdAt ?? ""}>
              {createdAt ? new Date(createdAt).toLocaleDateString("zh-CN") : "等待运行"}
            </time>
          }
        >
          <div className="design-factor-score-summary">
            <div
              aria-label="回测胜率"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={overviewScore === null ? undefined : overviewScoreValue}
              aria-valuetext={
                overviewScore === null
                  ? "暂无回测胜率"
                  : `${overviewScoreValue.toFixed(1)}%`
              }
              className="design-factor-score-ring"
              role="meter"
            >
              <svg
                aria-hidden="true"
                className="design-factor-score-ring-visual"
                viewBox="0 0 100 100"
              >
                <circle
                  className="design-factor-score-ring-track"
                  cx="50"
                  cy="50"
                  r="45"
                />
                <circle
                  className="design-factor-score-ring-value"
                  cx="50"
                  cy="50"
                  pathLength="100"
                  r="45"
                  stroke={overviewScoreColor}
                  strokeDasharray="100"
                  strokeDashoffset={overviewScore === null ? 100 : 100 - overviewScoreValue}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <span>
                <strong style={{ color: overviewScoreColor }}>
                  {overviewScore === null ? "—" : overviewScoreValue.toFixed(1)}
                </strong>
                <small>回测胜率</small>
              </span>
            </div>
            <div className="design-factor-score-copy">
              <span>历史回测</span>
              <strong>
                {totalReturn === null
                  ? "等待运行"
                  : totalReturn >= 0
                    ? "录得正收益"
                    : "录得负收益"}
              </strong>
              <small>
                较上次{" "}
                <b className={returnDelta !== null && returnDelta < 0 ? "down" : "up"}>
                  {formatPercent(returnDelta, true)}
                </b>
              </small>
            </div>
          </div>
          <div className="design-factor-quality">
            <h4>运行指标（审计证据）</h4>
            <div className="design-factor-quality-head">
              <span>指标</span>
              <span>结果</span>
              <span>证据</span>
            </div>
            {factorRows.map((row) => (
              <div className="design-factor-quality-row" key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
                <em className={row.tone === "warning" ? "down" : "up"}>
                  {row.quality}
                </em>
              </div>
            ))}
          </div>
          <div className="design-forecast-summary">
            <h4>研究摘要（历史回测）</h4>
            <div><span>策略收益</span><strong className={totalReturn !== null && totalReturn < 0 ? "down" : "up"}>{formatPercent(totalReturn, true)}</strong></div>
            <div><span>运行胜率</span><strong>{formatPercent(winRate)}</strong></div>
            <div><span>盈亏比</span><strong>{profitFactor === null ? "—" : profitFactor.toFixed(2)}</strong></div>
            <div><span>最大回撤</span><strong>{formatPercent(maxDrawdown)}</strong></div>
            <div><span>审计样本</span><strong>{dataRows.toLocaleString()} 根 K 线</strong></div>
            <small>展示当前审计回测证据，不构成未来收益承诺。</small>
          </div>
        </SurfacePanel>
        <section className="design-panel design-research-timeline">
          <header className="design-panel-head">
            <div className="design-research-tabs" role="tablist" aria-label="研究证据视图">
              <button
                aria-selected={researchEvidenceTab === "activity"}
                className={researchEvidenceTab === "activity" ? "active" : ""}
                onClick={() => setResearchEvidenceTab("activity")}
                role="tab"
                type="button"
              >
                研究动态
              </button>
              <button
                aria-selected={researchEvidenceTab === "evidence"}
                className={researchEvidenceTab === "evidence" ? "active" : ""}
                onClick={() => setResearchEvidenceTab("evidence")}
                role="tab"
                type="button"
              >
                证据链
              </button>
            </div>
          </header>
          <div className="design-panel-body">
            {researchEvidenceTab === "activity" ? (
              <>
                <h4 className="design-timeline-heading">实时运行轨迹</h4>
                {activityRows.length ? activityRows.map((row) => (
                  <article
                    className={`design-timeline-row is-${row.tone}`}
                    key={row.label}
                  >
                    <i aria-hidden="true" />
                    <time dateTime={createdAt ?? ""}>{row.time}</time>
                    <div className="design-timeline-copy">
                      <div>
                        <strong>{row.label}</strong>
                        <Status tone={row.tone === "warning" ? "warning" : "positive"}>
                          {row.badge}
                        </Status>
                      </div>
                      <p>{row.headline}</p>
                      <small>{row.detail}</small>
                    </div>
                  </article>
                )) : (
                  <EmptyState
                    detail="完成一次研究运行后，这里会按证据顺序恢复完整轨迹。"
                    title="等待首次运行"
                  />
                )}
              </>
            ) : (
              <div className="design-research-evidence-list">
                {evidenceRows.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong title={value}>{value}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        <div className="design-research-side">
          <SurfacePanel className="design-research-evidence-card" title="最新 AI 研究摘要">
            <div className="design-research-card-status">
              <span>结论</span>
              <Status tone={evidenceRun?.aiReport ? "positive" : "warning"}>
                {evidenceRun?.aiReport ? "报告已绑定" : activeRun ? "本地基线" : "待运行"}
              </Status>
            </div>
            <p>{evidenceRun?.aiReport?.summary ?? "确定性基线优先，外部模型失败不会覆盖本地结论。"}</p>
            <ul>
              {(evidenceRun?.aiReport?.risks.length
                ? evidenceRun.aiReport.risks
                : workspace.decisionLog.map((entry) => entry.message)
              ).slice(0, 2).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </SurfacePanel>
          <SurfacePanel className="design-research-evidence-card" title="数据源血缘">
            <div className="design-kv-row"><span>行情数据</span><strong>{dataSource}</strong></div>
            <div className="design-kv-row"><span>数据行数</span><strong>{dataRows.toLocaleString()}</strong></div>
            <div className="design-kv-row"><span>快照范围</span><strong>{evidenceSnapshot?.end ? new Date(evidenceSnapshot.end).toLocaleDateString("zh-CN") : "—"}</strong></div>
            <div className="design-kv-row"><span>完整性</span><Status tone={evidenceQuality?.isComplete ? "positive" : "warning"}>{evidenceQuality?.isComplete ? "完整" : "待复核"}</Status></div>
          </SurfacePanel>
          <SurfacePanel className="design-research-evidence-card" title="审计回放">
            <div className="design-kv-row"><span>Run ID</span><strong title={runId ?? "—"}>{compactRunId(runId)}</strong></div>
            <div className="design-kv-row"><span>快照 Hash</span><strong title={snapshotHash}>{snapshotHash}</strong></div>
            <div className="design-kv-row"><span>版本</span><strong>{strategyRevision}</strong></div>
            <div className="design-kv-row"><span>状态</span><Status tone={runId ? "positive" : "warning"}>{runId ? "可复现" : "待运行"}</Status></div>
          </SurfacePanel>
          <SurfacePanel className="design-research-evidence-card" title="恢复与复现">
            <div className="design-kv-row"><span>持久化运行</span><Status>{runId ? "已归档" : "待运行"}</Status></div>
            <div className="design-kv-row"><span>自动重试</span><strong>未声明</strong></div>
            <div className="design-kv-row"><span>回放状态</span><strong>{runId ? "可复现" : "待运行"}</strong></div>
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
                    <Status
                      tone={
                        run.dataQuality?.isComplete
                        && run.dataQuality.warnings.length === 0
                          ? "positive"
                          : "warning"
                      }
                    >
                      {run.dataQuality
                        ? run.dataQuality.isComplete
                          ? run.dataQuality.warnings.length
                            ? "有警告"
                            : "证据完整"
                          : "需复核"
                        : "已归档"}
                    </Status>
                  </td>
                  <td>
                    {typeof (run.metrics.total_return_pct ?? run.metrics.return_pct) === "number"
                      ? `收益 ${(run.metrics.total_return_pct ?? run.metrics.return_pct).toFixed(2)}%`
                      : `${run.dataRows} 行`}
                  </td>
                  <td>{new Date(run.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SurfacePanel>
        <SurfacePanel
          action={
            <Status tone={preparationIsSaved ? "positive" : "warning"}>
              {preparationIsSaved ? "准备已保存" : "有未保存项"}
            </Status>
          }
          className="design-research-preparation"
          subtitle="运行前保存研究假设和当前工作区上下文"
          title="研究准备"
        >
          <div className="design-research-preparation-body">
            <div className="design-research-note-column">
              <label className="design-research-note-field" htmlFor="research-note-input">
                <span>研究笔记</span>
                <textarea
                  id="research-note-input"
                  onChange={(event) => researchPreparation.onNoteChange(event.currentTarget.value)}
                  placeholder="记录研究假设、观察重点和风险条件"
                  ref={researchNoteInputRef}
                  rows={4}
                  value={researchPreparation.noteDraft}
                />
              </label>
            </div>
            <div className="design-research-preparation-actions">
              <div>
                <span>笔记状态</span>
                <strong>
                  {researchPreparation.note.error
                    ? "保存失败，请重试"
                    : !noteDraftBody
                      ? "尚未填写"
                      : noteIsSaved
                      ? `已保存${savedNote?.updatedAt
                        ? ` · ${new Date(savedNote.updatedAt).toLocaleString("zh-CN")}`
                        : ""}`
                      : "有未保存更改"}
                </strong>
              </div>
              <div className="design-research-ai-controls">
                <label htmlFor="research-note-provider">
                  <span>AI 辅助</span>
                  <select
                    disabled={researchPreparation.isGeneratingNote}
                    id="research-note-provider"
                    onChange={(event) => researchPreparation.onProviderChange(
                      event.currentTarget.value as AiReviewProviderId,
                    )}
                    value={selectedProvider.providerId}
                  >
                    {researchPreparation.providers.map((provider) => (
                      <option
                        disabled={!provider.configured}
                        key={provider.providerId}
                        value={provider.providerId}
                      >
                        {aiProviderLabels[provider.providerId]}
                        {provider.configured ? "" : " · 未配置"}
                      </option>
                    ))}
                  </select>
                </label>
                <small className="design-research-provider-meta">
                  {usesExternalProvider
                    ? `${selectedProvider.model ?? "模型未配置"} · ${selectedProvider.sanitizedBaseUrl ?? "地址未配置"}`
                    : "确定性本地草稿 · 不发送任何数据"}
                </small>
                {usesExternalProvider ? (
                  <>
                    <p>
                      仅发送市场、标的、周期、缓存区间、行数和派生统计；
                      不会发送原始 K 线或已有研究笔记。
                    </p>
                    <label
                      className="design-research-external-approval"
                      htmlFor="research-note-external-approval"
                    >
                      <input
                        checked={researchPreparation.externalDataApproved}
                        disabled={researchPreparation.isGeneratingNote}
                        id="research-note-external-approval"
                        onChange={(event) => researchPreparation.onExternalDataApprovedChange(
                          event.currentTarget.checked,
                        )}
                        type="checkbox"
                      />
                      <span>本次允许发送上述摘要</span>
                    </label>
                  </>
                ) : null}
                <button
                  className="design-secondary-action"
                  disabled={!canGenerateNote}
                  id="research-note-generate"
                  onClick={researchPreparation.onGenerateNote}
                  type="button"
                >
                  <Sparkles aria-hidden="true" size={13} />
                  {researchPreparation.isGeneratingNote
                    ? "正在生成草稿"
                    : usesExternalProvider
                      ? noteDraftBody
                        ? "AI 重新生成并替换"
                        : "AI 生成草稿"
                      : noteDraftBody
                        ? "重新生成并替换"
                        : "生成本地草稿"}
                </button>
                {researchPreparation.generationError ? (
                  <small className="design-research-generation-message error" role="alert">
                    {researchPreparation.generationError}
                  </small>
                ) : researchPreparation.generationStatus ? (
                  <small className="design-research-generation-message" role="status">
                    {researchPreparation.generationStatus}
                  </small>
                ) : null}
              </div>
              <button
                className="design-secondary-action"
                disabled={
                  researchPreparation.isGeneratingNote
                  || researchPreparation.isSavingNote
                  || !noteDraftBody
                }
                id="research-note-save"
                onClick={researchPreparation.onSaveNote}
                type="button"
              >
                <Save aria-hidden="true" size={13} />
                {researchPreparation.isSavingNote ? "正在保存笔记" : "保存研究笔记"}
              </button>
              <button
                className="design-secondary-action"
                disabled={researchPreparation.isSavingWorkspace}
                id="research-workspace-save"
                onClick={researchPreparation.onSaveWorkspace}
                type="button"
              >
                <Save aria-hidden="true" size={13} />
                {researchPreparation.isSavingWorkspace
                  ? "正在保存工作区"
                  : researchPreparation.workspaceSaved
                    ? "工作区已保存"
                    : "保存当前工作区"}
              </button>
            </div>
          </div>
        </SurfacePanel>
      </div>
    </>
  );
}

function StrategySurface({
  action,
  strategyWorkbench,
  workspace,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  "action" | "strategyWorkbench" | "workspace"
>) {
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
      <section
        aria-label="策略构建与版本治理"
        className="design-strategy-workbench"
      >
        {strategyWorkbench}
      </section>
    </>
  );
}

function BacktestSurface({
  action,
  colorScheme,
  runs,
  strategyExperiment,
  workspace,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  "action" | "colorScheme" | "runs" | "strategyExperiment" | "workspace"
>) {
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
  const walkForward = strategyExperiment.walkForward;
  const updateWalkForward = (
    field: keyof StrategyExperimentWalkForward,
    value: number,
  ) => {
    if (!walkForward || !Number.isInteger(value) || value < 1) return;
    strategyExperiment.onWalkForwardChange({ ...walkForward, [field]: value });
  };
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
                <LineChartCanvas colorScheme={colorScheme} points={curveForChart} />
                <LineChartCanvas
                  colorScheme={colorScheme}
                  points={curveForChart.map((value, index) =>
                    1 + (value - 1) * 0.42 + index * 0.002,
                  )}
                  tone="blue"
                />
                {!curveForChart.length ? (
                  <div className="design-chart-empty">
                    <EmptyState
                      detail="点击右上角“运行回测”，完成后在此显示净值与基准。"
                      title="暂无权威净值曲线"
                    />
                  </div>
                ) : null}
              </div>
              <div className="design-drawdown-strip">
                <span>回撤（%）</span>
                <LineChartCanvas
                  colorScheme={colorScheme}
                  points={drawdown}
                  tone="red"
                />
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
                      <EmptyState
                        detail="净值、成本假设与验证结果仍可独立复核。"
                        title="当前运行未产生交易"
                      />
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
          <SurfacePanel
            title="样本外验证"
            subtitle="为下一次实验生成可审计的滚动前推证据"
          >
            <label className="design-evidence-toggle" htmlFor="backtest-walk-forward">
              <input
                checked={Boolean(walkForward)}
                disabled={strategyExperiment.busy}
                id="backtest-walk-forward"
                onChange={(event) => strategyExperiment.onWalkForwardChange(
                  event.currentTarget.checked
                    ? DEFAULT_STRATEGY_EXPERIMENT_WALK_FORWARD
                    : null,
                )}
                type="checkbox"
              />
              <span>
                <strong>滚动前推依据</strong>
                <small>启用后，AI 评审会检查样本外窗口，而不是只看单次回测。</small>
              </span>
              <Status tone={walkForward ? "positive" : "warning"}>
                {walkForward ? "已启用" : "未启用"}
              </Status>
            </label>
            {walkForward ? (
              <div className="design-evidence-fields">
                <label htmlFor="backtest-walk-forward-train">
                  <span>训练 K 线数</span>
                  <input
                    disabled={strategyExperiment.busy}
                    id="backtest-walk-forward-train"
                    min={1}
                    onChange={(event) => updateWalkForward(
                      "trainBars",
                      event.currentTarget.valueAsNumber,
                    )}
                    type="number"
                    value={walkForward.trainBars}
                  />
                </label>
                <label htmlFor="backtest-walk-forward-validation">
                  <span>验证 K 线数</span>
                  <input
                    disabled={strategyExperiment.busy}
                    id="backtest-walk-forward-validation"
                    min={1}
                    onChange={(event) => updateWalkForward(
                      "validationBars",
                      event.currentTarget.valueAsNumber,
                    )}
                    type="number"
                    value={walkForward.validationBars}
                  />
                </label>
                <label htmlFor="backtest-walk-forward-step">
                  <span>步进 K 线数</span>
                  <input
                    disabled={strategyExperiment.busy}
                    id="backtest-walk-forward-step"
                    min={1}
                    onChange={(event) => updateWalkForward(
                      "stepBars",
                      event.currentTarget.valueAsNumber,
                    )}
                    type="number"
                    value={walkForward.stepBars}
                  />
                </label>
              </div>
            ) : (
              <p className="design-evidence-hint">
                未启用时仍可回测，但 AI 确定性评估会把样本外证据标记为不足。
              </p>
            )}
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
  aiReview,
  workspace,
}: Pick<TerminalWorkspaceSurfaceProps, "action" | "aiReview" | "workspace">) {
  const currentReview = aiReview.currentReview;
  const deterministicAssessment = currentReview?.deterministicAssessment ?? null;
  const externalAssessment = currentReview?.externalAssessment ?? null;
  const hasCurrentReview = Boolean(currentReview);
  const hasCurrentEvidence = Boolean(currentReview || workspace.researchRun);
  const configuredProvider = aiReview.providers.find(
    (provider) => provider.providerId === aiReview.providerId,
  );
  const usesExternalProvider = aiReviewRequiresExternalApproval(aiReview.providerId);
  const selectedProvider = aiReview.providers.find(
    (provider) => provider.providerId === (externalAssessment?.provider ?? aiReview.providerId),
  );
  const comparisonMetricRows = [
    ["收益率", "totalReturnPct"],
    ["最大回撤", "maxDrawdownPct"],
    ["胜率", "winRatePct"],
    ["交易数", "tradeCount"],
  ] as const;
  const reviewExperiments = currentReview
    ? [currentReview.primaryExperiment, ...currentReview.comparisonExperiments]
    : [];
  const reviewMetricValue = (
    experiment: AiReviewExperimentReference,
    metric: (typeof comparisonMetricRows)[number][1],
  ) => {
    const evidence = currentReview?.evidenceBundle.evidenceItems.find((item) =>
      item.kind === "candidate_metrics"
      && item.id.startsWith(`experiment:${experiment.experimentId}:candidate:`)
      && item.value.selected === true
      && item.value.candidateId === experiment.selectedCandidateId,
    );
    const testMetrics = evidence?.value.testMetrics;
    const value = testMetrics && typeof testMetrics === "object"
      ? (testMetrics as Record<string, unknown>)[metric]
      : null;
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    return metric === "tradeCount" ? String(value) : `${value.toFixed(2)}%`;
  };
  const currentReviewId = compactRunId(currentReview?.aiReviewId);
  const currentRunId = compactRunId(
    currentReview?.primaryExperiment.sourceRunId ?? workspace.researchRun?.runId,
  );
  const evidenceHash = compactRunId(currentReview?.evidenceHash);
  const recordHash = compactRunId(currentReview?.recordHash);
  const primaryExperimentId = currentReview?.primaryExperiment.experimentId
    ?? aiReview.primaryExperimentId;
  const comparisonCount = currentReview?.comparisonExperiments.length
    ?? aiReview.comparisonExperimentIds.length;
  const primarySelection = aiReview.experiments.find(
    (experiment) => experiment.experimentId === aiReview.primaryExperimentId,
  ) ?? null;
  const comparisonOptions = primarySelection
    ? aiReview.experiments
        .filter((experiment) => experiment.experimentId !== primarySelection.experimentId)
        .map((experiment) => {
          const selected = aiReview.comparisonExperimentIds.includes(experiment.experimentId);
          const eligibility = selected
            ? { eligible: true, reason: null }
            : buildComparisonEligibility(
                primarySelection,
                experiment,
                aiReview.comparisonExperimentIds,
              );
          return { eligibility, experiment, selected };
        })
    : [];
  const localizedMessage = (message: string | undefined, fallback: string) =>
    message ? terminalSurfaceZh.decisionMessage(message) : fallback;
  const stanceLabel = (stance: AiReviewStance | undefined) =>
    stance
      ? terminalSurfaceZh.t(`aiReviewStage3.stance.${stance}` as TranslationKey)
      : "待运行";
  const stanceTone = (stance: AiReviewStance | undefined) => {
    if (stance === "supported") return "positive" as const;
    if (stance === "blocked") return "risk" as const;
    if (stance === "caution" || stance === "insufficient_evidence") return "warning" as const;
    return "neutral" as const;
  };
  const consistencyLabel = deterministicAssessment
    ? deterministicAssessment.consistency === "insufficient" && comparisonCount === 0
      ? "未选择对照实验"
      : terminalSurfaceZh.t(
          `aiReviewStage3.consistency.${deterministicAssessment.consistency}` as TranslationKey,
        )
    : "—";
  const externalTone = externalAssessment?.status === "completed"
    ? stanceTone(externalAssessment.assessment?.stance)
    : externalAssessment?.status === "failed"
      ? "risk" as const
      : "neutral" as const;
  const externalLabel = externalAssessment?.status === "completed"
    ? stanceLabel(externalAssessment.assessment?.stance)
    : externalAssessment
      ? terminalSurfaceZh.t(
          `aiReviewStage3.external.status.${externalAssessment.status}` as TranslationKey,
        )
      : "待运行";
  const externalErrorKey = externalAssessment?.error?.code === "ai_review_provider_not_configured"
    ? "aiReviewStage3.external.error.ai_review_provider_not_configured"
    : externalAssessment?.error?.code === "timeout"
      ? "aiReviewStage3.external.error.timeout"
      : externalAssessment?.error?.code === "invalid_schema"
        ? "aiReviewStage3.external.error.invalid_schema"
      : "aiReviewStage3.external.error.generic";
  const externalSummary = externalAssessment?.assessment?.summary
    ? localizedMessage(externalAssessment.assessment.summary, externalAssessment.assessment.summary)
    : externalAssessment?.error
      ? terminalSurfaceZh.t(externalErrorKey)
      : externalAssessment
        ? terminalSurfaceZh.t(
            `aiReviewStage3.external.${externalAssessment.status}` as TranslationKey,
          )
        : "运行权威评审后，才会显示外部模型的补充意见。";
  const assessmentRows = currentReview && deterministicAssessment
    ? [
        {
          agent: "确定性评估",
          id: `${currentReview.aiReviewId}-deterministic`,
          message: deterministicAssessment.summary,
          runId: currentReview.aiReviewId,
          status: stanceLabel(deterministicAssessment.stance),
          tone: stanceTone(deterministicAssessment.stance),
          version: "基线",
        },
        ...(externalAssessment?.status === "completed" && externalAssessment.assessment
          ? [{
              agent: aiProviderLabels[externalAssessment.provider],
              id: `${currentReview.aiReviewId}-external`,
              message: externalAssessment.assessment.summary,
              runId: currentReview.aiReviewId,
              status: stanceLabel(externalAssessment.assessment.stance),
              tone: stanceTone(externalAssessment.assessment.stance),
              version: "外部",
            }]
          : []),
      ]
    : [];
  const appendedDecisionRows = [...aiReview.decisions].reverse().map((decision, index) => ({
    agent: decision.operator,
    id: decision.decisionId,
    message: decision.rationale,
    runId: decision.aiReviewId,
    status: terminalSurfaceZh.t(`aiReviewStage3.decision.${decision.status}` as TranslationKey),
    tone: decision.status === "accepted_for_research"
      ? "positive" as const
      : decision.status === "rejected"
        ? "risk" as const
        : "warning" as const,
    version: `D${aiReview.decisions.length - index}`,
  }));
  const decisionRows = [...appendedDecisionRows, ...assessmentRows].slice(0, 5);
  const chainRows = ["回测运行", "证据包", "因子库", "数据同步", "审计回放"];
  const timelineRows = ["证据锁定", "确定性评估", "外部评估", "追加决策"];
  return (
    <>
      <PageHeader
        action={action}
        title="AI 评审"
        subtitle={`/ ${currentReviewId}`}
      >
        <div className="design-meta-line">
          <LockKeyhole size={13} /> 证据锁定：
          {hasCurrentEvidence ? "已锁定（不可修改）" : "等待运行"}
        </div>
      </PageHeader>
      {aiReview.error ? (
        <div className="design-ai-run-error" role="alert">
          <AlertTriangle size={16} />
          <span>{aiReview.error}</span>
        </div>
      ) : null}
      <div className="design-ai-grid">
        <section className="design-ai-overview" aria-label="当前评审上下文">
          <div>
            <span>当前评审</span>
            <strong>{currentReviewId}</strong>
            <small>{hasCurrentReview ? "已载入权威评审" : "等待权威评审"}</small>
          </div>
          <div>
            <span>证据状态</span>
            <strong>{hasCurrentEvidence ? "已锁定" : "未锁定"}</strong>
            <small>{hasCurrentEvidence ? "只读 · 不可修改" : "运行研究后生成"}</small>
          </div>
          <div>
            <span>实验范围</span>
            <strong>
              {primaryExperimentId
                ? `1 个主实验 · ${comparisonCount} 个对照`
                : "等待选择主实验"}
            </strong>
            <small>{primaryExperimentId ? "同一证据口径横向比较" : "先完成回测实验"}</small>
          </div>
          <div>
            <span>安全基线</span>
            <strong>本地确定性优先</strong>
            <small>外部失败不会覆盖基线</small>
          </div>
        </section>

        <main className="design-ai-main">
          <SurfacePanel
            className="design-ai-review"
            subtitle="确定性基线优先，外部模型仅提供补充意见"
            title="评审结论"
          >
            <div className="design-ai-verdicts">
              <article className="design-ai-verdict primary">
                <header>
                  <div>
                    <span>确定性评估</span>
                    <small>本地基线</small>
                  </div>
                  {deterministicAssessment?.stance === "supported"
                    ? <CheckCircle2 size={22} />
                    : deterministicAssessment?.stance === "blocked"
                      ? <XCircle size={22} />
                      : <Clock3 size={22} />}
                </header>
                <strong>{stanceLabel(deterministicAssessment?.stance)}</strong>
                <p>
                  {deterministicAssessment
                    ? localizedMessage(deterministicAssessment.summary, deterministicAssessment.summary)
                    : hasCurrentEvidence
                      ? "证据已锁定，运行权威评审后形成确定性结论。"
                      : "运行研究并锁定证据后，才会形成权威评审结论。"}
                </p>
                <footer>
                  <Status tone={stanceTone(deterministicAssessment?.stance)}>
                    {deterministicAssessment ? `一致性：${consistencyLabel}` : "尚未运行"}
                  </Status>
                  <span>{deterministicAssessment ? "确定性基线" : "等待评审"}</span>
                </footer>
              </article>
              <article className="design-ai-verdict external">
                <header>
                  <div>
                    <span>外部评估</span>
                    <small>补充意见</small>
                  </div>
                  {externalTone === "positive"
                    ? <CheckCircle2 size={22} />
                    : externalTone === "risk"
                      ? <XCircle size={22} />
                      : <Clock3 size={22} />}
                </header>
                <strong>{externalLabel}</strong>
                <p>{externalSummary}</p>
                <footer>
                  <Status tone={externalTone}>
                    {externalAssessment?.status === "completed"
                      ? `一致性：${externalAssessment.assessment
                          ? terminalSurfaceZh.t(
                              `aiReviewStage3.consistency.${externalAssessment.assessment.consistency}` as TranslationKey,
                            )
                          : "—"}`
                      : externalLabel}
                  </Status>
                  <span>{externalAssessment?.model ?? "等待模型结果"}</span>
                </footer>
              </article>
            </div>
            <div className="design-ai-baseline">
              <ShieldCheck size={17} />
              <div>
                <strong>{hasCurrentReview ? "权威基线保持不变" : "等待建立权威基线"}</strong>
                <span>外部评估失败、超时或不一致，均不会覆盖确定性本地结果。</span>
              </div>
              <Status>{hasCurrentReview ? "基线有效" : "安全边界有效"}</Status>
            </div>
          </SurfacePanel>

          <SurfacePanel
            className="design-ai-evidence"
            subtitle={currentReview?.comparisonExperiments.length
              ? "主实验与本次评审实际加入的对照实验"
              : "当前评审未加入对照实验"}
            title="实验指标对比"
          >
            {currentReview ? (
              <table className="design-table">
                <thead>
                  <tr>
                    <th>指标</th>
                    {reviewExperiments.map((experiment, index) => (
                      <th key={experiment.experimentId} title={experiment.experimentId}>
                        {index === 0
                          ? "主实验"
                          : `对照实验 ${index} · ${compactRunId(experiment.experimentId)}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonMetricRows.map(([label, metric]) => (
                    <tr key={metric}>
                      <td>{label}</td>
                      {reviewExperiments.map((experiment) => (
                        <td key={experiment.experimentId}>{reviewMetricValue(experiment, metric)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                detail="运行评审后显示主实验与已选对照实验的权威指标。"
                title="等待权威评审"
              />
            )}
          </SurfacePanel>

          <SurfacePanel
            className="design-ai-decisions"
            subtitle="只追加，不覆盖历史结论"
            title="评审记录"
          >
            {decisionRows.length ? (
              <div className="design-decision-head" aria-hidden="true">
                <span>版本</span>
                <span>评审角色</span>
                <span>结论</span>
                <span>依据摘要</span>
                <span>评审记录</span>
              </div>
            ) : null}
            {decisionRows.map((decision) => (
              <div className="design-decision-row" key={decision.id}>
                <span>{decision.version}</span>
                <strong>{terminalSurfaceZh.decisionAgent(decision.agent)}</strong>
                <Status tone={decision.tone}>{decision.status}</Status>
                <p>{terminalSurfaceZh.decisionMessage(decision.message)}</p>
                <small>{compactRunId(decision.runId)}</small>
              </div>
            ))}
            {!decisionRows.length ? (
              <p className="design-ai-empty">暂无当前权威评审记录，请先运行评审或载入最近评审。</p>
            ) : null}
          </SurfacePanel>
        </main>

        <aside className="design-ai-side">
          <SurfacePanel
            title="对照实验"
            subtitle="仅允许同标的、同周期、同策略谱系，最多 4 个"
          >
            {primarySelection ? (
              comparisonOptions.length ? (
                <div className="design-ai-comparison-list">
                  {comparisonOptions.map(({ eligibility, experiment, selected }) => (
                    <label
                      className={`design-ai-external-approval ${eligibility.eligible ? "eligible" : "ineligible"}`}
                      key={experiment.experimentId}
                    >
                      <input
                        checked={selected}
                        disabled={aiReview.busy || (!selected && !eligibility.eligible)}
                        onChange={() => aiReview.onComparisonToggle(experiment.experimentId)}
                        type="checkbox"
                      />
                      <span className="design-ai-external-approval-copy">
                        <strong>{compactRunId(experiment.experimentId)}</strong>
                        <small>
                          {selected
                            ? "已加入本次评审"
                            : eligibility.reason
                              ? terminalSurfaceZh.t(
                                  `aiReviewStage3.reason.${eligibility.reason}` as TranslationKey,
                                )
                              : terminalSurfaceZh.t("aiReviewStage3.eligible")}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              ) : <p className="design-ai-empty">暂无其他可选实验</p>
            ) : <p className="design-ai-empty">请先完成并选择主实验</p>}
          </SurfacePanel>
          <SurfacePanel
            title="评审设置"
            subtitle="选择本次评审使用的补充模型"
          >
            <div className="design-research-ai-controls design-ai-provider-controls">
              <label htmlFor="ai-review-provider">
                <span>模型服务</span>
                <select
                  disabled={aiReview.busy || !aiReview.providers.length}
                  id="ai-review-provider"
                  onChange={(event) => aiReview.onProviderChange(
                    event.currentTarget.value as AiReviewProviderId,
                  )}
                  value={aiReview.providerId}
                >
                  {!aiReview.providers.length ? (
                    <option value={aiReview.providerId}>
                      {aiProviderLabels[aiReview.providerId]} · 正在加载
                    </option>
                  ) : null}
                  {aiReview.providers.map((provider) => (
                    <option
                      disabled={!provider.configured}
                      key={provider.providerId}
                      value={provider.providerId}
                    >
                      {aiProviderLabels[provider.providerId]}
                      {provider.configured ? "" : " · 未配置"}
                    </option>
                  ))}
                </select>
              </label>
              <small className="design-research-provider-meta">
                {configuredProvider
                  ? usesExternalProvider
                    ? `${configuredProvider.model ?? "模型未配置"} · ${configuredProvider.sanitizedBaseUrl ?? "地址未配置"}`
                    : "确定性本地评估 · 不发送任何数据"
                  : "正在加载服务配置"}
              </small>
              {usesExternalProvider ? (
                <>
                  <p>
                    仅发送实验引用与哈希、策略定义、数据质量摘要和候选指标证据；
                    不发送原始 K 线、密钥或已有研究笔记。
                  </p>
                  <label
                    className="design-ai-external-approval"
                    htmlFor="ai-review-external-approval"
                  >
                    <input
                      checked={aiReview.externalDataApproved}
                      disabled={aiReview.busy}
                      id="ai-review-external-approval"
                      onChange={(event) => aiReview.onExternalDataApprovedChange(
                        event.currentTarget.checked,
                      )}
                      type="checkbox"
                    />
                    <span className="design-ai-external-approval-copy">
                      <strong>允许发送证据摘要</strong>
                      <small>仅本次评审有效，切换模型或实验后需重新确认</small>
                    </span>
                  </label>
                </>
              ) : (
                <p>当前只运行本地确定性评估，外部评估会明确记录为“已跳过”。</p>
              )}
            </div>
          </SurfacePanel>
          <SurfacePanel title="证据与审计">
            <div className="design-ai-chain">
              {chainRows.map((label, index) => (
                <div className="design-chain-row" key={label}>
                  <span>{index + 1}</span>
                  <strong>{label}</strong>
                  <small>{hasCurrentReview ? currentRunId : "等待运行"}</small>
                </div>
              ))}
            </div>
            <div className="design-ai-audit-grid">
              <div><span>证据包 Hash</span><strong>{evidenceHash}</strong></div>
              <div><span>评审记录 Hash</span><strong>{recordHash}</strong></div>
              <div><span>决策链</span><strong>只追加</strong></div>
            </div>
          </SurfacePanel>

          <SurfacePanel title="模型披露">
            <div className="design-kv-row">
              <span>模型提供方</span>
              <strong>{aiProviderLabels[externalAssessment?.provider ?? aiReview.providerId]}</strong>
            </div>
            <div className="design-kv-row">
              <span>模型</span>
              <strong>{externalAssessment?.model ?? selectedProvider?.model ?? "—"}</strong>
            </div>
            <div className="design-kv-row">
              <span>出站字段</span>
              <strong>仅指标聚合与摘要</strong>
            </div>
            <div className="design-ai-disclosure">
              <LockKeyhole size={14} /> 不发送原始 K 线、密钥或已有研究笔记
            </div>
          </SurfacePanel>

          <SurfacePanel title="评审进度">
            {timelineRows.map((label, index) => {
              const completed = hasCurrentReview && (
                index < 2 || (index === 2 && externalAssessment?.status === "completed")
              );
              return (
                <div className="design-history-row" key={label}>
                  <i className={completed ? "done" : ""} />
                  <span>{label}</span>
                  <strong>{completed ? "完成" : "待复核"}</strong>
                </div>
              );
            })}
          </SurfacePanel>

          <SurfacePanel title="最近评审">
            {aiReview.history.slice(0, 3).map((review) => (
              <div className="design-history-row" key={review.aiReviewId}>
                <i className="done" />
                <span>{compactRunId(review.aiReviewId)}</span>
                <Status>已保存</Status>
              </div>
            ))}
            {!aiReview.history.length ? <p className="design-ai-empty">暂无已保存评审</p> : null}
          </SurfacePanel>
        </aside>
      </div>
    </>
  );
}

function PortfolioSurface({
  action,
  approvingPortfolioOrderId,
  onApprovePortfolioOrder,
  onRejectPortfolioOrder,
  portfolio,
  portfolioActionError,
  portfolioGoldenPath,
  portfolioPaperOrderApprovalRows,
  workspace,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  | "action"
  | "approvingPortfolioOrderId"
  | "onApprovePortfolioOrder"
  | "onRejectPortfolioOrder"
  | "portfolio"
  | "portfolioActionError"
  | "portfolioGoldenPath"
  | "portfolioPaperOrderApprovalRows"
  | "workspace"
>) {
  const cashWeight = portfolio?.cashWeight ?? 1;
  const legs = portfolio?.legs ?? [];
  const approvalRows = portfolioPaperOrderApprovalRows ?? [];
  const pendingApprovalCount = approvalRows.filter(
    (row) => row.state === "awaiting_operator_review" || row.state === "risk_review",
  ).length;
  const approvedRows = approvalRows.filter((row) => row.state === "ready_for_simulation");
  const skippedApprovalCount = approvalRows.filter((row) => row.state === "skipped").length;
  const rejectedApprovalCount = approvalRows.filter(
    (row) => row.state === "operator_rejected" || row.state === "risk_rejected",
  ).length;
  const invalidApprovalCount = approvalRows.filter((row) => row.state === "invalid_order").length;
  const stepLabels: Record<string, string> = {
    "portfolio-build": "组合构建",
    "risk-review": "风控复核",
    "operator-approval": "人工审批",
    "paper-simulation": "批量模拟成交",
    "account-replay": "账户回放",
  };
  const steps = portfolioGoldenPath?.steps ??
    Object.entries(stepLabels).map(([id, label], index) => ({
      id,
      label,
      passed: false,
      status: "review" as const,
      detail: index === 0 ? "等待组合构建" : "等待前置步骤",
      actionId: index === 0 ? "run-portfolio-backtest" : null,
    }));
  const currentStepId = portfolioGoldenPath?.currentStepId ?? "portfolio-build";
  const showApprovalPanel =
    currentStepId === "operator-approval" || approvalRows.some((row) => row.state !== "skipped");
  const currentStep = steps.find((step) => step.id === currentStepId) ?? steps[0];
  const goldenPathComplete = portfolioGoldenPath?.status === "ready";
  const currentStepLabel = goldenPathComplete
    ? "黄金路径已完成"
    : stepLabels[currentStep?.id] ?? currentStep?.label ?? "组合构建";
  return (
    <>
      <PageHeader
        action={action}
        title="组合风控"
        subtitle={`/ ${portfolio?.name ?? "核心组合"}`}
      >
        <div aria-label="组合黄金路径进度" className="design-portfolio-steps">
          {steps.map((step, index) => {
            const isCurrent = !goldenPathComplete && step.id === currentStepId;
            return (
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`${step.passed ? "done" : ""} ${isCurrent ? "active" : ""} ${
                  isCurrent && step.status === "blocked" ? "blocked" : ""
                }`.trim()}
                key={step.id}
              >
                <i>{step.passed ? <Check size={12} /> : index + 1}</i>
                {stepLabels[step.id] ?? step.label}
              </span>
            );
          })}
        </div>
      </PageHeader>
      {portfolioActionError ? (
        <div className="design-portfolio-action-error" role="alert">
          <AlertTriangle aria-hidden="true" size={17} />
          <div>
            <strong>暂时无法继续黄金路径</strong>
            <span>{portfolioActionError}</span>
          </div>
        </div>
      ) : null}
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
                    <EmptyState
                      detail="继续右上角黄金路径，通过同市场、同周期审计后显示。"
                      title="暂无可展示的组合腿"
                    />
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
              <strong>{currentStepLabel}</strong>
            </div>
            <div className="design-kv-row">
              <span>操作权限</span>
              <Status tone={portfolioGoldenPath?.status === "blocked" ? "risk" : "positive"}>
                {portfolioGoldenPath?.status === "blocked"
                  ? "当前步骤已阻断"
                  : goldenPathComplete
                    ? "流程已完成"
                    : "可继续推进"}
              </Status>
            </div>
          </SurfacePanel>
          <SurfacePanel title="审批状态">
            <div className="design-kv-row">
              <span>提交状态</span>
              <strong>
                {approvalRows.length
                  ? pendingApprovalCount
                    ? `${pendingApprovalCount} 笔待审批`
                    : rejectedApprovalCount
                      ? `${rejectedApprovalCount} 笔审批未通过`
                      : invalidApprovalCount
                        ? `${invalidApprovalCount} 笔委托无效`
                    : skippedApprovalCount === approvalRows.length
                      ? "无需人工审批"
                      : "审批完成"
                  : "—"}
              </strong>
            </div>
            <div className="design-kv-row">
              <span>审批人</span>
              <strong>{approvedRows[0]?.approvedBy ?? "—"}</strong>
            </div>
            <div className="design-kv-row">
              <span>审批意见</span>
              <strong>
                {rejectedApprovalCount
                  ? `${rejectedApprovalCount} 笔已拒绝`
                  : approvedRows.length
                    ? `${approvedRows.length} 笔已批准`
                    : skippedApprovalCount === approvalRows.length && approvalRows.length
                      ? "没有需审批委托"
                    : approvalRows.length
                      ? "等待人工确认"
                      : "—"}
              </strong>
            </div>
            {["路由风险", "模拟成交状态", "回放精确性"].map((label) => (
              <div className="design-kv-row" key={label}>
                <span>{label}</span>
                <strong>未运行</strong>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="状态时间线">
            {steps.map((step) => {
              const isCurrent = !goldenPathComplete && step.id === currentStepId;
              return (
                <div className="design-history-row" key={step.id}>
                  <i className={step.passed ? "done" : isCurrent ? "current" : ""} />
                  <span>{stepLabels[step.id] ?? step.label}</span>
                  <strong>{step.passed ? "完成" : isCurrent ? "当前" : "—"}</strong>
                </div>
              );
            })}
          </SurfacePanel>
        </div>
        {showApprovalPanel ? (
          <SurfacePanel
            action={
              <Status tone={pendingApprovalCount ? "warning" : rejectedApprovalCount ? "risk" : "positive"}>
                {pendingApprovalCount
                  ? `${pendingApprovalCount} 笔待审批`
                  : rejectedApprovalCount
                    ? `${rejectedApprovalCount} 笔已拒绝`
                    : invalidApprovalCount
                      ? `${invalidApprovalCount} 笔委托无效`
                    : skippedApprovalCount === approvalRows.length
                      ? "无需人工审批"
                      : "审批完成"}
              </Status>
            }
            className="design-portfolio-approval"
            subtitle="人工确认只作用于模拟委托，不会提交真实订单"
            title="组合委托人工审批"
          >
            <div
              aria-label="组合委托人工审批"
              className="portfolio-order-approval"
              tabIndex={-1}
            >
              <div className="portfolio-order-approval-list">
                {approvalRows.map((row) => {
                  const isApproving = approvingPortfolioOrderId === row.id;
                  const sideLabel = row.side === "buy" ? "买入" : row.side === "sell" ? "卖出" : "持有";
                  const stateLabel =
                    row.state === "ready_for_simulation"
                      ? "已批准，等待模拟成交"
                      : row.state === "operator_rejected"
                        ? "人工已拒绝"
                        : row.state === "risk_rejected"
                          ? "风控已拒绝"
                          : row.state === "risk_review"
                            ? "等待风险复核"
                            : row.state === "invalid_order"
                              ? "委托无效"
                              : row.state === "skipped"
                                ? "无需审批"
                                : "等待人工审批";
                  const actionHint =
                    row.state === "ready_for_simulation"
                      ? "人工审批已通过，可以进入纸面模拟成交。"
                      : row.state === "operator_rejected"
                        ? "人工已拒绝，本委托不会进入模拟成交。"
                        : row.state === "risk_rejected"
                          ? "风控已拒绝，本委托不能进入模拟成交。"
                          : row.state === "risk_review"
                            ? "风险复核尚未完成，暂不能批准。"
                            : row.state === "invalid_order"
                              ? "委托参数无效，不能进入模拟成交。"
                              : row.state === "skipped"
                                ? "当前为持有或跳过委托，无需人工操作。"
                                : "风控已通过，等待人工批准或拒绝。";
                  return (
                    <article className={`portfolio-order-approval-row ${row.tone}`} key={row.id}>
                      <div>
                        <strong>{row.symbol} · {sideLabel}</strong>
                        <span>{row.orderId}</span>
                        <p>{actionHint}</p>
                      </div>
                      <div className="portfolio-order-approval-meta">
                        <span>
                          <small>数量</small>
                          {row.quantity.toLocaleString("zh-CN", { maximumFractionDigits: 4 })}
                        </span>
                        <span>
                          <small>名义金额</small>
                          {row.notionalValue.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}
                        </span>
                        <span>
                          <small>当前状态</small>
                          {stateLabel}
                        </span>
                      </div>
                      <div className="portfolio-order-approval-actions">
                        <button
                          aria-label={`批准 ${row.symbol}`}
                          className="approve"
                          disabled={!row.canApprove || isApproving || !onApprovePortfolioOrder}
                          onClick={() => onApprovePortfolioOrder?.(row)}
                          type="button"
                        >
                          {isApproving ? <RefreshCw className="spin" size={13} /> : <Check size={13} />}
                          批准
                        </button>
                        <button
                          aria-label={`拒绝 ${row.symbol}`}
                          className="reject"
                          disabled={!row.canReject || isApproving || !onRejectPortfolioOrder}
                          onClick={() => onRejectPortfolioOrder?.(row)}
                          type="button"
                        >
                          <XCircle size={13} />
                          拒绝
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </SurfacePanel>
        ) : null}
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
  executionReadiness,
  workspace,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  "action" | "executionCandidate" | "executionReadiness" | "workspace"
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
      {executionReadiness ? (
        <div className="design-execution-readiness">{executionReadiness}</div>
      ) : null}
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
                    <EmptyState
                      detail="创建 Stage 9 候选并通过路由预检后显示；不会提交真实订单。"
                      title="暂无权威影子候选"
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </SurfacePanel>
        <div className="design-execution-side">
          <SurfacePanel title="路由预检">
            {workspace.execution.gates.map((gate) => (
              <div
                className={`design-check-row ${gate.passed ? "positive" : "warning"}`}
                key={gate.id}
              >
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
                    <EmptyState
                      detail="Stage 9 影子候选创建后，事件将按权威时间顺序追加。"
                      title="尚无执行事件"
                    />
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
            <table className="design-table compact design-adapter-table">
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
      onScroll={(event) => props.onScrollPositionChange(event.currentTarget.scrollTop)}
      ref={props.surfaceRef}
    >
      {content}
    </section>
  );
}
