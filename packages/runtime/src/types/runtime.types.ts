import type { Models } from '@earendil-works/pi-ai/models';
import type * as PiDurableTypes from '@earendil-works/pi-durable';

export interface RuntimeServiceParams {
  storage: PiDurableTypes.Storage;
  models: Models;
  agent?: PiDurableTypes.AgentChange;
}

export interface RuntimeSubmitDeps {
  conversation: PiDurableTypes.Conversation;
}

export type RuntimeSubmitParams = Omit<PiDurableTypes.InputSubmissionDraft, 'type' | 'requestId'> & { requestId: string };

export interface RuntimeHistoryParams {
  limit?: number;
  cursor?: PiDurableTypes.Cursor;
}
