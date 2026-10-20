import { createContext } from 'react';
import type { ToastContextValue } from '@/types/toast.types';

export const toastContext = createContext<ToastContextValue | null>(null);
