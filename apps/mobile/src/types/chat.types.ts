import type { ChatMessage, ToolPart } from '@openbots/client/client';
import type { Bot, ToolCallArtifact } from '@openbots/contracts/universal';

export interface ChatRouteParams {
  botId: string;
  replyToEntryId?: number;
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
  | { key: string; kind: 'artifact'; artifact: ToolCallArtifact };

export type ChatMessageSegment =
  | { key: string; kind: 'bubbles'; parts: ChatMessagePart[] }
  | { key: string; kind: 'tools'; parts: ToolPart[] };

export interface ChatTextRouteParams {
  text: string;
}

export interface ChatNoticeTitleParams {
  message: ChatMessage;
  bot: Bot;
}
