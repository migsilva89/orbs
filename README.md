# Openbots

A Bun/Turbo bot backend with a native daemon, device pairing, bot configuration, and authenticated submit, stop, and live views of persistent per-bot Pi Durable conversations. Pi supplies shared provider authentication. Explicit skill invocation, private peer messages, and foreground/background subagents are available. Attachment APIs are available. Desktop, mobile, and a provider-login UI are not implemented yet.

```text
apps/       daemon, desktop, mobile
packages/   contracts, client, server, runtime, avatars, env, errors, i18n, logger, TanStack helpers, tooling, TypeScript presets
scripts/    agent-link sync
.agents/    architecture, quality gate, Pi Durable examples
```

## Setup

```sh
bun install --frozen-lockfile
bun run check
bun run lint
```

`bun run test` forwards to workspace test scripts; none exist yet.

## Daemon

```sh
bun run --cwd apps/daemon start
```

Run `bun link` from `apps/daemon` to expose `openbots` on your Bun executable path:

```sh
openbots start                     # Foreground; Ctrl+C stops it
openbots start --detach            # Background; returns after startup succeeds
openbots pair [--url <origin>]      # Code, link, and QR from the running daemon
openbots service register          # Enable startup at the next macOS login
openbots service unregister        # Disable startup at the next macOS login
```

`openbots` without a subcommand runs in the foreground. `pair` defaults to `OPENBOTS_PUBLIC_URL`; use an origin reachable by the receiving device. All commands select the daemon using `OPENBOTS_DATA_DIR`. The existing storage lock prevents a second instance from opening the same stores. Detached startup writes to `data/daemon.log` and reports a failure instead of claiming success if startup exits early.

Service registration is macOS-only. It writes a per-user LaunchAgent for the selected data directory, using the current Bun executable, source entrypoint, validated Openbots environment settings, and `PATH`. Keep that executable and checkout available. Different data directories have separate registrations. Register/unregister only changes the next login; neither command loads, unloads, starts, or stops the current daemon. Registration does not copy provider secrets or create a CLI device credential.

The daemon listens on all IPv4 interfaces (`0.0.0.0`), using port 3000 by default, so it can accept LAN and Tailscale connections. Set `OPENBOTS_HOST` to bind a specific interface. `GET /health` returns `{ "status": "ok" }`. The `/rpc` WebSocket carries control and live updates. HTTP POST under `/rpc` carries file upload/download through the same authenticated oRPC router. Pairing redemption uses a single-use pairing token; other RPC calls authenticate a device credential. Other HTTP paths return 404. SIGINT/SIGTERM close connections and stop the listener. Health confirms HTTP handling only, not database or agent readiness.

`OPENBOTS_DATA_DIR` is the only configurable storage path and defaults to `~/.config/openbots/`. Bot records keep IDs, not home-directory paths; derive each working folder from the root and bot ID. The native host expands `~` and resolves relative overrides before using this layout:

```text
OPENBOTS_DATA_DIR/
  agents/<botId>/                derived bot working folders (attachments in .attachments/)
  data/
    app.sqlite                   application SQLite database
    credentials.key              encryption key for application secrets
    daemon.lock                  single-process lock for every store below
    bots/<botId>/runtime.sql     that bot's Pi Durable store
```

Each bot has its own Pi store. Pi has no delete API, so the file is the unit of erasure: deleting a bot deletes its store, and clearing a bot's history replaces it. Peer messages cross stores with stable request IDs; Pi's request-ID deduplication keeps a retried delivery to one message.

Startup creates missing root, data, and agents directories with private permissions and checks read/write/traverse access before opening a database. A path occupied by a file or an inaccessible directory stops startup with a filesystem error. Database opens still report file-level errors; the directory check cannot guarantee a later write succeeds.

Startup takes `data/daemon.lock`, opens and migrates `data/app.sqlite`, creates Pi's model runtime, constructs workspace, skill, instruction, plugin, and MCP services from package exports, then opens each bot's store, restores its conversation and settings and calls `resume()`. A failing bot store closes only that bot; the next request reopens it. Shutdown closes the listener, every bot store, MCP clients, app database, and the lock. Pairing grants live in `app.sqlite`. Use a separate data directory per independent daemon. Existing databases are not moved or renamed automatically; a `data/runtime.sql` from the earlier shared-store layout is no longer read.

The app database uses `node:sqlite` through Kysely, adapted from Orbs. WAL and foreign keys are enabled. Kysely tracks the [SQL migrations](packages/server/src/services/database/migrations/0001_pairing.sql); the first migration creates devices and temporary pairing grants. Further migrations add bots and their avatar, permission, and inheritance preferences. Migration `0005_credentials` adds the shared encrypted key/value store for application secrets. Provider credentials use Pi's auth files, not app tables. Pi Durable remains the owner of conversation history.

The daemon initializes native logging at startup. Startup, runtime, and shutdown failures are logged and set a nonzero exit code.

The internal server service supports submit, watch, history, and stop through Pi Durable 1.3.0. The daemon injects Pi's `ModelRuntime` for providers and authentication. Pi’s built-in `read`, `write`, `edit`, and `bash` tools are installed; no fake provider is installed in application code. Bot settings select the model, thinking level, and instructions for each conversation.

## Offline backup and restore

Stop the daemon, then run the backup command with the same `OPENBOTS_DATA_DIR`. Restore writes into `OPENBOTS_DATA_DIR`, which must not exist yet. There is no backup RPC.

```sh
bun run --cwd apps/daemon backup create ~/openbots-backup-2026-10-19
OPENBOTS_DATA_DIR=~/.config/openbots-restored bun run --cwd apps/daemon backup restore ~/openbots-backup-2026-10-19
```

The command uses `makeBackupService` from `@openbots/server/native`. Both the backup destination and restore root must be absent, with existing parent directories. Create takes the same storage lock as daemon startup; a running daemon returns `CONFLICT`. It snapshots the app database and every bot's Pi store with `VACUUM INTO`, copies any pending history-clear carry file, the credential key and bot workspaces, and records file sizes and SHA-256 checksums. Restore checks the manifest and publishes a complete directory without opening Pi, running migrations, or starting the daemon. Existing directories are never a restore target.

The bundle preserves the server identity, paired devices, encrypted application credentials, transcripts, tasks, bot files and attachments. It also contains the encryption key, so protect the whole bundle as secret data. It excludes runtime locks, local IPC, Pi's external provider-auth store and shared skill/plugin/instruction directories outside the data root. Their configured paths remain in settings. Symlinks and special files in bot workspaces, such as `node_modules/.bin` links, are skipped and listed under `skipped` in the manifest; reinstall dependencies after restore. Restore replaces the same logical daemon; do not run the source and restored copy as independent servers.

## Server identity and protocol

`server.info()` returns the authenticated daemon's stable `id` and `protocolVersion`. Startup creates `server.id` once in the shared settings table. Restarts preserve it; a new data directory gets a new ID. Copying the app database preserves the ID and device credentials, so treat a copy as a restore, not an independent daemon.

```typescript
const client = makeClient({ connect, token });
const server = await client.server.info();
const pinnedClient = makeClient({ connect, token, serverId: server.id });
```

Platform apps store the ID with the address and device credential, and use it in cache keys. `serverId` pins later requests to that daemon: another daemon at the same address returns `SERVER_MISMATCH` before an action runs. Identity checking does not replace TLS or device authentication.

The shared client sends `x-openbots-protocol: 1` on every RPC call, including pairing redemption. Raw clients must send it too. A missing or different version returns `PROTOCOL_MISMATCH` with `supportedVersion` and `receivedVersion`; update the incompatible client or daemon before retrying. This is the application protocol version, independent of Pi and package versions. Protocol and identity failures are not retried automatically. Desktop/mobile connection storage and upgrade screens remain pending.

## Attachments

Create the client with an HTTP RPC base for binary transfers. Upload/download use HTTP; metadata, submissions and live updates keep using WebSocket. Both links send the same device credential, protocol version and optional server ID. Transfers are not automatically retried.

```typescript
const client = makeClient({ connect, token, serverId, url: '/rpc' });
const attachment = await client.attachments.upload({ botId, file });
await client.conversation.submit({
  botId,
  requestId: crypto.randomUUID(),
  content: 'Read this file',
  attachmentIds: [attachment.id],
});
const downloadedFile = await client.attachments.download({ botId, attachmentId: attachment.id });
```

Use an absolute HTTP(S) RPC URL for a remote daemon. Uploads accept PNG, JPEG, WebP, GIF, PDF, plain text, Markdown, CSV and JSON, up to 10 MiB each and four files per message. Invalid size/type inputs return oRPC’s standard `BAD_REQUEST`; MIME charset parameters are ignored for the allowlist. Files bind to the selected `conversationId`, or the bot's main chat when omitted. Empty text is allowed with files. `attachments.list({ botId, conversationId, limit, before })` pages metadata without reading transcripts or file bytes. A removed cursor returns `NOT_FOUND`; restart the list in that case.

Server/native stores bytes under `agents/<botId>/.attachments/<conversationId>/<attachmentId>/<name>`. Pi stores metadata and owner message references, without a SQL message/file table. Saved and queued attachment messages use `openbots.attachment-message` with `{ content, attachments }`; render that data for the owner text and file cards. Model input contains relative file references. Pi's native `read` tool handles text and supported images; PDF contents require an available bot tool. Upload acceptance alone does not imply PDF understanding. Uploads add references rather than bytes to user entries and the inbox. Pi can later persist image/text contents in native tool-result entries when a tool reads the file.

Queued edits accept `attachmentIds`: omit to preserve files, pass `[]` to remove them, or pass IDs to replace them. A file-only input cannot become empty. Queue, steer and interrupt share this representation. Skill expansion still applies before admission. Peer/custom inputs remain protected from owner queue edits.

`attachments.remove` removes an unretained upload. Abandoned uploads expire after 24 hours and are swept on the next upload to that conversation, including old orphan blobs. Before send/edit, Pi marks selected files retained so deletion cannot race accepted references. Retention and submission are separate commits: failed sends, cancelled queue items and removed queue references can leave retained files. They are not swept or manually removable through this API. Whole-chat/bot deletion and its file cleanup remain pending.

File responses use the oRPC binary protocol and return a `File`, not a public download URL. HTTP RPC responses disable caching and MIME sniffing. Composer upload/paste/drop, file cards and gallery UI remain pending.

## Message interactions

Quoted replies use a saved Pi entry ID. Runtime checks that it belongs to the selected conversation and stores a text snapshot of up to 4,000 characters with the new owner message. The snapshot is context for the model, not a new system instruction. Quotes and attachments can be used together.

```ts
await client.conversation.submit({
  botId,
  requestId: crypto.randomUUID(),
  content: 'Explain this part.',
  replyToEntryId: selectedEntry.id,
});
await client.conversation.updateSubmission({ botId, submissionId, replyToEntryId: null });
```

On queued edits, omission preserves the quote; `null` clears it. The same snapshot survives promotion, interruption and restart. Foreign-conversation entries are rejected. Reply rendering remains client work.

`conversation.watch` includes `lastRun`: the latest native generation task ID, status and outcome. A failed, faulted or stopped run can be retried through the existing command endpoint:

```ts
await client.commands.execute({ botId, name: 'retry', arguments: String(lastRun.taskId) });
```

Retry starts Pi's generation against the current saved context. It adds no duplicate owner message, does not change the original submission's terminal receipt, and leaves queued inputs for Pi's normal boundaries. Only the latest failed/stopped task can be retried; concurrent or stale retries conflict. A queued context reset conflicts. Retry uses the current context, including any reset or compaction already applied; it does not restore earlier context. Retry cannot undo tool side effects and is never automatically resent by the client.

Owner reactions use one emoji grapheme per value, with at most 20 per visible message. Changes are idempotent and do not run a model. Read only the entry IDs displayed by the client:

```ts
await client.conversation.setReaction({ botId, entryId, emoji: '👍', isPresent: true });
const reactions = await client.conversation.reactions({ botId, entryIds: visibleEntryIds });
```

Pass `isPresent: false` to remove a reaction. Pi documents store reactions beside the selected conversation. Bot-authored reactions use the separate attribution described below. Reaction-triggered bot replies remain pending.

Bots can call the `bot_question` tool with a question, optional choices and `isMultiSelect`. Clients read pending questions and answer with free text, one or more listed choices, or a skip through authenticated RPC:

```ts
const questions = await client.conversation.questions({ botId, conversationId });
const target = { botId, conversationId, id: question.id };

await client.conversation.answerQuestion({ ...target, answer: { kind: 'text', text: 'Use the smaller version.' } });
await client.conversation.answerQuestion({ ...target, answer: { kind: 'choices', choices: ['Staging', 'Production'] } });
await client.conversation.answerQuestion({ ...target, answer: { kind: 'skip' } });
```

Choices must come from the question's list, without duplicates; more than one requires `isMultiSelect`.

The first answer before the five-minute deadline wins; `result.isAccepted` reports whether it was accepted. Question state and its deadline live in a task-scoped Pi document and survive restart. Stopping the task removes it from pending questions. This is separate from permission approval; the trusted `bot_question` tool also works in read-only mode. Multi-select cards and skip controls in clients are not implemented.

The selected chat watch includes `interactionsRevision`. Refetch visible reactions and pending questions on the initial state and when this value changes. It is a subscription-local invalidation counter, not a replay cursor. Reconnect starts with current state. Reaction buttons, question cards and retry controls remain UI work.

## Runtime commands

Authenticated clients discover supported slash commands with `commands.list({ botId })`, then send the selected name and optional trailing text to one endpoint:

```typescript
const commands = await client.commands.list({ botId });
await client.commands.execute({ botId, name: 'compact', arguments: 'Keep the failing test names' });
await client.commands.execute({ botId, name: 'reset', arguments: 'Continue with the login fix' });
```

Catalog names omit `/`; clients render that prefix. Runtime owns the catalog and calls Pi Durable's native operations. The server checks the bot and authentication; the daemon transports the request. Descriptions use shared i18n messages.

Success means Pi accepted the command, not that compaction finished or a queued reset was placed. Follow `conversation.watch` for state and `conversation.history` for persisted entries. Both operations preserve history. Compact summarizes older context; reset starts empty context or uses the optional text as a handoff. Pi owns busy handling and recovery. Commands are not automatically retried after disconnect.

Use `cancel` to withdraw one pending submission from the selected conversation:

```typescript
await client.commands.execute({
  botId,
  conversationId,
  name: 'cancel',
  arguments: String(submissionId),
});
```

Take the ID from `view.inbox.items` or the submit acknowledgement. Arguments must be a positive safe-integer decimal string. Pi atomically withdraws the queued input or write; the current run and other queued items continue. An input already placed into a run returns `CONFLICT`. A finished or previously cancelled submission is a no-op, with no rollback of completed work. Missing IDs or IDs from another conversation return `NOT_FOUND`; invalid arguments return `VALIDATION_ERROR`. Omitting `conversationId` selects the bot's main chat. The existing watch reports the changed inbox.

Compact, reset, cancel and retry are exposed here. Ordinary `conversation.submit` text is unchanged, including text that starts with `/`. Skills remain discoverable through `skills.discover` and `bots.catalog`; pass selected names in `conversation.submit.skills`. CLI-only commands are not exposed.

Command and skill catalog items include `argumentsSchema` (JSON Schema) and nullable `argumentHint` for composer controls. Both currently accept text: send command text as `commands.execute.arguments` and skill text as `conversation.submit.content` with the selected `skills`. Schemas are generated once from those input validators. Skills may declare a hint such as `argument-hint: "[file] [focus]"` in frontmatter; hints do not declare typed fields or substitute placeholders. No argument schema is inferred from skill prose.

## Tools and approvals

Bots use Pi Durable's `read`, `write`, `edit`, and `bash` tools in their working folder. Read-only offers only declared read tools. Ask waits for approval on other calls. Auto uses Jev and falls back to Ask when its key is absent or its decision is uncertain. Full permits calls without approval. Commands run as the daemon's OS user; the working directory is not a sandbox.

Authenticated clients use `tools.pending({ botId })` and `tools.answer({ botId, id, approved })`. The pending list includes child subagent approvals, with a `conversationId` for opening their view. Requests expire after five minutes. Pi stores their state with the tool task and restores pending requests after restart. Custom tool extensions use the same gate, including nested calls. No approval UI is implemented yet.

`tools.configure({ jevApiKey })` saves the key; passing `null` removes it, and omitting it leaves it unchanged. `tools.settings()` returns the tool settings object, `{ isJevConfigured, approvalRules }`, and never returns the key. `tools.configure()` returns the updated settings after saving. Application secrets share the encrypted `credentials` table. The native daemon stores the encryption key in `data/credentials.key` with owner-only permissions. Keep that key for recovery; copying the entire data directory also copies the ability to decrypt the database. Pi's provider authentication remains in Pi's own store.

Paired devices manage named secrets through `credentials.set({ key, value })`; `value: null` removes a key. `credentials.list()` returns only names and creation/update timestamps. Secret values are never readable through RPC. The same store serves Jev and MCP; Pi provider credentials remain in Pi's auth store.

Rules use `{ when, behavior: 'allow' | 'ask' }`. `tools.configure({ approvalRules })` replaces the list; `[]` clears it, and omission preserves it. Rules are non-secret owner settings in the shared `settings` table; the Jev key remains encrypted in `credentials`. Up to 50 rules of 300 characters are accepted.

Auto sends the owner rules and tool context in one Jev request. Approval needs a safe score of at least 0.9 and an ask-first score at most 0.1. Matching ask-first rules take priority over allow rules; ambiguity and failures request human approval. Explicit allow rules can cover email or other external actions. Natural-language matching is model-based, not a deterministic security guarantee. Trusted read-only tools skip this evaluation. Ask and Read-only modes cannot be overridden by allow rules. Changes to rules, bot instructions, permission mode, or removal of the Jev key are checked after the answer arrives.

## Provider authentication

The daemon uses Pi's `ModelRuntime.create()`, which loads saved provider credentials from `auth.json` and custom model configuration from `models.json` in Pi's agent directory (default `~/.pi/agent`). Existing Pi logins are reused; Pi handles file locking and OAuth refresh. Paired devices can use the provider RPC below; Pi's `/login` command remains compatible. Login UI is not implemented.

Set `PI_CODING_AGENT_DIR` for both Pi and the daemon to use a separate auth/config directory, including for development versus production. Run them as the same OS user to share the default directory. Pi authentication uses its existing location. Skills are loaded directly from their source directories, including existing symlinks; MCP configuration discovery, stdio/Streamable HTTP connections and MCP OAuth APIs are available. Pi's auth file is sensitive and is not encrypted by this integration.

This loads provider configuration, not CLI sessions, tools, extensions, or `settings.json`. Durable stores each bot's conversations, tasks, and recovery state in `OPENBOTS_DATA_DIR/data/bots/<botId>/runtime.sql`. Authentication is shared; each bot selects its own model through its database settings.

Provider auth uses `providers.list()`, `providers.login({ providerId, authType })`, `providers.session({ id })`, `providers.complete({ id, promptId, answer })`, `providers.cancel({ id })` and `providers.logout({ providerId })`. Auth types are `api_key` and `oauth`, filtered by the selected Pi provider's login capabilities. Start returns a bounded, temporary login session. Poll its state, render Pi's notices or authorization link, and answer its current prompt. Each prompt has its own ID so an old answer cannot complete a later step.

Only the paired device that started a login can read or answer that session. Device revocation, cancellation, expiry and shutdown abort unfinished logins. Sessions are not resumed after daemon restart; saved credentials remain in Pi. List/status queries read Pi's current snapshot without starting login or refresh. Secrets entered into prompts are not returned in session state, and RPC logs record error codes rather than request/error payloads.

## Request limits

`limits.settings()` returns the complete policy. `limits.configure(patch)` changes selected fields in the shared settings table; omitted fields, including nested fields, stay unchanged. Defaults are 6,000 RPC requests/minute per connection address, 10 pairing redemptions/minute per connection address, 600 authenticated requests/minute per device, 32 active RPC handlers and 64 active watches.

The public budget is checked before authentication, per connection address, so unpaired peers cannot exhaust paired devices' budget. Peer addresses come from the listener, never forwarded headers; callers behind a reverse proxy share its public and redemption budgets. Excess requests receive `RATE_LIMITED` with `retryAfter` in seconds. Active watches use a separate slot until completion, disconnect or revocation. Changing settings resets rate windows and preserves occupied slots. Rate counters reset on restart. These are RPC limits; Pi still owns accepted agent work, with no second execution queue. Separately, at most four model streams run at once across all bots; later provider requests wait in order and stop waiting when their run is stopped. A slot is held only while a stream runs, never across tool calls.

## Device pairing

Each daemon has one owner. Existing paired devices issue a pairing payload through authenticated `pairing.create`. `openbots pair` uses the existing `pairing.bootstrap` operation on the owner-only Unix socket at `data/ipc/rpc.sock`, before or after initial setup. It does not store a device credential or open the database. Public HTTP/WebSocket calls cannot bootstrap, even from loopback. At startup, while no device is paired, the daemon prints a pairing link (`OPENBOTS_PUBLIC_URL/connect#code=…`) and a terminal QR code, refreshing it when the grant expires. Open the link to prefill the web connect form. Desktop UI integration remains pending.

| RPC call | Access | Result |
| --- | --- | --- |
| `pairing.bootstrap({ serverUrl })` | Owner-only local Unix socket | Five-minute token, expiry, and QR payload/SVG |
| `pairing.redeem({ token, name })` | Pairing token | Device metadata and a new device token |
| `pairing.create({ serverUrl })` | Device bearer token | Five-minute token, expiry, and `qr: { payload, svg }` |
| `pairing.status({ token })` | Device bearer token | Grant expiry, issuer, and `claimedAt` (Unix milliseconds, or `null` while unclaimed) |
| `devices.list()` | Device bearer token | Paired device IDs, names, and creation times |
| `devices.revoke({ id })` | Device bearer token | Revokes that device and its unused pairing grants; may revoke itself |

The daemon creates a private IPC directory (`0700`) and socket (`0600`). That listener accepts only `POST /rpc/pairing/bootstrap`, rejects browser Origin headers, and requires the normal protocol header. A native client can use the shared HTTP client with Bun's Unix-socket fetch option:

```ts
import { makeHttpClient } from '@openbots/client/client';

const local = makeHttpClient({
  url: 'http://localhost/rpc',
  fetch: (url, init) => fetch(url, { ...init, unix: socketPath }),
});
const grant = await local.pairing.bootstrap({ serverUrl });
```

Display `grant.qr.svg`; the new device redeems its token through the normal network endpoint. The first successful pairing invalidates competing unused initial local grants. Later local grants retain their normal expiry and single-use behavior. The local owner can issue a fresh code even when every browser has lost its device credential; existing device credentials remain valid until revoked.

Send device credentials as `Authorization: Bearer <device-token>`. They remain valid until revoked. The database stores SHA-256 hashes of random 256-bit tokens; plaintext credentials are returned only when issued. Losing a redemption response requires a new pairing token. All paired devices have the same owner access.

Claimed grants retain their timestamp after expiry. Unclaimed expired grants are removed when a new grant is issued. Revoking the issuing device removes its grant records, including claim timestamps; this is pairing status, not a permanent audit log.

The pairing API renders `qr.svg` for immediate display. `qr.payload` is an unpadded URL-safe Base64 code containing `{ version: 1, serverUrl, token, expiresAt }`. Clients decode it with `authPairCode` and can render the code themselves. Base64 is an encoding, not encryption; treat the code as a temporary credential. Supply the address the new device can reach; the API normalizes the HTTP(S) origin and rejects credentials, paths, query strings, fragments, and wildcard bind addresses. Loopback addresses are allowed for pairing another browser on the same computer; the UI warns that these codes cannot connect another computer or phone. Scanning requires the app's future QR reader; this is not an app deep link.

Use HTTPS or the encrypted Tailscale path for remote pairing and requests. The native listener does not terminate TLS. The daemon accepts Bearer credentials, not cookies or query-string tokens; foreign browser origins are rejected. Request throttling is implemented through the limits service. See the [pairing plan](.agents/plans/main/05-auth-and-pairing.md).

Each web deployment connects to its configured `OPENBOTS_DAEMON_URL`, including pairing. TanStack Start renders initial data on the server and hydrates the browser query cache; chat loads one complete view before switching to live WebSocket updates. The web stores its device credential in a browser-readable, same-site cookie so SSR and WebSocket calls use the same token. HTTPS connections set the Secure flag. Existing same-origin local-storage credentials migrate once; the credential is never included in hydrated page data, and SSR responses are private and not cached.

## First RPC example

`devices.list()` uses an [oRPC contract](https://orpc.dev/docs/contract-first) in `packages/contracts`, an implementation in `packages/server`, and the daemon's [WebSocket adapter](https://orpc.dev/docs/adapters/websocket) at `/rpc`. It returns only device IDs, names, and creation times. Pairing and device management use this same transport; the former HTTP endpoints have been removed.

```typescript
import { makeClient } from '@openbots/client/client';

const client = makeClient({
  connect: () => new WebSocket('wss://daemon.example/rpc'),
  token: () => deviceToken,
});
const devices = await client.devices.list();
```

An unpaired client omits the credential getter and redeems a token from a QR or payload issued by an already-paired device:

```typescript
const client = makeClient({
  connect: () => new WebSocket('wss://daemon.example/rpc'),
});
const paired = await client.pairing.redeem({ token: pairingToken, name: deviceName });
```

Store `paired.token` securely, then supply it through the credential getter for authenticated calls. Grant creation and redemption are never retried automatically.

The calling app supplies the socket factory and secure credential storage. It must retain and close its sockets when leaving a daemon. The credential getter runs per call; oRPC sends it in that call's headers, not the URL. Server middleware checks the database each time, so revocation rejects subsequent calls on the same socket.

## Bots

Authenticated RPC calls provide `bots.list()`, `bots.get({ botId })`, `bots.create(...)`, `bots.update({ botId, ...changes })`, and `models.list()`. Runtime model discovery uses Pi’s `getAvailable()` to list chat models with provider authentication configured. It returns only provider/model IDs, names, and supported thinking levels, not credentials. Availability does not verify live access, billing, or model entitlement.

Choose `selectedModel` from that catalog, then create a bot:

```typescript
const bot = await client.bots.create({
  name: 'Assistant',
  handle: 'assistant',
  modelProvider: selectedModel.provider,
  modelId: selectedModel.id,
});
const botId = bot.id;
```

Bots store name, unique handle, instructions, provider/model, thinking level, avatar, permission, and skill, MCP, and plugin inheritance preferences. Avatars support blobs, small inline WebP images, colors, and emoji. All RPC inputs remain subject to the listener's 1 MiB payload limit. The default permission is `ask`; inheritance defaults to skills, MCP, and plugins. Permission modes are enforced through Pi tool selection and hooks. Skill, MCP, plugin, and instruction-file inheritance are implemented. Shared instruction files require the `agentsFile` inheritance flag, which is off by default. A working folder is not a sandbox.

Create/update transactions write SQL only. `@openbots/server/native` workspace then creates and validates `agents/<botId>/` during configuration, including restore. Absolute paths are not stored in bot rows. Pi records the relative `agents/<botId>` working directory; the native execution environment resolves it against the data root.

Bulk replacement uses `bots.swapModels({ botIds, from, to, includeFallbacks })`. `from` matches both `modelProvider` and `modelId`; `to` also supplies `thinkingLevel`. Only selected matching primary models change, and matching fallback models change only when `includeFallbacks` is true. The result counts actual primary and fallback changes. Missing selected bots or invalid model settings reject the entire SQL change.

Settings save in one transaction, then affected bots use the existing configuration path. Preparation failure can leave the saved settings awaiting reconciliation on startup or submission; list bots before retrying. Already prepared model requests finish with their original model. Existing private contexts/subagents keep their configuration snapshots. The permission-gated `bot_swap_models` tool calls the same service and is not automatically replayed.

Bots may set one optional `fallbackModel` with `modelProvider`, `modelId`, and `thinkingLevel`. It defaults to `null`; omitting it during an update preserves the setting, and `null` disables it. Both selections are checked against Pi's model catalog.

When a request fails before producing output or reporting token usage with an authentication, quota, or transient provider error, runtime tries the backup once using the same transcript and provider-session identity. Cancellation, context overflow, invalid requests, and failures after output do not trigger fallback. Each new request starts with the primary; the preferred model setting does not change. Pi still owns the generation, submissions, tool execution, and recovery. Completed tools are not replayed by fallback. Deferred provider jobs keep Pi's normal polling behavior; a later polling failure does not switch models.

The two model selections are stored in Pi's agent model reference, so private contexts and subagents inherit them without a separate routing map. Responses and usage name the actual provider/model. Context capacity uses the smaller of the two model windows so compaction prepares a transcript either can accept. Provider caches remain separate; switching providers may require a fresh cache.

App SQL owns settings. A Pi session document keyed by bot ID owns the stable conversation ID; mapping creation and Pi agent configuration share one commit. Updates do not replace the conversation or history. SQL saves first. Configuration then prepares the directory, skills, instructions, plugins, and MCP outside that transaction. Same-bot configuration is serialized in memory; after preparation it rereads the bot row and all four domain settings and retries if the values that affect Pi config changed. Startup restores every bot before resuming work; submission also reapplies settings. A Pi synchronization failure can leave a saved bot/configuration pending reconciliation. List bots before retrying creation after an error, since handles are unique. Empty working folders from failed operations are not automatically deleted.

### Delete a bot and clear its history

```ts
await client.conversation.clear({ botId }); // erase history, keep the bot
await client.bots.delete({ botId });        // erase the bot and everything it owns
```

`bots.delete` removes the bot row and its preferences, deletes its Pi store file, closes its MCP connections and deletes `agents/<botId>/` with its attachments. It is permanent. Peers that later message the bot receive an unavailable result; what the deleted bot sent to a peer stays in that peer's store.

`conversation.clear` stops the bot's work, saves its routines, todos and the latest version of each artifact, deletes its store, opens a fresh one and recreates them with the same IDs. Attachments are deleted and the read position resets; usage and artifact version history start over. The saved routines live in `data/bots/<botId>/carry.json` until the refill finishes, so a crash in between finishes on the next start.

The sidebar list API is described below.

## Sidebar list

```ts
const chats = await client.conversation.list();
// Each row includes isPinned, isHidden, isMuted, mutedUntil, rank, hasUnread, and readThroughEntryId.
```

This authenticated query lists visible main chats before hidden ones, then pinned chats, manual rank and newest message, with a stable bot-ID tie-break. Hidden rows remain available so a client can show and unhide them. `lastMessage` is null for an empty chat; otherwise it contains `entryId`, `role`, a plain-text `preview` of at most 160 characters, and `createdAt` from Pi's message timestamp. Names and avatars come from current bot settings. Private contexts and subagents remain details of their originating chat.

Each bot store keeps a small session-scoped Pi summary document from committed user and assistant text. Tool output, thinking, reset/compaction entries, and private routing inputs do not replace the preview. Native task-graph state supplies `isRunning` for ordinary work in the main conversation; idle background anchors do not keep it busy. List calls read the summary and task graph, never transcripts or full conversation views.

Summary updates follow transcript commits. Startup repairs the index from bounded Pi history pages before resuming execution; reconfiguring an already indexed bot does not rescan it. The index is derived state, not another message log. `conversation.list` returns a snapshot. For live updates, use the client helper:

```ts
import { watchConversations } from '@openbots/client/client';

for await (const chats of watchConversations(client, signal)) {
  // Render main chats; open history only when a chat is selected.
}
```

`conversation.watchList()` sends an initial list and Chord updates over authenticated oRPC. Runtime watches every bot store's summary document and task graph as one merged view; bots that open, clear or delete later join or leave it. Server joins current bot settings and preferences and observes their changes. Previews, ordering, running status, names, and avatars update without reading histories. Slow clients receive updates relative to their last delivered state; reconnect starts with a fresh list. Cancellation stops observation, and device revocation closes idle streams too. Pins and read positions belong to the single owner and sync across paired devices through this same subscription:

```ts
await client.conversation.setPinned({ botId, isPinned: true });
await client.conversation.markRead({ botId, throughEntryId: lastVisibleEntry.id });
```

Pass the last saved entry the user actually viewed. An older request cannot move the read position backwards or clear a later reply. Entries from another chat and unknown IDs are rejected. `hasUnread` means a saved assistant text reply exists after `readThroughEntryId`; owner messages, tool output, thinking, and private routing entries do not create unread state. Opening a subscription does not mark anything read. Both actions return `{ isPinned, readThroughEntryId, hasUnread }`. Use `isPinned: false` to unpin; neither action is automatically retried.

Pin, hidden, rank, mute and read position are owner preferences in the app's `bot_preference` table, deleted with the bot. Pi supplies only the preview, latest reply and running state. Startup repairs the latest assistant entry from history. Existing replies start unread until marked read. The sidebar UI remains separate work.

```ts
await client.conversation.setHidden({ botId, isHidden: true });
await client.conversation.setMuted({ botId, isMuted: true });
await client.conversation.setMuted({ botId, isMuted: true, mutedUntil: Date.now() + 60 * 60 * 1000 });
await client.conversation.arrange({ botIds: orderedBotIds });
```

These actions update the bot preferences and stream to paired devices. `arrange` ranks the supplied chats and clears omitted ranks; pinning still takes precedence. Hide does not stop work or delete history. Mute suppresses backend notification events for that bot, including its private contexts and subagents. `mutedUntil` (milliseconds since epoch) ends a mute at that time; `null` mutes until changed. After expiry, notifications resume and lists report `isMuted: false`; an open sidebar watch refreshes the flag at its next change, so clients should also compare `mutedUntil` with the clock. Notification UI is not implemented.

## Skills and MCP discovery

Generic non-secret settings use the shared `settings` key/value table. Skill directories use `skills.directories`, MCP paths use `mcp.paths`, and tool rules use `tools.approvalRules`. Secrets stay in encrypted `credentials`.

```typescript
await client.skills.configure({ directories: ['~/.agents/skills', '~/shared-skills'] });
await client.mcp.configure({ paths: ['~/mcp.json', '~/mcp-configs'] });
const skillSettings = await client.skills.settings();
const mcpSettings = await client.mcp.settings();
const { skills, mcp } = await client.bots.catalog({ botId });
// Each skill: name, description, filePath, isModelInvocable.
```

Discovery returns the bot's current catalog for the composer, including manual-only skills. It uses the same Pi loader as runtime configuration. It does not run a model or install anything. Composer rendering remains pending. Explicit invocation uses selected catalog names:

```typescript
await client.conversation.submit({
  botId,
  requestId: crypto.randomUUID(),
  content: 'Review this change',
  skills: ['code-review'],
});
```

Up to ten skill names are accepted, including manual-only skills. Runtime reads the selected catalog files, strips frontmatter with Pi's parser, and adds Pi's skill block with its relative-reference directory. Unknown or unreadable names fail before submission. Duplicate names expand once. The expanded text is a normal persisted user entry: later turns can still see it in context, but Openbots does not add it again automatically.

Retries check Pi's conversation-scoped request ID before preparing the bot or reading skills. An already accepted request returns its original submission ID even if the skill file was removed, including after restart. New requests still validate and load the selected skills.

Bot `.pi/skills` and `.agents/skills` take priority over configured directories, followed by Pi's global skills directory. The first matching skill name wins. Pi scans nested directories and deduplicates files reached through symlinks. Configured relative paths resolve against `OPENBOTS_DATA_DIR`; `~` expands to the daemon user's home. Shared directories default to `['~/.agents/skills']`; `PI_CODING_AGENT_DIR` selects Pi's global directory.

Removing `skills` from a bot's inheritance disables shared and Pi-global sources but keeps bot-local skills. `directories: []` clears the additional directory list; omitted fields stay unchanged. Discovery and argument hints are cached per bot for 30 seconds. Directory, inheritance, or Pi agent-directory changes invalidate the cache immediately; file edits and new skills appear on the first request after expiry. Runtime refreshes on startup, bot configuration, and submission using that catalog; existing turns retain their current prompt. Pi adds skill descriptions and paths to the prompt, then reads full instructions on demand. Explicit invocation reads the selected skill body fresh.

MCP discovery returns `mcp.servers` and `mcp.diagnostics`. Servers include name, description, source file, transport, `isEnabled`, connection `status`, and discovered tool metadata. Commands, arguments, URLs, environment values, and headers are excluded. Discovery reads files and current connection state only; it never opens a connection. Tools appear after bot configuration connects the server.

MCP tool schemas are deferred. Pi's native `tool_search` loads matching definitions when the model needs them; Pi keeps that selection across reconfiguration and restart. Search is a trusted metadata operation; discovered tool calls still require the bot's permission policy. Read-only bots cannot discover untrusted MCP tools. Connections are prepared during bot configuration, not during search. Native coding and Openbots tools remain immediately available; plugins may opt into Pi's `deferred` tools.

MCP source order is Pi's global `mcp.json`, `~/.agents/mcp.json`, configured MCP paths, bot `.agents/mcp.json`, then bot `.pi/mcp.json`. Shared sources require the bot's `mcp` inheritance flag. Each configured path may be a file or directory. Directories recursively scan `mcp.json` and `*.mcp.json`, skip `.git` and `node_modules`, follow symlinks without cycles, and sort resolved file paths. Later definitions replace the whole same-named entry. A malformed server override removes the earlier same-named entry and adds a diagnostic. Whole-file failures add diagnostics; the returned catalog can be partial.

Use the standard `{ "mcpServers": { "name": { ... } } }` JSON shape. Discovery recognizes stdio commands and HTTP URLs, plus `enabled: false` or `disabled: true` on a complete definition. Stdio accepts `args`, `env`, and `cwd` (relative to the bot directory by default); Streamable HTTP accepts `headers`. Values are literal: shell substitutions and environment interpolation are not supported. `paths: []` clears additional sources, and omitted settings remain unchanged. Composer rendering remains pending.

Reference encrypted credentials by name with `envCredentials` for stdio or `headerCredentials` for HTTP:

```json
{
  "mcpServers": {
    "example": {
      "url": "https://mcp.example.com/mcp",
      "headerCredentials": { "Authorization": "mcp.example.authorization" }
    }
  }
}
```

Set `mcp.example.authorization` through authenticated `credentials.set`; store the complete header value, including any authorization scheme. Referenced values replace literal values for the same environment/header name; HTTP header matching ignores case. Discovery checks key presence without decrypting. Preparation resolves secrets in memory; a missing/unreadable key omits that server and closes its prior client. Rotation reconnects on the next bot preparation (startup, bot configuration or submission), not immediately when the credential is saved. Catalogs contain neither values nor transport configuration.

Only shared MCP sources may reference credentials. A bot can write its own folder, so a server in a bot's `.agents/mcp.json` or `.pi/mcp.json` that uses `envCredentials` or `headerCredentials` is skipped with a diagnostic. This blocks the direct path only; a bot with unrestricted shell access under Full mode can still edit files outside its folder.

### MCP OAuth

Paired devices authenticate a configured HTTP MCP server with `mcpAuth.start({ botId, name, redirectUrl })`. Openbots resolves `name` using the bot's inherited/local configuration; callers cannot supply a different MCP server URL. The client opens the returned authorization URL and captures its registered redirect, then sends the full callback URL to `mcpAuth.complete({ botId, name, callbackUrl })`. The server verifies the initiating device, redirect destination and OAuth state before Pi exchanges the code.

`mcpAuth.status`, `mcpAuth.cancel` and `mcpAuth.logout` take `{ botId, name }`. Pi's `McpOAuthProvider`, `authorizeMcp` and `adaptOAuthProvider` own discovery, registration, PKCE, token exchange and refresh. OAuth state is encrypted through the shared credentials service and bound to the exact MCP URL; bots using that URL share the owner's login. Unfinished flows expire and are cancelled when their device is revoked. Restart keeps saved credentials but requires starting unfinished login flows again. No browser or callback listener is started by Openbots.

Successful completion reconfigures the selected bot to reconnect and discover its tools. Other bots reconcile on their next configuration/submission. Ordinary connection setup does not start a new browser authorization flow. The frontend still needs to capture its redirect URL and render the login flow.

## Backend notification events

`conversation.watchNotifications()` provides one authenticated stream for the daemon. The shared client helper applies its Chord frames:

```ts
import { watchNotifications } from '@openbots/client/client';

for await (const state of watchNotifications(client, controller.signal)) {
  // state.pending: outstanding approval and question references
  // state.recent: up to 32 reply and failure events observed by this watch
}
```

Events contain identifiers for the bot, conversation, entry or task, plus expiry where relevant. Fetch the selected chat or existing approval/question endpoint for details. The stream carries no tool arguments, question text, provider errors or message bodies. Each bot store reports its own events and the server merges them; mute is read from the app database, so private contexts and subagents follow their bot's mute. Hiding a chat does not mute it.

Each connection starts with current pending attention and an empty recent list. Completion events missed while disconnected are not replayed. Clients can compare stable event identifiers across snapshots and decide whether to show an OS notification; foreground suppression, sound and mobile push remain client work. Cancelling the stream or revoking its device ends observation without stopping agent work.

## Instruction files and plugins

These domains use the existing settings table: `instructions.paths` and `plugins.directories`. Settings writes are partial; omitted fields preserve values and `[]` clears configured sources.

```typescript
await client.instructions.configure({ paths: ['~/.agents/AGENTS.md', '~/bot-instructions'] });
await client.plugins.configure({ directories: ['~/.agents/plugins', '~/bot-plugins'] });
const { instructions, plugins } = await client.bots.catalog({ botId });
// instructions: { files: [{ path, content }], diagnostics }
// plugins: { plugins: [{ name, path }], diagnostics }
```

`instructions.settings/discover` and `plugins.settings/discover` also expose each domain separately. Discovery reads files and metadata; it never imports plugin modules or starts execution. Plugin display names come from filenames, not module evaluation.

Instruction order is Pi's agent directory, configured paths, then the bot working folder. The first two require `agentsFile` inheritance. The default configured path is `~/.agents/AGENTS.md`. A directory selects one file in Pi order: `AGENTS.override.md`, `AGENTS.md`, `AGENTS.MD`, `CLAUDE.md`, `CLAUDE.MD`. Paths may also name files directly; symlinks are deduplicated by realpath. Parent directories are not scanned. Bot-local files always apply, followed by the bot's explicit instructions. Missing default locations are skipped; unreadable files and missing explicit paths produce diagnostics and reject configuration. Files refresh on configuration, startup, and submission.

Plugins load from bot `.pi/plugins` and `.agents/plugins`, followed by configured directories when `plugins` inheritance is enabled. Shared directories default to `~/.agents/plugins`. Each directory contains `.ts`, `.js`, or `.mjs` modules, or child folders with `index.ts`, `index.js`, or `index.mjs`. This scan is not recursive. Symlinks are deduplicated by realpath. Relative configured paths resolve against `OPENBOTS_DATA_DIR`; `~` expands to the daemon user's home.

Each module default-exports a Pi Durable extension, as in Pi's `defineExtension` examples:

```typescript
import { defineExtension, section } from '@earendil-works/pi-durable';

export default defineExtension({
  name: 'team.guidance',
  sections: [section('team-guidance', () => 'Use the project conventions.')],
});
```

Pi owns extension tools, sections, hooks, and tasks. Openbots selects extensions per bot and keeps its permission hook last. Plugin tools do not gain read-only trust. Plugins are trusted native code running as the daemon user; approval gates tool calls, not module imports or arbitrary JavaScript. Pi CLI ExtensionFactory modules are not supported. Module dependencies must resolve from the plugin's own location.

Imports are cached by canonical path. Restart after editing module code; there is no hot reload. Invalid modules reject bot configuration and appear in catalog diagnostics. Distinct modules cannot share an extension name, and `openbots.*` names are reserved. Removing selection stops new use but does not unload code needed by admitted Pi work. Keep modules available while their tasks remain recoverable; removing required task definitions can prevent recovery.

## Peer collaboration and subagents

Peer tools select another bot on the same daemon. By default they reuse its main conversation. Pass `context: 'temporary'` for a separate context scoped to the sending conversation and recipient; there is no global bot-pair context.

| Tool | Behavior |
| --- | --- |
| `bot_list` | List other local bots by ID, name, and handle; a trusted read. |
| `bot_ask({ botId, message, context? })` | Wait for a peer's answer. A busy recipient is rejected; use `bot_message` to queue work. |
| `bot_message({ botId, message, context? })` | Accept background delivery; the reply returns as follow-up input in the sender's conversation. |
| `bot_subagent({ operation: 'run', message })` | Run a task-owned child and return its answer. |
| `bot_subagent({ operation: 'spawn', name, message })` | Start a named background child and report its answer later. |
| `bot_subagent({ operation: 'send', name, message, whenBusy? })` | Send to an existing background child; default placement is `steer`. |
| `bot_subagent({ operation: 'status', name? })` | Read named background child state. |
| `bot_subagent_stop({ name })` | Stop a background child's current work; keep its context for later messages. |

Openbots-owned tools use the `bot_` namespace. Finish pending calls that use the old unprefixed names before upgrading the daemon. Pi stores tool names with each call; this rename does not migrate those saved calls. Task, document and extension identifiers remain unchanged.

`context` accepts `existing` (the default) or `temporary`. Temporary contexts reuse the recipient’s configuration, skills, permissions, and working directory, without copying its transcript. New admissions refresh that configuration from the main conversation. Context isolation does not isolate files or tools.

A temporary context lives in the recipient's store and lasts 48 hours from creation. The next temporary delivery after expiry archives the old context and creates a fresh one in the recipient's store; the sender's conversation keeps a pointer to it. Existing deliveries remain attached to their original context and can finish; history stays readable. This is lazy rotation, with no background cleanup timer or hard deletion. Default-mode messages never create or rotate temporary contexts. Tool details include `recipientConversationId`, which clients can open with the recipient’s `botId`.

Peer delivery uses native Pi tasks, checkpoints, and stable submission IDs. The delivery task lives in the sender's store and submits into the recipient's store with request ID `openbots.delivery:<senderStoreId>:<taskId>`; a rerun after a crash gets the same submission back, so the recipient sees the message once. The sender's store ID is random per store, so task IDs that restart after a history clear never match an old delivery. The answer text is copied back with the result. Self-delivery and delegation triggered by peer requests/reports are denied. Each source conversation admits at most eight pending deliveries. Recipient conversations serialize their own turns. Stopping the sender does not stop the independent recipient or accepted background delivery. This is a local peer tool surface, not a separate DM UI or cross-daemon bridge.

Subagents follow Pi's foreground and background examples. They copy the parent's agent configuration and bot identity at creation, so approvals use the owning bot's current permission policy. Children cannot spawn further children or contact peers. A conversation runs at most eight background children at once; finished or stopped children no longer count. Names persist for reuse with send; removing them is not implemented. Foreground children stop with their owner task; background children survive parent stop. All tools still pass through the permission hook, including delegation tools.

Tool details expose child `conversationId`. Pass it alongside `botId` to the existing conversation watch/history/submit/stop or command calls to select that child. Omitting it selects the bot's main conversation. A mismatched bot/conversation pair is rejected. `tools.pending({ botId })` includes approvals from both main and child conversations; no additional approval table or queue is used.

### Conversation usage

```typescript
const usage = await client.conversation.usage({ botId, conversationId });
```

Omit `conversationId` for the bot's main chat. The result reads Pi's `UsageDoc`: `models` is keyed by `provider/modelId`, and `tools` by tool name. Each bucket includes input/output/cache token counts, optional reasoning and one-hour cache-write counts, total tokens, and cost breakdowns. Empty conversations return empty records. These are Pi/provider-reported values, not a billing invoice.

Usage covers the selected conversation's own accumulated spend, including compaction attempts. Child and temporary conversations keep separate ledgers; this endpoint does not sum a conversation tree. Usage queries read no transcripts and do not start work. Refresh when the UI needs a new snapshot.

For the selected conversation's context window:

```typescript
const context = await client.conversation.contextUsage({ botId, conversationId });
// context.contextWindow: model capacity in tokens, or null when unknown.
// context.estimatedTokens: estimated tokens in Pi's committed active context.
```

This read loads only the selected conversation's active context through Pi. Request it when opening the stats panel and after a completed turn, reset, compaction, or model change; it is not part of sidebar or live-token updates. The estimate uses provider usage after the latest context boundary plus Pi's token estimates for subsequent messages. Older measurements are excluded after reset or compaction, including retained messages with equal timestamps.

The estimate is not lifetime usage or an exact next-request size. Pending input, a live partial answer, and prompt/tool changes not yet committed are excluded. An empty committed context reports zero even when the next request will add instructions and tools. The model's capacity does not subtract Pi's reserved answer budget.

### Discover chat contexts

Fetch details only when the user opens a chat's context panel:

```typescript
const children = await client.conversation.contexts({ botId, kind: 'subagent', limit: 25 });
const peers = await client.conversation.contexts({ botId, kind: 'temporary', limit: 25 });
```

Both queries return `{ items, next? }` in newest-conversation-first order. Pass `next` as `cursor` with the same target and kind to continue. An optional `conversationId` selects a source other than the bot's main chat. Subagents include finished children, their owner task ID, background flag, and name when named. Temporary contexts include their recipient bot ID and creation, expiry, and archive timestamps. Default peer messages reuse main chats and do not appear as temporary contexts. `isRunning` is a snapshot of Pi's ordinary live tasks.

Discovery reads Pi ownership records and documents, never messages or full views, and starts no work. Subagents are scanned by parent in the bot's store. Temporary contexts live in recipient stores; the source conversation keeps pointers to them, and each page reads that list, then the recipients' metadata and running state. On selection, pass the item's `botId` and `conversationId` to the existing history/watch calls; peer contexts belong to the recipient. Archived history remains available.

Keep one invalidation subscription open while the panel is visible:

```typescript
for await (const _state of watchConversationContexts(client, { botId }, signal)) {
  const page = await client.conversation.contexts({ botId, kind: 'subagent', limit: 25 }, { signal });
  renderContexts(page);
}
```

`conversation.watchContexts` sends Chord frames for `{ revision }`; the helper applies them. Each value, including the initial value after reconnect, tells the UI to refetch its visible metadata pages. Revisions belong to that subscription, not a persisted replay cursor. New contexts require refreshing the first page; retain lazy pagination rather than fetching every page.

Membership/name changes are scoped to the source conversation. Busy/idle changes use the bot store's live task graph; a temporary context's running state, which lives in the recipient's store, refreshes on the next page read; the stream reveals no other conversation data. Token-only and task-checkpoint-only changes do not invalidate pages. Pi/Chord bound pending deliveries and can coalesce updates, which is safe because a refetch reads current state. Cancellation closes observation, not tasks, and device revocation closes the stream.

## Live conversation

`conversation.watch({ botId })` streams Pi's `LiveDoc` and `InboxDoc`, the conversation ID, and the latest saved entry ID. It never mounts the full transcript. The wire carries an initial snapshot followed by compact Chord operations. `watchConversation` loads the newest 50 stored entries, then fetches new entries in bounded pages as the saved entry ID advances. Its view contains `entries` in chronological order, `live`, `inbox`, and `historyCursor` for loading older pages:

```typescript
import { watchConversation } from '@openbots/client/client';

const controller = new AbortController();
for await (const view of watchConversation(client, { botId }, controller.signal)) {
  render(view);
}
```

`view.inbox.items` contains Pi's pending submissions, in ID order. Input items carry `id`, `mode` (`steer` or `followUp`), and `content`; `id` matches the submit acknowledgement's `submissionId`. Pending writes use `mode: 'write'` and `entry`, for example a queued reset. Keep them separate from saved messages. Pi removes items when they are placed or withdrawn. The queue UI remains pending; the backend exposes editing, promotion and cancellation.

```typescript
await client.conversation.updateSubmission({ botId, submissionId, content: 'Updated request', skills: ['review'] });
await client.conversation.updateSubmission({ botId, submissionId, whenBusy: 'steer' });
await client.commands.execute({ botId, name: 'cancel', arguments: String(submissionId) });
```

An update changes content, placement mode, or both while the input is still queued. Editing replaces the whole content; selected skills are expanded again for that edit. Omitting `skills` on a content edit removes any previous skill expansion. Changing only `whenBusy` preserves the content. The input keeps its submission ID, request ID and queue position. Once Pi places it, an edit is rejected. Peer messages, subagent reports and passive writes cannot be edited through this operation. All connected devices see the committed inbox update through the existing watch.

Call `controller.abort()` when leaving the view. Disconnecting or cancelling stops observation, not the agent. oRPC reconnects interrupted watch calls and receives fresh live/inbox state and the current entry ID. The client catches up from its last loaded entry; interrupted history reads can retry, while commands and submissions are never automatically retried. Revoking a device ends its subscriptions even while idle. Both document watches and the commit listener close together. Pi's document watch and Chord's state subscriptions bound pending updates; skipped intermediate updates still carry the latest entry ID for history catch-up.

To scroll back, call `conversation.history({ botId, conversationId, cursor: view.historyCursor, limit: 50 })` and continue with the returned `next` cursor. These pages are newest-first; reverse each page for chronological display. Private contexts and subagents load only when explicitly selected by conversation ID. They are details within the originating chat, not extra top-level sidebar chats.

All paired devices have owner access to the selected bot's view. Peer messages default to existing bot conversations; the sidebar and attachment UI remain pending. Group rooms are excluded. Earlier disposable WebSocket checks verified the single-root transport before bot routing was added. Disposable bot integration checks cover tool approvals and SQLite recovery; live providers remain unverified.

## Submit and stop

The authenticated client exposes Pi's existing submission and abort behavior:

```typescript
const request = { botId, requestId: crypto.randomUUID(), content: 'Hello', whenBusy: 'followUp' as const };
const { submissionId } = await client.conversation.submit(request);
// If the response is lost, retry the same request ID; Pi returns the same submission.
const retried = await client.conversation.submit(request);
await client.conversation.stop({ botId });
```

Submit requires a bot UUID, text or attachments, and a request ID of 1–128 characters. Request IDs are scoped to that bot's Pi conversation. The returned numeric `submissionId` acknowledges durable admission, not a completed answer; observe the conversation for progress. An omitted `whenBusy` uses the chat's mode from `conversation.setWhenBusy`, then the default from `conversation.configure` (read with `conversation.settings`), then `followUp`. `steer` queues input for a steering boundary; `reject` returns `CONFLICT` if busy. Pi treats a reused request ID as the same submission even if its content differs, so use a new ID for new input. Pass uploaded files through `attachmentIds`; raw image blocks are not accepted by this contract.

| Composer mode | `whenBusy` | Behavior |
| --- | --- | --- |
| Queue | `followUp` | Start after the current reply finishes. |
| Steer | `steer` | Join the current work after its tool round. |
| Interrupt | `interrupt` | Abort the selected run and start this message first, keeping its other queued inputs. |

Interrupt uses Pi task cancellation and generation. It leaves the inbox unchanged while admitting the replacement. Pending steers can join at the replacement's next tool boundary; follow-ups run after its answer. Interrupt does not undo completed tool effects. If another run starts before the replacement can be admitted, the operation returns `CONFLICT` instead of cancelling that newer run. Reusing an admitted request ID returns its submission without another interruption.

Stop affects only the selected bot: it withdraws queued inputs, aborts ordinary running work, and waits until it is idle. It does not cross Pi's background-task boundaries. Cancelling a client request or leaving the watch does not stop accepted work. Neither submit nor stop is automatically retried.

Before bot routing was added, a disposable WebSocket check with SQLite and Pi's faux provider passed authentication, input validation, deduplication, busy modes, stop, cancellation, and revoked-command rejection. This historical check does not verify the new bot routes. No real provider credentials or production data were used.

## Configuration

`@openbots/env/client` and `@openbots/env/server` export separate `env` objects using the same `createEnv` pattern. The client schema is empty. Add mobile configuration with the mobile app.

| Server setting | Default | Values |
| --- | --- | --- |
| `OPENBOTS_DATA_DIR` | `~/.config/openbots/` | Nonempty path; native host expands `~` and `~/`, and resolves relative paths |
| `OPENBOTS_HOST` | `0.0.0.0` | Bind address or hostname |
| `OPENBOTS_PORT` | `3000` | Integer from 1 to 65535 |
| `OPENBOTS_LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `OPENBOTS_ALLOWED_ORIGINS` | empty | Comma-separated browser or webview origins, such as `https://bots.example.com`. Requests without an Origin, or with an IP-literal or `localhost` Origin, are always allowed. Add every hostname origin that serves the web app |
| `OPENBOTS_PUBLIC_URL` | `http://127.0.0.1:47190` | Web app URL used in the startup pairing link |
| `OPENBOTS_DAEMON_URL` | `http://127.0.0.1:3000` | Daemon URL used by web SSR and the `/rpc` proxy |
| `OPENBOTS_WEB_HOST` | `127.0.0.1` | Web app bind address |
| `OPENBOTS_WEB_PORT` | `47190` | Web app port |

Bot settings and tool credentials belong in the app database; provider authentication uses Pi's auth files. The env package does not read or write local config files or generate secrets.

## References

- [Architecture](.agents/references/architecture.md)
- [Design](DESIGN.md)
- [Quality gate](.agents/references/quality-gate.md)
- [Pi Durable examples](.agents/docs/pi-durable.md)

## Conversation history

Read older entries directly from Pi through the authenticated client:

```typescript
const page = await client.conversation.history({ botId, limit: 50 });
const older = page.next && await client.conversation.history({ botId, cursor: page.next });
```

Pages contain Pi entries, newest first, with an optional `next` cursor. Return that cursor unchanged for the same bot; its absence means the end of history. The limit defaults to 50 and cannot exceed 100. This is the stored transcript, including runtime entries, not only the current model context. There is no SQL message copy.

MCP connections are owned by `@openbots/runtime/native`, separately for each bot. The MCP service in `@openbots/server/native` owns directory settings and config-file discovery. It passes parsed configuration to runtime clients; the daemon only constructs and wires these objects. Startup, bot changes, and submission prepare enabled servers and reuse unchanged connections. A changed or disabled definition closes its previous connection. Tool-list notifications refresh the catalog on the next preparation; disconnected servers reconnect then. Local command configurations are trusted host configuration and run with the daemon’s OS access.

MCP tool calls use Durable tasks and the same Read-only/Ask/Auto/Full policy as other tools. Remote read-only hints do not bypass approvals; MCP tools are excluded in Read-only mode. Calls forward cancellation and progress, preserve MCP error results, and use `replay: 'unsafe'`. An interrupted external call is not automatically sent again after restart. The host closes MCP clients after stopping the runtime. Connection/discovery requests time out after 10 seconds; tool calls use a 60-second timeout renewed by progress.

## Routines

Authenticated `routines.list/create/update/run/remove` manage schedules for a bot's main conversation. `update` accepts partial fields; set `isEnabled: false` to pause and `true` to resume. Schedules are `{ kind: 'once', runAt }` (epoch milliseconds), `{ kind: 'interval', minutes }`, or `{ kind: 'cron', expression, timezone }`. Cron uses five fields at minute resolution and an explicit IANA timezone, including daylight-saving changes. Randomized `H` fields and seconds are not supported.

```ts
const routine = await client.routines.create({
  botId,
  name: 'Morning summary',
  prompt: 'Summarize the outstanding work.',
  schedule: { kind: 'cron', expression: '0 9 * * MON-FRI', timezone: 'Europe/Lisbon' },
  isEnabled: true,
});
await client.routines.update({ botId, routineId: routine.id, isEnabled: false });
await client.routines.run({ botId, routineId: routine.id });
```

Pi owns the conversation-scoped routine document and one background task per routine. Waiting uses native `sleep` and `watchDoc`, with no model calls. The task saves its deadline and occurrence before delivery, submits the prompt with a stable request ID and `followUp`, then waits for the native submission receipt. The bot uses its configured model, tools and permission hook. Its answer appears directly in that conversation; there is no separate result-copy turn, SQL queue or message mirror.

One routine has at most one claimed occurrence at a time. `lastRun` reports the occurrence, timestamps, native submission ID, status and failure reason. Pause, removal and edits affect future claims; a claimed occurrence keeps its prompt and finishes even if paused or removed. `run` works while paused without enabling the schedule and returns `CONFLICT` while another occurrence is running or already requested. Manual runs preserve a future scheduled deadline.

After downtime, a saved overdue deadline runs once; missed repetitions are not replayed. Cron chooses the next future calendar time after completion. Intervals wait the specified minutes after completion. A scheduled one-shot disables itself after its receipt settles, including an unanswered result. Resuming a past one-shot explicitly requests it again. On restart, the harness resumes the saved phase and reuses the same submission instead of creating another input. External tool effects still follow Pi's replay guarantees.

Waiting does not depend on a host timer surviving: after each commit, every bot store arms one host alarm at its earliest saved deadline (routine runs, approval and question expiry) plus a one-minute heartbeat while other work is live, and the alarm resumes that store. The native daemon must remain running; its alarm is an in-process timer. A Cloudflare host would back the same port with Durable Object alarms. The routine editor and live routine-list UI are not implemented.

Bots have `bot_routine_list`, `bot_routine_create`, `bot_routine_update`, `bot_routine_run` and `bot_routine_remove`. These call the same runtime routine service as RPC. Tool schemas are derived once from the public routine contracts. Tools derive the bot identity from Pi; they accept no bot or conversation ID. Private contexts and subagents manage their bot's main-chat routines, with the same permission hook.

Only `bot_routine_list` is a trusted read. Changes use Ask/Auto/Full approval policy; read-only bots cannot change routines. `bot_routine_update` pauses/resumes via `isEnabled`. `bot_routine_run` queues work and returns immediately, so a bot does not wait for its own next turn. Mutating tools use Pi's `replay: 'unsafe'`: a crash after a write can leave it applied, but Pi will not blindly repeat it. The model must list current routines before deciding whether to retry. Scheduled deliveries keep their existing request-ID deduplication.

## Todos

Authenticated `todos.list/create/update/reorder/remove` manage a short todo list for a bot's main conversation. Owner and bot share the list. `update` accepts `title` and `isDone`; `doneAt` records completion. `reorder` puts the given IDs first in that order; todos it does not name, such as one the bot added meanwhile, follow in their current order. The list and the prompt section use that order. Clearing history keeps todos with their IDs and order.

```ts
const todo = await client.todos.create({ botId, title: 'Renew the domain' });
await client.todos.update({ botId, todoId: todo.id, isDone: true });
```

Open todos reach the model through a `todos` system prompt section, not a message. The section is absent while no todo is open and is resent only when the list changes. Bots have `bot_todo_list` (trusted read), `bot_todo_create`, `bot_todo_update` and `bot_todo_remove`; changes use the normal approval policy. Periodic reminders use a routine, for example a weekday routine asking the bot to review its open todos.

## Bot management tools

`bot_get`, `bot_create`, `bot_update`, `bot_catalog`, and `bot_model_list` use the existing bot service and Pi model catalog. `bot_list` remains the peer directory. Create/update use the same input contracts as owner RPC; omitted update fields preserve existing settings. Catalog reads discover skills, instruction files, plugins, and current MCP tool metadata without starting MCP connections or importing plugins.

Reads are trusted by their exact tool registration. Create/update pass through the permission hook and are unavailable in Read-only mode. They use Pi's unsafe replay policy: after an interrupted write, read the bot before deciding whether to retry. Registration happens before bot restore and runtime resume, and the permission hook stays last.

## Search and bot reactions

`bot_history` and `bot_search` read the current conversation. They accept `limit` (default 50, maximum 100) and an opaque `cursor`; search also requires `query`. Owner clients use `conversation.search({ botId, conversationId?, query, limit?, cursor? })`.

Each call reads one native Pi entry page, filters visible message text, and returns `{ messages, cursor?, hasMore }`. Messages within that page are chronological. An empty page can still have a cursor; continue with it to scan older entries. Search is case-insensitive text matching, with no separate index or transcript copy. Thinking, tool results, and artifact bodies are excluded. This is bounded page search, not a full-history search in one call.

`bot_react({ entryId, emoji, isPresent })` adds or removes the executing bot's reaction in its current conversation. It cannot select another bot or conversation. Owner `emojis` and attributed `botReactions` are separate in reaction responses. Removing one author's reaction preserves the other author's reaction. Existing owner reactions migrate in Pi. Reactions do not start a model turn; the selected chat's `interactionsRevision` tells clients to refetch visible reactions. Bot reaction writes use the same approval and replay policy as other writes.

## Artifacts

Artifacts support structured JSON layouts and self-contained HTML pages. Structured layouts use the 27 Orbs block types, including text, tables, charts, checklists, and state-bound controls. `artifacts.blocks()` returns cached block schemas. Layouts use `root`, `elements`, and `state`; json-render validates the structure and resolves state bindings before each block's schema is checked. Links and images accept HTTP(S) URLs. An artifact spec is limited to 200,000 UTF-8 bytes and a tree depth of 32. Cycles, shared children, and unreachable elements are rejected.

```ts
const artifact = await client.artifacts.create({
  botId,
  title: 'Summary',
  spec: {
    root: 'heading',
    elements: { heading: { type: 'Heading', props: { text: 'Summary' }, children: [] } },
    state: {},
  },
});
await client.artifacts.update({ botId, artifactId: artifact.id, version: artifact.version, title: 'Updated summary' });
```

For an HTML artifact, pass `spec: { html: '<h1>Hello</h1>' }` to the same create or update operation. HTML uses the same storage, version history, chat references, and fullscreen views as structured artifacts. The web client runs inline scripts in an opaque-origin sandbox with automatic height (up to 1,600 pixels before scrolling) and live theme CSS variables such as `--background`, `--foreground`, and `--primary`. Remote resources, network requests, form submissions, and access to app storage are blocked; embed images with data URLs. HTTP(S) links open outside the frame after user interaction. Script state is local to each mounted frame and is not saved through `saveState`. Assistant replies can also show HTML without creating an artifact: a complete `html`/`htm` code fence or a standalone raw HTML block renders in the same sandbox, with Source and fullscreen controls. Execution waits until the text has finished streaming. User messages and other Markdown views do not enable these previews. For example, ask: “Reply with an interactive counter in one HTML code block, using inline CSS and JavaScript. Do not create an artifact.”

`artifacts.list` returns the 100 most recently updated summaries for the selected conversation. `get` loads one body, optionally at a saved version. `update`, `saveState`, and `restore` require the current `version`; stale edits return `CONFLICT`. Every change creates a version, including title and state changes. `versions` lists the ten most recent versions; restore copies a selected version into a new one. Older data remains in Pi storage but is not offered by this version list.

Pi owns the artifact index and version documents. Chat entries contain artifact references, not duplicated bodies; they do not enter model context. The selected live conversation exposes `artifactsRevision` so clients can refresh summaries and fetch an open artifact. Bodies are loaded through `get`, not sidebar or live subscriptions. Artifact tools return the content they explicitly read or write as ordinary tool results.

Bots have `bot_artifact_list`, `bot_artifact_get`, `bot_artifact_blocks`, `bot_artifact_create`, and `bot_artifact_update`. They use their current Pi conversation and cannot supply another bot or conversation ID. Reads are trusted registrations; mutations require the configured approval policy and are not automatically replayed after interruption. Owner RPC authorizes the selected bot/conversation pair. The artifact renderer and editor are not implemented yet.
