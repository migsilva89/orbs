import * as SecureStore from 'expo-secure-store';
import { Uniwind } from 'uniwind';
import { APPEARANCE_CHOICES, APPEARANCE_STORAGE_KEY } from './appearance.constants';
import type { AppearanceChoice } from '@/types/appearance.types';

export function appearanceRead(): AppearanceChoice {
  const saved = SecureStore.getItem(APPEARANCE_STORAGE_KEY);

  return APPEARANCE_CHOICES.find((choice) => choice === saved) ?? 'system';
}

export function appearanceSave(choice: AppearanceChoice) {
  SecureStore.setItem(APPEARANCE_STORAGE_KEY, choice);
  Uniwind.setTheme(choice);
}
