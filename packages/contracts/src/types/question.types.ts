import { z } from 'zod';
import { secretSave } from './secret.types';

export const QUESTION = {
  maxText: 4_000,
  maxChoice: 200,
  maxChoices: 8,
} as const;

export const questionText = z.string().trim().min(1).max(QUESTION.maxText);
export const questionChoice = z.string().trim().min(1).max(QUESTION.maxChoice);
export const questionChoices = z.array(questionChoice).max(QUESTION.maxChoices);

const questionAnswerText = z.object({ kind: z.literal('text'), text: questionText });
const questionAnswerChoices = z.object({ kind: z.literal('choices'), choices: questionChoices.min(1) });
const questionAnswerSkip = z.object({ kind: z.literal('skip') });

export const questionAnswer = z.discriminatedUnion('kind', [
  questionAnswerText,
  questionAnswerChoices,
  questionAnswerSkip,
  z.object({ kind: z.literal('secret') }),
]);

export const questionAnswerInput = z.discriminatedUnion('kind', [
  questionAnswerText,
  questionAnswerChoices,
  questionAnswerSkip,
  z.object({ kind: z.literal('secret'), value: secretSave.shape.value }),
]);

export type QuestionAnswer = z.infer<typeof questionAnswer>;
export type QuestionAnswerInput = z.infer<typeof questionAnswerInput>;
