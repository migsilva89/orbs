import { ROOMS_MUTE_DURATIONS } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { rpc } from '@/services/rpc/rpc.client';
import IconBell from '~icons/lucide/bell';
import IconBellOff from '~icons/lucide/bell-off';
import type { RoomsChat } from '@openbots/client/client';

interface RoomsMuteMenuProps {
  chat: RoomsChat
}

export function RoomsMuteMenu({ chat }: RoomsMuteMenuProps) {
  const mute = useMutation(rpc.conversation.setMuted.mutationOptions());

  return chat.isMuted ? (
    <DropdownMenuItem onSelect={() => mute.mutate({ botId: chat.botId, isMuted: false })}>
      <IconBell className="size-4" />
      {m.rooms_unmute()}
    </DropdownMenuItem>
  ) : (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <IconBellOff className="size-4" />
        {m.rooms_mute()}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {ROOMS_MUTE_DURATIONS.map((item) => (
          <DropdownMenuItem
            key={item.duration}
            onSelect={() => mute.mutate({
              botId: chat.botId,
              isMuted: true,
              mutedUntil: item.duration === null ? null : Date.now() + item.duration,
            })}
          >
            {item.label()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
