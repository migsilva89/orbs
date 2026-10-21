import { ORPCError } from '@orpc/client';
import { useMutation } from '@tanstack/react-query';
import { match } from 'ts-pattern';
import { chatAnswerProblem } from '../services/chat/chat.utils';
import { useRpc } from './use-rpc';
import type { ChatApprovalDecision } from '../types/chat.types';
import type { ToolApproval } from '@openbots/contracts/universal';

/** Answers a pending tool approval; `always` also stops the bot asking for this tool. `problem` explains a failed or no longer pending answer. */
export function useChatApproval(approval: ToolApproval) {
  const { rpc } = useRpc();
  const answer = useMutation(rpc.tools.answer.mutationOptions({ meta: { invalidates: [rpc.tools.pending.key()] } }));
  const isGone = (answer.error instanceof ORPCError && answer.error.code === 'NOT_FOUND') || answer.data?.accepted === false;

  return {
    chosen: match(answer.variables)
      .with({ approved: true, always: true }, () => 'always' as const)
      .with({ approved: true }, () => 'approve' as const)
      .with({ approved: false }, () => 'deny' as const)
      .otherwise(() => undefined),
    isAnswered: answer.isPending || answer.data?.accepted === true,
    problem: chatAnswerProblem({ isGone, isError: answer.isError }),
    answer: (choice: ChatApprovalDecision) => answer.mutate({
      botId: approval.botId,
      id: approval.id,
      approved: choice !== 'deny',
      always: choice === 'always',
    }),
  };
}
