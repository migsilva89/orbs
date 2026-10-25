import { z } from 'zod';
import { botGet } from './bot.types';

export const activityTrigger = z.enum(['message', 'routine', 'reaction', 'subagent', 'peer', 'other']);

export const activityListInput = botGet.extend({
  before: z.number().int().positive().optional(),
});

export const activityRunGet = botGet.extend({
  runId: z.string().min(1).max(200),
});

export const activityRunSummary = z.object({
  id: z.string(),
  trigger: activityTrigger,
  title: z.string().nullable(),
  startedAt: z.number().int(),
  durationMs: z.number().nonnegative(),
  agentCount: z.number().int().nonnegative(),
  toolCallCount: z.number().int().nonnegative(),
  tokens: z.number().nonnegative(),
  cost: z.number().nonnegative(),
  isFailed: z.boolean(),
  isLive: z.boolean(),
});

export const activityPage = z.object({
  runs: z.array(activityRunSummary),
  nextBefore: z.number().int().positive().nullable(),
});

export const activityAgent = z.object({
  id: z.string(),
  conversationId: z.number().int().positive(),
  name: z.string().nullable(),
  model: z.string().nullable(),
  isMain: z.boolean(),
});

export const activitySpan = z.object({
  id: z.string(),
  agentId: z.string(),
  kind: z.enum(['thinking', 'tool', 'waiting']),
  start: z.number().nonnegative(),
  end: z.number().nonnegative().nullable(),
  tool: z.string().nullable(),
  calls: z.array(z.string()),
  stop: z.string().nullable(),
  tokens: z.number().nonnegative().nullable(),
  cost: z.number().nonnegative().nullable(),
  isFailed: z.boolean(),
  isRetry: z.boolean(),
  detail: z.string().nullable(),
  input: z.record(z.string(), z.string()).nullable(),
});

export const activityHandoff = z.object({
  from: z.string(),
  to: z.string(),
  at: z.number().nonnegative(),
  kind: z.enum(['dispatch', 'result']),
});

export const activityRun = activityRunSummary.extend({
  agents: z.array(activityAgent),
  spans: z.array(activitySpan),
  handoffs: z.array(activityHandoff),
});

export type ActivityTrigger = z.infer<typeof activityTrigger>;
export type ActivityListInput = z.infer<typeof activityListInput>;
export type ActivityRunGetInput = z.infer<typeof activityRunGet>;
export type ActivityRunSummary = z.infer<typeof activityRunSummary>;
export type ActivityPage = z.infer<typeof activityPage>;
export type ActivityAgent = z.infer<typeof activityAgent>;
export type ActivitySpan = z.infer<typeof activitySpan>;
export type ActivityHandoff = z.infer<typeof activityHandoff>;
export type ActivityRun = z.infer<typeof activityRun>;
