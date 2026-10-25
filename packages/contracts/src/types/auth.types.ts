import { z } from 'zod';
import { device } from './device.types';
import { serverAddress } from './server.types';

export const authToken = z.string().regex(/^[a-f0-9]{64}$/);

/** The six-digit code a paired device or the CLI shows for adding another device. */
export const authPin = z.string().trim().regex(/^\d{6}$/u);

export const authRedeem = z.object({
  pin: authPin,
  name: z.string().trim().min(1).max(100),
});

export const authPairResult = z.object({
  pin: authPin,
  expiresAt: z.number().int(),
  qr: z.object({ payload: z.string(), svg: z.string() }),
});

export const authPairPayload = z.object({
  version: z.literal(3),
  serverId: z.uuid(),
  addresses: z.array(serverAddress).min(1),
  pin: authPin,
});

/** The URL-safe Base64 pairing payload a new device scans or opens as a link: the PIN plus where the daemon is. */
export const authPairCode = z.string().trim().transform((code, context) => {
  try {
    return JSON.parse(atob(code.replaceAll('-', '+').replaceAll('_', '/'))) as z.input<typeof authPairPayload>;
  } catch {
    context.addIssue({ code: 'custom', message: 'connect_code_invalid' });
    return z.NEVER;
  }
}).pipe(authPairPayload);

/** What a person enters to pair: a typed PIN, or a pairing code that also names the daemon. */
export const authPairEntry = z.union([
  authPin.transform((pin) => ({ pin, target: null })),
  authPairCode.transform(({ pin, serverId, addresses }) => ({ pin, target: { serverId, addresses } })),
]);

export const authRedeemResult = z.object({
  device,
  token: authToken,
  serverId: z.uuid(),
  addresses: z.array(serverAddress).min(1),
});

export type AuthRedeemInput = z.infer<typeof authRedeem>;
export type AuthPairPayload = z.infer<typeof authPairPayload>;
export type AuthPairEntry = z.infer<typeof authPairEntry>;
