import type { SettingsService } from '../services/settings/settings.service';
import type { RateLimiter } from '@orpc/ratelimit';
import type { LimitSettings } from '@repo/contracts/universal';

export interface LimitServiceDeps {
  settings: SettingsService;
}

export interface LimitWindows {
  public: RateLimiter;
  redeem: RateLimiter;
  device: RateLimiter;
}

export interface LimitServiceState {
  settings: LimitSettings;
  windows: LimitWindows;
  rpcCount: number;
  watchCount: number;
  configure: Promise<void>;
}

export interface LimitRuntimeDeps extends LimitServiceDeps {
  state: LimitServiceState;
}

export type LimitThrottleParams =
  | { kind: 'public'; peer: string | null }
  | { kind: 'redeem'; peer: string | null }
  | { kind: 'device'; deviceId: string };

export interface LimitAcquireParams {
  kind: 'rpc' | 'watch';
}

export interface LimitLease {
  release: () => void;
}
