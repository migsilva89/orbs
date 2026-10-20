import { mentionTarget } from '@openbots/client/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { RoomsMention } from '@/components/rooms/rooms-mention';
import { RoomsMentionCard } from '@/components/rooms/rooms-mention-card';
import { rpc } from '@/services/rpc/rpc.client';
import type { HTMLAttributes } from 'react';
import type { ExtraProps } from 'streamdown';

interface RoomsChatMentionProps extends HTMLAttributes<HTMLElement>, ExtraProps {
  'data-href'?: string
  'data-label'?: string
}

export function RoomsChatMention({ 'data-href': href, 'data-label': label = '' }: RoomsChatMentionProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());

  if (!href) {
    return null;
  }

  const target = mentionTarget({ href });
  const pill = <RoomsMention href={href} label={label} />;
  const bot = target?.kind === 'bot' ? bots.find((candidate) => candidate.id === target.name) : undefined;

  return bot ? <RoomsMentionCard bot={bot}>{pill}</RoomsMentionCard> : pill;
}
