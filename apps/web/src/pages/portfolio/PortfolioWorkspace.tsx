import { formatChartDate } from "../../components/AiReviewAuditBoards";
import { Panel } from "../../components/AppPanel";
import { type AppI18n } from "../../lib/i18n";
import { PortfolioBacktestResult, PortfolioPaperOrderBatch, PortfolioPaperOrderSimulation } from "../../lib/terminal-api";
import { PaperExecutionSummaryTile, PaperPositionRow, PaperTradingRow, PortfolioBacktestDiagnosticRow, PortfolioBacktestDraft, PortfolioPaperOpsQueue, PortfolioPaperOpsQueueRow, PortfolioPaperOrderApprovalRow, PortfolioPaperOrderLatestSimulationSummary, PortfolioPaperOrderLifecycleRow, PortfolioPaperOrderReplayPositionRow, PortfolioPaperOrderReplaySummaryTile, PortfolioPaperOrderRouteRiskTemplate, PortfolioPaperOrderSimulationRouteRiskRequest, PortfolioPaperOrderSimulationRouteRow, PortfolioPaperOrderStateHistoryRow, PortfolioPeerAuditPlan, PortfolioRiskRow, RiskApprovalSummary, TerminalWorkspace } from "../../lib/terminal-workbench";
import { paperPositionStatusLabel } from "../execution/ExecutionFormatters";
import { ExecutionPanel } from "../execution/ExecutionPanel";
import { portfolioTradeReviewSideLabel } from "../execution/PortfolioOrderFormatters";
import { formatPlainNumber, formatPlainPercent, formatSignedNumber, formatSignedPercent } from "../shared/number-formatters";
import { portfolioAllocationEventTypeLabel, portfolioBacktestHeadline, portfolioBacktestSummary, portfolioDiagnosticDetail, portfolioDiagnosticLabel, portfolioPaperOrderBatchStatusLabel, portfolioPaperOrderStatusLabel, portfolioPeerAuditStatusLabel, portfolioPeerAuditSummary, portfolioPreTradeRiskCheckLabel, portfolioPreTradeRiskStatusLabel, portfolioRebalanceStatusLabel, portfolioRiskDetail, portfolioRiskLabel, portfolioRiskValue, portfolioTradeReviewStatusLabel } from "./PortfolioFormatters";
import { Check, Download, Play, RefreshCw } from "lucide-react";

export function PortfolioWorkspace({
  approvingPortfolioOrderId = null,
  className = "module-workspace-panel",
  executionClassName,
  i18n,
  isPreparingPortfolioPeers = false,
  isRecordingPortfolioPaperOrders = false,
  isRunningPortfolioBacktest = false,
  isSimulatingPortfolioOrderBatch = false,
  isSubmittingPaperExecution = false,
  onExportPortfolioMarkdown,
  onApprovePortfolioOrder,
  onFocusPortfolioOrderStateAuditQuery,
  onPortfolioRouteRiskTemplateChange,
  onPreparePortfolioPeers,
  onRecordPortfolioPaperOrders,
  onRejectPortfolioOrder,
  onRunPortfolioBacktest,
  onRunPortfolioPaperOpsAction,
  onSimulatePortfolioOrder,
  onSimulatePortfolioOrderBatch,
  onSubmitPaperExecution,
  paperRows,
  positionRows,
  portfolioBacktestDraft,
  portfolioBacktestDiagnosticRows,
  portfolioBacktestResult,
  portfolioPaperOrderBatches,
  portfolioPaperOrderApprovalRows,
  portfolioPaperOrderHistoryError,
  portfolioPaperOrderLifecycleRows,
  portfolioPaperOrderLatestSimulationSummary,
  portfolioPaperOpsQueue,
  portfolioPaperOrderReplayPositionRows,
  portfolioPaperOrderReplaySummaryTiles,
  portfolioRouteRiskRequest,
  portfolioRouteRiskTemplate,
  portfolioPaperOrderSimulationRouteRows,
  portfolioPaperOrderSimulations,
  portfolioPaperOrderStateHistoryRows,
  portfolioPeerAuditPlan,
  riskApproval,
  rows,
  simulatingPortfolioOrderId = null,
  summaryTiles,
  workspace
}: {
  approvingPortfolioOrderId?: string | null;
  className?: string;
  executionClassName?: string;
  i18n: AppI18n;
  isPreparingPortfolioPeers?: boolean;
  isRecordingPortfolioPaperOrders?: boolean;
  isRunningPortfolioBacktest?: boolean;
  isSimulatingPortfolioOrderBatch?: boolean;
  isSubmittingPaperExecution?: boolean;
  onApprovePortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onExportPortfolioMarkdown?: () => void;
  onFocusPortfolioOrderStateAuditQuery?: (query: string) => void;
  onPortfolioRouteRiskTemplateChange?: (field: keyof PortfolioPaperOrderRouteRiskTemplate, value: number) => void;
  onPreparePortfolioPeers?: () => void;
  onRecordPortfolioPaperOrders?: () => void;
  onRejectPortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onRunPortfolioBacktest?: () => void;
  onRunPortfolioPaperOpsAction?: (row: PortfolioPaperOpsQueueRow) => void;
  onSimulatePortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onSimulatePortfolioOrderBatch?: () => void;
  onSubmitPaperExecution?: () => void;
  paperRows: PaperTradingRow[];
  positionRows: PaperPositionRow[];
  portfolioBacktestDraft: PortfolioBacktestDraft;
  portfolioBacktestDiagnosticRows: PortfolioBacktestDiagnosticRow[];
  portfolioBacktestResult: PortfolioBacktestResult;
  portfolioPaperOrderBatches: PortfolioPaperOrderBatch[];
  portfolioPaperOrderApprovalRows: PortfolioPaperOrderApprovalRow[];
  portfolioPaperOrderHistoryError: string | null;
  portfolioPaperOrderLifecycleRows: PortfolioPaperOrderLifecycleRow[];
  portfolioPaperOrderLatestSimulationSummary: PortfolioPaperOrderLatestSimulationSummary | null;
  portfolioPaperOpsQueue: PortfolioPaperOpsQueue;
  portfolioPaperOrderReplayPositionRows: PortfolioPaperOrderReplayPositionRow[];
  portfolioPaperOrderReplaySummaryTiles: PortfolioPaperOrderReplaySummaryTile[];
  portfolioRouteRiskRequest: PortfolioPaperOrderSimulationRouteRiskRequest;
  portfolioRouteRiskTemplate: PortfolioPaperOrderRouteRiskTemplate;
  portfolioPaperOrderSimulationRouteRows: PortfolioPaperOrderSimulationRouteRow[];
  portfolioPaperOrderSimulations: PortfolioPaperOrderSimulation[];
  portfolioPaperOrderStateHistoryRows: PortfolioPaperOrderStateHistoryRow[];
  portfolioPeerAuditPlan: PortfolioPeerAuditPlan;
  riskApproval: RiskApprovalSummary;
  rows: PortfolioRiskRow[];
  simulatingPortfolioOrderId?: string | null;
  summaryTiles: PaperExecutionSummaryTile[];
  workspace: TerminalWorkspace;
}) {
  const portfolioBacktest = portfolioBacktestResult.portfolio;
  const canExportPortfolioMarkdown = Boolean(portfolioBacktest && onExportPortfolioMarkdown);
  const canRunPortfolioBacktest = portfolioBacktestDraft.status === "ready" && Boolean(onRunPortfolioBacktest);
  const canRecordPortfolioPaperOrders = Boolean(
    portfolioBacktest?.paperOrderEvents?.length && onRecordPortfolioPaperOrders
  );
  const canPreparePortfolioPeers =
    portfolioPeerAuditPlan.status === "ready" && portfolioPeerAuditPlan.missingCount > 0 && Boolean(onPreparePortfolioPeers);

  return (
    <>
      <Panel title={i18n.t("module.portfolio.title")} subtitle={i18n.t("module.portfolio.subtitle")} className={className}>
        <div className="risk-ledger">
          {rows.map((row) => (
            <article className={`risk-ledger-row ${row.tone}`} key={row.id}>
              <span>{portfolioRiskLabel(i18n, row)}</span>
              <strong>{portfolioRiskValue(i18n, row)}</strong>
              <p>{portfolioRiskDetail(i18n, row)}</p>
            </article>
          ))}
        </div>
        <section className={`portfolio-backtest-panel ${portfolioBacktestDraft.status}`}>
          <div className="portfolio-backtest-header">
            <div>
              <span>{i18n.t("portfolio.backtest")}</span>
              <strong>{portfolioBacktestHeadline(i18n, portfolioBacktestDraft.headline)}</strong>
              <p>{portfolioBacktestSummary(i18n, portfolioBacktestDraft.summary)}</p>
            </div>
            <div className="portfolio-backtest-actions">
              <button
                className="run-button compact"
                disabled={!canPreparePortfolioPeers || isPreparingPortfolioPeers || isRunningPortfolioBacktest}
                onClick={onPreparePortfolioPeers}
                type="button"
              >
                <RefreshCw size={14} />
                {isPreparingPortfolioPeers ? i18n.t("portfolio.peerAuditsRunning") : i18n.t("portfolio.peerAuditsRun")}
              </button>
              <button
                className="run-button compact"
                disabled={!canRunPortfolioBacktest || isPreparingPortfolioPeers || isRunningPortfolioBacktest}
                onClick={onRunPortfolioBacktest}
                type="button"
              >
                <Play size={14} />
                {isRunningPortfolioBacktest ? i18n.t("portfolio.backtestRunning") : i18n.t("portfolio.backtestRun")}
              </button>
              <button
                className="run-button compact portfolio-report-action"
                disabled={!canExportPortfolioMarkdown}
                onClick={onExportPortfolioMarkdown}
                title={i18n.t("portfolio.exportMarkdown")}
                type="button"
              >
                <Download size={14} />
                {i18n.t("portfolio.exportMarkdown")}
              </button>
              <button
                className="run-button compact portfolio-record-action"
                disabled={!canRecordPortfolioPaperOrders || isRecordingPortfolioPaperOrders}
                onClick={onRecordPortfolioPaperOrders}
                title={i18n.t("portfolio.recordPaperOrders")}
                type="button"
              >
                <Check size={14} />
                {isRecordingPortfolioPaperOrders
                  ? i18n.t("portfolio.recordPaperOrdersRunning")
                  : i18n.t("portfolio.recordPaperOrders")}
              </button>
            </div>
          </div>
          <div className={`portfolio-peer-audit-plan ${portfolioPeerAuditPlan.status}`}>
            <div className="portfolio-backtest-title">
              <span>{i18n.t("portfolio.peerAudits")}</span>
              <strong>
                {portfolioPeerAuditPlan.auditedCount}/{portfolioPeerAuditPlan.candidates.length}
              </strong>
            </div>
            <p>{portfolioPeerAuditSummary(i18n, portfolioPeerAuditPlan.summary)}</p>
            <div className="portfolio-peer-audit-list">
              {portfolioPeerAuditPlan.candidates.map((candidate) => (
                <span className={candidate.status} key={`${candidate.market}:${candidate.symbol}`}>
                  <b>{candidate.symbol}</b>
                  <em>{portfolioPeerAuditStatusLabel(i18n, candidate.status)}</em>
                </span>
              ))}
            </div>
          </div>
          <div className="portfolio-backtest-content">
            <div className="portfolio-backtest-section">
              <div className="portfolio-backtest-title">
                <span>{i18n.t("portfolio.backtestDraft")}</span>
                <strong>{portfolioBacktestDraft.rows.length}</strong>
              </div>
              <div className="portfolio-backtest-leg-table">
                {portfolioBacktestDraft.rows.map((row) => (
                  <div className={`portfolio-backtest-leg-row ${row.current ? "current" : ""}`} key={row.runId}>
                    <span>
                      {row.symbol}
                      {row.current ? <em>{i18n.locale === "zh-CN" ? "当前" : "Current"}</em> : null}
                    </span>
                    <span>
                      <small>{i18n.t("portfolio.weight")}</small>
                      {row.weightLabel}
                    </span>
                    <span>
                      <small>{i18n.t("portfolio.totalReturn")}</small>
                      {row.totalReturnPct}
                    </span>
                    <span>
                      <small>{i18n.t("portfolio.maxDrawdown")}</small>
                      {row.maxDrawdownPct}
                    </span>
                  </div>
                ))}
                {!portfolioBacktestDraft.rows.length ? (
                  <p className="portfolio-backtest-empty">
                    {portfolioBacktestSummary(i18n, portfolioBacktestDraft.summary)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="portfolio-backtest-section">
              <div className="portfolio-backtest-title">
                <span>{i18n.t("portfolio.backtestResult")}</span>
                <strong>{portfolioBacktest?.legs.length ?? 0}</strong>
              </div>
              {portfolioBacktest ? (
                <>
                  <div className="portfolio-backtest-metrics">
                    <article>
                      <span>{i18n.t("portfolio.totalReturn")}</span>
                      <strong>{formatSignedPercent(portfolioBacktest.metrics.totalReturnPct)}</strong>
                    </article>
                    <article>
                      <span>{i18n.t("portfolio.maxDrawdown")}</span>
                      <strong>{formatPlainPercent(portfolioBacktest.metrics.maxDrawdownPct)}</strong>
                    </article>
                    <article>
                      <span>{i18n.t("portfolio.cash")}</span>
                      <strong>{formatPlainPercent(portfolioBacktest.cashWeight * 100)}</strong>
                    </article>
                    <article>
                      <span>{i18n.t("portfolio.dataRows")}</span>
                      <strong>{portfolioBacktest.equityCurve.length}</strong>
                    </article>
                  </div>
                  {portfolioBacktestDiagnosticRows.length ? (
                    <div className="portfolio-diagnostic-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.diagnostics")}</span>
                        <strong>{portfolioBacktestDiagnosticRows.length}</strong>
                      </div>
                      <div className="portfolio-diagnostic-grid">
                        {portfolioBacktestDiagnosticRows.map((row) => (
                          <article className={`risk-ledger-row ${row.tone}`} key={row.id}>
                            <span>{portfolioDiagnosticLabel(i18n, row)}</span>
                            <strong>{row.value}</strong>
                            <p>{portfolioDiagnosticDetail(i18n, row)}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="portfolio-backtest-leg-table result">
                    {portfolioBacktest.legs.map((leg) => (
                      <div className="portfolio-backtest-leg-row" key={leg.symbol}>
                        <span>{leg.symbol}</span>
                        <span>
                          <small>{i18n.t("portfolio.weight")}</small>
                          {formatPlainPercent(leg.targetWeight * 100)}
                        </span>
                        <span>
                          <small>{i18n.t("portfolio.contribution")}</small>
                          {formatSignedPercent(leg.contributionReturnPct)}
                        </span>
                        <span>
                          <small>{i18n.t("portfolio.tradeCount")}</small>
                          {leg.tradeCount}
                        </span>
                      </div>
                    ))}
                  </div>
                  {portfolioBacktest.allocationEvents?.length ? (
                    <div className="portfolio-allocation-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.allocationLedger")}</span>
                        <strong>{portfolioBacktest.allocationEvents.length}</strong>
                      </div>
                      <div className="portfolio-backtest-leg-table allocation">
                        {portfolioBacktest.allocationEvents.map((event, index) => (
                          <div className="portfolio-backtest-leg-row" key={`${event.eventType}:${event.symbol}:${index}`}>
                            <span>
                              {event.symbol}
                              <em>{portfolioAllocationEventTypeLabel(i18n, event.eventType)}</em>
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.sourceRun")}</small>
                              {event.sourceRunId ?? "-"}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.weight")}</small>
                              {formatPlainPercent(event.targetWeight * 100)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.notional")}</small>
                              {formatPlainNumber(event.notionalValue)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {portfolioBacktest.rebalanceEvents?.length ? (
                    <div className="portfolio-allocation-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.rebalanceReviewLedger")}</span>
                        <strong>{portfolioBacktest.rebalanceEvents.length}</strong>
                      </div>
                      <div className="portfolio-backtest-leg-table allocation">
                        {portfolioBacktest.rebalanceEvents.map((event, index) => (
                          <div className={`portfolio-backtest-leg-row ${event.status}`} key={`${event.eventType}:${event.symbol}:${index}`}>
                            <span>
                              {event.symbol}
                              <em>{portfolioRebalanceStatusLabel(i18n, event.status)}</em>
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.endingWeight")}</small>
                              {formatPlainPercent(event.endingWeight * 100)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.deltaValue")}</small>
                              {formatSignedNumber(event.deltaValue)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.sourceRun")}</small>
                              {event.sourceRunId ?? "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {portfolioBacktest.tradeReviewEvents?.length ? (
                    <div className="portfolio-allocation-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.tradeReviewLedger")}</span>
                        <strong>{portfolioBacktest.tradeReviewEvents.length}</strong>
                      </div>
                      <div className="portfolio-backtest-leg-table allocation">
                        {portfolioBacktest.tradeReviewEvents.map((event, index) => (
                          <div className={`portfolio-backtest-leg-row ${event.status}`} key={`${event.eventType}:${event.symbol}:${index}`}>
                            <span>
                              {event.symbol}
                              <em>{portfolioTradeReviewSideLabel(i18n, event.side)}</em>
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.notional")}</small>
                              {formatPlainNumber(event.notionalValue)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.endingWeight")}</small>
                              {formatPlainPercent(event.endingWeight * 100)}
                            </span>
                            <span>
                              <small>{i18n.t("strategy.status")}</small>
                              {portfolioTradeReviewStatusLabel(i18n, event.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {portfolioBacktest.preTradeRiskChecks?.length ? (
                    <div className="portfolio-allocation-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.preTradeRiskChecks")}</span>
                        <strong>{portfolioBacktest.preTradeRiskChecks.length}</strong>
                      </div>
                      <div className="portfolio-backtest-leg-table allocation">
                        {portfolioBacktest.preTradeRiskChecks.map((check, index) => (
                          <div className={`portfolio-backtest-leg-row ${check.status}`} key={`${check.checkId}:${check.symbol ?? "portfolio"}:${index}`}>
                            <span>
                              {check.symbol ?? i18n.t("portfolio.scopePortfolio")}
                              <em>{portfolioPreTradeRiskCheckLabel(i18n, check.checkId)}</em>
                            </span>
                            <span>
                              <small>{i18n.t("strategy.status")}</small>
                              {portfolioPreTradeRiskStatusLabel(i18n, check.status)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.preTradeRiskValue")}</small>
                              {formatPlainNumber(check.value)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.preTradeRiskLimit")}</small>
                              {formatPlainNumber(check.limit)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {portfolioBacktest.paperOrderEvents?.length ? (
                    <div className="portfolio-allocation-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.paperOrderEvents")}</span>
                        <strong>{portfolioBacktest.paperOrderEvents.length}</strong>
                      </div>
                      <div className="portfolio-backtest-leg-table allocation">
                        {portfolioBacktest.paperOrderEvents.map((event) => (
                          <div className={`portfolio-backtest-leg-row paper-order ${event.status}`} key={event.orderId}>
                            <span>
                              {event.symbol}
                              <em>{portfolioTradeReviewSideLabel(i18n, event.side)}</em>
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.notional")}</small>
                              {formatPlainNumber(event.notionalValue)}
                            </span>
                            <span>
                              <small>{i18n.t("execution.quantity")}</small>
                              {formatPlainNumber(event.quantity)}
                            </span>
                            <span>
                              <small>{i18n.t("strategy.status")}</small>
                              {portfolioPaperOrderStatusLabel(i18n, event.status)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.riskStatus")}</small>
                              {portfolioPreTradeRiskStatusLabel(i18n, event.riskStatus)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {portfolioPaperOrderBatches.length || portfolioPaperOrderHistoryError ? (
                    <div className="portfolio-allocation-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.paperOrderHistory")}</span>
                        <strong>{portfolioPaperOrderBatches.length}</strong>
                      </div>
                      {portfolioPaperOrderHistoryError ? (
                        <p className="portfolio-backtest-empty">{portfolioPaperOrderHistoryError}</p>
                      ) : null}
                      <div className="portfolio-backtest-leg-table allocation">
                        {portfolioPaperOrderBatches.map((batch) => (
                          <div className="portfolio-backtest-leg-row paper-order-batch" key={batch.batchId}>
                            <span>
                              {batch.portfolioName}
                              <em>{formatChartDate(batch.createdAt)}</em>
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.paperOrderBatch")}</small>
                              {batch.batchId}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.paperOrderCount")}</small>
                              {batch.summary.totalOrders}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.notional")}</small>
                              {formatPlainNumber(batch.summary.totalNotionalValue)}
                            </span>
                            <span>
                              <small>{i18n.t("strategy.status")}</small>
                              {portfolioPaperOrderBatchStatusLabel(i18n, batch)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="portfolio-backtest-empty">
                  {portfolioBacktestResult.error ?? i18n.t("portfolio.backtestNoResult")}
                </p>
              )}
            </div>
          </div>
        </section>
        <div className="paper-position-ledger">
          <div className="paper-position-title">
            <span>{i18n.t("portfolio.paperPositions")}</span>
            <strong>{positionRows.length}</strong>
          </div>
          <div className="paper-position-table">
            <div className="paper-position-row paper-position-head">
              <span>{i18n.t("chart.symbol")}</span>
              <span>{i18n.t("execution.quantity")}</span>
              <span>{i18n.t("portfolio.avgCost")}</span>
              <span>{i18n.t("portfolio.markPrice")}</span>
              <span>{i18n.t("portfolio.marketValue")}</span>
              <span>{i18n.t("portfolio.unrealizedPnl")}</span>
              <span>{i18n.t("portfolio.returnPct")}</span>
              <span>{i18n.t("execution.status")}</span>
            </div>
            {positionRows.map((row) => (
              <div className={`paper-position-row ${row.tone}`} key={row.id}>
                <span>{row.symbol}</span>
                <span>{row.quantity}</span>
                <span>{row.avgCost}</span>
                <span>{row.markPrice}</span>
                <span>{row.marketValue}</span>
                <span>{row.unrealizedPnl}</span>
                <span>{row.returnPct}</span>
                <span>{paperPositionStatusLabel(i18n, row.status)}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
      <ExecutionPanel
        approval={riskApproval}
        approvingPortfolioOrderId={approvingPortfolioOrderId}
        className={executionClassName}
        i18n={i18n}
        isSubmitting={isSubmittingPaperExecution}
        isSimulatingPortfolioOrderBatch={isSimulatingPortfolioOrderBatch}
        onApprovePortfolioOrder={onApprovePortfolioOrder}
        onFocusPortfolioOrderStateAuditQuery={onFocusPortfolioOrderStateAuditQuery}
        onPortfolioRouteRiskTemplateChange={onPortfolioRouteRiskTemplateChange}
        onRejectPortfolioOrder={onRejectPortfolioOrder}
        onRunPortfolioPaperOpsAction={onRunPortfolioPaperOpsAction}
        onSimulatePortfolioOrder={onSimulatePortfolioOrder}
        onSimulatePortfolioOrderBatch={onSimulatePortfolioOrderBatch}
        onSubmit={onSubmitPaperExecution}
        portfolioOrderApprovalRows={portfolioPaperOrderApprovalRows}
        portfolioOrderLatestSimulationSummary={portfolioPaperOrderLatestSimulationSummary}
        portfolioPaperOpsQueue={portfolioPaperOpsQueue}
        portfolioOrderReplayPositionRows={portfolioPaperOrderReplayPositionRows}
        portfolioOrderReplaySummaryTiles={portfolioPaperOrderReplaySummaryTiles}
        portfolioRouteRiskRequest={portfolioRouteRiskRequest}
        portfolioRouteRiskTemplate={portfolioRouteRiskTemplate}
        portfolioOrderSimulationRouteRows={portfolioPaperOrderSimulationRouteRows}
        portfolioOrderRows={portfolioPaperOrderLifecycleRows}
        portfolioOrderSimulations={portfolioPaperOrderSimulations}
        portfolioOrderStateHistoryRows={portfolioPaperOrderStateHistoryRows}
        rows={paperRows}
        simulatingPortfolioOrderId={simulatingPortfolioOrderId}
        summaryTiles={summaryTiles}
        workspace={workspace}
      />
    </>
  );
}
