import type { ReactNode } from "react";

import { App } from "./App";
import { AuthGate } from "./AuthGate";
import { McpConnectPage } from "./pages/mcp-connect/McpConnectPage";

export function AuthenticatedRoute({
  children,
  origin,
  pathname,
}: {
  children: ReactNode;
  origin: string;
  pathname: string;
}) {
  return pathname === "/connect/claude"
    ? <McpConnectPage origin={origin} />
    : children;
}

export function RootApp({ origin, pathname }: { origin: string; pathname: string }) {
  return (
    <AuthGate>
      <AuthenticatedRoute origin={origin} pathname={pathname}>
        <App />
      </AuthenticatedRoute>
    </AuthGate>
  );
}
