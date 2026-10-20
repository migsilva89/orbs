import { todoDocument } from './todo.constants';
import { todoCopy } from './todo.utils';
import type { TodoConversationParams, TodoServiceDeps } from '../../types/todo.types';
import type { Context } from '@earendil-works/chord/context';

export async function todoQueryList({ harness }: TodoServiceDeps, params: TodoConversationParams, context: Context) {
  const doc = await harness.snapshot(todoDocument, params.conversationId, context);
  return (doc?.todos ?? []).map(todoCopy);
}
