# Stage 1 Invalid Share Replacement Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let operators recover from an invalid Stage 1/P0 share link by copying a fresh current daily-use entry link directly from the invalid banner.

**Architecture:** Reuse the existing `stage1P0DailyUseClosure.primaryWorkspaceLink` and `buildStage1P0WorkspaceShareUrl` clipboard path. Extend the existing primary-link copy callback with an optional success status label, then add a safe invalid-banner action that copies the replacement link without switching workspaces or running any Stage 1 command.

**Tech Stack:** React, TypeScript callbacks, Clipboard API, Vitest source-contract tests.

---

### Task 1: Lock the invalid-banner replacement-link contract

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Add failing source-contract expectations**

Require:
- `copyStage1P0DailyUsePrimaryLink("Stage 1 invalid share replacement link copied")`
- `copiedStage1P0DailyUsePrimaryLink` in the invalid banner
- `复制新入口链接`
- `Copy fresh link`
- `Stage 1 invalid share replacement link copied`
- The existing primary link copy callback still uses `stage1P0DailyUseClosure.primaryWorkspaceLink`.

- [x] **Step 2: Run the layout source test red**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"`

Expected: FAIL because the invalid banner cannot copy a replacement link yet.

### Task 2: Implement the safe replacement-link action

**Files:**
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Make the primary link copy callback accept a success label**

Keep the same clipboard URL generation, but allow the caller to pass a custom copied status label.

- [x] **Step 2: Add the invalid-banner copy button**

Render a second invalid banner action that calls `copyStage1P0DailyUsePrimaryLink("Stage 1 invalid share replacement link copied")`, reuses `copiedStage1P0DailyUsePrimaryLink`, and only writes to clipboard/status state.

- [x] **Step 3: Run the layout source test green**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"`

Expected: PASS.

### Task 3: Document, verify, and commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-02-stage1-invalid-share-replacement-link.md`

- [x] **Step 1: Update docs**

Document that invalid Stage 1 share banners can now copy a fresh current daily-use entry link while still avoiding auto-navigation, refresh, command execution, audit writes, broker connections, or orders.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
```

Expected: all commands exit 0. Existing Vite chunk-size warning may remain.

- [x] **Step 3: Commit**

Commit message: `feat: copy replacement stage1 share link`
