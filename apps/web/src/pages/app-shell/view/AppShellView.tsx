import type { AppControllerBindings } from "../controller/bindings";
import { LiveTradingGateDialog, type LiveTradingGateDialogViewModel } from "../../execution/view/LiveTradingGateDialog";
import { ExpandedChartDialog, type ExpandedChartDialogViewModel } from "../../market/view/ExpandedChartDialog";
import { ResearchCompletionNotice, type ResearchCompletionNoticeViewModel } from "../../research/view/ResearchCompletionNotice";
import { ResearchPipelinePreflightDialog, type ResearchPipelinePreflightDialogViewModel } from "../../research/view/ResearchPipelinePreflightDialog";
import { SettingsUnsavedDialog, type SettingsUnsavedDialogViewModel } from "../../settings/view/SettingsUnsavedDialog";
import { MainWorkspace, type MainWorkspaceViewModel } from "./MainWorkspace";
import { NavigationRail, type NavigationRailViewModel } from "./NavigationRail";
import { TerminalStatusBar, type TerminalStatusBarViewModel } from "./TerminalStatusBar";

export type AppShellViewModel = Pick<AppControllerBindings, "colorScheme">
  & NavigationRailViewModel
  & MainWorkspaceViewModel
  & TerminalStatusBarViewModel
  & ResearchCompletionNoticeViewModel
  & SettingsUnsavedDialogViewModel
  & ResearchPipelinePreflightDialogViewModel
  & LiveTradingGateDialogViewModel
  & ExpandedChartDialogViewModel;

type AppShellViewProps = { controller: AppShellViewModel };

export function AppShellView({ controller }: AppShellViewProps) {
  return (
    <div className="terminal-shell" data-theme={controller.colorScheme}>
      <NavigationRail controller={controller} />
      <MainWorkspace controller={controller} />
      <TerminalStatusBar controller={controller} />
      <ResearchCompletionNotice controller={controller} />
      <SettingsUnsavedDialog controller={controller} />
      <ResearchPipelinePreflightDialog controller={controller} />
      <LiveTradingGateDialog controller={controller} />
      <ExpandedChartDialog controller={controller} />
    </div>
  );
}
