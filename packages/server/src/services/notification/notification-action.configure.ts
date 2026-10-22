import { notificationQuerySettings } from './notification-query.settings';
import { NOTIFICATION } from './notification.constants';
import type { NotificationServiceDeps } from '../../types/notification.types';
import type { NotificationConfigureInput } from '@repo/contracts/universal';

export async function notificationActionConfigure(deps: NotificationServiceDeps, { prefer }: NotificationConfigureInput) {
  await deps.settings.actions.set({ records: prefer ? [{ key: NOTIFICATION.preferSetting, value: prefer }] : [] });

  return notificationQuerySettings(deps);
}
