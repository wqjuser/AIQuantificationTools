# Stage 1/P0 Invalid Share Archive Actions Implementation Plan

**Goal:** Let operators export the full Stage 1/P0 daily-use archive directly from the invalid share-link banner, so bad links can be triaged without first finding the daily card footer.

**Architecture:** Reuse the existing daily-use archive callbacks and state. The invalid banner remains a front-end recovery surface: it can focus the daily card, copy diagnostics, copy/download the current archive, or copy a fresh primary link, but it does not restore an invalid workspace or trigger any local-core workflow.

### Task 1: Lock the invalid banner export contract

Add source-contract expectations to the Stage 1/P0 daily-use layout test:

- `onClick={() => void copyStage1P0DailyUseArchive()}`
- `copiedStage1P0DailyUseArchive`
- `归档包已复制`
- `Archive copied`
- `复制归档包`
- `Copy archive`
- `onClick={downloadStage1P0DailyUseArchive}`
- `下载归档包`
- `Download archive`

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected result before implementation: fails because the invalid banner does not yet expose archive actions.

### Task 2: Add copy/download archive actions to invalid share banner

Render two additional invalid-banner actions after diagnostics and before the fresh-link action:

- Copy archive: calls `copyStage1P0DailyUseArchive()`, uses the existing copied state, and shows bilingual copied/default labels.
- Download archive: calls `downloadStage1P0DailyUseArchive`, uses the existing Blob download flow, and shows bilingual labels.

Run the focused layout test again and expect it to pass.

### Task 3: Document the operator path and boundary

Update `README.md` and `docs/product-plan.md` to explain that invalid share links can now export the full Markdown archive directly from the banner. Keep the boundary explicit: the actions only copy or download current local/front-end state and do not refresh, recover invalid workspaces, run Stage 1 commands, build desktop packages, write audit events, connect brokers, or submit orders.

### Task 4: Verify and commit

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
curl -I --max-time 5 "http://127.0.0.1:5174/?workspace=research&stage1RefreshReceiptFocus=next"
```

If the dev server is not already available on port 5174, start it for the runtime probe and stop it after the check.
