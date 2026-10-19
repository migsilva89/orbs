import { makeHttpClient } from '@openbots/client/client';
import { connectionStored } from '@openbots/contracts/universal';
import { match, P } from 'ts-pattern';
import { CONNECTION } from './connection.constants';
import type * as ConnectionTypes from '@/types/connection.types';
import type { ConnectionSaved } from '@openbots/contracts/universal';

export function connectionRead(): ConnectionSaved | null {
  const saved = match(globalThis.localStorage)
    .with(P.nullish, () => null)
    .otherwise((storage) => storage.getItem(CONNECTION.storageKey));

  return connectionStored.safeParse(saved).data ?? null;
}

export function connectionForget(): void {
  localStorage.removeItem(CONNECTION.storageKey);
}

export async function connectionPair({ payload, name }: ConnectionTypes.ConnectionPairParams) {
  const url = connectionRpcUrl({ serverUrl: payload.serverUrl });
  const redeemed = await makeHttpClient({ url }).pairing.redeem({ token: payload.token, name });

  const connection: ConnectionSaved = {
    serverUrl: payload.serverUrl,
    deviceId: redeemed.device.id,
    token: redeemed.token,
  };

  localStorage.setItem(CONNECTION.storageKey, JSON.stringify(connection));

  const server = await makeHttpClient({ url, token: () => redeemed.token }).server.info();

  localStorage.setItem(CONNECTION.storageKey, JSON.stringify({ ...connection, serverId: server.id }));
}

export function connectionRpcUrl({ serverUrl }: ConnectionTypes.ConnectionUrlParams): string {
  return new URL(CONNECTION.rpcPath, serverUrl).toString();
}

export function connectionSocketUrl({ serverUrl }: ConnectionTypes.ConnectionUrlParams): string {
  const url = new URL(CONNECTION.rpcPath, serverUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

  return url.toString();
}
