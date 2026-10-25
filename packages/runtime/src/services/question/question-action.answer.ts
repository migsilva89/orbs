import { match, P } from 'ts-pattern';
import { questionDocument } from './question.constants';
import { questionAnswerValidate, questionCopy } from './question.utils';
import type { QuestionAnswerParams, QuestionContextParams, QuestionServiceDeps } from '../../types/question.types';
import type { TaskId } from '@earendil-works/pi-durable';

export async function questionActionAnswer(
  { harness }: QuestionServiceDeps,
  { context, ...params }: QuestionAnswerParams & QuestionContextParams,
) {
  // SAFETY: question IDs are the task IDs of bot_question tool calls; the task kind and conversation are matched below.
  const taskId = params.id as TaskId;

  return harness.commit(async (tx) => {
    const task = await tx.task(taskId);

    return match(task)
      .with({
        kind: 'pi.tool',
        conversationId: params.conversationId,
        abortRequested: false,
        state: { status: P.union('pending', 'running', 'waiting', 'sleeping') },
      }, async () => {
        const doc = await tx.doc(questionDocument, taskId);
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
