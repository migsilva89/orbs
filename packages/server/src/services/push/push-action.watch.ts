import { notificationItemKey } from '@openbots/runtime/server';
import { pushActionSend } from './push-action.send';
import { pushItems } from './push.utils';
import type { PushServiceDeps } from '../../types/push.types';

export async function pushActionWatch(deps: PushServiceDeps) {
  const watch = await deps.runtime.watchNotifications();
  let sent = new Set(pushItems(watch.state.value).map(notificationItemKey));

  const unsubscribe = watch.state.subscribe((state) => {
    const items = pushItems(state);
    const fresh = items.filter((item) => !sent.has(notificationItemKey(item)));
    sent = new Set(items.map(notificationItemKey));

    if (fresh.length > 0) {
      void pushActionSend(deps, { items: fresh });
    }
  });

  return async () => {
    unsubscribe();
    await watch.stop();
  };
}
