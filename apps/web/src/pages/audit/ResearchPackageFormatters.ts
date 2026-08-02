import { type AppI18n } from "../../lib/i18n";
import { AuditEventRecord } from "../../lib/terminal-api";
import { AuditEvidenceSummary, ResearchRunExportBrowserRow, ResearchRunExportPreviewRow, ResearchRunImportAuditEvent, ResearchRunImportDiffRow, ResearchRunImportFailureCategory } from "../../lib/terminal-workbench";
import { researchRunImportAuditEvidenceAnchorQuery } from "../app-shell/url-state";

export function researchExportPreviewLabel(i18n: AppI18n, row: ResearchRunExportPreviewRow): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  return (
    {
      "research-run": "研究运行",
      "data-snapshot": "数据快照",
      "market-calendar": "交易日历",
      "preparation-evidence": "准备证据",
      "strategy-config": "策略配置",
      "research-note": "研究笔记",
      "handoff-notes": "交接备注",
      "backtest-trades": "回测流水",
      "paper-executions": "模拟执行",
      "promotion-candidate": "晋级候选",
      "ai-review-runs": "AI 评审记录",
      "ai-review-runs-v2": i18n.t("archive.aiReview.authoritative"),
      "ai-review-decisions": i18n.t("archive.aiReview.decision"),
      "execution-handoff": "执行交接"
    } satisfies Record<ResearchRunExportPreviewRow["id"], string>
  )[row.id];
}

export function researchExportPreviewStatusLabel(
  i18n: AppI18n,
  status: ResearchRunExportPreviewRow["status"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        ready: "Ready",
        missing: "Missing",
        blocked: "Blocked"
      } satisfies Record<ResearchRunExportPreviewRow["status"], string>
    )[status];
  }
  return (
    {
      ready: "就绪",
      missing: "缺失",
      blocked: "阻断"
    } satisfies Record<ResearchRunExportPreviewRow["status"], string>
  )[status];
}

export function researchExportPreviewCount(i18n: AppI18n, count: string): string {
  return i18n.locale === "zh-CN" && count === "unknown" ? "未知" : count;
}

export function researchExportPreviewDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  const runDetail = detail.match(/^(.+) · (.+) · (.+) · (\d+) bars$/);
  if (runDetail) {
    return `${runDetail[1]} · ${runDetail[2]} · ${runDetail[3]} · ${runDetail[4]} 根K线`;
  }
  const snapshotDetail = detail.match(/^(.+) · (.+) · (\d+) warnings$/);
  if (snapshotDetail) {
    return `${snapshotDetail[1]} · ${snapshotDetail[2]} · ${snapshotDetail[3]} 条告警`;
  }
  const strategyDetail = detail.match(/^(.+) · v(\d+) · (.+)$/);
  if (strategyDetail) {
    return `${strategyDetail[1]} · v${strategyDetail[2]} · ${strategyDetail[3]}`;
  }
  const executionDetail = detail.match(/^(.+) · (\d+)\/(\d+) gates passed$/);
  if (executionDetail) {
    return `${executionDetail[1]} · ${executionDetail[2]}/${executionDetail[3]} 个闸门通过`;
  }
  if (detail.startsWith("Persistent Stage 3 archive readback failed:")) {
    return "持久化 Stage 3 归档回读失败；当前导出就绪状态已按 fail-closed 阻断。";
  }
  return detail
    .replace("Run Pipeline before an export package can be reproduced.", "先运行流水线，才能生成可复现导出包。")
    .replace("The audited run did not include a local data snapshot hash.", "审计运行没有包含本地数据快照哈希。")
    .replace("A research run is required before data can be exported.", "需要先生成研究运行，才能导出数据。")
    .replace("The export can replay the run, but structured strategy rules are missing.", "导出包可以回放运行，但缺少结构化策略规则。")
    .replace("Run Pipeline after saving a strategy to bind structured rules.", "保存策略后运行流水线，绑定结构化规则。")
    .replace("No research note is attached to this run; add one for stronger replay context.", "当前运行没有绑定研究笔记；添加后复现上下文会更完整。")
    .replace("Research notes are bound after a run is created.", "研究笔记会在研究运行创建后绑定。")
    .replace("Trade blotter and equity curve are available for replay.", "交易流水和权益曲线可用于回放。")
    .replace("The run summary is bound, but the trade blotter or equity curve is missing.", "运行摘要已绑定，但交易流水或权益曲线缺失。")
    .replace("Run Pipeline before backtest replay artifacts are exported.", "先运行流水线，再导出回测回放材料。")
    .replace("Saved AI review records are attached to this export package.", "已保存的 AI 评审记录会随导出包附带。")
    .replace("Current AI evidence is ready, but it has not been saved into the export package yet.", "当前 AI 证据已就绪，但尚未保存进导出包。")
    .replace("Run and save an AI review record before relying on exported AI evidence.", "先运行并保存 AI 评审记录，再依赖导出的 AI 证据。")
    .replace("A research run is required before AI review records can be exported.", "需要先生成研究运行，才能导出 AI 评审记录。")
    .replace("Submit a paper order to attach execution evidence to the run package.", "提交模拟委托后，执行证据会附加到运行包。")
    .replace("Paper execution waits for an audited run.", "模拟执行等待审计运行。")
    .replace("Promotion evidence is attached, but live execution remains blocked.", "晋级证据已附加，但实盘执行仍保持阻断。")
    .replace("Create a paper execution before promotion evidence can be attached.", "先创建模拟执行，才能附加晋级证据。")
    .replace("Promotion evidence waits for a research run.", "晋级证据等待研究运行。")
    .replace("Execution handoff gates are created after an audited run is available.", "审计运行可用后会生成执行交接闸门。")
    .replace("Audited run can stage paper orders", "审计运行可提交模拟委托")
    .replace("live trading remains blocked", "实盘仍保持阻断")
    .replace("needs risk review before staging execution", "提交执行前仍需风控复核")
    .replace("Authoritative v2 Reviews and evidence hashes are ready for export.", "权威 v2 评审及证据 Hash 已可导出。")
    .replace("No authoritative v2 Review is saved for this research run.", "当前研究运行尚未保存权威 v2 评审。")
    .replace("A research run is required before authoritative Reviews can be exported.", "导出权威评审前需要先生成研究运行。")
    .replace("Decision append-chain evidence is ready for export.", "Decision 追加链证据已可导出。")
    .replace("The authoritative Review has no appended Decision.", "该权威评审尚未追加 Decision。")
    .replace("Save an authoritative Review before appending a Decision.", "追加 Decision 前先保存权威评审。")
    .replace("A research run is required before Decisions can be exported.", "导出 Decision 前需要先生成研究运行。")
    .replace("Loading the complete persistent Stage 3 archive for this research run.", "正在加载当前研究运行的完整持久化 Stage 3 归档。")
    .replace("Persistent Stage 3 archive readiness is unknown.", "持久化 Stage 3 归档就绪状态未知。");
}

export function researchExportBrowserLabel(i18n: AppI18n, row: ResearchRunExportBrowserRow): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  return (
    {
      package: "导出包",
      integrity: "完整性",
      data: "数据快照",
      "market-calendar": "交易日历",
      "preparation-evidence": "准备证据",
      backtest: "回测回放",
      "backtest-report": "回测报告",
      "research-note": "研究笔记",
      "handoff-notes": "交接备注",
      "paper-executions": "模拟执行",
      "adapter-paper-executions": "适配器模拟执行",
      "portfolio-paper-orders": "组合模拟委托",
      "audit-events": "审计事件",
      "p0-completeness": "P0 完整性",
      "promotion-candidate": "晋级候选",
      "ai-reviews": "AI 评审",
      "ai-reviews-v2": i18n.t("archive.aiReview.authoritative"),
      "ai-review-decisions": i18n.t("archive.aiReview.decision"),
      "stage5-shadow-sessions": "Stage 5 Shadow Sessions",
      "stage5-sandbox-readiness-decisions": "Stage 5 Sandbox 准入决策",
      "stage5-sandbox-authorization-preflights": "Stage 5 Sandbox 授权预检",
      "stage5-sandbox-authorization-reviews": "Stage 5 Sandbox 授权复核",
      "audit-summary": "审计摘要",
      "audit-report": "审计报告",
      "execution-handoff": "执行交接"
    } satisfies Record<ResearchRunExportBrowserRow["id"], string>
  )[row.id];
}

export function researchExportBrowserStatusLabel(
  i18n: AppI18n,
  status: ResearchRunExportBrowserRow["status"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        ready: "Ready",
        missing: "Missing",
        blocked: "Blocked"
      } satisfies Record<ResearchRunExportBrowserRow["status"], string>
    )[status];
  }
  return (
    {
      ready: "就绪",
      missing: "缺失",
      blocked: "阻断"
    } satisfies Record<ResearchRunExportBrowserRow["status"], string>
  )[status];
}

export function researchExportDeepLinkStatusLabel(
  i18n: AppI18n,
  status: AuditEvidenceSummary["deepLinkStatus"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        none: "No deep link",
        idle: "Ready to load",
        loading: "Loading package",
        loaded: "Evidence loaded",
        failed: "Load failed"
      } satisfies Record<AuditEvidenceSummary["deepLinkStatus"], string>
    )[status];
  }
  return (
    {
      none: "未使用深链",
      idle: "等待加载",
      loading: "正在加载复现包",
      loaded: "证据已加载",
      failed: "加载失败"
    } satisfies Record<AuditEvidenceSummary["deepLinkStatus"], string>
  )[status];
}

export function researchExportBrowserDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  const packageDetail = detail.match(/^(.+) · (.+) · exported (.+)$/);
  if (packageDetail) {
    return `${packageDetail[1]} · ${packageDetail[2]} · 导出 ${packageDetail[3]}`;
  }
  const decisionDetail = detail.match(/^(.+) decisions · (.+) AI risks$/);
  if (decisionDetail) {
    return `${decisionDetail[1]} 条决策 · ${decisionDetail[2]} 条 AI 风险`;
  }
  return detail
    .replace("Inspect a run from history to load its manifest and artifact counts.", "在运行历史中点击查看包，加载 manifest 和 artifact 数量。")
    .replace("Canonical SHA-256 integrity metadata is present.", "标准 SHA-256 完整性元数据已存在。")
    .replace("Integrity metadata is missing or malformed.", "完整性元数据缺失或格式异常。")
    .replace("Manifest and package data snapshot counts match.", "Manifest 与包内数据快照数量一致。")
    .replace("Manifest data snapshot count does not match the package payload.", "Manifest 数据快照数量与包内载荷不一致。")
    .replace("Manifest and package backtest artifact counts match.", "Manifest 与包内回测 artifact 数量一致。")
    .replace("Manifest backtest artifact count does not match the package payload.", "Manifest 回测 artifact 数量与包内载荷不一致。")
    .replace("Locked research context is attached to the package.", "锁定研究上下文已附加到导出包。")
    .replace("No locked research note is attached to this package.", "当前导出包没有附加锁定研究笔记。")
    .replace("Manifest and package paper execution counts match.", "Manifest 与包内模拟执行数量一致。")
    .replace("Manifest paper execution count does not match the package payload.", "Manifest 模拟执行数量与包内载荷不一致。")
    .replace("No paper execution payload is attached.", "没有附加模拟执行载荷。")
    .replace("Portfolio paper order batch count matches the export package payload.", "Portfolio 组合模拟委托批次数量与导出包载荷一致。")
    .replace("Portfolio paper order manifest count does not match the package payload.", "Portfolio 组合模拟委托批次数量与包内载荷不一致。")
    .replace("Promotion candidate is attached to the package.", "晋级候选证据已附加到导出包。")
    .replace("No promotion candidate payload is attached.", "没有附加晋级候选载荷。")
    .replace("Manifest and package AI review counts match.", "Manifest 与包内 AI 评审数量一致。")
    .replace("Manifest AI review count does not match the package payload.", "Manifest AI 评审数量与包内载荷不一致。")
    .replace("Authoritative v2 Review count matches the export package payload.", "权威 v2 评审数量与导出包载荷一致。")
    .replace("Authoritative v2 Review manifest count does not match the package payload.", "权威 v2 评审的 manifest 数量与包内载荷不一致。")
    .replace("AI Review Decision count matches the export package payload.", "AI 评审 Decision 数量与导出包载荷一致。")
    .replace("AI Review Decision manifest count does not match the package payload.", "AI 评审 Decision 的 manifest 数量与包内载荷不一致。")
    .replace("No saved AI review record is attached.", "没有附加保存的 AI 评审记录。")
    .replace("Live execution handoff is allowed by the package gates.", "包内闸门允许实盘执行交接。")
    .replace("Package remains paper-only; live execution is blocked.", "导出包仍为仅模拟盘；实盘执行保持阻断。");
}

export function researchImportDiffLabel(i18n: AppI18n, row: ResearchRunImportDiffRow): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  const recordId = row.label.split(" · ").slice(1).join(" · ");
  if (row.id.startsWith("ai-review-run-v2:")) {
    return recordId
      ? `${i18n.t("archive.aiReview.authoritative")} · ${recordId}`
      : i18n.t("archive.aiReview.authoritative");
  }
  if (row.id.startsWith("ai-review-decision:")) {
    return recordId
      ? `${i18n.t("archive.aiReview.decision")} · ${recordId}`
      : i18n.t("archive.aiReview.decision");
  }
  return (
    {
      "package-integrity": "复现包完整性",
      "artifact-counts": "Artifact 数量",
      "run-id": "研究运行",
      context: "市场 / 标的",
      timeframe: "周期",
      "data-snapshot": "数据快照",
      "market-calendar": "交易日历",
      "preparation-evidence": "准备证据",
      "strategy-revision": "策略版本",
      "research-note": "研究笔记",
      "handoff-notes": "交接备注",
      "paper-executions": "模拟执行",
      "adapter-paper-executions": "适配器模拟执行",
      "portfolio-paper-orders": "组合模拟委托",
      "ai-review-runs": "AI 评审记录",
      "stage4-portfolio-workflows": "Stage 4 组合工作流",
      "stage5-shadow-sessions": "Stage 5 Shadow Sessions",
      "stage5-sandbox-readiness-decisions": "Stage 5 Sandbox 准入决策",
      "stage5-sandbox-authorization-preflights": "Stage 5 Sandbox 授权预检",
      "audit-summary": "导入审计摘要",
      "audit-report": "导入审计报告",
      "backtest-report": "导入回测报告",
      "live-boundary": "实盘边界"
    } as Record<string, string>
  )[row.id] ?? row.label;
}

export function researchImportVerifiedReportSignatureLabel(
  i18n: AppI18n,
  row: ResearchRunImportAuditEvent["verifiedReportSignatures"][number]
): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  return row.id === "audit-report" ? "导入审计报告" : "导入回测报告";
}

export function researchImportDiffStatusLabel(
  i18n: AppI18n,
  status: ResearchRunImportDiffRow["status"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        same: "Same",
        add: "Add",
        change: "Change",
        replace: "Replace",
        blocked: "Blocked"
      } satisfies Record<ResearchRunImportDiffRow["status"], string>
    )[status];
  }
  return (
    {
      same: "一致",
      add: "新增",
      change: "变更",
      replace: "替换",
      blocked: "阻断"
    } satisfies Record<ResearchRunImportDiffRow["status"], string>
  )[status];
}

export function researchImportDiffValue(i18n: AppI18n, value: string): string {
  if (i18n.locale === "en-US") {
    return value;
  }
  return value
    .replace("Local verification required", "本地校验必需")
    .replace("No integrity hash", "无完整性 hash")
    .replace("Counts match", "数量一致")
    .replace("Manifest versus package payload", "Manifest 对比包内载荷")
    .replace("mismatch", "处不一致")
    .replace("No audited run", "无审计运行")
    .replace("No package selected", "未选择复现包")
    .replace("No data snapshot", "无数据快照")
    .replace("No audited strategy", "无审计策略")
    .replace("No local note", "无本地笔记")
    .replace("No package note", "无包内笔记")
    .replace("No local package summary", "无本地包摘要")
    .replace("Persistent readback unavailable", "持久化回读不可用")
    .replace("Legacy authority owns this Review ID", "该评审 ID 已由 legacy authority 占用")
    .replace("No authoritative Review", "无权威评审")
    .replace("No Decision", "无 Decision")
    .replace("no focus", "无焦点")
    .replace("No package selected", "未选择复现包")
    .replace("Local live enabled", "本地实盘已开启")
    .replace("Local paper boundary", "本地模拟盘边界")
    .replace("Package claims live handoff", "复现包声明实盘交接")
    .replace("Package remains paper-only", "复现包仅模拟盘")
    .replaceAll("rows", "行")
    .replaceAll("saved", "条保存")
    .replaceAll("manifest", "manifest");
}

export function researchImportDiffDetail(i18n: AppI18n, detail: string): string {
  if (detail.startsWith("Authoritative Review readback unavailable; import is blocked fail-closed.")) {
    return i18n.locale === "en-US"
      ? "Authoritative Review readback unavailable; import is blocked fail-closed."
      : "权威评审回读不可用；导入已按 fail-closed 阻断。";
  }
  if (detail.startsWith("Decision readback unavailable; import is blocked fail-closed.")) {
    return i18n.locale === "en-US"
      ? "Decision readback unavailable; import is blocked fail-closed."
      : "Decision 回读不可用；导入已按 fail-closed 阻断。";
  }
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail
    .replace("Inspect or choose a research run export package before importing.", "导入前先查看或选择一个研究运行复现包。")
    .replace("Canonical SHA-256 metadata is present before import.", "导入前已存在标准 SHA-256 完整性元数据。")
    .replace("Import must stop until the package has valid canonical SHA-256 metadata.", "复现包缺少有效标准 SHA-256 元数据时必须阻断导入。")
    .replace("Manifest artifact counts match the package payloads that will be restored.", "Manifest artifact 数量与即将恢复的包内载荷一致。")
    .replace("Import will refresh the existing audited run payload.", "导入会刷新现有审计运行载荷。")
    .replace("Import will replace the current replay context with the package run.", "导入会用包内运行替换当前回放上下文。")
    .replace("Import will add an audited run to the local workspace.", "导入会向本地工作区新增一条审计运行。")
    .replace("Import will bind the terminal to the package market and symbol.", "导入会把终端绑定到复现包的市场和标的。")
    .replace("Current research context already matches the package timeframe.", "当前研究上下文已经匹配复现包周期。")
    .replace("Current research context will switch to the package timeframe.", "当前研究上下文会切换到复现包周期。")
    .replace("Import will replay the package data hash and row count as the audited snapshot.", "导入会把包内数据 hash 和行数作为审计快照回放。")
    .replace("Import will restore the package strategy revision as an audited Strategy Lab version.", "导入会把包内策略版本恢复为 Strategy Lab 的 audited 版本。")
    .replace("Import will write the package research note back to the local note store.", "导入会把包内研究笔记写回本地笔记库。")
    .replace("Package does not include a locked research note.", "复现包没有包含锁定研究笔记。")
    .replace("Import will restore paper execution records attached to the package run.", "导入会恢复附加在包内运行上的模拟执行记录。")
    .replace("Import will restore saved AI review records and their evidence anchors.", "导入会恢复保存的 AI 评审记录及其证据锚点。")
    .replace("Authority conflict: a legacy Review already owns this Review ID.", "Authority 冲突：该评审 ID 已由 legacy 评审占用。")
    .replace("Authoritative Review ID and recordHash are same-hash.", "权威评审 ID 与 recordHash 一致。")
    .replace("Authoritative Review ID conflict: recordHash differs from persisted evidence.", "权威评审 ID 冲突：recordHash 与持久化证据不同。")
    .replace("Authoritative Review is new and will be added.", "权威评审为新增记录，将写入本地。")
    .replace("Decision ID and recordHash are same-hash.", "Decision ID 与 recordHash 一致。")
    .replace("Decision ID conflict: recordHash differs from persisted evidence.", "Decision ID 冲突：recordHash 与持久化证据不同。")
    .replace("Decision is new and will be added.", "Decision 为新增记录，将写入本地。")
    .replace("Decision chain fork: incoming Decision does not match the persisted ordered prefix.", "Decision 链分叉：传入 Decision 与持久化有序前缀不一致。")
    .replace("Decision ID recordHash conflict: archived evidence differs from the persisted prefix.", "Decision ID 的 recordHash 冲突：归档证据与持久化前缀不一致。")
    .replace("Decision append conflict: supersedesDecisionId does not extend the persisted prefix.", "Decision 追加冲突：supersedesDecisionId 未扩展持久化前缀。")
    .replace("Decision ID and recordHash are same-hash in the persisted prefix.", "Decision ID 与 recordHash 在持久化前缀中一致。")
    .replace("Incoming Decision chain is a persisted prefix; import preserves later Decisions.", "传入 Decision 链是持久化前缀；导入会保留后续 Decision。")
    .replace("Decision extends the persisted prefix and will append.", "Decision 扩展持久化前缀并将追加写入。")
    .replace(
      "Audit evidence summary run id does not match the import package manifest.",
      "审计证据摘要 run id 与导入包 manifest 不一致。"
    )
    .replace(
      /Audit focus carries (\d+)\/(\d+) package matches and (\d+) import diff blockers\./u,
      "审计焦点携带 $1/$2 条包检查命中和 $3 个导入差异阻断。"
    )
    .replace(
      "Package includes a portable Audit Markdown report bound to this manifest.",
      "复现包包含已绑定该 manifest 的便携 Audit Markdown 报告。"
    )
    .replace(
      "Package includes a portable Backtest Markdown report bound to this manifest.",
      "复现包包含已绑定该 manifest 的便携 Backtest Markdown 报告。"
    )
    .replace("Local core import verification: verified", "本地核心导入验签：通过")
    .replace("Local core import verification: invalid", "本地核心导入验签：失败")
    .replace("Local import must reject packages that claim live trading permission.", "本地导入必须拒绝声明实盘权限的复现包。")
    .replace("Import keeps the package inside the paper-only execution boundary.", "导入会把复现包保持在仅模拟盘执行边界内。");
}

export function researchRunImportAuditEvidenceQuery(event: ResearchRunImportAuditEvent): string {
  return researchRunImportAuditEvidenceAnchorQuery(event.runId, event.exportPath);
}

export function buildResearchRunImportAuditEvidenceUrl(event: ResearchRunImportAuditEvent): string {
  const url =
    typeof window === "undefined"
      ? new URL("http://aiqt.local/?workspace=audit")
      : new URL(window.location.href);
  url.searchParams.set("workspace", "audit");
  url.searchParams.set("auditEvent", event.id);
  url.searchParams.set("runId", event.runId);
  url.searchParams.set("exportPath", event.exportPath);
  url.searchParams.delete("workflow");
  return typeof window === "undefined" ? `${url.pathname}?${url.searchParams.toString()}` : url.toString();
}

export function researchRunImportAuditEventToAuditEventRecord(event: ResearchRunImportAuditEvent): AuditEventRecord {
  return {
    schemaVersion: 1,
    eventId: event.id,
    eventType: "research_run_import",
    runId: event.runId === "unknown" ? null : event.runId,
    createdAt: event.createdAt,
    stage: event.stage,
    source: "web",
    summary: event.summary,
    detail: event.detail,
    metadata: {
      fileName: event.fileName,
      previousRunId: event.previousRunId,
      rollbackTargetRunId: event.rollbackTargetRunId,
      undoToken: event.undoToken,
      failureCategory: event.failureCategory,
      recoveryHint: event.recoveryHint,
      blockedCount: event.blockedCount,
      blockedRows: event.blockedRows,
      artifactRows: event.artifactRows,
      changeCount: event.changeCount,
      exportPath: event.exportPath,
      tone: event.tone,
      verifiedReportSignatures: event.verifiedReportSignatures
    }
  };
}

export function auditEventRecordToResearchRunImportEvent(record: AuditEventRecord): ResearchRunImportAuditEvent | null {
  if (record.eventType !== "research_run_import" || !isResearchRunImportAuditEventStage(record.stage)) {
    return null;
  }
  return {
    id: record.eventId,
    stage: record.stage,
    runId: record.runId ?? "unknown",
    previousRunId: auditMetadataNullableString(record.metadata.previousRunId),
    rollbackTargetRunId: auditMetadataNullableString(record.metadata.rollbackTargetRunId),
    undoToken: auditMetadataNullableString(record.metadata.undoToken),
    fileName: auditMetadataString(record.metadata.fileName, "unknown"),
    createdAt: record.createdAt,
    summary: record.summary,
    detail: record.detail,
    failureCategory: auditMetadataFailureCategory(record.metadata.failureCategory),
    recoveryHint: auditMetadataString(record.metadata.recoveryHint, ""),
    blockedCount: auditMetadataNumber(record.metadata.blockedCount),
    blockedRows: auditMetadataBlockedRows(record.metadata.blockedRows),
    artifactRows: auditMetadataArtifactRows(record.metadata.artifactRows),
    changeCount: auditMetadataNumber(record.metadata.changeCount),
    exportPath: auditMetadataString(record.metadata.exportPath, `auditEvent:${record.eventId}`),
    tone: auditMetadataTone(record.metadata.tone),
    verifiedReportSignatures: auditMetadataVerifiedReportSignatures(record.metadata.verifiedReportSignatures)
  };
}

export function isResearchRunImportAuditEventStage(value: string): value is ResearchRunImportAuditEvent["stage"] {
  return (
    value === "preview" ||
    value === "blocked" ||
    value === "confirmed" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "undone" ||
    value === "undo-failed"
  );
}

export function auditMetadataString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function auditMetadataNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function auditMetadataNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function auditMetadataBlockedRows(value: unknown): ResearchRunImportAuditEvent["blockedRows"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = row.id;
      const label = auditMetadataString(row.label, "");
      const detail = auditMetadataString(row.detail, "");
      const exportPath = auditMetadataString(row.exportPath, "");
      const incoming = auditMetadataString(row.incoming, "");
      if (
        !isResearchRunImportDiffRowId(id) ||
        !label ||
        !detail ||
        !exportPath ||
        !incoming
      ) {
        return null;
      }
      return {
        id,
        label,
        detail,
        exportPath,
        incoming
      };
    })
    .filter((row): row is ResearchRunImportAuditEvent["blockedRows"][number] => Boolean(row));
}

export function auditMetadataArtifactRows(value: unknown): ResearchRunImportAuditEvent["artifactRows"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = row.id;
      const label = auditMetadataString(row.label, "");
      const detail = auditMetadataString(row.detail, "");
      const exportPath = auditMetadataString(row.exportPath, "");
      const incoming = auditMetadataString(row.incoming, "");
      const status = row.status;
      if (
        !isResearchRunImportDiffRowId(id) ||
        !label ||
        !detail ||
        !exportPath ||
        !incoming ||
        (status !== "same" && status !== "add" && status !== "change" && status !== "replace")
      ) {
        return null;
      }
      return {
        id,
        label,
        status,
        detail,
        exportPath,
        incoming
      };
    })
    .filter((row): row is ResearchRunImportAuditEvent["artifactRows"][number] => Boolean(row));
}

export function auditMetadataVerifiedReportSignatures(value: unknown): ResearchRunImportAuditEvent["verifiedReportSignatures"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = row.id;
      const label = auditMetadataString(row.label, "");
      const detail = auditMetadataString(row.detail, "");
      const exportPath = auditMetadataString(row.exportPath, "");
      const incoming = auditMetadataString(row.incoming, "");
      const reason = auditMetadataString(row.reason, "");
      const source = row.source;
      const status = row.status;
      if (
        (id !== "audit-report" && id !== "backtest-report") ||
        !label ||
        !detail ||
        !exportPath ||
        !incoming ||
        !reason ||
        source !== "local-core" ||
        (status !== "verified" && status !== "invalid")
      ) {
        return null;
      }
      return {
        id,
        label,
        detail,
        exportPath,
        incoming,
        reason,
        source,
        status
      };
    })
    .filter((row): row is ResearchRunImportAuditEvent["verifiedReportSignatures"][number] => Boolean(row));
}

export function isResearchRunImportDiffRowId(value: unknown): value is ResearchRunImportDiffRow["id"] {
  if (typeof value === "string"
    && (/^ai-review-run-v2:\d+$/u.test(value) || /^ai-review-decision:\d+$/u.test(value))) {
    return true;
  }
  return (
    value === "package-integrity" ||
    value === "artifact-counts" ||
    value === "run-id" ||
    value === "context" ||
    value === "timeframe" ||
    value === "data-snapshot" ||
    value === "market-calendar" ||
    value === "preparation-evidence" ||
    value === "strategy-revision" ||
    value === "research-note" ||
    value === "handoff-notes" ||
    value === "paper-executions" ||
    value === "adapter-paper-executions" ||
    value === "portfolio-paper-orders" ||
    value === "ai-review-runs" ||
    value === "audit-summary" ||
    value === "audit-report" ||
    value === "backtest-report" ||
    value === "live-boundary"
  );
}

export function auditMetadataFailureCategory(value: unknown): ResearchRunImportFailureCategory | null {
  return value === "schema" || value === "integrity" || value === "artifact-counts" || value === "core" || value === "unknown"
    ? value
    : null;
}

export function auditMetadataTone(value: unknown): ResearchRunImportAuditEvent["tone"] {
  return value === "positive" ||
    value === "warning" ||
    value === "neutral" ||
    value === "risk" ||
    value === "ai"
    ? value
    : "neutral";
}
