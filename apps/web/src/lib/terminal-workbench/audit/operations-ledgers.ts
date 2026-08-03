import type { ExecutionAdapterPaperExecutionAuditLedgerRow, ExecutionAdapterPaperExecutionAuditLedgerSummary, MarketDataRefreshOverrideAuditLedgerRow, PortfolioPaperOrderAuditEventKind, PortfolioPaperOrderAuditLedgerRow, PortfolioPaperOrderAuditLedgerSummary } from "./execution-contracts";
import type { AuditEvidenceReportLedgerEventRecord } from "./report-contracts";
import { auditReportLedgerMetadataBoolean, auditReportLedgerMetadataHas, auditReportLedgerMetadataNumber, auditReportLedgerMetadataStringList, auditReportLedgerMetadataText } from "./signing-key-ledger";

export function filterMarketDataRefreshOverrideAuditLedgerRows(
  rows: MarketDataRefreshOverrideAuditLedgerRow[],
  query: string
): MarketDataRefreshOverrideAuditLedgerRow[] {
  const queryTokens = query.trim().toLowerCase().split(/\s+/u).filter(Boolean);
  if (!queryTokens.length) {
    return rows;
  }
  return rows.filter((row) =>
    queryTokens.every((token) =>
      [
        row.id,
        row.actionScope,
        row.affectedContextsLabel,
        row.affectedSymbolsLabel,
        row.boundary,
        row.createdAt,
        row.detail,
        row.liveTradingAllowed ? "live allowed" : "live blocked",
        row.market,
        row.name,
        row.operator,
        row.overrideReason,
        row.providerHealthReason,
        row.providerHealthStatus,
        row.searchText,
        row.source,
        row.stage,
        row.statusLabel,
        row.summary,
        row.symbol,
        row.timeframe,
        row.tone,
        String(row.recentErrorCount),
        String(row.retryAfterSeconds)
      ]
        .join(" ")
        .toLowerCase()
        .includes(token)
    )
  );
}

export function buildExecutionAdapterPaperExecutionAuditLedgerRows(
  events: AuditEvidenceReportLedgerEventRecord[]
): ExecutionAdapterPaperExecutionAuditLedgerRow[] {
  return events
    .filter((event) => event.eventType === "execution_adapter_paper_execution")
    .map((event) => {
      const metadata = event.metadata ?? {};
      const fill = executionAdapterPaperExecutionAuditRecord(metadata, "simulatedFill");
      const adapterId = auditReportLedgerMetadataText(metadata, "adapterId");
      const adapterOpsStateId = auditReportLedgerMetadataText(metadata, "adapterOpsStateId");
      const manifestValidationId = auditReportLedgerMetadataText(metadata, "manifestValidationId");
      const market = auditReportLedgerMetadataText(metadata, "market");
      const route = auditReportLedgerMetadataText(metadata, "route");
      const status = auditReportLedgerMetadataText(metadata, "status");
      const paperOnly = auditReportLedgerMetadataBoolean(metadata, "paperOnly");
      const liveTradingAllowed = auditReportLedgerMetadataBoolean(metadata, "liveTradingAllowed");
      const routeExecuted = auditReportLedgerMetadataBoolean(metadata, "routeExecuted");
      const paperFillRecorded = auditReportLedgerMetadataBoolean(metadata, "paperFillRecorded");
      const statusLabel = executionAdapterPaperExecutionAuditStatusLabel(status, paperFillRecorded);
      const fillLabel = executionAdapterPaperExecutionAuditFillLabel(fill);
      const confirmationLabel = executionAdapterPaperExecutionAuditConfirmationLabel(metadata);
      const blockedReasonsLabel = executionAdapterPaperExecutionAuditBlockedReasonsLabel(metadata);
      const boundaryLabel = executionAdapterPaperExecutionAuditBoundaryLabel(paperOnly, liveTradingAllowed, routeExecuted);
      const symbol = executionAdapterPaperExecutionAuditText(fill, "symbol");
      const tone = executionAdapterPaperExecutionAuditTone(status, paperFillRecorded, liveTradingAllowed, routeExecuted);
      const searchText = [
        event.eventId,
        event.eventType,
        event.runId ?? "",
        event.stage,
        event.source,
        event.summary,
        event.detail,
        adapterId,
        adapterOpsStateId,
        manifestValidationId,
        market,
        route,
        status,
        statusLabel,
        fillLabel,
        confirmationLabel,
        blockedReasonsLabel,
        boundaryLabel,
        symbol,
        ...portfolioPaperOrderAuditMetadataSearchParts(metadata)
      ]
        .filter(Boolean)
        .join(" ");

      return {
        id: event.eventId,
        adapterId,
        adapterOpsStateId,
        blockedReasonsLabel,
        boundaryLabel,
        confirmationLabel,
        createdAt: event.createdAt,
        detail: event.detail,
        eventType: event.eventType,
        fillLabel,
        manifestValidationId,
        market,
        paperFillRecorded,
        route,
        runId: event.runId ?? "",
        searchText,
        source: event.source,
        stage: event.stage,
        statusLabel,
        summary: event.summary,
        symbol,
        tone
      };
    });
}

export function buildExecutionAdapterPaperExecutionAuditLedgerSummary(
  rows: ExecutionAdapterPaperExecutionAuditLedgerRow[]
): ExecutionAdapterPaperExecutionAuditLedgerSummary {
  const latestRow = rows.reduce<ExecutionAdapterPaperExecutionAuditLedgerRow | undefined>((latest, row) => {
    if (!latest) {
      return row;
    }
    return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
  }, undefined);

  return {
    blocked: rows.filter((row) => row.tone === "risk").length,
    filled: rows.filter((row) => row.paperFillRecorded).length,
    latestEventId: latestRow?.id ?? "",
    liveBlocked: rows.filter((row) => row.boundaryLabel.includes("live blocked")).length,
    total: rows.length
  };
}

export function filterExecutionAdapterPaperExecutionAuditLedgerRows(
  rows: ExecutionAdapterPaperExecutionAuditLedgerRow[],
  query: string
): ExecutionAdapterPaperExecutionAuditLedgerRow[] {
  const queryTokens = query.trim().toLowerCase().split(/\s+/u).filter(Boolean);
  if (!queryTokens.length) {
    return rows;
  }
  return rows.filter((row) =>
    queryTokens.every((token) =>
      [
        row.id,
        row.adapterId,
        row.adapterOpsStateId,
        row.blockedReasonsLabel,
        row.boundaryLabel,
        row.confirmationLabel,
        row.createdAt,
        row.detail,
        row.eventType,
        row.fillLabel,
        row.manifestValidationId,
        row.market,
        row.route,
        row.runId,
        row.searchText,
        row.source,
        row.stage,
        row.statusLabel,
        row.summary,
        row.symbol,
        row.tone
      ]
        .join(" ")
        .toLowerCase()
        .includes(token)
    )
  );
}

export function executionAdapterPaperExecutionAuditRecord(
  metadata: Record<string, unknown>,
  key: string
): Record<string, unknown> {
  const value = metadata[key];
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function executionAdapterPaperExecutionAuditText(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "";
}

export function executionAdapterPaperExecutionAuditStatusLabel(status: string, paperFillRecorded: boolean): string {
  if (status === "paper_execution_recorded" && paperFillRecorded) {
    return "Paper execution recorded";
  }
  if (status === "blocked") {
    return "Paper execution blocked";
  }
  return status || "Paper execution pending";
}

export function executionAdapterPaperExecutionAuditFillLabel(fill: Record<string, unknown>): string {
  const status = executionAdapterPaperExecutionAuditText(fill, "status");
  const side = executionAdapterPaperExecutionAuditText(fill, "side");
  const quantity = executionAdapterPaperExecutionAuditText(fill, "quantity");
  const symbol = executionAdapterPaperExecutionAuditText(fill, "symbol");
  const price = executionAdapterPaperExecutionAuditText(fill, "price");
  return [status, side, quantity, symbol, price ? `@ ${price}` : ""].filter(Boolean).join(" ");
}

export function executionAdapterPaperExecutionAuditConfirmationLabel(metadata: Record<string, unknown>): string {
  const required = auditReportLedgerMetadataStringList(metadata, "requiredConfirmationIds");
  const confirmed = auditReportLedgerMetadataStringList(metadata, "confirmedConfirmationIds");
  const missingCount = Math.max(0, required.length - confirmed.length);
  return `${confirmed.length} confirmed / ${missingCount} missing`;
}

export function executionAdapterPaperExecutionAuditBlockedReasonsLabel(metadata: Record<string, unknown>): string {
  const reasons = auditReportLedgerMetadataStringList(metadata, "blockedReasons");
  return reasons.length ? reasons.join(", ") : "No blockers";
}

export function executionAdapterPaperExecutionAuditBoundaryLabel(
  paperOnly: boolean,
  liveTradingAllowed: boolean,
  routeExecuted: boolean
): string {
  return [
    paperOnly ? "paper only" : "paper boundary unknown",
    liveTradingAllowed ? "live allowed" : "live blocked",
    routeExecuted ? "route executed" : "no route executed"
  ].join(" · ");
}

export function executionAdapterPaperExecutionAuditTone(
  status: string,
  paperFillRecorded: boolean,
  liveTradingAllowed: boolean,
  routeExecuted: boolean
): ExecutionAdapterPaperExecutionAuditLedgerRow["tone"] {
  if (liveTradingAllowed || routeExecuted || status === "blocked") {
    return "risk";
  }
  return status === "paper_execution_recorded" && paperFillRecorded ? "positive" : "warning";
}

export const portfolioPaperOrderAuditEventKinds: Record<string, PortfolioPaperOrderAuditEventKind> = {
  portfolio_paper_order_approval: "approval",
  portfolio_paper_order_batch: "batch",
  portfolio_paper_order_simulation: "simulation"
};

export function buildPortfolioPaperOrderAuditLedgerRows(
  events: AuditEvidenceReportLedgerEventRecord[]
): PortfolioPaperOrderAuditLedgerRow[] {
  return events
    .filter((event) => Boolean(portfolioPaperOrderAuditEventKinds[event.eventType]))
    .map((event) => {
      const eventKind = portfolioPaperOrderAuditEventKinds[event.eventType];
      const batchId = auditReportLedgerMetadataText(event.metadata, "batchId");
      const orderId = auditReportLedgerMetadataText(event.metadata, "orderId");
      const simulationId = auditReportLedgerMetadataText(event.metadata, "simulationId");
      const symbol = auditReportLedgerMetadataText(event.metadata, "symbol");
      const portfolioName = auditReportLedgerMetadataText(event.metadata, "portfolioName");
      const fillStatus = auditReportLedgerMetadataText(event.metadata, "fillStatus");
      const routeRiskStatus =
        auditReportLedgerMetadataText(event.metadata, "routeRiskStatus") ||
        auditReportLedgerMetadataText(event.metadata, "routeGuardStatus");
      const actor =
        auditReportLedgerMetadataText(event.metadata, "approvedBy") ||
        auditReportLedgerMetadataText(event.metadata, "reviewer") ||
        auditReportLedgerMetadataText(event.metadata, "operator");
      const paperOnly = auditReportLedgerMetadataBoolean(event.metadata, "paperOnly");
      const liveTradingAllowed = portfolioPaperOrderAuditLiveTradingAllowed(event.metadata);
      const boundaryLabel = portfolioPaperOrderAuditBoundaryLabel(paperOnly, liveTradingAllowed);
      const approved = auditReportLedgerMetadataBoolean(event.metadata, "approved");
      const adapterEvidenceId = auditReportLedgerMetadataText(event.metadata, "adapterPaperExecutionId");
      const orderCount =
        auditReportLedgerMetadataNumber(event.metadata, "orderCount") ||
        auditReportLedgerMetadataNumber(event.metadata, "totalOrders");
      const quantity = auditReportLedgerMetadataNumber(event.metadata, "quantity");
      const notionalValue =
        auditReportLedgerMetadataNumber(event.metadata, "notionalValue") ||
        auditReportLedgerMetadataNumber(event.metadata, "totalNotionalValue");
      const fillPrice = auditReportLedgerMetadataNumber(event.metadata, "fillPrice");
      const side = auditReportLedgerMetadataText(event.metadata, "side");
      const statusLabel = portfolioPaperOrderAuditStatusLabel(eventKind, approved, fillStatus);
      const quantityLabel = portfolioPaperOrderAuditQuantityLabel(eventKind, approved, orderCount, side, quantity);
      const valueLabel = portfolioPaperOrderAuditValueLabel(eventKind, notionalValue, symbol, orderId, fillPrice);
      const tone = portfolioPaperOrderAuditTone(eventKind, {
        approved,
        fillStatus,
        liveTradingAllowed,
        paperOnly
      });
      const searchText = [
        event.eventId,
        event.eventType,
        event.runId ?? "",
        event.stage,
        event.source,
        event.summary,
        event.detail,
        statusLabel,
        batchId,
        orderId,
        simulationId,
        symbol,
        portfolioName,
        actor,
        adapterEvidenceId,
        quantityLabel,
        valueLabel,
        boundaryLabel,
        fillStatus,
        routeRiskStatus,
        auditReportLedgerMetadataText(event.metadata, "approvalState"),
        auditReportLedgerMetadataText(event.metadata, "orderState"),
        auditReportLedgerMetadataText(event.metadata, "reason"),
        ...portfolioPaperOrderAuditMetadataSearchParts(event.metadata)
      ]
        .filter(Boolean)
        .join(" ");

      return {
        id: event.eventId,
        actor,
        adapterEvidenceId,
        batchId,
        boundaryLabel,
        createdAt: event.createdAt,
        detail: event.detail,
        eventKind,
        eventType: event.eventType,
        orderId,
        portfolioName,
        quantityLabel,
        runId: event.runId ?? "",
        searchText,
        simulationId,
        source: event.source,
        stage: event.stage,
        statusLabel,
        summary: event.summary,
        symbol,
        tone,
        valueLabel
      };
    });
}

export function buildPortfolioPaperOrderAuditLedgerSummary(
  rows: PortfolioPaperOrderAuditLedgerRow[]
): PortfolioPaperOrderAuditLedgerSummary {
  const latestRow = rows.reduce<PortfolioPaperOrderAuditLedgerRow | undefined>((latest, row) => {
    if (!latest) {
      return row;
    }
    return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
  }, undefined);

  return {
    approvals: rows.filter((row) => row.eventKind === "approval").length,
    batches: rows.filter((row) => row.eventKind === "batch").length,
    latestEventId: latestRow?.id ?? "",
    liveBlocked: rows.filter((row) => row.boundaryLabel.includes("live blocked")).length,
    simulations: rows.filter((row) => row.eventKind === "simulation").length,
    total: rows.length
  };
}

export function filterPortfolioPaperOrderAuditLedgerRows(
  rows: PortfolioPaperOrderAuditLedgerRow[],
  query: string
): PortfolioPaperOrderAuditLedgerRow[] {
  const queryTokens = query.trim().toLowerCase().split(/\s+/u).filter(Boolean);
  if (!queryTokens.length) {
    return rows;
  }
  return rows.filter((row) =>
    queryTokens.every((token) =>
      [
        row.id,
        row.actor,
        row.adapterEvidenceId,
        row.batchId,
        row.boundaryLabel,
        row.createdAt,
        row.detail,
        row.eventKind,
        row.eventType,
        row.orderId,
        row.portfolioName,
        row.quantityLabel,
        row.runId,
        row.searchText,
        row.simulationId,
        row.source,
        row.stage,
        row.statusLabel,
        row.summary,
        row.symbol,
        row.tone,
        row.valueLabel
      ]
        .join(" ")
        .toLowerCase()
        .includes(token)
    )
  );
}

export function portfolioPaperOrderAuditLiveTradingAllowed(metadata: Record<string, unknown>): boolean | null {
  if (auditReportLedgerMetadataHas(metadata, "liveTradingAllowed")) {
    return auditReportLedgerMetadataBoolean(metadata, "liveTradingAllowed");
  }
  if (auditReportLedgerMetadataBoolean(metadata, "liveExecutionBlocked")) {
    return false;
  }
  return null;
}

export function portfolioPaperOrderAuditBoundaryLabel(paperOnly: boolean, liveTradingAllowed: boolean | null): string {
  const liveBoundary =
    liveTradingAllowed === null ? "live boundary unknown" : liveTradingAllowed ? "live allowed" : "live blocked";
  return `${paperOnly ? "paper only" : "paper boundary unknown"} · ${liveBoundary}`;
}

export function portfolioPaperOrderAuditStatusLabel(
  eventKind: PortfolioPaperOrderAuditEventKind,
  approved: boolean,
  fillStatus: string
): string {
  if (eventKind === "batch") {
    return "Batch recorded";
  }
  if (eventKind === "approval") {
    return approved ? "Approval recorded" : "Approval rejected";
  }
  return fillStatus === "filled" ? "Simulation filled" : "Simulation recorded";
}

export function portfolioPaperOrderAuditQuantityLabel(
  eventKind: PortfolioPaperOrderAuditEventKind,
  approved: boolean,
  orderCount: number,
  side: string,
  quantity: number
): string {
  if (eventKind === "batch") {
    const formattedCount = portfolioPaperOrderAuditNumberLabel(orderCount);
    return `${formattedCount} ${orderCount === 1 ? "order" : "orders"}`;
  }
  if (eventKind === "approval") {
    return approved ? "approved" : "rejected";
  }
  return [side, portfolioPaperOrderAuditNumberLabel(quantity)].filter(Boolean).join(" ");
}

export function portfolioPaperOrderAuditValueLabel(
  eventKind: PortfolioPaperOrderAuditEventKind,
  notionalValue: number,
  symbol: string,
  orderId: string,
  fillPrice: number
): string {
  if (eventKind === "batch") {
    return portfolioPaperOrderAuditNumberLabel(notionalValue);
  }
  if (eventKind === "approval") {
    return symbol || orderId;
  }
  return portfolioPaperOrderAuditNumberLabel(fillPrice);
}

export function portfolioPaperOrderAuditTone(
  eventKind: PortfolioPaperOrderAuditEventKind,
  {
    approved,
    fillStatus,
    liveTradingAllowed,
    paperOnly
  }: { approved: boolean; fillStatus: string; liveTradingAllowed: boolean | null; paperOnly: boolean }
): PortfolioPaperOrderAuditLedgerRow["tone"] {
  if (liveTradingAllowed === true) {
    return "risk";
  }
  if (eventKind === "approval") {
    return approved ? "positive" : "risk";
  }
  if (eventKind === "simulation") {
    return fillStatus === "filled" && paperOnly ? "positive" : "warning";
  }
  return paperOnly ? "warning" : "neutral";
}

export function portfolioPaperOrderAuditNumberLabel(value: number): string {
  return Number.isFinite(value)
    ? value.toLocaleString("en-US", { maximumFractionDigits: 8 })
    : "";
}

export function portfolioPaperOrderAuditMetadataSearchParts(metadata: Record<string, unknown>): string[] {
  return Object.entries(metadata)
    .map(([key, value]) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return `${key} ${String(value)}`;
      }
      if (Array.isArray(value)) {
        return `${key} ${value.map((item) => String(item)).join(" ")}`;
      }
      if (value && typeof value === "object") {
        return `${key} ${JSON.stringify(value)}`;
      }
      return key;
    })
    .filter(Boolean);
}
