import { ROOMS_SEND_MODE_DEFAULT, ROOMS_SEND_MODES } from '@openbots/client/client';
import { conversationWhenBusy } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import IconListOrdered from '~icons/lucide/list-ordered';
import type { RoomsChat } from '@openbots/client/client';
import type { useChatSettings } from '@openbots/client/react';

interface RoomsSendModeMenuProps {
  chat: RoomsChat
  settings: ReturnType<typeof useChatSettings>
}

export function RoomsSendModeMenu({ chat, settings }: RoomsSendModeMenuProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <IconListOrdered className="size-4" />
        {m.rooms_action_send_mode()}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={chat.whenBusy ?? ROOMS_SEND_MODE_DEFAULT}
          onValueChange={(value) => settings.setSendMode(value === ROOMS_SEND_MODE_DEFAULT ? null : conversationWhenBusy.parse(value))}
        >
          <DropdownMenuRadioItem value={ROOMS_SEND_MODE_DEFAULT}>
            {settings.defaultSendModeLabel}
          </DropdownMenuRadioItem>
          <DropdownMenuSeparator />
          {conversationWhenBusy.options.map((mode) => (
            <DropdownMenuRadioItem key={mode} value={mode}>
              {ROOMS_SEND_MODES[mode]()}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
