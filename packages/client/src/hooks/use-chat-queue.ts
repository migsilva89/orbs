import { m } from '@openbots/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { useRpc } from './use-rpc';
import type { ChatQueueParams } from '../types/chat.types';

/** Queued inputs: send one now in place of the running reply, or remove one before the bot reads it. */
export function useChatQueue({ botId, conversationId, onOutgoingChange }: ChatQueueParams) {
  const { rpc } = useRpc();
  const interrupt = useMutation(rpc.conversation.updateSubmission.mutationOptions());
  const cancel = useMutation(rpc.commands.execute.mutationOptions());

  return {
    isPending: interrupt.isPending || cancel.isPending,
    problem: (submissionId: number) => {
      if (interrupt.isError && interrupt.variables.submissionId === submissionId) {
        return m.rooms_chat_queue_send_failed();
      }

      return cancel.isError && cancel.variables.arguments === String(submissionId) ? m.rooms_chat_queue_remove_failed() : null;
    },
    sendNow: (submissionId: number) => interrupt.mutate({
      botId,
      conversationId,
      submissionId,
      whenBusy: 'interrupt',
    }),
    remove: (submissionId: number) => cancel.mutate({
      botId,
      name: 'cancel',
      arguments: String(submissionId),
    }, { onSuccess: () => onOutgoingChange((items) => items.filter((item) => item.submissionId !== submissionId)) }),
  };
}
