import { rm } from 'node:fs/promises';
import { avatarImagePath } from './avatar-image.utils';
import type { AvatarImageDeps, AvatarImageParams } from '../../types/avatar.types';

export async function avatarImageActionRemove(deps: AvatarImageDeps, params: AvatarImageParams) {
  await rm(await avatarImagePath(deps, params), { force: true });
}
