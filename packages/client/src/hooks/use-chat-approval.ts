import { ORPCError } from '@orpc/client';
import { useMutation } from '@tanstack/react-query';
import { chatAnswerProblem } from '../services/chat/chat.utils';
import { useRpc } from './use-rpc';
import type { ToolApproval } from '@openbots/contracts/universal';

/** Answers a pending tool approval; `problem` explains a failed or no longer pending answer. */
export function useChatApproval(approval: ToolApproval) {
  const { rpc } = useRpc();
  const answer = useMutation(rpc.tools.answer.mutationOptions({ meta: { invalidates: [rpc.tools.pending.key()] } }));
  const isGone = (answer.error instanceof ORPCError && answer.error.code === 'NOT_FOUND') || answer.data?.accepted === false;

  return {
    chosen: answer.variables?.approved,
    isAnswered: answer.isPending || answer.data?.accepted === true,
    problem: chatAnswerProblem({ isGone, isError: answer.isError }),
    answer: (approved: boolean) => answer.mutate({
      botId: approval.botId,
      id: approval.id,
      approved,
    }),
  };
}
