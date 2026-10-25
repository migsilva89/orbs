import { match, P } from 'ts-pattern';
import { questionDocument } from './question.constants';
import { questionPendingView } from './question.utils';
import type * as QuestionTypes from '../../types/question.types';

export async function questionQueryPending(
  { harness }: QuestionTypes.QuestionServiceDeps,
  { context, ...params }: QuestionTypes.QuestionPendingParams & QuestionTypes.QuestionContextParams,
): Promise<QuestionTypes.QuestionPending[]> {
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
