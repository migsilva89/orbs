import { avatarActionSweep } from './avatar-action.sweep';
import { avatarSrc } from './avatar.utils';
import type { AvatarServiceDeps } from '../../types/avatar.types';
import type { AvatarUploadInput, BotAvatarImage } from '@openbots/contracts/universal';

export async function avatarActionUpload(deps: AvatarServiceDeps, { file }: AvatarUploadInput): Promise<BotAvatarImage> {
  await avatarActionSweep(deps);
  const imageId = await deps.images.actions.save({ file });

  return { kind: 'image', src: avatarSrc(imageId) };
}
