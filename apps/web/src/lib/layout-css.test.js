import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const strategyExperimentSectionSource = readFileSync(
  new URL("../components/StrategyExperimentSection.tsx", import.meta.url),
  "utf8"
);
const terminalWorkbenchSource = readFileSync(new URL("./terminal-workbench.ts", import.meta.url), "utf8");
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
    expect(appSource).toContain("productWorkAreas.map");
    expect(leftRailSource).toContain('className={`work-area-button');
    expect(leftRailSource).toContain("i18n.productWorkAreaLabel");
    expect(leftRailSource).toContain("i18n.productWorkAreaDescription");
    expect(leftRailSource).toContain("i18n.productWorkAreaDeliveryStage");
    expect(leftRailSource).toContain("i18n.productDevelopmentStageStatus");
    expect(leftRailSource).not.toContain("workspace.quantLoop.map");
  });

  test("shows selected timeframe cache coverage in market search suggestions", () => {
    const symbolSwitcherSource = sourceBetween('<form className="symbol-switcher"', "</form>");

    expect(appSource).toContain("loadMarketSearch(quantCoreBaseUrl, { market: marketDraft, query, limit: 8, timeframe: workspace.selectedTimeframe })");
    expect(symbolSwitcherSource).toContain("suggestion.cache");
    expect(symbolSwitcherSource).toContain("marketSearchCacheSummary(i18n, suggestion.cache)");
    expect(styles).toContain(".symbol-suggestion-cache");
  });

  test("lets stale or empty market search suggestions refresh cache without nested buttons", () => {
    const symbolSwitcherSource = sourceBetween('<form className="symbol-switcher"', "</form>");

    expect(appSource).toContain("const refreshSearchSuggestionCache = useCallback(");
    expect(appSource).toContain("await refreshCacheContext({");
    expect(appSource).toContain("timeframe: workspace.selectedTimeframe");
    expect(symbolSwitcherSource).toContain('className="symbol-suggestion-row"');
    expect(symbolSwitcherSource).toContain('className="symbol-suggestion-select"');
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
    expect(leftRailSource).toContain('className="work-area-index"');
    expect(leftRailSource).toContain('className="work-area-copy"');
    expect(leftRailSource).toContain('className="work-area-status"');
    expect(leftRailSource).toContain('className="work-area-stage"');
    expect(leftRailSource).toContain('activeWorkAreaId === area.id ? "selected active" : ""');
    expect(leftRailSource).not.toContain('i18n.t("section.terminalModules")');
    expect(leftRailSource).not.toContain('className="module-list"');
    expect(appSource).toContain("renderActiveProductWorkspace()");
  });

  test("uses the document as the single desktop scroll surface", () => {
    expect(appSource).not.toContain('<aside className="agent-rail">');
    expect(cssBlock(".terminal-shell")).toContain("min-height: 100vh;");
    expect(cssBlock(".terminal-shell")).toContain("grid-template-columns: 232px minmax(0, 1fr);");
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
    expect(cssBlock(".work-area-stage")).toContain("display: flex;");
    expect(hasCssDeclaration(".work-area-copy small", "display: block;")).toBe(true);
  });

  test("keeps the left navigation readable on desktop before collapsing to icon mode", () => {
    expect(cssBlock(".terminal-shell")).toContain("grid-template-columns: 232px minmax(0, 1fr);");
    expect(hasCssDeclaration(".left-rail", "padding: 14px;")).toBe(true);
    expect(cssBlock(".work-area-button")).toContain("min-height: 64px;");
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

  test("renders the golden path runbook as a compact task checklist", () => {
    expect(appSource).toContain("buildGoldenPathRunbookPreview(goldenPath)");
    expect(appSource).toContain('className="golden-path-runbook"');
    expect(appSource).toContain('className={`golden-path-runbook-item ${item.status}');
    expect(appSource).toContain("onClick={() => selectProductWorkArea(item.workspaceId as ProductWorkAreaId)}");
    expect(appSource).toContain('type="button"');
    expect(appSource).toContain("goldenPathRunbookPreview.map");
    expect(cssBlock(".golden-path-runbook")).toContain("display: grid;");
    expect(cssBlock(".golden-path-runbook-item")).toContain("grid-template-columns: auto minmax(0, 1fr) auto;");
    expect(cssBlock(".golden-path-runbook-item")).toContain("cursor: pointer;");
  });

  test("renders P0 platform readiness as a compact product gap summary", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildP0PlatformReadinessSummary(goldenPath)");
    expect(appSource).toContain("p0PlatformReadinessSummary");
    expect(overviewSource).toContain('className={`p0-readiness-summary ${p0PlatformReadinessSummary.state}`}');
    expect(overviewSource).toContain("p0PlatformReadinessHeadline");
    expect(overviewSource).toContain("p0PlatformReadinessDetail");
    expect(overviewSource).toContain("p0PlatformReadinessLiveBoundary");
    expect(overviewSource).toContain('className="p0-readiness-meter"');
    expect(overviewSource).toContain('style={{ width: `${p0PlatformReadinessSummary.progressPct}%` }}');
    expect(cssBlock(".p0-readiness-summary")).toContain("display: grid;");
    expect(cssBlock(".p0-readiness-summary")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(cssBlock(".p0-readiness-meter")).toContain("height: 5px;");
    expect(cssBlock(".p0-readiness-meter span")).toContain("transition: width 0.2s ease;");
  });

  test("surfaces latest P0 acceptance readback in the primary workbench", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("loadP0AcceptanceLatest");
    expect(appSource).toContain("const [p0AcceptanceLatestState, setP0AcceptanceLatestState]");
    expect(appSource).toContain("const refreshP0AcceptanceLatest = useCallback");
    expect(appSource).toContain("setP0AcceptanceLatestState(await loadP0AcceptanceLatest(quantCoreBaseUrl));");
    expect(appSource).toContain("buildP0AcceptanceSummary(p0AcceptanceLatestState.acceptance)");
    expect(overviewSource).toContain('className={`p0-acceptance-summary ${p0AcceptanceSummary.tone}`}');
    expect(overviewSource).toContain("p0AcceptanceSummaryHeadline");
    expect(overviewSource).toContain("p0AcceptanceSummaryDetail");
    expect(overviewSource).toContain("refreshP0AcceptanceLatest");
    expect(overviewSource).toContain('selectProductWorkArea("audit")');
    expect(cssBlock(".p0-acceptance-summary")).toContain("display: grid;");
    expect(cssBlock(".p0-acceptance-summary")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".p0-acceptance-summary")).not.toContain("overflow: auto;");
    expect(cssBlock(".p0-acceptance-summary.risk")).toContain("border-color: #7f3d39;");
    expect(cssBlock(".p0-acceptance-actions")).toContain("justify-content: flex-end;");
  });

  test("renders personal and small-team usability readiness on the overview card", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildPersonalTeamUsabilityReadinessSummary({");
    expect(appSource).toContain("buildDailyOpsControlRoomSummary({");
    expect(appSource).toContain("buildDailyOpsControlRoomReviewMarkdown({");
    expect(appSource).toContain("buildDailyOpsControlRoomReviewReference({");
    expect(appSource).toContain("buildPersonalTeamUsabilityReadinessReviewMarkdown({");
    expect(appSource).toContain("buildPersonalTeamUsabilityReadinessReviewReference({");
    expect(appSource).toContain("copyPersonalTeamReadinessReview");
    expect(appSource).toContain("downloadPersonalTeamReadinessReview");
    expect(appSource).toContain("recordPersonalTeamReadinessReview");
    expect(appSource).toContain("openPersonalTeamReadinessReviewInAudit");
    expect(appSource).toContain("copyPersonalTeamReadinessReviewAuditLink");
    expect(appSource).toContain("copyDailyOpsControlRoomReview");
    expect(appSource).toContain("downloadDailyOpsControlRoomReview");
    expect(appSource).toContain("recordDailyOpsControlRoomReview");
    expect(appSource).toContain("openDailyOpsControlRoomReviewInAudit");
    expect(appSource).toContain("copyDailyOpsControlRoomReviewAuditLink");
    expect(overviewSource).toContain('className={`personal-team-readiness ${personalTeamUsabilityReadiness.state}`}');
    expect(overviewSource).toContain("personalTeamUsabilityReadiness.personalPercent");
    expect(overviewSource).toContain("personalTeamUsabilityReadiness.teamPercent");
    expect(overviewSource).toContain('className="personal-team-readiness-actions"');
    expect(overviewSource).toContain(
      'className={`personal-team-readiness-review-reference ${personalTeamReadinessReviewReference.status}`}'
    );
    expect(overviewSource).toContain(
      "personalTeamReadinessReviewReferenceLabel(i18n, personalTeamReadinessReviewReference)"
    );
    expect(overviewSource).toContain("personalTeamReadinessReviewReference.query");
    expect(overviewSource).toContain("personalTeamUsabilityReadiness.openItems.slice(0, 3).map");
    expect(overviewSource).toContain("selectProductWorkArea(item.targetWorkspaceId)");
    expect(overviewSource).toContain('className={`daily-ops-control-room ${dailyOpsControlRoom.state}`}');
    expect(overviewSource).toContain("dailyOpsControlRoom.queueItems.map");
    expect(overviewSource).toContain("dailyOpsControlRoom.auditQuery");
    expect(overviewSource).toContain("copiedDailyOpsControlRoomReview");
    expect(overviewSource).toContain("savingDailyOpsControlRoomReview");
    expect(overviewSource).toContain('className={`daily-ops-review-reference ${dailyOpsControlRoomReviewReference.status}`}');
    expect(overviewSource).toContain("dailyOpsControlRoomReviewReferenceLabel(i18n, dailyOpsControlRoomReviewReference)");
    expect(overviewSource).toContain("dailyOpsControlRoomReviewReference.query");
    expect(cssBlock(".personal-team-readiness")).toContain("display: grid;");
    expect(cssBlock(".personal-team-readiness")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".personal-team-readiness-score")).toContain("grid-template-columns: repeat(2, auto);");
    expect(cssBlock(".personal-team-readiness-actions")).toContain("display: flex;");
    expect(cssBlock(".personal-team-readiness-actions button")).toContain("min-height: 32px;");
    expect(cssBlock(".personal-team-readiness-review-reference")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(cssBlock(".personal-team-readiness-review-reference-actions")).toContain("display: flex;");
    expect(cssBlock(".personal-team-readiness-open")).toContain(
      "grid-template-columns: repeat(2, minmax(0, 1fr));"
    );
    expect(cssBlock(".personal-team-readiness-item")).toContain("cursor: pointer;");
    expect(cssBlock(".daily-ops-control-room")).toContain("display: grid;");
    expect(cssBlock(".daily-ops-control-room")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".daily-ops-review-reference")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(cssBlock(".daily-ops-review-reference-actions")).toContain("display: flex;");
    expect(cssBlock(".daily-ops-queue")).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(cssBlock(".daily-ops-item")).toContain("cursor: pointer;");
  });

  test("renders one P0 golden path journey before detailed readiness evidence", () => {
    const overviewGridSource = sourceBetween('<section className="terminal-overview-grid market-tape">', '<div className="metrics-row">');

    expect(appSource).toContain("buildP0GoldenPathJourney({");
    expect(appSource).toContain("function P0GoldenPathJourneyPanel");
    expect((appSource.match(/<P0GoldenPathJourneyPanel/g) ?? []).length).toBe(1);
    expect(overviewGridSource).toContain("<P0GoldenPathJourneyPanel");
    expect(overviewGridSource.indexOf("<P0GoldenPathJourneyPanel")).toBeLessThan(
      overviewGridSource.indexOf('className={`p0-readiness-summary ${p0PlatformReadinessSummary.state}`')
    );
    expect(styles).toContain(".p0-golden-path-journey");
    expect(cssBlock(".p0-golden-path-journey")).toContain("display: grid;");
    expect(cssBlock(".p0-golden-path-steps")).toContain("grid-template-columns: repeat(7, minmax(0, 1fr));");
    expect(cssBlock(".p0-golden-path-step.current")).toContain("border-color: #4cc9ad;");
  });

  test("renders Stage 1/P0 daily-use closure before detailed readiness evidence", () => {
    const overviewGridSource = sourceBetween('<section className="terminal-overview-grid market-tape">', '<div className="metrics-row">');
    const recoveredShareBannerSource = sourceBetweenText(
      overviewGridSource,
      "{initialStage1P0DailyUseShareDeepLinkState ? (",
      ") : null}\n              {!initialStage1P0DailyUseShareDeepLinkState &&"
    );

    expect(appSource).toContain("buildStage1P0DailyUseClosure({");
    expect(appSource).toContain("const stage1P0DailyUseClosure = useMemo(");
    expect(appSource).toContain("loadStage1BootstrapPreflightLatest");
    expect(appSource).toContain("const [stage1BootstrapPreflightLatestState, setStage1BootstrapPreflightLatestState]");
    expect(appSource).toContain("const refreshStage1BootstrapPreflightLatest = useCallback");
    expect(appSource).toContain("setStage1BootstrapPreflightLatestState(await loadStage1BootstrapPreflightLatest(quantCoreBaseUrl));");
    expect(appSource).toContain("generateStage1BootstrapPreflight");
    expect(appSource).toContain("const generatedPreflight = await generateStage1BootstrapPreflight(quantCoreBaseUrl);");
    expect(appSource).toContain("setStage1BootstrapPreflightLatestState({");
    expect(appSource).toContain("buildStage1BootstrapPreflightSummary(stage1BootstrapPreflightLatestState.preflight)");
    expect(appSource).toContain("bootstrapPreflight: stage1BootstrapPreflightSummary");
    expect(appSource).toContain("loadStage1DailyUseLatest");
    expect(appSource).toContain("const [stage1DailyUseLatestState, setStage1DailyUseLatestState]");
    expect(appSource).toContain("const refreshStage1DailyUseLatest = useCallback");
    expect(appSource).toContain("setStage1DailyUseLatestState(await loadStage1DailyUseLatest(quantCoreBaseUrl));");
    expect(appSource).toContain("generateStage1DailyUse");
    expect(appSource).toContain("buildStage1P0DailyUseRefreshOutcome");
    expect(appSource).toContain("resolveStage1P0DailyUseShareDeepLinkStatus(window.location.search)");
    expect(appSource).toContain("resolveStage1P0DailyUseShareDeepLinkState(window.location.search)");
    expect(appSource).toContain("initialStage1P0DailyUseShareDeepLinkStatus");
    expect(appSource).toContain("initialStage1P0DailyUseShareDeepLinkState");
    expect(appSource).toContain("stage1P0DailyUseShareLinkLoadedStatusLabel(initialStage1P0DailyUseShareDeepLinkState)");
    expect(appSource).toContain("stage1P0DailyUseShareLinkInvalidStatusLabel(initialStage1P0DailyUseShareDeepLinkStatus)");
    expect(appSource).toContain("function stage1P0DailyUseShareLinkInvalidReasonLabel");
    expect(appSource).toContain("stage1P0DailyUseShareLinkInvalidReasonLabel(");
    expect(appSource).toContain("Stage 1 share link invalid");
    expect(appSource).toContain('const stage1P0DailyUseClosureElementId = "stage1-p0-daily-use-closure";');
    expect(appSource).toContain("function focusStage1P0DailyUseShareCardElement");
    expect(appSource).toContain("function stage1P0DailyUseShareTargetElementId");
    expect(appSource).toContain("function focusStage1P0DailyUseShareTargetElement");
    expect(appSource).toContain("stage1P0DailyUseShareTargetElementId(");
    expect(appSource).toContain("initialStage1P0DailyUseShareDeepLinkState");
    expect(appSource).toContain("stage1P0DailyUseRefreshOutcome");
    expect(appSource).toContain("document.getElementById(stage1P0DailyUseClosureElementId)");
    expect(appSource).toContain("document.getElementById(targetElementId) ?? document.getElementById(stage1P0DailyUseClosureElementId)");
    expect(appSource).toContain('element.scrollIntoView({ block: "center", behavior: "smooth" });');
    expect(appSource).toContain("element.focus({ preventScroll: true });");
    expect(appSource).toContain("Stage 1 daily share link loaded");
    expect(appSource).toContain("Stage 1 refresh receipt share link loaded");
    expect(appSource).toContain("Stage 1 shared context opened");
    expect(appSource).toContain("const [stage1P0DailyUseRefreshOutcome, setStage1P0DailyUseRefreshOutcome]");
    expect(appSource).toContain("buildStage1P0DailyUseArchiveBundle");
    expect(appSource).toContain("buildStage1P0DailyUseArchiveReviewAuditEvent");
    expect(appSource).toContain("const [copiedStage1P0DailyUseHandoff, setCopiedStage1P0DailyUseHandoff]");
    expect(appSource).toContain("setCopiedStage1P0DailyUseHandoff(false);");
    expect(appSource).toContain("const [copiedStage1P0DailyUsePrimaryLink, setCopiedStage1P0DailyUsePrimaryLink]");
    expect(appSource).toContain("setCopiedStage1P0DailyUsePrimaryLink(false);");
    expect(appSource).toContain("const [copiedStage1P0ShareLinkBundle, setCopiedStage1P0ShareLinkBundle]");
    expect(appSource).toContain("setCopiedStage1P0ShareLinkBundle(false);");
    expect(appSource).toContain("const [copiedStage1P0DailyUseArchive, setCopiedStage1P0DailyUseArchive]");
    expect(appSource).toContain("setCopiedStage1P0DailyUseArchive(false);");
    expect(appSource).toContain("const [savingStage1P0DailyUseArchive, setSavingStage1P0DailyUseArchive]");
    expect(appSource).toContain("buildStage1P0ShareLinkBundleCopyText({");
    expect(appSource).toContain("const buildStage1P0ShareLinkBundleText = useCallback");
    expect(appSource).toContain("resolveShareUrl: buildStage1P0WorkspaceShareUrl");
    expect(appSource).toContain("const shareLinkBundleCopyText = buildStage1P0ShareLinkBundleText();");
    expect(appSource).toContain("navigator.clipboard.writeText(shareLinkBundleCopyText)");
    expect(appSource).toContain("Stage 1 share link bundle copied");
    expect(appSource).toContain("Stage 1 share link bundle copy failed");
    expect(appSource).toContain("const downloadStage1P0ShareLinkBundle = useCallback");
    expect(appSource).toContain('new Blob([shareLinkBundleCopyText], { type: "text/markdown;charset=utf-8" })');
    expect(appSource).toContain('anchor.download = "stage1-p0-share-link-bundle.md";');
    expect(appSource).toContain("Stage 1 share link bundle download ready");
    expect(appSource).toContain("Stage 1 share link bundle download failed");
    expect(appSource).toContain("const [copiedStage1P0InvalidShareDiagnostics, setCopiedStage1P0InvalidShareDiagnostics]");
    expect(appSource).toContain("setCopiedStage1P0InvalidShareDiagnostics(false);");
    expect(appSource).toContain("buildStage1P0InvalidShareDiagnosticsCopyText({");
    expect(appSource).toContain("const buildStage1P0InvalidShareDiagnosticsText = useCallback");
    expect(appSource).toContain("const diagnosticsCopyText = buildStage1P0InvalidShareDiagnosticsText();");
    expect(appSource).toContain("navigator.clipboard.writeText(diagnosticsCopyText)");
    expect(appSource).toContain("Stage 1 invalid share diagnostics copied");
    expect(appSource).toContain("Stage 1 invalid share diagnostics copy failed");
    expect(appSource).toContain("buildStage1P0DailyUseArchiveBundle");
    expect(appSource).toContain("const buildStage1P0DailyUseArchiveBundle = useCallback");
    expect(appSource).toContain("invalidShareDiagnosticsCopyText:");
    expect(appSource).toContain("shareDeepLinkState: initialStage1P0DailyUseShareDeepLinkState");
    expect(appSource).toContain("invalidShareStatus: initialStage1P0DailyUseShareDeepLinkStatus");
    expect(appSource).toContain("const archive = await buildStage1P0DailyUseArchiveBundle();");
    expect(appSource).toContain("const copyStage1P0DailyUseArchive = useCallback");
    expect(appSource).toContain("navigator.clipboard.writeText(archive.contentMarkdown)");
    expect(appSource).toContain("archive.bodySha256.hash.slice(0, 12)");
    expect(appSource).toContain(
      "statusLabel: `Stage 1 daily-use archive copied · sha256 ${archive.bodySha256.hash.slice(0, 12)}`"
    );
    expect(appSource).toContain("Stage 1 daily-use archive copy failed");
    expect(appSource).toContain("const downloadStage1P0DailyUseArchive = useCallback");
    expect(appSource).toContain('new Blob([archive.contentMarkdown], { type: "text/markdown;charset=utf-8" })');
    expect(appSource).toContain("invalidShareStatus: initialStage1P0DailyUseShareDeepLinkStatus");
    expect(appSource).toContain("anchor.download = archive.fileName;");
    expect(appSource).toContain(
      "statusLabel: `Stage 1 daily-use archive download ready · ${archive.fileName} · sha256 ${archive.bodySha256.hash.slice(0, 12)}`"
    );
    expect(appSource).toContain("Stage 1 daily-use archive download failed");
    expect(appSource).toContain("const recordStage1P0DailyUseArchive = useCallback");
    expect(appSource).toContain("setSavingStage1P0DailyUseArchive(true);");
    expect(appSource).toContain("const auditEvent = await buildStage1P0DailyUseArchiveReviewAuditEvent({");
    expect(appSource).toContain("archive,");
    expect(appSource).toContain("closure: stage1P0DailyUseClosure,");
    expect(appSource).toContain("refreshOutcome: stage1P0DailyUseRefreshOutcome,");
    expect(appSource).toContain("shareDeepLinkState: initialStage1P0DailyUseShareDeepLinkState");
    expect(appSource).toContain("const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);");
    expect(appSource).toContain("mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)");
    expect(appSource).toContain("statusLabel: `Stage 1 daily-use archive audited · ${result.event!.eventId}`");
    expect(appSource).toContain("Stage 1 daily-use archive ledger save failed");
    expect(appSource).toContain("setSavingStage1P0DailyUseArchive(false);");
    expect(appSource).toContain("buildStage1P0DailyUseArchiveReviewReference({");
    expect(appSource).toContain("const stage1P0DailyUseArchiveReviewReference = useMemo(");
    expect(appSource).toContain("const openStage1P0DailyUseArchiveReviewInAudit = useCallback");
    expect(appSource).toContain("const copyStage1P0DailyUseArchiveReviewAuditLink = useCallback");
    expect(appSource).toContain("const copyStage1P0DailyUseArchiveReviewSummary = useCallback");
    expect(appSource).toContain("const downloadStage1P0DailyUseArchiveReviewSummary = useCallback");
    expect(appSource).toContain("navigator.clipboard.writeText(stage1P0DailyUseArchiveReviewReference.copyText)");
    expect(appSource).toContain("anchor.download = stage1P0DailyUseArchiveReviewReference.fileName");
    expect(appSource).toContain("Stage 1 archive review audit query selected");
    expect(appSource).toContain("Stage 1 archive review link copy failed");
    expect(appSource).toContain("Stage 1 archive review summary copied");
    expect(appSource).toContain("Stage 1 archive review summary download ready");
    expect(appSource).toContain("buildStage1P0DailyUseStartupSnapshot({");
    expect(appSource).toContain("const stage1P0DailyUseStartupSnapshot = useMemo(");
    expect(appSource).toContain("const copyStage1P0DailyUseStartupSnapshot = useCallback");
    expect(appSource).toContain("const downloadStage1P0DailyUseStartupSnapshot = useCallback");
    expect(appSource).toContain("navigator.clipboard.writeText(stage1P0DailyUseStartupSnapshot.copyText)");
    expect(appSource).toContain("anchor.download = stage1P0DailyUseStartupSnapshot.fileName");
    expect(appSource).toContain("Stage 1 startup snapshot copied");
    expect(appSource).toContain("Stage 1 startup snapshot download ready");
    expect(appSource).toContain("function buildStage1P0WorkspaceShareUrl(workspaceLink: string): string");
    expect(appSource).toContain('if (!normalizedLink || typeof window === "undefined")');
    expect(appSource).toContain("const shareUrl = new URL(normalizedLink, window.location.href);");
    expect(appSource).toContain('shareUrl.hash = "";');
    expect(appSource).toContain("return shareUrl.toString();");
    expect(appSource).toContain("const copyStage1P0DailyUseHandoff = useCallback");
    expect(appSource).toContain("navigator.clipboard.writeText(stage1P0DailyUseClosure.copyText)");
    expect(appSource).toContain("Stage 1 daily handoff copy failed");
    expect(appSource).toContain("const copyStage1P0DailyUsePrimaryLink = useCallback");
    expect(appSource).toContain("const primaryShareUrl = buildStage1P0WorkspaceShareUrl(stage1P0DailyUseClosure.primaryWorkspaceLink);");
    expect(appSource).toContain("navigator.clipboard.writeText(primaryShareUrl)");
    expect(appSource).toContain("Stage 1 daily primary link copied");
    expect(appSource).toContain("Stage 1 invalid share replacement link copied");
    expect(appSource).toContain("Stage 1 daily primary link copy failed");
    expect(appSource).toContain("const downloadStage1P0DailyUseHandoff = useCallback");
    expect(appSource).toContain('new Blob([stage1P0DailyUseClosure.copyText], { type: "text/markdown;charset=utf-8" })');
    expect(appSource).toContain('anchor.download = "stage1-p0-daily-use-handoff.md";');
    expect(appSource).toContain("Stage 1 daily handoff download failed");
    expect(appSource).toContain("const [copiedStage1P0DailyUseRefreshOutcome, setCopiedStage1P0DailyUseRefreshOutcome]");
    expect(appSource).toContain("setCopiedStage1P0DailyUseRefreshOutcome(false);");
    expect(appSource).toContain("const [copiedStage1P0DailyUseRefreshOutcomeLink, setCopiedStage1P0DailyUseRefreshOutcomeLink]");
    expect(appSource).toContain("setCopiedStage1P0DailyUseRefreshOutcomeLink(false);");
    expect(appSource).toContain("const copyStage1P0DailyUseRefreshOutcome = useCallback");
    expect(appSource).toContain("navigator.clipboard.writeText(stage1P0DailyUseRefreshOutcome.copyText)");
    expect(appSource).toContain("Stage 1 refresh receipt copy failed");
    expect(appSource).toContain("const copyStage1P0DailyUseRefreshOutcomeLink = useCallback");
    expect(appSource).toContain("const nextShareUrl = buildStage1P0WorkspaceShareUrl(stage1P0DailyUseRefreshOutcome.targetWorkspaceLink);");
    expect(appSource).toContain("navigator.clipboard.writeText(nextShareUrl)");
    expect(appSource).toContain("Stage 1 refresh receipt next link copied");
    expect(appSource).toContain("Stage 1 refresh receipt next link copy failed");
    expect(appSource).toContain("const downloadStage1P0DailyUseRefreshOutcome = useCallback");
    expect(appSource).toContain('new Blob([stage1P0DailyUseRefreshOutcome.copyText], { type: "text/markdown;charset=utf-8" })');
    expect(appSource).toContain('anchor.download = "stage1-p0-daily-refresh-receipt.md";');
    expect(appSource).toContain("Stage 1 refresh receipt download failed");
    expect(appSource).toContain('copyError instanceof Error ? copyError.message : "Clipboard copy failed"');
    expect(appSource).toContain("const openStage1P0DailyUseRow = useCallback");
    expect(appSource).toContain("statusLabel: `Stage 1 daily row opened · ${row.id} -> ${row.targetWorkspaceId}`");
    expect(appSource).toContain("const openStage1P0DailyUsePrimaryAction = useCallback");
    expect(appSource).toContain(
      "statusLabel: `Stage 1 daily primary action opened · ${stage1P0DailyUseClosure.primaryActionId} -> ${stage1P0DailyUseClosure.primaryTargetWorkspaceId}`"
    );
    expect(appSource).toContain("const openStage1P0DailyUseRefreshOutcomeEntry = useCallback");
    expect(appSource).toContain(
      "statusLabel: `Stage 1 refresh receipt entry opened · ${entry.id} -> ${entry.targetWorkspaceId}`"
    );
    expect(appSource).toContain("const openStage1P0DailyUseRefreshOutcomeNextStep = useCallback");
    expect(appSource).toContain(
      "statusLabel: `Stage 1 refresh receipt next step opened · ${stage1P0DailyUseRefreshOutcome.actionLabel} -> ${stage1P0DailyUseRefreshOutcome.targetWorkspaceId}`"
    );
    expect(appSource).toContain("const refreshStage1DailyUseReport = useCallback");
    expect(appSource).toContain("const generated = await generateStage1DailyUse(quantCoreBaseUrl);");
    expect(appSource).toContain("setStage1DailyUseLatestState({");
    expect(appSource).toContain("onRefreshDailyUse={() => void refreshStage1DailyUseReport()}");
    expect(appSource).toContain("refreshOutcome={stage1P0DailyUseRefreshOutcome}");
    expect(appSource).toContain("onCopyHandoff={() => void copyStage1P0DailyUseHandoff()}");
    expect(appSource).toContain("isHandoffCopied={copiedStage1P0DailyUseHandoff}");
    expect(appSource).toContain("isPrimaryLinkCopied={copiedStage1P0DailyUsePrimaryLink}");
    expect(appSource).toContain("onCopyPrimaryLink={() => void copyStage1P0DailyUsePrimaryLink()}");
    expect(appSource).toContain("isShareLinkBundleCopied={copiedStage1P0ShareLinkBundle}");
    expect(appSource).toContain("onCopyShareLinkBundle={() => void copyStage1P0ShareLinkBundle()}");
    expect(appSource).toContain("isArchiveCopied={copiedStage1P0DailyUseArchive}");
    expect(appSource).toContain("isArchiveSaving={savingStage1P0DailyUseArchive}");
    expect(appSource).toContain("onCopyArchive={() => void copyStage1P0DailyUseArchive()}");
    expect(appSource).toContain("onRecordArchive={() => void recordStage1P0DailyUseArchive()}");
    expect(appSource).toContain("onDownloadShareLinkBundle={downloadStage1P0ShareLinkBundle}");
    expect(appSource).toContain("onDownloadArchive={downloadStage1P0DailyUseArchive}");
    expect(appSource).toContain("onDownloadHandoff={downloadStage1P0DailyUseHandoff}");
    expect(appSource).toContain("onCopyRefreshOutcome={() => void copyStage1P0DailyUseRefreshOutcome()}");
    expect(appSource).toContain("onDownloadRefreshOutcome={downloadStage1P0DailyUseRefreshOutcome}");
    expect(appSource).toContain("isRefreshOutcomeCopied={copiedStage1P0DailyUseRefreshOutcome}");
    expect(appSource).toContain("isRefreshOutcomeLinkCopied={copiedStage1P0DailyUseRefreshOutcomeLink}");
    expect(appSource).toContain("onCopyRefreshOutcomeLink={() => void copyStage1P0DailyUseRefreshOutcomeLink()}");
    expect(appSource).toContain("onOpenRow={openStage1P0DailyUseRow}");
    expect(appSource).toContain("onOpenPrimaryAction={openStage1P0DailyUsePrimaryAction}");
    expect(appSource).toContain("onOpenRefreshOutcomeEntry={openStage1P0DailyUseRefreshOutcomeEntry}");
    expect(appSource).toContain("onOpenRefreshOutcomeNextStep={openStage1P0DailyUseRefreshOutcomeNextStep}");
    expect(appSource).toContain("shareDeepLinkState={initialStage1P0DailyUseShareDeepLinkState}");
    expect(appSource).toContain("buildStage1DailyUseSummary(stage1DailyUseLatestState.dailyUse)");
    expect(appSource).toContain("dailyUseReport: stage1DailyUseSummary");
    expect(appSource).toContain("loadDesktopReleaseLatest");
    expect(appSource).toContain("const [desktopReleaseLatestState, setDesktopReleaseLatestState]");
    expect(appSource).toContain("const refreshDesktopReleaseLatest = useCallback");
    expect(appSource).toContain("setDesktopReleaseLatestState(await loadDesktopReleaseLatest(quantCoreBaseUrl));");
    expect(appSource).toContain("buildDesktopReleaseSummary(desktopReleaseLatestState.release)");
    expect(appSource).toContain("desktopRelease: desktopReleaseSummary");
    expect(appSource).toContain("function Stage1P0DailyUseClosurePanel");
    expect(appSource).toContain("shareDeepLinkState?: Stage1P0DailyUseShareDeepLinkState | null;");
    expect(appSource).toContain("function stage1P0DailyUseRowIsSharedFocus");
    expect(appSource).toContain("function stage1P0DailyUsePrimaryIsSharedFocus");
    expect(appSource).toContain("function stage1P0DailyUseRefreshEntryIsSharedFocus");
    expect(appSource).toContain("function stage1P0DailyUseRefreshNextIsSharedFocus");
    expect(appSource).toContain("function stage1P0DailyUseRefreshReceiptIsColdStart");
    expect(appSource).toContain("isArchiveCopied?: boolean;");
    expect(appSource).toContain("isArchiveSaving?: boolean;");
    expect(appSource).toContain("onCopyPrimaryLink?: () => void;");
    expect(appSource).toContain("onCopyArchive?: () => void;");
    expect(appSource).toContain("onRecordArchive?: () => void;");
    expect(appSource).toContain("onCopyShareLinkBundle?: () => void;");
    expect(appSource).toContain("onDownloadArchive?: () => void;");
    expect(appSource).toContain("onDownloadShareLinkBundle?: () => void;");
    expect(appSource).toContain("onCopyRefreshOutcomeLink?: () => void;");
    expect(appSource).toContain("archiveReviewReference?: Stage1P0DailyUseArchiveReviewReference | null;");
    expect(appSource).toContain("onOpenArchiveReview?: () => void;");
    expect(appSource).toContain("onCopyArchiveReviewLink?: () => void;");
    expect(appSource).toContain("startupSnapshot?: Stage1P0DailyUseStartupSnapshot | null;");
    expect(appSource).toContain("onCopyStartupSnapshot?: () => void;");
    expect(appSource).toContain("onDownloadStartupSnapshot?: () => void;");
    expect(appSource).toContain("archiveReviewReference={stage1P0DailyUseArchiveReviewReference}");
    expect(appSource).toContain("onOpenArchiveReview={openStage1P0DailyUseArchiveReviewInAudit}");
    expect(appSource).toContain("onCopyArchiveReviewLink={copyStage1P0DailyUseArchiveReviewAuditLink}");
    expect(appSource).toContain("onCopyArchiveReviewSummary={copyStage1P0DailyUseArchiveReviewSummary}");
    expect(appSource).toContain("onDownloadArchiveReviewSummary={downloadStage1P0DailyUseArchiveReviewSummary}");
    expect(appSource).toContain("startupSnapshot={stage1P0DailyUseStartupSnapshot}");
    expect(appSource).toContain("onCopyStartupSnapshot={copyStage1P0DailyUseStartupSnapshot}");
    expect(appSource).toContain("onDownloadStartupSnapshot={downloadStage1P0DailyUseStartupSnapshot}");
    expect(appSource).toContain("复制启动快照");
    expect(appSource).toContain("Download startup snapshot");
    expect((appSource.match(/<Stage1P0DailyUseClosurePanel/g) ?? []).length).toBe(1);
    expect(overviewGridSource).toContain("initialStage1P0DailyUseShareDeepLinkState");
    expect(overviewGridSource).toContain('className="stage1-p0-share-deep-link invalid"');
    expect(overviewGridSource).toContain("initialStage1P0DailyUseShareDeepLinkStatus.status === \"invalid\"");
    expect(overviewGridSource).toContain("stage1P0DailyUseShareLinkInvalidReasonLabel(");
    expect(overviewGridSource).toContain("focusStage1P0DailyUseShareCardElement();");
    expect(overviewGridSource).toContain("stage1P0DailyUseShareLinkInvalidStatusLabel(");
    expect(overviewGridSource).toContain('copyStage1P0DailyUsePrimaryLink("Stage 1 invalid share replacement link copied")');
    expect(overviewGridSource).toContain("copiedStage1P0DailyUsePrimaryLink");
    expect(overviewGridSource).toContain("复制新入口链接");
    expect(overviewGridSource).toContain("Copy fresh link");
    expect(overviewGridSource).toContain("onClick={() => void copyStage1P0InvalidShareDiagnostics()}");
    expect(overviewGridSource).toContain("copiedStage1P0InvalidShareDiagnostics");
    expect(overviewGridSource).toContain("复制诊断");
    expect(overviewGridSource).toContain("Copy diagnostics");
    expect(overviewGridSource).toContain("onClick={() => void copyStage1P0DailyUseArchive()}");
    expect(overviewGridSource).toContain("onClick={() => void recordStage1P0DailyUseArchive()}");
    expect(overviewGridSource).toContain("savingStage1P0DailyUseArchive");
    expect(overviewGridSource).toContain("copiedStage1P0DailyUseArchive");
    expect(overviewGridSource).toContain("归档包已复制");
    expect(overviewGridSource).toContain("Archive copied");
    expect(overviewGridSource).toContain("复制归档包");
    expect(overviewGridSource).toContain("Copy archive");
    expect(overviewGridSource).toContain("onClick={downloadStage1P0DailyUseArchive}");
    expect(overviewGridSource).toContain("下载归档包");
    expect(overviewGridSource).toContain("Download archive");
    expect(overviewGridSource).toContain("入账归档");
    expect(overviewGridSource).toContain("Record archive");
    expect(overviewGridSource).toContain("入账中");
    expect(overviewGridSource).toContain("Recording");
    expect(overviewGridSource).toContain('i18n.locale === "zh-CN" ? "Stage 1 分享链接不可用" : "Stage 1 share link unavailable"');
    expect(overviewGridSource).toContain('className="stage1-p0-share-deep-link"');
    expect(overviewGridSource).toContain("stage1P0DailyUseShareLinkLabel(i18n, initialStage1P0DailyUseShareDeepLinkState)");
    expect(overviewGridSource).toContain("stage1P0DailyUseShareLinkFocusLabel(i18n, initialStage1P0DailyUseShareDeepLinkState)");
    expect(overviewGridSource).toContain("stage1P0DailyUseShareLinkOpenStatusLabel(initialStage1P0DailyUseShareDeepLinkState)");
    expect(overviewGridSource).toContain("focusStage1P0DailyUseShareTargetElement(");
    expect(overviewGridSource).toContain("stage1P0DailyUseShareTargetElementId(");
    expect(overviewGridSource).toContain("selectProductWorkArea(initialStage1P0DailyUseShareDeepLinkState.targetWorkspaceId)");
    expect(recoveredShareBannerSource).toContain("onClick={() => void copyStage1P0DailyUseArchive()}");
    expect(recoveredShareBannerSource).toContain("onClick={() => void recordStage1P0DailyUseArchive()}");
    expect(recoveredShareBannerSource).toContain("savingStage1P0DailyUseArchive");
    expect(recoveredShareBannerSource).toContain("copiedStage1P0DailyUseArchive");
    expect(recoveredShareBannerSource).toContain("归档包已复制");
    expect(recoveredShareBannerSource).toContain("Archive copied");
    expect(recoveredShareBannerSource).toContain("复制归档包");
    expect(recoveredShareBannerSource).toContain("Copy archive");
    expect(recoveredShareBannerSource).toContain("onClick={downloadStage1P0DailyUseArchive}");
    expect(recoveredShareBannerSource).toContain("下载归档包");
    expect(recoveredShareBannerSource).toContain("Download archive");
    expect(recoveredShareBannerSource).toContain("入账归档");
    expect(recoveredShareBannerSource).toContain("Record archive");
    expect(overviewGridSource).toContain("<Stage1P0DailyUseClosurePanel");
    expect(overviewGridSource.indexOf("<Stage1P0DailyUseClosurePanel")).toBeGreaterThan(
      overviewGridSource.indexOf("<P0GoldenPathJourneyPanel")
    );
    expect(overviewGridSource.indexOf("<Stage1P0DailyUseClosurePanel")).toBeLessThan(
      overviewGridSource.indexOf('className={`p0-readiness-summary ${p0PlatformReadinessSummary.state}`')
    );
    expect(appSource).toContain('className={`stage1-p0-daily-use-closure ${closure.state}`}');
    expect(appSource).toContain("id={stage1P0DailyUseClosureElementId}");
    expect(appSource).toContain("tabIndex={-1}");
    expect(appSource).toContain("closure.rows.map");
    expect(appSource).toContain("stage1P0DailyUseRowIsSharedFocus(shareDeepLinkState, row.id)");
    expect(appSource).toContain("id={stage1P0DailyUseRowElementId(row.id)}");
    expect(appSource).toContain('aria-current={isSharedFocus ? "true" : undefined}');
    expect(appSource).toContain('className={`stage1-p0-daily-use-row ${row.status}${isSharedFocus ? " shared-focus" : ""}`}');
    expect(appSource).toContain("stage1P0DailyUseClosureRowLabel");
    expect(appSource).toContain("stage1P0DailyUseClosureActionLabel");
    expect(appSource).toContain("onOpenRow(row)");
    expect(appSource).toContain("isRefreshingDailyUse={isGeneratingStage1DailyUse || isGeneratingStage1BootstrapPreflight || isLoadingDesktopRelease}");
    expect(appSource).toContain('i18n.locale === "zh-CN" ? "干净环境开箱" : "Clean environment"');
    expect(appSource).toContain('i18n.locale === "zh-CN" ? "行情刷新恢复" : "Refresh recovery"');
    expect(appSource).toContain('i18n.locale === "zh-CN" ? "研究入口" : "Research entry"');
    expect(appSource).toContain('i18n.locale === "zh-CN" ? "每日启动" : "Daily start"');
    expect(appSource).toContain('i18n.locale === "zh-CN" ? "桌面发布" : "Desktop release"');
    expect(appSource).toContain("closure.staleSourceSummary");
    expect(appSource).toContain("closure.bootstrapPreflightStaleSourceSummary");
    expect(appSource).toContain("开箱预检源已更新");
    expect(appSource).toContain("开箱预检待刷新");
    expect(appSource).toContain("开箱预检源已更新；刷新自检会重新生成 preflight。");
    expect(appSource).toContain("刷新回执");
    expect(appSource).toContain("本地核心");
    expect(appSource).toContain("复制日常手册");
    expect(appSource).toContain("Copy handoff");
    expect(appSource).toContain('i18n.locale === "zh-CN" ? "复制入口链接" : "Copy link"');
    expect(appSource).toContain("复制链接包");
    expect(appSource).toContain("Copy links");
    expect(appSource).toContain("复制归档包");
    expect(appSource).toContain("Copy archive");
    expect(appSource).toContain("入账归档");
    expect(appSource).toContain("Record archive");
    expect(appSource).toContain("下载链接包");
    expect(appSource).toContain("Download links");
    expect(appSource).toContain("下载归档包");
    expect(appSource).toContain("Download archive");
    expect(appSource).toContain("下载日常手册");
    expect(appSource).toContain("Download handoff");
    expect(appSource).toContain("复制回执");
    expect(appSource).toContain('i18n.locale === "zh-CN" ? "复制下一步链接" : "Copy next link"');
    expect(appSource).toContain("最新归档入账");
    expect(appSource).toContain("Latest archive record");
    expect(appSource).toContain("stage1P0DailyUseArchiveReviewReferenceLabel");
    expect(appSource).toContain("stage1P0DailyUseArchiveReviewReferenceDetail");
    expect(appSource).toContain("定位归档");
    expect(appSource).toContain("Focus archive");
    expect(appSource).toContain("复制归档链接");
    expect(appSource).toContain("Copy archive link");
    expect(appSource).toContain("复制归档摘要");
    expect(appSource).toContain("Download archive summary");
    expect(appSource).toContain('className={`stage1-p0-daily-use-archive-reference ${archiveReference.status}`}');
    expect(appSource).toContain("下载回执");
    expect(appSource).toContain("Download receipt");
    expect(appSource).toContain("打开下一步");
    expect(appSource).toContain("stage1P0DailyUsePrimaryIsSharedFocus(shareDeepLinkState)");
    expect(appSource).toContain("stage1P0DailyUseRefreshEntryIsSharedFocus(shareDeepLinkState, entry.id)");
    expect(appSource).toContain("stage1P0DailyUseRefreshNextIsSharedFocus(shareDeepLinkState)");
    expect(appSource).toContain("id={stage1P0DailyUseRefreshEntryElementId(entry.id)}");
    expect(appSource).toContain("id={stage1P0DailyUseRefreshNextActionElementId}");
    expect(appSource).toContain(
      'const stage1P0DailyUseArchiveRecordActionElementId = "stage1-p0-daily-use-archive-record-action";'
    );
    expect(appSource).toContain("function focusStage1P0DailyUseArchiveRecordActionElement()");
    expect(appSource).toContain("id={stage1P0DailyUseArchiveRecordActionElementId}");
    expect(appSource).toContain("focusStage1P0DailyUseArchiveRecordActionElement();");
    expect(appSource).toContain("const isRefreshReceiptColdStart = stage1P0DailyUseRefreshReceiptIsColdStart(shareDeepLinkState, refreshOutcome);");
    expect(appSource).toContain('className="stage1-p0-daily-use-refresh-recovery"');
    expect(appSource).toContain('i18n.locale === "zh-CN" ? "已恢复刷新回执链接" : "Recovered refresh receipt link"');
    expect(appSource).toContain("刷新自检会重新生成回执并恢复下一步上下文。");
    expect(appSource).toContain('className={`stage1-p0-daily-use-refresh${isRefreshReceiptColdStart ? " shared-focus" : ""}`}');
    expect(appSource).toContain("id={stage1P0DailyUseRefreshActionElementId}");
    expect(appSource).toContain("id={stage1P0DailyUsePrimaryActionElementId}");
    expect(appSource).toContain("onOpenRefreshOutcomeEntry(entry)");
    expect(appSource).toContain("onOpenRefreshOutcomeNextStep()");
    expect(cssBlock(".stage1-p0-daily-use-closure")).toContain("display: grid;");
    expect(cssBlock(".stage1-p0-daily-use-closure:focus-visible")).toContain("outline: 2px solid #71dfc5;");
    expect(cssBlock(".stage1-p0-daily-use-refresh-outcome")).toContain("display: grid;");
    expect(cssBlock(".stage1-p0-daily-use-refresh-outcome-entries")).toContain("grid-template-columns: repeat(3, minmax(0, 1fr));");
    expect(cssBlock(".stage1-p0-daily-use-refresh-outcome-actions")).toContain("display: flex;");
    expect(cssBlock(".stage1-p0-daily-use-archive-reference")).toContain("display: grid;");
    expect(cssBlock(".stage1-p0-daily-use-archive-reference")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(cssBlock(".stage1-p0-daily-use-archive-reference.current")).toContain("border-color: #2d6e61;");
    expect(cssBlock(".stage1-p0-daily-use-archive-reference button")).toContain("white-space: nowrap;");
    expect(cssBlock(".stage1-p0-daily-use-refresh-recovery")).toContain("display: grid;");
    expect(cssBlock(".stage1-p0-daily-use-refresh-recovery")).toContain("border: 1px solid rgba(113, 223, 197, 0.34);");
    expect(cssBlock(".stage1-p0-daily-use-head")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(cssBlock(".stage1-p0-daily-use-rows")).toContain("grid-template-columns: repeat(5, minmax(0, 1fr));");
    expect(cssBlock(".stage1-p0-daily-use-row")).toContain("cursor: pointer;");
    expect(cssBlock(".stage1-p0-daily-use-row.shared-focus")).toContain("box-shadow: 0 0 0 2px rgba(113, 223, 197, 0.36);");
    expect(cssBlock(".stage1-p0-daily-use-refresh-outcome-entry.shared-focus")).toContain("box-shadow: 0 0 0 2px rgba(113, 223, 197, 0.36);");
    expect(cssBlock(".stage1-p0-daily-use-footer-actions")).toContain("display: flex;");
    expect(cssBlock(".stage1-p0-share-deep-link")).toContain("display: grid;");
    expect(cssBlock(".stage1-p0-share-deep-link.invalid")).toContain("border-left-color: #ff7f6d;");
    expect(cssBlock(".stage1-p0-daily-use-copy")).toContain("border: 1px solid rgba(148, 163, 184, 0.28);");
    expect(cssBlock(".stage1-p0-daily-use-download")).toContain("border: 1px solid rgba(148, 163, 184, 0.28);");
    expect(cssBlock(".stage1-p0-daily-use-refresh")).toContain("border: 1px solid rgba(148, 163, 184, 0.28);");
    expect(cssBlock(".stage1-p0-daily-use-refresh.shared-focus")).toContain("border-color: #71dfc5;");
    expect(cssBlock(".stage1-p0-daily-use-footer-actions button.shared-focus")).toContain("border-color: #71dfc5;");
    expect(cssBlock(".stage1-p0-daily-use-refresh-outcome-actions button.shared-focus")).toContain("border-color: #71dfc5;");
  });

  test("moves detailed P0 evidence behind a secondary drawer on the homepage", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(overviewSource).toContain('<details className="p0-evidence-drawer">');
    expect(overviewSource).toContain('className="p0-evidence-drawer-summary"');
    expect(overviewSource).toContain("p0EvidenceDrawerSummary");
    expect(overviewSource.indexOf('className="p0-action-outcome-actions"')).toBeLessThan(
      overviewSource.indexOf('<details className="p0-evidence-drawer">')
    );
    expect(overviewSource.indexOf('className="p0-readiness-ledger-echo"')).toBeGreaterThan(
      overviewSource.indexOf('<details className="p0-evidence-drawer">')
    );
    expect(overviewSource.indexOf('className="p0-paper-preflight-gates"')).toBeGreaterThan(
      overviewSource.indexOf('<details className="p0-evidence-drawer">')
    );
    expect(overviewSource.indexOf('className="p0-readiness-backlog"')).toBeGreaterThan(
      overviewSource.indexOf('<details className="p0-evidence-drawer">')
    );
    expect(cssBlock(".p0-evidence-drawer")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".p0-evidence-drawer-summary")).toContain("cursor: pointer;");
  });

  test("renders the product-facing P0 completion checklist inside the readiness card", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildP0CompletionChecklist({");
    expect(appSource).toContain("completionChecklist: p0CompletionChecklist");
    expect(appSource).toContain("automatedTestsVerified: false");
    expect(overviewSource).toContain('className={`p0-completion-checklist ${');
    expect(overviewSource).toContain("p0CompletionChecklistHeadline");
    expect(overviewSource).toContain("p0CompletionChecklistDetail");
    expect(overviewSource).toContain("p0CompletionChecklist.openCriteria.slice(0, 4).map");
    expect(overviewSource).toContain("p0CompletionCriterionStatusLabel");
    expect(overviewSource).toContain("p0CompletionCriterionLabel");
    expect(overviewSource).toContain("p0CompletionCriterionDetail");
    expect(overviewSource).toContain("selectProductWorkArea(criterion.targetWorkspaceId)");
    expect(cssBlock(".p0-completion-checklist")).toContain("display: grid;");
    expect(cssBlock(".p0-completion-head")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(cssBlock(".p0-completion-open")).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(cssBlock(".p0-completion-criterion")).toContain("cursor: pointer;");
    expect(cssBlock(".p0-completion-meter span")).toContain("transition: width 0.2s ease;");
  });

  test("renders P0 readiness backlog items as actionable workspace shortcuts", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildP0PlatformBacklogItems(goldenPath)");
    expect(appSource).toContain("p0PlatformBacklogItems");
    expect(overviewSource).toContain('className="p0-readiness-backlog"');
    expect(overviewSource).toContain("p0PlatformBacklogItems.map");
    expect(overviewSource).toContain("p0PlatformBacklogPriorityLabel");
    expect(overviewSource).toContain("selectProductWorkArea");
    expect(overviewSource).toContain("targetWorkspaceId");
    expect(cssBlock(".p0-readiness-backlog")).toContain("display: grid;");
    expect(cssBlock(".p0-readiness-backlog-row")).toContain("grid-template-columns: auto minmax(0, 1fr) auto auto;");
    expect(cssBlock(".p0-readiness-backlog-open,\n.p0-readiness-backlog-action")).toContain("cursor: pointer;");
  });

  test("renders P0 readiness backlog rows with separate gated actions", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(overviewSource).toContain('className={`p0-readiness-backlog-row ${item.priority}`}');
    expect(overviewSource).toContain('className="p0-readiness-backlog-open"');
    expect(overviewSource).toContain("selectProductWorkArea(targetWorkspaceId)");
    expect(overviewSource).toContain("const isP0BacklogActionDisabled = !item.actionId || isGoldenPathActionDisabledById(item.actionId);");
    expect(overviewSource).toContain('className="p0-readiness-backlog-action"');
    expect(overviewSource).toContain("disabled={isP0BacklogActionDisabled}");
    expect(overviewSource).toContain("runGoldenPathActionById(item.actionId, item.targetWorkspaceId ?? item.workspaceId)");
    expect(cssBlock(".p0-readiness-backlog-row")).toContain("display: grid;");
    expect(cssBlock(".p0-readiness-backlog-row")).toContain("grid-template-columns: auto minmax(0, 1fr) auto auto;");
    expect(cssBlock(".p0-readiness-backlog-open,\n.p0-readiness-backlog-action")).toContain("cursor: pointer;");
    expect(cssBlock(".p0-readiness-backlog-action:disabled")).toContain("cursor: not-allowed;");
  });

  test("renders compact P0 backlog action hints for disabled or preflighted rows", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(overviewSource).toContain("const p0BacklogActionHint = p0PlatformBacklogActionHint(");
    expect(overviewSource).toContain("isP0BacklogActionDisabled");
    expect(overviewSource).toContain("researchPipelinePreflight");
    expect(overviewSource).toContain('className={`p0-readiness-backlog-hint ${researchPipelinePreflight.status}`}');
    expect(overviewSource).toContain("{p0BacklogActionHint}");
    expect(appSource).toContain("function p0PlatformBacklogActionHint(");
    expect(appSource).toContain("goldenPathActionPreflightHint(i18n, item.actionId, preflight)");
    expect(appSource).toContain('item.actionId === "submit-paper-order"');
    expect(cssBlock(".p0-readiness-backlog-hint")).toContain("grid-column: 2 / -1;");
    expect(cssBlock(".p0-readiness-backlog-hint")).toContain("color: #8fa0b2;");
  });

  test("renders the latest P0 action outcome beside the readiness backlog", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildP0PlatformActionOutcome({");
    expect(appSource).toContain("buildP0PlatformActionOutcomeEvidenceLink(p0PlatformActionOutcome)");
    expect(appSource).toContain("goldenPath");
    expect(appSource).toContain("paperExecution: paperExecutionRecord");
    expect(appSource).toContain("statusLabel");
    expect(appSource).toContain("const [copiedP0ActionOutcomeEvidenceId, setCopiedP0ActionOutcomeEvidenceId]");
    expect(overviewSource).toContain('className={`p0-action-outcome ${p0PlatformActionOutcome.tone}`}');
    expect(overviewSource).toContain("p0PlatformActionOutcomeLabel");
    expect(overviewSource).toContain("p0PlatformActionOutcomeDetail");
    expect(overviewSource).toContain("p0PlatformActionOutcomeNextStep");
    expect(overviewSource).toContain('className="p0-action-outcome-actions"');
    expect(overviewSource).toContain("copyP0ActionOutcomeEvidenceLink(p0PlatformActionOutcome)");
    expect(overviewSource).toContain("openP0ActionOutcomeEvidence(p0PlatformActionOutcome)");
    expect(cssBlock(".p0-action-outcome")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".p0-action-outcome")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(cssBlock(".p0-action-outcome-actions")).toContain("display: flex;");
    expect(cssBlock(".p0-action-outcome-actions")).toContain("gap: 4px;");
    expect(cssBlock(".p0-action-outcome button")).toContain("cursor: pointer;");
  });

  test("renders the P0 paper execution preflight inside the current task card", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildP0PaperExecutionPreflight({");
    expect(appSource).toContain("goldenPath");
    expect(appSource).toContain("paperExecution: activePaperExecutionRecord");
    expect(appSource).toContain("researchBinding: researchRunContextBinding");
    expect(appSource).toContain("riskApproval: riskApprovalSummary");
    expect(overviewSource).toContain('className={`p0-paper-preflight ${p0PaperExecutionPreflight.state}`}');
    expect(overviewSource).toContain("p0PaperExecutionPreflightHeadline");
    expect(overviewSource).toContain("p0PaperExecutionPreflightDetail");
    expect(overviewSource).toContain("p0PaperExecutionPreflight.primaryActionLabel");
    expect(overviewSource).toContain("p0PaperExecutionPreflight.primaryActionId");
    expect(overviewSource).toContain("runGoldenPathActionById(");
    expect(overviewSource).toContain("p0PaperExecutionPreflight.primaryActionTargetWorkspaceId");
    expect(overviewSource).toContain("selectProductWorkArea(p0PaperExecutionPreflight.primaryActionTargetWorkspaceId)");
    expect(overviewSource).toContain("p0PaperExecutionPreflight.gates.map");
    expect(overviewSource).toContain("p0PaperExecutionPreflightGateLabel");
    expect(overviewSource).toContain("p0PaperExecutionPreflightGateDetail");
    expect(cssBlock(".p0-paper-preflight")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".p0-paper-preflight")).toContain("display: grid;");
    expect(cssBlock(".p0-paper-preflight-action")).toContain("cursor: pointer;");
    expect(cssBlock(".p0-paper-preflight-action:disabled")).toContain("cursor: not-allowed;");
    expect(cssBlock(".p0-paper-preflight-gates")).toContain("display: grid;");
    expect(cssBlock(".p0-paper-preflight-gate")).toContain("border-left: 3px solid");
    expect(cssBlock(".p0-paper-preflight-gate.passed")).toContain("border-left-color: #4cc9ad;");
    expect(cssBlock(".p0-paper-preflight-gate.blocked")).toContain("border-left-color: #ff7f6d;");
  });

  test("renders copy and download actions for the P0 readiness report", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildP0PlatformReadinessReportMarkdown");
    expect(appSource).toContain("buildP0PlatformReadinessReportAuditEvent");
    expect(appSource).toContain("const [copiedP0ReadinessReport, setCopiedP0ReadinessReport]");
    expect(appSource).toContain("const [savingP0ReadinessReport, setSavingP0ReadinessReport]");
    expect(appSource).toContain("const p0PlatformReadinessReportMarkdown = useMemo(");
    expect(appSource).toContain("buildP0PlatformReadinessReportMarkdown({");
    expect(appSource).toContain("backlogItems: p0PlatformBacklogItems");
    expect(appSource).toContain("evidenceLink: p0ActionOutcomeEvidenceLink");
    expect(appSource).toContain("outcome: p0PlatformActionOutcome");
    expect(appSource).toContain("paperPreflight: p0PaperExecutionPreflight");
    expect(appSource).toContain("summary: p0PlatformReadinessSummary");
    expect(appSource).toContain("const copyP0ReadinessReport = useCallback(");
    expect(appSource).toContain("navigator.clipboard.writeText(p0PlatformReadinessReportMarkdown)");
    expect(appSource).toContain("setCopiedP0ReadinessReport(true)");
    expect(appSource).toContain("const downloadP0ReadinessReport = useCallback(");
    expect(appSource).toContain("new Blob([p0PlatformReadinessReportMarkdown], { type: \"text/markdown;charset=utf-8\" })");
    expect(appSource).toContain("p0-readiness-report.md");
    expect(appSource).toContain("const saveP0ReadinessReport = useCallback(");
    expect(appSource).toContain("await buildP0PlatformReadinessReportAuditEvent({");
    expect(appSource).toContain("paperPreflight: p0PaperExecutionPreflight");
    expect(appSource).toContain("await saveAuditEvent(quantCoreBaseUrl, auditEvent)");
    expect(appSource).toContain("setAuditEvidenceReportEvents((current) =>");
    expect(appSource).toContain("P0 readiness report saved to audit ledger");
    expect(overviewSource).toContain('className="p0-readiness-report-actions"');
    expect(overviewSource).toContain("copyP0ReadinessReport");
    expect(overviewSource).toContain("downloadP0ReadinessReport");
    expect(overviewSource).toContain("saveP0ReadinessReport");
    expect(overviewSource).toContain("savingP0ReadinessReport");
    expect(cssBlock(".p0-readiness-report-actions")).toContain("display: flex;");
    expect(cssBlock(".p0-readiness-report-actions")).toContain("gap: 4px;");
    expect(cssBlock(".p0-readiness-report-actions button")).toContain("cursor: pointer;");
  });

  test("echoes the latest saved P0 readiness report from the audit ledger", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("const auditEvidenceReportLedgerSummary = buildAuditEvidenceReportLedgerSummary(auditEvidenceReportLedgerRows);");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidEventId");
    expect(overviewSource).toContain('className="p0-readiness-ledger-echo"');
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidShortHash");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidPreparationEvidenceLabel");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidPreparationEvidenceRunId");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidReportQuery");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidCompletionLabel");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidCompletionCurrentCriterionActionLabel");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidCompletionCurrentCriterionTargetWorkspaceId");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidProgressQuery");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidPreflightQuery");
    expect(overviewSource).toContain("focusLatestP0ReadinessReport");
    expect(overviewSource).toContain("copyAuditReportLedgerQueryLink(auditEvidenceReportLedgerSummary.latestAuditAidReportQuery)");
    expect(overviewSource).toContain("focusLatestP0Completion");
    expect(overviewSource).toContain("focusLatestP0Progress");
    expect(overviewSource).toContain("focusLatestP0Preflight");
    expect(overviewSource).toContain("focusLatestP0PreparationEvidence");
    expect(overviewSource).toContain("copyAuditReportLedgerQueryLink(");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidProgressQuery");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidPreflightQuery");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidPreparationEvidenceRunId");
    expect(overviewSource).toContain("定位进度");
    expect(overviewSource).toContain("Focus progress");
    expect(overviewSource).toContain("复制进度链接");
    expect(overviewSource).toContain("Copy progress link");
    expect(overviewSource).toContain("定位完成定义");
    expect(overviewSource).toContain("Focus completion");
    expect(overviewSource).toContain("复制完成链接");
    expect(overviewSource).toContain("Copy completion link");
    expect(overviewSource).toContain("打开完成缺口");
    expect(overviewSource).toContain("Open completion gap");
    expect(overviewSource).toContain("复制完成缺口链接");
    expect(overviewSource).toContain("Copy completion gap link");
    expect(overviewSource).toContain("定位预检");
    expect(overviewSource).toContain("Focus preflight");
    expect(overviewSource).toContain("复制预检链接");
    expect(overviewSource).toContain("Copy preflight link");
    expect(overviewSource).toContain("复制报告链接");
    expect(overviewSource).toContain("Copy report link");
    expect(overviewSource).toContain("复制数据准备链接");
    expect(overviewSource).toContain("Copy prep link");
    expect(overviewSource).toContain('className="p0-readiness-ledger-actions"');
    expect(appSource).toContain("const focusLatestP0ReadinessReport = useCallback(");
    expect(appSource).toContain("setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidReportQuery)");
    expect(appSource).toContain("const focusLatestP0Progress = useCallback(");
    expect(appSource).toContain("setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidProgressQuery)");
    expect(appSource).toContain("const focusLatestP0Completion = useCallback(");
    expect(appSource).toContain("setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery)");
    expect(appSource).toContain("const openLatestP0CompletionGap = useCallback(");
    expect(appSource).toContain("const copyP0CompletionGapLink = useCallback(");
    expect(appSource).toContain("buildP0CompletionGapUrlSearch({");
    expect(appSource).toContain(
      "selectProductWorkArea(auditEvidenceReportLedgerSummary.latestAuditAidCompletionCurrentCriterionTargetWorkspaceId)"
    );
    expect(appSource).toContain("const focusLatestP0Preflight = useCallback(");
    expect(appSource).toContain("setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidPreflightQuery)");
    expect(appSource).toContain("const focusLatestP0PreparationEvidence = useCallback(");
    expect(appSource).toContain(
      "setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidPreparationEvidenceRunId)"
    );
    expect(appSource).toContain('setActiveWorkAreaId("audit")');
    expect(cssBlock(".p0-readiness-ledger-echo")).toContain("display: grid;");
    expect(cssBlock(".p0-readiness-ledger-echo")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(cssBlock(".p0-readiness-ledger-actions")).toContain("display: flex;");
  });

  test("renders recovered P0 current-gap deep links as manual next-step actions", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("resolveP0CurrentGapActionDeepLinkState(window.location.search)");
    expect(appSource).toContain("resolveP0CompletionGapDeepLinkState(window.location.search)");
    expect(appSource).toContain("resolveLocalReviewCoverageNextActionDeepLinkState(window.location.search)");
    expect(appSource).toContain("initialP0CurrentGapActionDeepLinkState");
    expect(appSource).toContain("initialP0CompletionGapDeepLinkState");
    expect(appSource).toContain("initialLocalReviewCoverageNextActionDeepLinkState");
    expect(appSource).toContain(
      "localReviewCoverageNextActionLoadedStatusLabel(initialLocalReviewCoverageNextActionDeepLinkState)"
    );
    expect(appSource).toContain("Local review start link loaded");
    expect(appSource).toContain("Daily Ops coverage next link loaded");
    expect(appSource).toContain("Daily start coverage next link loaded");
    expect(appSource).toContain("Personal/team coverage next link loaded");
    expect(overviewSource).toContain("initialP0CurrentGapActionDeepLinkState");
    expect(overviewSource).toContain("initialP0CompletionGapDeepLinkState");
    expect(overviewSource).toContain("initialLocalReviewCoverageNextActionDeepLinkState");
    expect(overviewSource).toContain('className="p0-current-gap-deep-link"');
    expect(overviewSource).toContain('className="p0-current-gap-deep-link p0-completion-gap-deep-link"');
    expect(overviewSource).toContain(
      'className="p0-current-gap-deep-link local-review-coverage-next-action-deep-link"'
    );
    expect(overviewSource).toContain("initialP0CurrentGapActionDeepLinkState.actionId");
    expect(overviewSource).toContain("initialP0CurrentGapActionDeepLinkState.auditReportQuery");
    expect(overviewSource).toContain("initialP0CurrentGapActionDeepLinkState.targetWorkspaceId");
    expect(overviewSource).toContain("initialP0CompletionGapDeepLinkState.auditReportQuery");
    expect(overviewSource).toContain("initialP0CompletionGapDeepLinkState.targetWorkspaceId");
    expect(overviewSource).toContain("initialLocalReviewCoverageNextActionDeepLinkState.auditReportQuery");
    expect(appSource).toContain("localReviewCoverageNextActionIsEmptyStart(state)");
    expect(appSource).toContain("state.actionId");
    expect(overviewSource).toContain("initialLocalReviewCoverageNextActionDeepLinkState.missingReviewKind");
    expect(overviewSource).toContain("initialLocalReviewCoverageNextActionDeepLinkState.targetWorkspaceId");
    expect(overviewSource).toContain(
      "localReviewCoverageNextActionLabel(i18n, initialLocalReviewCoverageNextActionDeepLinkState)"
    );
    expect(overviewSource).toContain(
      "localReviewCoverageNextActionQueryLabel(i18n, initialLocalReviewCoverageNextActionDeepLinkState)"
    );
    expect(overviewSource).toContain(
      "localReviewCoverageNextActionOpenLabel(i18n, initialLocalReviewCoverageNextActionDeepLinkState)"
    );
    expect(overviewSource).toContain(
      "localReviewCoverageNextActionQueryStatusLabel(initialLocalReviewCoverageNextActionDeepLinkState)"
    );
    expect(overviewSource).toContain(
      "localReviewCoverageNextActionOpenStatusLabel(initialLocalReviewCoverageNextActionDeepLinkState)"
    );
    expect(appSource).toContain("localReviewCoverageNextActionIsEmptyStart(state)");
    expect(appSource).toContain("本地复核未开始");
    expect(appSource).toContain("Local reviews not started");
    expect(appSource).toContain("尚未记录本地复核");
    expect(appSource).toContain("No local reviews recorded");
    expect(appSource).toContain("查看本地复核启动查询");
    expect(appSource).toContain("View local review start query");
    expect(appSource).toContain("开始个人/小团队复核");
    expect(appSource).toContain("Start personal/team review");
    expect(appSource).toContain("Local review start query selected");
    expect(appSource).toContain("Personal/team review start opened");
    expect(overviewSource).toContain("setWorkspaceState((current) => ({");
    expect(overviewSource).toContain("replaceAuditEvidenceReportQueryUrlParam(initialP0CurrentGapActionDeepLinkState.auditReportQuery)");
    expect(overviewSource).toContain("replaceAuditEvidenceReportQueryUrlParam(initialP0CompletionGapDeepLinkState.auditReportQuery)");
    expect(overviewSource).toContain(
      "replaceAuditEvidenceReportQueryUrlParam(initialLocalReviewCoverageNextActionDeepLinkState.auditReportQuery)"
    );
    expect(overviewSource).toContain("selectProductWorkArea(initialP0CompletionGapDeepLinkState.targetWorkspaceId)");
    expect(overviewSource).toContain(
      "selectProductWorkArea(initialLocalReviewCoverageNextActionDeepLinkState.targetWorkspaceId)"
    );
    expect(overviewSource).toContain("已载入完成缺口链接");
    expect(overviewSource).toContain("Recovered completion gap link");
    expect(overviewSource).toContain("继续完成缺口");
    expect(overviewSource).toContain("Continue completion gap");
    expect(overviewSource).toContain("本地复核覆盖下一步");
    expect(overviewSource).toContain("Local review coverage next");
    expect(appSource).toContain("查看覆盖查询");
    expect(appSource).toContain("View coverage query");
    expect(appSource).toContain("打开复核入口");
    expect(appSource).toContain("Open review entry");
    expect(appSource).toContain("查看 Daily Ops 覆盖查询");
    expect(appSource).toContain("View Daily Ops coverage query");
    expect(appSource).toContain("查看每日启动覆盖查询");
    expect(appSource).toContain("View daily start coverage query");
    expect(appSource).toContain("查看个人/小团队覆盖查询");
    expect(appSource).toContain("View personal/team coverage query");
    expect(appSource).toContain("打开每日启动复核入口");
    expect(appSource).toContain("Open daily start review entry");
    expect(appSource).toContain("Daily Ops coverage query selected");
    expect(appSource).toContain("Daily start coverage query selected");
    expect(appSource).toContain("Personal/team coverage query selected");
    expect(appSource).toContain("Daily Ops review entry opened");
    expect(appSource).toContain("Daily start review entry opened");
    expect(appSource).toContain("Personal/team review entry opened");
    expect(appSource).toContain("Daily Ops coverage next link copied");
    expect(appSource).toContain("Daily start coverage next link copied");
    expect(appSource).toContain("Personal/team coverage next link copied");
    expect(appSource).toContain("Daily Ops 复核缺失");
    expect(appSource).toContain("Daily Ops review missing");
    expect(appSource).toContain("每日启动复核缺失");
    expect(appSource).toContain("Daily start review missing");
    expect(appSource).toContain("个人/小团队复核缺失");
    expect(appSource).toContain("Personal/team review missing");
    expect(overviewSource).toContain("runGoldenPathActionById(");
    expect(overviewSource).toContain("initialP0CurrentGapActionDeepLinkState.actionId");
    expect(overviewSource).toContain("initialP0CurrentGapActionDeepLinkState.targetWorkspaceId");
    expect(cssBlock(".p0-current-gap-deep-link")).toContain("display: grid;");
    expect(cssBlock(".p0-current-gap-deep-link")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(cssBlock(".p0-current-gap-deep-link-actions")).toContain("display: flex;");
    expect(cssBlock(".p0-current-gap-deep-link-actions button")).toContain("cursor: pointer;");
  });

  test("documents daily start as a first-class local review coverage next action", () => {
    expect(readmeSource).toContain("Daily Ops、Daily Start 与个人/小团队缺口");
    expect(productPlanSource).toContain("Daily Ops、Daily Start 与个人/小团队缺口");
    expect(productPlanSource).toContain(
      "`record-daily-ops-review`、`record-daily-start-review` 或 `record-personal-team-review`"
    );
    expect(productPlanSource).toContain("Daily Ops / Daily Start / 个人小团队 action token");
    expect(productPlanSource).toContain("Daily Ops、Daily Start、个人/小团队和 empty 启动链接");
  });

  test("keeps local review next-action generation tied to the restored research target", () => {
    const coverageSource = sourceBetweenText(
      terminalWorkbenchSource,
      "function auditReportLedgerLocalReviewBundleCoverage",
      "function auditReportLedgerDeduplicatedQueryText"
    );

    expect(terminalWorkbenchSource).toContain(
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

  test("lets the Golden Path paper action rebind the latest audited run before submission", () => {
    const actionHandlerSource = sourceBetween("const runGoldenPathActionById = useCallback(", "const runGoldenPathAction = useCallback(");
    const disabledHandlerSource = sourceBetween("const isGoldenPathActionDisabledById = useCallback(", "const goldenPathActionId = goldenPath?.nextAction?.id;");

    expect(appSource).toContain("const ensureGoldenPathLatestRunBound = useCallback(");
    expect(appSource).toContain("goldenPath?.latestRunId");
    expect(appSource).toContain("loadResearchRunDetail(quantCoreBaseUrl, latestRunId)");
    expect(appSource).toContain("await replayRun(detail.run)");
    expect(actionHandlerSource).toContain("const executableActionId = normalizeP0CurrentGapActionId(actionId);");
    expect(actionHandlerSource).toContain('if (executableActionId === "submit-paper-order")');
    expect(actionHandlerSource).toContain("void (async () => {");
    expect(actionHandlerSource).toContain("const runWasAlreadyBound = researchRunContextBinding.canUseRun;");
    expect(actionHandlerSource).toContain("const runIsBound = await ensureGoldenPathLatestRunBound();");
    expect(actionHandlerSource).toContain("if (runWasAlreadyBound && runIsBound)");
    expect(disabledHandlerSource).toContain("const canRebindGoldenPathRun = Boolean(goldenPath?.latestRunId) && !researchRunContextBinding.canUseRun;");
    expect(disabledHandlerSource).toContain("return (");
    expect(disabledHandlerSource).toContain("isSubmittingPaperExecution ||");
    expect(disabledHandlerSource).toContain("(!canRebindGoldenPathRun &&");
    expect(disabledHandlerSource).toContain('riskApprovalSummary.status === "blocked"');
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
  });

  test("renders the active work-area golden path context inside the task card", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildGoldenPathWorkspaceContext(goldenPath, activeWorkAreaId)");
    expect(appSource).toContain("activeWorkspaceContext");
    expect(appSource).toContain("runWorkspaceContextAction");
    expect(appSource).toContain("runGoldenPathActionById");
    expect(appSource).toContain("normalizeP0CurrentGapActionId(actionId)");
    expect(appSource).toContain('if (executableActionId === "refresh-watchlist-cache")');
    expect(appSource).toContain("void refreshWatchlistMarketCache();");
    expect(appSource).toContain("isRefreshingWatchlistCache || Boolean(refreshingCacheKey)");
    expect(appSource).toContain("goldenPathActionPreflightHint");
    expect(overviewSource).toContain("goldenPathActionHint");
    expect(overviewSource).toContain('className={`golden-path-action-hint ${researchPipelinePreflight.status}`}');
    expect(overviewSource).toContain("workspaceContextActionHint");
    expect(overviewSource).toContain('className={`workspace-gate-preflight-hint ${researchPipelinePreflight.status}`}');
    expect(overviewSource).toContain('className={`workspace-gate-summary ${activeWorkspaceContext.status}`}');
    expect(overviewSource).toContain("goldenPathWorkspaceContextLabel");
    expect(overviewSource).toContain("goldenPathWorkspaceContextDetail");
    expect(overviewSource).toContain('className="workspace-gate-action"');
    expect(overviewSource).toContain("disabled={isWorkspaceContextActionDisabled}");
    expect(overviewSource).toContain("onClick={runWorkspaceContextAction}");
    expect(cssBlock(".workspace-gate-summary")).toContain("display: grid;");
    expect(cssBlock(".workspace-gate-summary")).toContain("grid-template-columns: auto minmax(0, 1fr) auto;");
    expect(cssBlock(".workspace-gate-action")).toContain("cursor: pointer;");
    expect(cssBlock(".golden-path-action-hint")).toContain("font-size: 0.76rem;");
    expect(cssBlock(".workspace-gate-preflight-hint")).toContain("grid-column: 1 / -1;");
  });

  test("renders a compact Stage 1 research context readiness checklist with calendar readiness", () => {
    const readinessBuilderSource = sourceBetween("const researchContextReadinessRows = buildResearchContextReadinessRows({", "});");
    const currentReadinessReportSource = sourceBetween(
      "const buildCurrentResearchContextReadinessReport = useCallback",
      "  const copyResearchContextReadinessReport"
    );

    expect(appSource).toContain("buildResearchContextReadinessRows");
    expect(appSource).toContain("buildResearchContextReadinessReportArchive");
    expect(appSource).toContain("const buildCurrentResearchContextReadinessReport = useCallback");
    expect(appSource).toContain("const copyResearchContextReadinessReport = useCallback");
    expect(appSource).toContain("const downloadResearchContextReadinessReport = useCallback");
    expect(appSource).toContain("const recordResearchContextReadinessReport = useCallback");
    expect(appSource).toContain("const latestResearchContextReadinessReport = useMemo");
    expect(appSource).toContain("const latestOtherResearchContextReadinessReport = useMemo");
    expect(appSource).toContain("const researchContextReportCoverage = useMemo");
    expect(appSource).toContain("buildResearchContextReportCoverageForContext(auditEvidenceReportLedgerRows, {");
    expect(appSource).toContain("const row = researchContextReportCoverage.latestMatchingReport;");
    expect(appSource).toContain("const row = researchContextReportCoverage.latestOtherReport;");
    expect(appSource).toContain("contextLabel: [row.researchContextMarket, row.researchContextSymbol, row.researchContextTimeframe]");
    expect(appSource).toContain("market: workspace.selectedInstrument.market");
    expect(appSource).toContain("symbol: workspace.selectedInstrument.symbol");
    expect(appSource).toContain("timeframe: workspace.selectedTimeframe");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowResearchContextReportQuery(row)");
    expect(appSource).not.toContain('query: `${row.reportKind} ${row.runId} ${row.shortHash} ${row.focusQuery}`.trim()');
    expect(appSource).toContain("const openLatestResearchContextReportInAudit = useCallback");
    expect(appSource).toContain("const openLatestOtherResearchContextReportInAudit = useCallback");
    expect(appSource).toContain("const copyLatestOtherResearchContextReportAuditLink = useCallback");
    expect(appSource).toContain("const openLatestResearchContextReportContext = useCallback");
    expect(appSource).toContain("const copyLatestResearchContextReportLink = useCallback");
    expect(appSource).toContain("buildResearchContextReadinessReportAuditEvent");
    expect(appSource).toContain(
      '"audit_evidence_report,backtest_report,portfolio_report,p0_readiness_report,p0_acceptance_review,p2_manifest_chain_preflight,p2_manifest_chain_preflight_review,p2_readiness_evidence_coverage_review,p2_readiness_acceptance_generated,p2_readiness_acceptance_review,personal_team_readiness_review,daily_ops_control_room_review,daily_start_brief_review,stage1_daily_archive_review,operator_runbook_report,pre_live_runbook_report,research_context_readiness_report"'
    );
    expect(currentReadinessReportSource).toContain("contextLink: buildResearchContextDeepLink(");
    expect(currentReadinessReportSource).toContain("researchPipelinePreflight.lockedPreparationEvidence?.runId ?? selectedWatchlistCacheRefreshRunId");
    expect(appSource).toContain("report.contentMarkdown");
    expect(appSource).toContain("report.contentSha256.hash.slice(0, 12)");
    expect(appSource).toContain("function ResearchContextReadinessPanel");
    expect(appSource).toContain("<ResearchContextReadinessPanel");
    expect(appSource).toContain("onCopyReadinessReport={copyResearchContextReadinessReport}");
    expect(appSource).toContain("onDownloadReadinessReport={downloadResearchContextReadinessReport}");
    expect(appSource).toContain("onRecordReadinessReport={recordResearchContextReadinessReport}");
    expect(appSource).toContain("readinessReportCoverageStatus={researchContextReportCoverage.status}");
    expect(appSource).toContain("latestReadinessReport={latestResearchContextReadinessReport}");
    expect(appSource).toContain("latestOtherReadinessReport={latestOtherResearchContextReadinessReport}");
    expect(appSource).toContain("onOpenLatestReadinessReport={openLatestResearchContextReportInAudit}");
    expect(appSource).toContain("onOpenLatestOtherReadinessReport={openLatestOtherResearchContextReportInAudit}");
    expect(appSource).toContain("onCopyLatestOtherReadinessReportLink={copyLatestOtherResearchContextReportAuditLink}");
    expect(appSource).toContain("onOpenLatestReadinessReportContext={openLatestResearchContextReportContext}");
    expect(appSource).toContain("onCopyLatestReadinessReportLink={copyLatestResearchContextReportLink}");
    expect(appSource).toContain("isReadinessReportCopied={copiedResearchContextReadinessReport}");
    expect(readinessBuilderSource).toContain("marketCalendar: marketCalendarState.calendar");
    expect(appSource).toContain('className="research-context-checklist"');
    expect(appSource).toContain('className="research-context-latest-report"');
    expect(appSource).toContain('className={`research-context-latest-report muted ${readinessReportCoverageStatus}`}');
    expect(appSource).toContain("latestReadinessReport?.runId");
    expect(appSource).toContain(i18nSnippet("当前上下文未入账", "Current context not recorded"));
    expect(appSource).toContain(i18nSnippet("等待入账当前上下文", "Waiting for this context"));
    expect(appSource).toContain(i18nSnippet("已有其他标的或周期的报告；请入账当前上下文。", "Other symbols or timeframes have reports; record this context."));
    expect(appSource).toContain(i18nSnippet("定位其他报告", "Focus other report"));
    expect(appSource).toContain(i18nSnippet("复制其他报告链接", "Copy other report link"));
    expect(appSource).toContain('readinessReportCoverageStatus === "context-mismatch" && latestOtherReadinessReport?.query');
    expect(appSource).toContain("latestOtherReadinessReport.contextLabel");
    expect(appSource).toContain(i18nSnippet("最近入账报告", "Latest recorded report"));
    expect(appSource).toContain(i18nSnippet("定位审计报告", "Focus audit report"));
    expect(appSource).toContain(i18nSnippet("打开研究上下文", "Open research context"));
    expect(appSource).toContain(i18nSnippet("复制研究链接", "Copy research link"));
    expect(appSource).toContain('className="research-context-report-actions"');
    expect(appSource).toContain('className="research-context-report-button"');
    expect(appSource).toContain('className={`research-context-row ${row.tone}`}');
    expect(appSource).toContain("onRefreshCache={refreshSelectedMarketCache}");
    expect(appSource).toContain("onSaveNote={saveCurrentResearchNote}");
    expect(appSource).toContain('className="research-context-actions"');
    expect(appSource).toContain("researchContextReadinessActionLabel");
    expect(cssBlock(".research-context-checklist")).toContain("display: grid;");
    expect(cssBlock(".research-context-row")).toContain("grid-template-columns: auto minmax(0, 1fr) auto;");
    expect(cssBlock(".research-context-actions")).toContain("display: flex;");
    expect(cssBlock(".research-context-report-actions")).toContain("display: inline-flex;");
    expect(cssBlock(".research-context-report-button")).toContain("display: inline-flex;");
    expect(cssBlock(".research-context-latest-report")).toContain("display: grid;");
    expect(cssBlock(".research-context-latest-report.muted")).toContain("border-color:");
    expect(cssBlock(".research-context-latest-report-actions")).toContain("display: flex;");
  });

  test("renders a full golden path runbook board in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');

    expect(appSource).toContain("function GoldenPathRunbookPanel");
    expect(appSource).toContain("isGoldenPathActionDisabledById");
    expect(auditWorkspaceSource).toContain("<GoldenPathRunbookPanel");
    expect(auditWorkspaceSource).toContain("runbook={goldenPath?.runbook ?? []}");
    expect(auditWorkspaceSource).toContain("preflight={researchPipelinePreflight}");
    expect(auditWorkspaceSource).toContain("onSelectWorkspace={selectProductWorkArea}");
    expect(auditWorkspaceSource).toContain("onRunAction={runGoldenPathActionById}");
    expect(auditWorkspaceSource).toContain("isActionDisabled={isGoldenPathActionDisabledById}");
    expect(appSource).toContain("const isRunbookActionDisabled = !canRunAction || isActionDisabled(item.actionId);");
    expect(appSource).toContain("const actionHint = goldenPathRunbookActionHint(");
    expect(appSource).toContain("isRunbookActionDisabled");
    expect(appSource).toContain("preflight");
    expect(appSource).toContain('className={`audit-runbook-action-hint ${actionHintTone}`}');
    expect(appSource).toContain("disabled={isRunbookActionDisabled}");
    expect(appSource).toContain("isGoldenPathActionDisabledById(goldenPathActionId)");
    expect(appSource).toContain("isGoldenPathActionDisabledById(workspaceContextActionId)");
    expect(cssBlock(".workflow-runbook-panel")).toContain("grid-area: runbook;");
    expect(cssBlock(".audit-runbook-panel")).toContain("align-self: start;");
    expect(cssBlock(".audit-runbook-list")).toContain("display: grid;");
    expect(cssBlock(".audit-runbook-row")).toContain("grid-template-columns: auto minmax(0, 1fr) auto auto;");
    expect(cssBlock(".audit-runbook-actions")).toContain("display: flex;");
    expect(cssBlock(".audit-runbook-action-hint")).toContain("grid-column: 2 / -1;");
    expect(cssBlock(".audit-runbook-action-hint")).toContain("color: #8fa0b2;");
    expect(appSource).toContain("function goldenPathRunbookActionHint(");
    expect(appSource).toContain("goldenPathActionPreflightHint(i18n, item.actionId, preflight)");
    expect(hasCssBlockWith(".audit-layout", ['"runbook workflow"', '"history decision"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"runbook"', '"workflow"', '"history"', '"decision"'])).toBe(true);
  });

  test("renders AI review audit trail inside the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');

    expect(appSource).toContain("function AiReviewAuditTrailPanel");
    expect(auditWorkspaceSource).toContain("<AiReviewAuditTrailPanel");
    expect(auditWorkspaceSource).toContain("dossier={aiReviewDossier}");
    expect(auditWorkspaceSource).toContain("riskApproval={riskApprovalSummary}");
    expect(auditWorkspaceSource).toContain("records={activeAiReviewRunRecords}");
    expect(auditWorkspaceSource).toContain('className="workflow-ai-audit-panel"');
    expect(appSource).toContain("<AiReviewRunRecordHistory");
    expect(appSource).toContain("dossier.citations.map");
    expect(cssBlock(".workflow-ai-audit-panel")).toContain("grid-area: ai;");
    expect(cssBlock(".audit-ai-trail-grid")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-trail-grid")).toContain("grid-template-columns: minmax(280px, 0.75fr) minmax(0, 1.25fr);");
    expect(cssBlock(".audit-ai-citation-list")).toContain("display: grid;");
    expect(hasCssBlockWith(".audit-layout", ['"runbook workflow"', '"history decision"', '"ai ai"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"runbook"', '"workflow"', '"history"', '"decision"', '"ai"'])).toBe(true);
  });

  test("renders P0 acceptance manifest review inside the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const reviewPanelSource = sourceBetween("function P0AcceptanceReviewPanel", "function AuditEvidenceReportLedgerPanel");

    expect(appSource).toContain("function P0AcceptanceReviewPanel");
    expect(appSource).toContain("buildP0AcceptanceReviewMarkdown");
    expect(appSource).toContain("buildP0AcceptanceReviewAuditEvent");
    expect(appSource).toContain("const p0AcceptanceReviewMarkdown = useMemo");
    expect(appSource).toContain("const copyP0AcceptanceReview = useCallback");
    expect(appSource).toContain("const downloadP0AcceptanceReview = useCallback");
    expect(appSource).toContain("const [savingP0AcceptanceReview, setSavingP0AcceptanceReview] = useState(false);");
    expect(appSource).toContain("const saveP0AcceptanceReview = useCallback");
    expect(appSource).toContain("saveAuditEvent(quantCoreBaseUrl, auditEvent)");
    expect(auditWorkspaceSource).toContain("<P0AcceptanceReviewPanel");
    expect(auditWorkspaceSource).toContain("acceptance={p0AcceptanceLatestState.acceptance ?? null}");
    expect(auditWorkspaceSource).toContain("summary={p0AcceptanceSummary}");
    expect(auditWorkspaceSource).toContain("isRefreshing={isLoadingP0Acceptance}");
    expect(auditWorkspaceSource).toContain("isRecordingAudit={savingP0AcceptanceReview}");
    expect(auditWorkspaceSource).toContain("isCopied={copiedP0AcceptanceReview}");
    expect(auditWorkspaceSource).toContain("onCopy={() => void copyP0AcceptanceReview()}");
    expect(auditWorkspaceSource).toContain("onDownload={downloadP0AcceptanceReview}");
    expect(auditWorkspaceSource).toContain("onRecordAudit={() => void saveP0AcceptanceReview()}");
    expect(auditWorkspaceSource).toContain("onRefresh={() => void refreshP0AcceptanceLatest()}");
    expect(reviewPanelSource).toContain("acceptance?.checkIds.map");
    expect(reviewPanelSource).toContain("onCopy");
    expect(reviewPanelSource).toContain("onDownload");
    expect(reviewPanelSource).toContain("onRecordAudit");
    expect(reviewPanelSource).toContain("isRecordingAudit");
    expect(reviewPanelSource).toContain("p0AcceptanceSummaryHeadline(i18n, summary)");
    expect(reviewPanelSource).toContain("p0AcceptanceReviewBoundaryLabel");
    expect(reviewPanelSource).toContain('className={`p0-acceptance-review ${summary.tone}`}');
    expect(cssBlock(".p0-acceptance-review-actions")).toContain("display: flex;");
    expect(cssBlock(".p0-acceptance-review-actions button")).toContain("display: inline-flex;");
    expect(cssBlock(".workflow-p0-acceptance-panel")).toContain("grid-area: acceptance;");
    expect(cssBlock(".p0-acceptance-review")).toContain("display: grid;");
    expect(cssBlock(".p0-acceptance-review")).not.toContain("overflow: auto;");
    expect(cssBlock(".p0-acceptance-review-checks")).toContain("display: grid;");
    expect(cssBlock(".p0-acceptance-review-check")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(hasCssBlockWith(".audit-layout", ['"acceptance acceptance"', '"reports reports"', '"signing-keys signing-keys"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"acceptance"', '"reports"', '"signing-keys"'])).toBe(true);
  });

  test("renders P2 readiness acceptance manifest review inside the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const reviewPanelSource = sourceBetween("function P2ReadinessAcceptanceReviewPanel", "function P0AcceptanceReviewPanel");

    expect(appSource).toContain("function P2ReadinessAcceptanceReviewPanel");
    expect(appSource).toContain("buildP2ReadinessAcceptanceReviewMarkdown");
    expect(appSource).toContain("buildP2ReadinessAcceptanceReviewAuditEvent");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceReviewQuery");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceLinkedCoverageReviewQuery");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageLinkedAcceptanceReviewQuery");
    expect(appSource).toContain("findLatestP2ReadinessAcceptanceAuditLedgerRow");
    expect(appSource).toContain("resolveP2ReadinessAcceptanceAuditEventReference");
    expect(appSource).toContain("evidenceCoverageReviewAuditEventId: p2ReadinessEvidenceCoverageReviewAuditEventId");
    expect(appSource).toContain("const p2ReadinessAcceptanceReviewMarkdown = useMemo");
    expect(appSource).toContain("p2ReadinessAcceptanceReviewAuditEvent");
    expect(appSource).toContain("const latestP2ReadinessAcceptanceReviewAuditRow = useMemo");
    expect(appSource).toContain("const p2ReadinessAcceptanceReviewAuditEventReference = useMemo");
    expect(appSource).toContain("context: p2ReadinessAcceptanceAuditContext");
    expect(appSource).toContain("p2ReadinessAcceptanceReviewAuditContext");
    expect(appSource).toContain("evidenceCoverageReviewAuditEventId: p2ReadinessEvidenceCoverageReviewAuditEventId");
    expect(appSource).toContain("const p2ReadinessAcceptanceReviewAuditEventId =");
    expect(appSource).toContain("const p2ReadinessAcceptanceReviewAuditEventSource =");
    expect(appSource).toContain("const copyP2ReadinessAcceptanceReview = useCallback");
    expect(appSource).toContain("const downloadP2ReadinessAcceptanceReview = useCallback");
    expect(appSource).toContain("const saveP2ReadinessAcceptanceReview = useCallback");
    expect(appSource).toContain("const openP2ReadinessAcceptanceReviewAudit = useCallback");
    expect(appSource).toContain("const openP2ReadinessAcceptanceCoverageReviewAudit = useCallback");
    expect(appSource).toContain("setP2ReadinessAcceptanceReviewAuditEvent(result.event)");
    expect(auditWorkspaceSource).toContain("<P2ReadinessAcceptanceReviewPanel");
    expect(auditWorkspaceSource).toContain("acceptance={p2ReadinessAcceptanceLatestState.acceptance ?? null}");
    expect(auditWorkspaceSource).toContain("auditEventId={p2ReadinessAcceptanceReviewAuditEventId}");
    expect(auditWorkspaceSource).toContain("auditEventSource={p2ReadinessAcceptanceReviewAuditEventSource}");
    expect(auditWorkspaceSource).toContain("summary={p2ReadinessAcceptanceSummary}");
    expect(auditWorkspaceSource).toContain("isRefreshing={isLoadingP2ReadinessAcceptance}");
    expect(auditWorkspaceSource).toContain("isRecordingAudit={savingP2ReadinessAcceptanceReview}");
    expect(auditWorkspaceSource).toContain("isCopied={copiedP2ReadinessAcceptanceReview}");
    expect(auditWorkspaceSource).toContain("onCopy={() => void copyP2ReadinessAcceptanceReview()}");
    expect(auditWorkspaceSource).toContain("onDownload={downloadP2ReadinessAcceptanceReview}");
    expect(auditWorkspaceSource).toContain("onOpenAudit={openP2ReadinessAcceptanceReviewAudit}");
    expect(auditWorkspaceSource).toContain("onOpenCoverageReview={openP2ReadinessAcceptanceCoverageReviewAudit}");
    expect(auditWorkspaceSource).toContain("onRecordAudit={() => void saveP2ReadinessAcceptanceReview()}");
    expect(auditWorkspaceSource).toContain("onRefresh={() => void refreshP2ReadinessAcceptanceLatest()}");
    expect(reviewPanelSource).toContain("auditEventId");
    expect(reviewPanelSource).toContain("auditEventSource");
    expect(reviewPanelSource).toContain("p2ReadinessAcceptanceAuditEventSourceLabel(i18n, auditEventSource)");
    expect(reviewPanelSource).toContain('"Coverage review"');
    expect(reviewPanelSource).toContain('summary.evidenceCoverageReviewAuditEventId || "n/a"');
    expect(reviewPanelSource).toContain("acceptance?.criterionIds.map");
    expect(reviewPanelSource).toContain("onOpenAudit");
    expect(reviewPanelSource).toContain("onOpenCoverageReview");
    expect(reviewPanelSource).toContain("onRecordAudit");
    expect(reviewPanelSource).toContain("isRecordingAudit");
    expect(reviewPanelSource).toContain('"审计"');
    expect(reviewPanelSource).toContain('"Audit"');
    expect(reviewPanelSource).toContain('"覆盖复核"');
    expect(reviewPanelSource).toContain('"Coverage review"');
    expect(reviewPanelSource).toContain("readinessCoverageStatus");
    expect(reviewPanelSource).toContain("p2ReadinessAcceptanceStatusLabel(i18n, summary.status)");
    expect(reviewPanelSource).toContain('className={`p2-readiness-acceptance-review ${summary.tone}`}');
    expect(cssBlock(".p2-readiness-acceptance-review-actions")).toContain("display: flex;");
    expect(cssBlock(".p2-readiness-acceptance-review-actions button")).toContain("display: inline-flex;");
    expect(cssBlock(".workflow-p2-readiness-acceptance-audit-panel")).toContain("grid-area: p2-readiness-review;");
    expect(cssBlock(".p2-readiness-acceptance-review")).toContain("display: grid;");
    expect(cssBlock(".p2-readiness-acceptance-review")).not.toContain("overflow: auto;");
    expect(cssBlock(".p2-readiness-acceptance-review-criteria")).toContain("display: grid;");
    expect(cssBlock(".p2-readiness-acceptance-review-criterion")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(hasCssBlockWith(".audit-layout", ['"p2-acceptance p2-acceptance"', '"p2-readiness-review p2-readiness-review"', '"acceptance acceptance"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"p2-acceptance"', '"p2-readiness-review"', '"acceptance"'])).toBe(true);
  });

  test("renders P2 readiness evidence coverage review inside the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const reviewPanelSource = sourceBetween("function P2ReadinessEvidenceCoverageReviewPanel", "function P0AcceptanceReviewPanel");

    expect(appSource).toContain("function P2ReadinessEvidenceCoverageReviewPanel");
    expect(appSource).toContain("buildP2ReadinessEvidenceCoverageReviewMarkdown");
    expect(appSource).toContain("buildP2ReadinessEvidenceCoverageReviewAuditEvent");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageReviewQuery");
    expect(appSource).toContain("findLatestP2ReadinessEvidenceCoverageReviewAuditLedgerRow");
    expect(appSource).toContain("resolveP2ReadinessEvidenceCoverageReviewAuditEventReference");
    expect(appSource).toContain("const p2ReadinessEvidenceCoverageReviewMarkdown = useMemo");
    expect(appSource).toContain("p2ReadinessEvidenceCoverageReviewAuditEvent");
    expect(appSource).toContain("const p2ReadinessEvidenceCoverageReviewAuditEventReference = useMemo");
    expect(appSource).toContain("const copyP2ReadinessEvidenceCoverageReview = useCallback");
    expect(appSource).toContain("const downloadP2ReadinessEvidenceCoverageReview = useCallback");
    expect(appSource).toContain("const saveP2ReadinessEvidenceCoverageReview = useCallback");
    expect(appSource).toContain("const openP2ReadinessEvidenceCoverageReviewAudit = useCallback");
    expect(appSource).toContain("const openP2ReadinessEvidenceCoverageLinkedAcceptanceReviewAudit = useCallback");
    expect(appSource).toContain("setP2ReadinessEvidenceCoverageReviewAuditEvent(result.event)");
    expect(auditWorkspaceSource).toContain("<P2ReadinessEvidenceCoverageReviewPanel");
    expect(auditWorkspaceSource).toContain("auditEventId={p2ReadinessEvidenceCoverageReviewAuditEventId}");
    expect(auditWorkspaceSource).toContain("coverage={p2ReadinessEvidenceCoverage}");
    expect(auditWorkspaceSource).toContain("isRecordingAudit={savingP2ReadinessEvidenceCoverageReview}");
    expect(auditWorkspaceSource).toContain("isCopied={copiedP2ReadinessEvidenceCoverageReview}");
    expect(auditWorkspaceSource).toContain("onCopy={() => void copyP2ReadinessEvidenceCoverageReview()}");
    expect(auditWorkspaceSource).toContain("onDownload={downloadP2ReadinessEvidenceCoverageReview}");
    expect(auditWorkspaceSource).toContain("onOpenAudit={openP2ReadinessEvidenceCoverageReviewAudit}");
    expect(auditWorkspaceSource).toContain("onOpenAcceptanceReview={openP2ReadinessEvidenceCoverageLinkedAcceptanceReviewAudit}");
    expect(auditWorkspaceSource).toContain("onRecordAudit={() => void saveP2ReadinessEvidenceCoverageReview()}");
    expect(reviewPanelSource).toContain("coverage.rows.map");
    expect(reviewPanelSource).toContain("auditEventId");
    expect(reviewPanelSource).toContain("onOpenAudit");
    expect(reviewPanelSource).toContain("onOpenAcceptanceReview");
    expect(reviewPanelSource).toContain("onRecordAudit");
    expect(reviewPanelSource).toContain("isRecordingAudit");
    expect(reviewPanelSource).toContain("p2EvidenceCoverageRowLabel(i18n, row.id)");
    expect(reviewPanelSource).toContain("p2EvidenceCoverageSourceLabel(i18n, row.sourceType)");
    expect(reviewPanelSource).toContain('"顶层复核"');
    expect(reviewPanelSource).toContain('"Acceptance review"');
    expect(reviewPanelSource).toContain('className={`p2-readiness-evidence-coverage-review ${coverage.tone}`}');
    expect(cssBlock(".p2-readiness-evidence-coverage-review-actions")).toContain("display: flex;");
    expect(cssBlock(".p2-readiness-evidence-coverage-review-actions button")).toContain("display: inline-flex;");
    expect(cssBlock(".workflow-p2-evidence-coverage-review-panel")).toContain("grid-area: p2-coverage-review;");
    expect(cssBlock(".p2-readiness-evidence-coverage-review")).toContain("display: grid;");
    expect(cssBlock(".p2-readiness-evidence-coverage-review")).not.toContain("overflow: auto;");
    expect(cssBlock(".p2-readiness-evidence-coverage-review-rows")).toContain("display: grid;");
    expect(cssBlock(".p2-readiness-evidence-coverage-review-row")).toContain("grid-template-columns: minmax(0, 1fr) minmax(120px, 0.5fr) minmax(120px, 0.75fr);");
    expect(hasCssBlockWith(".audit-layout", ['"p2-readiness-review p2-readiness-review"', '"p2-coverage-review p2-coverage-review"', '"acceptance acceptance"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"p2-readiness-review"', '"p2-coverage-review"', '"acceptance"'])).toBe(true);
  });

  test("renders P2 manifest chain preflight review inside the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const reviewPanelSource = sourceBetween("function P2ManifestChainPreflightReviewPanel", "function P2ReadinessAcceptanceReviewPanel");

    expect(appSource).toContain("function P2ManifestChainPreflightReviewPanel");
    expect(appSource).toContain("buildP2ManifestChainPreflightReviewMarkdown");
    expect(appSource).toContain("buildP2ManifestChainPreflightReviewAuditEvent");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightReviewQuery");
    expect(appSource).toContain("const p2ManifestChainPreflightReviewMarkdown = useMemo");
    expect(appSource).toContain("p2ManifestChainPreflightReviewAuditEvent");
    expect(appSource).toContain("const latestP2ManifestChainPreflightReviewAuditRow = useMemo");
    expect(appSource).toContain("const p2ManifestChainPreflightReviewAuditEventReference = useMemo");
    expect(appSource).toContain("const copyP2ManifestChainPreflightReview = useCallback");
    expect(appSource).toContain("const downloadP2ManifestChainPreflightReview = useCallback");
    expect(appSource).toContain("const saveP2ManifestChainPreflightReview = useCallback");
    expect(appSource).toContain("const openP2ManifestChainPreflightReviewAudit = useCallback");
    expect(appSource).toContain("setP2ManifestChainPreflightReviewAuditEvent(result.event)");
    expect(auditWorkspaceSource).toContain("<P2ManifestChainPreflightReviewPanel");
    expect(auditWorkspaceSource).toContain("preflight={p2ManifestChainPreflightLatestState.preflight ?? null}");
    expect(auditWorkspaceSource).toContain("auditEventId={p2ManifestChainPreflightReviewAuditEventId}");
    expect(auditWorkspaceSource).toContain("summary={p2ManifestChainPreflightSummary}");
    expect(auditWorkspaceSource).toContain("isRefreshing={isLoadingP2ManifestChainPreflight}");
    expect(auditWorkspaceSource).toContain("isRecordingAudit={savingP2ManifestChainPreflightReview}");
    expect(auditWorkspaceSource).toContain("isCopied={copiedP2ManifestChainPreflightReview}");
    expect(auditWorkspaceSource).toContain("onCopy={() => void copyP2ManifestChainPreflightReview()}");
    expect(auditWorkspaceSource).toContain("onDownload={downloadP2ManifestChainPreflightReview}");
    expect(auditWorkspaceSource).toContain("onOpenAudit={openP2ManifestChainPreflightReviewAudit}");
    expect(auditWorkspaceSource).toContain("onRecordAudit={() => void saveP2ManifestChainPreflightReview()}");
    expect(auditWorkspaceSource).toContain("onRefresh={() => void refreshP2ManifestChainPreflightLatest()}");
    expect(reviewPanelSource).toContain("preflight?.stages.map");
    expect(reviewPanelSource).toContain("auditEventId");
    expect(reviewPanelSource).toContain("onOpenAudit");
    expect(reviewPanelSource).toContain("onRecordAudit");
    expect(reviewPanelSource).toContain("isRecordingAudit");
    expect(reviewPanelSource).toContain('"审计"');
    expect(reviewPanelSource).toContain('"Audit"');
    expect(reviewPanelSource).toContain('className={`p2-manifest-chain-preflight-review ${summary.tone}`}');
    expect(cssBlock(".p2-manifest-chain-preflight-review-actions")).toContain("display: flex;");
    expect(cssBlock(".p2-manifest-chain-preflight-review-actions button")).toContain("display: inline-flex;");
    expect(cssBlock(".workflow-p2-chain-preflight-review-panel")).toContain("grid-area: p2-chain-preflight-review;");
    expect(cssBlock(".p2-manifest-chain-preflight-review")).toContain("display: grid;");
    expect(cssBlock(".p2-manifest-chain-preflight-review")).not.toContain("overflow: auto;");
    expect(cssBlock(".p2-manifest-chain-preflight-review-stages")).toContain("display: grid;");
    expect(cssBlock(".p2-manifest-chain-preflight-review-stage")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(hasCssBlockWith(".audit-layout", ['"p2-chain-preflight-review p2-chain-preflight-review"', '"p2-readiness-review p2-readiness-review"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"p2-chain-preflight-review"', '"p2-readiness-review"'])).toBe(true);
  });

  test("renders risk approval references in the AI review audit trail", () => {
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function AgentEvidenceBoard");
    const riskReferenceSource = sourceBetween("function AiReviewRiskReferenceBoard", "function AiReviewRecordDriftSummary");

    expect(appSource).toContain("function AiReviewRiskReferenceBoard");
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
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function aiReviewDriftStatusText");
    const timelineSource = sourceBetween("function AiReviewAuditTimelineBoard", "function AiReviewAuditTrailPanel");

    expect(appSource).toContain("buildAiReviewAuditTimelineItems");
    expect(appSource).toContain("function AiReviewAuditTimelineBoard");
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

  test("turns AI review audit timeline rows into workflow actions", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function aiReviewDriftStatusText");
    const timelineSource = sourceBetween("function AiReviewAuditTimelineBoard", "function AiReviewAuditTrailPanel");

    expect(auditWorkspaceSource).toContain("onSelectWorkspace={selectProductWorkArea}");
    expect(auditPanelSource).toContain("onSelectWorkspace");
    expect(auditPanelSource).toContain("onSelectRecord={setSelectedRecordId}");
    expect(timelineSource).toContain("function handleTimelineAction");
    expect(timelineSource).toContain("item.targetRecordId");
    expect(timelineSource).toContain("onSelectRecord(item.targetRecordId)");
    expect(timelineSource).toContain("item.targetWorkspaceId");
    expect(timelineSource).toContain("onSelectWorkspace(item.targetWorkspaceId)");
    expect(timelineSource).toContain("auditTimelineActionLabel");
    expect(cssBlock(".audit-ai-timeline-action")).toContain("cursor: pointer;");
  });

  test("renders an export evidence index in the AI review audit trail", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function aiReviewDriftStatusText");
    const evidenceIndexSource = sourceBetween("function AiReviewExportEvidenceIndexBoard", "function AiReviewAuditTrailPanel");

    expect(appSource).toContain("buildAiReviewExportEvidenceIndexRows");
    expect(appSource).toContain("filterAiReviewExportEvidenceIndexRows");
    expect(appSource).toContain("function AiReviewExportEvidenceIndexBoard");
    expect(auditWorkspaceSource).toContain("currentRecord={currentAiReviewRunRecord}");
    expect(auditPanelSource).toContain("const evidenceIndexRows = buildAiReviewExportEvidenceIndexRows");
    expect(auditPanelSource).toContain("const filteredEvidenceIndexRows = filterAiReviewExportEvidenceIndexRows");
    expect(auditPanelSource).toContain("<AiReviewExportEvidenceIndexBoard");
    expect(evidenceIndexSource).toContain("audit-ai-evidence-index-search");
    expect(evidenceIndexSource).toContain("rows.map");
    expect(evidenceIndexSource).toContain("row.anchor");
    expect(evidenceIndexSource).toContain("row.exportPath");
    expect(cssBlock(".audit-ai-evidence-index")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".audit-ai-evidence-index-toolbar")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-evidence-index-row")).toContain(
      "grid-template-columns: minmax(120px, 0.55fr) minmax(0, 1fr) minmax(180px, 0.7fr);"
    );
  });

  test("renders a research run export package preview in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');

    expect(appSource).toContain("buildResearchRunExportPreviewRows");
    expect(appSource).toContain("filterResearchRunExportPreviewRows");
    expect(appSource).toContain("const researchRunExportPreviewRows = buildResearchRunExportPreviewRows");
    expect(appSource).toContain("function ResearchRunExportPreviewPanel");
    expect(auditWorkspaceSource).toContain("<ResearchRunExportPreviewPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-export-preview-panel"');
    expect(auditWorkspaceSource).toContain("rows={researchRunExportPreviewRows}");
    expect(cssBlock(".workflow-export-preview-panel")).toContain("grid-area: export;");
    expect(cssBlock(".research-export-preview")).toContain("display: grid;");
    expect(cssBlock(".research-export-preview-toolbar")).toContain("display: grid;");
    expect(cssBlock(".research-export-preview-row")).toContain(
      "grid-template-columns: minmax(104px, 0.44fr) minmax(0, 1fr) minmax(76px, 0.28fr) minmax(126px, 0.46fr) auto;"
    );
    expect(hasCssBlockWith(".audit-layout", ['"runbook workflow"', '"history decision"', '"export export"', '"ai ai"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"runbook"', '"workflow"', '"history"', '"decision"', '"export"', '"ai"'])).toBe(true);
  });

  test("renders a research run export package browser in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const exportBrowserPanelSource = sourceBetween("function ResearchRunExportPackageBrowserPanel", "function ResearchRunImportDiffPanel");
    const exportRunSource = sourceBetween("const exportRun = useCallback", "const inspectRunExportPackageByRunId");
    const runHistoryPanelSource = sourceBetween("function RunHistoryPanel", "function ExecutionPanel");
    const runHistoryRowSource = sourceBetween("function RunHistoryRow", "function RunComparisonBoard");

    expect(appSource).toContain("buildResearchRunExportBrowserRows");
    expect(appSource).toContain("buildAuditEvidenceReportMarkdown");
    expect(appSource).toContain("buildAuditEvidenceSummary");
    expect(appSource).toContain("buildResearchRunExportAuditReport");
    expect(appSource).toContain("buildAuditEvidenceReportAuditEvent");
    expect(appSource).toContain("withResearchRunExportAuditEvidenceArtifacts");
    expect(appSource).toContain("withResearchRunExportReportSignatures");
    expect(appSource).toContain("filterResearchRunExportBrowserRows");
    expect(appSource).toContain("const researchRunExportBrowserRows = buildResearchRunExportBrowserRows");
    expect(appSource).toContain("const auditEvidenceSummary = buildAuditEvidenceSummary");
    expect(appSource).toContain("importAuditEvents: researchRunImportAuditEvents");
    expect(appSource).toContain("const [copiedAuditEvidenceSummary, setCopiedAuditEvidenceSummary]");
    expect(appSource).toContain("const [copiedAuditEvidenceReport, setCopiedAuditEvidenceReport]");
    expect(appSource).toContain("const copyAuditEvidenceSummary = useCallback");
    expect(appSource).toContain("const copyAuditEvidenceReport = useCallback");
    expect(appSource).toContain("const persistAuditEvidenceReportEvent = useCallback");
    expect(appSource).toContain("const downloadAuditEvidenceReport = useCallback");
    expect(appSource).toContain("navigator.clipboard.writeText(auditEvidenceSummary.copyText)");
    expect(appSource).toContain("navigator.clipboard.writeText(buildAuditEvidenceReportMarkdown(auditEvidenceSummary))");
    expect(appSource).toContain("await buildResearchRunExportAuditReport(auditEvidenceSummary)");
    expect(appSource).toContain("saveAuditEvent(quantCoreBaseUrl, buildAuditEvidenceReportAuditEvent(auditReport, auditEvidenceSummary))");
    expect(appSource).toContain("type ImportAuditEvidenceDeepLinkStatus");
    expect(appSource).toContain("const [importAuditEvidenceDeepLinkStatus, setImportAuditEvidenceDeepLinkStatus]");
    expect(appSource).toContain('const [researchRunExportBrowserQuery, setResearchRunExportBrowserQuery] = useState(initialImportAuditEvidenceDeepLink?.focusQuery ?? "");');
    expect(appSource).toContain("function ResearchRunExportPackageBrowserPanel");
    expect(appSource).toContain("const inspectRunExportPackage = useCallback");
    expect(appSource).toContain("const loadImportAuditEvidenceDeepLink = useCallback");
    expect(exportRunSource).toContain("const exportPackage = await withResearchRunExportAuditEvidenceArtifacts");
    expect(exportRunSource).toContain('eventType: "audit_evidence_report,backtest_report"');
    expect(exportRunSource).toContain("const signedExportPackage");
    expect(exportRunSource).toContain("runHistory");
    expect(exportRunSource).toContain("persistAuditEvidenceReportEvent(exportPackage.auditReport);");
    expect(exportRunSource).toContain("JSON.stringify(signedExportPackage, null, 2)");
    expect(exportRunSource).toContain("[auditEvidenceSummary, persistAuditEvidenceReportEvent, quantCoreBaseUrl, runHistory]");
    expect(appSource).toContain('setImportAuditEvidenceDeepLinkStatus({ ...deepLink, status: "loading", error: null });');
    expect(appSource).toContain("const inspection = await inspectRunExportPackageByRunId(deepLink.runId);");
    expect(appSource).toContain('status: inspection.ok ? "loaded" : "failed"');
    expect(appSource).toContain("const retryImportAuditEvidenceDeepLink = useCallback");
    expect(auditWorkspaceSource).toContain("<ResearchRunExportPackageBrowserPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-export-browser-panel"');
    expect(auditWorkspaceSource).toContain("deepLinkStatus={importAuditEvidenceDeepLinkStatus}");
    expect(auditWorkspaceSource).toContain("evidenceSummary={auditEvidenceSummary}");
    expect(auditWorkspaceSource).toContain("isEvidenceSummaryCopied={copiedAuditEvidenceSummary}");
    expect(auditWorkspaceSource).toContain("isEvidenceReportCopied={copiedAuditEvidenceReport}");
    expect(auditWorkspaceSource).toContain("onCopyEvidenceSummary={copyAuditEvidenceSummary}");
    expect(auditWorkspaceSource).toContain("onCopyEvidenceReport={copyAuditEvidenceReport}");
    expect(auditWorkspaceSource).toContain("onDownloadEvidenceReport={downloadAuditEvidenceReport}");
    expect(auditWorkspaceSource).toContain("onRetryDeepLink={retryImportAuditEvidenceDeepLink}");
    expect(auditWorkspaceSource).toContain("rows={researchRunExportBrowserRows}");
    expect(auditWorkspaceSource).toContain("isLoading={isInspectingExportPackage}");
    expect(auditWorkspaceSource).toContain("query={researchRunExportBrowserQuery}");
    expect(auditWorkspaceSource).toContain("onQueryChange={setResearchRunExportBrowserQuery}");
    expect(auditWorkspaceSource).toContain("onInspectExport={inspectRunExportPackage}");
    expect(exportBrowserPanelSource).toContain("query: string;");
    expect(exportBrowserPanelSource).toContain("evidenceSummary: AuditEvidenceSummary;");
    expect(exportBrowserPanelSource).toContain("isEvidenceSummaryCopied: boolean;");
    expect(exportBrowserPanelSource).toContain("isEvidenceReportCopied: boolean;");
    expect(exportBrowserPanelSource).toContain("onCopyEvidenceSummary: () => void;");
    expect(exportBrowserPanelSource).toContain("onCopyEvidenceReport: () => void;");
    expect(exportBrowserPanelSource).toContain("onDownloadEvidenceReport: () => void;");
    expect(exportBrowserPanelSource).toContain("deepLinkStatus?: ImportAuditEvidenceDeepLinkStatus | null;");
    expect(exportBrowserPanelSource).toContain("onRetryDeepLink?: () => void;");
    expect(exportBrowserPanelSource).toContain("research-audit-evidence-summary");
    expect(exportBrowserPanelSource).toContain("evidenceSummary.runId");
    expect(exportBrowserPanelSource).toContain("evidenceSummary.packageMatchedCount");
    expect(exportBrowserPanelSource).toContain("evidenceSummary.importDiffBlockedCount");
    expect(exportBrowserPanelSource).toContain("evidenceSummary.importVerificationVerifiedCount");
    expect(exportBrowserPanelSource).toContain("evidenceSummary.importVerificationInvalidCount");
    expect(exportBrowserPanelSource).toContain("onCopyEvidenceSummary");
    expect(exportBrowserPanelSource).toContain("onCopyEvidenceReport");
    expect(exportBrowserPanelSource).toContain("onDownloadEvidenceReport");
    expect(exportBrowserPanelSource).toContain("isEvidenceSummaryCopied");
    expect(exportBrowserPanelSource).toContain("isEvidenceReportCopied");
    expect(exportBrowserPanelSource).toContain("下载报告");
    expect(exportBrowserPanelSource).toContain("research-export-deep-link");
    expect(exportBrowserPanelSource).toContain("deepLinkStatus.status");
    expect(exportBrowserPanelSource).toContain("deepLinkStatus.runId");
    expect(exportBrowserPanelSource).toContain("deepLinkStatus.focusQuery");
    expect(exportBrowserPanelSource).toContain("onRetryDeepLink");
    expect(exportBrowserPanelSource).toContain("Retry");
    expect(exportBrowserPanelSource).toContain("onQueryChange: (query: string) => void;");
    expect(exportBrowserPanelSource).toContain("filterResearchRunExportBrowserRows(rows, query)");
    expect(exportBrowserPanelSource).toContain("onQueryChange(event.target.value)");
    expect(runHistoryPanelSource).toContain("onInspectExport");
    expect(runHistoryRowSource).toContain("onInspectExport(run)");
    expect(cssBlock(".workflow-export-browser-panel")).toContain("grid-area: package;");
    expect(cssBlock(".research-export-browser")).toContain("display: grid;");
    expect(cssBlock(".research-audit-evidence-summary")).toContain("display: grid;");
    expect(cssBlock(".research-audit-evidence-summary button")).toContain("display: inline-flex;");
    expect(cssBlock(".research-export-deep-link")).toContain("display: grid;");
    expect(cssBlock(".research-export-deep-link.failed")).toContain("border-left-color: #ff7f6d;");
    expect(cssBlock(".research-export-browser-row")).toContain(
      "grid-template-columns: minmax(116px, 0.5fr) minmax(0, 1fr) minmax(110px, 0.34fr) minmax(156px, 0.5fr) auto;"
    );
    expect(hasCssBlockWith(".audit-layout", ['"runbook workflow"', '"history decision"', '"export export"', '"package package"', '"ai ai"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"runbook"', '"history"', '"export"', '"workflow"', '"decision"', '"package"', '"ai"'])).toBe(true);
  });

  test("renders a recent export package index in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');

    expect(appSource).toContain("buildResearchRunExportIndexRows");
    expect(appSource).toContain("filterResearchRunExportIndexRows");
    expect(appSource).toContain("const researchRunExportIndexRows = buildResearchRunExportIndexRows");
    expect(appSource).toContain("const indexRecentRunExportPackages = useCallback");
    expect(appSource).toContain("function ResearchRunExportIndexPanel");
    expect(auditWorkspaceSource).toContain("<ResearchRunExportIndexPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-export-index-panel"');
    expect(auditWorkspaceSource).toContain("rows={researchRunExportIndexRows}");
    expect(auditWorkspaceSource).toContain("isLoading={isIndexingExportPackages}");
    expect(auditWorkspaceSource).toContain("onIndexPackages={indexRecentRunExportPackages}");
    expect(cssBlock(".workflow-export-index-panel")).toContain("grid-area: index;");
    expect(cssBlock(".research-export-index")).toContain("display: grid;");
    expect(cssBlock(".research-export-index-row")).toContain(
      "grid-template-columns: minmax(118px, 0.44fr) minmax(96px, 0.34fr) minmax(0, 1fr) minmax(146px, 0.48fr) minmax(132px, 0.38fr) auto;"
    );
    expect(hasCssBlockWith(".audit-layout", ['"runbook workflow"', '"history decision"', '"export export"', '"package package"', '"index index"', '"ai ai"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"runbook"', '"history"', '"export"', '"workflow"', '"decision"', '"package"', '"index"', '"ai"'])).toBe(true);
  });

  test("renders import diff guidance in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const importDiffPanelSource = sourceBetween("function ResearchRunImportDiffPanel", "function ResearchRunImportAuditEventPanel");
    const importDiffLabelSource = sourceBetween("function researchImportDiffLabel", "function researchImportDiffStatusLabel");

    expect(appSource).toContain("buildResearchRunImportDiffRows");
    expect(appSource).toContain("filterResearchRunImportDiffRows");
    expect(appSource).toContain("const researchRunImportDiffRows = buildResearchRunImportDiffRows");
    expect(importDiffLabelSource).toContain('"audit-summary": "导入审计摘要"');
    expect(importDiffLabelSource).toContain('"audit-report": "导入审计报告"');
    expect(importDiffLabelSource).toContain('"backtest-report": "导入回测报告"');
    expect(appSource).toContain('const [researchRunImportDiffQuery, setResearchRunImportDiffQuery] = useState(initialImportAuditEvidenceDeepLink?.focusQuery ?? "");');
    expect(appSource).toContain("function ResearchRunImportDiffPanel");
    expect(auditWorkspaceSource).toContain("<ResearchRunImportDiffPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-import-diff-panel"');
    expect(auditWorkspaceSource).toContain("rows={researchRunImportDiffRows}");
    expect(auditWorkspaceSource).toContain("query={researchRunImportDiffQuery}");
    expect(auditWorkspaceSource).toContain("onQueryChange={setResearchRunImportDiffQuery}");
    expect(importDiffPanelSource).toContain("query: string;");
    expect(importDiffPanelSource).toContain("onQueryChange: (query: string) => void;");
    expect(importDiffPanelSource).toContain("filterResearchRunImportDiffRows(rows, query)");
    expect(importDiffPanelSource).toContain("onQueryChange(event.target.value)");
    expect(cssBlock(".workflow-import-diff-panel")).toContain("grid-area: import-diff;");
    expect(cssBlock(".research-import-diff")).toContain("display: grid;");
    expect(cssBlock(".research-import-diff-row")).toContain("grid-template-columns: minmax(116px, 0.44fr) minmax(104px, 0.3fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.2fr);");
    expect(hasCssBlockWith(".audit-layout", ['"package package"', '"import-diff import-diff"', '"index index"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"package"', '"import-diff"', '"index"'])).toBe(true);
  });

  test("previews an imported research run export file before applying it", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const importFileSource = sourceBetween("const importRunExportFile = useCallback", "const confirmPendingImportPackage = useCallback");
    const confirmImportSource = sourceBetween("const confirmPendingImportPackage = useCallback", "const updateAiReviewHistoryQuery = useCallback");
    const importPanelSource = sourceBetween("function ResearchRunImportDiffPanel", "function ResearchRunExportIndexPanel");

    expect(appSource).toContain("normalizeResearchRunExportPackagePayload");
    expect(appSource).toContain("withVerifiedResearchRunExportPackageReportSignatures");
    expect(appSource).toContain("const [pendingImportPackage, setPendingImportPackage]");
    expect(appSource).toContain("const [isApplyingImportPackage, setIsApplyingImportPackage]");
    expect(appSource).toContain("exportPackage: pendingImportPackage?.exportPackage ?? inspectedExportPackage");
    expect(importFileSource).toContain("normalizeResearchRunExportPackagePayload(parsed)");
    expect(importFileSource).toContain("withVerifiedResearchRunExportPackageReportSignatures(quantCoreBaseUrl, exportPackage)");
    expect(importFileSource).toContain("setPendingImportPackage({ exportPackage, fileName: file.name })");
    expect(importFileSource).toContain("setInspectedExportPackage(exportPackage)");
    expect(importFileSource).not.toContain("importResearchRunExport");
    expect(confirmImportSource).toContain("importResearchRunExport(quantCoreBaseUrl, pendingImportPackage.exportPackage)");
    expect(auditWorkspaceSource).toContain("pendingFileName={pendingImportPackage?.fileName ?? null}");
    expect(auditWorkspaceSource).toContain("onConfirmImport={confirmPendingImportPackage}");
    expect(auditWorkspaceSource).toContain("onCancelImport={cancelPendingImportPackage}");
    expect(auditWorkspaceSource).toContain("isImporting={isApplyingImportPackage}");
    expect(importPanelSource).toContain("pendingFileName");
    expect(importPanelSource).toContain("research-import-diff-actions");
    expect(importPanelSource).toContain("onConfirmImport");
    expect(importPanelSource).toContain("onCancelImport");
    expect(cssBlock(".research-import-diff-actions")).toContain("display: flex;");
  });

  test("renders import audit events in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const importEventsPanelSource = sourceBetween("function ResearchRunImportAuditEventPanel", "function ResearchRunExportIndexPanel");

    expect(appSource).toContain("buildResearchRunImportAuditEvent");
    expect(appSource).toContain("buildResearchRunImportAuditAggregation");
    expect(appSource).toContain("buildResearchRunImportUndoAuditEvent");
    expect(appSource).toContain("buildResearchRunImportUndoConfirmation");
    expect(appSource).toContain("buildResearchRunImportUndoFailureAuditEvent");
    expect(appSource).toContain("undoResearchRunImport");
    expect(appSource).toContain("mergeResearchRunImportAuditEvents");
    expect(appSource).toContain("filterResearchRunImportAuditEvents");
    expect(appSource).toContain("const IMPORT_AUDIT_EVENTS_PAGE_SIZE = 12;");
    expect(appSource).toContain("const [researchRunImportAuditEvents, setResearchRunImportAuditEvents]");
    expect(appSource).toContain("const [researchRunImportAuditPagination, setResearchRunImportAuditPagination]");
    expect(appSource).toContain("function resolveInitialImportAuditEvidenceQuery(): string");
    expect(appSource).toContain("interface InitialImportAuditEvidenceDeepLink");
    expect(appSource).toContain("function resolveInitialImportAuditEvidenceDeepLink(): InitialImportAuditEvidenceDeepLink | null");
    expect(appSource).toContain("interface ResearchRunExportPackageInspectionResult");
    expect(appSource).toContain('new URLSearchParams(window.location.search).get("auditEvent")');
    expect(appSource).toContain('const runId = params.get("runId")?.trim();');
    expect(appSource).toContain('const exportPath = params.get("exportPath")?.trim() || `manifest:${runId}`;');
    expect(appSource).toContain("const initialImportAuditEvidenceDeepLink = resolveInitialImportAuditEvidenceDeepLink();");
    expect(appSource).toContain("const initialImportAuditEvidenceDeepLinkRef = useRef(initialImportAuditEvidenceDeepLink);");
    expect(appSource).toContain("const [researchRunImportAuditQuery, setResearchRunImportAuditQuery] = useState(resolveInitialImportAuditEvidenceQuery);");
    expect(appSource).toContain("const [researchRunImportAuditOffset, setResearchRunImportAuditOffset] = useState(0);");
    expect(appSource).toContain("const [focusedImportAuditEventId, setFocusedImportAuditEventId] = useState<string | null>(() => resolveInitialImportAuditEventId());");
    expect(appSource).toContain("const [copiedImportAuditEvidenceEventId, setCopiedImportAuditEvidenceEventId] = useState<string | null>(null);");
    expect(appSource).toContain("const [isLoadingResearchRunImportAudit, setIsLoadingResearchRunImportAudit] = useState(false);");
    expect(appSource).toContain("const researchRunImportAuditRequestIdRef = useRef(0);");
    expect(appSource).toContain("limit: IMPORT_AUDIT_EVENTS_PAGE_SIZE");
    expect(appSource).toContain("offset: researchRunImportAuditOffset");
    expect(appSource).toContain("query: researchRunImportAuditQuery.trim() || undefined");
    expect(appSource).toContain("setResearchRunImportAuditPagination(auditHistory.pagination ?? null)");
    expect(appSource).toContain("const copyResearchRunImportAuditEvidenceAnchor = useCallback");
    expect(appSource).toContain("const anchor = buildResearchRunImportAuditEvidenceUrl(event);");
    expect(appSource).toContain("navigator.clipboard.writeText(anchor)");
    expect(appSource).toContain("setCopiedImportAuditEvidenceEventId(event.id)");
    expect(appSource).toContain("function buildResearchRunImportAuditEvidenceUrl(event: ResearchRunImportAuditEvent): string");
    expect(appSource).toContain("blockedRows: event.blockedRows");
    expect(appSource).toContain("blockedRows: auditMetadataBlockedRows(record.metadata.blockedRows)");
    expect(appSource).toContain("function auditMetadataBlockedRows(value: unknown): ResearchRunImportAuditEvent[\"blockedRows\"]");
    expect(appSource).toContain("verifiedReportSignatures: event.verifiedReportSignatures");
    expect(appSource).toContain("verifiedReportSignatures: auditMetadataVerifiedReportSignatures(record.metadata.verifiedReportSignatures)");
    expect(appSource).toContain("function auditMetadataVerifiedReportSignatures(value: unknown): ResearchRunImportAuditEvent[\"verifiedReportSignatures\"]");
    expect(appSource).toContain("const inspectRunExportPackageByRunId = useCallback");
    expect(appSource).toContain("return { ok: false, error: errorMessage };");
    expect(appSource).toContain("return { ok: true };");
    expect(appSource).toContain("const inspectResearchRunImportAuditEvent = useCallback");
    expect(appSource).toContain("const deepLink = initialImportAuditEvidenceDeepLinkRef.current;");
    expect(appSource).toContain("initialImportAuditEvidenceDeepLinkRef.current = null;");
    expect(appSource).toContain("setResearchRunExportBrowserQuery(deepLink.focusQuery);");
    expect(appSource).toContain("setResearchRunImportDiffQuery(deepLink.focusQuery);");
    expect(appSource).toContain("void loadImportAuditEvidenceDeepLink(deepLink);");
    expect(appSource).toContain("function researchRunImportAuditEvidenceAnchorQuery(runId: string, exportPath: string): string");
    expect(appSource).toContain("function researchRunImportAuditEvidenceQuery(event: ResearchRunImportAuditEvent): string");
    expect(appSource).toContain("return researchRunImportAuditEvidenceAnchorQuery(event.runId, event.exportPath);");
    expect(appSource).toContain("inspectRunExportPackageByRunId(event.runId)");
    expect(appSource).toContain("const focusQuery = researchRunImportAuditEvidenceQuery(event);");
    expect(appSource).toContain("setResearchRunExportBrowserQuery(focusQuery);");
    expect(appSource).toContain("setResearchRunImportDiffQuery(focusQuery);");
    expect(appSource).toContain("function ResearchRunImportAuditEventPanel");
    expect(auditWorkspaceSource).toContain("<ResearchRunImportAuditEventPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-import-events-panel"');
    expect(auditWorkspaceSource).toContain("events={researchRunImportAuditEvents}");
    expect(auditWorkspaceSource).toContain("pagination={researchRunImportAuditPagination}");
    expect(auditWorkspaceSource).toContain("query={researchRunImportAuditQuery}");
    expect(auditWorkspaceSource).toContain("isLoading={isLoadingResearchRunImportAudit}");
    expect(auditWorkspaceSource).toContain("onQueryChange={updateResearchRunImportAuditQuery}");
    expect(auditWorkspaceSource).toContain("onPreviousPage={previousResearchRunImportAuditPage}");
    expect(auditWorkspaceSource).toContain("onNextPage={nextResearchRunImportAuditPage}");
    expect(auditWorkspaceSource).toContain("onInspectRunPackage={inspectResearchRunImportAuditEvent}");
    expect(auditWorkspaceSource).toContain("onCopyEvidenceAnchor={copyResearchRunImportAuditEvidenceAnchor}");
    expect(auditWorkspaceSource).toContain("copiedEvidenceEventId={copiedImportAuditEvidenceEventId}");
    expect(auditWorkspaceSource).toContain("focusedEventId={focusedImportAuditEventId}");
    expect(auditWorkspaceSource).toContain("onReplayRollbackRun={replayImportRollbackRun}");
    expect(auditWorkspaceSource).toContain("onUndoImport={undoResearchRunImportEvent}");
    expect(importEventsPanelSource).toContain("research-import-events-summary");
    expect(importEventsPanelSource).toContain("const [stageFilter, setStageFilter]");
    expect(importEventsPanelSource).toContain('filterResearchRunImportAuditEvents(events, "", stageFilter)');
    expect(importEventsPanelSource).toContain("onQueryChange(event.target.value)");
    expect(importEventsPanelSource).toContain("const pageStart = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;");
    expect(importEventsPanelSource).toContain("const canPageForward = Boolean(pagination && pagination.offset + pagination.limit < pagination.total);");
    expect(importEventsPanelSource).toContain("buildResearchRunImportAuditAggregation(events)");
    expect(importEventsPanelSource).toContain("research-import-events-filters");
    expect(importEventsPanelSource).toContain("data-active={stageFilter === filter.id}");
    expect(importEventsPanelSource).toContain("research-import-events-pagination");
    expect(importEventsPanelSource).toContain("onPreviousPage");
    expect(importEventsPanelSource).toContain("onNextPage");
    expect(importEventsPanelSource).toContain('const canInspectRunPackage = event.stage === "confirmed" || event.stage === "undone" || event.stage === "undo-failed";');
    expect(importEventsPanelSource).toContain("onInspectRunPackage(event)");
    expect(importEventsPanelSource).toContain("Open evidence");
    expect(importEventsPanelSource).toContain("copiedEvidenceEventId === event.id");
    expect(importEventsPanelSource).toContain("const focusedEventRef = useRef<HTMLElement | null>(null);");
    expect(importEventsPanelSource).toContain("focusedEventRef.current?.scrollIntoView({ block: \"center\", behavior: \"smooth\" });");
    expect(importEventsPanelSource).toContain("const isFocusedEvent = focusedEventId === event.id;");
    expect(importEventsPanelSource).toContain("ref={isFocusedEvent ? focusedEventRef : undefined}");
    expect(importEventsPanelSource).toContain('${isFocusedEvent ? "focused" : ""}');
    expect(importEventsPanelSource).toContain("onCopyEvidenceAnchor(event)");
    expect(importEventsPanelSource).toContain("Copy anchor");
    expect(importEventsPanelSource).toContain("Copied");
    expect(importEventsPanelSource).toContain("aggregation.failureBuckets");
    expect(importEventsPanelSource).toContain("aggregation.blockedEvidenceBuckets");
    expect(importEventsPanelSource).toContain("aggregation.verifiedReportSignatureBuckets");
    expect(importEventsPanelSource).toContain("researchImportBlockedEvidenceBucketLabel");
    expect(importEventsPanelSource).toContain("researchImportVerifiedReportSignatureBucketLabel");
    expect(appSource).toContain('"Import verification": "导入验签"');
    expect(importEventsPanelSource).toContain("bucket.latestExportPath");
    expect(importEventsPanelSource).toContain("bucket.latestDetail");
    expect(importEventsPanelSource).toContain("bucket.latestReason");
    expect(importEventsPanelSource).toContain("research-import-failure-buckets");
    expect(importEventsPanelSource).toContain("research-import-verification-bucket");
    expect(importEventsPanelSource).toContain("research-import-event-row");
    expect(importEventsPanelSource).toContain("event.recoveryHint");
    expect(importEventsPanelSource).toContain("event.blockedRows.length");
    expect(importEventsPanelSource).toContain("event.blockedRows");
    expect(importEventsPanelSource).toContain("`${row.label}: ${row.incoming}`");
    expect(importEventsPanelSource).toContain("event.undoToken");
    expect(importEventsPanelSource).toContain("pendingImportUndoToken");
    expect(importEventsPanelSource).toContain("buildResearchRunImportUndoConfirmation(event)");
    expect(importEventsPanelSource).toContain("setPendingImportUndoToken(event.undoToken)");
    expect(importEventsPanelSource).toContain("onUndoImport(undoConfirmation.undoToken, undoConfirmation.runId)");
    expect(importEventsPanelSource).toContain('event.stage !== "undone"');
    expect(appSource).toContain("buildResearchRunImportUndoFailureAuditEvent({");
    expect(importEventsPanelSource).toContain("aggregation.undoFailed");
    expect(importEventsPanelSource).toContain("onReplayRollbackRun(event.rollbackTargetRunId)");
    expect(importEventsPanelSource).toContain("research-import-event-recovery");
    expect(importEventsPanelSource).toContain("research-import-undo-confirmation");
    expect(cssBlock(".workflow-import-events-panel")).toContain("grid-area: import-events;");
    expect(cssBlock(".research-import-events")).toContain("display: grid;");
    expect(cssBlock(".research-import-events-filters")).toContain("display: flex;");
    expect(cssBlock(".research-import-events-pagination")).toContain("display: flex;");
    expect(cssBlock(".research-import-failure-buckets")).toContain("display: grid;");
    expect(cssBlock(".research-import-failure-bucket")).toContain("display: grid;");
    expect(cssBlock(".research-import-failure-bucket.positive")).toContain("border-left-color: #4cc9ad;");
    expect(cssBlock(".research-import-event-row")).toContain(
      "grid-template-columns: minmax(118px, 0.34fr) minmax(130px, 0.42fr) minmax(0, 1fr) minmax(132px, 0.36fr) minmax(92px, 0.24fr) auto;"
    );
    expect(cssBlock(".research-import-event-recovery")).toContain("display: flex;");
    expect(cssBlock(".research-import-undo-confirmation")).toContain("display: grid;");
    expect(cssBlock(".research-import-event-row.undo-failed")).toContain("border-left-color: #ff7f6d;");
    expect(cssBlock(".research-import-event-row.focused")).toContain("box-shadow:");
    expect(hasCssBlockWith(".audit-layout", ['"import-diff import-diff"', '"import-events import-events"', '"index index"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"import-diff"', '"import-events"', '"index"'])).toBe(true);
  });

  test("renders audit evidence report history from the backend ledger", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const reportLedgerPanelSource = sourceBetween("function AuditEvidenceReportLedgerPanel", "function ResearchRunImportAuditEventPanel");
    const signingKeyPanelSource = sourceBetween("function AuditSigningKeyRegistryPanel", "function ResearchRunImportAuditEventPanel");

    expect(appSource).toContain("buildAuditEvidenceReportLedgerRows");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerSummary");
    expect(appSource).toContain("buildAuditSigningKeyRotationChainSummary");
    expect(appSource).toContain("filterAuditEvidenceReportLedgerRows");
    expect(appSource).toContain("buildAuditSigningKeyRotationLedgerRows");
    expect(appSource).toContain("filterAuditSigningKeyRotationLedgerRows");
    expect(appSource).toContain("signAuditReportEvent");
    expect(appSource).toContain("verifyAuditReportEvent");
    expect(appSource).toContain("revokeAuditReportEvent");
    expect(appSource).toContain("loadAuditSigningKeys");
    expect(appSource).toContain("prepareAuditSigningKeyRotationPlan");
    expect(appSource).toContain("applyAuditSigningKeyRotationPlan");
    expect(appSource).toContain("recordAuditSigningKeyControlledRestartEvidence");
    expect(appSource).toContain("recordAuditSigningKeySecretMaterialization");
    expect(appSource).toContain("loadAuditSigningKeySecretMaterializations");
    expect(appSource).toContain("recordAuditSigningKeyEnvironmentBinding");
    expect(appSource).toContain("loadAuditSigningKeyEnvironmentBindings");
    expect(appSource).toContain("recordAuditSigningKeyRuntimeReloadExecution");
    expect(appSource).toContain("loadAuditSigningKeyRuntimeReloadExecutions");
    expect(appSource).toContain("recordAuditSigningKeyRotationAcceptance");
    expect(appSource).toContain("loadAuditSigningKeyRotationAcceptances");
    expect(appSource).toContain("buildAuditSigningKeyRotationPlanAuditEvent");
    expect(appSource).toContain("buildAuditSigningKeyRotationApplyAuditEvent");
    expect(appSource).toContain("AuditSigningKeyRegistryPanel");
    expect(appSource).toContain(
      '"audit_evidence_report,backtest_report,portfolio_report,p0_readiness_report,p0_acceptance_review,p2_manifest_chain_preflight,p2_manifest_chain_preflight_review,p2_readiness_evidence_coverage_review,p2_readiness_acceptance_generated,p2_readiness_acceptance_review,personal_team_readiness_review,daily_ops_control_room_review,daily_start_brief_review,stage1_daily_archive_review,operator_runbook_report,pre_live_runbook_report,research_context_readiness_report"'
    );
    expect(appSource).toContain('eventType: "audit_signing_key_rotation_plan"');
    expect(appSource).toContain('eventType: "audit_signing_key_rotation_apply"');
    expect(appSource).toContain("const [auditEvidenceReportEvents, setAuditEvidenceReportEvents]");
    expect(appSource).toContain("function resolveInitialAuditEvidenceReportQuery");
    expect(appSource).toContain('params.get("auditReportQuery")?.trim() || ""');
    expect(appSource).toContain("function replaceAuditEvidenceReportQueryUrlParam(query: string): void");
    expect(appSource).toContain('url.searchParams.set("workspace", "audit")');
    expect(appSource).toContain('url.searchParams.set("auditReportQuery", normalizedQuery)');
    expect(appSource).toContain('url.searchParams.delete("auditReportQuery")');
    expect(appSource).toContain("window.history.replaceState");
    expect(appSource).toContain("const [auditEvidenceReportQuery, setAuditEvidenceReportQuery] = useState(resolveInitialAuditEvidenceReportQuery)");
    expect(appSource).toContain("const updateAuditEvidenceReportQuery = useCallback((query: string) => {");
    expect(appSource).toContain("replaceAuditEvidenceReportQueryUrlParam(query);");
    expect(appSource).toContain("const openAuditReportLedgerEvidenceLink = useCallback");
    expect(appSource).toContain("const openAuditReportLedgerResearchContextLink = useCallback");
    expect(appSource).toContain("const copyAuditReportLedgerEvidenceLink = useCallback");
    expect(appSource).toContain("const copyAuditReportLedgerQueryLink = useCallback(async (query: string) =>");
    expect(appSource).toContain('url.searchParams.set("workspace", "audit")');
    expect(appSource).toContain('url.searchParams.set("auditReportQuery", query)');
    expect(appSource).toContain("const [auditSigningKeyRotationEvents, setAuditSigningKeyRotationEvents]");
    expect(appSource).toContain("const [signingAuditReportEventId, setSigningAuditReportEventId]");
    expect(appSource).toContain("const [verifyingAuditReportEventId, setVerifyingAuditReportEventId]");
    expect(appSource).toContain("const [revokingAuditReportEventId, setRevokingAuditReportEventId]");
    expect(appSource).toContain("const [auditSigningKeyRegistry, setAuditSigningKeyRegistry]");
    expect(appSource).toContain("const [auditSigningKeyRotationPlan, setAuditSigningKeyRotationPlan]");
    expect(appSource).toContain("const [auditSigningKeyRotationApply, setAuditSigningKeyRotationApply]");
    expect(appSource).toContain("const [auditSigningKeyRotationApplyConfirmations, setAuditSigningKeyRotationApplyConfirmations]");
    expect(appSource).toContain("const [auditSigningKeyRestartEvidence, setAuditSigningKeyRestartEvidence]");
    expect(appSource).toContain("const [auditSigningKeyRestartEvidenceConfirmations, setAuditSigningKeyRestartEvidenceConfirmations]");
    expect(appSource).toContain("const [auditSigningKeySecretMaterialization, setAuditSigningKeySecretMaterialization]");
    expect(appSource).toContain("const [auditSigningKeySecretMaterializationConfirmations, setAuditSigningKeySecretMaterializationConfirmations]");
    expect(appSource).toContain("const [auditSigningKeyEnvironmentBinding, setAuditSigningKeyEnvironmentBinding]");
    expect(appSource).toContain("const [auditSigningKeyEnvironmentBindingConfirmations, setAuditSigningKeyEnvironmentBindingConfirmations]");
    expect(appSource).toContain("const [auditSigningKeyRuntimeReloadExecution, setAuditSigningKeyRuntimeReloadExecution]");
    expect(appSource).toContain("const [auditSigningKeyRuntimeReloadExecutionConfirmations, setAuditSigningKeyRuntimeReloadExecutionConfirmations]");
    expect(appSource).toContain("const [auditSigningKeyRotationAcceptance, setAuditSigningKeyRotationAcceptance]");
    expect(appSource).toContain("const [auditSigningKeyRotationAcceptanceConfirmations, setAuditSigningKeyRotationAcceptanceConfirmations]");
    expect(appSource).toContain("const [isRecordingAuditSigningKeyRotationAcceptance, setIsRecordingAuditSigningKeyRotationAcceptance]");
    expect(appSource).toContain("const [auditSigningKeyRotationPlanEventId, setAuditSigningKeyRotationPlanEventId]");
    expect(appSource).toContain("const [auditSigningKeyRotationLedgerStatus, setAuditSigningKeyRotationLedgerStatus]");
    expect(appSource).toContain("const refreshAuditEvidenceReportEvents = useCallback");
    expect(appSource).toContain("const auditEvidenceReportLedgerRows = buildAuditEvidenceReportLedgerRows");
    expect(appSource).toContain("const auditSigningKeyRotationChainSummary = buildAuditSigningKeyRotationChainSummary");
    expect(appSource).toContain("const auditSigningKeyRotationLedgerRows = filterAuditSigningKeyRotationLedgerRows");
    expect(appSource).toContain("setAuditEvidenceReportEvents((current) =>");
    expect(appSource).toContain("const signAuditEvidenceReportEvent = useCallback");
    expect(appSource).toContain("const verifyAuditEvidenceReportEvent = useCallback");
    expect(appSource).toContain("const revokeAuditEvidenceReportEvent = useCallback");
    expect(appSource).toContain("setAuditEvidenceReportEvents((current) => mergeAuditEvidenceReportEvent(current, result.event!))");
    expect(appSource).toContain('eventType: "audit_signing_key_environment_binding"');
    expect(appSource).toContain('eventType: "audit_signing_key_runtime_reload_execution"');
    expect(appSource).toContain('eventType: "audit_signing_key_rotation_acceptance"');
    expect(appSource).toContain("const recordAuditSigningKeyEnvironmentBindingForAudit = useCallback");
    expect(appSource).toContain("const recordAuditSigningKeyRuntimeReloadExecutionForAudit = useCallback");
    expect(appSource).toContain("const recordAuditSigningKeyRotationAcceptanceForAudit = useCallback");
    expect(auditWorkspaceSource).toContain("<AuditEvidenceReportLedgerPanel");
    expect(auditWorkspaceSource).toContain("<AuditSigningKeyRegistryPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-report-ledger-panel"');
    expect(auditWorkspaceSource).toContain("rows={auditEvidenceReportLedgerRows}");
    expect(auditWorkspaceSource).toContain("pagination={auditEvidenceReportPagination}");
    expect(auditWorkspaceSource).toContain("query={auditEvidenceReportQuery}");
    expect(auditWorkspaceSource).toContain("isLoading={isLoadingAuditEvidenceReportEvents}");
    expect(auditWorkspaceSource).toContain("onQueryChange={updateAuditEvidenceReportQuery}");
    expect(auditWorkspaceSource).toContain("onOpenEvidenceLink={openAuditReportLedgerEvidenceLink}");
    expect(auditWorkspaceSource).toContain("onOpenResearchContextLink={openAuditReportLedgerResearchContextLink}");
    expect(auditWorkspaceSource).toContain("onCopyEvidenceLink={copyAuditReportLedgerEvidenceLink}");
    expect(auditWorkspaceSource).toContain("onCopyQueryLink={copyAuditReportLedgerQueryLink}");
    expect(auditWorkspaceSource).toContain("onPreviousPage={previousAuditEvidenceReportPage}");
    expect(auditWorkspaceSource).toContain("onNextPage={nextAuditEvidenceReportPage}");
    expect(auditWorkspaceSource).toContain("onSignReport={signAuditEvidenceReportEvent}");
    expect(auditWorkspaceSource).toContain("onVerifyReport={verifyAuditEvidenceReportEvent}");
    expect(auditWorkspaceSource).toContain("onRevokeReport={revokeAuditEvidenceReportEvent}");
    expect(auditWorkspaceSource).toContain("signingEventId={signingAuditReportEventId}");
    expect(auditWorkspaceSource).toContain("verifyingEventId={verifyingAuditReportEventId}");
    expect(auditWorkspaceSource).toContain("registry={auditSigningKeyRegistry.registry}");
    expect(auditWorkspaceSource).toContain("rotationPlan={auditSigningKeyRotationPlan.rotationPlan}");
    expect(auditWorkspaceSource).toContain("rotationApply={auditSigningKeyRotationApply.rotationApply}");
    expect(auditWorkspaceSource).toContain("rotationApplyConfirmations={auditSigningKeyRotationApplyConfirmations}");
    expect(auditWorkspaceSource).toContain("restartEvidence={auditSigningKeyRestartEvidence.restartEvidence}");
    expect(auditWorkspaceSource).toContain("restartEvidenceConfirmations={auditSigningKeyRestartEvidenceConfirmations}");
    expect(auditWorkspaceSource).toContain("secretMaterialization={auditSigningKeySecretMaterialization.secretMaterialization}");
    expect(auditWorkspaceSource).toContain("secretMaterializationConfirmations={auditSigningKeySecretMaterializationConfirmations}");
    expect(auditWorkspaceSource).toContain("secretMaterializationPlanEventId={auditSigningKeyRotationPlanEventId}");
    expect(auditWorkspaceSource).toContain("environmentBinding={auditSigningKeyEnvironmentBinding.environmentBinding}");
    expect(auditWorkspaceSource).toContain("environmentBindingConfirmations={auditSigningKeyEnvironmentBindingConfirmations}");
    expect(auditWorkspaceSource).toContain("environmentBindingMaterializationId={auditSigningKeySecretMaterialization.secretMaterialization?.materializationId ?? null}");
    expect(auditWorkspaceSource).toContain("runtimeReloadExecution={auditSigningKeyRuntimeReloadExecution.runtimeReloadExecution}");
    expect(auditWorkspaceSource).toContain("runtimeReloadExecutionConfirmations={auditSigningKeyRuntimeReloadExecutionConfirmations}");
    expect(auditWorkspaceSource).toContain("runtimeReloadExecutionPlanId={auditSigningKeyRuntimeReloadPlan.runtimeReloadPlan?.planId ?? null}");
    expect(auditWorkspaceSource).toContain("rotationAcceptance={auditSigningKeyRotationAcceptance.rotationAcceptance}");
    expect(auditWorkspaceSource).toContain("rotationAcceptanceConfirmations={auditSigningKeyRotationAcceptanceConfirmations}");
    expect(auditWorkspaceSource).toContain("rotationAcceptanceError={auditSigningKeyRotationAcceptance.error}");
    expect(auditWorkspaceSource).toContain("rotationAcceptanceExecutionId={auditSigningKeyRuntimeReloadExecution.runtimeReloadExecution?.executionId ?? null}");
    expect(auditWorkspaceSource).toContain("rotationChainSummary={auditSigningKeyRotationChainSummary}");
    expect(auditWorkspaceSource).toContain("rotationLedgerStatus={auditSigningKeyRotationLedgerStatus}");
    expect(auditWorkspaceSource).toContain("rotationHistoryRows={auditSigningKeyRotationHistoryRows}");
    expect(auditWorkspaceSource).toContain("onApplyRotation={applyAuditSigningKeyRotationPlanForAudit}");
    expect(auditWorkspaceSource).toContain("onApplyConfirmationChange={updateAuditSigningKeyRotationApplyConfirmation}");
    expect(auditWorkspaceSource).toContain("onRecordRestartEvidence={recordAuditSigningKeyRestartEvidenceForAudit}");
    expect(auditWorkspaceSource).toContain("onRestartEvidenceConfirmationChange={updateAuditSigningKeyRestartEvidenceConfirmation}");
    expect(auditWorkspaceSource).toContain("onRecordSecretMaterialization={recordAuditSigningKeySecretMaterializationForAudit}");
    expect(auditWorkspaceSource).toContain("onSecretMaterializationConfirmationChange={updateAuditSigningKeySecretMaterializationConfirmation}");
    expect(auditWorkspaceSource).toContain("onRecordEnvironmentBinding={recordAuditSigningKeyEnvironmentBindingForAudit}");
    expect(auditWorkspaceSource).toContain("onEnvironmentBindingConfirmationChange={updateAuditSigningKeyEnvironmentBindingConfirmation}");
    expect(auditWorkspaceSource).toContain("onRecordRuntimeReloadExecution={recordAuditSigningKeyRuntimeReloadExecutionForAudit}");
    expect(auditWorkspaceSource).toContain("onRuntimeReloadExecutionConfirmationChange={updateAuditSigningKeyRuntimeReloadExecutionConfirmation}");
    expect(auditWorkspaceSource).toContain("onRecordRotationAcceptance={recordAuditSigningKeyRotationAcceptanceForAudit}");
    expect(auditWorkspaceSource).toContain("onRotationAcceptanceConfirmationChange={updateAuditSigningKeyRotationAcceptanceConfirmation}");
    expect(auditWorkspaceSource).toContain("isRecordingRotationAcceptance={isRecordingAuditSigningKeyRotationAcceptance}");
    expect(auditWorkspaceSource).toContain("onOpenCompletionGap={selectProductWorkArea}");
    expect(auditWorkspaceSource).toContain("onCopyCompletionGapLink={copyP0CompletionGapLink}");
    expect(auditWorkspaceSource).toContain("source={auditSigningKeyRegistry.source}");
    expect(auditWorkspaceSource).toContain("error={auditSigningKeyRegistry.error}");
    expect(auditWorkspaceSource).toContain("onPrepareRotation={prepareAuditSigningKeyRotationPlanForAudit}");
    expect(auditWorkspaceSource).toContain("revokingEventId={revokingAuditReportEventId}");
    expect(reportLedgerPanelSource).toContain("buildAuditEvidenceReportLedgerSummary(rows)");
    expect(reportLedgerPanelSource).toContain("filterAuditEvidenceReportLedgerRows(rows, query)");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowPreLiveRunbookQuery");
    expect(reportLedgerPanelSource).toContain("audit-report-ledger-summary");
    expect(reportLedgerPanelSource).toContain("row.researchContextLinkSearch");
    expect(reportLedgerPanelSource).toContain("row.researchContextPreparationEvidenceRunId");
    expect(reportLedgerPanelSource).toContain("summary.latestResearchContextReportRunId");
    expect(reportLedgerPanelSource).toContain("summary.latestResearchContextReportLinkSearch");
    expect(reportLedgerPanelSource).toContain("summary.latestResearchContextReportQuery");
    expect(reportLedgerPanelSource).toContain("summary.latestPreLiveRunbookEventId");
    expect(reportLedgerPanelSource).toContain("summary.latestPreLiveRunbookEvidenceLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestPreLiveRunbookQuery");
    expect(reportLedgerPanelSource).toContain("summary.latestPreLiveRunbookGateLabel");
    expect(reportLedgerPanelSource).toContain('i18n.locale === "zh-CN" ? "最新运行手册" : "Latest runbook"');
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.latestPreLiveRunbookQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.latestPreLiveRunbookQuery)");
    expect(reportLedgerPanelSource).toContain('i18n.locale === "zh-CN" ? "最新研究上下文" : "Latest research"');
    expect(reportLedgerPanelSource).toContain('i18n.locale === "zh-CN" ? "打开研究上下文" : "Open research"');
    expect(reportLedgerPanelSource).toContain('i18n.locale === "zh-CN" ? "复制研究链接" : "Copy research link"');
    expect(reportLedgerPanelSource).toContain('className="audit-report-ledger-query-tools"');
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(query)");
    expect(reportLedgerPanelSource).toContain("disabled={!query.trim()}");
    expect(reportLedgerPanelSource).toContain("复制当前查询");
    expect(reportLedgerPanelSource).toContain("Copy query link");
    expect(reportLedgerPanelSource).toContain('onQueryChange("")');
    expect(reportLedgerPanelSource).toContain("清空查询");
    expect(reportLedgerPanelSource).toContain("Clear query");
    expect(reportLedgerPanelSource).toContain("summary.signingEligible");
    expect(reportLedgerPanelSource).toContain("summary.auditAid");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidRunId");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidEvidenceLink");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidPreparationEvidenceLabel");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.latestAuditAidPreparationEvidenceRunId)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink: (query: string) => void;");
    expect(appSource).toContain("buildLocalReviewCoverageNextActionUrlSearch");
    expect(appSource).toContain("const copyLocalReviewCoverageNextActionLink = useCallback(");
    expect(auditWorkspaceSource).toContain("onCopyLocalReviewCoverageNextActionLink={copyLocalReviewCoverageNextActionLink}");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.latestAuditAidPreparationEvidenceRunId)");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidPreflightActionLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidPreflightAttention");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidPreflightLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidPreflightQuery");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidCompletionLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidCompletionQuery");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidCompletionCurrentCriterionActionLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidCompletionCurrentCriterionTargetWorkspaceId");
    expect(reportLedgerPanelSource).toContain(
      "const latestCompletionGapWorkspaceId = summary.latestAuditAidCompletionCurrentCriterionTargetWorkspaceId"
    );
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidCompletionRecorded");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidCompletionTitle");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidProgressLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidProgressQuery");
    expect(reportLedgerPanelSource).toContain("summary.latestPersonalTeamReadinessReviewEventId");
    expect(reportLedgerPanelSource).toContain("summary.latestPersonalTeamReadinessReviewLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestPersonalTeamReadinessReviewQuery");
    expect(reportLedgerPanelSource).toContain("summary.latestPersonalTeamReadinessReviewShortHash");
    expect(reportLedgerPanelSource).toContain("summary.latestPersonalTeamReadinessReviewTitle");
    expect(reportLedgerPanelSource).toContain("summary.latestDailyOpsControlRoomReviewEventId");
    expect(reportLedgerPanelSource).toContain("summary.latestDailyOpsControlRoomReviewLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestDailyOpsControlRoomReviewQuery");
    expect(reportLedgerPanelSource).toContain("summary.latestDailyOpsControlRoomReviewShortHash");
    expect(reportLedgerPanelSource).toContain("summary.latestDailyOpsControlRoomReviewTitle");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleCount");
    expect(reportLedgerPanelSource).toContain("const hasLocalReviewBundleSummary =");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleCoverageQuery ||");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleCoverageNextActionQuery");
    expect(reportLedgerPanelSource).toContain("const localReviewBundleSummaryTitle =");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleCoverageNextActionTitle ||");
    expect(reportLedgerPanelSource).toContain("{hasLocalReviewBundleSummary ? (");
    expect(reportLedgerPanelSource).not.toContain("{summary.localReviewBundleCount > 0 ? (");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleCoverageLabel");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleCoverageNextActionLabel");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleCoverageNextActionQuery");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleCoverageNextActionTargetWorkspaceId");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleCoverageNextActionTitle");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleCoverageQuery");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleCoverageState");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleCoverageTitle");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleDailyOpsCount");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleLatestLabel");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleLatestQuery");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleLatestTitle");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundlePersonalTeamCount");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleQuery");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleTitle");
    expect(reportLedgerPanelSource).toContain("summary.latestReportLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestReportKind");
    expect(reportLedgerPanelSource).toContain("summary.latestReportQuery");
    expect(reportLedgerPanelSource).toContain("summary.latestP2ReadinessLinkedAcceptanceReviewEventId");
    expect(reportLedgerPanelSource).toContain("summary.latestP2ReadinessLinkedAcceptanceReviewQuery");
    expect(reportLedgerPanelSource).toContain("summary.latestP2ReadinessLinkedCoverageReviewEventId");
    expect(reportLedgerPanelSource).toContain("summary.latestP2ReadinessLinkedCoverageReviewLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestP2ReadinessLinkedCoverageReviewQuery");
    expect(reportLedgerPanelSource).toContain("summary.latestP2ReadinessReviewChainLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestP2ReadinessReviewChainQuery");
    expect(reportLedgerPanelSource).toContain("summary.latestP2ReadinessReviewChainGapEventId");
    expect(reportLedgerPanelSource).toContain("summary.latestP2ReadinessReviewChainGapLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestP2ReadinessReviewChainGapQuery");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainCount");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainGapCount");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainGapsQuery");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainHealthContextCount");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainHealthContextQuery");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainHealthContextTitle");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainHealthContextTitle ||");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainHealthLabel");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainHealthQuery");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainHealthState");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainHealthTitle");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainHealthTitle ||");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainLoadedCount");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainMissingAcceptanceCount");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainMissingAcceptanceQuery");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainMissingCoverageCount");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainMissingCoverageQuery");
    expect(reportLedgerPanelSource).toContain("summary.p2ReadinessReviewChainsQuery");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.latestP2ReadinessReviewChainQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.latestP2ReadinessReviewChainGapQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.p2ReadinessReviewChainHealthContextQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.p2ReadinessReviewChainHealthQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.p2ReadinessReviewChainGapsQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.p2ReadinessReviewChainMissingAcceptanceQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.p2ReadinessReviewChainMissingCoverageQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.latestP2ReadinessLinkedAcceptanceReviewQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.latestP2ReadinessLinkedCoverageReviewQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.p2ReadinessReviewChainsQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.latestP2ReadinessReviewChainQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.latestP2ReadinessReviewChainGapQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.p2ReadinessReviewChainHealthContextQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.p2ReadinessReviewChainHealthQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.p2ReadinessReviewChainGapsQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.p2ReadinessReviewChainMissingAcceptanceQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.p2ReadinessReviewChainMissingCoverageQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.latestP2ReadinessLinkedAcceptanceReviewQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.latestP2ReadinessLinkedCoverageReviewQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.p2ReadinessReviewChainsQuery)");
    expect(reportLedgerPanelSource).toContain("P2 复核链");
    expect(reportLedgerPanelSource).toContain("P2 review chain");
    expect(reportLedgerPanelSource).toContain("全部复核链");
    expect(reportLedgerPanelSource).toContain("All review chains");
    expect(reportLedgerPanelSource).toContain("复核链健康");
    expect(reportLedgerPanelSource).toContain("Chain health");
    expect(reportLedgerPanelSource).toContain("健康上下文");
    expect(reportLedgerPanelSource).toContain("Health context");
    expect(reportLedgerPanelSource).toContain("已加载链");
    expect(reportLedgerPanelSource).toContain("Loaded chains");
    expect(reportLedgerPanelSource).toContain("全部复核链缺口");
    expect(reportLedgerPanelSource).toContain("All chain gaps");
    expect(reportLedgerPanelSource).toContain("最新缺口");
    expect(reportLedgerPanelSource).toContain("Latest gap");
    expect(reportLedgerPanelSource).toContain("复核链缺口");
    expect(reportLedgerPanelSource).toContain("Chain gaps");
    expect(reportLedgerPanelSource).toContain("缺顶层复核");
    expect(reportLedgerPanelSource).toContain("Missing acceptance");
    expect(reportLedgerPanelSource).toContain("定位全部复核链");
    expect(reportLedgerPanelSource).toContain("Focus all chains");
    expect(reportLedgerPanelSource).toContain("复制全部复核链链接");
    expect(reportLedgerPanelSource).toContain("Copy all chains link");
    expect(reportLedgerPanelSource).toContain("定位复核链健康");
    expect(reportLedgerPanelSource).toContain("Focus chain health");
    expect(reportLedgerPanelSource).toContain("复制复核链健康链接");
    expect(reportLedgerPanelSource).toContain("Copy chain health link");
    expect(reportLedgerPanelSource).toContain("定位复核链健康上下文");
    expect(reportLedgerPanelSource).toContain("Focus chain health context");
    expect(reportLedgerPanelSource).toContain("复制复核链健康上下文链接");
    expect(reportLedgerPanelSource).toContain("Copy chain health context link");
    expect(reportLedgerPanelSource).toContain("定位全部复核链缺口");
    expect(reportLedgerPanelSource).toContain("Focus all chain gaps");
    expect(reportLedgerPanelSource).toContain("复制全部复核链缺口链接");
    expect(reportLedgerPanelSource).toContain("Copy all chain gaps link");
    expect(reportLedgerPanelSource).toContain("定位最新复核链缺口");
    expect(reportLedgerPanelSource).toContain("Focus latest chain gap");
    expect(reportLedgerPanelSource).toContain("复制最新复核链缺口链接");
    expect(reportLedgerPanelSource).toContain("Copy latest chain gap link");
    expect(reportLedgerPanelSource).toContain("定位复核链缺口");
    expect(reportLedgerPanelSource).toContain("Focus chain gaps");
    expect(reportLedgerPanelSource).toContain("复制复核链缺口链接");
    expect(reportLedgerPanelSource).toContain("Copy chain gaps link");
    expect(reportLedgerPanelSource).toContain("定位顶层复核缺口");
    expect(reportLedgerPanelSource).toContain("Focus missing acceptance");
    expect(reportLedgerPanelSource).toContain("复制顶层复核缺口链接");
    expect(reportLedgerPanelSource).toContain("Copy missing acceptance link");
    expect(reportLedgerPanelSource).toContain("定位复核链");
    expect(reportLedgerPanelSource).toContain("Focus review chain");
    expect(reportLedgerPanelSource).toContain("复制复核链链接");
    expect(reportLedgerPanelSource).toContain("Copy review chain link");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.latestReportQuery)");
    expect(reportLedgerPanelSource).toContain("需签名");
    expect(reportLedgerPanelSource).toContain("Audit aids");
    expect(reportLedgerPanelSource).toContain("定位最新");
    expect(reportLedgerPanelSource).toContain("Focus latest");
    expect(reportLedgerPanelSource).toContain("最新辅助");
    expect(reportLedgerPanelSource).toContain("Latest aid");
    expect(reportLedgerPanelSource).toContain("最新进度");
    expect(reportLedgerPanelSource).toContain("Latest progress");
    expect(reportLedgerPanelSource).toContain("最新完成定义");
    expect(reportLedgerPanelSource).toContain("Latest completion");
    expect(reportLedgerPanelSource).toContain("定位进度");
    expect(reportLedgerPanelSource).toContain("Focus progress");
    expect(reportLedgerPanelSource).toContain("复制进度链接");
    expect(reportLedgerPanelSource).toContain("Copy progress link");
    expect(reportLedgerPanelSource).toContain("定位完成定义");
    expect(reportLedgerPanelSource).toContain("Focus completion");
    expect(reportLedgerPanelSource).toContain("复制完成链接");
    expect(reportLedgerPanelSource).toContain("Copy completion link");
    expect(reportLedgerPanelSource).toContain("打开完成缺口");
    expect(reportLedgerPanelSource).toContain("Open completion gap");
    expect(reportLedgerPanelSource).toContain("复制完成缺口链接");
    expect(reportLedgerPanelSource).toContain("Copy completion gap link");
    expect(reportLedgerPanelSource).toContain("最新预检");
    expect(reportLedgerPanelSource).toContain("Latest preflight");
    expect(reportLedgerPanelSource).toContain("定位预检");
    expect(reportLedgerPanelSource).toContain("Focus preflight");
    expect(reportLedgerPanelSource).toContain("复制预检链接");
    expect(reportLedgerPanelSource).toContain("Copy preflight link");
    expect(reportLedgerPanelSource).toContain("下一步");
    expect(reportLedgerPanelSource).toContain("Next action");
    expect(reportLedgerPanelSource).toContain("预检关注");
    expect(reportLedgerPanelSource).toContain("Preflight attention");
    expect(reportLedgerPanelSource).toContain("打开最新辅助");
    expect(reportLedgerPanelSource).toContain("Open latest aid");
    expect(reportLedgerPanelSource).toContain("onOpenEvidenceLink(summary.latestAuditAidEvidenceLink)");
    expect(reportLedgerPanelSource).toContain("复制最新辅助");
    expect(reportLedgerPanelSource).toContain("Copy latest aid");
    expect(reportLedgerPanelSource).toContain("onCopyEvidenceLink(summary.latestAuditAidEvidenceLink)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.latestAuditAidProgressQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.latestAuditAidProgressQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.latestAuditAidCompletionQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.latestAuditAidCompletionQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.latestPersonalTeamReadinessReviewQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.latestPersonalTeamReadinessReviewQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.latestDailyOpsControlRoomReviewQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.latestDailyOpsControlRoomReviewQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.latestStage1DailyArchiveReviewQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.latestStage1DailyArchiveReviewQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.localReviewBundleQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.localReviewBundleQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.localReviewBundleCoverageQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.localReviewBundleCoverageQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.localReviewBundleCoverageNextActionQuery)");
    expect(reportLedgerPanelSource).toContain(
      "onFocusLocalReviewCoverageNextAction(localReviewCoverageNextActionWorkspaceId, summary.localReviewBundleCoverageNextActionQuery)"
    );
    expect(reportLedgerPanelSource).toContain(
      "onFocusLocalReviewCoverageNextAction: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;"
    );
    expect(reportLedgerPanelSource).toContain("localReviewCoverageNextActionWorkspaceId");
    expect(reportLedgerPanelSource).toContain("localReviewCoverageNextActionStateFromParts(");
    expect(reportLedgerPanelSource).toContain("const localReviewCoverageNextActionState =");
    expect(reportLedgerPanelSource).toContain(
      "localReviewCoverageNextActionLabel(i18n, localReviewCoverageNextActionState)"
    );
    expect(reportLedgerPanelSource).toContain(
      "localReviewCoverageNextActionTitle(i18n, localReviewCoverageNextActionState, summary.localReviewBundleCoverageNextActionTitle, summary.localReviewBundleCoverageNextActionQuery, summary.localReviewBundleCoverageNextActionLabel)"
    );
    expect(reportLedgerPanelSource).toContain(
      "onCopyLocalReviewCoverageNextActionLink(localReviewCoverageNextActionWorkspaceId, summary.localReviewBundleCoverageNextActionQuery)"
    );
    expect(reportLedgerPanelSource).toContain(
      "onCopyLocalReviewCoverageNextActionLink: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;"
    );
    expect(reportLedgerPanelSource).toContain(
      "onOpenLocalReviewCoverageNextAction(localReviewCoverageNextActionWorkspaceId, summary.localReviewBundleCoverageNextActionQuery)"
    );
    expect(reportLedgerPanelSource).toContain(
      "onOpenLocalReviewCoverageNextAction: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;"
    );
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.localReviewBundleLatestQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.localReviewBundleLatestQuery)");
    expect(reportLedgerPanelSource).toContain("本地复核集");
    expect(reportLedgerPanelSource).toContain("Local review bundle");
    expect(reportLedgerPanelSource).toContain("本地复核覆盖");
    expect(reportLedgerPanelSource).toContain("Local review coverage");
    expect(reportLedgerPanelSource).toContain("覆盖下一步");
    expect(reportLedgerPanelSource).toContain("Coverage next");
    expect(reportLedgerPanelSource).toContain("个人/小团队");
    expect(reportLedgerPanelSource).toContain("Personal/team");
    expect(reportLedgerPanelSource).toContain("每日复核");
    expect(reportLedgerPanelSource).toContain("Daily reviews");
    expect(reportLedgerPanelSource).toContain("summary.localReviewBundleStage1ArchiveCount");
    expect(reportLedgerPanelSource).toContain("Stage 1 归档");
    expect(reportLedgerPanelSource).toContain("Stage 1 archive");
    expect(reportLedgerPanelSource).toContain("定位本地复核集");
    expect(reportLedgerPanelSource).toContain("Focus local reviews");
    expect(reportLedgerPanelSource).toContain("复制本地复核集链接");
    expect(reportLedgerPanelSource).toContain("Copy local reviews link");
    expect(reportLedgerPanelSource).toContain("定位本地复核覆盖");
    expect(reportLedgerPanelSource).toContain("Focus local coverage");
    expect(reportLedgerPanelSource).toContain("复制本地复核覆盖链接");
    expect(reportLedgerPanelSource).toContain("Copy local coverage link");
    expect(appSource).toContain("定位覆盖下一步");
    expect(appSource).toContain("Focus coverage next");
    expect(reportLedgerPanelSource).toContain("localReviewCoverageNextActionFocusLabel(i18n, localReviewCoverageNextActionState)");
    expect(appSource).toContain("定位 Daily Ops 覆盖下一步");
    expect(appSource).toContain("Focus Daily Ops coverage next");
    expect(appSource).toContain("定位每日启动覆盖下一步");
    expect(appSource).toContain("Focus daily start coverage next");
    expect(appSource).toContain("定位个人/小团队覆盖下一步");
    expect(appSource).toContain("Focus personal/team coverage next");
    expect(appSource).toContain("定位本地复核启动");
    expect(appSource).toContain("Focus local review start");
    expect(appSource).toContain("打开覆盖下一步");
    expect(appSource).toContain("Open coverage next");
    expect(appSource).toContain("打开 Daily Ops 复核入口");
    expect(appSource).toContain("Open Daily Ops review entry");
    expect(appSource).toContain("打开每日启动复核入口");
    expect(appSource).toContain("Open daily start review entry");
    expect(appSource).toContain("打开个人/小团队复核入口");
    expect(appSource).toContain("Open personal/team review entry");
    expect(appSource).toContain("复制覆盖下一步链接");
    expect(appSource).toContain("Copy coverage next link");
    expect(appSource).toContain("复制 Daily Ops 覆盖下一步链接");
    expect(appSource).toContain("Copy Daily Ops coverage next link");
    expect(appSource).toContain("复制每日启动覆盖下一步链接");
    expect(appSource).toContain("Copy daily start coverage next link");
    expect(appSource).toContain("复制个人/小团队覆盖下一步链接");
    expect(appSource).toContain("Copy personal/team coverage next link");
    expect(appSource).toContain("复制本地复核启动链接");
    expect(appSource).toContain("Copy local review start link");
    expect(appSource).toContain('state?.actionId === "record-stage1-archive-review"');
    expect(appSource).toContain("localReviewCoverageNextActionShouldFocusStage1ArchiveEntry(");
    expect(appSource).toContain("queueStage1P0DailyUseArchiveRecordActionFocus();");
    expect(reportLedgerPanelSource).toContain("最新本地复核");
    expect(reportLedgerPanelSource).toContain("Latest local review");
    expect(reportLedgerPanelSource).toContain("定位最新本地复核");
    expect(reportLedgerPanelSource).toContain("Focus latest local review");
    expect(reportLedgerPanelSource).toContain("复制最新本地复核链接");
    expect(reportLedgerPanelSource).toContain("Copy latest local review link");
    expect(reportLedgerPanelSource).toContain("最新可用性复核");
    expect(reportLedgerPanelSource).toContain("Latest readiness review");
    expect(reportLedgerPanelSource).toContain("定位最新可用性复核");
    expect(reportLedgerPanelSource).toContain("Focus latest readiness review");
    expect(reportLedgerPanelSource).toContain("复制最新可用性复核链接");
    expect(reportLedgerPanelSource).toContain("Copy latest readiness review link");
    expect(reportLedgerPanelSource).toContain("最新每日复核");
    expect(reportLedgerPanelSource).toContain("Latest daily review");
    expect(reportLedgerPanelSource).toContain("定位最新每日复核");
    expect(reportLedgerPanelSource).toContain("Focus latest daily review");
    expect(reportLedgerPanelSource).toContain("复制最新每日复核链接");
    expect(reportLedgerPanelSource).toContain("Copy latest daily review link");
    expect(reportLedgerPanelSource).toContain("summary.latestStage1DailyArchiveReviewEventId");
    expect(reportLedgerPanelSource).toContain("latestStage1DailyArchiveReviewShortHash");
    expect(reportLedgerPanelSource).toContain("latestStage1DailyArchiveReviewLabel");
    expect(reportLedgerPanelSource).toContain("latestStage1DailyArchiveReviewQuery");
    expect(reportLedgerPanelSource).toContain("最新归档复核");
    expect(reportLedgerPanelSource).toContain("Latest archive review");
    expect(reportLedgerPanelSource).toContain("定位最新归档复核");
    expect(reportLedgerPanelSource).toContain("Focus latest archive review");
    expect(reportLedgerPanelSource).toContain("复制最新归档复核链接");
    expect(reportLedgerPanelSource).toContain("Copy latest archive review link");
    expect(reportLedgerPanelSource).toContain("onOpenCompletionGap(latestCompletionGapWorkspaceId)");
    expect(reportLedgerPanelSource).toContain("onOpenCompletionGap: (workspaceId: ProductWorkAreaId) => void;");
    expect(reportLedgerPanelSource).toContain("onCopyCompletionGapLink(latestCompletionGapWorkspaceId, summary.latestAuditAidCompletionQuery)");
    expect(reportLedgerPanelSource).toContain(
      "onCopyCompletionGapLink: (workspaceId: ProductWorkAreaId, auditReportQuery: string) => void;"
    );
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(summary.latestAuditAidPreflightQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(summary.latestAuditAidPreflightQuery)");
    expect(reportLedgerPanelSource).toContain("audit-report-ledger-pagination");
    expect(reportLedgerPanelSource).toContain("audit-report-ledger-row");
    expect(reportLedgerPanelSource).toContain("row.shortHash");
    expect(reportLedgerPanelSource).toContain("row.signatureLabel");
    expect(reportLedgerPanelSource).toContain("row.reportKind");
    expect(reportLedgerPanelSource).not.toContain('row.reportKind !== "audit_evidence_report"');
    expect(reportLedgerPanelSource).toContain("row.importVerificationDetail");
    expect(reportLedgerPanelSource).toContain("row.importVerificationInvalid > 0");
    expect(reportLedgerPanelSource).toContain("导入验签失败");
    expect(reportLedgerPanelSource).toContain("导入验签");
    expect(reportLedgerPanelSource).toContain("summary.importVerificationVerified");
    expect(reportLedgerPanelSource).toContain("summary.importVerificationInvalid");
    expect(reportLedgerPanelSource).toContain("row.signatureDetail");
    expect(reportLedgerPanelSource).toContain("row.chainId");
    expect(reportLedgerPanelSource).toContain("row.signatureDetail && row.chainId");
    expect(reportLedgerPanelSource).toContain('row.signatureStatus === "revoked" && row.signatureRevokedReason');
    expect(reportLedgerPanelSource).toContain("row.signatureSignedAt || row.signatureVerifiedAt");
    expect(reportLedgerPanelSource).toContain("row.focusQuery");
    expect(reportLedgerPanelSource).toContain("audit-report-ledger-actions");
    expect(reportLedgerPanelSource).toContain("onSignReport(row.id)");
    expect(reportLedgerPanelSource).toContain("onVerifyReport(row.id)");
    expect(reportLedgerPanelSource).toContain("onRevokeReport(row.id)");
    expect(reportLedgerPanelSource).toContain("row.evidenceLinkSearch");
    expect(reportLedgerPanelSource).toContain("row.evidenceLinkLabel");
    expect(reportLedgerPanelSource).toContain("row.evidenceLinkDecodedSearch");
    expect(reportLedgerPanelSource).toContain("row.p2ReadinessAcceptanceCoverageReviewLinkLabel");
    expect(reportLedgerPanelSource).toContain("row.p2ReadinessAcceptanceCoverageReviewLinkQuery");
    expect(reportLedgerPanelSource).toContain("row.p2ReadinessEvidenceCoverageAcceptanceReviewLinkLabel");
    expect(reportLedgerPanelSource).toContain("row.p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery");
    expect(reportLedgerPanelSource).toContain("row.p2ReadinessReviewChainLabel");
    expect(reportLedgerPanelSource).toContain("row.p2ReadinessReviewChainQuery");
    expect(reportLedgerPanelSource).toContain("row.p2ReadinessReviewChainAcceptanceLoaded");
    expect(reportLedgerPanelSource).toContain("row.p2ReadinessReviewChainCoverageLoaded");
    expect(reportLedgerPanelSource).toContain("row.p2ReadinessReviewChainStatusLabel");
    expect(reportLedgerPanelSource).toContain("row.p2ReadinessReviewChainStatusQuery");
    expect(reportLedgerPanelSource).toContain("row.p2ReadinessReviewChainHealthContextQuery");
    expect(reportLedgerPanelSource).toContain("row.p2ReadinessReviewChainHealthContextTitle");
    expect(reportLedgerPanelSource).toContain('className="audit-report-ledger-p2-coverage-review"');
    expect(reportLedgerPanelSource).toContain('className="audit-report-ledger-p2-acceptance-review"');
    expect(reportLedgerPanelSource).toContain('className="audit-report-ledger-p2-review-chain"');
    expect(reportLedgerPanelSource).toContain("audit-report-ledger-p2-review-chain-status");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(row.p2ReadinessAcceptanceCoverageReviewLinkQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(row.p2ReadinessAcceptanceCoverageReviewLinkQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(row.p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(row.p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(row.p2ReadinessReviewChainQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(row.p2ReadinessReviewChainQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(row.p2ReadinessReviewChainStatusQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(row.p2ReadinessReviewChainStatusQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(row.p2ReadinessReviewChainHealthContextQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(row.p2ReadinessReviewChainHealthContextQuery)");
    expect(reportLedgerPanelSource).toContain("row.p2ReadinessReviewChainHealthContextTitle ||");
    expect(reportLedgerPanelSource).toContain("整条复核链");
    expect(reportLedgerPanelSource).toContain("Review chain");
    expect(reportLedgerPanelSource).toContain("复核链已加载");
    expect(reportLedgerPanelSource).toContain("Review chain loaded");
    expect(reportLedgerPanelSource).toContain("复核链缺 coverage");
    expect(reportLedgerPanelSource).toContain("Review chain missing coverage");
    expect(reportLedgerPanelSource).toContain("复核链缺顶层复核");
    expect(reportLedgerPanelSource).toContain("Review chain missing acceptance");
    expect(reportLedgerPanelSource).toContain("定位整条复核链");
    expect(reportLedgerPanelSource).toContain("Focus row chain");
    expect(reportLedgerPanelSource).toContain("复制整条复核链链接");
    expect(reportLedgerPanelSource).toContain("Copy row chain link");
    expect(reportLedgerPanelSource).toContain("定位复核链状态");
    expect(reportLedgerPanelSource).toContain("Focus chain status");
    expect(reportLedgerPanelSource).toContain("复制复核链状态链接");
    expect(reportLedgerPanelSource).toContain("Copy chain status link");
    expect(reportLedgerPanelSource).toContain("定位行复核链健康上下文");
    expect(reportLedgerPanelSource).toContain("Focus row chain health context");
    expect(reportLedgerPanelSource).toContain("复制行复核链健康上下文链接");
    expect(reportLedgerPanelSource).toContain("Copy row chain health context link");
    expect(reportLedgerPanelSource).toContain("定位覆盖复核");
    expect(reportLedgerPanelSource).toContain("Focus coverage review");
    expect(reportLedgerPanelSource).toContain("复制覆盖复核链接");
    expect(reportLedgerPanelSource).toContain("Copy coverage link");
    expect(reportLedgerPanelSource).toContain("定位顶层复核");
    expect(reportLedgerPanelSource).toContain("Focus acceptance review");
    expect(reportLedgerPanelSource).toContain("复制顶层复核链接");
    expect(reportLedgerPanelSource).toContain("Copy acceptance link");
    expect(reportLedgerPanelSource).toContain("row.paperPreflightLabel");
    expect(reportLedgerPanelSource).toContain('className="audit-report-ledger-preflight"');
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP0ReadinessReportQuery");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP0ProgressLabel");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP0ProgressQuery");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP0CompletionLabel");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP0CompletionTitle");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP0CompletionQuery");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP0PreflightQuery");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewLabel");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewQuery");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewTitle");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewLabel");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewQuery");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewTitle");
    expect(reportLedgerPanelSource).toContain("rowP0ProgressLabel");
    expect(reportLedgerPanelSource).toContain("rowP0ProgressQuery");
    expect(reportLedgerPanelSource).toContain("rowP0CompletionLabel");
    expect(reportLedgerPanelSource).toContain("rowP0CompletionQuery");
    expect(reportLedgerPanelSource).toContain("rowPersonalTeamReadinessReviewLabel");
    expect(reportLedgerPanelSource).toContain("rowPersonalTeamReadinessReviewQuery");
    expect(reportLedgerPanelSource).toContain("rowDailyOpsControlRoomReviewLabel");
    expect(reportLedgerPanelSource).toContain("rowDailyOpsControlRoomReviewQuery");
    expect(reportLedgerPanelSource).toContain("row.localReviewBundleContextLabel");
    expect(reportLedgerPanelSource).toContain("row.localReviewBundleContextQuery");
    expect(reportLedgerPanelSource).toContain("row.localReviewBundleContextTitle");
    expect(reportLedgerPanelSource).toContain("row.localReviewBundleCoverageQuery");
    expect(reportLedgerPanelSource).toContain("row.localReviewBundleCoverageTitle");
    expect(reportLedgerPanelSource).toContain("row.localReviewBundleCoverageNextActionQuery");
    expect(reportLedgerPanelSource).toContain("row.localReviewBundleCoverageNextActionTargetWorkspaceId");
    expect(reportLedgerPanelSource).toContain("row.localReviewBundleCoverageNextActionTitle");
    expect(reportLedgerPanelSource).toContain("row.localReviewBundleLatestLabel");
    expect(reportLedgerPanelSource).toContain("row.localReviewBundleLatestQuery");
    expect(reportLedgerPanelSource).toContain("row.localReviewBundleLatestTitle");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(row.localReviewBundleContextQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(row.localReviewBundleContextQuery)");
    expect(reportLedgerPanelSource).toContain("row.localReviewBundleContextLabel || row.localReviewBundleContextQuery");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(row.localReviewBundleCoverageQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(row.localReviewBundleCoverageQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(row.localReviewBundleCoverageNextActionQuery)");
    expect(reportLedgerPanelSource).toContain("rowLocalReviewCoverageNextActionWorkspaceId");
    expect(reportLedgerPanelSource).toContain(
      "onFocusLocalReviewCoverageNextAction(rowLocalReviewCoverageNextActionWorkspaceId, row.localReviewBundleCoverageNextActionQuery)"
    );
    expect(reportLedgerPanelSource).toContain(
      "onCopyLocalReviewCoverageNextActionLink(rowLocalReviewCoverageNextActionWorkspaceId, row.localReviewBundleCoverageNextActionQuery)"
    );
    expect(reportLedgerPanelSource).toContain(
      "onOpenLocalReviewCoverageNextAction(rowLocalReviewCoverageNextActionWorkspaceId, row.localReviewBundleCoverageNextActionQuery)"
    );
    expect(reportLedgerPanelSource).toContain("const rowLocalReviewCoverageNextActionState =");
    expect(reportLedgerPanelSource).toContain(
      "localReviewCoverageNextActionLabel(i18n, rowLocalReviewCoverageNextActionState)"
    );
    expect(reportLedgerPanelSource).toContain(
      "localReviewCoverageNextActionTitle(i18n, rowLocalReviewCoverageNextActionState, row.localReviewBundleCoverageNextActionTitle, row.localReviewBundleCoverageNextActionQuery)"
    );
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(row.localReviewBundleLatestQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(row.localReviewBundleLatestQuery)");
    expect(reportLedgerPanelSource).toContain('className="audit-report-ledger-personal-team-review"');
    expect(reportLedgerPanelSource).toContain('className="audit-report-ledger-daily-ops-review"');
    expect(reportLedgerPanelSource).toContain('className="audit-report-ledger-local-review-latest"');
    expect(reportLedgerPanelSource).toContain("个人/小团队复核");
    expect(reportLedgerPanelSource).toContain("Personal/team review");
    expect(reportLedgerPanelSource).toContain("每日操作复核");
    expect(reportLedgerPanelSource).toContain("Daily ops review");
    expect(reportLedgerPanelSource).toContain("定位行本地复核集");
    expect(reportLedgerPanelSource).toContain("Focus row local reviews");
    expect(reportLedgerPanelSource).toContain("复制行本地复核集链接");
    expect(reportLedgerPanelSource).toContain("Copy row local reviews link");
    expect(reportLedgerPanelSource).toContain("定位行本地复核覆盖");
    expect(reportLedgerPanelSource).toContain("Focus row local coverage");
    expect(reportLedgerPanelSource).toContain("复制行本地复核覆盖链接");
    expect(reportLedgerPanelSource).toContain("Copy row local coverage link");
    expect(appSource).toContain("定位行覆盖下一步");
    expect(appSource).toContain("Focus row coverage next");
    expect(reportLedgerPanelSource).toContain(
      'localReviewCoverageNextActionFocusLabel(i18n, rowLocalReviewCoverageNextActionState, "row")'
    );
    expect(appSource).toContain("定位行 Daily Ops 覆盖下一步");
    expect(appSource).toContain("Focus row Daily Ops coverage next");
    expect(appSource).toContain("定位行每日启动覆盖下一步");
    expect(appSource).toContain("Focus row daily start coverage next");
    expect(appSource).toContain("定位行个人/小团队覆盖下一步");
    expect(appSource).toContain("Focus row personal/team coverage next");
    expect(appSource).toContain("打开行覆盖下一步");
    expect(appSource).toContain("Open row coverage next");
    expect(appSource).toContain("打开行 Daily Ops 复核入口");
    expect(appSource).toContain("Open row Daily Ops review entry");
    expect(appSource).toContain("打开行每日启动复核入口");
    expect(appSource).toContain("Open row daily start review entry");
    expect(appSource).toContain("打开行个人/小团队复核入口");
    expect(appSource).toContain("Open row personal/team review entry");
    expect(appSource).toContain("复制行覆盖下一步链接");
    expect(appSource).toContain("Copy row coverage next link");
    expect(appSource).toContain("复制行 Daily Ops 覆盖下一步链接");
    expect(appSource).toContain("Copy row Daily Ops coverage next link");
    expect(appSource).toContain("复制行每日启动覆盖下一步链接");
    expect(appSource).toContain("Copy row daily start coverage next link");
    expect(appSource).toContain("复制行个人/小团队覆盖下一步链接");
    expect(appSource).toContain("Copy row personal/team coverage next link");
    expect(reportLedgerPanelSource).toContain("row.p0CompletionCurrentCriterionTargetWorkspaceId");
    expect(reportLedgerPanelSource).toContain(
      "const rowCompletionGapWorkspaceId = row.p0CompletionCurrentCriterionTargetWorkspaceId"
    );
    expect(reportLedgerPanelSource).toContain("onOpenCompletionGap(rowCompletionGapWorkspaceId)");
    expect(reportLedgerPanelSource).toContain("onCopyCompletionGapLink(rowCompletionGapWorkspaceId, rowP0CompletionQuery)");
    expect(reportLedgerPanelSource).toContain("rowP0PreflightQuery");
    expect(reportLedgerPanelSource).toContain("rowP0ReadinessReportQuery");
    expect(reportLedgerPanelSource).toContain("rowPreLiveRunbookQuery");
    expect(reportLedgerPanelSource).toContain('className="audit-report-ledger-pre-live"');
    expect(reportLedgerPanelSource).toContain("auditReportLedgerPreLiveRunbookEvidenceLabel(i18n, row.preLiveRunbookEvidenceIds.length)");
    expect(reportLedgerPanelSource).toContain("row.preLiveRunbookCompletedSteps");
    expect(reportLedgerPanelSource).toContain("row.preLiveRunbookTotalSteps");
    expect(reportLedgerPanelSource).toContain("row.p0PreparationEvidenceRunId");
    expect(reportLedgerPanelSource).toContain("preparationEvidenceRunId");
    expect(reportLedgerPanelSource).toContain('className="audit-report-ledger-preparation"');
    expect(reportLedgerPanelSource).toContain("数据准备");
    expect(reportLedgerPanelSource).toContain("Data prep");
    expect(reportLedgerPanelSource).toContain("onOpenEvidenceLink(row.evidenceLinkSearch)");
    expect(reportLedgerPanelSource).toContain("onCopyEvidenceLink(row.evidenceLinkSearch)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(preparationEvidenceRunId)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(preparationEvidenceRunId)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(rowP0ReadinessReportQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(rowP0ReadinessReportQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(rowP0ProgressQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(rowP0ProgressQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(rowP0CompletionQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(rowP0CompletionQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(rowP0PreflightQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(rowP0PreflightQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(rowPreLiveRunbookQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(rowPreLiveRunbookQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(rowPersonalTeamReadinessReviewQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(rowPersonalTeamReadinessReviewQuery)");
    expect(reportLedgerPanelSource).toContain("focusAuditReportQuery(rowDailyOpsControlRoomReviewQuery)");
    expect(reportLedgerPanelSource).toContain("onCopyQueryLink(rowDailyOpsControlRoomReviewQuery)");
    expect(reportLedgerPanelSource).toContain("定位可用性复核");
    expect(reportLedgerPanelSource).toContain("Focus readiness review");
    expect(reportLedgerPanelSource).toContain("复制可用性复核链接");
    expect(reportLedgerPanelSource).toContain("Copy readiness review link");
    expect(reportLedgerPanelSource).toContain("定位每日复核");
    expect(reportLedgerPanelSource).toContain("Focus daily review");
    expect(reportLedgerPanelSource).toContain("复制每日复核链接");
    expect(reportLedgerPanelSource).toContain("Copy daily review link");
    expect(reportLedgerPanelSource).toContain("打开证据");
    expect(reportLedgerPanelSource).toContain("Open evidence");
    expect(reportLedgerPanelSource).toContain("复制证据链接");
    expect(reportLedgerPanelSource).toContain("Copy evidence link");
    expect(reportLedgerPanelSource).toContain("复制数据准备链接");
    expect(reportLedgerPanelSource).toContain("Copy prep link");
    expect(reportLedgerPanelSource).toContain("定位数据准备");
    expect(reportLedgerPanelSource).toContain("Focus prep");
    expect(reportLedgerPanelSource).toContain("P0 进度");
    expect(reportLedgerPanelSource).toContain("P0 progress");
    expect(reportLedgerPanelSource).toContain("定位进度");
    expect(reportLedgerPanelSource).toContain("Focus progress");
    expect(reportLedgerPanelSource).toContain("复制进度链接");
    expect(reportLedgerPanelSource).toContain("Copy progress link");
    expect(reportLedgerPanelSource).toContain("定位 P0 报告");
    expect(reportLedgerPanelSource).toContain("Focus P0 report");
    expect(reportLedgerPanelSource).toContain("复制 P0 报告链接");
    expect(reportLedgerPanelSource).toContain("Copy P0 report link");
    expect(reportLedgerPanelSource).toContain("定位运行手册");
    expect(reportLedgerPanelSource).toContain("Focus runbook");
    expect(reportLedgerPanelSource).toContain("复制运行手册链接");
    expect(reportLedgerPanelSource).toContain("Copy runbook link");
    expect(cssBlock(".audit-report-ledger-query-tools")).toContain("display: grid;");
    expect(cssBlock(".audit-report-ledger-query-tools")).toContain(
      "grid-template-columns: minmax(0, 1fr) auto auto;",
    );
    expect(cssBlock(".audit-report-ledger-query-tools button")).toContain("white-space: nowrap;");
    expect(cssBlock(".audit-report-ledger-query-tools button:disabled")).toContain("cursor: not-allowed;");
    expect(cssBlock(".audit-report-ledger-personal-team-review")).toContain("border: 1px solid rgba(116, 214, 195, 0.35);");
    expect(cssBlock(".audit-report-ledger-daily-ops-review")).toContain("border: 1px solid rgba(232, 190, 98, 0.4);");
    expect(reportLedgerPanelSource).toContain("signingEventId === row.id");
    expect(reportLedgerPanelSource).toContain("verifyingEventId === row.id");
    expect(reportLedgerPanelSource).toContain("revokingEventId === row.id");
    expect(appSource).toContain("auditReportLedgerRowIsSigningEligible");
    expect(reportLedgerPanelSource).toContain("!auditReportLedgerRowIsSigningEligible(row)");
    expect(reportLedgerPanelSource).toContain('row.signatureStatus === "revoked"');
    expect(signingKeyPanelSource).toContain("audit-signing-key-rotation-plan");
    expect(signingKeyPanelSource).toContain("rotationPlan.environmentUpdates");
    expect(signingKeyPanelSource).toContain("rotationPlan.legacyRegistryTemplate");
    expect(signingKeyPanelSource).toContain("audit-signing-key-rotation-ledger");
    expect(signingKeyPanelSource).toContain("audit-signing-key-rotation-history");
    expect(signingKeyPanelSource).toContain("rotationHistoryRows.map");
    expect(signingKeyPanelSource).toContain("rotationChainSummary.stages.map");
    expect(signingKeyPanelSource).toContain("audit-signing-key-rotation-chain");
    expect(signingKeyPanelSource).toContain("auditSigningKeyRotationChainHeadline");
    expect(signingKeyPanelSource).toContain("auditSigningKeyRotationChainStageLabel");
    expect(signingKeyPanelSource).toContain("audit-signing-key-rotation-apply");
    expect(signingKeyPanelSource).toContain("rotationApplyConfirmations");
    expect(signingKeyPanelSource).toContain("onApplyRotation");
    expect(signingKeyPanelSource).toContain("audit-signing-key-restart-evidence");
    expect(signingKeyPanelSource).toContain("restartEvidenceConfirmations");
    expect(signingKeyPanelSource).toContain("onRecordRestartEvidence");
    expect(signingKeyPanelSource).toContain("restartWindowExecuted");
    expect(signingKeyPanelSource).toContain("rollbackPlanConfirmed");
    expect(signingKeyPanelSource).toContain("postRestartValidationPassed");
    expect(signingKeyPanelSource).toContain("operatorReviewedRestartLogs");
    expect(signingKeyPanelSource).toContain("audit-signing-key-secret-materialization");
    expect(signingKeyPanelSource).toContain("secretMaterializationConfirmations");
    expect(signingKeyPanelSource).toContain("onRecordSecretMaterialization");
    expect(signingKeyPanelSource).toContain("localSecretStoreWriteVerified");
    expect(signingKeyPanelSource).toContain("noRawSecretInPayload");
    expect(signingKeyPanelSource).toContain("envBindingPlanDocumented");
    expect(signingKeyPanelSource).toContain("rollbackPlanDocumented");
    expect(signingKeyPanelSource).toContain("audit-signing-key-environment-binding");
    expect(signingKeyPanelSource).toContain("environmentBindingConfirmations");
    expect(signingKeyPanelSource).toContain("onRecordEnvironmentBinding");
    expect(signingKeyPanelSource).toContain("runtimeEnvMappingVerified");
    expect(signingKeyPanelSource).toContain("configReloadPlanDocumented");
    expect(signingKeyPanelSource).toContain("rollbackSnapshotRecorded");
    expect(signingKeyPanelSource).toContain("auditSigningKeyEnvironmentBindingStatusLabel");
    expect(signingKeyPanelSource).toContain("audit-signing-key-runtime-reload-execution");
    expect(signingKeyPanelSource).toContain("runtimeReloadExecutionConfirmations");
    expect(signingKeyPanelSource).toContain("onRecordRuntimeReloadExecution");
    expect(signingKeyPanelSource).toContain("preReloadHealthVerified");
    expect(signingKeyPanelSource).toContain("reloadActionRecorded");
    expect(signingKeyPanelSource).toContain("postReloadSmokePassed");
    expect(signingKeyPanelSource).toContain("rollbackReadinessConfirmed");
    expect(signingKeyPanelSource).toContain("operatorConfirmedLiveBlocked");
    expect(signingKeyPanelSource).toContain("auditSigningKeyRuntimeReloadExecutionStatusLabel");
    expect(signingKeyPanelSource).toContain("audit-signing-key-rotation-acceptance");
    expect(signingKeyPanelSource).toContain("rotationAcceptanceConfirmations");
    expect(signingKeyPanelSource).toContain("onRecordRotationAcceptance");
    expect(signingKeyPanelSource).toContain("executionEvidenceReviewed");
    expect(signingKeyPanelSource).toContain("signatureProbeVerified");
    expect(signingKeyPanelSource).toContain("legacyVerificationConfirmed");
    expect(signingKeyPanelSource).toContain("rollbackWindowStillOpen");
    expect(signingKeyPanelSource).toContain("operatorConfirmedActivationBlocked");
    expect(signingKeyPanelSource).toContain("auditSigningKeyRotationAcceptanceStatusLabel");
    expect(signingKeyPanelSource).toContain("rotationLedgerStatus");
    expect(signingKeyPanelSource).toContain("onPrepareRotation");
    expect(appSource).toContain('"Verified signature": "签名已验证"');
    expect(appSource).toContain('"Signed report hash": "报告 hash 已签名"');
    expect(appSource).toContain('"Revoked signature": "签名已撤销"');
    expect(cssBlock(".workflow-report-ledger-panel")).toContain("grid-area: reports;");
    expect(cssBlock(".workflow-signing-keys-panel")).toContain("grid-area: signing-keys;");
    expect(cssBlock(".audit-signing-key-grid")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-plan")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-ledger")).toContain("display: flex;");
    expect(cssBlock(".audit-signing-key-rotation-history")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-chain")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-chain-stages")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-chain-stage")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-history-row")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-apply")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-secret-materialization")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-environment-binding")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-runtime-reload-execution")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-acceptance")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-apply-checks")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-apply-result")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-env-row")).toContain("display: grid;");
    expect(cssBlock(".audit-report-ledger")).toContain("display: grid;");
    expect(cssBlock(".audit-report-ledger-summary")).toContain("display: flex;");
    expect(cssBlock(".audit-report-ledger-pagination")).toContain("display: flex;");
    expect(cssBlock(".audit-report-ledger-actions")).toContain("display: flex;");
    expect(cssBlock(".audit-report-ledger-research-context")).toContain("border: 1px solid rgba(125, 249, 228, 0.2);");
    expect(cssBlock(".audit-report-ledger-p0-progress")).toContain("border: 1px solid rgba(125, 249, 228, 0.28);");
    expect(cssBlock(".audit-report-ledger-p0-completion.ready")).toContain("border: 1px solid rgba(139, 126, 255, 0.42);");
    expect(cssBlock(".audit-report-ledger-preflight")).toContain("border: 1px solid #266c60;");
    expect(cssBlock(".audit-report-ledger-pre-live")).toContain("border: 1px solid rgba(232, 190, 98, 0.28);");
    expect(cssBlock(".audit-report-ledger-row")).toContain(
      "grid-template-columns: minmax(118px, 0.34fr) minmax(170px, 0.5fr) minmax(0, 1fr) minmax(132px, 0.34fr) auto;"
    );
    expect(
      hasCssBlockWith(".audit-layout", [
        '"package package"',
        '"portfolio-orders portfolio-orders"',
        '"reports reports"',
        '"signing-keys signing-keys"',
        '"import-diff import-diff"'
      ])
    ).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"package"', '"portfolio-orders"', '"reports"', '"signing-keys"', '"import-diff"'])).toBe(true);
  });

  test("renders the evidence package control room as the audit workspace entry point", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const controlRoomSource = sourceBetween("function EvidencePackageControlRoomPanel", "function P0AcceptanceReviewPanel");

    expect(appSource).toContain("buildEvidencePackageControlRoomRows");
    expect(appSource).toContain("const evidencePackageControlRoom = buildEvidencePackageControlRoomRows({");
    expect(appSource).toContain("const runEvidencePackageControlAction = useCallback");
    expect(appSource).toContain("updateResearchRunImportAuditQuery(focusQuery)");
    expect(appSource).toContain('updateAuditEvidenceReportQuery(`p0_acceptance_review ${row.runId}`)');
    expect(auditWorkspaceSource).toContain("<EvidencePackageControlRoomPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-evidence-control-panel"');
    expect(auditWorkspaceSource).toContain("controlRoom={evidencePackageControlRoom}");
    expect(auditWorkspaceSource).toContain("onRunAction={runEvidencePackageControlAction}");
    expect(controlRoomSource).toContain("controlRoom.summary");
    expect(controlRoomSource).toContain("controlRoom.rows.slice(0, 8)");
    expect(controlRoomSource).toContain("evidencePackageControlStatusLabel");
    expect(controlRoomSource).toContain("evidencePackageControlActionLabel");
    expect(cssBlock(".workflow-evidence-control-panel")).toContain("grid-area: evidence-control;");
    expect(cssBlock(".evidence-package-control-summary")).toContain("grid-template-columns: repeat(5, minmax(120px, 1fr));");
    expect(cssBlock(".evidence-package-control-row")).toContain(
      "grid-template-columns: minmax(180px, 0.8fr) minmax(320px, 1.35fr) auto;"
    );
    expect(hasCssDeclaration(".evidence-package-control-gates", "grid-template-columns: repeat(4, minmax(0, 1fr));")).toBe(true);
    expect(hasCssBlockWith(".audit-layout", ['"evidence-control evidence-control"', '"runbook workflow"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"evidence-control"', '"runbook"'])).toBe(true);
  });

  test("renders market data refresh override audit events in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const overridePanelSource = sourceBetween("function MarketDataRefreshOverrideAuditLedgerPanel", "function AuditEvidenceReportLedgerPanel");

    expect(appSource).toContain("buildMarketDataRefreshOverrideAuditLedgerRows");
    expect(appSource).toContain("buildMarketDataRefreshOverrideAuditLedgerSummary");
    expect(appSource).toContain("filterMarketDataRefreshOverrideAuditLedgerRows");
    expect(appSource).toContain('eventType: "market_data_refresh_override"');
    expect(appSource).toContain("const [marketDataRefreshOverrideAuditEvents, setMarketDataRefreshOverrideAuditEvents]");
    expect(appSource).toContain("const refreshMarketDataRefreshOverrideAuditEvents = useCallback");
    expect(appSource).toContain("const marketDataRefreshOverrideAuditRows = buildMarketDataRefreshOverrideAuditLedgerRows");
    expect(auditWorkspaceSource).toContain("<MarketDataRefreshOverrideAuditLedgerPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-market-refresh-overrides-panel"');
    expect(auditWorkspaceSource).toContain("rows={marketDataRefreshOverrideAuditRows}");
    expect(auditWorkspaceSource).toContain("pagination={marketDataRefreshOverrideAuditPagination}");
    expect(auditWorkspaceSource).toContain("query={marketDataRefreshOverrideAuditQuery}");
    expect(auditWorkspaceSource).toContain("isLoading={isLoadingMarketDataRefreshOverrideAudit}");
    expect(overridePanelSource).toContain("buildMarketDataRefreshOverrideAuditLedgerSummary(rows)");
    expect(overridePanelSource).toContain("filterMarketDataRefreshOverrideAuditLedgerRows(rows, query)");
    expect(overridePanelSource).toContain("market-refresh-audit-summary");
    expect(overridePanelSource).toContain("market-refresh-audit-pagination");
    expect(overridePanelSource).toContain("market-refresh-audit-row");
    expect(overridePanelSource).toContain("summary.liveBlocked");
    expect(overridePanelSource).toContain("row.overrideReason");
    expect(overridePanelSource).toContain("row.boundary");
    expect(overridePanelSource).toContain("row.affectedSymbolsLabel");
    expect(overridePanelSource).toContain("row.retryAfterSeconds");
    expect(overridePanelSource).toContain("row.liveTradingAllowed");
    expect(overridePanelSource).toContain("覆盖审计");
    expect(overridePanelSource).toContain("Refresh overrides");
    expect(cssBlock(".workflow-market-refresh-overrides-panel")).toContain("grid-area: refresh-overrides;");
    expect(cssBlock(".market-refresh-audit")).toContain("display: grid;");
    expect(cssBlock(".market-refresh-audit-summary")).toContain("display: flex;");
    expect(cssBlock(".market-refresh-audit-pagination")).toContain("display: flex;");
    expect(cssBlock(".market-refresh-audit-row")).toContain(
      "grid-template-columns: minmax(120px, 0.34fr) minmax(180px, 0.46fr) minmax(0, 1fr) minmax(150px, 0.38fr);"
    );
    expect(hasCssBlockWith(".audit-layout", ['"refresh-overrides refresh-overrides"', '"reports reports"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"refresh-overrides"', '"reports"'])).toBe(true);
  });

  test("renders portfolio paper order audit events in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const orderAuditQueryUpdaterSource = sourceBetween(
      "const updatePortfolioPaperOrderAuditQuery = useCallback",
      "const previousPortfolioPaperOrderAuditPage"
    );
    const orderPanelSource = portfolioPaperOrderAuditPanelSource;

    expect(appSource).toContain("buildPortfolioPaperOrderAuditLedgerRows");
    expect(portfolioPaperOrderAuditPanelSource).toContain("buildPortfolioPaperOrderAuditLedgerSummary");
    expect(portfolioPaperOrderAuditPanelSource).toContain("filterPortfolioPaperOrderAuditLedgerRows");
    expect(appSource).toContain("PORTFOLIO_PAPER_ORDER_AUDIT_EVENT_TYPES");
    expect(appSource).toContain("const [portfolioPaperOrderAuditEvents, setPortfolioPaperOrderAuditEvents]");
    expect(appSource).toContain("const refreshPortfolioPaperOrderAuditEvents = useCallback");
    expect(appSource).toContain("const portfolioPaperOrderAuditRows = buildPortfolioPaperOrderAuditLedgerRows");
    expect(appSource).toContain("setPortfolioPaperOrderAuditQuery(normalizedQuery)");
    expect(orderAuditQueryUpdaterSource).toContain("replaceAuditEvidenceReportQueryUrlParam(query);");
    expect(auditWorkspaceSource).toContain("<PortfolioPaperOrderAuditLedgerPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-portfolio-paper-order-audit-panel"');
    expect(auditWorkspaceSource).toContain("rows={portfolioPaperOrderAuditRows}");
    expect(auditWorkspaceSource).toContain("pagination={portfolioPaperOrderAuditPagination}");
    expect(auditWorkspaceSource).toContain("query={portfolioPaperOrderAuditQuery}");
    expect(auditWorkspaceSource).toContain("isLoading={isLoadingPortfolioPaperOrderAudit}");
    expect(auditWorkspaceSource).toContain("onCopyQueryLink={copyAuditReportLedgerQueryLink}");
    expect(orderPanelSource).toContain("onCopyQueryLink?: (query: string) => void");
    expect(orderPanelSource).toContain("onClick={() => onCopyQueryLink?.(query)}");
    expect(orderPanelSource).toContain("buildPortfolioPaperOrderAuditLedgerSummary(rows)");
    expect(orderPanelSource).toContain("filterPortfolioPaperOrderAuditLedgerRows(rows, query)");
    expect(orderPanelSource).toContain("portfolio-paper-order-audit-summary");
    expect(orderPanelSource).toContain("portfolio-paper-order-audit-pagination");
    expect(orderPanelSource).toContain("portfolio-paper-order-audit-row");
    expect(orderPanelSource).toContain("summary.liveBlocked");
    expect(orderPanelSource).toContain("row.adapterEvidenceId");
    expect(orderPanelSource).toContain("row.boundaryLabel");
    expect(orderPanelSource).toContain("组合委托审计");
    expect(orderPanelSource).toContain("Portfolio order audit");
    expect(orderPanelSource).toContain("复制审计链接");
    expect(orderPanelSource).toContain("Copy audit link");
    expect(cssBlock(".workflow-portfolio-paper-order-audit-panel")).toContain("grid-area: portfolio-orders;");
    expect(cssBlock(".portfolio-paper-order-audit")).toContain("display: grid;");
    expect(cssBlock(".portfolio-paper-order-audit-summary")).toContain("display: flex;");
    expect(cssBlock(".portfolio-paper-order-audit-pagination")).toContain("display: flex;");
    expect(cssBlock(".portfolio-paper-order-audit-row")).toContain(
      "grid-template-columns: minmax(92px, 0.24fr) minmax(164px, 0.42fr) minmax(0, 0.7fr) minmax(210px, 0.54fr);"
    );
    expect(hasCssBlockWith(".audit-layout", ['"refresh-overrides refresh-overrides"', '"portfolio-orders portfolio-orders"', '"reports reports"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"refresh-overrides"', '"portfolio-orders"', '"reports"'])).toBe(true);
  });

  test("renders execution adapter paper execution audit events in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const adapterPaperAuditQueryUpdaterSource = sourceBetween(
      "const updateExecutionAdapterPaperExecutionAuditQuery = useCallback",
      "const previousExecutionAdapterPaperExecutionAuditPage"
    );

    expect(appSource).toContain("buildExecutionAdapterPaperExecutionAuditLedgerRows");
    expect(appSource).toContain("EXECUTION_ADAPTER_PAPER_EXECUTION_AUDIT_EVENT_TYPES");
    expect(appSource).toContain("const [executionAdapterPaperExecutionAuditEvents, setExecutionAdapterPaperExecutionAuditEvents]");
    expect(appSource).toContain("const refreshExecutionAdapterPaperExecutionAuditEvents = useCallback");
    expect(appSource).toContain(
      "const executionAdapterPaperExecutionAuditRows = buildExecutionAdapterPaperExecutionAuditLedgerRows"
    );
    expect(adapterPaperAuditQueryUpdaterSource).toContain("replaceAuditEvidenceReportQueryUrlParam(query);");
    expect(auditWorkspaceSource).toContain("<ExecutionAdapterPaperExecutionAuditLedgerPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-adapter-paper-execution-audit-panel"');
    expect(auditWorkspaceSource).toContain("rows={executionAdapterPaperExecutionAuditRows}");
    expect(auditWorkspaceSource).toContain("pagination={executionAdapterPaperExecutionAuditPagination}");
    expect(auditWorkspaceSource).toContain("query={executionAdapterPaperExecutionAuditQuery}");
    expect(auditWorkspaceSource).toContain("isLoading={isLoadingExecutionAdapterPaperExecutionAudit}");
    expect(auditWorkspaceSource).toContain("onCopyQueryLink={copyAuditReportLedgerQueryLink}");
    expect(cssBlock(".workflow-adapter-paper-execution-audit-panel")).toContain("grid-area: adapter-paper-executions;");
    expect(hasCssBlockWith(".audit-layout", [
      '"portfolio-orders portfolio-orders"',
      '"adapter-paper-executions adapter-paper-executions"',
      '"reports reports"'
    ])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"portfolio-orders"', '"adapter-paper-executions"', '"reports"'])).toBe(true);
  });

  test("links adapter paper execution evidence from settings into the audit ledger", () => {
    const settingsWorkspaceSource = sourceBetween('if (activeWorkAreaId === "settings")', "<BrokerAdapterPanel");
    const adapterWorkflowSource = sourceBetween("function PlatformSettingsPanel", "function BrokerAdapterPanel");
    const focusAuditSource = sourceBetween(
      "const focusExecutionAdapterPaperExecutionAudit = useCallback",
      "const copyExecutionAdapterPaperExecutionAuditLink"
    );
    const copyAuditSource = sourceBetween(
      "const copyExecutionAdapterPaperExecutionAuditLink = useCallback",
      "const copyP0CurrentGapActionLink"
    );

    expect(appSource).toContain("function buildExecutionAdapterPaperExecutionAuditQuery(row: ExecutionAdapterPaperExecutionRow)");
    expect(focusAuditSource).toContain("updateExecutionAdapterPaperExecutionAuditQuery");
    expect(focusAuditSource).toContain('selectProductWorkArea("audit")');
    expect(copyAuditSource).toContain("copyAuditReportLedgerQueryLink(buildExecutionAdapterPaperExecutionAuditQuery(row))");
    expect(settingsWorkspaceSource).toContain("onFocusPaperExecutionAudit={focusExecutionAdapterPaperExecutionAudit}");
    expect(settingsWorkspaceSource).toContain("onCopyPaperExecutionAuditLink={copyExecutionAdapterPaperExecutionAuditLink}");
    expect(adapterWorkflowSource).toContain("onFocusPaperExecutionAudit?: (row: ExecutionAdapterPaperExecutionRow) => void");
    expect(adapterWorkflowSource).toContain("onCopyPaperExecutionAuditLink?: (row: ExecutionAdapterPaperExecutionRow) => void");
    expect(adapterWorkflowSource).toContain("onClick={() => onFocusPaperExecutionAudit?.(paperExecution)}");
    expect(adapterWorkflowSource).toContain("onClick={() => void onCopyPaperExecutionAuditLink?.(paperExecution)}");
    expect(adapterWorkflowSource).toContain("审计定位");
    expect(adapterWorkflowSource).toContain("复制审计链接");
    expect(adapterWorkflowSource).toContain("Open audit");
    expect(adapterWorkflowSource).toContain("Copy audit link");
    expect(appSource).toContain("Adapter paper execution audit opened");
    expect(appSource).toContain("Adapter paper execution audit link copy requested");
  });

  test("opens adapter paper execution audit rows back in settings evidence", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const settingsWorkspaceSource = sourceBetween('if (activeWorkAreaId === "settings")', "<BrokerAdapterPanel");
    const settingsPanelSource = sourceBetween("function PlatformSettingsPanel", "function BrokerAdapterPanel");
    const openEvidenceSource = sourceBetween(
      "const openExecutionAdapterPaperExecutionEvidence = useCallback",
      "const copyAuditReportLedgerEvidenceLink"
    );

    expect(appSource).toContain(
      "const [focusedAdapterPaperExecutionAuditEventId, setFocusedAdapterPaperExecutionAuditEventId]"
    );
    expect(openEvidenceSource).toContain("setFocusedAdapterPaperExecutionAuditEventId(row.id)");
    expect(openEvidenceSource).toContain('selectProductWorkArea("settings")');
    expect(openEvidenceSource).toContain("Adapter paper execution evidence selected");
    expect(auditWorkspaceSource).toContain(
      "onOpenExecutionEvidence={openExecutionAdapterPaperExecutionEvidence}"
    );
    expect(settingsWorkspaceSource).toContain(
      "focusedPaperExecutionAuditEventId={focusedAdapterPaperExecutionAuditEventId}"
    );
    expect(settingsPanelSource).toContain("focusedPaperExecutionAuditEventId?: string | null");
    expect(settingsPanelSource).toContain("const focusedPaperExecutionRef = useRef<HTMLElement | null>(null);");
    expect(settingsPanelSource).toContain(
      'focusedPaperExecutionRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });'
    );
    expect(settingsPanelSource).toContain("paperExecution.auditEventId === focusedPaperExecutionAuditEventId");
    expect(settingsPanelSource).toContain('${isFocusedPaperExecution ? "focused" : ""}');
    expect(settingsPanelSource).toContain("ref={isFocusedPaperExecution ? focusedPaperExecutionRef : undefined}");
    expect(executionAdapterPaperExecutionAuditPanelSource).toContain(
      "onOpenExecutionEvidence?: (row: ExecutionAdapterPaperExecutionAuditLedgerRow) => void"
    );
    expect(executionAdapterPaperExecutionAuditPanelSource).toContain(
      "onClick={() => onOpenExecutionEvidence?.(row)}"
    );
    expect(executionAdapterPaperExecutionAuditPanelSource).toContain("打开执行证据");
    expect(executionAdapterPaperExecutionAuditPanelSource).toContain("Open execution evidence");
    expect(cssBlock(".adapter-ops-state-row.focused")).toContain("box-shadow:");
    expect(cssBlock(".adapter-paper-execution-audit-open-execution")).toContain("display: inline-flex;");
  });

  test("persists adapter paper execution evidence focus as a shareable settings deep link", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const openEvidenceSource = sourceBetween(
      "const openExecutionAdapterPaperExecutionEvidence = useCallback",
      "const copyExecutionAdapterPaperExecutionEvidenceLink"
    );
    const copyEvidenceSource = sourceBetween(
      "const copyExecutionAdapterPaperExecutionEvidenceLink = useCallback",
      "const openMarketDataAdapterWorkflow"
    );

    expect(appSource).toContain("function resolveInitialAdapterPaperExecutionAuditEventId(): string | null");
    expect(appSource).toContain('new URLSearchParams(window.location.search).get("adapterPaperExecutionAuditEvent")');
    expect(appSource).toContain(
      "useState<string | null>(() => resolveInitialAdapterPaperExecutionAuditEventId())"
    );
    expect(appSource).toContain("function replaceAdapterPaperExecutionEvidenceUrlParam(eventId: string): void");
    expect(appSource).toContain("function buildExecutionAdapterPaperExecutionEvidenceUrl(eventId: string): string");
    expect(openEvidenceSource).toContain("replaceAdapterPaperExecutionEvidenceUrlParam(row.id)");
    expect(copyEvidenceSource).toContain("buildExecutionAdapterPaperExecutionEvidenceUrl(row.id)");
    expect(copyEvidenceSource).toContain("navigator.clipboard.writeText");
    expect(copyEvidenceSource).toContain("Adapter paper execution evidence link copied");
    expect(auditWorkspaceSource).toContain(
      "onCopyExecutionEvidenceLink={copyExecutionAdapterPaperExecutionEvidenceLink}"
    );
    expect(executionAdapterPaperExecutionAuditPanelSource).toContain(
      "onCopyExecutionEvidenceLink?: (row: ExecutionAdapterPaperExecutionAuditLedgerRow) => void"
    );
    expect(executionAdapterPaperExecutionAuditPanelSource).toContain(
      "onClick={() => void onCopyExecutionEvidenceLink?.(row)}"
    );
    expect(executionAdapterPaperExecutionAuditPanelSource).toContain("复制执行证据链接");
    expect(executionAdapterPaperExecutionAuditPanelSource).toContain("Copy execution link");
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

  test("compares current AI review evidence with the latest saved audit record", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function AgentEvidenceBoard");

    expect(appSource).toContain("function AiReviewAuditComparison");
    expect(auditWorkspaceSource).toContain("currentRunId={workspace.researchRun?.runId ?? null}");
    expect(auditWorkspaceSource).toContain('currentStrategyRevision={workspace.researchRun?.strategyRevision ?? "draft"}');
    expect(auditWorkspaceSource).toContain("liveExecutionBlocked={!workspace.execution.liveEnabled}");
    expect(auditWorkspaceSource).toContain("roundCount={agentCommitteeRounds.length}");
    expect(auditPanelSource).toContain("const latestRecord = records[0] ?? null;");
    expect(auditPanelSource).toContain("<AiReviewAuditComparison");
    expect(auditPanelSource).toContain("const selectedRecord = records.find((record) => record.aiReviewId === selectedRecordId) ?? latestRecord;");
    expect(auditPanelSource).toContain("latestRecord={selectedRecord}");
    expect(auditPanelSource).toContain("currentCitationCount={dossier.citations.length}");
    expect(auditPanelSource).toContain("currentStatus={dossier.status}");
    expect(auditPanelSource).toContain("roundCount={roundCount}");
    expect(cssBlock(".audit-ai-comparison")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".audit-ai-comparison-grid")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-comparison-row")).toContain(
      "grid-template-columns: minmax(96px, 0.58fr) minmax(0, 1fr) minmax(0, 1fr);"
    );
  });

  test("summarizes drift across saved AI review records in the audit trail", () => {
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function AgentEvidenceBoard");

    expect(appSource).toContain("buildAiReviewRecordDriftRows");
    expect(appSource).toContain("function AiReviewRecordDriftSummary");
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
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function AgentEvidenceBoard");
    const driftSummarySource = sourceBetween("function AiReviewRecordDriftSummary", "function AiReviewAuditTrailPanel");

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
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function AgentEvidenceBoard");
    const recordHistorySource = sourceBetween("function AiReviewRunRecordHistory", "function AiReviewAuditComparison");

    expect(auditPanelSource).toContain("records={records}");
    expect(auditPanelSource).toContain("totalRecords={totalHistoryRecords}");
    expect(auditPanelSource).toContain("query={historyQuery}");
    expect(auditPanelSource).toContain("pagination={historyPagination}");
    expect(recordHistorySource).toContain("totalRecords");
    expect(recordHistorySource).toContain("records.length !== totalRecords");
    expect(recordHistorySource).toContain("No matching records");
  });

  test("lets the audit workspace compare against a selected AI review record", () => {
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function AgentEvidenceBoard");
    const recordHistorySource = sourceBetween("function AiReviewRunRecordHistory", "function AiReviewAuditComparison");
    const comparisonSource = sourceBetween("function AiReviewAuditComparison", "function AiReviewRecordDriftSummary");

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
    const recordHistoryUsages = appSource.match(/<AiReviewRunRecordHistory[\s\S]*?\/>/g) ?? [];

    expect(recordHistoryUsages).toHaveLength(2);
    recordHistoryUsages.forEach((usage) => {
      expect(usage).toContain("query=");
      expect(usage).toContain("records=");
      expect(usage).toContain("totalRecords=");
    });
  });

  test("wires audit AI review history search to backend pagination", () => {
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function aiReviewDriftStatusText");
    const recordHistorySource = sourceBetween("function AiReviewRunRecordHistory", "function AiReviewAuditComparison");

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
    const recordHistorySource = sourceBetween("function AiReviewRunRecordHistory", "function AiReviewAuditComparison");

    expect(agentPanelSource).not.toContain("onSelectRecord={() => undefined}");
    expect(recordHistorySource).toContain("const isSelectable = Boolean(onSelectRecord);");
    expect(recordHistorySource).toContain("const RecordTag = isSelectable ? \"button\" : \"article\";");
    expect(recordHistorySource).toContain("onClick={isSelectable ? () => onSelectRecord?.(item.aiReviewId) : undefined}");
    expect(cssBlock(".ai-review-record")).toContain("cursor: default;");
    expect(cssBlock("button.ai-review-record")).toContain("cursor: pointer;");
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
    expect(
      hasCssBlockWith(".research-layout", [
        '"chart scanner"',
        '"chart readiness"',
        '"note handoff"',
        '"decision workflow"'
      ])
    ).toBe(true);
    expect(hasCssBlockWith(".market-layout", ['"chart data"', '"chart calendar"', '"research-ops research-ops"', '"scanner workflow"'])).toBe(true);
    expect(hasCssBlockWith(".backtest-layout", ['"backtest workflow"', '"history history"', '"ai ai"'])).toBe(true);
    expect(hasCssBlockWith(".agent-review-layout", ['"ai workflow"', '"decision history"'])).toBe(true);
    expect(cssBlock(".paper-layout")).toContain(
      "grid-template-columns: minmax(720px, 1.15fr) minmax(380px, 0.65fr) minmax(320px, 0.45fr);"
    );
    expect(hasCssBlockWith(".paper-layout", ['"execution portfolio broker"'])).toBe(true);
    expect(cssBlock(".workflow-backtest-panel")).toContain("grid-area: backtest;");
    expect(cssBlock(".workflow-nodes-panel")).toContain("grid-area: workflow;");
    expect(cssBlock(".workflow-agent-panel")).toContain("grid-area: ai;");
    expect(cssBlock(".workflow-handoff-panel")).toContain("grid-area: handoff;");
    expect(cssBlock(".workflow-scanner-panel .scanner-head")).toContain("display: none;");
    expect(cssBlock(".workflow-scanner-panel .scanner-row")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(appSource).toContain("function ResearchOpsQueuePanel");
    expect(appSource).toContain("buildResearchOpsQueueRows({");
    expect(appSource).toContain('className="workflow-research-ops-panel"');
    expect(appSource).toContain("pendingResearchOpsAction");
    expect(cssBlock(".workflow-research-ops-panel")).toContain("grid-area: research-ops;");
    expect(cssBlock(".research-ops-row")).toContain("grid-template-columns: minmax(110px, 0.8fr) minmax(120px, 0.75fr) minmax(180px, 1fr) auto;");
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
    expect(appSource).toContain("buildPortfolioBacktestReportMarkdown(portfolio, portfolioBacktestDraft)");
    expect(appSource).toContain("buildPortfolioBacktestReportAuditEvent({");
    expect(appSource).toContain("saveAuditEvent(quantCoreBaseUrl, portfolioReportAuditEvent)");
    expect(appSource).toContain("onExportPortfolioMarkdown={exportPortfolioBacktestMarkdown}");
    expect(appSource).toContain('i18n.t("portfolio.exportMarkdown")');
    expect(appSource).toContain("portfolio-report-action");
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

  test("lets the market work area refresh the selected cache context", () => {
    const marketWorkspaceSource = sourceBetween('if (activeWorkAreaId === "market")', 'if (activeWorkAreaId === "strategy")');
    const healthPanelSource = sourceBetween("function MarketDataHealthPanel", "function ResearchNotesPanel");

    expect(appSource).toContain("refreshSelectedMarketCache");
    expect(marketWorkspaceSource).toContain("activeCacheContext");
    expect(marketWorkspaceSource).toContain("refreshGuard={marketDataRefreshGuard}");
    expect(marketWorkspaceSource).toContain("onRefreshCache={refreshSelectedMarketCache}");
    expect(healthPanelSource).toContain("market-cache-refresh");
    expect(healthPanelSource).toContain("刷新当前缓存");
    expect(healthPanelSource).toContain("disabled={isRefreshingCache || isRefreshBlocked}");
    expect(cssBlock(".market-cache-refresh")).toContain("display: inline-flex;");
  });

  test("lets the market work area refresh watchlist cache as a batch", () => {
    const marketWorkspaceSource = sourceBetween('if (activeWorkAreaId === "market")', 'if (activeWorkAreaId === "strategy")');
    const healthPanelSource = sourceBetween("function MarketDataHealthPanel", "function ResearchNotesPanel");

    expect(appSource).toContain("refreshWatchlistMarketCache");
    expect(appSource).toContain("watchlistCacheSummary");
    expect(marketWorkspaceSource).toContain("onRefreshWatchlistCache={refreshWatchlistMarketCache}");
    expect(healthPanelSource).toContain("market-cache-bulk-refresh");
    expect(healthPanelSource).toContain("刷新自选缓存");
    expect(healthPanelSource).toContain("!workspace.watchlist.length || isRefreshBlocked");
    expect(cssBlock(".market-cache-actions")).toContain("display: flex;");
    expect(cssBlock(".market-cache-bulk-refresh")).toContain("display: inline-flex;");
  });

  test("renders provider cooldown guard for manual market data refresh", () => {
    expect(appSource).toContain("buildMarketDataRefreshGuard(");
    expect(appSource).toContain("settingsStatus.settings?.marketDataAdapters");
    expect(appSource).toContain("marketDataRefreshGuardLabel(i18n, refreshGuard)");
    expect(appSource).toContain("MarketDataRefreshOverrideControl");
    expect(appSource).toContain("buildMarketDataRefreshOverrideAuditEvent");
    expect(appSource).toContain("saveAuditEvent(quantCoreBaseUrl, auditEvent)");
    expect(appSource).toContain("marketDataRefreshOverrideAuditStatus");
    expect(appSource).toContain("marketDataRefreshOverride?.market === workspace.selectedInstrument.market");
    expect(appSource).toContain("setMarketDataRefreshOverride");
    expect(appSource).toContain("覆盖审计");
    expect(appSource).toContain("数据源冷却");
    expect(appSource).toContain("Provider cooldown");
    expect(appSource).toContain("Manual override");
    expect(cssBlock(".market-refresh-guard-note")).toContain("background:");
    expect(cssBlock(".market-refresh-guard-note")).toContain("margin: 0 0 8px;");
    expect(cssBlock(".market-refresh-override")).toContain("grid-template-columns:");
    expect(cssBlock(".market-refresh-override")).toContain("margin: 0 0 8px;");
    expect(cssBlock(".market-refresh-override-audit-status")).toContain("font-size:");
    expect(cssBlock(".market-refresh-override-audit-status.failed")).toContain("color:");
  });

  test("renders selected market calendar session status in the market work area", () => {
    const marketWorkspaceSource = sourceBetween('if (activeWorkAreaId === "market")', 'if (activeWorkAreaId === "strategy")');

    expect(appSource).toContain("loadMarketCalendarStatus");
    expect(appSource).toContain("const [marketCalendarState, setMarketCalendarState]");
    expect(appSource).toContain("refreshMarketCalendarStatus");
    expect(appSource).toContain("workspace.selectedInstrument.market");
    expect(marketWorkspaceSource).toContain("<MarketCalendarStatusCard");
    expect(marketWorkspaceSource).toContain("calendar={marketCalendarState.calendar}");
    expect(appSource).toContain("function MarketCalendarStatusCard");
    expect(appSource).toContain("className={`market-calendar-card ${status} ${className ?? \"\"}`}");
    expect(appSource).toContain("marketCalendarStatusLabel");
    expect(cssBlock(".market-calendar-card")).toContain("display: grid;");
    expect(cssBlock(".market-calendar-grid")).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
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
    expect(appSource).toContain("strategy-condition-select");
    expect(appSource).toContain("strategy-volume-toggle");
    expect(appSource).toContain("strategy-rsi-toggle");
    expect(appSource).toContain("strategy-generated-snapshot");
    expect(appSource).toContain("readinessGates={strategyReadinessGates}");
    expect(appSource).toContain("validationSource={strategyValidationState.source}");
    expect(appSource).toContain('className="strategy-readiness-list"');
    expect(appSource).toContain('className="strategy-validation-source"');
    expect(styles).toContain(".strategy-draft-grid");
    expect(styles).toContain(".strategy-template-grid");
    expect(styles).toContain(".strategy-template-card");
    expect(styles).toContain(".strategy-condition-select");
    expect(styles).toContain(".strategy-threshold-field");
    expect(styles).toContain(".strategy-volume-toggle");
    expect(styles).toContain(".strategy-rsi-toggle");
    expect(styles).toContain(".strategy-generated-snapshot");
    expect(styles).toContain(".strategy-readiness-gate");
    expect(styles).toContain(".strategy-validation-source");
  });

  test("preflights strategy readiness before launching the research pipeline", () => {
    const runPipelineSource = sourceBetween("const runPipeline = useCallback", "const replayRun = useCallback");

    expect(runPipelineSource).toContain("validateStrategySnapshot(quantCoreBaseUrl");
    expect(runPipelineSource).toContain('preflight.validation?.status === "blocked"');
    expect(runPipelineSource).toContain('setActiveWorkAreaId("strategy")');
    expect(runPipelineSource).toContain("setStrategyValidationState(preflight)");
    expect(runPipelineSource).toContain("Strategy preflight blocked");
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

    expect(appSource).toContain("loadStrategyLibrary");
    expect(appSource).toContain("saveStrategySnapshot");
    expect(appSource).toContain("buildStrategyVersionDiffRows");
    expect(appSource).toContain("buildStrategyGovernanceQueueRows");
    expect(appSource).toContain("pendingStrategyGovernanceAction");
    expect(appSource).toContain("runStrategyGovernanceAction");
    expect(appSource).toContain("saveCurrentStrategyVersion");
    expect(appSource).toContain("loadSavedStrategyVersion");
    expect(appSource).toContain("workspaceWithStrategyLibraryItem");
    expect(appSource).toContain('i18n.t("strategy.context")');
    expect(appSource).toContain('i18n.t("strategy.auditRun")');
    expect(appSource).toContain('i18n.t("strategy.diff")');
    expect(appSource).toContain('className="strategy-library-diff"');
    expect(appSource).toContain('i18n.t("strategy.loadedVersion")');
    expect(runPipelineSource).toContain("await refreshStrategyLibrary();");
    expect(appSource).toContain('className="strategy-library-list"');
    expect(appSource).toContain('className="strategy-library-actions"');
    expect(appSource).toContain('className="strategy-governance-queue"');
    expect(appSource).toContain("strategyGovernanceQueue.summary.totalRows");
    expect(appSource).toContain("strategyGovernanceActionLabel");
    expect(styles).toContain(".strategy-library-list");
    expect(styles).toContain(".strategy-library-card");
    expect(styles).toContain(".strategy-library-card small");
    expect(styles).toContain(".strategy-diff-chip.warning");
    expect(styles).toContain(".strategy-governance-queue");
    expect(styles).toContain(".strategy-governance-summary");
    expect(styles).toContain(".strategy-governance-row");
    expect(cssBlock(".strategy-governance-row")).toContain(
      "grid-template-columns: minmax(130px, 0.85fr) minmax(108px, 0.55fr) minmax(220px, 1fr) auto;"
    );
  });

  test("renders a compact portfolio paper ops queue across portfolio and execution workspaces", () => {
    expect(appSource).toContain("buildPortfolioPaperOpsQueueRows");
    expect(appSource).toContain("runPortfolioPaperOpsQueueAction");
    expect(appSource).toContain("PortfolioPaperOpsQueuePanel");
    expect(appSource).toContain('className="portfolio-paper-ops-queue"');
    expect(appSource).toContain("portfolioPaperOpsQueue={portfolioPaperOpsQueue}");
    expect(appSource).toContain("portfolioPaperOpsActionLabel");
    expect(styles).toContain(".portfolio-paper-ops-queue");
    expect(styles).toContain(".portfolio-paper-ops-summary");
    expect(styles).toContain(".portfolio-paper-ops-row");
    expect(cssBlock(".portfolio-paper-ops-row")).toContain(
      "grid-template-columns: minmax(120px, 0.8fr) minmax(120px, 0.7fr) minmax(240px, 1.4fr) auto;"
    );
  });

  test("renders a persistent research note panel for the selected context", () => {
    expect(appSource).toContain("loadResearchNote");
    expect(appSource).toContain("saveResearchNote");
    expect(appSource).toContain("ResearchNotesPanel");
    expect(appSource).toContain('className="workflow-note-panel"');
    expect(appSource).toContain('className="research-note-editor"');
    expect(styles).toContain(".workflow-note-panel");
    expect(styles).toContain(".research-note-editor");
    expect(styles).toContain(".research-note-meta");
  });

  test("renders the backtest lab as an auditable evidence report", () => {
    expect(appSource).toContain("buildBacktestReport(workspace)");
    expect(appSource).toContain("buildBacktestRunComparisonMatrixRows(runHistory");
    expect(appSource).toContain("buildBacktestRunComparisonMatrixSummary(backtestRunComparisonMatrixRows)");
    expect(appSource).toContain("filterBacktestRunComparisonMatrixRows");
    expect(appSource).toContain("buildBacktestReportMarkdown(workspace, runHistory)");
    expect(appSource).toContain("buildBacktestReportAuditEvent({");
    expect(appSource).toContain("saveAuditEvent(quantCoreBaseUrl, backtestReportAuditEvent)");
    expect(appSource).toContain('import { StrategyExperimentSection, isStrategyExperimentDraftValid } from "./components/StrategyExperimentSection";');
    expect(appSource).toContain("<BacktestReportPanel");
    expect(appSource).toContain("<StrategyExperimentSection");
    expect(appSource).toContain("refreshStrategyExperiments");
    expect(appSource).toContain("runStrategyExperiment");
    expect(appSource).toContain("inspectStrategyExperiment");
    expect(appSource).toContain("replayStrategyExperiment");
    expect(appSource).toContain("exportStrategyExperimentJson");
    expect(appSource).toContain("loadStrategyExperimentCandidate");
    expect(appSource).toContain("const strategyExperimentUsableSourceKey =");
    expect(appSource).toContain("researchRunContextBinding.canUseRun && workspace.researchRun");
    expect(appSource).toContain("strategyExperimentSourceKeyRef");
    expect(appSource).toContain("strategyExperimentRequestGenerationRef");
    expect(appSource).toContain("strategyExperimentRequestIsCurrent");
    expect(appSource).toContain("strategyExperimentMatchesSourceKey");
    expect(appSource).toContain("active={visibleStrategyExperimentActive}");
    expect(appSource).toContain("dimensions={visibleStrategyExperimentDimensions}");
    expect(appSource).toContain("history={visibleStrategyExperimentHistory}");
    expect(appSource).toContain("strategyExperimentWorkspaceRef.current !== capturedWorkspace");
    expect(appSource).toContain("strategyExperimentActiveRef.current !== capturedActive");
    const candidateLoadSource = sourceBetween(
      "const loadStrategyExperimentCandidate = useCallback",
      "const submitPaperExecution = useCallback"
    );
    expect(candidateLoadSource).toContain("catch (candidateError)");
    expect(candidateLoadSource).toContain("strategyExperimentRequestIsCurrent");
    const experimentExportSource = sourceBetween(
      "const exportStrategyExperimentJson = useCallback",
      "const loadStrategyExperimentCandidate = useCallback"
    );
    expect(experimentExportSource).toContain("try {");
    expect(experimentExportSource).toContain("catch (exportError)");
    expect(experimentExportSource).toContain("finally {");
    expect(experimentExportSource).toContain("anchor?.remove()");
    expect(experimentExportSource).toContain("URL.revokeObjectURL(objectUrl)");
    expect(strategyExperimentSectionSource).toContain("export function isStrategyExperimentDraftValid");
    expect(strategyExperimentSectionSource).toContain("Number.isFinite");
    expect(strategyExperimentSectionSource).toContain("isStrategyExperimentDraftValid(dimensions, guardrails, walkForward)");
    expect(appSource).not.toContain("buildBacktestParameterScanRows");
    expect(appSource).not.toContain("workspaceWithBacktestParameterCandidate");
    expect(appSource).not.toContain('className="parameter-scan-table"');
    expect(appSource).toContain("onExportMarkdown={exportBacktestReportMarkdown}");
    expect(appSource).toContain('className="backtest-report"');
    expect(appSource).toContain('className="report-export-button"');
    expect(appSource).toContain('className="backtest-report-hero"');
    expect(appSource).toContain('className="backtest-benchmark-strip"');
    expect(appSource).toContain('className="backtest-report-grid"');
    expect(appSource).toContain('className="backtest-report-section"');
    expect(appSource).toContain("experimentSection={");
    expect(appSource).toContain("buildBacktestEvidenceCards(workspace)");
    expect(appSource).toContain("buildBacktestReadinessGates(workspace)");
    expect(appSource).toContain("evidenceCards={backtestEvidenceCards}");
    expect(appSource).toContain("readinessGates={backtestReadinessGates}");
    expect(appSource).toContain("runComparisonMatrixRows={backtestRunComparisonMatrixRows}");
    expect(appSource).toContain("runComparisonMatrixSummary={backtestRunComparisonMatrixSummary}");
    expect(appSource).toContain('className="backtest-evidence-grid"');
    expect(appSource).toContain('className="backtest-run-comparison-matrix"');
    expect(appSource).toContain('className="backtest-readiness-list"');
    expect(appSource).toContain('className="backtest-diagnostic-strip"');
    expect(styles).toContain(".backtest-evidence-grid");
    expect(styles).toContain(".backtest-readiness-list");
    expect(styles).toContain(".backtest-diagnostic-strip");
    expect(styles).toContain(".backtest-report");
    expect(styles).toContain(".backtest-report-hero");
    expect(styles).toContain(".backtest-benchmark-strip");
    expect(styles).toContain(".backtest-report-grid");
    expect(styles).toContain(".backtest-run-comparison-matrix");
    expect(styles).toContain(".backtest-run-comparison-row");
    expect(styles).toContain(".strategy-experiment-config");
    expect(styles).toContain(".strategy-experiment-history");
    expect(styles).toContain(".strategy-experiment-candidates");
    expect(styles).toContain("@media (max-width: 860px)");
    expect(styles).not.toContain(".parameter-scan-");
    expect(styles).toContain(".report-export-button");
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
    expect(appSource).toContain("buildAiReviewReportMarkdown(workspace)");
    expect(appSource).toContain("exportAiReviewMarkdown");
    expect(appSource).toContain('i18n.t("aiReview.exportMarkdown")');
    expect(appSource).toContain("<AiReviewDossierBoard");
    expect(appSource).toContain('"benchmark": "基准 Alpha"');
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

  test("renders portfolio paper order approvals as operator actions", () => {
    expect(appSource).toContain("loadPortfolioPaperOrderApprovals");
    expect(appSource).toContain("recordPortfolioPaperOrderApproval");
    expect(appSource).toContain("buildPortfolioPaperOrderApprovalRows");
    expect(appSource).toContain("portfolioPaperOrderApprovalRows");
    expect(appSource).toContain("onApprovePortfolioOrder");
    expect(appSource).toContain("onRejectPortfolioOrder");
    expect(appSource).toContain('className="portfolio-order-approval"');
    expect(appSource).toContain('className={`portfolio-order-approval-row');
    expect(styles).toContain(".portfolio-order-approval");
    expect(styles).toContain(".portfolio-order-approval-actions");
  });

  test("renders portfolio paper order simulations as paper-only fills", () => {
    expect(appSource).toContain("loadPortfolioPaperOrderSimulations");
    expect(appSource).toContain("recordPortfolioPaperOrderSimulation");
    expect(appSource).toContain("portfolioPaperOrderSimulations");
    expect(appSource).toContain("onSimulatePortfolioOrder");
    expect(appSource).toContain("simulatingPortfolioOrderId");
    expect(appSource).toContain('className="portfolio-order-simulation"');
    expect(appSource).toContain('className="portfolio-order-simulation-list"');
    expect(styles).toContain(".portfolio-order-simulation");
    expect(styles).toContain(".portfolio-order-simulation-list");
  });

  test("renders controlled batch paper order simulation actions", () => {
    expect(appSource).toContain("recordPortfolioPaperOrderBatchSimulation");
    expect(appSource).toContain("simulatePortfolioPaperOrderBatch");
    expect(appSource).toContain("isSimulatingPortfolioPaperOrderBatch");
    expect(appSource).toContain("onSimulatePortfolioOrderBatch");
    expect(appSource).toContain('className="portfolio-simulation-route-batch-action"');
    expect(styles).toContain(".portfolio-simulation-route-batch-action");
  });

  test("renders the latest portfolio paper fill as a timeline focus cue", () => {
    expect(appSource).toContain("buildPortfolioPaperOrderLatestSimulationSummary");
    expect(appSource).toContain("portfolioPaperOrderSimulations");
    expect(appSource).toContain("portfolioPaperOrderReplay");
    expect(appSource).toContain("portfolioPaperOrderStateHistories");
    expect(appSource).toContain("portfolioOrderLatestSimulationSummary");
    expect(appSource).toContain("setPortfolioOrderFocusedStateId");
    expect(appSource).toContain("const focusedPortfolioOrderStateRef = useRef<HTMLElement | null>(null);");
    expect(appSource).toContain('focusedPortfolioOrderStateRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });');
    expect(appSource).toContain("ref={portfolioOrderFocusedStateId === row.id ? focusedPortfolioOrderStateRef : undefined}");
    expect(appSource).toContain("onFocusPortfolioOrderStateAuditQuery");
    expect(appSource).toContain('className="portfolio-order-state-audit-action"');
    expect(appSource).toContain("onClick={() => onFocusPortfolioOrderStateAuditQuery(row.focusQuery)}");
    expect(appSource).toContain('className={`portfolio-order-latest-simulation ${portfolioOrderLatestSimulationSummary.tone}`}');
    expect(appSource).toContain('className={`portfolio-order-state-row ${row.tone}${');
    expect(styles).toContain(".portfolio-order-latest-simulation");
    expect(styles).toContain(".portfolio-order-latest-simulation-action");
    expect(styles).toContain(".portfolio-order-state-audit-action");
    expect(styles).toContain(".portfolio-order-state-row.focused");
  });

  test("renders portfolio paper simulation route checks before fills", () => {
    expect(appSource).toContain("buildPortfolioPaperOrderSimulationRouteRows");
    expect(appSource).toContain("portfolioPaperOrderSimulationRouteRows");
    expect(appSource).toContain("portfolioOrderSimulationRouteRows");
    expect(appSource).toContain('className="portfolio-simulation-route"');
    expect(appSource).toContain('className={`portfolio-simulation-route-row ${row.tone}${');
    expect(appSource).toContain("row.stateEventId && portfolioOrderFocusedStateId === row.stateEventId");
    expect(appSource).toContain("setPortfolioOrderFocusedStateId(row.stateEventId)");
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
    expect(appSource).toContain('className="execution-grid portfolio-replay-grid"');
    expect(appSource).toContain('className="portfolio-order-replay"');
    expect(appSource).toContain('className="portfolio-order-replay-table"');
    expect(styles).toContain(".portfolio-replay-grid");
    expect(styles).toContain(".portfolio-order-replay");
    expect(styles).toContain(".portfolio-order-replay-row");
  });

  test("renders portfolio paper order state history as a compact timeline", () => {
    expect(appSource).toContain("loadPortfolioPaperOrderStateHistory");
    expect(appSource).toContain("buildPortfolioPaperOrderStateHistoryRows(portfolioPaperOrderStateHistories)");
    expect(appSource).toContain("portfolioOrderStateHistoryRows");
    expect(appSource).toContain('className="portfolio-order-state-history"');
    expect(appSource).toContain('className={`portfolio-order-state-row');
    expect(styles).toContain(".portfolio-order-state-history");
    expect(styles).toContain(".portfolio-order-state-row");
  });

  test("renders paper execution account summaries from persisted execution records", () => {
    expect(appSource).toContain("buildPaperExecutionSummaryTiles(workspace, activePaperExecutionRecord)");
    expect(appSource).toContain("buildPaperPositionRows(workspace, activePaperExecutionRecord)");
    expect(appSource).toContain("summaryTiles={paperExecutionSummaryTiles}");
    expect(appSource).toContain("paperExecutionTileValue");
    expect(appSource).not.toContain('value={i18n.t("execution.paperAccount")}');
    expect(cssBlock(".execution-tile p")).toContain("overflow-wrap: anywhere;");
    expect(cssBlock(".execution-tile.positive")).toContain("border-left-color: #4cc9ad;");
    expect(cssBlock(".execution-tile.warning")).toContain("border-left-color: #e8be62;");
  });

  test("restores paper execution context from a copied P0 execution evidence link", () => {
    const paperDeepLinkSource = sourceBetween("function resolveInitialPaperExecutionDeepLink()", "function resolveInitialWatchlistCacheRefreshRunId()");
    const loadPaperDeepLinkSource = sourceBetween("const loadPaperExecutionDeepLink = useCallback(", "const replayRun = useCallback(");

    expect(appSource).toContain("interface InitialPaperExecutionDeepLink");
    expect(appSource).toContain("type PaperExecutionDeepLinkStatus = InitialPaperExecutionDeepLink");
    expect(appSource).toContain("function resolveInitialPaperExecutionDeepLink(): InitialPaperExecutionDeepLink | null");
    expect(appSource).toContain('if (params.get("paperExecution")?.trim())');
    expect(paperDeepLinkSource).toContain('const executionId = params.get("paperExecution")?.trim();');
    expect(paperDeepLinkSource).toContain('const runId = params.get("runId")?.trim();');
    expect(paperDeepLinkSource).toContain("return { executionId, runId };");
    expect(appSource).toContain("const initialPaperExecutionDeepLink = resolveInitialPaperExecutionDeepLink();");
    expect(appSource).toContain("const initialPaperExecutionDeepLinkRef = useRef(initialPaperExecutionDeepLink);");
    expect(appSource).toContain("const [paperExecutionDeepLinkStatus, setPaperExecutionDeepLinkStatus]");
    expect(loadPaperDeepLinkSource).toContain("const detail = await loadResearchRunDetail(quantCoreBaseUrl, deepLink.runId);");
    expect(loadPaperDeepLinkSource).toContain('setPaperExecutionDeepLinkStatus({ ...deepLink, status: "loading", error: null });');
    expect(loadPaperDeepLinkSource).toContain("loadLatestResearchRunPaperExecution(quantCoreBaseUrl, auditedRun.runId)");
    expect(loadPaperDeepLinkSource).toContain("loadResearchRunPromotion(quantCoreBaseUrl, auditedRun.runId)");
    expect(loadPaperDeepLinkSource).toContain("paperHistory.execution?.executionId !== deepLink.executionId");
    expect(loadPaperDeepLinkSource).toContain('setPaperExecutionDeepLinkStatus({ ...deepLink, status: "failed", error: message });');
    expect(loadPaperDeepLinkSource).toContain('setPaperExecutionDeepLinkStatus({ ...deepLink, status: "loaded", error: null });');
    expect(loadPaperDeepLinkSource).toContain('setActiveWorkAreaId("execution");');
    expect(loadPaperDeepLinkSource).toContain('setActiveLoopStepId("paper");');
    expect(loadPaperDeepLinkSource).toContain("workspaceFromResearchRunAudit(current.workspace, auditedRun)");
    expect(appSource).toContain('className={`p0-paper-deep-link ${paperExecutionDeepLinkStatus.status}`}');
    expect(appSource).toContain("paperExecutionDeepLinkStatusLabel(i18n, paperExecutionDeepLinkStatus.status)");
    expect(styles).toContain(".p0-paper-deep-link");
    expect(styles).toContain(".p0-paper-deep-link.failed");
    expect(appSource).toContain("const deepLink = initialPaperExecutionDeepLinkRef.current;");
    expect(appSource).toContain("initialPaperExecutionDeepLinkRef.current = null;");
    expect(appSource).toContain("void loadPaperExecutionDeepLink(deepLink);");
  });

  test("gates paper execution actions by audit binding with Golden Path rebind recovery", () => {
    expect(appSource).toContain("buildResearchRunContextBinding");
    expect(appSource).toContain("const researchRunContextBinding = buildResearchRunContextBinding(workspace)");
    expect(appSource).toContain("const currentResearchRunId = researchRunContextBinding.canUseRun ? workspace.researchRun?.runId : null");
    expect(appSource).toContain("const canRebindGoldenPathRun = Boolean(goldenPath?.latestRunId) && !researchRunContextBinding.canUseRun;");
    expect(appSource).toContain("!canRebindGoldenPathRun &&");
    expect(appSource).toContain('riskApprovalSummary.status === "blocked"');
    expect(appSource).not.toContain("return isSubmittingPaperExecution || !workspace.researchRun?.runId");
  });

  test("renders execution promotion readiness as a separate queue after paper execution", () => {
    expect(appSource).toContain("buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows");
    expect(appSource).toContain("buildPreLiveReadinessChecklist(promotionReadiness, {");
    expect(appSource).toContain("paperExecutionReplayGate");
    expect(appSource).toContain("loadResearchRunPromotion(quantCoreBaseUrl");
    expect(appSource).toContain("setPromotionCandidateRecord(result.promotion ?? null)");
    expect(appSource).toContain("activePromotionCandidateRecord ??");
    expect(appSource).toContain("<PromotionQueuePanel");
    expect(appSource).toContain("readiness={promotionReadiness}");
    expect(appSource).toContain("preLiveChecklist={preLiveReadinessChecklist}");
    expect(appSource).toContain('className={`pre-live-checklist');
    expect(appSource).toContain('className="pre-live-checklist-row-list"');
    expect(appSource).toContain('className="promotion-stage-list"');
    expect(appSource).toContain('className={`promotion-stage');
    expect(styles).toContain(".pre-live-checklist");
    expect(styles).toContain(".pre-live-checklist-row-list");
    expect(styles).toContain(".pre-live-checklist-row");
    expect(styles).toContain(".promotion-queue");
    expect(styles).toContain(".promotion-stage-list");
    expect(styles).toContain(".promotion-stage");
    expect(cssBlock(".workflow-promotion-panel")).toContain("grid-area: promotion;");
    expect(hasCssBlockWith(".execution-layout", ['"execution broker"', '"promotion p2-acceptance"', '"promotion pre-live"'])).toBe(true);
  });

  test("renders P2 pre-live acceptance readback in execution and audit workspaces", () => {
    expect(appSource).toContain("loadP2PreLiveAcceptanceLatest(quantCoreBaseUrl)");
    expect(appSource).toContain("const p2PreLiveAcceptanceSummary = useMemo(");
    expect(appSource).toContain("buildP2PreLiveAcceptanceSummary(p2PreLiveAcceptanceLatestState.acceptance)");
    expect(appSource).toContain("<P2PreLiveAcceptancePanel");
    expect(appSource).toContain('className="workflow-p2-pre-live-acceptance-panel"');
    expect(appSource).toContain('className="workflow-p2-pre-live-acceptance-audit-panel"');
    expect(appSource).toContain('className={`p2-pre-live-acceptance ${summary.tone}`}');
    expect(appSource).toContain("p2PreLiveAcceptanceSummaryHeadline(i18n, p2PreLiveAcceptanceSummary)");
    expect(styles).toContain(".workflow-p2-pre-live-acceptance-panel");
    expect(styles).toContain(".workflow-p2-pre-live-acceptance-audit-panel");
    expect(styles).toContain(".p2-pre-live-acceptance");
    expect(styles).toContain(".p2-pre-live-acceptance-meta");
    expect(styles).toContain(".p2-pre-live-acceptance-actions");
    expect(cssBlock(".workflow-p2-pre-live-acceptance-panel")).toContain("grid-area: p2-acceptance;");
    expect(cssBlock(".workflow-p2-pre-live-acceptance-audit-panel")).toContain("grid-area: p2-acceptance;");
    expect(hasCssBlockWith(".execution-layout", ['"promotion p2-acceptance"', '"promotion pre-live"'])).toBe(true);
    expect(hasCssBlockWith(".audit-layout", ['"p2-acceptance p2-acceptance"', '"acceptance acceptance"'])).toBe(true);
  });

  test("renders a pre-live runbook summary before any live route can unlock", () => {
    expect(appSource).toContain("buildExecutionAdapterPreLiveRunbookSummary({");
    expect(appSource).toContain("buildExecutionAdapterPreLiveRunbookMarkdown");
    expect(appSource).toContain("buildExecutionAdapterPreLiveRunbookAuditEvent");
    expect(appSource).toContain("buildPreLiveRunbookAuditCoverage");
    expect(appSource).toContain("const executionAdapterPreLiveRunbook = buildExecutionAdapterPreLiveRunbookSummary");
    expect(appSource).toContain("executionAdapterPreLiveRunbookAuditCoverage");
    expect(appSource).toContain("copyExecutionAdapterPreLiveRunbook");
    expect(appSource).toContain("downloadExecutionAdapterPreLiveRunbook");
    expect(appSource).toContain("recordExecutionAdapterPreLiveRunbook");
    expect(appSource).toContain("focusExecutionAdapterPreLiveRunbookAudit");
    expect(appSource).toContain("copyExecutionAdapterPreLiveRunbookAuditLink");
    expect(appSource).toContain("pre_live_runbook_report");
    expect(appSource).toContain("<PreLiveRunbookPanel");
    expect(appSource).toContain('className="workflow-pre-live-runbook-panel"');
    expect(appSource).toContain("auditCoverage={executionAdapterPreLiveRunbookAuditCoverage}");
    expect(appSource).toContain("onCopy={copyExecutionAdapterPreLiveRunbook}");
    expect(appSource).toContain("onDownload={downloadExecutionAdapterPreLiveRunbook}");
    expect(appSource).toContain("onFocusAudit={focusExecutionAdapterPreLiveRunbookAudit}");
    expect(appSource).toContain("onCopyAuditLink={copyExecutionAdapterPreLiveRunbookAuditLink}");
    expect(appSource).toContain("onRecordAudit={recordExecutionAdapterPreLiveRunbook}");
    expect(appSource).toContain("runbook={executionAdapterPreLiveRunbook}");
    expect(appSource).toContain("isRecordingAudit={isRecordingPreLiveRunbook}");
    expect(appSource).toContain('className="pre-live-runbook-actions"');
    expect(appSource).toContain('className={`pre-live-runbook ${runbook.status}`}');
    expect(appSource).toContain('className={`pre-live-runbook-audit ${auditCoverage.status}`}');
    expect(appSource).toContain('className="pre-live-runbook-audit-meta"');
    expect(appSource).toContain("preLiveRunbookAuditCoverageMetaLabel(i18n, auditCoverage)");
    expect(appSource).toContain("coverage.mismatchLabel ? preLiveRunbookMismatchLabel(i18n, coverage.mismatchLabel) : \"\"");
    expect(appSource).toContain("coverage.currentGateLabel && coverage.currentGateLabel !== coverage.gateLabel");
    expect(appSource).toContain('auditCoverage.status !== "matched" && onRecordAudit');
    expect(appSource).toContain("{isRecordingAudit ? <Timer size={12} /> : <Save size={12} />}");
    expect(appSource).toContain("preLiveRunbookAuditRecordActionLabel(i18n, auditCoverage.status, isRecordingAudit)");
    expect(appSource).toContain('className="pre-live-runbook-audit-actions"');
    expect(appSource).toContain("{i18n.locale === \"zh-CN\" ? \"复制审计链接\" : \"Copy audit link\"}");
    expect(appSource).toContain('className={`pre-live-runbook-row ${row.tone}`}');
    expect(appSource).toContain("preLiveRunbookStepLabel(i18n, row)");
    expect(styles).toContain(".pre-live-runbook");
    expect(styles).toContain(".pre-live-runbook-actions");
    expect(styles).toContain(".pre-live-runbook-audit");
    expect(styles).toContain(".pre-live-runbook-audit-meta");
    expect(styles).toContain(".pre-live-runbook-audit-actions");
    expect(styles).toContain(".pre-live-runbook-row");
    expect(cssBlock(".workflow-pre-live-runbook-panel")).toContain("grid-area: pre-live;");
    expect(hasCssBlockWith(".execution-layout", ['"execution broker"', '"promotion p2-acceptance"', '"promotion pre-live"'])).toBe(true);
  });

  test("renders operator runbook summary from pre-live gates before adapter runbook", () => {
    expect(appSource).toContain("buildOperatorRunbookAuditCoverage(");
    expect(appSource).toContain("buildOperatorRunbookSummary({");
    expect(appSource).toContain("p2PreLiveAcceptance: p2PreLiveAcceptanceSummary");
    expect(appSource).toContain("paperExecutionReplayGate");
    expect(appSource).toContain("preLiveChecklist: preLiveReadinessChecklist");
    expect(appSource).toContain("operatorRunbookAuditCoverage");
    expect(appSource).toContain("<OperatorRunbookPanel");
    expect(appSource).toContain("auditCoverage={operatorRunbookAuditCoverage}");
    expect(appSource).toContain('className="workflow-operator-runbook-panel"');
    expect(appSource).toContain("isCopied={copiedOperatorRunbook}");
    expect(appSource).toContain("isRecordingAudit={isRecordingOperatorRunbook}");
    expect(appSource).toContain("onCopy={copyOperatorRunbook}");
    expect(appSource).toContain("onCopyAuditLink={copyOperatorRunbookAuditLink}");
    expect(appSource).toContain("onDownload={downloadOperatorRunbook}");
    expect(appSource).toContain("onFocusAudit={focusOperatorRunbookAudit}");
    expect(appSource).toContain("onRecordAudit={recordOperatorRunbook}");
    expect(appSource).toContain("runbook={operatorRunbookSummary}");
    expect(appSource).toContain("function OperatorRunbookPanel");
    expect(appSource).toContain('className="operator-runbook-actions"');
    expect(appSource).toContain('className={`operator-runbook ${runbook.tone}`}');
    expect(appSource).toContain('className={`operator-runbook-audit ${auditCoverage.status}`}');
    expect(appSource).toContain('className="operator-runbook-audit-actions"');
    expect(appSource).toContain('className="operator-runbook-controls"');
    expect(appSource).toContain('className="operator-runbook-sections"');
    expect(appSource).toContain('className={`operator-runbook-section ${section.tone}`}');
    expect(styles).toContain(".workflow-operator-runbook-panel");
    expect(styles).toContain(".operator-runbook");
    expect(styles).toContain(".operator-runbook-actions");
    expect(styles).toContain(".operator-runbook-audit");
    expect(styles).toContain(".operator-runbook-audit-actions");
    expect(styles).toContain(".operator-runbook-controls");
    expect(styles).toContain(".operator-runbook-sections");
    expect(styles).toContain(".operator-runbook-section");
    expect(cssBlock(".workflow-operator-runbook-panel")).toContain("grid-area: operator-runbook;");
    expect(
      hasCssBlockWith(".execution-layout", [
        '"promotion p2-acceptance"',
        '"promotion operator-runbook"',
        '"promotion pre-live"'
      ])
    ).toBe(true);
  });

  test("renders adapter chain health rollups in execution and settings workspaces", () => {
    expect(appSource).toContain("const executionAdapterChainHealthRollups = buildExecutionAdapterChainHealthRollups({");
    expect(appSource).toContain("brokerRows: brokerAdapterRows");
    expect(appSource).toContain("<AdapterChainHealthPanel");
    expect(appSource).toContain('className="workflow-adapter-chain-health-panel"');
    expect(appSource).toContain("rollups={executionAdapterChainHealthRollups}");
    expect(appSource).toContain("adapterChainHealthRollups={executionAdapterChainHealthRollups}");
    expect(appSource).toContain("function AdapterChainHealthPanel");
    expect(appSource).toContain("function AdapterChainHealthList");
    expect(appSource).toContain('className="settings-adapter-chain-health"');
    expect(appSource).toContain('className="adapter-chain-health"');
    expect(appSource).toContain('className={`adapter-chain-health-row ${rollup.tone}`}');
    expect(appSource).toContain('className={`adapter-chain-health-stage ${stage.status}`}');
    expect(styles).toContain(".workflow-adapter-chain-health-panel");
    expect(styles).toContain(".settings-adapter-chain-health");
    expect(styles).toContain(".adapter-chain-health");
    expect(styles).toContain(".adapter-chain-health-row");
    expect(styles).toContain(".adapter-chain-health-meta");
    expect(styles).toContain(".adapter-chain-health-stages");
    expect(cssBlock(".workflow-adapter-chain-health-panel")).toContain("grid-area: adapter-chain;");
    expect(
      hasCssBlockWith(".execution-layout", [
        '"execution broker"',
        '"promotion adapter-chain"',
        '"promotion p2-acceptance"',
        '"promotion pre-live"'
      ])
    ).toBe(true);
  });

  test("renders paper execution replay gate before pre-live promotion", () => {
    expect(appSource).toContain("const paperExecutionReplayGate = buildPaperExecutionReplayGate({");
    expect(appSource).toContain("currentRunId: currentResearchRunId");
    expect(appSource).toContain("paperExecution: activePaperExecutionRecord");
    expect(appSource).toContain("<PaperExecutionReplayGatePanel");
    expect(appSource).toContain('className="workflow-paper-replay-gate-panel"');
    expect(appSource).toContain("gate={paperExecutionReplayGate}");
    expect(appSource).toContain("function PaperExecutionReplayGatePanel");
    expect(appSource).toContain('className={`paper-replay-gate ${gate.tone}`}');
    expect(appSource).toContain('className="paper-replay-gate-items"');
    expect(appSource).toContain('className={`paper-replay-gate-item ${item.tone}`}');
    expect(styles).toContain(".workflow-paper-replay-gate-panel");
    expect(styles).toContain(".paper-replay-gate");
    expect(styles).toContain(".paper-replay-gate-summary");
    expect(styles).toContain(".paper-replay-gate-metrics");
    expect(styles).toContain(".paper-replay-gate-items");
    expect(cssBlock(".workflow-paper-replay-gate-panel")).toContain("grid-area: replay-gate;");
    expect(
      hasCssBlockWith(".execution-layout", [
        '"execution broker"',
        '"replay-gate replay-manifest"',
        '"promotion adapter-chain"',
        '"promotion p2-acceptance"'
      ])
    ).toBe(true);
  });

  test("renders P2 paper replay manifest readback next to the replay gate", () => {
    expect(appSource).toContain("loadP2PaperReplayLatest(quantCoreBaseUrl)");
    expect(appSource).toContain("const p2PaperReplaySummary = useMemo(");
    expect(appSource).toContain("buildP2PaperReplaySummary(p2PaperReplayLatestState.replay)");
    expect(appSource).toContain("<P2PaperReplayManifestPanel");
    expect(appSource).toContain('className="workflow-p2-paper-replay-panel"');
    expect(appSource).toContain('className={`p2-paper-replay ${summary.tone}`}');
    expect(appSource).toContain("p2PaperReplaySummaryHeadline(i18n, p2PaperReplaySummary)");
    expect(styles).toContain(".workflow-p2-paper-replay-panel");
    expect(styles).toContain(".p2-paper-replay");
    expect(styles).toContain(".p2-paper-replay-meta");
    expect(styles).toContain(".p2-paper-replay-actions");
    expect(cssBlock(".workflow-p2-paper-replay-panel")).toContain("grid-area: replay-manifest;");
    expect(
      hasCssBlockWith(".execution-layout", [
        '"execution broker"',
        '"replay-gate replay-manifest"',
        '"promotion adapter-chain"',
        '"promotion p2-acceptance"'
      ])
    ).toBe(true);
  });

  test("renders P2 readiness evidence coverage between acceptance and operator runbook", () => {
    const panelSource = sourceBetween("function P2ReadinessEvidenceCoveragePanel", "function P2ReadinessAcceptancePanel");

    expect(appSource).toContain("buildP2ReadinessEvidenceCoverage({");
    expect(appSource).toContain("operatorRunbookAuditCoverage,");
    expect(appSource).toContain("p2ManifestChainPreflight: p2ManifestChainPreflightSummary");
    expect(appSource).toContain("p2ManifestChainPreflightReviewAuditRow: latestP2ManifestChainPreflightReviewAuditRow");
    expect(appSource).toContain("p2PaperReplay: p2PaperReplaySummary");
    expect(appSource).toContain("p2PreLiveAcceptance: p2PreLiveAcceptanceSummary");
    expect(appSource).toContain("preLiveChecklist: preLiveReadinessChecklist");
    expect(appSource).toContain('"p2-manifest-chain-preflight-review": "P2 preflight review"');
    expect(appSource).toContain('"p2-manifest-chain-preflight-review": "P2 预检复核"');
    expect(appSource).toContain("const openP2ReadinessEvidenceCoverage = useCallback");
    expect(appSource).toContain('case "paper-replay-manifest":');
    expect(appSource).toContain('"P2 paper replay evidence selected"');
    expect(appSource).toContain('case "p2-acceptance-manifest":');
    expect(appSource).toContain('"P2 pre-live acceptance evidence selected"');
    expect(appSource).toContain('case "operator-runbook-audit":');
    expect(appSource).toContain("focusOperatorRunbookAudit();");
    expect(appSource).toContain('case "p2-manifest-chain-preflight-review":');
    expect(appSource).toContain("openP2ManifestChainPreflightReviewAudit();");
    expect(appSource).toContain('case "pre-live-checklist":');
    expect(appSource).toContain('"P2 pre-live checklist evidence selected"');
    expect(appSource).toContain('case "adapter-chain-health":');
    expect(appSource).toContain('"P2 adapter chain evidence selected"');
    expect(appSource).toContain('case "safety-boundary":');
    expect(appSource).toContain('"P2 safety boundary evidence selected"');
    expect(appSource).toContain("<P2ReadinessEvidenceCoveragePanel");
    expect(appSource).toContain("onOpenEvidence={openP2ReadinessEvidenceCoverage}");
    expect(appSource).toContain('className="workflow-p2-evidence-coverage-panel"');
    expect(appSource).toContain('className={`p2-evidence-coverage ${coverage.tone}`}');
    expect(appSource).toContain('className="p2-evidence-coverage-grid"');
    expect(appSource).toContain('className={`p2-evidence-coverage-row ${row.tone}`}');
    expect(panelSource).toContain("onOpenEvidence");
    expect(panelSource).toContain("onClick={() => onOpenEvidence(row)}");
    expect(panelSource).toContain("p2EvidenceCoverageRowActionIcon(row)");
    expect(panelSource).toContain("p2EvidenceCoverageRowActionLabel(i18n, row)");
    expect(appSource).toContain('case "manifest":');
    expect(appSource).toContain('"清单"');
    expect(appSource).toContain('"Manifest"');
    expect(appSource).toContain('case "audit":');
    expect(appSource).toContain('"审计"');
    expect(appSource).toContain('"Audit"');
    expect(appSource).toContain('case "local-state":');
    expect(appSource).toContain('"工作区"');
    expect(appSource).toContain('"Workspace"');
    expect(appSource).toContain('case "safety-boundary":');
    expect(appSource).toContain('"边界"');
    expect(appSource).toContain('"Boundary"');
    expect(styles).toContain(".workflow-p2-evidence-coverage-panel");
    expect(styles).toContain(".p2-evidence-coverage");
    expect(styles).toContain(".p2-evidence-coverage-grid");
    expect(styles).toContain(".p2-evidence-coverage-row");
    expect(cssBlock(".p2-evidence-coverage-row-action")).toContain("display: inline-flex;");
    expect(cssBlock(".workflow-p2-evidence-coverage-panel")).toContain("grid-area: p2-coverage;");
    expect(
      hasCssBlockWith(".execution-layout", [
        '"promotion p2-acceptance"',
        '"promotion p2-coverage"',
        '"promotion operator-runbook"'
      ])
    ).toBe(true);
  });

  test("renders P2 top-level readiness acceptance gate before the evidence matrix", () => {
    const panelSource = sourceBetween("function P2ReadinessAcceptancePanel", "function P2ManifestChainPreflightPanel");

    expect(appSource).toContain("loadP2ReadinessAcceptanceLatest");
    expect(appSource).toContain("generateP2ReadinessAcceptance");
    expect(appSource).toContain("initialP2ReadinessAcceptanceLatestState");
    expect(appSource).toContain("p2ReadinessAcceptanceAuditEvent");
    expect(appSource).toContain("const latestP2ReadinessAcceptanceGeneratedAuditRow = useMemo");
    expect(appSource).toContain("const p2ReadinessAcceptanceGeneratedAuditEventReference = useMemo");
    expect(appSource).toContain("context: p2ReadinessAcceptanceAuditContext");
    expect(appSource).toContain("const p2ReadinessAcceptanceGeneratedAuditEventId =");
    expect(appSource).toContain("const p2ReadinessAcceptanceGeneratedAuditEventSource =");
    expect(appSource).toContain("openP2ReadinessAcceptanceGeneratedAudit");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceGeneratedQuery");
    expect(appSource).toContain("refreshP2ReadinessAcceptanceLatest");
    expect(appSource).toContain("generateP2ReadinessAcceptanceReport");
    expect(appSource).toContain("setP2ReadinessAcceptanceAuditEvent(result.auditEvent ?? null)");
    expect(appSource).toContain("setP2ReadinessAcceptanceLatestState(await loadP2ReadinessAcceptanceLatest(quantCoreBaseUrl))");
    expect(appSource).toContain("buildP2ReadinessAcceptanceSummary({");
    expect(appSource).toContain("evidenceCoverage: p2ReadinessEvidenceCoverage");
    expect(appSource).toContain("p1Acceptance: p1AcceptanceSummary");
    expect(appSource).toContain("<P2ReadinessAcceptancePanel");
    expect(appSource).toContain("auditEventId={p2ReadinessAcceptanceGeneratedAuditEventId}");
    expect(appSource).toContain("auditEventSource={p2ReadinessAcceptanceGeneratedAuditEventSource}");
    expect(appSource).toContain('className="workflow-p2-readiness-acceptance-panel"');
    expect(appSource).toContain("readback={p2ReadinessAcceptanceLatestState.acceptance ?? null}");
    expect(appSource).toContain("isRefreshing={isLoadingP2ReadinessAcceptance}");
    expect(appSource).toContain("isGenerating={isGeneratingP2ReadinessAcceptance}");
    expect(appSource).toContain("onGenerateAcceptance={() => void generateP2ReadinessAcceptanceReport()}");
    expect(appSource).toContain("onOpenAudit={openP2ReadinessAcceptanceGeneratedAudit}");
    expect(appSource).toContain("onRefresh={() => void refreshP2ReadinessAcceptanceLatest()}");
    expect(panelSource).toContain("onOpenAudit");
    expect(panelSource).toContain("auditEventSource");
    expect(panelSource).toContain("p2ReadinessAcceptanceAuditEventSourceLabel(i18n, auditEventSource)");
    expect(panelSource).toContain("<ShieldCheck size={13} />");
    expect(panelSource).toContain('"审计"');
    expect(panelSource).toContain('"Audit"');
    expect(appSource).toContain('className={`p2-readiness-acceptance ${summary.tone}`}');
    expect(appSource).toContain('className={`p2-readiness-acceptance-readback ${readbackTone}`}');
    expect(appSource).toContain('className="p2-readiness-acceptance-audit"');
    expect(appSource).toContain('className="p2-readiness-acceptance-grid"');
    expect(appSource).toContain('className={`p2-readiness-acceptance-row ${row.tone}`}');
    expect(styles).toContain(".workflow-p2-readiness-acceptance-panel");
    expect(styles).toContain(".p2-readiness-acceptance");
    expect(styles).toContain(".p2-readiness-acceptance-refresh");
    expect(styles).toContain(".p2-readiness-acceptance-readback");
    expect(styles).toContain(".p2-readiness-acceptance-grid");
    expect(styles).toContain(".p2-readiness-acceptance-row");
    expect(cssBlock(".workflow-p2-readiness-acceptance-panel")).toContain("grid-area: p2-readiness;");
    expect(
      hasCssBlockWith(".execution-layout", [
        '"promotion p2-acceptance"',
        '"promotion p2-readiness"',
        '"promotion p2-coverage"'
      ])
    ).toBe(true);
  });

  test("renders promotion certification evidence from recorded adapter certifications", () => {
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows"
    );
    expect(appSource).toContain("adapterCertificationRows={executionAdapterCertificationRows}");
    expect(appSource).toContain("adapterCertificationApplyRows={executionAdapterCertificationApplyRows}");
    expect(appSource).toContain("adapterCertificationRows: ExecutionAdapterCertificationRow[]");
    expect(appSource).toContain("adapterCertificationApplyRows: ExecutionAdapterCertificationApplyRow[]");
    expect(appSource).toContain('className="promotion-certification-evidence"');
    expect(appSource).toContain('className={`promotion-certification-evidence-row');
    expect(appSource).toContain('className="promotion-certification-apply-evidence"');
    expect(appSource).toContain('className={`promotion-certification-apply-evidence-row');
    expect(appSource).toContain("promotionCertificationBoundaryLabel(i18n, row.boundary)");
    expect(appSource).toContain("adapterCertificationApplyStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterCertificationApplyConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-certification-evidence");
    expect(styles).toContain(".promotion-certification-evidence-row");
    expect(styles).toContain(".promotion-certification-apply-evidence");
    expect(styles).toContain(".promotion-certification-apply-evidence-row");
  });

  test("renders controlled restart evidence history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterControlledRestartEvidence(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterControlledRestartEvidence(restartEvidenceResults.flatMap((result) => result.controlledRestartEvidence))"
    );
    expect(appSource).toContain(
      "buildExecutionAdapterControlledRestartEvidenceRows(executionAdapterControlledRestartEvidence)"
    );
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows"
    );
    expect(appSource).toContain(
      "adapterControlledRestartEvidenceRows={executionAdapterControlledRestartEvidenceRows}"
    );
    expect(appSource).toContain("adapterControlledRestartEvidenceRows: ExecutionAdapterControlledRestartEvidenceRow[]");
    expect(appSource).toContain('className="promotion-controlled-restart-evidence"');
    expect(appSource).toContain('className={`promotion-controlled-restart-evidence-row');
    expect(appSource).toContain("adapterControlledRestartEvidenceStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterControlledRestartEvidenceConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-controlled-restart-evidence");
    expect(styles).toContain(".promotion-controlled-restart-evidence-row");
  });

  test("renders restart acceptance history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterRestartAcceptances(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterRestartAcceptances(restartAcceptanceResults.flatMap((result) => result.restartAcceptances))"
    );
    expect(appSource).toContain("buildExecutionAdapterRestartAcceptanceRows(executionAdapterRestartAcceptances)");
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows, executionAdapterPaperExecutionRows, executionAdapterSandboxProbeReviewRows, executionAdapterProductionRouteReviewRows, executionAdapterSandboxOrderSchemaDryRunRows, executionAdapterPaperOrderLifecycleRows, executionAdapterPaperRouteRunbookRows, executionAdapterOpsStateRows)"
    );
    expect(appSource).toContain("adapterRestartAcceptanceRows={executionAdapterRestartAcceptanceRows}");
    expect(appSource).toContain("adapterRestartAcceptanceRows: ExecutionAdapterRestartAcceptanceRow[]");
    expect(appSource).toContain('className="promotion-restart-acceptance"');
    expect(appSource).toContain('className={`promotion-restart-acceptance-row');
    expect(appSource).toContain("adapterRestartAcceptanceStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterRestartAcceptanceConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-restart-acceptance");
    expect(styles).toContain(".promotion-restart-acceptance-row");
  });

  test("renders secret reference history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterSecretReferences(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterSecretReferences(secretReferenceResults.flatMap((result) => result.adapterSecretReferences))"
    );
    expect(appSource).toContain("buildExecutionAdapterSecretReferenceRows(executionAdapterSecretReferences)");
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows, executionAdapterPaperExecutionRows, executionAdapterSandboxProbeReviewRows, executionAdapterProductionRouteReviewRows, executionAdapterSandboxOrderSchemaDryRunRows, executionAdapterPaperOrderLifecycleRows, executionAdapterPaperRouteRunbookRows, executionAdapterOpsStateRows)"
    );
    expect(appSource).toContain("adapterSecretReferenceRows={executionAdapterSecretReferenceRows}");
    expect(appSource).toContain("adapterSecretReferenceRows: ExecutionAdapterSecretReferenceRow[]");
    expect(appSource).toContain('className="promotion-secret-reference-evidence"');
    expect(appSource).toContain('className={`promotion-secret-reference-evidence-row');
    expect(appSource).toContain("adapterSecretReferenceStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterSecretReferenceConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-secret-reference-evidence");
    expect(styles).toContain(".promotion-secret-reference-evidence-row");
  });

  test("renders secret materialization history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterSecretMaterializations(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterSecretMaterializations(materializationResults.flatMap((result) => result.adapterSecretMaterializations))"
    );
    expect(appSource).toContain("buildExecutionAdapterSecretMaterializationRows(executionAdapterSecretMaterializations)");
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows, executionAdapterPaperExecutionRows, executionAdapterSandboxProbeReviewRows, executionAdapterProductionRouteReviewRows, executionAdapterSandboxOrderSchemaDryRunRows, executionAdapterPaperOrderLifecycleRows, executionAdapterPaperRouteRunbookRows, executionAdapterOpsStateRows)"
    );
    expect(appSource).toContain("adapterSecretMaterializationRows={executionAdapterSecretMaterializationRows}");
    expect(appSource).toContain("adapterSecretMaterializationRows: ExecutionAdapterSecretMaterializationRow[]");
    expect(appSource).toContain('className="promotion-secret-materialization-evidence"');
    expect(appSource).toContain('className={`promotion-secret-materialization-evidence-row');
    expect(appSource).toContain("adapterSecretMaterializationStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterSecretMaterializationConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-secret-materialization-evidence");
    expect(styles).toContain(".promotion-secret-materialization-evidence-row");
  });

  test("renders environment binding, runtime reload plan, runtime reload execution, and acceptance history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterEnvironmentBindings(quantCoreBaseUrl");
    expect(appSource).toContain("loadExecutionAdapterRuntimeReloadPlans(quantCoreBaseUrl");
    expect(appSource).toContain("loadExecutionAdapterRuntimeReloadExecutions(quantCoreBaseUrl");
    expect(appSource).toContain("loadExecutionAdapterRuntimeReloadAcceptances(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterEnvironmentBindings(environmentBindingResults.flatMap((result) => result.adapterEnvironmentBindings))"
    );
    expect(appSource).toContain(
      "setExecutionAdapterRuntimeReloadPlans(runtimeReloadPlanResults.flatMap((result) => result.adapterRuntimeReloadPlans))"
    );
    expect(appSource).toContain(
      "setExecutionAdapterRuntimeReloadExecutions(runtimeReloadExecutionResults.flatMap((result) => result.adapterRuntimeReloadExecutions))"
    );
    expect(appSource).toContain(
      "setExecutionAdapterRuntimeReloadAcceptances(runtimeReloadAcceptanceResults.flatMap((result) => result.adapterRuntimeReloadAcceptances))"
    );
    expect(appSource).toContain("buildExecutionAdapterEnvironmentBindingRows(executionAdapterEnvironmentBindings)");
    expect(appSource).toContain("buildExecutionAdapterRuntimeReloadPlanRows(executionAdapterRuntimeReloadPlans)");
    expect(appSource).toContain("const executionAdapterRuntimeReloadExecutionRows = buildExecutionAdapterRuntimeReloadExecutionRows(");
    expect(appSource).toContain("executionAdapterRuntimeReloadExecutions");
    expect(appSource).toContain("const executionAdapterRuntimeReloadAcceptanceRows = buildExecutionAdapterRuntimeReloadAcceptanceRows(");
    expect(appSource).toContain("executionAdapterRuntimeReloadAcceptances");
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows, executionAdapterPaperExecutionRows, executionAdapterSandboxProbeReviewRows, executionAdapterProductionRouteReviewRows, executionAdapterSandboxOrderSchemaDryRunRows, executionAdapterPaperOrderLifecycleRows, executionAdapterPaperRouteRunbookRows, executionAdapterOpsStateRows)"
    );
    expect(appSource).toContain("adapterEnvironmentBindingRows={executionAdapterEnvironmentBindingRows}");
    expect(appSource).toContain("adapterRuntimeReloadPlanRows={executionAdapterRuntimeReloadPlanRows}");
    expect(appSource).toContain("adapterRuntimeReloadExecutionRows={executionAdapterRuntimeReloadExecutionRows}");
    expect(appSource).toContain("adapterRuntimeReloadAcceptanceRows={executionAdapterRuntimeReloadAcceptanceRows}");
    expect(appSource).toContain("adapterEnvironmentBindingRows: ExecutionAdapterEnvironmentBindingRow[]");
    expect(appSource).toContain("adapterRuntimeReloadPlanRows: ExecutionAdapterRuntimeReloadPlanRow[]");
    expect(appSource).toContain("adapterRuntimeReloadExecutionRows: ExecutionAdapterRuntimeReloadExecutionRow[]");
    expect(appSource).toContain("adapterRuntimeReloadAcceptanceRows: ExecutionAdapterRuntimeReloadAcceptanceRow[]");
    expect(appSource).toContain('className="promotion-environment-binding-evidence"');
    expect(appSource).toContain('className={`promotion-environment-binding-evidence-row');
    expect(appSource).toContain('className="promotion-runtime-reload-plan-evidence"');
    expect(appSource).toContain('className={`promotion-runtime-reload-plan-evidence-row');
    expect(appSource).toContain('className="promotion-runtime-reload-execution-evidence"');
    expect(appSource).toContain('className={`promotion-runtime-reload-execution-evidence-row');
    expect(appSource).toContain('className="promotion-runtime-reload-acceptance-evidence"');
    expect(appSource).toContain('className={`promotion-runtime-reload-acceptance-evidence-row');
    expect(appSource).toContain("adapterEnvironmentBindingStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterRuntimeReloadPlanStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterRuntimeReloadExecutionStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterRuntimeReloadExecutionConfirmationSummary(i18n, row.confirmationSummary)");
    expect(appSource).toContain("adapterRuntimeReloadAcceptanceStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterRuntimeReloadAcceptanceConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-environment-binding-evidence");
    expect(styles).toContain(".promotion-environment-binding-evidence-row");
    expect(styles).toContain(".promotion-runtime-reload-plan-evidence");
    expect(styles).toContain(".promotion-runtime-reload-plan-evidence-row");
    expect(styles).toContain(".promotion-runtime-reload-execution-evidence");
    expect(styles).toContain(".promotion-runtime-reload-execution-evidence-row");
    expect(styles).toContain(".promotion-runtime-reload-acceptance-evidence");
    expect(styles).toContain(".promotion-runtime-reload-acceptance-evidence-row");
  });

  test("renders late-stage adapter paper route evidence in promotion queue", () => {
    expect(appSource).toContain("adapterSandboxOrderSchemaDryRunRows={executionAdapterSandboxOrderSchemaDryRunRows}");
    expect(appSource).toContain("adapterPaperOrderLifecycleRows={executionAdapterPaperOrderLifecycleRows}");
    expect(appSource).toContain("adapterPaperRouteRunbookRows={executionAdapterPaperRouteRunbookRows}");
    expect(appSource).toContain("adapterOpsStateRows={executionAdapterOpsStateRows}");
    expect(appSource).toContain("adapterPaperExecutionRows={executionAdapterPaperExecutionRows}");
    expect(appSource).toContain("adapterSandboxOrderSchemaDryRunRows: ExecutionAdapterSandboxOrderSchemaDryRunRow[]");
    expect(appSource).toContain("adapterPaperOrderLifecycleRows: ExecutionAdapterPaperOrderLifecycleRow[]");
    expect(appSource).toContain("adapterPaperRouteRunbookRows: ExecutionAdapterPaperRouteRunbookRow[]");
    expect(appSource).toContain("adapterOpsStateRows: ExecutionAdapterOpsStateRow[]");
    expect(appSource).toContain("adapterPaperExecutionRows: ExecutionAdapterPaperExecutionRow[]");
    expect(appSource).toContain('className="promotion-sandbox-order-schema-dry-run-evidence"');
    expect(appSource).toContain('className={`promotion-sandbox-order-schema-dry-run-evidence-row');
    expect(appSource).toContain('className="promotion-paper-order-lifecycle-evidence"');
    expect(appSource).toContain('className={`promotion-paper-order-lifecycle-evidence-row');
    expect(appSource).toContain('className="promotion-paper-route-runbook-evidence"');
    expect(appSource).toContain('className={`promotion-paper-route-runbook-evidence-row');
    expect(appSource).toContain('className="promotion-adapter-ops-state-evidence"');
    expect(appSource).toContain('className={`promotion-adapter-ops-state-evidence-row');
    expect(appSource).toContain('className="promotion-adapter-paper-execution-evidence"');
    expect(appSource).toContain('className={`promotion-adapter-paper-execution-evidence-row');
    expect(appSource).toContain("adapterSandboxOrderSchemaDryRunStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterPaperOrderLifecycleStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterPaperRouteRunbookStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterOpsStateStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterPaperExecutionStatusLabel(i18n, row.statusLabel)");
    expect(styles).toContain(".promotion-sandbox-order-schema-dry-run-evidence");
    expect(styles).toContain(".promotion-paper-order-lifecycle-evidence");
    expect(styles).toContain(".promotion-paper-route-runbook-evidence");
    expect(styles).toContain(".promotion-adapter-ops-state-evidence");
    expect(styles).toContain(".promotion-adapter-paper-execution-evidence");
  });

  test("renders runtime reload acceptance recording controls in platform settings", () => {
    expect(appSource).toContain("recordExecutionAdapterRuntimeReloadAcceptance,");
    expect(appSource).toContain("interface ExecutionAdapterRuntimeReloadAcceptanceConfirmations");
    expect(appSource).toContain(
      "const [adapterRuntimeReloadAcceptanceConfirmations, setAdapterRuntimeReloadAcceptanceConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterRuntimeReloadAcceptanceId, setRecordingAdapterRuntimeReloadAcceptanceId]"
    );
    expect(appSource).toContain("const updateAdapterRuntimeReloadAcceptanceConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterRuntimeReloadAcceptance = useCallback");
    expect(appSource).toContain("recordExecutionAdapterRuntimeReloadAcceptance(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterRuntimeReloadAcceptances((current) => ["
    );
    expect(appSource).toContain(
      "runtimeReloadAcceptanceConfirmations={adapterRuntimeReloadAcceptanceConfirmations}"
    );
    expect(appSource).toContain(
      "recordingRuntimeReloadAcceptanceId={recordingAdapterRuntimeReloadAcceptanceId}"
    );
    expect(appSource).toContain("runtimeReloadExecutionRows={executionAdapterRuntimeReloadExecutionRows}");
    expect(appSource).toContain("runtimeReloadAcceptanceRows={executionAdapterRuntimeReloadAcceptanceRows}");
    expect(appSource).toContain("onRecordRuntimeReloadAcceptance={recordAdapterRuntimeReloadAcceptance}");
    expect(appSource).toContain(
      "onRuntimeReloadAcceptanceConfirmationChange={updateAdapterRuntimeReloadAcceptanceConfirmation}"
    );
    expect(appSource).toContain("runtimeReloadAcceptanceConfirmations: Record<string, ExecutionAdapterRuntimeReloadAcceptanceConfirmations>");
    expect(appSource).toContain("runtimeReloadAcceptanceRows: ExecutionAdapterRuntimeReloadAcceptanceRow[]");
    expect(appSource).toContain("runtimeReloadExecutionRows: ExecutionAdapterRuntimeReloadExecutionRow[]");
    expect(appSource).toContain('className="adapter-runtime-reload-acceptance-list"');
    expect(appSource).toContain('className={`adapter-runtime-reload-acceptance-row');
    expect(appSource).toContain('className={`adapter-runtime-reload-acceptance-confirmation');
    expect(appSource).toContain("adapterRuntimeReloadAcceptanceStatusLabel(i18n, acceptance.statusLabel)");
    expect(appSource).toContain("adapterRuntimeReloadAcceptanceConfirmationSummary(i18n, acceptance.confirmationSummary)");
    expect(styles).toContain(".adapter-runtime-reload-acceptance-list");
    expect(styles).toContain(".adapter-runtime-reload-acceptance-row");
    expect(styles).toContain(".adapter-runtime-reload-acceptance-confirmation");
  });

  test("renders adapter orchestration dry run history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterOrchestrationDryRuns(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterOrchestrationDryRuns(orchestrationDryRunResults.flatMap((result) => result.adapterOrchestrationDryRuns))"
    );
    expect(appSource).toContain("const executionAdapterOrchestrationDryRunRows = buildExecutionAdapterOrchestrationDryRunRows(");
    expect(appSource).toContain("executionAdapterOrchestrationDryRuns");
    expect(appSource).toContain("adapterOrchestrationDryRunRows={executionAdapterOrchestrationDryRunRows}");
    expect(appSource).toContain("adapterOrchestrationDryRunRows: ExecutionAdapterOrchestrationDryRunRow[]");
    expect(appSource).toContain('className="promotion-orchestration-dry-run-evidence"');
    expect(appSource).toContain('className={`promotion-orchestration-dry-run-evidence-row');
    expect(appSource).toContain("adapterOrchestrationDryRunStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterOrchestrationDryRunConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-orchestration-dry-run-evidence");
    expect(styles).toContain(".promotion-orchestration-dry-run-evidence-row");
  });

  test("renders adapter orchestration dry run recording controls in platform settings", () => {
    expect(appSource).toContain("recordExecutionAdapterOrchestrationDryRun,");
    expect(appSource).toContain("interface ExecutionAdapterOrchestrationDryRunConfirmations");
    expect(appSource).toContain(
      "const [adapterOrchestrationDryRunConfirmations, setAdapterOrchestrationDryRunConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterOrchestrationDryRunId, setRecordingAdapterOrchestrationDryRunId]"
    );
    expect(appSource).toContain("const updateAdapterOrchestrationDryRunConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterOrchestrationDryRun = useCallback");
    expect(appSource).toContain("recordExecutionAdapterOrchestrationDryRun(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterOrchestrationDryRuns((current) => [");
    expect(appSource).toContain(
      "orchestrationDryRunConfirmations={adapterOrchestrationDryRunConfirmations}"
    );
    expect(appSource).toContain(
      "recordingOrchestrationDryRunId={recordingAdapterOrchestrationDryRunId}"
    );
    expect(appSource).toContain("orchestrationDryRunRows={executionAdapterOrchestrationDryRunRows}");
    expect(appSource).toContain("onRecordOrchestrationDryRun={recordAdapterOrchestrationDryRun}");
    expect(appSource).toContain(
      "onOrchestrationDryRunConfirmationChange={updateAdapterOrchestrationDryRunConfirmation}"
    );
    expect(appSource).toContain("orchestrationDryRunConfirmations: Record<string, ExecutionAdapterOrchestrationDryRunConfirmations>");
    expect(appSource).toContain("orchestrationDryRunRows: ExecutionAdapterOrchestrationDryRunRow[]");
    expect(appSource).toContain('className="adapter-orchestration-dry-run-list"');
    expect(appSource).toContain('className={`adapter-orchestration-dry-run-row');
    expect(appSource).toContain('className={`adapter-orchestration-dry-run-confirmation');
    expect(appSource).toContain("adapterOrchestrationDryRunStatusLabel(i18n, dryRun.statusLabel)");
    expect(appSource).toContain("adapterOrchestrationDryRunConfirmationSummary(i18n, dryRun.confirmationSummary)");
    expect(styles).toContain(".adapter-orchestration-dry-run-list");
    expect(styles).toContain(".adapter-orchestration-dry-run-row");
    expect(styles).toContain(".adapter-orchestration-dry-run-confirmation");
  });

  test("renders adapter orchestration execution history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterOrchestrationExecutions(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterOrchestrationExecutions(orchestrationExecutionResults.flatMap((result) => result.adapterOrchestrationExecutions))"
    );
    expect(appSource).toContain("const executionAdapterOrchestrationExecutionRows = buildExecutionAdapterOrchestrationExecutionRows(");
    expect(appSource).toContain("executionAdapterOrchestrationExecutions");
    expect(appSource).toContain("adapterOrchestrationExecutionRows={executionAdapterOrchestrationExecutionRows}");
    expect(appSource).toContain("adapterOrchestrationExecutionRows: ExecutionAdapterOrchestrationExecutionRow[]");
    expect(appSource).toContain('className="promotion-orchestration-execution-evidence"');
    expect(appSource).toContain('className={`promotion-orchestration-execution-evidence-row');
    expect(appSource).toContain('className="promotion-orchestration-execution-empty"');
    expect(appSource).toContain("等待受控编排执行证据");
    expect(appSource).toContain("adapterOrchestrationExecutionStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterOrchestrationExecutionConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-orchestration-execution-evidence");
    expect(styles).toContain(".promotion-orchestration-execution-evidence-row");
    expect(styles).toContain(".promotion-orchestration-execution-empty");
  });

  test("renders adapter orchestration execution recording controls in platform settings", () => {
    expect(appSource).toContain("recordExecutionAdapterOrchestrationExecution,");
    expect(appSource).toContain("interface ExecutionAdapterOrchestrationExecutionConfirmations");
    expect(appSource).toContain(
      "const [adapterOrchestrationExecutionConfirmations, setAdapterOrchestrationExecutionConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterOrchestrationExecutionId, setRecordingAdapterOrchestrationExecutionId]"
    );
    expect(appSource).toContain("const updateAdapterOrchestrationExecutionConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterOrchestrationExecution = useCallback");
    expect(appSource).toContain("recordExecutionAdapterOrchestrationExecution(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterOrchestrationExecutions((current) => [");
    expect(appSource).toContain(
      "orchestrationExecutionConfirmations={adapterOrchestrationExecutionConfirmations}"
    );
    expect(appSource).toContain(
      "recordingOrchestrationExecutionId={recordingAdapterOrchestrationExecutionId}"
    );
    expect(appSource).toContain("orchestrationExecutionRows={executionAdapterOrchestrationExecutionRows}");
    expect(appSource).toContain("onRecordOrchestrationExecution={recordAdapterOrchestrationExecution}");
    expect(appSource).toContain(
      "onOrchestrationExecutionConfirmationChange={updateAdapterOrchestrationExecutionConfirmation}"
    );
    expect(appSource).toContain("orchestrationExecutionConfirmations: Record<string, ExecutionAdapterOrchestrationExecutionConfirmations>");
    expect(appSource).toContain("orchestrationExecutionRows: ExecutionAdapterOrchestrationExecutionRow[]");
    expect(appSource).toContain('className="adapter-orchestration-execution-list"');
    expect(appSource).toContain('className={`adapter-orchestration-execution-row');
    expect(appSource).toContain('className={`adapter-orchestration-execution-confirmation');
    expect(appSource).toContain("adapterOrchestrationExecutionStatusLabel(i18n, execution.statusLabel)");
    expect(appSource).toContain("adapterOrchestrationExecutionConfirmationSummary(i18n, execution.confirmationSummary)");
    expect(styles).toContain(".adapter-orchestration-execution-list");
    expect(styles).toContain(".adapter-orchestration-execution-row");
    expect(styles).toContain(".adapter-orchestration-execution-confirmation");
  });

  test("renders adapter human confirmation history and recording controls", () => {
    expect(appSource).toContain("loadExecutionAdapterHumanConfirmations(quantCoreBaseUrl");
    expect(appSource).toContain("recordExecutionAdapterHumanConfirmation,");
    expect(appSource).toContain(
      "setExecutionAdapterHumanConfirmations(humanConfirmationResults.flatMap((result) => result.adapterHumanConfirmations))"
    );
    expect(appSource).toContain("const executionAdapterHumanConfirmationRows = buildExecutionAdapterHumanConfirmationRows(");
    expect(appSource).toContain("executionAdapterHumanConfirmations");
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows, executionAdapterPaperExecutionRows, executionAdapterSandboxProbeReviewRows, executionAdapterProductionRouteReviewRows, executionAdapterSandboxOrderSchemaDryRunRows, executionAdapterPaperOrderLifecycleRows, executionAdapterPaperRouteRunbookRows, executionAdapterOpsStateRows)"
    );
    expect(appSource).toContain("adapterHumanConfirmationRows={executionAdapterHumanConfirmationRows}");
    expect(appSource).toContain("adapterHumanConfirmationRows: ExecutionAdapterHumanConfirmationRow[]");
    expect(appSource).toContain('className="promotion-human-confirmation-evidence"');
    expect(appSource).toContain('className={`promotion-human-confirmation-evidence-row');
    expect(appSource).toContain('className="promotion-human-confirmation-empty"');
    expect(appSource).toContain("等待最终人工确认");
    expect(appSource).toContain("adapterHumanConfirmationStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterHumanConfirmationConfirmationSummary(i18n, row.confirmationSummary)");
    expect(appSource).toContain("interface ExecutionAdapterHumanConfirmationConfirmations");
    expect(appSource).toContain(
      "const [adapterHumanConfirmationConfirmations, setAdapterHumanConfirmationConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterHumanConfirmationId, setRecordingAdapterHumanConfirmationId]"
    );
    expect(appSource).toContain("const updateAdapterHumanConfirmationConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterHumanConfirmation = useCallback");
    expect(appSource).toContain("recordExecutionAdapterHumanConfirmation(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterHumanConfirmations((current) => [");
    expect(appSource).toContain(
      "humanConfirmationConfirmations={adapterHumanConfirmationConfirmations}"
    );
    expect(appSource).toContain("recordingHumanConfirmationId={recordingAdapterHumanConfirmationId}");
    expect(appSource).toContain("humanConfirmationRows={executionAdapterHumanConfirmationRows}");
    expect(appSource).toContain("onRecordHumanConfirmation={recordAdapterHumanConfirmation}");
    expect(appSource).toContain(
      "onHumanConfirmationChange={updateAdapterHumanConfirmationConfirmation}"
    );
    expect(appSource).toContain("humanConfirmationConfirmations: Record<string, ExecutionAdapterHumanConfirmationConfirmations>");
    expect(appSource).toContain("humanConfirmationRows: ExecutionAdapterHumanConfirmationRow[]");
    expect(appSource).toContain('className="adapter-human-confirmation-list"');
    expect(appSource).toContain('className={`adapter-human-confirmation-row');
    expect(appSource).toContain('className={`adapter-human-confirmation-confirmation');
    expect(appSource).toContain("adapterHumanConfirmationStatusLabel(i18n, confirmation.statusLabel)");
    expect(appSource).toContain("adapterHumanConfirmationConfirmationSummary(i18n, confirmation.confirmationSummary)");
    expect(styles).toContain(".promotion-human-confirmation-evidence");
    expect(styles).toContain(".promotion-human-confirmation-evidence-row");
    expect(styles).toContain(".promotion-human-confirmation-empty");
    expect(styles).toContain(".adapter-human-confirmation-list");
    expect(styles).toContain(".adapter-human-confirmation-row");
    expect(styles).toContain(".adapter-human-confirmation-confirmation");
  });

  test("renders adapter sandbox probe plan history and recording controls", () => {
    expect(appSource).toContain("loadExecutionAdapterSandboxProbePlans(quantCoreBaseUrl");
    expect(appSource).toContain("recordExecutionAdapterSandboxProbePlan,");
    expect(appSource).toContain(
      "setExecutionAdapterSandboxProbePlans(sandboxProbePlanResults.flatMap((result) => result.adapterSandboxProbePlans))"
    );
    expect(appSource).toContain("const executionAdapterSandboxProbePlanRows = buildExecutionAdapterSandboxProbePlanRows(");
    expect(appSource).toContain("executionAdapterSandboxProbePlans");
    expect(appSource).toContain("adapterSandboxProbePlanRows={executionAdapterSandboxProbePlanRows}");
    expect(appSource).toContain("adapterSandboxProbePlanRows: ExecutionAdapterSandboxProbePlanRow[]");
    expect(appSource).toContain('className="promotion-sandbox-probe-plan-evidence"');
    expect(appSource).toContain('className={`promotion-sandbox-probe-plan-evidence-row');
    expect(appSource).toContain('className="promotion-sandbox-probe-plan-empty"');
    expect(appSource).toContain("等待 sandbox/testnet 探针计划");
    expect(appSource).toContain("adapterSandboxProbePlanStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterSandboxProbePlanConfirmationSummary(i18n, row.confirmationSummary)");
    expect(appSource).toContain("interface ExecutionAdapterSandboxProbePlanConfirmations");
    expect(appSource).toContain(
      "const [adapterSandboxProbePlanConfirmations, setAdapterSandboxProbePlanConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterSandboxProbePlanId, setRecordingAdapterSandboxProbePlanId]"
    );
    expect(appSource).toContain("const updateAdapterSandboxProbePlanConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterSandboxProbePlan = useCallback");
    expect(appSource).toContain("recordExecutionAdapterSandboxProbePlan(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterSandboxProbePlans((current) => [");
    expect(appSource).toContain(
      "sandboxProbePlanConfirmations={adapterSandboxProbePlanConfirmations}"
    );
    expect(appSource).toContain("recordingSandboxProbePlanId={recordingAdapterSandboxProbePlanId}");
    expect(appSource).toContain("sandboxProbePlanRows={executionAdapterSandboxProbePlanRows}");
    expect(appSource).toContain("onRecordSandboxProbePlan={recordAdapterSandboxProbePlan}");
    expect(appSource).toContain(
      "onSandboxProbePlanConfirmationChange={updateAdapterSandboxProbePlanConfirmation}"
    );
    expect(appSource).toContain("sandboxProbePlanConfirmations: Record<string, ExecutionAdapterSandboxProbePlanConfirmations>");
    expect(appSource).toContain("sandboxProbePlanRows: ExecutionAdapterSandboxProbePlanRow[]");
    expect(appSource).toContain('className="adapter-sandbox-probe-plan-list"');
    expect(appSource).toContain('className={`adapter-sandbox-probe-plan-row');
    expect(appSource).toContain('className={`adapter-sandbox-probe-plan-confirmation');
    expect(appSource).toContain("adapterSandboxProbePlanStatusLabel(i18n, probePlan.statusLabel)");
    expect(appSource).toContain("adapterSandboxProbePlanConfirmationSummary(i18n, probePlan.confirmationSummary)");
    expect(styles).toContain(".promotion-sandbox-probe-plan-evidence");
    expect(styles).toContain(".promotion-sandbox-probe-plan-evidence-row");
    expect(styles).toContain(".promotion-sandbox-probe-plan-empty");
    expect(styles).toContain(".adapter-sandbox-probe-plan-list");
    expect(styles).toContain(".adapter-sandbox-probe-plan-row");
    expect(styles).toContain(".adapter-sandbox-probe-plan-confirmation");
  });

  test("renders adapter sandbox probe execution history and recording controls", () => {
    expect(appSource).toContain("loadExecutionAdapterSandboxProbeExecutions(quantCoreBaseUrl");
    expect(appSource).toContain("recordExecutionAdapterSandboxProbeExecution,");
    expect(appSource).toContain(
      "setExecutionAdapterSandboxProbeExecutions("
    );
    expect(appSource).toContain("const executionAdapterSandboxProbeExecutionRows = buildExecutionAdapterSandboxProbeExecutionRows(");
    expect(appSource).toContain("executionAdapterSandboxProbeExecutions");
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows, executionAdapterPaperExecutionRows, executionAdapterSandboxProbeReviewRows, executionAdapterProductionRouteReviewRows, executionAdapterSandboxOrderSchemaDryRunRows, executionAdapterPaperOrderLifecycleRows, executionAdapterPaperRouteRunbookRows, executionAdapterOpsStateRows)"
    );
    expect(appSource).toContain("adapterSandboxProbeExecutionRows={executionAdapterSandboxProbeExecutionRows}");
    expect(appSource).toContain("adapterSandboxProbeExecutionRows: ExecutionAdapterSandboxProbeExecutionRow[]");
    expect(appSource).toContain('className="promotion-sandbox-probe-execution-evidence"');
    expect(appSource).toContain('className={`promotion-sandbox-probe-execution-evidence-row');
    expect(appSource).toContain('className="promotion-sandbox-probe-execution-empty"');
    expect(appSource).toContain("等待只读 sandbox/testnet 探针执行");
    expect(appSource).toContain("adapterSandboxProbeExecutionStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterSandboxProbeExecutionConfirmationSummary(i18n, row.confirmationSummary)");
    expect(appSource).toContain("interface ExecutionAdapterSandboxProbeExecutionConfirmations");
    expect(appSource).toContain(
      "const [adapterSandboxProbeExecutionConfirmations, setAdapterSandboxProbeExecutionConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterSandboxProbeExecutionId, setRecordingAdapterSandboxProbeExecutionId]"
    );
    expect(appSource).toContain("const updateAdapterSandboxProbeExecutionConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterSandboxProbeExecution = useCallback");
    expect(appSource).toContain("recordExecutionAdapterSandboxProbeExecution(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterSandboxProbeExecutions((current) => [");
    expect(appSource).toContain(
      "sandboxProbeExecutionConfirmations={adapterSandboxProbeExecutionConfirmations}"
    );
    expect(appSource).toContain("recordingSandboxProbeExecutionId={recordingAdapterSandboxProbeExecutionId}");
    expect(appSource).toContain("sandboxProbeExecutionRows={executionAdapterSandboxProbeExecutionRows}");
    expect(appSource).toContain("onRecordSandboxProbeExecution={recordAdapterSandboxProbeExecution}");
    expect(appSource).toContain(
      "onSandboxProbeExecutionConfirmationChange={updateAdapterSandboxProbeExecutionConfirmation}"
    );
    expect(appSource).toContain("sandboxProbeExecutionConfirmations: Record<string, ExecutionAdapterSandboxProbeExecutionConfirmations>");
    expect(appSource).toContain("sandboxProbeExecutionRows: ExecutionAdapterSandboxProbeExecutionRow[]");
    expect(appSource).toContain('className="adapter-sandbox-probe-execution-list"');
    expect(appSource).toContain('className={`adapter-sandbox-probe-execution-row');
    expect(appSource).toContain('className={`adapter-sandbox-probe-execution-confirmation');
    expect(appSource).toContain("adapterSandboxProbeExecutionStatusLabel(i18n, probeExecution.statusLabel)");
    expect(appSource).toContain("adapterSandboxProbeExecutionConfirmationSummary(i18n, probeExecution.confirmationSummary)");
    expect(styles).toContain(".promotion-sandbox-probe-execution-evidence");
    expect(styles).toContain(".promotion-sandbox-probe-execution-evidence-row");
    expect(styles).toContain(".promotion-sandbox-probe-execution-empty");
    expect(styles).toContain(".adapter-sandbox-probe-execution-list");
    expect(styles).toContain(".adapter-sandbox-probe-execution-row");
    expect(styles).toContain(".adapter-sandbox-probe-execution-confirmation");
  });

  test("renders adapter sandbox probe review history and recording controls", () => {
    expect(appSource).toContain("loadExecutionAdapterSandboxProbeReviews(quantCoreBaseUrl");
    expect(appSource).toContain("recordExecutionAdapterSandboxProbeReview,");
    expect(appSource).toContain(
      "setExecutionAdapterSandboxProbeReviews("
    );
    expect(appSource).toContain("const executionAdapterSandboxProbeReviewRows = buildExecutionAdapterSandboxProbeReviewRows(");
    expect(appSource).toContain("executionAdapterSandboxProbeReviews");
    expect(appSource).toContain("adapterSandboxProbeReviewRows={executionAdapterSandboxProbeReviewRows}");
    expect(appSource).toContain("adapterSandboxProbeReviewRows: ExecutionAdapterSandboxProbeReviewRow[]");
    expect(appSource).toContain('className="promotion-sandbox-probe-review-evidence"');
    expect(appSource).toContain('className={`promotion-sandbox-probe-review-evidence-row');
    expect(appSource).toContain('className="promotion-sandbox-probe-review-empty"');
    expect(appSource).toContain("等待 sandbox/testnet 探针复核");
    expect(appSource).toContain("adapterSandboxProbeReviewStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterSandboxProbeReviewConfirmationSummary(i18n, row.confirmationSummary)");
    expect(appSource).toContain("interface ExecutionAdapterSandboxProbeReviewConfirmations");
    expect(appSource).toContain(
      "const [adapterSandboxProbeReviewConfirmations, setAdapterSandboxProbeReviewConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterSandboxProbeReviewId, setRecordingAdapterSandboxProbeReviewId]"
    );
    expect(appSource).toContain("const updateAdapterSandboxProbeReviewConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterSandboxProbeReview = useCallback");
    expect(appSource).toContain("recordExecutionAdapterSandboxProbeReview(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterSandboxProbeReviews((current) => [");
    expect(appSource).toContain(
      "sandboxProbeReviewConfirmations={adapterSandboxProbeReviewConfirmations}"
    );
    expect(appSource).toContain("recordingSandboxProbeReviewId={recordingAdapterSandboxProbeReviewId}");
    expect(appSource).toContain("sandboxProbeReviewRows={executionAdapterSandboxProbeReviewRows}");
    expect(appSource).toContain("onRecordSandboxProbeReview={recordAdapterSandboxProbeReview}");
    expect(appSource).toContain(
      "onSandboxProbeReviewConfirmationChange={updateAdapterSandboxProbeReviewConfirmation}"
    );
    expect(appSource).toContain("sandboxProbeReviewConfirmations: Record<string, ExecutionAdapterSandboxProbeReviewConfirmations>");
    expect(appSource).toContain("sandboxProbeReviewRows: ExecutionAdapterSandboxProbeReviewRow[]");
    expect(appSource).toContain('className="adapter-sandbox-probe-review-list"');
    expect(appSource).toContain('className={`adapter-sandbox-probe-review-row');
    expect(appSource).toContain('className={`adapter-sandbox-probe-review-confirmation');
    expect(appSource).toContain("adapterSandboxProbeReviewStatusLabel(i18n, probeReview.statusLabel)");
    expect(appSource).toContain("adapterSandboxProbeReviewConfirmationSummary(i18n, probeReview.confirmationSummary)");
    expect(styles).toContain(".promotion-sandbox-probe-review-evidence");
    expect(styles).toContain(".promotion-sandbox-probe-review-evidence-row");
    expect(styles).toContain(".promotion-sandbox-probe-review-empty");
    expect(styles).toContain(".adapter-sandbox-probe-review-list");
    expect(styles).toContain(".adapter-sandbox-probe-review-row");
    expect(styles).toContain(".adapter-sandbox-probe-review-confirmation");
  });

  test("renders adapter production route review history and recording controls", () => {
    expect(appSource).toContain("loadExecutionAdapterProductionRouteReviews(quantCoreBaseUrl");
    expect(appSource).toContain("recordExecutionAdapterProductionRouteReview,");
    expect(appSource).toContain(
      "setExecutionAdapterProductionRouteReviews("
    );
    expect(appSource).toContain("const executionAdapterProductionRouteReviewRows = buildExecutionAdapterProductionRouteReviewRows(");
    expect(appSource).toContain("executionAdapterProductionRouteReviews");
    expect(appSource).toContain("adapterProductionRouteReviewRows={executionAdapterProductionRouteReviewRows}");
    expect(appSource).toContain("adapterProductionRouteReviewRows: ExecutionAdapterProductionRouteReviewRow[]");
    expect(appSource).toContain('className="promotion-production-route-review-evidence"');
    expect(appSource).toContain('className={`promotion-production-route-review-evidence-row');
    expect(appSource).toContain('className="promotion-production-route-review-empty"');
    expect(appSource).toContain("等待生产路由策略复核");
    expect(appSource).toContain("adapterProductionRouteReviewStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterProductionRouteReviewConfirmationSummary(i18n, row.confirmationSummary)");
    expect(appSource).toContain("interface ExecutionAdapterProductionRouteReviewConfirmations");
    expect(appSource).toContain(
      "const [adapterProductionRouteReviewConfirmations, setAdapterProductionRouteReviewConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterProductionRouteReviewId, setRecordingAdapterProductionRouteReviewId]"
    );
    expect(appSource).toContain("const updateAdapterProductionRouteReviewConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterProductionRouteReview = useCallback");
    expect(appSource).toContain("recordExecutionAdapterProductionRouteReview(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterProductionRouteReviews((current) => [");
    expect(appSource).toContain(
      "productionRouteReviewConfirmations={adapterProductionRouteReviewConfirmations}"
    );
    expect(appSource).toContain("recordingProductionRouteReviewId={recordingAdapterProductionRouteReviewId}");
    expect(appSource).toContain("productionRouteReviewRows={executionAdapterProductionRouteReviewRows}");
    expect(appSource).toContain("onRecordProductionRouteReview={recordAdapterProductionRouteReview}");
    expect(appSource).toContain(
      "onProductionRouteReviewConfirmationChange={updateAdapterProductionRouteReviewConfirmation}"
    );
    expect(appSource).toContain("productionRouteReviewConfirmations: Record<string, ExecutionAdapterProductionRouteReviewConfirmations>");
    expect(appSource).toContain("productionRouteReviewRows: ExecutionAdapterProductionRouteReviewRow[]");
    expect(appSource).toContain('className="adapter-production-route-review-list"');
    expect(appSource).toContain('className={`adapter-production-route-review-row');
    expect(appSource).toContain('className={`adapter-production-route-review-confirmation');
    expect(appSource).toContain("adapterProductionRouteReviewStatusLabel(i18n, routeReview.statusLabel)");
    expect(appSource).toContain("adapterProductionRouteReviewConfirmationSummary(i18n, routeReview.confirmationSummary)");
    expect(styles).toContain(".promotion-production-route-review-evidence");
    expect(styles).toContain(".promotion-production-route-review-evidence-row");
    expect(styles).toContain(".promotion-production-route-review-empty");
    expect(styles).toContain(".adapter-production-route-review-list");
    expect(styles).toContain(".adapter-production-route-review-row");
    expect(styles).toContain(".adapter-production-route-review-confirmation");
  });

  test("renders adapter sandbox order schema dry-run history in settings", () => {
    expect(appSource).toContain("loadExecutionAdapterSandboxOrderSchemaDryRuns(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterSandboxOrderSchemaDryRuns(sandboxOrderSchemaDryRunResults.flatMap"
    );
    expect(appSource).toContain(
      "const executionAdapterSandboxOrderSchemaDryRunRows = buildExecutionAdapterSandboxOrderSchemaDryRunRows("
    );
    expect(appSource).toContain(
      "adapterSandboxOrderSchemaDryRunRows={executionAdapterSandboxOrderSchemaDryRunRows}"
    );
    expect(appSource).toContain("adapterSandboxOrderSchemaDryRunRows: ExecutionAdapterSandboxOrderSchemaDryRunRow[]");
    expect(appSource).toContain('className="adapter-sandbox-order-schema-dry-run-list"');
    expect(appSource).toContain('className={`adapter-sandbox-order-schema-dry-run-row');
    expect(appSource).toContain("adapterSandboxOrderSchemaDryRunStatusLabel(i18n, dryRun.statusLabel)");
    expect(appSource).toContain("adapterSandboxOrderSchemaDryRunConfirmationSummary(i18n, dryRun.confirmationSummary)");
    expect(styles).toContain(".adapter-sandbox-order-schema-dry-run-list");
    expect(styles).toContain(".adapter-sandbox-order-schema-dry-run-row");
  });

  test("renders adapter paper order lifecycle history in settings", () => {
    expect(appSource).toContain("loadExecutionAdapterPaperOrderLifecycles(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterPaperOrderLifecycles(paperOrderLifecycleResults.flatMap"
    );
    expect(appSource).toContain(
      "const executionAdapterPaperOrderLifecycleRows = buildExecutionAdapterPaperOrderLifecycleRows("
    );
    expect(appSource).toContain(
      "adapterPaperOrderLifecycleRows={executionAdapterPaperOrderLifecycleRows}"
    );
    expect(appSource).toContain("adapterPaperOrderLifecycleRows: ExecutionAdapterPaperOrderLifecycleRow[]");
    expect(appSource).toContain('className="adapter-paper-order-lifecycle-list"');
    expect(appSource).toContain('className={`adapter-paper-order-lifecycle-row');
    expect(appSource).toContain("adapterPaperOrderLifecycleStatusLabel(i18n, lifecycle.statusLabel)");
    expect(appSource).toContain("adapterPaperOrderLifecycleConfirmationSummary(i18n, lifecycle.confirmationSummary)");
    expect(styles).toContain(".adapter-paper-order-lifecycle-list");
    expect(styles).toContain(".adapter-paper-order-lifecycle-row");
  });

  test("renders adapter paper route runbook history in settings", () => {
    expect(appSource).toContain("loadExecutionAdapterPaperRouteRunbooks(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterPaperRouteRunbooks(paperRouteRunbookResults.flatMap"
    );
    expect(appSource).toContain(
      "const executionAdapterPaperRouteRunbookRows = buildExecutionAdapterPaperRouteRunbookRows("
    );
    expect(appSource).toContain(
      "adapterPaperRouteRunbookRows={executionAdapterPaperRouteRunbookRows}"
    );
    expect(appSource).toContain("adapterPaperRouteRunbookRows: ExecutionAdapterPaperRouteRunbookRow[]");
    expect(appSource).toContain('className="adapter-paper-route-runbook-list"');
    expect(appSource).toContain('className={`adapter-paper-route-runbook-row');
    expect(appSource).toContain("adapterPaperRouteRunbookStatusLabel(i18n, runbook.statusLabel)");
    expect(appSource).toContain("adapterPaperRouteRunbookConfirmationSummary(i18n, runbook.confirmationSummary)");
    expect(styles).toContain(".adapter-paper-route-runbook-list");
    expect(styles).toContain(".adapter-paper-route-runbook-row");
  });

  test("renders adapter ops state history in settings", () => {
    expect(appSource).toContain("recordExecutionAdapterOpsState(quantCoreBaseUrl");
    expect(appSource).toContain("loadExecutionAdapterOpsStates(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterOpsStates(adapterOpsStateResults.flatMap");
    expect(appSource).toContain("const executionAdapterOpsStateRows = buildExecutionAdapterOpsStateRows(");
    expect(appSource).toContain("adapterOpsStateRows={executionAdapterOpsStateRows}");
    expect(appSource).toContain("adapterOpsStateConfirmations={adapterOpsStateConfirmations}");
    expect(appSource).toContain("adapterOpsStateConfirmations: Record<string, ExecutionAdapterOpsStateConfirmations>");
    expect(appSource).toContain("onOpsStateConfirmationChange?:");
    expect(appSource).toContain("onRecordOpsState?: (row: ExecutionAdapterPaperRouteRunbookRow) => void");
    expect(appSource).toContain("recordingOpsStateId?: string | null");
    expect(appSource).toContain("createDefaultExecutionAdapterOpsStateConfirmations()");
    expect(appSource).toContain("executionAdapterOpsStateConfirmationRows.map");
    expect(appSource).toContain("adapterOpsStateRows: ExecutionAdapterOpsStateRow[]");
    expect(appSource).toContain('className="adapter-ops-state-list"');
    expect(appSource).toContain('className={`adapter-ops-state-row');
    expect(appSource).toContain('className="adapter-ops-state-confirmations"');
    expect(appSource).toContain("className={`adapter-ops-state-confirmation");
    expect(appSource).toContain("className={`adapter-ops-state-result");
    expect(appSource).toContain("onRecordOpsState?.(runbook)");
    expect(appSource).toContain("adapterOpsStateStatusLabel(i18n, opsState.statusLabel)");
    expect(appSource).toContain("adapterOpsStateConfirmationSummary(i18n, opsState.confirmationSummary)");
    expect(styles).toContain(".adapter-ops-state-list");
    expect(styles).toContain(".adapter-ops-state-row");
    expect(styles).toContain(".adapter-ops-state-confirmations");
    expect(styles).toContain(".adapter-ops-state-confirmation");
    expect(styles).toContain(".adapter-ops-state-result");
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

  test("lets settings market data adapters open the matching cache workflow", () => {
    expect(appSource).toContain("resolveAdapterWorkflowInstrument(workspace, adapter.market)");
    expect(appSource).toContain("openMarketDataAdapterWorkflow");
    expect(appSource).toContain("onOpenMarketDataAdapterWorkflow={openMarketDataAdapterWorkflow}");
    expect(appSource).toContain("onOpenMarketDataAdapterWorkflow?:");
    expect(appSource).toContain("selectProductWorkArea(\"market\")");
    expect(appSource).toContain("onClick={() => onOpenMarketDataAdapterWorkflow(row)}");
    expect(appSource).toContain("打开缓存工作流");
    expect(appSource).toContain("Open cache workflow");
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

  test("renders execution adapter state ledger as a compact settings audit rail", () => {
    expect(appSource).toContain("loadExecutionAdapterLedger(quantCoreBaseUrl)");
    expect(appSource).toContain("buildExecutionAdapterLedgerRows(executionAdapterLedger.adapterLedger)");
    expect(appSource).toContain("adapterLedgerRows={executionAdapterLedgerRows}");
    expect(appSource).toContain('className="adapter-ledger-list"');
    expect(appSource).toContain('className={`adapter-ledger-row');
    expect(appSource).toContain("adapterLedgerAdapterName(i18n, row)");
    expect(appSource).toContain("adapterLedgerGateSummary(i18n, row.gateSummary)");
    expect(appSource).toContain('"ashare-live": "A 股券商接口"');
    expect(appSource).toContain("合法券商适配器认证前，继续阻断 A 股实盘交易。");
    expect(appSource).toContain('gateSummary.replace("gates", "个闸门")');
    expect(styles).toContain(".adapter-ledger-list");
    expect(styles).toContain(".adapter-ledger-row");
  });

  test("renders ccxt sandbox health probe in settings", () => {
    expect(appSource).toContain("loadExecutionAdapterHealthProbe(quantCoreBaseUrl");
    expect(appSource).toContain("buildExecutionAdapterHealthProbeRows(executionAdapterHealthProbe.adapterHealthProbe)");
    expect(appSource).toContain("adapterHealthProbeRows={executionAdapterHealthProbeRows}");
    expect(appSource).toContain("onRefreshAdapterHealthProbe={refreshExecutionAdapterHealthProbe}");
    expect(appSource).toContain("isRefreshingAdapterHealthProbe={isRefreshingAdapterHealthProbe}");
    expect(appSource).toContain("latestRecordedProductionRouteReviewIdForAdapter(");
    expect(appSource).toContain("productionRouteReviewId: latestCcxtProductionRouteReviewId");
    expect(appSource).toContain("adapterHealthProbeRows: ExecutionAdapterHealthProbeRow[]");
    expect(appSource).toContain('className="adapter-health-probe-list"');
    expect(appSource).toContain('className={`adapter-health-probe-row');
    expect(appSource).toContain("adapterHealthProbeRouteReviewSummaryLabel(i18n, row.routeReviewSummary)");
    expect(appSource).toContain('className="adapter-health-probe-checks"');
    expect(styles).toContain(".adapter-health-probe-list");
    expect(styles).toContain(".adapter-health-probe-row");
    expect(styles).toContain(".adapter-health-probe-checks");
  });

  test("renders execution adapter certification evidence controls in settings", () => {
    expect(appSource).toContain("loadExecutionAdapterCertifications(quantCoreBaseUrl");
    expect(appSource).toContain("recordExecutionAdapterCertification(quantCoreBaseUrl");
    expect(appSource).toContain("buildExecutionAdapterCertificationRows(executionAdapterCertifications)");
    expect(appSource).toContain("adapterCertificationRows={executionAdapterCertificationRows}");
    expect(appSource).toContain("onRecordAdapterCertification={recordAdapterCertificationEvidence}");
    expect(appSource).toContain("recordingAdapterCertificationId={recordingAdapterCertificationId}");
    expect(appSource).toContain('className="adapter-certification-button"');
    expect(appSource).toContain('className="adapter-certification-list"');
    expect(appSource).toContain('className={`adapter-certification-row');
    expect(appSource).not.toContain("secret-key");
    expect(styles).toContain(".adapter-certification-button");
    expect(styles).toContain(".adapter-certification-list");
    expect(styles).toContain(".adapter-certification-row");
  });

  test("renders execution adapter certification apply preflight controls in settings", () => {
    expect(appSource).toContain("loadExecutionAdapterCertificationApplies(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterCertificationApplies(applyResults.flatMap((result) => result.certificationApplies))");
    expect(appSource).toContain("recordExecutionAdapterCertificationApply(quantCoreBaseUrl");
    expect(appSource).toContain("buildExecutionAdapterCertificationApplyRows(executionAdapterCertificationApplies)");
    expect(appSource).toContain("adapterCertificationApplyRows={executionAdapterCertificationApplyRows}");
    expect(appSource).toContain("onApplyAdapterCertification={applyAdapterCertificationPreflight}");
    expect(appSource).toContain("applyingAdapterCertificationId={applyingAdapterCertificationId}");
    expect(appSource).toContain('className="adapter-certification-apply-button"');
    expect(appSource).toContain('className="adapter-certification-apply-list"');
    expect(appSource).toContain('className={`adapter-certification-apply-row');
    expect(styles).toContain(".adapter-certification-apply-button");
    expect(styles).toContain(".adapter-certification-apply-list");
    expect(styles).toContain(".adapter-certification-apply-row");
  });

  test("renders execution adapter certification apply confirmation checklist in settings", () => {
    expect(appSource).toContain("buildExecutionAdapterCertificationApplyConfirmationRows(");
    expect(appSource).toContain("createDefaultExecutionAdapterCertificationApplyConfirmations()");
    expect(appSource).toContain("adapterCertificationApplyConfirmations={adapterCertificationApplyConfirmations}");
    expect(appSource).toContain("onApplyConfirmationChange={updateAdapterCertificationApplyConfirmation}");
    expect(appSource).toContain("const confirmations = adapterCertificationApplyConfirmations[row.id]");
    expect(appSource).toContain("confirmations: confirmations");
    expect(appSource).toContain('className="adapter-certification-apply-confirmations"');
    expect(appSource).toContain('className={`adapter-certification-apply-confirmation');
    expect(appSource).toContain('type="checkbox"');
    expect(appSource).toContain("adapterCertificationApplyConfirmationLabel(i18n, confirmation.label)");
    expect(styles).toContain(".adapter-certification-apply-confirmations");
    expect(styles).toContain(".adapter-certification-apply-confirmation");
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
