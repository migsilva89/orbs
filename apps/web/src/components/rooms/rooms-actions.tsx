import { useChatSettings } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { Link } from '@tanstack/react-router';
import { RoomsMuteMenu } from '@/components/rooms/rooms-mute-menu';
import { RoomsSectionMenu } from '@/components/rooms/rooms-section-menu';
import { RoomsSendModeMenu } from '@/components/rooms/rooms-send-mode-menu';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import IconEye from '~icons/lucide/eye';
import IconEyeOff from '~icons/lucide/eye-off';
import IconPencilLine from '~icons/lucide/pencil-line';
import IconPin from '~icons/lucide/pin';
import IconPinOff from '~icons/lucide/pin-off';
import IconRotateCcw from '~icons/lucide/rotate-ccw';
import IconTrash2 from '~icons/lucide/trash-2';
import type { RoomsChat } from '@repo/client/client';

interface RoomsActionsProps {
  chat: RoomsChat
}

export function RoomsActions({ chat }: RoomsActionsProps) {
  const settings = useChatSettings(chat.botId);

  const togglePin = () => settings.pin(!chat.isPinned);

  return (
    <>
      <DropdownMenuItem asChild>
        <Link params={{ botId: chat.botId }} to="/bots/$botId">
          <IconPencilLine className="size-4" />
          {m.rooms_action_edit_bot()}
        </Link>
      </DropdownMenuItem>
      {chat.isHidden ? null : (
        <DropdownMenuItem onSelect={togglePin}>
          {chat.isPinned ? <IconPinOff className="size-4" /> : <IconPin className="size-4" />}
          {chat.isPinned ? m.rooms_action_unpin() : m.rooms_action_pin()}
        </DropdownMenuItem>
      )}
      {chat.isHidden ? null : <RoomsSectionMenu chat={chat} />}
      <DropdownMenuItem onSelect={() => settings.hide(!chat.isHidden)}>
        {chat.isHidden ? <IconEye className="size-4" /> : <IconEyeOff className="size-4" />}
        {chat.isHidden ? m.rooms_action_unhide() : m.rooms_action_hide()}
      </DropdownMenuItem>
      <RoomsMuteMenu chat={chat} settings={settings} />
      <RoomsSendModeMenu chat={chat} settings={settings} />
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link
          params={{ handle: chat.handle }}
          resetScroll={false}
          to="/rooms/direct/$handle/reset"
        >
          <IconRotateCcw className="size-4" />
          {m.rooms_member_reset()}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild variant="destructive">
        <Link
          params={{ botId: chat.botId }}
          resetScroll={false}
          to="/bots/$botId/delete"
        >
          <IconTrash2 className="size-4" />
          {m.rooms_bot_delete()}
        </Link>
      </DropdownMenuItem>
    </>
  );
}
