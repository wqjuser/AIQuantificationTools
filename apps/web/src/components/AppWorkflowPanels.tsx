import { Copy, Download, Play, RefreshCw, Save, Search } from "lucide-react";
import type { AppI18n } from "../lib/i18n";
import type {
  P0GoldenPathJourney,
  ProductWorkArea,
  ProductWorkAreaId,
  Stage1P0DailyUseArchiveReviewReference,
  Stage1P0DailyUseClosure,
  Stage1P0DailyUseRefreshOutcome,
  Stage1P0DailyUseShareDeepLinkState,
  Stage1P0DailyUseStartupSnapshot
} from "../lib/terminal-workbench";

export const stage1P0DailyUseClosureElementId = "stage1-p0-daily-use-closure";

export const stage1P0DailyUsePrimaryActionElementId = "stage1-p0-daily-use-primary-action";

export const stage1P0DailyUseRefreshActionElementId = "stage1-p0-daily-use-refresh-action";

export const stage1P0DailyUseRefreshNextActionElementId = "stage1-p0-daily-use-refresh-next-action";

export const stage1P0DailyUseArchiveRecordActionElementId = "stage1-p0-daily-use-archive-record-action";

export type Stage1P0DailyUseClosureRowView = Stage1P0DailyUseClosure["rows"][number];

export function stage1P0DailyUseRowIsSharedFocus(
  state: Stage1P0DailyUseShareDeepLinkState | null | undefined,
  rowId: Stage1P0DailyUseClosure["rows"][number]["id"]
): boolean {
  return state?.kind === "daily-use" && state.focus === rowId;
}

export function stage1P0DailyUsePrimaryIsSharedFocus(
  state: Stage1P0DailyUseShareDeepLinkState | null | undefined
): boolean {
  return state?.kind === "daily-use" && state.focus === "primary";
}

export function stage1P0DailyUseRefreshEntryIsSharedFocus(
  state: Stage1P0DailyUseShareDeepLinkState | null | undefined,
  entryId: Stage1P0DailyUseRefreshOutcome["entries"][number]["id"]
): boolean {
  return state?.kind === "refresh-receipt" && state.focus === entryId;
}

export function stage1P0DailyUseRefreshNextIsSharedFocus(
  state: Stage1P0DailyUseShareDeepLinkState | null | undefined
): boolean {
  return state?.kind === "refresh-receipt" && state.focus === "next";
}

export function stage1P0DailyUseRefreshReceiptIsColdStart(
  state: Stage1P0DailyUseShareDeepLinkState | null | undefined,
  outcome: Stage1P0DailyUseRefreshOutcome | null | undefined
): boolean {
  return state?.kind === "refresh-receipt" && !outcome;
}

export function stage1P0DailyUseRowElementId(rowId: Stage1P0DailyUseClosure["rows"][number]["id"]): string {
  return `${stage1P0DailyUseClosureElementId}-row-${rowId}`;
}

export function stage1P0DailyUseRefreshEntryElementId(
  entryId: Stage1P0DailyUseRefreshOutcome["entries"][number]["id"]
): string {
  return `${stage1P0DailyUseClosureElementId}-refresh-${entryId}`;
}

export function AutomatedTradingWorkflowGuide({
  actionDisabled,
  actionLabel,
  activeWorkAreaId,
  currentWorkAreaId,
  detail,
  i18n,
  onAction,
  onSelectWorkspace,
  workAreas
}: {
  actionDisabled: boolean;
  actionLabel: string;
  activeWorkAreaId: ProductWorkAreaId;
  currentWorkAreaId: ProductWorkAreaId;
  detail: string;
  i18n: AppI18n;
  onAction: () => void;
  onSelectWorkspace: (workspaceId: ProductWorkAreaId) => void;
  workAreas: ProductWorkArea[];
}) {
  const readyCount = workAreas.filter((area) => area.status === "ready").length;

  return (
    <section className="automated-trading-guide" aria-label={i18n.locale === "zh-CN" ? "自动化交易流程" : "Automated trading workflow"}>
      <header className="automated-trading-guide-head">
        <div>
          <span>{i18n.locale === "zh-CN" ? "正常推进路线" : "Guided route"}</span>
          <strong>{i18n.locale === "zh-CN" ? "自动化交易流程" : "Automated trading workflow"}</strong>
          <small>
            {i18n.locale === "zh-CN"
                ? `从平台配置、研究验证到动态交易和审计，按顺序串联全部 ${workAreas.length} 个页面。`
                : `Connect all ${workAreas.length} pages from setup and research to dynamic trading and audit.`}
          </small>
        </div>
        <div className="automated-trading-guide-action">
          <span>{readyCount}/{workAreas.length} {i18n.locale === "zh-CN" ? "页面就绪" : "pages ready"}</span>
          <small title={detail}>{detail}</small>
          <button disabled={actionDisabled} onClick={onAction} type="button">
            <Play size={14} />
            {actionLabel}
          </button>
        </div>
      </header>
      <div className="automated-trading-guide-steps">
        {workAreas.map((area, index) => {
          const current = area.id === currentWorkAreaId;
          return (
            <button
              aria-current={current ? "step" : undefined}
              className={`${area.status} ${current ? "current" : ""} ${area.id === activeWorkAreaId ? "active" : ""}`}
              key={area.id}
              onClick={() => onSelectWorkspace(area.id)}
              title={`${i18n.productWorkAreaLabel(area)} · ${i18n.productWorkAreaDescription(area)}`}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{i18n.productWorkAreaLabel(area)}</strong>
              <em>{current ? (i18n.locale === "zh-CN" ? "当前步骤" : "Current") : i18n.productWorkAreaStatus(area.status)}</em>
            </button>
          );
        })}
      </div>
      <small className="automated-trading-guide-boundary">
        {i18n.locale === "zh-CN"
          ? "主按钮会自动切换页面并串行推进可安全执行的步骤；遇到实名确认、生产权限、急停或风控闸门会暂停。"
          : "The primary action switches pages and advances safe steps in sequence; it pauses at named confirmation, production permission, kill-switch, or risk gates."}
      </small>
    </section>
  );
}

export function P0GoldenPathJourneyPanel({
  i18n,
  isActionDisabled,
  journey,
  onRunAction,
  onSelectWorkspace
}: {
  i18n: AppI18n;
  isActionDisabled: (actionId: string | null | undefined) => boolean;
  journey: P0GoldenPathJourney;
  onRunAction: (actionId: string, targetWorkspaceId?: ProductWorkAreaId | null) => void;
  onSelectWorkspace: (workspaceId: ProductWorkAreaId) => void;
}) {
  const currentStep = journey.steps.find((step) => step.id === journey.currentStepId) ?? journey.steps[0];
  const hasAction = Boolean(journey.nextActionId);

  return (
    <section className="p0-golden-path-journey" aria-label={i18n.t("p0Journey.title")}>
      <div className="p0-golden-path-head">
        <div>
          <span>{i18n.t("p0Journey.title")}</span>
          <strong>{currentStep ? p0JourneyStepLabel(i18n, currentStep) : i18n.t("p0Journey.ready")}</strong>
          <small>{i18n.t("p0Journey.subtitle")}</small>
        </div>
        <em>{i18n.t("p0Journey.boundary")}</em>
      </div>
      <div className="p0-golden-path-steps">
        {journey.steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            aria-current={step.id === journey.currentStepId ? "step" : undefined}
            className={`p0-golden-path-step ${step.state}`}
            onClick={() => onSelectWorkspace(step.workspaceId)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{p0JourneyStepLabel(i18n, step)}</strong>
            <small>{p0JourneyStepDetail(i18n, step)}</small>
            <em>{p0JourneyStepStateLabel(i18n, step.state)}</em>
          </button>
        ))}
      </div>
      <div className="p0-golden-path-footer">
        <small>{i18n.locale === "zh-CN" ? "实盘边界已锁定：P0 仅推进研究、回测、AI 解释和模拟执行。" : journey.detail}</small>
        {hasAction ? (
          <button
            type="button"
            className="p0-golden-path-primary-action"
            disabled={isActionDisabled(journey.nextActionId)}
            onClick={() => onRunAction(journey.nextActionId, journey.nextActionTargetWorkspaceId)}
          >
            <Play size={14} />
            {i18n.t("p0Journey.action")}
          </button>
        ) : (
          <span className="p0-golden-path-complete">{i18n.t("p0Journey.ready")}</span>
        )}
      </div>
    </section>
  );
}

export function Stage1P0DailyUseClosurePanel({
  archiveReviewReference,
  closure,
  i18n,
  isArchiveCopied = false,
  isArchiveSaving = false,
  isHandoffCopied = false,
  isPrimaryLinkCopied = false,
  isShareLinkBundleCopied = false,
  isStartupSnapshotCopied = false,
  isRefreshOutcomeCopied = false,
  isRefreshOutcomeLinkCopied = false,
  isRefreshingDailyUse = false,
  onCopyHandoff,
  onCopyArchive,
  onCopyPrimaryLink,
  onCopyShareLinkBundle,
  onDownloadArchive,
  onDownloadShareLinkBundle,
  onDownloadHandoff,
  onCopyRefreshOutcome,
  onCopyRefreshOutcomeLink,
  onCopyArchiveReviewLink,
  onCopyArchiveReviewSummary,
  onCopyStartupSnapshot,
  onDownloadRefreshOutcome,
  onDownloadArchiveReviewSummary,
  onDownloadStartupSnapshot,
  onOpenArchiveReview,
  onOpenPrimaryAction,
  onOpenRefreshOutcomeEntry,
  onOpenRefreshOutcomeNextStep,
  onOpenRow,
  onRefreshDailyUse,
  onRecordArchive,
  refreshOutcome,
  shareDeepLinkState,
  startupSnapshot
}: {
  archiveReviewReference?: Stage1P0DailyUseArchiveReviewReference | null;
  closure: Stage1P0DailyUseClosure;
  i18n: AppI18n;
  isArchiveCopied?: boolean;
  isArchiveSaving?: boolean;
  isHandoffCopied?: boolean;
  isPrimaryLinkCopied?: boolean;
  isShareLinkBundleCopied?: boolean;
  isStartupSnapshotCopied?: boolean;
  isRefreshOutcomeCopied?: boolean;
  isRefreshOutcomeLinkCopied?: boolean;
  isRefreshingDailyUse?: boolean;
  onCopyHandoff?: () => void;
  onCopyArchive?: () => void;
  onCopyPrimaryLink?: () => void;
  onCopyShareLinkBundle?: () => void;
  onDownloadArchive?: () => void;
  onDownloadShareLinkBundle?: () => void;
  onDownloadHandoff?: () => void;
  onCopyRefreshOutcome?: () => void;
  onCopyRefreshOutcomeLink?: () => void;
  onCopyArchiveReviewLink?: () => void;
  onCopyArchiveReviewSummary?: () => void;
  onCopyStartupSnapshot?: () => void;
  onDownloadRefreshOutcome?: () => void;
  onDownloadArchiveReviewSummary?: () => void;
  onDownloadStartupSnapshot?: () => void;
  onOpenArchiveReview?: () => void;
  onOpenPrimaryAction: () => void;
  onOpenRefreshOutcomeEntry: (entry: Stage1P0DailyUseRefreshOutcome["entries"][number]) => void;
  onOpenRefreshOutcomeNextStep: () => void;
  onOpenRow: (row: Stage1P0DailyUseClosure["rows"][number]) => void;
  onRefreshDailyUse?: () => void;
  onRecordArchive?: () => void;
  refreshOutcome?: Stage1P0DailyUseRefreshOutcome | null;
  shareDeepLinkState?: Stage1P0DailyUseShareDeepLinkState | null;
  startupSnapshot?: Stage1P0DailyUseStartupSnapshot | null;
}) {
  const primaryRow = stage1P0DailyUseClosurePrimaryRow(closure);
  const isPrimarySharedFocus = stage1P0DailyUsePrimaryIsSharedFocus(shareDeepLinkState);
  const isRefreshNextSharedFocus = stage1P0DailyUseRefreshNextIsSharedFocus(shareDeepLinkState);
  const isRefreshReceiptColdStart = stage1P0DailyUseRefreshReceiptIsColdStart(shareDeepLinkState, refreshOutcome);
  const refreshReceiptColdStartFocusLabel =
    isRefreshReceiptColdStart && shareDeepLinkState
      ? stage1P0DailyUseShareLinkFocusLabel(i18n, shareDeepLinkState)
      : "";
  const archiveReference = archiveReviewReference ?? null;
  const archivedP2ChainSource =
    archiveReference?.row?.stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath ?? "";

  return (
    <section
      className={`stage1-p0-daily-use-closure ${closure.state}`}
      aria-label={i18n.locale === "zh-CN" ? "Stage 1 P0 日常使用收口" : "Stage 1 P0 daily-use closure"}
      id={stage1P0DailyUseClosureElementId}
      tabIndex={-1}
    >
      <div className="stage1-p0-daily-use-head">
        <div>
          <span>{i18n.locale === "zh-CN" ? "Stage 1/P0 日常收口" : "Stage 1/P0 Daily Use"}</span>
          <strong>{stage1P0DailyUseClosureHeadline(i18n, closure, primaryRow)}</strong>
          <small>{stage1P0DailyUseClosureDetail(i18n, closure)}</small>
        </div>
        <em>
          {closure.readyCount}/{closure.totalCount}
        </em>
      </div>
      <div className="stage1-p0-daily-use-rows">
        {closure.rows.map((row) => {
          const isSharedFocus = stage1P0DailyUseRowIsSharedFocus(shareDeepLinkState, row.id);

          return (
            <button
              aria-current={isSharedFocus ? "true" : undefined}
              aria-label={`${stage1P0DailyUseClosureRowLabel(i18n, row)} · ${stage1P0DailyUseClosureRowStatusLabel(i18n, row.status)}`}
              className={`stage1-p0-daily-use-row ${row.status}${isSharedFocus ? " shared-focus" : ""}`}
              id={stage1P0DailyUseRowElementId(row.id)}
              key={row.id}
              onClick={() => onOpenRow(row)}
              type="button"
            >
              <span>{stage1P0DailyUseClosureRowLabel(i18n, row)}</span>
              <strong>{stage1P0DailyUseClosureRowValue(i18n, row)}</strong>
              <small>{stage1P0DailyUseClosureRowDetail(i18n, row)}</small>
              <em>{stage1P0DailyUseClosureRowStatusLabel(i18n, row.status)}</em>
            </button>
          );
        })}
      </div>
      {isRefreshReceiptColdStart ? (
        <div className="stage1-p0-daily-use-refresh-recovery" aria-live="polite">
          <div>
            <span>{i18n.locale === "zh-CN" ? "已恢复刷新回执链接" : "Recovered refresh receipt link"}</span>
            <strong>{refreshReceiptColdStartFocusLabel}</strong>
            <small>
              {i18n.locale === "zh-CN"
                ? "刷新自检会重新生成回执并恢复下一步上下文。"
                : "Refresh daily regenerates the receipt and restores the next-step context."}
            </small>
          </div>
          <em>{i18n.locale === "zh-CN" ? "手动恢复" : "Manual recovery"}</em>
        </div>
      ) : null}
      {refreshOutcome ? (
        <div className={`stage1-p0-daily-use-refresh-outcome ${refreshOutcome.state}`}>
          <div className="stage1-p0-daily-use-refresh-outcome-head">
            <span>{i18n.locale === "zh-CN" ? "刷新回执" : "Refresh receipt"}</span>
            <strong>{stage1P0DailyUseRefreshOutcomeHeadline(i18n, refreshOutcome)}</strong>
            <small>{stage1P0DailyUseRefreshOutcomeDetail(i18n, refreshOutcome)}</small>
          </div>
          <div className="stage1-p0-daily-use-refresh-outcome-entries">
            {refreshOutcome.entries.map((entry) => {
              const isSharedFocus = stage1P0DailyUseRefreshEntryIsSharedFocus(shareDeepLinkState, entry.id);

              return (
                <button
                  aria-current={isSharedFocus ? "true" : undefined}
                  className={`stage1-p0-daily-use-refresh-outcome-entry ${entry.status}${isSharedFocus ? " shared-focus" : ""}`}
                  id={stage1P0DailyUseRefreshEntryElementId(entry.id)}
                  key={entry.id}
                  onClick={() => onOpenRefreshOutcomeEntry(entry)}
                  type="button"
                >
                  <span>{stage1P0DailyUseRefreshOutcomeEntryLabel(i18n, entry)}</span>
                  <strong>{stage1P0DailyUseRefreshOutcomeEntryStatus(i18n, entry)}</strong>
                  <small>{stage1P0DailyUseRefreshOutcomeSourceLabel(i18n, entry.source)}</small>
                </button>
              );
            })}
          </div>
          <div className="stage1-p0-daily-use-refresh-outcome-actions">
            <button disabled={!onCopyRefreshOutcome} onClick={onCopyRefreshOutcome} type="button">
              <Copy size={12} />
              {isRefreshOutcomeCopied
                ? i18n.locale === "zh-CN"
                  ? "已复制"
                  : "Copied"
                : i18n.locale === "zh-CN"
                  ? "复制回执"
                  : "Copy receipt"}
            </button>
            <button disabled={!onCopyRefreshOutcomeLink} onClick={onCopyRefreshOutcomeLink} type="button">
              <Copy size={12} />
              {isRefreshOutcomeLinkCopied
                ? i18n.locale === "zh-CN"
                  ? "链接已复制"
                  : "Link copied"
                : i18n.locale === "zh-CN" ? "复制下一步链接" : "Copy next link"}
            </button>
            <button disabled={!onDownloadRefreshOutcome} onClick={onDownloadRefreshOutcome} type="button">
              <Download size={12} />
              {i18n.locale === "zh-CN" ? "下载回执" : "Download receipt"}
            </button>
            <button
              aria-current={isRefreshNextSharedFocus ? "true" : undefined}
              className={isRefreshNextSharedFocus ? "shared-focus" : undefined}
              id={stage1P0DailyUseRefreshNextActionElementId}
              type="button"
              onClick={() => onOpenRefreshOutcomeNextStep()}
            >
              <Play size={12} />
              {i18n.locale === "zh-CN" ? "打开下一步" : "Open next step"}
            </button>
          </div>
        </div>
      ) : null}
      {archiveReference ? (
        <div className={`stage1-p0-daily-use-archive-reference ${archiveReference.status}`}>
          <div>
            <span>{i18n.locale === "zh-CN" ? "最新归档入账" : "Latest archive record"}</span>
            <strong>{stage1P0DailyUseArchiveReviewReferenceLabel(i18n, archiveReference)}</strong>
            <small>{stage1P0DailyUseArchiveReviewReferenceDetail(i18n, archiveReference)}</small>
            {archiveReference.eventId ? (
              <small>
                {archiveReference.eventId} · {archiveReference.createdAt.slice(0, 19)}
              </small>
            ) : null}
            {archivedP2ChainSource ? (
              <small>
                {i18n.locale === "zh-CN" ? "归档 P2 chain" : "Archived P2 chain"} · {archivedP2ChainSource}
              </small>
            ) : null}
          </div>
          <div>
            <button disabled={!archiveReference.query || !onOpenArchiveReview} onClick={onOpenArchiveReview} type="button">
              <Search size={12} />
              {i18n.locale === "zh-CN" ? "定位归档" : "Focus archive"}
            </button>
            <button
              disabled={!archiveReference.query || !onCopyArchiveReviewLink}
              onClick={onCopyArchiveReviewLink}
              type="button"
            >
              <Copy size={12} />
              {i18n.locale === "zh-CN" ? "复制归档链接" : "Copy archive link"}
            </button>
            <button disabled={!onCopyArchiveReviewSummary} onClick={onCopyArchiveReviewSummary} type="button">
              <Copy size={12} />
              {i18n.locale === "zh-CN" ? "复制归档摘要" : "Copy archive summary"}
            </button>
            <button disabled={!onDownloadArchiveReviewSummary} onClick={onDownloadArchiveReviewSummary} type="button">
              <Download size={12} />
              {i18n.locale === "zh-CN" ? "下载归档摘要" : "Download archive summary"}
            </button>
          </div>
        </div>
      ) : null}
      <div className="stage1-p0-daily-use-footer">
        <small>
          {i18n.locale === "zh-CN"
            ? "P0 保持实盘阻断；这里只聚合开箱、恢复、研究入口、每日启动和桌面发布检查。"
            : "P0 keeps live trading blocked; this card only routes clean-open, recovery, research, daily start, and desktop release checks."}
        </small>
        <div className="stage1-p0-daily-use-footer-actions">
          <button
            className="stage1-p0-daily-use-copy"
            disabled={!onCopyHandoff}
            onClick={onCopyHandoff}
            type="button"
          >
            <Copy size={12} />
            {isHandoffCopied
              ? i18n.locale === "zh-CN"
                ? "已复制"
                : "Copied"
              : i18n.locale === "zh-CN"
                ? "复制日常手册"
                : "Copy handoff"}
          </button>
          <button
            className="stage1-p0-daily-use-copy"
            disabled={!startupSnapshot || !onCopyStartupSnapshot}
            onClick={onCopyStartupSnapshot}
            type="button"
          >
            <Copy size={12} />
            {isStartupSnapshotCopied
              ? i18n.locale === "zh-CN"
                ? "启动快照已复制"
                : "Startup copied"
              : i18n.locale === "zh-CN"
                ? "复制启动快照"
                : "Copy startup snapshot"}
          </button>
          <button
            className="stage1-p0-daily-use-copy"
            disabled={!onCopyArchive}
            onClick={onCopyArchive}
            type="button"
          >
            <Copy size={12} />
            {isArchiveCopied
              ? i18n.locale === "zh-CN"
                ? "归档包已复制"
                : "Archive copied"
              : i18n.locale === "zh-CN"
                ? "复制归档包"
                : "Copy archive"}
          </button>
          <button
            className="stage1-p0-daily-use-copy"
            disabled={!onCopyPrimaryLink}
            onClick={onCopyPrimaryLink}
            type="button"
          >
            <Copy size={12} />
            {isPrimaryLinkCopied
              ? i18n.locale === "zh-CN"
                ? "链接已复制"
                : "Link copied"
              : i18n.locale === "zh-CN" ? "复制入口链接" : "Copy link"}
          </button>
          <button
            className="stage1-p0-daily-use-copy"
            disabled={!onCopyShareLinkBundle}
            onClick={onCopyShareLinkBundle}
            type="button"
          >
            <Copy size={12} />
            {isShareLinkBundleCopied
              ? i18n.locale === "zh-CN"
                ? "链接包已复制"
                : "Links copied"
              : i18n.locale === "zh-CN"
                ? "复制链接包"
                : "Copy links"}
          </button>
          <button
            className="stage1-p0-daily-use-download"
            disabled={!onDownloadShareLinkBundle}
            onClick={onDownloadShareLinkBundle}
            type="button"
          >
            <Download size={12} />
            {i18n.locale === "zh-CN" ? "下载链接包" : "Download links"}
          </button>
          <button
            className="stage1-p0-daily-use-download"
            disabled={!onDownloadArchive}
            onClick={onDownloadArchive}
            type="button"
          >
            <Download size={12} />
            {i18n.locale === "zh-CN" ? "下载归档包" : "Download archive"}
          </button>
          <button
            className="stage1-p0-daily-use-download"
            disabled={isArchiveSaving || !onRecordArchive}
            id={stage1P0DailyUseArchiveRecordActionElementId}
            onClick={onRecordArchive}
            type="button"
          >
            {isArchiveSaving ? <RefreshCw className="spin" size={12} /> : <Save size={12} />}
            {isArchiveSaving
              ? i18n.locale === "zh-CN"
                ? "入账中"
                : "Recording"
              : i18n.locale === "zh-CN"
                ? "入账归档"
                : "Record archive"}
          </button>
          <button
            className="stage1-p0-daily-use-download"
            disabled={!onDownloadHandoff}
            onClick={onDownloadHandoff}
            type="button"
          >
            <Download size={12} />
            {i18n.locale === "zh-CN" ? "下载日常手册" : "Download handoff"}
          </button>
          <button
            className="stage1-p0-daily-use-download"
            disabled={!startupSnapshot || !onDownloadStartupSnapshot}
            onClick={onDownloadStartupSnapshot}
            type="button"
          >
            <Download size={12} />
            {i18n.locale === "zh-CN" ? "下载启动快照" : "Download startup snapshot"}
          </button>
          <button
            aria-current={isRefreshReceiptColdStart ? "true" : undefined}
            className={`stage1-p0-daily-use-refresh${isRefreshReceiptColdStart ? " shared-focus" : ""}`}
            disabled={isRefreshingDailyUse || !onRefreshDailyUse}
            id={stage1P0DailyUseRefreshActionElementId}
            onClick={onRefreshDailyUse}
            type="button"
          >
            {isRefreshingDailyUse ? <RefreshCw className="spin" size={12} /> : <RefreshCw size={12} />}
            {i18n.locale === "zh-CN" ? "刷新自检" : "Refresh daily"}
          </button>
          <button
            aria-current={isPrimarySharedFocus ? "true" : undefined}
            className={isPrimarySharedFocus ? "shared-focus" : undefined}
            id={stage1P0DailyUsePrimaryActionElementId}
            type="button"
            onClick={onOpenPrimaryAction}
          >
            <Play size={12} />
            {stage1P0DailyUseClosureActionLabel(i18n, closure.primaryActionId, closure.primaryActionLabel)}
          </button>
        </div>
      </div>
    </section>
  );
}

export function stage1P0DailyUseRefreshOutcomeHeadline(
  i18n: AppI18n,
  outcome: Stage1P0DailyUseRefreshOutcome
): string {
  if (i18n.locale === "en-US") {
    return outcome.headline;
  }
  if (outcome.state === "ready") {
    return "日常自检刷新完成";
  }
  if (outcome.state === "review") {
    return "日常自检刷新后仍需复核";
  }
  return "日常自检刷新需要处理";
}

export function stage1P0DailyUseArchiveReviewReferenceLabel(
  i18n: AppI18n,
  reference: Stage1P0DailyUseArchiveReviewReference
): string {
  if (i18n.locale === "en-US") {
    return reference.label;
  }
  return (
    {
      current: "归档入账匹配当前日常上下文",
      missing: "尚未入账归档审计",
      stale: "最近归档入账已过期"
    } satisfies Record<Stage1P0DailyUseArchiveReviewReference["status"], string>
  )[reference.status];
}

export function stage1P0DailyUseArchiveReviewReferenceDetail(
  i18n: AppI18n,
  reference: Stage1P0DailyUseArchiveReviewReference
): string {
  if (i18n.locale === "en-US") {
    return reference.detail;
  }
  if (reference.status === "current") {
    return "最近一次 Stage 1/P0 日常归档与当前卡片、刷新回执和分享入口一致。";
  }
  if (reference.status === "stale") {
    return "最近一次 Stage 1/P0 日常归档与当前上下文不一致，请重新入账归档。";
  }
  return "点击入账归档后，这里会显示可定位的 Stage 1 归档审计事件。";
}

export function stage1P0DailyUseRefreshOutcomeDetail(
  i18n: AppI18n,
  outcome: Stage1P0DailyUseRefreshOutcome
): string {
  if (i18n.locale === "en-US") {
    return outcome.detail;
  }
  const pending = outcome.totalCount - outcome.readyCount;
  return pending === 0
    ? `${outcome.readyCount}/${outcome.totalCount} 回执就绪 · 未放开实盘`
    : `${outcome.readyCount}/${outcome.totalCount} 回执就绪 · ${pending} 项需要处理`;
}

export function stage1P0DailyUseRefreshOutcomeEntryLabel(
  i18n: AppI18n,
  entry: Stage1P0DailyUseRefreshOutcome["entries"][number]
): string {
  if (i18n.locale === "en-US") {
    return entry.label;
  }
  if (entry.id === "daily-use") {
    return "日报";
  }
  if (entry.id === "bootstrap-preflight") {
    return "开箱预检";
  }
  return "桌面发布";
}

export function stage1P0DailyUseRefreshOutcomeEntryStatus(
  i18n: AppI18n,
  entry: Stage1P0DailyUseRefreshOutcome["entries"][number]
): string {
  if (i18n.locale === "en-US") {
    return entry.status === "ready" ? "Ready" : entry.status === "review" ? "Review" : "Blocked";
  }
  return entry.status === "ready" ? "就绪" : entry.status === "review" ? "待复核" : "需处理";
}

export function stage1P0DailyUseRefreshOutcomeSourceLabel(
  i18n: AppI18n,
  source: Stage1P0DailyUseRefreshOutcome["entries"][number]["source"]
): string {
  if (i18n.locale === "en-US") {
    return source === "core" ? "Local core" : "Safe fallback";
  }
  return source === "core" ? "本地核心" : "安全 fallback";
}

export function stage1P0DailyUseClosurePrimaryRow(
  closure: Stage1P0DailyUseClosure
): Stage1P0DailyUseClosureRowView {
  return (
    closure.rows.find(
      (row) => row.actionId === closure.primaryActionId && row.targetWorkspaceId === closure.primaryTargetWorkspaceId
    ) ??
    closure.rows.find((row) => row.status !== "ready") ??
    closure.rows[0]
  );
}

export function stage1P0DailyUseClosureHeadline(
  i18n: AppI18n,
  closure: Stage1P0DailyUseClosure,
  primaryRow: Stage1P0DailyUseClosureRowView
): string {
  if (i18n.locale === "en-US") {
    return closure.headline;
  }
  if (closure.state === "ready") {
    return "日常使用已就绪";
  }
  const rowLabel = stage1P0DailyUseClosureRowLabel(i18n, primaryRow);
  return closure.state === "blocked" ? `${rowLabel}阻断` : `${rowLabel}待复核`;
}

export function stage1P0DailyUseClosureDetail(i18n: AppI18n, closure: Stage1P0DailyUseClosure): string {
  if (i18n.locale === "en-US") {
    return closure.detail;
  }
  if (closure.bootstrapPreflightStaleSourceSummary) {
    return `开箱预检源已更新 · ${closure.bootstrapPreflightStaleSourcePaths.join(", ")} · 请刷新自检`;
  }
  if (closure.staleSourceSummary) {
    return `日报源已更新 · ${closure.staleSourcePaths.join(", ")} · 请刷新自检`;
  }
  const pending = closure.totalCount - closure.readyCount;
  return pending === 0
    ? "五项日常使用检查均可进入。"
    : `${closure.readyCount}/${closure.totalCount} 就绪 · ${pending} 项需要处理`;
}

export function stage1P0DailyUseClosureRowLabel(
  i18n: AppI18n,
  row: Stage1P0DailyUseClosureRowView
): string {
  if (row.id === "clean-open") {
    return i18n.locale === "zh-CN" ? "干净环境开箱" : "Clean environment";
  }
  if (row.id === "market-refresh-recovery") {
    return i18n.locale === "zh-CN" ? "行情刷新恢复" : "Refresh recovery";
  }
  if (row.id === "research-entry") {
    return i18n.locale === "zh-CN" ? "研究入口" : "Research entry";
  }
  if (row.id === "daily-start") {
    return i18n.locale === "zh-CN" ? "每日启动" : "Daily start";
  }
  return i18n.locale === "zh-CN" ? "桌面发布" : "Desktop release";
}

export function stage1P0DailyUseClosureRowValue(
  i18n: AppI18n,
  row: Stage1P0DailyUseClosureRowView
): string {
  if (i18n.locale === "en-US") {
    return row.value;
  }
  if (row.id === "clean-open") {
    return row.status === "ready"
      ? "P0/P1 验收就绪"
      : row.actionId === "review-bootstrap-preflight"
        ? row.status === "review"
          ? "开箱预检待刷新"
          : "开箱预检阻断"
        : row.actionId === "refresh-p0-acceptance"
          ? "P0 验收缺失"
          : "P1 待复核";
  }
  if (row.id === "market-refresh-recovery") {
    return row.status === "blocked" ? "Provider 冷却中" : row.status === "review" ? "恢复状态待复核" : "可刷新";
  }
  if (row.id === "research-entry") {
    return row.status === "ready" ? "研究上下文就绪" : row.actionId === "refresh-cache" ? "缓存待刷新" : "上下文待补齐";
  }
  if (row.id === "daily-start") {
    return row.status === "ready" ? "启动路径就绪" : "启动复核待入账";
  }
  return row.status === "ready" ? "桌面构建已记录" : "构建清单待完成";
}

export function stage1P0DailyUseClosureRowDetail(
  i18n: AppI18n,
  row: Stage1P0DailyUseClosureRowView
): string {
  if (i18n.locale === "en-US") {
    return row.detail;
  }
  if (row.id === "clean-open") {
    if (row.actionId === "review-bootstrap-preflight") {
      if (row.status === "review") {
        return "开箱预检源已更新；刷新自检会重新生成 preflight。";
      }
      return "先复核 Stage 1 开箱预检，再进入日常使用路径。";
    }
    return "用 P0/P1 验收确认干净环境可开箱。";
  }
  if (row.id === "market-refresh-recovery") {
    return row.status === "blocked" ? "先复核 provider 冷却，再恢复行情刷新。" : "行情缓存可以从 Market 工作区恢复。";
  }
  if (row.id === "research-entry") {
    return "研究页只保留当前上下文、缓存、笔记和工作区入口。";
  }
  if (row.id === "daily-start") {
    return "每日启动摘要聚合个人/团队可用性和审计复核。";
  }
  return "桌面包仍需本地 Tauri/Cargo 构建检查确认。";
}

export function stage1P0DailyUseClosureRowStatusLabel(
  i18n: AppI18n,
  status: Stage1P0DailyUseClosureRowView["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "ready" ? "Ready" : status === "review" ? "Review" : "Blocked";
  }
  return status === "ready" ? "就绪" : status === "review" ? "复核" : "阻断";
}

export function stage1P0DailyUseClosureActionLabel(
  i18n: AppI18n,
  actionId: Stage1P0DailyUseClosureRowView["actionId"],
  fallback: string
): string {
  if (i18n.locale === "en-US") {
    return fallback;
  }
  if (actionId === "refresh-p0-acceptance") {
    return "刷新 P0 验收";
  }
  if (actionId === "review-p1-acceptance") {
    return "复核 P1 验收";
  }
  if (actionId === "review-bootstrap-preflight") {
    return "复核开箱预检";
  }
  if (actionId === "review-provider-cooldown") {
    return "复核冷却";
  }
  if (actionId === "refresh-cache") {
    return "刷新缓存";
  }
  if (actionId === "refresh-watchlist-cache") {
    return "刷新自选缓存";
  }
  if (actionId === "save-note") {
    return "保存笔记";
  }
  if (actionId === "save-watchlist") {
    return "保存自选";
  }
  if (actionId === "save-workspace") {
    return "保存工作区";
  }
  if (actionId === "record-daily-start-review") {
    return "入账启动复核";
  }
  if (actionId === "run-desktop-build") {
    return "检查桌面构建";
  }
  return "打开研究入口";
}

export function p0JourneyStepLabel(i18n: AppI18n, step: P0GoldenPathJourney["steps"][number]): string {
  if (i18n.locale === "en-US") {
    return step.label;
  }
  return (
    {
      data: "数据就绪",
      strategy: "策略草稿",
      backtest: "审计回测",
      "ai-review": "AI 评审",
      "paper-simulation": "模拟执行",
      replay: "回放复核",
      export: "证据导出"
    }[step.id] ?? step.label
  );
}

export function p0JourneyStepDetail(i18n: AppI18n, step: P0GoldenPathJourney["steps"][number]): string {
  if (i18n.locale === "en-US") {
    return step.detail;
  }
  return (
    {
      data: "确认标的、周期、缓存与数据质量。",
      strategy: "保存可复现的结构化规则。",
      backtest: "生成带费用和滑点的审计运行。",
      "ai-review": "仅解释证据、风险和改进方向。",
      "paper-simulation": "提交纸面盘委托，保持实盘阻断。",
      replay: "复核成交、资金和持仓变化。",
      export: "打包运行证据，支持导入复现。"
    }[step.id] ?? step.detail
  );
}

export function p0JourneyStepStateLabel(i18n: AppI18n, state: P0GoldenPathJourney["steps"][number]["state"]): string {
  const stateTranslationKey = {
    done: "p0Journey.done",
    current: "p0Journey.current",
    blocked: "p0Journey.blocked",
    ready: "p0Journey.ready"
  } as const;
  return i18n.t(stateTranslationKey[state]);
}

export function stage1P0DailyUseShareLinkFocusLabel(
  i18n: AppI18n,
  state: Stage1P0DailyUseShareDeepLinkState
): string {
  const focusLabel =
    state.kind === "daily-use"
      ? stage1P0DailyUseShareDailyFocusLabel(i18n, state.focus)
      : stage1P0DailyUseShareReceiptFocusLabel(i18n, state.focus);
  const workspace = productWorkAreaIdLabelText(i18n, state.targetWorkspaceId);
  return i18n.locale === "zh-CN" ? `${focusLabel} -> ${workspace}` : `${focusLabel} -> ${workspace}`;
}

export function stage1P0DailyUseShareDailyFocusLabel(i18n: AppI18n, focus: string): string {
  if (focus === "primary") {
    return i18n.locale === "zh-CN" ? "主入口" : "Primary action";
  }
  return stage1P0DailyUseShareFocusFallbackLabel(i18n, focus);
}

export function stage1P0DailyUseShareReceiptFocusLabel(i18n: AppI18n, focus: string): string {
  if (focus === "next") {
    return i18n.locale === "zh-CN" ? "下一步" : "Next step";
  }
  return stage1P0DailyUseShareFocusFallbackLabel(i18n, focus);
}

export function stage1P0DailyUseShareFocusFallbackLabel(i18n: AppI18n, focus: string): string {
  return (
    {
      "bootstrap-preflight": i18n.locale === "zh-CN" ? "开箱预检" : "Bootstrap preflight",
      "clean-open": i18n.locale === "zh-CN" ? "干净环境开箱" : "Clean environment",
      "daily-start": i18n.locale === "zh-CN" ? "每日启动" : "Daily start",
      "daily-use": i18n.locale === "zh-CN" ? "日报" : "Daily report",
      "desktop-release": i18n.locale === "zh-CN" ? "桌面发布" : "Desktop release",
      "market-refresh-recovery": i18n.locale === "zh-CN" ? "行情刷新恢复" : "Refresh recovery",
      "research-entry": i18n.locale === "zh-CN" ? "研究入口" : "Research entry"
    }[focus] ?? focus
  );
}

export function productWorkAreaIdLabelText(i18n: AppI18n, workspaceId: string): string {
  if (i18n.locale === "en-US") {
    return workspaceId;
  }
  return (
    {
      "ai-review": "AI 评审",
      audit: "审计",
      backtest: "回测",
      execution: "执行",
      market: "行情",
      portfolio: "组合",
      research: "研究",
      settings: "设置",
      strategy: "策略"
    }[workspaceId] ?? workspaceId
  );
}
