import { replicatedState } from '@earendil-works/chord';
import { LiveDoc } from '@earendil-works/pi-durable';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeConversationParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ConversationState } from '@openbots/contracts/universal';

export async function runtimeQueryWatch(deps: RuntimeServiceDeps, params: RuntimeConversationParams, context: Context) {
  const conversation = await runtimeQueryConversation(deps, params, context);

  const live = match(await deps.harness.watchDoc(LiveDoc, conversation.id, context))
    .with(P.nonNullable, (watch) => watch)
    .otherwise(() => {
      throw new Errors.INTERNAL_ERROR({ internal: 'Conversation live state is missing.' });
    });

  const state = replicatedState<ConversationState>({
    conversationId: conversation.id,
    latestEntryId: 0,
    live: structuredClone(live.value ?? {}),
  });

  // Subscribe before reading the tail; entries committed during attachment must not be missed.
  const unsubscribe = deps.harness.subscribeCommits((publication, commitContext) => {
    const latestEntryId = publication.changes.reduce((latest, change) => match(change)
      .with({ type: 'entry', value: { conversationId: conversation.id } }, ({ value }) => Math.max(latest, value.id))
      .otherwise(() => latest), state.value.latestEntryId);

    state.change(commitContext, (draft) => {
      draft.latestEntryId = latestEntryId;
    });
  });

  void live.closed.then(unsubscribe);

  try {
    const page = await conversation.entries({}, 1, undefined, context);
    state.change(context, (draft) => {
      draft.latestEntryId = Math.max(draft.latestEntryId, page.items[0]?.id ?? 0);
    });
    live.start(async (value) => {
      state.change(context, (draft) => {
        draft.live = value ?? {};
      });
    });

    return { state, closed: live.closed, stop: () => live.stop() };
  } catch (error) {
    unsubscribe();
    await live.stop();
    throw error;
  }
}
