import { createORPCClient, DynamicLink } from '@orpc/client';
import { RPCLink as FetchRPCLink } from '@orpc/client/fetch';
import { RetryLinkPlugin } from '@orpc/client/plugins';
import { RPCLink } from '@orpc/client/websocket';
import { SERVER_PROTOCOL } from '@repo/contracts/universal';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import type { Client, ClientHttpOptions, ClientOptions } from './types/client.types';

export function makeHttpClient(options: () => ClientHttpOptions | Promise<ClientHttpOptions>): Client {
  return createORPCClient(new DynamicLink(async () => {
    const { url, token, serverId, fetch } = await options();

    return clientHttpLink(url, () => clientHeaders({ token, serverId }), fetch);
  }));
}

export function makeClient({ connect, token, serverId, url }: ClientOptions): Client {
  const headers = async () => clientHeaders({ token, serverId });

  const retry = new RetryLinkPlugin({
    default: {
      retry: ({ path }) => match(path)
        .with(['conversation', P.union('watch', 'watchList', 'watchContexts', 'watchNotifications', 'history')], () => Number.POSITIVE_INFINITY)
        .otherwise(() => 0),
      shouldRetry: ({ error, signal }) => !signal?.aborted && error instanceof Error && error.name === 'AbortError',
    },
  });

  const websocket = new RPCLink({
    connect,
    reconnect: { enabled: true },
    headers,
    plugins: [retry],
  });

  const http = match(url)
    .with(P.string, (base) => clientHttpLink(base, headers))
    .with(P.nullish, () => undefined)
    .otherwise((base) => new DynamicLink(() => clientHttpLink(base(), headers)));

  return createORPCClient(new DynamicLink((_options, path) => match(path)
    .with(P.union(['attachments', P.union('upload', 'download')], ['avatars', 'upload']), () => match(http)
      .with(P.nonNullable, (link) => link)
      .otherwise(() => {
        throw new Errors.INTERNAL_ERROR({ internal: 'File transfer requires an HTTP RPC base (ClientOptions.url).' });
      }))
    .otherwise(() => websocket)));
}

async function clientHeaders({ token, serverId }: Pick<ClientOptions, 'token' | 'serverId'>) {
  return {
    [SERVER_PROTOCOL.versionHeader]: String(SERVER_PROTOCOL.version),
    ...match(serverId)
      .with(P.string, (id) => ({ [SERVER_PROTOCOL.serverIdHeader]: id }))
      .otherwise(() => ({})),
    ...match(await token?.())
      .with(P.string, (credential) => ({ authorization: `Bearer ${credential}` }))
      .otherwise(() => ({})),
  };
}

function clientHttpLink(url: string, headers: () => ReturnType<typeof clientHeaders>, fetch?: ClientHttpOptions['fetch']) {
  const parsed = new URL(url, 'http://localhost');

  return new FetchRPCLink({
    origin: match(url)
      .when((value) => /^https?:\/\//.test(value), () => parsed.origin)
      .otherwise(() => undefined),
    url: `/${parsed.pathname.slice(1)}${parsed.search}`,
    headers,
    fetch,
  });
}
