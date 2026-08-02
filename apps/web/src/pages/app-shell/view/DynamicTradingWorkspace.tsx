import { ExecutionAutoPaperTradingSection } from "../../dynamic-trading/ExecutionAutoPaperTradingSection";
import { ChartDataStrip, KlineChartCanvas } from "../../research/ChartComponents";
import { quantCoreBaseUrl } from "../initial-state";
import type { AppControllerBindings } from "../controller/bindings";

export type DynamicTradingWorkspaceViewModel = Pick<AppControllerBindings,
    "activeWorkAreaId" | "automatedTradingGuide" | "colorScheme" | "i18n" | "klinesState" | "latestChartBar" | "loadHistoricalKlines" | "locale" | "selectInstrument" | "selectProductWorkArea" | "syncExecutionSafety" | "updateAutoTradingSnapshot" | "workspace"
  >;

type DynamicTradingWorkspaceProps = { controller: DynamicTradingWorkspaceViewModel };

export function DynamicTradingWorkspace({ controller }: DynamicTradingWorkspaceProps) {
  const {
    activeWorkAreaId, automatedTradingGuide, colorScheme, i18n, klinesState,
    latestChartBar, loadHistoricalKlines, locale, selectInstrument, selectProductWorkArea,
    syncExecutionSafety, updateAutoTradingSnapshot, workspace
  } = controller;
  return (
    activeWorkAreaId === "dynamic-trading" ? (
              <ExecutionAutoPaperTradingSection
                baseUrl={quantCoreBaseUrl}
                chart={
                  <>
                    <KlineChartCanvas
                      key={`dynamic-trading-${workspace.selectedInstrument.market}-${workspace.selectedInstrument.symbol}-${workspace.selectedTimeframe}`}
                      bars={klinesState.bars}
                      colorScheme={colorScheme}
                      locale={locale}
                      market={klinesState.market}
                      onLoadHistorical={loadHistoricalKlines}
                      symbol={klinesState.symbol}
                      timeframe={klinesState.timeframe}
                    />
                    <ChartDataStrip i18n={i18n} latestChartBar={latestChartBar} state={klinesState} />
                  </>
                }
                instruments={workspace.watchlist}
                onOpenAudit={() => selectProductWorkArea("audit")}
                onOpenExecution={() => selectProductWorkArea("execution")}
                onSafetyChange={syncExecutionSafety}
                onSnapshotChange={updateAutoTradingSnapshot}
                onSelectInstrument={(instrument) => selectInstrument(instrument, "dynamic-trading")}
                selectedSymbol={workspace.selectedInstrument.symbol}
                variant="workspace"
                workflowGuide={automatedTradingGuide}
              />
            ) : null
  );
}
