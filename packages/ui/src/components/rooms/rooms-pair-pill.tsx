import IconArrowLeftRight from '~icons/lucide/arrow-left-right';
import { BotAvatar } from '../bots/bot-avatar';
import { PanePill } from '../pane';
import type { Bot } from '@repo/contracts/universal';

interface RoomsPairPillProps {
  sender: Bot
  peer: Bot
}

export function RoomsPairPill({ sender, peer }: RoomsPairPillProps) {
  return (
    <PanePill variant="avatar">
      <BotAvatar bot={sender} size={24} />
      <span className="truncate">{sender.name}</span>
      <IconArrowLeftRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
      <BotAvatar bot={peer} size={24} />
      <span className="truncate">{peer.name}</span>
    </PanePill>
  );
}
