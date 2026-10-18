import { Type } from '@earendil-works/pi-ai';
import { routineCreate, routineTarget, routineUpdate } from '@openbots/contracts/universal';
import { z } from 'zod';
import type { RuntimeServiceDeps } from './runtime.types';

export type RuntimeRoutineToolsDeps = Pick<RuntimeServiceDeps, 'harness' | 'routines'>;

export const routineToolCreate = routineCreate.omit({ botId: true }).strict();
export const routineToolUpdate = routineUpdate.omit({ botId: true }).strict();
export const routineToolTarget = routineTarget.omit({ botId: true }).strict();

export const routineToolCreateParameters = Type.Unsafe<z.infer<typeof routineToolCreate>>(z.toJSONSchema(routineToolCreate));
export const routineToolUpdateParameters = Type.Unsafe<z.infer<typeof routineToolUpdate>>(z.toJSONSchema(routineToolUpdate));
export const routineToolTargetParameters = Type.Unsafe<z.infer<typeof routineToolTarget>>(z.toJSONSchema(routineToolTarget));
