import { toolCallBot, toolCallJson, toolCallRoutine, toolCallTodo } from '@repo/contracts/universal';
import { match } from 'ts-pattern';
import { toolInputText } from '../tool/tool.utils';
import { TOOL_EVENT_ICONS, TOOL_EVENTS } from './tool-event.constants';
import type { ToolEvent } from '../../types/tool-event.types';
import type { DynamicToolUIPart } from 'ai';

export function toolEvent(part: DynamicToolUIPart): ToolEvent | undefined {
  const key = part.toolCallId;
  const output = part.state === 'output-available' ? part.output : undefined;

  return match(TOOL_EVENTS.get(part.toolName))
    .returnType<ToolEvent | undefined>()
    .with({ kind: 'peers' }, () => ({ kind: 'peers', key, parts: [part] }))
    .with({ kind: 'routine' }, ({ action }) => {
      const routine = toolCallRoutine.safeParse(output).data;
      return routine && { kind: 'routine', key, action, icon: TOOL_EVENT_ICONS.routine[action], routine };
    })
    .with({ kind: 'todo' }, ({ action }) => {
      const todo = toolCallTodo.safeParse(output).data;
      const todoAction = action === 'update' && toolCallJson.safeParse(part.input).data?.isDone === true ? 'complete' : action;
      return todo && { kind: 'todo', key, action: todoAction, icon: TOOL_EVENT_ICONS.todo[todoAction], todo };
    })
    .with({ kind: 'bot', action: 'models' }, ({ action }) => {
      const botId = toolInputText({ input: part.input, key: 'botId' });
      return output === undefined || botId === undefined ? undefined : { kind: 'bot', key, action, botId, name: undefined };
    })
    .with({ kind: 'bot' }, ({ action }) => {
      const bot = toolCallBot.safeParse(output).data;
      return bot && { kind: 'bot', key, action, botId: bot.id, name: bot.name };
    })
    .otherwise(() => undefined);
}

export function toolEventsAppend(events: ToolEvent[], event: ToolEvent): ToolEvent[] {
  const last = events.at(-1);

  return last?.kind === 'peers' && event.kind === 'peers'
    ? [...events.slice(0, -1), { ...last, parts: [...last.parts, ...event.parts] }]
    : [...events, event];
}
