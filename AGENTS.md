# Openbots

Bot app scaffold with a native daemon, device pairing, shared server, and authenticated submit, stop, and live view of one persistent Pi Durable conversation. Pi supplies provider authentication and model configuration. Desktop, mobile, bot integration, files, and a provider-login UI are not implemented.

## Read first

- Before code changes, read `.agents/references/architecture.md` for structure and module conventions.
- Before UI changes, read `DESIGN.md`.
- For Pi Durable work, read `.agents/docs/pi-durable.md` and check the runtime's own API before adding custom behavior.
- When designing features, check [public Orbs](https://github.com/nikuscs/orbs) for ideas and edge cases, especially files, attachments, and tool permissions. It is a reference only, not a specification or architecture to copy. Follow Openbots scope and conventions; prefer a cleaner solution and existing Pi capabilities.

## Rules

- Follow nearby code. Keep changes direct; add no compatibility shims or speculative abstractions.
- Each daemon has one owner and uses device pairing for access. Do not add users, organizations, memberships, roles, or password login. Read `.agents/plans/main/05-auth-and-pairing.md` before authentication work.
- Bot settings and tool credentials belong in the database. Provider authentication uses Pi's `ModelRuntime` and its auth files, shared by bots; keep it separate from Durable storage. `packages/env` holds only process/build configuration, with separate public client and private server entries. Add mobile configuration when the mobile app needs it.
- User-facing copy uses English keys in `packages/i18n/messages/en/`. Remove matching Portuguese keys when deleting or renaming a key.
- Preserve architecture, lint, TypeScript, and Fallow rules. Changes to these contracts require the user's explicit request; never weaken them to pass a check.
- Keep development data and credentials separate from production. Never start, restart, or stop a dev server yourself.
- Run existing checks. Add tests only when the user asks.

## Validation

Run `bun run check` and `bun run lint`; use `.agents/references/quality-gate.md` when reviewing. After changing agent guidance, run `bun scripts/utils-sync-agents.ts`.
