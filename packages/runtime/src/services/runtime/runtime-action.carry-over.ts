import { match, P } from 'ts-pattern';
import { runtimeCarry } from '../../types/runtime.types';
import type { RuntimeCarryOverDeps, RuntimeCarryOverParams } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

/**
 * Finish a history clear: recreate the saved routines and artifacts in the fresh store with their IDs, then drop the
 * carry file. Creation skips IDs that already exist, so a crash here simply reruns on the next configuration.
 */
export async function runtimeActionCarryOver(deps: RuntimeCarryOverDeps, { conversationId }: RuntimeCarryOverParams, context: Context) {
  const saved = await deps.storage.readCarry({ botId: deps.botId });

  await match(saved)
    .with(P.nonNullable, async (value) => {
      const carry = runtimeCarry.parse(value);

      await Promise.all(carry.routines.map((routine) => deps.routines.actions.create({
        ...routine,
        botId: deps.botId,
        conversationId,
      }, context)));
      await Promise.all(carry.artifacts.map((artifact) => deps.artifacts.actions.create({
        ...artifact,
        botId: deps.botId,
        conversationId,
      }, context)));
      await deps.storage.removeCarry({ botId: deps.botId });
    })
    .otherwise(() => undefined);
}
