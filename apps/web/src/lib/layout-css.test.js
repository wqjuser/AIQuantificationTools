import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

function cssBlock(selector) {
  const start = styles.indexOf(`${selector} {`);
  if (start < 0) {
    return "";
  }
  const bodyStart = styles.indexOf("{", start);
  const bodyEnd = styles.indexOf("}", bodyStart);
  return styles.slice(bodyStart + 1, bodyEnd);
}

describe("terminal layout css", () => {
  test("keeps the watchlist chart height isolated from the strategy panel", () => {
    expect(appSource).toContain('className="strategy-panel"');
    expect(cssBlock(".center-grid")).toContain("grid-template-rows: auto auto auto;");
    expect(cssBlock(".center-grid")).toContain("align-content: start;");
    expect(cssBlock(".center-grid")).not.toContain("1fr");
    expect(cssBlock(".chart-panel")).toContain("height: clamp(380px, 48vh, 560px);");
    expect(cssBlock(".strategy-panel")).toContain("height: clamp(380px, 48vh, 560px);");
    expect(cssBlock(".strategy-panel")).toContain("overflow: hidden;");
    expect(cssBlock(".strategy-panel .strategy-workbench")).toContain("overflow: auto;");
    expect(cssBlock(".module-workspace-grid")).toContain("grid-template-rows: minmax(0, 1fr);");
  });
});
