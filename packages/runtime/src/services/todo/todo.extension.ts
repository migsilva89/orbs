import { defineExtension, section } from '@earendil-works/pi-durable';
import * as m from '@repo/i18n/messages';
import { match } from 'ts-pattern';
import { TODO_PROMPT_LIMIT, todoDocument } from './todo.constants';

/**
 * Shows the open todos in the system prompt. Pi resends a section only when its text changes, so an unchanged list
 * keeps the prompt cache warm, and an empty list omits the section.
 */
export const todoExtension = defineExtension({
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
