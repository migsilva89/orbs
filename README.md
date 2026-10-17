# Openbots

A Bun/Turbo bot backend with a native daemon, device pairing, bot configuration, and authenticated submit, stop, and live views of persistent per-bot Pi Durable conversations. Pi supplies shared provider authentication. Desktop, mobile, private bot-to-bot DMs, file APIs, and a provider-login UI are not implemented yet.

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

Startup and pairing create missing root, data, and agents directories with private permissions and check read/write/traverse access before opening a database. A path occupied by a file or an inaccessible directory stops the command with a filesystem error. Database opens still report file-level errors; the directory check cannot guarantee a later write succeeds.

Startup opens `data/runtime.sql` with a single-process lock, opens and migrates `data/app.sqlite`, creates Pi's model runtime, then restores each bot's Pi conversation and settings before calling `resume()`. Shutdown closes the listener, Harness, app database, and storage lock. Pairing uses the same application database path. Use a separate data directory per independent daemon. Existing databases are not moved or renamed automatically.

The app database uses `node:sqlite` through Kysely, adapted from Orbs. WAL and foreign keys are enabled. Kysely tracks the [SQL migrations](packages/server/src/services/database/migrations/0001_pairing.sql); the first migration creates devices and temporary pairing grants. Further migrations add bots and their avatar, permission, and inheritance preferences. Migration `0005_credentials` adds the shared encrypted key/value store for application secrets. Provider credentials use Pi's auth files, not app tables. Pi Durable remains the owner of conversation history.

The daemon initializes native logging at startup. Startup, runtime, and shutdown failures are logged and set a nonzero exit code.

The internal server service supports submit, watch, history, and stop through Pi Durable 1.3.0. The daemon injects Pi's `ModelRuntime` for providers and authentication. Pi’s built-in `read`, `write`, `edit`, and `bash` tools are installed; no fake provider is installed in application code. Bot settings select the model, thinking level, and instructions for each conversation.

## Tools and approvals

Bots use Pi Durable's `read`, `write`, `edit`, and `bash` tools in their working folder. Read-only offers only declared read tools. Ask waits for approval on other calls. Auto uses Jev and falls back to Ask when its key is absent or its decision is uncertain. Full permits calls without approval. Commands run as the daemon's OS user; the working directory is not a sandbox.

Authenticated clients use `tools.pending({ botId })` and `tools.answer({ botId, id, approved })`. Requests expire after five minutes. Pi stores their state with the tool task and restores pending requests after restart. Custom tool extensions use the same gate, including nested calls. No approval UI is implemented yet.

`tools.configure({ jevApiKey })` saves the key; passing `null` removes it, and omitting it leaves it unchanged. `tools.settings()` returns the tool settings object, `{ isJevConfigured, approvalRules }`, and never returns the key. `tools.configure()` returns the updated settings after saving. Application secrets share the encrypted `credentials` table. The native daemon stores the encryption key in `data/credentials.key` with owner-only permissions. Keep that key for recovery; copying the entire data directory also copies the ability to decrypt the database. Pi's provider authentication remains in Pi's own store.

Rules use `{ when, behavior: 'allow' | 'ask' }`. `tools.configure({ approvalRules })` replaces the list; `[]` clears it, and omission preserves it. Rules are non-secret owner settings in the shared `settings` table; the Jev key remains encrypted in `credentials`. Up to 50 rules of 300 characters are accepted.

Auto sends the owner rules and tool context in one Jev request. Approval needs a safe score of at least 0.9 and an ask-first score at most 0.1. Matching ask-first rules take priority over allow rules; ambiguity and failures request human approval. Explicit allow rules can cover email or other external actions. Natural-language matching is model-based, not a deterministic security guarantee. Trusted read-only tools skip this evaluation. Ask and Read-only modes cannot be overridden by allow rules. Changes to rules, bot instructions, permission mode, or removal of the Jev key are checked after the answer arrives.

## Provider authentication

The daemon uses Pi's `ModelRuntime.create()`, which loads saved provider credentials from `auth.json` and custom model configuration from `models.json` in Pi's agent directory (default `~/.pi/agent`). Existing Pi logins are reused; Pi handles file locking and OAuth refresh. Sign in through Pi's `/login` command if needed. Openbots does not currently expose its own login UI.

Set `PI_CODING_AGENT_DIR` for both Pi and the daemon to use a separate auth/config directory, including for development versus production. Run them as the same OS user to share the default directory. Pi authentication uses its existing location. Skills are loaded directly from their source directories, including existing symlinks; MCP configuration discovery is available; MCP connections and plugin loading remain pending. Pi's auth file is sensitive and is not encrypted by this integration.

This loads provider configuration, not CLI sessions, tools, extensions, or `settings.json`. Durable still stores conversations, tasks, and recovery state in `OPENBOTS_DATA_DIR/data/runtime.sql`. Authentication is shared; each bot selects its own model through its database settings.

## Device pairing

Each daemon has one owner. Run this command on the daemon host, with the same `OPENBOTS_DATA_DIR` and working directory as the daemon:

```sh
bun run --cwd apps/daemon pair
```

It prints a single-use pairing token and its expiry time. The token lasts five minutes. This command works while the daemon is running and also recovers access when all device credentials are lost. It opens only the app database, without starting a listener or Pi runtime.

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

An unpaired client omits the credential getter and redeems the token from the QR or local command:

```typescript
const client = makeClient({
  connect: () => new WebSocket('wss://daemon.example/rpc'),
});
const paired = await client.pairing.redeem({ token: pairingToken, name: deviceName });
```

Store `paired.token` securely, then supply it through the credential getter for authenticated calls. Grant creation and redemption are never retried automatically.

The calling app supplies the socket factory and secure credential storage. It must retain and close its sockets when leaving a daemon. The credential getter runs per call; oRPC sends it in that call's headers, not the URL. Server middleware checks the database each time, so revocation rejects subsequent calls on the same socket.

## Bots

Authenticated RPC calls provide `bots.list()`, `bots.get({ botId })`, `bots.create(...)`, `bots.update({ botId, ...changes })`, and `bots.models()`. The model catalog returns only provider/model IDs, names, and supported thinking levels, not credentials. A listed model still needs working provider authentication to answer.

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

Bots store name, unique handle, instructions, provider/model, thinking level, avatar, permission, and resource-inheritance preferences. Avatars support blobs, small inline WebP images, colors, and emoji. All RPC inputs remain subject to the listener's 1 MiB payload limit. The default permission is `ask`; inheritance defaults to skills, MCP, and plugins. Permission modes are enforced through Pi tool selection and hooks. Skill inheritance is loaded; MCP, plugins, and instruction-file inheritance remain pending. A working folder is not a sandbox.

The native host creates and validates `agents/<botId>/` before a create/update transaction commits and when restoring bots. Absolute paths are not stored in bot rows. Pi records the relative `agents/<botId>` working directory; the native execution environment resolves it against the data root.

App SQL owns settings. A Pi session document keyed by bot ID owns the stable conversation ID; mapping creation and Pi agent configuration share one commit. Updates do not replace the conversation or history. SQL saves first, then the server reapplies the latest committed settings while holding an app transaction to serialize competing updates. Startup restores every bot before resuming work; submission also reapplies settings. A Pi synchronization failure can leave a saved bot/configuration pending reconciliation. List bots before retrying creation after an error, since handles are unique. Empty working folders from failed operations are not automatically deleted.

The earlier root conversation is retained but no longer exposed by these bot-scoped endpoints. Bot deletion and private DMs remain separate work.

## Resource settings and discovery

Generic non-secret settings use the shared `settings` key/value table. Resource directories use `resources.skillDirs`; tool rules use `tools.approvalRules`. Secrets stay in encrypted `credentials`.

```typescript
await client.resources.configure({
  skillDirs: ['~/.agents/skills', '~/shared-skills'],
  mcpPaths: ['~/mcp.json', '~/mcp-configs'],
});
const settings = await client.resources.settings();
const { skills, mcp } = await client.resources.discover({ botId });
// Each skill: name, description, filePath, isModelInvocable.
```

Discovery returns the bot's current catalog for the composer, including manual-only skills. It uses the same Pi loader as runtime configuration. It does not run a model or install anything. Composer rendering and explicit skill invocation are not implemented yet.

Bot `.pi/skills` and `.agents/skills` take priority over configured directories, followed by Pi's global skills directory. The first matching skill name wins. Pi scans nested directories and deduplicates files reached through symlinks. Configured relative paths resolve against `OPENBOTS_DATA_DIR`; `~` expands to the daemon user's home. Shared directories default to `['~/.agents/skills']`; `PI_CODING_AGENT_DIR` selects Pi's global directory.

Removing `skills` from a bot's inheritance disables shared and Pi-global sources but keeps bot-local skills. `skillDirs: []` clears the additional directory list; omitted fields stay unchanged. Discovery rescans on request. Runtime refreshes on startup, bot configuration, and submission; existing turns retain their current prompt. Pi adds skill descriptions and paths to the prompt, then reads full instructions on demand.

MCP discovery returns `mcp.servers` and `mcp.diagnostics`. Servers include name, description, source file, transport, and `isEnabled`; commands, arguments, URLs, environment values, and headers are excluded. Discovery reads files only: it does not connect, execute commands, resolve secrets, or list remote tools.

MCP source order is Pi's global `mcp.json`, `~/.agents/mcp.json`, configured `mcpPaths`, bot `.agents/mcp.json`, then bot `.pi/mcp.json`. Shared sources require the bot's `mcp` inheritance flag. Each configured path may be a file or directory. Directories recursively scan `mcp.json` and `*.mcp.json`, skip `.git` and `node_modules`, follow symlinks without cycles, and sort resolved file paths. Later definitions replace the whole same-named entry. A malformed server override removes the earlier same-named entry and adds a diagnostic. Whole-file failures add diagnostics; the returned catalog can be partial.

Use the standard `{ "mcpServers": { "name": { ... } } }` JSON shape. Discovery recognizes stdio commands and HTTP URLs, plus `enabled: false` or `disabled: true` on a complete definition. It validates metadata only; connection settings need transport validation before execution. `mcpPaths: []` clears additional sources, and omitted settings remain unchanged. Connection lifecycle, remote tool discovery/execution, OAuth, plugin loading, and composer rendering remain pending.

## Live conversation

`conversation.watch({ botId })` streams that bot's conversation using [Pi's watch pattern](.agents/docs/pi-durable.md): an initial replacement snapshot, then committed Chord operations. The client helper applies those operations and yields the current view:

```typescript
import { watchConversation } from '@openbots/client/client';

const controller = new AbortController();
for await (const view of watchConversation(client, { botId }, controller.signal)) {
  render(view);
}
```

Call `controller.abort()` when leaving the view. Disconnecting or cancelling stops observation, not the agent. oRPC reconnects interrupted watch calls and receives a fresh snapshot; it does not retry authentication failures or replay submitted messages. Revoking a device ends its subscriptions even while idle. Pi handles slow watchers with bounded pending frames and replacement snapshots.

All paired devices have owner access to the selected bot's view. Bot-to-bot DMs and files remain pending; group rooms are excluded. Earlier disposable WebSocket checks verified the single-root transport before bot routing was added. The current bot integration has static validation only; no new live-provider or recovery probes were run.

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
