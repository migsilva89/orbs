# Pi Durable: commands and live client examples

Updated: 2026-10-17

## Multiplayer walkthrough

[Official multiplayer walkthrough](https://earendil.com/posts/pi-durable/#multiplayer)

Explains how several clients can watch and steer the same conversation. Each subscriber receives the current view, then subsequent changes. A client that reconnects can start from the current view again.

The walkthrough shows `viewState()` for observing state and `watch()` for obtaining committed operations that an application can send over a socket.

## Late-join example

[Official runnable source: 21-late-join.ts](https://github.com/earendil-works/pi/blob/main/packages/durable/test/examples/21-late-join.ts)

A task starts before two subscribers attach. One uses `viewState()` and the other uses `watchEvents()`. Both receive the running tool's current state and follow later updates, including streamed answer text.

The example uses a fake model and in-memory storage. From `packages/durable` in a prepared Pi source checkout, its documented command is:

```sh
node --conditions=source --experimental-strip-types test/examples/21-late-join.ts
```

## Submit, request IDs, and stop

The installed Pi Durable 1.3.0 API supplies these behaviors directly. The official [persistence example](https://github.com/earendil-works/pi/blob/main/packages/durable/README.md#persist-and-resume) shows durable request-ID deduplication; [busy conversations](https://github.com/earendil-works/pi/blob/main/packages/durable/README.md#busy-conversations) explains follow-up and steering; [abort](https://github.com/earendil-works/pi/blob/main/packages/durable/README.md#abort-and-subagents) defines stop scope.

```typescript
const draft = { type: 'input' as const, content: 'Hello', requestId: 'greeting-1' };
const first = await conversation.submit(draft, context);
const retry = await conversation.submit(draft, context);
// retry.id === first.id, including after reopening the same storage.
await conversation.submit({ ...draft, requestId: 'steer-1', whenBusy: 'steer' }, context);
await conversation.abort(context);
```

`submit()` returns after durable admission, not after the answer. `whenBusy` accepts `followUp` (default), `steer`, or `reject`; rejection throws `ConversationBusy`. A reused request ID returns the existing submission, not a new answer. `abort()` withdraws queued inputs and waits for ordinary owned work to stop; background-task boundaries remain intact unless explicitly included.

Openbots exposes these through authenticated `conversation.submit` and `conversation.stop`, both requiring `botId`. Each bot owns one persistent conversation, so request-ID deduplication and stop scope remain bot-local. The runtime keeps Pi handles internal and maps busy rejection to `CONFLICT`; the wire acknowledgement contains the numeric submission ID. Commands use the runtime's background context instead of the request's cancellation signal. File/image input remains separate work; authenticated history now uses Pi entry pages.

## Provider authentication and storage

The daemon creates `ModelRuntime` from `@earendil-works/pi-coding-agent` and passes it to Durable as `models`. It implements Pi's `Models` interface. The portable runtime requires that dependency explicitly instead of creating an empty in-memory registry.

Pi's [credentials example](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/09-api-keys-and-oauth.ts) demonstrates the default runtime and custom auth/model paths. Defaults load `auth.json` and `models.json` from Pi's agent directory; `PI_CODING_AGENT_DIR` selects a separate directory. Existing Pi credentials are reused, with persistence, locking, and OAuth refresh owned by Pi. Existing auth, plugins, and other Pi resources will be symlinked when found; discovery and linking are deferred. No SQL credential adapter is needed for provider authentication.

The native host still owns the locked Durable SQLite store at `OPENBOTS_DATA_DIR/data/runtime.sql`. Loading provider configuration neither changes that path nor creates a coding-agent session. Model selection remains in Durable agent configuration; `ModelRuntime` does not import CLI settings or tools.

## Bot conversation mapping

A session-scoped `openbots.bot-conversation` document family maps each bot UUID to its Pi conversation ID. The runtime creates the mapping and configures an ownerless conversation in one Pi transaction. Reconfiguration preserves the ID and transcript. Bot settings come from app SQL; provider authentication stays shared through `ModelRuntime`.

The server restores all bot configurations before calling `resume()`. Same-bot configuration is serialized in memory. Directory, skill, and MCP preparation run outside SQL. After that work, configuration rereads the bot row and resource settings and retries if the values that affect Pi config changed, then publishes. SQL and Pi do not share a transaction: a failed Pi synchronization leaves SQL settings for startup or the next submission to reconcile. Pi stores only the relative `agents/<botId>` working directory, not a machine-specific path.

`conversation.watch({ botId })` and `watchConversation(client, { botId }, signal)` select a bot view. All paired devices act as the owner. The original root is not deleted or automatically adopted as a bot. Tools and permission enforcement now use Pi CodingTools and hooks; skill inheritance uses Pi’s skill loader. MCP discovery and tool execution are implemented through Pi’s client; OAuth and plugins remain pending.

The initial bot-routing slice had static typecheck/lint validation only. The tool checks below subsequently exercised bot creation/update and recovery. The earlier transport probes predate bot routing; real-provider calls remain unverified.

## Scope and application integration

The runnable example demonstrates subscriptions within one process. A complete two-browser WebSocket demo was not found in the official examples reviewed. The source was read; the example was not run.

For desktop and mobile clients, the daemon can forward Pi Durable updates over WebSockets. Each client applies those updates to its screen and fetches current state after reconnecting. Authentication, network transport, and reconnect handling belong to the application.

Openbots integration verification on 2026-10-17 used its actual Bun listener, typed oRPC client, real WebSockets, disposable stores, and Pi's faux provider. Pairing, two-client state, reconnect, idle revocation, and cancellation passed in 2.27 seconds. Command validation, busy modes, stop, and deduplication across concurrent calls, reconnect, and SQLite reopen passed in 2.16 seconds. Both listeners were closed and disposable stores removed. These are local transport checks, not desktop/mobile, remote TLS, real-provider, or production validation.

[Pi Durable documentation](https://github.com/earendil-works/pi/tree/main/packages/durable)

## History pages

Openbots calls `conversation.entries({ order: 'descending' }, limit, cursor, context)` from the installed Pi Durable 1.3.0 API. It returns `{ items, next? }`, where `items` are immutable transcript entries and `next` is backend-owned continuation state. The API is documented in [Pi’s pinned types](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/src/types.ts).

The RPC accepts `{ botId, limit?, cursor? }`, validates a limit of 1–100, and reads only the selected bot’s conversation. Invalid Pi cursors become validation errors. Disposable in-memory RPC checks verified exact entry round-tripping, descending pages without gaps or duplicates, bot isolation, rejected malformed cursors, and unauthorized/revoked access. These checks did not exercise SQLite reopen or a live listener.

## Tool execution and approvals

Follow the pinned official [coding-tools example](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/17-coding-tools.ts), [coding-agent environment example](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/26-coding-agent.ts), and [read-only selection example](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/27-plan-mode.ts).

Openbots installs `CodingTools` and a final `ToolTask.beforeTool` hook. The host supplies `NodeExecutionEnv` rooted at the data directory. Server policy returns allow, deny, or ask. Read-only trust is checked against Pi’s resolved tool registration, not its name; replacement and wrapped tools need an explicit declaration. Conversation context is loaded only when a configured Auto judge needs it. Ask creates a task-scoped `openbots.tool-approval` document; Pi's `watchDoc` waits for a decision and its task graph supplies the pending list. The document preserves the deadline across reopen. The host timer only enforces that deadline while running. No SQL approval copy is needed.

Custom tools use the same Pi registry and permission hook:

```ts
const botTools = defineExtension({
  name: 'bot-tools',
  tools: [myBotTool], // A Pi defineTool definition with injected product capabilities.
});
const services = await makeServices({
  ...hostDependencies,
  runtime: {
    ...hostDependencies.runtime,
    toolExtensions: [botTools],
  },
});
```

Do not import server code into runtime tool implementations. Inject capabilities through the service composer. A tool that delegates to another tool uses `api.executeTool` so the nested call also crosses the permission hook. Tool extensions are trusted host code; filesystem plugin discovery is not implemented. Preserve Pi's replay policy: approval does not make an external side effect exactly-once.

Disposable checks with Pi's faux provider verified allow/deny, repeated-answer rejection, Auto falling back to Ask without a key, cancellation, read-only selection, Full mode, and custom/nested calls through the gate. A native SQLite reopen retained the pending task ID and deadline before approval. These checks made no live model or Jev calls and started no dev server. Application secrets were checked for encrypted database values, decryption, and reuse of the native key after reopening it.

## MCP tools

The native adapter follows the [Pi MCP client example](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/mcp/README.md): connect with `McpClient`, call `listTools`, forward `callTool` with its abort signal, convert results with `toLlmContent`, then close the client. It registers the results as Durable `defineTool` definitions in a bot-specific extension. Pi’s registry supports replacing an installed extension by name; the Openbots permission hook stays last.

Disposable checks exercised an actual stdio subprocess and a faux model through the app services: Ask blocked calls, Read-only rejected a remote read-only hint, approval state survived SQLite reopen, stop sent MCP cancellation, changed/disabled config retired connections, and shutdown removed the child processes. Streamable HTTP was checked with an injected fetch implementation, including pagination, headers, concurrent connection reuse, error results, sanitized failures, and session cleanup. No production server or live model was contacted.
