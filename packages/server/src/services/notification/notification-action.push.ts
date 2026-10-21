import type { NotificationPushParams, NotificationServiceDeps } from '../../types/notification.types';

export async function notificationActionPush({ database }: NotificationServiceDeps, { deviceId, token, url }: NotificationPushParams): Promise<void> {
  await database.db.transaction().execute(async (tx) => {
    if (token) {
      await tx.updateTable('device').set({ pushToken: null, pushUrl: null }).where('pushToken', '=', token).execute();
    }

    await tx.updateTable('device').set({ pushToken: token, pushUrl: url }).where('id', '=', deviceId).execute();
  });
}
