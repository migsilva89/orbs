import type { ActivityServiceDeps } from '../../types/activity.types';
import type { ActivityListInput } from '@repo/contracts/universal';

export async function activityQueryList({ bots, runtime }: ActivityServiceDeps, params: ActivityListInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.queries.activity(params);
}
