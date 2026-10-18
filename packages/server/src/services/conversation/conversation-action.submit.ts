import { match, P } from 'ts-pattern';
import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSubmitInput } from '@openbots/contracts/universal';

export async function conversationActionSubmit(
  { runtime, bots, skill }: ConversationServiceDeps,
  { content, skills, ...params }: ConversationSubmitInput,
) {
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

      const submission = await runtime.actions.submit({
        ...params,
        content: expanded.content,
      });

      return { submissionId: submission.id };
    });
}
