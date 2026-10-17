import { match, P } from 'ts-pattern';
import { toolActionJudge } from './tool-action.judge';
import { toolQuerySettings } from './tool-query.settings';
import type { ToolAuthorizeParams, ToolServiceDeps } from '../../types/tool.types';
import type { RuntimeToolDecision } from '@openbots/runtime/server';

export async function toolActionAuthorize(deps: ToolServiceDeps, call: ToolAuthorizeParams): Promise<RuntimeToolDecision> {
  call.context.abortSignal?.throwIfAborted();

  const bot = await deps.database.db.selectFrom('bot')
    .select(['permission', 'instructions'])
    .where('id', '=', call.botId)
    .executeTakeFirst();

  return match({
    bot,
    isReadOnly: call.isReadOnly,
    approved: call.approved,
  })
    .with({ bot: P.nullish }, () => 'deny' as const)
    .with({ isReadOnly: true }, () => 'allow' as const)
    .with({ bot: { permission: 'full' } }, () => 'allow' as const)
    .with({ bot: { permission: 'read-only' } }, () => 'deny' as const)
    .with({ approved: true }, () => 'allow' as const)
    .with({ bot: { permission: 'auto' } }, async ({ bot: current }) => {
      const settings = await toolQuerySettings(deps);

      const isAllowed = await toolActionJudge(deps, {
        ...call,
        instructions: current.instructions,
        approvalRules: settings.approvalRules,
      });

      const [latest, latestSettings] = await Promise.all([
        deps.database.db.selectFrom('bot').select(['permission', 'instructions'])
          .where('id', '=', call.botId).executeTakeFirst(),
        toolQuerySettings(deps),
      ]);

      const hasCurrentRules = JSON.stringify(settings.approvalRules) === JSON.stringify(latestSettings.approvalRules);

      call.context.abortSignal?.throwIfAborted();

      return match({ bot: latest, canApprove: isAllowed && hasCurrentRules && latestSettings.isJevConfigured })
        .with({ bot: P.nullish }, () => 'deny' as const)
        .with({ bot: { permission: 'read-only' } }, () => 'deny' as const)
        .with({ bot: { permission: 'full' } }, () => 'allow' as const)
        .with({ bot: { permission: 'auto', instructions: current.instructions }, canApprove: true }, () => 'allow' as const)
        .otherwise(() => 'ask' as const);
    })
    .otherwise(() => 'ask' as const);
}
