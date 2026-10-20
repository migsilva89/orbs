import type { ConversationListItem } from '@openbots/contracts/universal';

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
