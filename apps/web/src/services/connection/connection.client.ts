import { connectionAddressesMerge, makeHttpClient } from '@repo/client/client';
import { serverHealth } from '@repo/contracts/universal';
import { Errors } from '@repo/errors/universal';
import { createIsomorphicFn } from '@tanstack/react-start';
import { match } from 'ts-pattern';
import { CONNECTION } from './connection.constants';
import { connectionCookie, connectionPairingCookie, connectionParse } from './connection.utils';
import type * as ConnectionTypes from '@/types/connection.types';
import type { ConnectionLostReason, ConnectionSaved, ServerAddress } from '@repo/contracts/universal';

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

export async function connectionPair({ entry, name }: ConnectionTypes.ConnectionPairParams) {
  const secure = location.protocol === 'https:';
  document.cookie = connectionPairingCookie(entry.target, secure);

  try {
    const redeemed = await makeHttpClient(() => ({ url: CONNECTION.rpcPath })).pairing.redeem({ pin: entry.pin, name });

    document.cookie = connectionCookie({
      serverId: redeemed.serverId,
      addresses: redeemed.addresses,
      deviceId: redeemed.device.id,
      token: redeemed.token,
    }, secure);
  } finally {
    document.cookie = connectionPairingCookie(null, secure);
  }
}

export const connectionLost = createIsomorphicFn()
  .server(async (_reason: ConnectionLostReason) => undefined)
  .client(async (reason: ConnectionLostReason) => {
    await connectionForget();
    location.assign(`/connect?reason=${reason}`);
  });

export async function connectionVerify({ serverId }: ConnectionTypes.ConnectionVerifyParams): Promise<void> {
  const response = await fetch(CONNECTION.healthPath, { cache: 'no-store' }).catch(() => null);
  const id = response?.ok ? serverHealth.safeParse(await response.json().catch(() => null)).data?.id : undefined;
  const isReplaced = response?.status === 409 || (id !== undefined && serverId !== undefined && id !== serverId);

  await match(isReplaced)
    .with(true, () => connectionLost('replaced'))
    .with(false, () => undefined)
    .exhaustive();

  match(isReplaced || id === undefined)
    .with(true, () => {
      throw new Errors.SERVER_UNREACHABLE();
    })
    .with(false, () => undefined)
    .exhaustive();
}
