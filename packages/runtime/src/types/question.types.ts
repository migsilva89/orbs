import type { Harness } from '@earendil-works/pi-durable';
import type * as PiDurableTypes from '@earendil-works/pi-durable';
import type { QuestionAnswer } from '@openbots/contracts/universal';

export interface QuestionServiceDeps {
  harness: Harness;
}

export interface QuestionPendingParams {
  conversationId: PiDurableTypes.ConversationId;
}

export interface QuestionAnswerParams extends QuestionPendingParams {
  id: number;
  answer: QuestionAnswer;
  answeredBy: string;
}

export interface QuestionAskParams {
  text: string;
  choices?: string[];
  isMultiSelect?: boolean;
}

export interface QuestionPending {
  id: number;
  conversationId: PiDurableTypes.ConversationId;
  text: string;
  choices: string[];
  isMultiSelect: boolean;
  createdAt: number;
  expiresAt: number;
}

export interface QuestionRecord extends PiDurableTypes.JsonObject {
  id: number;
  conversationId: PiDurableTypes.ConversationId;
  text: string;
  choices: string[];
  isMultiSelect: boolean;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'answered' | 'expired';
  answer: QuestionAnswer | null;
  answeredAt: number | null;
  answeredBy: string | null;
}

export type QuestionDetails = PiDurableTypes.JsonObject & {
  text: string;
  choices: string[];
  isMultiSelect: boolean;
  expiresAt: number;
};
