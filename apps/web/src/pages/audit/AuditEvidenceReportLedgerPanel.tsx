import { Panel } from "../../components/AppPanel";
import { type AppI18n } from "../../lib/i18n";
import { type AuditEventHistoryPagination } from "../../lib/terminal-api";
import { type AuditEvidenceReportLedgerRow, type ProductWorkAreaId, filterAuditEvidenceReportLedgerRows } from "../../lib/terminal-workbench";
import { AuditEvidenceReportLedgerRows } from "./AuditEvidenceReportLedgerRows";
import { AuditEvidenceReportLedgerSummary } from "./AuditEvidenceReportLedgerSummary";
export { auditReportLedgerSigningPolicyDetail } from "./AuditEvidenceReportLedgerPolicy";

export function AuditEvidenceReportLedgerPanel({
  className,
  i18n,
  isLoading,
  onNextPage,
  onCopyEvidenceLink,
  onCopyCompletionGapLink,
  onCopyLocalReviewCoverageNextActionLink,
  onCopyP0ActionLink,
  onCopyQueryLink,
  onFocusLocalReviewCoverageNextAction,
  onOpenCompletionGap,
  onOpenEvidenceLink,
  onOpenLocalReviewCoverageNextAction,
  onOpenP0ActionLink,
  onOpenResearchContextLink,
  onPreviousPage,
  onQueryChange,
  onRevokeReport,
  onSignReport,
  onVerifyReport,
  pagination,
  query,
  rows,
  revokingEventId,
  signingEventId,
  verifyingEventId
}: {
  className?: string;
  i18n: AppI18n;
  isLoading: boolean;
  onNextPage: () => void;
  onCopyEvidenceLink: (search: string) => void;
  onCopyCompletionGapLink: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;
  onCopyLocalReviewCoverageNextActionLink: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;
  onCopyP0ActionLink: (search: string) => void;
  onCopyQueryLink: (query: string) => void;
  onFocusLocalReviewCoverageNextAction: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;
  onOpenCompletionGap: (workspaceId: ProductWorkAreaId) => void;
  onOpenEvidenceLink: (search: string) => void;
  onOpenLocalReviewCoverageNextAction: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;
  onOpenP0ActionLink: (search: string) => void;
  onOpenResearchContextLink: (search: string) => void;
  onPreviousPage: () => void;
  onQueryChange: (query: string) => void;
  onRevokeReport: (eventId: string) => void;
  onSignReport: (eventId: string) => void;
  onVerifyReport: (eventId: string) => void;
  pagination: AuditEventHistoryPagination | null;
  query: string;
  rows: AuditEvidenceReportLedgerRow[];
  revokingEventId: string | null;
  signingEventId: string | null;
  verifyingEventId: string | null;
}) {
  const visibleRows = filterAuditEvidenceReportLedgerRows(rows, query);
  const pageStart = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;
  const pageEnd = pagination ? Math.min(pagination.offset + rows.length, pagination.total) : visibleRows.length;
  const pageLabel = pagination ? `${pageStart}-${pageEnd}/${pagination.total}` : `${visibleRows.length}/${rows.length}`;
  const canPageBack = Boolean(pagination && pagination.offset > 0);
  const canPageForward = Boolean(pagination && pagination.offset + pagination.limit < pagination.total);

  return (
    <Panel title={i18n.locale === "zh-CN" ? "审计报告历史" : "Audit Report Ledger"} subtitle={i18n.locale === "zh-CN" ? "从后端账本回读 Markdown 报告 hash" : "Read report hashes back from the backend ledger"} className={className}>
      <div className="audit-report-ledger">
        <div className="audit-report-ledger-toolbar">
          <AuditEvidenceReportLedgerSummary i18n={i18n} onCopyCompletionGapLink={onCopyCompletionGapLink} onCopyEvidenceLink={onCopyEvidenceLink} onCopyLocalReviewCoverageNextActionLink={onCopyLocalReviewCoverageNextActionLink} onCopyP0ActionLink={onCopyP0ActionLink} onCopyQueryLink={onCopyQueryLink} onFocusLocalReviewCoverageNextAction={onFocusLocalReviewCoverageNextAction} onOpenCompletionGap={onOpenCompletionGap} onOpenEvidenceLink={onOpenEvidenceLink} onOpenLocalReviewCoverageNextAction={onOpenLocalReviewCoverageNextAction} onOpenResearchContextLink={onOpenResearchContextLink} onQueryChange={onQueryChange} rows={rows} />
          <div className="audit-report-ledger-query-tools">
            <input aria-label={i18n.locale === "zh-CN" ? "搜索审计报告历史" : "Search audit report ledger"} onChange={(event) => onQueryChange(event.target.value)} placeholder={i18n.locale === "zh-CN" ? "搜索 run / hash / focus" : "Search run / hash / focus"} type="search" value={query} />
            <button disabled={!query.trim()} onClick={() => onCopyQueryLink(query)} type="button">{i18n.locale === "zh-CN" ? "复制当前查询" : "Copy query link"}</button>
            <button disabled={!query.trim()} onClick={() => onQueryChange("")} type="button">{i18n.locale === "zh-CN" ? "清空查询" : "Clear query"}</button>
          </div>
        </div>
        {pagination ? <div className="audit-report-ledger-pagination">
          <button disabled={!canPageBack || isLoading} onClick={onPreviousPage} type="button">{i18n.locale === "zh-CN" ? "上一页" : "Prev"}</button>
          <span>{isLoading ? (i18n.locale === "zh-CN" ? "加载中" : "Loading") : pageLabel}</span>
          <button disabled={!canPageForward || isLoading} onClick={onNextPage} type="button">{i18n.locale === "zh-CN" ? "下一页" : "Next"}</button>
        </div> : null}
        <AuditEvidenceReportLedgerRows i18n={i18n} onCopyCompletionGapLink={onCopyCompletionGapLink} onCopyEvidenceLink={onCopyEvidenceLink} onCopyLocalReviewCoverageNextActionLink={onCopyLocalReviewCoverageNextActionLink} onCopyP0ActionLink={onCopyP0ActionLink} onCopyQueryLink={onCopyQueryLink} onFocusLocalReviewCoverageNextAction={onFocusLocalReviewCoverageNextAction} onOpenCompletionGap={onOpenCompletionGap} onOpenEvidenceLink={onOpenEvidenceLink} onOpenLocalReviewCoverageNextAction={onOpenLocalReviewCoverageNextAction} onOpenP0ActionLink={onOpenP0ActionLink} onOpenResearchContextLink={onOpenResearchContextLink} onQueryChange={onQueryChange} onRevokeReport={onRevokeReport} onSignReport={onSignReport} onVerifyReport={onVerifyReport} revokingEventId={revokingEventId} signingEventId={signingEventId} verifyingEventId={verifyingEventId} visibleRows={visibleRows} />
      </div>
    </Panel>
  );
}
