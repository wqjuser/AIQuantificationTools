import type { ReactNode } from "react";

import type { AuditEventHistoryPagination } from "../lib/terminal-api";
import {
  buildExecutionAdapterPaperExecutionAuditLedgerSummary,
  filterExecutionAdapterPaperExecutionAuditLedgerRows,
  type ExecutionAdapterPaperExecutionAuditLedgerRow
} from "../lib/terminal-workbench";

type AuditPanelI18n = {
  locale: "zh-CN" | "en-US";
};

export function ExecutionAdapterPaperExecutionAuditLedgerPanel({
  className,
  i18n,
  isLoading,
  onNextPage,
  onPreviousPage,
  onCopyQueryLink,
  onOpenExecutionEvidence,
  onCopyExecutionEvidenceLink,
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
  onOpenExecutionEvidence?: (row: ExecutionAdapterPaperExecutionAuditLedgerRow) => void;
  onCopyExecutionEvidenceLink?: (row: ExecutionAdapterPaperExecutionAuditLedgerRow) => void;
  onQueryChange: (query: string) => void;
  pagination: AuditEventHistoryPagination | null;
  query: string;
  rows: ExecutionAdapterPaperExecutionAuditLedgerRow[];
}) {
  const summary = buildExecutionAdapterPaperExecutionAuditLedgerSummary(rows);
  const visibleRows = filterExecutionAdapterPaperExecutionAuditLedgerRows(rows, query);
  const pageStart = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;
  const pageEnd = pagination ? Math.min(pagination.offset + rows.length, pagination.total) : visibleRows.length;
  const pageLabel = pagination ? `${pageStart}-${pageEnd}/${pagination.total}` : `${visibleRows.length}/${rows.length}`;
  const canPageBack = Boolean(pagination && pagination.offset > 0);
  const canPageForward = Boolean(pagination && pagination.offset + pagination.limit < pagination.total);

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "适配器模拟执行审计" : "Adapter paper execution audit"}
      subtitle={i18n.locale === "zh-CN" ? "只读回放 adapter paper execution 证据" : "Read-only adapter paper execution evidence"}
      className={className}
    >
      <div className="adapter-paper-execution-audit">
        <div className="adapter-paper-execution-audit-toolbar">
          <div className="adapter-paper-execution-audit-summary">
            <span>
              {i18n.locale === "zh-CN" ? "流水" : "Events"} <strong>{summary.total}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "已成交" : "Filled"} <strong>{summary.filled}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "阻断" : "Blocked"} <strong>{summary.blocked}</strong>
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
          <div className="adapter-paper-execution-audit-query-tools">
            <input
              aria-label={i18n.locale === "zh-CN" ? "搜索适配器模拟执行审计" : "Search adapter paper execution audit"}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={
                i18n.locale === "zh-CN"
                  ? "搜索执行 id / adapter / manifest / 标的"
                  : "Search execution id / adapter / manifest / symbol"
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
          <div className="adapter-paper-execution-audit-pagination">
            <button disabled={!canPageBack || isLoading} onClick={onPreviousPage} type="button">
              {i18n.locale === "zh-CN" ? "上一页" : "Prev"}
            </button>
            <span>{isLoading ? (i18n.locale === "zh-CN" ? "加载中" : "Loading") : pageLabel}</span>
            <button disabled={!canPageForward || isLoading} onClick={onNextPage} type="button">
              {i18n.locale === "zh-CN" ? "下一页" : "Next"}
            </button>
          </div>
        ) : null}
        <div className="adapter-paper-execution-audit-list">
          {visibleRows.length ? (
            visibleRows.map((row) => (
              <article className={`adapter-paper-execution-audit-row ${row.tone}`} key={row.id}>
                <span>{row.adapterId || row.market || "-"}</span>
                <strong>
                  {row.id}
                  <small>{adapterPaperExecutionAuditStatusLabel(i18n, row.statusLabel)}</small>
                </strong>
                <p>
                  <b>{row.fillLabel || "-"}</b>
                  <small>{row.confirmationLabel}</small>
                  <em>{adapterPaperExecutionAuditBoundaryLabel(i18n, row.boundaryLabel)}</em>
                </p>
                <div>
                  <small>{[row.manifestValidationId, row.adapterOpsStateId].filter(Boolean).join(" · ") || "-"}</small>
                  <small>{row.blockedReasonsLabel}</small>
                  <time dateTime={row.createdAt}>{auditTimeLabel(row.createdAt)}</time>
                  {onOpenExecutionEvidence ? (
                    <button
                      className="adapter-paper-execution-audit-open-execution"
                      onClick={() => onOpenExecutionEvidence?.(row)}
                      type="button"
                    >
                      {i18n.locale === "zh-CN" ? "打开执行证据" : "Open execution evidence"}
                    </button>
                  ) : null}
                  {onCopyExecutionEvidenceLink ? (
                    <button
                      className="adapter-paper-execution-audit-open-execution"
                      onClick={() => void onCopyExecutionEvidenceLink?.(row)}
                      type="button"
                    >
                      {i18n.locale === "zh-CN" ? "复制执行证据链接" : "Copy execution link"}
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <article className="adapter-paper-execution-audit-row empty">
              <span>{i18n.locale === "zh-CN" ? "无记录" : "No records"}</span>
              <strong>{i18n.locale === "zh-CN" ? "等待适配器模拟执行流水" : "Waiting for adapter paper execution events"}</strong>
              <p>
                {i18n.locale === "zh-CN"
                  ? "本地 adapter paper execution 事件会从后端审计账本回读到这里。"
                  : "Local adapter paper execution events are read back from the backend audit ledger."}
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

function adapterPaperExecutionAuditStatusLabel(i18n: AuditPanelI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      "Paper execution blocked": "模拟执行已阻断",
      "Paper execution pending": "模拟执行待确认",
      "Paper execution recorded": "模拟执行已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterPaperExecutionAuditBoundaryLabel(i18n: AuditPanelI18n, boundaryLabel: string): string {
  if (i18n.locale === "en-US") {
    return boundaryLabel;
  }
  return boundaryLabel
    .replace("paper only", "仅模拟盘")
    .replace("paper boundary unknown", "模拟边界未知")
    .replace("live blocked", "实盘阻断")
    .replace("live allowed", "实盘允许")
    .replace("no route executed", "未执行路由")
    .replace("route executed", "路由已执行");
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
