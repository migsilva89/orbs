import { z } from 'zod';

export const SERVER_PROTOCOL = {
  version: 1,
  versionHeader: 'x-bots-protocol',
  serverIdHeader: 'x-bots-server-id',
} as const;

export const serverInfo = z.object({
  id: z.uuid(),
  protocolVersion: z.number().int().positive(),
});

export type ServerInfo = z.infer<typeof serverInfo>;
