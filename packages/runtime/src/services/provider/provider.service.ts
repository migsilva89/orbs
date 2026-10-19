import { providerActionCancel } from './provider-action.cancel';
import { providerActionCancelDevice } from './provider-action.cancel-device';
import { providerActionComplete } from './provider-action.complete';
import { providerActionLogin } from './provider-action.login';
import { providerActionLogout } from './provider-action.logout';
import { providerQueryList } from './provider-query.list';
import { providerQuerySession } from './provider-query.session';
import { providerClose } from './provider.utils';
import type * as ProviderTypes from '../../types/provider.types';

export function makeProviderService({ models }: ProviderTypes.ProviderServiceParams) {
  const deps: ProviderTypes.ProviderServiceDeps = { models, sessions: new Map() };

  return {
    actions: {
      login: (params: ProviderTypes.ProviderLoginParams) => providerActionLogin(deps, params),
      complete: (params: ProviderTypes.ProviderCompleteParams) => providerActionComplete(deps, params),
      cancel: (params: ProviderTypes.ProviderCancelParams) => providerActionCancel(deps, params),
      logout: (params: ProviderTypes.ProviderLogoutParams) => providerActionLogout(deps, params),
      cancelDevice: (params: ProviderTypes.ProviderCancelDeviceParams) => providerActionCancelDevice(deps, params),
    },
    queries: {
      list: (params: ProviderTypes.ProviderListParams) => providerQueryList(deps, params),
      session: (params: ProviderTypes.ProviderSessionParams) => providerQuerySession(deps, params),
    },
    close: () => providerClose(deps),
  };
}

export type ProviderService = ReturnType<typeof makeProviderService>;
