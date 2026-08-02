import { useState } from "react";

import { Panel } from "./AppPanel";
import {
  AiReviewAuditComparison,
  AiReviewAuditTimelineBoard,
  AiReviewExportEvidenceIndexBoard,
  AiReviewRecordDriftSummary,
  AiReviewRiskReferenceBoard,
  AiReviewRunRecordHistory,
  aiCitationDetail,
  aiCitationLabel,
  aiCitationValue
} from "./AiReviewAuditBoards";
import type { AppI18n } from "../lib/i18n";
import type {
  AiReviewRunHistoryPagination,
  AiReviewRunRecordEnvelope,
  ResearchRunExportPackage
} from "../lib/terminal-api";
import {
  buildAiReviewAuditTimelineItems,
  buildAiReviewExportEvidenceIndexRows,
  buildAiReviewRecordDriftRows,
  filterAiReviewExportEvidenceIndexRows,
  type AiReviewDossier,
  type AiReviewRunRecord,
  type ProductWorkAreaId,
  type ResearchContextMarketCalendar,
  type ResearchRunDataPreparationEvidence,
  type ResearchRunDataSnapshot,
  type RiskApprovalSummary
} from "../lib/terminal-workbench";

export function AiReviewAuditTrailPanel({
  className,
  currentRecord,
  currentRunId,
  currentStrategyRevision,
  dataSnapshot,
  dossier,
  exportPackage,
  historyPagination,
  historyQuery,
  i18n,
  isLoadingHistory,
  liveExecutionBlocked,
  marketCalendar,
  preparationEvidence,
  onHistoryQueryChange,
  onNextHistoryPage,
  onPreviousHistoryPage,
  onSelectWorkspace,
  records,
  riskApproval,
  roundCount
}: {
  className?: string;
  currentRecord: AiReviewRunRecord | null;
  currentRunId: string | null;
  currentStrategyRevision: string;
  dataSnapshot: ResearchRunDataSnapshot | null;
  dossier: AiReviewDossier;
  exportPackage: ResearchRunExportPackage | null;
  historyPagination: AiReviewRunHistoryPagination | null;
  historyQuery: string;
  i18n: AppI18n;
  isLoadingHistory: boolean;
  liveExecutionBlocked: boolean;
  marketCalendar: ResearchContextMarketCalendar | null;
  preparationEvidence: ResearchRunDataPreparationEvidence | null;
  onHistoryQueryChange: (query: string) => void;
  onNextHistoryPage: () => void;
  onPreviousHistoryPage: () => void;
  onSelectWorkspace: (workspaceId: ProductWorkAreaId) => void;
  records: AiReviewRunRecordEnvelope[];
  riskApproval: RiskApprovalSummary;
  roundCount: number;
}) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const latestRecord = records[0] ?? null;
  const selectedRecord = records.find((record) => record.aiReviewId === selectedRecordId) ?? latestRecord;
  const driftRows = buildAiReviewRecordDriftRows({
    currentCitationCount: dossier.citations.length,
    currentRunId,
    currentStatus: dossier.status,
    currentStrategyRevision,
    liveExecutionBlocked,
    records: records.map((record) => record.record),
    roundCount
  });
  const timelineItems = buildAiReviewAuditTimelineItems({
    aiBoundary: currentRecord?.boundary ?? "",
    citationCount: dossier.citations.length,
    currentRunId,
    currentStrategyRevision,
    dataSnapshot,
    decisionCount: currentRecord?.summary.decisionCount ?? 0,
    dossier,
    marketCalendar,
    preparationEvidence,
    records: records.map((record) => record.record),
    roundCount,
    riskApproval
  });
  const [evidenceIndexQuery, setEvidenceIndexQuery] = useState("");
  const evidenceIndexRows = buildAiReviewExportEvidenceIndexRows({
    currentRecord,
    exportPackage,
    records: records.map((record) => record.record),
    timelineItems
  });
  const filteredEvidenceIndexRows = filterAiReviewExportEvidenceIndexRows(evidenceIndexRows, evidenceIndexQuery);
  const totalHistoryRecords = historyPagination?.total ?? records.length;

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "AI 评审审计" : "AI Review Audit"}
      subtitle={i18n.locale === "zh-CN" ? "保存记录、引用证据与风控边界" : "Saved records, citations, and risk boundary"}
      className={className}
    >
      <div className="audit-ai-trail-grid">
        <AiReviewAuditComparison
          currentCitationCount={dossier.citations.length}
          currentRunId={currentRunId}
          currentStatus={dossier.status}
          currentStrategyRevision={currentStrategyRevision}
          i18n={i18n}
          latestRecord={selectedRecord}
          liveExecutionBlocked={liveExecutionBlocked}
          roundCount={roundCount}
        />
        <AiReviewAuditTimelineBoard
          i18n={i18n}
          items={timelineItems}
          onSelectRecord={setSelectedRecordId}
          onSelectWorkspace={onSelectWorkspace}
        />
        <AiReviewExportEvidenceIndexBoard
          i18n={i18n}
          onQueryChange={setEvidenceIndexQuery}
          query={evidenceIndexQuery}
          rows={filteredEvidenceIndexRows}
          totalRows={evidenceIndexRows.length}
        />
        <AiReviewRiskReferenceBoard approval={riskApproval} i18n={i18n} />
        <AiReviewRecordDriftSummary
          i18n={i18n}
          onQueryChange={onHistoryQueryChange}
          query={historyQuery}
          rows={driftRows}
          totalRows={totalHistoryRecords}
        />
        <AiReviewRunRecordHistory
          i18n={i18n}
          isLoading={isLoadingHistory}
          onNextPage={onNextHistoryPage}
          onPreviousPage={onPreviousHistoryPage}
          onSelectRecord={setSelectedRecordId}
          pagination={historyPagination}
          query={historyQuery}
          records={records}
          selectedRecordId={selectedRecord?.aiReviewId ?? null}
          totalRecords={totalHistoryRecords}
        />
        <div className="audit-ai-citation-list">
          <div className="agent-rounds-title">
            <span>{i18n.locale === "zh-CN" ? "引用证据" : "Citations"}</span>
            <strong>{dossier.citations.length}</strong>
          </div>
          {dossier.citations.map((citation) => (
            <article className={`audit-ai-citation ${citation.tone}`} key={citation.id}>
              <span>{aiCitationLabel(i18n, citation)}</span>
              <strong>{aiCitationValue(i18n, citation)}</strong>
              <p>{aiCitationDetail(i18n, citation)}</p>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  );
}
