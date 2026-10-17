# Architecture

## Scope

The native daemon opens a locked Pi SQLite store and a separate app SQLite database with migrations for devices and pairing grants. The server composes device authentication and one persistent Pi Durable conversation. HTTP exposes health, pairing, and authenticated device management. Desktop, mobile, bots, chat endpoints, and remote deployment are not implemented.

Changes to these conventions need the user's explicit approval. Read neighboring files before adding a new file kind or module.

## Structure

```text
apps/
  daemon/                 native resources, listener, startup and shutdown
  desktop/                desktop client
  mobile/                 mobile client
packages/
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

- Files use kebab-case and a domain prefix. Exports follow the same domain: `roomActionSend`, `roomQueryGet`, `makeRoomService`.
- A service exports its factory and inferred service type. It receives only the dependencies it needs.
- Actions and queries take `(deps, params)`. Queries have no writes or external side effects.
- RPC procedures validate input and call one service operation. Business logic stays in services.
- Domain types and schemas live in `types/`; component props stay beside their component.
- Keep one-use helpers in their owner. Shared helpers use `<domain>.utils.ts`; configuration values use `<domain>.constants.ts`.
- Read other domains through their public service surface, not their internal action, query, or driver files.

## Boundaries

- Packages use `@openbots/*` and explicit exports. New package entries use `src/entry.<runtime>.ts` for `client`, `server`, `vite`, or `universal`.
- Shared code stays independent of app entry points. Keep platform bindings and lifecycle code at the host boundary.
- The daemon imports request handling from `@openbots/server/server`. The server package uses standard Request/Response APIs and imports neither apps nor Bun.
- `@openbots/server/native` exports the app database factory using `node:sqlite` and Kysely. The host owns opening, migrations, and disposal; it injects the database service into `makeServices`. Keep native database construction out of the portable server entry.
- `apps/daemon/src/entry.native.ts` initializes logging and selects the host or local pairing command. `core/core.native.ts` owns listener setup, signals, and resource cleanup through one disposal stack. `core/core-pair.native.ts` issues a grant through the auth service without starting Pi or a listener.
- The server composes `@openbots/runtime/server`; runtime never imports server or apps. The daemon uses `@openbots/runtime/native` only for native storage ownership. Keep that export out of portable server imports.
- Runtime methods currently expose Pi submission/watch/history values to server code. Define authorized wire contracts before exposing these through HTTP or clients.
- Validate external input once with Zod; trust typed internal values. Use the shared error and logging packages.
- `env/client` exports public build configuration; its schema is empty. `env/server` supplies `OPENBOTS_DATA_DIR` (default `data`), `OPENBOTS_HOST` (default `0.0.0.0`), `OPENBOTS_PORT` (default `3000`), and `OPENBOTS_LOG_LEVEL` (default `info`). It contains no model keys. Host binding supports LAN and Tailscale; product operations still require the planned authentication layer.
- The native host calls `initNativeLogger` explicitly. Importing the server logger does not initialize Workers or require Vite globals.
- Each daemon has one implicit owner. Authenticate clients with revocable device credentials from pairing; keep user/organization tables and password login out of the schema. The auth service stores only token hashes and consumes pairing grants atomically with device creation. See the pairing plan for implemented access rules and remaining client work.
- Bot credentials and settings belong in `app.sqlite`, scoped to permitted bots and accessed through server services. They are not client build variables or local env-file helpers. Device and pairing-grant tables exist; bot tables and provider-credential handling remain pending.
- Add a separate mobile env entry when the mobile build system is selected. Do not import server configuration into a client.
- The server owns agent execution. Clients submit commands and display state; their connection lifecycle must not own a run.

## Tooling

Every package with source has `check`, `lint`, and `lint:fix`. Turbo runs those tasks across the workspace. Locale compilation generates `packages/i18n/src/paraglide`; edit message sources, not generated files.
