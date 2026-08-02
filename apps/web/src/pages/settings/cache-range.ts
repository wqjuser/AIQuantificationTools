import { formatChartDate } from "../../components/AiReviewAuditBoards";

export function formatCacheContextRange(startTimestamp: string | null, endTimestamp: string | null): string {
  if (!startTimestamp || !endTimestamp) {
    return "n/a";
  }
  const start = formatChartDate(startTimestamp);
  const end = formatChartDate(endTimestamp);
  return start === end ? end : `${start} -> ${end}`;
}
