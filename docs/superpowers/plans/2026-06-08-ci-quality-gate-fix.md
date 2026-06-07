# CI Quality Gate Fix Plan

**Goal:** Stop GitHub Actions `quality-gate` from failing on every push and remove the Node.js 20 action runtime warning.

**Root Cause:** The GitHub Linux runner failed in the `Run tests` step because `test_quantdinger_style_kline_adapter_maps_akshare_minute_rows` imported `pandas`, but pandas is an optional data-source dependency and is not installed by `npm ci` or the Python test setup. The local Windows environment passed because pandas was already available outside the project contract.

**Scope:** Stage 0 platform maintenance only. This does not add trading functionality.

## Tasks

- [x] Reproduce the failing CI test in a Linux Python 3.12 container with the same unittest command used by GitHub Actions.
- [x] Remove the hidden pandas dependency from the unit test by using a minimal fake frame implementing the `iterrows()` contract used by the adapter.
- [x] Update `.github/workflows/ci.yml` to use Node 24 action-runtime versions of checkout/setup actions and opt into `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`.
- [x] Re-run the Linux container Python test command.
- [x] Re-run the local full quality gate.
- [x] Commit and push through the configured proxy.
