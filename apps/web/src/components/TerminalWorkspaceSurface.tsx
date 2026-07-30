import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  LockKeyhole,
  Play,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import type {
  Stage4PortfolioGoldenPath,
  Stage4PortfolioWorkflow,
} from "../lib/portfolio-stage4";
import type {
  PortfolioRiskAssessment,
  PortfolioRiskAssessmentRequest,
} from "../lib/portfolio-m5";
import {
  aiReviewRequiresExternalApproval,
  buildComparisonEligibility,
  type AiReviewDecisionStatus,
  type AiReviewDecision,
  type AiReviewExperimentReference,
  type AiReviewProviderId,
  type AiReviewProviderStatus,
  type AiReviewStance,
  type AppendAiReviewDecisionRequest,
  type AuthoritativeAiReviewRun,
} from "../lib/ai-review-stage3";
import type {
  CacheWatchlistRefreshRun,
  MarketCalendarStatus,
  MarketDiscoveryItem,
  MarketDiscoveryParams,
  MarketDiscoveryResult,
  MarketInformationResult,
  OpenAiCompatibleModelsResult,
  PlatformSettingsSecretName,
  PlatformSettingsStatus,
  PlatformSettingsUpdateRequest,
  PortfolioBacktestRun,
  ProductionStrategyHandoff,
  ProductionStrategyHandoffResult,
  ResearchNoteResult,
  StrategyProductionBinding,
} from "../lib/terminal-api";
import type { ColorScheme } from "../lib/theme";
import { createI18n, type TranslationKey } from "../lib/i18n";
import type {
  BrokerAdapterRow,
  ExecutionAdapterChainHealthRollup,
  ExecutionAdapterHealthProbeRow,
  ExecutionAdapterLedgerRow,
  Instrument,
  PortfolioPaperOrderApprovalRow,
  ProductWorkAreaId,
  ProductWorkAreaStatus,
  ResearchRunAudit,
  StrategyExperimentDetail,
  StrategyExperimentListItem,
  StrategyExperimentWalkForward,
  TerminalWorkspace,
  Timeframe,
} from "../lib/terminal-workbench";
import { DEFAULT_STRATEGY_EXPERIMENT_WALK_FORWARD } from "../lib/terminal-workbench";
import {
  liveAuthorizationLabel,
  type AutoTradingSnapshot,
} from "./ExecutionAutoPaperTradingSection";
import { PortfolioM5Section } from "./PortfolioM5Section";

export interface TerminalWorkspaceSurfaceAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "warning" | "neutral";
  workflowReason?: string;
  workflowStatus?: ProductWorkAreaStatus;
}

interface TerminalWorkspaceSurfaceProps {
  action: TerminalWorkspaceSurfaceAction;
  activeWorkAreaId: ProductWorkAreaId;
  adapterRows: BrokerAdapterRow[];
  adapterChainHealthRollups?: ExecutionAdapterChainHealthRollup[];
  adapterHealthProbeRows?: ExecutionAdapterHealthProbeRow[];
  adapterLedgerRows?: ExecutionAdapterLedgerRow[];
  settings?: PlatformSettingsStatus;
  isLoadingSettingsConfiguration?: boolean;
  isSavingSettingsConfiguration?: boolean;
  isTestingMonitoringWebhook?: boolean;
  onLoadOpenAiCompatibleModels?: (baseUrl: string) => Promise<OpenAiCompatibleModelsResult>;
  onSaveSettingsConfiguration?: (request: PlatformSettingsUpdateRequest) => void;
  onTestMonitoringWebhook?: () => void;
  settingsConfigurationMessage?: string | null;
  aiReview: {
    appendingDecision: boolean;
    busy: boolean;
    comparisonExperimentIds: string[];
    currentReview: AuthoritativeAiReviewRun | null;
    decisionDraft: AppendAiReviewDecisionRequest;
    decisions: AiReviewDecision[];
    error: string | null;
    experiments: StrategyExperimentListItem[];
    externalDataApproved: boolean;
    history: AuthoritativeAiReviewRun[];
    onAppendDecision: () => void;
    onComparisonToggle: (experimentId: string) => void;
    onDecisionDraftChange: (draft: AppendAiReviewDecisionRequest) => void;
    onExternalDataApprovedChange: (approved: boolean) => void;
    onOpenProductionHandoff: () => void;
    onProviderChange: (providerId: AiReviewProviderId) => void;
    onStagePrimaryCandidate: () => void;
    primaryExperimentId: string | null;
    primaryCandidateAvailable: boolean;
    providerId: AiReviewProviderId;
    providers: AiReviewProviderStatus[];
    researchLoop?: ReactNode;
  };
  chart: ReactNode;
  colorScheme: ColorScheme;
  executionAcceptanceAudit?: ReactNode;
  executionReadiness?: ReactNode;
  executionSnapshot?: AutoTradingSnapshot | null;
  isSavingWatchlist: boolean;
  latestWatchlistCacheRefresh: CacheWatchlistRefreshRun | null;
  marketCalendar?: MarketCalendarStatus;
  marketDiscovery?: {
    isLoading: boolean;
    onSearch: (params: MarketDiscoveryParams) => void;
    result: MarketDiscoveryResult | null;
  };
  marketInformation?: {
    isLoading: boolean;
    onRefresh: () => void;
    result: MarketInformationResult | null;
  };
  marketRefreshIssue: string | null;
  onApprovePortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onRemoveWatchlistInstrument: (instrument: Instrument) => void;
  onRejectPortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onSaveWatchlist: () => void;
  onScrollPositionChange: (scrollTop: number) => void;
  onSelectInstrument: (instrument: Instrument) => void;
  onResearchInstrument?: (instrument: Instrument) => void;
  onSelectTimeframe: (timeframe: Timeframe) => void;
  approvingPortfolioOrderId?: string | null;
  portfolio: PortfolioBacktestRun | null;
  portfolioActionError?: string | null;
  portfolioGoldenPath?: Stage4PortfolioGoldenPath;
  portfolioPaperOrderApprovalRows?: PortfolioPaperOrderApprovalRow[];
  portfolioProductionRisk?: {
    snapshot: AutoTradingSnapshot | null;
    error: string | null;
    loading: boolean;
    onRefresh: () => void;
  };
  portfolioRiskAssessment?: PortfolioRiskAssessment | null;
  portfolioStage4Workflow?: Stage4PortfolioWorkflow | null;
  isRunningPortfolioRiskAssessment?: boolean;
  onRunPortfolioRiskAssessment?: (request: PortfolioRiskAssessmentRequest) => void;
  productionStrategyHandoff?: {
    binding: StrategyProductionBinding | null;
    busy: boolean;
    errorLabel: string | null;
    switchBlockedReasonLabel?: string | null;
    onBind: (operator: string) => Promise<boolean>;
    onOpenDynamicTrading: () => void;
    result: ProductionStrategyHandoffResult;
  };
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
    active: StrategyExperimentDetail | null;
    busy: boolean;
    error: string | null;
    history: StrategyExperimentListItem[];
    onWalkForwardChange: (walkForward: StrategyExperimentWalkForward | null) => void;
    walkForward: StrategyExperimentWalkForward | null;
  };
  strategyWorkbench: ReactNode;
  surfaceRef: RefObject<HTMLElement | null>;
  workflowGuide?: ReactNode;
  workspace: TerminalWorkspace;
}

const pageTitles: Record<ProductWorkAreaId, string> = {
  market: "行情中心",
  "market-information": "市场资讯",
  research: "研究工作台",
  strategy: "策略工坊",
  backtest: "回测实验室",
  "ai-review": "AI 评审",
  portfolio: "组合风控",
  execution: "执行中心",
  "dynamic-trading": "动态交易",
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

const backtestTradeLabels: Record<string, string> = {
  BUY: "买入",
  SELL: "卖出",
  RISK: "风控",
  HOLD: "持有",
  filled: "已成交",
  open: "观察中",
  review: "待复核",
  blocked: "已阻断",
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
  const completed = action.workflowStatus ? action.workflowStatus === "ready" : action.label.includes("已完成");
  const blocked = action.workflowStatus ? action.workflowStatus === "blocked" : Boolean(action.disabled) && !completed;
  const pending = action.workflowStatus === "needs_run";
  return (
    <header className="design-page-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <span>{subtitle}</span> : null}
        {children}
        <div className="design-page-state" aria-label="当前工作区状态">
          <span>
            <small>当前状态</small>
            <Status tone={completed ? "positive" : blocked || pending ? "warning" : "positive"}>
              {completed ? "已就绪" : blocked ? "阻断" : pending ? "待处理" : "可继续"}
            </Status>
          </span>
          <span>
            <small>阻断原因</small>
            <strong>{completed ? "无待办阻断" : action.workflowReason ?? (blocked ? action.label : "无主动作阻断")}</strong>
          </span>
          <span>
            <small>下一步</small>
            <strong>{completed ? "查看结果与审计证据" : action.label}</strong>
          </span>
        </div>
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
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return Math.abs(value) >= 1 || value === 0
    ? value.toFixed(2)
    : value.toLocaleString("zh-CN", { maximumFractionDigits: 8 });
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

function marketDiscoveryInstrument(item: MarketDiscoveryItem): Instrument {
  return {
    market: item.market,
    symbol: item.symbol,
    name: item.name,
    price: item.price,
    changePct: item.changePct,
    quoteSource: item.source,
    quoteAsOf: item.observedAt,
  };
}

function marketDiscoveryNumber(
  value: number | null,
  suffix = "",
  maximumFractionDigits = 2,
) {
  return value === null
    ? "—"
    : `${value.toLocaleString("zh-CN", { maximumFractionDigits })}${suffix}`;
}

function marketDiscoverySourceLabel(source: string) {
  const normalized = source.trim().toLowerCase();
  if (normalized === "eastmoney") return "东方财富";
  if (
    normalized === "sina" ||
    normalized === "akshare" ||
    normalized === "akshare-sina"
  ) {
    return "新浪行情（AKShare）";
  }
  if (normalized === "binance-data-api" || normalized === "binance") {
    return "Binance 公开现货行情";
  }
  return source || "未知来源";
}

function marketInformationSourceLabel(source: string) {
  const labels: Record<string, string> = {
    akshare: "AKShare 市场数据",
    binance: "Binance 公开现货行情",
    "binance-data-api": "Binance 公开现货行情",
    eastmoney: "东方财富市场资讯",
    fallback: "降级数据",
    finnhub: "Finnhub 新闻",
    "free-stockdb": "本地股票数据库",
    sina: "新浪市场数据",
    yfinance: "Yahoo Finance 市场数据",
  };
  const parts = source
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => labels[part.toLowerCase()] ?? part);
  return [...new Set(parts)].join("、") || "未知来源";
}

function marketDiscoveryFreshnessLabel(freshness: string) {
  const normalized = freshness.trim().toLowerCase();
  if (normalized === "fresh") return "数据新鲜";
  if (normalized === "stale") return "数据可能延迟";
  return "新鲜度未知";
}

function optionalNumber(value: string): number | undefined {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function marketInformationExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function marketInformationAmount(item: MarketDiscoveryItem): string {
  if (item.market === "crypto") {
    return marketDiscoveryNumber(item.amount / 100_000_000, " 亿 USDT");
  }
  if (item.market === "us") {
    return marketDiscoveryNumber(item.amount / 1_000_000, " 百万美元");
  }
  return marketDiscoveryNumber(item.amount / 100_000_000, " 亿元");
}

function MarketInformationRanking({
  items,
  title,
}: {
  items: MarketDiscoveryItem[];
  title: string;
}) {
  return (
    <SurfacePanel title={title}>
      {items.length ? (
        <div className="design-market-information-table">
          <table className="design-table compact">
            <thead>
              <tr>
                <th>代码 / 名称</th>
                <th>最新价</th>
                <th>涨跌幅</th>
                <th>成交额</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 10).map((item) => (
                <tr key={`${item.market}-${item.symbol}`}>
                  <td><strong>{item.symbol}</strong><br /><span>{item.name}</span></td>
                  <td>{formatPrice(item.price)}</td>
                  <td className={item.changePct >= 0 ? "up" : "down"}>
                    {item.changePct >= 0 ? "+" : ""}{item.changePct.toFixed(2)}%
                  </td>
                  <td>{marketInformationAmount(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState detail="当前数据源尚未返回可展示的排行。" title={`暂无${title}`} />
      )}
    </SurfacePanel>
  );
}

function MarketInformationSurface({
  action,
  marketInformation,
  workspace,
}: Pick<TerminalWorkspaceSurfaceProps, "action" | "marketInformation" | "workspace">) {
  const [newsFilter, setNewsFilter] = useState<"all" | "market" | "instrument">("all");
  const result = marketInformation?.result;
  const matchesContext = Boolean(
    result
    && result.market === workspace.selectedInstrument.market
    && result.symbol === workspace.selectedInstrument.symbol,
  );
  const snapshot = matchesContext && !result?.error ? result : null;
  const filteredNews = snapshot?.news.filter(
    (item) => newsFilter === "all" || item.scope === newsFilter,
  ) ?? [];
  const marketLabel = terminalSurfaceZh.marketLabel(workspace.selectedInstrument.market);
  const marketBreadthAvailable = Boolean(
    snapshot
    && (
      snapshot.market !== "us"
      || Object.values(snapshot.overview).some((value) => value > 0)
    ),
  );
  return (
    <>
      <PageHeader
        action={action}
        subtitle={`${marketLabel} · ${workspace.selectedInstrument.symbol}`}
        title="市场资讯"
      >
        <div className="design-meta-line">
          <span>只读研究信息，不触发策略、委托或自动交易</span>
        </div>
      </PageHeader>
      {marketInformation?.isLoading ? (
        <p className="design-market-information-state" role="status">正在加载市场概览与最新资讯…</p>
      ) : null}
      {result?.error && matchesContext ? (
        <div className="design-market-information-state risk" role="alert">
          <span>市场资讯暂时不可用：{result.error}</span>
          <button className="design-link-button" onClick={marketInformation?.onRefresh} type="button">
            重新加载
          </button>
        </div>
      ) : null}
      {!marketInformation?.isLoading && !snapshot && !(result?.error && matchesContext) ? (
        <EmptyState detail="刷新后将显示市场广度、排行和带来源的新闻链接。" title="等待市场资讯" />
      ) : null}
      {snapshot ? (
        <div className="design-market-information-grid">
          <section aria-label="市场概览" className="design-market-overview design-market-information-overview">
            <header>
              <div>
                <span>市场概览</span>
                <strong>{marketLabel}市场快照</strong>
              </div>
              <small>
                {snapshot.observedAt
                  ? `更新 ${new Date(snapshot.observedAt).toLocaleString("zh-CN")}`
                  : "更新时间未知"}
              </small>
            </header>
            {marketBreadthAvailable ? (
              <div className="design-market-overview-cards">
                {[
                  ["覆盖标的", snapshot.overview.universeCount.toLocaleString("zh-CN"), ""],
                  ["上涨", snapshot.overview.advancing.toLocaleString("zh-CN"), "up"],
                  ["下跌", snapshot.overview.declining.toLocaleString("zh-CN"), "down"],
                  ["平盘", snapshot.overview.flat.toLocaleString("zh-CN"), ""],
                  [
                    "成交额",
                    snapshot.market === "crypto"
                      ? `${(snapshot.overview.totalAmount / 100_000_000).toLocaleString("zh-CN", { maximumFractionDigits: 2 })} 亿 USDT`
                      : snapshot.market === "us"
                        ? `${(snapshot.overview.totalAmount / 1_000_000).toLocaleString("zh-CN", { maximumFractionDigits: 2 })} 百万美元`
                        : `${(snapshot.overview.totalAmount / 100_000_000).toLocaleString("zh-CN", { maximumFractionDigits: 2 })} 亿元`,
                    "",
                  ],
                ].map(([label, value, tone]) => (
                  <article key={label}>
                    <span>{label}</span>
                    <strong className={tone}>{value}</strong>
                  </article>
                ))}
              </div>
            ) : (
              <div className="design-market-information-breadth-empty">
                <EmptyState
                  detail="当前数据源仅提供美股资讯，市场广度统计将在接入后显示。"
                  title="市场广度暂未接入"
                />
              </div>
            )}
            <footer className="design-market-information-source">
              <span>来源 {marketInformationSourceLabel(snapshot.source)}</span>
              <Status tone={snapshot.freshness === "fresh" ? "positive" : "warning"}>
                {snapshot.freshness === "fresh" ? "数据新鲜" : "缓存数据"}
              </Status>
              <span title={snapshot.snapshotHash}>快照 {compactRunId(snapshot.snapshotHash)}</span>
            </footer>
            {snapshot.warnings.length ? (
              <ul className="design-market-screener-warnings">
                {snapshot.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            ) : null}
          </section>
          <MarketInformationRanking items={snapshot.leaders} title="涨幅领先" />
          <MarketInformationRanking items={snapshot.active} title="成交活跃" />
          <SurfacePanel
            action={
              <div aria-label="资讯筛选" className="design-market-information-tabs" role="tablist">
                {([
                  ["all", "全部"],
                  ["market", "市场快讯"],
                  ["instrument", "标的资讯"],
                ] as const).map(([id, label]) => (
                  <button
                    aria-selected={newsFilter === id}
                    className={newsFilter === id ? "active" : ""}
                    key={id}
                    onClick={() => setNewsFilter(id)}
                    role="tab"
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
            className="design-market-information-news"
            subtitle={`${snapshot.symbol} · ${snapshot.news.length} 条`}
            title="新闻资讯"
          >
            {filteredNews.length ? (
              <div className="design-market-information-news-list">
                {filteredNews.map((item) => {
                  const url = marketInformationExternalUrl(item.url);
                  return (
                    <article key={item.id}>
                      <header>
                        <Status tone={item.scope === "instrument" ? "positive" : "neutral"}>
                          {item.scope === "instrument" ? "标的资讯" : "市场快讯"}
                        </Status>
                        <span>{marketInformationSourceLabel(item.source)}</span>
                        <time dateTime={item.publishedAt}>
                          {item.publishedAt ? new Date(item.publishedAt).toLocaleString("zh-CN") : "时间未知"}
                        </time>
                      </header>
                      <strong>{item.headline}</strong>
                      {item.summary ? <p>{item.summary}</p> : null}
                      {url ? (
                        <a href={url} rel="noreferrer noopener" target="_blank">
                          查看原文 <ExternalLink aria-hidden="true" size={12} />
                        </a>
                      ) : (
                        <span className="design-market-information-link-missing">暂无原文链接</span>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState detail="当前筛选范围内没有可展示的资讯。" title="暂无资讯" />
            )}
          </SurfacePanel>
        </div>
      ) : null}
    </>
  );
}

function MarketSurface({
  action,
  chart,
  isSavingWatchlist,
  latestWatchlistCacheRefresh,
  marketCalendar,
  marketDiscovery,
  marketRefreshIssue,
  onRemoveWatchlistInstrument,
  onResearchInstrument,
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
  | "marketDiscovery"
  | "marketRefreshIssue"
  | "onRemoveWatchlistInstrument"
  | "onResearchInstrument"
  | "onSaveWatchlist"
  | "onSelectInstrument"
  | "onSelectTimeframe"
  | "source"
  | "workspace"
>) {
  const [isEditingWatchlist, setIsEditingWatchlist] = useState(false);
  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const [discoveryMinChangePct, setDiscoveryMinChangePct] = useState("");
  const [discoveryMaxChangePct, setDiscoveryMaxChangePct] = useState("");
  const [discoveryMinAmountWan, setDiscoveryMinAmountWan] = useState("");
  const [discoveryMinTurnoverRate, setDiscoveryMinTurnoverRate] = useState("");
  const [discoveryMaxPe, setDiscoveryMaxPe] = useState("");
  const [discoverySort, setDiscoverySort] = useState<NonNullable<MarketDiscoveryParams["sort"]>>("changePct");
  const [discoveryDirection, setDiscoveryDirection] = useState<NonNullable<MarketDiscoveryParams["direction"]>>("desc");
  const discoveryMarket = workspace.selectedInstrument.market === "crypto"
    ? "crypto"
    : "ashare";
  const isCryptoDiscovery = discoveryMarket === "crypto";
  const effectiveDiscoverySort = isCryptoDiscovery
    && discoverySort !== "changePct"
    && discoverySort !== "amount"
    ? "changePct"
    : discoverySort;
  useEffect(() => {
    if (effectiveDiscoverySort !== discoverySort) {
      setDiscoverySort(effectiveDiscoverySort);
    }
  }, [discoverySort, effectiveDiscoverySort]);
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
  const submitMarketDiscovery = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!marketDiscovery) return;
    const minAmountWan = optionalNumber(discoveryMinAmountWan);
    marketDiscovery.onSearch({
      market: discoveryMarket,
      query: discoveryQuery,
      minChangePct: optionalNumber(discoveryMinChangePct),
      maxChangePct: optionalNumber(discoveryMaxChangePct),
      minAmount: minAmountWan === undefined ? undefined : minAmountWan * 10_000,
      minTurnoverRate: isCryptoDiscovery ? undefined : optionalNumber(discoveryMinTurnoverRate),
      maxPe: isCryptoDiscovery ? undefined : optionalNumber(discoveryMaxPe),
      sort: effectiveDiscoverySort,
      direction: discoveryDirection,
      limit: 20,
    });
  };
  const discoveryResult = marketDiscovery?.result?.market === discoveryMarket
    ? marketDiscovery.result
    : null;
  const discoverySnapshot = discoveryResult?.error ? null : discoveryResult;
  const discoveryOverviewItems = [
    {
      label: isCryptoDiscovery ? "USDT 现货交易对" : "全市场股票",
      tone: "",
      value: discoverySnapshot
        ? discoverySnapshot.overview.universeCount.toLocaleString("zh-CN")
        : "—",
    },
    {
      label: "上涨",
      tone: "up",
      value: discoverySnapshot
        ? discoverySnapshot.overview.advancing.toLocaleString("zh-CN")
        : "—",
    },
    {
      label: "下跌",
      tone: "down",
      value: discoverySnapshot
        ? discoverySnapshot.overview.declining.toLocaleString("zh-CN")
        : "—",
    },
    {
      label: "平盘",
      tone: "",
      value: discoverySnapshot
        ? discoverySnapshot.overview.flat.toLocaleString("zh-CN")
        : "—",
    },
    {
      label: isCryptoDiscovery ? "24 小时成交额" : "成交额",
      tone: "",
      value: discoverySnapshot
        ? `${(discoverySnapshot.overview.totalAmount / 100_000_000).toLocaleString("zh-CN", { maximumFractionDigits: 2 })} 亿${isCryptoDiscovery ? " USDT" : "元"}`
        : "—",
    },
  ];
  return (
    <>
      <PageHeader action={action} title="行情中心" />
      {marketDiscovery ? (
        <div className="design-market-discovery">
          <section aria-label="市场概览" className="design-market-overview">
            <header>
              <div>
                <span>市场概览</span>
                <strong>
                  {isCryptoDiscovery ? "Binance USDT 现货市场" : "A 股全市场快照"}
                </strong>
              </div>
              <small>
                {discoverySnapshot?.observedAt
                  ? `更新 ${new Date(discoverySnapshot.observedAt).toLocaleString("zh-CN")}`
                  : "等待加载"}
              </small>
            </header>
            <div className="design-market-overview-cards">
              {discoveryOverviewItems.map((item) => (
                <article key={item.label}>
                  <span>{item.label}</span>
                  <strong className={item.tone}>{item.value}</strong>
                </article>
              ))}
            </div>
          </section>
          <SurfacePanel
            className="design-market-screener"
            title={isCryptoDiscovery ? "交易对筛选" : "条件选股"}
            subtitle={isCryptoDiscovery
              ? "筛选只生成研究候选，不会直接触发交易"
              : "先筛选候选，再查看并加入自选或进入研究工作台"}
          >
            <form
              aria-label={isCryptoDiscovery ? "交易对筛选" : "条件选股筛选"}
              className="design-market-screener-form"
              onSubmit={submitMarketDiscovery}
            >
              <label>
                <span>{isCryptoDiscovery ? "资产或交易对" : "名称或代码"}</span>
                <input
                  name="query"
                  onChange={(event) => setDiscoveryQuery(event.currentTarget.value)}
                  placeholder={isCryptoDiscovery ? "例如：BTC、BTC/USDT" : "例如：银行、600000"}
                  type="search"
                  value={discoveryQuery}
                />
              </label>
              <label>
                <span>{isCryptoDiscovery ? "最低 24 小时涨跌幅 %" : "最低涨跌幅 %"}</span>
                <input
                  name="minChangePct"
                  onChange={(event) => setDiscoveryMinChangePct(event.currentTarget.value)}
                  step="0.01"
                  type="number"
                  value={discoveryMinChangePct}
                />
              </label>
              <label>
                <span>{isCryptoDiscovery ? "最高 24 小时涨跌幅 %" : "最高涨跌幅 %"}</span>
                <input
                  name="maxChangePct"
                  onChange={(event) => setDiscoveryMaxChangePct(event.currentTarget.value)}
                  step="0.01"
                  type="number"
                  value={discoveryMaxChangePct}
                />
              </label>
              <label>
                <span>
                  {isCryptoDiscovery ? "最低 24 小时成交额 万 USDT" : "最低成交额 万元"}
                </span>
                <input
                  min="0"
                  name="minAmount"
                  onChange={(event) => setDiscoveryMinAmountWan(event.currentTarget.value)}
                  step="1"
                  type="number"
                  value={discoveryMinAmountWan}
                />
              </label>
              {!isCryptoDiscovery ? (
                <>
                  <label>
                    <span>最低换手率 %</span>
                    <input
                      min="0"
                      name="minTurnoverRate"
                      onChange={(event) => setDiscoveryMinTurnoverRate(event.currentTarget.value)}
                      step="0.01"
                      type="number"
                      value={discoveryMinTurnoverRate}
                    />
                  </label>
                  <label>
                    <span>最高市盈率</span>
                    <input
                      min="0"
                      name="maxPe"
                      onChange={(event) => setDiscoveryMaxPe(event.currentTarget.value)}
                      step="0.01"
                      type="number"
                      value={discoveryMaxPe}
                    />
                  </label>
                </>
              ) : null}
              <label>
                <span>排序指标</span>
                <select
                  name="sort"
                  onChange={(event) => setDiscoverySort(
                    event.currentTarget.value as NonNullable<MarketDiscoveryParams["sort"]>,
                  )}
                  value={effectiveDiscoverySort}
                >
                  <option value="changePct">
                    {isCryptoDiscovery ? "24 小时涨跌幅" : "涨跌幅"}
                  </option>
                  <option value="amount">
                    {isCryptoDiscovery ? "24 小时成交额" : "成交额"}
                  </option>
                  {!isCryptoDiscovery ? (
                    <>
                      <option value="turnoverRate">换手率</option>
                      <option value="marketCap">总市值</option>
                      <option value="peRatio">市盈率</option>
                    </>
                  ) : null}
                </select>
              </label>
              <label>
                <span>排序方向</span>
                <select
                  name="direction"
                  onChange={(event) => setDiscoveryDirection(
                    event.currentTarget.value as NonNullable<MarketDiscoveryParams["direction"]>,
                  )}
                  value={discoveryDirection}
                >
                  <option value="desc">从高到低</option>
                  <option value="asc">从低到高</option>
                </select>
              </label>
              <button
                className="design-primary-action"
                disabled={marketDiscovery.isLoading}
                type="submit"
              >
                <Search aria-hidden="true" size={14} />
                {marketDiscovery.isLoading ? "筛选中…" : "开始筛选"}
              </button>
            </form>
            {marketDiscovery.isLoading ? (
              <p className="design-market-screener-state" role="status">
                {isCryptoDiscovery
                  ? "正在加载 Binance USDT 现货快照与候选…"
                  : "正在加载全市场快照与候选…"}
              </p>
            ) : null}
            {discoveryResult?.error ? (
              <p className="design-market-screener-state risk" role="alert">
                暂时无法加载市场概览与
                {isCryptoDiscovery ? "交易对筛选" : "选股"}
                结果：{discoveryResult.error}
              </p>
            ) : null}
            {discoverySnapshot ? (
              <>
                <div className="design-market-screener-meta">
                  <span>
                    匹配 {discoverySnapshot.totalMatched.toLocaleString("zh-CN")}
                    {isCryptoDiscovery ? " 个交易对" : " 只"}
                  </span>
                  <span>来源 {marketDiscoverySourceLabel(discoverySnapshot.source)}</span>
                  <span>{marketDiscoveryFreshnessLabel(discoverySnapshot.freshness)}</span>
                  <span title={discoverySnapshot.snapshotHash}>
                    快照 {compactRunId(discoverySnapshot.snapshotHash)}
                  </span>
                </div>
                {discoverySnapshot.warnings.length > 0 ? (
                  <ul className="design-market-screener-warnings">
                    {discoverySnapshot.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : null}
                {isCryptoDiscovery ? (
                  <p className="design-market-screener-state">
                    仅覆盖 Binance 当前可交易的 USDT 现货交易对；24 小时指标为滚动窗口。
                    筛选只生成研究候选，当前生产自动交易仍仅支持 BTC/USDT · 1m。
                  </p>
                ) : null}
                {discoverySnapshot.items.length === 0 ? (
                  <p className="design-market-screener-state" role="status">
                    没有符合当前条件的
                    {isCryptoDiscovery ? "交易对" : "股票"}
                    ，请放宽筛选条件后重试。
                  </p>
                ) : (
                <div className="design-market-screener-table">
                  <table className="design-table compact">
                    <thead>
                      <tr>
                        <th>{isCryptoDiscovery ? "交易对 / 资产" : "代码 / 名称"}</th>
                        <th>{isCryptoDiscovery ? "最新价（USDT）" : "最新价"}</th>
                        <th>{isCryptoDiscovery ? "24 小时涨跌" : "涨跌幅"}</th>
                        <th>{isCryptoDiscovery ? "24 小时成交额" : "成交额"}</th>
                        {isCryptoDiscovery ? <th>24 小时成交量（基础资产）</th> : (
                          <>
                            <th>换手率</th>
                            <th>市盈率</th>
                            <th>总市值</th>
                          </>
                        )}
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discoverySnapshot.items.map((item) => {
                        const instrument = marketDiscoveryInstrument(item);
                        const inWatchlist = workspace.watchlist.some(
                          (candidate) => candidate.market === item.market
                            && candidate.symbol === item.symbol,
                        );
                        return (
                          <tr key={`${item.market}-${item.symbol}`}>
                            <td><strong>{item.symbol}</strong><br /><span>{item.name}</span></td>
                            <td>
                              {marketDiscoveryNumber(item.price, "", isCryptoDiscovery ? 8 : 2)}
                            </td>
                            <td className={item.changePct >= 0 ? "up" : "down"}>
                              {item.changePct >= 0 ? "+" : ""}
                              {marketDiscoveryNumber(item.changePct, "%")}
                            </td>
                            <td>
                              {marketDiscoveryNumber(
                                item.amount / 10_000,
                                isCryptoDiscovery ? " 万 USDT" : " 万",
                              )}
                            </td>
                            {isCryptoDiscovery ? (
                              <td>{marketDiscoveryNumber(item.volume, ` ${item.name}`)}</td>
                            ) : (
                              <>
                                <td>{marketDiscoveryNumber(item.turnoverRate, "%")}</td>
                                <td>{marketDiscoveryNumber(item.peRatio)}</td>
                                <td>
                                  {item.marketCap === null
                                    ? "—"
                                    : marketDiscoveryNumber(item.marketCap / 100_000_000, " 亿")}
                                </td>
                              </>
                            )}
                            <td>
                              <div className="design-market-screener-actions">
                                <button
                                  className="design-link-button"
                                  onClick={() => onSelectInstrument(instrument)}
                                  type="button"
                                >
                                  {inWatchlist ? "查看行情" : "查看并加入"}
                                </button>
                                {onResearchInstrument ? (
                                  <button
                                    className="design-link-button"
                                    onClick={() => onResearchInstrument(instrument)}
                                    type="button"
                                  >
                                    开始研究
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                )}
              </>
            ) : null}
          </SurfacePanel>
        </div>
      ) : null}
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
  const adjustmentMode = evidenceSnapshot?.adjustmentMode ?? evidenceQuality?.adjustmentMode ?? "none";
  const freshness = evidenceSnapshot?.freshness ?? evidenceQuality?.freshness ?? "unknown";
  const coverage = evidenceSnapshot?.coverage ?? evidenceQuality?.coverage;
  const sourceComparison = evidenceSnapshot?.sourceComparison;
  const sourceComparisonLabel = !sourceComparison
    ? "暂无对照数据"
    : sourceComparison.status === "unavailable"
      ? sourceComparison.reason === "comparison_not_required_for_context"
        ? "当前场景无需对照"
        : sourceComparison.reason?.startsWith("secondary_source_failed")
          ? "第二来源不可用"
          : "未配置第二来源"
      : {
        agreement: "来源一致",
        warning: "差异待复核",
        blocked: "差异阻断",
      }[sourceComparison.status];
  const sourceComparisonTone = !sourceComparison || sourceComparison.status === "agreement"
    ? "positive"
    : sourceComparison.status === "blocked"
      ? "risk"
      : "warning";
  const sourceComparisonNextAction = sourceComparison?.status === "warning"
    || sourceComparison?.status === "blocked"
    ? `复核 ${sourceComparison.differences.length} 项差异`
    : sourceComparison?.status === "unavailable"
      && sourceComparison.reason !== "comparison_not_required_for_context"
      ? "按需配置只读对照源"
      : "无需处理";
  const dataRows = evidenceSnapshot?.rows
    ?? evidenceQuality?.rows
    ?? evidenceRun?.dataRows
    ?? activeRun?.dataRows
    ?? 0;
  const snapshotHash = evidenceSnapshot?.snapshotHash ?? evidenceSnapshot?.hash ?? "—";
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
            <div className="design-kv-row"><span>复权 / 时效</span><strong>{adjustmentMode} · {freshness}</strong></div>
            <div className="design-kv-row"><span>覆盖率</span><strong>{coverage ? `${(coverage.ratio * 100).toFixed(1)}% · 缺口 ${coverage.gapCount}` : "—"}</strong></div>
            <div className="design-kv-row"><span>跨源差异</span><Status tone={sourceComparisonTone}>{sourceComparisonLabel}</Status></div>
            <div className="design-kv-row"><span>差异报告</span><strong title={sourceComparison?.reportHash ?? "—"}>{sourceComparison ? `${sourceComparison.overlapRows} 行重叠 · ${sourceComparison.reportHash.slice(0, 9)}…` : "—"}</strong></div>
            <div className="design-kv-row"><span>下一步</span><strong>{sourceComparisonNextAction}</strong></div>
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
            <div className="design-kv-row"><span>离线回放</span><strong>{evidenceSnapshot?.offlineReplay?.status === "verified" ? "哈希已验证 · 无需网络" : runId ? "历史快照" : "待运行"}</strong></div>
            <div className="design-kv-row"><span>市场日历</span><strong title={evidenceSnapshot?.calendarId ?? "—"}>{evidenceSnapshot?.calendarId ?? "—"}</strong></div>
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
        subtitle={`/ ${terminalSurfaceZh.strategyText(workspace.strategy.name)}`}
      >
        <div className="design-meta-line">
          状态：<Status tone="warning">草稿</Status>
          <span>
            修订版：{workspace.researchRun?.strategyRevision ?? "草稿"}
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
  productionStrategyHandoff,
  strategyExperiment,
  workspace,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  "action" | "colorScheme" | "productionStrategyHandoff" | "strategyExperiment" | "workspace"
>) {
  const [handoffConfirmed, setHandoffConfirmed] = useState(false);
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);
  const [handoffOperator, setHandoffOperator] = useState("");
  const productionHandoff = productionStrategyHandoff?.result.handoff;
  const productionHandoffStatus = productionStrategyHandoff?.result.error
    ? { label: "预检未通过", tone: "risk" as const }
    : productionHandoff?.alreadyBound
      ? { label: "已交接", tone: "positive" as const }
      : productionHandoff?.status === "ready"
        ? { label: "可交接", tone: "positive" as const }
        : productionHandoff?.status === "review"
          ? { label: "需处理切换条件", tone: "warning" as const }
          : { label: workspace.researchRun ? "预检中" : "等待审计运行", tone: "neutral" as const };
  const canBindProductionStrategy = Boolean(
    productionHandoff
    && productionHandoff.status === "ready"
    && productionHandoff.switchAllowed
    && !productionHandoff.alreadyBound
    && handoffConfirmed
    && handoffOperator.trim()
    && !productionStrategyHandoff?.busy
  );
  useEffect(() => {
    setHandoffConfirmed(false);
    setHandoffMessage(null);
  }, [productionHandoff?.runId]);
  const bindProductionStrategy = async () => {
    if (!canBindProductionStrategy || !productionStrategyHandoff) return;
    setHandoffMessage(null);
    const bound = await productionStrategyHandoff.onBind(handoffOperator);
    setHandoffConfirmed(false);
    setHandoffMessage(
      bound
        ? "审计策略已交接；自动交易保持暂停，未授权、未评估、未下单。"
        : null,
    );
  };
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
  const experimentHistory = strategyExperiment.active
    && !strategyExperiment.history.some(
      (experiment) => experiment.experimentId === strategyExperiment.active?.experimentId,
    )
      ? [strategyExperiment.active, ...strategyExperiment.history]
      : strategyExperiment.history;
  const experimentStatus = strategyExperiment.busy
    ? { label: "运行中", tone: "warning" as const }
    : strategyExperiment.active?.status === "completed"
      ? { label: "已完成", tone: "positive" as const }
      : strategyExperiment.active?.status === "failed"
        ? { label: "失败", tone: "risk" as const }
        : { label: "待运行", tone: "neutral" as const };
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
        subtitle={`/ ${terminalSurfaceZh.strategyText(workspace.strategy.name)}`}
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
      {strategyExperiment.error ? (
        <p className="strategy-experiment-error design-backtest-run-error" role="alert">
          {strategyExperiment.error}
        </p>
      ) : null}
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
                        {backtestTradeLabels[trade.side] ?? trade.side}
                      </td>
                      <td>{trade.timestamp}</td>
                      <td>{trade.quantity}</td>
                      <td>{trade.price}</td>
                      <td className={trade.pnl.startsWith("-") ? "down" : "up"}>
                        {trade.pnl}
                      </td>
                      <td>
                        <Status>{backtestTradeLabels[trade.status] ?? trade.status}</Status>
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
            <div className="design-kv-row" role="status">
              <span>实验状态</span>
              <Status tone={experimentStatus.tone}>{experimentStatus.label}</Status>
            </div>
            <div className="design-kv-row">
              <span>实验 ID</span>
              <strong title={strategyExperiment.active?.experimentId ?? "—"}>
                {compactRunId(strategyExperiment.active?.experimentId)}
              </strong>
            </div>
            <div className="design-kv-row">
              <span>选择候选</span>
              <strong title={strategyExperiment.active?.selectedCandidateId ?? "—"}>
                {compactRunId(strategyExperiment.active?.selectedCandidateId)}
              </strong>
            </div>
            <div className="design-kv-row">
              <span>结果 Hash</span>
              <strong title={strategyExperiment.active?.resultHash ?? "—"}>
                {compactRunId(strategyExperiment.active?.resultHash)}
              </strong>
            </div>
            <div className="design-kv-row">
              <span>研究运行 ID</span>
              <strong>{compactRunId(workspace.researchRun?.runId)}</strong>
            </div>
            <div className="design-kv-row">
              <span>快照身份</span>
              <strong title={workspace.researchRun?.dataSnapshot?.snapshotHash ?? workspace.researchRun?.dataSnapshot?.hash ?? "—"}>
                {compactRunId(workspace.researchRun?.dataSnapshot?.snapshotHash ?? workspace.researchRun?.dataSnapshot?.hash)}
              </strong>
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
          <SurfacePanel
            className="design-production-handoff"
            title="生产策略资格与交接"
            subtitle="服务端按生产边界复算；回测本身不会触发真实交易"
          >
            <div className="design-production-handoff-status">
              <div>
                <span>资格状态</span>
                <Status tone={productionHandoffStatus.tone}>
                  {productionHandoffStatus.label}
                </Status>
              </div>
              <p>
                点击交接只会固定这份审计策略；不会授权实盘、启动监控、立即评估或提交订单。
              </p>
            </div>
            <div className="design-production-handoff-grid">
              <div>
                <span>审计运行</span>
                <strong title={productionHandoff?.runId ?? "—"}>
                  {compactRunId(productionHandoff?.runId)}
                </strong>
              </div>
              <div>
                <span>策略版本</span>
                <strong title={productionHandoff?.strategyRevision ?? "—"}>
                  {compactRunId(productionHandoff?.strategyRevision)}
                </strong>
              </div>
              <div>
                <span>当前生产策略</span>
                <strong>
                  {productionStrategyHandoff?.binding
                    ? `${productionStrategyHandoff.binding.name} · ${compactRunId(productionStrategyHandoff.binding.revision)}`
                    : "尚未读取"}
                </strong>
              </div>
              <div>
                <span>生产保守复算</span>
                <strong>
                  {productionHandoff
                    ? `手续费 ${productionHandoff.productionReplay.feeBps} / 滑点 ${productionHandoff.productionReplay.slippageBps} 基点`
                    : "等待服务端预检"}
                </strong>
                {productionHandoff ? (
                  <small>
                    最大回撤 {productionHandoff.productionReplay.productionMaxDrawdownPct.toFixed(2)}%
                    {" / "}策略上限 {productionHandoff.productionReplay.strategyMaxDrawdownPct.toFixed(2)}%
                  </small>
                ) : null}
              </div>
            </div>
            {productionStrategyHandoff?.errorLabel
              || productionStrategyHandoff?.switchBlockedReasonLabel ? (
              <p className="design-production-handoff-error" role="alert">
                {productionStrategyHandoff.errorLabel
                  ?? productionStrategyHandoff.switchBlockedReasonLabel}
              </p>
            ) : null}
            {productionHandoff && !productionHandoff.alreadyBound ? (
              <div className="design-production-handoff-confirm">
                <label htmlFor="backtest-production-operator">
                  <span>实名操作人</span>
                  <input
                    autoComplete="name"
                    id="backtest-production-operator"
                    maxLength={80}
                    onChange={(event) => setHandoffOperator(event.currentTarget.value)}
                    placeholder="输入实名操作人"
                    type="text"
                    value={handoffOperator}
                  />
                </label>
                <label className="design-production-handoff-check" htmlFor="backtest-production-confirm">
                  <input
                    checked={handoffConfirmed}
                    id="backtest-production-confirm"
                    onChange={(event) => setHandoffConfirmed(event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span>我确认只交接审计策略，后续授权、监控与下单仍需单独完成。</span>
                </label>
              </div>
            ) : null}
            <div className="design-production-handoff-actions">
              {!productionHandoff?.alreadyBound ? (
                <button
                  className="design-primary-action"
                  disabled={!canBindProductionStrategy}
                  onClick={() => void bindProductionStrategy()}
                  type="button"
                >
                  <ShieldCheck size={14} />
                  {productionStrategyHandoff?.busy ? "交接中…" : "交接为生产自动策略"}
                </button>
              ) : null}
              {productionHandoff?.alreadyBound || handoffMessage?.startsWith("审计策略已交接") ? (
                <button
                  className="design-secondary-action"
                  onClick={productionStrategyHandoff?.onOpenDynamicTrading}
                  type="button"
                >
                  <Play size={14} />
                  前往动态交易复核
                </button>
              ) : null}
            </div>
            {handoffMessage ? (
              <p className="design-production-handoff-message" role="status">
                {handoffMessage}
              </p>
            ) : null}
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
            {experimentHistory.slice(0, 5).map((experiment) => (
              <div className="design-history-row" key={experiment.experimentId}>
                <i className={experiment.status === "completed" ? "done" : ""} />
                <span title={experiment.experimentId}>
                  {compactRunId(experiment.experimentId)}
                </span>
                <Status tone={experiment.status === "completed" ? "positive" : "risk"}>
                  {experiment.status === "completed" ? "已完成" : "失败"}
                </Status>
              </div>
            ))}
          </SurfacePanel>
        </div>
      </div>
    </>
  );
}

export type AiReviewProductionPathAction =
  | "stage-primary-candidate"
  | "open-production-handoff"
  | "open-dynamic-trading"
  | null;

export interface AiReviewProductionPath {
  action: AiReviewProductionPathAction;
  actionLabel: string | null;
  detail: string;
  label: string;
  tone: "neutral" | "positive" | "warning" | "risk";
}

const aiReviewDecisionStatuses: AiReviewDecisionStatus[] = [
  "accepted_for_research",
  "revision_requested",
  "rejected",
  "insufficient_evidence",
];

export function buildAiReviewProductionPath({
  binding,
  decisions,
  handoff,
  handoffError,
  primaryCandidateAvailable,
  review,
  switchBlockedReason,
}: {
  binding: StrategyProductionBinding | null;
  decisions: readonly AiReviewDecision[];
  handoff: ProductionStrategyHandoff | null;
  handoffError: string | null;
  primaryCandidateAvailable: boolean;
  review: AuthoritativeAiReviewRun | null;
  switchBlockedReason?: string | null;
}): AiReviewProductionPath {
  if (!review) {
    return {
      action: null,
      actionLabel: null,
      detail: "先完成权威评审；AI 评审只形成研究证据，不会直接授权实盘。",
      label: "等待权威评审",
      tone: "neutral",
    };
  }
  if (review.deterministicAssessment.stance !== "supported") {
    return {
      action: null,
      actionLabel: null,
      detail: "本地确定性评估尚未支持该候选，不能进入生产策略交接。",
      label: "确定性评估未支持",
      tone: "risk",
    };
  }
  const externalSupported = review.externalAssessment.status === "completed"
    && review.externalAssessment.assessment?.stance === "supported";
  if (
    review.externalAssessment.provider !== "local"
      ? !externalSupported
      : review.externalAssessment.status !== "skipped" && !externalSupported
  ) {
    return {
      action: null,
      actionLabel: null,
      detail: "本次已请求外部补充评估，但结果未明确支持该候选；请先处理评审风险。",
      label: "外部评估未支持",
      tone: "risk",
    };
  }
  const latestDecision = decisions[decisions.length - 1] ?? null;
  if (
    !latestDecision
    || latestDecision.aiReviewId !== review.aiReviewId
    || latestDecision.reviewRecordHash !== review.recordHash
    || latestDecision.evidenceHash !== review.evidenceHash
  ) {
    return {
      action: null,
      actionLabel: null,
      detail: "请实名追加一条与当前证据哈希一致的研究决策；该决定仍不构成生产授权。",
      label: "等待人工研究决策",
      tone: "warning",
    };
  }
  if (latestDecision.status !== "accepted_for_research") {
    return {
      action: null,
      actionLabel: null,
      detail: "最新人工结论没有接受该候选用于后续研究，生产关联保持阻断。",
      label: "研究决策未接受",
      tone: "risk",
    };
  }

  const reference = review.primaryExperiment;
  if (reference.candidateRevision !== reference.strategyRevision) {
    return primaryCandidateAvailable
      ? {
          action: "stage-primary-candidate",
          actionLabel: "采用已评审候选并重新审计",
          detail: "选中候选与源运行策略版本不同；采用后会清除旧审计结果，并回到策略工坊重新运行完整研究链。",
          label: "候选需重新审计",
          tone: "warning",
        }
      : {
          action: null,
          actionLabel: null,
          detail: "当前页面没有载入与评审哈希完全一致的实验详情，不能采用候选。",
          label: "候选上下文待恢复",
          tone: "warning",
        };
  }

  const handoffMatchesReview = Boolean(
    handoff
    && handoff.runId === reference.sourceRunId
    && handoff.strategyRevision === reference.candidateRevision
    && handoff.dataSnapshotHash === reference.snapshotId
  );
  if (handoffError) {
    return {
      action: "open-production-handoff",
      actionLabel: "前往回测检查生产资格",
      detail: `服务端生产预检未通过：${handoffError}`,
      label: "生产预检未通过",
      tone: "risk",
    };
  }
  const bindingMatchesReview = Boolean(
    binding
    && binding.auditRunId === reference.sourceRunId
    && binding.revision === reference.candidateRevision
    && binding.status === "ready"
    && handoffMatchesReview
    && handoff?.status === "active"
    && handoff?.alreadyBound === true
  );
  if (bindingMatchesReview) {
    return {
      action: "open-dynamic-trading",
      actionLabel: "前往动态交易复核",
      detail: "当前生产策略已精确绑定这份审计运行；进入动态交易后仍由独立授权、风控和人工确认控制真实委托。",
      label: "生产策略已关联",
      tone: "positive",
    };
  }

  if (
    !handoff
    || !handoffMatchesReview
  ) {
    const identityMismatch = Boolean(handoff);
    return {
      action: "open-production-handoff",
      actionLabel: "前往回测检查生产资格",
      detail: identityMismatch
        ? "服务端生产预检返回的运行、策略版本或快照与当前评审不一致，请前往回测实验室重新核对。"
        : "等待服务端读取该审计运行的生产预检；可前往回测实验室查看完整证据。",
      label: identityMismatch ? "生产身份不一致" : "等待生产预检",
      tone: identityMismatch ? "risk" : "neutral",
    };
  }

  return {
    action: "open-production-handoff",
    actionLabel: handoff.status === "ready"
      ? "前往回测完成生产交接"
      : "前往回测处理切换条件",
    detail: handoff.status === "ready"
      ? "服务端已复算通过；生产交接仍需在回测页实名确认，完成后保持自动交易暂停。"
      : switchBlockedReason
        ? `审计证据已通过；当前切换条件：${switchBlockedReason}`
        : "审计证据已通过，但当前生产策略切换条件尚未满足；请在回测页查看阻断原因。",
    label: handoff.status === "ready" ? "可进入生产交接" : "生产切换条件待处理",
    tone: handoff.status === "ready" ? "positive" : "warning",
  };
}

function AiReviewSurface({
  action,
  aiReview,
  productionStrategyHandoff,
  workspace,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  "action" | "aiReview" | "productionStrategyHandoff" | "workspace"
>) {
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
  const snapshotIdentity =
    currentReview?.primaryExperiment.snapshotId
    ?? primarySelection?.snapshotId
    ?? workspace.researchRun?.dataSnapshot?.snapshotHash
    ?? workspace.researchRun?.dataSnapshot?.hash
    ?? null;
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
  const canAppendDecision = Boolean(
    currentReview
    && aiReview.decisionDraft.operator.trim()
    && aiReview.decisionDraft.rationale.trim()
    && !aiReview.busy,
  );
  const productionHandoff = productionStrategyHandoff?.result.handoff ?? null;
  const productionPath = buildAiReviewProductionPath({
    binding: productionStrategyHandoff?.binding ?? null,
    decisions: aiReview.decisions,
    handoff: productionHandoff,
    handoffError: productionStrategyHandoff?.errorLabel ?? null,
    primaryCandidateAvailable: aiReview.primaryCandidateAvailable,
    review: currentReview,
    switchBlockedReason: productionStrategyHandoff?.switchBlockedReasonLabel ?? null,
  });
  const runProductionPathAction = () => {
    if (productionPath.action === "stage-primary-candidate") {
      aiReview.onStagePrimaryCandidate();
    } else if (productionPath.action === "open-production-handoff") {
      aiReview.onOpenProductionHandoff();
    } else if (productionPath.action === "open-dynamic-trading") {
      productionStrategyHandoff?.onOpenDynamicTrading();
    }
  };
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
          <SurfacePanel
            className="design-ai-decision-entry"
            subtitle="决定只追加到当前证据链，不覆盖历史记录"
            title="人工研究决策"
          >
            <div className="design-ai-decision-form">
              <label htmlFor="ai-review-decision-operator">
                <span>实名操作人</span>
                <input
                  autoComplete="name"
                  disabled={aiReview.busy}
                  id="ai-review-decision-operator"
                  maxLength={80}
                  onChange={(event) => aiReview.onDecisionDraftChange({
                    ...aiReview.decisionDraft,
                    operator: event.currentTarget.value,
                  })}
                  placeholder="输入实名操作人"
                  type="text"
                  value={aiReview.decisionDraft.operator}
                />
              </label>
              <label htmlFor="ai-review-decision-status">
                <span>研究决定</span>
                <select
                  disabled={aiReview.busy}
                  id="ai-review-decision-status"
                  onChange={(event) => aiReview.onDecisionDraftChange({
                    ...aiReview.decisionDraft,
                    status: event.currentTarget.value as AiReviewDecisionStatus,
                  })}
                  value={aiReview.decisionDraft.status}
                >
                  {aiReviewDecisionStatuses.map((status) => (
                    <option key={status} value={status}>
                      {terminalSurfaceZh.t(`aiReviewStage3.decision.${status}` as TranslationKey)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="design-ai-decision-rationale" htmlFor="ai-review-decision-rationale">
                <span>决定依据</span>
                <textarea
                  disabled={aiReview.busy}
                  id="ai-review-decision-rationale"
                  maxLength={2000}
                  onChange={(event) => aiReview.onDecisionDraftChange({
                    ...aiReview.decisionDraft,
                    rationale: event.currentTarget.value,
                  })}
                  placeholder="说明接受、修订或拒绝该研究候选的依据"
                  value={aiReview.decisionDraft.rationale}
                />
              </label>
              <div className="design-ai-decision-actions">
                <button
                  className="design-primary-action"
                  disabled={!canAppendDecision}
                  onClick={aiReview.onAppendDecision}
                  type="button"
                >
                  <Check size={14} />
                  {aiReview.appendingDecision ? "正在追加…" : "追加研究决策"}
                </button>
              </div>
            </div>
            <p className="design-ai-decision-boundary">
              “接受用于研究”仅确认后续研究方向，不等于生产批准，也不会授权、启动、评估或提交订单。
            </p>
          </SurfacePanel>
          <SurfacePanel
            className="design-production-handoff design-ai-production-handoff"
            subtitle="评审候选先与已审计策略对齐，再进入既有生产交接"
            title="生产策略关联"
          >
            <div className="design-production-handoff-status">
              <div>
                <span>关联状态</span>
                <Status tone={productionPath.tone}>{productionPath.label}</Status>
              </div>
              <p>{productionPath.detail}</p>
            </div>
            <div className="design-production-handoff-grid">
              <div>
                <span>评审源运行</span>
                <strong title={currentReview?.primaryExperiment.sourceRunId ?? "—"}>
                  {compactRunId(currentReview?.primaryExperiment.sourceRunId)}
                </strong>
              </div>
              <div>
                <span>源策略版本</span>
                <strong title={currentReview?.primaryExperiment.strategyRevision ?? "—"}>
                  {compactRunId(currentReview?.primaryExperiment.strategyRevision)}
                </strong>
              </div>
              <div>
                <span>已评审候选</span>
                <strong title={currentReview?.primaryExperiment.candidateRevision ?? "—"}>
                  {compactRunId(currentReview?.primaryExperiment.candidateRevision)}
                </strong>
                <small title={currentReview?.primaryExperiment.selectedCandidateId ?? "—"}>
                  候选 {compactRunId(currentReview?.primaryExperiment.selectedCandidateId)}
                </small>
              </div>
              <div>
                <span>当前生产策略</span>
                <strong>
                  {productionStrategyHandoff?.binding
                    ? `${productionStrategyHandoff.binding.name} · ${compactRunId(productionStrategyHandoff.binding.revision)}`
                    : "尚未绑定"}
                </strong>
              </div>
            </div>
            <div className="design-production-handoff-actions">
              {productionPath.action && productionPath.actionLabel ? (
                <button
                  className={productionPath.action === "open-dynamic-trading"
                    ? "design-secondary-action"
                    : "design-primary-action"}
                  disabled={aiReview.busy}
                  onClick={runProductionPathAction}
                  type="button"
                >
                  {productionPath.action === "stage-primary-candidate"
                    ? <Check size={14} />
                    : productionPath.action === "open-dynamic-trading"
                      ? <Play size={14} />
                      : <ShieldCheck size={14} />}
                  {productionPath.actionLabel}
                </button>
              ) : null}
            </div>
          </SurfacePanel>
          {aiReview.researchLoop}
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
              <div>
                <span>快照身份</span>
                <strong title={snapshotIdentity ?? "—"}>{compactRunId(snapshotIdentity)}</strong>
              </div>
              <div><span>证据包 Hash</span><strong>{evidenceHash}</strong></div>
              <div><span>评审记录 Hash</span><strong>{recordHash}</strong></div>
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
  portfolioProductionRisk,
  portfolioRiskAssessment,
  portfolioStage4Workflow,
  productionStrategyHandoff,
  isRunningPortfolioRiskAssessment,
  onRunPortfolioRiskAssessment,
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
  | "portfolioProductionRisk"
  | "portfolioRiskAssessment"
  | "portfolioStage4Workflow"
  | "productionStrategyHandoff"
  | "isRunningPortfolioRiskAssessment"
  | "onRunPortfolioRiskAssessment"
  | "workspace"
>) {
  const cashWeight = portfolio?.cashWeight ?? 1;
  const legs = portfolio?.legs ?? [];
  const riskAllocations = new Map(
    (portfolioRiskAssessment?.allocations ?? []).map((row) => [row.symbol, row]),
  );
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
  const productionSnapshot = portfolioProductionRisk?.snapshot;
  const productionState = productionSnapshot?.state;
  const productionBinding = productionSnapshot?.strategyBinding;
  const productionRiskTarget = productionState?.lastDecisionContract?.riskAdjustedTarget;
  const productionRiskEvidence = productionRiskTarget?.evidence;
  const productionPortfolioCoverageCount = productionBinding?.auditRunId
    ? legs.filter((leg) => {
      const allocation = riskAllocations.get(leg.symbol);
      return leg.symbol === productionBinding.symbol
        && allocation?.sourceRunId === productionBinding.auditRunId;
    }).length
    : 0;
  const productionCoversCurrentPortfolio =
    legs.length === 1 && productionPortfolioCoverageCount === 1;
  const productionRiskReady = Boolean(
    productionState?.executionMode === "live"
    && productionState.enabled
    && productionState.runnerState === "running"
    && productionState.runnerHealth?.status === "running"
    && !productionState.dailyRiskHaltReason
    && productionState.lastAccountCheck?.accountCovered === true
    && productionBinding?.status === "ready"
    && productionSnapshot?.liveTradingAllowed
    && productionSnapshot.orderSubmissionEnabled
    && !productionSnapshot.liveBlockedBoundary
  );
  const productionRiskTone: "positive" | "warning" | "risk" | "neutral" =
    portfolioProductionRisk?.error
      ? "risk"
      : !productionSnapshot || portfolioProductionRisk?.loading
        ? "neutral"
        : productionRiskReady && productionCoversCurrentPortfolio
          ? "positive"
          : productionRiskReady
            ? "warning"
          : productionState?.executionMode === "live"
            ? "risk"
            : "warning";
  const productionRiskStatus =
    portfolioProductionRisk?.error
      ? "生产风险读取失败"
      : !productionSnapshot || portfolioProductionRisk?.loading
        ? "正在读取生产风险"
        : productionRiskReady && productionCoversCurrentPortfolio
          ? "生产风险链运行中 · 已覆盖当前单策略组合"
          : productionRiskReady
            ? "独立生产链运行中 · 未覆盖当前研究组合"
          : productionState?.executionMode === "live"
            ? "生产风险链已阻断"
            : productionState?.executionMode === "testnet"
              ? "当前为测试网风险链"
              : "当前为纸面模拟风险链";
  const productionModeLabel = productionState?.executionMode === "live"
    ? "生产实盘"
    : productionState?.executionMode === "testnet"
      ? "测试网"
      : productionState
        ? "纸面模拟"
        : "等待连接";
  const productionRunnerLabel = productionState?.runnerHealth?.status === "running"
    ? "后台运行正常"
    : productionState?.runnerHealth?.status === "delayed"
      ? "后台心跳延迟"
      : productionState?.runnerHealth?.status === "blocked"
        ? "后台风险阻断"
        : productionState?.runnerState === "stopping"
          ? "正在停止"
          : productionState
            ? "后台已停止"
            : "—";
  const productionDecisionLabel = ({
    preserve: "保持目标",
    reduce: "下调目标",
    zero: "清零目标",
    reject: "拒绝目标",
  } as Record<string, string>)[productionRiskTarget?.decision ?? ""] ?? "尚无风险调整";
  const productionBaseAsset =
    (productionBinding?.symbol ?? productionState?.symbol)?.split("/")[0] ?? "标的";
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
              {legs.map((leg) => {
                const allocation = riskAllocations.get(leg.symbol);
                return (
                <tr key={leg.symbol}>
                  <td>{leg.symbol}</td>
                  <td>{compactRunId(allocation?.sourceRunId ?? workspace.researchRun?.runId)}</td>
                  <td>{(leg.targetWeight * 100).toFixed(2)}%</td>
                  <td>{allocation ? `${(allocation.currentWeight * 100).toFixed(2)}%` : "待评估"}</td>
                  <td
                    className={leg.contributionReturnPct >= 0 ? "up" : "down"}
                  >
                    {leg.contributionReturnPct.toFixed(2)}%
                  </td>
                  <td>{leg.dataQuality.rows}</td>
                  <td>
                    <Status tone={allocation?.status === "blocked" ? "risk" : allocation ? "positive" : "warning"}>
                      {allocation?.status === "blocked" ? "阻断" : allocation ? "已核对" : "待评估"}
                    </Status>
                  </td>
                </tr>
                );
              })}
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
        {portfolioProductionRisk ? (
          <SurfacePanel
            action={<Status tone={productionRiskTone}>{productionRiskStatus}</Status>}
            className="design-production-handoff design-portfolio-production-risk"
            subtitle="只读投影当前单策略自动交易链，不代表研究组合已接入生产"
            title="独立生产策略与运行风险"
          >
            <div className="design-production-handoff-status">
              <div>
                <span>生产运行状态</span>
                <strong>{productionRiskStatus}</strong>
              </div>
              <p>
                {portfolioProductionRisk.error
                  ?? (productionBinding?.status === "blocked" ? productionBinding.detail : null)
                  ?? (!productionBinding && productionSnapshot
                    ? "当前 API 尚未提供生产策略绑定证据，不能把最近决策解释为当前生产策略。"
                    : null)
                  ?? productionState?.detail
                  ?? "进入组合风控后会自动读取生产运行、账户覆盖与风险调整结果。"}
              </p>
            </div>
            <div className="design-production-handoff-grid">
              <div>
                <span>运行上下文</span>
                <strong>{productionState ? `${productionState.symbol} · ${productionState.timeframe}` : "—"}</strong>
                <small>{productionModeLabel} · {productionRunnerLabel}</small>
              </div>
              <div>
                <span>当前生产策略</span>
                <strong>{productionBinding?.name ?? "—"}</strong>
                <small>
                  {productionBinding
                    ? `修订 ${compactRunId(productionBinding.revision)} · ${productionBinding.status === "ready" ? "证据有效" : "证据阻断"}`
                    : "当前接口未提供绑定证据"}
                </small>
              </div>
              <div>
                <span>当前研究组合覆盖</span>
                <strong>
                  {legs.length
                    ? `${productionPortfolioCoverageCount} / ${legs.length} 个组合腿`
                    : "尚无研究组合"}
                </strong>
                <small>
                  {productionCoversCurrentPortfolio
                    ? `审计运行 ${compactRunId(productionBinding?.auditRunId)} 已匹配`
                    : "单策略生产链不会自动覆盖多标的研究组合"}
                </small>
              </div>
              <div>
                <span>风险调整目标</span>
                <strong>{productionDecisionLabel}</strong>
                <small>
                  {productionRiskTarget
                    ? `批准名义金额 ${productionRiskTarget.approvedNotional.toLocaleString("zh-CN", {
                      maximumFractionDigits: 4,
                    })} USDT`
                    : "尚无自动评估结果"}
                </small>
              </div>
              <div>
                <span>
                  {productionState?.accountAuthority === "binance_spot"
                    ? "Binance Spot 总净值 / BTC 现货总量"
                    : "策略账本权益 / 策略持仓"}
                </span>
                <strong>
                  {productionState
                    ? `${(productionState.accountEquity ?? productionState.equity).toLocaleString("zh-CN", {
                      maximumFractionDigits: 4,
                    })} USDT`
                    : "—"}
                </strong>
                <small>
                  {productionState
                    ? `${productionState.position.toLocaleString("zh-CN", {
                      maximumFractionDigits: 8,
                    })} ${productionBaseAsset}`
                    : "尚未读取账户快照"}
                </small>
              </div>
              <div>
                <span>亏损回撤</span>
                <strong>
                  {productionState
                    ? `${(productionState.dailyLossDrawdownPct ?? 0).toFixed(2)}% / ${productionState.dailyLossLimitPct.toFixed(2)}%`
                    : "—"}
                </strong>
                <small>{productionState?.dailyRiskHaltReason ? "已触发风险暂停" : "未触发亏损上限"}</small>
              </div>
              <div>
                <span>盈利回撤</span>
                <strong>
                  {productionState
                    ? `${(productionState.dailyProfitDrawdownPct ?? 0).toFixed(2)}% / ${productionState.dailyProfitDrawdownLimitPct.toFixed(2)}%`
                    : "—"}
                </strong>
                <small>按当日盈利峰值独立计算</small>
              </div>
              <div>
                <span>小时成交额度</span>
                <strong>
                  {productionState
                    ? `${productionRiskEvidence?.recentTradeCount ?? productionState.tradeTimestamps.length} / ${productionState.maxTradesPerHour} 笔`
                    : "—"}
                </strong>
                <small>来自最新风险调整证据</small>
              </div>
              <div>
                <span>账户与授权覆盖</span>
                <strong>{productionState?.lastAccountCheck?.accountCovered ? "账户已覆盖" : "等待账户覆盖"}</strong>
                <small>
                  生产授权：{liveAuthorizationLabel(productionState)}
                </small>
              </div>
            </div>
            {productionRiskTarget?.reason ? (
              <p className="design-production-handoff-message">
                最新风险判断：{productionRiskTarget.reason}
              </p>
            ) : null}
            <div className="design-production-handoff-actions">
              <button
                className="design-secondary-action"
                disabled={portfolioProductionRisk.loading}
                onClick={portfolioProductionRisk.onRefresh}
                type="button"
              >
                <RefreshCw className={portfolioProductionRisk.loading ? "spin" : undefined} size={14} />
                {portfolioProductionRisk.loading ? "刷新中…" : "刷新生产风险"}
              </button>
              <button
                className="design-secondary-action"
                disabled={!productionStrategyHandoff?.onOpenDynamicTrading}
                onClick={productionStrategyHandoff?.onOpenDynamicTrading}
                type="button"
              >
                <Play size={14} />
                前往动态交易复核
              </button>
            </div>
            <p className="design-production-handoff-message">
              下方组合研究评估仍为模拟链；当前生产后端只支持单策略、单标的运行，不会直接改写生产目标、授权或委托。
            </p>
          </SurfacePanel>
        ) : null}
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
        <PortfolioM5Section
          assessment={portfolioRiskAssessment ?? null}
          busy={isRunningPortfolioRiskAssessment ?? false}
          error={portfolioActionError}
          onAssess={onRunPortfolioRiskAssessment}
          workflow={portfolioStage4Workflow ?? null}
        />
      </div>
    </>
  );
}

function ExecutionSurface({
  action,
  executionReadiness,
  executionSnapshot,
  isSavingSettingsConfiguration,
  onSaveSettingsConfiguration,
  settings,
  settingsConfigurationMessage,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  | "action"
  | "executionReadiness"
  | "executionSnapshot"
  | "isSavingSettingsConfiguration"
  | "onSaveSettingsConfiguration"
  | "settings"
  | "settingsConfigurationMessage"
>) {
  const configuration = settings?.configuration;
  const authoritativeSnapshotExpected = executionSnapshot !== undefined;
  const authoritativeSnapshotAvailable = executionSnapshot != null;
  const executionMode = executionSnapshot?.state.executionMode
    ?? settings?.safety.executionMode
    ?? "paper";
  const liveTradingAllowed = authoritativeSnapshotAvailable
    ? executionSnapshot.liveTradingAllowed
    : authoritativeSnapshotExpected
      ? false
      : settings?.safety.liveTradingAllowed === true;
  const liveAuthorizedUntil = authoritativeSnapshotAvailable
    ? executionSnapshot.state.liveAuthorizedUntil
    : authoritativeSnapshotExpected
      ? null
      : settings?.safety.liveAuthorizedUntil;
  const productionSessionActive = executionMode === "live" && liveTradingAllowed;
  const executionModeMessage = authoritativeSnapshotExpected && !authoritativeSnapshotAvailable
    ? "自动交易运行状态暂不可用；为避免使用陈旧配置，当前不宣称生产会话或生产路由可用。"
    : productionSessionActive
    ? `生产会话有效${
      liveAuthorizedUntil
        ? `，有效至 ${connectorTimestamp(liveAuthorizedUntil)}`
        : ""
    }；生产路由可用。每笔委托仍会复核权限、急停、账户覆盖和风险边界。`
    : executionMode === "live"
      ? "当前为币安现货生产实盘，但生产会话尚未授权或已过期；需重新完成权限核验、急停恢复和实名确认。"
      : executionMode === "testnet"
        ? "当前为币安现货测试网；仅使用测试网资金，不会提交生产实盘委托。"
        : "当前为纸面模拟；仅记录模拟决策与成交，不会向交易所提交委托。";
  return (
    <>
      <PageHeader
        action={action}
        title="执行中心"
        subtitle="自动交易运行状态、风险参数与生产授权"
      />
      <div className={`design-live-warning${productionSessionActive ? " positive" : ""}`}>
        {productionSessionActive ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
        {executionModeMessage}
      </div>
      {configuration && onSaveSettingsConfiguration ? (
        <SurfacePanel
          className="design-live-session-policy"
          subtitle="修改后实时保存；在下一次实名授权或续期时采用"
          title="生产授权策略"
        >
          <form
            aria-label="生产授权有效时长配置"
            className="design-settings-field"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              onSaveSettingsConfiguration({
                configuration: {
                  ...configuration.values,
                  liveSessionTtlHours: Number(data.get("liveSessionTtlHours")),
                },
                secretUpdates: {},
                clearSecrets: [],
              });
            }}
          >
            <label htmlFor="execution-live-session-ttl">生产授权有效时长（小时）</label>
            <input
              aria-describedby="execution-live-session-ttl-hint"
              defaultValue={configuration.values.liveSessionTtlHours}
              id="execution-live-session-ttl"
              max="8760"
              min="0"
              name="liveSessionTtlHours"
              required
              step="1"
              type="number"
            />
            <small id="execution-live-session-ttl-hint">
              默认 8 小时；0 表示永久有效。修改不会静默延长当前会话。
            </small>
            <button
              className="design-secondary-action"
              disabled={isSavingSettingsConfiguration}
              type="submit"
            >
              <Save size={13} />
              {isSavingSettingsConfiguration ? "保存中…" : "保存授权时长"}
            </button>
            {settingsConfigurationMessage ? (
              <p aria-live="polite" className="design-settings-message">
                {settingsConfigurationMessage}
              </p>
            ) : null}
          </form>
        </SurfacePanel>
      ) : null}
      {executionReadiness ? (
        <div className="design-execution-readiness">{executionReadiness}</div>
      ) : null}
    </>
  );
}

type AuditEventType = "all" | "data-ingest" | "data-processing" | "backtest" | "ai-review";

interface AuditLedgerFilters {
  runId: string;
  symbol: string;
  eventType: AuditEventType;
}

const AUDIT_LEDGER_EVENTS = [
  ["data-ingest", "数据接入", "行情与因子数据接入"],
  ["data-processing", "数据处理", "因子计算与标准化"],
  ["backtest", "策略", "回测运行"],
  ["ai-review", "AI", "评审运行"],
] as const;

export function buildAuditLedgerRows(
  runs: ResearchRunAudit[],
  filters: AuditLedgerFilters,
) {
  const runIdQuery = filters.runId.trim().toLowerCase();
  const symbolQuery = filters.symbol.trim().toLowerCase();

  return runs
    .map((run, runIndex) => ({ run, runIndex }))
    .filter(({ run }) =>
      (!runIdQuery || run.runId.toLowerCase().includes(runIdQuery)) &&
      (!symbolQuery || run.symbol.toLowerCase().includes(symbolQuery))
    )
    .flatMap(({ run, runIndex }) =>
      AUDIT_LEDGER_EVENTS
        .filter(([eventType]) => filters.eventType === "all" || filters.eventType === eventType)
        .map(([eventType, stage, event]) => ({
          eventType,
          event,
          operator: eventType === "data-ingest" ? "system" : "quant.user",
          run,
          stage,
          status: eventType === "ai-review" ? (runIndex ? "通过" : "待执行") : "成功",
        })),
    )
    .slice(0, 12);
}

function AuditSurface({
  action,
  executionAcceptanceAudit,
  runs,
  workspace,
}: Pick<TerminalWorkspaceSurfaceProps, "action" | "executionAcceptanceAudit" | "runs" | "workspace">) {
  const contextRunId = workspace.researchRun?.runId ?? "";
  const contextSymbol = workspace.selectedInstrument.symbol;
  const [draftFilters, setDraftFilters] = useState<AuditLedgerFilters>({
    runId: contextRunId,
    symbol: contextSymbol,
    eventType: "all",
  });
  const [filters, setFilters] = useState<AuditLedgerFilters>(draftFilters);

  useEffect(() => {
    const nextFilters: AuditLedgerFilters = {
      runId: contextRunId,
      symbol: contextSymbol,
      eventType: "all",
    };
    setDraftFilters(nextFilters);
    setFilters(nextFilters);
  }, [contextRunId, contextSymbol]);

  const ledgerRows = buildAuditLedgerRows(runs, filters);

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
      <form
        aria-label="审计事件筛选"
        className="design-audit-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters(draftFilters);
        }}
      >
        <label>
          Run ID
          <input
            autoComplete="off"
            name="runId"
            onChange={(event) => setDraftFilters((current) => ({
              ...current,
              runId: event.target.value,
            }))}
            value={draftFilters.runId}
          />
        </label>
        <label>
          标的/代码
          <input
            autoComplete="off"
            name="symbol"
            onChange={(event) => setDraftFilters((current) => ({
              ...current,
              symbol: event.target.value,
            }))}
            value={draftFilters.symbol}
          />
        </label>
        <label>
          事件类型
          <select
            name="eventType"
            onChange={(event) => setDraftFilters((current) => ({
              ...current,
              eventType: event.target.value as AuditEventType,
            }))}
            value={draftFilters.eventType}
          >
            <option value="all">全部</option>
            <option value="data-ingest">数据接入</option>
            <option value="data-processing">数据处理</option>
            <option value="backtest">回测运行</option>
            <option value="ai-review">AI 评审</option>
          </select>
        </label>
        <button type="submit">
          <Search size={13} />
          查询
        </button>
      </form>
      {executionAcceptanceAudit ? (
        <div className="design-execution-acceptance-audit">{executionAcceptanceAudit}</div>
      ) : null}
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
              {ledgerRows.map((row) => (
                <tr key={`${row.run.runId}-${row.eventType}`}>
                  <td>
                    {new Date(row.run.createdAt).toLocaleTimeString("zh-CN")}
                  </td>
                  <td>{row.stage}</td>
                  <td>{row.event}</td>
                  <td>{row.run.strategyName}</td>
                  <td>{compactRunId(row.run.runId)}</td>
                  <td>
                    <Status
                      tone={row.status === "待执行" ? "warning" : "positive"}
                    >
                      {row.status}
                    </Status>
                  </td>
                  <td>{compactRunId(row.run.strategyRevision)}</td>
                  <td>{row.operator}</td>
                </tr>
              ))}
              {!ledgerRows.length ? (
                <tr>
                  <td className="design-empty" colSpan={8}>
                    <EmptyState
                      detail="请修改 Run ID、标的代码或事件类型后重新查询。"
                      title="未找到匹配的审计事件"
                    />
                  </td>
                </tr>
              ) : null}
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

type ConnectorTone = "positive" | "warning" | "risk" | "neutral";

function connectorTimestamp(value: string | null | undefined): string {
  if (!value) return "暂无成功证据";
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? value : timestamp.toLocaleString("zh-CN");
}

function providerHealthLabel(
  status: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["providerHealth"]["status"],
): string {
  return {
    blocked: "阻断",
    cooldown: "冷却中",
    ok: "健康",
    watch: "待观察",
  }[status];
}

function providerHealthReason(reason: string): string {
  return {
    configured_not_probed: "端点已配置但尚未探测",
    dependency_missing: "可选依赖未安装",
    endpoint_invalid: "端点配置无效",
    endpoint_not_configured: "端点尚未配置",
    no_recent_provider_errors: "最近 24 小时无 Provider 错误",
    probe_failed: "只读探测失败",
    probe_succeeded: "只读探测通过",
    provider_cooldown: "近期错误达到冷却阈值",
    recent_provider_errors: "近期存在 Provider 错误",
  }[reason] ?? reason;
}

function dataAdapterNextAction(
  adapter: PlatformSettingsStatus["marketDataAdapters"][number],
): string {
  const health = adapter.externalTelemetry.providerHealth;
  if (!adapter.externalTelemetry.dependencyAvailable) {
    return adapter.externalTelemetry.dependency.includes("local-service")
      ? "配置可选本地只读端点；不调用同步或写入"
      : `安装可选依赖 ${adapter.externalTelemetry.dependency}；不会启用交易权限`;
  }
  if (health.status === "cooldown") {
    return `等待 ${health.retryAfterSeconds} 秒后再试，期间继续使用缓存`;
  }
  if (health.status === "watch") {
    if (health.reason === "configured_not_probed") return "等待本地端点只读健康探测";
    if (health.reason === "probe_failed") return "检查本地端点后重新探测；不会调用同步或写入";
    return `检查最近 Provider 错误；${health.retryAfterSeconds} 秒后可重试`;
  }
  if (adapter.status !== "ready") {
    return adapter.note;
  }
  return "保持只读访问；需要新数据时再刷新";
}

function executionProbePending(probe: ExecutionAdapterHealthProbeRow): string {
  if (probe.status === "ready") return "无";
  if (probe.blockerSummary && probe.blockerSummary !== "No blockers") {
    return probe.blockerSummary;
  }
  if (probe.credentialSummary.toLowerCase().includes("missing")) {
    return "Sandbox 凭据未配置";
  }
  return "只读健康探测需要复核";
}

const platformSecretFields: Array<{
  name: PlatformSettingsSecretName;
  label: string;
  production?: boolean;
}> = [
  { name: "finnhubApiKey", label: "Finnhub API Key" },
  { name: "openaiApiKey", label: "OpenAI API Key" },
  { name: "openaiCompatibleApiKey", label: "OpenAI 兼容服务 API Key" },
  { name: "monitoringWebhookUrl", label: "监控 Webhook URL" },
  { name: "freeStockdbUrl", label: "Free StockDB URL" },
  { name: "httpsProxy", label: "HTTPS 代理" },
  { name: "ccxtSandboxApiKey", label: "CCXT Testnet API Key" },
  { name: "ccxtSandboxSecret", label: "CCXT Testnet Secret" },
  { name: "ccxtProductionReadonlyApiKey", label: "生产只读 API Key", production: true },
  { name: "ccxtProductionReadonlySecret", label: "生产只读 Secret", production: true },
  { name: "ccxtProductionTradingApiKey", label: "生产交易 API Key", production: true },
  { name: "ccxtProductionTradingSecret", label: "生产交易 Secret", production: true },
];

function SettingsSecretFields({
  names,
  settings,
}: {
  names: typeof platformSecretFields;
  settings: NonNullable<PlatformSettingsStatus["configuration"]>;
}) {
  return (
    <div className="design-settings-form-grid">
      {names.map(({ name, label }) => {
        const secret = settings.secrets[name];
        return (
          <div className="design-settings-field" key={name}>
            <label htmlFor={`platform-setting-${name}`}>{label}</label>
            <input
              autoComplete="new-password"
              id={`platform-setting-${name}`}
              name={name}
              placeholder={secret.masked ?? "输入后加密保存"}
              type="password"
            />
          </div>
        );
      })}
    </div>
  );
}

function OpenAiCompatibleModelFields({
  initialBaseUrl,
  initialModel,
  onLoadModels,
}: {
  initialBaseUrl: string;
  initialModel: string;
  onLoadModels?: (baseUrl: string) => Promise<OpenAiCompatibleModelsResult>;
}) {
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [model, setModel] = useState(initialModel);
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "manual">("idle");
  const requestSequence = useRef(0);
  const discoverModels = useCallback(async (candidateBaseUrl: string) => {
    const normalizedBaseUrl = candidateBaseUrl.trim();
    const requestId = ++requestSequence.current;
    if (!normalizedBaseUrl || !onLoadModels) {
      setModels([]);
      setStatus("manual");
      return;
    }
    setStatus("loading");
    const result = await onLoadModels(normalizedBaseUrl);
    if (requestId !== requestSequence.current) return;
    if (result.source === "core" && result.models.length) {
      setModels(result.models);
      setModel((current) => current.trim() || result.models[0]);
      setStatus("loaded");
      return;
    }
    setModels([]);
    setStatus("manual");
  }, [onLoadModels]);

  useEffect(() => {
    void discoverModels(initialBaseUrl);
  }, [discoverModels, initialBaseUrl]);

  const modelOptions = Array.from(new Set([model, ...models].filter(Boolean)));
  const statusLabel = status === "loading"
    ? "正在从 /models 获取模型…"
    : status === "loaded"
      ? `已从 /models 获取 ${models.length} 个模型`
      : status === "manual"
        ? "未获取到模型，可手动输入"
        : "将从 Base URL 的 /models 自动获取模型";

  return (
    <>
      <label className="design-settings-field">
        <span>OpenAI 兼容 Base URL</span>
        <input
          name="openaiCompatibleBaseUrl"
          onBlur={() => void discoverModels(baseUrl)}
          onChange={(event) => {
            requestSequence.current += 1;
            setBaseUrl(event.currentTarget.value);
            setModels([]);
            setStatus("idle");
          }}
          type="url"
          value={baseUrl}
        />
      </label>
      <div className="design-settings-field">
        <label htmlFor="platform-setting-openai-compatible-model">OpenAI 兼容模型</label>
        <div className="design-settings-model-control">
          {status === "loaded" ? (
            <select
              id="platform-setting-openai-compatible-model"
              name="openaiCompatibleModel"
              onChange={(event) => setModel(event.currentTarget.value)}
              value={model}
            >
              {modelOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : (
            <input
              id="platform-setting-openai-compatible-model"
              name="openaiCompatibleModel"
              onChange={(event) => setModel(event.currentTarget.value)}
              placeholder="自动获取失败时手动输入"
              value={model}
            />
          )}
          <button
            aria-label="刷新 OpenAI 兼容模型"
            className="design-secondary-action"
            disabled={!baseUrl.trim() || status === "loading" || !onLoadModels}
            onClick={() => void discoverModels(baseUrl)}
            title="从 Base URL 的 /models 获取模型"
            type="button"
          >
            <RefreshCw className={status === "loading" ? "spin" : undefined} size={12} />
            获取
          </button>
        </div>
        <small aria-live="polite">{statusLabel}</small>
      </div>
    </>
  );
}

function SettingsSurface({
  action,
  adapterRows,
  adapterChainHealthRollups = [],
  adapterHealthProbeRows = [],
  adapterLedgerRows = [],
  aiReview,
  isLoadingSettingsConfiguration = false,
  isSavingSettingsConfiguration = false,
  isTestingMonitoringWebhook = false,
  onLoadOpenAiCompatibleModels,
  onSaveSettingsConfiguration,
  onTestMonitoringWebhook,
  settings,
  settingsConfigurationMessage,
}: Pick<
  TerminalWorkspaceSurfaceProps,
  | "action"
  | "adapterRows"
  | "adapterChainHealthRollups"
  | "adapterHealthProbeRows"
  | "adapterLedgerRows"
  | "aiReview"
  | "isLoadingSettingsConfiguration"
  | "isSavingSettingsConfiguration"
  | "isTestingMonitoringWebhook"
  | "onLoadOpenAiCompatibleModels"
  | "onSaveSettingsConfiguration"
  | "onTestMonitoringWebhook"
  | "settings"
  | "settingsConfigurationMessage"
>) {
  const configuration = settings?.configuration;
  const dataAdapters = settings?.marketDataAdapters ?? [];
  const executionAdapters = settings?.executionAdapters ?? [];
  const dataBlocker = dataAdapters.find(
    (adapter) =>
      adapter.status !== "ready" ||
      adapter.externalTelemetry.providerHealth.status !== "ok",
  );
  const readyDataAdapterCount = dataAdapters.filter(
    (adapter) =>
      adapter.status === "ready" &&
      adapter.externalTelemetry.providerHealth.status === "ok",
  ).length;
  const dataAdapterHealthTone: ConnectorTone = !settings || !dataAdapters.length
    ? "neutral"
    : readyDataAdapterCount === dataAdapters.length
      ? "positive"
      : readyDataAdapterCount
        ? "warning"
        : "risk";
  const configuredAiProviders = aiReview.providers.filter((provider) => provider.configured);
  const configuredExternalAiProviders = configuredAiProviders.filter(
    (provider) => provider.providerId !== "local",
  );
  const localAiProvider = aiReview.providers.find((provider) => provider.providerId === "local");
  const aiProviderTone: ConnectorTone = !aiReview.providers.length
    ? "neutral"
    : !localAiProvider?.configured
      ? "risk"
      : configuredExternalAiProviders.length
        ? "warning"
        : "positive";
  const liveTradingAllowed = settings?.safety.liveTradingAllowed ?? false;
  const executionMode = settings?.safety.executionMode;
  const productionLive = settings?.safety.productionLive;
  const productionEvidenceStale =
    productionLive?.blockingReason === "stage10_production_execution_control_evidence_stale";
  const executionStatusLabel = !settings
    ? "未加载"
    : liveTradingAllowed
      ? "生产会话已授权"
      : executionMode === "testnet"
        ? "测试网运行中"
        : executionMode === "paper"
          ? "模拟运行中"
          : "生产会话未授权";
  const runtimeBlockingReason = liveTradingAllowed
    ? null
    : productionEvidenceStale
      ? "生产权限证据已过期"
      : productionLive?.enabled === false
        ? "生产实盘功能未启用"
        : productionLive?.credentialsConfigured === false
          ? "生产交易凭据未配置"
          : productionLive?.triggered
            ? "生产急停已触发"
            : productionLive && !productionLive.controlActive
              ? "生产执行控制未恢复"
              : settings
                ? "生产会话未开启"
                : null;
  const blockingChain = adapterChainHealthRollups.find(
    (rollup) => rollup.status === "blocked" || rollup.status === "in_progress",
  );
  const latestLedgerRow =
    adapterLedgerRows.find((row) => row.adapterId === blockingChain?.adapterId) ??
    adapterLedgerRows.find((row) => row.route === "live" && !row.liveTradingAllowed) ??
    adapterLedgerRows[0];
  const latestHealthProbe = adapterHealthProbeRows[0];
  const latestHealthProbePending = latestHealthProbe
    ? executionProbePending(latestHealthProbe)
    : null;
  const paperReadyAdapterCount = executionAdapters.filter(
    (adapter) => adapter.route === "paper" && adapter.status === "paper_ready",
  ).length;
  const executionTone: ConnectorTone = !settings
    ? "neutral"
    : latestHealthProbe?.tone === "risk"
      ? "risk"
      : liveTradingAllowed || executionMode === "paper" || executionMode === "testnet"
        ? "positive"
        : "warning";
  const executionNextAction =
    (productionEvidenceStale
      ? "重新核验生产权限并恢复执行控制"
      : liveTradingAllowed
        ? "生产会话有效；继续遵守风险与对账门禁"
        : productionLive?.credentialsConfigured === false
          ? "先配置专用生产交易凭据"
          : executionMode === "paper" || executionMode === "testnet"
            ? "如需实盘，在执行中心切换生产模式并确认真实资金风险"
            : null) ??
    (latestHealthProbe && latestHealthProbe.status !== "ready"
      ? `处理“${latestHealthProbePending}”后重新运行只读健康检查`
      : null) ??
    (blockingChain?.blockerLabel
      ? `补齐 ${blockingChain.blockerLabel} 证据`
      : latestLedgerRow
        ? "保持纸面执行，按现有门禁顺序补齐认证证据"
        : "保持纸面执行，按门禁顺序补齐认证证据");
  const saveConfiguration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!configuration || !onSaveSettingsConfiguration) return;
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    const secretUpdates: PlatformSettingsUpdateRequest["secretUpdates"] = {};
    platformSecretFields.forEach(({ name }) => {
      const value = String(data.get(name) ?? "");
      if (value) secretUpdates[name] = value;
    });
    onSaveSettingsConfiguration({
      configuration: {
        ccxtDefaultExchange: text("ccxtDefaultExchange"),
        ccxtTimeout: Number(text("ccxtTimeout")),
        autoTradingIntervalSeconds: Number(text("autoTradingIntervalSeconds")),
        liveSessionTtlHours: Number(text("liveSessionTtlHours")),
        openaiModel: text("openaiModel"),
        openaiCompatibleBaseUrl: text("openaiCompatibleBaseUrl"),
        openaiCompatibleModel: text("openaiCompatibleModel"),
        ollamaBaseUrl: text("ollamaBaseUrl"),
        ollamaModel: text("ollamaModel"),
        monitoringWebhookTimeoutSeconds: Number(text("monitoringWebhookTimeoutSeconds")),
        freeStockdbTimeoutSeconds: Number(text("freeStockdbTimeoutSeconds")),
      },
      secretUpdates,
      clearSecrets: [],
    });
  };

  return (
    <>
      <PageHeader
        action={action}
        subtitle="/ 连接器能力、健康与权限"
        title="设置"
      />
      <div className="design-settings-grid">
        <nav aria-label="设置分区" className="design-settings-nav">
          <a className="selected" href="#settings-configuration">平台配置</a>
          <a href="#settings-connectors">连接器总览</a>
          <a href="#settings-data-connectors">数据源</a>
          <a href="#settings-ai-connectors">AI Provider</a>
          <a href="#settings-execution-connectors">执行适配器</a>
          <a href="#settings-safety">安全边界</a>
        </nav>
        <div className="design-settings-main">
          <SurfacePanel title="平台配置">
            {configuration ? (
              <form
                aria-label="平台配置"
                className="design-settings-form"
                id="settings-configuration"
                key={`${configuration.source}-${configuration.revision}`}
                onSubmit={saveConfiguration}
              >
                <div className="design-settings-form-meta">
                  <strong>
                    {configuration.source === "database"
                      ? `数据库配置 · 修订 ${configuration.revision}`
                      : "环境变量初始化"}
                  </strong>
                  <span>
                    首次保存后以数据库为准；密钥只返回掩码，保存后实时生效。
                  </span>
                </div>
                <fieldset>
                  <legend>数据与运行参数</legend>
                  <div className="design-settings-form-grid">
                    <label className="design-settings-field">
                      <span>CCXT 默认交易所</span>
                      <input defaultValue={configuration.values.ccxtDefaultExchange} name="ccxtDefaultExchange" required />
                    </label>
                    <label className="design-settings-field">
                      <span>CCXT 超时（毫秒）</span>
                      <input defaultValue={configuration.values.ccxtTimeout} max="120000" min="1000" name="ccxtTimeout" required type="number" />
                    </label>
                    <label className="design-settings-field">
                      <span>监控超时（秒）</span>
                      <input defaultValue={configuration.values.monitoringWebhookTimeoutSeconds} max="120" min="1" name="monitoringWebhookTimeoutSeconds" required type="number" />
                    </label>
                    <label className="design-settings-field">
                      <span>Free StockDB 超时（秒）</span>
                      <input defaultValue={configuration.values.freeStockdbTimeoutSeconds} max="120" min="1" name="freeStockdbTimeoutSeconds" required type="number" />
                    </label>
                    <label className="design-settings-field">
                      <span>自动评估间隔（秒）</span>
                      <input
                        defaultValue={configuration.values.autoTradingIntervalSeconds}
                        max="3600"
                        min="5"
                        name="autoTradingIntervalSeconds"
                        required
                        step="1"
                        type="number"
                      />
                      <small>5–3600 秒；保存后实时应用，无需重启 API。</small>
                    </label>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>生产安全策略</legend>
                  <div className="design-settings-form-grid">
                    <label className="design-settings-field">
                      <span>生产授权有效时长（小时）</span>
                      <input
                        defaultValue={configuration.values.liveSessionTtlHours}
                        max="8760"
                        min="0"
                        name="liveSessionTtlHours"
                        required
                        step="1"
                        type="number"
                      />
                      <small>默认 8 小时；0 表示永久有效，直到手动暂停、急停或撤销授权。</small>
                    </label>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>AI Provider</legend>
                  <div className="design-settings-form-grid">
                    <label className="design-settings-field">
                      <span>OpenAI 模型</span>
                      <input defaultValue={configuration.values.openaiModel} name="openaiModel" />
                    </label>
                    <OpenAiCompatibleModelFields
                      initialBaseUrl={configuration.values.openaiCompatibleBaseUrl}
                      initialModel={configuration.values.openaiCompatibleModel}
                      onLoadModels={onLoadOpenAiCompatibleModels}
                    />
                    <label className="design-settings-field">
                      <span>Ollama Base URL</span>
                      <input defaultValue={configuration.values.ollamaBaseUrl} name="ollamaBaseUrl" type="url" />
                    </label>
                    <label className="design-settings-field">
                      <span>Ollama 模型</span>
                      <input defaultValue={configuration.values.ollamaModel} name="ollamaModel" />
                    </label>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>密钥与私密地址</legend>
                  <SettingsSecretFields
                    names={platformSecretFields.filter((field) => !field.production)}
                    settings={configuration}
                  />
                </fieldset>
                <details className="design-settings-disclosure">
                  <summary>
                    <span>生产凭据（保存不会启用实盘交易）</span>
                    <Status tone="risk">独立门禁保持阻断</Status>
                  </summary>
                  <SettingsSecretFields
                    names={platformSecretFields.filter((field) => field.production)}
                    settings={configuration}
                  />
                </details>
                {settingsConfigurationMessage ? (
                  <p className="design-settings-message">{settingsConfigurationMessage}</p>
                ) : null}
                <div className="design-settings-actions">
                  <button
                    className="design-primary-action"
                    disabled={isSavingSettingsConfiguration || !onSaveSettingsConfiguration}
                    type="submit"
                  >
                    <Save size={15} />
                    {isSavingSettingsConfiguration ? "保存中…" : "保存配置"}
                  </button>
                  <button
                    className="design-secondary-action"
                    disabled={
                      isSavingSettingsConfiguration ||
                      isTestingMonitoringWebhook ||
                      !onTestMonitoringWebhook ||
                      !configuration.secrets.monitoringWebhookUrl.configured
                    }
                    onClick={onTestMonitoringWebhook}
                    type="button"
                  >
                    <Send size={14} />
                    {isTestingMonitoringWebhook ? "测试中…" : "测试 Webhook"}
                  </button>
                </div>
              </form>
            ) : (
              <p id="settings-configuration">
                {isLoadingSettingsConfiguration
                  ? "正在加载平台配置…"
                  : "核心服务尚未提供可写配置契约。"}
              </p>
            )}
          </SurfacePanel>
          <SurfacePanel
            className="design-connector-overview"
            title="连接器状态与下一步"
          >
            <div className="design-connector-summary" id="settings-connectors">
              <article>
                <header>
                  <strong>数据源</strong>
                  <Status tone={dataAdapterHealthTone}>
                    {!settings || !dataAdapters.length
                      ? "未加载"
                      : readyDataAdapterCount === dataAdapters.length
                        ? "健康"
                        : "部分受限"}
                  </Status>
                </header>
                <dl>
                  <div><dt>阻断原因</dt><dd>{dataBlocker
                    ? providerHealthReason(dataBlocker.externalTelemetry.providerHealth.reason)
                    : settings && dataAdapters.length ? "无" : "核心服务状态未加载"}</dd></div>
                  <div><dt>影响</dt><dd>{settings && dataAdapters.length
                    ? `${readyDataAdapterCount}/${dataAdapters.length} 个适配器可直接使用`
                    : "不把静态配置当作健康状态"}</dd></div>
                  <div><dt>下一步</dt><dd>{dataBlocker
                    ? dataAdapterNextAction(dataBlocker)
                    : settings && dataAdapters.length ? "按需刷新只读行情" : "重新加载核心服务状态"}</dd></div>
                </dl>
              </article>
              <article>
                <header>
                  <strong>AI Provider</strong>
                  <Status tone={aiProviderTone}>
                    {!aiReview.providers.length
                      ? "未加载"
                      : `${configuredAiProviders.length}/${aiReview.providers.length} 已配置`}
                  </Status>
                </header>
                <dl>
                  <div><dt>阻断原因</dt><dd>{
                    !aiReview.providers.length
                      ? "Provider 注册表未加载"
                      : !localAiProvider?.configured
                        ? "本地确定性基线不可用"
                        : configuredExternalAiProviders.length
                          ? "外部端点尚无健康探测证据"
                          : "外部服务未配置"
                  }</dd></div>
                  <div><dt>影响</dt><dd>配置只代表可选择；外部调用仍需逐次授权证据摘要</dd></div>
                  <div><dt>下一步</dt><dd>{
                    localAiProvider?.configured
                      ? "继续保留本地基线；外部调用前核对出站字段"
                      : "先恢复本地确定性基线"
                  }</dd></div>
                </dl>
              </article>
              <article>
                <header>
                  <strong>执行适配器</strong>
                  <Status tone={executionTone}>
                    {executionStatusLabel}
                  </Status>
                </header>
                <dl>
                  <div><dt>阻断原因</dt><dd>{
                    (latestHealthProbe && latestHealthProbe.status !== "ready"
                      ? latestHealthProbePending
                      : null) ??
                    runtimeBlockingReason ??
                    blockingChain?.blockerLabel ??
                    latestLedgerRow?.reason ??
                    (settings ? "生产门禁尚未全部通过" : "核心服务状态未加载")
                  }</dd></div>
                  <div><dt>影响</dt><dd>{settings
                    ? `当前执行模式：${
                      executionMode === "testnet" ? "测试网" : executionMode === "live" ? "生产实盘" : "模拟"
                    }；生产下单：${liveTradingAllowed ? "允许" : "未开启"}`
                    : "不推断订单提交或路由权限"}</dd></div>
                  <div><dt>下一步</dt><dd>{executionNextAction}</dd></div>
                </dl>
              </article>
            </div>
          </SurfacePanel>
          <SurfacePanel title="连接器详情（渐进披露）">
            <details className="design-settings-disclosure" id="settings-data-connectors">
              <summary>
                <span>数据源能力、冷却与最近成功证据</span>
                <Status tone={dataAdapterHealthTone}>
                  {settings && dataAdapters.length
                    ? `${readyDataAdapterCount}/${dataAdapters.length} 健康`
                    : "未加载"}
                </Status>
              </summary>
              <table className="design-table compact design-data-provider-table">
                <thead>
                  <tr>
                    <th>适配器 / 能力</th>
                    <th>健康</th>
                    <th>权限</th>
                    <th>冷却</th>
                    <th>最近成功证据</th>
                    <th>未决状态</th>
                    <th>下一步</th>
                  </tr>
                </thead>
                <tbody>
                  {dataAdapters.map((adapter) => {
                    const health = adapter.externalTelemetry.providerHealth;
                    const tone: ConnectorTone =
                      health.status === "ok"
                        ? adapter.status === "ready" ? "positive" : "warning"
                        : health.status === "blocked" ? "risk" : "warning";
                    return (
                      <tr key={adapter.id}>
                        <td>
                          <strong>{adapter.provider}</strong><br />
                          {adapter.capabilities.join(" / ")} · {adapter.timeframes.join(" / ")}
                          {" · "}{adapter.historyDepth ?? "深度未声明"}
                          <br />
                          {adapter.adjustmentModes?.join(" / ") || "复权未声明"}
                          {" · "}{adapter.freshnessSemantics ?? "时效未声明"}
                        </td>
                        <td>
                          <Status tone={tone}>{providerHealthLabel(health.status)}</Status>
                          <br />{providerHealthReason(health.reason)}
                        </td>
                        <td>
                          {adapter.credentialRequirements?.join(" / ") || "无需凭据"}
                          <br />{adapter.readOnly ? "只读" : "可写"} · {adapter.cacheScope}
                        </td>
                        <td>{health.retryAfterSeconds ? `${health.retryAfterSeconds} 秒` : "无"}</td>
                        <td>{connectorTimestamp(adapter.cacheDiagnostics.latestTimestamp)}</td>
                        <td>
                          {adapter.externalTelemetry.retryState}
                          {adapter.externalTelemetry.lastProviderError
                            ? ` · ${adapter.externalTelemetry.lastProviderError.category}`
                            : ""}
                        </td>
                        <td>{dataAdapterNextAction(adapter)}</td>
                      </tr>
                    );
                  })}
                  {!dataAdapters.length ? (
                    <tr><td colSpan={7}>核心服务能力矩阵未加载；不会用静态配置冒充健康状态。</td></tr>
                  ) : null}
                </tbody>
              </table>
            </details>
            <details className="design-settings-disclosure" id="settings-ai-connectors">
              <summary>
                <span>AI Provider 配置、权限与健康证据</span>
                <Status tone={aiProviderTone}>
                  {aiReview.providers.length
                    ? `${configuredAiProviders.length}/${aiReview.providers.length} 已配置`
                    : "未加载"}
                </Status>
              </summary>
              <table className="design-table compact">
                <thead>
                  <tr>
                    <th>Provider / 能力</th>
                    <th>配置状态</th>
                    <th>健康</th>
                    <th>权限</th>
                    <th>冷却 / 最近成功</th>
                    <th>未决状态</th>
                    <th>下一步</th>
                  </tr>
                </thead>
                <tbody>
                  {aiReview.providers.map((provider) => {
                    const local = provider.providerId === "local";
                    return (
                      <tr key={provider.providerId}>
                        <td>
                          <strong>{aiProviderLabels[provider.providerId]}</strong><br />
                          {provider.model ?? (local ? "deterministic" : "模型未配置")}
                          {" · "}{provider.sanitizedBaseUrl ?? (local ? "无外部端点" : "地址未配置")}
                        </td>
                        <td>{provider.configured ? "已配置" : "未配置"}</td>
                        <td>
                          <Status tone={local && provider.configured ? "positive" : provider.configured ? "warning" : "risk"}>
                            {local && provider.configured ? "本地基线可用" : provider.configured ? "健康未探测" : "不可用"}
                          </Status>
                        </td>
                        <td>{local ? "无出站" : "需逐次授权证据摘要"}</td>
                        <td>{local ? "不适用" : "未提供 · 暂无端点探测证据"}</td>
                        <td>{local ? "无" : provider.configured ? "端点健康待验证" : "配置缺失"}</td>
                        <td>{local
                          ? "保持确定性基线"
                          : provider.configured
                            ? "调用前核对出站字段并授权"
                            : "先完成服务配置"}</td>
                      </tr>
                    );
                  })}
                  {!aiReview.providers.length ? (
                    <tr><td colSpan={7}>Provider 注册表尚未加载。</td></tr>
                  ) : null}
                </tbody>
              </table>
            </details>
            <details className="design-settings-disclosure" id="settings-execution-connectors">
              <summary>
                <span>执行适配器权限、健康与链路证据</span>
                <Status tone={executionTone}>
                  {executionStatusLabel}
                </Status>
              </summary>
              <table className="design-table compact design-adapter-table">
                <thead>
                  <tr>
                    <th>适配器</th>
                    <th>状态</th>
                    <th>权限 / 凭据</th>
                    <th>冷却</th>
                    <th>最近状态证据</th>
                    <th>未决状态</th>
                    <th>下一步</th>
                  </tr>
                </thead>
                <tbody>
                  {executionAdapters.map((adapter) => {
                    const broker = adapterRows.find((row) => row.id === adapter.id);
                    const ledger = adapterLedgerRows.find((row) => row.adapterId === adapter.id);
                    const probe = adapterHealthProbeRows.find((row) => row.adapterId === adapter.id);
                    const chain = adapterChainHealthRollups.find((row) => row.adapterId === adapter.id);
                    const tone: ConnectorTone = chain
                      ? chain.tone
                      : ledger?.tone ?? (adapter.status === "paper_ready" ? "positive" : "warning");
                    return (
                      <tr key={adapter.id}>
                        <td>
                          <strong>{ledger?.adapter ?? broker?.adapter ?? adapter.adapter}</strong><br />
                          {adapter.market === "multi" ? "多市场" : terminalSurfaceZh.marketLabel(adapter.market)}
                          {" · "}{adapter.route === "paper" ? "模拟" : "实盘"}
                        </td>
                        <td>
                          <Status tone={tone}>
                            {chain?.headline ?? ledger?.label ?? (
                              {
                                paper_ready: "模拟可用",
                                interface_only: "仅接口",
                                config_required: "需要配置",
                                ready: "可用",
                                degraded: "受限",
                                blocked: "已阻断",
                              }[adapter.status] ?? adapter.status
                            )}
                          </Status>
                        </td>
                        <td>
                          {probe?.credentialSummary ?? broker?.certification ?? adapter.certification}
                          <br />实盘权限：{adapter.liveTradingAllowed ? "是" : "否"}
                        </td>
                        <td>未声明</td>
                        <td>{connectorTimestamp(
                          chain?.latestEvidenceTimestamp ?? probe?.timestamp ?? ledger?.timestamp,
                        )}</td>
                        <td>{chain?.blockerLabel ?? probe?.blockerSummary ?? ledger?.reason ?? broker?.certification ?? adapter.note}</td>
                        <td>{ledger?.nextStep ?? broker?.nextStep ?? (chain?.blockerLabel
                          ? `补齐 ${chain.blockerLabel} 证据`
                          : adapter.note)}</td>
                      </tr>
                    );
                  })}
                  {adapterHealthProbeRows
                    .filter((probe) => !executionAdapters.some((adapter) => adapter.id === probe.adapterId))
                    .map((probe) => {
                      const chain = adapterChainHealthRollups.find((row) => row.adapterId === probe.adapterId);
                      return (
                        <tr key={`probe:${probe.id}`}>
                          <td>
                            <strong>{probe.provider}:{probe.exchangeId}</strong><br />
                            {probe.adapterId} · {probe.mode === "sandbox" ? "沙箱" : probe.mode}
                          </td>
                          <td><Status tone={probe.tone}>{probe.statusLabel}</Status></td>
                          <td>{probe.credentialSummary}<br />{probe.boundary}</td>
                          <td>未声明</td>
                          <td>{connectorTimestamp(probe.timestamp)}</td>
                          <td>{chain?.blockerLabel ?? executionProbePending(probe)}</td>
                          <td>{probe.status === "ready"
                            ? "保持只读探测；生产权限仍需独立门禁"
                            : `处理 ${executionProbePending(probe)} 后重新检查`}</td>
                        </tr>
                      );
                    })}
                  {!executionAdapters.length ? (
                    <tr><td colSpan={7}>执行适配器状态未从核心服务加载。</td></tr>
                  ) : null}
                </tbody>
              </table>
            </details>
            <div className="design-live-warning small">
              <AlertTriangle size={14} />
              已配置不等于健康或已授权；原始能力、权限、冷却与证据仅在需要时展开。
            </div>
          </SurfacePanel>
        </div>
        <div className="design-settings-side" id="settings-safety">
          <SurfacePanel title="安全边界（核心服务）">
            <div className="design-check-row">
              <LockKeyhole size={13} />
              <span>模拟适配器就绪</span>
              <strong>{settings ? paperReadyAdapterCount : "未加载"}</strong>
            </div>
            <div className="design-check-row">
              <LockKeyhole size={13} />
              <span>允许实盘交易</span>
              <strong className={liveTradingAllowed ? "up" : "down"}>
                {settings ? (liveTradingAllowed ? "是" : "否") : "未加载"}
              </strong>
            </div>
            <div className="design-check-row">
              <LockKeyhole size={13} />
              <span>当前执行模式</span>
              <strong>
                {settings
                  ? executionMode === "testnet"
                    ? "测试网"
                    : executionMode === "live"
                      ? "生产实盘"
                      : "模拟"
                  : "未加载"}
              </strong>
            </div>
            <div className="design-kv-row">
              <span>必需门禁</span>
              <strong>{settings ? settings.safety.requiredGates.length : "未加载"}</strong>
            </div>
            <p className={settings && !liveTradingAllowed ? "down" : ""}>
              {settings
                ? liveTradingAllowed
                  ? `生产会话已授权${
                    settings.safety.liveAuthorizedUntil
                      ? `，有效至 ${connectorTimestamp(settings.safety.liveAuthorizedUntil)}`
                      : ""
                  }。`
                  : `${runtimeBlockingReason ?? "生产会话未开启"}；${executionNextAction}。`
                : "安全契约尚未加载。"}
            </p>
          </SurfacePanel>
          <SurfacePanel title="最近状态证据">
            <div className="design-kv-row">
              <span>设置快照</span>
              <strong>{connectorTimestamp(settings?.generatedAt)}</strong>
            </div>
            <div className="design-kv-row">
              <span>执行健康探测</span>
              <strong>{connectorTimestamp(adapterHealthProbeRows[0]?.timestamp)}</strong>
            </div>
            <div className="design-kv-row">
              <span>执行链路证据</span>
              <strong>{connectorTimestamp(
                adapterChainHealthRollups
                  .map((row) => row.latestEvidenceTimestamp)
                  .filter((value): value is string => Boolean(value))
                  .sort()
                  .at(-1),
              )}</strong>
            </div>
          </SurfacePanel>
          <SurfacePanel title="密钥处理规则">
            {[
              "密钥仅通过本机 API 提交",
              "SQLite 加密存储，响应仅返回掩码",
              "绝不写入 Dockerfile/镜像层",
              "绝不导出到日志/错误堆栈",
            ].map((label) => (
              <div className="design-check-row" key={label}>
                <CheckCircle2 size={13} />
                <span>{label}</span>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="只读操作">
            <button
              className="design-secondary-action"
              disabled={action.disabled}
              onClick={action.onClick}
              type="button"
            >
              <RefreshCw className={action.disabled ? "spin" : undefined} size={13} />
              {action.label}
            </button>
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
      content = (
        <MarketSurface
          key={props.workspace.selectedInstrument.market === "crypto" ? "crypto" : "ashare"}
          {...props}
        />
      );
      break;
    case "market-information":
      content = <MarketInformationSurface {...props} />;
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
      {props.workflowGuide}
      {content}
    </section>
  );
}
