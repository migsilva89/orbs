import { limitActionAcquire } from './limit-action.acquire';
import { limitActionConfigure } from './limit-action.configure';
import { limitActionThrottle } from './limit-action.throttle';
import { limitQuerySettings } from './limit-query.settings';
import { LIMIT } from './limit.constants';
import { limitWindowsCreate } from './limit.utils';
import type * as LimitTypes from '../../types/limit.types';
import type { LimitConfigureInput } from '@repo/contracts/universal';

export function makeLimitService(deps: LimitTypes.LimitServiceDeps) {
  const runtime: LimitTypes.LimitRuntimeDeps = {
    ...deps,
    state: {
      settings: LIMIT.defaults,
      windows: limitWindowsCreate(LIMIT.defaults),
      rpcCount: 0,
      watchCount: 0,
      configure: Promise.resolve(),
    },
  };

  const ready = limitQuerySettings(deps).then((settings) => {
    runtime.state.settings = settings;
    runtime.state.windows = limitWindowsCreate(settings);
  });

  return {
    ready,
    throttle: async (params: LimitTypes.LimitThrottleParams) => {
      await ready;
      return limitActionThrottle(runtime, params);
    },
    acquire: (params: LimitTypes.LimitAcquireParams) => limitActionAcquire(runtime, params),
    actions: {
      configure: async (params: LimitConfigureInput) => {
        await ready;
        return limitActionConfigure(runtime, params);
      },
    },
    queries: {
      settings: () => limitQuerySettings(runtime),
    },
  };
}

export type LimitService = ReturnType<typeof makeLimitService>;
