import { type AppI18n } from "../../lib/i18n";
import { productWorkAreaIdLabelText } from "../../components/AppWorkflowPanels";
import { type AuditEvidenceReportLedgerRow, type ProductWorkAreaId, auditReportLedgerRowIsSigningEligible, buildAuditEvidenceReportLedgerRowCurrentGapActionDescriptor, buildAuditEvidenceReportLedgerRowCurrentGapActionReadiness, buildAuditEvidenceReportLedgerRowCurrentGapReadinessQuery, buildAuditEvidenceReportLedgerRowCurrentGapReadinessTitle, buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewLabel, buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewQuery, buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewTitle, buildAuditEvidenceReportLedgerRowDailyStartBriefReviewLabel, buildAuditEvidenceReportLedgerRowDailyStartBriefReviewQuery, buildAuditEvidenceReportLedgerRowDailyStartBriefReviewTitle, buildAuditEvidenceReportLedgerRowP0BacklogReadinessLabel, buildAuditEvidenceReportLedgerRowP0BacklogReadinessQuery, buildAuditEvidenceReportLedgerRowP0BacklogReadinessTitle, buildAuditEvidenceReportLedgerRowP0CompletionLabel, buildAuditEvidenceReportLedgerRowP0CompletionQuery, buildAuditEvidenceReportLedgerRowP0CompletionTitle, buildAuditEvidenceReportLedgerRowP0PreflightQuery, buildAuditEvidenceReportLedgerRowP0ProgressLabel, buildAuditEvidenceReportLedgerRowP0ProgressQuery, buildAuditEvidenceReportLedgerRowP0ReadinessReportQuery, buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewLabel, buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewQuery, buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewTitle, buildAuditEvidenceReportLedgerRowPreLiveRunbookQuery, buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewLabel, buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewQuery, buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewTitle } from "../../lib/terminal-workbench";
import { localReviewCoverageNextActionCopyLabel, localReviewCoverageNextActionFocusLabel, localReviewCoverageNextActionLabel, localReviewCoverageNextActionOpenSourceLabel, localReviewCoverageNextActionStateFromParts, localReviewCoverageNextActionTitle } from "../stage1/local-review-formatters";
import { goldenPathActionIdLabel, goldenPathActionLabelText, p0BacklogReadinessLabelText, p0CompletionLedgerLabelText, p0CurrentGapActionReadinessLabel, p0PaperExecutionPreflightActionLabel } from "../stage1/p0-platform-formatters";
import { auditReportLedgerPreLiveRunbookEvidenceLabel, auditReportLedgerReportKindLabel, auditReportLedgerSignatureLabel, auditReportLedgerStatusLabel, researchImportAuditTimeLabel } from "./AuditLedgerFormatters";
import { auditReportLedgerSigningPolicyDetail } from "./AuditEvidenceReportLedgerPolicy";

export function AuditEvidenceReportLedgerRows({ i18n, onCopyCompletionGapLink, onCopyEvidenceLink, onCopyLocalReviewCoverageNextActionLink, onCopyP0ActionLink, onCopyQueryLink, onFocusLocalReviewCoverageNextAction, onOpenCompletionGap, onOpenEvidenceLink, onOpenLocalReviewCoverageNextAction, onOpenP0ActionLink, onOpenResearchContextLink, onQueryChange, onRevokeReport, onSignReport, onVerifyReport, revokingEventId, signingEventId, verifyingEventId, visibleRows }: {
  i18n: AppI18n;
  visibleRows: AuditEvidenceReportLedgerRow[];
  onCopyCompletionGapLink: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;
  onCopyEvidenceLink: (search: string) => void;
  onCopyLocalReviewCoverageNextActionLink: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;
  onCopyP0ActionLink: (search: string) => void;
  onCopyQueryLink: (query: string) => void;
  onFocusLocalReviewCoverageNextAction: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;
  onOpenCompletionGap: (workspaceId: ProductWorkAreaId) => void;
  onOpenEvidenceLink: (search: string) => void;
  onOpenLocalReviewCoverageNextAction: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;
  onOpenP0ActionLink: (search: string) => void;
  onOpenResearchContextLink: (search: string) => void;
  onQueryChange: (query: string) => void;
  onRevokeReport: (eventId: string) => void;
  onSignReport: (eventId: string) => void;
  onVerifyReport: (eventId: string) => void;
  revokingEventId: string | null;
  signingEventId: string | null;
  verifyingEventId: string | null;
}) {
  const focusAuditReportQuery = (nextQuery: string) => onQueryChange(nextQuery);
  return (
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
  );
}
