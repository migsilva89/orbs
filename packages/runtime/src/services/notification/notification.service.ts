import { notificationQueryWatch } from './notification-query.watch';
import type { NotificationServiceDeps } from '../../types/notification.types';
import type { Context } from '@earendil-works/chord/context';

export function makeNotificationService(deps: NotificationServiceDeps) {
  return {
    watch: (context: Context) => notificationQueryWatch(deps, context),
  };
}

export type NotificationService = ReturnType<typeof makeNotificationService>;
