import { botUsageLabel } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { getLocale } from '@openbots/i18n/runtime';
import { useHydrated } from '@tanstack/react-router';
import type { ChatMessage } from '@openbots/client/client';

interface RoomsChatInfoProps {
  message: ChatMessage
}

export function RoomsChatInfo({ message }: RoomsChatInfoProps) {
  const hydrated = useHydrated();
  const usage = message.role === 'assistant' ? message.metadata?.usage : null;
  const date = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });
  const sent = hydrated && message.metadata ? date.format(new Date(message.metadata.createdAt)) : null;

  return (
    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
      {sent ? <p>{m.rooms_chat_sent({ date: sent })}</p> : null}
      {usage ? <p className="tabular-nums">{botUsageLabel(usage)}</p> : null}
    </div>
  );
}
