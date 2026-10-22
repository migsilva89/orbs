import { artifactSpec, routineCreate, todo } from '@openbots/contracts/universal';
import { z } from 'zod';
import type { ArtifactService } from '../services/artifact/artifact.service';
import type { ConversationIndexService } from '../services/conversation-index/conversation-index.service';
import type { NotificationService } from '../services/notification/notification.service';
import type { QuestionService } from '../services/question/question.service';
import type { RoutineService } from '../services/routine/routine.service';
import type { TodoService } from '../services/todo/todo.service';
import type { AlarmService } from './alarm.types';
import type { CollaborationDirectory, CollaborationPolicy } from './collaboration.types';
import type { StorageService } from './storage.types';
import type { Context } from '@earendil-works/chord/context';
import type { ToolCall } from '@earendil-works/pi-ai';
import type { Models } from '@earendil-works/pi-ai/models';
import type * as PiDurableTypes from '@earendil-works/pi-durable';
import type { ImageProcessor } from '@earendil-works/pi-durable/tools';
import type * as UniversalTypes from '@openbots/contracts/universal';

export interface RuntimeServiceParams {
  storage: StorageService;
  alarm: AlarmService;
  models: Models;
  env: NonNullable<PiDurableTypes.HarnessOptions['env']>;
  permissions: RuntimeToolPolicy;
  collaboration: CollaborationPolicy;
  /** Shrinks and converts the images `read` returns, so large photos reach the model. */
  images?: ImageProcessor;
  /** Gives bash commands stored secrets as placeholders, and keeps real values out of tool results. */
  secrets?: RuntimeSecrets;
  toolExtensions?: PiDurableTypes.Extension[];
}

export interface RuntimeSecrets {
  actions: {
    prepare: (execution: RuntimeSecretExecution) => Promise<void>;
  };
  queries: {
    rules: () => Promise<UniversalTypes.SecretRule[]>;
    redact: (params: RuntimeSecretRedactParams) => Promise<string>;
  };
}

/** The part of Pi's bash execution a secret broker may change. */
export interface RuntimeSecretExecution {
  command: string;
  env: Record<string, string>;
}

export interface RuntimeSecretRedactParams {
  text: string;
}

export interface RuntimeCodingToolsParams {
  images?: ImageProcessor;
  secrets?: RuntimeSecrets;
}

export interface RuntimeSecretsParams {
  secrets: RuntimeSecrets;
}

export interface RuntimeToolPolicy {
  authorize(call: RuntimeToolCall, context: Context): Promise<RuntimeToolDecision>;
  /** How long an approval waits for an answer before it counts as denied. */
  approvalTimeoutMs(): Promise<number>;
}

export interface RuntimeToolsDeps extends Pick<RuntimeServiceDeps, 'harness' | 'readOnlyTools' | 'ownTools'> {
  permissions: RuntimeToolPolicy;
}

export interface RuntimeToolCall {
  botId: string;
  taskId: number;
  name: string;
  arguments: ToolCall['arguments'];
  isReadOnly: boolean;
  isOwn: boolean;
  getRequest: () => Promise<string>;
  approved?: boolean;
}

export interface RuntimeModelsDeps {
  models: Models;
}

/** Built once per daemon and shared by every bot store, including the model-request limiter. */
export interface RuntimeSharedDeps extends RuntimeModelsDeps {
  storage: StorageService;
  alarm: AlarmService;
  env: RuntimeServiceParams['env'];
  permissions: RuntimeToolPolicy;
  extensions: PiDurableTypes.Extension[];
  readOnlyTools: PiDurableTypes.ToolRegistration[];
  /** Openbots' own bot tools (messaging, todos, routines, artifacts…); they run without asking the owner. */
  ownTools: PiDurableTypes.ToolRegistration[];
  directory: CollaborationDirectory;
}

/** One bot's Pi store. */
export interface RuntimeServiceDeps extends RuntimeModelsDeps {
  botId: string;
  directory: CollaborationDirectory;
  harness: PiDurableTypes.Harness;
  questions: QuestionService;
  routines: RoutineService;
  todos: TodoService;
  artifacts: ArtifactService;
  index: ConversationIndexService;
  registry: PiDurableTypes.Registry;
  readOnlyTools: PiDurableTypes.ToolRegistration[];
  ownTools: PiDurableTypes.ToolRegistration[];
  extensions: PiDurableTypes.Extension[];
}

export interface RuntimeCarryOverDeps extends RuntimeServiceDeps {
  storage: StorageService;
}

export interface RuntimeCarryOverParams {
  conversationId: PiDurableTypes.ConversationId;
}

export interface RuntimeBot {
  deps: RuntimeServiceDeps;
  notifications: NotificationService;
  /** Resume pending Pi work after a host alarm and re-arm the next one. */
  wake(): void;
  close(): Promise<void>;
}

export type RuntimeBotChange = { type: 'opened'; bot: RuntimeBot } | { type: 'closed'; botId: string; isFailed: boolean };

export interface RuntimeDirectory extends CollaborationDirectory {
  bot(botId: string): Promise<RuntimeBot>;
  opened(): RuntimeBot[];
  onChange(listener: (change: RuntimeBotChange) => void): () => void;
}

export interface RuntimeBotParams extends UniversalTypes.ModelSelection {
  id: string;
  fallbackModel?: UniversalTypes.ModelSelection | null;
  instructions: string;
  skillsPrompt: string;
  instructionFiles: { path: string; content: string }[];
  plugins: PiDurableTypes.Extension[];
  tools: PiDurableTypes.ToolRegistration[];
  permission: 'read-only' | 'ask' | 'auto' | 'full';
}

export type RuntimeModelParams = Pick<RuntimeBotParams, 'modelProvider' | 'modelId' | 'thinkingLevel' | 'fallbackModel'>;

export interface RuntimeBotBinding extends PiDurableTypes.JsonObject {
  conversationId: PiDurableTypes.ConversationId | null;
}

export interface RuntimeConversationParams {
  botId: string;
  conversationId?: number;
}

export interface RuntimeContextParams {
  record: PiDurableTypes.ConversationRecord;
  sourceConversationId: PiDurableTypes.ConversationId;
  isRunning: boolean;
}

export interface RuntimeEntryParams {
  botId: string;
  entryId: number;
}

export interface RuntimeSubmissionParams extends RuntimeConversationParams {
  requestId: string;
}

export interface RuntimeUpdateSubmissionParams extends RuntimeConversationParams {
  submissionId: number;
  replyToEntryId?: number | null;
  content?: string;
  whenBusy?: 'followUp' | 'steer' | 'interrupt';
  attachments?: UniversalTypes.Attachment[];
}

type RuntimeSubmitBase = Omit<PiDurableTypes.InputSubmissionDraft, 'type' | 'requestId' | 'whenBusy' | 'entry'>
  & RuntimeConversationParams
  & { requestId: string; attachments?: UniversalTypes.Attachment[]; replyToEntryId?: number };

export type RuntimeSubmitParams =
  | (RuntimeSubmitBase & { whenBusy: 'interrupt'; entry?: never })
  | (RuntimeSubmitBase & {
    whenBusy?: 'followUp' | 'steer' | 'reject';
    entry?: PiDurableTypes.InputEntry;
  });

export type RuntimeInterruptDraft = Pick<Extract<RuntimeSubmitParams, { whenBusy: 'interrupt' }>, 'requestId' | 'content'> & { entry?: PiDurableTypes.InputEntry };

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
  timeoutMs: number;
  context: Context;
}

export interface RuntimeQuestionAnswer extends RuntimeConversationParams {
  id: number;
  answer: UniversalTypes.QuestionAnswer;
  answeredBy: string;
}

/** What a history clear keeps: routines, todos and the latest version of each artifact, with their IDs. */
export const runtimeCarry = z.object({
  routines: z.array(routineCreate.omit({ botId: true }).extend({ id: z.uuid() })),
  artifacts: z.array(z.object({
    id: z.uuid(),
    title: z.string(),
    spec: artifactSpec,
  })),
  todos: z.array(todo.pick({
    id: true,
    title: true,
    isDone: true,
  })),
});

export type RuntimeCarry = z.infer<typeof runtimeCarry>;
