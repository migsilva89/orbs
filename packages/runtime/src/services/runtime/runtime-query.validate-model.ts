import { getSupportedThinkingLevels } from '@earendil-works/pi-ai/models';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import type { RuntimeModelParams, RuntimeModelsDeps } from '../../types/runtime.types';

export function runtimeQueryValidateModel(deps: RuntimeModelsDeps, params: RuntimeModelParams) {
  function runtimeValidateModel(selection: RuntimeModelParams, field?: string) {
    const model = match(deps.models.getModel(selection.modelProvider, selection.modelId))
      .with(P.nonNullable, (value) => value)
      .otherwise(() => {
        throw new Errors.VALIDATION_ERROR({ fields: { [field ?? 'modelId']: { message: 'validation_model_unknown' } } });
      });

    match(getSupportedThinkingLevels(model).includes(selection.thinkingLevel))
      .with(false, () => {
        throw new Errors.VALIDATION_ERROR({
          fields: { [field ?? 'thinkingLevel']: { message: 'validation_thinking_level_unsupported' } },
        });
      })
      .otherwise(() => undefined);
  }

  runtimeValidateModel(params);

  match(params.fallbackModel)
    .with(P.nonNullable, (fallback) => runtimeValidateModel(fallback, 'fallbackModel'))
    .otherwise(() => undefined);
}
