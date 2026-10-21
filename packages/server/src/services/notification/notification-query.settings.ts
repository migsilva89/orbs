import { notificationPlatform } from '@openbots/contracts/universal';
import { NOTIFICATION } from './notification.constants';
import type { NotificationServiceDeps } from '../../types/notification.types';
import type { NotificationSettings } from '@openbots/contracts/universal';

export async function notificationQuerySettings({ settings }: NotificationServiceDeps): Promise<NotificationSettings> {
  const records = await settings.queries.get({ keys: [NOTIFICATION.preferSetting] });

  return { prefer: notificationPlatform.catch('phone').parse(records.at(0)?.value) };
}
