import { CheckCircle2, X } from "lucide-react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

export type ResearchCompletionNoticeViewModel = Pick<AppControllerBindings, "dismissResearchCompletionNotice" | "i18n" | "researchCompletionNotice">;

type ResearchCompletionNoticeProps = { controller: ResearchCompletionNoticeViewModel };

export function ResearchCompletionNotice({ controller }: ResearchCompletionNoticeProps) {
  const {
    dismissResearchCompletionNotice, i18n, researchCompletionNotice
  } = controller;
  return (
    researchCompletionNotice ? (
            <aside aria-live="polite" className="research-completion-notice" role="status">
              <span className="research-completion-notice-icon" aria-hidden="true">
                <CheckCircle2 size={19} />
              </span>
              <span className="research-completion-notice-copy">
                <strong>{i18n.statusLabel("Research run complete")}</strong>
                <small>
                  {researchCompletionNotice.instrumentName} · {researchCompletionNotice.symbol} ·{" "}
                  {researchCompletionNotice.timeframe} · {researchCompletionNotice.dataRows}{" "}
                  {i18n.locale === "zh-CN"
                    ? researchCompletionNotice.readbackReady
                      ? "根 K 线 · 审计证据已绑定"
                      : "根 K 线 · 审计运行已创建 · 列表回读待恢复"
                    : researchCompletionNotice.readbackReady
                      ? "bars · audit evidence bound"
                      : "bars · audit run created · list readback pending"}
                </small>
                <code>{researchCompletionNotice.runId}</code>
              </span>
              <button
                aria-label={i18n.locale === "zh-CN" ? "关闭研究完成提示" : "Dismiss research completion notice"}
                onClick={dismissResearchCompletionNotice}
                type="button"
              >
                <X size={15} />
              </button>
            </aside>
          ) : null
  );
}
