import { m } from '@repo/i18n/client';
import IconCpu from '~icons/lucide/cpu';
import IconFolderTree from '~icons/lucide/folder-tree';
import IconLaptop from '~icons/lucide/laptop';
import IconLock from '~icons/lucide/lock';
import IconMessageSquare from '~icons/lucide/message-square';
import IconMonitor from '~icons/lucide/monitor';
import IconServer from '~icons/lucide/server';
import IconSettings from '~icons/lucide/settings';
import IconShieldCheck from '~icons/lucide/shield-check';
import type { SettingsNavItem } from '@/types/settings.types';

export const SETTINGS_NAV: SettingsNavItem[] = [
  { id: 'general', label: m.settings_general, description: m.settings_general_hint, icon: IconSettings },
  { id: 'chat', label: m.settings_chat, description: m.settings_chat_hint, icon: IconMessageSquare },
  { id: 'models', label: m.settings_models_title, description: m.settings_models_hint, icon: IconCpu },
  { id: 'tools', label: m.settings_tools, description: m.settings_tools_hint, icon: IconShieldCheck },
  { id: 'secrets', label: m.settings_secrets, description: m.settings_secrets_hint, icon: IconLock },
  { id: 'sources', label: m.settings_sources, description: m.settings_sources_hint, icon: IconFolderTree },
  { id: 'server', label: m.settings_server, description: m.settings_server_hint, icon: IconServer },
  { id: 'devices', label: m.settings_devices, description: m.settings_devices_hint, icon: IconLaptop },
  { id: 'desktop', label: m.settings_desktop, description: m.settings_desktop_hint, icon: IconMonitor },
];
