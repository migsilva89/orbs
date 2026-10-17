import { getSupportedThinkingLevels } from '@earendil-works/pi-ai/models';
import type { RuntimeModelsDeps } from '../../types/runtime.types';

export function runtimeQueryModels({ models }: RuntimeModelsDeps) {
  return models.getModels().map((model) => ({
    provider: model.provider,
    id: model.id,
    name: model.name,
    thinkingLevels: getSupportedThinkingLevels(model),
  }));
}
