import { z } from 'zod';
import { conversationTarget } from './conversation.types';
import { secretRule, secretSave } from './secret.types';

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

/** A stored answer. A secret answer records only that the value was saved; the value never reaches the bot. */
export const questionAnswer = z.discriminatedUnion('kind', [
  questionAnswerText,
  questionAnswerChoices,
  questionAnswerSkip,
  z.object({ kind: z.literal('secret') }),
]);

/** What the owner sends: a secret answer carries the value, which the server stores before answering. */
export const questionAnswerInput = z.discriminatedUnion('kind', [
  questionAnswerText,
  questionAnswerChoices,
  questionAnswerSkip,
  z.object({ kind: z.literal('secret'), value: secretSave.shape.value }),
]);

export const conversationQuestion = z.object({
  id: z.number().int().positive(),
  botId: z.uuid(),
  conversationId: z.number().int().positive(),
  text: questionText,
  choices: questionChoices,
  isMultiSelect: z.boolean(),
  secret: secretRule.nullable(),
  createdAt: z.number().int(),
  expiresAt: z.number().int(),
});

export const conversationQuestionList = z.array(conversationQuestion);

export const conversationAnswerQuestion = conversationTarget.extend({
  id: z.number().int().positive(),
  answer: questionAnswerInput,
});

export const conversationAnswerQuestionResult = z.object({
  isAccepted: z.boolean(),
});

export type QuestionAnswer = z.infer<typeof questionAnswer>;
export type QuestionAnswerInput = z.infer<typeof questionAnswerInput>;
export type ConversationQuestion = z.infer<typeof conversationQuestion>;
export type ConversationQuestionList = z.infer<typeof conversationQuestionList>;
export type ConversationAnswerQuestionInput = z.infer<typeof conversationAnswerQuestion>;
export type ConversationAnswerQuestionResult = z.infer<typeof conversationAnswerQuestionResult>;
