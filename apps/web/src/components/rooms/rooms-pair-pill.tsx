import { BotAvatar } from '@/components/bots/bot-avatar';
import IconArrowLeftRight from '~icons/lucide/arrow-left-right';
import type { Bot } from '@openbots/contracts/universal';

interface RoomsPairPillProps {
  sender: Bot
  peer: Bot
}

export function RoomsPairPill({ sender, peer }: RoomsPairPillProps) {
  return (
    <div className="flex h-9 min-w-0 items-center gap-2 rounded-full border bg-background pr-4 pl-1.5 text-sm font-medium shadow-sm">
      <BotAvatar bot={sender} size={24} />
      <span className="truncate">{sender.name}</span>
      <IconArrowLeftRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
      <BotAvatar bot={peer} size={24} />
      <span className="truncate">{peer.name}</span>
    </div>
  );
}
