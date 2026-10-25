import { z } from 'zod';
import { serverAddress } from './server.types';

/** The device credential a client keeps after pairing. */
export const connectionSaved = z.object({
  serverId: z.uuid(),
  addresses: z.array(serverAddress).min(1),
  deviceId: z.uuid(),
  token: z.string().min(1),
});

export const connectionStored = z.string().transform((text, context) => {
  try {
    return JSON.parse(text) as z.input<typeof connectionSaved>;
  } catch {
    context.addIssue({ code: 'custom', message: 'connection_invalid' });
    return z.NEVER;
  }
}).pipe(connectionSaved);

/** The daemon a browser is pairing with, kept until it has a device credential. */
export const connectionPairingStored = z.string().transform((text, context) => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    context.addIssue({ code: 'custom', message: 'connection_invalid' });
    return z.NEVER;
  }
}).pipe(connectionSaved.pick({ serverId: true, addresses: true }));

export const connectionPairForm = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1).max(100),
});

/** Why a client dropped its saved connection: this device was revoked, or the server was reset or replaced. */
export const connectionLostReason = z.enum(['revoked', 'replaced']);

export const connectSearch = z.object({ reason: connectionLostReason.optional().catch(undefined) });

export type ConnectionSaved = z.infer<typeof connectionSaved>;
export type ConnectionLostReason = z.infer<typeof connectionLostReason>;
export type ConnectionPairForm = z.infer<typeof connectionPairForm>;
