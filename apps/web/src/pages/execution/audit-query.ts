import { ExecutionAdapterPaperExecutionRow } from "../../lib/terminal-workbench";

export function buildExecutionAdapterPaperExecutionAuditQuery(row: ExecutionAdapterPaperExecutionRow): string {
  return [
    "execution_adapter_paper_execution",
    row.id,
    row.auditEventId,
    row.adapterId,
    row.manifestValidationId,
    row.simulatedSymbol,
    row.status
  ]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(" ");
}
