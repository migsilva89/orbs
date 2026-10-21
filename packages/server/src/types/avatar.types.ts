import type { AvatarImageService } from '../services/avatar/avatar-image.service';
import type { BotService } from '../services/bot/bot.service';
import type { Bot } from '@openbots/contracts/universal';

export interface AvatarImageDeps {
  root: string;
}

export interface AvatarImageParams {
  imageId: string;
}

export interface AvatarImageSaveParams {
  file: File;
}

export interface AvatarImageRenderParams {
  avatar: Bot['avatar'];
  size: number;
}

export interface AvatarImageEntry extends AvatarImageParams {
  modifiedAt: number;
}

export interface AvatarServiceDeps {
  bots: BotService;
  images: AvatarImageService;
}
