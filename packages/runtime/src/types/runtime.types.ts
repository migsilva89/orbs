import type { ConversationIndexService } from '../services/conversation-index/conversation-index.service';
import type { CollaborationPolicy } from './collaboration.types';
import type { Context } from '@earendil-works/chord/context';
import type { ModelThinkingLevel, ToolCall } from '@earendil-works/pi-ai';
import type { Models } from '@earendil-works/pi-ai/models';
import type * as PiDurableTypes from '@earendil-works/pi-durable';

export interface RuntimeServiceParams {
  storage: PiDurableTypes.Storage;
  models: Models;
  env: NonNullable<PiDurableTypes.HarnessOptions['env']>;
  permissions: RuntimeToolPolicy;
  collaboration: CollaborationPolicy;
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
  index: ConversationIndexService;
  registry: PiDurableTypes.Registry;
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
  instructionFiles: { path: string; content: string }[];
  plugins: PiDurableTypes.Extension[];
  tools: PiDurableTypes.ToolRegistration[];
  permission: 'read-only' | 'ask' | 'auto' | 'full';
}

export type RuntimeModelParams = Pick<RuntimeBotParams, 'modelProvider' | 'modelId' | 'thinkingLevel'>;

export interface RuntimeBotBinding extends PiDurableTypes.JsonObject {
  conversationId: PiDurableTypes.ConversationId | null;
}

export interface RuntimeConversationParams {
  botId: string;
  conversationId?: number;
}

export interface RuntimeSubmissionParams extends RuntimeConversationParams {
  requestId: string;
}

export type RuntimeSubmitParams = Omit<PiDurableTypes.InputSubmissionDraft, 'type' | 'requestId'>
  & RuntimeConversationParams
  & { requestId: string };

export interface RuntimeHistoryParams extends RuntimeConversationParams {
  limit?: number;
  cursor?: PiDurableTypes.Cursor;
  afterEntryId?: number;
  throughEntryId?: number;
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
