import { match, P } from 'ts-pattern';
import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationUpdateSubmissionInput } from '@repo/contracts/universal';

export async function conversationActionUpdateSubmission(
  { runtime, bots, skill, attachments }: ConversationServiceDeps,
  params: ConversationUpdateSubmissionInput,
) {
  const bot = await bots.queries.get({ botId: params.botId });

  const skills = await match(params.skills ?? [])
    .with([], () => undefined)
    .otherwise(async (names) => ({ names, prompt: (await skill.queries.expand({ bot, names })).prompt }));

  const files = await match(params.attachmentIds)
    .with(P.array(), (attachmentIds) => attachments.actions.prepare({ ...params, attachmentIds }))
    .otherwise(() => undefined);

  await runtime.actions.updateSubmission({
    botId: params.botId,
    conversationId: params.conversationId,
    submissionId: params.submissionId,
    replyToEntryId: params.replyToEntryId,
    content: params.content,
    skills,
    attachments: files,
    whenBusy: params.whenBusy,
  });
}
