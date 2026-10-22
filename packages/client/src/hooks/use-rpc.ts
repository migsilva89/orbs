import { Errors } from '@repo/errors/universal';
import { use } from 'react';
import { rpcContext } from '../context/rpc';

export function useRpc() {
  const value = use(rpcContext);

  if (!value) {
    throw new Errors.INTERNAL_ERROR({ internal: 'useRpc needs an rpcContext provider' });
  }

  return value;
}
