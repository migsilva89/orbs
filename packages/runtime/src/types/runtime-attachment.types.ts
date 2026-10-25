import type { RuntimeConversationParams } from './runtime.types';
import type * as PiDurableTypes from '@earendil-works/pi-durable';
import type { Attachment } from '@repo/contracts/universal';

export interface RuntimeAttachments extends PiDurableTypes.JsonObject {
  files: Record<string, Attachment>;
}

export interface RuntimeAttachmentAddParams extends RuntimeConversationParams {
  attachment: Attachment;
}

export interface RuntimeAttachmentIdParams extends RuntimeConversationParams {
  attachmentId: string;
}

export interface RuntimeAttachmentRetainParams extends RuntimeConversationParams {
  attachmentIds: string[];
}

export interface RuntimeAttachmentsQueryParams extends RuntimeConversationParams {
  before?: string;
  limit?: number;
}
