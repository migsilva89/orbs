import { ROOMS_APPROVAL_CHOICES, roomsApprovalText, toolPresentation } from '@openbots/client/client';
import { useChatApproval } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { QuestionCard, QuestionCardHeader, QuestionCardOption, QuestionCardOptions } from '@/components/ui/question-card';
import { Text } from '@/components/ui/text';
import { TraceCode } from '@/components/ui/trace';
import type { ToolApproval } from '@openbots/contracts/universal';

interface ChatApprovalProps {
  approval: ToolApproval;
  botName: string;
}

export function ChatApproval({ approval, botName }: ChatApprovalProps) {
  const answer = useChatApproval(approval);
  const text = roomsApprovalText({ input: approval.arguments });
  const label = toolPresentation({ toolName: approval.toolName }).label;

  return (
    <QuestionCard>
      <QuestionCardHeader descriptions={[label, ...(text.description ? [text.description] : [])]} title={m.rooms_chat_approval_title({ bot: botName })} />
      {text.code ? <TraceCode>{text.code}</TraceCode> : null}
      <QuestionCardOptions>
        {ROOMS_APPROVAL_CHOICES.map((choice) => (
          <QuestionCardOption
            disabled={answer.isAnswered}
            key={choice.label()}
            selected={answer.chosen === choice.approved}
            onPress={() => answer.answer(choice.approved)}
          >
            <Text>{choice.label()}</Text>
          </QuestionCardOption>
        ))}
      </QuestionCardOptions>
      {answer.problem ? <Text tone="destructive" variant="small">{answer.problem}</Text> : null}
    </QuestionCard>
  );
}
