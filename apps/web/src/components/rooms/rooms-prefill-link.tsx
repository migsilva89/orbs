import { useChatDraft } from '@repo/client/web';
import { Link } from '@tanstack/react-router';
import { useSidebar } from '@/components/ui/sidebar';
import { roomsLink } from '@/services/rooms/rooms.client';
import type { Bot } from '@repo/contracts/universal';
import type { ReactNode } from 'react';

interface RoomsPrefillLinkProps {
  bot: Bot
  prompt: string
  children: ReactNode
}

export function RoomsPrefillLink({ bot, prompt, children }: RoomsPrefillLinkProps) {
  const draft = useChatDraft(bot.id);
  const { setOpenMobile } = useSidebar();

  function handleClick() {
    draft.prefill(prompt);
    setOpenMobile(false);
  }

  return <Link {...roomsLink(bot)} onClick={handleClick}>{children}</Link>;
}
