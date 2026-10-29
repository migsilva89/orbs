import type { SettingsSection } from '@repo/contracts/universal';
import type { ComponentType } from 'react';

export interface SettingsNavItem {
  id: SettingsSection
  label: () => string
  description: () => string
  icon: ComponentType<{ className?: string }>
}
