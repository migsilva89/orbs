import { defineExtension, section } from '@earendil-works/pi-durable';
import * as m from '@repo/i18n/messages';
import { match } from 'ts-pattern';
import { TODO_PROMPT_LIMIT, todoDocument } from './todo.constants';

export function makeTodoExtensionService() {
  const extension = defineExtension({
    name: 'bots.todos',
    sections: [section('todos', async (input, context) => {
      const doc = await input.read.snapshot(todoDocument, input.conversationId, context);
      const open = (doc?.todos ?? []).filter((todo) => !todo.isDone);

      const lines = open.slice(0, TODO_PROMPT_LIMIT).map((todo) => `#${todo.id} ${todo.title}`);
      const hidden = open.length - lines.length;

      return match({ lines, hidden })
        .with({ lines: [] }, () => undefined)
        .with({ hidden: 0 }, () => [m.ui_todo_prompt(), ...lines].join('\n'))
        .otherwise(() => [m.ui_todo_prompt(), ...lines, m.ui_todo_prompt_more({ count: hidden })].join('\n'));
    })],
  });

  return { extension };
}

export type TodoExtensionService = ReturnType<typeof makeTodoExtensionService>;
