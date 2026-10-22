import { connectionStored } from '@repo/contracts/universal';
import { parse, serialize } from 'cookie-es';
import { CONNECTION } from './connection.constants';
import type { ConnectionSaved } from '@repo/contracts/universal';

export function connectionParse(cookies: string): ConnectionSaved | null {
  return connectionStored.safeParse(parse(cookies)[CONNECTION.storageKey]).data ?? null;
}

export function connectionCookie(connection: ConnectionSaved | null, secure: boolean): string {
  return serialize(CONNECTION.storageKey, connection ? JSON.stringify(connection) : '', {
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: connection ? CONNECTION.cookieMaxAgeSeconds : 0,
  });
}
