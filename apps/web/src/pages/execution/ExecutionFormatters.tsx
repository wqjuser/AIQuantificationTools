import { BookmarkPlus, Database, ShieldCheck, WalletCards } from "lucide-react";
import type { PaperExecutionRecord } from "../../lib/terminal-api";
import type { AppI18n } from "../../lib/i18n";
import type {
  PaperExecutionSummaryTile,
  PaperPositionRow,
  PaperTradingRow,
  PortfolioPaperOrderReplaySummaryTile,
} from "../../lib/terminal-workbench";

export function paperExecutionTileIcon(id: PaperExecutionSummaryTile["id"]): typeof Database {
  if (id === "account-sync") {
    return Database;
  }
  if (id === "paper-positions") {
    return WalletCards;
  }
  if (id === "preparation-evidence") {
    return BookmarkPlus;
  }
  return ShieldCheck;
}

export function paperExecutionTileLabel(i18n: AppI18n, tile: PaperExecutionSummaryTile): string {
  if (i18n.locale === "en-US") {
    return tile.label;
  }
  return {
    "account-sync": "账户同步",
    "paper-positions": "模拟持仓",
    "preparation-evidence": "数据准备证据",
    "risk-gates": "执行闸门"
  }[tile.id];
}

export function paperExecutionTileValue(i18n: AppI18n, tile: PaperExecutionSummaryTile): string {
  if (i18n.locale === "en-US") {
    return tile.value;
  }
  const liveGatesBlocked = tile.value.match(/^(\d+) live gates blocked$/);
  if (liveGatesBlocked) {
    return `${liveGatesBlocked[1]} 个实盘闸门阻断`;
  }
  return tile.value
    .replace("No paper execution", "尚无模拟执行")
    .replace("Not locked", "未锁定")
    .replace("Cash", "现金")
    .replace("Equity", "权益")
    .replace("rows", "行")
    .replace("paper", "模拟")
    .replace("live", "实盘")
    .replace("passed", "通过")
    .replace("blocked", "阻断")
    .replace("live route enabled", "实盘通道已开启");
}

export function paperExecutionTileDetail(i18n: AppI18n, tile: PaperExecutionSummaryTile): string {
  if (i18n.locale === "en-US") {
    return tile.detail;
  }
  return tile.detail
    .replace("Run Pipeline and submit a paper order to create a local account snapshot.", "运行流水线并提交模拟委托后，会生成本地账户快照。")
    .replace("No filled paper positions are linked to the active audited run.", "当前审计运行尚未绑定已成交模拟持仓。")
    .replace("Paper execution has not inherited a data preparation run yet.", "模拟执行尚未继承数据准备运行。")
    .replace("Snapshot", "快照")
    .replace("paper_only", "仅模拟盘")
    .replace("Adapter certified: blocked", "适配器认证：阻断")
    .replace("Risk approved: blocked", "风控审批：阻断")
    .replace("Human confirmed: blocked", "人工确认：阻断")
    .replace("Adapter certified: passed", "适配器认证：通过")
    .replace("Risk approved: passed", "风控审批：通过")
    .replace("Human confirmed: passed", "人工确认：通过")
    .replace("Audit run bound: passed", "审计运行绑定：通过")
    .replace("Paper risk check: passed", "模拟风控检查：通过")
    .replace("Live route blocked: blocked", "实盘通道：阻断");
}

export function portfolioReplayTileIcon(id: PortfolioPaperOrderReplaySummaryTile["id"]): typeof Database {
  if (id === "portfolio-account") {
    return Database;
  }
  if (id === "portfolio-positions") {
    return WalletCards;
  }
  return ShieldCheck;
}

export function portfolioReplayTileLabel(i18n: AppI18n, tile: PortfolioPaperOrderReplaySummaryTile): string {
  if (i18n.locale === "en-US") {
    return tile.label;
  }
  return {
    "portfolio-account": "组合账户",
    "portfolio-positions": "回放持仓",
    "portfolio-replay-boundary": "执行边界"
  }[tile.id];
}

export function portfolioReplayTileValue(i18n: AppI18n, tile: PortfolioPaperOrderReplaySummaryTile): string {
  if (i18n.locale === "en-US") {
    return tile.value;
  }
  return tile.value
    .replace("No portfolio replay", "尚无组合回放")
    .replace("Cash", "现金")
    .replace("Equity", "权益")
    .replace("positions", "持仓")
    .replace("position", "持仓")
    .replace("fills", "成交")
    .replace("fill", "成交")
    .replace("Paper only", "仅模拟盘")
    .replace("Live route open", "实盘通道开启");
}

export function portfolioReplayTileDetail(i18n: AppI18n, tile: PortfolioPaperOrderReplaySummaryTile): string {
  if (i18n.locale === "en-US") {
    return tile.detail;
  }
  return tile.detail
    .replace("Simulate approved portfolio orders to rebuild paper cash and positions.", "模拟已批准的组合委托后，会重建本地现金与持仓。")
    .replace("No applied paper fills are linked to this portfolio run yet.", "当前组合运行尚未绑定已应用的模拟成交。")
    .replace("Live execution remains blocked until adapter certification and human confirmation pass.", "实盘执行仍需适配器认证与人工确认通过。")
    .replace("Replay", "回放")
    .replace("portfolio_paper_order_replay", "组合模拟委托回放")
    .replace("Buy", "买入")
    .replace("Sell", "卖出")
    .replace("Net", "净额")
    .replace("Replay is derived from approved local paper fills; no broker route is used.", "回放仅来自本地已批准模拟成交，不使用券商通道。")
    .replace("replay warning", "条回放警告")
    .replace("replay warnings", "条回放警告");
}

export function paperPositionStatusLabel(i18n: AppI18n, status: PaperPositionRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { paper: "模拟", flat: "空仓", blocked: "已阻断" }[status];
}

export function paperTradingRowsFromExecutionRecord(record: PaperExecutionRecord): PaperTradingRow[] {
  const orderRows = record.orders.map((order) => ({
    id: order.orderId,
    symbol: order.symbol,
    side: order.side === "sell" ? "SELL" : "BUY",
    quantity: String(order.quantity),
    price: order.price.toFixed(2),
    notional: (order.quantity * order.price).toFixed(2),
    status: order.status === "filled" ? "filled" : "blocked",
    reason: order.reason,
    tone: order.status === "filled" ? "positive" : "risk"
  })) satisfies PaperTradingRow[];

  const gateRows = record.gates.map((gate) => ({
    id: `gate-${gate.id}`,
    symbol: "PAPER",
    side: "RISK",
    quantity: "-",
    price: "-",
    notional: "-",
    status: gate.passed ? "paper" : "blocked",
    reason: `${gate.label}: ${gate.reason}`,
    tone: gate.passed ? "neutral" : "warning"
  })) satisfies PaperTradingRow[];

  return [...orderRows, ...gateRows];
}

export function paperSideLabel(i18n: AppI18n, side: PaperTradingRow["side"]): string {
  if (i18n.locale === "en-US") {
    return side;
  }
  return { BUY: "买入", SELL: "卖出", RISK: "风控", SYNC: "同步" }[side];
}

export function paperStatusLabel(i18n: AppI18n, status: PaperTradingRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { queued: "待处理", filled: "已成交", blocked: "已阻断", paper: "模拟" }[status];
}

export function paperNotionalLabel(i18n: AppI18n, notional: string): string {
  if (i18n.locale === "en-US" || notional === "-") {
    return notional;
  }
  return `${notional} 模拟资金`;
}

export function paperReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason;
  }
  if (reason === "Run Pipeline before staging a paper order.") {
    return "请先运行流水线生成审计结果，再创建模拟委托。";
  }
  if (reason === "No audited research run is bound; paper route remains blocked.") {
    return "当前没有绑定审计研究运行；模拟通道保持阻断。";
  }
  if (reason === "Risk approval blocked before staging paper execution.") {
    return "风控审批阻断，不能创建模拟委托。";
  }
  if (reason === "Audited drawdown breaches the configured guardrail.") {
    return "审计回撤突破已配置护栏。";
  }
  const stagedAuditedOrder = reason.match(/^Paper order staged from (.+) using audited run (.+); no live route is used\.$/);
  if (stagedAuditedOrder) {
    return `已从 ${i18n.strategyText(stagedAuditedOrder[1])} 基于审计运行 ${stagedAuditedOrder[2]} 生成模拟委托；不使用实盘通道。`;
  }
  const stagedOrder = reason.match(/^Paper order staged from (.+); no live route is used\.$/);
  if (stagedOrder) {
    return `已从 ${i18n.strategyText(stagedOrder[1])} 生成模拟委托；不使用实盘通道。`;
  }
  const blockedGate = reason.match(/^(\d+) live gates blocked; paper route remains available\.$/);
  if (blockedGate) {
    return `${blockedGate[1]} 个实盘闸门阻断；模拟盘通道可用。`;
  }
  return reason
    .replace("filled_immediately", "已模拟成交")
    .replace("max_position_value_exceeded", "超过单标的模拟仓位上限")
    .replace("insufficient_cash", "模拟现金不足")
    .replace("Audit run bound: ", "审计运行绑定：")
    .replace("Paper risk check: ", "模拟风控检查：")
    .replace("Live route blocked: ", "实盘通道阻断：")
    .replace(/^Paper execution is linked to audited run (.+)\.$/, "模拟执行已绑定审计运行 $1。")
    .replace("Live execution is blocked; this record is paper-only.", "实盘执行已阻断；该记录仅用于模拟盘。")
    .replace("Certified live route is available but this run stays paper-first.", "认证实盘通道可用，但本次仍优先模拟盘。")
    .replace("Local paper account only; broker account synchronization is not connected.", "仅本地模拟账户；尚未连接券商账户同步。");
}
