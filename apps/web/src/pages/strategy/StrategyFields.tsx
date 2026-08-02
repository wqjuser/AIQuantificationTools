import { type AppI18n } from "../../lib/i18n";
import { StrategyConditionKind, StrategyRuleDraft, StrategyRuleDraftField, StrategyTemplateId, StrategyTemplateOption } from "../../lib/terminal-workbench";
import { strategyConditionOptionLabel, strategyDraftHint, strategyTemplateDescription, strategyTemplateName } from "./StrategyFormatters";
import { Check, ChevronDown } from "lucide-react";
import { useRef } from "react";

export function StrategyTemplatePicker({
  activeDraft,
  i18n,
  onApply,
  templates
}: {
  activeDraft: StrategyRuleDraft;
  i18n: AppI18n;
  onApply: (templateId: StrategyTemplateId) => void;
  templates: StrategyTemplateOption[];
}) {
  return (
    <section className="strategy-template-picker" aria-label={i18n.t("strategy.templates")}>
      <div className="strategy-template-title">
        <span>{i18n.t("strategy.templates")}</span>
        <strong>{templates.length}</strong>
      </div>
      <div className="strategy-template-grid">
        {templates.map((template) => {
          const isActive =
            activeDraft.name === template.draft.name &&
            activeDraft.entryKind === template.draft.entryKind &&
            activeDraft.entryWindow === template.draft.entryWindow &&
            activeDraft.entryThreshold === template.draft.entryThreshold &&
            activeDraft.entryRsiConfirm === template.draft.entryRsiConfirm &&
            activeDraft.entryRsiWindow === template.draft.entryRsiWindow &&
            activeDraft.entryRsiThreshold === template.draft.entryRsiThreshold &&
            activeDraft.entryVolumeConfirm === template.draft.entryVolumeConfirm &&
            activeDraft.entryVolumeWindow === template.draft.entryVolumeWindow &&
            activeDraft.exitKind === template.draft.exitKind &&
            activeDraft.exitWindow === template.draft.exitWindow &&
            activeDraft.exitThreshold === template.draft.exitThreshold &&
            activeDraft.positionPct === template.draft.positionPct &&
            activeDraft.stopLossPct === template.draft.stopLossPct &&
            activeDraft.takeProfitPct === template.draft.takeProfitPct &&
            activeDraft.maxDrawdownPct === template.draft.maxDrawdownPct;

          return (
            <button
              className={`strategy-template-card ${isActive ? "active" : ""}`}
              disabled={isActive}
              key={template.id}
              onClick={() => onApply(template.id)}
              type="button"
            >
              <strong>{strategyTemplateName(i18n, template)}</strong>
              <span>{strategyTemplateDescription(i18n, template)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function StrategyConditionField({
  field,
  i18n,
  kind,
  label,
  onUpdate,
  options,
  threshold,
  thresholdField,
  window,
  windowField
}: {
  field: StrategyRuleDraftField;
  i18n: AppI18n;
  kind: StrategyConditionKind;
  label: string;
  onUpdate: (field: StrategyRuleDraftField, value: number | string | boolean) => void;
  options: StrategyConditionKind[];
  threshold: number;
  thresholdField: StrategyRuleDraftField;
  window: number;
  windowField: StrategyRuleDraftField;
}) {
  const isRsi = kind === "rsi_below" || kind === "rsi_above";
  return (
    <div
      className={`strategy-draft-field strategy-condition-field ${isRsi ? "rsi" : "sma"}`}
      data-field={field}
    >
      <span>{label}</span>
      <div className={`strategy-condition-editor ${isRsi ? "rsi" : "sma"}`}>
        <StrategyConditionMenu
          i18n={i18n}
          kind={kind}
          label={label}
          onChange={(option) => onUpdate(field, option)}
          options={options}
        />
        <input
          aria-label={`${label} window`}
          max={250}
          min={1}
          onChange={(event) => onUpdate(windowField, Number(event.currentTarget.value))}
          step={1}
          type="number"
          value={window}
        />
        {isRsi ? (
          <input
            aria-label={`${label} threshold`}
            className="strategy-threshold-field"
            max={100}
            min={0}
            onChange={(event) => onUpdate(thresholdField, Number(event.currentTarget.value))}
            step={1}
            type="number"
            value={threshold}
          />
        ) : (
          <em>{i18n.strategyText("SMA")}</em>
        )}
      </div>
      <small>{strategyDraftHint(i18n, field)}</small>
    </div>
  );
}

export function StrategyConditionMenu({
  i18n,
  kind,
  label,
  onChange,
  options
}: {
  i18n: AppI18n;
  kind: StrategyConditionKind;
  label: string;
  onChange: (option: StrategyConditionKind) => void;
  options: StrategyConditionKind[];
}) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  return (
    <details
      className="strategy-condition-menu"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          menuRef.current?.removeAttribute("open");
        }
      }}
      ref={menuRef}
    >
      <summary
        aria-label={`${label}：${strategyConditionOptionLabel(i18n, kind)}`}
        ref={summaryRef}
      >
        <strong>{strategyConditionOptionLabel(i18n, kind)}</strong>
        <ChevronDown aria-hidden="true" size={15} />
      </summary>
      <div className="strategy-condition-options">
        {options.map((option) => {
          const isActive = option === kind;
          return (
            <button
              aria-pressed={isActive}
              className={isActive ? "active" : ""}
              key={option}
              onClick={() => {
                onChange(option);
                menuRef.current?.removeAttribute("open");
                summaryRef.current?.focus();
              }}
              type="button"
            >
              <span aria-hidden="true">{isActive ? <Check size={14} /> : null}</span>
              <strong>{strategyConditionOptionLabel(i18n, option)}</strong>
            </button>
          );
        })}
      </div>
    </details>
  );
}

export function StrategyVolumeConfirmField({
  field,
  i18n,
  isEnabled,
  label,
  onUpdate,
  value,
  windowField
}: {
  field: StrategyRuleDraftField;
  i18n: AppI18n;
  isEnabled: boolean;
  label: string;
  onUpdate: (field: StrategyRuleDraftField, value: number | string | boolean) => void;
  value: number;
  windowField: StrategyRuleDraftField;
}) {
  return (
    <label className={`strategy-draft-field strategy-volume-field ${isEnabled ? "enabled" : "disabled"}`}>
      <span>{label}</span>
      <div className="strategy-volume-toggle">
        <input
          aria-label={label}
          checked={isEnabled}
          onChange={(event) => onUpdate(field, event.currentTarget.checked)}
          type="checkbox"
        />
        <span className="strategy-inline-number">
          <small>{i18n.t("strategy.volumeWindow")}</small>
          <input
            aria-label={`${label} ${i18n.t("strategy.volumeWindow")}`}
            disabled={!isEnabled}
            max={250}
            min={1}
            onChange={(event) => onUpdate(windowField, Number(event.currentTarget.value))}
            step={1}
            type="number"
            value={value}
          />
        </span>
        <em>{i18n.strategyText("VOL")}</em>
      </div>
      <small>{strategyDraftHint(i18n, field)}</small>
    </label>
  );
}

export function StrategyRsiConfirmField({
  disabled,
  field,
  i18n,
  isEnabled,
  label,
  onUpdate,
  threshold,
  thresholdField,
  window,
  windowField
}: {
  disabled: boolean;
  field: StrategyRuleDraftField;
  i18n: AppI18n;
  isEnabled: boolean;
  label: string;
  onUpdate: (field: StrategyRuleDraftField, value: number | string | boolean) => void;
  threshold: number;
  thresholdField: StrategyRuleDraftField;
  window: number;
  windowField: StrategyRuleDraftField;
}) {
  return (
    <label className={`strategy-draft-field strategy-rsi-field ${isEnabled && !disabled ? "enabled" : "disabled"}`}>
      <span>{label}</span>
      <div className="strategy-rsi-toggle">
        <input
          aria-label={label}
          checked={isEnabled}
          disabled={disabled}
          onChange={(event) => onUpdate(field, event.currentTarget.checked)}
          type="checkbox"
        />
        <span className="strategy-inline-number">
          <small>{i18n.t("strategy.rsiWindow")}</small>
          <input
            aria-label={`${label} ${i18n.t("strategy.rsiWindow")}`}
            disabled={disabled || !isEnabled}
            max={250}
            min={1}
            onChange={(event) => onUpdate(windowField, Number(event.currentTarget.value))}
            step={1}
            type="number"
            value={window}
          />
        </span>
        <span className="strategy-inline-number">
          <small>{i18n.t("strategy.rsiThreshold")}</small>
          <input
            aria-label={`${label} ${i18n.t("strategy.rsiThreshold")}`}
            disabled={disabled || !isEnabled}
            max={100}
            min={0}
            onChange={(event) => onUpdate(thresholdField, Number(event.currentTarget.value))}
            step={1}
            type="number"
            value={threshold}
          />
        </span>
        <em>{i18n.strategyText("RSI")}</em>
      </div>
      <small>{strategyDraftHint(i18n, field)}</small>
    </label>
  );
}

export function StrategyNumberField({
  field,
  i18n,
  label,
  onUpdate,
  suffix,
  value
}: {
  field: StrategyRuleDraftField;
  i18n: AppI18n;
  label: string;
  onUpdate: (field: StrategyRuleDraftField, value: number | string | boolean) => void;
  suffix: string;
  value: number;
}) {
  return (
    <label className="strategy-draft-field" data-field={field}>
      <span>{label}</span>
      <div>
        <input
          min={field === "entryWindow" || field === "exitWindow" ? 1 : 0}
          max={field === "entryWindow" || field === "exitWindow" ? 250 : 100}
          onChange={(event) => onUpdate(field, Number(event.currentTarget.value))}
          step={1}
          type="number"
          value={value}
        />
        <em>{suffix}</em>
      </div>
      <small>{strategyDraftHint(i18n, field)}</small>
    </label>
  );
}
