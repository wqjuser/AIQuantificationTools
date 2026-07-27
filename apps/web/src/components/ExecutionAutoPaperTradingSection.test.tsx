import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AutoTradingLedger,
  AutoTradingRiskOverview,
  AutoTradingRuntimeHealth,
  autoTradingActionPath,
  autoTradingAttention,
  autoTradingErrorMessage,
  autoTradingNotification,
  ExecutionAutoPaperTradingSection,
  hasUnresolvedAutoOrder
} from "./ExecutionAutoPaperTradingSection";

describe("ExecutionAutoPaperTradingSection", () => {
  it("offers paper, testnet, and explicitly confirmed production modes", () => {
    const html = renderToStaticMarkup(
      <ExecutionAutoPaperTradingSection baseUrl="http://127.0.0.1:8765" />
    );

    expect(html).toContain("纸面模拟");
    expect(html).toContain("Binance Spot Testnet");
    expect(html).toContain("Binance Spot 生产实盘");
    expect(html).toContain("保存并开启");
    expect(html).toContain("生产实盘会使用真实资金");
    expect(html).toContain("由后端每 35 秒");
    expect(html).toContain("关闭页面后仍会继续");
    expect(html).toContain("系统通知不可用");
  });

  it("recognizes only unresolved testnet and production orders for manual reconciliation", () => {
    expect(hasUnresolvedAutoOrder({
      executionMode: "live",
      lastLiveOrder: { state: "reconciliation_required" },
      lastTestnetOrder: null
    })).toBe(true);
    expect(hasUnresolvedAutoOrder({
      executionMode: "testnet",
      lastLiveOrder: null,
      lastTestnetOrder: { state: "filled" }
    })).toBe(false);
    expect(hasUnresolvedAutoOrder({
      executionMode: "paper",
      lastLiveOrder: null,
      lastTestnetOrder: null
    })).toBe(false);
  });

  it("uses the read-only reconciliation endpoint while an order is unresolved", () => {
    expect(autoTradingActionPath({
      executionMode: "live",
      lastLiveOrder: { state: "submission_pending" },
      lastTestnetOrder: null
    })).toBe("api/execution/auto-paper-trading/reconciliations");
    expect(autoTradingActionPath({
      executionMode: "live",
      lastLiveOrder: { state: "filled" },
      lastTestnetOrder: null
    })).toBe("api/execution/auto-paper-trading/evaluations");
  });

  it("explains account, authorization, and reconciliation blockers in plain Chinese", () => {
    expect(autoTradingAttention({
      status: "account_mismatch",
      detail: "account mismatch",
      executionMode: "live",
      lastLiveOrder: null,
      lastTestnetOrder: null,
      lastAccountCheck: {
        positionCovered: true,
        quoteCovered: false,
        unexpectedOpenAutoOrderCount: 0
      }
    })).toEqual({
      tone: "danger",
      title: "账户资产不足",
      detail: "可用 USDT 不足以覆盖下一笔预算。请补足资产或核对本地策略账本后重新检查。"
    });
    expect(autoTradingAttention({
      status: "account_mismatch",
      detail: "orphan order",
      executionMode: "testnet",
      lastLiveOrder: null,
      lastTestnetOrder: null,
      lastAccountCheck: {
        positionCovered: true,
        quoteCovered: true,
        unexpectedOpenAutoOrderCount: 1
      }
    })).toEqual({
      tone: "danger",
      title: "发现未记录的自动挂单",
      detail: "发现 1 笔未记录的自动挂单。请先在交易所核对并处理，再重新检查。"
    });
    expect(autoTradingAttention({
      status: "risk_paused",
      detail: "生产实盘会话未授权或已过期。",
      executionMode: "live",
      lastLiveOrder: null,
      lastTestnetOrder: null,
      lastAccountCheck: null
    })?.title).toBe("风险保护已暂停新交易");
    expect(autoTradingAttention({
      status: "order_pending",
      detail: "等待查询",
      executionMode: "testnet",
      lastLiveOrder: null,
      lastTestnetOrder: { state: "reconciliation_required" },
      lastAccountCheck: null
    })).toEqual({
      tone: "warning",
      title: "上一笔委托等待对账",
      detail: "系统已停止新委托；可点击“立即对账”查询原订单。"
    });
  });

  it("shows the latest automatic decision, trade cost, fee, mode, profit, and order state", () => {
    const html = renderToStaticMarkup(
      <AutoTradingLedger
        history={[{
          eventId: "auto-testnet-trade-1",
          createdAt: "2026-07-27T08:00:00Z",
          metadata: {
            executionMode: "testnet",
            side: "buy",
            symbol: "BTC/USDT",
            quantity: 0.00015,
            price: 65199.23,
            notional: 9.7798845,
            fee: 0.0097,
            feeEstimated: false,
            providerId: "openai-compatible",
            confidence: 0.82,
            reason: "五根涨幅超过阈值"
          }
        }]}
        state={{
          executionMode: "testnet",
          lastDecision: {
            action: "buy",
            confidence: 0.82,
            reason: "五根涨幅超过阈值",
            providerId: "openai-compatible",
            evaluatedAt: "2026-07-27T08:00:00Z"
          },
          lastLiveOrder: null,
          lastTestnetOrder: { state: "filled" },
          position: 0.00015,
          realizedPnl: 1.25
        }}
      />
    );

    expect(html).toContain("自动交易运行台账");
    expect(html).toContain("测试网");
    expect(html).toContain("买入 · 82%");
    expect(html).toContain("已实现盈亏");
    expect(html).toContain("+1.25 USDT");
    expect(html).toContain("已成交");
    expect(html).toContain("BTC/USDT");
    expect(html).toContain("65,199.23");
    expect(html).toContain("9.78 USDT");
    expect(html).toContain("0.0097 USDT · 交易所实报");
    expect(html).toContain("OpenAI 兼容服务");
    expect(html).toContain("五根涨幅超过阈值");
  });

  it("shows the exchange-reported fee currency when valuation is estimated", () => {
    const html = renderToStaticMarkup(
      <AutoTradingLedger
        history={[{
          eventId: "auto-testnet-trade-bnb-fee",
          createdAt: "2026-07-27T08:00:00Z",
          metadata: {
            executionMode: "testnet",
            side: "buy",
            symbol: "BTC/USDT",
            quantity: 0.00015,
            price: 65199.23,
            notional: 9.7798845,
            fee: 0.0097,
            feeEstimated: true,
            feeBreakdown: [{ currency: "BNB", cost: 0.00001 }],
            providerId: "rules",
            confidence: 0.82,
            reason: "五根涨幅超过阈值"
          }
        }]}
        state={{
          executionMode: "testnet",
          lastDecision: null,
          lastLiveOrder: null,
          lastTestnetOrder: { state: "filled" },
          position: 0.00015,
          realizedPnl: 0
        }}
      />
    );

    expect(html).toContain("0.0097 USDT · 估算");
    expect(html).toContain("实扣 0.00001 BNB");
  });

  it("uses a plain Chinese label for the built-in rules decision source", () => {
    const html = renderToStaticMarkup(
      <AutoTradingLedger
        history={[]}
        state={{
          executionMode: "testnet",
          lastDecision: {
            action: "hold",
            confidence: 1,
            reason: "涨跌幅尚未达到触发线",
            providerId: "rules"
          },
          lastLiveOrder: null,
          lastTestnetOrder: null,
          position: 0,
          realizedPnl: 0
        }}
      />
    );

    expect(html).toContain("规则引擎");
    expect(html).not.toContain(">rules<");
  });

  it("shows the active loss, frequency, exit-price, account, and authorization boundaries", () => {
    const html = renderToStaticMarkup(
      <AutoTradingRiskOverview state={{
        executionMode: "live",
        equity: 98.5,
        dailyStartEquity: 100,
        dailyLossLimitPct: 2,
        maxTradesPerHour: 3,
        tradeTimestamps: [
          "2026-07-27T07:40:00Z",
          "2026-07-27T07:50:00Z"
        ],
        position: 0.001,
        avgCost: 65000,
        stopLossPct: 1,
        takeProfitPct: 2,
        lastAccountCheck: {
          accountCovered: true,
          checkedAt: "2026-07-27T08:00:00Z",
          positionCovered: true,
          quoteCovered: true,
          unexpectedOpenAutoOrderCount: 0
        },
        liveAuthorizedUntil: "2026-07-27T12:00:00Z"
      }} />
    );

    expect(html).toContain("风险边界");
    expect(html).toContain("当日回撤");
    expect(html).toContain("1.50% / 2.00%");
    expect(html).toContain("剩余 1 次");
    expect(html).toContain("止损 64,350");
    expect(html).toContain("止盈 66,300");
    expect(html).toContain("账户覆盖");
    expect(html).toContain("已通过");
    expect(html).toContain("生产授权");
    expect(html).toContain("有效至");
  });

  it("shows a healthy backend heartbeat and recovered failure history", () => {
    const html = renderToStaticMarkup(
      <AutoTradingRuntimeHealth
        nowMs={Date.parse("2026-07-27T08:01:00Z")}
        state={{
          runnerState: "running",
          runnerIntervalSeconds: 35,
          runnerCycleCount: 42,
          consecutiveRunnerFailures: 0,
          lastRunnerCycleAt: "2026-07-27T08:00:50Z",
          lastRunnerSuccessAt: "2026-07-27T08:00:50Z",
          lastRunnerErrorAt: "2026-07-27T07:55:00Z"
        }}
      />
    );

    expect(html).toContain("后台运行正常");
    expect(html).toContain("已完成 42 轮");
    expect(html).toContain("上次异常已恢复");
  });

  it("warns when a running backend stops reporting heartbeats", () => {
    const html = renderToStaticMarkup(
      <AutoTradingRuntimeHealth
        nowMs={Date.parse("2026-07-27T08:03:00Z")}
        state={{
          runnerState: "running",
          runnerIntervalSeconds: 35,
          runnerCycleCount: 42,
          consecutiveRunnerFailures: 0,
          lastRunnerCycleAt: "2026-07-27T08:00:00Z",
          lastRunnerSuccessAt: "2026-07-27T08:00:00Z",
          lastRunnerErrorAt: null
        }}
      />
    );

    expect(html).toContain("后台心跳已中断");
    expect(html).not.toContain("后台运行正常");
  });

  it("builds one stable notification for an unresolved order", () => {
    expect(autoTradingNotification({
      status: "order_pending",
      detail: "等待查询",
      executionMode: "testnet",
      lastLiveOrder: null,
      lastTestnetOrder: { state: "reconciliation_required" },
      lastAccountCheck: null,
      runnerState: "running",
      runnerIntervalSeconds: 35,
      runnerCycleCount: 42,
      consecutiveRunnerFailures: 0,
      lastRunnerCycleAt: "2026-07-27T08:00:50Z",
      lastRunnerSuccessAt: "2026-07-27T08:00:50Z",
      lastRunnerErrorAt: null
    }, Date.parse("2026-07-27T08:01:00Z"))).toEqual({
      key: "attention:order_pending:reconciliation_required",
      title: "上一笔委托等待对账",
      body: "系统已停止新委托；可点击“立即对账”查询原订单。"
    });
  });

  it("builds a notification when the backend heartbeat is stale", () => {
    expect(autoTradingNotification({
      status: "monitoring",
      detail: "自动监控中",
      executionMode: "testnet",
      lastLiveOrder: null,
      lastTestnetOrder: null,
      lastAccountCheck: null,
      runnerState: "running",
      runnerIntervalSeconds: 35,
      runnerCycleCount: 42,
      consecutiveRunnerFailures: 0,
      lastRunnerCycleAt: "2026-07-27T08:00:00Z",
      lastRunnerSuccessAt: "2026-07-27T08:00:00Z",
      lastRunnerErrorAt: null
    }, Date.parse("2026-07-27T08:03:00Z"))).toEqual({
      key: "runner:stale",
      title: "后台心跳已中断",
      body: "自动交易后台已超过 105 秒未上报心跳。"
    });
  });

  it("builds one stable notification when the status API cannot be read", () => {
    expect(autoTradingNotification(
      undefined,
      Date.parse("2026-07-27T08:03:00Z"),
      "无法连接自动交易服务，请检查本地 API 是否运行。"
    )).toEqual({
      key: "connection:api",
      title: "自动交易服务连接中断",
      body: "无法连接自动交易服务，请检查本地 API 是否运行。"
    });
  });

  it("translates browser connection failures into actionable Chinese", () => {
    expect(autoTradingErrorMessage(new TypeError("Failed to fetch")))
      .toBe("无法连接自动交易服务，请检查本地 API 是否运行。");
  });
});
