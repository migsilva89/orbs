# Quality gate

Review the changed files and their callers against `.agents/references/architecture.md`. Report a defect only when the code proves its effect.

## Checks

```sh
bun run check
bun run lint
bun run lint:dead
```

`check` and `lint` must finish without warnings or errors. `lint:dead` must exit cleanly; its remaining warnings are exported service types kept by the architecture convention. Run existing tests when affected; no application tests exist yet, and an empty test task is not coverage. Add tests only at the user's request.

## Review

- Domain naming and file placement follow the architecture reference.
- Services receive dependencies; handlers and service assembly stay thin.
- Validate external values at their boundary. Keep server secrets out of client code.
- Use shared typed errors and logs; preserve error causes and handle failures explicitly.
- Keep UI copy in i18n, and remove obsolete keys in every locale.
- Reuse existing helpers; avoid wrappers, unused exports, and speculative fallback paths.
- After a removal or rename, check exports, imports, schemas, configuration, generated output, and docs for old references.
- State what was verified and what remains unverified. A blocked required check makes the review incomplete.

## Protected enforcement

Architecture rules, Oxlint, Fallow, TypeScript, Vitest, Turbo, CI, and package check scripts change only for an explicit user request. Keep existing rule severities. Suppressions, skipped tests, or reduced checks are not fixes.

Use `FAIL` for proven defects and convention violations; use `WARN` for optional improvements. Include the file, effect, and fix direction.
