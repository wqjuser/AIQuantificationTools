from __future__ import annotations

from quant_core.domain import AiResearchReport, AiResearchRequest


class LocalResearchAssistant:
    """Deterministic first-version AI-style analyst used before external model keys are configured."""

    def analyze(self, request: AiResearchRequest) -> AiResearchReport:
        metrics = request.metrics
        summary = (
            f"{request.strategy_name} 在 {request.market} 样本中的回测收益为 "
            f"{metrics.total_return_pct:.2f}%，最大回撤为 {metrics.max_drawdown_pct:.2f}%，"
            f"胜率为 {metrics.win_rate_pct:.2f}%，共触发 {metrics.trade_count} 条交易记录。"
        )

        risks: list[str] = []
        if metrics.trade_count < 10:
            risks.append("交易次数偏少，样本可能不足以支撑稳定结论。")
        if metrics.max_drawdown_pct > 15:
            risks.append("最大回撤偏高，进入模拟盘前应收紧仓位和止损规则。")
        if metrics.profit_factor < 1:
            risks.append("盈亏比低于 1，当前规则在样本中没有形成正向收益结构。")
        if not risks:
            risks.append("回测表现需要结合更长周期、更多标的和不同市场环境复核。")

        improvements = [
            "加入基准指数对比，区分策略收益和市场贝塔。",
            "补充手续费、滑点和停牌/无成交场景，提升结果保守性。",
            "对关键参数做网格或滚动窗口验证，观察策略对参数变化的敏感度。",
        ]

        return AiResearchReport(
            summary=summary,
            risks=risks,
            improvements=improvements,
            disclaimer="研究报告仅用于复盘和风险识别，不构成投资建议或收益承诺。",
        )
