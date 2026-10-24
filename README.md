# 🤖 Orbs

> Your own bots, on your own Mac. Chat with them from the web, your iPhone or the desktop app.

Orbs runs a small daemon on your computer. Each bot is a persistent [Pi](https://github.com/earendil-works/pi) agent with its own conversation, tools, skills and memory, and it keeps working when you close the app. Your devices pair with the daemon once, then talk to it over your local network or Tailscale. There are no accounts and no cloud service in between.

## ✨ Features

- 💬 **Persistent bots.** Give a bot a name, an avatar, instructions and a model. Its conversation survives restarts, and work in progress resumes on its own.
- 🔌 **Any model Pi can reach.** Log in to OpenAI Codex, Claude, Grok and other providers from Settings, or reuse the logins you already have in Pi.
- 🧰 **Skills, MCP and plugins.** Bots inherit your agent skills, instructions and MCP servers, and you can add more per bot. Pick a skill from the composer with `/`.
- 🤝 **Bots talk to each other.** A bot can message another bot, wait for the answer and pass it on, up to three bots deep. Bots can also start subagents in the foreground or background.
- ✅ **Approvals you control.** Each bot has a permission mode: read-only, ask, auto or full. Auto lets [Jev](https://typesafe.ai) approve safe calls and asks you about the rest, using your own plain-language rules.
- 🔑 **Secrets without leaks.** A bot can ask you for an API key. You type it once, it is stored encrypted, and the bot only ever sees a placeholder that a local proxy swaps for the real value.
- 📎 **Files, questions and reactions.** Attach files and images, answer a bot's multiple-choice questions, and react to messages.
- ⏰ **Routines.** Schedule a bot to run on its own; results land in its chat.
- 📊 **Artifacts.** Bots build documents, charts and HTML pages you can open and edit from the artifacts page.
- 📱 **iOS app.** Scan the pairing QR code and chat on the go. Push notifications show the bot's own avatar.
- 🍎 **macOS app.** Starts the daemon for you, pairs itself, and can also open Orbs running on another Mac.
- 💾 **Backups.** One command snapshots every bot, its files and the database, and restores them later.

## 🧰 Built with

[Bun](https://bun.sh) · [Turborepo](https://turborepo.com) · [Pi Durable](https://github.com/earendil-works/pi) · [oRPC](https://orpc.dev) · [TanStack Start](https://tanstack.com/start) · [Expo](https://expo.dev) · [Electrobun](https://electrobun.dev) · SQLite · [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)

## 🚀 Run it locally

**You need:** [Bun](https://bun.sh) 1.4 on macOS. The iOS app also needs Xcode.

**1. Install**

```bash
git clone https://github.com/nikuscs/orbs && cd orbs
bun install
cp .env.example .env
```

The defaults in `.env.example` work as they are.

**2. Start the daemon and the web app**

```bash
bun run dev:web
```

This starts the daemon on port 47191 and the web app on http://localhost:47190. Dev data lives in `~/.config/orbs-dev`, apart from a real install in `~/.config/orbs`.

**3. Pair your browser**

While no device is paired, the daemon prints a pairing link and a QR code in the terminal. Open the link to pair this browser. To pair another device later, open **Settings → Devices** on a paired one, or run `orbs pair`.

**4. Connect a model**

Open **Settings → Providers** and log in. If you already use Pi, its saved logins in `~/.pi/agent` work right away.

> [!WARNING]
> Bots run their tools as your user, on your machine. This is not a sandbox. Use the permission modes to decide what a bot may do without asking.

### iPhone

```bash
bun run dev:mobile
```

This boots the iOS Simulator and starts the dev client. Scan the pairing QR code from **Settings → Devices** in the web app. For a real phone, the daemon must be reachable on your LAN or Tailscale; it listens on every interface by default.

### Desktop app

```bash
bun run dev:desktop
```

The macOS app starts the daemon and web app if they are not running, then pairs itself. On first launch it asks where Orbs runs: **This Mac** or **Another Mac**.

### The `orbs` command

Run `bun link` in `apps/daemon` once, then:

```bash
orbs start                # Run in the foreground; Ctrl+C stops it
orbs start --detach       # Run in the background
orbs pair                 # Print a new pairing code, link and QR code
orbs service register     # Start the daemon at every macOS login
orbs service unregister   # Stop starting it at login
```

`bun run --cwd apps/daemon backup` creates and restores backups. See the [API reference](.agents/references/api.md#daemon-and-storage) for details.

### Desktop release

`bun run release:desktop` builds the macOS app, signs it with your Developer ID, notarizes it with Apple and writes `apps/desktop/artifacts/Orbs-<version>-macos-arm64.zip`. The version comes from `apps/desktop/package.json`. Set `DESKTOP_SIGNING_KEYCHAIN` (a dedicated keychain holding the Developer ID certificate) and `DESKTOP_SIGNING_IDENTITY` (its SHA-1) in `.env`. The keychain password and notary key come from `.env` or from a `credentials.json` next to the keychain; see `.env.example`.

## 🧪 Development

```bash
bun run check       # TypeScript in every package
bun run lint        # Oxlint, architecture rules and import cycles
bun run lint:dead   # Unused files, exports and dependencies
```

Agent guidance lives in `AGENTS.md` and `.agents/`. Run `bun run agents:sync` after changing it: it links `CLAUDE.md`, `.claude/` and the worktree configs for Paseo, Orca, Conductor and T3 Code from `.agents/orchestrators/`.

[Architecture](.agents/references/architecture.md) shows how the apps and packages fit together and where each kind of file goes. The [API reference](.agents/references/api.md) lists the daemon, RPC and Pi behavior the code does not make obvious.

## 📄 License

MIT. The avatar blob engine in `packages/avatar-blobs/` is by Jérémy Perret, also MIT; see `packages/avatar-blobs/LICENSE`.
