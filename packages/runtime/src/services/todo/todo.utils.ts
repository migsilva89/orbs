import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import type { TodoDocument } from '../../types/todo.types';
import type { Todo } from '@repo/contracts/universal';

export function todoGet(doc: TodoDocument, todoId: number): Todo {
  return match(doc.todos.find((todo) => todo.id === todoId))
    .with(P.nonNullable, (todo) => todo)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'todo', resourceId: todoId });
    });
}

export function todoCopy(record: Todo): Todo {
  return { ...record };
}
