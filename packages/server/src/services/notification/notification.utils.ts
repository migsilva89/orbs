import * as m from '@openbots/i18n/messages';
import { match } from 'ts-pattern';
import type { NotificationPresence } from '../../types/notification.types';
import type { NotificationItem, NotificationState } from '@openbots/contracts/universal';

export function notificationBody(item: NotificationItem) {
  return match(item.kind)
    .with('reply', () => m.rooms_notify_reply())
    .with('failure', () => m.rooms_notify_failed())
    .with('approval', () => m.rooms_notify_approval())
    .with('question', () => m.rooms_notify_question())
    .exhaustive();
}

export function notificationItems(state: NotificationState) {
  return [...state.recent, ...state.pending];
}

export function notificationActiveAt(presence: NotificationPresence) {
  return presence.seenAt - presence.idleMs;
}
