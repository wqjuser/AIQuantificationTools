import type { StrategyLibraryItem } from "../../lib/terminal-api";
import type { TerminalWorkspace } from "../../lib/terminal-workbench";

export function strategyLibraryItemMatchesWorkspace(workspace: TerminalWorkspace, item: StrategyLibraryItem): boolean {
  return (
    workspace.selectedInstrument.market === item.market &&
    workspace.selectedInstrument.symbol === item.symbol &&
    workspace.selectedTimeframe === item.timeframe &&
    workspace.strategy.name === item.strategySnapshot.name &&
    workspace.strategy.entry === item.strategySnapshot.entry &&
    workspace.strategy.exit === item.strategySnapshot.exit &&
    workspace.strategy.position === item.strategySnapshot.position &&
    workspace.strategy.risk === item.strategySnapshot.risk
  );
}
