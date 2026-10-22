import { awaitWithContext } from '@earendil-works/chord/context';
import { secretRule } from '@openbots/contracts/universal';
import * as m from '@openbots/i18n/messages';
import { match, P } from 'ts-pattern';
import { QUESTION, questionDocument } from './question.constants';
import { questionCopy } from './question.utils';
import type { QuestionAskParams, QuestionDetails, QuestionRecord } from '../../types/question.types';
import type { Context } from '@earendil-works/chord/context';
import type { ToolExecutionApi, ToolExecutionResult } from '@earendil-works/pi-durable';

export async function questionActionAsk(
  params: QuestionAskParams,
  api: ToolExecutionApi<QuestionDetails>,
  context: Context,
): Promise<ToolExecutionResult<QuestionDetails>> {
  const secret = params.secret ? secretRule.safeParse(params.secret) : null;

  if (secret?.success === false) {
    return { isError: true, output: [{ type: 'text', text: m.ui_tool_bot_question_secret_invalid() }] };
  }

  const question = await api.commit(async (tx) => {
    const doc = await tx.doc(questionDocument, api.taskId);

    const stored = doc.question ?? {
      id: api.taskId,
      conversationId: api.conversationId,
      text: params.text,
      choices: secret ? [] : [...(params.choices ?? [])],
      isMultiSelect: secret ? false : params.isMultiSelect ?? false,
      secret: secret?.data ?? null,
      createdAt: Date.now(),
      expiresAt: Date.now() + QUESTION.timeoutMs,
      status: 'pending' as const,
      answer: null,
      answeredAt: null,
      answeredBy: null,
    };

    doc.question = stored;

    return questionCopy(stored);
  }, context);

  await api.details({
    text: question.text,
    choices: [...question.choices],
    isMultiSelect: question.isMultiSelect,
    secret: question.secret,
    expiresAt: question.expiresAt,
  }, context);

  return match(question.status)
    .with('answered', () => questionReply(question))
    .with('expired', () => questionExpired())
    .with('pending', () => questionWait(question, api, context))
    .exhaustive();
}

async function questionWait(
  question: QuestionRecord,
  api: ToolExecutionApi<QuestionDetails>,
  context: Context,
): Promise<ToolExecutionResult<QuestionDetails>> {
  const watch = await api.watchDoc(questionDocument, api.taskId, context);
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const changed = new Promise<undefined>((resolve) => {
      timer = setTimeout(() => resolve(undefined), Math.max(0, question.expiresAt - Date.now()));
      watch?.start(async (value) => {
        match(value?.question?.status)
          .with('pending', () => undefined)
          .otherwise(() => resolve(undefined));
      });
    });

    await match(watch?.value?.question?.status)
      .with('pending', () => awaitWithContext(changed, context))
      .otherwise(() => undefined);

    return await api.commit(async (tx) => {
      const doc = await tx.doc(questionDocument, api.taskId);

      return match(doc.question)
        .with(P.nullish, () => questionExpired())
        .with({ status: 'pending' }, (pending) => {
          doc.question = questionCopy({
            ...pending,
            status: 'expired',
            answeredAt: Date.now(),
          });
          return questionExpired();
        })
        .with({ status: 'answered' }, (answered) => questionReply(answered))
        .otherwise(() => questionExpired());
    }, context);
  } finally {
    clearTimeout(timer);
    await watch?.stop();
  }
}

function questionReply({ answer, secret }: QuestionRecord): ToolExecutionResult<QuestionDetails> {
  const text = match(answer)
    .with({ kind: 'text' }, ({ text: value }) => value)
    .with({ kind: 'secret' }, () => m.ui_tool_bot_question_secret_saved({ name: secret?.name ?? '', hosts: secret?.hosts.join(', ') ?? '' }))
    .with({ kind: 'choices' }, ({ choices }) => m.ui_tool_bot_question_choices({ choices: choices.join(', ') }))
    .with(P.union({ kind: 'skip' }, null), () => m.ui_tool_bot_question_skipped())
    .exhaustive();

  return { output: [{ type: 'text', text }] };
}

function questionExpired(): ToolExecutionResult<QuestionDetails> {
  return {
    isError: true,
    output: [{ type: 'text', text: m.ui_tool_bot_question_expired() }],
  };
}
