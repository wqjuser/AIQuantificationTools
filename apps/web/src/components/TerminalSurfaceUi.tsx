import { Download, FileText, Play, Save } from "lucide-react";
import type { ReactNode } from "react";
import type { AiReviewProviderId } from "../lib/ai-review-stage3";
import type { ProductWorkAreaStatus } from "../lib/terminal-workbench";

export interface SurfaceAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "warning" | "neutral";
  workflowReason?: string;
  workflowStatus?: ProductWorkAreaStatus;
}

export const aiProviderLabels: Record<AiReviewProviderId, string> = {
  local: "本地基线",
  openai: "OpenAI",
  "openai-compatible": "OpenAI 兼容服务",
  ollama: "Ollama",
};

export function SurfacePanel({
  action,
  children,
  className = "",
  subtitle,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <section className={`design-panel ${className}`}>
      <header className="design-panel-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
        {action}
      </header>
      <div className="design-panel-body">{children}</div>
    </section>
  );
}

export function EmptyState({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="design-empty-state">
      <FileText aria-hidden="true" size={20} />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

export function PageHeader({
  action,
  children,
  subtitle,
  title,
}: {
  action: SurfaceAction;
  children?: ReactNode;
  subtitle?: string;
  title: string;
}) {
  const completed = action.workflowStatus
    ? action.workflowStatus === "ready"
    : action.label.includes("已完成");
  const blocked = action.workflowStatus
    ? action.workflowStatus === "blocked"
    : Boolean(action.disabled) && !completed;
  const pending = action.workflowStatus === "needs_run";
  return (
    <header className="design-page-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <span>{subtitle}</span> : null}
        {children}
        <div className="design-page-state" aria-label="当前工作区状态">
          <span>
            <small>当前状态</small>
            <Status tone={completed ? "positive" : blocked || pending ? "warning" : "positive"}>
              {completed ? "已就绪" : blocked ? "阻断" : pending ? "待处理" : "可继续"}
            </Status>
          </span>
          <span>
            <small>{action.workflowStatus && !blocked ? "状态说明" : "阻断原因"}</small>
            <strong>
              {completed
                ? "无待办阻断"
                : action.workflowReason ?? (blocked ? action.label : "无主动作阻断")}
            </strong>
          </span>
          <span>
            <small>下一步</small>
            <strong>{completed ? "查看结果与审计证据" : action.label}</strong>
          </span>
        </div>
      </div>
      <button
        className={`design-primary-action ${action.tone ?? "primary"}`}
        disabled={action.disabled}
        onClick={action.onClick}
        type="button"
      >
        {action.label.includes("保存") ? (
          <Save size={15} />
        ) : action.label.includes("导出") ? (
          <Download size={15} />
        ) : (
          <Play size={15} />
        )}
        {action.label}
      </button>
    </header>
  );
}

export function Status({
  children,
  tone = "positive",
}: {
  children: ReactNode;
  tone?: "positive" | "warning" | "risk" | "neutral";
}) {
  return <span className={`design-status ${tone}`}>{children}</span>;
}

export function compactRunId(runId: string | null | undefined): string {
  if (!runId) return "—";
  return runId.length > 18 ? `${runId.slice(0, 9)}…${runId.slice(-6)}` : runId;
}
