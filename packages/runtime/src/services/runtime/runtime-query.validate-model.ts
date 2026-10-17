import { getSupportedThinkingLevels } from '@earendil-works/pi-ai/models';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import type { RuntimeModelParams, RuntimeModelsDeps } from '../../types/runtime.types';

export function runtimeQueryValidateModel({ models }: RuntimeModelsDeps, params: RuntimeModelParams) {
  const model = match(models.getModel(params.modelProvider, params.modelId))
    .with(P.nonNullable, (value) => value)
    .otherwise(() => {
      throw new Errors.VALIDATION_ERROR({ fields: { modelId: { message: 'validation_model_unknown' } } });
    });

  match(getSupportedThinkingLevels(model).includes(params.thinkingLevel))
    .with(false, () => {
      throw new Errors.VALIDATION_ERROR({
        fields: { thinkingLevel: { message: 'validation_thinking_level_unsupported' } },
      });
    })
    .otherwise(() => undefined);
}
