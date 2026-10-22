import { ROOMS_MUTE_DURATIONS } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import IconBell from '~icons/lucide/bell';
import IconBellOff from '~icons/lucide/bell-off';
import type { RoomsChat } from '@repo/client/client';
import type { useChatSettings } from '@repo/client/react';

interface RoomsMuteMenuProps {
  chat: RoomsChat
  settings: ReturnType<typeof useChatSettings>
}

export function RoomsMuteMenu({ chat, settings }: RoomsMuteMenuProps) {
  return chat.isMuted ? (
    <DropdownMenuItem onSelect={settings.unmute}>
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
            onSelect={() => settings.mute(item.duration)}
          >
            {item.label()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
