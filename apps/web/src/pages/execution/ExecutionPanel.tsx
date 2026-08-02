import { Check, Database, Play, RefreshCw, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PortfolioPaperOrderAuditLedgerPanel } from "../../components/PortfolioPaperOrderAuditLedgerPanel";
import { Panel } from "../../components/AppPanel";
import {
  formatChartDate,
  riskApprovalGateDetail,
  riskApprovalGateLabel,
  riskApprovalGateStatus,
  riskApprovalGateValue,
  riskApprovalHeadline,
  riskApprovalSummaryText,
} from "../../components/AiReviewAuditBoards";
import type { AppI18n } from "../../lib/i18n";
import type { PortfolioPaperOrderSimulation } from "../../lib/terminal-api";
import type {
  PaperExecutionSummaryTile,
  PaperTradingRow,
  PortfolioPaperOrderApprovalRow,
  PortfolioPaperOrderLatestSimulationSummary,
  PortfolioPaperOrderLifecycleRow,
  PortfolioPaperOpsQueue,
  PortfolioPaperOpsQueueRow,
  PortfolioPaperOrderReplayPositionRow,
  PortfolioPaperOrderReplaySummaryTile,
  PortfolioPaperOrderRouteRiskTemplate,
  PortfolioPaperOrderSimulationRouteRiskRequest,
  PortfolioPaperOrderSimulationRouteRow,
  PortfolioPaperOrderStateHistoryRow,
  RiskApprovalSummary,
  TerminalWorkspace,
} from "../../lib/terminal-workbench";
import { formatPlainNumber } from "../shared/number-formatters";
import {
  paperExecutionTileDetail,
  paperExecutionTileIcon,
  paperExecutionTileLabel,
  paperExecutionTileValue,
  paperNotionalLabel,
  paperReasonLabel,
  paperSideLabel,
  paperStatusLabel,
  portfolioReplayTileDetail,
  portfolioReplayTileIcon,
  portfolioReplayTileLabel,
  portfolioReplayTileValue,
} from "./ExecutionFormatters";
import {
  portfolioOrderApprovalStateLabel,
  portfolioOrderExecutionStateLabel,
  portfolioOrderLifecycleStatusLabel,
  portfolioOrderStateLabel,
  portfolioOrderStateReason,
  portfolioPaperOrderApprovalHint,
  portfolioSimulationRouteAdapterEvidenceLabel,
  portfolioSimulationRouteDetail,
  portfolioSimulationRouteStateLabel,
  portfolioSimulationRouteStatusLabel,
  portfolioTradeReviewSideLabel,
} from "./PortfolioOrderFormatters";

export function ExecutionPanel({
  approval,
  approvingPortfolioOrderId = null,
  className,
  i18n,
  isSubmitting = false,
  isSimulatingPortfolioOrderBatch = false,
  onApprovePortfolioOrder,
  onFocusPortfolioOrderStateAuditQuery,
  onPortfolioRouteRiskTemplateChange,
  onRunPortfolioPaperOpsAction,
  onRejectPortfolioOrder,
  onSimulatePortfolioOrder,
  onSimulatePortfolioOrderBatch,
  onSubmit,
  portfolioOrderApprovalRows = [],
  portfolioOrderLatestSimulationSummary = null,
  portfolioPaperOpsQueue = null,
  portfolioOrderReplayPositionRows = [],
  portfolioOrderReplaySummaryTiles = [],
  portfolioOrderRows = [],
  portfolioOrderSimulationRouteRows = [],
  portfolioOrderSimulations = [],
  portfolioOrderStateHistoryRows = [],
  portfolioRouteRiskRequest = null,
  portfolioRouteRiskTemplate = null,
  rows,
  simulatingPortfolioOrderId = null,
  summaryTiles,
  workspace
}: {
  approval: RiskApprovalSummary;
  approvingPortfolioOrderId?: string | null;
  className?: string;
  i18n: AppI18n;
  isSubmitting?: boolean;
  isSimulatingPortfolioOrderBatch?: boolean;
  onApprovePortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onFocusPortfolioOrderStateAuditQuery?: (query: string) => void;
  onPortfolioRouteRiskTemplateChange?: (field: keyof PortfolioPaperOrderRouteRiskTemplate, value: number) => void;
  onRunPortfolioPaperOpsAction?: (row: PortfolioPaperOpsQueueRow) => void;
  onRejectPortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onSimulatePortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onSimulatePortfolioOrderBatch?: () => void;
  onSubmit?: () => void;
  portfolioOrderApprovalRows?: PortfolioPaperOrderApprovalRow[];
  portfolioOrderLatestSimulationSummary?: PortfolioPaperOrderLatestSimulationSummary | null;
  portfolioPaperOpsQueue?: PortfolioPaperOpsQueue | null;
  portfolioOrderReplayPositionRows?: PortfolioPaperOrderReplayPositionRow[];
  portfolioOrderReplaySummaryTiles?: PortfolioPaperOrderReplaySummaryTile[];
  portfolioOrderRows?: PortfolioPaperOrderLifecycleRow[];
  portfolioOrderSimulationRouteRows?: PortfolioPaperOrderSimulationRouteRow[];
  portfolioOrderSimulations?: PortfolioPaperOrderSimulation[];
  portfolioOrderStateHistoryRows?: PortfolioPaperOrderStateHistoryRow[];
  portfolioRouteRiskRequest?: PortfolioPaperOrderSimulationRouteRiskRequest | null;
  portfolioRouteRiskTemplate?: PortfolioPaperOrderRouteRiskTemplate | null;
  rows: PaperTradingRow[];
  simulatingPortfolioOrderId?: string | null;
  summaryTiles: PaperExecutionSummaryTile[];
  workspace: TerminalWorkspace;
}) {
  const [portfolioOrderFocusedStateId, setPortfolioOrderFocusedStateId] = useState<string | null>(null);
  const focusedPortfolioOrderStateRef = useRef<HTMLElement | null>(null);
  const portfolioOrderBatchSimulatableCount = portfolioOrderSimulationRouteRows.filter((row) => row.canSimulate).length;

  useEffect(() => {
    if (!portfolioOrderFocusedStateId) {
      return;
    }
    focusedPortfolioOrderStateRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [portfolioOrderFocusedStateId, portfolioOrderStateHistoryRows]);

  return (
    <Panel
      title={i18n.t("panel.execution.title")}
      subtitle={i18n.t("panel.execution.subtitle")}
      className={className}
      action={
        onSubmit ? (
          <button
            className="run-button compact"
            disabled={isSubmitting || approval.status === "blocked"}
            onClick={onSubmit}
            title={i18n.t("execution.submitPaper")}
            type="button"
          >
            {isSubmitting ? <RefreshCw className="spin" size={15} /> : <Play size={15} />}
            {i18n.t("execution.submitPaper")}
          </button>
        ) : undefined
      }
    >
      <RiskApprovalBoard approval={approval} i18n={i18n} />
      <div className="execution-grid">
        {summaryTiles.map((tile) => (
          <ExecutionTile
            detail={paperExecutionTileDetail(i18n, tile)}
            icon={paperExecutionTileIcon(tile.id)}
            key={tile.id}
            label={paperExecutionTileLabel(i18n, tile)}
            tone={tile.tone}
            value={paperExecutionTileValue(i18n, tile)}
          />
        ))}
      </div>
      {portfolioOrderReplaySummaryTiles.length ? (
        <div className="execution-grid portfolio-replay-grid">
          {portfolioOrderReplaySummaryTiles.map((tile) => (
            <ExecutionTile
              detail={portfolioReplayTileDetail(i18n, tile)}
              icon={portfolioReplayTileIcon(tile.id)}
              key={tile.id}
              label={portfolioReplayTileLabel(i18n, tile)}
              tone={tile.tone}
              value={portfolioReplayTileValue(i18n, tile)}
            />
          ))}
        </div>
      ) : null}
      {portfolioPaperOpsQueue?.rows.length ? (
        <PortfolioPaperOpsQueuePanel
          i18n={i18n}
          onRunAction={onRunPortfolioPaperOpsAction}
          pendingActionId={simulatingPortfolioOrderId}
          queue={portfolioPaperOpsQueue}
        />
      ) : null}
      <div className="gate-list">
        {workspace.execution.gates.map((gate) => (
          <span key={gate.id} className={gate.passed ? "passed" : "blocked"}>
            {i18n.gateLabel(gate.id, gate.label)}
          </span>
        ))}
      </div>
      {portfolioOrderLatestSimulationSummary ? (
        <div className={`portfolio-order-latest-simulation ${portfolioOrderLatestSimulationSummary.tone}`}>
          <div>
            <span>{i18n.locale === "zh-CN" ? "最近模拟成交" : "Latest paper fill"}</span>
            <strong>{portfolioOrderLatestSimulationSummary.fillLabel}</strong>
            <p>{portfolioOrderLatestSimulationSummary.orderLabel}</p>
          </div>
          <div>
            <span>{i18n.locale === "zh-CN" ? "账户回放" : "Replay account"}</span>
            <strong>{portfolioOrderLatestSimulationSummary.accountLabel}</strong>
            <p>{portfolioOrderLatestSimulationSummary.timelineLabel}</p>
            <p>{portfolioOrderLatestSimulationSummary.adapterEvidenceLabel}</p>
          </div>
          <button
            className="portfolio-order-latest-simulation-action"
            disabled={!portfolioOrderLatestSimulationSummary.stateEventId}
            onClick={() => setPortfolioOrderFocusedStateId(portfolioOrderLatestSimulationSummary.stateEventId)}
            title={portfolioOrderLatestSimulationSummary.focusQuery}
            type="button"
          >
            <Search size={13} />
            {i18n.locale === "zh-CN" ? "定位流水" : "Focus timeline"}
          </button>
          <em>{portfolioOrderLatestSimulationSummary.boundaryLabel}</em>
        </div>
      ) : null}
      <div className="paper-blotter">
        <div className="paper-blotter-title">
          <span>{i18n.t("execution.paperBlotter")}</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="paper-blotter-table">
          <div className="paper-blotter-row paper-blotter-head">
            <span>{i18n.t("chart.symbol")}</span>
            <span>{i18n.t("execution.side")}</span>
            <span>{i18n.t("execution.quantity")}</span>
            <span>{i18n.t("execution.price")}</span>
            <span>{i18n.t("execution.notional")}</span>
            <span>{i18n.t("execution.status")}</span>
            <span>{i18n.t("execution.reason")}</span>
          </div>
          {rows.map((row) => (
            <div className={`paper-blotter-row ${row.tone}`} key={row.id}>
              <span>{row.symbol}</span>
              <span>{paperSideLabel(i18n, row.side)}</span>
              <span>{row.quantity}</span>
              <span>{row.price}</span>
              <span>{paperNotionalLabel(i18n, row.notional)}</span>
              <span>{paperStatusLabel(i18n, row.status)}</span>
              <span>{paperReasonLabel(i18n, row.reason)}</span>
            </div>
          ))}
        </div>
      </div>
      {portfolioOrderRows.length ? (
        <div className="paper-blotter portfolio-order-lifecycle">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "组合委托批次" : "Portfolio order batches"}</span>
            <strong>{portfolioOrderRows.length}</strong>
          </div>
          <div className="paper-blotter-table">
            <div className="paper-blotter-row paper-blotter-head portfolio-order-row">
              <span>{i18n.locale === "zh-CN" ? "组合" : "Portfolio"}</span>
              <span>{i18n.locale === "zh-CN" ? "批次" : "Batch"}</span>
              <span>{i18n.t("execution.notional")}</span>
              <span>{i18n.t("execution.status")}</span>
              <span>{i18n.locale === "zh-CN" ? "状态机" : "State machine"}</span>
              <span>{i18n.locale === "zh-CN" ? "审计事件" : "Audit event"}</span>
            </div>
            {portfolioOrderRows.map((row) => (
              <div className={`paper-blotter-row portfolio-order-row ${row.tone}`} key={row.id}>
                <span>{row.portfolioName}</span>
                <span>{row.batchId}</span>
                <span>{formatPlainNumber(row.notionalValue)}</span>
                <span>{portfolioOrderLifecycleStatusLabel(i18n, row)}</span>
                <span>{portfolioOrderExecutionStateLabel(i18n, row)}</span>
                <span>{row.auditEventId}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {portfolioOrderStateHistoryRows.length ? (
        <div className="portfolio-order-state-history">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "委托状态时间线" : "Order state timeline"}</span>
            <strong>{portfolioOrderStateHistoryRows.length}</strong>
          </div>
          <div className="portfolio-order-state-list">
            {portfolioOrderStateHistoryRows.map((row) => (
              <article
                className={`portfolio-order-state-row ${row.tone}${
                  portfolioOrderFocusedStateId === row.id ? " focused" : ""
                }`}
                key={row.id}
                ref={portfolioOrderFocusedStateId === row.id ? focusedPortfolioOrderStateRef : undefined}
                title={row.focusQuery}
              >
                <div>
                  <strong>
                    {row.symbol} · {portfolioOrderStateLabel(i18n, row)}
                  </strong>
                  <span>{row.orderId}</span>
                </div>
                <p>{portfolioOrderStateReason(i18n, row)}</p>
                {row.adapterEvidenceLabel ? <p>{row.adapterEvidenceLabel}</p> : null}
                <em title={row.focusQuery}>
                  {formatChartDate(row.timestamp)} · {row.actor || row.source}
                </em>
                {onFocusPortfolioOrderStateAuditQuery && row.focusQuery ? (
                  <button
                    className="portfolio-order-state-audit-action"
                    onClick={() => onFocusPortfolioOrderStateAuditQuery(row.focusQuery)}
                    title={row.focusQuery}
                    type="button"
                  >
                    <Search size={12} />
                    {i18n.locale === "zh-CN" ? "审计定位" : "Audit"}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
      {portfolioOrderSimulationRouteRows.length ? (
        <div className="portfolio-simulation-route">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "模拟路由检查" : "Simulation route checks"}</span>
            <div className="portfolio-simulation-route-title-actions">
              <strong>{portfolioOrderBatchSimulatableCount}</strong>
              <button
                className="portfolio-simulation-route-batch-action"
                disabled={
                  portfolioOrderBatchSimulatableCount === 0 ||
                  isSimulatingPortfolioOrderBatch ||
                  !onSimulatePortfolioOrderBatch
                }
                onClick={onSimulatePortfolioOrderBatch}
                type="button"
              >
                {isSimulatingPortfolioOrderBatch ? <RefreshCw className="spin" size={13} /> : <Play size={13} />}
                {i18n.locale === "zh-CN" ? "批量模拟" : "Batch simulate"}
              </button>
            </div>
          </div>
          {portfolioRouteRiskTemplate && portfolioRouteRiskRequest && onPortfolioRouteRiskTemplateChange ? (
            <div className="portfolio-route-risk-template">
              <div className="portfolio-route-risk-template-summary">
                <span>{i18n.locale === "zh-CN" ? "路由风控模板" : "Route risk template"}</span>
                <strong>{formatPlainNumber(portfolioRouteRiskRequest.initialCash)}</strong>
                <em>{i18n.locale === "zh-CN" ? "回放初始资金" : "Replay initial cash"}</em>
              </div>
              <label>
                <span>{i18n.locale === "zh-CN" ? "现金缓冲 %" : "Cash buffer %"}</span>
                <input
                  max={100}
                  min={0}
                  onChange={(event) =>
                    onPortfolioRouteRiskTemplateChange("minCashBufferPct", Number(event.currentTarget.value))
                  }
                  step={1}
                  type="number"
                  value={
                    Number.isFinite(portfolioRouteRiskTemplate.minCashBufferPct)
                      ? portfolioRouteRiskTemplate.minCashBufferPct
                      : ""
                  }
                />
                <small>{formatPlainNumber(portfolioRouteRiskRequest.minCashAfter)}</small>
              </label>
              <label>
                <span>{i18n.locale === "zh-CN" ? "单标的上限 %" : "Symbol cap %"}</span>
                <input
                  max={100}
                  min={0}
                  onChange={(event) =>
                    onPortfolioRouteRiskTemplateChange("maxSymbolNotionalPct", Number(event.currentTarget.value))
                  }
                  step={1}
                  type="number"
                  value={
                    Number.isFinite(portfolioRouteRiskTemplate.maxSymbolNotionalPct)
                      ? portfolioRouteRiskTemplate.maxSymbolNotionalPct
                      : ""
                  }
                />
                <small>{formatPlainNumber(portfolioRouteRiskRequest.maxSymbolNotional)}</small>
              </label>
              <label>
                <span>{i18n.locale === "zh-CN" ? "批次上限 %" : "Batch cap %"}</span>
                <input
                  max={100}
                  min={0}
                  onChange={(event) =>
                    onPortfolioRouteRiskTemplateChange("maxBatchNotionalPct", Number(event.currentTarget.value))
                  }
                  step={1}
                  type="number"
                  value={
                    Number.isFinite(portfolioRouteRiskTemplate.maxBatchNotionalPct)
                      ? portfolioRouteRiskTemplate.maxBatchNotionalPct
                      : ""
                  }
                />
                <small>{formatPlainNumber(portfolioRouteRiskRequest.maxBatchNotional)}</small>
              </label>
            </div>
          ) : null}
          <div className="portfolio-simulation-route-list">
            {portfolioOrderSimulationRouteRows.map((row) => (
              <article
                className={`portfolio-simulation-route-row ${row.tone}${
                  row.stateEventId && portfolioOrderFocusedStateId === row.stateEventId ? " focused" : ""
                }`}
                key={row.id}
                onClick={() => {
                  if (row.stateEventId) {
                    setPortfolioOrderFocusedStateId(row.stateEventId);
                  }
                }}
                title={row.focusQuery}
              >
                <div>
                  <strong>
                    {row.symbol} · {portfolioTradeReviewSideLabel(i18n, row.side)}
                  </strong>
                  <span>{row.orderId}</span>
                </div>
                <div>
                  <span>{portfolioSimulationRouteStatusLabel(i18n, row)}</span>
                  <p>{portfolioSimulationRouteDetail(i18n, row)}</p>
                  {row.adapterPaperExecutionId ? (
                    <small>{portfolioSimulationRouteAdapterEvidenceLabel(i18n, row)}</small>
                  ) : null}
                </div>
                <em title={row.focusQuery}>{portfolioSimulationRouteStateLabel(i18n, row)}</em>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      {portfolioOrderApprovalRows.length ? (
        <div className="portfolio-order-approval">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "组合委托审批" : "Portfolio order approvals"}</span>
            <strong>{portfolioOrderApprovalRows.length}</strong>
          </div>
          <div className="portfolio-order-approval-list">
            {portfolioOrderApprovalRows.map((row) => {
              const isApproving = approvingPortfolioOrderId === row.id;
              const isSimulating = simulatingPortfolioOrderId === row.id;
              const alreadySimulated = portfolioOrderSimulations.some(
                (simulation) => simulation.batchId === row.batchId && simulation.orderId === row.orderId
              );
              return (
                <article className={`portfolio-order-approval-row ${row.tone}`} key={row.id}>
                  <div>
                    <strong>
                      {row.symbol} · {portfolioTradeReviewSideLabel(i18n, row.side)}
                    </strong>
                    <span>{row.orderId}</span>
                    <p>{portfolioPaperOrderApprovalHint(i18n, row)}</p>
                  </div>
                  <div className="portfolio-order-approval-meta">
                    <span>
                      <small>{i18n.t("execution.quantity")}</small>
                      {formatPlainNumber(row.quantity)}
                    </span>
                    <span>
                      <small>{i18n.t("execution.notional")}</small>
                      {formatPlainNumber(row.notionalValue)}
                    </span>
                    <span>
                      <small>{i18n.locale === "zh-CN" ? "状态机" : "State"}</small>
                      {portfolioOrderApprovalStateLabel(i18n, row)}
                    </span>
                  </div>
                  <div className="portfolio-order-approval-actions">
                    <button
                      className="approve"
                      disabled={!row.canApprove || isApproving || !onApprovePortfolioOrder}
                      onClick={() => onApprovePortfolioOrder?.(row)}
                      type="button"
                    >
                      {isApproving ? <RefreshCw className="spin" size={13} /> : <Check size={13} />}
                      {i18n.locale === "zh-CN" ? "批准" : "Approve"}
                    </button>
                    <button
                      className="reject"
                      disabled={!row.canReject || isApproving || !onRejectPortfolioOrder}
                      onClick={() => onRejectPortfolioOrder?.(row)}
                      type="button"
                    >
                      <X size={13} />
                      {i18n.locale === "zh-CN" ? "拒绝" : "Reject"}
                    </button>
                    <button
                      className="simulate"
                      disabled={
                        row.state !== "ready_for_simulation" ||
                        alreadySimulated ||
                        isSimulating ||
                        !onSimulatePortfolioOrder
                      }
                      onClick={() => onSimulatePortfolioOrder?.(row)}
                      type="button"
                    >
                      {isSimulating ? <RefreshCw className="spin" size={13} /> : <Play size={13} />}
                      {alreadySimulated
                        ? i18n.locale === "zh-CN"
                          ? "已成交"
                          : "Filled"
                        : i18n.locale === "zh-CN"
                          ? "模拟成交"
                          : "Simulate"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
      {portfolioOrderReplayPositionRows.length ? (
        <div className="portfolio-order-replay">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "组合模拟账户持仓" : "Portfolio replay positions"}</span>
            <strong>{portfolioOrderReplayPositionRows.length}</strong>
          </div>
          <div className="portfolio-order-replay-table">
            <div className="portfolio-order-replay-row portfolio-order-replay-head">
              <span>{i18n.t("chart.symbol")}</span>
              <span>{i18n.t("execution.quantity")}</span>
              <span>{i18n.t("portfolio.avgCost")}</span>
              <span>{i18n.t("portfolio.markPrice")}</span>
              <span>{i18n.t("portfolio.marketValue")}</span>
              <span>{i18n.t("portfolio.unrealizedPnl")}</span>
            </div>
            {portfolioOrderReplayPositionRows.map((row) => (
              <div className={`portfolio-order-replay-row ${row.tone}`} key={row.id}>
                <span>{row.symbol}</span>
                <span>{row.quantity}</span>
                <span>{row.avgCost}</span>
                <span>{row.lastPrice}</span>
                <span>{row.marketValue}</span>
                <span>{row.unrealizedPnl}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {portfolioOrderSimulations.length ? (
        <div className="portfolio-order-simulation">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "组合模拟成交" : "Portfolio simulated fills"}</span>
            <strong>{portfolioOrderSimulations.length}</strong>
          </div>
          <div className="portfolio-order-simulation-list">
            {portfolioOrderSimulations.map((simulation) => (
              <article className="portfolio-order-simulation-row" key={simulation.simulationId}>
                <strong>
                  {simulation.symbol} · {portfolioTradeReviewSideLabel(i18n, simulation.side)}
                </strong>
                <span>{simulation.orderId}</span>
                <span>{formatPlainNumber(simulation.quantity)}</span>
                <span>{formatPlainNumber(simulation.fillPrice)}</span>
                <span>{formatPlainNumber(simulation.notionalValue)}</span>
                <em>{i18n.locale === "zh-CN" ? "paper-only 已成交" : "paper-only filled"}</em>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

function PortfolioPaperOpsQueuePanel({
  i18n,
  onRunAction,
  pendingActionId = null,
  queue
}: {
  i18n: AppI18n;
  onRunAction?: (row: PortfolioPaperOpsQueueRow) => void;
  pendingActionId?: string | null;
  queue: PortfolioPaperOpsQueue;
}) {
  return (
    <div className="portfolio-paper-ops-queue">
      <div className="portfolio-paper-ops-summary">
        <div>
          <span>{i18n.locale === "zh-CN" ? "组合纸面运营队列" : "Portfolio Paper Ops Queue"}</span>
          <strong>
            {queue.summary.readyForSimulationCount}
            {i18n.locale === "zh-CN" ? " 个可模拟" : " ready"}
          </strong>
        </div>
        <p>
          {i18n.locale === "zh-CN"
            ? `待风控 ${queue.summary.waitingRiskCount} · 待人工 ${queue.summary.waitingHumanCount} · 已模拟 ${queue.summary.simulatedCount} · 过期 ${queue.summary.staleCount}`
            : `Risk ${queue.summary.waitingRiskCount} · Human ${queue.summary.waitingHumanCount} · Simulated ${queue.summary.simulatedCount} · Stale ${queue.summary.staleCount}`}
        </p>
        <em>{queue.summary.paperOnly && !queue.summary.liveTradingAllowed ? "paper-only / live blocked" : "live route review"}</em>
      </div>
      <div className="portfolio-paper-ops-table">
        <div className="portfolio-paper-ops-row portfolio-paper-ops-head">
          <span>{i18n.locale === "zh-CN" ? "委托" : "Order"}</span>
          <span>{i18n.locale === "zh-CN" ? "阶段" : "Stage"}</span>
          <span>{i18n.locale === "zh-CN" ? "证据" : "Evidence"}</span>
          <span>{i18n.locale === "zh-CN" ? "动作" : "Action"}</span>
        </div>
        {queue.rows.map((row) => {
          const actionId = row.orderId ? `${row.batchId}:${row.orderId}` : row.id;
          const isPending = pendingActionId === actionId;
          return (
            <div className={`portfolio-paper-ops-row ${row.tone}`} key={row.id}>
              <span>
                <strong>{row.orderId ? row.symbol : row.portfolioName}</strong>
                <em>{row.orderId ?? row.batchId}</em>
              </span>
              <span>
                <b>{portfolioPaperOpsStageLabel(i18n, row.stage)}</b>
                <em>{row.statusLabel}</em>
              </span>
              <span title={row.detail}>
                <b>{row.latestStateLabel}</b>
                <em>{row.adapterEvidenceLabel}</em>
              </span>
              <button
                disabled={!onRunAction || !row.canRunAction || isPending}
                onClick={() => onRunAction?.(row)}
                title={row.focusQuery}
                type="button"
              >
                {isPending ? <RefreshCw className="spin" size={13} /> : <Play size={13} />}
                {portfolioPaperOpsActionLabel(i18n, row.nextActionId)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function portfolioPaperOpsStageLabel(i18n: AppI18n, stage: PortfolioPaperOpsQueueRow["stage"]): string {
  if (i18n.locale === "zh-CN") {
    return {
      waiting_risk: "待风控",
      waiting_human: "待人工",
      ready_for_simulation: "可模拟",
      simulated: "已模拟",
      rejected: "已拒绝",
      stale: "证据过期"
    }[stage];
  }
  return {
    waiting_risk: "Risk review",
    waiting_human: "Human review",
    ready_for_simulation: "Ready",
    simulated: "Simulated",
    rejected: "Rejected",
    stale: "Stale"
  }[stage];
}

function portfolioPaperOpsActionLabel(i18n: AppI18n, action: PortfolioPaperOpsQueueRow["nextActionId"]): string {
  if (i18n.locale === "zh-CN") {
    return {
      "open-portfolio": "打开组合",
      "review-order": "定位复核",
      "open-approval": "查看审批",
      "simulate-order": "模拟成交",
      "replay-simulation": "查看回放"
    }[action];
  }
  return {
    "open-portfolio": "Open",
    "review-order": "Review",
    "open-approval": "Approval",
    "simulate-order": "Simulate",
    "replay-simulation": "Replay"
  }[action];
}

function RiskApprovalBoard({ approval, i18n }: { approval: RiskApprovalSummary; i18n: AppI18n }) {
  return (
    <section className={`risk-approval ${approval.status}`}>
      <div className="risk-approval-head">
        <span>{i18n.locale === "en-US" ? "Execution approval" : "执行前审批"}</span>
        <strong>{riskApprovalHeadline(i18n, approval)}</strong>
        <p>{riskApprovalSummaryText(i18n, approval)}</p>
      </div>
      <div className="risk-approval-grid">
        {approval.gates.map((gate) => (
          <article className={`risk-approval-gate ${gate.tone}`} key={gate.id}>
            <span>{riskApprovalGateLabel(i18n, gate)}</span>
            <strong>{riskApprovalGateValue(i18n, gate)}</strong>
            <em>{riskApprovalGateStatus(i18n, gate.status)}</em>
            <p>{riskApprovalGateDetail(i18n, gate)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExecutionTile({
  detail,
  icon: Icon,
  label,
  tone,
  value
}: {
  detail: string;
  icon: typeof Database;
  label: string;
  tone: PaperExecutionSummaryTile["tone"];
  value: string;
}) {
  return (
    <article className={`execution-tile ${tone}`}>
      <Icon size={17} />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
