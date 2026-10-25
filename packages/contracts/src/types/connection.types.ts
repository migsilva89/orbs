import { z } from 'zod';
import { serverAddress } from './server.types';

export const connectionSaved = z.object({
  serverId: z.uuid(),
  addresses: z.array(serverAddress).min(1),
  deviceId: z.uuid(),
  token: z.string().min(1),
});

export const connectionStored = z.string().transform((text, context) => {
  try {
    return JSON.parse(text);
  } catch {
    context.addIssue({ code: 'custom', message: 'connection_invalid' });
    return z.NEVER;
  }
}).pipe(connectionSaved);

export const connectionPairingStored = z.string().transform((text, context) => {
  try {
    return JSON.parse(text);
  } catch {
    context.addIssue({ code: 'custom', message: 'connection_invalid' });
    return z.NEVER;
  }
}).pipe(connectionSaved.pick({ serverId: true, addresses: true }));

export const connectionPairForm = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1).max(100),
});

export const connectionLostReason = z.enum(['revoked', 'replaced']);

export const connectionSearch = z.object({ reason: connectionLostReason.optional().catch(undefined) });

export type ConnectionSaved = z.infer<typeof connectionSaved>;
export type ConnectionLostReason = z.infer<typeof connectionLostReason>;
export type ConnectionPairForm = z.infer<typeof connectionPairForm>;
