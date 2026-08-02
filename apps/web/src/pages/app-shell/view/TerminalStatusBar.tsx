import type { AppControllerBindings } from "../controller/bindings";

export type TerminalStatusBarViewModel = Pick<AppControllerBindings,
    "currentExecutionModeLabel" | "currentExecutionTone" | "currentExecutionVenueLabel" | "footerExecutionDetail" | "footerExecutionStatus" | "i18n" | "source" | "workspace"
  >;

type TerminalStatusBarProps = { controller: TerminalStatusBarViewModel };

export function TerminalStatusBar({ controller }: TerminalStatusBarProps) {
  const {
    currentExecutionModeLabel, currentExecutionTone, currentExecutionVenueLabel, footerExecutionDetail, footerExecutionStatus,
    i18n, source, workspace
  } = controller;
  return (
    <footer className="terminal-status-bar" aria-label={i18n.locale === "zh-CN" ? "系统状态" : "System status"}>
            <div className="terminal-status-item">
              <span>{i18n.locale === "zh-CN" ? "数据" : "Data"}</span>
              <strong><i className="status-dot" />{source === "core" ? (i18n.locale === "zh-CN" ? "正常" : "Healthy") : (i18n.locale === "zh-CN" ? "离线快照" : "Offline snapshot")}</strong>
            </div>
            <div className="terminal-status-item">
              <span>{i18n.locale === "zh-CN" ? "模型" : "Model"}</span>
              <strong><i className="status-dot" />{i18n.locale === "zh-CN" ? "本地基线有效" : "Local baseline ready"}</strong>
            </div>
            <div className={`terminal-status-item ${currentExecutionTone}`}>
              <span>{currentExecutionVenueLabel}</span>
              <strong>{currentExecutionModeLabel}</strong>
            </div>
            <div className="terminal-status-item">
              <span>{i18n.locale === "zh-CN" ? "审计" : "Audit"}</span>
              <strong><i className="status-dot" />{workspace.researchRun?.runId ? (i18n.locale === "zh-CN" ? "证据已绑定" : "Evidence bound") : (i18n.locale === "zh-CN" ? "等待运行" : "Awaiting run")}</strong>
            </div>
            <div className="terminal-live-block">
              <span>{i18n.locale === "zh-CN" ? "实盘交易" : "Live trading"}</span>
              <strong>{footerExecutionStatus}</strong>
              <small>{footerExecutionDetail}</small>
            </div>
          </footer>
  );
}
