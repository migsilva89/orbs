import { ROOMS_APPROVAL_CHOICES, roomsApprovalText, toolPresentation } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { ORPCError } from '@orpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QuestionCard, QuestionCardHeader, QuestionCardOption, QuestionCardOptions } from '@/components/ui/question-card';
import { Text } from '@/components/ui/text';
import { TraceCode } from '@/components/ui/trace';
import type { RpcSession } from '@/types/rpc.types';
import type { ToolApproval } from '@openbots/contracts/universal';

interface ChatApprovalProps {
  session: RpcSession;
  approval: ToolApproval;
  botName: string;
}

export function ChatApproval({ session, approval, botName }: ChatApprovalProps) {
  const queryClient = useQueryClient();

  const answer = useMutation(session.rpc.tools.answer.mutationOptions({
    onSettled: () => queryClient.invalidateQueries({ queryKey: session.rpc.tools.pending.key() }),
  }));

  const isGone = (answer.error instanceof ORPCError && answer.error.code === 'NOT_FOUND') || answer.data?.accepted === false;
  const isAnswered = answer.isPending || answer.data?.accepted === true;
  const text = roomsApprovalText({ input: approval.arguments });
  const label = toolPresentation({ toolName: approval.toolName }).label;

  return (
    <QuestionCard>
      <QuestionCardHeader descriptions={[label, ...(text.description ? [text.description] : [])]} title={m.rooms_chat_approval_title({ bot: botName })} />
      {text.code ? <TraceCode>{text.code}</TraceCode> : null}
      <QuestionCardOptions>
        {ROOMS_APPROVAL_CHOICES.map((choice) => (
          <QuestionCardOption
            disabled={isAnswered}
            key={choice.label()}
            selected={answer.variables?.approved === choice.approved}
            onPress={() => answer.mutate({
              botId: approval.botId,
              id: approval.id,
              approved: choice.approved,
            })}
          >
            <Text>{choice.label()}</Text>
          </QuestionCardOption>
        ))}
      </QuestionCardOptions>
      {answer.isError || isGone ? <Text tone="destructive" variant="small">{isGone ? m.rooms_chat_approval_gone() : m.rooms_chat_approval_error()}</Text> : null}
    </QuestionCard>
  );
}
