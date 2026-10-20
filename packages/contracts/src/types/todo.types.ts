import { z } from 'zod';
import { botGet } from './bot.types';

const todoFields = z.object({
  title: z.string().trim().min(1).max(200),
  isDone: z.boolean(),
});

export const todoTarget = botGet.extend({ todoId: z.number().int().positive() });
export const todoCreate = botGet.extend(todoFields.pick({ title: true }).shape);
export const todoUpdate = todoTarget.extend(todoFields.partial().shape);
export const todoReorder = botGet.extend({ todoIds: z.array(z.number().int().positive()).min(1).max(500) });

export const todo = todoFields.extend({
  id: z.number().int().positive(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  doneAt: z.number().int().nullable(),
});

export const todoList = z.array(todo);
export const todoRemoveResult = z.void();

export type Todo = z.infer<typeof todo>;
export type TodoTarget = z.infer<typeof todoTarget>;
export type TodoCreateInput = z.infer<typeof todoCreate>;
export type TodoUpdateInput = z.infer<typeof todoUpdate>;
export type TodoReorderInput = z.infer<typeof todoReorder>;
