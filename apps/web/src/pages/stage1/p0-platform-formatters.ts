import { productWorkAreaIdLabelText } from "../../components/AppWorkflowPanels";
import { type AppI18n } from "../../lib/i18n";
import { P0CompletionChecklist, P0CompletionCriterion, P0CurrentGapActionReadiness, P0PaperExecutionPreflightGate, P0PlatformActionOutcome, P0PlatformReadinessSummary, buildP0PaperExecutionPreflight } from "../../lib/terminal-workbench";
import { type PaperExecutionDeepLinkStatus } from "../app-shell/url-state";

export function goldenPathActionIdLabel(i18n: AppI18n, actionId: string): string {
  return goldenPathActionLabelText(
    i18n,
    {
      "certify-live-adapter": "Certify live adapter",
      "fix-paper-handoff": "Fix paper handoff",
      "refresh-data": "Refresh market data",
      "refresh-watchlist-cache": "Refresh watchlist cache",
      "run-ai-committee": "Run AI committee",
      "run-ai-review": "Run AI review",
      "run-pipeline": "Run research pipeline",
      "submit-paper-order": "Submit paper order"
    }[actionId] ?? actionId
  );
}

export function goldenPathActionLabelText(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return (
    {
      "Certify live adapter": "确认实盘操作",
      "Fix paper handoff": "修复交接",
      "Refresh market data": "刷新行情",
      "Refresh watchlist cache": "刷新自选缓存",
      "Run AI committee": "运行智能体委员会",
      "Run AI review": "运行 AI 评审",
      "Run research pipeline": "运行流水线",
      "Submit paper order": "提交委托"
    }[label] ?? label
  );
}

export function p0CurrentGapActionReadinessLabel(i18n: AppI18n, readiness: P0CurrentGapActionReadiness): string {
  if (readiness.canExecute) {
    return i18n.locale === "zh-CN" ? "可执行" : "Executable";
  }
  if (i18n.locale === "en-US") {
    return (
      {
        "missing-action": "Missing action",
        "missing-workspace": "Missing workspace",
        "not-ready-report": "Report not ready",
        ready: "Executable",
        "unknown-action": "Unknown action"
      }[readiness.reason] ?? "Not executable"
    );
  }
  return (
    {
      "missing-action": "缺少动作",
      "missing-workspace": "缺少工作区",
      "not-ready-report": "报告未就绪",
      ready: "可执行",
      "unknown-action": "未知动作"
    }[readiness.reason] ?? "不可执行"
  );
}

export function p0BacklogReadinessLabelText(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US" || !label) {
    return label;
  }
  return label
    .replace("P0 backlog readiness", "P0 缺口队列")
    .replace("not recorded", "未记录")
    .replace("no open backlog", "无开放缺口")
    .replace("not executable", "不可执行")
    .replace("executable", "可执行")
    .replace("first", "首项")
    .replace("missing-action", "缺少动作")
    .replace("missing-workspace", "缺少工作区")
    .replace("unknown-action", "未知动作")
    .replace("ready", "就绪");
}

export function p0CompletionLedgerLabelText(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US" || !label) {
    return label;
  }
  return label
    .replace("P0 completion", "P0 完成定义")
    .replace("not recorded", "未记录")
    .replace("passed", "通过")
    .replace("review", "复核")
    .replace("blocked", "阻断")
    .replace("current", "当前");
}

export function p0PlatformReadinessLiveBoundary(i18n: AppI18n, summary: P0PlatformReadinessSummary): string {
  if (i18n.locale === "en-US") {
    return summary.liveBoundary.detail;
  }
  if (summary.liveBoundary.liveTradingAllowed) {
    return "黄金路径显示实盘闸门打开；路由资金前仍需人工确认。";
  }
  if (summary.state === "unknown") {
    return "加载黄金路径后再评估执行边界。";
  }
  return "P0 可用于审计研究、评审和模拟执行；实盘交易保持阻断。";
}

export function p0CompletionChecklistHeadline(i18n: AppI18n, checklist: P0CompletionChecklist): string {
  if (i18n.locale === "en-US") {
    return checklist.headline;
  }
  return (
    {
      "P0 completion needs review": "P0 完成定义待复核",
      "P0 completion not ready": "P0 完成定义未达标",
      "P0 completion ready": "P0 完成定义已达标"
    }[checklist.headline] ?? checklist.headline
  );
}

export function p0CompletionChecklistDetail(i18n: AppI18n, checklist: P0CompletionChecklist): string {
  if (i18n.locale === "en-US") {
    return checklist.detail;
  }
  if (checklist.blocked === 0 && checklist.review === 0) {
    return `${checklist.passed}/${checklist.total} 项完成 · 个人/小团队模拟链路可用`;
  }
  return `${checklist.passed}/${checklist.total} 项完成 · ${checklist.review} 项待复核 · ${checklist.blocked} 项阻断`;
}

export function p0CompletionCriterionStatusLabel(
  i18n: AppI18n,
  status: P0CompletionCriterion["status"]
): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { blocked: "阻断", passed: "通过", review: "复核" }[status];
}

export function p0CompletionCriterionLabel(i18n: AppI18n, criterion: P0CompletionCriterion): string {
  if (i18n.locale === "en-US") {
    return criterion.label;
  }
  return (
    {
      "ai-evidence": "AI 证据",
      "audited-backtest": "审计回测",
      "automated-tests": "自动化测试",
      "data-quality": "数据质量",
      "export-import": "导入导出",
      "golden-path": "黄金路径闭环",
      "paper-execution": "模拟执行",
      "product-workspaces": "产品工作区",
      replay: "回放恢复",
      "strategy-versioning": "策略版本"
    }[criterion.id] ?? criterion.label
  );
}

export function p0CompletionCriterionDetail(i18n: AppI18n, criterion: P0CompletionCriterion): string {
  if (i18n.locale === "en-US") {
    return criterion.detail;
  }
  if (criterion.status === "passed") {
    return "已有可审计证据。";
  }
  const next = criterion.actionLabel ? goldenPathActionLabelText(i18n, criterion.actionLabel) : null;
  const workspace = productWorkAreaIdLabelText(i18n, criterion.targetWorkspaceId);
  if (criterion.status === "blocked") {
    return next ? `${next} -> ${workspace}` : "需要先补齐前置证据。";
  }
  return next ? `待复核：${next} -> ${workspace}` : "需要复核运行证据。";
}

export function p0PlatformActionOutcomeLabel(i18n: AppI18n, outcome: P0PlatformActionOutcome): string {
  if (i18n.locale === "en-US") {
    return outcome.label;
  }
  return (
    {
      "Waiting for P0 action evidence": "等待 P0 动作证据",
      "Audited run available": "审计运行可用",
      "Audited run live gate open": "审计运行实盘闸门已开",
      "Paper execution recorded": "模拟执行已入账"
    }[outcome.label] ?? outcome.label
  );
}

export function p0PlatformActionOutcomeDetail(i18n: AppI18n, outcome: P0PlatformActionOutcome): string {
  if (i18n.locale === "en-US") {
    return outcome.detail;
  }
  return outcome.detail
    .replace("Golden Path audit run loaded for paper execution", "已为模拟执行加载黄金路径审计运行")
    .replace("Run an audited pipeline to create traceable P0 evidence.", "运行审计流水线后生成可追踪 P0 证据。")
    .replace("orders", "笔委托")
    .replace("order", "笔委托")
    .replace("gates passed", "个闸门通过");
}

export function p0PlatformActionOutcomeNextStep(i18n: AppI18n, outcome: P0PlatformActionOutcome): string {
  if (i18n.locale === "en-US") {
    return outcome.nextStep;
  }
  return (
    {
      "Review the execution handoff and promotion gates; live trading remains blocked.":
        "继续复核执行交接和晋级闸门；实盘仍保持阻断。",
      "Continue with AI review or paper execution from the P0 backlog.":
        "继续从 P0 待办运行 AI 评审或模拟执行。",
      "Require explicit operator confirmation before any live routing.":
        "任何实盘路由前都必须再次人工确认。",
      "Start with market data refresh and an audited research pipeline.":
        "先刷新行情数据并运行审计研究流水线。"
    }[outcome.nextStep] ?? outcome.nextStep
  );
}

export function p0PaperExecutionPreflightHeadline(
  i18n: AppI18n,
  preflight: ReturnType<typeof buildP0PaperExecutionPreflight>
): string {
  if (i18n.locale === "en-US") {
    return preflight.headline;
  }
  return (
    {
      "Audited run required": "需要审计运行",
      "Bind latest audited run": "绑定最新审计运行",
      "Paper execution recorded": "模拟执行已入账",
      "Paper order ready": "模拟委托可提交",
      "Risk approval required": "需要风控审批"
    }[preflight.headline] ?? preflight.headline
  );
}

export function p0PaperExecutionPreflightDetail(
  i18n: AppI18n,
  preflight: ReturnType<typeof buildP0PaperExecutionPreflight>
): string {
  if (i18n.locale === "en-US") {
    return preflight.detail;
  }
  return preflight.detail
    .replace(/^Golden Path has (.+) ready; load it before submitting a paper order\.$/u, "黄金路径已有 $1；先加载该运行再提交模拟委托。")
    .replace("Run an audited pipeline before submitting a paper order.", "提交模拟委托前先运行审计流水线。")
    .replace(/^Audited run (.+) can stage paper orders; live trading remains blocked until (\d+) gates pass\.$/u, "审计运行 $1 可创建模拟委托；实盘仍需 $2 个闸门通过。")
    .replace("orders", "笔委托")
    .replace("order", "笔委托")
    .replace("gates passed", "个闸门通过");
}

export function p0PaperExecutionPreflightActionLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return (
    {
      "Load latest audited run": "加载最新审计运行",
      "Review paper execution": "复核模拟执行",
      "Review risk gates": "复核风控闸门",
      "Run audited pipeline": "运行审计流水线",
      "Submit paper order": "提交模拟委托"
    }[label] ?? label
  );
}

export function p0PaperExecutionPreflightGateLabel(i18n: AppI18n, gate: P0PaperExecutionPreflightGate): string {
  if (i18n.locale === "en-US") {
    return gate.label;
  }
  return (
    {
      "audited-run": "审计运行",
      "live-boundary": "实盘边界",
      "paper-execution": "模拟执行",
      "risk-approval": "风控审批"
    }[gate.id] ?? gate.label
  );
}

export function p0PaperExecutionPreflightGateValue(i18n: AppI18n, gate: P0PaperExecutionPreflightGate): string {
  if (i18n.locale === "en-US") {
    return gate.value;
  }
  return gate.value
    .replace("missing", "缺失")
    .replace("not recorded", "未入账")
    .replace("ready to submit", "可提交")
    .replace("paper only", "仅模拟盘")
    .replace("live gate open", "实盘闸门已开")
    .replace("Risk approval blocked", "风控审批阻断")
    .replace("Paper execution approved", "模拟执行已批准")
    .replace("execution gates", "个执行闸门");
}

export function p0PaperExecutionPreflightGateDetail(i18n: AppI18n, gate: P0PaperExecutionPreflightGate): string {
  if (i18n.locale === "en-US") {
    return gate.detail;
  }
  return gate.detail
    .replace("Latest Golden Path run can be rebound into the current workspace.", "最新黄金路径运行可重新绑定到当前工作区。")
    .replace("No matching audited run is bound to the current workspace.", "当前工作区尚未绑定匹配的审计运行。")
    .replace("Bind an audited run before paper or live execution.", "先绑定审计运行，再进入模拟或实盘执行。")
    .replace("Paper order has not been submitted for the latest audited run.", "最新审计运行尚未提交模拟委托。")
    .replace("Live routing remains blocked while paper execution is prepared.", "准备模拟执行期间，实盘路由保持阻断。")
    .replace("Paper execution is linked to an audited research run.", "模拟执行已绑定审计研究运行。")
    .replace("Paper execution captured its execution gate evidence.", "模拟执行已捕获执行闸门证据。")
    .replace("Paper order can be submitted after the operator confirms this paper-only route.", "操作者确认仅模拟盘路径后即可提交模拟委托。")
    .replace("Paper route can stage; live routing still requires explicit gate approval.", "模拟通道可创建委托；实盘仍需显式闸门审批。")
    .replace("Paper execution remains paper-only unless live gates are explicitly opened.", "除非显式打开实盘闸门，否则模拟执行保持 paper-only。")
    .replace("Golden Path reports live gates open; require explicit human confirmation before routing capital.", "黄金路径显示实盘闸门打开；路由资金前仍需人工确认。")
    .replace("orders recorded in paper mode.", "笔委托已在模拟盘入账。")
    .replace("order recorded in paper mode.", "笔委托已在模拟盘入账。");
}

export function paperExecutionDeepLinkStatusLabel(
  i18n: AppI18n,
  status: PaperExecutionDeepLinkStatus["status"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        failed: "Failed",
        idle: "Ready to load",
        loaded: "Loaded",
        loading: "Loading"
      }[status] ?? status
    );
  }
  return (
    {
      failed: "加载失败",
      idle: "等待加载",
      loaded: "已恢复",
      loading: "加载中"
    }[status] ?? status
  );
}
