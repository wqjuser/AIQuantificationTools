export type ColorScheme = "dark" | "light";

export function resolveSystemColorScheme(prefersDark: boolean): ColorScheme {
  return prefersDark ? "dark" : "light";
}

export function resolveStoredColorSchemePreference(
  storedScheme?: string | null,
): ColorScheme | null {
  return storedScheme === "manual:dark"
    ? "dark"
    : storedScheme === "manual:light"
      ? "light"
      : null;
}
