import { m } from '@openbots/i18n/client';
import { ORPCError } from '@orpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToolInput } from '@/components/tools/tool-input';
import { Question, QuestionDescription, QuestionHeader, QuestionHeading, QuestionOption, QuestionOptions, QuestionTitle } from '@/components/ui/ai/question';
import { ToolCode } from '@/components/ui/ai/tool';
import { roomsApprovalText } from '@/services/rooms/rooms.client';
import { ROOMS_APPROVAL_CHOICES } from '@/services/rooms/rooms.constants';
import { rpc } from '@/services/rpc/rpc.client';
import { toolPresentation } from '@/services/tool/tool.client';
import type { ToolApproval } from '@openbots/contracts/universal';

interface RoomsChatApprovalProps {
  approval: ToolApproval
  botName: string
  className?: string
}

export function RoomsChatApproval({ approval, botName, className }: RoomsChatApprovalProps) {
  const queryClient = useQueryClient();

  const answer = useMutation(rpc.tools.answer.mutationOptions({
    onSettled: () => queryClient.invalidateQueries({ queryKey: rpc.tools.pending.key() }),
  }));

  const isGone = (answer.error instanceof ORPCError && answer.error.code === 'NOT_FOUND') || answer.data?.accepted === false;
  const isAnswered = answer.isPending || answer.data?.accepted === true;
  const text = roomsApprovalText({ input: approval.arguments });

  return (
    <Question className={className}>
      <QuestionHeader>
        <QuestionHeading>
          <QuestionTitle>{m.rooms_chat_approval_title({ bot: botName })}</QuestionTitle>
          <QuestionDescription title={approval.toolName}>{toolPresentation({ toolName: approval.toolName }).label}</QuestionDescription>
          {text.description ? <QuestionDescription>{text.description}</QuestionDescription> : null}
        </QuestionHeading>
      </QuestionHeader>
      {text.code ? (
        <div className="px-1">
          <ToolCode>{text.code}</ToolCode>
        </div>
      ) : <ToolInput input={approval.arguments} />}
      <QuestionOptions>
        {ROOMS_APPROVAL_CHOICES.map((choice, index) => (
          <QuestionOption
            aria-pressed={answer.variables?.approved === choice.approved}
            disabled={isAnswered}
            index={index}
            key={choice.label()}
            onClick={() => answer.mutate({
              botId: approval.botId,
              id: approval.id,
              approved: choice.approved,
            })}
          >
            {choice.label()}
          </QuestionOption>
        ))}
      </QuestionOptions>
      {answer.isError || isGone ? <p className="px-1 text-xs text-destructive" role="alert">{isGone ? m.rooms_chat_approval_gone() : m.rooms_chat_approval_error()}</p> : null}
    </Question>
  );
}
