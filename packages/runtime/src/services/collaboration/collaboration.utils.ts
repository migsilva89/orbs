import { AssistantEntry } from '@earendil-works/pi-durable';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeBot } from '../runtime/runtime.constants';
import type { Context } from '@earendil-works/chord/context';
import type { EntryId, ToolExecutionApi, Tx } from '@earendil-works/pi-durable';

export async function collaborationBotId(api: ToolExecutionApi, context: Context) {
  const identity = await api.snapshot(runtimeBot, api.conversationId, context);

  return match(identity?.botId)
    .with(P.string, (id) => id)
    .otherwise(() => {
      throw new Errors.FORBIDDEN();
    });
}

export async function collaborationAnswer(tx: Tx, answerId: EntryId) {
  const entry = await tx.entry(AssistantEntry, answerId);

  return (entry?.model ?? []).flatMap((message) => match(message)
    .with({ role: 'assistant' }, ({ content }) => content.flatMap((part) => match(part)
      .with({ type: 'text' }, ({ text }) => [text])
      .otherwise(() => [])))
    .otherwise(() => [])).join('\n');
}
