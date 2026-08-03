import { type AppI18n } from "../../lib/i18n";
import { MarketKlinesResult, PlatformSettingsStatus } from "../../lib/terminal-api";
import { BrokerAdapterRow, ExecutionAdapterCertificationApplyConfirmationKey, ExecutionAdapterCertificationApplyConfirmations, ExecutionAdapterCertificationApplyRow, ExecutionAdapterCertificationRow, ExecutionAdapterChainHealthRollup, ExecutionAdapterHealthProbeRow, ExecutionAdapterHumanConfirmationRow, ExecutionAdapterLedgerRow, ExecutionAdapterOpsStateRow, ExecutionAdapterOrchestrationDryRunRow, ExecutionAdapterOrchestrationExecutionRow, ExecutionAdapterPaperExecutionRow, ExecutionAdapterPaperOrderLifecycleRow, ExecutionAdapterPaperRouteRunbookRow, ExecutionAdapterProductionRouteReviewRow, ExecutionAdapterRuntimeReloadAcceptanceRow, ExecutionAdapterRuntimeReloadExecutionRow, ExecutionAdapterSandboxOrderSchemaDryRunRow, ExecutionAdapterSandboxProbeExecutionRow, ExecutionAdapterSandboxProbePlanRow, ExecutionAdapterSandboxProbeReviewRow, TerminalWorkspace, buildExecutionAdapterCertificationApplyConfirmationRows, createDefaultExecutionAdapterCertificationApplyConfirmations } from "../../lib/terminal-workbench";
import { AdapterChainHealthList } from "../backtest/P2ReviewPanels";
import { adapterCertificationAdapterName, adapterCertificationApplyBlockerSummary, adapterCertificationApplyConfirmationDetail, adapterCertificationApplyConfirmationLabel, adapterCertificationApplyConfirmationSummary, adapterCertificationApplyModeLabel, adapterCertificationApplyStatusLabel, adapterCertificationBoundaryLabel, adapterCertificationCheckSummary, adapterCertificationStatusLabel, adapterHealthProbeBlockerLabel, adapterHealthProbeBoundaryLabel, adapterHealthProbeCheckStatusLabel, adapterHealthProbeCheckSummaryLabel, adapterHealthProbeCredentialSummaryLabel, adapterHealthProbeRouteReviewSummaryLabel, adapterHealthProbeStatusLabel, adapterHumanConfirmationConfirmationSummary, adapterHumanConfirmationStatusLabel, adapterLedgerAdapterName, adapterLedgerGateSummary, adapterLedgerLabel, adapterLedgerNextStep, adapterLedgerReason, adapterOpsStateBoundaryLabel, adapterOpsStateConfirmationSummary, adapterOpsStateStatusLabel, adapterOrchestrationDryRunConfirmationSummary, adapterOrchestrationDryRunStatusLabel, adapterOrchestrationExecutionConfirmationSummary, adapterOrchestrationExecutionStatusLabel, adapterPaperExecutionBoundaryLabel, adapterPaperExecutionConfirmationSummary, adapterPaperExecutionStatusLabel, adapterPaperOrderLifecycleBoundaryLabel, adapterPaperOrderLifecycleConfirmationSummary, adapterPaperOrderLifecycleStatusLabel, adapterPaperRouteRunbookBoundaryLabel, adapterPaperRouteRunbookConfirmationSummary, adapterPaperRouteRunbookStatusLabel, adapterProductionRouteReviewConfirmationSummary, adapterProductionRouteReviewStatusLabel, adapterRuntimeReloadAcceptanceConfirmationSummary, adapterRuntimeReloadAcceptanceStatusLabel, adapterRuntimeReloadExecutionConfirmationSummary, adapterRuntimeReloadExecutionStatusLabel, adapterSandboxOrderSchemaDryRunBoundaryLabel, adapterSandboxOrderSchemaDryRunConfirmationSummary, adapterSandboxOrderSchemaDryRunStatusLabel, adapterSandboxProbeExecutionConfirmationSummary, adapterSandboxProbeExecutionStatusLabel, adapterSandboxProbePlanConfirmationSummary, adapterSandboxProbePlanStatusLabel, adapterSandboxProbeReviewConfirmationSummary, adapterSandboxProbeReviewStatusLabel } from "../execution/AdapterFormatters";
import { createDefaultExecutionAdapterHumanConfirmationConfirmations, createDefaultExecutionAdapterOpsStateConfirmations, createDefaultExecutionAdapterOrchestrationDryRunConfirmations, createDefaultExecutionAdapterOrchestrationExecutionConfirmations, createDefaultExecutionAdapterPaperExecutionConfirmations, createDefaultExecutionAdapterProductionRouteReviewConfirmations, createDefaultExecutionAdapterRuntimeReloadAcceptanceConfirmations, createDefaultExecutionAdapterSandboxProbeExecutionConfirmations, createDefaultExecutionAdapterSandboxProbePlanConfirmations, createDefaultExecutionAdapterSandboxProbeReviewConfirmations, executionAdapterHumanConfirmationConfirmationRows, executionAdapterOpsStateConfirmationRows, executionAdapterOrchestrationDryRunConfirmationRows, executionAdapterOrchestrationExecutionConfirmationRows, executionAdapterPaperExecutionConfirmationRows, executionAdapterProductionRouteReviewConfirmationRows, executionAdapterRuntimeReloadAcceptanceConfirmationRows, executionAdapterSandboxProbeExecutionConfirmationRows, executionAdapterSandboxProbePlanConfirmationRows, executionAdapterSandboxProbeReviewConfirmationRows, type ExecutionAdapterHumanConfirmationConfirmations, type ExecutionAdapterOpsStateConfirmations, type ExecutionAdapterOrchestrationDryRunConfirmations, type ExecutionAdapterOrchestrationExecutionConfirmations, type ExecutionAdapterPaperExecutionConfirmations, type ExecutionAdapterProductionRouteReviewConfirmations, type ExecutionAdapterRuntimeReloadAcceptanceConfirmations, type ExecutionAdapterSandboxProbeExecutionConfirmations, type ExecutionAdapterSandboxProbePlanConfirmations, type ExecutionAdapterSandboxProbeReviewConfirmations } from "../execution/ExecutionConfirmations";

export type PlatformSettingsPanelProps = {
  adapterCertificationApplyConfirmations: Record<string, ExecutionAdapterCertificationApplyConfirmations>;
  adapterCertificationApplyRows: ExecutionAdapterCertificationApplyRow[];
  adapterCertificationRows: ExecutionAdapterCertificationRow[];
  adapterChainHealthRollups: ExecutionAdapterChainHealthRollup[];
  adapterHealthProbeRows: ExecutionAdapterHealthProbeRow[];
  adapterRows: BrokerAdapterRow[];
  adapterLedgerRows: ExecutionAdapterLedgerRow[];
  applyingAdapterCertificationId?: string | null;
  className?: string;
  i18n: AppI18n;
  isRefreshingAdapterHealthProbe?: boolean;
  onApplyAdapterCertification?: (row: ExecutionAdapterCertificationRow) => void;
  onApplyConfirmationChange?: (
    certificationId: string,
    key: ExecutionAdapterCertificationApplyConfirmationKey,
    checked: boolean
  ) => void;
  onHumanConfirmationChange?: (
    orchestrationExecutionId: string,
    key: keyof ExecutionAdapterHumanConfirmationConfirmations,
    checked: boolean
  ) => void;
  onOrchestrationDryRunConfirmationChange?: (
    acceptanceId: string,
    key: keyof ExecutionAdapterOrchestrationDryRunConfirmations,
    checked: boolean
  ) => void;
  onOrchestrationExecutionConfirmationChange?: (
    dryRunId: string,
    key: keyof ExecutionAdapterOrchestrationExecutionConfirmations,
    checked: boolean
  ) => void;
  onSandboxProbeExecutionConfirmationChange?: (
    sandboxProbePlanId: string,
    key: keyof ExecutionAdapterSandboxProbeExecutionConfirmations,
    checked: boolean
  ) => void;
  onSandboxProbePlanConfirmationChange?: (
    humanConfirmationId: string,
    key: keyof ExecutionAdapterSandboxProbePlanConfirmations,
    checked: boolean
  ) => void;
  onSandboxProbeReviewConfirmationChange?: (
    sandboxProbeExecutionId: string,
    key: keyof ExecutionAdapterSandboxProbeReviewConfirmations,
    checked: boolean
  ) => void;
  onProductionRouteReviewConfirmationChange?: (
    sandboxProbeReviewId: string,
    key: keyof ExecutionAdapterProductionRouteReviewConfirmations,
    checked: boolean
  ) => void;
  onOpsStateConfirmationChange?: (
    paperRouteRunbookId: string,
    key: keyof ExecutionAdapterOpsStateConfirmations,
    checked: boolean
  ) => void;
  onPaperExecutionConfirmationChange?: (
    adapterOpsStateId: string,
    key: keyof ExecutionAdapterPaperExecutionConfirmations,
    checked: boolean
  ) => void;
  onRecordAdapterCertification?: (adapter: PlatformSettingsStatus["executionAdapters"][number]) => void;
  onRecordHumanConfirmation?: (row: ExecutionAdapterOrchestrationExecutionRow) => void;
  onRecordOrchestrationDryRun?: (row: ExecutionAdapterRuntimeReloadAcceptanceRow) => void;
  onRecordOrchestrationExecution?: (row: ExecutionAdapterOrchestrationDryRunRow) => void;
  onRecordProductionRouteReview?: (row: ExecutionAdapterSandboxProbeReviewRow) => void;
  onRecordOpsState?: (row: ExecutionAdapterPaperRouteRunbookRow) => void;
  onRecordPaperExecution?: (row: ExecutionAdapterOpsStateRow) => void;
  onRecordRuntimeReloadAcceptance?: (row: ExecutionAdapterRuntimeReloadExecutionRow) => void;
  onRecordSandboxProbeExecution?: (row: ExecutionAdapterSandboxProbePlanRow) => void;
  onRecordSandboxProbePlan?: (row: ExecutionAdapterHumanConfirmationRow) => void;
  onRecordSandboxProbeReview?: (row: ExecutionAdapterSandboxProbeExecutionRow) => void;
  onFocusPaperExecutionAudit?: (row: ExecutionAdapterPaperExecutionRow) => void;
  onCopyPaperExecutionAuditLink?: (row: ExecutionAdapterPaperExecutionRow) => void;
  onRefreshAdapterHealthProbe?: () => void;
  onRefreshContext?: (context: PlatformSettingsStatus["cache"]["contexts"][number]) => void;
  onOpenMarketDataAdapterWorkflow?: (adapter: PlatformSettingsStatus["marketDataAdapters"][number]) => void;
  onRuntimeReloadAcceptanceConfirmationChange?: (
    executionId: string,
    key: keyof ExecutionAdapterRuntimeReloadAcceptanceConfirmations,
    checked: boolean
  ) => void;
  recordingAdapterCertificationId?: string | null;
  recordingHumanConfirmationId?: string | null;
  recordingOrchestrationDryRunId?: string | null;
  recordingOrchestrationExecutionId?: string | null;
  recordingRuntimeReloadAcceptanceId?: string | null;
  recordingSandboxProbeExecutionId?: string | null;
  recordingSandboxProbePlanId?: string | null;
  recordingSandboxProbeReviewId?: string | null;
  recordingProductionRouteReviewId?: string | null;
  recordingOpsStateId?: string | null;
  recordingPaperExecutionId?: string | null;
  focusedPaperExecutionAuditEventId?: string | null;
  humanConfirmationConfirmations: Record<string, ExecutionAdapterHumanConfirmationConfirmations>;
  humanConfirmationRows: ExecutionAdapterHumanConfirmationRow[];
  orchestrationDryRunConfirmations: Record<string, ExecutionAdapterOrchestrationDryRunConfirmations>;
  orchestrationDryRunRows: ExecutionAdapterOrchestrationDryRunRow[];
  orchestrationExecutionConfirmations: Record<string, ExecutionAdapterOrchestrationExecutionConfirmations>;
  orchestrationExecutionRows: ExecutionAdapterOrchestrationExecutionRow[];
  refreshingCacheKey?: string | null;
  runtimeReloadAcceptanceConfirmations: Record<string, ExecutionAdapterRuntimeReloadAcceptanceConfirmations>;
  runtimeReloadAcceptanceRows: ExecutionAdapterRuntimeReloadAcceptanceRow[];
  runtimeReloadExecutionRows: ExecutionAdapterRuntimeReloadExecutionRow[];
  sandboxProbeExecutionConfirmations: Record<string, ExecutionAdapterSandboxProbeExecutionConfirmations>;
  sandboxProbeExecutionRows: ExecutionAdapterSandboxProbeExecutionRow[];
  sandboxProbePlanConfirmations: Record<string, ExecutionAdapterSandboxProbePlanConfirmations>;
  sandboxProbePlanRows: ExecutionAdapterSandboxProbePlanRow[];
  sandboxProbeReviewConfirmations: Record<string, ExecutionAdapterSandboxProbeReviewConfirmations>;
  sandboxProbeReviewRows: ExecutionAdapterSandboxProbeReviewRow[];
  adapterSandboxOrderSchemaDryRunRows: ExecutionAdapterSandboxOrderSchemaDryRunRow[];
  adapterPaperOrderLifecycleRows: ExecutionAdapterPaperOrderLifecycleRow[];
  adapterPaperRouteRunbookRows: ExecutionAdapterPaperRouteRunbookRow[];
  adapterOpsStateRows: ExecutionAdapterOpsStateRow[];
  adapterOpsStateConfirmations: Record<string, ExecutionAdapterOpsStateConfirmations>;
  adapterPaperExecutionRows: ExecutionAdapterPaperExecutionRow[];
  adapterPaperExecutionConfirmations: Record<string, ExecutionAdapterPaperExecutionConfirmations>;
  productionRouteReviewConfirmations: Record<string, ExecutionAdapterProductionRouteReviewConfirmations>;
  productionRouteReviewRows: ExecutionAdapterProductionRouteReviewRow[];
  settings?: PlatformSettingsStatus;
  state: MarketKlinesResult;
  workspace: TerminalWorkspace;
};
