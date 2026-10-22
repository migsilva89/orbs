import { match, P } from 'ts-pattern';
import { secretBrokerActionVarlock } from './secret-broker-action.varlock';
import type { SecretBrokerServiceDeps, SecretPrepareParams } from '../../types/secret-broker.types';

/** Gives one bash command its secrets the way the owner chose: placeholders through a proxy, or real values. */
export async function secretBrokerActionPrepare(deps: SecretBrokerServiceDeps, { execution }: SecretPrepareParams) {
  const [rules, { mode }] = await Promise.all([
    deps.source.queries.rules(),
    deps.source.queries.settings(),
  ]);

  if (rules.length === 0) {
    return;
  }

  const realValues = async () => {
    const values = await Promise.all(rules.map(async ({ name }) => [name, await deps.source.queries.value({ name })] as const));

    return Object.fromEntries(values.filter(([, value]) => value !== null));
  };

  await match({ mode, varlock: deps.varlock })
    .with({ mode: 'env' }, async () => {
      Object.assign(execution.env, await realValues());
    })
    .with({ mode: 'varlock', varlock: P.string }, async ({ varlock }) => {
      Object.assign(execution.env, await realValues());
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
