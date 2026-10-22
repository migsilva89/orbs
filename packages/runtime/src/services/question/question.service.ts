import { questionActionAnswer } from './question-action.answer';
import { questionQueryPending } from './question-query.pending';
import type { QuestionAnswerParams, QuestionPendingParams, QuestionServiceDeps } from '../../types/question.types';
import type { Context } from '@earendil-works/chord/context';

export function makeQuestionService(deps: QuestionServiceDeps) {
  return {
    actions: {
      answer: (params: QuestionAnswerParams, context: Context) => questionActionAnswer(deps, params, context),
    },
    queries: {
      pending: (params: QuestionPendingParams, context: Context) => questionQueryPending(deps, params, context),
    },
  };
}

export type QuestionService = ReturnType<typeof makeQuestionService>;
