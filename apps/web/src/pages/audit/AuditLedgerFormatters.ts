import { type AppI18n } from "../../lib/i18n";
import { AuditSigningKeyControlledRestartEvidence, AuditSigningKeyEnvironmentBinding, AuditSigningKeyRotationAcceptance, AuditSigningKeyRotationApply, AuditSigningKeyRuntimeReloadExecution, AuditSigningKeyRuntimeReloadPlan, AuditSigningKeySecretMaterialization } from "../../lib/terminal-api";
import { AuditSigningKeyRotationChainSummary, ResearchRunExportIndexRow, ResearchRunImportAuditEvent, ResearchRunImportAuditFailureBucket, ResearchRunImportBlockedEvidenceBucket, ResearchRunImportVerifiedReportSignatureBucket } from "../../lib/terminal-workbench";

export interface AuditSigningKeyRotationLedgerStatus {
  detail: string;
  state: "idle" | "saving" | "saved" | "failed";
}

export function auditReportLedgerStatusLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return (
    {
      "Backtest report hash recorded": "回测报告 hash 已记录",
      "Report hash recorded": "报告 hash 已记录",
      "Report hash invalid": "报告 hash 异常"
    }[label] ?? label
  );
}

export function auditReportLedgerReportKindLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return (
    {
      "Audit evidence report": "审计证据报告",
      "Backtest report": "回测报告",
      "P0 readiness report": "P0 可用性报告",
      "Portfolio report": "组合报告"
    }[label] ?? label
  );
}

export function auditReportLedgerPreLiveRunbookEvidenceLabel(
  i18n: AppI18n,
  count: number,
  fallbackLabel = ""
): string {
  if (i18n.locale === "en-US") {
    return fallbackLabel || `${count} evidence ${count === 1 ? "id" : "ids"}`;
  }
  return `${count} 条证据`;
}

export function auditReportLedgerSignatureLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return (
    {
      "Unsigned report hash": "报告 hash 尚未签名",
      "Signed report hash": "报告 hash 已签名",
      "Verified signature": "签名已验证",
      "Revoked signature": "签名已撤销",
      "Signature chain blocked": "签名链阻断"
    }[label] ?? label
  );
}

export function auditSigningKeyStatusLabel(i18n: AppI18n, status: "active" | "retired" | "revoked"): string {
  if (i18n.locale === "en-US") {
    return (
      {
        active: "Active",
        retired: "Retired",
        revoked: "Revoked"
      } satisfies Record<typeof status, string>
    )[status];
  }
  return (
    {
      active: "活跃",
      retired: "已退役",
      revoked: "已撤销"
    } satisfies Record<typeof status, string>
  )[status];
}

export function auditSigningKeyCapabilityLabel(i18n: AppI18n, canSign: boolean, canVerify: boolean): string {
  if (i18n.locale === "en-US") {
    if (canSign) {
      return "Can sign";
    }
    return canVerify ? "Verify only" : "Disabled";
  }
  if (canSign) {
    return "可签名";
  }
  return canVerify ? "仅验签" : "已禁用";
}

export function rotationLedgerStatusLabel(i18n: AppI18n, state: AuditSigningKeyRotationLedgerStatus["state"]): string {
  if (i18n.locale === "en-US") {
    return (
      {
        failed: "Ledger failed",
        idle: "Ledger idle",
        saved: "Ledger saved",
        saving: "Saving ledger"
      } satisfies Record<typeof state, string>
    )[state];
  }
  return (
    {
      failed: "入账失败",
      idle: "等待入账",
      saved: "已入审计账本",
      saving: "正在入账"
    } satisfies Record<typeof state, string>
  )[state];
}

export function auditSigningKeyRotationLedgerRowStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      "Rotation plan blocked": "轮换计划阻断",
      "Rotation plan prepared": "轮换计划已准备",
      "Rotation apply blocked": "应用预检阻断",
      "Rotation apply ready": "应用预检就绪",
      "Controlled restart evidence blocked": "受控重启证据阻断",
      "Controlled restart evidence recorded": "受控重启证据已记录",
      "Secret materialization blocked": "物化清单阻断",
      "Secret materialization recorded": "物化清单已记录",
      "Environment binding blocked": "环境绑定阻断",
      "Environment binding recorded": "环境绑定已记录",
      "Runtime reload plan blocked": "运行时重载计划阻断",
      "Runtime reload plan recorded": "运行时重载计划已记录",
      "Runtime reload execution blocked": "运行时重载执行阻断",
      "Runtime reload execution recorded": "运行时重载执行已记录",
      "Rotation acceptance blocked": "最终验收阻断",
      "Rotation acceptance recorded": "最终验收已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function auditSigningKeyRotationChainHeadline(
  i18n: AppI18n,
  summary: AuditSigningKeyRotationChainSummary
): string {
  if (i18n.locale === "en-US") {
    return summary.headline;
  }
  return (
    {
      blocked: "证据链阻断",
      complete: "证据链已验收",
      empty: "暂无证据链",
      in_progress: "证据链推进中"
    } satisfies Record<AuditSigningKeyRotationChainSummary["state"], string>
  )[summary.state];
}

export function auditSigningKeyRotationChainDetail(
  i18n: AppI18n,
  summary: AuditSigningKeyRotationChainSummary
): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  if (summary.state === "empty") {
    return "尚无签名 Key 轮换证据";
  }
  const progress = `${summary.completedCount}/${summary.totalCount} 个证据阶段已入账`;
  if (summary.state === "complete") {
    return `${progress} · 实盘仍保持阻断`;
  }
  const nextStage = summary.stages.find((stage) => stage.id === summary.nextStageId);
  if (summary.state === "blocked") {
    return `${progress} · 阻断：${nextStage ? auditSigningKeyRotationChainStageLabel(i18n, nextStage.id, nextStage.label) : "证据"}`;
  }
  return `${progress} · 下一步：${nextStage ? auditSigningKeyRotationChainStageLabel(i18n, nextStage.id, nextStage.label) : "证据"}`;
}

export function auditSigningKeyRotationChainStageLabel(
  i18n: AppI18n,
  stageId: AuditSigningKeyRotationChainSummary["stages"][number]["id"],
  fallback: string
): string {
  if (i18n.locale === "en-US") {
    return fallback;
  }
  return (
    {
      environment_binding: "环境绑定",
      rotation_acceptance: "最终验收闸门",
      rotation_plan: "轮换计划",
      runtime_reload_execution: "重载执行证据",
      runtime_reload_plan: "运行时重载计划",
      secret_materialization: "Secret 物化清单"
    } satisfies Record<AuditSigningKeyRotationChainSummary["stages"][number]["id"], string>
  )[stageId];
}

export function auditSigningKeyRotationChainStageStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyRotationChainSummary["stages"][number]["status"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        blocked: "Blocked",
        complete: "Complete",
        missing: "Missing"
      } satisfies Record<typeof status, string>
    )[status];
  }
  return (
    {
      blocked: "阻断",
      complete: "完成",
      missing: "缺失"
    } satisfies Record<typeof status, string>
  )[status];
}

export function auditSigningKeyRotationApplyStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyRotationApply["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Apply blocked" : "Ready for restart";
  }
  return status === "blocked" ? "应用阻断" : "可重启生效";
}

export function auditSigningKeyRotationApplyReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      current_key_fingerprint_mismatch: "当前 key 指纹不匹配",
      current_key_mismatch: "当前 key 不匹配",
      legacy_secret_not_confirmed: "legacy secret 未确认",
      new_secret_material_not_confirmed: "新 secret 未确认",
      operator_review_not_confirmed: "人工复核未确认",
      proposed_key_already_exists_in_registry: "拟启用 key 已在注册表",
      proposed_key_matches_current_active_key: "拟启用 key 与当前 key 相同",
      proposed_key_required: "缺少拟启用 key"
    }[reason] ?? reason
  );
}

export function auditSigningKeyRestartEvidenceStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyControlledRestartEvidence["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Evidence blocked" : "Evidence recorded";
  }
  return status === "blocked" ? "证据阻断" : "证据已记录";
}

export function auditSigningKeyRestartEvidenceReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      controlled_restart_not_required: "无需受控重启",
      ready_apply_event_required: "缺少就绪的应用预检事件",
      restart_logs_not_confirmed: "重启日志未复核",
      restart_window_not_confirmed: "重启窗口未确认",
      rollback_plan_not_confirmed: "回滚计划未确认",
      post_restart_validation_not_confirmed: "重启后验收未确认"
    }[reason] ?? reason
  );
}

export function auditSigningKeySecretMaterializationStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeySecretMaterialization["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Materialization blocked" : "Manifest recorded";
  }
  return status === "blocked" ? "物化阻断" : "清单已记录";
}

export function auditSigningKeySecretMaterializationReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      secret_materialization_env_binding_plan_missing: "环境绑定计划缺失",
      secret_materialization_local_store_not_verified: "本地 secret-store 未核验",
      secret_materialization_plan_not_prepared: "轮换计划未准备",
      secret_materialization_raw_secret_boundary_not_confirmed: "raw secret 边界未确认",
      secret_materialization_rollback_plan_missing: "回滚计划缺失"
    }[reason] ?? reason
  );
}

export function auditSigningKeyEnvironmentBindingStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyEnvironmentBinding["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Binding blocked" : "Binding recorded";
  }
  return status === "blocked" ? "绑定阻断" : "绑定已记录";
}

export function auditSigningKeyEnvironmentBindingReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      audit_signing_key_environment_binding_materialization_id_required: "缺少物化清单 ID",
      environment_binding_config_reload_plan_missing: "配置重载计划缺失",
      environment_binding_materialization_not_recorded: "物化清单未记录",
      environment_binding_raw_secret_boundary_not_confirmed: "raw secret 边界未确认",
      environment_binding_rollback_snapshot_missing: "回滚快照缺失",
      environment_binding_runtime_env_mapping_missing: "运行环境映射未核验"
    }[reason] ?? reason
  );
}

export function auditSigningKeyRuntimeReloadPlanStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyRuntimeReloadPlan["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Reload plan blocked" : "Reload plan recorded";
  }
  return status === "blocked" ? "重载计划阻断" : "重载计划已记录";
}

export function auditSigningKeyRuntimeReloadPlanReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      runtime_reload_config_diff_missing: "配置 diff 未复核",
      runtime_reload_environment_binding_not_recorded: "环境绑定未记录",
      runtime_reload_health_baseline_missing: "健康基线未捕获",
      runtime_reload_maintenance_window_missing: "维护窗口未批准",
      runtime_reload_rollback_owner_missing: "回滚负责人未指定",
      runtime_reload_smoke_plan_missing: "重载后 smoke 计划缺失"
    }[reason] ?? reason
  );
}

export function auditSigningKeyRuntimeReloadExecutionStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyRuntimeReloadExecution["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Execution blocked" : "Execution recorded";
  }
  return status === "blocked" ? "执行证据阻断" : "执行证据已记录";
}

export function auditSigningKeyRuntimeReloadExecutionReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      runtime_reload_execution_action_record_missing: "重载动作记录缺失",
      runtime_reload_execution_live_block_boundary_missing: "实盘阻断边界确认缺失",
      runtime_reload_execution_plan_not_recorded: "重载计划尚未入账",
      runtime_reload_execution_post_smoke_missing: "重载后 smoke 缺失",
      runtime_reload_execution_pre_health_missing: "重载前健康复核缺失",
      runtime_reload_execution_rollback_readiness_missing: "回滚就绪确认缺失"
    }[reason] ?? reason
  );
}

export function auditSigningKeyRotationAcceptanceStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyRotationAcceptance["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Acceptance blocked" : "Acceptance recorded";
  }
  return status === "blocked" ? "最终验收阻断" : "最终验收已记录";
}

export function auditSigningKeyRotationAcceptanceReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      rotation_acceptance_activation_boundary_missing: "新 key 激活阻断边界未确认",
      rotation_acceptance_execution_evidence_not_reviewed: "执行证据未复核",
      rotation_acceptance_legacy_verification_missing: "历史报告验签未确认",
      rotation_acceptance_rollback_window_missing: "回滚窗口未确认",
      rotation_acceptance_signature_probe_missing: "签名探针缺失",
      runtime_reload_execution_not_recorded: "运行时重载执行证据未入账"
    }[reason] ?? reason
  );
}

export function auditSigningKeyRotationStepTitle(i18n: AppI18n, title: string): string {
  if (i18n.locale === "en-US") {
    return title;
  }
  return (
    {
      "Set new active signing key": "设置新的活跃签名 Key",
      "Retire current key into legacy registry": "把当前 Key 退役进 legacy 注册表",
      "Restart local core": "重启本地核心服务",
      "Verify legacy reports": "验签历史审计报告"
    }[title] ?? title
  );
}

export function auditSigningKeyRotationStepDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return (
    {
      "Update active signing key environment variables with new locally generated key material.":
        "用本地生成的新 key material 更新活跃签名环境变量。",
      "Keep the current active key in AIQT_AUDIT_SIGNING_KEYS_JSON so old reports remain verifiable.":
        "把当前活跃 Key 保留在 AIQT_AUDIT_SIGNING_KEYS_JSON 中，让旧报告继续可验签。",
      "Restart API and web containers after changing signing environment variables.":
        "修改签名环境变量后重启 API 和 Web 容器。",
      "Run Audit report verification on old signed reports before removing any retired key.":
        "移除任何退役 Key 前，先对旧签名报告运行验签。"
    }[detail] ?? detail
  );
}

export function researchImportAuditStageLabel(i18n: AppI18n, stage: ResearchRunImportAuditEvent["stage"]): string {
  if (i18n.locale === "en-US") {
    return (
      {
        preview: "Preview",
        blocked: "Blocked",
        confirmed: "Applied",
        failed: "Failed",
        cancelled: "Cancelled",
        undone: "Undone",
        "undo-failed": "Undo failed"
      } satisfies Record<ResearchRunImportAuditEvent["stage"], string>
    )[stage];
  }
  return (
    {
      preview: "预检",
      blocked: "阻断",
      confirmed: "已确认",
      failed: "失败",
      cancelled: "已取消",
      undone: "已撤销",
      "undo-failed": "撤销失败"
    } satisfies Record<ResearchRunImportAuditEvent["stage"], string>
  )[stage];
}

export function researchImportAuditFailureBucketLabel(
  i18n: AppI18n,
  bucket: ResearchRunImportAuditFailureBucket
): string {
  if (i18n.locale === "en-US") {
    return bucket.label;
  }
  return (
    {
      "Preflight blocked": "预检阻断",
      "Schema contract": "契约格式",
      "Integrity check": "完整性校验",
      "Artifact counts": "证据数量",
      "Core rejection": "核心拒绝",
      "Unknown failure": "未知失败"
    }[bucket.label] ?? bucket.label
  );
}

export function researchImportBlockedEvidenceBucketLabel(
  i18n: AppI18n,
  bucket: ResearchRunImportBlockedEvidenceBucket
): string {
  if (i18n.locale === "en-US") {
    return bucket.label;
  }
  return (
    {
      "Import verification": "导入验签",
      "Report signature": "报告签名",
      "Package integrity": "复现包完整性",
      "Artifact counts": "证据数量",
      "Live boundary": "实盘边界",
      "Data snapshot": "数据快照",
      "Other blocked evidence": "其他阻断证据"
    }[bucket.label] ?? bucket.label
  );
}

export function researchImportVerifiedReportSignatureBucketLabel(
  i18n: AppI18n,
  bucket: ResearchRunImportVerifiedReportSignatureBucket
): string {
  if (i18n.locale === "en-US") {
    return bucket.label;
  }
  return (
    {
      "Local core verified": "本地核心验签通过",
      "Local core invalid": "本地核心验签失败"
    }[bucket.label] ?? bucket.label
  );
}

export function researchImportAuditSummaryLabel(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary
    .replace("Import preview blocked", "导入预检已阻断")
    .replace("Import preview ready", "导入预检已就绪")
    .replace("Import applied", "导入已写入")
    .replace("Import undo failed", "导入撤销失败")
    .replace("Import undone", "导入已撤销")
    .replace("Import failed", "导入失败")
    .replace("Import cancelled", "导入已取消");
}

export function researchImportAuditDetailLabel(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail
    .replace("Import preview found blocked preflight gates.", "导入预检发现阻断闸门。")
    .replace("Import preview passed preflight.", "导入预检已通过。")
    .replace("Research run import wrote to the local audit store.", "研究运行导入已写入本地审计库。")
    .replace("Research run import undo restored the previous audited stores.", "研究运行导入撤销已恢复导入前的审计存储。")
    .replace(
      "Research run import undo failed before the previous audited stores could be restored.",
      "导入撤销在恢复导入前审计存储之前失败。"
    )
    .replace("Import preview was discarded before writing to the local audit store.", "导入预检已放弃，没有写入本地审计库。")
    .replace("Import failed before the package could be applied.", "复现包写入前导入失败。")
    .replace("Invalid research run export contract", "研究运行导出契约无效")
    .replace("Research run import failed", "研究运行导入失败")
    .replaceAll("blocked", "阻断")
    .replaceAll("changes", "处变更")
    .replaceAll("change", "处变更");
}

export function researchImportAuditRecoveryLabel(i18n: AppI18n, recoveryHint: string): string {
  if (i18n.locale === "en-US") {
    return recoveryHint;
  }
  return recoveryHint
    .replace(/^Undo import (.+) to restore the audited stores\.$/u, "撤销导入 $1，恢复导入前的审计存储。")
    .replace(/^Import undo has already consumed (.+)\.$/u, "导入撤销已消费 $1。")
    .replace(
      "Review the undo rejection detail, replay the previous audited run if needed, then retry with the matching import event.",
      "请检查撤销拒绝细节，必要时回放旧的已审计 run，再使用匹配的导入事件重试。"
    )
    .replace(/^Replay previous audited run (.+) to roll back the workspace context\.$/u, "回放旧的已审计 run $1，以恢复导入前的工作台上下文。")
    .replace(
      "No previous audited run was bound before import; replay a run from history to change context.",
      "导入前没有绑定旧的已审计 run；可从历史记录回放其他 run 来切换上下文。"
    )
    .replace(
      "Choose a valid aiqt.researchRun.export package or a wrapped { export } payload.",
      "请选择有效的 aiqt.researchRun.export 复现包，或包含 { export } 的包装 payload。"
    )
    .replace(
      "Re-export the run or choose a package whose canonical SHA-256 integrity matches its payload.",
      "请重新导出该 run，或选择 canonical SHA-256 完整性与 payload 匹配的复现包。"
    )
    .replace(
      "Re-export the run and ensure manifest artifact counts match the included payload arrays.",
      "请重新导出该 run，并确认 manifest 里的产物数量与 payload 数组一致。"
    )
    .replace(
      "Review the Python core rejection detail, fix the package, and run import preflight again.",
      "请查看 Python 核心拒绝原因，修复复现包后重新运行导入预检。"
    )
    .replace(
      "Inspect the import error, then retry with a verified research run export package.",
      "请检查导入错误，再使用已验证的研究运行复现包重试。"
    )
    .replace("Import not applied; fix blocked preflight rows before confirming.", "导入尚未写入；请先修复预检阻断项再确认。")
    .replace("Import not applied; no rollback is required.", "导入尚未写入；无需回滚。")
    .replace("Import not applied yet; confirm only after reviewing diff rows.", "导入尚未写入；请审阅差异行后再确认。");
}

export function researchImportUndoConfirmationMessage(i18n: AppI18n, message: string): string {
  if (i18n.locale === "en-US") {
    return message;
  }
  return message.replace("Confirm import undo", "确认撤销导入");
}

export function researchImportUndoConfirmationDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail.replace(
    /^Undo import (.+) will restore previous audited stores and cannot be repeated\.$/u,
    "撤销导入 $1 会恢复导入前的审计存储，且不能重复执行。"
  );
}

export function researchImportAuditTimeLabel(createdAt: string): string {
  if (!createdAt) {
    return "-";
  }
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return createdAt;
  }
  return parsed.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit"
  });
}

export function researchExportIndexStatusLabel(
  i18n: AppI18n,
  status: ResearchRunExportIndexRow["status"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        ready: "Ready",
        review: "Review",
        blocked: "Blocked"
      } satisfies Record<ResearchRunExportIndexRow["status"], string>
    )[status];
  }
  return (
    {
      ready: "就绪",
      review: "复核",
      blocked: "阻断"
    } satisfies Record<ResearchRunExportIndexRow["status"], string>
  )[status];
}

export function researchExportIndexDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail
    .replace("Integrity missing", "完整性缺失")
    .replace("Data snapshot mismatch", "数据快照不一致")
    .replace("Paper execution count mismatch", "模拟执行数量不一致")
    .replace("Promotion candidate count mismatch", "晋级候选数量不一致")
    .replace("AI review count mismatch", "AI 评审数量不一致")
    .replace("Package is consistent and live handoff is open.", "复现包一致，实盘交接闸门已开启。")
    .replace("Package is consistent; paper-only handoff requires review.", "复现包一致；仅模拟盘交接需要复核。");
}

export function researchExportIndexDate(i18n: AppI18n, exportedAt: string): string {
  if (!exportedAt) {
    return i18n.locale === "zh-CN" ? "无导出时间" : "No export time";
  }
  return i18n.locale === "zh-CN" ? `导出 ${exportedAt}` : `exported ${exportedAt}`;
}
