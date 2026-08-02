import { type AiReviewProviderId } from "../../lib/ai-review-stage3";
import { type AppI18n } from "../../lib/i18n";
import { StrategyLibraryItem, WorkspaceLoadResult } from "../../lib/terminal-api";
import { ScannerCandidate, StrategyConditionKind, StrategyExperimentErrorCode, StrategyExperimentListItem, StrategyGovernanceQueueRow, StrategyReadinessGate, StrategyRuleDraft, StrategyRuleDraftField, StrategyRuleRow, StrategyTemplateOption, StrategyVersionDiffRow, TerminalWorkspace } from "../../lib/terminal-workbench";

export function strategyAiProviderLabel(i18n: AppI18n, providerId: AiReviewProviderId): string {
  if (providerId === "local") {
    return i18n.locale === "zh-CN" ? "本地安全基线" : "Local safety baseline";
  }
  if (providerId === "openai-compatible") {
    return "OpenAI Compatible";
  }
  if (providerId === "ollama") {
    return "Ollama";
  }
  return "OpenAI";
}

export function strategyAiDraftContextIdentity(
  workspace: TerminalWorkspace,
  draft: StrategyRuleDraft
): string {
  return JSON.stringify({
    market: workspace.selectedInstrument.market,
    symbol: workspace.selectedInstrument.symbol,
    timeframe: workspace.selectedTimeframe,
    draft: {
      name: draft.name,
      entryKind: draft.entryKind,
      entryWindow: draft.entryWindow,
      entryThreshold: draft.entryThreshold,
      entryRsiConfirm: draft.entryRsiConfirm,
      entryRsiWindow: draft.entryRsiWindow,
      entryRsiThreshold: draft.entryRsiThreshold,
      entryVolumeConfirm: draft.entryVolumeConfirm,
      entryVolumeWindow: draft.entryVolumeWindow,
      exitKind: draft.exitKind,
      exitWindow: draft.exitWindow,
      exitThreshold: draft.exitThreshold,
      positionPct: draft.positionPct,
      stopLossPct: draft.stopLossPct,
      takeProfitPct: draft.takeProfitPct,
      maxDrawdownPct: draft.maxDrawdownPct,
      paperOnly: draft.paperOnly
    }
  });
}

export function strategyAiConditionSummary(
  i18n: AppI18n,
  kind: StrategyConditionKind,
  window: number,
  threshold: number
): string {
  const label = strategyConditionOptionLabel(i18n, kind);
  return kind === "rsi_below" || kind === "rsi_above"
    ? `${label} · ${i18n.t("strategy.rsiWindow")} ${window} · ${i18n.t("strategy.rsiThreshold")} ${threshold}`
    : `${label} · ${i18n.t("strategy.rsiWindow")} ${window} · ${i18n.t("strategy.aiRetainedParameter")} ${i18n.t("strategy.rsiThreshold")} ${threshold}`;
}

export function strategyAiConfirmationSummary(
  i18n: AppI18n,
  enabled: boolean,
  indicator: "rsi" | "volume",
  window: number,
  threshold?: number
): string {
  const parameters = indicator === "rsi"
    ? `${i18n.t("strategy.rsiWindow")} ${window} · ${i18n.t("strategy.rsiThreshold")} ${threshold ?? 0}`
    : `${i18n.t("strategy.volumeWindow")} ${window}`;
  return enabled
    ? `${i18n.t("strategy.aiEnabled")} · ${parameters}`
    : `${i18n.t("strategy.aiDisabled")} · ${i18n.t("strategy.aiRetainedParameter")} ${parameters}`;
}

export interface StrategyAiDraftDiffRow {
  id: string;
  label: string;
  currentValue: string;
  candidateValue: string;
}

export function strategyAiDraftDiffRows(
  i18n: AppI18n,
  current: StrategyRuleDraft,
  candidate: StrategyRuleDraft
): StrategyAiDraftDiffRow[] {
  const percent = (value: number) => `${value}%`;
  return [
    {
      id: "name",
      label: i18n.t("strategy.name"),
      currentValue: current.name,
      candidateValue: candidate.name
    },
    {
      id: "entry",
      label: i18n.t("strategy.entryCondition"),
      currentValue: strategyAiConditionSummary(i18n, current.entryKind, current.entryWindow, current.entryThreshold),
      candidateValue: strategyAiConditionSummary(i18n, candidate.entryKind, candidate.entryWindow, candidate.entryThreshold)
    },
    {
      id: "entry-rsi-confirm",
      label: i18n.t("strategy.rsiConfirm"),
      currentValue: strategyAiConfirmationSummary(
        i18n,
        current.entryRsiConfirm,
        "rsi",
        current.entryRsiWindow,
        current.entryRsiThreshold
      ),
      candidateValue: strategyAiConfirmationSummary(
        i18n,
        candidate.entryRsiConfirm,
        "rsi",
        candidate.entryRsiWindow,
        candidate.entryRsiThreshold
      )
    },
    {
      id: "entry-volume-confirm",
      label: i18n.t("strategy.volumeConfirm"),
      currentValue: strategyAiConfirmationSummary(
        i18n,
        current.entryVolumeConfirm,
        "volume",
        current.entryVolumeWindow
      ),
      candidateValue: strategyAiConfirmationSummary(
        i18n,
        candidate.entryVolumeConfirm,
        "volume",
        candidate.entryVolumeWindow
      )
    },
    {
      id: "exit",
      label: i18n.t("strategy.exitCondition"),
      currentValue: strategyAiConditionSummary(i18n, current.exitKind, current.exitWindow, current.exitThreshold),
      candidateValue: strategyAiConditionSummary(i18n, candidate.exitKind, candidate.exitWindow, candidate.exitThreshold)
    },
    {
      id: "position",
      label: i18n.t("strategy.positionPct"),
      currentValue: percent(current.positionPct),
      candidateValue: percent(candidate.positionPct)
    },
    {
      id: "stop-loss",
      label: i18n.t("strategy.stopLossPct"),
      currentValue: percent(current.stopLossPct),
      candidateValue: percent(candidate.stopLossPct)
    },
    {
      id: "take-profit",
      label: i18n.t("strategy.takeProfitPct"),
      currentValue: percent(current.takeProfitPct),
      candidateValue: percent(candidate.takeProfitPct)
    },
    {
      id: "max-drawdown",
      label: i18n.t("strategy.maxDrawdownPct"),
      currentValue: percent(current.maxDrawdownPct),
      candidateValue: percent(candidate.maxDrawdownPct)
    },
    {
      id: "execution-mode",
      label: i18n.t("strategy.aiExecutionMode"),
      currentValue: current.paperOnly ? i18n.t("strategy.aiPaperOnly") : i18n.t("strategy.aiNonPaperBlocked"),
      candidateValue: candidate.paperOnly ? i18n.t("strategy.aiPaperOnly") : i18n.t("strategy.aiNonPaperBlocked")
    }
  ].filter((row) => row.currentValue !== row.candidateValue);
}

export function riskLabel(i18n: AppI18n, risk: ScannerCandidate["risk"]): string {
  if (i18n.locale === "en-US") {
    return risk;
  }
  return { low: "低", medium: "中", high: "高" }[risk];
}

export function strategyRuleGroupLabel(i18n: AppI18n, group: StrategyRuleRow["group"]): string {
  if (i18n.locale === "en-US") {
    return group;
  }
  return { entry: "入场", exit: "出场", position: "仓位", risk: "风控" }[group];
}

export function strategyRuleLabel(i18n: AppI18n, label: StrategyRuleRow["label"]): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return {
    "Entry signal": "入场信号",
    "Exit signal": "出场信号",
    "Position sizing": "仓位规则",
    "Risk guardrail": "风险闸门"
  }[label] ?? label;
}

export function strategyRuleParameterLabel(i18n: AppI18n, parameter: string): string {
  if (i18n.locale === "en-US") {
    return parameter;
  }
  const exposureCap = parameter.match(/^(\d+(?:\.\d+)?)% exposure cap$/);
  if (exposureCap) {
    return `${exposureCap[1]}% 暴露上限`;
  }
  const translated = parameter
    .replace("SMA20 / relative strength", "20 周期简单移动平均线 / 相对强度")
    .replace("Trend support / risk downgrade", "趋势支撑 / 风险下调")
    .replace("Exposure cap / paper sizing", "暴露上限 / 模拟定仓")
    .replace("Stop / drawdown / execution mode", "止损 / 回撤 / 执行模式")
    .replace("Stop / take profit / drawdown / execution mode", "止损 / 止盈 / 回撤 / 执行模式");
  return i18n.strategyText(translated);
}

export function strategyRuleStatusLabel(i18n: AppI18n, status: StrategyRuleRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { active: "启用", pending: "待生成", guardrail: "保护" }[status];
}

export function strategyConditionOptionLabel(i18n: AppI18n, kind: StrategyConditionKind): string {
  const key = {
    close_above_sma: "strategy.condition.closeAboveSma",
    close_below_sma: "strategy.condition.closeBelowSma",
    rsi_below: "strategy.condition.rsiBelow",
    rsi_above: "strategy.condition.rsiAbove"
  }[kind] as Parameters<AppI18n["t"]>[0];
  return i18n.t(key);
}

export function strategyTemplateName(i18n: AppI18n, template: StrategyTemplateOption): string {
  const key = {
    sma_trend: "strategy.template.smaTrend",
    rsi_reversal: "strategy.template.rsiReversal",
    volume_breakout: "strategy.template.volumeBreakout"
  }[template.id] as Parameters<AppI18n["t"]>[0];
  return i18n.t(key);
}

export function strategyTemplateDescription(i18n: AppI18n, template: StrategyTemplateOption): string {
  const key = {
    sma_trend: "strategy.template.smaTrend.description",
    rsi_reversal: "strategy.template.rsiReversal.description",
    volume_breakout: "strategy.template.volumeBreakout.description"
  }[template.id] as Parameters<AppI18n["t"]>[0];
  return i18n.t(key);
}

export function strategyReadinessGateLabel(i18n: AppI18n, label: StrategyReadinessGate["label"]): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return {
    "Strategy schema": "策略结构",
    "Risk controls": "风控参数",
    "Execution mode": "执行模式",
    "Audit evidence": "审计证据"
  }[label];
}

export function strategyReadinessGateStatusLabel(i18n: AppI18n, status: StrategyReadinessGate["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { passed: "通过", review: "待复核", blocked: "阻断" }[status];
}

export function strategyValidationSourceLabel(i18n: AppI18n, source: WorkspaceLoadResult["source"]): string {
  if (i18n.locale === "en-US") {
    return source === "core" ? "core validation" : "local fallback";
  }
  return source === "core" ? "核心校验" : "本地兜底";
}

export function strategyGovernanceStageLabel(i18n: AppI18n, stage: StrategyGovernanceQueueRow["stage"]): string {
  if (i18n.locale === "en-US") {
    return {
      current_draft: "Current draft",
      blocked: "Blocked",
      needs_reaudit: "Needs re-audit",
      stale: "Stale",
      audited: "Audited",
      imported: "Cross-context"
    }[stage];
  }
  return {
    current_draft: "当前草稿",
    blocked: "已阻断",
    needs_reaudit: "需重审",
    stale: "上下文过期",
    audited: "已审计",
    imported: "跨上下文"
  }[stage];
}

export function strategyGovernanceValidationLabel(
  i18n: AppI18n,
  status: StrategyGovernanceQueueRow["validationStatus"]
): string {
  if (i18n.locale === "en-US") {
    return { ready: "schema ready", review: "review", blocked: "schema blocked" }[status];
  }
  return { ready: "结构就绪", review: "待复核", blocked: "结构阻断" }[status];
}

export function strategyGovernanceActionLabel(
  i18n: AppI18n,
  actionId: StrategyGovernanceQueueRow["nextActionId"]
): string {
  if (i18n.locale === "en-US") {
    return {
      "save-current-version": "Save",
      "load-version": "Load",
      "load-and-rerun": "Load + audit"
    }[actionId];
  }
  return {
    "save-current-version": "保存",
    "load-version": "加载",
    "load-and-rerun": "加载并审计"
  }[actionId];
}

export function strategyGovernanceChangedFieldLabel(
  i18n: AppI18n,
  field: StrategyVersionDiffRow["id"]
): string {
  if (i18n.locale === "en-US") {
    return field;
  }
  return {
    context: "上下文",
    name: "名称",
    entry: "入场",
    exit: "出场",
    position: "仓位",
    risk: "风控"
  }[field];
}

export function strategyGovernanceContextLabel(i18n: AppI18n, row: StrategyGovernanceQueueRow): string {
  return `${i18n.marketLabel(row.market)} · ${row.symbol} · ${row.timeframe}`;
}

export function strategyGovernanceValidationDetailLabel(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail
    .split(" · ")
    .map((part) => {
      const match = part.match(/^(Strategy schema|Risk controls|Execution mode|Audit evidence): (.+)$/);
      if (!match) {
        return i18n.strategyText(part);
      }
      return `${strategyReadinessGateLabel(
        i18n,
        match[1] as StrategyReadinessGate["label"]
      )}：${i18n.strategyText(match[2])}`;
    })
    .join("；");
}

export function strategyGovernanceDetailLabel(i18n: AppI18n, row: StrategyGovernanceQueueRow): string {
  if (i18n.locale === "en-US") {
    return row.detail;
  }
  const changedFields = row.changedFields
    .map((field) => strategyGovernanceChangedFieldLabel(i18n, field))
    .join("、");
  if (row.stage === "current_draft") {
    if (row.latestAuditRunId) {
      return `当前草稿已绑定审计运行 ${row.latestAuditRunId}。`;
    }
    return row.validationStatus === "ready"
      ? "策略结构、风控参数和仅模拟盘执行模式已就绪。"
      : strategyGovernanceValidationDetailLabel(i18n, row.detail);
  }
  if (row.stage === "blocked") {
    return strategyGovernanceValidationDetailLabel(i18n, row.detail);
  }
  if (row.stage === "imported") {
    return `保存于 ${strategyGovernanceContextLabel(i18n, row)}；请先载入为跨上下文草稿，再在当前工作区审计。`;
  }
  if (row.stage === "stale") {
    return `当前上下文的${changedFields}已变更；请载入此版本并重新运行审计。`;
  }
  if (row.stage === "audited") {
    return `该已审计版本由 ${row.latestAuditRunId ?? row.auditRunId ?? "对应审计运行"} 提供证据。`;
  }
  return "已保存草稿结构有效，但当前没有审计证据；请载入后重新运行流水线。";
}

export function strategyDiffRowLabel(i18n: AppI18n, row: StrategyVersionDiffRow): string {
  const labels: Record<StrategyVersionDiffRow["id"], string> = {
    context: i18n.t("strategy.context"),
    name: i18n.t("strategy.name"),
    entry: i18n.t("strategy.entry"),
    exit: i18n.t("strategy.exit"),
    position: i18n.t("strategy.position"),
    risk: i18n.t("strategy.risk")
  };
  if (!row.changed) {
    return i18n.locale === "zh-CN" ? `${labels[row.id]}一致` : `${labels[row.id]} same`;
  }
  return i18n.locale === "zh-CN" ? `${labels[row.id]}不同` : `${labels[row.id]} changed`;
}

export function strategyLibraryStatusLabel(i18n: AppI18n, status: StrategyLibraryItem["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { draft: "草稿", audited: "已审计" }[status];
}

export function strategyProductionSwitchReasonLabel(i18n: AppI18n, reason?: string | null): string {
  const labels: Record<string, { zh: string; en: string }> = {
    strategy_switch_requires_paused_monitoring: {
      zh: "请先在动态交易页暂停自动监控",
      en: "Pause automated monitoring first"
    },
    strategy_switch_requires_flat_position: {
      zh: "请先完成持仓退出与账户对账",
      en: "Exit the position and reconcile the account first"
    },
    strategy_switch_requires_reconciled_orders: {
      zh: "请先完成未决委托对账",
      en: "Reconcile pending orders first"
    }
  };
  if (!reason) {
    return i18n.locale === "zh-CN" ? "可安全切换" : "Safe to switch";
  }
  const label = labels[reason];
  return label
    ? i18n.locale === "zh-CN" ? label.zh : label.en
    : reason;
}

export function strategyProductionBindingErrorLabel(i18n: AppI18n, error?: string): string {
  if (!error) {
    return i18n.locale === "zh-CN" ? "正在读取生产策略状态。" : "Loading production strategy state.";
  }
  const labels: Record<string, { zh: string; en: string }> = {
    strategy_binding_audit_required: {
      zh: "该策略尚未绑定完整审计运行，不能交接到自动交易。",
      en: "This strategy has no complete audited run and cannot be bound."
    },
    strategy_binding_audit_run_required: {
      zh: "请选择有效的审计运行后再执行生产预检。",
      en: "Select a valid audited run before production preflight."
    },
    strategy_binding_strategy_not_found: {
      zh: "审计运行对应的策略版本不在策略库中，请重新保存并审计。",
      en: "The audited strategy version is missing from the strategy library."
    },
    strategy_binding_store_unavailable: {
      zh: "生产策略审计存储暂不可用，请稍后重试。",
      en: "The production strategy audit store is unavailable."
    },
    strategy_binding_context_unsupported: {
      zh: "当前生产路由仅支持 BTC/USDT 一分钟策略。",
      en: "The current production route only supports BTC/USDT one-minute strategies."
    },
    strategy_binding_drawdown_limit_exceeded: {
      zh: "审计回测的最大回撤超过策略设定上限。",
      en: "The audited backtest drawdown exceeds the strategy limit."
    },
    strategy_binding_audit_snapshot_mismatch: {
      zh: "审计运行的数据快照校验失败，请重新运行研究与回测。",
      en: "The audited data snapshot failed verification; rerun research and backtesting."
    },
    strategy_binding_audit_run_not_found: {
      zh: "未找到该策略绑定的审计运行。",
      en: "The audited run for this strategy binding was not found."
    },
    strategy_binding_audit_run_changed: {
      zh: "策略库指向的审计运行已改变，请暂停并重新交接。",
      en: "The strategy library now points to a different audited run; pause and bind it again."
    },
    strategy_binding_audit_identity_missing: {
      zh: "当前生产策略缺少固定的审计身份，请暂停并重新交接。",
      en: "The active production strategy lacks a pinned audit identity; pause and bind it again."
    },
    strategy_binding_audit_evidence_changed: {
      zh: "绑定后的审计证据已发生变化，请重新运行审计并交接。",
      en: "The bound audit evidence changed; rerun the audit and bind it again."
    },
    strategy_binding_audit_data_incomplete: {
      zh: "审计运行缺少完整行情快照，不能用于生产策略。",
      en: "The audited run lacks a complete market snapshot and cannot be used in production."
    },
    strategy_binding_audit_execution_mode_invalid: {
      zh: "该运行不是隔离的审计回测证据，不能进入生产资格复核。",
      en: "This run is not isolated audited backtest evidence and cannot enter production qualification."
    },
    strategy_binding_audit_context_mismatch: {
      zh: "审计运行与策略市场、标的或周期不一致。",
      en: "The audited run does not match the strategy market, symbol, or timeframe."
    },
    strategy_binding_audit_strategy_missing: {
      zh: "审计运行缺少完整策略快照，请重新运行研究与回测。",
      en: "The audited run lacks a complete strategy snapshot."
    },
    strategy_binding_audit_revision_mismatch: {
      zh: "审计运行中的策略版本与策略库不一致。",
      en: "The audited strategy revision does not match the strategy library."
    },
    strategy_binding_audit_metrics_invalid: {
      zh: "审计回测指标不完整，无法执行生产资格复核。",
      en: "The audited backtest metrics are incomplete."
    },
    strategy_binding_backtest_assumptions_invalid: {
      zh: "审计回测缺少有效的手续费、滑点或资金假设。",
      en: "The audited backtest lacks valid fee, slippage, or capital assumptions."
    },
    strategy_binding_backtest_replay_mismatch: {
      zh: "审计回测无法按原始证据复现，请重新运行研究与回测。",
      en: "The audited backtest cannot be reproduced from its evidence; rerun research and backtesting."
    },
    strategy_binding_backtest_has_no_completed_trade: {
      zh: "审计回测没有完成的买卖闭环，不能交接到自动交易。",
      en: "The audited backtest has no completed trade cycle and cannot be bound."
    },
    strategy_binding_context_mismatch: {
      zh: "策略记录与规范策略上下文不一致。",
      en: "The strategy record and canonical strategy context do not match."
    },
    strategy_binding_revision_mismatch: {
      zh: "策略版本校验失败，请重新保存并审计。",
      en: "The strategy revision failed verification; save and audit it again."
    },
    strategy_binding_audit_strategy_mismatch: {
      zh: "策略库内容与审计运行中的完整策略不一致。",
      en: "The strategy library content does not match the complete strategy in the audited run."
    },
    strategy_binding_risk_invalid: {
      zh: "策略风控参数不完整或超出生产允许范围。",
      en: "The strategy risk settings are incomplete or outside production limits."
    },
    strategy_binding_operator_required: {
      zh: "请输入有效的实名操作人。",
      en: "Enter a valid named operator."
    },
    strategy_binding_audit_run_mismatch: {
      zh: "所选审计运行与策略版本不匹配。",
      en: "The selected audited run does not match the strategy revision."
    }
  };
  const label = labels[error];
  return label
    ? i18n.locale === "zh-CN" ? label.zh : label.en
    : strategyProductionSwitchReasonLabel(i18n, error);
}

export function strategyDraftHint(i18n: AppI18n, field: StrategyRuleDraftField): string {
  if (i18n.locale === "en-US") {
    return {
      name: "Strategy version name",
      entryKind: "Entry condition type",
      entryWindow: "Entry: close above SMA",
      entryThreshold: "RSI entry threshold",
      entryRsiConfirm: "Optional RSI momentum gate",
      entryRsiWindow: "RSI confirmation window",
      entryRsiThreshold: "RSI must be above this value",
      entryVolumeConfirm: "Optional volume gate",
      entryVolumeWindow: "Volume moving average window",
      exitKind: "Exit condition type",
      exitWindow: "Exit: close below SMA",
      exitThreshold: "RSI exit threshold",
      positionPct: "Capital cap per run",
      stopLossPct: "Trade-level stop",
      takeProfitPct: "Trade-level target",
      maxDrawdownPct: "Backtest drawdown guard"
    }[field];
  }
  return {
    name: "策略版本名称",
    entryKind: "入场条件类型",
    entryWindow: "入场：收盘价上穿简单移动平均线",
    entryThreshold: "相对强弱指标入场阈值",
    entryRsiConfirm: "可选相对强弱指标动量闸门",
    entryRsiWindow: "相对强弱指标确认窗口",
    entryRsiThreshold: "相对强弱指标需要高于该值",
    entryVolumeConfirm: "可选成交量闸门",
    entryVolumeWindow: "成交量均线窗口",
    exitKind: "出场条件类型",
    exitWindow: "出场：收盘价跌破简单移动平均线",
    exitThreshold: "相对强弱指标出场阈值",
    positionPct: "单次资金上限",
    stopLossPct: "单笔止损",
    takeProfitPct: "单笔止盈",
    maxDrawdownPct: "回测回撤保护"
  }[field];
}

export function strategyExperimentErrorMessage(
  i18n: AppI18n,
  errorCode?: StrategyExperimentErrorCode,
  detail?: string
): string {
  const message = errorCode === "source_snapshot_reaudit_required"
    ? i18n.t("strategyExperiment.legacyReaudit")
    : errorCode === "test_holdout_consumed"
      ? i18n.t("strategyExperiment.holdoutConsumed")
      : errorCode === "strategy_experiment_conflict" ||
          errorCode === "strategy_not_found" ||
          errorCode === "research_run_not_found" ||
          errorCode === "strategy_experiment_not_found"
        ? i18n.t("strategyExperiment.persistedEvidenceRequired")
        : detail ?? i18n.t("strategyExperiment.persistedEvidenceRequired");
  return detail && detail !== errorCode && detail !== message ? `${message} ${detail}` : message;
}

export function strategyExperimentMatchesSourceKey(
  experiment: Pick<StrategyExperimentListItem, "sourceRunId" | "strategyRevision">,
  sourceKey: string
): boolean {
  return `${experiment.sourceRunId}:${experiment.strategyRevision}` === sourceKey;
}

export function strategyExperimentActionErrorMessage(
  i18n: AppI18n,
  key: "strategyExperiment.exportFailed" | "strategyExperiment.candidateLoadFailed",
  error: unknown
): string {
  const message = i18n.t(key);
  return error instanceof Error && error.message ? `${message} ${error.message}` : message;
}
