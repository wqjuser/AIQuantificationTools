import { AiResearchM4Section } from "../../../components/AiResearchM4Section";
import { TerminalWorkspaceSurface } from "../../../components/TerminalWorkspaceSurface";
import { portfolioBacktestSummary } from "../../portfolio/PortfolioFormatters";
import { ChartDataStrip, KlineChartCanvas } from "../../research/ChartComponents";
import { strategyProductionBindingErrorLabel } from "../../strategy/StrategyFormatters";
import { quantCoreBaseUrl } from "../initial-state";
import type { AppControllerBindings } from "../controller/bindings";

export type WorkspaceHostViewModel = Pick<AppControllerBindings,
    "activeWorkAreaId" | "activeWorkspaceSurfaceRef" | "aiReviewStage3ComparisonExperimentIds" | "aiReviewStage3CurrentReview" | "aiReviewStage3DecisionDraft" | "aiReviewStage3Decisions" | "aiReviewStage3Error" | "aiReviewStage3Experiments" | "aiReviewStage3ExternalDataApproved" | "aiReviewStage3History" | "aiReviewStage3PrimaryCandidateAvailable" | "aiReviewStage3PrimaryExperimentId" | "aiReviewStage3PrimaryReference" | "aiReviewStage3ProviderId" | "aiReviewStage3Providers" | "appendAiReviewStage3Decision" | "approveAiReviewStage3ExternalData" | "approvePortfolioPaperOrder" | "approveResearchNoteExternalData" | "approvingPortfolioPaperOrderId" | "autoTradingSnapshot" | "automatedTradingGuide" | "bindStrategyToProduction" | "bindingStrategyRevision" | "colorScheme" | "configureStrategyExperimentWalkForward" | "currentResearchRunId" | "editResearchNoteDraft" | "error" | "executionAcceptanceAuditPanel" | "executionReadinessStack" | "generateCurrentResearchNoteDraft" | "hasLoadedSettingsStatus" | "i18n" | "installSettingsDataDependency" | "installingDataDependency" | "isAppendingAiReviewStage3Decision" | "isGeneratingResearchNoteDraft" | "isLoadingAiReviewStage3" | "isLoadingMarketAiSelection" | "isLoadingMarketAiSelectionReview" | "isLoadingMarketAiSelectionStatistics" | "isLoadingMarketDiscovery" | "isLoadingMarketInformation" | "isLoadingMarketInformationNews" | "isLoadingPortfolioProductionRisk" | "isResearchWorkspaceSaved" | "isRunningAiReviewStage3" | "isRunningPortfolioRiskAssessment" | "isSavingResearchNote" | "isSavingResearchWorkspace" | "isSavingSettingsConfiguration" | "isSavingWatchlist" | "isStrategyExperimentRunning" | "isTestingMonitoringWebhook" | "klinesState" | "latestChartBar" | "latestWatchlistCacheRefresh" | "loadHistoricalKlines" | "loadSettingsOpenAiCompatibleModels" | "loadStrategyExperimentCandidate" | "locale" | "marketAiSelection" | "marketAiSelectionRequestKey" | "marketAiSelectionReview" | "marketAiSelectionStatistics" | "marketCalendarState" | "marketDiscoveryResult" | "marketInformationMarket" | "marketInformationNewsResult" | "marketInformationResult" | "marketInformationSymbol" | "marketRefreshIssue" | "pendingMarketAiSelectionResearchOrigin" | "portfolioBacktestState" | "portfolioPaperOrderApprovalRows" | "portfolioPaperOrderHistoryError" | "portfolioProductionRiskError" | "portfolioRiskAssessment" | "portfolioRiskAssessmentError" | "portfolioStage4GoldenPath" | "portfolioStage4LatestBatch" | "portfolioStage4Workflow" | "productionStrategyHandoffState" | "refreshMarketAiSelectionStatistics" | "refreshMarketInformation" | "refreshMarketInformationNews" | "refreshPortfolioProductionRisk" | "rejectPortfolioPaperOrder" | "rememberActiveWorkspaceScrollPosition" | "removeWatchlistInstrument" | "renderStrategyWorkbench" | "reportAiReviewContextError" | "researchMarketAiSelectionCandidate" | "researchNoteDraft" | "researchNoteExternalDataApproved" | "researchNoteGenerationError" | "researchNoteGenerationStatus" | "researchNoteProviderId" | "researchNoteProviders" | "researchNoteState" | "runHistory" | "runMarketAiSelection" | "runMarketAiSelectionReview" | "runPortfolioRiskAssessment" | "saveCurrentResearchNote" | "saveCurrentResearchWorkspace" | "saveCurrentWatchlist" | "saveSettingsConfiguration" | "searchMarketDiscovery" | "selectAiReviewStage3Provider" | "selectInstrument" | "selectMarketInformationMarket" | "selectProductWorkArea" | "selectResearchNoteProvider" | "selectTimeframe" | "settingsConfigurationMessage" | "settingsStatus" | "source" | "strategyExperimentError" | "strategyExperimentWalkForward" | "strategyProductionBindingState" | "terminalBrokerAdapterRows" | "terminalExecutionAdapterChainHealthRollups" | "terminalExecutionAdapterHealthProbeRows" | "terminalExecutionAdapterLedgerRows" | "terminalSurfaceDisplayAction" | "testSettingsMonitoringWebhook" | "toggleAiReviewStage3Comparison" | "updateAiReviewStage3DecisionDraft" | "updateSettingsConfigurationDirty" | "visibleStrategyExperimentActive" | "visibleStrategyExperimentHistory" | "workspace"
  >;

type WorkspaceHostProps = { controller: WorkspaceHostViewModel };

export function WorkspaceHost({ controller }: WorkspaceHostProps) {
  const {
    activeWorkAreaId, activeWorkspaceSurfaceRef, aiReviewStage3ComparisonExperimentIds, aiReviewStage3CurrentReview, aiReviewStage3DecisionDraft,
    aiReviewStage3Decisions, aiReviewStage3Error, aiReviewStage3Experiments, aiReviewStage3ExternalDataApproved, aiReviewStage3History,
    aiReviewStage3PrimaryCandidateAvailable, aiReviewStage3PrimaryExperimentId, aiReviewStage3PrimaryReference, aiReviewStage3ProviderId, aiReviewStage3Providers,
    appendAiReviewStage3Decision, approveAiReviewStage3ExternalData, approvePortfolioPaperOrder, approveResearchNoteExternalData, approvingPortfolioPaperOrderId, autoTradingSnapshot,
    automatedTradingGuide, bindStrategyToProduction, bindingStrategyRevision, colorScheme, configureStrategyExperimentWalkForward,
    currentResearchRunId, editResearchNoteDraft, error, executionAcceptanceAuditPanel, executionReadinessStack,
    generateCurrentResearchNoteDraft, hasLoadedSettingsStatus, i18n, installSettingsDataDependency, installingDataDependency,
    isAppendingAiReviewStage3Decision, isGeneratingResearchNoteDraft, isLoadingAiReviewStage3, isLoadingMarketAiSelection, isLoadingMarketAiSelectionReview,
    isLoadingMarketAiSelectionStatistics, isLoadingMarketDiscovery, isLoadingMarketInformation, isLoadingMarketInformationNews, isLoadingPortfolioProductionRisk,
    isResearchWorkspaceSaved, isRunningAiReviewStage3, isRunningPortfolioRiskAssessment, isSavingResearchNote, isSavingResearchWorkspace,
    isSavingSettingsConfiguration, isSavingWatchlist, isStrategyExperimentRunning, isTestingMonitoringWebhook, klinesState,
    latestChartBar, latestWatchlistCacheRefresh, loadHistoricalKlines, loadSettingsOpenAiCompatibleModels, loadStrategyExperimentCandidate,
    locale, marketAiSelection, marketAiSelectionRequestKey, marketAiSelectionReview, marketAiSelectionStatistics,
    marketCalendarState, marketDiscoveryResult, marketInformationMarket, marketInformationNewsResult, marketInformationResult,
    marketInformationSymbol, marketRefreshIssue, pendingMarketAiSelectionResearchOrigin, portfolioBacktestState, portfolioPaperOrderApprovalRows,
    portfolioPaperOrderHistoryError, portfolioProductionRiskError, portfolioRiskAssessment, portfolioRiskAssessmentError, portfolioStage4GoldenPath,
    portfolioStage4LatestBatch, portfolioStage4Workflow, productionStrategyHandoffState, refreshMarketAiSelectionStatistics, refreshMarketInformation,
    refreshMarketInformationNews, refreshPortfolioProductionRisk, rejectPortfolioPaperOrder, rememberActiveWorkspaceScrollPosition, removeWatchlistInstrument,
    renderStrategyWorkbench, reportAiReviewContextError, researchMarketAiSelectionCandidate, researchNoteDraft, researchNoteExternalDataApproved, researchNoteGenerationError,
    researchNoteGenerationStatus, researchNoteProviderId, researchNoteProviders, researchNoteState, runHistory,
    runMarketAiSelection, runMarketAiSelectionReview, runPortfolioRiskAssessment, saveCurrentResearchNote, saveCurrentResearchWorkspace,
    saveCurrentWatchlist, saveSettingsConfiguration, searchMarketDiscovery, selectAiReviewStage3Provider, selectInstrument,
    selectMarketInformationMarket, selectProductWorkArea, selectResearchNoteProvider, selectTimeframe, settingsConfigurationMessage,
    settingsStatus, source, strategyExperimentError, strategyExperimentWalkForward, strategyProductionBindingState,
    terminalBrokerAdapterRows, terminalExecutionAdapterChainHealthRollups, terminalExecutionAdapterHealthProbeRows, terminalExecutionAdapterLedgerRows, terminalSurfaceDisplayAction,
    testSettingsMonitoringWebhook, toggleAiReviewStage3Comparison, updateAiReviewStage3DecisionDraft, updateSettingsConfigurationDirty, visibleStrategyExperimentActive, visibleStrategyExperimentHistory,
    workspace
  } = controller;
  return (
    activeWorkAreaId === "dynamic-trading" || !terminalSurfaceDisplayAction ? null : (
            <TerminalWorkspaceSurface
              action={terminalSurfaceDisplayAction}
              activeWorkAreaId={activeWorkAreaId}
              adapterChainHealthRollups={terminalExecutionAdapterChainHealthRollups}
              adapterHealthProbeRows={terminalExecutionAdapterHealthProbeRows}
              adapterLedgerRows={terminalExecutionAdapterLedgerRows}
              adapterRows={terminalBrokerAdapterRows}
              isLoadingSettingsConfiguration={!hasLoadedSettingsStatus}
              isSavingSettingsConfiguration={isSavingSettingsConfiguration}
              isTestingMonitoringWebhook={isTestingMonitoringWebhook}
              installingDataDependency={installingDataDependency}
              onLoadOpenAiCompatibleModels={loadSettingsOpenAiCompatibleModels}
              onInstallDataDependency={(dependency) => void installSettingsDataDependency(dependency)}
              onSaveSettingsConfiguration={saveSettingsConfiguration}
              onSettingsConfigurationDirtyChange={updateSettingsConfigurationDirty}
              onTestMonitoringWebhook={() => void testSettingsMonitoringWebhook()}
              settings={settingsStatus.settings}
              settingsConfigurationMessage={settingsConfigurationMessage}
              aiReview={{
                appendingDecision: isAppendingAiReviewStage3Decision,
                busy: isLoadingAiReviewStage3 || isRunningAiReviewStage3
                  || isAppendingAiReviewStage3Decision || isStrategyExperimentRunning,
                running: isRunningAiReviewStage3 || isStrategyExperimentRunning,
                comparisonExperimentIds: aiReviewStage3ComparisonExperimentIds,
                currentReview: aiReviewStage3CurrentReview,
                decisionDraft: aiReviewStage3DecisionDraft,
                decisions: aiReviewStage3Decisions,
                error: aiReviewStage3Error ?? strategyExperimentError,
                experiments: aiReviewStage3Experiments,
                externalDataApproved: aiReviewStage3ExternalDataApproved,
                history: aiReviewStage3History,
                onAppendDecision: () => void appendAiReviewStage3Decision(),
                onComparisonToggle: toggleAiReviewStage3Comparison,
                onDecisionDraftChange: updateAiReviewStage3DecisionDraft,
                onExternalDataApprovedChange: approveAiReviewStage3ExternalData,
                onOpenProductionHandoff: () => selectProductWorkArea("backtest"),
                onProviderChange: selectAiReviewStage3Provider,
                onStagePrimaryCandidate: () => {
                  if (
                    !aiReviewStage3PrimaryCandidateAvailable
                    || !aiReviewStage3PrimaryReference
                  ) {
                    reportAiReviewContextError("当前评审候选与已载入实验不一致，请先恢复完整评审上下文。");
                    return;
                  }
                  void loadStrategyExperimentCandidate(
                    aiReviewStage3PrimaryReference.selectedCandidateId
                  );
                },
                primaryExperimentId: aiReviewStage3PrimaryExperimentId,
                primaryCandidateAvailable: aiReviewStage3PrimaryCandidateAvailable,
                providerId: aiReviewStage3ProviderId,
                providers: aiReviewStage3Providers,
                researchLoop: (
                  <AiResearchM4Section
                    baseUrl={quantCoreBaseUrl}
                    currentReview={isRunningAiReviewStage3 || isStrategyExperimentRunning
                      ? null
                      : aiReviewStage3CurrentReview}
                    i18n={i18n}
                    runHistory={runHistory}
                  />
                )
              }}
              chart={
                <>
                  <KlineChartCanvas
                    key={`surface-${workspace.selectedInstrument.market}-${workspace.selectedInstrument.symbol}-${workspace.selectedTimeframe}`}
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
              colorScheme={colorScheme}
              executionAcceptanceAudit={executionAcceptanceAuditPanel}
              executionReadiness={executionReadinessStack}
              executionSnapshot={autoTradingSnapshot}
              isSavingWatchlist={isSavingWatchlist}
              latestWatchlistCacheRefresh={latestWatchlistCacheRefresh}
              marketCalendar={marketCalendarState.calendar}
              marketDiscovery={{
                isLoading: isLoadingMarketDiscovery,
                onSearch: (params) => void searchMarketDiscovery(params),
                result: marketDiscoveryResult,
              }}
              marketAiSelection={{
                error: marketAiSelection.error,
                isLoading: isLoadingMarketAiSelection,
                onResearchInstrument: researchMarketAiSelectionCandidate,
                onRun: (request, requestKey) =>
                  void runMarketAiSelection(request, requestKey),
                onViewInstrument: (instrument) =>
                  selectInstrument(instrument, "market", false),
                requestKey: marketAiSelectionRequestKey,
                result: marketAiSelection.selection ?? null,
                review: {
                  error: marketAiSelectionReview.error,
                  isLoading: isLoadingMarketAiSelectionReview,
                  onRun: (request) => void runMarketAiSelectionReview(request),
                  result: marketAiSelectionReview.review ?? null,
                },
                statistics: {
                  error: marketAiSelectionStatistics.error,
                  isLoading: isLoadingMarketAiSelectionStatistics,
                  onRefresh: () => void refreshMarketAiSelectionStatistics(),
                  result: marketAiSelectionStatistics.statistics ?? null,
                },
              }}
              marketAiSelectionResearchOrigin={
                pendingMarketAiSelectionResearchOrigin
                && pendingMarketAiSelectionResearchOrigin.market === workspace.selectedInstrument.market
                && pendingMarketAiSelectionResearchOrigin.symbol === workspace.selectedInstrument.symbol
                && workspace.selectedTimeframe === "1d"
                  ? pendingMarketAiSelectionResearchOrigin
                  : null
              }
              marketInformation={{
                isLoading: isLoadingMarketInformation,
                isLoadingNews: isLoadingMarketInformationNews,
                market: marketInformationMarket,
                newsResult: marketInformationNewsResult,
                onMarketChange: selectMarketInformationMarket,
                onNewsPageChange: (offset, scope) =>
                  void refreshMarketInformationNews(offset, scope),
                onRefresh: () => void refreshMarketInformation(),
                result: marketInformationResult,
                symbol: marketInformationSymbol,
              }}
              marketRefreshIssue={marketRefreshIssue}
              onApprovePortfolioOrder={approvePortfolioPaperOrder}
              onRemoveWatchlistInstrument={(instrument) => void removeWatchlistInstrument(instrument)}
              onRejectPortfolioOrder={rejectPortfolioPaperOrder}
              onSaveWatchlist={() => void saveCurrentWatchlist()}
              onOpenMarketInformation={() => selectProductWorkArea("market-information")}
              onScrollPositionChange={rememberActiveWorkspaceScrollPosition}
              onSelectInstrument={(instrument) => selectInstrument(instrument, "market")}
              onResearchInstrument={(instrument) => selectInstrument(instrument, "research")}
              onSelectTimeframe={(timeframe) => selectTimeframe(timeframe, "market")}
              approvingPortfolioOrderId={approvingPortfolioPaperOrderId}
              portfolio={portfolioBacktestState.portfolio ?? null}
              portfolioActionError={
                portfolioBacktestState.error
                  ? portfolioBacktestSummary(i18n, portfolioBacktestState.error)
                  : portfolioRiskAssessmentError ?? portfolioPaperOrderHistoryError
              }
              portfolioGoldenPath={portfolioStage4GoldenPath}
              portfolioPaperOrderApprovalRows={portfolioPaperOrderApprovalRows.filter(
                (row) =>
                  row.baseRunId === currentResearchRunId &&
                  row.batchId === portfolioStage4LatestBatch?.batchId
              )}
              portfolioRiskAssessment={portfolioRiskAssessment}
              portfolioProductionRisk={{
                error: portfolioProductionRiskError,
                loading: isLoadingPortfolioProductionRisk,
                onRefresh: () => void refreshPortfolioProductionRisk(true),
                snapshot: autoTradingSnapshot
              }}
              portfolioStage4Workflow={portfolioStage4Workflow}
              isRunningPortfolioRiskAssessment={isRunningPortfolioRiskAssessment}
              onRunPortfolioRiskAssessment={(request) => void runPortfolioRiskAssessment(request)}
              productionStrategyHandoff={{
                binding: strategyProductionBindingState.binding ?? null,
                busy: bindingStrategyRevision === productionStrategyHandoffState.handoff?.strategyRevision,
                errorLabel: strategyProductionBindingState.error
                  || productionStrategyHandoffState.error
                  ? strategyProductionBindingErrorLabel(
                      i18n,
                      strategyProductionBindingState.error
                        ?? productionStrategyHandoffState.error
                        ?? undefined
                    )
                  : null,
                switchBlockedReasonLabel: productionStrategyHandoffState.handoff?.switchBlockedReason
                  ? strategyProductionBindingErrorLabel(
                      i18n,
                      productionStrategyHandoffState.handoff.switchBlockedReason
                    )
                  : null,
                onBind: async (operator) => {
                  const handoff = productionStrategyHandoffState.handoff;
                  if (activeWorkAreaId !== "backtest" || !handoff) {
                    return false;
                  }
                  return bindStrategyToProduction(
                    {
                      auditRunId: handoff.runId,
                      revision: handoff.strategyRevision,
                      status: "audited"
                    },
                    operator
                  );
                },
                onOpenDynamicTrading: () => selectProductWorkArea("dynamic-trading"),
                result: productionStrategyHandoffState
              }}
              researchPreparation={{
                externalDataApproved: researchNoteExternalDataApproved,
                generationError: researchNoteGenerationError,
                generationStatus: researchNoteGenerationStatus,
                isGeneratingNote: isGeneratingResearchNoteDraft,
                isSavingNote: isSavingResearchNote,
                isSavingWorkspace: isSavingResearchWorkspace,
                note: researchNoteState,
                noteDraft: researchNoteDraft,
                onExternalDataApprovedChange: (approved) => {
                  approveResearchNoteExternalData(approved);
                },
                onGenerateNote: () => void generateCurrentResearchNoteDraft(),
                onNoteChange: editResearchNoteDraft,
                onProviderChange: selectResearchNoteProvider,
                onSaveNote: () => void saveCurrentResearchNote(),
                onSaveWorkspace: () => void saveCurrentResearchWorkspace(),
                providerId: researchNoteProviderId,
                providers: researchNoteProviders,
                workspaceSaved: isResearchWorkspaceSaved
              }}
              runs={runHistory}
              source={source}
              strategyExperiment={{
                active: visibleStrategyExperimentActive,
                busy: isStrategyExperimentRunning,
                error: strategyExperimentError,
                history: visibleStrategyExperimentHistory,
                onWalkForwardChange: configureStrategyExperimentWalkForward,
                walkForward: strategyExperimentWalkForward
              }}
              strategyWorkbench={renderStrategyWorkbench(false)}
              surfaceRef={activeWorkspaceSurfaceRef}
              workflowGuide={
                activeWorkAreaId === "market-information"
                  ? undefined
                  : automatedTradingGuide
              }
              workspace={workspace}
            />
            )
  );
}
