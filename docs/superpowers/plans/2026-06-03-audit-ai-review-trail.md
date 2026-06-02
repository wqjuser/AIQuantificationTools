# Audit AI Review Trail

## P0 Mapping

AI Review Run Records can already be saved, exported, imported, and reloaded for an audited run. The Audit workspace should expose that evidence chain directly, instead of forcing users to jump back to the AI Review workspace to verify whether AI explanations are bound to the right run.

## Goal

Add a compact AI review audit trail to the Audit workspace. It should show saved AI Review Run Records for the active audited run and the current AI dossier citations, including data, backtest, benchmark, research note, and risk boundary references.

## Scope

- Render an `AiReviewAuditTrailPanel` in the Audit workspace.
- Reuse `activeAiReviewRunRecords` already loaded from `/api/research/runs/{runId}/ai-reviews`.
- Reuse `aiReviewDossier` citations as the current evidence reference list.
- Compare the current run id, strategy revision, dossier status, citation count, committee rounds, and live execution boundary against the latest saved AI Review Run Record.
- Summarize drift across all loaded saved AI Review Run Records so Audit can spot stale strategy revisions, citation counts, committee rounds, dossier status, run binding, or live boundary changes.
- Add an explicit `ai` grid area to the Audit workspace layout.
- Update the product plan.

## Out Of Scope

- No new backend AI review storage contract.
- No AI review record search or deep field-level diffing beyond current evidence comparison and saved-record drift summaries.
- No changes to AI Review generation behavior.

## Test Plan

- RED/GREEN layout contract test for the Audit AI review trail.
- Full `npm test`.
- `npm run build`.
- Docker rebuild and smoke check on port 5173.
- Browser verification on `?workspace=audit`.

## Implementation Log

- RED: `layout-css.test.js -t "AI review audit trail"` failed because `AiReviewAuditTrailPanel` did not exist.
- GREEN: added the panel, rendered saved AI review records plus dossier citations, and expanded the Audit grid with a full-width `ai` area.
- RED: `layout-css.test.js -t "compares current AI review evidence"` failed because `AiReviewAuditComparison` did not exist.
- GREEN: added the current-vs-latest AI review evidence comparison, including run id, strategy revision, dossier status, citation count, committee rounds, and live execution boundary.
- RED: `terminal-workbench.test.ts -t "builds audit drift rows"` failed because `buildAiReviewRecordDriftRows` did not exist.
- GREEN: added model-level saved-record drift rows for run binding, strategy revision, dossier status, citation count, committee rounds, and live execution boundary.
- RED: `layout-css.test.js -t "summarizes drift"` failed because the Audit panel did not render a saved-record drift summary.
- GREEN: added `AiReviewRecordDriftSummary` to the Audit AI review trail with compact matched/drift status rows.
