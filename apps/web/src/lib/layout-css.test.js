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

function hasExactCssDeclaration(selector, declaration) {
  return cssBlocks(selector).some((block) =>
    block
      .split(";")
      .map((line) => `${line.trim()};`)
      .includes(declaration)
  );
}

function hasCssBlockWith(selector, declarations) {
  return cssBlocks(selector).some((block) => declarations.every((declaration) => block.includes(declaration)));
}

function sourceBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  if (start < 0) {
    return "";
  }
  const end = appSource.indexOf(endMarker, start);
  return end < 0 ? appSource.slice(start) : appSource.slice(start, end + endMarker.length);
}

describe("terminal layout css", () => {
  test("uses the document as the single desktop scroll surface", () => {
    expect(appSource).not.toContain('<aside className="agent-rail">');
    expect(cssBlock(".terminal-shell")).toContain("min-height: 100vh;");
    expect(cssBlock(".terminal-shell")).toContain("grid-template-columns: 224px minmax(0, 1fr);");
    expect(cssBlock(".terminal-shell")).toContain("overflow: visible;");
    expect(hasExactCssDeclaration(".terminal-shell", "height: 100vh;")).toBe(false);
    expect(cssBlock(".terminal-shell")).not.toContain("overflow: hidden;");
    expect(cssBlock(".left-rail")).not.toContain("max-height: 100vh;");
    expect(cssBlock(".left-rail")).not.toContain("overflow: auto;");
    expect(cssBlock(".terminal-main")).not.toContain("max-height: 100vh;");
    expect(cssBlock(".terminal-main")).not.toContain("overflow: auto;");
    expect(cssBlock(".terminal-main")).toContain("grid-template-rows: auto auto auto auto auto auto;");
  });

  test("keeps the watchlist chart and strategy snapshot in the same visual row", () => {
    expect(appSource).toContain('className="strategy-panel"');
    expect(appSource).toContain('className="watchlist-backtest-panel"');
    expect(appSource).toContain('className="watchlist-workflow-panel"');
    expect(appSource).toContain('className="watchlist-execution-panel"');
    expect(appSource).toContain('className="watchlist-ai-panel"');
    expect(appSource).toContain('className="watchlist-decision-panel"');
    expect(appSource).toContain('className="watchlist-history-panel"');
    expect(cssBlock(".terminal-panel")).toContain("grid-template-rows: auto auto;");
    expect(cssBlock(".terminal-panel")).toContain("min-height: auto;");
    expect(cssBlock(".terminal-panel")).not.toContain("min-height: 0;");
    expect(cssBlock(".watchlist-layout")).toContain("grid-template-areas:");
    expect(
      hasCssBlockWith(".watchlist-layout", [
        '"chart strategy"',
        '"backtest workflow"',
        '"ai decision"',
        '"execution execution"',
        '"history history"'
      ])
    ).toBe(true);
    expect(cssBlock(".watchlist-layout")).toContain("align-items: stretch;");
    expect(cssBlock(".watchlist-backtest-panel")).toContain("grid-area: backtest;");
    expect(cssBlock(".watchlist-workflow-panel")).toContain("grid-area: workflow;");
    expect(cssBlock(".watchlist-ai-panel")).toContain("grid-area: ai;");
    expect(cssBlock(".watchlist-decision-panel")).toContain("grid-area: decision;");
    expect(cssBlock(".watchlist-history-panel")).toContain("grid-area: history;");
    expect(cssBlock(".center-grid")).toContain("align-content: start;");
    expect(cssBlock(".center-grid")).not.toContain("1fr");
    expect(cssBlock(".watchlist-execution-panel")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".watchlist-execution-panel")).toContain("grid-area: execution;");
    expect(cssBlock(".chart-panel")).not.toContain("height: clamp(380px, 48vh, 560px);");
    expect(cssBlock(".chart-panel")).toContain("min-height: clamp(520px, 56vh, 720px);");
    expect(cssBlock(".chart-panel")).toContain("grid-area: chart;");
    expect(cssBlock(".chart-panel")).toContain("grid-template-rows: auto minmax(0, 1fr);");
    expect(cssBlock(".strategy-panel")).not.toContain("height: clamp(380px, 48vh, 560px);");
    expect(cssBlock(".strategy-panel")).toContain("grid-area: strategy;");
    expect(cssBlock(".strategy-panel")).toContain("align-self: stretch;");
    expect(cssBlock(".strategy-panel")).toContain("grid-template-rows: auto auto;");
    expect(cssBlock(".strategy-panel")).not.toContain("overflow: hidden;");
    expect(cssBlock(".strategy-panel .strategy-workbench")).not.toContain("overflow: auto;");
    expect(cssBlock(".strategy-panel .strategy-rule-row")).toContain("grid-template-columns:");
    expect(cssBlock(".strategy-panel .strategy-rule-row")).toContain("minmax(0, 1.2fr)");
    expect(cssBlock(".module-workspace-grid")).toContain("grid-template-rows: minmax(0, 1fr);");
  });

  test("folds AI roles and actions into the main workspace command strip", () => {
    const commandStripSource = sourceBetween('<section className="assistant-command-strip">', "</section>");

    expect(appSource).toContain('className="assistant-command-strip"');
    expect(commandStripSource).toContain('i18n.t("panel.agentRoles.title")');
    expect(commandStripSource).toContain('i18n.t("panel.aiActions.title")');
    expect(commandStripSource).toContain('i18n.t("safety.footer")');
    expect(commandStripSource).not.toContain("<AgentEvidenceBoard");
    expect(commandStripSource).not.toContain("<AgentCommitteeBoard");
    expect(cssBlock(".assistant-command-strip")).toContain("grid-template-columns:");
    expect(cssBlock(".assistant-command-strip .agent-grid")).toContain("grid-template-columns: repeat(4, minmax(0, 1fr));");
    expect(cssBlock(".assistant-command-strip .ai-actions")).toContain("grid-template-columns: repeat(3, minmax(0, 1fr));");
    expect(appSource).toContain('className="agent-panel-body"');
    expect(appSource).toContain('className="watchlist-decision-panel"');
    expect(appSource).toContain('className="watchlist-history-panel"');
    expect(appSource).toContain('className="history-panel-body"');
    expect(cssBlock(".agent-panel")).not.toContain("height: clamp(");
    expect(cssBlock(".agent-panel")).not.toContain("overflow: hidden;");
    expect(cssBlock(".agent-panel-body")).not.toContain("overflow: auto;");
    expect(cssBlock(".decision-panel")).not.toContain("max-height:");
    expect(cssBlock(".decision-log")).not.toContain("overflow: auto;");
    expect(cssBlock(".history-panel")).not.toContain("height: clamp(");
    expect(cssBlock(".history-panel")).not.toContain("overflow: hidden;");
    expect(cssBlock(".history-panel-body")).not.toContain("overflow: auto;");
  });
});
