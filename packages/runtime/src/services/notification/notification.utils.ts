import { AssistantEntry, GenerationTask } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import { questionDocument } from '../question/question.constants';
import { runtimeBot, runtimeToolApproval } from '../runtime/runtime.constants';
import { NOTIFICATION_RECENT_LIMIT } from './notification.constants';
import type { ConversationIndexDocument } from '../../types/conversation-index.types';
import type { NotificationItem } from '../../types/notification.types';
import type { Context } from '@earendil-works/chord/context';
import type * as PiDurableTypes from '@earendil-works/pi-durable';

export function notificationItemKey(item: NotificationItem) {
  return `${item.kind}:${item.botId}:${item.conversationId}:${item.taskId ?? 0}:${item.entryId ?? 0}`;
}

export function notificationRecentAppend(recent: NotificationItem[], item: NotificationItem) {
  const key = notificationItemKey(item);

  return match(recent.some((current) => notificationItemKey(current) === key))
    .with(true, () => recent)
    .with(false, () => [...recent, item].slice(-NOTIFICATION_RECENT_LIMIT))
    .exhaustive();
}

export function notificationIsMuted(index: ConversationIndexDocument | null | undefined, botId: string) {
  return match(Object.values(index?.conversations ?? {}).find((conversation) => conversation?.botId === botId))
    .with({ isMuted: true }, () => true)
    .with({ isMuted: false }, () => false)
    .otherwise(() => true);
}

export function notificationMuteKey(index: ConversationIndexDocument | null | undefined) {
  return Object.values(index?.conversations ?? {})
    .flatMap((conversation) => match(conversation)
      .with(P.nonNullable, (item) => [`${item.botId}:${item.isMuted}`])
      .otherwise(() => []))
    .sort()
    .join(' ');
}

export function notificationToolTaskIds(graph: PiDurableTypes.TaskGraph) {
  return Object.values(graph.tasks)
    .filter((task) => task.kind === 'pi.tool' && !task.abortRequested)
    .map((task) => task.id)
    .sort((left, right) => left - right)
    .join(' ');
}

export function notificationIsFinalReply(entry: PiDurableTypes.EntryRecord) {
  return match(entry)
    .with({ kind: AssistantEntry.kind, model: [{ role: 'assistant', stopReason: P.union('stop', 'length') }] }, ({ model }) => {
      const content = model[0].content;

      const hasText = content.some((part) => match(part)
        .with({ type: 'text' }, ({ text }) => text.trim().length > 0)
        .otherwise(() => false));

      const hasTool = content.some((part) => match(part)
        .with({ type: 'toolCall' }, () => true)
        .otherwise(() => false));

      return hasText && !hasTool;
    })
    .otherwise(() => false);
}

export function notificationCommitAttention(changes: readonly PiDurableTypes.CommitChange[]) {
  return {
    replies: changes.flatMap((change) => match(change)
      .with({ type: 'entry', value: P.select() }, (entry) => match(notificationIsFinalReply(entry))
        .with(true, () => [entry])
        .with(false, () => [])
        .exhaustive())
      .otherwise(() => [])),
    failures: changes.flatMap((change) => match(change)
      .with({
        type: 'task',
        value: {
          kind: GenerationTask.definition.name,
          state: { status: 'terminal', outcome: { status: P.union('failed', 'faulted') } },
        },
      }, ({ value }) => [value])
      .otherwise(() => [])),
    shouldRebuild: changes.some((change) => match(change)
      .with({
        type: 'document',
        record: { kind: P.union(runtimeToolApproval.definition.kind, questionDocument.definition.kind) },
      }, () => true)
      .otherwise(() => false)),
  };
}

export function notificationCommitIsRelevant(changes: readonly PiDurableTypes.CommitChange[]) {
  const attention = notificationCommitAttention(changes);

  return attention.replies.length > 0 || attention.failures.length > 0 || attention.shouldRebuild;
}

export async function notificationBotId(
  harness: PiDurableTypes.Harness,
  index: ConversationIndexDocument | null | undefined,
  conversationId: PiDurableTypes.ConversationId,
  cache: Map<number, string>,
  context: Context,
) {
  return match(cache.get(conversationId) ?? index?.conversations[conversationId]?.botId)
    .with(P.string, (botId) => {
      cache.set(conversationId, botId);
      return botId;
    })
    .otherwise(async () => {
      const identity = await harness.snapshot(runtimeBot, conversationId, context);

      return match(identity?.botId)
        .with(P.string, (botId) => {
          cache.set(conversationId, botId);
          return botId;
        })
        .otherwise(() => null);
    });
}

export async function notificationPendingItems(
  harness: PiDurableTypes.Harness,
  graph: PiDurableTypes.TaskGraph,
  index: ConversationIndexDocument | null | undefined,
  cache: Map<number, string>,
  context: Context,
) {
  const now = Date.now();
  const tasks = Object.values(graph.tasks).filter((task) => task.kind === 'pi.tool' && !task.abortRequested);

  const documents = await Promise.all(tasks.map(async (task) => ({
    task,
    botId: await notificationBotId(harness, index, task.conversationId, cache, context),
    approval: await harness.snapshot(runtimeToolApproval, task.id, context),
    question: await harness.snapshot(questionDocument, task.id, context),
  })));

  const pending = documents.flatMap(({ task, botId, approval, question }) => match(botId)
    .with(P.nullish, () => [])
    .with(P.when((id) => notificationIsMuted(index, id)), () => [])
    .otherwise((id) => [
      ...match(approval?.approval)
        .with({
          status: 'pending',
          botId: id,
          expiresAt: P.number.gt(now),
        }, (value) => [{
          kind: 'approval' as const,
          botId: id,
          conversationId: task.conversationId,
          taskId: task.id,
          expiresAt: value.expiresAt,
        }])
        .otherwise(() => []),
      ...match(question?.question)
        .with({ status: 'pending', expiresAt: P.number.gt(now) }, (value) => [{
          kind: 'question' as const,
          botId: id,
          conversationId: task.conversationId,
          taskId: value.id,
          expiresAt: value.expiresAt,
        }])
        .otherwise(() => []),
    ]));

  return pending.sort((left, right) => match(left.kind.localeCompare(right.kind))
    .with(0, () => match(left.conversationId - right.conversationId)
      .with(0, () => left.taskId - right.taskId)
      .otherwise((value) => value))
    .otherwise((value) => value));
}
