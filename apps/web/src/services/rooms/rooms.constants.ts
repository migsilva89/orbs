import { m } from '@openbots/i18n/client';
import type { ConversationWhenBusy } from '@openbots/contracts/universal';

export const ROOMS_MUTE_DURATIONS = [
  { duration: 60 * 60 * 1000, label: m.rooms_mute_1h },
  { duration: 8 * 60 * 60 * 1000, label: m.rooms_mute_8h },
  { duration: 24 * 60 * 60 * 1000, label: m.rooms_mute_24h },
  { duration: null, label: m.rooms_mute_forever },
] as const;

export const ROOMS_DRAG_PRESS = { delay: 250, tolerance: 5 };

export const ROOMS = {
  searchDebounceMs: 200,
  searchShortcuts: 9,
  searchSkeletonRows: 3,
  searchContextChars: 40,
  quickReactions: ['👍', '👎', '❤️', '😂', '🎉', '😮'],
  emojiSlowMs: 6000,
  emojiSkeletonCells: 40,
  copiedMs: 2000,
  quoteDelayMs: 1200,
  unreadSeenMs: 2500,
  mediaRecentMs: 7 * 24 * 60 * 60 * 1000,
  routinesRefreshMs: 60_000,
  showToolsKey: 'openbots.show-tools',
  draftKeyPrefix: 'openbots.draft.',
  notifyIcon: '/img/favicon/web-app-manifest-192x192.png',
  chime: { notesHz: [660, 880], noteSeconds: 0.12, volume: 0.12, fadeTo: 0.0001, closeMs: 1000 },
  recommendedChoice: '(Recommended)',
  timeGapMs: 60 * 60 * 1000,
  dayMs: 24 * 60 * 60 * 1000,
  weekDays: 7,
} as const;

export const ROOMS_SEND_MODE_HINTS = {
  followUp: m.rooms_send_queue_hint,
  steer: m.rooms_send_steer_hint,
  interrupt: m.rooms_send_interrupt_hint,
} satisfies Record<ConversationWhenBusy, () => string>;

export const ROOMS_SEND_MODE_DEFAULT = 'default';

export const ROOMS_SEND_MODES = {
  followUp: m.rooms_send_queue,
  steer: m.rooms_send_steer,
  interrupt: m.rooms_send_interrupt,
} satisfies Record<ConversationWhenBusy, () => string>;

export const ROOMS_APPROVAL_CHOICES = [
  { approved: true, label: m.rooms_chat_approval_once },
  { approved: false, label: m.rooms_chat_approval_deny },
] as const;
