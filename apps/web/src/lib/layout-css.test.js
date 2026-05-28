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
  test("uses product work areas as the primary left navigation", () => {
    const leftRailSource = sourceBetween('<aside className="left-rail">', "</aside>");

    expect(appSource).toContain("buildProductWorkAreas(workspace)");
    expect(appSource).toContain("resolveInitialWorkAreaId");
    expect(appSource).toContain('new URLSearchParams(window.location.search).get("workspace")');
    expect(appSource).toContain("productWorkAreas.map");
    expect(leftRailSource).toContain('className={`work-area-button');
    expect(leftRailSource).toContain("i18n.productWorkAreaLabel");
    expect(leftRailSource).toContain("i18n.productWorkAreaDescription");
    expect(leftRailSource).not.toContain("workspace.quantLoop.map");
  });

  test("uses the left rail for actionable product work areas instead of passive module switching", () => {
    const leftRailSource = sourceBetween('<aside className="left-rail">', "</aside>");

    expect(appSource).toContain("resolveInitialWorkAreaId");
    expect(appSource).toContain('url.searchParams.set("workspace", activeWorkAreaId)');
    expect(appSource).toContain('url.searchParams.delete("workflow")');
    expect(leftRailSource).toContain('className="work-area-index"');
    expect(leftRailSource).toContain('className="work-area-copy"');
    expect(leftRailSource).toContain('className="work-area-status"');
    expect(leftRailSource).toContain('activeWorkAreaId === area.id ? "selected active" : ""');
    expect(leftRailSource).not.toContain('i18n.t("section.terminalModules")');
    expect(leftRailSource).not.toContain('className="module-list"');
    expect(appSource).toContain("renderActiveProductWorkspace()");
  });

  test("uses the document as the single desktop scroll surface", () => {
    expect(appSource).not.toContain('<aside className="agent-rail">');
    expect(cssBlock(".terminal-shell")).toContain("min-height: 100vh;");
    expect(cssBlock(".terminal-shell")).toContain("grid-template-columns: 184px minmax(0, 1fr);");
    expect(cssBlock(".terminal-shell")).toContain("overflow: visible;");
    expect(hasExactCssDeclaration(".terminal-shell", "height: 100vh;")).toBe(false);
    expect(cssBlock(".terminal-shell")).not.toContain("overflow: hidden;");
    expect(cssBlock(".left-rail")).not.toContain("max-height: 100vh;");
    expect(cssBlock(".left-rail")).not.toContain("overflow: auto;");
    expect(cssBlock(".terminal-main")).not.toContain("max-height: 100vh;");
    expect(cssBlock(".terminal-main")).not.toContain("overflow: auto;");
    expect(cssBlock(".terminal-main")).toContain("grid-template-rows: auto auto auto;");
    expect(cssBlock(".brand > div")).toContain("display: block;");
    expect(cssBlock(".work-area-button")).toContain("grid-template-columns: auto minmax(0, 1fr) auto;");
    expect(cssBlock(".work-area-copy")).toContain("display: block;");
    expect(hasCssDeclaration(".work-area-copy small", "display: none;")).toBe(true);
  });

  test("keeps blocked product work areas clickable so users can inspect gate reasons", () => {
    const leftRailSource = sourceBetween('<aside className="left-rail">', "</aside>");

    expect(leftRailSource).not.toContain('disabled={area.status === "blocked"}');
    expect(cssBlock(".work-area-button.blocked")).toContain("border-color: #7a3a32;");
  });

  test("resets the active workflow when timeframe changes invalidate audited context", () => {
    const selectTimeframeSource = sourceBetween("const selectTimeframe = useCallback", "setWorkflowRunState(createWorkflowRunState());");

    expect(selectTimeframeSource).toContain('setActiveLoopStepId("research");');
    expect(selectTimeframeSource).toContain('setActiveWorkflowStageId("data");');
  });

  test("keeps market context in one compact desktop band above the workflow", () => {
    expect(appSource).toContain('className="terminal-overview-grid market-tape"');
    expect(cssBlock(".terminal-overview-grid")).toContain(
      "grid-template-columns: minmax(220px, 0.65fr) minmax(500px, 1.7fr) minmax(300px, 0.9fr);"
    );
    expect(cssBlock(".terminal-overview-grid")).toContain("align-items: stretch;");
    expect(cssBlock(".terminal-overview-grid .watchlist-strip")).toContain("grid-template-columns: repeat(4, minmax(0, 1fr));");
    expect(cssBlock(".terminal-overview-grid .metrics-row")).toContain("grid-template-columns: repeat(4, minmax(0, 1fr));");
    expect(cssBlock(".terminal-overview-grid .ticker,\n.terminal-overview-grid .metric-card")).toContain("min-height: 42px;");
    expect(cssBlock(".terminal-overview-grid .module-focus-card")).toContain("min-height: 42px;");
    expect(cssBlock(".terminal-overview-grid .module-focus-card .run-button.compact")).toContain("white-space: nowrap;");
    expect(cssBlock(".terminal-overview-grid .metric-card span")).toContain("white-space: nowrap;");
    expect(
      hasCssBlockWith("  .terminal-overview-grid", [
        "grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr);"
      ])
    ).toBe(true);
    expect(hasCssBlockWith("  .terminal-overview-grid .metrics-row", ["grid-row: 1 / span 2;"])).toBe(true);
  });

  test("keeps workflow pages explicit and avoids passive all-in-one watchlist layout", () => {
    expect(appSource).toContain('"chart-panel workflow-chart-panel"');
    expect(appSource).toContain('"strategy-panel workflow-strategy-panel"');
    expect(appSource).toContain('activeLoopStepId === "agent-review"');
    expect(appSource).toContain('runAiWorkbenchAction("debate")');
    expect(appSource).toContain('setActiveLoopStepId(action === "strategy-draft" ? "strategy" : "agent-review")');
    expect(appSource).toContain('renderWorkflowNodesPanel("workflow-nodes-panel")');
    expect(appSource).toContain("buildWorkflowStages(workspace, workflowRunState)");
    expect(appSource).toContain('className="workflow-backtest-panel"');
    expect(appSource).toContain('executionClassName="workflow-execution-panel"');
    expect(appSource).toContain('"workflow-agent-panel"');
    expect(appSource).toContain('className="workflow-decision-panel"');
    expect(appSource).toContain('className="workflow-history-panel"');
    expect(cssBlock(".terminal-panel")).toContain("grid-template-rows: auto auto;");
    expect(cssBlock(".terminal-panel")).toContain("min-height: auto;");
    expect(cssBlock(".terminal-panel")).not.toContain("min-height: 0;");
    expect(cssBlock(".workflow-layout")).toContain("grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);");
    expect(cssBlock(".strategy-layout")).toContain("grid-template-areas:");
    expect(
      hasCssBlockWith(".strategy-layout", [
        '"chart strategy"',
        '"workflow strategy"',
        '"ai strategy"',
        '"decision strategy"'
      ])
    ).toBe(true);
    expect(hasCssBlockWith(".research-layout", ['"chart scanner"', '"decision workflow"'])).toBe(true);
    expect(hasCssBlockWith(".backtest-layout", ['"backtest workflow"', '"history history"', '"ai ai"'])).toBe(true);
    expect(hasCssBlockWith(".agent-review-layout", ['"ai workflow"', '"decision history"'])).toBe(true);
    expect(cssBlock(".paper-layout")).toContain(
      "grid-template-columns: minmax(720px, 1.15fr) minmax(380px, 0.65fr) minmax(320px, 0.45fr);"
    );
    expect(hasCssBlockWith(".paper-layout", ['"execution portfolio broker"'])).toBe(true);
    expect(cssBlock(".workflow-backtest-panel")).toContain("grid-area: backtest;");
    expect(cssBlock(".workflow-nodes-panel")).toContain("grid-area: workflow;");
    expect(cssBlock(".workflow-agent-panel")).toContain("grid-area: ai;");
    expect(cssBlock(".workflow-scanner-panel .scanner-head")).toContain("display: none;");
    expect(cssBlock(".workflow-scanner-panel .scanner-row")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(cssBlock(".workflow-broker-panel .broker-adapter-head")).toContain("display: none;");
    expect(cssBlock(".workflow-broker-panel .broker-adapter-row")).toContain(
      "grid-template-columns: minmax(0, 1fr) auto;"
    );
    expect(cssBlock(".workflow-portfolio-panel .paper-position-row")).toContain(
      "grid-template-columns: minmax(72px, 0.9fr) minmax(46px, 0.48fr) minmax(48px, 0.5fr) minmax(58px, 0.58fr) minmax(48px, 0.5fr);"
    );
    expect(cssBlock(".workflow-portfolio-panel .paper-position-row span:nth-child(3),\n.workflow-portfolio-panel .paper-position-row span:nth-child(5),\n.workflow-portfolio-panel .paper-position-row span:nth-child(6)")).toContain(
      "display: none;"
    );
    expect(cssBlock(".workflow-decision-panel")).toContain("grid-area: decision;");
    expect(cssBlock(".workflow-history-panel")).toContain("grid-area: history;");
    expect(cssBlock(".center-grid")).toContain("align-content: start;");
    expect(cssBlock(".workflow-execution-panel")).toContain("grid-area: execution;");
    expect(cssBlock(".chart-panel")).not.toContain("min-height: clamp(520px, 56vh, 720px);");
    expect(cssBlock(".chart-panel")).toContain("min-height: clamp(400px, 44vh, 560px);");
    expect(cssBlock(".chart-panel")).toContain("grid-area: chart;");
    expect(cssBlock(".chart-panel")).toContain("grid-template-rows: auto minmax(0, 1fr);");
    expect(cssBlock(".research-layout .workflow-chart-panel")).toContain("align-self: stretch;");
    expect(cssBlock(".strategy-panel")).not.toContain("min-height: clamp(520px, 56vh, 720px);");
    expect(cssBlock(".strategy-panel")).toContain("align-self: start;");
    expect(cssBlock(".strategy-panel")).toContain("grid-area: strategy;");
    expect(cssBlock(".strategy-panel")).toContain("grid-template-rows: auto auto;");
    expect(cssBlock(".strategy-panel")).not.toContain("overflow: hidden;");
    expect(cssBlock(".strategy-panel .strategy-workbench")).not.toContain("overflow: auto;");
    expect(cssBlock(".strategy-panel .strategy-rule-row")).toContain("grid-template-columns:");
    expect(cssBlock(".strategy-panel .strategy-rule-row")).toContain("minmax(0, 1.2fr)");
    expect(cssBlock(".module-workspace-grid")).toContain("grid-template-rows: minmax(0, 1fr);");
    expect(cssBlock(".workflow-nodes-panel")).toContain("align-self: start;");
    expect(cssBlock(".workflow-decision-panel")).toContain("align-self: start;");
    expect(hasCssDeclaration(".watchlist-ai-panel .agent-rounds", "grid-template-columns: repeat(2, minmax(0, 1fr));")).toBe(
      true
    );
    expect(cssBlock(".watchlist-ai-panel .agent-rounds-title")).toContain("grid-column: 1 / -1;");
  });

  test("renders distinct product work-area compositions", () => {
    expect(appSource).toContain("renderActiveProductWorkspace()");
    expect(appSource).toContain('activeWorkAreaId === "market"');
    expect(appSource).toContain('activeWorkAreaId === "settings"');
    expect(appSource).toContain("MarketDataHealthPanel");
    expect(appSource).toContain("PlatformSettingsPanel");
    expect(cssBlock(".product-workspace-layout")).toContain("display: grid;");
  });

  test("renders the strategy lab as a structured rule builder", () => {
    expect(appSource).toContain("buildStrategyRuleDraft(workspace)");
    expect(appSource).toContain("workspaceWithStrategyRuleDraftField");
    expect(appSource).toContain("strategy-draft-grid");
    expect(appSource).toContain("strategy-generated-snapshot");
    expect(styles).toContain(".strategy-draft-grid");
    expect(styles).toContain(".strategy-generated-snapshot");
  });

  test("renders the backtest lab as an auditable evidence report", () => {
    expect(appSource).toContain("buildBacktestEvidenceCards(workspace)");
    expect(appSource).toContain("buildBacktestReadinessGates(workspace)");
    expect(appSource).toContain("evidenceCards={backtestEvidenceCards}");
    expect(appSource).toContain("readinessGates={backtestReadinessGates}");
    expect(appSource).toContain('className="backtest-evidence-grid"');
    expect(appSource).toContain('className="backtest-readiness-list"');
    expect(appSource).toContain('className="backtest-diagnostic-strip"');
    expect(styles).toContain(".backtest-evidence-grid");
    expect(styles).toContain(".backtest-readiness-list");
    expect(styles).toContain(".backtest-diagnostic-strip");
  });

  test("collapses the terminal and workflow grid before cards become squeezed", () => {
    expect(styles).toContain("@media (max-width: 1180px)");
    expect(
      hasCssBlockWith("@media (max-width: 1180px) {\n  .terminal-shell", [
        "grid-template-columns: 68px minmax(0, 1fr);",
        "height: auto;"
      ])
    ).toBe(true);
    expect(hasCssBlockWith("  .left-rail", ["position: sticky;", "height: 100vh;"])).toBe(true);
    expect(hasCssBlockWith("  .loop-step", ["min-height: 50px;", "padding: 7px 5px;"])).toBe(true);
    expect(
      hasCssBlockWith(
        "  .loop-step-copy,\n  .work-area-copy,\n  .work-area-status,\n  .workflow-next-action,\n  .left-rail .workspace-card",
        ["display: none;"]
      )
    ).toBe(true);
    expect(hasCssBlockWith("  .terminal-topbar", ["min-height: auto;", "padding: 8px 10px;"])).toBe(true);
    expect(hasCssDeclaration("  .center-grid,\n  .workflow-layout", "grid-template-columns: 1fr;")).toBe(true);
  });

  test("keeps AI review inside workflow pages instead of a separate global strip", () => {
    expect(appSource).not.toContain("<AssistantCommandStrip");
    expect(appSource).not.toContain("function AssistantCommandStrip");
    expect(appSource).not.toContain("function NewsWorkspace");
    expect(appSource).not.toContain("function WorkflowWorkspace");
    expect(appSource).toContain("const renderAgentPanel");
    expect(appSource).toContain('className="agent-panel-body"');
    expect(appSource).toContain('className="workflow-decision-panel"');
    expect(appSource).toContain('className="workflow-history-panel"');
    expect(appSource).toContain('className="history-panel-body"');
    expect(cssBlock(".workflow-agent-panel")).toContain("grid-area: ai;");
    expect(cssBlock(".agent-panel-body")).not.toContain("overflow: auto;");
    expect(cssBlock(".decision-panel")).not.toContain("max-height:");
    expect(cssBlock(".decision-log")).not.toContain("overflow: auto;");
    expect(cssBlock(".history-panel")).not.toContain("height: clamp(");
    expect(cssBlock(".history-panel")).not.toContain("overflow: hidden;");
    expect(cssBlock(".history-panel-body")).not.toContain("overflow: auto;");
  });

  test("renders AI review as an evidence-locked dossier", () => {
    expect(appSource).toContain("buildAiReviewDossier(workspace)");
    expect(appSource).toContain("<AiReviewDossierBoard");
    expect(appSource).toContain('className="ai-dossier"');
    expect(appSource).toContain('className="ai-dossier-grid"');
    expect(appSource).toContain('className={`ai-dossier-card');
    expect(styles).toContain(".ai-dossier");
    expect(styles).toContain(".ai-dossier-grid");
    expect(styles).toContain(".ai-dossier-card");
  });

  test("renders execution approval as a shared risk gate before paper orders", () => {
    expect(appSource).toContain("buildRiskApprovalSummary(workspace)");
    expect(appSource).toContain("<RiskApprovalBoard");
    expect(appSource).toContain("approval={riskApprovalSummary}");
    expect(appSource).toContain('className={`risk-approval');
    expect(appSource).toContain('className="risk-approval-grid"');
    expect(appSource).toContain('className={`risk-approval-gate');
    expect(styles).toContain(".risk-approval");
    expect(styles).toContain(".risk-approval-grid");
    expect(styles).toContain(".risk-approval-gate");
  });

  test("keeps history replay and export as separate compact row actions", () => {
    expect(appSource).toContain("onExport={onExport}");
    expect(appSource).toContain('className="history-row-actions"');
    expect(appSource).toContain('i18n.t("history.export")');
    expect(cssBlock(".history-row")).toContain("cursor: default;");
    expect(cssBlock(".history-row-actions")).toContain("display: flex;");
    expect(cssBlock(".history-row-actions button")).toContain("min-height: 28px;");
  });

  test("keeps research run import as a compact history panel action", () => {
    expect(appSource).toContain('i18n.t("history.import")');
    expect(appSource).toContain('className="history-import-input"');
    expect(appSource).toContain('type="file"');
    expect(cssBlock(".history-panel-actions")).toContain("display: flex;");
    expect(cssBlock(".history-import-button")).toContain("min-height: 30px;");
    expect(cssBlock(".history-import-input")).toContain("display: none;");
  });
});
