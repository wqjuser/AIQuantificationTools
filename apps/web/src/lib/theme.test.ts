import { describe, expect, test } from "vitest";

import {
  resolveStoredColorSchemePreference,
  resolveSystemColorScheme,
} from "./theme";

describe("terminal color scheme", () => {
  test("follows the system until a manual preference is recorded", () => {
    expect(resolveSystemColorScheme(true)).toBe("dark");
    expect(resolveSystemColorScheme(false)).toBe("light");
    expect(resolveStoredColorSchemePreference()).toBeNull();
    expect(resolveStoredColorSchemePreference("dark")).toBeNull();
    expect(resolveStoredColorSchemePreference("light")).toBeNull();
    expect(resolveStoredColorSchemePreference("manual:dark")).toBe("dark");
    expect(resolveStoredColorSchemePreference("manual:light")).toBe("light");
  });
});
