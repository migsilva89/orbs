import { m } from '@repo/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { botHandle } from '../services/bot/bot.utils';
import { useRpc } from './use-rpc';
import type { BotCreateParams } from '../types/bot.types';
import type { BotForm } from '@repo/contracts/universal';

export function useBotCreate({ onCreated }: BotCreateParams) {
  const queryClient = useQueryClient();
  const { rpc } = useRpc();

  const create = useMutation(rpc.bots.create.mutationOptions({
    onSuccess: async (bot) => {
      await queryClient.invalidateQueries({ queryKey: rpc.bots.list.key() });
      onCreated(bot);
    },
  }));

  return {
    isPending: create.isPending,
    problem: create.isError ? m.rooms_bot_create_error() : null,
    create: (input: BotForm) => create.mutate({ ...input, handle: input.handle === '' ? botHandle({ name: input.name }) : input.handle }),
  };
}
