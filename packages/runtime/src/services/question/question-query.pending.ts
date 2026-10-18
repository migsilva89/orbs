import { match, P } from 'ts-pattern';
import { questionDocument } from './question.constants';
import { questionPendingView } from './question.utils';
import type { QuestionPending, QuestionPendingParams, QuestionServiceDeps } from '../../types/question.types';
import type { Context } from '@earendil-works/chord/context';

export async function questionQueryPending(
  { harness }: QuestionServiceDeps,
  params: QuestionPendingParams,
  context: Context,
): Promise<QuestionPending[]> {
  const graph = await harness.taskGraph(context);

  try {
    const tasks = Object.values(graph.value.tasks).filter((task) => (
      task.kind === 'pi.tool'
      && task.conversationId === params.conversationId
      && !task.abortRequested
    ));

    const documents = await Promise.all(
      tasks.map((task) => harness.snapshot(questionDocument, task.id, context)),
    );

    return documents.flatMap((document) => (
      match(document?.question)
        .with(P.nullish, () => [])
        .with({
          conversationId: params.conversationId,
          status: 'pending',
          expiresAt: P.number.gt(Date.now()),
        }, (question) => [questionPendingView(question)])
        .otherwise(() => [])
    ));
  } finally {
    graph.dispose();
  }
}
