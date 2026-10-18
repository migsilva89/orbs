import { z } from 'zod';
import { conversationTarget } from './conversation.types';

export const QUESTION = {
  maxText: 4_000,
  maxChoice: 200,
  maxChoices: 8,
} as const;

export const questionText = z.string().trim().min(1).max(QUESTION.maxText);
export const questionChoice = z.string().trim().min(1).max(QUESTION.maxChoice);
export const questionChoices = z.array(questionChoice).max(QUESTION.maxChoices);

export const conversationQuestion = z.object({
  id: z.number().int().positive(),
  botId: z.uuid(),
  conversationId: z.number().int().positive(),
  text: questionText,
  choices: questionChoices,
  createdAt: z.number().int(),
  expiresAt: z.number().int(),
});

export const conversationQuestionList = z.array(conversationQuestion);

export const conversationAnswerQuestion = conversationTarget.extend({
  id: z.number().int().positive(),
  answer: questionText,
});

export const conversationAnswerQuestionResult = z.object({
  isAccepted: z.boolean(),
});

export type ConversationQuestion = z.infer<typeof conversationQuestion>;
export type ConversationQuestionList = z.infer<typeof conversationQuestionList>;
export type ConversationAnswerQuestionInput = z.infer<typeof conversationAnswerQuestion>;
export type ConversationAnswerQuestionResult = z.infer<typeof conversationAnswerQuestionResult>;
