# Blast radius pass

## Proof ladder

For each fact the change's safety depends on, get it as far down this list as is cheap, and say where it stopped.

1. You said so. Worthless on its own.
2. You pointed at the line. A real `file:line`, or the library's own source.
3. You showed the bad case can't happen. You walked the failure step by step and it doesn't reach.
4. You ran it. A script or test that calls the real code and fails loud if you're wrong.
5. You reproduced it in the running app.

Step 4 is usually one small script that imports the same library the app ships and calls the exact function you're worried about. Write and run proof scripts outside the repository, leaving the repo clean.

## Steps

1. Read the change. The diff, the symbols it adds, changes, and deletes, and what it now does differently, including the part the diff doesn't spell out. Anchor the review in file paths and symbols. Use `git blame`, `git log --follow -p -- <file>`, and recent commits touching the target to establish its history. Read relevant PR bodies and discussions with `gh pr view <number> --json title,body,comments,reviews` when available. Report unavailable history as unavailable.
2. Find the one fact it's safe because of. Most changes that look risky are safe because of a single fact, like "this call only drops already-dead cache entries and does nothing else". Find that fact. If it holds, most risky cases are cleared at once. Spend your time here, not on a long list of maybes.
3. Look where grep stops. Read the source of the library you call, and check its pinned version and any local patch. Work out when things run: microtasks, unmount and teardown, Solid versus React. Follow what a symbol search misses: the JSON an API returns, a DB column, a wire format, another language reading the same bytes, a feature flag, code three hops downstream.
4. Be honest about each risk. Describe its likelihood and cost from evidence; use a number only when measured. Separate observed facts, supported inferences, and unproven possibilities. Keep confirmed risks and list checked-and-cleared cases separately. Cite a real `file:line`; a search that finds nothing is still an answer. Name callers and APIs you read in the code.
5. Prove the one fact. Write a script or test that runs the real code, run it, and paste what happened.
6. For a big or wide change, ask two independent reviewers the same risk question with the same diff, scope, history, and safety assumptions: use the adversarial mode in [parallel-review.md](parallel-review.md). Agreement is not proof. Prefer the smallest coherent remedy that restores the invariant and removes obsolete complexity; verify the real code rather than relying on reviewer summaries.

Write plainly using the applicable writing rules, cite real code, and strip anything private before it goes anywhere public.

**Done when:** the safety fact sits at a named ladder step, and every consumer path you followed is either cleared or written up as a risk.

## Report

Fills the 💥 Blast radius row with the safety fact and its ladder step (`✅ safe, step 4: <fact>`). Each confirmed risk is a **Fix** row: where it breaks (path:line), likelihood and cost in Problem, and the cheapest check or remedy as Likely fix. Cleared cases go in **Checked, fine**. What the change does beyond the diff, proof output and the pre-merge script go in Evidence.
