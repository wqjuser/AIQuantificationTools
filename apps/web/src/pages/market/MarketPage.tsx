import { Save, Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { MarketAiSelectionDiscovery, MarketDiscoveryItem, MarketDiscoveryParams } from "../../lib/terminal-api";
import type { Instrument, Timeframe } from "../../lib/terminal-workbench";
import { MarketAiSelectionPanel } from "../../components/MarketAiSelectionPanel";
import { compactRunId, PageHeader, Status, SurfacePanel } from "../../components/TerminalSurfaceUi";
import type { TerminalWorkspacePageProps } from "../shared/terminal-workspace-page";
import { formatPrice, marketDiscoveryNumber } from "../shared/terminal-workspace-formatters";
import "./MarketPage.layout.css";
import "./MarketDiscovery.layout.css";

const marketTimeframeOptions: Array<{ label: string; value: Timeframe }> = [
  { label: "1 分", value: "1m" },
  { label: "5 分", value: "5m" },
  { label: "日 K", value: "1d" },
  { label: "周 K", value: "1w" },
];

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

export function MarketPage({
  action,
  aiReview,
  chart,
  isSavingWatchlist,
  latestWatchlistCacheRefresh,
  marketCalendar,
  marketAiSelection,
  marketDiscovery,
  marketRefreshIssue,
  onRemoveWatchlistInstrument,
  onOpenMarketInformation,
  onResearchInstrument,
  onSaveWatchlist,
  onSelectInstrument,
  onSelectTimeframe,
  source,
  workspace,
}: Pick<
  TerminalWorkspacePageProps,
  | "action"
  | "aiReview"
  | "chart"
  | "isSavingWatchlist"
  | "latestWatchlistCacheRefresh"
  | "marketCalendar"
  | "marketAiSelection"
  | "marketDiscovery"
  | "marketRefreshIssue"
  | "onRemoveWatchlistInstrument"
  | "onOpenMarketInformation"
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
  const aiSelectionMinAmountWan = optionalNumber(discoveryMinAmountWan);
  const aiSelectionDiscovery: MarketAiSelectionDiscovery = {
    query: discoveryQuery.trim() || undefined,
    minChangePct: optionalNumber(discoveryMinChangePct),
    maxChangePct: optionalNumber(discoveryMaxChangePct),
    minAmount: aiSelectionMinAmountWan === undefined
      ? undefined
      : aiSelectionMinAmountWan * 10_000,
    minTurnoverRate: optionalNumber(discoveryMinTurnoverRate),
    maxPe: optionalNumber(discoveryMaxPe),
    sort: effectiveDiscoverySort,
    direction: discoveryDirection,
  };
  return (
    <>
      <PageHeader action={action} title="行情中心" />
      {onOpenMarketInformation ? (
        <div className="design-market-secondary-nav">
          <button className="design-link-button" onClick={onOpenMarketInformation} type="button">查看市场资讯</button>
        </div>
      ) : null}
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
          <MarketAiSelectionPanel
            discovery={aiSelectionDiscovery}
            initialMarket={workspace.selectedInstrument.market}
            providers={aiReview.providers}
            selection={marketAiSelection}
          />
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
