import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createI18n } from "../lib/i18n";
import type { AuthoritativeAiReviewRun } from "../lib/ai-review-stage3";
import { AiResearchM4Section } from "./AiResearchM4Section";

function review(timeframe = "1d", market = "ashare"): AuthoritativeAiReviewRun {
  return {
    aiReviewId: `ai-review-${"1".repeat(32)}`,
    evidenceBundle: {
      evidenceItems: [
        {
          id: "context",
          kind: "experiment_context",
          value: { market, symbol: "600000", timeframe }
        }
      ]
    }
  } as unknown as AuthoritativeAiReviewRun;
}

function tag(markup: string, testId: string): string {
  return markup.match(new RegExp(`<[^>]+data-testid="${testId}"[^>]*>`))?.[0] ?? "";
}

describe("AiResearchM4Section", () => {
  it("requires an authoritative review before exposing M4 actions", () => {
    const markup = renderToStaticMarkup(
      <AiResearchM4Section baseUrl="/" currentReview={null} i18n={createI18n("zh-CN")} runHistory={[]} />
    );
    expect(markup).toContain("先完成并加载一份权威 AI 评审");
    expect(markup).not.toContain("data-testid=\"ai-research-m4-create\"");
  });

  it("shows source validation and allows optional three-view research for daily A-share evidence", () => {
    const markup = renderToStaticMarkup(
      <AiResearchM4Section baseUrl="/" currentReview={review()} i18n={createI18n("zh-CN")} runHistory={[]} />
    );
    expect(markup).toContain("A 股财务事实双来源");
    expect(markup).toContain("添加独立来源观测");
    expect(tag(markup, "ai-research-m4-multi-view")).not.toContain("disabled");
    expect(tag(markup, "ai-research-m4-create")).not.toContain("disabled");
    expect(markup).toContain("仅研究 · 不影响风控与订单");
  });

  it("blocks multi-view in the minute-level hot path and marks non-A-share facts not applicable", () => {
    const minute = renderToStaticMarkup(
      <AiResearchM4Section baseUrl="/" currentReview={review("1m")} i18n={createI18n("zh-CN")} runHistory={[]} />
    );
    const us = renderToStaticMarkup(
      <AiResearchM4Section baseUrl="/" currentReview={review("1d", "us")} i18n={createI18n("zh-CN")} runHistory={[]} />
    );
    expect(tag(minute, "ai-research-m4-multi-view")).toContain("disabled");
    expect(minute).toContain("分钟级研究禁止多视角评审");
    expect(us).toContain("当前市场不适用");
    expect(us).not.toContain("data-testid=\"ai-research-m4-add-financial\"");
  });
});
