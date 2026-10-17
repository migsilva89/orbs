# Openbots

A Bun/Turbo scaffold with a native daemon, device pairing, and a live view of one persistent Pi Durable conversation. Desktop, mobile, bot schemas, and chat commands are not implemented yet.

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

Startup opens `runtime.sqlite` in the data directory, acquires a single-process lock, opens and migrates `app.sqlite`, then reopens Pi's root conversation and calls `resume()`. Shutdown closes the listener, Harness, app database, and storage lock. Use a separate data directory per independent daemon.

The app database uses `node:sqlite` through Kysely, adapted from Orbs. WAL and foreign keys are enabled. Kysely tracks the [SQL migrations](packages/server/src/services/database/migrations/0001_pairing.sql); the first migration creates devices and temporary pairing grants. Bot and provider-credential tables will be added with their features. Pi remains the owner of conversation history.

The daemon initializes native logging at startup. Startup, runtime, and shutdown failures are logged and set a nonzero exit code.

The internal server service supports submit, watch, history, and stop through Pi Durable 1.3.0. Model registries and agent settings are injected by server code; the daemon currently registers no providers or tools. Real model setup and credentials from the app database are still pending. No fake provider is installed in application code.

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

## Live conversation

`conversation.watch()` streams the root conversation using [Pi's watch pattern](.agents/docs/pi-durable.md): an initial replacement snapshot, then committed Chord operations. The client helper applies those operations and yields the current view:

```typescript
import { watchConversation } from '@openbots/client/client';

const controller = new AbortController();
for await (const view of watchConversation(client, controller.signal)) {
  render(view);
}
```

Call `controller.abort()` when leaving the view. Disconnecting or cancelling stops observation, not the agent. oRPC reconnects interrupted watch calls and receives a fresh snapshot; it does not retry authentication failures or replay submitted messages. Revoking a device ends its subscriptions even while idle. Pi handles slow watchers with bounded pending frames and replacement snapshots.

This is an owner-only view of the existing root conversation. Multiple rooms, public group views, model setup, and submit/stop endpoints are still pending. Verification used real Pi state and oRPC frames over in-memory sockets, including two clients, reconnect, revocation, cancellation, and a slow reader; live network and app UI verification remain pending.

## Configuration

`@openbots/env/client` and `@openbots/env/server` export separate `env` objects using the same `createEnv` pattern. The client schema is empty. Add mobile configuration with the mobile app.

| Server setting | Default | Values |
| --- | --- | --- |
| `OPENBOTS_DATA_DIR` | `data` | Nonempty path, relative to the working directory or absolute |
| `OPENBOTS_HOST` | `0.0.0.0` | Bind address or hostname |
| `OPENBOTS_PORT` | `3000` | Integer from 1 to 65535 |
| `OPENBOTS_LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |

Bot settings and credentials will live in the database. The env package does not read or write local config files or generate secrets.

## References

- [Architecture](.agents/references/architecture.md)
- [Design](DESIGN.md)
- [Quality gate](.agents/references/quality-gate.md)
- [Pi Durable examples](.agents/docs/pi-durable.md)
