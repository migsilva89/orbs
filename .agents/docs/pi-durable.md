# Pi Durable: commands and live client examples

Updated: 2026-10-18

## Multiplayer walkthrough

[Official multiplayer walkthrough](https://earendil.com/posts/pi-durable/#multiplayer)

Explains how several clients can watch and steer the same conversation. Each subscriber receives the current view, then subsequent changes. A client that reconnects can start from the current view again.

The walkthrough shows `viewState()` for observing state and `watch()` for obtaining committed operations that an application can send over a socket.

## Paginated history and live state

The implemented chat watch uses Pi's smaller primitives instead of mounting `conversation.watch()`:

- [09-context.ts](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/09-context.ts) reads stored history with `conversation.entries(query, limit, cursor, context)`.
- [16-real-model.ts](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/16-real-model.ts) streams generation through `harness.watchDoc(LiveDoc, conversation.id, context)`.

Runtime subscribes to Pi commits before reading the newest entry, retaining the highest entry ID seen during attachment. It combines that marker with the live document in a bounded Chord state subscription. Server serializes compact operations between delivered states, so skipped intermediate states remain safe for slow clients. No transcript entries travel in the watch.

The client loads the newest 50 entries at the advertised entry ID. Subsequent markers fetch ascending pages after its last loaded ID, bounded by the new marker. Reconnect uses the same catch-up path. Older history uses Pi's returned cursor; private contexts are selected explicitly and never loaded with the main chat.

Disposable checks on 2026-10-18 exercised native SQLite and the authenticated in-process RPC router: initial/older pages, a write during attachment, two clients, catch-up across multiple pages, more than 100 queued changes, lazy private-context loading, Pi generation with a faux provider, reopen, reconnect deduplication, and revocation. Storage instrumentation confirmed bounded entry reads and no private transcript reads before selection. No live provider or network listener was used.

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

## Native slash commands

Openbots exposes `commands.list({ botId })` and `commands.execute({ botId, name, arguments? })`. Runtime translates `compact` to `conversation.compact(arguments, context)` and `reset` to `conversation.reset(arguments, context)`, following Pi's [reset and handoff](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/README.md#reset-and-handoff) and [compaction](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/README.md#compaction) APIs. Names omit the slash. Success acknowledges admission; Pi owns completion and busy placement. Both preserve stored entries. No CLI session, application task queue or command-specific RPC is added.

Disposable checks on 2026-10-18 used the authenticated in-process oRPC router, native SQLite stores and Pi's faux model. Catalog/dispatch, unknown and malformed requests, access denial, bot isolation, compaction instructions and asynchronous completion, reset handoff/context, busy reset and history preservation across reopen passed. No live provider or network listener was used.

## Provider authentication and storage

The daemon creates `ModelRuntime` from `@earendil-works/pi-coding-agent` and passes it to Durable as `models`. It implements Pi's `Models` interface. The portable runtime requires that dependency explicitly instead of creating an empty in-memory registry.

Pi's [credentials example](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/09-api-keys-and-oauth.ts) demonstrates the default runtime and custom auth/model paths. Defaults load `auth.json` and `models.json` from Pi's agent directory; `PI_CODING_AGENT_DIR` selects a separate directory. Existing Pi credentials are reused, with persistence, locking, and OAuth refresh owned by Pi. Skills load from their configured directories without copying or linking them. MCP configuration discovery stays in server/native; Pi clients and tools stay in runtime/native. Trusted Durable plugin loading lives in runtime/native. No SQL credential adapter is needed for provider authentication.

The native host still owns the locked Durable SQLite store at `OPENBOTS_DATA_DIR/data/runtime.sql`. Loading provider configuration neither changes that path nor creates a coding-agent session. Model selection remains in Durable agent configuration; `ModelRuntime` does not import CLI settings or tools.

## Bot conversation mapping

A session-scoped `openbots.bot-conversation` document family maps each bot UUID to its Pi conversation ID. The runtime creates the mapping and configures an ownerless conversation in one Pi transaction. Reconfiguration preserves the ID and transcript. Bot settings come from app SQL; provider authentication stays shared through `ModelRuntime`.

The server restores all bot configurations before calling `resume()`. Same-bot configuration is serialized in memory. Directory, skill, instruction, plugin, and MCP preparation run outside SQL. After that work, configuration rereads the bot row and relevant domain settings and retries if the values that affect Pi config changed, then publishes. SQL and Pi do not share a transaction: a failed Pi synchronization leaves SQL settings for startup or the next submission to reconcile. Pi stores only the relative `agents/<botId>` working directory, not a machine-specific path.

`conversation.watch({ botId })` and `watchConversation(client, { botId }, signal)` select a bot view. All paired devices act as the owner. The original root is not deleted or automatically adopted as a bot. Tools and permission enforcement now use Pi CodingTools and hooks. Skill loading lives in `@openbots/runtime/native`; MCP config-file discovery lives in `@openbots/server/native`; MCP clients and tools live in `@openbots/runtime/native`. Server policy selects inheritance. Runtime never imports server. MCP OAuth remains pending.

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

Do not import server code into runtime tool implementations. Inject capabilities through the service composer. A tool that delegates to another tool uses `api.executeTool` so the nested call also crosses the permission hook. Tool extensions are trusted host code; filesystem plugin discovery reads metadata without importing modules; configuration loads trusted Durable extensions. Preserve Pi's replay policy: approval does not make an external side effect exactly-once.

Disposable checks with Pi's faux provider verified allow/deny, repeated-answer rejection, Auto falling back to Ask without a key, cancellation, read-only selection, Full mode, and custom/nested calls through the gate. A native SQLite reopen retained the pending task ID and deadline before approval. These checks made no live model or Jev calls and started no dev server. Application secrets were checked for encrypted database values, decryption, and reuse of the native key after reopening it.

## MCP tools

`@openbots/runtime/native` follows the [Pi MCP client example](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/mcp/README.md): connect with `McpClient`, call `listTools`, forward `callTool` with its abort signal, convert results with `toLlmContent`, then close the client. The daemon constructs MCP clients from `@openbots/runtime/native` and the MCP domain service from `@openbots/server/native`. The server reads settings and configuration files; runtime clients receive parsed configuration and own connections. Tools register as Durable `defineTool` definitions in a bot-specific extension. Pi’s registry supports replacing an installed extension by name; the Openbots permission hook stays last.

Disposable checks exercised an actual stdio subprocess and a faux model through the app services: Ask blocked calls, Read-only rejected a remote read-only hint, approval state survived SQLite reopen, stop sent MCP cancellation, changed/disabled config retired connections, and shutdown removed the child processes. Streamable HTTP was checked with an injected fetch implementation, including pagination, headers, concurrent connection reuse, error results, sanitized failures, and session cleanup. No production server or live model was contacted.

## Instruction files and Durable plugins

The pinned [coding-agent example](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/26-coding-agent.ts) supplies context files to Durable. Pi Coding Agent's `loadProjectContextFiles` always reads the agent directory and every ancestor of the working directory. It has no scoped-source option. Openbots therefore reads only selected files with Pi's filename precedence, then passes their content through `configure({ instructions })`. It does not create a CLI session or copy instruction files.

Durable 1.3.0 has no filesystem plugin loader. The native loader discovers configured modules without evaluation, imports them during bot preparation, and validates them with Pi's registry. Runtime registers their original Durable extensions and selects them with `configure({ extensions })`, with the permission hook last. A registry preflight rejects reserved or conflicting names before changing the active registry. No CLI extension adapter or second task runner is introduced. Source paths, inheritance, trust and restart behavior are documented in README.

Disposable checks on 2026-10-18 passed for scoped instruction precedence/inheritance, exclusion of parent instructions, metadata-only plugin discovery, symlink deduplication, per-bot selection, plugin prompt sections and tool execution, Ask recovery through SQLite reopen, Read-only denial, invalid-module diagnostics, and partial/empty settings writes. Existing stdio MCP recovery/cancellation checks also passed with the new services. These used temporary files and Pi's faux provider, without real model calls or a daemon listener; all fixtures were removed.

## Explicit skills and collaboration

`conversation.submit({ botId, requestId, content, skills? })` expands selected catalog names before native input admission. The runtime uses Pi Coding Agent's public `stripFrontmatter` and follows its skill-command XML shape, including the source directory for relative references. Durable has no skill-command dispatcher. Manual-only skills remain discoverable and explicitly selectable. The resulting user entry persists in Pi history and context; it is not automatically added again on later turns.

Before preparation, runtime checks the existing request with Pi's `tx.submissionByRequest(conversationId, requestId)` in a read-only commit. The server returns that submission ID without reloading skills. Disposable SQLite checks verified retries after file removal and reopen, with no extra model call; new submissions still prepare and validate normally.

The collaboration extension follows the pinned [foreground subagent example](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/22-subagent-foreground.ts) and [background subagent example](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/23-subagent-background.ts). Foreground children belong to the calling tool task. Named background children belong to a background anchor; reporter tasks checkpoint delivery and report phases. Answer text is read with `tx.entry` inside the checkpoint commit: `TaskRuntime.entry` only reads the task's own conversation. Report request IDs use the child conversation and answer entry, so multiple submissions sharing one answer do not publish it twice.

Persistent peers use the same delivery/report pattern and default to their existing ownerless bot conversations. Temporary mode is described below. Server policy checks the named recipient and blocks self-delivery or peer-triggered delegation. `ask_bot` rejects a busy recipient rather than waiting on a mutually blocked bot; `message_bot` queues follow-up input. Task-scoped Pi documents record admission in the same transaction that creates delivery work. No SQL transcript, extra scheduler or process per conversation is introduced.

Child creation copies the app bot identity and skill catalog, retaining the parent's selected extensions except peer/subagent delegation. Existing conversation/command RPCs accept optional `conversationId`; runtime checks the selected conversation's bot identity. Approvals use that same bot policy and appear in `tools.pending` with their child conversation ID. Omitting the ID continues to select the main bot conversation.

Disposable checks on 2026-10-18 used actual service composition, native SQLite and Pi's faux provider. Explicit/manual-only skill selection, unknown-skill rejection, request-ID deduplication, busy peer rejection, one-hop limits, foreground cancellation, named background stop, child access/approval isolation, and background recovery passed. Reopening SQLite preserved pending approvals and delivered one peer input/report and one nonempty child report. No live model, Jev request, network listener or frontend was used for this slice.

## Temporary peer contexts

Peer tools default to the recipient's main conversation. Optional `context: 'temporary'` selects a conversation-scoped Pi document-family member keyed by recipient ID. Each sending conversation therefore owns a separate selection even when the sender bot is the same. Server policy supplies the 48-hour lifetime; runtime owns creation and rotation.

Temporary contexts are fresh ownerless conversations, not transcript forks or task-owned subagents. They use the recipient's agent configuration and bot identity. At the first new temporary admission after expiry, one Pi transaction archives the old metadata, selects a fresh context, and creates the delivery task. The task stores the selected ID; recovery and in-flight replies continue using it after rotation. History is retained. There is no timer, SQL conversation table or second queue.

Disposable native SQLite checks on 2026-10-18 verified default reuse, isolation between sending conversations, recipient configuration refresh, 48-hour rotation, retained history, work completing in its original context, and approval identity/recovery after reopen. These used a faux provider, without a listener or live model.

## Main-chat sidebar index

`conversation.list()` reads one session-scoped `openbots.conversation-index` document and Pi's `taskGraph()`. Bot configuration registers only the stable main conversation; temporary peer contexts and subagents are not indexed. Server joins current bot display settings and sorts the rows. The daemon has no sidebar logic.

Pi 1.3.0 exposes neither a sidebar query nor a transactional entry-projection hook. Runtime therefore observes `subscribeCommits()` and admits a derived document update in a microtask after the listener returns, as listeners cannot call Session APIs. A higher entry ID wins when several updates overlap. Summary failure fails list reads and closes live subscriptions instead of silently serving stale data. Closing Pi removes the observer.

Startup rebuilds each main chat's newest eligible preview with `entries()` pages of at most 100, following [09-context.ts](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/09-context.ts). This repairs a crash between a transcript commit and its summary update. It runs once per bot per open runtime, before resume. Normal list calls do not read history, mount a view, or start execution.

Disposable checks on 2026-10-18 used native SQLite, actual runtime and authenticated RPC services, and Pi's faux provider. Stale-index repair, empty chats, bounded restoration, no history reads on repeated lists/reconfiguration, private-context exclusion, current bot labels, preview ordering, running/completed state, rollback, background task scope, SQLite reopen, revoked credentials, and observer cleanup passed. No listener, UI, live provider, or permanent test was added.

`conversation.watchList()` combines native `watchDoc(conversationIndex)` and `watchTaskGraph()` without mounting transcripts. Startup creates the empty index document so an empty daemon can be watched. Server observes bot-setting changes and joins current SQL display fields; neither names nor avatars are copied into Pi. The shared conversation stream adapter diffs each delivered snapshot with Chord, retaining bounded delivery when observers skip revisions. `watchConversations(client, signal)` applies those operations, and reconnect starts from a fresh list.

Disposable in-process checks verified two authenticated clients, creation/rename while watching, preview/order/busy updates, no transcript reads during observation, slow-consumer catch-up after 160 revisions, disconnect without run cancellation, automatic reconnect through actual oRPC WebSocket frames on in-memory sockets, idle revocation, projection failure, and observer cleanup. Existing selected-chat pagination and storage-failure probes also passed. These checks used Pi's faux provider; no UI or live provider was exercised.
