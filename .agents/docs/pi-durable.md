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

Openbots exposes these through authenticated `conversation.submit` and `conversation.stop`. The runtime keeps Pi handles internal and maps busy rejection to `CONFLICT`; the wire acknowledgement contains the numeric submission ID. Commands use the runtime's background context instead of the request's cancellation signal. File/image input and history contracts remain separate work.

## Provider authentication and storage

The daemon creates `ModelRuntime` from `@earendil-works/pi-coding-agent` and passes it to Durable as `models`. It implements Pi's `Models` interface. The portable runtime requires that dependency explicitly instead of creating an empty in-memory registry.

Pi's [credentials example](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/09-api-keys-and-oauth.ts) demonstrates the default runtime and custom auth/model paths. Defaults load `auth.json` and `models.json` from Pi's agent directory; `PI_CODING_AGENT_DIR` selects a separate directory. Existing Pi credentials are reused, with persistence, locking, and OAuth refresh owned by Pi. No SQL credential adapter is needed for provider authentication.

The native host still owns the locked Durable SQLite store at `OPENBOTS_DATA_DIR/runtime.sqlite`. Loading provider configuration neither changes that path nor creates a coding-agent session. Model selection remains in Durable agent configuration; `ModelRuntime` does not import CLI settings or tools.

## Scope and application integration

The runnable example demonstrates subscriptions within one process. A complete two-browser WebSocket demo was not found in the official examples reviewed. The source was read; the example was not run.

For desktop and mobile clients, the daemon can forward Pi Durable updates over WebSockets. Each client applies those updates to its screen and fetches current state after reconnecting. Authentication, network transport, and reconnect handling belong to the application.

Openbots integration verification on 2026-10-17 used its actual Bun listener, typed oRPC client, real WebSockets, disposable stores, and Pi's faux provider. Pairing, two-client state, reconnect, idle revocation, and cancellation passed in 2.27 seconds. Command validation, busy modes, stop, and deduplication across concurrent calls, reconnect, and SQLite reopen passed in 2.16 seconds. Both listeners were closed and disposable stores removed. These are local transport checks, not desktop/mobile, remote TLS, real-provider, or production validation.

[Pi Durable documentation](https://github.com/earendil-works/pi/tree/main/packages/durable)
