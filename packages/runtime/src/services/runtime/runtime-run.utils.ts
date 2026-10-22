import type { JsonValue } from '@earendil-works/chord';
import type { TaskRecord } from '@earendil-works/pi-durable';
import type { ConversationRun } from '@repo/contracts/universal';

export function runtimeRun(task: TaskRecord<JsonValue, JsonValue, JsonValue>): ConversationRun {
  return { taskId: task.id, status: task.state.status, outcome: task.state.outcome ?? null };
}
