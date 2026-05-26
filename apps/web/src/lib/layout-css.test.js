import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

function cssBlock(selector) {
  return cssBlocks(selector)[0] ?? "";
}

function cssBlocks(selector) {
  const blocks = [];
  let fromIndex = 0;
  while (fromIndex < styles.length) {
    const start = styles.indexOf(`${selector} {`, fromIndex);
    if (start < 0) {
      break;
    }
    const bodyStart = styles.indexOf("{", start);
    const bodyEnd = styles.indexOf("}", bodyStart);
    blocks.push(styles.slice(bodyStart + 1, bodyEnd));
    fromIndex = bodyEnd + 1;
  }
  return blocks;
}

function hasCssDeclaration(selector, declaration) {
  return cssBlocks(selector).some((block) => block.includes(declaration));
}

function hasCssBlockWith(selector, declarations) {
  return cssBlocks(selector).some((block) => declarations.every((declaration) => block.includes(declaration)));
}

describe("terminal layout css", () => {
  test("keeps desktop shell columns independently scrollable", () => {
    expect(cssBlock(".terminal-shell")).toContain("height: 100vh;");
    expect(cssBlock(".terminal-shell")).toContain("overflow: hidden;");
    expect(cssBlock(".left-rail,\n.agent-rail")).toContain("max-height: 100vh;");
    expect(cssBlock(".terminal-main")).toContain("max-height: 100vh;");
    expect(cssBlock(".terminal-main")).toContain("overflow: auto;");
    expect(cssBlock(".terminal-main")).toContain("grid-template-rows: auto auto auto auto auto;");
    expect(hasCssDeclaration(".agent-rail", "grid-template-rows: auto auto auto auto auto;")).toBe(true);
    expect(hasCssDeclaration(".agent-rail", "align-content: start;")).toBe(true);
    expect(
      hasCssBlockWith(".agent-rail", [
        "grid-column: 1 / -1;",
        "grid-template-columns: 1fr;",
        "grid-template-rows: auto;"
      ])
    ).toBe(true);
  });

  test("keeps the watchlist chart height isolated from the strategy panel", () => {
    expect(appSource).toContain('className="strategy-panel"');
    expect(appSource).toContain('className="watchlist-backtest-panel"');
    expect(appSource).toContain('className="watchlist-workflow-panel"');
    expect(appSource).toContain('className="watchlist-execution-panel"');
    expect(cssBlock(".terminal-panel")).toContain("grid-template-rows: auto auto;");
    expect(cssBlock(".terminal-panel")).toContain("min-height: auto;");
    expect(cssBlock(".terminal-panel")).not.toContain("min-height: 0;");
    expect(cssBlock(".watchlist-layout")).toContain("grid-template-areas:");
    expect(
      hasCssBlockWith(".watchlist-layout", [
        '"chart"',
        '"strategy"',
        '"backtest"',
        '"workflow"',
        '"execution"'
      ])
    ).toBe(true);
    expect(cssBlock(".watchlist-backtest-panel")).toContain("grid-area: backtest;");
    expect(cssBlock(".watchlist-workflow-panel")).toContain("grid-area: workflow;");
    expect(cssBlock(".center-grid")).toContain("align-content: start;");
    expect(cssBlock(".center-grid")).not.toContain("1fr");
    expect(cssBlock(".watchlist-execution-panel")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".watchlist-execution-panel")).toContain("grid-area: execution;");
    expect(cssBlock(".chart-panel")).toContain("height: clamp(380px, 48vh, 560px);");
    expect(cssBlock(".chart-panel")).toContain("grid-area: chart;");
    expect(cssBlock(".chart-panel")).toContain("grid-template-rows: auto minmax(0, 1fr);");
    expect(cssBlock(".strategy-panel")).toContain("height: clamp(380px, 48vh, 560px);");
    expect(cssBlock(".strategy-panel")).toContain("grid-area: strategy;");
    expect(cssBlock(".strategy-panel")).toContain("grid-template-rows: auto minmax(0, 1fr);");
    expect(cssBlock(".strategy-panel")).toContain("overflow: hidden;");
    expect(cssBlock(".strategy-panel .strategy-workbench")).toContain("overflow: auto;");
    expect(cssBlock(".strategy-panel .strategy-rule-row")).toContain("grid-template-columns:");
    expect(cssBlock(".strategy-panel .strategy-rule-row")).toContain("minmax(0, 1.2fr)");
    expect(cssBlock(".module-workspace-grid")).toContain("grid-template-rows: minmax(0, 1fr);");
  });

  test("stacks dense agent rail content so cards are not squeezed", () => {
    expect(cssBlock(".agent-rail .agent-grid")).toContain("grid-template-columns: 1fr;");
    expect(cssBlock(".agent-rail .agent-evidence-grid")).toContain("grid-template-columns: 1fr;");
    expect(cssBlock(".agent-rail .history-comparison-row")).toContain("grid-template-columns: 1fr;");
  });
});
