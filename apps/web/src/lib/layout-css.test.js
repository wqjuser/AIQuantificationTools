import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, test } from "vitest";

function readImportedStyles(entryUrl) {
  const entry = readFileSync(entryUrl, "utf8");
  const imports = [...entry.matchAll(/^@import "([^"]+)";$/gm)].map(([, path]) => path);
  return imports.length === 0
    ? entry
    : imports.map((path) => readFileSync(new URL(path, entryUrl), "utf8")).join("");
}

const globalStyles = readImportedStyles(new URL("../styles.css", import.meta.url));
const mainSource = readFileSync(new URL("../main.tsx", import.meta.url), "utf8");
const marketPageLayoutStyles = readFileSync(
  new URL("../pages/market/MarketPage.layout.css", import.meta.url),
  "utf8"
);
const strategyStyles = [
  "../pages/strategy/StrategyPage.layout.css",
  "../pages/strategy/StrategyAi.layout.css",
  "../pages/strategy/StrategyExperiments.layout.css",
  "../pages/strategy/StrategyLibrary.layout.css",
  "../pages/strategy/StrategyWorkbench.layout.css",
].map((file) => readFileSync(new URL(file, import.meta.url), "utf8")).join("\n");
const styles = [
  globalStyles,
  marketPageLayoutStyles,
  ...[
    "../pages/ai-review/AiReviewPage.layout.css",
    "../pages/ai-review/AiReviewResearchLoop.layout.css",
    "../pages/ai-review/AiReviewResults.layout.css",
    "../pages/ai-review/AiReviewDecision.layout.css",
    "../pages/audit/AuditPage.layout.css",
    "../pages/backtest/BacktestPage.layout.css",
    "../pages/dynamic-trading/AutoTradingControls.layout.css",
    "../pages/dynamic-trading/DynamicTradingControls.layout.css",
    "../pages/dynamic-trading/DynamicTradingPage.layout.css",
    "../pages/execution/ExecutionPage.layout.css",
    "../pages/market-information/MarketInformationPage.layout.css",
    "../pages/market/MarketDiscovery.layout.css",
    "../pages/portfolio/PortfolioPage.layout.css",
    "../pages/research/ResearchPage.layout.css",
    "../pages/settings/SettingsPage.layout.css",
  ].map((file) => readFileSync(new URL(file, import.meta.url), "utf8")),
  strategyStyles,
].join("\n");
const appSource = [
  readFileSync(new URL("../App.tsx", import.meta.url), "utf8"),
  ...readdirSync(new URL("../pages", import.meta.url), { recursive: true })
    .filter((file) => /\.(ts|tsx)$/.test(file) && !file.includes(".test."))
    .map((file) => readFileSync(new URL(`../pages/${file}`, import.meta.url), "utf8"))
].join("\n");
const indexHtmlSource = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const terminalWorkspaceSurfaceSource = readFileSync(
  new URL("../components/TerminalWorkspaceSurface.tsx", import.meta.url),
  "utf8"
);
const auditPageSource = readFileSync(new URL("../pages/audit/AuditPage.tsx", import.meta.url), "utf8");
const backtestPageSource = readFileSync(new URL("../pages/backtest/BacktestPage.tsx", import.meta.url), "utf8");
const executionPageSource = readFileSync(new URL("../pages/execution/ExecutionPage.tsx", import.meta.url), "utf8");
const executionPanelSource = readFileSync(new URL("../pages/execution/ExecutionPanel.tsx", import.meta.url), "utf8");
const marketInformationPageSource = readFileSync(new URL("../pages/market-information/MarketInformationPage.tsx", import.meta.url), "utf8");
const marketPageSource = readFileSync(new URL("../pages/market/MarketPage.tsx", import.meta.url), "utf8");
const portfolioPageSource = readFileSync(new URL("../pages/portfolio/PortfolioPage.tsx", import.meta.url), "utf8");
const researchPageSource = readFileSync(new URL("../pages/research/ResearchPage.tsx", import.meta.url), "utf8");
const settingsPageSource = readFileSync(new URL("../pages/settings/SettingsPage.tsx", import.meta.url), "utf8");
const settingsPageHelpersSource = readFileSync(new URL("../pages/settings/SettingsPage.helpers.tsx", import.meta.url), "utf8");
const settingsControllerSource = readFileSync(new URL("../pages/settings/controller/settings-controller.tsx", import.meta.url), "utf8");
const appShellSelectionControllerSource = readFileSync(new URL("../pages/app-shell/controller/navigation-actions.tsx", import.meta.url), "utf8");
const appShellWorkflowControllerSource = readFileSync(new URL("../pages/app-shell/controller/workflow-actions.tsx", import.meta.url), "utf8");
const appShellRefreshControllerSource = readFileSync(new URL("../pages/app-shell/controller/visible-data-actions.tsx", import.meta.url), "utf8");
const appShellRuntimeEffectsSource = [
  "../pages/app-shell/controller/workspace-runtime-effects.tsx",
  "../pages/app-shell/controller/domain-runtime-effects.tsx",
].map((file) => readFileSync(new URL(file, import.meta.url), "utf8")).join("\n");
const aiReviewControllerSource = readFileSync(new URL("../pages/ai-review/controller/review-state-actions.tsx", import.meta.url), "utf8");
const executionControllerSource = readFileSync(new URL("../pages/execution/controller/adapter-audit-actions.tsx", import.meta.url), "utf8");
const marketControllerSource = readFileSync(new URL("../pages/market/controller/market-state-actions.tsx", import.meta.url), "utf8");
const researchControllerSource = readFileSync(new URL("../pages/research/controller/research-workflow-actions.tsx", import.meta.url), "utf8");
const navigationRailSource = readFileSync(new URL("../pages/app-shell/view/NavigationRail.tsx", import.meta.url), "utf8");
const terminalTopbarSource = readFileSync(new URL("../pages/app-shell/view/TerminalTopbar.tsx", import.meta.url), "utf8");
const researchCompletionNoticeSource = readFileSync(new URL("../pages/research/view/ResearchCompletionNotice.tsx", import.meta.url), "utf8");
const researchPipelinePreflightDialogSource = readFileSync(new URL("../pages/research/view/ResearchPipelinePreflightDialog.tsx", import.meta.url), "utf8");
const appWorkflowPanelsSource = readFileSync(
  new URL("../components/AppWorkflowPanels.tsx", import.meta.url),
  "utf8"
);
const researchContextReadinessPanelSource = readFileSync(
  new URL("../components/ResearchContextReadinessPanel.tsx", import.meta.url),
  "utf8"
);
const aiReviewAuditBoardsSource = readFileSync(
  new URL("../components/AiReviewAuditBoards.tsx", import.meta.url),
  "utf8"
);
const aiReviewAuditTrailPanelSource = readFileSync(
  new URL("../components/AiReviewAuditTrailPanel.tsx", import.meta.url),
  "utf8"
);
const marketAiSelectionPanelSource = readFileSync(
  new URL("../components/MarketAiSelectionPanel.tsx", import.meta.url),
  "utf8"
);
const aiReviewPanelSource = readFileSync(
  new URL("../pages/ai-review/AiReviewPage.tsx", import.meta.url),
  "utf8"
);
const aiReviewContractSource = readFileSync(
  new URL("../pages/shared/ai-review-contract.ts", import.meta.url),
  "utf8"
);
const strategyExperimentSectionSource = readFileSync(
  new URL("../components/StrategyExperimentSection.tsx", import.meta.url),
  "utf8"
);
const aiReviewStage3SectionSource = readFileSync(
  new URL("../components/AiReviewStage3Section.tsx", import.meta.url),
  "utf8"
);
const aiResearchM4SectionSource = readFileSync(
  new URL("../components/AiResearchM4Section.tsx", import.meta.url),
  "utf8"
);
const portfolioStage4SectionSource = readFileSync(
  new URL("../components/PortfolioStage4Section.tsx", import.meta.url),
  "utf8"
);
const portfolioM5SectionSource = readFileSync(
  new URL("../components/PortfolioM5Section.tsx", import.meta.url),
  "utf8"
);
const executionAutoPaperTradingSource = [
  "../pages/dynamic-trading/ExecutionAutoPaperTradingSection.tsx",
  "../pages/dynamic-trading/AutoTradingOverviewPanels.tsx",
  "../pages/dynamic-trading/auto-trading-model.ts",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
const executionStage10ProductionSource = readFileSync(
  new URL("../components/ExecutionStage10ProductionExecutionSection.tsx", import.meta.url),
  "utf8"
);
const executionAcceptanceAuditPanelSource = readFileSync(
  new URL("../components/ExecutionStage9ProductionAdmissionSection.tsx", import.meta.url),
  "utf8"
);
const terminalWorkbenchSource = readFileSync(new URL("./terminal-workbench.ts", import.meta.url), "utf8");
const terminalWorkbenchLocalReviewSource = [
  "./terminal-workbench/audit/deep-link-queries.ts",
  "./terminal-workbench/audit/local-review-bundle.ts",
].map((file) => readFileSync(new URL(file, import.meta.url), "utf8")).join("\n");
const readmeSource = readFileSync(new URL("../../../../README.md", import.meta.url), "utf8");
const productPlanSource = readFileSync(new URL("../../../../docs/product-plan.md", import.meta.url), "utf8");
const portfolioPaperOrderAuditPanelSource = readFileSync(
  new URL("../components/PortfolioPaperOrderAuditLedgerPanel.tsx", import.meta.url),
  "utf8"
);
const executionAdapterPaperExecutionAuditPanelSource = readFileSync(
  new URL("../components/ExecutionAdapterPaperExecutionAuditLedgerPanel.tsx", import.meta.url),
  "utf8"
);
const viteConfig = readFileSync(new URL("../../vite.config.ts", import.meta.url), "utf8");

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
  return sourceBetweenText(appSource, startMarker, endMarker);
}

function sourceBetweenText(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start < 0) {
    return "";
  }
  const end = source.indexOf(endMarker, start);
  return end < 0 ? source.slice(start) : source.slice(start, end + endMarker.length);
}

function i18nSnippet(zh, en) {
  return `i18n.locale === "zh-CN" ? "${zh}" : "${en}"`;
}

describe("terminal layout css", () => {
  test("keeps each workspace page beside its layout stylesheet", () => {
    const pageLayouts = [
      ["../pages/ai-review/AiReviewPage.tsx", [
        "AiReviewDecision.layout.css",
        "AiReviewPage.layout.css",
        "AiReviewResearchLoop.layout.css",
        "AiReviewResults.layout.css",
      ]],
      ["../pages/audit/AuditPage.tsx", ["AuditPage.layout.css"]],
      ["../pages/backtest/BacktestPage.tsx", ["BacktestPage.layout.css"]],
      ["../pages/dynamic-trading/ExecutionAutoPaperTradingSection.tsx", [
        "AutoTradingControls.layout.css",
        "DynamicTradingControls.layout.css",
        "DynamicTradingPage.layout.css",
      ]],
      ["../pages/execution/ExecutionPage.tsx", ["ExecutionPage.layout.css"]],
      ["../pages/market-information/MarketInformationPage.tsx", ["MarketInformationPage.layout.css"]],
      ["../pages/market/MarketPage.tsx", ["MarketDiscovery.layout.css", "MarketPage.layout.css"]],
      ["../pages/portfolio/PortfolioPage.tsx", ["PortfolioPage.layout.css"]],
      ["../pages/research/ResearchPage.tsx", ["ResearchPage.layout.css"]],
      ["../pages/settings/SettingsPage.tsx", ["SettingsPage.layout.css"]],
      ["../pages/strategy/StrategyPage.tsx", [
        "StrategyAi.layout.css",
        "StrategyExperiments.layout.css",
        "StrategyLibrary.layout.css",
        "StrategyPage.layout.css",
        "StrategyWorkbench.layout.css",
      ]],
    ];

    pageLayouts.forEach(([page, layouts]) => {
      const source = readFileSync(new URL(page, import.meta.url), "utf8");
      layouts.forEach((layout) => expect(source).toContain(`import "./${layout}";`));
    });
    expect(aiReviewPanelSource.indexOf('import "./AiReviewResults.layout.css";')).toBeLessThan(
      aiReviewPanelSource.indexOf('import "./AiReviewDecision.layout.css";')
    );
    expect(mainSource.indexOf('import "./styles.css";')).toBeLessThan(
      mainSource.indexOf('import { App } from "./App";')
    );
  });

  test("keeps page-owned mobile root grids after their desktop layouts", () => {
    const mobileLayouts = [
      ["../pages/market/MarketPage.layout.css", ".design-market-grid"],
      ["../pages/research/ResearchPage.layout.css", ".design-research-grid"],
      ["../pages/backtest/BacktestPage.layout.css", ".surface-backtest .design-backtest-grid"],
      ["../pages/portfolio/PortfolioPage.layout.css", ".design-portfolio-grid"],
      ["../pages/audit/AuditPage.layout.css", ".design-audit-grid"],
      ["../pages/settings/SettingsPage.layout.css", ".design-settings-grid"],
    ];

    mobileLayouts.forEach(([file, selector]) => {
      const source = readFileSync(new URL(file, import.meta.url), "utf8");
      const mobileRules = source.slice(source.lastIndexOf("@media (max-width: 760px)"));
      expect(mobileRules).toContain(`${selector} {`);
      expect(mobileRules).toContain("grid-template-columns: minmax(0, 1fr);");
    });
  });

  test("wires explicit production route saving and live-session actions", () => {
    const productionSafetySource = sourceBetweenText(
      settingsPageSource,
      "<legend>生产安全策略</legend>",
      "<legend>AI Provider</legend>"
    );

    expect(productionSafetySource).toContain("checked={productionTradingEnabledDraft}");
    expect(productionSafetySource).toContain(
      "onChange={(event) => setProductionTradingEnabledDraft(event.currentTarget.checked)}"
    );
    expect(settingsPageSource).toContain(
      '? productionTradingEnabledDraft ? "待保存开启" : "待保存关闭"'
    );
    expect(productionSafetySource).not.toContain('type="submit"');
    expect(settingsPageHelpersSource).toContain(
      'productionTradingEnabled: data.has("productionTradingEnabled")'
    );
    expect(executionStage10ProductionSource).toContain(
      'completeLiveSessionAction(autoLiveStartAvailable ? "start" : "renew")'
    );
  });

  test("guards unsaved platform settings before leaving the settings workspace", () => {
    const settingsNavigationGuardSource = sourceBetweenText(
      settingsControllerSource,
      "const deferSettingsNavigation = useCallback(",
      "const continueEditingSettings = useCallback("
    );
    const workAreaSelectionSource = sourceBetweenText(
      appShellSelectionControllerSource,
      "const selectProductWorkArea = useCallback(",
      "const openLiveTradingGate = useCallback("
    );
    const instrumentSelectionSource = sourceBetweenText(
      appShellSelectionControllerSource,
      "const selectInstrument = useCallback(",
      "const researchMarketAiSelectionCandidate = useCallback("
    );
    const timeframeSelectionSource = sourceBetweenText(
      appShellSelectionControllerSource,
      "const selectTimeframe = useCallback(",
      "const selectProductWorkArea = useCallback("
    );
    const adapterWorkflowSource = sourceBetweenText(
      executionControllerSource,
      "const openMarketDataAdapterWorkflow = useCallback(",
      "const footerLiveTradingAllowed ="
    );
    const automatedWorkflowSource = sourceBetweenText(
      appShellWorkflowControllerSource,
      "const runAutomatedTradingWorkflowFromCurrentWorkspace = useCallback(",
      "return {"
    );

    expect(settingsPageSource).toContain("onSettingsConfigurationDirtyChange");
    expect(settingsNavigationGuardSource).toContain('activeWorkAreaId === "settings"');
    expect(settingsNavigationGuardSource).toContain("hasUnsavedSettingsConfiguration");
    expect(settingsNavigationGuardSource).toContain("setPendingSettingsWorkAreaId(targetWorkAreaId)");
    expect(instrumentSelectionSource).toContain("deferSettingsNavigation(targetWorkAreaId, applySelection)");
    expect(timeframeSelectionSource).toContain("deferSettingsNavigation(targetWorkAreaId, applySelection)");
    expect(workAreaSelectionSource).toContain("deferSettingsNavigation(areaId, commitSelection)");
    expect(adapterWorkflowSource).toContain('selectInstrument(instrument, "market")');
    expect(adapterWorkflowSource).not.toContain("selectProductWorkArea");
    expect(automatedWorkflowSource).toContain(
      "deferSettingsNavigation(targetWorkAreaId, leaveSettingsAndRun)"
    );
    expect(automatedWorkflowSource).toContain("commitProductWorkAreaSelection(targetWorkAreaId)");
    expect(appSource).toContain('window.addEventListener("beforeunload"');
    expect(appSource).toContain('id="settings-unsaved-dialog-title"');
    expect(appSource).toContain("保存设置后再离开？");
    expect(appSource).toContain("返回继续编辑");
    expect(appSource).toContain("不保存并离开");
    expect(appSource).toContain("保存并离开");
    expect(appSource).toContain("form.checkValidity()");
    expect(appSource).toContain("form.reportValidity()");
    expect(appSource).toContain("form.requestSubmit()");
    expect(settingsPageSource).not.toContain(
      "setModel((current) => current.trim() || result.models[0])"
    );
    expect(settingsPageSource).toContain("inert={isSavingSettingsConfiguration}");
    expect(appSource).toContain("settingsSaveRequestIdRef.current === requestId");
  });

  test("runs the configured strategy experiment from the redesigned backtest action", () => {
    const terminalActionSource = sourceBetween(
      "const terminalSurfaceAction: TerminalWorkspaceSurfaceAction | null = (() => {",
      "const colorSchemeToggleLabel ="
    );
    const backtestActionSource = sourceBetweenText(
      terminalActionSource,
      'case "backtest":',
      'case "ai-review":'
    );

    expect(backtestActionSource).toContain("onClick: () => void runStrategyExperiment()");
    expect(backtestActionSource).not.toContain("runPipeline()");
  });

  test("continues the authoritative Stage 4 golden path from the portfolio action", () => {
    const terminalActionSource = sourceBetween(
      "const terminalSurfaceAction: TerminalWorkspaceSurfaceAction | null = (() => {",
      "const colorSchemeToggleLabel ="
    );
    const portfolioActionSource = sourceBetweenText(
      terminalActionSource,
      'case "portfolio":',
      'case "execution":'
    );

    expect(portfolioActionSource).toContain("portfolioStage4GoldenPath.primaryActionId");
    expect(portfolioActionSource).toContain(
      "runPortfolioStage4PrimaryAction(portfolioStage4GoldenPath.primaryActionId)"
    );
    expect(portfolioActionSource).not.toContain("runActiveWorkflowAction");
    expect(hasCssDeclaration(".terminal-design-surface.surface-portfolio", "padding-bottom: 10px;")).toBe(true);
    expect(cssBlock(".design-portfolio-grid")).toContain("align-items: start;");
    expect(cssBlock(".design-portfolio-side")).toContain("grid-row: 1 / span 3;");
    expect(hasCssDeclaration(".design-portfolio-summary", "align-self: stretch;")).toBe(true);
    expect(hasCssDeclaration(".design-portfolio-positions", "align-self: stretch;")).toBe(true);
    expect(cssBlock(".design-portfolio-positions")).toContain("min-height: 0;");
    expect(hasCssDeclaration(
      ".design-portfolio-approval .portfolio-order-approval-row strong",
      "font-size: calc(12px * var(--aiqt-text-scale, 1));"
    )).toBe(true);
    expect(hasCssDeclaration(
      ".design-portfolio-approval .portfolio-order-approval-actions button",
      "font-size: calc(10px * var(--aiqt-text-scale, 1));"
    )).toBe(true);
    expect(hasCssDeclaration(".design-portfolio-donut-value", "stroke-linecap: round;")).toBe(true);
  });

  test("routes the execution center to the current automatic-trading controls", () => {
    const terminalActionSource = sourceBetween(
      "const terminalSurfaceAction: TerminalWorkspaceSurfaceAction | null = (() => {",
      "const colorSchemeToggleLabel ="
    );
    const executionActionSource = sourceBetweenText(
      terminalActionSource,
      'case "execution":',
      'case "dynamic-trading":'
    );
    const executionConsoleSource = sourceBetweenText(
      appSource,
      "const openAutomaticTradingConsole =",
      "const terminalSurfaceAction:"
    );

    expect(executionActionSource).toContain('label: "打开自动交易控制台"');
    expect(executionActionSource).toContain("onClick: openAutomaticTradingConsole");
    expect(executionConsoleSource).toContain('selectProductWorkArea("dynamic-trading");');
    expect(executionActionSource).not.toContain("stage6SandboxAuthorization");
    expect(executionActionSource).not.toContain("runStage9ProductionAdmissionCandidateAction");
    expect(hasCssDeclaration(
      ".terminal-design-surface.surface-execution",
      "padding-bottom: 16px;"
    )).toBe(true);
    expect(hasCssDeclaration(
      ".design-execution-readiness",
      "margin-bottom: 10px;"
    )).toBe(true);
  });

  test("keeps the dynamic trading side panels faithful and compact", () => {
    expect(styles).toContain("grid-template-columns: 220px minmax(0, 1fr) 300px;");
    expect(styles).toContain("grid-template-columns: 220px minmax(430px, 1fr) 300px;");
    expect(executionAutoPaperTradingSource).toContain('className="dynamic-trading-control-sections"');
    expect(executionAutoPaperTradingSource).toContain('className="dynamic-trading-control-kpis"');
    expect(executionAutoPaperTradingSource).toContain("liveMode && !snapshot?.liveTradingAllowed");
    expect(styles).toContain('.dynamic-trading-live-confirmation input:not([type="checkbox"])');
    expect(cssBlock('.dynamic-trading-confirmation input[type="checkbox"]')).toContain("width: 14px;");
    expect(cssBlock('.dynamic-trading-confirmation input[type="checkbox"]')).toContain("height: 14px;");
    expect(executionAutoPaperTradingSource).toContain('aria-label="自动交易经济账本"');
    expect(cssBlock(".dynamic-trading-economics > dl")).toContain(
      "grid-template-columns: repeat(6, minmax(0, 1fr));"
    );
    expect(cssBlock(".dynamic-trading-workspace")).toContain("grid-auto-rows: max-content;");
    expect(styles).toContain(
      ".dynamic-trading-economics > dl {\n    grid-template-columns: repeat(2, minmax(0, 1fr));"
    );
  });

  test("makes dynamic trading tabs interactive and surfaces evaluation progress", () => {
    expect(executionAutoPaperTradingSource).toContain('const [instrumentFilter, setInstrumentFilter]');
    expect(executionAutoPaperTradingSource).toContain('onClick={() => setInstrumentFilter("crypto")}');
    expect(executionAutoPaperTradingSource).toContain('const [controlTab, setControlTab]');
    expect(executionAutoPaperTradingSource).toContain('onClick={() => setControlTab("risk")}');
    expect(executionAutoPaperTradingSource).toContain('aria-selected={controlTab === "runtime"}');
    expect(executionAutoPaperTradingSource).toContain("setEvaluating(true);");
    expect(executionAutoPaperTradingSource).toContain('evaluating ? hasUnresolvedOrder ? "对账中…" : "评估中…"');
    expect(executionAutoPaperTradingSource).toContain("setEvaluationFeedback(");
  });

  test("does not reuse a completed AI review experiment after the experiment draft changes", () => {
    const draftSelectionSource = sourceBetween(
      "const aiReviewStage3DraftExperiment = resolveAiReviewDraftExperiment(",
      "const aiReviewStage3SelectedExperiment ="
    );
    const runReviewSource = sourceBetween(
      "const runTerminalAiReview = async () => {",
      "const terminalSurfaceAction: TerminalWorkspaceSurfaceAction | null = (() => {"
    );

    expect(draftSelectionSource).toContain(
      "aiReviewStage3PrimaryExperimentId ?? visibleStrategyExperimentActive?.experimentId ?? null"
    );
    expect(runReviewSource).toContain(
      "let primaryExperimentId = aiReviewStage3DraftExperiment?.experimentId ?? null;"
    );
    expect(runReviewSource).not.toContain("aiReviewStage3SelectedExperiment?.experimentId");
  });

  test("removes the redundant operations workspace instead of moving its dashboard", () => {
    expect(appSource).not.toContain('activeWorkAreaId === "operations"');
    expect(appSource).not.toContain('className="terminal-design-surface terminal-operations-workspace"');
    expect(terminalWorkbenchSource).not.toContain('| "operations"');
    expect(terminalWorkbenchSource).not.toContain('id: "operations"');
    expect(executionAutoPaperTradingSource).not.toContain('variant === "operations"');
    expect(styles).not.toContain(".terminal-operations-workspace");
  });

  test("keeps market status and chart metadata away from panel edges", () => {
    expect(cssBlock(".design-watchlist-panel .design-table th:nth-child(8)")).toContain("width: 12%;");
    expect(cssBlock(".design-watchlist-panel .design-table td:last-child")).toContain("text-align: center;");
    expect(cssBlock(".design-chart-host .chart-data-strip")).toContain("padding: 4px 10px 5px;");
    expect(styles).toContain(".design-watchlist-panel .design-table.editing th:nth-child(8)");
    expect(styles).toContain("display: table-cell;");
  });

  test("keeps dense market watchlist and ranking rows scrollable", () => {
    const marketSurfaceSource = marketPageSource;

    expect(hasCssDeclaration(".design-watchlist-panel .design-panel-body", "overflow: hidden;")).toBe(true);
    expect(hasCssBlockWith(".design-watchlist-table-scroll", [
      "flex: 1;",
      "min-height: 0;",
      "overflow-y: auto;",
    ])).toBe(true);
    expect(hasCssDeclaration(".design-market-bottom .design-panel-body", "overflow-y: auto;")).toBe(true);
    expect(marketSurfaceSource).toContain('className="design-watchlist-table-scroll"');
    expect(marketSurfaceSource).not.toContain("sorted.slice(0, 5)");
    expect(marketSurfaceSource).not.toContain("sorted.slice().reverse().slice(0, 5)");
    expect(marketSurfaceSource).not.toContain("workspace.watchlist.slice(0, 5)");
  });

  test("lays out the market overview and stock screener without clipping dense results", () => {
    expect(hasCssBlockWith(".design-market-discovery", [
      "display: grid;",
      "gap: 10px;",
    ])).toBe(true);
    expect(hasCssDeclaration(
      ".design-market-overview-cards",
      "grid-template-columns: repeat(5, minmax(0, 1fr));",
    )).toBe(true);
    expect(hasCssBlockWith(".design-market-screener-form", [
      "display: grid;",
      "align-items: end;",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-market-screener-table", [
      "overflow-x: auto;",
      "overflow-y: auto;",
    ])).toBe(true);
  });

  test("keeps AI selection research-only, race-safe, scalable, and mobile readable", () => {
    const aiSelectionRequestSource = sourceBetween(
      "const runMarketAiSelection = useCallback",
      "const marketDiscoveryMarket =",
    );

    expect(appSource).toContain(
      "const marketAiSelectionRequestRef = useRef(createLatestRequestCoordinator());",
    );
    expect(aiSelectionRequestSource).toContain("marketAiSelectionRequestRef.current.begin()");
    expect(aiSelectionRequestSource).toContain(
      "marketAiSelectionRequestRef.current.isCurrent(token)",
    );
    expect(appSource).toContain('selectInstrument(instrument, "research", false)');
    expect(appSource).toContain('selectInstrument(instrument, "market", false)');
    expect(marketAiSelectionPanelSource).toContain('title="AI 选股"');
    expect(marketAiSelectionPanelSource).toContain("本结果仅切换研究上下文");
    expect(marketAiSelectionPanelSource).toContain("已排除 {result.exclusions.length} 项");
    expect(marketAiSelectionPanelSource).toContain(
      "setProviderId(event.currentTarget.value as AiReviewProviderId);\n              setExternalDataApproved(false);",
    );
    expect(marketAiSelectionPanelSource).not.toContain(
      'if (providerId === "local") {\n              setExternalDataApproved(false);',
    );
    expect(hasCssBlockWith(".design-market-ai-controls", [
      "display: grid;",
      "align-items: end;",
    ])).toBe(true);
    expect(hasCssDeclaration(
      ".design-market-ai-results article > header > div strong",
      "font-size: calc(11px * var(--aiqt-text-scale, 1));",
    )).toBe(true);
    expect(hasCssBlockWith("  .design-market-ai-controls", [
      "grid-template-columns: minmax(0, 1fr);",
    ])).toBe(true);
    expect(cssBlock(".design-market-ai-market-tabs button")).toContain("var(--surface-raised)");
  });

  test("keeps the separate market information page readable on desktop and mobile", () => {
    expect(hasCssBlockWith(".design-market-information-grid", [
      "display: grid;",
      "grid-template-columns: repeat(2, minmax(0, 1fr));",
      "gap: 10px;",
    ])).toBe(true);
    expect(hasCssDeclaration(
      ".design-market-information-news",
      "grid-column: 1 / -1;",
    )).toBe(true);
    expect(hasCssBlockWith("  .design-market-information-grid", [
      "grid-template-columns: minmax(0, 1fr);",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-market-information-market-tabs", [
      "margin-bottom: 8px;",
      "padding: 6px;",
      "border: 1px solid var(--border);",
    ])).toBe(true);
  });

  test("loads market information for its independent market selection and protects the latest request", () => {
    const marketInformationSource = sourceBetweenText(
      marketControllerSource,
      "const refreshMarketInformation = useCallback",
      "const selectMarketInformationMarket = useCallback",
    );

    expect(appSource).toContain(
      "const marketInformationRequestRef = useRef(createLatestRequestCoordinator());",
    );
    expect(appSource).toContain(
      "const marketInformationNewsRequestRef = useRef(createLatestRequestCoordinator());",
    );
    expect(appSource).toContain(
      "const [marketInformationMarket, setMarketInformationMarket] =",
    );
    expect(appShellRuntimeEffectsSource).toContain('activeWorkAreaId !== "market-information"');
    expect(marketInformationSource).toContain("marketInformationRequestRef.current.begin()");
    expect(marketInformationSource).toContain(
      "marketInformationRequestRef.current.isCurrent(requestToken)",
    );
    expect(marketInformationSource).toContain("const market = marketInformationMarket;");
    expect(marketInformationSource).toContain("const symbol = marketInformationSymbol;");
    expect(marketInformationSource).toContain("const name = marketInformationName;");
    expect(marketInformationSource).not.toContain(
      "const market = workspace.selectedInstrument.market;",
    );
    expect(marketInformationSource).toContain("const contextKey = `${market}:${symbol}:${name}`;");
    expect(marketInformationSource).toContain("name,");
    expect(marketInformationSource).toContain('section: "news",');
    expect(marketInformationSource.match(/limit: 20,/g)).toHaveLength(3);
    expect(marketInformationSource).toContain("offset,");
    expect(marketInformationSource).toContain("scope,");
    expect(appSource).toContain("market: marketInformationMarket,");
    expect(appSource).toContain("onMarketChange: selectMarketInformationMarket,");
    expect(appSource).toContain("onNewsPageChange: (offset, scope) =>");
    expect(marketInformationPageSource).not.toContain("filteredNews.slice(");
    expect(appSource).toMatch(
      /activeWorkAreaId === "market-information"\s*\? undefined\s*: automatedTradingGuide/,
    );
    expect(hasCssBlockWith(".design-market-information-pagination", [
      "display: flex;",
      "flex-wrap: wrap;",
      "justify-content: flex-end;",
    ])).toBe(true);
  });

  test("keeps the watchlist overview focused on counts and market distribution", () => {
    expect(
      hasCssDeclaration(
        ".design-watchlist-overview",
        "grid-template-rows: auto auto auto;",
      ),
    ).toBe(true);
    expect(hasCssDeclaration(".design-watchlist-overview", "flex: 0 0 auto;")).toBe(true);
    expect(hasCssDeclaration(".design-watchlist-overview", "gap: 8px;")).toBe(true);
    expect(hasCssBlockWith(".design-watchlist-market-breakdown", [
      "grid-auto-rows: 24px;",
      "align-content: start;",
    ])).toBe(true);
    expect(marketPageSource).not.toContain("workspace.watchlist.length < 8");
    expect(marketPageSource).not.toContain("design-watchlist-overview-foot");
    expect(marketPageSource).not.toContain("<span>当前标的</span>");
    expect(marketPageSource).not.toContain("<span>最近更新</span>");
  });

  test("removes legacy desktop row gaps from every workspace", () => {
    expect(styles).toContain("@media (min-width: 1301px) {");
    expect(hasCssBlockWith("  .terminal-main", [
      "row-gap: 0;",
    ])).toBe(true);
  });

  test("reserves desktop market rows for the workflow guide, header, and content", () => {
    expect(hasCssBlockWith("  .terminal-design-surface.surface-market", [
      "display: grid;",
      "grid-template-rows: auto auto auto minmax(0, 1fr);",
      "padding-bottom: 10px;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .surface-market .design-market-grid", [
      "grid-template-rows: 535px minmax(215px, 1fr);",
    ])).toBe(true);
  });

  test("aligns market recovery with the ranking row and reuses the market refresh action", () => {
    const marketSurfaceSource = marketPageSource;
    const compactMarketSideCss = styles;

    expect(marketSurfaceSource).toContain('className="design-market-side-top"');
    expect(marketSurfaceSource).toContain('className="design-market-retry-panel"');
    expect(marketSurfaceSource).toContain("onClick={action.onClick}");
    expect(marketSurfaceSource).toContain("disabled={action.disabled}");
    expect(hasCssBlockWith("  .design-market-side", [
      "grid-template-rows: 535px minmax(215px, 1fr);",
      "align-content: stretch;",
      "gap: 10px;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .design-market-side-top", [
      "grid-template-rows: repeat(4, minmax(0, 1fr));",
      "gap: 8px;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .design-market-side", [
      "grid-template-rows: 535px 215px;",
      "align-content: stretch;",
      "gap: 10px;",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-market-retry-action", [
      "align-self: flex-end;",
      "margin-top: 10px;",
    ])).toBe(true);
    expect(compactMarketSideCss).toContain(
      ".design-market-side-top .design-panel-head"
    );
    expect(compactMarketSideCss).toContain(
      ".design-market-side-top > .design-panel"
    );
    expect(compactMarketSideCss).toContain("flex-direction: column;");
    expect(compactMarketSideCss).toContain("justify-content: center;");
    expect(compactMarketSideCss).toContain("gap: 2px;");
    expect(compactMarketSideCss).toContain("min-height: 36px;");
    expect(compactMarketSideCss).toContain(
      ".design-market-side-top .design-kv-row"
    );
    expect(compactMarketSideCss).toContain("min-height: 24px;");
  });

  test("fills the desktop research workspace without orphan grid cells", () => {
    expect(hasCssDeclaration(".design-research-note-column", "align-content: stretch;")).toBe(true);
    expect(hasCssBlockWith(".design-research-note-field", [
      "grid-template-rows: auto minmax(160px, 1fr);",
      "align-content: start;",
    ])).toBe(true);
    expect(
      hasCssDeclaration(
        "  .terminal-design-surface.surface-research",
        "padding-bottom: 10px;",
      ),
    ).toBe(true);
    expect(hasCssBlockWith("  .design-research-grid", [
      "min-height: max(838px, calc(100vh - 180px));",
      "grid-template-rows: 420px 130px minmax(264px, 1fr);",
    ])).toBe(true);
    expect(hasCssBlockWith("  .design-research-chart", [
      "grid-column: 1;",
      "grid-row: 1 / 3;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .design-research-timeline", [
      "grid-column: 3 / 5;",
      "grid-row: 1;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .design-research-timeline .design-panel-body", [
      "align-content: start;",
      "overflow-y: auto;",
    ])).toBe(true);
    expect(cssBlock(".design-research-timeline .design-panel-body")).not.toContain(
      "grid-auto-rows: minmax(63px, 1fr);",
    );
    expect(hasCssBlockWith("  .design-research-runs", [
      "grid-column: 1 / 3;",
      "grid-row: 3;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .design-research-side", [
      "grid-column: 3 / 5;",
      "grid-row: 2 / 4;",
      "grid-template-columns: repeat(2, minmax(0, 1fr));",
      "grid-template-rows: repeat(2, minmax(0, 1fr));",
    ])).toBe(true);
    expect(hasCssBlockWith("  .design-research-side .design-panel-head", [
      "min-height: 30px;",
      "padding: 4px 8px;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .design-research-side .design-kv-row", [
      "min-height: 22px;",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-factor-score-ring", [
      "position: relative;",
      "width: 90px;",
      "height: 90px;",
      "border-radius: 999px;",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-factor-score-ring-visual", [
      "position: absolute;",
      "inset: 0;",
      "width: 100%;",
      "height: 100%;",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-factor-score-ring-value", [
      "stroke-linecap: round;",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-factor-score-ring > span", [
      "grid-template-rows: min-content min-content;",
      "align-content: center;",
      "row-gap: 2px;",
      "width: 76px;",
      "height: 76px;",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-factor-score-ring strong", [
      "font-size: calc(22px * var(--aiqt-text-scale, 1));",
      "font-weight: 500;",
    ])).toBe(true);
    expect(styles).toContain("@media (min-width: 1101px) and (max-width: 1300px) {");
    expect(hasCssBlockWith("  .design-research-grid", [
      "grid-template-columns: minmax(0, 1fr) minmax(300px, 0.65fr);",
      "grid-template-rows: 430px auto auto auto;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .design-factor-panel", [
      "display: flex;",
      "grid-column: 2;",
      "grid-row: 1;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .design-research-timeline", [
      "display: flex;",
      "grid-column: 1 / 3;",
      "grid-row: 2;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .design-research-side", [
      "grid-column: 1 / 3;",
      "grid-row: 4;",
      "grid-template-columns: repeat(2, minmax(0, 1fr));",
      "grid-template-rows: repeat(2, minmax(130px, auto));",
      "align-content: stretch;",
    ])).toBe(true);
    expect(styles).toContain("@media (min-width: 761px) and (max-width: 1100px) {");
    expect(
      styles.lastIndexOf("@media (min-width: 761px) and (max-width: 1100px) {"),
    ).toBeGreaterThan(styles.lastIndexOf("@media (max-width: 1100px) {"));
    expect(hasCssBlockWith(
      "  .design-factor-panel,\n  .design-research-timeline,\n  .design-research-runs,\n  .design-research-side,\n  .design-research-preparation",
      ["grid-column: 1;", "grid-row: auto;"],
    )).toBe(true);
  });

  test("keeps the backtest workspace balanced above the status bar", () => {
    expect(hasCssBlockWith("  .terminal-design-surface.surface-backtest", [
      "padding-bottom: 10px;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .surface-backtest .design-page-header > div:first-child", [
      "flex: 1 1 auto;",
      "grid-template-columns: max-content max-content;",
      "justify-content: start;",
    ])).toBe(true);
    expect(hasCssBlockWith(
      "  .surface-backtest .design-page-header .design-meta-line,\n  .surface-backtest .design-page-header .design-page-state",
      [
      "grid-column: 1 / -1;",
      ],
    )).toBe(true);
    expect(hasCssBlockWith("  .surface-backtest .design-backtest-grid", [
      "grid-template-columns: minmax(0, 1fr) clamp(280px, 24vw, 340px);",
      "align-items: stretch;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .surface-backtest .design-backtest-main", [
      "grid-template-rows: auto auto minmax(250px, 1fr);",
      "align-content: stretch;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .surface-backtest .design-backtest-side", [
      "grid-template-rows: auto auto auto minmax(0, 1fr);",
      "align-content: stretch;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .surface-backtest .design-backtest-grid", [
      "grid-template-columns: minmax(0, 1fr);",
    ])).toBe(true);
    expect(hasCssBlockWith("  .surface-backtest .design-backtest-side", [
      "grid-template-columns: repeat(2, minmax(0, 1fr));",
    ])).toBe(true);
  });

  test("keeps the AI review hierarchy compact, theme-aware, and responsive", () => {
    expect(hasCssBlockWith("  .terminal-design-surface.surface-ai-review", [
      "padding-bottom: 10px;",
    ])).toBe(true);
    expect(hasCssBlockWith(".surface-ai-review .design-ai-grid", [
      "grid-template-columns: minmax(0, 1fr) clamp(290px, 22vw, 350px);",
      "grid-template-rows: auto;",
      "align-items: start;",
    ])).toBe(true);
    expect(hasCssBlockWith(".surface-ai-review .design-ai-overview", [
      "grid-column: 1 / -1;",
      "grid-template-columns: repeat(4, minmax(0, 1fr));",
      "background: var(--surface);",
    ])).toBe(true);
    expect(hasCssBlockWith(".surface-ai-review .design-ai-verdict", [
      "min-height: 172px;",
      "background: var(--surface-raised);",
    ])).toBe(true);
    expect(hasCssBlockWith(".surface-ai-review .design-ai-side", [
      "grid-template-columns: repeat(2, minmax(0, 1fr));",
    ])).toBe(true);
    expect(hasCssBlockWith(".surface-ai-review .design-ai-external-approval", [
      "grid-template-columns: 16px minmax(0, 1fr);",
      "align-items: start;",
      "border: 1px solid var(--border);",
    ])).toBe(true);
    expect(hasCssBlockWith(".surface-ai-review .design-ai-external-approval-copy", [
      "display: grid;",
      "gap: 2px;",
    ])).toBe(true);
    expect(hasCssBlockWith("  .surface-ai-review .design-ai-overview,\n  .surface-ai-review .design-ai-verdicts,\n  .surface-ai-review .design-ai-side", [
      "grid-template-columns: minmax(0, 1fr);",
    ])).toBe(true);
  });

  test("navigates each Stage 4 review action to its actual evidence region", () => {
    const actionSource = sourceBetween(
      "const runPortfolioStage4PrimaryAction = useCallback",
      "const exportPortfolioBacktestMarkdown = useCallback"
    );
    expect(actionSource).toContain('"review-portfolio-risk": ".surface-portfolio .design-risk-ledger"');
    expect(actionSource).toContain('"review-portfolio-orders": ".surface-portfolio .portfolio-order-approval"');
    expect(actionSource).toContain('"review-route-risk": ".surface-portfolio .design-risk-ledger"');
    const refreshStart = actionSource.indexOf('if (actionId === "refresh-account-replay")');
    const refreshEnd = actionSource.indexOf('if (actionId === "record-stage4-workflow")');
    const refreshSource = actionSource.slice(refreshStart, refreshEnd);
    expect(refreshSource.indexOf("resetStage4PortfolioBusyState()"))
      .toBeLessThan(refreshSource.indexOf("portfolioStage4RequestCoordinatorRef.current.invalidate("));
  });

  test("stacks the Stage 4 steps at mobile width without horizontal overflow", () => {
    expect(cssBlock(".portfolio-stage4-steps")).toContain("grid-template-columns: repeat(5, minmax(0, 1fr));");
    expect(cssBlock(".portfolio-stage4-section")).toContain("min-width: 0;");
    expect(cssBlock(".portfolio-stage4-hash")).toContain("overflow-wrap: anywhere;");
    expect(cssBlock(".terminal-panel")).toContain("grid-template-columns: minmax(0, 1fr);");
    expect(cssBlock(".paper-blotter")).toContain("min-width: 0;");
    expect(hasCssDeclaration(".paper-blotter-table", "min-width: 0;")).toBe(true);
    expect(hasCssBlockWith("  .portfolio-stage4-steps", ["grid-template-columns: 1fr;"])).toBe(true);
    expect(hasCssBlockWith("  .portfolio-stage4-primary", ["width: 100%;"])).toBe(true);
    expect(hasCssBlockWith("  .paper-blotter-row.portfolio-order-row", ["grid-template-columns: 1fr;"])).toBe(true);
    expect(styles).toContain("  .portfolio-order-approval-row,\n  .portfolio-order-simulation-row,");
    expect(hasCssBlockWith("  .portfolio-paper-ops-row", ["grid-template-columns: 1fr;"])).toBe(true);
    expect(hasCssBlockWith('  .promotion-queue [class*="-evidence-row"]', ["grid-template-columns: 1fr;"])).toBe(true);
  });

  test("keeps M5 account risk tables inside the existing portfolio surface without synthetic pass rows", () => {
    expect(portfolioPageSource).toContain("<PortfolioM5Section");
    expect(portfolioPageSource).toContain("allocation.currentWeight");
    expect(portfolioPageSource).not.toContain("组合年化波动率");
    expect(portfolioM5SectionSource).toContain("读取阶段 4 模拟账户回放");
    expect(portfolioM5SectionSource).toContain("该评估不写入生产风险链");
    expect(portfolioM5SectionSource).toContain('className="portfolio-m5-table-scroll"');
    expect(cssBlock(".portfolio-m5-section")).toContain("min-width: 0;");
    expect(cssBlock(".portfolio-m5-table-scroll")).toContain("overflow-x: auto;");
    expect(cssBlock(".portfolio-m5-two-column")).toContain(
      "grid-template-columns: minmax(420px, 0.85fr) minmax(560px, 1.15fr);"
    );
    expect(hasCssBlockWith("  .portfolio-m5-two-column", ["grid-template-columns: minmax(0, 1fr);"])).toBe(true);
    expect(styles).toContain(
      ".portfolio-m5-section,\n  .design-portfolio-production-risk {\n    grid-column: 1;"
    );
  });

  test("keeps the M4 research loop inside the real AI review surface without horizontal overflow", () => {
    expect(appSource).toContain('import { AiResearchM4Section } from "../../../components/AiResearchM4Section";');
    expect(appSource).toContain("researchLoop: (");
    expect(aiReviewContractSource).toContain("researchLoop?: ReactNode;");
    expect(aiReviewPanelSource).toContain("{aiReview.researchLoop}");
    expect(aiResearchM4SectionSource).toContain("researchContextOnly=true");
    expect(aiResearchM4SectionSource).toContain("affectsOrderRouting=false");
    expect(cssBlock("  .surface-ai-review .design-ai-main > .ai-research-m4-section")).toContain(
      "grid-column: 1 / 3;"
    );
    expect(cssBlock(".ai-research-m4-section,\n.ai-research-m4-result")).toContain("min-width: 0;");
    expect(cssBlock(".ai-research-m4-table-wrap")).toContain("overflow-x: auto;");
    expect(cssBlock(".ai-research-m4-claims")).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(cssBlock(
      "  .ai-research-m4-financial-grid,\n  .ai-research-m4-score-grid,\n  .ai-research-m4-claims,\n  .ai-research-m4-views,\n  .ai-research-m4-outcomes dl"
    )).toContain("grid-template-columns: 1fr;");
    expect(cssBlock(".surface-ai-review .ai-research-m4-section .ai-review-stage3-card")).toContain(
      "background: var(--surface-raised);"
    );
    expect(cssBlock(".surface-ai-review .ai-research-m4-section .ai-review-stage3-boundary")).toContain(
      "background: var(--surface-raised);"
    );
    expect(cssBlock(".surface-ai-review .ai-research-m4-section .ai-research-m4-config select")).toContain(
      "background: var(--surface-raised);"
    );
  });

  test("aligns AI review decision and M4 typography with the compact page scale", () => {
    expect(cssBlock(
      ".surface-ai-review .design-ai-decision-form input,\n.surface-ai-review .design-ai-decision-form select,\n.surface-ai-review .design-ai-decision-form textarea"
    )).toContain("font-size: calc(10.5px * var(--aiqt-text-scale, 1));");
    expect(cssBlock(".surface-ai-review .ai-research-m4-section")).toContain(
      "font-size: calc(10px * var(--aiqt-text-scale, 1));"
    );
    expect(cssBlock(
      ".surface-ai-review .ai-research-m4-section .ai-review-stage3-heading span,\n.surface-ai-review .ai-research-m4-section .ai-review-stage3-card label > span"
    )).toContain("font-size: calc(9.5px * var(--aiqt-text-scale, 1));");
    expect(cssBlock(".surface-ai-review .ai-research-m4-section .ai-review-stage3-heading strong")).toContain(
      "font-size: calc(13.5px * var(--aiqt-text-scale, 1));"
    );
    expect(hasCssBlockWith(
      ".surface-ai-review .ai-research-m4-section .ai-review-stage3-card h3",
      ["font-size: calc(10.5px * var(--aiqt-text-scale, 1));"]
    )).toBe(true);
  });

  test("uses the page primary action treatment for M4 actions", () => {
    expect(aiResearchM4SectionSource).toContain(
      'className="design-primary-action"\n              data-testid="ai-research-m4-create"'
    );
    expect(cssBlock(
      ".surface-ai-review .ai-research-m4-section .ai-review-stage3-actions .design-primary-action"
    )).toContain("font-size: calc(11.5px * var(--aiqt-text-scale, 1));");
  });

  test("matches the comparison panel height to the AI review conclusion", () => {
    expect(hasCssBlockWith(".surface-ai-review .design-ai-grid", [
      "--ai-review-conclusion-height: 343px;",
    ])).toBe(true);
    expect(cssBlock(
      ".surface-ai-review .design-ai-review,\n.surface-ai-review .design-ai-side > .design-panel:first-child"
    )).toContain("height: var(--ai-review-conclusion-height);");
    expect(hasCssBlockWith(
      ".surface-ai-review .design-ai-side > .design-panel:first-child",
      ["grid-template-rows: auto minmax(0, 1fr);"]
    )).toBe(true);
    const comparisonList = cssBlock(".surface-ai-review .design-ai-comparison-list");
    expect(comparisonList).toContain("max-height: 100%;");
    expect(comparisonList).toContain("overflow-y: auto;");
    expect(hasCssBlockWith(
      "  .surface-ai-review .design-ai-review,\n  .surface-ai-review .design-ai-side > .design-panel:first-child",
      ["height: auto;"]
    )).toBe(true);
  });

  test("owns Stage 3 authority state in App and re-reads the Decision chain after append", () => {
    const appendSource = sourceBetweenText(
      aiReviewControllerSource,
      "const appendAiReviewStage3Decision = useCallback",
      "const refreshAiReviewRunHistory = useCallback"
    );
    expect(appSource).toContain("aiReviewStage3RequestCoordinatorRef");
    expect(appSource).toContain("createAiReviewRequestCoordinator()");
    expect(appSource).not.toContain(".observeScope(");
    expect(appSource).toContain("useLayoutEffect");
    expect(appShellRuntimeEffectsSource).toContain("useLayoutEffect(() => {\n      const coordinator = aiReviewStage3RequestCoordinatorRef.current!;");
    expect(appSource).toContain("coordinator.beginContext(aiReviewStage3ContextKey)");
    expect(appSource).toContain('coordinator.beginReview("running")');
    expect(appSource).toContain('coordinator.beginReview("appending")');
    expect(appendSource).toContain("appendAiReviewDecisionAndReadback({");
    expect(appendSource).toContain("appendAiReviewDecision(");
    expect(appendSource).toContain("loadAiReviewDecisions(");
    expect(appendSource).toContain("setAiReviewStage3Decisions(result.decisions)");
    expect(aiReviewStage3SectionSource).toContain("AI_REVIEW_EXTERNAL_DATA_FIELDS.map");
    expect(aiReviewStage3SectionSource).toContain("buildAiReviewAssessmentColumns(currentReview)");
    expect(aiReviewStage3SectionSource).toContain("legacyHistory.map");
    expect(aiReviewStage3SectionSource).toContain("canRunAiReviewStage3({");
    expect(appSource).toContain("请先授权已完成 K 线与证据");
    expect(appSource).toContain("请先在评审设置中允许发送本次已完成 K 线与证据。");
  });

  test("restores a URL-bound AI review run without weakening audit deep links or stale-request guards", () => {
    const refreshWorkspaceSource = sourceBetweenText(
      appShellSelectionControllerSource,
      "const refreshWorkspace = useCallback",
      "const selectInstrument = useCallback"
    );
    const stage3ContextSource = sourceBetweenText(
      appShellRuntimeEffectsSource,
      "useLayoutEffect(() => {\n      const coordinator = aiReviewStage3RequestCoordinatorRef.current!;",
      "useLayoutEffect(() => {\n      const primary = resolveAiReviewPrimaryExperiment("
    );
    expect(appSource).toContain("resolveAiReviewRunIdFromUrl(window.location.search)");
    expect(appSource).toContain("replaceAiReviewRunIdInUrl(");
    expect(appSource).toContain("currentResearchRunId");
    expect(refreshWorkspaceSource).toContain("new AbortController()");
    expect(refreshWorkspaceSource).toMatch(/requestedAiReviewRunId,\s*restoreController\.signal/);
    expect(refreshWorkspaceSource).toContain("manualSelectionVersionRef.current === startedSelectionVersion");
    expect(refreshWorkspaceSource).toContain('strategyExperimentI18nRef.current.t("aiReviewStage3.error.runRestoreFailed")');
    expect(appSource).toMatch(/if \(activeWorkAreaId !== "ai-review" && activeWorkAreaId !== "execution"\) \{\s*initialAiReviewRunIdRef\.current = null;/);
    expect(appSource).toContain("aiReviewRunRestoreAbortControllerRef.current?.abort()");
    expect(stage3ContextSource).toContain("loadAiReviewRunArchiveSnapshot(");
    expect(stage3ContextSource).toContain("resolveAiReviewRestoredSelection(");
    expect(stage3ContextSource).toContain('if (archiveResult.source === "core" && restoredSelection)');
    expect(stage3ContextSource).not.toContain('if (archiveResult.source === "core" && restoredSelection && restoredExperiment)');
    expect(stage3ContextSource).toContain("setAiReviewStage3Decisions(restoredSelection.decisions)");
    expect(stage3ContextSource).toContain(": restoredSelection === null");
    expect(appSource).toContain("experiments: aiReviewStage3Experiments");
    expect(appSource).toContain("onComparisonToggle: toggleAiReviewStage3Comparison");
  });

  test("splits production vendor dependencies instead of emitting one large entry chunk", () => {
    expect(viteConfig).toContain("rolldownOptions");
    expect(viteConfig).toContain("codeSplitting");
    expect(viteConfig).toContain('name: "app-workbench"');
    expect(viteConfig).toContain('name: "app-terminal-api"');
    expect(viteConfig).toContain('name: "app-audit-panels"');
    expect(viteConfig).toContain('name: "app-i18n"');
    expect(viteConfig).toContain('name: "vendor-charts"');
    expect(viteConfig).toContain('name: "vendor-icons"');
    expect(viteConfig).toContain('name: "vendor-react"');
    expect(viteConfig).toContain("chunkSizeWarningLimit: 650");
  });

  test("uses product work areas as the primary left navigation", () => {
    const leftRailSource = sourceBetween('<aside className="left-rail">', "</aside>");

    expect(appSource).toContain("buildProductWorkAreas(workspace)");
    expect(appSource).toContain("resolveInitialWorkAreaId");
    expect(appSource).toContain('new URLSearchParams(window.location.search).get("workspace")');
    expect(appSource).toContain(
      'resolveInitialWorkAreaId(resolveSavedResearchWorkspaceId(workspace, "market"))'
    );
    expect(appSource).toContain("productWorkAreaGroups.map");
    expect(appSource).toContain('className={`work-area-button');
    expect(appSource).toContain("i18n.productWorkAreaLabel");
    expect(appSource).not.toContain("i18n.productWorkAreaDescription(area)");
    expect(appSource).not.toContain("i18n.productWorkAreaDeliveryStage(area)");
    expect(appSource).not.toContain("i18n.productDevelopmentStageStatus(area.deliveryStageStatus)");
    expect(leftRailSource).not.toContain("workspace.quantLoop.map");
  });

  test("shows selected timeframe cache coverage in market search suggestions", () => {
    const symbolSwitcherSource = sourceBetween('<form className="symbol-switcher"', "</form>");

    expect(appSource).toContain("const searchMarket = resolveMarketSearchMarket(marketDraft, query);");
    expect(appSource).toContain("loadMarketSearch(quantCoreBaseUrl, { market: searchMarket, query, limit: 8, timeframe: workspace.selectedTimeframe })");
    expect(symbolSwitcherSource).toContain("suggestion.cache");
    expect(symbolSwitcherSource).toContain("marketSearchCacheSummary(i18n, suggestion.cache)");
    expect(appSource).toContain('cache.freshness === "stale"');
    expect(appSource).toContain('"历史数据"');
    expect(styles).toContain(".symbol-suggestion-cache");
  });

  test("keeps market search results compact, readable, and scrollable", () => {
    expect(styles).not.toContain(".symbol-switcher button");
    expect(styles).toContain(".symbol-switcher > button");
    expect(hasCssDeclaration(".symbol-suggestions", "display: grid;")).toBe(true);
    expect(hasCssDeclaration(".symbol-suggestions", "gap: 0;")).toBe(true);
    expect(hasCssDeclaration(".symbol-suggestions", "overflow: auto;")).toBe(true);
    expect(hasCssDeclaration(".symbol-suggestion-row", "grid-template-columns: minmax(0, 1fr) auto;")).toBe(true);
    expect(hasCssDeclaration(".symbol-suggestion-row", "border-radius: 0;")).toBe(true);
    expect(hasCssDeclaration(".symbol-suggestion-select", "min-width: 0;")).toBe(true);
    expect(hasCssDeclaration(".symbol-suggestions .symbol-suggestion-refresh", "width: auto;")).toBe(true);
    expect(hasCssDeclaration(".symbol-suggestions .symbol-suggestion-refresh", "white-space: nowrap;")).toBe(true);
    expect(hasCssDeclaration(".symbol-suggestions .symbol-suggestion-refresh", "min-height: 30px;")).toBe(true);
    expect(hasCssDeclaration(".symbol-suggestion-select:only-child", "grid-column: 1 / -1;")).toBe(true);
    expect(styles).toContain(".symbol-suggestion-meta");
    expect(
      hasCssDeclaration(
        '.terminal-shell[data-theme="light"] .symbol-suggestions .symbol-suggestion-refresh',
        "background: #eef7f4;"
      )
    ).toBe(true);
    expect(
      hasCssDeclaration(
        '.terminal-shell[data-theme="light"] .symbol-suggestions button strong',
        "color: #213346;"
      )
    ).toBe(true);
  });

  test("only searches while the symbol suggestion popover is open", () => {
    const selectTimeframeSource = sourceBetweenText(appShellSelectionControllerSource, "const selectTimeframe = useCallback(", "const selectProductWorkArea");
    const symbolSearchEffect = sourceBetweenText(
      appShellRuntimeEffectsSource,
      "useEffect(() => {\n      const query = symbolDraft.trim();",
      "useEffect(() => {\n      if (!isChartExpanded)"
    );

    expect(selectTimeframeSource).toContain("setSearchSuggestions([]);");
    expect(selectTimeframeSource).toContain("setIsSearchOpen(false);");
    expect(symbolSearchEffect).toContain("if (!isSearchOpen)");
    expect(symbolSearchEffect).toContain(
      "}, [isSearchOpen, marketDraft, symbolDraft, workspace.selectedTimeframe]);"
    );
    expect(appSource).not.toContain("skipNextSymbolSearchRef");
  });

  test("keeps global symbol search selections in the current work area", () => {
    const selectInstrumentSource = sourceBetween("const selectInstrument = useCallback(", "const researchMarketAiSelectionCandidate");
    const submitSymbolSource = sourceBetween("const submitSymbol = useCallback(", "const selectSearchSuggestion");
    const selectSuggestionSource = sourceBetween("const selectSearchSuggestion = useCallback(", "const refreshSearchSuggestionCache");
    const refreshSuggestionSource = sourceBetween("const refreshSearchSuggestionCache = useCallback(", "useEffect(() =>");
    const terminalSurfaceSource = sourceBetween(
      'activeWorkAreaId === "dynamic-trading" || !terminalSurfaceDisplayAction ? null : (',
      '{activeWorkAreaId === "dynamic-trading" ? ('
    );

    expect(selectInstrumentSource).toContain('targetWorkAreaId: ProductWorkAreaId = "research"');
    expect(selectInstrumentSource).toContain("setActiveWorkAreaId(targetWorkAreaId);");
    expect(submitSymbolSource).toContain("selectInstrument(instrument, activeWorkAreaId);");
    expect(selectSuggestionSource).toMatch(/selectInstrument\([\s\S]*?,\s*activeWorkAreaId\s*\);/);
    expect(refreshSuggestionSource).toMatch(/selectInstrument\([\s\S]*?,\s*activeWorkAreaId\s*\);/);
    expect(terminalSurfaceSource).toContain(
      'onSelectInstrument={(instrument) => selectInstrument(instrument, "market")}'
    );
  });

  test("lets stale or empty market search suggestions refresh cache without nested buttons", () => {
    const symbolSwitcherSource = sourceBetween('<form className="symbol-switcher"', "</form>");

    expect(appSource).toContain("const refreshSearchSuggestionCache = useCallback(");
    expect(appSource).toContain("await refreshCacheContext({");
    expect(appSource).toContain("marketSearchRefreshLabel(i18n, suggestion)");
    expect(appSource).toContain('return i18n.locale === "zh-CN" ? "更新" : "Update";');
    expect(appSource).toContain('return i18n.locale === "zh-CN" ? "获取" : "Fetch";');
    expect(appSource).toContain("timeframe: workspace.selectedTimeframe");
    expect(symbolSwitcherSource).toContain('className="symbol-suggestion-row"');
    expect(symbolSwitcherSource).toContain('className="symbol-suggestion-select"');
    expect(symbolSwitcherSource).not.toContain('role="listbox"');
    expect(symbolSwitcherSource).not.toContain('role="option"');
    expect(symbolSwitcherSource).toContain("marketSearchRefreshLabel(i18n, suggestion)} ${suggestion.symbol}");
    expect(symbolSwitcherSource).toContain("canRefreshSearchSuggestionCache(suggestion)");
    expect(symbolSwitcherSource).toContain("refreshSearchSuggestionCache(suggestion)");
    expect(symbolSwitcherSource).toContain('className="symbol-suggestion-refresh"');
    expect(styles).toContain(".symbol-suggestion-row");
    expect(styles).toContain(".symbol-suggestion-refresh");
  });

  test("exposes a shareable Stage 1 research context link in the topbar", () => {
    const topbarSource = sourceBetween('<header className="terminal-topbar">', "</header>");
    const copyResearchContextLinkSource = sourceBetween(
      "const copyResearchContextLink = useCallback",
      "}, [activeWorkAreaId, researchPipelinePreflight.lockedPreparationEvidence?.runId, selectedWatchlistCacheRefreshRunId, workspace]);"
    );

    expect(appSource).toContain("buildResearchContextDeepLink");
    expect(copyResearchContextLinkSource).toContain("watchlistRefreshRunId:");
    expect(copyResearchContextLinkSource).toContain("researchPipelinePreflight.lockedPreparationEvidence?.runId ?? selectedWatchlistCacheRefreshRunId");
    expect(copyResearchContextLinkSource).toContain("navigator.clipboard.writeText");
    expect(topbarSource).toContain('className="context-link-button"');
    expect(topbarSource).toContain("copyResearchContextLink");
    expect(topbarSource).toContain("action.copyResearchContextLink");
    expect(topbarSource).toContain("action.researchContextLinkCopied");
    expect(cssBlock(".context-link-button")).toContain("display: inline-flex;");
  });

  test("uses the left rail for actionable product work areas instead of passive module switching", () => {
    const leftRailSource = sourceBetween('<aside className="left-rail">', "</aside>");

    expect(appSource).toContain("resolveInitialWorkAreaId");
    expect(appSource).toContain('url.searchParams.set("workspace", activeWorkAreaId)');
    expect(appSource).toContain('url.searchParams.delete("workflow")');
    expect(appSource).not.toContain('className="work-area-index"');
    expect(appSource).toContain('className="work-area-copy"');
    expect(appSource).not.toContain('className="work-area-status"');
    expect(appSource).not.toContain('className="work-area-stage"');
    expect(appSource).toContain('activeWorkAreaId === area.id ? "selected active" : ""');
    expect(leftRailSource).not.toContain('i18n.t("section.terminalModules")');
    expect(leftRailSource).not.toContain('className="module-list"');
  });

  test("keeps workspace scroll positions independent inside the bounded surface", () => {
    expect(appSource).not.toContain('<aside className="agent-rail">');
    expect(cssBlock(".terminal-shell")).toContain("min-height: 100vh;");
    expect(cssBlock(".terminal-shell")).toContain("grid-template-columns: 208px minmax(0, 1fr);");
    expect(hasCssDeclaration(".terminal-main", "overflow: hidden;")).toBe(true);
    expect(hasCssDeclaration(".terminal-main", "grid-template-rows: minmax(0, 1fr);")).toBe(true);
    expect(hasCssDeclaration(".terminal-main", "align-content: stretch;")).toBe(true);
    expect(hasCssDeclaration(".terminal-design-surface", "overflow: auto;")).toBe(true);
    expect(hasCssDeclaration(".terminal-design-surface", "overscroll-behavior-y: none;")).toBe(true);
    expect(hasCssDeclaration(".terminal-design-surface", "padding: 12px 14px 0;")).toBe(true);
    expect(appSource).toContain("workspaceScrollPositionsRef");
    expect(appSource).toContain("activeWorkAreaIdRef");
    expect(appSource).toContain("activeWorkspaceSurfaceRef");
    expect(appSource).toContain("activeWorkAreaIdRef.current = activeWorkAreaId;");
    expect(appSource).toContain("const workAreaId = activeWorkAreaIdRef.current;");
    expect(appSource).not.toContain("workspaceScrollPositionsRef.current[activeWorkAreaId] =");
    expect(appSource).toContain("activeWorkspaceSurfaceRef.current.scrollTop =");
    expect(appSource).toContain("rememberActiveWorkspaceScrollPosition");
    expect(appSource).toContain('window.addEventListener("scroll", rememberWindowScroll, { passive: true });');
    expect(appSource).toContain("window.scrollTo(0, position.windowTop);");
    expect(appSource).toContain("surfaceRef={activeWorkspaceSurfaceRef}");
    expect(terminalWorkspaceSurfaceSource).toContain("ref={props.surfaceRef}");
    expect(terminalWorkspaceSurfaceSource).toContain(
      "onScroll={(event) => props.onScrollPositionChange(event.currentTarget.scrollTop)}"
    );
    expect(cssBlock(".brand > div")).toContain("display: block;");
    expect(cssBlock(".work-area-button")).toContain("grid-template-columns: 18px minmax(0, 1fr);");
    expect(hasCssDeclaration(".work-area-copy", "display: block;")).toBe(true);
    expect(cssBlock(".work-area-stage")).toContain("display: flex;");
    expect(hasCssDeclaration(".work-area-copy small", "display: block;")).toBe(true);
  });

  test("hands narrow workspace scrolling to the document", () => {
    const mobileScrollGuard = globalStyles.slice(globalStyles.lastIndexOf("@media (max-width: 760px) {"));

    expect(mobileScrollGuard).toContain("  .terminal-design-surface {");
    expect(mobileScrollGuard).toContain("overflow: visible;");
    expect(mobileScrollGuard).toContain("overscroll-behavior-y: auto;");
  });

  test("follows streamed research note text to the final line", () => {
    expect(researchPageSource).toContain(
      "const researchNoteInputRef = useRef<HTMLTextAreaElement>(null);"
    );
    expect(researchPageSource).toContain("ref={researchNoteInputRef}");
    expect(researchPageSource).toContain(
      "researchNoteInput.scrollTop = researchNoteInput.scrollHeight;"
    );
    expect(researchPageSource).toContain(
      "researchPreparation.isGeneratingNote"
    );
  });

  test("keeps the left navigation readable on desktop before collapsing to icon mode", () => {
    expect(cssBlock(".terminal-shell")).toContain("grid-template-columns: 208px minmax(0, 1fr);");
    expect(hasCssDeclaration(".left-rail", "padding: 14px;")).toBe(true);
    expect(cssBlock(".work-area-button")).toContain("min-height: 36px;");
    expect(cssBlock(".work-area-copy small")).toContain("display: block;");
    expect(styles).toContain("@media (max-width: 960px)");
    expect(styles).not.toContain("@media (max-width: 1180px)");
    expect(hasCssBlockWith("  .terminal-shell", ["grid-template-columns: 68px minmax(0, 1fr);"])).toBe(true);
  });

  test("keeps blocked product work areas clickable so users can inspect gate reasons", () => {
    const leftRailSource = sourceBetween('<aside className="left-rail">', "</aside>");

    expect(leftRailSource).not.toContain('disabled={area.status === "blocked"}');
    expect(cssBlock(".work-area-button.blocked")).toContain("border-color: #7a3a32;");
  });

  test("keeps decorative navigation state inside the button hit target", () => {
    expect(styles).not.toContain(".left-rail .work-area-button::before");
    expect(
      hasCssBlockWith(".work-area-button.selected,\n.work-area-button.active", [
        "border-left: 3px solid #58d6b9;"
      ])
    ).toBe(true);
  });

  test("uses the approved grouped terminal shell, branded logo, and persistent safety status", () => {
    const leftRailSource = sourceBetween('<aside className="left-rail">', "</aside>");
    const topbarSource = sourceBetween('<header className="terminal-topbar">', "</header>");
    const footerSource = sourceBetween('<footer className="terminal-status-bar"', "</footer>");

    expect(appSource).toContain('src="/aiqt-logo.png"');
    expect(appSource).toContain("productWorkAreaGroups.map");
    expect(leftRailSource).toContain('className="work-area-group-label"');
    expect(leftRailSource).toContain('className="rail-profile"');
    expect(cssBlock(".workspace-command-center[hidden]")).toContain("display: none;");
    expect(cssBlock(".workspace-command-center-body")).toContain("display: grid;");
    const executionReadinessSource = sourceBetween(
      "const executionReadinessStack = (",
      "const executionAcceptanceAuditPanel = ("
    );
    expect(appSource).toContain('className="execution-readiness-stack"');
    expect(appSource).toContain("data-live-authorized={executionLiveTradingAllowed}");
    expect(executionReadinessSource).toContain("<ExecutionAutoPaperTradingSection");
    expect(executionReadinessSource).toContain("onSafetyChange={syncExecutionSafety}");
    expect(executionReadinessSource).toContain("onSnapshotChange={setAutoTradingSnapshot}");
    expect(executionReadinessSource).toContain("<ExecutionStage10ProductionExecutionSection");
    expect(executionReadinessSource).toContain("autoTradingSnapshot={autoTradingSnapshot}");
    expect(executionReadinessSource).toContain("onAutoLiveAuthorized={completeLiveTradingGate}");
    expect((appSource.match(/onSnapshotChange=\{setAutoTradingSnapshot\}/g) ?? [])).toHaveLength(1);
    expect((appSource.match(/onSnapshotChange=\{updateAutoTradingSnapshot\}/g) ?? [])).toHaveLength(1);
    expect(appSource).toContain("const snapshot = await loadAutoTradingSnapshot(quantCoreBaseUrl);");
    expect(executionAutoPaperTradingSource).toContain("commitSnapshot(null);");
    expect(executionPageSource).toContain("自动交易运行状态暂不可用");
    expect(executionReadinessSource).not.toContain("<ExecutionStage5ShadowSection");
    expect(executionReadinessSource).not.toContain("<ExecutionStage6SandboxSection");
    expect(executionReadinessSource).not.toContain("<ExecutionStage7ProductionReadonlySection");
    expect(executionReadinessSource).not.toContain("<ExecutionStage9ProductionAdmissionSection");
    expect((appSource.match(/onSafetyChange=\{syncExecutionSafety\}/g) ?? [])).toHaveLength(2);
    expect(executionAutoPaperTradingSource).toContain(
      "onSafetyChange?.(snapshot.state.executionMode, snapshot.liveTradingAllowed)"
    );
    expect(appSource).toContain('"生产会话有效"');
    expect(appSource).toContain("executionSnapshot={autoTradingSnapshot}");
    expect(cssBlock(".execution-readiness-stack")).toContain("grid-area: stage5;");
    expect(cssBlock('.execution-readiness-stack[data-live-authorized="true"]')).toContain(
      "border-color: color-mix(in srgb, var(--teal) 55%, var(--border));"
    );
    expect(hasCssDeclaration(".execution-testnet-safety", "grid-template-columns: minmax(0, 1fr) auto auto;")).toBe(true);
    expect(hasCssDeclaration(".execution-stage5-shadow", "border: 1px solid var(--border-strong);")).toBe(true);
    expect(hasCssDeclaration(".execution-stage5-shadow", "background: var(--surface);")).toBe(true);
    expect(hasCssDeclaration(".execution-stage5-shadow", "font-size: calc(10.5px * var(--aiqt-text-scale, 1));")).toBe(true);
    expect(hasCssDeclaration(".execution-stage5-shadow header h2", "color: var(--text);")).toBe(true);
    expect(hasCssDeclaration(".execution-stage5-shadow header h2", "font-size: calc(13.5px * var(--aiqt-text-scale, 1));")).toBe(true);
    expect(hasCssDeclaration(".execution-stage5-shadow header span", "color: var(--muted);")).toBe(true);
    expect(hasCssDeclaration(".execution-stage5-shadow header p", "font-size: calc(10.5px * var(--aiqt-text-scale, 1));")).toBe(true);
    expect(hasCssDeclaration(".execution-stage5-shadow > button", "font-size: calc(11.5px * var(--aiqt-text-scale, 1));")).toBe(true);
    expect(hasCssDeclaration(".execution-stage5-shadow details", "font-size: calc(10px * var(--aiqt-text-scale, 1));")).toBe(true);
    expect(footerSource).toContain('className="terminal-live-block"');
    expect(appSource).toContain("const footerExecutionSafety = settingsStatus.settings?.safety;");
    expect(appSource).toContain("const currentExecutionModeLabel =");
    expect(appSource).toContain("const currentExecutionVenueLabel =");
    expect(appSource).toContain("const currentLiveBadgeLabel =");
    expect(topbarSource).toContain("{currentExecutionModeLabel}");
    expect(topbarSource).toContain("{currentLiveBadgeLabel}");
    expect(topbarSource).not.toContain(">纸面 / 测试网<");
    expect(topbarSource).not.toContain(">实盘需授权<");
    expect(footerSource).toContain("{currentExecutionVenueLabel}");
    expect(footerSource).toContain("{currentExecutionModeLabel}");
    expect(footerSource).not.toContain("<span>Paper Broker</span>");
    expect(footerSource).not.toContain("i18n.executionMode(workspace.execution)");
    expect(appSource).toContain('"生产权限证据已过期"');
    expect(footerSource).toContain("{footerExecutionStatus}");
    expect(footerSource).toContain("{footerExecutionDetail}");
    expect(footerSource).not.toContain('i18n.locale === "zh-CN" ? "需 Stage 10 与二次确认"');
    expect(cssBlock(".terminal-status-bar")).toContain("position: fixed;");
    expect(hasCssDeclaration(".terminal-live-block", "border: 1px solid #8b2d2d;")).toBe(true);
    expect(hasCssDeclaration(".terminal-live-badge.authorized", "color: var(--teal);")).toBe(true);
    expect(hasCssDeclaration(".terminal-status-item.live strong", "color: var(--teal);")).toBe(true);
    expect(cssBlock(".terminal-live-block > strong")).toContain("grid-area: status;");
    expect(cssBlock(".terminal-live-block > strong")).toContain("min-height: 12px;");
    expect(styles).toContain(".terminal-live-block > span,\n  .terminal-live-block small {\n    display: block;");
    expect(styles).toContain("--canvas: #090d13;");
    expect(styles).toContain("--teal: #71dfc5;");
    expect(cssBlock("h1")).toContain("white-space: nowrap;");
  });

  test("follows system theme changes while keeping a session manual toggle", () => {
    const leftRailSource = navigationRailSource;
    const topbarSource = terminalTopbarSource;
    const chartSource = sourceBetween("function KlineChartCanvas", "function toKlineChartData");

    expect(appSource).not.toContain('activeWorkAreaId === "market" ? colorScheme : "dark"');
    expect(appSource).not.toContain("appliedColorScheme");
    expect(appSource).toContain('data-theme={controller.colorScheme}');
    expect(appSource).toContain('window.matchMedia("(prefers-color-scheme: dark)")');
    expect(appSource).toContain('media.addEventListener("change", syncSystemColorScheme)');
    expect(appSource).toContain("setColorSchemePreference(null)");
    expect(appSource).not.toContain('window.localStorage.setItem("aiqt.theme"');
    expect(appSource).not.toContain('window.localStorage.getItem("aiqt.theme"');
    expect(leftRailSource).not.toContain('role="switch"');
    expect(leftRailSource).not.toContain("rail-profile-controls");
    expect(leftRailSource).not.toContain("data-theme-available");
    expect(topbarSource).toContain('className="panel-icon-button theme-toggle-button"');
    expect(topbarSource).toContain("aria-label={colorSchemeToggleLabel}");
    expect(topbarSource).toContain("onClick={toggleColorScheme}");
    expect(appSource).toContain('setColorSchemePreference(colorScheme === "dark" ? "light" : "dark")');
    expect(topbarSource).toContain('colorScheme === "dark" ? <Sun size={16} /> : <Moon size={16} />');
    expect(topbarSource).not.toContain('className="terminal-notification"');
    expect(topbarSource).not.toContain('className="terminal-top-avatar"');
    expect(chartSource).toContain("styles: colorScheme");
    expect(chartSource).toContain("setStyles(colorScheme)");
    expect(styles).toContain(':root[data-theme="light"]');
    expect(styles).toContain('.terminal-shell[data-theme="light"]');
    expect(styles).not.toContain("data-theme-available");
    expect(styles).not.toContain("rail-profile-controls");
    expect(cssBlock(".theme-toggle-button")).toContain("color: #e8be62;");
    expect(styles).toContain('.terminal-shell[data-theme="light"] .theme-toggle-button');
    expect(indexHtmlSource).toContain('<link rel="icon" type="image/png" href="/aiqt-logo.png" />');
  });

  test("lets each device scale text without scaling the terminal layout", () => {
    const topbarSource = sourceBetween('<header className="terminal-topbar">', "</header>");

    expect(appSource).toContain('window.localStorage.getItem("aiqt.text-scale")');
    expect(appSource).toContain('window.localStorage.setItem("aiqt.text-scale", String(textScale))');
    expect(appSource).toContain('document.documentElement.style.setProperty("--aiqt-text-scale", String(textScale))');
    expect(topbarSource).toContain('className="text-scale-control"');
    expect(topbarSource).toContain('type="range"');
    expect(topbarSource).toContain("onInput={(event) => changeTextScale(Number(event.currentTarget.value))}");
    expect(appSource).toContain("const changeTextScale = useCallback((scale: number) => setTextScale(scale), [])");
    expect(topbarSource).toContain("MIN_TEXT_SCALE");
    expect(topbarSource).toContain("MAX_TEXT_SCALE");
    expect(topbarSource).toContain('className="text-scale-presets"');
    expect(topbarSource).toContain("[MIN_TEXT_SCALE, 1.25, MAX_TEXT_SCALE].map");
    expect(styles).toContain("--aiqt-text-scale: 1;");
    expect(styles).not.toMatch(/font-size:\s*\d+(?:\.\d+)?px;/);
    expect(cssBlock(".text-scale-popover")).toContain("position: absolute;");
    expect(cssBlock(".text-scale-popover")).toContain("z-index: 40;");
    expect(cssBlock(".rail-section")).toContain("overflow-y: auto;");
  });

  test("keeps strategy workshop controls readable in the light theme", () => {
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"] .surface-strategy .design-search input', [
      "background: var(--surface);",
      "color: var(--text);",
    ])).toBe(true);
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"] .surface-strategy .design-list-card', [
      "border-color: var(--border);",
      "background: var(--surface-raised);",
      "color: var(--muted);",
    ])).toBe(true);
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"] .surface-strategy .design-list-card.selected', [
      "border-left-color: var(--teal);",
      "background: var(--teal-dim);",
    ])).toBe(true);
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"] .surface-strategy .design-rule-group > header', [
      "background: var(--surface-raised);",
      "color: var(--text);",
    ])).toBe(true);
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"] .surface-strategy .design-rule-row', [
      "border-color: var(--border);",
      "color: var(--muted);",
    ])).toBe(true);
  });

  test("uses the light palette throughout the backtest workspace", () => {
    expect(backtestPageSource).toContain("getComputedStyle(canvas)");
    expect(backtestPageSource).toContain("colorScheme: ColorScheme;");
    expect(backtestPageSource).toContain("[colorScheme, points, tone]");
    expect(backtestPageSource).toContain('themeColor("--chart-grid"');
    expect(backtestPageSource).toContain('themeColor("--chart-teal"');
    expect(backtestPageSource).toContain('themeColor("--chart-red"');
    expect(hasCssBlockWith('.terminal-shell[data-theme="dark"]', [
      "--chart-grid: #183047;",
      "--chart-teal: #58d6b9;",
      "--chart-blue: #5f9fff;",
      "--chart-red: #ff6257;",
    ])).toBe(true);
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"]', [
      "--chart-grid: #c9d6e0;",
      "--chart-teal: #087f6d;",
      "--chart-blue: #2563eb;",
      "--chart-red: #c83f38;",
    ])).toBe(true);
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"] .surface-backtest .design-chart-empty', [
      "background: var(--surface-raised);",
    ])).toBe(true);
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"] .surface-backtest .design-metric-row', [
      "border-color: var(--border);",
      "background: var(--surface-raised);",
    ])).toBe(true);
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"] :is(.surface-strategy, .surface-backtest, .surface-audit) .design-history-row', [
      "border-color: var(--border);",
      "color: var(--muted);",
    ])).toBe(true);
  });

  test("uses the light palette throughout execution and governance workspaces", () => {
    expect(hasCssBlockWith(".stage1-p0-daily-use-footer", [
      "flex-wrap: wrap;",
    ])).toBe(true);
    expect(hasCssBlockWith(".stage1-p0-daily-use-footer small", [
      "flex: 1 1 240px;",
      "max-width: 100%;",
      "min-width: 0;",
    ])).toBe(true);
    expect(hasCssBlockWith(".stage1-p0-daily-use-footer small", [
      "flex: 0 1 auto;",
      "width: 100%;",
    ])).toBe(true);
    expect(hasCssBlockWith(".stage1-p0-daily-use-footer-actions", [
      "flex: 1 1 520px;",
      "flex-wrap: wrap;",
    ])).toBe(true);
    expect(hasCssBlockWith(".stage1-p0-daily-use-footer-actions", [
      "flex: 0 1 auto;",
      "flex-direction: column;",
      "width: 100%;",
    ])).toBe(true);
    expect(executionPageSource).toContain(
      'subtitle="自动交易运行状态、风险参数与生产授权"'
    );
    expect(executionPageSource).not.toContain("候选执行队列");
    expect(executionPageSource).not.toContain("暂无权威影子候选");
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"] .surface-execution .design-check-row.warning svg', [
      "color: var(--amber);",
    ])).toBe(true);
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"] :is(.surface-execution, .surface-settings) .design-live-warning', [
      "border-color: #c9a34c;",
      "background: #fff6da;",
      "color: var(--amber);",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-live-warning.positive", [
      "border-color: color-mix(in srgb, var(--teal) 65%, var(--border));",
      "color: var(--teal);",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-live-session-policy form", [
      "grid-template-columns: minmax(220px, 340px) auto minmax(0, 1fr);",
      "grid-template-areas:",
      "\"input button message\"",
      "align-items: center;",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-live-session-policy form > input", [
      "grid-area: input;",
      "height: calc(34px * var(--aiqt-text-scale, 1));",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-live-session-policy .design-secondary-action", [
      "grid-area: button;",
      "height: calc(34px * var(--aiqt-text-scale, 1));",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-live-session-policy form", [
      "grid-template-columns: minmax(0, 1fr) auto;",
      "\"input button\"",
    ])).toBe(true);
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"] .surface-execution .design-live-warning.positive', [
      "background: color-mix(in srgb, var(--teal) 10%, var(--surface));",
      "color: var(--teal);",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-data-provider-table", [
      "table-layout: fixed;",
    ])).toBe(true);
    expect(hasCssBlockWith(".design-data-provider-table th,\n.design-data-provider-table td", [
      "overflow-wrap: anywhere;",
      "white-space: normal;",
    ])).toBe(true);
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"] .surface-audit .design-audit-filters', [
      "border-color: var(--border);",
      "background: var(--surface-raised);",
    ])).toBe(true);
    expect(hasCssBlockWith('.terminal-shell[data-theme="light"] .surface-settings .design-settings-nav', [
      "border-color: var(--border);",
      "background: var(--surface-raised);",
    ])).toBe(true);
  });

  test("lets operators generate the P2 manifest chain preflight from the execution panel", () => {
    const panelSource = sourceBetween("function P2ManifestChainPreflightPanel", "function AdapterChainHealthPanel");

    expect(appSource).toContain("generateP2ManifestChainPreflight");
    expect(appSource).toContain("generateP2ManifestChainPreflightReport");
    expect(appSource).toContain("p2ManifestChainPreflightAuditEvent");
    expect(appSource).toContain("p2ManifestChainPreflightAuditReference");
    expect(appSource).toContain("findLatestP2ManifestChainPreflightAuditLedgerRow");
    expect(appSource).toContain("resolveP2ManifestChainPreflightAuditEventReference");
    expect(appSource).toContain("openP2ManifestChainPreflightAudit");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightQuery");
    expect(panelSource).toContain("onGeneratePreflight");
    expect(panelSource).toContain("onOpenAudit");
    expect(panelSource).toContain("isGenerating");
    expect(panelSource).toContain("auditEventId");
    expect(panelSource).toContain("auditEventSource");
    expect(panelSource).toContain('"审计事件"');
    expect(panelSource).toContain("台账回填");
    expect(panelSource).toContain('"生成预检"');
    expect(panelSource).toContain('"Generate"');
    expect(cssBlock(".p2-chain-preflight-actions")).toContain("display: flex;");
    expect(cssBlock(".p2-chain-preflight-actions")).toContain("flex-wrap: wrap;");
    expect(cssBlock(".p2-chain-preflight-audit")).toContain("font-family: var(--mono);");
  });

  test("resets the active workflow when timeframe changes invalidate audited context", () => {
    const selectTimeframeSource = sourceBetween("const selectTimeframe = useCallback", "setWorkflowRunState(createWorkflowRunState());");

    expect(selectTimeframeSource).toContain('setActiveLoopStepId("research");');
    expect(selectTimeframeSource).toContain('setActiveWorkflowStageId("data");');
  });

  test("keeps one 10-page automated-trading route and primary action visible across workspaces", () => {
    const guideOrderSource = sourceBetweenText(
      appSource,
      "const automatedTradingWorkAreaIds",
      "];"
    );
    const liveGateOpenSource = sourceBetweenText(
      appSource,
      "const openLiveTradingGate = useCallback(",
      "const completeLiveTradingGate = useCallback("
    );
    const expectedOrder = [
      '"settings"',
      '"market"',
      '"research"',
      '"strategy"',
      '"backtest"',
      '"ai-review"',
      '"portfolio"',
      '"execution"',
      '"dynamic-trading"',
      '"audit"'
    ];

    expectedOrder.forEach((workAreaId, index) => {
      expect(guideOrderSource.indexOf(workAreaId)).toBeGreaterThan(
        index === 0 ? -1 : guideOrderSource.indexOf(expectedOrder[index - 1])
      );
    });
    expect(guideOrderSource).not.toContain('"market-information"');
    expect(appWorkflowPanelsSource).toContain("function AutomatedTradingWorkflowGuide");
    expect(appSource).toContain("const runAutomatedTradingWorkflow = useCallback(");
    expect(appSource).toContain("setIsAutomatedTradingWorkflowRunning(true);");
    expect(appSource).toContain("automatedTradingWorkflowContextRef.current");
    expect(appSource).toContain("自动流程已暂停：标的或周期已改变。");
    expect(appSource).toContain("automatedTradingWorkflowRequiresManualAction(action.id)");
    expect(appSource).toContain('action.id === "run-pipeline" && isChartLoading');
    expect(appSource).toContain("await runGoldenPathActionById(");
    expect(appSource).toContain("return refreshSelectedMarketCache();");
    expect(appSource).toContain("return refreshWatchlistMarketCache();");
    expect(appSource).toContain('return runPipeline(automated ? "accepted" : undefined);');
    expect(appSource).toContain('const contextRefreshed = refreshedItem?.status === "refreshed";');
    expect(appSource).toContain("automatedTradingWorkflowActionErrorRef.current");
    expect(appSource).toContain("const actionError = automatedTradingWorkflowActionErrorRef.current;");
    expect(appSource).toContain('"开始自动交易流程"');
    expect(appSource).toContain('"自动执行中…"');
    expect(appSource).toContain(
      'goldenPath?.nextAction?.id === "certify-live-adapter"'
    );
    expect(appSource).toContain("onAction={automatedTradingGuideAction}");
    expect(appSource).toContain("setIsLiveTradingGateDialogOpen(true);");
    expect(liveGateOpenSource).toContain(
      "await loadAutoTradingSnapshot(quantCoreBaseUrl)"
    );
    expect(liveGateOpenSource.indexOf("await loadAutoTradingSnapshot"))
      .toBeLessThan(liveGateOpenSource.indexOf("setIsLiveTradingGateDialogOpen(true)"));
    expect(appSource).toContain("liveTradingGateDialogRef.current?.showModal();");
    expect(appSource).toContain('aria-labelledby="live-trading-gate-dialog-title"');
    expect(appSource).toContain('className="research-confirmation-dialog live-trading-gate-dialog"');
    expect(appSource).toContain('input[placeholder="实名操作人"]');
    expect(appSource).toContain("onAutoLiveAuthorized={completeLiveTradingGate}");
    expect(appSource).toContain("setIsLiveTradingGateDialogOpen(false);");
    expect(appSource).not.toContain(
      'action.id === "certify-live-adapter" ? "execution"'
    );
    expect(appSource).toContain(
      "isAutomatedTradingWorkflowRunning ||"
    );
    expect(appSource).toContain("await runP0AiReview(quantCoreBaseUrl");
    expect(appSource).toContain("await refreshGoldenPathStatus();");
    expect(appSource).toContain("currentWorkAreaId={activeWorkAreaId}");
    expect(appSource).not.toContain("currentWorkAreaId={automatedTradingTargetWorkspaceId}");
    expect(appSource).toContain("workflowGuide={automatedTradingGuide}");
    expect(terminalWorkspaceSurfaceSource).toContain('className="design-workflow-guide-disclosure"');
    expect(terminalWorkspaceSurfaceSource).toContain("完整流程与审计证据");
    expect(cssBlock(".automated-trading-guide-steps")).toContain(
      "grid-template-columns: repeat(10, minmax(0, 1fr));"
    );
    expect(cssBlock(".automated-trading-guide-action button")).toContain(
      "background: var(--teal-dim);"
    );
    expect(cssBlock(".automated-trading-guide-action button")).toContain(
      "color: var(--teal);"
    );
    expect(cssBlock(".automated-trading-guide-action button")).not.toContain(
      "background: #113b32;"
    );
    expect(appSource).toContain(
      '"Expected bar intervals are missing.": "存在缺失的 K 线时间间隔"'
    );
  });

  test("documents the research mainline and real-sample goal without historical workflow logs", () => {
    expect(readmeSource).toContain("行情与选股");
    expect(readmeSource).toContain("研究价值 cohort");
    expect(productPlanSource).toContain("真实样本积累");
    expect(productPlanSource).toContain("30 个非重叠到期批次");
    expect(productPlanSource).toContain("历史阶段、验收过程与具体 hash 由 Git 历史");
    expect(readmeSource).not.toContain("Daily Ops、Daily Start 与个人/小团队缺口");
  });

  test("keeps local review next-action generation tied to the restored research target", () => {
    const coverageSource = sourceBetweenText(
      terminalWorkbenchLocalReviewSource,
      "function auditReportLedgerLocalReviewBundleCoverage",
      "function auditReportLedgerDeduplicatedQueryText"
    );

    expect(terminalWorkbenchLocalReviewSource).toContain(
      'const LOCAL_REVIEW_COVERAGE_NEXT_ACTION_TARGET_WORKSPACE_ID: ProductWorkAreaId = "research";'
    );
    expect(coverageSource).toContain(
      "nextActionTargetWorkspaceId: LOCAL_REVIEW_COVERAGE_NEXT_ACTION_TARGET_WORKSPACE_ID"
    );
    expect(coverageSource).not.toContain('nextActionTargetWorkspaceId: "research"');
  });

  test("copies P0 action outcome evidence links without changing the evidence open path", () => {
    const copyHandlerSource = sourceBetween("const copyP0ActionOutcomeEvidenceLink = useCallback(", "const openP0ActionOutcomeEvidence = useCallback(");

    expect(copyHandlerSource).toContain("buildP0PlatformActionOutcomeEvidenceLink(outcome)");
    expect(copyHandlerSource).toContain("const url = new URL(window.location.href);");
    expect(copyHandlerSource).toContain("url.search = `?${link.search}`;");
    expect(copyHandlerSource).toContain("url.hash = \"\";");
    expect(copyHandlerSource).toContain("await navigator.clipboard.writeText(url.toString());");
    expect(copyHandlerSource).toContain("setCopiedP0ActionOutcomeEvidenceId(link.evidenceId);");
    expect(copyHandlerSource).toContain("setWorkspaceState((current) => ({");
  });

  test("opens P0 action outcomes by replaying audited run evidence before showing Audit", () => {
    const outcomeHandlerSource = sourceBetween("const openP0ActionOutcomeEvidence = useCallback(", "const runGoldenPathActionById = useCallback(");

    expect(outcomeHandlerSource).toContain('outcome.state === "audit_run"');
    expect(outcomeHandlerSource).toContain('outcome.state === "live_ready"');
    expect(outcomeHandlerSource).toContain("const evidenceId = outcome.evidenceId;");
    expect(outcomeHandlerSource).toContain("const historyRun = runHistory.find((run) => run.runId === evidenceId);");
    expect(outcomeHandlerSource).toContain("await replayRun(historyRun);");
    expect(outcomeHandlerSource).toContain("loadResearchRunDetail(quantCoreBaseUrl, evidenceId)");
    expect(outcomeHandlerSource).toContain("await replayRun(detail.run);");
    expect(outcomeHandlerSource).toContain("setResearchRunExportBrowserQuery(evidenceId);");
    expect(outcomeHandlerSource).toContain('setActiveWorkAreaId("execution");');
  });

  test("blocks Golden Path from rebinding an old run over an unaudited strategy draft", () => {
    const actionHandlerSource = sourceBetween("const runGoldenPathActionById = useCallback(", "const runGoldenPathAction = useCallback(");
    const disabledHandlerSource = sourceBetween("const isGoldenPathActionDisabledById = useCallback(", "const goldenPathActionId = goldenPath?.nextAction?.id;");
    const ensureRunSource = sourceBetween("const ensureGoldenPathLatestRunBound = useCallback(", "const undoResearchRunImportEvent = useCallback(");
    const replayRunSource = sourceBetween("const replayRun = useCallback(", "const replayImportRollbackRun = useCallback(");
    const resetAiReviewSource = sourceBetween("const resetAiReviewHistoryState = useCallback(", "const strategyExperimentRequestIsCurrent = useCallback(");
    const refreshAiReviewSource = sourceBetween("const refreshAiReviewRunHistory = useCallback(", "const refreshAuditEvidenceReportEvents = useCallback(");

    expect(appSource).toContain("const ensureGoldenPathLatestRunBound = useCallback(");
    expect(appSource).toContain("workspaceNeedsStrategyReaudit(workspace)");
    expect(appSource).toContain("strategyDraftRequiresReaudit");
    expect(appSource).toContain("goldenPath?.latestRunId");
    expect(appSource).toContain("loadResearchRunDetail(quantCoreBaseUrl, latestRunId)");
    expect(appSource).toContain("await replayRun(detail.run)");
    expect(ensureRunSource).toContain("goldenPathRunRebindIsCurrent");
    expect(ensureRunSource).toContain("if (!rebound)");
    expect(replayRunSource).toContain("replayRunRequestIsCurrent");
    expect(replayRunSource).toContain("commit: false");
    expect(replayRunSource).toContain("setAiReviewHistoryPagination(aiReviewHistory.pagination ?? null)");
    expect(resetAiReviewSource).toContain("nextAiReviewHistoryRequestId");
    expect(resetAiReviewSource).toContain("setIsLoadingAiReviewHistory(false)");
    expect(refreshAiReviewSource).toContain("const commit = options.commit !== false");
    expect(refreshAiReviewSource).toContain("const requestId = commit ? nextAiReviewHistoryRequestId(aiReviewHistoryRequestIdRef.current) : null");
    expect(ensureRunSource).toContain("if (strategyDraftRequiresReaudit)");
    expect(ensureRunSource).toContain('statusLabel: "Strategy draft requires audit"');
    expect(ensureRunSource).toContain("Run Pipeline to audit the current strategy draft");
    expect(actionHandlerSource).toContain("const executableActionId = normalizeP0CurrentGapActionId(actionId);");
    expect(actionHandlerSource).toContain('if (executableActionId === "submit-paper-order")');
    expect(actionHandlerSource).toContain("const goldenPathRunId = latestRunIdOverride ?? goldenPath?.latestRunId;");
    expect(actionHandlerSource).toContain("const runIsBound = await ensureGoldenPathLatestRunBound(goldenPathRunId);");
    expect(actionHandlerSource).toContain("if (goldenPathRunId && runIsBound)");
    expect(actionHandlerSource).toContain("await submitPaperExecution(goldenPathRunId)");
    expect(disabledHandlerSource).toContain("!strategyDraftRequiresReaudit");
    expect(disabledHandlerSource).toContain("strategyDraftRequiresReaudit ||");
    expect(disabledHandlerSource).toContain("const canRebindGoldenPathRun =");
    expect(disabledHandlerSource).toContain("return (");
    expect(disabledHandlerSource).toContain("isSubmittingPaperExecution ||");
    expect(disabledHandlerSource).toContain("(!canRebindGoldenPathRun &&");
    expect(disabledHandlerSource).toContain('riskApprovalSummary.status === "blocked"');
    expect(appSource).toContain("strategyDraftReauditHint(");
    expect(appSource).toContain("Run Pipeline to audit this strategy draft before paper execution.");
  });

  test("translates golden path cache readiness guidance for audited research", () => {
    expect(appSource).toContain("translateGoldenPathDetail");
    expect(appSource).toContain("fresh cached K-line rows are available for audited research");
    expect(appSource).toContain("cached rows are stale");
    expect(appSource).toContain("Refresh market data before audited research");
    expect(appSource).toContain("No cached K-line context exists for the selected instrument");
    expect(appSource).toContain("The selected context has no usable cached K-line rows");
    expect(appSource).toContain("no matching watchlist cache refresh evidence covers");
    expect(appSource).toContain("Matching watchlist cache refresh evidence");
    expect(appSource).toContain("可支撑审计研究");
    expect(appSource).toContain("先刷新行情数据后再运行审计研究");
    expect(appSource).toContain("当前标的还没有 K 线缓存上下文");
    expect(appSource).toContain("当前上下文没有可用 K 线缓存");
    expect(appSource).toContain("还没有匹配的自选刷新证据");
    expect(appSource).toContain("自选刷新证据");
    expect(appSource).toContain("The audited run is ready for the local evidence review required by paper simulation.");
    expect(appSource).toContain("审计运行已就绪，等待完成模拟执行所需的本地证据评审。");
    expect(appSource).toContain("Audited AI evidence is ready, but no filled paper execution is bound.");
    expect(appSource).toContain("AI 评审证据已就绪，但尚未绑定已成交的模拟执行记录。");
  });

  test("renders risk approval references in the AI review audit trail", () => {
    const auditPanelSource = sourceBetweenText(aiReviewAuditTrailPanelSource, "function AiReviewAuditTrailPanel", "__END__");
    const riskReferenceSource = sourceBetweenText(aiReviewAuditBoardsSource, "function AiReviewRiskReferenceBoard", "function AiReviewRecordDriftSummary");

    expect(aiReviewAuditBoardsSource).toContain("function AiReviewRiskReferenceBoard");
    expect(auditPanelSource).toContain("riskApproval");
    expect(auditPanelSource).toContain("<AiReviewRiskReferenceBoard");
    expect(auditPanelSource).toContain("approval={riskApproval}");
    expect(riskReferenceSource).toContain("approval.gates.map");
    expect(riskReferenceSource).toContain("riskApprovalHeadline(i18n, approval)");
    expect(riskReferenceSource).toContain("riskApprovalSummaryText(i18n, approval)");
    expect(riskReferenceSource).toContain("riskApprovalGateLabel(i18n, gate)");
    expect(riskReferenceSource).toContain("riskApprovalGateStatus(i18n, gate.status)");
    expect(cssBlock(".audit-ai-risk-reference")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-risk-reference")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".audit-ai-risk-gates")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-risk-gate")).toContain("grid-template-columns: minmax(120px, 0.7fr) minmax(0, 1fr) auto;");
  });

  test("renders an AI review audit timeline as approval references", () => {
    const auditPanelSource = sourceBetweenText(aiReviewAuditTrailPanelSource, "function AiReviewAuditTrailPanel", "__END__");
    const timelineSource = sourceBetweenText(aiReviewAuditBoardsSource, "function AiReviewAuditTimelineBoard", "function AiReviewExportEvidenceIndexBoard");

    expect(aiReviewAuditTrailPanelSource).toContain("buildAiReviewAuditTimelineItems");
    expect(aiReviewAuditBoardsSource).toContain("function AiReviewAuditTimelineBoard");
    expect(auditPanelSource).toContain("const timelineItems = buildAiReviewAuditTimelineItems");
    expect(auditPanelSource).toContain("<AiReviewAuditTimelineBoard");
    expect(timelineSource).toContain("items.map");
    expect(timelineSource).toContain("item.reference");
    expect(timelineSource).toContain("item.exportAnchor");
    expect(timelineSource).toContain("audit-ai-timeline-anchor");
    expect(cssBlock(".audit-ai-timeline")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-timeline-row")).toContain(
      "grid-template-columns: minmax(118px, 0.45fr) minmax(0, 1fr) minmax(140px, 0.35fr) auto;"
    );
    expect(cssBlock(".audit-ai-timeline-anchor")).toContain("grid-column: 1 / -1;");
  });

  test("treats duplicate adapter paper execution submissions as reused evidence", () => {
    const recordSource = sourceBetween(
      "const recordAdapterPaperExecution = useCallback",
      "const refreshAuditSigningKeys = useCallback"
    );

    expect(recordSource).toContain('result.error === "execution_adapter_paper_execution_already_recorded"');
    expect(recordSource).toContain("Adapter paper execution reused");
    expect(recordSource).toContain("if (result.error && !reusedAdapterPaperExecution)");
    expect(recordSource).toContain("await refreshSettingsStatus();");
  });

  test("summarizes drift across saved AI review records in the audit trail", () => {
    const auditPanelSource = sourceBetweenText(aiReviewAuditTrailPanelSource, "function AiReviewAuditTrailPanel", "__END__");

    expect(aiReviewAuditTrailPanelSource).toContain("buildAiReviewRecordDriftRows");
    expect(aiReviewAuditBoardsSource).toContain("function AiReviewRecordDriftSummary");
    expect(auditPanelSource).toContain("const driftRows = buildAiReviewRecordDriftRows");
    expect(auditPanelSource).toContain("const totalHistoryRecords = historyPagination?.total ?? records.length;");
    expect(auditPanelSource).toContain("<AiReviewRecordDriftSummary");
    expect(auditPanelSource).toContain("rows={driftRows}");
    expect(auditPanelSource).toContain("totalRows={totalHistoryRecords}");
    expect(cssBlock(".audit-ai-drift-summary")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".audit-ai-drift-list")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-drift-row")).toContain(
      "grid-template-columns: minmax(130px, 0.75fr) minmax(0, 1fr) auto;"
    );
    expect(hasCssDeclaration(".audit-ai-drift-row", "grid-template-columns: 1fr;")).toBe(true);
  });

  test("filters saved AI review drift rows from the audit trail", () => {
    const auditPanelSource = sourceBetweenText(aiReviewAuditTrailPanelSource, "function AiReviewAuditTrailPanel", "__END__");
    const driftSummarySource = sourceBetweenText(aiReviewAuditBoardsSource, "function AiReviewRecordDriftSummary", "function AiReviewAuditTimelineBoard");

    expect(auditPanelSource).not.toContain("filterAiReviewRecordDriftRows");
    expect(auditPanelSource).not.toContain('const [driftQuery, setDriftQuery] = useState("");');
    expect(auditPanelSource).toContain("onQueryChange={onHistoryQueryChange}");
    expect(auditPanelSource).toContain("query={historyQuery}");
    expect(auditPanelSource).toContain("totalRows={totalHistoryRecords}");
    expect(driftSummarySource).toContain('type="search"');
    expect(driftSummarySource).toContain('className="audit-ai-drift-search"');
    expect(driftSummarySource).toContain("rows.length !== totalRows");
    expect(cssBlock(".audit-ai-drift-toolbar")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-drift-search")).toContain("min-width: 0;");
  });

  test("applies the AI review audit search to saved record history", () => {
    const auditPanelSource = sourceBetweenText(aiReviewAuditTrailPanelSource, "function AiReviewAuditTrailPanel", "__END__");
    const recordHistorySource = sourceBetweenText(aiReviewAuditBoardsSource, "function AiReviewRunRecordHistory", "function AiReviewAuditComparison");

    expect(auditPanelSource).toContain("records={records}");
    expect(auditPanelSource).toContain("totalRecords={totalHistoryRecords}");
    expect(auditPanelSource).toContain("query={historyQuery}");
    expect(auditPanelSource).toContain("pagination={historyPagination}");
    expect(recordHistorySource).toContain("totalRecords");
    expect(recordHistorySource).toContain("records.length !== totalRecords");
    expect(recordHistorySource).toContain("No matching records");
  });

  test("lets the audit workspace compare against a selected AI review record", () => {
    const auditPanelSource = sourceBetweenText(aiReviewAuditTrailPanelSource, "function AiReviewAuditTrailPanel", "__END__");
    const recordHistorySource = sourceBetweenText(aiReviewAuditBoardsSource, "function AiReviewRunRecordHistory", "function AiReviewAuditComparison");
    const comparisonSource = sourceBetweenText(aiReviewAuditBoardsSource, "function AiReviewAuditComparison", "function AiReviewRiskReferenceBoard");

    expect(auditPanelSource).toContain('const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);');
    expect(auditPanelSource).toContain("const selectedRecord = records.find((record) => record.aiReviewId === selectedRecordId) ?? latestRecord;");
    expect(auditPanelSource).toContain("latestRecord={selectedRecord}");
    expect(auditPanelSource).toContain("onSelectRecord={setSelectedRecordId}");
    expect(auditPanelSource).toContain("selectedRecordId={selectedRecord?.aiReviewId ?? null}");
    expect(recordHistorySource).toContain("onSelectRecord");
    expect(recordHistorySource).toContain("selectedRecordId");
    expect(recordHistorySource).toContain("button");
    expect(recordHistorySource).toContain("isSelectable && item.aiReviewId === selectedRecordId");
    expect(recordHistorySource).toContain("onClick={isSelectable ? () => onSelectRecord?.(item.aiReviewId) : undefined}");
    expect(comparisonSource).toContain("selectedRecordLabel");
    expect(comparisonSource).toContain("Selected saved");
    expect(cssBlock("button.ai-review-record")).toContain("cursor: pointer;");
    expect(cssBlock(".ai-review-record.selected")).toContain("border-color: rgba(76, 201, 173, 0.72);");
  });

  test("passes explicit count and query props to every AI review record history", () => {
    const recordHistoryUsages = `${appSource}\n${aiReviewAuditTrailPanelSource}`.match(/<AiReviewRunRecordHistory[\s\S]*?\/>/g) ?? [];

    expect(recordHistoryUsages).toHaveLength(2);
    recordHistoryUsages.forEach((usage) => {
      expect(usage).toContain("query=");
      expect(usage).toContain("records=");
      expect(usage).toContain("totalRecords=");
    });
  });

  test("wires audit AI review history search to backend pagination", () => {
    const auditPanelSource = sourceBetweenText(aiReviewAuditTrailPanelSource, "function AiReviewAuditTrailPanel", "__END__");
    const recordHistorySource = sourceBetweenText(aiReviewAuditBoardsSource, "function AiReviewRunRecordHistory", "function AiReviewAuditComparison");

    expect(appSource).toContain("const AI_REVIEW_HISTORY_PAGE_SIZE = 5;");
    expect(appSource).toContain("const [aiReviewHistoryPagination, setAiReviewHistoryPagination]");
    expect(appSource).toContain('const [aiReviewHistoryQuery, setAiReviewHistoryQuery] = useState("");');
    expect(appSource).toContain("loadResearchRunAiReviews(quantCoreBaseUrl, runId, {");
    expect(appSource).toContain("limit: AI_REVIEW_HISTORY_PAGE_SIZE");
    expect(appSource).toContain("const offset = options.offset ?? aiReviewHistoryOffset;");
    expect(appSource).toContain("const query = options.query ?? aiReviewHistoryQuery;");
    expect(appSource).toContain("setAiReviewHistoryPagination(aiReviewHistory.pagination ?? null)");
    expect(auditPanelSource).toContain("historyPagination");
    expect(auditPanelSource).toContain("onHistoryQueryChange");
    expect(auditPanelSource).not.toContain("filterAiReviewRecordDriftRows");
    expect(recordHistorySource).toContain("onNextPage");
    expect(recordHistorySource).toContain("onPreviousPage");
    expect(recordHistorySource).toContain("ai-review-record-pagination");
    expect(cssBlock(".ai-review-record-pagination")).toContain("display: flex;");
  });

  test("keeps saved AI review records read-only outside the audit selector", () => {
    const agentPanelSource = sourceBetween("const renderAgentPanel", "const renderWorkflowNodesPanel");
    const recordHistorySource = sourceBetweenText(aiReviewAuditBoardsSource, "function AiReviewRunRecordHistory", "function AiReviewAuditComparison");

    expect(agentPanelSource).not.toContain("onSelectRecord={() => undefined}");
    expect(recordHistorySource).toContain("const isSelectable = Boolean(onSelectRecord);");
    expect(recordHistorySource).toContain("const RecordTag = isSelectable ? \"button\" : \"article\";");
    expect(recordHistorySource).toContain("onClick={isSelectable ? () => onSelectRecord?.(item.aiReviewId) : undefined}");
    expect(cssBlock(".ai-review-record")).toContain("cursor: default;");
    expect(cssBlock("button.ai-review-record")).toContain("cursor: pointer;");
  });

  test("renders distinct product work-area compositions", () => {
    expect(appSource).toContain('activeWorkAreaId === "market"');
    expect(appSource).toContain('activeWorkAreaId === "settings"');
    expect(appSource).toContain("PlatformSettingsPanel");
    expect(cssBlock(".product-workspace-layout")).toContain("display: grid;");
  });

  test("uses current data readiness when the settings cache summary omits the selected context", () => {
    const activeCacheContextSource = sourceBetween(
      "const activeCacheReadiness =",
      "const activeCacheContextKey ="
    );

    expect(activeCacheContextSource).toContain("marketDataReadinessState.readiness");
    expect(activeCacheContextSource).toContain(
      "activeCacheReadiness?.market === workspace.selectedInstrument.market"
    );
    expect(activeCacheContextSource).toContain(
      "activeCacheReadiness.symbol === workspace.selectedInstrument.symbol"
    );
    expect(activeCacheContextSource).toContain(
      "activeCacheReadiness.timeframe === workspace.selectedTimeframe"
    );
    expect(activeCacheContextSource).toContain("rowCount: activeCacheReadiness.barCount");
    expect(activeCacheContextSource).toContain("freshness: activeCacheReadiness.cacheState");
    expect(activeCacheContextSource).toContain("startTimestamp: activeCacheReadiness.startBarAt");
    expect(activeCacheContextSource).toContain("endTimestamp: activeCacheReadiness.latestBarAt");
    expect(activeCacheContextSource).toContain("ageHours: activeCacheReadiness.ageHours");
  });

  test("renders provider cooldown guard for manual market data refresh", () => {
    expect(appSource).toContain("buildMarketDataRefreshGuard(");
    expect(appSource).toContain("settingsStatus.settings?.marketDataAdapters");
    expect(appSource).toContain("marketDataRefreshGuardLabel(i18n, refreshGuard)");
    expect(researchContextReadinessPanelSource).toContain("MarketDataRefreshOverrideControl");
    expect(appSource).toContain("buildMarketDataRefreshOverrideAuditEvent");
    expect(appSource).toContain("saveAuditEvent(quantCoreBaseUrl, auditEvent)");
    expect(appSource).toContain("marketDataRefreshOverrideAuditStatus");
    expect(appSource).toContain("marketDataRefreshOverride?.market === workspace.selectedInstrument.market");
    expect(appSource).toContain("setMarketDataRefreshOverride");
    expect(appSource).toContain("覆盖审计");
    expect(researchContextReadinessPanelSource).toContain("数据源冷却");
    expect(researchContextReadinessPanelSource).toContain("Provider cooldown");
    expect(researchContextReadinessPanelSource).toContain("Manual override");
    expect(cssBlock(".market-refresh-guard-note")).toContain("background:");
    expect(cssBlock(".market-refresh-guard-note")).toContain("margin: 0 0 8px;");
    expect(cssBlock(".market-refresh-override")).toContain("grid-template-columns:");
    expect(cssBlock(".market-refresh-override")).toContain("margin: 0 0 8px;");
    expect(cssBlock(".market-refresh-override-audit-status")).toContain("font-size:");
    expect(cssBlock(".market-refresh-override-audit-status.failed")).toContain("color:");
  });

  test("refreshes time-sensitive data while the page is visible", () => {
    const calendarRefreshSource = sourceBetweenText(
      marketControllerSource,
      "const refreshMarketCalendarStatus = useCallback",
      "const searchMarketDiscovery = useCallback"
    );
    const chartRefreshSource = sourceBetweenText(
      marketControllerSource,
      "const refreshChart = useCallback",
      "const clearMarketDataRefreshOverride = useCallback"
    );
    const visibleRefreshSource = sourceBetweenText(
      appShellRefreshControllerSource,
      "const refreshVisiblePageData = useCallback",
      "const signAuditEvidenceReportEvent = useCallback"
    );
    const visibleRefreshEffectSource = sourceBetweenText(
      appShellRuntimeEffectsSource,
      "useEffect(() => {\n      let refreshInFlight = false;",
      "    }, [refreshVisiblePageData]);"
    );

    expect(appSource).toContain("const VISIBLE_PAGE_REFRESH_INTERVAL_MS = 35_000;");
    expect(calendarRefreshSource).toContain("async (silent = false)");
    expect(calendarRefreshSource).toContain("marketCalendarRequestIdRef.current !== requestId");
    expect(calendarRefreshSource).toContain("workspaceRef.current.selectedInstrument.market !== market");
    expect(calendarRefreshSource).toContain('silent && result.source !== "core"');
    expect(chartRefreshSource).toContain("async (silent = false)");
    expect(chartRefreshSource).toContain("if (!silent) {");
    expect(chartRefreshSource).toContain('!silent || result.source === "core"');
    expect(chartRefreshSource).toContain('!silent || readiness.source === "core"');
    expect(visibleRefreshSource).toContain("loadTerminalWorkspace(quantCoreBaseUrl)");
    expect(visibleRefreshSource).toContain('result.source !== "core"');
    expect(visibleRefreshSource).toContain("workspaceWithSavedWatchlist(");
    expect(visibleRefreshSource).toContain("refreshMarketCalendarStatus(true)");
    expect(visibleRefreshSource).toContain("!isChartLoading &&");
    expect(visibleRefreshSource).toContain("refreshChart(true)");
    expect(visibleRefreshSource).not.toContain("refreshSettingsStatus");
    expect(visibleRefreshSource).not.toContain("refreshAuditSigningKeys");
    expect(visibleRefreshEffectSource).toContain('document.visibilityState !== "visible" || refreshInFlight');
    expect(visibleRefreshEffectSource).toContain("window.setInterval(");
    expect(visibleRefreshEffectSource).toContain("VISIBLE_PAGE_REFRESH_INTERVAL_MS");
    expect(visibleRefreshEffectSource).toContain('document.addEventListener("visibilitychange"');
    expect(visibleRefreshEffectSource).toContain('window.addEventListener("focus"');
    expect(visibleRefreshEffectSource).toContain("refreshInFlight = false;");
    expect(visibleRefreshEffectSource).toContain("window.clearInterval(intervalId)");
    expect(visibleRefreshEffectSource).toContain('document.removeEventListener("visibilitychange"');
    expect(visibleRefreshEffectSource).toContain('window.removeEventListener("focus"');
    expect(appSource).toMatch(/const activeCacheContext =\s*activeReadinessCacheContext \?\?/);
    expect(appSource).toContain('source === "core" ? "行情自动刷新" : "本地快照"');
  });

  test("renders the strategy lab as a structured rule builder", () => {
    expect(appSource).toContain("buildStrategyRuleDraft(workspace)");
    expect(appSource).toContain("buildStrategyReadinessGates(workspace)");
    expect(appSource).toContain("validateStrategySnapshot");
    expect(appSource).toContain("workspaceWithStrategyRuleDraftField");
    expect(appSource).toContain("buildStrategyTemplateOptions");
    expect(appSource).toContain("workspaceWithStrategyTemplate");
    expect(appSource).toContain("StrategyTemplatePicker");
    expect(appSource).toContain("StrategyConditionField");
    expect(appSource).toContain("StrategyVolumeConfirmField");
    expect(appSource).toContain("StrategyRsiConfirmField");
    expect(appSource).toContain('field="entryKind"');
    expect(appSource).toContain('field="exitKind"');
    expect(appSource).toContain('field="entryRsiConfirm"');
    expect(appSource).toContain('field="entryVolumeConfirm"');
    expect(appSource).toContain('thresholdField="entryRsiThreshold"');
    expect(appSource).toContain('windowField="entryRsiWindow"');
    expect(appSource).toContain('windowField="entryVolumeWindow"');
    expect(appSource).toContain('thresholdField="entryThreshold"');
    expect(appSource).toContain('thresholdField="exitThreshold"');
    expect(appSource).toContain('windowField="entryWindow"');
    expect(appSource).toContain('windowField="exitWindow"');
    expect(appSource).toContain("strategy-draft-grid");
    expect(appSource).toContain("strategy-template-grid");
    expect(appSource).toContain("StrategyConditionMenu");
    expect(appSource).toContain("strategy-condition-menu");
    expect(appSource).toContain("strategy-condition-options");
    expect(appSource).toContain("strategy-volume-toggle");
    expect(appSource).toContain("strategy-rsi-toggle");
    expect(appSource).toContain("strategy-generated-snapshot");
    expect(appSource).toContain("readinessGates={strategyReadinessGates}");
    expect(appSource).toContain("validationSource={strategyValidationState.source}");
    expect(appSource).toContain("strategyWorkbench={renderStrategyWorkbench(false)}");
    expect(appSource).toContain("showSaveAction={showSaveAction}");
    expect(appSource).toContain("onApplyStrategyTemplate={applyStrategyTemplate}");
    expect(appSource).toContain("onUpdateStrategyRuleDraftField={updateStrategyRuleDraftField}");
    expect(appSource).toContain("onSaveStrategyVersion={saveCurrentStrategyVersion}");
    expect(appSource).toContain("onLoadStrategyVersion={loadSavedStrategyVersion}");
    expect(appSource).toContain("onRunStrategyGovernanceAction={runStrategyGovernanceAction}");
    expect(appSource).toContain('className="strategy-readiness-list"');
    expect(appSource).toContain('className="strategy-validation-source"');
    expect(styles).toContain(".strategy-draft-grid");
    expect(styles).toContain(".strategy-template-grid");
    expect(styles).toContain(".strategy-template-card");
    expect(styles).toContain(".strategy-condition-menu");
    expect(styles).toContain(".strategy-condition-options");
    expect(styles).toContain(".strategy-threshold-field");
    expect(styles).toContain(".strategy-volume-toggle");
    expect(styles).toContain(".strategy-rsi-toggle");
    expect(styles).toContain(".strategy-generated-snapshot");
    expect(styles).toContain(".strategy-readiness-gate");
    expect(styles).toContain(".strategy-validation-source");
  });

  test("keeps AI strategy help as a reviewed draft instead of a second strategy algorithm", () => {
    const generateSource = sourceBetween(
      "const generateStrategyAiCandidate = async () => {",
      "const applyStrategyAiCandidate = () => {"
    );
    const applySource = sourceBetween(
      "const applyStrategyAiCandidate = () => {",
      "const closeStrategyDeleteDialog = () => {"
    );
    const aiDialogSource = sourceBetween(
      "{isStrategyAiDialogOpen ? (",
      "{strategyToDelete ? ("
    );
    const aiStateSource = sourceBetween(
      "const selectedStrategyAiProvider = providers.find(",
      "return ("
    );

    expect(generateSource).toContain("generateStrategyAiDraft(quantCoreBaseUrl");
    expect(generateSource).toContain("abortController.signal");
    expect(generateSource).toContain("requestContextIdentity");
    expect(generateSource).toContain("setStrategyAiExternalDataApproved(false)");
    expect(generateSource.indexOf("setStrategyAiExternalDataApproved(false)")).toBeLessThan(
      generateSource.indexOf("generateStrategyAiDraft(quantCoreBaseUrl")
    );
    expect(generateSource).not.toContain("onSaveStrategyVersion");
    expect(generateSource).not.toContain("runPipeline");
    expect(applySource).toContain("onApplyAiStrategyDraft(");
    expect(applySource).toContain("strategyAiResultContextIdentity !== strategyAiContextIdentity");
    expect(applySource).toContain("strategyAiDraftDiffRows(i18n, draft, strategyAiResult.candidate.draft).length === 0");
    expect(applySource).not.toContain("onSaveStrategyVersion");
    expect(aiDialogSource).toContain('i18n.t("strategy.aiReasons")');
    expect(aiDialogSource).toContain('i18n.t("strategy.aiDraftOnly")');
    expect(aiDialogSource).toContain('className="strategy-ai-diff"');
    expect(aiDialogSource).toContain('i18n.t("strategy.aiCurrentValue")');
    expect(aiDialogSource).toContain('i18n.t("strategy.aiCandidateValue")');
    expect(aiDialogSource).toContain('i18n.t("strategy.aiFallbackBadge")');
    expect(aiStateSource).toContain("&& strategyAiDraftChanges.length > 0");
    expect(aiDialogSource).toContain("strategy-ai-external-approval");
    expect(terminalWorkbenchSource).not.toContain('action === "strategy-draft"');
    expect(styles).toContain(".strategy-ai-preview-grid");
    expect(styles).toContain(".strategy-ai-diff-row");
    expect(styles).toContain(':root[data-theme="light"] .strategy-ai-preview');
  });

  test("keeps strategy draft fields on stable responsive tracks", () => {
    const strategySummarySource = sourceBetween(
      "function StrategySummary",
      "function StrategyTemplatePicker"
    );
    const conditionFieldSource = sourceBetween(
      "function StrategyConditionField",
      "export function StrategyConditionMenu"
    );
    const conditionMenuSource = sourceBetween(
      "export function StrategyConditionMenu",
      "function StrategyVolumeConfirmField"
    );
    const desktopGrid = cssBlock(".design-strategy-workbench .strategy-draft-grid");
    expect(strategySummarySource.indexOf('field="entryKind"')).toBeLessThan(
      strategySummarySource.indexOf('field="exitKind"')
    );
    expect(strategySummarySource.indexOf('field="exitKind"')).toBeLessThan(
      strategySummarySource.indexOf('field="entryRsiConfirm"')
    );
    expect(conditionFieldSource).toContain("<StrategyConditionMenu");
    expect(conditionFieldSource).not.toContain("<select");
    expect(conditionMenuSource).toContain("summaryRef.current?.focus()");
    expect(cssBlock(".strategy-draft-field > .strategy-rsi-toggle")).toContain(
      "grid-template-columns: auto minmax(52px, 0.75fr) minmax(52px, 0.75fr) auto;"
    );
    expect(cssBlock(".strategy-draft-field > .strategy-volume-toggle")).toContain(
      "grid-template-columns: auto minmax(58px, 1fr) auto;"
    );
    expect(appSource.match(/className="strategy-inline-number"/g)).toHaveLength(3);
    expect(cssBlock(".strategy-inline-number")).toContain(
      "grid-template-columns: auto minmax(0, 1fr);"
    );
    expect(desktopGrid).toContain("grid-template-columns: repeat(4, minmax(0, 1fr));");
    expect(desktopGrid).not.toContain("auto-fit");
    expect(strategyStyles).toContain(".design-strategy-workbench .strategy-draft-grid");
    expect(strategyStyles).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(strategyStyles).toContain(".strategy-draft-grid,");
    expect(strategyStyles).toContain("grid-template-columns: minmax(0, 1fr);");
    expect(strategyStyles).toContain(".design-strategy-workbench .strategy-draft-field");
    expect(strategyStyles).toContain("grid-column: span 1;");
    expect(cssBlock(".strategy-condition-options")).toContain("position: absolute;");
  });

  test("preflights strategy readiness without navigating away from the research workspace", () => {
    const runPipelineSource = sourceBetweenText(researchControllerSource, "const runPipeline = useCallback", "const copyResearchContextLink = useCallback");

    expect(runPipelineSource).toContain("validateStrategySnapshot(quantCoreBaseUrl");
    expect(runPipelineSource).toContain('preflight.validation?.status === "blocked"');
    expect(runPipelineSource).not.toContain('setActiveWorkAreaId("strategy")');
    expect(runPipelineSource).not.toContain('setActiveWorkAreaId("backtest")');
    expect(runPipelineSource).not.toContain('setActiveLoopStepId("strategy")');
    expect(runPipelineSource).not.toContain('setActiveLoopStepId("backtest")');
    expect(runPipelineSource).toContain("setStrategyValidationState(preflight)");
    expect(runPipelineSource).toContain("Strategy preflight blocked");
  });

  test("shows a dismissible completion notice only after the audited research run is fully refreshed", () => {
    const runPipelineSource = sourceBetweenText(researchControllerSource, "const runPipeline = useCallback", "const copyResearchContextLink = useCallback");
    const completionNoticeSource = researchCompletionNoticeSource;

    expect(appSource).toContain("const [researchCompletionNotice, setResearchCompletionNotice]");
    expect(appSource).toContain("readbackReady: boolean;");
    expect(runPipelineSource).toContain("setResearchCompletionNotice(null)");
    expect(runPipelineSource.indexOf("const strategyLibraryReadback = await refreshStrategyLibrary();")).toBeLessThan(
      runPipelineSource.indexOf("setResearchCompletionNotice({")
    );
    expect(runPipelineSource).toMatch(
      /const strategyLibraryReadback = await refreshStrategyLibrary\(\);\s*if \(workflowRunIdRef\.current !== runId\) \{\s*return false;\s*\}\s*setIsRunning\(false\);\s*if \(researchSummary\)/
    );
    expect(runPipelineSource).toContain(
      'runHistoryReadback.source === "core" && strategyLibraryReadback.source === "core"'
    );
    expect(completionNoticeSource).toContain('className="research-completion-notice"');
    expect(completionNoticeSource).toContain('aria-live="polite"');
    expect(completionNoticeSource).toContain('role="status"');
    expect(completionNoticeSource).toContain("onClick={dismissResearchCompletionNotice}");
    expect(appSource).toContain("const dismissResearchCompletionNotice = useCallback(() => setResearchCompletionNotice(null), [])");
    expect(completionNoticeSource).toContain("审计运行已创建 · 列表回读待恢复");
    expect(cssBlock(".research-completion-notice")).toContain("position: fixed;");
    expect(cssBlock(".research-completion-notice")).toContain("z-index:");
    expect(cssBlock(':root[data-theme="light"] .research-completion-notice')).toContain(
      "background: var(--surface);"
    );
  });

  test("keeps the current AI review mounted while a replacement review is running", () => {
    const runReviewSource = sourceBetween(
      "const runAiReviewStage3 = useCallback",
      "const inspectAiReviewStage3 = useCallback"
    );

    expect(runReviewSource).not.toContain("setAiReviewStage3CurrentReview(null)");
    expect(runReviewSource).not.toContain("setAiReviewStage3Decisions([])");
    expect(runReviewSource).not.toContain("setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft([]))");
    expect(runReviewSource.indexOf("setAiReviewStage3CurrentReview(result.review)")).toBeGreaterThan(
      runReviewSource.indexOf('result.source !== "core" || !result.review')
    );
  });

  test("uses a themed research preflight dialog instead of browser confirmation", () => {
    const runPipelineSource = sourceBetweenText(researchControllerSource, "const runPipeline = useCallback", "const copyResearchContextLink = useCallback");
    const blockedPreflightSource = sourceBetweenText(
      runPipelineSource,
      "if (!researchPipelinePreflight.canRun) {",
      "if (researchPipelinePreflight.requiresConfirmation"
    );
    const openPreflightIssueSource = sourceBetweenText(
      researchControllerSource,
      "const openResearchPipelinePreflightIssue = useCallback",
      "const openLatestResearchContextReportInAudit"
    );
    const confirmationDialogSource = researchPipelinePreflightDialogSource;
    const terminalSurfaceActionSource = sourceBetween(
      "const terminalSurfaceAction:",
      "const automatedTradingTargetWorkspaceId"
    );

    expect(appSource).not.toContain("window.confirm");
    expect(runPipelineSource).toContain("setIsResearchPipelineConfirmationOpen(true)");
    expect(runPipelineSource).toContain('confirmation !== "accepted"');
    expect(blockedPreflightSource).toContain("setIsResearchPipelineConfirmationOpen(true)");
    expect(appSource).toContain("researchPipelineConfirmationDialogRef.current?.showModal()");
    expect(appSource).toContain("researchPipelineConfirmationCancelButtonRef.current?.focus()");
    expect(appSource).toContain("<dialog");
    expect(appSource).toContain('role="alertdialog"');
    expect(appSource).toContain('className="research-confirmation-dialog"');
    expect(appSource).toContain('className="research-confirmation-modal"');
    expect(appSource).toContain("!researchPipelineConfirmationDialogRef.current?.open");
    expect(confirmationDialogSource).toContain("onCancel={closeResearchPipelinePreflight}");
    expect(appSource).toContain("const closeResearchPipelinePreflight = useCallback(");
    expect(confirmationDialogSource).toContain("ref={researchPipelineConfirmationCancelButtonRef}");
    expect(confirmationDialogSource).toContain("researchContextReadinessValue(i18n, issue)");
    expect(confirmationDialogSource).toContain("researchContextReadinessDetail(i18n, issue)");
    expect(confirmationDialogSource).toContain("openResearchPipelinePreflightIssue(issue)");
    expect(confirmationDialogSource).toContain('className="research-confirmation-issue-action"');
    expect(confirmationDialogSource).toContain('researchPipelinePreflight.status === "blocked"');
    expect(confirmationDialogSource).toContain("项阻止运行");
    expect(confirmationDialogSource).toContain("researchPipelinePreflight.canRun ? (");
    expect(openPreflightIssueSource).toContain('issue.action === "refresh-cache"');
    expect(openPreflightIssueSource).toContain("!marketDataRefreshGuard.blocked");
    expect(openPreflightIssueSource).toContain("runResearchContextReadinessAction(");
    expect(openPreflightIssueSource).toContain("refreshSelectedMarketCache");
    expect(openPreflightIssueSource).toContain("refreshWatchlistMarketCache");
    expect(confirmationDialogSource).toContain("researchContextReadinessActionLabel(");
    expect(confirmationDialogSource).toContain("isResearchContextActionDisabled(");
    expect(confirmationDialogSource).not.toContain("<strong>{issue.value}</strong>");
    expect(appSource).toContain('void runPipeline("accepted")');
    expect(confirmationDialogSource).toContain('"确认并运行研究"');
    expect(terminalSurfaceActionSource).toContain('label: isRunning ? "研究运行中…" : "运行研究"');
    expect(appSource).toContain('id="terminal-symbol-input"');
    expect(appSource).not.toContain('id="operations-market-data"');
    expect(appSource).not.toContain('id="operations-market-calendar"');
    expect(appSource).toContain("researchPipelinePreflightIssueTargets");
    expect(cssBlock(".research-confirmation-dialog")).toContain("background: transparent;");
    expect(cssBlock(".research-confirmation-modal")).toContain("width: min(520px, calc(100vw - 32px));");
    expect(cssBlock(".research-confirmation-issues article.blocked")).toContain("background:");
    expect(cssBlock(".research-confirmation-issue-action:focus-visible")).toContain("outline:");
    expect(cssBlock(':root[data-theme="light"] .research-confirmation-dialog')).toContain("color: var(--text);");
    expect(cssBlock(':root[data-theme="light"] .research-confirmation-modal')).toContain("background: var(--surface);");
    expect(cssBlock(':root[data-theme="light"] .research-confirmation-issues article')).toContain(
      "background: var(--surface-raised);"
    );
    expect(cssBlock(':root[data-theme="light"] .research-confirmation-issues article.blocked')).toContain(
      "background: #fff2f0;"
    );
  });

  test("preflights strategy readiness before saving a strategy version", () => {
    const saveStrategySource = sourceBetween("const saveCurrentStrategyVersion = useCallback", "const saveCurrentResearchNote");

    expect(saveStrategySource).toContain("validateStrategySnapshot(quantCoreBaseUrl");
    expect(saveStrategySource).toContain('preflight.validation?.status === "blocked"');
    expect(saveStrategySource).toContain("setStrategyValidationState(preflight)");
    expect(saveStrategySource).toContain("Strategy version blocked by readiness gates");
    expect(saveStrategySource).toContain("saveStrategySnapshot(quantCoreBaseUrl");
  });

  test("renders strategy library save and reload controls", () => {
    const runPipelineSource = sourceBetween("const runPipeline = useCallback", "const replayRun = useCallback");
    const deleteStrategySource = sourceBetween(
      "const deleteSavedStrategyVersion = useCallback",
      "const saveCurrentResearchNote = useCallback"
    );

    expect(appSource).toContain("loadStrategyLibrary");
    expect(appSource).toContain("saveStrategySnapshot");
    expect(appSource).toContain("deleteStrategyVersion");
    expect(appSource).toContain("buildStrategyVersionDiffRows");
    expect(appSource).toContain("buildStrategyGovernanceQueueRows");
    expect(appSource).toContain("pendingStrategyGovernanceAction");
    expect(appSource).toContain("runStrategyGovernanceAction");
    expect(appSource).toContain("saveCurrentStrategyVersion");
    expect(appSource).toContain("loadSavedStrategyVersion");
    expect(appSource).toContain("deleteSavedStrategyVersion");
    expect(appSource).toContain("workspaceWithStrategyLibraryItem");
    expect(appSource).toContain('i18n.t("strategy.context")');
    expect(appSource).toContain('i18n.t("strategy.auditRun")');
    expect(appSource).toContain('i18n.t("strategy.diff")');
    expect(appSource).toContain('className="strategy-library-diff"');
    expect(appSource).toContain('i18n.t("strategy.loadedVersion")');
    expect(appSource).toContain('className="research-confirmation-dialog strategy-delete-dialog"');
    expect(appSource).toContain('role="alertdialog"');
    expect(appSource).toContain('className="strategy-library-card-actions"');
    expect(appSource).toContain('className="strategy-delete-button"');
    expect(appSource).not.toContain("window.confirm");
    expect(runPipelineSource).toContain("await refreshStrategyLibrary();");
    expect(deleteStrategySource).toContain("await refreshStrategyLibrary();");
    expect(deleteStrategySource).not.toContain("strategies.filter");
    expect(appSource).toContain('className="strategy-library-list"');
    expect(appSource).toContain('className="strategy-library-actions"');
    expect(appSource).toContain('className="strategy-governance-queue"');
    expect(appSource).toContain("strategyGovernanceQueue.summary.totalRows");
    expect(appSource).toContain("strategyGovernanceActionLabel");
    expect(appSource).toContain("strategyGovernanceDetailLabel");
    expect(appSource).toContain("strategyGovernanceChangedFieldLabel");
    expect(appSource).toContain("strategyGovernanceContextLabel");
    expect(appSource).toContain("strategyGovernanceValidationDetailLabel");
    expect(styles).toContain(".strategy-library-list");
    expect(styles).toContain(".strategy-library-card");
    expect(styles).toContain(".strategy-library-card small");
    expect(styles).toContain(".strategy-library-card-actions");
    expect(styles).toContain(".strategy-delete-confirm");
    expect(
      cssBlock(
        ".design-strategy-workbench .strategy-library-card .strategy-delete-button,\n" +
          ".design-strategy-workbench .strategy-delete-confirm"
      )
    ).toContain("color: var(--danger);");
    expect(styles).toContain(".strategy-diff-chip.warning");
    expect(styles).toContain(".strategy-governance-queue");
    expect(styles).toContain(".strategy-governance-summary");
    expect(styles).toContain(".strategy-governance-row");
    expect(cssBlock(".strategy-governance-row")).toContain(
      "grid-template-columns: minmax(130px, 0.85fr) minmax(108px, 0.55fr) minmax(220px, 1fr) minmax(96px, 0.3fr);"
    );
    expect(cssBlock(".strategy-governance-row span")).toContain("text-align: center;");
    expect(cssBlock(".strategy-governance-row button")).toContain("justify-self: center;");
    expect(hasCssBlockWith("  .design-strategy-workbench .strategy-governance-row > span", ["text-align: left;"])).toBe(true);
    expect(hasCssBlockWith("  .design-strategy-workbench .strategy-governance-row button", ["justify-self: start;"])).toBe(true);
  });

  test("hands an audited strategy to automated trading without starting or authorizing it", () => {
    const bindingSource = sourceBetween(
      "const bindStrategyToProduction = useCallback",
      "const deleteSavedStrategyVersion = useCallback"
    );
    const strategySummarySource = sourceBetween(
      "function StrategySummary",
      "function StrategyTemplatePicker"
    );

    expect(appSource).toContain("loadStrategyProductionBinding");
    expect(bindingSource).toContain("updateStrategyProductionBinding(quantCoreBaseUrl");
    expect(bindingSource).toContain("strategyRevision: strategy?.revision ?? null");
    expect(bindingSource).toContain("auditRunId: strategy?.auditRunId ?? null");
    expect(bindingSource).not.toContain("enabled:");
    expect(bindingSource).not.toContain("liveConfirmed:");
    expect(strategySummarySource).toContain('className={`strategy-production-binding');
    expect(strategySummarySource).toContain('className="research-confirmation-dialog strategy-production-dialog"');
    expect(strategySummarySource).toContain('id="strategy-production-operator"');
    expect(strategySummarySource).toContain("交接只改变自动评估使用的策略");
    expect(strategySummarySource).toContain('item.market === "crypto"');
    expect(strategySummarySource).toContain('item.symbol === "BTC/USDT"');
    expect(strategySummarySource).toContain('item.timeframe === "1m"');
    expect(appSource).not.toContain("window.confirm");
    expect(styles).toContain(".strategy-production-binding");
    expect(styles).toContain(".strategy-production-dialog-summary");
  });

  test("qualifies a backtest on the server before explicit production strategy handoff", () => {
    const backtestSource = backtestPageSource;
    const bindingSource = sourceBetween(
      "const bindStrategyToProduction = useCallback",
      "const deleteSavedStrategyVersion = useCallback"
    );

    expect(appSource).toContain("loadResearchRunProductionStrategyHandoff(");
    expect(appSource).toContain("productionStrategyHandoff={{");
    expect(backtestSource).toContain("productionStrategyHandoff?.result.handoff");
    expect(backtestSource).toContain("生产策略资格与交接");
    expect(backtestSource).toContain("不会授权实盘、启动监控、立即评估或提交订单");
    expect(backtestSource).toContain('id="backtest-production-confirm"');
    expect(backtestSource).toContain("maxLength={80}");
    expect(bindingSource).toContain("result.binding ? result : { ...result, binding: current.binding }");
    expect(bindingSource).not.toContain("enabled:");
    expect(bindingSource).not.toContain("liveConfirmed:");
    expect(styles).toContain(".design-production-handoff");
    expect(styles).toContain(".design-production-handoff-grid");
    expect(styles).toContain(".design-production-handoff-check");
  });

  test("routes AI-reviewed candidates through re-audit or the existing production handoff", () => {
    const aiReviewSource = aiReviewPanelSource;

    expect(appSource).toContain("const aiReviewStage3PrimaryCandidateAvailable = Boolean(");
    expect(appSource).toContain(
      "visibleStrategyExperimentActive.resultHash === aiReviewStage3PrimaryReference.resultHash"
    );
    expect(appSource).toContain(
      "aiReviewStage3PrimaryCandidate?.candidateRevision === aiReviewStage3PrimaryReference.candidateRevision"
    );
    expect(appSource).toContain('activeWorkAreaId === "ai-review"');
    expect(appSource).toContain("aiReviewStage3PrimaryReference.sourceRunId");
    expect(appSource).toContain("onStagePrimaryCandidate: () => {");
    expect(appSource).toContain("loadStrategyExperimentCandidate(");
    expect(appSource).toContain('activeWorkAreaId !== "backtest" || !handoff');
    expect(appSource).toContain("switchBlockedReasonLabel:");
    expect(aiReviewSource).toContain("人工研究决策");
    expect(aiReviewSource).toContain("采用已评审候选并重新审计");
    expect(aiReviewSource).toContain("前往回测完成生产交接");
    expect(aiReviewSource).toContain("前往动态交易复核");
    expect(aiReviewSource).toContain(
      "handoff.dataSnapshotHash === reference.snapshotId"
    );
    expect(aiReviewSource).toContain('binding.status === "ready"');
    expect(aiReviewSource).toContain('handoff?.status === "active"');
    expect(aiReviewSource).toContain("不等于生产批准");
    expect(aiReviewSource).not.toMatch(/\bonBind\b/);
    expect(terminalWorkspaceSurfaceSource).not.toContain("<AiReviewPage {...props}");
    expect(aiReviewSource).not.toContain("productionStrategyHandoff.onBind");
    expect(aiReviewSource).not.toContain("liveConfirmed:");
    expect(aiReviewSource).not.toContain("enabled:");
    expect(styles).toContain(".surface-ai-review .design-ai-decision-form");
    expect(styles).toContain(".surface-ai-review .design-ai-production-handoff");
  });

  test("projects the existing production risk chain into portfolio without adding live actions", () => {
    const portfolioSource = portfolioPageSource;

    expect(appSource).toContain("loadAutoTradingSnapshot(quantCoreBaseUrl)");
    expect(appSource).toContain("AUTO_TRADING_STATUS_REFRESH_INTERVAL_MS");
    expect(appSource).toContain("portfolioProductionRiskRequestIdRef.current !== requestId");
    expect(appSource).toContain("portfolioProductionRisk={{");
    expect(portfolioSource).toContain("独立生产策略与运行风险");
    expect(portfolioSource).toContain("不代表研究组合已接入生产");
    expect(portfolioSource).toContain("productionSnapshot?.strategyBinding");
    expect(portfolioSource).toContain("productionPortfolioCoverageCount");
    expect(portfolioSource).toContain('productionState.runnerHealth?.status === "running"');
    expect(portfolioSource).toContain("productionState.lastAccountCheck?.accountCovered === true");
    expect(portfolioSource).toContain("productionState?.lastDecisionContract?.riskAdjustedTarget");
    expect(portfolioSource).toContain("生产授权：{liveAuthorizationLabel(productionState)}");
    expect(portfolioSource).toContain("前往动态交易复核");
    expect(portfolioSource).not.toContain('["路由风险", "模拟成交状态", "回放精确性"]');
    expect(portfolioSource).not.toContain("productionStrategyHandoff.onBind");
    expect(portfolioSource).not.toContain("liveConfirmed:");
    expect(portfolioSource).not.toContain("enabled:");
    expect(hasCssDeclaration(".design-portfolio-production-risk", "grid-column: 1 / 3;")).toBe(true);
    expect(styles).toContain(
      ".portfolio-m5-section,\n  .design-portfolio-production-risk {\n    grid-column: 1;"
    );
  });

  test("renders a compact portfolio paper ops queue across portfolio and execution workspaces", () => {
    expect(appSource).toContain("buildPortfolioPaperOpsQueueRows");
    expect(appSource).toContain("runPortfolioPaperOpsQueueAction");
    expect(executionPanelSource).toContain("PortfolioPaperOpsQueuePanel");
    expect(executionPanelSource).toContain('className="portfolio-paper-ops-queue"');
    expect(appSource).toContain("portfolioPaperOpsQueue={portfolioPaperOpsQueue}");
    expect(executionPanelSource).toContain("portfolioPaperOpsActionLabel");
    expect(styles).toContain(".portfolio-paper-ops-queue");
    expect(styles).toContain(".portfolio-paper-ops-summary");
    expect(styles).toContain(".portfolio-paper-ops-row");
    expect(cssBlock(".portfolio-paper-ops-row")).toContain(
      "grid-template-columns: minmax(120px, 0.8fr) minmax(120px, 0.7fr) minmax(240px, 1.4fr) auto;"
    );
  });

  test("hydrates the selected research evidence from its audited run detail", () => {
    expect(appSource).toContain(
      'if (activeWorkAreaId !== "research" && activeWorkAreaId !== "backtest" && activeWorkAreaId !== "ai-review")'
    );
    expect(appSource).toContain("latestRun.dataSnapshot?.snapshotHash");
    expect(appSource).toContain("loadResearchRunDetail(quantCoreBaseUrl, latestRun.runId)");
    expect(appSource).toContain(
      "runs: current.runs.map((run) => run.runId === detail.run!.runId ? detail.run! : run)"
    );
    expect(appSource).toContain("workspaceFromResearchRunAudit(current.workspace, detail.run!)");
  });

  test("consumes each external note authorization and protects drafts changed during generation", () => {
    const generateNoteSource = sourceBetween(
      "const generateCurrentResearchNoteDraft = useCallback",
      "const selectResearchNoteProvider = useCallback"
    );

    expect(appSource).toContain("const researchNoteDraftVersionRef = useRef(0)");
    expect(appSource).toContain("const updateResearchNoteDraft = useCallback");
    expect(appSource).toContain("const applyGeneratedResearchNoteDraft = useCallback");
    expect(appSource).toContain("const editResearchNoteDraft = useCallback");
    expect(appSource).toContain("researchNoteDraftGenerationAbortControllerRef.current.abort()");
    expect(generateNoteSource).toContain("const draftVersionBeforeRequest = researchNoteDraftVersionRef.current");
    expect(generateNoteSource).toContain('if (researchNoteProviderId !== "local")');
    expect(generateNoteSource).toContain("setResearchNoteExternalDataApproved(false)");
    expect(appSource).toContain("isResearchNoteDraftStreamCurrent");
    expect(generateNoteSource).toContain("const streamIdentity = {");
    expect(generateNoteSource).toContain(
      "draftVersion: researchNoteDraftVersionRef.current"
    );
    expect(generateNoteSource).toContain(
      'result.generation.status === "failed" || result.generation.fallbackUsed'
    );
    expect(generateNoteSource).toContain(
      "const draftWasEmptyBeforeRequest = draftBeforeRequest.trim().length === 0"
    );
    expect(generateNoteSource).toContain("if (draftWasEmptyBeforeRequest)");
    expect(generateNoteSource.indexOf("result.generation.status ===")).toBeLessThan(
      generateNoteSource.indexOf("applyGeneratedResearchNoteDraft(result.draft.body)")
    );
    expect(generateNoteSource).toContain("applyGeneratedResearchNoteDraft(body)");
    expect(generateNoteSource).toContain("onReset: async () =>");
    expect(generateNoteSource).toContain(
      "applyGeneratedResearchNoteDraft(draftBeforeRequest)"
    );
    expect(generateNoteSource).toContain("applyGeneratedResearchNoteDraft(result.draft.body)");
    expect(generateNoteSource).toContain("signal: controller.signal");
    expect(generateNoteSource).toContain("await waitForNextPaint()");
    expect(appSource).toContain(
      "window.requestAnimationFrame(() => {\n      window.requestAnimationFrame(finish);"
    );
    expect(appSource).toContain("window.setTimeout(finish, 100)");
    expect(appSource).toContain("onNoteChange: editResearchNoteDraft");
    expect(appSource).not.toContain("researchNoteGenerationPreview");
    expect(appSource).not.toContain("AI 已验证章节预览");
  });

  test("backtest lab rejects invalid strategy experiment drafts before submit", async () => {
    const component = await import("../components/StrategyExperimentSection");
    expect(typeof component.isStrategyExperimentDraftValid).toBe("function");
    const validDimensions = [
      { conditionSide: "entry", conditionIndex: 0, parameter: "window", values: [5, 10] },
      { conditionSide: "exit", conditionIndex: 1, parameter: "threshold", values: [20, 30] }
    ];
    const validGuardrails = { minimumTradeCount: 2, maximumDrawdownPct: 20 };

    expect(component.isStrategyExperimentDraftValid(validDimensions, validGuardrails, null)).toBe(true);
    expect(
      component.isStrategyExperimentDraftValid(validDimensions, validGuardrails, {
        trainBars: 40,
        validationBars: 10,
        stepBars: 10
      })
    ).toBe(true);

    const invalidDimensions = [
      [],
      [{ ...validDimensions[0], conditionIndex: -1 }],
      [{ ...validDimensions[0], values: [] }],
      [{ ...validDimensions[0], values: [Number.NaN] }],
      [{ ...validDimensions[0], values: [1.5] }],
      [{ ...validDimensions[0], values: [0] }],
      [{ ...validDimensions[0], values: [251] }],
      [{ ...validDimensions[1], values: [-1] }],
      [{ ...validDimensions[1], values: [101] }],
      [validDimensions[0], { ...validDimensions[0] }],
      [{ ...validDimensions[0], values: Array.from({ length: 82 }, (_, index) => index + 1) }]
    ];
    invalidDimensions.forEach((dimensions) => {
      expect(component.isStrategyExperimentDraftValid(dimensions, validGuardrails, null)).toBe(false);
    });

    expect(component.isStrategyExperimentDraftValid(validDimensions, { ...validGuardrails, minimumTradeCount: -1 }, null)).toBe(false);
    expect(component.isStrategyExperimentDraftValid(validDimensions, { ...validGuardrails, minimumTradeCount: 1.5 }, null)).toBe(false);
    expect(component.isStrategyExperimentDraftValid(validDimensions, { ...validGuardrails, maximumDrawdownPct: 101 }, null)).toBe(false);
    expect(component.isStrategyExperimentDraftValid(validDimensions, validGuardrails, { trainBars: 0, validationBars: 10, stepBars: 10 })).toBe(false);
    expect(component.isStrategyExperimentDraftValid(validDimensions, validGuardrails, { trainBars: 40, validationBars: 1.5, stepBars: 10 })).toBe(false);
  });

  test("collapses the terminal and workflow grid before cards become squeezed", () => {
    expect(styles).toContain("@media (max-width: 960px)");
    expect(
      hasCssBlockWith("@media (max-width: 960px) {\n  .terminal-shell", [
        "grid-template-columns: 68px minmax(0, 1fr);",
        "height: auto;"
      ])
    ).toBe(true);
    expect(hasCssBlockWith("  .left-rail", ["position: sticky;", "height: 100vh;"])).toBe(true);
    expect(hasCssBlockWith("  .loop-step", ["min-height: 50px;", "padding: 7px 5px;"])).toBe(true);
    expect(
      hasCssBlockWith(
        "  .loop-step-copy,\n  .work-area-copy,\n  .work-area-stage,\n  .work-area-status,\n  .workflow-next-action,\n  .left-rail .workspace-card",
        ["display: none;"]
      )
    ).toBe(true);
    expect(hasCssBlockWith("  .terminal-topbar", ["min-height: auto;", "padding: 8px 10px;"])).toBe(true);
    expect(hasCssDeclaration("  .center-grid,\n  .workflow-layout", "grid-template-columns: 1fr;")).toBe(true);
  });

  test("releases the left rail from the viewport on the single-column narrow layout", () => {
    const tabletMedia = sourceBetweenText(
      styles,
      "@media (max-width: 960px) {",
      "@media (max-width: 860px) {"
    );
    const narrowMedia = sourceBetweenText(
      styles,
      "@media (max-width: 860px) {",
      "@media (max-width: 560px) {"
    );
    const tabletLeftRail = sourceBetweenText(tabletMedia, "  .left-rail {", "  }");
    const narrowLeftRail = sourceBetweenText(narrowMedia, "  .left-rail {", "  }");

    expect(tabletLeftRail).toContain("position: sticky;");
    expect(tabletLeftRail).toContain("height: 100vh;");
    expect(narrowLeftRail).toContain("position: sticky;");
    expect(narrowLeftRail).toContain("grid-template-columns: auto minmax(0, 1fr);");
    expect(narrowLeftRail).toContain("height: auto;");
    expect(narrowLeftRail).toContain("overflow: visible;");
  });

  test("renders AI review as an evidence-locked dossier", () => {
    expect(appSource).toContain("buildAiReviewDossier(workspace)");
    expect(appSource).toContain("buildAiReviewReportMarkdown(workspace)");
    expect(appSource).toContain("exportAiReviewMarkdown");
    expect(appSource).toContain('i18n.t("aiReview.exportMarkdown")');
    expect(appSource).toContain("<AiReviewDossierBoard");
    expect(aiReviewAuditBoardsSource).toContain('"benchmark": "基准 Alpha"');
    expect(aiReviewAuditBoardsSource).toContain('className="ai-dossier"');
    expect(aiReviewAuditBoardsSource).toContain('className="ai-dossier-grid"');
    expect(aiReviewAuditBoardsSource).toContain('className={`ai-dossier-card');
    expect(styles).toContain(".ai-dossier");
    expect(styles).toContain(".ai-dossier-grid");
    expect(styles).toContain(".ai-dossier-card");
  });

  test("localizes persisted strategy experiment citations without rewriting opaque evidence", () => {
    const citationLocalizationSource = sourceBetweenText(
      aiReviewAuditBoardsSource,
      "function aiCitationLabel",
      "function aiCitationValue"
    );
    const valueSource = sourceBetweenText(aiReviewAuditBoardsSource, "function aiCitationValue", "function aiCitationDetail");
    const detailSource = sourceBetweenText(aiReviewAuditBoardsSource, "function aiCitationDetail", "function formatChartDate");

    expect(citationLocalizationSource).toContain('"parameter-scan": "持久化策略实验"');
    expect(valueSource).toContain('if (citation.id === "parameter-scan")');
    const valueGuardIndex = valueSource.indexOf('if (citation.id === "parameter-scan")');
    ['.replace("candidate for re-audit"', '.replace("complete"', '.replace("review"', '.replace("trades"'].forEach(
      (replacement) => expect(valueGuardIndex).toBeLessThan(valueSource.indexOf(replacement))
    );
    expect(detailSource).toContain("citation: AiReviewCitation");
    expect(detailSource).toContain('if (citation.id === "parameter-scan")');
    const detailGuardIndex = detailSource.indexOf('if (citation.id === "parameter-scan")');
    expect(detailGuardIndex).toBeLessThan(
      detailSource.indexOf('.replace("Current parameter row is missing from the locked scan."')
    );
    expect(detailGuardIndex).toBeLessThan(detailSource.indexOf('.replace("candidates"'));
    expect(aiReviewAuditTrailPanelSource).toContain("aiCitationDetail(i18n, citation)");
  });

  test("renders portfolio paper order approvals as operator actions", () => {
    expect(appSource).toContain("loadPortfolioPaperOrderApprovals");
    expect(appSource).toContain("recordPortfolioPaperOrderApproval");
    expect(appSource).toContain("buildPortfolioPaperOrderApprovalRows");
    expect(appSource).toContain("portfolioPaperOrderApprovalRows");
    expect(appSource).toContain("onApprovePortfolioOrder");
    expect(appSource).toContain("onRejectPortfolioOrder");
    expect(executionPanelSource).toContain('className="portfolio-order-approval"');
    expect(executionPanelSource).toContain('className={`portfolio-order-approval-row');
    expect(styles).toContain(".portfolio-order-approval");
    expect(styles).toContain(".portfolio-order-approval-actions");
  });

  test("renders portfolio paper order simulations as paper-only fills", () => {
    expect(appSource).toContain("loadPortfolioPaperOrderSimulations");
    expect(appSource).toContain("recordPortfolioPaperOrderSimulation");
    expect(appSource).toContain("portfolioPaperOrderSimulations");
    expect(appSource).toContain("onSimulatePortfolioOrder");
    expect(appSource).toContain("simulatingPortfolioOrderId");
    expect(executionPanelSource).toContain('className="portfolio-order-simulation"');
    expect(executionPanelSource).toContain('className="portfolio-order-simulation-list"');
    expect(styles).toContain(".portfolio-order-simulation");
    expect(styles).toContain(".portfolio-order-simulation-list");
  });

  test("renders controlled batch paper order simulation actions", () => {
    expect(appSource).toContain("recordPortfolioPaperOrderBatchSimulation");
    expect(appSource).toContain("simulatePortfolioPaperOrderBatch");
    expect(appSource).toContain("isSimulatingPortfolioPaperOrderBatch");
    expect(appSource).toContain("onSimulatePortfolioOrderBatch");
    expect(executionPanelSource).toContain('className="portfolio-simulation-route-batch-action"');
    expect(styles).toContain(".portfolio-simulation-route-batch-action");
  });

  test("renders the latest portfolio paper fill as a timeline focus cue", () => {
    expect(appSource).toContain("buildPortfolioPaperOrderLatestSimulationSummary");
    expect(appSource).toContain("portfolioPaperOrderSimulations");
    expect(appSource).toContain("portfolioPaperOrderReplay");
    expect(appSource).toContain("portfolioPaperOrderStateHistories");
    expect(appSource).toContain("portfolioOrderLatestSimulationSummary");
    expect(executionPanelSource).toContain("setPortfolioOrderFocusedStateId");
    expect(executionPanelSource).toContain("const focusedPortfolioOrderStateRef = useRef<HTMLElement | null>(null);");
    expect(executionPanelSource).toContain('focusedPortfolioOrderStateRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });');
    expect(executionPanelSource).toContain("ref={portfolioOrderFocusedStateId === row.id ? focusedPortfolioOrderStateRef : undefined}");
    expect(executionPanelSource).toContain("onFocusPortfolioOrderStateAuditQuery");
    expect(executionPanelSource).toContain('className="portfolio-order-state-audit-action"');
    expect(executionPanelSource).toContain("onClick={() => onFocusPortfolioOrderStateAuditQuery(row.focusQuery)}");
    expect(executionPanelSource).toContain('className={`portfolio-order-latest-simulation ${portfolioOrderLatestSimulationSummary.tone}`}');
    expect(executionPanelSource).toContain('className={`portfolio-order-state-row ${row.tone}${');
    expect(styles).toContain(".portfolio-order-latest-simulation");
    expect(styles).toContain(".portfolio-order-latest-simulation-action");
    expect(styles).toContain(".portfolio-order-state-audit-action");
    expect(styles).toContain(".portfolio-order-state-row.focused");
  });

  test("renders portfolio paper simulation route checks before fills", () => {
    expect(appSource).toContain("buildPortfolioPaperOrderSimulationRouteRows");
    expect(appSource).toContain("portfolioPaperOrderSimulationRouteRows");
    expect(appSource).toContain("portfolioOrderSimulationRouteRows");
    expect(executionPanelSource).toContain('className="portfolio-simulation-route"');
    expect(executionPanelSource).toContain('className={`portfolio-simulation-route-row ${row.tone}${');
    expect(executionPanelSource).toContain("row.stateEventId && portfolioOrderFocusedStateId === row.stateEventId");
    expect(executionPanelSource).toContain("setPortfolioOrderFocusedStateId(row.stateEventId)");
    expect(styles).toContain(".portfolio-simulation-route");
    expect(styles).toContain(".portfolio-simulation-route-row");
    expect(styles).toContain(".portfolio-simulation-route-row.focused");
  });

  test("renders portfolio paper order replay as account and position state", () => {
    expect(appSource).toContain("loadPortfolioPaperOrderReplay");
    expect(appSource).toContain("buildPortfolioPaperOrderReplaySummaryTiles(portfolioPaperOrderReplay)");
    expect(appSource).toContain("buildPortfolioPaperOrderReplayPositionRows(portfolioPaperOrderReplay)");
    expect(appSource).toContain("portfolioOrderReplaySummaryTiles");
    expect(appSource).toContain("portfolioOrderReplayPositionRows");
    expect(executionPanelSource).toContain('className="execution-grid portfolio-replay-grid"');
    expect(executionPanelSource).toContain('className="portfolio-order-replay"');
    expect(executionPanelSource).toContain('className="portfolio-order-replay-table"');
    expect(styles).toContain(".portfolio-replay-grid");
    expect(styles).toContain(".portfolio-order-replay");
    expect(styles).toContain(".portfolio-order-replay-row");
  });

  test("renders portfolio paper order state history as a compact timeline", () => {
    expect(appSource).toContain("loadPortfolioPaperOrderStateHistory");
    expect(appSource).toContain("buildPortfolioPaperOrderStateHistoryRows(portfolioPaperOrderStateHistories)");
    expect(appSource).toContain("portfolioOrderStateHistoryRows");
    expect(executionPanelSource).toContain('className="portfolio-order-state-history"');
    expect(executionPanelSource).toContain('className={`portfolio-order-state-row');
    expect(styles).toContain(".portfolio-order-state-history");
    expect(styles).toContain(".portfolio-order-state-row");
  });

  test("gates paper execution actions by audit binding with Golden Path rebind recovery", () => {
    expect(appSource).toContain("buildResearchRunContextBinding");
    expect(appSource).toContain("const researchRunContextBinding = buildResearchRunContextBinding(workspace)");
    expect(appSource).toContain("const currentResearchRunId = researchRunContextBinding.canUseRun ? workspace.researchRun?.runId : null");
    expect(appSource).toContain("const canRebindGoldenPathRun =");
    expect(appSource).toContain("!strategyDraftRequiresReaudit &&");
    expect(appSource).toContain("Boolean(goldenPath?.latestRunId) &&");
    expect(appSource).toContain("!canRebindGoldenPathRun &&");
    expect(appSource).toContain('riskApprovalSummary.status === "blocked"');
    expect(appSource).not.toContain("return isSubmittingPaperExecution || !workspace.researchRun?.runId");
  });

  test("renders platform settings from local-core status when available", () => {
    expect(appSource).toContain("loadPlatformSettings(quantCoreBaseUrl)");
    expect(appSource).toContain("settingsStatus.settings");
    expect(appSource).toContain("settings={settingsStatus.settings}");
    expect(appSource).toContain("settings?.dataSources");
    expect(appSource).toContain("settings?.executionAdapters");
    expect(appSource).toContain('className="settings-source-list"');
    expect(appSource).toContain('className={`settings-source-row');
    expect(styles).toContain(".settings-source-list");
    expect(styles).toContain(".settings-source-row");
  });

  test("renders external source telemetry on settings market data adapters", () => {
    expect(appSource).toContain("marketDataAdapterExternalTelemetryLabel(i18n, row.externalTelemetry)");
    expect(appSource).toContain("marketDataAdapterInstallGuidanceLabel(i18n, row.externalTelemetry.installGuidance)");
    expect(appSource).toContain("marketDataAdapterProviderErrorLabel(i18n, row.externalTelemetry.lastProviderError)");
    expect(appSource).toContain("marketDataAdapterProviderHealthLabel(i18n, row.externalTelemetry.providerHealth)");
    expect(appSource).toContain("依赖可用");
    expect(appSource).toContain("Dependency ready");
    expect(appSource).toContain("依赖缺失");
    expect(appSource).toContain("Dependency missing");
    expect(appSource).toContain("健康");
    expect(appSource).toContain("Provider health");
    expect(appSource).toContain("marketDataAdapterProviderHealthCategoryLabel(i18n, health.dominantCategory)");
    expect(appSource).toContain("主因");
    expect(appSource).toContain("Primary");
    expect(appSource).toContain("marketDataAdapterProviderHealthWindowSummaryLabel(i18n, health.windowSummary)");
    expect(appSource).toContain("趋势");
    expect(appSource).toContain("Trend");
    expect(appSource).toContain("建议退避");
    expect(appSource).toContain("Backoff");
    expect(appSource).toContain("最近错误");
    expect(appSource).toContain("Latest error");
    expect(appSource).toContain("marketDataAdapterProviderErrorCategoryLabel(i18n, error.category)");
    expect(appSource).toContain("限流");
    expect(appSource).toContain("Rate limit");
    expect(appSource).toContain("安装建议");
    expect(appSource).toContain("Install");
  });

  test("renders provider health trend strips on settings market data adapters", () => {
    expect(appSource).toContain("MarketDataProviderHealthTrendStrip");
    expect(appSource).toContain("buildMarketDataProviderHealthTrendRows(health)");
    expect(appSource).toContain("buildMarketDataProviderHealthTrendSummary(health)");
    expect(appSource).toContain('className={`provider-health-trend');
    expect(appSource).toContain("provider-health-trend-window level-${row.intensityLevel}");
    expect(appSource).toContain("providerHealthTrendMomentumLabel(i18n, summary.momentum)");
    expect(appSource).toContain("providerHealthTrendWindowLabel(i18n, row.id)");
    expect(appSource).toContain("providerHealthTrendLatestLabel(i18n, summary.latestErrorAt)");
    expect(styles).toContain(".provider-health-trend");
    expect(styles).toContain(".provider-health-trend-summary");
    expect(styles).toContain(".provider-health-trend-bars");
    expect(styles).toContain(".provider-health-trend-window");
    expect(styles).toContain(".provider-health-trend-window.level-4 .provider-health-trend-fill");
  });

  test("allocates width to all seven execution adapter columns", () => {
    expect(hasCssDeclaration(".design-adapter-table th:nth-child(1)", "width: 17%;")).toBe(true);
    expect(hasCssDeclaration(".design-adapter-table th:nth-child(2)", "width: 11%;")).toBe(true);
    expect(hasCssDeclaration(".design-adapter-table th:nth-child(3)", "width: 19%;")).toBe(true);
    expect(hasCssDeclaration(".design-adapter-table th:nth-child(4)", "width: 8%;")).toBe(true);
    expect(hasCssDeclaration(".design-adapter-table th:nth-child(5)", "width: 13%;")).toBe(true);
    expect(hasCssDeclaration(
      ".design-adapter-table th:nth-child(6),\n.design-adapter-table th:nth-child(7)",
      "width: 16%;",
    )).toBe(true);
  });

  test("keeps execution adapter status badges inside their table column", () => {
    expect(cssBlock(".design-adapter-table .design-status")).toContain("max-width: 100%;");
    expect(cssBlock(".design-adapter-table .design-status")).toContain("white-space: normal;");
  });

  test("localizes the execution adapter projection used by redesigned settings", () => {
    expect(appSource).toContain("terminalExecutionAdapterChainHealthRollups");
    expect(appSource).toContain("terminalExecutionAdapterHealthProbeRows");
    expect(appSource).toContain("terminalExecutionAdapterLedgerRows");
    expect(appSource).toContain("terminalBrokerAdapterRows");
    expect(appSource).toContain("adapterChainHealthStatusLabel(i18n, row.status)");
    expect(appSource).toContain("adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)");
    expect(appSource).toContain("adapterHealthProbeCredentialSummaryLabel(i18n, row.credentialSummary)");
    expect(appSource).toContain("adapterLedgerNextStep(i18n, row)");
    expect(appSource).toContain("brokerCertificationLabel(i18n, row.certification)");
  });

  test("top-aligns settings controls when one field includes helper text", () => {
    expect(cssBlock(".design-settings-field")).toContain("align-content: start;");
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

  test("keeps server monitoring read-only and responsive", () => {
    expect(executionAutoPaperTradingSource).toContain("api/operations/monitoring");
    expect(executionAutoPaperTradingSource).toContain("服务端运行告警");
    expect(executionAutoPaperTradingSource).toContain("本区域只读取运行状态");
    expect(executionAutoPaperTradingSource).not.toContain('variant === "operations"');
    expect(executionAutoPaperTradingSource).toContain(
      "snapshotReadRequestIdRef.current !== requestId"
    );
    expect(executionAutoPaperTradingSource).toContain(
      "monitoringReadRequestIdRef.current !== requestId"
    );
    expect(executionAutoPaperTradingSource).toContain("mountedRef.current = false");
    expect(executionAutoPaperTradingSource).toContain("<details>");
    expect(executionAutoPaperTradingSource).not.toContain("monitoring/restart");
    expect(cssBlock(".execution-auto-server-monitoring")).toContain("min-width");
    expect(styles).toContain(
      ".execution-auto-server-monitoring > dl {\n    grid-template-columns: repeat(2, minmax(0, 1fr));",
    );
  });

  test("keeps historical execution acceptance evidence to three visible rows", () => {
    expect(cssBlock(".execution-acceptance-audit-groups ul")).toContain("max-height: 17.5lh;");
    expect(cssBlock(".execution-acceptance-audit-groups ul")).toContain("overflow-y: auto;");
  });
});
