import { makeHttpClient } from '@openbots/client/client';
import { connectionStored, SERVER_PROTOCOL } from '@openbots/contracts/universal';
import * as SecureStore from 'expo-secure-store';
import { match } from 'ts-pattern';
import { CONNECTION_STORAGE_KEY } from './connection.constants';
import type { ConnectionAvatarParams, ConnectionFileParams, ConnectionPairParams } from '@/types/connection.types';
import type { ConnectionSaved } from '@openbots/contracts/universal';
import type { ImageURISource } from 'react-native';

export async function connectionRead(): Promise<ConnectionSaved | null> {
  const saved = await SecureStore.getItemAsync(CONNECTION_STORAGE_KEY);
  return connectionStored.safeParse(saved).data ?? null;
}

export async function connectionForget(connection: ConnectionSaved): Promise<boolean> {
  const saved = await connectionRead();

  if (saved?.token !== connection.token) {
    return false;
  }

  await SecureStore.deleteItemAsync(CONNECTION_STORAGE_KEY);

  return true;
}

export async function connectionPair({ payload, name }: ConnectionPairParams): Promise<ConnectionSaved> {
  const url = connectionRpcUrl(payload);
  const redeemed = await makeHttpClient({ url }).pairing.redeem({ token: payload.token, name });

  const connection: ConnectionSaved = {
    serverUrl: payload.serverUrl,
    deviceId: redeemed.device.id,
    token: redeemed.token,
  };

  await SecureStore.setItemAsync(CONNECTION_STORAGE_KEY, JSON.stringify(connection));
  const server = await makeHttpClient({ url, token: () => redeemed.token }).server.info();
  const saved = { ...connection, serverId: server.id };
  await SecureStore.setItemAsync(CONNECTION_STORAGE_KEY, JSON.stringify(saved));

  return saved;
}

export function connectionRpcUrl({ serverUrl }: Pick<ConnectionSaved, 'serverUrl'>): string {
  return new URL('/rpc', serverUrl).toString();
}

export function connectionSocketUrl(connection: Pick<ConnectionSaved, 'serverUrl'>): string {
  const url = new URL(connectionRpcUrl(connection));
  url.protocol = match(url.protocol).with('https:', () => 'wss:').otherwise(() => 'ws:');

  return url.toString();
}

export function connectionFileSource(connection: ConnectionSaved, { botId, attachmentId }: ConnectionFileParams): ImageURISource {
  return {
    uri: new URL(`/files/${encodeURIComponent(botId)}/${encodeURIComponent(attachmentId)}`, connection.serverUrl).toString(),
    headers: {
      authorization: `Bearer ${connection.token}`,
      [SERVER_PROTOCOL.versionHeader]: String(SERVER_PROTOCOL.version),
      ...match(connection.serverId)
        .with(undefined, () => ({}))
        .otherwise((id) => ({ [SERVER_PROTOCOL.serverIdHeader]: id })),
    },
  };
}

export function connectionAvatarUri({ connection, src }: ConnectionAvatarParams): string {
  return connection ? new URL(src, connection.serverUrl).toString() : src;
}
