import type { NotificationPresenceParams, NotificationServiceDeps } from '../../types/notification.types';

export function notificationActionPresence({ presences }: NotificationServiceDeps, presence: NotificationPresenceParams) {
  presences.set(presence.deviceId, { ...presence, seenAt: Date.now() });
}
