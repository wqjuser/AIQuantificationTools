import { type AppI18n } from "../../lib/i18n";
import { EvidencePackageControlRoomRow, ExecutionAdapterChainHealthRollup, PaperExecutionReplayGate } from "../../lib/terminal-workbench";
import { researchImportAuditStageLabel } from "./AuditLedgerFormatters";

export function marketRefreshOverrideAuditStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      "Override recorded": "覆盖已记录",
      "Override blocked": "覆盖被阻断"
    }[statusLabel] ?? statusLabel
  );
}

export function marketRefreshOverrideAuditLiveBoundaryLabel(i18n: AppI18n, liveTradingAllowed: boolean): string {
  if (liveTradingAllowed) {
    return i18n.locale === "zh-CN" ? "实盘允许" : "Live allowed";
  }
  return i18n.locale === "zh-CN" ? "实盘阻断" : "Live blocked";
}

export function evidencePackageControlStatusLabel(
  i18n: AppI18n,
  status: EvidencePackageControlRoomRow["status"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        acceptance_missing: "P0 acceptance missing",
        complete: "Complete evidence package",
        import_blocked: "Import blocked",
        package_blocked: "Export package blocked",
        ready_for_archive: "Ready for archive",
        stale_signature: "Signature stale or invalid",
        unsigned: "Unsigned report"
      } satisfies Record<EvidencePackageControlRoomRow["status"], string>
    )[status];
  }
  return (
    {
      acceptance_missing: "P0 验收缺失",
      complete: "证据包完整",
      import_blocked: "导入阻断",
      package_blocked: "复现包阻断",
      ready_for_archive: "可归档",
      stale_signature: "签名过期或无效",
      unsigned: "报告未签名"
    } satisfies Record<EvidencePackageControlRoomRow["status"], string>
  )[status];
}

export function evidencePackageControlActionLabel(
  i18n: AppI18n,
  actionId: EvidencePackageControlRoomRow["nextActionId"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        "inspect-package": "Inspect package",
        "open-acceptance": "Open acceptance",
        "open-archive": "Open archive evidence",
        "open-import-audit": "Open import audit",
        "open-signature-ledger": "Open signature ledger"
      } satisfies Record<EvidencePackageControlRoomRow["nextActionId"], string>
    )[actionId];
  }
  return (
    {
      "inspect-package": "查看复现包",
      "open-acceptance": "查看验收",
      "open-archive": "打开归档证据",
      "open-import-audit": "查看导入审计",
      "open-signature-ledger": "查看签名账本"
    } satisfies Record<EvidencePackageControlRoomRow["nextActionId"], string>
  )[actionId];
}

export function evidencePackageControlPackageStatusLabel(
  i18n: AppI18n,
  status: EvidencePackageControlRoomRow["packageStatus"]
): string {
  if (status === "ready") {
    return i18n.locale === "zh-CN" ? "就绪" : "ready";
  }
  if (status === "review") {
    return i18n.locale === "zh-CN" ? "待复核" : "review";
  }
  if (status === "blocked") {
    return i18n.locale === "zh-CN" ? "阻断" : "blocked";
  }
  return i18n.locale === "zh-CN" ? "缺失" : "missing";
}

export function evidencePackageControlSignatureStatusLabel(
  i18n: AppI18n,
  status: EvidencePackageControlRoomRow["signatureStatus"]
): string {
  if (status === "verified") {
    return i18n.locale === "zh-CN" ? "已验证" : "verified";
  }
  if (status === "signed") {
    return i18n.locale === "zh-CN" ? "已签名" : "signed";
  }
  if (status === "revoked") {
    return i18n.locale === "zh-CN" ? "已撤销" : "revoked";
  }
  if (status === "invalid") {
    return i18n.locale === "zh-CN" ? "无效" : "invalid";
  }
  if (status === "unsigned") {
    return i18n.locale === "zh-CN" ? "未签名" : "unsigned";
  }
  return i18n.locale === "zh-CN" ? "缺失" : "missing";
}

export function evidencePackageControlImportStatusLabel(
  i18n: AppI18n,
  status: EvidencePackageControlRoomRow["importStatus"]
): string {
  if (status === "none") {
    return i18n.locale === "zh-CN" ? "未导入" : "none";
  }
  return researchImportAuditStageLabel(i18n, status);
}

export function paperReplayGateStatusLabel(i18n: AppI18n, status: PaperExecutionReplayGate["status"]): string {
  if (status === "replay_ready") {
    return i18n.locale === "zh-CN" ? "回放就绪" : "Replay ready";
  }
  if (status === "stale") {
    return i18n.locale === "zh-CN" ? "证据过期" : "Stale";
  }
  if (status === "partial") {
    return i18n.locale === "zh-CN" ? "证据不完整" : "Partial";
  }
  return i18n.locale === "zh-CN" ? "回放阻断" : "Blocked";
}

export function paperReplayGateHeadline(i18n: AppI18n, gate: PaperExecutionReplayGate): string {
  if (i18n.locale !== "zh-CN") {
    return gate.headline;
  }
  if (gate.status === "replay_ready") {
    return "纸面执行可回放";
  }
  if (gate.status === "stale") {
    return "回放证据绑定旧运行";
  }
  if (gate.status === "partial") {
    return "回放证据仍缺项";
  }
  return "纸面执行不可回放";
}

export function paperReplayGateDetail(i18n: AppI18n, gate: PaperExecutionReplayGate): string {
  if (i18n.locale !== "zh-CN") {
    return gate.detail;
  }
  if (gate.status === "replay_ready") {
    return "单标的、组合、状态历史和适配器模拟执行证据已对齐；仍只允许人工复核。";
  }
  if (gate.currentBlockerId) {
    return `${paperReplayGateItemLabel(i18n, gate.currentBlockerId, gate.currentBlockerLabel ?? gate.currentBlockerId)} 待处理。`;
  }
  return "等待纸面执行回放证据。";
}

export function paperReplayGateItemLabel(i18n: AppI18n, id: string, fallback: string): string {
  if (i18n.locale !== "zh-CN") {
    return fallback;
  }
  const labels: Record<string, string> = {
    "single-paper-execution": "单标的纸面执行",
    "portfolio-order-ledger": "组合委托账本",
    "portfolio-approval-ledger": "组合审批账本",
    "portfolio-simulation-ledger": "组合模拟成交",
    "portfolio-state-history": "状态历史",
    "portfolio-replay": "组合回放",
    "adapter-paper-execution": "适配器模拟执行",
    "live-boundary": "实盘边界"
  };
  return labels[id] ?? fallback;
}

export function paperReplayGateItemStatusLabel(
  i18n: AppI18n,
  status: PaperExecutionReplayGate["items"][number]["status"]
): string {
  if (status === "passed") {
    return i18n.locale === "zh-CN" ? "通过" : "passed";
  }
  if (status === "stale") {
    return i18n.locale === "zh-CN" ? "过期" : "stale";
  }
  if (status === "review") {
    return i18n.locale === "zh-CN" ? "复核" : "review";
  }
  return i18n.locale === "zh-CN" ? "阻断" : "blocked";
}

export function paperReplayGateItemDetail(i18n: AppI18n, item: PaperExecutionReplayGate["items"][number]): string {
  if (i18n.locale !== "zh-CN") {
    return item.detail;
  }
  if (item.status === "passed") {
    return "证据已记录并保持纸面盘边界。";
  }
  if (item.status === "stale") {
    return "证据不属于当前审计运行。";
  }
  if (item.status === "review") {
    return "存在回放警告，需要人工复核。";
  }
  return "缺少可回放证据或边界不满足。";
}

export function paperReplayGateBoundaryLabel(i18n: AppI18n, gate: PaperExecutionReplayGate): string {
  if (gate.replayReady) {
    return i18n.locale === "zh-CN"
      ? "回放完整只代表可进入人工复核；直接下单和实盘交易仍关闭。"
      : "Replay readiness only allows manual review; direct order submission and live trading stay disabled.";
  }
  return i18n.locale === "zh-CN"
    ? "实盘前复核会被当前回放闸门阻断。"
    : "Pre-live review is blocked by the current replay gate.";
}

export function adapterChainHealthStatusLabel(
  i18n: AppI18n,
  status: ExecutionAdapterChainHealthRollup["status"]
): string {
  if (status === "paper_ready") {
    return i18n.locale === "zh-CN" ? "模拟链路就绪" : "Paper-ready";
  }
  if (status === "blocked") {
    return i18n.locale === "zh-CN" ? "链路阻断" : "Blocked";
  }
  if (status === "in_progress") {
    return i18n.locale === "zh-CN" ? "证据收集中" : "In progress";
  }
  return i18n.locale === "zh-CN" ? "未启动" : "Not started";
}

export function adapterChainHealthDetailLabel(i18n: AppI18n, rollup: ExecutionAdapterChainHealthRollup): string {
  if (i18n.locale !== "zh-CN") {
    return rollup.detail;
  }
  if (rollup.status === "paper_ready") {
    return "模拟盘链路完整；仅允许人工复核，实盘仍关闭。";
  }
  if (rollup.blockerStageId) {
    return `${adapterChainHealthStageLabel(i18n, rollup.blockerStageId, rollup.blockerLabel)} 待处理；实盘仍关闭。`;
  }
  return "暂无实盘前证据；从密钥引用开始记录，实盘仍关闭。";
}

export function adapterChainHealthStageStatusLabel(
  i18n: AppI18n,
  status: ExecutionAdapterChainHealthRollup["stages"][number]["status"]
): string {
  if (status === "recorded") {
    return i18n.locale === "zh-CN" ? "已记录" : "recorded";
  }
  if (status === "blocked") {
    return i18n.locale === "zh-CN" ? "阻断" : "blocked";
  }
  if (status === "unsafe") {
    return i18n.locale === "zh-CN" ? "不安全" : "unsafe";
  }
  return i18n.locale === "zh-CN" ? "缺失" : "missing";
}

export function adapterChainHealthStageLabel(i18n: AppI18n, stageId: string, fallback?: string | null): string {
  if (i18n.locale !== "zh-CN") {
    return fallback || stageId;
  }
  const labels: Record<string, string> = {
    "secret-reference": "密钥引用",
    "secret-materialization": "密钥物化",
    "secret-manifest-validation": "清单校验",
    "environment-binding": "环境绑定",
    "runtime-reload-plan": "重载计划",
    "runtime-reload-execution": "重载执行",
    "runtime-reload-acceptance": "重载验收",
    "orchestration-dry-run": "编排预演",
    "orchestration-execution": "编排执行",
    "human-confirmation": "人工确认",
    "sandbox-probe-plan": "沙箱计划",
    "sandbox-probe-execution": "沙箱探针",
    "sandbox-probe-review": "探针复核",
    "production-route-review": "路由复核",
    "sandbox-order-schema-dry-run": "订单 Schema",
    "paper-order-lifecycle": "模拟订单",
    "paper-route-runbook": "路由手册",
    "ops-state": "运行状态",
    "adapter-paper-execution": "模拟成交"
  };
  return labels[stageId] ?? fallback ?? stageId;
}
