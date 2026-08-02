import { AlertTriangle, CheckCircle2, Save } from "lucide-react";
import { PageHeader, SurfacePanel } from "../../components/TerminalSurfaceUi";
import type { TerminalWorkspacePageProps } from "../shared/terminal-workspace-page";
import { connectorTimestamp } from "../shared/terminal-workspace-formatters";
import "./ExecutionPage.layout.css";

export function ExecutionPage({
  action,
  executionReadiness,
  executionSnapshot,
  isSavingSettingsConfiguration,
  onSaveSettingsConfiguration,
  settings,
  settingsConfigurationMessage,
}: Pick<
  TerminalWorkspacePageProps,
  | "action"
  | "executionReadiness"
  | "executionSnapshot"
  | "isSavingSettingsConfiguration"
  | "onSaveSettingsConfiguration"
  | "settings"
  | "settingsConfigurationMessage"
>) {
  const configuration = settings?.configuration;
  const authoritativeSnapshotExpected = executionSnapshot !== undefined;
  const authoritativeSnapshotAvailable = executionSnapshot != null;
  const executionMode = executionSnapshot?.state.executionMode
    ?? settings?.safety.executionMode
    ?? "paper";
  const liveTradingAllowed = authoritativeSnapshotAvailable
    ? executionSnapshot.liveTradingAllowed
    : authoritativeSnapshotExpected
      ? false
      : settings?.safety.liveTradingAllowed === true;
  const liveAuthorizedUntil = authoritativeSnapshotAvailable
    ? executionSnapshot.state.liveAuthorizedUntil
    : authoritativeSnapshotExpected
      ? null
      : settings?.safety.liveAuthorizedUntil;
  const productionSessionActive = executionMode === "live" && liveTradingAllowed;
  const executionModeMessage = authoritativeSnapshotExpected && !authoritativeSnapshotAvailable
    ? "自动交易运行状态暂不可用；为避免使用陈旧配置，当前不宣称生产会话或生产路由可用。"
    : productionSessionActive
    ? `生产会话有效${
      liveAuthorizedUntil
        ? `，有效至 ${connectorTimestamp(liveAuthorizedUntil)}`
        : ""
    }；生产路由可用。每笔委托仍会复核权限、急停、账户覆盖和风险边界。`
    : executionMode === "live"
      ? "当前为币安现货生产实盘，但生产会话尚未授权或已过期；需重新完成权限核验、急停恢复和实名确认。"
      : executionMode === "testnet"
        ? "当前为币安现货测试网；仅使用测试网资金，不会提交生产实盘委托。"
        : "当前为纸面模拟；仅记录模拟决策与成交，不会向交易所提交委托。";
  return (
    <>
      <PageHeader
        action={action}
        title="执行中心"
        subtitle="自动交易运行状态、风险参数与生产授权"
      />
      <div className={`design-live-warning${productionSessionActive ? " positive" : ""}`}>
        {productionSessionActive ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
        {executionModeMessage}
      </div>
      {configuration && onSaveSettingsConfiguration ? (
        <SurfacePanel
          className="design-live-session-policy"
          subtitle="修改后实时保存；在下一次实名授权或续期时采用"
          title="生产授权策略"
        >
          <form
            aria-label="生产授权有效时长配置"
            className="design-settings-field"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              onSaveSettingsConfiguration({
                configuration: {
                  ...configuration.values,
                  liveSessionTtlHours: Number(data.get("liveSessionTtlHours")),
                },
                secretUpdates: {},
                clearSecrets: [],
              });
            }}
          >
            <label htmlFor="execution-live-session-ttl">生产授权有效时长（小时）</label>
            <input
              aria-describedby="execution-live-session-ttl-hint"
              defaultValue={configuration.values.liveSessionTtlHours}
              id="execution-live-session-ttl"
              max="8760"
              min="0"
              name="liveSessionTtlHours"
              required
              step="1"
              type="number"
            />
            <small id="execution-live-session-ttl-hint">
              默认 8 小时；0 表示永久有效。修改不会静默延长当前会话。
            </small>
            <button
              className="design-secondary-action"
              disabled={isSavingSettingsConfiguration}
              type="submit"
            >
              <Save size={13} />
              {isSavingSettingsConfiguration ? "保存中…" : "保存授权时长"}
            </button>
            {settingsConfigurationMessage ? (
              <p aria-live="polite" className="design-settings-message">
                {settingsConfigurationMessage}
              </p>
            ) : null}
          </form>
        </SurfacePanel>
      ) : null}
      {executionReadiness ? (
        <div className="design-execution-readiness">{executionReadiness}</div>
      ) : null}
    </>
  );
}
