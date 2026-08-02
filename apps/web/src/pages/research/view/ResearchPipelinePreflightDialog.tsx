import { isResearchContextActionDisabled, researchContextReadinessActionLabel, researchContextReadinessDetail, researchContextReadinessValue } from "../../../components/ResearchContextReadinessPanel";
import { researchPipelinePreflightIssueTargets } from "../../app-shell/navigation";
import { researchPipelinePreflightIssueLabel } from "../ResearchPipelineFormatters";
import { Play, ShieldCheck, X } from "lucide-react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

export type ResearchPipelinePreflightDialogViewModel = Pick<AppControllerBindings,
    "activeCacheContextKey" | "closeResearchPipelinePreflight" | "i18n" | "isRefreshingWatchlistCache" | "isResearchPipelineConfirmationOpen" | "isSavingResearchNote" | "isSavingResearchWorkspace" | "isSavingWatchlist" | "marketDataRefreshGuard" | "openResearchPipelinePreflightIssue" | "refreshingCacheKey" | "researchPipelineConfirmationCancelButtonRef" | "researchPipelineConfirmationDialogRef" | "researchPipelinePreflight" | "runPipeline"
  >;

type ResearchPipelinePreflightDialogProps = { controller: ResearchPipelinePreflightDialogViewModel };

export function ResearchPipelinePreflightDialog({ controller }: ResearchPipelinePreflightDialogProps) {
  const {
    activeCacheContextKey, closeResearchPipelinePreflight, i18n, isRefreshingWatchlistCache, isResearchPipelineConfirmationOpen, isSavingResearchNote,
    isSavingResearchWorkspace, isSavingWatchlist, marketDataRefreshGuard, openResearchPipelinePreflightIssue, refreshingCacheKey,
    researchPipelineConfirmationCancelButtonRef, researchPipelineConfirmationDialogRef, researchPipelinePreflight, runPipeline
  } = controller;
  return (
    isResearchPipelineConfirmationOpen ? (
            <dialog
              aria-describedby="research-pipeline-confirmation-detail"
              aria-labelledby="research-pipeline-confirmation-title"
              aria-modal="true"
              className="research-confirmation-dialog"
              onCancel={closeResearchPipelinePreflight}
              ref={researchPipelineConfirmationDialogRef}
              role="alertdialog"
            >
              <section className="research-confirmation-modal">
                <header>
                  <div>
                    <span className="research-confirmation-kicker">
                      <ShieldCheck size={15} />
                      {researchPipelinePreflight.status === "blocked"
                        ? i18n.locale === "zh-CN"
                          ? "研究运行预检"
                          : "Research run preflight"
                        : i18n.locale === "zh-CN"
                          ? "研究上下文复核"
                          : "Research context review"}
                    </span>
                    <h2 id="research-pipeline-confirmation-title">
                      {researchPipelinePreflight.status === "blocked"
                        ? i18n.locale === "zh-CN"
                          ? `有 ${
                              researchPipelinePreflight.issues.filter((issue) => issue.status === "blocked").length
                            } 项阻止运行`
                          : `${
                              researchPipelinePreflight.issues.filter((issue) => issue.status === "blocked").length
                            } items block this run`
                        : i18n.locale === "zh-CN"
                          ? `仍有 ${researchPipelinePreflight.issues.length} 项需要确认`
                          : `${researchPipelinePreflight.issues.length} items still need confirmation`}
                    </h2>
                  </div>
                  <button
                    aria-label={i18n.locale === "zh-CN" ? "关闭复核" : "Close review"}
                    className="panel-icon-button"
                    onClick={closeResearchPipelinePreflight}
                    type="button"
                  >
                    <X size={17} />
                  </button>
                </header>
                <p id="research-pipeline-confirmation-detail">
                  {researchPipelinePreflight.status === "blocked"
                    ? i18n.locale === "zh-CN"
                      ? "当前研究上下文尚未达到运行条件。请先处理阻断项；休市等复核项不会阻止运行。"
                      : "The current research context is not ready. Resolve the blocked items first; review items such as a closed market do not block the run."
                    : i18n.locale === "zh-CN"
                      ? "这些项目不会阻止审计运行，但可能影响研究结果的解释。请确认后继续。"
                      : "These items do not block the audited run, but they may affect how its results are interpreted."}
                </p>
                <div className="research-confirmation-issues">
                  {researchPipelinePreflight.issues.map((issue) => {
                    const target = researchPipelinePreflightIssueTargets[issue.id];
                    const directRefreshAction =
                      !marketDataRefreshGuard.blocked &&
                      (issue.action === "refresh-cache" || issue.action === "refresh-watchlist-cache")
                        ? issue.action
                        : null;
                    return (
                      <article className={issue.status} key={issue.id}>
                        <div className="research-confirmation-issue-copy">
                          <div>
                            <span>{researchPipelinePreflightIssueLabel(i18n, issue)}</span>
                            <strong>{researchContextReadinessValue(i18n, issue)}</strong>
                          </div>
                          <p>{researchContextReadinessDetail(i18n, issue)}</p>
                        </div>
                        <button
                          className="research-confirmation-issue-action"
                          disabled={
                            directRefreshAction
                              ? isResearchContextActionDisabled(
                                  directRefreshAction,
                                  refreshingCacheKey === activeCacheContextKey,
                                  isRefreshingWatchlistCache,
                                  marketDataRefreshGuard.blocked,
                                  isSavingResearchNote,
                                  isSavingWatchlist,
                                  isSavingResearchWorkspace
                                )
                              : false
                          }
                          onClick={() => openResearchPipelinePreflightIssue(issue)}
                          type="button"
                        >
                          {directRefreshAction
                            ? researchContextReadinessActionLabel(
                                i18n,
                                directRefreshAction,
                                refreshingCacheKey === activeCacheContextKey,
                                isRefreshingWatchlistCache,
                                marketDataRefreshGuard.blocked,
                                isSavingResearchNote,
                                isSavingWatchlist,
                                isSavingResearchWorkspace
                              )
                            : i18n.locale === "zh-CN"
                              ? target.actionLabelZh
                              : target.actionLabelEn}
                        </button>
                      </article>
                    );
                  })}
                </div>
                <footer className="research-confirmation-actions">
                  <button
                    className="design-secondary-action"
                    onClick={closeResearchPipelinePreflight}
                    ref={researchPipelineConfirmationCancelButtonRef}
                    type="button"
                  >
                    {researchPipelinePreflight.status === "blocked"
                      ? i18n.locale === "zh-CN"
                        ? "关闭"
                        : "Close"
                      : i18n.locale === "zh-CN"
                        ? "返回检查"
                        : "Review first"}
                  </button>
                  {researchPipelinePreflight.canRun ? (
                    <button className="run-button" onClick={() => void runPipeline("accepted")} type="button">
                      <Play size={15} />
                      {i18n.locale === "zh-CN" ? "确认并运行研究" : "Confirm and run research"}
                    </button>
                  ) : null}
                </footer>
              </section>
            </dialog>
          ) : null
  );
}
