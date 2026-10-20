import { conversationWhenBusy } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { toasty } from '@/components/ui/sonner';
import { ROOMS_SEND_MODE_DEFAULT, ROOMS_SEND_MODES } from '@/services/rooms/rooms.constants';
import { rpc } from '@/services/rpc/rpc.client';
import IconListOrdered from '~icons/lucide/list-ordered';
import type { RoomsChat } from '@/types/rooms.types';

interface RoomsSendModeMenuProps {
  chat: RoomsChat
}

export function RoomsSendModeMenu({ chat }: RoomsSendModeMenuProps) {
  const { data: settings } = useQuery(rpc.conversation.settings.queryOptions());
  const setWhenBusy = useMutation(rpc.conversation.setWhenBusy.mutationOptions({ onError: () => toasty(m.rooms_hide_failed(), '⚠️') }));

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <IconListOrdered className="size-4" />
        {m.rooms_action_send_mode()}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={chat.whenBusy ?? ROOMS_SEND_MODE_DEFAULT}
          onValueChange={(value) => setWhenBusy.mutate({
            botId: chat.botId,
            whenBusy: value === ROOMS_SEND_MODE_DEFAULT ? null : conversationWhenBusy.parse(value),
          })}
        >
          <DropdownMenuRadioItem value={ROOMS_SEND_MODE_DEFAULT}>
            {m.rooms_send_mode_default({ mode: settings ? ROOMS_SEND_MODES[settings.whenBusy]() : '…' })}
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
