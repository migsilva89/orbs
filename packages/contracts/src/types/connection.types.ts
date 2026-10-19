import { z } from 'zod';

/** The device credential a client keeps after pairing. */
export const connectionSaved = z.object({
  serverUrl: z.url({ protocol: /^https?$/ }),
  serverId: z.uuid().optional(),
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

export const connectionPairForm = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1).max(100),
});

export type ConnectionSaved = z.infer<typeof connectionSaved>;
export type ConnectionPairForm = z.infer<typeof connectionPairForm>;
