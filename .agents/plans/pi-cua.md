# Plan: Cua computer use on the host Mac and in local VMs

Status: proposed. High-level overview; each phase gets its own detailed plan before code.

## Goal

A bot can use a computer, and the owner can watch and take over from any client.

1. **Host Mac first.** The bot sees and controls the owner's own Mac: screenshot, click, type, keys, scroll, windows and the accessibility tree. Input goes to one window in the background, so the owner keeps working.
2. **Local VMs second.** A bot that needs isolation gets its own Linux VM. Its file and shell tools run inside the VM.
3. **Watch and take over everywhere.** Web, macOS desktop and iOS show the live screen or one window, with the same "Take over" and "I'm done" flow as the browser plan (`bot-memory-browser-teach.md`, section 6).

Both targets run the same Cua daemon, `cua-spacesd`, so tools, stream, viewer and proxy are written once. Only lifecycle and file tools differ.

No Cua account, no relay, no cloud. Out of scope: Windows, audio, file teleport, presence cursors.

## Facts this plan depends on

Repos read at their main branch on the plan date.

**cua-spacesd (one daemon for host and VM)**

- One process serves port 3211: gRPC and gRPC-Web services `System`, `Process`, `Filesystem`, `Computer`, `Windows`, `Accessibility`, `Stream`, plus `/mcp`, `/media`, `/files` and an HTML5 viewer at `/viewer/`. (cua `libs/cua-spacesd/README.md`)
- It runs on macOS as a LaunchAgent in the GUI session (`com.trycua.spacesd`, `cua-spacesd serve`, token file `~/.cua/spacesd/token`). Capture is ScreenCaptureKit, encoding is VideoToolbox H.264. It needs Screen Recording and Accessibility grants for a stable signed identity; `scripts/build-macos-app.sh` builds a signed `Cua Spacesd.app`. (README, Platforms; `packaging/macos/com.trycua.spacesd.plist`)
- `System.GetCapabilities` reports features such as `a11y`, `background_input`, `desktop_stream`, `window_stream`, `h264_hw`. An unsupported feature carries a `limitation` string. (README, Capabilities)
- `Stream.ListTargets` lists displays and single windows; `OpenMedia` streams one of them. (cua `libs/cua/proto/cua/env/v1/stream.proto`)
- Input: background input goes to one window without moving the pointer or changing focus. Per-window input leases let two principals drive two windows at once; a window held by another principal refuses input until its lease is idle for 5 s. (`libs/cua-spacesd/docs/streaming-design-notes.md`, Input)
- `ComputerService` has `Screenshot`, `Pointer`, `Keyboard`, clipboard, cursor and display calls. `/mcp` is Streamable-HTTP MCP over the cua-driver tool registry. (`computer.proto`; `crates/cua-spacesd-server/README.md`)
- Listen address: `127.0.0.1:3211` without a token, `0.0.0.0:3211` with one, overridable with `--listen`. A token is required for any non-loopback bind. Clients send `authorization: Bearer <token>` or `x-cua-env-authorization`. (README, Run and Token)
- `System.CreateViewerTicket`: TTL 1 hour by default, 24 hours at most, a session policy (view only or full input), optional clipboard and `files_root`, and a principal shown to others. It returns `viewer_path` = `/viewer/#ticket=<ticket>`. The ticket is not scoped to a window. Rotating the root token revokes every ticket. (`system.proto`)
- The viewer works under any path prefix, and the ticket stays in the URL fragment, so it never reaches server or proxy logs. Video is H.264 over the `/media` WebSocket, decoded with WebCodecs, with a PNG fallback when `VideoDecoder` is missing. (`libs/cua/crates/cua-spacesd-html5/web/src/`; `MEDIA.md`)
- License: FSL-1.1-MIT for cua-spacesd and the viewer, fine for a self-hosted single-owner product. Rest of the repo MIT.

**VMs on a Mac**

- `cua runtime doctor` and `cua runtime setup` check and install local runtimes. A Linux VM uses QEMU (HVF) or Lume when QEMU is missing; no Docker needed. (cua `docs/content/docs/cua-sdk/guides/local-runtimes.mdx`)
- The Linux image is Ubuntu 24.04, XFCE on Xvfb, AT-SPI, Chromium and cua-spacesd. (cua `libs/images/linux/Dockerfile`)
- Lume runs macOS guests too, at most two at once (Apple's license), about 50 GB each. (cua `docs/content/docs/lume/index.mdx`)
- `@trycua/pi-durable` 0.1.0 (MIT, not on npm) has `SpacesExecutionEnv`, a Pi `ExecutionEnv` over a Space, Linux guests only. (cua `libs/cua/typescript/integrations/pi-durable/`)

**Orbs**

- File and shell tools already run on the host through Pi's `NodeExecutionEnv`, built in `runtimeEnvNative()` (`packages/runtime/src/services/runtime/runtime-env.utils.ts`). The host target needs no new env.
- The MCP service accepts an HTTP server with `url`, `headers` and `headerCredentials`. (`packages/runtime/src/types/mcp.types.ts`)
- The daemon is one `Bun.serve` with HTTP routes and a WebSocket upgrade for `/rpc`. (`apps/daemon/src/core/core-server.native.ts`)
- Mobile already depends on `react-native-webview`. (`apps/mobile/package.json`)

## Design

### One computer model

```ts
// packages/contracts/src/types/computer.types.ts
export const computerTarget = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('host') }),                          // the owner's Mac, shared by bots that enable it
  z.object({ kind: z.literal('vm'), name: z.string() }),          // one VM per bot
]);

// what runtime and server need to reach a computer, never sent to clients
type ComputerConnection = { url: string; tokenCredential: string };
```

- Bot setting `computer: ComputerTarget | null` in the bot domain.
- Host: one `cua-spacesd` for the Mac at `http://127.0.0.1:3211`, with a token, explicitly bound to loopback (`--listen 127.0.0.1:3211`). Without a token any local process could drive the Mac.
- VM: one `cua-spacesd` per VM, reached at the VM's address with its own token.

### Ownership

| Part | runtime (Pi) | server (product) | daemon (transport) | clients |
| --- | --- | --- | --- | --- |
| Host setup | none | `computer` domain: detect `cua-spacesd`, check capabilities and grants | none | "Use this Mac" row with permission status |
| VM lifecycle | none | `computer` domain: create, start, stop, delete through the `cua` CLI | none | Computer row in bot settings |
| Token | none | root token per computer through the credentials service | none | none |
| Screen tools | `bot_computer_*` over `Computer`, `Windows`, `Accessibility` | passes the connection into the `runtimeBot` doc | none | tool cards with the screenshot |
| File and shell tools | host: unchanged; VM: `SpacesExecutionEnv` | none | none | none |
| Take over | `bot_computer_handoff` on the question flow | viewer ticket RPC | `/computers/<target>/` proxy | Computer panel with the viewer |
| Permissions | action type `computer`, app allowlist on host | defaults per bot | none | allowlist editor |

### 1. Host setup (server)

- The owner installs `cua-spacesd` once (signed app or `packaging/install.sh`) and grants Screen Recording and Accessibility. Orbs does not install it; settings show a short guide and live status.
- The server reads `GetCapabilities` and shows what works: `background_input`, `window_stream`, `a11y`, and each `limitation` (for example "screen recording permission not granted").
- The token is generated by Orbs, written to the daemon's token file and kept in the credentials service.

### 2. Screen tools (runtime)

Same names and shape for host and VM, matching the browser tools.

| Tool | Does |
| --- | --- |
| `bot_computer_windows()` | list windows with app, title and id |
| `bot_computer_read({ mode, windowId? })` | `screenshot` of a window or the display, or `tree` (accessibility tree as text) |
| `bot_computer_act({ windowId, action, x?, y?, text?, keys?, dx?, dy? })` | click, double click, right click, drag, type, key, scroll, in the background when the window supports it |
| `bot_computer_handoff({ instructions, windowId? })` | pause the turn and show "Take over" to the owner |

```ts
// packages/runtime/src/services/computer/computer-tool.read.ts
const { image } = await computerCall(connection, 'cua.env.v1.ComputerService/Screenshot', { window: { id: windowId }, format: 'png' });
return { output: [{ type: 'image', data: image, mimeType: 'image/png' }] };
```

- Actions target a window, never raw screen coordinates on the host, so background input works and the owner's mouse stays put.
- If the owner holds the window's input lease, the action fails with "The owner is using this window" and the bot waits or asks.
- The turn guards of the browser plan apply: keep the last two screenshots whole.

### 3. Host safety (runtime permission hook)

The host is the owner's real Mac, so the defaults are strict.

- `bot_computer_windows` and `bot_computer_read` follow the normal read policy.
- `bot_computer_act` on the host asks before acting on an app not in the bot's allowlist. "Always allow" adds the app (bundle id) to the allowlist.
- A fixed denylist is never allowed without asking: Terminal, System Settings, Keychain Access, password managers, Orbs itself.
- Background turns (routines, check-ins) can act only on allowlisted apps.

```ts
// in the permission hook
const app = await computerWindowApp(connection, input.windowId); // bundle id from Windows.ListWindows
return match({ isHost: target.kind === 'host', isAllowed: bot.computerApps.includes(app), isDenied: COMPUTER.deniedApps.includes(app) })
  .with({ isHost: false }, () => policy.default)
  .with({ isDenied: true }, () => 'ask')
  .with({ isAllowed: true }, () => 'allow')
  .otherwise(() => 'ask');
```

### 4. Watch and take over (server, daemon, clients)

**Viewer ticket.** A paired device calls `computer.viewer({ target, mode })`. The server mints a ticket with the root token and returns a daemon URL. The root token never leaves the daemon.

```ts
// packages/server/src/services/computer/computer-action.viewer.ts
const { ticket } = await computerSystem(connection).createViewerTicket({
  ttl: { seconds: 600n },
  policy: mode === 'watch' ? 'SESSION_POLICY_VIEW_ONLY' : 'SESSION_POLICY_ALLOW_ACTIVATION',
  principal: { id: device.id, name: device.name },
});
return { url: `${daemonOrigin}/computers/${targetKey}/viewer/#ticket=${ticket}` };
```

**Proxy.** One daemon route forwards HTTP and WebSocket traffic to the computer. It adds no credentials; `cua-spacesd` checks the ticket on every call and media socket. The web server proxies `/computers/*` to the daemon like `/rpc`.

```ts
// apps/daemon/src/core/core-server.native.ts
.with({ path: P.string.regex(CORE_SERVER_COMPUTER) }, ({ path }) => (
  coreServerComputer({ services, request, server, path }) // allowlist: viewer/, cua.env.v1.*, media, files
))
```

**Host stream.** By default the viewer opens the window the bot last acted on, not the whole display, so a remote viewer does not see the owner's other apps. The owner can switch to the full display.

**Clients.** Web: an `<iframe>` in a Computer panel. macOS desktop: the same page in a webview. iOS: `react-native-webview`, no new native dependency.

**Take over.** `bot_computer_handoff` reuses the question flow like `bot_browser_handoff`. "Take over" opens a full-input ticket; "I'm done" answers the question. While the owner holds a window's lease, the bot cannot act on it.

### 5. VMs (server, runtime)

- The `computer` service runs `cua` as a subprocess: `cua sb create linux --kind vm --name orbs-<botId>`, `cua sb stop`, `cua sb rm`. Create and delete need owner confirmation.
- File and shell tools for a VM bot use a copy of `SpacesExecutionEnv` (MIT) behind `runtimeEnvNative()`, adapted to Pi 1.3.0. Concrete gap: Pi Durable ships only `NodeExecutionEnv`.

```ts
// packages/runtime/src/services/runtime/runtime-env.utils.ts
export function runtimeEnvNative(root: string, computer?: ComputerRuntimeTarget) {
  return ({ cwd = '.' }: { cwd?: string }) => match(computer)
    .with({ kind: 'vm' }, ({ botId, spacesd }) => new SpacesExecutionEnv({ spacesd, id: `orbs-computer:${botId}`, cwd: posix.join('/home/cua/work', cwd) }))
    .otherwise(() => new NodeExecutionEnv({ cwd: resolve(root, cwd) })); // host: unchanged
}
```

- A missing VM fails the turn with a clear error. It never falls back to the host.
- Stop a VM after 30 minutes without tool calls or viewers.

## Streaming

Recommended: **Cua's own stream through the daemon proxy**, for host and VM alike. H.264 from VideoToolbox on the Mac, damage-driven and rate-controlled, with window targets, input leases, view-only tickets and a ready viewer page.

Rejected:

- **macOS Screen Sharing (VNC):** whole screen only, no per-window stream, no tickets, weak VNC auth.
- **noVNC to a VM:** no rate control, and we would build tickets and input sharing ourselves.
- **WebRTC:** needs signaling, TURN and a native iOS module.
- **Screenshot polling over oRPC:** a few frames per second and no shared input.
- **Native iOS decoder (Cua Swift SDK):** later, if the WebView is not smooth enough.

Auth: only a paired device can call `computer.viewer`. Tickets last 10 minutes, carry the device as principal and live in the URL fragment.

## Phases

1. **Host spike.** Install `cua-spacesd` on the Mac with a token on loopback. From a Bun script: `GetCapabilities`, `ListTargets`, window `Screenshot`, background click and type into a test app, `CreateViewerTicket`. Open the viewer through a hand-written proxy on web, desktop and iOS (LAN and Tailscale). Measure input-to-screen time and check H.264 vs PNG over HTTP and HTTPS.
2. **MCP shortcut, no runtime code.** Add `http://127.0.0.1:3211/mcp` as a shared MCP server with `headerCredentials`. The bot gets the cua-driver tools; the permission hook asks before every action. Proves the agent loop on the host.
3. **Host product.** Server `computer` domain (host target, token, capabilities), native `bot_computer_*` tools, app allowlist, daemon proxy, Computer panel on all three clients, handoff.
4. **VM spike.** `cua runtime doctor`, one Linux VM, same script as phase 1 against it.
5. **VM product.** Lifecycle, VM target in settings, `SpacesExecutionEnv` for file and shell tools.
6. **Optional.** macOS guests through Lume; Cua checkpoints and fencing.

## Open questions

- **Owner decision: host scope.** Default: any bot can be given the host, each with its own app allowlist. Alternative: only one bot at a time.
- **Owner decision: VM guest OS.** Default Linux. macOS guests cost about 50 GB each and only two can run at once.
- **Owner decision: VM resources.** Default 2 vCPU, 4 GB RAM, 30 GB disk, editable per bot.
- **Owner decision: VM lifecycle.** Default the `cua` CLI as a subprocess; switch to `@trycua/cua` if Bun loads its native module.
- Can the viewer open a given window target from its URL, or does the window pick need a small change? Check in phase 1.
- Should the host be reachable from outside the LAN only through Tailscale, or also through Cua's relay? Default Tailscale only.

## Risks

- **Real Mac, real damage.** A wrong click on the host hits real files and accounts. Mitigated by the app allowlist, the denylist and asking by default.
- **Owner and bot collide.** Two principals on one window: the input lease blocks the bot, and the tool says so. Foreground-only apps (some Electron or games) may need focus and move the pointer; `background_input` reports this per window.
- **Ticket is not window-scoped.** A full-input ticket can open any window or the whole display. Only paired devices get tickets, and only the owner pairs devices.
- **Permissions.** Screen Recording and Accessibility grants belong to the signed `cua-spacesd` identity. An unsigned or rebuilt binary loses them.
- **Secure context.** WebCodecs needs HTTPS; over plain HTTP the viewer falls back to PNG frames. Tailscale HTTPS gets H.264.
- **Young APIs.** cua-spacesd 0.8, `@trycua/pi-durable` 0.1 (not on npm). Pin versions and keep every Cua call behind the `computer` domain.
- **Screenshot cost.** Prune old screenshots deterministically so the prompt cache stays warm.
- **VM resources.** Each VM holds RAM and disk. Stop idle VMs and show their size in settings.

## Sources

- [Cua repository](https://github.com/trycua/cua): `libs/cua-spacesd/README.md`, `libs/cua-spacesd/docs/streaming-design-notes.md`, `libs/cua-spacesd/packaging/macos/`, `libs/cua/proto/MEDIA.md`, `libs/cua/proto/cua/env/v1/{computer,system,stream}.proto`, `libs/cua/crates/cua-spacesd-html5/web/src/`, `libs/cua/typescript/integrations/pi-durable/`, `libs/images/linux/`
- [Cua local runtimes](https://cua.ai/docs/cua-sdk/guides/local-runtimes)
- [Lume](https://cua.ai/docs/lume)
- [Rakazo](https://github.com/elie222/rakazo) `docs/computer-runtime.md`: host mode has no screen control; Linux screens use noVNC; exclusive take-control lease
- Pi Durable 1.3.0 README, Environment and Tools sections
