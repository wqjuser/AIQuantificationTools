import { ExternalLink, ShieldCheck } from "lucide-react";

import { hasPublicSession, isClaudeConnectEnabled } from "../../lib/public-auth";
import "./McpConnectPage.layout.css";

const CLAUDE_CONNECTOR_URL = "https://claude.ai/customize/connectors";
const CONNECTOR_NAME = "AIQuantificationTools";

const readOnlyTools = [
  ["aiqt_get_system_status", "系统与安全状态"],
  ["aiqt_search_instruments", "市场标的搜索"],
  ["aiqt_read_market_context", "行情研究上下文"],
  ["aiqt_list_research_runs", "研究运行列表"],
  ["aiqt_get_research_run", "研究运行详情"],
  ["aiqt_get_strategy_research", "策略研发证据"],
  ["aiqt_get_paper_status", "安全的 Paper 状态"],
  ["aiqt_list_research_audit_events", "研究审计记录"],
] as const;

function trustedPublicHttpsOrigin(origin: string): string | null {
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();
    const isLoopback =
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.startsWith("127.") ||
      hostname === "[::1]" ||
      hostname === "0.0.0.0";
    if (parsed.protocol !== "https:" || parsed.origin !== origin || isLoopback) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export function buildClaudeCustomConnectorUrl(origin: string): string | null {
  const trustedOrigin = trustedPublicHttpsOrigin(origin);
  if (!trustedOrigin) return null;
  const connectorUrl = `${trustedOrigin}/mcp`;
  return (
    `${CLAUDE_CONNECTOR_URL}?modal=add-custom-connector` +
    `&connectorName=${encodeURIComponent(CONNECTOR_NAME)}` +
    `&connectorUrl=${encodeURIComponent(connectorUrl)}`
  );
}

export function McpConnectPage({ embedded = false, origin }: { embedded?: boolean; origin: string }) {
  const connectEnabled = isClaudeConnectEnabled();
  const publicSession = hasPublicSession();
  const publicOrigin = trustedPublicHttpsOrigin(origin);
  const resourceUrl = publicOrigin ? `${publicOrigin}/mcp` : null;
  const installUrl = buildClaudeCustomConnectorUrl(origin);

  const Page = embedded ? "div" : "main";
  return (
    <Page className={`mcp-connect-page${embedded ? " is-dialog" : ""}`}>
      <section aria-labelledby="mcp-connect-title" className="mcp-connect-card">
        <header className="mcp-connect-brand">
          <img alt="" src="/aiqt-logo.png" />
          <div>
            <strong>AIQuantificationTools</strong>
            <span>第三方 AI · 只读 MCP</span>
          </div>
        </header>

        {!publicSession && !publicOrigin ? (
          <div className="mcp-connect-intro mcp-connect-deployment-required" role="status">
            <span className="mcp-connect-kicker">部署要求</span>
            <h1 id="mcp-connect-title">需要公网 HTTPS 部署</h1>
            <p>当前地址仅适合本机研究。完成公网部署并通过 HTTPS 打开此页面后，连接按钮才会启用。</p>
          </div>
        ) : !connectEnabled ? (
          <div className="mcp-connect-intro mcp-connect-deployment-required" role="status">
            <span className="mcp-connect-kicker">暂未开放</span>
            <h1 id="mcp-connect-title">管理员尚未启用第三方 AI 连接</h1>
            <p>当前部署尚未完成 AI 客户端连接验收。管理员启用后，此处会显示可用的连接方式。</p>
          </div>
        ) : installUrl && resourceUrl ? (
          <>
            <div className="mcp-connect-intro">
              <span className="mcp-connect-kicker">只读研究连接</span>
              <h1 id="mcp-connect-title">连接第三方 AI</h1>
              <p>
                选择你的 AI 客户端，通过同一个安全 MCP 地址读取当前账号的研究证据。
              </p>
              <code className="mcp-connect-resource">{resourceUrl}</code>
            </div>

            <section aria-label="支持的 AI 客户端" className="mcp-connect-clients">
              <article className="mcp-connect-client">
                <div>
                  <span className="mcp-connect-client-kind">网页端 / Desktop</span>
                  <h2>Claude</h2>
                  <p>一键预填连接器名称和地址，确认并登录即可使用。</p>
                </div>
                <a
                  className="mcp-connect-install"
                  data-testid="claude-connector-install"
                  href={installUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  连接到 Claude
                  <ExternalLink aria-hidden="true" size={17} strokeWidth={2} />
                </a>
                <h3>Claude Code</h3>
                <pre><code>{`claude mcp add --transport http --scope user aiqt ${resourceUrl}\nclaude mcp login aiqt`}</code></pre>
              </article>

              <article className="mcp-connect-client">
                <div>
                  <span className="mcp-connect-client-kind">命令行</span>
                  <h2>Codex CLI</h2>
                  <p>添加本站 MCP 后，通过浏览器完成账号登录和授权。</p>
                </div>
                <pre><code>{`codex mcp add aiqt --url ${resourceUrl} --oauth-client-id aiqt-codex-cli --oauth-resource ${resourceUrl}\ncodex mcp login aiqt --scopes aiqt:research:read,offline_access -c mcp_oauth_callback_port=5555`}</code></pre>
              </article>
            </section>
          </>
        ) : (
          <div className="mcp-connect-intro mcp-connect-deployment-required" role="status">
            <span className="mcp-connect-kicker">部署要求</span>
            <h1 id="mcp-connect-title">需要公网 HTTPS 部署</h1>
            <p>当前地址仅适合本机研究。完成公网部署并通过 HTTPS 打开此页面后，连接按钮才会启用。</p>
          </div>
        )}

        <section aria-labelledby="mcp-readonly-title" className="mcp-connect-capabilities">
          <div className="mcp-connect-section-heading">
            <ShieldCheck aria-hidden="true" size={19} strokeWidth={2} />
            <div>
              <h2 id="mcp-readonly-title">8 个只读研究工具</h2>
              <p>仅限读取研究数据</p>
            </div>
          </div>
          <ul>
            {readOnlyTools.map(([name, description]) => (
              <li key={name}>
                <code>{name}</code>
                <span>{description}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="mcp-connect-boundary">
          <strong>交易边界保持关闭</strong>
          <p>不提供策略晋级、策略绑定、自动交易控制、Testnet、Live 或任何下单能力。</p>
        </aside>
      </section>
    </Page>
  );
}
