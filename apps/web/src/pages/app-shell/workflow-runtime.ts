import type { WorkflowRunLogEntry, WorkflowRunState } from "../../lib/terminal-workbench";

const workflowStepDelayMs = 180;

export function createWorkflowRunState(): WorkflowRunState {
  return {
    activeStageId: "data",
    completedStageIds: [],
    log: []
  };
}

export function createWorkflowLogEntry(
  runId: number,
  index: number,
  stageId: string,
  level: WorkflowRunLogEntry["level"],
  message: string
): WorkflowRunLogEntry {
  return {
    id: `workflow-${runId}-${index}-${stageId}`,
    stageId,
    level,
    message
  };
}

export function waitForWorkflowStep() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, workflowStepDelayMs));
}

export function waitForNextPaint(): Promise<void> {
  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let settled = false;
    let timeoutId: number | undefined;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutId);
      resolve();
    };
    timeoutId = window.setTimeout(finish, 100);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(finish);
    });
  });
}
