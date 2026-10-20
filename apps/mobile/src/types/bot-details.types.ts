import type { Bot } from '@openbots/contracts/universal';

export interface BotDetailsRouteParams {
  botId: string;
}

export type BotDetailsTab = 'details' | 'media';

export interface BotDetailsSectionProps {
  bot: Bot;
  onPrefill: (text: string) => void;
}
