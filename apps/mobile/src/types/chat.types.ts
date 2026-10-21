import type * as ClientTypes from '@openbots/client/client';
import type { Bot, ToolCallArtifact } from '@openbots/contracts/universal';

type ChatSearchParams = Record<string, string | string[] | undefined>;

export interface ChatRouteParams extends ChatSearchParams {
  botId: string;
  replyToEntryId?: string;
  quote?: string;
  quoteEntryId?: string;
  prefill?: string;
}

export interface ChatReactionRouteParams extends ChatSearchParams {
  botId: string;
  conversationId: string;
  entryId: string;
}

export interface ChatActionsRouteParams extends ChatReactionRouteParams {
  from: 'user' | 'assistant';
  text: string;
  details?: string;
}

export interface ChatResetRouteParams extends ChatSearchParams {
  botId: string;
  handoff?: string;
}

export interface ChatTextRouteParams extends ChatSearchParams {
  botId: string;
  entryId: string;
  text: string;
}

export type ChatMessagePart =
  | { key: string; kind: 'markdown' | 'html' | 'failure' | 'reasoning'; text: string; isStreaming: boolean }
  | { key: string; kind: 'artifact'; artifact: ToolCallArtifact }
  | { key: string; kind: 'files'; files: ClientTypes.RoomsFilePart[] };

export type ChatMessageSegment =
  | { key: string; kind: 'bubbles'; parts: ChatMessagePart[] }
  | { key: string; kind: 'tools'; parts: ClientTypes.ToolPart[] };

export interface ChatNoticeTitleParams {
  message: ClientTypes.ChatMessage;
  bot: Bot;
}
