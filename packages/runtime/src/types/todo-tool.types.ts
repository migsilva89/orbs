import { Type } from '@earendil-works/pi-ai';
import { todoCreate, todoTarget, todoUpdate } from '@repo/contracts/universal';
import { z } from 'zod';
import type { RuntimeServiceDeps } from './runtime.types';

export type TodoToolDeps = Pick<RuntimeServiceDeps, 'harness' | 'todos'>;

export const todoToolCreate = todoCreate.omit({ botId: true }).strict();
export const todoToolUpdate = todoUpdate.omit({ botId: true }).strict();
export const todoToolTarget = todoTarget.omit({ botId: true }).strict();

export const todoToolCreateParameters = Type.Unsafe<z.infer<typeof todoToolCreate>>(z.toJSONSchema(todoToolCreate));
export const todoToolUpdateParameters = Type.Unsafe<z.infer<typeof todoToolUpdate>>(z.toJSONSchema(todoToolUpdate));
export const todoToolTargetParameters = Type.Unsafe<z.infer<typeof todoToolTarget>>(z.toJSONSchema(todoToolTarget));
