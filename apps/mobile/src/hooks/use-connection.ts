import { Errors } from '@repo/errors/universal';
import { use } from 'react';
import { match, P } from 'ts-pattern';
import { connectionContext } from '@/context/connection';

export function useConnection() {
  return match(use(connectionContext))
    .with(P.nonNullable, (connection) => connection)
    .otherwise(() => {
      throw new Errors.INTERNAL_ERROR({ internal: 'Connection provider is missing' });
    });
}

export function useConnectionIsConnected() {
  return useConnection().session !== null;
}
