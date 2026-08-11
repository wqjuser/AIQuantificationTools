import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";

import { createI18n } from "../../../lib/i18n";
import { bindPublicSession } from "../../../lib/public-auth";
import {
  buildProductWorkAreas,
  buildTerminalWorkspace,
} from "../../../lib/terminal-workbench";
import { NavigationRail } from "./NavigationRail";

const workspace = buildTerminalWorkspace();
const controller = {
  activeWorkAreaId: "market" as const,
  i18n: createI18n("zh-CN"),
  productWorkAreas: buildProductWorkAreas(workspace),
  selectProductWorkArea: () => undefined,
  workspace,
};

describe("NavigationRail public account links", () => {
  afterEach(() => bindPublicSession({ authenticated: false }));

  test("offers the Claude connection page from a public research session", () => {
    bindPublicSession({
      authenticated: true,
      ownerId: "owner-a",
      email: "researcher@example.com",
      csrfToken: "csrf-a",
      reauthenticationRequired: false,
      claudeConnectEnabled: true,
    });

    const markup = renderToStaticMarkup(<NavigationRail controller={controller} />);

    expect(markup).toContain('href="/connect/claude"');
    expect(markup).toContain("连接 Claude");
  });

  test("hides the Claude connection page until the server gate is enabled", () => {
    bindPublicSession({
      authenticated: true,
      ownerId: "owner-a",
      email: "researcher@example.com",
      csrfToken: "csrf-a",
      reauthenticationRequired: false,
      claudeConnectEnabled: false,
    });

    const markup = renderToStaticMarkup(<NavigationRail controller={controller} />);

    expect(markup).not.toContain('href="/connect/claude"');
    expect(markup).not.toContain("连接 Claude");
  });

  test("does not offer a remote Claude connection from a local session", () => {
    bindPublicSession({ authenticated: false });

    const markup = renderToStaticMarkup(<NavigationRail controller={controller} />);

    expect(markup).not.toContain('href="/connect/claude"');
    expect(markup).not.toContain("连接 Claude");
  });
});
