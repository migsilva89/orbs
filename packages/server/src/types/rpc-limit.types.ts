import type { AuthService } from '../services/auth/auth.service';
import type { LimitService } from '../services/limit/limit.service';

export interface RpcLimitOutputParams<T> {
  limits: LimitService;
  auth: AuthService;
  deviceId: string;
  authorization: string | null | undefined;
  output: T;
  signal: AbortSignal | undefined;
}
