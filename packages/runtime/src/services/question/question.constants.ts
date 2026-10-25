import { defineDoc } from '@earendil-works/pi-durable';
import type { QuestionDocument } from '../../types/question.types';

export const QUESTION = {
  extension: 'bots.questions',
  tool: 'bot_question',
  secretTool: 'bot_secret',
  document: 'bots.question',
  timeoutMs: 300_000,
} as const;

export const questionDocument = defineDoc<QuestionDocument>({
  kind: QUESTION.document,
  version: 1,
  scope: 'task',
  initial: () => ({ question: null }),
  checkpointWhen: () => false,
});
