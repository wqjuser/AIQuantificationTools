# Stage 1 Shareable Workspace Link Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let operators copy the Stage 1/P0 daily-use primary workspace link and refresh receipt next-step workspace link directly from the homepage.

**Architecture:** Promote the existing Stage 1/P0 relative `?workspace=...` links from copyText-only strings into typed model fields. The homepage copies those fields through two new clipboard callbacks and status labels, then passes them into `Stage1P0DailyUseClosurePanel` as optional actions. This remains frontend navigation sharing only: no backend writes, no audit events, no Stage 1 command execution, no desktop build, no broker connection, no order submission.

**Tech Stack:** TypeScript model helpers, React callbacks, Vitest model tests, source-contract layout test, existing Stage 1/P0 panel CSS classes.

---

### Task 1: Model And UI Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Write failing model assertions**

Add assertions to the Stage 1/P0 model tests:

```ts
expect(closure.primaryWorkspaceLink).toBe("?workspace=audit");
expect(closure.rows[0]?.workspaceLink).toBe("?workspace=audit");
expect(closure.rows[4]?.workspaceLink).toBe("?workspace=settings");
expect(outcome.targetWorkspaceLink).toBe("?workspace=research");
expect(outcome.entries[0]?.workspaceLink).toBe("?workspace=settings");
expect(outcome.entries[2]?.workspaceLink).toBe("?workspace=settings");
```

- [x] **Step 2: Write failing App source-contract assertions**

Extend the Stage 1/P0 layout test with these assertions:

```js
expect(appSource).toContain("const [copiedStage1P0DailyUsePrimaryLink, setCopiedStage1P0DailyUsePrimaryLink]");
expect(appSource).toContain("const [copiedStage1P0DailyUseRefreshOutcomeLink, setCopiedStage1P0DailyUseRefreshOutcomeLink]");
expect(appSource).toContain("setCopiedStage1P0DailyUsePrimaryLink(false);");
expect(appSource).toContain("setCopiedStage1P0DailyUseRefreshOutcomeLink(false);");
expect(appSource).toContain("const copyStage1P0DailyUsePrimaryLink = useCallback");
expect(appSource).toContain("navigator.clipboard.writeText(stage1P0DailyUseClosure.primaryWorkspaceLink)");
expect(appSource).toContain("Stage 1 daily primary link copied");
expect(appSource).toContain("Stage 1 daily primary link copy failed");
expect(appSource).toContain("const copyStage1P0DailyUseRefreshOutcomeLink = useCallback");
expect(appSource).toContain("navigator.clipboard.writeText(stage1P0DailyUseRefreshOutcome.targetWorkspaceLink)");
expect(appSource).toContain("Stage 1 refresh receipt next link copied");
expect(appSource).toContain("Stage 1 refresh receipt next link copy failed");
expect(appSource).toContain("isPrimaryLinkCopied={copiedStage1P0DailyUsePrimaryLink}");
expect(appSource).toContain("isRefreshOutcomeLinkCopied={copiedStage1P0DailyUseRefreshOutcomeLink}");
expect(appSource).toContain("onCopyPrimaryLink={() => void copyStage1P0DailyUsePrimaryLink()}");
expect(appSource).toContain("onCopyRefreshOutcomeLink={() => void copyStage1P0DailyUseRefreshOutcomeLink()}");
expect(appSource).toContain("onCopyPrimaryLink?: () => void;");
expect(appSource).toContain("onCopyRefreshOutcomeLink?: () => void;");
expect(appSource).toContain('i18n.locale === "zh-CN" ? "复制入口链接" : "Copy link"');
expect(appSource).toContain('i18n.locale === "zh-CN" ? "复制下一步链接" : "Copy next link"');
```

- [x] **Step 3: Run RED tests**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: FAIL because model link fields and UI copy actions do not exist yet.

- [x] **Step 4: Implement model link fields**

Extend model interfaces:

```ts
workspaceLink: string;
primaryWorkspaceLink: string;
targetWorkspaceLink: string;
```

Use the existing `stage1P0DailyUseWorkspaceLink(...)` helper when constructing rows, closure, refresh outcome entries, and refresh outcome.

- [x] **Step 5: Implement UI copy actions**

Add copied state:

```ts
const [copiedStage1P0DailyUsePrimaryLink, setCopiedStage1P0DailyUsePrimaryLink] = useState(false);
const [copiedStage1P0DailyUseRefreshOutcomeLink, setCopiedStage1P0DailyUseRefreshOutcomeLink] = useState(false);
```

Reset on link changes:

```ts
useEffect(() => {
  setCopiedStage1P0DailyUsePrimaryLink(false);
}, [stage1P0DailyUseClosure.primaryWorkspaceLink]);

useEffect(() => {
  setCopiedStage1P0DailyUseRefreshOutcomeLink(false);
}, [stage1P0DailyUseRefreshOutcome?.targetWorkspaceLink]);
```

Add clipboard callbacks that mirror the existing handoff/receipt copy failure behavior. Pass them into `Stage1P0DailyUseClosurePanel`.

Extend panel props and render one copy-link button beside the handoff footer actions and one copy-next-link button beside refresh receipt actions.

- [x] **Step 6: Run GREEN tests**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: PASS.

### Task 2: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-02-stage1-shareable-workspace-link-actions.md`

- [x] **Step 1: Update docs**

Mention that the homepage can copy the daily-use primary link and refresh receipt next-step link directly.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 3: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-shareable-workspace-link-actions.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: add stage1 workspace link actions"
```
