import { formatChartDate } from "../../components/AiReviewAuditBoards";
import { Locale, type AppI18n } from "../../lib/i18n";
import { MarketKlinesResult } from "../../lib/terminal-api";
import { Market, Timeframe } from "../../lib/terminal-workbench";
import { type ColorScheme } from "../../lib/theme";
import { ActionType, LoadDataType, dispose, init, type Chart, type KLineData } from "klinecharts";
import { useEffect, useRef } from "react";

export const chartKlineLimit = 500;

const chartRightBoundaryDistance = 0;

export function ChartDataStrip({
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

export function KlineChartCanvas({
  bars,
  colorScheme,
  locale,
  market,
  onLoadHistorical,
  symbol,
  timeframe
}: {
  bars: MarketKlinesResult["bars"];
  colorScheme: ColorScheme;
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
      styles: colorScheme,
      timezone: "Asia/Shanghai"
    });
    chartRef.current = chart;
    chart?.setPriceVolumePrecision(4, 2);
    chart?.setMaxOffsetRightDistance(chartRightBoundaryDistance);
    chart?.setOffsetRightDistance(chartRightBoundaryDistance);
    chart?.setRightMinVisibleBarCount(2);
    chart?.createIndicator("VOL", false, { height: 72, minHeight: 48 });
    chart?.createIndicator("MACD", false, { height: 68, minHeight: 46 });
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
    chartRef.current?.setStyles(colorScheme);
  }, [colorScheme]);

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

export function toKlineChartData(bars: MarketKlinesResult["bars"]): KLineData[] {
  return bars.map((bar) => ({
    timestamp: bar.timestampMs,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume
  }));
}
