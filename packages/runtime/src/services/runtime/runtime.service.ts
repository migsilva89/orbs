import { BACKGROUND_CONTEXT } from '@earendil-works/chord/context';
import { createRegistry, Harness } from '@earendil-works/pi-durable';
import { runtimeActionSubmit } from './runtime-action.submit';
import type { RuntimeHistoryParams, RuntimeServiceParams, RuntimeSubmitParams } from '../../types/runtime.types';

export async function makeRuntimeService({ storage, models, agent }: RuntimeServiceParams) {
  const harness = await Harness.open(storage, { models, registry: createRegistry() }, BACKGROUND_CONTEXT);

  try {
    const conversation = await harness.root(BACKGROUND_CONTEXT, { agent });

    harness.resume();

    return {
      id: conversation.id,
      actions: {
        submit: (params: RuntimeSubmitParams, context = BACKGROUND_CONTEXT) => runtimeActionSubmit({ conversation }, params, context),
        stop: (context = BACKGROUND_CONTEXT) => conversation.abort(context),
      },
      queries: {
        history: ({ limit = 50, cursor }: RuntimeHistoryParams = {}, context = BACKGROUND_CONTEXT) => (
          conversation.entries({}, limit, cursor, context)
        ),
      },
      watch: (context = BACKGROUND_CONTEXT) => conversation.watch(context),
      closed: harness.closed,
      close: () => harness.close(BACKGROUND_CONTEXT),
    };
  } catch (error) {
    await harness.close(BACKGROUND_CONTEXT);
    throw error;
  }
}

export type RuntimeService = Awaited<ReturnType<typeof makeRuntimeService>>;
