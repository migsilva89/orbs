# Plan: run bot tools in a local Cua Space

Status: proposed. Reference: [pi-cua](https://github.com/injaneity/pi-cua).

## Goal

A bot can run its file and shell tools (`read`, `write`, `edit`, `bash`, `find`, `grep`) inside a sandbox on the owner's own machine instead of directly on the host. The sandbox is a Cua Space: a local container (Docker or Podman, optionally gVisor) or a local VM (Lume on Apple silicon, or QEMU). No Cua account or cloud is required.

Out of scope for this plan: GUI computer use (click, type, screenshot), cloud or relay Spaces, and Windows Spaces.

## Facts this plan depends on

- pi-cua is a Pi CLI extension. It adds `/space` and a `space` tool, routes the six built-in tools through `cua-spacesd`, and syncs a Git work tree to the Space and back.
- Pi Durable 1.3.0 has no CLI extension adapter, so pi-cua cannot be installed as-is. Openbots must reproduce its routing with Durable APIs.
- Durable already has the right seam. `CodingTools` run against an `ExecutionEnv` (`FileSystem` + `Shell`, exported from `@earendil-works/pi-durable/env`). Openbots builds it in one place: `runtimeEnvNative()` in `packages/runtime/src/services/runtime/runtime-env.utils.ts`, which returns a `NodeExecutionEnv` per `cwd`.
- `FileSystem.id` is the file namespace. Each container or remote host must report its own id, so Pi does not mix host and Space paths.
- Durable ships only `NodeExecutionEnv`. A Space-backed environment is new code.
- A Space runs `cua-spacesd` (port 3211). Spaces are created with `cua spaces create --on local --kind container|vm --runtime runc|gvisor|lume|qemu`. The registry is `~/.cua/spaces.json`; tokens live in a separate `0600` credentials file. `cua runtime doctor` and `cua runtime setup` check and install local runtimes.
- A local container or QEMU VM is suspended on stop (memory kept). A Lume VM is stopped (disk kept).

## Design

1. **Runtime: `CuaSpaceEnv`.** A new `ExecutionEnv` in `packages/runtime` (native entry) that implements `FileSystem` and `Shell` over the `cua-spacesd` API. It reports a per-Space `FileSystem.id`. `runtimeEnvNative()` picks it when the bot has a Space; otherwise it keeps `NodeExecutionEnv`.
2. **Server: Space setting per bot.** A bot setting `space: { id } | null` owned by the bot domain. The Space token is stored through the credentials service, never in a bot column. The permission hook, approvals and replay policy stay unchanged, because they sit above the environment.
3. **Lifecycle.** Create, start, stop and delete Spaces from bot settings, through the Cua CLI or SDK. Creating and deleting need confirmation. A missing or changed Space stops the turn with a clear error instead of falling back to the host, matching pi-cua's "resume never substitutes a different machine".
4. **Workspace.** Start with the Space as the bot's own workspace, with no sync back to the host. Git sync like pi-cua's (`/space local`) is a later phase.
5. **Clients.** Web and mobile bot settings get a "Workspace" row: Host or a named Space, with its status.

## Phases

1. Spike: create a local Linux container Space with `cua spaces create --on local --kind container` and call `cua-spacesd` from a Bun script: read, write, exec. Confirm which client the Cua SDK exposes to TypeScript or Bun.
2. `CuaSpaceEnv` behind `runtimeEnvNative()`, with one Space configured by hand for one bot.
3. Bot setting, credentials storage, lifecycle RPCs, and the client settings row.
4. Optional: Git sync back to the host, Lume macOS VMs, and GUI computer use as a separate plan.

## Open questions

- Does the Cua SDK have a TypeScript client for `cua-spacesd`, or only Rust, Python and the CLI? This decides between calling the API directly and shelling out to `cua`.
- Should one Space be shared by several bots or always dedicated? pi-cua notes that sessions on one Space share its user, files and logins.
- Should `DATA_DIR` paths (skills, attachments) be mounted into the Space, or should file tools see only the Space?

## Risks

- `cua-spacesd` API stability: Cua Spaces is young, and pi-cua has no releases yet.
- Every file operation crosses a process or network boundary, so large greps and reads are slower than on the host.
- Long `bash` runs and output spill (`ShellExecResult.spillPath`) must work over the API.

## Sources

- [pi-cua README](https://github.com/injaneity/pi-cua)
- [Cua local runtimes](https://cua.ai/docs/cua-sdk/guides/local-runtimes)
- [cua spaces CLI](https://cua.ai/docs/cua-cli/reference/cli/spaces)
- [Cua Spaces quickstart](https://cua.ai/docs/spaces/quickstart)
- [cua-spaces README](https://github.com/trycua/cua/blob/main/apps/cua-spaces/README.md)
