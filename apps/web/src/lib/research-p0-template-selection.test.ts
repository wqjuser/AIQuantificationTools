import { describe, expect, it } from "vitest";

import {
  matchingResearchP0Capabilities,
  resolveResearchP0TemplateSelection,
} from "./research-p0-template-selection";

const capabilities = [
  {
    templateId: "regime-breakout-v2",
    version: "2",
    policyKind: "regime_breakout_v2",
    market: "crypto",
    symbol: "BTC/USDT",
    timeframe: "1m",
    sealedData: {
      hashVersion: "aiqt-sealed-v1" as const,
      minimumRows: 142_919,
      minimumPreRollRows: 13_319,
      developmentScoringRows: 103_680,
      withheldRows: 25_920,
    },
    parameterSchema: [{
      policyPath: "regime.closeAboveSmaWindow",
      type: "integer" as const,
      minimum: 2,
      maximum: 500,
    }],
    evaluatorVersion: "strategy-evaluator-v2",
  },
  {
    templateId: "cost-aware-range-reversion-v1-1",
    version: "1.1",
    policyKind: "cost_aware_range_reversion_v1_1",
    market: "crypto",
    symbol: "BTC/USDT",
    timeframe: "1m",
    sealedData: {
      hashVersion: "aiqt-sealed-v1" as const,
      minimumRows: 163_199,
      minimumPreRollRows: 33_599,
      developmentScoringRows: 103_680,
      withheldRows: 25_920,
    },
    parameterSchema: [{
      policyPath: "reversion.entryZThreshold",
      type: "number" as const,
      minimum: -100,
      maximum: 100,
    }],
    evaluatorVersion: "strategy-evaluator-v2",
  },
];

const context = {
  market: "crypto",
  symbol: "BTC/USDT",
  timeframe: "1m",
} as const;

describe("Research P0 registered-template selection", () => {
  it("keeps both same-context server capabilities available without choosing one", () => {
    expect(matchingResearchP0Capabilities(capabilities, context).map((item) => item.templateId))
      .toEqual([
        "regime-breakout-v2",
        "cost-aware-range-reversion-v1-1",
      ]);
    expect(resolveResearchP0TemplateSelection(capabilities, "", context)).toEqual({
      mode: "legacy",
    });
  });

  it("uses the cost-aware capability only after its exact ID is selected", () => {
    expect(resolveResearchP0TemplateSelection(
      capabilities,
      "cost-aware-range-reversion-v1-1",
      context,
    )).toEqual({
      mode: "registered",
      capability: capabilities[1],
    });
  });

  it("rejects stale, unknown, or cross-context explicit selections", () => {
    expect(() => resolveResearchP0TemplateSelection(
      capabilities,
      "unknown-template",
      context,
    )).toThrow("not available for the current research context");
    expect(() => resolveResearchP0TemplateSelection(
      capabilities,
      "regime-breakout-v2",
      { ...context, timeframe: "5m" },
    )).toThrow("not available for the current research context");
  });
});
