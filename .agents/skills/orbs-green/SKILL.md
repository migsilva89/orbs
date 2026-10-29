---
name: orbs-green
description: "Run and repair the repository's complete local CI gate before a PR, push, release, or handoff. Default to the full repository; partial gates require an explicit request."
disable-model-invocation: true
---

# Green

Produce a **green gate**: every locally reproducible check the repository and its PR CI require passes from the repo root after all fixes. Default scope: the whole repo, every workspace and package.

## 1. Resolve the gate

- Run every command from the Git root. In a monorepo, target members with the task runner, workspace filter, `--manifest-path` or the tool's working-dir option. Record `git status --short` first.
- Read agent instructions, contributor/testing/release docs, the root task runner, manifests, lockfiles and CI workflows. Follow declared workspaces or Cargo members; only without a declaration, find manifests with `rg --files`.
- Repo scripts and exact CI commands win. Fallbacks when no aggregate exists:
  - **Rust:** `cargo fmt --all` then `--check`; `check`, Clippy, tests, builds with `--workspace --all-targets` (`--all-features` / `nextest` when CI does). Clippy warnings are errors if CI says so.
  - **JS/TS:** lockfile's package manager; `lint:fix`/formatter, then `lint`, `typecheck`, non-watch `test`, `build`.
  - **PHP:** Composer scripts, else `vendor/bin` Pint (writer then `--test`) or PHP-CS-Fixer, PHPStan/Psalm, PHPUnit/Pest.
  - **Other:** the formatter, linter, typecheck, test and build gates in config or CI.
- Build a matrix: every relevant CI job maps to a local command (including generated-file/schema checks and integration/e2e when local prerequisites exist) or a named external-only blocker. Every workspace counted exactly once.

## 2. Scope

**Full** unless the user explicitly asks for partial. Full uses repo-wide commands with no file, folder, package or test filters; flags left from earlier debugging don't count. **Partial** runs exactly the requested boundary, lists omitted gates and is never called CI-ready.

## 3. Fix, then verify

1. Run the repo's lint fixer and formatter writer across the scope (or the tool's own fix mode if only checks are documented).
2. Inspect the diff. Keep pre-existing user changes; never weaken gates, assertions or coverage thresholds.
3. Run each matrix command independently so one failure doesn't hide others. Capture command and exit status.
4. Fix failures within the task's scope and repeat.
5. Rerun the **entire matrix from a clean start**. Earlier targeted reruns are diagnostics, not the gate.

Unrelated product changes, missing credentials or services, or external infra → stop and report. A blocker is a failed gate.

## 4. Verdict

`FULL LOCAL GATE: PASS` only when, in the final pass, every full-mode command succeeded, every workspace was included, nothing was skipped, narrowed or swapped for a lighter command, generated files and the tree are in the expected state, and `git status --short` was rechecked with all gate-made changes reported. Otherwise `FULL LOCAL GATE: FAIL` or `PARTIAL GATE: PASS|FAIL`.

End with the verdict, exact commands and statuses, files changed by fixers, and skipped checks or blockers. Never say "green" or "CI-ready" below this bar.
