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
      <img alt="AIQuantificationTools" src="/aiqt-logo.png" />
      <h1>AIQuantificationTools</h1>
      {state === "unauthenticated" ? (
        <>
          <p>登录后进入你的独立研究空间。</p>
          <a className="primary" href={`/api/auth/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}>
            使用 OIDC 登录
          </a>
        </>
      ) : state === "error" ? (
        <>
          <p>无法确认登录状态，请检查服务后重试。</p>
          <button className="primary" onClick={() => void refresh()} type="button">重试</button>
        </>
      ) : <p>正在确认登录状态…</p>}
    </main>
  );
}
