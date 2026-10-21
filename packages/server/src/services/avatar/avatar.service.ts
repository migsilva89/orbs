import { avatarActionUpload } from './avatar-action.upload';
import { avatarQueryBot } from './avatar-query.bot';
import type { AvatarImageParams, AvatarServiceDeps } from '../../types/avatar.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

export function makeAvatarService(deps: AvatarServiceDeps) {
  return {
    actions: {
      upload: (params: UniversalTypes.AvatarUploadInput) => avatarActionUpload(deps, params),
    },
    queries: {
      image: (params: AvatarImageParams) => deps.images.queries.read(params),
      bot: (params: UniversalTypes.BotGetInput) => avatarQueryBot(deps, params),
    },
  };
}

export type AvatarService = ReturnType<typeof makeAvatarService>;
