import type { Harness } from '@earendil-works/pi-durable';
import type * as PiDurableTypes from '@earendil-works/pi-durable';

export interface QuestionServiceDeps {
  harness: Harness;
}

export interface QuestionPendingParams {
  conversationId: PiDurableTypes.ConversationId;
}

export interface QuestionAnswerParams extends QuestionPendingParams {
  id: number;
  answer: string;
  answeredBy: string;
}

export interface QuestionAskParams {
  text: string;
  choices?: string[];
}

export interface QuestionPending {
  id: number;
  conversationId: PiDurableTypes.ConversationId;
  text: string;
  choices: string[];
  createdAt: number;
  expiresAt: number;
}

export interface QuestionRecord extends PiDurableTypes.JsonObject {
  id: number;
  conversationId: PiDurableTypes.ConversationId;
  text: string;
  choices: string[];
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'answered' | 'expired';
  answer: string | null;
  answeredAt: number | null;
  answeredBy: string | null;
}

export type QuestionDetails = PiDurableTypes.JsonObject & {
  text: string;
  choices: string[];
  expiresAt: number;
};
