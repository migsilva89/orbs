import { notificationItemKey } from '@openbots/runtime/server';
import { notificationQuerySettings } from './notification-query.settings';
import { NOTIFICATION } from './notification.constants';
import { notificationActiveAt } from './notification.utils';
import type { NotificationServiceDeps, NotificationTargetParams } from '../../types/notification.types';

export function notificationQueryTarget(deps: NotificationServiceDeps, { item }: NotificationTargetParams) {
  const key = notificationItemKey(item);
  const known = deps.targets.get(key);

  if (known) {
    return known;
  }

  const target = (async () => {
    const now = Date.now();
    const open = [...deps.presences.values()].filter((presence) => presence.isOpen && now - presence.seenAt < NOTIFICATION.openMs);

    const active = open
      .filter((presence) => now - notificationActiveAt(presence) < NOTIFICATION.idleMs)
      .sort((left, right) => notificationActiveAt(right) - notificationActiveAt(left))
      .at(0);

    if (active) {
      return active.deviceId;
    }

    const { prefer } = await notificationQuerySettings(deps);
    const devices = await deps.database.db.selectFrom('device').select('id').where('pushToken', 'is not', null).execute();

    const phone = devices
      .map((device) => device.id)
      .sort((left, right) => (deps.presences.get(right)?.seenAt ?? 0) - (deps.presences.get(left)?.seenAt ?? 0))
      .at(0);

    const computer = open.filter((presence) => presence.platform === 'computer').sort((left, right) => right.seenAt - left.seenAt).at(0)?.deviceId;

    return (prefer === 'phone' ? phone ?? computer : computer ?? phone) ?? null;
  })();

  deps.targets.set(key, target);

  if (deps.targets.size > NOTIFICATION.targetsMax) {
    deps.targets.delete(deps.targets.keys().next().value ?? key);
  }

  return target;
}
