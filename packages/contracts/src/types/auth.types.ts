import { z } from 'zod';
import { device } from './device.types';

export const authToken = z.string().regex(/^[a-f0-9]{64}$/);

export const authRedeem = z.object({
  token: authToken,
  name: z.string().trim().min(1).max(100),
});

export const authGrantStatus = authRedeem.pick({ token: true });

export const authPair = z.object({
  serverUrl: z.url({ protocol: /^https?$/ }).max(512).transform((value) => new URL(value)).refine((url) => {
    return !url.username && !url.password && !url.search && !url.hash && url.pathname === '/'
      && !['0.0.0.0', '[::]'].includes(url.hostname);
  }, 'Use a reachable HTTP or HTTPS server origin').transform((url) => url.origin),
});

export const authPairResult = z.object({
  token: authToken,
  expiresAt: z.number().int(),
  qr: z.object({ payload: z.string(), svg: z.string() }),
});

export const authPairPayload = z.object({
  version: z.literal(1),
  serverUrl: z.url({ protocol: /^https?$/ }),
  token: authToken,
  expiresAt: z.number().int(),
});

/** The URL-safe Base64 pairing payload a new device scans or pastes. */
export const authPairCode = z.string().trim().transform((code, context) => {
  try {
    return JSON.parse(atob(code.replaceAll('-', '+').replaceAll('_', '/'))) as z.input<typeof authPairPayload>;
  } catch {
    context.addIssue({ code: 'custom', message: 'connect_code_invalid' });
    return z.NEVER;
  }
}).pipe(authPairPayload);

export const authRedeemResult = z.object({ device, token: authToken });

export const authGrant = z.object({
  issuedBy: z.uuid().nullable(),
  expiresAt: z.number().int(),
  claimedAt: z.number().int().nullable(),
});

export type AuthRedeemInput = z.infer<typeof authRedeem>;
export type AuthPairInput = z.infer<typeof authPair>;
export type AuthPairPayload = z.infer<typeof authPairPayload>;
