import { z } from 'zod';

export const SERVER_PROTOCOL = {
  version: 1,
  versionHeader: 'x-bots-protocol',
  serverIdHeader: 'x-bots-server-id',
} as const;

/** An HTTP or HTTPS origin another device can dial: no path, credentials or wildcard host. */
export const serverOrigin = z.url({ protocol: /^https?$/ }).max(512).transform((value) => new URL(value)).refine((url) => {
  return !url.username && !url.password && !url.search && !url.hash && url.pathname === '/'
    && !['0.0.0.0', '[::]'].includes(url.hostname);
}, 'Use a reachable HTTP or HTTPS server origin').transform((url) => url.origin);

export const serverAddressKind = z.enum(['loopback', 'lan', 'tailscale', 'custom']);

/** One way to reach a daemon. Clients try addresses in list order. */
export const serverAddress = z.object({
  url: serverOrigin,
  kind: serverAddressKind,
});

export const serverInfo = z.object({
  id: z.uuid(),
  protocolVersion: z.number().int().positive(),
  addresses: z.array(serverAddress),
});

export const serverHealth = z.object({
  status: z.literal('ok'),
  app: z.literal('bots'),
  id: z.uuid(),
});

export const serverConfigure = z.object({
  customAddresses: z.array(serverOrigin).max(20),
});

export type ServerAddress = z.infer<typeof serverAddress>;
export type ServerAddressKind = z.infer<typeof serverAddressKind>;
export type ServerInfo = z.infer<typeof serverInfo>;
export type ServerConfigureInput = z.infer<typeof serverConfigure>;
export type ServerHealth = z.infer<typeof serverHealth>;
