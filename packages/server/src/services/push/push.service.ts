import { pushActionRegister } from './push-action.register';
import { pushActionWatch } from './push-action.watch';
import type { PushRegisterParams, PushServiceDeps } from '../../types/push.types';

export function makePushService(deps: PushServiceDeps) {
  return {
    actions: {
      register: (params: PushRegisterParams) => pushActionRegister(deps, params),
      watch: () => pushActionWatch(deps),
    },
  };
}

export type PushService = ReturnType<typeof makePushService>;
