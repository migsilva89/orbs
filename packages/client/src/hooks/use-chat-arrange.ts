import { m } from '@repo/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRpc } from './use-rpc';
import type { RoomsArrangeParams } from '../types/rooms.types';

/** Saves a new chat order and pinned set, updating the cached list at once so the move shows before the server answers. */
export function useChatArrange() {
  const queryClient = useQueryClient();
  const { rpc } = useRpc();
  const meta = { error: m.rooms_arrange_failed() };
  const arrange = useMutation(rpc.conversation.arrange.mutationOptions({ meta }));
  const pin = useMutation(rpc.conversation.setPinned.mutationOptions({ meta }));

  return ({ botIds, pinnedIds }: RoomsArrangeParams) => {
    const chats = queryClient.getQueryData(rpc.conversation.list.queryKey()) ?? [];

    for (const chat of chats.filter((item) => botIds.includes(item.botId) && item.isPinned !== pinnedIds.includes(item.botId))) {
      pin.mutate({ botId: chat.botId, isPinned: !chat.isPinned });
    }

    queryClient.setQueryData(rpc.conversation.list.queryKey(), chats.map((chat) => ({
      ...chat,
      isPinned: pinnedIds.includes(chat.botId),
      rank: botIds.includes(chat.botId) ? botIds.indexOf(chat.botId) : chat.rank,
    })).sort((first, second) => Number(second.isPinned) - Number(first.isPinned) || (first.rank ?? Infinity) - (second.rank ?? Infinity)));

    arrange.mutate({ botIds });
  };
}
