import type { RoomsReactionGroup } from './rooms.types';
import type * as ToolTypes from './tool.types';
import type * as UniversalTypes from '@openbots/contracts/universal';
import type { UIMessage } from 'ai';

/** How the owner answers a tool approval; `always` also approves the tool for this bot from now on. */
export type ChatApprovalDecision = 'approve' | 'always' | 'deny';

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

export interface ChatQueueParams extends Required<UniversalTypes.ConversationTarget> {
  /** Drops a removed message's optimistic bubble; it never reaches the transcript to settle it. */
  onOutgoingChange: ChatSendParams['onOutgoingChange'];
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

export interface ChatSubagentParams {
  botId: string;
  part: ToolTypes.ToolPart;
  subagent: ToolTypes.ToolSubagent;
}

export interface ChatAroundParams {
  bot: UniversalTypes.Bot;
  bots: UniversalTypes.Bot[];
  view: UniversalTypes.ConversationView;
  entryId: number;
}

export interface ChatRoomParams {
  bot: UniversalTypes.Bot;
  bots: UniversalTypes.Bot[];
  view: UniversalTypes.ConversationView;
  outgoing: ChatOutgoing[];
}

export interface ChatResetParams {
  botId: string;
  handoff?: string;
  onDone?: () => void;
}

export interface ChatMessageReactionParams {
  botId: string;
  conversationId: number;
  entryId: number;
}

export interface ChatFileTypeParams {
  name: string;
  mediaType?: string;
}

/** A file chosen in a native picker, read later from its local uri. */
export interface ChatPicked {
  uri: string;
  name: string;
  mediaType: string;
  size: number;
}

export interface ChatAttachmentsPlatformParams {
  botId: string;
  /** Shows why a file was refused or failed to upload. */
  onProblem: (message: string) => void;
}
