import type { RpcSession } from '@/types/rpc.types';
import type { ConnectionSaved } from '@repo/contracts/universal';

export interface ConnectionContextValue {
  session: RpcSession | null;
  isLoading: boolean;
  error: string | null;
  connect: (connection: ConnectionSaved) => void;
  restore: () => Promise<void>;
}
