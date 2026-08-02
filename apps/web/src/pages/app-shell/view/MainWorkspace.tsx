import type { AppControllerBindings } from "../controller/bindings";
import { DynamicTradingWorkspace, type DynamicTradingWorkspaceViewModel } from "./DynamicTradingWorkspace";
import { TerminalTopbar, type TerminalTopbarViewModel } from "./TerminalTopbar";
import { WorkspaceHost, type WorkspaceHostViewModel } from "./WorkspaceHost";

export type MainWorkspaceViewModel = Pick<AppControllerBindings, "activeWorkAreaId">
  & DynamicTradingWorkspaceViewModel
  & TerminalTopbarViewModel
  & WorkspaceHostViewModel;

type MainWorkspaceProps = { controller: MainWorkspaceViewModel };

export function MainWorkspace({ controller }: MainWorkspaceProps) {
  return (
    <main className="terminal-main" data-workspace={controller.activeWorkAreaId}>
      <TerminalTopbar controller={controller} />
      <WorkspaceHost controller={controller} />
      <DynamicTradingWorkspace controller={controller} />
    </main>
  );
}
