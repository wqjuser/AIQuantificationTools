import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildBrokerAdapterRows,
  buildTerminalWorkspace,
  type ProductWorkAreaId,
} from "../lib/terminal-workbench";
import { TerminalWorkspaceSurface } from "./TerminalWorkspaceSurface";

describe("TerminalWorkspaceSurface", () => {
  const workAreaIds: ProductWorkAreaId[] = [
    "market",
    "research",
    "strategy",
    "backtest",
    "ai-review",
    "portfolio",
    "execution",
    "audit",
    "settings",
  ];
  const workspace = buildTerminalWorkspace();
  const baseProps = {
    action: { label: "运行", onClick: () => undefined },
    adapterRows: buildBrokerAdapterRows(workspace),
    chart: <div>chart</div>,
    executionCandidate: null,
    onSelectInstrument: () => undefined,
    portfolio: null,
    runs: [],
    source: "fallback" as const,
    workspace,
  };

  it("renders a dedicated surface for every product work area", () => {
    for (const activeWorkAreaId of workAreaIds) {
      const markup = renderToStaticMarkup(
        <TerminalWorkspaceSurface
          {...baseProps}
          activeWorkAreaId={activeWorkAreaId}
        />,
      );
      expect(markup).toContain(`surface-${activeWorkAreaId}`);
      expect(markup).toContain("design-page-header");
    }
  });

  it("keeps live trading and order submission visibly blocked", () => {
    const execution = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="execution" />,
    );
    const settings = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="settings" />,
    );
    expect(execution).toContain("liveTradingAllowed=false");
    expect(execution).toContain("orderSubmissionEnabled=false");
    expect(settings).toContain("实盘阻断边界");
  });

  it("turns authoritative empty data into an explicit next-step state", () => {
    const backtest = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="backtest" />,
    );
    const portfolio = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="portfolio" />,
    );
    const execution = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="execution" />,
    );

    expect(backtest).toContain("暂无权威净值曲线");
    expect(backtest).toContain("当前运行未产生交易");
    expect(portfolio).toContain("暂无可展示的组合腿");
    expect(execution).toContain("暂无权威影子候选");
    expect(execution).toContain("不会提交真实订单");
  });
});
