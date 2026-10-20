import { makeHttpClient } from '@openbots/client/client';
import { connectionStored } from '@openbots/contracts/universal';
import { createIsomorphicFn } from '@tanstack/react-start';
import { CONNECTION } from './connection.constants';
import { connectionCookie, connectionParse } from './connection.utils';
import type * as ConnectionTypes from '@/types/connection.types';
import type { ConnectionSaved } from '@openbots/contracts/universal';

export const connectionRead = createIsomorphicFn()
  .server(async () => {
    const { getRequestHeader } = await import('@tanstack/react-start/server');

    return connectionParse(getRequestHeader('cookie') ?? '');
  })
  .client(async () => connectionParse(document.cookie));

export const connectionForget = createIsomorphicFn()
  .server(async () => {
    const { deleteCookie } = await import('@tanstack/react-start/server');
    deleteCookie(CONNECTION.storageKey, { path: '/' });
  })
  .client(async () => {
    document.cookie = connectionCookie(null, location.protocol === 'https:');
    localStorage.removeItem(CONNECTION.storageKey);
  });

export function connectionMigrate(): void {
  const saved = connectionStored.safeParse(localStorage.getItem(CONNECTION.storageKey)).data;

  if (!saved || new URL(saved.serverUrl).origin !== location.origin) {
    return;
  }

  if (!connectionParse(document.cookie)) {
    document.cookie = connectionCookie(saved, location.protocol === 'https:');
  }

  if (connectionParse(document.cookie)) {
    localStorage.removeItem(CONNECTION.storageKey);
  }
}

export async function connectionPair({ payload, name }: ConnectionTypes.ConnectionPairParams) {
  const url = CONNECTION.rpcPath;
  const redeemed = await makeHttpClient({ url }).pairing.redeem({ token: payload.token, name });

  const connection: ConnectionSaved = {
    serverUrl: location.origin,
    deviceId: redeemed.device.id,
    token: redeemed.token,
  };

  document.cookie = connectionCookie(connection, location.protocol === 'https:');

  const server = await makeHttpClient({ url, token: () => redeemed.token }).server.info();

  document.cookie = connectionCookie({ ...connection, serverId: server.id }, location.protocol === 'https:');
  localStorage.removeItem(CONNECTION.storageKey);
}

export function connectionRpcUrl({ serverUrl }: ConnectionTypes.ConnectionUrlParams): string {
  return new URL(CONNECTION.rpcPath, serverUrl).toString();
}

export function connectionSocketUrl({ serverUrl }: ConnectionTypes.ConnectionUrlParams): string {
  const url = new URL(CONNECTION.rpcPath, serverUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

  return url.toString();
}
