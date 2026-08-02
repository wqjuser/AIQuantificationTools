import { ExecutionStage10ProductionExecutionSection } from "../../../components/ExecutionStage10ProductionExecutionSection";
import { quantCoreBaseUrl } from "../../app-shell/initial-state";
import { ShieldCheck, X } from "lucide-react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

export type LiveTradingGateDialogViewModel = Pick<AppControllerBindings,
    "autoTradingSnapshot" | "closeLiveTradingGate" | "completeLiveTradingGate" | "isLiveTradingGateDialogOpen" | "liveTradingGateDialogRef"
  >;

type LiveTradingGateDialogProps = { controller: LiveTradingGateDialogViewModel };

export function LiveTradingGateDialog({ controller }: LiveTradingGateDialogProps) {
  const {
    autoTradingSnapshot, closeLiveTradingGate, completeLiveTradingGate, isLiveTradingGateDialogOpen, liveTradingGateDialogRef
  } = controller;
  return (
    isLiveTradingGateDialogOpen ? (
            <dialog
              aria-describedby="live-trading-gate-dialog-detail"
              aria-labelledby="live-trading-gate-dialog-title"
              aria-modal="true"
              className="research-confirmation-dialog live-trading-gate-dialog"
              onCancel={closeLiveTradingGate}
              ref={liveTradingGateDialogRef}
              role="alertdialog"
            >
              <section className="research-confirmation-modal live-trading-gate-modal">
                <header>
                  <div>
                    <span className="research-confirmation-kicker">
                      <ShieldCheck size={15} />
                      实盘人工门禁
                    </span>
                    <h2 id="live-trading-gate-dialog-title">实盘操作确认</h2>
                  </div>
                  <button
                    aria-label="关闭实盘操作确认"
                    className="panel-icon-button"
                    onClick={closeLiveTradingGate}
                    type="button"
                  >
                    <X size={17} />
                  </button>
                </header>
                <p id="live-trading-gate-dialog-detail">
                  按当前状态完成凭据检查、权限核验、控制恢复和实名确认；打开窗口不会自动启用实盘。
                </p>
                <ExecutionStage10ProductionExecutionSection
                  autoTradingSnapshot={autoTradingSnapshot}
                  baseUrl={quantCoreBaseUrl}
                  onAutoLiveAuthorized={completeLiveTradingGate}
                  sectionId="live-trading-gate-dialog-control"
                />
              </section>
            </dialog>
          ) : null
  );
}
