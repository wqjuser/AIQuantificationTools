import { type AppI18n } from "../../lib/i18n";
import { DailyOpsControlRoomQueueItem, DailyOpsControlRoomReviewReference, DailyOpsControlRoomSummary, DailyStartBrief, DailyStartBriefReviewReference, PersonalTeamUsabilityReadinessItem, PersonalTeamUsabilityReadinessReviewReference, PersonalTeamUsabilityReadinessSummary } from "../../lib/terminal-workbench";

export function dailyStartBriefHeadline(i18n: AppI18n, brief: DailyStartBrief): string {
  if (i18n.locale === "en-US") {
    return brief.headline;
  }
  if (brief.state === "blocked") {
    return "今日启动仍被阻断";
  }
  if (brief.localReviewStatus !== "current") {
    return "先补本地复核，再继续操作";
  }
  if (brief.state === "attention") {
    return "今日还有操作项待处理";
  }
  return "今日纸面复核可开始";
}

export function dailyStartBriefDetail(i18n: AppI18n, brief: DailyStartBrief): string {
  if (i18n.locale === "en-US") {
    return brief.detail;
  }
  return `${brief.currentReviewCount}/2 个本地复核匹配当前状态 · ${brief.openOpsItemCount} 个操作项待处理 · 实盘仍阻断`;
}

export function dailyStartBriefLiveBoundary(i18n: AppI18n, brief: DailyStartBrief): string {
  if (i18n.locale === "en-US") {
    return brief.liveBoundaryLabel;
  }
  return "今日摘要只组织本地纸面操作 · 不提交订单 · 不启用实盘";
}

export function dailyStartBriefPrimaryAction(i18n: AppI18n, brief: DailyStartBrief): string {
  if (i18n.locale === "en-US") {
    return brief.primaryActionLabel;
  }
  return dailyStartBriefActionLabelZh(brief.primaryActionLabel);
}

export function dailyStartBriefAuditAction(i18n: AppI18n, brief: DailyStartBrief): string {
  if (i18n.locale === "en-US") {
    return brief.auditActionLabel;
  }
  return brief.auditQuery ? "打开审计上下文" : "暂无审计上下文";
}

export function dailyStartBriefLocalReviewAction(i18n: AppI18n, brief: DailyStartBrief): string {
  if (i18n.locale === "en-US") {
    return brief.localReviewActionLabel;
  }
  return (
    {
      current: "打开本地复核证据",
      missing: "入账本地复核",
      stale: "刷新本地复核"
    } satisfies Record<DailyStartBrief["localReviewStatus"], string>
  )[brief.localReviewStatus];
}

export function dailyStartBriefCheckpointLabel(
  i18n: AppI18n,
  checkpoint: DailyStartBrief["checkpoints"][number]
): string {
  if (i18n.locale === "en-US") {
    return checkpoint.label;
  }
  return (
    {
      "daily-ops-review": "每日复核",
      "live-boundary": "实盘边界",
      "ops-queue": "操作队列",
      "personal-team-review": "个人/团队复核"
    } satisfies Record<DailyStartBrief["checkpoints"][number]["id"], string>
  )[checkpoint.id];
}

export function dailyStartBriefCheckpointAction(
  i18n: AppI18n,
  checkpoint: DailyStartBrief["checkpoints"][number]
): string {
  if (i18n.locale === "en-US") {
    return checkpoint.actionLabel;
  }
  return dailyStartBriefActionLabelZh(checkpoint.actionLabel);
}

export function dailyStartBriefCheckpointDetail(
  i18n: AppI18n,
  checkpoint: DailyStartBrief["checkpoints"][number]
): string {
  if (i18n.locale === "en-US") {
    return checkpoint.detail;
  }
  if (checkpoint.id === "live-boundary") {
    return "继续保持 paper-only、实盘阻断和不提交订单。";
  }
  if (checkpoint.id === "personal-team-review") {
    return checkpoint.status === "current" ? "个人/小团队复核匹配当前状态。" : "补齐个人/小团队可用性复核。";
  }
  if (checkpoint.id === "daily-ops-review") {
    return checkpoint.status === "current" ? "Daily Ops 复核匹配当前队列。" : "补齐今日操作台复核。";
  }
  return checkpoint.detail;
}

export function dailyStartBriefReviewReferenceLabel(
  i18n: AppI18n,
  reference: DailyStartBriefReviewReference
): string {
  if (i18n.locale === "en-US") {
    return reference.label;
  }
  return (
    {
      current: "每日启动复核匹配当前摘要",
      missing: "尚未入账每日启动复核",
      stale: "每日启动复核已过期"
    } satisfies Record<DailyStartBriefReviewReference["status"], string>
  )[reference.status];
}

export function dailyStartBriefReviewReferenceDetail(
  i18n: AppI18n,
  reference: DailyStartBriefReviewReference
): string {
  if (i18n.locale === "en-US") {
    return reference.detail;
  }
  if (reference.status === "current") {
    return "最新每日启动复核与当前摘要一致，可从 Audit 定位。";
  }
  if (reference.status === "stale") {
    return "最新每日启动复核已不匹配当前摘要，建议重新入账。";
  }
  return "点击入账复核后，这里会显示可定位的 Daily Start 审计事件。";
}

export function dailyStartBriefActionLabelZh(label: string): string {
  return (
    {
      "Create handoff runbook": "继续交接手册",
      "Keep paper-only boundary": "保持纸面边界",
      "Open acceptance manifest": "打开验收清单",
      "Open audit evidence": "打开审计证据",
      "Open audit ledger": "打开审计台账",
      "Open local review evidence": "打开本地复核证据",
      "Open review evidence": "打开复核证据",
      "Plan backup drill": "规划备份演练",
      "Record local reviews": "入账本地复核",
      "Record review": "入账复核",
      "Refresh local reviews": "刷新本地复核",
      "Refresh review": "刷新复核",
      "Review accepted loop": "复核纸面闭环",
      "Review P2 readiness": "复核 P2 readiness",
      "Review research ops": "复核研究运营",
      "Run AI review": "继续 AI 评审"
    }[label] ?? label
  );
}

export function personalTeamUsabilityReadinessHeadline(
  i18n: AppI18n,
  summary: PersonalTeamUsabilityReadinessSummary
): string {
  if (i18n.locale === "en-US") {
    return summary.headline;
  }
  return (
    {
      attention: "个人纸面闭环可用，团队交接待补",
      blocked: "个人纸面闭环仍被阻断",
      ready: "个人与小团队内测已就绪"
    } satisfies Record<PersonalTeamUsabilityReadinessSummary["state"], string>
  )[summary.state];
}

export function personalTeamUsabilityReadinessDetail(
  i18n: AppI18n,
  summary: PersonalTeamUsabilityReadinessSummary
): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  return `${summary.readyCount}/${summary.totalCount} 个可用性闸门已就绪 · 个人本地纸面 ${summary.personalPercent}% · 小团队内测 ${summary.teamPercent}% · 实盘仍阻断`;
}

export function personalTeamUsabilityReadinessLiveBoundary(
  i18n: AppI18n,
  summary: PersonalTeamUsabilityReadinessSummary
): string {
  if (i18n.locale === "en-US") {
    return summary.liveBoundaryLabel;
  }
  return "仅纸面盘 · 实盘阻断 · 不提交订单";
}

export function personalTeamReadinessReviewReferenceLabel(
  i18n: AppI18n,
  reference: PersonalTeamUsabilityReadinessReviewReference
): string {
  if (i18n.locale === "en-US") {
    return reference.label;
  }
  return (
    {
      current: "复核已匹配当前可用性",
      missing: "尚未入账可用性复核",
      stale: "最近复核已过期"
    } satisfies Record<PersonalTeamUsabilityReadinessReviewReference["status"], string>
  )[reference.status];
}

export function personalTeamReadinessReviewReferenceDetail(
  i18n: AppI18n,
  reference: PersonalTeamUsabilityReadinessReviewReference
): string {
  if (i18n.locale === "en-US") {
    return reference.detail;
  }
  if (reference.status === "current") {
    return "最近一次个人/小团队复核与当前 readiness、打开项和下一步一致。";
  }
  if (reference.status === "stale") {
    return "最近一次个人/小团队复核与当前 readiness 不一致，请重新入账复核。";
  }
  return "点击入账复核后，这里会显示可定位的个人/小团队审计事件。";
}

export function personalTeamUsabilityReadinessItemLabel(
  i18n: AppI18n,
  item: PersonalTeamUsabilityReadinessItem
): string {
  if (i18n.locale === "en-US") {
    return item.label;
  }
  return (
    {
      "audit-traceability": "审计可追溯",
      "backup-restore-drill": "备份恢复演练",
      "p0-local-loop": "P0 本地纸面闭环",
      "p1-research-ops": "P1 研究运营",
      "p2-prelive-chain": "P2 预实盘链路",
      "team-handoff-runbook": "团队交接手册"
    } satisfies Record<PersonalTeamUsabilityReadinessItem["id"], string>
  )[item.id];
}

export function personalTeamUsabilityReadinessItemAction(
  i18n: AppI18n,
  item: PersonalTeamUsabilityReadinessItem
): string {
  if (i18n.locale === "en-US") {
    return item.actionLabel;
  }
  return (
    {
      "audit-traceability": item.status === "ready" ? "打开审计台账" : "记录审计复核",
      "backup-restore-drill": item.status === "ready" ? "复核恢复证据" : "规划备份演练",
      "p0-local-loop": item.status === "ready" ? "复核已验收闭环" : item.actionLabel,
      "p1-research-ops": item.status === "ready" ? "复核研究运营" : item.actionLabel,
      "p2-prelive-chain": item.status === "ready" ? "复核 P2 readiness" : item.actionLabel,
      "team-handoff-runbook": item.status === "ready" ? "打开交接备注" : "创建交接手册"
    } satisfies Record<PersonalTeamUsabilityReadinessItem["id"], string>
  )[item.id];
}

export function personalTeamUsabilityReadinessItemDetail(
  i18n: AppI18n,
  item: PersonalTeamUsabilityReadinessItem
): string {
  if (i18n.locale === "en-US") {
    return item.detail;
  }
  if (item.id === "team-handoff-runbook") {
    return item.status === "ready"
      ? "当前审计运行已经记录本地交接备注。"
      : "小团队内测前补齐交接、事故负责人和复核节奏。";
  }
  if (item.id === "backup-restore-drill") {
    return item.status === "ready"
      ? "P0/P1 验收已覆盖导出、导入和导入后再导出。"
      : "共享使用前补齐本地数据备份与恢复演练。";
  }
  if (item.id === "audit-traceability") {
    return item.status === "ready"
      ? "最新验收或审计辅助证据可从 Audit 工作区追溯。"
      : "团队交接前先记录当前审计复核事件。";
  }
  if (item.status === "ready") {
    return (
      {
        "p0-local-loop": "单标的研究到纸面执行已经可用于个人本地 paper-only。",
        "p1-research-ops": "自选列表研究运营已验收，仍保持 paper-only。",
        "p2-prelive-chain": "P2 回放、清单、证据覆盖和 live 边界已验收。",
        "audit-traceability": "",
        "backup-restore-drill": "",
        "team-handoff-runbook": ""
      } satisfies Record<PersonalTeamUsabilityReadinessItem["id"], string>
    )[item.id];
  }
  return item.detail;
}

export function dailyOpsControlRoomHeadline(i18n: AppI18n, summary: DailyOpsControlRoomSummary): string {
  if (i18n.locale === "en-US") {
    return summary.headline;
  }
  if (summary.state === "ready") {
    return "每日纸面复核已就绪";
  }
  if (summary.state === "blocked") {
    return `${summary.blockingCount} 个阻断需要先处理`;
  }
  return `${summary.reviewCount} 个事项需要复核`;
}

export function dailyOpsControlRoomDetail(i18n: AppI18n, summary: DailyOpsControlRoomSummary): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  return `${summary.readyCount}/${summary.totalCount} 个操作闸门已就绪 · ${summary.reviewCount} 个待复核 · ${summary.blockingCount} 个阻断 · 实盘仍阻断`;
}

export function dailyOpsControlRoomLiveBoundary(i18n: AppI18n, summary: DailyOpsControlRoomSummary): string {
  if (i18n.locale === "en-US") {
    return summary.liveBoundaryLabel;
  }
  return "仅整理每日操作证据 · 不提交订单 · 不启用实盘";
}

export function dailyOpsControlRoomPrimaryAction(i18n: AppI18n, summary: DailyOpsControlRoomSummary): string {
  if (i18n.locale === "en-US") {
    return summary.primaryActionLabel;
  }
  return (
    {
      "Create handoff runbook": "继续交接手册",
      "Open audit ledger": "打开审计台账",
      "Plan backup drill": "规划备份演练",
      "Record audit review": "记录审计复核",
      "Review accepted loop": "复核纸面闭环",
      "Review P2 readiness": "复核 P2 readiness",
      "Review research ops": "复核研究运营",
      "Run AI review": "继续 AI 评审"
    }[summary.primaryActionLabel] ?? summary.primaryActionLabel
  );
}

export function dailyOpsControlRoomAuditAction(i18n: AppI18n, summary: DailyOpsControlRoomSummary): string {
  if (i18n.locale === "en-US") {
    return summary.auditQuery ? "Open audit query" : "No audit query";
  }
  return summary.auditQuery ? "打开审计定位" : "暂无审计定位";
}

export function dailyOpsControlRoomReviewReferenceLabel(
  i18n: AppI18n,
  reference: DailyOpsControlRoomReviewReference
): string {
  if (i18n.locale === "en-US") {
    return reference.label;
  }
  return (
    {
      current: "复核已匹配当前队列",
      missing: "尚未入账每日复核",
      stale: "最近复核已过期"
    } satisfies Record<DailyOpsControlRoomReviewReference["status"], string>
  )[reference.status];
}

export function dailyOpsControlRoomReviewReferenceDetail(
  i18n: AppI18n,
  reference: DailyOpsControlRoomReviewReference
): string {
  if (i18n.locale === "en-US") {
    return reference.detail;
  }
  if (reference.status === "current") {
    return "最近一次 Daily Ops 复核与当前队列、主动作和审计查询一致。";
  }
  if (reference.status === "stale") {
    return "最近一次 Daily Ops 复核与当前队列不一致，请重新入账复核。";
  }
  return "点击入账复核后，这里会显示可定位的 Daily Ops 审计事件。";
}

export function dailyOpsControlRoomItemLabel(i18n: AppI18n, item: DailyOpsControlRoomQueueItem): string {
  if (i18n.locale === "en-US") {
    return item.label;
  }
  return (
    {
      "audit-context": "审计定位",
      "backup-restore": "备份恢复",
      "current-action": "当前动作",
      "team-handoff": "团队交接"
    } satisfies Record<DailyOpsControlRoomQueueItem["id"], string>
  )[item.id];
}

export function dailyOpsControlRoomItemAction(i18n: AppI18n, item: DailyOpsControlRoomQueueItem): string {
  if (i18n.locale === "en-US") {
    return item.actionLabel;
  }
  return (
    {
      "Open audit evidence": "打开审计证据",
      "Open audit ledger": "打开审计台账",
      "Create handoff runbook": "创建交接手册",
      "Open handoff notes": "打开交接备注",
      "Plan backup drill": "规划备份演练",
      "Review restore evidence": "复核恢复证据",
      "Run AI review": "继续 AI 评审"
    }[item.actionLabel] ?? item.actionLabel
  );
}

export function dailyOpsControlRoomItemDetail(i18n: AppI18n, item: DailyOpsControlRoomQueueItem): string {
  if (i18n.locale === "en-US") {
    return item.detail;
  }
  if (item.id === "audit-context") {
    return item.status === "ready" ? "当前审计查询可只读定位。" : "先记录或加载当前审计辅助报告。";
  }
  if (item.id === "team-handoff") {
    return item.status === "ready" ? "本地交接备注已存在。" : "补齐负责人、交接说明和复核节奏。";
  }
  if (item.id === "backup-restore") {
    return item.status === "ready" ? "验收已覆盖导出、导入和再导出。" : "补齐可重复的备份恢复演练。";
  }
  return item.detail;
}
