import { createContext } from 'react';
import type { RpcContextValue } from '../types/rpc.types';

export const rpcContext = createContext<RpcContextValue | null>(null);
