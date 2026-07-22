import { describe, expect, test } from "vitest";
import {
  strategyGovernanceContextLabel,
  strategyGovernanceDetailLabel
} from "../App";
import { createI18n } from "./i18n";
import type { StrategyGovernanceQueueRow } from "./terminal-workbench";

const baseRow: StrategyGovernanceQueueRow = {
  id: "revision-1",
  name: "SMA Trend / Bank Sector",
  revision: "revision-1",
  market: "ashare",
  symbol: "600519",
  timeframe: "1d",
  status: "draft",
  stage: "needs_reaudit",
  tone: "warning",
  contextLabel: "ASHARE · 600519 · 1d",
  contextMismatch: false,
  importProvenance: "ASHARE · 600519 · 1d",
  validationStatus: "ready",
  validationDetail: "Strategy schema, risk controls, and paper-only execution mode are ready.",
  auditRunId: null,
  latestAuditRunId: null,
  changedFieldCount: 0,
  changedFields: [],
  nextActionId: "load-and-rerun",
  nextActionLabel: "Load and rerun audit",
  detail: "Saved draft is valid but has no current audit evidence; load it and rerun the pipeline."
};

describe("strategy governance localization", () => {
  const i18n = createI18n("zh-CN");

  test("renders market context through the existing localized market labels", () => {
    expect(strategyGovernanceContextLabel(i18n, baseRow)).toBe("A 股 · 600519 · 1d");
    expect(
      strategyGovernanceContextLabel(i18n, {
        ...baseRow,
        market: "crypto",
        symbol: "ETH/USDT"
      })
    ).toBe("加密货币 · ETH/USDT · 1d");
  });

  test("renders blocked validation details without leaking domain English", () => {
    expect(
      strategyGovernanceDetailLabel(i18n, {
        ...baseRow,
        stage: "blocked",
        validationStatus: "blocked",
        detail: "Risk controls: Position sizing and risk guardrails must be explicit."
      })
    ).toBe("风控参数：仓位规则和风控闸门必须明确。");
  });

  test("renders imported and stale guidance with localized contexts and fields", () => {
    expect(
      strategyGovernanceDetailLabel(i18n, {
        ...baseRow,
        market: "crypto",
        symbol: "ETH/USDT",
        stage: "imported"
      })
    ).toBe("保存于 加密货币 · ETH/USDT · 1d；请先载入为跨上下文草稿，再在当前工作区审计。");
    expect(
      strategyGovernanceDetailLabel(i18n, {
        ...baseRow,
        stage: "stale",
        changedFieldCount: 2,
        changedFields: ["name", "entry"]
      })
    ).toBe("当前上下文的名称、入场已变更；请载入此版本并重新运行审计。");
  });
});
