import { describe, expect, test } from "vitest";

import { strategyAiDraftDiffRows } from "../App";
import { createI18n } from "./i18n";
import type { StrategyRuleDraft } from "./terminal-workbench";

const currentDraft: StrategyRuleDraft = {
  name: "当前策略",
  entryKind: "close_above_sma",
  entryWindow: 20,
  entryThreshold: 0,
  entryRsiConfirm: false,
  entryRsiWindow: 14,
  entryRsiThreshold: 55,
  entryVolumeConfirm: false,
  entryVolumeWindow: 20,
  exitKind: "close_below_sma",
  exitWindow: 20,
  exitThreshold: 0,
  positionPct: 20,
  stopLossPct: 8,
  takeProfitPct: 18,
  maxDrawdownPct: 12,
  paperOnly: true
};

describe("AI strategy draft diff", () => {
  test("returns no changes for an identical candidate", () => {
    expect(strategyAiDraftDiffRows(createI18n("zh-CN"), currentDraft, { ...currentDraft })).toEqual([]);
  });

  test("surfaces every latent parameter that the candidate would overwrite", () => {
    const candidate: StrategyRuleDraft = {
      ...currentDraft,
      entryThreshold: 7,
      entryRsiWindow: 21,
      entryRsiThreshold: 60,
      entryVolumeWindow: 30,
      exitThreshold: 9,
      paperOnly: false
    };

    const rows = strategyAiDraftDiffRows(createI18n("zh-CN"), currentDraft, candidate);

    expect(rows.map((row) => row.id)).toEqual([
      "entry",
      "entry-rsi-confirm",
      "entry-volume-confirm",
      "exit",
      "execution-mode"
    ]);
    expect(rows.find((row) => row.id === "entry-rsi-confirm")?.candidateValue).toContain(
      "未启用 · 保留参数： 周期 21 · 阈值 60"
    );
    expect(rows.find((row) => row.id === "entry-volume-confirm")?.candidateValue).toContain(
      "未启用 · 保留参数： 均线周期 30"
    );
    expect(rows.find((row) => row.id === "execution-mode")?.candidateValue).toBe(
      "非模拟盘 · 已阻断"
    );
  });
});
