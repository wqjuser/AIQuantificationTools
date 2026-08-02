export function formatSignedPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "N/A";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatPlainPercent(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : "N/A";
}

export function formatPlainNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "N/A";
}

export function formatSignedNumber(value: number): string {
  return Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}` : "N/A";
}
