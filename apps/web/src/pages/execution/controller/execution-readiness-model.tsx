import { ExecutionStage10ProductionExecutionSection } from "../../../components/ExecutionStage10ProductionExecutionSection";
import { quantCoreBaseUrl } from "../../app-shell/initial-state";
import { ExecutionAutoPaperTradingSection } from "../../dynamic-trading/ExecutionAutoPaperTradingSection";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "autoTradingSnapshot" | "completeLiveTradingGate" | "executionLiveTradingAllowed" | "executionMode" | "executionTestnetKillSwitch" | "i18n" | "isRunningStage6Sandbox" | "runStage6KillSwitchAction" | "setAutoTradingSnapshot" | "setIsRunningStage6Sandbox" | "setStage6SandboxError" | "stage6SandboxError" | "syncExecutionSafety">;
type Result = Pick<AppControllerBindings, "executionReadinessStack">;

export function useExecutionReadinessModel(controller: Dependencies): Result {
  const {
    autoTradingSnapshot, completeLiveTradingGate, executionLiveTradingAllowed, executionMode, executionTestnetKillSwitch, i18n,
    isRunningStage6Sandbox, runStage6KillSwitchAction, setAutoTradingSnapshot, setIsRunningStage6Sandbox, setStage6SandboxError, stage6SandboxError,
    syncExecutionSafety
  } = controller;
  const executionReadinessStack = (
      <details
        className="execution-readiness-stack"
        data-live-authorized={executionLiveTradingAllowed}
        open
        tabIndex={-1}
      >
        <summary>
          <span>{i18n.locale === "zh-CN" ? "自动交易控制与生产授权" : "Automatic trading controls & production authorization"}</span>
          <strong>{!autoTradingSnapshot
            ? i18n.locale === "zh-CN" ? "运行状态读取中或暂不可用" : "Runtime status loading or unavailable"
            : executionLiveTradingAllowed
            ? i18n.locale === "zh-CN" ? "生产会话有效" : "Production session active"
            : executionMode === "live"
              ? i18n.locale === "zh-CN" ? "生产实盘需授权" : "Production authorization required"
              : executionMode === "testnet"
                ? i18n.locale === "zh-CN" ? "当前为测试网模式" : "Sandbox mode"
                : i18n.locale === "zh-CN" ? "当前为纸面模拟" : "Paper mode"}</strong>
        </summary>
        <div className="execution-readiness-stack-body">
          <ExecutionAutoPaperTradingSection
            baseUrl={quantCoreBaseUrl}
            onSafetyChange={syncExecutionSafety}
            onSnapshotChange={setAutoTradingSnapshot}
          />
          {executionMode === "testnet" ? (
            <section className="execution-testnet-safety" aria-labelledby="execution-testnet-safety-title">
              <div>
                <span>{i18n.locale === "zh-CN" ? "测试网安全边界" : "Sandbox safety boundary"}</span>
                <h2 id="execution-testnet-safety-title">
                  {i18n.locale === "zh-CN" ? "币安现货测试网急停" : "Binance Spot sandbox kill switch"}
                </h2>
                <p>
                  {i18n.locale === "zh-CN"
                    ? "只控制测试网委托；不会改变生产实盘急停或授权。"
                    : "Controls sandbox orders only; production authorization is unchanged."}
                </p>
              </div>
              <strong className={executionTestnetKillSwitch?.triggered ? "blocked" : "ready"}>
                {executionTestnetKillSwitch?.triggered
                  ? i18n.locale === "zh-CN" ? "已触发" : "Triggered"
                  : i18n.locale === "zh-CN" ? "未触发" : "Clear"}
              </strong>
              <button
                disabled={isRunningStage6Sandbox}
                onClick={() => void runStage6KillSwitchAction(!executionTestnetKillSwitch?.triggered)}
                type="button"
              >
                {isRunningStage6Sandbox
                  ? i18n.locale === "zh-CN" ? "处理中…" : "Working…"
                  : executionTestnetKillSwitch?.triggered
                    ? i18n.locale === "zh-CN" ? "完成对账后重置测试网急停" : "Reset after reconciliation"
                    : i18n.locale === "zh-CN" ? "触发测试网急停" : "Trigger sandbox kill switch"}
              </button>
              {stage6SandboxError ? <p role="status">{stage6SandboxError}</p> : null}
            </section>
          ) : null}
          <ExecutionStage10ProductionExecutionSection
            autoTradingSnapshot={autoTradingSnapshot}
            baseUrl={quantCoreBaseUrl}
            onAutoLiveAuthorized={completeLiveTradingGate}
            sectionId="execution-center-live-trading-control"
          />
        </div>
      </details>
    );
  return {
    executionReadinessStack
  };
}
