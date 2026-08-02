import { formatChartDate } from "../../../components/AiReviewAuditBoards";
import { KlineChartCanvas } from "../../research/ChartComponents";
import { X } from "lucide-react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

export type ExpandedChartDialogViewModel = Pick<AppControllerBindings,
    "closeExpandedChart" | "colorScheme" | "i18n" | "isChartExpanded" | "klinesState" | "latestChartBar" | "loadHistoricalKlines" | "locale" | "source" | "workspace"
  >;

type ExpandedChartDialogProps = { controller: ExpandedChartDialogViewModel };

export function ExpandedChartDialog({ controller }: ExpandedChartDialogProps) {
  const {
    closeExpandedChart, colorScheme, i18n, isChartExpanded, klinesState, latestChartBar,
    loadHistoricalKlines, locale, source, workspace
  } = controller;
  return (
    isChartExpanded ? (
            <div className="chart-modal-backdrop" role="dialog" aria-modal="true" aria-label={i18n.t("panel.chart.title")}>
              <section className="chart-modal">
                <header>
                  <div>
                    <h2>{workspace.selectedInstrument.name} · {klinesState.symbol}</h2>
                    <span>{workspace.selectedTimeframe} · {i18n.t("panel.chart.title")}</span>
                  </div>
                  <button
                    aria-label={i18n.t("chart.closeExpanded")}
                    className="panel-icon-button"
                    onClick={closeExpandedChart}
                    title={i18n.t("chart.closeExpanded")}
                    type="button"
                  >
                    <X size={17} />
                  </button>
                </header>
                <div className="chart-modal-body">
                  <KlineChartCanvas
                    key={`expanded-${klinesState.market}-${klinesState.symbol}-${klinesState.timeframe}`}
                    bars={klinesState.bars}
                    colorScheme={colorScheme}
                    locale={locale}
                    market={klinesState.market}
                    onLoadHistorical={loadHistoricalKlines}
                    symbol={klinesState.symbol}
                    timeframe={klinesState.timeframe}
                  />
                  <div className="chart-data-strip">
                    <span>{i18n.t("chart.symbol")}: {klinesState.symbol}</span>
                    {latestChartBar ? <span>{i18n.t("chart.latestClose")}: {latestChartBar.close.toFixed(2)}</span> : null}
                    {latestChartBar ? <span>{i18n.t("chart.asOf")}: {formatChartDate(latestChartBar.timestamp)}</span> : null}
                    <span>{i18n.t("chart.source")}: {klinesState.quality.source}</span>
                    <span>{i18n.t("chart.bars", { count: klinesState.bars.length })}</span>
                  </div>
                </div>
              </section>
            </div>
          ) : null
  );
}
