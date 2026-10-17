import type { Context } from '@earendil-works/chord/context';
import type { ModelThinkingLevel, ToolCall } from '@earendil-works/pi-ai';
import type { Models } from '@earendil-works/pi-ai/models';
import type * as PiDurableTypes from '@earendil-works/pi-durable';

export interface RuntimeServiceParams {
  storage: PiDurableTypes.Storage;
  models: Models;
  env: NonNullable<PiDurableTypes.HarnessOptions['env']>;
  permissions: RuntimeToolPolicy;
  toolExtensions?: PiDurableTypes.Extension[];
  readOnlyTools?: PiDurableTypes.ToolRegistration[];
}

export interface RuntimeToolPolicy {
  authorize(call: RuntimeToolCall, context: Context): Promise<RuntimeToolDecision>;
}

export interface RuntimeToolsDeps extends Pick<RuntimeServiceDeps, 'harness' | 'readOnlyTools'> {
  permissions: RuntimeToolPolicy;
}

export interface RuntimeToolCall {
  botId: string;
  taskId: number;
  name: string;
  arguments: ToolCall['arguments'];
  isReadOnly: boolean;
  getRequest: () => Promise<string>;
  approved?: boolean;
}

export interface RuntimeModelsDeps {
  models: Models;
}

export interface RuntimeServiceDeps extends RuntimeModelsDeps {
  harness: PiDurableTypes.Harness;
  readOnlyTools: PiDurableTypes.ToolRegistration[];
  extensions: PiDurableTypes.Extension[];
}

export interface RuntimeBotParams {
  id: string;
  modelProvider: string;
  modelId: string;
  thinkingLevel: ModelThinkingLevel;
  instructions: string;
  skillsPrompt: string;
  permission: 'read-only' | 'ask' | 'auto' | 'full';
}

export type RuntimeModelParams = Pick<RuntimeBotParams, 'modelProvider' | 'modelId' | 'thinkingLevel'>;

export interface RuntimeBotBinding extends PiDurableTypes.JsonObject {
  conversationId: PiDurableTypes.ConversationId | null;
}

export interface RuntimeConversationParams {
  botId: string;
}

export type RuntimeSubmitParams = Omit<PiDurableTypes.InputSubmissionDraft, 'type' | 'requestId'>
  & RuntimeConversationParams
  & { requestId: string };

export interface RuntimeHistoryParams extends RuntimeConversationParams {
  limit?: number;
  cursor?: PiDurableTypes.Cursor;
}

export type RuntimeToolDecision = 'allow' | 'deny' | 'ask';

export interface RuntimeApprovalAnswer extends RuntimeConversationParams {
  id: number;
  approved: boolean;
  answeredBy: string;
}

export interface RuntimeApproval extends PiDurableTypes.JsonObject {
  id: number;
  botId: string;
  toolName: string;
  arguments: PiDurableTypes.JsonObject;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'allowed' | 'denied' | 'expired';
  answeredAt: number | null;
  answeredBy: string | null;
}

export interface RuntimeApprovalRequest {
  call: RuntimeToolCall;
  taskId: PiDurableTypes.TaskId;
  context: Context;
}
