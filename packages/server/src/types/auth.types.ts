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

export type AuthRedeemParams = z.infer<typeof authRedeem>;
export interface AuthGrantParams {
  issuedBy: string | null;
}
export interface AuthTokenParams {
  token: string;
}
export interface AuthRevokeParams {
  id: string;
}
