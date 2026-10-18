import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeQuestionAnswer, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeActionAnswerQuestion(deps: RuntimeServiceDeps, params: RuntimeQuestionAnswer, context: Context) {
  const conversation = await runtimeQueryConversation(deps, params, context);

  return deps.questions.actions.answer({
    conversationId: conversation.id,
    id: params.id,
    answer: params.answer,
    answeredBy: params.answeredBy,
  }, context);
}
