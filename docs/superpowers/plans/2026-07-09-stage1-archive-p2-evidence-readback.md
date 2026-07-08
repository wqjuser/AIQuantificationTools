# Stage1 Archive P2 Evidence Readback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Stage 1 daily archive audit records preserve and expose the bootstrap P2 manifest-chain evidence that daily handoffs and startup snapshots now show.

**Architecture:** Keep archive Markdown body storage unchanged: audit metadata stores only compact structured evidence fields. Extend the archive review event builder, Audit ledger row projection, query/title/search helpers, and latest archive reference matching so `p2-manifest-chain` and `data/p2-chain-preflight.json` affect current/stale status.

**Tech Stack:** TypeScript, Vitest, existing `terminal-api` audit event builder and `terminal-workbench` ledger/readback models.

## Global Constraints

- Do not store the archive Markdown body in audit metadata.
- Do not run Docker, generate P2 manifests, refresh Stage 1 evidence, connect brokers, enable live trading, or submit orders.
- Keep `liveTradingAllowed=false`, `orderSubmissionEnabled=false`, `liveOrderSubmitted=false`, and `routeExecuted=false` in archive audit metadata.
- Preserve existing Stage 1 daily-use five-row UI; P2 chain evidence stays in bootstrap/archive evidence surfaces.
- Use test-first changes for API metadata and workbench readback behavior.

---

### Task 1: Promote Bootstrap P2 Evidence Into Stage 1 Archive Readback

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

**Interfaces:**
- Consumes: `Stage1P0DailyUseClosure.bootstrapPreflightChecks` and `Stage1P0DailyUseClosure.bootstrapPreflightSourcePaths`.
- Produces: archive audit metadata fields `bootstrapPreflightCheckIds`, `bootstrapPreflightCheckStatuses`, `bootstrapPreflightCheckSourcePaths`, and `bootstrapPreflightP2ManifestChainPreflightSourcePath`.

- [x] **Step 1: Write failing API metadata test**

Require `buildStage1P0DailyUseArchiveReviewAuditEvent` to accept bootstrap preflight evidence on `closure` and emit compact arrays:

```ts
expect(event.metadata.bootstrapPreflightCheckIds).toEqual(["p2-manifest-chain"]);
expect(event.metadata.bootstrapPreflightCheckStatuses).toEqual(["ready"]);
expect(event.metadata.bootstrapPreflightCheckSourcePaths).toEqual(["data/p2-chain-preflight.json"]);
expect(event.metadata.bootstrapPreflightP2ManifestChainPreflightSourcePath).toBe("data/p2-chain-preflight.json");
expect(event.metadata.markdown).toBeUndefined();
```

- [x] **Step 2: Write failing workbench ledger/reference tests**

Require `buildAuditEvidenceReportLedgerRows` to expose bootstrap evidence on `stage1_daily_archive_review` rows, include it in query/search/title, and require `buildStage1P0DailyUseArchiveReviewReference` to mark an archive stale when the current closure has different bootstrap evidence.

- [x] **Step 3: Run RED tests**

Run:

```bash
npm run test --workspace @aiqt/web -- terminal-api.test.ts -t "Stage 1 daily-use archive audit event"
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts -t "Stage 1 daily archive|daily archive review"
```

Expected: fail because archive audit metadata and ledger rows do not yet carry bootstrap P2 evidence.

- [x] **Step 4: Implement API metadata**

Extend `Stage1P0DailyUseArchiveReviewClosure` with optional bootstrap evidence fields. Serialize check ids, statuses, source paths, and the P2 chain source path into metadata while keeping archive Markdown body out of metadata.

- [x] **Step 5: Implement workbench ledger and matching**

Add row fields for bootstrap check ids/statuses/source paths and P2 chain source path. Include these fields in search text, archive row query/title/reference copy, and `stage1DailyArchiveReviewRowMatchesContext`.

- [x] **Step 6: Run GREEN and regression checks**

Run:

```bash
npm run test --workspace @aiqt/web -- terminal-api.test.ts -t "Stage 1 daily-use archive audit event"
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts -t "Stage 1 daily archive|daily archive review"
npm run test --workspace @aiqt/web
npm run build
npm run test:python
```

Expected: targeted and full tests pass; build succeeds with only the existing chunk-size warning.

- [x] **Step 7: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-09-stage1-archive-p2-evidence-readback.md apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: track p2 evidence in stage1 archives"
```
