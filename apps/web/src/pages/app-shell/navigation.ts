import {
  Activity,
  BarChart3,
  BrainCircuit,
  Cog,
  Database,
  Download,
  GitBranch,
  Newspaper,
  Radar,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import type {
  ProductWorkAreaId,
  ResearchContextReadinessRow,
  TerminalModule
} from "../../lib/terminal-workbench";

export const workflowIcons: Record<string, typeof BarChart3> = {
  research: Radar,
  strategy: GitBranch,
  backtest: BarChart3,
  "agent-review": BrainCircuit,
  paper: WalletCards
};

export const workAreaIcons: Record<ProductWorkAreaId, typeof BarChart3> = {
  market: Database,
  "market-information": Newspaper,
  research: Radar,
  strategy: GitBranch,
  backtest: BarChart3,
  "ai-review": BrainCircuit,
  portfolio: ShieldCheck,
  execution: WalletCards,
  "dynamic-trading": Activity,
  audit: Download,
  settings: Cog
};

export const workflowAccentByStep: Record<string, TerminalModule["accent"]> = {
  research: "market",
  strategy: "strategy",
  backtest: "ai",
  "agent-review": "ai",
  paper: "execution"
};
export const workflowStepIds = ["research", "strategy", "backtest", "agent-review", "paper"] as const;
export const productWorkAreaIds: ProductWorkAreaId[] = [
  "market",
  "market-information",
  "research",
  "strategy",
  "backtest",
  "ai-review",
  "portfolio",
  "execution",
  "dynamic-trading",
  "audit",
  "settings"
];
export const automatedTradingWorkAreaIds: ProductWorkAreaId[] = [
  "settings",
  "market",
  "research",
  "strategy",
  "backtest",
  "ai-review",
  "portfolio",
  "execution",
  "dynamic-trading",
  "audit"
];

export const researchPipelinePreflightIssueTargets: Record<
  ResearchContextReadinessRow["id"],
  {
    actionLabelEn: string;
    actionLabelZh: string;
    selector: string;
    workspaceId: ProductWorkAreaId;
  }
> = {
  instrument: {
    actionLabelEn: "Select symbol",
    actionLabelZh: "切换标的",
    selector: "#terminal-symbol-input",
    workspaceId: "market"
  },
  watchlist: {
    actionLabelEn: "Save watchlist",
    actionLabelZh: "保存自选",
    selector: "#market-watchlist-save",
    workspaceId: "market"
  },
  calendar: {
    actionLabelEn: "View calendar",
    actionLabelZh: "查看交易日历",
    selector: "#terminal-symbol-input",
    workspaceId: "market"
  },
  klines: {
    actionLabelEn: "Refresh data",
    actionLabelZh: "前往数据刷新",
    selector: "#terminal-symbol-input",
    workspaceId: "market"
  },
  cache: {
    actionLabelEn: "Refresh data",
    actionLabelZh: "前往数据刷新",
    selector: "#terminal-symbol-input",
    workspaceId: "market"
  },
  refresh: {
    actionLabelEn: "Refresh data",
    actionLabelZh: "前往数据刷新",
    selector: "#terminal-symbol-input",
    workspaceId: "market"
  },
  note: {
    actionLabelEn: "Edit note",
    actionLabelZh: "填写研究笔记",
    selector: "#research-note-input",
    workspaceId: "research"
  },
  workspace: {
    actionLabelEn: "Save workspace",
    actionLabelZh: "保存工作区",
    selector: "#research-workspace-save",
    workspaceId: "research"
  }
};

export const productWorkAreaGroups: Array<{
  collapsible: boolean;
  id: string;
  labelEn: string;
  labelZh: string;
  workAreaIds: ProductWorkAreaId[];
}> = [
  {
    collapsible: false,
    id: "research-mainline",
    labelEn: "Research workflow",
    labelZh: "研究主线",
    workAreaIds: ["market", "research", "strategy", "backtest", "ai-review"]
  },
  {
    collapsible: true,
    id: "advanced-execution",
    labelEn: "Advanced execution",
    labelZh: "高级执行",
    workAreaIds: ["portfolio", "execution", "dynamic-trading"]
  },
  {
    collapsible: true,
    id: "system",
    labelEn: "System",
    labelZh: "系统",
    workAreaIds: ["audit", "settings"]
  }
];
