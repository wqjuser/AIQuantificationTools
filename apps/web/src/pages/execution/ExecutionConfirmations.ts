export interface AuditSigningKeyRotationApplyConfirmations {
  legacySecretStored: boolean;
  newSecretMaterialStored: boolean;
  operatorReviewedPlan: boolean;
}

export const initialAuditSigningKeyRotationApplyConfirmations: AuditSigningKeyRotationApplyConfirmations = {
  legacySecretStored: false,
  newSecretMaterialStored: false,
  operatorReviewedPlan: false
};

export interface AuditSigningKeyRestartEvidenceConfirmations {
  restartWindowExecuted: boolean;
  rollbackPlanConfirmed: boolean;
  postRestartValidationPassed: boolean;
  operatorReviewedRestartLogs: boolean;
}

export const initialAuditSigningKeyRestartEvidenceConfirmations: AuditSigningKeyRestartEvidenceConfirmations = {
  restartWindowExecuted: false,
  rollbackPlanConfirmed: false,
  postRestartValidationPassed: false,
  operatorReviewedRestartLogs: false
};

export interface AuditSigningKeySecretMaterializationConfirmations {
  localSecretStoreWriteVerified: boolean;
  noRawSecretInPayload: boolean;
  envBindingPlanDocumented: boolean;
  rollbackPlanDocumented: boolean;
}

export const initialAuditSigningKeySecretMaterializationConfirmations: AuditSigningKeySecretMaterializationConfirmations = {
  localSecretStoreWriteVerified: false,
  noRawSecretInPayload: false,
  envBindingPlanDocumented: false,
  rollbackPlanDocumented: false
};

export interface AuditSigningKeyEnvironmentBindingConfirmations {
  runtimeEnvMappingVerified: boolean;
  configReloadPlanDocumented: boolean;
  noRawSecretInPayload: boolean;
  rollbackSnapshotRecorded: boolean;
}

export const initialAuditSigningKeyEnvironmentBindingConfirmations: AuditSigningKeyEnvironmentBindingConfirmations = {
  runtimeEnvMappingVerified: false,
  configReloadPlanDocumented: false,
  noRawSecretInPayload: false,
  rollbackSnapshotRecorded: false
};

export interface AuditSigningKeyRuntimeReloadPlanConfirmations {
  maintenanceWindowApproved: boolean;
  healthBaselineCaptured: boolean;
  configDiffReviewed: boolean;
  postReloadSmokePlanDocumented: boolean;
  rollbackOwnerAssigned: boolean;
}

export const initialAuditSigningKeyRuntimeReloadPlanConfirmations: AuditSigningKeyRuntimeReloadPlanConfirmations = {
  maintenanceWindowApproved: false,
  healthBaselineCaptured: false,
  configDiffReviewed: false,
  postReloadSmokePlanDocumented: false,
  rollbackOwnerAssigned: false
};

export interface AuditSigningKeyRuntimeReloadExecutionConfirmations {
  preReloadHealthVerified: boolean;
  reloadActionRecorded: boolean;
  postReloadSmokePassed: boolean;
  rollbackReadinessConfirmed: boolean;
  operatorConfirmedLiveBlocked: boolean;
}

export const initialAuditSigningKeyRuntimeReloadExecutionConfirmations: AuditSigningKeyRuntimeReloadExecutionConfirmations = {
  preReloadHealthVerified: false,
  reloadActionRecorded: false,
  postReloadSmokePassed: false,
  rollbackReadinessConfirmed: false,
  operatorConfirmedLiveBlocked: false
};

export interface AuditSigningKeyRotationAcceptanceConfirmations {
  executionEvidenceReviewed: boolean;
  signatureProbeVerified: boolean;
  legacyVerificationConfirmed: boolean;
  rollbackWindowStillOpen: boolean;
  operatorConfirmedActivationBlocked: boolean;
}

export const initialAuditSigningKeyRotationAcceptanceConfirmations: AuditSigningKeyRotationAcceptanceConfirmations = {
  executionEvidenceReviewed: false,
  signatureProbeVerified: false,
  legacyVerificationConfirmed: false,
  rollbackWindowStillOpen: false,
  operatorConfirmedActivationBlocked: false
};

export interface ExecutionAdapterRuntimeReloadAcceptanceConfirmations {
  executionEvidenceReviewed: boolean;
  postReloadHealthVerified: boolean;
  adapterHandshakeVerified: boolean;
  killSwitchStillEnabled: boolean;
  operatorConfirmedLiveBlocked: boolean;
}

export const createDefaultExecutionAdapterRuntimeReloadAcceptanceConfirmations =
  (): ExecutionAdapterRuntimeReloadAcceptanceConfirmations => ({
    executionEvidenceReviewed: false,
    postReloadHealthVerified: false,
    adapterHandshakeVerified: false,
    killSwitchStillEnabled: false,
    operatorConfirmedLiveBlocked: false
  });

export const executionAdapterRuntimeReloadAcceptanceConfirmationRows: Array<{
  key: keyof ExecutionAdapterRuntimeReloadAcceptanceConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "executionEvidenceReviewed",
    labelEn: "Execution evidence reviewed",
    labelZh: "执行证据已复核"
  },
  {
    key: "postReloadHealthVerified",
    labelEn: "Post-reload health verified",
    labelZh: "重载后健康已验证"
  },
  {
    key: "adapterHandshakeVerified",
    labelEn: "Adapter handshake verified",
    labelZh: "适配器握手已验证"
  },
  {
    key: "killSwitchStillEnabled",
    labelEn: "Kill switch still enabled",
    labelZh: "急停仍启用"
  },
  {
    key: "operatorConfirmedLiveBlocked",
    labelEn: "Operator confirmed live remains blocked",
    labelZh: "操作员确认实盘仍阻断"
  }
];

export interface ExecutionAdapterOrchestrationDryRunConfirmations {
  acceptedChainReviewed: boolean;
  sandboxHandshakeDryRunPassed: boolean;
  orderSchemaDryRunPassed: boolean;
  accountSyncDryRunPassed: boolean;
  operatorConfirmedNoLiveOrders: boolean;
}

export const createDefaultExecutionAdapterOrchestrationDryRunConfirmations =
  (): ExecutionAdapterOrchestrationDryRunConfirmations => ({
    acceptedChainReviewed: false,
    sandboxHandshakeDryRunPassed: false,
    orderSchemaDryRunPassed: false,
    accountSyncDryRunPassed: false,
    operatorConfirmedNoLiveOrders: false
  });

export const executionAdapterOrchestrationDryRunConfirmationRows: Array<{
  key: keyof ExecutionAdapterOrchestrationDryRunConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "acceptedChainReviewed",
    labelEn: "Acceptance chain reviewed",
    labelZh: "验收链已复核"
  },
  {
    key: "sandboxHandshakeDryRunPassed",
    labelEn: "Sandbox or paper handshake dry-run passed",
    labelZh: "沙盒/模拟握手 dry-run 已通过"
  },
  {
    key: "orderSchemaDryRunPassed",
    labelEn: "Order schema dry-run passed",
    labelZh: "订单 schema dry-run 已通过"
  },
  {
    key: "accountSyncDryRunPassed",
    labelEn: "Account sync dry-run passed",
    labelZh: "账户同步 dry-run 已通过"
  },
  {
    key: "operatorConfirmedNoLiveOrders",
    labelEn: "Operator confirmed no live orders were routed",
    labelZh: "操作员确认未路由实盘订单"
  }
];

export interface ExecutionAdapterOrchestrationExecutionConfirmations {
  dryRunEvidenceReviewed: boolean;
  sandboxRouteLocked: boolean;
  killSwitchArmed: boolean;
  idempotencyKeyRecorded: boolean;
  operatorConfirmedNoCapital: boolean;
}

export const createDefaultExecutionAdapterOrchestrationExecutionConfirmations =
  (): ExecutionAdapterOrchestrationExecutionConfirmations => ({
    dryRunEvidenceReviewed: false,
    sandboxRouteLocked: false,
    killSwitchArmed: false,
    idempotencyKeyRecorded: false,
    operatorConfirmedNoCapital: false
  });

export const executionAdapterOrchestrationExecutionConfirmationRows: Array<{
  key: keyof ExecutionAdapterOrchestrationExecutionConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "dryRunEvidenceReviewed",
    labelEn: "Dry-run evidence reviewed",
    labelZh: "Dry-run 证据已复核"
  },
  {
    key: "sandboxRouteLocked",
    labelEn: "Sandbox route locked",
    labelZh: "沙盒/模拟路由已锁定"
  },
  {
    key: "killSwitchArmed",
    labelEn: "Kill switch armed",
    labelZh: "急停已武装"
  },
  {
    key: "idempotencyKeyRecorded",
    labelEn: "Idempotency key recorded",
    labelZh: "幂等键已记录"
  },
  {
    key: "operatorConfirmedNoCapital",
    labelEn: "Operator confirmed no capital can route",
    labelZh: "操作员确认无真实资金路由"
  }
];

export interface ExecutionAdapterHumanConfirmationConfirmations {
  orchestrationExecutionReviewed: boolean;
  riskApprovalStillValid: boolean;
  paperExecutionReviewed: boolean;
  killSwitchReady: boolean;
  operatorConfirmedFinalBoundary: boolean;
}

export const createDefaultExecutionAdapterHumanConfirmationConfirmations =
  (): ExecutionAdapterHumanConfirmationConfirmations => ({
    orchestrationExecutionReviewed: false,
    riskApprovalStillValid: false,
    paperExecutionReviewed: false,
    killSwitchReady: false,
    operatorConfirmedFinalBoundary: false
  });

export const executionAdapterHumanConfirmationConfirmationRows: Array<{
  key: keyof ExecutionAdapterHumanConfirmationConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "orchestrationExecutionReviewed",
    labelEn: "Orchestration execution reviewed",
    labelZh: "编排执行证据已复核"
  },
  {
    key: "riskApprovalStillValid",
    labelEn: "Risk approval still valid",
    labelZh: "风控审批仍有效"
  },
  {
    key: "paperExecutionReviewed",
    labelEn: "Paper execution reviewed",
    labelZh: "模拟执行已复核"
  },
  {
    key: "killSwitchReady",
    labelEn: "Kill switch ready",
    labelZh: "急停已就绪"
  },
  {
    key: "operatorConfirmedFinalBoundary",
    labelEn: "Operator confirmed paper-only boundary",
    labelZh: "操作员确认仍仅记录模拟边界"
  }
];

export interface ExecutionAdapterSandboxProbePlanConfirmations {
  humanConfirmationReviewed: boolean;
  testnetEndpointLocked: boolean;
  credentialsAreSandboxOnly: boolean;
  orderRoutingDisabled: boolean;
  probeLimitsDocumented: boolean;
}

export const createDefaultExecutionAdapterSandboxProbePlanConfirmations =
  (): ExecutionAdapterSandboxProbePlanConfirmations => ({
    humanConfirmationReviewed: false,
    testnetEndpointLocked: false,
    credentialsAreSandboxOnly: false,
    orderRoutingDisabled: false,
    probeLimitsDocumented: false
  });

export const executionAdapterSandboxProbePlanConfirmationRows: Array<{
  key: keyof ExecutionAdapterSandboxProbePlanConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "humanConfirmationReviewed",
    labelEn: "Final human confirmation reviewed",
    labelZh: "最终人工确认已复核"
  },
  {
    key: "testnetEndpointLocked",
    labelEn: "Sandbox/testnet endpoint locked",
    labelZh: "沙盒/testnet 端点已锁定"
  },
  {
    key: "credentialsAreSandboxOnly",
    labelEn: "Credentials are sandbox-only",
    labelZh: "凭据仅限沙盒/testnet"
  },
  {
    key: "orderRoutingDisabled",
    labelEn: "Order routing disabled",
    labelZh: "订单路由仍保持禁用"
  },
  {
    key: "probeLimitsDocumented",
    labelEn: "Probe limits documented",
    labelZh: "探针限制和回滚责任已记录"
  }
];

export interface ExecutionAdapterSandboxProbeExecutionConfirmations {
  probePlanReviewed: boolean;
  readonlyHandshakeCaptured: boolean;
  accountSnapshotRedacted: boolean;
  orderSchemaValidated: boolean;
  operatorConfirmedNoOrdersSubmitted: boolean;
}

export const createDefaultExecutionAdapterSandboxProbeExecutionConfirmations =
  (): ExecutionAdapterSandboxProbeExecutionConfirmations => ({
    probePlanReviewed: false,
    readonlyHandshakeCaptured: false,
    accountSnapshotRedacted: false,
    orderSchemaValidated: false,
    operatorConfirmedNoOrdersSubmitted: false
  });

export const executionAdapterSandboxProbeExecutionConfirmationRows: Array<{
  key: keyof ExecutionAdapterSandboxProbeExecutionConfirmations;
  labelEn: string;
  labelZh: string;
  authoritative?: boolean;
}> = [
  {
    key: "probePlanReviewed",
    labelEn: "Probe plan reviewed",
    labelZh: "探针计划已复核"
  },
  {
    key: "readonlyHandshakeCaptured",
    labelEn: "Read-only handshake captured",
    labelZh: "只读握手证据已记录",
    authoritative: true
  },
  {
    key: "accountSnapshotRedacted",
    labelEn: "Account snapshot redacted",
    labelZh: "账户快照已脱敏",
    authoritative: true
  },
  {
    key: "orderSchemaValidated",
    labelEn: "Order schema validated",
    labelZh: "订单 schema 已验证"
  },
  {
    key: "operatorConfirmedNoOrdersSubmitted",
    labelEn: "Operator confirmed no orders submitted",
    labelZh: "操作员确认未提交任何订单"
  }
];

export interface ExecutionAdapterSandboxProbeReviewConfirmations {
  probeExecutionReviewed: boolean;
  readonlyEvidenceMatchesPlan: boolean;
  redactedSnapshotArchived: boolean;
  orderSchemaRiskReviewed: boolean;
  productionRouteStillBlocked: boolean;
}

export const createDefaultExecutionAdapterSandboxProbeReviewConfirmations =
  (): ExecutionAdapterSandboxProbeReviewConfirmations => ({
    probeExecutionReviewed: false,
    readonlyEvidenceMatchesPlan: false,
    redactedSnapshotArchived: false,
    orderSchemaRiskReviewed: false,
    productionRouteStillBlocked: false
  });

export const executionAdapterSandboxProbeReviewConfirmationRows: Array<{
  key: keyof ExecutionAdapterSandboxProbeReviewConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "probeExecutionReviewed",
    labelEn: "Probe execution evidence reviewed",
    labelZh: "探针执行证据已复核"
  },
  {
    key: "readonlyEvidenceMatchesPlan",
    labelEn: "Read-only evidence matches plan",
    labelZh: "只读证据与计划一致"
  },
  {
    key: "redactedSnapshotArchived",
    labelEn: "Redacted snapshots archived",
    labelZh: "脱敏快照已归档"
  },
  {
    key: "orderSchemaRiskReviewed",
    labelEn: "Order schema risk reviewed",
    labelZh: "订单 schema 风险已复核"
  },
  {
    key: "productionRouteStillBlocked",
    labelEn: "Production route still blocked",
    labelZh: "生产路由仍保持阻断"
  }
];

export interface ExecutionAdapterProductionRouteReviewConfirmations {
  sandboxProbeReviewAccepted: boolean;
  killSwitchPolicyReviewed: boolean;
  orderRoutingDisabledVerified: boolean;
  positionLimitPolicyReviewed: boolean;
  rollbackOwnerRecorded: boolean;
}

export const createDefaultExecutionAdapterProductionRouteReviewConfirmations =
  (): ExecutionAdapterProductionRouteReviewConfirmations => ({
    sandboxProbeReviewAccepted: false,
    killSwitchPolicyReviewed: false,
    orderRoutingDisabledVerified: false,
    positionLimitPolicyReviewed: false,
    rollbackOwnerRecorded: false
  });

export const executionAdapterProductionRouteReviewConfirmationRows: Array<{
  key: keyof ExecutionAdapterProductionRouteReviewConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "sandboxProbeReviewAccepted",
    labelEn: "Sandbox review accepted",
    labelZh: "sandbox 复核已采纳"
  },
  {
    key: "killSwitchPolicyReviewed",
    labelEn: "Kill-switch policy reviewed",
    labelZh: "急停策略已复核"
  },
  {
    key: "orderRoutingDisabledVerified",
    labelEn: "Order routing still disabled",
    labelZh: "订单路由仍禁用"
  },
  {
    key: "positionLimitPolicyReviewed",
    labelEn: "Position limits reviewed",
    labelZh: "仓位限额已复核"
  },
  {
    key: "rollbackOwnerRecorded",
    labelEn: "Rollback owner recorded",
    labelZh: "回滚责任人已记录"
  }
];

export interface ExecutionAdapterOpsStateConfirmations {
  paperRouteRunbookAccepted: boolean;
  monitoringChannelReady: boolean;
  killSwitchDrillRecorded: boolean;
  paperAccountReconciled: boolean;
  operatorConfirmedLiveTradingDisabled: boolean;
}

export const createDefaultExecutionAdapterOpsStateConfirmations = (): ExecutionAdapterOpsStateConfirmations => ({
  paperRouteRunbookAccepted: false,
  monitoringChannelReady: false,
  killSwitchDrillRecorded: false,
  paperAccountReconciled: false,
  operatorConfirmedLiveTradingDisabled: false
});

export const executionAdapterOpsStateConfirmationRows: Array<{
  key: keyof ExecutionAdapterOpsStateConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "paperRouteRunbookAccepted",
    labelEn: "Paper route runbook accepted",
    labelZh: "Paper 路由 runbook 已采纳"
  },
  {
    key: "monitoringChannelReady",
    labelEn: "Monitoring channel ready",
    labelZh: "监控通道已就绪"
  },
  {
    key: "killSwitchDrillRecorded",
    labelEn: "Kill-switch drill recorded",
    labelZh: "急停演练已记录"
  },
  {
    key: "paperAccountReconciled",
    labelEn: "Paper account reconciled",
    labelZh: "Paper 账户已对账"
  },
  {
    key: "operatorConfirmedLiveTradingDisabled",
    labelEn: "Operator confirmed live trading disabled",
    labelZh: "操作员确认实盘交易关闭"
  }
];

export interface ExecutionAdapterPaperExecutionConfirmations {
  opsStateAccepted: boolean;
  paperAccountSynced: boolean;
  riskBudgetBound: boolean;
  simulatedFillGenerated: boolean;
  operatorConfirmedNoLiveRouting: boolean;
}

export const createDefaultExecutionAdapterPaperExecutionConfirmations =
  (): ExecutionAdapterPaperExecutionConfirmations => ({
    opsStateAccepted: false,
    paperAccountSynced: false,
    riskBudgetBound: false,
    simulatedFillGenerated: false,
    operatorConfirmedNoLiveRouting: false
  });

export const executionAdapterPaperExecutionConfirmationRows: Array<{
  key: keyof ExecutionAdapterPaperExecutionConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "opsStateAccepted",
    labelEn: "Ops state accepted",
    labelZh: "Ops state 已采纳"
  },
  {
    key: "paperAccountSynced",
    labelEn: "Paper account synced",
    labelZh: "Paper 账户已同步"
  },
  {
    key: "riskBudgetBound",
    labelEn: "Risk budget bound",
    labelZh: "风险预算已绑定"
  },
  {
    key: "simulatedFillGenerated",
    labelEn: "Simulated fill generated",
    labelZh: "模拟成交已生成"
  },
  {
    key: "operatorConfirmedNoLiveRouting",
    labelEn: "No live route touched",
    labelZh: "确认未触碰实盘路由"
  }
];
