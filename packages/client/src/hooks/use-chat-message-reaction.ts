import { useQuery } from '@tanstack/react-query';
import { roomsReactionGroups } from '../services/rooms/rooms.utils';
import { useChatReaction } from './use-chat-reaction';
import { useChatReactions } from './use-chat-reactions';
import { useRpc } from './use-rpc';
import type { ChatMessageReactionParams } from '../types/chat.types';

/** Reactions on one message: the owner's emojis and a toggle, for screens that show a single entry. */
export function useChatMessageReaction({ botId, conversationId, entryId }: ChatMessageReactionParams) {
  const { rpc } = useRpc();

  const reactions = useChatReactions({
    botId,
    conversationId,
    entryIds: [entryId],
  });

  const bots = useQuery(rpc.bots.list.queryOptions());
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
