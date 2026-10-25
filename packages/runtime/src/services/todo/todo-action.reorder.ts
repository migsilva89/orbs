import { todoDocument } from './todo.constants';
import { todoCopy } from './todo.utils';
import type { TodoContextParams, TodoReorderParams, TodoServiceDeps } from '../../types/todo.types';

export async function todoActionReorder({ harness }: TodoServiceDeps, { context, ...params }: TodoReorderParams & TodoContextParams) {
  return harness.commit(async (tx) => {
    const doc = await tx.doc(todoDocument, params.conversationId);
    const rank = new Map(params.todoIds.map((id, index) => [id, index]));
    doc.todos = [...doc.todos].sort((a, b) => (rank.get(a.id) ?? rank.size) - (rank.get(b.id) ?? rank.size));

    return doc.todos.map(todoCopy);
  }, context);
}
