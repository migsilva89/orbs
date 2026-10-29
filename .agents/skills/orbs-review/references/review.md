# Review pass

Findings only: source, config and enforcement files keep their bytes, and fixes wait for approval once findings are shown. Validation commands may write temp files and refresh their declared ignored caches; that doesn't authorize fix-formatters or edits to tracked generated files.

Work from the scope the helper printed and read the snapshot it names: worktree, index (`git show :<path>`), or target commit (`git show <target>:<path>`). Read deleted files and removed lines from the base (old path for renames), and trace consumers from the same snapshot. For `git diff` use `--cached` on staged reviews and `"$BASE" "$TARGET"` on commit reviews. Inventory reviews (`--folder`, `--all`) inspect current files.

Three axes, each judged on its own: **Correctness**, **Standards**, **Spec**. Never let one axis mask another, and never pick one worst finding across axes.

## 1. Load the project's rules

Read, resolving each pointer from the file that names it:

- root and scoped `AGENTS.md` / `CLAUDE.md`, `.agents/AGENTS.md`;
- `.agents/references/quality-gate.md` and every reference it names;
- `.agents/references/architecture.md` when it exists, **even if nothing links to it**;
- `CODING_STANDARDS.md`, `CONTRIBUTING.md` and other files that document how code is written here;
- lint and architecture-test config (Oxlint, Fallow, architecture tests): read the actual rules and severities before claiming something is enforced.

The project's architecture and rules are the standard. A broken documented rule is a **Standards: FAIL** with the rule cited, even with no runtime bug. Existing code that breaks a rule is not a precedent: label it `legacy` and report it only inside the scope. Record which rule files you read; a missing or conflicting one makes the affected axis incomplete.

## 2. Find the spec

In order: requirements the user stated or supplied; issue refs in the commits (`#123`, `Closes #45`) and linked PRs, via the project's tracker workflow; repository plans or specs matching the branch or feature (`.agents/plans/`, `docs/`, `specs/`). Nothing found → ask once; no spec at all → `Spec: not assessed` with the reason.

## 3. Run the checks

Run the deterministic commands from `quality-gate.md` once. Record each command's scope and snapshot: worktree checks only validate worktree bytes. A check you couldn't run on the requested snapshot makes validation incomplete.

## 4. Review

1. **Enforcement tampering first:** changed lint, test, config or workflow files, new suppressions, skipped tests, narrowed globs, weakened assertions or severities.
2. **Highest-risk paths:** auth and tenancy, input boundaries, cross-resource state, external calls, retries and partial success, idempotency and concurrency, producer-consumer contracts, UI pending and error states.
3. **Bug fixes:** does the change restore the broken invariant, or hide the symptom? Trace new guards, retries, fallbacks and casts to the contract that needs them.
4. **Standards:** the project rules from step 1, then the smell baseline below.
5. **Spec:** map each in-scope requirement to code: met, partial, missing or unverified. Also flag behavior nobody asked for (supporting work is not scope creep). Missing features need the searched entry points, not an invented path.
6. Grep each surviving defect shape across the scope, so you fix the class and not one example.

In `everything`, cuts the simplify pass already applied are part of the change: check them for behavior drift too. Task skills loaded during a review are reference only; their implementation steps stay unrun.

## Smell baseline

Applies even when a project documents nothing. Always a judgement call ("possible Feature Envy"), never a hard violation. A documented project rule always wins: where the project endorses something, drop the smell. Skip whatever lint already enforces. Report one only with a concrete maintenance or behavior consequence.

- **Mysterious Name:** the name doesn't say what it does or holds. → rename; if no honest name comes, the design is murky.
- **Duplicated Code:** the same logic shape in more than one place. → extract it, call it from both.
- **Feature Envy:** uses another module's data more than its own. → move it next to that data.
- **Data Clumps:** the same fields or params keep travelling together. → bundle them into one type.
- **Primitive Obsession:** a string or number standing in for a domain concept. → give it its own small type.
- **Repeated Switches:** the same `switch` / `if` cascade on the same value in several places. → one shared map, or polymorphism.
- **Shotgun Surgery:** one logical change scattered across many files. → gather what changes together.
- **Divergent Change:** one file edited for several unrelated reasons. → split by reason to change.
- **Speculative Generality:** parameters, hooks or layers for needs nobody has. → delete; inline until a real need shows.
- **Message Chains:** long `a.b().c().d()` navigation the caller shouldn't depend on. → one method on the first object.
- **Middle Man:** mostly delegates onward. → cut it, call the real target.
- **Refused Bequest:** a subclass or implementer ignoring most of what it inherits. → composition instead.

## Evidence filter

A **behavioral** finding is valid only when the code proves all four: the invariant that must hold, the violating lines, an executable path to them, and a concrete impact. Drop phantom callers, assumed framework behavior, speculative null, load or attack scenarios, test-strength opinions, schema preferences with no defect, and style dressed as a bug. A cited rule violation is a standards finding and needs no runtime defect. Keep tool output in Validation, not as duplicate findings.

## Report

Fills the 🐛 Correctness, 📐 Standards, one 📄 row per project rule document, and 🎯 Spec rows and the **Fix** table, one row per finding, ordered P0 → P3. Problem states the impact in one line; Standards rows cite the rule or smell (`architecture §3 Errors`, `possible Feature Envy`), and `legacy` findings say so. Likely fix is the smallest change that restores the invariant or rule. Each axis row carries its count; a finished axis keeps its result when another is undetermined. Unfinished checks or unread files mean ⚠️ incomplete, never ✅. Rule files read, commands with outcomes and snapshot limits, and unread files go in Evidence.
