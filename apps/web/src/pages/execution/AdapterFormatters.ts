import type { AppI18n } from "../../lib/i18n";
import type { BrokerAdapterRow, ExecutionAdapterLedgerRow } from "../../lib/terminal-workbench";

export function brokerAdapterName(i18n: AppI18n, row: BrokerAdapterRow): string {
  if (i18n.locale === "en-US") {
    return row.adapter;
  }
  return (
    {
      "paper-local": "本地模拟交易",
      "ashare-live": "A 股券商接口",
      "us-live": "IBKR / Alpaca 适配器形态",
      "crypto-live": "ccxt 交易所适配器形态"
    }[row.id] ?? row.adapter
  );
}

export function brokerRouteLabel(i18n: AppI18n, route: BrokerAdapterRow["route"]): string {
  if (i18n.locale === "en-US") {
    return route;
  }
  return { paper: "模拟", live: "实盘" }[route];
}

export function brokerStatusLabel(i18n: AppI18n, status: BrokerAdapterRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status.replaceAll("_", " ");
  }
  return {
    paper_ready: "模拟可用",
    interface_only: "仅接口",
    config_required: "需配置",
    blocked: "已阻断"
  }[status];
}

export function brokerCertificationLabel(i18n: AppI18n, certification: string): string {
  if (i18n.locale === "en-US") {
    return certification;
  }
  return certification
    .replace("Simulated fills, order log, and risk checks are available locally.", "本地已具备模拟成交、委托日志和风控检查。")
    .replace("No certified A-share broker API is connected.", "尚未连接已认证 A 股券商 API。")
    .replace("Adapter shape is reserved; paper credentials are not configured.", "已预留适配器形态；尚未配置模拟账户凭据。")
    .replace("Exchange adapter shape is reserved; API keys are not configured.", "已预留交易所适配器形态；尚未配置 API 密钥。");
}

export function brokerNextStepLabel(i18n: AppI18n, nextStep: string): string {
  if (i18n.locale === "en-US") {
    return nextStep;
  }
  return nextStep
    .replace("Use paper execution for research runs before certifying live adapters.", "实盘适配器认证前，研究运行统一走模拟执行。")
    .replace("Keep live trading blocked until a legal broker adapter passes certification.", "合法券商适配器通过认证前，继续阻断实盘交易。")
    .replace(
      "Configure a paper account and certify submit, cancel, fill, reject, and reconnect paths.",
      "先配置模拟账户，并认证下单、撤单、成交、拒单和重连路径。"
    )
    .replace(
      "Start with sandbox or testnet routes plus max order and emergency-stop limits.",
      "先使用沙箱或测试网，并配置最大订单和紧急停止限制。"
    );
}

export function adapterLedgerLabel(i18n: AppI18n, row: ExecutionAdapterLedgerRow): string {
  const label =
    i18n.locale === "zh-CN"
      ? {
          paper_ready: "模拟适配器可用",
          live_ready: "实盘通道就绪",
          live_blocked: "实盘通道阻断",
          blocked: "通道阻断",
          config_required: "需要配置"
        }[row.state] ?? row.label
      : row.label;
  return `${row.market === "multi" ? (i18n.locale === "zh-CN" ? "多市场" : "Multi-market") : i18n.marketLabel(row.market)} · ${label}`;
}

export function adapterLedgerAdapterName(i18n: AppI18n, row: ExecutionAdapterLedgerRow): string {
  if (i18n.locale === "en-US") {
    return row.adapter;
  }
  return (
    {
      "paper-local": "本地模拟交易",
      "ashare-live": "A 股券商接口",
      "us-live": "IBKR / Alpaca 适配器形态",
      "crypto-live": "ccxt 交易所适配器形态"
    }[row.adapterId] ?? row.adapter
  );
}

export function adapterLedgerGateSummary(i18n: AppI18n, gateSummary: string): string {
  return i18n.locale === "zh-CN" ? gateSummary.replace("gates", "个闸门") : gateSummary;
}

export function adapterLedgerReason(i18n: AppI18n, row: ExecutionAdapterLedgerRow): string {
  if (i18n.locale === "en-US") {
    return row.reason;
  }
  return row.reason
    .replace("Paper execution is available locally after audited run and risk checks.", "审计运行和风控检查通过后，本地模拟执行可用。")
    .replace("Paper execution is available locally.", "本地模拟执行可用。")
    .replace("Paper execution is available locally after audited run and risk handoff checks.", "审计运行和风险交接检查通过后，本地模拟执行可用。")
    .replace("Local paper execution is available after audited run and risk handoff checks.", "审计运行和风险交接检查通过后，本地模拟执行可用。")
    .replace("Real A-share trading stays blocked until a legal broker adapter is certified.", "合法券商适配器认证前，A 股实盘交易保持阻断。")
    .replace("US live adapters require sandbox credentials, order lifecycle tests, and manual confirmation.", "美股实盘适配器需要沙箱凭证、订单生命周期测试和人工确认。")
    .replace("Exchange trading keys are not read by this status endpoint and live routing remains blocked.", "该状态接口不读取交易密钥；实盘路由保持阻断。")
    .replace("Live execution remains blocked until adapter certification, risk approval, and human confirmation pass.", "适配器认证、风控审批和人工确认全部通过前，实盘执行保持阻断。");
}

export function adapterLedgerNextStep(i18n: AppI18n, row: ExecutionAdapterLedgerRow): string {
  if (i18n.locale === "en-US") {
    return row.nextStep;
  }
  return row.nextStep
    .replace("Use paper execution for audited research runs before certifying live adapters.", "认证实盘适配器前，审计研究运行统一使用模拟执行。")
    .replace("Real A-share trading stays blocked until a legal broker adapter is certified.", "合法券商适配器认证前，继续阻断 A 股实盘交易。")
    .replace("Configure sandbox credentials, order lifecycle tests, and emergency-stop limits before certification.", "认证前先配置沙箱凭证、订单生命周期测试和紧急停止限制。")
    .replace("Keep human confirmation and risk approval gates attached to every promoted order.", "每笔晋级订单都必须绑定人工确认和风控审批闸门。")
    .replace("Keep live trading blocked until a legal adapter certification passes.", "合法适配器认证通过前，继续阻断实盘交易。");
}

export function adapterCertificationAdapterName(i18n: AppI18n, adapterId: string): string {
  if (i18n.locale === "en-US") {
    return adapterId;
  }
  return (
    {
      "ashare-live": "A 股券商接口",
      "crypto-live": "加密交易所接口",
      "paper-local": "本地模拟盘",
      "us-live": "美股实盘接口"
    }[adapterId] ?? adapterId
  );
}

export function adapterCertificationStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      Failed: "失败",
      Passed: "通过",
      Review: "待复核"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterCertificationApplyStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Ready for restart": "待受控重启"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterControlledRestartEvidenceStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Evidence recorded": "证据已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterRestartAcceptanceStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Acceptance recorded": "验收已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterSecretReferenceStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Reference recorded": "引用已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterSecretMaterializationStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Manifest recorded": "物化清单已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterSecretManifestValidationStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      Validated: "清单已验证"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterEnvironmentBindingStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Binding recorded": "绑定已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterRuntimeReloadPlanStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Plan recorded": "计划已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterRuntimeReloadExecutionStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Execution recorded": "执行证据已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterRuntimeReloadAcceptanceStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Acceptance recorded": "最终验收已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterOrchestrationDryRunStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Dry run recorded": "Dry-run 已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterOrchestrationExecutionStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Execution recorded": "执行证据已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterHumanConfirmationStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Confirmation recorded": "最终确认已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterCertificationBoundaryLabel(i18n: AppI18n, boundary: string): string {
  if (i18n.locale === "en-US") {
    return boundary;
  }
  return boundary
    .replace("Paper only · live trading blocked", "仅记录模拟/沙盒证据，实盘交易保持阻断")
    .replace("Live trading allowed", "实盘交易已允许")
    .replace("Live trading blocked", "实盘交易保持阻断");
}

export function adapterCertificationCheckSummary(i18n: AppI18n, checkSummary: string): string {
  if (i18n.locale === "en-US") {
    return checkSummary;
  }
  return checkSummary
    .replace("passed", "通过")
    .replace("blocked", "阻断")
    .replace("failed", "失败")
    .replace("review", "复核")
    .replace("checks", "项检查");
}

export function adapterCertificationApplyConfirmationSummary(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary.replace("confirmed", "已确认").replace("missing", "缺失");
}

export function adapterControlledRestartEvidenceConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterRestartAcceptanceConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterSecretReferenceConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterSecretMaterializationConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterSecretManifestValidationCoverageSummary(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary.replace("env vars covered", "个环境变量已覆盖").replace("No env vars", "无环境变量");
}

export function adapterEnvironmentBindingConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterRuntimeReloadPlanConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterRuntimeReloadExecutionConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterRuntimeReloadAcceptanceConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterOrchestrationDryRunConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterOrchestrationExecutionConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterHumanConfirmationConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterSandboxProbePlanConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterSandboxProbeExecutionConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterSandboxProbeReviewConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterProductionRouteReviewConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterSandboxOrderSchemaDryRunConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterPaperOrderLifecycleConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterPaperRouteRunbookConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterOpsStateConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterPaperExecutionConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

export function adapterSandboxProbePlanStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Probe plan recorded": "探针计划已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterSandboxProbeExecutionStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Probe execution recorded": "探针执行已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterSandboxProbeReviewStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Probe review recorded": "探针复核已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterProductionRouteReviewStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Route review recorded": "路由复核已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterSandboxOrderSchemaDryRunStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Schema dry-run recorded": "Schema dry-run 已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterPaperOrderLifecycleStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Lifecycle recorded": "Lifecycle 已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterPaperRouteRunbookStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Runbook recorded": "Runbook 已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterOpsStateStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Ops state recorded": "Ops state 已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterPaperExecutionStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Paper execution recorded": "模拟执行已记录"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterHealthProbeStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Ready: "可用",
      "Review required": "待复核",
      Blocked: "阻断"
    }[statusLabel] ?? statusLabel
  );
}

export function adapterHealthProbeCredentialSummaryLabel(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary
    .replace("API key missing", "API 密钥未配置")
    .replace("secret missing", "密钥未配置")
    .replace("API key", "API 密钥")
    .replace("secret", "密钥");
}

export function adapterHealthProbeRouteReviewSummaryLabel(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary
    .replace("No production route review bound", "未绑定生产路由复核")
    .replace("Route review", "生产路由复核")
    .replace("env vars", "个环境变量");
}

export function adapterHealthProbeCheckSummaryLabel(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary.replace("passed", "通过").replace("review", "复核").replace("blocked", "阻断");
}

export function adapterHealthProbeBoundaryLabel(i18n: AppI18n, boundary: string): string {
  if (i18n.locale === "en-US") {
    return boundary;
  }
  return boundary.replace("Paper only", "仅模拟盘").replace("order routing disabled", "订单路由关闭");
}

export function adapterSandboxOrderSchemaDryRunBoundaryLabel(i18n: AppI18n, boundary: string): string {
  if (i18n.locale === "en-US") {
    return boundary;
  }
  return boundary
    .replace("Order submission detected", "检测到订单提交")
    .replace("No order submitted", "未提交订单")
    .replace("paper only", "仅模拟盘")
    .replace("live trading blocked", "实盘交易阻断")
    .replace("Live trading allowed", "实盘交易已允许")
    .replace("blocked", "阻断");
}

export function adapterPaperOrderLifecycleBoundaryLabel(i18n: AppI18n, boundary: string): string {
  if (i18n.locale === "en-US") {
    return boundary;
  }
  return boundary
    .replace("Live order submission detected", "检测到实盘订单提交")
    .replace("Paper lifecycle recorded", "Paper 生命周期已记录")
    .replace("no live order submitted", "未提交实盘订单")
    .replace("No live order submitted", "未提交实盘订单")
    .replace("live trading blocked", "实盘交易阻断")
    .replace("Live trading allowed", "实盘交易已允许")
    .replace("blocked", "阻断");
}

export function adapterPaperRouteRunbookBoundaryLabel(i18n: AppI18n, boundary: string): string {
  if (i18n.locale === "en-US") {
    return boundary;
  }
  return boundary
    .replace("Route execution detected", "检测到路由执行")
    .replace("Paper route runbook recorded", "Paper 路由 runbook 已记录")
    .replace("no route executed", "未执行路由")
    .replace("No route executed", "未执行路由")
    .replace("live trading blocked", "实盘交易阻断")
    .replace("Live trading allowed", "实盘交易已允许")
    .replace("blocked", "阻断");
}

export function adapterOpsStateBoundaryLabel(i18n: AppI18n, boundary: string): string {
  if (i18n.locale === "en-US") {
    return boundary;
  }
  return boundary
    .replace("Route execution detected", "检测到路由执行")
    .replace("Adapter ops state recorded", "适配器 ops state 已记录")
    .replace("no route executed", "未执行路由")
    .replace("No route executed", "未执行路由")
    .replace("live trading blocked", "实盘交易阻断")
    .replace("Live trading allowed", "实盘交易已允许")
    .replace("blocked", "阻断");
}

export function adapterPaperExecutionBoundaryLabel(i18n: AppI18n, boundary: string): string {
  if (i18n.locale === "en-US") {
    return boundary;
  }
  return boundary
    .replace("Route or order execution detected", "检测到路由或订单执行")
    .replace("Paper execution recorded", "模拟执行已记录")
    .replace("simulated fill only", "仅本地模拟成交")
    .replace("live route blocked", "实盘路由阻断")
    .replace("Simulated fill missing", "缺少模拟成交")
    .replace("Live trading allowed", "实盘交易已允许")
    .replace("blocked", "阻断");
}

export function adapterHealthProbeBlockerLabel(i18n: AppI18n, blockerSummary: string): string {
  if (i18n.locale === "en-US") {
    return blockerSummary;
  }
  return blockerSummary === "No blockers" ? "无阻断" : blockerSummary;
}

export function adapterHealthProbeCheckStatusLabel(i18n: AppI18n, status: string): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return (
    {
      passed: "通过",
      review: "复核",
      blocked: "阻断",
      skipped: "跳过"
    }[status] ?? status
  );
}

export function adapterCertificationApplyBlockerSummary(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary
    .replace("No blockers", "无阻断")
    .replace("1 blocker", "1 个阻断")
    .replace("blockers", "个阻断");
}

export function adapterCertificationApplyModeLabel(i18n: AppI18n, mode: string): string {
  if (i18n.locale === "en-US") {
    return mode.replaceAll("_", " ");
  }
  return (
    {
      manual_preflight: "人工预检",
      manual_secret_store: "密钥存储预检",
      manual_controlled_restart: "受控重启证据",
      manual_post_restart_acceptance: "重启后验收",
      local_runtime_env: "本地运行时环境绑定",
      manual_runtime_reload: "人工运行时重载",
      manual_controlled_reload: "人工受控重载执行",
      manual_runtime_reload_acceptance: "人工运行时重载最终验收",
      manual_adapter_orchestration_dry_run: "人工适配器编排 dry-run",
      manual_adapter_orchestration_execution: "人工适配器编排执行证据",
      manual_final_human_confirmation: "最终人工确认",
      manual_sandbox_probe_plan: "人工 sandbox 探针计划",
      manual_readonly_sandbox_probe: "人工只读 sandbox 探针",
      manual_sandbox_probe_review: "人工 sandbox 探针复核",
      manual_production_route_review: "人工生产路由复核"
    }[mode] ?? mode.replaceAll("_", " ")
  );
}

export function adapterCertificationApplyConfirmationLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return (
    {
      "Secret-store reference saved": "密钥引用已本地保存",
      "Controlled restart window approved": "受控重启窗口已批准",
      "Operator reviewed certification": "操作员已复核认证"
    }[label] ?? label
  );
}

export function adapterCertificationApplyConfirmationDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return (
    {
      "Confirm the real credential reference is stored outside this UI.": "确认真实凭证引用已保存在 UI 之外。",
      "Confirm an operator-approved restart window exists before applying.": "确认应用前已有操作员批准的重启窗口。",
      "Confirm the certification evidence and restart impact were reviewed.": "确认已复核认证证据和重启影响。"
    }[detail] ?? detail
  );
}
