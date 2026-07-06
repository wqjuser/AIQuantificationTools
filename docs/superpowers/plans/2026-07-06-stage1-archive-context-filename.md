# Stage 1/P0 Archive Context Filename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make downloaded Stage 1/P0 daily-use archive filenames describe the archive state and share-link context.

**Architecture:** Add a deterministic `buildStage1P0DailyUseArchiveFileName` helper beside the archive Markdown builder. The helper uses the existing closure state/counts plus either the active recovered share context, invalid share-link reason, or a `no-share` fallback; App uses the helper for the browser download filename while copy behavior remains unchanged.

**Tech Stack:** TypeScript model helper, React App download wiring, Vitest model/source-contract tests, Markdown docs.

---

### Task 1: Lock the filename contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Import and test the filename helper**

Add `buildStage1P0DailyUseArchiveFileName` to the existing terminal workbench imports and add a focused model test near the archive copy-text test:

```ts
  test("builds safe Stage 1/P0 daily-use archive file names", () => {
    const closure = { readyCount: 1, state: "blocked", totalCount: 2 };

    expect(
      buildStage1P0DailyUseArchiveFileName({
        closure,
        shareDeepLinkState: {
          focus: "research-entry",
          kind: "daily-use",
          targetWorkspaceId: "research"
        }
      })
    ).toBe("stage1-p0-daily-use-archive-blocked-1-of-2-daily-use-research-entry-research.md");

    expect(
      buildStage1P0DailyUseArchiveFileName({
        closure,
        invalidShareStatus: {
          reason: "invalid-workspace",
          state: null,
          status: "invalid"
        }
      })
    ).toBe("stage1-p0-daily-use-archive-blocked-1-of-2-invalid-share-invalid-workspace.md");

    expect(buildStage1P0DailyUseArchiveFileName({ closure })).toBe(
      "stage1-p0-daily-use-archive-blocked-1-of-2-no-share.md"
    );
  });
```

- [x] **Step 2: Add App source-contract expectations**

In the Stage 1/P0 daily-use layout test, require:

```js
    expect(appSource).toContain("buildStage1P0DailyUseArchiveFileName");
    expect(appSource).toContain("const archiveFileName = buildStage1P0DailyUseArchiveFileName({");
    expect(appSource).toContain("invalidShareStatus: initialStage1P0DailyUseShareDeepLinkStatus");
    expect(appSource).toContain("anchor.download = archiveFileName;");
```

- [x] **Step 3: Run focused tests and verify failure**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive file names"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: both fail before implementation.

### Task 2: Implement filename helper and download wiring

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Export the filename helper**

Add this helper near the Stage 1/P0 archive builders:

```ts
export function buildStage1P0DailyUseArchiveFileName({
  closure,
  invalidShareStatus = null,
  shareDeepLinkState = null
}: {
  closure: Pick<Parameters<typeof buildStage1P0ShareLinkBundleCopyText>[0]["closure"], "readyCount" | "state" | "totalCount">;
  invalidShareStatus?: Stage1P0DailyUseShareDeepLinkStatus | null;
  shareDeepLinkState?: Stage1P0DailyUseShareDeepLinkState | null;
}): string {
  const segments = [
    "stage1",
    "p0",
    "daily",
    "use",
    "archive",
    closure.state,
    `${closure.readyCount}-of-${closure.totalCount}`
  ];
  if (shareDeepLinkState) {
    segments.push(shareDeepLinkState.kind, String(shareDeepLinkState.focus), shareDeepLinkState.targetWorkspaceId);
  } else if (invalidShareStatus?.status === "invalid") {
    segments.push("invalid", "share", invalidShareStatus.reason);
  } else {
    segments.push("no", "share");
  }
  return `${segments.map(stage1P0DailyUseArchiveFileNameToken).join("-")}.md`;
}
```

Add:

```ts
function stage1P0DailyUseArchiveFileNameToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}
```

- [x] **Step 2: Use the helper in App**

Import `buildStage1P0DailyUseArchiveFileName`. In `downloadStage1P0DailyUseArchive`, compute:

```ts
      const archiveFileName = buildStage1P0DailyUseArchiveFileName({
        closure: stage1P0DailyUseClosure,
        invalidShareStatus: initialStage1P0DailyUseShareDeepLinkStatus,
        shareDeepLinkState: initialStage1P0DailyUseShareDeepLinkState
      });
```

Then replace the static assignment with:

```ts
      anchor.download = archiveFileName;
```

Add `stage1P0DailyUseClosure` to the callback dependencies if needed.

- [x] **Step 3: Run focused tests and verify pass**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive file names"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: both pass.

### Task 3: Document the filename behavior

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [x] **Step 1: Update README**

Clarify that downloaded daily-use archives use deterministic filenames with daily state/count and share-link context.

- [x] **Step 2: Update product plan**

Append a latest update explaining that downloaded Stage 1/P0 archives now include state/count and valid/invalid/no-share context in the filename, with no new runtime side effects.

### Task 4: Verify and commit

**Files:**
- Modify: all files above

- [x] **Step 1: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive file names"
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
git add README.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts docs/product-plan.md docs/superpowers/plans/2026-07-06-stage1-archive-context-filename.md
git commit -m "feat: name stage1 archives by context"
```
