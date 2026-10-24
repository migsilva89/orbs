import { serverQueryInfo } from './server-query.info';
import { SERVER } from './server.constants';
import type { ServerServiceState } from '../../types/server.types';
import type { ServerConfigureInput } from '@repo/contracts/universal';

export async function serverActionConfigure(deps: ServerServiceState, { customAddresses }: ServerConfigureInput) {
  await deps.settings.actions.set({
    records: [{ key: SERVER.customAddressesSetting, value: JSON.stringify([...new Set(customAddresses)]) }],
  });

  return serverQueryInfo(deps);
}
