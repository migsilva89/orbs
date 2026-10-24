import { connectionAddressesMerge, makeHttpClient } from '@repo/client/client';
import { createIsomorphicFn } from '@tanstack/react-start';
import { CONNECTION } from './connection.constants';
import { connectionCookie, connectionPairingCookie, connectionParse } from './connection.utils';
import type * as ConnectionTypes from '@/types/connection.types';
import type { ConnectionSaved, ServerAddress } from '@repo/contracts/universal';

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
  });

export const connectionLearn = createIsomorphicFn()
  .server(async (connection: ConnectionSaved, reported: ServerAddress[]) => {
    const addresses = connectionAddressesMerge(connection.addresses, reported);

    if (JSON.stringify(addresses) === JSON.stringify(connection.addresses)) {
      return;
    }

    const { getRequestProtocol, setCookie } = await import('@tanstack/react-start/server');

    setCookie(CONNECTION.storageKey, JSON.stringify({ ...connection, addresses }), {
      path: '/',
      sameSite: 'lax',
      secure: getRequestProtocol() === 'https',
      maxAge: CONNECTION.cookieMaxAgeSeconds,
    });
  })
  .client(async (connection: ConnectionSaved, reported: ServerAddress[]) => {
    const addresses = connectionAddressesMerge(connection.addresses, reported);

    if (JSON.stringify(addresses) !== JSON.stringify(connection.addresses)) {
      document.cookie = connectionCookie({ ...connection, addresses }, location.protocol === 'https:');
    }
  });

export async function connectionPair({ payload, name }: ConnectionTypes.ConnectionPairParams) {
  const secure = location.protocol === 'https:';
  document.cookie = connectionPairingCookie(payload, secure);

  try {
    const redeemed = await makeHttpClient({ url: CONNECTION.rpcPath }).pairing.redeem({ token: payload.token, name });

    document.cookie = connectionCookie({
      serverId: payload.serverId,
      addresses: payload.addresses,
      deviceId: redeemed.device.id,
      token: redeemed.token,
    }, secure);
  } finally {
    document.cookie = connectionPairingCookie(null, secure);
  }
}
