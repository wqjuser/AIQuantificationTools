import { describe, expect, test } from "vitest";

import {
  DEFAULT_TEXT_SCALE,
  MAX_TEXT_SCALE,
  MIN_TEXT_SCALE,
  resolveStoredTextScale,
  resolveSystemColorScheme,
} from "./theme";

describe("terminal color scheme", () => {
  test("resolves the active system preference", () => {
    expect(resolveSystemColorScheme(true)).toBe("dark");
    expect(resolveSystemColorScheme(false)).toBe("light");
  });
});

describe("terminal text scale", () => {
  test("restores and bounds the device-local preference", () => {
    expect(resolveStoredTextScale()).toBe(DEFAULT_TEXT_SCALE);
    expect(resolveStoredTextScale("invalid")).toBe(DEFAULT_TEXT_SCALE);
    expect(resolveStoredTextScale("1.25")).toBe(1.25);
    expect(resolveStoredTextScale("0.5")).toBe(MIN_TEXT_SCALE);
    expect(resolveStoredTextScale("2")).toBe(MAX_TEXT_SCALE);
  });
});
