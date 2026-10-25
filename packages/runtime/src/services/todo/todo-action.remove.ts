import { todoDocument } from './todo.constants';
import { todoGet } from './todo.utils';
import type { TodoContextParams, TodoServiceDeps, TodoTargetParams } from '../../types/todo.types';

export async function todoActionRemove({ harness }: TodoServiceDeps, { context, ...params }: TodoTargetParams & TodoContextParams) {
  await harness.commit(async (tx) => {
    const doc = await tx.doc(todoDocument, params.conversationId);
    todoGet(doc, params.todoId);
    doc.todos = doc.todos.filter((todo) => todo.id !== params.todoId);
  }, context);
}
