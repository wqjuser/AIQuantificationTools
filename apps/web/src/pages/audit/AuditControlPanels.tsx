import { Panel } from "../../components/AppPanel";
import { type AppI18n } from "../../lib/i18n";
import { AuditEventHistoryPagination } from "../../lib/terminal-api";
import { EvidencePackageControlRoom, EvidencePackageControlRoomRow, MarketDataRefreshOverrideAuditLedgerRow, PaperExecutionReplayGate, buildMarketDataRefreshOverrideAuditLedgerSummary, filterMarketDataRefreshOverrideAuditLedgerRows } from "../../lib/terminal-workbench";
import { p0AcceptanceReviewStatusLabel } from "../backtest/p2-readiness-formatters";
import { evidencePackageControlActionLabel, evidencePackageControlImportStatusLabel, evidencePackageControlPackageStatusLabel, evidencePackageControlSignatureStatusLabel, evidencePackageControlStatusLabel, marketRefreshOverrideAuditLiveBoundaryLabel, marketRefreshOverrideAuditStatusLabel, paperReplayGateBoundaryLabel, paperReplayGateDetail, paperReplayGateHeadline, paperReplayGateItemDetail, paperReplayGateItemLabel, paperReplayGateItemStatusLabel, paperReplayGateStatusLabel } from "./AuditControlFormatters";
import { researchImportAuditTimeLabel } from "./AuditLedgerFormatters";
import { Search, ShieldCheck, WalletCards } from "lucide-react";

export function MarketDataRefreshOverrideAuditLedgerPanel({
  className,
  i18n,
  isLoading,
  onNextPage,
  onPreviousPage,
  onQueryChange,
  pagination,
  query,
  rows
}: {
  className?: string;
  i18n: AppI18n;
  isLoading: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onQueryChange: (query: string) => void;
  pagination: AuditEventHistoryPagination | null;
  query: string;
  rows: MarketDataRefreshOverrideAuditLedgerRow[];
}) {
  const summary = buildMarketDataRefreshOverrideAuditLedgerSummary(rows);
  const visibleRows = filterMarketDataRefreshOverrideAuditLedgerRows(rows, query);
  const pageStart = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;
  const pageEnd = pagination ? Math.min(pagination.offset + rows.length, pagination.total) : visibleRows.length;
  const pageLabel = pagination ? `${pageStart}-${pageEnd}/${pagination.total}` : `${visibleRows.length}/${rows.length}`;
  const canPageBack = Boolean(pagination && pagination.offset > 0);
  const canPageForward = Boolean(pagination && pagination.offset + pagination.limit < pagination.total);

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "行情覆盖审计" : "Refresh overrides"}
      subtitle={i18n.locale === "zh-CN" ? "provider 冷却期人工刷新覆盖流水" : "Manual refresh overrides during provider cooldown"}
      className={className}
    >
      <div className="market-refresh-audit">
        <div className="market-refresh-audit-toolbar">
          <div className="market-refresh-audit-summary">
            <span>
              {i18n.locale === "zh-CN" ? "覆盖审计" : "Overrides"} <strong>{summary.total}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "已记录" : "Recorded"} <strong>{summary.recorded}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "实盘阻断" : "Live blocked"} <strong>{summary.liveBlocked}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "覆盖失败" : "Blocked"} <strong>{summary.blocked}</strong>
            </span>
            {summary.latestEventId ? (
              <span title={summary.latestReason}>
                {i18n.locale === "zh-CN" ? "最新" : "Latest"}{" "}
                <strong>
                  {summary.latestSymbol} · {summary.latestTimeframe}
                </strong>
              </span>
            ) : null}
          </div>
          <input
            aria-label={i18n.locale === "zh-CN" ? "搜索行情覆盖审计" : "Search refresh override audit"}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={i18n.locale === "zh-CN" ? "搜索代码 / 原因 / 操作员" : "Search symbol / reason / operator"}
            type="search"
            value={query}
          />
        </div>
        {pagination ? (
          <div className="market-refresh-audit-pagination">
            <button disabled={!canPageBack || isLoading} onClick={onPreviousPage} type="button">
              {i18n.locale === "zh-CN" ? "上一页" : "Prev"}
            </button>
            <span>{isLoading ? (i18n.locale === "zh-CN" ? "加载中" : "Loading") : pageLabel}</span>
            <button disabled={!canPageForward || isLoading} onClick={onNextPage} type="button">
              {i18n.locale === "zh-CN" ? "下一页" : "Next"}
            </button>
          </div>
        ) : null}
        <div className="market-refresh-audit-list">
          {visibleRows.length ? (
            visibleRows.map((row) => (
              <article className={`market-refresh-audit-row ${row.tone}`} key={row.id}>
                <span>{marketRefreshOverrideAuditStatusLabel(i18n, row.statusLabel)}</span>
                <strong>
                  {row.name || row.symbol} · {row.symbol}
                  <small>
                    {i18n.marketLabel(row.market)} · {row.timeframe}
                  </small>
                </strong>
                <p>
                  <b>{row.overrideReason}</b>
                  <small>{row.detail}</small>
                  <em>{row.boundary}</em>
                </p>
                <div>
                  <small>
                    {row.operator || "local-operator"} · {row.actionScope || "manual_cache_refresh"}
                  </small>
                  <small>
                    {row.providerHealthStatus || "unknown"} · {row.providerHealthReason || "n/a"} ·{" "}
                    {row.retryAfterSeconds}s · {row.recentErrorCount}
                  </small>
                  <small>{row.affectedSymbolsLabel || row.affectedContextsLabel || "current market"}</small>
                  <time dateTime={row.createdAt}>{researchImportAuditTimeLabel(row.createdAt)}</time>
                  <em>{marketRefreshOverrideAuditLiveBoundaryLabel(i18n, row.liveTradingAllowed)}</em>
                </div>
              </article>
            ))
          ) : (
            <article className="market-refresh-audit-row empty">
              <span>{i18n.locale === "zh-CN" ? "无记录" : "No records"}</span>
              <strong>{i18n.locale === "zh-CN" ? "等待覆盖审计" : "Waiting for overrides"}</strong>
              <p>
                {i18n.locale === "zh-CN"
                  ? "冷却期人工覆盖会先写入这里，再放行一次刷新。"
                  : "Cooldown overrides are recorded here before one refresh is unlocked."}
              </p>
              <div>
                <small>{i18n.locale === "zh-CN" ? "非实盘授权" : "No live authorization"}</small>
              </div>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

export function EvidencePackageControlRoomPanel({
  className,
  controlRoom,
  i18n,
  onRunAction
}: {
  className?: string;
  controlRoom: EvidencePackageControlRoom;
  i18n: AppI18n;
  onRunAction: (row: EvidencePackageControlRoomRow) => void;
}) {
  const summary = controlRoom.summary;
  const visibleRows = controlRoom.rows.slice(0, 8);

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "证据包控制室" : "Evidence Package Control Room"}
      subtitle={i18n.locale === "zh-CN" ? "导出包、签名、导入审计与 P0 验收总览" : "Export packages, signatures, imports, and P0 acceptance"}
      className={className}
    >
      <div className="evidence-package-control-room">
        <div className="evidence-package-control-summary">
          <span>
            {i18n.locale === "zh-CN" ? "总数" : "Total"} <strong>{summary.total}</strong>
          </span>
          <span>
            {i18n.locale === "zh-CN" ? "需处理" : "Needs action"} <strong>{summary.needsAction}</strong>
          </span>
          <span>
            {i18n.locale === "zh-CN" ? "可归档" : "Archive-ready"} <strong>{summary.readyForArchive}</strong>
          </span>
          <span>
            {i18n.locale === "zh-CN" ? "完整" : "Complete"} <strong>{summary.complete}</strong>
          </span>
          <span title={summary.latestUpdatedAt || "n/a"}>
            {i18n.locale === "zh-CN" ? "签名通过" : "Signed"} <strong>{summary.signedRuns}</strong>
          </span>
        </div>
        <div className="evidence-package-control-list">
          {visibleRows.length ? (
            visibleRows.map((row) => (
              <article className={`evidence-package-control-row ${row.tone} ${row.status}`} key={row.id}>
                <div className="evidence-package-control-main">
                  <span>{evidencePackageControlStatusLabel(i18n, row.status)}</span>
                  <strong>{row.runId}</strong>
                  <p>{row.context}</p>
                </div>
                <div className="evidence-package-control-gates">
                  <span title={row.packageDetail}>
                    {i18n.locale === "zh-CN" ? "包" : "Package"} ·{" "}
                    {evidencePackageControlPackageStatusLabel(i18n, row.packageStatus)}
                  </span>
                  <span title={row.signatureDetail}>
                    {i18n.locale === "zh-CN" ? "签名" : "Signature"} ·{" "}
                    {evidencePackageControlSignatureStatusLabel(i18n, row.signatureStatus)}
                  </span>
                  <span title={row.importDetail}>
                    {i18n.locale === "zh-CN" ? "导入" : "Import"} ·{" "}
                    {evidencePackageControlImportStatusLabel(i18n, row.importStatus)}
                  </span>
                  <span title={row.acceptanceDetail}>
                    {i18n.locale === "zh-CN" ? "验收" : "Acceptance"} ·{" "}
                    {p0AcceptanceReviewStatusLabel(i18n, row.acceptanceStatus)}
                  </span>
                </div>
                <button onClick={() => onRunAction(row)} type="button">
                  <Search size={13} />
                  <span>{evidencePackageControlActionLabel(i18n, row.nextActionId)}</span>
                </button>
              </article>
            ))
          ) : (
            <article className="evidence-package-control-row empty">
              <div className="evidence-package-control-main">
                <span>{i18n.locale === "zh-CN" ? "等待证据" : "Awaiting evidence"}</span>
                <strong>{i18n.locale === "zh-CN" ? "暂无可检查的 run" : "No runs to inspect"}</strong>
                <p>{i18n.locale === "zh-CN" ? "先生成复现包、签名报告或导入审计事件。" : "Generate export packages, signed reports, or import audit events first."}</p>
              </div>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

export function PaperExecutionReplayGatePanel({
  className,
  gate,
  i18n,
  onOpenAudit,
  onOpenPortfolio
}: {
  className?: string;
  gate: PaperExecutionReplayGate;
  i18n: AppI18n;
  onOpenAudit?: () => void;
  onOpenPortfolio?: () => void;
}) {
  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "纸面执行回放闸门" : "Paper Replay Gate"}
      subtitle={i18n.locale === "zh-CN" ? "回放完整性 · 实盘前阻断" : "Replay integrity · pre-live blocker"}
      className={className}
      action={
        <div className="paper-replay-gate-actions">
          {onOpenPortfolio ? (
            <button onClick={onOpenPortfolio} type="button">
              <WalletCards size={13} />
              <span>{i18n.locale === "zh-CN" ? "组合证据" : "Portfolio"}</span>
            </button>
          ) : null}
          {onOpenAudit ? (
            <button onClick={onOpenAudit} type="button">
              <ShieldCheck size={13} />
              <span>{i18n.locale === "zh-CN" ? "审计证据" : "Audit"}</span>
            </button>
          ) : null}
        </div>
      }
    >
      <div className={`paper-replay-gate ${gate.tone}`}>
        <div className="paper-replay-gate-summary">
          <div>
            <span>{paperReplayGateStatusLabel(i18n, gate.status)}</span>
            <strong>{paperReplayGateHeadline(i18n, gate)}</strong>
            <p>{paperReplayGateDetail(i18n, gate)}</p>
          </div>
          <em>
            {gate.passedCount}/{gate.totalCount}
          </em>
        </div>
        <div className="paper-replay-gate-metrics">
          <span>
            {i18n.locale === "zh-CN" ? "单标的成交" : "Single fills"} · {gate.metrics.filledPaperOrders}
          </span>
          <span>
            {i18n.locale === "zh-CN" ? "组合成交" : "Portfolio fills"} · {gate.metrics.portfolioFilledOrders}
          </span>
          <span>
            {i18n.locale === "zh-CN" ? "适配器证据" : "Adapter evidence"} · {gate.metrics.adapterPaperExecutions}
          </span>
          <span>
            {i18n.locale === "zh-CN" ? "边界" : "Boundary"} ·{" "}
            {gate.liveTradingAllowed || gate.orderSubmissionEnabled
              ? i18n.locale === "zh-CN"
                ? "需复核"
                : "review"
              : i18n.locale === "zh-CN"
                ? "实盘关闭"
                : "live blocked"}
          </span>
        </div>
        <div className="paper-replay-gate-items">
          {gate.items.map((item) => (
            <article className={`paper-replay-gate-item ${item.tone}`} key={item.id}>
              <span>{paperReplayGateItemLabel(i18n, item.id, item.label)}</span>
              <strong>{paperReplayGateItemStatusLabel(i18n, item.status)}</strong>
              <p>{paperReplayGateItemDetail(i18n, item)}</p>
              <em>{item.evidence}</em>
            </article>
          ))}
        </div>
        <small>{paperReplayGateBoundaryLabel(i18n, gate)}</small>
      </div>
    </Panel>
  );
}
