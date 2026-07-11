import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { createI18n } from "../lib/i18n";
import type { Stage4PortfolioGoldenPath, Stage4PortfolioWorkflow } from "../lib/portfolio-stage4";
import { PortfolioStage4Section } from "./PortfolioStage4Section";

const reviewPath: Stage4PortfolioGoldenPath = {
  status: "review",
  currentStepId: "operator-approval",
  primaryActionId: "review-portfolio-orders",
  blockers: ["operator-approval-required"],
  steps: [
    ["portfolio-build", "passed", "Complete"],
    ["risk-review", "passed", "Complete"],
    ["operator-approval", "review", "operator-approval-required"],
    ["paper-simulation", "review", "Pending"],
    ["account-replay", "review", "Pending"]
  ].map(([id, status, detail], index) => ({
    id,
    label: id,
    status: status as "passed" | "review",
    passed: index < 2,
    detail,
    actionId: index === 2 ? "review-portfolio-orders" : null
  }))
};

function workflow(): Stage4PortfolioWorkflow {
  return {
    workflowId: "stage4-workflow-001",
    workflowHash: "a".repeat(64)
  } as Stage4PortfolioWorkflow;
}

describe("PortfolioStage4Section", () => {
  test("renders five Chinese-first steps, one enabled primary action, blockers and the paper boundary", () => {
    const markup = renderToStaticMarkup(
      <PortfolioStage4Section
        goldenPath={reviewPath}
        i18n={createI18n("zh-CN")}
        onPrimaryAction={vi.fn()}
        workflow={null}
      />
    );

    expect((markup.match(/class="portfolio-stage4-step /g) ?? [])).toHaveLength(5);
    expect((markup.match(/data-testid="portfolio-stage4-primary"/g) ?? [])).toHaveLength(1);
    expect(markup).not.toMatch(/data-testid="portfolio-stage4-primary"[^>]*disabled/);
    expect(markup).toContain("操作人审批");
    expect(markup).toContain("委托尚未完成操作人审批");
    expect(markup).toContain("仅限模拟盘");
    expect(markup).toContain("禁止实盘交易、券商下单和订单提交");
    expect(markup).not.toContain("连接券商");
    expect(markup).not.toContain("提交实盘订单");
  });

  test("shows restored workflow identity and expandable authoritative evidence", () => {
    const completePath: Stage4PortfolioGoldenPath = {
      ...reviewPath,
      status: "ready",
      primaryActionId: null,
      blockers: [],
      steps: reviewPath.steps.map((step) => ({ ...step, status: "passed", passed: true, detail: "Complete" }))
    };
    const markup = renderToStaticMarkup(
      <PortfolioStage4Section
        goldenPath={completePath}
        i18n={createI18n("zh-CN")}
        onPrimaryAction={vi.fn()}
        workflow={workflow()}
      />
    );

    expect(markup).toContain("stage4-workflow-001");
    expect(markup).toContain("a".repeat(64));
    expect(markup).toContain("<details");
    expect(markup).toContain("权威证据");
    expect(markup).not.toContain('data-testid="portfolio-stage4-primary"');
  });

  test("keeps the primary action accessible while busy or blocked", () => {
    const markup = renderToStaticMarkup(
      <PortfolioStage4Section
        busy
        goldenPath={reviewPath}
        i18n={createI18n("en-US")}
        onPrimaryAction={vi.fn()}
        workflow={null}
      />
    );

    expect(markup).toMatch(/data-testid="portfolio-stage4-primary"[^>]*disabled/);
    expect(markup).toContain('aria-describedby="portfolio-stage4-disabled-reason"');
    expect(markup).toContain('id="portfolio-stage4-disabled-reason"');
  });
});
