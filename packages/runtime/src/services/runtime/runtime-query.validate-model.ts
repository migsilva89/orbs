import { getSupportedThinkingLevels } from '@earendil-works/pi-ai/models';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import type { RuntimeModelParams, RuntimeModelsDeps } from '../../types/runtime.types';

export function runtimeQueryValidateModel(deps: RuntimeModelsDeps, params: RuntimeModelParams) {
  runtimeValidateModel(deps, params);

  match(params.fallbackModel)
    .with(P.nonNullable, (fallback) => runtimeValidateModel(deps, fallback, 'fallbackModel'))
    .otherwise(() => undefined);
}

function runtimeValidateModel({ models }: RuntimeModelsDeps, params: RuntimeModelParams, field?: string) {
  const model = match(models.getModel(params.modelProvider, params.modelId))
    .with(P.nonNullable, (value) => value)
    .otherwise(() => {
      throw new Errors.VALIDATION_ERROR({ fields: { [field ?? 'modelId']: { message: 'validation_model_unknown' } } });
    });

  match(getSupportedThinkingLevels(model).includes(params.thinkingLevel))
    .with(false, () => {
      throw new Errors.VALIDATION_ERROR({
        fields: { [field ?? 'thinkingLevel']: { message: 'validation_thinking_level_unsupported' } },
      });
    })
    .otherwise(() => undefined);
}
