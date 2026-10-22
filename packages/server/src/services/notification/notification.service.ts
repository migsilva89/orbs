import { notificationActionConfigure } from './notification-action.configure';
import { notificationActionPresence } from './notification-action.presence';
import { notificationActionPush } from './notification-action.push';
import { notificationActionWatch } from './notification-action.watch';
import { notificationQuerySettings } from './notification-query.settings';
import { notificationQueryTarget } from './notification-query.target';
import type * as NotificationTypes from '../../types/notification.types';
import type { NotificationConfigureInput } from '@repo/contracts/universal';

export function makeNotificationService(params: NotificationTypes.NotificationServiceParams) {
  const deps: NotificationTypes.NotificationServiceDeps = { ...params, presences: new Map(), targets: new Map() };

  return {
    actions: {
      push: (input: NotificationTypes.NotificationPushParams) => notificationActionPush(deps, input),
      presence: (input: NotificationTypes.NotificationPresenceParams) => notificationActionPresence(deps, input),
      configure: (input: NotificationConfigureInput) => notificationActionConfigure(deps, input),
      watch: () => notificationActionWatch(deps),
    },
    queries: {
      settings: () => notificationQuerySettings(deps),
      target: (input: NotificationTypes.NotificationTargetParams) => notificationQueryTarget(deps, input),
    },
  };
}

export type NotificationService = ReturnType<typeof makeNotificationService>;
