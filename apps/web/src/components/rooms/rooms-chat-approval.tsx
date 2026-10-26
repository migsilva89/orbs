import { ROOMS_APPROVAL_CHOICES, roomsApprovalText, toolPresentation } from '@repo/client/client';
import { useChatApproval } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { ToolInput } from '@/components/tools/tool-input';
import { Question, QuestionDescription, QuestionHeader, QuestionHeading, QuestionOption, QuestionOptions, QuestionTitle } from '@/components/ui/ai/question';
import { ToolCodeBlock } from '@/components/ui/ai/tool';
import type { ToolApproval } from '@repo/contracts/universal';

interface RoomsChatApprovalProps {
  approval: ToolApproval
  botName: string
  className?: string
}

export function RoomsChatApproval({ approval, botName, className }: RoomsChatApprovalProps) {
  const answer = useChatApproval(approval);
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
      {text.code ? <ToolCodeBlock>{text.code}</ToolCodeBlock> : <ToolInput input={approval.arguments} />}
      <QuestionOptions>
        {ROOMS_APPROVAL_CHOICES.map((choice, index) => (
          <QuestionOption
            aria-pressed={answer.chosen === choice.decision}
            disabled={answer.isAnswered}
            index={index}
            key={choice.decision}
            tone={choice.tone}
            onClick={() => answer.answer(choice.decision)}
          >
            {choice.label()}
          </QuestionOption>
        ))}
      </QuestionOptions>
      {answer.problem ? <p className="px-1 text-xs text-destructive" role="alert">{answer.problem}</p> : null}
    </Question>
  );
}
