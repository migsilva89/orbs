import { secretMode } from '@openbots/contracts/universal';
import { SECRET } from './secret.constants';
import type { SecretServiceDeps } from '../../types/secret.types';

export async function secretQuerySettings({ settings }: SecretServiceDeps) {
  const stored = await settings.queries.get({ keys: [SECRET.modeSetting] });

  return { mode: secretMode.catch(SECRET.defaultMode).parse(stored.find(({ key }) => key === SECRET.modeSetting)?.value) };
}
