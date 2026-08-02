import { Save, X } from "lucide-react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

export type SettingsUnsavedDialogViewModel = Pick<AppControllerBindings,
    "continueEditingSettings" | "discardSettingsAndLeave" | "isSavingSettingsConfiguration" | "pendingSettingsWorkAreaId" | "saveSettingsAndLeave" | "settingsConfigurationMessage" | "settingsUnsavedContinueButtonRef" | "settingsUnsavedDialogRef"
  >;

type SettingsUnsavedDialogProps = { controller: SettingsUnsavedDialogViewModel };

export function SettingsUnsavedDialog({ controller }: SettingsUnsavedDialogProps) {
  const {
    continueEditingSettings, discardSettingsAndLeave, isSavingSettingsConfiguration, pendingSettingsWorkAreaId, saveSettingsAndLeave,
    settingsConfigurationMessage, settingsUnsavedContinueButtonRef, settingsUnsavedDialogRef
  } = controller;
  return (
    pendingSettingsWorkAreaId ? (
            <dialog
              aria-describedby="settings-unsaved-dialog-detail"
              aria-labelledby="settings-unsaved-dialog-title"
              aria-modal="true"
              className="research-confirmation-dialog settings-unsaved-dialog"
              onCancel={(event) => {
                if (isSavingSettingsConfiguration) {
                  event.preventDefault();
                  return;
                }
                continueEditingSettings();
              }}
              ref={settingsUnsavedDialogRef}
              role="alertdialog"
            >
              <section className="research-confirmation-modal">
                <header>
                  <div>
                    <span className="research-confirmation-kicker">
                      <Save size={15} />
                      未保存配置
                    </span>
                    <h2 id="settings-unsaved-dialog-title">保存设置后再离开？</h2>
                  </div>
                  <button
                    aria-label="返回继续编辑设置"
                    className="panel-icon-button"
                    disabled={isSavingSettingsConfiguration}
                    onClick={continueEditingSettings}
                    type="button"
                  >
                    <X size={17} />
                  </button>
                </header>
                <p id="settings-unsaved-dialog-detail">
                  检测到配置项尚未保存。保存并离开会应用当前表单全部配置；不保存离开将丢失这些修改。
                </p>
                {settingsConfigurationMessage?.startsWith("保存失败") ? (
                  <p className="execution-stage5-shadow-error" role="alert">
                    {settingsConfigurationMessage}
                  </p>
                ) : null}
                <footer className="research-confirmation-actions">
                  <button
                    className="design-secondary-action"
                    disabled={isSavingSettingsConfiguration}
                    onClick={continueEditingSettings}
                    ref={settingsUnsavedContinueButtonRef}
                    type="button"
                  >
                    返回继续编辑
                  </button>
                  <button
                    className="design-secondary-action"
                    disabled={isSavingSettingsConfiguration}
                    onClick={discardSettingsAndLeave}
                    type="button"
                  >
                    不保存并离开
                  </button>
                  <button
                    className="run-button"
                    disabled={isSavingSettingsConfiguration}
                    onClick={saveSettingsAndLeave}
                    type="button"
                  >
                    <Save size={15} />
                    {isSavingSettingsConfiguration ? "保存中…" : "保存并离开"}
                  </button>
                </footer>
              </section>
            </dialog>
          ) : null
  );
}
