import type { ExecutionState, Market, ResearchRunAudit, ResearchRunSummary } from "./terminal-workbench";

export type Locale = "zh-CN" | "en-US";
export type TranslationKey = keyof typeof messages["en-US"];
type WorkflowNodeTranslation = readonly [string, string];
type LocalizedLabelMap = {
  markets: Record<Market, string>;
  quantLoop: Record<string, string>;
  modules: Record<string, string>;
  agents: Record<string, string>;
  workflowNodes: Record<string, WorkflowNodeTranslation>;
  moduleFocus: Record<string, string>;
  quantLoopFocus: Record<string, string>;
  gates: Record<string, string>;
  metrics: Record<string, string>;
  statuses: Record<string, string>;
  executionModes: Record<ExecutionState["mode"], string>;
};

export const supportedLocales: Locale[] = ["zh-CN", "en-US"];

const messages = {
  "en-US": {
    "language.zh": "中文",
    "language.en": "EN",
    "language.zh.label": "Simplified Chinese",
    "language.en.label": "English",
    "aria.language": "Language",
    "aria.timeframe": "Research timeframe",
    "aria.symbolSwitcher": "Symbol switcher",
    "brand.subtitle": "Local-first quant OS",
    "section.quantLoop": "Quant Loop",
    "section.terminalModules": "Terminal Modules",
    "section.auditTrail": "Audit Trail",
    "topbar.eyebrow": "Professional Quant Workbench",
    "symbol.market": "Market",
    "symbol.placeholder": "Symbol",
    "symbol.searching": "Searching",
    "symbol.noResults": "No matches",
    "symbol.source": "Source",
    "action.switchSymbol": "Switch",
    "action.runPipeline": "Run Pipeline",
    "moduleFocus.label": "Active Focus",
    "moduleFocus.instrument": "Instrument",
    "panel.chart.title": "Chart & Factor Overlays",
    "panel.chart.subtitle": "Price · SMA20 · Trades · {timeframe}",
    "chart.noData": "No K-line data",
    "chart.symbol": "Symbol",
    "chart.latestClose": "Close",
    "chart.asOf": "As of",
    "chart.expand": "Expand chart",
    "chart.closeExpanded": "Close expanded chart",
    "chart.source": "Source",
    "chart.bars": "{count} bars",
    "panel.strategy.title": "Strategy Snapshot",
    "panel.nodeWorkflow.title": "Node Workflow",
    "panel.nodeWorkflow.subtitle": "Visual pipeline",
    "panel.execution.title": "Execution Center",
    "panel.execution.subtitle": "Paper first · certified live only",
    "panel.agent.title": "Agent Committee",
    "panel.agent.subtitle": "TradingAgents-style review",
    "panel.decision.title": "Decision Log",
    "panel.decision.subtitle": "Traceable AI research",
    "panel.history.title": "Run History",
    "panel.history.subtitle": "Recent audited runs",
    "panel.aiActions.title": "AI Actions",
    "panel.aiActions.subtitle": "Structured, not generic chat",
    "module.scanner.title": "Market Scanner",
    "module.scanner.subtitle": "Derived from active watchlist and quote context",
    "module.scanner.filters": "Filters",
    "module.scanner.results": "Candidates",
    "module.scanner.score": "Score",
    "module.scanner.signal": "Signal",
    "module.scanner.risk": "Risk",
    "module.scanner.research": "Research",
    "module.portfolio.title": "Portfolio Risk",
    "module.portfolio.subtitle": "Paper exposure and live-trading gates",
    "module.news.title": "News & Events",
    "module.news.subtitle": "Agent context with explicit feed status",
    "module.news.pending": "Live feed pending",
    "module.workflow.title": "Node Workflow",
    "module.workflow.subtitle": "A+C orchestration surface",
    "module.workflow.canvas": "Node canvas",
    "module.workflow.output": "Output",
    "module.workflow.artifacts": "Stage artifacts",
    "module.workflow.log": "Run log",
    "module.workflow.idle": "No workflow run yet",
    "module.workflow.run": "Run pipeline",
    "strategy.entry": "Entry",
    "strategy.exit": "Exit",
    "strategy.position": "Position",
    "strategy.risk": "Risk",
    "execution.accountSync": "Account Sync",
    "execution.paperAccount": "paper account",
    "execution.positions": "Positions",
    "execution.positionsValue": "4 watched / 0 live",
    "execution.riskState": "Risk State",
    "execution.liveBlocked": "live blocked",
    "execution.paperBlotter": "Paper blotter",
    "execution.side": "Side",
    "execution.quantity": "Qty",
    "execution.price": "Price",
    "execution.notional": "Notional",
    "execution.status": "Status",
    "execution.reason": "Reason",
    "empty.noAuditedRuns": "No audited runs",
    "aiAction.debate": "Run agent debate",
    "aiAction.explain": "Explain backtest",
    "aiAction.strategyDraft": "Generate strategy draft",
    "safety.footer": "Live execution requires adapter certification, risk approval, and human confirmation."
  },
  "zh-CN": {
    "language.zh": "中文",
    "language.en": "EN",
    "language.zh.label": "简体中文",
    "language.en.label": "English",
    "aria.language": "语言",
    "aria.timeframe": "研究周期",
    "aria.symbolSwitcher": "标的切换",
    "brand.subtitle": "本地优先量化系统",
    "section.quantLoop": "量化闭环",
    "section.terminalModules": "终端模块",
    "section.auditTrail": "审计轨迹",
    "topbar.eyebrow": "专业量化工作台",
    "symbol.market": "市场",
    "symbol.placeholder": "输入股票/币对代码",
    "symbol.searching": "搜索中",
    "symbol.noResults": "没有匹配标的",
    "symbol.source": "来源",
    "action.switchSymbol": "查询",
    "action.runPipeline": "运行流水线",
    "moduleFocus.label": "当前焦点",
    "moduleFocus.instrument": "标的",
    "panel.chart.title": "图表与因子叠加",
    "panel.chart.subtitle": "价格 · SMA20 · 交易 · {timeframe}",
    "chart.noData": "暂无 K 线数据",
    "chart.symbol": "标的",
    "chart.latestClose": "收盘",
    "chart.asOf": "日期",
    "chart.expand": "放大图表",
    "chart.closeExpanded": "关闭放大图表",
    "chart.source": "数据源",
    "chart.bars": "{count} 根K线",
    "panel.strategy.title": "策略快照",
    "panel.nodeWorkflow.title": "节点工作流",
    "panel.nodeWorkflow.subtitle": "可视化流水线",
    "panel.execution.title": "执行中心",
    "panel.execution.subtitle": "模拟优先 · 实盘需认证",
    "panel.agent.title": "智能体委员会",
    "panel.agent.subtitle": "TradingAgents 风格评审",
    "panel.decision.title": "决策日志",
    "panel.decision.subtitle": "可追踪 AI 研究",
    "panel.history.title": "运行历史",
    "panel.history.subtitle": "近期审计运行",
    "panel.aiActions.title": "AI 操作",
    "panel.aiActions.subtitle": "结构化，而不是泛聊天",
    "module.scanner.title": "市场扫描器",
    "module.scanner.subtitle": "基于当前自选和报价上下文派生",
    "module.scanner.filters": "筛选器",
    "module.scanner.results": "候选标的",
    "module.scanner.score": "评分",
    "module.scanner.signal": "信号",
    "module.scanner.risk": "风险",
    "module.scanner.research": "研究",
    "module.portfolio.title": "组合风险",
    "module.portfolio.subtitle": "模拟盘暴露和实盘闸门",
    "module.news.title": "新闻事件",
    "module.news.subtitle": "智能体上下文与事件源状态",
    "module.news.pending": "实时源待接入",
    "module.workflow.title": "节点工作流",
    "module.workflow.subtitle": "A+C 编排入口",
    "module.workflow.canvas": "节点画布",
    "module.workflow.output": "输出",
    "module.workflow.artifacts": "节点产物",
    "module.workflow.log": "运行日志",
    "module.workflow.idle": "尚未运行工作流",
    "module.workflow.run": "运行流水线",
    "strategy.entry": "入场",
    "strategy.exit": "出场",
    "strategy.position": "仓位",
    "strategy.risk": "风控",
    "execution.accountSync": "账户同步",
    "execution.paperAccount": "模拟账户",
    "execution.positions": "持仓",
    "execution.positionsValue": "4 个观察 / 0 个实盘",
    "execution.riskState": "风控状态",
    "execution.liveBlocked": "实盘已阻断",
    "execution.paperBlotter": "模拟委托流水",
    "execution.side": "方向",
    "execution.quantity": "数量",
    "execution.price": "价格",
    "execution.notional": "名义金额",
    "execution.status": "状态",
    "execution.reason": "原因",
    "empty.noAuditedRuns": "暂无审计运行",
    "aiAction.debate": "运行智能体辩论",
    "aiAction.explain": "解释回测",
    "aiAction.strategyDraft": "生成策略草稿",
    "safety.footer": "实盘执行必须通过适配器认证、风控审批和人工确认。"
  }
} as const;

const labelMaps: Record<Locale, LocalizedLabelMap> = {
  "en-US": {
    markets: {
      ashare: "A-share",
      us: "US",
      crypto: "Crypto"
    },
    quantLoop: {
      idea: "Idea Lab",
      data: "Data & Factor",
      strategy: "Strategy Builder",
      backtest: "Backtest Lab",
      "agent-review": "Agent Review",
      paper: "Paper Trading",
      broker: "Broker Center"
    },
    modules: {
      watchlist: "Watchlist",
      scanner: "Market Scanner",
      portfolio: "Portfolio Risk",
      news: "News & Events",
      workflow: "Node Workflow"
    },
    agents: {
      technical: "Technical Analyst",
      fundamental: "Fundamental Analyst",
      news: "News Analyst",
      sentiment: "Sentiment Analyst",
      bull: "Bull Researcher",
      bear: "Bear Researcher",
      risk: "Risk Manager",
      portfolio: "Portfolio Manager"
    },
    workflowNodes: {
      data: ["Data", "AKShare / yfinance / ccxt"],
      factor: ["Factor", "SMA / RSI / custom"],
      backtest: ["Backtest", "fees / slippage / replay"],
      agent: ["Agent", "debate / risk / report"],
      execution: ["Execution", "paper / certified live"]
    },
    moduleFocus: {
      watchlist: "Watchlist is bound to {symbol}; chart and research pipeline use this context.",
      scanner: "Scanner is focused on {market} candidates while the chart stays on {symbol}.",
      portfolio: "Portfolio risk is scoped to paper exposure and gates for {symbol}.",
      news: "News and event agents are scoped to {symbol}; live event feeds are not connected yet.",
      workflow: "Node workflow is staging data, factor, backtest, agent review, and execution for {symbol}."
    },
    quantLoopFocus: {
      idea: "Capture the research hypothesis for {symbol}.",
      data: "Prepare market data, factors, and quality checks for {symbol}.",
      strategy: "Configure entry, exit, position, and risk rules for {symbol}.",
      backtest: "Replay the selected timeframe and calculate audited metrics.",
      "agent-review": "Ask the AI committee to explain results and risks from supplied data only.",
      paper: "Route validated ideas into paper trading and risk logs.",
      broker: "Live broker adapters stay locked until certification and human confirmation."
    },
    gates: {
      "adapter-certified": "Adapter certified",
      "risk-approved": "Risk approved",
      "human-confirmed": "Human confirmed"
    },
    metrics: {
      Return: "Return",
      "Max DD": "Max DD",
      "Win Rate": "Win Rate",
      Trades: "Trades"
    },
    statuses: {
      "Offline snapshot": "Offline snapshot",
      "Core connected": "Core connected",
      "Research run complete": "Research run complete",
      "Research run failed": "Research run failed",
      "Audit replay loaded": "Audit replay loaded",
      "Instrument selected": "Instrument selected",
      "Timeframe selected": "Timeframe selected",
      "AI action generated": "AI action generated"
    },
    executionModes: {
      paper_only: "Paper only",
      certified_live: "Certified live",
      blocked_live: "Blocked live"
    }
  },
  "zh-CN": {
    markets: {
      ashare: "A 股",
      us: "美股",
      crypto: "加密货币"
    },
    quantLoop: {
      idea: "想法实验室",
      data: "数据与因子",
      strategy: "策略构建",
      backtest: "回测实验室",
      "agent-review": "智能体评审",
      paper: "模拟交易",
      broker: "券商中心"
    },
    modules: {
      watchlist: "自选列表",
      scanner: "市场扫描",
      portfolio: "组合风险",
      news: "新闻事件",
      workflow: "节点工作流"
    },
    agents: {
      technical: "技术分析师",
      fundamental: "基本面分析师",
      news: "新闻分析师",
      sentiment: "情绪分析师",
      bull: "多头研究员",
      bear: "空头研究员",
      risk: "风险经理",
      portfolio: "组合经理"
    },
    workflowNodes: {
      data: ["数据", "AKShare / yfinance / ccxt"],
      factor: ["因子", "SMA / RSI / 自定义"],
      backtest: ["回测", "手续费 / 滑点 / 回放"],
      agent: ["智能体", "辩论 / 风险 / 报告"],
      execution: ["执行", "模拟 / 认证实盘"]
    },
    moduleFocus: {
      watchlist: "自选列表已绑定 {symbol}；图表和研究流水线会使用这个上下文。",
      scanner: "市场扫描聚焦 {market} 候选池，当前图表保持在 {symbol}。",
      portfolio: "组合风险当前只展示 {symbol} 的模拟盘暴露和风控闸门。",
      news: "新闻事件智能体已切到 {symbol}；实时事件源尚未接入。",
      workflow: "节点工作流正在围绕 {symbol} 串联数据、因子、回测、智能体评审和执行。"
    },
    quantLoopFocus: {
      idea: "记录 {symbol} 的研究假设。",
      data: "准备 {symbol} 的行情、因子和质量检查。",
      strategy: "配置 {symbol} 的入场、出场、仓位和风控规则。",
      backtest: "回放所选周期并计算可审计指标。",
      "agent-review": "让 AI 委员会只基于传入数据解释结果和风险。",
      paper: "把通过校验的想法送入模拟交易和风控日志。",
      broker: "实盘券商适配器在认证和人工确认前保持锁定。"
    },
    gates: {
      "adapter-certified": "适配器已认证",
      "risk-approved": "风控已审批",
      "human-confirmed": "人工已确认"
    },
    metrics: {
      Return: "收益率",
      "Max DD": "最大回撤",
      "Win Rate": "胜率",
      Trades: "交易数"
    },
    statuses: {
      "Offline snapshot": "离线快照",
      "Core connected": "核心已连接",
      "Research run complete": "研究运行完成",
      "Research run failed": "研究运行失败",
      "Audit replay loaded": "审计回放已加载",
      "Instrument selected": "标的已选择",
      "Timeframe selected": "周期已选择",
      "AI action generated": "AI 操作已生成"
    },
    executionModes: {
      paper_only: "模拟盘",
      certified_live: "认证实盘",
      blocked_live: "实盘阻断"
    }
  }
};

const strategyTextMaps: Record<Locale, Record<string, string>> = {
  "en-US": {},
  "zh-CN": {
    "SMA Trend / Bank Sector": "SMA 趋势 / 银行板块",
    "SMA trend demo": "SMA 趋势演示",
    "Close > SMA20 and relative strength improving": "收盘价 > SMA20，且相对强度改善",
    "Close < SMA20 or risk manager downgrade": "收盘价 < SMA20，或风险经理下调评级",
    "20% cap per instrument": "单标的仓位上限 20%",
    "Stop -8%, drawdown guard 12%, paper only": "止损 -8%，回撤保护 12%，仅模拟盘",
    "Replay from audited research run": "来自审计研究运行的回放",
    "Momentum confirmation plus AI committee agreement": "动量确认 + AI 委员会一致",
    "Close below trend support or risk manager downgrade": "跌破趋势支撑，或风险经理下调评级",
    "Start with paper sizing and cap exposure before audited replay": "先以模拟盘定仓，审计回放前限制暴露",
    "Paper only; require adapter certification, risk approval, and human confirmation":
      "仅模拟盘；需要适配器认证、风控审批和人工确认",
    "Pending audited backtest": "等待可审计回测",
    "Pending risk sizing": "等待风控定仓",
    "Paper only until a new audited run is available": "生成新的审计运行前仅允许模拟盘"
  }
};

const decisionTextMaps: Record<Locale, Record<string, string>> = {
  "en-US": {},
  "zh-CN": {
    "Trend is recovering, but volume confirmation is still weak.": "趋势正在修复，但成交量确认仍然偏弱。",
    "Valuation is neutral; compare against sector bank index before promotion.": "估值中性；升级前需与银行板块指数对比。",
    "Live order is blocked until adapter certification and user confirmation pass.": "实盘订单在适配器认证和用户确认前保持阻断。",
    "Keep on watchlist and rerun after data and event refresh.": "保留在自选列表，待数据和事件刷新后重新运行。",
    "No decision entries recorded for this run.": "该运行未记录决策条目。",
    "Previous audit results are cleared for this research context; live execution remains blocked.":
      "该研究上下文的旧审计结果已清除；实盘执行仍保持阻断。"
  }
};

export function resolveInitialLocale(storedLocale?: string | null): Locale {
  return isLocale(storedLocale) ? storedLocale : "zh-CN";
}

export function createI18n(locale: Locale) {
  const dictionary = messages[locale];
  const labels = labelMaps[locale];

  return {
    locale,
    localeOptionLabel(candidate: Locale) {
      return candidate === "zh-CN" ? dictionary["language.zh.label"] : dictionary["language.en.label"];
    },
    t(key: TranslationKey, values: Record<string, string | number> = {}) {
      return formatMessage(dictionary[key] ?? messages["en-US"][key] ?? key, values);
    },
    marketLabel(market: Market) {
      return labels.markets[market];
    },
    quantLoopLabel(id: string, fallback: string) {
      return valueOf(labels.quantLoop, id, fallback);
    },
    moduleLabel(id: string, fallback: string) {
      return valueOf(labels.modules, id, fallback);
    },
    moduleFocus(id: string, values: Record<string, string | number>) {
      return formatMessage(valueOf(labels.moduleFocus, id, id), values);
    },
    quantLoopFocus(id: string, values: Record<string, string | number>) {
      return formatMessage(valueOf(labels.quantLoopFocus, id, id), values);
    },
    agentLabel(id: string, fallback: string) {
      return valueOf(labels.agents, id, fallback);
    },
    workflowNode(id: string, fallbackLabel: string, fallbackDetail: string) {
      const translated = valueOf(labels.workflowNodes, id, undefined);
      return translated ? { label: translated[0], detail: translated[1] } : { label: fallbackLabel, detail: fallbackDetail };
    },
    gateLabel(id: string, fallback: string) {
      return valueOf(labels.gates, id, fallback);
    },
    metricLabel(label: string) {
      return valueOf(labels.metrics, label, label);
    },
    statusLabel(status: string) {
      return valueOf(labels.statuses, status, status);
    },
    executionMode(execution: ExecutionState) {
      return labels.executionModes[execution.mode];
    },
    strategyText(text: string) {
      return translateStrategyText(locale, text);
    },
    decisionAgent(agent: string) {
      return translateAgentName(locale, agent);
    },
    decisionMessage(message: string) {
      return translateDecisionMessage(locale, message);
    },
    researchRunLabel(summary: ResearchRunSummary | null | undefined) {
      if (!summary) {
        return locale === "zh-CN" ? "暂无审计运行" : "No audited run yet";
      }
      if (locale === "zh-CN") {
        return `${summary.runId} · ${summary.dataRows} 根 ${summary.timeframe} K线 · ${executionModeText(locale, summary.executionMode)}`;
      }
      return `${summary.runId} · ${summary.dataRows} ${summary.timeframe} bars · ${summary.executionMode}`;
    },
    researchRunHistoryLabel(run: ResearchRunAudit) {
      const totalReturn = run.metrics.total_return_pct;
      const tradeCount = run.metrics.trade_count ?? 0;
      const returnLabel = Number.isFinite(totalReturn)
        ? `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}%`
        : "N/A";
      return locale === "zh-CN"
        ? `${run.symbol} · ${run.timeframe} · ${returnLabel} · ${tradeCount} 笔交易`
        : `${run.symbol} · ${run.timeframe} · ${returnLabel} · ${tradeCount} trades`;
    }
  };
}

function translateStrategyText(locale: Locale, text: string): string {
  if (locale === "en-US") {
    return text;
  }
  const direct = strategyTextMaps[locale][text];
  if (direct) {
    return direct;
  }
  const researchContext = text.match(/^(.+) ((?:1d|1m|5m|15m|30m|60m)) research context$/);
  if (researchContext) {
    return `${researchContext[1]} ${researchContext[2]} 研究上下文`;
  }
  const originalTimeframe = text.match(/^Original timeframe ((?:1d|1m|5m|15m|30m|60m))$/);
  if (originalTimeframe) {
    return `原始周期 ${originalTimeframe[1]}`;
  }
  const barsReplayed = text.match(/^(\d+) bars replayed$/);
  if (barsReplayed) {
    return `已回放 ${barsReplayed[1]} 根K线`;
  }
  const revision = text.match(/^Strategy revision (.+); execution (.+)$/);
  if (revision) {
    return `策略版本 ${revision[1]}；执行模式 ${executionModeText(locale, revision[2])}`;
  }
  return text;
}

function translateDecisionMessage(locale: Locale, message: string): string {
  if (locale === "en-US") {
    return message;
  }
  const direct = decisionTextMaps[locale][message];
  if (direct) {
    return direct;
  }
  const contextSelected = message.match(
    /^(.+) ((?:1d|1m|5m|15m|30m|60m)) selected\. Run Pipeline to generate an audited backtest and agent review\.$/
  );
  if (contextSelected) {
    return `${contextSelected[1]} ${contextSelected[2]} 已选中。运行流水线以生成可审计回测和智能体评审。`;
  }
  const backtestReplay = message.match(/^Backtest replay completed on (\d+) bars\.$/);
  if (backtestReplay) {
    return `回测已基于 ${backtestReplay[1]} 根K线完成。`;
  }
  const aiExplanation = message.match(
    /^Backtest explanation for (.+): return (.+), max drawdown (.+), trades (.+); no guaranteed outcome\.$/
  );
  if (aiExplanation) {
    return `${aiExplanation[1]} 回测解释：收益率 ${aiExplanation[2]}，最大回撤 ${aiExplanation[3]}，交易数 ${aiExplanation[4]}；不构成收益保证。`;
  }
  const aiDebate = message.match(
    /^Debate generated for (.+): bull case requires momentum confirmation; bear case flags drawdown and data quality\.$/
  );
  if (aiDebate) {
    return `${aiDebate[1]} 智能体辩论：多头观点需要动量确认；空头观点提示回撤和数据质量风险。`;
  }
  const strategyDraft = message.match(
    /^Strategy draft generated for (.+): keep paper-only execution until data, risk, and human gates pass\.$/
  );
  if (strategyDraft) {
    return `${strategyDraft[1]} 策略草稿已生成：数据、风控和人工闸门通过前保持模拟盘执行。`;
  }
  return message;
}

function translateAgentName(locale: Locale, agent: string): string {
  if (locale === "en-US") {
    return agent;
  }
  const byLabel = Object.entries(labelMaps["en-US"].agents).find(([, label]) => label === agent);
  if (byLabel) {
    return valueOf(labelMaps[locale].agents, byLabel[0], agent);
  }
  const extra: Record<string, string> = {
    "AI Summary": "AI 摘要",
    Audit: "审计",
    Technical: "技术分析",
    Fundamental: "基本面",
    Risk: "风险",
    "Portfolio Manager": "组合经理",
    "AI Debate": "AI 辩论",
    "Strategy Drafter": "策略起草员"
  };
  return extra[agent] ?? agent;
}

function executionModeText(locale: Locale, mode: string): string {
  const executionModes = labelMaps[locale].executionModes as Record<string, string>;
  return executionModes[mode] ?? mode;
}

function isLocale(value: string | null | undefined): value is Locale {
  return value === "zh-CN" || value === "en-US";
}

function formatMessage(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function valueOf<T>(record: Record<string, T>, key: string, fallback: T): T;
function valueOf<T>(record: Record<string, T>, key: string, fallback: T | undefined): T | undefined;
function valueOf<T>(record: Record<string, T>, key: string, fallback: T | undefined): T | undefined {
  return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : fallback;
}
