# Module Workbench A+C Design

## Goal

Turn the left terminal module menu into real workspace modes, while reserving the Node Workflow mode as the future visual orchestration entry.

## Scope

- Watchlist keeps the existing chart, strategy, workflow summary, and execution panels.
- Scanner shows actionable candidates derived from the current workspace and lets the user switch research context.
- Portfolio shows paper-only exposure, risk concentration, and execution gates.
- News shows event and agent-watch context for the selected instrument, clearly marked as not a live news feed yet.
- Workflow shows a larger node pipeline surface with selectable nodes, run-state hints, and outputs connected to the existing Run Pipeline action.

## Interaction

The existing module buttons remain the primary navigation. Selecting a module changes the main center content instead of only changing the focus banner. Watchlist instruments and scanner candidates can update the selected instrument and therefore refresh the chart. The workflow mode provides a denser canvas-like panel without implementing drag-to-connect nodes in this pass.

## Data Boundaries

No new paid or external data source is introduced in this pass. Scanner, portfolio, news, and workflow views are built from the current `TerminalWorkspace`, chart context, decision log, execution gates, and local derived rows. Each view labels unavailable live feeds explicitly rather than pretending to stream data.

## Testing

Model helpers should be covered with unit tests for module rows and derived summaries. The full app should continue to pass the existing API, i18n, workbench, and research tests, and the UI should be verified in the browser by clicking each left module.
