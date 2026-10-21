import { AVATAR } from '@openbots/contracts/universal';
import type { AvatarServiceDeps } from '../../types/avatar.types';
import type { BotGetInput } from '@openbots/contracts/universal';

export async function avatarQueryBot({ bots, images }: AvatarServiceDeps, params: BotGetInput) {
  const bot = await bots.queries.get(params);

  return images.queries.render({ avatar: bot.avatar, size: AVATAR.notificationSize });
}
