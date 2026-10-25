import type { ConversationListItem, SidebarSection } from '@repo/contracts/universal';

export type BotHomeGroup = 'pinned' | 'others' | 'hidden' | `section:${string}`;

export interface BotHomeSection {
  key: BotHomeGroup;
  title: string;
  data: ConversationListItem[];
  section?: SidebarSection;
}

export interface BotHomeSectionsParams {
  chats: ConversationListItem[];
  sections: SidebarSection[];
  search: string;
}

export interface BotHomeSectionRouteParams extends Record<string, string | string[] | undefined> {
  sectionId: string;
}
