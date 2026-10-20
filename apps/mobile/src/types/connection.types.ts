import type { AuthPairPayload } from '@openbots/contracts/universal';

export interface ConnectionPairParams {
  payload: AuthPairPayload;
  name: string;
}
