import type {
  ExecutionState,
  Market,
  ProductWorkArea,
  ProductWorkAreaStatus,
  ResearchRunAudit,
  ResearchRunSummary
} from "./terminal-workbench";

export type Locale = "zh-CN" | "en-US";
export type TranslationKey = keyof typeof messages["en-US"];
type WorkflowNodeTranslation = readonly [string, string];
type LocalizedLabelMap = {
  markets: Record<Market, string>;
  productWorkAreas: Record<string, string>;
  productWorkAreaDescriptions: Record<string, string>;
  productWorkAreaStatuses: Record<ProductWorkAreaStatus, string>;
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
    "section.quantLoop": "Research Workflows",
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
    "moduleFocus.label": "Current Task",
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
    "panel.backtest.title": "Backtest Replay",
    "panel.backtest.subtitle": "Audited fills · drawdown · exit review",
    "panel.nodeWorkflow.title": "Node Workflow",
    "panel.nodeWorkflow.subtitle": "Visual pipeline",
    "panel.execution.title": "Execution Center",
    "panel.execution.subtitle": "Paper first · certified live only",
    "panel.agent.title": "Agent Committee",
    "panel.agent.subtitle": "TradingAgents-style review",
    "panel.agentRoles.title": "Agent Roles",
    "panel.agentRoles.subtitle": "Current research roles",
    "panel.agent.rounds": "Committee rounds",
    "panel.agent.evidence": "Evidence summary",
    "panel.decision.title": "Decision Log",
    "panel.decision.subtitle": "Traceable AI research",
    "panel.history.title": "Run History",
    "panel.history.subtitle": "Recent audited runs",
    "history.replay": "Replay",
    "history.export": "Export",
    "history.import": "Import",
    "history.active": "Active run",
    "history.rows": "{count} bars",
    "history.revision": "Revision",
    "history.execution": "Execution",
    "history.comparison": "Run comparison",
    "history.current": "Current",
    "history.previous": "Previous",
    "history.delta": "Delta",
    "history.changed": "changed",
    "history.unchanged": "same",
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
    "portfolio.paperPositions": "Paper positions",
    "portfolio.avgCost": "Avg cost",
    "portfolio.markPrice": "Mark",
    "portfolio.marketValue": "Market value",
    "portfolio.unrealizedPnl": "Unrealized P&L",
    "portfolio.returnPct": "Return",
    "module.broker.title": "Broker Center",
    "module.broker.subtitle": "Adapter certification and live-trading gates",
    "broker.adapter": "Adapter",
    "broker.market": "Market",
    "broker.route": "Route",
    "broker.status": "Status",
    "broker.certification": "Certification",
    "broker.nextStep": "Next step",
    "module.news.title": "News & Events",
    "module.news.subtitle": "Quote, audit, risk, and AI context",
    "module.news.context": "Local evidence stream",
    "module.workflow.title": "Node Workflow",
    "module.workflow.subtitle": "A+C orchestration surface",
    "module.workflow.canvas": "Node canvas",
    "module.workflow.output": "Output",
    "module.workflow.artifacts": "Stage artifacts",
    "module.workflow.log": "Run log",
    "module.workflow.idle": "No workflow run yet",
    "module.workflow.run": "Run pipeline",
    "strategy.name": "Name",
    "strategy.entry": "Entry",
    "strategy.exit": "Exit",
    "strategy.position": "Position",
    "strategy.risk": "Risk",
    "strategy.rules": "Rule matrix",
    "strategy.condition": "Condition",
    "strategy.parameter": "Parameter",
    "strategy.status": "Status",
    "strategy.builder": "Structured builder",
    "strategy.templates": "Templates",
    "strategy.template.smaTrend": "SMA trend",
    "strategy.template.smaTrend.description": "SMA20 baseline",
    "strategy.template.rsiReversal": "RSI reversal",
    "strategy.template.rsiReversal.description": "RSI14 mean reversion",
    "strategy.template.volumeBreakout": "Volume breakout",
    "strategy.template.volumeBreakout.description": "Price strength + VOL10",
    "strategy.auditRequired": "audit required",
    "strategy.entryCondition": "Entry condition",
    "strategy.exitCondition": "Exit condition",
    "strategy.entryWindow": "Entry SMA",
    "strategy.exitWindow": "Exit SMA",
    "strategy.entryThreshold": "Entry RSI",
    "strategy.exitThreshold": "Exit RSI",
    "strategy.rsiConfirm": "RSI confirmation",
    "strategy.rsiWindow": "RSI window",
    "strategy.rsiThreshold": "RSI threshold",
    "strategy.volumeConfirm": "Volume confirmation",
    "strategy.volumeWindow": "Volume MA",
    "strategy.condition.closeAboveSma": "Close > SMA",
    "strategy.condition.closeBelowSma": "Close < SMA",
    "strategy.condition.rsiBelow": "RSI below",
    "strategy.condition.rsiAbove": "RSI above",
    "strategy.positionPct": "Position cap",
    "strategy.stopLossPct": "Stop loss",
    "strategy.takeProfitPct": "Take profit",
    "strategy.maxDrawdownPct": "Max drawdown",
    "strategy.generatedSnapshot": "Auditable snapshot",
    "strategy.readiness": "Readiness gates",
    "strategy.saveVersion": "Save version",
    "strategy.saving": "Saving",
    "strategy.library": "Strategy library",
    "strategy.libraryEmpty": "No saved strategy versions yet.",
    "strategy.loadVersion": "Load",
    "strategy.loadedVersion": "Loaded",
    "strategy.context": "Context",
    "strategy.auditRun": "Audit run",
    "strategy.diff": "Diff",
    "strategy.diffChanged": "{count} changes",
    "strategy.diffSame": "same as draft",
    "backtest.replay": "Trade replay",
    "backtest.assumptions": "Backtest assumptions",
    "backtest.parameterScan": "Parameter sensitivity",
    "backtest.entrySma": "Entry SMA",
    "backtest.exitSma": "Exit SMA",
    "backtest.stageCandidate": "Stage",
    "backtest.exportMarkdown": "Export report",
    "aiReview.exportMarkdown": "Export AI report",
    "aiReview.exportRecord": "Export run record",
    "aiReview.saveRecord": "Save record",
    "aiReview.savingRecord": "Saving",
    "aiReview.savedRecords": "Saved review records",
    "aiReview.noSavedRecords": "No saved AI review records",
    "aiReview.noSavedRecordsDetail": "Save the current audited review so replay and risk approval can cite the same evidence package.",
    "aiReview.citations": "citations",
    "aiReview.rounds": "rounds",
    "aiReview.boundary": "evidence only",
    "backtest.initialCash": "Initial cash",
    "backtest.feeBps": "Fee",
    "backtest.slippageBps": "Slippage",
    "backtest.time": "Time",
    "backtest.exposure": "Exposure",
    "backtest.pnl": "P&L",
    "execution.accountSync": "Account Sync",
    "execution.paperAccount": "paper account",
    "execution.positions": "Positions",
    "execution.positionsValue": "4 watched / 0 live",
    "execution.riskState": "Risk State",
    "execution.liveBlocked": "live blocked",
    "execution.paperBlotter": "Paper blotter",
    "execution.submitPaper": "Submit paper order",
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
    "section.quantLoop": "研究工作流",
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
    "moduleFocus.label": "当前任务",
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
    "panel.backtest.title": "回测回放",
    "panel.backtest.subtitle": "成交审计 · 回撤 · 出场复盘",
    "panel.nodeWorkflow.title": "节点工作流",
    "panel.nodeWorkflow.subtitle": "可视化流水线",
    "panel.execution.title": "执行中心",
    "panel.execution.subtitle": "模拟优先 · 实盘需认证",
    "panel.agent.title": "智能体委员会",
    "panel.agent.subtitle": "TradingAgents 风格评审",
    "panel.agentRoles.title": "智能体角色",
    "panel.agentRoles.subtitle": "当前研究分工",
    "panel.agent.rounds": "委员会轮次",
    "panel.agent.evidence": "证据摘要",
    "panel.decision.title": "决策日志",
    "panel.decision.subtitle": "可追踪 AI 研究",
    "panel.history.title": "运行历史",
    "panel.history.subtitle": "近期审计运行",
    "history.replay": "回放",
    "history.export": "导出",
    "history.import": "导入",
    "history.active": "当前运行",
    "history.rows": "{count} 根K线",
    "history.revision": "版本",
    "history.execution": "执行",
    "history.comparison": "运行对比",
    "history.current": "当前",
    "history.previous": "上次",
    "history.delta": "变化",
    "history.changed": "已变化",
    "history.unchanged": "未变化",
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
    "portfolio.paperPositions": "模拟持仓",
    "portfolio.avgCost": "成本",
    "portfolio.markPrice": "现价",
    "portfolio.marketValue": "市值",
    "portfolio.unrealizedPnl": "未实现盈亏",
    "portfolio.returnPct": "收益率",
    "module.broker.title": "券商中心",
    "module.broker.subtitle": "适配器认证与实盘闸门",
    "broker.adapter": "适配器",
    "broker.market": "市场",
    "broker.route": "通道",
    "broker.status": "状态",
    "broker.certification": "认证状态",
    "broker.nextStep": "下一步",
    "module.news.title": "新闻事件",
    "module.news.subtitle": "行情、审计、风控与 AI 上下文",
    "module.news.context": "本地证据流",
    "module.workflow.title": "节点工作流",
    "module.workflow.subtitle": "A+C 编排入口",
    "module.workflow.canvas": "节点画布",
    "module.workflow.output": "输出",
    "module.workflow.artifacts": "节点产物",
    "module.workflow.log": "运行日志",
    "module.workflow.idle": "尚未运行工作流",
    "module.workflow.run": "运行流水线",
    "strategy.name": "名称",
    "strategy.entry": "入场",
    "strategy.exit": "出场",
    "strategy.position": "仓位",
    "strategy.risk": "风控",
    "strategy.rules": "规则矩阵",
    "strategy.condition": "条件",
    "strategy.parameter": "参数",
    "strategy.status": "状态",
    "strategy.builder": "结构化构建器",
    "strategy.templates": "策略模板",
    "strategy.template.smaTrend": "SMA 趋势",
    "strategy.template.smaTrend.description": "SMA20 趋势基线",
    "strategy.template.rsiReversal": "RSI 反转",
    "strategy.template.rsiReversal.description": "RSI14 均值回归",
    "strategy.template.volumeBreakout": "放量突破",
    "strategy.template.volumeBreakout.description": "价格强度 + VOL10",
    "strategy.auditRequired": "待审计",
    "strategy.entryCondition": "入场条件",
    "strategy.exitCondition": "出场条件",
    "strategy.entryWindow": "入场 SMA",
    "strategy.exitWindow": "出场 SMA",
    "strategy.entryThreshold": "入场 RSI",
    "strategy.exitThreshold": "出场 RSI",
    "strategy.rsiConfirm": "RSI 确认",
    "strategy.rsiWindow": "RSI 窗口",
    "strategy.rsiThreshold": "RSI 阈值",
    "strategy.volumeConfirm": "成交量确认",
    "strategy.volumeWindow": "成交量均线",
    "strategy.condition.closeAboveSma": "收盘价 > SMA",
    "strategy.condition.closeBelowSma": "收盘价 < SMA",
    "strategy.condition.rsiBelow": "RSI 低于",
    "strategy.condition.rsiAbove": "RSI 高于",
    "strategy.positionPct": "仓位上限",
    "strategy.stopLossPct": "止损",
    "strategy.takeProfitPct": "止盈",
    "strategy.maxDrawdownPct": "最大回撤",
    "strategy.generatedSnapshot": "可审计快照",
    "strategy.readiness": "就绪闸门",
    "strategy.saveVersion": "保存版本",
    "strategy.saving": "保存中",
    "strategy.library": "策略库",
    "strategy.libraryEmpty": "还没有保存的策略版本。",
    "strategy.loadVersion": "载入",
    "strategy.loadedVersion": "已载入",
    "strategy.context": "上下文",
    "strategy.auditRun": "审计运行",
    "strategy.diff": "差异",
    "strategy.diffChanged": "{count} 项差异",
    "strategy.diffSame": "与草稿一致",
    "backtest.replay": "交易回放",
    "backtest.assumptions": "回测假设",
    "backtest.parameterScan": "参数敏感性",
    "backtest.entrySma": "入场 SMA",
    "backtest.exitSma": "出场 SMA",
    "backtest.stageCandidate": "暂存",
    "backtest.exportMarkdown": "导出报告",
    "aiReview.exportMarkdown": "导出 AI 报告",
    "aiReview.exportRecord": "导出运行记录",
    "aiReview.saveRecord": "保存运行记录",
    "aiReview.savingRecord": "保存中",
    "aiReview.savedRecords": "已保存评审记录",
    "aiReview.noSavedRecords": "暂无已保存 AI 评审记录",
    "aiReview.noSavedRecordsDetail": "保存当前审计评审后，回放和风控审批可以引用同一份证据包。",
    "aiReview.citations": "条引用",
    "aiReview.rounds": "轮",
    "aiReview.boundary": "仅解释证据",
    "backtest.initialCash": "初始资金",
    "backtest.feeBps": "手续费",
    "backtest.slippageBps": "滑点",
    "backtest.time": "时间",
    "backtest.exposure": "暴露",
    "backtest.pnl": "盈亏",
    "execution.accountSync": "账户同步",
    "execution.paperAccount": "模拟账户",
    "execution.positions": "持仓",
    "execution.positionsValue": "4 个观察 / 0 个实盘",
    "execution.riskState": "风控状态",
    "execution.liveBlocked": "实盘已阻断",
    "execution.paperBlotter": "模拟委托流水",
    "execution.submitPaper": "提交模拟委托",
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
    productWorkAreas: {
      market: "Market Center",
      research: "Research Terminal",
      strategy: "Strategy Lab",
      backtest: "Backtest Lab",
      "ai-review": "AI Review Board",
      portfolio: "Portfolio & Risk",
      execution: "Execution Center",
      audit: "Audit & Replay",
      settings: "Settings"
    },
    productWorkAreaDescriptions: {
      market: "Search, quotes, K-lines, source health",
      research: "Chart, factors, notes, context",
      strategy: "Rules, versions, risk configuration",
      backtest: "Assumptions, trades, reproducible run",
      "ai-review": "Evidence-locked agent committee",
      portfolio: "Exposure, positions, live gates",
      execution: "Paper orders and adapter readiness",
      audit: "Run history, import, export, replay",
      settings: "Data sources, API keys, safety gates"
    },
    productWorkAreaStatuses: {
      ready: "Ready",
      needs_run: "Run",
      blocked: "Blocked"
    },
    quantLoop: {
      research: "Market Research",
      idea: "Idea Lab",
      data: "Data & Factor",
      strategy: "Strategy Lab",
      backtest: "Backtest Review",
      "agent-review": "Agent Review",
      paper: "Paper Trading",
      broker: "Broker Center"
    },
    modules: {
      watchlist: "Watchlist",
      scanner: "Market Scanner",
      portfolio: "Portfolio Risk",
      news: "News & Events",
      broker: "Broker Center",
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
      news: "News and event agents are scoped to local quote, audit, risk, and AI evidence for {symbol}.",
      broker: "Broker adapters stay blocked until certification, risk checks, and human confirmation pass.",
      workflow: "Node workflow is staging data, factor, backtest, agent review, and execution for {symbol}."
    },
    quantLoopFocus: {
      research: "Load quotes and inspect the chart before promoting {symbol} into a strategy.",
      idea: "Capture the research hypothesis for {symbol}.",
      data: "Prepare market data, factors, and quality checks for {symbol}.",
      strategy: "Configure rules and ask the AI committee to draft improvements for {symbol}.",
      backtest: "Run an audited replay, compare history, and explain the result for {symbol}.",
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
      "Strategy version saved": "Strategy version saved",
      "Strategy version save failed": "Strategy version save failed",
      "Strategy version loaded": "Strategy version loaded",
      "Research run export ready": "Research run export ready",
      "Research run export failed": "Research run export failed",
      "Research run export package loaded": "Research run export package loaded",
      "Research run export inspect failed": "Research run export inspect failed",
      "Research run import ready": "Research run import ready",
      "Research run import failed": "Research run import failed",
      "Backtest report export ready": "Backtest report export ready",
      "Backtest report export failed": "Backtest report export failed",
      "Parameter candidate staged": "Parameter candidate staged",
      "AI review export ready": "AI review export ready",
      "AI review export failed": "AI review export failed",
      "AI review record saved": "AI review record saved",
      "AI review record save failed": "AI review record save failed",
      "AI review records loaded": "AI review records loaded",
      "Paper execution recorded": "Paper execution recorded",
      "Paper execution failed": "Paper execution failed",
      "Paper execution history loaded": "Paper execution history loaded",
      "Instrument selected": "Instrument selected",
      "Timeframe selected": "Timeframe selected",
      "Strategy edited": "Strategy edited",
      "Backtest assumptions edited": "Backtest assumptions edited",
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
    productWorkAreas: {
      market: "行情中心",
      research: "研究工作台",
      strategy: "策略工坊",
      backtest: "回测实验室",
      "ai-review": "AI 评审",
      portfolio: "组合风控",
      execution: "执行中心",
      audit: "审计回放",
      settings: "设置"
    },
    productWorkAreaDescriptions: {
      market: "搜索、报价、K线、数据源健康",
      research: "图表、因子、笔记、研究上下文",
      strategy: "规则、版本、风控配置",
      backtest: "假设、交易流水、可复现运行",
      "ai-review": "绑定证据的智能体委员会",
      portfolio: "敞口、持仓、实盘闸门",
      execution: "模拟委托和适配器状态",
      audit: "运行历史、导入、导出、回放",
      settings: "数据源、API Key、安全闸门"
    },
    productWorkAreaStatuses: {
      ready: "就绪",
      needs_run: "待运行",
      blocked: "阻断"
    },
    quantLoop: {
      research: "行情研究",
      idea: "想法实验室",
      data: "数据与因子",
      strategy: "策略工坊",
      backtest: "回测复盘",
      "agent-review": "智能体评审",
      paper: "模拟交易",
      broker: "券商中心"
    },
    modules: {
      watchlist: "自选列表",
      scanner: "市场扫描",
      portfolio: "组合风险",
      news: "新闻事件",
      broker: "券商中心",
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
      news: "新闻事件智能体已切到 {symbol} 的本地行情、审计、风控和 AI 证据。",
      broker: "券商适配器在认证、风控检查和人工确认前保持阻断。",
      workflow: "节点工作流正在围绕 {symbol} 串联数据、因子、回测、智能体评审和执行。"
    },
    quantLoopFocus: {
      research: "先加载 {symbol} 的行情和图表，再决定是否进入策略工坊。",
      idea: "记录 {symbol} 的研究假设。",
      data: "准备 {symbol} 的行情、因子和质量检查。",
      strategy: "配置 {symbol} 的规则，并让 AI 委员会生成改进草稿。",
      backtest: "运行 {symbol} 的可审计回放，对比历史并解释结果。",
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
      "Strategy version saved": "策略版本已保存",
      "Strategy version save failed": "策略版本保存失败",
      "Strategy version loaded": "策略版本已载入",
      "Research run export ready": "研究运行导出完成",
      "Research run export failed": "研究运行导出失败",
      "Research run export package loaded": "复现包已加载",
      "Research run export inspect failed": "复现包检查失败",
      "Research run import ready": "研究运行导入完成",
      "Research run import failed": "研究运行导入失败",
      "Backtest report export ready": "回测报告导出完成",
      "Backtest report export failed": "回测报告导出失败",
      "Parameter candidate staged": "参数候选已暂存",
      "AI review export ready": "AI 评审报告导出完成",
      "AI review export failed": "AI 评审报告导出失败",
      "AI review record saved": "AI 评审运行记录已保存",
      "AI review record save failed": "AI 评审运行记录保存失败",
      "AI review records loaded": "AI 评审运行记录已加载",
      "Paper execution recorded": "模拟执行已记录",
      "Paper execution failed": "模拟执行失败",
      "Paper execution history loaded": "模拟执行历史已加载",
      "Instrument selected": "标的已选择",
      "Timeframe selected": "周期已选择",
      "Strategy edited": "策略已编辑",
      "Backtest assumptions edited": "回测假设已编辑",
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
    "Paper only until a new audited run is available": "生成新的审计运行前仅允许模拟盘",
    "Ready for pipeline run": "等待流水线运行",
    pending: "待完善",
    "paper only": "仅模拟盘",
    "live gated": "实盘闸门",
    "needs run": "待运行",
    blocked: "阻断",
    "Entry and exit conditions are structured.": "入场和出场条件已结构化。",
    "Structured entry and exit rules are required before audit.": "审计前必须补齐结构化入场和出场规则。",
    "Position, stop, take profit, and drawdown guards are parseable.": "仓位、止损、止盈和回撤保护均可解析。",
    "Position sizing and risk guardrails must be explicit.": "仓位规则和风控闸门必须明确。",
    "Live routing stays blocked until adapter, risk, and human gates pass.":
      "适配器、风控和人工确认通过前，实盘通道保持阻断。",
    "This draft is bound to a reproducible audit run.": "该草稿已绑定可复现审计运行。",
    "Run Pipeline to bind this draft to a reproducible audit run.": "运行流水线后，将该草稿绑定到可复现审计运行。",
    "Fix blocked gates before running an audit pipeline.": "先修复阻断闸门，再运行审计流水线。",
    "Latest audited metric for the selected context.": "当前上下文的最新审计指标。",
    "Backtest capital assumption.": "回测资金假设。",
    "Round-trip fee assumption in basis points.": "以基点计的双边手续费假设。",
    "Execution slippage assumption in basis points.": "以基点计的执行滑点假设。"
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
    productWorkAreaLabel(area: ProductWorkArea) {
      return valueOf(labels.productWorkAreas, area.id, area.label);
    },
    productWorkAreaDescription(area: ProductWorkArea) {
      return valueOf(labels.productWorkAreaDescriptions, area.id, area.description);
    },
    productWorkAreaStatus(status: ProductWorkAreaStatus) {
      return valueOf(labels.productWorkAreaStatuses, status, status);
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
  const basisPoints = text.match(/^(\d+(?:\.\d+)?) bps$/);
  if (basisPoints) {
    return `${basisPoints[1]} 基点`;
  }
  const closeAboveSma = text.match(/^Close > SMA(\d+)$/);
  if (closeAboveSma) {
    return `收盘价 > SMA${closeAboveSma[1]}`;
  }
  const closeBelowSma = text.match(/^Close < SMA(\d+)$/);
  if (closeBelowSma) {
    return `收盘价 < SMA${closeBelowSma[1]}`;
  }
  const maxCapital = text.match(/^(\d+(?:\.\d+)?)% max capital allocation$/);
  if (maxCapital) {
    return `最大资金占用 ${maxCapital[1]}%`;
  }
  const structuredRisk = text.match(
    /^Stop -(\d+(?:\.\d+)?)%, take profit \+(\d+(?:\.\d+)?)%, drawdown guard (\d+(?:\.\d+)?)%, paper only$/
  );
  if (structuredRisk) {
    return `止损 -${structuredRisk[1]}%，止盈 +${structuredRisk[2]}%，回撤保护 ${structuredRisk[3]}%，仅模拟盘`;
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
  const auditedAiExplanation = message.match(
    /^Backtest explanation for (.+) using audited run (.+): return (.+), max drawdown (.+), trades (.+); no guaranteed outcome\.$/
  );
  if (auditedAiExplanation) {
    return `${auditedAiExplanation[1]} 审计运行 ${auditedAiExplanation[2]} 回测解释：收益率 ${auditedAiExplanation[3]}，最大回撤 ${auditedAiExplanation[4]}，交易数 ${auditedAiExplanation[5]}；不构成收益保证。`;
  }
  const aiExplanation = message.match(
    /^Backtest explanation for (.+): return (.+), max drawdown (.+), trades (.+); no guaranteed outcome\.$/
  );
  if (aiExplanation) {
    return `${aiExplanation[1]} 回测解释：收益率 ${aiExplanation[2]}，最大回撤 ${aiExplanation[3]}，交易数 ${aiExplanation[4]}；不构成收益保证。`;
  }
  const auditedAiDebate = message.match(
    /^Debate generated for (.+) using audited run (.+): bull case requires momentum confirmation; bear case flags drawdown and data quality\.$/
  );
  if (auditedAiDebate) {
    return `${auditedAiDebate[1]} 审计运行 ${auditedAiDebate[2]} 智能体辩论：多头观点需要动量确认；空头观点提示回撤和数据质量风险。`;
  }
  const aiDebate = message.match(
    /^Debate generated for (.+): bull case requires momentum confirmation; bear case flags drawdown and data quality\.$/
  );
  if (aiDebate) {
    return `${aiDebate[1]} 智能体辩论：多头观点需要动量确认；空头观点提示回撤和数据质量风险。`;
  }
  const blockedAiReview = message.match(
    /^AI (explanation|debate) blocked for (.+): run Pipeline to create an audited backtest first\.$/
  );
  if (blockedAiReview) {
    const action = blockedAiReview[1] === "explanation" ? "解释" : "辩论";
    return `${blockedAiReview[2]} AI ${action}已阻断：请先运行流水线生成可审计回测。`;
  }
  const strategyDraft = message.match(
    /^Strategy draft generated for (.+): keep paper-only execution until data, risk, and human gates pass\.$/
  );
  if (strategyDraft) {
    return `${strategyDraft[1]} 策略草稿已生成：数据、风控和人工闸门通过前保持模拟盘执行。`;
  }
  const strategyEdited = message.match(
    /^Strategy field (.+) updated locally\. Run Pipeline to generate a fresh audited backtest\.$/
  );
  if (strategyEdited) {
    return `策略字段 ${strategyFieldText(locale, strategyEdited[1])} 已本地更新。运行流水线以生成新的可审计回测。`;
  }
  const strategyLibraryLoaded = message.match(
    /^Strategy revision (.+) loaded for (.+) ((?:1d|1m|5m|15m|30m|60m))\. (?:Archived audit run (.+) remains read-only; )?Run Pipeline to generate a fresh audited backtest\.$/
  );
  if (strategyLibraryLoaded) {
    const archivedRun = strategyLibraryLoaded[4]
      ? `归档审计运行 ${strategyLibraryLoaded[4]} 保持只读；`
      : "";
    return `策略版本 ${strategyLibraryLoaded[1]} 已载入到 ${strategyLibraryLoaded[2]} ${strategyLibraryLoaded[3]}。${archivedRun}运行流水线以生成新的可审计回测。`;
  }
  const backtestAssumptionEdited = message.match(
    /^Backtest assumption (.+) updated locally\. Run Pipeline to generate a fresh audited backtest\.$/
  );
  if (backtestAssumptionEdited) {
    return `回测假设 ${backtestAssumptionFieldText(locale, backtestAssumptionEdited[1])} 已本地更新。运行流水线以生成新的可审计回测。`;
  }
  return message;
}

function strategyFieldText(locale: Locale, field: string): string {
  if (locale === "en-US") {
    return field;
  }
  return (
    {
      name: "名称",
      entry: "入场",
      exit: "出场",
      position: "仓位",
      risk: "风控"
    }[field] ?? field
  );
}

function backtestAssumptionFieldText(locale: Locale, field: string): string {
  if (locale === "en-US") {
    return field;
  }
  return (
    {
      initialCash: "初始资金",
      feeBps: "手续费",
      slippageBps: "滑点"
    }[field] ?? field
  );
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
    "AI Review Gate": "AI 评审闸门",
    Audit: "审计",
    Technical: "技术分析",
    Fundamental: "基本面",
    Risk: "风险",
    "Portfolio Manager": "组合经理",
    "AI Debate": "AI 辩论",
    "Strategy Drafter": "策略起草员",
    "Strategy Library": "策略库"
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
