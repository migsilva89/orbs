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

The selected-chat watch also attaches native `InboxDoc` through `watchDoc`. Its `items` carry pending `steer`, `followUp`, and `write` submissions. Runtime forwards the document without a second queue or transcript mount. Each document has Pi's atomic snapshot/subscription acquisition; these are separate document updates, not a promised atomic snapshot across live state, inbox and history. First closure stops both watches and removes the commit listener; acquisition failure releases any handle already opened.

Disposable native SQLite checks exercised actual faux-provider generation with follow-up and steer admission, two observers, withdrawal, reconnect, selected private contexts, and inbox persistence across reopen. Watch attachment performed no writes and read only one tail entry. Client merging preserved inbox updates without extra history reads for an empty transcript. Server-stream revocation, client cancellation, one-document closure, and failures during inbox/tail acquisition released both watches and the commit listener. Disconnecting left accepted work running.

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

Openbots exposes these through authenticated `conversation.submit` and `conversation.stop`, both requiring `botId`. Each bot owns one persistent conversation, so request-ID deduplication and stop scope remain bot-local. The runtime keeps Pi handles internal and maps busy rejection to `CONFLICT`; the wire acknowledgement contains the numeric submission ID. Commands use the runtime's background context instead of the request's cancellation signal. Attachments use host files and Pi metadata; authenticated history uses Pi entry pages.

## Native slash commands

Openbots exposes `commands.list({ botId })` and `commands.execute({ botId, name, arguments? })`. Runtime translates `compact` to `conversation.compact(arguments, context)` and `reset` to `conversation.reset(arguments, context)`, following Pi's [reset and handoff](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/README.md#reset-and-handoff) and [compaction](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/README.md#compaction) APIs. Names omit the slash. Success acknowledges admission; Pi owns completion and busy placement. Both preserve stored entries. No CLI session, application task queue or command-specific RPC is added.

The `cancel` command validates a decimal submission ID and calls native `harness.abortSubmission(id, context, conversation.id)`. Pi checks ownership and queued status in one commit, settles the submission as aborted, and removes its inbox item. The explicit conversation ID prevents cancelling another chat's submission. `already_placed` maps to `CONFLICT`, `not_found` to `NOT_FOUND`, and `aborted`/`settled` to a void acknowledgement. A settled submission is left unchanged, not undone. No read-then-cancel race or new queue is added.

Disposable SQLite and authenticated in-process RPC checks covered cancellation during faux-provider generation, preserving the running turn and other inputs, concurrent repeated cancellation, steers, private contexts, foreign IDs, invalid arguments, live inbox updates, reopen without resuming generation, and actual device revocation. Cancelled input never reached the provider. Frontend controls remain separate work.

## Queue editing and interrupt

`conversation.updateSubmission` changes an owner's queued input through `conversation.commit(tx => tx.doc(InboxDoc, conversation.id))`. Pi has no dedicated edit/promote method. The inbox holds the content and mode; the submission record holds identity and lifecycle. Changing only the pending item's content or mode preserves its ID, request-ID deduplication and position. Pi's next boundary reads the committed value. A missing item returns `NOT_FOUND`; passive writes and other custom entries return `CONFLICT`; owner attachment entries remain editable. No second queue is stored. Server handles selected-skill expansion before the runtime commit. Changing only mode leaves expanded content intact.

`whenBusy: 'interrupt'` keeps the pending inbox while replacing the active run. `Conversation.abort()` cannot do this because it withdraws pending inputs. `abortTask()` plus ordinary `submit()` also cannot guarantee replacement-first admission: the idle admission boundary can place older steers and follow-ups alongside the replacement. Runtime therefore uses public Pi transaction primitives to admit only the replacement after the selected task has stopped. Pi still owns generation, tool execution, boundary placement and recovery. The existing inbox is untouched.

An interrupt retry checks the conversation's request ID before cancellation and before admission. Cancellation follows generation handovers only while they retain the original run's first input ID. An unrelated newer run is left running; admission deduplicates first, then returns `CONFLICT` if that run remains active. No raw entry is appended while the conversation is busy. A failure between stopping and admitting can leave the old run stopped without accepting the new input; admission is acknowledged only after its commit. The caller can retry the same request ID. Interruption does not reverse completed external effects.

Queue verification used disposable native SQLite stores, authenticated in-process RPC and a faux provider. Edits, skill expansion, promotion, cancellation, two live inbox observers, concurrent interrupt deduplication, private-context isolation, device revocation and reopen recovery passed. Separate native Pi probes forced a generation handover, cancelled an active owned tool and verified that an unrelated newer run stays untouched. Full review, root type checks and lint passed. Frontend controls remain pending.

Disposable checks on 2026-10-18 used the authenticated in-process oRPC router, native SQLite stores and Pi's faux model. Catalog/dispatch, unknown and malformed requests, access denial, bot isolation, compaction instructions and asynchronous completion, reset handoff/context, busy reset and history preservation across reopen passed. No live provider or network listener was used.

## Provider authentication and storage

The daemon creates `ModelRuntime` from `@earendil-works/pi-coding-agent` and passes it to Durable as `models`. It implements Pi's `Models` interface. The portable runtime requires that dependency explicitly instead of creating an empty in-memory registry.

Pi's [credentials example](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/09-api-keys-and-oauth.ts) demonstrates the default runtime and custom auth/model paths. Defaults load `auth.json` and `models.json` from Pi's agent directory; `PI_CODING_AGENT_DIR` selects a separate directory. Existing Pi credentials are reused, with persistence, locking, and OAuth refresh owned by Pi. Skills load from their configured directories without copying or linking them. MCP configuration discovery stays in server/native; Pi clients and tools stay in runtime/native. Trusted Durable plugin loading lives in runtime/native. No SQL credential adapter is needed for provider authentication.

The native host owns one Durable SQLite store per bot at `OPENBOTS_DATA_DIR/data/bots/<botId>/runtime.sql`, guarded by `data/daemon.lock`. Loading provider configuration neither changes that path nor creates a coding-agent session. Model selection remains in Durable agent configuration; `ModelRuntime` does not import CLI settings or tools.

Provider login uses native `ModelRuntime.login` with an `AuthInteraction` adapter for remote prompts and events. Login sessions belong to the initiating paired device; answers carry a prompt ID. Cancellation, expiry, revocation and daemon shutdown end pending interactions. Credentials remain in Pi, and read-only status calls do not refresh them.

MCP OAuth uses `McpOAuthProvider`, `authorizeMcp` and `adaptOAuthProvider` from `@earendil-works/pi-mcp/oauth`. Server resolves the selected bot’s configured HTTP MCP target; runtime manages the flow and stores its native OAuth state through the shared encrypted credentials service. Clients open the authorization URL and return the callback URL; Openbots does not start a callback listener.

## Bot conversation mapping

A session-scoped `openbots.bot-conversation` document family maps each bot UUID to its Pi conversation ID. The runtime creates the mapping and configures an ownerless conversation in one Pi transaction. Reconfiguration preserves the ID and transcript. Bot settings come from app SQL; provider authentication stays shared through `ModelRuntime`.

The server restores all bot configurations before calling `resume()`. Same-bot configuration, history clear and delete are serialized in memory. Directory, skill, instruction, plugin, and MCP preparation run outside SQL. After that work, configuration rereads the bot row and relevant domain settings and retries if the values that affect Pi config changed, then publishes. SQL and Pi do not share a transaction: a failed Pi synchronization leaves SQL settings for startup or the next submission to reconcile. Pi stores only the relative `agents/<botId>` working directory, not a machine-specific path.

`conversation.watch({ botId })` and `watchConversation(client, { botId }, signal)` select a bot view. All paired devices act as the owner. The original root is not deleted or automatically adopted as a bot. Tools and permission enforcement now use Pi CodingTools and hooks. Skill loading lives in `@openbots/runtime/native`; MCP config-file discovery lives in `@openbots/server/native`; MCP clients and tools live in `@openbots/runtime/native`. Server policy selects inheritance. Runtime never imports server. MCP OAuth uses the native `pi-mcp/oauth` helpers through the runtime auth service.

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

## Model fallback

Pi Durable 1.3.0 permits changing the configured model between requests. It does not provide automatic backup-model selection: `beforeRequest` changes messages only, `afterResponse` returns no retry decision, and authentication errors are not transient retries. Openbots adapts the injected `Models` interface at `getModel` and `streamSimple`; it does not replace `GenerationTask` or resubmit user inputs.

A bot's optional `fallbackModel` is stored with its primary selection in the persisted agent model reference. The adapter resolves real Pi models and tries one backup on eligible errors before output. Native agent copying carries this reference to private contexts and subagents; recovery resolves it without an in-memory routing registry. The original Models object retains provider authentication and catalog ownership. Deferred handles fetch/cancel through their actual provider/model; polling failures retain native behavior. See README for the error policy and context-capacity rule.

## MCP tools

`@openbots/runtime/native` follows the [Pi MCP client example](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/mcp/README.md): connect with `McpClient`, call `listTools`, forward `callTool` with its abort signal, convert results with `toLlmContent`, then close the client. The daemon constructs MCP clients from `@openbots/runtime/native` and the MCP domain service from `@openbots/server/native`. The server reads settings/configuration files and resolves encrypted `envCredentials`/`headerCredentials` from the app credential store; runtime clients receive prepared configuration and own connections. Discovery checks credential presence without decryption. Tools register as Durable `defineTool` definitions in a bot-specific extension. Pi’s registry supports replacing an installed extension by name; the Openbots permission hook stays last.

MCP registrations use `deferred: true` and Pi's `createToolSearchExtension()` from `@earendil-works/pi-durable/tool-search`. Native `tool_search` returns `control.addTools`; Pi persists the selected schemas in `pi.agent.modelTools`. Configuration leaves that field unchanged. Only the exact native search registration is trusted as a read; MCP calls remain gated, and Read-only excludes them from search. This defers model schemas, not connections. No separate search index or RPC is needed.

Disposable checks exercised an actual stdio subprocess and a faux model through the app services: Ask blocked calls, Read-only rejected a remote read-only hint, approval state survived SQLite reopen, stop sent MCP cancellation, changed/disabled config retired connections, and shutdown removed the child processes. Streamable HTTP was checked with an injected fetch implementation, including pagination, headers, concurrent connection reuse, error results, sanitized failures, and session cleanup. No production server or live model was contacted.

## Instruction files and Durable plugins

The pinned [coding-agent example](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/26-coding-agent.ts) supplies context files to Durable. Pi Coding Agent's `loadProjectContextFiles` always reads the agent directory and every ancestor of the working directory. It has no scoped-source option. Openbots therefore reads only selected files with Pi's filename precedence, then passes their content through `configure({ instructions })`. It does not create a CLI session or copy instruction files.

Durable 1.3.0 has no filesystem plugin loader. The native loader discovers configured modules without evaluation, imports them during bot preparation, and validates them with Pi's registry. Runtime registers their original Durable extensions and selects them with `configure({ extensions })`, with the permission hook last. A registry preflight rejects reserved or conflicting names before changing the active registry. No CLI extension adapter or second task runner is introduced. Source paths, inheritance, trust and restart behavior are documented in README.

Disposable checks on 2026-10-18 passed for scoped instruction precedence/inheritance, exclusion of parent instructions, metadata-only plugin discovery, symlink deduplication, per-bot selection, plugin prompt sections and tool execution, Ask recovery through SQLite reopen, Read-only denial, invalid-module diagnostics, and partial/empty settings writes. Existing stdio MCP recovery/cancellation checks also passed with the new services. These used temporary files and Pi's faux provider, without real model calls or a daemon listener; all fixtures were removed.

## Explicit skills and collaboration

`conversation.submit({ botId, requestId, content, skills? })` expands selected catalog names before native input admission. The runtime uses Pi Coding Agent's public `stripFrontmatter` and follows its skill-command XML shape, including the source directory for relative references. Durable has no skill-command dispatcher. Manual-only skills remain discoverable and explicitly selectable. The resulting user entry persists in Pi history and context; it is not automatically added again on later turns.

Before preparation, runtime checks the existing request with Pi's `tx.submissionByRequest(conversationId, requestId)` in a read-only commit. The server returns that submission ID without reloading skills. Disposable SQLite checks verified retries after file removal and reopen, with no extra model call; new submissions still prepare and validate normally.

The collaboration extension follows the pinned [foreground subagent example](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/22-subagent-foreground.ts) and [background subagent example](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/23-subagent-background.ts). Foreground children belong to the calling tool task. Named background children belong to a background anchor; reporter tasks checkpoint delivery and report phases. Answer text is read with `tx.entry` inside the checkpoint commit: `TaskRuntime.entry` only reads the task's own conversation. Report request IDs use the child conversation and answer entry, so multiple submissions sharing one answer do not publish it twice.

Persistent peers use the same delivery/report pattern and default to their existing ownerless bot conversations. Temporary mode is described below. Server policy checks the named recipient and blocks self-delivery or peer-triggered delegation. `bot_ask` rejects a busy recipient rather than waiting on a mutually blocked bot; `bot_message` queues follow-up input. Task-scoped Pi documents record admission in the same transaction that creates delivery work. No SQL transcript, extra scheduler or process per conversation is introduced.

Child creation copies the app bot identity and skill catalog, retaining the parent's selected extensions except peer/subagent delegation. Existing conversation/command RPCs accept optional `conversationId`; runtime checks the selected conversation's bot identity. Approvals use that same bot policy and appear in `tools.pending` with their child conversation ID. Omitting the ID continues to select the main bot conversation.

Disposable checks on 2026-10-18 used actual service composition, native SQLite and Pi's faux provider. Explicit/manual-only skill selection, unknown-skill rejection, request-ID deduplication, busy peer rejection, one-hop limits, foreground cancellation, named background stop, child access/approval isolation, and background recovery passed. Reopening SQLite preserved pending approvals and delivered one peer input/report and one nonempty child report. No live model, Jev request, network listener or frontend was used for this slice.

## Temporary peer contexts

Peer tools default to the recipient's main conversation. Optional `context: 'temporary'` selects a conversation-scoped Pi document-family member keyed by recipient ID. Each sending conversation therefore owns a separate selection even when the sender bot is the same. Server policy supplies the 48-hour lifetime; runtime owns creation and rotation.

Temporary contexts are fresh ownerless conversations, not transcript forks or task-owned subagents. They use the recipient's agent configuration and bot identity. At the first new temporary admission after expiry, one Pi transaction archives the old metadata, selects a fresh context, and creates the delivery task. The task stores the selected ID; recovery and in-flight replies continue using it after rotation. History is retained. There is no timer, SQL conversation table or second queue.

Disposable native SQLite checks on 2026-10-18 verified default reuse, isolation between sending conversations, recipient configuration refresh, 48-hour rotation, retained history, work completing in its original context, and approval identity/recovery after reopen. These used a faux provider, without a listener or live model.

## Main-chat sidebar index

`conversation.list()` reads one session-scoped `openbots.conversation-index` document and Pi's `taskGraph()`. Bot configuration registers only the stable main conversation; temporary peer contexts and subagents are not indexed. Server joins current bot display settings and sorts the rows. The daemon has no sidebar logic.

Pi 1.3.0 exposes neither a sidebar query nor a transactional entry-projection hook. Runtime therefore observes `subscribeCommits()` and admits a derived document update in a microtask after the listener returns, as listeners cannot call Session APIs. A higher entry ID wins when several updates overlap. A failed summary update is retried with the next commit; the update is idempotent. Closing Pi removes the observer.

Startup rebuilds each main chat's newest eligible preview with `entries()` pages of at most 100, following [09-context.ts](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/09-context.ts). This repairs a crash between a transcript commit and its summary update. It runs once per bot per open runtime, before resume. Normal list calls do not read history, mount a view, or start execution.

Disposable checks on 2026-10-18 used native SQLite, actual runtime and authenticated RPC services, and Pi's faux provider. Stale-index repair, empty chats, bounded restoration, no history reads on repeated lists/reconfiguration, private-context exclusion, current bot labels, preview ordering, running/completed state, rollback, background task scope, SQLite reopen, revoked credentials, and observer cleanup passed. No listener, UI, live provider, or permanent test was added.

`conversation.watchList()` combines native `watchDoc(conversationIndex)` and `watchTaskGraph()` without mounting transcripts. Startup creates the empty index document so an empty daemon can be watched. Server observes bot-setting changes and joins current SQL display fields; neither names nor avatars are copied into Pi. The shared conversation stream adapter diffs each delivered snapshot with Chord, retaining bounded delivery when observers skip revisions. `watchConversations(client, signal)` applies those operations, and reconnect starts from a fresh list.

Disposable in-process checks verified two authenticated clients, creation/rename while watching, preview/order/busy updates, no transcript reads during observation, slow-consumer catch-up after 160 revisions, disconnect without run cancellation, automatic reconnect through actual oRPC WebSocket frames on in-memory sockets, idle revocation, projection failure, and observer cleanup. Existing selected-chat pagination and storage-failure probes also passed. These checks used Pi's faux provider; no UI or live provider was exercised.

## Pins and shared read positions

The session index uses `defineDoc` version 2 with Pi's native `migrate` callback. It preserves version-1 previews and adds `isPinned`, `readThroughEntryId`, and the internal latest assistant-text entry ID. No SQL migration or separate preferences store is needed. This follows the transaction/document model in [01-documents.ts](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/01-documents.ts).

`conversation.markRead({ botId, throughEntryId })` uses `tx.entry()` to check that the saved entry belongs to the main chat, then advances the cursor with `Math.max` inside that same commit. `conversation.setPinned({ botId, isPinned })` edits the same document. Both return the current preferences, and existing `watchDoc` subscriptions publish the change to every paired device. Server sorts pinned chats first; runtime owns document access. Neither action loads a transcript or starts agent execution.

Unread is derived from the latest eligible assistant entry and the read cursor. Preview updates, restoration and read/pin mutations preserve each other's fields. Startup scans bounded pages until it finds the newest assistant text as well as the latest preview, including when newer owner entries follow that reply. Tool-only, thinking-only and private entries remain excluded. An older client acknowledgement cannot clear a later answer. On migration, existing assistant replies start unread because no prior read cursor exists.

Disposable checks on 2026-10-18 passed with native SQLite and authenticated service/RPC calls: version-1 migration, old replies behind multiple history pages, two-device pin/read updates, no history scans during list/watch/actions, delayed and concurrent read requests, foreign/future entry rejection, revoked-device rejection, read-before-summary recovery, restart persistence, and changes during restoration. No model ran and no listener or permanent test was added.

## Lazy context discovery

`conversation.contexts({ botId, conversationId?, kind, limit?, cursor? })` lists metadata for `subagent` or `temporary` contexts of the selected source. Runtime follows the ownership used by [22-subagent-foreground.ts](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/22-subagent-foreground.ts) and the named document used by [23-subagent-background.ts](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/test/examples/23-subagent-background.ts). `tx.scanConversations({ ownerConversationId })` retains finished children that are no longer in the live task graph. The graph supplies current busy flags; the background anchor's completed status is not the child's busy status.

Temporary peer conversations remain ownerless. Pi 1.3.0's conversation query has owner filters but no filter for application document fields. Runtime scans a bounded native conversation page and selects existing `collaborationTemporaryContext` documents with the requested source ID. It does not create an index, change ownership, scan transcripts, or omit archived contexts. Callers must follow Pi's `next` even after an empty filtered page. Each item carries the target bot ID so history/watch uses the recipient's identity, not the sender's.

Disposable checks on 2026-10-18 used native SQLite and the authenticated in-process RPC router: 105 finished children across pages, named background children, active/completed status, temporary reuse and rotation, archived discovery, source isolation, empty child results, invalid cursor/target rejection, device revocation, selected history/watch, and reopen. Storage instrumentation found no transcript reads, storage writes, or task execution during discovery. No listener, live model, UI or permanent test was added.

## Context invalidation and usage

`conversation.watchContexts` observes one source chat without mounting its transcript. Native `subscribeCommits` identifies owned-conversation creation and source-scoped subagent/temporary-context documents; `watchTaskGraph` supplies busy/idle changes. The wire state is only `{ revision }`. No persisted index, custom queue or child-ID cache is added. Task-graph busy IDs are daemon-wide, so another bot can invalidate the selected panel, but no unrelated metadata is sent. Token and checkpoint-only commits do not trigger a refetch.

Clients refetch visible metadata pages on every delivered state, including the initial state after reconnect. Subscription revisions are not replay cursors. `replicatedState` bounds pending callbacks and coalesces overflow; fetching current pages tolerates skipped revisions. Native graph closure releases the commit listener; server revocation and cancellation stop observation without aborting work.

`conversation.usage` reads native `UsageDoc` for the authorized conversation, returning `models` and `tools` ledgers, including native compaction spend. It does not derive costs from history or add a SQL mirror. Each child has its own ledger. Lifetime usage must not be displayed as current context occupancy.

`conversation.contextUsage` reads the selected conversation's `agent()` and committed `context()`. Model capacity comes from `Models.getModel`; a missing catalog model yields `null`. Token estimation uses the public `calculateContextTokens` and `estimateMessageTokens` helpers, following Durable's [head-aware estimate](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/src/harness/compaction.ts). Only assistant usage appended after the latest head marker can describe the current context; older retained messages are estimated again.

This small adaptation is necessary because Durable does not export its context estimator. Pi AI's generic estimator uses timestamps, which can reuse an old measurement when a compaction summary and retained assistant message have equal timestamps. Entry IDs preserve the boundary without a new cache or stored counter. The query reads active context only on request, never during sidebar or live-watch attachment. It does not render prompt hooks, run a model, or estimate uncommitted input and tool changes.

Disposable native SQLite and in-process RPC checks covered empty and unknown-model contexts, measured usage plus trailing estimates, selected private contexts, reset/handoff, compaction with equal timestamps, model changes and reopen. Instrumentation confirmed no query writes or foreign transcript reads. The generic estimator returned 40,102 tokens for a retained pre-compaction measurement where the current-context estimate was six; the entry-boundary implementation returned six.

Disposable SQLite probes verified source metadata invalidation, pre-existing temporary busy/idle transitions, token-only silence, task preservation on cancel, no transcript reads or query writes, and cleanup. In-memory oRPC checks covered authorization, idle revocation, client-helper reconnect and usage isolation. A slow server-stream reader caught up after 140 metadata commits in 40 frames through native coalescing. Usage survived reopen and preserved optional counters and model/tool buckets. No provider calls or live listener were used.

## Attachment integration

Pi Durable 1.3.0 accepts text and inline image blocks, but has no blob store or lazy file input. Openbots stores binary files in server/native and metadata in the conversation-scoped `openbots.attachments` document. Owner input uses `openbots.attachment-message` with file references; native CodingTools read files when needed. Images become model image blocks through the read result, not through copied base64 in the inbox. Pi persists native tool results, which can include image/text contents after a read. PDF extraction is environment/tool dependent.

Use Pi commits for retain/remove/expiry and queued edits. Return plain metadata copies from commits; Chord draft proxies cannot be structured-cloned or returned after their transaction ends. Retaining before submit prevents delete/submit races but is not atomic with admission. Failed or cancelled submissions may keep retained files; cleanup only removes expired unretained metadata and old orphan blobs. This conservative policy preserves historical references.

The daemon mounts oRPC HTTP for file bytes beside the existing WebSocket transport. Server owns access and file policy; runtime owns Pi metadata and input conversion. No SQL message mirror, attachment table, second queue or upload scheduler is introduced. See the README for the contract, limits and pending UI.

Disposable checks used real Pi SQLite metadata, native disk storage, faux-provider text/image reads and real pairing/auth services. The actual daemon fetch handler was exercised in memory, without starting a listener: 10 MiB round-trip, MIME/size rejection, protocol/server pinning, Origin denial and private response headers passed. Native storage checks covered retain/remove races, rollback, expiry/orphan cleanup, filename limits, selected-skill submission, retry deduplication and reopen. No live provider or production store was used.

A separate native SQLite/faux-provider check covered attachment queue edits, replacement/removal, promotion, cancellation, empty-input rejection, interrupt admission before older queued inputs, request-ID deduplication, foreign-chat rejection and queued references after reopen. It also invoked the real collaboration origin query: a peer turn followed by an owner attachment is classified as owner input. The held faux provider honored cancellation, as required for interrupt completion.

## Chat interactions

Quotes use `tx.entry()` to resolve an entry from the authorized conversation. Openbots saves a bounded text snapshot in `openbots.reply-message`, or beside files in `openbots.attachment-message`. The model receives the quote as user context. Queue edits rebuild the entry and model text together in `InboxDoc`; no SQL message mirror is involved.

Pi has no public retry action. The `retry` runtime command checks the latest native generation task, then creates `GenerationTask` and assigns `LiveDoc.run` in one commit, following the installed harness's `startRun` implementation. It resumes against current saved context with `inputs: []`, without another owner entry or changing the original failed submission receipt. A stale task, active run or queued context reset conflicts. Applied reset/compaction is part of current context; retry does not restore earlier context or undo tool side effects.

Owner reactions use a conversation-scoped `defineDocFamily`, keyed by visible entry ID. Add/remove and validation share one commit. Queries read only requested visible entry IDs. The selected watch uses commit notifications for reaction/question invalidation and latest generation status; it still does not mount a transcript. Clients refetch visible interaction data on initial watch state, reconnect and revision changes.

Clarification uses a replay-safe `bot_question` tool and a task-scoped document with question, choices, answer and deadline. `api.watchDoc()` observes answers; `awaitWithContext` ties the wait to native task cancellation. The timer only wakes an open host. Re-execution reads the stored deadline and answer; no process-local waiter registry or SQL question table exists. Answer RPCs use the paired device ID and accept only the first unexpired answer for the selected conversation. Clarification is separate from permission approval.

Sidebar preferences extend the existing session index to version 3 with `isHidden`, `isMuted` and nullable `rank`. Native document migration preserves v1/v2 previews, pins and read cursors. Hide and mute are independent flags. Timed mute and interaction UI remain client/product work. The backend notification watch reads the index mute setting and native task/document state.

Disposable native SQLite/faux-provider checks passed for quote isolation, queued quote edits and clearing, quoted attachment interruption with older queued inputs preserved, idempotent reactions, reaction invalidation, concurrent/stale retries, retry after reset followed by a prepare failure with no assistant tail, and reopen persistence. In-process RPC checks covered contracts, service wiring, device attribution and rejection by auth middleware. Separate v1/v2 migration checks preserved existing sidebar values. No live model, listener or permanent test was added.

The real runtime factory also passed read-only `bot_question` permission identity, concurrent first-answer-wins and live invalidation checks. A native SQLite question run verified free-text tool output, a pending question answered after reopen, cancellation removing pending state, and rejection after cancellation or the saved deadline. Full review included two independent isolation/recovery checks; root TypeScript, lint and cycle checks are required before handoff.

## Routine integration

Routines use a conversation-scoped `openbots.routines` document (`fork: 'initial'`) and a registered `openbots.routine` task. Each task belongs to the bot's main conversation with `background: true`. The extension is installed before `Harness.open` so saved tasks are available on recovery. Bot restore still precedes `resume`.

The phases are `check` → `wait` → `check` → `deliver`. `check` atomically claims an occurrence and freezes its prompt, or checkpoints a deadline. `wait` races native `TaskRuntime.sleep` against a document revision change. A child cancellation context releases the losing timer and the watch; pause/removal/rescheduling do not leave a second scheduler behind. `deliver` submits with a task/occurrence request ID and waits for Pi's receipt, so replay after admission reuses it. Submission is outside the transaction; the persisted claim is the boundary after which controls let that occurrence finish.

Cron/date calculation is the missing library capability. `cron-parser` computes timezone-aware dates without running a timer. Pi owns tasks, documents, cancellation, watches, receipts and recovery. General document revisions wake waits; schedule revisions prevent a completion from overwriting a concurrently rescheduled deadline. Prompt/name edits do not suppress advancement of the completed schedule. Routine queries read metadata only.

Disposable native SQLite/faux-provider checks verified no model calls while waiting, one-shot delivery, pause/resume, rescheduling an existing timer, manual runs while paused, same-routine overlap rejection, bot isolation, deletion before claim, overdue recovery, and reopening during generation with the same submission ID. An abrupt process exit after admission also recovered with the same submission and exactly one user entry. Calendar checks covered a daylight-saving transition, named weekdays, invalid cron and invalid timezones. A separate actual core-composition/in-process RPC check covered auth, contracts, bot configuration, controls, native completion, and absence of SQL routine/job tables. Further checks verified that chat stop preserves the background routine, a completion preserves a concurrent schedule edit, and removing a claimed routine lets its accepted answer finish. These probes use no live provider or listener. The routine UI remains pending.

Routine tools use native `defineTool` registrations, with schemas derived once from the public contracts. The runtime binds the caller's Pi bot identity to its main conversation and calls the existing routine service. Only the exact `bot_routine_list` registration enters the trusted-read set. Permission hooks are installed after the tool extension. Mutations are replay-unsafe, following Pi's documented interrupted-tool behavior; they do not introduce a second receipt or transaction log. `bot_routine_run` returns after requesting delivery and never waits for a future turn of the calling conversation.

## Todo integration

Todos use a conversation-scoped `openbots.todos` document (`fork: 'initial'`) on the bot's main conversation: `{ nextId, todos }` with small numeric IDs the model can quote. No SQL table or task is needed. The `openbots.todos` extension adds a `todos` system prompt [section](https://github.com/earendil-works/pi/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/durable/README.md#system-prompt) that reads the document through `input.read` and lists up to 20 open todos. An empty list omits the section, so ordinary chats are unchanged.

Pi stores sections as positional system entries and appends one only when the text changes. A disposable faux-provider check on 2026-10-20 confirmed: no section before the first todo, one entry after it, the same entry reused on an unchanged turn, and a `todos: null` removal entry after the last todo was done. Subagents and temporary contexts have their own empty document, so the section appears only in the main chat. `bot_todo_*` tools still target the main chat from any context.

## Bot tools, bounded search, reactions and artifacts

Bot CRUD tools receive the whole server bot service through runtime registration before restore/resume. Runtime declares its required service interface without importing server. The installed permission hook remains last; trust uses tool registration identity. Mutating tools use native unsafe replay, so a model must inspect saved state before retrying an interrupted operation.

History/search use one native Pi entry page per call. Owner queries use `conversation.entries`; tools use `api.commit(tx => tx.scanEntries(...))` for the executing conversation. A shared pure formatter excludes internal/thinking/tool entries, applies text matching, and returns Pi's cursor unchanged. Empty filtered pages do not mean end of history. No search index, SQL mirror, or full transcript mount is added.

Reactions remain conversation-scoped Pi document-family records. Version 2 preserves owner emojis and adds bot-attributed reactions. Bot tools derive the author and conversation from Pi, while owner RPC validates the selected bot/conversation pair. Neither path submits a prompt. Existing commit notifications invalidate visible reaction queries.

Artifacts use conversation-scoped Pi documents: a summary/version index and a document-family body for each saved version. A single commit writes the body, index, and a metadata-only transcript entry. Artifact entries have no model payload. Native entry history therefore carries card references without loading bodies; owner/tool get operations load the chosen version. Every mutation checks the expected current version and increments it. Restore adds a new version. The last ten versions are offered; older storage is retained.

The artifact content format and 27 block schemas come from Orbs. `@json-render/core` validates structure and resolves state bindings; block schemas validate the resolved props, including HTTP(S)-only URL fields. The selected chat watch increments `artifactsRevision` on the artifact index commit. Clients fetch content only when needed. Rendering remains client work.

Permanent chat erasure is deferred: Pi Durable 1.3.0 has no public conversation-deletion API ([upstream request](https://github.com/earendil-works/pi/issues/11026)). Reset/archive do not erase history. The shared store stays unchanged; no raw Pi-table purge or archive-only delete is implemented.
