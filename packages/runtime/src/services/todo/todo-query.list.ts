import { todoDocument } from './todo.constants';
import { todoCopy } from './todo.utils';
import type { TodoContextParams, TodoConversationParams, TodoServiceDeps } from '../../types/todo.types';

export async function todoQueryList({ harness }: TodoServiceDeps, { context, ...params }: TodoConversationParams & TodoContextParams) {
  const doc = await harness.snapshot(todoDocument, params.conversationId, context);
  return (doc?.todos ?? []).map(todoCopy);
}
