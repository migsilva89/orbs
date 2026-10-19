import { MemoryRateLimiter } from '@orpc/ratelimit/memory';
import { match, P } from 'ts-pattern';
import { LIMIT } from './limit.constants';
import type { LimitWindows } from '../../types/limit.types';
import type { LimitConfigureInput, LimitSettings, LimitWindow } from '@openbots/contracts/universal';

export function limitPeerKey(peer: string | null) {
  return match(peer)
    .with(P.union(null, ''), () => 'unknown')
    .otherwise((value) => value);
}

export function limitRetryAfterSeconds(reset: number) {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

export function limitWindowsCreate(settings: LimitSettings): LimitWindows {
  return {
    public: new MemoryRateLimiter({ maxRequests: settings.public.maxRequests, window: settings.public.windowMs }),
    redeem: new MemoryRateLimiter({ maxRequests: settings.redeem.maxRequests, window: settings.redeem.windowMs }),
    device: new MemoryRateLimiter({ maxRequests: settings.device.maxRequests, window: settings.device.windowMs }),
  };
}

export function limitWindowMerge(current: LimitWindow, patch: Partial<LimitWindow> | undefined): LimitWindow {
  return {
    maxRequests: patch?.maxRequests ?? current.maxRequests,
    windowMs: patch?.windowMs ?? current.windowMs,
  };
}

export function limitSettingsMerge(current: LimitSettings, patch: LimitConfigureInput): LimitSettings {
  return {
    public: limitWindowMerge(current.public, patch.public),
    redeem: limitWindowMerge(current.redeem, patch.redeem),
    device: limitWindowMerge(current.device, patch.device),
    rpcInFlight: patch.rpcInFlight ?? current.rpcInFlight,
    watchInFlight: patch.watchInFlight ?? current.watchInFlight,
  };
}

export function limitStoredSettings(value: string | undefined): LimitSettings {
  const stored = value === undefined ? {} : JSON.parse(value);

  return {
    public: limitWindowMerge(LIMIT.defaults.public, stored.public),
    redeem: limitWindowMerge(LIMIT.defaults.redeem, stored.redeem),
    device: limitWindowMerge(LIMIT.defaults.device, stored.device),
    rpcInFlight: stored.rpcInFlight ?? LIMIT.defaults.rpcInFlight,
    watchInFlight: stored.watchInFlight ?? LIMIT.defaults.watchInFlight,
  };
}
