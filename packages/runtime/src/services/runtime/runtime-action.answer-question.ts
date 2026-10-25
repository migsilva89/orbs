import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeQuestionAnswer, RuntimeServiceDeps } from '../../types/runtime.types';

export async function runtimeActionAnswerQuestion(deps: RuntimeServiceDeps, params: RuntimeQuestionAnswer & RuntimeContextInput) {
  const { context } = params;
  const conversation = await runtimeQueryConversation(deps, params);

  return deps.questions.actions.answer({
    conversationId: conversation.id,
    id: params.id,
    answer: params.answer,
    answeredBy: params.answeredBy,
  }, context);
}
