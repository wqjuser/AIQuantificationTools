import type { AppI18n } from "../../lib/i18n";
import type {
  PortfolioPaperOrderApprovalRow,
  PortfolioPaperOrderLifecycleRow,
  PortfolioPaperOrderSimulationRouteRow,
  PortfolioPaperOrderStateHistoryRow,
} from "../../lib/terminal-workbench";

export function portfolioTradeReviewSideLabel(i18n: AppI18n, side: "buy" | "sell" | "hold"): string {
  if (side === "buy") {
    return i18n.t("portfolio.tradeSideBuy");
  }
  if (side === "sell") {
    return i18n.t("portfolio.tradeSideSell");
  }
  return i18n.t("portfolio.tradeSideHold");
}

export function portfolioOrderLifecycleStatusLabel(i18n: AppI18n, row: PortfolioPaperOrderLifecycleRow): string {
  if (!row.statusLabel) {
    return row.status === "ready"
      ? i18n.t("portfolio.paperOrderRecorded")
      : row.status === "blocked"
        ? i18n.t("portfolio.paperOrderRejected")
        : i18n.t("portfolio.paperOrderPendingReview");
  }
  return row.statusLabel
    .replace("review", i18n.t("portfolio.paperOrderPendingReview"))
    .replace("rejected", i18n.t("portfolio.paperOrderRejected"))
    .replace("skipped", i18n.t("portfolio.paperOrderSkipped"));
}

export function portfolioOrderExecutionStateLabel(i18n: AppI18n, row: PortfolioPaperOrderLifecycleRow): string {
  const label = row.executionStateLabel || (row.routableOrders > 0 ? `${row.routableOrders} ready for simulation` : "");
  if (!label) {
    return i18n.locale === "zh-CN" ? "无可路由委托" : "No routable orders";
  }
  if (i18n.locale !== "zh-CN") {
    return label;
  }
  return label
    .replace("ready for simulation", "可模拟路由")
    .replace("awaiting review", "待人工复核")
    .replace("risk review", "待风控复核")
    .replace("risk rejected", "风控拒绝")
    .replace("operator rejected", "人工拒绝")
    .replace("invalid", "无效委托")
    .replace("skipped", "已跳过");
}

export function portfolioOrderApprovalStateLabel(i18n: AppI18n, row: PortfolioPaperOrderApprovalRow): string {
  const labels: Record<PortfolioPaperOrderApprovalRow["state"], string> =
    i18n.locale === "zh-CN"
      ? {
          awaiting_operator_review: "待人工复核",
          ready_for_simulation: "可模拟路由",
          risk_rejected: "风控拒绝",
          operator_rejected: "人工拒绝",
          risk_review: "待风控复核",
          invalid_order: "无效委托",
          skipped: "已跳过"
        }
      : {
          awaiting_operator_review: "Awaiting review",
          ready_for_simulation: "Ready for simulation",
          risk_rejected: "Risk rejected",
          operator_rejected: "Operator rejected",
          risk_review: "Risk review",
          invalid_order: "Invalid order",
          skipped: "Skipped"
        };
  return labels[row.state];
}

export function portfolioOrderStateLabel(i18n: AppI18n, row: PortfolioPaperOrderStateHistoryRow): string {
  const labels: Record<string, string> =
    i18n.locale === "zh-CN"
      ? {
          created: "已创建",
          awaiting_operator_review: "待人工复核",
          operator_approved: "人工批准",
          operator_rejected: "人工拒绝",
          ready_for_simulation: "可模拟路由",
          simulation_filled: "模拟成交",
          simulation_recorded: "模拟记录",
          live_blocked: "实盘阻断",
          risk_rejected: "风控拒绝",
          risk_review: "待风控复核",
          invalid_order: "无效委托",
          skipped: "已跳过"
        }
      : {};
  return labels[row.state] ?? row.label;
}

export function portfolioOrderStateReason(i18n: AppI18n, row: PortfolioPaperOrderStateHistoryRow): string {
  if (i18n.locale === "en-US") {
    return row.reason;
  }
  return row.reason
    .replace("Live execution remains blocked; this timeline records paper-only simulation evidence.", "实盘仍被阻断；此时间线只记录 paper-only 模拟证据。")
    .replace("Paper-only simulation filled the approved portfolio order; live execution remains blocked.", "已对批准的组合委托完成 paper-only 模拟成交；实盘仍阻断。")
    .replace("Operator approved this paper-only portfolio order for simulation.", "人工批准该 paper-only 组合委托进入模拟成交。")
    .replace("Operator rejected this paper-only portfolio order before simulation.", "人工在模拟成交前拒绝该 paper-only 组合委托。");
}

export function portfolioSimulationRouteStatusLabel(i18n: AppI18n, row: PortfolioPaperOrderSimulationRouteRow): string {
  if (i18n.locale === "en-US") {
    return row.statusLabel;
  }
  return (
    {
      "Ready for simulator": "可进入模拟器",
      "Waiting for operator review": "等待人工复核",
      "Waiting for risk review": "等待风控复核",
      "Already simulated": "已模拟成交",
      "Risk blocked": "风控阻断",
      "Operator rejected": "人工拒绝",
      "Invalid order": "无效委托",
      Skipped: "已跳过"
    }[row.statusLabel] ?? row.statusLabel
  );
}

export function portfolioSimulationRouteDetail(i18n: AppI18n, row: PortfolioPaperOrderSimulationRouteRow): string {
  if (i18n.locale === "en-US") {
    return row.detail;
  }
  return row.detail
    .replace(
      "Approved paper-only order can use the local simulator; live broker route remains blocked.",
      "已批准的 paper-only 委托可进入本地模拟器；真实券商通道仍保持阻断。"
    )
    .replace(/^Filled by (.+); duplicate simulator route is blocked\.$/u, "已由 $1 成交；重复模拟路由已阻断。")
    .replace("Approval evidence is required before the local simulator can be used.", "需要审批证据后才能使用本地模拟器。")
    .replace("Hold or skipped orders are not routed to the simulator.", "持有或跳过委托不会进入模拟器。")
    .replace("Risk or operator state blocks the local simulator route.", "风控或人工状态阻断本地模拟器路由。")
    .replace(/^Risk blocked\.$/u, "风控阻断。")
    .replace(/^Awaiting operator\.$/u, "等待人工复核。")
    .replace(/^Ready\.$/u, "可进入模拟器。");
}

export function portfolioSimulationRouteAdapterEvidenceLabel(
  i18n: AppI18n,
  row: PortfolioPaperOrderSimulationRouteRow
): string {
  if (i18n.locale === "en-US") {
    return row.adapterPaperExecutionEvidenceLabel;
  }
  return row.adapterPaperExecutionEvidenceLabel
    .replace("Adapter paper execution", "适配器模拟执行")
    .replace("filled buy", "已模拟买入")
    .replace("filled sell", "已模拟卖出");
}

export function portfolioSimulationRouteStateLabel(i18n: AppI18n, row: PortfolioPaperOrderSimulationRouteRow): string {
  if (i18n.locale === "en-US") {
    return row.latestStateLabel;
  }
  return row.latestStateLabel
    .replace("Ready for simulation", "可模拟路由")
    .replace("Paper simulation filled", "模拟成交")
    .replace("No timeline event yet", "暂无状态流水")
    .replace("operator-a", "operator-a")
    .replace("operator-b", "operator-b");
}

export function portfolioPaperOrderApprovalHint(i18n: AppI18n, row: PortfolioPaperOrderApprovalRow): string {
  if (i18n.locale === "en-US") {
    return row.actionHint;
  }
  return row.actionHint
    .replace(/^Approved by (.+); ready for paper simulation\.$/u, "已由 $1 批准，可进入模拟撮合。")
    .replace(/^Operator rejected this paper-only order: /u, "人工拒绝该 paper-only 委托：")
    .replace(/^Risk rejected this paper-only order: /u, "风控拒绝该 paper-only 委托：")
    .replace("No paper order action is required for this row.", "该行无需生成模拟委托。")
    .replace(/^Invalid paper order: /u, "无效模拟委托：")
    .replace(
      "Risk review is still required before this approved order can be simulated.",
      "该委托仍需风控复核后才能进入模拟撮合。"
    )
    .replace(
      "Operator approval or rejection is required before this paper-only order can move on.",
      "该 paper-only 委托需要人工批准或拒绝后才能继续。"
    );
}
