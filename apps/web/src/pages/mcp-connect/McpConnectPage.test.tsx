import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";

import { AuthenticatedRoute, RootApp } from "../../RootApp";
import { bindPublicSession } from "../../lib/public-auth";
import {
  McpConnectPage,
  buildClaudeCustomConnectorUrl,
} from "./McpConnectPage";

const publicOrigin = "https://research.example.com";
const expectedClaudeUrl =
  "https://claude.ai/customize/connectors?modal=add-custom-connector" +
  "&connectorName=AIQuantificationTools" +
  "&connectorUrl=https%3A%2F%2Fresearch.example.com%2Fmcp";

describe("third-party AI MCP connection", () => {
  afterEach(() => bindPublicSession({ authenticated: false }));

  function enableClaudeConnection() {
    bindPublicSession({
      authenticated: true,
      ownerId: "owner-a",
      email: "researcher@example.com",
      csrfToken: "csrf-a",
      reauthenticationRequired: false,
      claudeConnectEnabled: true,
    });
  }

  test("builds the official Claude custom connector link from the public origin", () => {
    expect(buildClaudeCustomConnectorUrl(publicOrigin)).toBe(expectedClaudeUrl);
  });

  test.each([
    "http://research.example.com",
    "http://localhost:5173",
    "https://localhost",
    "http://127.0.0.1:5173",
    "https://127.0.0.1",
  ])("blocks installation when %s is not a public HTTPS origin", (origin) => {
    enableClaudeConnection();
    const markup = renderToStaticMarkup(<McpConnectPage origin={origin} />);

    expect(buildClaudeCustomConnectorUrl(origin)).toBeNull();
    expect(markup).toContain("需要公网 HTTPS 部署");
    expect(markup).not.toContain("claude.ai");
    expect(markup).not.toContain('data-testid="claude-connector-install"');
  });

  test("presents Claude and CLI connection options with the same read-only boundary", () => {
    enableClaudeConnection();
    const markup = renderToStaticMarkup(<McpConnectPage origin={publicOrigin} />);

    expect(markup).toContain("连接第三方 AI");
    expect(markup).toContain("连接到 Claude");
    expect(markup).toContain("Claude Code");
    expect(markup).toContain("claude mcp add --transport http --scope user aiqt https://research.example.com/mcp");
    expect(markup).toContain("Codex CLI");
    expect(markup).toContain("codex mcp add aiqt --url https://research.example.com/mcp --oauth-client-id aiqt-codex-cli --oauth-resource https://research.example.com/mcp");
    expect(markup).toContain("codex mcp login aiqt --scopes aiqt:research:read,offline_access -c mcp_oauth_callback_port=5555");
    expect(markup).toContain(
      "href=\"https://claude.ai/customize/connectors?modal=add-custom-connector",
    );
    expect(markup.match(/data-testid="claude-connector-install"/g)).toHaveLength(1);
    for (const tool of [
      "aiqt_get_system_status",
      "aiqt_search_instruments",
      "aiqt_read_market_context",
      "aiqt_list_research_runs",
      "aiqt_get_research_run",
      "aiqt_get_strategy_research",
      "aiqt_get_paper_status",
      "aiqt_list_research_audit_events",
    ]) {
      expect(markup).toContain(tool);
    }
    expect(markup).toContain("仅限读取研究数据");
    expect(markup).toContain("不提供策略晋级、策略绑定、自动交易控制、Testnet、Live 或任何下单能力");
    expect(markup).not.toContain("Client Secret");
    expect(markup).not.toContain("Keycloak");
    expect(markup).not.toContain("<form");
    expect(markup).not.toContain("<input");
  });

  test("does not expose a Claude install target until the administrator enables it", () => {
    bindPublicSession({
      authenticated: true,
      ownerId: "owner-a",
      email: "researcher@example.com",
      csrfToken: "csrf-a",
      reauthenticationRequired: false,
      claudeConnectEnabled: false,
    });

    const markup = renderToStaticMarkup(<McpConnectPage origin={publicOrigin} />);
    bindPublicSession({ authenticated: false });
    const localMarkup = renderToStaticMarkup(
      <McpConnectPage origin="http://localhost:5173" />,
    );

    expect(markup).toContain("管理员尚未启用第三方 AI 连接");
    expect(markup).not.toContain("href=\"https://claude.ai");
    expect(markup).not.toContain('data-testid="claude-connector-install"');
    expect(localMarkup).toContain("需要公网 HTTPS 部署");
    expect(localMarkup).not.toContain("href=\"https://claude.ai");
    expect(localMarkup).not.toContain('data-testid="claude-connector-install"');
  });

  test("keeps the legacy Claude route compatible without adding a new generic page", () => {
    enableClaudeConnection();
    const legacyConnection = renderToStaticMarkup(
      <AuthenticatedRoute origin={publicOrigin} pathname="/connect/claude">
        <p>研究工作台</p>
      </AuthenticatedRoute>,
    );
    const workspace = renderToStaticMarkup(
      <AuthenticatedRoute origin={publicOrigin} pathname="/connect/ai">
        <p>研究工作台</p>
      </AuthenticatedRoute>,
    );

    expect(legacyConnection).toContain("连接第三方 AI");
    expect(legacyConnection).not.toContain("研究工作台");
    expect(workspace).toContain("研究工作台");
    expect(workspace).not.toContain("连接第三方 AI");
  });

  test("keeps the public connection URL behind the existing authentication gate", () => {
    const markup = renderToStaticMarkup(
      <RootApp origin={publicOrigin} pathname="/connect/claude" />,
    );

    expect(markup).toContain("正在确认登录状态");
    expect(markup).not.toContain("连接第三方 AI");
  });
});
