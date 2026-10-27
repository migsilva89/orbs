import { ROOMS_APPROVAL_CHOICES, roomsApprovalText, toolPresentation } from '@repo/client/client';
import { useChatApproval } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { MessageCode } from '@/components/ui/message';
import { QuestionCard, QuestionCardHeader, QuestionCardOption, QuestionCardOptions } from '@/components/ui/question-card';
import { Text } from '@/components/ui/text';
import type { ToolApproval } from '@repo/contracts/universal';

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
      {text.code ? <MessageCode>{text.code}</MessageCode> : null}
      <QuestionCardOptions>
        {ROOMS_APPROVAL_CHOICES.map((choice, index) => (
          <QuestionCardOption
            disabled={answer.isAnswered}
            index={index}
            key={choice.decision}
            selected={answer.chosen === choice.decision}
            tone={choice.tone}
            onPress={() => answer.answer(choice.decision)}
          >
            <Text>{choice.label()}</Text>
          </QuestionCardOption>
        ))}
      </QuestionCardOptions>
      {answer.problem ? <Text tone="destructive" variant="small">{answer.problem}</Text> : null}
    </QuestionCard>
  );
}
