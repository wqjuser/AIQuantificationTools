import { type AppI18n } from "../../lib/i18n";
import { AgentCommitteeRound, AiEvidenceCard, Market } from "../../lib/terminal-workbench";

export function agentPhaseLabel(i18n: AppI18n, phase: AgentCommitteeRound["phase"]): string {
  if (i18n.locale === "en-US") {
    return phase;
  }
  return { analysis: "分析", debate: "辩论", risk: "风控", decision: "决策" }[phase];
}

export function agentVerdictLabel(i18n: AppI18n, verdict: AgentCommitteeRound["verdict"]): string {
  if (i18n.locale === "en-US") {
    return verdict;
  }
  return { support: "支持", challenge: "质疑", risk: "风险", watch: "观察" }[verdict];
}

export function agentRoundThesis(i18n: AppI18n, round: AgentCommitteeRound): string {
  if (i18n.locale === "en-US") {
    return round.thesis;
  }
  const bullCase = round.thesis.match(/^Bull case requires (.+)\.$/);
  if (bullCase) {
    return `多头观点需要：${i18n.strategyText(bullCase[1])}。`;
  }
  const bearCase = round.thesis.match(/^Bear case challenges the setup if (.+)\.$/);
  if (bearCase) {
    return `空头观点在以下条件下质疑配置：${i18n.strategyText(bearCase[1])}。`;
  }
  return i18n.decisionMessage(round.thesis);
}

export function agentRoundEvidence(i18n: AppI18n, evidence: string): string {
  if (i18n.locale === "en-US") {
    return evidence;
  }
  const positionRule = evidence.match(/^Position rule: (.+)\.$/);
  if (positionRule) {
    return `仓位规则：${i18n.strategyText(positionRule[1])}。`;
  }
  const riskRule = evidence.match(/^Risk rule: (.+)\.$/);
  if (riskRule) {
    return `风控规则：${i18n.strategyText(riskRule[1])}。`;
  }
  const auditedRun = evidence.match(/^Audited run (.+) · (.+) bars$/);
  if (auditedRun) {
    return `审计运行 ${auditedRun[1]} · ${auditedRun[2]} 根K线`;
  }
  return evidence
    .replace("Return", "收益率")
    .replace("Max DD", "最大回撤")
    .replace("Adapter certified: blocked", "适配器认证：阻断")
    .replace("Risk approved: blocked", "风控审批：阻断")
    .replace("Human confirmed: blocked", "人工确认：阻断")
    .replace("Adapter certified: passed", "适配器认证：通过")
    .replace("Risk approved: passed", "风控审批：通过")
    .replace("Human confirmed: passed", "人工确认：通过")
    .replace("No audited run is bound to this research context yet.", "当前研究上下文尚未绑定审计运行。");
}

export function agentEvidenceLabel(i18n: AppI18n, card: AiEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.label;
  }
  return (
    {
      context: "研究上下文",
      backtest: "回测证据",
      "benchmark": "基准 Alpha",
      "research-note": "研究笔记",
      risk: "风控闸门",
      safety: "AI 边界"
    }[card.id] ?? card.label
  );
}

export function agentEvidenceValue(i18n: AppI18n, card: AiEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.value;
  }
  if (card.value === "Pending audited run") {
    return "等待审计运行";
  }
  if (card.value === "No buy/sell advice") {
    return "不输出买卖建议";
  }
  if (card.value === "Live gates open") {
    return "实盘闸门已开启";
  }
  if (card.value === "Locked note snapshot") {
    return "已锁定笔记快照";
  }
  return card.value.replace("bars", "根K线").replace("blocked gates", "个阻断闸门");
}

export function agentEvidenceDetail(i18n: AppI18n, card: AiEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.detail;
  }
  const context = card.detail.match(/^(.+) · price (.+)$/);
  if (context) {
    return `${i18n.marketLabel(context[1] as Market)} · 价格 ${context[2]}`;
  }
  const auditedRun = card.detail.match(/^Audited run (.+) · revision (.+)$/);
  if (auditedRun) {
    return `审计运行 ${auditedRun[1]} · 版本 ${auditedRun[2]}`;
  }
  if (card.detail === "Run Pipeline before trusting AI review.") {
    return "先运行流水线，再信任 AI 评审。";
  }
  if (card.detail === "AI can explain supplied evidence only; no guaranteed outcome.") {
    return "AI 只能解释已提供证据；不保证结果。";
  }
  const benchmark = card.detail.match(/^Strategy (.+) vs buy-and-hold (.+) over (\d+) audited bars\.$/);
  if (benchmark) {
    return `策略 ${benchmark[1]} 对比买入持有 ${benchmark[2]} · ${benchmark[3]} 根审计K线`;
  }
  if (card.detail === "Benchmark comparison waits for an audited data snapshot.") {
    return "基准对比等待审计数据快照。";
  }
  return card.detail
    .replace("Adapter certified: blocked", "适配器认证：阻断")
    .replace("Risk approved: blocked", "风控审批：阻断")
    .replace("Human confirmed: blocked", "人工确认：阻断")
    .replace("Adapter certified: passed", "适配器认证：通过")
    .replace("Risk approved: passed", "风控审批：通过")
    .replace("Human confirmed: passed", "人工确认：通过");
}
