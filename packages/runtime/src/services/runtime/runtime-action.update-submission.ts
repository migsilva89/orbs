import { InboxDoc } from '@earendil-works/pi-durable';
import { REPLY } from '@repo/contracts/universal';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeActionInterrupt } from './runtime-action.interrupt';
import { RUNTIME_ATTACHMENT_ENTRY } from './runtime-attachment.constants';
import { runtimeMessageData, runtimeMessageInput } from './runtime-message.utils';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeQueryQuote } from './runtime-query.quote';
import type { RuntimeQueuedInput } from '../../types/runtime-queue.types';
import type { RuntimeContextInput, RuntimeServiceDeps, RuntimeUpdateSubmissionParams } from '../../types/runtime.types';
import type { ConversationId, SubmissionId } from '@earendil-works/pi-durable';
import type { ReplyQuote } from '@repo/contracts/universal';

export async function runtimeActionUpdateSubmission(
  deps: RuntimeServiceDeps,
  params: RuntimeUpdateSubmissionParams & RuntimeContextInput,
) {
  const { context } = params;

  async function runtimeSubmissionInterrupt(conversationId: ConversationId, submissionId: SubmissionId) {
    const inbox = await deps.harness.snapshot(InboxDoc, conversationId, context);

    const queued = match(inbox?.items.find((item) => item.id === submissionId))
      .with({ mode: P.union('followUp', 'steer') }, (item) => ({ content: item.content, entry: item.entry }))
      .with(P.nullish, () => {
        throw new Errors.NOT_FOUND({ resource: 'submission', resourceId: submissionId });
      })
      .otherwise(() => {
        throw new Errors.CONFLICT();
      });

    await match(await deps.harness.abortSubmission(submissionId, context, conversationId))
      .with('aborted', () => runtimeActionInterrupt(deps, {
        requestId: `send-now-${submissionId}`,
        ...queued,
        conversationId,
        context,
      }))
      .with('not_found', () => {
        throw new Errors.NOT_FOUND({ resource: 'submission', resourceId: submissionId });
      })
      .otherwise(() => {
        throw new Errors.CONFLICT();
      });
  }

  function runtimeMessagePatch(
    queued: RuntimeQueuedInput,
    conversationId: number,
    replyTo?: ReplyQuote,
  ) {
    match(params.whenBusy)
      .with(P.union('followUp', 'steer'), (mode) => {
        queued.mode = mode;
      })
      .otherwise(() => undefined);

    match(params.content !== undefined || params.attachments !== undefined || params.replyToEntryId !== undefined || params.skills !== undefined)
      .with(false, () => undefined)
      .with(true, () => {
        const existing = runtimeMessageData(queued.entry);

        const content = match(params.content)
          .with(P.string, (text) => text)
          .otherwise(() => existing?.content ?? match(queued.content)
            .with(P.string, (text) => text)
            .otherwise(() => ''));

        const attachments = match(params.attachments)
          .with(P.nonNullable, (files) => files)
          .otherwise(() => existing?.attachments ?? []);

        match(content.trim() === '' && attachments.length === 0 && !params.skills)
          .with(true, () => {
            throw new Errors.VALIDATION_ERROR({ fields: { content: { message: 'validation_required', args: { field: 'content' } } } });
          })
          .with(false, () => undefined)
          .exhaustive();

        const quote = match(params.replyToEntryId)
          .with(undefined, () => existing?.replyTo)
          .otherwise(() => replyTo);

        const input = runtimeMessageInput(conversationId, content, {
          attachments,
          replyTo: quote,
          skills: params.skills,
        });

        match(input)
          .with(P.nonNullable, (value) => {
            queued.content = value.content;
            queued.entry = value.entry;
          })
          .otherwise(() => {
            queued.content = content;
            delete queued.entry;
          });
      })
      .exhaustive();
  }

  const conversation = await runtimeQueryConversation(deps, params);
  // SAFETY: a submission ID is only a lookup key; both paths reject IDs missing from this conversation's inbox.
  const submissionId = params.submissionId as SubmissionId;

  if (params.whenBusy === 'interrupt') {
    return runtimeSubmissionInterrupt(conversation.id, submissionId);
  }

  const replyTo = await runtimeQueryQuote(deps, {
    conversationId: conversation.id,
    entryId: params.replyToEntryId,
    context,
  });

  await conversation.commit(async (tx) => {
    const inbox = await tx.doc(InboxDoc, conversation.id);
    const item = inbox.items.find((queued) => queued.id === submissionId);

    match(item)
      .with(P.nullish, () => {
        throw new Errors.NOT_FOUND({ resource: 'submission', resourceId: submissionId });
      })
      .with({ mode: 'write' }, () => {
        throw new Errors.CONFLICT();
      })
      .with({ entry: { kind: P.union(RUNTIME_ATTACHMENT_ENTRY, REPLY.entryKind) } }, (queued) => {
        runtimeMessagePatch(queued, conversation.id, replyTo);
      })
      .with({ entry: P.nonNullable }, () => {
        throw new Errors.CONFLICT();
      })
      .with({ mode: P.union('followUp', 'steer') }, (queued) => {
        runtimeMessagePatch(queued, conversation.id, replyTo);
      })
      .exhaustive();
  }, context);
}
