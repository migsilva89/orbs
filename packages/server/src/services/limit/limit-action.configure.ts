import { match } from 'ts-pattern';
import { LIMIT } from './limit.constants';
import { limitSettingsMerge, limitWindowsCreate } from './limit.utils';
import type { LimitRuntimeDeps } from '../../types/limit.types';
import type { LimitConfigureInput } from '@repo/contracts/universal';

export async function limitActionConfigure(deps: LimitRuntimeDeps, params: LimitConfigureInput) {
  const previous = deps.state.configure;
  const current = previous.then(limitConfigureApply);
  const settled = current.then(() => undefined, () => undefined);
  deps.state.configure = settled;

  try {
    return await current;
  } finally {
    match(deps.state.configure === settled)
      .with(true, () => {
        deps.state.configure = Promise.resolve();
      })
      .with(false, () => undefined)
      .exhaustive();
  }

  async function limitConfigureApply() {
    const next = limitSettingsMerge(deps.state.settings, params);

    await deps.settings.actions.set({
      records: [{
        key: LIMIT.setting,
        value: JSON.stringify(next),
      }],
    });

    deps.state.settings = next;
    deps.state.windows = limitWindowsCreate(next);

    return next;
  }
}
