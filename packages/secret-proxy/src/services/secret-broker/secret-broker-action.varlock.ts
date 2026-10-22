import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SECRET_BROKER } from './secret-broker.constants';
import { secretBrokerQuote } from './secret-broker.utils';
import type { SecretBrokerServiceDeps, SecretVarlockParams } from '../../types/secret-broker.types';

/** Runs the command under `varlock proxy run`: Varlock gets the real values, the command only its placeholders. */
export async function secretBrokerActionVarlock({ folder }: SecretBrokerServiceDeps, { execution, rules, varlock }: SecretVarlockParams) {
  const directory = join(folder, SECRET_BROKER.varlockFolder);
  const items = rules.map(({ name, hosts }) => `# @sensitive\n# @proxy(domain=[${hosts.map((host) => JSON.stringify(host)).join(', ')}])\n${name}=`);

  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(join(directory, SECRET_BROKER.varlockSchema), `# ---\n${items.join('\n')}\n`, { mode: 0o600 });

  execution.command = `${secretBrokerQuote(varlock)} proxy run --path ${secretBrokerQuote(directory)} -- /bin/sh -c ${secretBrokerQuote(execution.command)}`;
}
