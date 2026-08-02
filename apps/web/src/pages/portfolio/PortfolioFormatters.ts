import { type AppI18n } from "../../lib/i18n";
import { PortfolioPaperOrderBatch } from "../../lib/terminal-api";
import { Market, PortfolioBacktestDiagnosticRow, PortfolioRiskRow } from "../../lib/terminal-workbench";

export function portfolioRiskLabel(i18n: AppI18n, row: PortfolioRiskRow): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  return {
    "paper-exposure": "模拟盘暴露",
    "selected-risk": "当前标的",
    "live-gates": "实盘闸门"
  }[row.id] ?? row.label;
}

export function portfolioRiskValue(i18n: AppI18n, row: PortfolioRiskRow): string {
  if (i18n.locale === "en-US") {
    return row.value;
  }
  return row.value.replace("watched", "个观察").replace("blocked", "个阻断").replace("open", "已开启");
}

export function portfolioRiskDetail(i18n: AppI18n, row: PortfolioRiskRow): string {
  if (i18n.locale === "en-US") {
    return row.detail;
  }
  if (row.id === "paper-exposure") {
    return "当前工作台没有连接已认证实盘持仓。";
  }
  if (row.id === "selected-risk") {
    return `${row.value} 在新的审计运行通过闸门前保持模拟盘。`;
  }
  if (row.id === "live-gates") {
    return "需要完成适配器认证、风控审批和人工确认。";
  }
  return row.detail;
}

export function portfolioDiagnosticLabel(i18n: AppI18n, row: PortfolioBacktestDiagnosticRow): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  return (
    {
      concentration: "集中度",
      "cash-buffer": "现金缓冲",
      "exposure-utilization": "总暴露",
      "rebalance-drift": "再平衡漂移",
      "risk-contribution": "风险贡献",
      "covariance-risk": "协方差风险",
      "correlation-risk": "相关性风险",
      "negative-contribution": "负贡献",
      "data-quality": "数据质量"
    }[row.id] ?? row.label
  );
}

export function portfolioDiagnosticDetail(i18n: AppI18n, row: PortfolioBacktestDiagnosticRow): string {
  if (i18n.locale === "en-US") {
    return row.detail;
  }
  if (row.id === "concentration") {
    if (row.status === "passed") {
      return "最大组合腿未超过 50% 集中度复核阈值。";
    }
    if (row.status === "blocked") {
      return "最大组合腿超过 75% 硬性集中度阈值。";
    }
    return "最大组合腿超过 50% 集中度复核阈值。";
  }
  if (row.id === "cash-buffer") {
    if (row.detail.includes("under-invested")) {
      return "现金缓冲偏高，组合可能没有充分配置。";
    }
    if (row.detail.includes("thin")) {
      return "现金缓冲偏薄，执行滑点或整手约束需要复核。";
    }
    return "现金缓冲处于静态权重复核区间内。";
  }
  if (row.id === "exposure-utilization") {
    if (row.status === "blocked") {
      return "总目标暴露超过 100%，晋级前必须重新调整权重。";
    }
    if (row.detail.includes("fully invested")) {
      return "总目标暴露接近满仓，现金和滑点缓冲需要复核。";
    }
    if (row.detail.includes("under-invested")) {
      return "总目标暴露偏低，组合可能没有充分配置。";
    }
    return "总目标暴露保留了现金和滑点缓冲。";
  }
  if (row.id === "rebalance-drift") {
    if (row.status === "blocked") {
      return "期末权重漂移超过 10 个百分点硬性再平衡阈值。";
    }
    if (row.status === "review") {
      return "期末权重漂移超过 2 个百分点再平衡复核阈值。";
    }
    return "期末权重漂移仍在 2 个百分点再平衡复核阈值内。";
  }
  if (row.id === "risk-contribution") {
    if (row.status === "blocked") {
      return "最大风险预算贡献超过 75% 硬性集中度阈值。";
    }
    if (row.status === "review") {
      return "最大风险预算贡献超过 60% 复核阈值。";
    }
    return "最大风险预算贡献仍在 60% 复核阈值内。";
  }
  if (row.id === "covariance-risk") {
    if (row.status === "blocked") {
      return "最大协方差风险贡献超过 75% 硬性集中度阈值。";
    }
    if (row.status === "review") {
      return "最大协方差风险贡献超过 60% 复核阈值。";
    }
    return "最大协方差风险贡献仍在 60% 复核阈值内。";
  }
  if (row.id === "correlation-risk") {
    if (row.status === "blocked") {
      return "最高成对相关性超过 0.95 硬性聚集阈值。";
    }
    if (row.status === "review") {
      return "最高成对相关性超过 0.85 复核阈值。";
    }
    return "最高成对相关性仍在 0.85 复核阈值内。";
  }
  if (row.id === "negative-contribution") {
    return row.status === "passed"
      ? "本次组合聚合未发现负贡献标的。"
      : `${row.value} 对组合产生负贡献，需要复核权重或策略证据。`;
  }
  if (row.id === "data-quality") {
    if (row.status === "passed") {
      return "组合聚合数据质量完整。";
    }
    return `组合数据质量需要复核：${row.detail
      .replace("Portfolio data quality is incomplete", "不完整")
      .replace("Portfolio data quality has warnings", "存在告警")
      .replace("review source completeness before promotion", "晋级前复核来源完整性")}`;
  }
  return row.detail;
}

export function portfolioBacktestHeadline(i18n: AppI18n, headline: string): string {
  if (i18n.locale === "en-US") {
    return headline;
  }
  return (
    {
      "Portfolio backtest ready": "组合回测就绪",
      "Portfolio backtest blocked": "组合回测阻断",
      "Portfolio backtest needs peers": "组合回测需要对照标的"
    }[headline] ?? headline
  );
}

export function portfolioBacktestSummary(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  if (summary === "Run at least one audited research pipeline first.") {
    return "先至少运行一次审计研究流水线。";
  }
  if (summary === "Run at least one audited research pipeline with an equity curve first.") {
    return "当前审计运行缺少权益曲线，请重新运行当前标的研究。";
  }
  if (summary === "Need at least two audited runs from the same market and timeframe with aligned equity curves.") {
    return "需要至少两个同市场、同周期且权益曲线日期对齐的审计运行。系统会先尝试重新生成对照审计。";
  }
  if (summary === "portfolio legs must use aligned equity timestamps") {
    return "组合腿的权益曲线日期未对齐，请重新生成同一区间的对照审计。";
  }
  if (summary === "portfolio legs must share market and timeframe") {
    return "组合腿必须来自同一市场并使用相同周期。";
  }
  const ready = summary.match(/^(\d+) audited runs from (ashare|us|crypto) (1d|1w|1m|5m|15m|30m|60m); cash buffer (.+)\.$/u);
  if (ready) {
    return `${ready[1]} 个同市场同周期审计运行 · ${i18n.marketLabel(ready[2] as Market)} ${ready[3]} · 现金缓冲 ${ready[4]}。`;
  }
  return summary;
}

export function portfolioPeerAuditSummary(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  if (summary === "Run the selected instrument pipeline before preparing portfolio peers.") {
    return "先运行当前标的流水线，再生成组合对照审计。";
  }
  if (summary === "Add another same-market watchlist instrument before preparing a portfolio backtest.") {
    return "先添加另一个同市场自选标的，再准备组合回测。";
  }
  const complete = summary.match(/^(\d+) audited portfolio legs are ready for a static-weight portfolio backtest\.$/u);
  if (complete) {
    return `${complete[1]} 个组合腿已完成审计，可以运行静态权重组合回测。`;
  }
  const ready = summary.match(/^(\d+) peer audits? can be generated from the current watchlist\.$/u);
  if (ready) {
    return `可从当前自选列表生成 ${ready[1]} 个对照审计。`;
  }
  return summary;
}

export function portfolioPeerAuditStatusLabel(
  i18n: AppI18n,
  status: "audited" | "missing"
): string {
  return status === "audited" ? i18n.t("portfolio.peerAudited") : i18n.t("portfolio.peerMissing");
}

export function portfolioAllocationEventTypeLabel(i18n: AppI18n, eventType: "allocate" | "cash_buffer"): string {
  return eventType === "allocate" ? i18n.t("portfolio.allocationAllocate") : i18n.t("portfolio.allocationCashBuffer");
}

export function portfolioRebalanceStatusLabel(i18n: AppI18n, status: "within_band" | "review" | "blocked"): string {
  if (status === "blocked") {
    return i18n.t("portfolio.rebalanceBlocked");
  }
  if (status === "review") {
    return i18n.t("portfolio.rebalanceReview");
  }
  return i18n.t("portfolio.rebalanceWithinBand");
}

export function portfolioTradeReviewStatusLabel(i18n: AppI18n, status: "paper_review" | "blocked" | "no_action"): string {
  if (status === "blocked") {
    return i18n.t("portfolio.tradeReviewBlocked");
  }
  if (status === "paper_review") {
    return i18n.t("portfolio.tradeReviewPaperReview");
  }
  return i18n.t("portfolio.tradeReviewNoAction");
}

export function portfolioPreTradeRiskStatusLabel(i18n: AppI18n, status: "passed" | "review" | "blocked"): string {
  if (status === "passed") {
    return i18n.t("portfolio.preTradeRiskPassed");
  }
  if (status === "review") {
    return i18n.t("portfolio.preTradeRiskReview");
  }
  return i18n.t("portfolio.preTradeRiskBlocked");
}

export function portfolioPreTradeRiskCheckLabel(
  i18n: AppI18n,
  checkId: "portfolio_data_quality" | "trade_review_status" | "trade_notional_limit"
): string {
  if (checkId === "portfolio_data_quality") {
    return i18n.t("portfolio.preTradeRiskDataQuality");
  }
  if (checkId === "trade_review_status") {
    return i18n.t("portfolio.preTradeRiskTradeStatus");
  }
  return i18n.t("portfolio.preTradeRiskNotional");
}

export function portfolioPaperOrderStatusLabel(
  i18n: AppI18n,
  status: "pending_review" | "rejected" | "skipped"
): string {
  if (status === "pending_review") {
    return i18n.t("portfolio.paperOrderPendingReview");
  }
  if (status === "rejected") {
    return i18n.t("portfolio.paperOrderRejected");
  }
  return i18n.t("portfolio.paperOrderSkipped");
}

export function portfolioPaperOrderBatchStatusLabel(i18n: AppI18n, batch: PortfolioPaperOrderBatch): string {
  const statusEntries = Object.entries(batch.summary.statusCounts).filter(([, count]) => count > 0);
  if (!statusEntries.length) {
    return i18n.t("portfolio.paperOrderRecorded");
  }
  return statusEntries
    .map(([status, count]) => {
      const label =
        status === "pending_review" || status === "rejected" || status === "skipped"
          ? portfolioPaperOrderStatusLabel(i18n, status)
          : status;
      return `${label} ${count}`;
    })
    .join(" · ");
}
