import { log } from '@openbots/logger/server';
import { PUSH } from './push.constants';
import { pushBody } from './push.utils';
import type { PushSendParams, PushServiceDeps } from '../../types/push.types';

export async function pushActionSend({ database, bots }: PushServiceDeps, { items }: PushSendParams): Promise<void> {
  const devices = await database.db.selectFrom('device').select('pushToken').where('pushToken', 'is not', null).execute();
  const preferences = await bots.queries.preferences();
  const names = new Map((await bots.queries.list()).map((bot) => [bot.id, bot.name]));
  const audible = items.filter((item) => preferences.get(item.botId)?.isMuted === false);

  const messages = devices.flatMap((device) => audible.map((item) => ({
    to: device.pushToken,
    title: names.get(item.botId),
    body: pushBody(item),
    sound: 'default',
    data: { botId: item.botId, conversationId: item.conversationId },
  })));

  if (messages.length === 0) {
    return;
  }

  try {
    const response = await fetch(PUSH.expoUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      log.warn({ tag: 'push', message: `Expo push failed with status ${response.status}` });
    }
  } catch (error) {
    log.warn({
      tag: 'push',
      message: 'Expo push could not be sent',
      error,
    });
  }
}
