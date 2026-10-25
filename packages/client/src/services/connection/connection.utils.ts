import { ORPCError } from '@orpc/client';
import { serverHealth } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { match } from 'ts-pattern';
import { CONNECTION } from './connection.constants';
import type { ConnectionPick, ConnectionTarget } from '../../types/connection.types';
import type { ConnectionLostReason, ServerAddress } from '@repo/contracts/universal';

/**
 * Probes every address at once and returns the first one, in list order, where the paired daemon answers.
 * `isMismatch` means no address reached the paired daemon but one reached a different daemon.
 */
export async function connectionAddressPick({ serverId, addresses }: ConnectionTarget): Promise<ConnectionPick> {
  const probes = addresses.map((address) => fetch(new URL(CONNECTION.healthPath, address.url), { signal: AbortSignal.timeout(CONNECTION.probeTimeoutMs) })
    .then(async (response) => serverHealth.safeParse(await response.json()).data?.id ?? null)
    .catch(() => null));

  const address = await addresses.reduce<Promise<ServerAddress | null>>(
    async (earlier, candidate, index) => (await earlier) ?? ((await probes[index]) === serverId ? candidate : null),
    Promise.resolve(null),
  );

  const ids = address ? [] : await Promise.all(probes);

  return {
    address,
    isMismatch: ids.some((id) => id !== null && id !== serverId),
  };
}

/** The daemon's current addresses, then any the user added on this device alone. */
export function connectionAddressesMerge(saved: ServerAddress[], reported: ServerAddress[]): ServerAddress[] {
  const known = new Set(reported.map((address) => address.url));

  return [...reported, ...saved.filter((address) => address.kind === 'custom' && !known.has(address.url))];
}

export function connectionRpcUrl(address: Pick<ServerAddress, 'url'>): string {
  return new URL(CONNECTION.rpcPath, address.url).toString();
}

export function connectionSocketUrl(address: Pick<ServerAddress, 'url'>): string {
  const url = new URL(CONNECTION.rpcPath, address.url);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

  return url.toString();
}

/** Why the daemon refused this device's saved connection, or null when the error is something else. */
export function connectionLostReason(error: unknown): ConnectionLostReason | null {
  return match(error)
    .when((value) => value instanceof ORPCError && value.code === 'UNAUTHORIZED', () => 'revoked' as const)
    .when((value) => value instanceof ORPCError && value.code === 'SERVER_MISMATCH', () => 'replaced' as const)
    .otherwise(() => null);
}

export function connectionLostMessage(reason: ConnectionLostReason): string {
  return match(reason)
    .with('revoked', () => m.connect_revoked())
    .with('replaced', () => m.connect_replaced())
    .exhaustive();
}
