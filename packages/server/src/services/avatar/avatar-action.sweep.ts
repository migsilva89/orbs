import { AVATAR_IMAGE } from './avatar.constants';
import { avatarImageIdFromSrc } from './avatar.utils';
import type { AvatarServiceDeps } from '../../types/avatar.types';

export async function avatarActionSweep({ bots, images }: AvatarServiceDeps) {
  const used = new Set((await bots.queries.list()).flatMap((bot) => (bot.avatar?.kind === 'image' ? [avatarImageIdFromSrc(bot.avatar.src)] : [])));
  const entries = await images.queries.list();
  const stale = entries.filter((entry) => !used.has(entry.imageId) && entry.modifiedAt + AVATAR_IMAGE.pendingTtlMs <= Date.now());

  await Promise.all(stale.map((entry) => images.actions.remove(entry)));
}
