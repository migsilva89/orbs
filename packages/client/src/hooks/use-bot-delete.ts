import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRpc } from './use-rpc';
import type { BotDeleteParams } from '../types/bot.types';

/** Deletes a bot, refreshes the bot list and drops the bot's cached data, then lets the app leave its screens. */
export function useBotDelete({ botId, onDeleted }: BotDeleteParams) {
  const queryClient = useQueryClient();
  const { rpc } = useRpc();

  const remove = useMutation(rpc.bots.delete.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rpc.bots.list.key() });

      for (const queryKey of [rpc.bots.get.key({ input: { botId } }), rpc.routines.key(), rpc.todos.key(), rpc.artifacts.key()]) {
        queryClient.removeQueries({ queryKey });
      }

      await onDeleted();
    },
  }));

  return {
    isPending: remove.isPending,
    problem: remove.isError ? m.rooms_bot_delete_error() : null,
    remove: () => remove.mutate({ botId }),
  };
}
