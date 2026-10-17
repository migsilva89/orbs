# Architecture

## Scope

The native daemon opens a locked Pi SQLite store and a separate app SQLite database with migrations for devices and pairing grants. The server composes device authentication and one persistent Pi Durable conversation. HTTP exposes health only. oRPC WebSocket procedures expose pairing, device management, text submission, stop, and a live view of the root conversation through shared contracts and a typed client. Desktop, mobile, bots, files, and remote deployment are not implemented.

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
- A service exports its factory and inferred service type. It receives only the dependencies it needs.
- Actions and queries take `(deps, params)`. Queries have no writes or external side effects.
- RPC procedures validate input and call one service operation. Business logic stays in services. Pairing and device routes live in RPC modules; auth services do not receive HTTP requests or dispatch URLs.
- Use `ts-pattern` for conditional branching instead of `if`/`else` and `switch`. Match the value or discriminated union directly; use `.exhaustive()` for closed unions and `.otherwise()` for open inputs. Keep each branch short and avoid deeply nested matches; simple predicates and nullish defaults can stay as expressions. Apply this to new and changed code.
- Domain types and schemas live in `types/`; component props stay beside their component.
- Keep one-use helpers in their owner. Shared helpers use `<domain>.utils.ts`; configuration values use `<domain>.constants.ts`.
- Read other domains through their public service surface, not their internal action, query, or driver files.

## Boundaries

- Packages use `@openbots/*` and explicit exports. New package entries use `src/entry.<runtime>.ts` for `client`, `server`, `vite`, or `universal`.
- Shared code stays independent of app entry points. Keep platform bindings and lifecycle code at the host boundary.
- The daemon imports request handling from `@openbots/server/server`. The server package uses standard Request/Response APIs and imports neither apps nor Bun.
- Server and client both depend on `@openbots/contracts/universal`. Contracts define procedures, schemas, and errors; server RPC handlers implement them through services. Clients never import server implementations.
- `core/core-server.native.ts` owns the Bun listener and oRPC WebSocket adapter at `/rpc`. The socket upgrade checks browser Origin; `pairing.redeem` validates a single-use pairing token without a device credential; every other RPC call authenticates its device credential through middleware. `makeClient` takes a socket factory and an optional credential getter, so an unpaired client can redeem its first token. oRPC reconnects the transport and retries only interrupted conversation watches; authentication failures and cancelled calls are not retried. Platform apps own socket disposal and secure credential storage.
- `conversation.watch` returns the root conversation's current structural view as a Chord replacement operation, followed by Pi's exact committed operations. A standard `TransformStream` forwards the snapshot and operations with backpressure, leaving Pi to bound its own queue and supply replacement snapshots. Reader cancellation closes the watch; writer completion follows Pi’s watch lifecycle. `watchConversation` applies the operations with Chord. Reconnect attaches a new watch with a current snapshot; it never resubmits model input.
- The auth service notifies subscriptions after device deletion commits. A watch registers for revocation before rechecking its credential. Revocation and request cancellation stop the watch, including idle reads, without aborting agent execution. All paired devices currently have owner access to the root view; private bot-to-bot DMs and bot contexts still need their own access design.
- `@openbots/server/native` exports the app database factory using `node:sqlite` and Kysely. The host owns opening, migrations, and disposal; it injects the database service into `makeServices`. Keep native database construction out of the portable server entry.
- App SQL tables, columns, and indexes use snake_case. Kysely's `CamelCasePlugin` maps camelCase TypeScript identifiers and results; write raw SQL migrations in snake_case.
- `apps/daemon/src/entry.native.ts` initializes logging and selects the host or local pairing command. `core/core.native.ts` owns signals and resource cleanup through one disposal stack, delegating listener setup to `core/core-server.native.ts`. `core/core-pair.native.ts` issues a grant through the auth service without starting Pi or a listener.
- The server composes `@openbots/runtime/server`; runtime never imports server or apps. The daemon uses `@openbots/runtime/native` only for native storage ownership. Keep that export out of portable server imports.
- The native daemon creates Pi's `ModelRuntime` and injects it through the server into Durable as the required `Models` dependency. Pi owns provider registration, auth-file locking, login, and OAuth refresh. Its default agent directory supplies `auth.json` and `models.json`; `PI_CODING_AGENT_DIR` selects a separate directory. This does not load CLI sessions, tools, extensions, or `settings.json`. Durable state stays in `OPENBOTS_DATA_DIR/runtime.sqlite`; bot model selection remains an application concern.
- Runtime methods expose Pi submission/watch/history values to server code. `conversation.submit` accepts nonempty text, a required request ID (1–128 characters), and Pi's optional `followUp`/`steer`/`reject` busy mode. It returns the admitted Pi submission ID without waiting for an answer. Reuse Pi's durable request-ID deduplication; the runtime maps `ConversationBusy` to the shared `CONFLICT` error. `conversation.stop` calls Pi's abort and resolves when the ordinary work is idle. Commands use the runtime's background context, so client cancellation does not stop accepted work. Commands are not retried automatically; a caller retrying a submit must reuse its request ID. Contracts validate Chord operations and export Pi view types through type-only imports; client code must not import the Harness or native storage. History, file/attachment APIs, and multi-chat authorization remain pending.
- Validate external input once with Zod; trust typed internal values. Use the shared error and logging packages.
- `env/client` exports public build configuration; its schema is empty. `env/server` supplies `OPENBOTS_DATA_DIR` (default `data`), `OPENBOTS_HOST` (default `0.0.0.0`), `OPENBOTS_PORT` (default `3000`), and `OPENBOTS_LOG_LEVEL` (default `info`). It contains no model keys. Host binding supports LAN and Tailscale; product operations still require the planned authentication layer.
- The native host calls `initNativeLogger` explicitly. Importing the server logger does not initialize Workers or require Vite globals.
- Each daemon has one implicit owner. Authenticate clients with revocable device credentials from pairing; keep user/organization tables and password login out of the schema. The auth service stores only token hashes and consumes pairing grants atomically with device creation. See the pairing plan for implemented access rules and remaining client work.
- Bot settings and tool credentials belong in `app.sqlite`, scoped to permitted bots and accessed through server services. They are not client build variables or local env-file helpers. Provider credentials are separate: reuse Pi's auth storage rather than duplicating tokens in SQL. Device and pairing-grant services exist; bot integration and tool-credential handling remain pending.
- Add a separate mobile env entry when the mobile build system is selected. Do not import server configuration into a client.
- The server owns agent execution. Clients submit commands and display state; their connection lifecycle must not own a run.

## Tooling

Use Bun for dependency management and workspace scripts. Define every external dependency range once in the root `package.json` `catalog`, including tooling and peer dependencies. Root and workspace dependency fields use `catalog:`; internal `@openbots/*` packages use `workspace:*`. Reuse existing catalog entries when adding dependencies and update shared versions in the catalog. Run `bun install` after manifest changes and include the updated `bun.lock`. Catalogs keep direct dependency ranges consistent; transitive dependencies can still resolve to multiple versions.

Every package with source has `check`, `lint`, and `lint:fix`. Turbo runs those tasks across the workspace. Locale compilation generates `packages/i18n/src/paraglide`; edit message sources, not generated files.
