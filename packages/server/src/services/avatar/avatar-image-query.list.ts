import { avatarImageId } from '@openbots/contracts/universal';
import { readdir, stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { match } from 'ts-pattern';
import { AVATAR_IMAGE } from './avatar.constants';
import type { AvatarImageDeps, AvatarImageEntry } from '../../types/avatar.types';

export async function avatarImageQueryList({ root }: AvatarImageDeps): Promise<AvatarImageEntry[]> {
  try {
    const names = await readdir(root);
    const imageIds = names.map((name) => basename(name, AVATAR_IMAGE.extension)).filter((imageId) => avatarImageId.safeParse(imageId).success);

    return await Promise.all(imageIds.map(async (imageId) => ({
      imageId,
      modifiedAt: (await stat(resolve(root, `${imageId}${AVATAR_IMAGE.extension}`))).mtimeMs,
    })));
  } catch (error) {
    return match(error)
      .with({ code: 'ENOENT' }, () => [])
      .otherwise(() => {
        throw error;
      });
  }
}
