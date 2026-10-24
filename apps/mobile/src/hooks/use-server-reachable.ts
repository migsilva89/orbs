import { useSyncExternalStore } from 'react';
import type { RpcSession } from '@/types/rpc.types';

export function useServerReachable({ reachability }: RpcSession) {
  return useSyncExternalStore(reachability.subscribe, reachability.isReachable);
}
