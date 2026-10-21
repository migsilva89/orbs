import { devicePushData } from '@openbots/contracts/universal';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function pushToken() {
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  const { granted } = await Notifications.requestPermissionsAsync();

  if (!projectId || !granted) {
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });

  return data;
}

export function pushBotId(response: Notifications.NotificationResponse) {
  return devicePushData.safeParse(response.notification.request.content.data).data?.botId;
}
