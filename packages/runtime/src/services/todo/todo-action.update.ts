import { match } from 'ts-pattern';
import { todoDocument } from './todo.constants';
import { todoCopy, todoGet } from './todo.utils';
import type { TodoContextParams, TodoServiceDeps, TodoUpdateParams } from '../../types/todo.types';

export async function todoActionUpdate({ harness }: TodoServiceDeps, { context, ...params }: TodoUpdateParams & TodoContextParams) {
  return harness.commit(async (tx) => {
    const doc = await tx.doc(todoDocument, params.conversationId);
    const record = todoGet(doc, params.todoId);
    const isDone = params.isDone ?? record.isDone;
    const now = Date.now();
    record.title = params.title ?? record.title;
    record.doneAt = match({ isDone, wasDone: record.isDone })
      .with({ isDone: false }, () => null)
      .with({ wasDone: false }, () => now)
      .otherwise(() => record.doneAt);
    record.isDone = isDone;
    record.updatedAt = now;

    return todoCopy(record);
  }, context);
}
