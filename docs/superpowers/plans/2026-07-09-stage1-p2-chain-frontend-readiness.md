# Stage1 P2 Chain Frontend Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the frontend Stage 1 daily-start experience explicitly understand and export the new P2 manifest-chain bootstrap preflight check.

**Architecture:** Keep the backend contract unchanged. Update the TypeScript API contract, safe fallback, Stage 1 bootstrap summary, daily handoff text, and startup snapshot text so `p2-manifest-chain` and `data/p2-chain-preflight.json` are visible in the same local-only, paper-only startup surfaces.

**Tech Stack:** TypeScript, Vitest, existing `terminal-api` and `terminal-workbench` models.

## Global Constraints

- Do not add a new API endpoint or run any Docker command from the frontend.
- Preserve existing Stage 1 daily-use five-row UI; P2 chain appears through bootstrap preflight detail and exported handoff/snapshot text.
- Keep all generated text explicit that live trading remains blocked.
- Use test-first changes for contract and workbench behavior.

---

### Task 1: Promote P2 Chain To The Frontend Stage1 Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

**Interfaces:**
- Consumes: `Stage1BootstrapPreflight.sourcePaths.p2ManifestChainPreflight`.
- Produces: frontend-safe seven-check fallback and startup copy that includes `p2-manifest-chain`.

- [x] **Step 1: Write failing contract tests**

Update Stage 1 bootstrap preflight API tests to require:

```ts
expect(result.preflight?.readyCount).toBe(7);
expect(result.preflight?.checks.map((check) => check.id)).toContain("p2-manifest-chain");
expect(result.preflight?.sourcePaths.p2ManifestChainPreflight).toBe("data/p2-chain-preflight.json");
```

- [x] **Step 2: Write failing workbench tests**

Require `buildStage1BootstrapPreflightSummary` ready headline to be `7/7`, and require the daily handoff or startup snapshot copy text to include:

```text
P2 manifest chain
p2-manifest-chain: ready
data/p2-chain-preflight.json
```

- [x] **Step 3: Run RED tests**

Run:

```bash
npm run test --workspace @aiqt/web -- terminal-api.test.ts -t "Stage 1 bootstrap"
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts -t "Stage 1 bootstrap|startup snapshot"
```

Expected: fail because fallback/sample contract still has six checks and no P2 chain source path.

- [x] **Step 4: Implement minimal frontend contract update**

Add `p2ManifestChainPreflight` to `Stage1BootstrapPreflightSourcePaths`, require it in the type guard, update the missing fallback report, and update test fixtures to include the P2 chain check.

- [x] **Step 5: Implement startup copy visibility**

Add a compact bootstrap preflight evidence section to daily handoff/startup snapshot text using existing `Stage1BootstrapPreflightSummary.checks` and `sourcePaths`.

- [x] **Step 6: Run GREEN and regression checks**

Run:

```bash
npm run test --workspace @aiqt/web -- terminal-api.test.ts -t "Stage 1 bootstrap"
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts -t "Stage 1 bootstrap|startup snapshot"
npm run test --workspace @aiqt/web
npm run build
```

Expected: targeted and full web tests pass; build succeeds with only the existing chunk-size warning.

- [x] **Step 7: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-09-stage1-p2-chain-frontend-readiness.md apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: surface p2 chain in stage1 startup"
```
