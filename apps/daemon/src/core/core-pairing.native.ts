import { env } from '@repo/env/server';
import { renderUnicodeCompact } from 'uqr';
import type { makeServices } from '@repo/server/server';

export function corePairingNative(services: Awaited<ReturnType<typeof makeServices>>): () => void {
  const serverUrl = new URL(env.WEB_PUBLIC_URL).origin;
  let timer: Timer | undefined;

  async function issue(): Promise<void> {
    const devices = await services.auth.queries.devices();

    if (devices.length > 0) {
      return;
    }

    const { qr, expiresAt } = await services.auth.actions.bootstrap({ isLocal: true, serverUrl });
    const link = new URL(`/connect#code=${encodeURIComponent(qr.payload)}`, serverUrl).href;

    process.stdout.write(`\nNo device is paired. Open this link or scan the code to pair the first device:\n\n${link}\n\n${renderUnicodeCompact(link)}\n`);
    timer = setTimeout(() => void issue(), expiresAt - Date.now());
  }

  void issue();

  return () => clearTimeout(timer);
}
