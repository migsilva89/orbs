import { match, P } from 'ts-pattern';
import { secretBrokerActionVarlock } from './secret-broker-action.varlock';
import type { SecretBrokerPrepareParams, SecretBrokerServiceDeps } from '../../types/secret-broker.types';

export async function secretBrokerActionPrepare(deps: SecretBrokerServiceDeps, { execution }: SecretBrokerPrepareParams) {
  const [rules, { mode }] = await Promise.all([
    deps.source.queries.rules(),
    deps.source.queries.settings(),
  ]);

  if (rules.length === 0) {
    return;
  }

  const secretBrokerRealValues = async () => {
    const values = await Promise.all(rules.map(async ({ name }) => [name, await deps.source.queries.value({ name })] as const));

    return Object.fromEntries(values.filter(([, value]) => value !== null));
  };

  await match({ mode, varlock: deps.varlock })
    .with({ mode: 'env' }, async () => {
      Object.assign(execution.env, await secretBrokerRealValues());
    })
    .with({ mode: 'varlock', varlock: P.string }, async ({ varlock }) => {
      Object.assign(execution.env, await secretBrokerRealValues());
      await secretBrokerActionVarlock(deps, {
        execution,
        rules,
        varlock,
      });
    })
    .otherwise(async () => {
      await deps.proxy.actions.start();
      Object.assign(execution.env, await deps.proxy.queries.env());
    });
}
