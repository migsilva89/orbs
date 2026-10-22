import { defineExtension, hook, ToolTask } from '@earendil-works/pi-durable';
import type { RuntimeSecretsParams } from '../../types/runtime.types';

/** Replaces stored secret values in every tool result before the model or the transcript sees it. */
export function runtimeSecretsExtension({ secrets }: RuntimeSecretsParams) {
  return defineExtension({
    name: 'openbots.secrets',
    hooks: [hook(ToolTask, {
      afterTool: async (_call, result) => (result.output ? {
        ...result,
        output: await Promise.all(result.output.map(async (part) => (part.type === 'text' ? { ...part, text: await secrets.queries.redact({ text: part.text }) } : part))),
      } : result),
    })],
  });
}
