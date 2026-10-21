import { useMutation } from '@tanstack/react-query';
import { useRpc } from './use-rpc';
import type { ChatReactParams } from '../types/chat.types';

/** Toggles the owner's reaction on an entry: adds the emoji unless the owner already reacted with it. */
export function useChatReaction(botId: string) {
  const { rpc } = useRpc();
  const toggle = useMutation(rpc.conversation.setReaction.mutationOptions({ meta: { invalidates: [rpc.conversation.reactions.key()] } }));

  return {
    isPending: toggle.isPending,
    isError: toggle.isError,
    react: ({ entryId, emoji, groups }: ChatReactParams) => toggle.mutate({
      botId,
      entryId,
      emoji,
      isPresent: !groups.some((group) => group.emoji === emoji && group.isMine),
    }),
  };
}
