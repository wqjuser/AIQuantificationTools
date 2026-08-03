import type { AuditEvidenceDeepLinkStatus, AuditEvidenceMatchedEvidenceFocus, AuditEvidenceSummary, ResearchRunExportBrowserPackage, ResearchRunExportBrowserRow, ResearchRunImportAuditAggregation, ResearchRunImportAuditArtifactRow, ResearchRunImportAuditBlockedRow, ResearchRunImportAuditEvent, ResearchRunImportAuditEventStage, ResearchRunImportAuditFailureBucket, ResearchRunImportAuditFailureBucketCategory, ResearchRunImportAuditFilter, ResearchRunImportBlockedEvidenceBucket, ResearchRunImportBlockedEvidenceBucketCategory, ResearchRunImportDiffRow, ResearchRunImportUndoConfirmation, ResearchRunImportVerifiedReportSignature, ResearchRunImportVerifiedReportSignatureBucket } from "../audit/report-contracts";
import { isResearchRunImportAuditEventNeedsReview, isResearchRunImportAuditEventRecoverable, isResearchRunImportAuditEventUndoable, researchRunImportAuditDetail, researchRunImportAuditEventMatchesFilter, researchRunImportAuditSummary, researchRunImportAuditTone, researchRunImportBlockedEvidenceBucketCategory, researchRunImportBlockedEvidenceBucketLabel, researchRunImportBlockedEvidenceBucketOrder, researchRunImportBlockedEvidenceBucketTone, researchRunImportFailure, researchRunImportFailureBucketLabel, researchRunImportFailureBucketOrder, researchRunImportRecoveryHint, researchRunImportVerifiedReportSignatureBucketLabel, researchRunImportVerifiedReportSignatureBucketOrder, researchRunImportVerifiedReportSignatureBucketTone } from "../audit/signing-key-ledger";
import { filterResearchRunExportBrowserRows } from "./export-browser";
import type { ProductWorkAreaId } from "../stage1/foundation-contracts";
import { markdownTable } from "../strategy/backtest-builders";

export function filterResearchRunImportDiffRows(
  rows: ResearchRunImportDiffRow[],
  query: string
): ResearchRunImportDiffRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  return rows.filter((row) =>
    [row.id, row.label, row.status, row.current, row.incoming, row.detail, row.exportPath, row.tone]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

export function buildAuditEvidenceSummary({
  auditQuery,
  deepLinkError,
  deepLinkRunId,
  deepLinkStatus = "none",
  importDiffQuery,
  importDiffRows,
  importAuditEvents = [],
  packageQuery,
  packageRows
}: {
  auditQuery: string;
  deepLinkError?: string | null;
  deepLinkRunId?: string | null;
  deepLinkStatus?: AuditEvidenceDeepLinkStatus;
  importDiffQuery: string;
  importDiffRows: ResearchRunImportDiffRow[];
  importAuditEvents?: ResearchRunImportAuditEvent[];
  packageQuery: string;
  packageRows: ResearchRunExportBrowserRow[];
}): AuditEvidenceSummary {
  const normalizedAuditQuery = auditQuery.trim();
  const normalizedPackageQuery = packageQuery.trim();
  const normalizedImportDiffQuery = importDiffQuery.trim();
  const packageMatchedRows = filterResearchRunExportBrowserRows(packageRows, normalizedPackageQuery);
  const importDiffMatchedRows = filterResearchRunImportDiffRows(importDiffRows, normalizedImportDiffQuery);
  const packageMatchedCount = packageMatchedRows.length;
  const importDiffMatchedCount = importDiffMatchedRows.length;
  const packageReadyCount = packageRows.filter((row) => row.status === "ready").length;
  const packageMissingCount = packageRows.filter((row) => row.status === "missing").length;
  const packageBlockedCount = packageRows.filter((row) => row.status === "blocked").length;
  const importDiffAddCount = importDiffRows.filter((row) => row.status === "add").length;
  const importDiffChangeCount = importDiffRows.filter((row) => row.status === "change" || row.status === "replace").length;
  const importDiffBlockedCount = importDiffRows.filter((row) => row.status === "blocked").length;
  const importAuditAggregation = buildResearchRunImportAuditAggregation(importAuditEvents);
  const importPolicyBlockerBuckets = importAuditAggregation.blockedEvidenceBuckets.map((bucket) => ({
    category: bucket.category,
    count: bucket.count,
    label: bucket.label,
    latestDetail: bucket.latestDetail,
    latestExportPath: bucket.latestExportPath,
    latestFileName: bucket.latestFileName,
    latestRunId: bucket.latestRunId,
    tone: bucket.tone
  }));
  const importPolicyBlockedCount = importPolicyBlockerBuckets.reduce((total, bucket) => total + bucket.count, 0);
  const importVerificationBuckets = importAuditAggregation.verifiedReportSignatureBuckets.map((bucket) => ({
    count: bucket.count,
    latestExportPath: bucket.latestExportPath,
    latestReason: bucket.latestReason,
    source: bucket.source,
    status: bucket.status
  }));
  const importVerificationVerifiedCount =
    importVerificationBuckets.find((bucket) => bucket.status === "verified")?.count ?? 0;
  const importVerificationInvalidCount =
    importVerificationBuckets.find((bucket) => bucket.status === "invalid")?.count ?? 0;
  const latestImportVerification = importVerificationBuckets[0]
    ? `latest ${importVerificationBuckets[0].status} ${importVerificationBuckets[0].latestExportPath} · ${importVerificationBuckets[0].latestReason}`
    : "none";
  const latestImportPolicyBlocker = importPolicyBlockerBuckets[0]
    ? `latest ${importPolicyBlockerBuckets[0].label} ${importPolicyBlockerBuckets[0].latestExportPath} · ${importPolicyBlockerBuckets[0].latestDetail}`
    : "none";
  const runId =
    deepLinkRunId?.trim() ||
    packageRows.find((row) => row.exportPath.startsWith("manifest:"))?.value ||
    normalizedPackageQuery ||
    "unknown";
  const focusQuery = normalizedPackageQuery || normalizedImportDiffQuery || normalizedAuditQuery || runId;
  const matchedEvidenceFocus: AuditEvidenceMatchedEvidenceFocus[] = [
    ...packageMatchedRows.map((row) => ({
      area: "Export package" as const,
      detail: row.detail,
      exportPath: row.exportPath,
      label: row.label
    })),
    ...importDiffMatchedRows.map((row) => ({
      area: "Import diff" as const,
      detail: row.detail,
      exportPath: row.exportPath,
      label: row.label
    }))
  ];
  const matchedPackageEvidenceLine = packageMatchedRows.length
    ? `Matched package evidence: ${packageMatchedRows
        .map((row) => `${row.label} -> ${row.detail}`)
        .join(" | ")}`
    : null;
  const matchedImportEvidenceLine = importDiffMatchedRows.length
    ? `Matched import evidence: ${importDiffMatchedRows
        .map((row) => `${row.label} -> ${row.detail}`)
        .join(" | ")}`
    : null;
  const copyLines = [
    "AIQT Audit Evidence Summary",
    `Run: ${runId}`,
    `Audit query: ${normalizedAuditQuery || "none"}`,
    `Package focus: ${normalizedPackageQuery || "none"}`,
    `Import diff focus: ${normalizedImportDiffQuery || "none"}`,
    `Deep link: ${deepLinkStatus}${deepLinkError ? ` (${deepLinkError})` : ""}`,
    `Package checks: ${packageReadyCount} ready / ${packageMissingCount} missing / ${packageBlockedCount} blocked / ${packageMatchedCount} of ${packageRows.length} matched`,
    `Import diff: ${importDiffChangeCount} changes / ${importDiffAddCount} adds / ${importDiffBlockedCount} blocked / ${importDiffMatchedCount} of ${importDiffRows.length} matched`,
    matchedPackageEvidenceLine,
    matchedImportEvidenceLine,
    `Import policy blockers: ${importPolicyBlockedCount} blocked / ${latestImportPolicyBlocker}`,
    `Import report verification: ${importVerificationVerifiedCount} verified / ${importVerificationInvalidCount} invalid / ${latestImportVerification}`
  ].filter((line): line is string => Boolean(line));
  return {
    auditQuery: normalizedAuditQuery,
    copyText: copyLines.join("\n"),
    deepLinkError: deepLinkError ?? null,
    deepLinkStatus,
    focusQuery,
    importDiffAddCount,
    importDiffBlockedCount,
    importDiffChangeCount,
    importDiffMatchedCount,
    importDiffQuery: normalizedImportDiffQuery,
    importDiffTotalCount: importDiffRows.length,
    importPolicyBlockedCount,
    importPolicyBlockerBuckets,
    importVerificationBuckets,
    importVerificationInvalidCount,
    importVerificationVerifiedCount,
    matchedEvidenceFocus,
    packageBlockedCount,
    packageMatchedCount,
    packageMissingCount,
    packageQuery: normalizedPackageQuery,
    packageReadyCount,
    packageTotalCount: packageRows.length,
    runId
  };
}

export function buildAuditEvidenceReportMarkdown(
  summary: AuditEvidenceSummary,
  { generatedAt = new Date().toISOString() }: { generatedAt?: string } = {}
): string {
  const importVerificationBuckets = summary.importVerificationBuckets ?? [];
  const importPolicyBlockerBuckets = summary.importPolicyBlockerBuckets ?? [];
  const matchedEvidenceFocus = summary.matchedEvidenceFocus ?? [];
  const deepLinkDetail = summary.deepLinkError
    ? `${summary.deepLinkStatus} (${summary.deepLinkError})`
    : summary.deepLinkStatus;
  const evidenceRows = [
    [
      "Package checks",
      `${summary.packageReadyCount} ready`,
      `${summary.packageMissingCount} missing`,
      `${summary.packageBlockedCount} blocked`,
      `${summary.packageMatchedCount} / ${summary.packageTotalCount}`
    ],
    [
      "Import diff",
      `${summary.importDiffChangeCount} changes`,
      `${summary.importDiffAddCount} adds`,
      `${summary.importDiffBlockedCount} blocked`,
      `${summary.importDiffMatchedCount} / ${summary.importDiffTotalCount}`
    ]
  ];
  const importVerificationSection = importVerificationBuckets.length
    ? [
        "",
        "## Import Report Verification",
        "",
        markdownTable(
          ["Status", "Count", "Source", "Latest exportPath", "Latest reason"],
          importVerificationBuckets.map((bucket) => [
            bucket.status,
            String(bucket.count),
            bucket.source,
            bucket.latestExportPath,
            bucket.latestReason
          ])
        )
      ]
    : [];
  const importPolicyBlockerSection = importPolicyBlockerBuckets.length
    ? [
        "",
        "## Import Policy Blockers",
        "",
        markdownTable(
          ["Category", "Count", "Latest run", "Latest exportPath", "Latest detail"],
          importPolicyBlockerBuckets.map((bucket) => [
            bucket.label,
            String(bucket.count),
            bucket.latestRunId,
            bucket.latestExportPath,
            bucket.latestDetail
          ])
        )
      ]
    : [];
  const matchedEvidenceFocusSection = matchedEvidenceFocus.length
    ? [
        "",
        "### Matched Evidence",
        "",
        markdownTable(
          ["Area", "Label", "Detail"],
          matchedEvidenceFocus.map((item) => [item.area, item.label, item.detail])
        )
      ]
    : [];

  return [
    "# AIQuant Audit Evidence Report",
    "",
    `Generated at: \`${generatedAt}\``,
    `Run ID: \`${summary.runId}\``,
    `Deep link status: \`${deepLinkDetail}\``,
    "",
    "## Evidence Focus",
    "",
    markdownTable(
      ["Area", "Query"],
      [
        ["Audit ledger", summary.auditQuery || "none"],
        ["Export package", summary.packageQuery || "none"],
        ["Import diff", summary.importDiffQuery || "none"],
        ["Current focus", summary.focusQuery || "none"]
      ]
    ),
    ...matchedEvidenceFocusSection,
    "",
    "## Evidence Counts",
    "",
    markdownTable(["Area", "Ready / changes", "Missing / adds", "Blocked", "Matched"], evidenceRows),
    ...importPolicyBlockerSection,
    ...importVerificationSection,
    "",
    "## Portable Summary",
    "",
    "```text",
    summary.copyText,
    "```",
    "",
    "## Boundary",
    "",
    "This audit report fragment records reproducibility evidence and import impact context only. It does not provide buy/sell instructions, guaranteed returns, or live execution approval."
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n")
    .trimEnd()
    .concat("\n");
}

export function buildResearchRunImportAuditEvent({
  createdAt = new Date().toISOString(),
  error,
  exportPackage,
  fileName,
  previousRunId = null,
  rows,
  stage,
  undoToken = null
}: {
  exportPackage: Pick<ResearchRunExportBrowserPackage, "manifest"> | null | undefined;
  fileName: string;
  previousRunId?: string | null;
  rows: ResearchRunImportDiffRow[];
  stage: "preview" | "confirmed" | "failed" | "cancelled";
  createdAt?: string;
  error?: string | null;
  undoToken?: string | null;
}): ResearchRunImportAuditEvent {
  const runId = exportPackage?.manifest.runId ?? "unknown";
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const blockedRows = researchRunImportAuditBlockedRows(rows);
  const artifactRows = researchRunImportAuditArtifactRows(rows);
  const verifiedReportSignatures = researchRunImportVerifiedReportSignatures(rows);
  const changeCount = rows.filter(
    (row) => row.status === "add" || row.status === "change" || row.status === "replace"
  ).length;
  const resolvedStage: ResearchRunImportAuditEventStage =
    stage === "preview" && blockedCount > 0 ? "blocked" : stage;
  const summary = researchRunImportAuditSummary(resolvedStage);
  const failure = researchRunImportFailure(error);
  const detail = researchRunImportAuditDetail({
    blockedCount,
    changeCount,
    error: failure.detail ?? error,
    fileName,
    stage: resolvedStage
  });
  const normalizedPreviousRunId = previousRunId?.trim() || null;
  const rollbackTargetRunId = resolvedStage === "confirmed" ? normalizedPreviousRunId : null;
  const normalizedUndoToken = resolvedStage === "confirmed" ? undoToken?.trim() || null : null;

  return {
    id: `import:${runId}:${resolvedStage}:${createdAt}:${fileName || "unknown"}`,
    stage: resolvedStage,
    runId,
    previousRunId: normalizedPreviousRunId,
    rollbackTargetRunId,
    undoToken: normalizedUndoToken,
    fileName: fileName || "unknown",
    createdAt,
    summary,
    detail,
    failureCategory: resolvedStage === "failed" ? failure.category : null,
    recoveryHint: researchRunImportRecoveryHint(resolvedStage, rollbackTargetRunId, failure, normalizedUndoToken),
    blockedCount,
    blockedRows,
    artifactRows,
    changeCount,
    exportPath: exportPackage ? `manifest:${runId}` : `import:file:${fileName || "unknown"}`,
    tone: researchRunImportAuditTone(resolvedStage),
    verifiedReportSignatures
  };
}

export function researchRunImportAuditBlockedRows(rows: ResearchRunImportDiffRow[]): ResearchRunImportAuditBlockedRow[] {
  return rows
    .filter((row) => row.status === "blocked")
    .map((row) => ({
      id: row.id,
      label: row.label,
      detail: row.detail,
      exportPath: row.exportPath,
      incoming: row.incoming
    }));
}

export function researchRunImportVerifiedReportSignatures(
  rows: ResearchRunImportDiffRow[]
): ResearchRunImportVerifiedReportSignature[] {
  return rows
    .map((row) => {
      if (row.id !== "audit-report" && row.id !== "backtest-report") {
        return null;
      }
      const match = row.detail.match(/Local core import verification: (verified|invalid)(?: · ([^·]+))?/u);
      if (!match) {
        return null;
      }
      const status = match[1] as ResearchRunImportVerifiedReportSignature["status"];
      const reason = match[2]?.trim() || status;
      return {
        id: row.id,
        label: row.label,
        detail: `Local core import verification: ${status} · ${reason}`,
        exportPath: row.exportPath,
        incoming: row.incoming,
        reason,
        source: "local-core" as const,
        status
      };
    })
    .filter((row): row is ResearchRunImportVerifiedReportSignature => Boolean(row));
}

export function buildResearchRunImportUndoAuditEvent({
  createdAt = new Date().toISOString(),
  event
}: {
  createdAt?: string;
  event: ResearchRunImportAuditEvent;
}): ResearchRunImportAuditEvent {
  const consumedUndoToken = event.undoToken?.trim() || "unknown";
  return {
    ...event,
    createdAt,
    stage: "undone",
    summary: researchRunImportAuditSummary("undone"),
    detail: researchRunImportAuditDetail({
      blockedCount: event.blockedCount,
      changeCount: event.changeCount,
      fileName: event.fileName,
      stage: "undone"
    }),
    undoToken: null,
    recoveryHint: researchRunImportRecoveryHint("undone", event.rollbackTargetRunId, {
      category: "unknown",
      detail: null
    }, consumedUndoToken),
    tone: researchRunImportAuditTone("undone"),
    artifactRows: [],
    verifiedReportSignatures: []
  };
}

export function buildResearchRunImportUndoFailureAuditEvent({
  createdAt = new Date().toISOString(),
  error,
  event
}: {
  createdAt?: string;
  error?: string | null;
  event: ResearchRunImportAuditEvent;
}): ResearchRunImportAuditEvent {
  const failure = researchRunImportFailure(error);
  return {
    ...event,
    id: `${event.id}:undo-failed:${createdAt}`,
    createdAt,
    stage: "undo-failed",
    summary: researchRunImportAuditSummary("undo-failed"),
    detail: researchRunImportAuditDetail({
      blockedCount: event.blockedCount,
      changeCount: event.changeCount,
      error: failure.detail ?? error,
      fileName: event.fileName,
      stage: "undo-failed"
    }),
    failureCategory: failure.category,
    recoveryHint: researchRunImportRecoveryHint("undo-failed", event.rollbackTargetRunId, failure, event.undoToken),
    tone: researchRunImportAuditTone("undo-failed"),
    artifactRows: [],
    verifiedReportSignatures: []
  };
}

export function buildResearchRunImportUndoConfirmation(
  event: ResearchRunImportAuditEvent
): ResearchRunImportUndoConfirmation | null {
  const undoToken = event.undoToken?.trim();
  if (event.stage !== "confirmed" || !undoToken) {
    return null;
  }
  const artifactSummary = researchRunImportUndoArtifactSummary(event.artifactRows);
  return {
    undoToken,
    runId: event.runId,
    fileName: event.fileName,
    message: "Confirm import undo",
    detail: artifactSummary
      ? `Undo import ${undoToken} will restore previous audited stores, ${artifactSummary}, and cannot be repeated.`
      : `Undo import ${undoToken} will restore previous audited stores and cannot be repeated.`
  };
}

export function researchRunImportUndoArtifactSummary(rows: ResearchRunImportAuditArtifactRow[]): string {
  if (!rows.length) {
    return "";
  }
  const artifactLabels = rows.map((row) => {
    if (row.id === "adapter-paper-executions" || row.id === "portfolio-paper-orders") {
      return `${row.label}: ${row.detail}`;
    }
    return row.label;
  });
  return `remove ${rows.length} imported artifact row${rows.length === 1 ? "" : "s"} (${artifactLabels.join("; ")})`;
}

export function mergeResearchRunImportAuditEvents(
  events: ResearchRunImportAuditEvent[],
  event: ResearchRunImportAuditEvent,
  limit = 12
): ResearchRunImportAuditEvent[] {
  return [event, ...events.filter((item) => item.id !== event.id)].slice(0, limit);
}

export function buildResearchRunImportAuditAggregation(
  events: ResearchRunImportAuditEvent[]
): ResearchRunImportAuditAggregation {
  const stageCounts: Record<ResearchRunImportAuditEventStage, number> = {
    blocked: 0,
    cancelled: 0,
    confirmed: 0,
    failed: 0,
    preview: 0,
    undone: 0,
    "undo-failed": 0
  };
  const failureBuckets = new Map<ResearchRunImportAuditFailureBucketCategory, ResearchRunImportAuditFailureBucket>();
  const blockedEvidenceBuckets = new Map<
    ResearchRunImportBlockedEvidenceBucketCategory,
    ResearchRunImportBlockedEvidenceBucket
  >();
  const verifiedReportSignatureBuckets = new Map<
    ResearchRunImportVerifiedReportSignatureBucket["status"],
    ResearchRunImportVerifiedReportSignatureBucket
  >();
  let needsReview = 0;
  let recoverable = 0;
  let undoable = 0;

  events.forEach((event) => {
    stageCounts[event.stage] += 1;
    if (isResearchRunImportAuditEventUndoable(event)) {
      undoable += 1;
    }
    if (isResearchRunImportAuditEventRecoverable(event)) {
      recoverable += 1;
    }
    event.verifiedReportSignatures.forEach((row) => {
      const existingSignatureBucket = verifiedReportSignatureBuckets.get(row.status);
      if (existingSignatureBucket) {
        existingSignatureBucket.count += 1;
        if (!existingSignatureBucket.rowIds.includes(row.id)) {
          existingSignatureBucket.rowIds.push(row.id);
        }
        if (event.createdAt >= existingSignatureBucket.latestCreatedAt) {
          existingSignatureBucket.latestCreatedAt = event.createdAt;
          existingSignatureBucket.latestDetail = row.detail;
          existingSignatureBucket.latestExportPath = row.exportPath;
          existingSignatureBucket.latestFileName = event.fileName;
          existingSignatureBucket.latestReason = row.reason;
          existingSignatureBucket.latestRunId = event.runId;
        }
        return;
      }
      verifiedReportSignatureBuckets.set(row.status, {
        status: row.status,
        count: 1,
        label: researchRunImportVerifiedReportSignatureBucketLabel(row.status),
        latestCreatedAt: event.createdAt,
        latestDetail: row.detail,
        latestExportPath: row.exportPath,
        latestFileName: event.fileName,
        latestReason: row.reason,
        latestRunId: event.runId,
        rowIds: [row.id],
        source: row.source,
        tone: researchRunImportVerifiedReportSignatureBucketTone(row.status)
      });
    });
    if (!isResearchRunImportAuditEventNeedsReview(event)) {
      return;
    }
    needsReview += 1;
    const category: ResearchRunImportAuditFailureBucketCategory =
      event.stage === "blocked" ? "blocked" : event.failureCategory ?? "unknown";
    const existing = failureBuckets.get(category);
    if (existing) {
      existing.count += 1;
      existing.stageCounts[event.stage] = (existing.stageCounts[event.stage] ?? 0) + 1;
      if (event.createdAt > existing.latestCreatedAt) {
        existing.latestCreatedAt = event.createdAt;
        existing.latestFileName = event.fileName;
        existing.latestRunId = event.runId;
        existing.recoveryHint = event.recoveryHint;
      }
      return;
    }
    failureBuckets.set(category, {
      category,
      count: 1,
      label: researchRunImportFailureBucketLabel(category),
      latestCreatedAt: event.createdAt,
      latestFileName: event.fileName,
      latestRunId: event.runId,
      recoveryHint: event.recoveryHint,
      stageCounts: {
        [event.stage]: 1
      },
      tone: "risk"
    });
    event.blockedRows.forEach((row) => {
      const blockedCategory = researchRunImportBlockedEvidenceBucketCategory(row);
      const existingBlockedBucket = blockedEvidenceBuckets.get(blockedCategory);
      if (existingBlockedBucket) {
        existingBlockedBucket.count += 1;
        if (!existingBlockedBucket.rowIds.includes(row.id)) {
          existingBlockedBucket.rowIds.push(row.id);
        }
        if (event.createdAt >= existingBlockedBucket.latestCreatedAt) {
          existingBlockedBucket.latestCreatedAt = event.createdAt;
          existingBlockedBucket.latestDetail = row.detail;
          existingBlockedBucket.latestExportPath = row.exportPath;
          existingBlockedBucket.latestFileName = event.fileName;
          existingBlockedBucket.latestRunId = event.runId;
        }
        return;
      }
      blockedEvidenceBuckets.set(blockedCategory, {
        category: blockedCategory,
        count: 1,
        label: researchRunImportBlockedEvidenceBucketLabel(blockedCategory),
        latestCreatedAt: event.createdAt,
        latestDetail: row.detail,
        latestExportPath: row.exportPath,
        latestFileName: event.fileName,
        latestRunId: event.runId,
        rowIds: [row.id],
        tone: researchRunImportBlockedEvidenceBucketTone(blockedCategory)
      });
    });
  });

  return {
    total: events.length,
    preview: stageCounts.preview,
    blocked: stageCounts.blocked,
    confirmed: stageCounts.confirmed,
    failed: stageCounts.failed,
    cancelled: stageCounts.cancelled,
    undone: stageCounts.undone,
    undoFailed: stageCounts["undo-failed"],
    needsReview,
    undoable,
    recoverable,
    failureBuckets: researchRunImportFailureBucketOrder
      .map((category) => failureBuckets.get(category))
      .filter((bucket): bucket is ResearchRunImportAuditFailureBucket => Boolean(bucket)),
    blockedEvidenceBuckets: researchRunImportBlockedEvidenceBucketOrder
      .map((category) => blockedEvidenceBuckets.get(category))
      .filter((bucket): bucket is ResearchRunImportBlockedEvidenceBucket => Boolean(bucket)),
    verifiedReportSignatureBuckets: researchRunImportVerifiedReportSignatureBucketOrder
      .map((status) => verifiedReportSignatureBuckets.get(status))
      .filter((bucket): bucket is ResearchRunImportVerifiedReportSignatureBucket => Boolean(bucket))
  };
}

export function filterResearchRunImportAuditEvents(
  events: ResearchRunImportAuditEvent[],
  query: string,
  filter: ResearchRunImportAuditFilter = "all"
): ResearchRunImportAuditEvent[] {
  const normalizedQuery = query.trim().toLowerCase();
  return events.filter((event) => {
    if (!researchRunImportAuditEventMatchesFilter(event, filter)) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    const searchableText = [
      event.id,
      event.stage,
      event.runId,
      event.fileName,
      event.createdAt,
      event.summary,
      event.detail,
      event.previousRunId ?? "",
      event.rollbackTargetRunId ?? "",
      event.rollbackTargetRunId && event.stage !== "undone" ? "rollback" : "",
      event.undoToken ?? "",
      event.undoToken ? "undo" : "",
      isResearchRunImportAuditEventUndoable(event) ? "undoable" : "",
      isResearchRunImportAuditEventNeedsReview(event) ? "needs review" : "",
      isResearchRunImportAuditEventRecoverable(event) ? "recoverable recovery" : "",
      event.stage === "undone" ? "undo consumed" : "",
      event.stage === "undo-failed" ? "undo failed retry recovery" : "",
      event.failureCategory ?? "",
      event.recoveryHint,
      String(event.blockedCount),
      event.blockedRows
        .map((row) => [row.id, row.label, row.incoming, row.detail, row.exportPath].join(" "))
        .join(" "),
      event.artifactRows
        .map((row) => [row.id, row.label, row.status, row.incoming, row.detail, row.exportPath].join(" "))
        .join(" "),
      event.verifiedReportSignatures
        .map((row) => [row.id, row.label, row.incoming, row.detail, row.exportPath, row.source, row.status, row.reason].join(" "))
        .join(" "),
      String(event.changeCount),
      event.exportPath,
      event.tone
    ]
      .join(" ")
      .toLowerCase();
    if (searchableText.includes(normalizedQuery)) {
      return true;
    }
    const normalizedSearchableText = normalizeResearchRunImportAuditSearchText(searchableText);
    const normalizedSearchQuery = normalizeResearchRunImportAuditSearchText(normalizedQuery);
    return Boolean(
      normalizedSearchQuery &&
        normalizedSearchQuery
          .split(" ")
          .filter(Boolean)
          .every((token) => normalizedSearchableText.includes(token))
    );
  });
}

export const researchRunImportAuditArtifactRowIds = new Set<ResearchRunImportDiffRow["id"]>([
  "market-calendar",
  "preparation-evidence",
  "paper-executions",
  "adapter-paper-executions",
  "portfolio-paper-orders",
  "stage4-portfolio-workflows",
  "ai-review-runs",
  "audit-summary",
  "audit-report",
  "backtest-report"
]);

export function researchRunImportAuditArtifactRows(rows: ResearchRunImportDiffRow[]): ResearchRunImportAuditArtifactRow[] {
  return rows.flatMap((row) => {
    const isStage3Evidence =
      row.id.startsWith("ai-review-run-v2:") || row.id.startsWith("ai-review-decision:");
    if ((!researchRunImportAuditArtifactRowIds.has(row.id) && !isStage3Evidence)
      || row.status === "blocked"
      || (row.status === "same" && !isStage3Evidence)) {
      return [];
    }
    return [{
      id: row.id,
      label: row.label,
      status: row.status,
      detail: row.detail,
      exportPath: row.exportPath,
      incoming: row.incoming
    }];
  });
}

export function normalizeResearchRunImportAuditSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_\-\u4e00-\u9fff]+/giu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export const auditReportLedgerProductWorkAreaIds: readonly ProductWorkAreaId[] = [
  "market",
  "research",
  "strategy",
  "backtest",
  "ai-review",
  "portfolio",
  "execution",
  "audit",
  "settings"
];

export function auditReportLedgerProductWorkAreaId(value: string): ProductWorkAreaId | null {
  return auditReportLedgerProductWorkAreaIds.includes(value as ProductWorkAreaId) ? (value as ProductWorkAreaId) : null;
}

export function auditReportLedgerEvidenceTargetWorkspaceId(search: string): ProductWorkAreaId | null {
  if (!search.trim()) {
    return null;
  }
  const workspaceMatch = search.match(/(?:^|[?&])workspace=([^&]+)/u);
  const workspaceId = workspaceMatch ? decodeURIComponent(workspaceMatch[1].replace(/\+/gu, " ")) : "";
  return auditReportLedgerProductWorkAreaId(workspaceId);
}

export function auditReportLedgerDecodedSearchText(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/gu, " "));
  } catch {
    return value;
  }
}
