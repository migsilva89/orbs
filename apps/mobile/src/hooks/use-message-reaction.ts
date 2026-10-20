import { roomsReactionGroups } from '@openbots/client/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatReactionParams } from '@/types/chat.types';
import type { RpcSession } from '@/types/rpc.types';

export function useMessageReaction(session: RpcSession, { botId, conversationId, entryId }: ChatReactionParams) {
  const queryClient = useQueryClient();
  const { data: reactions = [] } = useQuery(session.rpc.conversation.reactions.queryOptions({ input: { botId, conversationId, entryIds: [entryId] } }));
  const bots = useQuery(session.rpc.bots.list.queryOptions());
  const mine = roomsReactionGroups({ reaction: reactions[0], bots: bots.data ?? [] }).filter((group) => group.isMine).map((group) => group.emoji);

  const toggle = useMutation(session.rpc.conversation.setReaction.mutationOptions({
    onSettled: () => queryClient.invalidateQueries({ queryKey: session.rpc.conversation.reactions.key({ input: { botId, conversationId } }) }),
  }));

  return {
    mine,
    isPending: toggle.isPending,
    react: (emoji: string) => toggle.mutate({
      botId,
      entryId,
      emoji,
      isPresent: !mine.includes(emoji),
    }),
  };
}
