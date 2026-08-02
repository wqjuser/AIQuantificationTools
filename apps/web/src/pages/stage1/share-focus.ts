import { stage1P0DailyUseArchiveRecordActionElementId, stage1P0DailyUseClosureElementId, stage1P0DailyUsePrimaryActionElementId, stage1P0DailyUseRefreshActionElementId, stage1P0DailyUseRefreshEntryElementId, stage1P0DailyUseRefreshNextActionElementId, stage1P0DailyUseRowElementId } from "../../components/AppWorkflowPanels";
import { Stage1P0DailyUseClosure, Stage1P0DailyUseRefreshOutcome, Stage1P0DailyUseShareDeepLinkState } from "../../lib/terminal-workbench";

export function stage1P0DailyUseShareTargetElementId(
  state: Stage1P0DailyUseShareDeepLinkState | null | undefined,
  outcome: Stage1P0DailyUseRefreshOutcome | null | undefined
): string {
  if (!state) {
    return stage1P0DailyUseClosureElementId;
  }
  if (state.kind === "daily-use") {
    return state.focus === "primary"
      ? stage1P0DailyUsePrimaryActionElementId
      : stage1P0DailyUseRowElementId(state.focus as Stage1P0DailyUseClosure["rows"][number]["id"]);
  }
  if (!outcome) {
    return stage1P0DailyUseRefreshActionElementId;
  }
  return state.focus === "next"
    ? stage1P0DailyUseRefreshNextActionElementId
    : stage1P0DailyUseRefreshEntryElementId(state.focus as Stage1P0DailyUseRefreshOutcome["entries"][number]["id"]);
}

export function focusStage1P0DailyUseElementById(targetElementId: string): void {
  if (typeof document === "undefined") {
    return;
  }
  const element = document.getElementById(targetElementId) ?? document.getElementById(stage1P0DailyUseClosureElementId);
  if (!element) {
    return;
  }
  element.scrollIntoView({ block: "center", behavior: "smooth" });
  element.focus({ preventScroll: true });
}

export function focusStage1P0DailyUseShareCardElement(): void {
  focusStage1P0DailyUseElementById(stage1P0DailyUseClosureElementId);
}

export function focusStage1P0DailyUseShareTargetElement(targetElementId: string): void {
  if (targetElementId === stage1P0DailyUseClosureElementId) {
    focusStage1P0DailyUseShareCardElement();
    return;
  }
  focusStage1P0DailyUseElementById(targetElementId);
}

export function focusStage1P0DailyUseArchiveRecordActionElement(): void {
  focusStage1P0DailyUseElementById(stage1P0DailyUseArchiveRecordActionElementId);
}

export function queueStage1P0DailyUseArchiveRecordActionFocus(): void {
  if (typeof window === "undefined") {
    focusStage1P0DailyUseArchiveRecordActionElement();
    return;
  }
  window.requestAnimationFrame(() => focusStage1P0DailyUseArchiveRecordActionElement());
}
