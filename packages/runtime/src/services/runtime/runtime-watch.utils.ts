import { GenerationTask } from '@earendil-works/pi-durable';
import { REACTION } from '@openbots/contracts/universal';
import { match, P } from 'ts-pattern';
import { runtimeRun } from './runtime-run.utils';
import type { Draft } from '@earendil-works/chord';
import type { CommitChange, ConversationId } from '@earendil-works/pi-durable';
import type { ConversationState } from '@openbots/contracts/universal';

export function runtimeWatchChanges(state: Draft<ConversationState>, changes: readonly CommitChange[]) {
  const conversationId = state.conversationId as ConversationId;

  for (const change of changes) {
    match(change)
      .with({ type: 'entry', value: { conversationId } }, ({ value }) => {
        state.latestEntryId = Math.max(state.latestEntryId, value.id);
      })
      .with({ type: 'task', value: { conversationId, kind: GenerationTask.definition.name } }, ({ value }) => {
        match(value.id >= (state.lastRun?.taskId ?? 0))
          .with(true, () => {
            state.lastRun = runtimeRun(value);
          })
          .with(false, () => undefined)
          .exhaustive();
      })
      .with({ type: 'task', value: { conversationId, kind: 'pi.tool', abortRequested: true } }, () => {
        state.interactionsRevision += 1;
      })
      .with({ type: 'task', value: { conversationId, kind: 'pi.tool', state: { status: 'terminal' } } }, () => {
        state.interactionsRevision += 1;
      })
      .with({
        type: 'document',
        conversationId,
        record: { kind: P.union(REACTION.docKind, 'openbots.question') },
      }, () => {
        state.interactionsRevision += 1;
      })
      .otherwise(() => undefined);
  }
}
