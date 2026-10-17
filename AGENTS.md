# Openbots

Bot app scaffold with a native daemon, device pairing, shared server, and an authenticated live view of one persistent Pi Durable conversation. Desktop, mobile, bot schemas, and chat commands are not implemented.

## Read first

- Before code changes, read `.agents/references/architecture.md` for structure and module conventions.
- Before UI changes, read `DESIGN.md`.
- For Pi Durable work, read `.agents/docs/pi-durable.md` and check the runtime's own API before adding custom behavior.

## Rules

- Follow nearby code. Keep changes direct; add no compatibility shims or speculative abstractions.
- Each daemon has one owner and uses device pairing for access. Do not add users, organizations, memberships, roles, or password login. Read `.agents/plans/main/05-auth-and-pairing.md` before authentication work.
- Bot settings and credentials belong in the database. `packages/env` holds only process/build configuration, with separate public client and private server entries. Add mobile configuration when the mobile app needs it.
- User-facing copy uses English keys in `packages/i18n/messages/en/`. Remove matching Portuguese keys when deleting or renaming a key.
- Preserve architecture, lint, TypeScript, and Fallow rules. Changes to these contracts require the user's explicit request; never weaken them to pass a check.
- Keep development data and credentials separate from production. Never start, restart, or stop a dev server yourself.
- Run existing checks. Add tests only when the user asks.

## Validation

Run `bun run check` and `bun run lint`; use `.agents/references/quality-gate.md` when reviewing. After changing agent guidance, run `bun scripts/utils-sync-agents.ts`.
