import { z } from 'zod';
import type { DatabaseService } from '../services/database/database.service';

export interface AuthServiceDeps {
  database: DatabaseService;
}

export const authToken = z.string().regex(/^[a-f0-9]{64}$/);

export const authRedeem = z.object({
  token: authToken,
  name: z.string().trim().min(1).max(100),
});

export const authDeviceId = z.uuid();
export const authGrantStatus = authRedeem.pick({ token: true });

export const authPair = z.object({
  serverUrl: z.url({ protocol: /^https?$/ }).max(512).transform((value) => new URL(value)).refine((url) => {
    return !url.username && !url.password && !url.search && !url.hash && url.pathname === '/'
      && !['0.0.0.0', '[::]', '[::1]', 'localhost'].includes(url.hostname)
      && !url.hostname.startsWith('127.') && !url.hostname.endsWith('.localhost');
  }, 'Use a reachable HTTP or HTTPS server origin').transform((url) => url.origin),
});

export type AuthRedeemParams = z.infer<typeof authRedeem>;
export interface AuthGrantParams {
  issuedBy: string | null;
}
export type AuthPairParams = AuthGrantParams & z.infer<typeof authPair>;
export interface AuthTokenParams {
  token: string;
}
export interface AuthRevokeParams {
  id: string;
}
