import { useMutation } from '@tanstack/react-query';
import { useRpc } from './use-rpc';
import type { ConversationTarget } from '@openbots/contracts/universal';

/** Moves a queued follow-up into the running reply as a steer. */
export function useChatQueue({ botId, conversationId }: Required<ConversationTarget>) {
  const { rpc } = useRpc();
  const promote = useMutation(rpc.conversation.updateSubmission.mutationOptions());

  return {
    isPending: promote.isPending,
    isFailed: (submissionId: number) => promote.isError && promote.variables.submissionId === submissionId,
    steer: (submissionId: number) => promote.mutate({
      botId,
      conversationId,
      submissionId,
      whenBusy: 'steer',
    }),
  };
}
