import { SERVER_PROTOCOL, serverInfo } from '@repo/contracts/universal';
import { serverQueryValidateConnection } from './server-query.validate-connection';
import type { ServerConnectionParams, ServerServiceDeps } from '../../types/server.types';

export function makeServerService({ settings }: ServerServiceDeps) {
  const info = settings.actions.ensure({ key: 'server.id', value: crypto.randomUUID() })
    .then((stored) => serverInfo.parse({ id: stored.value, protocolVersion: SERVER_PROTOCOL.version }));

  return {
    queries: {
      info: async () => ({ ...await info }),
      validateConnection: async (params: ServerConnectionParams) => serverQueryValidateConnection({ info: await info }, params),
    },
  };
}

export type ServerService = ReturnType<typeof makeServerService>;
