import { describe, expect, test } from "vitest";

import { resolveInitialColorScheme } from "./theme";

describe("terminal color scheme", () => {
  test("defaults to dark and restores only the supported light preference", () => {
    expect(resolveInitialColorScheme()).toBe("dark");
    expect(resolveInitialColorScheme("dark")).toBe("dark");
    expect(resolveInitialColorScheme("light")).toBe("light");
    expect(resolveInitialColorScheme("system")).toBe("dark");
  });
});
