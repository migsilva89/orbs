import { notificationPushData } from '@openbots/contracts/universal';
import { configureNotificationExtension } from '@pierrecapo/expo-notification-service-extension';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PUSH_EXTENSION } from './push.constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function pushToken() {
  if (Platform.OS === 'ios') {
    configureNotificationExtension(PUSH_EXTENSION);
  }

  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  const { granted } = await Notifications.requestPermissionsAsync();

  if (!projectId || !granted) {
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });

  return data;
}

export function pushBotId(response: Notifications.NotificationResponse) {
  return notificationPushData.safeParse(response.notification.request.content.data).data?.botId;
}
