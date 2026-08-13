import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Circle, ShieldCheck } from "lucide-react";
import { bindPublicSession, parseDeploymentSession } from "./lib/public-auth";

type GateState = "loading" | "local" | "unauthenticated" | "authenticated" | "error";

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("loading");

  const refresh = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/auth/session", { credentials: "same-origin" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const session = parseDeploymentSession(await response.json());
      if ("deploymentMode" in session) {
        bindPublicSession({ authenticated: false });
        setState("local");
        return;
      }
      bindPublicSession(session);
      setState(session.authenticated ? "authenticated" : "unauthenticated");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const requireAuthentication = () => {
      bindPublicSession({ authenticated: false });
      setState("unauthenticated");
    };
    window.addEventListener("aiqt:authentication-required", requireAuthentication);
    return () => window.removeEventListener("aiqt:authentication-required", requireAuthentication);
  }, [refresh]);

  if (state === "local" || state === "authenticated") return children;
  const returnTo = state === "unauthenticated"
    ? encodeURIComponent(window.location.pathname + window.location.search)
    : "";
  return (
    <main className="auth-gate">
      <section aria-labelledby="auth-gate-title" className="auth-gate-story">
        <header className="auth-gate-brand">
          <img alt="" src="/aiqt-logo.png" />
          <div>
            <strong>AIQuantificationTools</strong>
            <span>智能量化研究工作台</span>
          </div>
        </header>

        <div className="auth-gate-copy">
          <h1 className="auth-gate-title" id="auth-gate-title">从数据到结论，<br />进入你的研究空间</h1>
          <p>行情筛选、策略研究、回测实验与 AI 评审，<br />在一个隔离的研究工作台中完成。</p>
        </div>

        <ol aria-label="研究流程" className="auth-gate-workflow">
          <li className="active"><span>行情</span><ArrowRight aria-hidden="true" /><Circle aria-hidden="true" /></li>
          <li><span>策略</span><ArrowRight aria-hidden="true" /><Circle aria-hidden="true" /></li>
          <li><span>回测</span><ArrowRight aria-hidden="true" /><Circle aria-hidden="true" /></li>
          <li><span>AI 评审</span><Circle aria-hidden="true" /></li>
        </ol>

        <p className="auth-gate-boundary">
          <ShieldCheck aria-hidden="true" size={18} />
          Research-only · Paper-only · Live blocked
        </p>
      </section>

      <section aria-labelledby="auth-gate-panel-title" className="auth-gate-panel">
        <div className="auth-gate-card">
          <header className="auth-gate-panel-header">
            <h2 id="auth-gate-panel-title">进入 AIQT 研究终端</h2>
            <p>使用你的账号继续</p>
          </header>

          <div className="auth-gate-state">
          {state === "unauthenticated" ? (
            <>
              <div className="auth-gate-actions">
                <a className="primary auth-gate-action" href={`/api/auth/login?returnTo=${returnTo}`}>
                  使用本站账号继续
                </a>
              </div>
              <p className="auth-gate-note">
                没有账号？<a className="auth-gate-register" href={`/api/auth/login?returnTo=${returnTo}&flow=register`}>创建本站账号</a>
              </p>
              <div className="auth-gate-divider"><span>其他登录方式</span></div>
              <a className="auth-gate-action auth-gate-action-secondary" href={`/api/auth/login?returnTo=${returnTo}&flow=google`}>
                <img alt="" src="/google-g.svg" />
                使用 Google 登录
              </a>
              <p className="auth-gate-safety">
                <ShieldCheck aria-hidden="true" size={18} />
                登录仅用于身份验证，不连接实盘，不自动提交订单
              </p>
            </>
          ) : state === "error" ? (
            <>
              <p className="auth-gate-error" role="alert">无法确认登录状态，请检查网络后重试。</p>
              <button className="primary auth-gate-action" onClick={() => void refresh()} type="button">重新检查</button>
            </>
          ) : <p className="auth-gate-loading" role="status">正在确认登录状态…</p>}
          </div>

          <footer className="auth-gate-footer">
            <a href="/privacy.html"><ShieldCheck aria-hidden="true" size={15} />隐私政策</a>
            <span className="auth-gate-system-status"><i aria-hidden="true" />系统正常</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
