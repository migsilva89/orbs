import { serverNetworkQueryAddresses } from './server-network-query.addresses';
import type { ServerNetworkDeps } from '../../types/server.types';

export function makeServerNetworkService(deps: ServerNetworkDeps) {
  return {
    queries: {
      addresses: () => serverNetworkQueryAddresses(deps),
    },
  };
}

export type ServerNetworkService = ReturnType<typeof makeServerNetworkService>;
