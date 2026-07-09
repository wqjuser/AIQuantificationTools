# Release Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fast-forward the 17 Stage 1 preparation commits into local `main`, rebuild the Docker runtime without deleting its persistent volume, rerun the complete Stage 1 acceptance chain, and regenerate the current macOS `0.1.0` DMG.

**Architecture:** Reuse the repository's existing Git history, Docker Compose definition, `stage1:prepare` orchestration, acceptance validators, and desktop release recorder. Keep `aiquantificationtools_quant-data` intact by never passing `-v` to `docker compose down`; do not add another release wrapper.

**Tech Stack:** Git, Docker Compose v2, npm, Python 3.12, Vitest, unittest, Rust/Cargo, Tauri 2, macOS `hdiutil`.

## Global Constraints

- Merge exactly `main..codex/stage1-prepare-command`, which must contain 17 commits.
- Use a fast-forward-only merge into local `main`; do not rewrite history or push.
- Preserve the named Docker volume `aiquantificationtools_quant-data`.
- Preserve `paperOnly=true`, `liveTradingAllowed=false`, and `liveBlockedBoundary=true` in all release and acceptance manifests.
- Regenerate version `0.1.0` from `apps/web/src-tauri/tauri.conf.json`.

---

### Task 1: Verify And Integrate The 17 Commits

**Files:**
- Verify: `package.json`
- Verify: `tools/stage1_prepare.py`
- Verify: `services/quant_core/quant_core/stage1_bootstrap_preflight.py`

**Interfaces:**
- Consumes: branch `codex/stage1-prepare-command` at `a9af0a7` and base `main` at `696dc73`.
- Produces: local `main` at the same tree and commit as `codex/stage1-prepare-command`.

- [x] **Step 1: Verify the clean 17-commit range**

Run:

```bash
git status --short --branch
test "$(git rev-list --count main..codex/stage1-prepare-command)" = 17
git diff --check main..codex/stage1-prepare-command
```

Expected: clean worktree except this plan, count `17`, and no whitespace errors.

- [x] **Step 2: Verify the feature branch before integration**

Run:

```bash
npm test
```

Expected: Python and web test suites exit `0` with no failures.

- [x] **Step 3: Refresh remote refs and fast-forward local main**

Run:

```bash
git fetch --prune origin
test "$(git rev-parse main)" = "$(git rev-parse origin/main)"
git switch main
git merge --ff-only codex/stage1-prepare-command
test "$(git rev-parse main)" = "$(git rev-parse codex/stage1-prepare-command)"
```

Expected: local `main` fast-forwards from `696dc73` to `a9af0a7` with exactly 17 commits and no merge commit.

- [x] **Step 4: Verify the merged result**

Run:

```bash
npm test
git diff --check origin/main..main
```

Expected: all tests pass and the integrated commit range has no whitespace errors.

### Task 2: Rebuild Docker While Preserving The Data Volume

**Files:**
- Verify: `compose.yaml`
- Verify: `Dockerfile.api`
- Verify: `apps/web/Dockerfile`

**Interfaces:**
- Consumes: named volume `aiquantificationtools_quant-data` mounted at `/app/data`.
- Produces: healthy `api` and `web` containers built from merged `main`, still using the same named volume.

- [x] **Step 1: Record the persistent volume identity**

Run:

```bash
docker volume inspect aiquantificationtools_quant-data
docker compose exec -T api sh -lc 'test -d /app/data && find /app/data -maxdepth 1 -type f -print | sort'
```

Expected: the volume exists and `/app/data` contains the local SQLite state.

- [x] **Step 2: Rebuild and restart the Compose services**

Run:

```bash
docker compose down
docker compose build
docker compose up -d
```

Expected: both images build successfully; no command removes the named volume.

- [x] **Step 3: Verify health and volume reuse**

Run:

```bash
docker compose ps
docker compose exec -T api sh -lc 'test -d /app/data && find /app/data -maxdepth 1 -type f -print | sort'
npm run docker:smoke -- --no-build
```

Expected: `api` and `web` are healthy, the prior volume files remain present, and the basic smoke test passes.

### Task 3: Rerun Stage 1 Acceptance And Rebuild The DMG

**Files:**
- Execute: `tools/stage1_prepare.py`
- Generate (ignored): `data/p0-acceptance.json`
- Generate (ignored): `data/p1-acceptance.json`
- Generate (ignored): `data/p2-paper-replay.json`
- Generate (ignored): `data/p2-pre-live-acceptance.json`
- Generate (ignored): `data/p2-readiness-acceptance.json`
- Generate (ignored): `data/p2-chain-preflight.json`
- Generate (ignored): `data/desktop-release.json`
- Generate (ignored): `data/stage1-daily-use.json`
- Generate (ignored): `data/stage1-bootstrap-preflight.json`
- Generate (ignored): `apps/web/src-tauri/target/release/bundle/dmg/AIQuantificationTools_0.1.0_x64.dmg`

**Interfaces:**
- Consumes: rebuilt Compose images, persistent `/app/data`, and the existing Stage 1 full preparation plan.
- Produces: fresh paper-only P0/P1/P2 evidence, fresh Stage 1 reports, and the current `0.1.0` DMG plus desktop release manifest.

- [x] **Step 1: Verify the full orchestration plan**

Run:

```bash
npm run stage1:prepare:plan
```

Expected: nine steps covering P0, P1, the P2 readiness chain, P2 preflight, desktop release, daily-use refresh, bootstrap preflight, and both Stage 1 validators.

- [x] **Step 2: Execute the full preparation**

Run:

```bash
npm run stage1:prepare
```

Expected: every step exits `0`; Docker acceptances remain paper-only/live-blocked; Tauri rebuilds `AIQuantificationTools_0.1.0_x64.dmg` and refreshes `data/desktop-release.json`.

- [x] **Step 3: Revalidate all generated evidence**

Run:

```bash
npm run docker:smoke:p0:validate
npm run docker:smoke:p1:validate
npm run docker:smoke:p2:paper-replay:validate
npm run docker:smoke:p2:pre-live:validate
npm run docker:smoke:p2:validate
npm run stage1:daily:validate
npm run stage1:preflight:validate
```

Expected: every validator exits `0` and reports passed/ready paper-only evidence.

- [x] **Step 4: Synchronize the fresh readback manifests into the existing volume**

Run:

```bash
for report in p0-acceptance.json p1-acceptance.json p2-paper-replay.json p2-pre-live-acceptance.json p2-readiness-acceptance.json p2-chain-preflight.json desktop-release.json stage1-daily-use.json stage1-bootstrap-preflight.json; do
  docker compose cp "data/$report" "api:/app/data/$report"
done
```

Expected: only the nine generated JSON manifests are refreshed under `/app/data`; existing SQLite files remain untouched, and container API readback returns this run's ids, release, and Stage 1 ready states.

### Task 4: Keep Stage 1 Package Evidence In The API Image

**Files:**
- Modify: `Dockerfile.api`
- Test: `apps/web/src/lib/deployment.test.js`

**Interfaces:**
- Consumes: Stage 1 bootstrap preflight source path `package.json`.
- Produces: an API image where `/app/package.json` exists, so container readback does not downgrade a fresh preflight to `review`.

- [x] **Step 1: Add a failing deployment contract assertion**

Add this assertion to the API Dockerfile contract test:

```javascript
expect(apiDockerfile).toContain("COPY package.json package.json");
```

- [x] **Step 2: Verify RED**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/deployment.test.js
```

Expected: fail because `Dockerfile.api` does not include root `package.json`.

- [x] **Step 3: Add the required runtime evidence file**

Add this one Dockerfile instruction before the service/tool copies:

```dockerfile
COPY package.json package.json
```

- [x] **Step 4: Verify GREEN and rebuild the runtime**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/deployment.test.js
docker compose build api
docker compose up -d --force-recreate api web
```

Expected: the focused test passes, both services become healthy, the same volume remains mounted, and the Stage 1 bootstrap API readback returns `ready=7/7`.

### Task 5: Verify The Release Artifacts And Final Repository State

**Files:**
- Verify: `data/desktop-release.json`
- Verify: `apps/web/src-tauri/target/release/bundle/dmg/AIQuantificationTools_0.1.0_x64.dmg`

**Interfaces:**
- Consumes: fresh Stage 1 and desktop release artifacts.
- Produces: final evidence that the local release sync is usable and no source changes were introduced by the release run.

- [x] **Step 1: Verify the DMG and release manifest**

Run:

```bash
hdiutil verify apps/web/src-tauri/target/release/bundle/dmg/AIQuantificationTools_0.1.0_x64.dmg
shasum -a 256 apps/web/src-tauri/target/release/bundle/dmg/AIQuantificationTools_0.1.0_x64.dmg
PYTHONPATH=services/quant_core node tools/run_python.mjs -c 'from pathlib import Path; from quant_core.desktop_release import load_desktop_release_report, validate_desktop_release_manifest; manifest = load_desktop_release_report(); artifact = Path(manifest["desktopArtifactPath"]); assert manifest["version"] == "0.1.0" and artifact.suffix == ".dmg" and artifact.is_file(); print(validate_desktop_release_manifest(manifest))'
```

Expected: `hdiutil` reports `verified`, SHA-256 is printed, and the manifest validator confirms the current `0.1.0` DMG without rewriting the manifest after Stage 1 reports were generated.

- [x] **Step 2: Verify runtime and repository state**

Run:

```bash
docker compose ps
git status --short --branch
git log --oneline origin/main..main
```

Expected: Compose services are healthy; source state contains only the release-sync plan and the focused API-image regression fix; local `main` contains the 17 intended integrated commits and no unrequested push occurred.

- [x] **Step 3: Commit the release blocker fix and execution record**

Run:

```bash
git add Dockerfile.api apps/web/src/lib/deployment.test.js docs/superpowers/plans/2026-07-10-release-sync.md
git commit -m "fix: ship stage1 evidence in api image"
git status --short --branch
```

Expected: one focused local commit records the persistent container-readback fix and completed release plan; the worktree is clean and no push occurs.
