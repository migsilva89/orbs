import type { ChatMessage } from './chat.types';
import type * as UniversalTypes from '@repo/contracts/universal';
import type { DynamicToolUIPart } from 'ai';

export type RoomsChat = UniversalTypes.ConversationListItem;

export type RoomsFilePart = Extract<ChatMessage['parts'][number], { type: 'file' }>;

export interface RoomsAttachment {
  key: string;
  id: string | null;
  name: string;
  mediaType: string;
  preview: string;
  status: 'uploading' | 'ready' | 'failed';
}

export interface RoomsChoiceParams {
  choice: string;
}

export interface RoomsChoice {
  label: string;
  recommended: boolean;
}

export interface RoomsApprovalTextParams {
  input: DynamicToolUIPart['input'];
}

export interface RoomsApprovalText {
  code?: string;
  description?: string;
}

export interface RoomsTimeLabelParams {
  createdAt: number;
  previous?: number;
  now: Date;
  locale: string;
}

export interface RoomsQuestionTextParams {
  question: string;
}

export interface RoomsQuestionText {
  title: string;
  detail: string;
}

export interface RoomsSidebarOrderParams {
  chats: RoomsChat[];
  sections?: UniversalTypes.SidebarSection[];
}

export interface RoomsSidebarSection extends UniversalTypes.SidebarSection {
  chats: RoomsChat[];
}

export interface RoomsSearchHit extends UniversalTypes.ConversationHistoryMessage {
  botId: string;
}

export interface RoomsSearchEntry {
  chat: RoomsChat;
  title: string;
}

export interface RoomsSearchGroup extends RoomsSearchEntry {
  hits: RoomsSearchHit[];
}

export interface RoomsSearchResultsParams {
  chats: RoomsChat[];
  hits: RoomsSearchHit[];
  query: string;
}

export interface RoomsSearchResults {
  chats: RoomsSearchEntry[];
  groups: RoomsSearchGroup[];
}

export interface RoomsSearchSnippetParams {
  text: string;
  query: string;
}

export interface RoomsSearchSnippetPart {
  text: string;
  match: boolean;
  start: number;
}

export interface RoomsReactionGroup {
  emoji: string;
  count: number;
  names: string[];
  isMine: boolean;
}

export interface RoomsReactionGroupsParams {
  reaction: UniversalTypes.ConversationReaction | undefined;
  bots: UniversalTypes.Bot[];
}

export interface RoomsHistoryLoader {
  isEnabled: boolean;
  isLoading: boolean;
  onLoad: () => void;
}

export interface RoomsUnread {
  throughEntryId: number;
  isSeen: boolean;
  onSeen: () => void;
}

export interface RoomsArrangeParams {
  botIds: string[];
  isPinned: boolean;
  sectionId?: string | null;
}

export interface RoomsAttachmentFile {
  name: string;
  mediaType: string;
  size: number;
}

export interface RoomsAttachmentsParams<Source> {
  botId: string;
  /** Reads name, type and size without loading the file. */
  describe: (source: Source) => RoomsAttachmentFile;
  /** Image preview url for an accepted file, or an empty string. */
  preview: (source: Source) => string;
  read: (source: Source) => Promise<File>;
  /** Frees a preview url once its attachment leaves the composer. */
  release?: (attachment: RoomsAttachment) => void;
  onFailed?: (attachment: RoomsAttachment) => void;
  /** Shows why a file was refused. */
  onProblem: (message: string) => void;
}

export interface RoomsSourcedAttachment<Source> extends RoomsAttachment {
  source: Source;
}

export interface RoomsPrefill {
  botId: string;
  text: string;
}

export interface RoomsQuoteSelection {
  messageId: string;
  text: string;
  rect: DOMRect;
}
