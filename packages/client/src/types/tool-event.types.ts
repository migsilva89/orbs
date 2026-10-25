import type { ToolCallRoutine, ToolCallTodo } from '@repo/contracts/universal';
import type { DynamicToolUIPart } from 'ai';

export type ToolEventRoutineAction = 'create' | 'update' | 'run' | 'remove';

export type ToolEventTodoAction = 'create' | 'update' | 'complete' | 'remove';

export type ToolEventBotAction = 'create' | 'update' | 'models';

/** Which event a tool call becomes, before its output is read. */
export type ToolEventSource =
  | { kind: 'peers' }
  | { kind: 'routine'; action: ToolEventRoutineAction }
  | { kind: 'todo'; action: Exclude<ToolEventTodoAction, 'complete'> }
  | { kind: 'bot'; action: ToolEventBotAction };

/** Messages to other bots; back-to-back ones share one event. */
export interface ToolEventPeers {
  kind: 'peers';
  key: string;
  parts: DynamicToolUIPart[];
}

export interface ToolEventRoutine {
  kind: 'routine';
  key: string;
  action: ToolEventRoutineAction;
  routine: ToolCallRoutine;
}

export interface ToolEventTodo {
  kind: 'todo';
  key: string;
  action: ToolEventTodoAction;
  todo: ToolCallTodo;
}

/** A bot created or changed; `name` is unknown when the output does not carry it. */
export interface ToolEventBot {
  kind: 'bot';
  key: string;
  action: ToolEventBotAction;
  botId: string;
  name: string | undefined;
}

/** Something a bot did with its own tools, shown as one line in the chat whether or not verbose details are hidden. */
export type ToolEvent = ToolEventPeers | ToolEventRoutine | ToolEventTodo | ToolEventBot;
