import { auditReportLedgerProductWorkAreaId } from "../research-package/import-audit";
import { sha256TextHex } from "../research/readiness-builders";
import { buildDailyUseCleanOpenRow, buildDailyUseDailyStartRow, buildDailyUseDesktopReleaseRow, buildDailyUseMarketRefreshRecoveryRow, buildDailyUseReportBackedRow, buildDailyUseResearchEntryRow, dailyUseClosureHeadline, dailyUseClosureTone } from "../research/workspace-contracts";
import type { Stage1P0DailyUseClosure, Stage1P0DailyUseClosureInput, Stage1P0DailyUseClosureRow, Stage1P0DailyUseClosureRowDraft, Stage1P0DailyUseClosureStatus, Stage1P0DailyUseRefreshOutcome, Stage1P0DailyUseRefreshOutcomeEntry, Stage1P0DailyUseRefreshOutcomeInput, Stage1P0DailyUseRefreshOutcomeSource, Stage1P0DailyUseRefreshOutcomeState, Stage1P0DailyUseRefreshReceiptFocus, Stage1P0DailyUseShareDeepLinkState, Stage1P0DailyUseShareDeepLinkStatus, Stage1P0DailyUseShareFocus } from "./archive-contracts";
import type { DesktopReleaseSummaryState, ProductWorkAreaId, Stage1BootstrapPreflightSummaryCheckSource, Stage1BootstrapPreflightSummarySource, Stage1BootstrapPreflightSummaryState, Stage1DailyUseSummaryState } from "./foundation-contracts";

export function buildStage1P0ShareLinkBundleCopyText({
  closure,
  refreshOutcome = null,
  resolveShareUrl = (workspaceLink) => workspaceLink
}: {
  closure: {
    primaryActionLabel: string;
    primaryTargetWorkspaceId: string;
    primaryWorkspaceLink: string;
    readyCount: number;
    rows: readonly {
      label: string;
      status: string;
      targetWorkspaceId: string;
      workspaceLink: string;
    }[];
    state: string;
    totalCount: number;
  };
  refreshOutcome?: {
    actionLabel: string;
    entries: readonly {
      label: string;
      source: string;
      status: string;
      targetWorkspaceId: string;
      workspaceLink: string;
    }[];
    state: string;
    targetWorkspaceId: string;
    targetWorkspaceLink: string;
  } | null;
  resolveShareUrl?: (workspaceLink: string) => string;
}): string {
  const linkFor = (workspaceLink: string): string => {
    try {
      return resolveShareUrl(workspaceLink)?.trim() || workspaceLink || "none";
    } catch {
      return workspaceLink || "none";
    }
  };
  const refreshLines = refreshOutcome
    ? [
        `Refresh receipt state: ${refreshOutcome.state}`,
        `Refresh next action: ${refreshOutcome.actionLabel} -> ${refreshOutcome.targetWorkspaceId}`,
        `Refresh next link: ${linkFor(refreshOutcome.targetWorkspaceLink)}`,
        "Refresh receipt links:",
        ...refreshOutcome.entries.map(
          (entry) =>
            `- ${entry.label} [${entry.status}/${entry.source}] -> ${entry.targetWorkspaceId}: ${linkFor(
              entry.workspaceLink
            )}`
        )
      ]
    : ["Refresh receipt links: none"];
  return [
    "# Stage 1/P0 Share Link Bundle",
    `Daily state: ${closure.state}`,
    `Ready: ${closure.readyCount}/${closure.totalCount}`,
    `Primary action: ${closure.primaryActionLabel} -> ${closure.primaryTargetWorkspaceId}`,
    `Primary link: ${linkFor(closure.primaryWorkspaceLink)}`,
    "Daily-use links:",
    ...closure.rows.map(
      (row) => `- ${row.label} [${row.status}] -> ${row.targetWorkspaceId}: ${linkFor(row.workspaceLink)}`
    ),
    "",
    ...refreshLines,
    "",
    "Live trading remains blocked."
  ].join("\n");
}

export function buildStage1P0RecoveredShareContextCopyText({
  resolveShareUrl,
  shareDeepLinkState
}: {
  resolveShareUrl: (workspaceLink: string) => string;
  shareDeepLinkState?: Stage1P0DailyUseShareDeepLinkState | null;
}): string {
  if (!shareDeepLinkState) {
    return "No recovered share link is active.";
  }
  const search =
    shareDeepLinkState.kind === "daily-use"
      ? buildStage1P0DailyUseShareUrlSearch({
          focus: shareDeepLinkState.focus,
          targetWorkspaceId: shareDeepLinkState.targetWorkspaceId
        })
      : buildStage1P0DailyUseRefreshReceiptUrlSearch({
          focus: shareDeepLinkState.focus,
          targetWorkspaceId: shareDeepLinkState.targetWorkspaceId
        });
  const workspaceLink = search ? `?${search}` : "";
  let shareLink = workspaceLink || "none";
  if (workspaceLink) {
    try {
      shareLink = resolveShareUrl(workspaceLink)?.trim() || workspaceLink;
    } catch {
      shareLink = workspaceLink;
    }
  }
  return [
    "Recovered share link: active",
    `Share kind: ${shareDeepLinkState.kind}`,
    `Share focus: ${shareDeepLinkState.focus}`,
    `Share target workspace: ${shareDeepLinkState.targetWorkspaceId}`,
    `Share link: ${shareLink}`
  ].join("\n");
}

export function buildStage1P0DailyUseArchiveFileName({
  closure,
  invalidShareStatus = null,
  shareDeepLinkState = null
}: {
  closure: Pick<Parameters<typeof buildStage1P0ShareLinkBundleCopyText>[0]["closure"], "readyCount" | "state" | "totalCount">;
  invalidShareStatus?: Stage1P0DailyUseShareDeepLinkStatus | null;
  shareDeepLinkState?: Stage1P0DailyUseShareDeepLinkState | null;
}): string {
  const segments = [
    "stage1",
    "p0",
    "daily",
    "use",
    "archive",
    closure.state,
    `${closure.readyCount}-of-${closure.totalCount}`
  ];
  if (shareDeepLinkState) {
    segments.push(shareDeepLinkState.kind, String(shareDeepLinkState.focus), shareDeepLinkState.targetWorkspaceId);
  } else if (invalidShareStatus?.status === "invalid") {
    segments.push("invalid", "share", invalidShareStatus.reason);
  } else {
    segments.push("no", "share");
  }
  return `${segments.map(stage1P0DailyUseArchiveFileNameToken).join("-")}.md`;
}

export function stage1P0DailyUseArchiveFileNameToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

export interface Stage1P0DailyUseArchiveBundle {
  bodySha256: {
    algorithm: "sha256";
    hash: string;
  };
  contentMarkdown: string;
  fileName: string;
}

export function buildStage1P0DailyUseArchiveCopyText({
  archiveBodySha256 = null,
  closure,
  invalidShareDiagnosticsCopyText = null,
  invalidShareStatus = null,
  refreshOutcome = null,
  resolveShareUrl = (workspaceLink) => workspaceLink,
  shareDeepLinkState = null
}: {
  closure: Parameters<typeof buildStage1P0ShareLinkBundleCopyText>[0]["closure"] & {
    copyText: string;
  };
  archiveBodySha256?: string | null;
  invalidShareDiagnosticsCopyText?: string | null;
  invalidShareStatus?: Stage1P0DailyUseShareDeepLinkStatus | null;
  refreshOutcome?: (NonNullable<Parameters<typeof buildStage1P0ShareLinkBundleCopyText>[0]["refreshOutcome"]> & {
    copyText: string;
  }) | null;
  resolveShareUrl?: (workspaceLink: string) => string;
  shareDeepLinkState?: Stage1P0DailyUseShareDeepLinkState | null;
}): string {
  const refreshReceiptText = refreshOutcome?.copyText?.trim() || "Refresh receipt: not generated in this browser session.";
  const invalidDiagnosticsText = invalidShareDiagnosticsCopyText?.trim() || "No invalid share link is active.";
  const refreshReceiptState = refreshOutcome?.state ?? "not-generated";
  const invalidDiagnosticsState = invalidShareDiagnosticsCopyText?.trim() ? "included" : "none";
  const shareContextState = shareDeepLinkState
    ? `${shareDeepLinkState.kind}/${shareDeepLinkState.focus} -> ${shareDeepLinkState.targetWorkspaceId}`
    : "none";
  const suggestedFileName = buildStage1P0DailyUseArchiveFileName({
    closure,
    invalidShareStatus,
    shareDeepLinkState
  });
  const recoveredShareContextText = buildStage1P0RecoveredShareContextCopyText({
    resolveShareUrl,
    shareDeepLinkState
  });
  return [
    "# Stage 1/P0 Daily Use Archive",
    "",
    "Archive summary:",
    `- Daily state: ${closure.state} (${closure.readyCount}/${closure.totalCount} ready)`,
    `- Suggested file name: ${suggestedFileName}`,
    ...(archiveBodySha256 ? [`- Archive body SHA-256: ${archiveBodySha256}`] : []),
    `- Primary action: ${closure.primaryActionLabel} -> ${closure.primaryTargetWorkspaceId}`,
    `- Refresh receipt: ${refreshReceiptState}`,
    `- Recovered share context: ${shareContextState}`,
    `- Invalid share diagnostics: ${invalidDiagnosticsState}`,
    "",
    "Archive contents:",
    "- Daily Handoff",
    "- Share Link Bundle",
    "- Recovered Share Context",
    "- Refresh Receipt",
    "- Invalid Share Diagnostics",
    "",
    "## Daily Handoff",
    closure.copyText.trim(),
    "",
    "## Share Link Bundle",
    buildStage1P0ShareLinkBundleCopyText({ closure, refreshOutcome, resolveShareUrl }),
    "",
    "## Recovered Share Context",
    recoveredShareContextText,
    "",
    "## Refresh Receipt",
    refreshReceiptText,
    "",
    "## Invalid Share Diagnostics",
    invalidDiagnosticsText,
    "",
    "Live trading remains blocked."
  ].join("\n");
}

export async function buildStage1P0DailyUseArchiveBundle(
  input: Parameters<typeof buildStage1P0DailyUseArchiveCopyText>[0]
): Promise<Stage1P0DailyUseArchiveBundle> {
  const bodyMarkdown = buildStage1P0DailyUseArchiveCopyText(input);
  const bodyHash = await sha256TextHex(bodyMarkdown);
  return {
    bodySha256: {
      algorithm: "sha256",
      hash: bodyHash
    },
    contentMarkdown: buildStage1P0DailyUseArchiveCopyText({
      ...input,
      archiveBodySha256: bodyHash
    }),
    fileName: buildStage1P0DailyUseArchiveFileName({
      closure: input.closure,
      invalidShareStatus: input.invalidShareStatus,
      shareDeepLinkState: input.shareDeepLinkState
    })
  };
}

export const stage1P0DailyUseShareFocuses: readonly Stage1P0DailyUseShareFocus[] = [
  "primary",
  "clean-open",
  "market-refresh-recovery",
  "research-entry",
  "daily-start",
  "desktop-release"
];

export const stage1P0DailyUseRefreshReceiptFocuses: readonly Stage1P0DailyUseRefreshReceiptFocus[] = [
  "next",
  "daily-use",
  "bootstrap-preflight",
  "desktop-release"
];

export function stage1P0DailyUseShareFocus(value: string | null | undefined): Stage1P0DailyUseShareFocus | null {
  const normalized = value?.trim() ?? "";
  return stage1P0DailyUseShareFocuses.includes(normalized as Stage1P0DailyUseShareFocus)
    ? (normalized as Stage1P0DailyUseShareFocus)
    : null;
}

export function stage1P0DailyUseRefreshReceiptFocus(
  value: string | null | undefined
): Stage1P0DailyUseRefreshReceiptFocus | null {
  const normalized = value?.trim() ?? "";
  return stage1P0DailyUseRefreshReceiptFocuses.includes(normalized as Stage1P0DailyUseRefreshReceiptFocus)
    ? (normalized as Stage1P0DailyUseRefreshReceiptFocus)
    : null;
}

export function buildStage1P0DailyUseShareUrlSearch(input: {
  focus: Stage1P0DailyUseShareFocus | string | null | undefined;
  targetWorkspaceId: ProductWorkAreaId | string | null | undefined;
}): string | null {
  const targetWorkspaceId = auditReportLedgerProductWorkAreaId(input.targetWorkspaceId?.trim() ?? "");
  const focus = stage1P0DailyUseShareFocus(input.focus);
  if (!targetWorkspaceId || !focus) {
    return null;
  }
  const params = new URLSearchParams();
  params.set("workspace", targetWorkspaceId);
  params.set("stage1DailyUseFocus", focus);
  return params.toString();
}

export function buildStage1P0DailyUseRefreshReceiptUrlSearch(input: {
  focus: Stage1P0DailyUseRefreshReceiptFocus | string | null | undefined;
  targetWorkspaceId: ProductWorkAreaId | string | null | undefined;
}): string | null {
  const targetWorkspaceId = auditReportLedgerProductWorkAreaId(input.targetWorkspaceId?.trim() ?? "");
  const focus = stage1P0DailyUseRefreshReceiptFocus(input.focus);
  if (!targetWorkspaceId || !focus) {
    return null;
  }
  const params = new URLSearchParams();
  params.set("workspace", targetWorkspaceId);
  params.set("stage1RefreshReceiptFocus", focus);
  return params.toString();
}

export function resolveStage1P0DailyUseShareDeepLinkState(
  search: string | URLSearchParams | null | undefined
): Stage1P0DailyUseShareDeepLinkState | null {
  const status = resolveStage1P0DailyUseShareDeepLinkStatus(search);
  return status.status === "ready" ? status.state : null;
}

export function resolveStage1P0DailyUseShareDeepLinkStatus(
  search: string | URLSearchParams | null | undefined
): Stage1P0DailyUseShareDeepLinkStatus {
  if (!search) {
    return { reason: null, state: null, status: "none" };
  }
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const dailyFocusValues = params.getAll("stage1DailyUseFocus");
  const refreshFocusValues = params.getAll("stage1RefreshReceiptFocus");
  const focusCount = dailyFocusValues.length + refreshFocusValues.length;
  if (focusCount === 0) {
    return { reason: null, state: null, status: "none" };
  }

  const workspaceValues = params.getAll("workspace");
  if (workspaceValues.length === 0) {
    return { reason: "missing-workspace", state: null, status: "invalid" };
  }
  if (workspaceValues.length > 1) {
    return { reason: "duplicate-workspace", state: null, status: "invalid" };
  }
  if (focusCount !== 1) {
    return { reason: "ambiguous-focus", state: null, status: "invalid" };
  }

  const targetWorkspaceId = auditReportLedgerProductWorkAreaId(params.get("workspace")?.trim() ?? "");
  if (!targetWorkspaceId) {
    return { reason: "invalid-workspace", state: null, status: "invalid" };
  }
  if (dailyFocusValues.length === 1) {
    const focus = stage1P0DailyUseShareFocus(dailyFocusValues[0]);
    return focus
      ? { reason: null, state: { focus, kind: "daily-use", targetWorkspaceId }, status: "ready" }
      : { reason: "invalid-daily-focus", state: null, status: "invalid" };
  }
  const focus = stage1P0DailyUseRefreshReceiptFocus(refreshFocusValues[0]);
  return focus
    ? { reason: null, state: { focus, kind: "refresh-receipt", targetWorkspaceId }, status: "ready" }
    : { reason: "invalid-refresh-focus", state: null, status: "invalid" };
}

export function buildStage1P0DailyUseClosure({
  bootstrapPreflight = null,
  dailyStartBrief,
  dailyUseReport = null,
  desktopBuildReady = false,
  desktopRelease = null,
  marketRefreshGuard,
  p0Acceptance,
  p1Acceptance,
  researchReadinessRows
}: Stage1P0DailyUseClosureInput): Stage1P0DailyUseClosure {
  const researchIssue =
    researchReadinessRows.find((row) => row.status === "blocked") ??
    researchReadinessRows.find((row) => row.status === "review") ??
    null;
  const rowDrafts: Stage1P0DailyUseClosureRowDraft[] = [
    buildDailyUseCleanOpenRow(p0Acceptance, p1Acceptance, dailyUseReport, bootstrapPreflight),
    buildDailyUseReportBackedRow(
      dailyUseReport,
      "market-refresh-recovery",
      () => buildDailyUseMarketRefreshRecoveryRow(marketRefreshGuard),
      {
        label: "Market refresh recovery",
        readyActionId: "refresh-cache",
        reviewActionId: "refresh-cache",
        blockedActionId: "review-provider-cooldown",
        readyActionLabel: "Validate daily report",
        reviewActionLabel: "Review refresh evidence",
        blockedActionLabel: "Review cooldown",
        targetWorkspaceId: "market"
      }
    ),
    buildDailyUseReportBackedRow(
      dailyUseReport,
      "research-entry",
      () => buildDailyUseResearchEntryRow(researchIssue),
      {
        label: "Research entry",
        readyActionId: "open-research-entry",
        reviewActionId: "refresh-cache",
        blockedActionId: "refresh-cache",
        readyActionLabel: "Open research",
        reviewActionLabel: "Review research entry",
        blockedActionLabel: "Refresh cache",
        targetWorkspaceId: "research"
      }
    ),
    buildDailyUseReportBackedRow(
      dailyUseReport,
      "daily-start",
      () => buildDailyUseDailyStartRow(dailyStartBrief),
      {
        label: "Daily start path",
        readyActionId: "open-daily-start",
        reviewActionId: "record-daily-start-review",
        blockedActionId: "record-daily-start-review",
        readyActionLabel: "Open daily start",
        reviewActionLabel: "Review daily start",
        blockedActionLabel: "Review daily start",
        targetWorkspaceId: "research"
      }
    ),
    buildDailyUseDesktopReleaseRow(desktopRelease, desktopBuildReady, dailyUseReport)
  ];
  const rows = rowDrafts.map(withStage1P0DailyUseWorkspaceLink);
  const readyCount = rows.filter((row) => row.status === "ready").length;
  const primaryRow = rows.find((row) => row.status === "blocked") ?? rows.find((row) => row.status === "review") ?? rows[0];
  const state: Stage1P0DailyUseClosureStatus = rows.some((row) => row.status === "blocked")
    ? "blocked"
    : rows.some((row) => row.status === "review")
      ? "review"
      : "ready";
  const staleSourceSummary = dailyUseReport?.staleSourceSummary ?? null;
  const bootstrapPreflightStaleSourcePaths = bootstrapPreflight?.staleSourcePaths ?? [];
  const bootstrapPreflightStaleSourceSummary = bootstrapPreflight?.staleSourceSummary ?? null;
  const bootstrapPreflightSummary = bootstrapPreflight ? bootstrapPreflight.headline : null;
  return {
    state,
    tone: dailyUseClosureTone(state),
    headline: dailyUseClosureHeadline(primaryRow),
    detail: dailyUseReport
      ? [
          bootstrapPreflightSummary,
          bootstrapPreflightStaleSourceSummary,
          dailyUseReport.headline,
          staleSourceSummary,
          rows.map((row) => `${row.label}: ${row.value}`).join(" · ")
        ]
          .filter(Boolean)
          .join(" · ")
      : [
          bootstrapPreflightSummary,
          bootstrapPreflightStaleSourceSummary,
          rows.map((row) => `${row.label}: ${row.value}`).join(" · ")
        ]
          .filter(Boolean)
          .join(" · "),
    copyText: buildStage1P0DailyUseClosureCopyText({
      bootstrapPreflightChecks: bootstrapPreflight?.checks ?? [],
      bootstrapPreflightSourcePaths: bootstrapPreflight?.sourcePaths ?? null,
      bootstrapPreflightStaleSourcePaths,
      primaryActionLabel: primaryRow.actionLabel,
      primaryWorkspaceLink: stage1P0DailyUseWorkspaceLink(primaryRow.targetWorkspaceId, "primary"),
      primaryTargetWorkspaceId: primaryRow.targetWorkspaceId,
      readyCount,
      rows,
      staleSourcePaths: dailyUseReport?.staleSourcePaths ?? [],
      state,
      totalCount: rows.length
    }),
    readyCount,
    totalCount: rows.length,
    primaryActionId: primaryRow.actionId,
    primaryActionLabel: primaryRow.actionLabel,
    primaryTargetWorkspaceId: primaryRow.targetWorkspaceId,
    primaryWorkspaceLink: stage1P0DailyUseWorkspaceLink(primaryRow.targetWorkspaceId, "primary"),
    bootstrapPreflightChecks: bootstrapPreflight?.checks ?? [],
    bootstrapPreflightSourcePaths: bootstrapPreflight?.sourcePaths,
    bootstrapPreflightStaleSourcePaths,
    bootstrapPreflightStaleSourceSummary,
    staleSourcePaths: dailyUseReport?.staleSourcePaths ?? [],
    staleSourceSummary,
    rows
  };
}

export function buildStage1P0DailyUseClosureCopyText({
  bootstrapPreflightChecks,
  bootstrapPreflightSourcePaths,
  bootstrapPreflightStaleSourcePaths,
  primaryActionLabel,
  primaryTargetWorkspaceId,
  primaryWorkspaceLink,
  readyCount,
  rows,
  staleSourcePaths,
  state,
  totalCount
}: {
  bootstrapPreflightChecks: Stage1BootstrapPreflightSummaryCheckSource[];
  bootstrapPreflightSourcePaths: Stage1BootstrapPreflightSummarySource["sourcePaths"] | null;
  bootstrapPreflightStaleSourcePaths: string[];
  primaryActionLabel: string;
  primaryTargetWorkspaceId: ProductWorkAreaId;
  primaryWorkspaceLink: string;
  readyCount: number;
  rows: Stage1P0DailyUseClosureRow[];
  staleSourcePaths: string[];
  state: Stage1P0DailyUseClosureStatus;
  totalCount: number;
}): string {
  const bootstrapEvidenceLines = buildStage1BootstrapPreflightEvidenceLines(
    bootstrapPreflightChecks,
    bootstrapPreflightSourcePaths
  );
  return [
    "# Stage 1/P0 Daily Use Handoff",
    `State: ${state}`,
    `Ready: ${readyCount}/${totalCount}`,
    `Primary action: ${primaryActionLabel} -> ${primaryTargetWorkspaceId}`,
    `Primary link: ${primaryWorkspaceLink}`,
    `Stale daily-use sources: ${staleSourcePaths.length > 0 ? staleSourcePaths.join(", ") : "none"}`,
    `Stale bootstrap preflight sources: ${
      bootstrapPreflightStaleSourcePaths.length > 0 ? bootstrapPreflightStaleSourcePaths.join(", ") : "none"
    }`,
    "",
    ...rows.map((row) => `- ${row.label} [${row.status}]: ${row.detail} (link: ${row.workspaceLink})`),
    "",
    "## Bootstrap Preflight Evidence",
    ...bootstrapEvidenceLines,
    "",
    "Live trading remains blocked."
  ].join("\n");
}

export function buildStage1BootstrapPreflightEvidenceLines(
  checks: readonly Stage1BootstrapPreflightSummaryCheckSource[] = [],
  sourcePaths?: Stage1BootstrapPreflightSummarySource["sourcePaths"] | null
): string[] {
  const checkLines = checks.length
    ? checks.map((check) => `- ${check.id}: ${check.status} · ${check.label} · ${check.sourcePath}`)
    : ["- No bootstrap preflight checks loaded."];
  return [
    `- P2 chain source: ${sourcePaths?.p2ManifestChainPreflight || "data/p2-chain-preflight.json"}`,
    ...checkLines
  ];
}

export function stage1P0DailyUseWorkspaceLink(workspaceId: ProductWorkAreaId, focus: Stage1P0DailyUseShareFocus): string {
  const search = buildStage1P0DailyUseShareUrlSearch({ focus, targetWorkspaceId: workspaceId });
  return search ? `?${search}` : `?workspace=${workspaceId}`;
}

export function withStage1P0DailyUseWorkspaceLink(
  row: Stage1P0DailyUseClosureRowDraft
): Stage1P0DailyUseClosureRow {
  return {
    ...row,
    workspaceLink: stage1P0DailyUseWorkspaceLink(row.targetWorkspaceId, row.id)
  };
}

export function stage1P0DailyUseRefreshReceiptWorkspaceLink(
  workspaceId: ProductWorkAreaId,
  focus: Stage1P0DailyUseRefreshReceiptFocus
): string {
  const search = buildStage1P0DailyUseRefreshReceiptUrlSearch({ focus, targetWorkspaceId: workspaceId });
  return search ? `?${search}` : `?workspace=${workspaceId}`;
}

export function buildStage1P0DailyUseRefreshOutcome({
  bootstrapPreflight,
  bootstrapPreflightError = null,
  bootstrapPreflightSource,
  dailyUseError = null,
  dailyUseReport,
  dailyUseSource,
  desktopRelease,
  desktopReleaseError = null,
  desktopReleaseSource
}: Stage1P0DailyUseRefreshOutcomeInput): Stage1P0DailyUseRefreshOutcome {
  const entries: Stage1P0DailyUseRefreshOutcomeEntry[] = [
    buildStage1P0DailyUseRefreshOutcomeEntry({
      actionLabel: dailyUseReport?.actionLabel ?? "Run daily self-check",
      detail: dailyUseReport?.headline ?? "Stage 1 daily-use report unavailable",
      error: dailyUseError,
      id: "daily-use",
      label: "Daily report",
      source: dailyUseSource,
      state: dailyUseReport ? stage1RefreshOutcomeStateFromStage1State(dailyUseReport.state) : "blocked",
      targetWorkspaceId: dailyUseReport?.targetWorkspaceId ?? "settings"
    }),
    buildStage1P0DailyUseRefreshOutcomeEntry({
      actionLabel: bootstrapPreflight?.actionLabel ?? "Run bootstrap preflight",
      detail: bootstrapPreflight?.headline ?? "Stage 1 bootstrap preflight unavailable",
      error: bootstrapPreflightError,
      id: "bootstrap-preflight",
      label: "Bootstrap preflight",
      source: bootstrapPreflightSource,
      state: bootstrapPreflight ? stage1RefreshOutcomeStateFromStage1State(bootstrapPreflight.state) : "blocked",
      targetWorkspaceId: bootstrapPreflight?.targetWorkspaceId ?? "settings"
    }),
    buildStage1P0DailyUseRefreshOutcomeEntry({
      actionLabel: desktopRelease?.actionLabel ?? "Review desktop release",
      detail: desktopRelease?.headline ?? "Desktop release readback unavailable",
      error: desktopReleaseError,
      id: "desktop-release",
      label: "Desktop release",
      source: desktopReleaseSource,
      state: desktopRelease ? stage1RefreshOutcomeStateFromDesktopState(desktopRelease.state) : "blocked",
      targetWorkspaceId: desktopRelease?.targetWorkspaceId ?? "settings"
    })
  ];
  const readyCount = entries.filter((entry) => entry.status === "ready").length;
  const state: Stage1P0DailyUseRefreshOutcomeState = entries.some((entry) => entry.status === "blocked")
    ? "blocked"
    : entries.some((entry) => entry.status === "review")
      ? "review"
      : "ready";
  const nextEntry = entries.find((entry) => entry.status === "blocked") ?? entries.find((entry) => entry.status === "review") ?? null;
  const actionLabel = nextEntry?.actionLabel ?? "Open daily workbench";
  const targetWorkspaceId = nextEntry?.targetWorkspaceId ?? "research";
  const targetWorkspaceLink = stage1P0DailyUseRefreshReceiptWorkspaceLink(targetWorkspaceId, "next");
  return {
    state,
    tone: dailyUseClosureTone(state),
    headline:
      state === "ready"
        ? "Stage 1 daily self-check refreshed"
        : state === "review"
          ? "Stage 1 daily self-check refreshed with review items"
          : "Stage 1 daily self-check refresh needs attention",
    detail: `${readyCount}/${entries.length} refresh checks ready · ${entries
      .map((entry) => `${entry.label}: ${entry.detail}`)
      .join(" · ")}`,
    readyCount,
    totalCount: entries.length,
    actionLabel,
    copyText: buildStage1P0DailyUseRefreshOutcomeCopyText({
      actionLabel,
      entries,
      readyCount,
      state,
      targetWorkspaceId,
      targetWorkspaceLink,
      totalCount: entries.length
    }),
    targetWorkspaceId,
    targetWorkspaceLink,
    entries
  };
}

export function buildStage1P0DailyUseRefreshOutcomeCopyText({
  actionLabel,
  entries,
  readyCount,
  state,
  targetWorkspaceId,
  targetWorkspaceLink,
  totalCount
}: Pick<
  Stage1P0DailyUseRefreshOutcome,
  "actionLabel" | "entries" | "readyCount" | "state" | "targetWorkspaceId" | "targetWorkspaceLink" | "totalCount"
>): string {
  return [
    "# Stage 1 Daily Self-Check Receipt",
    `State: ${state}`,
    `Ready: ${readyCount}/${totalCount}`,
    `Next action: ${actionLabel} -> ${targetWorkspaceId}`,
    `Next link: ${targetWorkspaceLink}`,
    "",
    ...entries.map((entry) => `- ${entry.label} [${entry.status}/${entry.source}]: ${entry.detail} (link: ${entry.workspaceLink})`),
    "",
    "Live trading remains blocked."
  ].join("\n");
}

export function buildStage1P0DailyUseRefreshOutcomeEntry({
  actionLabel,
  detail,
  error,
  id,
  label,
  source,
  state,
  targetWorkspaceId
}: {
  actionLabel: string;
  detail: string;
  error?: string | null;
  id: Stage1P0DailyUseRefreshOutcomeEntry["id"];
  label: string;
  source: Stage1P0DailyUseRefreshOutcomeSource;
  state: Stage1P0DailyUseRefreshOutcomeState;
  targetWorkspaceId: ProductWorkAreaId;
}): Stage1P0DailyUseRefreshOutcomeEntry {
  const status = source === "fallback" ? "blocked" : state;
  return {
    id,
    label,
    status,
    tone: dailyUseClosureTone(status),
    source,
    sourceLabel: source === "core" ? "Local core" : "Safe fallback",
    detail: source === "fallback" ? error || detail : detail,
    actionLabel,
    targetWorkspaceId,
    workspaceLink: stage1P0DailyUseRefreshReceiptWorkspaceLink(targetWorkspaceId, id)
  };
}

export function stage1RefreshOutcomeStateFromStage1State(
  state: Stage1DailyUseSummaryState | Stage1BootstrapPreflightSummaryState
): Stage1P0DailyUseRefreshOutcomeState {
  if (state === "ready") {
    return "ready";
  }
  if (state === "review" || state === "missing") {
    return "review";
  }
  return "blocked";
}

export function stage1RefreshOutcomeStateFromDesktopState(state: DesktopReleaseSummaryState): Stage1P0DailyUseRefreshOutcomeState {
  if (state === "passed") {
    return "ready";
  }
  if (state === "missing") {
    return "review";
  }
  return "blocked";
}
