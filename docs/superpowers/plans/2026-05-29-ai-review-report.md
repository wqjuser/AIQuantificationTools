# AI Review Report Implementation Plan

Goal: make the TradingAgents-style AI review a portable audit artifact, not only an on-screen committee summary.

P0 mapping:
- Product work area: AI Review Board.
- Golden path step: audited backtest -> evidence-locked AI review -> risk approval -> paper execution.
- User task: export an AI review that can be reviewed, archived, or shared without granting AI any extra evidence.

Scope:
- Add a `buildAiReviewReportMarkdown` frontend model.
- Require an audited `researchRun`; blocked or unaudited contexts return no report.
- Include run id, market, symbol, timeframe, strategy revision, execution mode, dossier citations, benchmark alpha, locked research note, committee rounds, decision log, and AI safety boundary.
- Add a compact AI report export action to the Agent Committee panel.
- Keep the export as Markdown in this slice; the full reproducibility package remains the research run JSON export.

Out of scope:
- AI provider integration.
- Backend AI report persistence schema changes.
- PDF report export.
- Live execution promotion based on exported AI reports.

Progress:
- [x] Contract tests for ready and blocked AI review report export.
- [x] `buildAiReviewReportMarkdown` model in the terminal workbench library.
- [x] Agent Committee panel can export the active AI report when an audited run is bound.
- [x] i18n labels and status copy added.
- [x] Product plan and architecture documentation updated.

Verification:
- Targeted frontend tests for `terminal-workbench`, layout contracts, and i18n.
- Full Python + frontend test suite.
- Production build.
- Browser smoke check on the AI Review workspace.
