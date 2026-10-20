import { todoDocument } from './todo.constants';
import { todoCopy } from './todo.utils';
import type { TodoReorderParams, TodoServiceDeps } from '../../types/todo.types';
import type { Context } from '@earendil-works/chord/context';

/** Put the given todos first, in that order. Unlisted todos, such as one the bot added meanwhile, keep their order after them. */
export async function todoActionReorder({ harness }: TodoServiceDeps, params: TodoReorderParams, context: Context) {
  return harness.commit(async (tx) => {
    const doc = await tx.doc(todoDocument, params.conversationId);
    const rank = new Map(params.todoIds.map((id, index) => [id, index]));
    doc.todos = [...doc.todos].sort((a, b) => (rank.get(a.id) ?? rank.size) - (rank.get(b.id) ?? rank.size));

    return doc.todos.map(todoCopy);
  }, context);
}
