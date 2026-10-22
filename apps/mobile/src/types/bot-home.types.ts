import type { ConversationListItem } from '@repo/contracts/universal';

export type BotHomeGroup = 'pinned' | 'others' | 'hidden';

export interface BotHomeSection {
  key: BotHomeGroup;
  title: string;
  data: ConversationListItem[];
}

export interface BotHomeSectionsParams {
  chats: ConversationListItem[];
  search: string;
}
