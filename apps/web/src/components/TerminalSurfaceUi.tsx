import type { ReactNode } from "react";
import type { AiReviewProviderId } from "../lib/ai-review-stage3";

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
