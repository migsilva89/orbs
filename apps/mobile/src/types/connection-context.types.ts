import type { rpcClientCreate } from '@/services/rpc/rpc.client';
import type { ConnectionSaved } from '@openbots/contracts/universal';

export interface ConnectionContextValue {
  session: ReturnType<typeof rpcClientCreate> | null;
  isLoading: boolean;
  error: string | null;
  connect: (connection: ConnectionSaved) => void;
  restore: () => Promise<void>;
}
