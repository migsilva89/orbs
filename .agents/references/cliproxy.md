# Claude through CLIProxyAPI

[CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) serves a Claude subscription as an Anthropic-compatible API. Orbs reaches it through Pi's built-in `anthropic` provider, so every Claude model keeps its normal name, limits and pricing.

Orbs reads Pi's agent directory for logins (`auth.json`), custom endpoints (`models.json`), skills and instructions. It is `~/.pi/agent` unless `PI_CODING_AGENT_DIR` points elsewhere.

## Setup

1. Run CLIProxyAPI, log in to Claude with it, and add a client key to the `api-keys` list in its config. By default it listens on port 8317.
2. Point Pi's `anthropic` provider at the proxy in `models.json` inside the Pi agent directory:

   ```json
   {
     "providers": {
       "anthropic": { "baseUrl": "http://localhost:8317" }
     }
   }
   ```

   Use the address where your proxy runs, with no `/v1` suffix.
3. Give Pi the proxy's client key, not an Anthropic key. Either save it in **Settings → Providers → Anthropic → API key**, or set it before starting the daemon:

   ```bash
   export ANTHROPIC_API_KEY=your-cliproxy-client-key
   ```

4. Restart the daemon, then pick a Claude model for a bot.

The same `baseUrl` override works for `openai` and `xai` when the proxy serves them. Keep `auth.json` private; it holds the key.

## Test with a separate Pi directory

To try logins or a proxy setup without touching your own Pi config, run a second daemon with its own Pi directory, data and port, plus a web dev server for it. The dev web app always talks to the daemon on its own `DAEMON_PORT`, so the normal one on port 47190 cannot pair with the test daemon.

```bash
cd apps/daemon
PI_CODING_AGENT_DIR=~/.config/orbs-test/pi \
DATA_DIR=~/.config/orbs-test \
DAEMON_HOST=127.0.0.1 DAEMON_PORT=47291 \
WEB_PUBLIC_URL=http://localhost:47290 \
bun --env-file=../../.env src/entry.native.ts
```

In a second terminal:

```bash
cd apps/web
DAEMON_PORT=47291 bunx vite dev --port 47290 --strictPort
```

Open the pairing link the daemon prints in a private window, so your normal session keeps its connection. Then log in under **Settings → Providers**. Credentials land in `~/.config/orbs-test/pi/auth.json`; delete `~/.config/orbs-test` to start over.
