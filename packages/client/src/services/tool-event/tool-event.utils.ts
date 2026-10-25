import { toolCallBot, toolCallJson, toolCallRoutine, toolCallTodo } from '@repo/contracts/universal';
import { match } from 'ts-pattern';
import { toolInputText } from '../tool/tool.utils';
import { TOOL_EVENTS } from './tool-event.constants';
import type { ToolEvent } from '../../types/tool-event.types';
import type { DynamicToolUIPart } from 'ai';

/**
 * The chat event a tool call stands for. Messages to other bots show while they run; the rest show once their output
 * names what changed, so a running or failed call stays a tool row.
 */
export function toolEvent(part: DynamicToolUIPart): ToolEvent | undefined {
  const key = part.toolCallId;
  const output = part.state === 'output-available' ? part.output : undefined;

  return match(TOOL_EVENTS.get(part.toolName))
    .returnType<ToolEvent | undefined>()
    .with({ kind: 'peers' }, () => ({ kind: 'peers', key, parts: [part] }))
    .with({ kind: 'routine' }, ({ action }) => {
      const routine = toolCallRoutine.safeParse(output).data;
      return routine && { kind: 'routine', key, action, routine };
    })
    .with({ kind: 'todo' }, ({ action }) => {
      const todo = toolCallTodo.safeParse(output).data;
      const isCompleted = action === 'update' && toolCallJson.safeParse(part.input).data?.isDone === true;
      return todo && { kind: 'todo', key, action: isCompleted ? 'complete' : action, todo };
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

/** Adds an event to a run of events; back-to-back messages to other bots share one line. */
export function toolEventsAppend(events: ToolEvent[], event: ToolEvent): ToolEvent[] {
  const last = events.at(-1);

  return last?.kind === 'peers' && event.kind === 'peers'
    ? [...events.slice(0, -1), { ...last, parts: [...last.parts, ...event.parts] }]
    : [...events, event];
}
