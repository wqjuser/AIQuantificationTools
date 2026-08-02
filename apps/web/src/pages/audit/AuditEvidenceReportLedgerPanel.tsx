import { Panel } from "../../components/AppPanel";
import { productWorkAreaIdLabelText } from "../../components/AppWorkflowPanels";
import { type AppI18n } from "../../lib/i18n";
import { AuditEventHistoryPagination } from "../../lib/terminal-api";
import { AuditEvidenceReportLedgerRow, ProductWorkAreaId, auditReportLedgerRowIsSigningEligible, buildAuditEvidenceReportLedgerRowCurrentGapActionDescriptor, buildAuditEvidenceReportLedgerRowCurrentGapActionReadiness, buildAuditEvidenceReportLedgerRowCurrentGapReadinessQuery, buildAuditEvidenceReportLedgerRowCurrentGapReadinessTitle, buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewLabel, buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewQuery, buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewTitle, buildAuditEvidenceReportLedgerRowDailyStartBriefReviewLabel, buildAuditEvidenceReportLedgerRowDailyStartBriefReviewQuery, buildAuditEvidenceReportLedgerRowDailyStartBriefReviewTitle, buildAuditEvidenceReportLedgerRowP0BacklogReadinessLabel, buildAuditEvidenceReportLedgerRowP0BacklogReadinessQuery, buildAuditEvidenceReportLedgerRowP0BacklogReadinessTitle, buildAuditEvidenceReportLedgerRowP0CompletionLabel, buildAuditEvidenceReportLedgerRowP0CompletionQuery, buildAuditEvidenceReportLedgerRowP0CompletionTitle, buildAuditEvidenceReportLedgerRowP0PreflightQuery, buildAuditEvidenceReportLedgerRowP0ProgressLabel, buildAuditEvidenceReportLedgerRowP0ProgressQuery, buildAuditEvidenceReportLedgerRowP0ReadinessReportQuery, buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewLabel, buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewQuery, buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewTitle, buildAuditEvidenceReportLedgerRowPreLiveRunbookQuery, buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewLabel, buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewQuery, buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewTitle, buildAuditEvidenceReportLedgerSummary, buildLatestAuditAidCurrentGapActionDescriptor, buildLatestAuditAidCurrentGapActionReadiness, filterAuditEvidenceReportLedgerRows } from "../../lib/terminal-workbench";
import { localReviewCoverageNextActionCopyLabel, localReviewCoverageNextActionFocusLabel, localReviewCoverageNextActionLabel, localReviewCoverageNextActionOpenSourceLabel, localReviewCoverageNextActionStateFromParts, localReviewCoverageNextActionTitle } from "../stage1/local-review-formatters";
import { goldenPathActionIdLabel, goldenPathActionLabelText, p0BacklogReadinessLabelText, p0CompletionLedgerLabelText, p0CurrentGapActionReadinessLabel, p0PaperExecutionPreflightActionLabel } from "../stage1/p0-platform-formatters";
import { auditReportLedgerPreLiveRunbookEvidenceLabel, auditReportLedgerReportKindLabel, auditReportLedgerSignatureLabel, auditReportLedgerStatusLabel, researchImportAuditTimeLabel } from "./AuditLedgerFormatters";

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
  const summary = buildAuditEvidenceReportLedgerSummary(rows);
  const latestAuditAidCurrentGapAction = buildLatestAuditAidCurrentGapActionDescriptor(summary);
  const latestAuditAidCurrentGapActionReadiness = buildLatestAuditAidCurrentGapActionReadiness(summary);
  const latestCompletionGapWorkspaceId = summary.latestAuditAidCompletionCurrentCriterionTargetWorkspaceId;
  const localReviewCoverageNextActionWorkspaceId =
    summary.localReviewBundleCoverageNextActionTargetWorkspaceId;
  const localReviewCoverageNextActionState = localReviewCoverageNextActionStateFromParts(
    localReviewCoverageNextActionWorkspaceId,
    summary.localReviewBundleCoverageNextActionQuery
  );
  const hasLocalReviewBundleSummary =
    summary.localReviewBundleCount > 0 ||
    Boolean(
      summary.localReviewBundleCoverageQuery ||
        summary.localReviewBundleCoverageNextActionQuery
    );
  const localReviewBundleSummaryTitle =
    summary.localReviewBundleTitle ||
    summary.localReviewBundleCoverageTitle ||
    summary.localReviewBundleCoverageNextActionTitle ||
    summary.localReviewBundleCoverageQuery ||
    summary.localReviewBundleCoverageNextActionQuery ||
    summary.localReviewBundleQuery;
  const visibleRows = filterAuditEvidenceReportLedgerRows(rows, query);
  const pageStart = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;
  const pageEnd = pagination ? Math.min(pagination.offset + rows.length, pagination.total) : visibleRows.length;
  const pageLabel = pagination ? `${pageStart}-${pageEnd}/${pagination.total}` : `${visibleRows.length}/${rows.length}`;
  const canPageBack = Boolean(pagination && pagination.offset > 0);
  const canPageForward = Boolean(pagination && pagination.offset + pagination.limit < pagination.total);
  const focusAuditReportQuery = (nextQuery: string) => {
    onQueryChange(nextQuery);
  };

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "审计报告历史" : "Audit Report Ledger"}
      subtitle={i18n.locale === "zh-CN" ? "从后端账本回读 Markdown 报告 hash" : "Read report hashes back from the backend ledger"}
      className={className}
    >
      <div className="audit-report-ledger">
        <div className="audit-report-ledger-toolbar">
          <div className="audit-report-ledger-summary">
            <span>
              {i18n.locale === "zh-CN" ? "报告" : "Reports"} <strong>{summary.total}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "已记录" : "Recorded"} <strong>{summary.ready}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "需签名" : "Signing chain"} <strong>{summary.signingEligible}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "审计辅助" : "Audit aids"} <strong>{summary.auditAid}</strong>
            </span>
            {summary.latestP2ReadinessLinkedAcceptanceReviewEventId ? (
              <span
                title={
                  summary.latestP2ReadinessReviewChainLabel ||
                  [
                    summary.latestP2ReadinessLinkedAcceptanceReviewEventId,
                    summary.latestP2ReadinessLinkedCoverageReviewEventId
                  ]
                    .filter(Boolean)
                    .join(" -> ")
                }
              >
                {i18n.locale === "zh-CN" ? "P2 复核链" : "P2 review chain"}{" "}
                <strong>{summary.latestP2ReadinessLinkedAcceptanceReviewEventId}</strong>
                {summary.latestP2ReadinessLinkedCoverageReviewLabel ? (
                  <small>{summary.latestP2ReadinessLinkedCoverageReviewLabel}</small>
                ) : null}
                {summary.p2ReadinessReviewChainCount > 0 ? (
                  <small title={summary.p2ReadinessReviewChainsQuery}>
                    {i18n.locale === "zh-CN" ? "全部复核链" : "All review chains"}{" "}
                    {summary.p2ReadinessReviewChainCount}
                  </small>
                ) : null}
                {summary.p2ReadinessReviewChainHealthLabel ? (
                  <small
                    className={
                      summary.p2ReadinessReviewChainHealthState === "gaps"
                        ? "audit-report-ledger-p2-review-chain-gap"
                        : undefined
                    }
                    title={summary.p2ReadinessReviewChainHealthTitle || summary.p2ReadinessReviewChainHealthQuery}
                  >
                    {i18n.locale === "zh-CN" ? "复核链健康" : "Chain health"}{" "}
                    <strong>{summary.p2ReadinessReviewChainHealthLabel}</strong>
                  </small>
                ) : null}
                {summary.p2ReadinessReviewChainHealthContextCount > 0 ? (
                  <small
                    title={
                      summary.p2ReadinessReviewChainHealthContextTitle ||
                      summary.p2ReadinessReviewChainHealthContextQuery
                    }
                  >
                    {i18n.locale === "zh-CN" ? "健康上下文" : "Health context"}{" "}
                    {summary.p2ReadinessReviewChainHealthContextCount}
                  </small>
                ) : null}
                {summary.p2ReadinessReviewChainLoadedCount > 0 ? (
                  <small title="review-chain-loaded">
                    {i18n.locale === "zh-CN" ? "已加载链" : "Loaded chains"}{" "}
                    {summary.p2ReadinessReviewChainLoadedCount}
                  </small>
                ) : null}
                {summary.p2ReadinessReviewChainGapCount > 0 ? (
                  <small
                    className="audit-report-ledger-p2-review-chain-gap"
                    title={summary.p2ReadinessReviewChainGapsQuery}
                  >
                    {i18n.locale === "zh-CN" ? "全部复核链缺口" : "All chain gaps"}{" "}
                    {summary.p2ReadinessReviewChainGapCount}
                  </small>
                ) : null}
                {summary.latestP2ReadinessReviewChainGapEventId ? (
                  <small
                    className="audit-report-ledger-p2-review-chain-gap"
                    title={
                      summary.latestP2ReadinessReviewChainGapQuery ||
                      summary.latestP2ReadinessReviewChainGapLabel
                    }
                  >
                    {i18n.locale === "zh-CN" ? "最新缺口" : "Latest gap"}{" "}
                    <strong>{summary.latestP2ReadinessReviewChainGapEventId}</strong>
                    {summary.latestP2ReadinessReviewChainGapLabel ? (
                      <span>{summary.latestP2ReadinessReviewChainGapLabel}</span>
                    ) : null}
                  </small>
                ) : null}
                {summary.p2ReadinessReviewChainMissingCoverageCount > 0 ? (
                  <small
                    className="audit-report-ledger-p2-review-chain-gap"
                    title={summary.p2ReadinessReviewChainMissingCoverageQuery}
                  >
                    {i18n.locale === "zh-CN" ? "复核链缺口" : "Chain gaps"}{" "}
                    {summary.p2ReadinessReviewChainMissingCoverageCount}
                  </small>
                ) : null}
                {summary.p2ReadinessReviewChainMissingAcceptanceCount > 0 ? (
                  <small
                    className="audit-report-ledger-p2-review-chain-gap"
                    title={summary.p2ReadinessReviewChainMissingAcceptanceQuery}
                  >
                    {i18n.locale === "zh-CN" ? "缺顶层复核" : "Missing acceptance"}{" "}
                    {summary.p2ReadinessReviewChainMissingAcceptanceCount}
                  </small>
                ) : null}
                {summary.p2ReadinessReviewChainsQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.p2ReadinessReviewChainsQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位全部复核链" : "Focus all chains"}
                  </button>
                ) : null}
                {summary.p2ReadinessReviewChainsQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.p2ReadinessReviewChainsQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制全部复核链链接" : "Copy all chains link"}
                  </button>
                ) : null}
                {summary.p2ReadinessReviewChainHealthQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.p2ReadinessReviewChainHealthQuery)}
                    title={summary.p2ReadinessReviewChainHealthTitle || summary.p2ReadinessReviewChainHealthQuery}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位复核链健康" : "Focus chain health"}
                  </button>
                ) : null}
                {summary.p2ReadinessReviewChainHealthQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.p2ReadinessReviewChainHealthQuery)}
                    title={summary.p2ReadinessReviewChainHealthTitle || summary.p2ReadinessReviewChainHealthQuery}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制复核链健康链接" : "Copy chain health link"}
                  </button>
                ) : null}
                {summary.p2ReadinessReviewChainHealthContextQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.p2ReadinessReviewChainHealthContextQuery)}
                    title={
                      summary.p2ReadinessReviewChainHealthContextTitle ||
                      summary.p2ReadinessReviewChainHealthContextQuery
                    }
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位复核链健康上下文" : "Focus chain health context"}
                  </button>
                ) : null}
                {summary.p2ReadinessReviewChainHealthContextQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.p2ReadinessReviewChainHealthContextQuery)}
                    title={
                      summary.p2ReadinessReviewChainHealthContextTitle ||
                      summary.p2ReadinessReviewChainHealthContextQuery
                    }
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制复核链健康上下文链接" : "Copy chain health context link"}
                  </button>
                ) : null}
                {summary.p2ReadinessReviewChainGapsQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.p2ReadinessReviewChainGapsQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位全部复核链缺口" : "Focus all chain gaps"}
                  </button>
                ) : null}
                {summary.p2ReadinessReviewChainGapsQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.p2ReadinessReviewChainGapsQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制全部复核链缺口链接" : "Copy all chain gaps link"}
                  </button>
                ) : null}
                {summary.latestP2ReadinessReviewChainGapQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.latestP2ReadinessReviewChainGapQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位最新复核链缺口" : "Focus latest chain gap"}
                  </button>
                ) : null}
                {summary.latestP2ReadinessReviewChainGapQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.latestP2ReadinessReviewChainGapQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制最新复核链缺口链接" : "Copy latest chain gap link"}
                  </button>
                ) : null}
                {summary.p2ReadinessReviewChainMissingCoverageQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.p2ReadinessReviewChainMissingCoverageQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位复核链缺口" : "Focus chain gaps"}
                  </button>
                ) : null}
                {summary.p2ReadinessReviewChainMissingCoverageQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.p2ReadinessReviewChainMissingCoverageQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制复核链缺口链接" : "Copy chain gaps link"}
                  </button>
                ) : null}
                {summary.p2ReadinessReviewChainMissingAcceptanceQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.p2ReadinessReviewChainMissingAcceptanceQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位顶层复核缺口" : "Focus missing acceptance"}
                  </button>
                ) : null}
                {summary.p2ReadinessReviewChainMissingAcceptanceQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.p2ReadinessReviewChainMissingAcceptanceQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制顶层复核缺口链接" : "Copy missing acceptance link"}
                  </button>
                ) : null}
                {summary.latestP2ReadinessReviewChainQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.latestP2ReadinessReviewChainQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位复核链" : "Focus review chain"}
                  </button>
                ) : null}
                {summary.latestP2ReadinessReviewChainQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.latestP2ReadinessReviewChainQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制复核链链接" : "Copy review chain link"}
                  </button>
                ) : null}
                {summary.latestP2ReadinessLinkedAcceptanceReviewQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.latestP2ReadinessLinkedAcceptanceReviewQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位顶层复核" : "Focus acceptance review"}
                  </button>
                ) : null}
                {summary.latestP2ReadinessLinkedAcceptanceReviewQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.latestP2ReadinessLinkedAcceptanceReviewQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制顶层复核链接" : "Copy acceptance link"}
                  </button>
                ) : null}
                {summary.latestP2ReadinessLinkedCoverageReviewQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.latestP2ReadinessLinkedCoverageReviewQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位覆盖复核" : "Focus coverage review"}
                  </button>
                ) : null}
                {summary.latestP2ReadinessLinkedCoverageReviewQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.latestP2ReadinessLinkedCoverageReviewQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制覆盖复核链接" : "Copy coverage link"}
                  </button>
                ) : null}
              </span>
            ) : null}
            {summary.latestAuditAidRunId ? (
              <span title={summary.latestAuditAidEvidenceLink || summary.latestAuditAidEvidenceLabel}>
                {i18n.locale === "zh-CN" ? "最新辅助" : "Latest aid"}{" "}
                <strong>{summary.latestAuditAidRunId}</strong>
                {summary.latestAuditAidEvidenceLink ? (
                  <button onClick={() => onOpenEvidenceLink(summary.latestAuditAidEvidenceLink)} type="button">
                    {i18n.locale === "zh-CN" ? "打开最新辅助" : "Open latest aid"}
                  </button>
                ) : null}
                {summary.latestAuditAidEvidenceLink ? (
                  <button onClick={() => onCopyEvidenceLink(summary.latestAuditAidEvidenceLink)} type="button">
                    {i18n.locale === "zh-CN" ? "复制最新辅助" : "Copy latest aid"}
                  </button>
                ) : null}
                {summary.latestAuditAidProgressLabel ? (
                  <span
                    className="audit-report-ledger-p0-progress"
                    title={summary.latestAuditAidProgressQuery || summary.latestAuditAidReportQuery || summary.latestAuditAidProgressLabel}
                  >
                    {i18n.locale === "zh-CN" ? "最新进度" : "Latest progress"} ·{" "}
                    {summary.latestAuditAidProgressLabel}
                  </span>
                ) : null}
                {summary.latestAuditAidProgressQuery ? (
                  <button onClick={() => focusAuditReportQuery(summary.latestAuditAidProgressQuery)} type="button">
                    {i18n.locale === "zh-CN" ? "定位进度" : "Focus progress"}
                  </button>
                ) : null}
                {summary.latestAuditAidProgressQuery ? (
                  <button onClick={() => onCopyQueryLink(summary.latestAuditAidProgressQuery)} type="button">
                    {i18n.locale === "zh-CN" ? "复制进度链接" : "Copy progress link"}
                  </button>
                ) : null}
                {summary.latestAuditAidCompletionLabel ? (
                  <span
                    className={`audit-report-ledger-p0-completion ${
                      !summary.latestAuditAidCompletionRecorded ? "muted" : "ready"
                    }`}
                    title={summary.latestAuditAidCompletionTitle || summary.latestAuditAidCompletionLabel}
                  >
                    {i18n.locale === "zh-CN" ? "最新完成定义" : "Latest completion"} ·{" "}
                    {p0CompletionLedgerLabelText(i18n, summary.latestAuditAidCompletionLabel)}
                  </span>
                ) : null}
                {summary.latestAuditAidCompletionQuery ? (
                  <button onClick={() => focusAuditReportQuery(summary.latestAuditAidCompletionQuery)} type="button">
                    {i18n.locale === "zh-CN" ? "定位完成定义" : "Focus completion"}
                  </button>
                ) : null}
                {summary.latestAuditAidCompletionQuery ? (
                  <button onClick={() => onCopyQueryLink(summary.latestAuditAidCompletionQuery)} type="button">
                    {i18n.locale === "zh-CN" ? "复制完成链接" : "Copy completion link"}
                  </button>
                ) : null}
                {latestCompletionGapWorkspaceId ? (
                  <button
                    onClick={() => {
                      if (summary.latestAuditAidCompletionQuery) {
                        focusAuditReportQuery(summary.latestAuditAidCompletionQuery);
                      }
                      onOpenCompletionGap(latestCompletionGapWorkspaceId);
                    }}
                    title={
                      summary.latestAuditAidCompletionCurrentCriterionActionLabel ||
                      summary.latestAuditAidCompletionCurrentCriterionLabel
                    }
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "打开完成缺口" : "Open completion gap"}
                  </button>
                ) : null}
                {latestCompletionGapWorkspaceId ? (
                  <button
                    onClick={() =>
                      onCopyCompletionGapLink(latestCompletionGapWorkspaceId, summary.latestAuditAidCompletionQuery)
                    }
                    title={
                      summary.latestAuditAidCompletionCurrentCriterionActionLabel ||
                      summary.latestAuditAidCompletionCurrentCriterionLabel
                    }
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制完成缺口链接" : "Copy completion gap link"}
                  </button>
                ) : null}
                {summary.latestAuditAidPreflightLabel ? (
                  <span
                    className="audit-report-ledger-preflight"
                    title={
                      summary.latestAuditAidPreflightQuery ||
                      summary.latestAuditAidPreflightActionId ||
                      summary.latestAuditAidPreflightState
                    }
                  >
                    {i18n.locale === "zh-CN" ? "最新预检" : "Latest preflight"} ·{" "}
                    {summary.latestAuditAidPreflightLabel}
                  </span>
                ) : null}
                {summary.latestAuditAidPreflightQuery ? (
                  <button onClick={() => focusAuditReportQuery(summary.latestAuditAidPreflightQuery)} type="button">
                    {i18n.locale === "zh-CN" ? "定位预检" : "Focus preflight"}
                  </button>
                ) : null}
                {summary.latestAuditAidPreflightQuery ? (
                  <button onClick={() => onCopyQueryLink(summary.latestAuditAidPreflightQuery)} type="button">
                    {i18n.locale === "zh-CN" ? "复制预检链接" : "Copy preflight link"}
                  </button>
                ) : null}
                {summary.latestAuditAidBacklogReadinessLabel ? (
                  <span
                    className={`audit-report-ledger-p0-backlog ${
                      !summary.latestAuditAidBacklogReadinessRecorded
                        ? "muted"
                        : summary.latestAuditAidBacklogNotExecutableCount > 0
                          ? "blocked"
                          : "ready"
                    }`}
                    title={summary.latestAuditAidBacklogReadinessTitle || summary.latestAuditAidBacklogReadinessLabel}
                  >
                    {p0BacklogReadinessLabelText(i18n, summary.latestAuditAidBacklogReadinessLabel)}
                  </span>
                ) : null}
                {summary.latestAuditAidBacklogReadinessQuery ? (
                  <button onClick={() => focusAuditReportQuery(summary.latestAuditAidBacklogReadinessQuery)} type="button">
                    {i18n.locale === "zh-CN" ? "定位缺口队列" : "Focus backlog"}
                  </button>
                ) : null}
                {summary.latestAuditAidBacklogReadinessQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.latestAuditAidBacklogReadinessQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制缺口队列链接" : "Copy backlog link"}
                  </button>
                ) : null}
                {summary.latestAuditAidPreflightActionLabel ? (
                  <span title={summary.latestAuditAidPreflightActionId}>
                    {i18n.locale === "zh-CN" ? "下一步" : "Next action"}{" "}
                    <strong>
                      {p0PaperExecutionPreflightActionLabel(i18n, summary.latestAuditAidPreflightActionLabel)}
                    </strong>
                  </span>
                ) : null}
                {latestAuditAidCurrentGapAction ? (
                  <span title={latestAuditAidCurrentGapAction.actionId || latestAuditAidCurrentGapAction.query}>
                    {i18n.locale === "zh-CN" ? "当前缺口" : "Current gap"}{" "}
                    <strong>{goldenPathActionLabelText(i18n, latestAuditAidCurrentGapAction.actionLabel)}</strong>
                    <small
                      className="audit-report-ledger-p0-action-state ready"
                      title={summary.latestAuditAidCurrentGapReadinessTitle || latestAuditAidCurrentGapAction.executableActionId}
                    >
                      {p0CurrentGapActionReadinessLabel(i18n, latestAuditAidCurrentGapActionReadiness)}
                    </small>
                    {latestAuditAidCurrentGapAction.targetWorkspaceId ? (
                      <small>{" -> "}{productWorkAreaIdLabelText(i18n, latestAuditAidCurrentGapAction.targetWorkspaceId)}</small>
                    ) : null}
                    <button onClick={() => focusAuditReportQuery(latestAuditAidCurrentGapAction.query)} type="button">
                      {i18n.locale === "zh-CN" ? "定位下一步" : "Focus next"}
                    </button>
                    <button
                      onClick={() => onCopyP0ActionLink(latestAuditAidCurrentGapAction.deepLinkSearch)}
                      type="button"
                    >
                      {i18n.locale === "zh-CN" ? "复制下一步链接" : "Copy next link"}
                    </button>
                  </span>
                ) : null}
                {!latestAuditAidCurrentGapAction && latestAuditAidCurrentGapActionReadiness.actionId ? (
                  <span title={latestAuditAidCurrentGapActionReadiness.actionId}>
                    {i18n.locale === "zh-CN" ? "当前缺口" : "Current gap"}{" "}
                    <strong>{goldenPathActionIdLabel(i18n, latestAuditAidCurrentGapActionReadiness.actionId)}</strong>
                    <small
                      className="audit-report-ledger-p0-action-state blocked"
                      title={summary.latestAuditAidCurrentGapReadinessTitle || latestAuditAidCurrentGapActionReadiness.reason}
                    >
                      {p0CurrentGapActionReadinessLabel(i18n, latestAuditAidCurrentGapActionReadiness)}
                    </small>
                    {summary.latestAuditAidCurrentGapReadinessQuery ? (
                      <button onClick={() => focusAuditReportQuery(summary.latestAuditAidCurrentGapReadinessQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "定位当前缺口" : "Focus current gap"}
                      </button>
                    ) : null}
                    {summary.latestAuditAidCurrentGapReadinessQuery ? (
                      <button
                        onClick={() => onCopyQueryLink(summary.latestAuditAidCurrentGapReadinessQuery)}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "复制当前缺口链接" : "Copy current gap link"}
                      </button>
                    ) : null}
                  </span>
                ) : null}
                {summary.latestAuditAidPreflightAttention > 0 ? (
                  <span title={summary.latestAuditAidPreflightLabel}>
                    {i18n.locale === "zh-CN" ? "预检关注" : "Preflight attention"}{" "}
                    <strong>{summary.latestAuditAidPreflightAttention}</strong>
                  </span>
                ) : null}
              </span>
            ) : null}
            {hasLocalReviewBundleSummary ? (
              <span title={localReviewBundleSummaryTitle}>
                {i18n.locale === "zh-CN" ? "本地复核集" : "Local review bundle"}{" "}
                <strong>{summary.localReviewBundleCount}</strong>
                <small>
                  {i18n.locale === "zh-CN" ? "个人/小团队" : "Personal/team"}{" "}
                  {summary.localReviewBundlePersonalTeamCount} ·{" "}
                  {i18n.locale === "zh-CN" ? "每日复核" : "Daily reviews"}{" "}
                  {summary.localReviewBundleDailyOpsCount} ·{" "}
                  {i18n.locale === "zh-CN" ? "每日启动" : "Daily start"}{" "}
                  {summary.localReviewBundleDailyStartCount} ·{" "}
                  {i18n.locale === "zh-CN" ? "Stage 1 归档" : "Stage 1 archive"}{" "}
                  {summary.localReviewBundleStage1ArchiveCount}
                </small>
                {summary.localReviewBundleLatestLabel ? (
                  <small title={summary.localReviewBundleLatestTitle || summary.localReviewBundleLatestQuery}>
                    {i18n.locale === "zh-CN" ? "最新本地复核" : "Latest local review"} ·{" "}
                    {summary.localReviewBundleLatestEventId}
                  </small>
                ) : null}
                {summary.localReviewBundleCoverageQuery ? (
                  <small
                    title={
                      summary.localReviewBundleCoverageTitle ||
                      summary.localReviewBundleCoverageLabel ||
                      summary.localReviewBundleCoverageQuery
                    }
                  >
                    {i18n.locale === "zh-CN" ? "本地复核覆盖" : "Local review coverage"} ·{" "}
                    {summary.localReviewBundleCoverageState}
                  </small>
                ) : null}
                {summary.localReviewBundleCoverageNextActionLabel ? (
                  <small
                    title={localReviewCoverageNextActionTitle(i18n, localReviewCoverageNextActionState, summary.localReviewBundleCoverageNextActionTitle, summary.localReviewBundleCoverageNextActionQuery, summary.localReviewBundleCoverageNextActionLabel)}
                  >
                    {i18n.locale === "zh-CN" ? "覆盖下一步" : "Coverage next"} ·{" "}
                    {localReviewCoverageNextActionState
                      ? localReviewCoverageNextActionLabel(i18n, localReviewCoverageNextActionState)
                      : summary.localReviewBundleCoverageNextActionLabel}
                  </small>
                ) : null}
                {summary.localReviewBundleQuery ? (
                  <button onClick={() => focusAuditReportQuery(summary.localReviewBundleQuery)} type="button">
                    {i18n.locale === "zh-CN" ? "定位本地复核集" : "Focus local reviews"}
                  </button>
                ) : null}
                {summary.localReviewBundleQuery ? (
                  <button onClick={() => onCopyQueryLink(summary.localReviewBundleQuery)} type="button">
                    {i18n.locale === "zh-CN" ? "复制本地复核集链接" : "Copy local reviews link"}
                  </button>
                ) : null}
                {summary.localReviewBundleCoverageQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.localReviewBundleCoverageQuery)}
                    title={summary.localReviewBundleCoverageTitle || summary.localReviewBundleCoverageQuery}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位本地复核覆盖" : "Focus local coverage"}
                  </button>
                ) : null}
                {summary.localReviewBundleCoverageQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.localReviewBundleCoverageQuery)}
                    title={summary.localReviewBundleCoverageTitle || summary.localReviewBundleCoverageQuery}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制本地复核覆盖链接" : "Copy local coverage link"}
                  </button>
                ) : null}
                {summary.localReviewBundleCoverageNextActionQuery ? (
                  <button
                    onClick={() =>
                      localReviewCoverageNextActionWorkspaceId
                        ? onFocusLocalReviewCoverageNextAction(localReviewCoverageNextActionWorkspaceId, summary.localReviewBundleCoverageNextActionQuery)
                        : focusAuditReportQuery(summary.localReviewBundleCoverageNextActionQuery)
                    }
                    title={localReviewCoverageNextActionTitle(i18n, localReviewCoverageNextActionState, summary.localReviewBundleCoverageNextActionTitle, summary.localReviewBundleCoverageNextActionQuery)}
                    type="button"
                  >
                    {localReviewCoverageNextActionFocusLabel(i18n, localReviewCoverageNextActionState)}
                  </button>
                ) : null}
                {localReviewCoverageNextActionWorkspaceId ? (
                  <button
                    onClick={() => onCopyLocalReviewCoverageNextActionLink(localReviewCoverageNextActionWorkspaceId, summary.localReviewBundleCoverageNextActionQuery)}
                    title={localReviewCoverageNextActionTitle(i18n, localReviewCoverageNextActionState, summary.localReviewBundleCoverageNextActionTitle, summary.localReviewBundleCoverageNextActionQuery)}
                    type="button"
                  >
                    {localReviewCoverageNextActionCopyLabel(i18n, localReviewCoverageNextActionState)}
                  </button>
                ) : null}
                {localReviewCoverageNextActionWorkspaceId ? (
                  <button
                    onClick={() => onOpenLocalReviewCoverageNextAction(localReviewCoverageNextActionWorkspaceId, summary.localReviewBundleCoverageNextActionQuery)}
                    title={localReviewCoverageNextActionTitle(i18n, localReviewCoverageNextActionState, summary.localReviewBundleCoverageNextActionTitle, summary.localReviewBundleCoverageNextActionQuery)}
                    type="button"
                  >
                    {localReviewCoverageNextActionOpenSourceLabel(i18n, localReviewCoverageNextActionState)}
                  </button>
                ) : null}
                {summary.localReviewBundleLatestQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.localReviewBundleLatestQuery)}
                    title={summary.localReviewBundleLatestTitle || summary.localReviewBundleLatestQuery}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位最新本地复核" : "Focus latest local review"}
                  </button>
                ) : null}
                {summary.localReviewBundleLatestQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.localReviewBundleLatestQuery)}
                    title={summary.localReviewBundleLatestTitle || summary.localReviewBundleLatestQuery}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制最新本地复核链接" : "Copy latest local review link"}
                  </button>
                ) : null}
              </span>
            ) : null}
            {summary.latestPersonalTeamReadinessReviewEventId ? (
              <span
                title={
                  summary.latestPersonalTeamReadinessReviewTitle ||
                  summary.latestPersonalTeamReadinessReviewEventId
                }
              >
                {i18n.locale === "zh-CN" ? "最新可用性复核" : "Latest readiness review"}{" "}
                <strong>
                  {summary.latestPersonalTeamReadinessReviewShortHash ||
                    summary.latestPersonalTeamReadinessReviewEventId}
                </strong>
                {summary.latestPersonalTeamReadinessReviewLabel ? (
                  <span
                    className="audit-report-ledger-personal-team-review"
                    title={
                      summary.latestPersonalTeamReadinessReviewTitle ||
                      summary.latestPersonalTeamReadinessReviewQuery
                    }
                  >
                    {summary.latestPersonalTeamReadinessReviewLabel}
                  </span>
                ) : null}
                {summary.latestPersonalTeamReadinessReviewQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.latestPersonalTeamReadinessReviewQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位最新可用性复核" : "Focus latest readiness review"}
                  </button>
                ) : null}
                {summary.latestPersonalTeamReadinessReviewQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.latestPersonalTeamReadinessReviewQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制最新可用性复核链接" : "Copy latest readiness review link"}
                  </button>
                ) : null}
              </span>
            ) : null}
            {summary.latestDailyOpsControlRoomReviewEventId ? (
              <span
                title={
                  summary.latestDailyOpsControlRoomReviewTitle ||
                  summary.latestDailyOpsControlRoomReviewEventId
                }
              >
                {i18n.locale === "zh-CN" ? "最新每日复核" : "Latest daily review"}{" "}
                <strong>
                  {summary.latestDailyOpsControlRoomReviewShortHash ||
                    summary.latestDailyOpsControlRoomReviewEventId}
                </strong>
                {summary.latestDailyOpsControlRoomReviewLabel ? (
                  <span
                    className="audit-report-ledger-daily-ops-review"
                    title={
                      summary.latestDailyOpsControlRoomReviewTitle ||
                      summary.latestDailyOpsControlRoomReviewQuery
                    }
                  >
                    {summary.latestDailyOpsControlRoomReviewLabel}
                  </span>
                ) : null}
                {summary.latestDailyOpsControlRoomReviewQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.latestDailyOpsControlRoomReviewQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位最新每日复核" : "Focus latest daily review"}
                  </button>
                ) : null}
                {summary.latestDailyOpsControlRoomReviewQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.latestDailyOpsControlRoomReviewQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制最新每日复核链接" : "Copy latest daily review link"}
                  </button>
                ) : null}
              </span>
            ) : null}
            {summary.latestDailyStartBriefReviewEventId ? (
              <span
                title={
                  summary.latestDailyStartBriefReviewTitle ||
                  summary.latestDailyStartBriefReviewEventId
                }
              >
                {i18n.locale === "zh-CN" ? "最新启动复核" : "Latest start review"}{" "}
                <strong>
                  {summary.latestDailyStartBriefReviewShortHash ||
                    summary.latestDailyStartBriefReviewEventId}
                </strong>
                {summary.latestDailyStartBriefReviewLabel ? (
                  <span
                    className="audit-report-ledger-daily-start-review"
                    title={
                      summary.latestDailyStartBriefReviewTitle ||
                      summary.latestDailyStartBriefReviewQuery
                    }
                  >
                    {summary.latestDailyStartBriefReviewLabel}
                  </span>
                ) : null}
                {summary.latestDailyStartBriefReviewQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.latestDailyStartBriefReviewQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位最新启动复核" : "Focus latest start review"}
                  </button>
                ) : null}
                {summary.latestDailyStartBriefReviewQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.latestDailyStartBriefReviewQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制最新启动复核链接" : "Copy latest start review link"}
                  </button>
                ) : null}
              </span>
            ) : null}
            {summary.latestStage1DailyArchiveReviewEventId ? (
              <span
                title={
                  summary.latestStage1DailyArchiveReviewTitle ||
                  summary.latestStage1DailyArchiveReviewEventId
                }
              >
                {i18n.locale === "zh-CN" ? "最新归档复核" : "Latest archive review"}{" "}
                <strong>
                  {summary.latestStage1DailyArchiveReviewShortHash ||
                    summary.latestStage1DailyArchiveReviewEventId}
                </strong>
                {summary.latestStage1DailyArchiveReviewLabel ? (
                  <span
                    className="audit-report-ledger-stage1-archive-review"
                    title={
                      summary.latestStage1DailyArchiveReviewTitle ||
                      summary.latestStage1DailyArchiveReviewQuery
                    }
                  >
                    {summary.latestStage1DailyArchiveReviewLabel}
                  </span>
                ) : null}
                {summary.latestStage1DailyArchiveReviewQuery ? (
                  <button
                    onClick={() => focusAuditReportQuery(summary.latestStage1DailyArchiveReviewQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "定位最新归档复核" : "Focus latest archive review"}
                  </button>
                ) : null}
                {summary.latestStage1DailyArchiveReviewQuery ? (
                  <button
                    onClick={() => onCopyQueryLink(summary.latestStage1DailyArchiveReviewQuery)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "复制最新归档复核链接" : "Copy latest archive review link"}
                  </button>
                ) : null}
              </span>
            ) : null}
            {summary.latestAuditAidPreparationEvidenceLabel ? (
              <span title={summary.latestAuditAidPreparationEvidenceRunId}>
                {i18n.locale === "zh-CN" ? "数据准备" : "Data prep"}{" "}
                <strong>{summary.latestAuditAidPreparationEvidenceLabel}</strong>
                <button onClick={() => focusAuditReportQuery(summary.latestAuditAidPreparationEvidenceRunId)} type="button">
                  {i18n.locale === "zh-CN" ? "定位数据准备" : "Focus prep"}
                </button>
                <button onClick={() => onCopyQueryLink(summary.latestAuditAidPreparationEvidenceRunId)} type="button">
                  {i18n.locale === "zh-CN" ? "复制数据准备链接" : "Copy prep link"}
                </button>
              </span>
            ) : null}
            {summary.latestPreLiveRunbookEventId ? (
              <span title={summary.latestPreLiveRunbookEventId}>
                {i18n.locale === "zh-CN" ? "最新运行手册" : "Latest runbook"}{" "}
                <strong>{summary.latestPreLiveRunbookAdapterId}</strong>
                <small>
                  {summary.latestPreLiveRunbookContextLabel} · {summary.latestPreLiveRunbookStatus} ·{" "}
                  {summary.latestPreLiveRunbookShortHash || "n/a"}
                </small>
                <span className="audit-report-ledger-pre-live" title={summary.latestPreLiveRunbookQuery}>
                  {summary.latestPreLiveRunbookGateLabel} ·{" "}
                  {auditReportLedgerPreLiveRunbookEvidenceLabel(
                    i18n,
                    summary.latestPreLiveRunbookEvidenceCount,
                    summary.latestPreLiveRunbookEvidenceLabel
                  )}
                </span>
                {summary.latestPreLiveRunbookQuery ? (
                  <button onClick={() => focusAuditReportQuery(summary.latestPreLiveRunbookQuery)} type="button">
                    {i18n.locale === "zh-CN" ? "定位运行手册" : "Focus runbook"}
                  </button>
                ) : null}
                {summary.latestPreLiveRunbookQuery ? (
                  <button onClick={() => onCopyQueryLink(summary.latestPreLiveRunbookQuery)} type="button">
                    {i18n.locale === "zh-CN" ? "复制运行手册链接" : "Copy runbook link"}
                  </button>
                ) : null}
              </span>
            ) : null}
            {summary.latestResearchContextReportRunId ? (
              <span title={summary.latestResearchContextReportLabel || summary.latestResearchContextReportLinkSearch}>
                {i18n.locale === "zh-CN" ? "最新研究上下文" : "Latest research"}{" "}
                <strong>{summary.latestResearchContextReportRunId}</strong>
                {summary.latestResearchContextReportShortHash ? (
                  <small>
                    {summary.latestResearchContextReportShortHash} ·{" "}
                    {summary.latestResearchContextReportPreflightStatus || "n/a"}
                  </small>
                ) : null}
                {summary.latestResearchContextReportPreparationEvidenceRunId ? (
                  <span
                    className="audit-report-ledger-preparation"
                    title={summary.latestResearchContextReportPreparationEvidenceRunId}
                  >
                    {i18n.locale === "zh-CN" ? "数据准备" : "Data prep"} · prep{" "}
                    {summary.latestResearchContextReportPreparationEvidenceRunId}
                  </span>
                ) : null}
                {summary.latestResearchContextReportQuery ? (
                  <button onClick={() => focusAuditReportQuery(summary.latestResearchContextReportQuery)} type="button">
                    {i18n.locale === "zh-CN" ? "定位研究报告" : "Focus research report"}
                  </button>
                ) : null}
                {summary.latestResearchContextReportLinkSearch ? (
                  <button
                    onClick={() => onOpenResearchContextLink(summary.latestResearchContextReportLinkSearch)}
                    type="button"
                  >
                    {i18n.locale === "zh-CN" ? "打开研究上下文" : "Open research"}
                  </button>
                ) : null}
                {summary.latestResearchContextReportLinkSearch ? (
                  <button onClick={() => onCopyEvidenceLink(summary.latestResearchContextReportLinkSearch)} type="button">
                    {i18n.locale === "zh-CN" ? "复制研究链接" : "Copy research link"}
                  </button>
                ) : null}
              </span>
            ) : null}
            <span>
              {i18n.locale === "zh-CN" ? "未签名" : "Unsigned"} <strong>{summary.unsigned}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "已签名" : "Signed"} <strong>{summary.signed}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "已验证" : "Verified"} <strong>{summary.verified}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "导入验签" : "Import verify"}{" "}
              <strong>
                {summary.importVerificationVerified}/{summary.importVerificationInvalid}
              </strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "需关注" : "Attention"} <strong>{summary.attention}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "最新" : "Latest"}{" "}
              {summary.latestReportLabel ? (
                <small title={summary.latestReportKind}>
                  {auditReportLedgerReportKindLabel(i18n, summary.latestReportLabel)}
                </small>
              ) : null}{" "}
              <strong>{summary.latestHash ? summary.latestHash.slice(0, 12) : "n/a"}</strong>
              {summary.latestReportQuery ? (
                <button onClick={() => focusAuditReportQuery(summary.latestReportQuery)} type="button">
                  {i18n.locale === "zh-CN" ? "定位最新" : "Focus latest"}
                </button>
              ) : null}
            </span>
          </div>
          <div className="audit-report-ledger-query-tools">
            <input
              aria-label={i18n.locale === "zh-CN" ? "搜索审计报告历史" : "Search audit report ledger"}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={i18n.locale === "zh-CN" ? "搜索 run / hash / focus" : "Search run / hash / focus"}
              type="search"
              value={query}
            />
            <button disabled={!query.trim()} onClick={() => onCopyQueryLink(query)} type="button">
              {i18n.locale === "zh-CN" ? "复制当前查询" : "Copy query link"}
            </button>
            <button disabled={!query.trim()} onClick={() => onQueryChange("")} type="button">
              {i18n.locale === "zh-CN" ? "清空查询" : "Clear query"}
            </button>
          </div>
        </div>
        {pagination ? (
          <div className="audit-report-ledger-pagination">
            <button disabled={!canPageBack || isLoading} onClick={onPreviousPage} type="button">
              {i18n.locale === "zh-CN" ? "上一页" : "Prev"}
            </button>
            <span>{isLoading ? (i18n.locale === "zh-CN" ? "加载中" : "Loading") : pageLabel}</span>
            <button disabled={!canPageForward || isLoading} onClick={onNextPage} type="button">
              {i18n.locale === "zh-CN" ? "下一页" : "Next"}
            </button>
          </div>
        ) : null}
        <div className="audit-report-ledger-list">
          {visibleRows.length ? (
            visibleRows.map((row) => {
              const rowCurrentGapAction = buildAuditEvidenceReportLedgerRowCurrentGapActionDescriptor(row);
              const rowCurrentGapActionReadiness = buildAuditEvidenceReportLedgerRowCurrentGapActionReadiness(row);
              const rowCurrentGapReadinessQuery = buildAuditEvidenceReportLedgerRowCurrentGapReadinessQuery(row);
              const rowCurrentGapReadinessTitle = buildAuditEvidenceReportLedgerRowCurrentGapReadinessTitle(row);
              const rowP0BacklogReadinessLabel = buildAuditEvidenceReportLedgerRowP0BacklogReadinessLabel(row);
              const rowP0BacklogReadinessTitle = buildAuditEvidenceReportLedgerRowP0BacklogReadinessTitle(row);
              const rowP0BacklogReadinessQuery = buildAuditEvidenceReportLedgerRowP0BacklogReadinessQuery(row);
              const rowP0CompletionLabel = buildAuditEvidenceReportLedgerRowP0CompletionLabel(row);
              const rowP0CompletionTitle = buildAuditEvidenceReportLedgerRowP0CompletionTitle(row);
              const rowP0CompletionQuery = buildAuditEvidenceReportLedgerRowP0CompletionQuery(row);
              const rowP0ProgressLabel = buildAuditEvidenceReportLedgerRowP0ProgressLabel(row);
              const rowP0ProgressQuery = buildAuditEvidenceReportLedgerRowP0ProgressQuery(row);
              const rowP0PreflightQuery = buildAuditEvidenceReportLedgerRowP0PreflightQuery(row);
              const rowP0ReadinessReportQuery = buildAuditEvidenceReportLedgerRowP0ReadinessReportQuery(row);
              const rowPreLiveRunbookQuery = buildAuditEvidenceReportLedgerRowPreLiveRunbookQuery(row);
              const rowPersonalTeamReadinessReviewLabel =
                buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewLabel(row);
              const rowPersonalTeamReadinessReviewTitle =
                buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewTitle(row);
              const rowPersonalTeamReadinessReviewQuery =
                buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewQuery(row);
              const rowDailyOpsControlRoomReviewLabel =
                buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewLabel(row);
              const rowDailyOpsControlRoomReviewTitle =
                buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewTitle(row);
              const rowDailyOpsControlRoomReviewQuery =
                buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewQuery(row);
              const rowDailyStartBriefReviewLabel = buildAuditEvidenceReportLedgerRowDailyStartBriefReviewLabel(row);
              const rowDailyStartBriefReviewTitle = buildAuditEvidenceReportLedgerRowDailyStartBriefReviewTitle(row);
              const rowDailyStartBriefReviewQuery = buildAuditEvidenceReportLedgerRowDailyStartBriefReviewQuery(row);
              const rowStage1DailyArchiveReviewLabel = buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewLabel(row);
              const rowStage1DailyArchiveReviewTitle = buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewTitle(row);
              const rowStage1DailyArchiveReviewQuery = buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewQuery(row);
              const rowCompletionGapWorkspaceId = row.p0CompletionCurrentCriterionTargetWorkspaceId;
              const rowLocalReviewCoverageNextActionWorkspaceId =
                row.localReviewBundleCoverageNextActionTargetWorkspaceId;
              const rowLocalReviewCoverageNextActionState = localReviewCoverageNextActionStateFromParts(
                rowLocalReviewCoverageNextActionWorkspaceId,
                row.localReviewBundleCoverageNextActionQuery
              );
              const preparationEvidenceRunId =
                row.p0PreparationEvidenceRunId || row.researchContextPreparationEvidenceRunId;

              return (
              <article className={`audit-report-ledger-row ${row.tone} ${row.status}`} key={row.id}>
                <span>{auditReportLedgerStatusLabel(i18n, row.statusLabel)}</span>
                <strong>
                  {row.fileName}
                  <small>{row.runId}</small>
                </strong>
                <p>
                  <b>{row.shortHash}</b>
                  <small>{row.detail}</small>
                  <em>
                    {row.reportKind === "backtest_report"
                      ? `${row.reportKind} · ${row.focusQuery || "focus:none"}`
                      : row.focusQuery || "focus:none"}
                  </em>
                  {row.evidenceLinkLabel ? (
                    <span className="audit-report-ledger-evidence" title={row.evidenceLinkDecodedSearch}>
                      {row.evidenceLinkLabel}
                    </span>
                  ) : null}
                  {row.researchContextLinkLabel ? (
                    <span className="audit-report-ledger-research-context" title={row.researchContextLinkDecodedSearch}>
                      {row.researchContextLinkLabel}
                    </span>
                  ) : null}
                  {row.p2ReadinessAcceptanceCoverageReviewLinkLabel ? (
                    <span
                      className="audit-report-ledger-p2-coverage-review"
                      title={row.p2ReadinessAcceptanceCoverageReviewLinkQuery}
                    >
                      {i18n.locale === "zh-CN" ? "覆盖复核" : "Coverage review"} ·{" "}
                      {row.p2ReadinessAcceptanceCoverageReviewLinkLabel}
                    </span>
                  ) : null}
                  {row.p2ReadinessEvidenceCoverageAcceptanceReviewLinkLabel ? (
                    <span
                      className="audit-report-ledger-p2-acceptance-review"
                      title={row.p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery}
                    >
                      {i18n.locale === "zh-CN" ? "顶层复核" : "Acceptance review"} ·{" "}
                      {row.p2ReadinessEvidenceCoverageAcceptanceReviewLinkLabel}
                    </span>
                  ) : null}
                  {row.p2ReadinessReviewChainLabel ? (
                    <span
                      className="audit-report-ledger-p2-review-chain"
                      title={row.p2ReadinessReviewChainQuery}
                    >
                      {i18n.locale === "zh-CN" ? "整条复核链" : "Review chain"} ·{" "}
                      {row.p2ReadinessReviewChainLabel}
                    </span>
                  ) : null}
                  {row.p2ReadinessReviewChainStatusLabel ? (
                    <span
                      className={`audit-report-ledger-p2-review-chain-status ${
                        row.p2ReadinessReviewChainCoverageLoaded && row.p2ReadinessReviewChainAcceptanceLoaded
                          ? "loaded"
                          : "missing"
                      }`}
                      title={row.p2ReadinessReviewChainStatusQuery}
                    >
                      {row.p2ReadinessReviewChainCoverageLoaded && row.p2ReadinessReviewChainAcceptanceLoaded
                        ? i18n.locale === "zh-CN"
                          ? "复核链已加载"
                          : "Review chain loaded"
                        : !row.p2ReadinessReviewChainAcceptanceLoaded
                          ? i18n.locale === "zh-CN"
                            ? "复核链缺顶层复核"
                            : "Review chain missing acceptance"
                        : i18n.locale === "zh-CN"
                          ? "复核链缺 coverage"
                          : "Review chain missing coverage"}
                    </span>
                  ) : null}
                  {rowPersonalTeamReadinessReviewLabel ? (
                    <span
                      className="audit-report-ledger-personal-team-review"
                      title={rowPersonalTeamReadinessReviewTitle || rowPersonalTeamReadinessReviewQuery}
                    >
                      {i18n.locale === "zh-CN" ? "个人/小团队复核" : "Personal/team review"} ·{" "}
                      {rowPersonalTeamReadinessReviewLabel}
                    </span>
                  ) : null}
                  {rowDailyOpsControlRoomReviewLabel ? (
                    <span
                      className="audit-report-ledger-daily-ops-review"
                      title={rowDailyOpsControlRoomReviewTitle || rowDailyOpsControlRoomReviewQuery}
                    >
                      {i18n.locale === "zh-CN" ? "每日操作复核" : "Daily ops review"} ·{" "}
                      {rowDailyOpsControlRoomReviewLabel}
                    </span>
                  ) : null}
                  {rowDailyStartBriefReviewLabel ? (
                    <span
                      className="audit-report-ledger-daily-start-review"
                      title={rowDailyStartBriefReviewTitle || rowDailyStartBriefReviewQuery}
                    >
                      {i18n.locale === "zh-CN" ? "每日启动复核" : "Daily start review"} ·{" "}
                      {rowDailyStartBriefReviewLabel}
                    </span>
                  ) : null}
                  {rowStage1DailyArchiveReviewLabel ? (
                    <span
                      className="audit-report-ledger-stage1-archive-review"
                      title={rowStage1DailyArchiveReviewTitle || rowStage1DailyArchiveReviewQuery}
                    >
                      {i18n.locale === "zh-CN" ? "Stage 1 归档复核" : "Stage 1 archive review"} ·{" "}
                      {rowStage1DailyArchiveReviewLabel}
                    </span>
                  ) : null}
                  {row.localReviewBundleContextQuery ? (
                    <span
                      className="audit-report-ledger-local-review-bundle"
                      title={row.localReviewBundleContextTitle || row.localReviewBundleContextQuery}
                    >
                      {i18n.locale === "zh-CN" ? "本地复核集" : "Local review bundle"} ·{" "}
                      {row.localReviewBundleContextLabel || row.localReviewBundleContextQuery}
                    </span>
                  ) : null}
                  {row.localReviewBundleCoverageQuery ? (
                    <span
                      className="audit-report-ledger-local-review-coverage"
                      title={row.localReviewBundleCoverageTitle || row.localReviewBundleCoverageQuery}
                    >
                      {i18n.locale === "zh-CN" ? "本地复核覆盖" : "Local review coverage"} ·{" "}
                      {row.localReviewBundleCoverageQuery}
                    </span>
                  ) : null}
                  {row.localReviewBundleCoverageNextActionQuery ? (
                    <span
                      className="audit-report-ledger-local-review-coverage-next"
                      title={localReviewCoverageNextActionTitle(i18n, rowLocalReviewCoverageNextActionState, row.localReviewBundleCoverageNextActionTitle, row.localReviewBundleCoverageNextActionQuery)}
                    >
                      {i18n.locale === "zh-CN" ? "覆盖下一步" : "Coverage next"} ·{" "}
                      {rowLocalReviewCoverageNextActionState
                        ? localReviewCoverageNextActionLabel(i18n, rowLocalReviewCoverageNextActionState)
                        : row.localReviewBundleCoverageNextActionQuery}
                    </span>
                  ) : null}
                  {row.localReviewBundleLatestLabel ? (
                    <span
                      className="audit-report-ledger-local-review-latest"
                      title={row.localReviewBundleLatestTitle || row.localReviewBundleLatestQuery}
                    >
                      {i18n.locale === "zh-CN" ? "最新本地复核" : "Latest local review"} ·{" "}
                      {row.localReviewBundleLatestLabel}
                    </span>
                  ) : null}
                  {rowP0ProgressLabel ? (
                    <span
                      className="audit-report-ledger-p0-progress"
                      title={rowP0ProgressQuery || rowP0ReadinessReportQuery || rowP0ProgressLabel}
                    >
                      {i18n.locale === "zh-CN" ? "P0 进度" : "P0 progress"} · {rowP0ProgressLabel}
                    </span>
                  ) : null}
                  {rowP0CompletionLabel ? (
                    <span
                      className={`audit-report-ledger-p0-completion ${
                        !row.p0CompletionReadinessRecorded ? "muted" : "ready"
                      }`}
                      title={rowP0CompletionTitle || rowP0CompletionQuery || rowP0CompletionLabel}
                    >
                      {i18n.locale === "zh-CN" ? "P0 完成定义" : "P0 completion"} ·{" "}
                      {p0CompletionLedgerLabelText(i18n, rowP0CompletionLabel)}
                    </span>
                  ) : null}
                  {row.paperPreflightLabel ? (
                    <span
                      className="audit-report-ledger-preflight"
                      title={rowP0PreflightQuery || row.paperPreflightActionId || row.paperPreflightState}
                    >
                      {row.paperPreflightLabel}
                    </span>
                  ) : null}
                  {row.p0CurrentGapActionLabel || row.p0CurrentGapActionId ? (
                    <span
                      className="audit-report-ledger-p0-action"
                      title={rowCurrentGapReadinessTitle || row.p0CurrentGapActionId || row.p0CurrentGapActionLabel}
                    >
                      {i18n.locale === "zh-CN" ? "当前缺口下一步" : "Current gap next"} ·{" "}
                      {goldenPathActionLabelText(i18n, row.p0CurrentGapActionLabel || row.p0CurrentGapActionId)}
                      <small
                        className={`audit-report-ledger-p0-action-state ${rowCurrentGapActionReadiness.canExecute ? "ready" : "blocked"}`}
                        title={rowCurrentGapReadinessTitle || rowCurrentGapActionReadiness.reason}
                      >
                        {p0CurrentGapActionReadinessLabel(i18n, rowCurrentGapActionReadiness)}
                      </small>
                      {row.p0CurrentGapTargetWorkspaceId ? (
                        <>{" -> "}{productWorkAreaIdLabelText(i18n, row.p0CurrentGapTargetWorkspaceId)}</>
                      ) : null}
                    </span>
                  ) : null}
                  {preparationEvidenceRunId ? (
                    <span className="audit-report-ledger-preparation" title={preparationEvidenceRunId}>
                      {i18n.locale === "zh-CN" ? "数据准备" : "Data prep"} · prep {preparationEvidenceRunId}
                    </span>
                  ) : null}
                  {rowP0BacklogReadinessLabel ? (
                    <span
                      className={`audit-report-ledger-p0-backlog ${
                        !row.p0BacklogReadinessRecorded
                          ? "muted"
                          : row.p0BacklogNotExecutableCount > 0
                            ? "blocked"
                            : "ready"
                      }`}
                      title={rowP0BacklogReadinessTitle || rowP0BacklogReadinessLabel}
                    >
                      {i18n.locale === "zh-CN"
                        ? p0BacklogReadinessLabelText(i18n, rowP0BacklogReadinessLabel)
                        : rowP0BacklogReadinessLabel}
                    </span>
                  ) : null}
                  {rowPreLiveRunbookQuery ? (
                    <span
                      className="audit-report-ledger-pre-live"
                      title={rowPreLiveRunbookQuery}
                    >
                      {i18n.locale === "zh-CN" ? "实盘前手册" : "Pre-live runbook"} ·{" "}
                      {row.preLiveRunbookAdapterId} · {row.preLiveRunbookMarket} {row.preLiveRunbookSymbol}{" "}
                      {row.preLiveRunbookTimeframe} · {row.preLiveRunbookCompletedSteps}/
                      {row.preLiveRunbookTotalSteps} ·{" "}
                      {auditReportLedgerPreLiveRunbookEvidenceLabel(i18n, row.preLiveRunbookEvidenceIds.length)}
                    </span>
                  ) : null}
                </p>
                <em>
                  {row.packageMatched}/{row.packageTotal} · {row.importDiffBlocked}/{row.importDiffTotal}
                  {row.importVerificationDetail ? (
                    <span title={row.importVerificationDetail}>
                      {" "}
                      · {i18n.locale === "zh-CN" ? "导入验签" : "Import verify"} {row.importVerificationVerified}/
                      {row.importVerificationInvalid}
                    </span>
                  ) : null}
                </em>
                <div>
                  <small>{auditReportLedgerSignatureLabel(i18n, row.signatureLabel)}</small>
                  <small>
                    {auditReportLedgerSigningPolicyDetail(i18n, row) ||
                      (row.signatureStatus === "revoked" && row.signatureRevokedReason
                        ? row.signatureRevokedReason
                        : row.signatureDetail && row.chainId
                          ? `${row.signatureDetail} · ${row.chainId}`
                          : row.signatureDetail || row.chainId || row.signatureRevokedReason || row.signatureStatus)}
                  </small>
                  <time dateTime={row.signatureSignedAt || row.signatureVerifiedAt || row.createdAt}>
                    {researchImportAuditTimeLabel(row.signatureSignedAt || row.signatureVerifiedAt || row.createdAt)}
                  </time>
                  <span className="audit-report-ledger-actions">
                    {row.evidenceLinkSearch ? (
                      <button onClick={() => onOpenEvidenceLink(row.evidenceLinkSearch)} type="button">
                        {i18n.locale === "zh-CN" ? "打开证据" : "Open evidence"}
                      </button>
                    ) : null}
                    {row.evidenceLinkSearch ? (
                      <button onClick={() => onCopyEvidenceLink(row.evidenceLinkSearch)} type="button">
                        {i18n.locale === "zh-CN" ? "复制证据链接" : "Copy evidence link"}
                      </button>
                    ) : null}
                    {row.researchContextLinkSearch ? (
                      <button onClick={() => onOpenResearchContextLink(row.researchContextLinkSearch)} type="button">
                        {i18n.locale === "zh-CN" ? "打开研究上下文" : "Open research"}
                      </button>
                    ) : null}
                    {row.researchContextLinkSearch ? (
                      <button onClick={() => onCopyEvidenceLink(row.researchContextLinkSearch)} type="button">
                        {i18n.locale === "zh-CN" ? "复制研究链接" : "Copy research link"}
                      </button>
                    ) : null}
                    {preparationEvidenceRunId ? (
                      <button onClick={() => focusAuditReportQuery(preparationEvidenceRunId)} type="button">
                        {i18n.locale === "zh-CN" ? "定位数据准备" : "Focus prep"}
                      </button>
                    ) : null}
                    {preparationEvidenceRunId ? (
                      <button onClick={() => onCopyQueryLink(preparationEvidenceRunId)} type="button">
                        {i18n.locale === "zh-CN" ? "复制数据准备链接" : "Copy prep link"}
                      </button>
                    ) : null}
                    {rowP0ReadinessReportQuery ? (
                      <button onClick={() => focusAuditReportQuery(rowP0ReadinessReportQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "定位 P0 报告" : "Focus P0 report"}
                      </button>
                    ) : null}
                    {rowP0ReadinessReportQuery ? (
                      <button onClick={() => onCopyQueryLink(rowP0ReadinessReportQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "复制 P0 报告链接" : "Copy P0 report link"}
                      </button>
                    ) : null}
                    {rowP0ProgressQuery ? (
                      <button onClick={() => focusAuditReportQuery(rowP0ProgressQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "定位进度" : "Focus progress"}
                      </button>
                    ) : null}
                    {rowP0ProgressQuery ? (
                      <button onClick={() => onCopyQueryLink(rowP0ProgressQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "复制进度链接" : "Copy progress link"}
                      </button>
                    ) : null}
                    {rowP0CompletionQuery ? (
                      <button onClick={() => focusAuditReportQuery(rowP0CompletionQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "定位完成定义" : "Focus completion"}
                      </button>
                    ) : null}
                    {rowP0CompletionQuery ? (
                      <button onClick={() => onCopyQueryLink(rowP0CompletionQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "复制完成链接" : "Copy completion link"}
                      </button>
                    ) : null}
                    {rowCompletionGapWorkspaceId ? (
                      <button
                        onClick={() => {
                          if (rowP0CompletionQuery) {
                            focusAuditReportQuery(rowP0CompletionQuery);
                          }
                          onOpenCompletionGap(rowCompletionGapWorkspaceId);
                        }}
                        title={
                          row.p0CompletionCurrentCriterionActionLabel || row.p0CompletionCurrentCriterionLabel
                        }
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "打开完成缺口" : "Open completion gap"}
                      </button>
                    ) : null}
                    {rowCompletionGapWorkspaceId ? (
                      <button
                        onClick={() => onCopyCompletionGapLink(rowCompletionGapWorkspaceId, rowP0CompletionQuery)}
                        title={
                          row.p0CompletionCurrentCriterionActionLabel || row.p0CompletionCurrentCriterionLabel
                        }
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "复制完成缺口链接" : "Copy completion gap link"}
                      </button>
                    ) : null}
                    {rowP0PreflightQuery ? (
                      <button onClick={() => focusAuditReportQuery(rowP0PreflightQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "定位预检" : "Focus preflight"}
                      </button>
                    ) : null}
                    {rowP0PreflightQuery ? (
                      <button onClick={() => onCopyQueryLink(rowP0PreflightQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "复制预检链接" : "Copy preflight link"}
                      </button>
                    ) : null}
                    {rowPreLiveRunbookQuery ? (
                      <button onClick={() => focusAuditReportQuery(rowPreLiveRunbookQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "定位运行手册" : "Focus runbook"}
                      </button>
                    ) : null}
                    {rowPreLiveRunbookQuery ? (
                      <button onClick={() => onCopyQueryLink(rowPreLiveRunbookQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "复制运行手册链接" : "Copy runbook link"}
                      </button>
                    ) : null}
                    {rowPersonalTeamReadinessReviewQuery ? (
                      <button onClick={() => focusAuditReportQuery(rowPersonalTeamReadinessReviewQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "定位可用性复核" : "Focus readiness review"}
                      </button>
                    ) : null}
                    {rowPersonalTeamReadinessReviewQuery ? (
                      <button onClick={() => onCopyQueryLink(rowPersonalTeamReadinessReviewQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "复制可用性复核链接" : "Copy readiness review link"}
                      </button>
                    ) : null}
                    {rowDailyOpsControlRoomReviewQuery ? (
                      <button onClick={() => focusAuditReportQuery(rowDailyOpsControlRoomReviewQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "定位每日复核" : "Focus daily review"}
                      </button>
                    ) : null}
                    {rowDailyOpsControlRoomReviewQuery ? (
                      <button onClick={() => onCopyQueryLink(rowDailyOpsControlRoomReviewQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "复制每日复核链接" : "Copy daily review link"}
                      </button>
                    ) : null}
                    {rowDailyStartBriefReviewQuery ? (
                      <button onClick={() => focusAuditReportQuery(rowDailyStartBriefReviewQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "定位启动复核" : "Focus start review"}
                      </button>
                    ) : null}
                    {rowDailyStartBriefReviewQuery ? (
                      <button onClick={() => onCopyQueryLink(rowDailyStartBriefReviewQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "复制启动复核链接" : "Copy start review link"}
                      </button>
                    ) : null}
                    {rowStage1DailyArchiveReviewQuery ? (
                      <button onClick={() => focusAuditReportQuery(rowStage1DailyArchiveReviewQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "定位归档复核" : "Focus archive review"}
                      </button>
                    ) : null}
                    {rowStage1DailyArchiveReviewQuery ? (
                      <button onClick={() => onCopyQueryLink(rowStage1DailyArchiveReviewQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "复制归档复核链接" : "Copy archive review link"}
                      </button>
                    ) : null}
                    {row.localReviewBundleContextQuery ? (
                      <button
                        onClick={() => focusAuditReportQuery(row.localReviewBundleContextQuery)}
                        title={row.localReviewBundleContextTitle || row.localReviewBundleContextQuery}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "定位行本地复核集" : "Focus row local reviews"}
                      </button>
                    ) : null}
                    {row.localReviewBundleContextQuery ? (
                      <button
                        onClick={() => onCopyQueryLink(row.localReviewBundleContextQuery)}
                        title={row.localReviewBundleContextTitle || row.localReviewBundleContextQuery}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "复制行本地复核集链接" : "Copy row local reviews link"}
                      </button>
                    ) : null}
                    {row.localReviewBundleCoverageQuery ? (
                      <button
                        onClick={() => focusAuditReportQuery(row.localReviewBundleCoverageQuery)}
                        title={row.localReviewBundleCoverageTitle || row.localReviewBundleCoverageQuery}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "定位行本地复核覆盖" : "Focus row local coverage"}
                      </button>
                    ) : null}
                    {row.localReviewBundleCoverageQuery ? (
                      <button
                        onClick={() => onCopyQueryLink(row.localReviewBundleCoverageQuery)}
                        title={row.localReviewBundleCoverageTitle || row.localReviewBundleCoverageQuery}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "复制行本地复核覆盖链接" : "Copy row local coverage link"}
                      </button>
                    ) : null}
                    {row.localReviewBundleCoverageNextActionQuery ? (
                      <button
                        onClick={() =>
                          rowLocalReviewCoverageNextActionWorkspaceId
                            ? onFocusLocalReviewCoverageNextAction(rowLocalReviewCoverageNextActionWorkspaceId, row.localReviewBundleCoverageNextActionQuery)
                            : focusAuditReportQuery(row.localReviewBundleCoverageNextActionQuery)
                        }
                        title={localReviewCoverageNextActionTitle(i18n, rowLocalReviewCoverageNextActionState, row.localReviewBundleCoverageNextActionTitle, row.localReviewBundleCoverageNextActionQuery)}
                        type="button"
                      >
                        {localReviewCoverageNextActionFocusLabel(i18n, rowLocalReviewCoverageNextActionState, "row")}
                      </button>
                    ) : null}
                    {rowLocalReviewCoverageNextActionWorkspaceId ? (
                      <button
                        onClick={() => onCopyLocalReviewCoverageNextActionLink(rowLocalReviewCoverageNextActionWorkspaceId, row.localReviewBundleCoverageNextActionQuery)}
                        title={localReviewCoverageNextActionTitle(i18n, rowLocalReviewCoverageNextActionState, row.localReviewBundleCoverageNextActionTitle, row.localReviewBundleCoverageNextActionQuery)}
                        type="button"
                      >
                        {localReviewCoverageNextActionCopyLabel(i18n, rowLocalReviewCoverageNextActionState, "row")}
                      </button>
                    ) : null}
                    {rowLocalReviewCoverageNextActionWorkspaceId ? (
                      <button
                        onClick={() => onOpenLocalReviewCoverageNextAction(rowLocalReviewCoverageNextActionWorkspaceId, row.localReviewBundleCoverageNextActionQuery)}
                        title={localReviewCoverageNextActionTitle(i18n, rowLocalReviewCoverageNextActionState, row.localReviewBundleCoverageNextActionTitle, row.localReviewBundleCoverageNextActionQuery)}
                        type="button"
                      >
                        {localReviewCoverageNextActionOpenSourceLabel(i18n, rowLocalReviewCoverageNextActionState, "row")}
                      </button>
                    ) : null}
                    {row.localReviewBundleLatestQuery ? (
                      <button
                        onClick={() => focusAuditReportQuery(row.localReviewBundleLatestQuery)}
                        title={row.localReviewBundleLatestTitle || row.localReviewBundleLatestQuery}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "定位最新本地复核" : "Focus latest local review"}
                      </button>
                    ) : null}
                    {row.localReviewBundleLatestQuery ? (
                      <button
                        onClick={() => onCopyQueryLink(row.localReviewBundleLatestQuery)}
                        title={row.localReviewBundleLatestTitle || row.localReviewBundleLatestQuery}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "复制最新本地复核链接" : "Copy latest local review link"}
                      </button>
                    ) : null}
                    {row.p2ReadinessReviewChainQuery ? (
                      <button
                        onClick={() => focusAuditReportQuery(row.p2ReadinessReviewChainQuery)}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "定位整条复核链" : "Focus row chain"}
                      </button>
                    ) : null}
                    {row.p2ReadinessReviewChainQuery ? (
                      <button
                        onClick={() => onCopyQueryLink(row.p2ReadinessReviewChainQuery)}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "复制整条复核链链接" : "Copy row chain link"}
                      </button>
                    ) : null}
                    {row.p2ReadinessReviewChainStatusQuery ? (
                      <button
                        onClick={() => focusAuditReportQuery(row.p2ReadinessReviewChainStatusQuery)}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "定位复核链状态" : "Focus chain status"}
                      </button>
                    ) : null}
                    {row.p2ReadinessReviewChainStatusQuery ? (
                      <button
                        onClick={() => onCopyQueryLink(row.p2ReadinessReviewChainStatusQuery)}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "复制复核链状态链接" : "Copy chain status link"}
                      </button>
                    ) : null}
                    {row.p2ReadinessReviewChainHealthContextQuery ? (
                      <button
                        onClick={() => focusAuditReportQuery(row.p2ReadinessReviewChainHealthContextQuery)}
                        title={
                          row.p2ReadinessReviewChainHealthContextTitle ||
                          row.p2ReadinessReviewChainHealthContextQuery
                        }
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "定位行复核链健康上下文" : "Focus row chain health context"}
                      </button>
                    ) : null}
                    {row.p2ReadinessReviewChainHealthContextQuery ? (
                      <button
                        onClick={() => onCopyQueryLink(row.p2ReadinessReviewChainHealthContextQuery)}
                        title={
                          row.p2ReadinessReviewChainHealthContextTitle ||
                          row.p2ReadinessReviewChainHealthContextQuery
                        }
                        type="button"
                      >
                        {i18n.locale === "zh-CN"
                          ? "复制行复核链健康上下文链接"
                          : "Copy row chain health context link"}
                      </button>
                    ) : null}
                    {row.p2ReadinessAcceptanceCoverageReviewLinkQuery ? (
                      <button
                        onClick={() => focusAuditReportQuery(row.p2ReadinessAcceptanceCoverageReviewLinkQuery)}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "定位覆盖复核" : "Focus coverage review"}
                      </button>
                    ) : null}
                    {row.p2ReadinessAcceptanceCoverageReviewLinkQuery ? (
                      <button
                        onClick={() => onCopyQueryLink(row.p2ReadinessAcceptanceCoverageReviewLinkQuery)}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "复制覆盖复核链接" : "Copy coverage link"}
                      </button>
                    ) : null}
                    {row.p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery ? (
                      <button
                        onClick={() => focusAuditReportQuery(row.p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery)}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "定位顶层复核" : "Focus acceptance review"}
                      </button>
                    ) : null}
                    {row.p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery ? (
                      <button
                        onClick={() => onCopyQueryLink(row.p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery)}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "复制顶层复核链接" : "Copy acceptance link"}
                      </button>
                    ) : null}
                    {rowP0BacklogReadinessQuery ? (
                      <button onClick={() => focusAuditReportQuery(rowP0BacklogReadinessQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "定位缺口队列" : "Focus backlog"}
                      </button>
                    ) : null}
                    {rowP0BacklogReadinessQuery ? (
                      <button onClick={() => onCopyQueryLink(rowP0BacklogReadinessQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "复制缺口队列链接" : "Copy backlog link"}
                      </button>
                    ) : null}
                    {rowCurrentGapAction ? (
                      <button onClick={() => onOpenP0ActionLink(rowCurrentGapAction.deepLinkSearch)} type="button">
                        {i18n.locale === "zh-CN" ? "打开下一步" : "Open next step"}
                      </button>
                    ) : null}
                    {rowCurrentGapAction ? (
                      <button onClick={() => focusAuditReportQuery(rowCurrentGapAction.query)} type="button">
                        {i18n.locale === "zh-CN" ? "定位下一步" : "Focus next"}
                      </button>
                    ) : null}
                    {rowCurrentGapAction ? (
                      <button onClick={() => onCopyP0ActionLink(rowCurrentGapAction.deepLinkSearch)} type="button">
                        {i18n.locale === "zh-CN" ? "复制下一步链接" : "Copy next link"}
                      </button>
                    ) : null}
                    {!rowCurrentGapAction && rowCurrentGapReadinessQuery ? (
                      <button onClick={() => focusAuditReportQuery(rowCurrentGapReadinessQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "定位当前缺口" : "Focus current gap"}
                      </button>
                    ) : null}
                    {!rowCurrentGapAction && rowCurrentGapReadinessQuery ? (
                      <button onClick={() => onCopyQueryLink(rowCurrentGapReadinessQuery)} type="button">
                        {i18n.locale === "zh-CN" ? "复制当前缺口链接" : "Copy current gap link"}
                      </button>
                    ) : null}
                    <button
                      disabled={
                        signingEventId === row.id ||
                        verifyingEventId === row.id ||
                        revokingEventId === row.id ||
                        row.status === "invalid" ||
                        row.importVerificationInvalid > 0 ||
                        !auditReportLedgerRowIsSigningEligible(row) ||
                        row.signatureStatus === "revoked"
                      }
                      onClick={() => onSignReport(row.id)}
                      type="button"
                    >
                      {signingEventId === row.id ? (i18n.locale === "zh-CN" ? "签名中" : "Signing") : i18n.locale === "zh-CN" ? "签名" : "Sign"}
                    </button>
                    <button
                      disabled={
                        signingEventId === row.id ||
                        verifyingEventId === row.id ||
                        revokingEventId === row.id ||
                        !auditReportLedgerRowIsSigningEligible(row) ||
                        row.signatureStatus === "unsigned" ||
                        row.signatureStatus === "revoked"
                      }
                      onClick={() => onVerifyReport(row.id)}
                      type="button"
                    >
                      {verifyingEventId === row.id
                        ? i18n.locale === "zh-CN"
                          ? "验签中"
                          : "Verifying"
                        : i18n.locale === "zh-CN"
                          ? "验签"
                          : "Verify"}
                    </button>
                    <button
                      disabled={
                        signingEventId === row.id ||
                        verifyingEventId === row.id ||
                        revokingEventId === row.id ||
                        row.signatureStatus === "unsigned" ||
                        row.signatureStatus === "invalid" ||
                        !auditReportLedgerRowIsSigningEligible(row) ||
                        row.signatureStatus === "revoked"
                      }
                      onClick={() => onRevokeReport(row.id)}
                      type="button"
                    >
                      {revokingEventId === row.id ? (i18n.locale === "zh-CN" ? "撤销中" : "Revoking") : i18n.locale === "zh-CN" ? "撤销" : "Revoke"}
                    </button>
                  </span>
                </div>
              </article>
              );
            })
          ) : (
            <article className="audit-report-ledger-row empty">
              <span>{i18n.locale === "zh-CN" ? "暂无报告" : "No reports"}</span>
              <strong>
                {i18n.locale === "zh-CN" ? "生成审计报告" : "Generate an audit report"}
                <small>{i18n.locale === "zh-CN" ? "下载或导出后会入账" : "Download or export writes to the ledger"}</small>
              </strong>
              <p>
                <b>hash:n/a</b>
                <small>
                  {i18n.locale === "zh-CN"
                    ? "报告历史会保留 SHA-256、焦点和导入 diff 摘要。"
                    : "Report history keeps SHA-256, focus, and import diff summary."}
                </small>
                <em>focus:none</em>
              </p>
              <em>0/0 · 0/0</em>
              <div>
                <small>{i18n.locale === "zh-CN" ? "等待报告" : "Awaiting report"}</small>
                <time>-</time>
              </div>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

export function auditReportLedgerSigningPolicyDetail(i18n: AppI18n, row: AuditEvidenceReportLedgerRow): string {
  if (row.reportKind === "p0_readiness_report") {
    return i18n.locale === "zh-CN"
      ? "P0 就绪报告只作为审计辅助材料入账，不进入签名链或实盘授权"
      : "P0 readiness reports are audit aids only; they do not enter the signing chain or live authorization";
  }
  if (row.reportKind === "p2_manifest_chain_preflight") {
    return i18n.locale === "zh-CN"
      ? "P2 manifest 链路预检只作为操作员审计辅助材料入账，不进入签名链或实盘授权"
      : "P2 manifest chain preflights are operator audit aids only; they do not enter the signing chain or live authorization";
  }
  if (row.reportKind === "p2_readiness_acceptance_generated") {
    return i18n.locale === "zh-CN"
      ? "P2 顶层验收生成事件只作为审计辅助材料入账，不进入签名链或实盘授权"
      : "P2 readiness acceptance generation events are audit aids only; they do not enter the signing chain or live authorization";
  }
  if (row.reportKind === "pre_live_runbook_report") {
    return i18n.locale === "zh-CN"
      ? "实盘前运行手册只作为审计辅助材料入账，不进入签名链或实盘授权"
      : "Pre-live runbook reports are audit aids only; they do not enter the signing chain or live authorization";
  }
  if (row.reportKind === "research_context_readiness_report") {
    return i18n.locale === "zh-CN"
      ? "研究上下文就绪报告只作为审计辅助材料入账，不进入签名链或实盘授权"
      : "Research context readiness reports are audit aids only; they do not enter the signing chain or live authorization";
  }
  if (row.importVerificationInvalid <= 0) {
    return "";
  }
  return i18n.locale === "zh-CN" ? "导入验签失败，需先更正证据再签名" : "Import verification failed; correct evidence before signing";
}
