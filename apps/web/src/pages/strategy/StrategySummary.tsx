import { type AiReviewProviderId, type AiReviewProviderStatus } from "../../lib/ai-review-stage3";
import { type AppI18n } from "../../lib/i18n";
import { StrategyAiDraftResult, StrategyLibraryItem, StrategyProductionBindingResult, WorkspaceLoadResult, generateStrategyAiDraft } from "../../lib/terminal-api";
import { StrategyGovernanceQueue, StrategyGovernanceQueueRow, StrategyReadinessGate, StrategyRuleDraft, StrategyRuleDraftField, StrategyRuleRow, StrategyTemplateId, StrategyTemplateOption, TerminalWorkspace, buildStrategyVersionDiffRows } from "../../lib/terminal-workbench";
import { quantCoreBaseUrl } from "../app-shell/initial-state";
import { StrategyConditionField, StrategyNumberField, StrategyRsiConfirmField, StrategyTemplatePicker, StrategyVolumeConfirmField } from "./StrategyFields";
import { strategyAiDraftContextIdentity, strategyAiDraftDiffRows, strategyAiProviderLabel, strategyConditionOptionLabel, strategyDiffRowLabel, strategyGovernanceActionLabel, strategyGovernanceChangedFieldLabel, strategyGovernanceContextLabel, strategyGovernanceDetailLabel, strategyGovernanceStageLabel, strategyGovernanceValidationLabel, strategyLibraryStatusLabel, strategyProductionBindingErrorLabel, strategyProductionSwitchReasonLabel, strategyReadinessGateLabel, strategyReadinessGateStatusLabel, strategyRuleGroupLabel, strategyRuleLabel, strategyRuleParameterLabel, strategyRuleStatusLabel, strategyValidationSourceLabel } from "./StrategyFormatters";
import { BrainCircuit, GitBranch, Play, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StrategyAiDraftDialog } from "./StrategyAiDraftDialog";

export function StrategySummary({
  bindingStrategyRevision,
  draft,
  i18n,
  isSavingStrategy,
  library,
  onApplyAiStrategyDraft,
  onApplyStrategyTemplate,
  onBindStrategyToProduction,
  onDeleteStrategyVersion,
  onLoadStrategyVersion,
  onRunStrategyGovernanceAction,
  onSaveStrategyVersion,
  onUpdateStrategyRuleDraftField,
  providers,
  readinessGates,
  rows,
  showSaveAction,
  strategyGovernanceQueue,
  strategyProductionBinding,
  templates,
  validationSource,
  workspace
}: {
  bindingStrategyRevision: string | null;
  draft: StrategyRuleDraft;
  i18n: AppI18n;
  isSavingStrategy: boolean;
  library: StrategyLibraryItem[];
  onApplyAiStrategyDraft: (draft: StrategyRuleDraft, reasons: string[]) => void;
  onApplyStrategyTemplate: (templateId: StrategyTemplateId) => void;
  onBindStrategyToProduction: (strategy: StrategyLibraryItem | null, operator: string) => Promise<boolean>;
  onDeleteStrategyVersion: (strategy: StrategyLibraryItem) => Promise<boolean>;
  onLoadStrategyVersion: (strategy: StrategyLibraryItem) => void;
  onRunStrategyGovernanceAction: (row: StrategyGovernanceQueueRow) => void;
  onSaveStrategyVersion: () => void;
  onUpdateStrategyRuleDraftField: (field: StrategyRuleDraftField, value: number | string | boolean) => void;
  providers: AiReviewProviderStatus[];
  readinessGates: StrategyReadinessGate[];
  rows: StrategyRuleRow[];
  showSaveAction: boolean;
  strategyGovernanceQueue: StrategyGovernanceQueue;
  strategyProductionBinding: StrategyProductionBindingResult;
  templates: StrategyTemplateOption[];
  validationSource: WorkspaceLoadResult["source"];
  workspace: TerminalWorkspace;
}) {
  const [strategyToDelete, setStrategyToDelete] = useState<StrategyLibraryItem | null>(null);
  const [deletingStrategyRevision, setDeletingStrategyRevision] = useState<string | null>(null);
  const [strategyDeleteFailed, setStrategyDeleteFailed] = useState(false);
  const [strategyBindingTarget, setStrategyBindingTarget] =
    useState<{ strategy: StrategyLibraryItem | null } | null>(null);
  const [strategyBindingOperator, setStrategyBindingOperator] = useState("");
  const strategyDeleteDialogRef = useRef<HTMLDialogElement>(null);
  const strategyDeleteCancelRef = useRef<HTMLButtonElement>(null);
  const strategyBindingDialogRef = useRef<HTMLDialogElement>(null);
  const strategyBindingOperatorRef = useRef<HTMLInputElement>(null);
  const strategyLibraryRef = useRef<HTMLDivElement>(null);
  const strategyAiDialogRef = useRef<HTMLDialogElement>(null);
  const strategyAiGoalRef = useRef<HTMLTextAreaElement>(null);
  const strategyAiTriggerRef = useRef<HTMLButtonElement>(null);
  const strategyAiRequestIdRef = useRef(0);
  const strategyAiAbortControllerRef = useRef<AbortController | null>(null);
  const strategyAiContextIdentity = strategyAiDraftContextIdentity(workspace, draft);
  const strategyAiLatestContextIdentityRef = useRef(strategyAiContextIdentity);
  const strategyAiObservedContextIdentityRef = useRef(strategyAiContextIdentity);
  strategyAiLatestContextIdentityRef.current = strategyAiContextIdentity;
  const [isStrategyAiDialogOpen, setIsStrategyAiDialogOpen] = useState(false);
  const [isGeneratingStrategyAiDraft, setIsGeneratingStrategyAiDraft] = useState(false);
  const [strategyAiGoal, setStrategyAiGoal] = useState("");
  const [strategyAiProviderId, setStrategyAiProviderId] = useState<AiReviewProviderId>("local");
  const [strategyAiExternalDataApproved, setStrategyAiExternalDataApproved] = useState(false);
  const [strategyAiResult, setStrategyAiResult] = useState<StrategyAiDraftResult | null>(null);
  const [strategyAiResultContextIdentity, setStrategyAiResultContextIdentity] = useState<string | null>(null);
  const [strategyAiError, setStrategyAiError] = useState<string | null>(null);

  useEffect(() => {
    if (strategyToDelete && !strategyDeleteDialogRef.current?.open) {
      strategyDeleteDialogRef.current?.showModal();
      strategyDeleteCancelRef.current?.focus();
    }
  }, [strategyToDelete]);

  useEffect(() => {
    if (strategyBindingTarget && !strategyBindingDialogRef.current?.open) {
      strategyBindingDialogRef.current?.showModal();
      strategyBindingOperatorRef.current?.focus();
    }
  }, [strategyBindingTarget]);

  useEffect(() => {
    if (isStrategyAiDialogOpen && !strategyAiDialogRef.current?.open) {
      strategyAiDialogRef.current?.showModal();
      strategyAiGoalRef.current?.focus();
    }
  }, [isStrategyAiDialogOpen]);

  useEffect(() => {
    if (strategyAiObservedContextIdentityRef.current === strategyAiContextIdentity) {
      return;
    }
    strategyAiObservedContextIdentityRef.current = strategyAiContextIdentity;
    strategyAiAbortControllerRef.current?.abort();
    strategyAiAbortControllerRef.current = null;
    strategyAiRequestIdRef.current += 1;
    setIsGeneratingStrategyAiDraft(false);
    setStrategyAiResult(null);
    setStrategyAiResultContextIdentity(null);
    setStrategyAiError(isStrategyAiDialogOpen ? i18n.t("strategy.aiContextChanged") : null);
  }, [i18n, isStrategyAiDialogOpen, strategyAiContextIdentity]);

  useEffect(() => () => {
    strategyAiRequestIdRef.current += 1;
    strategyAiAbortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    const selectedProvider = providers.find((provider) => provider.providerId === strategyAiProviderId);
    if (!selectedProvider?.configured) {
      setStrategyAiProviderId(
        providers.find((provider) => provider.providerId !== "local" && provider.configured)?.providerId
          ?? "local"
      );
    }
  }, [providers, strategyAiProviderId]);

  const openStrategyAiDialog = () => {
    const preferredProvider = providers.find(
      (provider) => provider.providerId !== "local" && provider.configured
    )?.providerId ?? "local";
    setStrategyAiProviderId(preferredProvider);
    setStrategyAiGoal(
      i18n.locale === "zh-CN"
        ? `为${i18n.instrumentName(workspace.selectedInstrument.name)}编写一套中低风险的${workspace.selectedTimeframe}策略，使用可解释信号并控制单笔损失和最大回撤。`
        : `Create a medium-low risk ${workspace.selectedTimeframe} strategy for ${workspace.selectedInstrument.name} with explainable signals, controlled per-trade loss, and capped drawdown.`
    );
    setStrategyAiExternalDataApproved(false);
    setStrategyAiResult(null);
    setStrategyAiResultContextIdentity(null);
    setStrategyAiError(null);
    setIsStrategyAiDialogOpen(true);
  };

  const closeStrategyAiDialog = () => {
    strategyAiAbortControllerRef.current?.abort();
    strategyAiAbortControllerRef.current = null;
    strategyAiRequestIdRef.current += 1;
    strategyAiDialogRef.current?.close();
    setIsGeneratingStrategyAiDraft(false);
    setIsStrategyAiDialogOpen(false);
    setStrategyAiResult(null);
    setStrategyAiResultContextIdentity(null);
    setStrategyAiError(null);
    strategyAiTriggerRef.current?.focus();
  };

  const generateStrategyAiCandidate = async () => {
    const selectedProvider = providers.find((provider) => provider.providerId === strategyAiProviderId);
    if (
      isGeneratingStrategyAiDraft
      || strategyAiGoal.trim().length < 4
      || !selectedProvider?.configured
      || (strategyAiProviderId !== "local" && !strategyAiExternalDataApproved)
    ) {
      return;
    }
    const requestId = strategyAiRequestIdRef.current + 1;
    strategyAiRequestIdRef.current = requestId;
    const requestContextIdentity = strategyAiContextIdentity;
    strategyAiAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    strategyAiAbortControllerRef.current = abortController;
    const externalDataApproved = strategyAiProviderId !== "local" && strategyAiExternalDataApproved;
    if (externalDataApproved) {
      setStrategyAiExternalDataApproved(false);
    }
    let requestTimedOut = false;
    const timeoutId = window.setTimeout(() => {
      requestTimedOut = true;
      abortController.abort();
    }, 45_000);
    setIsGeneratingStrategyAiDraft(true);
    setStrategyAiResult(null);
    setStrategyAiResultContextIdentity(null);
    setStrategyAiError(null);
    const result = await generateStrategyAiDraft(quantCoreBaseUrl, {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe,
      goal: strategyAiGoal.trim(),
      currentDraft: draft,
      providerId: strategyAiProviderId,
      externalDataApproved
    }, abortController.signal);
    window.clearTimeout(timeoutId);
    if (strategyAiRequestIdRef.current !== requestId) {
      return;
    }
    if (strategyAiAbortControllerRef.current === abortController) {
      strategyAiAbortControllerRef.current = null;
    }
    setIsGeneratingStrategyAiDraft(false);
    if (requestTimedOut) {
      setStrategyAiError(i18n.t("strategy.aiTimedOut"));
      return;
    }
    if (
      abortController.signal.aborted
      || strategyAiLatestContextIdentityRef.current !== requestContextIdentity
    ) {
      setStrategyAiError(i18n.t("strategy.aiContextChanged"));
      return;
    }
    if (result.source !== "core" || !result.candidate || !result.generation) {
      setStrategyAiError(result.error ?? i18n.t("strategy.aiGenerateFailed"));
      return;
    }
    setStrategyAiResult(result);
    setStrategyAiResultContextIdentity(requestContextIdentity);
    if (result.generation.status === "failed" || result.generation.fallbackUsed) {
      setStrategyAiError(result.generation.warning ?? i18n.t("strategy.aiFallback"));
    }
  };

  const applyStrategyAiCandidate = () => {
    if (
      !strategyAiResult?.candidate
      || strategyAiResult.generation?.status !== "completed"
      || strategyAiResult.generation.fallbackUsed
      || strategyAiResult.validation?.status === "blocked"
      || strategyAiResultContextIdentity !== strategyAiContextIdentity
      || strategyAiResult.candidate.market !== workspace.selectedInstrument.market
      || strategyAiResult.candidate.symbol !== workspace.selectedInstrument.symbol
      || strategyAiResult.candidate.timeframe !== workspace.selectedTimeframe
    ) {
      setStrategyAiError(i18n.t("strategy.aiContextChanged"));
      return;
    }
    if (strategyAiDraftDiffRows(i18n, draft, strategyAiResult.candidate.draft).length === 0) {
      setStrategyAiError(i18n.t("strategy.aiNoChanges"));
      return;
    }
    onApplyAiStrategyDraft(
      strategyAiResult.candidate.draft,
      strategyAiResult.candidate.reasons
    );
    strategyAiDialogRef.current?.close();
    setIsStrategyAiDialogOpen(false);
    setStrategyAiResult(null);
    setStrategyAiResultContextIdentity(null);
    setStrategyAiError(null);
    strategyAiTriggerRef.current?.focus();
  };

  const closeStrategyDeleteDialog = () => {
    if (deletingStrategyRevision) {
      return;
    }
    strategyDeleteDialogRef.current?.close();
    setStrategyToDelete(null);
    setStrategyDeleteFailed(false);
  };

  const confirmStrategyDelete = async () => {
    if (!strategyToDelete || deletingStrategyRevision) {
      return;
    }
    setDeletingStrategyRevision(strategyToDelete.revision);
    setStrategyDeleteFailed(false);
    const deleted = await onDeleteStrategyVersion(strategyToDelete);
    setDeletingStrategyRevision(null);
    if (!deleted) {
      setStrategyDeleteFailed(true);
      return;
    }
    strategyDeleteDialogRef.current?.close();
    setStrategyToDelete(null);
    strategyLibraryRef.current?.focus();
  };

  const openStrategyBindingDialog = (strategy: StrategyLibraryItem | null) => {
    setStrategyBindingOperator(strategyProductionBinding.binding?.operator ?? "");
    setStrategyBindingTarget({ strategy });
  };

  const closeStrategyBindingDialog = () => {
    if (bindingStrategyRevision) {
      return;
    }
    strategyBindingDialogRef.current?.close();
    setStrategyBindingTarget(null);
  };

  const confirmStrategyBinding = async () => {
    if (!strategyBindingTarget || !strategyBindingOperator.trim() || bindingStrategyRevision) {
      return;
    }
    const bound = await onBindStrategyToProduction(
      strategyBindingTarget.strategy,
      strategyBindingOperator
    );
    if (!bound) {
      return;
    }
    strategyBindingDialogRef.current?.close();
    setStrategyBindingTarget(null);
    strategyLibraryRef.current?.focus();
  };

  const selectedStrategyAiProvider = providers.find(
    (provider) => provider.providerId === strategyAiProviderId
  ) ?? providers.find((provider) => provider.providerId === "local");
  const strategyAiUsesExternalProvider = strategyAiProviderId !== "local";
  const canGenerateStrategyAiDraft = Boolean(
    !isGeneratingStrategyAiDraft
    && strategyAiGoal.trim().length >= 4
    && selectedStrategyAiProvider?.configured
    && (!strategyAiUsesExternalProvider || strategyAiExternalDataApproved)
  );
  const strategyAiCandidate = strategyAiResult?.candidate ?? null;
  const strategyAiDraftChanges = strategyAiCandidate
    ? strategyAiDraftDiffRows(i18n, draft, strategyAiCandidate.draft)
    : [];
  const canApplyStrategyAiDraft = Boolean(
    strategyAiCandidate
    && strategyAiResult?.generation?.status === "completed"
    && !strategyAiResult.generation.fallbackUsed
    && strategyAiResult.validation?.status !== "blocked"
    && strategyAiResultContextIdentity === strategyAiContextIdentity
    && strategyAiDraftChanges.length > 0
    && strategyAiCandidate.market === workspace.selectedInstrument.market
    && strategyAiCandidate.symbol === workspace.selectedInstrument.symbol
    && strategyAiCandidate.timeframe === workspace.selectedTimeframe
  );

  return (
    <div className="strategy-workbench">
      <div className="strategy-structured-editor">
        <div className="strategy-builder-title">
          <div className="strategy-builder-heading">
            <span>{i18n.t("strategy.builder")}</span>
            <button
              className="strategy-ai-open-button"
              onClick={openStrategyAiDialog}
              ref={strategyAiTriggerRef}
              type="button"
            >
              <BrainCircuit aria-hidden="true" size={14} />
              {i18n.t("strategy.aiAssist")}
            </button>
          </div>
          <strong>{workspace.researchRun ? workspace.researchRun.strategyRevision : i18n.t("strategy.auditRequired")}</strong>
        </div>
        <StrategyTemplatePicker
          activeDraft={draft}
          i18n={i18n}
          onApply={onApplyStrategyTemplate}
          templates={templates}
        />
        <label>
          <span>{i18n.t("strategy.name")}</span>
          <input
            onChange={(event) => onUpdateStrategyRuleDraftField("name", event.currentTarget.value)}
            value={i18n.strategyText(draft.name)}
          />
        </label>
        <div className="strategy-draft-grid">
          <StrategyConditionField
            field="entryKind"
            i18n={i18n}
            kind={draft.entryKind}
            label={i18n.t("strategy.entryCondition")}
            onUpdate={onUpdateStrategyRuleDraftField}
            options={["close_above_sma", "rsi_below"]}
            threshold={draft.entryThreshold}
            thresholdField="entryThreshold"
            window={draft.entryWindow}
            windowField="entryWindow"
          />
          <StrategyConditionField
            field="exitKind"
            i18n={i18n}
            kind={draft.exitKind}
            label={i18n.t("strategy.exitCondition")}
            onUpdate={onUpdateStrategyRuleDraftField}
            options={["close_below_sma", "rsi_above"]}
            threshold={draft.exitThreshold}
            thresholdField="exitThreshold"
            window={draft.exitWindow}
            windowField="exitWindow"
          />
          <StrategyRsiConfirmField
            disabled={draft.entryKind === "rsi_below"}
            field="entryRsiConfirm"
            i18n={i18n}
            isEnabled={draft.entryRsiConfirm}
            label={i18n.t("strategy.rsiConfirm")}
            onUpdate={onUpdateStrategyRuleDraftField}
            threshold={draft.entryRsiThreshold}
            thresholdField="entryRsiThreshold"
            window={draft.entryRsiWindow}
            windowField="entryRsiWindow"
          />
          <StrategyVolumeConfirmField
            field="entryVolumeConfirm"
            i18n={i18n}
            isEnabled={draft.entryVolumeConfirm}
            label={i18n.t("strategy.volumeConfirm")}
            onUpdate={onUpdateStrategyRuleDraftField}
            value={draft.entryVolumeWindow}
            windowField="entryVolumeWindow"
          />
          <StrategyNumberField
            field="positionPct"
            i18n={i18n}
            label={i18n.t("strategy.positionPct")}
            onUpdate={onUpdateStrategyRuleDraftField}
            suffix="%"
            value={draft.positionPct}
          />
          <StrategyNumberField
            field="stopLossPct"
            i18n={i18n}
            label={i18n.t("strategy.stopLossPct")}
            onUpdate={onUpdateStrategyRuleDraftField}
            suffix="%"
            value={draft.stopLossPct}
          />
          <StrategyNumberField
            field="takeProfitPct"
            i18n={i18n}
            label={i18n.t("strategy.takeProfitPct")}
            onUpdate={onUpdateStrategyRuleDraftField}
            suffix="%"
            value={draft.takeProfitPct}
          />
          <StrategyNumberField
            field="maxDrawdownPct"
            i18n={i18n}
            label={i18n.t("strategy.maxDrawdownPct")}
            onUpdate={onUpdateStrategyRuleDraftField}
            suffix="%"
            value={draft.maxDrawdownPct}
          />
        </div>
        <div className="strategy-generated-snapshot">
          <span>{i18n.t("strategy.generatedSnapshot")}</span>
          <strong>{i18n.strategyText(workspace.strategy.entry)}</strong>
          <strong>{i18n.strategyText(workspace.strategy.exit)}</strong>
          <small>{i18n.strategyText(workspace.strategy.risk)}</small>
        </div>
        <div className="strategy-readiness-list">
          <div className="strategy-rule-title">
            <span>{i18n.t("strategy.readiness")}</span>
            <strong>
              {readinessGates.filter((gate) => gate.status === "passed").length}/{readinessGates.length}
              <em className="strategy-validation-source">{strategyValidationSourceLabel(i18n, validationSource)}</em>
            </strong>
          </div>
          {readinessGates.map((gate) => (
            <article className={`strategy-readiness-gate ${gate.tone}`} data-status={gate.status} key={gate.id}>
              <span>
                {strategyReadinessGateLabel(i18n, gate.label)}
                <em>{strategyReadinessGateStatusLabel(i18n, gate.status)}</em>
              </span>
              <strong>{i18n.strategyText(gate.value)}</strong>
              <p>{i18n.strategyText(gate.detail)}</p>
            </article>
          ))}
        </div>
        {showSaveAction ? (
          <div className="strategy-library-actions">
            <button disabled={isSavingStrategy} onClick={onSaveStrategyVersion} type="button">
              <GitBranch size={15} />
              <span>{isSavingStrategy ? i18n.t("strategy.saving") : i18n.t("strategy.saveVersion")}</span>
            </button>
          </div>
        ) : null}
      </div>
      <section
        className={`strategy-production-binding ${strategyProductionBinding.binding?.status ?? "loading"}`}
        aria-labelledby="strategy-production-binding-title"
      >
        <div className="strategy-production-binding-heading">
          <div>
            <span>{i18n.locale === "zh-CN" ? "生产策略交接" : "Production strategy handoff"}</span>
            <strong id="strategy-production-binding-title">
              {strategyProductionBinding.binding?.name
                ?? (i18n.locale === "zh-CN" ? "正在读取自动交易策略" : "Loading automated-trading strategy")}
            </strong>
          </div>
          <em>
            {strategyProductionBinding.binding?.kind === "library"
              ? i18n.locale === "zh-CN" ? "审计策略" : "Audited strategy"
              : i18n.locale === "zh-CN" ? "内置策略" : "Built-in strategy"}
          </em>
        </div>
        {strategyProductionBinding.binding ? (
          <>
            <div className="strategy-production-binding-grid">
              <span>
                <small>{i18n.locale === "zh-CN" ? "运行上下文" : "Runtime context"}</small>
                <strong>
                  {i18n.marketLabel(strategyProductionBinding.binding.market)}
                  {" · "}
                  {strategyProductionBinding.binding.symbol}
                  {" · "}
                  {strategyProductionBinding.binding.timeframe}
                </strong>
              </span>
              <span>
                <small>{i18n.locale === "zh-CN" ? "审计运行" : "Audit run"}</small>
                <strong>{strategyProductionBinding.binding.auditRunId ?? (i18n.locale === "zh-CN" ? "内置规则" : "Built-in rules")}</strong>
              </span>
              <span>
                <small>{i18n.locale === "zh-CN" ? "切换条件" : "Switch condition"}</small>
                <strong>
                  {strategyProductionBinding.binding.switchAllowed
                    ? i18n.locale === "zh-CN" ? "已暂停、空仓且无未决委托" : "Paused, flat, and reconciled"
                    : strategyProductionSwitchReasonLabel(i18n, strategyProductionBinding.binding.switchBlockedReason)}
                </strong>
              </span>
            </div>
            <p>{strategyProductionBinding.binding.detail}</p>
            <div className="strategy-production-binding-footer">
              <small>
                {i18n.locale === "zh-CN"
                  ? "交接只改变自动评估使用的策略；不会自动授权实盘、启动监控或提交订单。运行参数与策略风控冲突时采用更严格限制。"
                  : "Handoff only changes the strategy used by automated evaluation. It does not authorize, start, or submit live orders; the stricter risk limit wins."}
              </small>
              {strategyProductionBinding.binding.kind === "library" ? (
                <button
                  disabled={!strategyProductionBinding.binding.switchAllowed || bindingStrategyRevision !== null}
                  onClick={() => openStrategyBindingDialog(null)}
                  type="button"
                >
                  {bindingStrategyRevision === "builtin"
                    ? i18n.locale === "zh-CN" ? "正在恢复" : "Restoring"
                    : i18n.locale === "zh-CN" ? "恢复内置策略" : "Restore built-in strategy"}
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <p className="strategy-production-binding-error" role="status">
            {strategyProductionBindingErrorLabel(i18n, strategyProductionBinding.error)}
          </p>
        )}
      </section>
      <div className="strategy-rule-board">
        <div className="strategy-rule-title">
          <span>{i18n.t("strategy.rules")}</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="strategy-rule-grid">
          <div className="strategy-rule-row strategy-rule-head">
            <span>{i18n.t("strategy.rules")}</span>
            <span>{i18n.t("strategy.condition")}</span>
            <span>{i18n.t("strategy.parameter")}</span>
            <span>{i18n.t("strategy.status")}</span>
          </div>
          {rows.map((row) => (
            <article className={`strategy-rule-row ${row.tone}`} key={row.id}>
              <span>
                <strong>{strategyRuleGroupLabel(i18n, row.group)}</strong>
                <em>{strategyRuleLabel(i18n, row.label)}</em>
              </span>
              <span>{i18n.strategyText(row.condition)}</span>
              <span>{strategyRuleParameterLabel(i18n, row.parameter)}</span>
              <span>{strategyRuleStatusLabel(i18n, row.status)}</span>
            </article>
          ))}
        </div>
      </div>
      <div className="strategy-governance-queue">
        <div className="strategy-rule-title">
          <span>{i18n.locale === "zh-CN" ? "版本治理队列" : "Version governance"}</span>
          <strong>{strategyGovernanceQueue.summary.totalRows}</strong>
        </div>
        <div className="strategy-governance-summary">
          <span className="positive">
            {i18n.locale === "zh-CN" ? "已审计" : "Audited"} {strategyGovernanceQueue.summary.auditedCount}
          </span>
          <span className="warning">
            {i18n.locale === "zh-CN" ? "需重审" : "Re-audit"}{" "}
            {strategyGovernanceQueue.summary.needsReauditCount + strategyGovernanceQueue.summary.staleCount}
          </span>
          <span>
            {i18n.locale === "zh-CN" ? "跨上下文" : "Imported"} {strategyGovernanceQueue.summary.importedCount}
          </span>
          <span className="risk">
            {i18n.locale === "zh-CN" ? "阻断" : "Blocked"} {strategyGovernanceQueue.summary.blockedCount}
          </span>
        </div>
        <div className="strategy-governance-table">
          <div className="strategy-governance-row strategy-governance-head">
            <span>{i18n.locale === "zh-CN" ? "版本" : "Version"}</span>
            <span>{i18n.locale === "zh-CN" ? "状态" : "State"}</span>
            <span>{i18n.locale === "zh-CN" ? "证据" : "Evidence"}</span>
            <span>{i18n.locale === "zh-CN" ? "动作" : "Action"}</span>
          </div>
          {strategyGovernanceQueue.rows.map((row) => (
            <article className={`strategy-governance-row ${row.tone}`} key={row.id}>
              <span>
                <strong>{i18n.strategyText(row.name)}</strong>
                <em>{row.revision === "current-draft" && i18n.locale === "zh-CN" ? "当前草稿" : row.revision}</em>
                <small>{strategyGovernanceContextLabel(i18n, row)}</small>
              </span>
              <span>
                <strong>{strategyGovernanceStageLabel(i18n, row.stage)}</strong>
                <em>{strategyGovernanceValidationLabel(i18n, row.validationStatus)}</em>
              </span>
              <span>
                <strong>{row.latestAuditRunId ?? row.auditRunId ?? (i18n.locale === "zh-CN" ? "等待审计" : "Audit pending")}</strong>
                <em>{strategyGovernanceDetailLabel(i18n, row)}</em>
                {row.changedFieldCount ? (
                  <small>
                    {i18n.locale === "zh-CN" ? "差异" : "Diff"}:{" "}
                    {row.changedFields
                      .map((field) => strategyGovernanceChangedFieldLabel(i18n, field))
                      .join(i18n.locale === "zh-CN" ? "、" : ", ")}
                  </small>
                ) : null}
              </span>
              <button onClick={() => onRunStrategyGovernanceAction(row)} type="button">
                <Play size={13} />
                <span>{strategyGovernanceActionLabel(i18n, row.nextActionId)}</span>
              </button>
            </article>
          ))}
        </div>
      </div>
      <div className="strategy-library-list" ref={strategyLibraryRef} tabIndex={-1}>
        <div className="strategy-rule-title">
          <span>{i18n.t("strategy.library")}</span>
          <strong>{library.length}</strong>
        </div>
        {library.length ? (
          library.map((item) => {
            const diffRows = buildStrategyVersionDiffRows(workspace, item);
            const changedRows = diffRows.filter((row) => row.changed);
            const isCurrentDraft =
              item.market === workspace.selectedInstrument.market &&
              item.symbol === workspace.selectedInstrument.symbol &&
              item.timeframe === workspace.selectedTimeframe &&
              item.strategySnapshot.name === workspace.strategy.name &&
              item.strategySnapshot.entry === workspace.strategy.entry &&
              item.strategySnapshot.exit === workspace.strategy.exit &&
              item.strategySnapshot.position === workspace.strategy.position &&
              item.strategySnapshot.risk === workspace.strategy.risk;
            const isActiveProductionStrategy =
              strategyProductionBinding.binding?.kind === "library"
              && strategyProductionBinding.binding.revision === item.revision;
            const isProductionCompatible =
              item.status === "audited"
              && Boolean(item.auditRunId)
              && item.market === "crypto"
              && item.symbol === "BTC/USDT"
              && item.timeframe === "1m";
            const productionHandoffDisabled =
              !isProductionCompatible
              || isActiveProductionStrategy
              || strategyProductionBinding.binding?.switchAllowed !== true
              || bindingStrategyRevision !== null;

            return (
              <article className={`strategy-library-card ${item.status}`} key={item.revision}>
                <span>
                  <strong>{i18n.strategyText(item.name)}</strong>
                  <em>{item.revision}</em>
                  <small>
                    {i18n.t("strategy.context")}: {i18n.marketLabel(item.market)} · {item.symbol} · {item.timeframe}
                  </small>
                  <small>
                    {i18n.t("strategy.auditRun")}: {item.auditRunId ?? i18n.t("strategy.auditRequired")}
                  </small>
                  <small>
                    {i18n.t("strategy.diff")}:{" "}
                    {changedRows.length
                      ? i18n.t("strategy.diffChanged", { count: changedRows.length })
                      : i18n.t("strategy.diffSame")}
                  </small>
                  <div className="strategy-library-diff" aria-label={i18n.t("strategy.diff")}>
                    {(changedRows.length ? changedRows.slice(0, 3) : diffRows.slice(0, 2)).map((row) => (
                      <span className={`strategy-diff-chip ${row.tone}`} key={row.id}>
                        {strategyDiffRowLabel(i18n, row)}
                      </span>
                    ))}
                  </div>
                </span>
                <span className={isActiveProductionStrategy ? "strategy-production-active-badge" : undefined}>
                  {isActiveProductionStrategy
                    ? i18n.locale === "zh-CN" ? "当前生产策略" : "Active production strategy"
                    : strategyLibraryStatusLabel(i18n, item.status)}
                </span>
                <div className="strategy-library-card-actions">
                  <button disabled={isCurrentDraft} onClick={() => onLoadStrategyVersion(item)} type="button">
                    {isCurrentDraft ? i18n.t("strategy.loadedVersion") : i18n.t("strategy.loadVersion")}
                  </button>
                  {item.status === "audited" ? (
                    <button
                      className="strategy-production-bind-button"
                      disabled={productionHandoffDisabled}
                      onClick={() => openStrategyBindingDialog(item)}
                      title={
                        !isProductionCompatible
                          ? i18n.locale === "zh-CN"
                            ? "当前生产路由仅支持已审计的 BTC/USDT 一分钟策略"
                            : "The current production route only supports audited BTC/USDT one-minute strategies"
                          : isActiveProductionStrategy
                            ? i18n.locale === "zh-CN" ? "该版本已是当前生产策略" : "This version is already active"
                            : strategyProductionSwitchReasonLabel(
                                i18n,
                                strategyProductionBinding.binding?.switchBlockedReason
                              )
                      }
                      type="button"
                    >
                      {bindingStrategyRevision === item.revision
                        ? i18n.locale === "zh-CN" ? "正在交接" : "Binding"
                        : isActiveProductionStrategy
                          ? i18n.locale === "zh-CN" ? "已交接" : "Bound"
                          : i18n.locale === "zh-CN" ? "交接到自动交易" : "Bind to automated trading"}
                    </button>
                  ) : null}
                  <button
                    aria-label={i18n.t("strategy.deleteVersionLabel", {
                      name: i18n.strategyText(item.name),
                      revision: item.revision
                    })}
                    className="strategy-delete-button"
                    disabled={isActiveProductionStrategy}
                    onClick={() => {
                      setStrategyDeleteFailed(false);
                      setStrategyToDelete(item);
                    }}
                    type="button"
                  >
                    {i18n.t("strategy.deleteVersion")}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <p className="strategy-library-empty">{i18n.t("strategy.libraryEmpty")}</p>
        )}
      </div>
      {strategyBindingTarget ? (
        <dialog
          aria-describedby="strategy-production-dialog-description"
          aria-labelledby="strategy-production-dialog-title"
          aria-modal="true"
          className="research-confirmation-dialog strategy-production-dialog"
          onCancel={(event) => {
            event.preventDefault();
            closeStrategyBindingDialog();
          }}
          ref={strategyBindingDialogRef}
          role="alertdialog"
        >
          <section className="research-confirmation-modal strategy-production-modal">
            <header>
              <div>
                <span className="research-confirmation-kicker">
                  <ShieldCheck aria-hidden="true" size={14} />
                  {i18n.locale === "zh-CN" ? "生产策略交接确认" : "Production strategy handoff"}
                </span>
                <h2 id="strategy-production-dialog-title">
                  {strategyBindingTarget.strategy
                    ? i18n.strategyText(strategyBindingTarget.strategy.name)
                    : i18n.locale === "zh-CN"
                      ? "恢复内置涨跌幅与 AI 自动策略"
                      : "Restore the built-in price-change and AI strategy"}
                </h2>
              </div>
              <button
                aria-label={i18n.locale === "zh-CN" ? "关闭生产策略交接确认" : "Close production strategy handoff"}
                className="panel-icon-button"
                disabled={bindingStrategyRevision !== null}
                onClick={closeStrategyBindingDialog}
                type="button"
              >
                <X size={17} />
              </button>
            </header>
            <p id="strategy-production-dialog-description">
              {i18n.locale === "zh-CN"
                ? "交接会更新后台自动评估所使用的策略，只清除旧判断缓存；资金、成交与当日风控账本保持不变，自动交易继续暂停。"
                : "This updates the strategy used by background evaluation and only clears cached decisions; funds, trades, and daily risk state remain unchanged while automated trading stays paused."}
            </p>
            <div className="strategy-production-dialog-summary">
              <span>
                {i18n.locale === "zh-CN" ? "目标策略" : "Target strategy"}
                <strong>
                  {strategyBindingTarget.strategy?.revision
                    ?? (i18n.locale === "zh-CN" ? "内置策略" : "Built-in strategy")}
                </strong>
              </span>
              <span>
                {i18n.locale === "zh-CN" ? "审计证据" : "Audit evidence"}
                <strong>
                  {strategyBindingTarget.strategy?.auditRunId
                    ?? (i18n.locale === "zh-CN" ? "内置规则" : "Built-in rules")}
                </strong>
              </span>
              <span>
                {i18n.locale === "zh-CN" ? "运行结果" : "Runtime result"}
                <strong>{i18n.locale === "zh-CN" ? "保持暂停、不下单" : "Paused; no order"}</strong>
              </span>
            </div>
            <label className="strategy-production-operator-field" htmlFor="strategy-production-operator">
              <span>{i18n.locale === "zh-CN" ? "实名操作人" : "Named operator"}</span>
              <input
                autoComplete="name"
                disabled={bindingStrategyRevision !== null}
                id="strategy-production-operator"
                maxLength={80}
                onChange={(event) => setStrategyBindingOperator(event.currentTarget.value)}
                ref={strategyBindingOperatorRef}
                value={strategyBindingOperator}
              />
            </label>
            <p className="strategy-production-dialog-warning">
              {i18n.locale === "zh-CN"
                ? "本操作不替代生产授权、账户覆盖检查、急停、幂等与对账。之后仍需前往动态交易页重新检查并人工启动。"
                : "This does not replace production authorization, account coverage, kill switch, idempotency, or reconciliation. Review and start it manually from Dynamic Trading."}
            </p>
            {strategyProductionBinding.error ? (
              <p className="strategy-production-dialog-error" role="alert">
                {strategyProductionBindingErrorLabel(i18n, strategyProductionBinding.error)}
              </p>
            ) : null}
            <footer className="research-confirmation-actions">
              <button
                className="design-secondary-action"
                disabled={bindingStrategyRevision !== null}
                onClick={closeStrategyBindingDialog}
                type="button"
              >
                {i18n.locale === "zh-CN" ? "取消" : "Cancel"}
              </button>
              <button
                className="strategy-production-confirm"
                disabled={!strategyBindingOperator.trim() || bindingStrategyRevision !== null}
                onClick={() => void confirmStrategyBinding()}
                type="button"
              >
                {bindingStrategyRevision
                  ? i18n.locale === "zh-CN" ? "正在交接…" : "Binding…"
                  : i18n.locale === "zh-CN" ? "确认交接并保持暂停" : "Confirm handoff and stay paused"}
              </button>
            </footer>
          </section>
        </dialog>
      ) : null}
      <StrategyAiDraftDialog applyStrategyAiCandidate={applyStrategyAiCandidate} canApplyStrategyAiDraft={canApplyStrategyAiDraft} canGenerateStrategyAiDraft={canGenerateStrategyAiDraft} closeStrategyAiDialog={closeStrategyAiDialog} generateStrategyAiCandidate={generateStrategyAiCandidate} i18n={i18n} isGeneratingStrategyAiDraft={isGeneratingStrategyAiDraft} isStrategyAiDialogOpen={isStrategyAiDialogOpen} providers={providers} selectedStrategyAiProvider={selectedStrategyAiProvider} setStrategyAiError={setStrategyAiError} setStrategyAiExternalDataApproved={setStrategyAiExternalDataApproved} setStrategyAiGoal={setStrategyAiGoal} setStrategyAiProviderId={setStrategyAiProviderId} setStrategyAiResult={setStrategyAiResult} setStrategyAiResultContextIdentity={setStrategyAiResultContextIdentity} strategyAiCandidate={strategyAiCandidate} strategyAiDialogRef={strategyAiDialogRef} strategyAiDraftChanges={strategyAiDraftChanges} strategyAiError={strategyAiError} strategyAiExternalDataApproved={strategyAiExternalDataApproved} strategyAiGoal={strategyAiGoal} strategyAiGoalRef={strategyAiGoalRef} strategyAiProviderId={strategyAiProviderId} strategyAiResult={strategyAiResult} strategyAiUsesExternalProvider={strategyAiUsesExternalProvider} workspace={workspace} />
      {strategyToDelete ? (
        <dialog
          aria-describedby="strategy-delete-detail"
          aria-labelledby="strategy-delete-title"
          aria-modal="true"
          className="research-confirmation-dialog strategy-delete-dialog"
          onCancel={(event) => {
            event.preventDefault();
            closeStrategyDeleteDialog();
          }}
          ref={strategyDeleteDialogRef}
          role="alertdialog"
        >
          <section className="research-confirmation-modal strategy-delete-modal">
            <header>
              <div>
                <span className="research-confirmation-kicker strategy-delete-kicker">
                  {i18n.t("strategy.deleteVersion")}
                </span>
                <h2 id="strategy-delete-title">{i18n.t("strategy.deleteConfirmTitle")}</h2>
              </div>
              <button
                aria-label={i18n.t("strategy.deleteCancel")}
                className="panel-icon-button"
                disabled={Boolean(deletingStrategyRevision)}
                onClick={closeStrategyDeleteDialog}
                type="button"
              >
                <X size={17} />
              </button>
            </header>
            <p id="strategy-delete-detail">{i18n.t("strategy.deleteConfirmDetail")}</p>
            <div className="strategy-delete-summary">
              <strong>{i18n.strategyText(strategyToDelete.name)}</strong>
              <span>{strategyToDelete.revision}</span>
              <small>
                {i18n.marketLabel(strategyToDelete.market)} · {strategyToDelete.symbol} · {strategyToDelete.timeframe}
              </small>
            </div>
            {strategyDeleteFailed ? (
              <p className="strategy-delete-error" role="alert">{i18n.t("strategy.deleteFailed")}</p>
            ) : null}
            <footer className="research-confirmation-actions">
              <button
                className="design-secondary-action"
                disabled={Boolean(deletingStrategyRevision)}
                onClick={closeStrategyDeleteDialog}
                ref={strategyDeleteCancelRef}
                type="button"
              >
                {i18n.t("strategy.deleteCancel")}
              </button>
              <button
                className="strategy-delete-confirm"
                disabled={Boolean(deletingStrategyRevision)}
                onClick={() => void confirmStrategyDelete()}
                type="button"
              >
                {deletingStrategyRevision ? i18n.t("strategy.deletingVersion") : i18n.t("strategy.deleteConfirm")}
              </button>
            </footer>
          </section>
        </dialog>
      ) : null}
    </div>
  );
}
