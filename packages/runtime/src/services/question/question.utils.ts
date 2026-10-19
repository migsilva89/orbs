import { Errors } from '@openbots/errors/universal';
import { match } from 'ts-pattern';
import type { QuestionPending, QuestionRecord } from '../../types/question.types';
import type { QuestionAnswer } from '@openbots/contracts/universal';

export function questionCopy(question: QuestionRecord): QuestionRecord {
  return {
    id: question.id,
    conversationId: question.conversationId,
    text: question.text,
    choices: [...question.choices],
    isMultiSelect: question.isMultiSelect,
    createdAt: question.createdAt,
    expiresAt: question.expiresAt,
    status: question.status,
    answer: match(question.answer)
      .with({ kind: 'choices' }, ({ choices }) => ({ kind: 'choices' as const, choices: [...choices] }))
      .otherwise((answer) => answer && { ...answer }),
    answeredAt: question.answeredAt,
    answeredBy: question.answeredBy,
  };
}

export function questionPendingView(question: QuestionRecord): QuestionPending {
  const copied = questionCopy(question);

  return {
    id: copied.id,
    conversationId: copied.conversationId,
    text: copied.text,
    choices: copied.choices,
    isMultiSelect: copied.isMultiSelect,
    createdAt: copied.createdAt,
    expiresAt: copied.expiresAt,
  };
}

export function questionAnswerValidate(question: QuestionRecord, answer: QuestionAnswer): void {
  match(answer)
    .with({ kind: 'choices' }, ({ choices }) => {
      const isKnown = choices.every((choice) => question.choices.includes(choice));
      const isUnique = new Set(choices).size === choices.length;
      const isCountAllowed = question.isMultiSelect || choices.length === 1;

      match(isKnown && isUnique && isCountAllowed)
        .with(true, () => undefined)
        .with(false, () => {
          throw new Errors.VALIDATION_ERROR({ fields: { answer: { message: 'validation_question_choices' } } });
        })
        .exhaustive();
    })
    .otherwise(() => undefined);
}
