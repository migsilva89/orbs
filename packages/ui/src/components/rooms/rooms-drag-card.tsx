import { BotAvatar } from '../bots/bot-avatar';
import type { RoomsChat } from '@repo/client/client';

interface RoomsDragCardProps {
  chat: RoomsChat
}

export function RoomsDragCard({ chat }: RoomsDragCardProps) {
  return (
    <div className="flex w-56 cursor-grabbing items-center gap-2.5 rounded-xl border bg-sidebar p-2 text-sm shadow-sm">
      <BotAvatar
        animate={false}
        bot={{ name: chat.name, avatar: chat.avatar ?? undefined }}
        size={32}
      />
      <span className="truncate font-medium">{chat.name}</span>
    </div>
  );
}
