import { botBubble } from '@repo/client/client';
import type { BotBubbleStyle } from '../../types/bot.types';
import type { BotBubbleParams } from '@repo/client/client';

export function botBubbleStyle({ avatar }: BotBubbleParams): BotBubbleStyle | undefined {
  const bubble = botBubble({ avatar });

  return bubble ? { '--bubble': bubble.background, '--bubble-foreground': bubble.foreground } : undefined;
}
