import { SERVER_PROTOCOL } from '@repo/contracts/universal';
import { serverActionConfigure } from './server-action.configure';
import { serverQueryInfo } from './server-query.info';
import { serverQueryValidateConnection } from './server-query.validate-connection';
import { SERVER } from './server.constants';
import type { ServerConnectionParams, ServerServiceDeps } from '../../types/server.types';
import type { ServerConfigureInput } from '@repo/contracts/universal';

export function makeServerService(deps: ServerServiceDeps) {
  const identity = deps.settings.actions.ensure({ key: SERVER.idSetting, value: crypto.randomUUID() })
    .then((stored) => ({ id: stored.value, protocolVersion: SERVER_PROTOCOL.version }));

  const state = { ...deps, identity };

  return {
    actions: {
      configure: (params: ServerConfigureInput) => serverActionConfigure(state, params),
    },
    queries: {
      identity: async () => ({ ...await identity }),
      info: () => serverQueryInfo(state),
      validateConnection: async (params: ServerConnectionParams) => serverQueryValidateConnection({ identity: await identity }, params),
    },
  };
}

export type ServerService = ReturnType<typeof makeServerService>;
