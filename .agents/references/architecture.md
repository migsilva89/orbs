# Architecture

## Scope

The native daemon opens a locked Pi SQLite store and a separate app SQLite database with migrations for devices, pairing grants, and bots. The server composes authentication, bot settings, and persistent per-bot Pi Durable conversations. HTTP exposes health only. oRPC WebSocket procedures expose pairing, device management, bot create/list/get/update/model catalog, and bot-scoped submit/stop/watch/history through shared contracts and a typed client. Desktop, mobile, private DMs, file APIs, and remote deployment are not implemented.

Product scope for this version is bots, owner-to-bot chats, and private bot-to-bot DMs. Group rooms and their Jev/Judge/Roundtable routing, membership, and leaders are excluded.

Changes to these conventions need the user's explicit approval. Read neighboring files before adding a new file kind or module.

## Structure

```text
apps/
  daemon/                 native resources, listener, startup and shutdown
  desktop/                desktop client
  mobile/                 mobile client
packages/
  contracts/              oRPC contracts and public input/output schemas
  client/                 typed oRPC calls, reconnect, and live Pi views
  server/                 public request handler and future product services
  runtime/                Pi Durable conversation service and native storage service
  avatar-blobs/           SVG avatar engine
  env/                    public client and private server configuration
  errors/                 typed errors and error codes
  i18n/                   translations and locale helpers
  logger/                 client and server logging
  tanstack-helpers/       metadata, URL, and head helpers
  tooling/                architecture assertions
  typescript-config/      shared TypeScript presets
scripts/
  utils-<name>.ts          repository tools
.agents/
  docs/                   runtime examples
  references/             architecture and review standards
```

## Module conventions

Domain services use flat folders. The service file assembles operations; actions write and queries read.

```text
src/
  core/core.services.ts
  services/<domain>/
    <domain>.service.ts
    <domain>-action.<name>.ts
    <domain>-query.<name>.ts
    <domain>.constants.ts
    <domain>.utils.ts
    <domain>.driver.ts
    <domain>-cloudflare.driver.ts
    <domain>.prompts.ts
    <domain>.options.ts
  types/<domain>[-<part>].types.ts
  rpc/rpc.<area>.ts
```

- Files use kebab-case and a domain prefix. Exports follow the same domain: `botActionSend`, `botQueryGet`, `makeBotService`.
- Name variables and properties for the value they hold: singular nouns for one item, plural nouns for collections, `At` for timestamps, and unit suffixes for durations (`timeoutMs`).
- Boolean variables, properties, and predicate methods use `is`, `has`, `can`, or `should` according to meaning: `isJevConfigured`, `hasCredential`, `canWrite`, `shouldRetry`. Prefer positive names. Preserve library-defined names at integration boundaries and domain prefixes on exported functions.
- Settings RPCs return a domain settings object that can grow as settings are added. Boolean naming applies to fields such as `isJevConfigured`; it does not require a separate RPC for each flag. Settings writes accept partial objects: omitted fields stay unchanged, and nullable fields use `null` to clear a value. Return the updated settings object.
- A service exports its factory and inferred service type. It receives only the dependencies it needs. Pass the owning service or host driver, not detached methods from another domain. Core composes these objects; actions and queries call their public surface. Keep callbacks where a library or higher-order API requires them, such as Pi execution environments, oRPC connections, and lazy per-call context. Do not wrap pure utility callbacks in invented services.
- Actions and queries take `(deps, params)`. Queries have no writes or external side effects.
- RPC procedures validate input and call one service operation. Business logic stays in services. Pairing and device routes live in RPC modules; auth services do not receive HTTP requests or dispatch URLs.
- Use `ts-pattern` for conditional branching instead of `if`/`else` and `switch`. Match the value or discriminated union directly; use `.exhaustive()` for closed unions and `.otherwise()` for open inputs. Keep each branch short and avoid deeply nested matches; simple predicates and nullish defaults can stay as expressions. Apply this to new and changed code.
- Domain types and schemas live in `types/`; component props stay beside their component.
- Keep one-use helpers in their owner. Shared helpers use `<domain>.utils.ts`; configuration values use `<domain>.constants.ts`.
- Read other domains through their public service surface, not their internal action, query, or driver files.

## Boundaries

- Inspect installed library APIs and official examples before building infrastructure. Let Pi Durable own tool execution, task state, approval documents, watches, and recovery where its APIs fit. Add custom storage or coordination only for a demonstrated gap; state that gap before implementing it. Product permission policy stays in the server, and platform/network bindings stay in the daemon.
- Packages use `@openbots/*` and explicit exports. New package entries use `src/entry.<runtime>.ts` for `client`, `server`, `vite`, or `universal`.
- Shared code stays independent of app entry points. Keep platform bindings and lifecycle code at the host boundary.
- The daemon imports request handling from `@openbots/server/server`. The server package uses standard Request/Response APIs and imports neither apps nor Bun.
- Server and client both depend on `@openbots/contracts/universal`. Contracts define procedures, schemas, and errors; server RPC handlers implement them through services. Clients never import server implementations.
- `core/core-server.native.ts` owns the Bun listener and oRPC WebSocket adapter at `/rpc`. The socket upgrade checks browser Origin; `pairing.redeem` validates a single-use pairing token without a device credential; every other RPC call authenticates its device credential through middleware. `makeClient` takes a socket factory and an optional credential getter, so an unpaired client can redeem its first token. oRPC reconnects the transport and retries only interrupted conversation watches; authentication failures and cancelled calls are not retried. Platform apps own socket disposal and secure credential storage.
- `conversation.watch({ botId })` returns the selected bot conversation's current structural view as a Chord replacement operation, followed by Pi's exact committed operations. A standard `TransformStream` forwards the snapshot and operations with backpressure, leaving Pi to bound its own queue and supply replacement snapshots. Reader cancellation closes the watch; writer completion follows Pi’s watch lifecycle. `watchConversation` applies the operations with Chord. Reconnect attaches a new watch with a current snapshot; it never resubmits model input.
- The auth service notifies subscriptions after device deletion commits. A watch registers for revocation before rechecking its credential. Revocation and request cancellation stop the watch, including idle reads, without aborting agent execution. All paired devices have owner access to every bot's view. Private bot-to-bot DM delivery remains separate work.
- `@openbots/server/native` exports the app database factory using `node:sqlite` and Kysely. The host owns opening, migrations, and disposal; it injects the database service into `makeServices`. Keep native database construction out of the portable server entry.
- App SQL tables, columns, and indexes use snake_case. Kysely's `CamelCasePlugin` maps camelCase TypeScript identifiers and results; write raw SQL migrations in snake_case.
- `apps/daemon/src/entry.native.ts` initializes logging and selects the host or local pairing command. `core/core.native.ts` owns signals and resource cleanup through one disposal stack, delegating listener setup to `core/core-server.native.ts`. `core/core-pair.native.ts` issues a grant through the auth service without starting Pi or a listener.
- `makeServices` receives the database service, credentials key, resource driver, and grouped runtime options. It passes the tool service as the runtime permission policy; never extract its authorization method. The server composes `@openbots/runtime/server`; runtime never imports server or apps. The daemon uses `@openbots/runtime/native` only for native storage ownership. Keep that export out of portable server imports.
- The native daemon creates Pi's `ModelRuntime` and injects it through the server into Durable as the required `Models` dependency. Pi owns provider registration, auth-file locking, login, and OAuth refresh. Its default agent directory supplies `auth.json` and `models.json`; `PI_CODING_AGENT_DIR` selects a separate directory. This does not load CLI sessions, tools, extensions, or `settings.json`. Durable state lives in `OPENBOTS_DATA_DIR/data/runtime.sql`; bot model selection remains an application concern. Skills load directly from configured sources, including existing symlinks; no copied resource tree or CLI extension compatibility layer is needed. Plugin and MCP loading remain pending.
- Runtime methods expose Pi submission/watch/history values to server code. `conversation.submit` accepts a bot UUID, nonempty text, a required request ID (1–128 characters), and Pi's optional `followUp`/`steer`/`reject` busy mode. It returns the admitted Pi submission ID without waiting for an answer. Reuse Pi's durable request-ID deduplication, scoped to each bot's conversation; the runtime maps `ConversationBusy` to the shared `CONFLICT` error. `conversation.stop({ botId })` calls that bot conversation's Pi abort and resolves when the ordinary work is idle. Commands use the runtime's background context, so client cancellation does not stop accepted work. Commands are not retried automatically; a caller retrying a submit must reuse its request ID. Contracts validate Chord operations and export Pi view types through type-only imports; client code must not import the Harness or native storage. File/attachment APIs and multi-chat authorization remain pending.
- `conversation.history({ botId, limit, cursor })` returns Pi’s entry page unchanged, newest first: `{ items, next? }`. Default page size is 50, capped at 100. Clients return the opaque `next` cursor unchanged for that bot. Contracts validate input JSON and expose Pi’s trusted output through oRPC’s typed schema; no second transcript schema or SQL message store is introduced. The runtime maps invalid Pi scan requests to `VALIDATION_ERROR`; the server verifies the bot exists before reading.
- Validate external input once with Zod; trust typed internal values. Use the shared error and logging packages.
- `env/client` exports public build configuration; its schema is empty. `env/server` supplies `OPENBOTS_DATA_DIR` (default `~/.config/openbots/`), `OPENBOTS_HOST` (default `0.0.0.0`), `OPENBOTS_PORT` (default `3000`), and `OPENBOTS_LOG_LEVEL` (default `info`). It contains no model keys. Host binding supports LAN and Tailscale; product operations still require the planned authentication layer.
- `OPENBOTS_DATA_DIR` is the only storage-path setting. `corePathsNative` resolves it at the native boundary, expanding `~` and `~/`. Before opening databases, startup and pairing create missing root/data/agents directories with mode `0700` and check read/write/traverse access; filesystem errors abort initialization. Database opens remain responsible for file-level errors. Startup and pairing share `data/app.sqlite`; Durable uses `data/runtime.sql`. Derive bot working folders as `agents/<botId>/`, independent of the bot handle; store IDs, not home-directory paths, in bot records. The native host injects a `ResourceDriver` into the resource service. Bots call `resources.actions.prepareDirectory({ botId })`; they do not receive filesystem callbacks. Bot create/update transactions validate the derived folder before SQL commit; startup restores folders as needed. Pi's working-directory setting is relative (`agents/<botId>`); the native execution environment resolves it against the data root. Existing stores are not migrated automatically.
- Hosts initialize logging explicitly through `initNativeLogger` or `initClientLogger`. Shared logger imports do not read Vite globals or select an HTTP ingest route; client transport stays disabled unless a host configures it.
- Locale selection belongs to the host. Shared i18n exposes explicit locale selection and request-local `runWithLocale`, with no URL routing, cookies, or login assumptions. Paraglide generates message declarations through `emitTsDeclarations`; do not parse its generated JavaScript to recreate types.
- Each daemon has one implicit owner. Authenticate clients with revocable device credentials from pairing; keep user/organization tables and password login out of the schema. The auth service stores only token hashes and consumes pairing grants atomically with device creation. See the pairing plan for implemented access rules and remaining client work.
- Bot settings and tool credentials belong in `app.sqlite`, scoped to permitted bots and accessed through server services. They are not client build variables or local env-file helpers. Provider credentials are separate: reuse Pi's auth storage rather than duplicating tokens in SQL. Application secrets use the shared encrypted `credentials` table. Server services access named entries; bot-facing credential scope remains pending.
- Generic non-secret settings share the `settings` key/value table (`key`, JSON-encoded `value`, `updated_at`). Use namespaced keys such as `resources.skillDirs` and `tools.approvalRules`; keep encrypted values in `credentials`. Add fields to domain settings objects rather than new tables or one-setting RPCs.
- The native host loads skills with Pi Coding Agent's `loadSkills` and `formatSkillsForPrompt`. First name wins: bot `.pi/skills`, bot `.agents/skills`, configured shared `skillDirs` in order, then Pi's global skills directory. Shared defaults are `['~/.agents/skills']`; Pi's global directory follows `getAgentDir()` and `PI_CODING_AGENT_DIR`. Shared loading requires `bot.inherit` to include `skills`; bot-local skills remain available. Relative configured paths resolve against the daemon data root; Pi expands home paths. Reuse Pi recursion, validation, and file deduplication.
- `resources.settings/configure` read and partially update directory settings. `resources.discover({ botId })` returns the effective skill catalog for the composer: name, description, file path, and `isModelInvocable`. Include manual-only skills in discovery while Pi excludes them from the automatic prompt. Discovery is authenticated, checks bot existence, scans current files, and does not create a conversation or run. The resource service owns skill and MCP inheritance and calls its native driver. Bots receive the resource service, not its driver methods. Both discovery and runtime configuration use `resources.queries.skills`. Bot configuration reads the resource settings before entering its SQL transaction and passes that snapshot to the skill query; the query must not acquire the same database connection inside that transaction. The catalog also includes MCP file metadata and diagnostics; plugin metadata remains pending. Never return MCP secrets.
- MCP configuration discovery belongs in the native host. `resources.mcpPaths` shares the existing settings table. Its default additional list is empty. Sources are Pi-global `mcp.json`, `~/.agents/mcp.json`, configured paths, bot `.agents/mcp.json`, and bot `.pi/mcp.json`, in that order. Shared sources require `inherit: ['mcp']`. Directories scan `mcp.json` and `*.mcp.json` recursively with cycle-safe symlinks and sorted resolved paths; later whole entries replace earlier entries by server name. No field-level merge of commands or credentials.
- `resources.discover` returns MCP server name, description, source, transport, enabled state, and sanitized diagnostics. It never starts processes, connects to a server, or resolves credentials. Pi's CLI file loader is not publicly exported and its extension uses the CLI API; the native scanner only validates the metadata needed for discovery. Transport validation, Pi MCP connections, remote tools, OAuth, and plugin loading remain pending. Invalid server overrides remove earlier same-named entries; failed files produce diagnostics and a partial catalog. Error messages must not include parser input, URLs, headers, or environment values.
- Startup, bot configuration, and submission refresh the skill catalog. A Durable prompt section reads its formatted catalog from the bot conversation document; the model reads full skill files on demand through the normal tool policy. Bot instructions remain separate. Settings changes take effect on the next configuration/submission, not during an existing turn. Composer selection and slash-command execution are separate client/submit work; discovery alone does not implement them.
- Install Pi's `CodingTools` and trusted custom `toolExtensions` in the same registry. Install the Openbots permission hook last so it sees rewritten arguments. Custom tools use Pi's `defineTool`/`defineExtension`; nested calls use `api.executeTool`, which invokes the same hooks. Only the resolved tool registrations explicitly present in `readOnlyTools` bypass approval. A replacement or wrapper does not inherit trust from a matching name; the host must declare that implementation as read-only. New conversations without an Openbots bot identity cannot execute tools.
- The server owns permission policy: Read-only denies writes; Ask requires owner approval; Auto uses Jev with a 0.9 threshold and falls back to Ask on missing configuration, uncertainty, oversized context, or request failure; Full allows calls. Approval grants cover one Pi task and its exact arguments. Recheck current policy after Jev returns and after a human answer. Owner `approvalRules` use `{ when, behavior: allow | ask }` and live under `tools.approvalRules` in the shared non-secret `settings` table. A single Jev request evaluates safe operation and ask-first applicability; allow needs safe >= 0.9 and ask-first <= 0.1. Ask-first rules take priority, explicit allow rules can cover external actions, and uncertainty requests human approval. Rules affect Auto-assessed calls only; trusted reads still bypass the judge. A Jev result applies only while Auto, the judged instructions, and the rules remain unchanged and its key is still configured. Load conversation context lazily, only when a configured Auto judge needs it; other permission modes and missing-key fallback do not read history.
- Approval requests, decisions, timestamps, and five-minute deadlines live in task-scoped Pi documents. `watchDoc()` waits for the answer; `taskGraph()` finds pending tool calls. Stop/cancellation and recovery use Pi's task lifecycle. There is no SQL approval table, second task queue, or custom waiter registry. The native deadline timer is recreated from the stored deadline after reopen; it does not wake an offline host. `tools.pending` and `tools.answer` are authenticated, bot-scoped RPCs. Client approval rendering is separate work.
- The shared `credentials` service encrypts application secret values with Web Crypto AES-256-GCM, a fresh IV per write, and the credential name as authenticated data. `credentials` is the only application secret table. The native host supplies the non-extractable CryptoKey from `data/credentials.key`, created with mode `0600`; back it up separately from the database. A copy of the whole data directory includes this key and can decrypt the secrets. Jev uses `typesafe.apiKey`; `tools.configure` writes it and `tools.settings` returns the tool settings object, including `isJevConfigured`, without exposing secret values. No secret-read RPC is exposed. Key rotation and per-bot secret access remain separate work.
- Bot rows contain avatar, name, unique handle, instructions, model provider/ID, thinking level, permission, inheritance, and timestamps. Avatar/inheritance values are JSON-encoded at the SQL boundary. Pi CodingTools and the Openbots permission extension are selected per bot. Read-only selects the declared read tools; other modes use the registered tools. Skill inheritance is implemented; MCP, plugins, and instruction-file inheritance remain pending.
- `openbots.bot-conversation` is a session-scoped Pi document family keyed by bot ID. Its conversation ID is created atomically with agent configuration and reused across updates/restarts. SQL is authoritative for settings. After SQL saves, configuration rereads the latest row in an app transaction to serialize concurrent updates while applying Pi changes. The server restores all bots before `runtime.resume()` and reapplies settings before submission. Failures between stores leave committed SQL for reconciliation; they never justify an SQL message mirror. Legacy root history is retained but not exposed by bot-scoped RPC.
- Add a separate mobile env entry when the mobile build system is selected. Do not import server configuration into a client.
- The server owns agent execution. Clients submit commands and display state; their connection lifecycle must not own a run.

## Tooling

Use Bun for dependency management and workspace scripts. Define every external dependency range once in the root `package.json` `catalog`, including tooling and peer dependencies. Root and workspace dependency fields use `catalog:`; internal `@openbots/*` packages use `workspace:*`. Reuse existing catalog entries when adding dependencies and update shared versions in the catalog. Run `bun install` after manifest changes and include the updated `bun.lock`. Catalogs keep direct dependency ranges consistent; transitive dependencies can still resolve to multiple versions.

Every package with source has `check`, `lint`, and `lint:fix`. Turbo runs those tasks across the workspace. Locale compilation generates `packages/i18n/src/paraglide`; edit message sources, not generated files.
