import type { QuestionPending, QuestionRecord } from '../../types/question.types';

export function questionCopy(question: QuestionRecord): QuestionRecord {
  return {
    id: question.id,
    conversationId: question.conversationId,
    text: question.text,
    choices: [...question.choices],
    createdAt: question.createdAt,
    expiresAt: question.expiresAt,
    status: question.status,
    answer: question.answer,
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
    createdAt: copied.createdAt,
    expiresAt: copied.expiresAt,
  };
}
