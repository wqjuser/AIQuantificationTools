import { productWorkAreaIdLabelText } from "../../components/AppWorkflowPanels";
import { type AppI18n } from "../../lib/i18n";
import { GoldenPathStatus } from "../../lib/terminal-api";
import { P0AcceptanceSummary, P0PlatformReadinessSummary, P1AcceptanceSummary, ProductWorkArea } from "../../lib/terminal-workbench";
import { goldenPathActionLabelText } from "./p0-platform-formatters";
import { goldenPathStepLabel } from "./golden-path-formatters";

export function p0EvidenceDrawerSummary(
  i18n: AppI18n,
  hasSavedReport: boolean,
  preflightGateCount: number,
  backlogItemCount: number
): string {
  if (i18n.locale === "zh-CN") {
    const report = hasSavedReport ? "已入账报告" : "无入账报告";
    return `${report} · ${preflightGateCount} 个预检门 · ${backlogItemCount} 个开放缺口`;
  }
  const report = hasSavedReport ? "saved report" : "no saved report";
  return `${report} · ${preflightGateCount} preflight gates · ${backlogItemCount} open gaps`;
}

export function automatedTradingWorkflowActionKey(goldenPath: GoldenPathStatus): string | null {
  const action = goldenPath.nextAction;
  return action
    ? [
        goldenPath.currentStepId ?? "",
        action.id,
        action.targetWorkspace,
        goldenPath.latestRunId ?? "",
        goldenPath.summary.passedSteps
      ].join(":")
    : null;
}

export function automatedTradingWorkflowRequiresManualAction(actionId: string): boolean {
  return actionId === "fix-paper-handoff" || actionId === "certify-live-adapter";
}

export function workflowNextActionLabel(i18n: AppI18n, stepId: string): string {
  if (stepId === "strategy") {
    return i18n.t("aiAction.strategyDraft");
  }
  if (stepId === "agent-review") {
    return i18n.t("aiAction.debate");
  }
  if (stepId === "paper") {
    return i18n.t("execution.submitPaper");
  }
  return i18n.t("action.runPipeline");
}

export function productWorkAreasWithGoldenPath(
  areas: ProductWorkArea[],
  goldenPath: GoldenPathStatus | undefined
): ProductWorkArea[] {
  if (!goldenPath) {
    return areas;
  }
  const statusByWorkspace = new Map(goldenPath.workspaces.map((workspace) => [workspace.id, workspace.status]));
  return areas.map((area) => {
    const status = statusByWorkspace.get(area.id);
    return status ? { ...area, status } : area;
  });
}

export function goldenPathStatusLabel(i18n: AppI18n, status: GoldenPathStatus["status"]): string {
  if (i18n.locale === "en-US") {
    return { ready: "Ready", review: "Review", blocked: "Blocked" }[status];
  }
  return { ready: "就绪", review: "待复核", blocked: "阻断" }[status];
}

export function goldenPathProgressLabel(i18n: AppI18n, goldenPath: GoldenPathStatus): string {
  const progress = `${goldenPath.summary.passedSteps}/${goldenPath.summary.totalSteps}`;
  return `${goldenPathStatusLabel(i18n, goldenPath.status)} · ${i18n.locale === "en-US" ? progress : `${progress}步`}`;
}

export function p0PlatformReadinessHeadline(i18n: AppI18n, summary: P0PlatformReadinessSummary): string {
  if (i18n.locale === "en-US") {
    return summary.headline;
  }
  return (
    {
      blocked: "黄金路径阻断",
      live_ready: "实盘链路已就绪",
      paper_ready: "模拟链路已可用",
      review: "黄金路径待复核",
      unknown: "等待可用性证据"
    } satisfies Record<P0PlatformReadinessSummary["state"], string>
  )[summary.state];
}

export function p0PlatformReadinessDetail(i18n: AppI18n, summary: P0PlatformReadinessSummary): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  if (summary.state === "unknown") {
    return "黄金路径状态尚未加载。";
  }
  const progress = `${summary.passedSteps}/${summary.totalSteps} 个 P0 步骤通过`;
  if (summary.state === "paper_ready") {
    return `${progress} · 模拟研究链路已可用 · 实盘仍阻断`;
  }
  if (summary.state === "live_ready") {
    return `${progress} · 实盘闸门显示已就绪`;
  }
  const gap = summary.currentGap
    ? goldenPathStepLabel(i18n, summary.currentGap.stepId, summary.currentGap.label)
    : "证据";
  const action = summary.currentGap?.actionLabel
    ? goldenPathActionLabelText(i18n, summary.currentGap.actionLabel)
    : "";
  const workspaceId = summary.currentGap?.targetWorkspaceId || summary.currentGap?.workspaceId;
  const workspace = workspaceId ? productWorkAreaIdLabelText(i18n, workspaceId) : "";
  const actionDetail = action && workspace ? ` · 动作：${action} -> ${workspace}` : "";
  return `${progress} · 当前缺口：${gap}${actionDetail}`;
}

export function p0AcceptanceSummaryHeadline(i18n: AppI18n, summary: P0AcceptanceSummary): string {
  if (i18n.locale === "en-US") {
    return summary.headline;
  }
  return (
    {
      "P0 acceptance manifest invalid": "P0 验收清单无效",
      "P0 acceptance manifest missing": "P0 验收清单缺失",
      "P0 acceptance passed": "P0 验收已通过"
    }[summary.headline] ?? summary.headline
  );
}

export function p0AcceptanceSummaryDetail(i18n: AppI18n, summary: P0AcceptanceSummary): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  if (summary.state === "passed") {
    const run = summary.runId ? `运行 ${summary.runId}` : "最近一次 P0 验收";
    return `${run} · ${summary.checkCount}/${summary.requiredCheckCount} 项检查通过 · 实盘仍阻断`;
  }
  if (summary.state === "invalid") {
    return `验收清单未通过校验：${summary.detail
      .replace("P0 acceptance evidence is invalid: ", "")
      .replace(". Live trading remains blocked.", "")}；实盘仍阻断。`;
  }
  return `运行 P0 验收后会在这里读取 ${summary.sourcePath}；缺失时仍保持实盘阻断。`;
}

export function p1AcceptanceSummaryHeadline(i18n: AppI18n, summary: P1AcceptanceSummary): string {
  if (i18n.locale === "en-US") {
    return summary.headline;
  }
  return (
    {
      "P1 acceptance manifest invalid": "P1 验收清单无效",
      "P1 acceptance manifest missing": "P1 验收清单缺失",
      "P1 research-ops acceptance passed": "P1 研究运营验收已通过"
    }[summary.headline] ?? summary.headline
  );
}

export function p1AcceptanceSummaryDetail(i18n: AppI18n, summary: P1AcceptanceSummary): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  if (summary.state === "passed") {
    const run = summary.runId ? `运行 ${summary.runId}` : "最近一次 P1 验收";
    const queued = [summary.queuedMarket, summary.queuedSymbol, summary.timeframe].filter(Boolean).join(" ");
    return `${run} · ${queued || "队列标的"} · 自选 ${summary.watchlistCount} 个 · ${
      summary.checkCount
    }/${summary.requiredCheckCount} 项检查通过 · 实盘仍阻断`;
  }
  if (summary.state === "invalid") {
    return `P1 验收清单未通过校验：${summary.detail
      .replace("P1 acceptance evidence is invalid: ", "")
      .replace(". Live trading remains blocked.", "")}；实盘仍阻断。`;
  }
  return `运行 P1 验收后会在这里读取 ${summary.sourcePath}；缺失时仍保持实盘阻断。`;
}
