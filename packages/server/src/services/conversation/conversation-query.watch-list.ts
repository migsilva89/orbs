import { replicatedState } from '@earendil-works/chord';
import { BACKGROUND_CONTEXT, withAbortSignal } from '@earendil-works/chord/context';
import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { conversationWatchStream } from './conversation-watch.utils';
import { conversationListItems, conversationSummaries } from './conversation.utils';
import type { ConversationListWatchParams, ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationListState } from '@repo/contracts/universal';

export async function conversationQueryWatchList(
  { auth, runtime, bots, sidebarSections }: ConversationServiceDeps,
  { deviceId, authorization, signal }: ConversationListWatchParams,
) {
  const revoked = new AbortController();
  const lifetime = AbortSignal.any([revoked.signal, signal ?? revoked.signal]);
  const context = withAbortSignal(lifetime, BACKGROUND_CONTEXT);

  const unsubscribe = auth.onRevoke((id) => match(id)
    .with(deviceId, () => revoked.abort(new Errors.UNAUTHORIZED()))
    .otherwise(() => undefined));

  try {
    await auth.queries.authenticate({ authorization });
    const watch = await runtime.watchConversations(context);
    const state = replicatedState({ conversations: watch.state.value.conversations, revision: 0 });

    const unwatch = watch.state.subscribe((value) => {
      state.change(context, (draft) => {
        draft.conversations = value.conversations;
      });
    });

    const conversationNotify = () => {
      state.change(context, (draft) => {
        draft.revision += 1;
      });
    };

    const unsubscribeBots = bots.onChange(conversationNotify);
    const unsubscribeSections = sidebarSections.onChange(conversationNotify);

    const closed = watch.closed.then((end) => {
      unwatch();
      unsubscribeBots();
      unsubscribeSections();
      unsubscribe();

      return end;
    });

    return conversationWatchStream({
      state,
      closed,
      stop: watch.stop,
    }, lifetime, async (value) => {
      const [botList, preferences, sections] = await Promise.all([
        bots.queries.list(),
        bots.queries.preferences(),
        sidebarSections.queries.list(),
      ]);

      return {
        conversations: conversationListItems(botList, conversationSummaries(value.conversations, preferences)),
        sections,
      } satisfies ConversationListState;
    });
  } catch (error) {
    revoked.abort(error);
    unsubscribe();
    throw error;
  }
}
