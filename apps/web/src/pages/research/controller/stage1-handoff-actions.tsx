import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "copiedStage1P0DailyUseHandoff" | "error" | "setCopiedStage1P0DailyUseHandoff" | "setWorkspaceState" | "source" | "stage1P0DailyUseClosure" | "statusLabel" | "workspace">;
type Result = Pick<AppControllerBindings, "copyStage1P0DailyUseHandoff" | "downloadStage1P0DailyUseHandoff">;

export function useStage1HandoffActions(controller: Dependencies): Result {
  const {
    copiedStage1P0DailyUseHandoff, error, setCopiedStage1P0DailyUseHandoff, setWorkspaceState, source, stage1P0DailyUseClosure,
    statusLabel, workspace
  } = controller;
  const copyStage1P0DailyUseHandoff = useCallback(async () => {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }

        await navigator.clipboard.writeText(stage1P0DailyUseClosure.copyText);
        setCopiedStage1P0DailyUseHandoff(true);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 daily handoff copied",
          error: undefined
        }));
      } catch (copyError) {
        setCopiedStage1P0DailyUseHandoff(false);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 daily handoff copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    }, [stage1P0DailyUseClosure.copyText]);
  const downloadStage1P0DailyUseHandoff = useCallback(() => {
      let objectUrl: string | null = null;
      try {
        objectUrl = URL.createObjectURL(
          new Blob([stage1P0DailyUseClosure.copyText], { type: "text/markdown;charset=utf-8" })
        );
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = "stage1-p0-daily-use-handoff.md";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 daily handoff download ready",
          error: undefined
        }));
      } catch (downloadError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 daily handoff download failed",
          error: downloadError instanceof Error ? downloadError.message : "Handoff download failed"
        }));
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }, [stage1P0DailyUseClosure.copyText]);
  return {
    copyStage1P0DailyUseHandoff, downloadStage1P0DailyUseHandoff
  };
}
