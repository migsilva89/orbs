import type { AttachmentStorageService } from '../services/attachment/attachment-storage.service';
import type { BotService } from '../services/bot/bot.service';
import type { AttachmentTarget } from '@repo/contracts/universal';
import type { RuntimeService } from '@repo/runtime/server';

export interface AttachmentServiceDeps {
  bots: BotService;
  runtime: RuntimeService;
  storage: AttachmentStorageService;
}

export interface AttachmentPrepareParams extends AttachmentTarget {
  attachmentIds: string[];
}
