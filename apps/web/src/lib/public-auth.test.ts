import { describe, expect, test } from "vitest";

import {
  authenticatedActor,
  bindPublicSession,
  parseAuthSession,
  parseDeploymentSession,
  prepareAuthenticatedRequest,
} from "./public-auth";

describe("public authentication transport", () => {
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
    })).toMatchObject({ ownerId: "owner-a", email: "user@example.com" });
    expect(() => parseAuthSession({ authenticated: true })).toThrow("invalid_auth_session");
  });

  test("binds csrf and the authenticated actor without rewriting imported history", () => {
    bindPublicSession({
      authenticated: true,
      ownerId: "owner-a",
      email: "user@example.com",
      csrfToken: "csrf-a",
      reauthenticationRequired: false,
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
