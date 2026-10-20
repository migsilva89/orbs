import type { AuthPairPayload } from '@openbots/contracts/universal';

export interface ConnectionFileParams {
  botId: string;
  attachmentId: string;
}

export interface ConnectionPairParams {
  payload: AuthPairPayload;
  name: string;
}
