import type { ReactNode } from "react";

import type { AuditEventHistoryPagination } from "../lib/terminal-api";
import {
  buildPortfolioPaperOrderAuditLedgerSummary,
  filterPortfolioPaperOrderAuditLedgerRows,
  type PortfolioPaperOrderAuditLedgerRow
} from "../lib/terminal-workbench";

type AuditPanelI18n = {
  locale: "zh-CN" | "en-US";
};

export function PortfolioPaperOrderAuditLedgerPanel({
  className,
  i18n,
  isLoading,
  onNextPage,
  onPreviousPage,
  onCopyQueryLink,
  onQueryChange,
  pagination,
  query,
  rows
}: {
  className?: string;
  i18n: AuditPanelI18n;
  isLoading: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onCopyQueryLink?: (query: string) => void;
  onQueryChange: (query: string) => void;
  pagination: AuditEventHistoryPagination | null;
  query: string;
  rows: PortfolioPaperOrderAuditLedgerRow[];
}) {
  const summary = buildPortfolioPaperOrderAuditLedgerSummary(rows);
  const visibleRows = filterPortfolioPaperOrderAuditLedgerRows(rows, query);
  const pageStart = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;
  const pageEnd = pagination ? Math.min(pagination.offset + rows.length, pagination.total) : visibleRows.length;
  const pageLabel = pagination ? `${pageStart}-${pageEnd}/${pagination.total}` : `${visibleRows.length}/${rows.length}`;
  const canPageBack = Boolean(pagination && pagination.offset > 0);
  const canPageForward = Boolean(pagination && pagination.offset + pagination.limit < pagination.total);

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "组合委托审计" : "Portfolio order audit"}
      subtitle={i18n.locale === "zh-CN" ? "模拟委托、人工审批、纸面成交流水" : "Paper batches, approvals, and simulated fills"}
      className={className}
    >
      <div className="portfolio-paper-order-audit">
        <div className="portfolio-paper-order-audit-toolbar">
          <div className="portfolio-paper-order-audit-summary">
            <span>
              {i18n.locale === "zh-CN" ? "流水" : "Events"} <strong>{summary.total}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "批次" : "Batches"} <strong>{summary.batches}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "审批" : "Approvals"} <strong>{summary.approvals}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "模拟成交" : "Simulations"} <strong>{summary.simulations}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "实盘阻断" : "Live blocked"} <strong>{summary.liveBlocked}</strong>
            </span>
            {summary.latestEventId ? (
              <span title={summary.latestEventId}>
                {i18n.locale === "zh-CN" ? "最新" : "Latest"} <strong>{summary.latestEventId}</strong>
              </span>
            ) : null}
          </div>
          <div className="portfolio-paper-order-audit-query-tools">
            <input
              aria-label={i18n.locale === "zh-CN" ? "搜索组合委托审计" : "Search portfolio order audit"}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={
                i18n.locale === "zh-CN"
                  ? "搜索批次 / 订单 / 股票 / 审批人"
                  : "Search batch / order / symbol / reviewer"
              }
              type="search"
              value={query}
            />
            {onCopyQueryLink ? (
              <button disabled={!query.trim()} onClick={() => onCopyQueryLink?.(query)} type="button">
                {i18n.locale === "zh-CN" ? "复制审计链接" : "Copy audit link"}
              </button>
            ) : null}
          </div>
        </div>
        {pagination ? (
          <div className="portfolio-paper-order-audit-pagination">
            <button disabled={!canPageBack || isLoading} onClick={onPreviousPage} type="button">
              {i18n.locale === "zh-CN" ? "上一页" : "Prev"}
            </button>
            <span>{isLoading ? (i18n.locale === "zh-CN" ? "加载中" : "Loading") : pageLabel}</span>
            <button disabled={!canPageForward || isLoading} onClick={onNextPage} type="button">
              {i18n.locale === "zh-CN" ? "下一页" : "Next"}
            </button>
          </div>
        ) : null}
        <div className="portfolio-paper-order-audit-list">
          {visibleRows.length ? (
            visibleRows.map((row) => (
              <article className={`portfolio-paper-order-audit-row ${row.tone}`} key={row.id}>
                <span>{portfolioPaperOrderAuditKindLabel(i18n, row.eventKind)}</span>
                <strong>
                  {row.portfolioName || row.symbol || row.batchId || row.orderId}
                  <small>{portfolioPaperOrderAuditStatusLabel(i18n, row.statusLabel)}</small>
                </strong>
                <p>
                  <b>{row.quantityLabel || "-"}</b>
                  <small>{row.valueLabel || "-"}</small>
                  <em>{portfolioPaperOrderAuditBoundaryLabel(i18n, row.boundaryLabel)}</em>
                </p>
                <div>
                  <small>{[row.batchId, row.orderId, row.simulationId].filter(Boolean).join(" · ") || row.id}</small>
                  <small>{[row.actor, row.adapterEvidenceId].filter(Boolean).join(" · ") || row.source}</small>
                  <time dateTime={row.createdAt}>{auditTimeLabel(row.createdAt)}</time>
                </div>
              </article>
            ))
          ) : (
            <article className="portfolio-paper-order-audit-row empty">
              <span>{i18n.locale === "zh-CN" ? "无记录" : "No records"}</span>
              <strong>{i18n.locale === "zh-CN" ? "等待组合委托流水" : "Waiting for portfolio order events"}</strong>
              <p>
                {i18n.locale === "zh-CN"
                  ? "批次生成、人工审批和模拟成交会从后端审计账本回读到这里。"
                  : "Batches, operator approvals, and paper fills are read back from the backend audit ledger."}
              </p>
              <div>
                <small>{i18n.locale === "zh-CN" ? "只读审计，不授权实盘" : "Read-only audit, no live authorization"}</small>
              </div>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

function Panel({
  title,
  subtitle,
  className,
  children
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`terminal-panel ${className ?? ""}`}>
      <header>
        <div>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>
      </header>
      {children}
    </section>
  );
}

function portfolioPaperOrderAuditKindLabel(
  i18n: AuditPanelI18n,
  eventKind: PortfolioPaperOrderAuditLedgerRow["eventKind"]
): string {
  if (i18n.locale === "en-US") {
    return { approval: "Approval", batch: "Batch", simulation: "Simulation" }[eventKind];
  }
  return { approval: "审批", batch: "批次", simulation: "模拟成交" }[eventKind];
}

function portfolioPaperOrderAuditStatusLabel(i18n: AuditPanelI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      "Approval recorded": "审批已记录",
      "Approval rejected": "审批已拒绝",
      "Batch recorded": "批次已记录",
      "Simulation filled": "模拟成交已记录",
      "Simulation recorded": "模拟流水已记录"
    }[statusLabel] ?? statusLabel
  );
}

function portfolioPaperOrderAuditBoundaryLabel(i18n: AuditPanelI18n, boundaryLabel: string): string {
  if (i18n.locale === "en-US") {
    return boundaryLabel;
  }
  return boundaryLabel
    .replace("paper only", "仅模拟盘")
    .replace("paper boundary unknown", "模拟边界未知")
    .replace("live blocked", "实盘阻断")
    .replace("live allowed", "实盘允许")
    .replace("live boundary unknown", "实盘边界未知");
}

function auditTimeLabel(createdAt: string): string {
  if (!createdAt) {
    return "-";
  }
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return createdAt;
  }
  return parsed.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit"
  });
}
