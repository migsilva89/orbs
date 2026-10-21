import { avatarImageActionRemove } from './avatar-image-action.remove';
import { avatarImageActionSave } from './avatar-image-action.save';
import { avatarImageQueryList } from './avatar-image-query.list';
import { avatarImageQueryRead } from './avatar-image-query.read';
import { avatarImageQueryRender } from './avatar-image-query.render';
import type * as AvatarTypes from '../../types/avatar.types';

export function makeAvatarImageService(deps: AvatarTypes.AvatarImageDeps) {
  return {
    actions: {
      save: (params: AvatarTypes.AvatarImageSaveParams) => avatarImageActionSave(deps, params),
      remove: (params: AvatarTypes.AvatarImageParams) => avatarImageActionRemove(deps, params),
    },
    queries: {
      read: (params: AvatarTypes.AvatarImageParams) => avatarImageQueryRead(deps, params),
      list: () => avatarImageQueryList(deps),
      render: (params: AvatarTypes.AvatarImageRenderParams) => avatarImageQueryRender(deps, params),
    },
  };
}

export type AvatarImageService = ReturnType<typeof makeAvatarImageService>;
