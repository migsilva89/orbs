import { m } from '@openbots/i18n/client';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { BOT_ACTIVITY_LABELS } from '@/services/bot/bot.constants';
import { toolRunning } from '@/services/tool/tool.client';
import type { ChatActivity, ChatMessage } from '@/types/chat.types';
import type { Bot } from '@openbots/contracts/universal';

interface RoomsChatActivityProps {
  botName: string
  bot?: Bot
  activity: ChatActivity
  draft?: ChatMessage
  waiting: boolean
}

export function RoomsChatActivity({ botName, bot, activity, draft, waiting }: RoomsChatActivityProps) {
  const last = draft?.parts.filter((part) => part.type !== 'step-start').at(-1);
  const textSpeaks = activity === 'writing' && last?.type === 'text' && last.state === 'streaming';
  const toolRowSpeaks = !waiting && last?.type === 'dynamic-tool' && toolRunning(last);
  const reasoningSpeaks = !waiting && last?.type === 'reasoning' && last.state === 'streaming';

  if (textSpeaks || toolRowSpeaks || reasoningSpeaks) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
      <BotAvatar
        activity={activity}
        bot={bot ?? { name: botName }}
        size={24}
      />
      {waiting ? m.rooms_chat_waiting({ bot: botName }) : m.avatars_bot_label({ bot: botName, activity: BOT_ACTIVITY_LABELS[activity]() })}
    </div>
  );
}
