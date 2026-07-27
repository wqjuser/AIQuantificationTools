const executionEvidenceLabels: Record<string, string> = {
  accepted: "已验收",
  active: "进行中",
  admission_review_recorded: "准入复核已记录",
  adapter_rejected: "适配器拒绝",
  approved: "已批准",
  authorization_review_recorded: "授权复核已记录",
  authorized: "已授权",
  blocked: "已阻断",
  current: "当前有效",
  false: "否",
  invalid: "无效",
  kill_switch: "急停开关已触发",
  missing: "暂无证据",
  none: "无",
  open: "已挂单",
  partially_filled: "部分成交",
  filled: "已成交",
  canceled: "已撤销",
  expired: "已过期",
  projected: "已投影",
  ready: "就绪",
  ready_for_manually_authorized_sandbox_phase: "等待人工授权测试网阶段",
  ready_for_review: "待人工复核",
  ready_for_separate_sandbox_authorization: "等待独立测试网授权",
  reconciled: "已对账",
  reconciliation_mismatch: "对账不一致",
  reconciliation_required: "等待对账",
  recoverable_failure: "可重试失败",
  rejected: "已拒绝",
  review: "待复核",
  revoked: "已撤销",
  stale: "已过期",
  shadow_acknowledged: "影子适配器已确认",
  shadow_orders_blocked: "影子委托已阻断",
  shadow_projection_matches_stage4: "影子结果与阶段 4 一致",
  submission_pending: "等待提交",
  timeout_once: "单次超时演练",
  true: "是",
  waiting: "等待前置条件",
};

export function executionEvidenceLabel(value: unknown, fallback = "暂无"): string {
  if (value === null || value === undefined || value === "" || value === "-") return fallback;
  return executionEvidenceLabels[String(value)] ?? String(value);
}

export function executionEvidenceMessage(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (value === "stage7_production_readonly_probe_missing") return "尚未生成生产只读准入证据。";
  if (value.includes("stage5-exit-acceptance.json")) return "尚未生成阶段 5 退出验收证据。";
  return value;
}
