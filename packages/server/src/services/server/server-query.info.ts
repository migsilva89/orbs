import { serverInfo } from '@repo/contracts/universal';
import { SERVER } from './server.constants';
import type { ServerServiceState } from '../../types/server.types';

export async function serverQueryInfo({ identity, network, settings }: ServerServiceState) {
  const [{ id, protocolVersion }, detected, stored] = await Promise.all([
    identity,
    network.queries.addresses(),
    settings.queries.get({ keys: [SERVER.customAddressesSetting] }),
  ]);

  const custom: string[] = JSON.parse(stored.find(({ key }) => key === SERVER.customAddressesSetting)?.value ?? '[]');

  return serverInfo.parse({
    id,
    protocolVersion,
    addresses: [...detected, ...custom.map((url) => ({ url, kind: 'custom' }))],
  });
}
