import { createContext } from 'react';
import type { AppearanceContextValue } from '@/types/appearance.types';

export const appearanceContext = createContext<AppearanceContextValue | null>(null);
