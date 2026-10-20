import { CHAT, roomsReactionGroups } from '@openbots/client/client';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { RpcSession } from '@/types/rpc.types';
import type { ChatMessage } from '@openbots/client/client';
import type { Bot, ConversationView } from '@openbots/contracts/universal';

export function useChatReactions(session: RpcSession, bot: Bot, bots: Bot[], view: ConversationView, messages: ChatMessage[]) {
  const queryClient = useQueryClient();
  const botId = bot.id;
  const { conversationId, interactionsRevision } = view;
  const entryIds = [...new Set(messages.flatMap((message) => (message.metadata?.entryId ? [message.metadata.entryId] : [])))];
  const size = CHAT.reactionsPageSize;
  const chunks = Array.from({ length: Math.ceil(entryIds.length / size) }, (_, index) => entryIds.slice(index * size, (index + 1) * size));
  const queryKey = session.rpc.conversation.reactions.key({ input: { botId, conversationId } });

  const reactions = useQueries({
    queries: chunks.map((ids) => session.rpc.conversation.reactions.queryOptions({ input: { botId, conversationId, entryIds: ids } })),
    combine: (results) => new Map(results.flatMap((result) => result.data ?? []).map((reaction) => [reaction.entryId, reaction])),
  });

  const groups = (message: ChatMessage) => roomsReactionGroups({ reaction: reactions.get(message.metadata?.entryId ?? 0), bots });

  const toggle = useMutation(session.rpc.conversation.setReaction.mutationOptions({
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  }));

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: session.rpc.conversation.reactions.key({ input: { botId, conversationId } }) });
  }, [botId, conversationId, queryClient, session, interactionsRevision]);

  return {
    isPending: toggle.isPending,
    isError: toggle.isError,
    groups,
    react: (message: ChatMessage, emoji: string) => toggle.mutate({
      botId,
      entryId: message.metadata?.entryId ?? 0,
      emoji,
      isPresent: !groups(message).some((group) => group.emoji === emoji && group.isMine),
    }),
  };
}
