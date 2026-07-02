# Stage 1 Absolute Share Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage Stage 1/P0 "copy link" actions copy a browser-openable absolute URL instead of only a relative `?workspace=...` query string.

**Architecture:** Keep model and Markdown links relative so reports remain portable. Add a small App-level helper that resolves a Stage 1/P0 relative workspace link against `window.location.href`, strips the hash, and falls back to the relative link outside a browser. Use that helper only in the two direct homepage clipboard actions for the primary daily-use link and refresh receipt next-step link.

**Tech Stack:** React App helpers, source-contract Vitest, existing Stage 1/P0 clipboard flows.

---

### Task 1: Absolute Clipboard Link Contract

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Write the failing source-contract test**

Extend the Stage 1/P0 daily-use layout test with these assertions:

```js
expect(appSource).toContain("function buildStage1P0WorkspaceShareUrl(workspaceLink: string): string");
expect(appSource).toContain('if (!normalizedLink || typeof window === "undefined")');
expect(appSource).toContain("const shareUrl = new URL(normalizedLink, window.location.href);");
expect(appSource).toContain('shareUrl.hash = "";');
expect(appSource).toContain("return shareUrl.toString();");
expect(appSource).toContain("const primaryShareUrl = buildStage1P0WorkspaceShareUrl(stage1P0DailyUseClosure.primaryWorkspaceLink);");
expect(appSource).toContain("navigator.clipboard.writeText(primaryShareUrl)");
expect(appSource).toContain("const nextShareUrl = buildStage1P0WorkspaceShareUrl(stage1P0DailyUseRefreshOutcome.targetWorkspaceLink);");
expect(appSource).toContain("navigator.clipboard.writeText(nextShareUrl)");
```

- [x] **Step 2: Run RED source-contract test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: FAIL because direct copy-link actions still write the relative model link.

- [x] **Step 3: Implement absolute URL helper**

Add near other URL helpers:

```ts
function buildStage1P0WorkspaceShareUrl(workspaceLink: string): string {
  const normalizedLink = workspaceLink.trim();
  if (!normalizedLink || typeof window === "undefined") {
    return normalizedLink;
  }

  try {
    const shareUrl = new URL(normalizedLink, window.location.href);
    shareUrl.hash = "";
    return shareUrl.toString();
  } catch {
    return normalizedLink;
  }
}
```

Update the two direct copy-link callbacks:

```ts
const primaryShareUrl = buildStage1P0WorkspaceShareUrl(stage1P0DailyUseClosure.primaryWorkspaceLink);
await navigator.clipboard.writeText(primaryShareUrl);

const nextShareUrl = buildStage1P0WorkspaceShareUrl(stage1P0DailyUseRefreshOutcome.targetWorkspaceLink);
await navigator.clipboard.writeText(nextShareUrl);
```

- [x] **Step 4: Run GREEN source-contract test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: PASS.

### Task 2: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-02-stage1-absolute-share-links.md`

- [x] **Step 1: Update docs**

Mention that homepage direct copy-link buttons copy a full browser URL, while Markdown still carries portable relative `?workspace=...` links.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 3: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-absolute-share-links.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js
git commit -m "feat: copy absolute stage1 workspace links"
```
