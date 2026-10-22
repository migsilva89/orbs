import { AVATAR } from '@repo/contracts/universal';
import { AVATAR_IMAGE } from './avatar.constants';

export function avatarSrc(imageId: string) {
  return `${AVATAR.pathPrefix}${imageId}${AVATAR_IMAGE.extension}`;
}

export function avatarImageIdFromSrc(src: string) {
  return src.slice(AVATAR.pathPrefix.length, -AVATAR_IMAGE.extension.length);
}
