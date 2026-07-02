# Stage 1 Share Link Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let operators copy a complete Stage 1/P0 daily-use share-link bundle from the homepage card in one action.

**Architecture:** Add a pure `buildStage1P0ShareLinkBundleCopyText` helper in the workbench model. The helper accepts a daily-use closure, an optional refresh outcome, and a URL resolver so the App can turn relative `?workspace=...` links into full browser URLs while tests can stay deterministic. The React card adds a single clipboard action beside the existing handoff/link/download controls.

**Tech Stack:** React, TypeScript model helper, Clipboard API, Vitest model tests, source-contract layout tests.

---

### Task 1: Lock the share-link bundle contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Add a model red test**

Add `buildStage1P0ShareLinkBundleCopyText` to the workbench test import list and add a test named `builds a Stage 1 share-link bundle copy text`.

The test should pass a minimal closure with:
- primary action `Refresh P0 acceptance -> audit`
- primary link `?workspace=audit&stage1DailyUseFocus=primary`
- two daily rows: `Clean environment open` and `Research entry`

Pass a refresh outcome with:
- next action `Open daily workbench -> research`
- next link `?workspace=research&stage1RefreshReceiptFocus=next`
- one entry: `Daily report`

Use `resolveShareUrl: (link) => "http://127.0.0.1:5174/" + link`.

Require the Markdown to contain:
- `# Stage 1/P0 Share Link Bundle`
- `Daily state: blocked`
- `Primary link: http://127.0.0.1:5174/?workspace=audit&stage1DailyUseFocus=primary`
- `- Clean environment open [blocked] -> audit: http://127.0.0.1:5174/?workspace=audit&stage1DailyUseFocus=clean-open`
- `- Research entry [review] -> research: http://127.0.0.1:5174/?workspace=research&stage1DailyUseFocus=research-entry`
- `Refresh receipt state: ready`
- `Refresh next link: http://127.0.0.1:5174/?workspace=research&stage1RefreshReceiptFocus=next`
- `- Daily report [ready/core] -> settings: http://127.0.0.1:5174/?workspace=settings&stage1RefreshReceiptFocus=daily-use`
- `Live trading remains blocked.`

- [x] **Step 2: Add a UI source-contract red test**

Extend the Stage 1/P0 daily-use layout test to require:
- `buildStage1P0ShareLinkBundleCopyText`
- `const [copiedStage1P0ShareLinkBundle, setCopiedStage1P0ShareLinkBundle]`
- `setCopiedStage1P0ShareLinkBundle(false);`
- `const copyStage1P0ShareLinkBundle = useCallback`
- `resolveShareUrl: buildStage1P0WorkspaceShareUrl`
- `navigator.clipboard.writeText(shareLinkBundleCopyText)`
- `Stage 1 share link bundle copied`
- `Stage 1 share link bundle copy failed`
- `isShareLinkBundleCopied={copiedStage1P0ShareLinkBundle}`
- `onCopyShareLinkBundle={() => void copyStage1P0ShareLinkBundle()}`
- `onCopyShareLinkBundle?: () => void;`
- `复制链接包`
- `Copy links`

- [x] **Step 3: Run the focused tests red**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "builds a Stage 1 share-link bundle copy text"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: both fail because the helper and UI action do not exist yet.

### Task 2: Implement the model helper and card action

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Implement `buildStage1P0ShareLinkBundleCopyText`**

Export a helper that:
- Emits daily state, ready count, primary action, primary link, daily-use row links, optional refresh receipt state/next link/entry links, and the live-blocked boundary.
- Uses `resolveShareUrl` for every link.
- Falls back to the original link if `resolveShareUrl` throws or returns an empty string.
- Emits `Refresh receipt links: none` when no refresh outcome is present.

- [x] **Step 2: Wire clipboard state and callback in `App.tsx`**

Import the helper, add `copiedStage1P0ShareLinkBundle`, reset it when closure copy text or refresh outcome copy text changes, and add `copyStage1P0ShareLinkBundle`. The callback must only build the Markdown, write it to the clipboard, and update local status/error.

- [x] **Step 3: Add the footer button**

Extend `Stage1P0DailyUseClosurePanel` props with `isShareLinkBundleCopied` and `onCopyShareLinkBundle`. Add a footer button labeled `复制链接包 / Copy links`; after copy, show `链接包已复制 / Links copied`.

- [x] **Step 4: Run the focused tests green**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "builds a Stage 1 share-link bundle copy text"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: both pass.

### Task 3: Document, verify, and commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-02-stage1-share-link-bundle.md`

- [x] **Step 1: Update docs**

Document that the homepage Stage 1/P0 card can copy a complete share-link bundle with full URLs for the primary daily entry, row entries, and any current refresh receipt entries, without navigation, refresh, command execution, audit writes, broker connections, or orders.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "builds a Stage 1 share-link bundle copy text"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
curl -I "http://127.0.0.1:5174/?workspace=research&stage1RefreshReceiptFocus=next"
```

Expected: all commands exit 0 except `curl` may fail only if the local dev server is not running. Existing Vite chunk-size warning may remain.

- [x] **Step 3: Commit**

Commit message: `feat: copy stage1 share link bundle`
