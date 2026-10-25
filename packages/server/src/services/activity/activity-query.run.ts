import type { ActivityServiceDeps } from '../../types/activity.types';
import type { ActivityRunGetInput } from '@repo/contracts/universal';

export async function activityQueryRun({ bots, runtime }: ActivityServiceDeps, params: ActivityRunGetInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.queries.activityRun(params);
}
