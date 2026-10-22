import { avatarImageId } from '@repo/contracts/universal';
import { Errors } from '@repo/errors/universal';
import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AVATAR_IMAGE } from './avatar.constants';
import type { AvatarImageDeps, AvatarImageParams } from '../../types/avatar.types';

export async function avatarImagePath({ root }: AvatarImageDeps, { imageId }: AvatarImageParams) {
  if (!avatarImageId.safeParse(imageId).success) {
    throw new Errors.NOT_FOUND({ resource: 'avatar' });
  }

  return resolve(await realpath(root), `${imageId}${AVATAR_IMAGE.extension}`);
}
