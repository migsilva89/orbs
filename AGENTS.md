# Openbots

Bot backend with a native daemon, device pairing, bot configuration, and authenticated submit, stop, and live views of persistent per-bot Pi Durable conversations. Pi supplies shared provider authentication. Desktop, mobile, private DMs, file APIs, and a provider-login UI are not implemented.

## Read first

- Before code changes, read `.agents/references/architecture.md` for structure and module conventions.
- Before UI changes, read `DESIGN.md`.
- For Pi Durable work, read `.agents/docs/pi-durable.md` and check the runtime's own API before adding custom behavior.
- When designing features, check [public Orbs](https://github.com/nikuscs/orbs) for ideas and edge cases, especially files, attachments, and tool permissions. It is a reference only, not a specification or architecture to copy. Follow Openbots scope and conventions; prefer a cleaner solution and existing Pi capabilities.

## Rules

- Follow nearby code. Keep changes direct; add no compatibility shims or speculative abstractions.
- Before adding infrastructure, inspect the installed library's API and official examples. Use library features where they fit. For Pi Durable, check its tools, extensions, documents, tasks, watches, and recovery before adding app tables, queues, registries, or wait mechanisms. Name the concrete API gap before writing a custom replacement; keep only product policy and host integration in Openbots.
- Store application secrets as encrypted key/value entries in the shared `credentials` table through the credentials service. Do not add service-specific secret tables or plaintext secret columns. Pi provider authentication remains in Pi's own auth store.
- Each daemon has one owner and uses device pairing for access. Do not add users, organizations, memberships, roles, or password login. Read `.agents/plans/main/05-auth-and-pairing.md` before authentication work.
- Bot settings and tool credentials belong in the database. Derive bot working folders from `OPENBOTS_DATA_DIR/agents/<botId>`; store IDs, not absolute home paths. Tool permissions use Pi hooks. Skill inheritance and composer discovery use Pi’s loader; MCP file discovery is available; MCP execution, plugins, and instruction-file loading remain pending. Provider authentication uses Pi's `ModelRuntime` and its auth files, shared by bots; keep it separate from Durable storage. `packages/env` holds only process/build configuration, with separate public client and private server entries. Add mobile configuration when the mobile app needs it.
- User-facing copy uses English keys in `packages/i18n/messages/en/`. Remove matching Portuguese keys when deleting or renaming a key.
- Preserve architecture, lint, TypeScript, and Fallow rules. Changes to these contracts require the user's explicit request; never weaken them to pass a check.
- Keep development data and credentials separate from production. Never start, restart, or stop a dev server yourself.
- Run existing checks. Add tests only when the user asks.

## Validation

Run `bun run check` and `bun run lint`; use `.agents/references/quality-gate.md` when reviewing. After changing agent guidance, run `bun scripts/utils-sync-agents.ts`.
