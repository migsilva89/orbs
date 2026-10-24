import { useNotificationPresence } from '@repo/client/react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { pushBotId, pushToken } from '@/services/push/push.client';
import { useConnection } from './use-connection';

export function usePush() {
  const router = useRouter();
  const { session } = useConnection();

  useEffect(() => {
    if (session) {
      void pushToken().then((token) => session.client.notifications.push({ token, url: session.address().url })).catch(() => undefined);
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

export function usePushPresence() {
  const [isOpen, setIsOpen] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setIsOpen(state === 'active'));

    return () => subscription.remove();
  }, []);

  useNotificationPresence({
    platform: 'phone',
    isOpen,
    idleMs: () => 0,
  });
}
