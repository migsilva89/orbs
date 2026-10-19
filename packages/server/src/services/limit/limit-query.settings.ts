import { limitSettings } from '@openbots/contracts/universal';
import { LIMIT } from './limit.constants';
import { limitStoredSettings } from './limit.utils';
import type { LimitServiceDeps } from '../../types/limit.types';

export async function limitQuerySettings({ settings }: LimitServiceDeps) {
  const stored = await settings.queries.get({ keys: [LIMIT.setting] });
  const record = stored.find(({ key }) => key === LIMIT.setting);

  return limitSettings.parse(limitStoredSettings(record?.value));
}
