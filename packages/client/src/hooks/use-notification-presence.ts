import { useEffect, useEffectEvent } from 'react';
import { NOTIFICATION_PRESENCE } from '../services/notification/notification.constants';
import { useRpc } from './use-rpc';
import type { NotificationPresenceParams } from '../types/notification.types';

export function useNotificationPresence({ platform, isOpen, idleMs }: NotificationPresenceParams) {
  const { client } = useRpc();

  const report = useEffectEvent(() => {
    void client.notifications.presence({
      platform,
      isOpen,
      idleMs: Math.max(0, Math.round(idleMs())),
    }).catch(() => undefined);
  });

  useEffect(() => {
    report();
    const timer = setInterval(report, NOTIFICATION_PRESENCE.heartbeatMs);

    return () => clearInterval(timer);
  }, [isOpen]);
}
