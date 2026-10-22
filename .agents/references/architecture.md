# Architecture

This is the implementation contract. Fix code that conflicts with it; do not rewrite the rules to justify misplaced code. Changes to these boundaries require the user's explicit approval.

## Ownership

| Location | Owns |
| --- | --- |
| `apps/daemon` | Entry, startup composition, listener/transport, signals, shutdown. |
| `apps/web`, `apps/desktop`, `apps/mobile` | UI, server connections, device credential storage. The web app uses TanStack Start SSR and query hydration. SSR calls use the shared client against the configured daemon. Browser calls use its `/rpc` proxy, with WebSockets for live updates. Web credentials are stored in a cookie and sent to the daemon as Bearer headers. |
| `packages/server` | Product services: bots, pairing, settings, credentials, permissions, skill, instruction, plugin and MCP selection/discovery; RPC handlers. |
| `packages/runtime` | Pi integration: Harness, conversations, tools, hooks, approvals, tasks, watches, recovery, skill/instruction/plugin loading, MCP clients. |
| `packages/contracts` | Public schemas, input/output types, oRPC contracts and errors, including the schemas clients validate forms, search params, pairing codes and stored preferences with. No implementations. |
| `packages/client` | Typed RPC calls, reconnect, applying Pi view updates, and the data and view helpers web and mobile share (`src/services/<domain>`). Chat and bot hooks live here, not in the apps. Data hooks and TanStack Query options (`src/hooks/use-*.ts`, `src/services/<domain>/*.client.ts`) use only RPC, TanStack Query and React and ship from `./react`. Hooks that need DOM or Expo/React Native APIs are named `use-*.web.ts` or `use-*.native.ts` and ship from `./web` or `./native`; never give one the same base name as a shared file, because Metro resolves `.native` first. `./client` stays free of React. No UI components; apps keep route-bound hooks and show their own toasts and navigation. |
| Shared packages | Env, errors, logging, i18n, avatars, the secret proxy and tooling. No application dependencies. |

Native code stays in its owning package behind `/native`. Using files, SQLite or subprocesses does **not** make code daemon logic.

- Server/native owns app database construction, credential-key loading, workspace directories and MCP configuration-file discovery.
- Runtime/native owns Pi storage, the host alarm, execution environment, image processing for `read`, skill, instruction and plugin loaders, and MCP connections/tools.
- The daemon constructs and injects these services. It does not implement their operations.
- Startup opens stores, runs migrations once, restores bots, resumes Pi, then starts listening. Pairing and other actions use initialized services; they never boot the app or run migrations.
- Shutdown closes the listener, runtime, MCP clients, app database and Pi storage in reverse dependency order, including on startup failure.

## Dependencies

```text
web/desktop/mobile -> client -> contracts
daemon -> server -> runtime
server/runtime -> contracts
```

The daemon may also import native factories and shared env/logging for composition. These are allowed dependency directions, not permission to import every entry.

- Packages never import apps. Runtime never imports server or client. Clients never import server/runtime implementations or server env.
- Portable server code never imports `/native` implementations. Inject native service objects; use type-only imports for their public interfaces.
- Use explicit `@openbots/*` package exports. No relative imports across packages and no cyclic file or package dependencies, including type-only cycles.
- Read another domain through its public service, not its action/query/driver files. Core wires dependencies; it contains no product decisions.

## Services and files

```text
src/
  core/core.services.ts
  services/<domain>/
    <domain>.service.ts
    <domain>-action.<name>.ts
    <domain>-query.<name>.ts
    <domain>.utils.ts
    <domain>.constants.ts
    <domain>.driver.ts
  types/<domain>[-<part>].types.ts
  rpc/rpc.<area>.ts
  entry.<runtime>.ts
```

Create only the files an operation needs. Folders are flat; files and exports use their domain prefix (`botActionSend`, `botQueryGet`, `makeBotService`). Package entries expose APIs; they do not boot applications.

- Each service has a concrete responsibility. Skill settings/discovery belong to skill; MCP settings/discovery belong to MCP. A combined composer catalog is a response shape, not a `resource` domain.
- Factories receive whole owning services with explicit dependency types, never detached methods or callback bags. Export the factory and its inferred service type.
- Library callbacks remain callbacks: Pi execution environments, oRPC connections and lazy request context do not need invented services.
- Actions and queries take `(deps, params)`. Actions write; queries read without mutations, model calls or starting connections/processes.
- RPC validates input and calls one service operation. Services own policy and database work. URL dispatch belongs to transport/RPC, not auth or other domain services.
- Domain types/schemas live in `types/`. Keep one-use helpers with their owner. Shared helpers use `<domain>.utils.ts`; constants use `<domain>.constants.ts`.

```ts
export function makeSkillService(deps: SkillServiceDeps) {
  return {
    actions: {
      configure: (params: SkillConfigureInput) => skillActionConfigure(deps, params),
    },
    queries: {
      settings: () => skillQuerySettings(deps),
    },
  };
}
export type SkillService = ReturnType<typeof makeSkillService>;
```

## Naming and branching

- Name values for what they hold. Singular nouns for items, plural nouns for collections, `At` for timestamps, units for durations such as `timeoutMs`.
- Booleans and predicates use positive `is`, `has`, `can` or `should` names. Preserve library-defined names at integration boundaries.
- Use `ts-pattern` for new/changed conditional branches. Match the value directly; use `.exhaustive()` for closed unions. Keep branches short. Simple predicates and nullish defaults can remain expressions.
- Validate external input once with Zod; trust typed internal values. Use shared errors and logging. Format all source through the existing checks.

## State and security

- One implicit owner per independent daemon. Devices pair with revocable credentials. No users, organizations, roles or password login.
- Pairing stores token hashes and atomically consumes grants with device creation. Issuing a grant requires an authenticated device or trusted local transport. CLI pairing uses the owner-only daemon socket before or after initial setup; public transport cannot acquire local authority. The daemon prints a startup pairing link while no device exists; see [pairing](../plans/main/05-auth-and-pairing.md).
- App persistence uses `node:sqlite` and Kysely. SQL identifiers are snake_case; `CamelCasePlugin` maps TypeScript camelCase. Migrations preserve existing data.
- Generic non-secret key/value data belongs to the shared `settings` service/table, with domain keys such as `skills.directories`, `mcp.paths` and `tools.approvalRules`.
- Domain settings RPCs return settings objects, not individual flags. Writes are partial: omission preserves, `[]` clears lists, nullable fields use `null` to clear. Return updated settings.
- Application secrets use the shared encrypted `credentials` service/table. AES-GCM uses a fresh IV and authenticates the credential name. The native encryption key stays outside the database. No secret-read RPC or secret values in catalogs/errors.
- Pi provider authentication stays in Pi's `ModelRuntime` and auth store. Do not duplicate it in application SQL.
- `env` contains process/build configuration only. Bot settings and secrets belong in persistence. Derive bot directories from the data root and bot ID; never store machine-specific home paths in bot rows. A working directory is not a sandbox.
- Pi owns transcripts and execution state. No SQL message mirror, approval table, second task queue or custom waiter registry.
- Each bot owns one Pi store, `data/bots/<botId>/runtime.sql`; Pi has no delete API, so the store file is the unit of erasure. Never rename an open or recently closed store file; delete it. One daemon lock guards every store. A failed store closes only its bot; an alarm reopens it. Closing a store holds the bot until the file work ends, so no request reopens a store being cleared or deleted. Configure, clear and delete share one per-bot queue.
- Cross-bot work crosses stores through Pi tasks with stable request IDs, never a shared store. Store-local IDs restart after a clear, so cross-store keys include a random per-store ID. Shared extensions and the model-request limiter are built once for all stores.
- Owner chat preferences (pin, hidden, rank, mute, read position) live in app SQL `bot_preference`; Pi supplies only derived summaries.
- Host wake-up goes through the runtime `AlarmService` port: native timer or Cloudflare Durable Object alarm. Each store arms its earliest saved Pi deadline; there is no job table.
- Runtime owns the command catalog and execution. Expose generic `commands.list`/`commands.execute`; new runtime commands must not require new RPC endpoints. Keep Pi command names and dispatch out of server policy and daemon transport.

## Pi and domain integration

Before adding infrastructure, inspect the installed library API and official examples. Use Pi's tools, extensions, documents, tasks, watches and recovery where they fit. State the concrete missing capability before implementing a replacement. See [Pi examples](../docs/pi-durable.md).

- Server owns product policy. Runtime implements it through Pi hooks and tasks. Install the permission hook last, including for custom and MCP tools.
- Openbots-owned tool names use the `bot_` prefix, for example `bot_message`, `bot_question`, and `bot_routine_create`. Native Pi, MCP and third-party plugin tools keep their provider names.
- Only explicitly trusted tool registrations bypass approval as reads. Names and MCP `readOnlyHint` annotations do not grant trust. Read-only denies other tools; Ask requests approval; Auto uses Jev only for untrusted calls and falls back to Ask; Full allows calls.
- Auto considers owner allow/ask rules in one assessment; ask-first rules win. Recheck policy after Jev and human answers. Load context only when a configured Auto judge needs it.
- Approval decisions and deadlines live in task-scoped Pi documents. Recovery restores their waits; host timers do not wake an offline host. External tool effects are not guaranteed exactly-once.
- Bot identity maps to a stable Pi conversation through a session document. Bot SQL commits before filesystem/MCP preparation; no external work inside SQL transactions.
- Serialize configuration per bot, keeping other bots parallel. After slow preparation, reread bot and relevant domain settings; retry if relevant values changed before publishing to Pi. `updatedAt` is not a unique version. Restore before resume; reconcile before submission.
- Skill service owns settings and inheritance. Runtime uses Pi `loadSkills` and `formatSkillsForPrompt`, including manual-only discovery. Shared inheritance can be disabled without hiding bot-local skills.
- MCP service owns settings, inheritance, file discovery and merge policy. Runtime clients receive parsed configuration and own connections, tool registration, cancellation and disposal. Runtime does not call server discovery.
- Catalog discovery reads files and current connection state; it never connects. Preparation reuses unchanged clients and closes replaced/disabled clients. Changes to tool definitions change their approval identity. Preserve persisted Pi identifiers across naming refactors.
- Use Pi's standalone MCP client and Durable tools, not a CLI extension compatibility layer. Plugin modules default-export Durable extensions; discovery never imports them. Server preparation resolves encrypted credential references; catalogs never return secret values. MCP OAuth uses Pi’s native OAuth helpers with the same encrypted credential store. Exact source precedence and API examples belong in the [README](../../README.md).

## Transport and clients

- Daemon owns the Bun listener and oRPC WebSocket/HTTP adapters. Server owns RPC implementation; contracts own validation and public types.
- Check browser Origin on upgrade and HTTP RPC. Authenticate each network call except token redemption; bootstrap is restricted to trusted local transport. Revocation closes active watches, including idle ones.
- Page history with Pi `entries()` and watch `LiveDoc` for current activity. Use commit notifications to advance the saved entry ID; never mount full transcripts for sidebar or live subscriptions. Keep Chord updates and bounded delivery; reconnect catches up from the last loaded entry without resubmitting input.
- Private contexts and subagents are lazy details of the originating chat, not top-level sidebar chats. Read their history and attach live watches only when selected.
- Disconnect/cancel ends observation, not accepted agent work. Stop is an explicit command. Never automatically retry commands; submit retries reuse the same Pi request ID.
- Read history through Pi's pagination and opaque cursors. Clients display state; their lifecycle never owns agent execution.

## Shared tooling

Use Bun and the root dependency catalog: external dependencies use `catalog:`, workspace packages use `workspace:*`. Run `bun install` after manifest changes and retain the lockfile.

Hosts initialize logging and locale explicitly. Shared packages must not assume Vite, Workers, HTTP ingest routes, locale URLs or cookies. User-facing text uses English i18n keys; remove matching Portuguese keys on rename/removal. Use Paraglide's declaration generation.

Every source package has `check`, `lint` and `lint:fix`. Keep Oxlint, Fallow, TypeScript and CI enforcement intact; never weaken checks to fit code. Run the [quality gate](quality-gate.md). Add tests only when requested. Implementation status and detailed behavior belong in README/plans, not new architecture paragraphs.
