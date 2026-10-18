import type { RuntimeConversationParams } from './runtime.types';
import type { InboxItem } from '@earendil-works/pi-durable';
import type * as PiDurableTypes from '@earendil-works/pi-durable';
import type { Attachment } from '@openbots/contracts/universal';

export interface RuntimeAttachments extends PiDurableTypes.JsonObject {
  files: Record<string, Attachment>;
}

export interface RuntimeAddAttachmentParams extends RuntimeConversationParams {
  attachment: Attachment;
}

export interface RuntimeAttachmentIdParams extends RuntimeConversationParams {
  attachmentId: string;
}

export interface RuntimeRetainAttachmentsParams extends RuntimeConversationParams {
  attachmentIds: string[];
}

export interface RuntimeAttachmentsQueryParams extends RuntimeConversationParams {
  before?: string;
  limit?: number;
}

export type RuntimeQueuedInput = Extract<InboxItem, { mode: 'followUp' | 'steer' }>;
