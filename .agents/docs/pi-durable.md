# Pi Durable: live client examples

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

## Scope and application integration

The runnable example demonstrates subscriptions within one process. A complete two-browser WebSocket demo was not found in the official examples reviewed. The source was read; the example was not run.

For desktop and mobile clients, the daemon can forward Pi Durable updates over WebSockets. Each client applies those updates to its screen and fetches current state after reconnecting. Authentication, network transport, and reconnect handling belong to the application.

[Pi Durable documentation](https://github.com/earendil-works/pi/tree/main/packages/durable)
