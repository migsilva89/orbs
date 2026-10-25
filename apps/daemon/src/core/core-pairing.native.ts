import { env } from '@repo/env/server';
import { renderUnicodeCompact } from 'uqr';
import type { makeServices } from '@repo/server/server';

export function corePairingNative(services: Awaited<ReturnType<typeof makeServices>>): () => void {
  const serverUrl = new URL(env.WEB_PUBLIC_URL).origin;
  let timer: Timer | undefined;

  async function issue(): Promise<void> {
    const devices = await services.auth.queries.devices();

    if (devices.length > 0) {
      process.stdout.write(`\n${devices.length} paired device(s). To pair another one, run:\n\nDATA_DIR=${env.DATA_DIR} bun run --cwd apps/daemon start pair --url ${serverUrl}\n\n`);
      return;
    }

    const { id, addresses } = await services.server.queries.info();

    const { pin, qr, expiresAt } = await services.auth.actions.bootstrap({
      serverId: id,
      addresses,
      isLocal: true,
    });

    const link = new URL(`/connect#code=${encodeURIComponent(qr.payload)}`, serverUrl).href;

    process.stdout.write(`\nNo device is paired. Enter PIN ${pin}, open this link or scan the code to pair the first device:\n\n${link}\n\n${renderUnicodeCompact(link)}\n`);
    timer = setTimeout(() => void issue(), expiresAt - Date.now());
  }

  void issue();

  return () => clearTimeout(timer);
}
