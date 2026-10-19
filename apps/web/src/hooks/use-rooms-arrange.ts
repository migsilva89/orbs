import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toasty } from '@/components/ui/sonner';
import { rpc } from '@/services/rpc/rpc.client';
import type { RoomsArrangeParams } from '@/types/rooms.types';

export function useRoomsArrange() {
  const queryClient = useQueryClient();
  const onError = () => toasty(m.rooms_arrange_failed(), '⚠️');
  const arrange = useMutation(rpc.conversation.arrange.mutationOptions({ onError }));
  const pin = useMutation(rpc.conversation.setPinned.mutationOptions({ onError }));

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
