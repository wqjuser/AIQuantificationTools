import { describe, expect, test } from "vitest";
import { buildTerminalWorkspace } from "./terminal-workbench";
import { buildWorkspaceUrl, loadTerminalWorkspace, resolveQuantCoreBaseUrl } from "./terminal-api";

describe("terminal workspace API client", () => {
  test("builds the local core workspace URL without duplicate slashes", () => {
    expect(buildWorkspaceUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/workspace");
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
});
