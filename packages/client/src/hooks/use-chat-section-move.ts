import { useQueryClient } from '@tanstack/react-query';
import { useChatArrange } from './use-chat-arrange';
import { useRpc } from './use-rpc';

export function useChatSectionMove(botId: string) {
  const queryClient = useQueryClient();
  const { rpc } = useRpc();
  const arrange = useChatArrange();

  return (sectionId: string | null) => {
    const botIds = (queryClient.getQueryData(rpc.conversation.list.queryKey()) ?? [])
      .filter((item) => !item.isPinned && !item.isHidden && item.sectionId === sectionId && item.botId !== botId)
      .map((item) => item.botId);

    arrange({
      botIds: [...botIds, botId],
      isPinned: false,
      sectionId,
    });
  };
}
