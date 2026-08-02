import { createLatestRequestCoordinator } from "../../../lib/latest-request";
import { applyAuditSigningKeyRotationPlan, AuditEventHistoryPagination, AuditEventRecord, AuditSigningKeyControlledRestartEvidenceResult, AuditSigningKeyEnvironmentBindingResult, AuditSigningKeyRegistryResult, AuditSigningKeyRotationAcceptanceResult, AuditSigningKeyRotationApplyResult, AuditSigningKeyRotationPlanResult, AuditSigningKeyRuntimeReloadExecutionResult, AuditSigningKeyRuntimeReloadPlanResult, AuditSigningKeySecretMaterializationResult, buildAuditSigningKeyRotationApplyAuditEvent, buildAuditSigningKeyRotationPlanAuditEvent, loadAuditEvents, loadAuditSigningKeyEnvironmentBindings, loadAuditSigningKeyRotationAcceptances, loadAuditSigningKeyRuntimeReloadExecutions, loadAuditSigningKeyRuntimeReloadPlans, loadAuditSigningKeys, loadAuditSigningKeySecretMaterializations, prepareAuditSigningKeyRotationPlan, recordAuditSigningKeyEnvironmentBinding, recordAuditSigningKeyRotationAcceptance, recordAuditSigningKeyRuntimeReloadExecution, recordAuditSigningKeyRuntimeReloadPlan, recordAuditSigningKeySecretMaterialization, ResearchRunExportPackage, saveAuditEvent } from "../../../lib/terminal-api";
import { buildAuditSigningKeyRotationChainSummary, buildAuditSigningKeyRotationLedgerRows, filterAuditSigningKeyRotationLedgerRows, ResearchRunImportAuditEvent } from "../../../lib/terminal-workbench";
import { AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE, IMPORT_AUDIT_EVENTS_PAGE_SIZE, initialAuditSigningKeyEnvironmentBindingState, initialAuditSigningKeyRegistryState, initialAuditSigningKeyRestartEvidenceState, initialAuditSigningKeyRotationAcceptanceState, initialAuditSigningKeyRotationApplyState, initialAuditSigningKeyRotationLedgerStatus, initialAuditSigningKeyRotationPlanState, initialAuditSigningKeyRuntimeReloadExecutionState, initialAuditSigningKeyRuntimeReloadPlanState, initialAuditSigningKeySecretMaterializationState, quantCoreBaseUrl } from "../../app-shell/initial-state";
import { type ImportAuditEvidenceDeepLinkStatus, resolveInitialImportAuditEventId, resolveInitialImportAuditEvidenceDeepLink, resolveInitialImportAuditEvidenceQuery } from "../../app-shell/url-state";
import { type AuditSigningKeyEnvironmentBindingConfirmations, type AuditSigningKeyRestartEvidenceConfirmations, type AuditSigningKeyRotationAcceptanceConfirmations, type AuditSigningKeyRotationApplyConfirmations, type AuditSigningKeyRuntimeReloadExecutionConfirmations, type AuditSigningKeyRuntimeReloadPlanConfirmations, type AuditSigningKeySecretMaterializationConfirmations, initialAuditSigningKeyEnvironmentBindingConfirmations, initialAuditSigningKeyRestartEvidenceConfirmations, initialAuditSigningKeyRotationAcceptanceConfirmations, initialAuditSigningKeyRotationApplyConfirmations, initialAuditSigningKeyRuntimeReloadExecutionConfirmations, initialAuditSigningKeyRuntimeReloadPlanConfirmations, initialAuditSigningKeySecretMaterializationConfirmations } from "../../execution/ExecutionConfirmations";
import { type AuditSigningKeyRotationLedgerStatus } from "../AuditLedgerFormatters";
import { mergeAuditEvidenceReportEvent } from "../event-merges";
import { auditEventRecordToResearchRunImportEvent } from "../ResearchPackageFormatters";
import { useCallback, useRef, useState } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "error" | "setWorkspaceState" | "source" | "statusLabel" | "workspace">;
type Result = Pick<AppControllerBindings, "auditSigningKeyRegistry" | "setAuditSigningKeyRegistry" | "auditSigningKeyRotationPlan" | "setAuditSigningKeyRotationPlan" | "auditSigningKeyRotationApply" | "setAuditSigningKeyRotationApply" | "auditSigningKeyRotationApplyConfirmations" | "setAuditSigningKeyRotationApplyConfirmations" | "auditSigningKeyRestartEvidence" | "setAuditSigningKeyRestartEvidence" | "auditSigningKeyRestartEvidenceConfirmations" | "setAuditSigningKeyRestartEvidenceConfirmations" | "auditSigningKeySecretMaterialization" | "setAuditSigningKeySecretMaterialization" | "auditSigningKeySecretMaterializationConfirmations" | "setAuditSigningKeySecretMaterializationConfirmations" | "auditSigningKeyEnvironmentBinding" | "setAuditSigningKeyEnvironmentBinding" | "auditSigningKeyEnvironmentBindingConfirmations" | "setAuditSigningKeyEnvironmentBindingConfirmations" | "auditSigningKeyRuntimeReloadPlan" | "setAuditSigningKeyRuntimeReloadPlan" | "auditSigningKeyRuntimeReloadPlanConfirmations" | "setAuditSigningKeyRuntimeReloadPlanConfirmations" | "auditSigningKeyRuntimeReloadExecution" | "setAuditSigningKeyRuntimeReloadExecution" | "auditSigningKeyRuntimeReloadExecutionConfirmations" | "setAuditSigningKeyRuntimeReloadExecutionConfirmations" | "auditSigningKeyRotationAcceptance" | "setAuditSigningKeyRotationAcceptance" | "auditSigningKeyRotationAcceptanceConfirmations" | "setAuditSigningKeyRotationAcceptanceConfirmations" | "auditSigningKeyRotationPlanEventId" | "setAuditSigningKeyRotationPlanEventId" | "auditSigningKeyRotationApplyEventId" | "setAuditSigningKeyRotationApplyEventId" | "auditSigningKeyRotationLedgerStatus" | "setAuditSigningKeyRotationLedgerStatus" | "isInspectingExportPackage" | "setIsInspectingExportPackage" | "isIndexingExportPackages" | "setIsIndexingExportPackages" | "inspectedExportPackage" | "setInspectedExportPackage" | "initialImportAuditEvidenceDeepLink" | "auditSigningKeyRotationEvents" | "setAuditSigningKeyRotationEvents" | "researchRunImportAuditEvents" | "setResearchRunImportAuditEvents" | "researchRunImportAuditPagination" | "setResearchRunImportAuditPagination" | "researchRunImportAuditQuery" | "setResearchRunImportAuditQuery" | "researchRunImportAuditOffset" | "setResearchRunImportAuditOffset" | "focusedImportAuditEventId" | "setFocusedImportAuditEventId" | "copiedImportAuditEvidenceEventId" | "setCopiedImportAuditEvidenceEventId" | "copiedOperatorRunbook" | "setCopiedOperatorRunbook" | "isRecordingOperatorRunbook" | "setIsRecordingOperatorRunbook" | "importAuditEvidenceDeepLinkStatus" | "setImportAuditEvidenceDeepLinkStatus" | "researchRunImportDiffQuery" | "setResearchRunImportDiffQuery" | "indexedExportPackages" | "setIndexedExportPackages" | "isLoadingAuditSigningKeyRotationEvents" | "setIsLoadingAuditSigningKeyRotationEvents" | "isLoadingResearchRunImportAudit" | "setIsLoadingResearchRunImportAudit" | "isApplyingAuditSigningKeyRotationPlan" | "setIsApplyingAuditSigningKeyRotationPlan" | "isPreparingAuditSigningKeyRotationPlan" | "setIsPreparingAuditSigningKeyRotationPlan" | "isRecordingAuditSigningKeyRestartEvidence" | "setIsRecordingAuditSigningKeyRestartEvidence" | "isRecordingAuditSigningKeySecretMaterialization" | "setIsRecordingAuditSigningKeySecretMaterialization" | "isRecordingAuditSigningKeyEnvironmentBinding" | "setIsRecordingAuditSigningKeyEnvironmentBinding" | "isRecordingAuditSigningKeyRuntimeReloadPlan" | "setIsRecordingAuditSigningKeyRuntimeReloadPlan" | "isRecordingAuditSigningKeyRuntimeReloadExecution" | "setIsRecordingAuditSigningKeyRuntimeReloadExecution" | "isRecordingAuditSigningKeyRotationAcceptance" | "setIsRecordingAuditSigningKeyRotationAcceptance" | "signingAuditReportEventId" | "setSigningAuditReportEventId" | "verifyingAuditReportEventId" | "setVerifyingAuditReportEventId" | "revokingAuditReportEventId" | "setRevokingAuditReportEventId" | "researchRunImportAuditRequestIdRef" | "exportPackageRequestCoordinatorRef" | "importAuditCopyResetTimerRef" | "operatorRunbookCopyResetTimerRef" | "initialImportAuditEvidenceDeepLinkRef" | "auditSigningKeyRotationLedgerRows" | "auditSigningKeyRotationChainSummary" | "auditSigningKeyRotationHistoryRows" | "refreshAuditSigningKeyRotationEvents" | "refreshResearchRunImportAuditEvents" | "refreshAuditSigningKeys" | "updateAuditSigningKeyRotationApplyConfirmation" | "updateAuditSigningKeyRestartEvidenceConfirmation" | "updateAuditSigningKeySecretMaterializationConfirmation" | "updateAuditSigningKeyEnvironmentBindingConfirmation" | "updateAuditSigningKeyRuntimeReloadPlanConfirmation" | "updateAuditSigningKeyRuntimeReloadExecutionConfirmation" | "updateAuditSigningKeyRotationAcceptanceConfirmation" | "prepareAuditSigningKeyRotationPlanForAudit" | "recordAuditSigningKeySecretMaterializationForAudit" | "recordAuditSigningKeyEnvironmentBindingForAudit" | "recordAuditSigningKeyRuntimeReloadPlanForAudit" | "recordAuditSigningKeyRuntimeReloadExecutionForAudit" | "recordAuditSigningKeyRotationAcceptanceForAudit" | "applyAuditSigningKeyRotationPlanForAudit">;

export function useAuditStateActions(controller: Dependencies): Result {
  const {
    error, setWorkspaceState, source, statusLabel, workspace
  } = controller;
  const [auditSigningKeyRegistry, setAuditSigningKeyRegistry] = useState<AuditSigningKeyRegistryResult>(
      initialAuditSigningKeyRegistryState
    );
  const [auditSigningKeyRotationPlan, setAuditSigningKeyRotationPlan] = useState<AuditSigningKeyRotationPlanResult>(
      initialAuditSigningKeyRotationPlanState
    );
  const [auditSigningKeyRotationApply, setAuditSigningKeyRotationApply] =
      useState<AuditSigningKeyRotationApplyResult>(initialAuditSigningKeyRotationApplyState);
  const [auditSigningKeyRotationApplyConfirmations, setAuditSigningKeyRotationApplyConfirmations] =
      useState<AuditSigningKeyRotationApplyConfirmations>(initialAuditSigningKeyRotationApplyConfirmations);
  const [auditSigningKeyRestartEvidence, setAuditSigningKeyRestartEvidence] =
      useState<AuditSigningKeyControlledRestartEvidenceResult>(initialAuditSigningKeyRestartEvidenceState);
  const [auditSigningKeyRestartEvidenceConfirmations, setAuditSigningKeyRestartEvidenceConfirmations] =
      useState<AuditSigningKeyRestartEvidenceConfirmations>(initialAuditSigningKeyRestartEvidenceConfirmations);
  const [auditSigningKeySecretMaterialization, setAuditSigningKeySecretMaterialization] =
      useState<AuditSigningKeySecretMaterializationResult>(initialAuditSigningKeySecretMaterializationState);
  const [auditSigningKeySecretMaterializationConfirmations, setAuditSigningKeySecretMaterializationConfirmations] = useState<AuditSigningKeySecretMaterializationConfirmations>(
      initialAuditSigningKeySecretMaterializationConfirmations
    );
  const [auditSigningKeyEnvironmentBinding, setAuditSigningKeyEnvironmentBinding] =
      useState<AuditSigningKeyEnvironmentBindingResult>(initialAuditSigningKeyEnvironmentBindingState);
  const [auditSigningKeyEnvironmentBindingConfirmations, setAuditSigningKeyEnvironmentBindingConfirmations] =
      useState<AuditSigningKeyEnvironmentBindingConfirmations>(initialAuditSigningKeyEnvironmentBindingConfirmations);
  const [auditSigningKeyRuntimeReloadPlan, setAuditSigningKeyRuntimeReloadPlan] =
      useState<AuditSigningKeyRuntimeReloadPlanResult>(initialAuditSigningKeyRuntimeReloadPlanState);
  const [auditSigningKeyRuntimeReloadPlanConfirmations, setAuditSigningKeyRuntimeReloadPlanConfirmations] =
      useState<AuditSigningKeyRuntimeReloadPlanConfirmations>(initialAuditSigningKeyRuntimeReloadPlanConfirmations);
  const [auditSigningKeyRuntimeReloadExecution, setAuditSigningKeyRuntimeReloadExecution] =
      useState<AuditSigningKeyRuntimeReloadExecutionResult>(initialAuditSigningKeyRuntimeReloadExecutionState);
  const [auditSigningKeyRuntimeReloadExecutionConfirmations, setAuditSigningKeyRuntimeReloadExecutionConfirmations] =
      useState<AuditSigningKeyRuntimeReloadExecutionConfirmations>(
        initialAuditSigningKeyRuntimeReloadExecutionConfirmations
      );
  const [auditSigningKeyRotationAcceptance, setAuditSigningKeyRotationAcceptance] =
      useState<AuditSigningKeyRotationAcceptanceResult>(initialAuditSigningKeyRotationAcceptanceState);
  const [auditSigningKeyRotationAcceptanceConfirmations, setAuditSigningKeyRotationAcceptanceConfirmations] =
      useState<AuditSigningKeyRotationAcceptanceConfirmations>(
        initialAuditSigningKeyRotationAcceptanceConfirmations
      );
  const [auditSigningKeyRotationPlanEventId, setAuditSigningKeyRotationPlanEventId] = useState<string | null>(null);
  const [auditSigningKeyRotationApplyEventId, setAuditSigningKeyRotationApplyEventId] = useState<string | null>(null);
  const [auditSigningKeyRotationLedgerStatus, setAuditSigningKeyRotationLedgerStatus] =
      useState<AuditSigningKeyRotationLedgerStatus>(initialAuditSigningKeyRotationLedgerStatus);
  const [isInspectingExportPackage, setIsInspectingExportPackage] = useState(false);
  const [isIndexingExportPackages, setIsIndexingExportPackages] = useState(false);
  const [inspectedExportPackage, setInspectedExportPackage] = useState<ResearchRunExportPackage | null>(null);
  const initialImportAuditEvidenceDeepLink = resolveInitialImportAuditEvidenceDeepLink();
  const [auditSigningKeyRotationEvents, setAuditSigningKeyRotationEvents] = useState<AuditEventRecord[]>([]);
  const [researchRunImportAuditEvents, setResearchRunImportAuditEvents] = useState<ResearchRunImportAuditEvent[]>([]);
  const [researchRunImportAuditPagination, setResearchRunImportAuditPagination] =
      useState<AuditEventHistoryPagination | null>(null);
  const [researchRunImportAuditQuery, setResearchRunImportAuditQuery] = useState(resolveInitialImportAuditEvidenceQuery);
  const [researchRunImportAuditOffset, setResearchRunImportAuditOffset] = useState(0);
  const [focusedImportAuditEventId, setFocusedImportAuditEventId] = useState<string | null>(() => resolveInitialImportAuditEventId());
  const [copiedImportAuditEvidenceEventId, setCopiedImportAuditEvidenceEventId] = useState<string | null>(null);
  const [copiedOperatorRunbook, setCopiedOperatorRunbook] = useState(false);
  const [isRecordingOperatorRunbook, setIsRecordingOperatorRunbook] = useState(false);
  const [importAuditEvidenceDeepLinkStatus, setImportAuditEvidenceDeepLinkStatus] =
      useState<ImportAuditEvidenceDeepLinkStatus | null>(
        initialImportAuditEvidenceDeepLink ? { ...initialImportAuditEvidenceDeepLink, status: "idle", error: null } : null
      );
  const [researchRunImportDiffQuery, setResearchRunImportDiffQuery] = useState(initialImportAuditEvidenceDeepLink?.focusQuery ?? "");
  const [indexedExportPackages, setIndexedExportPackages] = useState<ResearchRunExportPackage[]>([]);
  const [isLoadingAuditSigningKeyRotationEvents, setIsLoadingAuditSigningKeyRotationEvents] = useState(false);
  const [isLoadingResearchRunImportAudit, setIsLoadingResearchRunImportAudit] = useState(false);
  const [isApplyingAuditSigningKeyRotationPlan, setIsApplyingAuditSigningKeyRotationPlan] = useState(false);
  const [isPreparingAuditSigningKeyRotationPlan, setIsPreparingAuditSigningKeyRotationPlan] = useState(false);
  const [isRecordingAuditSigningKeyRestartEvidence, setIsRecordingAuditSigningKeyRestartEvidence] = useState(false);
  const [isRecordingAuditSigningKeySecretMaterialization, setIsRecordingAuditSigningKeySecretMaterialization] =
      useState(false);
  const [isRecordingAuditSigningKeyEnvironmentBinding, setIsRecordingAuditSigningKeyEnvironmentBinding] =
      useState(false);
  const [isRecordingAuditSigningKeyRuntimeReloadPlan, setIsRecordingAuditSigningKeyRuntimeReloadPlan] =
      useState(false);
  const [isRecordingAuditSigningKeyRuntimeReloadExecution, setIsRecordingAuditSigningKeyRuntimeReloadExecution] =
      useState(false);
  const [isRecordingAuditSigningKeyRotationAcceptance, setIsRecordingAuditSigningKeyRotationAcceptance] =
      useState(false);
  const [signingAuditReportEventId, setSigningAuditReportEventId] = useState<string | null>(null);
  const [verifyingAuditReportEventId, setVerifyingAuditReportEventId] = useState<string | null>(null);
  const [revokingAuditReportEventId, setRevokingAuditReportEventId] = useState<string | null>(null);
  const researchRunImportAuditRequestIdRef = useRef(0);
  const exportPackageRequestCoordinatorRef = useRef(createLatestRequestCoordinator());
  const importAuditCopyResetTimerRef = useRef<number | null>(null);
  const operatorRunbookCopyResetTimerRef = useRef<number | null>(null);
  const initialImportAuditEvidenceDeepLinkRef = useRef(initialImportAuditEvidenceDeepLink);
  const auditSigningKeyRotationLedgerRows = filterAuditSigningKeyRotationLedgerRows(
      buildAuditSigningKeyRotationLedgerRows(auditSigningKeyRotationEvents),
      ""
    );
  const auditSigningKeyRotationChainSummary = buildAuditSigningKeyRotationChainSummary(
      auditSigningKeyRotationLedgerRows
    );
  const auditSigningKeyRotationHistoryRows = auditSigningKeyRotationLedgerRows.slice(
      0,
      AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE
    );
  const refreshAuditSigningKeyRotationEvents = useCallback(async () => {
      setIsLoadingAuditSigningKeyRotationEvents(true);
      const [
        rotationPlanHistory,
        rotationApplyHistory,
        controlledRestartHistory,
        secretMaterializationEventHistory,
        secretMaterializationHistory,
        environmentBindingEventHistory,
        environmentBindingHistory,
        runtimeReloadPlanEventHistory,
        runtimeReloadPlanHistory,
        runtimeReloadExecutionEventHistory,
        runtimeReloadExecutionHistory,
        rotationAcceptanceEventHistory,
        rotationAcceptanceHistory
      ] = await Promise.all([
        loadAuditEvents(quantCoreBaseUrl, {
          eventType: "audit_signing_key_rotation_plan",
          limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
          offset: 0
        }),
        loadAuditEvents(quantCoreBaseUrl, {
          eventType: "audit_signing_key_rotation_apply",
          limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
          offset: 0
        }),
        loadAuditEvents(quantCoreBaseUrl, {
          eventType: "audit_signing_key_controlled_restart_evidence",
          limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
          offset: 0
        }),
        loadAuditEvents(quantCoreBaseUrl, {
          eventType: "audit_signing_key_secret_materialization",
          limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
          offset: 0
        }),
        loadAuditSigningKeySecretMaterializations(
          quantCoreBaseUrl,
          "",
          undefined,
          AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE
        ),
        loadAuditEvents(quantCoreBaseUrl, {
          eventType: "audit_signing_key_environment_binding",
          limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
          offset: 0
        }),
        loadAuditSigningKeyEnvironmentBindings(
          quantCoreBaseUrl,
          "",
          undefined,
          AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE
        ),
        loadAuditEvents(quantCoreBaseUrl, {
          eventType: "audit_signing_key_runtime_reload_plan",
          limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
          offset: 0
        }),
        loadAuditSigningKeyRuntimeReloadPlans(
          quantCoreBaseUrl,
          "",
          undefined,
          AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE
        ),
        loadAuditEvents(quantCoreBaseUrl, {
          eventType: "audit_signing_key_runtime_reload_execution",
          limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
          offset: 0
        }),
        loadAuditSigningKeyRuntimeReloadExecutions(
          quantCoreBaseUrl,
          "",
          undefined,
          AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE
        ),
        loadAuditEvents(quantCoreBaseUrl, {
          eventType: "audit_signing_key_rotation_acceptance",
          limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
          offset: 0
        }),
        loadAuditSigningKeyRotationAcceptances(
          quantCoreBaseUrl,
          "",
          undefined,
          AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE
        )
      ]);
      if (
        rotationPlanHistory.source === "core" ||
        rotationApplyHistory.source === "core" ||
        controlledRestartHistory.source === "core" ||
        secretMaterializationEventHistory.source === "core" ||
        environmentBindingEventHistory.source === "core" ||
        runtimeReloadPlanEventHistory.source === "core" ||
        runtimeReloadExecutionEventHistory.source === "core" ||
        rotationAcceptanceEventHistory.source === "core"
      ) {
        const rotationEvents = [
          ...(rotationPlanHistory.source === "core" ? rotationPlanHistory.events : []),
          ...(rotationApplyHistory.source === "core" ? rotationApplyHistory.events : []),
          ...(controlledRestartHistory.source === "core" ? controlledRestartHistory.events : []),
          ...(secretMaterializationEventHistory.source === "core" ? secretMaterializationEventHistory.events : []),
          ...(environmentBindingEventHistory.source === "core" ? environmentBindingEventHistory.events : []),
          ...(runtimeReloadPlanEventHistory.source === "core" ? runtimeReloadPlanEventHistory.events : []),
          ...(runtimeReloadExecutionEventHistory.source === "core" ? runtimeReloadExecutionEventHistory.events : []),
          ...(rotationAcceptanceEventHistory.source === "core" ? rotationAcceptanceEventHistory.events : [])
        ].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
        setAuditSigningKeyRotationEvents(
          rotationEvents
        );
      }
      if (secretMaterializationHistory.source === "core") {
        setAuditSigningKeySecretMaterialization({
          secretMaterialization: secretMaterializationHistory.secretMaterializations[0],
          source: "core"
        });
      }
      if (environmentBindingHistory.source === "core") {
        setAuditSigningKeyEnvironmentBinding({
          environmentBinding: environmentBindingHistory.environmentBindings[0],
          source: "core"
        });
      }
      if (runtimeReloadPlanHistory.source === "core") {
        setAuditSigningKeyRuntimeReloadPlan({
          runtimeReloadPlan: runtimeReloadPlanHistory.runtimeReloadPlans[0],
          source: "core"
        });
      }
      if (runtimeReloadExecutionHistory.source === "core") {
        setAuditSigningKeyRuntimeReloadExecution({
          runtimeReloadExecution: runtimeReloadExecutionHistory.runtimeReloadExecutions[0],
          source: "core"
        });
      }
      if (rotationAcceptanceHistory.source === "core") {
        setAuditSigningKeyRotationAcceptance({
          rotationAcceptance: rotationAcceptanceHistory.rotationAcceptances[0],
          source: "core"
        });
      }
      setIsLoadingAuditSigningKeyRotationEvents(false);
      return rotationPlanHistory;
    }, [quantCoreBaseUrl]);
  const refreshResearchRunImportAuditEvents = useCallback(async () => {
      const requestId = researchRunImportAuditRequestIdRef.current + 1;
      researchRunImportAuditRequestIdRef.current = requestId;
      setIsLoadingResearchRunImportAudit(true);
      const auditHistory = await loadAuditEvents(quantCoreBaseUrl, {
        eventType: "research_run_import",
        limit: IMPORT_AUDIT_EVENTS_PAGE_SIZE,
        offset: researchRunImportAuditOffset,
        query: researchRunImportAuditQuery.trim() || undefined
      });
      if (researchRunImportAuditRequestIdRef.current !== requestId) {
        return auditHistory;
      }
      if (auditHistory.source === "core") {
        const importedEvents = auditHistory.events
          .map(auditEventRecordToResearchRunImportEvent)
          .filter((event): event is ResearchRunImportAuditEvent => Boolean(event));
        setResearchRunImportAuditEvents(importedEvents);
        setResearchRunImportAuditPagination(auditHistory.pagination ?? null);
      } else {
        setResearchRunImportAuditPagination(null);
      }
      setIsLoadingResearchRunImportAudit(false);
      return auditHistory;
    }, [quantCoreBaseUrl, researchRunImportAuditOffset, researchRunImportAuditQuery]);
  const refreshAuditSigningKeys = useCallback(async () => {
      setAuditSigningKeyRegistry(await loadAuditSigningKeys(quantCoreBaseUrl));
    }, []);
  const updateAuditSigningKeyRotationApplyConfirmation = useCallback(
      (field: keyof AuditSigningKeyRotationApplyConfirmations, value: boolean) => {
        setAuditSigningKeyRotationApplyConfirmations((current) => ({ ...current, [field]: value }));
      },
      []
    );
  const updateAuditSigningKeyRestartEvidenceConfirmation = useCallback(
      (field: keyof AuditSigningKeyRestartEvidenceConfirmations, value: boolean) => {
        setAuditSigningKeyRestartEvidenceConfirmations((current) => ({ ...current, [field]: value }));
      },
      []
    );
  const updateAuditSigningKeySecretMaterializationConfirmation = useCallback(
      (field: keyof AuditSigningKeySecretMaterializationConfirmations, value: boolean) => {
        setAuditSigningKeySecretMaterializationConfirmations((current) => ({ ...current, [field]: value }));
      },
      []
    );
  const updateAuditSigningKeyEnvironmentBindingConfirmation = useCallback(
      (field: keyof AuditSigningKeyEnvironmentBindingConfirmations, value: boolean) => {
        setAuditSigningKeyEnvironmentBindingConfirmations((current) => ({ ...current, [field]: value }));
      },
      []
    );
  const updateAuditSigningKeyRuntimeReloadPlanConfirmation = useCallback(
      (field: keyof AuditSigningKeyRuntimeReloadPlanConfirmations, value: boolean) => {
        setAuditSigningKeyRuntimeReloadPlanConfirmations((current) => ({ ...current, [field]: value }));
      },
      []
    );
  const updateAuditSigningKeyRuntimeReloadExecutionConfirmation = useCallback(
      (field: keyof AuditSigningKeyRuntimeReloadExecutionConfirmations, value: boolean) => {
        setAuditSigningKeyRuntimeReloadExecutionConfirmations((current) => ({ ...current, [field]: value }));
      },
      []
    );
  const updateAuditSigningKeyRotationAcceptanceConfirmation = useCallback(
      (field: keyof AuditSigningKeyRotationAcceptanceConfirmations, value: boolean) => {
        setAuditSigningKeyRotationAcceptanceConfirmations((current) => ({ ...current, [field]: value }));
      },
      []
    );
  const prepareAuditSigningKeyRotationPlanForAudit = useCallback(async () => {
      const activeKey = auditSigningKeyRegistry.registry?.keys.find(
        (key) => key.keyId === auditSigningKeyRegistry.registry?.activeKeyId
      );
      const suffix = new Date().toISOString().slice(0, 10).replaceAll("-", "");
      const proposedKeyId = `${activeKey?.keyId ?? "audit-key"}-${suffix}`;
      const proposedSigner = activeKey?.signer ? `${activeKey.signer} Next` : "Next Audit Key";
      const proposedChainId = `${activeKey?.chainId ?? "audit-chain"}-next`;
      setIsPreparingAuditSigningKeyRotationPlan(true);
      setAuditSigningKeyRotationApply(initialAuditSigningKeyRotationApplyState);
      setAuditSigningKeyRotationApplyConfirmations(initialAuditSigningKeyRotationApplyConfirmations);
      setAuditSigningKeyRestartEvidence(initialAuditSigningKeyRestartEvidenceState);
      setAuditSigningKeyRestartEvidenceConfirmations(initialAuditSigningKeyRestartEvidenceConfirmations);
      setAuditSigningKeySecretMaterialization(initialAuditSigningKeySecretMaterializationState);
      setAuditSigningKeySecretMaterializationConfirmations(initialAuditSigningKeySecretMaterializationConfirmations);
      setAuditSigningKeyEnvironmentBinding(initialAuditSigningKeyEnvironmentBindingState);
      setAuditSigningKeyEnvironmentBindingConfirmations(initialAuditSigningKeyEnvironmentBindingConfirmations);
      setAuditSigningKeyRuntimeReloadPlan(initialAuditSigningKeyRuntimeReloadPlanState);
      setAuditSigningKeyRuntimeReloadPlanConfirmations(initialAuditSigningKeyRuntimeReloadPlanConfirmations);
      setAuditSigningKeyRuntimeReloadExecution(initialAuditSigningKeyRuntimeReloadExecutionState);
      setAuditSigningKeyRuntimeReloadExecutionConfirmations(initialAuditSigningKeyRuntimeReloadExecutionConfirmations);
      setAuditSigningKeyRotationAcceptance(initialAuditSigningKeyRotationAcceptanceState);
      setAuditSigningKeyRotationAcceptanceConfirmations(initialAuditSigningKeyRotationAcceptanceConfirmations);
      setAuditSigningKeyRotationPlanEventId(null);
      setAuditSigningKeyRotationApplyEventId(null);
      setAuditSigningKeyRotationLedgerStatus({ detail: "", state: "saving" });
      try {
        const result = await prepareAuditSigningKeyRotationPlan(quantCoreBaseUrl, {
          proposedChainId,
          proposedKeyId,
          proposedSigner
        });
        setAuditSigningKeyRotationPlan(result);
        if (result.rotationPlan) {
          const auditEvent = await buildAuditSigningKeyRotationPlanAuditEvent(result.rotationPlan);
          const ledgerResult = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
          setAuditSigningKeyRotationLedgerStatus(
            ledgerResult.event
              ? { detail: ledgerResult.event.eventId, state: "saved" }
              : { detail: ledgerResult.error ?? "Audit event save failed", state: "failed" }
          );
          if (ledgerResult.event) {
            setAuditSigningKeyRotationPlanEventId(ledgerResult.event.eventId);
            setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, ledgerResult.event!));
          }
        } else {
          setAuditSigningKeyRotationLedgerStatus({
            detail: result.error ?? "Rotation plan was not generated",
            state: "failed"
          });
        }
      } finally {
        setIsPreparingAuditSigningKeyRotationPlan(false);
      }
    }, [auditSigningKeyRegistry.registry]);
  const recordAuditSigningKeySecretMaterializationForAudit = useCallback(async () => {
      if (!auditSigningKeyRotationPlan.rotationPlan || !auditSigningKeyRotationPlanEventId) {
        setAuditSigningKeySecretMaterialization({
          source: "fallback",
          error: "Audit signing key rotation plan event id is required before secret materialization can be recorded"
        });
        return;
      }
      const proposedKeyId = auditSigningKeyRotationPlan.rotationPlan.proposedActiveKey.keyId;
      setIsRecordingAuditSigningKeySecretMaterialization(true);
      setAuditSigningKeyEnvironmentBinding(initialAuditSigningKeyEnvironmentBindingState);
      setAuditSigningKeyEnvironmentBindingConfirmations(initialAuditSigningKeyEnvironmentBindingConfirmations);
      setAuditSigningKeyRuntimeReloadPlan(initialAuditSigningKeyRuntimeReloadPlanState);
      setAuditSigningKeyRuntimeReloadPlanConfirmations(initialAuditSigningKeyRuntimeReloadPlanConfirmations);
      setAuditSigningKeyRuntimeReloadExecution(initialAuditSigningKeyRuntimeReloadExecutionState);
      setAuditSigningKeyRuntimeReloadExecutionConfirmations(initialAuditSigningKeyRuntimeReloadExecutionConfirmations);
      setAuditSigningKeyRotationAcceptance(initialAuditSigningKeyRotationAcceptanceState);
      setAuditSigningKeyRotationAcceptanceConfirmations(initialAuditSigningKeyRotationAcceptanceConfirmations);
      try {
        const result = await recordAuditSigningKeySecretMaterialization(quantCoreBaseUrl, {
          backend: "local-secret-store",
          confirmations: auditSigningKeySecretMaterializationConfirmations,
          manifestPath: `local-secret-store://audit-signing/${proposedKeyId}`,
          metadata: {
            proposedKeyId,
            source: "audit-signing-key-registry-panel"
          },
          operator: "local-operator",
          planEventId: auditSigningKeyRotationPlanEventId
        });
        setAuditSigningKeySecretMaterialization(result);
        if (result.auditEvent) {
          setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, result.auditEvent!));
        }
      } finally {
        setIsRecordingAuditSigningKeySecretMaterialization(false);
      }
    }, [
      auditSigningKeyRotationPlan.rotationPlan,
      auditSigningKeyRotationPlanEventId,
      auditSigningKeySecretMaterializationConfirmations,
      quantCoreBaseUrl
    ]);
  const recordAuditSigningKeyEnvironmentBindingForAudit = useCallback(async () => {
      const materialization = auditSigningKeySecretMaterialization.secretMaterialization;
      if (!materialization?.materializationId) {
        setAuditSigningKeyEnvironmentBinding({
          source: "fallback",
          error: "Audit signing key secret materialization is required before environment binding can be recorded"
        });
        return;
      }
      setIsRecordingAuditSigningKeyEnvironmentBinding(true);
      setAuditSigningKeyRuntimeReloadPlan(initialAuditSigningKeyRuntimeReloadPlanState);
      setAuditSigningKeyRuntimeReloadPlanConfirmations(initialAuditSigningKeyRuntimeReloadPlanConfirmations);
      setAuditSigningKeyRuntimeReloadExecution(initialAuditSigningKeyRuntimeReloadExecutionState);
      setAuditSigningKeyRuntimeReloadExecutionConfirmations(initialAuditSigningKeyRuntimeReloadExecutionConfirmations);
      setAuditSigningKeyRotationAcceptance(initialAuditSigningKeyRotationAcceptanceState);
      setAuditSigningKeyRotationAcceptanceConfirmations(initialAuditSigningKeyRotationAcceptanceConfirmations);
      try {
        const result = await recordAuditSigningKeyEnvironmentBinding(quantCoreBaseUrl, {
          bindingMode: "container_env_reference",
          confirmations: auditSigningKeyEnvironmentBindingConfirmations,
          materializationId: materialization.materializationId,
          metadata: {
            proposedKeyId: materialization.proposedActiveKeyId,
            source: "audit-signing-key-registry-panel"
          },
          operator: "local-operator"
        });
        setAuditSigningKeyEnvironmentBinding(result);
        if (result.auditEvent) {
          setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, result.auditEvent!));
        }
      } finally {
        setIsRecordingAuditSigningKeyEnvironmentBinding(false);
      }
    }, [
      auditSigningKeyEnvironmentBindingConfirmations,
      auditSigningKeySecretMaterialization.secretMaterialization,
      quantCoreBaseUrl
    ]);
  const recordAuditSigningKeyRuntimeReloadPlanForAudit = useCallback(async () => {
      const binding = auditSigningKeyEnvironmentBinding.environmentBinding;
      if (!binding?.bindingId) {
        setAuditSigningKeyRuntimeReloadPlan({
          source: "fallback",
          error: "Audit signing key environment binding is required before runtime reload plan can be recorded"
        });
        return;
      }
      setIsRecordingAuditSigningKeyRuntimeReloadPlan(true);
      setAuditSigningKeyRuntimeReloadExecution(initialAuditSigningKeyRuntimeReloadExecutionState);
      setAuditSigningKeyRuntimeReloadExecutionConfirmations(initialAuditSigningKeyRuntimeReloadExecutionConfirmations);
      setAuditSigningKeyRotationAcceptance(initialAuditSigningKeyRotationAcceptanceState);
      setAuditSigningKeyRotationAcceptanceConfirmations(initialAuditSigningKeyRotationAcceptanceConfirmations);
      try {
        const result = await recordAuditSigningKeyRuntimeReloadPlan(quantCoreBaseUrl, {
          bindingId: binding.bindingId,
          confirmations: auditSigningKeyRuntimeReloadPlanConfirmations,
          maintenanceWindowId: `audit-window-${binding.proposedActiveKeyId || "next-key"}`,
          metadata: {
            proposedKeyId: binding.proposedActiveKeyId,
            source: "audit-signing-key-registry-panel"
          },
          operator: "local-operator",
          reloadMode: "manual_container_reload_plan"
        });
        setAuditSigningKeyRuntimeReloadPlan(result);
        if (result.auditEvent) {
          setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, result.auditEvent!));
        }
      } finally {
        setIsRecordingAuditSigningKeyRuntimeReloadPlan(false);
      }
    }, [
      auditSigningKeyEnvironmentBinding.environmentBinding,
      auditSigningKeyRuntimeReloadPlanConfirmations,
      quantCoreBaseUrl
    ]);
  const recordAuditSigningKeyRuntimeReloadExecutionForAudit = useCallback(async () => {
      const runtimeReloadPlan = auditSigningKeyRuntimeReloadPlan.runtimeReloadPlan;
      if (!runtimeReloadPlan?.planId) {
        setAuditSigningKeyRuntimeReloadExecution({
          source: "fallback",
          error: "Audit signing key runtime reload plan is required before reload execution evidence can be recorded"
        });
        return;
      }
      setIsRecordingAuditSigningKeyRuntimeReloadExecution(true);
      setAuditSigningKeyRotationAcceptance(initialAuditSigningKeyRotationAcceptanceState);
      setAuditSigningKeyRotationAcceptanceConfirmations(initialAuditSigningKeyRotationAcceptanceConfirmations);
      try {
        const result = await recordAuditSigningKeyRuntimeReloadExecution(quantCoreBaseUrl, {
          confirmations: auditSigningKeyRuntimeReloadExecutionConfirmations,
          executionMode: "manual_controlled_reload_evidence",
          metadata: {
            proposedKeyId: runtimeReloadPlan.proposedActiveKeyId,
            source: "audit-signing-key-registry-panel"
          },
          operator: "local-operator",
          planId: runtimeReloadPlan.planId
        });
        setAuditSigningKeyRuntimeReloadExecution(result);
        if (result.auditEvent) {
          setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, result.auditEvent!));
        }
      } finally {
        setIsRecordingAuditSigningKeyRuntimeReloadExecution(false);
      }
    }, [
      auditSigningKeyRuntimeReloadExecutionConfirmations,
      auditSigningKeyRuntimeReloadPlan.runtimeReloadPlan,
      quantCoreBaseUrl
    ]);
  const recordAuditSigningKeyRotationAcceptanceForAudit = useCallback(async () => {
      const runtimeReloadExecution = auditSigningKeyRuntimeReloadExecution.runtimeReloadExecution;
      if (!runtimeReloadExecution?.executionId) {
        setAuditSigningKeyRotationAcceptance({
          source: "fallback",
          error: "Audit signing key runtime reload execution evidence is required before final acceptance can be recorded"
        });
        return;
      }
      setIsRecordingAuditSigningKeyRotationAcceptance(true);
      try {
        const result = await recordAuditSigningKeyRotationAcceptance(quantCoreBaseUrl, {
          acceptanceMode: "manual_rotation_acceptance",
          confirmations: auditSigningKeyRotationAcceptanceConfirmations,
          executionId: runtimeReloadExecution.executionId,
          metadata: {
            proposedKeyId: runtimeReloadExecution.proposedActiveKeyId,
            source: "audit-signing-key-registry-panel"
          },
          operator: "local-operator"
        });
        setAuditSigningKeyRotationAcceptance(result);
        if (result.auditEvent) {
          setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, result.auditEvent!));
        }
      } finally {
        setIsRecordingAuditSigningKeyRotationAcceptance(false);
      }
    }, [
      auditSigningKeyRotationAcceptanceConfirmations,
      auditSigningKeyRuntimeReloadExecution.runtimeReloadExecution,
      quantCoreBaseUrl
    ]);
  const applyAuditSigningKeyRotationPlanForAudit = useCallback(async () => {
      if (!auditSigningKeyRotationPlan.rotationPlan) {
        return;
      }
      setIsApplyingAuditSigningKeyRotationPlan(true);
      setAuditSigningKeyRestartEvidence(initialAuditSigningKeyRestartEvidenceState);
      setAuditSigningKeyRestartEvidenceConfirmations(initialAuditSigningKeyRestartEvidenceConfirmations);
      setAuditSigningKeyRotationApplyEventId(null);
      try {
        const result = await applyAuditSigningKeyRotationPlan(quantCoreBaseUrl, {
          confirmations: auditSigningKeyRotationApplyConfirmations,
          rotationPlan: auditSigningKeyRotationPlan.rotationPlan
        });
        setAuditSigningKeyRotationApply(result);
        if (result.rotationApply) {
          const auditEvent = await buildAuditSigningKeyRotationApplyAuditEvent(result.rotationApply);
          const ledgerResult = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
          if (ledgerResult.error) {
            setWorkspaceState((current) => ({
              ...current,
              error: ledgerResult.error,
              source: ledgerResult.source,
              statusLabel: "Audit signing key rotation apply ledger save failed"
            }));
          } else if (ledgerResult.event) {
            setAuditSigningKeyRotationApplyEventId(ledgerResult.event.eventId);
            setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, ledgerResult.event!));
          }
        }
      } finally {
        setIsApplyingAuditSigningKeyRotationPlan(false);
      }
    }, [auditSigningKeyRotationApplyConfirmations, auditSigningKeyRotationPlan.rotationPlan, quantCoreBaseUrl]);
  return {
    auditSigningKeyRegistry, setAuditSigningKeyRegistry, auditSigningKeyRotationPlan, setAuditSigningKeyRotationPlan, auditSigningKeyRotationApply, setAuditSigningKeyRotationApply,
    auditSigningKeyRotationApplyConfirmations, setAuditSigningKeyRotationApplyConfirmations, auditSigningKeyRestartEvidence, setAuditSigningKeyRestartEvidence, auditSigningKeyRestartEvidenceConfirmations, setAuditSigningKeyRestartEvidenceConfirmations,
    auditSigningKeySecretMaterialization, setAuditSigningKeySecretMaterialization, auditSigningKeySecretMaterializationConfirmations, setAuditSigningKeySecretMaterializationConfirmations, auditSigningKeyEnvironmentBinding, setAuditSigningKeyEnvironmentBinding,
    auditSigningKeyEnvironmentBindingConfirmations, setAuditSigningKeyEnvironmentBindingConfirmations, auditSigningKeyRuntimeReloadPlan, setAuditSigningKeyRuntimeReloadPlan, auditSigningKeyRuntimeReloadPlanConfirmations, setAuditSigningKeyRuntimeReloadPlanConfirmations,
    auditSigningKeyRuntimeReloadExecution, setAuditSigningKeyRuntimeReloadExecution, auditSigningKeyRuntimeReloadExecutionConfirmations, setAuditSigningKeyRuntimeReloadExecutionConfirmations, auditSigningKeyRotationAcceptance, setAuditSigningKeyRotationAcceptance,
    auditSigningKeyRotationAcceptanceConfirmations, setAuditSigningKeyRotationAcceptanceConfirmations, auditSigningKeyRotationPlanEventId, setAuditSigningKeyRotationPlanEventId, auditSigningKeyRotationApplyEventId, setAuditSigningKeyRotationApplyEventId,
    auditSigningKeyRotationLedgerStatus, setAuditSigningKeyRotationLedgerStatus, isInspectingExportPackage, setIsInspectingExportPackage, isIndexingExportPackages, setIsIndexingExportPackages,
    inspectedExportPackage, setInspectedExportPackage, initialImportAuditEvidenceDeepLink, auditSigningKeyRotationEvents, setAuditSigningKeyRotationEvents, researchRunImportAuditEvents,
    setResearchRunImportAuditEvents, researchRunImportAuditPagination, setResearchRunImportAuditPagination, researchRunImportAuditQuery, setResearchRunImportAuditQuery, researchRunImportAuditOffset,
    setResearchRunImportAuditOffset, focusedImportAuditEventId, setFocusedImportAuditEventId, copiedImportAuditEvidenceEventId, setCopiedImportAuditEvidenceEventId, copiedOperatorRunbook,
    setCopiedOperatorRunbook, isRecordingOperatorRunbook, setIsRecordingOperatorRunbook, importAuditEvidenceDeepLinkStatus, setImportAuditEvidenceDeepLinkStatus, researchRunImportDiffQuery,
    setResearchRunImportDiffQuery, indexedExportPackages, setIndexedExportPackages, isLoadingAuditSigningKeyRotationEvents, setIsLoadingAuditSigningKeyRotationEvents, isLoadingResearchRunImportAudit,
    setIsLoadingResearchRunImportAudit, isApplyingAuditSigningKeyRotationPlan, setIsApplyingAuditSigningKeyRotationPlan, isPreparingAuditSigningKeyRotationPlan, setIsPreparingAuditSigningKeyRotationPlan, isRecordingAuditSigningKeyRestartEvidence,
    setIsRecordingAuditSigningKeyRestartEvidence, isRecordingAuditSigningKeySecretMaterialization, setIsRecordingAuditSigningKeySecretMaterialization, isRecordingAuditSigningKeyEnvironmentBinding, setIsRecordingAuditSigningKeyEnvironmentBinding, isRecordingAuditSigningKeyRuntimeReloadPlan,
    setIsRecordingAuditSigningKeyRuntimeReloadPlan, isRecordingAuditSigningKeyRuntimeReloadExecution, setIsRecordingAuditSigningKeyRuntimeReloadExecution, isRecordingAuditSigningKeyRotationAcceptance, setIsRecordingAuditSigningKeyRotationAcceptance, signingAuditReportEventId,
    setSigningAuditReportEventId, verifyingAuditReportEventId, setVerifyingAuditReportEventId, revokingAuditReportEventId, setRevokingAuditReportEventId, researchRunImportAuditRequestIdRef,
    exportPackageRequestCoordinatorRef, importAuditCopyResetTimerRef, operatorRunbookCopyResetTimerRef, initialImportAuditEvidenceDeepLinkRef, auditSigningKeyRotationLedgerRows, auditSigningKeyRotationChainSummary,
    auditSigningKeyRotationHistoryRows, refreshAuditSigningKeyRotationEvents, refreshResearchRunImportAuditEvents, refreshAuditSigningKeys, updateAuditSigningKeyRotationApplyConfirmation, updateAuditSigningKeyRestartEvidenceConfirmation,
    updateAuditSigningKeySecretMaterializationConfirmation, updateAuditSigningKeyEnvironmentBindingConfirmation, updateAuditSigningKeyRuntimeReloadPlanConfirmation, updateAuditSigningKeyRuntimeReloadExecutionConfirmation, updateAuditSigningKeyRotationAcceptanceConfirmation, prepareAuditSigningKeyRotationPlanForAudit,
    recordAuditSigningKeySecretMaterializationForAudit, recordAuditSigningKeyEnvironmentBindingForAudit, recordAuditSigningKeyRuntimeReloadPlanForAudit, recordAuditSigningKeyRuntimeReloadExecutionForAudit, recordAuditSigningKeyRotationAcceptanceForAudit, applyAuditSigningKeyRotationPlanForAudit
  };
}
