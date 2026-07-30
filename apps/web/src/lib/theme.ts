export type ColorScheme = "dark" | "light";

export const MIN_TEXT_SCALE = 1;
export const MAX_TEXT_SCALE = 1.5;
export const DEFAULT_TEXT_SCALE = 1;

export function resolveSystemColorScheme(prefersDark: boolean): ColorScheme {
  return prefersDark ? "dark" : "light";
}

export function resolveStoredTextScale(storedScale?: string | null): number {
  const parsedScale = Number(storedScale);
  if (!Number.isFinite(parsedScale)) {
    return DEFAULT_TEXT_SCALE;
  }
  return Math.min(MAX_TEXT_SCALE, Math.max(MIN_TEXT_SCALE, parsedScale));
}
