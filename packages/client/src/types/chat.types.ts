import type { RoomsReactionGroup } from './rooms.types';
import type * as UniversalTypes from '@openbots/contracts/universal';
import type { UIMessage } from 'ai';

export type ChatActivity = 'idle' | 'queued' | 'thinking' | 'working' | 'writing' | 'compacting' | 'failed';

export interface ChatUsage {
  input: number;
  output: number;
  cacheRead: number;
  cost: { total: number };
}

export type ChatEntry = UniversalTypes.ConversationView['entries'][number];

export type ChatPiMessage = NonNullable<ChatEntry['model']>[number];

export interface ChatReplyTo {
  entryId: number;
  authorName: string;
  text: string;
}

export interface ChatMetadata {
  entryId: number;
  entryIds: number[];
  createdAt: number;
  authorId: string | null;
  authorName: string;
  replyTo: ChatReplyTo | null;
  usage: ChatUsage | null;
}

interface ChatDataPartShapes {
  pair: { kind: 'ask' | 'reply' | 'failed'; peerId: string };
  subagent: UniversalTypes.EntrySubagentReport;
  compaction: { status: 'done' };
  reset: Record<string, never>;
  failure: { text: string };
}

export type ChatDataParts = Pick<ChatDataPartShapes, keyof ChatDataPartShapes>;

export type ChatMessage = UIMessage<ChatMetadata, ChatDataParts>;

export type ChatPart = ChatMessage['parts'][number];

export interface ChatMessagesParams {
  entries: readonly ChatEntry[];
  bot: UniversalTypes.Bot;
  bots: UniversalTypes.Bot[];
}

export interface ChatLiveParams {
  state: UniversalTypes.ConversationState;
  bot: UniversalTypes.Bot;
  approvals: UniversalTypes.ToolApproval[];
}

export interface ChatQueued {
  submissionId: number;
  mode: 'steer' | 'followUp';
  text: string;
}

export interface ChatOutgoing {
  requestId: string;
  botId: string;
  text: string;
  afterEntryId: number;
  createdAt: number;
  submissionId?: number;
}

export interface ChatOutgoingParams {
  botId: string;
  latestEntryId: number;
  queued: ChatQueued[];
}

type ChatQueuedInput = Extract<UniversalTypes.ConversationState['inbox']['items'][number], { mode: 'steer' | 'followUp' }>;

export type ChatInputContent = ChatQueuedInput['content'] | Extract<ChatPiMessage, { role: 'user' | 'toolResult' }>['content'];

export type ChatContentPart = Extract<ChatPiMessage, { role: 'assistant' }>['content'][number];

export interface ChatOwnerContent {
  text: string;
  files: ChatPart[];
  replyTo: ChatReplyTo | null;
  createdAt: number;
}

export interface ChatHistoryParams {
  botId: string;
  conversationId: number;
  cursor: UniversalTypes.ConversationView['historyCursor'];
}

export interface ChatReactionsParams {
  botId: string;
  conversationId: number;
  entryIds: number[];
  /** The view's `interactionsRevision`; a change refetches reactions other devices or bots added. */
  revision?: number;
}

export interface ChatReactParams {
  entryId: number;
  emoji: string;
  groups: RoomsReactionGroup[];
}

export interface ChatAnswerProblemParams {
  isGone: boolean;
  isError: boolean;
}

export interface ChatSendParams {
  botId: string;
  conversationId: number;
  latestEntryId: number;
  /** Adds and settles the optimistic outgoing messages the transcript shows until the server echoes them. */
  onOutgoingChange: (change: (items: ChatOutgoing[]) => ChatOutgoing[]) => void;
  /** Clears the platform's input once a confirmed `/reset` succeeds; the draft stays while its confirmation is open. */
  onResetDone: () => void;
}

export interface ChatSendInput {
  /** Composer text with mentions as markdown links, as `mentionSubmission` expects. */
  text: string;
  attachmentIds: string[];
  replyToEntryId?: number;
}

export type ChatSendResult = { kind: 'sent' } | { kind: 'command' } | { kind: 'reset'; handoff?: string };

export interface ChatResetCommand {
  handoff?: string;
}
