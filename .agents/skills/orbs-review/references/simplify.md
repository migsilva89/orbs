# Simplify pass

## Principles

- Preserve functionality and public APIs.
- Follow project instructions and established local patterns.
- Improve clarity by removing unnecessary complexity, nesting, silent fallbacks, and broad type escapes.
- The best outcome is a shorter diff. Name every cut with one of the tags below.
- Reuse existing helpers and types before creating new ones.
- Read surrounding code for context without editing unchanged code.

## Cuts

Hunt these five shapes by name. One line per cut: `<file>:L<line>: <tag> <what>. <replacement>.`

- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled thing the standard library ships. Name the function.
- `native:` dependency or code doing what the platform or framework already does. Name the feature.
- `yagni:` abstraction with one implementation, config nobody sets, layer with one caller.
- `shrink:` same logic, fewer lines. Show the shorter form.

A single smoke test or assert-based self-check is the minimum, not bloat; leave it.

## Process

1. Inspect each scoped change and nearby established patterns.
2. Apply each cut inside the printed changed lines (added and untracked files whole), one tagged line per cut.
3. Re-read the final diff skeptically and remove unjustified complexity.
4. Run the relevant tests, lint, and typecheck. A check that passed on the base snapshot and fails now is a regression you introduced: fix it before reporting.
5. Summarize the tagged cuts, end with `net: -<N> lines`, and name any worthwhile out-of-scope simplification left untouched.

Correctness bugs, security holes, and performance problems are out of scope for this pass. In `everything`, carry them into the review pass as findings. In `simplify` mode, report them and recommend a `code` run.

Nothing left to cut in scope: say `Lean already.` and stop; an empty cut list is the correct report. In `everything`, this stop ends this pass only; continue to the review pass.

**Done when:** every changed line in scope has been read and either cut with a tag or deliberately left.

## Report

Fills the ✂️ Simplify row (`-<N> lines` or `lean already`) and the **Cuts applied** list, one line per cut: path:line `<tag>` <what> → <replacement>. Worthwhile out-of-scope simplifications left untouched go in Evidence.
