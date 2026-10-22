import { m } from '@repo/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { botHandle } from '../services/bot/bot.utils';
import { useRpc } from './use-rpc';
import type { BotCreateParams } from '../types/bot.types';
import type { BotForm } from '@repo/contracts/universal';

/** Creates a bot from the shared bot form, filling an empty handle from the name, and refreshes the bot list. */
export function useBotCreate({ onCreated }: BotCreateParams) {
  const { rpc } = useRpc();
  const create = useMutation(rpc.bots.create.mutationOptions({ meta: { invalidates: [rpc.bots.list.key()] }, onSuccess: onCreated }));

  return {
    isPending: create.isPending,
    problem: create.isError ? m.rooms_bot_create_error() : null,
    create: (input: BotForm) => create.mutate({ ...input, handle: input.handle === '' ? botHandle({ name: input.name }) : input.handle }),
  };
}
