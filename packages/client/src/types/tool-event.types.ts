import type { ToolCallRoutine, ToolCallTodo } from '@repo/contracts/universal';
import type { DynamicToolUIPart } from 'ai';

export type ToolEventRoutineAction = 'create' | 'update' | 'run' | 'remove';

export type ToolEventTodoAction = 'create' | 'update' | 'complete' | 'remove';

export type ToolEventBotAction = 'create' | 'update' | 'models';

export type ToolEventIcon =
  | 'alarm-clock-plus'
  | 'alarm-clock'
  | 'alarm-clock-check'
  | 'alarm-clock-off'
  | 'list-plus'
  | 'list-todo'
  | 'circle-check'
  | 'list-x';

export type ToolEventSource =
  | { kind: 'peers' }
  | { kind: 'routine'; action: ToolEventRoutineAction }
  | { kind: 'todo'; action: Exclude<ToolEventTodoAction, 'complete'> }
  | { kind: 'bot'; action: ToolEventBotAction };

export interface ToolEventPeers {
  kind: 'peers';
  key: string;
  parts: DynamicToolUIPart[];
}

export interface ToolEventRoutine {
  kind: 'routine';
  key: string;
  action: ToolEventRoutineAction;
  icon: ToolEventIcon;
  routine: ToolCallRoutine;
}

export interface ToolEventTodo {
  kind: 'todo';
  key: string;
  action: ToolEventTodoAction;
  icon: ToolEventIcon;
  todo: ToolCallTodo;
}

export interface ToolEventBot {
  kind: 'bot';
  key: string;
  action: ToolEventBotAction;
  botId: string;
  name: string | undefined;
}

export type ToolEvent = ToolEventPeers | ToolEventRoutine | ToolEventTodo | ToolEventBot;
