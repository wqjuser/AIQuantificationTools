import { dailyUseClosureTone } from "../research/workspace-contracts";
import type { DesktopReleaseSummary, DesktopReleaseSummarySource, P0AcceptanceSummary, P0AcceptanceSummarySource, P1AcceptanceSummary, P1AcceptanceSummarySource, P2PaperReplaySummary, P2PaperReplaySummarySource, P2PreLiveAcceptanceSummary, P2PreLiveAcceptanceSummarySource, Stage1BootstrapPreflightSummary, Stage1BootstrapPreflightSummaryCheckSource, Stage1BootstrapPreflightSummarySource, Stage1BootstrapPreflightSummaryState, Stage1DailyUseSummary, Stage1DailyUseSummarySource } from "./foundation-contracts";
import { emptyP2PaperReplayMetrics } from "./manifest-summaries";

export function buildP0AcceptanceSummary(
  acceptance: P0AcceptanceSummarySource | null | undefined
): P0AcceptanceSummary {
  if (!acceptance || acceptance.status === "missing") {
    return {
      state: "missing",
      tone: "warning",
      headline: "P0 acceptance manifest missing",
      detail:
        acceptance?.reason ||
        "Run npm run docker:smoke:p0 -- --no-build --down to generate data/p0-acceptance.json.",
      actionLabel: "Run P0 acceptance smoke",
      targetWorkspaceId: "audit",
      sourcePath: acceptance?.sourcePath || "data/p0-acceptance.json",
      runId: acceptance?.runId ?? null,
      checkCount: acceptance?.checkCount ?? 0,
      requiredCheckCount: acceptance?.requiredCheckCount ?? 4,
      importExportRoundTripReady: false,
      liveTradingAllowed: false,
      reportedLiveTradingAllowed: Boolean(acceptance?.liveTradingAllowed),
      liveBlockedBoundary: Boolean(acceptance?.liveBlockedBoundary)
    };
  }

  if (acceptance.status === "invalid" || acceptance.liveTradingAllowed || !acceptance.liveBlockedBoundary) {
    return {
      state: "invalid",
      tone: "risk",
      headline: "P0 acceptance manifest invalid",
      detail: `P0 acceptance evidence is invalid: ${
        acceptance.reason || acceptance.summary || "unknown validation failure"
      }. Live trading remains blocked.`,
      actionLabel: "Review acceptance manifest",
      targetWorkspaceId: "audit",
      sourcePath: acceptance.sourcePath,
      runId: acceptance.runId,
      checkCount: acceptance.checkCount,
      requiredCheckCount: acceptance.requiredCheckCount,
      importExportRoundTripReady: false,
      liveTradingAllowed: false,
      reportedLiveTradingAllowed: Boolean(acceptance.liveTradingAllowed),
      liveBlockedBoundary: Boolean(acceptance.liveBlockedBoundary)
    };
  }

  const context = [acceptance.market, acceptance.symbol, acceptance.timeframe].filter(Boolean).join(" ");
  const runLabel = acceptance.runId ? `Run ${acceptance.runId}` : "Latest P0 run";
  return {
    state: "passed",
    tone: "positive",
    headline: "P0 acceptance passed",
    detail: `${runLabel} · ${context || "unknown context"} · ${acceptance.checkCount} checks · live blocked.`,
    actionLabel: "Open acceptance manifest",
    targetWorkspaceId: "audit",
    sourcePath: acceptance.sourcePath,
    runId: acceptance.runId,
    checkCount: acceptance.checkCount,
    requiredCheckCount: acceptance.requiredCheckCount,
    importExportRoundTripReady: acceptanceHasImportExportRoundTrip(acceptance.checkIds),
    liveTradingAllowed: false,
    reportedLiveTradingAllowed: Boolean(acceptance.liveTradingAllowed),
    liveBlockedBoundary: Boolean(acceptance.liveBlockedBoundary)
  };
}

export function buildP1AcceptanceSummary(
  acceptance: P1AcceptanceSummarySource | null | undefined
): P1AcceptanceSummary {
  if (!acceptance || acceptance.status === "missing") {
    return {
      state: "missing",
      tone: "warning",
      headline: "P1 acceptance manifest missing",
      detail:
        acceptance?.reason ||
        "Run npm run docker:smoke:p1 -- --no-build --down to generate data/p1-acceptance.json.",
      actionLabel: "Run P1 acceptance smoke",
      targetWorkspaceId: "audit",
      sourcePath: acceptance?.sourcePath || "data/p1-acceptance.json",
      runId: acceptance?.runId ?? null,
      timeframe: acceptance?.timeframe ?? null,
      watchlistRefreshRunId: acceptance?.watchlistRefreshRunId ?? null,
      queuedMarket: acceptance?.queuedMarket ?? null,
      queuedSymbol: acceptance?.queuedSymbol ?? null,
      watchlistCount: acceptance?.watchlistCount ?? 0,
      checkCount: acceptance?.checkCount ?? 0,
      requiredCheckCount: acceptance?.requiredCheckCount ?? 8,
      importExportRoundTripReady: false,
      liveTradingAllowed: false,
      reportedLiveTradingAllowed: Boolean(acceptance?.liveTradingAllowed),
      liveBlockedBoundary: Boolean(acceptance?.liveBlockedBoundary)
    };
  }

  if (acceptance.status === "invalid" || acceptance.liveTradingAllowed || !acceptance.liveBlockedBoundary) {
    return {
      state: "invalid",
      tone: "risk",
      headline: "P1 acceptance manifest invalid",
      detail: `P1 acceptance evidence is invalid: ${
        acceptance.reason || acceptance.summary || "unknown validation failure"
      }. Live trading remains blocked.`,
      actionLabel: "Review P1 acceptance manifest",
      targetWorkspaceId: "audit",
      sourcePath: acceptance.sourcePath,
      runId: acceptance.runId,
      timeframe: acceptance.timeframe,
      watchlistRefreshRunId: acceptance.watchlistRefreshRunId,
      queuedMarket: acceptance.queuedMarket,
      queuedSymbol: acceptance.queuedSymbol,
      watchlistCount: acceptance.watchlistCount,
      checkCount: acceptance.checkCount,
      requiredCheckCount: acceptance.requiredCheckCount,
      importExportRoundTripReady: false,
      liveTradingAllowed: false,
      reportedLiveTradingAllowed: Boolean(acceptance.liveTradingAllowed),
      liveBlockedBoundary: Boolean(acceptance.liveBlockedBoundary)
    };
  }

  const context = [acceptance.queuedMarket, acceptance.queuedSymbol, acceptance.timeframe].filter(Boolean).join(" ");
  const runLabel = acceptance.runId ? `Run ${acceptance.runId}` : "Latest P1 run";
  return {
    state: "passed",
    tone: "positive",
    headline: "P1 research-ops acceptance passed",
    detail: `${runLabel} · ${context || "unknown queued context"} · ${
      acceptance.watchlistCount
    } watchlist instruments · ${acceptance.checkCount} checks · live blocked.`,
    actionLabel: "Open P1 acceptance manifest",
    targetWorkspaceId: "audit",
    sourcePath: acceptance.sourcePath,
    runId: acceptance.runId,
    timeframe: acceptance.timeframe,
    watchlistRefreshRunId: acceptance.watchlistRefreshRunId,
    queuedMarket: acceptance.queuedMarket,
    queuedSymbol: acceptance.queuedSymbol,
    watchlistCount: acceptance.watchlistCount,
    checkCount: acceptance.checkCount,
    requiredCheckCount: acceptance.requiredCheckCount,
    importExportRoundTripReady: acceptanceHasImportExportRoundTrip(acceptance.checkIds),
    liveTradingAllowed: false,
    reportedLiveTradingAllowed: Boolean(acceptance.liveTradingAllowed),
    liveBlockedBoundary: Boolean(acceptance.liveBlockedBoundary)
  };
}

export function acceptanceHasImportExportRoundTrip(checkIds: ReadonlyArray<string>): boolean {
  return ["export", "import", "imported-export"].every((checkId) => checkIds.includes(checkId));
}

export function buildDesktopReleaseSummary(
  release: DesktopReleaseSummarySource | null | undefined
): DesktopReleaseSummary {
  if (!release || release.status === "missing") {
    return {
      state: "missing",
      tone: "warning",
      headline: "Desktop release manifest missing",
      detail:
        release?.reason ||
        "Run npm run desktop:build after the local Tauri/Cargo toolchain check passes, then record data/desktop-release.json.",
      sourceSummary: release?.summary || "Desktop release manifest is missing.",
      actionLabel: "Review desktop build",
      targetWorkspaceId: "settings",
      sourcePath: release?.sourcePath || "data/desktop-release.json",
      generatedAt: release?.generatedAt ?? null,
      platform: release?.platform ?? null,
      version: release?.version ?? null,
      tauriConfigPath: release?.tauriConfigPath ?? null,
      artifactPath: release?.desktopArtifactPath ?? null,
      checkCount: release?.checkCount ?? 0,
      requiredCheckCount: release?.requiredCheckCount ?? 5,
      checkIds: release?.checkIds ?? [],
      liveTradingAllowed: false,
      reportedLiveTradingAllowed: Boolean(release?.liveTradingAllowed),
      liveBlockedBoundary: Boolean(release?.liveBlockedBoundary)
    };
  }

  if (release.status === "invalid" || release.liveTradingAllowed || !release.liveBlockedBoundary) {
    return {
      state: "invalid",
      tone: "risk",
      headline: "Desktop release manifest invalid",
      detail: `Desktop release evidence is invalid: ${
        release.reason || release.summary || "unknown validation failure"
      }. Live trading remains blocked.`,
      sourceSummary: release.summary,
      actionLabel: "Review desktop build",
      targetWorkspaceId: "settings",
      sourcePath: release.sourcePath,
      generatedAt: release.generatedAt,
      platform: release.platform,
      version: release.version,
      tauriConfigPath: release.tauriConfigPath,
      artifactPath: release.desktopArtifactPath,
      checkCount: release.checkCount,
      requiredCheckCount: release.requiredCheckCount,
      checkIds: release.checkIds,
      liveTradingAllowed: false,
      reportedLiveTradingAllowed: Boolean(release.liveTradingAllowed),
      liveBlockedBoundary: Boolean(release.liveBlockedBoundary)
    };
  }

  const platform = release.platform || "local desktop";
  const version = release.version ? `v${release.version}` : "current version";
  return {
    state: "passed",
    tone: "positive",
    headline: "Desktop release passed",
    detail: `${platform} ${version} · ${release.checkCount} checks · live blocked.`,
    sourceSummary: release.summary,
    actionLabel: "Open desktop release manifest",
    targetWorkspaceId: "settings",
    sourcePath: release.sourcePath,
    generatedAt: release.generatedAt,
    platform: release.platform,
    version: release.version,
    tauriConfigPath: release.tauriConfigPath,
    artifactPath: release.desktopArtifactPath,
    checkCount: release.checkCount,
    requiredCheckCount: release.requiredCheckCount,
    checkIds: release.checkIds,
    liveTradingAllowed: false,
    reportedLiveTradingAllowed: Boolean(release.liveTradingAllowed),
    liveBlockedBoundary: Boolean(release.liveBlockedBoundary)
  };
}

export function buildStage1DailyUseSummary(
  report: Stage1DailyUseSummarySource | null | undefined
): Stage1DailyUseSummary | null {
  if (!report) {
    return null;
  }
  const staleSourcePaths = normalizeStage1DailyUseStaleSourcePaths(report);
  const staleSourceSummary = buildStage1DailyUseStaleSourceSummary(staleSourcePaths);
  const unsafeBoundary = Boolean(report.liveTradingAllowed) || !report.liveBlockedBoundary || !report.paperOnly;
  if (report.status === "invalid" || unsafeBoundary) {
    return {
      state: "invalid",
      tone: "risk",
      headline: "Stage 1 daily report invalid",
      detail: `${report.reason || report.summary || "Stage 1 daily-use report failed validation."} Live trading remains blocked.`,
      sourceSummary: report.summary,
      actionLabel: "Run daily self-check",
      targetWorkspaceId: "settings",
      generatedAt: report.generatedAt,
      readyCount: report.readyCount,
      totalCount: report.totalCount,
      sourcePath: report.sourcePath || "data/stage1-daily-use.json",
      staleSourcePaths,
      staleSourceSummary,
      rows: report.rows,
      liveTradingAllowed: false,
      reportedLiveTradingAllowed: Boolean(report.liveTradingAllowed),
      liveBlockedBoundary: Boolean(report.liveBlockedBoundary)
    };
  }
  if (report.status === "missing") {
    return {
      state: "missing",
      tone: "warning",
      headline: "Stage 1 daily report missing",
      detail: report.reason || "Run npm run stage1:daily to generate data/stage1-daily-use.json.",
      sourceSummary: report.summary,
      actionLabel: "Run daily self-check",
      targetWorkspaceId: "settings",
      generatedAt: report.generatedAt,
      readyCount: report.readyCount,
      totalCount: report.totalCount,
      sourcePath: report.sourcePath || "data/stage1-daily-use.json",
      staleSourcePaths,
      staleSourceSummary,
      rows: report.rows,
      liveTradingAllowed: false,
      reportedLiveTradingAllowed: Boolean(report.liveTradingAllowed),
      liveBlockedBoundary: Boolean(report.liveBlockedBoundary)
    };
  }
  const state = report.status;
  const detail = staleSourceSummary ? `${report.summary} ${staleSourceSummary}` : report.summary;
  return {
    state,
    tone: dailyUseClosureTone(state),
    headline:
      staleSourceSummary
        ? `Stage 1 daily report needs refresh (${report.readyCount}/${report.totalCount})`
        : state === "ready"
        ? `Stage 1 daily report ready (${report.readyCount}/${report.totalCount})`
        : state === "blocked"
          ? `Stage 1 daily report blocked (${report.readyCount}/${report.totalCount})`
          : `Stage 1 daily report needs review (${report.readyCount}/${report.totalCount})`,
    detail,
    sourceSummary: detail,
    actionLabel: "Validate daily report",
    targetWorkspaceId: "settings",
    generatedAt: report.generatedAt,
    readyCount: report.readyCount,
    totalCount: report.totalCount,
    sourcePath: report.sourcePath || "data/stage1-daily-use.json",
    staleSourcePaths,
    staleSourceSummary,
    rows: report.rows,
    liveTradingAllowed: false,
    reportedLiveTradingAllowed: Boolean(report.liveTradingAllowed),
    liveBlockedBoundary: Boolean(report.liveBlockedBoundary)
  };
}

export function buildStage1BootstrapPreflightSummary(
  preflight: Stage1BootstrapPreflightSummarySource | null | undefined
): Stage1BootstrapPreflightSummary | null {
  if (!preflight) {
    return null;
  }
  const staleSourcePaths = normalizeStage1BootstrapPreflightStaleSourcePaths(preflight);
  const staleSourceSummary = buildStage1BootstrapPreflightStaleSourceSummary(staleSourcePaths);
  const unsafeBoundary = Boolean(preflight.liveTradingAllowed) || !preflight.liveBlockedBoundary || !preflight.paperOnly;
  const state: Stage1BootstrapPreflightSummaryState =
    preflight.status === "invalid" || unsafeBoundary ? "invalid" : preflight.status;
  const currentCheck =
    preflight.checks.find((check) => preflight.blockerIds.includes(check.id)) ??
    preflight.checks.find((check) => preflight.reviewIds.includes(check.id)) ??
    preflight.checks.find((check) => check.status !== "ready") ??
    null;
  const actionLabel = stage1BootstrapPreflightActionLabel(preflight.nextAction, currentCheck);
  const statusLabel =
    staleSourceSummary
      ? "needs refresh"
      : state === "ready"
      ? "ready"
      : state === "review"
        ? "needs review"
        : state === "missing"
          ? "missing"
          : state === "invalid"
            ? "invalid"
            : "blocked";
  const headline = `Stage 1 bootstrap preflight ${statusLabel} (${preflight.readyCount}/${preflight.totalCount})`;
  const sourceSummary =
    state === "invalid" && unsafeBoundary
      ? "Stage 1 bootstrap preflight failed the paper-only/live-blocked boundary."
      : staleSourceSummary
        ? `${preflight.summary} ${staleSourceSummary}`
        : preflight.summary;
  const currentCheckDetail = currentCheck ? ` Current check: ${currentCheck.label}. ${currentCheck.summary}` : "";
  const detail =
    staleSourceSummary
      ? `${preflight.summary} ${staleSourceSummary}${currentCheckDetail}`
      : state === "missing" || state === "invalid"
        ? `${preflight.reason || sourceSummary} Recommended command: ${preflight.recommendedCommand}.${currentCheckDetail}`
        : `${sourceSummary} Next action: ${actionLabel} (${preflight.recommendedCommand}).${currentCheckDetail}`;
  return {
    state,
    tone: state === "ready" ? "positive" : state === "review" || state === "missing" ? "warning" : "risk",
    headline,
    detail,
    sourceSummary,
    actionLabel,
    targetWorkspaceId: "settings",
    generatedAt: preflight.generatedAt,
    readyCount: preflight.readyCount,
    totalCount: preflight.totalCount,
    sourcePath: preflight.sourcePath || "data/stage1-bootstrap-preflight.json",
    sourcePaths: preflight.sourcePaths,
    staleSourcePaths,
    staleSourceSummary,
    currentCheckId: currentCheck?.id ?? null,
    nextAction: preflight.nextAction,
    recommendedCommand: preflight.recommendedCommand,
    checks: preflight.checks,
    liveTradingAllowed: false,
    reportedLiveTradingAllowed: Boolean(preflight.liveTradingAllowed),
    liveBlockedBoundary: Boolean(preflight.liveBlockedBoundary)
  };
}

export function stage1BootstrapPreflightActionLabel(
  nextAction: string,
  currentCheck: Stage1BootstrapPreflightSummaryCheckSource | null
): string {
  if (nextAction === "open-daily-workbench") {
    return "Open daily workbench";
  }
  if (nextAction === "run-stage1-bootstrap-preflight") {
    return "Run bootstrap preflight";
  }
  if (nextAction === "refresh-stage1-bootstrap-preflight") {
    return "Refresh bootstrap preflight";
  }
  if (nextAction === "run-p0-acceptance") {
    return "Run P0 acceptance";
  }
  if (nextAction === "run-p1-acceptance") {
    return "Run P1 acceptance";
  }
  if (nextAction === "run-desktop-release") {
    return "Run desktop release";
  }
  if (nextAction === "refresh-stage1-daily-use") {
    return "Refresh daily report";
  }
  if (nextAction === "repair-package-scripts") {
    return "Repair package scripts";
  }
  if (nextAction === "review-live-blocked-boundary") {
    return "Review live boundary";
  }
  if (currentCheck) {
    return `Review ${currentCheck.label}`;
  }
  return "Run bootstrap preflight";
}

export function normalizeStage1DailyUseStaleSourcePaths(report: Stage1DailyUseSummarySource): string[] {
  return Array.isArray(report.staleSourcePaths)
    ? report.staleSourcePaths.map((sourcePath) => sourcePath.trim()).filter(Boolean)
    : [];
}

export function buildStage1DailyUseStaleSourceSummary(staleSourcePaths: string[]): string | null {
  if (staleSourcePaths.length === 0) {
    return null;
  }
  return `Stale source manifests: ${staleSourcePaths.join(", ")}. Run npm run stage1:daily to refresh.`;
}

export function normalizeStage1BootstrapPreflightStaleSourcePaths(
  preflight: Stage1BootstrapPreflightSummarySource
): string[] {
  return Array.isArray(preflight.staleSourcePaths)
    ? preflight.staleSourcePaths.map((sourcePath) => sourcePath.trim()).filter(Boolean)
    : [];
}

export function buildStage1BootstrapPreflightStaleSourceSummary(staleSourcePaths: string[]): string | null {
  if (staleSourcePaths.length === 0) {
    return null;
  }
  return `Stale source files: ${staleSourcePaths.join(", ")}. Run npm run stage1:prepare:quick to refresh.`;
}

export function buildP2PreLiveAcceptanceSummary(
  acceptance: P2PreLiveAcceptanceSummarySource | null | undefined
): P2PreLiveAcceptanceSummary {
  if (!acceptance || acceptance.status === "missing") {
    return {
      state: "missing",
      tone: "warning",
      headline: "P2 pre-live acceptance manifest missing",
      detail:
        acceptance?.reason ||
        "Generate data/p2-pre-live-acceptance.json from an audited pre-live checklist before treating the execution route as reviewed.",
      actionLabel: "Review pre-live checklist",
      targetWorkspaceId: "execution",
      sourcePath: acceptance?.sourcePath || "data/p2-pre-live-acceptance.json",
      runId: acceptance?.runId ?? null,
      market: acceptance?.market ?? null,
      symbol: acceptance?.symbol ?? null,
      timeframe: acceptance?.timeframe ?? null,
      adapterId: acceptance?.adapterId ?? null,
      promotionStatus: acceptance?.promotionStatus ?? null,
      checklistStatus: acceptance?.checklistStatus ?? null,
      passedGateCount: acceptance?.passedGateCount ?? 0,
      totalGateCount: acceptance?.totalGateCount ?? 0,
      blockingGateCount: acceptance?.blockingGateCount ?? 0,
      blockerIds: acceptance?.blockerIds ?? [],
      auditEventIds: acceptance?.auditEventIds ?? [],
      checkCount: acceptance?.checkCount ?? 0,
      requiredCheckCount: acceptance?.requiredCheckCount ?? 6,
      manualRouteCandidate: Boolean(acceptance?.manualRouteCandidate),
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      reportedOrderSubmissionEnabled: Boolean(acceptance?.orderSubmissionEnabled),
      reportedLiveTradingAllowed: Boolean(acceptance?.liveTradingAllowed),
      reportedLiveOrderSubmitted: Boolean(acceptance?.liveOrderSubmitted),
      reportedRouteExecuted: Boolean(acceptance?.routeExecuted),
      liveBlockedBoundary: Boolean(acceptance?.liveBlockedBoundary)
    };
  }

  const unsafeExecutionClaim =
    acceptance.status === "invalid" ||
    acceptance.orderSubmissionEnabled ||
    acceptance.liveTradingAllowed ||
    acceptance.liveOrderSubmitted ||
    acceptance.routeExecuted ||
    !acceptance.liveBlockedBoundary;
  if (unsafeExecutionClaim) {
    return {
      state: "invalid",
      tone: "risk",
      headline: "P2 pre-live acceptance manifest invalid",
      detail: `P2 pre-live evidence is invalid: ${
        acceptance.reason || acceptance.summary || "unknown validation failure"
      }. Direct order submission remains disabled and live trading remains blocked.`,
      actionLabel: "Review P2 pre-live manifest",
      targetWorkspaceId: "audit",
      sourcePath: acceptance.sourcePath,
      runId: acceptance.runId,
      market: acceptance.market,
      symbol: acceptance.symbol,
      timeframe: acceptance.timeframe,
      adapterId: acceptance.adapterId,
      promotionStatus: acceptance.promotionStatus,
      checklistStatus: acceptance.checklistStatus,
      passedGateCount: acceptance.passedGateCount,
      totalGateCount: acceptance.totalGateCount,
      blockingGateCount: acceptance.blockingGateCount,
      blockerIds: acceptance.blockerIds,
      auditEventIds: acceptance.auditEventIds,
      checkCount: acceptance.checkCount,
      requiredCheckCount: acceptance.requiredCheckCount,
      manualRouteCandidate: Boolean(acceptance.manualRouteCandidate),
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      reportedOrderSubmissionEnabled: Boolean(acceptance.orderSubmissionEnabled),
      reportedLiveTradingAllowed: Boolean(acceptance.liveTradingAllowed),
      reportedLiveOrderSubmitted: Boolean(acceptance.liveOrderSubmitted),
      reportedRouteExecuted: Boolean(acceptance.routeExecuted),
      liveBlockedBoundary: Boolean(acceptance.liveBlockedBoundary)
    };
  }

  const context = [acceptance.market, acceptance.symbol, acceptance.timeframe].filter(Boolean).join(" ");
  const runLabel = acceptance.runId ? `Run ${acceptance.runId}` : "Latest P2 pre-live run";
  const adapterLabel = acceptance.adapterId ? ` · adapter ${acceptance.adapterId}` : "";
  return {
    state: "passed",
    tone: "positive",
    headline: "P2 pre-live acceptance recorded",
    detail: `${runLabel} · ${context || "unknown context"}${adapterLabel} · ${
      acceptance.passedGateCount
    }/${acceptance.totalGateCount} gates · ${acceptance.blockingGateCount} blockers · live blocked.`,
    actionLabel: "Open P2 pre-live manifest",
    targetWorkspaceId: "audit",
    sourcePath: acceptance.sourcePath,
    runId: acceptance.runId,
    market: acceptance.market,
    symbol: acceptance.symbol,
    timeframe: acceptance.timeframe,
    adapterId: acceptance.adapterId,
    promotionStatus: acceptance.promotionStatus,
    checklistStatus: acceptance.checklistStatus,
    passedGateCount: acceptance.passedGateCount,
    totalGateCount: acceptance.totalGateCount,
    blockingGateCount: acceptance.blockingGateCount,
    blockerIds: acceptance.blockerIds,
    auditEventIds: acceptance.auditEventIds,
    checkCount: acceptance.checkCount,
    requiredCheckCount: acceptance.requiredCheckCount,
    manualRouteCandidate: Boolean(acceptance.manualRouteCandidate),
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    reportedOrderSubmissionEnabled: Boolean(acceptance.orderSubmissionEnabled),
    reportedLiveTradingAllowed: Boolean(acceptance.liveTradingAllowed),
    reportedLiveOrderSubmitted: Boolean(acceptance.liveOrderSubmitted),
    reportedRouteExecuted: Boolean(acceptance.routeExecuted),
    liveBlockedBoundary: Boolean(acceptance.liveBlockedBoundary)
  };
}

export function buildP2PaperReplaySummary(
  replay: P2PaperReplaySummarySource | null | undefined
): P2PaperReplaySummary {
  if (!replay || replay.status === "missing") {
    return {
      state: "missing",
      tone: "warning",
      headline: "P2 paper replay manifest missing",
      detail:
        replay?.reason ||
        "Generate data/p2-paper-replay.json from aligned paper execution evidence before treating replay as portable.",
      actionLabel: "Review paper replay gate",
      targetWorkspaceId: "execution",
      sourcePath: replay?.sourcePath || "data/p2-paper-replay.json",
      runId: replay?.runId ?? null,
      market: replay?.market ?? null,
      symbol: replay?.symbol ?? null,
      timeframe: replay?.timeframe ?? null,
      adapterId: replay?.adapterId ?? null,
      replayStatus: replay?.replayStatus ?? null,
      passedCheckCount: replay?.passedCheckCount ?? 0,
      totalCheckCount: replay?.totalCheckCount ?? 0,
      warningCount: replay?.warningCount ?? 0,
      requiredCheckCount: replay?.requiredCheckCount ?? 8,
      checkCount: replay?.checkCount ?? 0,
      checkIds: replay?.checkIds ?? [],
      auditEventIds: replay?.auditEventIds ?? [],
      latestEvidenceId: replay?.latestEvidenceId ?? null,
      metrics: replay?.metrics ?? emptyP2PaperReplayMetrics(),
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      reportedOrderSubmissionEnabled: Boolean(replay?.orderSubmissionEnabled),
      reportedLiveTradingAllowed: Boolean(replay?.liveTradingAllowed),
      reportedLiveOrderSubmitted: Boolean(replay?.liveOrderSubmitted),
      reportedRouteExecuted: Boolean(replay?.routeExecuted),
      liveBlockedBoundary: Boolean(replay?.liveBlockedBoundary)
    };
  }

  const unsafeExecutionClaim =
    replay.status === "invalid" ||
    replay.orderSubmissionEnabled ||
    replay.liveTradingAllowed ||
    replay.liveOrderSubmitted ||
    replay.routeExecuted ||
    !replay.liveBlockedBoundary;
  if (unsafeExecutionClaim) {
    return {
      state: "invalid",
      tone: "risk",
      headline: "P2 paper replay manifest invalid",
      detail: `P2 paper replay evidence is invalid: ${
        replay.reason || replay.summary || "unknown validation failure"
      }. Live trading remains blocked and direct order submission stays disabled.`,
      actionLabel: "Review replay manifest",
      targetWorkspaceId: "audit",
      sourcePath: replay.sourcePath,
      runId: replay.runId,
      market: replay.market,
      symbol: replay.symbol,
      timeframe: replay.timeframe,
      adapterId: replay.adapterId,
      replayStatus: replay.replayStatus,
      passedCheckCount: replay.passedCheckCount,
      totalCheckCount: replay.totalCheckCount,
      warningCount: replay.warningCount,
      requiredCheckCount: replay.requiredCheckCount,
      checkCount: replay.checkCount,
      checkIds: replay.checkIds,
      auditEventIds: replay.auditEventIds,
      latestEvidenceId: replay.latestEvidenceId,
      metrics: replay.metrics,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      reportedOrderSubmissionEnabled: Boolean(replay.orderSubmissionEnabled),
      reportedLiveTradingAllowed: Boolean(replay.liveTradingAllowed),
      reportedLiveOrderSubmitted: Boolean(replay.liveOrderSubmitted),
      reportedRouteExecuted: Boolean(replay.routeExecuted),
      liveBlockedBoundary: Boolean(replay.liveBlockedBoundary)
    };
  }

  const context = [replay.market, replay.symbol, replay.timeframe].filter(Boolean).join(" ");
  const runLabel = replay.runId ? `Run ${replay.runId}` : "Latest P2 replay run";
  const adapterLabel = replay.adapterId ? ` · adapter ${replay.adapterId}` : "";
  const evidenceLabel = replay.latestEvidenceId ? ` · latest evidence ${replay.latestEvidenceId}` : "";
  return {
    state: "passed",
    tone: "positive",
    headline: "P2 paper replay manifest recorded",
    detail: `${runLabel} · ${context || "unknown context"}${adapterLabel} · ${
      replay.passedCheckCount
    }/${replay.totalCheckCount} checks · ${replay.warningCount} warnings${evidenceLabel} · live blocked.`,
    actionLabel: "Open replay manifest",
    targetWorkspaceId: "execution",
    sourcePath: replay.sourcePath,
    runId: replay.runId,
    market: replay.market,
    symbol: replay.symbol,
    timeframe: replay.timeframe,
    adapterId: replay.adapterId,
    replayStatus: replay.replayStatus,
    passedCheckCount: replay.passedCheckCount,
    totalCheckCount: replay.totalCheckCount,
    warningCount: replay.warningCount,
    requiredCheckCount: replay.requiredCheckCount,
    checkCount: replay.checkCount,
    checkIds: replay.checkIds,
    auditEventIds: replay.auditEventIds,
    latestEvidenceId: replay.latestEvidenceId,
    metrics: replay.metrics,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    reportedOrderSubmissionEnabled: Boolean(replay.orderSubmissionEnabled),
    reportedLiveTradingAllowed: Boolean(replay.liveTradingAllowed),
    reportedLiveOrderSubmitted: Boolean(replay.liveOrderSubmitted),
    reportedRouteExecuted: Boolean(replay.routeExecuted),
    liveBlockedBoundary: Boolean(replay.liveBlockedBoundary)
  };
}
