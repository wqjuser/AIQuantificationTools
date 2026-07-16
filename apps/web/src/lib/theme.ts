export type ColorScheme = "dark" | "light";

export function resolveInitialColorScheme(storedScheme?: string | null): ColorScheme {
  return storedScheme === "light" ? "light" : "dark";
}
