import { getSupportedThinkingLevels } from '@earendil-works/pi-ai/models';
import type { RuntimeModelsDeps } from '../../types/runtime.types';

export async function runtimeQueryModels({ models }: RuntimeModelsDeps) {
  const availableModels = await models.getAvailable();

  return availableModels.map((model) => ({
    provider: model.provider,
    id: model.id,
    name: model.name,
    thinkingLevels: getSupportedThinkingLevels(model),
  }));
}
