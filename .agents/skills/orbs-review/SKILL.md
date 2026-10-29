---
name: orbs-review
description: "Review code with three modes: `simplify` (behavior-preserving cuts), `code` (findings on correctness, security, project standards and spec), `blast` (what breaks beyond the diff, proven by running code), or all three in order. Scopes: worktree diff, staged, a ref or commit, a folder, or the whole repo; optional two-reviewer mode. Use when asked to review, simplify or audit code, to look over a diff, branch or PR, or to find what a change could break. Not for designing a module's interface (codebase-design)."
---

# Review

## Modes

| Argument | Does | Loads |
|---|---|---|
| `simplify` | behavior-preserving cuts | [references/simplify.md](references/simplify.md) |
| `code` | findings only | [references/review.md](references/review.md) |
| `blast` | what breaks beyond the diff, proven by running code | [references/blast-radius.md](references/blast-radius.md) |
| *(none)*, `everything` | simplify, review, then blast | each reference as its pass starts |

Read the mode from the first argument alone; prose words are text, not modes. Consume it and pass every remaining flag and path to the helper. Name the mode before running. When you triggered this skill yourself and the user gave no mode argument, run `code`.

In `everything`, run `blast` when the first run's scope holds modified, renamed or deleted files; when every scoped file is added or untracked, skip it and say so. Load each reference as its pass starts. The closing "stop" in `references/simplify.md` ends its own pass; the run continues.

## Scope

Run from the root of the repository being reviewed; resolve the script path relative to this `SKILL.md`:

```bash
bun <skill-directory>/scripts/quality-gate.ts [--staged | --ref=<ref> | --commit=<ref>] [path ...]
bun <skill-directory>/scripts/quality-gate.ts (--folder <dir> ... | --all)
```

The helper owns scope. The **snapshot** is the bytes it names — worktree, index, or target commit. Read the snapshot; disk content belongs to a different one. Preserve its mode, base, file list and ranges for the whole run.

"The whole X folder" is `--folder`, a full-repository audit is `--all`, bare paths filter a diff; inventory modes take paths through `--folder` alone. An editing pass adds `--ref=HEAD` when the user named no base and asked for no branch-wide pass; any explicit scope mode stands as given. An empty first run ends the run.

## Editing

| Mode | Writes |
|---|---|
| `simplify` | source, inside the printed changed lines; added and untracked files whole |
| `code` | nothing |
| `blast` | throwaway proof scripts outside the repository, leaving the repo clean |

Config, enforcement and tracked generated files keep their current bytes, and formatters run in check mode. Validation may refresh declared ignored artifacts. Defect fixes need approval once findings are presented; a behavior-preserving cut ships with the pass.

## Project rules

Each project defines its own architecture and rules; review checks the code against them. Read root and scoped `AGENTS.md`/`CLAUDE.md`, `.agents/AGENTS.md`, `.agents/references/quality-gate.md` plus every reference it names, and `.agents/references/architecture.md` when it exists, resolving each pointer from the document that owns it. Breaking a documented rule fails Standards. Project rules beat generic heuristics. Report a missing or conflicting reference and carry on with what the project does supply.

## Passes

In `everything`, the first run's base and file list stay the review scope. Re-run the helper once a cut lands, to refresh ranges: files that drop out stay in the review, and an empty refresh leaves the run open. Reuse a check already run on the same command, scope and snapshot.

Two reviewers when the user asks for them: [references/parallel-review.md](references/parallel-review.md), once scope is fixed. Simplify finishes first; reviewers read.

## Coverage

Record which files you read and what stayed unread. A ✅ Validation row and any ✅ pass require every scoped file read; short of that, Validation is ⚠️ incomplete.

## Report

One report per run. Lead with what needs fixing; terse words, no preamble or recap. Each pass reference names the rows it fills.

```md
## 🧾 Review: <scope> · <N> files

| Pass | Result |
|---|---|
| ✂️ Simplify | ✅ -<N> lines · ✅ lean already · ⏭️ not run |
| 🐛 Correctness | ✅ correct · ❌ <N> bugs · ❔ undetermined |
| 📐 Standards | ✅ pass · ❌ <N> violations · ⚠️ <N> nits |
| 📄 <rule document> | ✅ pass · ❌ <N> violations · ⚠️ <N> nits |
| 🎯 Spec | ✅ met · ❌ <N> gaps · ⏭️ not assessed |
| 💥 Blast radius | ✅ safe, step <N> · ❌ <N> risks · ❔ unproven · ⏭️ not run |
| 🧪 Validation | ✅ complete · ⚠️ incomplete: <what> |

### 🔧 Fix
| # | Sev | Axis | Where | Problem | Likely fix |
|---|---|---|---|---|---|
| 1 | 🔴 P0 | 🐛 | path/to/file.ts:42 | <one line> | <the concrete change> |

### ✂️ Cuts applied
- path/to/file.ts:12 `<tag>` <what> → <replacement>

### ✅ Checked, fine
- <one line each>

<details><summary>🔬 Evidence</summary>

Rule files read · commands, scope and results · proof output · unread files

</details>
```

- Severity: 🔴 P0 · 🟠 P1 · 🟡 P2 · ⚪ P3. Axis: 🐛 correctness · 📐 standards · 📄 <rule document> · 🎯 spec · 💥 blast radius.
- Give each project rule document the review loaded its own 📄 row, named after the file (architecture.md, CODING_STANDARDS.md, CONTRIBUTING.md, DESIGN.md, quality-gate.md…), and tag its findings with that name. 📐 Standards keeps lint, the smell baseline and rules from AGENTS.md/CLAUDE.md; with no rule documents it is the only standards row.
- Every file mention is a bare repo-relative `path:line` (or `path:start-end`) so it stays clickable; no backticks around it.
- **Likely fix** names the most probable change: the call, value or line to write, or a short inline snippet. Say "unclear" only when the evidence can't point to one.
- One line per cell; anything longer goes in Evidence. Drop empty sections; no findings → `✅ Nothing to fix.`
- With findings, end by asking what to do, through the runtime's choice prompt when it has one, otherwise a short numbered list:
  1. Apply every Likely fix (recommended)
  2. Apply only some: name the rows (#1, #3)
  3. Fix #N differently: the user describes how, or you offer the next-best alternative
  4. Leave as is

  The answer is the fix approval; apply only what it covers. With nothing to fix, offer commit or nothing.
