import { todoDocument } from './todo.constants';
import { todoGet } from './todo.utils';
import type { TodoServiceDeps, TodoTargetParams } from '../../types/todo.types';
import type { Context } from '@earendil-works/chord/context';

export async function todoActionRemove({ harness }: TodoServiceDeps, params: TodoTargetParams, context: Context) {
  await harness.commit(async (tx) => {
    const doc = await tx.doc(todoDocument, params.conversationId);
    todoGet(doc, params.todoId);
    doc.todos = doc.todos.filter((todo) => todo.id !== params.todoId);
  }, context);
}
