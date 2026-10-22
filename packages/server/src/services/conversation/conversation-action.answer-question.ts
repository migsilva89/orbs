import { match, P } from 'ts-pattern';
import type { ConversationAnswerQuestionParams, ConversationServiceDeps } from '../../types/conversation.types';

export async function conversationActionAnswerQuestion(
  { runtime, bots, secrets }: ConversationServiceDeps,
  { answer, ...params }: ConversationAnswerQuestionParams,
) {
  await bots.queries.get({ botId: params.botId });

  return match(answer)
    .with({ kind: 'secret' }, async ({ value }) => {
      const questions = await runtime.queries.questions(params);

      return match(questions.find((question) => question.id === params.id)?.secret)
        .with(P.nonNullable, async (rule) => {
          await secrets.actions.save({ ...rule, value });

          return runtime.actions.answerQuestion({ ...params, answer: { kind: 'secret' } });
        })
        .otherwise(() => ({ isAccepted: false }));
    })
    .otherwise((stored) => runtime.actions.answerQuestion({ ...params, answer: stored }));
}
