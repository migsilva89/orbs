import { match, P } from 'ts-pattern';
import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationUpdateSubmissionInput } from '@repo/contracts/universal';

export async function conversationActionUpdateSubmission(
  { runtime, bots, skill, attachments }: ConversationServiceDeps,
  params: ConversationUpdateSubmissionInput,
) {
  const bot = await bots.queries.get({ botId: params.botId });

  const content = await match(params.content)
    .with(P.string, (text) => match(params.skills ?? [])
      .with([], () => text)
      .otherwise((names) => skill.queries.expand({
        bot,
        names,
        content: text,
      }).then((expanded) => expanded.content)))
    .otherwise(() => undefined);

  const files = await match(params.attachmentIds)
    .with(P.array(), (attachmentIds) => attachments.actions.prepare({ ...params, attachmentIds }))
    .otherwise(() => undefined);

  await runtime.actions.updateSubmission({
    botId: params.botId,
    conversationId: params.conversationId,
    submissionId: params.submissionId,
    replyToEntryId: params.replyToEntryId,
    content,
    attachments: files,
    whenBusy: params.whenBusy,
  });
}
