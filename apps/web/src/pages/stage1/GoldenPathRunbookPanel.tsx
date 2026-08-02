import { Panel } from "../../components/AppPanel";
import { type AppI18n } from "../../lib/i18n";
import { GoldenPathStatus } from "../../lib/terminal-api";
import { ProductWorkAreaId, ResearchPipelinePreflight } from "../../lib/terminal-workbench";
import { productWorkAreaIds } from "../app-shell/navigation";
import { auditRunbookActionLabel, auditRunbookDetail, auditRunbookStatusLabel, goldenPathRunbookActionHint, goldenPathStepLabel } from "./golden-path-formatters";

export function GoldenPathRunbookPanel({
  className,
  i18n,
  isActionDisabled,
  onRunAction,
  onSelectWorkspace,
  preflight,
  runbook
}: {
  className?: string;
  i18n: AppI18n;
  isActionDisabled: (actionId: string | null | undefined) => boolean;
  onRunAction: (actionId: string | null | undefined, targetWorkspace?: string | null) => void;
  onSelectWorkspace: (workspaceId: ProductWorkAreaId) => void;
  preflight: ResearchPipelinePreflight;
  runbook: GoldenPathStatus["runbook"];
}) {
  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "黄金路径审计清单" : "Golden Path Runbook"}
      subtitle={i18n.locale === "zh-CN" ? "从行情到模拟执行的可操作闸门" : "Actionable gates from market data to paper execution"}
      className={`audit-runbook-panel ${className ?? ""}`}
    >
      <div className="audit-runbook-list">
        {runbook.length ? (
          runbook.map((item, index) => {
            const workspaceId = productWorkAreaIds.includes(item.workspaceId as ProductWorkAreaId)
              ? (item.workspaceId as ProductWorkAreaId)
              : null;
            const canRunAction = Boolean(item.actionId) && !item.passed;
            const isRunbookActionDisabled = !canRunAction || isActionDisabled(item.actionId);
            const actionHint = goldenPathRunbookActionHint(i18n, item, isRunbookActionDisabled, preflight);
            const actionHintTone = item.actionId === "run-pipeline" ? preflight.status : item.status;
            return (
              <article
                className={`audit-runbook-row ${item.status} ${item.current ? "current" : ""}`}
                key={item.stepId}
              >
                <span className="audit-runbook-index">{index + 1}</span>
                <div className="audit-runbook-main">
                  <strong>{goldenPathStepLabel(i18n, item.stepId, item.label)}</strong>
                  <small>{auditRunbookDetail(i18n, item)}</small>
                  {actionHint ? (
                    <small className={`audit-runbook-action-hint ${actionHintTone}`}>{actionHint}</small>
                  ) : null}
                </div>
                <em>{auditRunbookStatusLabel(i18n, item)}</em>
                <div className="audit-runbook-actions">
                  <button disabled={!workspaceId} onClick={() => workspaceId && onSelectWorkspace(workspaceId)} type="button">
                    {i18n.locale === "zh-CN" ? "工作区" : "Workspace"}
                  </button>
                  <button
                    disabled={isRunbookActionDisabled}
                    onClick={() => onRunAction(item.actionId, item.targetWorkspace ?? item.workspaceId)}
                    type="button"
                  >
                    {auditRunbookActionLabel(i18n, item)}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN" ? "等待本地核心返回黄金路径状态。" : "Waiting for the local core to return golden path status."}
          </p>
        )}
      </div>
    </Panel>
  );
}
