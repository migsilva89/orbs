import { ConversationBusy } from '@earendil-works/pi-durable';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeActionInterrupt } from './runtime-action.interrupt';
import { runtimeMessageInput } from './runtime-message.utils';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeQueryQuote } from './runtime-query.quote';
import type { RuntimeContextInput, RuntimeServiceDeps, RuntimeSubmitParams } from '../../types/runtime.types';
import type { Conversation, InputSubmissionDraft } from '@earendil-works/pi-durable';

export async function runtimeActionSubmit(
  deps: RuntimeServiceDeps,
  { botId, conversationId, attachments, replyToEntryId, context, ...params }: RuntimeSubmitParams & RuntimeContextInput,
) {
  async function runtimeActionSubmitInput(conversation: Conversation, draft: InputSubmissionDraft) {
    try {
      return await conversation.submit(draft, context);
    } catch (error) {
      throw match(error)
        .with(P.instanceOf(ConversationBusy), (cause) => new Errors.CONFLICT({ cause }))
        .otherwise((cause) => cause);
    }
  }

  const conversation = await runtimeQueryConversation(deps, {
    botId,
    conversationId,
    context,
  });

  const replyTo = await runtimeQueryQuote(deps, {
    conversationId: conversation.id,
    entryId: replyToEntryId,
    context,
  });

  const input = runtimeMessageInput(conversation.id, params.content, attachments, replyTo);

  return match(params)
    .with({ whenBusy: 'interrupt' }, (draft) => runtimeActionInterrupt(deps, {
      ...draft,
      ...input,
      conversationId: conversation.id,
      context,
    }))
    .otherwise((draft) => runtimeActionSubmitInput(conversation, {
      ...draft,
      type: 'input',
      ...input,
    }));
}
