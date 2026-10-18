import { replicatedState } from '@earendil-works/chord';
import { match } from 'ts-pattern';
import { runtimeContextWatchBusyIds, runtimeContextWatchIsRelevant } from './runtime-context-watch.utils';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeConversationParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeQueryWatchContexts(
  deps: RuntimeServiceDeps,
  params: RuntimeConversationParams,
  context: Context,
) {
  const conversation = await runtimeQueryConversation(deps, params, context);
  const state = replicatedState({ revision: 0 });

  // Subscribe before graph acquisition so membership commits during attach are not missed.
  const unsubscribe = deps.harness.subscribeCommits((publication, commitContext) => {
    match(runtimeContextWatchIsRelevant(publication.changes, conversation.id))
      .with(true, () => {
        state.change(commitContext, (draft) => {
          draft.revision += 1;
        });
      })
      .with(false, () => undefined)
      .exhaustive();
  });

  try {
    const graph = await deps.harness.watchTaskGraph(context);
    let busy = runtimeContextWatchBusyIds(graph.value);

    graph.start(async (value, _ops, commitContext) => {
      const next = runtimeContextWatchBusyIds(value);

      match(next === busy)
        .with(true, () => undefined)
        .with(false, () => {
          busy = next;
          state.change(commitContext, (draft) => {
            draft.revision += 1;
          });
        })
        .exhaustive();
    });

    void graph.closed.then(unsubscribe);

    return { state, closed: graph.closed, stop: () => graph.stop() };
  } catch (error) {
    unsubscribe();
    throw error;
  }
}
