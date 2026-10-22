import { SECRET_BROKER } from './secret-broker.constants';
import type { SecretBrokerServiceDeps, SecretRedactParams } from '../../types/secret-broker.types';

/** Replaces any stored secret value in tool output with its placeholder, whatever the mode. */
export async function secretBrokerQueryRedact({ source, proxy }: SecretBrokerServiceDeps, { text }: SecretRedactParams) {
  const rules = await source.queries.rules();
  const values = await Promise.all(rules.map(async ({ name }) => ({ name, value: await source.queries.value({ name }) })));

  return values.reduce((result, { name, value }) => (
    value && value.length >= SECRET_BROKER.redactMinLength ? result.replaceAll(value, proxy.queries.placeholder({ name })) : result
  ), text);
}
