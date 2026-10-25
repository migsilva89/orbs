import { m } from '@repo/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRpc } from './use-rpc';
import type { RoomsArrangeParams } from '../types/rooms.types';

export function useChatArrange() {
  const queryClient = useQueryClient();
  const { rpc } = useRpc();
  const meta = { error: m.rooms_arrange_failed() };

  const arrange = useMutation(rpc.conversation.arrange.mutationOptions({
    meta,
    onError: () => queryClient.invalidateQueries({ queryKey: rpc.conversation.list.queryKey() }),
  }));

  return ({ botIds, isPinned, sectionId }: RoomsArrangeParams) => {
    const chats = queryClient.getQueryData(rpc.conversation.list.queryKey()) ?? [];

    queryClient.setQueryData(rpc.conversation.list.queryKey(), chats.map((chat) => ({
      ...chat,
      isPinned: botIds.includes(chat.botId) ? isPinned : chat.isPinned,
      rank: botIds.includes(chat.botId) ? botIds.indexOf(chat.botId) : chat.rank,
      sectionId: botIds.includes(chat.botId) && sectionId !== undefined ? sectionId : chat.sectionId,
    })).sort((first, second) => Number(second.isPinned) - Number(first.isPinned) || (first.rank ?? Infinity) - (second.rank ?? Infinity)));

    arrange.mutate({
      botIds,
      isPinned,
      sectionId,
    });
  };
}
