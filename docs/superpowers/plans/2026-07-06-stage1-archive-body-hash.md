# Stage 1/P0 Archive Body Hash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a verifiable Stage 1/P0 daily-use archive body SHA-256 to copied/downloaded archive Markdown and status feedback.

**Architecture:** Keep `buildStage1P0DailyUseArchiveCopyText` as the synchronous Markdown formatter, with an optional body hash line. Add an async `buildStage1P0DailyUseArchiveBundle` that builds the body once without the hash, computes SHA-256 using the existing `sha256TextHex`, then rebuilds the Markdown with `Archive body SHA-256` in the summary. The App uses the bundle for both clipboard and download paths so the Markdown, filename, and status feedback stay in sync.

**Tech Stack:** TypeScript model helper, Web Crypto SHA-256, React callbacks, Vitest source/model tests, Markdown docs.

---

### Task 1: Lock the archive body hash contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Import and test the async bundle helper**

Add `buildStage1P0DailyUseArchiveBundle` to the existing `terminal-workbench.test.ts` import list. In the Stage 1/P0 archive test area, add a test that builds the same fixture as the current archive copy text test and asserts:

```ts
const archive = await buildStage1P0DailyUseArchiveBundle({
  closure,
  invalidShareDiagnosticsCopyText:
    "# Stage 1/P0 Invalid Share Link Diagnostics\nStatus: invalid\nReason: invalid-workspace",
  invalidShareStatus: {
    reason: null,
    state: null,
    status: "none"
  },
  refreshOutcome,
  resolveShareUrl: (link) => `http://127.0.0.1:5174/${link}`,
  shareDeepLinkState: {
    focus: "research-entry",
    kind: "daily-use",
    targetWorkspaceId: "research"
  }
});
const bodyMarkdown = buildStage1P0DailyUseArchiveCopyText({
  closure,
  invalidShareDiagnosticsCopyText:
    "# Stage 1/P0 Invalid Share Link Diagnostics\nStatus: invalid\nReason: invalid-workspace",
  invalidShareStatus: {
    reason: null,
    state: null,
    status: "none"
  },
  refreshOutcome,
  resolveShareUrl: (link) => `http://127.0.0.1:5174/${link}`,
  shareDeepLinkState: {
    focus: "research-entry",
    kind: "daily-use",
    targetWorkspaceId: "research"
  }
});
const expectedHash = await sha256TextHexForTest(bodyMarkdown);

expect(archive.fileName).toBe(
  "stage1-p0-daily-use-archive-blocked-1-of-2-daily-use-research-entry-research.md"
);
expect(archive.bodySha256).toEqual({ algorithm: "sha256", hash: expectedHash });
expect(archive.contentMarkdown).toContain(`- Archive body SHA-256: ${expectedHash}`);
expect(archive.contentMarkdown).toContain("- Suggested file name: stage1-p0-daily-use-archive-blocked-1-of-2-daily-use-research-entry-research.md");
```

- [x] **Step 2: Extend App source-contract expectations**

In the Stage 1/P0 daily-use layout test, require:

```js
expect(appSource).toContain("buildStage1P0DailyUseArchiveBundle");
expect(appSource).toContain("const archive = await buildStage1P0DailyUseArchiveBundle();");
expect(appSource).toContain("navigator.clipboard.writeText(archive.contentMarkdown)");
expect(appSource).toContain("new Blob([archive.contentMarkdown], { type: \"text/markdown;charset=utf-8\" })");
expect(appSource).toContain("anchor.download = archive.fileName;");
expect(appSource).toContain("archive.bodySha256.hash.slice(0, 12)");
```

- [x] **Step 3: Run focused tests and verify failure**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: both fail until the helper and App paths are updated.

### Task 2: Implement archive body hash bundle

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Add archive bundle type and optional summary line**

Add:

```ts
export interface Stage1P0DailyUseArchiveBundle {
  bodySha256: {
    algorithm: "sha256";
    hash: string;
  };
  contentMarkdown: string;
  fileName: string;
}
```

Extend `buildStage1P0DailyUseArchiveCopyText` with `archiveBodySha256 = null` and add this line after `Suggested file name` when provided:

```ts
...(archiveBodySha256 ? [`- Archive body SHA-256: ${archiveBodySha256}`] : []),
```

- [x] **Step 2: Add async bundle helper**

Add:

```ts
export async function buildStage1P0DailyUseArchiveBundle(
  input: Parameters<typeof buildStage1P0DailyUseArchiveCopyText>[0]
): Promise<Stage1P0DailyUseArchiveBundle> {
  const bodyMarkdown = buildStage1P0DailyUseArchiveCopyText(input);
  const bodyHash = await sha256TextHex(bodyMarkdown);
  return {
    bodySha256: {
      algorithm: "sha256",
      hash: bodyHash
    },
    contentMarkdown: buildStage1P0DailyUseArchiveCopyText({
      ...input,
      archiveBodySha256: bodyHash
    }),
    fileName: buildStage1P0DailyUseArchiveFileName({
      closure: input.closure,
      invalidShareStatus: input.invalidShareStatus,
      shareDeepLinkState: input.shareDeepLinkState
    })
  };
}
```

- [x] **Step 3: Use archive bundle in App copy/download paths**

Import `buildStage1P0DailyUseArchiveBundle`, replace the local archive text callback with an async bundle callback, and update copy/download callbacks to use `archive.contentMarkdown`, `archive.fileName`, and `archive.bodySha256.hash.slice(0, 12)` in status labels.

- [x] **Step 4: Run focused tests and verify pass**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: both pass.

### Task 3: Document archive body hash behavior

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [x] **Step 1: Update README**

Clarify that copied/downloaded Stage 1/P0 daily-use archive Markdown includes `Archive body SHA-256`, and copy/download status labels show the short hash.

- [x] **Step 2: Update product plan**

Append a latest update explaining that the archive bundle computes a body SHA-256 for offline cross-checking, with no audit write, refresh, command execution, broker connection, or order submission.

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
git add README.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts docs/product-plan.md docs/superpowers/plans/2026-07-06-stage1-archive-body-hash.md
git commit -m "feat: fingerprint stage1 daily archives"
```
