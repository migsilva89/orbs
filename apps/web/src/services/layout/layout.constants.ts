import { m } from '@repo/i18n/client';
import IconBot from '~icons/lucide/bot';
import IconLayoutDashboard from '~icons/lucide/layout-dashboard';
import IconSettings from '~icons/lucide/settings';
import type { LayoutMenuItem } from '@/types/layout.types';

export const LAYOUT_MOBILE_BREAKPOINT = 768;

export const LAYOUT_INSTALL_DISMISSED_KEY = 'bots.install-dismissed';

export const LAYOUT_PULL_REFRESH = {
  threshold: 96,
  topEdge: 112,
  ignore: 'button, a, input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"], [data-vaul-overlay], pre, table',
} as const;

export const LAYOUT_SHORTCUTS = {
  newChat: 'mod+n',
  search: 'mod+k',
  previousRoom: 'alt+up',
  nextRoom: 'alt+down',
  stop: 'escape',
} as const;

export const LAYOUT_SHORTCUT_OVERLAYS = '[role=dialog], [role=menu], [role=listbox], [data-slot=prompt-input-editor-list]';

export const LAYOUT_SHORTCUT_OPTIONS = { preventDefault: true, enableOnFormTags: true, enableOnContentEditable: true } as const;

export const LAYOUT_SIDEBAR_COOKIES = { rooms: 'sidebar_state', details: 'details_state' } as const;

export const LAYOUT_MENU: LayoutMenuItem[] = [
  { icon: IconSettings, label: m.layout_settings, link: '/settings' },
  { icon: IconBot, label: m.layout_bots, link: '/bots' },
  { icon: IconLayoutDashboard, label: m.layout_artifacts, link: '/artifacts' },
];
