import { BrainCircuit, Check, RefreshCw, X } from "lucide-react";
import { type Dispatch, type RefObject, type SetStateAction } from "react";
import { type AiReviewProviderId, type AiReviewProviderStatus } from "../../lib/ai-review-stage3";
import { type AppI18n } from "../../lib/i18n";
import { type StrategyAiDraftResult } from "../../lib/terminal-api";
import { type TerminalWorkspace } from "../../lib/terminal-workbench";
import { strategyAiProviderLabel, strategyConditionOptionLabel } from "./StrategyFormatters";

export function StrategyAiDraftDialog({ canApplyStrategyAiDraft, canGenerateStrategyAiDraft, closeStrategyAiDialog, generateStrategyAiCandidate, i18n, isGeneratingStrategyAiDraft, isStrategyAiDialogOpen, selectedStrategyAiProvider, setStrategyAiError, setStrategyAiExternalDataApproved, setStrategyAiGoal, setStrategyAiProviderId, setStrategyAiResult, setStrategyAiResultContextIdentity, strategyAiCandidate, strategyAiDialogRef, strategyAiDraftChanges, strategyAiError, strategyAiExternalDataApproved, strategyAiGoal, strategyAiGoalRef, strategyAiProviderId, strategyAiResult, applyStrategyAiCandidate, providers, strategyAiUsesExternalProvider, workspace }: {
  applyStrategyAiCandidate: () => void;
  canApplyStrategyAiDraft: boolean;
  canGenerateStrategyAiDraft: boolean;
  closeStrategyAiDialog: () => void;
  generateStrategyAiCandidate: () => Promise<void>;
  i18n: AppI18n;
  isGeneratingStrategyAiDraft: boolean;
  isStrategyAiDialogOpen: boolean;
  providers: AiReviewProviderStatus[];
  selectedStrategyAiProvider?: AiReviewProviderStatus;
  setStrategyAiError: Dispatch<SetStateAction<string | null>>;
  setStrategyAiExternalDataApproved: Dispatch<SetStateAction<boolean>>;
  setStrategyAiGoal: Dispatch<SetStateAction<string>>;
  setStrategyAiProviderId: Dispatch<SetStateAction<AiReviewProviderId>>;
  setStrategyAiResult: Dispatch<SetStateAction<StrategyAiDraftResult | null>>;
  setStrategyAiResultContextIdentity: Dispatch<SetStateAction<string | null>>;
  strategyAiCandidate: StrategyAiDraftResult["candidate"] | null;
  strategyAiDialogRef: RefObject<HTMLDialogElement | null>;
  strategyAiDraftChanges: Array<{ id: string; label: string; currentValue: string; candidateValue: string }>;
  strategyAiError: string | null;
  strategyAiExternalDataApproved: boolean;
  strategyAiGoal: string;
  strategyAiGoalRef: RefObject<HTMLTextAreaElement | null>;
  strategyAiProviderId: AiReviewProviderId;
  strategyAiResult: StrategyAiDraftResult | null;
  strategyAiUsesExternalProvider: boolean;
  workspace: TerminalWorkspace;
}) {
  return (
    <>
      {isStrategyAiDialogOpen ? (
        <dialog
          aria-describedby="strategy-ai-subtitle"
          aria-labelledby="strategy-ai-title"
          aria-modal="true"
          className="research-confirmation-dialog strategy-ai-dialog"
          onCancel={(event) => {
            event.preventDefault();
            closeStrategyAiDialog();
          }}
          ref={strategyAiDialogRef}
        >
          <section className="research-confirmation-modal strategy-ai-modal">
            <header>
              <div>
                <span className="research-confirmation-kicker strategy-ai-kicker">
                  <BrainCircuit aria-hidden="true" size={14} />
                  {i18n.t("strategy.aiAssist")}
                </span>
                <h2 id="strategy-ai-title">{i18n.t("strategy.aiTitle")}</h2>
              </div>
              <button
                aria-label={i18n.t("strategy.aiClose")}
                className="panel-icon-button"
                onClick={closeStrategyAiDialog}
                type="button"
              >
                <X size={17} />
              </button>
            </header>
            <p id="strategy-ai-subtitle">{i18n.t("strategy.aiSubtitle")}</p>
            <div className="strategy-ai-context" aria-label={i18n.t("strategy.context")}>
              <span>{i18n.marketLabel(workspace.selectedInstrument.market)}</span>
              <strong>{workspace.selectedInstrument.symbol} · {i18n.instrumentName(workspace.selectedInstrument.name)}</strong>
              <span>{workspace.selectedTimeframe}</span>
              <em>{i18n.t("strategy.aiDraftOnly")}</em>
            </div>
            <div className="strategy-ai-request-grid">
              <label className="strategy-ai-goal-field" htmlFor="strategy-ai-goal">
                <span>{i18n.t("strategy.aiGoal")}</span>
                <textarea
                  disabled={isGeneratingStrategyAiDraft}
                  id="strategy-ai-goal"
                  maxLength={1000}
                  onChange={(event) => {
                    setStrategyAiGoal(event.currentTarget.value);
                    setStrategyAiResult(null);
                    setStrategyAiResultContextIdentity(null);
                    setStrategyAiError(null);
                  }}
                  placeholder={i18n.t("strategy.aiGoalPlaceholder")}
                  ref={strategyAiGoalRef}
                  rows={4}
                  value={strategyAiGoal}
                />
                <small>{strategyAiGoal.trim().length}/1000</small>
              </label>
              <div className="strategy-ai-provider-card">
                <label htmlFor="strategy-ai-provider">
                  <span>{i18n.t("strategy.aiProvider")}</span>
                  <select
                    disabled={isGeneratingStrategyAiDraft}
                    id="strategy-ai-provider"
                    onChange={(event) => {
                      setStrategyAiProviderId(event.currentTarget.value as AiReviewProviderId);
                      setStrategyAiExternalDataApproved(false);
                      setStrategyAiResult(null);
                      setStrategyAiResultContextIdentity(null);
                      setStrategyAiError(null);
                    }}
                    value={strategyAiProviderId}
                  >
                    {providers.map((provider) => (
                      <option
                        disabled={!provider.configured}
                        key={provider.providerId}
                        value={provider.providerId}
                      >
                        {strategyAiProviderLabel(i18n, provider.providerId)}
                        {provider.configured ? "" : i18n.locale === "zh-CN" ? " · 未配置" : " · not configured"}
                      </option>
                    ))}
                  </select>
                </label>
                <small className="strategy-ai-provider-meta">
                  {strategyAiUsesExternalProvider
                    ? `${selectedStrategyAiProvider?.model ?? (i18n.locale === "zh-CN" ? "模型未配置" : "Model unavailable")} · ${selectedStrategyAiProvider?.sanitizedBaseUrl ?? (i18n.locale === "zh-CN" ? "地址未配置" : "Endpoint unavailable")}`
                    : i18n.locale === "zh-CN"
                      ? "确定性本地基线 · 不发送任何数据"
                      : "Deterministic local baseline · no data is sent"}
                </small>
                {strategyAiUsesExternalProvider ? (
                  <div className="strategy-ai-external-consent">
                    <p>{i18n.t("strategy.aiExternalSummary")}</p>
                    <label htmlFor="strategy-ai-external-approval">
                      <input
                        checked={strategyAiExternalDataApproved}
                        disabled={isGeneratingStrategyAiDraft}
                        id="strategy-ai-external-approval"
                        onChange={(event) => {
                          setStrategyAiExternalDataApproved(event.currentTarget.checked);
                          setStrategyAiResult(null);
                          setStrategyAiResultContextIdentity(null);
                          setStrategyAiError(null);
                        }}
                        type="checkbox"
                      />
                      <span>{i18n.t("strategy.aiExternalApproval")}</span>
                    </label>
                  </div>
                ) : null}
                <button
                  className="strategy-ai-generate-button"
                  disabled={!canGenerateStrategyAiDraft}
                  onClick={() => void generateStrategyAiCandidate()}
                  type="button"
                >
                  {isGeneratingStrategyAiDraft
                    ? <RefreshCw aria-hidden="true" className="spin" size={15} />
                    : <BrainCircuit aria-hidden="true" size={15} />}
                  {isGeneratingStrategyAiDraft
                    ? i18n.t("strategy.aiGenerating")
                    : i18n.t("strategy.aiGenerate")}
                </button>
              </div>
            </div>
            {strategyAiError ? (
              <p className="strategy-ai-message error" role="alert">{strategyAiError}</p>
            ) : null}
            {strategyAiCandidate ? (
              <section
                aria-labelledby="strategy-ai-preview-title"
                aria-live="polite"
                className="strategy-ai-preview"
              >
                <div className="strategy-ai-preview-heading">
                  <div>
                    <span>{i18n.t("strategy.aiPreview")}</span>
                    <strong id="strategy-ai-preview-title">{strategyAiCandidate.draft.name}</strong>
                  </div>
                  <em className={strategyAiResult?.generation?.status === "skipped" || strategyAiResult?.generation?.fallbackUsed ? "baseline" : strategyAiResult?.validation?.status ?? "review"}>
                    {strategyAiResult?.generation?.fallbackUsed || strategyAiResult?.generation?.status === "failed"
                      ? i18n.t("strategy.aiFallbackBadge")
                      : strategyAiResult?.generation?.status === "skipped"
                      ? i18n.t("strategy.aiLocalBaseline")
                      : strategyAiResult?.validation?.status === "blocked"
                      ? i18n.locale === "zh-CN" ? "未通过校验" : "Blocked"
                      : i18n.locale === "zh-CN" ? "待人工应用" : "Ready to apply"}
                  </em>
                </div>
                <div className="strategy-ai-preview-grid">
                  <article>
                    <span>{i18n.t("strategy.entryCondition")}</span>
                    <strong>{strategyConditionOptionLabel(i18n, strategyAiCandidate.draft.entryKind)}</strong>
                    <small>
                      {strategyAiCandidate.draft.entryKind === "rsi_below"
                        ? `${i18n.t("strategy.rsiWindow")} ${strategyAiCandidate.draft.entryWindow} · ${i18n.t("strategy.rsiThreshold")} ${strategyAiCandidate.draft.entryThreshold}`
                        : i18n.locale === "zh-CN"
                          ? `${strategyAiCandidate.draft.entryWindow} 周期简单移动平均线`
                          : `SMA ${strategyAiCandidate.draft.entryWindow}`}
                    </small>
                  </article>
                  <article>
                    <span>{i18n.t("strategy.exitCondition")}</span>
                    <strong>{strategyConditionOptionLabel(i18n, strategyAiCandidate.draft.exitKind)}</strong>
                    <small>
                      {strategyAiCandidate.draft.exitKind === "rsi_above"
                        ? `${i18n.t("strategy.rsiWindow")} ${strategyAiCandidate.draft.exitWindow} · ${i18n.t("strategy.rsiThreshold")} ${strategyAiCandidate.draft.exitThreshold}`
                        : i18n.locale === "zh-CN"
                          ? `${strategyAiCandidate.draft.exitWindow} 周期简单移动平均线`
                          : `SMA ${strategyAiCandidate.draft.exitWindow}`}
                    </small>
                  </article>
                  <article>
                    <span>{i18n.t("strategy.positionPct")}</span>
                    <strong>{strategyAiCandidate.draft.positionPct}%</strong>
                    <small>
                      {i18n.t("strategy.stopLossPct")} {strategyAiCandidate.draft.stopLossPct}% · {i18n.t("strategy.takeProfitPct")} {strategyAiCandidate.draft.takeProfitPct}%
                    </small>
                  </article>
                  <article>
                    <span>{i18n.t("strategy.maxDrawdownPct")}</span>
                    <strong>{strategyAiCandidate.draft.maxDrawdownPct}%</strong>
                    <small>
                      {strategyAiCandidate.draft.entryRsiConfirm
                        ? i18n.locale === "zh-CN" ? "相对强弱指标确认" : "RSI confirmation"
                        : i18n.locale === "zh-CN" ? "无相对强弱指标确认" : "No RSI confirmation"}
                      {" · "}
                      {strategyAiCandidate.draft.entryVolumeConfirm ? i18n.t("strategy.volumeConfirm") : i18n.locale === "zh-CN" ? "无成交量确认" : "No volume confirmation"}
                    </small>
                  </article>
                </div>
                <div className="strategy-ai-diff" role="table" aria-label={i18n.t("strategy.aiChanges") }>
                  <div className="strategy-ai-diff-row heading" role="row">
                    <strong role="columnheader">{i18n.t("strategy.aiChanges")}</strong>
                    <span role="columnheader">{i18n.t("strategy.aiCurrentValue")}</span>
                    <span role="columnheader">{i18n.t("strategy.aiCandidateValue")}</span>
                  </div>
                  {strategyAiDraftChanges.length ? strategyAiDraftChanges.map((row) => (
                    <div className="strategy-ai-diff-row" key={row.id} role="row">
                      <strong role="rowheader">{row.label}</strong>
                      <span role="cell">{row.currentValue}</span>
                      <span role="cell">{row.candidateValue}</span>
                    </div>
                  )) : (
                    <p className="strategy-ai-diff-empty">{i18n.t("strategy.aiNoChanges")}</p>
                  )}
                </div>
                <div className="strategy-ai-reasons">
                  <h3>{i18n.t("strategy.aiReasons")}</h3>
                  <ol>
                    {strategyAiCandidate.reasons.map((reason, index) => (
                      <li key={`${index}-${reason}`}>{reason}</li>
                    ))}
                  </ol>
                </div>
                {strategyAiResult?.generation?.warning ? (
                  <p className="strategy-ai-message">{strategyAiResult.generation.warning}</p>
                ) : null}
              </section>
            ) : null}
            <footer className="research-confirmation-actions strategy-ai-actions">
              <button
                className="design-secondary-action"
                onClick={closeStrategyAiDialog}
                type="button"
              >
                {isGeneratingStrategyAiDraft
                  ? i18n.t("strategy.aiCancelGeneration")
                  : i18n.t("strategy.aiClose")}
              </button>
              <button
                className="strategy-ai-apply-button"
                disabled={!canApplyStrategyAiDraft}
                onClick={applyStrategyAiCandidate}
                type="button"
              >
                <Check aria-hidden="true" size={15} />
                {i18n.t("strategy.aiApply")}
              </button>
            </footer>
          </section>
        </dialog>
      ) : null}
    </>
  );
}
