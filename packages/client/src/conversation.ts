import { applyImmutable } from '@earendil-works/chord/delta';
import { ORPCError } from '@orpc/client';
import { match } from 'ts-pattern';
import type { Client } from './types/client.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

export async function readConversation(
  client: Client,
  params: UniversalTypes.ConversationTarget,
  signal: AbortSignal,
): Promise<UniversalTypes.ConversationView> {
  for await (const view of watchConversation(client, params, signal)) {
    return view;
  }

  throw new ORPCError('BAD_GATEWAY');
}

export async function* watchConversation(client: Client, params: UniversalTypes.ConversationTarget, signal: AbortSignal) {
  const frames = await client.conversation.watch(params, { signal });
  let state: UniversalTypes.ConversationState | undefined;
  let view: UniversalTypes.ConversationView | undefined;

  for await (const ops of frames) {
    state = applyImmutable<UniversalTypes.ConversationState>(state, ops);
    const frame = state;
    view = await match(view)
      .with({ conversationId: frame.conversationId }, (current) => conversationCatchUp(client, params, current, frame, signal))
      .otherwise(async () => {
        const page: UniversalTypes.ConversationHistoryPage = await match(frame.latestEntryId)
          .with(0, () => ({ items: [], next: undefined }))
          .otherwise(() => client.conversation.history({
            ...params,
            limit: 50,
            throughEntryId: frame.latestEntryId,
          }, { signal }));

        return { ...frame, entries: [...page.items].reverse(), historyCursor: page.next };
      });

    yield view;
  }
}

async function conversationCatchUp(
  client: Client,
  params: UniversalTypes.ConversationTarget,
  view: UniversalTypes.ConversationView,
  frame: UniversalTypes.ConversationState,
  signal: AbortSignal,
): Promise<UniversalTypes.ConversationView> {
  return match(view.latestEntryId >= frame.latestEntryId)
    .with(true, () => ({ ...view, ...frame }))
    .with(false, async () => {
      const page = await client.conversation.history({
        ...params,
        afterEntryId: view.latestEntryId,
        throughEntryId: frame.latestEntryId,
        limit: 100,
      }, { signal });

      return conversationCatchUp(client, params, {
        ...view,
        entries: [...view.entries, ...page.items],
        latestEntryId: page.items.at(-1)?.id ?? frame.latestEntryId,
      }, frame, signal);
    })
    .exhaustive();
}
