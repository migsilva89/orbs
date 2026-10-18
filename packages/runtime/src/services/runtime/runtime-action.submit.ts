import { ConversationBusy } from '@earendil-works/pi-durable';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeActionInterrupt } from './runtime-action.interrupt';
import { runtimeMessageInput } from './runtime-message.utils';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeQueryQuote } from './runtime-query.quote';
import type { RuntimeServiceDeps, RuntimeSubmitParams } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { Conversation, InputSubmissionDraft } from '@earendil-works/pi-durable';

export async function runtimeActionSubmit(
  deps: RuntimeServiceDeps,
  { botId, conversationId, attachments, replyToEntryId, ...params }: RuntimeSubmitParams,
  context: Context,
) {
  const conversation = await runtimeQueryConversation(deps, { botId, conversationId }, context);
  const replyTo = await runtimeQueryQuote(deps, conversation.id, replyToEntryId, context);
  const input = runtimeMessageInput(conversation.id, params.content, attachments, replyTo);

  return match(params)
    .with({ whenBusy: 'interrupt' }, (draft) => runtimeActionInterrupt(deps, conversation.id, { ...draft, ...input }, context))
    .otherwise((draft) => runtimeActionSubmitInput(conversation, {
      ...draft,
      type: 'input',
      ...input,
    }, context));
}

async function runtimeActionSubmitInput(conversation: Conversation, params: InputSubmissionDraft, context: Context) {
  try {
    return await conversation.submit(params, context);
  } catch (error) {
    throw match(error)
      .with(P.instanceOf(ConversationBusy), (cause) => new Errors.CONFLICT({ cause }))
      .otherwise((cause) => cause);
  }
}
