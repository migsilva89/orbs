# Openbots

Bot backend with a native daemon, device pairing, bot configuration, and authenticated submit, stop, and live views of persistent per-bot Pi Durable conversations. Pi supplies shared provider authentication. Explicit skills, peer messaging, native subagents and attachment APIs are implemented. A web client (chat, bots, artifacts, routines, settings, provider login and device pairing) lives in `apps/web`. Desktop and mobile are not implemented.

## Read first

- Before code changes, read `.agents/references/architecture.md` for structure and module conventions.
- Before UI changes, read `DESIGN.md`.
- For Pi Durable work, read `.agents/docs/pi-durable.md` and check the runtime's own API before adding custom behavior.
- When designing features, check [public Orbs](https://github.com/nikuscs/orbs) for ideas and edge cases, especially files, attachments, and tool permissions. It is a reference only, not a specification or architecture to copy. Follow Openbots scope and conventions; prefer a cleaner solution and existing Pi capabilities.

## Rules

- Follow nearby code. Keep changes direct; add no compatibility shims or speculative abstractions.
- Before adding infrastructure, inspect the installed library's API and official examples. Use library features where they fit. For Pi Durable, check its tools, extensions, documents, tasks, watches, and recovery before adding app tables, queues, registries, or wait mechanisms. Name the concrete API gap before writing a custom replacement; keep only product policy and host integration in Openbots.
- Store application secrets as encrypted key/value entries in the shared `credentials` table through the credentials service. Do not add service-specific secret tables or plaintext secret columns. Pi provider authentication remains in Pi's own auth store.
- Each daemon has one owner and uses device pairing for access. Do not add users, organizations, memberships, roles, or password login. There is no local pair CLI; paired devices issue grants through authenticated RPC. First-device bootstrap uses an owner-only local socket; the public transport cannot issue bootstrap grants. Local UI integration is pending. Read `.agents/plans/main/05-auth-and-pairing.md` before authentication work.
- `apps/daemon` is startup, composition, transport and shutdown only. Product logic belongs in server; Pi integration belongs in runtime. Native implementations stay in their owning package. Follow the ownership table and dependency rules in the architecture reference; fix conflicting code instead of rewriting the rules.
- Services have concrete domain ownership and receive whole service dependencies. Skill/MCP settings and discovery belong to those domains; a combined response does not justify a catchall service.
- User-facing copy uses English keys in `packages/i18n/messages/en/`. Remove matching Portuguese keys when deleting or renaming a key.
- Preserve architecture, lint, TypeScript, and Fallow rules. Changes to these contracts require the user's explicit request; never weaken them to pass a check.
- Keep development data and credentials separate from production. User owns the web server, ask before stopping, restart or starting new ones. Open them in paseo terminal
- Run existing checks. Add tests only when the user asks.
- After a substantial set of code changes, run the `review` skill in full (simplify, code, blast), fix findings within the authorized task, and rerun affected checks before reporting completion. Do not wait for a separate fix request.

## Validation

Run `bun run check` and `bun run lint`; use `.agents/references/quality-gate.md` when reviewing. After changing agent guidance, run `bun scripts/utils-sync-agents.ts`.
