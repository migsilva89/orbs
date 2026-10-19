import { z } from 'zod';
import { botGet } from './bot.types';

export const routineSchedule = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('once'), runAt: z.number().int().positive().max(8_640_000_000_000_000) }),
  z.object({ kind: z.literal('interval'), minutes: z.number().int().min(1).max(525_600) }),
  z.object({
    kind: z.literal('cron'),
    expression: z.string().trim().min(1).max(120),
    timezone: z.string().trim().min(1).max(100),
  }),
]);

const routineFields = z.object({
  name: z.string().trim().min(1).max(80),
  prompt: z.string().trim().min(1).max(8_000),
  schedule: routineSchedule,
  isEnabled: z.boolean(),
});

export const routineTarget = botGet.extend({ routineId: z.uuid() });
export const routineCreate = botGet.extend(routineFields.shape);
export const routineUpdate = routineTarget.extend(routineFields.partial().shape);

export const routineRun = z.object({
  occurrence: z.number().int().positive(),
  scheduledAt: z.number().int(),
  startedAt: z.number().int(),
  finishedAt: z.number().int().nullable(),
  submissionId: z.number().int().positive().nullable(),
  status: z.enum(['running', 'done', 'unanswered']),
  reason: z.string().nullable(),
});

export const routine = routineFields.extend({
  id: z.uuid(),
  botId: z.uuid(),
  conversationId: z.number().int().positive(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  nextRunAt: z.number().int().nullable(),
  runRequestedAt: z.number().int().nullable(),
  lastRun: routineRun.nullable(),
});

export const routineList = z.array(routine);
export const routineRemoveResult = z.void();

export const routineEditForm = routineFields.omit({ isEnabled: true });

export type RoutineSchedule = z.infer<typeof routineSchedule>;
export type Routine = z.infer<typeof routine>;
export type RoutineRun = z.infer<typeof routineRun>;
export type RoutineTarget = z.infer<typeof routineTarget>;
export type RoutineCreateInput = z.infer<typeof routineCreate>;
export type RoutineUpdateInput = z.infer<typeof routineUpdate>;
export type RoutineEditForm = z.infer<typeof routineEditForm>;
