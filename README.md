# Openbots

A Bun/Turbo bot backend with a native daemon, device pairing, bot configuration, and authenticated submit, stop, and live views of persistent per-bot Pi Durable conversations. Pi supplies shared provider authentication. Explicit skill invocation, private peer messages, and foreground/background subagents are available. Desktop, mobile, file APIs, and a provider-login UI are not implemented yet.

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

The daemon listens on all IPv4 interfaces (`0.0.0.0`), using port 3000 by default, so it can accept LAN and Tailscale connections. Set `OPENBOTS_HOST` to bind a specific interface. `GET /health` returns `{ "status": "ok" }`. The `/rpc` WebSocket carries all product operations. Pairing redemption uses a single-use pairing token; other RPC calls authenticate a device credential. Other HTTP paths return 404. SIGINT/SIGTERM close connections and stop the listener. Health confirms HTTP handling only, not database or agent readiness.

`OPENBOTS_DATA_DIR` is the only configurable storage path and defaults to `~/.config/openbots/`. Bot records keep IDs, not home-directory paths; derive each working folder from the root and bot ID. The native host expands `~` and resolves relative overrides before using this layout:

```text
OPENBOTS_DATA_DIR/
  agents/<botId>/       derived bot working folders
  data/
    runtime.sql        Pi Durable SQLite database
    app.sqlite         application SQLite database
```

Startup creates missing root, data, and agents directories with private permissions and checks read/write/traverse access before opening a database. A path occupied by a file or an inaccessible directory stops startup with a filesystem error. Database opens still report file-level errors; the directory check cannot guarantee a later write succeeds.

Startup opens `data/runtime.sql` with a single-process lock, opens and migrates `data/app.sqlite`, creates Pi's model runtime, constructs workspace, skill, instruction, plugin, and MCP services from package exports, then restores each bot's Pi conversation and settings before calling `resume()`. Shutdown closes the listener, runtime, MCP clients, app database, and storage lock. Pairing grants live in `app.sqlite`. Use a separate data directory per independent daemon. Existing databases are not moved or renamed automatically.

The app database uses `node:sqlite` through Kysely, adapted from Orbs. WAL and foreign keys are enabled. Kysely tracks the [SQL migrations](packages/server/src/services/database/migrations/0001_pairing.sql); the first migration creates devices and temporary pairing grants. Further migrations add bots and their avatar, permission, and inheritance preferences. Migration `0005_credentials` adds the shared encrypted key/value store for application secrets. Provider credentials use Pi's auth files, not app tables. Pi Durable remains the owner of conversation history.

The daemon initializes native logging at startup. Startup, runtime, and shutdown failures are logged and set a nonzero exit code.

The internal server service supports submit, watch, history, and stop through Pi Durable 1.3.0. The daemon injects Pi's `ModelRuntime` for providers and authentication. Pi’s built-in `read`, `write`, `edit`, and `bash` tools are installed; no fake provider is installed in application code. Bot settings select the model, thinking level, and instructions for each conversation.

## Runtime commands

Authenticated clients discover supported slash commands with `commands.list({ botId })`, then send the selected name and optional trailing text to one endpoint:

```typescript
const commands = await client.commands.list({ botId });
await client.commands.execute({ botId, name: 'compact', arguments: 'Keep the failing test names' });
await client.commands.execute({ botId, name: 'reset', arguments: 'Continue with the login fix' });
```

Catalog names omit `/`; clients render that prefix. Runtime owns the catalog and calls Pi Durable's native `compact()` or `reset()`. The server checks the bot and authentication; the daemon transports the request. Descriptions use shared i18n messages.

Success means Pi accepted the command, not that compaction finished or a queued reset was placed. Follow `conversation.watch` for state and `conversation.history` for persisted entries. Both operations preserve history. Compact summarizes older context; reset starts empty context or uses the optional text as a handoff. Pi owns busy handling and recovery. Commands are not automatically retried after disconnect.

Only compact and reset are exposed here. Ordinary `conversation.submit` text is unchanged, including text that starts with `/`. Skills remain discoverable through `skills.discover` and `bots.catalog`; pass selected names in `conversation.submit.skills`. CLI-only commands are not exposed.

Command and skill catalog items include `argumentsSchema` (JSON Schema) and nullable `argumentHint` for composer controls. Both currently accept text: send command text as `commands.execute.arguments` and skill text as `conversation.submit.content` with the selected `skills`. Schemas are generated once from those input validators. Skills may declare a hint such as `argument-hint: "[file] [focus]"` in frontmatter; hints do not declare typed fields or substitute placeholders. No argument schema is inferred from skill prose.

## Tools and approvals

Bots use Pi Durable's `read`, `write`, `edit`, and `bash` tools in their working folder. Read-only offers only declared read tools. Ask waits for approval on other calls. Auto uses Jev and falls back to Ask when its key is absent or its decision is uncertain. Full permits calls without approval. Commands run as the daemon's OS user; the working directory is not a sandbox.

Authenticated clients use `tools.pending({ botId })` and `tools.answer({ botId, id, approved })`. The pending list includes child subagent approvals, with a `conversationId` for opening their view. Requests expire after five minutes. Pi stores their state with the tool task and restores pending requests after restart. Custom tool extensions use the same gate, including nested calls. No approval UI is implemented yet.

`tools.configure({ jevApiKey })` saves the key; passing `null` removes it, and omitting it leaves it unchanged. `tools.settings()` returns the tool settings object, `{ isJevConfigured, approvalRules }`, and never returns the key. `tools.configure()` returns the updated settings after saving. Application secrets share the encrypted `credentials` table. The native daemon stores the encryption key in `data/credentials.key` with owner-only permissions. Keep that key for recovery; copying the entire data directory also copies the ability to decrypt the database. Pi's provider authentication remains in Pi's own store.

Rules use `{ when, behavior: 'allow' | 'ask' }`. `tools.configure({ approvalRules })` replaces the list; `[]` clears it, and omission preserves it. Rules are non-secret owner settings in the shared `settings` table; the Jev key remains encrypted in `credentials`. Up to 50 rules of 300 characters are accepted.

Auto sends the owner rules and tool context in one Jev request. Approval needs a safe score of at least 0.9 and an ask-first score at most 0.1. Matching ask-first rules take priority over allow rules; ambiguity and failures request human approval. Explicit allow rules can cover email or other external actions. Natural-language matching is model-based, not a deterministic security guarantee. Trusted read-only tools skip this evaluation. Ask and Read-only modes cannot be overridden by allow rules. Changes to rules, bot instructions, permission mode, or removal of the Jev key are checked after the answer arrives.

## Provider authentication

The daemon uses Pi's `ModelRuntime.create()`, which loads saved provider credentials from `auth.json` and custom model configuration from `models.json` in Pi's agent directory (default `~/.pi/agent`). Existing Pi logins are reused; Pi handles file locking and OAuth refresh. Sign in through Pi's `/login` command if needed. Openbots does not currently expose its own login UI.

Set `PI_CODING_AGENT_DIR` for both Pi and the daemon to use a separate auth/config directory, including for development versus production. Run them as the same OS user to share the default directory. Pi authentication uses its existing location. Skills are loaded directly from their source directories, including existing symlinks; MCP configuration discovery and stdio/Streamable HTTP connections are available; MCP OAuth remains pending. Pi's auth file is sensitive and is not encrypted by this integration.

This loads provider configuration, not CLI sessions, tools, extensions, or `settings.json`. Durable still stores conversations, tasks, and recovery state in `OPENBOTS_DATA_DIR/data/runtime.sql`. Authentication is shared; each bot selects its own model through its database settings.

## Device pairing

Each daemon has one owner. There is no local pair CLI. Existing paired devices issue a pairing payload through authenticated `pairing.create`. A first unpaired client cannot issue a public grant; initial local UI/bootstrap integration is pending.

| RPC call | Access | Result |
| --- | --- | --- |
| `pairing.redeem({ token, name })` | Pairing token | Device metadata and a new device token |
| `pairing.create({ serverUrl })` | Device bearer token | Five-minute token, expiry, and `qr: { payload, svg }` |
| `pairing.status({ token })` | Device bearer token | Grant expiry, issuer, and `claimedAt` (Unix milliseconds, or `null` while unclaimed) |
| `devices.list()` | Device bearer token | Paired device IDs, names, and creation times |
| `devices.revoke({ id })` | Device bearer token | Revokes that device and its unused pairing grants; may revoke itself |

Send device credentials as `Authorization: Bearer <device-token>`. They remain valid until revoked. The database stores SHA-256 hashes of random 256-bit tokens; plaintext credentials are returned only when issued. Losing a redemption response requires a new pairing token. All paired devices have the same owner access.

Claimed grants retain their timestamp after expiry. Unclaimed expired grants are removed when a new grant is issued. Revoking the issuing device removes its grant records, including claim timestamps; this is pairing status, not a permanent audit log.

The pairing API renders `qr.svg` for immediate display. `qr.payload` is the exact encoded JSON string: `{ version: 1, serverUrl, token, expiresAt }`. Clients can also render that string themselves. Supply the address the new device can reach; the API normalizes the HTTP(S) origin and rejects credentials, paths, query strings, fragments, and local bind/loopback addresses. Scanning requires the app's future QR reader; this is not an app deep link.

Use HTTPS or the encrypted Tailscale path for remote pairing and requests. The native listener does not terminate TLS. No cookies or query-string tokens are accepted; foreign browser origins are rejected. QR scanning, desktop/mobile credential storage, browser UI integration, and throttling remain pending. See the [pairing plan](.agents/plans/main/05-auth-and-pairing.md).

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

App SQL owns settings. A Pi session document keyed by bot ID owns the stable conversation ID; mapping creation and Pi agent configuration share one commit. Updates do not replace the conversation or history. SQL saves first. Configuration then prepares the directory, skills, instructions, plugins, and MCP outside that transaction. Same-bot configuration is serialized in memory; after preparation it rereads the bot row and all four domain settings and retries if the values that affect Pi config changed. Startup restores every bot before resuming work; submission also reapplies settings. A Pi synchronization failure can leave a saved bot/configuration pending reconciliation. List bots before retrying creation after an error, since handles are unique. Empty working folders from failed operations are not automatically deleted.

The earlier root conversation is retained but no longer exposed by these bot-scoped endpoints. Bot deletion and the sidebar UI remain separate work. The sidebar list API is described below.

## Sidebar list

```ts
const chats = await client.conversation.list();
// Each row also includes isPinned, hasUnread, and readThroughEntryId.
```

This authenticated query lists pinned main chats first, then newest message first within each group, with a stable bot-ID tie-break. `lastMessage` is null for an empty chat; otherwise it contains `entryId`, `role`, a plain-text `preview` of at most 160 characters, and `createdAt` from Pi's message timestamp. Names and avatars come from current bot settings. Private contexts and subagents remain details of their originating chat.

Runtime maintains a small session-scoped Pi summary document from committed user and assistant text. Tool output, thinking, reset/compaction entries, and private routing inputs do not replace the preview. Native task-graph state supplies `isRunning` for ordinary work in the main conversation; idle background anchors do not keep it busy. List calls read the summary and task graph, never transcripts or full conversation views.

Summary updates follow transcript commits. Startup repairs the index from bounded Pi history pages before resuming execution; reconfiguring an already indexed bot does not rescan it. The index is derived state, not another message log. `conversation.list` returns a snapshot. For live updates, use the client helper:

```ts
import { watchConversations } from '@openbots/client/client';

for await (const chats of watchConversations(client, signal)) {
  // Render main chats; open history only when a chat is selected.
}
```

`conversation.watchList()` sends an initial list and Chord updates over authenticated oRPC. Runtime watches the summary document and task graph; server joins current bot settings and observes bot changes. Previews, ordering, running status, names, and avatars update without reading histories. Slow clients receive updates relative to their last delivered state; reconnect starts with a fresh list. Cancellation stops observation, and device revocation closes idle streams too. Pins and read positions belong to the single owner and sync across paired devices through this same subscription:

```ts
await client.conversation.setPinned({ botId, isPinned: true });
await client.conversation.markRead({ botId, throughEntryId: lastVisibleEntry.id });
```

Pass the last saved entry the user actually viewed. An older request cannot move the read position backwards or clear a later reply. Entries from another chat and unknown IDs are rejected. `hasUnread` means a saved assistant text reply exists after `readThroughEntryId`; owner messages, tool output, thinking, and private routing entries do not create unread state. Opening a subscription does not mark anything read. Both actions return `{ isPinned, readThroughEntryId, hasUnread }`. Use `isPinned: false` to unpin; neither action is automatically retried.

These values stay in Pi's summary document. Pi's document migration preserves existing summaries; startup repairs the latest assistant entry alongside the preview and preserves pins/read positions. Existing replies start unread until marked read. The sidebar UI remains separate work.

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

MCP source order is Pi's global `mcp.json`, `~/.agents/mcp.json`, configured MCP paths, bot `.agents/mcp.json`, then bot `.pi/mcp.json`. Shared sources require the bot's `mcp` inheritance flag. Each configured path may be a file or directory. Directories recursively scan `mcp.json` and `*.mcp.json`, skip `.git` and `node_modules`, follow symlinks without cycles, and sort resolved file paths. Later definitions replace the whole same-named entry. A malformed server override removes the earlier same-named entry and adds a diagnostic. Whole-file failures add diagnostics; the returned catalog can be partial.

Use the standard `{ "mcpServers": { "name": { ... } } }` JSON shape. Discovery recognizes stdio commands and HTTP URLs, plus `enabled: false` or `disabled: true` on a complete definition. Stdio accepts `args`, `env`, and `cwd` (relative to the bot directory by default); Streamable HTTP accepts `headers`. Values are literal: shell substitutions and environment interpolation are not supported. `paths: []` clears additional sources, and omitted settings remain unchanged. MCP OAuth, credential-store references, and composer rendering remain pending.

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
| `ask_bot({ botId, message, context? })` | Wait for a peer's answer. A busy recipient is rejected; use `message_bot` to queue work. |
| `message_bot({ botId, message, context? })` | Accept background delivery; the reply returns as follow-up input in the sender's conversation. |
| `subagent({ operation: 'run', message })` | Run a task-owned child and return its answer. |
| `subagent({ operation: 'spawn', name, message })` | Start a named background child and report its answer later. |
| `subagent({ operation: 'send', name, message, whenBusy? })` | Send to an existing background child; default placement is `steer`. |
| `subagent({ operation: 'status', name? })` | Read named background child state. |
| `subagent_stop({ name })` | Stop a background child's current work; keep its context for later messages. |

`context` accepts `existing` (the default) or `temporary`. Temporary contexts reuse the recipient’s configuration, skills, permissions, and working directory, without copying its transcript. New admissions refresh that configuration from the main conversation. Context isolation does not isolate files or tools.

A temporary context lasts 48 hours from creation. The next temporary delivery after expiry archives the old context and creates a fresh one in the same Pi transaction as delivery admission. Existing deliveries remain attached to their original context and can finish; history stays readable. This is lazy rotation, with no background cleanup timer or hard deletion. Default-mode messages never create or rotate temporary contexts. Tool details include `recipientConversationId`, which clients can open with the recipient’s `botId`.

Peer delivery uses native Pi tasks, checkpoints, and stable submission IDs. Self-delivery and delegation triggered by peer requests/reports are denied. Each source conversation admits at most eight pending deliveries. Recipient conversations serialize their own turns. Stopping the sender does not stop the independent recipient or accepted background delivery. This is a local peer tool surface, not a separate DM UI or cross-daemon bridge.

Subagents follow Pi's foreground and background examples. They copy the parent's agent configuration and bot identity at creation, so approvals use the owning bot's current permission policy. Children cannot spawn further children or contact peers. A conversation has at most eight named background children and eight pending background reports. Names persist for reuse; removing them is not implemented. Foreground children stop with their owner task; background children survive parent stop. All tools still pass through the permission hook, including delegation tools.

Tool details expose child `conversationId`. Pass it alongside `botId` to the existing conversation watch/history/submit/stop or command calls to select that child. Omitting it selects the bot's main conversation. A mismatched bot/conversation pair is rejected. `tools.pending({ botId })` includes approvals from both main and child conversations; no additional approval table or queue is used.

## Live conversation

`conversation.watch({ botId })` streams only Pi's `LiveDoc`, the conversation ID, and the latest saved entry ID. It never mounts the full transcript. The wire carries an initial snapshot followed by compact Chord operations. `watchConversation` loads the newest 50 stored entries, then fetches new entries in bounded pages as the saved entry ID advances. Its view contains `entries` in chronological order, `live`, and `historyCursor` for loading older pages:

```typescript
import { watchConversation } from '@openbots/client/client';

const controller = new AbortController();
for await (const view of watchConversation(client, { botId }, controller.signal)) {
  render(view);
}
```

Call `controller.abort()` when leaving the view. Disconnecting or cancelling stops observation, not the agent. oRPC reconnects interrupted watch calls and receives fresh live state and the current entry ID. The client catches up from its last loaded entry; interrupted history reads can retry, while commands and submissions are never automatically retried. Revoking a device ends its subscriptions even while idle. Pi's document watch and Chord's state subscriptions bound pending updates; skipped intermediate updates still carry the latest entry ID for history catch-up.

To scroll back, call `conversation.history({ botId, conversationId, cursor: view.historyCursor, limit: 50 })` and continue with the returned `next` cursor. These pages are newest-first; reverse each page for chronological display. Private contexts and subagents load only when explicitly selected by conversation ID. They are details within the originating chat, not extra top-level sidebar chats.

All paired devices have owner access to the selected bot's view. Peer messages default to existing bot conversations; the sidebar UI and file APIs remain pending. Group rooms are excluded. Earlier disposable WebSocket checks verified the single-root transport before bot routing was added. Disposable bot integration checks cover tool approvals and SQLite recovery; live providers remain unverified.

## Submit and stop

The authenticated client exposes Pi's existing submission and abort behavior:

```typescript
const request = { botId, requestId: crypto.randomUUID(), content: 'Hello', whenBusy: 'followUp' as const };
const { submissionId } = await client.conversation.submit(request);
// If the response is lost, retry the same request ID; Pi returns the same submission.
const retried = await client.conversation.submit(request);
await client.conversation.stop({ botId });
```

Submit requires a bot UUID, nonempty text, and a request ID of 1–128 characters. Request IDs are scoped to that bot's Pi conversation. The returned numeric `submissionId` acknowledges durable admission, not a completed answer; observe the conversation for progress. Pi defaults to `followUp` when busy. `steer` queues input for a steering boundary; `reject` returns `CONFLICT` if busy. Pi treats a reused request ID as the same submission even if its content differs, so use a new ID for new input. Files and image blocks are not accepted by this first contract.

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
