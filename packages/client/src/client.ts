import { createORPCClient } from '@orpc/client';
import { RetryLinkPlugin } from '@orpc/client/plugins';
import { RPCLink } from '@orpc/client/websocket';
import { match, P } from 'ts-pattern';
import type { Client, ClientOptions } from './types/client.types';

export function makeClient({ connect, token }: ClientOptions): Client {
  const retry = new RetryLinkPlugin({
    default: {
      retry: ({ path }) => match(path)
        .with(['conversation', P.union('watch', 'watchList', 'history')], () => Number.POSITIVE_INFINITY)
        .otherwise(() => 0),
      shouldRetry: ({ error, signal }) => !signal?.aborted && error instanceof Error && error.name === 'AbortError',
    },
  });

  const link = new RPCLink({
    connect,
    reconnect: { enabled: true },
    headers: async () => match(await token?.())
      .with(P.string, (credential) => ({ authorization: `Bearer ${credential}` }))
      .otherwise(() => ({})),
    plugins: [retry],
  });

  return createORPCClient(link);
}
