import { roomsChoice } from '@openbots/client/client';
import { useChatQuestion } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { Question, QuestionDescription, QuestionField, QuestionHeader, QuestionHeading, QuestionOption, QuestionOptions, QuestionTitle } from '@/components/ui/ai/question';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import IconArrowUp from '~icons/lucide/arrow-up';
import IconX from '~icons/lucide/x';
import type { ConversationQuestion } from '@openbots/contracts/universal';

interface RoomsChatQuestionsProps {
  question: ConversationQuestion
  className?: string
}

export function RoomsChatQuestions({ question, className }: RoomsChatQuestionsProps) {
  const card = useChatQuestion(question);

  return (
    <Question className={className}>
      <QuestionHeader>
        <QuestionHeading>
          <QuestionTitle>{card.title}</QuestionTitle>
          {card.detail ? <QuestionDescription>{card.detail}</QuestionDescription> : null}
          <QuestionDescription>{card.hint}</QuestionDescription>
        </QuestionHeading>
        <Button
          aria-label={m.rooms_chat_question_skip()}
          disabled={card.isAnswered}
          size="icon-xs"
          title={m.rooms_chat_question_skip()}
          variant="ghost"
          onClick={card.skip}
        >
          <IconX />
        </Button>
      </QuestionHeader>
      {question.choices.length > 0 ? (
        <QuestionOptions aria-label={question.text}>
          {question.choices.map((choice, index) => {
            const { label, recommended } = roomsChoice({ choice });

            return (
              <QuestionOption
                aria-checked={question.isMultiSelect ? card.picked.includes(choice) : undefined}
                disabled={card.isAnswered}
                index={index}
                key={choice}
                role={question.isMultiSelect ? 'checkbox' : undefined}
                onClick={() => card.choose(choice)}
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
          card.send();
        }}
      >
        <QuestionField
          action={(
            <Button
              aria-label={m.rooms_chat_question_send()}
              disabled={card.isAnswered || !card.canSend}
              size="icon-sm"
              title={m.rooms_chat_question_send()}
              type="submit"
              variant="default"
            >
              <IconArrowUp />
            </Button>
          )}
          aria-label={card.isSecret ? m.rooms_chat_question_secret_placeholder() : m.rooms_chat_question_other()}
          autoComplete={card.isSecret ? 'off' : undefined}
          disabled={card.isAnswered}
          placeholder={card.isSecret ? m.rooms_chat_question_secret_placeholder() : m.rooms_chat_question_other()}
          spellCheck={!card.isSecret}
          type={card.isSecret ? 'password' : 'text'}
          value={card.typed}
          onChange={(event) => card.setTyped(event.target.value)}
        />
      </form>
      {card.problem ? <p className="px-1 text-xs text-destructive" role="alert">{card.problem}</p> : null}
    </Question>
  );
}
