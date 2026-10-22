import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeAttachments } from './runtime-attachment.constants';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeAttachmentsQueryParams } from '../../types/attachment.types';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeQueryAttachments(
  deps: RuntimeServiceDeps,
  params: RuntimeAttachmentsQueryParams,
  context: Context,
) {
  const conversation = await runtimeQueryConversation(deps, params, context);

  const files = Object.values((await deps.harness.snapshot(runtimeAttachments, conversation.id, context))?.files ?? {})
    .sort((left, right) => right.createdAt - left.createdAt || right.id.localeCompare(left.id));

  const start = match(params.before)
    .with(P.string, (before) => match(files.findIndex((file) => file.id === before))
      .with(-1, () => {
        throw new Errors.NOT_FOUND({ resource: 'attachment', resourceId: before });
      })
      .otherwise((index) => index + 1))
    .otherwise(() => 0);

  const limit = params.limit ?? 50;
  const items = files.slice(start, start + limit);

  return {
    items,
    next: match(start + items.length < files.length)
      .with(true, () => items.at(-1)?.id)
      .with(false, () => undefined)
      .exhaustive(),
  };
}
