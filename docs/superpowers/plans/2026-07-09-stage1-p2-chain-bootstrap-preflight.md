# Stage1 P2 Chain Bootstrap Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Stage 1 bootstrap preflight surface the current P2 manifest-chain readiness so daily startup can show whether P2 evidence is ready, missing, or needs the next archived-manifest action.

**Architecture:** Reuse `quant_core.p2_manifest_chain_preflight.load_p2_manifest_chain_preflight_status` as the single P2 chain readback source. Stage 1 bootstrap preflight adds one `p2-manifest-chain` check, includes `data/p2-chain-preflight.json` in stale-source tracking, and keeps live trading/order submission disabled.

**Tech Stack:** Python stdlib, `unittest`, existing `quant_core` manifest status loaders, npm script wrappers.

## Global Constraints

- Do not generate P2 evidence from Stage 1 bootstrap preflight; read existing local manifest only.
- Missing or blocked P2 chain evidence should create a review state with a concrete command, not authorize live trading.
- Invalid or unsafe P2 chain evidence should block Stage 1 bootstrap preflight.
- Preserve `paperOnly=true`, `liveTradingAllowed=false`, and `liveBlockedBoundary=true`.

---

### Task 1: Add P2 Chain To Stage1 Bootstrap Contract

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `services/quant_core/quant_core/stage1_bootstrap_preflight.py`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

**Interfaces:**
- Consumes: `load_p2_manifest_chain_preflight_status(path: Path) -> dict[str, Any]`.
- Produces: Stage 1 preflight check id `p2-manifest-chain`, source path key `p2ManifestChainPreflight`, and required package script `docker:smoke:p2:preflight`.

- [x] **Step 1: Write failing tests**

Add tests requiring ready Stage 1 preflight to include:

```python
"p2-manifest-chain"
```

and requiring missing P2 chain evidence to produce:

```python
status == "review"
nextAction == "review-p2-manifest-chain"
recommendedCommand == "npm run docker:smoke:p2:preflight"
```

- [x] **Step 2: Run RED tests**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_bootstrap_preflight
```

Expected: fail because Stage 1 bootstrap preflight still has six checks and no `p2-manifest-chain` check.

- [x] **Step 3: Implement P2 chain check**

Import P2 chain defaults/status loader, load `data/p2-chain-preflight.json`, add the check after P1 acceptance, and update required scripts, source paths, stale-source mapping, default check labels, and live-boundary evidence detection.

- [x] **Step 4: Run GREEN tests**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_bootstrap_preflight
```

Expected: pass.

- [x] **Step 5: Verify Stage1 and P2 commands**

Run:

```bash
npm run test:python
npm run test --workspace @aiqt/web
npm run build
npm run docker:smoke:p2:preflight
npm run stage1:preflight
npm run stage1:preflight:validate
npm run stage1:daily:validate
npm run docker:smoke:p2:validate
```

Expected: Python and web tests pass; build succeeds; Stage 1 preflight reports seven checks; P2 chain and readiness validators remain paper-only/live-blocked.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-09-stage1-p2-chain-bootstrap-preflight.md services/quant_core/quant_core/stage1_bootstrap_preflight.py services/quant_core/tests/test_quant_core.py
git commit -m "feat: include p2 chain in stage1 preflight"
```
