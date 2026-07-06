# Stage 1/P0 Archive Recovered Share Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Include the active recovered Stage 1/P0 share-link context inside the copied/downloaded daily-use archive Markdown.

**Architecture:** Extend `buildStage1P0DailyUseArchiveCopyText` with an optional `shareDeepLinkState` input. The archive builder derives a deterministic source section from that state, using the existing Stage 1 daily-use and refresh-receipt link builders plus the existing `resolveShareUrl` hook; App only passes the current parsed share state into the archive builder.

**Tech Stack:** TypeScript model helpers, React App callback wiring, Vitest model/source-contract tests, Markdown docs.

---

### Task 1: Lock the archive recovered-share contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Add archive model expectations**

Extend the `builds a Stage 1/P0 daily-use archive copy text` test call with:

```ts
      shareDeepLinkState: {
        focus: "research-entry",
        kind: "daily-use",
        targetWorkspaceId: "research"
      },
```

Then assert the archive includes:

```ts
    expect(copyText).toContain("- Recovered share context: daily-use/research-entry -> research");
    expect(copyText).toContain("- Recovered Share Context");
    expect(copyText).toContain("## Recovered Share Context");
    expect(copyText).toContain("Recovered share link: active");
    expect(copyText).toContain("Share kind: daily-use");
    expect(copyText).toContain("Share focus: research-entry");
    expect(copyText).toContain("Share target workspace: research");
    expect(copyText).toContain(
      "Share link: http://127.0.0.1:5174/?workspace=research&stage1DailyUseFocus=research-entry"
    );
```

- [x] **Step 2: Add App source-contract expectation**

Inside the Stage 1/P0 daily-use layout test, assert:

```js
    expect(appSource).toContain("shareDeepLinkState: initialStage1P0DailyUseShareDeepLinkState");
```

- [x] **Step 3: Run focused tests and verify failure**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: the archive model test fails until the new recovered-share section is implemented.

### Task 2: Implement archive recovered-share section

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Add an archive helper**

Add a helper near the existing Stage 1 archive builders:

```ts
function buildStage1P0RecoveredShareContextCopyText({
  resolveShareUrl,
  shareDeepLinkState
}: {
  resolveShareUrl: (workspaceLink: string) => string;
  shareDeepLinkState?: Stage1P0DailyUseShareDeepLinkState | null;
}): string {
  if (!shareDeepLinkState) {
    return "No recovered share link is active.";
  }
  const search =
    shareDeepLinkState.kind === "daily-use"
      ? buildStage1P0DailyUseShareUrlSearch({
          focus: shareDeepLinkState.focus,
          targetWorkspaceId: shareDeepLinkState.targetWorkspaceId
        })
      : buildStage1P0DailyUseRefreshReceiptUrlSearch({
          focus: shareDeepLinkState.focus,
          targetWorkspaceId: shareDeepLinkState.targetWorkspaceId
        });
  const workspaceLink = search ? `?${search}` : "";
  const shareLink = workspaceLink ? resolveShareUrl(workspaceLink) : "none";
  return [
    "Recovered share link: active",
    `Share kind: ${shareDeepLinkState.kind}`,
    `Share focus: ${shareDeepLinkState.focus}`,
    `Share target workspace: ${shareDeepLinkState.targetWorkspaceId}`,
    `Share link: ${shareLink}`
  ].join("\n");
}
```

- [x] **Step 2: Extend archive function inputs and output**

Add `shareDeepLinkState = null` to `buildStage1P0DailyUseArchiveCopyText`, compute:

```ts
  const shareContextState = shareDeepLinkState
    ? `${shareDeepLinkState.kind}/${shareDeepLinkState.focus} -> ${shareDeepLinkState.targetWorkspaceId}`
    : "none";
  const recoveredShareContextText = buildStage1P0RecoveredShareContextCopyText({
    resolveShareUrl,
    shareDeepLinkState
  });
```

Add these lines to summary and contents:

```ts
    `- Recovered share context: ${shareContextState}`,
    "- Recovered Share Context",
```

Add this section before Refresh Receipt:

```ts
    "## Recovered Share Context",
    recoveredShareContextText,
```

- [x] **Step 3: Pass App share state into the archive builder**

In `buildStage1P0DailyUseArchiveText`, pass:

```ts
        shareDeepLinkState: initialStage1P0DailyUseShareDeepLinkState,
```

- [x] **Step 4: Run focused tests and verify they pass**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: both pass.

### Task 3: Document the archive source context

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [x] **Step 1: Update README**

Clarify that the daily-use archive includes any active recovered share context in addition to daily handoff, link bundle, refresh receipt, and invalid diagnostics.

- [x] **Step 2: Update product plan**

Append a latest update explaining that archives now record the recovered share kind/focus/workspace/link when opened from a valid Stage 1 share URL, with no new runtime side effects.

### Task 4: Verify and commit

**Files:**
- Modify: all files above

- [x] **Step 1: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
curl -I --max-time 5 "http://127.0.0.1:5174/?workspace=research&stage1DailyUseFocus=research-entry"
```

If port 5174 is not already serving the app, temporarily start:

```bash
npm run dev --workspace @aiqt/web -- --host 127.0.0.1 --port 5174
```

- [x] **Step 2: Commit**

Run:

```bash
git add README.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts docs/product-plan.md docs/superpowers/plans/2026-07-06-stage1-archive-recovered-share-context.md
git commit -m "feat: include recovered share context in stage1 archive"
```
