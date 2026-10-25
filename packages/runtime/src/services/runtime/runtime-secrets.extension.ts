import { defineExtension, hook, section, ToolTask } from '@earendil-works/pi-durable';
import * as m from '@repo/i18n/messages';
import type { RuntimeSecretsParams } from '../../types/runtime.types';

export function runtimeSecretsExtension({ secrets }: RuntimeSecretsParams) {
  return defineExtension({
    name: 'bots.secrets',
    sections: [section('secrets', async () => {
      const rules = await secrets.queries.rules();

      return rules.length === 0 ? undefined : [m.ui_secret_prompt(), ...rules.map(({ name, hosts }) => `$${name}: ${hosts.join(', ')}`)].join('\n');
    })],
    hooks: [hook(ToolTask, {
      afterTool: async (_call, result) => (result.output ? {
        ...result,
        output: await Promise.all(result.output.map(async (part) => (part.type === 'text' ? { ...part, text: await secrets.queries.redact({ text: part.text }) } : part))),
      } : result),
    })],
  });
}
