import { AVATAR } from '@openbots/contracts/universal';
import { log } from '@openbots/logger/server';
import { NOTIFICATION } from './notification.constants';
import { notificationBody } from './notification.utils';
import type { NotificationSendParams, NotificationServiceDeps } from '../../types/notification.types';

export async function notificationActionSend({ bots }: NotificationServiceDeps, { token, url, items }: NotificationSendParams): Promise<void> {
  const byId = new Map((await bots.queries.list()).map((bot) => [bot.id, bot]));

  const messages = items.map((item) => ({
    to: token,
    title: byId.get(item.botId)?.name,
    body: notificationBody(item),
    sound: 'default',
    mutableContent: true,
    data: {
      botId: item.botId,
      conversationId: item.conversationId,
      avatar: url ? new URL(`${AVATAR.pathPrefix}bots/${item.botId}.png?v=${byId.get(item.botId)?.updatedAt ?? 0}`, url).toString() : undefined,
    },
  }));

  try {
    const response = await fetch(NOTIFICATION.expoUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      log.warn({ tag: 'notification', message: `Expo push failed with status ${response.status}` });
    }
  } catch (error) {
    log.warn({
      tag: 'notification',
      message: 'Expo push could not be sent',
      error,
    });
  }
}
