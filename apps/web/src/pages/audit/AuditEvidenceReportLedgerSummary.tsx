import { productWorkAreaIdLabelText } from "../../components/AppWorkflowPanels";
import { type AppI18n } from "../../lib/i18n";
import { type ProductWorkAreaId, buildAuditEvidenceReportLedgerSummary, buildLatestAuditAidCurrentGapActionDescriptor, buildLatestAuditAidCurrentGapActionReadiness } from "../../lib/terminal-workbench";
import { localReviewCoverageNextActionCopyLabel, localReviewCoverageNextActionFocusLabel, localReviewCoverageNextActionLabel, localReviewCoverageNextActionOpenSourceLabel, localReviewCoverageNextActionStateFromParts, localReviewCoverageNextActionTitle } from "../stage1/local-review-formatters";
import { goldenPathActionIdLabel, goldenPathActionLabelText, p0BacklogReadinessLabelText, p0CompletionLedgerLabelText, p0CurrentGapActionReadinessLabel, p0PaperExecutionPreflightActionLabel } from "../stage1/p0-platform-formatters";
import { auditReportLedgerPreLiveRunbookEvidenceLabel, auditReportLedgerReportKindLabel } from "./AuditLedgerFormatters";
import { type AuditEvidenceReportLedgerRow } from "../../lib/terminal-workbench";

export function AuditEvidenceReportLedgerSummary({
  i18n, onCopyCompletionGapLink, onCopyEvidenceLink, onCopyLocalReviewCoverageNextActionLink,
  onCopyP0ActionLink, onCopyQueryLink, onFocusLocalReviewCoverageNextAction, onOpenCompletionGap,
  onOpenEvidenceLink, onOpenLocalReviewCoverageNextAction, onOpenResearchContextLink, onQueryChange, rows
}: {
  i18n: AppI18n;
  rows: AuditEvidenceReportLedgerRow[];
  onQueryChange: (query: string) => void;
  onCopyCompletionGapLink: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;
  onCopyEvidenceLink: (search: string) => void;
  onCopyLocalReviewCoverageNextActionLink: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;
  onCopyP0ActionLink: (search: string) => void;
  onCopyQueryLink: (query: string) => void;
  onFocusLocalReviewCoverageNextAction: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;
  onOpenCompletionGap: (workspaceId: ProductWorkAreaId) => void;
  onOpenEvidenceLink: (search: string) => void;
  onOpenLocalReviewCoverageNextAction: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;
  onOpenResearchContextLink: (search: string) => void;
}) {
  const summary = buildAuditEvidenceReportLedgerSummary(rows);
  const latestAuditAidCurrentGapAction = buildLatestAuditAidCurrentGapActionDescriptor(summary);
  const latestAuditAidCurrentGapActionReadiness = buildLatestAuditAidCurrentGapActionReadiness(summary);
  const latestCompletionGapWorkspaceId = summary.latestAuditAidCompletionCurrentCriterionTargetWorkspaceId;
  const localReviewCoverageNextActionWorkspaceId = summary.localReviewBundleCoverageNextActionTargetWorkspaceId;
  const localReviewCoverageNextActionState = localReviewCoverageNextActionStateFromParts(localReviewCoverageNextActionWorkspaceId, summary.localReviewBundleCoverageNextActionQuery);
  const hasLocalReviewBundleSummary = summary.localReviewBundleCount > 0 || Boolean(summary.localReviewBundleCoverageQuery || summary.localReviewBundleCoverageNextActionQuery);
  const localReviewBundleSummaryTitle = summary.localReviewBundleTitle || summary.localReviewBundleCoverageTitle || summary.localReviewBundleCoverageNextActionTitle || summary.localReviewBundleCoverageQuery || summary.localReviewBundleCoverageNextActionQuery || summary.localReviewBundleQuery;
  const focusAuditReportQuery = (nextQuery: string) => onQueryChange(nextQuery);

  return (
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
  );
}
