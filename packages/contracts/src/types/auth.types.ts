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
      && !['0.0.0.0', '[::]', '[::1]', 'localhost'].includes(url.hostname)
      && !url.hostname.startsWith('127.') && !url.hostname.endsWith('.localhost');
  }, 'Use a reachable HTTP or HTTPS server origin').transform((url) => url.origin),
});

export const authPairResult = z.object({
  token: authToken,
  expiresAt: z.number().int(),
  qr: z.object({ payload: z.string(), svg: z.string() }),
});

export const authRedeemResult = z.object({ device, token: authToken });

export const authGrant = z.object({
  issuedBy: z.uuid().nullable(),
  expiresAt: z.number().int(),
  claimedAt: z.number().int().nullable(),
});

export type AuthRedeemInput = z.infer<typeof authRedeem>;
export type AuthPairInput = z.infer<typeof authPair>;
