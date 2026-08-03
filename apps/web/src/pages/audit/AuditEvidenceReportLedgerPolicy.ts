import { type AppI18n } from "../../lib/i18n";
import { type AuditEvidenceReportLedgerRow } from "../../lib/terminal-workbench";

export function auditReportLedgerSigningPolicyDetail(i18n: AppI18n, row: AuditEvidenceReportLedgerRow): string {
  if (row.reportKind === "p0_readiness_report") {
    return i18n.locale === "zh-CN"
      ? "P0 就绪报告只作为审计辅助材料入账，不进入签名链或实盘授权"
      : "P0 readiness reports are audit aids only; they do not enter the signing chain or live authorization";
  }
  if (row.reportKind === "p2_manifest_chain_preflight") {
    return i18n.locale === "zh-CN"
      ? "P2 manifest 链路预检只作为操作员审计辅助材料入账，不进入签名链或实盘授权"
      : "P2 manifest chain preflights are operator audit aids only; they do not enter the signing chain or live authorization";
  }
  if (row.reportKind === "p2_readiness_acceptance_generated") {
    return i18n.locale === "zh-CN"
      ? "P2 顶层验收生成事件只作为审计辅助材料入账，不进入签名链或实盘授权"
      : "P2 readiness acceptance generation events are audit aids only; they do not enter the signing chain or live authorization";
  }
  if (row.reportKind === "pre_live_runbook_report") {
    return i18n.locale === "zh-CN"
      ? "实盘前运行手册只作为审计辅助材料入账，不进入签名链或实盘授权"
      : "Pre-live runbook reports are audit aids only; they do not enter the signing chain or live authorization";
  }
  if (row.reportKind === "research_context_readiness_report") {
    return i18n.locale === "zh-CN"
      ? "研究上下文就绪报告只作为审计辅助材料入账，不进入签名链或实盘授权"
      : "Research context readiness reports are audit aids only; they do not enter the signing chain or live authorization";
  }
  if (row.importVerificationInvalid <= 0) {
    return "";
  }
  return i18n.locale === "zh-CN" ? "导入验签失败，需先更正证据再签名" : "Import verification failed; correct evidence before signing";
}
