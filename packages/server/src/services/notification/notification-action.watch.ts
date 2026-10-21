import { log } from '@openbots/logger/server';
import { notificationItemKey } from '@openbots/runtime/server';
import { notificationActionSend } from './notification-action.send';
import { notificationQueryTarget } from './notification-query.target';
import { notificationItems } from './notification.utils';
import type { NotificationServiceDeps } from '../../types/notification.types';
import type { NotificationItem } from '@openbots/contracts/universal';

export async function notificationActionWatch(deps: NotificationServiceDeps) {
  const watch = await deps.runtime.watchNotifications();
  let sent = new Set(notificationItems(watch.state.value).map(notificationItemKey));

  const notificationDeliver = async (items: NotificationItem[]) => {
    try {
      const preferences = await deps.bots.queries.preferences();
      const audible = items.filter((item) => preferences.get(item.botId)?.isMuted === false);
      const targets = await Promise.all(audible.map((item) => notificationQueryTarget(deps, { item })));
      const devices = await deps.database.db.selectFrom('device').select(['id', 'pushToken', 'pushUrl']).where('pushToken', 'is not', null).execute();

      await Promise.all(devices.map(async (device) => {
        const mine = audible.filter((_, index) => targets[index] === device.id);

        if (device.pushToken && mine.length > 0) {
          await notificationActionSend(deps, {
            token: device.pushToken,
            url: device.pushUrl,
            items: mine,
          });
        }
      }));
    } catch (error) {
      log.warn({
        tag: 'notification',
        message: 'Notifications could not be delivered',
        error,
      });
    }
  };

  const unsubscribe = watch.state.subscribe((state) => {
    const items = notificationItems(state);
    const fresh = items.filter((item) => !sent.has(notificationItemKey(item)));
    sent = new Set(items.map(notificationItemKey));

    if (fresh.length > 0) {
      void notificationDeliver(fresh);
    }
  });

  return async () => {
    unsubscribe();
    await watch.stop();
  };
}
