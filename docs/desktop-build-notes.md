# Desktop Build Notes

The Tauri shell is configured under `apps/web/src-tauri`.

On this Windows host, `cargo check` reaches Tauri transitive dependencies but the OS rejects execution of some generated Cargo build-script executables with `Access denied (os error 5)`. Minimal repros outside this repository also fail for affected crates, so this is a local Rust/Windows execution-policy issue rather than application code.

Observed evidence:

- `parking_lot_core v0.9.12` failed in a temporary standalone Cargo project with the same `Access denied` error.
- Vendoring `parking_lot_core` and `selectors` to avoid their build scripts let the build progress further.
- The next failure moved to `vswhom-sys v0.1.3`, confirming the broader host build-script execution problem.

Recommended local fix before desktop packaging:

1. Check Windows security software or execution policy for generated executables under Cargo `target/debug/build`.
2. Retry `cargo check` in `apps/web/src-tauri`.
3. Run `npm run desktop:release` after `cargo check` succeeds.

## Stage 1/P0 Daily-Use Release Check

The homepage Stage 1/P0 daily-use closure card now reads desktop packaging status from `GET /api/desktop/release/latest`, backed by `data/desktop-release.json`. Missing manifests keep the desktop release row in `review`; invalid manifests move the row to `blocked`; passed manifests mark the row ready. The row also exposes a local refresh action so the operator can re-read the latest manifest after a build.

Use this command for a daily desktop release check:

```bash
npm run desktop:release
```

The command runs the web build, `cargo check` inside `apps/web/src-tauri`, Tauri desktop packaging, then records `data/desktop-release.json` with `kind=aiqt.desktopReleaseManifest`, `schemaVersion=1`, `status=passed`, the target `platform`, `version`, Tauri config path, artifact path, and these passed check ids: `web-build`, `cargo-check`, `tauri-icon`, `desktop-bundle`, `live-blocked-boundary`.

If packaging has already completed and only the manifest needs to be refreshed, run:

```bash
npm run desktop:release:record
```

The release manifest must keep `paperOnly=true`, `liveTradingAllowed=false`, and `liveBlockedBoundary=true`. The backend rejects live-enabled or incomplete manifests and the frontend fallback also keeps live trading blocked.

This check only covers the desktop shell and packaging path. It does not unlock live trading, broker connectivity, order submission, or any P0/P1/P2 execution gate.
