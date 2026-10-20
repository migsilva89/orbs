import type * as ClientTypes from '@openbots/client/client';
import type { Bot, ToolCallArtifact } from '@openbots/contracts/universal';

export interface ChatRouteParams {
  botId: string;
  replyToEntryId?: number;
  quote?: ClientTypes.MentionItem;
}

export interface ChatReactionParams {
  botId: string;
  conversationId: number;
  entryId: number;
}

export interface ChatActionsRouteParams extends ChatReactionParams {
  from: 'user' | 'assistant';
  text: string;
  details: string[];
}

export type ChatMessagePart =
  | { key: string; kind: 'markdown' | 'html' | 'failure' | 'reasoning'; text: string; isStreaming: boolean }
  | { key: string; kind: 'artifact'; artifact: ToolCallArtifact }
  | { key: string; kind: 'files'; files: ClientTypes.RoomsFilePart[] };

export type ChatMessageSegment =
  | { key: string; kind: 'bubbles'; parts: ChatMessagePart[] }
  | { key: string; kind: 'tools'; parts: ClientTypes.ToolPart[] };

export interface ChatTextRouteParams {
  text: string;
  botId: string;
  entryId: number;
}

export interface ChatNoticeTitleParams {
  message: ClientTypes.ChatMessage;
  bot: Bot;
}

export interface ChatPicked {
  uri: string;
  name: string;
  mediaType: string;
  size: number;
}

export interface ChatAttachment extends ClientTypes.RoomsAttachment {
  uri: string;
}
