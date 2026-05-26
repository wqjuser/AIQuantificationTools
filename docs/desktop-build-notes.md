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
3. Run `npm run desktop:build` after `cargo check` succeeds.
