import { type AppI18n } from "../../lib/i18n";
import { LocalReviewCoverageNextActionDeepLinkState, ProductWorkAreaId, Stage1P0DailyUseShareDeepLinkState, Stage1P0DailyUseShareDeepLinkStatus, buildLocalReviewCoverageNextActionUrlSearch, resolveLocalReviewCoverageNextActionDeepLinkState } from "../../lib/terminal-workbench";

export function stage1P0DailyUseShareLinkLoadedStatusLabel(state: Stage1P0DailyUseShareDeepLinkState): string {
  if (state.kind === "daily-use") {
    return `Stage 1 daily share link loaded: ${state.focus} -> ${state.targetWorkspaceId}`;
  }
  return `Stage 1 refresh receipt share link loaded: ${state.focus} -> ${state.targetWorkspaceId}`;
}

export function stage1P0DailyUseShareLinkOpenStatusLabel(state: Stage1P0DailyUseShareDeepLinkState): string {
  return `Stage 1 shared context opened: ${state.kind}/${state.focus} -> ${state.targetWorkspaceId}`;
}

export function stage1P0DailyUseShareLinkInvalidStatusLabel(status: Stage1P0DailyUseShareDeepLinkStatus): string {
  return status.status === "invalid" ? `Stage 1 share link invalid: ${status.reason}` : "Stage 1 share link ignored";
}

export function stage1P0DailyUseShareLinkInvalidReasonLabel(
  i18n: AppI18n,
  status: Stage1P0DailyUseShareDeepLinkStatus
): string {
  const reason = status.status === "invalid" ? status.reason : "unknown";
  if (i18n.locale === "en-US") {
    return (
      {
        "ambiguous-focus": "Ambiguous Stage 1 focus",
        "duplicate-workspace": "Duplicate workspace parameter",
        "invalid-daily-focus": "Unknown daily handoff focus",
        "invalid-refresh-focus": "Unknown refresh receipt focus",
        "invalid-workspace": "Unknown workspace",
        "missing-workspace": "Missing workspace parameter",
        unknown: "Unknown Stage 1 share link issue"
      }[reason] ?? "Unknown Stage 1 share link issue"
    );
  }
  return (
    {
      "ambiguous-focus": "Stage 1 聚焦参数有歧义",
      "duplicate-workspace": "workspace 参数重复",
      "invalid-daily-focus": "未知日常手册目标",
      "invalid-refresh-focus": "未知刷新回执目标",
      "invalid-workspace": "未知工作区",
      "missing-workspace": "缺少 workspace 参数",
      unknown: "未知 Stage 1 分享链接问题"
    }[reason] ?? "未知 Stage 1 分享链接问题"
  );
}

export function stage1P0DailyUseShareLinkLabel(
  i18n: AppI18n,
  state: Stage1P0DailyUseShareDeepLinkState
): string {
  if (state.kind === "daily-use") {
    return i18n.locale === "zh-CN" ? "日常手册入口" : "Daily handoff link";
  }
  return i18n.locale === "zh-CN" ? "刷新回执入口" : "Refresh receipt link";
}

export function localReviewCoverageNextActionLabel(
  i18n: AppI18n,
  state: LocalReviewCoverageNextActionDeepLinkState
): string {
  if (localReviewCoverageNextActionIsEmptyStart(state)) {
    return i18n.locale === "zh-CN" ? "本地复核未开始" : "Local reviews not started";
  }
  if (state.actionId === "record-daily-ops-review") {
    return i18n.locale === "zh-CN" ? "Daily Ops 复核缺失" : "Daily Ops review missing";
  }
  if (state.actionId === "record-daily-start-review") {
    return i18n.locale === "zh-CN" ? "每日启动复核缺失" : "Daily start review missing";
  }
  if (state.actionId === "record-stage1-archive-review") {
    return i18n.locale === "zh-CN" ? "Stage 1 归档复核缺失" : "Stage 1 archive review missing";
  }
  if (state.actionId === "record-personal-team-review") {
    return i18n.locale === "zh-CN" ? "个人/小团队复核缺失" : "Personal/team review missing";
  }
  return i18n.locale === "zh-CN" ? "本地复核缺失" : "Local review missing";
}

export function localReviewCoverageNextActionIsEmptyStart(
  state: LocalReviewCoverageNextActionDeepLinkState | null
): boolean {
  return state?.missingReviewKind === "empty";
}

export function localReviewCoverageNextActionShouldFocusStage1ArchiveEntry(
  state: LocalReviewCoverageNextActionDeepLinkState | null
): boolean {
  return state?.actionId === "record-stage1-archive-review";
}

export function localReviewCoverageNextActionLoadedStatusLabel(
  state: LocalReviewCoverageNextActionDeepLinkState
): string {
  if (localReviewCoverageNextActionIsEmptyStart(state)) {
    return `Local review start link loaded: ${state.missingReviewKind} -> ${state.targetWorkspaceId}`;
  }
  if (state.actionId === "record-daily-ops-review") {
    return `Daily Ops coverage next link loaded: ${state.actionId} -> ${state.targetWorkspaceId}`;
  }
  if (state.actionId === "record-daily-start-review") {
    return `Daily start coverage next link loaded: ${state.actionId} -> ${state.targetWorkspaceId}`;
  }
  if (state.actionId === "record-stage1-archive-review") {
    return `Stage 1 archive coverage next link loaded: ${state.actionId} -> ${state.targetWorkspaceId}`;
  }
  if (state.actionId === "record-personal-team-review") {
    return `Personal/team coverage next link loaded: ${state.actionId} -> ${state.targetWorkspaceId}`;
  }
  return `Local review coverage next link loaded: ${state.actionId} -> ${state.targetWorkspaceId}`;
}

export function localReviewCoverageMissingReviewKindLabel(
  i18n: AppI18n,
  missingReviewKind: LocalReviewCoverageNextActionDeepLinkState["missingReviewKind"]
): string {
  if (missingReviewKind === "empty") {
    return i18n.locale === "zh-CN" ? "尚未记录本地复核" : "No local reviews recorded";
  }
  if (missingReviewKind === "daily-ops") {
    return i18n.locale === "zh-CN" ? "缺少 Daily Ops 复核" : "Missing Daily Ops review";
  }
  if (missingReviewKind === "daily-start") {
    return i18n.locale === "zh-CN" ? "缺少每日启动复核" : "Missing daily start review";
  }
  if (missingReviewKind === "stage1-archive") {
    return i18n.locale === "zh-CN" ? "缺少 Stage 1 归档复核" : "Missing Stage 1 archive review";
  }
  if (missingReviewKind === "personal-team") {
    return i18n.locale === "zh-CN" ? "缺少个人/小团队复核" : "Missing personal/team review";
  }
  return i18n.locale === "zh-CN" ? "缺少本地复核" : "Missing local review";
}

export function localReviewCoverageNextActionTitle(
  i18n: AppI18n,
  state: LocalReviewCoverageNextActionDeepLinkState | null,
  title: string | null | undefined,
  auditReportQuery: string | null | undefined,
  fallbackLabel?: string | null
): string {
  const rawContext = title || auditReportQuery || fallbackLabel || "";
  if (!state) {
    return rawContext;
  }
  return [localReviewCoverageNextActionLabel(i18n, state), rawContext].filter(Boolean).join(" · ");
}

export function localReviewCoverageNextActionStateFromParts(
  targetWorkspaceId: ProductWorkAreaId | null | undefined,
  auditReportQuery: string | null | undefined
): LocalReviewCoverageNextActionDeepLinkState | null {
  if (!targetWorkspaceId || !auditReportQuery?.trim()) {
    return null;
  }

  const normalizedSearch = buildLocalReviewCoverageNextActionUrlSearch({
    auditReportQuery,
    targetWorkspaceId
  });
  return normalizedSearch ? resolveLocalReviewCoverageNextActionDeepLinkState(normalizedSearch) : null;
}

export function localReviewCoverageNextActionQueryLabel(
  i18n: AppI18n,
  state: LocalReviewCoverageNextActionDeepLinkState
): string {
  if (localReviewCoverageNextActionIsEmptyStart(state)) {
    return i18n.locale === "zh-CN" ? "查看本地复核启动查询" : "View local review start query";
  }
  if (state.actionId === "record-daily-ops-review") {
    return i18n.locale === "zh-CN" ? "查看 Daily Ops 覆盖查询" : "View Daily Ops coverage query";
  }
  if (state.actionId === "record-daily-start-review") {
    return i18n.locale === "zh-CN" ? "查看每日启动覆盖查询" : "View daily start coverage query";
  }
  if (state.actionId === "record-stage1-archive-review") {
    return i18n.locale === "zh-CN" ? "查看 Stage 1 归档覆盖查询" : "View Stage 1 archive coverage query";
  }
  if (state.actionId === "record-personal-team-review") {
    return i18n.locale === "zh-CN" ? "查看个人/小团队覆盖查询" : "View personal/team coverage query";
  }
  return i18n.locale === "zh-CN" ? "查看覆盖查询" : "View coverage query";
}

export function localReviewCoverageNextActionOpenLabel(
  i18n: AppI18n,
  state: LocalReviewCoverageNextActionDeepLinkState
): string {
  if (localReviewCoverageNextActionIsEmptyStart(state)) {
    return i18n.locale === "zh-CN" ? "开始个人/小团队复核" : "Start personal/team review";
  }
  if (state.actionId === "record-daily-ops-review") {
    return i18n.locale === "zh-CN" ? "打开 Daily Ops 复核入口" : "Open Daily Ops review entry";
  }
  if (state.actionId === "record-daily-start-review") {
    return i18n.locale === "zh-CN" ? "打开每日启动复核入口" : "Open daily start review entry";
  }
  if (state.actionId === "record-stage1-archive-review") {
    return i18n.locale === "zh-CN" ? "打开 Stage 1 归档入口" : "Open Stage 1 archive entry";
  }
  if (state.actionId === "record-personal-team-review") {
    return i18n.locale === "zh-CN" ? "打开个人/小团队复核入口" : "Open personal/team review entry";
  }
  return i18n.locale === "zh-CN" ? "打开复核入口" : "Open review entry";
}

export function localReviewCoverageNextActionFocusLabel(
  i18n: AppI18n,
  state: LocalReviewCoverageNextActionDeepLinkState | null,
  scope: "summary" | "row" = "summary"
): string {
  if (localReviewCoverageNextActionIsEmptyStart(state)) {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "定位行本地复核启动"
        : "定位本地复核启动"
      : scope === "row"
        ? "Focus row local review start"
        : "Focus local review start";
  }
  if (state?.actionId === "record-daily-ops-review") {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "定位行 Daily Ops 覆盖下一步"
        : "定位 Daily Ops 覆盖下一步"
      : scope === "row"
        ? "Focus row Daily Ops coverage next"
        : "Focus Daily Ops coverage next";
  }
  if (state?.actionId === "record-daily-start-review") {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "定位行每日启动覆盖下一步"
        : "定位每日启动覆盖下一步"
      : scope === "row"
        ? "Focus row daily start coverage next"
        : "Focus daily start coverage next";
  }
  if (state?.actionId === "record-stage1-archive-review") {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "定位行 Stage 1 归档覆盖下一步"
        : "定位 Stage 1 归档覆盖下一步"
      : scope === "row"
        ? "Focus row Stage 1 archive coverage next"
        : "Focus Stage 1 archive coverage next";
  }
  if (state?.actionId === "record-personal-team-review") {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "定位行个人/小团队覆盖下一步"
        : "定位个人/小团队覆盖下一步"
      : scope === "row"
        ? "Focus row personal/team coverage next"
        : "Focus personal/team coverage next";
  }
  return i18n.locale === "zh-CN"
    ? scope === "row"
      ? "定位行覆盖下一步"
      : "定位覆盖下一步"
    : scope === "row"
      ? "Focus row coverage next"
      : "Focus coverage next";
}

export function localReviewCoverageNextActionCopyLabel(
  i18n: AppI18n,
  state: LocalReviewCoverageNextActionDeepLinkState | null,
  scope: "summary" | "row" = "summary"
): string {
  if (localReviewCoverageNextActionIsEmptyStart(state)) {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "复制行本地复核启动链接"
        : "复制本地复核启动链接"
      : scope === "row"
        ? "Copy row local review start link"
        : "Copy local review start link";
  }
  if (state?.actionId === "record-daily-ops-review") {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "复制行 Daily Ops 覆盖下一步链接"
        : "复制 Daily Ops 覆盖下一步链接"
      : scope === "row"
        ? "Copy row Daily Ops coverage next link"
        : "Copy Daily Ops coverage next link";
  }
  if (state?.actionId === "record-daily-start-review") {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "复制行每日启动覆盖下一步链接"
        : "复制每日启动覆盖下一步链接"
      : scope === "row"
        ? "Copy row daily start coverage next link"
        : "Copy daily start coverage next link";
  }
  if (state?.actionId === "record-stage1-archive-review") {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "复制行 Stage 1 归档覆盖下一步链接"
        : "复制 Stage 1 归档覆盖下一步链接"
      : scope === "row"
        ? "Copy row Stage 1 archive coverage next link"
        : "Copy Stage 1 archive coverage next link";
  }
  if (state?.actionId === "record-personal-team-review") {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "复制行个人/小团队覆盖下一步链接"
        : "复制个人/小团队覆盖下一步链接"
      : scope === "row"
        ? "Copy row personal/team coverage next link"
        : "Copy personal/team coverage next link";
  }
  return i18n.locale === "zh-CN"
    ? scope === "row"
      ? "复制行覆盖下一步链接"
      : "复制覆盖下一步链接"
    : scope === "row"
      ? "Copy row coverage next link"
      : "Copy coverage next link";
}

export function localReviewCoverageNextActionOpenSourceLabel(
  i18n: AppI18n,
  state: LocalReviewCoverageNextActionDeepLinkState | null,
  scope: "summary" | "row" = "summary"
): string {
  if (localReviewCoverageNextActionIsEmptyStart(state)) {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "开始行个人/小团队复核"
        : "开始个人/小团队复核"
      : scope === "row"
        ? "Start row personal/team review"
        : "Start personal/team review";
  }
  if (state?.actionId === "record-daily-ops-review") {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "打开行 Daily Ops 复核入口"
        : "打开 Daily Ops 复核入口"
      : scope === "row"
        ? "Open row Daily Ops review entry"
        : "Open Daily Ops review entry";
  }
  if (state?.actionId === "record-daily-start-review") {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "打开行每日启动复核入口"
        : "打开每日启动复核入口"
      : scope === "row"
        ? "Open row daily start review entry"
        : "Open daily start review entry";
  }
  if (state?.actionId === "record-stage1-archive-review") {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "打开行 Stage 1 归档入口"
        : "打开 Stage 1 归档入口"
      : scope === "row"
        ? "Open row Stage 1 archive entry"
        : "Open Stage 1 archive entry";
  }
  if (state?.actionId === "record-personal-team-review") {
    return i18n.locale === "zh-CN"
      ? scope === "row"
        ? "打开行个人/小团队复核入口"
        : "打开个人/小团队复核入口"
      : scope === "row"
        ? "Open row personal/team review entry"
        : "Open personal/team review entry";
  }
  return i18n.locale === "zh-CN"
    ? scope === "row"
      ? "打开行覆盖下一步"
      : "打开覆盖下一步"
    : scope === "row"
      ? "Open row coverage next"
      : "Open coverage next";
}

export function localReviewCoverageNextActionQueryStatusLabel(
  state: LocalReviewCoverageNextActionDeepLinkState
): string {
  if (localReviewCoverageNextActionIsEmptyStart(state)) {
    return "Local review start query selected";
  }
  if (state.actionId === "record-daily-ops-review") {
    return "Daily Ops coverage query selected";
  }
  if (state.actionId === "record-daily-start-review") {
    return "Daily start coverage query selected";
  }
  if (state.actionId === "record-stage1-archive-review") {
    return "Stage 1 archive coverage query selected";
  }
  if (state.actionId === "record-personal-team-review") {
    return "Personal/team coverage query selected";
  }
  return "Local review coverage query selected";
}

export function localReviewCoverageNextActionCopyStatusLabel(
  state: LocalReviewCoverageNextActionDeepLinkState
): string {
  if (localReviewCoverageNextActionIsEmptyStart(state)) {
    return "Local review start link copied";
  }
  if (state.actionId === "record-daily-ops-review") {
    return "Daily Ops coverage next link copied";
  }
  if (state.actionId === "record-daily-start-review") {
    return "Daily start coverage next link copied";
  }
  if (state.actionId === "record-stage1-archive-review") {
    return "Stage 1 archive coverage next link copied";
  }
  if (state.actionId === "record-personal-team-review") {
    return "Personal/team coverage next link copied";
  }
  return "Local review coverage next-step link copied";
}

export function localReviewCoverageNextActionOpenStatusLabel(
  state: LocalReviewCoverageNextActionDeepLinkState
): string {
  if (localReviewCoverageNextActionIsEmptyStart(state)) {
    return "Personal/team review start opened";
  }
  if (state.actionId === "record-daily-ops-review") {
    return "Daily Ops review entry opened";
  }
  if (state.actionId === "record-daily-start-review") {
    return "Daily start review entry opened";
  }
  if (state.actionId === "record-stage1-archive-review") {
    return "Stage 1 archive entry opened";
  }
  if (state.actionId === "record-personal-team-review") {
    return "Personal/team review entry opened";
  }
  return "Local review entry opened";
}
