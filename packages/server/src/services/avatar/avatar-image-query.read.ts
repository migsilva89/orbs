import { Errors } from '@repo/errors/universal';
import { readFile } from 'node:fs/promises';
import { match } from 'ts-pattern';
import { avatarImagePath } from './avatar-image.utils';
import type { AvatarImageDeps, AvatarImageParams } from '../../types/avatar.types';

export async function avatarImageQueryRead(deps: AvatarImageDeps, params: AvatarImageParams) {
  try {
    return new Uint8Array(await readFile(await avatarImagePath(deps, params)));
  } catch (error) {
    return match(error)
      .with({ code: 'ENOENT' }, () => {
        throw new Errors.NOT_FOUND({ resource: 'avatar' });
      })
      .otherwise(() => {
        throw error;
      });
  }
}
