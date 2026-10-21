import type { Bot } from '@openbots/contracts/universal';

export interface BotDetailsRouteParams extends Record<string, string | string[] | undefined> {
  botId: string;
}

export type BotDetailsTab = 'details' | 'media';

export interface BotDetailsSectionProps {
  bot: Bot;
  onPrefill: (text: string) => void;
}
