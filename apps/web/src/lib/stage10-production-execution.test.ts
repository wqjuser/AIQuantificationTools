import { describe, expect, test } from "vitest";
import { runStage10PermissionVerification } from "./stage10-production-execution";

describe("Stage 10 production permission errors", () => {
  test("explains a failed Binance permission call instead of showing HTTP 409", async () => {
    const fetcher = async () => new Response(JSON.stringify({
      blockers: ["stage10_production_trading_permission_check_failed"],
    }), { status: 409, headers: { "Content-Type": "application/json" } });

    await expect(runStage10PermissionVerification(
      "http://127.0.0.1:8765",
      "preflight-1",
      "wenqingjie",
      fetcher,
    )).rejects.toThrow("Binance 权限核验请求失败，请检查网络、API Key、IP 白名单和现货交易权限");
  });
});
