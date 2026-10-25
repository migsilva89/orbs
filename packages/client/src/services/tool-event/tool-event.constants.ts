import type { ToolEventSource } from '../../types/tool-event.types';

/** Every tool call shown as a chat event instead of a tool row, by tool name. */
export const TOOL_EVENTS = new Map<string, ToolEventSource>([
  ['bot_message', { kind: 'peers' }],
  ['bot_ask', { kind: 'peers' }],
  ['bot_routine_create', { kind: 'routine', action: 'create' }],
  ['bot_routine_update', { kind: 'routine', action: 'update' }],
  ['bot_routine_run', { kind: 'routine', action: 'run' }],
  ['bot_routine_remove', { kind: 'routine', action: 'remove' }],
  ['bot_todo_create', { kind: 'todo', action: 'create' }],
  ['bot_todo_update', { kind: 'todo', action: 'update' }],
  ['bot_todo_remove', { kind: 'todo', action: 'remove' }],
  ['bot_create', { kind: 'bot', action: 'create' }],
  ['bot_update', { kind: 'bot', action: 'update' }],
  ['bot_swap_models', { kind: 'bot', action: 'models' }],
]);
