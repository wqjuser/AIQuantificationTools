import { describe, expect, test } from "vitest";

import { productWorkAreaGroups } from "./navigation";

describe("research-first navigation", () => {
  test("keeps the five-step research path primary and folds advanced/system pages", () => {
    expect(productWorkAreaGroups).toEqual([
      {
        id: "research-mainline",
        labelEn: "Research workflow",
        labelZh: "研究主线",
        collapsible: false,
        workAreaIds: ["market", "research", "strategy", "backtest", "ai-review"],
      },
      {
        id: "advanced-execution",
        labelEn: "Advanced execution",
        labelZh: "高级执行",
        collapsible: true,
        workAreaIds: ["portfolio", "execution", "dynamic-trading"],
      },
      {
        id: "system",
        labelEn: "System",
        labelZh: "系统",
        collapsible: true,
        workAreaIds: ["audit", "settings"],
      },
    ]);
  });
});
