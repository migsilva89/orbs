import { SERVER_PROTOCOL } from '@openbots/contracts/universal';
import { createORPCClient } from '@orpc/client';
import { RetryLinkPlugin } from '@orpc/client/plugins';
import { RPCLink } from '@orpc/client/websocket';
import { match, P } from 'ts-pattern';
import type { Client, ClientOptions } from './types/client.types';

export function makeClient({ connect, token, serverId }: ClientOptions): Client {
  const retry = new RetryLinkPlugin({
    default: {
      retry: ({ path }) => match(path)
        .with(['conversation', P.union('watch', 'watchList', 'watchContexts', 'history')], () => Number.POSITIVE_INFINITY)
        .otherwise(() => 0),
      shouldRetry: ({ error, signal }) => !signal?.aborted && error instanceof Error && error.name === 'AbortError',
    },
  });

  const link = new RPCLink({
    connect,
    reconnect: { enabled: true },
    headers: async () => ({
      [SERVER_PROTOCOL.versionHeader]: String(SERVER_PROTOCOL.version),
      ...match(serverId)
        .with(P.string, (id) => ({ [SERVER_PROTOCOL.serverIdHeader]: id }))
        .otherwise(() => ({})),
      ...match(await token?.())
        .with(P.string, (credential) => ({ authorization: `Bearer ${credential}` }))
        .otherwise(() => ({})),
    }),
    plugins: [retry],
  });

  return createORPCClient(link);
}
