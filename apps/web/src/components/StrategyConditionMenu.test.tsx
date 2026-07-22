import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { StrategyConditionMenu } from "../App";
import { createI18n } from "../lib/i18n";

describe("StrategyConditionMenu", () => {
  test("renders a themed single-choice menu instead of a native select", () => {
    const markup = renderToStaticMarkup(
      <StrategyConditionMenu
        i18n={createI18n("zh-CN")}
        kind="close_above_sma"
        label="入场条件"
        onChange={() => undefined}
        options={["close_above_sma", "rsi_below"]}
      />
    );

    expect(markup).toContain("<details");
    expect(markup).toContain("<summary");
    expect(markup).toContain("收盘价 &gt; SMA");
    expect(markup).toContain("RSI 低于");
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).not.toContain("<select");
  });
});
