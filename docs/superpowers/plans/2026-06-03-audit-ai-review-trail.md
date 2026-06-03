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
- Filter saved AI Review Run Records through the backend `query` contract so Audit can search over the stored record JSON without losing run binding.
- Apply the same backend search result page to both the drift summary and the saved AI Review Run Record history, so Audit does not show mismatched summary and record lists.
- Let users select any visible saved AI Review Run Record and compare current evidence against that selected record, while defaulting to the latest saved record.
- Render risk approval references beside the AI evidence trail, reusing the same execution approval gates that block paper and live handoff.
- Support backend `limit`, `offset`, and `query` parameters for saved AI Review Run Records, returning pagination metadata while preserving the existing `aiReviews` response array.
- Build a compact audit timeline from current evidence, saved AI Review Run Records, and risk approval so the Audit workspace has a single approval-reference chain.
- Add an explicit `ai` grid area to the Audit workspace layout.
- Update the product plan.

## Out Of Scope

- No new backend AI review storage contract.
- No deep field-level diffing beyond current evidence comparison, saved-record drift summaries, and the backend run-record search contract.
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
- RED: `terminal-workbench.test.ts -t "filters AI review drift rows"` failed because `filterAiReviewRecordDriftRows` did not exist.
- GREEN: added model-level filtering by AI review id, strategy revision, drift status, numeric counts, live boundary, and drift reasons.
- RED: `layout-css.test.js -t "filters saved AI review drift rows"` failed because the Audit panel did not expose drift filtering.
- GREEN: added a compact search input to the Audit drift summary and wired it to `filterAiReviewRecordDriftRows`.
- RED: `layout-css.test.js -t "applies the AI review audit search"` failed because saved AI review record history still received the unfiltered record list.
- GREEN: wired the Audit drift search through saved record history, including filtered/total counts and an explicit no-match empty state.
- RED: `layout-css.test.js -t "selected AI review record"` failed because Audit evidence comparison always used the latest saved record.
- GREEN: made saved AI review record cards selectable and wired the evidence comparison to the selected record, defaulting back to the latest saved record.
- RED: `layout-css.test.js -t "risk approval references"` failed because the Audit AI trail did not render execution risk approval references.
- GREEN: added `AiReviewRiskReferenceBoard`, passed `riskApprovalSummary` into the Audit AI trail, and reused the existing risk approval gate labels, statuses, and details.
- RED: `test_ai_review_run_store_pages_and_searches_records_bound_to_run` failed because `AiReviewRunStore.list_by_run` did not support `offset` or `query`.
- GREEN: added store-level pagination, total counts, and run-scoped text search over AI review ids and normalized record JSON.
- RED: `test_research_run_ai_review_api_pages_and_searches_review_records` failed because the HTTP API ignored `limit`, `offset`, and `query` and returned no pagination metadata.
- GREEN: added the backend query parameters and `pagination` response object, while preserving the existing `aiReviews` array.
- RED: `terminal-api.test.ts -t "paged AI review"` failed because the web API client URL builder ignored AI review history search parameters.
- GREEN: added typed client params and optional pagination parsing while keeping old `loadResearchRunAiReviews(baseUrl, runId, fetcher)` calls compatible.
- DOCS: updated the product plan and architecture endpoint notes with the backend AI review pagination contract.
- VERIFY: Docker service on port 5173 saved AI Review Run Records for a real research run and returned only the `needle-drift` match with `limit`, `offset`, `total`, and `query` metadata.
- RED: `layout-css.test.js -t "backend pagination"` failed because the Audit workspace did not keep AI review history query, offset, pagination metadata, or page controls.
- GREEN: added `AI_REVIEW_HISTORY_PAGE_SIZE`, backend-backed Audit history loading, query reset on context changes, and previous/next controls that use backend `pagination.total`.
- REFACTOR: removed Audit-side double filtering so backend search over full saved record JSON feeds the drift summary and record history from the same current page.
- RED: `terminal-workbench.test.ts -t "AI review audit timeline"` failed because `buildAiReviewAuditTimelineItems` did not exist.
- GREEN: added `AiReviewAuditTimelineItem` and `buildAiReviewAuditTimelineItems`, sorting saved records by `createdAt` and producing current evidence, saved review, and risk approval reference rows.
- RED: `layout-css.test.js -t "AI review audit timeline"` failed because the Audit panel did not render the timeline.
- GREEN: added `AiReviewAuditTimelineBoard` with compact reference rows for current evidence, saved records, and risk approval, then wired it into `AiReviewAuditTrailPanel`.
- DOCS: updated product plan and architecture notes to mark the compact AI review audit timeline as implemented and leave clickable approval/export/cross-workspace references for the next slice.
