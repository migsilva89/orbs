import { match, P } from 'ts-pattern';
import { questionDocument } from './question.constants';
import { questionAnswerValidate, questionCopy } from './question.utils';
import type { QuestionAnswerParams, QuestionServiceDeps } from '../../types/question.types';
import type { Context } from '@earendil-works/chord/context';
import type { TaskId } from '@earendil-works/pi-durable';

export async function questionActionAnswer(
  { harness }: QuestionServiceDeps,
  params: QuestionAnswerParams,
  context: Context,
) {
  return harness.commit(async (tx) => {
    const task = await tx.task(params.id as TaskId);

    return match(task)
      .with({
        kind: 'pi.tool',
        conversationId: params.conversationId,
        abortRequested: false,
        state: { status: P.union('pending', 'running', 'waiting', 'sleeping') },
      }, async () => {
        const doc = await tx.doc(questionDocument, params.id as TaskId);
        const now = Date.now();

        return match(doc.question)
          .with(P.nullish, () => ({ isAccepted: false }))
          .with({ conversationId: params.conversationId, status: 'pending' }, (pending) => {
            const question = questionCopy(pending);
            questionAnswerValidate(question, params.answer);
            const isAccepted = question.expiresAt > now;

            doc.question = match(isAccepted)
              .with(true, () => questionCopy({
                ...question,
                status: 'answered',
                answer: params.answer,
                answeredAt: now,
                answeredBy: params.answeredBy,
              }))
              .with(false, () => questionCopy({
                ...question,
                status: 'expired',
                answeredAt: now,
              }))
              .exhaustive();

            return { isAccepted };
          })
          .otherwise(() => ({ isAccepted: false }));
      })
      .otherwise(() => ({ isAccepted: false }));
  }, context);
}
