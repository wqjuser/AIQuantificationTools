import type { BrokerAdapterRow, ExecutionAdapterLedgerSnapshot, PaperExecutionSnapshot, PaperPositionRow } from "../audit/execution-contracts";
import { formatSignedPct } from "../core/workspace-audit-formatters";
import type { TerminalWorkspace } from "../core/workspace-contracts";
import type { ExecutionAdapterLedgerRow } from "./adapter-contracts";
import type { ExecutionAdapterPaperExecutionRow } from "./ops-contracts";
import type { PaperExecutionReplayGateItem, PaperExecutionReplayGateItemId, PaperExecutionReplayGateItemStatus, PaperExecutionReplayGateStatus, PaperExecutionReplayGateTone, PortfolioPaperOpsQueue, PortfolioPaperOpsQueueAction, PortfolioPaperOpsQueueRow, PortfolioPaperOpsQueueStage, PortfolioPaperOrderApprovalRow, PortfolioPaperOrderLifecycleRow, PortfolioPaperOrderReplaySnapshot, PortfolioPaperOrderRouteRiskTemplate, PortfolioPaperOrderSimulationRouteRiskRequest, PortfolioPaperOrderSimulationRouteRow, PortfolioPaperOrderSimulationSnapshot, PortfolioPaperOrderStateHistoryEventSnapshot, PortfolioPaperOrderStateHistoryOrderSnapshot, PortfolioPaperOrderStateHistoryRow, PortfolioPaperOrderStateHistorySnapshot } from "../portfolio/paper-contracts";
import { defaultPortfolioPaperOrderRouteRiskTemplate } from "../portfolio/paper-contracts";
import { executionAdapterLedgerTone, formatQuantity, formatSignedCurrency, metricValue, parsePercentMetric, portfolioPaperOrderStateTone } from "../strategy/backtest-builders";
import { averageFilledPrice, calculatePaperQuantity, resolveExecutionMarkPrice, resolvePaperTargetNotional } from "../strategy/comparison-builders";
import { buildResearchRunContextBinding } from "../strategy/experiment-builders";
import { formatAssumptionCurrency, resolvePaperOrderPrice } from "../strategy/workflow-builders";

export function buildLiveBoundaryReplayGateItem(unsafeBoundaryReasons: string[]): PaperExecutionReplayGateItem {
  if (unsafeBoundaryReasons.length) {
    return paperExecutionReplayGateItem(
      "live-boundary",
      "Live boundary",
      "blocked",
      "Boundary violation",
      unsafeBoundaryReasons.join(" · "),
      "risk"
    );
  }
  return paperExecutionReplayGateItem(
    "live-boundary",
    "Live boundary",
    "passed",
    "paper-only",
    "Replay gate keeps order submission and live trading disabled.",
    "positive"
  );
}

export function filterValidReplayAdapterPaperExecutions(
  adapterPaperExecutionRows: ExecutionAdapterPaperExecutionRow[],
  preferredAdapterExecutionIds: Set<string>
): ExecutionAdapterPaperExecutionRow[] {
  const validRows = adapterPaperExecutionRows.filter(
    (row) =>
      row.status === "paper_execution_recorded" &&
      row.paperFillRecorded &&
      !row.orderSubmitted &&
      !row.liveOrderSubmitted &&
      !row.routeExecuted
  );
  const preferredRows = validRows.filter((row) => preferredAdapterExecutionIds.size === 0 || preferredAdapterExecutionIds.has(row.id));
  return (preferredRows.length ? preferredRows : validRows).sort(
    (left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id)
  );
}

export function paperExecutionReplayBoundaryReasons({
  adapterPaperExecutionRows,
  portfolioOrderReplay,
  portfolioOrderSimulations
}: {
  adapterPaperExecutionRows: ExecutionAdapterPaperExecutionRow[];
  portfolioOrderReplay: PortfolioPaperOrderReplaySnapshot | null;
  portfolioOrderSimulations: PortfolioPaperOrderSimulationSnapshot[];
}): string[] {
  const reasons: string[] = [];
  if (portfolioOrderReplay && (!portfolioOrderReplay.paperOnly || !portfolioOrderReplay.liveExecutionBlocked)) {
    reasons.push("portfolio replay boundary is not paper-only/live-blocked");
  }
  if (portfolioOrderSimulations.some((row) => !row.paperOnly || !row.liveExecutionBlocked)) {
    reasons.push("portfolio simulation boundary is not paper-only/live-blocked");
  }
  if (adapterPaperExecutionRows.some((row) => row.orderSubmitted || row.liveOrderSubmitted || row.routeExecuted)) {
    reasons.push("adapter paper execution attempted an order submission or route execution");
  }
  return reasons;
}

export function paperExecutionReplayGateStatus(items: PaperExecutionReplayGateItem[]): PaperExecutionReplayGateStatus {
  if (items.every((item) => item.status === "passed")) {
    return "replay_ready";
  }
  if (items.some((item) => item.id === "live-boundary" && item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "stale")) {
    return "stale";
  }
  const evidenceItems = items.filter((item) => item.id !== "live-boundary");
  if (evidenceItems.some((item) => item.status === "review") || evidenceItems.some((item) => item.status === "passed")) {
    return "partial";
  }
  return "blocked";
}

export function paperExecutionReplayGateHeadline(status: PaperExecutionReplayGateStatus): string {
  if (status === "replay_ready") {
    return "Paper execution replay is ready for manual review";
  }
  if (status === "stale") {
    return "Paper execution replay is stale";
  }
  if (status === "partial") {
    return "Paper execution replay evidence is incomplete";
  }
  return "Paper execution replay is blocked";
}

export function paperExecutionReplayGateDetail(
  status: PaperExecutionReplayGateStatus,
  blocker: PaperExecutionReplayGateItem | null
): string {
  if (status === "replay_ready") {
    return "All replay evidence is bound, paper-only, and ready for human pre-live review; live trading remains disabled.";
  }
  if (blocker) {
    return `${blocker.label}: ${blocker.detail}`;
  }
  return "Replay evidence is missing.";
}

export function paperExecutionReplayGateItem(
  id: PaperExecutionReplayGateItemId,
  label: string,
  status: PaperExecutionReplayGateItemStatus,
  evidence: string,
  detail: string,
  tone: PaperExecutionReplayGateTone
): PaperExecutionReplayGateItem {
  return {
    id,
    label,
    status,
    evidence,
    detail,
    tone
  };
}

export function buildPortfolioPaperOrderSimulationRouteRiskRequest(
  template: PortfolioPaperOrderRouteRiskTemplate,
  replay: PortfolioPaperOrderReplaySnapshot | null | undefined
): PortfolioPaperOrderSimulationRouteRiskRequest {
  const initialCash = portfolioRouteRiskPositiveNumber(replay?.initialCash, 100_000);
  const minCashBufferPct = portfolioRouteRiskPct(template.minCashBufferPct, 0);
  const maxSymbolNotionalPct = portfolioRouteRiskPct(
    template.maxSymbolNotionalPct,
    defaultPortfolioPaperOrderRouteRiskTemplate.maxSymbolNotionalPct
  );
  const maxBatchNotionalPct = portfolioRouteRiskPct(
    template.maxBatchNotionalPct,
    defaultPortfolioPaperOrderRouteRiskTemplate.maxBatchNotionalPct
  );
  return {
    initialCash: roundPortfolioRouteRiskNumber(initialCash),
    minCashAfter: roundPortfolioRouteRiskNumber(initialCash * (minCashBufferPct / 100)),
    maxSymbolNotional: roundPortfolioRouteRiskNumber(initialCash * (maxSymbolNotionalPct / 100)),
    maxBatchNotional: roundPortfolioRouteRiskNumber(initialCash * (maxBatchNotionalPct / 100))
  };
}

export function buildPortfolioPaperOrderSimulationRouteRows(
  approvalRows: PortfolioPaperOrderApprovalRow[] | null | undefined,
  simulations: PortfolioPaperOrderSimulationSnapshot[] | null | undefined,
  stateRows: PortfolioPaperOrderStateHistoryRow[] | null | undefined,
  adapterPaperExecutionRows: ExecutionAdapterPaperExecutionRow[] | null | undefined = []
): PortfolioPaperOrderSimulationRouteRow[] {
  const simulationByOrder = new Map(
    [...(simulations ?? [])].map((simulation) => [`${simulation.batchId}:${simulation.orderId}`, simulation])
  );
  const adapterPaperExecutionBySymbol = new Map<string, ExecutionAdapterPaperExecutionRow>();
  for (const execution of [...(adapterPaperExecutionRows ?? [])].sort(
    (left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id)
  )) {
    if (
      execution.status !== "paper_execution_recorded" ||
      !execution.paperFillRecorded ||
      execution.orderSubmitted ||
      execution.liveOrderSubmitted ||
      execution.routeExecuted
    ) {
      continue;
    }
    const symbol = execution.simulatedSymbol.trim();
    if (symbol && !adapterPaperExecutionBySymbol.has(symbol)) {
      adapterPaperExecutionBySymbol.set(symbol, execution);
    }
  }
  const stateByOrder = new Map<string, PortfolioPaperOrderStateHistoryRow>();
  for (const row of [...(stateRows ?? [])].sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))) {
    const key = `${row.batchId}:${row.orderId}`;
    if (!stateByOrder.has(key)) {
      stateByOrder.set(key, row);
    }
  }

  return [...(approvalRows ?? [])].map((row) => {
    const key = `${row.batchId}:${row.orderId}`;
    const simulation = simulationByOrder.get(key) ?? null;
    const latestState = stateByOrder.get(key) ?? null;
    const adapterPaperExecution = adapterPaperExecutionBySymbol.get(row.symbol) ?? null;
    const adapterEvidenceLabel = adapterPaperExecution
      ? [
          `Adapter paper execution ${adapterPaperExecution.id}`,
          adapterPaperExecution.fillSummary,
          adapterPaperExecution.manifestValidationId
        ].filter(Boolean).join(" · ")
      : "No adapter paper execution evidence";
    const base = {
      id: `portfolio-simulation-route-${row.batchId}-${row.orderId}`,
      batchId: row.batchId,
      orderId: row.orderId,
      symbol: row.symbol,
      side: row.side,
      latestStateLabel: latestState ? `${latestState.label} · ${latestState.actor || latestState.source}` : "No timeline event yet",
      focusQuery: `${row.batchId} ${row.orderId} ${row.symbol} ${latestState?.state ?? row.state}`,
      stateEventId: latestState?.id ?? null,
      simulationId: simulation?.simulationId ?? null,
      adapterPaperExecutionId: adapterPaperExecution?.id ?? null,
      adapterPaperExecutionEvidenceLabel: adapterEvidenceLabel,
      adapterManifestValidationId: adapterPaperExecution?.manifestValidationId ?? null
    };

    if (simulation) {
      const routeGuardDetail = portfolioPaperOrderSimulationRouteGuardDetail(simulation);
      return {
        ...base,
        routeState: "filled" as const,
        statusLabel: "Already simulated",
        focusQuery: [
          base.focusQuery,
          simulation.simulationId,
          simulation.fillStatus,
          simulation.simulatedAt,
          simulation.sourceRunId
        ]
          .filter((token): token is string => Boolean(token))
          .join(" "),
        detail: [
          `Filled by ${simulation.simulationId} · ${simulation.side} ${simulation.quantity} @ ${simulation.fillPrice.toFixed(2)} · simulated ${simulation.simulatedAt}`,
          routeGuardDetail,
          "duplicate simulator route is blocked."
        ].filter(Boolean).join("; "),
        canSimulate: false,
        tone: "neutral" as const
      };
    }

    if (row.state === "ready_for_simulation" && (row.side === "buy" || row.side === "sell")) {
      return {
        ...base,
        routeState: "ready" as const,
        statusLabel: "Ready for simulator",
        detail: "Approved paper-only order can use the local simulator; live broker route remains blocked.",
        canSimulate: true,
        tone: "positive" as const
      };
    }

    if (row.state === "awaiting_operator_review" || row.state === "risk_review") {
      return {
        ...base,
        routeState: "waiting_review" as const,
        statusLabel: row.state === "risk_review" ? "Waiting for risk review" : "Waiting for operator review",
        detail: row.actionHint || "Approval evidence is required before the local simulator can be used.",
        canSimulate: false,
        tone: "warning" as const
      };
    }

    if (row.state === "skipped" || row.side === "hold") {
      return {
        ...base,
        routeState: "skipped" as const,
        statusLabel: "Skipped",
        detail: row.actionHint || "Hold or skipped orders are not routed to the simulator.",
        canSimulate: false,
        tone: "neutral" as const
      };
    }

    return {
      ...base,
      routeState: "blocked" as const,
      statusLabel:
        row.state === "operator_rejected"
          ? "Operator rejected"
          : row.state === "invalid_order"
            ? "Invalid order"
            : "Risk blocked",
      detail: row.actionHint || "Risk or operator state blocks the local simulator route.",
      canSimulate: false,
      tone: "risk" as const
    };
  });
}

export function buildPortfolioPaperOpsQueueRows({
  approvalRows = [],
  lifecycleRows = [],
  routeRows = [],
  stateHistoryRows = []
}: {
  approvalRows?: PortfolioPaperOrderApprovalRow[] | null | undefined;
  lifecycleRows?: PortfolioPaperOrderLifecycleRow[] | null | undefined;
  routeRows?: PortfolioPaperOrderSimulationRouteRow[] | null | undefined;
  stateHistoryRows?: PortfolioPaperOrderStateHistoryRow[] | null | undefined;
}): PortfolioPaperOpsQueue {
  const routeByOrder = new Map((routeRows ?? []).map((row) => [`${row.batchId}:${row.orderId}`, row]));
  const stateByOrder = new Map<string, PortfolioPaperOrderStateHistoryRow>();
  for (const row of [...(stateHistoryRows ?? [])].sort(
    (left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id)
  )) {
    const key = `${row.batchId}:${row.orderId}`;
    if (!stateByOrder.has(key)) {
      stateByOrder.set(key, row);
    }
  }

  const batchIdsWithOrderEvidence = new Set<string>();
  for (const row of approvalRows ?? []) {
    batchIdsWithOrderEvidence.add(row.batchId);
  }
  for (const row of routeRows ?? []) {
    batchIdsWithOrderEvidence.add(row.batchId);
  }

  const staleRows: PortfolioPaperOpsQueueRow[] = [...(lifecycleRows ?? [])]
    .filter((row) => row.routableOrders > 0 && !batchIdsWithOrderEvidence.has(row.batchId))
    .map((row) => ({
      id: `portfolio-paper-ops-stale-${row.batchId}`,
      stage: "stale",
      batchId: row.batchId,
      baseRunId: row.baseRunId,
      portfolioName: row.portfolioName,
      orderId: null,
      symbol: "BATCH",
      side: "batch",
      quantity: null,
      notionalValue: row.notionalValue,
      statusLabel: "Evidence stale",
      detail: `${row.routableOrders} routable paper orders look stale because approval or route evidence is missing; refresh portfolio paper order history before simulation. ${row.detail}`,
      latestStateLabel: row.executionStateLabel || row.statusLabel || "No order-level evidence",
      adapterEvidenceLabel: "No adapter paper execution evidence",
      simulationId: null,
      stateEventId: null,
      focusQuery: `${row.batchId} ${row.baseRunId} ${row.portfolioName} stale portfolio paper orders`,
      nextActionId: "open-portfolio",
      canRunAction: true,
      updatedAt: row.createdAt,
      tone: "warning"
    }));

  const orderRows: PortfolioPaperOpsQueueRow[] = [...(approvalRows ?? [])].map((approval) => {
    const key = `${approval.batchId}:${approval.orderId}`;
    const route = routeByOrder.get(key) ?? null;
    const state = stateByOrder.get(key) ?? null;
    const stage = portfolioPaperOpsQueueStage(approval, route);
    const nextActionId = portfolioPaperOpsQueueAction(stage);
    const statusLabel = route?.statusLabel ?? portfolioPaperOpsStatusLabel(stage);
    const detail = route?.detail ?? approval.actionHint;
    const latestStateLabel = route?.latestStateLabel ?? (state ? `${state.label} · ${state.actor || state.source}` : approval.actionHint);
    const adapterEvidenceLabel =
      route?.adapterPaperExecutionEvidenceLabel || state?.adapterEvidenceLabel || "No adapter paper execution evidence";
    const focusQuery = [
      route?.focusQuery,
      state?.focusQuery,
      approval.batchId,
      approval.orderId,
      approval.symbol,
      approval.state
    ]
      .filter((token): token is string => Boolean(token))
      .join(" ");

    return {
      id: `portfolio-paper-ops-${approval.batchId}-${approval.orderId}`,
      stage,
      batchId: approval.batchId,
      baseRunId: approval.baseRunId,
      portfolioName: approval.portfolioName,
      orderId: approval.orderId,
      symbol: approval.symbol,
      side: approval.side,
      quantity: approval.quantity,
      notionalValue: approval.notionalValue,
      statusLabel,
      detail,
      latestStateLabel,
      adapterEvidenceLabel,
      simulationId: route?.simulationId ?? null,
      stateEventId: route?.stateEventId ?? state?.id ?? null,
      focusQuery,
      nextActionId,
      canRunAction: portfolioPaperOpsQueueCanRunAction(stage, route),
      updatedAt: state?.timestamp ?? approval.reviewedAt ?? "",
      tone: portfolioPaperOpsQueueTone(stage)
    };
  });

  const rows = [...staleRows, ...orderRows].sort((left, right) => {
    const stageDelta = portfolioPaperOpsQueueStagePriority(left.stage) - portfolioPaperOpsQueueStagePriority(right.stage);
    if (stageDelta !== 0) {
      return stageDelta;
    }
    return right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id);
  });

  return {
    rows,
    summary: {
      totalRows: rows.length,
      waitingRiskCount: rows.filter((row) => row.stage === "waiting_risk").length,
      waitingHumanCount: rows.filter((row) => row.stage === "waiting_human").length,
      readyForSimulationCount: rows.filter((row) => row.stage === "ready_for_simulation").length,
      simulatedCount: rows.filter((row) => row.stage === "simulated").length,
      rejectedCount: rows.filter((row) => row.stage === "rejected").length,
      staleCount: rows.filter((row) => row.stage === "stale").length,
      paperOnly: true,
      liveTradingAllowed: false
    }
  };
}

export function portfolioPaperOpsQueueStage(
  approval: PortfolioPaperOrderApprovalRow,
  route: PortfolioPaperOrderSimulationRouteRow | null
): PortfolioPaperOpsQueueStage {
  if (route?.routeState === "filled" || route?.simulationId) {
    return "simulated";
  }
  if (
    route?.routeState === "blocked" ||
    approval.state === "risk_rejected" ||
    approval.state === "operator_rejected" ||
    approval.state === "invalid_order"
  ) {
    return "rejected";
  }
  if (approval.state === "risk_review" || approval.riskStatus === "review" || route?.statusLabel === "Waiting for risk review") {
    return "waiting_risk";
  }
  if (approval.state === "awaiting_operator_review") {
    return "waiting_human";
  }
  if (route?.routeState === "ready" || approval.state === "ready_for_simulation") {
    return "ready_for_simulation";
  }
  return "rejected";
}

export function portfolioPaperOpsQueueAction(stage: PortfolioPaperOpsQueueStage): PortfolioPaperOpsQueueAction {
  if (stage === "ready_for_simulation") {
    return "simulate-order";
  }
  if (stage === "simulated") {
    return "replay-simulation";
  }
  if (stage === "waiting_risk" || stage === "waiting_human") {
    return "review-order";
  }
  if (stage === "rejected") {
    return "open-approval";
  }
  return "open-portfolio";
}

export function portfolioPaperOpsStatusLabel(stage: PortfolioPaperOpsQueueStage): string {
  return {
    waiting_risk: "Waiting for risk review",
    waiting_human: "Waiting for operator review",
    ready_for_simulation: "Ready for simulator",
    simulated: "Already simulated",
    rejected: "Risk blocked",
    stale: "Evidence stale"
  }[stage];
}

export function portfolioPaperOpsQueueCanRunAction(
  stage: PortfolioPaperOpsQueueStage,
  route: PortfolioPaperOrderSimulationRouteRow | null
): boolean {
  if (stage === "ready_for_simulation") {
    return Boolean(route?.canSimulate);
  }
  return true;
}

export function portfolioPaperOpsQueueTone(stage: PortfolioPaperOpsQueueStage): PortfolioPaperOpsQueueRow["tone"] {
  if (stage === "ready_for_simulation") {
    return "positive";
  }
  if (stage === "rejected") {
    return "risk";
  }
  if (stage === "simulated") {
    return "neutral";
  }
  return "warning";
}

export function portfolioPaperOpsQueueStagePriority(stage: PortfolioPaperOpsQueueStage): number {
  return {
    stale: 0,
    waiting_risk: 1,
    waiting_human: 2,
    ready_for_simulation: 3,
    rejected: 4,
    simulated: 5
  }[stage];
}

export function portfolioPaperOrderSimulationRouteGuardDetail(
  simulation: PortfolioPaperOrderSimulationSnapshot
): string {
  const routeRisk = simulation.routeRisk;
  if (!routeRisk?.status) {
    return "";
  }
  const cashAfter =
    typeof routeRisk.cashAfter === "number" ? `; cash after ${formatAssumptionCurrency(routeRisk.cashAfter)}` : "";
  if (routeRisk.status === "passed") {
    return `route guard passed${cashAfter}`;
  }
  const reasons = Array.isArray(routeRisk.blockedReasons) ? routeRisk.blockedReasons.filter(Boolean).join(", ") : "";
  return `route guard ${routeRisk.status}${reasons ? ` (${reasons})` : ""}${cashAfter}`;
}

export function portfolioRouteRiskPositiveNumber(value: unknown, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

export function portfolioRouteRiskPct(value: unknown, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback;
  }
  return Math.min(numeric, 100);
}

export function roundPortfolioRouteRiskNumber(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function buildPortfolioPaperOrderStateHistoryRows(
  histories: PortfolioPaperOrderStateHistorySnapshot[] | null | undefined,
  limit = 12
): PortfolioPaperOrderStateHistoryRow[] {
  return (histories ?? [])
    .flatMap((history) =>
      history.orders.flatMap((order) =>
        order.events.map((event) => ({
          id: event.eventId,
          batchId: order.batchId,
          baseRunId: order.baseRunId,
          orderId: order.orderId,
          symbol: order.symbol,
          timestamp: event.timestamp,
          state: event.state,
          label: event.label,
          actor: event.actor,
          source: event.source,
          reason: event.reason,
          quantity: formatQuantity(order.quantity),
          notionalValue: order.notionalValue.toFixed(2),
          focusQuery: portfolioStateHistoryFocusQuery(order, event),
          adapterEvidenceLabel: portfolioStateHistoryAdapterEvidenceLabel(event.metadata),
          tone: portfolioPaperOrderStateTone(event.state)
        }))
      )
    )
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function portfolioStateHistoryFocusQuery(
  order: PortfolioPaperOrderStateHistoryOrderSnapshot,
  event: PortfolioPaperOrderStateHistoryEventSnapshot
): string {
  const metadata = event.metadata ?? {};
  const tokens = [
    order.batchId,
    order.orderId,
    order.symbol,
    event.state,
    event.eventId,
    typeof metadata.simulationId === "string" ? metadata.simulationId : "",
    typeof metadata.adapterPaperExecutionId === "string" ? metadata.adapterPaperExecutionId : "",
    typeof metadata.adapterManifestValidationId === "string" ? metadata.adapterManifestValidationId : ""
  ];
  return tokens.filter(Boolean).join(" ");
}

export function portfolioStateHistoryAdapterEvidenceLabel(metadata: Record<string, unknown> | undefined): string {
  const adapterPaperExecutionId =
    typeof metadata?.adapterPaperExecutionId === "string" ? metadata.adapterPaperExecutionId : "";
  if (!adapterPaperExecutionId) {
    return "";
  }
  const evidence =
    metadata?.adapterPaperExecutionEvidence && typeof metadata.adapterPaperExecutionEvidence === "object"
      ? (metadata.adapterPaperExecutionEvidence as Record<string, unknown>)
      : {};
  const fillSummary = typeof evidence.fillSummary === "string" ? evidence.fillSummary : "fill evidence recorded";
  const manifestValidationId =
    typeof metadata?.adapterManifestValidationId === "string"
      ? metadata.adapterManifestValidationId
      : typeof evidence.manifestValidationId === "string"
        ? evidence.manifestValidationId
        : "";
  return [
    `Adapter ${adapterPaperExecutionId}`,
    fillSummary,
    manifestValidationId ? `manifest ${manifestValidationId}` : ""
  ]
    .filter(Boolean)
    .join(" · ");
}

export function buildPaperPositionRows(
  workspace: TerminalWorkspace,
  execution?: PaperExecutionSnapshot | null
): PaperPositionRow[] {
  if (execution) {
    const positionRows = Object.entries(execution.account.positions)
      .filter(([, quantity]) => quantity > 0)
      .map(([symbol, quantity]) => {
        const avgCost = averageFilledPrice(execution.orders, symbol);
        const markPrice = resolveExecutionMarkPrice(workspace, execution, symbol, avgCost);
        const marketValue = quantity * markPrice;
        const costBasis = quantity * avgCost;
        const unrealizedPnl = marketValue - costBasis;
        const returnPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;
        return {
          id: `paper-position-${symbol}`,
          symbol,
          quantity: formatQuantity(quantity),
          avgCost: avgCost.toFixed(2),
          markPrice: markPrice.toFixed(2),
          marketValue: marketValue.toFixed(2),
          unrealizedPnl: formatSignedCurrency(unrealizedPnl),
          returnPct: formatSignedPct(returnPct),
          status: "paper" as const,
          tone: returnPct > 0 ? ("positive" as const) : returnPct < 0 ? ("warning" as const) : ("neutral" as const)
        };
      });
    if (positionRows.length) {
      return positionRows;
    }
  }

  const price = resolvePaperOrderPrice(workspace);
  if (!buildResearchRunContextBinding(workspace).canUseRun) {
    return [
      {
        id: "selected-paper-position",
        symbol: workspace.selectedInstrument.symbol,
        quantity: "0",
        avgCost: "-",
        markPrice: price.toFixed(2),
        marketValue: "0.00",
        unrealizedPnl: "-",
        returnPct: "N/A",
        status: "blocked",
        tone: "warning"
      }
    ];
  }

  const quantity = calculatePaperQuantity(workspace.selectedInstrument.market, price, resolvePaperTargetNotional(workspace));
  const marketValue = quantity * price;
  const returnMetric = metricValue(workspace, "Return", "N/A");
  const returnPct = parsePercentMetric(returnMetric);
  const costBasis = returnPct === null ? marketValue : marketValue / (1 + returnPct / 100);
  const avgCost = quantity > 0 ? costBasis / quantity : 0;
  const unrealizedPnl = marketValue - costBasis;
  const tone: PaperPositionRow["tone"] = returnPct === null ? "neutral" : returnPct < 0 ? "warning" : "positive";

  return [
    {
      id: "selected-paper-position",
      symbol: workspace.selectedInstrument.symbol,
      quantity: String(quantity),
      avgCost: avgCost.toFixed(2),
      markPrice: price.toFixed(2),
      marketValue: marketValue.toFixed(2),
      unrealizedPnl: formatSignedCurrency(unrealizedPnl),
      returnPct: returnMetric,
      status: "paper",
      tone
    }
  ];
}

export function buildBrokerAdapterRows(workspace: TerminalWorkspace): BrokerAdapterRow[] {
  const liveBlocked = !workspace.execution.liveEnabled;
  return [
    {
      id: "paper-local",
      market: "ashare",
      adapter: "Local Paper Trading",
      route: "paper",
      status: "paper_ready",
      certification: "Simulated fills, order log, and risk checks are available locally.",
      nextStep: "Use paper execution for research runs before certifying live adapters.",
      tone: "positive"
    },
    {
      id: "ashare-live",
      market: "ashare",
      adapter: "A-share broker interface",
      route: "live",
      status: "interface_only",
      certification: "No certified A-share broker API is connected.",
      nextStep: "Keep live trading blocked until a legal broker adapter passes certification.",
      tone: liveBlocked ? "risk" : "warning"
    },
    {
      id: "us-live",
      market: "us",
      adapter: "IBKR / Alpaca adapter shape",
      route: "live",
      status: "config_required",
      certification: "Adapter shape is reserved; paper credentials are not configured.",
      nextStep: "Configure a paper account and certify submit, cancel, fill, reject, and reconnect paths.",
      tone: "warning"
    },
    {
      id: "crypto-live",
      market: "crypto",
      adapter: "ccxt exchange adapter shape",
      route: "live",
      status: "config_required",
      certification: "Exchange adapter shape is reserved; API keys are not configured.",
      nextStep: "Start with sandbox or testnet routes plus max order and emergency-stop limits.",
      tone: "warning"
    }
  ];
}

export function buildExecutionAdapterLedgerRows(
  ledger: ExecutionAdapterLedgerSnapshot | null | undefined,
  limit = 8
): ExecutionAdapterLedgerRow[] {
  return (ledger?.adapters ?? [])
    .flatMap((adapter) => {
      const passedGates = adapter.gates.filter((gate) => gate.passed).length;
      const gateSummary = `${passedGates}/${adapter.gates.length} gates`;
      return adapter.events.map((event) => ({
        id: event.eventId,
        adapterId: adapter.id,
        adapter: adapter.adapter,
        market: adapter.market,
        route: adapter.route,
        timestamp: event.timestamp,
        state: event.state,
        label: event.label,
        actor: event.actor,
        source: event.source,
        reason: event.reason,
        nextStep: adapter.nextStep,
        gateSummary,
        liveTradingAllowed: event.liveTradingAllowed,
        tone: executionAdapterLedgerTone(event.state)
      }));
    })
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}
