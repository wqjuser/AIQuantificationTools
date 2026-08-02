import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { MarketDiscoveryItem } from "../../lib/terminal-api";
import { compactRunId, EmptyState, PageHeader, Status, SurfacePanel } from "../../components/TerminalSurfaceUi";
import type { TerminalWorkspacePageProps } from "../shared/terminal-workspace-page";
import { formatPrice, marketDiscoveryNumber, terminalSurfaceZh } from "../shared/terminal-workspace-formatters";
import "./MarketInformationPage.layout.css";

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

export function MarketInformationPage({
  action,
  marketInformation,
}: Pick<TerminalWorkspacePageProps, "action" | "marketInformation">) {
  const [newsFilter, setNewsFilter] = useState<"all" | "market" | "instrument">("all");
  useEffect(() => {
    setNewsFilter("all");
  }, [marketInformation?.market, marketInformation?.symbol]);
  const result = marketInformation?.result;
  const matchesContext = Boolean(
    result
    && result.market === marketInformation?.market
    && result.symbol === marketInformation.symbol,
  );
  const overviewSnapshot = matchesContext && !result?.error ? result : null;
  const newsResult = marketInformation?.newsResult;
  const newsMatchesContext = Boolean(
    newsResult
    && newsResult.market === marketInformation?.market
    && newsResult.symbol === marketInformation.symbol,
  );
  const newsSnapshot = newsMatchesContext && !newsResult?.error
    ? newsResult
    : overviewSnapshot;
  const snapshot = overviewSnapshot ?? newsSnapshot;
  const pagination = newsSnapshot?.pagination;
  const newsMatchesFilter = pagination?.scope === newsFilter;
  const visibleNews = newsMatchesFilter ? newsSnapshot?.news ?? [] : [];
  const visibleNewsPage = pagination
    ? Math.floor(pagination.offset / pagination.limit) + 1
    : 1;
  const newsOnlySnapshot = Boolean(!overviewSnapshot && newsSnapshot);
  const marketLabel = terminalSurfaceZh.marketLabel(marketInformation?.market ?? "ashare");
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
        subtitle={[marketLabel, marketInformation?.symbol].filter(Boolean).join(" · ")}
        title="市场资讯"
      >
        <div className="design-meta-line">
          <span>只读研究信息，不触发策略、委托或自动交易</span>
        </div>
      </PageHeader>
      <div
        aria-label="市场切换"
        className="design-market-information-tabs design-market-information-market-tabs"
        role="tablist"
      >
        {([
          ["ashare", "A 股"],
          ["us", "美股"],
          ["crypto", "加密货币"],
        ] as const).map(([market, label]) => (
          <button
            aria-selected={marketInformation?.market === market}
            className={marketInformation?.market === market ? "active" : ""}
            key={market}
            onClick={() => marketInformation?.onMarketChange(market)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      {marketInformation?.isLoading ? (
        <p className="design-market-information-state" role="status">
          {newsOnlySnapshot
            ? "最新资讯已显示，正在加载市场概览与排行…"
            : "正在加载最新资讯…"}
        </p>
      ) : null}
      {!marketInformation?.isLoading && newsOnlySnapshot ? (
        <div className="design-market-information-state risk" role="alert">
          <span>新闻已加载，市场概览与排行暂时不可用。</span>
          <button className="design-link-button" onClick={marketInformation?.onRefresh} type="button">
            重新加载
          </button>
        </div>
      ) : null}
      {result?.error && matchesContext ? (
        <div className="design-market-information-state risk" role="alert">
          <span>市场资讯暂时不可用：{result.error}</span>
          <button className="design-link-button" onClick={marketInformation?.onRefresh} type="button">
            重新加载
          </button>
        </div>
      ) : null}
      {newsResult?.error && newsMatchesContext ? (
        <div className="design-market-information-state risk" role="alert">
          <span>新闻资讯暂时不可用：{newsResult.error}</span>
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
          {!newsOnlySnapshot ? (
            <>
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
            </>
          ) : null}
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
                    disabled={marketInformation?.isLoadingNews}
                    key={id}
                    onClick={() => {
                      setNewsFilter(id);
                      marketInformation?.onNewsPageChange(0, id);
                    }}
                    role="tab"
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
            className="design-market-information-news"
            subtitle={[
              newsSnapshot?.symbol,
              `${visibleNews.length} 条`,
              `第 ${visibleNewsPage} 页`,
            ].filter(Boolean).join(" · ")}
            title="新闻资讯"
          >
            {visibleNews.length ? (
              <div className="design-market-information-news-list">
                {visibleNews.map((item) => {
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
            ) : marketInformation?.isLoadingNews ? (
              <p className="design-market-information-state" role="status">正在加载新闻…</p>
            ) : (
              <EmptyState detail="当前筛选范围内没有可展示的资讯。" title="暂无资讯" />
            )}
            {pagination && newsMatchesFilter ? (
              <nav
                aria-busy={marketInformation?.isLoadingNews}
                aria-label="新闻分页"
                className="design-market-information-pagination"
              >
                <span aria-live="polite">
                  {marketInformation?.isLoadingNews
                    ? "正在加载新闻…"
                    : `第 ${visibleNewsPage} 页 · 本页 ${visibleNews.length} 条`}
                </span>
                <button
                  disabled={marketInformation?.isLoadingNews || pagination.offset === 0}
                  onClick={() => marketInformation?.onNewsPageChange(
                    Math.max(0, pagination.offset - pagination.limit),
                    newsFilter,
                  )}
                  type="button"
                >
                  上一页
                </button>
                <button
                  disabled={marketInformation?.isLoadingNews || !pagination.hasMore}
                  onClick={() => marketInformation?.onNewsPageChange(
                    pagination.offset + pagination.limit,
                    newsFilter,
                  )}
                  type="button"
                >
                  下一页
                </button>
              </nav>
            ) : null}
          </SurfacePanel>
          {newsOnlySnapshot && newsSnapshot?.warnings.length ? (
            <ul className="design-market-screener-warnings design-market-information-news-warnings">
              {newsSnapshot.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
