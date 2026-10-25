import { z } from 'zod';
import type { Context } from '@earendil-works/chord/context';
import type { SqliteTelemetry } from '@earendil-works/chord/telemetry-sqlite';
import type * as PiTypes from '@earendil-works/pi-durable';
import type * as ContractTypes from '@repo/contracts/universal';

export const activityStoredTrace = z.object({
  traceId: z.string(),
  spans: z.array(z.object({
    id: z.string(),
    parentId: z.string().optional(),
    name: z.string(),
    startedMs: z.number(),
    endedMs: z.number(),
    attributes: z.object({
      'conversation.id': z.number().optional(),
      'task.name': z.string().optional(),
      'tool.name': z.string().optional(),
      'tool.call_id': z.string().optional(),
      outcome: z.string().optional(),
      attempt: z.number().optional(),
      model: z.string().optional(),
      stop: z.string().optional(),
      'usage.input': z.number().optional(),
      'usage.output': z.number().optional(),
      'usage.cache_read': z.number().optional(),
      'usage.cache_write': z.number().optional(),
      'cost.total': z.number().optional(),
    }),
    events: z.array(z.object({
      name: z.string(),
      timeMs: z.number(),
      attributes: z.object({
        'entry.id': z.number().optional(),
        'entry.kind': z.string().optional(),
        tool: z.string().optional(),
      }),
    })),
    links: z.array(z.object({ traceId: z.string(), spanId: z.string() })),
    status: z.object({
      status: z.enum(['ok', 'error']),
      error: z.object({ name: z.string(), message: z.string() }).optional(),
    }),
  })),
});

export interface ActivityServiceDeps {
  harness: PiTypes.Harness;
  telemetry: SqliteTelemetry;
}

export interface ActivityContextParams {
  context: Context;
}

export interface ActivityConversationParams {
  conversationId: PiTypes.ConversationId;
}

export type ActivityListParams = Omit<ContractTypes.ActivityListInput, 'botId'> & ActivityConversationParams;
export type ActivityRunParams = Omit<ContractTypes.ActivityRunGetInput, 'botId'> & ActivityConversationParams;
export type ActivityTraceQuery = Omit<NonNullable<Parameters<SqliteTelemetry['findTraces']>[0]>, 'limit' | 'cursor'>;
export type ActivityTrace = z.infer<typeof activityStoredTrace>;
export type ActivitySpanRecord = ActivityTrace['spans'][number];

export interface ActivityFetchParams {
  telemetry: SqliteTelemetry;
  query: ActivityTraceQuery;
  isEnough: (traces: ActivityTrace[]) => boolean;
}

export interface ActivityFetchResult {
  traces: ActivityTrace[];
  hasMore: boolean;
}

export interface ActivityTraceInfo {
  trace: ActivityTrace;
  root: ActivitySpanRecord;
  conversationId: number | null;
  entryId: number | null;
  entryKind: string | null;
  linkedTask: string | null;
}

export interface ActivityDispatch {
  parent: ActivityTraceInfo;
  child: ActivityTraceInfo;
}

export interface ActivityGroup {
  root: ActivityTraceInfo;
  traces: ActivityTraceInfo[];
  dispatches: ActivityDispatch[];
}

export interface ActivityLiveTask {
  id: number;
  kind: string;
  conversationId: number;
  status: string;
  tool: string | null;
  wait: 'approval' | 'question' | 'subagent' | null;
}

export interface ActivityBuildParams {
  group: ActivityGroup;
  title: string | null;
  names: ReadonlyMap<number, string>;
  liveTasks: readonly ActivityLiveTask[];
  inputs: ReadonlyMap<string, Record<string, string>>;
  isLive: boolean;
}
