# Two-reviewer mode

Only when the user asks for two reviewers, a parallel review or an adversarial review. The coordinator owns scope, checks, reconciliation and the final verdict.

- **Split** (default): one reviewer does Correctness + Standards, the other Spec. With no spec, run only the first and say so.
- **Adversarial** (when asked): both reviewers run the full [review pass](review.md) on the same brief, blind to each other and to your expected verdict. Prefer different model families; say so if that's not available.

## Steps

1. Launch through the owning runtime with its live model catalog (honor requested models). Record task handles and models. Reviewers can't delegate further.
2. Give both the same brief: absolute repo path, the helper's scope output (snapshot, base/target, files, ranges), absolute paths to the project rule files from [review.md](review.md#1-load-the-projects-rules), the spec source, and the read-only boundary. They report which rule files they used. If the worktree or index changes mid-run, refresh scope and findings.
3. Reviewers only inspect: no fixes, formatters, commits or outside effects. You run the validation commands once and share the results.
4. Wait with the runtime's bounded waits. Check each finding against the real code and drop what fails the [evidence filter](review.md#evidence-filter). Agreement raises priority but proves nothing; a lone reviewer's correctness or security finding gets the same check. If a reviewer fails, retry or report the review incomplete.
5. Report in the main layout. Add reviewers and models to Evidence, and a **⚖️ Disagreements** section for disputed findings that could change the verdict (who said what, why you accepted or rejected it); omit it when there are none.
