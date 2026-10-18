import type * as PiDurableTypes from '@earendil-works/pi-durable';

export interface SubagentMessageParams {
  name: string;
  message: string;
  whenBusy?: 'steer' | 'followUp';
}

export interface SubagentAgents extends PiDurableTypes.JsonObject {
  agents: Record<string, { conversationId: PiDurableTypes.ConversationId }>;
}

export interface SubagentCall extends PiDurableTypes.JsonObject {
  text: string | null;
  name: string | null;
  conversationId: PiDurableTypes.ConversationId | null;
}

export type SubagentDetails = PiDurableTypes.JsonObject & {
  conversationId: PiDurableTypes.ConversationId;
  taskId: PiDurableTypes.TaskId;
  name: string | null;
};

export interface SubagentReporterInput extends PiDurableTypes.JsonObject {
  name: string;
  conversationId: PiDurableTypes.ConversationId;
  message: string;
  whenBusy: 'steer' | 'followUp';
}

export type SubagentReporterState =
  | { phase: 'deliver' }
  | { phase: 'report'; report: string | null; answerId?: PiDurableTypes.EntryId };
