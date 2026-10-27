import { Mention } from '../mention';
import { BotAvatar } from './bot-avatar';
import type { ChatActivity, ToolBot } from '@repo/client/client';

interface BotMentionProps {
  bot: ToolBot & { handle?: string }
  activity?: ChatActivity
  animate?: boolean
}

export function BotMention({ bot, activity, animate = false }: BotMentionProps) {
  return (
    <Mention title={bot.handle ? `@${bot.handle}` : undefined}>
      <BotAvatar
        activity={activity}
        animate={animate}
        bot={bot}
        size={16}
      />
      {bot.name}
    </Mention>
  );
}
