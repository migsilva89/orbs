import { roomsChoice, roomsQuestionText } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { ORPCError } from '@orpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { Question, QuestionDescription, QuestionField, QuestionHeader, QuestionHeading, QuestionOption, QuestionOptions, QuestionTitle } from '@/components/ui/ai/question';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { rpc } from '@/services/rpc/rpc.client';
import IconArrowUp from '~icons/lucide/arrow-up';
import IconX from '~icons/lucide/x';
import type { ConversationQuestion, QuestionAnswer } from '@openbots/contracts/universal';

interface RoomsChatQuestionsProps {
  question: ConversationQuestion
  className?: string
}

export function RoomsChatQuestions({ question, className }: RoomsChatQuestionsProps) {
  const queryClient = useQueryClient();

  const answer = useMutation(rpc.conversation.answerQuestion.mutationOptions({
    onSettled: () => queryClient.invalidateQueries({ queryKey: rpc.conversation.questions.key() }),
  }));

  const [picked, setPicked] = useState<string[]>([]);
  const [typed, setTyped] = useState('');
  const gone = (answer.error instanceof ORPCError && answer.error.code === 'NOT_FOUND') || answer.data?.isAccepted === false;
  const answered = answer.isPending || answer.data?.isAccepted === true;
  const own = typed.trim();
  const hasChoices = question.choices.length > 0;
  const multi = question.isMultiSelect ? [...picked, ...(own ? [own] : [])] : [];

  const { title, detail } = roomsQuestionText({ question: question.text });

  const hint = match(question)
    .with({ choices: [] }, () => m.rooms_chat_question_open())
    .with({ isMultiSelect: true }, () => m.rooms_chat_question_many())
    .otherwise(() => m.rooms_chat_question_one());

  const reply = (value: QuestionAnswer) => answer.mutate({
    botId: question.botId,
    conversationId: question.conversationId,
    id: question.id,
    answer: value,
  });

  const send = () => {
    if (question.isMultiSelect && picked.length > 0 && !own) {
      reply({ kind: 'choices', choices: picked });
    } else if (own) {
      reply({ kind: 'text', text: question.isMultiSelect && picked.length > 0 ? [...picked, own].join(', ') : own });
    }
  };

  return (
    <Question className={className}>
      <QuestionHeader>
        <QuestionHeading>
          <QuestionTitle>{title}</QuestionTitle>
          {detail ? <QuestionDescription>{detail}</QuestionDescription> : null}
          <QuestionDescription>{hint}</QuestionDescription>
        </QuestionHeading>
        <Button
          aria-label={m.rooms_chat_question_skip()}
          disabled={answered}
          size="icon-xs"
          title={m.rooms_chat_question_skip()}
          variant="ghost"
          onClick={() => reply({ kind: 'skip' })}
        >
          <IconX />
        </Button>
      </QuestionHeader>
      {hasChoices ? (
        <QuestionOptions aria-label={question.text}>
          {question.choices.map((choice, index) => {
            const { label, recommended } = roomsChoice({ choice });

            return (
              <QuestionOption
                aria-checked={question.isMultiSelect ? picked.includes(choice) : undefined}
                disabled={answered}
                index={index}
                key={choice}
                role={question.isMultiSelect ? 'checkbox' : undefined}
                onClick={() => (question.isMultiSelect
                  ? setPicked(picked.includes(choice) ? picked.filter((item) => item !== choice) : [...picked, choice])
                  : reply({ kind: 'choices', choices: [choice] }))}
              >
                <span className="min-w-0">{label}</span>
                {recommended ? <Badge variant="outline">{m.rooms_chat_question_recommended()}</Badge> : null}
              </QuestionOption>
            );
          })}
        </QuestionOptions>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <QuestionField
          action={(
            <Button
              aria-label={m.rooms_chat_question_send()}
              disabled={answered || (question.isMultiSelect ? multi.length === 0 : !own)}
              size="icon-sm"
              title={m.rooms_chat_question_send()}
              type="submit"
              variant="default"
            >
              <IconArrowUp />
            </Button>
          )}
          aria-label={m.rooms_chat_question_other()}
          disabled={answered}
          placeholder={m.rooms_chat_question_other()}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
        />
      </form>
      {answer.isError ? <p className="px-1 text-xs text-destructive" role="alert">{gone ? m.rooms_chat_approval_gone() : m.rooms_chat_approval_error()}</p> : null}
    </Question>
  );
}
