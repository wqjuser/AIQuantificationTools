import { buildPersonalTeamUsabilityReadinessReviewAuditEvent, saveAuditEvent } from "../../../lib/terminal-api";
import { buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceGeneratedQuery, buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceLinkedCoverageReviewQuery, buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceReviewQuery, buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageLinkedAcceptanceReviewQuery, buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageReviewQuery, buildDailyOpsControlRoomReviewMarkdown, buildDailyOpsControlRoomReviewReference, buildDailyOpsControlRoomSummary, buildDailyStartBrief, buildDailyStartBriefMarkdown, buildDailyStartBriefReviewReference, buildP2ReadinessAcceptanceReviewMarkdown, buildP2ReadinessAcceptanceSummary, buildP2ReadinessEvidenceCoverage, buildP2ReadinessEvidenceCoverageReviewMarkdown, buildPersonalTeamUsabilityReadinessReviewMarkdown, buildPersonalTeamUsabilityReadinessReviewReference, buildPersonalTeamUsabilityReadinessSummary, buildStage1P0DailyUseArchiveReviewReference, buildStage1P0DailyUseClosure, buildStage1P0DailyUseStartupSnapshot, findLatestP2ReadinessAcceptanceAuditLedgerRow, findLatestP2ReadinessEvidenceCoverageReviewAuditLedgerRow, P2ReadinessEvidenceCoverageRow, resolveP2ReadinessAcceptanceAuditEventReference, resolveP2ReadinessEvidenceCoverageReviewAuditEventReference } from "../../../lib/terminal-workbench";
import { mergeAuditEvidenceReportEvent } from "../../audit/event-merges";
import { AUDIT_REPORT_EVENTS_PAGE_SIZE, initialStage1P0DailyUseShareDeepLinkState, initialStage1P0DailyUseShareDeepLinkStatus, quantCoreBaseUrl } from "../initial-state";
import { useCallback, useMemo } from "react";
import type { AppControllerBindings } from "./bindings";

type Dependencies = Pick<AppControllerBindings, "auditEvidenceReportEvents" | "auditEvidenceReportLedgerRows" | "auditEvidenceReportLedgerSummary" | "copiedPersonalTeamReadinessReview" | "copyAuditReportLedgerQueryLink" | "desktopReleaseSummary" | "error" | "executionAdapterChainHealthRollups" | "focusOperatorRunbookAudit" | "handoffNotesState" | "latestP2ManifestChainPreflightReviewAuditRow" | "latestP2ReadinessAcceptanceGeneratedAuditRow" | "marketDataRefreshGuard" | "openAuditReportLedgerQuery" | "openP2ManifestChainPreflightReviewAudit" | "operatorRunbookAuditCoverage" | "p0AcceptanceSummary" | "p0CompletionChecklist" | "p0PlatformReadinessSummary" | "p1AcceptanceSummary" | "p2ManifestChainPreflightSummary" | "p2PaperReplaySummary" | "p2PreLiveAcceptanceSummary" | "p2ReadinessAcceptanceAuditContext" | "p2ReadinessAcceptanceGeneratedAuditEventId" | "p2ReadinessAcceptanceGeneratedAuditEventReference" | "p2ReadinessAcceptanceLatestState" | "p2ReadinessAcceptanceReviewAuditEvent" | "p2ReadinessEvidenceCoverageReviewAuditEvent" | "preLiveReadinessChecklist" | "researchContextReadinessRows" | "savingPersonalTeamReadinessReview" | "selectProductWorkArea" | "setAuditEvidenceReportEvents" | "setCopiedPersonalTeamReadinessReview" | "setHandoffNotesState" | "setP2ReadinessAcceptanceLatestState" | "setP2ReadinessAcceptanceReviewAuditEvent" | "setP2ReadinessEvidenceCoverageReviewAuditEvent" | "setSavingPersonalTeamReadinessReview" | "setStage1P0DailyUseRefreshOutcome" | "setWorkspaceState" | "source" | "stage1BootstrapPreflightSummary" | "stage1DailyUseSummary" | "stage1P0DailyUseRefreshOutcome" | "statusLabel" | "updateAuditEvidenceReportQuery" | "workspace">;
type Result = Pick<AppControllerBindings, "p2ReadinessEvidenceCoverage" | "latestP2ReadinessEvidenceCoverageReviewAuditRow" | "p2ReadinessEvidenceCoverageReviewAuditEventReference" | "p2ReadinessEvidenceCoverageReviewAuditEventId" | "p2ReadinessEvidenceCoverageReviewAuditEventSource" | "p2ReadinessAcceptanceSummary" | "personalTeamUsabilityReadiness" | "personalTeamReadinessReviewMarkdown" | "personalTeamReadinessReviewReference" | "p2ReadinessAcceptanceReviewAuditContext" | "latestP2ReadinessAcceptanceReviewAuditRow" | "p2ReadinessAcceptanceReviewAuditEventReference" | "p2ReadinessAcceptanceReviewAuditEventId" | "p2ReadinessAcceptanceReviewAuditEventSource" | "p2ReadinessEvidenceCoverageReviewMarkdown" | "p2ReadinessAcceptanceReviewMarkdown" | "dailyOpsControlRoom" | "dailyOpsControlRoomReviewMarkdown" | "dailyOpsControlRoomReviewReference" | "dailyStartBrief" | "stage1P0DailyUseClosure" | "dailyStartBriefReviewMarkdown" | "dailyStartBriefReviewReference" | "stage1P0DailyUseArchiveReviewReference" | "stage1P0DailyUseStartupSnapshot" | "openP2ReadinessAcceptanceGeneratedAudit" | "openP2ReadinessAcceptanceReviewAudit" | "openP2ReadinessAcceptanceCoverageReviewAudit" | "openP2ReadinessEvidenceCoverageReviewAudit" | "openP2ReadinessEvidenceCoverageLinkedAcceptanceReviewAudit" | "openP2ReadinessEvidenceCoverage" | "copyPersonalTeamReadinessReview" | "downloadPersonalTeamReadinessReview" | "recordPersonalTeamReadinessReview" | "openPersonalTeamReadinessReviewInAudit" | "copyPersonalTeamReadinessReviewAuditLink">;

export function useReadinessReviewModel(controller: Dependencies): Result {
  const {
    auditEvidenceReportEvents, auditEvidenceReportLedgerRows, auditEvidenceReportLedgerSummary, copiedPersonalTeamReadinessReview, copyAuditReportLedgerQueryLink, desktopReleaseSummary,
    error, executionAdapterChainHealthRollups, focusOperatorRunbookAudit, handoffNotesState, latestP2ManifestChainPreflightReviewAuditRow, latestP2ReadinessAcceptanceGeneratedAuditRow,
    marketDataRefreshGuard, openAuditReportLedgerQuery, openP2ManifestChainPreflightReviewAudit, operatorRunbookAuditCoverage, p0AcceptanceSummary, p0CompletionChecklist,
    p0PlatformReadinessSummary, p1AcceptanceSummary, p2ManifestChainPreflightSummary, p2PaperReplaySummary, p2PreLiveAcceptanceSummary, p2ReadinessAcceptanceAuditContext,
    p2ReadinessAcceptanceGeneratedAuditEventId, p2ReadinessAcceptanceGeneratedAuditEventReference, p2ReadinessAcceptanceLatestState, p2ReadinessAcceptanceReviewAuditEvent, p2ReadinessEvidenceCoverageReviewAuditEvent, preLiveReadinessChecklist,
    researchContextReadinessRows, savingPersonalTeamReadinessReview, selectProductWorkArea, setAuditEvidenceReportEvents, setCopiedPersonalTeamReadinessReview, setHandoffNotesState,
    setP2ReadinessAcceptanceLatestState, setP2ReadinessAcceptanceReviewAuditEvent, setP2ReadinessEvidenceCoverageReviewAuditEvent, setSavingPersonalTeamReadinessReview, setStage1P0DailyUseRefreshOutcome, setWorkspaceState,
    source, stage1BootstrapPreflightSummary, stage1DailyUseSummary, stage1P0DailyUseRefreshOutcome, statusLabel, updateAuditEvidenceReportQuery,
    workspace
  } = controller;
  const p2ReadinessEvidenceCoverage = buildP2ReadinessEvidenceCoverage({
      adapterChainHealthRollups: executionAdapterChainHealthRollups,
      operatorRunbookAuditCoverage,
      p2ManifestChainPreflight: p2ManifestChainPreflightSummary,
      p2ManifestChainPreflightReviewAuditRow: latestP2ManifestChainPreflightReviewAuditRow,
      p2PaperReplay: p2PaperReplaySummary,
      p2PreLiveAcceptance: p2PreLiveAcceptanceSummary,
      preLiveChecklist: preLiveReadinessChecklist
    });
  const latestP2ReadinessEvidenceCoverageReviewAuditRow = useMemo(
      () =>
        findLatestP2ReadinessEvidenceCoverageReviewAuditLedgerRow(
          auditEvidenceReportLedgerRows,
          p2ReadinessEvidenceCoverage
        ),
      [auditEvidenceReportLedgerRows, p2ReadinessEvidenceCoverage]
    );
  const p2ReadinessEvidenceCoverageReviewAuditEventReference = useMemo(
      () =>
        resolveP2ReadinessEvidenceCoverageReviewAuditEventReference({
          coverage: p2ReadinessEvidenceCoverage,
          event: p2ReadinessEvidenceCoverageReviewAuditEvent,
          ledgerRow: latestP2ReadinessEvidenceCoverageReviewAuditRow
        }),
      [
        latestP2ReadinessEvidenceCoverageReviewAuditRow,
        p2ReadinessEvidenceCoverage,
        p2ReadinessEvidenceCoverageReviewAuditEvent
      ]
    );
  const p2ReadinessEvidenceCoverageReviewAuditEventId =
      p2ReadinessEvidenceCoverageReviewAuditEventReference.eventId;
  const p2ReadinessEvidenceCoverageReviewAuditEventSource =
      p2ReadinessEvidenceCoverageReviewAuditEventReference.source;
  const p2ReadinessAcceptanceSummary = buildP2ReadinessAcceptanceSummary({
      evidenceCoverage: p2ReadinessEvidenceCoverage,
      evidenceCoverageReviewAuditEventId: p2ReadinessEvidenceCoverageReviewAuditEventId,
      p1Acceptance: p1AcceptanceSummary,
      p2PaperReplay: p2PaperReplaySummary,
      p2PreLiveAcceptance: p2PreLiveAcceptanceSummary,
      preLiveChecklist: preLiveReadinessChecklist
    });
  const personalTeamUsabilityReadiness = buildPersonalTeamUsabilityReadinessSummary({
      auditEvidenceReportLedgerSummary,
      handoffNoteCount: handoffNotesState.pagination?.total ?? handoffNotesState.handoffNotes.length,
      p0AcceptanceSummary,
      p0PlatformReadinessSummary,
      p1AcceptanceSummary,
      p2ManifestChainPreflightSummary,
      p2ReadinessAcceptanceSummary,
      p2ReadinessEvidenceCoverage
    });
  const personalTeamReadinessReviewMarkdown = useMemo(
      () => buildPersonalTeamUsabilityReadinessReviewMarkdown({ summary: personalTeamUsabilityReadiness }),
      [personalTeamUsabilityReadiness]
    );
  const personalTeamReadinessReviewReference = useMemo(
      () =>
        buildPersonalTeamUsabilityReadinessReviewReference({
          ledgerRows: auditEvidenceReportLedgerRows,
          summary: personalTeamUsabilityReadiness
        }),
      [auditEvidenceReportLedgerRows, personalTeamUsabilityReadiness]
    );
  const p2ReadinessAcceptanceReviewAuditContext = useMemo(
      () => ({
        ...p2ReadinessAcceptanceAuditContext,
        evidenceCoverageReviewAuditEventId: p2ReadinessEvidenceCoverageReviewAuditEventId
      }),
      [p2ReadinessAcceptanceAuditContext, p2ReadinessEvidenceCoverageReviewAuditEventId]
    );
  const latestP2ReadinessAcceptanceReviewAuditRow = useMemo(
      () =>
        findLatestP2ReadinessAcceptanceAuditLedgerRow(
          auditEvidenceReportLedgerRows,
          "p2_readiness_acceptance_review",
          p2ReadinessAcceptanceReviewAuditContext
        ),
      [auditEvidenceReportLedgerRows, p2ReadinessAcceptanceReviewAuditContext]
    );
  const p2ReadinessAcceptanceReviewAuditEventReference = useMemo(
      () =>
        resolveP2ReadinessAcceptanceAuditEventReference({
          context: p2ReadinessAcceptanceReviewAuditContext,
          event: p2ReadinessAcceptanceReviewAuditEvent,
          ledgerRow: latestP2ReadinessAcceptanceReviewAuditRow
        }),
      [
        latestP2ReadinessAcceptanceReviewAuditRow,
        p2ReadinessAcceptanceReviewAuditContext,
        p2ReadinessAcceptanceReviewAuditEvent
      ]
    );
  const p2ReadinessAcceptanceReviewAuditEventId = p2ReadinessAcceptanceReviewAuditEventReference.eventId;
  const p2ReadinessAcceptanceReviewAuditEventSource = p2ReadinessAcceptanceReviewAuditEventReference.source;
  const p2ReadinessEvidenceCoverageReviewMarkdown = useMemo(
      () =>
        buildP2ReadinessEvidenceCoverageReviewMarkdown({
          coverage: p2ReadinessEvidenceCoverage
        }),
      [p2ReadinessEvidenceCoverage]
    );
  const p2ReadinessAcceptanceReviewMarkdown = useMemo(
      () =>
        buildP2ReadinessAcceptanceReviewMarkdown({
          acceptance: p2ReadinessAcceptanceLatestState.acceptance ?? null,
          summary: p2ReadinessAcceptanceSummary
        }),
      [p2ReadinessAcceptanceLatestState.acceptance, p2ReadinessAcceptanceSummary]
    );
  const dailyOpsControlRoom = buildDailyOpsControlRoomSummary({
      auditEvidenceReportLedgerSummary,
      personalTeamUsabilityReadiness,
      p0CompletionChecklist
    });
  const dailyOpsControlRoomReviewMarkdown = useMemo(
      () => buildDailyOpsControlRoomReviewMarkdown({ summary: dailyOpsControlRoom }),
      [dailyOpsControlRoom]
    );
  const dailyOpsControlRoomReviewReference = useMemo(
      () =>
        buildDailyOpsControlRoomReviewReference({
          ledgerRows: auditEvidenceReportLedgerRows,
          summary: dailyOpsControlRoom
        }),
      [auditEvidenceReportLedgerRows, dailyOpsControlRoom]
    );
  const dailyStartBrief = useMemo(
      () =>
        buildDailyStartBrief({
          dailyOpsControlRoom,
          dailyOpsControlRoomReviewReference,
          personalTeamReadinessReviewReference,
          personalTeamUsabilityReadiness
        }),
      [
        dailyOpsControlRoom,
        dailyOpsControlRoomReviewReference,
        personalTeamReadinessReviewReference,
        personalTeamUsabilityReadiness
      ]
    );
  const stage1P0DailyUseClosure = useMemo(
      () =>
        buildStage1P0DailyUseClosure({
          bootstrapPreflight: stage1BootstrapPreflightSummary,
          dailyStartBrief,
          dailyUseReport: stage1DailyUseSummary,
          desktopRelease: desktopReleaseSummary,
          marketRefreshGuard: marketDataRefreshGuard,
          p0Acceptance: p0AcceptanceSummary,
          p1Acceptance: p1AcceptanceSummary,
          researchReadinessRows: researchContextReadinessRows
        }),
      [
        dailyStartBrief,
        stage1BootstrapPreflightSummary,
        stage1DailyUseSummary,
        desktopReleaseSummary,
        marketDataRefreshGuard,
        p0AcceptanceSummary,
        p1AcceptanceSummary,
        researchContextReadinessRows
      ]
    );
  const dailyStartBriefReviewMarkdown = useMemo(
      () => buildDailyStartBriefMarkdown({ brief: dailyStartBrief }),
      [dailyStartBrief]
    );
  const dailyStartBriefReviewReference = useMemo(
      () => buildDailyStartBriefReviewReference({ brief: dailyStartBrief, ledgerRows: auditEvidenceReportLedgerRows }),
      [auditEvidenceReportLedgerRows, dailyStartBrief]
    );
  const stage1P0DailyUseArchiveReviewReference = useMemo(
      () =>
        buildStage1P0DailyUseArchiveReviewReference({
          closure: stage1P0DailyUseClosure,
          invalidShareStatus: initialStage1P0DailyUseShareDeepLinkStatus,
          ledgerRows: auditEvidenceReportLedgerRows,
          refreshOutcome: stage1P0DailyUseRefreshOutcome,
          shareDeepLinkState: initialStage1P0DailyUseShareDeepLinkState
        }),
      [
        auditEvidenceReportLedgerRows,
        initialStage1P0DailyUseShareDeepLinkState,
        initialStage1P0DailyUseShareDeepLinkStatus,
        stage1P0DailyUseClosure,
        stage1P0DailyUseRefreshOutcome
      ]
    );
  const stage1P0DailyUseStartupSnapshot = useMemo(
      () =>
        buildStage1P0DailyUseStartupSnapshot({
          archiveReference: stage1P0DailyUseArchiveReviewReference,
          closure: stage1P0DailyUseClosure,
          refreshOutcome: stage1P0DailyUseRefreshOutcome
        }),
      [stage1P0DailyUseArchiveReviewReference, stage1P0DailyUseClosure, stage1P0DailyUseRefreshOutcome]
    );
  const openP2ReadinessAcceptanceGeneratedAudit = useCallback(() => {
      const auditEventId = p2ReadinessAcceptanceGeneratedAuditEventId;
      const matchingRow =
        p2ReadinessAcceptanceGeneratedAuditEventReference.ledgerRow ??
        (auditEventId ? auditEvidenceReportLedgerRows.find((row) => row.id === auditEventId) : undefined) ??
        latestP2ReadinessAcceptanceGeneratedAuditRow ??
        undefined;
      const ledgerQuery = buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceGeneratedQuery(matchingRow);
      const readback = p2ReadinessAcceptanceLatestState.acceptance ?? null;
      const fallbackQuery = [
        "p2_readiness_acceptance_generated",
        auditEventId,
        readback?.sourcePath ?? "data/p2-readiness-acceptance.json",
        readback?.status ?? p2ReadinessAcceptanceSummary.status,
        `${readback?.acceptedCriterionCount ?? p2ReadinessAcceptanceSummary.acceptedCount}/${
          readback?.totalCriterionCount ?? p2ReadinessAcceptanceSummary.totalCount
        }`,
        readback?.runId ?? "",
        readback?.market ?? "",
        readback?.symbol ?? "",
        readback?.timeframe ?? ""
      ]
        .filter(Boolean)
        .join(" ");
      const query = ledgerQuery || fallbackQuery;

      selectProductWorkArea("audit");
      updateAuditEvidenceReportQuery(query);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: auditEventId
          ? "P2 readiness acceptance generation audit event selected"
          : "P2 readiness acceptance generation audit query prepared",
        error: query ? undefined : "Generate the P2 readiness acceptance before opening its audit event."
      }));
    }, [
      auditEvidenceReportLedgerRows,
      latestP2ReadinessAcceptanceGeneratedAuditRow,
      p2ReadinessAcceptanceGeneratedAuditEventReference,
      p2ReadinessAcceptanceGeneratedAuditEventId,
      p2ReadinessAcceptanceLatestState.acceptance,
      p2ReadinessAcceptanceSummary.acceptedCount,
      p2ReadinessAcceptanceSummary.status,
      p2ReadinessAcceptanceSummary.totalCount,
      selectProductWorkArea,
      updateAuditEvidenceReportQuery
    ]);
  const openP2ReadinessAcceptanceReviewAudit = useCallback(() => {
      const auditEventId = p2ReadinessAcceptanceReviewAuditEventId;
      const matchingRow =
        p2ReadinessAcceptanceReviewAuditEventReference.ledgerRow ??
        (auditEventId ? auditEvidenceReportLedgerRows.find((row) => row.id === auditEventId) : undefined) ??
        latestP2ReadinessAcceptanceReviewAuditRow ??
        undefined;
      const ledgerQuery = buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceReviewQuery(matchingRow);
      const readback = p2ReadinessAcceptanceLatestState.acceptance ?? null;
      const savedFileName =
        typeof p2ReadinessAcceptanceReviewAuditEvent?.metadata?.fileName === "string"
          ? p2ReadinessAcceptanceReviewAuditEvent.metadata.fileName
          : "";
      const savedHash =
        typeof p2ReadinessAcceptanceReviewAuditEvent?.metadata?.contentSha256 === "string"
          ? p2ReadinessAcceptanceReviewAuditEvent.metadata.contentSha256.slice(0, 12)
          : "";
      const fallbackQuery = [
        "p2_readiness_acceptance_review",
        auditEventId,
        savedHash,
        savedFileName,
        readback?.market ?? "",
        readback?.symbol ?? "",
        readback?.timeframe ?? "",
        readback?.status ?? p2ReadinessAcceptanceSummary.status,
        `${readback?.acceptedCriterionCount ?? p2ReadinessAcceptanceSummary.acceptedCount}/${
          readback?.totalCriterionCount ?? p2ReadinessAcceptanceSummary.totalCount
        }`
      ]
        .filter(Boolean)
        .join(" ");
      const query = ledgerQuery || fallbackQuery;

      selectProductWorkArea("audit");
      updateAuditEvidenceReportQuery(query);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: auditEventId
          ? "P2 readiness acceptance review audit event selected"
          : "P2 readiness acceptance review audit query prepared",
        error: query ? undefined : "Record the P2 readiness acceptance review before opening its audit event."
      }));
    }, [
      auditEvidenceReportLedgerRows,
      latestP2ReadinessAcceptanceReviewAuditRow,
      p2ReadinessAcceptanceReviewAuditEventReference,
      p2ReadinessAcceptanceLatestState.acceptance,
      p2ReadinessAcceptanceReviewAuditEventId,
      p2ReadinessAcceptanceReviewAuditEvent,
      p2ReadinessAcceptanceSummary.acceptedCount,
      p2ReadinessAcceptanceSummary.status,
      p2ReadinessAcceptanceSummary.totalCount,
      selectProductWorkArea,
      updateAuditEvidenceReportQuery
    ]);
  const openP2ReadinessAcceptanceCoverageReviewAudit = useCallback(() => {
      const linkedCoverageReviewAuditEventId = p2ReadinessAcceptanceSummary.evidenceCoverageReviewAuditEventId ?? "";
      const matchingAcceptanceReviewRow =
        p2ReadinessAcceptanceReviewAuditEventReference.ledgerRow ??
        (p2ReadinessAcceptanceReviewAuditEventId
          ? auditEvidenceReportLedgerRows.find((row) => row.id === p2ReadinessAcceptanceReviewAuditEventId)
          : undefined) ??
        latestP2ReadinessAcceptanceReviewAuditRow ??
        undefined;
      const linkedCoverageReviewRow = linkedCoverageReviewAuditEventId
        ? auditEvidenceReportLedgerRows.find(
            (row) => row.reportKind === "p2_readiness_evidence_coverage_review" && row.id === linkedCoverageReviewAuditEventId
          )
        : undefined;
      const coverageLedgerQuery = buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageReviewQuery(linkedCoverageReviewRow);
      const acceptanceLinkedQuery =
        buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceLinkedCoverageReviewQuery(matchingAcceptanceReviewRow);
      const fallbackQuery = linkedCoverageReviewAuditEventId
        ? ["p2_readiness_evidence_coverage_review", linkedCoverageReviewAuditEventId].join(" ")
        : "";
      const query = coverageLedgerQuery || acceptanceLinkedQuery || fallbackQuery;

      selectProductWorkArea("audit");
      updateAuditEvidenceReportQuery(query);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: query
          ? "P2 readiness linked coverage review audit selected"
          : "P2 readiness linked coverage review unavailable",
        error: query
          ? undefined
          : "Record the P2 evidence coverage review before opening the linked coverage review."
      }));
    }, [
      auditEvidenceReportLedgerRows,
      latestP2ReadinessAcceptanceReviewAuditRow,
      p2ReadinessAcceptanceReviewAuditEventId,
      p2ReadinessAcceptanceReviewAuditEventReference.ledgerRow,
      p2ReadinessAcceptanceSummary.evidenceCoverageReviewAuditEventId,
      selectProductWorkArea,
      updateAuditEvidenceReportQuery
    ]);
  const openP2ReadinessEvidenceCoverageReviewAudit = useCallback(() => {
      const auditEventId = p2ReadinessEvidenceCoverageReviewAuditEventId;
      const matchingRow =
        p2ReadinessEvidenceCoverageReviewAuditEventReference.ledgerRow ??
        (auditEventId ? auditEvidenceReportLedgerRows.find((row) => row.id === auditEventId) : undefined) ??
        latestP2ReadinessEvidenceCoverageReviewAuditRow ??
        undefined;
      const ledgerQuery = buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageReviewQuery(matchingRow);
      const savedFileName =
        typeof p2ReadinessEvidenceCoverageReviewAuditEvent?.metadata?.fileName === "string"
          ? p2ReadinessEvidenceCoverageReviewAuditEvent.metadata.fileName
          : "";
      const savedHash =
        typeof p2ReadinessEvidenceCoverageReviewAuditEvent?.metadata?.contentSha256 === "string"
          ? p2ReadinessEvidenceCoverageReviewAuditEvent.metadata.contentSha256.slice(0, 12)
          : "";
      const fallbackQuery = [
        "p2_readiness_evidence_coverage_review",
        auditEventId,
        savedHash,
        savedFileName,
        p2ReadinessEvidenceCoverage.status,
        `${p2ReadinessEvidenceCoverage.coveredCount}/${p2ReadinessEvidenceCoverage.totalCount}`,
        p2ReadinessEvidenceCoverage.rows.map((row) => row.id).join(" "),
        p2ReadinessEvidenceCoverage.rows.map((row) => row.sourceType).join(" ")
      ]
        .filter(Boolean)
        .join(" ");
      const query = ledgerQuery || fallbackQuery;

      selectProductWorkArea("audit");
      updateAuditEvidenceReportQuery(query);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: auditEventId
          ? "P2 readiness evidence coverage review audit event selected"
          : "P2 readiness evidence coverage review audit query prepared",
        error: query ? undefined : "Record the P2 readiness evidence coverage review before opening its audit event."
      }));
    }, [
      auditEvidenceReportLedgerRows,
      latestP2ReadinessEvidenceCoverageReviewAuditRow,
      p2ReadinessEvidenceCoverage,
      p2ReadinessEvidenceCoverageReviewAuditEventReference,
      p2ReadinessEvidenceCoverageReviewAuditEvent,
      p2ReadinessEvidenceCoverageReviewAuditEventId,
      selectProductWorkArea,
      updateAuditEvidenceReportQuery
    ]);
  const openP2ReadinessEvidenceCoverageLinkedAcceptanceReviewAudit = useCallback(() => {
      const linkedCoverageReviewAuditEventId = p2ReadinessEvidenceCoverageReviewAuditEventId;
      const latestMatchingAcceptanceReviewRow =
        linkedCoverageReviewAuditEventId &&
        latestP2ReadinessAcceptanceReviewAuditRow?.p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId ===
          linkedCoverageReviewAuditEventId
          ? latestP2ReadinessAcceptanceReviewAuditRow
          : undefined;
      const matchingAcceptanceReviewRow =
        latestMatchingAcceptanceReviewRow ??
        (linkedCoverageReviewAuditEventId
          ? auditEvidenceReportLedgerRows.find(
              (row) =>
                row.reportKind === "p2_readiness_acceptance_review" &&
                row.p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId === linkedCoverageReviewAuditEventId
            )
          : undefined);
      const acceptanceReviewQuery =
        buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageLinkedAcceptanceReviewQuery(matchingAcceptanceReviewRow);
      const fallbackQuery = linkedCoverageReviewAuditEventId
        ? ["p2_readiness_acceptance_review", linkedCoverageReviewAuditEventId].join(" ")
        : "";
      const query = acceptanceReviewQuery || fallbackQuery;

      selectProductWorkArea("audit");
      updateAuditEvidenceReportQuery(query);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: query
          ? "P2 readiness linked acceptance review audit selected"
          : "P2 readiness linked acceptance review unavailable",
        error: query
          ? undefined
          : "Record the P2 readiness acceptance review before opening the linked acceptance review."
      }));
    }, [
      auditEvidenceReportLedgerRows,
      latestP2ReadinessAcceptanceReviewAuditRow,
      p2ReadinessEvidenceCoverageReviewAuditEventId,
      selectProductWorkArea,
      updateAuditEvidenceReportQuery
    ]);
  const openP2ReadinessEvidenceCoverage = useCallback(
      (row: P2ReadinessEvidenceCoverageRow) => {
        switch (row.id) {
          case "paper-replay-manifest":
            selectProductWorkArea("execution");
            setWorkspaceState((current) => ({
              ...current,
              statusLabel: "P2 paper replay evidence selected",
              error: undefined
            }));
            return;
          case "p2-acceptance-manifest":
            selectProductWorkArea("execution");
            setWorkspaceState((current) => ({
              ...current,
              statusLabel: "P2 pre-live acceptance evidence selected",
              error: undefined
            }));
            return;
          case "operator-runbook-audit":
            focusOperatorRunbookAudit();
            return;
          case "p2-manifest-chain-preflight-review":
            openP2ManifestChainPreflightReviewAudit();
            return;
          case "pre-live-checklist":
            selectProductWorkArea("execution");
            setWorkspaceState((current) => ({
              ...current,
              statusLabel: "P2 pre-live checklist evidence selected",
              error: undefined
            }));
            return;
          case "adapter-chain-health":
            selectProductWorkArea("settings");
            setWorkspaceState((current) => ({
              ...current,
              statusLabel: "P2 adapter chain evidence selected",
              error: undefined
            }));
            return;
          case "safety-boundary":
            selectProductWorkArea("execution");
            setWorkspaceState((current) => ({
              ...current,
              statusLabel: "P2 safety boundary evidence selected",
              error: undefined
            }));
            return;
        }
      },
      [focusOperatorRunbookAudit, openP2ManifestChainPreflightReviewAudit, selectProductWorkArea]
    );
  const copyPersonalTeamReadinessReview = useCallback(async () => {
      if (!navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Personal/team readiness review copy failed",
          error: "Clipboard is unavailable"
        }));
        return;
      }

      await navigator.clipboard.writeText(personalTeamReadinessReviewMarkdown);
      setCopiedPersonalTeamReadinessReview(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Personal/team readiness review copied",
        error: undefined
      }));
    }, [personalTeamReadinessReviewMarkdown]);
  const downloadPersonalTeamReadinessReview = useCallback(() => {
      const objectUrl = URL.createObjectURL(
        new Blob([personalTeamReadinessReviewMarkdown], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "personal-team-readiness-review.md";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Personal/team readiness review download ready",
        error: undefined
      }));
    }, [personalTeamReadinessReviewMarkdown]);
  const recordPersonalTeamReadinessReview = useCallback(async () => {
      setSavingPersonalTeamReadinessReview(true);
      try {
        const auditEvent = await buildPersonalTeamUsabilityReadinessReviewAuditEvent({
          markdown: personalTeamReadinessReviewMarkdown,
          summary: personalTeamUsabilityReadiness
        });
        const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        if (result.source === "core" && result.event) {
          setAuditEvidenceReportEvents((current) =>
            mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
          );
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: `Personal/team readiness review audited · ${result.event!.eventId}`,
            error: undefined
          }));
          return;
        }

        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Personal/team readiness review ledger save failed",
          error: result.error ?? "Personal/team readiness review ledger save failed"
        }));
      } catch (recordError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Personal/team readiness review ledger save failed",
          error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
        }));
      } finally {
        setSavingPersonalTeamReadinessReview(false);
      }
    }, [personalTeamReadinessReviewMarkdown, personalTeamUsabilityReadiness, quantCoreBaseUrl]);
  const openPersonalTeamReadinessReviewInAudit = useCallback(() => {
      if (!personalTeamReadinessReviewReference.query) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Personal/team readiness review audit reference missing",
          error: "No personal/team readiness review has been recorded yet."
        }));
        return;
      }

      openAuditReportLedgerQuery(personalTeamReadinessReviewReference.query, "Personal/team readiness review audit query selected");
    }, [openAuditReportLedgerQuery, personalTeamReadinessReviewReference.query]);
  const copyPersonalTeamReadinessReviewAuditLink = useCallback(() => {
      if (!personalTeamReadinessReviewReference.query) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Personal/team readiness review link copy failed",
          error: "No personal/team readiness review has been recorded yet."
        }));
        return;
      }

      void copyAuditReportLedgerQueryLink(personalTeamReadinessReviewReference.query);
    }, [copyAuditReportLedgerQueryLink, personalTeamReadinessReviewReference.query]);
  return {
    p2ReadinessEvidenceCoverage, latestP2ReadinessEvidenceCoverageReviewAuditRow, p2ReadinessEvidenceCoverageReviewAuditEventReference, p2ReadinessEvidenceCoverageReviewAuditEventId, p2ReadinessEvidenceCoverageReviewAuditEventSource, p2ReadinessAcceptanceSummary,
    personalTeamUsabilityReadiness, personalTeamReadinessReviewMarkdown, personalTeamReadinessReviewReference, p2ReadinessAcceptanceReviewAuditContext, latestP2ReadinessAcceptanceReviewAuditRow, p2ReadinessAcceptanceReviewAuditEventReference,
    p2ReadinessAcceptanceReviewAuditEventId, p2ReadinessAcceptanceReviewAuditEventSource, p2ReadinessEvidenceCoverageReviewMarkdown, p2ReadinessAcceptanceReviewMarkdown, dailyOpsControlRoom, dailyOpsControlRoomReviewMarkdown,
    dailyOpsControlRoomReviewReference, dailyStartBrief, stage1P0DailyUseClosure, dailyStartBriefReviewMarkdown, dailyStartBriefReviewReference, stage1P0DailyUseArchiveReviewReference,
    stage1P0DailyUseStartupSnapshot, openP2ReadinessAcceptanceGeneratedAudit, openP2ReadinessAcceptanceReviewAudit, openP2ReadinessAcceptanceCoverageReviewAudit, openP2ReadinessEvidenceCoverageReviewAudit, openP2ReadinessEvidenceCoverageLinkedAcceptanceReviewAudit,
    openP2ReadinessEvidenceCoverage, copyPersonalTeamReadinessReview, downloadPersonalTeamReadinessReview, recordPersonalTeamReadinessReview, openPersonalTeamReadinessReviewInAudit, copyPersonalTeamReadinessReviewAuditLink
  };
}
