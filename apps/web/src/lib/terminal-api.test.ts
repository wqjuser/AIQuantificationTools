import { describe, expect, test } from "vitest";
import { buildTerminalWorkspace } from "./terminal-workbench";
import {
  buildResearchRunUrl,
  buildWorkspaceUrl,
  loadTerminalWorkspace,
  resolveQuantCoreBaseUrl,
  runTerminalResearch
} from "./terminal-api";

describe("terminal workspace API client", () => {
  test("builds the local core workspace URL without duplicate slashes", () => {
    expect(buildWorkspaceUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/workspace");
  });

  test("builds the research run URL with selected instrument context", () => {
    expect(buildResearchRunUrl("http://127.0.0.1:8765/", "ashare", "600000", "1d")).toBe(
      "http://127.0.0.1:8765/api/research/run?market=ashare&symbol=600000&timeframe=1d"
    );
  });

  test("resolves the local core base URL from Vite environment with a default", () => {
    expect(resolveQuantCoreBaseUrl({ VITE_QUANT_API_BASE: "http://localhost:9999" })).toBe("http://localhost:9999");
    expect(resolveQuantCoreBaseUrl({})).toBe("http://127.0.0.1:8765");
  });

  test("loads the workspace contract from the Python core", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      schemaVersion: 1,
      selectedInstrument: {
        symbol: "AAPL",
        name: "Apple",
        market: "us",
        changePct: -0.36
      }
    };
    const calls: string[] = [];
    const result = await loadTerminalWorkspace("http://127.0.0.1:8765/", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => remoteWorkspace
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/workspace"]);
    expect(result.source).toBe("core");
    expect(result.statusLabel).toBe("Core connected");
    expect(result.workspace.selectedInstrument.symbol).toBe("AAPL");
  });

  test("falls back to the bundled workspace when the Python core is unavailable", async () => {
    const result = await loadTerminalWorkspace("http://127.0.0.1:8765", async () => {
      throw new Error("offline");
    });

    expect(result.source).toBe("fallback");
    expect(result.statusLabel).toBe("Offline snapshot");
    expect(result.workspace.execution.liveEnabled).toBe(false);
    expect(result.workspace.selectedInstrument.symbol).toBe("600000");
  });

  test("runs terminal research and returns a core-backed workspace", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      schemaVersion: 1,
      metrics: [
        { label: "Return", value: "+3.20%", tone: "positive" },
        { label: "Max DD", value: "1.10%", tone: "warning" },
        { label: "Win Rate", value: "50.00%", tone: "neutral" },
        { label: "Trades", value: "8", tone: "neutral" }
      ]
    };
    const calls: string[] = [];
    const result = await runTerminalResearch(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      buildTerminalWorkspace(),
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => remoteWorkspace
        };
      }
    );

    expect(calls[0]).toContain("/api/research/run?");
    expect(result.source).toBe("core");
    expect(result.statusLabel).toBe("Research run complete");
    expect(result.workspace.metrics[0].value).toBe("+3.20%");
  });

  test("keeps the current workspace when research run fails", async () => {
    const currentWorkspace = buildTerminalWorkspace();
    const result = await runTerminalResearch(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      currentWorkspace,
      async () => {
        throw new Error("core offline");
      }
    );

    expect(result.source).toBe("fallback");
    expect(result.statusLabel).toBe("Research run failed");
    expect(result.workspace).toBe(currentWorkspace);
    expect(result.error).toBe("core offline");
  });
});
