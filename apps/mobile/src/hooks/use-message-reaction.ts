import { roomsReactionGroups } from '@openbots/client/client';
import { useChatReaction, useChatReactions } from '@openbots/client/react';
import { useQuery } from '@tanstack/react-query';
import type { ChatReactionParams } from '@/types/chat.types';
import type { RpcSession } from '@/types/rpc.types';

export function useMessageReaction(session: RpcSession, { botId, conversationId, entryId }: ChatReactionParams) {
  const reactions = useChatReactions({
    botId,
    conversationId,
    entryIds: [entryId],
  });

  const bots = useQuery(session.rpc.bots.list.queryOptions());
  const groups = roomsReactionGroups({ reaction: reactions.get(entryId), bots: bots.data ?? [] });
  const toggle = useChatReaction(botId);

  return {
    mine: groups.filter((group) => group.isMine).map((group) => group.emoji),
    isPending: toggle.isPending,
    react: (emoji: string) => toggle.react({
      entryId,
      emoji,
      groups,
    }),
  };
}
