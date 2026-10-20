import { createContext } from 'react';
import type { ConnectionContextValue } from '@/types/connection-context.types';

export const connectionContext = createContext<ConnectionContextValue | null>(null);
