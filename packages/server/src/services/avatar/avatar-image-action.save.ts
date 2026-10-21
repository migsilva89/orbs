import { AVATAR } from '@openbots/contracts/universal';
import { mkdir, writeFile } from 'node:fs/promises';
import { render } from 'takumi-js';
import { container, image } from 'takumi-js/helpers';
import { avatarImagePath } from './avatar-image.utils';
import { AVATAR_IMAGE } from './avatar.constants';
import type { AvatarImageDeps, AvatarImageSaveParams } from '../../types/avatar.types';

export async function avatarImageActionSave(deps: AvatarImageDeps, { file }: AvatarImageSaveParams) {
  const imageId = crypto.randomUUID();

  const bytes = await render(container({
    style: { width: AVATAR.size, height: AVATAR.size },
    children: [image({ src: imageId, style: { width: '100%', height: '100%', objectFit: 'cover' } })],
  }), {
    width: AVATAR.size,
    height: AVATAR.size,
    format: 'webp',
    quality: AVATAR_IMAGE.quality,
    images: [{ src: imageId, data: await file.arrayBuffer() }],
  });

  await mkdir(deps.root, { recursive: true, mode: 0o700 });
  await writeFile(await avatarImagePath(deps, { imageId }), bytes, { mode: 0o600, flag: 'wx' });

  return imageId;
}
