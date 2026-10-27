import { z } from 'zod';

export const settingsSection = z.enum(['general', 'chat', 'models', 'tools', 'secrets', 'sources', 'server', 'devices', 'desktop']);

export type SettingsSection = z.infer<typeof settingsSection>;
