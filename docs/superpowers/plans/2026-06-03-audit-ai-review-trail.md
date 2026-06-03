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
- Give timeline references action metadata so current evidence opens Backtest, saved reviews select the comparison record, and risk approval opens Execution.
- Attach export-package evidence anchors to AI Review Run Records and Audit timeline rows so saved records can point back to stable `researchRun`, `strategyConfig`, `dataSnapshot`, citation, committee, decision log, and boundary locations.
- Render a searchable export evidence index inside Audit so users can inspect anchors and `exportPath` values without opening raw JSON.
- Render a reproducible research run export preview inside Audit so users can inspect package-level readiness before opening raw JSON.
- Render a research run export package browser inside Audit, loading a selected history run package and checking manifest counts, integrity metadata, package artifacts, AI review records, and execution handoff gates.
- Render a recent export package index inside Audit, loading export packages for visible run history and enabling cross-package search over run ids, symbols, hashes, artifact summaries, integrity failures, and handoff status.
- Render an import impact diff inside Audit, comparing the current workspace with the inspected export package before import writes anything.
- Add an explicit `ai` grid area to the Audit workspace layout.
- Update the product plan.

## Out Of Scope

- No new backend AI review storage table.
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
- RED: `terminal-workbench.test.ts -t "AI review audit timeline"` failed because timeline items did not expose action metadata.
- GREEN: added `targetWorkspaceId`, `targetRecordId`, and `actionLabel` to timeline items for Backtest evidence, saved review comparison, and Execution approval.
- RED: `layout-css.test.js -t "timeline rows into workflow actions"` failed because Audit timeline rows were read-only.
- GREEN: added compact timeline action buttons; saved-review actions select the comparison record, while current-evidence and risk-approval actions call `selectProductWorkArea` for Backtest and Execution.
- DOCS: updated product plan and architecture notes to record clickable Audit timeline actions and leave export-package evidence anchors for later.
- RED: `test_research_run_export_import_preserves_ai_review_records` failed because portable AI review export dropped `evidenceAnchors`.
- GREEN: preserved AI review record `evidenceAnchors` through export/import fixtures and confirmed the backend portable test passes.
- RED: frontend AI review model/API/layout tests failed until run records exposed typed evidence anchors, timeline rows exposed `exportAnchor`, and API guards rejected malformed anchors.
- GREEN: added `AiReviewEvidenceAnchor`, generated stable run/strategy/data/citation/committee/decision/boundary anchors, rendered timeline anchors, and validated anchor shape in frontend API guards.
- DOCS: updated product plan and architecture notes to mark export-package evidence anchors as implemented.
- RED: `terminal-workbench.test.ts -t "export evidence index"` failed because `buildAiReviewExportEvidenceIndexRows` did not exist.
- GREEN: added export evidence index rows and filtering across current records, saved records, and timeline references.
- RED: `layout-css.test.js -t "export evidence index"` failed because Audit did not render the index board.
- GREEN: added `AiReviewExportEvidenceIndexBoard`, local search, compact index rows, and CSS for anchor/exportPath inspection.
- DOCS: updated product plan and architecture notes to mark the Audit export evidence index as implemented.
- RED: `terminal-workbench.test.ts -t "export preview"` failed because `buildResearchRunExportPreviewRows` did not exist.
- GREEN: added research run export preview rows and filtering across run, data snapshot, strategy config, research note, backtest replay artifacts, AI reviews, paper executions, promotion evidence, and execution handoff.
- RED: `layout-css.test.js -t "export package preview"` failed because Audit did not render the package preview panel.
- GREEN: added `ResearchRunExportPreviewPanel`, compact readiness/search UI, and an `export` Audit layout area before the AI audit trail.
- DOCS: updated product plan and architecture notes to mark the Audit export package preview as implemented and leave full package browser plus cross-package audit search as the next slice.
- RED: `terminal-workbench.test.ts -t "export package browser"` failed because `buildResearchRunExportBrowserRows` did not exist.
- GREEN: added research run export package browser rows and filtering across manifest, integrity, data snapshot, backtest artifacts, research notes, paper executions, promotion candidates, AI reviews, and execution handoff gates.
- RED: `layout-css.test.js -t "export package browser"` failed because Audit did not render the package browser or wire Run History inspect actions.
- GREEN: added `ResearchRunExportPackageBrowserPanel`, an Audit `package` grid area, Run History inspect buttons, and a backend-backed export package load action.
- DOCS: updated product plan and architecture notes to mark the Audit export package browser as implemented and leave cross-package audit search plus import diffing as the next slice.
- RED: `terminal-workbench.test.ts -t "export package index"` failed because `buildResearchRunExportIndexRows` did not exist.
- GREEN: added recent export package index rows and filtering across run id, symbol, strategy revision, integrity, data hash, artifact summary, execution gates, export path, and mismatch reasons.
- RED: `layout-css.test.js -t "export package index"` failed because Audit did not render a recent package index or expose a batch index action.
- GREEN: added `ResearchRunExportIndexPanel`, an Audit `index` grid area, a backend-backed "Index recent" action, compact index rows, summary counts, and local search.
- DOCS: updated product plan and architecture notes to mark cross-package audit search as implemented and leave field-level import diffing as the next slice.
- RED: `terminal-workbench.test.ts -t "import diff"` failed because `buildResearchRunImportDiffRows` did not exist.
- GREEN: added `ResearchRunImportDiffRow`, `buildResearchRunImportDiffRows`, and `filterResearchRunImportDiffRows` to compare run id, context, timeframe, data snapshot, strategy revision, research note, paper executions, AI review records, and live boundary before import.
- RED: `layout-css.test.js -t "import diff guidance"` failed because Audit did not render an import impact panel.
- GREEN: added `ResearchRunImportDiffPanel`, the `import-diff` Audit grid area, compact diff rows, summary counts, search, and responsive styles.
- DOCS: updated product plan and architecture notes to mark import impact diffing as implemented and leave file-picker import preview/confirmation as the next slice.
- RED: `terminal-api.test.ts -t "normalizes raw and wrapped"` failed because file import had no shared export-package normalizer for preview.
- RED: `layout-css.test.js -t "previews an imported"` failed because the file picker still imported immediately and the import diff panel had no confirm/cancel actions.
- GREEN: added `normalizeResearchRunExportPackagePayload`, pending file import state, preview-only file selection, confirm/cancel actions, and blocked-diff guarded apply.
- DOCS: updated product plan, architecture notes, and i18n status labels to mark external file import preview/confirmation as implemented.
- RED: `terminal-workbench.test.ts -t "blocks import diff"` failed because import diff rows did not include package integrity or artifact count gates.
- GREEN: added `package-integrity` and `artifact-counts` import diff rows, blocking invalid SHA-256 metadata and manifest/package payload count mismatches before confirm import.
- DOCS: updated product plan and architecture notes to mark integrity/count import preflight blocking as implemented.
- RED: `terminal-workbench.test.ts -t "audit ledger"` failed because import preview/apply/failure events had no model helper.
- RED: `layout-css.test.js -t "import audit events"` failed because Audit did not render an import audit ledger panel.
- GREEN: added `ResearchRunImportAuditEvent`, event build/merge/filter helpers, Audit import ledger state, preview/blocked/confirmed/cancelled/failed events, and compact responsive panel styles.
- DOCS: updated product plan and architecture notes to mark front-end import audit ledger as implemented and leave backend AuditEvent persistence plus rollback as the next slice.
- RED: backend audit event tests failed because `quant_core.audit_events` and `/api/audit/events` did not exist.
- GREEN: added `AuditEventStore`, searchable `research_run_import` events, POST/GET `/api/audit/events`, and frontend `saveAuditEvent`/`loadAuditEvents` client helpers.
- GREEN: wired import preview/blocked/confirmed/cancelled/failed events to persist asynchronously and refresh from backend when entering Audit.
- DOCS: updated product plan and architecture notes to mark backend AuditEvent persistence as implemented; rollback and richer failure explanations remain the next slice.
