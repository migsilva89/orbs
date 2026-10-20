import { Link } from '@tanstack/react-router';
import { useRoomDraft } from '@/hooks/use-room-draft';
import { roomsLink } from '@/services/rooms/rooms.client';
import type { Bot } from '@openbots/contracts/universal';
import type { ReactNode } from 'react';

interface RoomsPrefillLinkProps {
  bot: Bot
  prompt: string
  children: ReactNode
}

export function RoomsPrefillLink({ bot, prompt, children }: RoomsPrefillLinkProps) {
  const draft = useRoomDraft(bot.id);

  return <Link {...roomsLink(bot)} onClick={() => draft.prefill(prompt)}>{children}</Link>;
}
