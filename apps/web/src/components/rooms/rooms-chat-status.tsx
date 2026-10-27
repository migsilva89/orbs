import { BOT_ACTIVITY_LABELS, roomsMessageText, toolPresentation, toolPreview, toolRunning } from '@repo/client/client';
import { useChatHideVerbose } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { match, P } from 'ts-pattern';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { PromptInputStatus } from '@/components/ui/ai/prompt-input';
import type { ChatActivity, ChatMessage } from '@repo/client/client';
import type { Bot } from '@repo/contracts/universal';

interface RoomsChatStatusProps {
  bot: Bot
  activity: ChatActivity
  draft?: ChatMessage
  unread?: ChatMessage
  onOpen: () => void
}

export function RoomsChatStatus({ bot, activity, draft, unread, onOpen }: RoomsChatStatusProps) {
  const { hideVerbose } = useChatHideVerbose();
  const last = draft?.parts.filter((part) => part.type !== 'step-start').at(-1);
  const isWorking = activity !== 'idle' && activity !== 'failed';

  const step = match({
    activity,
    last,
    hideVerbose,
  })
    .with({ activity: 'queued' }, () => m.rooms_chat_waiting({ bot: bot.name }))
    .with({ hideVerbose: false, last: { type: 'dynamic-tool' } }, ({ last: tool }) => {
      const label = toolPresentation(tool).label;
      const preview = toolRunning(tool) ? toolPreview(tool) : undefined;

      return preview ? `${label} ${preview}` : label;
    })
    .with({ last: { type: 'text', state: 'streaming' } }, () => BOT_ACTIVITY_LABELS.writing())
    .with({ activity: P.union('idle', 'failed') }, () => undefined)
    .otherwise(({ activity: current }) => BOT_ACTIVITY_LABELS[current]());

  const text = isWorking ? step : unread && roomsMessageText(unread);

  if (!text) {
    return null;
  }

  return (
    <PromptInputStatus
      avatar={(
        <BotAvatar
          activity={activity}
          bot={bot}
          size={24}
        />
      )}
      isLive={isWorking}
      onClick={onOpen}
    >
      {text.split('\n').find((line) => line.trim()) ?? text}
    </PromptInputStatus>
  );
}
