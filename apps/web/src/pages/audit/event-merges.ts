import type {
  AuditEventRecord,
  PortfolioPaperOrderLifecycleEvent,
  PortfolioPaperOrderSimulation,
  PortfolioPaperOrderStateHistory
} from "../../lib/terminal-api";

export function mergeAuditEvidenceReportEvent(events: AuditEventRecord[], event: AuditEventRecord): AuditEventRecord[] {
  return [event, ...events.filter((current) => current.eventId !== event.eventId)];
}

export function mergePortfolioPaperOrderLifecycleEvents(
  events: PortfolioPaperOrderLifecycleEvent[],
  batchId: string,
  replacement: PortfolioPaperOrderLifecycleEvent[]
): PortfolioPaperOrderLifecycleEvent[] {
  return [...events.filter((event) => event.batchId !== batchId), ...replacement];
}

export function mergePortfolioPaperOrderSimulations(
  events: PortfolioPaperOrderSimulation[],
  batchId: string,
  replacement: PortfolioPaperOrderSimulation[]
): PortfolioPaperOrderSimulation[] {
  return [...events.filter((event) => event.batchId !== batchId), ...replacement];
}

export function mergePortfolioPaperOrderStateHistories(
  histories: PortfolioPaperOrderStateHistory[],
  replacement: PortfolioPaperOrderStateHistory
): PortfolioPaperOrderStateHistory[] {
  return [
    replacement,
    ...histories.filter(
      (history) => history.baseRunId !== replacement.baseRunId || history.batchId !== replacement.batchId
    )
  ];
}
