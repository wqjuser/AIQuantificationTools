# Stage 1 Daily Use Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current Stage 1/P0 daily-use closure copyable as a stable Markdown handoff for personal users and small teams.

**Architecture:** Extend the pure `buildStage1P0DailyUseClosure` model with deterministic `copyText` built from the already-rendered five closure rows, primary action, stale source hints, and live-blocked boundary. The homepage adds a clipboard action on the existing Stage 1/P0 card and keeps navigation local-only. No backend, audit ledger, broker, Docker, or desktop build behavior changes.

**Tech Stack:** TypeScript, React, Vitest, existing CSS contract tests, local Markdown text generation.

---

### Task 1: Model Handoff Markdown

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write the failing model test**

Add assertions to the existing `builds a Stage 1/P0 daily-use closure from clean-open, refresh, research, daily start, and desktop release signals` test:

```ts
expect(closure.copyText).toContain("# Stage 1/P0 Daily Use Handoff");
expect(closure.copyText).toContain("State: blocked");
expect(closure.copyText).toContain("Ready: 0/5");
expect(closure.copyText).toContain("Primary action: Refresh P0 acceptance -> audit");
expect(closure.copyText).toContain("- Clean environment open [blocked]: Clean environment acceptance is missing");
expect(closure.copyText).toContain("- Market refresh recovery [blocked]: Provider cooldown");
expect(closure.copyText).toContain("- Research entry [blocked]: K-line cache is empty");
expect(closure.copyText).toContain("- Daily start path [review]: Daily start needs attention");
expect(closure.copyText).toContain("- Desktop release [review]: Desktop release manifest missing");
expect(closure.copyText).toContain("Live trading remains blocked.");
```

Add assertions to the stale bootstrap preflight closure test:

```ts
expect(closure.copyText).toContain("Stale bootstrap preflight sources: data/stage1-daily-use.json");
expect(closure.copyText).toContain("Stale daily-use sources: none");
```

- [x] **Step 2: Run RED model test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use closure"
```

Expected: FAIL because `closure.copyText` is not defined.

- [x] **Step 3: Implement model handoff text**

Add `copyText: string` to `Stage1P0DailyUseClosure`.

After the rows, primary row, state, stale summaries, and counts are known, build the return object with:

```ts
copyText: buildStage1P0DailyUseClosureCopyText({
  bootstrapPreflightStaleSourcePaths,
  primaryActionLabel: primaryRow.actionLabel,
  primaryTargetWorkspaceId: primaryRow.targetWorkspaceId,
  readyCount,
  rows,
  staleSourcePaths: dailyUseReport?.staleSourcePaths ?? [],
  state,
  totalCount: rows.length
})
```

Create helper:

```ts
function buildStage1P0DailyUseClosureCopyText({
  bootstrapPreflightStaleSourcePaths,
  primaryActionLabel,
  primaryTargetWorkspaceId,
  readyCount,
  rows,
  staleSourcePaths,
  state,
  totalCount
}: {
  bootstrapPreflightStaleSourcePaths: string[];
  primaryActionLabel: string;
  primaryTargetWorkspaceId: ProductWorkAreaId;
  readyCount: number;
  rows: Stage1P0DailyUseClosureRow[];
  staleSourcePaths: string[];
  state: Stage1P0DailyUseClosureStatus;
  totalCount: number;
}): string {
  return [
    "# Stage 1/P0 Daily Use Handoff",
    `State: ${state}`,
    `Ready: ${readyCount}/${totalCount}`,
    `Primary action: ${primaryActionLabel} -> ${primaryTargetWorkspaceId}`,
    `Stale daily-use sources: ${staleSourcePaths.length > 0 ? staleSourcePaths.join(", ") : "none"}`,
    `Stale bootstrap preflight sources: ${
      bootstrapPreflightStaleSourcePaths.length > 0 ? bootstrapPreflightStaleSourcePaths.join(", ") : "none"
    }`,
    "",
    ...rows.map((row) => `- ${row.label} [${row.status}]: ${row.detail}`),
    "",
    "Live trading remains blocked."
  ].join("\n");
}
```

- [x] **Step 4: Run GREEN model test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use closure"
```

Expected: PASS.

### Task 2: Homepage Copy Action

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Write the failing App contract test**

Extend the Stage 1/P0 layout test to assert:

```js
expect(appSource).toContain("const [copiedStage1P0DailyUseHandoff, setCopiedStage1P0DailyUseHandoff]");
expect(appSource).toContain("setCopiedStage1P0DailyUseHandoff(false);");
expect(appSource).toContain("const copyStage1P0DailyUseHandoff = useCallback");
expect(appSource).toContain("navigator.clipboard.writeText(stage1P0DailyUseClosure.copyText)");
expect(appSource).toContain("Stage 1 daily handoff copy failed");
expect(appSource).toContain("onCopyHandoff={() => void copyStage1P0DailyUseHandoff()}");
expect(appSource).toContain("isHandoffCopied={copiedStage1P0DailyUseHandoff}");
expect(appSource).toContain("复制日常手册");
expect(appSource).toContain("Copy handoff");
expect(cssBlock(".stage1-p0-daily-use-copy")).toContain("border: 1px solid rgba(148, 163, 184, 0.28);");
```

- [x] **Step 2: Run RED App contract test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: FAIL because the copy handoff state, callback, props, labels, and CSS are missing.

- [x] **Step 3: Implement homepage copy action**

Add `copiedStage1P0DailyUseHandoff` state near the other copied states.

Add reset effect:

```ts
useEffect(() => {
  setCopiedStage1P0DailyUseHandoff(false);
}, [stage1P0DailyUseClosure.copyText]);
```

Add copy callback:

```ts
const copyStage1P0DailyUseHandoff = useCallback(async () => {
  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard API unavailable");
    }

    await navigator.clipboard.writeText(stage1P0DailyUseClosure.copyText);
    setCopiedStage1P0DailyUseHandoff(true);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Stage 1 daily handoff copied",
      error: undefined
    }));
  } catch (copyError) {
    setCopiedStage1P0DailyUseHandoff(false);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Stage 1 daily handoff copy failed",
      error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
    }));
  }
}, [stage1P0DailyUseClosure.copyText]);
```

Pass `isHandoffCopied` and `onCopyHandoff` into `Stage1P0DailyUseClosurePanel`.

In the footer action group, add a compact button:

```tsx
<button className="stage1-p0-daily-use-copy" onClick={onCopyHandoff} type="button">
  <Copy size={12} />
  {isHandoffCopied
    ? i18n.locale === "zh-CN"
      ? "已复制"
      : "Copied"
    : i18n.locale === "zh-CN"
      ? "复制日常手册"
      : "Copy handoff"}
</button>
```

Add matching CSS by sharing the existing footer button visual language.

- [x] **Step 4: Run GREEN App contract test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: PASS.

### Task 3: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-02-stage1-daily-use-handoff.md`

- [x] **Step 1: Update docs**

Mention that the Stage 1/P0 daily-use card can copy a current daily handoff Markdown with five row statuses, stale source hints, next action, and live-blocked boundary, without running extra commands or writing audit events.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use closure"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 3: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-daily-use-handoff.md apps/web/src/App.tsx apps/web/src/styles.css apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: add stage1 daily use handoff"
```
