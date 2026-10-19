import { m } from '@openbots/i18n/client';
import { getLocale } from '@openbots/i18n/runtime';
import { botUsageLabel } from '@/services/bot/bot.client';
import type { ChatMessage } from '@/types/chat.types';

interface RoomsChatInfoProps {
  message: ChatMessage
}

export function RoomsChatInfo({ message }: RoomsChatInfoProps) {
  const usage = message.role === 'assistant' ? message.metadata?.usage : null;
  const sent = message.metadata ? new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(message.metadata.createdAt)) : null;

  return (
    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
      {sent ? <p>{m.rooms_chat_sent({ date: sent })}</p> : null}
      {usage ? <p className="tabular-nums">{botUsageLabel(usage)}</p> : null}
    </div>
  );
}
