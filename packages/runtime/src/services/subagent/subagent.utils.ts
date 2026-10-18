import { AgentDoc, AssistantEntry, configure } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import { COLLABORATION } from '../collaboration/collaboration.constants';
import { runtimeBot } from '../runtime/runtime.constants';
import { SUBAGENT } from './subagent.constants';
import type { SubagentDetails } from '../../types/subagent.types';
import type * as PiDurableTypes from '@earendil-works/pi-durable';

export function subagentReply(text: string, details?: SubagentDetails, isError = false) {
  return {
    output: [{ type: 'text' as const, text }],
    ...match(isError)
      .with(true, () => ({ isError: true as const }))
      .with(false, () => ({}))
      .exhaustive(),
    ...match(details)
      .with(P.nonNullable, (value) => ({ details: value }))
      .otherwise(() => ({})),
  };
}

export function subagentDetails(
  conversationId: PiDurableTypes.ConversationId,
  taskId: PiDurableTypes.TaskId,
  name?: string | null,
): SubagentDetails {
  return { conversationId, taskId, name: name ?? null };
}

export async function subagentAnswer(tx: PiDurableTypes.Tx, answerId: PiDurableTypes.EntryId) {
  const entry = await tx.entry(AssistantEntry, answerId);

  return (entry?.model ?? []).flatMap((message) => match(message)
    .with({ role: 'assistant' }, ({ content }) => content.flatMap((part) => match(part)
      .with({ type: 'text' }, ({ text }) => [text])
      .otherwise(() => [])))
    .otherwise(() => [])).join('\n');
}

export async function subagentPendingReporters(tx: PiDurableTypes.Tx, conversationId: PiDurableTypes.ConversationId, limit: number) {
  const pages = await Promise.all((['pending', 'running', 'waiting', 'completing'] as const).map((status) => (
    tx.scanTasks({
      conversationId,
      kind: SUBAGENT.reporter,
      status,
    }, limit)
  )));

  return pages.flatMap((page) => page.items).length;
}

export async function subagentCreateChild(
  tx: PiDurableTypes.Tx,
  ownerTaskId: PiDurableTypes.TaskId,
  parentConversationId: PiDurableTypes.ConversationId,
) {
  const parent = await tx.doc(runtimeBot, parentConversationId);
  const identity = { botId: parent.botId, skillsPrompt: parent.skillsPrompt };
  const child = await tx.createConversation({ ownership: { kind: 'task', taskId: ownerTaskId } });
  const childBot = await tx.doc(runtimeBot, child.id);
  childBot.botId = identity.botId;
  childBot.skillsPrompt = identity.skillsPrompt;
  await subagentStripExtensions(tx, child.id);

  return child.id;
}

async function subagentStripExtensions(tx: PiDurableTypes.Tx, conversationId: PiDurableTypes.ConversationId) {
  const agent = await tx.doc(AgentDoc, conversationId);
  const blocked = [SUBAGENT.extension, COLLABORATION.extension];

  await configure(tx, conversationId, {
    extensions: match(agent.extensions)
      .with(P.array(), (selected) => selected
        .filter((name) => match(name)
          .with(SUBAGENT.extension, COLLABORATION.extension, () => false)
          .otherwise(() => true))
        .map((name) => ({ name })))
      .with({ add: P.optional(P.array()), remove: P.optional(P.array()) }, (value) => ({
        ...match(value.add)
          .with(P.array(), (add) => ({ add: add.map((name) => ({ name })) }))
          .otherwise(() => ({})),
        remove: [...new Set([...(value.remove ?? []), ...blocked])].map((name) => ({ name })),
      }))
      .otherwise(() => ({ remove: blocked.map((name) => ({ name })) })),
  });
}
