import { z } from 'zod';
import type { Attachment } from '@openbots/contracts/universal';

export interface AttachmentStorageDeps {
  root: string;
}

export interface AttachmentStorageParams {
  botId: string;
  conversationId: number;
  attachment: Attachment;
}

export interface AttachmentStorageWriteParams extends AttachmentStorageParams {
  file: File;
}

export interface AttachmentStorageTarget {
  botId: string;
  conversationId: number;
}

export const attachmentStorageId = z.uuid();
