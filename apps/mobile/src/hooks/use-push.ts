import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { pushBotId, pushToken } from '@/services/push/push.client';
import { useConnection } from './use-connection';

export function usePush() {
  const router = useRouter();
  const { session } = useConnection();

  useEffect(() => {
    if (session) {
      void pushToken().then((token) => session.client.devices.push({ token })).catch(() => undefined);
    }
  }, [session]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const botId = pushBotId(response);

      if (botId) {
        router.push({ pathname: '/chat/[botId]', params: { botId } });
      }
    });

    return () => subscription.remove();
  }, [router]);
}
