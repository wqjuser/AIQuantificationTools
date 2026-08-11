import { describe, expect, test } from "vitest";

import {
  authenticatedActor,
  bindPublicSession,
  isClaudeConnectEnabled,
  parseAuthSession,
  parseDeploymentSession,
  parsePublicLogoutRedirect,
  prepareAuthenticatedRequest,
} from "./public-auth";

describe("public authentication transport", () => {
  test("accepts only an HTTPS identity-provider logout redirect", () => {
    expect(parsePublicLogoutRedirect({
      loggedOut: true,
      logoutUrl: "https://auth.example.com/realms/aiqt/protocol/openid-connect/logout",
    })).toBe("https://auth.example.com/realms/aiqt/protocol/openid-connect/logout");
    expect(() => parsePublicLogoutRedirect({ loggedOut: true, logoutUrl: "/" }))
      .toThrow("invalid_public_logout");
    expect(() => parsePublicLogoutRedirect({
      loggedOut: true,
      logoutUrl: "http://auth.example.com/logout",
    })).toThrow("invalid_public_logout");
  });

  test("parses only a complete authenticated session", () => {
    expect(parseDeploymentSession({ deploymentMode: "local", authenticated: false })).toEqual({
      deploymentMode: "local",
    });
    expect(parseAuthSession({ authenticated: false })).toEqual({ authenticated: false });
    expect(parseAuthSession({
      authenticated: true,
      ownerId: "owner-a",
      email: "user@example.com",
      csrfToken: "csrf-a",
      reauthenticationRequired: false,
      claudeConnectEnabled: true,
    })).toMatchObject({
      ownerId: "owner-a",
      email: "user@example.com",
      claudeConnectEnabled: true,
    });
    expect(() => parseAuthSession({
      authenticated: true,
      ownerId: "owner-a",
      email: "user@example.com",
      csrfToken: "csrf-a",
      reauthenticationRequired: false,
    })).toThrow("invalid_auth_session");
    expect(() => parseAuthSession({
      authenticated: true,
      ownerId: "owner-a",
      email: "user@example.com",
      csrfToken: "csrf-a",
      reauthenticationRequired: false,
      claudeConnectEnabled: "true",
    })).toThrow("invalid_auth_session");
    expect(() => parseAuthSession({ authenticated: true })).toThrow("invalid_auth_session");
  });

  test("binds csrf and the authenticated actor without rewriting imported history", () => {
    bindPublicSession({
      authenticated: true,
      ownerId: "owner-a",
      email: "user@example.com",
      csrfToken: "csrf-a",
      reauthenticationRequired: false,
      claudeConnectEnabled: true,
    });

    const request = prepareAuthenticatedRequest(
      "/api/research/runs/import",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operator: "browser-value",
          artifact: { author: "historical-author@example.com" },
        }),
      },
      "https://research.example.com",
    );

    expect(new Headers(request.init.headers).get("X-AIQT-CSRF")).toBe("csrf-a");
    expect(JSON.parse(String(request.init.body))).toEqual({
      operator: "user@example.com",
      artifact: { author: "historical-author@example.com" },
    });
    expect(authenticatedActor()).toBe("user@example.com");
    expect(isClaudeConnectEnabled()).toBe(true);
  });

  test("does not attach tenant credentials to another origin", () => {
    const request = prepareAuthenticatedRequest(
      "https://api.example.net/v1/models",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      "https://research.example.com",
    );

    expect(new Headers(request.init.headers).has("X-AIQT-CSRF")).toBe(false);
  });
});
