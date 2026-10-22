import { createStoreAdapter } from '@json-render/core/store-utils';
import { artifactSaveState } from '@repo/contracts/universal';
import { hashKey } from '@tanstack/react-query';
import type { ArtifactsStoreParams } from '../../types/artifacts.types';
import type { StateStore } from '@json-render/core';

/** The artifact's interactive state as a json-render store: edits apply at once and save to the daemon in order. */
export function artifactsStore({ rpc, queryClient, botId, conversationId, artifactId, onError }: ArtifactsStoreParams): StateStore {
  const queryKey = rpc.artifacts.get.queryKey({ input: { botId, conversationId, artifactId } });
  const empty = {};
  let saving = Promise.resolve();

  async function artifactsSave(state: ReturnType<typeof artifactSaveState.shape.state.parse>) {
    const current = queryClient.getQueryData(queryKey);

    if (!current) {
      return;
    }

    try {
      const saved = await rpc.artifacts.saveState.call({
        botId,
        conversationId,
        artifactId,
        version: current.version,
        state,
      });

      queryClient.setQueryData(queryKey, saved);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rpc.artifacts.list.key({ input: { botId, conversationId } }) }),
        queryClient.invalidateQueries({ queryKey: rpc.artifacts.listBot.key({ input: { botId } }) }),
      ]);
    } catch {
      onError();
      await queryClient.invalidateQueries({ queryKey });
    }
  }

  return createStoreAdapter({
    getSnapshot: () => queryClient.getQueryData(queryKey)?.spec.state ?? empty,
    setSnapshot: (snapshot) => {
      const state = artifactSaveState.shape.state.parse(snapshot);

      queryClient.setQueryData(queryKey, (artifact) => artifact && { ...artifact, spec: { ...artifact.spec, state } });
      saving = saving.then(() => artifactsSave(state));
    },
    subscribe: (listener) => queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryHash === hashKey(queryKey)) {
        listener();
      }
    }),
  });
}
