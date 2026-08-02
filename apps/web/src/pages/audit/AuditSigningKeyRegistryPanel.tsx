import { formatChartDate } from "../../components/AiReviewAuditBoards";
import { Panel } from "../../components/AppPanel";
import { type AppI18n } from "../../lib/i18n";
import { AuditSigningKeyControlledRestartEvidence, AuditSigningKeyEnvironmentBinding, AuditSigningKeyRegistry, AuditSigningKeyRegistryResult, AuditSigningKeyRotationAcceptance, AuditSigningKeyRotationApply, AuditSigningKeyRotationPlan, AuditSigningKeyRuntimeReloadExecution, AuditSigningKeyRuntimeReloadPlan, AuditSigningKeySecretMaterialization } from "../../lib/terminal-api";
import { AuditSigningKeyRotationChainSummary, AuditSigningKeyRotationLedgerRow } from "../../lib/terminal-workbench";
import { type AuditSigningKeyEnvironmentBindingConfirmations, type AuditSigningKeyRestartEvidenceConfirmations, type AuditSigningKeyRotationAcceptanceConfirmations, type AuditSigningKeyRotationApplyConfirmations, type AuditSigningKeyRuntimeReloadExecutionConfirmations, type AuditSigningKeyRuntimeReloadPlanConfirmations, type AuditSigningKeySecretMaterializationConfirmations } from "../execution/ExecutionConfirmations";
import { auditSigningKeyCapabilityLabel, auditSigningKeyEnvironmentBindingReasonLabel, auditSigningKeyEnvironmentBindingStatusLabel, auditSigningKeyRestartEvidenceReasonLabel, auditSigningKeyRestartEvidenceStatusLabel, auditSigningKeyRotationAcceptanceReasonLabel, auditSigningKeyRotationAcceptanceStatusLabel, auditSigningKeyRotationApplyReasonLabel, auditSigningKeyRotationApplyStatusLabel, auditSigningKeyRotationChainDetail, auditSigningKeyRotationChainHeadline, auditSigningKeyRotationChainStageLabel, auditSigningKeyRotationChainStageStatusLabel, auditSigningKeyRotationLedgerRowStatusLabel, auditSigningKeyRotationStepDetail, auditSigningKeyRotationStepTitle, auditSigningKeyRuntimeReloadExecutionReasonLabel, auditSigningKeyRuntimeReloadExecutionStatusLabel, auditSigningKeyRuntimeReloadPlanReasonLabel, auditSigningKeyRuntimeReloadPlanStatusLabel, auditSigningKeySecretMaterializationReasonLabel, auditSigningKeySecretMaterializationStatusLabel, auditSigningKeyStatusLabel, rotationLedgerStatusLabel, type AuditSigningKeyRotationLedgerStatus } from "./AuditLedgerFormatters";
import { GitBranch, RefreshCw, ShieldCheck } from "lucide-react";

export function AuditSigningKeyRegistryPanel({
  className,
  error,
  environmentBinding,
  environmentBindingConfirmations,
  environmentBindingError,
  environmentBindingMaterializationId,
  i18n,
  isApplyingRotation,
  isRecordingEnvironmentBinding,
  isRecordingRuntimeReloadExecution,
  isRecordingRuntimeReloadPlan,
  isRecordingRotationAcceptance,
  isPreparingRotation,
  isRecordingRestartEvidence,
  isRecordingSecretMaterialization,
  onApplyConfirmationChange,
  onApplyRotation,
  onEnvironmentBindingConfirmationChange,
  onPrepareRotation,
  onRecordEnvironmentBinding,
  onRecordRuntimeReloadExecution,
  onRecordRuntimeReloadPlan,
  onRecordRotationAcceptance,
  onRecordRestartEvidence,
  onRecordSecretMaterialization,
  onRotationAcceptanceConfirmationChange,
  onRuntimeReloadExecutionConfirmationChange,
  onRuntimeReloadPlanConfirmationChange,
  onRestartEvidenceConfirmationChange,
  onSecretMaterializationConfirmationChange,
  registry,
  restartEvidence,
  restartEvidenceApplyEventId,
  restartEvidenceConfirmations,
  restartEvidenceError,
  secretMaterialization,
  secretMaterializationConfirmations,
  secretMaterializationError,
  secretMaterializationPlanEventId,
  rotationApply,
  rotationApplyConfirmations,
  rotationApplyError,
  rotationError,
  rotationAcceptance,
  rotationAcceptanceConfirmations,
  rotationAcceptanceError,
  rotationAcceptanceExecutionId,
  rotationChainSummary,
  rotationHistoryRows,
  rotationHistoryState,
  rotationLedgerStatus,
  rotationPlan,
  runtimeReloadPlan,
  runtimeReloadPlanBindingId,
  runtimeReloadPlanConfirmations,
  runtimeReloadPlanError,
  runtimeReloadExecution,
  runtimeReloadExecutionConfirmations,
  runtimeReloadExecutionError,
  runtimeReloadExecutionPlanId,
  source
}: {
  className?: string;
  error?: string;
  environmentBinding?: AuditSigningKeyEnvironmentBinding;
  environmentBindingConfirmations: AuditSigningKeyEnvironmentBindingConfirmations;
  environmentBindingError?: string;
  environmentBindingMaterializationId: string | null;
  i18n: AppI18n;
  isApplyingRotation: boolean;
  isRecordingEnvironmentBinding: boolean;
  isRecordingRuntimeReloadExecution: boolean;
  isRecordingRuntimeReloadPlan: boolean;
  isRecordingRotationAcceptance: boolean;
  isPreparingRotation: boolean;
  isRecordingRestartEvidence: boolean;
  isRecordingSecretMaterialization: boolean;
  onApplyConfirmationChange: (field: keyof AuditSigningKeyRotationApplyConfirmations, value: boolean) => void;
  onApplyRotation: () => void;
  onEnvironmentBindingConfirmationChange: (
    field: keyof AuditSigningKeyEnvironmentBindingConfirmations,
    value: boolean
  ) => void;
  onPrepareRotation: () => void;
  onRecordEnvironmentBinding: () => void;
  onRecordRuntimeReloadExecution: () => void;
  onRecordRuntimeReloadPlan: () => void;
  onRecordRotationAcceptance: () => void;
  onRecordRestartEvidence: () => void;
  onRecordSecretMaterialization: () => void;
  onRotationAcceptanceConfirmationChange: (
    field: keyof AuditSigningKeyRotationAcceptanceConfirmations,
    value: boolean
  ) => void;
  onRuntimeReloadExecutionConfirmationChange: (
    field: keyof AuditSigningKeyRuntimeReloadExecutionConfirmations,
    value: boolean
  ) => void;
  onRuntimeReloadPlanConfirmationChange: (
    field: keyof AuditSigningKeyRuntimeReloadPlanConfirmations,
    value: boolean
  ) => void;
  onRestartEvidenceConfirmationChange: (field: keyof AuditSigningKeyRestartEvidenceConfirmations, value: boolean) => void;
  onSecretMaterializationConfirmationChange: (
    field: keyof AuditSigningKeySecretMaterializationConfirmations,
    value: boolean
  ) => void;
  registry?: AuditSigningKeyRegistry;
  restartEvidence?: AuditSigningKeyControlledRestartEvidence;
  restartEvidenceApplyEventId: string | null;
  restartEvidenceConfirmations: AuditSigningKeyRestartEvidenceConfirmations;
  restartEvidenceError?: string;
  secretMaterialization?: AuditSigningKeySecretMaterialization;
  secretMaterializationConfirmations: AuditSigningKeySecretMaterializationConfirmations;
  secretMaterializationError?: string;
  secretMaterializationPlanEventId: string | null;
  rotationApply?: AuditSigningKeyRotationApply;
  rotationApplyConfirmations: AuditSigningKeyRotationApplyConfirmations;
  rotationApplyError?: string;
  rotationError?: string;
  rotationAcceptance?: AuditSigningKeyRotationAcceptance;
  rotationAcceptanceConfirmations: AuditSigningKeyRotationAcceptanceConfirmations;
  rotationAcceptanceError?: string;
  rotationAcceptanceExecutionId: string | null;
  rotationChainSummary: AuditSigningKeyRotationChainSummary;
  rotationHistoryRows: AuditSigningKeyRotationLedgerRow[];
  rotationHistoryState: "loading" | "ready";
  rotationLedgerStatus: AuditSigningKeyRotationLedgerStatus;
  rotationPlan?: AuditSigningKeyRotationPlan;
  runtimeReloadPlan?: AuditSigningKeyRuntimeReloadPlan;
  runtimeReloadPlanBindingId: string | null;
  runtimeReloadPlanConfirmations: AuditSigningKeyRuntimeReloadPlanConfirmations;
  runtimeReloadPlanError?: string;
  runtimeReloadExecution?: AuditSigningKeyRuntimeReloadExecution;
  runtimeReloadExecutionConfirmations: AuditSigningKeyRuntimeReloadExecutionConfirmations;
  runtimeReloadExecutionError?: string;
  runtimeReloadExecutionPlanId: string | null;
  source: AuditSigningKeyRegistryResult["source"];
}) {
  const activeKey = registry?.keys.find((key) => key.keyId === registry.activeKeyId) ?? registry?.keys[0] ?? null;
  const verifiableCount = registry?.keys.filter((key) => key.canVerify).length ?? 0;
  const statusCopy =
    source === "core"
      ? i18n.locale === "zh-CN"
        ? "核心服务"
        : "Core service"
      : i18n.locale === "zh-CN"
        ? "离线快照"
        : "Offline";

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "签名 Key 注册表" : "Signing Key Registry"}
      subtitle={i18n.locale === "zh-CN" ? "审计报告验签与历史 key 追溯" : "Audit report verification and legacy key traceability"}
      className={className}
      action={
        <button className="compact-action" disabled={isPreparingRotation} onClick={onPrepareRotation} type="button">
          {isPreparingRotation ? <RefreshCw className="spin" size={13} /> : <GitBranch size={13} />}
          {i18n.locale === "zh-CN" ? "生成轮换计划" : "Prepare rotation"}
        </button>
      }
    >
      <div className="audit-signing-keys">
        <div className="audit-signing-key-grid">
          <article className={`audit-signing-key-summary ${registry?.rotationRequired ? "warning" : "positive"}`}>
            <span>{i18n.locale === "zh-CN" ? "活跃 Key" : "Active key"}</span>
            <strong>{activeKey?.keyId ?? "n/a"}</strong>
            <p>
              {activeKey
                ? `${auditSigningKeyStatusLabel(i18n, activeKey.status)} · ${activeKey.fingerprint}`
                : i18n.locale === "zh-CN"
                  ? "等待核心服务返回注册表"
                  : "Awaiting registry from core"}
            </p>
          </article>
          <article className={`audit-signing-key-summary ${registry?.rotationRequired ? "risk" : "neutral"}`}>
            <span>{i18n.locale === "zh-CN" ? "轮换状态" : "Rotation"}</span>
            <strong>
              {registry?.rotationRequired
                ? i18n.locale === "zh-CN"
                  ? "需要轮换"
                  : "Required"
                : i18n.locale === "zh-CN"
                  ? "已配置"
                  : "Configured"}
            </strong>
            <p>
              {i18n.locale === "zh-CN"
                ? `${verifiableCount} 个 key 可验签 · ${statusCopy}`
                : `${verifiableCount} verifiable keys · ${statusCopy}`}
            </p>
          </article>
        </div>
        <div className="audit-signing-key-list">
          {registry?.keys.length ? (
            registry.keys.map((key) => (
              <article className={`audit-signing-key-row ${key.status}`} key={key.keyId}>
                <span>{auditSigningKeyStatusLabel(i18n, key.status)}</span>
                <strong>{key.keyId}</strong>
                <em>{key.fingerprint}</em>
                <small>{key.chainId}</small>
                <b>{auditSigningKeyCapabilityLabel(i18n, key.canSign, key.canVerify)}</b>
              </article>
            ))
          ) : (
            <article className="audit-signing-key-row empty">
              <span>{i18n.locale === "zh-CN" ? "未连接" : "Disconnected"}</span>
              <strong>{i18n.locale === "zh-CN" ? "暂无注册表" : "No registry"}</strong>
              <em>fingerprint:n/a</em>
              <small>{error ?? (i18n.locale === "zh-CN" ? "核心服务未返回签名 key 状态。" : "Core did not return signing key state.")}</small>
              <b>{statusCopy}</b>
            </article>
          )}
        </div>
        <div className={`audit-signing-key-rotation-chain ${rotationChainSummary.state}`}>
          <div className="audit-signing-key-rotation-chain-head">
            <span>{i18n.locale === "zh-CN" ? "轮换证据链" : "Rotation evidence chain"}</span>
            <strong>{auditSigningKeyRotationChainHeadline(i18n, rotationChainSummary)}</strong>
            <p>{auditSigningKeyRotationChainDetail(i18n, rotationChainSummary)}</p>
          </div>
          <div className="audit-signing-key-rotation-chain-stages">
            {rotationChainSummary.stages.map((stage) => (
              <article className={`audit-signing-key-rotation-chain-stage ${stage.status}`} key={stage.id}>
                <span>{auditSigningKeyRotationChainStageStatusLabel(i18n, stage.status)}</span>
                <strong>{auditSigningKeyRotationChainStageLabel(i18n, stage.id, stage.label)}</strong>
                <small>{stage.rowId || (i18n.locale === "zh-CN" ? "等待证据入账" : "Awaiting evidence")}</small>
                <b>{stage.createdAt ? formatChartDate(stage.createdAt) : "n/a"}</b>
              </article>
            ))}
          </div>
        </div>
        <div className="audit-signing-key-rotation-history">
          <div className="audit-signing-key-rotation-history-head">
            <span>{i18n.locale === "zh-CN" ? "轮换历史" : "Rotation history"}</span>
            <strong>
              {rotationHistoryState === "loading"
                ? i18n.locale === "zh-CN"
                  ? "读取中"
                  : "Loading"
                : `${rotationHistoryRows.length}`}
            </strong>
          </div>
          {rotationHistoryRows.length ? (
            rotationHistoryRows.map((row) => (
              <article className={`audit-signing-key-rotation-history-row ${row.tone}`} key={row.id}>
                <span>{auditSigningKeyRotationLedgerRowStatusLabel(i18n, row.statusLabel)}</span>
                <strong>{row.proposedKeyId || "n/a"}</strong>
                <em>{row.eventKind === "plan" ? row.templateShortHash : row.applyMode || row.eventKind}</em>
                <small>{row.blockedReasonLabel}</small>
                <b>
                  {row.eventKind === "plan"
                    ? i18n.locale === "zh-CN"
                      ? `${row.environmentUpdateCount} 变量 / ${row.stepCount} 步`
                      : `${row.environmentUpdateCount} vars / ${row.stepCount} steps`
                    : i18n.locale === "zh-CN"
                      ? `${row.confirmedConfirmationCount}/${row.stepCount} 确认`
                      : `${row.confirmedConfirmationCount}/${row.stepCount} checks`}
                </b>
              </article>
            ))
          ) : (
            <article className="audit-signing-key-rotation-history-row empty">
              <span>{i18n.locale === "zh-CN" ? "暂无历史" : "No history"}</span>
              <strong>{i18n.locale === "zh-CN" ? "等待轮换计划入账" : "Awaiting ledger event"}</strong>
              <em>hash:n/a</em>
              <small>{i18n.locale === "zh-CN" ? "生成计划后会自动回读。" : "History appears after a plan is saved."}</small>
              <b>0</b>
            </article>
          )}
        </div>
        {rotationPlan ? (
          <div className="audit-signing-key-rotation-plan">
            {rotationLedgerStatus.state !== "idle" ? (
              <div className={`audit-signing-key-rotation-ledger ${rotationLedgerStatus.state}`}>
                <span>
                  {rotationLedgerStatusLabel(i18n, rotationLedgerStatus.state)}
                </span>
                <strong>{rotationLedgerStatus.detail || (i18n.locale === "zh-CN" ? "等待审计账本返回" : "Awaiting ledger")}</strong>
              </div>
            ) : null}
            <div className="audit-signing-key-rotation-head">
              <span>{i18n.locale === "zh-CN" ? "轮换计划" : "Rotation plan"}</span>
              <strong>{rotationPlan.proposedActiveKey.keyId}</strong>
              <small>
                {rotationPlan.requiresRestart
                  ? i18n.locale === "zh-CN"
                    ? "需要重启核心服务"
                    : "Core restart required"
                  : i18n.locale === "zh-CN"
                    ? "无需重启"
                    : "No restart required"}
              </small>
            </div>
            <div className="audit-signing-key-env-list">
              {rotationPlan.environmentUpdates.map((update) => (
                <article className={`audit-signing-key-env-row ${update.sensitivity}`} key={update.name}>
                  <span>{update.name}</span>
                  <code>{update.value}</code>
                  <em>{update.sensitivity === "secret" ? (i18n.locale === "zh-CN" ? "本地填写" : "Fill locally") : i18n.locale === "zh-CN" ? "可复制" : "Public"}</em>
                </article>
              ))}
            </div>
            <div className="audit-signing-key-rotation-steps">
              {rotationPlan.steps.map((step) => (
                <article className={`audit-signing-key-step ${step.status}`} key={step.id}>
                  <span>{step.status}</span>
                  <strong>{auditSigningKeyRotationStepTitle(i18n, step.title)}</strong>
                  <p>{auditSigningKeyRotationStepDetail(i18n, step.detail)}</p>
                </article>
              ))}
            </div>
            <pre>{rotationPlan.legacyRegistryTemplate}</pre>
            <div className="audit-signing-key-secret-materialization">
              <div className="audit-signing-key-rotation-apply-head">
                <span>{i18n.locale === "zh-CN" ? "Secret-store 物化清单" : "Secret-store materialization"}</span>
                <strong>
                  {i18n.locale === "zh-CN"
                    ? "只记录本地清单，不传 secret"
                    : "Record local manifest only, no secret"}
                </strong>
              </div>
              <div className="audit-signing-key-rotation-apply-checks">
                <label>
                  <input
                    checked={secretMaterializationConfirmations.localSecretStoreWriteVerified}
                    onChange={(event) =>
                      onSecretMaterializationConfirmationChange(
                        "localSecretStoreWriteVerified",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "本地 secret-store 写入已核验" : "Local secret-store write verified"}</span>
                </label>
                <label>
                  <input
                    checked={secretMaterializationConfirmations.noRawSecretInPayload}
                    onChange={(event) =>
                      onSecretMaterializationConfirmationChange("noRawSecretInPayload", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "payload 不含 raw secret" : "Payload contains no raw secret"}</span>
                </label>
                <label>
                  <input
                    checked={secretMaterializationConfirmations.envBindingPlanDocumented}
                    onChange={(event) =>
                      onSecretMaterializationConfirmationChange("envBindingPlanDocumented", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "环境绑定计划已记录" : "Environment binding plan documented"}</span>
                </label>
                <label>
                  <input
                    checked={secretMaterializationConfirmations.rollbackPlanDocumented}
                    onChange={(event) =>
                      onSecretMaterializationConfirmationChange("rollbackPlanDocumented", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "回滚计划已记录" : "Rollback plan documented"}</span>
                </label>
              </div>
              <button
                className="compact-action"
                disabled={isRecordingSecretMaterialization || !secretMaterializationPlanEventId}
                onClick={onRecordSecretMaterialization}
                type="button"
              >
                {isRecordingSecretMaterialization ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                {i18n.locale === "zh-CN" ? "记录物化清单" : "Record materialization"}
              </button>
              {secretMaterialization ? (
                <div className={`audit-signing-key-rotation-apply-result ${secretMaterialization.status}`}>
                  <span>{auditSigningKeySecretMaterializationStatusLabel(i18n, secretMaterialization.status)}</span>
                  <strong>{secretMaterialization.proposedActiveKeyId || "n/a"}</strong>
                  <small>
                    {secretMaterialization.blockedReasons.length
                      ? secretMaterialization.blockedReasons
                          .map((reason) => auditSigningKeySecretMaterializationReasonLabel(i18n, reason))
                          .join(" / ")
                      : i18n.locale === "zh-CN"
                        ? "清单已入账，实盘仍保持阻断"
                        : "Manifest recorded; live remains blocked"}
                  </small>
                  <em>{secretMaterialization.liveTradingAllowed ? "live=true" : "live=false / paper-only"}</em>
                </div>
              ) : null}
              {secretMaterializationError ? <p className="audit-signing-key-error">{secretMaterializationError}</p> : null}
            </div>
            <div className="audit-signing-key-environment-binding">
              <div className="audit-signing-key-rotation-apply-head">
                <span>{i18n.locale === "zh-CN" ? "环境绑定证据" : "Environment binding evidence"}</span>
                <strong>
                  {i18n.locale === "zh-CN"
                    ? "只记录运行映射，不写 env"
                    : "Record runtime mapping only, no env write"}
                </strong>
              </div>
              <div className="audit-signing-key-rotation-apply-checks">
                <label>
                  <input
                    checked={environmentBindingConfirmations.runtimeEnvMappingVerified}
                    onChange={(event) =>
                      onEnvironmentBindingConfirmationChange(
                        "runtimeEnvMappingVerified",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "运行环境映射已核验" : "Runtime env mapping verified"}</span>
                </label>
                <label>
                  <input
                    checked={environmentBindingConfirmations.configReloadPlanDocumented}
                    onChange={(event) =>
                      onEnvironmentBindingConfirmationChange(
                        "configReloadPlanDocumented",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "配置重载计划已记录" : "Config reload plan documented"}</span>
                </label>
                <label>
                  <input
                    checked={environmentBindingConfirmations.noRawSecretInPayload}
                    onChange={(event) =>
                      onEnvironmentBindingConfirmationChange("noRawSecretInPayload", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "payload 不含 raw secret" : "Payload contains no raw secret"}</span>
                </label>
                <label>
                  <input
                    checked={environmentBindingConfirmations.rollbackSnapshotRecorded}
                    onChange={(event) =>
                      onEnvironmentBindingConfirmationChange(
                        "rollbackSnapshotRecorded",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "回滚快照已记录" : "Rollback snapshot recorded"}</span>
                </label>
              </div>
              <button
                className="compact-action"
                disabled={isRecordingEnvironmentBinding || !environmentBindingMaterializationId}
                onClick={onRecordEnvironmentBinding}
                type="button"
              >
                {isRecordingEnvironmentBinding ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                {i18n.locale === "zh-CN" ? "记录环境绑定" : "Record binding"}
              </button>
              {environmentBinding ? (
                <div className={`audit-signing-key-rotation-apply-result ${environmentBinding.status}`}>
                  <span>{auditSigningKeyEnvironmentBindingStatusLabel(i18n, environmentBinding.status)}</span>
                  <strong>{environmentBinding.proposedActiveKeyId || "n/a"}</strong>
                  <small>
                    {environmentBinding.blockedReasons.length
                      ? environmentBinding.blockedReasons
                          .map((reason) => auditSigningKeyEnvironmentBindingReasonLabel(i18n, reason))
                          .join(" / ")
                      : i18n.locale === "zh-CN"
                        ? "环境绑定已入账，仍需受控重载"
                        : "Binding recorded; controlled reload still required"}
                  </small>
                  <em>{environmentBinding.liveTradingAllowed ? "live=true" : "live=false / paper-only"}</em>
                </div>
              ) : null}
              {environmentBindingError ? <p className="audit-signing-key-error">{environmentBindingError}</p> : null}
            </div>
            <div className="audit-signing-key-runtime-reload-plan audit-signing-key-environment-binding">
              <div className="audit-signing-key-rotation-apply-head">
                <span>{i18n.locale === "zh-CN" ? "运行时重载计划" : "Runtime reload plan"}</span>
                <strong>
                  {i18n.locale === "zh-CN"
                    ? "只记录计划，不重启容器"
                    : "Record plan only, no container restart"}
                </strong>
              </div>
              <div className="audit-signing-key-rotation-apply-checks">
                <label>
                  <input
                    checked={runtimeReloadPlanConfirmations.maintenanceWindowApproved}
                    onChange={(event) =>
                      onRuntimeReloadPlanConfirmationChange(
                        "maintenanceWindowApproved",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "维护窗口已批准" : "Maintenance window approved"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadPlanConfirmations.healthBaselineCaptured}
                    onChange={(event) =>
                      onRuntimeReloadPlanConfirmationChange("healthBaselineCaptured", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "重载前健康基线已捕获" : "Pre-reload health baseline captured"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadPlanConfirmations.configDiffReviewed}
                    onChange={(event) =>
                      onRuntimeReloadPlanConfirmationChange("configDiffReviewed", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "配置 diff 已复核" : "Configuration diff reviewed"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadPlanConfirmations.postReloadSmokePlanDocumented}
                    onChange={(event) =>
                      onRuntimeReloadPlanConfirmationChange(
                        "postReloadSmokePlanDocumented",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "重载后 smoke 计划已记录" : "Post-reload smoke plan documented"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadPlanConfirmations.rollbackOwnerAssigned}
                    onChange={(event) =>
                      onRuntimeReloadPlanConfirmationChange("rollbackOwnerAssigned", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "回滚负责人已指定" : "Rollback owner assigned"}</span>
                </label>
              </div>
              <button
                className="compact-action"
                disabled={isRecordingRuntimeReloadPlan || !runtimeReloadPlanBindingId}
                onClick={onRecordRuntimeReloadPlan}
                type="button"
              >
                {isRecordingRuntimeReloadPlan ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                {i18n.locale === "zh-CN" ? "记录重载计划" : "Record reload plan"}
              </button>
              {runtimeReloadPlan ? (
                <div className={`audit-signing-key-rotation-apply-result ${runtimeReloadPlan.status}`}>
                  <span>{auditSigningKeyRuntimeReloadPlanStatusLabel(i18n, runtimeReloadPlan.status)}</span>
                  <strong>{runtimeReloadPlan.proposedActiveKeyId || "n/a"}</strong>
                  <small>
                    {runtimeReloadPlan.blockedReasons.length
                      ? runtimeReloadPlan.blockedReasons
                          .map((reason) => auditSigningKeyRuntimeReloadPlanReasonLabel(i18n, reason))
                          .join(" / ")
                      : i18n.locale === "zh-CN"
                        ? "重载计划已入账，仍不执行重启"
                        : "Reload plan recorded; restart is still manual"}
                  </small>
                  <em>{runtimeReloadPlan.liveTradingAllowed ? "live=true" : "live=false / paper-only"}</em>
                </div>
              ) : null}
              {runtimeReloadPlanError ? <p className="audit-signing-key-error">{runtimeReloadPlanError}</p> : null}
            </div>
            <div className="audit-signing-key-runtime-reload-execution audit-signing-key-environment-binding">
              <div className="audit-signing-key-rotation-apply-head">
                <span>{i18n.locale === "zh-CN" ? "运行时重载执行证据" : "Runtime reload execution evidence"}</span>
                <strong>
                  {i18n.locale === "zh-CN"
                    ? "只记录执行证据，不执行重启"
                    : "Record execution evidence only, no restart"}
                </strong>
              </div>
              <div className="audit-signing-key-rotation-apply-checks">
                <label>
                  <input
                    checked={runtimeReloadExecutionConfirmations.preReloadHealthVerified}
                    onChange={(event) =>
                      onRuntimeReloadExecutionConfirmationChange(
                        "preReloadHealthVerified",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "重载前健康已复核" : "Pre-reload health verified"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadExecutionConfirmations.reloadActionRecorded}
                    onChange={(event) =>
                      onRuntimeReloadExecutionConfirmationChange("reloadActionRecorded", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "重载动作已记录" : "Reload action recorded"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadExecutionConfirmations.postReloadSmokePassed}
                    onChange={(event) =>
                      onRuntimeReloadExecutionConfirmationChange("postReloadSmokePassed", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "重载后 smoke 已通过" : "Post-reload smoke passed"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadExecutionConfirmations.rollbackReadinessConfirmed}
                    onChange={(event) =>
                      onRuntimeReloadExecutionConfirmationChange(
                        "rollbackReadinessConfirmed",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "回滚就绪已确认" : "Rollback readiness confirmed"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadExecutionConfirmations.operatorConfirmedLiveBlocked}
                    onChange={(event) =>
                      onRuntimeReloadExecutionConfirmationChange(
                        "operatorConfirmedLiveBlocked",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "操作员确认实盘仍阻断" : "Operator confirmed live remains blocked"}</span>
                </label>
              </div>
              <button
                className="compact-action"
                disabled={isRecordingRuntimeReloadExecution || !runtimeReloadExecutionPlanId}
                onClick={onRecordRuntimeReloadExecution}
                type="button"
              >
                {isRecordingRuntimeReloadExecution ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                {i18n.locale === "zh-CN" ? "记录执行证据" : "Record execution evidence"}
              </button>
              {runtimeReloadExecution ? (
                <div className={`audit-signing-key-rotation-apply-result ${runtimeReloadExecution.status}`}>
                  <span>{auditSigningKeyRuntimeReloadExecutionStatusLabel(i18n, runtimeReloadExecution.status)}</span>
                  <strong>{runtimeReloadExecution.proposedActiveKeyId || "n/a"}</strong>
                  <small>
                    {runtimeReloadExecution.blockedReasons.length
                      ? runtimeReloadExecution.blockedReasons
                          .map((reason) => auditSigningKeyRuntimeReloadExecutionReasonLabel(i18n, reason))
                          .join(" / ")
                      : i18n.locale === "zh-CN"
                        ? "执行证据已入账，仍不启用新 key"
                        : "Execution evidence recorded; key activation remains blocked"}
                  </small>
                  <em>{runtimeReloadExecution.liveTradingAllowed ? "live=true" : "live=false / paper-only"}</em>
                </div>
              ) : null}
              {runtimeReloadExecutionError ? (
                <p className="audit-signing-key-error">{runtimeReloadExecutionError}</p>
              ) : null}
            </div>
            <div className="audit-signing-key-rotation-acceptance audit-signing-key-environment-binding">
              <div className="audit-signing-key-rotation-apply-head">
                <span>{i18n.locale === "zh-CN" ? "最终验收闸门" : "Final acceptance gate"}</span>
                <strong>
                  {i18n.locale === "zh-CN"
                    ? "只记录人工验收，不启用新 key"
                    : "Record acceptance only, no key activation"}
                </strong>
              </div>
              <div className="audit-signing-key-rotation-apply-checks">
                <label>
                  <input
                    checked={rotationAcceptanceConfirmations.executionEvidenceReviewed}
                    onChange={(event) =>
                      onRotationAcceptanceConfirmationChange(
                        "executionEvidenceReviewed",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "执行证据已复核" : "Execution evidence reviewed"}</span>
                </label>
                <label>
                  <input
                    checked={rotationAcceptanceConfirmations.signatureProbeVerified}
                    onChange={(event) =>
                      onRotationAcceptanceConfirmationChange("signatureProbeVerified", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "签名探针已验证" : "Signature probe verified"}</span>
                </label>
                <label>
                  <input
                    checked={rotationAcceptanceConfirmations.legacyVerificationConfirmed}
                    onChange={(event) =>
                      onRotationAcceptanceConfirmationChange(
                        "legacyVerificationConfirmed",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "历史报告验签已确认" : "Legacy verification confirmed"}</span>
                </label>
                <label>
                  <input
                    checked={rotationAcceptanceConfirmations.rollbackWindowStillOpen}
                    onChange={(event) =>
                      onRotationAcceptanceConfirmationChange("rollbackWindowStillOpen", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "回滚窗口仍开放" : "Rollback window still open"}</span>
                </label>
                <label>
                  <input
                    checked={rotationAcceptanceConfirmations.operatorConfirmedActivationBlocked}
                    onChange={(event) =>
                      onRotationAcceptanceConfirmationChange(
                        "operatorConfirmedActivationBlocked",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>
                    {i18n.locale === "zh-CN"
                      ? "操作员确认新 key 仍阻断"
                      : "Operator confirmed activation remains blocked"}
                  </span>
                </label>
              </div>
              <button
                className="compact-action"
                disabled={isRecordingRotationAcceptance || !rotationAcceptanceExecutionId}
                onClick={onRecordRotationAcceptance}
                type="button"
              >
                {isRecordingRotationAcceptance ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                {i18n.locale === "zh-CN" ? "记录最终验收" : "Record acceptance"}
              </button>
              {rotationAcceptance ? (
                <div className={`audit-signing-key-rotation-apply-result ${rotationAcceptance.status}`}>
                  <span>{auditSigningKeyRotationAcceptanceStatusLabel(i18n, rotationAcceptance.status)}</span>
                  <strong>{rotationAcceptance.proposedActiveKeyId || "n/a"}</strong>
                  <small>
                    {rotationAcceptance.blockedReasons.length
                      ? rotationAcceptance.blockedReasons
                          .map((reason) => auditSigningKeyRotationAcceptanceReasonLabel(i18n, reason))
                          .join(" / ")
                      : i18n.locale === "zh-CN"
                        ? "最终验收已入账，新 key 仍未启用"
                        : "Acceptance recorded; new key remains inactive"}
                  </small>
                  <em>{rotationAcceptance.liveTradingAllowed ? "live=true" : "live=false / paper-only"}</em>
                </div>
              ) : null}
              {rotationAcceptanceError ? (
                <p className="audit-signing-key-error">{rotationAcceptanceError}</p>
              ) : null}
            </div>
            <div className="audit-signing-key-rotation-apply">
              <div className="audit-signing-key-rotation-apply-head">
                <span>{i18n.locale === "zh-CN" ? "应用预检" : "Apply preflight"}</span>
                <strong>{i18n.locale === "zh-CN" ? "只检查，不写入 secret" : "Check only, no secret write"}</strong>
              </div>
              <div className="audit-signing-key-rotation-apply-checks">
                <label>
                  <input
                    checked={rotationApplyConfirmations.newSecretMaterialStored}
                    onChange={(event) => onApplyConfirmationChange("newSecretMaterialStored", event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "新 secret 已在本地安全保存" : "New secret stored locally"}</span>
                </label>
                <label>
                  <input
                    checked={rotationApplyConfirmations.legacySecretStored}
                    onChange={(event) => onApplyConfirmationChange("legacySecretStored", event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "当前 secret 已写入 legacy 注册表" : "Current secret stored in legacy registry"}</span>
                </label>
                <label>
                  <input
                    checked={rotationApplyConfirmations.operatorReviewedPlan}
                    onChange={(event) => onApplyConfirmationChange("operatorReviewedPlan", event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "已人工复核 key、指纹和重启影响" : "Operator reviewed key, fingerprint, restart impact"}</span>
                </label>
              </div>
              <button className="compact-action" disabled={isApplyingRotation} onClick={onApplyRotation} type="button">
                {isApplyingRotation ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                {i18n.locale === "zh-CN" ? "提交应用预检" : "Run apply preflight"}
              </button>
              {rotationApply ? (
                <div className={`audit-signing-key-rotation-apply-result ${rotationApply.status}`}>
                  <span>{auditSigningKeyRotationApplyStatusLabel(i18n, rotationApply.status)}</span>
                  <strong>{rotationApply.proposedActiveKeyId || "n/a"}</strong>
                  <small>
                    {rotationApply.blockedReasons.length
                      ? rotationApply.blockedReasons.map((reason) => auditSigningKeyRotationApplyReasonLabel(i18n, reason)).join(" / ")
                      : i18n.locale === "zh-CN"
                        ? "可进入本地重启流程"
                        : "Ready for local restart"}
                  </small>
                  <em>
                    {i18n.locale === "zh-CN"
                      ? `${rotationApply.secretPlaceholderNames.length} 个本地 secret 项`
                      : `${rotationApply.secretPlaceholderNames.length} local secret items`}
                  </em>
                </div>
              ) : null}
              {rotationApply?.status === "ready_for_restart" || restartEvidence ? (
                <div className="audit-signing-key-restart-evidence">
                  <div className="audit-signing-key-rotation-apply-head">
                    <span>{i18n.locale === "zh-CN" ? "受控重启证据" : "Controlled restart evidence"}</span>
                    <strong>
                      {i18n.locale === "zh-CN"
                        ? "记录证据，仍不放行 live"
                        : "Record evidence, live remains blocked"}
                    </strong>
                  </div>
                  <div className="audit-signing-key-rotation-apply-checks">
                    <label>
                      <input
                        checked={restartEvidenceConfirmations.restartWindowExecuted}
                        onChange={(event) =>
                          onRestartEvidenceConfirmationChange("restartWindowExecuted", event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? "受控重启窗口已执行" : "Restart window executed"}</span>
                    </label>
                    <label>
                      <input
                        checked={restartEvidenceConfirmations.rollbackPlanConfirmed}
                        onChange={(event) =>
                          onRestartEvidenceConfirmationChange("rollbackPlanConfirmed", event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? "回滚计划已确认" : "Rollback plan confirmed"}</span>
                    </label>
                    <label>
                      <input
                        checked={restartEvidenceConfirmations.postRestartValidationPassed}
                        onChange={(event) =>
                          onRestartEvidenceConfirmationChange("postRestartValidationPassed", event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? "重启后验收已通过" : "Post-restart validation passed"}</span>
                    </label>
                    <label>
                      <input
                        checked={restartEvidenceConfirmations.operatorReviewedRestartLogs}
                        onChange={(event) =>
                          onRestartEvidenceConfirmationChange("operatorReviewedRestartLogs", event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? "操作员已复核重启日志" : "Operator reviewed restart logs"}</span>
                    </label>
                  </div>
                  <button
                    className="compact-action"
                    disabled={isRecordingRestartEvidence || !restartEvidenceApplyEventId}
                    onClick={onRecordRestartEvidence}
                    type="button"
                  >
                    {isRecordingRestartEvidence ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                    {i18n.locale === "zh-CN" ? "记录重启证据" : "Record restart evidence"}
                  </button>
                  {restartEvidence ? (
                    <div className={`audit-signing-key-rotation-apply-result ${restartEvidence.status}`}>
                      <span>{auditSigningKeyRestartEvidenceStatusLabel(i18n, restartEvidence.status)}</span>
                      <strong>{restartEvidence.proposedActiveKeyId || "n/a"}</strong>
                      <small>
                        {restartEvidence.blockedReasons.length
                          ? restartEvidence.blockedReasons
                              .map((reason) => auditSigningKeyRestartEvidenceReasonLabel(i18n, reason))
                              .join(" / ")
                          : i18n.locale === "zh-CN"
                            ? "证据已入账，实盘仍保持阻断"
                            : "Evidence recorded; live remains blocked"}
                      </small>
                      <em>{restartEvidence.liveTradingAllowed ? "live=true" : "live=false / paper-only"}</em>
                    </div>
                  ) : null}
                  {restartEvidenceError ? <p className="audit-signing-key-error">{restartEvidenceError}</p> : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        {rotationApplyError ? <p className="audit-signing-key-error">{rotationApplyError}</p> : null}
        {rotationError ? <p className="audit-signing-key-error">{rotationError}</p> : null}
        {error ? <p className="audit-signing-key-error">{error}</p> : null}
      </div>
    </Panel>
  );
}
