import { Errors } from '@openbots/errors/universal';
import { match } from 'ts-pattern';
import type { ServerConnectionParams, ServerQueryDeps } from '../../types/server.types';

export function serverQueryValidateConnection({ info }: ServerQueryDeps, params: ServerConnectionParams) {
  match(params.protocolVersion === String(info.protocolVersion))
    .with(false, () => {
      throw new Errors.PROTOCOL_MISMATCH({ supportedVersion: info.protocolVersion, receivedVersion: params.protocolVersion });
    })
    .with(true, () => undefined)
    .exhaustive();

  match(params.serverId)
    .with(null, info.id, () => undefined)
    .otherwise(() => {
      throw new Errors.SERVER_MISMATCH();
    });
}
