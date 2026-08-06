import { useCallback, useEffect, useState, type ReactNode } from "react";
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
  return (
    <main className="auth-gate">
      <section aria-labelledby="auth-gate-title" className="auth-gate-card">
        <header className="auth-gate-brand">
          <img alt="" src="/aiqt-logo.png" />
          <div>
            <strong>AIQuantificationTools</strong>
            <span>智能量化研究工作台</span>
          </div>
        </header>

        <div className="auth-gate-copy">
          <h1 className="auth-gate-title" id="auth-gate-title">登录你的研究空间</h1>
          <p>完成行情筛选、研究、策略、回测与 AI 评审。每个账号拥有独立的数据与设置。</p>
        </div>

        <div aria-live="polite" className="auth-gate-state">
          {state === "unauthenticated" ? (
            <>
              <a className="primary auth-gate-action" href={`/api/auth/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}>
                使用 Google 账号继续
              </a>
              <p className="auth-gate-note">首次登录会自动创建研究空间。登录不会授权实盘，也不会自动提交订单。</p>
            </>
          ) : state === "error" ? (
            <>
              <p className="auth-gate-error">无法确认登录状态，请检查网络后重试。</p>
              <button className="primary auth-gate-action" onClick={() => void refresh()} type="button">重新检查</button>
            </>
          ) : <p className="auth-gate-loading">正在确认登录状态…</p>}
        </div>

        <footer className="auth-gate-footer">
          <span>Google 账号仅用于身份验证与数据隔离</span>
          <a href="/privacy.html">隐私政策</a>
        </footer>
      </section>
    </main>
  );
}
