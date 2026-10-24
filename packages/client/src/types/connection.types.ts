import type { ConnectionSaved, ServerAddress } from '@repo/contracts/universal';

export type ConnectionTarget = Pick<ConnectionSaved, 'serverId' | 'addresses'>;

export interface ConnectionPick {
  address: ServerAddress | null;
  isMismatch: boolean;
}
