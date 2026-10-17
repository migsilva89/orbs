import { ConversationBusy } from '@earendil-works/pi-durable';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import type { RuntimeSubmitDeps, RuntimeSubmitParams } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeActionSubmit({ conversation }: RuntimeSubmitDeps, params: RuntimeSubmitParams, context: Context) {
  try {
    return await conversation.submit({ ...params, type: 'input' }, context);
  } catch (error) {
    throw match(error)
      .with(P.instanceOf(ConversationBusy), (cause) => new Errors.CONFLICT({ cause }))
      .otherwise((cause) => cause);
  }
}
