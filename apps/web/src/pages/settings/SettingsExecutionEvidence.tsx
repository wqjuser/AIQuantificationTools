import { formatChartDate } from "../../components/AiReviewAuditBoards";
import { type AppI18n } from "../../lib/i18n";
import { MarketKlinesResult, PlatformSettingsStatus } from "../../lib/terminal-api";
import { BrokerAdapterRow, ExecutionAdapterCertificationApplyConfirmationKey, ExecutionAdapterCertificationApplyConfirmations, ExecutionAdapterCertificationApplyRow, ExecutionAdapterCertificationRow, ExecutionAdapterChainHealthRollup, ExecutionAdapterHealthProbeRow, ExecutionAdapterHumanConfirmationRow, ExecutionAdapterLedgerRow, ExecutionAdapterOpsStateRow, ExecutionAdapterOrchestrationDryRunRow, ExecutionAdapterOrchestrationExecutionRow, ExecutionAdapterPaperExecutionRow, ExecutionAdapterPaperOrderLifecycleRow, ExecutionAdapterPaperRouteRunbookRow, ExecutionAdapterProductionRouteReviewRow, ExecutionAdapterRuntimeReloadAcceptanceRow, ExecutionAdapterRuntimeReloadExecutionRow, ExecutionAdapterSandboxOrderSchemaDryRunRow, ExecutionAdapterSandboxProbeExecutionRow, ExecutionAdapterSandboxProbePlanRow, ExecutionAdapterSandboxProbeReviewRow, TerminalWorkspace, buildExecutionAdapterCertificationApplyConfirmationRows, createDefaultExecutionAdapterCertificationApplyConfirmations } from "../../lib/terminal-workbench";
import { AdapterChainHealthList } from "../backtest/P2ReviewPanels";
import { adapterCertificationAdapterName, adapterCertificationApplyBlockerSummary, adapterCertificationApplyConfirmationDetail, adapterCertificationApplyConfirmationLabel, adapterCertificationApplyConfirmationSummary, adapterCertificationApplyModeLabel, adapterCertificationApplyStatusLabel, adapterCertificationBoundaryLabel, adapterCertificationCheckSummary, adapterCertificationStatusLabel, adapterHealthProbeBlockerLabel, adapterHealthProbeBoundaryLabel, adapterHealthProbeCheckStatusLabel, adapterHealthProbeCheckSummaryLabel, adapterHealthProbeCredentialSummaryLabel, adapterHealthProbeRouteReviewSummaryLabel, adapterHealthProbeStatusLabel, adapterHumanConfirmationConfirmationSummary, adapterHumanConfirmationStatusLabel, adapterLedgerAdapterName, adapterLedgerGateSummary, adapterLedgerLabel, adapterLedgerNextStep, adapterLedgerReason, adapterOpsStateBoundaryLabel, adapterOpsStateConfirmationSummary, adapterOpsStateStatusLabel, adapterOrchestrationDryRunConfirmationSummary, adapterOrchestrationDryRunStatusLabel, adapterOrchestrationExecutionConfirmationSummary, adapterOrchestrationExecutionStatusLabel, adapterPaperExecutionBoundaryLabel, adapterPaperExecutionConfirmationSummary, adapterPaperExecutionStatusLabel, adapterPaperOrderLifecycleBoundaryLabel, adapterPaperOrderLifecycleConfirmationSummary, adapterPaperOrderLifecycleStatusLabel, adapterPaperRouteRunbookBoundaryLabel, adapterPaperRouteRunbookConfirmationSummary, adapterPaperRouteRunbookStatusLabel, adapterProductionRouteReviewConfirmationSummary, adapterProductionRouteReviewStatusLabel, adapterRuntimeReloadAcceptanceConfirmationSummary, adapterRuntimeReloadAcceptanceStatusLabel, adapterRuntimeReloadExecutionConfirmationSummary, adapterRuntimeReloadExecutionStatusLabel, adapterSandboxOrderSchemaDryRunBoundaryLabel, adapterSandboxOrderSchemaDryRunConfirmationSummary, adapterSandboxOrderSchemaDryRunStatusLabel, adapterSandboxProbeExecutionConfirmationSummary, adapterSandboxProbeExecutionStatusLabel, adapterSandboxProbePlanConfirmationSummary, adapterSandboxProbePlanStatusLabel, adapterSandboxProbeReviewConfirmationSummary, adapterSandboxProbeReviewStatusLabel } from "../execution/AdapterFormatters";
import { createDefaultExecutionAdapterHumanConfirmationConfirmations, createDefaultExecutionAdapterOpsStateConfirmations, createDefaultExecutionAdapterOrchestrationDryRunConfirmations, createDefaultExecutionAdapterOrchestrationExecutionConfirmations, createDefaultExecutionAdapterPaperExecutionConfirmations, createDefaultExecutionAdapterProductionRouteReviewConfirmations, createDefaultExecutionAdapterRuntimeReloadAcceptanceConfirmations, createDefaultExecutionAdapterSandboxProbeExecutionConfirmations, createDefaultExecutionAdapterSandboxProbePlanConfirmations, createDefaultExecutionAdapterSandboxProbeReviewConfirmations, executionAdapterHumanConfirmationConfirmationRows, executionAdapterOpsStateConfirmationRows, executionAdapterOrchestrationDryRunConfirmationRows, executionAdapterOrchestrationExecutionConfirmationRows, executionAdapterPaperExecutionConfirmationRows, executionAdapterProductionRouteReviewConfirmationRows, executionAdapterRuntimeReloadAcceptanceConfirmationRows, executionAdapterSandboxProbeExecutionConfirmationRows, executionAdapterSandboxProbePlanConfirmationRows, executionAdapterSandboxProbeReviewConfirmationRows, type ExecutionAdapterHumanConfirmationConfirmations, type ExecutionAdapterOpsStateConfirmations, type ExecutionAdapterOrchestrationDryRunConfirmations, type ExecutionAdapterOrchestrationExecutionConfirmations, type ExecutionAdapterPaperExecutionConfirmations, type ExecutionAdapterProductionRouteReviewConfirmations, type ExecutionAdapterRuntimeReloadAcceptanceConfirmations, type ExecutionAdapterSandboxProbeExecutionConfirmations, type ExecutionAdapterSandboxProbePlanConfirmations, type ExecutionAdapterSandboxProbeReviewConfirmations } from "../execution/ExecutionConfirmations";
import { Copy, Play, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { type PlatformSettingsPanelProps } from "./PlatformSettingsPanel.types";

export function SettingsExecutionEvidence(props: PlatformSettingsPanelProps) {
  const { className, i18n, onHumanConfirmationChange, onSandboxProbeExecutionConfirmationChange, onSandboxProbePlanConfirmationChange, onSandboxProbeReviewConfirmationChange, onProductionRouteReviewConfirmationChange, onOpsStateConfirmationChange, onPaperExecutionConfirmationChange, onRecordHumanConfirmation, onRecordProductionRouteReview, onRecordOpsState, onRecordPaperExecution, onRecordSandboxProbeExecution, onRecordSandboxProbePlan, onRecordSandboxProbeReview, onFocusPaperExecutionAudit, onCopyPaperExecutionAuditLink, recordingHumanConfirmationId, recordingSandboxProbeExecutionId, recordingSandboxProbePlanId, recordingSandboxProbeReviewId, recordingProductionRouteReviewId, recordingOpsStateId, recordingPaperExecutionId, humanConfirmationConfirmations, humanConfirmationRows, orchestrationExecutionRows, sandboxProbeExecutionConfirmations, sandboxProbeExecutionRows, sandboxProbePlanConfirmations, sandboxProbePlanRows, sandboxProbeReviewConfirmations, sandboxProbeReviewRows, adapterSandboxOrderSchemaDryRunRows, adapterPaperOrderLifecycleRows, adapterPaperRouteRunbookRows, adapterOpsStateRows, adapterOpsStateConfirmations, adapterPaperExecutionRows, adapterPaperExecutionConfirmations, productionRouteReviewConfirmations, productionRouteReviewRows, focusedPaperExecutionAuditEventId, state } = props;
  const focusedPaperExecutionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!focusedPaperExecutionAuditEventId) return;
    focusedPaperExecutionRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusedPaperExecutionAuditEventId, adapterPaperExecutionRows.length]);

  return (
    <>
      <div className="adapter-human-confirmation-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "最终人工确认" : "Final human confirmation"}</span>
          <strong>{orchestrationExecutionRows.length}</strong>
        </div>
        {orchestrationExecutionRows.length ? (
          orchestrationExecutionRows.slice(0, 4).map((row) => {
            const confirmations =
              humanConfirmationConfirmations[row.id] ??
              createDefaultExecutionAdapterHumanConfirmationConfirmations();
            const confirmation = humanConfirmationRows.find(
              (item) => item.adapterId === row.adapterId && item.orchestrationExecutionId === row.id
            );
            return (
              <article className={`adapter-human-confirmation-row ${confirmation?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterOrchestrationExecutionStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterOrchestrationExecutionConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-human-confirmation-confirmations">
                  {executionAdapterHumanConfirmationConfirmationRows.map((item) => (
                    <label
                      className={`adapter-human-confirmation-confirmation ${
                        confirmations[item.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onHumanConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingHumanConfirmationId === row.id || !onRecordHumanConfirmation}
                  onClick={() => onRecordHumanConfirmation?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingHumanConfirmationId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "确认中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录最终确认"
                      : "Record final confirmation"}
                </button>
                {confirmation ? (
                  <div className={`adapter-human-confirmation-result ${confirmation.tone}`}>
                    <strong>{adapterHumanConfirmationStatusLabel(i18n, confirmation.statusLabel)}</strong>
                    <span>
                      {adapterHumanConfirmationConfirmationSummary(i18n, confirmation.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, confirmation.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, confirmation.boundary)}
                    </span>
                    <em>{confirmation.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待最终人工确认；确认记录只关闭审计闸门，实盘交易仍保持阻断。"
                      : "Waiting for final human confirmation; recording closes the audit gate only while live trading stays blocked."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待受控编排执行证据；执行证据记录后才能录入最终人工确认。"
              : "Waiting for controlled orchestration execution evidence before final human confirmation can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-sandbox-probe-plan-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "Sandbox 探针计划" : "Sandbox probe plan"}</span>
          <strong>{humanConfirmationRows.length}</strong>
        </div>
        {humanConfirmationRows.length ? (
          humanConfirmationRows.slice(0, 4).map((row) => {
            const confirmations =
              sandboxProbePlanConfirmations[row.id] ??
              createDefaultExecutionAdapterSandboxProbePlanConfirmations();
            const probePlan = sandboxProbePlanRows.find(
              (item) => item.adapterId === row.adapterId && item.humanConfirmationId === row.id
            );
            return (
              <article className={`adapter-sandbox-probe-plan-row ${probePlan?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterHumanConfirmationStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterHumanConfirmationConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-sandbox-probe-plan-confirmations">
                  {executionAdapterSandboxProbePlanConfirmationRows.map((item) => (
                    <label
                      className={`adapter-sandbox-probe-plan-confirmation ${
                        confirmations[item.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onSandboxProbePlanConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingSandboxProbePlanId === row.id || !onRecordSandboxProbePlan}
                  onClick={() => onRecordSandboxProbePlan?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingSandboxProbePlanId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录探针计划"
                      : "Record probe plan"}
                </button>
                {probePlan ? (
                  <div className={`adapter-sandbox-probe-plan-result ${probePlan.tone}`}>
                    <strong>{adapterSandboxProbePlanStatusLabel(i18n, probePlan.statusLabel)}</strong>
                    <span>
                      {adapterSandboxProbePlanConfirmationSummary(i18n, probePlan.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, probePlan.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, probePlan.boundary)}
                    </span>
                    <em>{probePlan.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待 sandbox 探针计划；这一步只记录测试计划，不连接券商、不提交订单。"
                      : "Waiting for a sandbox probe plan; this records the test plan only, with no broker connection or order submission."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待最终人工确认；确认后才能记录 sandbox/testnet 探针计划。"
              : "Waiting for final human confirmation before recording a sandbox/testnet probe plan."}
          </p>
        )}
      </div>
      <div className="adapter-sandbox-probe-execution-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "Sandbox 探针执行" : "Sandbox probe execution"}</span>
          <strong>{sandboxProbePlanRows.length}</strong>
        </div>
        {sandboxProbePlanRows.length ? (
          sandboxProbePlanRows.slice(0, 4).map((row) => {
            const confirmations =
              sandboxProbeExecutionConfirmations[row.id] ??
              createDefaultExecutionAdapterSandboxProbeExecutionConfirmations();
            const probeExecution = sandboxProbeExecutionRows.find(
              (item) => item.adapterId === row.adapterId && item.sandboxProbePlanId === row.id
            );
            const authoritativeHealthReady = probeExecution?.authoritativeHealthReady ?? false;
            return (
              <article className={`adapter-sandbox-probe-execution-row ${probeExecution?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterSandboxProbePlanStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterSandboxProbePlanConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-sandbox-probe-execution-confirmations">
                  {executionAdapterSandboxProbeExecutionConfirmationRows.map((item) => {
                    const checked = item.authoritative ? authoritativeHealthReady : confirmations[item.key];
                    return (
                      <label
                        className={`adapter-sandbox-probe-execution-confirmation ${checked ? "positive" : "warning"}`}
                        key={`${row.id}-${item.key}`}
                      >
                        <input
                          checked={checked}
                          disabled={item.authoritative}
                          onChange={(event) =>
                            onSandboxProbeExecutionConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                          }
                          type="checkbox"
                        />
                        <span>
                          {i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}
                          {item.authoritative
                            ? i18n.locale === "zh-CN"
                              ? "（服务端探针）"
                              : " (server probe)"
                            : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingSandboxProbeExecutionId === row.id || !onRecordSandboxProbeExecution}
                  onClick={() => onRecordSandboxProbeExecution?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingSandboxProbeExecutionId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录探针执行"
                      : "Record probe execution"}
                </button>
                {probeExecution ? (
                  <div className={`adapter-sandbox-probe-execution-result ${probeExecution.tone}`}>
                    <strong>{adapterSandboxProbeExecutionStatusLabel(i18n, probeExecution.statusLabel)}</strong>
                    <span>
                      {adapterSandboxProbeExecutionConfirmationSummary(i18n, probeExecution.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, probeExecution.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, probeExecution.boundary)}
                    </span>
                    <span>
                      {i18n.locale === "zh-CN" ? "权威探针" : "Authoritative probe"} ·{" "}
                      {probeExecution.healthProbeSummary}
                    </span>
                    <em>{probeExecution.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待 sandbox/testnet 只读探针执行；这一步只记录握手和订单 schema 证据，不提交任何订单。"
                      : "Waiting for a read-only sandbox/testnet probe execution; this records handshake and order-schema evidence only, with no order submission."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 sandbox/testnet 探针计划；计划记录后才能录入只读探针执行证据。"
              : "Waiting for a sandbox/testnet probe plan before read-only probe execution evidence can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-sandbox-probe-review-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "Sandbox 探针复核" : "Sandbox probe review"}</span>
          <strong>{sandboxProbeExecutionRows.length}</strong>
        </div>
        {sandboxProbeExecutionRows.length ? (
          sandboxProbeExecutionRows.slice(0, 4).map((row) => {
            const confirmations =
              sandboxProbeReviewConfirmations[row.id] ??
              createDefaultExecutionAdapterSandboxProbeReviewConfirmations();
            const probeReview = sandboxProbeReviewRows.find(
              (item) => item.adapterId === row.adapterId && item.sandboxProbeExecutionId === row.id
            );
            return (
              <article className={`adapter-sandbox-probe-review-row ${probeReview?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterSandboxProbeExecutionStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterSandboxProbeExecutionConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-sandbox-probe-review-confirmations">
                  {executionAdapterSandboxProbeReviewConfirmationRows.map((item) => (
                    <label
                      className={`adapter-sandbox-probe-review-confirmation ${
                        confirmations[item.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onSandboxProbeReviewConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingSandboxProbeReviewId === row.id || !onRecordSandboxProbeReview}
                  onClick={() => onRecordSandboxProbeReview?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingSandboxProbeReviewId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "复核中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录探针复核"
                      : "Record probe review"}
                </button>
                {probeReview ? (
                  <div className={`adapter-sandbox-probe-review-result ${probeReview.tone}`}>
                    <strong>{adapterSandboxProbeReviewStatusLabel(i18n, probeReview.statusLabel)}</strong>
                    <span>
                      {adapterSandboxProbeReviewConfirmationSummary(i18n, probeReview.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, probeReview.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, probeReview.boundary)}
                    </span>
                    <em>{probeReview.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待 sandbox/testnet 探针复核；复核只确认只读证据已归档，生产路由仍保持阻断。"
                      : "Waiting for sandbox/testnet probe review; review only attests read-only evidence is archived while production routing stays blocked."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待只读探针执行证据；执行记录后才能录入复核。"
              : "Waiting for read-only probe execution evidence before recording a review."}
          </p>
        )}
      </div>
      <div className="adapter-production-route-review-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "生产路由策略复核" : "Production route review"}</span>
          <strong>{sandboxProbeReviewRows.length}</strong>
        </div>
        {sandboxProbeReviewRows.length ? (
          sandboxProbeReviewRows.slice(0, 4).map((row) => {
            const confirmations =
              productionRouteReviewConfirmations[row.id] ??
              createDefaultExecutionAdapterProductionRouteReviewConfirmations();
            const routeReview = productionRouteReviewRows.find((item) => item.sandboxProbeReviewId === row.id);
            return (
              <article className={`adapter-production-route-review-row ${routeReview?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterSandboxProbeReviewStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterSandboxProbeReviewConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-production-route-review-confirmations">
                  {executionAdapterProductionRouteReviewConfirmationRows.map((item) => (
                    <label
                      className={`adapter-production-route-review-confirmation ${
                        confirmations[item.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onProductionRouteReviewConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingProductionRouteReviewId === row.id || !onRecordProductionRouteReview}
                  onClick={() => onRecordProductionRouteReview?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingProductionRouteReviewId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "复核中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录生产路由复核"
                      : "Record route review"}
                </button>
                {routeReview ? (
                  <div className={`adapter-production-route-review-result ${routeReview.tone}`}>
                    <strong>{adapterProductionRouteReviewStatusLabel(i18n, routeReview.statusLabel)}</strong>
                    <span>
                      {adapterProductionRouteReviewConfirmationSummary(i18n, routeReview.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, routeReview.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, routeReview.boundary)}
                    </span>
                    <em>{routeReview.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待生产路由策略复核；该复核只记录急停、仓位限额、路由禁用和回滚责任，实盘路由仍保持阻断。"
                      : "Waiting for production route policy review; this only records kill-switch, position-limit, routing-disabled, and rollback-owner checks while live routing remains blocked."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 sandbox 探针复核；前置复核记录后才能录入生产路由策略复核。"
            : "Waiting for sandbox probe review before production route policy review can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-sandbox-order-schema-dry-run-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "订单 schema dry-run 证据" : "Order schema dry-run evidence"}</span>
          <strong>{adapterSandboxOrderSchemaDryRunRows.length}</strong>
        </div>
        {adapterSandboxOrderSchemaDryRunRows.length ? (
          adapterSandboxOrderSchemaDryRunRows.slice(0, 3).map((dryRun) => (
            <article className={`adapter-sandbox-order-schema-dry-run-row ${dryRun.tone}`} key={dryRun.id}>
              <div>
                <strong>
                  {adapterCertificationAdapterName(i18n, dryRun.adapterId)} ·{" "}
                  {adapterSandboxOrderSchemaDryRunStatusLabel(i18n, dryRun.statusLabel)}
                </strong>
                <span>{formatChartDate(dryRun.timestamp)}</span>
              </div>
              <p>
                {adapterSandboxOrderSchemaDryRunConfirmationSummary(i18n, dryRun.confirmationSummary)} ·{" "}
                {adapterCertificationApplyBlockerSummary(i18n, dryRun.blockerSummary)} ·{" "}
                {adapterSandboxOrderSchemaDryRunBoundaryLabel(i18n, dryRun.boundary)}
              </p>
              <p>
                {dryRun.orderIntentSummary} · {dryRun.envVarSummary}
              </p>
              <em>
                {dryRun.manifestValidationId ? `${dryRun.manifestValidationId} · ` : ""}
                {dryRun.auditEventId}
              </em>
            </article>
          ))
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待订单 schema dry-run 证据；该记录只验证订单意图结构，不提交任何订单。"
              : "Waiting for order schema dry-run evidence; this only validates order-intent structure and submits no orders."}
          </p>
        )}
      </div>
      <div className="adapter-paper-order-lifecycle-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "Paper 订单 lifecycle 证据" : "Paper order lifecycle evidence"}</span>
          <strong>{adapterPaperOrderLifecycleRows.length}</strong>
        </div>
        {adapterPaperOrderLifecycleRows.length ? (
          adapterPaperOrderLifecycleRows.slice(0, 3).map((lifecycle) => (
            <article className={`adapter-paper-order-lifecycle-row ${lifecycle.tone}`} key={lifecycle.id}>
              <div>
                <strong>
                  {adapterCertificationAdapterName(i18n, lifecycle.adapterId)} ·{" "}
                  {adapterPaperOrderLifecycleStatusLabel(i18n, lifecycle.statusLabel)}
                </strong>
                <span>{formatChartDate(lifecycle.timestamp)}</span>
              </div>
              <p>
                {adapterPaperOrderLifecycleConfirmationSummary(i18n, lifecycle.confirmationSummary)} ·{" "}
                {lifecycle.lifecycleStepSummary} · {adapterCertificationApplyBlockerSummary(i18n, lifecycle.blockerSummary)}
              </p>
              <p>
                {lifecycle.orderIntentSummary} ·{" "}
                {adapterPaperOrderLifecycleBoundaryLabel(i18n, lifecycle.boundary)}
              </p>
              <em>
                {lifecycle.manifestValidationId ? `${lifecycle.manifestValidationId} · ` : ""}
                {lifecycle.auditEventId}
              </em>
            </article>
          ))
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 Paper 订单 lifecycle 证据；该记录只写本地模拟生命周期，不提交实盘订单。"
              : "Waiting for paper order lifecycle evidence; this records local simulated lifecycle only and submits no live orders."}
          </p>
        )}
      </div>
      <div className="adapter-paper-route-runbook-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "Paper 路由 runbook 证据" : "Paper route runbook evidence"}</span>
          <strong>{adapterPaperRouteRunbookRows.length}</strong>
        </div>
        {adapterPaperRouteRunbookRows.length ? (
          adapterPaperRouteRunbookRows.slice(0, 3).map((runbook) => (
            <article className={`adapter-paper-route-runbook-row ${runbook.tone}`} key={runbook.id}>
              <div>
                <strong>
                  {adapterCertificationAdapterName(i18n, runbook.adapterId)} ·{" "}
                  {adapterPaperRouteRunbookStatusLabel(i18n, runbook.statusLabel)}
                </strong>
                <span>{formatChartDate(runbook.timestamp)}</span>
              </div>
              <p>
                {adapterPaperRouteRunbookConfirmationSummary(i18n, runbook.confirmationSummary)} ·{" "}
                {runbook.runbookStepSummary} · {adapterCertificationApplyBlockerSummary(i18n, runbook.blockerSummary)}
              </p>
              <p>
                {runbook.orderIntentSummary} · {adapterPaperRouteRunbookBoundaryLabel(i18n, runbook.boundary)}
              </p>
              <em>
                {runbook.manifestValidationId ? `${runbook.manifestValidationId} · ` : ""}
                {runbook.auditEventId}
              </em>
            </article>
          ))
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 Paper 路由 runbook 证据；该记录只写受控模拟路由手册，不执行任何路由。"
              : "Waiting for paper route runbook evidence; this records a controlled paper route runbook and executes no route."}
          </p>
        )}
      </div>
      <div className="adapter-ops-state-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "适配器 ops state 证据" : "Adapter ops state evidence"}</span>
          <strong>{adapterPaperRouteRunbookRows.length}</strong>
        </div>
        {adapterPaperRouteRunbookRows.length ? (
          adapterPaperRouteRunbookRows.slice(0, 4).map((runbook) => {
            const confirmations =
              adapterOpsStateConfirmations[runbook.id] ?? createDefaultExecutionAdapterOpsStateConfirmations();
            const opsState = adapterOpsStateRows.find((item) => item.paperRouteRunbookId === runbook.id);
            return (
              <article className={`adapter-ops-state-row ${opsState?.tone ?? runbook.tone}`} key={runbook.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, runbook.adapterId)} ·{" "}
                    {opsState
                      ? adapterOpsStateStatusLabel(i18n, opsState.statusLabel)
                      : adapterPaperRouteRunbookStatusLabel(i18n, runbook.statusLabel)}
                  </strong>
                  <span>{formatChartDate(opsState?.timestamp ?? runbook.timestamp)}</span>
                </div>
                <p>
                  {adapterPaperRouteRunbookConfirmationSummary(i18n, runbook.confirmationSummary)} ·{" "}
                  {runbook.runbookStepSummary} · {adapterPaperRouteRunbookBoundaryLabel(i18n, runbook.boundary)}
                </p>
                <div className="adapter-ops-state-confirmations">
                  {executionAdapterOpsStateConfirmationRows.map((item) => (
                    <label
                      className={`adapter-ops-state-confirmation ${confirmations[item.key] ? "positive" : "warning"}`}
                      key={`${runbook.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onOpsStateConfirmationChange?.(runbook.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingOpsStateId === runbook.id || !onRecordOpsState}
                  onClick={() => onRecordOpsState?.(runbook)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingOpsStateId === runbook.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录 ops state"
                      : "Record ops state"}
                </button>
                {opsState ? (
                  <div className={`adapter-ops-state-result ${opsState.tone}`}>
                    <strong>{adapterOpsStateStatusLabel(i18n, opsState.statusLabel)}</strong>
                    <span>
                      {adapterOpsStateConfirmationSummary(i18n, opsState.confirmationSummary)} ·{" "}
                      {opsState.opsStepSummary} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, opsState.blockerSummary)}
                    </span>
                    <span>
                      {opsState.orderIntentSummary} · {adapterOpsStateBoundaryLabel(i18n, opsState.boundary)}
                    </span>
                    <em>
                      {opsState.manifestValidationId ? `${opsState.manifestValidationId} · ` : ""}
                      {opsState.auditEventId}
                    </em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待适配器 ops state；该记录只确认监控、急停和 paper 对账状态，不开启实盘。"
                      : "Waiting for adapter ops state; this only confirms monitoring, kill-switch, and paper reconciliation readiness without enabling live trading."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 Paper 路由 runbook；runbook 记录后才能录入 ops state。"
              : "Waiting for a paper route runbook before adapter ops state can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-paper-execution-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "适配器模拟执行" : "Adapter paper executions"}</span>
          <strong>{adapterOpsStateRows.length}</strong>
        </div>
        {adapterOpsStateRows.length ? (
          adapterOpsStateRows.slice(0, 4).map((opsState) => {
            const confirmations =
              adapterPaperExecutionConfirmations[opsState.id] ??
              createDefaultExecutionAdapterPaperExecutionConfirmations();
            const paperExecution = adapterPaperExecutionRows.find((item) => item.adapterOpsStateId === opsState.id);
            const isFocusedPaperExecution = Boolean(
              paperExecution &&
                (paperExecution.auditEventId === focusedPaperExecutionAuditEventId ||
                  paperExecution.id === focusedPaperExecutionAuditEventId)
            );
            return (
              <article
                className={`adapter-ops-state-row ${paperExecution?.tone ?? opsState.tone} ${isFocusedPaperExecution ? "focused" : ""}`}
                key={opsState.id}
                ref={isFocusedPaperExecution ? focusedPaperExecutionRef : undefined}
              >
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, opsState.adapterId)} ·{" "}
                    {paperExecution
                      ? adapterPaperExecutionStatusLabel(i18n, paperExecution.statusLabel)
                      : adapterOpsStateStatusLabel(i18n, opsState.statusLabel)}
                  </strong>
                  <span>{formatChartDate(paperExecution?.timestamp ?? opsState.timestamp)}</span>
                </div>
                <p>
                  {adapterOpsStateConfirmationSummary(i18n, opsState.confirmationSummary)} ·{" "}
                  {opsState.opsStepSummary} · {adapterOpsStateBoundaryLabel(i18n, opsState.boundary)}
                </p>
                <div className="adapter-ops-state-confirmations">
                  {executionAdapterPaperExecutionConfirmationRows.map((item) => (
                    <label
                      className={`adapter-ops-state-confirmation ${confirmations[item.key] ? "positive" : "warning"}`}
                      key={`${opsState.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onPaperExecutionConfirmationChange?.(opsState.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingPaperExecutionId === opsState.id || !onRecordPaperExecution}
                  onClick={() => onRecordPaperExecution?.(opsState)}
                  type="button"
                >
                  <Play size={13} />
                  {recordingPaperExecutionId === opsState.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录模拟执行"
                      : "Record paper execution"}
                </button>
                {paperExecution ? (
                  <div className={`adapter-ops-state-result ${paperExecution.tone}`}>
                    <strong>{adapterPaperExecutionStatusLabel(i18n, paperExecution.statusLabel)}</strong>
                    <span>
                      {adapterPaperExecutionConfirmationSummary(i18n, paperExecution.confirmationSummary)} ·{" "}
                      {paperExecution.paperExecutionStepSummary} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, paperExecution.blockerSummary)}
                    </span>
                    <span>
                      {paperExecution.fillSummary} · {adapterPaperExecutionBoundaryLabel(i18n, paperExecution.boundary)}
                    </span>
                    <em>
                      {paperExecution.manifestValidationId
                        ? `${paperExecution.manifestValidationId} · ${paperExecution.auditEventId}`
                        : paperExecution.auditEventId}
                    </em>
                    <div className="adapter-ops-state-result-actions">
                      <button
                        disabled={!onFocusPaperExecutionAudit}
                        onClick={() => onFocusPaperExecutionAudit?.(paperExecution)}
                        type="button"
                      >
                        <Search size={13} />
                        {i18n.locale === "zh-CN" ? "审计定位" : "Open audit"}
                      </button>
                      <button
                        disabled={!onCopyPaperExecutionAuditLink}
                        onClick={() => void onCopyPaperExecutionAuditLink?.(paperExecution)}
                        type="button"
                      >
                        <Copy size={13} />
                        {i18n.locale === "zh-CN" ? "复制审计链接" : "Copy audit link"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待模拟执行；该记录只生成本地模拟成交，不提交订单或触发实盘路由。"
                      : "Waiting for paper execution; this only creates a local simulated fill without submitting orders or touching live routes."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 adapter ops state；ops state 记录后才能生成模拟执行证据。"
              : "Waiting for adapter ops state before paper execution evidence can be recorded."}
          </p>
        )}
      </div>
    </>
  );
}
