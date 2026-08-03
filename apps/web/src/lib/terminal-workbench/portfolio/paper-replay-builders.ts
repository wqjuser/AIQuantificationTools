import type { PaperExecutionSnapshot, PaperExecutionSummaryTile, PaperTradingRow } from "../audit/execution-contracts";
import type { TerminalWorkspace } from "../core/workspace-contracts";
import { buildLiveBoundaryReplayGateItem, filterValidReplayAdapterPaperExecutions, paperExecutionReplayBoundaryReasons, paperExecutionReplayGateDetail, paperExecutionReplayGateHeadline, paperExecutionReplayGateItem, paperExecutionReplayGateStatus } from "../execution/ledger-builders";
import type { ExecutionAdapterPaperExecutionRow } from "../execution/ops-contracts";
import type { PaperExecutionReplayGate, PaperExecutionReplayGateInput, PaperExecutionReplayGateItem, PortfolioPaperOrderApprovalRow, PortfolioPaperOrderLatestSimulationSummary, PortfolioPaperOrderLifecycleRow, PortfolioPaperOrderReplayOrderSnapshot, PortfolioPaperOrderReplayPositionRow, PortfolioPaperOrderReplaySnapshot, PortfolioPaperOrderReplaySummaryTile, PortfolioPaperOrderSimulationSnapshot, PortfolioPaperOrderStateHistoryRow, PortfolioPaperOrderStateHistorySnapshot } from "./paper-contracts";
import { buildRiskApprovalSummary } from "./report-builders";
import type { ResearchRunDataPreparationEvidence } from "../research/workspace-contracts";
import { formatQuantity, formatSignedCurrency } from "../strategy/backtest-builders";
import { calculatePaperQuantity, resolvePaperTargetNotional } from "../strategy/comparison-builders";
import { buildResearchRunContextBinding } from "../strategy/experiment-builders";
import { formatAssumptionCurrency, resolvePaperOrderPrice } from "../strategy/workflow-builders";

export function buildPaperTradingRows(workspace: TerminalWorkspace): PaperTradingRow[] {
  const auditBinding = buildResearchRunContextBinding(workspace);
  if (!auditBinding.canUseRun || !workspace.researchRun) {
    const orderReason =
      auditBinding.status === "mismatched" ? auditBinding.detail : "Run Pipeline before staging a paper order.";
    const riskReason =
      auditBinding.status === "mismatched"
        ? "Current research context is not bound to a matching audited run; paper route remains blocked."
        : "No audited research run is bound; paper route remains blocked.";
    return [
      {
        id: "paper-order",
        symbol: workspace.selectedInstrument.symbol,
        side: "BUY",
        quantity: "-",
        price: "-",
        notional: "-",
        status: "blocked",
        reason: orderReason,
        tone: "warning"
      },
      {
        id: "risk-check",
        symbol: workspace.selectedInstrument.symbol,
        side: "RISK",
        quantity: "-",
        price: "-",
        notional: "-",
        status: "blocked",
        reason: riskReason,
        tone: "warning"
      },
      {
        id: "account-sync",
        symbol: "PAPER",
        side: "SYNC",
        quantity: "-",
        price: "-",
        notional: "0.00",
        status: "paper",
        reason: "Local paper account only; broker account synchronization is not connected.",
        tone: "neutral"
      }
    ];
  }

  const price = resolvePaperOrderPrice(workspace);
  const quantity = calculatePaperQuantity(workspace.selectedInstrument.market, price, resolvePaperTargetNotional(workspace));
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const notional = quantity * price;
  const approval = buildRiskApprovalSummary(workspace);
  const blockedApprovalGate = approval.gates.find((gate) => gate.status === "blocked");

  if (approval.status === "blocked") {
    return [
      {
        id: "paper-order",
        symbol: workspace.selectedInstrument.symbol,
        side: "BUY",
        quantity: String(quantity),
        price: price.toFixed(2),
        notional: notional.toFixed(2),
        status: "blocked",
        reason: "Risk approval blocked before staging paper execution.",
        tone: "risk"
      },
      {
        id: "risk-check",
        symbol: workspace.selectedInstrument.symbol,
        side: "RISK",
        quantity: "-",
        price: "-",
        notional: "-",
        status: "blocked",
        reason: blockedApprovalGate?.detail ?? "Risk approval blocked before staging paper execution.",
        tone: "risk"
      },
      {
        id: "account-sync",
        symbol: "PAPER",
        side: "SYNC",
        quantity: "-",
        price: "-",
        notional: "0.00",
        status: "paper",
        reason: "Local paper account only; broker account synchronization is not connected.",
        tone: "neutral"
      }
    ];
  }

  return [
    {
      id: "paper-order",
      symbol: workspace.selectedInstrument.symbol,
      side: "BUY",
      quantity: String(quantity),
      price: price.toFixed(2),
      notional: notional.toFixed(2),
      status: "queued",
      reason: `Paper order staged from ${workspace.strategy.name} using audited run ${workspace.researchRun.runId}; no live route is used.`,
      tone: "positive"
    },
    {
      id: "risk-check",
      symbol: workspace.selectedInstrument.symbol,
      side: "RISK",
      quantity: "-",
      price: "-",
      notional: "-",
      status: workspace.execution.liveEnabled ? "paper" : "blocked",
      reason: workspace.execution.liveEnabled
        ? "Certified live route is available but this run stays paper-first."
        : `${blockedGateCount} live gates blocked; paper route remains available.`,
      tone: workspace.execution.liveEnabled ? "neutral" : "warning"
    },
    {
      id: "account-sync",
      symbol: "PAPER",
      side: "SYNC",
      quantity: "-",
      price: "-",
      notional: "0.00",
      status: "paper",
      reason: "Local paper account only; broker account synchronization is not connected.",
      tone: "neutral"
    }
  ];
}

export function buildPaperExecutionSummaryTiles(
  workspace: TerminalWorkspace,
  execution: PaperExecutionSnapshot | null | undefined
): PaperExecutionSummaryTile[] {
  if (!execution) {
    const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
    return [
      {
        id: "account-sync",
        label: "Account sync",
        value: "No paper execution",
        detail: "Run Pipeline and submit a paper order to create a local account snapshot.",
        tone: "warning"
      },
      {
        id: "paper-positions",
        label: "Paper positions",
        value: "0 paper / 0 live",
        detail: "No filled paper positions are linked to the active audited run.",
        tone: "neutral"
      },
      {
        id: "preparation-evidence",
        label: "Preparation evidence",
        value: "Not locked",
        detail: "Paper execution has not inherited a data preparation run yet.",
        tone: "warning"
      },
      {
        id: "risk-gates",
        label: "Risk gates",
        value: workspace.execution.liveEnabled ? "live route enabled" : `${blockedGateCount} live gates blocked`,
        detail: workspace.execution.gates.map((gate) => `${gate.label}: ${gate.passed ? "passed" : "blocked"}`).join(" · "),
        tone: workspace.execution.liveEnabled ? "positive" : "warning"
      }
    ];
  }

  const paperPositions = Object.entries(execution.account.positions).filter(([, quantity]) => quantity > 0);
  const passedGates = execution.gates.filter((gate) => gate.passed).length;
  const blockedGates = execution.gates.length - passedGates;
  const preparationEvidence = execution.preparationEvidence;
  return [
    {
      id: "account-sync",
      label: "Account sync",
      value: `Cash ${formatAssumptionCurrency(execution.account.cash)} / Equity ${formatAssumptionCurrency(execution.account.equity)}`,
      detail: `Snapshot ${execution.executionId} · ${execution.mode}`,
      tone: "positive"
    },
    {
      id: "paper-positions",
      label: "Paper positions",
      value: `${paperPositions.length} paper / 0 live`,
      detail: paperPositions.length
        ? paperPositions.map(([symbol, quantity]) => `${symbol}: ${formatQuantity(quantity)}`).join(" · ")
        : "No filled paper positions are linked to the active audited run.",
      tone: paperPositions.length ? "positive" : "neutral"
    },
    {
      id: "preparation-evidence",
      label: "Preparation evidence",
      value: preparationEvidence?.runId ?? "Not locked",
      detail: preparationEvidence
        ? formatPaperExecutionPreparationEvidenceTileDetail(preparationEvidence)
        : "Paper execution has not inherited a data preparation run yet.",
      tone: preparationEvidence ? (preparationEvidence.quality.isComplete ? "positive" : "warning") : "warning"
    },
    {
      id: "risk-gates",
      label: "Risk gates",
      value: `${passedGates} passed / ${blockedGates} blocked`,
      detail: execution.gates.map((gate) => `${gate.label}: ${gate.passed ? "passed" : "blocked"}`).join(" · "),
      tone: blockedGates ? "warning" : "positive"
    }
  ];
}

export function formatPaperExecutionPreparationEvidenceTileDetail(evidence: ResearchRunDataPreparationEvidence): string {
  return `${evidence.upsertedRows} rows · ${evidence.quality.source} · ${evidence.symbol} ${evidence.timeframe}`;
}

export function buildPortfolioPaperOrderReplaySummaryTiles(
  replay: PortfolioPaperOrderReplaySnapshot | null | undefined
): PortfolioPaperOrderReplaySummaryTile[] {
  if (!replay) {
    return [
      {
        id: "portfolio-account",
        label: "Portfolio account",
        value: "No portfolio replay",
        detail: "Simulate approved portfolio orders to rebuild paper cash and positions.",
        tone: "warning"
      },
      {
        id: "portfolio-positions",
        label: "Replay positions",
        value: "0 position / 0 fills",
        detail: "No applied paper fills are linked to this portfolio run yet.",
        tone: "neutral"
      },
      {
        id: "portfolio-replay-boundary",
        label: "Execution boundary",
        value: "Paper only",
        detail: "Live execution remains blocked until adapter certification and human confirmation pass.",
        tone: "warning"
      }
    ];
  }

  const warningCount = replay.summary.warnings.length;
  return [
    {
      id: "portfolio-account",
      label: "Portfolio account",
      value: `Cash ${formatAssumptionCurrency(replay.account.cash)} / Equity ${formatAssumptionCurrency(replay.account.equity)}`,
      detail: `Replay ${replay.baseRunId} · ${replay.mode}`,
      tone: warningCount ? "warning" : "positive"
    },
    {
      id: "portfolio-positions",
      label: "Replay positions",
      value: `${replay.summary.positionCount} position${replay.summary.positionCount === 1 ? "" : "s"} / ${
        replay.summary.filledOrders
      } fill${replay.summary.filledOrders === 1 ? "" : "s"}`,
      detail: `Buy ${formatAssumptionCurrency(replay.summary.buyNotional)} / Sell ${formatAssumptionCurrency(
        replay.summary.sellNotional
      )} / Net ${formatAssumptionCurrency(replay.summary.netNotional)}`,
      tone: replay.summary.positionCount ? "positive" : "neutral"
    },
    {
      id: "portfolio-replay-boundary",
      label: "Execution boundary",
      value: replay.liveExecutionBlocked ? "Paper only" : "Live route open",
      detail: warningCount
        ? `${warningCount} replay warning${warningCount === 1 ? "" : "s"}: ${replay.summary.warnings.slice(0, 2).join(" · ")}`
        : "Replay is derived from approved local paper fills; no broker route is used.",
      tone: replay.liveExecutionBlocked ? (warningCount ? "warning" : "neutral") : "risk"
    }
  ];
}

export function buildPortfolioPaperOrderReplayPositionRows(
  replay: PortfolioPaperOrderReplaySnapshot | null | undefined
): PortfolioPaperOrderReplayPositionRow[] {
  return [...(replay?.positions ?? [])]
    .sort((left, right) => right.marketValue - left.marketValue)
    .map((position) => ({
      id: `portfolio-replay-position-${position.symbol}`,
      symbol: position.symbol,
      quantity: formatQuantity(position.quantity),
      avgCost: position.avgCost.toFixed(2),
      lastPrice: position.lastPrice.toFixed(2),
      marketValue: position.marketValue.toFixed(2),
      unrealizedPnl: formatSignedCurrency(position.unrealizedPnl),
      tone: position.unrealizedPnl > 0 ? "positive" : position.unrealizedPnl < 0 ? "warning" : "neutral"
    }));
}

export function buildPortfolioPaperOrderLatestSimulationSummary(
  simulations: PortfolioPaperOrderSimulationSnapshot[] | null | undefined,
  replay: PortfolioPaperOrderReplaySnapshot | null | undefined,
  histories: PortfolioPaperOrderStateHistorySnapshot[] | null | undefined
): PortfolioPaperOrderLatestSimulationSummary | null {
  const latest = [...(simulations ?? [])].sort(
    (left, right) => right.simulatedAt.localeCompare(left.simulatedAt) || right.simulationId.localeCompare(left.simulationId)
  )[0];
  if (!latest) {
    return null;
  }

  const replayOrder = replay?.orders.find(
    (order) =>
      order.simulationId === latest.simulationId ||
      (order.batchId === latest.batchId && order.orderId === latest.orderId && order.symbol === latest.symbol)
  );
  const stateEvent =
    histories
      ?.flatMap((history) => history.orders)
      .filter(
        (order) => order.batchId === latest.batchId && order.orderId === latest.orderId && order.symbol === latest.symbol
      )
      .flatMap((order) => order.events)
      .filter((event) => event.state === "simulation_filled")
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.eventId.localeCompare(left.eventId))[0] ?? null;
  const cashAfter = replayOrder?.cashAfter ?? replay?.account.cash;
  const positionAfter = replayOrder?.positionAfter ?? replay?.account.positions[latest.symbol];
  const timelineLabel = stateEvent
    ? `${stateEvent.label} · ${stateEvent.actor || stateEvent.source} · ${stateEvent.reason}`
    : "Simulation recorded · paper-simulator · State history pending.";
  const adapterEvidenceLabel = portfolioReplayOrderAdapterEvidenceLabel(replayOrder);

  return {
    id: `portfolio-latest-simulation-${latest.simulationId}`,
    simulationId: latest.simulationId,
    batchId: latest.batchId,
    orderId: latest.orderId,
    symbol: latest.symbol,
    side: latest.side,
    simulatedAt: latest.simulatedAt,
    fillLabel: `${latest.symbol} · ${latest.side} · ${formatQuantity(latest.quantity)} @ ${formatQuantity(latest.fillPrice)}`,
    orderLabel: `${latest.orderId} · Notional ${formatAssumptionCurrency(latest.notionalValue)}`,
    accountLabel: `Cash ${cashAfter === undefined ? "-" : formatAssumptionCurrency(cashAfter)} / Position ${
      positionAfter === undefined ? "-" : formatQuantity(positionAfter)
    }`,
    timelineLabel,
    adapterEvidenceLabel,
    boundaryLabel: `${latest.paperOnly ? "Paper only" : "Live route"} · ${
      latest.liveExecutionBlocked ? "live blocked" : "live route open"
    }`,
    focusQuery: `${latest.simulationId} ${latest.batchId} ${latest.orderId} ${latest.symbol} simulation_filled`,
    stateEventId: stateEvent?.eventId ?? null,
    tone: latest.paperOnly && latest.liveExecutionBlocked ? "positive" : "risk"
  };
}

export function portfolioReplayOrderAdapterEvidenceLabel(
  order: PortfolioPaperOrderReplayOrderSnapshot | null | undefined
): string {
  if (!order?.adapterPaperExecutionId) {
    return "No adapter replay evidence";
  }
  const evidence = order.adapterPaperExecutionEvidence ?? {};
  const fillSummary = typeof evidence.fillSummary === "string" ? evidence.fillSummary : "fill evidence recorded";
  const manifestValidationId =
    order.adapterManifestValidationId ||
    (typeof evidence.manifestValidationId === "string" ? evidence.manifestValidationId : "");
  return [
    `Adapter ${order.adapterPaperExecutionId}`,
    fillSummary,
    manifestValidationId ? `manifest ${manifestValidationId}` : ""
  ]
    .filter(Boolean)
    .join(" · ");
}

export function buildPaperExecutionReplayGate(input: PaperExecutionReplayGateInput): PaperExecutionReplayGate {
  const currentRunId = (input.currentRunId ?? "").trim();
  const paperExecution = input.paperExecution ?? null;
  const lifecycleRows = (input.portfolioOrderLifecycleRows ?? []).filter((row) => row.baseRunId === currentRunId);
  const approvalRows = (input.portfolioApprovalRows ?? []).filter((row) => row.baseRunId === currentRunId);
  const simulations = (input.portfolioOrderSimulations ?? []).filter((row) => row.baseRunId === currentRunId);
  const stateRows = (input.portfolioStateHistoryRows ?? []).filter((row) => row.baseRunId === currentRunId);
  const replay = input.portfolioOrderReplay ?? null;
  const replayMatchesCurrentRun = Boolean(replay && replay.baseRunId === currentRunId);
  const filledPaperOrders = paperExecution?.orders.filter((order) => order.status === "filled").length ?? 0;
  const approvedPortfolioOrders = approvalRows.filter((row) => Boolean(row.approvedBy || row.reviewedAt)).length;
  const filledSimulations = simulations.filter(
    (row) => row.fillStatus === "filled" && row.paperOnly && row.liveExecutionBlocked
  );
  const filledStateEvents = stateRows.filter((row) => row.state === "simulation_filled");
  const validAdapterExecutions = filterValidReplayAdapterPaperExecutions(
    input.adapterPaperExecutionRows ?? [],
    new Set(filledSimulations.map((row) => row.adapterPaperExecutionId).filter(Boolean) as string[])
  );
  const unsafeBoundaryReasons = paperExecutionReplayBoundaryReasons({
    adapterPaperExecutionRows: input.adapterPaperExecutionRows ?? [],
    portfolioOrderReplay: replay,
    portfolioOrderSimulations: simulations
  });

  const items: PaperExecutionReplayGateItem[] = [
    buildSinglePaperExecutionReplayGateItem(currentRunId, paperExecution, filledPaperOrders),
    buildPortfolioOrderLedgerReplayGateItem(currentRunId, lifecycleRows),
    buildPortfolioApprovalReplayGateItem(currentRunId, approvalRows, approvedPortfolioOrders),
    buildPortfolioSimulationReplayGateItem(currentRunId, simulations, filledSimulations.length),
    buildPortfolioStateHistoryReplayGateItem(currentRunId, stateRows, filledStateEvents.length),
    buildPortfolioReplayGateItem(currentRunId, replay, replayMatchesCurrentRun),
    buildAdapterPaperExecutionReplayGateItem(input.adapterPaperExecutionRows ?? [], validAdapterExecutions),
    buildLiveBoundaryReplayGateItem(unsafeBoundaryReasons)
  ];
  const passedCount = items.filter((item) => item.status === "passed").length;
  const currentBlocker = items.find((item) => item.status !== "passed") ?? null;
  const status = paperExecutionReplayGateStatus(items);
  const latestEvidenceId =
    validAdapterExecutions[0]?.id ??
    filledSimulations
      .slice()
      .sort((left, right) => right.simulatedAt.localeCompare(left.simulatedAt) || right.simulationId.localeCompare(left.simulationId))[0]
      ?.simulationId ??
    (replayMatchesCurrentRun ? replay?.baseRunId ?? null : null);

  return {
    status,
    tone: status === "replay_ready" ? "positive" : status === "partial" ? "warning" : "risk",
    headline: paperExecutionReplayGateHeadline(status),
    detail: paperExecutionReplayGateDetail(status, currentBlocker),
    passedCount,
    totalCount: items.length,
    currentBlockerId: currentBlocker?.id ?? null,
    currentBlockerLabel: currentBlocker?.label ?? null,
    latestEvidenceId,
    replayReady: status === "replay_ready",
    preLiveReviewAllowed: false,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    metrics: {
      filledPaperOrders,
      portfolioOrders: lifecycleRows.reduce((total, row) => total + Math.max(0, row.orderCount || 0), 0),
      approvedPortfolioOrders,
      portfolioFilledOrders: replayMatchesCurrentRun ? replay?.summary.filledOrders ?? 0 : filledSimulations.length,
      stateHistoryFilledEvents: filledStateEvents.length,
      adapterPaperExecutions: validAdapterExecutions.length,
      replayWarnings: replayMatchesCurrentRun ? replay?.summary.warnings.length ?? 0 : 0
    },
    items
  };
}

export function buildSinglePaperExecutionReplayGateItem(
  currentRunId: string,
  paperExecution: PaperExecutionSnapshot | null,
  filledPaperOrders: number
): PaperExecutionReplayGateItem {
  if (!currentRunId) {
    return paperExecutionReplayGateItem(
      "single-paper-execution",
      "Single-run paper execution",
      "blocked",
      "No active run",
      "No active audited run is selected for replay.",
      "risk"
    );
  }
  if (!paperExecution) {
    return paperExecutionReplayGateItem(
      "single-paper-execution",
      "Single-run paper execution",
      "blocked",
      "No paper execution",
      "A filled paper execution snapshot is required before pre-live review.",
      "risk"
    );
  }
  if (paperExecution.runId !== currentRunId) {
    return paperExecutionReplayGateItem(
      "single-paper-execution",
      "Single-run paper execution",
      "stale",
      paperExecution.executionId,
      `Paper execution ${paperExecution.executionId} is bound to ${paperExecution.runId}, not ${currentRunId}.`,
      "risk"
    );
  }
  if (filledPaperOrders <= 0) {
    return paperExecutionReplayGateItem(
      "single-paper-execution",
      "Single-run paper execution",
      "blocked",
      paperExecution.executionId,
      "Paper execution has no filled orders to replay.",
      "risk"
    );
  }
  const blockedGate = paperExecution.gates.find((gate) => !gate.passed);
  if (blockedGate) {
    return paperExecutionReplayGateItem(
      "single-paper-execution",
      "Single-run paper execution",
      "blocked",
      paperExecution.executionId,
      `${blockedGate.label}: ${blockedGate.reason}`,
      "risk"
    );
  }
  return paperExecutionReplayGateItem(
    "single-paper-execution",
    "Single-run paper execution",
    "passed",
    paperExecution.executionId,
    `${filledPaperOrders} filled paper order${filledPaperOrders === 1 ? "" : "s"} can be replayed from ${paperExecution.mode}.`,
    "positive"
  );
}

export function buildPortfolioOrderLedgerReplayGateItem(
  currentRunId: string,
  lifecycleRows: PortfolioPaperOrderLifecycleRow[]
): PaperExecutionReplayGateItem {
  if (!currentRunId || lifecycleRows.length === 0) {
    return paperExecutionReplayGateItem(
      "portfolio-order-ledger",
      "Portfolio order ledger",
      "blocked",
      "No portfolio orders",
      "Portfolio paper order ledger is required for replay integrity.",
      "risk"
    );
  }
  const routableOrders = lifecycleRows.reduce((total, row) => total + Math.max(0, row.routableOrders), 0);
  if (!routableOrders) {
    return paperExecutionReplayGateItem(
      "portfolio-order-ledger",
      "Portfolio order ledger",
      "blocked",
      lifecycleRows[0]?.id ?? currentRunId,
      "Portfolio orders are present but none are routable.",
      "risk"
    );
  }
  return paperExecutionReplayGateItem(
    "portfolio-order-ledger",
    "Portfolio order ledger",
    "passed",
    lifecycleRows[0]?.auditEventId || lifecycleRows[0]?.id || currentRunId,
    `${routableOrders} routable portfolio order${routableOrders === 1 ? "" : "s"} recorded.`,
    "positive"
  );
}

export function buildPortfolioApprovalReplayGateItem(
  currentRunId: string,
  approvalRows: PortfolioPaperOrderApprovalRow[],
  approvedPortfolioOrders: number
): PaperExecutionReplayGateItem {
  if (!currentRunId || approvalRows.length === 0) {
    return paperExecutionReplayGateItem(
      "portfolio-approval-ledger",
      "Portfolio approvals",
      "blocked",
      "No approvals",
      "Human approval evidence is required before portfolio replay can be trusted.",
      "risk"
    );
  }
  if (!approvedPortfolioOrders) {
    return paperExecutionReplayGateItem(
      "portfolio-approval-ledger",
      "Portfolio approvals",
      "blocked",
      approvalRows[0]?.id ?? currentRunId,
      "Portfolio order approvals are present but no order has an operator review timestamp.",
      "risk"
    );
  }
  return paperExecutionReplayGateItem(
    "portfolio-approval-ledger",
    "Portfolio approvals",
    "passed",
    approvalRows[0]?.id ?? currentRunId,
    `${approvedPortfolioOrders} approved portfolio order${approvedPortfolioOrders === 1 ? "" : "s"} recorded.`,
    "positive"
  );
}

export function buildPortfolioSimulationReplayGateItem(
  currentRunId: string,
  simulations: PortfolioPaperOrderSimulationSnapshot[],
  filledSimulationCount: number
): PaperExecutionReplayGateItem {
  if (!currentRunId || simulations.length === 0) {
    return paperExecutionReplayGateItem(
      "portfolio-simulation-ledger",
      "Portfolio simulations",
      "blocked",
      "No simulations",
      "Approved portfolio orders must be simulated before replay.",
      "risk"
    );
  }
  if (!filledSimulationCount) {
    return paperExecutionReplayGateItem(
      "portfolio-simulation-ledger",
      "Portfolio simulations",
      "blocked",
      simulations[0]?.simulationId ?? currentRunId,
      "Portfolio simulations exist but no paper-only filled simulation is available.",
      "risk"
    );
  }
  return paperExecutionReplayGateItem(
    "portfolio-simulation-ledger",
    "Portfolio simulations",
    "passed",
    simulations[0]?.simulationId ?? currentRunId,
    `${filledSimulationCount} paper-only filled simulation${filledSimulationCount === 1 ? "" : "s"} recorded.`,
    "positive"
  );
}

export function buildPortfolioStateHistoryReplayGateItem(
  currentRunId: string,
  stateRows: PortfolioPaperOrderStateHistoryRow[],
  filledStateEventCount: number
): PaperExecutionReplayGateItem {
  if (!currentRunId || stateRows.length === 0) {
    return paperExecutionReplayGateItem(
      "portfolio-state-history",
      "Portfolio state history",
      "blocked",
      "No state history",
      "State history is required to replay order lifecycle transitions.",
      "risk"
    );
  }
  if (!filledStateEventCount) {
    return paperExecutionReplayGateItem(
      "portfolio-state-history",
      "Portfolio state history",
      "blocked",
      stateRows[0]?.id ?? currentRunId,
      "State history exists but no simulation_filled event is recorded.",
      "risk"
    );
  }
  return paperExecutionReplayGateItem(
    "portfolio-state-history",
    "Portfolio state history",
    "passed",
    stateRows[0]?.id ?? currentRunId,
    `${filledStateEventCount} simulation_filled state event${filledStateEventCount === 1 ? "" : "s"} recorded.`,
    "positive"
  );
}

export function buildPortfolioReplayGateItem(
  currentRunId: string,
  replay: PortfolioPaperOrderReplaySnapshot | null,
  replayMatchesCurrentRun: boolean
): PaperExecutionReplayGateItem {
  if (!currentRunId || !replay) {
    return paperExecutionReplayGateItem(
      "portfolio-replay",
      "Portfolio replay",
      "blocked",
      "No replay",
      "Portfolio cash and position replay is required before pre-live review.",
      "risk"
    );
  }
  if (!replayMatchesCurrentRun) {
    return paperExecutionReplayGateItem(
      "portfolio-replay",
      "Portfolio replay",
      "stale",
      replay.baseRunId,
      `Portfolio replay is bound to ${replay.baseRunId}, not ${currentRunId}.`,
      "risk"
    );
  }
  if (!replay.paperOnly || !replay.liveExecutionBlocked) {
    return paperExecutionReplayGateItem(
      "portfolio-replay",
      "Portfolio replay",
      "blocked",
      replay.baseRunId,
      "Portfolio replay boundary must remain paper-only and live-blocked.",
      "risk"
    );
  }
  if (replay.summary.filledOrders <= 0) {
    return paperExecutionReplayGateItem(
      "portfolio-replay",
      "Portfolio replay",
      "blocked",
      replay.baseRunId,
      "Portfolio replay has no applied filled orders.",
      "risk"
    );
  }
  if (replay.summary.warnings.length) {
    return paperExecutionReplayGateItem(
      "portfolio-replay",
      "Portfolio replay",
      "review",
      replay.baseRunId,
      `${replay.summary.warnings.length} replay warning${replay.summary.warnings.length === 1 ? "" : "s"} need review.`,
      "warning"
    );
  }
  return paperExecutionReplayGateItem(
    "portfolio-replay",
    "Portfolio replay",
    "passed",
    replay.baseRunId,
    `${replay.summary.filledOrders} filled replay order${replay.summary.filledOrders === 1 ? "" : "s"} applied.`,
    "positive"
  );
}

export function buildAdapterPaperExecutionReplayGateItem(
  adapterPaperExecutionRows: ExecutionAdapterPaperExecutionRow[],
  validAdapterExecutions: ExecutionAdapterPaperExecutionRow[]
): PaperExecutionReplayGateItem {
  if (!adapterPaperExecutionRows.length) {
    return paperExecutionReplayGateItem(
      "adapter-paper-execution",
      "Adapter paper execution",
      "blocked",
      "No adapter execution",
      "Adapter paper execution evidence is required to connect replay to the adapter chain.",
      "risk"
    );
  }
  if (!validAdapterExecutions.length) {
    return paperExecutionReplayGateItem(
      "adapter-paper-execution",
      "Adapter paper execution",
      "blocked",
      adapterPaperExecutionRows[0]?.id ?? "adapter-paper-execution",
      "Adapter paper execution must have a recorded paper fill with no submitted order or route execution.",
      "risk"
    );
  }
  const latest = validAdapterExecutions[0];
  return paperExecutionReplayGateItem(
    "adapter-paper-execution",
    "Adapter paper execution",
    "passed",
    latest.id,
    `${latest.adapterId} recorded ${latest.simulatedSide} ${latest.simulatedQuantity} ${latest.simulatedSymbol} as local paper evidence.`,
    "positive"
  );
}
