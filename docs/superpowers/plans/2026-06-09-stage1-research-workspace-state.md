# Stage 1 Research Workspace State

## Goal

Persist the current research workspace context so the platform can restore the last selected market, symbol, timeframe, and Stage 1 work area after refresh, Docker restart, or reopening the terminal.

## Scope

- Backend owns a single local-first research workspace state record in SQLite.
- `/api/workspace` restores the saved research context after loading the saved watchlist.
- Frontend exposes one compact "save workspace" action from Stage 1 work areas.
- Product docs record that Stage 1 now has research context persistence.

## Out Of Scope

- Persisting arbitrary panel geometry.
- Persisting execution, portfolio, or live-broker state.
- Auto-saving every form draft before the user explicitly saves.

## Tasks

1. Add failing Python contract tests for a SQLite research workspace state store and API restore behavior.
2. Implement `ResearchWorkspaceStateStore`, payload conversion, and workspace merge helpers.
3. Add `/api/research/workspace-state` `GET` and `PUT`, then apply the saved state in `/api/workspace`.
4. Add failing Vitest coverage for the frontend save API and state draft builder.
5. Implement frontend API helpers, i18n strings, and a Stage 1 save action wired to the current context.
6. Update `docs/product-plan.md` and `docs/architecture.md` with the new persistence contract.
7. Run targeted Python/Vitest checks, full frontend build, Docker smoke, then commit and push through the configured proxy.

## Verification

- `python -m unittest services.quant_core.tests.test_quant_core`
- `npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts`
- `npm --prefix apps/web run build`
- Docker smoke on `http://127.0.0.1:5173/api/workspace`
