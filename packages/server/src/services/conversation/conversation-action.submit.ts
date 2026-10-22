import { match, P } from 'ts-pattern';
import { conversationQuerySettings } from './conversation-query.settings';
import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSubmitInput } from '@repo/contracts/universal';

export async function conversationActionSubmit(
  deps: ConversationServiceDeps,
  { content, skills, attachmentIds, ...params }: ConversationSubmitInput,
) {
  const { runtime, bots, skill, attachments } = deps;

  await bots.queries.get({ botId: params.botId });
  const existing = await runtime.queries.submission(params);

  return match(existing)
    .with(P.nonNullable, (submissionId) => ({ submissionId }))
    .otherwise(async () => {
      const bot = await bots.actions.configure({ botId: params.botId });

      const expanded = await match(skills ?? [])
        .with([], () => ({ content }))
        .otherwise((names) => skill.queries.expand({
          bot,
          names,
          content,
        }));

      const files = await attachments.actions.prepare({ ...params, attachmentIds });
      const preferences = await bots.queries.preferences();

      const submission = await runtime.actions.submit({
        ...params,
        whenBusy: params.whenBusy ?? preferences.get(params.botId)?.whenBusy ?? (await conversationQuerySettings(deps)).whenBusy,
        content: expanded.content,
        attachments: files,
      });

      return { submissionId: submission.id };
    });
}
