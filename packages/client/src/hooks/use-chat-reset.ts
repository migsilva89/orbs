import { m } from '@repo/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { useRpc } from './use-rpc';
import type { ChatResetParams } from '../types/chat.types';

/** Runs `/reset` for a bot, optionally handing the summary text to the fresh conversation. */
export function useChatReset({ botId, handoff, onDone }: ChatResetParams) {
  const { rpc } = useRpc();
  const reset = useMutation(rpc.commands.execute.mutationOptions({ meta: { success: m.rooms_fresh_done() }, onSuccess: onDone }));

  return {
    isPending: reset.isPending,
    problem: reset.isError ? m.rooms_fresh_failed() : null,
    reset: () => reset.mutate({
      botId,
      name: 'reset',
      arguments: handoff,
    }),
  };
}
