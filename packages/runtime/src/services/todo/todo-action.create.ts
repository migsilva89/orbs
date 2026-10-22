import { match, P } from 'ts-pattern';
import { todoDocument } from './todo.constants';
import { todoCopy } from './todo.utils';
import type { TodoCreateParams, TodoServiceDeps } from '../../types/todo.types';
import type { Context } from '@earendil-works/chord/context';
import type { Todo } from '@repo/contracts/universal';

export async function todoActionCreate({ harness }: TodoServiceDeps, params: TodoCreateParams, context: Context) {
  return harness.commit(async (tx) => {
    const doc = await tx.doc(todoDocument, params.conversationId);
    const id = params.id ?? doc.nextId;

    return match(doc.todos.find((todo) => todo.id === id))
      .with(P.nonNullable, (existing) => todoCopy(existing))
      .otherwise(() => {
        const now = Date.now();
        const isDone = params.isDone ?? false;

        const record: Todo = {
          id,
          title: params.title,
          isDone,
          createdAt: now,
          updatedAt: now,
          doneAt: match(isDone).with(true, () => now).with(false, () => null).exhaustive(),
        };

        doc.todos.push(record);
        doc.nextId = Math.max(doc.nextId, id + 1);

        return todoCopy(record);
      });
  }, context);
}
