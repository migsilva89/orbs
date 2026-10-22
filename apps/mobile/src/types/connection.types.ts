import type { AuthPairPayload, ConnectionSaved } from '@repo/contracts/universal';

export interface ConnectionAvatarParams {
  connection: Pick<ConnectionSaved, 'serverUrl'> | undefined;
  src: string;
}

export interface ConnectionFileParams {
  botId: string;
  attachmentId: string;
}

export interface ConnectionPairParams {
  payload: AuthPairPayload;
  name: string;
}
