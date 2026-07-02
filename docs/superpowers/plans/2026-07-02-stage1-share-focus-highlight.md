# Stage 1 Share Focus Highlight Plan

## Goal

When a recovered Stage 1/P0 daily-use or refresh-receipt share link is opened, the homepage should not stop at the recovered banner. It should also mark the exact row, entry, primary action, or next-step action inside the Stage 1/P0 daily-use closure card.

## Constraints

- Keep this as frontend context recovery only.
- Do not run daily refresh, Docker, smoke tests, desktop packaging, audit writes, broker connections, or order submission from link recovery.
- Preserve the existing live-blocked and paper-only boundaries.
- Follow the existing Stage 1/P0 card styling and compact dashboard layout.

## Tasks

- [x] Add source-level coverage that requires the recovered share-link state to be passed into `Stage1P0DailyUseClosurePanel`.
- [x] Add source-level coverage for row, primary-action, refresh-entry, and refresh-next focus helpers.
- [x] Add source-level coverage for `.shared-focus` styles on rows, entries, and action buttons.
- [x] Implement focus helper functions and wire `shareDeepLinkState` through the panel.
- [x] Apply focused classes and accessible current-state markers to the exact recovered target.
- [x] Update README and product plan notes.
- [x] Run targeted and full verification, then commit the phase.
