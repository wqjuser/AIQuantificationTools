import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ResearchP0TemplateSelector } from "./TerminalTopbar";

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

describe("Research P0 template control", () => {
  it("renders a reachable legacy default and both server-owned template choices", () => {
    const markup = renderToStaticMarkup(
      <ResearchP0TemplateSelector
        capabilities={capabilities}
        disabled={false}
        onSelect={vi.fn()}
        selectedTemplateId=""
      />,
    );

    expect(markup).toContain("data-testid=\"research-p0-template-select\"");
    expect(markup).toContain("research-template-control");
    expect(markup).toContain("当前工作区策略（默认）");
    expect(markup).toContain("市场状态突破策略");
    expect(markup).toContain("成本约束区间回归策略");
    expect(markup).not.toContain(">regime-breakout-v2<");
    expect(markup).not.toContain(">cost-aware-range-reversion-v1-1<");
    expect(markup).not.toContain("晋级");
    expect(markup).not.toContain("绑定");
    expect(markup).not.toContain("启动监控");
  });
});
