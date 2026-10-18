import { defineDoc } from '@earendil-works/pi-durable';
import type { QuestionRecord } from '../../types/question.types';

export const QUESTION = {
  extension: 'openbots.questions',
  tool: 'bot_question',
  document: 'openbots.question',
  timeoutMs: 300_000,
} as const;

export const questionDocument = defineDoc({
  kind: QUESTION.document,
  version: 1,
  scope: 'task',
  initial: (): { question: QuestionRecord | null } => ({ question: null }),
});
