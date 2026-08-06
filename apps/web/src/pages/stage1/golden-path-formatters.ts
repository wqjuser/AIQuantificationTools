import { type AppI18n } from "../../lib/i18n";
import { GoldenPathStatus } from "../../lib/terminal-api";
import { GoldenPathRunbookPreviewItem, GoldenPathWorkspaceContext, P0PlatformBacklogItem, ResearchPipelinePreflight } from "../../lib/terminal-workbench";
import { goldenPathActionPreflightHint } from "../research/ResearchPipelineFormatters";
import { goldenPathStatusLabel } from "./platform-overview-formatters";

export function p0PlatformBacklogPriorityLabel(i18n: AppI18n, item: P0PlatformBacklogItem): string {
  if (i18n.locale === "en-US") {
    if (item.priority === "current") {
      return "Current";
    }
    return item.priority === "blocked" ? "Blocked" : "Review";
  }
  if (item.priority === "current") {
    return "当前";
  }
  return item.priority === "blocked" ? "阻断" : "复核";
}

export function p0PlatformBacklogDetail(i18n: AppI18n, item: P0PlatformBacklogItem): string {
  const action = item.actionLabel
    ? goldenPathRunbookActionLabel(i18n, {
        actionLabel: item.actionLabel,
        current: item.priority === "current",
        detail: item.detail,
        label: item.label,
        status: item.status,
        stepId: item.stepId,
        workspaceId: item.workspaceId
      })
    : "";
  const detail = translateGoldenPathDetail(i18n, item.detail);
  return action ? `${action} · ${detail}` : detail;
}

export function p0PlatformBacklogActionButtonLabel(i18n: AppI18n, item: P0PlatformBacklogItem): string {
  if (!item.actionLabel) {
    return i18n.locale === "zh-CN" ? "查看" : "View";
  }
  return goldenPathRunbookActionLabel(i18n, {
    actionLabel: item.actionLabel,
    current: item.priority === "current",
    detail: item.detail,
    label: item.label,
    status: item.status,
    stepId: item.stepId,
    workspaceId: item.workspaceId
  });
}

export function p0PlatformBacklogActionHint(
  i18n: AppI18n,
  item: P0PlatformBacklogItem,
  isActionDisabled: boolean,
  preflight: ResearchPipelinePreflight
): string | null {
  const preflightHint = goldenPathActionPreflightHint(i18n, item.actionId, preflight);
  if (preflightHint) {
    return preflightHint;
  }
  if (!isActionDisabled) {
    return null;
  }
  if (!item.actionId) {
    return i18n.locale === "zh-CN" ? "该缺口目前只能先进入工作区复核。" : "Open the workspace to review this gap first.";
  }
  if (item.actionId === "submit-paper-order") {
    return i18n.locale === "zh-CN"
      ? "需要匹配当前上下文的审计运行、AI 证据和模拟执行闸门。"
      : "Requires a matching audited run, AI evidence, and paper execution gates.";
  }
  if (item.actionId === "refresh-data" || item.actionId === "refresh-watchlist-cache") {
    return i18n.locale === "zh-CN" ? "行情缓存刷新正在占用数据通道。" : "Market cache refresh is already using the data lane.";
  }
  return i18n.locale === "zh-CN" ? "等待当前任务完成后再执行。" : "Wait for the current task to finish before running this action.";
}

export function goldenPathRunbookActionHint(
  i18n: AppI18n,
  item: GoldenPathStatus["runbook"][number],
  isActionDisabled: boolean,
  preflight: ResearchPipelinePreflight
): string | null {
  const preflightHint = goldenPathActionPreflightHint(i18n, item.actionId, preflight);
  if (preflightHint) {
    return preflightHint;
  }
  if (!isActionDisabled || item.passed || !item.actionId) {
    return null;
  }
  if (item.actionId === "submit-paper-order") {
    return i18n.locale === "zh-CN"
      ? "需要匹配当前上下文的审计运行、AI 证据和模拟执行闸门。"
      : "Requires a matching audited run, AI evidence, and paper execution gates.";
  }
  if (item.actionId === "refresh-data" || item.actionId === "refresh-watchlist-cache") {
    return i18n.locale === "zh-CN" ? "行情缓存刷新正在占用数据通道。" : "Market cache refresh is already using the data lane.";
  }
  return i18n.locale === "zh-CN" ? "等待当前任务完成后再执行。" : "Wait for the current task to finish before running this action.";
}

export function goldenPathStepLabel(i18n: AppI18n, stepId: string, fallback: string): string {
  if (i18n.locale === "en-US") {
    return fallback;
  }
  return (
    {
      "market-data": "行情数据",
      "research-run": "审计研究",
      "backtest-report": "回测证据",
      "ai-review": "AI 评审",
      "paper-execution": "模拟执行",
      "live-gate": "实盘闸门"
    }[stepId] ?? fallback
  );
}

export function goldenPathActionLabel(i18n: AppI18n, action: NonNullable<GoldenPathStatus["nextAction"]>): string {
  if (i18n.locale === "en-US") {
    return action.label;
  }
  return (
    {
      "refresh-data": "刷新行情",
      "refresh-watchlist-cache": "刷新自选缓存",
      "run-pipeline": "运行流水线",
      "run-ai-review": "运行 AI 评审",
      "fix-paper-handoff": "修复执行交接",
      "submit-paper-order": "提交模拟委托",
      "certify-live-adapter": "确认实盘操作"
    }[action.id] ?? action.label
  );
}

export function goldenPathRunbookActionLabel(i18n: AppI18n, item: GoldenPathRunbookPreviewItem): string {
  if (!item.actionLabel) {
    return item.current ? goldenPathStatusLabel(i18n, "blocked") : goldenPathStatusLabel(i18n, "review");
  }
  if (i18n.locale === "en-US") {
    return item.actionLabel;
  }
  return (
    {
      "Refresh market data": "刷新行情",
      "Refresh watchlist cache": "刷新自选缓存",
      "Run research pipeline": "运行流水线",
      "Run AI review": "运行 AI 评审",
      "Fix paper handoff": "修复交接",
      "Submit paper order": "提交委托",
      "Certify live adapter": "查看闸门"
    }[item.actionLabel] ?? item.actionLabel
  );
}

export function goldenPathRunbookDetail(i18n: AppI18n, item: GoldenPathRunbookPreviewItem): string {
  if (i18n.locale === "en-US") {
    return item.detail;
  }
  const translatedDetail = translateGoldenPathDetail(i18n, item.detail);
  if (translatedDetail !== item.detail) {
    return translatedDetail;
  }
  return (
    {
      "market-data": "补齐或刷新当前标的 K 线缓存。",
      "research-run": "绑定行情、策略、回测和 AI 证据。",
      "backtest-report": "等待审计回测报告生成。",
      "ai-review": "等待基于审计 run 的 AI 评审。",
      "paper-execution": "提交并绑定模拟委托成交记录。",
      "live-gate": "保持实盘阻断，等待认证和确认。"
    }[item.stepId] ?? item.detail
  );
}

export function translateGoldenPathDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  const localizedAiReviewDetail = ({
    "Run the research pipeline to bind data, strategy, backtest, and AI evidence.": "运行研究流水线，以绑定行情数据、策略、回测和 AI 证据。",
    "Backtest evidence is unavailable until an audited research run exists.": "在审计研究运行生成前，回测证据不可用。",
    "AI review waits for audited backtest evidence.": "AI 评审等待已审计的回测证据。",
    "The latest audited run does not include an AI evidence summary.": "最新审计运行缺少 AI 证据摘要。",
    "The audited run is ready for the local evidence review required by paper simulation.": "审计运行已就绪，等待完成模拟执行所需的本地证据评审。",
    "AI review evidence is bound to the audited run.": "AI 评审证据已绑定到当前审计运行。",
    "Paper execution requires an audited research run first.": "模拟执行需要先完成一次审计研究运行。",
    "Audited AI evidence is ready, but no filled paper execution is bound.": "AI 评审证据已就绪，但尚未绑定已成交的模拟执行记录。",
    "Live routing remains blocked until adapter certification, risk approval, and human confirmation pass.": "在执行适配器认证、风控审批和人工确认全部通过前，实盘路由保持阻断。",
  } as Record<string, string>)[detail];
  if (localizedAiReviewDetail) {
    return localizedAiReviewDetail;
  }
  const paperHandoffBlocker = detail.match(/^Paper handoff is blocked by ([^.]+)\.$/);
  if (paperHandoffBlocker) {
    const reason =
      ({
        paper_execution_data_quality_incomplete: "行情数据质量证据不完整",
        paper_execution_strategy_risk_incomplete: "策略风控参数不完整"
      } as Record<string, string>)[paperHandoffBlocker[1]] ?? "执行交接校验未通过";
    return `模拟执行交接被阻断：${reason}。`;
  }
  const freshCache = detail.match(/^(\d+) fresh cached K-line rows are available for audited research\.$/);
  if (freshCache) {
    return `${freshCache[1]} 根新鲜 K 线缓存可支撑审计研究。`;
  }
  const staleCache = detail.match(/^(\d+) cached rows are stale\. Refresh market data before audited research\.$/);
  if (staleCache) {
    return `${staleCache[1]} 根缓存已过期，先刷新行情数据后再运行审计研究。`;
  }
  if (
    detail ===
    "No cached K-line context exists for the selected instrument. Refresh market data before audited research."
  ) {
    return "当前标的还没有 K 线缓存上下文，先刷新行情数据后再运行审计研究。";
  }
  if (
    detail ===
    "The selected context has no usable cached K-line rows. Refresh market data before audited research."
  ) {
    return "当前上下文没有可用 K 线缓存，先刷新行情数据后再运行审计研究。";
  }
  const missingRefreshEvidence = detail.match(
    /^(\d+) fresh cached K-line rows are available, but no matching watchlist cache refresh evidence covers (.+)\. Refresh watchlist cache before audited research\.$/
  );
  if (missingRefreshEvidence) {
    return `${missingRefreshEvidence[1]} 根新鲜 K 线缓存可用，但 ${missingRefreshEvidence[2]} 还没有匹配的自选刷新证据；先刷新自选缓存后再运行审计研究。`;
  }
  const readyRefreshEvidence = detail.match(
    /^(\d+) fresh cached K-line rows are available\. Matching watchlist cache refresh evidence (.+) confirms (\d+) rows from (.+)\.$/
  );
  if (readyRefreshEvidence) {
    return `${readyRefreshEvidence[1]} 根新鲜 K 线缓存可用，自选刷新证据 ${readyRefreshEvidence[2]} 已确认 ${readyRefreshEvidence[3]} 行来自 ${readyRefreshEvidence[4]}。`;
  }
  const nonBlockingRefreshWarning = detail.match(
    /^(\d+) fresh cached K-line rows are available\. Matching watchlist cache refresh evidence (.+) includes the non-blocking quality note: (.+) Research may continue with this review note\.$/
  );
  if (nonBlockingRefreshWarning) {
    return `${nonBlockingRefreshWarning[1]} 根新鲜 K 线缓存可用，自选刷新证据 ${nonBlockingRefreshWarning[2]} 包含非阻断质量提示：${translateGoldenPathWarning(nonBlockingRefreshWarning[3])}；研究可继续。`;
  }
  const reviewRefreshEvidence = detail.match(
    /^(\d+) fresh cached K-line rows are available, but watchlist cache refresh evidence (.+) requires review: (.+)\. Refresh watchlist cache before audited research\.$/
  );
  if (reviewRefreshEvidence) {
    return `${reviewRefreshEvidence[1]} 根新鲜 K 线缓存可用，但自选刷新证据 ${reviewRefreshEvidence[2]} 需要复核：${translateGoldenPathWarning(reviewRefreshEvidence[3])}；先刷新自选缓存后再运行审计研究。`;
  }
  const runnerFailures = detail.match(/^Automatic trading runner failed (\d+) consecutive cycles: (.+)$/);
  if (runnerFailures) {
    return `自动交易后台已连续失败 ${runnerFailures[1]} 轮：${translateAutomaticTradingError(runnerFailures[2])}`;
  }
  return detail;
}

export function translateAutomaticTradingError(detail: string): string {
  const amountPrecision = detail.match(
    /^binance amount of (.+) must be greater than minimum amount precision of (.+)$/
  );
  return amountPrecision
    ? `${amountPrecision[1]} 数量低于交易所最小精度 ${amountPrecision[2]}。`
    : detail;
}

export function translateGoldenPathWarning(warning: string): string {
  return (
    {
      "Expected bar intervals are missing.": "存在缺失的 K 线时间间隔",
      "The window contains a bar that is still forming.": "当前窗口包含一根仍在形成的 K 线"
    }[warning] ?? warning
  );
}

export function auditRunbookStatusLabel(i18n: AppI18n, item: GoldenPathStatus["runbook"][number]): string {
  if (item.passed) {
    return i18n.locale === "zh-CN" ? "已通过" : "Passed";
  }
  return item.current
    ? goldenPathStatusLabel(i18n, "blocked")
    : goldenPathStatusLabel(i18n, item.status === "passed" ? "ready" : item.status);
}

export function auditRunbookActionLabel(i18n: AppI18n, item: GoldenPathStatus["runbook"][number]): string {
  if (item.passed) {
    return i18n.locale === "zh-CN" ? "已完成" : "Done";
  }
  return goldenPathRunbookActionLabel(i18n, {
    stepId: item.stepId,
    label: item.label,
    workspaceId: item.workspaceId,
    status: item.status,
    current: item.current,
    detail: item.blocker ?? item.detail,
    actionLabel: item.actionLabel
  });
}

export function auditRunbookDetail(i18n: AppI18n, item: GoldenPathStatus["runbook"][number]): string {
  const detail = item.blocker ?? item.detail;
  return goldenPathRunbookDetail(i18n, {
    stepId: item.stepId,
    label: item.label,
    workspaceId: item.workspaceId,
    status: item.status,
    current: item.current,
    detail,
    actionLabel: item.actionLabel
  });
}

export function goldenPathWorkspaceContextLabel(i18n: AppI18n, context: GoldenPathWorkspaceContext): string {
  const progress = `${context.passedStepCount}/${context.totalStepCount}`;
  return `${i18n.productWorkAreaStatus(context.status)} · ${i18n.locale === "en-US" ? progress : `${progress}步`}`;
}

export function goldenPathWorkspaceContextActionLabel(i18n: AppI18n, context: GoldenPathWorkspaceContext): string {
  if (!context.actionLabel) {
    return i18n.productWorkAreaStatus(context.status);
  }
  return goldenPathRunbookActionLabel(i18n, {
    stepId: context.primaryStepId ?? "",
    label: context.primaryStepLabel ?? "",
    workspaceId: context.workspaceId,
    status: goldenPathRunbookStatusFromWorkspaceStatus(context.status),
    current: context.current,
    detail: context.detail,
    actionLabel: context.actionLabel
  });
}

export function goldenPathRunbookStatusFromWorkspaceStatus(status: GoldenPathWorkspaceContext["status"]) {
  if (status === "ready") {
    return "passed";
  }
  return status === "blocked" ? "blocked" : "review";
}

export function goldenPathWorkspaceContextDetail(i18n: AppI18n, context: GoldenPathWorkspaceContext): string {
  if (i18n.locale === "en-US") {
    return context.detail || context.reason;
  }
  if (!context.primaryStepId) {
    return context.reason;
  }
  return (
    {
      "market-data": "本工作区负责补齐当前标的行情缓存。",
      "research-run": "本工作区负责生成可复现审计运行。",
      "backtest-report": "本工作区等待或展示审计回测报告。",
      "ai-review": "本工作区只基于审计证据运行 AI 评审。",
      "paper-execution": "本工作区负责模拟委托和执行交接。",
      "live-gate": "本工作区负责实盘适配器和安全闸门。"
    }[context.primaryStepId] ?? context.detail ?? context.reason
  );
}

export function goldenPathDetail(
  i18n: AppI18n,
  step: GoldenPathStatus["steps"][number] | undefined,
  fallback?: string,
  goldenPath?: GoldenPathStatus
): string {
  const automaticTrading = goldenPath?.workspaces.find((workspace) => workspace.id === "dynamic-trading");
  if (!step && automaticTrading?.status === "blocked") {
    return translateGoldenPathDetail(i18n, automaticTrading.reason);
  }
  if (!step && goldenPath?.summary.liveTradingAllowed) {
    return i18n.locale === "zh-CN"
      ? "模拟闭环与实盘认证均已完成，生产自动交易可用。"
      : "The simulation loop and live certification are complete; production automatic trading is available.";
  }
  if (i18n.locale === "en-US") {
    return step?.detail ?? fallback ?? "";
  }
  if (!step) {
    return "当前上下文已完成 P0 模拟闭环，实盘仍需认证。";
  }
  if (step.id === "paper-execution" && step.status === "blocked") {
    return "模拟执行交接未通过，请先修复数据质量或结构化风控。";
  }
  const translatedDetail = translateGoldenPathDetail(i18n, step.detail);
  if (translatedDetail !== step.detail) {
    return translatedDetail;
  }
  return (
    {
      "market-data": "当前标的缺少可用 K 线缓存，先刷新行情数据。",
      "research-run": "先运行流水线，绑定行情、策略、回测和 AI 证据。",
      "backtest-report": "回测证据缺失，重新运行流水线生成审计报告。",
      "ai-review": "AI 评审证据缺失，先完成基于审计 run 的解释记录。",
      "paper-execution": "审计证据已就绪，下一步提交模拟委托并绑定成交记录。",
      "live-gate": "实盘通道继续阻断，需要适配器认证、风控审批和人工确认。"
    }[step.id] ?? fallback ?? step.detail
  );
}
