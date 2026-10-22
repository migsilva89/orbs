import { SECRET } from './secret.constants';
import type { SecretServiceDeps, SecretValueParams } from '../../types/secret.types';

export function secretQueryValue({ credentials }: SecretServiceDeps, { name }: SecretValueParams) {
  return credentials.queries.get({ key: `${SECRET.credentialPrefix}${name}` });
}
