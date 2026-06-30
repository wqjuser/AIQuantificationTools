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

## Stage 1/P0 Daily-Use Release Check

The homepage Stage 1/P0 daily-use closure card treats desktop packaging as a local release checklist. Until a successful local Tauri build is explicitly recorded elsewhere, the desktop release row stays in `review` and routes the operator to Settings or these notes.

Use this order for a daily desktop release check:

1. Confirm the web build and tests pass.
2. Run `cargo check` inside `apps/web/src-tauri` on the target machine.
3. Run `npm run desktop:build`.
4. Keep the result as release evidence outside the trading flow.

This check only covers the desktop shell and packaging path. It does not unlock live trading, broker connectivity, order submission, or any P0/P1/P2 execution gate.
