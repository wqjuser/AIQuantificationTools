import { formatChartDate } from "../../components/AiReviewAuditBoards";
import { type AppI18n } from "../../lib/i18n";
import { MarketSearchSuggestion, PlatformSettingsStatus } from "../../lib/terminal-api";
import { TerminalWorkspace, buildMarketDataProviderHealthTrendSummary } from "../../lib/terminal-workbench";

export interface WatchlistCacheSummary {
  total: number;
  fresh: number;
  stale: number;
  empty: number;
  rows: number;
}

export function settingsStatusLabel(i18n: AppI18n, status: PlatformSettingsStatus["dataSources"][number]["status"]): string {
  if (i18n.locale === "en-US") {
    return status.replaceAll("_", " ");
  }
  return {
    ready: "就绪",
    degraded: "降级",
    blocked: "阻断",
    config_required: "需配置",
    interface_only: "仅接口",
    paper_ready: "模拟可用"
  }[status];
}

export function settingsKeyStatusLabel(i18n: AppI18n, keyName: string | null, isConfigured: boolean): string {
  if (!keyName) {
    return i18n.locale === "zh-CN" ? "无需 Key" : "No key required";
  }
  if (isConfigured) {
    return i18n.locale === "zh-CN" ? `${keyName} 已配置` : `${keyName} configured`;
  }
  return i18n.locale === "zh-CN" ? `${keyName} 未配置` : `${keyName} not configured`;
}

export function marketDataAdapterCacheDiagnosticsLabel(
  i18n: AppI18n,
  diagnostics: PlatformSettingsStatus["marketDataAdapters"][number]["cacheDiagnostics"]
): string {
  if (diagnostics.freshness === "empty") {
    return i18n.locale === "zh-CN"
      ? `无缓存 · ${diagnostics.contextCount.toLocaleString("zh-CN")} 上下文`
      : `No cache · ${diagnostics.contextCount.toLocaleString("en-US")} contexts`;
  }
  const freshness =
    diagnostics.freshness === "fresh"
      ? i18n.locale === "zh-CN"
        ? "新鲜"
        : "Fresh"
      : i18n.locale === "zh-CN"
        ? "过期"
        : "Stale";
  const rows =
    i18n.locale === "zh-CN"
      ? `${diagnostics.rowCount.toLocaleString("zh-CN")} 行`
      : `${diagnostics.rowCount.toLocaleString("en-US")} rows`;
  const contexts =
    i18n.locale === "zh-CN"
      ? `${diagnostics.contextCount.toLocaleString("zh-CN")} 上下文`
      : `${diagnostics.contextCount.toLocaleString("en-US")} contexts`;
  return `${freshness} · ${rows} · ${contexts}`;
}

export function marketDataAdapterExternalTelemetryLabel(
  i18n: AppI18n,
  telemetry: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]
): string {
  if (telemetry.status === "ok") {
    return i18n.locale === "zh-CN"
      ? `依赖可用 · ${telemetry.dependency} · ${telemetry.retryState}`
      : `Dependency ready · ${telemetry.dependency} · ${telemetry.retryState}`;
  }
  if (telemetry.status === "degraded") {
    return i18n.locale === "zh-CN"
      ? `外部源降级 · ${telemetry.dependency} · ${telemetry.retryState}`
      : `Provider degraded · ${telemetry.dependency} · ${telemetry.retryState}`;
  }
  if (telemetry.retryState === "dependency_missing") {
    return i18n.locale === "zh-CN"
      ? `依赖缺失 · ${telemetry.dependency}`
      : `Dependency missing · ${telemetry.dependency}`;
  }
  return i18n.locale === "zh-CN"
    ? `外部源未知 · ${telemetry.dependency}`
    : `External source unknown · ${telemetry.dependency}`;
}

export function marketDataAdapterInstallGuidanceLabel(
  i18n: AppI18n,
  guidance: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["installGuidance"]
): string {
  if (i18n.locale === "zh-CN") {
    return `安装建议 · Docker ${guidance.dockerBuildArg} · ${guidance.packageInstallCommand}`;
  }
  return `Install · Docker ${guidance.dockerBuildArg} · ${guidance.packageInstallCommand}`;
}

export function providerHealthTrendMomentumLabel(
  i18n: AppI18n,
  momentum: ReturnType<typeof buildMarketDataProviderHealthTrendSummary>["momentum"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        quiet: "Quiet",
        historical_only: "Historical only",
        easing: "Easing",
        active_errors: "Active errors",
        recent_spike: "Recent spike",
        cooldown_pressure: "Cooldown pressure"
      }[momentum] ?? momentum
    );
  }
  return (
    {
      quiet: "安静",
      historical_only: "仅历史错误",
      easing: "正在缓和",
      active_errors: "仍有错误",
      recent_spike: "近期抬升",
      cooldown_pressure: "冷却压力"
    }[momentum] ?? momentum
  );
}

export function providerHealthTrendWindowLabel(i18n: AppI18n, windowId: string): string {
  if (i18n.locale === "en-US") {
    return (
      {
        oneHour: "1h",
        twentyFourHours: "24h",
        sevenDays: "7d"
      }[windowId] ?? windowId
    );
  }
  return (
    {
      oneHour: "1小时",
      twentyFourHours: "24小时",
      sevenDays: "7天"
    }[windowId] ?? windowId
  );
}

export function providerHealthTrendLatestLabel(i18n: AppI18n, latestErrorAt: string | null): string {
  if (!latestErrorAt) {
    return i18n.locale === "zh-CN" ? "无最近错误" : "No latest error";
  }
  return i18n.locale === "zh-CN" ? `最新 ${formatChartDate(latestErrorAt)}` : `Latest ${formatChartDate(latestErrorAt)}`;
}

export function providerHealthTrendCategoryLabel(i18n: AppI18n, category: string | null): string {
  if (!category) {
    return i18n.locale === "zh-CN" ? "无主因" : "none";
  }
  const labels: Record<string, { zh: string; en: string }> = {
    rate_limit: { zh: "限流", en: "Rate limit" },
    dependency: { zh: "依赖", en: "Dependency" },
    network: { zh: "网络", en: "Network" },
    upstream: { zh: "上游", en: "Upstream" },
    incomplete_data: { zh: "数据不完整", en: "Incomplete data" },
    unknown: { zh: "未知", en: "Unknown" }
  };
  const label = labels[category] ?? { zh: category, en: category };
  return i18n.locale === "zh-CN" ? label.zh : label.en;
}

export function marketDataAdapterProviderHealthLabel(
  i18n: AppI18n,
  health: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["providerHealth"]
): string {
  const statusLabel = marketDataAdapterProviderHealthStatusLabel(i18n, health.status);
  const categoryLabel = marketDataAdapterProviderHealthCategoryLabel(i18n, health.dominantCategory);
  const trendLabel = marketDataAdapterProviderHealthWindowSummaryLabel(i18n, health.windowSummary);
  const affected =
    health.affectedSymbols.length > 0
      ? health.affectedSymbols.slice(0, 3).join("/")
      : i18n.locale === "zh-CN"
        ? "无"
        : "none";
  const backoff =
    health.retryAfterSeconds > 0
      ? i18n.locale === "zh-CN"
        ? `${health.retryAfterSeconds} 秒`
        : `${health.retryAfterSeconds}s`
      : i18n.locale === "zh-CN"
        ? "无"
        : "none";
  return i18n.locale === "zh-CN"
    ? `健康 · ${statusLabel} · 错误 ${health.recentErrorCount} · 主因 ${categoryLabel} · 影响 ${affected} · ${trendLabel} · 建议退避 ${backoff}`
    : `Provider health · ${statusLabel} · errors ${health.recentErrorCount} · Primary ${categoryLabel} · affected ${affected} · ${trendLabel} · Backoff ${backoff}`;
}

export function marketDataAdapterProviderHealthWindowSummaryLabel(
  i18n: AppI18n,
  windowSummary: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["providerHealth"]["windowSummary"]
): string {
  const trend = `${windowSummary.oneHour.errorCount}/${windowSummary.twentyFourHours.errorCount}/${windowSummary.sevenDays.errorCount}`;
  return i18n.locale === "zh-CN" ? `趋势 1h/24h/7d ${trend}` : `Trend 1h/24h/7d ${trend}`;
}

export function marketDataAdapterProviderHealthStatusLabel(
  i18n: AppI18n,
  status: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["providerHealth"]["status"]
): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return (
    {
      ok: "正常",
      watch: "观察",
      cooldown: "冷却",
      blocked: "阻断"
    }[status] ?? status
  );
}

export function marketDataAdapterProviderHealthCategoryLabel(
  i18n: AppI18n,
  category: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["providerHealth"]["dominantCategory"]
): string {
  if (category === null) {
    return i18n.locale === "zh-CN" ? "无" : "none";
  }
  return marketDataAdapterProviderErrorCategoryLabel(i18n, category);
}

export function marketDataAdapterProviderErrorLabel(
  i18n: AppI18n,
  error: NonNullable<PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["lastProviderError"]>
): string {
  const target = `${error.market.toUpperCase()} ${error.symbol} ${error.timeframe}`;
  const category = marketDataAdapterProviderErrorCategoryLabel(i18n, error.category);
  return i18n.locale === "zh-CN"
    ? `最近错误 · ${category} · ${error.source} · ${error.context} · ${target} · ${error.message}`
    : `Latest error · ${category} · ${error.source} · ${error.context} · ${target} · ${error.message}`;
}

export function marketDataAdapterProviderErrorCategoryLabel(
  i18n: AppI18n,
  category: NonNullable<
    PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["lastProviderError"]
  >["category"]
): string {
  const labels = {
    rate_limit: { zh: "限流", en: "Rate limit" },
    dependency: { zh: "依赖", en: "Dependency" },
    network: { zh: "网络", en: "Network" },
    upstream: { zh: "上游", en: "Upstream" },
    incomplete_data: { zh: "数据不完整", en: "Incomplete data" },
    unknown: { zh: "未知", en: "Unknown" }
  } satisfies Record<typeof category, { zh: string; en: string }>;
  const label = labels[category] ?? labels.unknown;
  return i18n.locale === "zh-CN" ? label.zh : label.en;
}

export function marketSearchCacheSummary(i18n: AppI18n, cache: NonNullable<MarketSearchSuggestion["cache"]>): string {
  if (cache.freshness === "empty") {
    return i18n.locale === "zh-CN" ? "当前周期无缓存" : "No cache for this timeframe";
  }
  const rowsLabel =
    i18n.locale === "zh-CN"
      ? `${cache.rowCount.toLocaleString("zh-CN")} 行`
      : `${cache.rowCount.toLocaleString("en-US")} rows`;
  if (cache.freshness === "stale") {
    const status = i18n.locale === "zh-CN" ? "历史数据" : "Historical data";
    const endLabel = cache.endTimestamp ? formatChartDate(cache.endTimestamp) : "n/a";
    return i18n.locale === "zh-CN"
      ? `${status} · 截至 ${endLabel} · ${rowsLabel}`
      : `${status} · through ${endLabel} · ${rowsLabel}`;
  }
  const status = i18n.locale === "zh-CN" ? "新鲜" : "Fresh";
  const endLabel = cache.endTimestamp ? formatChartDate(cache.endTimestamp) : "n/a";
  return i18n.locale === "zh-CN"
    ? `${status} · 更新至 ${endLabel} · ${rowsLabel}`
    : `${status} · updated through ${endLabel} · ${rowsLabel}`;
}

export function canRefreshSearchSuggestionCache(suggestion: MarketSearchSuggestion): boolean {
  return Boolean(suggestion.cache && suggestion.cache.freshness !== "fresh");
}

export function marketSearchRefreshLabel(i18n: AppI18n, suggestion: MarketSearchSuggestion): string {
  if (suggestion.cache?.freshness === "stale") {
    return i18n.locale === "zh-CN" ? "更新" : "Update";
  }
  return i18n.locale === "zh-CN" ? "获取" : "Fetch";
}

export function cacheFreshnessLabel(
  i18n: AppI18n,
  freshness: PlatformSettingsStatus["cache"]["contexts"][number]["freshness"],
  ageHours: number | null
): string {
  if (freshness === "empty") {
    return i18n.locale === "zh-CN" ? "无缓存数据" : "No cached data";
  }
  const ageLabel =
    ageHours === null
      ? "n/a"
      : i18n.locale === "zh-CN"
        ? `${ageHours.toLocaleString("zh-CN")} 小时`
        : `${ageHours.toLocaleString("en-US")}h`;
  if (freshness === "fresh") {
    return i18n.locale === "zh-CN" ? `新鲜 · ${ageLabel}` : `Fresh · ${ageLabel}`;
  }
  return i18n.locale === "zh-CN" ? `过期 · ${ageLabel}` : `Stale · ${ageLabel}`;
}

export function buildWatchlistCacheSummary(
  settings: PlatformSettingsStatus | undefined,
  workspace: TerminalWorkspace
): WatchlistCacheSummary {
  return workspace.watchlist.reduce<WatchlistCacheSummary>(
    (summary, instrument) => {
      const context = settings?.cache.contexts.find(
        (item) =>
          item.market === instrument.market &&
          item.symbol === instrument.symbol &&
          item.timeframe === workspace.selectedTimeframe
      );
      const freshness = context?.freshness ?? "empty";
      summary.total += 1;
      summary.rows += context?.rowCount ?? 0;
      if (freshness === "fresh") {
        summary.fresh += 1;
      } else if (freshness === "stale") {
        summary.stale += 1;
      } else {
        summary.empty += 1;
      }
      return summary;
    },
    { total: 0, fresh: 0, stale: 0, empty: 0, rows: 0 }
  );
}

export function cacheContextKey(
  context: Pick<PlatformSettingsStatus["cache"]["contexts"][number], "market" | "symbol" | "timeframe">
): string {
  return `${context.market}:${context.symbol}:${context.timeframe}`;
}
